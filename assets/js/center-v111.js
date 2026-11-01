/* v111 — Control Center: চারটি নতুন ট্যাব
   💹 লাভ-ক্ষতি (P&L) · 🎯 বিক্রির টার্গেট · 👥 গ্রাহক সেগমেন্ট · 📦 স্টক ইন্টেলিজেন্স
   শুধু পড়ে হিসাব করে (টার্গেট ছাড়া কিছু লেখে না)। */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var dh = function (t) { return new Date((t == null ? Date.now() : t) + 6 * 3600e3).toISOString().slice(0, 10); };
  var tk = function (n) { return (n < 0 ? '−' : '') + '৳' + Math.abs(Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN'); };
  var num = function (v) { return +v || 0; };
  function csv(name, rows) {
    var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"'; };
    var b = new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }
  function css() {
    if (document.getElementById('v111css')) return; var s = document.createElement('style'); s.id = 'v111css';
    s.textContent = '.v111k{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.6rem;margin:.6rem 0}.v111k div{border:1px solid var(--br);border-radius:12px;padding:.6rem .8rem;background:var(--card)}' +
      '.v111k b{display:block;font-size:1.25rem}.v111k small{color:var(--mut)}.v111k .bad b{color:#b42318}.v111k .good b{color:#0b6b3a}' +
      '.v111pb{height:14px;border-radius:99px;background:var(--br);overflow:hidden;margin:.3rem 0 .8rem}.v111pb i{display:block;height:100%;background:linear-gradient(90deg,#2e9e5b,#7fd1a0)}' +
      '.v111b{display:flex;gap:6px;align-items:flex-end;height:120px;margin:.4rem 0}.v111b div{flex:1;text-align:center;font-size:.72rem;color:var(--mut)}.v111b i{display:block;background:#99d5cd;border-radius:5px 5px 0 0}.v111b i.hit{background:#2e9e5b}' +
      '.v111tag{display:inline-block;border-radius:99px;padding:.05rem .55rem;font-size:.78rem;font-weight:700;background:#e5efec}.v111tag.vip{background:#fff0c2}.v111tag.dorm{background:#fde2e0}.v111tag.new{background:#d9f5e5}.v111tag.due{background:#ffe1cc}' +
      '.v111n{font-variant-numeric:tabular-nums;text-align:right}';
    document.head.appendChild(s);
  }
  /* সব বিক্রি এক ছাঁচে: POS + অনলাইন */
  function records(D, meds, prods) {
    var byId = {}, byName = {}, pcost = {};
    meds.forEach(function (m) { byId[m.id] = m; byName[String(m.name || '').toLowerCase()] = m; });
    (D.products || []).forEach(function (p) { pcost[p.id] = p; });
    var out = [];
    rj('pharmacy_sales', []).forEach(function (s) {
      if (!s || !s.real || s.status === 'Voided') return;
      var d = s.date || dh(Date.parse(s.at)); if (!d) return;
      out.push({ d: d, src: 'POS', total: num(s.total), cust: (s.customer || '').trim(), phone: s.phone || '', items: (s.items || []).map(function (i) { var m = byId[i.id] || byName[String(i.name || '').toLowerCase()]; return { name: i.name, q: num(i.quantity || i.qty), v: num(i.price) * num(i.quantity || i.qty), cost: m && num(m.purchasePrice) > 0 ? num(m.purchasePrice) * num(i.quantity || i.qty) : null }; }) });
    });
    (D.orders || []).forEach(function (o) {
      if (!o || o.status === 'Cancelled') return; var d = o.at ? dh(Date.parse(o.at)) : ''; if (!d) return;
      out.push({ d: d, src: 'Online', total: num(o.total), cust: (o.customer || '').trim(), phone: o.phone || o.mobile || '', items: (o.items || []).map(function (i) { var p = pcost[i.pid]; return { name: i.name, q: num(i.qty), v: num(i.price) * num(i.qty), cost: p && num(p.cost) > 0 ? num(p.cost) * num(i.qty) : null }; }) });
    });
    return out;
  }

  window.CCX = function (c) {
    var x = prev(c), h = c.h, tbl = c.tbl;
    var kp = function (rows) { return h('div', { class: 'v111k' }, rows.map(function (r) { return h('div', { class: r[2] || '' }, h('b', {}, r[1]), h('small', {}, r[0])); })); };

    /* ================= 💹 লাভ-ক্ষতি ================= */
    var PL = 30;
    x.panels.pnl = function () {
      css(); var D = c.db(), meds = rj('pharmacy_medicines', []), now = new Date(Date.now() + 6 * 3600e3);
      var from = PL === 0 ? dh().slice(0, 8) + '01' : dh(Date.now() - PL * 864e5);
      var sel = h('select', { onchange: function (e) { PL = +e.target.value; c.show('pnl'); } }, [[0, 'এই মাস'], [7, 'শেষ ৭ দিন'], [30, 'শেষ ৩০ দিন'], [90, 'শেষ ৯০ দিন'], [365, 'শেষ ১ বছর']].map(function (o) { return h('option', Object.assign({ value: o[0] }, o[0] === PL ? { selected: 'selected' } : {}), o[1]); }));
      var R = records(D, meds).filter(function (r) { return r.d >= from; }), rev = 0, cogs = 0, unk = 0, P = {};
      R.forEach(function (r) { rev += r.total; r.items.forEach(function (i) { var p = P[i.name] || (P[i.name] = { n: i.name, q: 0, v: 0, c: 0, unk: 0 }); p.q += i.q; p.v += i.v; if (i.cost == null) { unk += 1; p.unk++; } else { cogs += i.cost; p.c += i.cost; } }); });
      var exp = (D.expenses || []).filter(function (e) { return e && e.at && dh(Date.parse(e.at)) >= from && !/^Supplier payment/i.test(e.what || ''); }), expT = exp.reduce(function (a, e) { return a + num(e.amt); }, 0);
      var itemV = R.reduce(function (a, r) { return a + r.items.reduce(function (b, i) { return b + i.v; }, 0); }, 0), gp = itemV - cogs, net = gp - expT, mg = itemV ? gp / itemV * 100 : 0;
      var rows = Object.keys(P).map(function (k) { return P[k]; }).filter(function (p) { return !p.unk; }).map(function (p) { p.gp = p.v - p.c; p.m = p.v ? p.gp / p.v * 100 : 0; return p; });
      var best = rows.slice().sort(function (a, b) { return b.gp - a.gp; }).slice(0, 5), worst = rows.slice().sort(function (a, b) { return a.m - b.m; }).slice(0, 5);
      var line = function (p) { return h('tr', {}, h('td', {}, p.n), h('td', { class: 'v111n' }, p.q), h('td', { class: 'v111n' }, tk(p.v)), h('td', { class: 'v111n' }, tk(p.gp)), h('td', { class: 'v111n' }, p.m.toFixed(1) + '%')); };
      var H = ['পণ্য', 'পিস', 'বিক্রি', 'লাভ', 'মার্জিন'];
      return h('div', {}, h('h2', {}, '💹 লাভ-ক্ষতি (P&L)'), h('p', { class: 'muted' }, 'POS + অনলাইন অর্ডার, ক্রয়-মূল্য (purchasePrice/cost) ধরে হিসাব। সময়: ', sel, ' (', from, ' থেকে)'),
        kp([['মোট আদায় (ডেলিভারি সহ)', tk(rev)], ['পণ্য-বিক্রি', tk(itemV)], ['পণ্যের খরচ (COGS)', tk(cogs)], ['মোট লাভ', tk(gp), gp < 0 ? 'bad' : 'good'], ['মার্জিন', mg.toFixed(1) + '%'], ['খরচ (Expenses)', tk(expT)], ['নিট লাভ', tk(net), net < 0 ? 'bad' : 'good']]),
        unk ? h('p', { class: 'muted', role: 'note' }, '⚠ ' + unk + 'টি বিক্রির লাইনে ক্রয়-মূল্য নেই — এগুলো খরচে ধরা হয়নি, তাই লাভ বেশি দেখাতে পারে। ওষুধের purchasePrice দিন (🧰 Bulk Tools বা Medicines পেজে)।') : '',
        h('p', { class: 'muted' }, 'Supplier payment-এর এন্ট্রি Expenses থেকে বাদ (নইলে খরচ দুইবার গোনা হত)।'),
        h('h3', {}, '🏆 সবচেয়ে বেশি লাভ'), tbl(H, best.map(line), 'এখনো দাম-সহ বিক্রি নেই'), h('h3', {}, '📉 সবচেয়ে কম মার্জিন'), tbl(H, worst.map(line), 'এখনো দাম-সহ বিক্রি নেই'),
        h('p', {}, c.btn('⬇ CSV', function () { csv('pnl-' + dh() + '.csv', [['Product', 'Qty', 'Sales', 'Profit', 'Margin%']].concat(rows.map(function (p) { return [p.n, p.q, p.v, p.gp, p.m.toFixed(1)]; }))); }, 'btn')));
    };

    /* ================= 🎯 টার্গেট ================= */
    x.panels.target = function () {
      css(); var D = c.db(), T = rj('pharmacy_target', { daily: 0, monthly: 0 }), R = records(D, []), today = dh(), ym = today.slice(0, 7);
      var by = {}; R.forEach(function (r) { by[r.d] = (by[r.d] || 0) + r.total; });
      var td = by[today] || 0, mtd = Object.keys(by).filter(function (d) { return d.slice(0, 7) === ym; }).reduce(function (a, d) { return a + by[d]; }, 0);
      var now = new Date(Date.now() + 6 * 3600e3), dom = now.getUTCDate(), dim = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getDate(), proj = mtd / dom * dim;
      var pct = function (a, b) { return b > 0 ? Math.min(100, Math.round(a / b * 100)) : 0; };
      var f = h('form', { class: 'cc-form', onsubmit: function (e) {
        e.preventDefault(); var t = e.target.elements, d = num(t.daily.value), m = num(t.monthly.value);
        if (d < 0 || m < 0 || d > 1e8 || m > 1e9) return c.bad('টার্গেট ০ থেকে বড় ও যুক্তিসঙ্গত হতে হবে');
        localStorage.setItem('pharmacy_target', JSON.stringify({ daily: d, monthly: m })); c.audit('Sales target set (daily ' + d + ', monthly ' + m + ')'); c.ok('টার্গেট সেভ হয়েছে'); c.show('target');
      } }, h('div', { class: 'two' }, c.field('দৈনিক টার্গেট ৳', c.inp('daily', T.daily || '', 'number', { min: 0 })), c.field('মাসিক টার্গেট ৳', c.inp('monthly', T.monthly || '', 'number', { min: 0 }))), h('button', { class: 'btn' }, 'সেভ'));
      var bar = function (v, t) { return h('div', { class: 'v111pb', role: 'progressbar', 'aria-valuenow': pct(v, t), 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: 'width:' + pct(v, t) + '%' })); };
      var months = []; for (var i = 5; i >= 0; i--) { var dt = new Date(now.getUTCFullYear(), now.getUTCMonth() - i, 1), k = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); months.push([k, Object.keys(by).filter(function (d) { return d.slice(0, 7) === k; }).reduce(function (a, d) { return a + by[d]; }, 0)]); }
      var mx = Math.max.apply(null, months.map(function (m) { return m[1]; }).concat([T.monthly || 0, 1]));
      var need = T.monthly > mtd ? (T.monthly - mtd) / Math.max(1, dim - dom + 1) : 0;
      return h('div', {}, h('h2', {}, '🎯 বিক্রির টার্গেট'), f,
        kp([['আজকের বিক্রি', tk(td)], ['এ মাসে এ পর্যন্ত', tk(mtd)], ['মাস শেষে আনুমানিক', tk(proj)], ['বাকি টার্গেটে দৈনিক দরকার', T.monthly ? tk(need) : '—']]),
        T.daily ? h('div', {}, h('b', {}, 'আজ: ' + pct(td, T.daily) + '% (' + tk(td) + ' / ' + tk(T.daily) + ')'), bar(td, T.daily)) : h('p', { class: 'muted' }, 'দৈনিক টার্গেট দেওয়া নেই'),
        T.monthly ? h('div', {}, h('b', {}, 'এ মাস: ' + pct(mtd, T.monthly) + '% (' + tk(mtd) + ' / ' + tk(T.monthly) + ')' + (proj >= T.monthly ? ' · ✅ এ গতিতে পৌঁছাবেন' : ' · ⚠ এ গতিতে ' + tk(T.monthly - proj) + ' কম পড়বে')), bar(mtd, T.monthly)) : h('p', { class: 'muted' }, 'মাসিক টার্গেট দেওয়া নেই'),
        h('h3', {}, 'শেষ ৬ মাস'), h('div', { class: 'v111b', role: 'img', 'aria-label': 'Monthly sales' }, months.map(function (m) { return h('div', {}, h('i', { class: T.monthly && m[1] >= T.monthly ? 'hit' : '', title: m[0] + ': ' + tk(m[1]), style: 'height:' + Math.max(3, Math.round(m[1] / mx * 90)) + 'px' }), m[0].slice(2)); })),
        h('p', { class: 'muted' }, 'সবুজ = মাসিক টার্গেট পূরণ। টার্গেট এই ব্রাউজারের সেটিংসে থাকে (সার্ভার মোডে সিঙ্ক হয়)।'));
    };

    /* ================= 👥 গ্রাহক সেগমেন্ট ================= */
    var SEG = 'all';
    x.panels.segments = function () {
      css(); var D = c.db(), cus = rj('pharmacy_customers', []), R = records(D, []), M = {}, today = dh();
      var key = function (n) { return String(n || '').trim().toLowerCase(); };
      R.forEach(function (r) { if (!r.cust || /^walk-?in/i.test(r.cust)) return; var k = key(r.cust), m = M[k] || (M[k] = { n: r.cust, ph: '', o: 0, v: 0, last: '', due: 0 }); m.o++; m.v += r.total; if (r.d > m.last) m.last = r.d; if (r.phone) m.ph = r.phone; });
      cus.forEach(function (u) { var k = key(u.name); if (!k) return; var m = M[k] || (M[k] = { n: u.name, ph: '', o: 0, v: 0, last: '', due: 0 }); m.ph = m.ph || u.phone || ''; m.due = num(u.due); });
      var rows = Object.keys(M).map(function (k) { var m = M[k], days = m.last ? Math.floor((Date.parse(today) - Date.parse(m.last)) / 864e5) : null; m.days = days;
        m.seg = m.due > 0 ? 'due' : (m.o >= 5 || m.v >= 5000) ? 'vip' : (m.o && days != null && days > 60) ? 'dorm' : (m.o === 1 && days != null && days <= 30) ? 'new' : 'reg'; return m; }).sort(function (a, b) { return b.v - a.v; });
      var L = { vip: ['👑 VIP', 'vip'], reg: ['🙂 নিয়মিত', ''], new: ['🆕 নতুন', 'new'], dorm: ['😴 অনেকদিন আসেননি', 'dorm'], due: ['💸 বাকি আছে', 'due'] };
      var cnt = {}; rows.forEach(function (r) { cnt[r.seg] = (cnt[r.seg] || 0) + 1; });
      var sel = h('select', { onchange: function (e) { SEG = e.target.value; c.show('segments'); } }, [['all', 'সব (' + rows.length + ')']].concat(Object.keys(L).map(function (k) { return [k, L[k][0] + ' (' + (cnt[k] || 0) + ')']; })).map(function (o) { return h('option', Object.assign({ value: o[0] }, o[0] === SEG ? { selected: 'selected' } : {}), o[1]); }));
      var show = rows.filter(function (r) { return SEG === 'all' || r.seg === SEG; });
      return h('div', {}, h('h2', {}, '👥 গ্রাহক সেগমেন্ট'), h('p', { class: 'muted' }, 'নামের মিল ধরে POS ও অনলাইন অর্ডার একত্র। VIP = ৫+ অর্ডার বা ৳৫,০০০+; অনেকদিন আসেননি = ৬০+ দিন; বাকি থাকলে সেটাই আগে দেখায়। Walk-in বাদ।'),
        kp(Object.keys(L).map(function (k) { return [L[k][0], cnt[k] || 0]; })), h('p', {}, 'ফিল্টার: ', sel, ' ', c.btn('⬇ CSV', function () { csv('customers-' + dh() + '.csv', [['Name', 'Phone', 'Segment', 'Orders', 'Spent', 'Last visit', 'Days ago', 'Due']].concat(show.map(function (r) { return [r.n, r.ph, L[r.seg][0], r.o, r.v, r.last, r.days == null ? '' : r.days, r.due]; }))); }, 'btn')),
        tbl(['গ্রাহক', 'ফোন', 'ধরন', 'অর্ডার', 'মোট খরচ', 'শেষ', 'বাকি'], show.slice(0, 200).map(function (r) { return h('tr', {}, h('td', {}, r.n), h('td', {}, r.ph || '—'), h('td', {}, h('span', { class: 'v111tag ' + L[r.seg][1] }, L[r.seg][0])), h('td', { class: 'v111n' }, r.o), h('td', { class: 'v111n' }, tk(r.v)), h('td', {}, r.last ? r.last + ' (' + r.days + ' দিন)' : '—'), h('td', { class: 'v111n' }, r.due > 0 ? tk(r.due) : '')); }), 'কোনো গ্রাহক নেই'),
        show.length > 200 ? h('p', { class: 'muted' }, 'প্রথম ২০০ জন দেখানো হলো — বাকিটা CSV-তে।') : '');
    };

    /* ================= 📦 স্টক ইন্টেলিজেন্স ================= */
    x.panels.stockintel = function () {
      css(); var D = c.db(), meds = rj('pharmacy_medicines', []), R = records(D, meds), today = dh(), in30 = dh(Date.now() + 30 * 864e5), in60 = dh(Date.now() + 60 * 864e5), in90 = dh(Date.now() + 90 * 864e5);
      var sold30 = {}, sold60 = {}, f30 = dh(Date.now() - 30 * 864e5), f60 = dh(Date.now() - 60 * 864e5);
      R.forEach(function (r) { r.items.forEach(function (i) { var k = String(i.name || '').toLowerCase(); if (r.d >= f60) sold60[k] = (sold60[k] || 0) + i.q; if (r.d >= f30) sold30[k] = (sold30[k] || 0) + i.q; }); });
      var inStock = meds.filter(function (m) { return num(m.stock) > 0; }), cost = function (m) { return num(m.stock) * num(m.purchasePrice); }, retail = function (m) { return num(m.stock) * num(m.price); };
      var vC = inStock.reduce(function (a, m) { return a + cost(m); }, 0), vR = inStock.reduce(function (a, m) { return a + retail(m); }, 0);
      var bucket = function (lo, hi) { return inStock.filter(function (m) { return m.expiryDate && m.expiryDate >= lo && (!hi || m.expiryDate <= hi); }); };
      var ex = inStock.filter(function (m) { return m.expiryDate && m.expiryDate < today; }), e30 = bucket(today, in30), e60 = inStock.filter(function (m) { return m.expiryDate > in30 && m.expiryDate <= in60; }), e90 = inStock.filter(function (m) { return m.expiryDate > in60 && m.expiryDate <= in90; });
      var sum = function (a) { return a.reduce(function (s, m) { return s + cost(m); }, 0); };
      var dead = inStock.filter(function (m) { return !sold60[String(m.name || '').toLowerCase()]; }).sort(function (a, b) { return cost(b) - cost(a); });
      var fast = inStock.map(function (m) { var u = sold30[String(m.name || '').toLowerCase()] || 0, perDay = u / 30; return { m: m, u: u, cover: perDay ? num(m.stock) / perDay : null }; }).filter(function (z) { return z.cover != null && z.cover < 10; }).sort(function (a, b) { return a.cover - b.cover; });
      var noCost = inStock.filter(function (m) { return !(num(m.purchasePrice) > 0); }).length;
      var rowM = function (m) { return h('tr', {}, h('td', {}, m.name), h('td', { class: 'v111n' }, m.stock), h('td', {}, m.expiryDate || '—'), h('td', { class: 'v111n' }, tk(cost(m)))); };
      return h('div', {}, h('h2', {}, '📦 স্টক ইন্টেলিজেন্স'),
        kp([['স্টকে ওষুধ', inStock.length], ['স্টকের মূল্য (ক্রয়)', tk(vC)], ['স্টকের মূল্য (বিক্রয়)', tk(vR)], ['সম্ভাব্য মার্জিন', tk(vR - vC)], ['মেয়াদ-উত্তীর্ণ', tk(sum(ex)) + ' (' + ex.length + ')', ex.length ? 'bad' : ''], ['৩০ দিনে শেষ', tk(sum(e30)) + ' (' + e30.length + ')'], ['৩১–৬০ দিনে', tk(sum(e60)) + ' (' + e60.length + ')'], ['৬১–৯০ দিনে', tk(sum(e90)) + ' (' + e90.length + ')']]),
        noCost ? h('p', { class: 'muted' }, '⚠ ' + noCost + 'টি ওষুধে ক্রয়-মূল্য নেই, তাই ক্রয়-মূল্যের হিসাব কম দেখাচ্ছে।') : '',
        h('h3', {}, '⏳ মেয়াদ-উত্তীর্ণ ও ৩০ দিনের মধ্যে (আগে বিক্রি/ফেরত দিন)'), tbl(['ওষুধ', 'স্টক', 'মেয়াদ', 'ক্রয়-মূল্য'], ex.concat(e30).sort(function (a, b) { return a.expiryDate < b.expiryDate ? -1 : 1; }).slice(0, 30).map(rowM), 'কিছু নেই 👍'),
        h('h3', {}, '🧊 ৬০ দিনে একটাও বিক্রি হয়নি (আটকে থাকা টাকা)'), tbl(['ওষুধ', 'স্টক', 'মেয়াদ', 'আটকে আছে'], dead.slice(0, 30).map(rowM), 'সব ওষুধ নড়ছে 👍'),
        h('h3', {}, '🔥 দ্রুত শেষ হবে (স্টক ১০ দিনের কম)'), tbl(['ওষুধ', 'স্টক', '৩০ দিনে বিক্রি', 'কত দিন চলবে'], fast.slice(0, 30).map(function (z) { return h('tr', {}, h('td', {}, z.m.name), h('td', { class: 'v111n' }, z.m.stock), h('td', { class: 'v111n' }, z.u), h('td', { class: 'v111n' }, Math.floor(z.cover) + ' দিন')); }), 'এখনই ঝুঁকি নেই'),
        h('p', {}, c.btn('⬇ CSV (সব স্টক)', function () { csv('stock-' + today + '.csv', [['Name', 'Stock', 'Expiry', 'Cost value', 'Retail value', 'Sold 30d', 'Sold 60d']].concat(inStock.map(function (m) { var k = String(m.name || '').toLowerCase(); return [m.name, m.stock, m.expiryDate || '', cost(m), retail(m), sold30[k] || 0, sold60[k] || 0]; }))); }, 'btn')));
    };

    x.tabs.push(['pnl', '💹 Profit & Loss'], ['target', '🎯 Sales Target'], ['segments', '👥 Customer Segments'], ['stockintel', '📦 Stock Intelligence']);
    return x;
  };
})();
