/* v95 — Navbar আপডেট (navbar-v79 এর পরে লোড হয়):
   • যেসব স্টাফ পেজে আগে কোনো টপ-বার ছিল না (Team, Closing, Reorder, Backup, Refunds, Write-off, Rx Register) সেখানে এখন বার + "← ড্যাশবোর্ড"
   • সব বারে: 🔒 লক বাটন (v94 PIN), "আজ ৳… · N বিল" চিপ, অফলাইন সতর্কতা, Quick মেনুতে "🕘 সাম্প্রতিক পেজ"
   • Dashboard গ্লোবাল সার্চ নতুন করে: ওষুধ (নাম/জেনেরিক/বারকোড/ব্যাচ), কাস্টমার (নাম/ফোন), বিক্রি (ইনভয়েস/কাস্টমার), সাপ্লায়ার, প্রেসক্রিপশন, পেজ
     — ↑↓ Enter Esc, সাম্প্রতিক সার্চ, নিরাপদ HTML (আগে নামে < থাকলে ভেঙে যেত), হাইলাইট বাগ ঠিক ("৳1" দেখাত) */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function user() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'); } catch (e) { return null; } }
  var U = user(); if (!U) return;
  var page = (location.pathname.split('/').pop() || 'index.html');
  var email = String(U.email || '').toLowerCase();
  function prefs() { try { return (rj('pharmacy_prefs_v80', {})[email]) || {}; } catch (e) { return {}; } }
  function day(t) { return new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); }
  function money(n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN'); }
  function say(t) { try { if (window.toast) { window.toast(t); return; } } catch (e) { } try { if (window.showToast) { window.showToast(t, 'info'); return; } } catch (e) { } }

  var TITLES = { 'dashboard.html': '🏠 Dashboard', 'sales.html': '🧾 Sales / POS', 'medicines.html': '💊 Medicines', 'customers.html': '👥 Customers', 'purchases.html': '📥 Purchases', 'suppliers.html': '🏭 Suppliers', 'prescriptions.html': '📋 Prescriptions', 'reports.html': '📊 Reports', 'team.html': '📌 Team Board', 'closing.html': '🧮 Daily Closing', 'reorder.html': '🛒 Reorder List', 'backup.html': '💾 Backup', 'refunds.html': '↩️ Refunds', 'writeoff.html': '🗑 Write-off', 'register.html': '📒 Rx Register' };

  /* ---------- সাম্প্রতিক পেজ ---------- */
  var RK = 'mc_recent_pages';
  (function track() {
    if (!TITLES[page]) return;
    var L = rj(RK, []).filter(function (p) { return p !== page; }); L.unshift(page);
    try { localStorage.setItem(RK, JSON.stringify(L.slice(0, 6))); } catch (e) { }
  })();

  var css = '.mcn-chip{font-size:.8rem;padding:.2rem .6rem;border-radius:999px;background:rgba(16,185,129,.14);color:#047857;white-space:nowrap;text-decoration:none}body.dark-mode .mcn-chip{color:#6ee7b7}' +
    '.mcn-off{background:#fee2e2;color:#b91c1c;font-weight:700;display:none}.mcn-off.on{display:inline-block}' +
    '.mcn-rh{font-size:.72rem;opacity:.65;padding:.35rem .7rem .1rem}' +
    '.mcs-i.sel{background:rgba(102,126,234,.18)}.mcs-h{font-size:.72rem;opacity:.7;padding:.4rem .9rem .2rem;display:flex;justify-content:space-between}.mcs-h a{cursor:pointer;text-decoration:underline}' +
    '@media(max-width:768px){.mcn-chip.mcn-today{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- বারে যোগ ---------- */
  function todayChip() {
    var P = prefs(); if (P.noMoney) return null;
    var ac = {}; try { ac = JSON.parse(localStorage.getItem('user_access') || sessionStorage.getItem('user_access') || '{}') || {}; } catch (e) { }
    if (ac.sales === false) return null;
    var a = document.createElement('a'); a.className = 'mcn-chip mcn-today'; a.href = 'closing.html'; a.title = 'আজকের বিক্রি — ডে-ক্লোজিং খুলুন';
    function upd() {
      var td = day(new Date()), L = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status !== 'Voided' && day(s.at || s.date) === td; });
      a.textContent = '💰 আজ ' + money(L.reduce(function (x, s) { return x + (+s.total || 0); }, 0)) + ' · ' + L.length + ' বিল';
    }
    upd(); setInterval(upd, 30000); addEventListener('storage', upd); return a;
  }
  function lockBtn() {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mcn-btn mcn-lock'; b.title = 'স্ক্রিন লক (Ctrl+L)'; b.setAttribute('aria-label', 'Lock screen'); b.textContent = '🔒';
    b.onclick = function () {
      if (window.MCLock && MCLock.has()) { MCLock.lock(); return; }
      var m = 'আগে PIN সেট করুন: Dashboard → ইউজার মেনু → Settings → Security।';
      if (window.MCD && MCD.alert) MCD.alert(m); else alert(m);
    };
    return b;
  }
  function offChip() {
    var o = document.createElement('span'); o.className = 'mcn-chip mcn-off'; o.textContent = '⚠ অফলাইন';
    function s() { o.classList.toggle('on', !navigator.onLine); }
    s(); addEventListener('online', function () { s(); say('ইন্টারনেট ফিরেছে'); }); addEventListener('offline', function () { s(); say('ইন্টারনেট নেই — ডেটা এই ডিভাইসে সেভ হচ্ছে'); });
    return o;
  }
  function recentIntoQuick(host) {
    var m = $('.mcn-menu', host); if (!m || $('.mcn-rh', m)) return;
    var L = rj(RK, []).filter(function (p) { return p !== page && TITLES[p]; }).slice(0, 4); if (!L.length) return;
    var h = document.createElement('div'); h.className = 'mcn-rh'; h.textContent = '🕘 সাম্প্রতিক পেজ'; m.appendChild(h);
    L.forEach(function (p) { var a = document.createElement('a'); a.setAttribute('role', 'menuitem'); a.href = p; a.textContent = TITLES[p]; m.appendChild(a); });
  }
  function pinsIntoQuick(host) {
    var m = $('.mcn-menu', host); if (!m || $('.mcn-ph', m)) return;
    var P = (rj('pharmacy_pins', {})[email] || []).filter(function (p) { return TITLES[p]; }).slice(0, 4); if (!P.length) return;
    var h = document.createElement('div'); h.className = 'mcn-rh mcn-ph'; h.textContent = '📌 পিন করা'; m.insertBefore(h, m.firstChild);
    P.slice().reverse().forEach(function (p) { var a = document.createElement('a'); a.setAttribute('role', 'menuitem'); a.href = p; a.textContent = TITLES[p]; m.insertBefore(a, h.nextSibling); });
  }
  function enhanceBar() {
    var host = $('.mcn-bar') || $('nav.navbar .ms-auto'); if (!host || $('.mcn-lock', host)) return;
    var dd = $('.mcn-dd', host), at = dd ? dd.nextSibling : null;
    var parts = [todayChip(), offChip(), lockBtn()].filter(Boolean);
    parts.forEach(function (p) { host.insertBefore(p, dd || host.firstChild); });
    if (dd) { recentIntoQuick(dd); pinsIntoQuick(dd); }
    var bar = $('.mcn-bar');
    if (bar && !$('#sidebar') && page !== 'dashboard.html' && !$('.mcn-home', bar)) {
      var a = document.createElement('a'); a.href = 'dashboard.html'; a.className = 'mcn-btn mcn-home'; a.style.textDecoration = 'none'; a.textContent = '← ড্যাশবোর্ড'; bar.insertBefore(a, bar.firstChild);
    }
  }

  /* ---------- গ্লোবাল সার্চ (Dashboard) ---------- */
  var SK = 'pharmacy_recent_search';
  function searchUp() {
    var inp = document.getElementById('globalSearch'), box = document.getElementById('searchResults'), clr = document.getElementById('clearSearch');
    if (!inp || !box || inp.__v95) return; inp.__v95 = 1;
    var items = [], sel = -1;
    function hl(t, q) { var s = esc(t); if (!q) return s; var e = esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); try { return s.replace(new RegExp('(' + e + ')', 'gi'), '<span class="search-highlight">$1</span>'); } catch (x) { return s; } }
    function has(v, q) { return String(v == null ? '' : v).toLowerCase().indexOf(q) > -1; }
    function find(raw) {
      var q = raw.toLowerCase(), R = [];
      rj('pharmacy_medicines', []).forEach(function (m) { if (m && (has(m.name, q) || has(m.genericName, q) || has(m.barcode, q) || has(m.batchNo, q))) R.push({ g: 'ওষুধ', i: 'fa-capsules', t: m.name, s: 'স্টক ' + (m.stock || 0) + ' · ৳' + (m.sellingPrice || 0) + (m.genericName ? ' · ' + m.genericName : '') + (m.batchNo ? ' · ব্যাচ ' + m.batchNo : ''), l: 'medicines.html' }); });
      rj('pharmacy_customers', []).forEach(function (c) { if (c && (has(c.name, q) || has(c.phone, q))) R.push({ g: 'কাস্টমার', i: 'fa-user', t: c.name, s: (c.phone || '') + ' · বাকি ৳' + (c.due || 0), l: 'customers.html' }); });
      rj('pharmacy_sales', []).slice(0, 400).forEach(function (o) { if (o && (has(o.invoiceNo, q) || has(o.customer, q))) R.push({ g: 'বিক্রি', i: 'fa-receipt', t: o.invoiceNo || '—', s: (o.customer || 'Walk-in') + ' · ৳' + (o.total || 0), l: 'sales.html' }); });
      rj('pharmacy_suppliers', []).forEach(function (s) { if (s && (has(s.name, q) || has(s.companyName, q) || has(s.contactPerson, q) || has(s.phone, q))) R.push({ g: 'সাপ্লায়ার', i: 'fa-industry', t: s.name || s.companyName, s: (s.contactPerson || '') + ' ' + (s.phone || ''), l: 'suppliers.html' }); });
      rj('pharmacy_prescriptions', []).forEach(function (p) { if (p && (has(p.patientName, q) || has(p.patientPhone, q) || has(p.doctor, q))) R.push({ g: 'Rx', i: 'fa-file-medical', t: p.patientName || 'Rx', s: (p.patientPhone || '') + (p.doctor ? ' · ' + p.doctor : '') + (p.status ? ' · ' + p.status : ''), l: 'prescriptions.html' }); });
      Object.keys(TITLES).forEach(function (k) { if (has(TITLES[k], q) || has(k, q)) R.push({ g: 'পেজ', i: 'fa-arrow-right', t: TITLES[k].replace(/^\S+\s/, ''), s: k, l: k }); });
      return R;
    }
    function go(r) {
      var q = inp.value.trim(); if (q.length > 1) { var L = rj(SK, []).filter(function (x) { return x !== q; }); L.unshift(q); try { localStorage.setItem(SK, JSON.stringify(L.slice(0, 6))); } catch (e) { } }
      location.href = r.l;
    }
    function paint() {
      box.innerHTML = items.map(function (r, n) {
        return '<div class="search-result-item mcs-i' + (n === sel ? ' sel' : '') + '" data-n="' + n + '" role="option"><div class="result-icon"><i class="fas ' + r.i + '"></i></div><div class="result-content"><div class="result-title">' + hl(r.t, inp.value.trim()) + ' <small class="text-muted">' + esc(r.g) + '</small></div><div class="result-subtitle">' + hl(r.s, inp.value.trim()) + '</div></div></div>';
      }).join(''); box.style.display = 'block';
    }
    function recent() {
      var L = rj(SK, []); if (!L.length) { box.style.display = 'none'; return; }
      box.innerHTML = '<div class="mcs-h"><span>🕘 সাম্প্রতিক সার্চ</span><a id="mcsClr">মুছুন</a></div>' + L.map(function (x) { return '<div class="search-result-item mcs-r" data-q="' + esc(x) + '"><div class="result-icon"><i class="fas fa-clock-rotate-left"></i></div><div class="result-content"><div class="result-title">' + esc(x) + '</div></div></div>'; }).join('');
      box.style.display = 'block'; items = []; sel = -1;
    }
    inp.addEventListener('input', function (e) {
      e.stopImmediatePropagation(); var q = inp.value.trim();
      if (clr) clr.style.display = q ? 'block' : 'none';
      if (!q) { recent(); return; }
      if (q.length < 2) { box.style.display = 'none'; return; }
      items = find(q).slice(0, 12); sel = items.length ? 0 : -1;
      if (!items.length) { box.innerHTML = '<div class="search-result-item"><div class="result-icon"><i class="fas fa-search"></i></div><div class="result-content"><div class="result-title">"' + esc(q) + '" পাওয়া যায়নি</div><div class="result-subtitle">নাম, ফোন, ইনভয়েস বা বারকোড দিয়ে চেষ্টা করুন</div></div></div>'; box.style.display = 'block'; return; }
      paint();
    }, true);
    inp.addEventListener('focus', function () { if (!inp.value.trim()) recent(); });
    inp.addEventListener('keydown', function (e) {
      if (box.style.display === 'none') return;
      if (e.key === 'ArrowDown' && items.length) { sel = (sel + 1) % items.length; paint(); e.preventDefault(); }
      else if (e.key === 'ArrowUp' && items.length) { sel = (sel - 1 + items.length) % items.length; paint(); e.preventDefault(); }
      else if (e.key === 'Enter' && items[sel]) { e.preventDefault(); go(items[sel]); }
      else if (e.key === 'Escape') { box.style.display = 'none'; inp.blur(); }
    });
    box.addEventListener('mousedown', function (e) {
      var c = e.target.closest('#mcsClr'); if (c) { try { localStorage.removeItem(SK); } catch (x) { } box.style.display = 'none'; return; }
      var r = e.target.closest('.mcs-r'); if (r) { inp.value = r.getAttribute('data-q'); inp.dispatchEvent(new Event('input')); inp.focus(); e.preventDefault(); return; }
      var i = e.target.closest('.mcs-i'); if (i && items[+i.getAttribute('data-n')]) { e.preventDefault(); go(items[+i.getAttribute('data-n')]); }
    }, true);
    box.setAttribute('role', 'listbox'); inp.setAttribute('aria-label', 'Global search');
  }

  function init() { enhanceBar(); searchUp(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); }); else setTimeout(init, 0);
})();
