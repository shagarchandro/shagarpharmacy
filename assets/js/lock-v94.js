/* v94 — স্ক্রিন-লক (PIN): ক্যাশ কাউন্টার ছেড়ে গেলে স্ক্রিন ঢেকে দেয়। Ctrl+L বা অলস থাকলে (Settings → Alerts & Session) লক; PIN দিলে খোলে।
   ৫ বার ভুল PIN → লগআউট। PIN এই ব্রাউজারে হ্যাশ করে রাখা হয় (pharmacy_lockcfg[email]) — ডেমো-মানের সুরক্ষা, সার্ভার-নিরাপত্তা নয়। */
(function () {
  'use strict';
  var KEY = 'pharmacy_lockcfg';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function who() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { return null; } }
  var u = who(); if (!u) return;
  var em = String(u.email || '').toLowerCase();
  function cfg() { return (rj(KEY, {}))[em] || {}; }
  function put(c) { var m = rj(KEY, {}); if (c) m[em] = c; else delete m[em]; try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) { } }
  function hash(pin) {
    var s = em + ':' + pin + ':mc-lock-v94';
    if (window.crypto && crypto.subtle && window.TextEncoder) return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); });
    var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return Promise.resolve('d' + h);
  }
  window.MCLock = {
    has: function () { return !!cfg().h; },
    set: function (pin) { return hash(pin).then(function (h) { var c = cfg(); c.h = h; put(c); }); },
    clear: function () { var c = cfg(); delete c.h; put(c); try { sessionStorage.removeItem('mc_locked'); } catch (e) { } },
    idle: function () { return +cfg().idle || 0; }, setIdle: function (m) { var c = cfg(); c.idle = +m || 0; put(c); },
    lock: lock
  };
  var ov = null, fails = 0;
  function lock() {
    if (!cfg().h || ov) return false; try { sessionStorage.setItem('mc_locked', '1'); } catch (e) { }
    ov = document.createElement('div'); ov.id = 'mcLockOv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Screen locked');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(10,20,30,.92);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#fff';
    ov.innerHTML = '<form style="background:#16213a;border-radius:18px;padding:1.6rem 1.4rem;width:min(92vw,320px);text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5)"><div style="font-size:2.2rem">🔒</div><h2 style="margin:.3rem 0;font-size:1.2rem">স্ক্রিন লক করা আছে</h2><p style="margin:0 0 .8rem;opacity:.75;font-size:.9rem">' + (u.name || em).replace(/[<>&"]/g, '') + ' — PIN দিয়ে খুলুন</p><input id="mcLockIn" type="password" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="PIN" style="width:100%;box-sizing:border-box;padding:.7rem;border-radius:10px;border:1px solid #3a4a6a;background:#0f1426;color:#fff;font-size:1.3rem;text-align:center;letter-spacing:.4rem"><p id="mcLockMsg" role="alert" style="min-height:1.3rem;margin:.5rem 0;color:#fca5a5;font-size:.85rem"></p><button class="mcLockBtn" style="width:100%;padding:.7rem;border:0;border-radius:10px;background:#667eea;color:#fff;font-size:1rem;cursor:pointer">🔓 আনলক</button><p style="margin:.8rem 0 0"><a href="#" id="mcLockOut" style="color:#a3adcb;font-size:.85rem">লগআউট করুন</a></p></form>';
    document.body.appendChild(ov); var inp = ov.querySelector('#mcLockIn'); setTimeout(function () { inp.focus(); }, 30);
    document.documentElement.style.overflow = 'hidden';
    ov.querySelector('form').onsubmit = function (e) {
      e.preventDefault(); var v = inp.value.trim(); if (!v) return;
      hash(v).then(function (h) {
        if (h === cfg().h) { unlock(); return; }
        fails++; inp.value = ''; var left = 5 - fails; if (left <= 0) { out(); return; } ov.querySelector('#mcLockMsg').textContent = 'ভুল PIN — আর ' + left + ' বার চেষ্টা বাকি'; inp.focus();
      });
    };
    ov.querySelector('#mcLockOut').onclick = function (e) { e.preventDefault(); out(); };
    ov.addEventListener('keydown', function (e) { if (e.key === 'Tab') { e.preventDefault(); inp.focus(); } });
    return true;
  }
  function unlock() { if (ov) { ov.remove(); ov = null; } fails = 0; try { sessionStorage.removeItem('mc_locked'); } catch (e) { } document.documentElement.style.overflow = ''; }
  function out() { try { sessionStorage.setItem('mc_flash', 'নিরাপত্তার জন্য লগআউট হয়েছে।'); sessionStorage.removeItem('mc_locked'); } catch (e) { } try { if (window.authClear) window.authClear(); } catch (e) { } try { localStorage.removeItem('user'); sessionStorage.removeItem('user'); } catch (e) { } location.replace((location.pathname.indexOf('/admin/') >= 0 ? '../' : '') + 'login.html'); }
  /* Ctrl+L */
  document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'l' || e.key === 'L') && cfg().h) { e.preventDefault(); lock(); } });
  /* অলস থাকলে */
  var last = Date.now(); ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(function (ev) { addEventListener(ev, function () { last = Date.now(); }, { passive: true, capture: true }); });
  setInterval(function () { var m = +cfg().idle || 0; if (m && cfg().h && !ov && Date.now() - last >= m * 60e3) lock(); }, 5000);
  /* পেজ বদলালে/রিলোডে লক বহাল */
  function boot() { try { if (sessionStorage.getItem('mc_locked') === '1' && cfg().h) lock(); } catch (e) { } }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
