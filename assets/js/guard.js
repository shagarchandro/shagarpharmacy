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
  var AUTH = ['user', 'auth_token', 'user_role', 'user_access', 'mc_started', 'mc_session_start'];
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
