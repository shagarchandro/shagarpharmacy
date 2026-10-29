/* v92 — Ops Panel:
   • Products: KPI (SKU, Rx, কম/শেষ স্টক, স্টক-মূল্য, গড় মার্জিন), ফিল্টার-চিপ (Rx/OTC/কম স্টক/স্টক শেষ/কম মার্জিন), মার্জিন % দাম-ঘরে, "নতুন পণ্য" ফর্ম ভাঁজযোগ্য
   • POS: খোঁজার ফলাফল-তালিকা (নাম/জেনেরিক/SKU/বারকোড, স্টক ও দামসহ), লাইভ মোট/ফেরত-টাকা, দ্রুত ক্যাশ-বাটন, Rx পণ্য সতর্কতা, Ctrl+Enter = বিক্রি সম্পন্ন, F2 = খোঁজা
   • Expenses: ক্যাটাগরি-চিপ ("Rent: …"), এই মাসের মোট ও ক্যাটাগরি-ভিত্তিক সারাংশ */
(function () {
  'use strict';
  if (typeof V === 'undefined' || typeof h !== 'function' || typeof D === 'undefined') return;
  var st = document.createElement('style');
  st.textContent = '.v92h{display:none!important}.v92k{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.5rem;margin:.4rem 0}.v92k div{border:1px solid var(--br,#cfe3dd);border-radius:12px;padding:.5rem;text-align:center}.v92k b{display:block;font-size:1.15rem}.v92c{display:flex;flex-wrap:wrap;gap:.35rem;margin:.4rem 0}.v92c button{border-radius:99px!important;padding:.2rem .7rem!important;font-size:.85rem}.v92c button.on{background:var(--pri,#0b7a6b)!important;color:#fff!important}.v92r{border:1px solid var(--br,#cfe3dd);border-radius:10px;margin:.2rem 0;overflow:hidden}.v92r button{display:flex;width:100%;justify-content:space-between;gap:.6rem;border:0!important;border-radius:0!important;text-align:left}.v92r button:hover,.v92r button.sel{background:rgba(11,122,107,.1)!important}.v92w{background:#fff4e5;color:#8a4b00;border-radius:8px;padding:.4rem .7rem;margin:.4rem 0}.v92d{border:1px dashed var(--br,#cfe3dd);border-radius:10px;padding:.4rem .7rem;margin:.5rem 0}html[data-mc=dark] .v92w,html[data-theme=dark] .v92w{background:#3a2a10;color:#ffd9a0}@media(prefers-color-scheme:dark){html:not([data-mc=light]) .v92w{background:#3a2a10;color:#ffd9a0}}';
  document.head.appendChild(st);
  var num = function (t) { return +String(t || '').replace(/[^\d.]/g, '') || 0; };

  /* ---------------- Products ---------------- */
  if (V.products) {
    var P0 = V.products, PF = '';
    V.products = function () {
      var r = P0.apply(this, arguments), P = D.products || [];
      var low = function (p) { var s = stock(D, p.id); return s > 0 && s < (p.reorder || 0); }, out = function (p) { return stock(D, p.id) <= 0; };
      var mar = function (p) { return p.price > 0 ? (eff(p) - (+p.cost || 0)) / eff(p) * 100 : 0; };
      var val = P.reduce(function (a, p) { return a + Math.max(0, stock(D, p.id)) * (+p.cost || 0); }, 0), avgM = P.length ? P.reduce(function (a, p) { return a + mar(p); }, 0) / P.length : 0;
      var kp = h('div', { class: 'v92k' }, [[P.length, 'পণ্য'], [P.filter(function (p) { return p.rx; }).length, 'Rx পণ্য'], [P.filter(low).length, 'কম স্টক'], [P.filter(out).length, 'স্টক শেষ'], [money(Math.round(val)), 'স্টক-মূল্য (cost)'], [avgM.toFixed(0) + '%', 'গড় মার্জিন']].map(function (x) { return h('div', {}, h('b', {}, String(x[0])), x[1]); }));
      var rows = function () { return Array.prototype.slice.call(r.querySelectorAll('tbody tr')); };
      var byName = {}; P.forEach(function (p) { byName[p.name] = p; });
      function apply() { rows().forEach(function (tr) { var p = byName[(tr.children[0] || {}).textContent]; var ok = !PF || !p || (PF === 'rx' ? p.rx : PF === 'otc' ? !p.rx : PF === 'low' ? low(p) : PF === 'out' ? out(p) : PF === 'lowm' ? mar(p) < 15 : true); tr.classList.toggle('v92h', !ok); }); chips.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-f') === PF); }); }
      var chips = h('div', { class: 'v92c', role: 'group', 'aria-label': 'Filter' }, [['', 'সব'], ['rx', 'Rx'], ['otc', 'OTC'], ['low', '📉 কম স্টক'], ['out', '⛔ স্টক শেষ'], ['lowm', '💸 কম মার্জিন (<15%)']].map(function (x) { return h('button', { 'data-f': x[0], onclick: function () { PF = x[0]; apply(); } }, x[1]); }));
      /* মার্জিন % কস্ট-ঘরে */
      rows().forEach(function (tr) { var p = byName[(tr.children[0] || {}).textContent]; if (!p || !tr.children[3]) return; var m = mar(p); tr.children[3].append(h('small', { class: 'muted', style: 'display:block;color:' + (m < 15 ? '#c0392b' : 'inherit') }, m.toFixed(0) + '% মার্জিন')); if (tr.children[5] && stock(D, p.id) <= 0) tr.children[5].style.color = '#c0392b'; });
      /* ফর্ম ভাঁজ */
      var f = r.querySelector('form'); if (f && f.parentNode) { var d = h('details', { class: 'v92d' }, h('summary', {}, '＋ নতুন পণ্য যোগ করুন')); f.replaceWith(d); d.append(f); }
      var tb = r.querySelector('table'); if (tb) { tb.before(chips); r.insertBefore(kp, r.firstChild); }
      apply();
      new MutationObserver(function () { setTimeout(apply, 0); }).observe(r, { childList: true, subtree: true, characterData: false });
      return r;
    };
  }

  /* ---------------- POS ---------------- */
  if (V.pos) {
    var POS0 = V.pos;
    V.pos = function () {
      var r = POS0.apply(this, arguments), q = r.querySelector('#pq'), cash = r.querySelector('input[aria-label="Cash received"]'), disc = r.querySelector('input[aria-label="Discount ৳"]'), pay = r.querySelector('select[aria-label="Payment"]');
      if (!q || typeof cartPOS === 'undefined') return r;
      var sub = cartPOS.reduce(function (a, l) { return a + l.price * l.qty; }, 0);
      /* ফলাফল-তালিকা */
      var res = h('div', { class: 'v92r', hidden: true }); q.after(res); q.setAttribute('autocomplete', 'off'); q.placeholder = 'বারকোড স্ক্যান বা নাম/জেনেরিক লিখুন (F2)';
      var sel = -1, list = [];
      function addP(p) { var l = cartPOS.find(function (x) { return x.pid === p.id; }) || (cartPOS.push({ pid: p.id, name: p.name, price: eff(p), qty: 0 }), cartPOS[cartPOS.length - 1]); if (l.qty + 1 > stock(D, p.id)) { if (!l.qty) cartPOS.pop(); return toast('Insufficient unexpired stock', 1); } l.qty++; go(); setTimeout(function () { var n = document.getElementById('pq'); if (n) n.focus(); }, 30); }
      function find() { var v = q.value.trim().toLowerCase(); if (v.length < 2) { res.hidden = true; list = []; return; } list = D.products.filter(function (p) { return [p.name, p.generic, p.sku, p.barcode].join(' ').toLowerCase().indexOf(v) >= 0; }).slice(0, 6); sel = -1; res.hidden = !list.length; res.replaceChildren.apply(res, list.map(function (p, i) { var s = stock(D, p.id); return h('button', { type: 'button', onclick: function () { addP(p); } }, h('span', {}, p.name + (p.rx ? ' · Rx' : '') + ' ', h('small', { class: 'muted' }, p.generic || '')), h('span', { style: s ? '' : 'color:#c0392b' }, money(eff(p)) + ' · ' + (s ? s + ' স্টকে' : 'শেষ'))); })); }
      q.addEventListener('input', find);
      q.addEventListener('keydown', function (e) { if (!list.length) return; var b = res.children; if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length; Array.prototype.forEach.call(b, function (x, i) { x.classList.toggle('sel', i === sel); }); e.preventDefault(); } else if (e.key === 'Enter' && sel >= 0) { e.stopImmediatePropagation(); e.preventDefault(); addP(list[sel]); } }, true);
      /* লাইভ মোট ও ফেরত */
      var live = h('p', { class: 'price', id: 'v92live' }); var pr = r.querySelector('p.price'); if (pr) pr.after(live);
      var quick = h('div', { class: 'v92c' }, [50, 100, 200, 500, 1000].map(function (n) { return h('button', { type: 'button', onclick: function () { cash.value = n; upd(); } }, '৳' + n); }), h('button', { type: 'button', onclick: function () { cash.value = Math.max(0, sub - (+disc.value || 0)); upd(); } }, 'ঠিক টাকা'));
      if (cash) cash.closest('label').after(quick);
      function upd() { var d = Math.min(+disc.value || 0, sub), tot = sub - d, c = +cash.value || 0, isCash = pay.value === 'Cash'; live.textContent = 'মোট ' + money(tot) + (isCash && cash.value !== '' ? (c >= tot ? ' · ফেরত ' + money(c - tot) : ' · ⚠ আরও ' + money(tot - c) + ' লাগবে') : ''); live.style.color = isCash && cash.value !== '' && c < tot ? '#c0392b' : ''; quick.hidden = !isCash; }
      [cash, disc, pay].forEach(function (x) { if (x) { x.addEventListener('input', upd); x.addEventListener('change', upd); } }); upd();
      /* Rx সতর্কতা */
      var rxl = cartPOS.map(function (l) { return D.products.find(function (p) { return p.id === l.pid; }); }).filter(function (p) { return p && p.rx; });
      if (rxl.length) r.insertBefore(h('div', { class: 'v92w' }, '📋 Rx পণ্য আছে: ' + rxl.map(function (p) { return p.name; }).join(', ') + ' — প্রেসক্রিপশন দেখে নিন।'), r.children[2] || null);
      return r;
    };
    document.addEventListener('keydown', function (e) {
      if (typeof tab === 'undefined' || tab !== 'pos') return;
      if (e.key === 'F2') { var q = document.getElementById('pq'); if (q) { q.focus(); q.select(); e.preventDefault(); } }
      else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { var b = Array.prototype.find.call(document.querySelectorAll('#app button.btn'), function (x) { return /Complete sale/.test(x.textContent); }); if (b) { b.click(); e.preventDefault(); } }
    });
  }

  /* ---------------- Expenses ---------------- */
  if (V.expenses) {
    var E0 = V.expenses, CATS = ['Rent', 'Utilities', 'Salary', 'Transport', 'Tea & Snacks', 'Repair', 'Other'];
    V.expenses = function () {
      var r = E0.apply(this, arguments), inp = r.querySelector('form input'), ym = new Date(Date.now() + 216e5).toISOString().slice(0, 7);
      var mo = (D.expenses || []).filter(function (e) { return new Date(new Date(e.at).getTime() + 216e5).toISOString().slice(0, 7) === ym; }), tot = mo.reduce(function (a, e) { return a + e.amt; }, 0), by = {};
      mo.forEach(function (e) { var k = /^[^:]{2,20}:/.test(e.what) ? e.what.split(':')[0].trim() : 'অন্যান্য'; by[k] = (by[k] || 0) + e.amt; });
      var sum = h('div', { class: 'v92d' }, h('b', {}, 'এই মাসের খরচ: ' + money(tot) + ' (' + mo.length + 'টি)'), h('div', {}, Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }).map(function (k) { return h('span', { class: 'tag', style: 'margin:.15rem' }, k + ' ' + money(by[k])); })));
      if (inp) { var chips = h('div', { class: 'v92c' }, CATS.map(function (c) { return h('button', { type: 'button', onclick: function () { var v = inp.value.replace(/^[^:]{2,20}:\s*/, ''); inp.value = c + ': ' + v; inp.focus(); } }, c); })); var f = inp.closest('form'); f.before(chips); }
      r.insertBefore(sum, r.firstChild); return r;
    };
  }
})();
