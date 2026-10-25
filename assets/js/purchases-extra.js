/* Purchases v54: payables aging by supplier, pay a supplier across their oldest invoices (FIFO), CSV export of purchases. */
(function () {
  'use strict';
  if (typeof purchases === 'undefined' || !document.getElementById('purchasesList')) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function el(t, a, kids) { var e = document.createElement(t); a = a || {}; for (var k in a) { if (k === 'text') e.textContent = a[k]; else if (k.slice(0, 2) === 'on') e[k] = a[k]; else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(c); }); return e; }
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var who = (function () { try { var u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); return (u && (u.name || u.role)) || ''; } catch (e) { return ''; } })();
  function audit(msg) { try { var a = rj('pharmacy_audit', []); a.push({ at: new Date().toISOString(), by: who, msg: msg }); localStorage.setItem('pharmacy_audit', JSON.stringify(a.slice(-300))); } catch (e) { } }
  function toast(m, t) { if (typeof showToast === 'function') showToast(m, t || 'success'); }
  function csvDl(name, rows) { var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }; var a = el('a', { download: name, href: URL.createObjectURL(new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv' })) }); document.body.append(a); a.click(); a.remove(); }
  var days = function (d) { return Math.max(0, Math.floor((Date.now() - new Date(d)) / 864e5)); };
  var host = el('div', { class: 'card mb-3', style: 'padding:.9rem;border-radius:12px;max-width:100%;overflow-x:auto' }), msg = el('div', { class: 'small text-muted', role: 'status' });
  var list = document.getElementById('purchasesList'); list.parentNode.insertBefore(host, list);
  function aging() {
    var by = {}; purchases.forEach(function (p) { if (!(p.due > 0)) return; var s = p.supplierName || ('#' + p.supplierId), a = by[s] || (by[s] = { id: p.supplierId, b: [0, 0, 0], n: 0 }), d = days(p.date); a.b[d <= 30 ? 0 : d <= 60 ? 1 : 2] += p.due; a.n++; });
    return by;
  }
  function draw() {
    var by = aging(), names = Object.keys(by).sort(function (a, b) { return (by[b].b[0] + by[b].b[1] + by[b].b[2]) - (by[a].b[0] + by[a].b[1] + by[a].b[2]); }), tot = [0, 0, 0];
    var t = el('table', { class: 'table table-sm align-middle mb-0' }); t.append(el('thead', {}, [el('tr', {}, ['Supplier', 'Open invoices', '0–30 days', '31–60', '60+ days', 'Total due', ''].map(function (h) { return el('th', { text: h }); }))]));
    var tb = el('tbody'); if (!names.length) tb.append(el('tr', {}, [el('td', { colspan: 7, class: 'text-muted', text: '✅ No supplier dues.' })]));
    names.forEach(function (s) { var a = by[s]; a.b.forEach(function (v, i) { tot[i] += v; }); var sum = a.b[0] + a.b[1] + a.b[2], pay = el('button', { type: 'button', class: 'btn btn-sm btn-outline-primary', text: 'Pay', onclick: function () { payFifo(s, a.id, sum); } });
      tb.append(el('tr', {}, [el('td', { text: s }), el('td', { text: a.n }), el('td', { text: tk(a.b[0]) }), el('td', { text: tk(a.b[1]), class: a.b[1] ? 'text-warning fw-bold' : '' }), el('td', { text: tk(a.b[2]), class: a.b[2] ? 'text-danger fw-bold' : '' }), el('td', { text: tk(sum), class: 'fw-bold' }), el('td', {}, [pay])])); });
    if (names.length) tb.append(el('tr', { class: 'fw-bold' }, [el('td', { text: 'Total' }), el('td'), el('td', { text: tk(tot[0]) }), el('td', { text: tk(tot[1]) }), el('td', { text: tk(tot[2]) }), el('td', { text: tk(tot[0] + tot[1] + tot[2]) }), el('td')]));
    t.append(tb); host.textContent = '';
    host.append(el('div', { class: 'd-flex flex-wrap gap-2 align-items-center mb-2' }, [el('h6', { class: 'fw-bold mb-0 me-auto', text: '📅 Supplier payables (aging)' }),
      el('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary', text: '⬇ Purchases CSV', onclick: exportCsv }), el('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary', text: '⬇ Payables CSV', onclick: function () { var r = [['Supplier', 'Open invoices', '0-30', '31-60', '60+', 'Total']]; names.forEach(function (s) { var a = by[s]; r.push([s, a.n, a.b[0], a.b[1], a.b[2], a.b[0] + a.b[1] + a.b[2]]); }); csvDl('payables.csv', r); } })]), el('div', { class: 'table-responsive' }, [t]), msg);
  }
  function payFifo(name, sid, max) {
    var v = prompt('Pay ' + name + ' (total due ' + tk(max) + ').\nAmount — applied to the OLDEST invoices first:', max); if (v === null) return; var amt = Math.round(parseFloat(v) * 100) / 100;
    if (!(amt > 0)) return toast('Enter a positive amount', 'warning'); if (amt > max + 0.001) return toast('That is more than the ' + tk(max) + ' due', 'warning');
    var left = amt, touched = 0; purchases.filter(function (p) { return p.due > 0 && ((p.supplierId == sid && sid != null) || p.supplierName === name); }).sort(function (a, b) { return String(a.date) < String(b.date) ? -1 : 1; }).forEach(function (p) {
      if (left <= 0) return; var x = Math.min(left, p.due); p.paid = Math.round(((+p.paid || 0) + x) * 100) / 100; p.due = Math.round((p.due - x) * 100) / 100; if (p.due <= 0.004) { p.due = 0; p.status = 'paid'; } else p.status = 'partial'; p.datePaid = new Date(Date.now() + 216e5).toISOString().slice(0, 10); left = Math.round((left - x) * 100) / 100; touched++;
    });
    var si = suppliers.findIndex(function (s) { return s.id == sid || s.name === name; }); if (si >= 0) suppliers[si].due = Math.max(0, Math.round(((+suppliers[si].due || 0) - amt) * 100) / 100);
    savePurchasesToStorage(); saveSuppliersToStorage();
    try { var D = rj('mc_db', null); if (D && D.expenses) { D.expenses.push({ at: new Date().toISOString(), what: 'Supplier payment: ' + name, amt: amt, cash: 1 }); localStorage.setItem('mc_db', JSON.stringify(D)); } } catch (e) { }
    audit('Paid supplier ' + name + ' ' + tk(amt) + ' across ' + touched + ' invoice(s)'); try { refreshAllData(); } catch (e) { } draw(); toast(tk(amt) + ' paid to ' + name + ' (' + touched + ' invoice' + (touched > 1 ? 's' : '') + ')');
  }
  function exportCsv() {
    var r = [['Invoice', 'Date', 'Supplier', 'Medicine', 'Batch', 'Expiry', 'Qty', 'Unit cost', 'Invoice total', 'Paid', 'Due', 'Status']];
    purchases.forEach(function (p) { (p.items && p.items.length ? p.items : [{}]).forEach(function (i, n) { r.push([p.invoiceNo, p.date, p.supplierName, i.medicineName || i.name || '', i.batchNo || i.batch || '', i.expiryDate || i.expiry || '', i.qty || '', i.price || i.unitPrice || '', n ? '' : p.totalAmount, n ? '' : p.paid, n ? '' : p.due, p.status]); }); });
    csvDl('purchases-' + new Date(Date.now() + 216e5).toISOString().slice(0, 10) + '.csv', r);
  }
  var _r = refreshAllData; refreshAllData = function () { _r.apply(this, arguments); try { draw(); } catch (e) { } };
  draw();
})();
