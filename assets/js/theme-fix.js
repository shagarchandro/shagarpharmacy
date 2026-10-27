/* theme-fix.js (v84) — ডার্ক/লাইট মোডে "টেক্সট দেখা যায় না" সমস্যার স্বয়ংক্রিয় সমাধান।
   কেন: অনেক উইজেট নিজের <style>/inline style-এ সাদা ব্যাকগ্রাউন্ড বা গাঢ় টেক্সট ধরে রেখেছিল; ডার্কে টেক্সট হালকা হলেও সাদা বক্সে মিশে যেত।
   কী করে: পেজ আঁকার পর (এবং থিম বদলালে / নতুন অংশ এলে) এলিমেন্টগুলো পরীক্ষা করে —
     ১) ডার্কে নিরপেক্ষ সাদা/হালকা ব্যাকগ্রাউন্ড → data-mcdk (গাঢ় ব্যাকগ্রাউন্ড)
     ২) টেক্সট ও ব্যাকগ্রাউন্ডের কনট্রাস্ট কম হলে → data-mcfg (হালকা/গাঢ় টেক্সট, যেটা পড়া যায়)
   রঙিন ব্যাজ/বাটন/গ্র্যাডিয়েন্টে হাত দেয় না। বন্ধ করতে: localStorage mc_theme_fix=off */
(function () {
  'use strict';
  var H = document.documentElement;
  try { if (localStorage.getItem('mc_theme_fix') === 'off') return; } catch (e) { }
  var css = 'html[data-mc=dark] [data-mcdk]{background-color:#171e36!important;background-image:none!important;transition:none!important;border-color:#27304f!important}' +
    'html.mcfx-nt,html.mcfx-nt *{transition:none!important;animation-play-state:paused!important}[data-mcfg=l]{color:#e8ecfa!important}[data-mcfg=d]{color:#16213a!important}' +
    'html[data-mc=dark] [data-mcdk] [data-mcfg=d]{color:#16213a!important}';
  var st = document.createElement('style'); st.id = 'mcThemeFix'; st.textContent = css; (document.head || H).appendChild(st);

  function parse(c) { var m = c && c.match(/[\d.]+/g); if (!m || m.length < 3) return null; return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 }; }
  function lin(v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }
  function L(c) { return .2126 * lin(c.r) + .7152 * lin(c.g) + .0722 * lin(c.b); }
  function mix(f, b) { return { r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a) }; }
  function ratio(a, b) { var x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  var SKIP = /^(SCRIPT|STYLE|SVG|PATH|OPTION|IMG|CANVAS|HTML|HEAD|BODY|INPUT|SELECT|TEXTAREA|BR|HR|NOSCRIPT|IFRAME)$/i;

  /* এলিমেন্টের কার্যকর ব্যাকগ্রাউন্ড; গ্র্যাডিয়েন্ট/ছবি পেলে null (অজানা) */
  function effBg(el) {
    var layers = [], e = el, base0 = null;
    while (e && e.nodeType === 1) {
      if (e.hasAttribute('data-mcdk')) { base0 = { r: 23, g: 30, b: 54 }; break; }
      var cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        var gm = !/url\(/.test(cs.backgroundImage) && cs.backgroundImage.match(/rgba?\([^)]+\)/g), g0 = gm && parse(gm[0]);
        if (g0 && g0.a >= .9) { var g1 = parse(gm[gm.length - 1]); return { r: (g0.r + g1.r) / 2, g: (g0.g + g1.g) / 2, b: (g0.b + g1.b) / 2 }; }
        return null;
      }
      var c = parse(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
      e = e.parentElement;
    }
    var base = { r: 255, g: 255, b: 255 };
    if (base0) base = base0;
    else if (layers.length && layers[layers.length - 1].a >= 1) base = layers.pop();
    else { var bb = parse(getComputedStyle(document.body).backgroundColor); if (bb && bb.a > 0) base = { r: bb.r, g: bb.g, b: bb.b }; else if (H.getAttribute('data-mc') === 'dark') base = { r: 11, g: 16, b: 32 }; }
    for (var i = layers.length - 1; i >= 0; i--) base = mix(layers[i], base);
    return base;
  }

  function hasOwnText(el) { for (var i = 0; i < el.childNodes.length; i++) { var n = el.childNodes[i]; if (n.nodeType === 3 && n.textContent.trim()) return true; } return false; }
  function visible(el) { var r = el.getBoundingClientRect(); return r.width >= 2 && r.height >= 2; }

  var busy = false;
  function run() {
    if (busy || !document.body) return; busy = true;
    try {
      var dark = H.getAttribute('data-mc') === 'dark';
      H.classList.add('mcfx-nt');
      var olds = document.querySelectorAll('[data-mcdk],[data-mcfg]');
      for (var i = 0; i < olds.length; i++) { olds[i].removeAttribute('data-mcdk'); olds[i].removeAttribute('data-mcfg'); }
      var all = document.body.querySelectorAll('*'), n = Math.min(all.length, 6000), el, cs, k;
      if (dark) {
        for (k = 0; k < n; k++) {
          el = all[k]; if (SKIP.test(el.tagName) || el.classList.contains('mc-keep') || el.closest('.mc-keep')) continue;
          cs = getComputedStyle(el); var c = parse(cs.backgroundColor);
          if (cs.backgroundImage && cs.backgroundImage !== 'none') {
            var gc = !/url\(/.test(cs.backgroundImage) && cs.backgroundImage.match(/rgba?\([^)]+\)/g), ok = !!gc;
            if (gc) for (var q = 0; q < gc.length; q++) { var g = parse(gc[q]); if (!g || g.a < .9 || Math.max(g.r, g.g, g.b) - Math.min(g.r, g.g, g.b) > 28 || L(g) < .72) { ok = false; break; } }
            if (ok && visible(el)) el.setAttribute('data-mcdk', '');
            continue;
          }
          if (!c || c.a < .9) continue;
          if (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) > 28 || L(c) < .72) continue;
          if (cs.display === 'none' || !visible(el)) continue;
          if (!hasOwnText(el) && el.querySelector(':scope > img,:scope > canvas,:scope > svg') && !el.textContent.trim()) continue; /* QR/বারকোডের সাদা বক্স */
          el.setAttribute('data-mcdk', '');
        }
      }
      for (k = 0; k < n; k++) {
        el = all[k]; if (SKIP.test(el.tagName) || el.closest('.mc-keep')) continue;
        if (!hasOwnText(el)) continue;
        cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || !visible(el)) continue;
        if (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') continue;
        var fg = parse(cs.color); if (!fg || fg.a < .3) continue;
        var bg = effBg(el); if (!bg) continue;
        var f = mix(fg, bg), cr = ratio(f, bg);
        var white = fg.r > 240 && fg.g > 240 && fg.b > 240;
        if (cr >= (white ? 2.2 : 3.5)) continue;
        el.setAttribute('data-mcfg', L(bg) < .4 ? 'l' : 'd');
      }
    } catch (e) { try { console.warn('theme-fix', e); } catch (_) { } }
    try { getComputedStyle(H).color; } catch (e) { }
    setTimeout(function () { H.classList.remove('mcfx-nt'); }, 60);
    busy = false;
  }
  var t = 0, last = 0;
  function soon(ms, force) { if (t) { if (!force) return; clearTimeout(t); t = 0; } var wait = ms == null ? 300 : ms, since = Date.now() - last; if (since < 700 && ms == null) wait = 700 - since + 100; t = setTimeout(function () { t = 0; last = Date.now(); run(); }, wait); }
  window.MCThemeFix = { run: run };
  window.addEventListener('mctheme', function () { soon(60, true); });
  addEventListener('load', function () { soon(500); });
  addEventListener('storage', function (e) { if (e.key === 'mc_theme_mode') soon(120, true); });
  function start() {
    soon(700);
    try {
      new MutationObserver(function () { soon(300); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open'] });
    } catch (e) { }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
