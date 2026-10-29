/* v90 Settings: পাসওয়ার্ড শক্তি-মিটার + দেখান/লুকান, আমার সাম্প্রতিক লগইন (ব্যর্থ চেষ্টা সতর্কতা), ফোন ভ্যালিডেশন, Backup ট্যাবে বয়স + রিমাইন্ডার, ব্যাকআপ-দেরি হলে দিনে একবার টোস্ট, ব্যক্তিগত সেটিং রিসেট */
(function () {
  'use strict';
  function run() {
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function who() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { return null; } }
  var u = who(); if (!u || !$('settingsModal')) return;
  var em = String(u.email || '').toLowerCase(), admin = u.role === 'admin';
  function toast(m, t) { if (typeof showToast === 'function') showToast(m, t || 'success'); }
  /* ---- পাসওয়ার্ড শক্তি ---- */
  var np = $('newPassword');
  if (np) {
    var box = document.createElement('div'); box.className = 'mb-3'; box.innerHTML = '<div class="progress" style="height:6px"><div id="s90Bar" class="progress-bar" style="width:0"></div></div><small id="s90Txt" class="text-muted"></small><div class="form-check mt-1"><input type="checkbox" class="form-check-input" id="s90Show"><label class="form-check-label" for="s90Show">পাসওয়ার্ড দেখান</label></div>';
    np.parentNode.after(box);
    var upd = function () {
      var v = np.value, sc = 0; if (v.length >= 8) sc++; if (v.length >= 12) sc++; if (/[a-z]/.test(v) && /[A-Z]/.test(v)) sc++; if (/\d/.test(v)) sc++; if (/[^A-Za-z0-9]/.test(v)) sc++;
      var L = [['', '#999', ''], ['খুব দুর্বল', '#dc3545', '20%'], ['দুর্বল', '#fd7e14', '40%'], ['মোটামুটি', '#ffc107', '60%'], ['ভালো', '#20c997', '80%'], ['শক্তিশালী', '#198754', '100%']], l = v ? L[Math.max(1, sc)] : L[0];
      var b = $('s90Bar'); b.style.width = v ? l[2] : '0'; b.style.background = l[1]; var pe = ''; try { pe = v && window.MCPW ? (MCPW.policy(v, u.email) || '') : ''; } catch (e) { }
      $('s90Txt').textContent = v ? l[0] + (pe ? ' — ' + pe : '') : '';
    };
    np.addEventListener('input', upd);
    $('s90Show').onchange = function () { ['currentPassword', 'newPassword', 'confirmPassword'].forEach(function (i) { if ($(i)) $(i).type = $('s90Show').checked ? 'text' : 'password'; }); };
  }
  /* ---- আমার লগইন ইতিহাস ---- */
  var sec = $('security');
  if (sec) {
    var lc = document.createElement('div'); lc.id = 's90Log'; sec.appendChild(document.createElement('hr')); sec.appendChild(lc);
    var L = rj('pharmacy_loginlog', []).filter(function (x) { return x && String(x.email || '').toLowerCase() === em; }).slice(-8).reverse();
    var recentFail = L.filter(function (x) { return !x.ok && Date.now() - new Date(x.at) < 864e5; }).length;
    lc.innerHTML = '<h6>🕘 আমার সাম্প্রতিক লগইন</h6>' + (recentFail ? '<div class="alert alert-warning py-1 small">⚠ গত ২৪ ঘণ্টায় ' + recentFail + 'টি ব্যর্থ লগইন চেষ্টা — আপনি না করে থাকলে পাসওয়ার্ড বদলান।</div>' : '') +
      (L.length ? '<ul class="list-unstyled small mb-0">' + L.map(function (x) { return '<li>' + (x.ok ? '✅' : '❌') + ' ' + esc(new Date(x.at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })) + ' <span class="text-muted">' + (x.ok ? 'সফল' : 'ব্যর্থ') + '</span></li>'; }).join('') + '</ul>' : '<p class="text-muted small mb-0">কোনো রেকর্ড নেই।</p>');
  }
  /* ---- ফোন ভ্যালিডেশন ---- */
  var ph = $('profilePhone'), orig = ph ? ph.value : '';
  var oldUp = window.updateProfile;
  if (ph && typeof oldUp === 'function') {
    window.updateProfile = function () {
      var v = ph.value.trim();
      if (v && v !== orig && !/^(\+?88)?01[3-9]\d{8}$/.test(v.replace(/[\s-]/g, ''))) { ph.classList.add('is-invalid'); return toast('সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন 01712345678)', 'danger'); }
      ph.classList.remove('is-invalid'); var r = oldUp.apply(this, arguments); orig = ph.value; return r;
    };
  }
  /* ---- Backup ট্যাব ---- */
  var bt = $('backup');
  if (bt) {
    var cfg = rj('pharmacy_backup_cfg', { every: 7 }), bx = document.createElement('div'); bx.id = 's90Bk'; bx.className = 'mt-3'; bt.appendChild(bx);
    var draw = function () {
      var l = localStorage.getItem('pharmacy_lastbackup'), d = l ? Math.floor((Date.now() - new Date(l)) / 864e5) : null;
      bx.innerHTML = '<div class="small ' + (d == null || d > 7 ? 'text-danger' : 'text-success') + '">' + (d == null ? '⚠ কখনো ব্যাকআপ নেওয়া হয়নি' : '✔ শেষ ব্যাকআপ ' + d + ' দিন আগে') + '</div><label class="form-label small mt-2 mb-0">রিমাইন্ডার</label><select class="form-select form-select-sm" id="s90Ev" style="max-width:220px"><option value="0">বন্ধ</option><option value="1">প্রতিদিন</option><option value="3">৩ দিন</option><option value="7">সাপ্তাহিক</option><option value="30">মাসিক</option></select><a class="btn btn-sm btn-outline-primary mt-2" href="backup.html">🔐 এনক্রিপ্টেড ব্যাকআপ / তুলনা (Backup পেজ)</a>';
      $('s90Ev').value = String(+cfg.every || 0); $('s90Ev').onchange = function () { cfg.every = +this.value; localStorage.setItem('pharmacy_backup_cfg', JSON.stringify(cfg)); toast('রিমাইন্ডার সেভ হয়েছে'); };
    };
    draw(); document.addEventListener('shown.bs.tab', function (e) { if (e.target && e.target.getAttribute('href') === '#backup') draw(); });
    /* দিনে একবার টোস্ট */
    try {
      var l0 = localStorage.getItem('pharmacy_lastbackup'), d0 = l0 ? Math.floor((Date.now() - new Date(l0)) / 864e5) : null, tag = 's90Rem' + new Date().toISOString().slice(0, 10);
      if (admin && +cfg.every && (d0 == null || d0 >= +cfg.every) && !sessionStorage.getItem(tag)) { sessionStorage.setItem(tag, '1'); setTimeout(function () { toast(d0 == null ? '💾 এখনো কোনো ব্যাকআপ নেওয়া হয়নি — Settings → Backup' : '💾 ' + d0 + ' দিন ধরে ব্যাকআপ নেওয়া হয়নি', 'warning'); }, 2500); }
    } catch (e) { }
  }
  /* ---- ব্যক্তিগত সেটিং রিসেট (Data & Tools) ---- */
  var dp = $('v80data');
  if (dp) {
    var rb = document.createElement('div'); rb.className = 'mt-3'; rb.innerHTML = '<button class="btn btn-sm btn-outline-danger" id="s90Reset">🔄 আমার ব্যক্তিগত সেটিং রিসেট</button> <span class="small ms-2" id="s90RM"></span>';
    dp.appendChild(rb);
    $('s90Reset').onclick = function () {
      Promise.resolve(window.MCD ? MCD.confirm('আপনার অ্যালার্ট/অটো-লগআউট সেটিং ডিফল্টে ফিরবে। (স্টোরের সেটিং বদলাবে না)') : confirm('রিসেট করবেন?')).then(function (ok) {
        if (!ok) return; var m = rj('pharmacy_prefs_v80', {}); delete m[em]; localStorage.setItem('pharmacy_prefs_v80', JSON.stringify(m)); $('s90RM').textContent = '✔ রিসেট — রিলোড হচ্ছে'; setTimeout(function () { location.reload(); }, 800);
      });
    };
  }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
