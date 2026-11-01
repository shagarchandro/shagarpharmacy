/* v110 — Shopping Cart আরও আপডেট (shop.html#/cart)
   দাম/স্টক বদলের সতর্কতা · সস্তা বিকল্প (একই জেনেরিক) · কুপন চিপ + উপলভ্য কুপন · Undo · কপি/WhatsApp/প্রিন্ট · ডেলিভারি তুলনা ·
   প্রতি-আইটেম সর্বোচ্চ সংখ্যা (Control Center → 🛒 Cart Rules) · অন্য ট্যাবে কার্ট বদলালে অটো-সিঙ্ক */
(function () {
  'use strict';
  var SNAP = 'mc_cartsnap';
  var bn = function () { try { return lang() === 'bn'; } catch (e) { return true; } };
  var tx = function (b, e) { return bn() ? b : e; };
  var rj = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var cfg = function () { var s = (D && D.settings && D.settings.cartRules) || {}; return { max: Math.max(0, Math.floor(+s.max) || 0), alert: s.alert !== false, swap: s.swap !== false, coupons: s.coupons !== false, undo: s.undo !== false, share: s.share !== false }; };
  var prod = function (id) { return D.products.find(function (p) { return p.id === id; }); };
  var route = function () { return (location.hash.slice(2) || 'catalog').split('/')[0]; };

  var st = document.createElement('style');
  st.textContent = '.c110{border:1px solid #cfe3dd;border-radius:12px;padding:.55rem .8rem;margin:.6rem 0;background:#f1f8f6}.c110.w{background:#fff6e0;border-color:#f0d38a}.c110.b{background:#fde8e6;border-color:#f1b5b0}' +
    '.c110 h3{margin:.1rem 0 .3rem;font-size:1rem}.c110 .r{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin:.25rem 0}.c110 button{cursor:pointer}' +
    '.c110chip{display:inline-flex;gap:.4rem;align-items:center;background:#0f766e;color:#fff;border-radius:99px;padding:.15rem .7rem;font-weight:700}.c110chip button{background:none;border:0;color:#fff;font-size:1rem;line-height:1}' +
    '.c110d{font-size:.78rem;font-weight:700;border-radius:99px;padding:.05rem .45rem;margin-left:.3rem}.c110d.up{background:#fde2e0;color:#7a1410}.c110d.dn{background:#d9f5e5;color:#0b5a32}' +
    '#c110u{position:fixed;left:50%;transform:translateX(-50%);bottom:70px;z-index:9999;background:#12263a;color:#fff;border-radius:12px;padding:.55rem 1rem;display:flex;gap:.8rem;align-items:center;box-shadow:0 6px 20px #0005}#c110u button{background:#2dd4bf;border:0;border-radius:8px;padding:.25rem .7rem;font-weight:700;cursor:pointer}' +
    '@media print{.c110 button,#c110u{display:none}}';
  document.head.appendChild(st);

  /* ---- সর্বোচ্চ সংখ্যা: কার্ট ক্ল্যাম্প ---- */
  function clamp() {
    var m = cfg().max; if (!m) return false;
    var c = cart(), ch = [];
    Object.keys(c).forEach(function (i) { if (c[i] > m) { c[i] = m; ch.push(i); } });
    if (ch.length) { localStorage.setItem('mc_cart', JSON.stringify(c)); try { toast(tx('প্রতি পণ্যে সর্বোচ্চ ' + m + 'টি অর্ডার করা যায়', 'Max ' + m + ' per item per order'), 1); } catch (e) { } }
    return ch.length > 0;
  }
  if (typeof place === 'function') {
    var _pl = place;
    place = function () {
      D = db(); var m = cfg().max, c = cart();
      if (m && Object.keys(c).some(function (i) { return c[i] > m; })) { clamp(); render(); return; }
      return _pl.apply(this, arguments);
    };
  }

  /* ---- Undo ---- */
  var undoT;
  function undoBar(snap, label) {
    var old = document.getElementById('c110u'); if (old) old.remove(); clearTimeout(undoT);
    var b = h('div', { id: 'c110u', role: 'status' }, h('span', {}, label), h('button', { onclick: function () { localStorage.setItem('mc_cart', JSON.stringify(snap)); b.remove(); render(); } }, tx('↩ ফিরিয়ে আনুন', '↩ Undo')));
    document.body.appendChild(b); undoT = setTimeout(function () { b.remove(); }, 7000);
  }
  document.addEventListener('click', function (e) {
    if (route() !== 'cart' || !cfg().undo) return;
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    var t = (b.textContent || '').trim(); if (!(t === 'Remove' || /🗑/.test(t))) return;
    var snap = rj('mc_cart', {}), n0 = JSON.stringify(snap);
    setTimeout(function () { if (JSON.stringify(rj('mc_cart', {})) !== n0) undoBar(snap, /🗑/.test(t) ? tx('কার্ট খালি হয়েছে', 'Cart cleared') : tx('পণ্য সরানো হয়েছে', 'Item removed')); }, 60);
  }, true);

  /* ---- সংযোজন ---- */
  function extras(a) {
    var C = cfg(), c = cart(), ids = Object.keys(c).filter(prod); if (!ids.length) return;
    var tbl = a.querySelector('table'), rows = a.querySelectorAll('table tbody tr'), snap = rj(SNAP, {}), now = Date.now(), alerts = [];
    ids.forEach(function (id, n) {
      var p = prod(id), s = stock(D, id), tr = rows[n], price = eff(p), old = snap[id];
      if (C.alert && old && old.p !== price && tr) {
        var d = price - old.p; tr.children[0].append(h('span', { class: 'c110d ' + (d > 0 ? 'up' : 'dn'), title: tx('যোগ করার সময় ', 'When added: ') + money(old.p) }, (d > 0 ? '▲ ' : '▼ ') + money(Math.abs(d))));
      }
      if (C.alert) {
        if (s <= 0) alerts.push(h('div', { class: 'r' }, '⛔ ' + p.name + ' — ' + tx('স্টকে নেই', 'out of stock'), h('button', { onclick: function () { var cc = cart(); delete cc[id]; setCart(cc); } }, tx('সরান', 'Remove'))));
        else if (c[id] > s) alerts.push(h('div', { class: 'r' }, '⚠ ' + p.name + ' — ' + tx('মাত্র ' + s + 'টি আছে (কার্টে ' + c[id] + ')', 'only ' + s + ' left (cart has ' + c[id] + ')'), h('button', { onclick: function () { var cc = cart(); cc[id] = s; setCart(cc); } }, tx(s + 'টিতে নামান', 'Set to ' + s))));
      }
      if (C.swap && tr) {
        var alt = D.products.filter(function (x) { return x.id !== id && x.generic && x.generic === p.generic && !!x.rx === !!p.rx && stock(D, x.id) >= c[id] && eff(x) < price && !c[x.id]; }).sort(function (x, y) { return eff(x) - eff(y); })[0];
        if (alt) tr.children[0].append(h('div', { style: 'font-size:.8rem;margin-top:.2rem' }, '💡 ' + tx('একই জেনেরিক, সস্তা: ', 'Same generic, cheaper: ') + alt.name + ' ' + money(eff(alt)) + ' ',
          h('button', { onclick: function () { var cc = cart(), q = cc[id]; delete cc[id]; cc[alt.id] = q; setCart(cc); toast(tx('বদলানো হয়েছে — সাশ্রয় ', 'Swapped — you save ') + money((price - eff(alt)) * q)); } }, tx('বদলান', 'Swap'))));
      }
      if (!old || old.p !== price) snap[id] = { p: price, t: now };
    });
    Object.keys(snap).forEach(function (k) { if (!c[k]) delete snap[k]; });
    try { localStorage.setItem(SNAP, JSON.stringify(snap)); } catch (e) { }
    var before = a.querySelector('h1'), anchor = before || tbl;
    var top = [];
    if (alerts.length) top.push(h('div', { class: 'c110 w', role: 'alert' }, h('h3', {}, tx('কার্ট ঠিক করুন', 'Fix your cart')), alerts));
    var m = C.max; if (m) top.push(h('div', { class: 'c110', role: 'note' }, '📦 ' + tx('প্রতি পণ্যে সর্বোচ্চ ' + m + 'টি', 'Max ' + m + ' per item')));
    if (top.length && anchor) anchor.after.apply(anchor, top);

    /* কুপন */
    if (C.coupons) {
      var sub = totals('dhaka').sub, box = h('div', { class: 'c110' }), any = false;
      if (applied) { any = true; box.append(h('div', { class: 'r' }, '🎟 ', h('span', { class: 'c110chip' }, applied.code + ' · ' + applied.pct + '%', h('button', { 'aria-label': tx('কুপন সরান', 'Remove coupon'), onclick: function () { applied = null; render(); } }, '✕')))); }
      var list = (D.coupons || []).filter(function (k) { return (!applied || k.code !== applied.code) && !(window.mcCouponProblem && mcCouponProblem(k)); });
      if (list.length) {
        any = true; box.append(h('h3', {}, tx('উপলভ্য কুপন', 'Available coupons')));
        list.forEach(function (k) {
          var ok = sub >= (k.min || 0);
          box.append(h('div', { class: 'r' }, h('b', {}, k.code), ' ' + k.pct + '% ' + tx('ছাড়', 'off') + (k.max ? ' (' + tx('সর্বোচ্চ ', 'max ') + money(k.max) + ')' : ''),
            ok ? h('button', { onclick: function () { applied = k; toast(tx('কুপন প্রয়োগ হয়েছে', 'Coupon applied')); render(); } }, tx('প্রয়োগ', 'Apply')) : h('small', { class: 'muted' }, tx(money(k.min - sub) + ' আরও কিনলে', 'add ' + money(k.min - sub) + ' more'))));
        });
      }
      if (any && tbl) tbl.after(box);
    }
    /* ডেলিভারি তুলনা + শেয়ার */
    var td = totals('dhaka'), to = totals('out'), foot = h('div', { class: 'c110' });
    foot.append(h('div', { class: 'r' }, '🚚 ' + tx('ডেলিভারি', 'Delivery') + ': ' + tx('ঢাকা ', 'Dhaka ') + (td.fee ? money(td.fee) : tx('ফ্রি', 'Free')) + ' · ' + tx('ঢাকার বাইরে ', 'Outside ') + (to.fee ? money(to.fee) : tx('ফ্রি', 'Free')) + ' → ' + tx('মোট ', 'total ') + money(td.total) + ' / ' + money(to.total)));
    if (C.share) {
      var text = function () { return '🛒 ' + ((D.settings && D.settings.store) || 'MediCare') + '\n' + ids.map(function (i) { var p = prod(i); return '• ' + p.name + ' × ' + c[i] + ' = ' + money(eff(p) * c[i]); }).join('\n') + '\n' + tx('মোট', 'Total') + ': ' + money(td.total); };
      foot.append(h('div', { class: 'r' },
        h('button', { class: 'btn2', onclick: function () { var t = text(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(tx('তালিকা কপি হয়েছে', 'List copied')); }, function () { prompt(tx('কপি করুন:', 'Copy:'), t); }); } }, '📋 ' + tx('কপি', 'Copy')),
        h('a', { class: 'btn2', target: '_blank', rel: 'noopener noreferrer', href: 'https://wa.me/?text=' + encodeURIComponent(text()) }, '💬 WhatsApp'),
        h('button', { class: 'btn2', onclick: function () { window.print(); } }, '🖨 ' + tx('প্রিন্ট', 'Print'))));
    }
    var last = a.querySelector('.btn[href="#/checkout"]'); (last ? last.parentNode : a).insertBefore(foot, last || null);
  }

  var _r = render;
  render = function (k) {
    D = db();
    if (route() === 'cart' && clamp()) { /* কার্ট ঠিক হয়েছে */ }
    _r(k);
    try { if (route() === 'cart') { D = db(); extras($('#app')); } } catch (e) { /* এক্সট্রা কখনো শপ ভাঙবে না */ }
  };
  window.addEventListener('storage', function (e) { if (e.key === 'mc_cart') try { render(); } catch (x) { } });
  try { render(); } catch (e) { }
})();
