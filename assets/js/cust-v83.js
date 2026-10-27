/* v83 — Customer Management আপডেট:
   • গ্রাহক কার্ডে শেষ ক্রয় / কতবার / মোট খরচ + টিয়ার (🥈 Silver ≥৳৫,০০০ · 🥇 Gold ≥৳২০,০০০ · 🏆 Platinum ≥৳৫০,০০০) ও পয়েন্ট (প্রতি ৳১০০-তে ১)
   • সেগমেন্ট চিপ: বাকি · ভালো গ্রাহক · ৬০+ দিন আসেননি · নতুন (৩০ দিন) · ক্রেডিট লিমিটের কাছে — পেজিনেশনসহ কাজ করে
   • প্রোফাইলে আসল POS ডেটা: মোট/গড় বিল, প্রিয় ওষুধ, সাম্প্রতিক বিল, ক্রেডিট ব্যবহারের বার, WhatsApp/POS শর্টকাট
   • ফোন নম্বর যাচাই (বাংলাদেশি ফরম্যাট) ও একই নম্বরে ডুপ্লিকেট আটকানো
   • CSV ইম্পোর্ট (+ টেমপ্লেট): যাচাই, ডুপ্লিকেট বাদ, কতজন যোগ হলো/কেন বাদ গেল রিপোর্ট
   POS বিক্রি থেকে পাওয়া আসল তথ্যই ব্যবহার হয় (customerId দিয়ে, না থাকলে নাম মিলিয়ে)। */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(i) { return document.getElementById(i); }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); }
  function tk(n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
  function dk(ms) { return new Date(ms + 216e5).toISOString().slice(0, 10); }
  function daysAgo(ds) { return Math.floor((Date.parse(dk(Date.now())) - Date.parse(ds)) / 864e5); }
  function toast(m, t) { if (window.showToast) showToast(m, t || 'info'); }
  function last10(p) { return String(p || '').replace(/\D/g, '').slice(-10); }
  function normPhone(p) {
    var d = String(p || '').replace(/[^\d+]/g, ''), n = d.replace(/\D/g, '');
    if (/^(?:880|0)?1[3-9]\d{8}$/.test(n)) return { ok: true, bd: true, last10: n.slice(-10), pretty: '0' + n.slice(-10) };
    if (/^\+\d{8,15}$/.test(d)) return { ok: true, bd: false, last10: n.slice(-10), pretty: d };
    return { ok: false };
  }

  /* ---------- POS ডেটা থেকে হিসাব ---------- */
  var cache = null, cacheAt = 0;
  function sales() { var n = Date.now(); if (!cache || n - cacheAt > 1500) { cache = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status !== 'Voided'; }); cacheAt = n; } return cache; }
  function mine(c) { return sales().filter(function (s) { return s.customerId != null ? String(s.customerId) === String(c.id) : (s.customer && s.customer === c.name); }); }
  var TIERS = [[50000, '🏆 Platinum'], [20000, '🥇 Gold'], [5000, '🥈 Silver']];
  function stat(c) {
    var L = mine(c), spend = 0, last = '', items = {};
    L.forEach(function (s) { spend += +s.total || 0; var d = s.date || (s.at ? dk(Date.parse(s.at)) : ''); if (d > last) last = d; (s.items || []).forEach(function (i) { items[i.name] = (items[i.name] || 0) + (+i.quantity || 0); }); });
    var life = Math.max(spend, +c.totalPurchases || 0), t = ''; for (var i = 0; i < TIERS.length; i++) if (life >= TIERS[i][0]) { t = TIERS[i][1]; break; }
    var fav = Object.keys(items).sort(function (a, b) { return items[b] - items[a]; }).slice(0, 3);
    return { L: L, n: L.length, spend: spend, avg: L.length ? spend / L.length : 0, last: last, life: life, tier: t, points: Math.floor(life / 100), fav: fav, favQ: items };
  }
  function seg(c, k) {
    var st = stat(c), due = +c.due || 0;
    if (k === 'due') return due > 0;
    if (k === 'good') return !!st.tier;
    if (k === 'lapsed') { var ref = st.last || ''; return !!ref && daysAgo(ref) >= 60; }
    if (k === 'new') return !!c.joinDate && daysAgo(c.joinDate) <= 30;
    if (k === 'limit') return +c.creditLimit > 0 && due >= 0.8 * +c.creditLimit;
    return true;
  }

  var css = '.v83bar{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 1rem}.v83bar button{border:1px solid rgba(128,128,170,.45);background:transparent;color:inherit;border-radius:999px;padding:.25rem .8rem;font-size:.85rem;cursor:pointer}.v83bar button.on{background:#667eea;color:#fff;border-color:#667eea}' +
    '.v83x{font-size:.78rem;opacity:.85;margin:-.4rem 0 .6rem}.v83p{border:1px solid rgba(128,128,170,.3);border-radius:14px;padding:.8rem 1rem;margin-bottom:1rem}.v83p .g{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:.6rem;text-align:center}.v83p .g b{display:block;font-size:1.1rem}.v83p .g small{opacity:.7}' +
    '.v83cr{height:8px;border-radius:99px;background:rgba(128,128,170,.25);overflow:hidden;margin:.4rem 0}.v83cr i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#f59e0b,#ef4444);background-size:300% 100%}' +
    '.v83p table{width:100%;font-size:.85rem}.v83p td{padding:.15rem .3rem;border-bottom:1px dashed rgba(128,128,170,.25)}';
  var st0 = document.createElement('style'); st0.textContent = css; document.head.appendChild(st0);

  var segKey = 'all';
  var SEGS = [['all', 'সব'], ['due', '💰 বাকি'], ['good', '🥇 ভালো গ্রাহক'], ['lapsed', '😴 ৬০+ দিন আসেননি'], ['new', '🆕 নতুন (৩০ দিন)'], ['limit', '⚠ ক্রেডিট সীমার কাছে']];

  function chips() {
    var host = $('v83Chips'), grid = $('customersGrid'); if (!grid) return;
    if (!host) { host = document.createElement('div'); host.id = 'v83Chips'; host.className = 'v83bar'; host.setAttribute('role', 'tablist'); grid.before(host); host.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; segKey = b.dataset.k; window.currentPage = 1; try { currentPage = 1; } catch (x) { } window.displayCustomers(); }); }
    var all = (typeof customers !== 'undefined') ? customers : [];
    host.innerHTML = SEGS.map(function (s) { var n = s[0] === 'all' ? all.length : all.filter(function (c) { return seg(c, s[0]); }).length; return '<button type="button" data-k="' + s[0] + '" class="' + (segKey === s[0] ? 'on' : '') + '">' + s[1] + ' (' + bn(n) + ')</button>'; }).join('');
  }
  function decorate() {
    var all = customers;
    [].forEach.call(document.querySelectorAll('#customersGrid .card-body'), function (b) {
      var btn = b.querySelector('button[onclick^="viewCustomer"]'); if (!btn) return; var id = +btn.getAttribute('onclick').replace(/\D/g, ''), c = all.filter(function (x) { return x.id === id; })[0]; if (!c || b.querySelector('.v83x')) return;
      var s = stat(c), line = s.n ? '🕒 শেষ ক্রয় ' + (daysAgo(s.last) <= 0 ? 'আজ' : bn(daysAgo(s.last)) + ' দিন আগে') + ' · ' + bn(s.n) + ' বার' : '🕒 POS-এ এখনো ক্রয় নেই';
      var d = document.createElement('div'); d.className = 'v83x'; d.textContent = line + (s.tier ? ' · ' + s.tier : '') + (s.points ? ' · ⭐ ' + bn(s.points) : ''); var row = b.querySelector('.d-flex.justify-content-around'); if (row) row.before(d); else b.appendChild(d);
    });
  }
  /* displayCustomers-কে সেগমেন্ট-সচেতন করা */
  var origDisp = window.displayCustomers;
  window.displayCustomers = function () {
    cache = null; var all = customers;
    if (segKey !== 'all') customers = all.filter(function (c) { return seg(c, segKey); });
    try { origDisp.apply(this, arguments); } finally { customers = all; }
    chips(); decorate();
  };
  /* প্রোফাইল */
  var origView = window.viewCustomer;
  window.viewCustomer = function (id) {
    origView.apply(this, arguments);
    try {
      var c = customers.filter(function (x) { return x.id === id; })[0]; var host = $('customerDetails'); if (!c || !host) return; cache = null;
      var s = stat(c), due = +c.due || 0, lim = +c.creditLimit || 0, use = lim ? Math.min(100, due / lim * 100) : 0, ph = normPhone(c.phone), wa = ph.ok ? (ph.bd ? '88' + ph.pretty : ph.pretty.replace(/\D/g, '')) : '';
      var recent = s.L.slice().sort(function (a, b) { return String(b.at || b.date) > String(a.at || a.date) ? 1 : -1; }).slice(0, 5);
      var d = document.createElement('div'); d.className = 'v83p'; d.innerHTML = '<div class="d-flex justify-content-between flex-wrap gap-2 mb-2"><b>📊 POS-ভিত্তিক সারাংশ</b><span>' + (s.tier || 'নতুন/সাধারণ') + (s.points ? ' · ⭐ ' + bn(s.points) + ' পয়েন্ট' : '') + '</span></div>' +
        '<div class="g"><div><b>' + tk(s.spend) + '</b><small>মোট POS খরচ</small></div><div><b>' + bn(s.n) + '</b><small>বিল</small></div><div><b>' + tk(s.avg) + '</b><small>গড় বিল</small></div><div><b>' + (s.last ? (daysAgo(s.last) <= 0 ? 'আজ' : bn(daysAgo(s.last)) + ' দিন আগে') : '—') + '</b><small>শেষ ক্রয়</small></div></div>' +
        (lim ? '<div class="mt-2 small">ক্রেডিট ব্যবহার: ' + tk(due) + ' / ' + tk(lim) + ' (' + bn(Math.round(use)) + '%)</div><div class="v83cr"><i style="width:' + use + '%"></i></div>' : '') +
        (s.fav.length ? '<div class="small mt-2">💊 প্রিয়: ' + s.fav.map(function (n) { return esc(n) + ' ×' + bn(s.favQ[n]); }).join(' · ') + '</div>' : '') +
        (recent.length ? '<table class="mt-2">' + recent.map(function (r) { return '<tr><td>' + esc(r.invoiceNo) + '</td><td>' + esc(r.date || '') + '</td><td>' + tk(r.total) + '</td><td>' + (r.due ? '<span class="text-danger">বাকি</span>' : '✔') + '</td></tr>'; }).join('') + '</table>' : '<div class="small mt-2 text-muted">এই গ্রাহকের নামে POS-এ এখনো বিল নেই।</div>') +
        '<div class="d-flex flex-wrap gap-2 mt-2"><a class="btn btn-sm btn-outline-primary" href="sales.html">🧾 POS-এ নতুন বিক্রি</a>' + (wa ? '<a class="btn btn-sm btn-outline-success" target="_blank" rel="noopener" href="https://wa.me/' + wa + '">💬 WhatsApp</a>' : '') + '</div>';
      host.prepend(d);
    } catch (e) { if (window.console) console.warn('cust-v83', e); }
  };
  /* ফোন যাচাই + ডুপ্লিকেট */
  var origSave = window.saveCustomer;
  window.saveCustomer = function () {
    var phEl = $('custPhone'), idv = $('editCustomerId') ? $('editCustomerId').value : '', ph = phEl ? phEl.value.trim() : '';
    if (ph) {
      var cur = idv ? customers.filter(function (c) { return String(c.id) === String(idv); })[0] : null, changed = !cur || last10(cur.phone) !== last10(ph) || cur.phone !== ph;
      if (changed) {
        var n = normPhone(ph);
        if (!n.ok) { toast('ফোন নম্বর ঠিক নেই — যেমন 01712345678 বা +8801712345678', 'danger'); phEl.focus(); return; }
        var dup = customers.filter(function (c) { return String(c.id) !== String(idv) && last10(c.phone) === n.last10; })[0];
        if (dup) { toast('এই নম্বরে আগেই আছেন: ' + dup.name, 'warning'); phEl.focus(); return; }
        if (n.bd) phEl.value = n.pretty;
      }
    }
    return origSave.apply(this, arguments);
  };

  /* ---------- CSV ইম্পোর্ট ---------- */
  function parseCSV(t) {
    var rows = [], row = [], f = '', q = false, i, ch;
    t = t.replace(/^﻿/, '');
    for (i = 0; i < t.length; i++) { ch = t[i]; if (q) { if (ch === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; } else if (ch === '"') q = true; else if (ch === ',') { row.push(f); f = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(f); f = ''; if (row.some(function (x) { return x.trim(); })) rows.push(row); row = []; } else f += ch; }
    row.push(f); if (row.some(function (x) { return x.trim(); })) rows.push(row); return rows;
  }
  function importCSV(text) {
    var R = parseCSV(text); if (R.length < 2) { toast('ফাইলে কোনো ডেটা সারি নেই', 'danger'); return; }
    var H = R[0].map(function (h) { return h.trim().toLowerCase().replace(/[^a-z]/g, ''); }), ix = function (n) { return H.indexOf(n); }, iN = ix('name'), iP = ix('phone');
    if (iN < 0 || iP < 0) { toast('হেডারে অন্তত name ও phone কলাম থাকতে হবে (টেমপ্লেট নামিয়ে দেখুন)', 'danger'); return; }
    var seen = {}; customers.forEach(function (c) { seen[last10(c.phone)] = 1; });
    var ok = [], bad = [], nextId = customers.reduce(function (m, c) { return Math.max(m, +c.id || 0); }, 0) + 1, today = dk(Date.now());
    R.slice(1).forEach(function (r, k) {
      var g = function (n) { var i = ix(n); return i < 0 ? '' : String(r[i] || '').trim(); }, nm = g('name'), p = normPhone(g('phone')), line = k + 2;
      if (nm.length < 2) return bad.push('সারি ' + line + ': নাম নেই');
      if (!p.ok) return bad.push('সারি ' + line + ' (' + nm + '): ফোন ঠিক নেই');
      if (seen[p.last10]) return bad.push('সারি ' + line + ' (' + nm + '): নম্বর আগেই আছে');
      seen[p.last10] = 1; var type = g('type').toLowerCase(); if (['regular', 'vip', 'wholesale'].indexOf(type) < 0) type = 'regular';
      var dob = /^\d{4}-\d{2}-\d{2}$/.test(g('dob')) ? g('dob') : '';
      ok.push({ id: nextId++, name: nm, phone: p.pretty, email: g('email'), address: g('address'), type: type, due: Math.max(0, parseFloat(g('due')) || 0), totalPurchases: 0, joinDate: today, creditLimit: Math.max(0, parseFloat(g('creditlimit')) || 1000), notes: g('notes'), dob: dob });
    });
    var msg = bn(ok.length) + ' জন যোগ হবে' + (bad.length ? ', ' + bn(bad.length) + 'টি বাদ যাবে:\n' + bad.slice(0, 6).join('\n') + (bad.length > 6 ? '\n…' : '') : '') + '\n\nযোগ করবেন?';
    var go = function () { if (!ok.length) return; customers.push.apply(customers, ok); saveCustomersToStorage(); currentPage = 1; displayCustomers(); toast(bn(ok.length) + ' জন গ্রাহক যোগ হয়েছে', 'success'); };
    if (!ok.length) { toast('কেউ যোগ করার মতো নেই — ' + (bad[0] || ''), 'warning'); return; }
    if (window.MCD && MCD.confirm) MCD.confirm(msg).then(function (v) { if (v) go(); }); else if (confirm(msg)) go();
  }
  function importUI() {
    var ex = document.querySelector('button[onclick="exportCustomers()"]'); if (!ex || $('v83Imp')) return;
    var col = ex.parentElement, w = document.createElement('div'); w.className = 'col-md-2';
    w.innerHTML = '<label class="btn btn-outline-secondary w-100 rounded-3 mb-0" title="name,phone,email,address,type,dob,due,creditLimit"><i class="fas fa-file-import me-2"></i>Import CSV<input type="file" id="v83Imp" accept=".csv,text/csv" hidden></label><a href="#" id="v83Tpl" class="small d-block text-center mt-1">টেমপ্লেট নামান</a>';
    col.after(w);
    $('v83Imp').addEventListener('change', function () { var f = this.files[0]; if (!f) return; if (f.size > 2e6) { toast('ফাইল ২ MB-এর বেশি', 'danger'); return; } var r = new FileReader(); r.onload = function () { importCSV(String(r.result)); }; r.readAsText(f); this.value = ''; });
    $('v83Tpl').addEventListener('click', function (e) { e.preventDefault(); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['name,phone,email,address,type,dob,due,creditLimit\nRahim Uddin,01712345678,rahim@example.com,"Mirpur 10, Dhaka",regular,1990-05-20,0,1000\n'], { type: 'text/csv' })); a.download = 'customers-template.csv'; document.body.appendChild(a); a.click(); a.remove(); });
  }

  function init() { importUI(); try { window.displayCustomers(); } catch (e) { } }
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
