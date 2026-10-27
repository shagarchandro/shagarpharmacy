/* v80 — Settings আরও আপডেট (Dashboard → Settings):
   • 🔔 Notifications ট্যাব ভুয়া Email/SMS/WhatsApp টগলের বদলে আসল "Alerts & Session": কোন ধরনের সতর্কতা দেখবেন, মেয়াদের সীমা (৩০/৬০/৯০ দিন), অলস থাকলে অটো-লগআউট
   • Store & Invoice (Admin): খোলার/বন্ধের সময় + সাপ্তাহিক ছুটি — Home ও Shop-এ "এখন খোলা/বন্ধ" দেখায়
   • 🧰 Data & Tools ট্যাব: ব্রাউজারের স্টোরেজ কত ভরেছে, সেটিংস Export/Import (JSON), snooze/লগইন-ইতিহাস পরিষ্কার
   ব্যক্তিগত বিষয় pharmacy_prefs_v80[ইমেইল]-এ (শুধু আপনার জন্য); স্টোরের সময় pharmacy_settings ও পাবলিক শপ সেটিংসে। */
(function () {
  'use strict';
  var KEY = 'pharmacy_prefs_v80';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wr(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function who() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { return null; } }
  function email() { var u = who(); return u ? String(u.email || '').toLowerCase() : ''; }
  function isAdmin() { var u = who(); return !!u && u.role === 'admin'; }
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var DEF = { idle: 0, expDays: 90, noStock: false, noExpiry: false, noMoney: false, noOps: false };
  function get() { var m = rj(KEY, {}), p = {}, k; for (k in DEF) p[k] = DEF[k]; var mine = m[email()] || {}; for (k in mine) p[k] = mine[k]; return p; }
  function put(p) { var m = rj(KEY, {}); m[email()] = p; try { wr(KEY, m); } catch (e) { } try { window.dispatchEvent(new Event('storage')); } catch (e) { } }
  window.MCPrefs80 = { get: get, put: put, DEF: DEF };
  function msg(t, ok) { var m = $('v80Msg'); if (m) { m.textContent = t; m.className = 'small ms-2 ' + (ok === false ? 'text-danger' : 'text-success'); } else if (window.showToast) showToast(t, ok === false ? 'danger' : 'success'); }

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () {
    var nav = document.querySelector('#settingsModal .nav-tabs'), content = document.querySelector('#settingsModal .tab-content'); if (!nav || !content) return;


    /* ---------- 🎨 থিম (My Preferences-এ) ---------- */
    (function () {
      var mp = $('myprefs'); if (!mp || !window.MCTheme) return;
      var old = $('pfDark'); if (old && old.closest('.form-check')) old.closest('.form-check').style.display = 'none';
      var w = document.createElement('div'); w.className = 'mb-3';
      w.innerHTML = '<label class="form-label fw-semibold" for="v80Theme">🎨 থিম</label><select class="form-select" id="v80Theme" data-mc-theme-sel><option value="light">☀️ Light — সবসময় দিনের রঙ</option><option value="dark">🌙 Dark — সবসময় রাতের রঙ</option><option value="auto">🖥️ Auto — ডিভাইসের সেটিং অনুযায়ী</option></select><div class="form-text">এই ডিভাইসের সব পেজে (স্টাফ, শপ, Ops, Home) একসাথে প্রযোজ্য।</div>';
      var first = mp.querySelector('p'); if (first) first.after(w); else mp.insertBefore(w, mp.firstChild);
      $('v80Theme').value = MCTheme.get();
    })();

    /* ---------- 🔔 Alerts & Session ---------- */
    var pane = $('notifications'), tabA = nav.querySelector('a[href="#notifications"]');
    if (tabA) tabA.textContent = 'Alerts & Session';
    if (pane) {
      pane.innerHTML = '<p class="text-muted small">এই সেটিংস শুধু আপনার অ্যাকাউন্টের জন্য। এই ডেমো/সিস্টেম থেকে SMS বা ইমেইল নিজে নিজে যায় না — তাই শুধু অ্যাপের ভেতরের সতর্কতা নিয়ন্ত্রণ করা যায়।</p>' +
        '<h6>কোন সতর্কতা দেখাবেন</h6><div class="mb-3">' + [['v80Stock', '📦 কম / শেষ স্টক'], ['v80Exp', '⏳ মেয়াদ সতর্কতা'], ['v80Money', '💰 বাকি (কাস্টমার/সরবরাহকারী)'], ['v80Ops', '🛒 অনলাইন অর্ডার, Rx, ব্যাকআপ, ক্লোজিং']].map(function (x) { return '<div class="form-check"><input type="checkbox" class="form-check-input" id="' + x[0] + '"><label class="form-check-label" for="' + x[0] + '">' + x[1] + '</label></div>'; }).join('') + '</div>' +
        '<div class="row g-3"><div class="col-md-6"><label class="form-label" for="v80Days">মেয়াদের সতর্কতা কতদিন আগে থেকে</label><select class="form-select" id="v80Days"><option value="30">৩০ দিন</option><option value="60">৬০ দিন</option><option value="90">৯০ দিন</option></select></div>' +
        '<div class="col-md-6"><label class="form-label" for="v80Idle">অলস থাকলে অটো-লগআউট</label><select class="form-select" id="v80Idle"><option value="0">বন্ধ</option><option value="5">৫ মিনিট</option><option value="10">১০ মিনিট</option><option value="15">১৫ মিনিট</option><option value="30">৩০ মিনিট</option><option value="60">১ ঘণ্টা</option></select><div class="form-text">লগআউটের ১ মিনিট আগে সতর্ক করা হয়। শেয়ার্ড কম্পিউটারে সুপারিশ: ১০–১৫ মিনিট।</div></div></div>' +
        '<div class="mt-3"><button type="button" class="btn btn-primary" id="v80Save">Save</button> <button type="button" class="btn btn-outline-secondary btn-sm" id="v80Snz">Snooze করা সতর্কতা ফিরিয়ে আনুন</button><span id="v80Msg" role="status"></span></div>';
      var p = get(); $('v80Stock').checked = !p.noStock; $('v80Exp').checked = !p.noExpiry; $('v80Money').checked = !p.noMoney; $('v80Ops').checked = !p.noOps; $('v80Days').value = String(p.expDays); $('v80Idle').value = String(p.idle);
      $('v80Save').onclick = function () { put({ idle: +$('v80Idle').value, expDays: +$('v80Days').value, noStock: !$('v80Stock').checked, noExpiry: !$('v80Exp').checked, noMoney: !$('v80Money').checked, noOps: !$('v80Ops').checked }); msg('✔ সংরক্ষিত — পেজ রিফ্রেশ করলে সতর্কতা কেন্দ্রে প্রযোজ্য হবে'); };
      $('v80Snz').onclick = function () { try { localStorage.removeItem('pharmacy_alert_snooze'); } catch (e) { } msg('✔ ফিরে এসেছে'); };
      window.saveNotificationSettings = function () { $('v80Save').click(); };
    }

    /* ---------- Store hours (Admin) ---------- */
    function hoursUI() {
      var low = $('stLow'); if (!low || $('stOpen') || !isAdmin()) return;
      var row = low.closest('.row'); if (!row) return;
      var S = rj('pharmacy_settings', {});
      var h = document.createElement('div'); h.className = 'col-12'; h.innerHTML = '<hr class="my-1"><label class="form-label fw-semibold">🕒 খোলার সময় (Home ও Shop-এ দেখায়)</label>' +
        '<div class="row g-2"><div class="col-6 col-md-3"><input type="time" class="form-control" id="stOpen" aria-label="খোলে"></div><div class="col-6 col-md-3"><input type="time" class="form-control" id="stClose" aria-label="বন্ধ"></div>' +
        '<div class="col-md-4"><select class="form-select" id="stOff" aria-label="সাপ্তাহিক ছুটি"><option value="">সাপ্তাহিক ছুটি নেই</option><option value="5">শুক্রবার বন্ধ</option><option value="6">শনিবার বন্ধ</option><option value="0">রবিবার বন্ধ</option><option value="1">সোমবার বন্ধ</option></select></div></div>';
      var btnCol = row.lastElementChild; row.insertBefore(h, btnCol);
      $('stOpen').value = S.hoursOpen || ''; $('stClose').value = S.hoursClose || ''; $('stOff').value = S.weeklyOff == null ? '' : String(S.weeklyOff);
    }
    var tries = 0, iv = setInterval(function () { hoursUI(); if ($('stOpen') || ++tries > 20) clearInterval(iv); }, 150);
    var origSave = window.saveStoreSettings;
    if (origSave) window.saveStoreSettings = function () {
      var r = origSave.apply(this, arguments);
      if (!isAdmin() || !$('stOpen')) return r;
      var tax = parseFloat($('stTax').value); if (!$('stName').value.trim() || isNaN(tax) || tax < 0 || tax > 50) return r;
      var o = $('stOpen').value, c = $('stClose').value, off = $('stOff').value;
      if ((o && !c) || (!o && c)) { msg('খোলা ও বন্ধ — দুটো সময়ই দিন', false); return r; }
      var S = rj('pharmacy_settings', {}); S.hoursOpen = o; S.hoursClose = c; S.weeklyOff = off === '' ? null : +off; wr('pharmacy_settings', S);
      try { var d = rj('mc_db', null); if (d) { d.settings = d.settings || {}; d.settings.hoursOpen = o; d.settings.hoursClose = c; d.settings.weeklyOff = S.weeklyOff; wr('mc_db', d); } } catch (e) { }
      return r;
    };

    /* ---------- 🧰 Data & Tools ---------- */
    var li = document.createElement('li'); li.className = 'nav-item'; li.innerHTML = '<a class="nav-link" data-bs-toggle="tab" href="#v80data">Data &amp; Tools</a>'; nav.appendChild(li);
    var d = document.createElement('div'); d.className = 'tab-pane fade'; d.id = 'v80data';
    d.innerHTML = '<h6>💽 ব্রাউজারের স্টোরেজ</h6><div class="progress mb-1" style="height:10px"><div class="progress-bar" id="v80Bar" style="width:0"></div></div><div class="small text-muted mb-2" id="v80Use"></div><div class="small" id="v80Top"></div><hr>' +
      '<h6>📤 সেটিংস ব্যাকআপ</h6><p class="small text-muted">স্টোর সেটিংস (শুধু Admin), আপনার পছন্দ ও সতর্কতার সেটিংস JSON ফাইলে নিন — পাসওয়ার্ড/PIN এতে থাকে না। ব্যবসার ডেটার ব্যাকআপ আলাদা (Backup ট্যাব)।</p>' +
      '<button type="button" class="btn btn-outline-primary btn-sm" id="v80Exp2">Export settings</button> <label class="btn btn-outline-secondary btn-sm mb-0">Import settings<input type="file" id="v80Imp" accept="application/json,.json" hidden></label><span id="v80Msg2" class="small ms-2" role="status"></span>';
    content.appendChild(d);
    function usage() {
      var tot = 0, rows = [];
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i), n = (k.length + String(localStorage.getItem(k)).length) * 2; tot += n; rows.push([k, n]); } } catch (e) { }
      var cap = 5 * 1024 * 1024, pc = Math.min(100, tot / cap * 100);
      $('v80Bar').style.width = pc.toFixed(1) + '%'; $('v80Bar').className = 'progress-bar ' + (pc > 80 ? 'bg-danger' : pc > 50 ? 'bg-warning' : 'bg-success');
      $('v80Use').textContent = (tot / 1024).toFixed(0) + ' KB / ~5 MB (' + pc.toFixed(1) + '%)' + (pc > 80 ? ' — প্রায় ভরে গেছে, ব্যাকআপ নিয়ে পুরনো ডেটা পরিষ্কার করুন' : '');
      rows.sort(function (a, b) { return b[1] - a[1]; });
      $('v80Top').innerHTML = rows.slice(0, 5).map(function (r) { return '<div class="d-flex justify-content-between"><code>' + esc(r[0]) + '</code><span>' + (r[1] / 1024).toFixed(1) + ' KB</span></div>'; }).join('');
    }
    nav.addEventListener('shown.bs.tab', function (e) { if (e.target && e.target.getAttribute('href') === '#v80data') usage(); });
    var SAFE = ['store', 'phone', 'address', 'email', 'taxPct', 'lowDefault', 'hoursOpen', 'hoursClose', 'weeklyOff'];
    function m2(t, ok) { var m = $('v80Msg2'); m.textContent = t; m.className = 'small ms-2 ' + (ok === false ? 'text-danger' : 'text-success'); }
    $('v80Exp2').onclick = function () {
      var S = rj('pharmacy_settings', {}), out = { v: 1, at: new Date().toISOString(), prefs: (rj('pharmacy_prefs', {})[email()] || {}), alerts: get() };
      if (isAdmin()) { out.settings = {}; SAFE.forEach(function (k) { if (S[k] !== undefined) out.settings[k] = S[k]; }); }
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })); a.download = 'settings-' + new Date(Date.now() + 216e5).toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove(); m2('✔ ফাইল নামানো হয়েছে');
    };
    $('v80Imp').onchange = function () {
      var f = this.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () {
        try {
          var j = JSON.parse(r.result); if (!j || j.v !== 1) throw 0;
          var n = 0;
          if (j.alerts && typeof j.alerts === 'object') { var a = {}; Object.keys(DEF).forEach(function (k) { if (typeof j.alerts[k] === typeof DEF[k]) a[k] = j.alerts[k]; }); put(Object.assign(get(), a)); n++; }
          if (j.prefs && typeof j.prefs === 'object' && window.MCPrefs) { MCPrefs.put(Object.assign(MCPrefs.get(), j.prefs)); n++; }
          if (j.settings && isAdmin()) { var S = rj('pharmacy_settings', {}); SAFE.forEach(function (k) { if (j.settings[k] !== undefined && /^[\w\s.,:@+\-/()]{0,120}$/.test(String(j.settings[k]))) S[k] = j.settings[k]; }); wr('pharmacy_settings', S); n++; }
          m2('✔ ' + n + ' অংশ আমদানি হয়েছে — পেজ রিলোড হচ্ছে'); setTimeout(function () { location.reload(); }, 900);
        } catch (e) { m2('❌ ফাইলটি এই সিস্টেমের সেটিংস ফাইল নয়', false); }
      };
      r.readAsText(f); this.value = '';
    };
  });
})();
