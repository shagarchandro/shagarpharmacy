/* Reports v52: replaces the remaining demo/fake parts of reports.html with real data.
   - Sales tab: voids excluded, "items" shows a count (not [object Object]), Top product is real, 12-month trend aligned.
   - Financial tab: real Profit & Loss / Balance sheet (simplified) / Cash flow for the chosen year, real monthly charts, current years.
   - Customer tab: real dues from Customers. Expiry tab: "Mark for discount" really sets a discount on the online shop product. */
(function () {
  'use strict';
  if (typeof salesData === 'undefined' || !window.mcBizCollect) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function el(t, a, kids) { var e = document.createElement(t); a = a || {}; for (var k in a) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(c); }); return e; }
  var tk = function (n) { n = +n || 0; return (n < 0 ? '−' : '') + '৳' + Math.abs(Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var dayOf = function (iso) { return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); };
  var MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ---------- sales tab
  function normalise() {
    salesData = salesData.filter(function (s) { return s && s.status !== 'Voided'; });
    salesData.forEach(function (s) { if (Array.isArray(s.items)) { s._lines = s.items; s.items = s.items.reduce(function (a, i) { return a + (+i.quantity || 1); }, 0); } });
  }
  normalise();
  getTopSellingProduct = function () {
    var q = {}; salesData.forEach(function (s) { (s._lines || []).forEach(function (l) { q[l.name] = (q[l.name] || 0) + (+l.quantity || 1); }); });
    var k = Object.keys(q).sort(function (a, b) { return q[b] - q[a]; })[0]; return k ? k + ' (' + q[k] + ')' : '—';
  };
  getMonthlySalesData = function () {
    var out = [], now = new Date(); for (var i = 11; i >= 0; i--) { var d = new Date(now.getFullYear(), now.getMonth() - i, 1), key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); out.push(salesData.reduce(function (a, s) { return a + (String(s.date).slice(0, 7) === key ? (+s.total || 0) : 0); }, 0)); }
    return out;
  };
  var _usr = updateSalesReport;
  updateSalesReport = function () { try { _usr(); } catch (e) { if (!/Chart|undefined|null/.test(String(e))) throw e; } document.getElementById('topProduct').textContent = getTopSellingProduct(); };
  var _rf = refreshAllReports; refreshAllReports = function () { _rf(); normalise(); updateSalesReport(); };

  // ---------- financial tab
  var yearSel = document.getElementById('financialYear'), typeSel = document.getElementById('financialType');
  var cy = +dayOf(Date.now()).slice(0, 4); yearSel.textContent = ''; for (var y = cy; y >= cy - 4; y--) yearSel.append(el('option', { value: y, text: y }));
  var box = el('div', { class: 'card report-card mb-4', id: 'finReal' }); var host = document.getElementById('financialReport'); host.append(box);
  function fin(year) {
    var all = mcBizCollect(), m = []; for (var i = 0; i < 12; i++) m.push({ rev: 0, disc: 0, ref: 0, cogs: 0, unk: 0, opex: 0, cashIn: {}, wo: 0 });
    var opexL = {};
    all.rows.forEach(function (r) { if (r.day.slice(0, 4) != year) return; var x = m[+r.day.slice(5, 7) - 1]; x.rev += r.total; x.disc += r.disc; for (var k in r.pay) x.cashIn[k] = (x.cashIn[k] || 0) + r.pay[k]; r.lines.forEach(function (l) { if (l.cost != null) x.cogs += l.cost; else x.unk += l.rev; }); });
    rj('pharmacy_refunds', []).forEach(function (r) { var d = dayOf(r.at || r.date); if (d.slice(0, 4) == year) m[+d.slice(5, 7) - 1].ref += +r.amount || 0; });
    all.exp.forEach(function (e) { if (e.day.slice(0, 4) != year || /^Supplier payment/i.test(e.what || '')) return; var x = m[+e.day.slice(5, 7) - 1]; x.opex += e.amt; var k = String(e.what || 'Other').slice(0, 40); opexL[k] = (opexL[k] || 0) + e.amt; });
    rj('pharmacy_writeoffs', []).forEach(function (w) { var d = w.date || (w.at && dayOf(w.at)); if (!d || d.slice(0, 4) != year) return; var x = m[+d.slice(5, 7) - 1]; x.opex += +w.loss || 0; opexL['Stock write-offs'] = (opexL['Stock write-offs'] || 0) + (+w.loss || 0); });
    return { m: m, opexL: opexL };
  }
  function sum(F, k) { return F.m.reduce(function (a, x) { return a + x[k]; }, 0); }
  function row(l, v, cls, bold) { var tr = el('tr', cls ? { class: cls } : {}, [el('td', { text: l }), el('td', { text: v, class: 'text-end' })]); if (bold) tr.style.fontWeight = '700'; return tr; }
  function render() {
    var year = yearSel.value, F = fin(year), type = typeSel.value, t = el('table', { class: 'table table-sm mb-0' }), b = el('tbody'); t.append(b);
    var rev = sum(F, 'rev'), ref = sum(F, 'ref'), cogs = sum(F, 'cogs'), opex = sum(F, 'opex'), unk = sum(F, 'unk'), net = rev - ref - cogs - opex, title, note = '';
    if (type === 'profit_loss') {
      title = 'Profit & Loss — ' + year; b.append(row('Sales revenue (POS + online)', tk(rev)), row('− Refunds', tk(-ref)), row('Net revenue', tk(rev - ref), '', 1), row('− Cost of goods sold (known purchase prices)', tk(-cogs)), row('Gross profit', tk(rev - ref - cogs), '', 1));
      Object.keys(F.opexL).sort(function (a, c) { return F.opexL[c] - F.opexL[a]; }).slice(0, 8).forEach(function (k) { b.append(row('− ' + k, tk(-F.opexL[k]))); });
      b.append(row('− Operating expenses total', tk(-opex)), row('Net profit', tk(net), net >= 0 ? 'table-success' : 'table-danger', 1));
      note = (unk > 0.5 ? tk(unk) + ' of sales have no purchase price recorded, so profit may be overstated. ' : '') + 'Supplier payments are not counted as expenses (their cost is in COGS). Discounts are already inside revenue.';
    } else if (type === 'cash_flow') {
      title = 'Cash flow — ' + year; var ci = {}; F.m.forEach(function (x) { for (var k in x.cashIn) ci[k] = (ci[k] || 0) + x.cashIn[k]; }); var tin = 0;
      Object.keys(ci).sort().forEach(function (k) { tin += ci[k]; b.append(row('+ Received via ' + k, tk(ci[k]))); });
      var sp = 0; rj('mc_db', { expenses: [] }).expenses.forEach(function (e) { if (e && e.at && dayOf(e.at).slice(0, 4) == year && /^Supplier payment/i.test(e.what || '')) sp += +e.amt || 0; });
      b.append(row('Total received', tk(tin), '', 1), row('− Refunds paid', tk(-ref)), row('− Operating expenses', tk(-opex)), row('− Supplier payments', tk(-sp)), row('Net cash movement', tk(tin - ref - opex - sp), tin - ref - opex - sp >= 0 ? 'table-success' : 'table-danger', 1));
      note = 'Based on recorded sales/payments only; customer dues are not yet cash.';
    } else {
      title = 'Balance sheet (simplified) — today'; var med = rj('pharmacy_medicines', []), inv = med.reduce(function (a, x) { return a + (+x.stock || 0) * (+x.purchasePrice || 0); }, 0), db = rj('mc_db', { products: [], batches: [] }), inv2 = 0;
      (db.batches || []).forEach(function (bt) { inv2 += (+bt.qty || 0) * (+bt.cost || 0); }); var cu = rj('pharmacy_customers', []), recv = cu.reduce(function (a, c) { return a + (+c.due || 0); }, 0);
      var cl = rj('pharmacy_closings', []).sort(function (a, c) { return a.date < c.date ? 1 : -1; })[0], cash = cl ? Math.max(0, cl.counted - (cl.deposit || 0)) : 0;
      b.append(row('Inventory at cost (dashboard medicines)', tk(inv)), row('Inventory at cost (online shop batches)', tk(inv2)), row('Customer dues (receivable)', tk(recv)), row('Cash in drawer (last closing' + (cl ? ' ' + cl.date : ': none') + ')', tk(cash)), row('Total assets counted here', tk(inv + inv2 + recv + cash), 'table-info', 1));
      note = 'Simplified: no bank balance, fixed assets or liabilities are tracked in this demo. The two inventory figures are separate stock lists.';
    }
    box.textContent = ''; box.append(el('div', { class: 'card-body' }, [el('h5', { class: 'fw-bold mb-3', text: title }), el('div', { class: 'table-responsive' }, [t]), note ? el('p', { class: 'text-muted small mt-2 mb-0', text: 'ℹ️ ' + note }) : null]));
    // KPI boxes and charts
    var nonStr = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    nonStr('totalRevenue', tk(rev - ref)); nonStr('totalExpenses', tk(cogs + opex)); nonStr('netProfit', tk(net));
    var rv = F.m.map(function (x) { return +(x.rev - x.ref).toFixed(2); }), ex = F.m.map(function (x) { return +(x.cogs + x.opex).toFixed(2); }), pf = F.m.map(function (x, i) { return +(rv[i] - ex[i]).toFixed(2); });
    window.__finSeries = { rv: rv, ex: ex, pf: pf };
    try { revenueExpenseChart.data.labels = MN; revenueExpenseChart.data.datasets[0].data = rv; revenueExpenseChart.data.datasets[1].data = ex; revenueExpenseChart.update(); profitTrendChart.data.labels = MN; profitTrendChart.data.datasets[0].data = pf; profitTrendChart.update(); } catch (e) { }
  }
  updateFinancialReport = render; getMonthlyRevenue = function () { return fin(yearSel.value).m.map(function (x) { return x.rev - x.ref; }); }; getMonthlyExpenses = function () { return fin(yearSel.value).m.map(function (x) { return x.cogs + x.opex; }); }; getMonthlyProfit = function () { return fin(yearSel.value).m.map(function (x) { return x.rev - x.ref - x.cogs - x.opex; }); };

  // ---------- customer tab: real dues
  var _gcd = getCustomerData;
  getCustomerData = function () {
    var list = _gcd(), real = rj('pharmacy_customers', []), by = {}; real.forEach(function (c) { by[String(c.name).toLowerCase()] = c; });
    list.forEach(function (c) { var r = by[String(c.name).toLowerCase()]; if (r) c.due = +r.due || 0; });
    return list;
  };

  // ---------- expiry tab: real "mark for discount"
  markForDiscount = function (name) {
    var D = rj('mc_db', null); var hit = D && (D.products || []).filter(function (p) { return String(p.name).toLowerCase().indexOf(String(name).toLowerCase().split(' ')[0]) === 0 && !p.hide; })[0];
    if (!hit) return showToast(name + ': no matching online shop product — set a discount in Control Center → Customer shop', 'info');
    var pct = +prompt('Discount % for ' + hit.name + ' in the online shop (1–90):', hit.disc || 20); if (!(pct > 0 && pct <= 90)) return showToast('Cancelled — enter 1–90', 'info');
    hit.disc = Math.round(pct * 10) / 10; localStorage.setItem('mc_db', JSON.stringify(D)); showToast(hit.name + ' now ' + hit.disc + '% off in the online shop', 'success');
  };
  window.addEventListener('mc-sale', function () { salesData = loadSalesFromStorage(); normalise(); updateSalesReport(); render(); });
  render(); updateSalesReport(); updateCustomerReport();
})();
