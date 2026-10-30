/* v96 — Invoice আপডেট (sales.html: pos-extra / pos-v83 / sales-history এর পরে; dashboard.html: Settings → Store & Invoice)
   • বাগ ঠিক: একাধিক আইটেমে সব ঘর একটাই সারিতে আসত — এখন প্রতি আইটেম আলাদা সারি + ক্রমিক নং
   • প্রতি আইটেমের নিচে ব্যাচ ও মেয়াদ (ওষুধ রেকর্ড থেকে), ক্যাশিয়ার, কথায় মোট টাকা, "আপনি সাশ্রয় করেছেন"
   • রিপ্রিন্ট (আজকের বিল / হিস্টোরি) এখন মূল বিলের পেমেন্ট, বাকি, ক্যাশিয়ার দেখায় + "🔁 কপি" চিহ্ন; বাতিল (VOID) বিলে লাল চিহ্ন
   • প্রিন্ট: ইন্টারনেট ছাড়াও চলে (আগে CDN-এর Bootstrap লাগত), কাগজ A4 / A5 / 80mm; PDF-এর নাম ইনভয়েস নং; 📋 টেক্সট কপি
   • Admin → Settings → Store & Invoice: ডিফল্ট কাগজ, ব্যাচ/মেয়াদ দেখানো, কথায় টাকা, ফেরত-নীতি লাইন */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(i) { return document.getElementById(i); }
  function PS() { return rj('pharmacy_settings', {}); }
  function tk(n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  /* ---------- টাকা কথায় (ইংরেজি, লাখ/কোটি পদ্ধতি) ---------- */
  var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function w99(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''); }
  function w999(n) { var s = ''; if (n >= 100) { s = ONES[Math.floor(n / 100)] + ' Hundred'; n %= 100; if (n) s += ' '; } return s + (n ? w99(n) : ''); }
  function words(n) {
    n = Math.floor(n); if (n <= 0) return 'Zero';
    var parts = [], cr = Math.floor(n / 1e7); n %= 1e7; var lk = Math.floor(n / 1e5); n %= 1e5; var th = Math.floor(n / 1e3); n %= 1e3;
    if (cr) parts.push(words(cr) + ' Crore'); if (lk) parts.push(w99(lk) + ' Lakh'); if (th) parts.push(w99(th) + ' Thousand'); if (n) parts.push(w999(n));
    return parts.join(' ');
  }
  function taka(n) { var t = Math.round((+n || 0) * 100) / 100, a = Math.floor(t), p = Math.round((t - a) * 100); return 'Taka ' + words(a) + (p ? ' and ' + w99(p) + ' Paisa' : '') + ' Only'; }
  window.mcTakaWords = taka;

  /* ---------- কাগজের মাপ ---------- */
  var SIZES = { a4: ['A4', '210mm', 'A4'], a5: ['A5', '148mm', 'A5'], t80: ['80mm রসিদ', '72mm', null] };
  function paper() { var v = ''; try { v = localStorage.getItem('mc_inv_paper') || ''; } catch (e) { } return SIZES[v] ? v : (SIZES[PS().invPaper] ? PS().invPaper : 'a4'); }

  var css = document.createElement('style');
  css.textContent = '.v96-sel{border:1px solid rgba(100,110,160,.4);border-radius:10px;padding:.35rem .5rem;background:transparent;color:inherit}' +
    '.v96-ribbon{display:inline-block;border:2px solid;border-radius:8px;padding:.1rem .7rem;font-weight:800;letter-spacing:.08em;transform:rotate(-4deg);margin:.2rem 0}.v96-copy{color:#b45309}.v96-void{color:#dc2626}' +
    '.v96-sub{display:block;font-size:.74rem;color:#6b7280}.v96-in{font-size:.82rem;margin:.4rem 0 0}.v96-meta td{padding:.1rem .4rem;font-size:.85rem}';
  document.head.appendChild(css);

  /* ---------- ইনভয়েস সাজানো ---------- */
  function savedSale(no) { return rj('pharmacy_sales', []).filter(function (s) { return s && s.invoiceNo === no; })[0]; }
  function decorate(inv) {
    var box = $('invoiceContent'); if (!box) return;
    var S = PS(), sale = savedSale(inv.invoiceNo), meds = rj('pharmacy_medicines', []);
    var fresh = sale && sale.at && (Date.now() - new Date(sale.at)) < 15000, voided = sale && sale.status === 'Voided';
    var tbl = box.querySelector('table'), tb = tbl && tbl.querySelector('tbody');
    /* ১) সারি ঠিক */
    if (tb) {
      var showB = S.invBatch !== false;
      tb.innerHTML = (inv.items || []).map(function (it, n) {
        var m = meds.filter(function (x) { return String(x.id) === String(it.id); })[0] || {}, sub = '';
        if (showB && (m.batchNo || m.expiryDate)) sub = '<span class="v96-sub">' + (m.batchNo ? 'ব্যাচ ' + esc(m.batchNo) : '') + (m.batchNo && m.expiryDate ? ' · ' : '') + (m.expiryDate ? 'মেয়াদ ' + esc(String(m.expiryDate).slice(0, 10)) : '') + '</span>';
        var pr = +it.price || 0, q = +it.quantity || 0;
        return '<tr><td>' + (n + 1) + '. ' + esc(it.name) + sub + '</td><td class="text-center">' + tk(pr) + '</td><td class="text-center">' + q + '</td><td class="text-end">' + tk(it.total != null ? it.total : pr * q) + '</td></tr>';
      }).join('');
    }
    /* লোগো (Settings → Store & Invoice) */
    var top0 = box.querySelector('.text-center.mb-4');
    if (top0 && S.logo && /^data:image\//.test(S.logo) && !top0.querySelector('.v98-logo')) { var lg = document.createElement('img'); lg.className = 'v98-logo'; lg.alt = ''; lg.src = S.logo; lg.style.cssText = 'max-width:60%;max-height:60px;display:block;margin:0 auto .4rem'; top0.insertBefore(lg, top0.firstChild); }
    /* ২) মেটা: ক্যাশিয়ার */
    var hdr = box.querySelector('.text-center.mb-4 p:last-of-type');
    if (hdr && sale && sale.cashier && !hdr.querySelector('.v96-c')) hdr.insertAdjacentHTML('beforeend', '<br class="v96-c"><strong>Cashier:</strong> ' + esc(sale.cashier));
    var top = box.querySelector('.text-center.mb-4');
    if (top && !top.querySelector('.v96-ribbon') && (voided || (sale && !fresh))) top.insertAdjacentHTML('beforeend', '<div><span class="v96-ribbon ' + (voided ? 'v96-void' : 'v96-copy') + '">' + (voided ? 'VOID — বাতিল' : '🔁 কপি (পুনঃমুদ্রণ)') + '</span></div>');
    /* ৩) রিপ্রিন্টে পেমেন্ট তথ্য */
    var foot = box.querySelector('.text-center.mt-4');
    if (foot && sale && !fresh) {
      var pm = foot.querySelector('p'); if (pm) {
        var m2 = String(sale.paymentMethod || '').trim().toUpperCase() || '—', bits = [];
        if (sale.parts) bits.push('cash ' + tk(sale.parts[0].amt) + ' + wallet ' + tk(sale.parts[1].amt));
        if (sale.provider) bits.push(sale.provider + (sale.payRef ? ' ref ' + sale.payRef : ''));
        if (sale.dueAmount > 0) bits.push('পরিশোধ ' + tk(sale.paidNow || 0) + ' · বাকি ' + tk(sale.dueAmount));
        pm.textContent = 'Payment Method: ' + m2 + (bits.length ? ' · ' + bits.join(' · ') : '');
      }
    }
    /* ৪) সাশ্রয় + কথায় + ফেরত-নীতি */
    if (foot && !foot.querySelector('.v96-in')) {
      var add = '';
      if ((+inv.discount || 0) > 0.004) add += '<div class="v96-in">🎉 আপনি সাশ্রয় করেছেন <b>' + tk(inv.discount) + '</b></div>';
      if (S.invWords !== false) add += '<div class="v96-in"><b>In words:</b> ' + esc(taka(inv.total)) + '</div>';
      if (S.returnPolicy) add += '<div class="v96-in text-muted">ℹ️ ' + esc(S.returnPolicy) + '</div>';
      if (add) foot.insertAdjacentHTML('afterbegin', add);
    }
    footerControls();
  }

  /* ---------- ফুটার: কাগজ + টেক্সট কপি ---------- */
  function footerControls() {
    var ft = document.querySelector('#invoiceModal .modal-footer'); if (!ft || $('v96Paper')) return;
    var sel = document.createElement('select'); sel.id = 'v96Paper'; sel.className = 'v96-sel'; sel.setAttribute('aria-label', 'Paper size');
    sel.innerHTML = Object.keys(SIZES).map(function (k) { return '<option value="' + k + '">' + SIZES[k][0] + '</option>'; }).join(''); sel.value = paper();
    sel.onchange = function () { try { localStorage.setItem('mc_inv_paper', sel.value); } catch (e) { } };
    var cp = document.createElement('button'); cp.type = 'button'; cp.className = 'btn btn-outline-secondary rounded-3'; cp.id = 'v96Copy'; cp.textContent = '📋 টেক্সট কপি';
    cp.onclick = function () {
      var t = plain(); var done = function () { if (window.showToast) showToast('ইনভয়েস কপি হয়েছে', 'success'); };
      try { navigator.clipboard.writeText(t).then(done, function () { fallback(t); done(); }); } catch (e) { fallback(t); done(); }
    };
    ft.insertBefore(cp, ft.firstChild); ft.insertBefore(sel, ft.firstChild);
  }
  function fallback(t) { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) { } a.remove(); }
  function plain() {
    var box = $('invoiceContent'); if (!box) return '';
    var no = (box.textContent.match(/Invoice No:\s*(\S+)/) || [])[1] || '';
    var rows = [].map.call(box.querySelectorAll('tbody tr'), function (r) {
      var c = r.querySelectorAll('td'), n = c[0].cloneNode(true); [].forEach.call(n.querySelectorAll('.v96-sub'), function (x) { x.textContent = ' (' + x.textContent + ')'; });
      return n.textContent.replace(/\s+/g, ' ').trim() + ' × ' + c[2].textContent.trim() + ' = ' + c[3].textContent.trim();
    });
    var tot = box.querySelector('tr.table-primary td:last-child');
    return (PS().store || 'MediCare Pharmacy') + '\nInvoice: ' + no + '\n' + rows.join('\n') + '\nTotal: ' + (tot ? tot.textContent.trim() : '');
  }

  /* ---------- প্রিন্ট / PDF ---------- */
  function sheetCss(k) {
    var z = SIZES[k] || SIZES.a4;
    return 'body{font:' + (k === 't80' ? '12px' : '14px') + '/1.45 system-ui,"Noto Sans Bengali",sans-serif;margin:0;padding:' + (k === 't80' ? '4mm' : '12mm') + ';color:#111;width:' + z[1] + ';max-width:100%}' +
      'table{width:100%;border-collapse:collapse;margin:.5rem 0}th,td{border:1px solid #bbb;padding:' + (k === 't80' ? '2px 3px' : '4px 7px') + ';vertical-align:top}th{background:#f1f3f9}.text-center{text-align:center}.text-end{text-align:right}.fw-bold{font-weight:700}.text-danger{color:#c00}.text-success{color:#047857}.text-muted{color:#666}' +
      '.table-primary td{background:#eef2ff}.v96-sub{display:block;font-size:.8em;color:#555}.v96-in{margin:.3rem 0}.v96-ribbon{display:inline-block;border:2px solid;border-radius:6px;padding:0 .6rem;font-weight:800}.v96-copy{color:#b45309}.v96-void{color:#c00}h3,h5,p{margin:.25rem 0}hr{border:0;border-top:1px dashed #999}svg{max-width:100%}.v98-logo{display:block;margin:0 auto .3rem;max-width:60%;max-height:60px}.v83wa{display:none}' +
      '@page{' + (z[2] ? 'size:' + z[2] + ';margin:8mm' : 'size:80mm auto;margin:2mm') + '}';
  }
  window.printInvoiceModal = function () {
    var box = $('invoiceContent'); if (!box) return;
    var k = $('v96Paper') ? $('v96Paper').value : paper(), w = window.open('', '_blank');
    if (!w) { if (window.MCD) MCD.alert('পপ-আপ অনুমতি দিন, তারপর আবার চেষ্টা করুন'); else alert('Allow pop-ups'); return; }
    var clone = box.cloneNode(true); [].forEach.call(clone.querySelectorAll('.v83wa,button,a.btn'), function (x) { x.remove(); });
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Invoice</title><style>' + sheetCss(k) + '</style></head><body>' + clone.innerHTML + '<script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>');
    w.document.close();
  };
  window.downloadInvoicePDF = function () {
    var el = $('invoiceContent'); if (!el) return;
    var k = $('v96Paper') ? $('v96Paper').value : paper(), no = (el.textContent.match(/Invoice No:\s*(\S+)/) || [])[1] || 'invoice';
    if (!window.html2pdf) { if (window.showToast) showToast('PDF লাইব্রেরি লোড হয়নি (ইন্টারনেট দরকার) — Print ব্যবহার করুন', 'warning'); return; }
    var fmt = k === 't80' ? [80, 200] : (k === 'a5' ? 'a5' : 'a4');
    html2pdf().set({ margin: k === 't80' ? 3 : 10, filename: no + '.pdf', html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: fmt, orientation: 'portrait' } }).from(el).save();
  };

  /* ---------- showInvoice র‍্যাপ ---------- */
  var base = window.showInvoice;
  if (typeof base === 'function') {
    window.showInvoice = function (inv) {
      var r = base.apply(this, arguments);
      try { decorate(inv || {}); } catch (e) { if (window.console) console.warn('invoice-v96', e); }
      return r;
    };
  }

  /* ---------- Settings → Store & Invoice (Dashboard) ---------- */
  function settingsUI() {
    var anchor = $('v94Prev'); if (!anchor || $('v96Box')) return;
    var S = PS(), c = document.createElement('div'); c.id = 'v96Box'; c.className = 'mt-3';
    c.innerHTML = '<label class="form-label fw-semibold">🖨 ইনভয়েস প্রিন্ট</label><div class="row g-2 align-items-center">' +
      '<div class="col-md-4"><select class="form-select" id="v96Def" aria-label="Default paper"><option value="a4">A4 (ডিফল্ট)</option><option value="a5">A5</option><option value="t80">80mm রসিদ</option></select></div>' +
      '<div class="col-md-8"><div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" id="v96Batch"><label class="form-check-label" for="v96Batch">ব্যাচ ও মেয়াদ দেখান</label></div><div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" id="v96Words"><label class="form-check-label" for="v96Words">কথায় টাকা</label></div></div>' +
      '<div class="col-12"><input class="form-control" id="v96Ret" maxlength="160" placeholder="ফেরত-নীতি (ঐচ্ছিক) — যেমন: ৭ দিনের মধ্যে ইনভয়েস সহ ফেরত" aria-label="Return policy"></div></div>';
    anchor.insertAdjacentElement('afterend', c);
    $('v96Def').value = SIZES[S.invPaper] ? S.invPaper : 'a4'; $('v96Batch').checked = S.invBatch !== false; $('v96Words').checked = S.invWords !== false; $('v96Ret').value = S.returnPolicy || '';
    var sv = window.saveStoreSettings;
    window.saveStoreSettings = function () {
      var r = sv.apply(this, arguments), S2 = PS();
      S2.invPaper = $('v96Def').value; S2.invBatch = $('v96Batch').checked; S2.invWords = $('v96Words').checked; S2.returnPolicy = $('v96Ret').value.trim().slice(0, 160);
      try { localStorage.setItem('pharmacy_settings', JSON.stringify(S2)); localStorage.removeItem('mc_inv_paper'); } catch (e) { }
      return r;
    };
  }
  function ready(f) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(f, 50); }); else setTimeout(f, 50); }
  ready(function () { settingsUI(); var n = 0, t = setInterval(function () { settingsUI(); if ($('v96Box') || ++n > 20) clearInterval(t); }, 300); });
})();
