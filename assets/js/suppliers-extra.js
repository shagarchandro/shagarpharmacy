/* Suppliers v55: payables overview — credit-limit use, overdue vs payment terms, one-tap call / WhatsApp reminder, CSV. */
(function () {
  'use strict';
  if (typeof suppliers === 'undefined' || !document.getElementById('suppliersGrid')) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function el(t, a, kids) { var e = document.createElement(t); a = a || {}; for (var k in a) { if (k === 'text') e.textContent = a[k]; else if (k.slice(0, 2) === 'on') e[k] = a[k]; else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(c); }); return e; }
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var days = function (d) { return Math.max(0, Math.floor((Date.now() - new Date(d)) / 864e5)); };
  var termDays = function (t) { var m = String(t || '').match(/(\d+)/); return m ? +m[1] : (/cash|advance|immediate/i.test(t || '') ? 0 : 30); };
  var host = el('div', { class: 'card mb-3', style: 'padding:.9rem;border-radius:12px;max-width:100%;overflow-x:auto' }), grid = document.getElementById('suppliersGrid');
  grid.parentNode.insertBefore(host, grid);
  function rows() {
    var P = rj('pharmacy_purchases', []);
    return suppliers.filter(function (s) { return s && s.id && (s.companyName || s.name); }).map(function (s) {
      var nm = s.companyName || s.name, open = P.filter(function (p) { return p.due > 0 && (p.supplierId == s.id || p.supplierName === nm); }), oldest = open.reduce(function (a, p) { return Math.max(a, days(p.date)); }, 0), terms = termDays(s.paymentTerms);
      var due = +s.due || 0, lim = +s.creditLimit || 0; return { s: s, nm: nm, due: due, lim: lim, use: lim ? due / lim * 100 : 0, open: open.length, oldest: oldest, terms: terms, over: open.length > 0 && oldest > terms, tp: +s.totalPurchases || 0 };
    });
  }
  function draw() {
    var R = rows().sort(function (a, b) { return b.due - a.due; }), tot = R.reduce(function (a, r) { return a + r.due; }, 0), over = R.filter(function (r) { return r.over; }).length, ovl = R.filter(function (r) { return r.lim && r.due > r.lim; }).length;
    var t = el('table', { class: 'table table-sm align-middle mb-0' }); t.append(el('thead', {}, [el('tr', {}, ['Supplier', 'Total purchased', 'Due', 'Credit used', 'Oldest unpaid', 'Terms', ''].map(function (h) { return el('th', { text: h }); }))]));
    var tb = el('tbody'); if (!R.length) tb.append(el('tr', {}, [el('td', { colspan: 7, class: 'text-muted', text: 'No suppliers yet.' })]));
    R.forEach(function (r) {
      var ph = String(r.s.phone || '').replace(/[^\d+]/g, ''), wa = ph ? 'https://wa.me/' + ph.replace(/^\+/, '') + '?text=' + encodeURIComponent('Hello ' + (r.s.contactPerson || r.nm) + ', this is a payment update from our pharmacy. Outstanding balance: ' + tk(r.due) + '. We will settle shortly. Thank you.') : '';
      var use = r.lim ? Math.round(r.use) + '%' : '—';
      tb.append(el('tr', {}, [el('td', { text: r.nm }), el('td', { text: tk(r.tp) }), el('td', { text: tk(r.due), class: r.due ? 'fw-bold' : 'text-success' }), el('td', { text: use + (r.lim && r.due > r.lim ? ' ⚠ over limit' : ''), class: r.lim && r.due > r.lim ? 'text-danger fw-bold' : r.use > 80 ? 'text-warning' : '' }),
        el('td', { text: r.open ? r.oldest + ' days (' + r.open + ' inv)' : '—', class: r.over ? 'text-danger fw-bold' : '' }), el('td', { text: r.terms ? r.terms + ' days' : 'Cash' }),
        el('td', {}, [ph ? el('a', { class: 'btn btn-sm btn-outline-secondary me-1', href: 'tel:' + ph, text: '📞', 'aria-label': 'Call ' + r.nm }) : null, wa && r.due ? el('a', { class: 'btn btn-sm btn-outline-success me-1', href: wa, target: '_blank', rel: 'noopener', text: '💬', 'aria-label': 'WhatsApp ' + r.nm }) : null, r.due ? el('a', { class: 'btn btn-sm btn-outline-primary', href: 'purchases.html', text: 'Pay →' }) : null])]));
    });
    host.textContent = '';
    host.append(el('div', { class: 'd-flex flex-wrap gap-2 align-items-center mb-2' }, [el('h6', { class: 'fw-bold mb-0 me-auto', text: '💳 Payables overview' }),
      el('span', { class: 'small', text: 'Total due ' + tk(tot) + ' · ' + (over ? over + ' overdue past terms' : 'none overdue') + (ovl ? ' · ' + ovl + ' over credit limit' : '') }),
      el('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary', text: '⬇ CSV', onclick: function () { var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }, rr = [['Supplier', 'Total purchased', 'Due', 'Credit limit', 'Open invoices', 'Oldest unpaid days', 'Terms days', 'Overdue']].concat(R.map(function (r) { return [r.nm, r.tp, r.due, r.lim, r.open, r.oldest, r.terms, r.over ? 'yes' : 'no']; })); var a = el('a', { download: 'supplier-payables.csv', href: URL.createObjectURL(new Blob(['﻿' + rr.map(function (x) { return x.map(q).join(','); }).join('\n')], { type: 'text/csv' })) }); document.body.append(a); a.click(); a.remove(); } })]), el('div', { class: 'table-responsive' }, [t]));
  }
  var _d = displaySuppliers; displaySuppliers = function () { _d.apply(this, arguments); try { draw(); } catch (e) { } };
  draw();
})();
