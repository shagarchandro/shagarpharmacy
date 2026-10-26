/* v79 — Staff Login পেজ আপডেট:
   • সার্ভার মোডে ডেমো পাসওয়ার্ড/প্রি-ফিল বন্ধ (ডেমো মোডে আগের মতোই থাকে)
   • ভূমিকা বাছলে নিচে সেই ভূমিকার অনুমতির সারাংশ
   • ঢাকার সময় অনুযায়ী শুভেচ্ছা + লাইভ ঘড়ি, সার্ভার/ডেমো/অফলাইন স্ট্যাটাস চিপ
   • আগে থেকে লগইন থাকলে "Dashboard-এ যান / Logout" ব্যানার; এই ডিভাইসে শেষ সফল লগইনের সময়
   • "Forgot password" আগে ভুয়া "লিংক পাঠানো হয়েছে" দেখাত — এখন সৎ নির্দেশনা + অ্যাডমিনকে পাঠানোর বার্তা কপি
   • ফর্মে autocomplete (পাসওয়ার্ড ম্যানেজারের জন্য), লগইনের পর আগের পেজে ফেরা (?next)
   ডেমো মোডের লগইন-লজিক অপরিবর্তিত। */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(i) { return document.getElementById(i); }
  var SRV = !!(window.MCSRV && window.MCSRV.active);
  var css = '.mcgreet{font-size:.95rem;opacity:.92;margin-bottom:.6rem}.mcchip{display:inline-flex;align-items:center;gap:.4rem;font-size:.78rem;padding:.2rem .65rem;border-radius:999px;background:#eef0ff;color:#4c4fb0;font-weight:600}' +
    '.mcchip i{width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block}.mcchip.demo i{background:#f59e0b}.mcchip.off i{background:#ef4444}' +
    '.mcrole{font-size:.82rem;color:#6b7280;margin-top:.5rem;min-height:1.2rem}.mcban{border-radius:12px;padding:.7rem .9rem;margin-bottom:1rem;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;font-size:.9rem}' +
    '.mcban .btn{margin:.4rem .3rem 0 0}.mclast{font-size:.78rem;color:#6b7280;text-align:center;margin:-.4rem 0 .8rem}' +
    '.mcsrvnote{font-size:.85rem;border-radius:12px;padding:.7rem .9rem;background:#f3f4ff;border:1px solid #dfe3ff;color:#374151}' +
    '@media(prefers-color-scheme:dark){.mcchip{background:#26305a;color:#c9d3ff}.mcrole,.mclast{color:#a3adcb}.mcban{background:#0f2a22;border-color:#14532d;color:#bbf7d0}.mcsrvnote{background:#1a2240;border-color:#2c3760;color:#e8ecfa}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ROLE = {
    admin: '🛡 Admin — সব মডিউল, ইউজার ম্যানেজমেন্ট, Control Center, Backup ও রিপোর্ট।',
    pharmacist: '💊 Pharmacist — ওষুধ, প্রেসক্রিপশন, বিক্রি, ক্রয় ও রিপোর্ট।',
    staff: '🧾 Staff — POS বিলিং; ওষুধ/কাস্টমার দেখা (সীমিত অ্যাক্সেস)।'
  };

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () {
    var form = $('loginForm'), email = $('email'), pw = $('password'), roleIn = $('role'); if (!form || !email || !pw) return;

    /* autocomplete / autofocus */
    email.setAttribute('autocomplete', 'username'); pw.setAttribute('autocomplete', 'current-password'); email.setAttribute('autocapitalize', 'off'); email.setAttribute('spellcheck', 'false');

    /* সার্ভার মোড: ডেমো প্রি-ফিল ও টেবিল বন্ধ */
    if (SRV) {
      var last = rj('mc_lastlogin', null); email.value = (last && last.email) || ''; pw.value = '';
      var keep = { e: '', p: '' };
      $$('.role-badge').forEach(function (b) {
        b.addEventListener('click', function () { keep.e = email.value; keep.p = pw.value; }, true);
        b.addEventListener('click', function () { email.value = keep.e; pw.value = keep.p; });
      });
      var demo = document.querySelector('.demo-card');
      if (demo) { demo.innerHTML = '<div class="mcsrvnote">🔒 <b>আসল সার্ভার মোড:</b> ডেমো পাসওয়ার্ড বন্ধ। অ্যাডমিনের দেওয়া ইমেইল ও পাসওয়ার্ড দিয়ে ঢুকুন; প্রথমবার নতুন পাসওয়ার্ড বসাতে হবে।</div>'; demo.style.background = 'transparent'; }
      var si = document.querySelector('.staff-access-info'); if (si) si.style.display = 'none';
      setTimeout(function () { (email.value ? pw : email).focus(); }, 50);
    } else { setTimeout(function () { pw.focus(); }, 50); }
    function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

    /* ভূমিকার সারাংশ */
    var cap = document.createElement('div'); cap.className = 'mcrole'; cap.setAttribute('aria-live', 'polite');
    var rb = document.querySelector('.role-badge'); var rowEl = rb && rb.closest('.row'); if (rowEl) rowEl.after(cap);
    function role() { return (roleIn && roleIn.value) || 'admin'; }
    function showRole() { cap.textContent = ROLE[role()] || ''; }
    $$('.role-badge').forEach(function (b) { b.addEventListener('click', function () { setTimeout(showRole, 0); }); }); setTimeout(showRole, 100);

    /* শুভেচ্ছা + ঘড়ি + স্ট্যাটাস চিপ */
    var left = document.querySelector('.col-lg-6.text-white h2'), g = document.createElement('div'); g.className = 'mcgreet';
    if (left) left.before(g);
    function tick() {
      var d = new Date(), h = +d.toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', hour12: false }), w = h < 5 ? 'শুভ রাত্রি' : h < 12 ? 'শুভ সকাল' : h < 16 ? 'শুভ দুপুর' : h < 19 ? 'শুভ বিকাল' : 'শুভ সন্ধ্যা';
      g.textContent = w + ' 👋 · ' + d.toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + d.toLocaleTimeString('bn-BD', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' });
      var on = navigator.onLine !== false;
      chip.className = 'mcchip' + (on ? (SRV ? '' : ' demo') : ' off');
      chip.innerHTML = '<i></i>' + (on ? (SRV ? 'সার্ভার সংযুক্ত' : 'ডেমো মোড (ব্রাউজারে ডেটা)') : 'অফলাইন');
    }
    var chip = document.createElement('span'); var hd = document.querySelector('.col-lg-6.p-5 .text-center.mb-4'); if (hd) { var w = document.createElement('div'); w.appendChild(chip); hd.appendChild(w); }
    tick(); setInterval(tick, 20000); addEventListener('online', tick); addEventListener('offline', tick);

    /* আগে থেকে লগইন থাকলে */
    try {
      var u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'), tk = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (u && tk && form.parentNode) {
        var bn = document.createElement('div'); bn.className = 'mcban'; bn.innerHTML = '✅ আপনি <b>' + esc(u.name || u.email) + '</b> (' + esc(u.role || '') + ') হিসেবে লগইন আছেন।<br><a class="btn btn-success btn-sm" href="dashboard.html">Dashboard-এ যান →</a><button type="button" class="btn btn-outline-secondary btn-sm" id="mcOut">Logout করে অন্য অ্যাকাউন্টে ঢুকুন</button>';
        form.parentNode.insertBefore(bn, form);
        $('mcOut').onclick = function () {
          if (SRV && MCSRV.logout) { try { MCSRV.logout('staff'); return; } catch (e) { } }
          if (window.authClear) window.authClear(); location.reload();
        };
      }
    } catch (e) { }

    /* এই ডিভাইসে শেষ সফল লগইন */
    var log = rj('pharmacy_loginlog', []).filter(function (x) { return x && x.ok; }), lastOk = log[log.length - 1];
    if (lastOk && lastOk.at) {
      var ln = document.createElement('div'); ln.className = 'mclast';
      ln.textContent = '🕒 এই ডিভাইসে শেষ সফল লগইন: ' + new Date(lastOk.at).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + (lastOk.email ? ' (' + lastOk.email + ')' : '');
      var btn = $('loginBtn'); if (btn) btn.after(ln);
    }

    /* Forgot password — সৎ নির্দেশনা */
    var fb = $('sendResetLink');
    if (fb) {
      var nb = fb.cloneNode(true); fb.parentNode.replaceChild(nb, fb); nb.textContent = '📋 অ্যাডমিনকে পাঠানোর বার্তা কপি করুন';
      var body = document.querySelector('#forgotModal .modal-body'), title = document.querySelector('#forgotModal .modal-title');
      if (title) title.textContent = 'পাসওয়ার্ড ভুলে গেছেন?';
      if (body) body.innerHTML = '<p>এই সিস্টেম থেকে ইমেইল যায় না, তাই রিসেট-লিংক পাঠানো সম্ভব নয়।</p><ol class="small"><li>নিচে আপনার ইমেইল লিখে বার্তাটি কপি করুন।</li><li>বার্তাটি আপনার <b>Admin</b>-কে WhatsApp/মেসেজে দিন।</li><li>Admin ' + (SRV ? '🛡 Users' : 'Control Center → Accounts') + ' থেকে নতুন পাসওয়ার্ড দিয়ে দেবেন।</li></ol><input type="email" class="form-control" id="resetEmail" placeholder="আপনার ইমেইল"><div class="small text-muted mt-2">Admin নিজে ভুলে গেলে অন্য Admin বা সিস্টেম যিনি চালান তিনি সাহায্য করবেন।</div>';
      nb.addEventListener('click', function () {
        var em = ($('resetEmail').value || '').trim(); if (!em) { if (window.showAlert) showAlert('আপনার ইমেইল লিখুন', 'warning'); return; }
        var msg = 'আসসালামু আলাইকুম, আমার (' + em + ') পাসওয়ার্ড রিসেট করে দিন, প্লিজ।';
        try { navigator.clipboard.writeText(msg); if (window.showAlert) showAlert('✅ বার্তা কপি হয়েছে — Admin-কে পাঠান', 'success'); } catch (e) { prompt('এই বার্তাটি কপি করুন', msg); }
      });
    }

    /* লগইনের পর আগের পেজে ফেরা: guard.js যে পেজ থেকে পাঠিয়েছিল সেটা dashboard-এ গিয়ে খোলে (navbar-v79.js) */
  });
})();
