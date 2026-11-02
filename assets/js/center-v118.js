/* v118 — Control Center → 🧾 Invoice Log
   কে, কখন, কোন ইনভয়েস/ডকুমেন্ট (বিক্রি / ক্রয় / রিফান্ড / শপ-অর্ডার) কোন ফরম্যাটে ডাউনলোড করেছে — `pharmacy_dllog` থেকে।
   ফিল্টার (ফরম্যাট/ধরন/ব্যক্তি/নম্বর), সারাংশ, CSV এক্সপোর্ট, লগ মুছুন (audit সহ)। */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  var tm = function (t) { return new Date(t).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' }); };
  var KIND = { '': 'বিক্রি', purchase: 'ক্রয়', refund: 'রিফান্ড', order: 'শপ অর্ডার' };
  window.CCX = function (c) {
    var x = prev(c), h = c.h, F = { q: '', fmt: '', kind: '' };
    x.panels.invlog = function () {
      var L = c.rj('pharmacy_dllog', []).filter(function (r) { return r && r.at; });
      var q = F.q.toLowerCase(), V = L.filter(function (r) { return (!F.fmt || r.fmt === F.fmt) && (!F.kind || (r.kind || '') === F.kind) && (!q || (String(r.no) + ' ' + String(r.by)).toLowerCase().indexOf(q) > -1); });
      var today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }), tc = L.filter(function (r) { return new Date(r.at).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }) === today; }).length;
      var cnt = function (k) { var o = {}; L.forEach(function (r) { var v = r[k] || (k === 'kind' ? '' : '—'); o[v] = (o[v] || 0) + 1; }); return Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }).slice(0, 4).map(function (v) { return (k === 'kind' ? KIND[v] || v : v) + ' ' + o[v]; }).join(' · ') || '—'; };
      var kp = h('div', { class: 'cc-grid' }, [['মোট ডাউনলোড', L.length], ['আজ', tc], ['ফরম্যাট', cnt('fmt')], ['সবচেয়ে সক্রিয়', cnt('by')]].map(function (k) { return h('div', { class: 'cc-card' }, h('div', { class: 'muted' }, k[0]), h('b', { style: 'font-size:1.1rem' }, String(k[1]))); }));
      var qi = h('input', { type: 'search', placeholder: '🔎 নম্বর / ব্যক্তি', 'aria-label': 'Search log', value: F.q });
      var fs = h('select', { 'aria-label': 'Format' }, [['', 'সব ফরম্যাট'], ['pdf', 'PDF'], ['png', 'PNG'], ['html', 'HTML'], ['csv', 'CSV'], ['csv-list', 'CSV (তালিকা)']].map(function (o) { return h('option', { value: o[0], selected: F.fmt === o[0] }, o[1]); }));
      var ks = h('select', { 'aria-label': 'Type' }, [['', 'সব ধরন'], ['purchase', 'ক্রয়'], ['refund', 'রিফান্ড'], ['order', 'শপ অর্ডার']].map(function (o) { return h('option', { value: o[0], selected: F.kind === o[0] }, o[1]); }));
      qi.onchange = function () { F.q = qi.value; c.show('invlog'); }; fs.onchange = function () { F.fmt = fs.value; c.show('invlog'); }; ks.onchange = function () { F.kind = ks.value; c.show('invlog'); };
      var rows = V.slice(0, 100).map(function (r) { return h('tr', {}, h('td', {}, tm(r.at)), h('td', {}, r.no || '—'), h('td', {}, KIND[r.kind || ''] || r.kind), h('td', {}, String(r.fmt || '').toUpperCase()), h('td', {}, r.by || '—')); });
      return h('div', {}, h('h2', {}, '🧾 Invoice Log'), h('p', { class: 'muted' }, 'ইনভয়েস/ডকুমেন্ট ডাউনলোডের রেকর্ড (সর্বশেষ ৩০০টি)। ডেমো মোডে এটি এই ব্রাউজারের ডেটা।'), kp,
        h('p', {}, qi, ' ', fs, ' ', ks, ' ', c.btn('⬇ CSV', function () {
          var R = [['Time', 'Number', 'Type', 'Format', 'By']].concat(V.map(function (r) { return [r.at, r.no, KIND[r.kind || ''] || r.kind, r.fmt, r.by]; }));
          var t = '﻿' + R.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n');
          var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv;charset=utf-8' })); a.download = 'invoice_log.csv'; document.body.appendChild(a); a.click(); a.remove();
        }, 'btn'), ' ', c.btn('🗑 লগ মুছুন', function () { if (!confirm('ডাউনলোড লগ পুরোপুরি মুছবেন?')) return; c.wj('pharmacy_dllog', []); c.audit('Invoice download log cleared (' + L.length + ' entries)'); c.show('invlog'); }, 'btn')),
        c.tbl(['কখন', 'নম্বর', 'ধরন', 'ফরম্যাট', 'কে'], rows, 'এখনও কোনো ডাউনলোড নেই'), V.length > 100 ? h('p', { class: 'muted' }, 'প্রথম ১০০টি দেখানো হলো — ফিল্টার করুন বা CSV নিন') : null);
    };
    x.tabs.push(['invlog', '🧾 Invoice Log']);
    return x;
  };
})();
