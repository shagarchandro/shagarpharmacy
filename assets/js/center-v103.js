/* v103/v106/v108 — Control Center → 🧩 Site Studio (v108: শপ হোমপেজ — হিরো ছবি/সেকশন ক্রম/গ্রিড, লোগো ও বাটন স্টাইল, ফ্লোটিং WhatsApp/কল, ফুটার লিংক-সোশ্যাল; v106: লাইভ প্রিভিউ, ফাইন-টিউন, নিজস্ব ফন্ট, লগইন পেজ, উৎসব-সূচি, ডিফল্ট মোড, স্কোপ CSS, সেভের পর পরিবর্তন-সারাংশ): পুরো সাইট (শপ · স্টাফ পেজ · Ops Panel · লগইন) এক জায়গা থেকে কাস্টমাইজ।
   সেভ হয় `pharmacy_site`-এ (সার্ভার মোডে নিজে থেকেই সিঙ্ক হয়); প্রয়োগ করে assets/js/site-v103.js। শেষ ১০টি সংস্করণ রিস্টোর করা যায়। */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  var KEY = 'pharmacy_site', HKEY = 'pharmacy_site_hist';
  var PAGES = [['dashboard.html', 'Dashboard'], ['medicines.html', 'Medicines'], ['customers.html', 'Customers'], ['sales.html', 'POS Sales'], ['purchases.html', 'Purchases'], ['suppliers.html', 'Suppliers'], ['prescriptions.html', 'Prescriptions'], ['reports.html', 'Reports'], ['team.html', 'Team Board'], ['closing.html', 'Cash Closing'], ['reorder.html', 'Reorder'], ['refunds.html', 'Refunds'], ['writeoff.html', 'Write-off'], ['register.html', 'Rx Register'], ['backup.html', 'Backup']];
  var PRESETS = [
    ['✨ Clean', { font: 'system', fontScale: 100, radius: 'soft', density: 'normal', colors: {}, c: ['#667eea', '#764ba2'] }],
    ['🌿 Soft mint', { font: 'rounded', fontScale: 100, radius: 'round', density: 'normal', colors: { pageBg: '#f1faf7', cardBg: '#ffffff' }, c: ['#0f9d82', '#34d399'] }],
    ['📜 Warm paper', { font: 'serif', fontScale: 104, radius: 'soft', density: 'normal', colors: { pageBg: '#faf5ea', cardBg: '#fffdf7', text: '#3b2f22' }, c: ['#b45309', '#d97706'] }],
    ['🔲 High contrast', { font: 'system', fontScale: 110, radius: 'soft', density: 'normal', colors: { pageBg: '#ffffff', cardBg: '#ffffff', text: '#000000', link: '#0033cc' }, c: ['#0b3d91', '#1d4ed8'] }],
    ['📐 Compact pro', { font: 'system', fontScale: 92, radius: 'sharp', density: 'compact', colors: { pageBg: '#f4f6f8' }, c: ['#334155', '#475569'] }],
    ['🔎 Large & easy', { font: 'bangla', fontScale: 118, radius: 'round', density: 'cozy', colors: {}, c: ['#667eea', '#764ba2'] }]
  ];
  window.CCX = function (c) {
    var x = prev(c), rj = c.rj, wj = c.wj;
    function el(tag, p, kids) {
      var e = document.createElement(tag); p = p || {};
      Object.keys(p).forEach(function (k) {
        if (k === 'style') e.style.cssText = p[k]; else if (k === 'class') e.className = p[k]; else if (/^on/.test(k)) e.addEventListener(k.slice(2), p[k]); else if (k in e && k !== 'list') e[k] = p[k]; else e.setAttribute(k, p[k]);
      });
      [].concat(kids == null ? [] : kids).forEach(function (k) { if (k != null) e.append(k.nodeType ? k : document.createTextNode(String(k))); });
      return e;
    }
    function card(title, hint, body) { return el('div', { class: 'cc-card', style: 'margin-bottom:1rem' }, [el('h3', {}, title), hint ? el('p', { class: 'muted', style: 'margin:.1rem 0 .7rem' }, hint) : null].concat(body)); }
    function lab(t, inp, w) { return el('label', { style: 'display:flex;flex-direction:column;gap:.2rem;font-size:.9rem;' + (w || '') }, [t, inp]); }
    function sel(opts, val) { var s = el('select', {}, opts.map(function (o) { return el('option', { value: o[0], selected: o[0] === val }, o[1]); })); return s; }

    x.panels.site = function () {
      var cur = rj(KEY, {}), st = Object.assign({ v: 1, scope: {}, font: 'system', fontScale: 100, radius: '', density: 'normal', colors: {}, navHide: [], navLabel: {}, pageOff: [], replace: [], banner: {}, hideSel: [], css: '', footer: '', favicon: '', titleSuffix: '', look: {}, fontFile: null, cssScope: {}, login: {}, schedule: [], mode: 'keep', modeStamp: 0, shop: {}, brand: {}, btn: {}, headFont: 'same', float: {}, links: [], social: {} }, JSON.parse(JSON.stringify(cur)));
      var F = {};   // field refs
      var root = el('div', {});
      var note = el('p', { class: 'muted' }, '🛟 জরুরি: কোনো পেজ বেঠিক দেখালে URL-এর শেষে ?nosite=1 যোগ করুন — সব কাস্টমাইজেশন সেই লোডে বন্ধ থাকবে। Control Center নিজে সবসময় সেফ মোডে চলে।');
      /* 1. presets */
      var presetBtns = PRESETS.map(function (p) { return el('button', { type: 'button', class: 'btn2', onclick: function () { applyPreset(p[1]); c.ok('"' + p[0] + '" ফর্মে বসেছে — প্রিভিউ দেখুন, ঠিক থাকলে সেভ করুন'); } }, p[0]); });
      root.append(note, card('🎯 রেডিমেড স্টাইল', 'এক ক্লিকে ফন্ট + কোণ + ঘনত্ব + রং। (Branding-এর রঙ-জোড়াও বদলাবে — সেভ করলে।)', [el('div', { class: 'row', style: 'display:flex;gap:.5rem;flex-wrap:wrap' }, presetBtns)]));
      /* 1b. লাইভ প্রিভিউ */
      var PGS = [['shop.html', '🛍 শপ'], ['dashboard.html', '🖥 ড্যাশবোর্ড'], ['sales.html', '🧾 POS'], ['login.html', '🔑 লগইন'], ['admin/index.html', '🧰 Ops Panel']];
      var pgSel = sel(PGS.map(function (x) { return [x[0], x[1]]; }), 'shop.html'), wSel = sel([['100%', '🖥 ডেস্কটপ'], ['768px', '📟 ট্যাবলেট'], ['390px', '📱 মোবাইল']], '100%');
      var frame = el('iframe', { title: 'প্রিভিউ', style: 'width:100%;height:520px;border:1px solid var(--br);border-radius:12px;background:#fff;display:block;margin:0 auto;transition:width .2s' });
      var prevT = null; function loadPrev() { clearTimeout(prevT); prevT = setTimeout(function () { try { var nm = 'mcprev:' + JSON.stringify(read()); frame.name = nm; try { if (frame.contentWindow) frame.contentWindow.name = nm; } catch (e3) { } frame.style.width = wSel.value; frame.src = pgSel.value + (pgSel.value.indexOf('?') < 0 ? '?' : '&') + '_p=' + Date.now(); } catch (e) { } }, 600); }
      pgSel.addEventListener('change', loadPrev); wSel.addEventListener('change', function () { frame.style.width = wSel.value; });
      var prevCard = card('👁 লাইভ প্রিভিউ', 'নিচের যেকোনো সেটিং বদলালেই এখানে আসল পেজে সাথে সাথে দেখা যায় (সেভ না করা পর্যন্ত কিছু বদলায় না)। ড্যাশবোর্ড/POS/Ops-এর জন্য আগে লগইন থাকতে হবে, না থাকলে লগইন পেজ দেখাবে।', [el('div', { style: 'display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:.6rem' }, [pgSel, wSel, el('button', { type: 'button', class: 'btn2', onclick: loadPrev }, '🔄 রিলোড')]), frame]);
      root.append(prevCard);
      /* 2. look & feel */
      F.font = sel([['system', 'সিস্টেম (ডিফল্ট)'], ['rounded', 'Rounded'], ['bangla', 'বাংলা-বান্ধব'], ['serif', 'Serif (বইয়ের মতো)'], ['mono', 'Monospace'], ['custom', '📁 নিজের ফন্ট ফাইল (নিচে আপলোড)']], st.font);
      F.fs = el('input', { type: 'range', min: 80, max: 140, step: 2, value: st.fontScale || 100 }); F.fsv = el('b', {}, (st.fontScale || 100) + '%');
      F.fs.addEventListener('input', function () { F.fsv.textContent = F.fs.value + '%'; });
      F.radius = sel([['', 'ডিফল্ট'], ['sharp', 'ধারালো (0)'], ['soft', 'নরম (8px)'], ['round', 'গোল (16px)'], ['pill', 'খুব গোল (24px)']], st.radius || '');
      F.density = sel([['compact', 'কমপ্যাক্ট'], ['normal', 'স্বাভাবিক'], ['cozy', 'প্রশস্ত']], st.density || 'normal');
      var COLS = [['pageBg', 'পেজ ব্যাকগ্রাউন্ড'], ['cardBg', 'কার্ড ব্যাকগ্রাউন্ড'], ['text', 'লেখার রং'], ['link', 'লিংকের রং'], ['nav', 'মেনু/টপবার ব্যাকগ্রাউন্ড']];
      F.col = {}; var colEls = COLS.map(function (k) {
        var on = el('input', { type: 'checkbox', checked: !!st.colors[k[0]] }), cp = el('input', { type: 'color', value: st.colors[k[0]] || '#ffffff' }); F.col[k[0]] = [on, cp];
        return el('label', { style: 'display:flex;align-items:center;gap:.5rem;font-size:.9rem' }, [on, cp, k[1]]);
      });
      root.append(card('🔤 লুক ও ফিল', 'শুধু লাইট মোডে রং বসে (ডার্ক মোড নিজের রঙ রাখে)। মূল অ্যাকসেন্ট রং/লোগো/নাম → 🎨 Branding ট্যাব।', [
        el('div', { class: 'cc-two' }, [
          el('div', { style: 'display:grid;gap:.7rem' }, [lab('ফন্ট', F.font), lab(['লেখার সাইজ ', F.fsv], F.fs), lab('কোণের গোলাকার ভাব', F.radius), lab('ঘনত্ব (প্যাডিং)', F.density)]),
          el('div', { style: 'display:grid;gap:.5rem;align-content:start' }, colEls)])]));
      /* 2b. ফাইন-টিউন */
      var LK = st.look || {};
      F.lk = { shadow: sel([['', 'ডিফল্ট'], ['none', 'ছায়া নেই'], ['strong', 'গভীর ছায়া']], LK.shadow || ''), border: sel([['', 'ডিফল্ট'], ['off', 'বর্ডার নেই'], ['bold', 'মোটা বর্ডার']], LK.border || ''), width: sel([['', 'ডিফল্ট'], ['narrow', 'সরু (৯৬০px)'], ['wide', 'চওড়া (১৫০০px)'], ['full', 'পুরো স্ক্রিন']], LK.width || ''),
        lh: el('input', { type: 'number', step: '0.1', min: 1.2, max: 2.2, value: LK.lineHeight || '', placeholder: '১.৫', style: 'width:100%' }), links: el('input', { type: 'checkbox', checked: !!LK.links }), calm: el('input', { type: 'checkbox', checked: !!LK.calm }), sticky: el('input', { type: 'checkbox', checked: LK.sticky === false }) };
      root.append(card('🎚 ফাইন-টিউনিং', 'কার্ডের ছায়া/বর্ডার, কনটেন্টের প্রস্থ, লাইনের ফাঁক, অ্যানিমেশন কমানো (পুরনো ফোন/ধীর নেটের জন্য ভালো) ও আরও।', [
        el('div', { class: 'cc-two' }, [el('div', { style: 'display:grid;gap:.7rem' }, [lab('কার্ডের ছায়া', F.lk.shadow), lab('কার্ডের বর্ডার', F.lk.border), lab('কনটেন্টের প্রস্থ', F.lk.width), lab('লাইনের ফাঁক (line-height)', F.lk.lh)]),
          el('div', { style: 'display:grid;gap:.6rem;align-content:start' }, [el('label', { class: 'cc-chk', style: 'display:flex;gap:.5rem;align-items:center' }, [F.lk.links, 'লিংকে সবসময় আন্ডারলাইন (পড়তে সুবিধা)']), el('label', { class: 'cc-chk', style: 'display:flex;gap:.5rem;align-items:center' }, [F.lk.calm, 'অ্যানিমেশন/ট্রানজিশন বন্ধ (শান্ত ও দ্রুত)']), el('label', { class: 'cc-chk', style: 'display:flex;gap:.5rem;align-items:center' }, [F.lk.sticky, 'উপরের বার সেঁটে না থাকুক (স্ক্রল করলে সরে যাবে)'])])])]));
      /* 2c. নিজস্ব ফন্ট */
      var fontNote = el('span', { class: 'muted' }, st.fontFile && st.fontFile.name ? '✔ ' + st.fontFile.name + ' (' + Math.round((st.fontFile.data || '').length / 1365) + ' KB)' : 'কোনো ফাইল নেই');
      function readFile(f, maxKB, test) { return new Promise(function (res, rej) { if (!f) return rej('no file'); if (f.size > maxKB * 1024) return rej('ফাইল ' + maxKB + ' KB-এর বেশি'); if (test && !test(f)) return rej('ফাইলের ধরন ঠিক নয়'); var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = function () { rej('পড়া যায়নি'); }; r.readAsDataURL(f); }); }
      var fontIn = el('input', { type: 'file', accept: '.woff2,.woff,.ttf,.otf', onchange: function (e) { var f = e.target.files[0]; readFile(f, 300, function (x) { return /\.(woff2?|ttf|otf)$/i.test(x.name); }).then(function (d) {
        d = d.replace(/^data:[^;,]*/, /woff2/i.test(f.name) ? 'data:font/woff2' : /woff/i.test(f.name) ? 'data:font/woff' : 'data:font/ttf'); st.fontFile = { name: f.name, data: d }; F.font.value = 'custom'; fontNote.textContent = '✔ ' + f.name; preview(); }).catch(function (m) { c.bad(String(m)); }); } });
      root.append(card('📁 নিজের ফন্ট ফাইল', 'woff2/woff/ttf/otf, সর্বোচ্চ ৩০০ KB (বাংলা ফন্টের জন্য সাবসেট করা ফাইল ভালো)। ফাইল সাইটের ভেতরেই থাকে — বাইরে থেকে লোড হয় না। আপলোড করলে "ফন্ট" নিজে থেকে "নিজের ফন্ট" হবে।', [el('div', { style: 'display:flex;gap:.7rem;align-items:center;flex-wrap:wrap' }, [fontIn, fontNote, el('button', { type: 'button', class: 'btn2', onclick: function () { st.fontFile = null; fontNote.textContent = 'কোনো ফাইল নেই'; if (F.font.value === 'custom') F.font.value = 'system'; preview(); } }, '✕ সরান')])]));
      /* 2d. লগইন পেজ */
      var LG = st.login || {}; F.lg = { title: el('input', { type: 'text', value: LG.title || '', maxLength: 60, placeholder: 'Welcome Back!', style: 'width:100%' }), sub: el('input', { type: 'text', value: LG.sub || '', maxLength: 200, placeholder: 'আপনার দোকান ম্যানেজ করতে লগইন করুন', style: 'width:100%' }), dim: el('input', { type: 'range', min: 0, max: 0.7, step: 0.05, value: LG.dim != null ? LG.dim : 0.25 }) };
      var bgNote = el('span', { class: 'muted' }, LG.bg ? '✔ ছবি আছে' : 'কোনো ছবি নেই'), bgIn = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp', onchange: function (e) { readFile(e.target.files[0], 350, function (x) { return /^image\/(png|jpe?g|webp)$/.test(x.type); }).then(function (d) { st.login = st.login || {}; st.login.bg = d; bgNote.textContent = '✔ ছবি বসেছে'; preview(); }).catch(function (m) { c.bad(String(m)); }); } });
      root.append(card('🔑 লগইন পেজ', 'স্টাফ লগইন পেজের শিরোনাম/লেখা ও ব্যাকগ্রাউন্ড ছবি (সর্বোচ্চ ৩৫০ KB, JPG/PNG/WebP)। ছবির উপর কালচে স্তরের ঘনত্ব ঠিক করুন যাতে লেখা পড়া যায়।', [el('div', { class: 'cc-two' }, [lab('বড় শিরোনাম', F.lg.title), lab('ছোট লেখা', F.lg.sub)]), el('div', { style: 'display:flex;gap:.7rem;align-items:center;flex-wrap:wrap;margin-top:.6rem' }, [bgIn, bgNote, el('button', { type: 'button', class: 'btn2', onclick: function () { st.login = st.login || {}; st.login.bg = ''; bgNote.textContent = 'কোনো ছবি নেই'; preview(); } }, '✕ ছবি সরান')]), lab('ছবির উপর কালচে স্তর', F.lg.dim)]));
      /* 2f. শপ হোমপেজ */
      var SH = st.shop || {}, SECN = [['hero', '🦸 হিরো ব্যানার'], ['offers', '🎁 অফার কার্ড'], ['cats', '🏷 ক্যাটাগরি চিপ'], ['strip', '✅ স্টক/OTC/Rx চিপ'], ['catalog', '🛒 ফিল্টার + পণ্যের তালিকা'], ['trust', '🛡 ট্রাস্ট ব্যাজ']];
      var ord = (SH.order && SH.order.length ? SH.order.filter(function (k) { return SECN.some(function (x) { return x[0] === k; }); }) : []); SECN.forEach(function (x) { if (ord.indexOf(x[0]) < 0) ord.push(x[0]); });
      F.ord = ord; var ordBox = el('div', { style: 'display:grid;gap:.35rem' });
      function drawOrd() { ordBox.replaceChildren.apply(ordBox, F.ord.map(function (k, i) { var nm = SECN.filter(function (x) { return x[0] === k; })[0][1]; return el('div', { style: 'display:flex;gap:.4rem;align-items:center;padding:.3rem .6rem;border:1px solid var(--br);border-radius:10px;background:var(--card)' }, [el('b', { style: 'width:1.4rem' }, i + 1), el('span', { style: 'flex:1' }, nm),
        el('button', { type: 'button', class: 'btn2', disabled: i === 0, onclick: function () { var t = F.ord[i - 1]; F.ord[i - 1] = F.ord[i]; F.ord[i] = t; drawOrd(); preview(); } }, '▲'), el('button', { type: 'button', class: 'btn2', disabled: i === F.ord.length - 1, onclick: function () { var t = F.ord[i + 1]; F.ord[i + 1] = F.ord[i]; F.ord[i] = t; drawOrd(); preview(); } }, '▼')]); })); }
      drawOrd(); var NAT = SECN.map(function (x) { return x[0]; }).join();
      var HD = SH.hide || {}; F.sh = { cols: sel([['', 'ডিফল্ট'], ['2', '২ কলাম'], ['3', '৩ কলাম'], ['4', '৪ কলাম'], ['5', '৫ কলাম'], ['6', '৬ কলাম']], String(SH.cols || '')), imgH: el('input', { type: 'number', min: 80, max: 280, step: 10, value: SH.imgH || '', placeholder: 'যেমন 140', style: 'width:100%' }),
        heroDim: el('input', { type: 'range', min: 0, max: 0.8, step: 0.05, value: SH.heroDim != null ? SH.heroDim : 0.35 }), heroH: el('input', { type: 'number', min: 160, max: 700, step: 20, value: SH.heroH || '', placeholder: 'যেমন 320', style: 'width:100%' }),
        hide: {} }; var heroNote = el('span', { class: 'muted' }, SH.heroImg ? '✔ ছবি আছে' : 'কোনো ছবি নেই');
      var heroIn = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp', onchange: function (e) { readFile(e.target.files[0], 350, function (x) { return /^image\/(png|jpe?g|webp)$/.test(x.type); }).then(function (d) { st.shop = st.shop || {}; st.shop.heroImg = d; heroNote.textContent = '✔ ছবি বসেছে'; preview(); }).catch(function (m) { c.bad(String(m)); }); } });
      var HDL = [['generic', 'জেনেরিক/ফর্ম লাইন'], ['maker', 'কোম্পানির নাম'], ['stock', 'স্টকের অবস্থা'], ['wish', 'উইশলিস্ট ♡'], ['compare', 'তুলনা ⚖']].map(function (k) { var i = el('input', { type: 'checkbox', checked: !!HD[k[0]] }); F.sh.hide[k[0]] = i; return el('label', { class: 'cc-chk', style: 'display:flex;gap:.4rem;align-items:center' }, [i, k[1] + ' লুকান']); });
      root.append(card('🛍 শপ হোমপেজ', 'শুধু গ্রাহক-শপে প্রয়োগ হয়। হিরোতে নিজের ছবি, সেকশনের ক্রম ওঠানামা, পণ্যের কার্ডের কলাম-সংখ্যা/ছবির উচ্চতা ও কোন তথ্য দেখাবে। (সেকশন চালু/বন্ধ → 🛍 Customer shop ট্যাব)', [
        el('h4', { style: 'margin:.2rem 0' }, 'হিরো ব্যানারের ছবি'), el('div', { style: 'display:flex;gap:.7rem;align-items:center;flex-wrap:wrap' }, [heroIn, heroNote, el('button', { type: 'button', class: 'btn2', onclick: function () { st.shop = st.shop || {}; st.shop.heroImg = ''; heroNote.textContent = 'কোনো ছবি নেই'; preview(); } }, '✕ সরান')]),
        el('div', { class: 'cc-two', style: 'margin-top:.5rem' }, [lab('ছবির উপর কালচে স্তর', F.sh.heroDim), lab('হিরোর উচ্চতা (px)', F.sh.heroH)]),
        el('h4', { style: 'margin:.8rem 0 .3rem' }, 'সেকশনের ক্রম'), ordBox, el('button', { type: 'button', class: 'btn2', style: 'margin-top:.4rem', onclick: function () { F.ord = NAT.split(','); drawOrd(); preview(); } }, '↺ আগের ক্রম'),
        el('h4', { style: 'margin:.8rem 0 .3rem' }, 'পণ্যের কার্ড'), el('div', { class: 'cc-two' }, [lab('ডেস্কটপে কলাম', F.sh.cols), lab('ছবির উচ্চতা (px)', F.sh.imgH)]), el('div', { style: 'display:flex;gap:1rem;flex-wrap:wrap;margin-top:.5rem' }, HDL)]));
      /* 2g. ব্র্যান্ড ও বাটন */
      var BR = st.brand || {}, BT = st.btn || {};
      F.br = { size: el('input', { type: 'range', min: 20, max: 90, step: 2, value: BR.logoSize || 36 }), sizeOn: el('input', { type: 'checkbox', checked: !!BR.logoSize }), shape: sel([['', 'ডিফল্ট'], ['round', 'গোলাকার কোণ'], ['circle', 'পুরো গোল']], BR.shape || ''), textOff: el('input', { type: 'checkbox', checked: !!BR.textOff }),
        bshape: sel([['', 'ডিফল্ট'], ['pill', 'পিল (গোল)'], ['square', 'চৌকো']], BT.shape || ''), lift: el('input', { type: 'checkbox', checked: !!BT.lift }), head: sel([['same', 'বডির মতোই'], ['serif', 'Serif'], ['rounded', 'Rounded'], ['bangla', 'বাংলা-বান্ধব'], ['mono', 'Monospace'], ['custom', 'নিজের ফন্ট ফাইল']], st.headFont || 'same') };
      root.append(card('🏷 ব্র্যান্ড, বাটন ও হেডিং', 'লোগোর সাইজ/আকৃতি (লোগো Branding ট্যাবে দেওয়া থাকলে), বাটনের আকার, হোভারে ওঠা-ভাব ও আলাদা হেডিং ফন্ট।', [
        el('div', { class: 'cc-two' }, [el('div', { style: 'display:grid;gap:.7rem' }, [el('label', { class: 'cc-chk', style: 'display:flex;gap:.5rem;align-items:center' }, [F.br.sizeOn, 'লোগোর সাইজ নিজে ঠিক করব']), lab('লোগোর উচ্চতা (px)', F.br.size), lab('লোগোর আকৃতি', F.br.shape), el('label', { class: 'cc-chk', style: 'display:flex;gap:.5rem;align-items:center' }, [F.br.textOff, 'লোগো থাকলে নামের লেখা লুকান (শুধু লোগো)'])]),
          el('div', { style: 'display:grid;gap:.7rem;align-content:start' }, [lab('বাটনের আকার', F.br.bshape), el('label', { class: 'cc-chk', style: 'display:flex;gap:.5rem;align-items:center' }, [F.br.lift, 'বাটনে মাউস নিলে সামান্য উঠে আসুক']), lab('হেডিং ফন্ট', F.br.head)])])]));
      /* 2h. ফ্লোটিং বাটন */
      var FL = st.float || {}; F.fl = { on: el('input', { type: 'checkbox', checked: !!FL.on }), wa: el('input', { type: 'text', value: FL.wa || '', placeholder: '8801XXXXXXXXX (কান্ট্রি কোডসহ)', style: 'width:100%' }), msg: el('input', { type: 'text', value: FL.msg || '', maxLength: 160, placeholder: 'আসসালামু আলাইকুম, ওষুধ নিয়ে জানতে চাই…', style: 'width:100%' }), call: el('input', { type: 'text', value: FL.call || '', placeholder: '+8801XXXXXXXXX', style: 'width:100%' }), side: sel([['left', 'বাঁ দিকে'], ['right', 'ডান দিকে']], FL.side || 'left'), high: el('input', { type: 'checkbox', checked: FL.bottom === 'high' }) };
      root.append(card('💬 ফ্লোটিং যোগাযোগ বাটন', 'শপের সব পেজে নিচের কোণে WhatsApp ও/অথবা কল বাটন। (নম্বর খালি রাখলে সেই বাটন আসবে না)', [el('label', { class: 'cc-chk', style: 'display:flex;gap:.5rem;align-items:center' }, [F.fl.on, 'বাটন চালু']), el('div', { class: 'cc-two' }, [lab('WhatsApp নম্বর', F.fl.wa), lab('কল নম্বর', F.fl.call), lab('শুরুর বার্তা', F.fl.msg), lab('কোন দিকে', F.fl.side)]), el('label', { class: 'cc-chk', style: 'display:flex;gap:.5rem;align-items:center' }, [F.fl.high, 'একটু উপরে রাখুন (নিচের অন্য বাটনের সাথে না মেলার জন্য)'])]));
      /* 2i. ফুটার লিংক ও সোশ্যাল */
      F.lk2 = el('div', { style: 'display:grid;gap:.4rem' });
      function lnkRow(a, b2) { var l = el('input', { type: 'text', value: a || '', placeholder: 'লেখা', maxLength: 30, style: 'flex:1;min-width:110px' }), u = el('input', { type: 'text', value: b2 || '', placeholder: 'https://… বা page.html', style: 'flex:2;min-width:160px' }); var r = el('div', { style: 'display:flex;gap:.4rem;align-items:center' }, [l, u, el('button', { type: 'button', class: 'btn2', onclick: function () { r.remove(); } }, '✕')]); r._l = l; r._u = u; F.lk2.append(r); }
      (st.links || []).forEach(function (x) { lnkRow(x.label, x.url); }); if (!(st.links || []).length) lnkRow('', '');
      var SO = st.social || {}; F.so = {}; var soEls = [['facebook', 'Facebook'], ['youtube', 'YouTube'], ['instagram', 'Instagram'], ['x', 'X'], ['tiktok', 'TikTok'], ['linkedin', 'LinkedIn']].map(function (k) { var i = el('input', { type: 'text', value: SO[k[0]] || '', placeholder: 'https://…', style: 'width:100%' }); F.so[k[0]] = i; return lab(k[1] + ' লিংক', i); });
      root.append(card('🔗 ফুটার লিংক ও সোশ্যাল', 'শপ ও স্টাফ পেজের নিচে (ফুটার লেখার উপরে) দেখাবে। শুধু https://, mailto:, tel: বা সাইটের নিজের .html পেজ গ্রহণ করা হয়।', [F.lk2, el('button', { type: 'button', class: 'btn2', style: 'margin:.4rem 0 .8rem', onclick: function () { lnkRow('', ''); } }, '＋ লিংক'), el('div', { class: 'cc-two' }, soEls)]));
      /* 2e. ডিফল্ট কালার মোড */
      F.mode = sel([['keep', 'যা আছে তাই (ব্যবহারকারী নিজে বেছে নেয়)'], ['light', 'সবার জন্য একবার Light সেট করুন'], ['dark', 'সবার জন্য একবার Dark সেট করুন'], ['auto', 'সবার জন্য একবার Auto (ডিভাইস অনুযায়ী) সেট করুন']], st.mode || 'keep');
      root.append(card('🌗 ডিফল্ট কালার মোড', 'মোড বদলে সেভ করলে প্রতিটি ব্রাউজারে পরের বার খোলার সময় একবার এই মোড বসবে; এরপর ব্যবহারকারী চাইলে নিজে বদলাতে পারবে। (অন্য সেটিং সেভ করলে আবার জোর করে বসবে না।)', [lab('মোড', F.mode)]));
      /* 3. menu & pages */
      F.nav = {}; var rows = PAGES.map(function (p) {
        var show = el('input', { type: 'checkbox', checked: (st.navHide || []).indexOf(p[0]) < 0, title: 'মেনুতে দেখান' }), name = el('input', { type: 'text', placeholder: p[1], value: (st.navLabel || {})[p[0]] || '', maxLength: 40, style: 'width:100%' }),
          on = el('input', { type: 'checkbox', checked: (st.pageOff || []).indexOf(p[0]) < 0, disabled: p[0] === 'dashboard', title: 'পেজ চালু (বন্ধ হলে Admin ছাড়া কেউ খুলতে পারবে না)' });
        F.nav[p[0]] = [show, name, on];
        return el('tr', {}, [el('td', {}, p[1]), el('td', { style: 'text-align:center' }, show), el('td', {}, name), el('td', { style: 'text-align:center' }, on)]);
      });
      root.append(card('🧭 মেনু ও পেজ', '"মেনুতে" টিক তুললে লিংক দেখা যায়; "নতুন নাম" দিলে মেনুতে সেই নাম। "চালু" টিক তুলে দিলে পেজটি Admin ছাড়া কেউ খুলতে পারবে না।', [el('div', { class: 'scroll' }, el('table', {}, [el('thead', {}, el('tr', {}, ['পেজ', 'মেনুতে', 'নতুন নাম', 'চালু'].map(function (t) { return el('th', {}, t); }))), el('tbody', {}, rows)]))]));
      /* 4. text replace */
      F.rep = el('div', { style: 'display:grid;gap:.4rem' });
      function repRow(a, b) {
        var f = el('input', { type: 'text', placeholder: 'যে লেখা', value: a || '', maxLength: 80, style: 'flex:1;min-width:120px' }), t = el('input', { type: 'text', placeholder: 'যা দেখাবে', value: b || '', maxLength: 120, style: 'flex:1;min-width:120px' });
        var r = el('div', { style: 'display:flex;gap:.4rem;align-items:center' }, [f, '→', t, el('button', { type: 'button', class: 'btn2', onclick: function () { r.remove(); } }, '✕')]); r._f = f; r._t = t; F.rep.append(r);
      }
      (st.replace || []).forEach(function (r) { repRow(r.from, r.to); }); if (!(st.replace || []).length) repRow('', '');
      root.append(card('✍️ সাইটজুড়ে লেখা বদল', 'যেকোনো শব্দ/বাক্য সব পেজে (শপ, স্টাফ, Ops, লগইন) অন্য লেখায় বদলে যাবে — যেমন "Cash on Delivery" → "ডেলিভারিতে টাকা"। ন্যূনতম ২ অক্ষর।', [F.rep, el('button', { type: 'button', class: 'btn2', style: 'margin-top:.5rem', onclick: function () { repRow('', ''); } }, '＋ আরেকটি')]));
      /* 5. banner */
      var B = st.banner || {};
      F.b = { on: el('input', { type: 'checkbox', checked: !!B.on }), text: el('input', { type: 'text', value: B.text || '', maxLength: 160, placeholder: 'যেমন: ঈদ উপলক্ষে ২৯ তারিখ দোকান বন্ধ', style: 'width:100%' }), tone: sel([['info', '🔵 তথ্য'], ['ok', '🟢 ভালো খবর'], ['warn', '🟡 সতর্কতা'], ['danger', '🔴 জরুরি']], B.tone || 'info'), aud: sel([['all', 'সবাই'], ['shop', 'শুধু গ্রাহক (শপ)'], ['staff', 'শুধু স্টাফ/Ops']], B.audience || 'all'), link: el('input', { type: 'text', value: B.link || '', placeholder: 'ঐচ্ছিক লিংক (shop.html#/contact)' }), ltext: el('input', { type: 'text', value: B.linkText || '', maxLength: 30, placeholder: 'লিংকের লেখা' }), until: el('input', { type: 'date', value: B.until || '' }) };
      root.append(card('📣 ঘোষণা ব্যানার', 'সব পেজের উপরে একটি ব্যানার; ব্যবহারকারী ✕ দিলে ঐ সেশনে আর দেখাবে না। তারিখ দিলে সেদিনের পর নিজে বন্ধ হবে।', [
        el('label', { class: 'cc-chk', style: 'display:flex;gap:.5rem;align-items:center' }, [F.b.on, 'ব্যানার চালু']), lab('বার্তা', F.b.text),
        el('div', { class: 'cc-two' }, [lab('ধরন', F.b.tone), lab('কাদের দেখাবে', F.b.aud), lab('লিংক', F.b.link), lab('লিংকের লেখা', F.b.ltext), lab('শেষ তারিখ (ঐচ্ছিক)', F.b.until)])]));
      /* 5b. উৎসব/মৌসুমী সূচি */
      F.sch = el('div', { style: 'display:grid;gap:.6rem' });
      function schRow(x) {
        x = x || {}; var r = el('div', { class: 'cc-card', style: 'padding:.7rem;border-style:dashed' }), f = {
          name: el('input', { type: 'text', value: x.name || '', placeholder: 'নাম (যেমন: ঈদ অফার)', maxLength: 40 }), from: el('input', { type: 'date', value: x.from || '' }), to: el('input', { type: 'date', value: x.to || '' }),
          text: el('input', { type: 'text', value: x.text || '', placeholder: 'ব্যানারের বার্তা (ঐচ্ছিক)', maxLength: 160, style: 'width:100%' }), tone: sel([['ok', '🟢'], ['info', '🔵'], ['warn', '🟡'], ['danger', '🔴']], x.tone || 'ok'),
          accent: el('input', { type: 'checkbox', checked: !!x.c1 }), c1: el('input', { type: 'color', value: x.c1 || '#d97706' }), c2: el('input', { type: 'color', value: x.c2 || '#f59e0b' }), on: el('input', { type: 'checkbox', checked: x.on !== false }) };
        r._f = f; r.append(el('div', { style: 'display:flex;gap:.5rem;flex-wrap:wrap;align-items:center' }, [f.on, f.name, 'শুরু', f.from, 'শেষ', f.to, el('button', { type: 'button', class: 'btn2', onclick: function () { r.remove(); } }, '✕')]), el('div', { style: 'display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin-top:.5rem' }, [f.text, f.tone]),
          el('label', { style: 'display:flex;gap:.5rem;align-items:center;margin-top:.4rem' }, [f.accent, 'এই সময়ে অ্যাকসেন্ট রং বদলান', f.c1, f.c2])); F.sch.append(r);
      }
      (st.schedule || []).forEach(schRow);
      root.append(card('📅 উৎসব / মৌসুমী সূচি', 'তারিখ দিলে ঐ সময়ের মধ্যে নিজে থেকে ব্যানার ও (ঐচ্ছিক) অ্যাকসেন্ট রং বদলে যাবে, সময় শেষে নিজে ফিরে আসবে — হাতে কিছু করতে হবে না। (বাংলাদেশ সময়; একাধিক মিলে গেলে প্রথমটি)', [F.sch, el('button', { type: 'button', class: 'btn2', style: 'margin-top:.5rem', onclick: function () { schRow({}); } }, '＋ নতুন সূচি')]));
      /* 6. advanced */
      F.scope = {}; var scopeEls = [['shop', '🛍 গ্রাহক শপ'], ['staff', '🖥 স্টাফ পেজ'], ['ops', '🧰 Ops Panel'], ['login', '🔑 লগইন']].map(function (k) { var i = el('input', { type: 'checkbox', checked: (st.scope || {})[k[0]] !== false }); F.scope[k[0]] = i; return el('label', { class: 'cc-chk', style: 'display:flex;gap:.4rem;align-items:center' }, [i, k[1]]); });
      F.footer = el('input', { type: 'text', value: st.footer || '', maxLength: 200, placeholder: '© ২০২৬ আমার ফার্মেসি · হটলাইন ০১৭…', style: 'width:100%' });
      F.fav = el('input', { type: 'text', value: st.favicon || '', maxLength: 4, placeholder: '💊', style: 'width:5rem' });
      F.suf = el('input', { type: 'text', value: st.titleSuffix || '', maxLength: 40, placeholder: 'যেমন: ঢাকা', style: 'width:100%' });
      F.hide = el('textarea', { rows: 3, placeholder: '.promo-strip\n#chatBtn', style: 'width:100%;font-family:monospace' }, (st.hideSel || []).join('\n'));
      F.css = el('textarea', { rows: 6, placeholder: '.btn{letter-spacing:.02em}', style: 'width:100%;font-family:monospace' }, st.css || '');
      root.append(card('🧱 অ্যাডভান্সড', 'কোন জায়গায় কাস্টমাইজেশন চলবে + ফুটার, ফেভিকন, ট্যাব-টাইটেল, লুকানোর CSS-সিলেক্টর ও নিজের CSS। (বাইরের @import/url ব্লক করা — গোপনীয়তা ও অফলাইনের জন্য)', [
        el('div', { style: 'display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:.6rem' }, scopeEls), lab('ফুটার লেখা (শপ/স্টাফ পেজের নিচে)', F.footer), el('div', { class: 'cc-two' }, [lab('ফেভিকন ইমোজি', F.fav), lab('ট্যাব-টাইটেলের শেষে যোগ', F.suf)]),
        lab('লুকাতে চাওয়া অংশ (প্রতি লাইনে একটি CSS সিলেক্টর)', F.hide), lab('নিজের CSS (সব জায়গায়)', F.css),
        el('details', { style: 'margin-top:.6rem' }, [el('summary', { style: 'cursor:pointer' }, 'শুধু নির্দিষ্ট অংশের CSS (শপ / স্টাফ / Ops / লগইন)'), el('div', { style: 'display:grid;gap:.6rem;margin-top:.5rem' }, [['shop', '🛍 শুধু শপ'], ['staff', '🖥 শুধু স্টাফ পেজ'], ['ops', '🧰 শুধু Ops Panel'], ['login', '🔑 শুধু লগইন']].map(function (k) { var t = el('textarea', { rows: 3, style: 'width:100%;font-family:monospace', placeholder: '/* ' + k[1] + ' */' }, (st.cssScope || {})[k[0]] || ''); F.cs = F.cs || {}; F.cs[k[0]] = t; return lab(k[1], t); }))])]));
      /* 7. actions */
      var out = el('div', { class: 'cc-card' }), hist = el('div', {});
      function read() {
        var o = { v: 1, scope: {}, font: F.font.value, fontScale: +F.fs.value, radius: F.radius.value, density: F.density.value, colors: {}, navHide: [], navLabel: {}, pageOff: [], replace: [], banner: {}, hideSel: [], css: F.css.value.slice(0, 20000), footer: F.footer.value.trim(), favicon: F.fav.value.trim(), titleSuffix: F.suf.value.trim() };
        Object.keys(F.scope).forEach(function (k) { if (!F.scope[k].checked) o.scope[k] = false; });
        Object.keys(F.col).forEach(function (k) { if (F.col[k][0].checked) o.colors[k] = F.col[k][1].value; });
        Object.keys(F.nav).forEach(function (k) { var r = F.nav[k]; if (!r[0].checked && k !== 'dashboard.html') o.navHide.push(k); var n = r[1].value.trim(); if (n) o.navLabel[k] = n.slice(0, 40); if (!r[2].checked && k !== 'dashboard.html') o.pageOff.push(k); });
        [].slice.call(F.rep.children).forEach(function (r) { var f = r._f.value, t = r._t.value; if (f.length >= 2) o.replace.push({ from: f, to: t }); });
        o.look = {}; var L = F.lk; if (L.shadow.value) o.look.shadow = L.shadow.value; if (L.border.value) o.look.border = L.border.value; if (L.width.value) o.look.width = L.width.value; if (+L.lh.value >= 1.2 && +L.lh.value <= 2.2) o.look.lineHeight = +L.lh.value; if (L.links.checked) o.look.links = true; if (L.calm.checked) o.look.calm = true; if (L.sticky.checked) o.look.sticky = false;
        o.fontFile = st.fontFile || null; if (o.font === 'custom' && !o.fontFile) o.font = 'system';
        o.login = { title: F.lg.title.value.trim(), sub: F.lg.sub.value.trim(), bg: (st.login && st.login.bg) || '', dim: +F.lg.dim.value }; o.cssScope = {}; Object.keys(F.cs || {}).forEach(function (k) { var v = F.cs[k].value.trim(); if (v) o.cssScope[k] = v.slice(0, 20000); });
        o.mode = F.mode.value; o.modeStamp = st.modeStamp || 0;
        var shp = { hide: {} }, S2 = F.sh; if (F.ord.join() !== NAT) shp.order = F.ord.slice(); if (S2.cols.value) shp.cols = +S2.cols.value; if (+S2.imgH.value >= 80 && +S2.imgH.value <= 280) shp.imgH = +S2.imgH.value; if (+S2.heroH.value >= 160 && +S2.heroH.value <= 700) shp.heroH = +S2.heroH.value;
        if (st.shop && st.shop.heroImg) { shp.heroImg = st.shop.heroImg; shp.heroDim = +S2.heroDim.value; } Object.keys(S2.hide).forEach(function (k) { if (S2.hide[k].checked) shp.hide[k] = true; }); o.shop = shp;
        o.brand = {}; if (F.br.sizeOn.checked) o.brand.logoSize = +F.br.size.value; if (F.br.shape.value) o.brand.shape = F.br.shape.value; if (F.br.textOff.checked) o.brand.textOff = true;
        o.btn = {}; if (F.br.bshape.value) o.btn.shape = F.br.bshape.value; if (F.br.lift.checked) o.btn.lift = true; o.headFont = F.br.head.value; if (o.headFont === 'custom' && !o.fontFile) o.headFont = 'same';
        var fl = F.fl; o.float = { on: fl.on.checked, wa: fl.wa.value.trim(), call: fl.call.value.trim(), msg: fl.msg.value.trim(), side: fl.side.value, bottom: fl.high.checked ? 'high' : '' };
        o.links = [].slice.call(F.lk2.children).map(function (r) { return { label: r._l.value.trim(), url: r._u.value.trim() }; }).filter(function (x) { return x.label && x.url; }).slice(0, 8);
        o.social = {}; Object.keys(F.so).forEach(function (k) { var v = F.so[k].value.trim(); if (v) o.social[k] = v; });
        o.schedule = [].slice.call(F.sch.children).map(function (r) { var f = r._f; if (!f.from.value || !f.to.value) return null; var x = { on: f.on.checked, name: f.name.value.trim(), from: f.from.value, to: f.to.value }; if (f.text.value.trim()) { x.text = f.text.value.trim(); x.tone = f.tone.value; } if (f.accent.checked) { x.c1 = f.c1.value; x.c2 = f.c2.value; } return x; }).filter(Boolean).slice(0, 12);
        var b = F.b; o.banner = { on: b.on.checked, text: b.text.value.trim(), tone: b.tone.value, audience: b.aud.value, link: b.link.value.trim(), linkText: b.ltext.value.trim(), until: b.until.value };
        o.hideSel = F.hide.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 40);
        return o;
      }
      function applyPreset(p) {
        F.font.value = p.font; F.fs.value = p.fontScale; F.fsv.textContent = p.fontScale + '%'; F.radius.value = p.radius; F.density.value = p.density;
        Object.keys(F.col).forEach(function (k) { var v = p.colors[k]; F.col[k][0].checked = !!v; if (v) F.col[k][1].value = v; });
        root._presetC = p.c; preview();
      }
      function preview() { try { MCSite.preview(read()); } catch (e) { } try { loadPrev(); } catch (e) { } }
      function snap(note) {
        var hh = rj(HKEY, []), curNow = rj(KEY, null); if (!curNow) return;
        hh.unshift({ at: new Date().toISOString(), note: note, cfg: curNow }); wj(HKEY, hh.slice(0, 10));
      }
      function save() {
        var o = read(), bad = o.hideSel.filter(function (s) { return !/^[a-zA-Z0-9_\-#.\[\]="':>+~* ,()]+$/.test(s) || /[{};]/.test(s); });
        if (bad.length) return c.bad('অবৈধ সিলেক্টর: ' + bad[0]);
        if (o.banner.on && !o.banner.text) return c.bad('ব্যানার চালু রাখলে বার্তা লিখুন');
        if (o.float.on && !(o.float.wa || o.float.call)) return c.bad('ফ্লোটিং বাটন চালু রাখলে অন্তত একটি নম্বর দিন');
        var badL = o.links.filter(function (x) { return !/^(https?:\/\/|mailto:|tel:|[A-Za-z0-9_\-\/]+\.html(#.*)?$|#)/.test(x.url); }); if (badL.length) return c.bad('ফুটার লিংক ঠিক নয়: ' + badL[0].url);
        var badS = Object.keys(o.social).filter(function (k) { return !/^https?:\/\//.test(o.social[k]); }); if (badS.length) return c.bad('সোশ্যাল লিংক https:// দিয়ে শুরু হতে হবে: ' + badS[0]);
        if (o.pageOff.length >= PAGES.length - 1 && !confirm('প্রায় সব পেজ বন্ধ করছেন — শুধু Admin কাজ করতে পারবে। চালিয়ে যাবেন?')) return;
        var oldC = rj(KEY, {}) || {}; o.modeStamp = oldC.modeStamp || 0; if (o.mode !== 'keep' && o.mode !== (oldC.mode || 'keep')) o.modeStamp = Date.now();
        var NAMES = { font: 'ফন্ট', fontScale: 'সাইজ', radius: 'কোণ', density: 'ঘনত্ব', colors: 'রং', navHide: 'মেনু লুকানো', navLabel: 'মেনুর নাম', pageOff: 'বন্ধ পেজ', replace: 'লেখা বদল', banner: 'ব্যানার', hideSel: 'লুকানো অংশ', css: 'CSS', cssScope: 'স্কোপ CSS', footer: 'ফুটার', favicon: 'ফেভিকন', titleSuffix: 'টাইটেল', look: 'ফাইন-টিউনিং', shop: 'শপ হোমপেজ', brand: 'লোগো', btn: 'বাটন', headFont: 'হেডিং ফন্ট', float: 'ফ্লোটিং বাটন', links: 'ফুটার লিংক', social: 'সোশ্যাল', fontFile: 'ফন্ট ফাইল', login: 'লগইন পেজ', schedule: 'উৎসব-সূচি', mode: 'কালার মোড', scope: 'কোথায় চলবে' };
        var EMPTY = { '': 1, system: 1, normal: 1, keep: 1, 100: 1, info: 1, all: 1, ok: 1, 0.25: 1 };
        function nz(v) { if (v == null || v === false || EMPTY[v] === 1 && typeof v !== 'object') return null; if (Array.isArray(v)) { var a = v.map(nz).filter(function (x) { return x != null; }); return a.length ? a : null; } if (typeof v === 'object') { var r = {}, n = 0; Object.keys(v).sort().forEach(function (k) { var q = nz(v[k]); if (q != null) { r[k] = q; n++; } }); return n ? r : null; } return v; }
        var chg = Object.keys(NAMES).filter(function (k) { return JSON.stringify(nz(o[k])) !== JSON.stringify(nz(oldC[k])); }).map(function (k) { return NAMES[k]; });
        if (!chg.length) return c.ok('কিছু বদলায়নি — আগের সেভের মতোই');
        snap('সেভের আগের সংস্করণ');
        wj(KEY, o);
        if (root._presetC) { var T = rj('pharmacy_theme', {}); T.c1 = root._presetC[0]; T.c2 = root._presetC[1]; wj('pharmacy_theme', T); root._presetC = null; }
        try { c.audit('Site Studio saved (' + Object.keys(o.colors).length + ' colors, ' + o.replace.length + ' text rules, ' + o.navHide.length + ' hidden menus, ' + o.pageOff.length + ' pages off)'); } catch (e) { }
        c.ok('সেভ হয়েছে (বদলেছে: ' + chg.join(', ') + ') — অন্য খোলা পেজ রিলোড করলে প্রয়োগ হবে'); drawHist(); preview();
      }
      function drawHist() {
        var hh = rj(HKEY, []);
        hist.replaceChildren(el('h4', { style: 'margin:.8rem 0 .3rem' }, '🕘 আগের সংস্করণ (সর্বশেষ ১০টি)'), hh.length ? el('div', {}, hh.map(function (e, i) {
          return el('div', { style: 'display:flex;gap:.5rem;align-items:center;padding:.25rem 0;border-bottom:1px solid var(--br)' }, [el('span', { style: 'flex:1;font-size:.9rem' }, new Date(e.at).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' }) + ' — ' + (e.note || '')),
            el('button', { type: 'button', class: 'btn2', onclick: function () { if (!confirm('এই সংস্করণ ফিরিয়ে আনবেন? (বর্তমানটিও ইতিহাসে থাকবে)')) return; snap('রিস্টোরের আগে'); wj(KEY, e.cfg); c.ok('রিস্টোর হয়েছে'); c.show('site'); } }, '↩ ফিরিয়ে আনুন')]);
        })) : el('p', { class: 'muted' }, 'এখনও কিছু নেই।'));
      }
      var fileIn = el('input', { type: 'file', accept: 'application/json', hidden: true, onchange: function (e) {
        var f = e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () {
          try { var o = JSON.parse(r.result); if (!o || o.app !== 'medicare-site' || !o.cfg || typeof o.cfg !== 'object') throw 0; snap('ইমপোর্টের আগে'); o.cfg.v = 1; wj(KEY, o.cfg); c.ok('ইমপোর্ট হয়েছে'); c.show('site'); } catch (x) { c.bad('ফাইলটি Site Studio ব্যাকআপ নয়'); }
        }; r.readAsText(f); } });
      out.append(el('div', { style: 'display:flex;gap:.5rem;flex-wrap:wrap' }, [
        el('button', { type: 'button', class: 'btn', onclick: save }, '💾 সেভ করুন'),
        el('button', { type: 'button', class: 'btn2', onclick: function () { preview(); c.ok('এই পেজে প্রিভিউ — সেভ না করলে রিলোডে চলে যাবে'); } }, '👁 প্রিভিউ'),
        el('button', { type: 'button', class: 'btn2', onclick: function () { if (!confirm('সব কাস্টমাইজেশন মুছে ডিফল্টে ফিরবেন? (ইতিহাসে থাকবে)')) return; snap('রিসেটের আগে'); localStorage.removeItem(KEY); try { MCSite.clear(); } catch (e) { } c.ok('ডিফল্টে ফিরেছে'); c.show('site'); } }, '♻️ রিসেট'),
        el('button', { type: 'button', class: 'btn2', onclick: function () { var b = new Blob([JSON.stringify({ app: 'medicare-site', at: new Date().toISOString(), cfg: read(), theme: rj('pharmacy_theme', {}) }, null, 2)], { type: 'application/json' }), a = el('a', { href: URL.createObjectURL(b), download: 'site-studio-' + new Date().toISOString().slice(0, 10) + '.json' }); document.body.append(a); a.click(); a.remove(); } }, '⬇ এক্সপোর্ট'),
        el('button', { type: 'button', class: 'btn2', onclick: function () { fileIn.click(); } }, '⬆ ইমপোর্ট'), fileIn]), hist);
      drawHist(); root.append(out);
      ['input', 'change'].forEach(function (ev) { root.addEventListener(ev, function (e) { if (e.target === fileIn) return; clearTimeout(root._t); root._t = setTimeout(preview, 250); }); });
      setTimeout(preview, 0);
      return root;
    };
    var bi = -1; x.tabs.forEach(function (t, i) { if (t[0] === 'brand') bi = i; });
    x.tabs.splice(bi + 1, 0, ['site', '🧩 Site Studio']);
    return x;
  };
})();
