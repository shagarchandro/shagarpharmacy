/* v100 — Online Shop: অর্ডার চেকআউট + পেমেন্ট (store-v99.js এর পরে)
   চেকআউট:
   • অর্ডারের আইটেম-তালিকা (পরিমাণ × দাম) + "কার্ট সম্পাদনা"
   • কুপন সরাসরি চেকআউটে (কুপনের নিয়ম store-coupons.js মানে)
   • 🎁 অন্য কারও জন্য? — প্রাপকের নাম/ফোন · ডেলিভারির আগে কল · 🚪 দরজার সামনে রেখে যান
   • 💵 COD: কত টাকার নোট দেবেন (রাইডার খুচরা আনবে)
   • শেষ ব্যবহৃত পেমেন্ট মেথড মনে রাখে; "Place order" ডাবল-ক্লিক সুরক্ষা
   পেমেন্ট:
   • Wallet: 📋 নম্বর কপি, যে নম্বর থেকে পাঠিয়েছেন (যাচাইয়ের জন্য), একই TrxID আবার ব্যবহার ঠেকানো (অন্য অর্ডার/POS বিক্রিতে থাকলে)
   • অর্ডার তালিকায় 💳 পেমেন্ট-অবস্থা (পরিশোধিত / যাচাই চলছে / ব্যর্থ / ফেরত) + ভুল TrxID হলে সংশোধন (সর্বোচ্চ ৩ বার)
   ডেমো: কোনো আসল পেমেন্ট গেটওয়ে নেই; সার্ভার-মোডে নতুন ফিল্ড অর্ডারে নাও যেতে পারে। */
(function () {
  'use strict';
  if (typeof views === 'undefined' || typeof h !== 'function' || typeof db !== 'function' || typeof render !== 'function' || typeof place !== 'function') return;
  var isBn = function () { try { return typeof lang === 'function' && lang() === 'bn'; } catch (e) { return false; } };
  var tx = function (b, e) { return isBn() ? b : e; };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var $1 = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var say = function (m, bad) { try { toast(m, bad); } catch (e) { } };
  var PH = /^(\+?88)?01[3-9]\d{8}$/, TRX = /^[A-Z0-9-]{6,20}$/;
  var isW = function (v) { return /^(bKash|Nagad|Rocket|Upay)/i.test(v || ''); };
  var isCod = function (v) { return /^cash/i.test(v || ''); };

  document.head.appendChild(h('style', {}, '.v100sum{border:1px solid #d6dbe6;border-radius:12px;padding:.5rem .8rem;margin:.6rem 0}.v100sum table{width:100%;border-collapse:collapse;font-size:.92rem}.v100sum td{padding:.2rem .3rem;border-bottom:1px dashed #d6dbe6}.v100sum td:last-child{text-align:right}' +
    '.v100cp{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin:.5rem 0}.v100ok{background:#dcfce7;color:#166534;border-radius:999px;padding:.1rem .6rem;font-size:.85rem}.v100opt{display:flex;gap:1rem;flex-wrap:wrap;margin:.4rem 0}.v100opt label{display:flex;gap:.3rem;align-items:center}' +
    '.v100pay{border-radius:10px;padding:.35rem .6rem;margin:.35rem 0;font-size:.88rem;display:block}.v100pay.ok{background:#dcfce7;color:#166534}.v100pay.wait{background:#fef3c7;color:#92400e}.v100pay.bad{background:#fee2e2;color:#b91c1c}.v100pay.info{background:#e0ecff;color:#1e3a8a}'));

  function trxUsed(ref, exceptNo) {
    ref = String(ref || '').trim().toUpperCase(); if (!ref) return false;
    var d = db(); if ((d.orders || []).some(function (o) { return o.no !== exceptNo && o.status !== 'Cancelled' && String(o.payRef || '').toUpperCase() === ref; })) return true;
    return rj('pharmacy_sales', []).some(function (s) { return s && s.status !== 'Voided' && String(s.payRef || '').toUpperCase() === ref; });
  }

  /* ---------- চেকআউট সাজানো ---------- */
  function checkout() {
    var f = $1('#app form'); if (!f || $1('.v100sum', f) || !f.elements.pay) return;
    var c = cart(), ids = Object.keys(c), P = D.products, rows = ids.map(function (id) { var p = P.filter(function (x) { return x.id === id; })[0]; return p ? [p, c[id]] : null; }).filter(Boolean);
    var sum = h('details', { class: 'v100sum', open: true }, h('summary', {}, '🧾 ' + tx('আপনার অর্ডার', 'Your order') + ' (' + rows.reduce(function (a, r) { return a + r[1]; }, 0) + ')'),
      h('table', {}, h('tbody', {}, rows.map(function (r) { return h('tr', {}, h('td', {}, r[0].name, r[0].rx ? ' ℞' : ''), h('td', {}, '× ' + r[1]), h('td', {}, money(eff(r[0]) * r[1]))); }))), h('a', { href: '#/cart', style: 'font-size:.85rem' }, '✏ ' + tx('কার্ট সম্পাদনা', 'Edit cart')));
    var h1 = $1('h1', f); if (h1) h1.insertAdjacentElement('afterend', sum); else f.prepend(sum);
    /* কুপন */
    var cp = h('div', { class: 'v100cp' });
    if (typeof applied !== 'undefined' && applied) cp.append(h('span', { class: 'v100ok' }, '🎟 ' + applied.code + ' −' + (applied.pct || 0) + '%'), h('button', { type: 'button', class: 'btn2', onclick: function () { applied = null; render(); } }, '✕'));
    else {
      var ci = h('input', { placeholder: tx('কুপন কোড', 'Coupon code'), 'aria-label': 'Coupon', maxlength: 20, style: 'max-width:160px;text-transform:uppercase' });
      cp.append(ci, h('button', { type: 'button', class: 'btn2', onclick: function () {
        D = db(); var code = ci.value.trim().toUpperCase(), k = (D.coupons || []).filter(function (x) { return x.code === code; })[0];
        if (!k) return say(tx('কুপনটি সঠিক নয়', 'Invalid coupon'), 1);
        var pr = typeof mcCouponProblem === 'function' ? mcCouponProblem(k) : ''; if (pr) return say(pr, 1);
        var sub = totals(f.elements.area ? f.elements.area.value : 'dhaka').sub; if (k.min && sub < k.min) return say(tx('ন্যূনতম অর্ডার ', 'Minimum order ') + money(k.min), 1);
        applied = k; say(tx('কুপন প্রযোজ্য হয়েছে', 'Coupon applied')); render();
      } }, tx('প্রয়োগ', 'Apply')));
    }
    sum.insertAdjacentElement('afterend', cp);
    /* Wallet + COD অতিরিক্ত */
    var sel = f.elements.pay, st0 = D.settings || {}, num = st0.payNum || {};
    var from = h('label', { id: 'v100FromL' }, tx('যে নম্বর থেকে পাঠিয়েছেন', 'Number you paid from'), h('input', { name: 'payfrom', type: 'tel', maxlength: 14, placeholder: '01XXXXXXXXX', autocomplete: 'tel' }), h('small', { class: 'err', id: 'e-payfrom' }));
    var copy = h('button', { type: 'button', class: 'btn2', id: 'v100Copy' }, '📋 ' + tx('নম্বর কপি', 'Copy number'));
    copy.onclick = function () { var m = (sel.value.match(/^(bKash|Nagad|Rocket)/) || [])[1], n = m && num[m]; if (!n) return say(tx('এই মেথডের নম্বর সেট করা নেই', 'No number set for this method'), 1); try { navigator.clipboard.writeText(n).then(function () { say(tx('নম্বর কপি হয়েছে: ', 'Copied: ') + n); }, function () { say(n); }); } catch (e) { say(n); } };
    var cash = h('label', { id: 'v100CashL' }, tx('কত টাকার নোট দেবেন? (ঐচ্ছিক — রাইডার খুচরা আনবে)', 'Which note will you pay with? (optional — rider brings change)'), h('input', { name: 'cashgiven', type: 'number', min: 0, step: 1, placeholder: '৳' }), h('small', { class: 'err', id: 'e-cashgiven' }));
    var note = $1('#payNote'), anchor = $1('#payRefL', f) || note || sel.closest('label');
    anchor.insertAdjacentElement('afterend', from); from.insertAdjacentElement('afterend', cash); from.insertAdjacentElement('beforebegin', copy);
    var upd = function () { var v = sel.value, w = isW(v); from.style.display = w && !st0.payNoRef ? '' : 'none'; copy.style.display = w ? '' : 'none'; cash.style.display = isCod(v) ? '' : 'none'; };
    sel.addEventListener('change', upd); upd();
    /* শেষ পেমেন্ট মেথড মনে রাখা */
    try { var lp = localStorage.getItem('mc_lastpay'); if (lp && [].some.call(sel.options, function (o) { return o.value === lp || o.textContent === lp; }) && !f.__v100) { sel.value = lp; sel.dispatchEvent(new Event('change')); upd(); } } catch (e) { }
    f.__v100 = 1;
    sel.addEventListener('change', function () { try { localStorage.setItem('mc_lastpay', sel.value); } catch (e) { } });
    /* প্রাপক + ডেলিভারি অপশন */
    var other = h('input', { type: 'checkbox', id: 'v100Other' }), rn = h('input', { name: 'rname', maxlength: 40, placeholder: tx('প্রাপকের নাম', 'Recipient name') }), rp = h('input', { name: 'rphone', type: 'tel', maxlength: 14, placeholder: tx('প্রাপকের মোবাইল', 'Recipient mobile') });
    var rbox = h('div', { class: 'row', style: 'display:none;gap:.4rem' }, rn, rp, h('small', { class: 'err', id: 'e-rphone' }));
    other.onchange = function () { rbox.style.display = other.checked ? 'flex' : 'none'; };
    var opts = h('div', {}, h('label', { style: 'display:flex;gap:.3rem;align-items:center' }, other, '🎁 ' + tx('অন্য কারও জন্য অর্ডার করছেন?', 'Ordering for someone else?')), rbox,
      h('div', { class: 'v100opt' }, h('label', {}, h('input', { type: 'checkbox', name: 'callfirst', checked: true }), '📞 ' + tx('ডেলিভারির আগে কল করুন', 'Call before delivery')), h('label', {}, h('input', { type: 'checkbox', name: 'contactless' }), '🚪 ' + tx('দরজার সামনে রেখে যান', 'Leave at the door'))));
    var sub = $1('button[type=submit], button:not([type])', f); if (sub) sub.insertAdjacentElement('beforebegin', opts); else f.append(opts);
  }

  /* ---------- place র‍্যাপ ---------- */
  var _pl = place;
  place = function (f, rx) {
    var el = (f && f.elements) || {}, pay = el.pay ? el.pay.value : '', ref = el.payref ? el.payref.value.trim().toUpperCase() : '', er = function (id, m) { var e = document.getElementById(id); if (e) e.textContent = m || ''; };
    ['e-payfrom', 'e-rphone', 'e-cashgiven'].forEach(function (i) { er(i, ''); });
    D = db(); var tot = totals(el.area ? el.area.value : 'dhaka').total;
    if (isW(pay)) {
      if (ref && TRX.test(ref) && trxUsed(ref)) { er('e-payref', tx('এই TrxID আগেই ব্যবহার হয়েছে', 'This TrxID was already used')); return say(tx('এই TrxID অন্য একটি অর্ডার/বিক্রিতে ব্যবহৃত — সঠিক TrxID দিন', 'This TrxID is already used on another order/sale'), 1); }
      if (!(D.settings || {}).payNoRef) { var pf = el.payfrom ? el.payfrom.value.trim() : ''; if (!PH.test(pf)) { er('e-payfrom', tx('সঠিক মোবাইল নম্বর দিন', 'Enter a valid mobile number')); return say(tx('যে নম্বর থেকে পেমেন্ট করেছেন সেটি দিন', 'Enter the number you paid from'), 1); } }
    }
    if (el.rname && $1('#v100Other') && $1('#v100Other').checked) { if (el.rname.value.trim().length < 2 || !PH.test(el.rphone.value.trim())) { er('e-rphone', tx('প্রাপকের নাম ও সঠিক মোবাইল দিন', 'Enter the recipient name and a valid mobile')); return say(tx('প্রাপকের নাম ও সঠিক মোবাইল দিন', 'Enter the recipient name and a valid mobile'), 1); } }
    if (isCod(pay) && el.cashgiven && el.cashgiven.value !== '' && +el.cashgiven.value < tot) { er('e-cashgiven', tx('মোট ' + money(tot) + '-এর কম হতে পারে না', 'Cannot be below ' + money(tot))); return say(tx('নোটের পরিমাণ মোটের চেয়ে কম', 'Cash amount is below the total'), 1); }
    var x = { from: el.payfrom ? el.payfrom.value.trim() : '', rec: $1('#v100Other') && $1('#v100Other').checked ? { name: el.rname.value.trim(), phone: el.rphone.value.trim() } : null, call: !!(el.callfirst && el.callfirst.checked), door: !!(el.contactless && el.contactless.checked), cash: el.cashgiven && el.cashgiven.value !== '' ? +el.cashgiven.value : null };
    var btn = $1('button[type=submit], button:not([type])', f), n0 = (db().orders || []).length; if (btn) { btn.disabled = true; }
    var r; try { r = _pl.apply(this, arguments); } finally { setTimeout(function () { if (btn && document.body.contains(btn)) btn.disabled = false; }, 800); }
    try {
      var m = (location.hash || '').match(/^#\/success\/(.+)$/);
      if (m) {
        var d = db(), o = (d.orders || []).filter(function (q) { return q.no === m[1]; })[0];
        if (o && d.orders.length > n0) {
          if (isW(pay)) { if (x.from) o.payFrom = x.from; o.payStatus = 'Verifying'; } else if (isCod(pay)) o.payStatus = 'COD';
          if (x.rec) o.recipient = x.rec; o.callFirst = x.call; o.contactless = x.door; if (x.cash != null && isCod(pay)) o.cashGiven = x.cash;
          save(d); D = d;
        }
      }
    } catch (e) { }
    return r;
  };

  /* ---------- অর্ডার তালিকায় পেমেন্ট-অবস্থা ---------- */
  function ordersPay() {
    var m = me && me(); if (!m) return; D = db();
    $$('#app article.card').forEach(function (c) {
      var t = $1('h3', c), no = t && (t.textContent.match(/^(\S+)/) || [])[1], o = no && D.orders.filter(function (q) { return q.no === no; })[0]; if (!o || $1('.v100pay', c)) return;
      var w = isW(o.pay || o.payMethod), cls = 'info', msg;
      if (o.status === 'Cancelled') { if (o.paid) { cls = o.refundSent ? 'ok' : 'wait'; msg = o.refundSent ? '💸 ' + tx('টাকা ফেরত পাঠানো হয়েছে', 'Refund sent') + (o.refundRef ? ' (' + o.refundRef + ')' : '') : '💸 ' + tx('ফেরত প্রক্রিয়াধীন: ', 'Refund in progress: ') + money(o.total); } else msg = '— ' + tx('বাতিল (কোনো পেমেন্ট হয়নি)', 'Cancelled (no payment taken)'); }
      else if (o.paid) { cls = 'ok'; msg = '✅ ' + tx('পেমেন্ট পরিশোধিত', 'Payment received'); }
      else if (o.payStatus === 'Failed') { cls = 'bad'; msg = '❌ ' + tx('পেমেন্ট যাচাই হয়নি', 'Payment could not be verified') + (o.payNote ? ': ' + o.payNote : ''); }
      else if (w) { cls = 'wait'; msg = '⏳ ' + tx('পেমেন্ট যাচাই চলছে', 'Verifying payment') + (o.payRef ? ' · TrxID ' + o.payRef : ''); }
      else msg = '💵 ' + tx('ডেলিভারির সময় পরিশোধ করুন: ', 'Pay on delivery: ') + money(o.total);
      var box = h('div', { class: 'v100pay ' + cls }, msg);
      if (w && !o.paid && o.status !== 'Cancelled' && (o.payTries || 0) < 3) {
        var inp = h('input', { placeholder: tx('সঠিক TrxID', 'Correct TrxID'), maxlength: 20, 'aria-label': 'TrxID', style: 'max-width:150px;text-transform:uppercase' });
        box.append(h('details', { style: 'margin-top:.3rem' }, h('summary', {}, tx('TrxID ভুল? সংশোধন করুন', 'Wrong TrxID? Correct it')), inp, ' ', h('button', { type: 'button', class: 'btn2', onclick: function () {
          var v = inp.value.trim().toUpperCase(); if (!TRX.test(v)) return say(tx('TrxID ৬–২০ অক্ষর/সংখ্যা', 'TrxID: 6–20 letters/digits'), 1);
          if (trxUsed(v, o.no)) return say(tx('এই TrxID অন্য অর্ডারে ব্যবহৃত', 'This TrxID is used on another order'), 1);
          D = db(); var oo = D.orders.filter(function (q) { return q.no === o.no; })[0]; if (!oo) return;
          oo.payRef = v; oo.payStatus = 'Verifying'; oo.payTries = (oo.payTries || 0) + 1; delete oo.payNote; (D.notes = D.notes || []).push({ id: uid('N'), at: new Date().toISOString(), msg: 'Payment ref updated for ' + oo.no + ' (' + v + ')', read: false }); save(D); say(tx('TrxID আপডেট হয়েছে', 'TrxID updated')); render();
        } }, tx('পাঠান', 'Send')), h('small', { class: 'muted' }, ' ' + (3 - (o.payTries || 0)) + ' ' + tx('বার বাকি', 'tries left'))));
      }
      c.appendChild(box);
    });
  }

  var _r = render;
  render = function (k) {
    var r = _r.apply(this, arguments);
    try { var route = (location.hash.slice(2) || 'catalog').split('/')[0]; if (route === 'checkout') checkout(); else if (route === 'orders') ordersPay(); } catch (e) { if (window.console) console.warn('store-v100', e); }
    return r;
  };
  render();
})();
