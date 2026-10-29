/* v93 — Ops Panel → Settings (Owner): আগে ছিল মাত্র ৫টি ঘর। এখন:
   • 🏪 দোকান এখন খোলা/বন্ধ কুইক-টগল + ঘোষণা-ব্যানার
   • 🧾 POS ও রিসিপ্ট (VAT %, রিসিপ্ট-নোট, ডিফল্ট লো-স্টক, অটো-সাইন-আউট)
   • ↩ "আগের অবস্থায় ফিরুন" (শেষ সেভের আগের মান), ⬇/⬆ সেটিংস JSON এক্সপোর্ট/ইমপোর্ট (যাচাইসহ)
   • 🕘 সেটিংস-পরিবর্তনের ইতিহাস (খোঁজা + CSV)
   (শপের ফোন/ঠিকানা/ঘোষণা/ফ্রি-ডেলিভারি ফর্ম নিচের "Online shop profile & rules"-এ আগে থেকেই আছে।) মান Control Center → Rules-এর সাথে একই কী ব্যবহার করে (mc_db.settings ও pharmacy_settings)। */
(function () {
  'use strict';
  if (typeof V === 'undefined' || typeof h !== 'function' || typeof D === 'undefined' || !V.settings) return;
  var rj = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var wj = function (k, v) { localStorage.setItem(k, JSON.stringify(v)); };
  var st = document.createElement('style');
  st.textContent = '.v93c{border:1px solid var(--br,#cfe3dd);border-radius:14px;padding:.8rem 1rem;margin:.8rem 0}.v93c h3{margin:0 0 .5rem}.v93g{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.6rem}.v93g label{display:block;font-size:.9rem}.v93g input:not([type=checkbox]){width:100%;box-sizing:border-box}.v93s{display:flex;align-items:center;gap:.8rem;flex-wrap:wrap}.v93p{border-radius:99px;padding:.2rem .8rem;font-weight:700}.v93p.on{background:rgba(22,163,74,.18);color:#15803d}.v93p.off{background:rgba(220,38,38,.18);color:#b91c1c}.v93h{margin:.5rem 0}';
  document.head.appendChild(st);
  var SHOP = { shopOpen: 'b', notice: 's', minOrder: 'n', freeMin: 'n', hours: 's', phone: 's', addr: 's', feeDhaka: 'n', feeOut: 'n', expiryDays: 'n', invoice: 's', store: 's' };
  var POS = { taxPct: 'n', receiptNote: 's', lowDefault: 'n', idleMin: 'n', rxEnforce: 'b', phone: 's', address: 's', email: 's' };
  function snapshot() { try { wj('mc_settings_prev', { at: new Date().toISOString(), shop: JSON.parse(JSON.stringify(db().settings || {})), pos: rj('pharmacy_settings', {}) }); } catch (e) { } }
  function lbl(t, el) { return h('label', {}, t, h('br'), el); }
  function inp(n, v, t, a) { return h('input', Object.assign({ name: n, type: t || 'text', value: v == null ? '' : v }, a || {})); }
  function chk(n, on, t) { var c = h('input', { type: 'checkbox', name: n }); c.checked = !!on; return h('label', {}, c, ' ' + t); }
  function csv(name, rows) { var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }; var a = h('a', { href: URL.createObjectURL(new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv;charset=utf-8' })), download: name }); document.body.append(a); a.click(); a.remove(); }
  function clean(spec, src) { var out = {}, bad = null; Object.keys(spec).forEach(function (k) { if (!(k in src)) return; var v = src[k], t = spec[k]; if (t === 'b' && typeof v === 'boolean') out[k] = v; else if (t === 'n' && typeof v === 'number' && isFinite(v) && v >= 0 && v <= 1e7) out[k] = v; else if (t === 's' && typeof v === 'string' && v.length <= 200) out[k] = v; else bad = k; }); return bad ? { bad: bad } : { ok: out }; }

  var S0 = V.settings;
  V.settings = function () {
    var base = S0.apply(this, arguments);
    if (typeof R === 'undefined' || R !== 'Owner') return base;
    D = db(); var s = D.settings || {}, P = rj('pharmacy_settings', {});
    var root = h('div', {});
    /* ১) খোলা/বন্ধ */
    var open = s.shopOpen !== false, pill = h('span', { class: 'v93p ' + (open ? 'on' : 'off') }, open ? '● অনলাইন শপ খোলা' : '● অনলাইন শপ বন্ধ');
    var tg = h('button', { class: 'btn', onclick: function () { snapshot(); D = db(); D.settings.shopOpen = !(D.settings.shopOpen !== false); audit('Changed shop: ' + (D.settings.shopOpen ? 'opened' : 'closed')); save(D); toast(D.settings.shopOpen ? 'শপ খোলা হয়েছে' : 'শপ বন্ধ করা হয়েছে'); go(); } }, open ? 'শপ বন্ধ করুন' : 'শপ খুলুন');
    root.append(h('div', { class: 'v93c' }, h('h3', {}, '🏪 দোকানের অবস্থা'), h('div', { class: 'v93s' }, pill, tg, h('small', { class: 'muted' }, 'বন্ধ থাকলে কাস্টমার নতুন অনলাইন অর্ডার দিতে পারবে না।'))));
    /* ৩) POS */
    var f2 = h('form', {
      class: 'v93c', onsubmit: function (e) {
        e.preventDefault(); var t = e.target.elements, tax = parseFloat(t.taxPct.value), low = parseInt(t.lowDefault.value, 10), idle = parseInt(t.idleMin.value, 10);
        if (isNaN(tax) || tax < 0 || tax > 50) return toast('VAT ০–৫০% হতে হবে', 1); if (isNaN(low) || low < 0) return toast('লো-স্টক ০ বা বেশি', 1); if (isNaN(idle) || idle < 0 || idle > 600) return toast('অটো-সাইন-আউট ০–৬০০ মিনিট', 1);
        snapshot(); var S = rj('pharmacy_settings', {}); Object.assign(S, { taxPct: tax, lowDefault: low, idleMin: idle, receiptNote: t.receiptNote.value.trim().slice(0, 120), rxEnforce: t.rxEnforce.checked }); wj('pharmacy_settings', S);
        D = db(); audit('Changed POS & receipt rules (Settings)'); save(D); toast('✔ POS সেটিং সেভ হয়েছে'); go();
      }
    }, h('h3', {}, '🧾 POS ও রিসিপ্ট'), h('div', { class: 'v93g' }, lbl('VAT / ট্যাক্স %', inp('taxPct', P.taxPct == null ? 10 : P.taxPct, 'number', { min: 0, max: 50, step: 0.5 })), lbl('ডিফল্ট লো-স্টক', inp('lowDefault', P.lowDefault == null ? 20 : P.lowDefault, 'number', { min: 0 })), lbl('অটো-সাইন-আউট (মিনিট, 0 = বন্ধ)', inp('idleMin', P.idleMin == null ? 30 : P.idleMin, 'number', { min: 0, max: 600 })), lbl('রিসিপ্ট-নোট', inp('receiptNote', P.receiptNote || '🙏 Thank you for shopping with us!', 'text', { maxlength: 120 }))), h('p', {}, chk('rxEnforce', P.rxEnforce !== false, 'Rx ওষুধ বিক্রিতে অনুমোদিত রোল ও প্রেসক্রিপশন রেফারেন্স বাধ্যতামূলক')), h('p', { class: 'v93h' }, h('button', { class: 'btn' }, 'Save POS rules')));
    root.append(f2);
    /* ৪) আগের অবস্থা + এক্সপোর্ট/ইমপোর্ট */
    var prev = rj('mc_settings_prev', null);
    var undo = h('button', { disabled: !prev, onclick: function () { var p = rj('mc_settings_prev', null); if (!p) return; Promise.resolve(window.MCD ? MCD.confirm('শেষ সেভের আগের সেটিংসে ফিরবেন? (' + dhaka(p.at) + ')') : confirm('ফিরবেন?')).then(function (ok) { if (!ok) return; D = db(); Object.keys(SHOP).forEach(function (k) { if (k in p.shop) D.settings[k] = p.shop[k]; else delete D.settings[k]; }); wj('pharmacy_settings', p.pos); audit('Settings reverted to previous (' + dhaka(p.at) + ')'); save(D); localStorage.removeItem('mc_settings_prev'); toast('↩ আগের অবস্থায় ফেরা হয়েছে'); go(); }); } }, '↩ আগের অবস্থায় ফিরুন' + (prev ? ' (' + dhaka(prev.at) + ')' : ''));
    var exp = h('button', { onclick: function () { D = db(); var o = { app: 'medicare-settings', v: 1, at: new Date().toISOString(), shop: {}, pos: {} }; Object.keys(SHOP).forEach(function (k) { if (k in D.settings) o.shop[k] = D.settings[k]; }); var S = rj('pharmacy_settings', {}); Object.keys(POS).forEach(function (k) { if (k in S) o.pos[k] = S[k]; }); var a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' })), download: 'medicare-settings-' + new Date(Date.now() + 216e5).toISOString().slice(0, 10) + '.json' }); document.body.append(a); a.click(); a.remove(); } }, '⬇ সেটিংস JSON');
    var imp = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: function (e) { var f = e.target.files[0]; e.target.value = ''; if (!f) return; f.text().then(function (t) { var o = JSON.parse(t); if (o.app !== 'medicare-settings') throw 0; var a = clean(SHOP, o.shop || {}), b = clean(POS, o.pos || {}); if (a.bad || b.bad) { return toast('ফাইলে অবৈধ মান: ' + (a.bad || b.bad), 1); } var n = Object.keys(a.ok).length + Object.keys(b.ok).length; if (!n) return toast('ফাইলে কিছু নেই', 1); return Promise.resolve(window.MCD ? MCD.confirm(n + 'টি সেটিং ইমপোর্ট হবে (বর্তমান মান বদলাবে)। চালিয়ে যাবেন?') : confirm(n + ' টি সেটিং ইমপোর্ট?')).then(function (ok) { if (!ok) return; snapshot(); D = db(); Object.assign(D.settings, a.ok); var S = rj('pharmacy_settings', {}); Object.assign(S, b.ok); wj('pharmacy_settings', S); audit('Imported settings (' + n + ')'); save(D); toast('✔ ইমপোর্ট হয়েছে'); go(); }); }).catch(function () { toast('এটি সঠিক সেটিংস ফাইল নয়', 1); }); } });
    root.append(h('div', { class: 'v93c' }, h('h3', {}, '🧰 ব্যাকআপ ও রিভার্ট'), h('div', { class: 'row' }, undo, exp, h('label', { class: 'btn2' }, '⬆ ইমপোর্ট', imp)), h('small', { class: 'muted' }, 'শুধু সেটিংস (দাম/স্টক/অর্ডার নয়)। পাসওয়ার্ড বা অ্যাকাউন্ট এতে নেই।')));
    /* ৫) ইতিহাস */
    var hist = (D.audit || []).filter(function (x) { return /^(Changed|Imported|Settings reverted|Free)/.test(x.msg) || /settings|rules/i.test(x.msg); }).slice().reverse();
    var body = h('div', {}), q = h('input', { type: 'search', placeholder: 'ইতিহাসে খুঁজুন…', 'aria-label': 'Search history', style: 'flex:1;min-width:160px' });
    function draw() { var v = q.value.trim().toLowerCase(), L = hist.filter(function (x) { return !v || (x.msg + x.by).toLowerCase().indexOf(v) >= 0; }); body.replaceChildren(L.length ? tbl(['When', 'Role', 'Change'], L.slice(0, 40).map(function (x) { return h('tr', {}, h('td', {}, dhaka(x.at)), h('td', {}, x.by), h('td', {}, x.msg)); })) : h('p', { class: 'muted' }, 'কিছু নেই')); }
    q.oninput = draw; draw();
    root.append(h('div', { class: 'v93c' }, h('h3', {}, '🕘 সেটিংস-পরিবর্তনের ইতিহাস (' + hist.length + ')'), h('div', { class: 'row' }, q, h('button', { onclick: function () { csv('settings-history.csv', [['When', 'Role', 'Change']].concat(hist.map(function (x) { return [dhaka(x.at), x.by, x.msg]; }))); } }, '⬇ CSV')), body));
    /* মূল (পুরনো) অংশ: বেসিক */
    var det = h('details', { class: 'v93c' }, h('summary', {}, '⚙ বেসিক (দোকানের নাম, ইনভয়েস প্রিফিক্স, ডেলিভারি ফি, মেয়াদ-সীমা) ও অডিট ট্রেইল')); det.append(base); det.open = true;
    root.append(det);
    return root;
  };
})();
