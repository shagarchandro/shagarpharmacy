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
    r.prepend(h('div', { class: 'chips' },
      Object.keys(cnt).map(s => h('span', { class: 'tag' }, s + ': ' + cnt[s])),
      h('button', { onclick() {
        csv('orders-' + day(Date.now()) + '.csv', [['No', 'Date', 'Customer', 'Phone', 'Address', 'Items', 'Total', 'Payment', 'Status']].concat(L.map(o => [o.no, day(o.at), o.customer, o.phone, o.addr, (o.items || []).map(i => i.name + 'x' + i.qty).join('; '), o.total, o.pay, o.status])));
      } }, '⬇ Export CSV')));
    return r;
  };
})();
