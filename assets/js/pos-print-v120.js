/* v120 — POS বিলের ইনভয়েস প্রিন্ট ও ডাউনলোড আপডেট (sales.html: invoice-v117 ও invoice-layout-v119 এর পরে; dashboard.html: Settings)
   • ⚡ দ্রুত প্রিন্ট: এক ক্লিকে রসিদ-সাইজে (বা Admin-এর বেছে দেওয়া সাইজে) সরাসরি প্রিন্ট — ডায়ালগ খুলতে হয় না, নিজের লেআউট বদলায় না
   • কপির সংখ্যা ১/২/৩: "CUSTOMER COPY / SHOP COPY / OFFICE COPY" লেবেলসহ আলাদা পাতায়
   • বিল শেষে অটো-প্রিন্ট / অটো-PDF (Settings থেকে চালু; ডিফল্ট বন্ধ) — পপ-আপ ব্লক হয় না (লুকানো ফ্রেম দিয়ে প্রিন্ট)
   • DUPLICATE COPY: একবার ছাপার পর আবার ছাপলে ইনভয়েসে "DUPLICATE — reprint #n" ছাপা হয়; কে কখন ছাপল সেলস-রেকর্ডে (`prints`, `lastPrintBy`) ও Invoice Log-এ থাকে
   • 📤 শেয়ার: ফোনে/সমর্থিত ব্রাউজারে PDF সরাসরি WhatsApp/Messenger ইত্যাদিতে (না পারলে PDF নেমে যায়)
   • 🖨 শেষ বিল: POS টুলবার থেকে সর্বশেষ বিল আবার ছাপুন
   • কিবোর্ড (ইনভয়েস খোলা থাকলে): Alt+P প্রিন্ট · Alt+Q দ্রুত প্রিন্ট · Alt+D PDF · Alt+S সাইজ
   • বিলের নোট (ডাক্তার/রোগীর নাম) এখন ইনভয়েস/PDF/প্রিন্টে আসে */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function $(i) { return document.getElementById(i); }
  function PS() { return rj('pharmacy_settings', {}); }
  function toast(m, t) { if (window.showToast) window.showToast(m, t || 'success'); }
  function I() { return window.mcInv117; }
  var PRESETS = { t80: '80mm রসিদ', t58: '58mm রসিদ', a5: 'A5', a6: 'A6', a4: 'A4' };

  function copies() { var v = 0; try { v = +localStorage.getItem('mc_inv_copies'); } catch (e) { } return v >= 1 && v <= 3 ? v : Math.max(1, Math.min(3, +PS().invCopies || 1)); }
  function quickL() { var p = PRESETS[PS().invQuick] ? PS().invQuick : 't80'; return window.MCLAY ? MCLAY.get({ paper: p, orient: 'p', zoom: null, font: null, margin: null }) : null; }
  function curSale() { return I() && I().fromModal(); }

  function quickPrint(s) { if (!s || !I()) return; I().print(s, { copies: copies(), L: quickL() }); toast('দ্রুত প্রিন্ট পাঠানো হয়েছে'); }
  function normalPrint(s) { if (!s || !I()) return; I().print(s, { copies: copies() }); }

  /* ---------- শেয়ার ---------- */
  function share(s) {
    if (!s || !I() || !window.MCLAY) return;
    toast('PDF তৈরি হচ্ছে…', 'info');
    MCLAY.blob(I().build(s), I().CSS(), 'pdf').then(function (b) {
      if (!b) { toast('PDF তৈরি করা যায়নি', 'warning'); return; }
      var name = I().fname(s, 'pdf'), f; try { f = new File([b], name, { type: 'application/pdf' }); } catch (e) { f = null; }
      if (f && navigator.canShare && navigator.canShare({ files: [f] })) {
        navigator.share({ files: [f], title: s.invoiceNo, text: (PS().store || 'MediCare Pharmacy') + ' — ' + s.invoiceNo }).then(function () { I().log(s, 'share'); }, function () { /* বাতিল */ });
      } else { MCLAY.save(b, name); I().log(s, 'pdf'); toast('এই ব্রাউজারে সরাসরি শেয়ার হয় না — PDF নামানো হয়েছে, ওটা পাঠান', 'info'); }
    });
  }

  /* ---------- ইনভয়েস মডালে বার ---------- */
  function bar() {
    var ft = document.querySelector('#invoiceModal .modal-footer'); if (!ft || $('v120Bar')) return;
    var w = document.createElement('span'); w.id = 'v120Bar'; w.className = 'd-inline-flex gap-1 flex-wrap align-items-center';
    var cs = document.createElement('select'); cs.className = 'v96-sel'; cs.setAttribute('aria-label', 'Copies'); cs.innerHTML = '<option value="1">১ কপি</option><option value="2">২ কপি</option><option value="3">৩ কপি</option>'; cs.value = String(copies());
    cs.onchange = function () { try { localStorage.setItem('mc_inv_copies', cs.value); } catch (e) { } };
    var q = document.createElement('button'); q.type = 'button'; q.id = 'v120Quick'; q.className = 'btn btn-warning rounded-3'; q.textContent = '⚡ ' + PRESETS[PS().invQuick || 't80'] + ' প্রিন্ট'; q.title = 'Alt+Q — ডায়ালগ ছাড়াই সরাসরি প্রিন্ট';
    q.onclick = function () { quickPrint(curSale()); };
    var sh = document.createElement('button'); sh.type = 'button'; sh.id = 'v120Share'; sh.className = 'btn btn-outline-secondary rounded-3'; sh.textContent = '📤 শেয়ার'; sh.onclick = function () { share(curSale()); };
    w.appendChild(cs); w.appendChild(q); w.appendChild(sh); ft.insertBefore(w, ft.firstChild);
    var pb = ft.querySelector('.btn-primary[onclick*="printInvoiceModal"]'); if (pb) pb.title = 'Alt+P';
    var pdf = ft.querySelector('.btn-success'); if (pdf) pdf.title = 'Alt+D';
  }
  document.addEventListener('keydown', function (e) {
    var m = $('invoiceModal'); if (!m || !m.classList.contains('show') || !e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key.toLowerCase(), s = curSale(); if (!s) return;
    if (k === 'p') { e.preventDefault(); normalPrint(s); } else if (k === 'q') { e.preventDefault(); quickPrint(s); } else if (k === 'd') { e.preventDefault(); I().dl(s, 'pdf'); } else if (k === 's') { e.preventDefault(); if (window.mcInvoiceSize) mcInvoiceSize(s); }
  });
  window.printInvoiceModal = function () { normalPrint(curSale()); };

  /* ---------- বিল শেষে অটো ---------- */
  var DONE = {};
  var base = window.showInvoice;
  if (typeof base === 'function') window.showInvoice = function (inv) {
    var r = base.apply(this, arguments);
    try {
      var a = PS().invAuto || 'off', no = inv && inv.invoiceNo;
      if (a !== 'off' && no && !DONE[no]) {
        DONE[no] = 1;
        setTimeout(function () {
          var s = I() && I().byNo(no); if (!s || s.status === 'Voided' || !s.at || Date.now() - new Date(s.at) > 20000) return;
          if (a === 'print' || a === 'both') normalPrint(s);
          if (a === 'pdf' || a === 'both') I().dl(s, 'pdf');
        }, 700);
      }
    } catch (e) { if (window.console) console.warn('pos-print-v120', e); }
    return r;
  };

  /* ---------- POS টুলবারে 🖨 শেষ বিল ---------- */
  function lastBtn() {
    var t = $('mcTools'); if (!t || t.querySelector('.v120last')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'v120last'; b.textContent = '🖨 শেষ বিল'; b.title = 'সর্বশেষ বিল আবার প্রিন্ট (DUPLICATE চিহ্নসহ)';
    b.onclick = function () {
      var L = rj('pharmacy_sales', []).filter(function (x) { return x && x.real && x.status !== 'Voided'; }); var s = L[L.length - 1];
      if (!s) { toast('কোনো বিল নেই', 'warning'); return; } if (I()) I().print(s, { copies: 1 });
    };
    var ref = t.querySelector('.sh65b'); if (ref && ref.nextSibling) t.insertBefore(b, ref.nextSibling); else t.appendChild(b);
  }

  /* ---------- Settings (Dashboard) ---------- */
  function settingsUI() {
    var a = $('v117Box'); if (!a || $('v120Box')) return;
    var S = PS(), c = document.createElement('div'); c.id = 'v120Box'; c.className = 'mt-3';
    c.innerHTML = '<label class="form-label fw-semibold">🖨 POS বিল প্রিন্ট</label><div class="row g-2 align-items-center">' +
      '<div class="col-md-4"><select class="form-select" id="v120Auto" aria-label="Auto after sale"><option value="off">বিল শেষে অটো কিছু নয়</option><option value="print">বিল শেষে অটো-প্রিন্ট</option><option value="pdf">বিল শেষে অটো-PDF</option><option value="both">অটো-প্রিন্ট + PDF</option></select></div>' +
      '<div class="col-md-4"><select class="form-select" id="v120Cp" aria-label="Copies"><option value="1">ডিফল্ট ১ কপি</option><option value="2">২ কপি (ক্রেতা + দোকান)</option><option value="3">৩ কপি</option></select></div>' +
      '<div class="col-md-4"><select class="form-select" id="v120Qk" aria-label="Quick print size">' + Object.keys(PRESETS).map(function (k) { return '<option value="' + k + '">⚡ দ্রুত প্রিন্ট: ' + PRESETS[k] + '</option>'; }).join('') + '</select></div>' +
      '<div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="v120Dup"><label class="form-check-label" for="v120Dup">দ্বিতীয়বার ছাপলে "DUPLICATE COPY" লিখুন</label></div><small class="text-muted">অটো-প্রিন্ট ব্রাউজারের প্রিন্ট ডায়ালগ খোলে; সাইলেন্ট প্রিন্টের জন্য ব্রাউজার/প্রিন্টার সেটিংসে "kiosk printing" লাগে।</small></div></div>';
    a.insertAdjacentElement('afterend', c);
    $('v120Auto').value = S.invAuto || 'off'; $('v120Cp').value = String(S.invCopies || 1); $('v120Qk').value = PRESETS[S.invQuick] ? S.invQuick : 't80'; $('v120Dup').checked = S.invDup !== false;
    var sv = window.saveStoreSettings; if (typeof sv !== 'function') return;
    window.saveStoreSettings = function () {
      var r = sv.apply(this, arguments), S2 = PS();
      S2.invAuto = $('v120Auto').value; S2.invCopies = +$('v120Cp').value || 1; S2.invQuick = $('v120Qk').value; S2.invDup = $('v120Dup').checked; wj('pharmacy_settings', S2); return r;
    };
  }

  /* 📜 Sales history এর "🖨 রিসিট" — এখন একই দ্রুত-প্রিন্ট (সেটিংসের রসিদ-সাইজ, DUPLICATE গণনা সহ) */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.sh65 button[data-pr]'); if (!b || !I()) return;
    var s = rj('pharmacy_sales', []).filter(function (x) { return String(x.id) === String(b.getAttribute('data-pr')); })[0]; if (!s) return;
    e.stopImmediatePropagation(); e.preventDefault(); quickPrint(s);
  }, true);

  function tick() { bar(); lastBtn(); settingsUI(); }
  function ready(f) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(f, 120); }); else setTimeout(f, 120); }
  ready(function () { tick(); setInterval(tick, 700); });
})();
