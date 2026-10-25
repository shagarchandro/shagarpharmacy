/* Ops Panel v36: every list view gets a search box, row count, click-to-sort headers and CSV export. */
(function () {
  'use strict';
  const VIEWS = ['products', 'inv', 'customers', 'suppliers', 'purchases', 'returns', 'expenses', 'alerts', 'users', 'orders'];
  const Q = {};
  const cell = td => { const s = td.querySelector('select'); return (s ? s.options[s.selectedIndex].text : td.textContent).replace(/\s+/g, ' ').trim(); };
  const num = v => { const n = parseFloat(String(v).replace(/[^\d.\-]/g, '')); return isNaN(n) ? null : n; };
  const st = document.head.appendChild(h('style', {}, '.lbar{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin:.4rem 0}.lbar input{flex:1;min-width:150px}.lbar small{color:#667}th.srt{cursor:pointer;user-select:none}th.srt:after{content:" ⇅";opacity:.4;font-size:.75em}th.asc:after{content:" ▲";opacity:1}th.desc:after{content:" ▼";opacity:1}'));
  VIEWS.forEach(k => {
    const v0 = V[k]; if (!v0) return;
    V[k] = function () {
      const r = v0.apply(this, arguments), t = r.querySelector('table'); if (!t) return r;
      const body = t.tBodies[0], rows = () => [...body.rows].filter(x => !x.querySelector('td.empty'));
      if (rows().length < 6) return r;
      const cnt = h('small', {}), inp = h('input', { type: 'search', placeholder: 'Search this list…', 'aria-label': 'Search this list', value: Q[k] || '' });
      const apply = () => { const q = inp.value.trim().toLowerCase(); Q[k] = inp.value; let n = 0; rows().forEach(x => { const m = !q || x.textContent.toLowerCase().includes(q); x.style.display = m ? '' : 'none'; if (m) n++; }); cnt.textContent = n + ' of ' + rows().length; };
      inp.addEventListener('input', apply);
      const csv = () => {
        const q = v => '"' + String(v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"', head = [...t.tHead.rows[0].cells].map(c => c.textContent.replace(/[⇅▲▼]/g, '').trim());
        const data = rows().filter(x => x.style.display !== 'none').map(x => [...x.cells].map(cell));
        const b = new Blob(['﻿' + [head].concat(data).map(x => x.map(q).join(',')).join('\n')], { type: 'text/csv' }), a = h('a', { href: URL.createObjectURL(b), download: k + '-' + new Date(Date.now() + 216e5).toISOString().slice(0, 10) + '.csv' });
        document.body.append(a); a.click(); setTimeout(() => a.remove(), 500);
      };
      [...t.tHead.rows[0].cells].forEach((th, i) => {
        if (!th.textContent.trim()) return; th.classList.add('srt'); th.tabIndex = 0; th.setAttribute('role', 'button');
        const sort = () => {
          const dir = th.classList.contains('asc') ? -1 : 1; [...t.tHead.rows[0].cells].forEach(x => x.classList.remove('asc', 'desc')); th.classList.add(dir === 1 ? 'asc' : 'desc');
          const R = rows(); R.sort((a, b) => { const x = cell(a.cells[i] || a), y = cell(b.cells[i] || b), nx = num(x), ny = num(y); return (nx != null && ny != null ? nx - ny : x.localeCompare(y)) * dir; }); R.forEach(x => body.append(x));
        };
        th.addEventListener('click', sort); th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sort(); } });
      });
      r.prepend(h('div', { class: 'lbar' }, inp, cnt, h('button', { class: 'mini', type: 'button', onclick: csv }, '⬇ CSV')));
      apply(); return r;
    };
  });
})();
