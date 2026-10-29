/* v91 Ops Login: কীবোর্ড (↑↓ / ১–৫ দিয়ে ইউজার বাছাই, ইউজার বাছলে কোড-ঘরে ফোকাস), Caps Lock সতর্কতা, লাইভ ঢাকা-ঘড়ি + অনলাইন/অফলাইন + মোড (ডেমো/সার্ভার),
   ইউজার খোঁজা (৬+ জন হলে), বাছা ইউজারের গত ২৪ ঘণ্টার ব্যর্থ চেষ্টা, "কোড/PIN ভুলে গেছেন?" সাহায্য, ডবল-সাবমিট ঠেকানো ও "লগ ইন হচ্ছে…" */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  if (!$('ul') || !$('c') || !$('f')) return;
  var SRV = !!(window.MCSRV && MCSRV.active);
  var st = document.createElement('style');
  st.textContent = '.o91bar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;font-size:.82rem;margin:.2rem 0 .6rem;color:var(--mut,#6b7a8a)}.o91bar b{color:inherit}.o91dot{display:inline-block;width:.55rem;height:.55rem;border-radius:50%;margin-right:.25rem;background:#16a34a}.o91dot.off{background:#dc2626}.o91w{background:#fff4e5;color:#8a4b00;border-radius:8px;padding:.35rem .6rem;margin:.4rem 0;font-size:.85rem}.o91q{width:100%;margin:0 0 .5rem}.uc.o91hide{display:none}.uc kbd{font-size:.7rem;border:1px solid currentColor;border-radius:4px;padding:0 .3rem;opacity:.6}@media(prefers-color-scheme:dark){.o91w{background:#3a2a10;color:#ffd9a0}}html[data-theme=dark] .o91w,html[data-mc=dark] .o91w{background:#3a2a10;color:#ffd9a0}';
  document.head.appendChild(st);
  /* স্ট্যাটাস বার */
  var bar = document.createElement('div'); bar.className = 'o91bar'; bar.setAttribute('aria-live', 'off');
  $('f').parentNode.insertBefore(bar, $('f'));
  function tick() { bar.innerHTML = '<span><span class="o91dot' + (navigator.onLine ? '' : ' off') + '"></span>' + (navigator.onLine ? 'অনলাইন' : 'অফলাইন') + '</span><span>🕒 ' + new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' (ঢাকা)</span><span>' + (SRV ? '🖥 সার্ভার মোড' : '🧪 ডেমো মোড') + '</span>'; }
  tick(); setInterval(tick, 20000); window.addEventListener('online', tick); window.addEventListener('offline', tick);
  /* ইউজার কার্ড: নম্বর ব্যাজ, খোঁজা */
  var cards = function () { return Array.prototype.slice.call($('ul').querySelectorAll('.uc')); };
  function badge() { cards().forEach(function (c, i) { if (i < 9 && !c.querySelector('kbd')) { var k = document.createElement('kbd'); k.textContent = i + 1; k.title = 'কীবোর্ডে ' + (i + 1) + ' চাপুন'; c.querySelector('span').appendChild(k); } }); }
  badge();
  if (cards().length >= 6) {
    var q = document.createElement('input'); q.className = 'o91q'; q.type = 'search'; q.placeholder = '🔎 ইউজার খুঁজুন…'; q.setAttribute('aria-label', 'Search user'); $('ul').parentNode.insertBefore(q, $('ul'));
    q.oninput = function () { var v = q.value.trim().toLowerCase(); cards().forEach(function (c) { c.classList.toggle('o91hide', !!v && c.textContent.toLowerCase().indexOf(v) < 0); }); };
  }
  /* কীবোর্ড */
  document.addEventListener('keydown', function (e) {
    var t = e.target, typing = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t.type !== 'radio';
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    var cs = cards().filter(function (c) { return !c.classList.contains('o91hide'); });
    if (/^[1-9]$/.test(e.key) && cs[+e.key - 1]) { cs[+e.key - 1].click(); $('c').focus(); e.preventDefault(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { var cur = cs.findIndex(function (c) { return c.classList.contains('on'); }), n = Math.max(0, Math.min(cs.length - 1, cur + (e.key === 'ArrowDown' ? 1 : -1))); if (cs[n]) { cs[n].click(); e.preventDefault(); } }
  });
  $('ul').addEventListener('click', function () { setTimeout(function () { $('c').focus(); info(); }, 30); });
  /* Caps Lock */
  var cw = document.createElement('div'); cw.className = 'o91w'; cw.hidden = true; cw.textContent = '⇪ Caps Lock চালু আছে'; $('c').closest('label').after(cw);
  $('c').addEventListener('keydown', function (e) { if (e.getModifierState) cw.hidden = !e.getModifierState('CapsLock'); });
  $('c').addEventListener('blur', function () { cw.hidden = true; });
  /* বাছা ইউজারের ব্যর্থ চেষ্টা */
  var fw = document.createElement('div'); fw.className = 'o91w'; fw.hidden = true; $('last').after(fw);
  function info() {
    var on = $('ul').querySelector('.uc.on'); fw.hidden = true; if (!on) return;
    var name = on.querySelector('b').textContent.replace(/^\S+\s/, '').trim(), key = name + ' (Ops)';
    var n = rj('pharmacy_loginlog', []).filter(function (x) { return x && x.scope === 'ops' && !x.ok && x.email === key && Date.now() - new Date(x.at) < 864e5; }).length;
    if (n) { fw.hidden = false; fw.textContent = '⚠ গত ২৪ ঘণ্টায় এই ইউজারে ' + n + 'টি ব্যর্থ চেষ্টা হয়েছে।'; }
  }
  setTimeout(info, 200);
  /* সাহায্য */
  var hp = document.createElement('details'); hp.className = 'muted small'; hp.innerHTML = '<summary>কোড / PIN ভুলে গেছেন?</summary><p>ডেমো মোডে সাধারণ কোড <code>demo</code> (পিন সেট না থাকলে)। ব্যক্তিগত PIN ভুলে গেলে Owner → Control Center → 🔑 Sign-in থেকে নতুন PIN দিন বা মুছে দিন। একাধিক ভুলের পর সাময়িক লক হয় — কাউন্টডাউন শেষ হলে আবার চেষ্টা করুন।</p>';
  $('acc').before(hp);
  /* ডবল-সাবমিট */
  $('f').addEventListener('submit', function () { setTimeout(info, 600); var b = $('go'); if (b.disabled) return; var old = b.textContent; setTimeout(function () { if (location.pathname.indexOf('login') >= 0 && !b.disabled) { b.disabled = true; b.textContent = '⏳ যাচাই হচ্ছে…'; setTimeout(function () { var lk = $('lock'); if (!lk || lk.hidden) b.disabled = false; b.textContent = old; }, 1400); } }, 0); }, true);
})();
