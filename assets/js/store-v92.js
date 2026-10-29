/* v92 — Online Shop:
   • Catalog: দ্রুত ফিল্টার-চিপ (স্টকে আছে / OTC / Rx / অফার)
   • Product: স্টক কম হলে "মাত্র N টি", সাশ্রয়ী/বিকল্প ওষুধ (একই জেনেরিক → না থাকলে একই ক্যাটাগরি) — স্টক শেষ হলেও বিকল্প দেখায়
   • Cart: আনুমানিক ডেলিভারি-সময় (ফ্রি-ডেলিভারি বার store-more.js-এ আগে থেকেই আছে — Control Center → Rules → freeMin)
   বিকল্প-পরামর্শ ডাক্তারের পরামর্শের বিকল্প নয় — একই জেনেরিক/ক্যাটাগরি ধরে সাজানো। */
(function () {
  'use strict';
  if (typeof views === 'undefined' || typeof h !== 'function' || typeof db !== 'function') return;
  var isBn = function () { try { return typeof lang === 'function' && lang() === 'bn'; } catch (e) { return false; } };
  var tx = function (b, e) { return isBn() ? b : e; };
  var st = document.createElement('style');
  st.textContent = '.s92c{display:flex;flex-wrap:wrap;gap:.4rem;margin:.5rem 0}.s92c button{border-radius:99px;padding:.25rem .8rem}.s92c button.on{background:var(--pri,#0b7a6b);color:#fff}.s92b{border-radius:99px;height:10px;background:rgba(11,122,107,.15);overflow:hidden;margin:.3rem 0}.s92b i{display:block;height:100%;background:var(--pri,#0b7a6b);transition:width .3s}.s92n{border:1px dashed var(--br,#cfe3dd);border-radius:12px;padding:.6rem .8rem;margin:.6rem 0}';
  document.head.appendChild(st);

  /* Catalog ফিল্টার */
  var F = { stock: false, type: '', deal: false };
  if (views.catalog) {
    var C0 = views.catalog;
    views.catalog = function () {
      var D0 = D, active = F.stock || F.type || F.deal, node;
      if (active) D = Object.assign({}, D0, { products: D0.products.filter(function (p) { return (!F.stock || stock(D0, p.id) > 0) && (!F.type || (F.type === 'rx' ? p.rx : !p.rx)) && (!F.deal || p.disc > 0); }) });
      try { node = C0.apply(this, arguments); } finally { D = D0; }
      var row = node.querySelector('.row[aria-label="Categories"]') || node.querySelector('.row');
      var chip = function (label, on, fn) { return h('button', { class: on ? 'on' : '', 'aria-pressed': String(!!on), onclick: function () { fn(); S.page = 1; render(); } }, label); };
      var bar = h('div', { class: 's92c', role: 'group', 'aria-label': 'Quick filters' },
        chip(tx('✅ স্টকে আছে', '✅ In stock'), F.stock, function () { F.stock = !F.stock; }), chip('OTC', F.type === 'otc', function () { F.type = F.type === 'otc' ? '' : 'otc'; }), chip('Rx', F.type === 'rx', function () { F.type = F.type === 'rx' ? '' : 'rx'; }), chip(tx('🏷 অফার', '🏷 Deals'), F.deal, function () { F.deal = !F.deal; }));
      if (row) row.after(bar); else node.insertBefore(bar, node.children[2] || null);
      return node;
    };
  }

  /* Product: বিকল্প */
  if (views.product) {
    var P0 = views.product;
    views.product = function () {
      var node = P0.apply(this, arguments), id = location.hash.split('/')[2], p = D.products.find(function (x) { return x.id === id; }); if (!p) return node;
      var s = stock(D, p.id), inS = function (x) { return x.id !== p.id && stock(D, x.id) > 0 && (!x.rx || p.rx); };
      var same = D.products.filter(function (x) { return inS(x) && p.generic && x.generic === p.generic; }).sort(function (a, b) { return eff(a) - eff(b); });
      var alt = same.length ? same : D.products.filter(function (x) { return inS(x) && x.cat === p.cat; }).slice(0, 4), isSame = !!same.length;
      if (s > 0 && s <= 5) node.append(h('p', { class: 'warn' }, tx('⚠ মাত্র ' + s + 'টি বাকি', '⚠ Only ' + s + ' left')));
      if (alt.length && (s <= 0 || isSame)) {
        var cheaper = isSame && alt.some(function (x) { return eff(x) < eff(p); });
        node.append(h('div', { class: 's92n' }, h('h3', { style: 'margin-top:0' }, s <= 0 ? tx('এটি এখন স্টকে নেই — বিকল্প', 'Out of stock — alternatives') : cheaper ? tx('💡 একই জেনেরিক, কম দামে', '💡 Same generic, lower price') : tx('একই জেনেরিকের অন্য ব্র্যান্ড', 'Other brands, same generic')),
          h('p', { class: 'muted' }, isSame ? tx('একই জেনেরিক (' + p.generic + ')। কোনটা নেবেন তা নিশ্চিত না হলে ফার্মাসিস্টকে জিজ্ঞেস করুন।', 'Same generic (' + p.generic + '). Ask the pharmacist if unsure.') : tx('একই ক্যাটাগরির ওষুধ — জেনেরিক আলাদা হতে পারে, ফার্মাসিস্টকে জিজ্ঞেস করুন।', 'Same category, generic may differ — ask the pharmacist.')),
          h('div', { class: 'grid' }, alt.slice(0, 4).map(card))));
      }
      return node;
    };
  }

  /* Cart: ফ্রি ডেলিভারি বার + ETA */
  if (views.cart) {
    var K0 = views.cart;
    views.cart = function () {
      var node = K0.apply(this, arguments); if (!node || !node.querySelector || !node.querySelector('table')) return node;
      var tb = node.querySelector('table'), box = h('div', { class: 's92n' });
      var hr = +new Date(Date.now() + 216e5).toISOString().slice(11, 13), rx = Object.keys(cart()).some(function (i) { var p = D.products.find(function (x) { return x.id === i; }); return p && p.rx; });
      box.append(h('small', { class: 'muted' }, '🕒 ' + tx(hr < 20 ? 'সাধারণত আজ বা পরের কর্মদিবসে পৌঁছায়' : 'রাত ৮টার পর অর্ডার — সাধারণত আগামীকাল প্রক্রিয়া শুরু', hr < 20 ? 'Usually delivered today or next working day' : 'Ordered after 8 PM — usually processed tomorrow') + (rx ? tx(' (Rx হলে ফার্মাসিস্ট রিভিউয়ের পর)', ' (after pharmacist review for Rx)') : '')));
      tb.before(box); return node;
    };
  }
  try { render(); } catch (e) { }
})();
