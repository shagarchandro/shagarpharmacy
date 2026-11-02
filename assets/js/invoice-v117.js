/* v117 — Invoice ডাউনলোড আপডেট (sales.html: invoice-v96 এর পরে; dashboard.html: Settings → Store & Invoice)
   • যেকোনো সংরক্ষিত বিল (📜 Sales history) থেকে সরাসরি ডাউনলোড: PDF / ছবি (PNG) / HTML ফাইল / CSV — মডাল খুলতে হয় না
   • ইনভয়েস মডালেও নতুন বোতাম: ⬇ PNG · ⬇ HTML · ⬇ CSV (PDF আগের মতোই, কিন্তু এখন ফাইলের নাম সেটিংস অনুযায়ী)
   • PDF/ছবি অফলাইনে চলে (লাইব্রেরি প্রকল্পের ভেতরেই), বাগ ঠিক: মডালের Bootstrap স্টাইল ছাড়া খালি PDF হত না — এখন নিজস্ব স্বয়ংসম্পূর্ণ স্টাইল
   • ইনভয়েসে Code128 বারকোড, PAID / DUE / VOID স্ট্যাম্প, ধন্যবাদ-লাইন (সেটিংস থেকে চালু/বন্ধ)
   • 📥 Download Invoices: ফিল্টার করা সব বিলের একসাথে CSV (Sales history এর ভেতরে)
   • প্রতিটি ডাউনলোড `pharmacy_dllog` এ লেখা হয় (কে, কখন, কোন বিল, কোন ফরম্যাট)
   • Admin → Settings → Store & Invoice: ফাইলের নামের ছাঁচ ({no} {customer} {date}), বারকোড, স্ট্যাম্প, ধন্যবাদ-লাইন */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(i) { return document.getElementById(i); }
  function PS() { return rj('pharmacy_settings', {}); }
  function tk(n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function user() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || {}; } catch (e) { return {}; } }
  function toast(m, t) { if (window.showToast) window.showToast(m, t || 'success'); else if (window.MCD && MCD.alert) MCD.alert(m); }
  function words(n) { return window.mcTakaWords ? window.mcTakaWords(n) : ''; }

  /* ---------- ফাইলের নাম ---------- */
  function fname(s, ext) {
    var tpl = PS().invFile || '{no}', d = String(s.date || String(s.at || '').slice(0, 10) || '');
    var n = tpl.replace(/\{no\}/g, s.invoiceNo || 'invoice').replace(/\{customer\}/g, s.customer || 'walkin').replace(/\{date\}/g, d);
    n = n.replace(/[^\wঀ-৿.\- ]+/g, '_').replace(/\s+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
    return (n || 'invoice') + '.' + ext;
  }

  /* ---------- লগ ---------- */
  function log(s, fmt) {
    var u = user(), L = rj('pharmacy_dllog', []);
    L.unshift({ at: new Date().toISOString(), no: s.invoiceNo || '', fmt: fmt, by: u.name || u.email || u.role || '' });
    wj('pharmacy_dllog', L.slice(0, 300));
  }

  /* ---------- সংরক্ষিত বিল / মডাল থেকে বিল ---------- */
  function sales() { return rj('pharmacy_sales', []).filter(function (s) { return s && s.invoiceNo; }); }
  function byNo(no) { return sales().filter(function (s) { return s.invoiceNo === no; })[0]; }
  function fromModal() {
    var box = $('invoiceContent'); if (!box) return null;
    var no = (box.textContent.match(/Invoice No:\s*(\S+)/) || [])[1]; if (!no) return null;
    var s = byNo(no); if (s) return s;
    /* এইমাত্র হওয়া বিল (সংরক্ষণ হয়নি হলে) — মডালের টেবিল থেকে */
    var it = [].map.call(box.querySelectorAll('tbody tr'), function (r) {
      var c = r.querySelectorAll('td'); if (c.length < 4) return null; var n = c[0].cloneNode(true); [].forEach.call(n.querySelectorAll('.v96-sub'), function (x) { x.remove(); });
      var num = function (t) { return parseFloat(String(t.textContent).replace(/[^\d.\-]/g, '')) || 0; };
      return { name: n.textContent.replace(/^\d+\.\s*/, '').trim(), price: num(c[1]), quantity: num(c[2]) };
    }).filter(Boolean);
    var tot = box.querySelector('tr.table-primary td:last-child');
    return { invoiceNo: no, items: it, total: tot ? parseFloat(tot.textContent.replace(/[^\d.]/g, '')) : 0, subtotal: 0, discount: 0, tax: 0, date: (box.textContent.match(/Date:\s*([^\n]+?)\s*Customer/) || [])[1] || '', customer: (box.textContent.match(/Customer:\s*([^\n]+?)(?:Rx:|$)/) || [])[1] || '' };
  }

  /* ---------- স্বয়ংসম্পূর্ণ ইনভয়েস HTML ---------- */
  function barcode(no) {
    if (!no || !window.JsBarcode) return '';
    try { var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); JsBarcode(svg, String(no), { format: 'CODE128', height: 38, displayValue: true, fontSize: 12, margin: 2 }); return svg.outerHTML; } catch (e) { return ''; }
  }
  var CSS = 'body{font:14px/1.5 "Noto Sans Bengali",system-ui,sans-serif;margin:0;padding:18px;color:#111;background:#fff}.inv{max-width:760px;margin:0 auto;position:relative}h2{margin:.1rem 0;color:#2563eb}p{margin:.15rem 0}.c{text-align:center}.r{text-align:right}.m{color:#666;font-size:.85em}' +
    'table{width:100%;border-collapse:collapse;margin:.6rem 0}th,td{border:1px solid #cfd5e6;padding:5px 8px;text-align:left;vertical-align:top}th{background:#f1f3f9}td.r,th.r{text-align:right}tr{page-break-inside:avoid}.tot td{font-weight:700;background:#eef2ff}.stamp{position:absolute;right:14px;top:96px;border:3px solid;border-radius:10px;padding:2px 14px;font-weight:800;letter-spacing:.1em;transform:rotate(-10deg);opacity:.8;font-size:1.3rem}' +
    '.paid{color:#059669}.due{color:#d97706}.void{color:#dc2626}.sub{display:block;font-size:.78em;color:#666}hr{border:0;border-top:1px dashed #999;margin:.6rem 0}.bc{text-align:center;margin-top:.6rem}.bc svg{max-width:100%}@media print{body{padding:0}}';
  function build(s) {
    var S = PS(), voided = s.status === 'Voided', due = +s.dueAmount || 0, meds = rj('pharmacy_medicines', []), showB = S.invBatch !== false;
    var stamp = '';
    if (S.invStamp !== false) stamp = voided ? '<div class="stamp void">VOID</div>' : (due > 0 ? '<div class="stamp due">DUE</div>' : '<div class="stamp paid">PAID</div>');
    var rows = (s.items || []).map(function (it, n) {
      var m = meds.filter(function (x) { return String(x.id) === String(it.id); })[0] || {}, sub = '';
      if (showB && (m.batchNo || m.expiryDate)) sub = '<span class="sub">' + (m.batchNo ? 'Batch ' + esc(m.batchNo) : '') + (m.batchNo && m.expiryDate ? ' · ' : '') + (m.expiryDate ? 'Exp ' + esc(String(m.expiryDate).slice(0, 10)) : '') + '</span>';
      var q = +it.quantity || 0, p = +it.price || 0;
      return '<tr><td>' + (n + 1) + '. ' + esc(it.name) + sub + '</td><td class="r">' + tk(p) + '</td><td class="r">' + q + '</td><td class="r">' + tk(p * q) + '</td></tr>';
    }).join('');
    var pm = String(s.paymentMethod || '').toUpperCase() || '—', bits = [];
    if (s.provider) bits.push(esc(s.provider) + (s.payRef ? ' ref ' + esc(s.payRef) : ''));
    if (due > 0) bits.push('Paid ' + tk(s.paidNow || 0) + ' · Due ' + tk(due));
    var lic = (S.licenseNo || S.binNo) ? '<p class="m">' + (S.licenseNo ? 'Drug Licence: ' + esc(S.licenseNo) : '') + (S.licenseNo && S.binNo ? ' | ' : '') + (S.binNo ? 'BIN: ' + esc(S.binNo) : '') + '</p>' : '';
    var logo = (S.logo && /^data:image\//.test(S.logo)) ? '<img src="' + S.logo + '" alt="" style="max-width:60%;max-height:60px;display:block;margin:0 auto .3rem">' : '';
    return '<div class="inv">' + stamp + '<div class="c">' + logo + '<h2>' + esc(S.store || 'MediCare Pharmacy') + '</h2><p>' + esc(S.address || '') + '</p><p>' + esc(S.phone || '') + (S.email ? ' | ' + esc(S.email) : '') + '</p>' + lic + '<hr><b>INVOICE</b>' + ((+s.prints > 0 && S.invDup !== false) ? '<div class="void" style="font-weight:800;letter-spacing:.08em;margin-top:.2rem">** DUPLICATE COPY — reprint #' + (+s.prints) + ' **</div>' : '') + '</div>' +
      '<p><b>Invoice No:</b> ' + esc(s.invoiceNo) + '<br><b>Date:</b> ' + esc(s.date || String(s.at || '').slice(0, 10)) + '<br><b>Customer:</b> ' + esc(s.customer || 'Walk-in') + (s.cashier ? '<br><b>Cashier:</b> ' + esc(s.cashier) : '') + (s.note ? '<br><b>Note:</b> ' + esc(s.note) : '') + (s.rx ? '<br><b>Rx:</b> ' + esc(s.rx.no) + (s.rx.by ? ' (verified by ' + esc(s.rx.by) + ')' : '') : '') + '</p>' +
      '<table><thead><tr><th>Item</th><th class="r">Price</th><th class="r">Qty</th><th class="r">Total</th></tr></thead><tbody>' + rows + '</tbody><tfoot>' +
      '<tr><td colspan="3" class="r">Subtotal</td><td class="r">' + tk(s.subtotal) + '</td></tr><tr><td colspan="3" class="r">Discount</td><td class="r">-' + tk(s.discount) + '</td></tr><tr><td colspan="3" class="r">Tax</td><td class="r">' + tk(s.tax) + '</td></tr>' +
      '<tr class="tot"><td colspan="3" class="r">Total</td><td class="r">' + tk(s.total) + '</td></tr></tfoot></table>' +
      '<p>Payment: <b>' + esc(pm) + '</b>' + (bits.length ? ' · ' + bits.join(' · ') : '') + '</p>' +
      (S.invWords !== false && words(s.total) ? '<p class="m"><b>In words:</b> ' + esc(words(s.total)) + '</p>' : '') +
      (S.returnPolicy ? '<p class="m">ℹ️ ' + esc(S.returnPolicy) + '</p>' : '') +
      ((+s.discount || 0) > 0.004 ? '<p>🎉 You saved <b>' + tk(s.discount) + '</b></p>' : '') +
      ((S.invThanks !== false) ? '<p class="c" style="margin-top:.8rem">' + esc(S.thanksLine || 'Thank you for choosing us — get well soon!') + '</p>' : '') +
      (S.invBarcode !== false ? '<div class="bc">' + barcode(s.invoiceNo) + '</div>' : '') + '</div>';
  }
  var CL = ['CUSTOMER COPY', 'SHOP COPY', 'OFFICE COPY'];
  /* o = {copies:1-3, L: লেআউট (প্রিসেটসহ)} */
  function fullHtml(s, o) {
    o = o || {}; var n = Math.max(1, Math.min(3, +o.copies || 1)), inner = '';
    for (var k = 0; k < n; k++) inner += n > 1 ? '<div class="cp"><div class="c m" style="font-weight:800;letter-spacing:.12em">' + CL[k] + '</div>' + build(s) + '</div>' : build(s);
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(s.invoiceNo) + '</title><style>' + CSS + '.cp{page-break-after:always}.cp:last-child{page-break-after:auto}' + (window.MCLAY ? MCLAY.docCss(o.L) : '') + '</style></head><body>' + inner + '</body></html>';
  }

  /* ---------- ফাইল সংরক্ষণ ---------- */
  function save(blob, name) {
    var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(u); }, 1500);
  }
  function csvCell(v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function csvOne(s) {
    var L = [['Invoice', 'Date', 'Customer', 'Item', 'Price', 'Qty', 'Line total']];
    (s.items || []).forEach(function (i) { L.push([s.invoiceNo, s.date || '', s.customer || 'Walk-in', i.name, i.price, i.quantity, (+i.price || 0) * (+i.quantity || 0)]); });
    L.push([]); L.push(['', '', '', 'Subtotal', '', '', s.subtotal]); L.push(['', '', '', 'Discount', '', '', s.discount]); L.push(['', '', '', 'Tax', '', '', s.tax]); L.push(['', '', '', 'TOTAL', '', '', s.total]);
    return '﻿' + L.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
  }

  /* ---------- PDF / PNG (অফলাইন) ---------- */
  function dl(s, fmt) {
    if (!s || !s.invoiceNo) { toast('ইনভয়েস পাওয়া যায়নি', 'warning'); return; }
    if (fmt === 'html') { save(new Blob([fullHtml(s)], { type: 'text/html;charset=utf-8' }), fname(s, 'html')); log(s, 'html'); toast('HTML ফাইল নামানো হয়েছে'); return; }
    if (fmt === 'csv') { save(new Blob([csvOne(s)], { type: 'text/csv;charset=utf-8' }), fname(s, 'csv')); log(s, 'csv'); toast('CSV নামানো হয়েছে'); return; }
    toast('ফাইল তৈরি হচ্ছে…', 'info');
    if (!window.MCLAY) { toast('লেআউট মডিউল লোড হয়নি', 'warning'); return; }
    MCLAY.render(build(s), CSS, fmt, fname(s, fmt)).then(function (ok) { if (ok) { log(s, fmt); toast(fmt.toUpperCase() + ' নামানো হয়েছে'); } else toast('ফাইল তৈরি করা যায়নি — HTML ডাউনলোড ব্যবহার করুন', 'warning'); });
  }
  window.mcInvoiceDownload = dl;

  /* ---------- মডালে ডাউনলোড (PDF বোতাম এখন সেটিংসের নাম/স্টাইল মানে) ---------- */
  window.downloadInvoicePDF = function () { dl(fromModal(), 'pdf'); };
  function openSize(sale) {
    if (!window.MCLAY || !sale) return;
    MCLAY.open({ title: sale.invoiceNo, html: function () { return fullHtml(sale); }, print: function () { printSale(sale); }, pdf: function () { dl(sale, 'pdf'); } });
  }
  function bump(no) {
    var L = rj('pharmacy_sales', []), hit = false, u = user();
    L.forEach(function (x) { if (x && x.invoiceNo === no) { x.prints = (+x.prints || 0) + 1; x.lastPrintAt = new Date().toISOString(); x.lastPrintBy = u.name || u.email || ''; hit = true; } });
    if (hit) wj('pharmacy_sales', L);
  }
  function printSale(sale, o) {
    if (!sale || !window.MCLAY) return;
    var saved = byNo(sale.invoiceNo), cur = saved ? Object.assign({}, sale, { prints: +saved.prints || 0 }) : sale;
    if (MCLAY.printHtml(fullHtml(cur, o))) { log(sale, 'print'); if (saved) bump(sale.invoiceNo); }
  }
  window.printInvoiceModal = function () { var s = fromModal(); if (s) printSale(s); };
  window.mcInvoiceSize = openSize;
  window.mcInv117 = { build: build, fullHtml: fullHtml, byNo: byNo, fromModal: fromModal, log: log, print: printSale, dl: dl, CSS: function () { return CSS; }, fname: fname };
  function modalButtons() {
    var ft = document.querySelector('#invoiceModal .modal-footer'); if (!ft || $('v117Dl')) return;
    var w = document.createElement('span'); w.id = 'v117Dl'; w.className = 'd-inline-flex gap-1 flex-wrap';
    var sz = document.createElement('button'); sz.type = 'button'; sz.className = 'btn btn-outline-primary rounded-3'; sz.id = 'v119Size'; sz.textContent = '📐 সাইজ'; sz.title = 'কাগজ / জুম / লেখার মাপ'; sz.onclick = function () { openSize(fromModal()); }; w.appendChild(sz);
    [['png', '⬇ PNG'], ['html', '⬇ HTML'], ['csv', '⬇ CSV']].forEach(function (p) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-outline-secondary rounded-3'; b.textContent = p[1]; b.setAttribute('data-fmt', p[0]);
      b.onclick = function () { dl(fromModal(), p[0]); }; w.appendChild(b);
    });
    ft.insertBefore(w, ft.querySelector('.btn-success') || null);
  }

  /* ---------- Sales history ওভারলে: প্রতি বিলে ডাউনলোড + সব বিলের CSV ---------- */
  function histEnhance() {
    var ov = document.querySelector('.sh65'); if (!ov) return;
    [].forEach.call(ov.querySelectorAll('.it .ac'), function (ac) {
      if (ac.querySelector('.v117')) return;
      var pr = ac.querySelector('[data-pr]'); if (!pr) return;
      var id = pr.getAttribute('data-pr'), s = sales().filter(function (x) { return String(x.id) === String(id); })[0]; if (!s) return;
      var sel = document.createElement('select'); sel.className = 'v117'; sel.setAttribute('aria-label', 'Download ' + s.invoiceNo);
      sel.setAttribute('style', 'border:1px solid #c9d0e6;background:transparent;color:inherit;border-radius:10px;padding:.35rem .5rem;font:inherit;font-size:.85rem;min-height:34px');
      sel.innerHTML = '<option value="">⬇ ডাউনলোড</option><option value="pdf">PDF</option><option value="png">ছবি (PNG)</option><option value="html">HTML</option><option value="csv">CSV</option><option value="size">📐 সাইজ / প্রিন্ট…</option>';
      sel.onchange = function () { var v = sel.value; sel.value = ''; if (v === 'size') openSize(s); else if (v) dl(s, v); };
      ac.appendChild(sel);
    });
    var sm = ov.querySelector('.sm');
    if (sm && !ov.querySelector('.v117all')) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'v117all'; b.textContent = '📥 এই তালিকা CSV';
      b.setAttribute('style', 'margin-left:.6rem;border:1px solid #c9d0e6;background:transparent;color:inherit;border-radius:10px;padding:.2rem .6rem;font:inherit;font-size:.82rem;cursor:pointer');
      b.onclick = function () { bulk(ov); }; sm.appendChild(b);
    }
  }
  function bulk(ov) {
    /* দৃশ্যমান কার্ড থেকে ইনভয়েস নং নিয়ে পূর্ণ তথ্যসহ CSV */
    var nos = [].map.call(ov.querySelectorAll('.it .tt:first-child'), function (e) { return (e.firstChild && e.firstChild.textContent || '').trim(); }).filter(Boolean);
    var list = nos.map(byNo).filter(Boolean);
    if (!list.length) { toast('তালিকা খালি', 'warning'); return; }
    var L = [['Invoice', 'Date', 'Customer', 'Cashier', 'Payment', 'Subtotal', 'Discount', 'Tax', 'Total', 'Due', 'Status', 'Items']];
    list.forEach(function (s) { L.push([s.invoiceNo, s.date || '', s.customer || 'Walk-in', s.cashier || '', s.paymentMethod || '', s.subtotal, s.discount, s.tax, s.total, s.dueAmount || 0, s.status || 'Paid', (s.items || []).map(function (i) { return i.name + ' x' + i.quantity; }).join('; ')]); });
    save(new Blob(['﻿' + L.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n')], { type: 'text/csv;charset=utf-8' }), 'invoices_' + new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }) + '.csv');
    log({ invoiceNo: list.length + ' invoices' }, 'csv-list'); toast(list.length + 'টি ইনভয়েসের CSV নামানো হয়েছে');
  }

  /* ---------- Settings (Dashboard) ---------- */
  function settingsUI() {
    var a = $('v96Box') || $('v94Prev'); if (!a || $('v117Box')) return;
    var S = PS(), c = document.createElement('div'); c.id = 'v117Box'; c.className = 'mt-3';
    c.innerHTML = '<label class="form-label fw-semibold">⬇ ইনভয়েস ডাউনলোড</label><div class="row g-2 align-items-center">' +
      '<div class="col-md-6"><input class="form-control" id="v117Fn" maxlength="60" placeholder="ফাইলের নাম: {no} {customer} {date}" aria-label="File name template"></div>' +
      '<div class="col-md-6"><input class="form-control" id="v117Th" maxlength="90" placeholder="ধন্যবাদ-লাইন (ঐচ্ছিক)" aria-label="Thanks line"></div>' +
      '<div class="col-12"><button type="button" class="btn btn-outline-primary btn-sm" id="v119Def">📐 ডিফল্ট কাগজ / জুম / লেখার মাপ ঠিক করুন</button> <small class="text-muted">সব ডিভাইসের ডিফল্ট — প্রিভিউ দেখে বেছে নিন</small></div>' +
      '<div class="col-12"><div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" id="v117Bc"><label class="form-check-label" for="v117Bc">বারকোড</label></div>' +
      '<div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" id="v117St"><label class="form-check-label" for="v117St">PAID / DUE / VOID স্ট্যাম্প</label></div>' +
      '<div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" id="v117Tn"><label class="form-check-label" for="v117Tn">ধন্যবাদ-লাইন দেখান</label></div></div></div>';
    a.insertAdjacentElement('afterend', c);
    $('v119Def').onclick = function () { openSize({ invoiceNo: 'INV-SAMPLE', date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }), customer: 'Sample Customer', cashier: 'Admin', paymentMethod: 'cash', items: [{ name: 'Napa 500mg', price: 2, quantity: 10 }, { name: 'Seclo 20', price: 7, quantity: 4 }], subtotal: 48, discount: 4, tax: 0, total: 44 }); };
    $('v117Fn').value = S.invFile || '{no}'; $('v117Th').value = S.thanksLine || ''; $('v117Bc').checked = S.invBarcode !== false; $('v117St').checked = S.invStamp !== false; $('v117Tn').checked = S.invThanks !== false;
    var sv = window.saveStoreSettings; if (typeof sv !== 'function') return;
    window.saveStoreSettings = function () {
      var r = sv.apply(this, arguments), S2 = PS();
      S2.invFile = ($('v117Fn').value.trim() || '{no}').slice(0, 60); S2.thanksLine = $('v117Th').value.trim().slice(0, 90); S2.invBarcode = $('v117Bc').checked; S2.invStamp = $('v117St').checked; S2.invThanks = $('v117Tn').checked;
      wj('pharmacy_settings', S2); return r;
    };
  }

  (function () { var st = document.createElement('style'); st.textContent = '#v96Paper{display:none!important}'; document.head.appendChild(st); })();
  function tick() { modalButtons(); histEnhance(); settingsUI(); }
  function ready(f) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(f, 80); }); else setTimeout(f, 80); }
  ready(function () { tick(); setInterval(tick, 700); });
})();
