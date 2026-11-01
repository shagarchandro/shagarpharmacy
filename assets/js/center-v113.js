/* v113 — Control Center → 🧩 Features (পুরো মডিউল-কন্ট্রোল)
   • ১১টি মডিউল সুইচ (আগে ৬টি): + Customers, Suppliers, Purchases, Reports, Prescriptions (Dashboard/Medicines/POS/Backup কখনো বন্ধ হয় না)
   • সময়ভিত্তিক বন্ধ (১ ঘণ্টা … ৭ দিন, নিজে থেকে আবার চালু) • বন্ধ থাকলে স্টাফকে দেখানোর বার্তা • ব্যবহার-তথ্য (কয়টি রেকর্ড আছে)
   • এক-ক্লিক প্রিসেট • নির্ভরতার সতর্কতা • কে কখন কী বদলাল তার লগ (CSV) */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var F = [
    ['team', 'Team Board', 'নোটিশ, হ্যান্ডওভার নোট ও কাজ', 'pharmacy_team'], ['refunds', 'Refunds', 'বিক্রি ফেরত ও রিফান্ড', 'pharmacy_refunds'], ['writeoff', 'Expiry write-off', 'মেয়াদ-শেষ স্টক বাদ', 'pharmacy_writeoffs'],
    ['register', 'Rx register', 'প্রেসক্রিপশন ডিসপেন্সিং রেজিস্টার', null], ['closing', 'Daily closing', 'দিনের শেষে ক্যাশ মেলানো', 'pharmacy_closings'], ['reorder', 'Reorder list', 'কম স্টকের কেনার তালিকা', null],
    ['customers', 'Customers', 'কাস্টমার ও বাকির খাতা', 'pharmacy_customers'], ['suppliers', 'Suppliers', 'সাপ্লায়ার ও বকেয়া', 'pharmacy_suppliers'], ['purchases', 'Purchases', 'ক্রয়/ইনভয়েস ও স্টক ইন', 'pharmacy_purchases'],
    ['reports', 'Reports', 'বিক্রি, লাভ ও বিশ্লেষণ রিপোর্ট', 'pharmacy_sales'], ['prescriptions', 'Prescriptions', 'প্রেসক্রিপশন গ্রহণ ও যাচাই', 'pharmacy_prescriptions']
  ];
  var DUR = [['0', 'যতক্ষণ না চালু করি'], ['1', '১ ঘণ্টা'], ['4', '৪ ঘণ্টা'], ['12', '১২ ঘণ্টা'], ['24', '১ দিন'], ['168', '৭ দিন']];
  var PRE = { full: ['সব চালু', []], retail: ['Rx ছাড়া দোকান', ['register', 'prescriptions']], lean: ['ছোট দোকান (কম মডিউল)', ['team', 'writeoff', 'register', 'closing', 'prescriptions', 'suppliers']], core: ['শুধু মূল (Dashboard/Medicines/POS)', F.map(function (f) { return f[0]; })] };
  function esc(t) { return String(t == null ? '' : t); }
  function csv(name, rows) { var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"'; }, b = new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500); }
  function sweep(S) { var U = S.featuresUntil || {}, ch = false; Object.keys(U).forEach(function (k) { if (+U[k] <= Date.now()) { if (S.features) delete S.features[k]; delete U[k]; ch = true; } }); S.featuresUntil = U; return ch; }

  window.CCX = function (c) {
    var x = prev(c), h = c.h;
    x.panels.features = function () {
      var S = rj('pharmacy_settings', {}); if (sweep(S)) c.wj('pharmacy_settings', S);
      var Fo = S.features || {}, U = S.featuresUntil || {}, M = S.featureMsg || {}, boxes = {}, durs = {}, msgs = {};
      var off = F.filter(function (f) { return Fo[f[0]] === false; }).length;
      var cards = F.map(function (f) {
        var k = f[0], n = f[3] ? (function () { var v = rj(f[3], null); return Array.isArray(v) ? v.length : null; })() : null, un = U[k] ? Math.max(1, Math.ceil((U[k] - Date.now()) / 36e5)) : 0;
        var cb = h('input', { type: 'checkbox', name: k, checked: Fo[k] !== false ? 'checked' : null }); boxes[k] = cb;
        var sel = h('select', { 'aria-label': 'বন্ধ থাকার সময় ' + f[1] }, (un ? [['keep', 'চলমান (' + un + ' ঘণ্টা বাকি)']] : []).concat(DUR).map(function (d) { return h('option', { value: d[0] }, d[1]); })); durs[k] = sel;
        var msg = h('input', { value: M[k] || '', maxlength: 140, placeholder: 'স্টাফকে বার্তা (যেমন: স্টক-টেক চলছে, বিকেল ৪টায় চালু)', 'aria-label': 'বার্তা ' + f[1], style: 'width:100%' }); msgs[k] = msg;
        var det = h('div', { class: 'v113d', style: 'margin-top:.4rem' }, h('label', { class: 'muted' }, 'বন্ধ থাকবে: ', sel), msg);
        var sync = function () { det.style.display = cb.checked ? 'none' : ''; card.classList.toggle('v113off', !cb.checked); }; cb.addEventListener('change', sync);
        var card = h('div', { class: 'cc-card' }, h('label', { class: 'cc-chk' }, cb, h('b', {}, ' ' + f[1])), h('small', { class: 'muted', style: 'display:block' }, f[2] + (n != null ? ' · ' + n + 'টি রেকর্ড আছে (বন্ধ করলেও থাকবে)' : '')), un ? h('small', { style: 'color:#b45309;display:block' }, '⏱ ' + un + ' ঘণ্টা পর নিজে থেকে চালু হবে') : '', det);
        sync(); return card;
      });
      var preset = h('select', { 'aria-label': 'প্রিসেট', onchange: function (e) { var p = PRE[e.target.value]; if (!p) return; F.forEach(function (f) { boxes[f[0]].checked = p[1].indexOf(f[0]) < 0; boxes[f[0]].dispatchEvent(new Event('change')); }); c.ok('প্রিসেট বসানো হয়েছে — "Save features" চাপলে কার্যকর'); } },
        [h('option', { value: '' }, 'প্রিসেট বেছে নিন…')].concat(Object.keys(PRE).map(function (k) { return h('option', { value: k }, PRE[k][0]); })));
      var f = h('form', { class: 'cc-form', onsubmit: function (e) {
        e.preventDefault(); var N = rj('pharmacy_settings', {}), old = N.features || {}, oldU = N.featuresUntil || {}; sweep(N);
        var feats = {}, until = {}, msg = {}, ch = [];
        F.forEach(function (ft) {
          var k = ft[0], on = boxes[k].checked;
          if (!on) { feats[k] = false; var d = durs[k].value; if (d === 'keep' && oldU[k] > Date.now()) until[k] = oldU[k]; else if (+d > 0) until[k] = Date.now() + (+d) * 36e5; var m = msgs[k].value.trim().slice(0, 140); if (m) msg[k] = m; }
          if ((old[k] === false) !== !on) ch.push((on ? '✅ চালু: ' : '⛔ বন্ধ: ') + ft[1] + (!on && until[k] ? ' (' + Math.round((until[k] - Date.now()) / 36e5) + ' ঘণ্টা)' : ''));
        });
        var warn = []; if (feats.purchases === false && feats.suppliers !== false) warn.push('Purchases বন্ধ কিন্তু Suppliers চালু — ক্রয় ছাড়া সাপ্লায়ার বকেয়া মেলানো কঠিন হবে।');
        if (feats.prescriptions === false && feats.register !== false) warn.push('Prescriptions বন্ধ কিন্তু Rx register চালু — নতুন প্রেসক্রিপশন নেওয়া যাবে না।');
        if (feats.customers === false) warn.push('Customers বন্ধ — বাকির খাতা দেখা/আদায় করা যাবে না।');
        if (feats.reports === false) warn.push('Reports বন্ধ — স্টাফ বিক্রির রিপোর্ট দেখতে পাবে না।');
        if (warn.length && !confirm('সতর্কতা:\n• ' + warn.join('\n• ') + '\n\nতবুও সেভ করবেন?')) return;
        N.features = feats; N.featuresUntil = until; N.featureMsg = msg; c.wj('pharmacy_settings', N);
        if (ch.length) { var L = rj('pharmacy_featlog', []); L.push({ at: new Date().toISOString(), by: (function () { try { return (JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || {}).name || 'Admin'; } catch (er) { return 'Admin'; } })(), ch: ch }); c.wj('pharmacy_featlog', L.slice(-60)); }
        c.audit('Feature switches: ' + (ch.join('; ') || 'no change')); c.ok(ch.length ? 'সেভ হয়েছে — ' + ch.length + 'টি বদল' : 'কোনো বদল নেই'); c.show('features');
      } }, h('p', {}, preset), h('div', { class: 'cc-grid' }, cards), h('p', { class: 'muted' }, 'Dashboard, Medicines, POS Sales আর Backup কখনো বন্ধ হয় না। বন্ধ মডিউলের ডাটা অক্ষত থাকে।'), h('button', { class: 'btn' }, 'Save features'));
      var L = rj('pharmacy_featlog', []).slice().reverse();
      var st = document.getElementById('v113css') || (function () { var s = document.createElement('style'); s.id = 'v113css'; s.textContent = '.v113off{opacity:.92;border-color:#f0d38a!important;background:#fff8e6}.v113d input,.v113d select{max-width:100%}'; document.head.appendChild(s); return s; })();
      return h('div', {}, h('h2', {}, '🧩 Features — মডিউল কন্ট্রোল'), h('p', { class: 'muted' }, off ? '⛔ এখন ' + off + 'টি মডিউল বন্ধ আছে।' : '✅ সব মডিউল চালু।'), f,
        h('h3', {}, '📜 কে কখন কী বদলেছে'), c.tbl(['সময়', 'কে', 'বদল'], L.slice(0, 20).map(function (r) { return h('tr', {}, h('td', {}, new Date(r.at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' })), h('td', {}, esc(r.by)), h('td', {}, (r.ch || []).join(' · '))); }), 'এখনো কোনো বদল নেই'),
        L.length ? h('p', {}, c.btn('⬇ CSV', function () { csv('feature-log.csv', [['At', 'By', 'Changes']].concat(L.map(function (r) { return [r.at, r.by, (r.ch || []).join(' | ')]; }))); }, 'btn')) : '');
    };
    return x;
  };
})();
