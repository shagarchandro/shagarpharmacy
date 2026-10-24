/* v72 — Control Center: নতুন Overview (আজকের হিসাব, ৭ দিনের বিক্রি, সবচেয়ে বেশি বিক্রি, স্টক/মেয়াদ/বাকি সতর্কতা),
   Ctrl+K কমান্ড-পেলেট (যেকোনো ট্যাবে ঝটপট যান), 🧳 Config ট্যাব (সেটিং এক্সপোর্ট/ইম্পোর্ট — অন্য দোকানে বা নতুন ইনস্টলে নেওয়ার জন্য)। */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  var dh6 = function (t) { return new Date((t == null ? Date.now() : t) + 6 * 3600e3).toISOString().slice(0, 10); };
  window.CCX = function (c) {
    var x = prev(c), h = c.h, tbl = c.tbl, btn = c.btn, tk = c.tk, rj = c.rj, wj = c.wj;
    var money = function (n) { return tk(Math.round(n || 0)); };
    function saleDay(s) { return s.date || (s.at ? dh6(new Date(s.at).getTime()) : ''); }
    x.panels.overview = function () {
      var med = rj('pharmacy_medicines', []), cus = rj('pharmacy_customers', []), sup = rj('pharmacy_suppliers', []), pur = rj('pharmacy_purchases', []), rx = rj('pharmacy_prescriptions', []);
      var sales = rj('pharmacy_sales', []).filter(function (s) { return s.real && s.status !== 'Voided'; }), D = c.db(), today = dh6(), soon = dh6(Date.now() + 30 * 864e5);
      var tSales = sales.filter(function (s) { return saleDay(s) === today; }), tTot = tSales.reduce(function (a, s) { return a + (+s.total || 0); }, 0);
      var oToday = (D.orders || []).filter(function (o) { return dh6(new Date(o.at).getTime()) === today && o.status !== 'Cancelled'; });
      var oPend = (D.orders || []).filter(function (o) { return ['Pending', 'Prescription Review', 'Confirmed'].indexOf(o.status) > -1; });
      var exp = med.filter(function (m) { return m.expiryDate && m.expiryDate < today; }).length, soonN = med.filter(function (m) { return m.expiryDate && m.expiryDate >= today && m.expiryDate <= soon; }).length;
      var low = med.filter(function (m) { return +m.stock > 0 && +m.stock <= +(m.minStock || 0); }).length, out = med.filter(function (m) { return !(+m.stock > 0); }).length;
      var due = cus.reduce(function (a, u) { return a + (+u.due > 0 ? +u.due : 0); }, 0), dueN = cus.filter(function (u) { return +u.due > 0; }).length;
      var rxN = rx.filter(function (r) { return r.status === 'pending' || r.status === 'partial'; }).length + (D.orders || []).filter(function (o) { return o.status === 'Prescription Review'; }).length;
      var last = localStorage.getItem('pharmacy_lastbackup') || localStorage.getItem('mc_lastbackup'), days = last ? Math.floor((Date.now() - new Date(last)) / 864e5) : null;
      var st = function (a, b, href, cls) { return h('a', { class: 'cc-card cc-stat', href: href || '#', style: 'text-decoration:none;color:inherit' }, h('b', { class: cls || '' }, a), h('span', {}, b)); };
      // ৭ দিন
      var d7 = []; for (var i = 6; i >= 0; i--) { var d = dh6(Date.now() - i * 864e5); d7.push({ d: d, v: sales.filter(function (s) { return saleDay(s) === d; }).reduce(function (a, s) { return a + (+s.total || 0); }, 0) }); }
      var mx = Math.max.apply(null, d7.map(function (z) { return z.v; }).concat([1]));
      var bars = h('div', { style: 'display:flex;gap:6px;align-items:flex-end;height:110px;margin:.4rem 0' }, d7.map(function (z) { return h('div', { style: 'flex:1;text-align:center;font-size:.72rem;color:var(--mut)' }, h('div', { style: 'height:' + Math.max(3, Math.round(z.v / mx * 80)) + 'px;background:' + (z.d === today ? 'var(--pri,#0f766e)' : '#99d5cd') + ';border-radius:5px 5px 0 0', title: money(z.v) }), z.d.slice(8), h('div', {}, z.v ? Math.round(z.v) : '')); }));
      // সেরা বিক্রি (৩০ দিন)
      var from = dh6(Date.now() - 30 * 864e5), tally = {};
      sales.filter(function (s) { return saleDay(s) >= from; }).forEach(function (s) { (s.items || []).forEach(function (it) { var k = it.name || ('#' + it.id); var t = tally[k] || (tally[k] = { q: 0, v: 0 }); t.q += +(it.quantity || it.qty || 0); t.v += +(it.total || (it.price * (it.quantity || it.qty)) || 0); }); });
      var top = Object.keys(tally).map(function (k) { return [k, tally[k]]; }).sort(function (a, b) { return b[1].v - a[1].v; }).slice(0, 5);
      var alerts = [];
      if (exp) alerts.push(['bad', exp + 'টি ওষুধ মেয়াদ-উত্তীর্ণ — সরান/write-off করুন', 'medicines.html']);
      if (soonN) alerts.push(['warn', soonN + 'টি ওষুধের মেয়াদ ৩০ দিনের মধ্যে শেষ', 'medicines.html']);
      if (out) alerts.push(['warn', out + 'টি ওষুধের স্টক শেষ', 'reorder.html']);
      if (low) alerts.push(['warn', low + 'টি ওষুধ ন্যূনতম স্টকের কাছাকাছি', 'reorder.html']);
      if (rxN) alerts.push(['warn', rxN + 'টি প্রেসক্রিপশন অপেক্ষায়', 'prescriptions.html']);
      if (oPend.length) alerts.push(['warn', oPend.length + 'টি অনলাইন অর্ডার প্রসেসের অপেক্ষায়', 'admin/index.html#orders']);
      if (dueN) alerts.push(['warn', dueN + ' জন গ্রাহকের বাকি মোট ' + money(due), 'customers.html']);
      if (days == null || days > 7) alerts.push(['bad', last ? 'শেষ ব্যাকআপ ' + days + ' দিন আগে' : 'এখনো কোনো ব্যাকআপ নেওয়া হয়নি', 'backup.html']);
      return h('div', {}, h('h2', {}, '🏠 Overview · আজ ' + today),
        h('div', { class: 'cc-grid' }, st(money(tTot), 'আজকের POS বিক্রি (' + tSales.length + 'টি বিল)', 'sales.html'), st(oToday.length, 'আজকের অনলাইন অর্ডার', 'admin/index.html#orders'), st(oPend.length, 'প্রসেসের অপেক্ষায়', 'admin/index.html#orders', oPend.length ? 'bad' : ''), st(rxN, 'প্রেসক্রিপশন অপেক্ষায়', 'prescriptions.html'),
          st(low + out, 'কম/শেষ স্টক', 'reorder.html', low + out ? 'bad' : ''), st(exp + '/' + soonN, 'মেয়াদ-শেষ / ৩০ দিনে', 'medicines.html', exp ? 'bad' : ''), st(money(due), 'গ্রাহকের মোট বাকি (' + dueN + ' জন)', 'customers.html'), st(money(sales.reduce(function (a, s) { return a + (+s.total || 0); }, 0)), 'মোট POS বিক্রি (' + sales.length + ')', 'reports.html')),
        h('div', { class: 'cc-two' }, h('div', { class: 'cc-card' }, h('h3', {}, 'গত ৭ দিনের বিক্রি'), bars),
          h('div', { class: 'cc-card' }, h('h3', {}, 'সেরা ৫ (৩০ দিন)'), tbl(['ওষুধ', 'পরিমাণ', 'টাকা'], top.map(function (t) { return h('tr', {}, h('td', {}, t[0]), h('td', {}, String(t[1].q)), h('td', {}, money(t[1].v))); }), 'এখনো বিক্রি নেই'))),
        h('h2', {}, 'নজর দিন'), alerts.length ? h('div', {}, alerts.map(function (a) { return h('p', {}, h('span', { class: 'pill ' + a[0] }, a[0] === 'bad' ? 'জরুরি' : 'দেখুন'), ' ', h('a', { href: a[2] }, a[1])); })) : h('p', { class: 'ok' }, '✔ সব ঠিক আছে।'),
        h('h2', {}, 'দ্রুত কাজ'),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: function () { var r = window.mcSync(); r.ok ? c.ok('Synced: ' + r.upserted + ' product(s), ' + r.applied + ' online order(s)') : c.bad(r.msgs[0] || 'Sync failed'); c.audit('Manual sync'); c.show('overview'); } }, '🔄 শপ ও স্টক সিঙ্ক'), h('a', { class: 'btn2', href: 'backup.html' }, '💾 ব্যাকআপ/রিস্টোর'), h('a', { class: 'btn2', href: 'admin/login.html' }, '⚙️ Ops Panel'), h('a', { class: 'btn2', href: 'shop.html' }, '🛒 Shop'), h('button', { class: 'btn2', onclick: openPalette }, '🔎 খুঁজুন (Ctrl+K)')),
        h('p', { class: 'muted' }, 'মোট: ' + med.length + ' ওষুধ · ' + cus.length + ' গ্রাহক · ' + sup.length + ' সাপ্লায়ার · ' + pur.length + ' ক্রয় · ' + rx.length + ' প্রেসক্রিপশন · ' + (D.products || []).length + ' শপ-পণ্য'));
    };

    /* ---- 🧳 Config এক্সপোর্ট / ইম্পোর্ট ---- */
    var CFG_KEYS = ['pharmacy_settings', 'pharmacy_roles', 'pharmacy_theme'];
    var SECRET = ['adminPin', 'opsPins'];
    function collect() {
      var o = { app: 'medicare-config', v: 1, at: new Date().toISOString(), keys: {} };
      CFG_KEYS.forEach(function (k) { var v = rj(k, null); if (v == null) return; if (k === 'pharmacy_settings') { v = JSON.parse(JSON.stringify(v)); SECRET.forEach(function (s) { delete v[s]; }); } o.keys[k] = v; });
      var D = c.db(); o.shop = { settings: D.settings, coupons: D.coupons || [] }; var sy = rj('mc_sync', null); if (sy) o.keys.mc_sync = { pub: sy.pub, auto: sy.auto };
      return o;
    }
    x.panels.config = function () {
      var box = h('div', {}), file = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
      var cur = collect(), n = Object.keys(cur.keys).length;
      file.addEventListener('change', function () {
        var f = file.files[0]; if (!f) return; f.text().then(function (t) {
          var j; try { j = JSON.parse(t); } catch (e) { return c.bad('ফাইলটি JSON নয়'); } if (!j || j.app !== 'medicare-config' || !j.keys) return c.bad('এটা MediCare config ফাইল নয়');
          var names = Object.keys(j.keys).concat(j.shop ? ['দোকান-সেটিং ও কুপন (' + (j.shop.coupons || []).length + 'টি)'] : []);
          Promise.resolve(window.MCD && MCD.confirm ? MCD.confirm('এই ফাইল থেকে বসবে: ' + names.join(', ') + '।\nএখনকার ওই সেটিংগুলো বদলে যাবে (পাসওয়ার্ড/PIN/ডেটা অক্ষত)। এগিয়ে যাবেন?', { title: 'Config ইম্পোর্ট', danger: true }) : confirm('Import config?')).then(function (yes) {
            if (!yes) return;
            Object.keys(j.keys).forEach(function (k) { if (CFG_KEYS.indexOf(k) < 0 && k !== 'mc_sync') return; var v = j.keys[k]; if (k === 'pharmacy_settings') { var old = rj(k, {}); v = Object.assign({}, v); SECRET.forEach(function (s) { if (old[s] != null) v[s] = old[s]; }); } if (k === 'mc_sync') { var s0 = rj('mc_sync', { pub: {}, applied: {} }); s0.pub = v.pub || {}; s0.auto = !!v.auto; v = s0; } wj(k, v); });
            if (j.shop) { var D = c.db(); if (j.shop.settings) D.settings = Object.assign({}, D.settings, j.shop.settings); if (Array.isArray(j.shop.coupons)) D.coupons = j.shop.coupons; c.save(D); }
            c.audit('Config imported (' + names.length + ' sections)'); c.ok('Config ইম্পোর্ট হয়েছে ✔'); setTimeout(function () { location.reload(); }, 700);
          });
        });
      });
      return h('div', {}, h('h2', {}, '🧳 Config'), h('p', { class: 'muted' }, 'শুধু সেটিং — ব্র্যান্ডিং/রুলস/রোল/ফিচার/কুপন/শপ-সেটিং। ওষুধ, বিক্রি, গ্রাহক, পাসওয়ার্ড, PIN এতে নেই। নতুন ইনস্টল বা দ্বিতীয় শাখায় একই সেটিং বসাতে কাজে লাগে।'),
        h('div', { class: 'cc-card' }, h('h3', {}, 'এখনকার config (' + n + ' + দোকান-সেটিং)'), tbl(['অংশ', 'আকার'], Object.keys(cur.keys).map(function (k) { return h('tr', {}, h('td', {}, k), h('td', {}, JSON.stringify(cur.keys[k]).length + ' B')); }).concat([h('tr', {}, h('td', {}, 'mc_db.settings + coupons'), h('td', {}, JSON.stringify(cur.shop).length + ' B'))])),
          h('div', { class: 'row' }, btn('⬇ Config এক্সপোর্ট', function () { var b = new Blob([JSON.stringify(collect(), null, 2)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'medicare-config-' + dh6() + '.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); c.audit('Config exported'); }, 'btn'), btn('⬆ Config ইম্পোর্ট', function () { file.click(); }, 'btn2'), file)));
    };
    x.tabs.splice(1, 0, ['config', '🧳 Config']);

    /* ---- Ctrl+K পেলেট ---- */
    function openPalette() {
      var tabs = [].slice.call(document.querySelectorAll('#tabs [role=tab]')); if (!tabs.length) return;
      var ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.55);display:flex;align-items:flex-start;justify-content:center;padding:12vh 12px 0';
      var bx = document.createElement('div'); bx.style.cssText = 'background:var(--card,#fff);color:var(--ink,#111);border-radius:14px;width:100%;max-width:440px;padding:12px;box-shadow:0 20px 50px rgba(0,0,0,.35)';
      var inp = document.createElement('input'); inp.placeholder = 'কোথায় যাবেন? (যেমন: coupon, backup, role…)'; inp.style.cssText = 'width:100%;box-sizing:border-box;padding:10px;font-size:16px;border:1px solid #cbd5e1;border-radius:10px'; var ul = document.createElement('div'); ul.style.cssText = 'margin-top:8px;max-height:50vh;overflow:auto'; var sel = 0, list = [];
      function draw() { var q = inp.value.trim().toLowerCase(); list = tabs.filter(function (t) { return !q || t.textContent.toLowerCase().indexOf(q) > -1; }); sel = Math.min(sel, Math.max(list.length - 1, 0)); ul.innerHTML = ''; list.forEach(function (t, i) { var b = document.createElement('button'); b.type = 'button'; b.textContent = t.textContent; b.style.cssText = 'display:block;width:100%;text-align:left;padding:9px 10px;border:0;border-radius:8px;font-size:15px;cursor:pointer;background:' + (i === sel ? '#e0f2f1' : 'transparent'); b.onclick = function () { go(t); }; ul.appendChild(b); }); if (!list.length) ul.textContent = 'কিছু পাওয়া যায়নি'; }
      function go(t) { ov.remove(); t.click(); }
      inp.addEventListener('input', function () { sel = 0; draw(); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Escape') ov.remove(); else if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, list.length - 1); draw(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); } else if (e.key === 'Enter' && list[sel]) go(list[sel]); });
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
      bx.append(inp, ul); ov.append(bx); document.body.append(ov); draw(); inp.focus();
    }
    if (!window.__ccPal) { window.__ccPal = 1; document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); } }); }
    return x;
  };
})();
