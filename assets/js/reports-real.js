/* Reports v50 — "Business summary": real numbers from POS sales + online orders (no demo/random data).
   Revenue, real gross profit (item cost), expenses, payment mix, daily trend, top products/customers, cashiers,
   busy hours, and working CSV export / print. Also makes the old "Export" buttons really export. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function el(t, a, kids) { var e = document.createElement(t); a = a || {}; for (var k in a) { if (k === 'text') e.textContent = a[k]; else if (k.slice(0, 2) === 'on') e[k] = a[k]; else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(c); }); return e; }
  var tk = function (n) { return '৳' + (Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var dayOf = function (iso) { return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); };
  var hourOf = function (iso) { return +new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', hour12: false }) % 24; };
  var nav = $('ul.nav-tabs'), anchor = $('#salesReport'); if (!nav || !anchor) return;

  // ---- collect
  function collect() {
    var meds = rj('pharmacy_medicines', []), cost = {}, costN = {};
    meds.forEach(function (m) { if (m.purchasePrice > 0) { cost[m.id] = m.purchasePrice; costN[String(m.name).toLowerCase()] = m.purchasePrice; } });
    var db = rj('mc_db', { products: [], orders: [], expenses: [] }), pc = {}; (db.products || []).forEach(function (p) { if (p.cost > 0) pc[p.id] = p.cost; });
    var rows = [];
    rj('pharmacy_sales', []).forEach(function (s) {
      if (!s || !s.real || (s.status && s.status !== 'Completed')) return;
      var at = s.at || s.date; if (!at) return; var lines = (s.items || []).map(function (i) { var c = cost[i.id] != null ? cost[i.id] : costN[String(i.name).toLowerCase()]; return { name: i.name, qty: i.quantity || 1, rev: (i.price || 0) * (i.quantity || 1), cost: c != null ? c * (i.quantity || 1) : null }; });
      var pay = {}; if (s.parts && s.parts.length) s.parts.forEach(function (p) { pay[p.m] = (pay[p.m] || 0) + p.amt; }); else pay[s.paymentMethod || 'cash'] = s.total;
      rows.push({ src: 'POS', ref: s.invoiceNo, at: at, day: dayOf(at), hour: s.at ? hourOf(at) : null, who: s.customer || 'Walk-in', cashier: s.cashier || '—', total: s.total || 0, disc: s.discount || 0, tax: s.tax || 0, lines: lines, pay: pay });
    });
    (db.orders || []).forEach(function (o) {
      if (!o || o.status === 'Cancelled' || o.status === 'Returned') return;
      var lines = (o.items || []).map(function (i) { var c = pc[i.pid]; return { name: i.name, qty: i.qty || 1, rev: (i.price || 0) * (i.qty || 1), cost: c != null ? c * (i.qty || 1) : null }; });
      var pm = o.payMethod || o.pay || 'Online'; var pay = {}; pay[pm] = o.total || 0;
      rows.push({ src: 'Online', ref: o.no, at: o.at, day: dayOf(o.at), hour: hourOf(o.at), who: o.customer || 'Guest', cashier: '—', total: o.total || 0, disc: o.disc || 0, tax: 0, lines: lines, pay: pay, fee: o.fee || 0 });
    });
    var exp = (db.expenses || []).filter(function (e) { return e && e.at; }).map(function (e) { return { day: dayOf(e.at), what: e.what, amt: +e.amt || 0 }; });
    return { rows: rows, exp: exp };
  }

  window.mcBizCollect = collect;
  // ---- UI shell
  var link = el('a', { class: 'nav-link', href: '#bizReport', text: '📈 Business summary' }); var li = el('li', { class: 'nav-item' }, [link]); nav.append(li);
  var pane = el('div', { class: 'tab-pane fade', id: 'bizReport' }); anchor.parentNode.append(pane);
  link.addEventListener('click', function (e) {
    e.preventDefault(); nav.querySelectorAll('.nav-link').forEach(function (a) { a.classList.remove('active'); }); link.classList.add('active');
    anchor.parentNode.querySelectorAll(':scope > .tab-pane').forEach(function (p) { p.classList.remove('show', 'active'); }); pane.classList.add('show', 'active'); draw();
  });
  var range = 'month', from = '', to = '', src = 'all', state = null;
  function today() { return dayOf(Date.now()); }
  function bounds() {
    var t = today(), d = new Date(t + 'T00:00:00'), f = '0000', e = '9999';
    if (range === 'today') { f = e = t; } else if (range === '7') { d.setDate(d.getDate() - 6); f = d.toLocaleDateString('en-CA'); e = t; } else if (range === '30') { d.setDate(d.getDate() - 29); f = d.toLocaleDateString('en-CA'); e = t; }
    else if (range === 'month') { f = t.slice(0, 8) + '01'; e = t; } else if (range === 'custom') { f = from || '0000'; e = to || '9999'; }
    return [f, e];
  }
  function card(label, val, sub, cls) { return el('div', { class: 'col-6 col-md-3 mb-3' }, [el('div', { class: 'card h-100', style: 'padding:.8rem;border-radius:12px' }, [el('div', { class: 'text-muted small', text: label }), el('div', { class: 'fw-bold ' + (cls || ''), style: 'font-size:1.35rem', text: val }), sub ? el('div', { class: 'text-muted small', text: sub }) : null])]); }
  function table(head, rows, empty) {
    var t = el('table', { class: 'table table-sm align-middle mb-0' }); t.append(el('thead', {}, [el('tr', {}, head.map(function (h) { return el('th', { text: h }); }))]));
    var tb = el('tbody'); if (!rows.length) tb.append(el('tr', {}, [el('td', { colspan: head.length, class: 'text-muted', text: empty || 'No data in this period' })])); rows.forEach(function (r) { tb.append(el('tr', {}, r.map(function (c) { return c instanceof Node ? el('td', {}, [c]) : el('td', { text: c }); }))); }); t.append(tb); return el('div', { class: 'table-responsive' }, [t]);
  }
  function bar(v, max, color) { return el('div', { style: 'min-width:90px;background:rgba(0,0,0,.08);border-radius:5px;height:10px;overflow:hidden' }, [el('div', { style: 'height:100%;width:' + (max ? Math.max(2, Math.round(v / max * 100)) : 0) + '%;background:' + (color || '#0d9488') })]); }
  function csv(name, rows) { var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }; var a = el('a', { download: name, href: URL.createObjectURL(new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv' })) }); document.body.append(a); a.click(); a.remove(); }
  function say(m) { if (typeof showToast === 'function') try { showToast(m, 'success'); } catch (e) { } }

  function draw() {
    var all = collect(), b = bounds();
    var rows = all.rows.filter(function (r) { return r.day >= b[0] && r.day <= b[1] && (src === 'all' || r.src === src); }), exp = all.exp.filter(function (e) { return e.day >= b[0] && e.day <= b[1]; });
    var rev = 0, disc = 0, tax = 0, gp = 0, known = 0, unk = 0, byDay = {}, prod = {}, cust = {}, cash = {}, hours = new Array(24).fill(0), pay = {}, bySrc = { POS: 0, Online: 0 };
    rows.forEach(function (r) {
      rev += r.total; disc += r.disc; tax += r.tax; bySrc[r.src] += r.total; var d = byDay[r.day] || (byDay[r.day] = { n: 0, rev: 0, gp: 0 }); d.n++; d.rev += r.total;
      var c = cust[r.who] || (cust[r.who] = { n: 0, rev: 0 }); c.n++; c.rev += r.total; if (r.cashier !== '—') { var k = cash[r.cashier] || (cash[r.cashier] = { n: 0, rev: 0 }); k.n++; k.rev += r.total; }
      if (r.hour != null) hours[r.hour] += r.total; for (var m in r.pay) pay[m] = (pay[m] || 0) + r.pay[m];
      var lineRev = r.lines.reduce(function (s, l) { return s + l.rev; }, 0) || 1;
      r.lines.forEach(function (l) {
        var p = prod[l.name] || (prod[l.name] = { qty: 0, rev: 0, gp: 0 }); var share = r.lines.length && lineRev ? l.rev / lineRev : 0, netRev = l.rev - r.disc * share; p.qty += l.qty; p.rev += netRev;
        if (l.cost != null) { var g = netRev - l.cost; p.gp += g; gp += g; d.gp += g; known += l.rev; } else unk += l.rev;
      });
    });
    var expAmt = exp.reduce(function (s, e) { return s + e.amt; }, 0), n = rows.length;
    state = { rows: rows, exp: exp, range: b };
    var f1 = el('select', { class: 'form-select form-select-sm', 'aria-label': 'Period', onchange: function () { range = this.value; draw(); } }, [['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['all', 'All time'], ['custom', 'Custom']].map(function (o) { var x = el('option', { value: o[0], text: o[1] }); if (o[0] === range) x.selected = true; return x; }));
    var f2 = el('select', { class: 'form-select form-select-sm', 'aria-label': 'Source', onchange: function () { src = this.value; draw(); } }, [['all', 'POS + Online'], ['POS', 'POS only'], ['Online', 'Online only']].map(function (o) { var x = el('option', { value: o[0], text: o[1] }); if (o[0] === src) x.selected = true; return x; }));
    var cu = range === 'custom' ? [el('input', { type: 'date', class: 'form-control form-control-sm', value: from, 'aria-label': 'From', onchange: function () { from = this.value; draw(); } }), el('input', { type: 'date', class: 'form-control form-control-sm', value: to, 'aria-label': 'To', onchange: function () { to = this.value; draw(); } })] : [];
    var bar0 = el('div', { class: 'd-flex flex-wrap gap-2 mb-3 align-items-center' }, [f1, f2].concat(cu, [el('button', { class: 'btn btn-sm btn-outline-primary', text: '⬇ CSV (all sales lines)', onclick: exportLines }), el('button', { class: 'btn btn-sm btn-outline-secondary', text: '🖨 Print', onclick: function () { window.print(); } })]));
    f1.style.maxWidth = f2.style.maxWidth = '11rem';
    var net = gp - expAmt, margin = known > 0 ? gp / known * 100 : 0;
    var kp = el('div', { class: 'row' }, [card('Revenue', tk(rev), n + ' orders · avg ' + tk(n ? rev / n : 0)), card('Gross profit', known ? tk(gp) : '—', known ? 'margin ' + margin.toFixed(1) + '%' : 'no cost data', 'text-success'), card('Expenses', tk(expAmt), exp.length + ' entries (Ops cashbook)', 'text-danger'), card('Net (profit − expenses)', known ? tk(net) : '—', 'discounts given ' + tk(disc), net >= 0 ? 'text-primary' : 'text-danger')]);
    var note = unk > 0.5 ? el('p', { class: 'text-muted small', text: 'ℹ️ ' + tk(unk) + ' of sales had no purchase price on record, so they are excluded from profit. Set purchase prices in Medicines for exact margins.' }) : null;
    var maxD = Math.max.apply(null, Object.keys(byDay).map(function (k) { return byDay[k].rev; }).concat([1]));
    var dayRows = Object.keys(byDay).sort().reverse().slice(0, 31).map(function (k) { return [k, byDay[k].n, tk(byDay[k].rev), tk(byDay[k].gp), bar(byDay[k].rev, maxD)]; });
    var pr = Object.keys(prod).map(function (k) { return [k, prod[k]]; }).sort(function (a, b) { return b[1].rev - a[1].rev; }).slice(0, 10), maxP = pr.length ? pr[0][1].rev : 1;
    var cr = Object.keys(cust).map(function (k) { return [k, cust[k]]; }).sort(function (a, b) { return b[1].rev - a[1].rev; }).slice(0, 8);
    var kr = Object.keys(cash).map(function (k) { return [k, cash[k]]; }).sort(function (a, b) { return b[1].rev - a[1].rev; });
    var pm = Object.keys(pay).map(function (k) { return [k, pay[k]]; }).sort(function (a, b) { return b[1] - a[1]; }), maxM = pm.length ? pm[0][1] : 1;
    var mh = Math.max.apply(null, hours.concat([1]));
    var heat = el('div', { style: 'display:flex;gap:2px;align-items:flex-end;height:70px;overflow-x:auto' }, hours.map(function (v, h) { return el('div', { title: h + ':00 — ' + tk(v), style: 'flex:1;min-width:14px;text-align:center;font-size:9px' }, [el('div', { style: 'background:#0d9488;opacity:' + (v ? (0.25 + 0.75 * v / mh).toFixed(2) : 0.08) + ';height:' + Math.max(3, Math.round(v / mh * 50)) + 'px;border-radius:3px' }), document.createTextNode(h)]); }));
    var sec = function (t, x) { return el('div', { class: 'card mb-3', style: 'padding:.9rem;border-radius:12px' }, [el('h6', { class: 'fw-bold mb-2', text: t }), x]); };
    pane.textContent = '';
    pane.append(el('h5', { class: 'fw-bold mb-3', text: '📈 Business summary — real data' }), bar0, kp);
    if (note) pane.append(note);
    pane.append(
      el('div', { class: 'row' }, [el('div', { class: 'col-lg-6' }, [sec('Daily trend (latest 31 days)', table(['Date', 'Orders', 'Revenue', 'Profit', ''], dayRows))]), el('div', { class: 'col-lg-6' }, [sec('Top products', table(['Product', 'Qty', 'Revenue', 'Profit', ''], pr.map(function (p) { return [p[0], p[1].qty, tk(p[1].rev), tk(p[1].gp), bar(p[1].rev, maxP, '#6366f1')]; }))),
        sec('Payment mix', table(['Method', 'Amount', ''], pm.map(function (p) { return [p[0], tk(p[1]), bar(p[1], maxM, '#f59e0b')]; }))) ])]),
      el('div', { class: 'row' }, [el('div', { class: 'col-lg-6' }, [sec('Top customers', table(['Customer', 'Orders', 'Spent'], cr.map(function (c) { return [c[0], c[1].n, tk(c[1].rev)]; })))]), el('div', { class: 'col-lg-6' }, [sec('Cashiers (POS)', table(['Cashier', 'Sales', 'Total'], kr.map(function (c) { return [c[0], c[1].n, tk(c[1].rev)]; }))), sec('Busy hours (revenue by hour, Dhaka time)', heat), sec('Channel split', el('p', { class: 'mb-0', text: 'POS ' + tk(bySrc.POS) + '  ·  Online ' + tk(bySrc.Online) }))])]));
  }
  function exportLines() {
    if (!state) draw(); var out = [['Date', 'Source', 'Ref', 'Customer', 'Cashier', 'Item', 'Qty', 'Revenue', 'Cost', 'Order total']];
    state.rows.forEach(function (r) { r.lines.forEach(function (l, i) { out.push([r.day, r.src, r.ref, r.who, r.cashier, l.name, l.qty, l.rev, l.cost == null ? '' : l.cost, i ? '' : r.total]); }); });
    if (out.length === 1) return say('Nothing to export for this period');
    csv('business-' + state.range[0] + '_' + state.range[1] + '.csv', out); say('CSV exported (' + (out.length - 1) + ' lines)');
  }
  // make the old stub buttons really export
  window.exportSalesTable = function () { var rows = [].slice.call(document.querySelectorAll('#salesTableBody tr')).map(function (tr) { return [].slice.call(tr.children).map(function (td) { return td.textContent.trim(); }); }); if (!rows.length) return say('Nothing to export'); csv('sales-table-' + today() + '.csv', rows); say('Sales table exported'); };
  window.exportAllReports = function () { state = null; draw(); exportLines(); };
  window.addEventListener('storage', function () { if (pane.classList.contains('active')) draw(); });
  window.addEventListener('mc-sale', function () { if (pane.classList.contains('active')) draw(); });
  if (location.hash === '#bizReport') link.click();
})();
