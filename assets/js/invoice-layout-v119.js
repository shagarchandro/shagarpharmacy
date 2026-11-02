/* v119 — ইনভয়েসের সাইজ নিজের মতো ছোট-বড় করা (shared; sales / purchases / refunds / shop / dashboard — invoice-v117/v118 এর আগে)
   • 📐 সাইজ ডায়ালগ: কাগজ (A4 · A5 · A6 · Letter · 80mm · 58mm · কাস্টম মাপ), আড়াআড়ি/লম্বালম্বি, জুম ৫০–২০০%, লেখার মাপ ৭০–১৫০%, মার্জিন — লাইভ প্রিভিউ সহ
   • একই সেটিং প্রিন্ট, PDF, ছবি (PNG), HTML — সব জায়গায় (বিক্রি / ক্রয় / ক্রেডিট নোট / শপ অর্ডার)
   • প্রতি ডিভাইসে মনে রাখে (`mc_inv_layout`); Admin চাইলে সবার ডিফল্ট ঠিক করতে পারেন (`pharmacy_settings.invLayout`); "↺ ডিফল্টে ফিরুন" দিয়ে নিজের পছন্দ মুছে ফেলা যায়
   • রসিদ-প্রিন্টারের জন্য: ছোট কাগজ বাছলে লেখার মাপ নিজে থেকে কমে (পরে বদলানো যায়) */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function user() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || {}; } catch (e) { return {}; } }
  var PAPERS = { a4: ['A4', 210, 297], a5: ['A5', 148, 210], a6: ['A6', 105, 148], letter: ['Letter', 216, 279], t80: ['80mm রসিদ', 80, 0], t58: ['58mm রসিদ', 58, 0], custom: ['কাস্টম মাপ', 0, 0] };
  var AUTO = { a4: [100, 100, 10], a5: [100, 100, 8], a6: [100, 90, 6], letter: [100, 100, 10], t80: [100, 85, 3], t58: [100, 75, 2] }; /* জুম, লেখা, মার্জিন */
  var MARGINS = [0, 3, 6, 10, 15, 20];
  var KEY = 'mc_inv_layout';
  function clamp(v, a, b, d) { v = parseFloat(v); return isNaN(v) ? d : Math.min(b, Math.max(a, v)); }

  function raw(over) {
    var S = rj('pharmacy_settings', {}), dev = rj(KEY, null), base = S.invLayout || null;
    /* আগের (v96) কাগজ-পছন্দ থেকে মাইগ্রেশন */
    var legacy = ''; try { legacy = localStorage.getItem('mc_inv_paper') || ''; } catch (e) { }
    var r = dev || base || { paper: PAPERS[legacy] ? legacy : (PAPERS[S.invPaper] ? S.invPaper : 'a4') };
    if (over) { var m = {}; for (var k in r) m[k] = r[k]; for (var k2 in over) m[k2] = over[k2]; r = m; }
    return { r: r, src: over ? 'preset' : (dev ? 'device' : (base ? 'admin' : 'built-in')) };
  }
  function get(over) {
    var o = raw(over), r = o.r, p = PAPERS[r.paper] ? r.paper : 'a4', A = AUTO[p] || [100, 100, 10];
    var L = { paper: p, orient: r.orient === 'l' ? 'l' : 'p', zoom: clamp(r.zoom, 50, 200, A[0]), font: clamp(r.font, 70, 150, A[1]), margin: MARGINS.indexOf(+r.margin) > -1 ? +r.margin : (r.margin != null ? clamp(r.margin, 0, 30, A[2]) : A[2]), w: clamp(r.w, 40, 400, 100), h: clamp(r.h, 0, 600, 0), src: o.src };
    var w, h, pp = PAPERS[p];
    if (p === 'custom') { w = L.w; h = L.h; } else { w = pp[1]; h = pp[2]; if (h && L.orient === 'l') { var t = w; w = h; h = t; } }
    L.thermal = (p === 't80' || p === 't58'); L.auto = !h; L.pw = w; L.ph = h; L.cw = Math.max(20, w - 2 * L.margin);
    return L;
  }
  function set(patch, toAdmin) {
    var cur = get(), n = { paper: cur.paper, orient: cur.orient, zoom: cur.zoom, font: cur.font, margin: cur.margin, w: cur.w, h: cur.h };
    for (var k in patch) n[k] = patch[k];
    try { if (toAdmin) { var S = rj('pharmacy_settings', {}); S.invLayout = n; localStorage.setItem('pharmacy_settings', JSON.stringify(S)); localStorage.removeItem(KEY); } else { localStorage.setItem(KEY, JSON.stringify(n)); localStorage.setItem('mc_inv_paper', /^(a4|a5|t80)$/.test(n.paper) ? n.paper : 'a4'); } } catch (e) { }
  }
  function reset() { try { localStorage.removeItem(KEY); localStorage.removeItem('mc_inv_paper'); } catch (e) { } }
  function mm2px(m) { return m * 96 / 25.4; }

  /* ---------- HTML ফাইল / প্রিন্টের জন্য CSS ---------- */
  function docCss(L) {
    L = L || get(); var
      _x = 0, sz = L.auto ? L.pw + 'mm ' + (L.thermal ? 297 : 297) + 'mm' : L.pw + 'mm ' + L.ph + 'mm';
    return '@page{size:' + sz + ';margin:' + L.margin + 'mm}@media screen{body{padding:' + L.margin + 'mm}}@media print{body{padding:0!important}}' +
      'body{font-size:' + (14 * L.font / 100) + 'px!important}.inv{max-width:' + (L.cw / (L.zoom / 100)).toFixed(2) + 'mm!important;zoom:' + (L.zoom / 100) + '}';
  }

  /* ---------- PDF / PNG (অফলাইন লাইব্রেরি) ---------- */
  function lib() { return new Promise(function (ok, bad) { if (window.html2pdf) return ok(); var s = document.createElement('script'); s.src = 'assets/vendor/html2pdf/html2pdf.bundle.min.js'; s.onload = function () { ok(); }; s.onerror = function () { bad(new Error('lib')); }; document.head.appendChild(s); }); }
  function save(blob, name) { var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); URL.revokeObjectURL(u); }, 1500); }
  function stageEl(inner, css, L) {
    L = L || get(); var z = L.zoom / 100, d = document.createElement('div'); d.className = 'stg';
    d.setAttribute('style', 'width:' + mm2px(L.cw / z).toFixed(1) + 'px;background:#fff;color:#111;padding:0;margin:0;font-size:' + (14 * L.font / 100) + 'px');
    d.innerHTML = '<style>' + css.replace('body{', '.stg{') + '</style>' + inner; return d;
  }
  /* fmt: 'pdf' | 'png' → Promise<boolean>; asBlob=true হলে ফাইল না নামিয়ে Blob দেয় */
  function render(inner, css, fmt, fname, L, asBlob) {
    L = L || get();
    return lib().then(function () {
      var z = L.zoom / 100, ph = L.ph;
      if (!ph) { /* উচ্চতা মেপে নিই (অটো-হাইট: রসিদ/কাস্টম) */
        var m = stageEl(inner, css, L); m.style.cssText += ';position:absolute;left:0;top:0;visibility:hidden'; document.body.appendChild(m);
        var hpx = m.scrollHeight; m.remove(); ph = Math.ceil(hpx * 25.4 / 96 * z) + 2 * L.margin + 4; ph = Math.max(ph, 40);
      }
      var el = stageEl(inner, css, L);
      if (fmt === 'png') return html2pdf().set({ html2canvas: { scale: 2, backgroundColor: '#fff' } }).from(el).toCanvas().get('canvas').then(function (cv) { return new Promise(function (ok) { cv.toBlob(function (b) { if (asBlob) return ok(b); if (b) save(b, fname); ok(!!b); }, 'image/png'); }); });
      var land = L.pw > ph, fmtArr = land ? [ph, L.pw] : [L.pw, ph];
      var w = html2pdf().set({ margin: L.margin, filename: fname, html2canvas: { scale: 2, backgroundColor: '#fff' }, jsPDF: { unit: 'mm', format: fmtArr, orientation: land ? 'landscape' : 'portrait' }, pagebreak: { mode: ['avoid-all', 'css'] } }).from(el);
      return asBlob ? w.outputPdf('blob') : w.save().then(function () { return true; });
    }).catch(function () { return asBlob ? null : false; });
  }
  /* লুকানো iframe দিয়ে প্রিন্ট — পপ-আপ ব্লক হয় না, তাই বিল শেষে অটো-প্রিন্টও চলে */
  function printHtml(html) {
    try {
      var fr = document.createElement('iframe'); fr.setAttribute('aria-hidden', 'true'); fr.setAttribute('tabindex', '-1');
      fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
      document.body.appendChild(fr); var d = fr.contentWindow.document; d.open(); d.write(html); d.close();
      var done = false, go = function () { if (done) return; done = true; try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { } setTimeout(function () { fr.remove(); }, 60000); };
      fr.onload = function () { setTimeout(go, 150); }; setTimeout(go, 900); return true;
    } catch (e) {
      var w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups'); return false; }
      w.document.write(html.replace('</body>', '<script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body>')); w.document.close(); return true;
    }
  }

  /* ---------- 📐 ডায়ালগ ---------- */
  var ov = null;
  function css() {
    if (document.getElementById('mclay-css')) return; var s = document.createElement('style'); s.id = 'mclay-css';
    s.textContent = '.mclay{position:fixed;inset:0;z-index:2147483200;background:rgba(15,20,40,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:12px;font:15px/1.45 Inter,"Noto Sans Bengali",system-ui,sans-serif;color:#16213a}' +
      '.mclay .bx{background:#fff;border-radius:18px;width:100%;max-width:880px;max-height:94vh;display:flex;flex-direction:column;box-shadow:0 25px 70px rgba(0,0,0,.4);overflow:hidden}.mclay .hd{display:flex;justify-content:space-between;align-items:center;padding:.8rem 1.1rem;border-bottom:1px solid #e3e7f5}.mclay h3{margin:0;font-size:1.1rem}' +
      '.mclay .bd{display:grid;grid-template-columns:300px 1fr;gap:1rem;padding:1rem;overflow:auto;min-height:0}@media(max-width:700px){.mclay .bd{grid-template-columns:1fr}}' +
      '.mclay label{display:block;font-weight:600;font-size:.85rem;margin:.55rem 0 .2rem}.mclay select,.mclay input[type=number]{width:100%;padding:.5rem .6rem;border:2px solid #e3e7f5;border-radius:10px;font:inherit;background:#fff;color:inherit;box-sizing:border-box}.mclay input[type=range]{width:100%}' +
      '.mclay .rw{display:flex;gap:.4rem;align-items:center}.mclay .rw>*{flex:1}.mclay .rw button.s{flex:0 0 38px}.mclay button{font:inherit;cursor:pointer;border:1px solid #c9d0e6;background:#fff;color:inherit;border-radius:10px;padding:.45rem .7rem;min-height:38px}.mclay button.p{background:#4f6bed;color:#fff;border-color:#4f6bed}.mclay button:focus-visible,.mclay select:focus-visible,.mclay input:focus-visible{outline:3px solid #8aa0ff;outline-offset:1px}' +
      '.mclay .pv{background:#e9ecf6;border-radius:12px;padding:.7rem;display:flex;flex-direction:column;align-items:center;min-height:300px;overflow:auto}.mclay .pg{background:#fff;box-shadow:0 4px 18px rgba(0,0,0,.25);position:relative;overflow:hidden;transform-origin:top left}.mclay .pg iframe{border:0;width:100%;height:100%;background:#fff}' +
      '.mclay .ft{display:flex;gap:.5rem;flex-wrap:wrap;padding:.8rem 1.1rem;border-top:1px solid #e3e7f5;align-items:center}.mclay .ft .sp{flex:1}.mclay .inf{font-size:.8rem;color:#5c6783;margin-top:.5rem}';
    document.head.appendChild(s);
  }
  /* opts: {title, html:()=>string (পূর্ণ ইনভয়েস HTML), print:()=>void, pdf:()=>void, onChange:()=>void} */
  function open(opts) {
    css(); if (ov) ov.remove(); var admin = /admin|owner/i.test(String(user().role || '')) || sessionStorage.getItem('mc_role') === 'Owner';
    ov = document.createElement('div'); ov.className = 'mclay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Invoice size');
    ov.innerHTML = '<div class="bx"><div class="hd"><h3>📐 ইনভয়েসের সাইজ' + (opts.title ? ' — ' + esc(opts.title) : '') + '</h3><button class="x" aria-label="বন্ধ">✕</button></div><div class="bd"><div class="ct">' +
      '<label for="ml-paper">কাগজ</label><select id="ml-paper">' + Object.keys(PAPERS).map(function (k) { return '<option value="' + k + '">' + PAPERS[k][0] + (PAPERS[k][1] && PAPERS[k][2] ? ' (' + PAPERS[k][1] + '×' + PAPERS[k][2] + 'mm)' : '') + '</option>'; }).join('') + '</select>' +
      '<div id="ml-cu" class="rw" style="display:none"><div><label for="ml-w">চওড়া (mm)</label><input type="number" id="ml-w" min="40" max="400"></div><div><label for="ml-h">উচ্চতা (mm, ০ = অটো)</label><input type="number" id="ml-h" min="0" max="600"></div></div>' +
      '<div id="ml-or"><label for="ml-orient">দিক</label><select id="ml-orient"><option value="p">লম্বালম্বি (Portrait)</option><option value="l">আড়াআড়ি (Landscape)</option></select></div>' +
      '<label for="ml-zoom">জুম (পুরো ইনভয়েস ছোট/বড়): <b id="ml-zv"></b></label><div class="rw"><button class="s" data-z="-5" aria-label="জুম কমান">−</button><input type="range" id="ml-zoom" min="50" max="200" step="5"><button class="s" data-z="5" aria-label="জুম বাড়ান">+</button></div>' +
      '<label for="ml-font">লেখার মাপ: <b id="ml-fv"></b></label><div class="rw"><button class="s" data-f="-5" aria-label="লেখা ছোট">A−</button><input type="range" id="ml-font" min="70" max="150" step="5"><button class="s" data-f="5" aria-label="লেখা বড়">A+</button></div>' +
      '<label for="ml-margin">মার্জিন (কাগজের কিনারা)</label><select id="ml-margin">' + MARGINS.map(function (m) { return '<option value="' + m + '">' + (m ? m + ' mm' : 'কোনো মার্জিন নেই') + '</option>'; }).join('') + '</select>' +
      '<div class="inf" id="ml-info"></div></div><div class="pv"><div class="pg"><iframe title="Preview" sandbox=""></iframe></div><div class="inf" id="ml-pi"></div></div></div>' +
      '<div class="ft"><button id="ml-reset">↺ ডিফল্টে ফিরুন</button>' + (admin ? '<button id="ml-adm" title="সব ডিভাইসের ডিফল্ট">⭐ সবার ডিফল্ট করুন</button>' : '') + '<span class="sp"></span>' + (opts.pdf ? '<button id="ml-pdf">⬇ PDF</button>' : '') + (opts.print ? '<button class="p" id="ml-print">🖨 প্রিন্ট</button>' : '') + '<button id="ml-ok">ঠিক আছে</button></div></div>';
    document.body.appendChild(ov);
    var $ = function (i) { return ov.querySelector('#' + i); };
    function sync() {
      var L = get(); $('ml-paper').value = L.paper; $('ml-orient').value = L.orient; $('ml-zoom').value = L.zoom; $('ml-font').value = L.font; $('ml-margin').value = L.margin;
      $('ml-zv').textContent = L.zoom + '%'; $('ml-fv').textContent = L.font + '%'; $('ml-cu').style.display = L.paper === 'custom' ? 'flex' : 'none'; $('ml-w').value = L.w; $('ml-h').value = L.h;
      $('ml-or').style.display = (L.thermal || L.paper === 'custom') ? 'none' : 'block';
      $('ml-info').textContent = 'কাগজ ' + L.pw + ' × ' + (L.ph || 'অটো') + ' mm · লেখার জায়গা ' + L.cw + ' mm · সেটিং: ' + ({ device: 'এই ডিভাইসে আপনার পছন্দ', admin: 'Admin-এর ডিফল্ট', 'built-in': 'স্বাভাবিক' }[L.src]);
      preview(L);
    }
    function preview(L) {
      var box = ov.querySelector('.pv'), avail = Math.max(240, box.clientWidth - 24), pxW = mm2px(L.pw), pxH = mm2px(L.ph || Math.min(297, Math.max(120, L.pw * 1.6)));
      var sc = Math.min(1, avail / pxW), pg = ov.querySelector('.pg'), fr = pg.querySelector('iframe');
      pg.style.width = pxW + 'px'; pg.style.height = pxH + 'px'; pg.style.transform = 'scale(' + sc + ')'; pg.style.marginBottom = (-(pxH * (1 - sc))) + 'px'; pg.style.marginRight = (-(pxW * (1 - sc))) + 'px';
      var h = ''; try { h = opts.html(); } catch (e) { h = '<p style="padding:1rem">প্রিভিউ করা যায়নি</p>'; } fr.srcdoc = h;
      $('ml-pi').textContent = 'লাইভ প্রিভিউ' + (L.ph ? '' : ' (উচ্চতা বিষয়বস্তু অনুযায়ী)');
    }
    function upd(p) { set(p); if (opts.onChange) opts.onChange(); sync(); }
    $('ml-paper').onchange = function () { var v = this.value, A = AUTO[v] || [100, 100, 10]; upd({ paper: v, zoom: A[0], font: A[1], margin: A[2], orient: 'p' }); };
    $('ml-orient').onchange = function () { upd({ orient: this.value }); };
    $('ml-w').onchange = function () { upd({ w: this.value }); }; $('ml-h').onchange = function () { upd({ h: this.value }); };
    $('ml-zoom').oninput = function () { upd({ zoom: this.value }); }; $('ml-font').oninput = function () { upd({ font: this.value }); }; $('ml-margin').onchange = function () { upd({ margin: this.value }); };
    ov.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) { if (e.target === ov) close(); return; }
      if (b.dataset.z) upd({ zoom: Math.min(200, Math.max(50, get().zoom + (+b.dataset.z))) });
      else if (b.dataset.f) upd({ font: Math.min(150, Math.max(70, get().font + (+b.dataset.f))) });
      else if (b.id === 'ml-reset') { reset(); if (opts.onChange) opts.onChange(); sync(); }
      else if (b.id === 'ml-adm') { var c = get(); set({ paper: c.paper, orient: c.orient, zoom: c.zoom, font: c.font, margin: c.margin, w: c.w, h: c.h }, true); try { var a = rj('pharmacy_audit', []); a.push({ at: new Date().toISOString(), by: user().name || user().email || 'admin', msg: 'Invoice default layout set: ' + c.paper + ' zoom ' + c.zoom + '% font ' + c.font + '%' }); localStorage.setItem('pharmacy_audit', JSON.stringify(a.slice(-300))); } catch (x) { } sync(); b.textContent = '✔ সবার জন্য সেট হয়েছে'; }
      else if (b.id === 'ml-print') { opts.print(); } else if (b.id === 'ml-pdf') { opts.pdf(); }
      else if (b.id === 'ml-ok' || b.classList.contains('x')) close();
    });
    function esc2(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    function close() { if (ov) { ov.remove(); ov = null; document.removeEventListener('keydown', esc2, true); } }
    document.addEventListener('keydown', esc2, true); sync(); $('ml-paper').focus();
  }

  window.MCLAY = { blob: function (inner, css, fmt, L) { return render(inner, css, fmt, 'x', L, true); }, get: get, set: set, reset: reset, docCss: docCss, render: render, printHtml: printHtml, open: open, save: save, PAPERS: PAPERS };
})();
