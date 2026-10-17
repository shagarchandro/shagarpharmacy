/* MediCare page insights: live summary strip + CSV export for the staff pages.
   Reads the same localStorage data the pages use; never writes business data. */
(function () {
  'use strict';
  var page = (location.pathname.split('/').pop() || '').replace('.html', '');
  var tk = function (n) { return '৳' + Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 }); };
  var VARS = { pharmacy_medicines: 'medicines', pharmacy_customers: 'customers', pharmacy_suppliers: 'suppliers', pharmacy_purchases: 'purchases' };
  function load(k) {
    // prefer the page's own in-memory list (it holds seeded demo data before anything is saved)
    if (VARS[k]) { try { var live = (0, eval)('typeof ' + VARS[k] + " !== 'undefined' ? " + VARS[k] + ' : null'); if (Array.isArray(live)) return live; } catch (e) {} } try { var v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  var today = new Date().toISOString().slice(0, 10);
  var in60 = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10);
  function cell(v) { var s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }
  function csv(name, rows) {
    var b = new Blob(['﻿' + rows.map(function (r) { return r.map(cell).join(','); }).join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  function css() {
    var s = document.createElement('style');
    s.textContent = '#mcIns{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.75rem;margin:0 0 1.25rem}' +
      '#mcIns .mc-c{background:#fff;border-radius:14px;padding:.8rem 1rem;box-shadow:0 2px 10px rgba(0,0,0,.07);border-left:4px solid #667eea;min-width:0}' +
      '#mcIns .mc-c b{display:block;font-size:1.35rem;line-height:1.2;overflow-wrap:anywhere}#mcIns .mc-c span{font-size:.8rem;color:#6b7280}' +
      '#mcIns .bad{border-left-color:#ef4444}#mcIns .warn{border-left-color:#f59e0b}#mcIns .ok{border-left-color:#10b981}' +
      '#mcTools{display:flex;flex-wrap:wrap;gap:.5rem;margin:0 0 1rem}#mcTools button{border:0;border-radius:999px;padding:.45rem 1rem;background:#eef0ff;color:#4338ca;font-weight:600;cursor:pointer}#mcTools button:hover{background:#e0e4ff}' +
      '@media(max-width:576px){#mcIns{grid-template-columns:1fr 1fr}#mcIns .mc-c b{font-size:1.1rem}}@media print{#mcTools{display:none}}';
    document.head.appendChild(s);
  }
  function card(label, val, cls) { return '<div class="mc-c ' + (cls || '') + '"><b>' + val + '</b><span>' + label + '</span></div>'; }
  function mount(cards, tools) {
    var host = document.querySelector('#mainContent') || document.querySelector('.main-content'); if (!host) return;
    var old = document.getElementById('mcIns'); if (old) old.remove(); var oldT = document.getElementById('mcTools'); if (oldT) oldT.remove();
    var hdr = host.querySelector(':scope > .d-flex') || host.firstElementChild;
    var box = document.createElement('div'); box.id = 'mcIns'; box.innerHTML = cards.join('');
    var tb = document.createElement('div'); tb.id = 'mcTools';
    tools.forEach(function (t) { var b = document.createElement('button'); b.type = 'button'; b.textContent = t[0]; b.onclick = t[1]; tb.appendChild(b); });
    if (hdr && hdr.nextSibling) { host.insertBefore(box, hdr.nextSibling); host.insertBefore(tb, box.nextSibling); }
    else { host.appendChild(box); host.appendChild(tb); }
  }
  var P = {
    medicines: function () {
      var m = load('pharmacy_medicines'), exp = m.filter(function (x) { return x.expiryDate && x.expiryDate < today; }),
        soon = m.filter(function (x) { return x.expiryDate && x.expiryDate >= today && x.expiryDate <= in60; }),
        low = m.filter(function (x) { return +x.stock <= +(x.minStock || 0); }),
        val = m.reduce(function (a, x) { return a + (+x.stock || 0) * (+x.purchasePrice || 0); }, 0);
      mount([card('Total medicines', m.length), card('Expired', exp.length, exp.length ? 'bad' : 'ok'), card('Expiring in 60 days', soon.length, soon.length ? 'warn' : 'ok'),
        card('Low stock', low.length, low.length ? 'warn' : 'ok'), card('Stock value (cost)', tk(val))],
        [['⬇ Export CSV', function () {
          csv('medicines-' + today + '.csv', [['Name', 'Generic', 'Brand', 'Category', 'Batch', 'Barcode', 'Buy', 'Sell', 'Stock', 'Min stock', 'Expiry', 'Rack']].concat(
            m.map(function (x) { return [x.name, x.genericName, x.brand, x.category, x.batchNo, x.barcode, x.purchasePrice, x.sellingPrice, x.stock, x.minStock, x.expiryDate, x.rackNo]; })));
        }], ['🖨 Print list', function () { window.print(); }]]);
    },
    customers: function () {
      var c = load('pharmacy_customers'), s = load('pharmacy_sales').filter(function (x) { return x.real; });
      var due = c.reduce(function (a, x) { return a + (+x.due || 0); }, 0), over = c.filter(function (x) { return +x.due > +(x.creditLimit || 0); });
      var m = today.slice(0, 7), mt = s.filter(function (x) { return (x.date || '').slice(0, 7) === m; }).reduce(function (a, x) { return a + x.total; }, 0);
      mount([card('Customers', c.length), card('Total outstanding due', tk(due), due ? 'warn' : 'ok'), card('Over credit limit', over.length, over.length ? 'bad' : 'ok'), card('POS sales this month', tk(mt), 'ok')], []);
    },
    sales: function () {
      var s = load('pharmacy_sales').filter(function (x) { return x.real; }), t = s.filter(function (x) { return x.date === today; });
      var sum = function (a) { return a.reduce(function (z, x) { return z + (+x.total || 0); }, 0); };
      mount([card("Today's sales", tk(sum(t)), 'ok'), card('Invoices today', t.length), card('All-time (POS)', tk(sum(s))), card('Avg. invoice', tk(s.length ? sum(s) / s.length : 0))],
        [['⬇ Export sales CSV', function () {
          csv('sales-' + today + '.csv', [['Invoice', 'Date', 'Customer', 'Payment', 'Subtotal', 'Discount', 'Tax', 'Total', 'Items']].concat(
            s.map(function (x) { return [x.invoiceNo, x.date, x.customer, x.paymentMethod, x.subtotal, x.discount, x.tax, x.total, (x.items || []).map(function (i) { return i.name + ' x' + i.quantity; }).join('; ')]; })));
        }]]);
    },
    purchases: function () {
      var p = load('pharmacy_purchases'), tot = p.reduce(function (a, x) { return a + (+x.totalAmount || 0); }, 0), due = p.reduce(function (a, x) { return a + (+x.due || 0); }, 0);
      mount([card('Purchase invoices', p.length), card('Total purchased', tk(tot)), card('Payable (due)', tk(due), due ? 'warn' : 'ok'), card('Unpaid invoices', p.filter(function (x) { return x.status !== 'paid'; }).length)],
        [['⬇ Export CSV', function () {
          csv('purchases-' + today + '.csv', [['Invoice', 'Date', 'Supplier', 'Total', 'Paid', 'Due', 'Status', 'Method']].concat(
            p.map(function (x) { return [x.invoiceNo, x.date, x.supplierName, x.totalAmount, x.paid, x.due, x.status, x.paymentMethod]; })));
        }]]);
    },
    suppliers: function () {
      var s = load('pharmacy_suppliers'), due = s.reduce(function (a, x) { return a + (+x.due || 0); }, 0), over = s.filter(function (x) { return +x.due > +(x.creditLimit || 0); });
      mount([card('Suppliers', s.length), card('Total payable', tk(due), due ? 'warn' : 'ok'), card('Over credit limit', over.length, over.length ? 'bad' : 'ok')], []);
    },
    dashboard: function () {
      var m = load('pharmacy_medicines'), s = load('pharmacy_sales').filter(function (x) { return x.real; });
      var exp = m.filter(function (x) { return x.expiryDate && x.expiryDate < today; }).length, low = m.filter(function (x) { return +x.stock <= +(x.minStock || 0); }).length;
      var td = s.filter(function (x) { return x.date === today; }).reduce(function (a, x) { return a + x.total; }, 0);
      var lb = localStorage.getItem('pharmacy_lastbackup'), lbd = lb ? Math.floor((Date.now() - new Date(lb)) / 864e5) : null;
      mount([card('Last backup', lb ? (lbd + ' day' + (lbd === 1 ? '' : 's') + ' ago') : 'Never', lb && lbd <= 7 ? 'ok' : 'bad'), card("Today's POS sales", tk(td), 'ok'), card('Expired medicines', exp, exp ? 'bad' : 'ok'), card('Low stock items', low, low ? 'warn' : 'ok'),
        card('Customer dues', tk(load('pharmacy_customers').reduce(function (a, x) { return a + (+x.due || 0); }, 0))), card('Payable to suppliers', tk(load('pharmacy_suppliers').reduce(function (a, x) { return a + (+x.due || 0); }, 0)))],
        [['🖨 Print / Save PDF', function () { window.print(); }], ['↻ Refresh', function () { P.dashboard(); }]]);
    }
  };
  if (!P[page]) return;
  function wrapTables() { document.querySelectorAll('table').forEach(function (t) { var p = t.parentElement; if (!p) return; if (p.classList.contains('table-responsive')) { p.style.overflowX = 'auto'; return; } if (getComputedStyle(p).overflowX === 'auto' || getComputedStyle(p).overflowX === 'scroll') return; var w = document.createElement('div'); w.className = 'table-responsive'; w.style.overflowX = 'auto'; p.insertBefore(w, t); w.appendChild(t); }); }
  var started = false;
  function start() { if (!started) { started = true; css(); } try { wrapTables(); } catch (e) {} try { P[page](); } catch (e) { console.warn('insights', e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  addEventListener('load', start);
  ['storage','mc-sale','focus'].forEach(function (ev) { addEventListener(ev, function () { try { P[page](); } catch (e) {} }); });
})();
