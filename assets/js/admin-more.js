/* Ops Panel upgrade: Team Board tab, quick-jump palette (Ctrl+K or "/"), mobile bottom bar, printable delivery slips.
   Loaded after admin-extra.js; reuses h(), D, V, ACC, NAMES, go(), toast(), save(), money(), dhaka(). */
(function () {
  'use strict';
  const TK = 'pharmacy_team', me = 'ops:' + R.toLowerCase().replace(/\s+/g, '-');
  const rj = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lead = R === 'Owner' || R === 'Pharmacist';
  const team = () => { const d = rj(TK, { notices: [], tasks: [] }); d.notices = d.notices || []; d.tasks = d.tasks || []; return d; };
  const wr = d => { d.notices = d.notices.slice(-200); d.tasks = d.tasks.slice(-300); localStorage.setItem(TK, JSON.stringify(d)); window.dispatchEvent(new Event('mc-team')); };
  const mineT = t => t.to === 'all' || t.to === R.toLowerCase() || t.to === (R === 'Owner' ? 'admin' : '') || t.to === me;
  const fmt = i => new Date(i).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' });

  // ---- Team Board view ----
  NAMES.team = 'Team Board';
  Object.keys(ACC).forEach(r => { if (!ACC[r].includes('team')) ACC[r].push('team'); });
  V.team = () => {
    const d = team(), root = h('div', {});
    const nf = h('form', { class: 'row', onsubmit(e) { e.preventDefault(); const t = e.target.elements, x = t.txt.value.trim(); if (!x) return;
      const dd = team(); dd.notices.push({ id: Date.now(), at: new Date().toISOString(), by: R, email: me, role: R, text: x.slice(0, 400), pri: lead ? t.pri.value : 'normal', pinned: lead && t.pin.checked, ho: !lead, ack: {} }); wr(dd); toast('Posted'); go(); } },
      h('input', { name: 'txt', placeholder: lead ? 'Notice for the team…' : 'Shift handover note…', maxlength: 400, required: 'required', 'aria-label': 'Notice' }),
      lead ? h('select', { name: 'pri', 'aria-label': 'Priority' }, h('option', { value: 'normal' }, 'Normal'), h('option', { value: 'high' }, 'Urgent')) : h('span', {}),
      lead ? h('label', { class: 'row' }, h('input', { type: 'checkbox', name: 'pin' }), ' Pin') : h('span', {}), h('button', { class: 'btn' }, 'Post'));
    const N = d.notices.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.id - a.id);
    root.append(h('h2', {}, 'Notices & handover'), nf, N.length ? h('div', {}, N.map(n => h('div', { class: 'card' },
      (n.pinned ? '📌 ' : '') + (n.pri === 'high' ? '🔴 ' : '') + (n.ho ? '🤝 ' : '') + n.text, h('br'), h('small', { class: 'muted' }, `${n.by} · ${fmt(n.at)} · 👁 ${Object.keys(n.ack || {}).length} `),
      (n.ack && n.ack[me]) ? '' : h('button', { onclick() { const dd = team(), x = dd.notices.find(z => z.id === n.id); if (x) { x.ack = x.ack || {}; x.ack[me] = 1; wr(dd); go(); } } }, 'Mark read ✔'),
      (R === 'Owner' || n.email === me) ? h('button', { onclick() { const dd = team(); dd.notices = dd.notices.filter(z => z.id !== n.id); wr(dd); go(); } }, 'Delete') : ''))) : h('p', { class: 'muted' }, 'No notices.'));
    const tf = lead ? h('form', { class: 'row', onsubmit(e) { e.preventDefault(); const t = e.target.elements, x = t.txt.value.trim(); if (!x) return;
      const dd = team(); dd.tasks.push({ id: Date.now(), at: new Date().toISOString(), by: R, text: x.slice(0, 160), to: t.to.value, due: t.due.value || '', done: false }); wr(dd); toast('Task added'); go(); } },
      h('input', { name: 'txt', placeholder: 'New task…', maxlength: 160, required: 'required', 'aria-label': 'Task' }),
      h('select', { name: 'to', 'aria-label': 'Assign to' }, [['all', 'Everyone'], ['pharmacist', 'Pharmacist'], ['cashier', 'Cashier'], ['inventory manager', 'Inventory Manager'], ['delivery staff', 'Delivery Staff'], ['staff', 'Staff (dashboard)']].map(x => h('option', { value: x[0] }, x[1]))),
      h('input', { name: 'due', type: 'date', 'aria-label': 'Due date' }), h('button', { class: 'btn' }, 'Add task')) : '';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
    const T = d.tasks.filter(t => lead || mineT(t)).sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || ((a.due || '9') > (b.due || '9') ? 1 : -1));
    root.append(h('h2', {}, 'Tasks'), tf, T.length ? h('div', {}, T.map(t => h('div', { class: 'card' },
      h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: t.done ? 'checked' : null, disabled: (lead || mineT(t)) ? null : 'disabled', onchange(e) { const dd = team(), x = dd.tasks.find(z => z.id === t.id); if (x) { x.done = e.target.checked; x.doneBy = x.done ? R : ''; wr(dd); go(); } } }), h('span', { style: t.done ? 'text-decoration:line-through;opacity:.6' : '' }, t.text)),
      h('small', { class: 'muted' }, `→ ${t.to === 'all' ? 'Everyone' : t.to}${t.due ? ' · due ' + t.due : ''}${t.due && !t.done && t.due < today ? ' (overdue)' : ''} · ${t.by}${t.done ? ' · ✔ ' + (t.doneBy || '') : ''}`),
      R === 'Owner' ? h('button', { onclick() { const dd = team(); dd.tasks = dd.tasks.filter(z => z.id !== t.id); wr(dd); go(); } }, 'Delete') : ''))) : h('p', { class: 'muted' }, 'No tasks.'));
    return root;
  };
  const nav = document.querySelector('header.bar nav');
  const unread = () => { const d = team(); return d.notices.filter(n => !(n.ack && n.ack[me])).length + d.tasks.filter(t => !t.done && mineT(t)).length; };
  let tb = null;
  if (nav && ACC[R].includes('team')) { tb = h('button', { onclick() { tab = 'team'; go(); } }, 'Team Board'); nav.append(tb); }
  const badge = () => { if (tb) tb.textContent = 'Team Board' + (unread() ? ' (' + unread() + ')' : ''); };
  badge(); window.addEventListener('mc-team', badge); window.addEventListener('storage', badge);

  // ---- command palette + bottom bar ----
  const st = h('style', {}, '.mco{position:fixed;inset:0;background:#0009;z-index:3000;display:none;align-items:flex-start;justify-content:center;padding:10vh 12px 0}.mco.on{display:flex}.mcp{width:min(520px,100%);background:var(--card,#fff);color:var(--fg,#111);border-radius:16px;overflow:hidden;box-shadow:0 30px 80px #0006}.mcp input{width:100%;box-sizing:border-box;border:0;border-bottom:1px solid var(--br,#ddd);padding:1rem;font-size:1.05rem;background:transparent;color:inherit;outline:none}.mcp button{display:block;width:100%;text-align:left;border:0;background:none;color:inherit;padding:.7rem 1rem;font:inherit;cursor:pointer}.mcp button.sel,.mcp button:hover{background:var(--br,#eee)}' +
    '.mcf{position:fixed;right:14px;bottom:78px;z-index:2500;width:46px;height:46px;border-radius:50%;border:0;background:var(--pri,#0b7a6b);color:#fff;font-size:1.2rem;box-shadow:0 8px 20px #0004;cursor:pointer}@media(min-width:900px){.mcf{bottom:20px}}' +
    '.mcb{display:none;position:fixed;left:0;right:0;bottom:0;z-index:2400;background:var(--card,#fff);border-top:1px solid var(--br,#ddd);justify-content:space-around;padding:.2rem .2rem calc(.2rem + env(safe-area-inset-bottom))}.mcb button{flex:1;border:0;background:none;color:inherit;font:600 .7rem system-ui;padding:.4rem 0;border-radius:8px}.mcb button.on{background:var(--br,#eee)}@media(max-width:820px){.mcb{display:flex}body{padding-bottom:60px}}' +
    '@media print{.mcb,.mcf,.mco,header.bar,.skip{display:none!important}}');
  document.head.append(st);
  const ov = h('div', { class: 'mco', role: 'dialog', 'aria-label': 'Quick jump' }), box = h('div', { class: 'mcp' }), inp = h('input', { placeholder: 'Jump to… (Dashboard, Orders, POS)', 'aria-label': 'Search tabs', autocomplete: 'off' }), list = h('div', {});
  box.append(inp, list); ov.append(box); document.body.append(ov);
  let sel = 0, cur = [];
  const draw = () => { const q = inp.value.trim().toLowerCase(); cur = ACC[R].filter(t => !q || NAMES[t].toLowerCase().includes(q) || t.includes(q)); sel = Math.min(sel, Math.max(cur.length - 1, 0)); list.replaceChildren(...cur.map((t, i) => h('button', { class: i === sel ? 'sel' : '', onclick() { jump(t); } }, NAMES[t]))); };
  const jump = t => { ov.classList.remove('on'); tab = t; go(); }, openP = () => { ov.classList.add('on'); inp.value = ''; sel = 0; draw(); setTimeout(() => inp.focus(), 30); };
  inp.addEventListener('input', () => { sel = 0; draw(); });
  inp.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, cur.length - 1); draw(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); } else if (e.key === 'Enter' && cur[sel]) jump(cur[sel]); });
  ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('on'); });
  document.addEventListener('keydown', e => { const tg = (e.target.tagName || '').toLowerCase(), typing = /input|textarea|select/.test(tg);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openP(); } else if (e.key === '/' && !typing) { e.preventDefault(); openP(); } else if (e.key === 'Escape') ov.classList.remove('on'); });
  document.body.append(h('button', { class: 'mcf', 'aria-label': 'Quick jump (Ctrl+K)', title: 'Quick jump (Ctrl+K)', onclick: openP }, '🔍'));
  const bar = h('nav', { class: 'mcb', 'aria-label': 'Quick navigation' });
  const bt = ACC[R].filter(t => t !== 'team').slice(0, 4);
  const paintBar = () => bar.replaceChildren(...bt.map(t => h('button', { class: t === tab ? 'on' : '', onclick() { tab = t; go(); } }, NAMES[t])), h('button', { onclick: openP }, '☰ More'));
  document.body.append(bar); paintBar();
  new MutationObserver(paintBar).observe(document.getElementById('app'), { childList: true });

  // ---- printable delivery slips ----
  const dv0 = V.delivery;
  V.delivery = () => {
    const r = dv0(), L = D.orders.filter(o => ['Packed', 'Shipped'].includes(o.status));
    r.prepend(h('div', { class: 'row' }, h('button', { class: 'btn', onclick() {
      if (!L.length) return toast('No orders to print', 1);
      document.querySelectorAll('.mcprint').forEach(x => x.remove());
      const p = h('div', { class: 'mcprint' }, L.map(o => h('section', { style: 'page-break-after:always;padding:12px;font-family:system-ui' },
        h('h2', {}, D.settings.store || 'MediCare'), h('p', {}, `Order ${o.no} · ${dhaka(o.at)}`),
        h('p', {}, h('b', {}, o.customer), ' · ', o.phone, h('br'), o.addr),
        h('ul', {}, (o.items || []).map(i => h('li', {}, `${i.name} × ${i.qty}`))),
        h('p', {}, h('b', {}, 'Collect: '), (o.pay && /cash/i.test(o.pay)) ? money(o.total) : 'Paid / ' + (o.pay || 'online'), ' · Total ' + money(o.total)),
        o.rx ? h('p', {}, '⚠️ Prescription item — verify before handing over.') : '')));
      const ps = h('style', { class: 'mcprint' }, '.mcprint{display:none}@media print{body>*:not(.mcprint){display:none!important}.mcprint{display:block!important}}');
      document.head.append(ps); document.body.append(p); setTimeout(() => { print(); }, 50); setTimeout(() => { p.remove(); ps.remove(); }, 1500);
    } }, '🖨 Print delivery slips (' + L.length + ')')));
    return r;
  };
})();
