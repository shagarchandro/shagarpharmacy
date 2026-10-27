/* v83 — POS Billing আপডেট (pos-extra.js-এর পরে লোড হয়):
   • প্রতিটি বিক্রি নির্বাচিত গ্রাহকের সাথে যুক্ত হয় (customerId, ফোন) — আগে শুধু "বাকি" বিলে হতো; গ্রাহকের Purchase History/Ledger/মোট খরচ/শেষ ক্রয় এখন আপডেট হয়
   • "বাকি" বিলে আংশিক জমা: এখন কত নিচ্ছেন (বাকিটা বাকি), ক্রেডিট লিমিট যাচাই
   • গ্রাহক কার্ড: বাকি, ক্রেডিট লিমিট, টিয়ার/পয়েন্ট, শেষ ক্রয় · 💰 বাকি আদায় · 🔁 আগের অর্ডার আবার · ＋ নতুন গ্রাহক (ফোন যাচাই + ডুপ্লিকেট আটকানো)
   • বিক্রির পর ইনভয়েসে "💬 WhatsApp-এ রসিদ পাঠান" (গ্রাহকের ফোন থাকলে)
   সবই browser localStorage-এ; কোনো পেমেন্ট গেটওয়ে নেই। */
(function () {
  'use strict';
  var CK = 'pharmacy_customers';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wr(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(i) { return document.getElementById(i); }
  function money(n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
  function dk(ms) { return new Date(ms + 216e5).toISOString().slice(0, 10); }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); }
  function note(m, t) { if (window.showToast) showToast(m, t || 'info'); }
  function last10(p) { return String(p || '').replace(/\D/g, '').slice(-10); }
  function normPhone(p) { var n = String(p || '').replace(/\D/g, ''), d = String(p || '').replace(/[^\d+]/g, ''); if (/^(?:880|0)?1[3-9]\d{8}$/.test(n)) return { ok: true, pretty: '0' + n.slice(-10), wa: '880' + n.slice(-10) }; if (/^\+\d{8,15}$/.test(d)) return { ok: true, pretty: d, wa: n }; return { ok: false }; }
  function custs() { return rj(CK, []).filter(function (c) { return c && c.name; }); }
  function sel() { return $('customerSelect'); }
  function cur() { var v = sel() ? sel().value : '0'; return v === '0' ? null : custs().filter(function (c) { return String(c.id) === v; })[0] || null; }
  function allSales() { return rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status !== 'Voided'; }); }
  function mySales(c) { return allSales().filter(function (s) { return s.customerId != null ? String(s.customerId) === String(c.id) : s.customer === c.name; }); }
  function syncPosList() { var R = custs(); try { customers = R.map(function (c) { return { id: c.id, name: c.name, phone: c.phone || '', due: +c.due || 0 }; }); loadCustomers(); } catch (e) { } }
  var TIERS = [[50000, '🏆 Platinum'], [20000, '🥇 Gold'], [5000, '🥈 Silver']];

  var css = '.v83c{border:1px solid rgba(128,128,170,.35);border-radius:12px;padding:.6rem .8rem;margin:.5rem 0;font-size:.88rem}.v83c .r{display:flex;flex-wrap:wrap;gap:.3rem .9rem;margin:.2rem 0}.v83c .d{color:#dc2626;font-weight:700}' +
    '.v83c .cr{height:6px;border-radius:99px;background:rgba(128,128,170,.25);overflow:hidden;margin:.3rem 0}.v83c .cr i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#f59e0b,#ef4444)}' +
    '.v83b{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.4rem}.v83b button,.v83add button{border:1px solid rgba(128,128,170,.5);background:transparent;color:inherit;border-radius:999px;padding:.2rem .7rem;font-size:.82rem;cursor:pointer}.v83b button:hover,.v83add button:hover{background:rgba(102,126,234,.16)}' +
    '.v83add{display:none;gap:.4rem;flex-wrap:wrap;margin:.4rem 0}.v83add.on{display:flex}.v83add input{flex:1 1 130px;border:1px solid rgba(128,128,170,.5);border-radius:10px;padding:.3rem .6rem;background:transparent;color:inherit}' +
    '#v83Due{display:none;margin:.5rem 0}#v83Due.on{display:block}.v83wa{margin-top:.8rem;text-align:center}@media print{.v83wa,.v83c{display:none!important}}';
  var st0 = document.createElement('style'); st0.textContent = css; document.head.appendChild(st0);

  var s0 = sel(); if (!s0) return;
  var pxc = $('pxCust'); if (pxc) pxc.style.display = 'none';
  var card = document.createElement('div'); card.id = 'v83Cust'; card.className = 'v83c'; card.hidden = true;
  var add = document.createElement('div'); add.className = 'v83add'; add.id = 'v83Add';
  add.innerHTML = '<input id="v83Nm" placeholder="নাম" aria-label="নাম"><input id="v83Ph" type="tel" placeholder="ফোন 01XXXXXXXXX" aria-label="ফোন"><button type="button" id="v83Save">✔ সেভ</button><button type="button" id="v83Cx">✖</button>';
  var anchor = pxc || s0; anchor.after(card); card.after(add);
  var addBtn = document.createElement('button'); addBtn.type = 'button'; addBtn.id = 'v83New'; addBtn.className = 'btn btn-sm btn-outline-primary mt-1'; addBtn.textContent = '＋ নতুন গ্রাহক'; s0.after(addBtn);
  /* বাকি: এখন কত নিচ্ছেন */
  var due = document.createElement('div'); due.id = 'v83Due'; due.innerHTML = '<label class="form-label small fw-semibold" for="v83Paid">💰 এখন কত নিচ্ছেন (৳) — বাকিটা গ্রাহকের বাকিতে যাবে</label><input id="v83Paid" type="number" min="0" step="0.01" class="form-control rounded-3" placeholder="০ = পুরোটাই বাকি"><small class="text-muted" id="v83DueHint"></small>';
  var cashDiv = $('cashAmountDiv'); (cashDiv || s0).after(due);
  function dueUI() {
    var m = typeof selectedPaymentMethod !== 'undefined' ? selectedPaymentMethod : 'cash'; due.classList.toggle('on', m === 'due');
    if (m === 'due') { var c = cur(), t = calculateTotals().total, p = Math.min(Math.max(parseFloat($('v83Paid').value) || 0, 0), t); $('v83DueHint').textContent = c ? 'বাকি যাবে: ' + money(t - p) + ' · মোট বাকি হবে: ' + money((+c.due || 0) + t - p) + (+c.creditLimit > 0 ? ' / লিমিট ' + money(c.creditLimit) : '') : 'আগে একজন সেভ করা গ্রাহক বেছে নিন'; }
  }
  document.addEventListener('click', function (e) { if (e.target.closest('.payment-method')) setTimeout(dueUI, 0); });
  $('v83Paid').addEventListener('input', dueUI);

  function drawCard() {
    var c = cur(); if (!c) { card.hidden = true; return; } var L = mySales(c), spend = L.reduce(function (a, s) { return a + (+s.total || 0); }, 0), life = Math.max(spend, +c.totalPurchases || 0), tier = ''; for (var i = 0; i < TIERS.length; i++) if (life >= TIERS[i][0]) { tier = TIERS[i][1]; break; }
    var last = L.reduce(function (m, s) { var d = s.date || ''; return d > m ? d : m; }, ''), dueV = +c.due || 0, lim = +c.creditLimit || 0, use = lim ? Math.min(100, dueV / lim * 100) : 0;
    card.hidden = false;
    card.innerHTML = '<div class="r"><b>' + esc(c.name) + '</b><span>' + esc(c.phone || '') + '</span>' + (tier ? '<span>' + tier + '</span>' : '') + '<span>⭐ ' + bn(Math.floor(life / 100)) + '</span></div>' +
      '<div class="r"><span>বাকি: <b class="' + (dueV > 0 ? 'd' : '') + '">' + money(dueV) + '</b></span>' + (lim ? '<span>লিমিট: ' + money(lim) + '</span>' : '') + '<span>শেষ ক্রয়: ' + (last || '—') + '</span><span>বিল: ' + bn(L.length) + '</span></div>' + (lim ? '<div class="cr"><i style="width:' + use + '%"></i></div>' : '') +
      '<div class="v83b">' + (dueV > 0 ? '<button type="button" id="v83Col">💰 বাকি আদায়</button>' : '') + (L.length ? '<button type="button" id="v83Rep">🔁 আগের অর্ডার আবার</button>' : '') + '</div>';
    var b1 = $('v83Col'), b2 = $('v83Rep'); if (b1) b1.onclick = collect; if (b2) b2.onclick = repeat; dueUI();
  }
  s0.addEventListener('change', drawCard);

  /* ---------- বাকি আদায় ---------- */
  function ledgerAdd(e) { var L = rj('pharmacy_customer_ledger', []); e.id = Date.now() + Math.random(); e.at = new Date().toISOString(); L.push(e); wr('pharmacy_customer_ledger', L.slice(-500)); }
  function payAdd(cid, amount, method) { var P = rj('pharmacy_customer_payments', {}); (P[cid] = P[cid] || []).unshift({ date: dk(Date.now()), amount: amount, method: method || 'Cash' }); wr('pharmacy_customer_payments', P); }
  function collect() {
    var c = cur(); if (!c) return; var dueV = +c.due || 0; if (dueV <= 0) return;
    var run = function (v) {
      if (v === null || v === undefined) return; var amt = parseFloat(String(v).replace(/[^\d.]/g, '')) || 0;
      if (!(amt > 0)) return note('সঠিক পরিমাণ দিন', 'danger'); if (amt > dueV + 0.005) return note('বাকির (' + money(dueV) + ') চেয়ে বেশি নেওয়া যাবে না', 'warning');
      var C = rj(CK, []), i = C.findIndex(function (x) { return String(x.id) === String(c.id); }); if (i < 0) return; C[i].due = Math.max(0, +((+C[i].due || 0) - amt).toFixed(2)); wr(CK, C);
      payAdd(c.id, amt, 'Cash'); ledgerAdd({ customerId: c.id, type: 'payment', amount: amt, note: 'POS-এ বাকি আদায়' });
      syncPosList(); sel().value = String(c.id); drawCard(); note(money(amt) + ' আদায় হয়েছে — বাকি ' + money(C[i].due), 'success');
    };
    if (window.MCD && MCD.prompt) MCD.prompt(c.name + '-এর বাকি ' + money(dueV) + '। কত নিচ্ছেন (৳)?', String(dueV)).then(run); else run(window.prompt('কত নিচ্ছেন (৳)?', dueV));
  }
  /* ---------- আগের অর্ডার আবার ---------- */
  function repeat() {
    var c = cur(); if (!c) return; var L = mySales(c).sort(function (a, b) { return String(b.at || b.date) > String(a.at || a.date) ? 1 : -1; }); if (!L.length) return;
    var added = 0, skipped = [];
    (L[0].items || []).forEach(function (it) {
      var p = products.filter(function (x) { return String(x.id) === String(it.id); })[0]; if (!p || p.stock <= 0) { skipped.push(it.name); return; }
      var q = Math.min(+it.quantity || 1, p.stock); addToCart(p.id); if (q > 1) updateQuantity(p.id, q); added++;
    });
    note(added ? '🔁 ' + bn(added) + 'টি আইটেম কার্টে যোগ হয়েছে' + (skipped.length ? ' · স্টকে নেই: ' + skipped.join(', ') : '') : 'কোনো আইটেম স্টকে নেই', added ? 'success' : 'warning');
  }
  /* ---------- নতুন গ্রাহক ---------- */
  addBtn.onclick = function () { add.classList.toggle('on'); if (add.classList.contains('on')) $('v83Nm').focus(); };
  $('v83Cx').onclick = function () { add.classList.remove('on'); };
  $('v83Save').onclick = function () {
    var nm = $('v83Nm').value.trim(), p = normPhone($('v83Ph').value);
    if (nm.length < 2) return note('নাম লিখুন', 'danger'); if (!p.ok) return note('ফোন নম্বর ঠিক নেই (01XXXXXXXXX)', 'danger');
    var C = rj(CK, []), dup = C.filter(function (x) { return last10(x.phone) === last10(p.pretty); })[0];
    if (dup) { syncPosList(); sel().value = String(dup.id); drawCard(); add.classList.remove('on'); return note('এই নম্বরে আগেই আছেন — ' + dup.name + ' বেছে নেওয়া হয়েছে', 'info'); }
    var id = C.reduce(function (m, x) { return Math.max(m, +x.id || 0); }, 0) + 1;
    C.push({ id: id, name: nm, phone: p.pretty, email: '', address: '', type: 'regular', due: 0, totalPurchases: 0, joinDate: dk(Date.now()), creditLimit: 1000, notes: '' }); wr(CK, C);
    syncPosList(); sel().value = String(id); drawCard(); add.classList.remove('on'); $('v83Nm').value = ''; $('v83Ph').value = ''; note('✔ ' + nm + ' যোগ হয়েছে', 'success');
  };

  /* ---------- পেমেন্টে হুক ---------- */
  var origPay = window.processPayment;
  window.processPayment = function () {
    var m = typeof selectedPaymentMethod !== 'undefined' ? selectedPaymentMethod : 'cash', c = cur(), t = cart.length ? calculateTotals().total : 0, paidNow = null;
    if (m === 'due' && c && cart.length) {
      paidNow = Math.min(Math.max(parseFloat($('v83Paid').value) || 0, 0), t);
      var after = (+c.due || 0) + t - paidNow;
      if (+c.creditLimit > 0 && after > +c.creditLimit + 0.005) { note('ক্রেডিট লিমিট (' + money(c.creditLimit) + ') পেরিয়ে যাবে — মোট বাকি হতো ' + money(after) + '। আগে কিছু আদায় করুন বা বেশি জমা নিন।', 'danger'); return; }
    }
    var n0 = allSales().length, items = cart.map(function (i) { return { name: i.name, price: i.price, quantity: i.quantity }; });
    var r, err = null; try { r = origPay.apply(this, arguments); } catch (e) { err = e; }
    try {
      if (!(allSales().length > n0) || cart.length) { if (err) throw err; return r; }
      var S = rj('pharmacy_sales', []), l = S[S.length - 1]; if (!l || !l.real) return r;
      var total = +l.total || t, paid = total, dueAmt = 0;
      if (m === 'due' && c && paidNow !== null) { paid = paidNow; dueAmt = +(total - paidNow).toFixed(2); l.paidNow = paid; l.dueAmount = dueAmt; l.due = dueAmt > 0.005; l.paid = dueAmt <= 0.005; }
      if (c) {
        l.customerId = c.id; l.customerPhone = c.phone || ''; wr('pharmacy_sales', S);
        var C = rj(CK, []), i = C.findIndex(function (x) { return String(x.id) === String(c.id); });
        if (i >= 0) {
          C[i].totalPurchases = +((+C[i].totalPurchases || 0) + total).toFixed(2); C[i].lastVisit = l.date || dk(Date.now());
          if (m === 'due' && paid > 0) { C[i].due = Math.max(0, +((+C[i].due || 0) - paid).toFixed(2)); payAdd(c.id, paid, 'Cash'); ledgerAdd({ customerId: c.id, type: 'payment', amount: paid, invoiceNo: l.invoiceNo, note: 'POS — আংশিক জমা' }); }
          wr(CK, C);
        }
        var P = rj('pharmacy_customer_purchases', {}); (P[c.id] = P[c.id] || []).unshift({ invoice: l.invoiceNo, date: l.date || dk(Date.now()), total: total, paid: paid, due: dueAmt, status: dueAmt <= 0.005 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid') }); wr('pharmacy_customer_purchases', P);
      }
      syncPosList(); if (c) { sel().value = m === 'due' ? '0' : String(c.id); } drawCard();
      /* ইনভয়েসে অতিরিক্ত অংশ */
      var box = $('invoiceContent');
      if (box) {
        var cu2 = c ? custs().filter(function (x) { return x.id === c.id; })[0] : null, extra = '';
        if (m === 'due' && c) extra += '<div class="text-center small mt-2">পরিশোধ ' + money(paid) + ' · <b>বাকি ' + money(dueAmt) + '</b>' + (cu2 ? ' · মোট বাকি ' + money(cu2.due) : '') + '</div>';
        var ph = c ? normPhone(c.phone) : { ok: false };
        if (ph.ok) {
          var store = (rj('pharmacy_settings', {}).store || 'MediCare Pharmacy');
          var txt = '🧾 ' + store + '\nইনভয়েস: ' + l.invoiceNo + '\nতারিখ: ' + (l.date || '') + '\n\n' + items.map(function (x) { return '• ' + x.name + ' ×' + x.quantity + ' = ' + money(x.price * x.quantity); }).join('\n') + '\n\nমোট: ' + money(total) + (m === 'due' ? '\nপরিশোধ: ' + money(paid) + '\nবাকি: ' + money(dueAmt) : '') + '\n\nধন্যবাদ, আবার আসবেন! 💊';
          extra += '<div class="v83wa"><a class="btn btn-success btn-sm" target="_blank" rel="noopener" href="https://wa.me/' + ph.wa + '?text=' + encodeURIComponent(txt) + '">💬 WhatsApp-এ রসিদ পাঠান</a></div>';
        }
        if (extra) box.insertAdjacentHTML('beforeend', extra);
      }
      if ($('v83Paid')) $('v83Paid').value = '';
    } catch (e) { if (window.console) console.warn('pos-v83', e); }
    if (err) throw err;
    return r;
  };
  drawCard();
})();
