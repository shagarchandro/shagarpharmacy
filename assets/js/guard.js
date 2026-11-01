/* MediCare shared auth guard for the staff pages (dashboard, medicines, sales, ...).
   - clears ONLY auth keys on logout/login (business data is never wiped)
   - blocks pages the role may not open, hides their menu links
   - makes staff read-only where the login says edit:false */
/* Offline-safe stubs: if a CDN (gsap/AOS) fails to load, animations are skipped instead of breaking login & pages. */
(function(){
  function chain(){var o=function(){return o};['to','from','fromTo','set','timeline','registerPlugin','add','kill','play','pause','delay','killTweensOf','utils'].forEach(function(k){o[k]=function(){return o}});return o}
  if(!window.gsap)window.gsap=chain();
  if(!window.ScrollTrigger)window.ScrollTrigger={};
  if(!window.Chart){window.Chart=function(){this.data={datasets:[{data:[]},{data:[]},{data:[]},{data:[]}],labels:[]};this.options={};this.destroy=function(){};this.update=function(){}};window.Chart.register=function(){};window.Chart.defaults={}}
  if(!window.AOS)window.AOS={init:function(){},refresh:function(){}};
})();
(function () {
  'use strict';
  var AUTH = ['user', 'auth_token', 'user_role', 'user_access', 'mc_started', 'mc_session_start', 'mc_shared'];
  window.authClear = function () {
    AUTH.forEach(function (k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) {} });
  };
  function get(k) { try { return localStorage.getItem(k) || sessionStorage.getItem(k); } catch (e) { return null; } }
  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
  var KEYS = { dashboard: 1, medicines: 1, customers: 1, sales: 1, purchases: 1, suppliers: 1, prescriptions: 1, reports: 1, settings: 1 };
  if (!KEYS[page]) return;                       // login / landing: nothing to guard
  var user = null, access = null;
  try { user = JSON.parse(get('user')); access = JSON.parse(get('user_access')); } catch (e) {}
  if (!user || !get('auth_token') || !access) { try { if (page !== 'dashboard') sessionStorage.setItem('mc_next', page + '.html' + location.search); } catch (e) {} location.replace('login.html'); return; }
  // ---- absolute session limit (hours; Control Center -> Security) ----
  try {
    var _st = {}; try { _st = JSON.parse(localStorage.getItem('pharmacy_settings') || '{}'); } catch (e) {}
    var _hrs = _st.sessionHours == null ? 12 : +_st.sessionHours, _store = localStorage.getItem('user') ? localStorage : sessionStorage, _t0 = +_store.getItem('mc_session_start');
    if (!_t0) _store.setItem('mc_session_start', String(Date.now()));
    else if (_hrs > 0 && Date.now() - _t0 > _hrs * 3600e3) { window.authClear(); try { sessionStorage.setItem('mc_flash', 'সেশনের সময়সীমা শেষ — আবার লগইন করুন।'); } catch (e) {} location.replace('login.html'); return; }
  } catch (e) {}
  // ---- live role matrix + account switches from the Control Center ----
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var roles = rj('pharmacy_roles', {}), accts = rj('pharmacy_accounts', []), setg = rj('pharmacy_settings', {});
  function toAccess(level) {
    var a = {};
    Object.keys(KEYS).forEach(function (k) {
      var lv = (level || {})[k];
      a[k] = lv === 'full' ? true : lv === 'edit' ? { view: true, edit: true, delete: false, create: true } : lv === 'view' ? { view: true, edit: false, delete: false, create: false } : false;
    });
    a.dashboard = a.dashboard || true; // never lock anybody out of the landing page
    return a;
  }
  var me = null; accts.forEach(function (u) { if (u && String(u.email).toLowerCase() === String(user.email).toLowerCase()) me = u; });
  var offByList = (setg.disabled || []).map(function (x) { return String(x).toLowerCase(); }).indexOf(String(user.email).toLowerCase()) > -1 && user.role !== 'admin';
  if ((me && me.active === false) || offByList) { window.authClear(); try { sessionStorage.setItem('mc_flash', 'এই অ্যাকাউন্ট বন্ধ করা হয়েছে / Account disabled by admin'); } catch (e) {} location.replace('login.html'); return; }
  if (user.role !== 'admin' && roles[user.role] && roles[user.role].level) access = toAccess(roles[user.role].level);
  window.MC_ROLE = { name: user.role, cfg: roles[user.role] || null };
  var rule = access[page];
  var allowed = rule === true || (rule && rule.view !== false && typeof rule === 'object');
  if (!allowed) {
    try { sessionStorage.setItem('mc_flash', 'আপনার (' + user.role + ') এই পেজে প্রবেশের অনুমতি নেই / You do not have access to ' + page); } catch (e) {}
    location.replace(page === 'dashboard' ? 'login.html' : 'dashboard.html');
    return;
  }
  var ro = rule && typeof rule === 'object' ? rule : {};
  var css = '';
  // hide menu links the role cannot open
  Object.keys(KEYS).forEach(function (k) {
    var r = access[k];
    if (!(r === true || (r && r.view !== false && typeof r === 'object'))) css += 'a[href="' + k + '.html"]{display:none!important}';
  });
  if (ro.edit === false) css += 'button[onclick^="edit"],button[onclick^="reset"],[data-bs-target^="#add"]{display:none!important}';
  if (ro.delete === false) css += 'button[onclick^="delete"]{display:none!important}';
  if (ro.create === false) css += '[data-bs-target="#addPrescriptionModal"]{display:none!important}';
  if (user.role === 'staff') css += '#menuBackup,#menuRegister,#menuWriteoff,#menuRefunds,#menuClosing,#menuReorder{display:none!important}';
  if (user.role !== 'admin') css += '#menuCenter{display:none!important}';
  if (page === 'prescriptions' && ro.create === false) css += 'button[onclick*="fillPrescription"],button[onclick*="markMedicineFilled"]{display:none!important}';
  if (css) { var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }
  addEventListener('load', function () {
    ['editMedicine', 'editCustomer', 'deleteMedicine', 'deleteCustomer', 'deletePrescription', 'deleteSupplier'].forEach(function (fn) {
      var f = window[fn];
      if (typeof f !== 'function') return;
      var blocked = (/^delete/.test(fn) && ro.delete === false) || (/^edit/.test(fn) && ro.edit === false);
      if (blocked) window[fn] = function () { alert('Read-only access for your role.'); };
    });
    document.querySelectorAll('#userName').forEach(function (e) { if (!e.textContent.trim() || e.textContent === 'Loading...') e.textContent = user.name; });
  });
})();

/* v116 — অস্থায়ী পাসওয়ার্ডে লগইন করলে নতুন পাসওয়ার্ড দেওয়া বাধ্যতামূলক (Control Center → 🔑 Reset Requests থেকে দেওয়া)।
   ক্লায়েন্ট-সাইড ব্লক (ডেমো মোড): ডেভটুল জানা কেউ এড়াতে পারে — সার্ভার মোডে সার্ভার যাচাই করে। */
(function () {
  'use strict';
  var page = (location.pathname.split('/').pop() || '').replace('.html', '');
  if (!{ dashboard: 1, medicines: 1, customers: 1, sales: 1, purchases: 1, suppliers: 1, prescriptions: 1, reports: 1, settings: 1 }[page]) return;
  function get(k) { try { return localStorage.getItem(k) || sessionStorage.getItem(k); } catch (e) { return null; } }
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var user = null; try { user = JSON.parse(get('user')); } catch (e) { } if (!user || !user.email || !get('auth_token')) return;
  var em = String(user.email).toLowerCase(), MC = rj('pharmacy_mustchange', {}); if (!MC[em]) return;
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function withPW(cb) { if (window.MCPW) return cb(); var s = document.createElement('script'); s.src = (document.currentScript ? document.currentScript.src.replace(/guard\.js.*$/, '') : 'assets/js/') + 'pw.js'; s.onload = cb; document.head.appendChild(s); }
  ready(function () {
    var o = document.createElement('div'); o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Set new password');
    o.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(10,15,35,.92);display:grid;place-items:center;padding:1rem;font-family:system-ui,sans-serif';
    o.innerHTML = '<form style="background:#fff;color:#16213a;border-radius:16px;padding:1.4rem;max-width:380px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.5)"><h2 style="margin:0 0 .3rem;font-size:1.2rem">🔑 নতুন পাসওয়ার্ড দিন</h2><p style="margin:.2rem 0 .9rem;font-size:.9rem;color:#556">আপনি অস্থায়ী পাসওয়ার্ডে ঢুকেছেন। চালিয়ে যেতে নিজের একটি নতুন পাসওয়ার্ড দিন (কমপক্ষে ৮ অক্ষর, অক্ষর + সংখ্যা)।</p>' +
      '<input name="p1" type="password" autocomplete="new-password" placeholder="নতুন পাসওয়ার্ড" style="width:100%;box-sizing:border-box;padding:.6rem;border:1px solid #c8cfe6;border-radius:10px;margin-bottom:.5rem"><input name="p2" type="password" autocomplete="new-password" placeholder="আবার লিখুন" style="width:100%;box-sizing:border-box;padding:.6rem;border:1px solid #c8cfe6;border-radius:10px"><div id="mc116err" role="alert" style="color:#b42318;font-size:.85rem;min-height:1.2rem;margin:.4rem 0"></div>' +
      '<button style="width:100%;padding:.65rem;border:0;border-radius:10px;background:#667eea;color:#fff;font-weight:700;cursor:pointer">সেভ করে চালিয়ে যান</button><p style="text-align:center;margin:.7rem 0 0;font-size:.85rem"><a href="#" id="mc116out" style="color:#667eea">সাইন-আউট</a></p></form>';
    document.body.appendChild(o); var f = o.querySelector('form'), err = o.querySelector('#mc116err'); f.p1.focus();
    o.querySelector('#mc116out').onclick = function (e) { e.preventDefault(); if (window.authClear) window.authClear(); location.replace('login.html'); };
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var a = f.p1.value, b = f.p2.value;
      if (a.length < 8 || !/[A-Za-z]/.test(a) || !/\d/.test(a)) { err.textContent = 'কমপক্ষে ৮ অক্ষর, অক্ষর ও সংখ্যা দুটোই লাগবে।'; return; }
      if (a !== b) { err.textContent = 'দুটি পাসওয়ার্ড মেলেনি।'; return; }
      if (a.toLowerCase().indexOf(em.split('@')[0]) > -1 || /^(admin123|pharm123|staff123|password|12345678)/i.test(a)) { err.textContent = 'এই পাসওয়ার্ড সহজে অনুমান করা যায় — অন্যটি দিন।'; return; }
      err.textContent = 'সেভ হচ্ছে…';
      withPW(function () {
        MCPW.hash(a).then(function (h) {
          var accts = rj('pharmacy_accounts', []), cu = accts.filter(function (x) { return String(x.email).toLowerCase() === em; })[0];
          if (cu) { cu.hash = h; localStorage.setItem('pharmacy_accounts', JSON.stringify(accts)); } else { var cr = rj('pharmacy_creds', {}); cr[em] = h; localStorage.setItem('pharmacy_creds', JSON.stringify(cr)); }
          var m2 = rj('pharmacy_mustchange', {}); delete m2[em]; localStorage.setItem('pharmacy_mustchange', JSON.stringify(m2));
          var L = rj('pharmacy_loginlog', []); L.push({ at: new Date().toISOString(), email: em, ok: true, role: user.role, note: 'password changed after reset' }); localStorage.setItem('pharmacy_loginlog', JSON.stringify(L.slice(-100)));
          o.remove();
        }, function () { err.textContent = 'এই ব্রাউজারে সেভ করা গেল না।'; });
      });
    });
  });
})();
