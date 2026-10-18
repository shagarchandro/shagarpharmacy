/* Dashboard Settings: replaces the previously fake handlers with real, persisted ones.
   Data: pharmacy_profile, pharmacy_settings, pharmacy_creds (SHA-256 hashes), pharmacy_lastbackup */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function rd(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function wr(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function who() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { return null; } }
  function msg(m, t) { if (typeof showToast === 'function') showToast(m, t || 'success'); else alert(m); }
  function sha(s) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) { return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }); }
  var DEF = { 'admin@medicare.com': 'admin123', 'pharmacist@medicare.com': 'pharm123', 'staff@medicare.com': 'staff123' };
  var isAdmin = function () { var u = who(); return u && u.role === 'admin'; };

  function addStoreTab() {
    var nav = document.querySelector('#settingsModal .nav-tabs'), content = document.querySelector('#settingsModal .tab-content');
    if (!nav || !content || $('storeset')) return;
    var li = document.createElement('li'); li.className = 'nav-item';
    li.innerHTML = '<a class="nav-link" data-bs-toggle="tab" href="#storeset">Store &amp; Invoice</a>'; nav.insertBefore(li, nav.children[1]);
    var d = document.createElement('div'); d.className = 'tab-pane fade'; d.id = 'storeset';
    d.innerHTML = '<div class="row g-3">' +
      '<div class="col-md-6"><label class="form-label">Pharmacy name</label><input class="form-control" id="stName"></div>' +
      '<div class="col-md-6"><label class="form-label">Phone</label><input class="form-control" id="stPhone"></div>' +
      '<div class="col-12"><label class="form-label">Address</label><input class="form-control" id="stAddr"></div>' +
      '<div class="col-md-6"><label class="form-label">Invoice email</label><input class="form-control" id="stEmail" type="email"></div>' +
      '<div class="col-md-3"><label class="form-label">VAT / Tax %</label><input class="form-control" id="stTax" type="number" min="0" max="50" step="0.5"></div>' +
      '<div class="col-md-3"><label class="form-label">Low-stock default</label><input class="form-control" id="stLow" type="number" min="0"></div>' +
      '<div class="col-12"><button class="btn btn-primary" type="button" onclick="saveStoreSettings()">Save store settings</button> <small class="text-muted ms-2">POS invoice and VAT use these values.</small></div></div>';
    content.insertBefore(d, content.children[1]);
    var s = rd('pharmacy_settings', {});
    $('stName').value = s.store || 'MediCare Pharmacy'; $('stPhone').value = s.phone || '+8801700000000'; $('stAddr').value = s.address || 'Dhanmondi, Dhaka';
    $('stEmail').value = s.email || 'info@medicare.com'; $('stTax').value = s.taxPct == null ? 10 : s.taxPct; $('stLow').value = s.lowDefault == null ? 20 : s.lowDefault;
    // non-admins can only edit their own profile/password
    if (!isAdmin()) { li.style.display = 'none'; }
  }

  window.saveStoreSettings = function () {
    if (!isAdmin()) return msg('Only Admin can change store settings', 'danger');
    var tax = parseFloat($('stTax').value), low = parseInt($('stLow').value, 10);
    if (!$('stName').value.trim()) return msg('Pharmacy name is required', 'danger');
    if (isNaN(tax) || tax < 0 || tax > 50) return msg('Tax must be 0–50%', 'danger');
    var s = rd('pharmacy_settings', {});
    Object.assign(s, { store: $('stName').value.trim(), phone: $('stPhone').value.trim(), address: $('stAddr').value.trim(), email: $('stEmail').value.trim(), taxPct: tax, lowDefault: isNaN(low) ? 20 : Math.max(low, 0) });
    wr('pharmacy_settings', s); msg('Store settings saved');
  };

  window.updateProfile = function () {
    var name = $('profileName').value.trim(), email = $('profileEmail').value.trim(), phone = $('profilePhone').value.trim();
    if (name.length < 2) return msg('Enter your name', 'danger');
    if (!/^\S+@\S+\.\S+$/.test(email)) return msg('Enter a valid email', 'danger');
    var u = who(); if (!u) return;
    var p = rd('pharmacy_profile', {}); p[u.role] = { name: name, email: email, phone: phone }; wr('pharmacy_profile', p);
    u.name = name; u.phoneNo = phone; // login email stays the same
    var store = localStorage.getItem('user') ? localStorage : sessionStorage; store.setItem('user', JSON.stringify(u));
    document.querySelectorAll('#userName').forEach(function (e) { e.textContent = name; });
    msg('Profile updated');
  };

  window.updatePassword = function () {
    var u = who(); if (!u) return;
    var cur = $('currentPassword').value, nw = $('newPassword').value, cf = $('confirmPassword').value;
    if (!cur || !nw || !cf) return msg('Please fill all password fields', 'danger');
    var pe = MCPW.policy(nw, u.email); if (pe) return msg(pe, 'danger');
    if (nw !== cf) return msg('New passwords do not match', 'danger');
    if (nw === cur) return msg('Choose a different password', 'danger');
    var email = String(u.email || '').toLowerCase(), creds = rd('pharmacy_creds', {}), accts = rd('pharmacy_accounts', []);
    var ca = accts.filter(function (x) { return String(x.email).toLowerCase() === email; })[0];
    if (!ca && !DEF[email]) return msg('Unknown account', 'danger');
    var check = ca ? MCPW.verify(cur, ca.hash) : (creds[email] ? MCPW.verify(cur, creds[email]) : Promise.resolve(cur === DEF[email]));
    check.then(function (ok) {
      if (!ok) return msg('Current password is incorrect', 'danger');
      return MCPW.hash(nw).then(function (nh) {
        if (ca) { ca.hash = nh; wr('pharmacy_accounts', accts); } else { creds[email] = nh; wr('pharmacy_creds', creds); }
        try { var a = rd('pharmacy_audit', []); a.push({ at: new Date().toISOString(), by: u.name || email, msg: 'Password changed: ' + email }); wr('pharmacy_audit', a.slice(-300)); } catch (e) {}
        ['currentPassword', 'newPassword', 'confirmPassword'].forEach(function (i) { $(i).value = ''; }); msg('Password changed. Use it next time you log in.');
      });
    });
  };

  window.enable2FA = function () { msg('Two-factor login needs a real server, so it is not available in this demo.', 'info'); };

  window.saveNotificationSettings = function () {
    var s = rd('pharmacy_settings', {}); s.notif = { email: $('emailNotif').checked, sms: $('smsNotif').checked, whatsapp: $('whatsappNotif').checked };
    wr('pharmacy_settings', s); msg('Preferences saved (in-app only; no SMS/email is sent in this demo)');
  };

  window.backupDatabase = function () {
    var o = { app: 'medicare', v: 7, at: new Date().toISOString(), data: {} };
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^(pharmacy_|mc_)/.test(k) && k !== 'pharmacy_lastbackup' && k !== 'pharmacy_creds') o.data[k] = localStorage.getItem(k); }
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(o)], { type: 'application/json' }));
    a.download = 'medicare-backup-' + o.at.slice(0, 10) + '.json'; a.click(); localStorage.setItem('pharmacy_lastbackup', o.at); showLast(); msg('Backup downloaded');
  };
  window.restoreDatabase = function () { location.href = 'backup.html'; };
  window.saveAllSettings = function () { if (isAdmin() && $('stName')) window.saveStoreSettings(); window.saveNotificationSettings(); };
  function showLast() { var t = document.querySelector('#backup p.text-muted'); if (t) { var l = localStorage.getItem('pharmacy_lastbackup'); t.textContent = l ? 'Last backup: ' + new Date(l).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }) : 'No backup yet — click "Backup Database".'; } }

  function init() {
    addStoreTab(); showLast();
    var u0 = who(); if (u0 && u0.role === 'staff') { var bt = document.querySelector('#settingsModal a[href="#backup"]'); if (bt) bt.parentNode.style.display = 'none'; }
    var u = who(), p = u && (rd('pharmacy_profile', {})[u.role]);
    if (u) { $('profileName').value = (p && p.name) || u.name || ''; $('profileEmail').value = u.email || ''; $('profileEmail').readOnly = true; $('profilePhone').value = (p && p.phone) || ''; if (p && p.name) document.querySelectorAll('#userName').forEach(function (e) { e.textContent = p.name; }); }
    var n = (rd('pharmacy_settings', {}).notif) || { email: true, sms: true, whatsapp: false };
    if ($('emailNotif')) { $('emailNotif').checked = n.email; $('smsNotif').checked = n.sms; $('whatsappNotif').checked = n.whatsapp; }
    var b = document.querySelector('#security .btn-warning'); if (b) b.textContent = 'Two-factor (not in demo)';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
