/* v75 — Ops Panel → Delivery: 🛵 রাইডার অ্যাসাইন + COD (ক্যাশ-অন-ডেলিভারি) হিসাব।
   • Owner: রাইডার যোগ/বাদ, অর্ডারে রাইডার বসানো (এক-এক করে বা সব "অ্যাসাইন-না-হওয়া" একসাথে), রাইডারের জমা-দেওয়া ক্যাশ গ্রহণ।
   • Delivery Staff: ডিফল্টে শুধু নিজের (নাম মিললে) অর্ডার; ডেলিভারি দিলে COD "আদায়" হিসেবে ধরা হয়।
   • রাইডার-তালিকা: pharmacy_riders; অর্ডারে rider / riderAt / codCollected / codSettledAt ফিল্ড। */
(function () {
  'use strict';
  if (typeof V === 'undefined' || !V.delivery || typeof h !== 'function') return;
  var prev = V.delivery, KEY = 'pharmacy_riders', filter = null;
  var owner = R === 'Owner', myName = (sessionStorage.getItem('mc_ops_name') || '').trim();
  function riders() { try { var a = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function setRiders(a) { localStorage.setItem(KEY, JSON.stringify(a.slice(0, 30))); }
  var isCod = function (o) { return !o.paid && /cash|on delivery|cod/i.test(o.pay || o.payMethod || 'cash on delivery'); };
  var today = function () { return new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10); };
  var dayOf = function (t) { return t ? new Date(new Date(t).getTime() + 6 * 3600e3).toISOString().slice(0, 10) : ''; };
  function css() {
    if (document.getElementById('odCss')) return; var s = document.createElement('style'); s.id = 'odCss';
    s.textContent = '.od-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.6rem;margin:.6rem 0}.od-card{border:1px solid var(--br,#e5e7eb);border-radius:12px;padding:.7rem;background:var(--card,#fff)}.od-card b{font-size:1.05rem}.od-card .big{font-size:1.25rem;font-weight:800}.od-chips{display:flex;gap:6px;flex-wrap:wrap;margin:.5rem 0}.od-chips button{border-radius:99px}.od-chips button.on{background:var(--pri,#0f766e);color:#fff}.od-warn{color:#b45309}';
    document.head.appendChild(s);
  }
  V.delivery = function () {
    css(); D = db();
    var r0 = prev(), printRow = r0.firstChild && r0.firstChild.classList && r0.firstChild.classList.contains('row') ? r0.firstChild : null;
    var RS = riders(), mine = myName && RS.indexOf(myName) > -1;
    if (filter == null) filter = (!owner && mine) ? myName : 'all';
    var list = D.orders.filter(function (o) { return o.status === 'Packed' || o.status === 'Shipped' || (o.status === 'Delivered' && o.codCollected && !o.codSettledAt); });
    var shown = list.filter(function (o) { return filter === 'all' ? true : filter === '__none' ? !o.rider : o.rider === filter; });
    // রাইডার-ভিত্তিক সারাংশ
    var sum = RS.map(function (n) {
      var os = D.orders.filter(function (o) { return o.rider === n; });
      var open = os.filter(function (o) { return o.status === 'Packed' || o.status === 'Shipped'; }), toCollect = open.filter(isCod).reduce(function (a, o) { return a + o.total; }, 0);
      var held = os.filter(function (o) { return o.codCollected && !o.codSettledAt; }), heldAmt = held.reduce(function (a, o) { return a + o.total; }, 0);
      var dToday = os.filter(function (o) { return o.status === 'Delivered' && dayOf(o.deliveredAt) === today(); }).length;
      return h('div', { class: 'od-card' }, h('b', {}, '🛵 ' + n), h('div', { class: 'muted' }, open.length + ' পথে/প্যাকড · আজ ডেলিভারি ' + dToday), h('div', {}, 'আদায় বাকি (COD): ', h('b', {}, money(toCollect))),
        h('div', { class: heldAmt ? 'od-warn' : '' }, 'রাইডারের কাছে জমা-না-দেওয়া ক্যাশ: ', h('b', {}, money(heldAmt))),
        owner && heldAmt ? act('💰 ' + money(heldAmt) + ' জমা নিলাম', function () { held.forEach(function (o) { o.codSettledAt = new Date().toISOString(); o.codSettledBy = myName || 'Owner'; }); save(D); toast(n + ' এর ' + money(heldAmt) + ' জমা নেওয়া হয়েছে'); go(); }) : '');
    });
    var unassigned = list.filter(function (o) { return !o.rider && (o.status === 'Packed' || o.status === 'Shipped'); });
    var chips = h('div', { class: 'od-chips' }, [['all', 'সব (' + list.length + ')'], ['__none', 'অ্যাসাইন হয়নি (' + unassigned.length + ')']].concat(RS.map(function (n) { return [n, '🛵 ' + n]; })).map(function (p) { return h('button', { class: filter === p[0] ? 'on' : '', onclick: function () { filter = p[0]; go(); } }, p[1]); }));
    var bulk = owner && RS.length && unassigned.length ? h('div', { class: 'row' }, h('select', { id: 'odBulk', 'aria-label': 'রাইডার' }, RS.map(function (n) { return h('option', { value: n }, n); })), act('সব অ্যাসাইন-না-হওয়া (' + unassigned.length + ') এই রাইডারকে দিন', function () { var n = document.getElementById('odBulk').value; unassigned.forEach(function (o) { o.rider = n; o.riderAt = new Date().toISOString(); }); save(D); toast(unassigned.length + ' অর্ডার ' + n + '-কে দেওয়া হয়েছে'); go(); })) : '';
    var manage = owner ? h('details', {}, h('summary', {}, '⚙ রাইডার তালিকা (' + RS.length + ')'), h('div', { class: 'row' }, h('input', { id: 'odNew', placeholder: 'রাইডারের নাম', maxlength: 40 }), act('+ যোগ', function () { var v = document.getElementById('odNew').value.trim(); if (v.length < 2) return toast('নাম দিন', 1); if (RS.indexOf(v) > -1) return toast('আগেই আছে', 1); RS.push(v); setRiders(RS); go(); })), h('div', { class: 'row' }, RS.map(function (n) { return act('✖ ' + n, function () { if (D.orders.some(function (o) { return o.rider === n && (o.status === 'Packed' || o.status === 'Shipped' || (o.codCollected && !o.codSettledAt)); })) return toast('এই রাইডারের চলমান অর্ডার/অজমা ক্যাশ আছে', 1); setRiders(RS.filter(function (x) { return x !== n; })); if (filter === n) filter = 'all'; go(); }); }))) : '';
    var rows = shown.map(function (o) {
      var sel = owner ? h('select', { 'aria-label': 'Rider', onchange: function (e) { o.rider = e.target.value; o.riderAt = o.rider ? new Date().toISOString() : ''; save(D); toast(o.no + ' → ' + (o.rider || 'কেউ না')); go(); } }, h('option', { value: '' }, '— অ্যাসাইন —'), RS.map(function (n) { return h('option', { value: n, selected: o.rider === n }, n); })) : (o.rider || '—');
      var canAct = owner || !o.rider || o.rider === myName, st = o.status;
      var btn = st === 'Packed' ? act('Mark shipped', function () { o.status = 'Shipped'; o.shippedAt = new Date().toISOString(); save(D); go(); }) : st === 'Shipped' ? act(isCod(o) ? 'Delivered + ' + money(o.total) + ' আদায়' : 'Mark delivered', function () { o.status = 'Delivered'; o.deliveredAt = new Date().toISOString(); if (isCod(o)) { o.codCollected = true; o.paid = true; } save(D); toast(o.no + ' ডেলিভারি হয়েছে'); go(); }) : h('span', { class: 'od-warn' }, 'ক্যাশ জমা বাকি');
      return h('tr', {}, h('td', {}, o.no), h('td', {}, o.customer), h('td', {}, o.addr), h('td', {}, h('a', { href: 'tel:' + o.phone }, o.phone)), h('td', {}, isCod(o) || o.codCollected ? h('b', {}, money(o.total)) : 'Paid'), h('td', {}, st), h('td', {}, sel), h('td', {}, canAct ? btn : ''));
    });
    return h('div', {}, printRow || '', owner || mine ? h('div', { class: 'od-sum' }, sum.length ? sum : h('p', { class: 'muted' }, 'রাইডার যোগ করুন — "⚙ রাইডার তালিকা"।')) : '', manage, chips, bulk, tbl(['Order', 'Customer', 'Address', 'Phone', 'আদায়', 'Status', 'Rider', ''], rows));
  };
})();
