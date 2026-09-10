/* ---------------------------------------------------------------------------
   MTW Nursing Handover — proof of concept.

   All state lives in this browser only (localStorage). There is no backend and
   no network request: the page is static, so nothing typed here leaves the
   device. Entries are per-browser and are not shared between users — a real
   deployment would need a server for that.

   Audit trail: every committed change snapshots the whole patient row, with a
   timestamp and the selected user. Text fields commit on blur (so a snapshot
   is one edit, not one keystroke); controls commit on change.
   --------------------------------------------------------------------------- */

(function () {
  'use strict';

  const CFG = window.HV_CONFIG;
  const PATIENTS = window.HV_PATIENTS;

  /* Column labels used in the audit trail and snapshot view. */
  const FIELD_LABELS = {
    edd: 'Estimated date of discharge',
    diagnosis: 'Diagnosis & Past Medical History',
    nursing: 'Additional Nursing Information',
    nutrition: 'Nutrition',
    fluidRestriction: 'Nutrition — fluid restrictions',
    therapy: 'Therapy Plans',
    discharge: 'Discharge Plans',
    risk: 'Risk Assessments',
    tasks: 'Tasks',
  };

  const RISK_LABELS = {
    infectious: 'Infectious status',
    falls: 'Risk of falls',
    must: 'MUST completed',
    mrsaTaken: 'MRSA swab taken',
    mrsaDue: 'MRSA swab due',
  };

  /* --- Utilities ---------------------------------------------------------- */

  const $ = (sel, root = document) => root.querySelector(sel);

  const uid = () =>
    crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random().toString(16).slice(2);

  const clone = (v) => JSON.parse(JSON.stringify(v));

  /** Today as YYYY-MM-DD in local time — ward days are local days, not UTC. */
  function today() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function nowStamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /** '2026-09-14' -> '14 Sep 2026' */
  function fmtDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
  }

  function fmtDateTime(iso) {
    if (!iso) return '';
    const [date, time = ''] = iso.split('T');
    return `${fmtDate(date)}${time ? ', ' + time.slice(0, 5) : ''}`;
  }

  function ageFrom(dobIso) {
    const dob = new Date(dobIso);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  }

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k in node) node[k] = v;
      else node.setAttribute(k, v);
    }
    for (const c of [].concat(children)) if (c) node.appendChild(c);
    return node;
  }

  /* --- Store -------------------------------------------------------------- */

  const store = {
    data: { notes: {}, risk: {}, edd: {}, tasks: {}, audit: {}, user: CFG.users[0] },

    load() {
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(CFG.storageKey) || 'null');
      } catch (_) {
        /* Corrupt or unavailable storage — fall back to seed data. */
      }
      if (saved && saved.notes) this.data = saved;
      else { this.seed(); this.save(); }
      return this.data;
    },

    seed() {
      const d = { notes: {}, risk: {}, edd: {}, tasks: {}, audit: {}, user: CFG.users[0] };

      for (const p of PATIENTS) {
        const s = p.seed || {};
        d.notes[p.id] = {
          diagnosis: s.diagnosis || '',
          nursing: s.nursing || '',
          nutrition: s.nutrition || '',
          therapy: s.therapy || '',
          discharge: s.discharge || '',
          fluidRestriction: s.fluidRestriction || '',
        };
        d.risk[p.id] = Object.assign(
          { infectious: '', falls: '', must: '', mrsaTaken: '', mrsaDue: '' },
          s.risk || {}
        );
        d.edd[p.id] = p.edd || '';
        d.tasks[p.id] = [
          ...(p.seedTasks || []).map((t) => ({
            id: uid(), text: t.text, due: t.due, status: t.status, done: false, completedAt: null, completedBy: null,
          })),
          ...(p.seedHistory || []).map((t) => ({
            id: uid(), text: t.text, due: t.due, status: 'Complete', done: true,
            completedAt: t.completedAt, completedBy: t.by || null,
          })),
        ];
      }

      /* Reconstruct the seeded audit trail. Entries are listed newest first and
         each carries the value its change replaced, so walking forward and
         accumulating those overrides yields the row as it stood at each point. */
      this.data = d;
      for (const p of PATIENTS) {
        const current = this.snapshot(p.id);
        const entries = [];
        let overlay = {};
        for (const e of p.seedAudit || []) {
          entries.push({
            id: uid(), at: e.at, by: e.by, change: e.change,
            snapshot: applyOverrides(current, overlay),
          });
          overlay = Object.assign({}, overlay, e.was || {});
        }
        d.audit[p.id] = entries;
      }
    },

    save() {
      try {
        localStorage.setItem(CFG.storageKey, JSON.stringify(this.data));
        flashSaved();
      } catch (_) {
        /* Storage blocked (private window, site data disabled). The tool stays
           usable for the session; entries simply will not persist. */
      }
    },

    notes(id) {
      if (!this.data.notes[id]) this.data.notes[id] = {};
      return this.data.notes[id];
    },

    risk(id) {
      if (!this.data.risk[id]) {
        this.data.risk[id] = { infectious: '', falls: '', must: '', mrsaTaken: '', mrsaDue: '' };
      }
      return this.data.risk[id];
    },

    tasks(id) {
      if (!this.data.tasks[id]) this.data.tasks[id] = [];
      return this.data.tasks[id];
    },

    audit(id) {
      if (!this.data.audit[id]) this.data.audit[id] = [];
      return this.data.audit[id];
    },

    /** A complete picture of one patient row, as stored in the audit trail. */
    snapshot(id) {
      const n = this.notes(id);
      return {
        edd: this.data.edd[id] || '',
        diagnosis: n.diagnosis || '',
        nursing: n.nursing || '',
        nutrition: n.nutrition || '',
        fluidRestriction: n.fluidRestriction || '',
        therapy: n.therapy || '',
        discharge: n.discharge || '',
        risk: clone(this.risk(id)),
        tasks: this.tasks(id).map((t) => ({
          text: t.text, due: t.due, status: t.status, done: t.done, completedAt: t.completedAt,
        })),
      };
    },
  };

  function applyOverrides(snap, overlay) {
    const out = clone(snap);
    for (const [k, v] of Object.entries(overlay)) {
      out[k] = k === 'risk' ? Object.assign(clone(out.risk), v) : v;
    }
    return out;
  }

  /* --- Audit -------------------------------------------------------------- */

  /** Commit a snapshot of the whole row, unless nothing actually changed. */
  function commitAudit(pid, changeLabel) {
    const snap = store.snapshot(pid);
    const hist = store.audit(pid);
    if (hist.length && JSON.stringify(hist[0].snapshot) === JSON.stringify(snap)) return;

    hist.unshift({
      id: uid(),
      at: nowStamp(),
      by: store.data.user,
      change: changeLabel,
      snapshot: snap,
    });
    if (hist.length > CFG.auditLimit) hist.length = CFG.auditLimit;
    store.save();

    const badge = $(`#rows tr[data-pid="${pid}"] [data-role="handover"] .btn__badge`);
    if (badge) badge.textContent = hist.length;
  }

  let savedTimer = null;
  function flashSaved() {
    const flag = $('#savedFlag');
    if (!flag) return;
    flag.hidden = false;
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => { flag.hidden = true; }, 1400);
  }

  let saveTimer = null;
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.save(), 500);
  }

  /* --- Reusable controls -------------------------------------------------- */

  /** Grow a textarea to fit its content, so no clinical detail is hidden. */
  function autosize(ta) {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  function autosizeAll(root = document) {
    for (const ta of root.querySelectorAll('textarea.ta')) autosize(ta);
  }

  function textarea(pid, field, placeholder, extraClass) {
    return el('textarea', {
      class: 'ta' + (extraClass ? ' ' + extraClass : ''),
      placeholder,
      value: store.notes(pid)[field] || '',
      dataset: { role: 'note', pid, field },
      spellcheck: true,
    });
  }

  /**
   * Yes / No segmented control.
   * `positive` inverts the colour semantics: for "MUST completed", yes is the
   * reassuring answer, whereas for "risk of falls" yes is the alerting one.
   */
  function yesNo(pid, role, field, value, positive) {
    const wrap = el('div', { class: 'yn' + (positive ? ' yn--positive' : '') });
    for (const v of ['yes', 'no']) {
      const label = el('label', { class: `yn__opt yn__opt--${v}` });
      label.appendChild(el('input', {
        type: 'radio',
        name: `${role}-${field}-${pid}`,
        value: v,
        checked: value === v,
        dataset: { role, pid, field },
      }));
      label.appendChild(el('span', { text: v === 'yes' ? 'Yes' : 'No' }));
      wrap.appendChild(label);
    }
    return wrap;
  }

  function dateInput(pid, role, field, value, label) {
    return el('input', {
      type: 'date', class: 'dt', value: value || '',
      dataset: { role, pid, field },
      'aria-label': label,
    });
  }

  /* --- Cells -------------------------------------------------------------- */

  function patientCell(p) {
    const td = el('td');
    const hasAlert = p.dnacpr || (p.alerts || []).length || p.allergies;
    const box = el('div', { class: 'pt' + (hasAlert ? ' pt--alert' : '') });

    box.appendChild(el('span', { class: 'pt__bed', text: p.bed }));
    box.appendChild(el('div', { class: 'pt__name', text: p.name }));

    const ids = el('dl', { class: 'pt__ids' });
    const pair = (k, v) => {
      ids.appendChild(el('dt', { text: k }));
      ids.appendChild(el('dd', { text: v }));
    };
    pair('DOB', `${fmtDate(p.dob)} (${ageFrom(p.dob)}y)`);
    pair('NHS', p.nhsNumber);
    pair('Hosp', p.hospitalNumber);
    box.appendChild(ids);

    const flags = el('div', { class: 'pt__flags' });
    flags.appendChild(
      p.allergies
        ? el('span', { class: 'flag flag--alert', text: `Allergy: ${p.allergies}`, title: 'Recorded allergy' })
        : el('span', { class: 'flag flag--ok', text: 'No known allergies' })
    );
    flags.appendChild(
      p.dnacpr
        ? el('span', { class: 'flag flag--dnacpr', text: 'DNACPR', title: 'DNACPR decision in place' })
        : el('span', { class: 'flag flag--info', text: 'For CPR' })
    );
    for (const a of p.alerts || []) {
      const safeguarding = /safeguard/i.test(a);
      flags.appendChild(el('span', {
        class: `flag ${safeguarding ? 'flag--safeg' : 'flag--alert'}`, text: a,
      }));
    }
    box.appendChild(flags);

    const edd = el('div', { class: 'pt__edd' });
    edd.appendChild(el('label', { text: 'EDD', htmlFor: `edd-${p.id}` }));
    edd.appendChild(el('input', {
      type: 'date', class: 'dt', id: `edd-${p.id}`,
      value: store.data.edd[p.id] || '',
      dataset: { role: 'edd', pid: p.id },
      title: 'Estimated date of discharge',
    }));
    box.appendChild(edd);

    const btns = el('div', { class: 'pt__btns' });

    const handoverBtn = el('button', {
      type: 'button', class: 'btn btn--ghost',
      dataset: { role: 'handover', pid: p.id },
      title: 'Audit trail of every change to this patient row',
    }, [
      el('span', { text: 'Handover History' }),
      el('span', { class: 'btn__badge', text: String(store.audit(p.id).length) }),
    ]);
    btns.appendChild(handoverBtn);

    const doneCount = store.tasks(p.id).filter((t) => t.done).length;
    btns.appendChild(el('button', {
      type: 'button', class: 'btn btn--ghost',
      dataset: { role: 'taskhist', pid: p.id },
      title: 'Tasks completed for this patient',
    }, [
      el('span', { text: 'Task History' }),
      el('span', { class: 'btn__badge', text: String(doneCount) }),
    ]));

    box.appendChild(btns);
    td.appendChild(box);
    return td;
  }

  function noteCell(p, field, placeholder) {
    return el('td', {}, textarea(p.id, field, placeholder));
  }

  function nutritionCell(p) {
    const td = el('td');
    const notes = store.notes(p.id);
    const on = notes.fluidRestriction === 'yes';

    const fluid = el('div', { class: 'nut__fluid' + (on ? ' nut__fluid--on' : '') });
    fluid.appendChild(el('span', {
      class: 'nut__q', text: 'Is the patient currently on fluid restrictions?',
    }));
    fluid.appendChild(yesNo(p.id, 'fluid', 'fluidRestriction', notes.fluidRestriction, false));
    td.appendChild(fluid);

    td.appendChild(textarea(p.id, 'nutrition', 'Diet, assistance, supplements, SALT input…'));
    return td;
  }

  function riskCell(p) {
    const td = el('td');
    const r = store.risk(p.id);
    const box = el('div', { class: 'ra' });

    const row = (label, control, overdue) => {
      const div = el('div', { class: 'ra__row' + (overdue ? ' ra__row--overdue' : '') });
      div.appendChild(el('span', { class: 'ra__label', text: label }));
      div.appendChild(control);
      return div;
    };

    box.appendChild(row(RISK_LABELS.infectious, el('textarea', {
      class: 'ta',
      placeholder: 'e.g. nil known, MRSA, C. diff, precautions in place…',
      value: r.infectious || '',
      dataset: { role: 'risk', pid: p.id, field: 'infectious' },
      spellcheck: true,
    })));

    box.appendChild(row(RISK_LABELS.falls, yesNo(p.id, 'riskyn', 'falls', r.falls, false)));
    box.appendChild(row(RISK_LABELS.must, yesNo(p.id, 'riskyn', 'must', r.must, true)));

    box.appendChild(row(
      RISK_LABELS.mrsaTaken,
      dateInput(p.id, 'riskdate', 'mrsaTaken', r.mrsaTaken, 'MRSA swab taken')
    ));

    const overdue = r.mrsaDue && r.mrsaDue < today();
    const dueRow = row(
      RISK_LABELS.mrsaDue + (overdue ? ' — overdue' : ''),
      dateInput(p.id, 'riskdate', 'mrsaDue', r.mrsaDue, 'MRSA swab due'),
      overdue
    );
    box.appendChild(dueRow);

    td.appendChild(box);
    return td;
  }

  function tasksCell(p) {
    const td = el('td');
    const box = el('div', { class: 'tk' });

    const active = store.tasks(p.id)
      .filter((t) => !t.done)
      .sort((a, b) => (a.due || '9999-99-99').localeCompare(b.due || '9999-99-99'));

    if (!active.length) {
      box.appendChild(el('div', { class: 'tk__empty', text: 'No outstanding tasks' }));
    } else {
      const list = el('ul', { class: 'tk__list' });
      const t0 = today();

      for (const t of active) {
        const overdue = t.due && t.due < t0;
        const isToday = t.due === t0;
        const li = el('li', {
          class: `tk__item${overdue ? ' tk__item--overdue' : isToday ? ' tk__item--today' : ''}`,
        });

        li.appendChild(el('input', {
          type: 'checkbox', class: 'tk__check',
          dataset: { role: 'tick', pid: p.id, tid: t.id },
          title: 'Mark complete',
          'aria-label': `Mark complete: ${t.text}`,
        }));
        li.appendChild(el('span', { class: 'tk__text', text: t.text }));

        const meta = el('div', { class: 'tk__meta' });
        meta.appendChild(el('span', {
          class: `tk__due${overdue ? ' tk__due--overdue' : isToday ? ' tk__due--today' : ''}`,
          text: t.due
            ? (overdue ? `Overdue — ${fmtDate(t.due)}` : isToday ? 'Due today' : `Due ${fmtDate(t.due)}`)
            : 'No due date',
        }));

        const sel = el('select', {
          class: 'tk__status',
          dataset: { role: 'status', pid: p.id, tid: t.id },
          'aria-label': 'Task status',
        });
        for (const s of CFG.taskStatuses) {
          sel.appendChild(el('option', { value: s, text: s, selected: s === t.status }));
        }
        meta.appendChild(sel);

        li.appendChild(meta);
        list.appendChild(li);
      }
      box.appendChild(list);
    }

    const add = el('form', { class: 'tk__add', dataset: { role: 'addTask', pid: p.id } });
    add.appendChild(el('input', {
      type: 'text', placeholder: 'Add a task…', required: true, maxLength: 200,
      dataset: { role: 'newText' }, 'aria-label': 'New task description',
    }));
    const addRow = el('div', { class: 'tk__addRow' });
    addRow.appendChild(el('input', {
      type: 'date', class: 'dt', value: today(),
      dataset: { role: 'newDue' }, 'aria-label': 'Due date',
    }));
    addRow.appendChild(el('button', { type: 'submit', class: 'btn btn--primary btn--sm', text: 'Add' }));
    add.appendChild(addRow);
    box.appendChild(add);

    td.appendChild(box);
    return td;
  }

  /* --- Render ------------------------------------------------------------- */

  const CELL_INDEX = { patient: 0, diagnosis: 1, nursing: 2, tasks: 3, nutrition: 4, risk: 5, therapy: 6, discharge: 7 };

  function render() {
    const tbody = $('#rows');
    tbody.textContent = '';

    for (const p of PATIENTS) {
      const tr = el('tr', { dataset: { pid: p.id } });
      tr.appendChild(patientCell(p));
      tr.appendChild(noteCell(p, 'diagnosis', 'Presenting diagnosis, treatment, relevant past medical history…'));
      tr.appendChild(noteCell(p, 'nursing', 'Mobility, continence, skin, cognition, communication, family…'));
      tr.appendChild(tasksCell(p));
      tr.appendChild(nutritionCell(p));
      tr.appendChild(riskCell(p));
      tr.appendChild(noteCell(p, 'therapy', 'Physiotherapy, occupational therapy, SALT, dietetics…'));
      tr.appendChild(noteCell(p, 'discharge', 'Destination, referrals, TTOs, transport, family contact…'));
      tbody.appendChild(tr);
    }
    autosizeAll(tbody);
    updateCount();
  }

  function updateCount() {
    const outstanding = PATIENTS.reduce((n, p) => n + store.tasks(p.id).filter((t) => !t.done).length, 0);
    $('#patientCount').textContent =
      `${PATIENTS.length} patients · ${outstanding} task${outstanding === 1 ? '' : 's'} outstanding`;
  }

  /** Replace a single cell in place, so editing elsewhere in the row is not disturbed. */
  function refreshCell(pid, which) {
    const row = $(`#rows tr[data-pid="${pid}"]`);
    if (!row) return render();
    const p = PATIENTS.find((x) => x.id === pid);
    const builders = {
      patient: patientCell, tasks: tasksCell, nutrition: nutritionCell, risk: riskCell,
    };
    const cell = builders[which](p);
    row.children[CELL_INDEX[which]].replaceWith(cell);
    autosizeAll(cell);
  }

  /* --- Events ------------------------------------------------------------- */

  /* Text fields: remember the value on focus so blur can tell whether an
     actual edit happened, and only then commit an audit snapshot. */
  const focusValues = new WeakMap();

  function wire() {
    const rows = $('#rows');

    rows.addEventListener('focusin', (e) => {
      const t = e.target;
      if (t.dataset.role === 'note' || t.dataset.role === 'risk') focusValues.set(t, t.value);
    });

    rows.addEventListener('input', (e) => {
      const t = e.target;
      const { role, pid, field } = t.dataset;
      if (role === 'note') { store.notes(pid)[field] = t.value; autosize(t); saveSoon(); }
      else if (role === 'risk') { store.risk(pid)[field] = t.value; autosize(t); saveSoon(); }
    });

    rows.addEventListener('focusout', (e) => {
      const t = e.target;
      const { role, pid, field } = t.dataset;
      if (role !== 'note' && role !== 'risk') return;
      if (!focusValues.has(t) || focusValues.get(t) === t.value) return;
      focusValues.delete(t);
      commitAudit(pid, role === 'risk' ? FIELD_LABELS.risk : FIELD_LABELS[field]);
    });

    rows.addEventListener('change', (e) => {
      const t = e.target;
      const { role, pid, tid, field } = t.dataset;

      if (role === 'edd') {
        store.data.edd[pid] = t.value;
        commitAudit(pid, FIELD_LABELS.edd);
      } else if (role === 'fluid') {
        store.notes(pid).fluidRestriction = t.value;
        commitAudit(pid, FIELD_LABELS.fluidRestriction);
        refreshCell(pid, 'nutrition');
      } else if (role === 'riskyn') {
        store.risk(pid)[field] = t.value;
        commitAudit(pid, FIELD_LABELS.risk);
      } else if (role === 'riskdate') {
        store.risk(pid)[field] = t.value;
        commitAudit(pid, FIELD_LABELS.risk);
        refreshCell(pid, 'risk');
      } else if (role === 'tick' && t.checked) {
        const task = store.tasks(pid).find((x) => x.id === tid);
        if (task) {
          task.done = true;
          task.status = 'Complete';
          task.completedAt = nowStamp();
          task.completedBy = store.data.user;
          commitAudit(pid, FIELD_LABELS.tasks);
          refreshCell(pid, 'tasks');
          refreshCell(pid, 'patient');
          updateCount();
        }
      } else if (role === 'status') {
        const task = store.tasks(pid).find((x) => x.id === tid);
        if (task) {
          task.status = t.value;
          commitAudit(pid, FIELD_LABELS.tasks);
        }
      }
    });

    rows.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.dataset.role !== 'addTask') return;
      e.preventDefault();

      const pid = form.dataset.pid;
      const textEl = $('[data-role="newText"]', form);
      const text = textEl.value.trim();
      if (!text) return;

      store.tasks(pid).push({
        id: uid(), text, due: $('[data-role="newDue"]', form).value,
        status: 'Outstanding', done: false, completedAt: null, completedBy: null,
      });
      commitAudit(pid, FIELD_LABELS.tasks);
      refreshCell(pid, 'tasks');
      updateCount();

      const next = $(`#rows tr[data-pid="${pid}"] [data-role="newText"]`);
      if (next) next.focus();
    });

    rows.addEventListener('click', (e) => {
      const h = e.target.closest('[data-role="handover"]');
      if (h) return openHandoverHistory(h.dataset.pid);
      const t = e.target.closest('[data-role="taskhist"]');
      if (t) return openTaskHistory(t.dataset.pid);
    });

    /* Ward / shift are presentational in the proof of concept — one ward of
       synthetic patients is loaded regardless of selection. */
    const ward = $('#wardSelect');
    const setWard = () => { $('#wardLabel').textContent = ward.value.replace(/^Ward \d+ — /, ''); };
    ward.addEventListener('change', setWard);
    setWard();

    const user = $('#userSelect');
    for (const u of CFG.users) {
      user.appendChild(el('option', { value: u, text: u, selected: u === store.data.user }));
    }
    user.addEventListener('change', () => {
      store.data.user = user.value;
      store.save();
    });

    $('#btnPrint').addEventListener('click', () => window.print());

    $('#btnReset').addEventListener('click', () => {
      const ok = confirm(
        'Reset all handover entries on this device back to the synthetic demo data?\n\n' +
        'Everything typed here, including the audit trail, will be lost.'
      );
      if (!ok) return;
      store.seed();
      store.save();
      render();
    });

    for (const btn of document.querySelectorAll('[data-close]')) {
      btn.addEventListener('click', () => btn.closest('dialog').close());
    }
  }

  /* --- Handover history (audit trail) ------------------------------------- */

  function snapshotView(snap) {
    const dl = el('dl', { class: 'snap' });
    const add = (label, value) => {
      dl.appendChild(el('dt', { text: label }));
      dl.appendChild(el('dd', { text: value || '' }));
    };

    add('EDD', snap.edd ? fmtDate(snap.edd) : '');
    add(FIELD_LABELS.diagnosis, snap.diagnosis);
    add(FIELD_LABELS.nursing, snap.nursing);
    add('Fluid restrictions', snap.fluidRestriction ? (snap.fluidRestriction === 'yes' ? 'Yes' : 'No') : '');
    add(FIELD_LABELS.nutrition, snap.nutrition);

    const r = snap.risk || {};
    const yn = (v) => (v ? (v === 'yes' ? 'Yes' : 'No') : '—');
    add(FIELD_LABELS.risk,
      `${RISK_LABELS.infectious}: ${r.infectious || '—'}\n` +
      `${RISK_LABELS.falls}: ${yn(r.falls)}\n` +
      `${RISK_LABELS.must}: ${yn(r.must)}\n` +
      `${RISK_LABELS.mrsaTaken}: ${r.mrsaTaken ? fmtDate(r.mrsaTaken) : '—'}\n` +
      `${RISK_LABELS.mrsaDue}: ${r.mrsaDue ? fmtDate(r.mrsaDue) : '—'}`
    );

    add(FIELD_LABELS.therapy, snap.therapy);
    add(FIELD_LABELS.discharge, snap.discharge);

    const open = (snap.tasks || []).filter((t) => !t.done);
    add('Open tasks', open.length
      ? open.map((t) => `• ${t.text}${t.due ? ` (due ${fmtDate(t.due)})` : ''} — ${t.status}`).join('\n')
      : 'None');

    return dl;
  }

  function openHandoverHistory(pid) {
    const p = PATIENTS.find((x) => x.id === pid);
    const hist = store.audit(pid);

    $('#handoverTitle').textContent = `Handover History — ${p.name}`;
    $('#handoverSub').textContent = `${p.bed} · ${hist.length} recorded change${hist.length === 1 ? '' : 's'}`;

    const body = $('#handoverBody');
    body.textContent = '';

    const wrap = el('div', { class: 'hist' });
    wrap.appendChild(el('div', {
      class: 'hist__note',
      text: 'Each entry is a snapshot of the whole patient row taken when a change was saved. Select an entry to see the row as it stood at that time.',
    }));

    if (!hist.length) {
      wrap.appendChild(el('div', { class: 'hist__empty', text: 'No changes recorded for this patient yet.' }));
    } else {
      for (const entry of hist) {
        const card = el('div', { class: 'aud' });
        const bodyEl = el('div', { class: 'aud__body' }, snapshotView(entry.snapshot));
        bodyEl.hidden = true;

        const chev = el('span', { class: 'aud__chev', text: '▸' });
        const head = el('button', { type: 'button', class: 'aud__head' }, [
          chev,
          el('span', { class: 'aud__when', text: fmtDateTime(entry.at) }),
          el('span', { class: 'aud__who', text: entry.by }),
          el('span', { class: 'aud__what', text: entry.change }),
        ]);
        head.addEventListener('click', () => {
          bodyEl.hidden = !bodyEl.hidden;
          chev.textContent = bodyEl.hidden ? '▸' : '▾';
        });

        card.appendChild(head);
        card.appendChild(bodyEl);
        wrap.appendChild(card);
      }
    }

    body.appendChild(wrap);
    $('#handoverModal').showModal();
  }

  /* --- Task history ------------------------------------------------------- */

  function openTaskHistory(pid) {
    const p = PATIENTS.find((x) => x.id === pid);
    const done = store.tasks(pid)
      .filter((t) => t.done)
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

    $('#taskTitle').textContent = `Task History — ${p.name}`;
    $('#taskSub').textContent = `${p.bed} · ${done.length} completed task${done.length === 1 ? '' : 's'}`;

    const body = $('#taskBody');
    body.textContent = '';

    if (!done.length) {
      body.appendChild(el('div', { class: 'hist__empty', text: 'No completed tasks for this patient.' }));
    } else {
      const table = el('table', { class: 'taskHist' });
      const hr = el('tr');
      for (const h of ['Task', 'Was due', 'Completed', 'By', '']) hr.appendChild(el('th', { text: h }));
      table.appendChild(el('thead', {}, hr));

      const tbody = el('tbody');
      for (const t of done) {
        const tr = el('tr');
        tr.appendChild(el('td', { text: t.text }));
        tr.appendChild(el('td', { text: t.due ? fmtDate(t.due) : '—' }));
        tr.appendChild(el('td', { text: fmtDateTime(t.completedAt) || '—' }));
        tr.appendChild(el('td', { text: t.completedBy || '—' }));

        const restore = el('button', {
          type: 'button', class: 'btn btn--sm', text: 'Restore',
          title: 'Return this task to the outstanding list',
        });
        restore.addEventListener('click', () => {
          t.done = false;
          t.status = 'Outstanding';
          t.completedAt = null;
          t.completedBy = null;
          commitAudit(pid, FIELD_LABELS.tasks);
          refreshCell(pid, 'tasks');
          refreshCell(pid, 'patient');
          updateCount();
          openTaskHistory(pid);
        });
        tr.appendChild(el('td', {}, restore));
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      body.appendChild(table);
    }

    $('#taskModal').showModal();
  }

  /* --- Alignment overlay (Shift+A) ---------------------------------------- */

  function wireAlignment() {
    const panel = $('#align');
    const epr = $('#epr');
    const inputs = { left: $('#alLeft'), top: $('#alTop'), right: $('#alRight'), bottom: $('#alBottom') };

    for (const [k, input] of Object.entries(inputs)) {
      input.value = CFG.region[k];
      input.addEventListener('input', () => {
        document.documentElement.style.setProperty(`--region-${k}`, `${input.value}%`);
      });
    }

    $('#alCopy').addEventListener('click', () => {
      const css = Object.entries(inputs)
        .map(([k, i]) => `  --region-${k}: ${i.value}%;`)
        .join('\n');
      navigator.clipboard?.writeText(css);
      $('#alCopy').textContent = 'Copied';
      setTimeout(() => { $('#alCopy').textContent = 'Copy CSS'; }, 1200);
    });

    document.addEventListener('keydown', (e) => {
      if (!e.shiftKey || (e.key !== 'A' && e.key !== 'a')) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      panel.hidden = !panel.hidden;
      epr.classList.toggle('epr--aligning', !panel.hidden);
    });
  }

  /* --- Simulated EPR chrome ----------------------------------------------- */

  /** Redraw the host EPR's tab strip so "Handover" is the selected tab. */
  function renderEprTabs() {
    const strip = $('#eprTabs');
    if (!strip) return;
    strip.textContent = '';
    for (const label of CFG.eprTabs) {
      strip.appendChild(el('div', {
        class: 'eprTab' + (label === CFG.eprSelectedTab ? ' eprTab--selected' : ''),
        text: label,
      }));
    }
  }

  /* --- Fit the board to the EPR work area --------------------------------- */

  /**
   * Scale the tool so its fixed design width fills the work area, and give it
   * the matching unscaled height so it fills the region exactly. Without this
   * the board would render at real pixel sizes inside a frame that scales,
   * showing more or less of itself depending on the window.
   */
  function fitToRegion() {
    const region = $('#region');
    const fit = $('#fit');
    if (!region || !fit) return;

    const designW = parseFloat(getComputedStyle(fit).getPropertyValue('--design-w')) || 1520;
    const scale = region.clientWidth / designW;

    fit.style.setProperty('--fit-scale', scale);
    fit.style.height = region.clientHeight / scale + 'px';

    /* The chrome overlay is drawn in the screenshot's own pixel coordinates,
       so it scales by the ratio of the rendered frame to the image width. */
    const epr = $('#epr');
    const chrome = $('#chrome');
    if (epr && chrome) {
      chrome.style.setProperty('--chrome-scale', epr.clientWidth / 1920);
    }

    autosizeAll(fit);
  }

  /* --- Boot --------------------------------------------------------------- */

  store.load();
  render();
  wire();
  wireAlignment();
  renderEprTabs();
  fitToRegion();

  let fitTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitToRegion, 80);
  });
})();
