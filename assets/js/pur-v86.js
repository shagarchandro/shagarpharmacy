/* v86 — Purchase Management:
   • নতুন কেনার ফর্মে শেষ দাম / সবচেয়ে কম দাম + দাম বাড়লে সতর্কতা, মেয়াদ যাচাই (উত্তীর্ণ = ব্লক, ৯০ দিনের মধ্যে = নিশ্চিতকরণ)
   • 📉 Reorder suggestion: কম স্টকের ওষুধ নিজে থেকে তালিকায়
   • সেভের সময় সাপ্লায়ারের ক্রেডিট লিমিট চেক; সেভের পর ওষুধের কেনা-দাম/শেষ-ক্রয়/মেয়াদ হালনাগাদ; payment-terms অনুযায়ী dueDate
   • তালিকায় চিপ (সব/বাকি/ওভারডিউ/এই মাস) + সারাংশ + ⏰ ওভারডিউ ব্যাজ + 🗑 ভুল কেনা বাতিল (স্টক ও সাপ্লায়ার-বাকি ফেরত)
   • ?supplier=ID লিংকে সরাসরি নতুন কেনার ফর্ম (Suppliers পেজ থেকে) */
(function () {
  'use strict';
  if (typeof purchases === 'undefined' || !document.getElementById('purchasesTableBody')) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function $(i) { return document.getElementById(i); }
  var today = function () { return new Date(Date.now() + 216e5).toISOString().slice(0, 10); };
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var addDays = function (d, n) { var t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  var diff = function (a, b) { return Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 864e5); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function toast(m, t) { try { showToast(m, t || 'info'); } catch (e) { } }
  function audit(msg) { try { var a = rj('pharmacy_audit', []), u = rj('user', null) || {}; a.push({ at: new Date().toISOString(), by: u.name || u.role || 'staff', msg: msg }); localStorage.setItem('pharmacy_audit', JSON.stringify(a.slice(-300))); } catch (e) { } }
  function ask(msg) { return window.MCD && MCD.confirm ? MCD.confirm(msg) : Promise.resolve(confirm(msg)); }
  function terms(s) { var t = String((s && s.paymentTerms) || ''); var m = t.match(/(\d+)/); return m ? +m[1] : (/cash|advance|immediate/i.test(t) ? 0 : 30); }
  function dueDateOf(p) { if (p.dueDate) return p.dueDate; var s = suppliers.filter(function (x) { return x.id == p.supplierId; })[0]; return p.date ? addDays(p.date, terms(s)) : ''; }
  function overdueDays(p) { if (!(p.due > 0)) return 0; var d = dueDateOf(p); return d ? Math.max(0, diff(today(), d)) : 0; }

  /* ---------- দাম ইতিহাস ---------- */
  function history(mid) {
    var h = [];
    purchases.forEach(function (p) { (p.items || []).forEach(function (it) { if (it.medicineId == mid && +it.unitPrice > 0) h.push({ price: +it.unitPrice, date: p.date || '', sup: p.supplierName || '', id: p.id }); }); });
    h.sort(function (a, b) { return (b.date || '').localeCompare(a.date || '') || b.id - a.id; });
    return h;
  }
  var hint = document.createElement('div'); hint.id = 'v86Hint'; hint.className = 'small mt-1'; hint.setAttribute('aria-live', 'polite');
  function paintHint() {
    var sel = $('selectMedicine'), pr = $('purchasePrice'); if (!sel || !pr) return; var mid = sel.value; hint.textContent = ''; hint.className = 'small mt-1';
    if (!mid) return; var h = history(mid); if (!h.length) { hint.textContent = '🆕 এই ওষুধ আগে কেনা হয়নি।'; hint.classList.add('text-muted'); return; }
    var last = h[0], low = h.reduce(function (a, b) { return b.price < a.price ? b : a; }), cur = parseFloat(pr.value);
    var txt = '📈 শেষ কেনা ' + tk(last.price) + ' (' + last.sup + ', ' + last.date + ') · সবচেয়ে কম ' + tk(low.price) + ' (' + low.sup + ')';
    if (cur > 0 && last.price > 0) { var pc = Math.round((cur - last.price) / last.price * 100); if (pc >= 10) { txt += ' — ⚠ শেষ দামের চেয়ে ' + pc + '% বেশি'; hint.classList.add('text-danger'); } else if (pc <= -10) { txt += ' — ✅ ' + Math.abs(pc) + '% সস্তা'; hint.classList.add('text-success'); } }
    hint.textContent = txt;
  }
  var pp = $('purchasePrice'); if (pp && pp.parentNode.parentNode) { pp.parentNode.parentNode.appendChild(Object.assign(document.createElement('div'), { className: 'col-12' })).appendChild(hint); }
  ['selectMedicine', 'purchasePrice'].forEach(function (i) { var e = $(i); if (e) { e.addEventListener('change', function () { setTimeout(paintHint, 30); }); e.addEventListener('input', paintHint); } });

  /* ---------- আইটেম যোগ: যাচাই ---------- */
  var _add = window.addPurchaseItem, bypass = false;
  window.addPurchaseItem = function () {
    if (bypass) return _add.apply(this, arguments);
    var qty = parseInt(($('purchaseQty') || {}).value, 10), pr = parseFloat(($('purchasePrice') || {}).value), ex = ($('purchaseExpiry') || {}).value, mid = ($('selectMedicine') || {}).value;
    if (mid && (qty < 1 || pr <= 0)) { toast('পরিমাণ ও দাম ০-র বেশি হতে হবে', 'warning'); return; }
    if (mid && qty > 100000) { toast('পরিমাণ অস্বাভাবিক বেশি — আবার দেখুন', 'warning'); return; }
    if (ex && ex < today()) { toast('⛔ মেয়াদ উত্তীর্ণ ব্যাচ কেনা যাবে না (' + ex + ')', 'danger'); return; }
    var self = this, args = arguments;
    if (ex && diff(ex, today()) < 90) { ask('এই ব্যাচের মেয়াদ ৯০ দিনের মধ্যে শেষ (' + ex + ')। তবু যোগ করবেন?').then(function (v) { if (v) { bypass = true; try { _add.apply(self, args); } finally { bypass = false; } paintHint(); } }); return; }
    var r = _add.apply(this, arguments); setTimeout(paintHint, 30); return r;
  };

  /* ---------- Reorder suggestion ---------- */
  function reorderBtn() {
    var sup = $('purchaseSupplier'); if (!sup || $('v86Re')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'v86Re'; b.className = 'btn btn-sm btn-outline-warning mt-2'; b.textContent = '📉 কম স্টকের ওষুধ যোগ করুন'; b.title = 'স্টক ≤ minimum হলে স্বয়ংক্রিয় পরিমাণসহ';
    sup.parentNode.appendChild(b);
    b.addEventListener('click', function () {
      var sid = sup.value, mine = {};
      if (sid) purchases.forEach(function (p) { if (p.supplierId == sid) (p.items || []).forEach(function (it) { mine[it.medicineId] = 1; }); });
      var useMine = sid && Object.keys(mine).length > 0;
      var isLow = function (m) { var min = +m.minStock > 0 ? +m.minStock : 10; return (+m.stock || 0) <= min; };
      var low = medicines.filter(function (m) { return isLow(m) && (!useMine || mine[m.id]); });
      if (useMine && !low.length) { low = medicines.filter(isLow); useMine = false; }
      var have = {}; purchaseItems.forEach(function (i) { have[i.medicineId] = 1; });
      var n = 0;
      low.slice(0, 30).forEach(function (m) {
        if (have[m.id]) return; var min = +m.minStock > 0 ? +m.minStock : 10, q = Math.max(min * 2 - (+m.stock || 0), min), h = history(m.id), pr = (h[0] && h[0].price) || +m.purchasePrice || Math.round((+m.sellingPrice || +m.price || 0) * 0.8 * 100) / 100;
        if (!(pr > 0)) return; purchaseItems.push({ medicineId: m.id, medicineName: m.name, batchNo: '', expiryDate: '', qty: q, unitPrice: pr, total: Math.round(q * pr * 100) / 100 }); n++;
      });
      try { updatePurchaseItemsTable(); } catch (e) { }
      toast(n ? '📉 ' + n + 'টি ওষুধ যোগ হয়েছে' + (useMine ? ' (এই সাপ্লায়ারের আগের ওষুধ থেকে)' : '') + ' — ব্যাচ/মেয়াদ ও দাম দেখে নিন' : (low.length ? 'সবগুলো আগেই তালিকায় আছে বা দাম জানা নেই' : '✅ কোনো ওষুধ কম স্টকে নেই'), n ? 'success' : 'info');
    });
  }
  reorderBtn();

  /* ---------- সেভ: ক্রেডিট লিমিট + পরে হালনাগাদ ---------- */
  var _save = window.savePurchase, okLimit = false;
  window.savePurchase = function () {
    var sid = ($('purchaseSupplier') || {}).value, s = suppliers.filter(function (x) { return x.id == sid; })[0], total = parseFloat((($('purchaseTotalAmount') || {}).textContent || '').replace(/[^\d.]/g, '')) || 0, paid = parseFloat(($('paidAmount') || {}).value) || 0;
    if (s && !okLimit && purchaseItems.length && +s.creditLimit > 0 && (+s.due || 0) + Math.max(0, total - paid) > +s.creditLimit) {
      var self = this, args = arguments;
      ask((s.companyName || s.name) + '-এর ক্রেডিট লিমিট ' + tk(s.creditLimit) + '। এই কেনায় মোট বাকি হবে ' + tk((+s.due || 0) + total - paid) + '। তবু সেভ করবেন?').then(function (v) { if (v) { okLimit = true; try { window.savePurchase.apply(self, args); } finally { okLimit = false; } } });
      return;
    }
    var n0 = purchases.length, r = _save.apply(this, arguments);
    try {
      if (purchases.length > n0) {
        var p = purchases[0], sp = suppliers.filter(function (x) { return x.id == p.supplierId; })[0];
        p.dueDate = p.due > 0 ? addDays(p.date || today(), terms(sp)) : null;
        (p.items || []).forEach(function (it) {
          var m = medicines.filter(function (x) { return x.id === it.medicineId; })[0]; if (!m) return;
          var before = (+m.stock || 0) - it.qty;
          if (it.unitPrice > 0) m.purchasePrice = it.unitPrice;
          m.lastPurchase = { date: p.date, supplier: p.supplierName, price: it.unitPrice, batchNo: it.batchNo || '', expiry: it.expiryDate || '', invoiceNo: p.invoiceNo };
          if (it.expiryDate && (!m.expiryDate || before <= 0 || it.expiryDate < m.expiryDate)) { if (before <= 0 || !m.expiryDate) m.expiryDate = it.expiryDate; }
          if (it.batchNo && (before <= 0 || !m.batchNo)) m.batchNo = it.batchNo;
        });
        savePurchasesToStorage(); saveMedicinesToStorage();
        audit('Purchase ' + p.invoiceNo + ' from ' + p.supplierName + ' ' + tk(p.totalAmount) + ' (due ' + tk(p.due) + ')');
      }
    } catch (e) { console.warn('pur-v86 save', e); }
    return r;
  };

  /* ---------- তালিকা: চিপ, সারাংশ, ব্যাজ, বাতিল ---------- */
  var seg = 'all', host = document.createElement('div'); host.id = 'v86Bar'; host.className = 'mb-3';
  var lc = $('purchasesList'); if (lc) lc.insertBefore(host, lc.firstChild);
  var SEGS = [['all', 'সব'], ['due', '💰 বাকি আছে'], ['over', '⏰ ওভারডিউ'], ['month', '📅 এই মাস']];
  function segFilter(p) {
    if (seg === 'due') return p.due > 0; if (seg === 'over') return overdueDays(p) > 0; if (seg === 'month') return (p.date || '').slice(0, 7) === today().slice(0, 7); return true;
  }
  var _lp = window.loadPurchases;
  window.loadPurchases = function () {
    var all = purchases, shown;
    try { purchases = all.filter(segFilter); shown = purchases.slice(); _lp.apply(this, arguments); } finally { purchases = all; }
    try { decorate(shown); bar(shown); } catch (e) { console.warn('pur-v86 list', e); }
  };
  function decorate(shown) {
    var by = {}; shown.forEach(function (p) { by[p.id] = p; });
    [].forEach.call(document.querySelectorAll('#purchasesTableBody tr'), function (tr) {
      var b = tr.querySelector('button[onclick^="viewPurchase("]'); if (!b) return; var id = +b.getAttribute('onclick').match(/\d+/)[0], p = by[id]; if (!p) return;
      var od = overdueDays(p), cells = tr.children; if (od > 0 && cells[2] && !cells[2].querySelector('.v86od')) { var s = document.createElement('div'); s.className = 'v86od small text-danger fw-semibold'; s.textContent = '⏰ ' + od + ' দিন ওভারডিউ'; cells[2].appendChild(s); }
      else if (p.due > 0 && cells[2] && !cells[2].querySelector('.v86dd')) { var dd = dueDateOf(p); if (dd) { var s2 = document.createElement('div'); s2.className = 'v86dd small text-muted'; s2.textContent = 'দেনা: ' + dd; cells[2].appendChild(s2); } }
      if (!tr.querySelector('.v86x')) { var x = document.createElement('button'); x.type = 'button'; x.className = 'btn btn-sm btn-outline-secondary rounded-3 ms-1 v86x'; x.title = 'ভুল কেনা বাতিল (স্টক ও বাকি ফেরত)'; x.innerHTML = '🗑'; x.addEventListener('click', function () { cancelPurchase(id); }); b.parentNode.appendChild(x); }
    });
  }
  function bar(shown) {
    var tot = shown.reduce(function (a, p) { return a + (+p.totalAmount || 0); }, 0), due = shown.reduce(function (a, p) { return a + (+p.due || 0); }, 0), od = shown.filter(function (p) { return overdueDays(p) > 0; }).length;
    host.innerHTML = '<div class="d-flex flex-wrap gap-2 align-items-center">' + SEGS.map(function (s) { return '<button type="button" class="btn btn-sm rounded-pill ' + (seg === s[0] ? 'btn-primary' : 'btn-outline-secondary') + '" data-s="' + s[0] + '">' + s[1] + '</button>'; }).join('') +
      '<span class="small ms-auto text-muted">' + shown.length + 'টি · মোট ' + tk(tot) + ' · বাকি ' + tk(due) + (od ? ' · <b class="text-danger">' + od + 'টি ওভারডিউ</b>' : '') + '</span></div>';
    [].forEach.call(host.querySelectorAll('button[data-s]'), function (b) { b.addEventListener('click', function () { seg = b.getAttribute('data-s'); window.loadPurchases(); }); });
  }
  function cancelPurchase(id) {
    var p = purchases.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    if ((returns || []).some(function (r) { return r.purchaseId === id; })) { toast('এই কেনার রিটার্ন আছে — আগে রিটার্ন মিলিয়ে নিন, তাই বাতিল করা গেল না', 'warning'); return; }
    var short = [];
    (p.items || []).forEach(function (it) { var m = medicines.filter(function (x) { return x.id === it.medicineId; })[0]; if (m && (+m.stock || 0) < it.qty) short.push(it.medicineName + ' (স্টক ' + (+m.stock || 0) + ' < ' + it.qty + ')'); });
    if (short.length) { toast('স্টক ইতিমধ্যে বিক্রি হয়েছে: ' + short.join(', ') + ' — Purchase Return ব্যবহার করুন', 'warning'); return; }
    ask(p.invoiceNo + ' (' + (p.supplierName || '') + ', ' + tk(p.totalAmount) + ') বাতিল করবেন?\nস্টক কমে যাবে এবং সাপ্লায়ারের ' + tk(p.due) + ' বাকি ফেরত যাবে। এটি ভুল এন্ট্রির জন্য।').then(function (v) {
      if (!v) return;
      (p.items || []).forEach(function (it) { var m = medicines.filter(function (x) { return x.id === it.medicineId; })[0]; if (m) m.stock = Math.max(0, (+m.stock || 0) - it.qty); });
      var s = suppliers.filter(function (x) { return x.id == p.supplierId; })[0]; if (s) { s.due = Math.max(0, Math.round(((+s.due || 0) - (+p.due || 0)) * 100) / 100); s.totalPurchases = Math.max(0, (+s.totalPurchases || 0) - (+p.totalAmount || 0)); s.totalPayments = Math.max(0, (+s.totalPayments || 0) - (+p.paid || 0)); }
      var ix = purchases.indexOf(p); if (ix > -1) purchases.splice(ix, 1);
      var ar = rj('pharmacy_purchases_cancelled', []); ar.push(Object.assign({}, p, { cancelledAt: new Date().toISOString() })); localStorage.setItem('pharmacy_purchases_cancelled', JSON.stringify(ar.slice(-200)));
      savePurchasesToStorage(); saveSuppliersToStorage(); saveMedicinesToStorage(); audit('Cancelled purchase ' + p.invoiceNo + ' (' + (p.supplierName || '') + ', ' + tk(p.totalAmount) + ')');
      try { refreshAllData(); } catch (e) { window.loadPurchases(); } toast('🗑 কেনা বাতিল — স্টক ও বাকি ঠিক করা হয়েছে', 'success');
    });
  }
  window.v86CancelPurchase = cancelPurchase;
  window.loadPurchases();

  /* ---------- ?supplier=ID → সরাসরি নতুন কেনা ---------- */
  try {
    var q = new URLSearchParams(location.search), sid = q.get('supplier');
    if (sid && window.bootstrap) setTimeout(function () { try { resetPurchaseForm(); $('purchaseSupplier').value = sid; new bootstrap.Modal($('addPurchaseModal')).show(); } catch (e) { } }, 500);
  } catch (e) { }
})();
