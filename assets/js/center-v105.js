/* v105 — Control Center: তিনটি নতুন ট্যাব
   🚀 Go-live Setup  — দোকান সত্যিকারের ব্যবহারের জন্য তৈরি কি না, অটো-চেক সহ চেকলিস্ট (ডেমো পাসওয়ার্ড/কোড, ব্যাকআপ, ডেমো ডাটা…) + সরাসরি ঠিক করার বোতাম
   👮 Staff Watch   — কর্মী-ভিত্তিক বিক্রি, ছাড়, Void, রিফান্ড, রাতের বিল, ক্যাশ গরমিল; সন্দেহজনক হলে ফ্ল্যাগ + CSV
   🧰 Bulk Tools    — একসাথে দাম বদল (% / ৳ / রাউন্ড) ও রিঅর্ডার লেভেল; আগে প্রিভিউ, পরে প্রয়োগ, এক ক্লিকে বাতিল */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function el(tag, p, kids) {
    var e = document.createElement(tag); p = p || {};
    Object.keys(p).forEach(function (k) { if (k === 'style') e.style.cssText = p[k]; else if (k === 'class') e.className = p[k]; else if (/^on/.test(k)) e.addEventListener(k.slice(2), p[k]); else if (k in e) e[k] = p[k]; else e.setAttribute(k, p[k]); });
    (function add(k) { if (k == null) return; if (Array.isArray(k)) return k.forEach(add); e.append(k.nodeType ? k : document.createTextNode(String(k))); })(kids); return e;
  }
  function css() {
    if (document.getElementById('v105css')) return; var s = document.createElement('style'); s.id = 'v105css';
    s.textContent = '.v105pb{height:12px;border-radius:99px;background:var(--br);overflow:hidden;margin:.4rem 0 1rem}.v105pb i{display:block;height:100%;background:linear-gradient(90deg,#2e9e5b,#7fd1a0)}' +
      '.v105i{display:flex;gap:.7rem;align-items:flex-start;padding:.65rem .8rem;border:1px solid var(--br);border-radius:12px;background:var(--card);margin:.45rem 0}.v105i.ok{border-color:#7fd1a0}.v105i.no{border-color:#f0a19a}' +
      '.v105i .ic{font-size:1.2rem;width:1.6rem;text-align:center}.v105i .tx{flex:1}.v105i .tx small{display:block;color:var(--mut)}' +
      '.v105f{display:inline-block;border-radius:999px;padding:.1rem .55rem;font-size:.78rem;font-weight:700;background:#fde2e0;color:#7a1410;margin:.1rem}' +
      '.v105n{font-variant-numeric:tabular-nums;text-align:right}.v105t td,.v105t th{white-space:nowrap}';
    document.head.appendChild(s);
  }
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN'); };
  var dhaka = function (t) { return new Date((t == null ? Date.now() : t) + 6 * 3600e3).toISOString().slice(0, 10); };

  window.CCX = function (c) {
    var x = prev(c), wj = c.wj;

    /* ================= 🚀 Go-live Setup ================= */
    x.panels.setup = function () {
      css(); var D = c.db(), S = rj('pharmacy_settings', {}), T = rj('pharmacy_theme', {}), creds = rj('pharmacy_creds', {}), accts = rj('pharmacy_accounts', []);
      var lb = localStorage.getItem('pharmacy_lastbackup') || localStorage.getItem('mc_lastbackup'), lbT = lb ? (+lb > 1e11 ? +lb : Date.parse(lb)) : 0, lbDays = lbT ? Math.floor((Date.now() - lbT) / 864e5) : null;
      var meds = rj('pharmacy_medicines', []), demoMeds = meds.some(function (m) { return m && m.id === 1 && m.name === 'Paracetamol 500mg'; }), demoShop = (D.products || []).some(function (p) { return /^SKU10\d\d$/.test(p.sku || '') && /^89000100\d$/.test(p.barcode || ''); });
      var opsUsers = (D.users || []).filter(function (u) { return u.active !== false; }), pins = S.opsPins || {}, noPin = opsUsers.filter(function (u) { return !pins[u.id]; });
      var dis = (S.disabled || []).map(function (e) { return String(e).toLowerCase(); }), demoLogins = ['pharmacist@medicare.com', 'staff@medicare.com'].filter(function (e) { return dis.indexOf(e) < 0; });
      var items = [
        ['🏪', 'দোকানের নাম ও ব্র্যান্ড বসানো হয়েছে', !!(T.brand && T.brand !== 'MediCare Pharmacy') || (D.settings.store && D.settings.store !== 'MediCare Pharmacy'), 'এখনও ডিফল্ট "MediCare Pharmacy" — নিজের দোকানের নাম দিন', 'brand', 'Branding খুলুন'],
        ['🖼', 'লোগো আপলোড করা হয়েছে', !!T.logo, 'ইনভয়েস ও শপে লোগো দেখাবে', 'brand', 'লোগো দিন'],
        ['🔑', 'Admin-এর ডিফল্ট পাসওয়ার্ড (admin123) বদলানো হয়েছে', !!creds['admin@medicare.com'], '🚨 ডিফল্ট পাসওয়ার্ড সবাই জানে — এখনই বদলান (Dashboard → Settings → Security)', 'security', 'Security দেখুন', true],
        ['🔐', 'Admin PIN (দ্বিতীয় ধাপ) চালু', !!S.adminPin, 'পাসওয়ার্ডের পরে PIN চাইবে', 'signin', 'PIN দিন'],
        ['🧰', 'Ops Panel-এর সবার ব্যক্তিগত PIN আছে', opsUsers.length > 0 && noPin.length === 0, noPin.length + ' জনের PIN নেই — তাদের "demo" কোড দিয়ে ঢোকা যাবে: ' + noPin.slice(0, 4).map(function (u) { return u.name; }).join(', '), 'signin', 'PIN দিন', true],
        ['👤', 'ডেমো স্টাফ লগইন (pharmacist/staff@medicare.com) বন্ধ বা নিজের অ্যাকাউন্টে বদলানো', demoLogins.length === 0, 'ডিফল্ট pharm123/staff123 এখনও চালু: ' + demoLogins.join(', '), 'accounts', 'Accounts খুলুন', true],
        ['🗂', 'ডেমো ডাটা (নমুনা ওষুধ/পণ্য) সরানো হয়েছে', !demoMeds && !demoShop, (demoMeds ? 'ড্যাশবোর্ডে নমুনা ওষুধ ' : '') + (demoShop ? 'শপে নমুনা পণ্য ' : '') + 'এখনও আছে — "সব ডাটা রিসেট" দিয়ে খালি করে নিজের ডাটা বসান', 'reset', 'রিসেট খুলুন'],
        ['🚚', 'ডেলিভারি জোন/ফি ঠিক করা হয়েছে', (D.settings.zones || []).length > 0, 'কোনো জোন নেই — ডিফল্ট ফি (ঢাকা ' + (D.settings.feeDhaka || 0) + ', বাইরে ' + (D.settings.feeOut || 0) + ') চলছে', 'delivery', 'জোন যোগ করুন'],
        ['💾', 'গত ৭ দিনে ব্যাকআপ নেওয়া হয়েছে', lbDays != null && lbDays <= 7, lbDays == null ? 'এখনও কোনো ব্যাকআপ নেওয়া হয়নি' : lbDays + ' দিন আগে নেওয়া — পুরনো', 'maint', 'ব্যাকআপ নিন', true],
        ['🛡', 'রোল ও অনুমতি দেখে নেওয়া হয়েছে', !!Object.keys(rj('pharmacy_roles', {})).length, 'ডিফল্ট রোল চলছে — কে কী করতে পারবে একবার দেখে নিন', 'roles', 'Roles খুলুন'],
        ['⏱', 'সেশন সীমা/অটো-লগআউট ঠিক করা হয়েছে', S.idleMin != null || S.sessionHours != null, 'ডিফল্ট (৩০ মিনিট নিষ্ক্রিয়/১২ ঘণ্টা) চলছে — দোকানের জন্য ঠিক কি না দেখুন', 'security', 'Security দেখুন'],
        ['🟢', 'অনলাইন শপ খোলা', D.settings.shopOpen !== false, 'শপ এখন বন্ধ — গ্রাহক অর্ডার দিতে পারবে না', 'shop', 'Shop সেটিং']
      ];
      var done = items.filter(function (i) { return i[2]; }).length, pct = Math.round(done / items.length * 100), crit = items.filter(function (i) { return !i[2] && i[6]; });
      var root = el('div', {}, [el('h2', {}, '🚀 Go-live Setup'), el('p', { class: 'muted' }, 'সত্যিকারের ব্যবসায় চালু করার আগে এই চেকলিস্ট মিলিয়ে নিন। প্রতিটি ধাপ নিজে থেকে চেক হয়; ✖ হলে পাশের বোতামে সরাসরি ঠিক করার জায়গায় যান।'),
        el('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' }, [el('b', { style: 'font-size:1.4rem' }, pct + '% প্রস্তুত'), el('span', { class: 'muted' }, done + '/' + items.length + ' ধাপ সম্পন্ন')]), el('div', { class: 'v105pb' }, el('i', { style: 'width:' + pct + '%' })),
        crit.length ? el('div', { class: 'cc-card', style: 'border-color:#c0261c;margin-bottom:.8rem' }, [el('b', { style: 'color:#c0261c' }, '🚨 ' + crit.length + 'টি নিরাপত্তা-ঝুঁকি বাকি'), el('div', { class: 'muted' }, crit.map(function (i) { return i[1]; }).join(' · '))]) : el('p', { class: 'ok' }, '✅ কোনো গুরুতর নিরাপত্তা-ঝুঁকি বাকি নেই।')]);
      items.forEach(function (i) {
        root.append(el('div', { class: 'v105i ' + (i[2] ? 'ok' : 'no') }, [el('span', { class: 'ic' }, i[2] ? '✅' : (i[6] ? '🚨' : '⬜')), el('div', { class: 'tx' }, [el('b', {}, i[1]), i[2] ? null : el('small', {}, i[3])]),
          i[2] ? null : el('button', { type: 'button', class: 'btn2', onclick: function () { c.show(i[4]); } }, i[5])]));
      });
      return root;
    };

    /* ================= 👮 Staff Watch ================= */
    var SW_DAYS = 30;
    x.panels.staffwatch = function () {
      css(); var root = el('div', {}), sel = el('select', { onchange: function () { SW_DAYS = +sel.value; c.show('staffwatch'); } }, [7, 30, 90, 365].map(function (d) { return el('option', { value: d, selected: d === SW_DAYS }, 'শেষ ' + d + ' দিন'); }));
      var from = dhaka(Date.now() - SW_DAYS * 864e5), sales = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && (s.date || dhaka(Date.parse(s.at))) >= from; });
      var refunds = rj('pharmacy_refunds', []).filter(function (r) { return r && (r.date || '') >= from; }), shifts = rj('pharmacy_shifts', []).filter(function (s) { return s && (s.date || '') >= from; });
      var P = {}; function pp(n) { n = String(n || '(অজানা)').trim() || '(অজানা)'; return P[n] || (P[n] = { n: n, bills: 0, tot: 0, sub: 0, disc: 0, voids: 0, voidV: 0, ref: 0, refV: 0, night: 0, cash: 0 }); }
      sales.forEach(function (s) {
        if (s.status !== 'Voided') { var p = pp(s.cashier); p.bills++; p.tot += +s.total || 0; p.sub += +s.subtotal || +s.total || 0; p.disc += +s.discount || 0; if (/cash/i.test(s.paymentMethod || '')) p.cash++;
          var hr = s.at ? (new Date(Date.parse(s.at) + 6 * 3600e3)).getUTCHours() : 12; if (hr >= 23 || hr < 7) p.night++; }
        else { var v = pp(s.voidBy || s.cashier); v.voids++; v.voidV += +s.total || 0; }
      });
      refunds.forEach(function (r) { var p = pp(r.by); p.ref++; p.refV += +r.amount || 0; });
      var rows = Object.keys(P).map(function (k) { return P[k]; }).sort(function (a, b) { return b.tot - a.tot; });
      rows.forEach(function (p) {
        p.fl = []; var dp = p.sub ? p.disc / p.sub * 100 : 0; p.dp = dp;
        if (dp > 15) p.fl.push('🏷 ছাড় বেশি (' + dp.toFixed(1) + '%)'); if (p.voids >= 3) p.fl.push('🗑 Void ' + p.voids + 'টি');
        if (p.ref >= 3 || (p.tot && p.refV / p.tot > .1)) p.fl.push('↩ রিফান্ড বেশি'); if (p.night >= 3 && p.night / Math.max(p.bills, 1) >= .2) p.fl.push('🌙 রাতের বিল ' + p.night + 'টি');
      });
      var shiftBad = shifts.filter(function (s) { return Math.abs(+s.diff || 0) >= 50; }).sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
      var csv = function () { var L = [['কর্মী', 'বিল', 'বিক্রি', 'গড় বিল', 'ছাড়', 'ছাড় %', 'Void সংখ্যা', 'Void মূল্য', 'রিফান্ড সংখ্যা', 'রিফান্ড মূল্য', 'রাতের বিল', 'ফ্ল্যাগ']].concat(rows.map(function (p) { return [p.n, p.bills, p.tot.toFixed(2), (p.bills ? p.tot / p.bills : 0).toFixed(2), p.disc.toFixed(2), p.dp.toFixed(1), p.voids, p.voidV.toFixed(2), p.ref, p.refV.toFixed(2), p.night, p.fl.join(' | ')]; }));
        var b = new Blob(['﻿' + L.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','); }).join('\n')], { type: 'text/csv' }), a = el('a', { href: URL.createObjectURL(b), download: 'staff-watch-' + dhaka() + '.csv' }); document.body.append(a); a.click(); a.remove(); };
      root.append(el('h2', {}, '👮 Staff Watch — কর্মী-ভিত্তিক হিসাব ও ঝুঁকি'), el('p', { class: 'muted' }, 'POS বিক্রির রেকর্ড থেকে অটো-হিসাব। ফ্ল্যাগ মানেই দোষ নয় — শুধু "একটু দেখে নিন"। (ছাড় >১৫%, Void ≥৩, রিফান্ড ≥৩ বা বিক্রির >১০%, রাত ১১টা–সকাল ৭টার বিল ≥৩ ও ≥২০%)'),
        el('div', { style: 'display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin:.5rem 0' }, [sel, el('button', { type: 'button', class: 'btn2', onclick: csv }, '⬇ CSV'), el('span', { class: 'muted' }, sales.length + ' টি বিক্রি · ' + refunds.length + ' টি রিফান্ড')]));
      var flagged = rows.filter(function (p) { return p.fl.length; });
      root.append(flagged.length ? el('div', { class: 'cc-card', style: 'border-color:#e8a317;margin-bottom:.8rem' }, [el('b', {}, '⚠️ নজর দিন'), el('div', {}, flagged.map(function (p) { return el('div', { style: 'margin:.25rem 0' }, [el('b', {}, p.n + ': '), p.fl.map(function (f) { return el('span', { class: 'v105f' }, f); })]); }))]) : el('p', { class: 'ok' }, rows.length ? '✅ এই সময়ে কোনো সন্দেহজনক প্যাটার্ন নেই।' : 'এই সময়ে কোনো বিক্রি নেই।'));
      if (rows.length) root.append(el('div', { class: 'scroll' }, el('table', { class: 'v105t' }, [el('thead', {}, el('tr', {}, ['কর্মী', 'বিল', 'বিক্রি', 'গড় বিল', 'ছাড় (৳ / %)', 'Void', 'রিফান্ড', 'রাতের বিল'].map(function (t) { return el('th', {}, t); }))),
        el('tbody', {}, rows.map(function (p) { return el('tr', {}, [el('td', {}, p.n), el('td', { class: 'v105n' }, p.bills), el('td', { class: 'v105n' }, tk(p.tot)), el('td', { class: 'v105n' }, tk(p.bills ? p.tot / p.bills : 0)), el('td', { class: 'v105n' }, tk(p.disc) + ' / ' + p.dp.toFixed(1) + '%'), el('td', { class: 'v105n' }, p.voids + ' (' + tk(p.voidV) + ')'), el('td', { class: 'v105n' }, p.ref + ' (' + tk(p.refV) + ')'), el('td', { class: 'v105n' }, p.night)]); }))])));
      root.append(el('h3', { style: 'margin-top:1.2rem' }, '💵 ক্যাশ গরমিল (ক্লোজিং-এ ≥ ৳৫০ পার্থক্য)'), shiftBad.length ? el('div', { class: 'scroll' }, el('table', { class: 'v105t' }, [el('thead', {}, el('tr', {}, ['তারিখ', 'প্রত্যাশিত', 'গোনা হয়েছে', 'পার্থক্য'].map(function (t) { return el('th', {}, t); }))),
        el('tbody', {}, shiftBad.slice(0, 30).map(function (s) { var d = +s.diff || 0; return el('tr', {}, [el('td', {}, s.date), el('td', { class: 'v105n' }, tk(s.expected)), el('td', { class: 'v105n' }, tk(s.counted)), el('td', { class: 'v105n', style: 'font-weight:700;color:' + (d < 0 ? '#c0261c' : '#2e7d32') }, (d > 0 ? '+' : '') + tk(d))]); }))])) : el('p', { class: 'muted' }, 'কোনো উল্লেখযোগ্য গরমিল নেই।'));
      return root;
    };

    /* ================= 🧰 Bulk Tools ================= */
    x.panels.bulk = function () {
      css(); var D = c.db(), meds = rj('pharmacy_medicines', []), root = el('div', {}), UK = 'mc_bulkundo';
      var cats = {}; meds.forEach(function (m) { if (m.category) cats[m.category] = 1; }); (D.products || []).forEach(function (p) { if (p.cat) cats[p.cat] = 1; });
      var F = { tgt: el('select', {}, [['both', 'ড্যাশবোর্ড ওষুধ + অনলাইন শপ পণ্য'], ['med', 'শুধু ড্যাশবোর্ড ওষুধ (' + meds.length + ')'], ['shop', 'শুধু অনলাইন শপ পণ্য (' + (D.products || []).length + ')']].map(function (o) { return el('option', { value: o[0] }, o[1]); })),
        cat: el('select', {}, [el('option', { value: '' }, 'সব ক্যাটাগরি')].concat(Object.keys(cats).sort().map(function (k) { return el('option', { value: k }, k); }))),
        act: el('select', {}, [['pct', 'দাম বাড়ান/কমান (%)'], ['fix', 'দাম বাড়ান/কমান (টাকা)'], ['reorder', 'রিঅর্ডার লেভেল নির্ধারণ']].map(function (o) { return el('option', { value: o[0] }, o[1]); })),
        val: el('input', { type: 'number', step: '0.01', value: 5, style: 'width:100%' }), rnd: el('select', {}, [['0', 'রাউন্ড নয় (২ দশমিক)'], ['1', 'নিকটতম ১ টাকা'], ['5', 'নিকটতম ৫ টাকা'], ['10', 'নিকটতম ১০ টাকা']].map(function (o) { return el('option', { value: o[0] }, o[1]); })),
        cost: el('input', { type: 'checkbox' }) };
      var hint = el('p', { class: 'muted' }), out = el('div', {}), applyBtn = el('button', { type: 'button', class: 'btn', disabled: true, onclick: apply }, '✅ প্রয়োগ করুন');
      function lab(t, e) { return el('label', { style: 'display:flex;flex-direction:column;gap:.2rem;font-size:.9rem' }, [t, e]); }
      function newPrice(old) { var v = +F.val.value || 0, n = F.act.value === 'pct' ? old * (1 + v / 100) : old + v, r = +F.rnd.value; n = r ? Math.round(n / r) * r : Math.round(n * 100) / 100; return Math.max(0, n); }
      var plan = [];
      function build() {
        plan = []; var tg = F.tgt.value, ct = F.cat.value, act = F.act.value, v = +F.val.value; hint.textContent = act === 'pct' ? 'যেমন 10 = ১০% বাড়বে; -10 = ১০% কমবে।' : act === 'fix' ? 'যেমন 2 = প্রতিটিতে ২ টাকা বাড়বে; -2 = কমবে।' : 'নতুন রিঅর্ডার লেভেল (একটি পূর্ণ সংখ্যা, ≥০)।';
        function add(src, rec, name, cat, field, old, nu, extra) { if (ct && cat !== ct) return; if (old === nu) return; plan.push({ src: src, id: rec.id, name: name, field: field, old: old, nu: nu, below: extra }); }
        if (tg !== 'shop') meds.forEach(function (m) { if (act === 'reorder') add('med', m, m.name, m.category, 'minStock', +m.minStock || 0, Math.max(0, Math.round(v))); else { var o = +m.sellingPrice || 0, n = Math.round(newPrice(o) * 100) / 100; add('med', m, m.name, m.category, 'sellingPrice', o, n, n < (+m.purchasePrice || 0)); if (F.cost.checked && act !== 'reorder') { var oc = +m.purchasePrice || 0, nc = Math.round(newPrice(oc) * 100) / 100; add('med', m, m.name, m.category, 'purchasePrice', oc, nc); } } });
        if (tg !== 'med') (D.products || []).forEach(function (p) { if (act === 'reorder') add('shop', p, p.name, p.cat, 'reorder', +p.reorder || 0, Math.max(0, Math.round(v))); else { var o = +p.price || 0, n = Math.round(newPrice(o) * 100) / 100; add('shop', p, p.name, p.cat, 'price', o, n, n < (+p.cost || 0)); if (F.cost.checked) { var oc = +p.cost || 0, nc = Math.round(newPrice(oc) * 100) / 100; add('shop', p, p.name, p.cat, 'cost', oc, nc); } } });
        plan = plan.filter(function (p) { return isFinite(p.nu) && p.nu >= 0; });
        var below = plan.filter(function (p) { return p.below; }).length, big = act === 'pct' && (v > 50 || v < -50);
        out.replaceChildren(el('p', {}, [el('b', {}, plan.length + ' টি পরিবর্তন'), plan.length ? ' হবে।' : ' — কিছু বদলাবে না।', below ? el('span', { class: 'v105f' }, '⚠ ' + below + 'টির দাম ক্রয়মূল্যের নিচে যাবে') : null, big ? el('span', { class: 'v105f' }, '⚠ ৫০%-এর বেশি পরিবর্তন') : null]),
          plan.length ? el('div', { class: 'scroll', style: 'max-height:320px' }, el('table', { class: 'v105t' }, [el('thead', {}, el('tr', {}, ['কোথায়', 'নাম', 'ফিল্ড', 'আগে', 'পরে'].map(function (t) { return el('th', {}, t); }))), el('tbody', {}, plan.slice(0, 60).map(function (p) { return el('tr', {}, [el('td', {}, p.src === 'med' ? 'ড্যাশবোর্ড' : 'শপ'), el('td', {}, p.name), el('td', {}, p.field), el('td', { class: 'v105n' }, p.old), el('td', { class: 'v105n', style: 'font-weight:700' }, p.nu)]); }).concat(plan.length > 60 ? [el('tr', {}, el('td', { colspan: 5, class: 'muted' }, '… আরও ' + (plan.length - 60) + 'টি'))] : []))])) : null);
        applyBtn.disabled = !plan.length;
      }
      function apply() {
        if (!plan.length) return; var big = plan.length > 20 || (F.act.value === 'pct' && Math.abs(+F.val.value) > 30);
        if (!confirm(plan.length + ' টি রেকর্ড বদলাবে।' + (big ? '\n\n⚠ এটি বড় পরিবর্তন — প্রিভিউ ভালো করে দেখেছেন তো?' : '') + '\nপরে "বাতিল" দিয়ে ফেরানো যাবে। চালিয়ে যাবেন?')) return;
        var undo = { at: new Date().toISOString(), desc: F.act.options[F.act.selectedIndex].text + ' ' + F.val.value + (F.act.value === 'pct' ? '%' : '') + (F.cat.value ? ' · ' + F.cat.value : ''), ch: plan.map(function (p) { return { src: p.src, id: p.id, f: p.field, old: p.old }; }) };
        var m2 = rj('pharmacy_medicines', []), D2 = c.db(), byMed = {}, byShop = {}; m2.forEach(function (m) { byMed[m.id] = m; }); (D2.products || []).forEach(function (p) { byShop[p.id] = p; });
        plan.forEach(function (p) { var r = (p.src === 'med' ? byMed : byShop)[p.id]; if (r) r[p.field] = p.nu; });
        wj('pharmacy_medicines', m2); c.save(D2); wj(UK, undo);
        try { c.audit('Bulk update: ' + undo.desc + ' (' + plan.length + ' changes)'); } catch (e) { } c.ok(plan.length + ' টি বদলেছে'); c.show('bulk');
      }
      Object.keys(F).forEach(function (k) { F[k].addEventListener('input', build); F[k].addEventListener('change', build); });
      var u = rj(UK, null);
      root.append(el('h2', {}, '🧰 Bulk Tools — একসাথে দাম/রিঅর্ডার বদল'), el('p', { class: 'muted' }, 'আগে প্রিভিউ দেখুন, তারপর প্রয়োগ। প্রতিবার শেষ পরিবর্তনটি এক ক্লিকে বাতিল করা যায়। ফিল্ড: ড্যাশবোর্ড = sellingPrice/purchasePrice/minStock, শপ = price/cost/reorder।'),
        u ? el('div', { class: 'cc-card', style: 'border-color:#e8a317;margin-bottom:1rem' }, [el('b', {}, '↩ শেষ পরিবর্তন বাতিল করা যায়'), el('p', { class: 'muted' }, new Date(u.at).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' }) + ' — ' + u.desc + ' (' + u.ch.length + 'টি)'),
          el('button', { type: 'button', class: 'btn2', onclick: function () {
            if (!confirm('এই পরিবর্তনগুলো আগের মানে ফেরাবেন? (এর পরে হাতে বদলানো মানও আগের মানে ফিরবে)')) return;
            var m3 = rj('pharmacy_medicines', []), D3 = c.db(), a = {}, b = {}; m3.forEach(function (m) { a[m.id] = m; }); (D3.products || []).forEach(function (p) { b[p.id] = p; });
            u.ch.forEach(function (h) { var r = (h.src === 'med' ? a : b)[h.id]; if (r) r[h.f] = h.old; }); wj('pharmacy_medicines', m3); c.save(D3); localStorage.removeItem(UK);
            try { c.audit('Bulk update undone (' + u.ch.length + ')'); } catch (e) { } c.ok('ফেরানো হয়েছে'); c.show('bulk'); } }, '↩ বাতিল করুন')]) : null,
        el('div', { class: 'cc-card', style: 'margin-bottom:1rem' }, [el('div', { class: 'cc-two' }, [el('div', { style: 'display:grid;gap:.7rem' }, [lab('কোথায়', F.tgt), lab('ক্যাটাগরি', F.cat), lab('কী করবেন', F.act)]), el('div', { style: 'display:grid;gap:.7rem;align-content:start' }, [lab('মান', F.val), hint, lab('রাউন্ডিং', F.rnd), el('label', { style: 'display:flex;gap:.5rem;align-items:center' }, [F.cost, 'ক্রয়মূল্যও একই হারে বদলান'])])])]), out, el('div', { style: 'margin-top:.8rem' }, applyBtn));
      build(); return root;
    };

    x.tabs.push(['setup', '🚀 Go-live Setup'], ['staffwatch', '👮 Staff Watch'], ['bulk', '🧰 Bulk Tools']);
    return x;
  };
})();
