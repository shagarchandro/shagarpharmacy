/* Control Center v32 extras: Payments tab (methods on/off, wallet numbers, TrxID rule) and Insights tab
   (14-day revenue, payment mix, top products, unpaid orders, CSV). Loaded before center.js, which calls CCX(ctx). */
window.CCX = function (c) {
  'use strict';
  const { h, rj, wj, audit, ok, bad, field, inp, chk, tbl, tk } = c;
  const SHOP = [['Cash on delivery', 'Cash on delivery'], ['Card on delivery', 'Card on delivery (rider carries a machine)'], ['bKash (demo)', 'bKash'], ['Nagad (demo)', 'Nagad'], ['Rocket (demo)', 'Rocket']];
  const POS = [['cash', 'Cash'], ['card', 'Card'], ['mobile', 'Mobile wallet']];
  const day = x => new Date(x).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  const css = document.head.appendChild(h('style', {}, '.cxbars{display:flex;align-items:flex-end;gap:4px;height:140px;margin:.6rem 0;overflow-x:auto}.cxbars div{flex:1;min-width:18px;background:var(--pri,#0a7d5a);border-radius:4px 4px 0 0;position:relative}.cxbars span{position:absolute;bottom:-1.3rem;left:50%;transform:translateX(-50%);font-size:.65rem;color:#667;white-space:nowrap}.cxlab{margin-bottom:1.6rem}.cxk{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.6rem;margin:.6rem 0}'));
  const panels = {};
  panels.payments = () => {
    const D = c.db(), s = D.settings, S = rj('pharmacy_settings', {}), off = s.payOff || [], num = s.payNum || {}, pOff = S.posPayOff || [];
    const f = h('form', {
      class: 'cc-form', onsubmit(e) {
        e.preventDefault(); const el = e.target.elements, o = SHOP.filter(([k]) => !el['s|' + k].checked).map(([k]) => k);
        if (o.length === SHOP.length) return bad('Keep at least one online payment method on');
        const po = POS.filter(([k]) => !el['p|' + k].checked).map(([k]) => k); if (po.includes('cash')) return bad('Cash must stay on in the POS');
        const ph = /^[0-9+ -]{0,16}$/; for (const n of ['bKash', 'Nagad', 'Rocket']) if (!ph.test(el['n|' + n].value.trim())) return bad(n + ' number looks wrong');
        s.payOff = o; s.payNum = { bKash: el['n|bKash'].value.trim(), Nagad: el['n|Nagad'].value.trim(), Rocket: el['n|Rocket'].value.trim() }; s.payNoRef = !el.reqRef.checked; c.save(D);
        const X = rj('pharmacy_settings', {}); X.posPayOff = po; X.posNoRef = !el.posReqRef.checked; wj('pharmacy_settings', X);
        audit('Changed payment settings'); ok('Payment settings saved');
      }
    },
      h('h3', {}, 'Online shop methods'), h('div', { class: 'cc-grid' }, SHOP.map(([k, l]) => h('div', { class: 'cc-card' }, chk('s|' + k, !off.includes(k), l)))),
      h('div', { class: 'two' }, field('bKash number (shown at checkout)', inp('n|bKash', num.bKash || '')), field('Nagad number', inp('n|Nagad', num.Nagad || ''))), field('Rocket number', inp('n|Rocket', num.Rocket || '')),
      chk('reqRef', !s.payNoRef, 'Customers must enter the wallet TrxID'),
      h('h3', {}, 'POS methods'), h('div', { class: 'cc-grid' }, POS.map(([k, l]) => h('div', { class: 'cc-card' }, chk('p|' + k, !pOff.includes(k), l)))),
      chk('posReqRef', !S.posNoRef, 'Staff must enter the TrxID / card slip number for Card & Mobile'),
      h('p', { class: 'muted' }, 'Demo only: numbers are shown to customers, but no real payment gateway is connected and TrxIDs are format-checked, not verified.'),
      h('button', { class: 'btn' }, 'Save payment settings'));
    return h('div', {}, h('h2', {}, '💳 Payments'), f);
  };
  panels.insights = () => {
    const D = c.db(), sales = rj('pharmacy_sales', []).filter(x => x && x.real), orders = (D.orders || []).filter(o => o.status !== 'Cancelled');
    const rec = [...sales.map(x => ({ d: day(x.at || x.date), t: +x.total || 0, p: (x.paymentMethod || 'cash'), items: x.items || [] })),
      ...orders.map(o => ({ d: day(o.at), t: +o.total || 0, p: (o.pay || 'Unknown').replace(/ \(demo.*\)/, ''), items: (o.items || []).map(i => ({ name: i.name, quantity: i.qty, price: i.price })) }))];
    const days = [...Array(14)].map((_, i) => day(Date.now() - (13 - i) * 864e5)), by = {}; rec.forEach(r => by[r.d] = (by[r.d] || 0) + r.t);
    const mx = Math.max(1, ...days.map(d => by[d] || 0)), tot = rec.reduce((a, r) => a + r.t, 0), t14 = days.reduce((a, d) => a + (by[d] || 0), 0);
    const pm = {}; rec.forEach(r => pm[r.p] = (pm[r.p] || 0) + r.t);
    const tp = {}; rec.forEach(r => r.items.forEach(i => tp[i.name] = (tp[i.name] || 0) + (+i.quantity || 0)));
    const top = Object.entries(tp).sort((a, b) => b[1] - a[1]).slice(0, 5), unpaid = orders.filter(o => !o.paid && o.status !== 'Delivered');
    const csv = () => { const q = v => '"' + String(v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"', b = new Blob(['﻿' + [['Date', 'Total', 'Payment']].concat(rec.map(r => [r.d, r.t, r.p])).map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' }), a = h('a', { href: URL.createObjectURL(b), download: 'all-sales.csv' }); document.body.append(a); a.click(); setTimeout(() => a.remove(), 500); audit('Exported all sales CSV'); };
    return h('div', {}, h('h2', {}, '📊 Insights'),
      h('div', { class: 'cxk' }, [['All-time revenue', tk(tot)], ['Last 14 days', tk(t14)], ['Transactions', rec.length], ['Unpaid online orders', unpaid.length]].map(([l, v]) => h('div', { class: 'cc-card' }, h('b', {}, v), h('br'), h('small', { class: 'muted' }, l)))),
      h('h3', {}, 'Revenue — last 14 days'), h('div', { class: 'cxbars cxlab', role: 'img', 'aria-label': 'Revenue per day, last 14 days' }, days.map(d => h('div', { title: d + ': ' + tk(by[d] || 0), style: 'height:' + Math.max(2, Math.round((by[d] || 0) / mx * 100)) + '%' }, h('span', {}, d.slice(8))))),
      h('h3', {}, 'Payment mix'), tbl(['Method', 'Revenue', 'Share'], Object.entries(pm).sort((a, b) => b[1] - a[1]).map(([k, v]) => h('tr', {}, h('td', {}, k), h('td', {}, tk(v)), h('td', {}, (tot ? Math.round(v / tot * 100) : 0) + '%'))), 'No sales yet'),
      h('h3', {}, 'Top products (units)'), tbl(['Product', 'Units'], top.map(([k, v]) => h('tr', {}, h('td', {}, k), h('td', {}, v))), 'No sales yet'),
      h('h3', {}, 'Unpaid online orders'), tbl(['Order', 'Customer', 'Method', 'Total', 'Status'], unpaid.map(o => h('tr', {}, h('td', {}, o.no), h('td', {}, o.customer), h('td', {}, o.pay || ''), h('td', {}, tk(o.total)), h('td', {}, o.status))), 'Nothing outstanding'),
      h('p', {}, c.btn('⬇ Export all sales (CSV)', csv, 'btn')));
  };
  return { tabs: [['payments', '💳 Payments'], ['insights', '📊 Insights']], panels };
};
