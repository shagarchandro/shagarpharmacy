/* v81 — একটাই থিম সিস্টেম: ☀ Light · 🌙 Dark · 🖥 Auto (ডিভাইসের সেটিং অনুযায়ী)।
   আগে চার রকম আলাদা ব্যবস্থা ছিল (ড্যাশবোর্ডের darkMode, Settings-এর invert-ফিল্টার "বিটা", কিছু পেজে শুধু prefers-color-scheme, শপ/Ops-এ mc_theme)।
   এখন সবই এই ফাইল থেকে চলে:
   • পছন্দ mc_theme_mode-এ (এই ডিভাইস/ব্রাউজারে), সব পেজ ও ট্যাবে একসাথে বদলায়
   • html-এ data-mc / data-theme / data-bs-theme + body.dark-mode বসে; পুরনো @media(prefers-color-scheme) নিয়মগুলোও এখন বেছে নেওয়া মোড মানে
     (অর্থাৎ Light বেছে রাখলে ডিভাইস ডার্ক হলেও পেজ ডার্ক হয় না, এবং উল্টোটাও)
   • Bootstrap-ভিত্তিক স্টাফ পেজের জন্য ডার্ক স্টাইল, লুপ ছাড়া কাজ করে
   API: MCTheme.get() / set('light'|'dark'|'auto') / cycle() / resolved() */
(function () {
  'use strict';
  if (window.MCTheme) return;
  var K = 'mc_theme_mode', H = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lw(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }

  function mode() {
    var m = ls(K); if (m === 'light' || m === 'dark' || m === 'auto') return m;
    /* পুরনো পছন্দ থেকে একবার মাইগ্রেট */
    var n = 'auto';
    if (ls('darkMode') === 'enabled') n = 'dark';
    else if (ls('mc_home_theme') === 'dark' || ls('mc_home_theme') === 'light') n = ls('mc_home_theme');
    else if (ls('mc_theme') === 'dark') n = 'dark';
    lw(K, n); try { localStorage.removeItem('darkMode'); } catch (e) { }
    return n;
  }
  function resolved() { var m = mode(); return m === 'auto' ? (mq && mq.matches ? 'dark' : 'light') : m; }
  var LABEL = { light: 'Light (দিন)', dark: 'Dark (রাত)', auto: 'Auto (ডিভাইস অনুযায়ী)' }, ICON = { light: '☀️', dark: '🌙', auto: '🖥️' };

  /* ---------- @media(prefers-color-scheme) নিয়মকে বেছে নেওয়া মোডের সাথে মেলানো ---------- */
  var orig = typeof WeakMap === 'function' ? new WeakMap() : null, FEAT = /\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)/g;
  function walk(rules, dark) {
    if (!rules) return;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.type === 4 && r.media) {
        var o = orig.get(r);
        if (o === undefined) { o = /prefers-color-scheme/.test(r.media.mediaText) ? r.media.mediaText : null; orig.set(r, o); }
        if (o) {
          var wantsDark = /prefers-color-scheme\s*:\s*dark/.test(o), on = wantsDark ? dark : !dark, next = on ? o.replace(FEAT, '(min-width: 0px)') : 'not all';
          if (r.media.mediaText !== next) { try { r.media.mediaText = next; } catch (e) { } }
        }
      }
      if (r.cssRules) walk(r.cssRules, dark);
    }
  }
  function syncMedia() {
    if (!orig) return; var dark = resolved() === 'dark';
    for (var i = 0; i < document.styleSheets.length; i++) { try { walk(document.styleSheets[i].cssRules, dark); } catch (e) { /* অন্য ডোমেইনের CSS */ } }
  }

  /* ---------- ডার্ক স্টাইল (Bootstrap স্টাফ পেজ) ---------- */
  var S = 'html[data-mc=dark] body:has(.main-content)', css = '' +
    S + ':not(:has(#loginForm)){background:#0b1020!important;color:#e8ecfa}' +
    S + ' .card,' + S + ' .glass-card,' + S + ' .modal-content,' + S + ' .dropdown-menu,' + S + ' .list-group-item,' + S + ' .offcanvas,' + S + ' .accordion-item,' + S + ' .popover{background-color:#171e36!important;color:#e8ecfa!important;border-color:#27304f!important}' +
    S + ' .bg-white,' + S + ' .navbar,' + S + ' .bg-body,' + S + ' .bg-body-tertiary{background-color:#171e36!important;color:#e8ecfa!important}' +
    S + ' .bg-light,' + S + ' .table-light,' + S + ' thead.table-light th,' + S + ' .card-header,' + S + ' .card-footer,' + S + ' .modal-header,' + S + ' .modal-footer{background-color:#1d2646!important;color:#e8ecfa!important;border-color:#27304f!important}' +
    S + ' .text-muted,' + S + ' .text-secondary,' + S + ' .form-text,' + S + ' small.text-muted{color:#a3adcb!important}' +
    S + ' .text-dark,' + S + ' .text-body,' + S + ' h1,' + S + ' h2,' + S + ' h3,' + S + ' h4,' + S + ' h5,' + S + ' h6,' + S + ' label,' + S + ' .form-label{color:#e8ecfa}' +
    S + ' .gradient-text{color:transparent}' +
    S + ' .form-control,' + S + ' .form-select,' + S + ' .input-group-text,' + S + ' textarea,' + S + ' .search-input{background-color:#1d2646!important;color:#e8ecfa!important;border-color:#2c3760!important}' +
    S + ' .form-control::placeholder{color:#7f8bb0!important}' +
    S + ' .table{color:#e8ecfa;--bs-table-color:#e8ecfa;--bs-table-bg:transparent;--bs-table-border-color:#27304f;--bs-table-striped-bg:rgba(255,255,255,.04);--bs-table-hover-bg:rgba(255,255,255,.07)}' +
    S + ' .table>:not(caption)>*>*{background-color:transparent;color:inherit;border-color:#27304f}' +
    S + ' .dropdown-item{color:#e8ecfa}' + S + ' .dropdown-item:hover,' + S + ' .nav-link:hover{background-color:rgba(102,126,234,.2)}' +
    S + ' .nav-tabs{border-color:#27304f}' + S + ' .nav-tabs .nav-link.active{background:#171e36;color:#e8ecfa;border-color:#27304f #27304f #171e36}' +
    S + ' .btn-light,' + S + ' .btn-outline-secondary{background:#1d2646;color:#e8ecfa;border-color:#2c3760}' +
    S + ' .btn-close{filter:invert(1) grayscale(1) brightness(2)}' +
    S + ' hr{border-color:#27304f;opacity:1}' + S + ' .border,' + S + ' .border-bottom,' + S + ' .border-top{border-color:#27304f!important}' +
    S + ' code{color:#c9d3ff}' + S + ' .page-link{background:#1d2646;border-color:#27304f;color:#e8ecfa}' +
    S + ' .search-results-dropdown,' + S + ' .notification-list{background:#171e36;color:#e8ecfa}' +
    S + ' .stat-card,' + S + ' .mcd .pn,' + S + ' .alert-card{background-color:#171e36!important;color:#e8ecfa!important;border-color:#27304f!important}' +
    'html[data-mc=dark] img.mc-keep{filter:none}' +
    /* ফ্লোটিং বাটন */
    '.mcth-fab{position:fixed;left:8px;bottom:46px;z-index:2147482000;width:36px;height:36px;border-radius:50%;border:1px solid rgba(120,130,180,.45);background:rgba(255,255,255,.92);color:#16213a;font-size:1.05rem;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.2);display:grid;place-items:center;padding:0}' +
    'html[data-mc=dark] .mcth-fab{background:rgba(23,30,54,.95);color:#e8ecfa}' +
    '.mcth-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:2147483300;background:#16213a;color:#fff;padding:.5rem 1rem;border-radius:999px;font:600 13px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:none;transition:opacity .3s}' +
    '@media(max-width:820px){.mcth-fab{bottom:74px}}';
  var st = document.createElement('style'); st.id = 'mcThemeMode'; st.textContent = css; (document.head || H).appendChild(st);

  /* ---------- প্রয়োগ ---------- */
  var themeMeta = null, themeMetaOrig = null, lastR = null;
  function paintButtons() {
    var m = mode(), r = resolved(), tip = 'থিম: ' + LABEL[m] + ' — বদলাতে ক্লিক করুন';
    [].forEach.call(document.querySelectorAll('[data-mc-theme-btn]'), function (b) { b.textContent = ICON[m]; b.title = tip; b.setAttribute('aria-label', tip); });
    var dm = document.getElementById('darkModeToggle');
    if (dm) { var i = dm.querySelector('i'); if (i) i.className = 'fas fs-5 ' + (m === 'light' ? 'fa-sun' : m === 'dark' ? 'fa-moon' : 'fa-circle-half-stroke'); dm.title = tip; dm.setAttribute('aria-label', tip); }
    var th = document.getElementById('mcTh'); if (th) { th.textContent = ICON[m]; th.title = tip; th.setAttribute('aria-label', tip); }
    [].forEach.call(document.querySelectorAll('select[data-mc-theme-sel]'), function (s) { s.value = m; });
    return r;
  }
  function apply(silent) {
    var m = mode(), r = resolved();
    H.setAttribute('data-mc', r); H.setAttribute('data-theme', r); H.setAttribute('data-bs-theme', r); H.setAttribute('data-mc-mode', m); H.style.colorScheme = r;
    if (document.body) document.body.classList.toggle('dark-mode', r === 'dark');
    if (!themeMeta) { themeMeta = document.querySelector('meta[name=theme-color]'); if (themeMeta) themeMetaOrig = themeMeta.getAttribute('content'); }
    if (themeMeta) themeMeta.setAttribute('content', r === 'dark' ? '#0f1426' : (themeMetaOrig || '#667eea'));
    syncMedia(); paintButtons();
    if (lastR !== r || !silent) { try { window.dispatchEvent(new CustomEvent('mctheme', { detail: { mode: m, resolved: r } })); } catch (e) { } }
    lastR = r;
  }
  function toast(t) { if (!document.body) return; var o = document.querySelector('.mcth-toast'); if (o) o.remove(); var d = document.createElement('div'); d.className = 'mcth-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.style.opacity = 0; }, 1200); setTimeout(function () { d.remove(); }, 1600); }
  function set(m) { if (m !== 'light' && m !== 'dark' && m !== 'auto') return; lw(K, m); apply(); }
  function cycle() { var n = { light: 'dark', dark: 'auto', auto: 'light' }[mode()]; set(n); toast((ICON[n]) + ' থিম: ' + LABEL[n]); return n; }
  window.MCTheme = { get: mode, set: set, cycle: cycle, resolved: resolved, label: LABEL, icon: ICON };

  apply(true);
  if (mq) { var onMq = function () { if (mode() === 'auto') apply(); }; if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq); }
  addEventListener('storage', function (e) { if (e.key === K) apply(); });

  /* বাটনের ক্লিক (পুরনো হ্যান্ডলারের আগে ধরে) */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#darkModeToggle,#mcTh,[data-mc-theme-btn]') : null;
    if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); cycle();
  }, true);
  document.addEventListener('change', function (e) { var s = e.target; if (s && s.matches && s.matches('select[data-mc-theme-sel]')) set(s.value); }, true);

  /* পরে যোগ হওয়া <style>/<link>-ও মোড মানবে */
  var pend = false;
  function later() { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; syncMedia(); }); }
  try {
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) { var m = ms[i]; if (m.target && m.target.nodeName === 'STYLE') { later(); return; } for (var j = 0; j < m.addedNodes.length; j++) { var n = m.addedNodes[j]; if (n.nodeName === 'STYLE') { later(); return; } if (n.nodeName === 'LINK') { n.addEventListener('load', later); } } }
    }).observe(H, { childList: true, subtree: true });
  } catch (e) { }

  function dom() {
    apply(true);
    /* যে পেজে নিজস্ব থিম-বাটন নেই সেখানে ছোট ভাসমান বাটন */
    setTimeout(function () {
      if (document.querySelector('#darkModeToggle,#mcTh,.mcn-bar [data-mc-theme-btn],[data-mc-theme-btn],[aria-label="Toggle theme"]')) return;
      if (document.querySelector('.mcth-fab')) return;
      var f = document.createElement('button'); f.type = 'button'; f.className = 'mcth-fab'; f.setAttribute('data-mc-theme-btn', ''); document.body.appendChild(f); paintButtons();
    }, 700);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dom); else dom();
  addEventListener('load', function () { syncMedia(); });
})();
