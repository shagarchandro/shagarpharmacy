/* Global responsive & accessibility layer: wraps bare tables for horizontal scroll, bigger touch targets,
   16px inputs on phones (no iOS zoom), full-width modals, safe-area padding, focus rings, reduced motion, print. */
(function () {
  'use strict';
  // stored-XSS guard: angle brackets in saved text become look-alike full-width characters, so names/notes can never inject markup
  try {
    var _set = Storage.prototype.setItem;
    var clean = function (v) { if (typeof v === 'string') return /[<>]/.test(v) ? v.replace(/</g, '\uFF1C').replace(/>/g, '\uFF1E') : v; if (Array.isArray(v)) return v.map(clean); if (v && typeof v === 'object') { var o = {}; for (var k in v) o[k] = clean(v[k]); return o; } return v; };
    Storage.prototype.setItem = function (k, v) {
      try { if (this === window.localStorage && /^(pharmacy_|mc_)/.test(k) && typeof v === 'string' && /[<>]/.test(v)) { var j; try { j = JSON.parse(v); v = JSON.stringify(clean(j)); } catch (e) { v = clean(v); } } } catch (e) {}
      return _set.call(this, k, v);
    };
  } catch (e) {}
  // clickjacking guard: never render inside someone else's frame
  try { if (window.top !== window.self) { document.documentElement.style.display = 'none'; try { window.top.location = window.self.location; } catch (e) {} } } catch (e) { document.documentElement.style.display = 'none'; }
  var css = '' +
  'html{-webkit-text-size-adjust:100%}img,video,canvas,svg{max-width:100%}' +
  ':focus-visible{outline:3px solid rgba(102,126,234,.55)!important;outline-offset:2px}' +
  '.mc-tw{overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%}.mc-tw>table{min-width:560px}' +
  '@media(max-width:767px){' +
   'input,select,textarea,.form-control,.form-select{font-size:16px!important}' +
   'button,.btn,a.nav-link,.page-link{min-height:40px}' +
   '.modal-dialog{margin:.5rem!important;max-width:calc(100vw - 1rem)!important}' +
   '.modal-body{max-height:calc(100vh - 11rem);overflow-y:auto}' +
   'body{padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right);padding-bottom:env(safe-area-inset-bottom)}' +
   '.container,.container-fluid{padding-left:12px!important;padding-right:12px!important}' +
   'h1,.h1{font-size:1.5rem}h2,.h2{font-size:1.3rem}' +
   '.d-flex.justify-content-between{flex-wrap:wrap;gap:.5rem}' +
   '#mcStrip,.mc-strip{grid-template-columns:repeat(2,1fr)!important}' +
  '}' +
  '@media(max-width:380px){.btn{padding-left:.6rem;padding-right:.6rem}.card-body{padding:.8rem!important}}' +
  '@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}' +
  '@media print{.sidebar,.mobile-sidebar-toggle,.no-print,.noprint,.mc-back,.toast-container,nav.navbar{display:none!important}.main-content,main{margin:0!important;padding:0!important;width:100%!important}body{background:#fff!important;color:#000!important}.mc-tw{overflow:visible}}';
  var st = document.createElement('style'); st.id = 'mcResponsive'; st.textContent = css; (document.head || document.documentElement).appendChild(st);

  function wrap() {
    document.querySelectorAll('table').forEach(function (t) {
      if (t.dataset.mcw) return; t.dataset.mcw = 1;
      var p = t.parentElement; if (!p) return;
      for (var a = p; a && a !== document.body; a = a.parentElement) { if (/(auto|scroll)/.test(getComputedStyle(a).overflowX) || a.classList.contains('table-responsive') || a.classList.contains('scroll')) return; }
      var w = document.createElement('div'); w.className = 'mc-tw'; p.insertBefore(w, t); w.appendChild(t);
    });
  }
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () {
    wrap();
    var n = 0, mo = new MutationObserver(function () { if (n++ > 400) { mo.disconnect(); return; } clearTimeout(mo.t); mo.t = setTimeout(wrap, 120); });
    mo.observe(document.body, { childList: true, subtree: true });
    // keyboard users: Esc closes the mobile sidebar if present
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var s = document.querySelector('.sidebar.show,.sidebar.active,.sidebar.open'); if (s) s.classList.remove('show', 'active', 'open'); } });
  });
})();
