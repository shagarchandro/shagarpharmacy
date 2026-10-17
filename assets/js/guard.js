/* MediCare shared auth guard for the staff pages (dashboard, medicines, sales, ...).
   - clears ONLY auth keys on logout/login (business data is never wiped)
   - blocks pages the role may not open, hides their menu links
   - makes staff read-only where the login says edit:false */
/* Offline-safe stubs: if a CDN (gsap/AOS) fails to load, animations are skipped instead of breaking login & pages. */
(function(){
  function chain(){var o=function(){return o};['to','from','fromTo','set','timeline','registerPlugin','add','kill','play','pause','delay','killTweensOf','utils'].forEach(function(k){o[k]=function(){return o}});return o}
  if(!window.gsap)window.gsap=chain();
  if(!window.ScrollTrigger)window.ScrollTrigger={};
  if(!window.Chart){window.Chart=function(){this.data={datasets:[],labels:[]};this.options={};this.destroy=function(){};this.update=function(){}};window.Chart.register=function(){};window.Chart.defaults={}}
  if(!window.AOS)window.AOS={init:function(){},refresh:function(){}};
})();
(function () {
  'use strict';
  var AUTH = ['user', 'auth_token', 'user_role', 'user_access'];
  window.authClear = function () {
    AUTH.forEach(function (k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) {} });
  };
  function get(k) { try { return localStorage.getItem(k) || sessionStorage.getItem(k); } catch (e) { return null; } }
  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
  var KEYS = { dashboard: 1, medicines: 1, customers: 1, sales: 1, purchases: 1, suppliers: 1, prescriptions: 1, reports: 1, settings: 1 };
  if (!KEYS[page]) return;                       // login / landing: nothing to guard
  var user = null, access = null;
  try { user = JSON.parse(get('user')); access = JSON.parse(get('user_access')); } catch (e) {}
  if (!user || !get('auth_token') || !access) { location.replace('login.html'); return; }
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
  if (user.role === 'staff') css += '#menuBackup{display:none!important}';
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
