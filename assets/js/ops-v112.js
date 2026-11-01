/* v112 — Ops Panel "রিয়েল" আপডেট
   💵 Cash Drawer  — শিফট খোলা (ওপেনিং ফ্লোট) → প্রতি শিফটের নিজস্ব হিসাব → নোট গুনে বন্ধ → গরমিলের কারণ বাধ্যতামূলক → Z-রিপোর্ট প্রিন্ট
                     (Owner/Cashier)। সেটিং: "শিফট খোলা না থাকলে ক্যাশ সেল বন্ধ"।
   📋 Stock Take   — ব্যাচ ধরে গুনে মেলানো (ব্লাইন্ড কাউন্ট ঐচ্ছিক), অগ্রগতি সেভ হয়, ভ্যারিয়েন্স প্রিভিউ, বড় লোকসানে Owner-এর অনুমোদন,
                     প্রয়োগে লগ + shrinkage খরচ (Owner/Inventory Manager/Pharmacist)।
   সব কাজ audit লগে লেখা হয়। */
(function () {
  'use strict';
  if (typeof V === 'undefined' || typeof ACC === 'undefined' || typeof h !== 'function' || typeof NAMES === 'undefined') return;
  var fresh = function () { D = db(); ens(); D.stocktakes = D.stocktakes || []; };
  var who = function () { return sessionStorage.getItem('mc_ops_name') || R; };
  var now = function () { return new Date().toISOString(); };
  var num = function (v) { return +v || 0; };
  var lg = function (m) { try { audit(m); } catch (e) { } };
  var el = function (t, p) { var a = [].slice.call(arguments, 2); return h.apply(null, [t, p || {}].concat(a)); };
  function css() {
    if (document.getElementById('v112css')) return; var s = document.createElement('style'); s.id = 'v112css';
    s.textContent = '.v112k{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.6rem;margin:.6rem 0}.v112k div{border:1px solid #cfe3dd;border-radius:12px;padding:.6rem .8rem;background:#fff}.v112k b{display:block;font-size:1.2rem}.v112k small{color:#5b6b7b}' +
      '.v112k .bad b{color:#b42318}.v112k .good b{color:#0b6b3a}.v112c{border:1px solid #cfe3dd;border-radius:12px;padding:.8rem;margin:.8rem 0;background:#f7fbfa}.v112c.w{background:#fff6e0;border-color:#f0d38a}.v112c.b{background:#fde8e6;border-color:#f1b5b0}' +
      '.v112d{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:.4rem}.v112d label{display:flex;align-items:center;gap:.3rem;font-size:.9rem}.v112d input{width:70px}' +
      '.v112t input.cnt{width:90px}.v112t tr.diff{background:#fff6e0}.v112t tr.neg{background:#fde8e6}.v112n{text-align:right;font-variant-numeric:tabular-nums}' +
      '.v112pb{height:12px;border-radius:99px;background:#d6e4de;overflow:hidden;margin:.3rem 0 .8rem}.v112pb i{display:block;height:100%;background:#2e9e5b}.v112tag{display:inline-block;border-radius:99px;padding:.05rem .55rem;font-size:.78rem;font-weight:700;background:#e5efec}.v112tag.b{background:#fde2e0;color:#7a1410}.v112tag.w{background:#fff0c2}.v112tag.g{background:#d9f5e5}' +
      '@media print{body>*:not(.v112print){display:none!important}.v112print{display:block!important}}';
    document.head.appendChild(s);
  }
  function printNode(node) {
    document.querySelectorAll('.v112print').forEach(function (x) { x.remove(); });
    var p = el('div', { class: 'v112print', style: 'display:none;font-family:system-ui;padding:14px;max-width:420px' }, node); document.body.appendChild(p);
    setTimeout(function () { window.print(); }, 60); setTimeout(function () { p.remove(); }, 2500);
  }
  function csv(name, rows) {
    var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"'; };
    var b = new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }
  var kp = function (rows) { return el('div', { class: 'v112k' }, rows.map(function (r) { return el('div', { class: r[2] || '' }, el('b', {}, r[1]), el('small', {}, r[0])); })); };

  /* ====================== 💵 Cash Drawer ====================== */
  var NOTES = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
  function span(open, until) {
    var a = open.at, z = until || now();
    var inR = function (t) { return t && t >= a && t <= z; };
    var sales = (D.sales || []).filter(function (s) { return inR(s.at); }), cash = sales.filter(function (s) { return s.pay === 'Cash'; });
    var by = {}; sales.forEach(function (s) { by[s.pay || '?'] = (by[s.pay || '?'] || 0) + num(s.total); });
    var cs = cash.reduce(function (t, s) { return t + num(s.total); }, 0);
    var ex = (D.expenses || []).filter(function (e) { return e.cash && inR(e.at); }).reduce(function (t, e) { return t + num(e.amt); }, 0);
    var rf = (D.refunds || []).filter(function (r) { return inR(r.at); }).reduce(function (t, r) { return t + num(r.amt); }, 0);
    return { cs: cs, n: cash.length, nAll: sales.length, by: by, ex: ex, rf: rf, expected: num(open.float) + cs - ex - rf, total: sales.reduce(function (t, s) { return t + num(s.total); }, 0) };
  }
  function zreport(s) {
    return el('div', {}, el('h2', {}, (D.settings.store || 'Pharmacy') + ' — Z Report'), el('p', {}, 'শিফট: ' + dhaka(s.openAt) + ' → ' + dhaka(s.at)), el('p', {}, 'ক্যাশিয়ার: ' + (s.name || s.by)),
      el('table', { style: 'width:100%;border-collapse:collapse' }, [['ওপেনিং ফ্লোট', s.float], ['ক্যাশ বিক্রি (' + s.nCash + ' বিল)', s.cashSales], ['ক্যাশ খরচ', -s.expenses], ['রিফান্ড', -s.refunds], ['হওয়া উচিত (Expected)', s.expected], ['গুনে পাওয়া (Counted)', s.counted], ['গরমিল', s.diff]].map(function (r) { return el('tr', {}, el('td', {}, r[0]), el('td', { style: 'text-align:right' }, money(r[1]))); })),
      el('h3', {}, 'পেমেন্ট ভেদে মোট বিক্রি'), el('table', { style: 'width:100%' }, Object.keys(s.bySales || {}).map(function (k) { return el('tr', {}, el('td', {}, k), el('td', { style: 'text-align:right' }, money(s.bySales[k]))); })), s.reason ? el('p', {}, 'গরমিলের কারণ: ' + s.reason) : '', el('p', {}, '____________ স্বাক্ষর'));
  }
  V.drawer = function () {
    css(); ens(); var open = D.shiftOpen, root = el('div', {}), isOwner = R === 'Owner';
    root.append(el('p', { class: 'muted' }, 'এক শিফট = এক ক্যাশ-ড্রয়ার সেশন। শুরুতে ওপেনিং ফ্লোট দিন, শেষে নোট গুনে বন্ধ করুন — কম/বেশি হলে কারণ লিখতে হবে।'));
    if (!open) {
      root.append(el('div', { class: 'v112c' }, el('h3', {}, '🔓 কোনো শিফট খোলা নেই'),
        el('form', { class: 'row', onsubmit: function (e) {
          e.preventDefault(); fresh(); if (D.shiftOpen) { toast('একটি শিফট আগেই খোলা আছে', 1); return go(); }
          var f = num(e.target.elements.fl.value); if (!(f >= 0) || f > 1e6 || e.target.elements.fl.value === '') return toast('ওপেনিং ফ্লোট ০ বা তার বেশি দিন', 1);
          D.shiftOpen = { id: uid('SH'), at: now(), by: R, name: who(), float: f }; lg('Shift opened (float ' + f + ')'); save(D); toast('শিফট খোলা হয়েছে'); go();
        } }, el('input', { name: 'fl', type: 'number', min: 0, step: 'any', placeholder: 'ওপেনিং ফ্লোট ৳', 'aria-label': 'Opening float' }), el('button', { class: 'btn' }, 'শিফট খুলুন'))));
    } else {
      var t = span(open), canClose = isOwner || (open.by === R && open.name === who());
      root.append(el('div', { class: 'v112c' }, el('h3', {}, '🔒 শিফট চলছে — ' + (open.name || open.by) + ' (' + dhaka(open.at) + ' থেকে)'),
        kp([['ওপেনিং ফ্লোট', money(open.float)], ['ক্যাশ বিক্রি (' + t.n + ' বিল)', money(t.cs)], ['ক্যাশ খরচ', money(t.ex)], ['রিফান্ড', money(t.rf)], ['এখন ড্রয়ারে থাকার কথা', money(t.expected), 'good']]),
        Object.keys(t.by).length ? el('p', { class: 'muted' }, 'পেমেন্ট ভেদে: ' + Object.keys(t.by).map(function (k) { return k + ' ' + money(t.by[k]); }).join(' · ')) : ''));
      if (!canClose) root.append(el('p', { class: 'muted', role: 'note' }, 'এই শিফট ' + (open.name || open.by) + '-এর; শুধু তিনি বা Owner বন্ধ করতে পারবেন।'));
      else {
        var inputs = {}, tot = el('b', {}, money(0)), diffEl = el('b', {}, ''), reason = el('input', { name: 'why', placeholder: 'গরমিলের কারণ (কম/বেশি হলে বাধ্যতামূলক)', 'aria-label': 'Reason', maxlength: 160, style: 'min-width:260px' });
        var manual = el('input', { type: 'number', min: 0, step: 'any', placeholder: 'অথবা মোট সরাসরি ৳', 'aria-label': 'Counted total', style: 'width:150px' });
        var counted = function () { if (manual.value !== '') return num(manual.value); return NOTES.reduce(function (a, n) { return a + n * Math.max(0, Math.floor(num(inputs[n].value))); }, 0); };
        var upd = function () { var c = counted(), d = c - t.expected; tot.textContent = money(c); diffEl.textContent = (d > 0 ? '+' : '') + money(d) + (d === 0 ? ' ✅ মিলেছে' : d < 0 ? ' ⚠ কম' : ' ⚠ বেশি'); diffEl.style.color = d === 0 ? '#0b6b3a' : '#b42318'; };
        var grid = el('div', { class: 'v112d' }, NOTES.map(function (n) { var i = el('input', { type: 'number', min: 0, step: 1, value: '', 'aria-label': '৳' + n + ' notes/coins', oninput: function () { manual.value = ''; upd(); } }); inputs[n] = i; return el('label', {}, '৳' + n + ' ×', i); }));
        manual.addEventListener('input', upd);
        root.append(el('div', { class: 'v112c w' }, el('h3', {}, '🧮 নোট গুনে শিফট বন্ধ করুন'), grid, el('p', {}, manual), el('p', {}, 'গুনে পাওয়া: ', tot, '   গরমিল: ', diffEl), el('p', {}, reason),
          el('button', { class: 'btn', onclick: function () {
            fresh(); var o = D.shiftOpen; if (!o) { toast('শিফট আগেই বন্ধ হয়েছে', 1); return go(); }
            var c = counted(); if (manual.value === '' && NOTES.every(function (n) { return inputs[n].value === ''; })) return toast('নোট গুনে সংখ্যা দিন (বা মোট ৳ লিখুন)', 1);
            if (!(c >= 0)) return toast('গোনা টাকা সঠিক নয়', 1);
            var z = now(), tt = span(o, z), d = Math.round((c - tt.expected) * 100) / 100, why = reason.value.trim();
            if (d !== 0 && why.length < 3) return toast('কম/বেশি হয়েছে (' + money(d) + ') — কারণ লিখুন', 1);
            if (!confirm('শিফট বন্ধ করবেন?\nহওয়া উচিত: ' + money(tt.expected) + '\nগুনে পাওয়া: ' + money(c) + '\nগরমিল: ' + money(d))) return;
            var rec = { at: z, openAt: o.at, by: o.by, name: o.name, closedBy: who(), float: o.float, cashSales: tt.cs, nCash: tt.n, expenses: tt.ex, refunds: tt.rf, expected: tt.expected, counted: c, diff: d, reason: why, bySales: tt.by, totalSales: tt.total, flag: Math.abs(d) >= 100 };
            D.shifts.push(rec); D.shiftOpen = null; lg('Shift closed: expected ' + tt.expected + ', counted ' + c + ', diff ' + d + (why ? ' (' + why + ')' : '')); save(D);
            toast(d === 0 ? 'শিফট বন্ধ — হিসাব মিলেছে ✅' : 'শিফট বন্ধ — গরমিল ' + money(d)); go(); if (confirm('Z-রিপোর্ট প্রিন্ট করবেন?')) printNode(zreport(rec));
          } }, 'শিফট বন্ধ করুন')));
        upd();
      }
    }
    if (isOwner) {
      var rs = D.settings.requireShift === true;
      root.append(el('div', { class: 'v112c' }, el('label', {}, el('input', { type: 'checkbox', checked: rs ? 'checked' : null, onchange: function (e) { fresh(); if (e.target.checked) D.settings.requireShift = true; else delete D.settings.requireShift; lg('Require open shift for cash sales: ' + e.target.checked); save(D); toast('সেটিং সেভ হয়েছে'); go(); } }), ' শিফট খোলা না থাকলে POS-এ ক্যাশ সেল বন্ধ রাখুন')));
    }
    var L = (D.shifts || []).filter(function (s) { return s.openAt; }); if (!isOwner) L = L.filter(function (s) { return s.by === R && (s.name || s.by) === who(); });
    L = L.slice().reverse(); var bad = L.filter(function (s) { return s.flag; }).length;
    root.append(el('h2', {}, 'শিফট ইতিহাস'), isOwner && bad ? el('p', { class: 'muted' }, '⚠ বড় গরমিল (≥৳১০০): ' + bad + 'টি শিফটে') : '',
      tbl(['খোলা', 'বন্ধ', 'কে', 'ফ্লোট', 'ক্যাশ বিক্রি', 'Expected', 'Counted', 'গরমিল', 'কারণ', ''], L.slice(0, 40).map(function (s) {
        return el('tr', { class: s.flag ? 'neg' : '' }, el('td', {}, dhaka(s.openAt)), el('td', {}, dhaka(s.at)), el('td', {}, s.name || s.by), el('td', { class: 'v112n' }, money(s.float)), el('td', { class: 'v112n' }, money(s.cashSales)), el('td', { class: 'v112n' }, money(s.expected)), el('td', { class: 'v112n' }, money(s.counted)),
          el('td', { class: 'v112n' }, el('span', { class: 'v112tag ' + (s.diff === 0 ? 'g' : s.flag ? 'b' : 'w') }, (s.diff > 0 ? '+' : '') + money(s.diff))), el('td', {}, s.reason || '—'), el('td', {}, el('button', { onclick: function () { printNode(zreport(s)); } }, '🖨 Z')));
      })));
    if (isOwner && L.length) root.append(el('p', {}, el('button', { class: 'btn', onclick: function () { csv('shifts-' + today() + '.csv', [['Opened', 'Closed', 'By', 'Float', 'CashSales', 'Expenses', 'Refunds', 'Expected', 'Counted', 'Diff', 'Reason']].concat(L.map(function (s) { return [s.openAt, s.at, s.name || s.by, s.float, s.cashSales, s.expenses, s.refunds, s.expected, s.counted, s.diff, s.reason || '']; }))); } }, '⬇ CSV')));
    return root;
  };
  NAMES.drawer = '💵 Cash Drawer';
  ['Owner', 'Cashier'].forEach(function (r) { if (ACC[r] && ACC[r].indexOf('drawer') < 0) ACC[r].push('drawer'); });
  /* শিফট-গেট: শিফট না থাকলে ক্যাশ সেল নয় */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b || tab !== 'pos' || (b.textContent || '').trim() !== 'Complete sale') return;
    fresh(); if (D.settings.requireShift !== true || D.shiftOpen) return;
    var sel = [].slice.call(document.querySelectorAll('#app select')).filter(function (s) { return [].some.call(s.options, function (o) { return o.value === 'Cash'; }); })[0];
    if (sel && sel.value === 'Cash') { e.stopImmediatePropagation(); e.preventDefault(); toast('আগে 💵 Cash Drawer থেকে শিফট খুলুন', 1); }
  }, true);
  /* পুরনো সারা-জীবনের "Close shift" বাটন → নতুন ড্রয়ারে */
  if (V.expenses) { var ex0 = V.expenses; V.expenses = function () { var r = ex0.apply(this, arguments); try { [].slice.call(r.querySelectorAll('button')).forEach(function (b) { if (b.textContent.trim() === 'Close shift') { var n = el('button', { onclick: function () { tab = ACC[R].indexOf('drawer') > -1 ? 'drawer' : tab; go(); } }, '💵 Cash Drawer-এ শিফট বন্ধ করুন'); b.replaceWith(n); } }); } catch (e) { } return r; }; }

  /* ====================== 📋 Stock Take ====================== */
  var STQ = '', LIM = function () { return num(D.settings.stockTakeLimit) > 0 ? num(D.settings.stockTakeLimit) : 2000; };
  var REASONS = ['Count correction', 'Damaged', 'Expired', 'Lost / theft', 'Found stock'];
  function lines(st) { return D.batches.filter(function (b) { return b.qty > 0 || (st.counts && st.counts[b.id] != null); }).sort(function (a, b) { return (nm(a.pid) + a.exp).localeCompare(nm(b.pid) + b.exp); }); }
  function variances(st) {
    var out = []; lines(st).forEach(function (b) { var c = st.counts[b.id]; if (c == null || c === '') return; var d = num(c) - b.qty; if (d !== 0) out.push({ b: b, c: num(c), d: d, v: d * num(b.cost) }); }); return out;
  }
  function applySt(st, by) {
    var vs = variances(st), at = now(), loss = 0, gain = 0;
    vs.forEach(function (x) { var b = D.batches.find(function (z) { return z.id === x.b.id; }); if (!b) return; b.qty = x.c; D.log.push({ at: at, pid: b.pid, batch: b.id, delta: x.d, ref: 'stocktake', why: st.reason + ' (' + st.id + ')' }); if (x.v < 0) loss += -x.v; else gain += x.v; });
    if (loss > 0) D.expenses.push({ at: at, what: 'Stock-take shrinkage ' + st.id, amt: Math.round(loss * 100) / 100 });
    D.stocktakes = D.stocktakes || []; D.stocktakes.push({ id: st.id, at: at, started: st.at, by: st.name || st.by, approvedBy: by, blind: !!st.blind, counted: Object.keys(st.counts).length, changed: vs.length, loss: loss, gain: gain, reason: st.reason, note: st.note || '' });
    lg('Stock-take ' + st.id + ' applied: ' + vs.length + ' batch changed, loss ' + loss + ', gain ' + gain); D.stocktake = null; save(D);
  }
  V.stocktake = function () {
    css(); ens(); D.stocktakes = D.stocktakes || []; var st = D.stocktake, root = el('div', {}), isOwner = R === 'Owner';
    root.append(el('p', { class: 'muted' }, 'শেলফে সত্যিকারের ওষুধ গুনে সিস্টেমের সাথে মেলান। গোনা সেভ হতে থাকে — মাঝপথে বন্ধ করলেও চলবে। বড় লোকসান (৳' + LIM().toLocaleString('en-IN') + '+) হলে Owner-এর অনুমোদন লাগে।'));
    if (!st) {
      var blind = el('input', { type: 'checkbox', id: 'stb', checked: 'checked' });
      root.append(el('div', { class: 'v112c' }, el('h3', {}, '📋 নতুন স্টক-টেক'), el('label', {}, blind, ' ব্লাইন্ড কাউন্ট (গোনার সময় সিস্টেমের সংখ্যা লুকানো — সৎ গণনার জন্য ভালো)'), el('p', {}, el('button', { class: 'btn', onclick: function () {
        fresh(); if (D.stocktake) return go(); D.stocktake = { id: 'ST-' + (D.stocktakes.length + 1), at: now(), by: R, name: who(), blind: blind.checked, counts: {}, status: 'counting' }; lg('Stock-take started ' + D.stocktake.id); save(D); go();
      } }, 'শুরু করুন'))));
    } else {
      var L = lines(st), done = L.filter(function (b) { return st.counts[b.id] != null && st.counts[b.id] !== ''; }).length, pct = L.length ? Math.round(done / L.length * 100) : 0, reveal = !st.blind || st.reveal;
      var canEdit = st.status === 'counting' && (isOwner || (st.by === R && (st.name || st.by) === who()) || ['Inventory Manager', 'Pharmacist'].indexOf(R) > -1);
      root.append(el('div', { class: 'v112c' }, el('b', {}, st.id + ' · ' + (st.name || st.by) + ' · ' + dhaka(st.at) + ' · ' + (st.blind ? 'ব্লাইন্ড' : 'সিস্টেম-সংখ্যা সহ')), el('span', { class: 'v112tag ' + (st.status === 'counting' ? 'w' : 'b'), style: 'margin-left:.5rem' }, st.status === 'counting' ? 'গোনা চলছে' : 'Owner-এর অনুমোদনের অপেক্ষায়'),
        el('p', {}, 'গোনা হয়েছে ' + done + ' / ' + L.length + ' ব্যাচ (' + pct + '%)'), el('div', { class: 'v112pb' }, el('i', { style: 'width:' + pct + '%' }))));
      var q = el('input', { type: 'search', placeholder: 'ওষুধ/ব্যাচ খুঁজুন…', 'aria-label': 'Search', value: STQ, oninput: function (e) { STQ = e.target.value.toLowerCase(); rows.forEach(function (r) { r.tr.style.display = !STQ || r.k.indexOf(STQ) > -1 ? '' : 'none'; }); } });
      var rows = [], totEl = el('b', {}, '');
      var recalc = function () { var vs = variances(D.stocktake); totEl.textContent = vs.length + 'টি ব্যাচে গরমিল · নিট ' + money(vs.reduce(function (a, x) { return a + x.v; }, 0)); };
      L.forEach(function (b) {
        var cur = st.counts[b.id], exp = b.exp < today(), vc = el('td', { class: 'v112n' }, ''), val = el('td', { class: 'v112n' }, '');
        var tr = el('tr', {}, el('td', {}, nm(b.pid) + (exp ? ' ⏳' : '')), el('td', {}, b.no), el('td', {}, b.exp), el('td', { class: 'v112n' }, reveal ? b.qty : '•••'), el('td', {}, el('input', { class: 'cnt', type: 'number', min: 0, max: 1e6, step: 1, inputmode: 'numeric', value: cur == null ? '' : cur, disabled: canEdit ? null : 'disabled', 'aria-label': 'Counted ' + nm(b.pid) + ' ' + b.no,
          onchange: function (e) { var v = e.target.value; fresh(); if (!D.stocktake) return;
            if (v !== '' && (!/^\d+$/.test(v) || +v > 1e6)) { toast('শুধু পূর্ণসংখ্যা (০ বা বেশি)', 1); e.target.value = D.stocktake.counts[b.id] == null ? '' : D.stocktake.counts[b.id]; return; }
            if (v === '') delete D.stocktake.counts[b.id]; else D.stocktake.counts[b.id] = +v; save(D); paint(); } })), vc, val);
        var paint = function () { var s2 = D.stocktake || st, c = s2.counts[b.id]; if (c == null || c === '') { vc.textContent = ''; val.textContent = ''; tr.className = ''; } else { var d = num(c) - b.qty; vc.textContent = reveal ? (d > 0 ? '+' : '') + d : (d === 0 ? '✓' : '≠'); val.textContent = reveal && d ? money(d * num(b.cost)) : ''; tr.className = d === 0 ? '' : d < 0 ? 'neg' : 'diff'; } recalc(); };
        rows.push({ tr: tr, k: (nm(b.pid) + ' ' + b.no).toLowerCase() }); paint();
      });
      root.append(el('p', {}, q, ' ', st.blind && !st.reveal && canEdit ? el('button', { onclick: function () { if (!confirm('সিস্টেমের সংখ্যা দেখাবেন? গোনা শেষ হলেই দেখুন।')) return; fresh(); D.stocktake.reveal = true; save(D); go(); } }, '👁 সিস্টেম-সংখ্যা দেখান') : '', ' ', totEl),
        el('div', { class: 'scroll v112t' }, el('table', {}, el('thead', {}, el('tr', {}, ['ওষুধ', 'ব্যাচ', 'মেয়াদ', 'সিস্টেম', 'গোনা', 'ফারাক', 'মূল্য'].map(function (x) { return el('th', {}, x); }))), el('tbody', {}, rows.map(function (r) { return r.tr; })))));
      recalc();
      var vs = variances(st), net = vs.reduce(function (a, x) { return a + x.v; }, 0), loss = vs.reduce(function (a, x) { return a + (x.v < 0 ? -x.v : 0); }, 0), unc = L.length - done;
      if (st.status === 'counting' && canEdit) {
        var rsn = el('select', { 'aria-label': 'Reason' }, REASONS.map(function (r) { return el('option', { value: r }, r); })), note = el('input', { placeholder: 'নোট (ঐচ্ছিক)', maxlength: 160 });
        root.append(el('div', { class: 'v112c ' + (loss > LIM() ? 'w' : '') }, el('h3', {}, '✅ শেষ করুন'), kp([['গরমিল ব্যাচ', vs.length], ['নিট মূল্য', money(net), net < 0 ? 'bad' : 'good'], ['লোকসান', money(loss), loss ? 'bad' : ''], ['গোনা হয়নি', unc]]),
          unc ? el('p', { class: 'muted' }, '⚠ ' + unc + 'টি ব্যাচ গোনা হয়নি — এগুলো বদলানো হবে না।') : '', loss > LIM() && !isOwner ? el('p', { class: 'muted' }, 'লোকসান ৳' + LIM().toLocaleString('en-IN') + '-এর বেশি — Owner-এর অনুমোদনে যাবে।') : '',
          el('div', { class: 'row' }, el('label', {}, 'কারণ ', rsn), note, el('button', { class: 'btn', onclick: function () {
            fresh(); var s = D.stocktake; if (!s) return go(); if (!Object.keys(s.counts).length) return toast('কিছুই গোনা হয়নি', 1);
            s.reason = rsn.value; s.note = note.value.trim(); var v2 = variances(s), l2 = v2.reduce(function (a, x) { return a + (x.v < 0 ? -x.v : 0); }, 0);
            if (!v2.length) { if (!confirm('কোনো গরমিল নেই — সব মিলেছে। স্টক-টেক শেষ করবেন?')) return; }
            else if (!confirm(v2.length + 'টি ব্যাচের স্টক বদলাবে (নিট ' + money(v2.reduce(function (a, x) { return a + x.v; }, 0)) + '). নিশ্চিত?')) return;
            if (l2 > LIM() && R !== 'Owner') { s.status = 'pending'; lg('Stock-take ' + s.id + ' submitted for approval (loss ' + l2 + ')'); save(D); toast('Owner-এর অনুমোদনের জন্য পাঠানো হয়েছে'); return go(); }
            applySt(s, who()); toast('স্টক-টেক প্রয়োগ হয়েছে'); go();
          } }, 'প্রয়োগ করুন'), el('button', { onclick: function () { if (!confirm('এই স্টক-টেক বাতিল করবেন? গোনা মুছে যাবে।')) return; fresh(); lg('Stock-take ' + D.stocktake.id + ' cancelled'); D.stocktake = null; save(D); go(); } }, 'বাতিল'))));
      }
      if (st.status === 'pending') {
        root.append(el('div', { class: 'v112c b' }, el('h3', {}, '⏳ অনুমোদনের অপেক্ষায়'), kp([['গরমিল ব্যাচ', vs.length], ['নিট মূল্য', money(net), 'bad'], ['লোকসান', money(loss), 'bad']]),
          isOwner ? el('div', { class: 'row' }, el('button', { class: 'btn', onclick: function () { if (!confirm('অনুমোদন দিয়ে স্টক বদলাবেন?')) return; fresh(); applySt(D.stocktake, who()); toast('অনুমোদিত ও প্রয়োগ হয়েছে'); go(); } }, '✅ অনুমোদন ও প্রয়োগ'), el('button', { onclick: function () { fresh(); D.stocktake.status = 'counting'; lg('Stock-take ' + D.stocktake.id + ' sent back for recount'); save(D); go(); } }, '↩ আবার গুনতে পাঠান')) : el('p', { class: 'muted' }, 'শুধু Owner অনুমোদন দিতে পারবেন।')));
      }
    }
    var H = (D.stocktakes || []).slice().reverse();
    root.append(el('h2', {}, 'আগের স্টক-টেক'), tbl(['ID', 'তারিখ', 'কে', 'অনুমোদন', 'ব্যাচ বদলেছে', 'লোকসান', 'বাড়তি', 'কারণ'], H.slice(0, 30).map(function (s) { return el('tr', {}, el('td', {}, s.id), el('td', {}, dhaka(s.at)), el('td', {}, s.by), el('td', {}, s.approvedBy || ''), el('td', { class: 'v112n' }, s.changed), el('td', { class: 'v112n' }, money(s.loss)), el('td', { class: 'v112n' }, money(s.gain)), el('td', {}, s.reason + (s.note ? ' — ' + s.note : ''))); })));
    if (H.length) root.append(el('p', {}, el('button', { onclick: function () { csv('stocktakes-' + today() + '.csv', [['ID', 'Date', 'By', 'Approved', 'Changed', 'Loss', 'Gain', 'Reason', 'Note']].concat(H.map(function (s) { return [s.id, s.at, s.by, s.approvedBy, s.changed, s.loss, s.gain, s.reason, s.note]; }))); } }, '⬇ CSV')));
    return root;
  };
  NAMES.stocktake = '📋 Stock Take';
  ['Owner', 'Inventory Manager', 'Pharmacist'].forEach(function (r) { if (ACC[r] && ACC[r].indexOf('stocktake') < 0) ACC[r].push('stocktake'); });
  var nav = document.querySelector('header.bar nav');
  if (nav) ['drawer', 'stocktake'].forEach(function (k) {
    if (ACC[R].indexOf(k) < 0) return;
    var b = el('button', { onclick: function () { tab = k; go(); } }, NAMES[k]); nav.append(b);
  });
  try { if (typeof window.mcNavRefresh === 'function') window.mcNavRefresh(); } catch (e) { }
})();
