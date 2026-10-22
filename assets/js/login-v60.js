/* Staff login v60: optional second step for the Admin role — a PIN set in Control Center → 🔑 Sign-in.
   Shown only after the Admin role is chosen; a wrong PIN counts as a failed attempt (same lock-out as a wrong password). */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var form = document.getElementById('loginForm'); if (!form) return;
  var S = rj('pharmacy_settings', {}); if (!S.adminPin || !window.MCPW) return;
  var role = document.getElementById('role'), pw = document.getElementById('password'), verified = false, box = null, input = null;
  function isAdmin() { return role && role.value === 'admin'; }
  function ensure() {
    if (box) return; box = document.createElement('div'); box.className = 'mb-3'; box.id = 'mcPinBox'; box.hidden = true;
    box.innerHTML = '<label class="form-label fw-semibold" for="mcPin">🔑 অ্যাডমিন PIN / Admin PIN</label><input id="mcPin" class="form-control" type="password" inputmode="numeric" maxlength="8" autocomplete="one-time-code" placeholder="••••"><div class="small text-muted mt-1">Control Center-এ সেট করা দ্বিতীয় ধাপ।</div>';
    pw.closest('.mb-3').after(box); input = box.querySelector('input');
  }
  function sync() { ensure(); box.hidden = !isAdmin(); if (!isAdmin()) verified = false; }
  document.querySelectorAll('.role-badge').forEach(function (b) { b.addEventListener('click', function () { setTimeout(sync, 0); }); }); setTimeout(sync, 300);
  // capture phase on the form: runs before the page's own submit handler
  form.addEventListener('submit', function (e) {
    sync(); if (!isAdmin() || verified) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var pin = (input.value || '').trim(); if (!pin) { input.focus(); if (window.showAlert) { var m = document.createElement('div'); } box.hidden = false; input.classList.add('is-invalid'); return; }
    MCPW.verify(pin, S.adminPin).then(function (ok) {
      if (ok) { verified = true; input.classList.remove('is-invalid'); if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true })); setTimeout(function () { verified = false; input.value = ''; }, 1500); }
      else { input.classList.add('is-invalid'); input.select(); if (window.showAlert) window.showAlert('Invalid Admin PIN', 'danger'); }
    });
  }, true);
})();
