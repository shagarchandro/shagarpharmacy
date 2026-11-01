/* v103/v106/v108 — Site Studio runtime (v108: শপ হিরো ছবি, হোম সেকশনের ক্রম, প্রোডাক্ট গ্রিড, লোগো সাইজ/শেপ, বাটন স্টাইল, আলাদা হেডিং ফন্ট, ফ্লোটিং WhatsApp/কল বাটন, ফুটার লিংক ও সোশ্যাল) (v106: লুক ফাইন-টিউন, নিজস্ব ফন্ট ফাইল, স্কোপ-ভিত্তিক CSS, লগইন পেজ, উৎসব-সূচি, ডিফল্ট কালার মোড, লাইভ iframe প্রিভিউ). Control Center → 🧩 Site Studio-তে সেভ করা `pharmacy_site` পুরো সাইটে (শপ, স্টাফ পেজ, Ops Panel, লগইন) প্রয়োগ করে।
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
  var PREVIEW = false, styleEl = null, bannerEl = null, obs = null, applied = null, repMap = null, repRules = [], busy = false;

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
    var lk = c.look || {};
    if (lk.shadow === 'none') css += '.card,.glass-card,.cc-card,.modal-content,.btn,.dropdown-menu,.prod,.product-card{box-shadow:none!important}';
    if (lk.shadow === 'strong') css += '.card,.glass-card,.cc-card,.prod,.product-card{box-shadow:0 8px 28px rgba(0,0,0,.18)!important}';
    if (lk.border === 'off') css += '.card,.glass-card,.cc-card,.prod,.product-card{border-color:transparent!important}';
    if (lk.border === 'bold') css += '.card,.glass-card,.cc-card,.prod,.product-card{border:2px solid rgba(128,128,128,.45)!important}';
    var W = { narrow: '960px', wide: '1500px', full: '100%' }[lk.width]; if (W) css += '.container,.container-lg,.container-xl,.container-xxl,.cc-wrap,main,.mcfoot .fgrid,.mcfoot .fbar{max-width:' + W + '!important}';
    var lh = +lk.lineHeight; if (lh >= 1.2 && lh <= 2.2) css += 'body{line-height:' + lh + '!important}';
    if (lk.links) css += 'a:not(.btn):not(.nav-link):not(.dropdown-item):not(.navbar-brand){text-decoration:underline!important;text-underline-offset:2px}';
    if (lk.calm) css += '*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}';
    if (lk.sticky === false) css += '.sticky-top,.fixed-top,header.bar,.navbar.sticky-top{position:static!important}';
    var ffile = c.fontFile;
    if (c.font === 'custom' && ffile && /^data:(font\/|application\/(font|x-font|octet-stream))/.test(ffile.data || '') && ffile.data.length < 480000) {
      css = '@font-face{font-family:"MCSiteFont";src:url("' + ffile.data.replace(/"/g, '') + '");font-display:swap}' + css + 'html,body,button,input,select,textarea{font-family:"MCSiteFont",system-ui,sans-serif!important}.fa,.fas,.far,.fab,[class*="fa-"]{font-family:"Font Awesome 6 Free","Font Awesome 5 Free"!important}';
    }
    var sch = activeSchedule(c);
    if (full && sch && sch.c1 && hex(sch.c1)) {
      var a1 = sch.c1, a2 = hex(sch.c2) || a1;
      css += ':root:root{--pri:' + a1 + ';--pri2:' + a2 + '}.btn-gradient,.glass-card .btn-gradient,.animated-bg,.bg-gradient,.page-link.active,.progress-bar{background:linear-gradient(135deg,' + a1 + ',' + a2 + ')!important;color:#fff}.btn-primary{background:' + a1 + '!important;border-color:' + a1 + '!important}.text-primary{color:' + a1 + '!important}.bar{background:linear-gradient(90deg,' + a2 + ',' + a1 + ')!important}';
    }
    var bt = c.btn || {};
    if (bt.shape === 'pill') css += '.btn,.btn2,button.btn,.btn-primary,.btn-outline-primary{border-radius:999px!important}';
    if (bt.shape === 'square') css += '.btn,.btn2,button.btn,.btn-primary,.btn-outline-primary{border-radius:0!important}';
    if (bt.lift) css += '.btn,.btn2,.btn-primary{transition:transform .15s,box-shadow .15s}.btn:hover,.btn2:hover,.btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.18)}';
    var hf = c.headFont; if (hf && hf !== 'same' && FONTS[hf]) css += 'h1,h2,h3,h4,h5,h6,.display-5,.display-6,.card h3{font-family:' + FONTS[hf] + '!important}';
    if (hf === 'custom' && c.fontFile && c.fontFile.data) css += 'h1,h2,h3,h4,h5,h6,.display-5,.display-6{font-family:"MCSiteFont",system-ui,sans-serif!important}';
    var br = c.brand || {};
    if (+br.logoSize >= 20 && +br.logoSize <= 90) css += '.brand img.mc-logo,.logo-text img.mc-logo,.navbar-brand img.mc-logo,.sidebar-header img.mc-logo,.mc-brand img.mc-logo,img.mc-logo{height:' + (+br.logoSize) + 'px!important;width:auto!important;max-width:none!important}';
    if (br.shape === 'round') css += 'img.mc-logo{border-radius:12px!important}';
    if (br.shape === 'circle') css += 'img.mc-logo{border-radius:50%!important;aspect-ratio:1/1;object-fit:cover;width:' + (+br.logoSize || 36) + 'px!important}';
    if (br.textOff) css += '.brand:has(img.mc-logo),.navbar-brand:has(img.mc-logo),.logo-text:has(img.mc-logo),.mc-brand:has(img.mc-logo){font-size:0!important}';
    var sh = c.shop || {};
    if (full && (SC === 'shop' || SC === 'center')) {
      var cols = +sh.cols; if (cols >= 2 && cols <= 6) css += '@media(min-width:900px){#app .grid:not(.offers){grid-template-columns:repeat(' + cols + ',minmax(0,1fr))!important}}';
      var ih = +sh.imgH; if (ih >= 80 && ih <= 280) css += '#app .grid:not(.offers) .card>img{width:100%!important;height:' + ih + 'px!important;object-fit:cover}';
      var hd = sh.hide || {}, G = '#app .grid:not(.offers) .card ';
      if (hd.generic) css += G + 'p.muted{display:none!important}'; if (hd.maker) css += G + 'p:not([class]){display:none!important}';
      if (hd.stock) css += G + 'p.ok,' + G + 'p.bad,' + G + 'p.warn,' + G + 'p.low{display:none!important}'; if (hd.wish) css += G + 'button[aria-label="Wishlist"]{display:none!important}'; if (hd.compare) css += G + '.v99cb{display:none!important}';
      if (/^data:image\/(png|jpe?g|webp)/.test(sh.heroImg || '') && sh.heroImg.length < 520000) {
        var dm = sh.heroDim != null ? +sh.heroDim : .35, hh = +sh.heroH;
        css += '.hero{background-image:linear-gradient(rgba(0,0,0,' + dm + '),rgba(0,0,0,' + dm + ')),url("' + sh.heroImg.replace(/"/g, '') + '")!important;background-size:cover!important;background-position:center!important;' + (hh >= 160 && hh <= 700 ? 'min-height:' + hh + 'px;display:flex;flex-direction:column;justify-content:center;' : '') + '}.hero h1,.hero p{color:#fff!important;text-shadow:0 1px 8px rgba(0,0,0,.5)}';
      }
      if ((sh.order || []).length) { css += '#app>section{display:flex!important;flex-direction:column}'; sh.order.forEach(function (k, i) { if (/^[a-z]+$/.test(k)) css += '#app>section>[data-mcsec="' + k + '"]{order:' + (i + 1) + '}'; }); }
    }
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
      var cs = (c.cssScope || {})[SC]; if (cs) css += safeCss(cs);
      var lg = c.login || {};
      if (SC === 'login' && /^data:image\/(png|jpe?g|webp|gif|svg\+xml)/.test(lg.bg || '') && lg.bg.length < 520000) css += 'body{background-image:linear-gradient(rgba(0,0,0,' + (lg.dim != null ? +lg.dim : .25) + '),rgba(0,0,0,' + (lg.dim != null ? +lg.dim : .25) + ')),url("' + lg.bg.replace(/"/g, '') + '")!important;background-size:cover!important;background-position:center!important;background-attachment:fixed!important}';
    }
    return css;
  }
  function today() { return new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10); }
  function activeSchedule(c) {
    var t = today(), L = c.schedule || [];
    for (var i = 0; i < L.length; i++) { var x = L[i]; if (x && x.on !== false && x.from && x.to && x.from <= t && t <= x.to) return x; }
    return null;
  }
  function loginText(c) {
    var lg = c.login || {}; if (SC !== 'login') return;
    var h = document.querySelector('h2.display-5'), p = document.querySelector('p.lead');
    if (h && lg.title) h.textContent = String(lg.title).slice(0, 60); if (p && lg.sub) p.textContent = String(lg.sub).slice(0, 200);
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
    var sc = activeSchedule(c); if (sc && sc.text) b = { on: true, text: sc.text, tone: sc.tone || 'ok', audience: sc.audience || 'all', link: sc.link, linkText: sc.linkText };
    if (!b.on || !b.text || SC === 'center') return;
    if (b.until && Date.now() > Date.parse(b.until + 'T23:59:59+06:00')) return;
    var aud = b.audience || 'all'; if (aud === 'staff' && SC !== 'staff' && SC !== 'ops') return; if (aud === 'shop' && SC !== 'shop') return;
    try { if (!PREVIEW && sessionStorage.getItem('mc_site_bn') === b.text) return; } catch (e) { }
    var map = { info: ['#e8f1ff', '#0b3a7a'], warn: ['#fff4d6', '#6b4a00'], danger: ['#fde2e0', '#7a1410'], ok: ['#dff5e6', '#0d5a2a'] }, cc = map[b.tone] || map.info;
    var el = document.createElement('div'); el.id = 'mcSiteBanner'; el.setAttribute('role', 'status');
    el.style.cssText = 'position:sticky;top:0;z-index:99990;background:' + cc[0] + ';color:' + cc[1] + ';padding:.5rem 2.4rem .5rem 1rem;text-align:center;font:600 .92rem system-ui,sans-serif;border-bottom:1px solid rgba(0,0,0,.12)';
    el.textContent = b.text;
    if (b.link && /^(https?:\/\/|[a-z0-9\-\/]+\.html|#)/i.test(b.link)) { var a = document.createElement('a'); a.href = b.link; a.textContent = ' ' + (b.linkText || 'আরও জানুন') + ' →'; a.style.cssText = 'color:inherit;text-decoration:underline;margin-left:.3rem'; el.append(a); }
    var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'বন্ধ করুন'); x.textContent = '✕'; x.style.cssText = 'position:absolute;right:.6rem;top:50%;transform:translateY(-50%);border:0;background:none;color:inherit;font-size:1rem;cursor:pointer;padding:.2rem .4rem';
    x.onclick = function () { try { sessionStorage.setItem('mc_site_bn', b.text); } catch (e) { } el.remove(); bannerEl = null; };
    el.append(x); (document.body || document.documentElement).insertBefore(el, (document.body || document.documentElement).firstChild); bannerEl = el;
  }
  function okUrl(u) { u = String(u || '').trim(); return /^(https?:\/\/|mailto:|tel:|[A-Za-z0-9_\-\/]+\.html(#.*)?$|#)/.test(u) ? u : ''; }
  function footer(c) {
    var old = document.getElementById('mcSiteFoot'); if (old) old.remove();
    if (SC === 'center' || SC === 'ops') return;
    var L = (c.links || []).filter(function (x) { return x && x.label && okUrl(x.url); }).slice(0, 8), so = c.social || {}, SN = { facebook: 'Facebook', youtube: 'YouTube', instagram: 'Instagram', x: 'X', tiktok: 'TikTok', linkedin: 'LinkedIn' };
    var sk = Object.keys(SN).filter(function (k) { return /^https?:\/\//.test(so[k] || ''); });
    if (!c.footer && !L.length && !sk.length) return;
    var f = document.createElement('div'); f.id = 'mcSiteFoot'; f.style.cssText = 'text-align:center;padding:.9rem 1rem;font-size:.88rem;border-top:1px solid rgba(128,128,128,.25);margin-top:1rem;display:grid;gap:.45rem';
    function row(items) { var r = document.createElement('div'); r.style.cssText = 'display:flex;gap:.9rem;justify-content:center;flex-wrap:wrap'; items.forEach(function (a) { r.append(a); }); return r; }
    function link(label, url, ext) { var a = document.createElement('a'); a.textContent = label; a.href = url; if (ext || /^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } a.style.cssText = 'color:inherit;text-decoration:underline;opacity:.9'; return a; }
    if (L.length) f.append(row(L.map(function (x) { return link(String(x.label).slice(0, 30), okUrl(x.url)); })));
    if (sk.length) f.append(row(sk.map(function (k) { return link(SN[k], so[k], true); })));
    if (c.footer) { var t = document.createElement('div'); t.style.opacity = '.8'; t.textContent = String(c.footer).slice(0, 200); f.append(t); }
    document.body.appendChild(f);
  }
  function floats(c) {
    ['mcSiteWA', 'mcSiteCall'].forEach(function (id) { var e = document.getElementById(id); if (e) e.remove(); });
    var fl = c.float || {}; if (SC !== 'shop' || !fl.on) return;
    var side = fl.side === 'right' ? 'right' : 'left', pos = 'position:fixed;bottom:' + (fl.bottom === 'high' ? '84px' : '18px') + ';' + side + ':16px;z-index:99980;';
    function btn(id, bg, label, href, off) { var a = document.createElement('a'); a.id = id; a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', label); a.textContent = label; a.style.cssText = pos.replace(side + ':16px', side + ':' + (16 + off) + 'px') + 'background:' + bg + ';color:#fff;padding:.7rem 1rem;border-radius:999px;font:700 .95rem system-ui,sans-serif;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.28);display:inline-flex;gap:.4rem;align-items:center'; document.body.appendChild(a); }
    var wa = String(fl.wa || '').replace(/[^0-9]/g, ''), call = String(fl.call || '').replace(/[^0-9+]/g, ''), off = 0;
    if (wa.length >= 8 && wa.length <= 15) { btn('mcSiteWA', '#1fa855', '💬 ' + String(fl.waLabel || 'WhatsApp').slice(0, 20), 'https://wa.me/' + wa + (fl.msg ? '?text=' + encodeURIComponent(String(fl.msg).slice(0, 160)) : ''), off); off += 130; }
    if (call.replace(/\D/g, '').length >= 6) btn('mcSiteCall', '#0b66d0', '📞 ' + String(fl.callLabel || 'কল করুন').slice(0, 20), 'tel:' + call, off);
  }
  function tagSections() {
    if (SC !== 'shop' && SC !== 'center') return; var s = document.querySelector('#app>section'); if (!s || !s.querySelector(':scope>.hero')) return;
    [].slice.call(s.children).forEach(function (e) {
      var k = e.classList.contains('hero') ? 'hero' : e.classList.contains('offers') ? 'offers' : e.classList.contains('s92c') ? 'strip' : e.classList.contains('trust') ? 'trust' : e.classList.contains('mc-free') || e.classList.contains('filters') || e.classList.contains('center') || (e.classList.contains('grid')) ? 'catalog' : e.classList.contains('row') ? 'cats' : '';
      if (k && e.getAttribute('data-mcsec') !== k) e.setAttribute('data-mcsec', k);
    });
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

  function applyMode(c) {
    if (!c.mode || c.mode === 'keep' || !c.modeStamp || SC === 'center') return;
    try { if (localStorage.getItem('mc_site_modeapplied') === String(c.modeStamp)) return; } catch (e) { return; }
    var go = function () { if (window.MCTheme && MCTheme.set) { try { MCTheme.set(c.mode); localStorage.setItem('mc_site_modeapplied', String(c.modeStamp)); } catch (e) { } } };
    if (document.readyState === 'complete') go(); else addEventListener('load', go);
  }
  function apply(c, opts) {
    opts = opts || {}; c = c || {}; applied = c; PREVIEW = !!opts.preview;
    var visualOnly = SC === 'center';
    var on = opts.force || scopeOn(c);
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'mcSite'; }
    styleEl.textContent = on ? build(c, !visualOnly) : '';
    (document.head || document.documentElement).appendChild(styleEl);
    if (visualOnly || !on) { if (bannerEl) { bannerEl.remove(); bannerEl = null; } return; }
    repMap = repMap || new WeakMap();
    repRules = (c.replace || []).filter(function (r) { return r && typeof r.from === 'string' && r.from.length >= 2 && r.from.length <= 80 && typeof r.to === 'string'; }).slice(0, 60).map(function (r) { return [r.from, r.to.slice(0, 120)]; });
    var run = function () { applyNav(c); applyText(); banner(c); footer(c); floats(c); tagSections(); icon(c); title(c); loginText(c); if (!PREVIEW) applyMode(c); };
    if (document.body) run(); else document.addEventListener('DOMContentLoaded', run);
    if (!obs && (repRules.length || Object.keys(c.navLabel || {}).length || ((c.shop || {}).order || []).length) && window.MutationObserver) {
      var t = null; obs = new MutationObserver(function () { if (busy) return; clearTimeout(t); t = setTimeout(function () { if (applied) { applyNav(applied); applyText(); tagSections(); } }, 120); });
      var go = function () { obs.observe(document.body, { childList: true, subtree: true, characterData: true }); };
      if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
    }
    if (!PREVIEW) pageGate(c);
  }

  window.MCSite = {
    KEY: KEY, FONTS: FONTS, RADIUS: RADIUS, scope: SC,
    get: function () { return rj(KEY, {}); },
    preview: function (c) { apply(c, { force: true }); },
    clear: function () { if (styleEl) styleEl.textContent = ''; if (bannerEl) bannerEl.remove(); }
  };
  /* Control Center-এর লাইভ প্রিভিউ: শুধু একই-অরিজিনের admin-center পেজের iframe থেকে নেওয়া হয় (বাইরের সাইট window.name দিয়ে ঢোকাতে পারবে না) */
  if (window.name && window.name.indexOf('mcprev:') === 0 && window.parent !== window) {
    var okp = false; try { okp = /admin-center\.html$/.test(window.parent.location.pathname); } catch (e) { okp = false; }
    if (okp) { try { var pc = JSON.parse(window.name.slice(7)); apply(pc, { preview: true }); } catch (e) { } return; }
  }
  if (/[?&]nosite=1\b/.test(location.search)) return;
  try { if (sessionStorage.getItem('mc_nosite') === '1') return; } catch (e) { }
  var cfg = rj(KEY, null); if (cfg && typeof cfg === 'object' && cfg.v) apply(cfg);
  addEventListener('storage', function (e) { if (e.key === KEY) { try { apply(JSON.parse(e.newValue || '{}') || {}); } catch (x) { } } });
})();
