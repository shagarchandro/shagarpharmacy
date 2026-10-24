/* v69 — স্টাফ লগইন (সার্ভার মোডে): ইমেইল/পাসওয়ার্ড/Admin PIN সার্ভারে যাচাই। সার্ভার না থাকলে কিছু করে না। */
(function () {
  'use strict';
  if (!window.MCSRV || !MCSRV.active) return;
  var form = document.getElementById('loginForm'); if (!form) return;
  var $ = function (i) { return document.getElementById(i); }, pinBox = null;
  function alertMsg(m, t) { if (window.showAlert) window.showAlert(m, t); else alert(m); }
  function needPin() {
    if (!pinBox) { pinBox = document.createElement('div'); pinBox.className = 'mb-3'; pinBox.innerHTML = '<label class="form-label fw-semibold" for="mcPin">🔑 অ্যাডমিন PIN / Admin PIN</label><input id="mcPin" class="form-control" type="password" inputmode="numeric" maxlength="8" autocomplete="one-time-code" placeholder="••••">'; $('password').closest('.mb-3').after(pinBox); }
    pinBox.hidden = false; $('mcPin').focus();
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); e.stopImmediatePropagation();
    var email = ($('email').value || '').trim(), pw = $('password').value, role = $('role').value, remember = !!($('rememberMe') && $('rememberMe').checked), pin = pinBox && !pinBox.hidden ? $('mcPin').value.trim() : undefined;
    if (!email || !pw) { alertMsg('❌ ইমেইল ও পাসওয়ার্ড দিন', 'danger'); return; }
    var btn = $('loginBtn'); if (btn) btn.disabled = true;
    MCSRV.apost('/api/login', { scope: 'staff', email: email, password: pw, role: role, remember: remember, pin: pin }).then(function (r) {
      if (btn) btn.disabled = false; var j = r.json || {};
      if (r.status === 200 && j.ok) {
        var u = j.user, ud = { id: u.ext || u.id, name: u.name, email: u.email, role: u.role, access: u.access, avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name) + '&background=667eea&color=fff' };
        MCSRV.setStaffSession(ud, remember); alertMsg('✅ লগইন সফল! স্বাগতম ' + u.name, 'success');
        setTimeout(function () { location.href = 'dashboard.html'; }, 700); return;
      }
      if (j.needPin) { needPin(); alertMsg('🔑 Admin PIN দিন', 'warning'); return; }
      if (pinBox && !pinBox.hidden) { $('mcPin').classList.add('is-invalid'); }
      alertMsg('❌ ' + (j.error || 'সার্ভারের সাথে যোগাযোগ করা যায়নি'), 'danger');
      var p = $('password'); p.classList.add('shake'); setTimeout(function () { p.classList.remove('shake'); }, 500);
    });
  }, true);
})();
