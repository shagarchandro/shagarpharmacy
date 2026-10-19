/* Ops Panel v29: "Today" strip on dashboard, order-status summary chips and CSV export on Orders. */
(function () {
  'use strict';
  const csv = (name, rows) => {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"';
    const b = new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' });
    const a = h('a', { href: URL.createObjectURL(b), download: name }); document.body.append(a); a.click(); setTimeout(() => a.remove(), 500);
  };
  const day = x => new Date(x).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  const st = document.head.appendChild(h('style', {}, '.tdy{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.6rem;margin:.6rem 0}.tdy div{background:#fff;border:1px solid #dde3ea;border-radius:12px;padding:.7rem}.tdy b{display:block;font-size:1.25rem}.tdy span{font-size:.8rem;color:#667}.chips{display:flex;gap:.4rem;flex-wrap:wrap;margin:.5rem 0}.chips button{border:1px solid #cfd6de;background:#fff;border-radius:999px;padding:.25rem .7rem;cursor:pointer}.chips button.on{background:#0a7d5a;color:#fff;border-color:#0a7d5a}'));
  const d0 = V.dash;
  V.dash = () => {
    const r = d0(), t = day(Date.now());
    const so = (D.sales || []).filter(s => day(s.at || s.date || 0) === t), oo = (D.orders || []).filter(o => day(o.at) === t);
    const rev = so.reduce((a, s) => a + (+s.total || 0), 0) + oo.filter(o => o.status !== 'Cancelled').reduce((a, o) => a + (+o.total || 0), 0);
    const pend = (D.orders || []).filter(o => ['Pending', 'Prescription Review'].includes(o.status)).length;
    r.prepend(h('div', { class: 'tdy', 'aria-label': 'Today' },
      h('div', {}, h('b', {}, money(rev)), h('span', {}, 'Today revenue')),
      h('div', {}, h('b', {}, so.length), h('span', {}, 'POS sales today')),
      h('div', {}, h('b', {}, oo.length), h('span', {}, 'Online orders today')),
      h('div', {}, h('b', {}, pend), h('span', {}, 'Orders awaiting action'))));
    return r;
  };
  const o0 = V.orders;
  V.orders = () => {
    const r = o0(), L = D.orders || [], cnt = {};
    L.forEach(o => cnt[o.status] = (cnt[o.status] || 0) + 1);
    const pm = {}; L.filter(o => o.status !== 'Cancelled').forEach(o => { const k = (o.pay || 'Unknown').replace(/ \(demo.*\)/, ''); (pm[k] = pm[k] || { n: 0, t: 0, unpaid: 0 }); pm[k].n++; pm[k].t += +o.total || 0; if (!o.paid && o.status !== 'Delivered') pm[k].unpaid += +o.total || 0; });
    r.querySelectorAll('tbody tr').forEach(tr => { const o = L.find(x => x.no === tr.children[0].textContent); if (!o) return; const c = tr.children[1];
      if (o.payRef) c.append(h('div', { class: 'tag' }, (o.pay || '').replace(/ \(demo.*\)/, '') + ' · ' + o.payRef));
      c.append(h('div', {}, h('label', { style: 'font-size:.8rem' }, h('input', { type: 'checkbox', checked: !!o.paid, 'aria-label': 'Paid ' + o.no, onchange(e) { o.paid = e.target.checked; save(D); toast(o.paid ? 'Marked as paid' : 'Marked as unpaid'); go(); } }), ' Paid'))); });
    r.prepend(h('div', { class: 'tdy', 'aria-label': 'Payments' }, Object.keys(pm).map(k => h('div', {}, h('b', {}, money(pm[k].t)), h('span', {}, k + ' · ' + pm[k].n + ' order(s)' + (pm[k].unpaid ? ' · ' + money(pm[k].unpaid) + ' unpaid' : ''))))));
    r.prepend(h('div', { class: 'chips' },
      Object.keys(cnt).map(s => h('span', { class: 'tag' }, s + ': ' + cnt[s])),
      h('button', { onclick() {
        csv('orders-' + day(Date.now()) + '.csv', [['No', 'Date', 'Customer', 'Phone', 'Address', 'Items', 'Total', 'Payment', 'Pay ref', 'Paid', 'Status']].concat(L.map(o => [o.no, day(o.at), o.customer, o.phone, o.addr, (o.items || []).map(i => i.name + 'x' + i.qty).join('; '), o.total, o.pay, o.payRef || '', o.paid ? 'Yes' : 'No', o.status])));
      } }, '⬇ Export CSV')));
    return r;
  };
})();

/* v33: Ops dashboard "Needs attention" + 14-day trend, and bulk-confirm on Orders. */
(function () {
  'use strict';
  const d1 = V.dash;
  V.dash = () => {
    const r = d1(), L = D.orders || [];
    const unpaid = L.filter(o => !o.paid && !['Cancelled', 'Delivered'].includes(o.status)).length, rx = L.filter(o => o.status === 'Prescription Review').length, pend = L.filter(o => o.status === 'Pending').length;
    const low = D.products.filter(p => stock(D, p.id) < p.reorder).length;
    const item = (n, label, tabK) => n ? h('li', {}, h('span', {}, label), h('button', { class: 'mini', onclick() { tab = tabK; go(); } }, n + ' →')) : null;
    const att = [item(rx, 'Prescriptions to review', 'rx'), item(pend, 'New orders to confirm', 'orders'), item(unpaid, 'Orders not marked paid', 'orders'), item(low, 'Low-stock products', 'alerts')].filter(Boolean);
    const key = x => new Date(x).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }), days = [...Array(14)].map((_, i) => key(Date.now() - (13 - i) * 864e5)), by = {};
    [...(D.sales || []).map(s => [key(s.at || s.date || 0), +s.total || 0]), ...L.filter(o => o.status !== 'Cancelled').map(o => [key(o.at), +o.total || 0])].forEach(([k, v]) => by[k] = (by[k] || 0) + v);
    const mx = Math.max(1, ...days.map(k => by[k] || 0));
    r.append(h('section', { class: 'att' }, h('h2', {}, '🚦 Needs attention'), att.length ? h('ul', { style: 'list-style:none;padding:0' }, att) : h('p', {}, 'All clear ✔'),
      h('h2', {}, '📈 Revenue — 14 days'), h('div', { class: 'cxbars', style: 'display:flex;align-items:flex-end;gap:4px;height:110px', role: 'img', 'aria-label': 'Revenue last 14 days' }, days.map(k => h('div', { title: k + ': ' + money(by[k] || 0), style: 'flex:1;background:#0a7d5a;border-radius:4px 4px 0 0;height:' + Math.max(2, Math.round((by[k] || 0) / mx * 100)) + '%' })))));
    return r;
  };
  const o1 = V.orders;
  V.orders = () => {
    const r = o1(), L = D.orders || [], can = ['Owner', 'Pharmacist'].includes(R) || R === 'Cashier';
    const n = L.filter(o => o.status === 'Pending' && !o.rx).length;
    if (n && can) r.prepend(h('div', { class: 'chips' }, h('button', { onclick() { if (!confirm('Confirm ' + n + ' pending non-prescription order(s)?')) return; L.forEach(o => { if (o.status === 'Pending' && !o.rx) o.status = 'Confirmed'; }); save(D); toast(n + ' order(s) confirmed'); go(); } }, '✔ Confirm all pending (' + n + ')')));
    return r;
  };
})();
