/* v118 — সব ধরনের ইনভয়েস/ডকুমেন্ট একই ছাঁচে + ডাউনলোড (purchases.html, refunds.html, shop.html — সবার শেষে)
   • Purchase Invoice (ক্রয়): মডালে ⬇ PDF / HTML / CSV + আগের Print ঠিক (পুরনো প্রিন্টে ইন্টারনেট-নির্ভর স্টাইল ছিল না — এখন নিজস্ব স্টাইল)
   • Refund Credit Note (রিফান্ড): ইতিহাসের প্রতি সারিতে ⬇ ক্রেডিট নোট (PDF / HTML)
   • Shop অর্ডার ইনভয়েস (কাস্টমার): প্রতি অর্ডারে ⬇ PDF / HTML (আগে শুধু ব্রাউজার প্রিন্ট ছিল)
   • সবার স্টোর-তথ্য/লোগো/লাইসেন্স Settings থেকে, একই PAID/DUE স্ট্যাম্প; ফাইলের নাম Settings → ইনভয়েস ডাউনলোড (v117) মেনে চলে
   • প্রতিটি ডাউনলোড `pharmacy_dllog` এ লেখা হয় (Control Center → 🧾 Invoice Log এ দেখা যায়) */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function PS() { return rj('pharmacy_settings', {}); }
  function tk(n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function user() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || {}; } catch (e) { return {}; } }
  function toast(m, t) { if (typeof window.showToast === 'function') window.showToast(m, t || 'success'); else { var d = document.createElement('div'); d.textContent = m; d.setAttribute('role', 'status'); d.setAttribute('style', 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#16213a;color:#fff;padding:.6rem 1rem;border-radius:12px;z-index:2147483000;font:14px system-ui'); document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2600); } }

  var CSS = 'body{font:14px/1.5 "Noto Sans Bengali",system-ui,sans-serif;margin:0;padding:18px;color:#111;background:#fff}.inv{max-width:760px;margin:0 auto;position:relative}h2{margin:.1rem 0;color:#2563eb}p{margin:.15rem 0}.c{text-align:center}.r{text-align:right}.m{color:#666;font-size:.85em}' +
    'table{width:100%;border-collapse:collapse;margin:.6rem 0}th,td{border:1px solid #cfd5e6;padding:5px 8px;text-align:left;vertical-align:top}th{background:#f1f3f9}td.r,th.r{text-align:right}tr{page-break-inside:avoid}.tot td{font-weight:700;background:#eef2ff}.stamp{position:absolute;right:14px;top:96px;border:3px solid;border-radius:10px;padding:2px 14px;font-weight:800;letter-spacing:.1em;transform:rotate(-10deg);opacity:.8;font-size:1.3rem}' +
    '.paid{color:#059669}.due{color:#d97706}.void{color:#dc2626}.title{font-weight:800;letter-spacing:.06em}.sub{display:block;font-size:.78em;color:#666}hr{border:0;border-top:1px dashed #999;margin:.6rem 0}.bc{text-align:center;margin-top:.6rem}.bc svg{max-width:100%}@media print{body{padding:0}}';

  /* doc = {kind,title,no,date,party:[[label,value]...],cols:['Item',...],rows:[[...]],totals:[[label,value,bold]],stamp:'PAID'|'DUE'|'VOID'|'',notes:[...],file:'name'} */
  function barcode(no) {
    if (!no || !window.JsBarcode) return '';
    try { var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); JsBarcode(svg, String(no), { format: 'CODE128', height: 34, displayValue: true, fontSize: 12, margin: 2 }); return svg.outerHTML; } catch (e) { return ''; }
  }
  function body(d) {
    var S = PS(), cls = { PAID: 'paid', DUE: 'due', VOID: 'void', REFUND: 'void' }[d.stamp] || '';
    var lic = (S.licenseNo || S.binNo) ? '<p class="m">' + (S.licenseNo ? 'Drug Licence: ' + esc(S.licenseNo) : '') + (S.licenseNo && S.binNo ? ' | ' : '') + (S.binNo ? 'BIN: ' + esc(S.binNo) : '') + '</p>' : '';
    var logo = (S.logo && /^data:image\//.test(S.logo)) ? '<img src="' + S.logo + '" alt="" style="max-width:60%;max-height:60px;display:block;margin:0 auto .3rem">' : '';
    var ths = d.cols.map(function (c, i) { return '<th' + (i > 0 && d.num !== false ? ' class="r"' : '') + '>' + esc(c) + '</th>'; }).join('');
    var trs = d.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (i > 0 && d.num !== false ? ' class="r"' : '') + '>' + (i === 0 && d.html ? c : esc(c)) + '</td>'; }).join('') + '</tr>'; }).join('');
    var span = d.cols.length - 1, tf = d.totals.map(function (t) { return '<tr' + (t[2] ? ' class="tot"' : '') + '><td colspan="' + span + '" class="r">' + esc(t[0]) + '</td><td class="r">' + esc(t[1]) + '</td></tr>'; }).join('');
    return '<div class="inv">' + (d.stamp && S.invStamp !== false ? '<div class="stamp ' + cls + '">' + esc(d.stamp) + '</div>' : '') +
      '<div class="c">' + logo + '<h2>' + esc(S.store || 'MediCare Pharmacy') + '</h2><p>' + esc(S.address || '') + '</p><p>' + esc(S.phone || '') + (S.email ? ' | ' + esc(S.email) : '') + '</p>' + lic + '<hr><div class="title">' + esc(d.title) + '</div></div>' +
      '<p><b>No:</b> ' + esc(d.no) + '<br><b>Date:</b> ' + esc(d.date || '') + d.party.map(function (p) { return p[1] ? '<br><b>' + esc(p[0]) + ':</b> ' + esc(p[1]) : ''; }).join('') + '</p>' +
      '<table><thead><tr>' + ths + '</tr></thead><tbody>' + trs + '</tbody><tfoot>' + tf + '</tfoot></table>' +
      (d.notes || []).filter(Boolean).map(function (n) { return '<p class="m">' + esc(n) + '</p>'; }).join('') +
      (d.thanks !== false && S.invThanks !== false ? '<p class="c" style="margin-top:.8rem">' + esc(S.thanksLine || 'Thank you for choosing us — get well soon!') + '</p>' : '') +
      (S.invBarcode !== false ? '<div class="bc">' + barcode(d.no) + '</div>' : '') + '</div>';
  }
  function fullHtml(d) { return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(d.no) + '</title><style>' + CSS + (window.MCLAY ? MCLAY.docCss() : '') + '</style></head><body>' + body(d) + '</body></html>'; }

  function fname(d, ext) {
    var tpl = PS().invFile || '{no}', n = tpl.replace(/\{no\}/g, d.no || 'doc').replace(/\{customer\}/g, d.party && d.party[0] && d.party[0][1] || 'party').replace(/\{date\}/g, d.date || '');
    n = n.replace(/[^\wঀ-৿.\- ]+/g, '_').replace(/\s+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
    return (d.prefix || '') + (n || 'doc') + '.' + ext;
  }
  function log(d, fmt) { var u = user(), L = rj('pharmacy_dllog', []); L.unshift({ at: new Date().toISOString(), no: d.no || '', fmt: fmt, kind: d.kind || '', by: u.name || u.email || u.role || (window.me ? '' : '') }); wj('pharmacy_dllog', L.slice(0, 300)); }
  function save(blob, name) { var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); URL.revokeObjectURL(u); }, 1500); }
  function cc(v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function csv(d) {
    var n = d.cols.length, T = d.totals.map(function (t) { var r = []; for (var k = 0; k < n; k++) r.push(''); if (n === 1) r[0] = t[0] + ': ' + t[1]; else { r[n - 2] = t[0]; r[n - 1] = t[1]; } return r; });
    var L = [[d.title, d.no, d.date]].concat([d.cols], d.rows.map(function (r) { return r.map(function (c) { return String(c).replace(/<[^>]*>/g, ''); }); }), T);
    return '\ufeff' + L.map(function (r) { return r.map(cc).join(','); }).join('\r\n');
  }
  function dl(d, fmt) {
    if (!d) { toast('ডকুমেন্ট পাওয়া যায়নি', 'warning'); return; }
    if (fmt === 'html') { save(new Blob([fullHtml(d)], { type: 'text/html;charset=utf-8' }), fname(d, 'html')); log(d, 'html'); toast('HTML নামানো হয়েছে'); return; }
    if (fmt === 'csv') { save(new Blob([csv(d)], { type: 'text/csv;charset=utf-8' }), fname(d, 'csv')); log(d, 'csv'); toast('CSV নামানো হয়েছে'); return; }
    if (!window.MCLAY) { toast('লেআউট মডিউল লোড হয়নি', 'warning'); return; }
    toast('ফাইল তৈরি হচ্ছে…', 'info');
    MCLAY.render(body(d), CSS, fmt, fname(d, fmt)).then(function (ok) { if (ok) { log(d, fmt); toast(fmt.toUpperCase() + ' নামানো হয়েছে'); } else toast('ফাইল তৈরি করা যায়নি — HTML ডাউনলোড ব্যবহার করুন', 'warning'); });
  }
  function print(d) { if (window.MCLAY && d) { MCLAY.printHtml(fullHtml(d)); log(d, 'print'); } }
  function size(d) { if (window.MCLAY && d) MCLAY.open({ title: d.no, html: function () { return fullHtml(d); }, print: function () { print(d); }, pdf: function () { dl(d, 'pdf'); } }); }
  window.MCDOC = { dl: dl, print: print, html: fullHtml, size: size };

  function sel(d, label) {
    var s = document.createElement('select'); s.className = 'v118'; s.setAttribute('aria-label', label || 'Download');
    s.setAttribute('style', 'border:1px solid #c9d0e6;background:transparent;color:inherit;border-radius:10px;padding:.35rem .5rem;font:inherit;font-size:.85rem;min-height:34px');
    s.innerHTML = '<option value="">⬇ ডাউনলোড</option><option value="pdf">PDF</option><option value="png">ছবি (PNG)</option><option value="html">HTML</option><option value="csv">CSV</option><option value="size">📐 সাইজ / প্রিন্ট…</option>';
    s.onchange = function () { var v = s.value; s.value = ''; if (!v) return; var doc = typeof d === 'function' ? d() : d; if (v === 'size') size(doc); else dl(doc, v); };
    return s;
  }

  /* ================= Purchase ================= */
  function purDoc() {
    var id = typeof currentPurchaseId !== 'undefined' ? currentPurchaseId : null, PL = typeof purchases !== 'undefined' ? purchases : [], P = PL.filter(function (p) { return p.id === id; })[0]; if (!P) return null;
    var due = +P.due || 0, st = String(P.status || '').toLowerCase();
    var rows = (P.items || []).map(function (i, n) { return [(n + 1) + '. ' + (i.medicineName || 'N/A') + (i.batchNo || i.expiryDate ? '  [' + (i.batchNo ? 'Batch ' + i.batchNo : '') + (i.batchNo && i.expiryDate ? ' · ' : '') + (i.expiryDate ? 'Exp ' + String(i.expiryDate).slice(0, 10) : '') + ']' : ''), tk(i.unitPrice), String(i.qty || 0), tk(i.total != null ? i.total : (i.unitPrice || 0) * (i.qty || 0))]; });
    return { kind: 'purchase', title: 'PURCHASE INVOICE', no: P.invoiceNo || 'PO', prefix: 'PUR_', date: P.date, party: [['Supplier', P.supplierName], ['Payment', P.paymentMethod ? String(P.paymentMethod).toUpperCase() : ''], ['Status', st ? st.toUpperCase() : '']],
      cols: ['Medicine', 'Unit price', 'Qty', 'Total'], rows: rows, totals: [['Total', tk(P.totalAmount), true], ['Paid', tk(P.paid)], ['Due', tk(due)]], stamp: st === 'cancelled' ? 'VOID' : (due > 0.004 ? 'DUE' : 'PAID'), notes: [P.notes], thanks: false };
  }
  function purUI() {
    var ft = document.querySelector('#purchaseDetailsModal .modal-footer'); if (!ft || ft.querySelector('.v118')) return;
    var s = sel(purDoc, 'Download purchase invoice'); ft.insertBefore(s, ft.querySelector('.btn-success'));
    window.printPurchaseInvoice = function () { var d = purDoc(); if (d) print(d); };
  }

  /* ================= Refund credit note ================= */
  function refDoc(x) {
    var parts = String(x.items || '').split(';').map(function (t) { return t.trim(); }).filter(Boolean);
    var rows = parts.length ? parts.map(function (t, n) { return [(n + 1) + '. ' + t]; }) : [['—']];
    return { kind: 'refund', title: 'REFUND — CREDIT NOTE', no: 'CN-' + String(x.invoice || '') + '-' + String(x.at || '').slice(11, 19).replace(/:/g, ''), prefix: '', date: x.date, party: [['Against invoice', x.invoice], ['Method', String(x.method || 'cash').toUpperCase()], ['Reason', x.reason], ['Handled by', x.by]],
      cols: ['Returned items'], rows: rows, totals: [['Refund amount', tk(x.amount), true]], stamp: 'REFUND', num: false, thanks: false, notes: [] };
  }
  function refUI() {
    var tb = document.getElementById('r89B') || document.getElementById('hs'); if (!tb || tb.offsetParent === null && tb.id === 'hs') return;
    var H = rj('pharmacy_refunds', []), table = tb.closest('table'), n = table.querySelectorAll('thead th').length;
    [].forEach.call(tb.querySelectorAll('tr'), function (tr) {
      var td = tr.querySelectorAll('td'); if (td.length < 6 || tr.querySelector('.v118')) return;
      var dt = td[0].textContent.trim(), inv = td[1].textContent.trim(), it = td[2].textContent.trim();
      var x = H.filter(function (r) { return String(r.date) === dt && String(r.invoice) === inv && String(r.items) === it; }).pop(); if (!x) return;
      var c = document.createElement('td'); c.appendChild(sel(function () { return refDoc(x); }, 'Download credit note')); tr.appendChild(c);
    });
    var th = table.querySelector('thead tr'); if (th && th.children.length === n && !th.querySelector('.v118h')) th.insertAdjacentHTML('beforeend', '<th class="v118h">⬇</th>');
  }

  /* ================= Shop order invoice ================= */
  function ordDoc(o) {
    var rows = (o.items || []).map(function (i, n) { return [(n + 1) + '. ' + i.name, tk(i.price), String(i.qty), tk(i.price * i.qty)]; }), paid = /paid|bkash|nagad|card|online/i.test((o.pay || '') + (o.payRef ? ' paid' : '')) && o.payRef;
    var st = String(o.status || '');
    return { kind: 'order', title: 'ORDER INVOICE', no: o.no, prefix: '', date: new Date(o.at).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }), party: [['Customer', o.customer], ['Phone', o.phone], ['Address', o.addr], ['Payment', (o.pay || '') + (o.payRef ? ' · ref ' + o.payRef : '')], ['Status', st]],
      cols: ['Item', 'Price', 'Qty', 'Total'], rows: rows, totals: [['Subtotal', tk(o.sub)], ['Discount', '-' + tk(o.disc)], ['Delivery', tk(o.fee)], ['Total', tk(o.total), true]], stamp: /cancel|reject/i.test(st) ? 'VOID' : (paid || st === 'Delivered' && !/cod|cash/i.test(o.pay || '') ? 'PAID' : ''), notes: [] };
  }
  function ordUI() {
    var DB; try { DB = window.D || (typeof D !== 'undefined' ? D : null); } catch (e) { DB = null; } var m; try { m = typeof me === 'function' ? me() : window.me; } catch (e) { m = null; }
    if (!DB || !DB.orders || !m) return;
    [].forEach.call(document.querySelectorAll('article.card'), function (art) {
      if (art.querySelector('.v118')) return; var h = art.querySelector('h3'); if (!h) return;
      var no = (h.textContent || '').split(' · ')[0].trim(), o = DB.orders.filter(function (x) { return x.no === no && x.customer === m; })[0]; if (!o) return;
      var w = document.createElement('div'); w.className = 'v118w'; w.setAttribute('style', 'margin-top:.5rem'); w.appendChild(sel(function () { return ordDoc(o); }, 'Download invoice ' + no)); art.appendChild(w);
    });
  }

  function tick() { try { if (document.getElementById('purchaseDetailsModal')) purUI(); if (document.getElementById('hs')) refUI(); if (/shop\.html/.test(location.pathname)) ordUI(); } catch (e) { if (window.console) console.warn('invoice-v118', e); } }
  function ready(f) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(f, 80); }); else setTimeout(f, 80); }
  ready(function () { tick(); setInterval(tick, 700); });
})();
