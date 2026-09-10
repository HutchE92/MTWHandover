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
      width: '22%',
      placeholder: 'Mobility, continence, skin, cognition, risk scores, infectious status, diet…',
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
      if (saved && saved.notes) this.data = saved;
      else { this.seed(); this.save(); }
      return this.data;
    },

    seed() {
      const d = { notes: {}, edd: {}, audit: {}, user: CFG.users[0] };

      for (const p of PATIENTS) {
        const s = p.seed || {};
        d.notes[p.id] = {};
        for (const c of COLUMNS) d.notes[p.id][c.field] = s[c.field] || '';
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
      for (const c of COLUMNS) snap[c.field] = n[c.field] || '';
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

  /** Grow a textarea to fit its content, so no clinical detail is hidden. */
  function autosize(ta) {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
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

    td.appendChild(box);
    return td;
  }

  function noteCell(p, col) {
    return el('td', {}, el('textarea', {
      class: 'ta',
      placeholder: col.placeholder,
      value: store.notes(p.id)[col.field] || '',
      dataset: { role: 'note', pid: p.id, field: col.field },
      spellcheck: true,
    }));
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
      if (t.dataset.role === 'edd') {
        store.data.edd[t.dataset.pid] = t.value;
        commitAudit(t.dataset.pid, FIELD_LABELS.edd);
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

    /* Ordered to match the board's columns left to right. */
    add('EDD', snap.edd ? fmtDate(snap.edd) : '');
    for (const c of COLUMNS) add(c.label, snap[c.field]);

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
