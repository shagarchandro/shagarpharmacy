/* Password helpers (browser demo): salted PBKDF2-SHA-256 hashes, legacy SHA-256 still verified, password policy.
   MCPW.hash(pw) -> "p2$<salt>$<hash>" ; MCPW.verify(pw, stored) -> Promise<bool> ; MCPW.policy(pw, email) -> '' or error text */
(function () {
  'use strict';
  var ITER = 120000, enc = new TextEncoder();
  function hex(b) { return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }
  function unhex(h) { var a = new Uint8Array(h.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }
  function pbk(pw, salt) { return crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']).then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: ITER }, k, 256); }).then(hex); }
  function sha(pw) { return crypto.subtle.digest('SHA-256', enc.encode(pw)).then(hex); }
  function same(a, b) { if (a.length !== b.length) return false; var d = 0; for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
  var COMMON = ['password', '12345678', '123456789', 'qwerty123', 'admin123', 'pharm123', 'staff123', 'medicare', 'medicare123', 'password1', 'iloveyou', '11111111', 'abc12345'];
  window.MCPW = {
    hash: function (pw) { var salt = crypto.getRandomValues(new Uint8Array(16)); return pbk(pw, salt).then(function (h) { return 'p2$' + hex(salt) + '$' + h; }); },
    verify: function (pw, stored) {
      if (!stored) return Promise.resolve(false);
      if (stored.indexOf('p2$') === 0) { var p = stored.split('$'); return pbk(pw, unhex(p[1])).then(function (h) { return same(h, p[2]); }); }
      return sha(pw).then(function (h) { return same(h, stored); });
    },
    isLegacy: function (stored) { return !!stored && stored.indexOf('p2$') !== 0; },
    policy: function (pw, email) {
      pw = String(pw || ''); var local = String(email || '').split('@')[0].toLowerCase();
      if (pw.length < 8) return 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে / Use at least 8 characters';
      if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'অক্ষর ও সংখ্যা দুটোই থাকতে হবে / Use letters and numbers';
      if (COMMON.indexOf(pw.toLowerCase()) > -1) return 'এটি খুব সাধারণ পাসওয়ার্ড / Too common';
      if (local && local.length > 2 && pw.toLowerCase().indexOf(local) > -1) return 'পাসওয়ার্ডে ইমেইলের অংশ রাখবেন না / Do not include your email name';
      return '';
    }
  };
})();
