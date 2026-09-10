/* ---------------------------------------------------------------------------
   MTW Nursing Handover — proof of concept. OPTION B.

   Five free-text columns plus Patient Details, rather than Option A's eight
   mixed columns. Risk scores, infectious status, MRSA swab dates and diet all
   live inside the Nursing column here; there is no Tasks, Nutrition or Risk
   Assessments column.

   All state lives in this browser only (localStorage). There is no backend and
   no network request: the page is static, so nothing typed here leaves the
   device. Entries are per-browser and are not shared between users — a real
   deployment would need a server for that.

   Audit trail: every committed change snapshots the whole patient row, with a
   timestamp and the selected user. Text fields commit on blur (so a snapshot
   is one edit, not one keystroke); the EDD commits on change.
   --------------------------------------------------------------------------- */

(function () {
  'use strict';

  const CFG = window.HV_CONFIG;
  const PATIENTS = window.HV_PATIENTS;

  /* Structured fields pinned to the bottom of the Nursing column. Kept
     compact: the rows flex, so a label and its control sit on one line where
     there is room and wrap only when there is not. */
  const NURSING_EXTRAS = [
    { field: 'fluidRestrictions', type: 'text', label: 'Fluid restrictions',
      placeholder: 'e.g. 1.5L/24h' },
    { field: 'mrsaLast', type: 'date', label: 'MRSA swab last', group: 'MRSA swabs', mini: 'Last' },
    { field: 'mrsaDueNext', type: 'date', label: 'MRSA swab due next', group: 'MRSA swabs', mini: 'Due next' },
    { field: 'must', type: 'yesno', label: 'MUST complete' },
    { field: 'falls', type: 'yesno', label: 'Falls risk' },
  ];

  /* The five content columns, left to right. This single list drives the
     table header, the row cells and the order of the audit snapshot, so the
     three can never drift apart. */
  const COLUMNS = [
    {
      /* Headers are uppercased in CSS. Text in {braces} keeps the case it is
         written in, so PMHx renders with a lower-case x. */
      field: 'diagnosis',
      label: 'Diagnosis and PMH{x}',
      width: '17%',
      placeholder: 'Presenting diagnosis, treatment to date, past medical history…',
    },
    {
      field: 'nursing',
      label: 'Nursing',
      width: '23%',
      placeholder: 'Mobility, continence, skin, cognition, Waterlow, infectious status, diet…',
      extras: NURSING_EXTRAS,
    },
    {
      field: 'therapies',
      label: 'Therapies',
      width: '15%',
      placeholder: 'Physiotherapy, occupational therapy, SALT, dietetics…',
    },
    {
      field: 'medical',
      label: 'Medical / Surgical',
      width: '24%',
      placeholder: 'Latest doctor plan, ward round outcome, medication changes, results…',
    },
    {
      field: 'discharge',
      label: 'Discharge Planning',
      width: '17%',
      placeholder: 'Destination, what is pending, referrals, TTOs, transport, family…',
    },
  ];

  /** A label with its case markers stripped, for plain-text use. */
  const plainLabel = (label) => label.replace(/[{}]/g, '');

  const FIELD_LABELS = Object.fromEntries(COLUMNS.map((c) => [c.field, plainLabel(c.label)]));
  FIELD_LABELS.edd = 'Estimated date of discharge';
  /* Structured Nursing fields are attributed to their column in the audit, so
     "Nursing — Falls risk" rather than a bare "Falls risk". */
  for (const x of NURSING_EXTRAS) FIELD_LABELS[x.field] = `Nursing — ${x.label}`;

  /* --- Utilities ---------------------------------------------------------- */

  const $ = (sel, root = document) => root.querySelector(sel);

  const uid = () =>
    crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random().toString(16).slice(2);

  const clone = (v) => JSON.parse(JSON.stringify(v));

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
    data: { notes: {}, edd: {}, audit: {}, user: CFG.users[0] },

    load() {
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(CFG.storageKey) || 'null');
      } catch (_) {
        /* Corrupt or unavailable storage — fall back to seed data. */
      }
      /* Re-seed when the demo content has moved on, otherwise saved entries
         would mask every later edit to data.js. */
      const stale = saved && saved.seedVersion !== CFG.seedVersion;
      if (saved && saved.notes && !stale) this.data = saved;
      else { this.seed(); this.save(); }
      return this.data;
    },

    seed() {
      const d = { notes: {}, edd: {}, audit: {}, user: CFG.users[0], seedVersion: CFG.seedVersion };

      for (const p of PATIENTS) {
        const s = p.seed || {};
        d.notes[p.id] = {};
        for (const c of COLUMNS) {
          d.notes[p.id][c.field] = s[c.field] || '';
          for (const x of c.extras || []) d.notes[p.id][x.field] = s[x.field] || '';
        }
        d.edd[p.id] = p.edd || '';
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
            snapshot: Object.assign(clone(current), overlay),
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

    audit(id) {
      if (!this.data.audit[id]) this.data.audit[id] = [];
      return this.data.audit[id];
    },

    /** A complete picture of one patient row, as stored in the audit trail. */
    snapshot(id) {
      const n = this.notes(id);
      const snap = { edd: this.data.edd[id] || '' };
      for (const c of COLUMNS) {
        snap[c.field] = n[c.field] || '';
        for (const x of c.extras || []) snap[x.field] = n[x.field] || '';
      }
      return snap;
    },
  };

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
    renderLastUpdated(pid);
  }

  /** Refresh the "Last updated" line in place, rather than rebuilding the cell
      and disturbing whatever the user is editing. */
  function renderLastUpdated(pid) {
    const row = $(`#rows tr[data-pid="${pid}"]`);
    if (!row) return;
    const latest = store.audit(pid)[0];
    const when = row.querySelector('[data-role="lastWhen"]');
    const who = row.querySelector('[data-role="lastWho"]');
    if (when) when.textContent = latest ? fmtDateTime(latest.at) : '—';
    if (who) who.textContent = latest ? latest.by : 'No changes recorded';
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

  /* --- Cells -------------------------------------------------------------- */

  /**
   * Grow a textarea to fit its content, so no clinical detail is hidden.
   *
   * scrollHeight covers content and padding but not borders, while these boxes
   * are border-box — so assigning scrollHeight alone leaves the last line
   * clipped by the border width. Measure that difference and add it back.
   */
  function autosize(ta) {
    ta.style.height = 'auto';
    /* An empty box is sized by its placeholder, which can wrap to several
       lines and inflate the row for no reason. Leave it at its CSS minimum. */
    if (!ta.value) { ta.style.height = ''; return; }
    const chrome = ta.offsetHeight - ta.clientHeight;
    ta.style.height = ta.scrollHeight + chrome + 'px';
  }

  function autosizeAll(root = document) {
    for (const ta of root.querySelectorAll('textarea.ta')) autosize(ta);
  }

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

    box.appendChild(el('div', { class: 'pt__btns' }, el('button', {
      type: 'button', class: 'btn btn--ghost',
      dataset: { role: 'handover', pid: p.id },
      title: 'Audit trail of every change to this patient row',
    }, [
      el('span', { text: 'Handover History' }),
      el('span', { class: 'btn__badge', text: String(store.audit(p.id).length) }),
    ])));

    /* Who last touched this row, and when — taken from the newest audit entry
       so it can never disagree with the history behind the button. */
    const latest = store.audit(p.id)[0];
    box.appendChild(el('div', { class: 'pt__updated' }, [
      el('span', { class: 'pt__updatedLabel', text: 'Last updated' }),
      el('span', {
        class: 'pt__updatedWhen',
        text: latest ? fmtDateTime(latest.at) : '—',
        dataset: { role: 'lastWhen' },
      }),
      el('span', {
        class: 'pt__updatedWho',
        text: latest ? latest.by : 'No changes recorded',
        dataset: { role: 'lastWho' },
      }),
    ]));

    td.appendChild(box);
    return td;
  }

  /** Compact Yes / No control. Selected answer is marked in the palette blue. */
  function yesNo(pid, field, value) {
    const wrap = el('div', { class: 'yn' });
    for (const v of ['yes', 'no']) {
      const label = el('label', { class: 'yn__opt' });
      label.appendChild(el('input', {
        type: 'radio', name: `${field}-${pid}`, value: v,
        checked: value === v,
        dataset: { role: 'nxyn', pid, field },
      }));
      label.appendChild(el('span', { text: v === 'yes' ? 'Yes' : 'No' }));
      wrap.appendChild(label);
    }
    return wrap;
  }

  /**
   * The structured strip at the foot of the Nursing column. Grouped fields
   * (the two MRSA dates) share one row under a single heading; the two
   * Yes/No toggles share another.
   */
  function nursingExtras(p, extras) {
    const notes = store.notes(p.id);
    const box = el('div', { class: 'nf' });

    const mini = (text) => el('span', { class: 'nf__mini', text });

    /* Fluid restrictions: label and a one-line box that grows only if needed. */
    const fluid = extras.find((x) => x.type === 'text');
    if (fluid) {
      box.appendChild(el('div', { class: 'nf__row' }, [
        el('span', { class: 'nf__label', text: fluid.label }),
        el('textarea', {
          class: 'ta ta--mini',
          /* rows defaults to 2, which would make an empty box two lines tall
             however small its min-height. It grows via autosize when typed in. */
          rows: 1,
          placeholder: fluid.placeholder || '',
          value: notes[fluid.field] || '',
          dataset: { role: 'note', pid: p.id, field: fluid.field },
          spellcheck: true,
        }),
      ]));
    }

    /* MRSA swabs: heading on its own line, then both dates side by side in a
       two-column grid. A grid rather than a flex row so the pair cannot wrap
       unpredictably when the label and dates exceed the column width. */
    const dates = extras.filter((x) => x.type === 'date');
    if (dates.length) {
      box.appendChild(el('div', { class: 'nf__head', text: dates[0].group || '' }));
      const grid = el('div', { class: 'nf__grid' });
      for (const d of dates) {
        /* Label sits beside the date rather than above it — a short word like
           "Last" costs no extra line here. */
        grid.appendChild(el('div', { class: 'nf__cell nf__cell--inline' }, [
          mini(d.mini || d.label),
          el('input', {
            type: 'date', class: 'dt',
            value: notes[d.field] || '',
            dataset: { role: 'nxdate', pid: p.id, field: d.field },
            'aria-label': d.label,
          }),
        ]));
      }
      box.appendChild(grid);
    }

    /* Both toggles share one two-column row, each with its label above. */
    const toggles = extras.filter((x) => x.type === 'yesno');
    if (toggles.length) {
      const grid = el('div', { class: 'nf__grid' });
      for (const t of toggles) {
        grid.appendChild(el('div', { class: 'nf__cell' }, [
          mini(t.label),
          yesNo(p.id, t.field, notes[t.field]),
        ]));
      }
      box.appendChild(grid);
    }

    return box;
  }

  function noteCell(p, col) {
    const td = el('td', {}, el('textarea', {
      class: 'ta',
      placeholder: col.placeholder,
      value: store.notes(p.id)[col.field] || '',
      dataset: { role: 'note', pid: p.id, field: col.field },
      spellcheck: true,
    }));
    if (col.extras) td.appendChild(nursingExtras(p, col.extras));
    return td;
  }

  /* --- Render ------------------------------------------------------------- */

  /**
   * Render a label, honouring {braces} as case-preserved spans. Used for both
   * the table header and the audit snapshot, which are both uppercased in CSS.
   */
  function labelNodes(label) {
    const nodes = [];
    for (const part of label.split(/(\{[^}]*\})/)) {
      if (!part) continue;
      if (part.startsWith('{') && part.endsWith('}')) {
        nodes.push(el('span', { class: 'keepCase', text: part.slice(1, -1) }));
      } else {
        nodes.push(document.createTextNode(part));
      }
    }
    return nodes;
  }

  /** Build the colgroup and header from COLUMNS so they cannot drift from the
      cells or the audit order. */
  function renderHead() {
    const cols = $('#cols');
    const head = $('#head');
    cols.textContent = '';
    head.textContent = '';

    cols.appendChild(el('col', { class: 'col-patient' }));
    head.appendChild(el('th', { scope: 'col', text: 'Patient Details' }));

    for (const c of COLUMNS) {
      const col = el('col');
      col.style.width = c.width;
      cols.appendChild(col);
      head.appendChild(el('th', { scope: 'col' }, labelNodes(c.label)));
    }
  }

  function render() {
    const tbody = $('#rows');
    tbody.textContent = '';

    for (const p of PATIENTS) {
      const tr = el('tr', { dataset: { pid: p.id } });
      tr.appendChild(patientCell(p));
      for (const col of COLUMNS) tr.appendChild(noteCell(p, col));
      tbody.appendChild(tr);
    }
    autosizeAll(tbody);
    $('#patientCount').textContent = `${PATIENTS.length} patients`;
  }

  /* --- Events ------------------------------------------------------------- */

  /* Text fields: remember the value on focus so blur can tell whether an
     actual edit happened, and only then commit an audit snapshot. */
  const focusValues = new WeakMap();

  function wire() {
    const rows = $('#rows');

    rows.addEventListener('focusin', (e) => {
      if (e.target.dataset.role === 'note') focusValues.set(e.target, e.target.value);
    });

    rows.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.role === 'note') {
        store.notes(t.dataset.pid)[t.dataset.field] = t.value;
        autosize(t);
        saveSoon();
      }
    });

    rows.addEventListener('focusout', (e) => {
      const t = e.target;
      if (t.dataset.role !== 'note') return;
      if (!focusValues.has(t) || focusValues.get(t) === t.value) return;
      focusValues.delete(t);
      commitAudit(t.dataset.pid, FIELD_LABELS[t.dataset.field]);
    });

    rows.addEventListener('change', (e) => {
      const t = e.target;
      const { role, pid, field } = t.dataset;

      if (role === 'edd') {
        store.data.edd[pid] = t.value;
        commitAudit(pid, FIELD_LABELS.edd);
      } else if (role === 'nxdate' || role === 'nxyn') {
        store.notes(pid)[field] = t.value;
        commitAudit(pid, FIELD_LABELS[field]);
      }
    });

    rows.addEventListener('click', (e) => {
      const h = e.target.closest('[data-role="handover"]');
      if (h) openHandoverHistory(h.dataset.pid);
    });

    /* Ward is presentational in the proof of concept — one ward of synthetic
       patients is loaded regardless of selection. */
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
      dl.appendChild(el('dt', {}, labelNodes(label)));
      dl.appendChild(el('dd', { text: value || '' }));
    };

    const yn = (v) => (v ? (v === 'yes' ? 'Yes' : 'No') : '—');

    /* Ordered to match the board's columns left to right, with each column's
       structured fields immediately after its free text. */
    add('EDD', snap.edd ? fmtDate(snap.edd) : '');
    for (const c of COLUMNS) {
      add(c.label, snap[c.field]);
      for (const x of c.extras || []) {
        const v = snap[x.field];
        add(x.label,
          x.type === 'yesno' ? yn(v) : x.type === 'date' ? (v ? fmtDate(v) : '—') : v);
      }
    }

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

  /** Paint over regions of the screenshot we don't want shown. */
  function renderEprPatches() {
    const chrome = $('#chrome');
    if (!chrome) return;
    for (const p of CFG.eprPatches || []) {
      const patch = el('div', { class: 'eprPatch', title: p.label });
      patch.style.left = p.x + 'px';
      patch.style.top = p.y + 'px';
      patch.style.width = p.w + 'px';
      patch.style.height = p.h + 'px';
      /* Sample the same rows from a text-free column further along the bar. */
      patch.style.backgroundPosition = `-${p.from}px -${p.y}px`;
      chrome.appendChild(patch);
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
  renderHead();
  render();
  wire();
  wireAlignment();
  renderEprTabs();
  renderEprPatches();
  fitToRegion();

  let fitTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitToRegion, 80);
  });
})();
