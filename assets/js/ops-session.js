/* Operations Panel session control: automatic sign-out after inactivity (minutes from Control Center → Rules / Security,
   default 30, 0 = off) and after the maximum session length (hours, default 12). Warns one minute before. */
(function () {
  'use strict';
  if (!sessionStorage.getItem('mc_role')) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var S = rj('pharmacy_settings', {}), idleMin = S.idleMin == null ? 30 : +S.idleMin, hours = S.sessionHours == null ? 12 : +S.sessionHours;
  if (!sessionStorage.getItem('mc_ops_start')) sessionStorage.setItem('mc_ops_start', String(Date.now()));
  var bar = null, last = +sessionStorage.getItem('mc_ops_last') || Date.now();
  function touch() { last = Date.now(); try { sessionStorage.setItem('mc_ops_last', String(last)); } catch (e) { } if (bar) { bar.remove(); bar = null; } }
  ['click', 'keydown', 'touchstart', 'scroll'].forEach(function (e) { window.addEventListener(e, function () { if (Date.now() - last > 5000) touch(); }, { passive: true, capture: true }); });
  function out(why) { try { sessionStorage.removeItem('mc_role'); sessionStorage.setItem('mc_flash', why); } catch (e) { } location.replace('login.html'); }
  setInterval(function () {
    var now = Date.now(), start = +sessionStorage.getItem('mc_ops_start') || now;
    if (hours > 0 && now - start > hours * 36e5) return out('সেশনের সর্বোচ্চ সময় (' + hours + ' ঘণ্টা) শেষ — আবার লগইন করুন।');
    if (idleMin > 0) {
      var idle = (now - last) / 6e4; if (idle >= idleMin) return out(idleMin + ' মিনিট নিষ্ক্রিয় থাকায় সাইন-আউট হয়েছে।');
      if (idle >= idleMin - 1 && !bar) { bar = document.createElement('div'); bar.setAttribute('role', 'alert'); bar.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;background:#8a4b00;color:#fff;border-radius:12px;padding:.6rem 1rem;box-shadow:0 6px 24px rgba(0,0,0,.3);max-width:92vw'; bar.append('⏱ এক মিনিটের মধ্যে অটো সাইন-আউট হবে। '); var b = document.createElement('button'); b.textContent = 'থাকুন'; b.style.cssText = 'margin-left:.5rem;border:0;border-radius:8px;padding:.25rem .7rem;cursor:pointer'; b.onclick = touch; bar.append(b); document.body.append(bar); }
    }
  }, 15000);
})();
