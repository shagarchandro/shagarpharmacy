/* Login page polish: click-to-fill demo accounts, caps-lock hint, remembered role/email, nicer visuals (dark mode aware). */
(function () {
  'use strict';
  var css = '' +
  'body{background:linear-gradient(135deg,#667eea,#764ba2 55%,#c06be0)!important;background-size:200% 200%;animation:mcbg 14s ease infinite}@keyframes mcbg{50%{background-position:100% 50%}}' +
  '.glass-card{border-radius:26px!important;animation:mcin .6s ease both}@keyframes mcin{from{opacity:0;transform:translateY(22px) scale(.98)}}' +
  '.role-badge{cursor:pointer;border:2px solid #e6e9f8;transition:all .2s;background:#fff}.role-badge:hover{transform:translateY(-3px);box-shadow:0 8px 18px rgba(102,126,234,.25)}.role-badge.active{border-color:#667eea!important;background:linear-gradient(135deg,#667eea15,#764ba215)!important;color:#4c4fb0}' +
  '.form-control:focus{box-shadow:0 0 0 .22rem rgba(102,126,234,.25)!important;border-color:#667eea!important}' +
  '.demo-card tr[data-fill]{cursor:pointer;transition:background .15s}.demo-card tr[data-fill]:hover{background:#eef0ff!important}' +
  '.mc-hint{font-size:.8rem;color:#b45309;margin-top:.3rem;display:none}.mc-hint.on{display:block}' +
  '.mc-back{position:fixed;top:12px;left:12px;z-index:9;background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.4);border-radius:999px;padding:.35rem .9rem;text-decoration:none;font-weight:600;backdrop-filter:blur(6px)}.mc-back:hover{background:rgba(255,255,255,.35);color:#fff}' +
  '.mc-tip{font-size:.8rem;color:#6b7280;text-align:center;margin:.3rem 0 .6rem}' +
  '@media(max-width:576px){.glass-card .p-5{padding:1.5rem!important}.display-5{font-size:1.8rem}}' +
  '@media(prefers-color-scheme:dark){.glass-card{background:rgba(23,30,54,.95)!important;color:#e8ecfa}.glass-card .text-muted{color:#a3adcb!important}.role-badge{background:#1d2646;border-color:#2c3760;color:#e8ecfa}.form-control,.input-group-text{background:#1d2646!important;color:#e8ecfa!important;border-color:#2c3760!important}.demo-card{background:#1a2240!important}.demo-card code{color:#c9d3ff}.demo-card tr[data-fill]:hover{background:#26305a!important}.demo-card tr{background:transparent!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);


  // ---------- login security: attempt limit with growing cool-down + activity log ----------
  var LK = 'mc_lock', LOGK = 'pharmacy_loginlog', SET = (function () { try { return JSON.parse(localStorage.getItem('pharmacy_settings') || '{}'); } catch (e) { return {}; } })(), MAX = Math.min(Math.max(+SET.lockMax || 5, 3), 10), BASE = Math.min(Math.max(+SET.lockBase || 30, 10), 600);
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function logEv(ev) { try { var L = rj(LOGK, []); ev.at = new Date().toISOString(); L.push(ev); localStorage.setItem(LOGK, JSON.stringify(L.slice(-100))); } catch (e) {} }
  function lockOf(em) { var m = rj(LK, {}); return m[String(em).toLowerCase()] || { n: 0, until: 0, rounds: 0 }; }
  function setLock(em, v) { var m = rj(LK, {}); if (v) m[String(em).toLowerCase()] = v; else delete m[String(em).toLowerCase()]; try { localStorage.setItem(LK, JSON.stringify(m)); } catch (e) {} }
  var timer = null;
  function showLock(em) {
    var box = document.getElementById('mcLockMsg');
    if (!box) { box = document.createElement('div'); box.id = 'mcLockMsg'; box.className = 'alert alert-warning'; box.setAttribute('role', 'alert'); var f = document.getElementById('loginForm'); f.parentNode.insertBefore(box, f); }
    clearInterval(timer);
    function tick() {
      var l = lockOf(em), left = Math.ceil((l.until - Date.now()) / 1000);
      if (left <= 0) { box.remove(); clearInterval(timer); document.getElementById('loginBtn').disabled = false; return; }
      box.textContent = '🔒 অনেকবার ভুল চেষ্টা হয়েছে। ' + left + ' সেকেন্ড পর আবার চেষ্টা করুন।'; document.getElementById('loginBtn').disabled = true;
    }
    tick(); timer = setInterval(tick, 1000);
  }
  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'loginForm') return;
    var em = (document.getElementById('email').value || '').trim(), l = lockOf(em);
    if (l.until > Date.now()) { e.preventDefault(); e.stopImmediatePropagation(); showLock(em); return; }
    // watch for success after the original handler runs
    var role = (document.getElementById('role') || {}).value || '';
    clearInterval(window.__mcW); var n = 0, w = window.__mcW = setInterval(function () {
      n++;
      if (localStorage.getItem('user') || sessionStorage.getItem('user')) { clearInterval(w); setLock(em, null); logEv({ email: em, ok: true, role: role }); }
      else if (n > 40) clearInterval(w);
    }, 150);
  }, true);
  var oldAlert = window.showAlert;
  window.showAlert = function (msg, type) {
    if (type === 'danger' && /invalid|disabled|বন্ধ/i.test(String(msg))) {
      var em = (document.getElementById('email').value || '').trim(), l = lockOf(em); l.n = (l.n || 0) + 1;
      logEv({ email: em, ok: false, role: (document.getElementById('role') || {}).value || '' });
      if (l.n >= MAX) { l.rounds = (l.rounds || 0) + 1; l.until = Date.now() + Math.min(BASE * Math.pow(2, l.rounds - 1), 600) * 1000; l.n = 0; setLock(em, l); showLock(em); return; }
      setLock(em, l); msg = msg + ' (' + (MAX - l.n) + ' বার চেষ্টা বাকি)';
    }
    if (oldAlert) return oldAlert(msg, type);
  };

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () {
    var email = document.getElementById('email'), pw = document.getElementById('password');
    if (!email || !pw) return;
    var back = document.createElement('a'); back.className = 'mc-back'; back.href = 'index.html'; back.textContent = '← Home'; document.body.appendChild(back);

    function pick(role) { var b = document.querySelector('.role-badge[data-role="' + role + '"]'); if (b) b.click(); }
    var map = { 'admin@medicare.com': ['admin', 'admin123'], 'pharmacist@medicare.com': ['pharmacist', 'pharm123'], 'staff@medicare.com': ['staff', 'staff123'] };
    document.querySelectorAll('.demo-card tr').forEach(function (tr) {
      var c = tr.querySelectorAll('code'); if (c.length < 2) return;
      var em = c[0].textContent.trim(); if (!map[em]) return;
      tr.setAttribute('data-fill', em); tr.title = 'Click to fill / ক্লিক করে পূরণ করুন';
      tr.addEventListener('click', function () { pick(map[em][0]); email.value = em; pw.value = map[em][1]; pw.focus(); });
    });
    var demo = document.querySelector('.demo-card');
    if (demo) { var tip = document.createElement('div'); tip.className = 'mc-tip'; tip.textContent = '👆 যেকোনো সারিতে ক্লিক করলে ফর্ম নিজে পূরণ হবে'; demo.appendChild(tip); }

    // caps lock hint
    var hint = document.createElement('div'); hint.className = 'mc-hint'; hint.textContent = '⚠️ Caps Lock চালু আছে'; pw.closest('.mb-3').appendChild(hint);
    function caps(e) { if (e.getModifierState) hint.classList.toggle('on', e.getModifierState('CapsLock')); }
    pw.addEventListener('keyup', caps); pw.addEventListener('keydown', caps); pw.addEventListener('blur', function () { hint.classList.remove('on'); });

    if (SET.loginNotice) { var nb = document.createElement('div'); nb.className = 'alert alert-info py-2 small'; nb.textContent = '📢 ' + SET.loginNotice; var fm = document.getElementById('loginForm'); fm.parentNode.insertBefore(nb, fm); }
    // remember last role & email (never the password)
    try {
      var last = JSON.parse(localStorage.getItem('mc_lastlogin') || 'null');
      if (last && last.role) { pick(last.role); if (last.email && !email.value) email.value = last.email; }
      document.getElementById('loginForm').addEventListener('submit', function () {
        var r = document.getElementById('role'); localStorage.setItem('mc_lastlogin', JSON.stringify({ role: r ? r.value : '', email: email.value }));
      });
    } catch (e) {}
  });
})();
