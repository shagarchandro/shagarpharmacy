/* MediCare page insights: live summary strip + CSV export for the staff pages.
   Reads the same localStorage data the pages use; never writes business data. */
(function () {
  'use strict';
  var page = (location.pathname.split('/').pop() || '').replace('.html', '');
  var tk = function (n) { return '৳' + Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 }); };
  var VARS = { pharmacy_medicines: 'medicines', pharmacy_customers: 'customers', pharmacy_suppliers: 'suppliers', pharmacy_purchases: 'purchases', pharmacy_prescriptions: 'prescriptions' };
  var FNS = { pharmacy_medicines: 'loadMedicines', pharmacy_customers: 'loadCustomers', pharmacy_suppliers: 'loadSuppliers', pharmacy_prescriptions: 'loadPrescriptions' };
  function load(k) {
    // prefer the page's own in-memory list (it holds seeded demo data before anything is saved)
    try { if (localStorage.getItem(k) == null && FNS[k] && typeof (0, eval)(FNS[k]) === 'function') { var fb = (0, eval)(FNS[k] + '()'); if (Array.isArray(fb)) return fb; } } catch (e) {}
    if (VARS[k]) { try { var live = (0, eval)('typeof ' + VARS[k] + " !== 'undefined' ? " + VARS[k] + ' : null'); if (Array.isArray(live)) return live; } catch (e) {} } try { var v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  var today = new Date(Date.now() + 216e5).toISOString().slice(0, 10);
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
  function role() { try { return (JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || {}).role || ''; } catch (e) { return ''; } }
  function panel(title, rows, head, fileName) {
    var host = document.querySelector('#mainContent') || document.querySelector('.main-content'); if (!host) return;
    var old = document.getElementById('mcPanel'); if (old) old.remove();
    var d = document.createElement('details'); d.id = 'mcPanel'; d.open = rows.length > 0 && rows.length <= 12;
    d.style.cssText = 'background:#fff;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,.07);padding:.6rem 1rem;margin:0 0 1.25rem';
    var html = '<summary style="cursor:pointer;font-weight:700">' + title + ' <span style="color:#6b7280;font-weight:400">(' + rows.length + ')</span></summary>';
    if (!rows.length) html += '<p style="margin:.6rem 0;color:#10b981">✔ Nothing needs attention.</p>';
    else html += '<div style="overflow-x:auto;margin-top:.5rem"><table style="width:100%;font-size:.88rem;border-collapse:collapse"><tr>' + head.map(function (h) { return '<th style="text-align:left;padding:.3rem .5rem;border-bottom:1px solid #e5e7eb;white-space:nowrap">' + h + '</th>'; }).join('') + '</tr>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td style="padding:.3rem .5rem;border-bottom:1px solid #f1f5f9">' + String(c == null ? '' : c).replace(/[&<>]/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[x]; }) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>';
    d.innerHTML = html; var tools = document.getElementById('mcTools');
    (tools && tools.parentNode === host) ? host.insertBefore(d, tools.nextSibling) : host.appendChild(d);
    return d;
  }
  function attention(m) {
    var out = [];
    m.forEach(function (x) {
      if (x.expiryDate && x.expiryDate < today) out.push(['EXPIRED', x.name, x.batchNo, x.expiryDate, x.stock, x.rackNo, 'Remove from shelf / return to supplier']);
      else if (x.expiryDate && x.expiryDate <= in60) out.push(['Expiring', x.name, x.batchNo, x.expiryDate, x.stock, x.rackNo, 'Sell first / discount']);
      if (+x.stock <= +(x.minStock || 0)) out.push(['Low stock', x.name, x.batchNo, x.expiryDate, x.stock, x.rackNo, 'Reorder (min ' + (x.minStock || 0) + ')']);
    });
    return out;
  }
  function rxToday(sales) { return sales.filter(function (x) { return x.rx && x.date === today; }); }
  function me() { try { var u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || {}; return u.name || u.role || ''; } catch (e) { return ''; } }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function mySales(sales) { var n = me(); return sales.filter(function (x) { return x.date === today && x.cashier === n; }); }
  function lookupPanel(m) {
    var host = document.querySelector('.main-content'); if (!host) return; var old = document.getElementById('mcLook'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'mcLook'; d.style.cssText = 'background:#fff;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,.07);padding:.8rem 1rem;margin:0 0 1.25rem';
    d.innerHTML = '<b>🔎 Quick lookup (shelf, stock, price)</b><input id="mcLookQ" type="search" placeholder="Type medicine name or generic…" style="width:100%;margin:.5rem 0;padding:.5rem .8rem;border:1px solid #d1d5db;border-radius:10px"><div id="mcLookR" style="overflow-x:auto"></div>';
    var tools = document.getElementById('mcTools'); (tools && tools.parentNode === host) ? host.insertBefore(d, tools.nextSibling) : host.appendChild(d);
    function draw() {
      var q = document.getElementById('mcLookQ').value.trim().toLowerCase(), L = q ? m.filter(function (x) { return (x.name + ' ' + (x.genericName || '') + ' ' + (x.brand || '')).toLowerCase().indexOf(q) > -1; }).slice(0, 8) : [];
      document.getElementById('mcLookR').innerHTML = !q ? '<small style="color:#6b7280">Start typing to find where a medicine is kept.</small>' : (L.length ? '<table style="width:100%;font-size:.9rem;border-collapse:collapse"><tr><th style="text-align:left">Medicine</th><th>Rack</th><th>Stock</th><th>Price</th><th></th></tr>' +
        L.map(function (x) { var ex = x.expiryDate && x.expiryDate < today; return '<tr><td style="padding:.3rem 0">' + esc(x.name) + (x.rxRequired ? ' <span style="color:#dc2626;font-weight:700">Rx</span>' : '') + '</td><td style="text-align:center">' + esc(x.rackNo || '—') + '</td><td style="text-align:center">' + esc(x.stock) + '</td><td style="text-align:center">' + tk(x.sellingPrice) + '</td><td>' + (ex ? '<span style="color:#dc2626">EXPIRED</span>' : (+x.stock <= 0 ? '<span style="color:#dc2626">Out</span>' : '')) + '</td></tr>'; }).join('') + '</table>' : '<small>No match.</small>');
    }
    document.getElementById('mcLookQ').oninput = draw; draw();
  }
  function heldList() { try { return JSON.parse(localStorage.getItem('pharmacy_held') || '[]'); } catch (e) { return []; } }
  function holdBill() {
    var cart = (0, eval)('cart'); if (!cart || !cart.length) return alert('The cart is empty.');
    var h = heldList(); if (h.length >= 10) return alert('Too many held bills (10). Resume or clear one first.');
    var sel = document.getElementById('customerSelect'), sl = document.getElementById('discountSlider');
    h.push({ id: Date.now(), at: new Date().toISOString(), by: me(), cart: cart, customer: sel ? sel.value : '0', disc: sl ? sl.value : '0' });
    localStorage.setItem('pharmacy_held', JSON.stringify(h)); (0, eval)('cart = []; rxInfo = null; updateCart();'); P.sales();
  }
  function resumeBill() {
    var h = heldList(); if (!h.length) return alert('No held bills.');
    var M = window.MCD && MCD.enabled && MCD.enabled();
    function total(x) { return x.cart.reduce(function (a, c) { return a + c.total; }, 0); }
    if (M) {
      MCD.choose('কোন হোল্ড-করা বিলটি ফিরিয়ে আনবেন?', { title: 'হোল্ড বিল (' + h.length + ')', items: h.map(function (x, i) { return { value: i, label: new Date(x.at).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' }) + ' · ' + x.cart.length + ' আইটেম', sub: x.cart.slice(0, 3).map(function (c) { return c.name; }).join(', ') + (x.cart.length > 3 ? '…' : '') + ' — ' + x.by, right: tk(total(x)) }; }) }).then(function (i) {
        if (i == null) return;
        if ((0, eval)('cart.length')) MCD.confirm('বর্তমান কার্ট বদলে হোল্ড-করা বিলটি আনবেন?', { danger: false, ok: 'হ্যাঁ, বদলান' }).then(function (y) { if (y) doResume(h, i); });
        else doResume(h, i);
      });
      return;
    }
    var pick = prompt('Resume which bill?\n' + h.map(function (x, i) { return (i + 1) + '. ' + new Date(x.at).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka' }) + ' — ' + x.cart.length + ' item(s), ' + tk(total(x)) + ' (' + x.by + ')'; }).join('\n') + '\n\nEnter number:', '1');
    var i = parseInt(pick, 10) - 1; if (!(i >= 0 && i < h.length)) return;
    if ((0, eval)('cart.length') && !confirm('Replace the current cart with the held bill?')) return;
    doResume(h, i);
  }
  function doResume(h, i) {
    var b = h.splice(i, 1)[0]; localStorage.setItem('pharmacy_held', JSON.stringify(h));
    (0, eval)('products = loadProductsFromStorage(); cart = ' + JSON.stringify(b.cart) + '.map(function (c) { var p = products.find(function (x) { return x.id === c.id; }); if (!p || p.stock <= 0) return null; c.quantity = Math.min(c.quantity, p.stock); c.price = p.price; c.total = c.price * c.quantity; return c; }).filter(Boolean); updateCart();');
    var sel = document.getElementById('customerSelect'); if (sel) sel.value = b.customer; var sl = document.getElementById('discountSlider'), di = document.getElementById('discountInput');
    if (sl) { sl.value = Math.min(b.disc, sl.max || 100); if (di) di.value = sl.value; sl.dispatchEvent(new Event('input')); }
    P.sales();
  }
  function closeShift(sales) {
    var mine = mySales(sales), by = {}, tot = 0, tax = 0, disc = 0;
    mine.forEach(function (x) { by[x.paymentMethod] = (by[x.paymentMethod] || 0) + x.total; tot += x.total; tax += x.tax || 0; disc += x.discount || 0; });
    if (!mine.length) return alert('No sales recorded for you today.');
    var exp = by.cash || 0;
    if (window.MCD && MCD.enabled && MCD.enabled()) {
      MCD.prompt('ড্রয়ারে গোনা নগদ টাকা লিখুন।\nআপনার বিক্রি অনুযায়ী প্রত্যাশিত নগদ: ' + tk(exp), { title: 'শিফট ক্লোজ', icon: '🧮', chips: false, def: exp ? String(Math.round(exp * 100) / 100) : '', type: 'num', live: function (v) { if (v === '' || isNaN(+v)) return {}; var d = +v - exp; return { text: Math.abs(d) < 0.005 ? '✅ হিসাব মিলেছে' : (d > 0 ? '▲ বেশি ' : '▼ কম ') + tk(Math.abs(d)), cls: Math.abs(d) < 0.005 ? 'pos' : (d < 0 ? 'neg' : 'pos') }; } }).then(function (v) { if (v === null) return; finishShift(parseFloat(v), mine, by, tot, tax, disc); });
      return;
    }
    var counted = prompt('Cash counted in the drawer (৳)? Expected cash from your sales: ' + tk(exp));
    if (counted === null) return; finishShift(parseFloat(counted), mine, by, tot, tax, disc);
  }
  function finishShift(counted, mine, by, tot, tax, disc) {
    if (isNaN(counted) || counted < 0) return alert('Enter a valid amount.');
    var diff = counted - (by.cash || 0), rec = { id: Date.now(), date: today, by: me(), invoices: mine.length, total: +tot.toFixed(2), byMethod: by, counted: counted, diff: +diff.toFixed(2), at: new Date().toISOString() };
    var L = []; try { L = JSON.parse(localStorage.getItem('pharmacy_shifts') || '[]'); } catch (e) {} L.push(rec); localStorage.setItem('pharmacy_shifts', JSON.stringify(L));
    var w = window.open('', '_blank'); if (!w) return alert('Shift saved. Allow pop-ups to print the report.');
    w.document.write('<html><head><title>Shift report</title><style>body{font:14px system-ui;padding:20px;max-width:420px}td{padding:3px 8px}</style></head><body><h2>Shift report</h2><p>' + esc(me()) + ' · ' + today + '</p><table><tr><td>Invoices</td><td>' + mine.length + '</td></tr><tr><td>Total sales</td><td>' + tk(tot) + '</td></tr><tr><td>Discounts</td><td>' + tk(disc) + '</td></tr><tr><td>Tax</td><td>' + tk(tax) + '</td></tr>' +
      Object.keys(by).map(function (k) { return '<tr><td>' + esc(k) + '</td><td>' + tk(by[k]) + '</td></tr>'; }).join('') + '<tr><td><b>Cash counted</b></td><td>' + tk(counted) + '</td></tr><tr><td><b>Difference</b></td><td style="color:' + (diff < 0 ? '#dc2626' : '#059669') + '">' + (diff >= 0 ? '+' : '') + tk(diff) + '</td></tr></table><p style="margin-top:2rem">Signature: ____________</p><script>window.print()<\/script></body></html>');
    w.document.close();
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
        card('Low stock', low.length, low.length ? 'warn' : 'ok'), card('Rx medicines', m.filter(function (x) { return x.rxRequired; }).length)].concat(role() === 'staff' ? [] : [card('Stock value (cost)', tk(val))]),
        [['⬇ Export attention list', function () { csv('attention-' + today + '.csv', [['Issue', 'Medicine', 'Batch', 'Expiry', 'Stock', 'Rack', 'Action']].concat(attention(m))); }], ['⬇ Export CSV', function () {
          csv('medicines-' + today + '.csv', [['Name', 'Generic', 'Brand', 'Category', 'Batch', 'Barcode', 'Buy', 'Sell', 'Stock', 'Min stock', 'Expiry', 'Rack']].concat(
            m.map(function (x) { return [x.name, x.genericName, x.brand, x.category, x.batchNo, x.barcode, x.purchasePrice, x.sellingPrice, x.stock, x.minStock, x.expiryDate, x.rackNo]; })));
        }], ['🖨 Print list', function () { window.print(); }]]);
      var r = role(); if (r === 'staff') lookupPanel(m); if (r === 'pharmacist' || r === 'admin') panel('🩺 Needs attention — expiry & stock', attention(m), ['Issue', 'Medicine', 'Batch', 'Expiry', 'Stock', 'Rack', 'Action']);
    },
    customers: function () {
      var c = load('pharmacy_customers'), s = load('pharmacy_sales').filter(function (x) { return x.real && x.status !== 'Voided'; });
      var due = c.reduce(function (a, x) { return a + (+x.due || 0); }, 0), over = c.filter(function (x) { return +x.due > +(x.creditLimit || 0); });
      var m = today.slice(0, 7), mt = s.filter(function (x) { return (x.date || '').slice(0, 7) === m; }).reduce(function (a, x) { return a + x.total; }, 0);
      mount([card('Customers', c.length), card('Total outstanding due', tk(due), due ? 'warn' : 'ok'), card('Over credit limit', over.length, over.length ? 'bad' : 'ok'), card('POS sales this month', tk(mt), 'ok')], []);
    },
    sales: function () {
      var s = load('pharmacy_sales').filter(function (x) { return x.real && x.status !== 'Voided'; }), t = s.filter(function (x) { return x.date === today; });
      var sum = function (a) { return a.reduce(function (z, x) { return z + (+x.total || 0); }, 0); };
      var mine = mySales(s), isStaff = role() === 'staff', held = heldList().length;
      var cards = isStaff ? [card('My sales today', tk(sum(mine)), 'ok'), card('My invoices', mine.length), card('Held bills', held, held ? 'warn' : 'ok')]
        : [card("Today's sales", tk(sum(t)), 'ok'), card('Invoices today', t.length), card('All-time (POS)', tk(sum(s))), card('Avg. invoice', tk(s.length ? sum(s) / s.length : 0)), card('Rx sales today', rxToday(s).length), card('Held bills', held, held ? 'warn' : 'ok')];
      mount(cards,
        [['⏸ Hold bill', holdBill], ['▶ Resume held (' + held + ')', resumeBill], ['🧾 Close my shift', function () { closeShift(s); }]].concat(isStaff ? [] : [['⬇ Export sales CSV', function () {
          csv('sales-' + today + '.csv', [['Invoice', 'Date', 'Customer', 'Payment', 'Subtotal', 'Discount', 'Tax', 'Total', 'Items']].concat(
            s.map(function (x) { return [x.invoiceNo, x.date, x.customer, x.paymentMethod, x.subtotal, x.discount, x.tax, x.total, (x.items || []).map(function (i) { return i.name + ' x' + i.quantity; }).join('; ')]; })));
        }]]));
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
    prescriptions: function () {
      var r = load('pharmacy_prescriptions'), pend = r.filter(function (x) { return x.status === 'pending'; }), part = r.filter(function (x) { return x.status === 'partial'; });
      var stale = r.filter(function (x) { return (x.status === 'pending' || x.status === 'partial') && x.validUntil && x.validUntil < today; });
      var td = r.filter(function (x) { return x.filledDate === today; });
      mount([card('Pending', pend.length, pend.length ? 'warn' : 'ok'), card('Partly filled', part.length, part.length ? 'warn' : 'ok'), card('Past validity (unfilled)', stale.length, stale.length ? 'bad' : 'ok'), card('Filled today', td.length, 'ok'), card('Total prescriptions', r.length)],
        [['⬇ Export CSV', function () {
          csv('prescriptions-' + today + '.csv', [['Rx no', 'Patient', 'Phone', 'Doctor', 'Date', 'Valid until', 'Status', 'Filled on', 'Dispensed by', 'Medicines']].concat(
            r.map(function (x) { return [x.prescriptionNo, x.patientName, x.patientPhone, x.doctorName, x.prescriptionDate, x.validUntil, x.status, x.filledDate, x.dispensedBy, (x.medicines || []).map(function (m) { return m.name + ' (' + m.status + ')'; }).join('; ')]; })));
        }]]);
      if (role() === 'staff') { var bx = document.getElementById('mcIns'); if (bx) bx.insertAdjacentHTML('beforebegin', '<div style="background:#eef2ff;border:1px solid #c7d2fe;color:#3730a3;border-radius:12px;padding:.6rem .9rem;margin:0 0 .8rem">👀 View only — prescriptions are dispensed by the pharmacist. Tell the customer to wait and call the pharmacist.</div>'); }
      panel('⏳ Unfilled prescriptions', r.filter(function (x) { return x.status === 'pending' || x.status === 'partial'; }).map(function (x) { return [x.prescriptionNo, x.patientName, x.doctorName, x.validUntil || '—', (x.validUntil && x.validUntil < today) ? 'PAST VALIDITY' : x.status]; }), ['Rx no.', 'Patient', 'Doctor', 'Valid until', 'State']);
    },
    reports: function () {
      var m = load('pharmacy_medicines'), s = load('pharmacy_sales').filter(function (x) { return x.real && x.status !== 'Voided'; }), rxs = s.filter(function (x) { return x.rx; });
      mount([card('Expired batches', m.filter(function (x) { return x.expiryDate && x.expiryDate < today; }).length, 'bad'), card('Expiring in 60 days', m.filter(function (x) { return x.expiryDate && x.expiryDate >= today && x.expiryDate <= in60; }).length, 'warn'),
        card('Low stock', m.filter(function (x) { return +x.stock <= +(x.minStock || 0); }).length, 'warn'), card('Rx sales (all time)', rxs.length), card('Prescriptions dispensed', load('pharmacy_prescriptions').filter(function (x) { return x.status === 'filled'; }).length, 'ok')],
        [['⬇ Expiry & stock report', function () { csv('expiry-stock-' + today + '.csv', [['Issue', 'Medicine', 'Batch', 'Expiry', 'Stock', 'Rack', 'Action']].concat(attention(m))); }],
         ['⬇ Rx dispensing log', function () { csv('rx-dispensing-' + today + '.csv', [['Date', 'Invoice', 'Rx ref', 'Verified by', 'Patient/Customer', 'Items']].concat(rxs.map(function (x) { return [x.date, x.invoiceNo, x.rx.no, x.rx.by, x.customer, (x.items || []).map(function (i) { return i.name + ' x' + i.quantity; }).join('; ')]; }))); }]]);
      panel('📋 Rx dispensing log', rxs.slice(-10).reverse().map(function (x) { return [x.date, x.invoiceNo, x.rx.no, x.rx.by, x.customer]; }), ['Date', 'Invoice', 'Rx ref', 'Verified by', 'Customer']);
    },
    dashboard: function () {
      var m = load('pharmacy_medicines'), s = load('pharmacy_sales').filter(function (x) { return x.real && x.status !== 'Voided'; });
      var exp = m.filter(function (x) { return x.expiryDate && x.expiryDate < today; }).length, low = m.filter(function (x) { return +x.stock <= +(x.minStock || 0); }).length;
      var td = s.filter(function (x) { return x.date === today; }).reduce(function (a, x) { return a + x.total; }, 0);
      if (role() === 'staff') {
        var mine = mySales(s), rxp = load('pharmacy_prescriptions').filter(function (x) { return x.status === 'pending' || x.status === 'partial'; }).length;
        mount([card('My sales today', tk(mine.reduce(function (a, x) { return a + x.total; }, 0)), 'ok'), card('My invoices today', mine.length), card('Low stock items', low, low ? 'warn' : 'ok'), card('Expired (do not sell)', exp, exp ? 'bad' : 'ok'), card('Prescriptions waiting', rxp, rxp ? 'warn' : 'ok'), card('Held bills', heldList().length)],
          [['🧾 Open POS', function () { location.href = 'sales.html'; }], ['🔎 Find medicine', function () { location.href = 'medicines.html'; }]]);
        return;
      }
      var lb = localStorage.getItem('pharmacy_lastbackup'), lbd = lb ? Math.floor((Date.now() - new Date(lb)) / 864e5) : null;
      mount([card('Last backup', lb ? (lbd + ' day' + (lbd === 1 ? '' : 's') + ' ago') : 'Never', lb && lbd <= 7 ? 'ok' : 'bad'), card("Today's POS sales", tk(td), 'ok'), card('Expired medicines', exp, exp ? 'bad' : 'ok'), card('Low stock items', low, low ? 'warn' : 'ok'),
        card('Customer dues', tk(load('pharmacy_customers').reduce(function (a, x) { return a + (+x.due || 0); }, 0))), card('Payable to suppliers', tk(load('pharmacy_suppliers').reduce(function (a, x) { return a + (+x.due || 0); }, 0)))],
        [['🖨 Print / Save PDF', function () { window.print(); }], ['↻ Refresh', function () { P.dashboard(); }]]);
      var r = role();
      if (r === 'pharmacist' || r === 'admin') {
        var rx = load('pharmacy_prescriptions'), pend = rx.filter(function (x) { return x.status === 'pending' || x.status === 'partial'; });
        var stale = pend.filter(function (x) { return x.validUntil && x.validUntil < today; });
        var box = document.getElementById('mcIns');
        box.insertAdjacentHTML('beforeend', card('Rx waiting to dispense', pend.length, pend.length ? 'warn' : 'ok') + card('Rx past validity', stale.length, stale.length ? 'bad' : 'ok') + card('Rx dispensed today', rxToday(s).length, 'ok'));
        panel('🩺 Pharmacist worklist', pend.slice(0, 15).map(function (x) { return [x.prescriptionNo, x.patientName, x.doctorName, x.validUntil || '—', x.status, (x.medicines || []).length + ' item(s)']; }), ['Rx no.', 'Patient', 'Doctor', 'Valid until', 'Status', 'Items']);
      }
    }
  };
  if (!P[page]) return;
  function wrapTables() { document.querySelectorAll('table').forEach(function (t) { var p = t.parentElement; if (!p) return; if (p.classList.contains('table-responsive')) { p.style.overflowX = 'auto'; return; } if (getComputedStyle(p).overflowX === 'auto' || getComputedStyle(p).overflowX === 'scroll') return; var w = document.createElement('div'); w.className = 'table-responsive'; w.style.overflowX = 'auto'; p.insertBefore(w, t); w.appendChild(t); }); }
  var started = false;
  function seedStorage() { // persist the page's built-in demo data once, so every page (POS, dashboard, reports) sees the same records
    Object.keys(VARS).forEach(function (k) { try { if (localStorage.getItem(k) != null) return; var live = (0, eval)('typeof ' + VARS[k] + " !== 'undefined' ? " + VARS[k] + ' : null'); if (Array.isArray(live) && live.length) localStorage.setItem(k, JSON.stringify(live)); } catch (e) {} });
  }
  function start() { if (!started) { started = true; css(); try { seedStorage(); } catch (e) {} } try { wrapTables(); } catch (e) {} try { P[page](); } catch (e) { console.warn('insights', e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  addEventListener('load', start);
  ['storage','mc-sale','focus'].forEach(function (ev) { addEventListener(ev, function () { try { P[page](); } catch (e) {} }); });
})();
