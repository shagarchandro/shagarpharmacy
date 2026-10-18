/* MediCare theme: brand name, tagline, colours and logo chosen in the Control Center (pharmacy_theme).
   Safe on every page: shop, ops panel, staff pages, login, landing. */
(function () {
  'use strict';
  var T; try { T = JSON.parse(localStorage.getItem('pharmacy_theme') || 'null'); } catch (e) { T = null; }
  if (!T) return;
  var ok = function (c) { return /^#[0-9a-fA-F]{6}$/.test(c || ''); };
  var c1 = ok(T.c1) ? T.c1 : null, c2 = ok(T.c2) ? T.c2 : c1;
  var css = '';
  if (c1) {
    css += ':root:root,[data-theme]:root{--pri:' + c1 + ';--pri2:' + c2 + '}';
    css += '.btn-gradient,.glass-card .btn-gradient,.animated-bg,.bg-gradient,.page-link.active,.progress-bar{background:linear-gradient(135deg,' + c1 + ',' + c2 + ')!important;color:#fff}';
    css += '.gradient-text{background:linear-gradient(135deg,' + c1 + ',' + c2 + ')!important;-webkit-background-clip:text!important;background-clip:text!important;color:transparent!important}';
    css += '.btn-primary{background:' + c1 + '!important;border-color:' + c1 + '!important}.text-primary{color:' + c1 + '!important}';
    css += 'body.loginpage{background:linear-gradient(135deg,' + c2 + ',' + c1 + ')!important}.bar{background:linear-gradient(90deg,' + c2 + ',' + c1 + ')!important}';
    css += '.sidebar-header{background:linear-gradient(135deg,' + c1 + '33,' + c2 + '33)}';
  }
  var s = document.createElement('style'); s.id = 'mcTheme'; s.textContent = css; (document.head || document.documentElement).appendChild(s);
  addEventListener('DOMContentLoaded', function () { (document.head || document.documentElement).appendChild(s); });
  if (T.brand) {
    var re = /MediCare( Pharmacy)?/g;
    var fixTitle = function () { if (document.title && /MediCare/.test(document.title)) document.title = document.title.replace(re, T.brand); }; fixTitle(); addEventListener('DOMContentLoaded', fixTitle); addEventListener('load', fixTitle);
    var apply = function () {
      document.querySelectorAll('.brand,.logo-text,.navbar-brand,.sidebar-header h4,.sidebar-header h5,.mc-brand').forEach(function (e) {
        var w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), n;
        while ((n = w.nextNode())) { if (/MediCare/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(re, T.brand); }
        if (T.logo && /^data:image\//.test(T.logo) && !e.querySelector('img.mc-logo')) {
          var im = document.createElement('img'); im.className = 'mc-logo'; im.alt = ''; im.src = T.logo; im.style.cssText = 'height:1.6em;width:auto;max-width:3em;border-radius:6px;vertical-align:middle;margin-right:.4rem;object-fit:contain'; e.insertBefore(im, e.firstChild);
        }
      });
      if (T.tagline) document.querySelectorAll('.mc-tagline,.sidebar-header small').forEach(function (e) { e.textContent = T.tagline; });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
    addEventListener('load', apply);
    // shop/ops re-render the bar: reapply on hash changes
    addEventListener('hashchange', function () { setTimeout(apply, 0); });
  }
  if (T.favicon !== false && T.logo && /^data:image\//.test(T.logo)) {
    var l = document.createElement('link'); l.rel = 'icon'; l.href = T.logo; (document.head || document.documentElement).appendChild(l);
  }
})();
