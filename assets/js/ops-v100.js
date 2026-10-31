/* v100 — Ops Panel: 💳 পেমেন্ট যাচাই + ফেরত (ops-v99.js এর পরে)
   • Orders-এর মাথায় "💳 পেমেন্ট" প্যানেল: wallet পেমেন্ট যাচাই (✅ Paid / ❌ Failed + কারণ — গ্রাহক নিজের অর্ডার পেজে দেখেন ও TrxID সংশোধন করতে পারেন),
     একই TrxID একাধিকবার (অন্য অর্ডার/POS বিক্রিতে) হলে ⚠ ডুপ্লিকেট চিহ্ন, প্রেরকের নম্বর, অপেক্ষার সময়
   • বাতিল হওয়া কিন্তু পরিশোধিত অর্ডারের "💸 ফেরত দিতে হবে" তালিকা → "পাঠানো হয়েছে" (রেফারেন্স সহ)
   • অর্ডারের সারিতে: প্রাপক, কল-আগে/দরজার সামনে, COD-তে কত টাকার নোট (খুচরা কত) */
(function () {
  'use strict';
  if (typeof V === 'undefined' || typeof h !== 'function' || typeof D === 'undefined' || !V.orders) return;
  var canPay = function () { return typeof R !== 'undefined' && ['Owner', 'Pharmacist', 'Cashier'].indexOf(R) > -1; };
  var isW = function (v) { return /^(bKash|Nagad|Rocket|Upay)/i.test(v || ''); };
  var tk = function (n) { return typeof money === 'function' ? money(n) : '৳' + n; };
  var age = function (o) { var m = Math.max(0, Math.round((Date.now() - new Date(o.at)) / 6e4)); return m < 60 ? m + ' মি' : m < 1440 ? Math.floor(m / 60) + ' ঘ' : Math.floor(m / 1440) + ' দিন'; };
  function sales() { try { return JSON.parse(localStorage.getItem('pharmacy_sales') || '[]'); } catch (e) { return []; } }
  function ask(msg, min) {
    var p = window.MCD && MCD.prompt ? MCD.prompt(msg) : Promise.resolve(window.prompt(msg));
    return p.then(function (v) { v = v == null ? null : String(v).trim(); return v != null && v.length >= (min || 0) ? v : null; });
  }
  function log(m) { try { audit(m); } catch (e) { } }
  function done() { try { go(); } catch (e) { location.reload(); } }

  var base = V.orders;
  V.orders = function () {
    var r = base.apply(this, arguments);
    try {
      var all = D.orders.slice().reverse(), rows = [].slice.call(r.querySelectorAll('tbody tr'));
      /* সারিতে অতিরিক্ত তথ্য */
      if (all.length && rows.length === all.length) rows.forEach(function (tr, i) {
        var o = all[i], c1 = tr.children[1]; if (!o || !c1) return;
        var bits = [];
        if (o.recipient) bits.push('🎁 প্রাপক: ' + o.recipient.name + ' · ' + o.recipient.phone);
        if (o.callFirst) bits.push('📞 আগে কল করুন'); if (o.contactless) bits.push('🚪 দরজার সামনে রাখুন');
        if (o.cashGiven != null && o.cashGiven > 0) bits.push('💵 নোট ' + tk(o.cashGiven) + (o.cashGiven > o.total ? ' → খুচরা ' + tk(o.cashGiven - o.total) : ''));
        if (o.payFrom) bits.push('📲 পেমেন্ট: ' + o.payFrom);
        if (o.payStatus === 'Failed') bits.push('❌ পেমেন্ট ব্যর্থ' + (o.payNote ? ': ' + o.payNote : ''));
        bits.forEach(function (b) { c1.append(h('div', { class: 'muted', style: 'font-size:.78rem' }, b)); });
      });
      /* TrxID গণনা */
      var cnt = {}; D.orders.filter(function (o) { return o.status !== 'Cancelled' && o.payRef; }).forEach(function (o) { var k = String(o.payRef).toUpperCase(); cnt[k] = (cnt[k] || 0) + 1; });
      sales().forEach(function (s) { if (s && s.status !== 'Voided' && s.payRef) { var k = String(s.payRef).toUpperCase(); cnt[k] = (cnt[k] || 0) + 1; } });
      var live = D.orders.filter(function (o) { return o.status !== 'Cancelled'; });
      var wal = live.filter(function (o) { return isW(o.pay || o.payMethod); }), pend = wal.filter(function (o) { return !o.paid; });
      var refunds = D.orders.filter(function (o) { return o.status === 'Cancelled' && o.paid && !o.refundSent; });
      var dup = pend.filter(function (o) { return o.payRef && cnt[String(o.payRef).toUpperCase()] > 1; }).length;
      var sum = function (L) { return L.reduce(function (a, o) { return a + (+o.total || 0); }, 0); };
      var tile = function (b, l, bad) { return h('div', { style: 'border:1px solid #d6dbe6;border-radius:10px;padding:.4rem .7rem;min-width:130px' + (bad ? ';border-color:#dc2626' : '') }, h('b', {}, b), h('br'), h('span', { class: 'muted', style: 'font-size:.8rem' }, l)); };
      var p = h('details', { class: 'v100p', style: 'border:1px solid #cfd6de;border-radius:12px;padding:.5rem .8rem;margin:.6rem 0' + ((pend.length || refunds.length) ? '' : ''), open: !!(pend.length || refunds.length) },
        h('summary', { style: 'cursor:pointer;font-weight:700' }, '💳 পেমেন্ট' + (pend.length ? ' · যাচাই বাকি ' + pend.length : '') + (refunds.length ? ' · ফেরত বাকি ' + refunds.length : '') + (dup ? ' · ⚠ ডুপ্লিকেট ' + dup : '')),
        h('div', { style: 'display:flex;gap:.5rem;flex-wrap:wrap;margin:.5rem 0' }, tile(tk(sum(wal.filter(function (o) { return o.paid; }))), 'Wallet — পরিশোধিত'), tile(tk(sum(pend)), 'Wallet — যাচাই বাকি', pend.length > 0), tile(tk(sum(refunds)), 'ফেরত দিতে হবে', refunds.length > 0),
          tile(String(live.filter(function (o) { return !o.paid && !isW(o.pay || o.payMethod) && o.status !== 'Delivered'; }).length), 'COD — ডেলিভারিতে আদায়')));
      if (pend.length) {
        p.append(h('h4', { style: 'margin:.4rem 0' }, 'যাচাই করতে হবে'), h('div', { style: 'overflow:auto' }, h('table', {}, h('thead', {}, h('tr', {}, ['অর্ডার', 'গ্রাহক', 'মেথড', 'TrxID', 'প্রেরক', 'টাকা', 'সময়', ''].map(function (x) { return h('th', {}, x); }))),
          h('tbody', {}, pend.slice().reverse().map(function (o) {
            var d = o.payRef && cnt[String(o.payRef).toUpperCase()] > 1;
            return h('tr', {}, h('td', {}, o.no), h('td', {}, o.customer || ''), h('td', {}, String(o.pay || o.payMethod || '').replace(/ \(demo.*\)/, '')),
              h('td', {}, o.payRef || '—', d ? h('span', { class: 'bad', title: 'একই TrxID একাধিক অর্ডার/বিক্রিতে', style: 'margin-left:4px' }, '⚠ ডুপ্লিকেট') : ''), h('td', {}, o.payFrom || '—'), h('td', {}, tk(o.total)), h('td', {}, age(o) + (o.payStatus === 'Failed' ? ' · ❌' : '')),
              h('td', {}, canPay() ? [h('button', { type: 'button', class: 'btn2', onclick: function () { o.paid = true; o.payStatus = 'Paid'; o.paidAt = new Date().toISOString(); o.paidBy = typeof R !== 'undefined' ? R : ''; delete o.payNote; log('Payment verified ' + o.no + ' (' + (o.payRef || '') + ')'); save(D); toast('✅ ' + o.no + ' — Paid'); done(); } }, '✅ Paid'), ' ',
                h('button', { type: 'button', class: 'btn2', onclick: function () { ask(o.no + ' — কেন যাচাই হলো না? (গ্রাহক দেখবেন, যেমন: TrxID মেলেনি)', 3).then(function (why) { if (!why) return toast('কারণ লিখুন (কমপক্ষে ৩ অক্ষর)', 1); o.paid = false; o.payStatus = 'Failed'; o.payNote = why.slice(0, 100); log('Payment failed ' + o.no + ': ' + why.slice(0, 60)); save(D); toast('❌ ' + o.no + ' — গ্রাহককে জানানো হবে'); done(); }); } }, '❌ Failed')] : ''));
          })))));
      }
      if (refunds.length) {
        p.append(h('h4', { style: 'margin:.6rem 0 .3rem' }, '💸 ফেরত দিতে হবে (বাতিল, কিন্তু পরিশোধিত)'), h('div', { style: 'overflow:auto' }, h('table', {}, h('thead', {}, h('tr', {}, ['অর্ডার', 'গ্রাহক', 'মেথড', 'প্রেরকের নম্বর (ফেরত যাবে)', 'টাকা', ''].map(function (x) { return h('th', {}, x); }))),
          h('tbody', {}, refunds.map(function (o) {
            return h('tr', {}, h('td', {}, o.no), h('td', {}, o.customer || ''), h('td', {}, String(o.pay || '').replace(/ \(demo.*\)/, '')), h('td', {}, o.payFrom || o.phone || '—'), h('td', {}, tk(o.total)),
              h('td', {}, canPay() ? h('button', { type: 'button', class: 'btn2', onclick: function () { ask(o.no + ' — ফেরতের রেফারেন্স/TrxID (ঐচ্ছিক, না থাকলে ফাঁকা রেখে OK)', 0).then(function (ref) { if (ref === null) return; o.refundSent = true; o.refundAt = new Date().toISOString(); if (ref) o.refundRef = ref.slice(0, 30); log('Refund sent ' + o.no + ' ' + tk(o.total)); save(D); toast('💸 ফেরত রেকর্ড হয়েছে'); done(); }); } }, '💸 পাঠানো হয়েছে') : ''));
          })))));
      }
      if (!pend.length && !refunds.length) p.append(h('p', { class: 'muted' }, '✔ যাচাই বা ফেরতের কিছু বাকি নেই।'));
      r.prepend(p);
    } catch (e) { if (window.console) console.warn('ops-v100', e); }
    return r;
  };
})();
