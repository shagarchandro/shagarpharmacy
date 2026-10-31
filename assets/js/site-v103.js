/* v103 — Site Studio runtime. Control Center → 🧩 Site Studio-তে সেভ করা `pharmacy_site` পুরো সাইটে (শপ, স্টাফ পেজ, Ops Panel, লগইন) প্রয়োগ করে।
   রঙ-জোড়া/লোগো/ব্র্যান্ড নাম আগের মতোই theme.js (Branding ট্যাব)-এর। এই ফাইল যোগ করে: ফন্ট, সাইজ, কোণ, ঘনত্ব, পেজ/কার্ড/টেক্সট/নেভ রং,
   মেনু লুকানো/নাম বদল, পেজ বন্ধ, সাইটজুড়ে টেক্সট রিপ্লেস, ঘোষণা ব্যানার, ফুটার, ফেভিকন ইমোজি, কাস্টম CSS।
   🛟 জরুরি: যেকোনো URL-এ ?nosite=1 দিলে সব কাস্টমাইজেশন বন্ধ থাকে। Control Center নিজে সবসময় "সেফ মোডে" (শুধু ভিজ্যুয়াল) চলে। */
(function () {
  'use strict';
  var KEY = 'pharmacy_site';
  var FONTS = {
    system: '', serif: 'Georgia,"Noto Serif Bengali","Times New Roman",serif',
    rounded: 'ui-rounded,"Hind Siliguri","Nunito","Segoe UI",system-ui,sans-serif',
    bangla: '"Noto Sans Bengali","Hind Siliguri","Kalpurush","Nirmala UI",system-ui,sans-serif',
    mono: 'ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace'
  };
  var RADIUS = { sharp: 0, soft: 8, round: 16, pill: 24 };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function hex(c) { return /^#[0-9a-fA-F]{6}$/.test(c || '') ? c : ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }
  var path = location.pathname, file = (path.split('/').pop() || 'index.html').replace('.html', '');
  var STAFF = 'dashboard medicines customers sales purchases suppliers prescriptions reports team closing reorder refunds writeoff register backup'.split(' ');
  var SHOP = 'shop cart checkout order-success orders product-details products wishlist contact faq privacy terms index'.split(' ');
  function scopeOf() {
    if (/\/admin\//.test(path)) return /login/.test(file) ? 'login' : 'ops';
    if (file === 'admin-center') return 'center';
    if (file === 'login' || file === 'register') return 'login';
    if (STAFF.indexOf(file) > -1) return 'staff';
    if (SHOP.indexOf(file) > -1) return 'shop';
    return 'shop';
  }
  var SC = scopeOf();
  function safeCss(s) {
    return String(s || '').slice(0, 20000).replace(/<\/?style[^>]*>/gi, '').replace(/@import[^;]*;?/gi, '')
      .replace(/url\(\s*['"]?\s*(https?:)?\/\/[^)]*\)/gi, 'none').replace(/expression\s*\(/gi, '(').replace(/javascript:/gi, '');
  }
  function sel(s) { return /^[a-zA-Z0-9_\-#.\[\]="':>+~* ,()]+$/.test(s) && s.length < 120 && !/[{};]/.test(s); }
  var styleEl = null, bannerEl = null, obs = null, applied = null, repMap = null, repRules = [], busy = false;

  function build(c, full) {
    var css = '', k;
    var ff = FONTS[c.font || 'system'];
    if (ff) css += 'html,body,button,input,select,textarea{font-family:' + ff + '!important}';
    var fs = +c.fontScale; if (fs >= 80 && fs <= 140 && fs !== 100) css += 'html{font-size:' + fs + '%!important}';
    if (c.radius && RADIUS[c.radius] != null) {
      var r = RADIUS[c.radius];
      css += ':root{--mc-r:' + r + 'px}.card,.glass-card,.cc-card,.btn,.form-control,.form-select,.modal-content,.dropdown-menu,.alert,.list-group,.list-group-item:first-child,input:not([type=checkbox]):not([type=radio]),select,textarea,.prod,.product-card,.offer,dialog{border-radius:' + r + 'px!important}';
    }
    var d = c.density;
    if (d === 'compact') css += '.card-body,.modal-body{padding:.6rem!important}.table>:not(caption)>*>*{padding:.25rem .5rem!important}.btn{padding-top:.25rem!important;padding-bottom:.25rem!important}main,.container{--bs-gutter-y:.5rem}td,th{padding-top:.25rem!important;padding-bottom:.25rem!important}';
    if (d === 'cozy') css += '.card-body,.modal-body{padding:1.5rem!important}.table>:not(caption)>*>*{padding:.8rem .9rem!important}.btn{padding-top:.6rem!important;padding-bottom:.6rem!important}td,th{padding-top:.7rem!important;padding-bottom:.7rem!important}';
    var L = 'html:not([data-mc="dark"])', col = c.colors || {};
    if (hex(col.pageBg)) css += L + ' body,' + L + ' main,' + L + ' .main-content{background:' + col.pageBg + '!important}';
    if (hex(col.cardBg)) css += L + ' .card,' + L + ' .glass-card,' + L + ' .cc-card,' + L + ' .modal-content,' + L + ' .prod,' + L + ' .product-card,' + L + ' .offer{background:' + col.cardBg + '!important}';
    if (hex(col.text)) css += L + ' body,' + L + ' .card,' + L + ' .glass-card,' + L + ' .cc-card,' + L + ' .modal-content,' + L + ' td,' + L + ' th,' + L + ' label{color:' + col.text + '!important}';
    if (hex(col.link)) css += L + ' a:not(.btn):not(.nav-link):not(.dropdown-item){color:' + col.link + '!important}';
    if (hex(col.nav)) css += L + ' .sidebar,' + L + ' .navbar,' + L + ' header.bar,' + L + ' .bar,' + L + ' .mc-nav{background:' + col.nav + '!important}';
    if (c.font === 'serif' || c.font === 'mono') css += '.fa,.fas,.far,.fab,[class*="fa-"]{font-family:"Font Awesome 6 Free","Font Awesome 5 Free"!important}';
    if (full) {
      var off = (c.navHide || []).filter(function (x) { return /^[a-z\-]+\.html$/.test(x); });
      off.forEach(function (x) { css += 'a[href="' + x + '"],a[href$="/' + x + '"]{display:none!important}'; });
      (c.hideSel || []).forEach(function (s) { if (sel(s)) css += s + '{display:none!important}'; });
      if (c.css) css += safeCss(c.css);
    }
    return css;
  }
  function scopeOn(c) { var s = c.scope || {}; return SC === 'center' || s[SC] !== false; }

  /* ---- সাইটজুড়ে টেক্সট বদল ---- */
  function applyText(root) {
    if (!repRules.length || busy) return; busy = true;
    try {
      var w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, null), n, list = [];
      while ((n = w.nextNode())) list.push(n);
      list.forEach(function (n) {
        var p = n.parentNode; if (!p || /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT|OPTION)$/.test(p.nodeName) || (p.isContentEditable)) return;
        var v = n.nodeValue; if (!v || v.length > 600 || (repMap.has(n) && repMap.get(n) === v)) return;
        var o = v; repRules.forEach(function (r) { if (o.indexOf(r[0]) > -1) o = o.split(r[0]).join(r[1]); });
        if (o !== v) { n.nodeValue = o; repMap.set(n, o); }
      });
      document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(function (e) {
        var v = e.getAttribute('placeholder'), o = v; repRules.forEach(function (r) { if (o.indexOf(r[0]) > -1) o = o.split(r[0]).join(r[1]); }); if (o !== v) e.setAttribute('placeholder', o);
      });
    } catch (e) { }
    busy = false;
  }
  function applyNav(c) {
    var lab = c.navLabel || {}, ks = Object.keys(lab); if (!ks.length) return;
    ks.forEach(function (href) {
      document.querySelectorAll('a[href="' + href + '"],a[href$="/' + href + '"]').forEach(function (a) {
        var t = String(lab[href] || '').slice(0, 40); if (!t) return;
        if (a.dataset.mcsite === t) return;
        var w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT), n, last = null;
        while ((n = w.nextNode())) if (n.nodeValue.trim()) last = n;
        if (last) { last.nodeValue = ' ' + t; a.dataset.mcsite = t; if (repMap) repMap.set(last, last.nodeValue); }
      });
    });
  }
  function banner(c) {
    var b = c.banner || {}; if (bannerEl) { bannerEl.remove(); bannerEl = null; }
    if (!b.on || !b.text || SC === 'center') return;
    if (b.until && Date.now() > Date.parse(b.until + 'T23:59:59+06:00')) return;
    var aud = b.audience || 'all'; if (aud === 'staff' && SC !== 'staff' && SC !== 'ops') return; if (aud === 'shop' && SC !== 'shop') return;
    try { if (sessionStorage.getItem('mc_site_bn') === b.text) return; } catch (e) { }
    var map = { info: ['#e8f1ff', '#0b3a7a'], warn: ['#fff4d6', '#6b4a00'], danger: ['#fde2e0', '#7a1410'], ok: ['#dff5e6', '#0d5a2a'] }, cc = map[b.tone] || map.info;
    var el = document.createElement('div'); el.id = 'mcSiteBanner'; el.setAttribute('role', 'status');
    el.style.cssText = 'position:sticky;top:0;z-index:99990;background:' + cc[0] + ';color:' + cc[1] + ';padding:.5rem 2.4rem .5rem 1rem;text-align:center;font:600 .92rem system-ui,sans-serif;border-bottom:1px solid rgba(0,0,0,.12)';
    el.textContent = b.text;
    if (b.link && /^(https?:\/\/|[a-z0-9\-\/]+\.html|#)/i.test(b.link)) { var a = document.createElement('a'); a.href = b.link; a.textContent = ' ' + (b.linkText || 'আরও জানুন') + ' →'; a.style.cssText = 'color:inherit;text-decoration:underline;margin-left:.3rem'; el.append(a); }
    var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'বন্ধ করুন'); x.textContent = '✕'; x.style.cssText = 'position:absolute;right:.6rem;top:50%;transform:translateY(-50%);border:0;background:none;color:inherit;font-size:1rem;cursor:pointer;padding:.2rem .4rem';
    x.onclick = function () { try { sessionStorage.setItem('mc_site_bn', b.text); } catch (e) { } el.remove(); bannerEl = null; };
    el.append(x); (document.body || document.documentElement).insertBefore(el, (document.body || document.documentElement).firstChild); bannerEl = el;
  }
  function footer(c) {
    var old = document.getElementById('mcSiteFoot'); if (old) old.remove();
    if (!c.footer || SC === 'center' || SC === 'ops') return;
    var f = document.createElement('div'); f.id = 'mcSiteFoot'; f.style.cssText = 'text-align:center;padding:.9rem 1rem;font-size:.85rem;opacity:.8;border-top:1px solid rgba(128,128,128,.25);margin-top:1rem';
    f.textContent = String(c.footer).slice(0, 200); document.body.appendChild(f);
  }
  function icon(c) {
    if (!c.favicon || SC === 'center') return; var em = Array.from(String(c.favicon))[0]; if (!em) return;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text x="32" y="50" font-size="48" text-anchor="middle">' + esc(em) + '</text></svg>';
    var l = document.getElementById('mcSiteIcon') || document.createElement('link'); l.id = 'mcSiteIcon'; l.rel = 'icon'; l.href = 'data:image/svg+xml,' + encodeURIComponent(svg); document.head.appendChild(l);
  }
  function title(c) {
    if (SC === 'center') return; var t = document.title || '';
    if (c.titleSuffix && t.indexOf(c.titleSuffix) < 0) document.title = t + ' · ' + String(c.titleSuffix).slice(0, 40);
  }
  /* ---- পেজ বন্ধ (Admin ছাড়া) ---- */
  function pageGate(c) {
    if (SC !== 'staff' || !(c.pageOff || []).length) return;
    if ((c.pageOff || []).indexOf(file + '.html') < 0 || file === 'dashboard') return;
    var u = {}; try { u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || {}; } catch (e) { }
    if (String(u.role).toLowerCase() === 'admin') return;
    try { sessionStorage.setItem('mc_flash', 'এই পেজ অ্যাডমিন সাময়িকভাবে বন্ধ রেখেছেন / This page is turned off by the admin'); } catch (e) { }
    location.replace('dashboard.html');
  }

  function apply(c, opts) {
    opts = opts || {}; c = c || {}; applied = c;
    var visualOnly = SC === 'center';
    var on = opts.force || scopeOn(c);
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'mcSite'; }
    styleEl.textContent = on ? build(c, !visualOnly) : '';
    (document.head || document.documentElement).appendChild(styleEl);
    if (visualOnly || !on) { if (bannerEl) { bannerEl.remove(); bannerEl = null; } return; }
    repMap = repMap || new WeakMap();
    repRules = (c.replace || []).filter(function (r) { return r && typeof r.from === 'string' && r.from.length >= 2 && r.from.length <= 80 && typeof r.to === 'string'; }).slice(0, 60).map(function (r) { return [r.from, r.to.slice(0, 120)]; });
    var run = function () { applyNav(c); applyText(); banner(c); footer(c); icon(c); title(c); };
    if (document.body) run(); else document.addEventListener('DOMContentLoaded', run);
    if (!obs && (repRules.length || Object.keys(c.navLabel || {}).length) && window.MutationObserver) {
      var t = null; obs = new MutationObserver(function () { if (busy) return; clearTimeout(t); t = setTimeout(function () { if (applied) { applyNav(applied); applyText(); } }, 120); });
      var go = function () { obs.observe(document.body, { childList: true, subtree: true, characterData: true }); };
      if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
    }
    pageGate(c);
  }

  window.MCSite = {
    KEY: KEY, FONTS: FONTS, RADIUS: RADIUS, scope: SC,
    get: function () { return rj(KEY, {}); },
    preview: function (c) { apply(c, { force: true }); },
    clear: function () { if (styleEl) styleEl.textContent = ''; if (bannerEl) bannerEl.remove(); }
  };
  if (/[?&]nosite=1\b/.test(location.search)) return;
  try { if (sessionStorage.getItem('mc_nosite') === '1') return; } catch (e) { }
  var cfg = rj(KEY, null); if (cfg && typeof cfg === 'object' && cfg.v) apply(cfg);
  addEventListener('storage', function (e) { if (e.key === KEY) { try { apply(JSON.parse(e.newValue || '{}') || {}); } catch (x) { } } });
})();
