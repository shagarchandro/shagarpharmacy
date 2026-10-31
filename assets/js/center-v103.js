/* v103 — Control Center → 🧩 Site Studio: পুরো সাইট (শপ · স্টাফ পেজ · Ops Panel · লগইন) এক জায়গা থেকে কাস্টমাইজ।
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
      var cur = rj(KEY, {}), st = Object.assign({ v: 1, scope: {}, font: 'system', fontScale: 100, radius: '', density: 'normal', colors: {}, navHide: [], navLabel: {}, pageOff: [], replace: [], banner: {}, hideSel: [], css: '', footer: '', favicon: '', titleSuffix: '' }, JSON.parse(JSON.stringify(cur)));
      var F = {};   // field refs
      var root = el('div', {});
      var note = el('p', { class: 'muted' }, '🛟 জরুরি: কোনো পেজ বেঠিক দেখালে URL-এর শেষে ?nosite=1 যোগ করুন — সব কাস্টমাইজেশন সেই লোডে বন্ধ থাকবে। Control Center নিজে সবসময় সেফ মোডে চলে।');
      /* 1. presets */
      var presetBtns = PRESETS.map(function (p) { return el('button', { type: 'button', class: 'btn2', onclick: function () { applyPreset(p[1]); c.ok('"' + p[0] + '" ফর্মে বসেছে — প্রিভিউ দেখুন, ঠিক থাকলে সেভ করুন'); } }, p[0]); });
      root.append(note, card('🎯 রেডিমেড স্টাইল', 'এক ক্লিকে ফন্ট + কোণ + ঘনত্ব + রং। (Branding-এর রঙ-জোড়াও বদলাবে — সেভ করলে।)', [el('div', { class: 'row', style: 'display:flex;gap:.5rem;flex-wrap:wrap' }, presetBtns)]));
      /* 2. look & feel */
      F.font = sel([['system', 'সিস্টেম (ডিফল্ট)'], ['rounded', 'Rounded'], ['bangla', 'বাংলা-বান্ধব'], ['serif', 'Serif (বইয়ের মতো)'], ['mono', 'Monospace']], st.font);
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
      /* 6. advanced */
      F.scope = {}; var scopeEls = [['shop', '🛍 গ্রাহক শপ'], ['staff', '🖥 স্টাফ পেজ'], ['ops', '🧰 Ops Panel'], ['login', '🔑 লগইন']].map(function (k) { var i = el('input', { type: 'checkbox', checked: (st.scope || {})[k[0]] !== false }); F.scope[k[0]] = i; return el('label', { class: 'cc-chk', style: 'display:flex;gap:.4rem;align-items:center' }, [i, k[1]]); });
      F.footer = el('input', { type: 'text', value: st.footer || '', maxLength: 200, placeholder: '© ২০২৬ আমার ফার্মেসি · হটলাইন ০১৭…', style: 'width:100%' });
      F.fav = el('input', { type: 'text', value: st.favicon || '', maxLength: 4, placeholder: '💊', style: 'width:5rem' });
      F.suf = el('input', { type: 'text', value: st.titleSuffix || '', maxLength: 40, placeholder: 'যেমন: ঢাকা', style: 'width:100%' });
      F.hide = el('textarea', { rows: 3, placeholder: '.promo-strip\n#chatBtn', style: 'width:100%;font-family:monospace' }, (st.hideSel || []).join('\n'));
      F.css = el('textarea', { rows: 6, placeholder: '.btn{letter-spacing:.02em}', style: 'width:100%;font-family:monospace' }, st.css || '');
      root.append(card('🧱 অ্যাডভান্সড', 'কোন জায়গায় কাস্টমাইজেশন চলবে + ফুটার, ফেভিকন, ট্যাব-টাইটেল, লুকানোর CSS-সিলেক্টর ও নিজের CSS। (বাইরের @import/url ব্লক করা — গোপনীয়তা ও অফলাইনের জন্য)', [
        el('div', { style: 'display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:.6rem' }, scopeEls), lab('ফুটার লেখা (শপ/স্টাফ পেজের নিচে)', F.footer), el('div', { class: 'cc-two' }, [lab('ফেভিকন ইমোজি', F.fav), lab('ট্যাব-টাইটেলের শেষে যোগ', F.suf)]),
        lab('লুকাতে চাওয়া অংশ (প্রতি লাইনে একটি CSS সিলেক্টর)', F.hide), lab('নিজের CSS', F.css)]));
      /* 7. actions */
      var out = el('div', { class: 'cc-card' }), hist = el('div', {});
      function read() {
        var o = { v: 1, scope: {}, font: F.font.value, fontScale: +F.fs.value, radius: F.radius.value, density: F.density.value, colors: {}, navHide: [], navLabel: {}, pageOff: [], replace: [], banner: {}, hideSel: [], css: F.css.value.slice(0, 20000), footer: F.footer.value.trim(), favicon: F.fav.value.trim(), titleSuffix: F.suf.value.trim() };
        Object.keys(F.scope).forEach(function (k) { if (!F.scope[k].checked) o.scope[k] = false; });
        Object.keys(F.col).forEach(function (k) { if (F.col[k][0].checked) o.colors[k] = F.col[k][1].value; });
        Object.keys(F.nav).forEach(function (k) { var r = F.nav[k]; if (!r[0].checked && k !== 'dashboard.html') o.navHide.push(k); var n = r[1].value.trim(); if (n) o.navLabel[k] = n.slice(0, 40); if (!r[2].checked && k !== 'dashboard.html') o.pageOff.push(k); });
        [].slice.call(F.rep.children).forEach(function (r) { var f = r._f.value, t = r._t.value; if (f.length >= 2) o.replace.push({ from: f, to: t }); });
        var b = F.b; o.banner = { on: b.on.checked, text: b.text.value.trim(), tone: b.tone.value, audience: b.aud.value, link: b.link.value.trim(), linkText: b.ltext.value.trim(), until: b.until.value };
        o.hideSel = F.hide.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 40);
        return o;
      }
      function applyPreset(p) {
        F.font.value = p.font; F.fs.value = p.fontScale; F.fsv.textContent = p.fontScale + '%'; F.radius.value = p.radius; F.density.value = p.density;
        Object.keys(F.col).forEach(function (k) { var v = p.colors[k]; F.col[k][0].checked = !!v; if (v) F.col[k][1].value = v; });
        root._presetC = p.c; preview();
      }
      function preview() { try { MCSite.preview(read()); } catch (e) { } }
      function snap(note) {
        var hh = rj(HKEY, []), curNow = rj(KEY, null); if (!curNow) return;
        hh.unshift({ at: new Date().toISOString(), note: note, cfg: curNow }); wj(HKEY, hh.slice(0, 10));
      }
      function save() {
        var o = read(), bad = o.hideSel.filter(function (s) { return !/^[a-zA-Z0-9_\-#.\[\]="':>+~* ,()]+$/.test(s) || /[{};]/.test(s); });
        if (bad.length) return c.bad('অবৈধ সিলেক্টর: ' + bad[0]);
        if (o.banner.on && !o.banner.text) return c.bad('ব্যানার চালু রাখলে বার্তা লিখুন');
        if (o.pageOff.length >= PAGES.length - 1 && !confirm('প্রায় সব পেজ বন্ধ করছেন — শুধু Admin কাজ করতে পারবে। চালিয়ে যাবেন?')) return;
        snap('সেভের আগের সংস্করণ');
        wj(KEY, o);
        if (root._presetC) { var T = rj('pharmacy_theme', {}); T.c1 = root._presetC[0]; T.c2 = root._presetC[1]; wj('pharmacy_theme', T); root._presetC = null; }
        try { c.audit('Site Studio saved (' + Object.keys(o.colors).length + ' colors, ' + o.replace.length + ' text rules, ' + o.navHide.length + ' hidden menus, ' + o.pageOff.length + ' pages off)'); } catch (e) { }
        c.ok('সেভ হয়েছে — অন্য খোলা পেজ রিলোড করলে/খুললে প্রয়োগ হবে'); drawHist(); preview();
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
