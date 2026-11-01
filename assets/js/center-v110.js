/* v110 — Control Center: 🛒 Cart Rules (কাস্টমার কার্টের নিয়ম) */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  window.CCX = function (c) {
    var x = prev(c), h = c.h;
    x.panels.cartrules = function () {
      var D = c.db(), S = (D.settings = D.settings || {}), R = Object.assign({ max: 0, alert: true, swap: true, coupons: true, undo: true, share: true }, S.cartRules || {});
      var f = h('form', { class: 'cc-form', onsubmit: function (e) {
        e.preventDefault(); var t = e.target.elements, m = Math.floor(+t.max.value || 0);
        if (m < 0 || m > 999) return c.bad('সর্বোচ্চ সংখ্যা ০–৯৯৯ হতে হবে (০ = সীমাহীন)');
        S.cartRules = { max: m, alert: t.alert.checked, swap: t.swap.checked, coupons: t.coupons.checked, undo: t.undo.checked, share: t.share.checked };
        c.save(D); c.audit('Cart rules updated (max/item ' + (m || 'none') + ')'); c.ok('কার্টের নিয়ম সেভ হয়েছে — শপ পেজ রিলোড করলে কার্যকর');
      } },
        c.field('প্রতি পণ্যে সর্বোচ্চ কত পিস এক অর্ডারে (০ = সীমাহীন)', c.inp('max', R.max, 'number', { min: 0, max: 999 }), 'বেশি থাকলে কার্টে নিজে থেকে কমে যায়, চেকআউটও আটকায়।'),
        c.chk('alert', R.alert, '⚠ দাম বদল / স্টক কমে যাওয়ার সতর্কতা'),
        c.chk('swap', R.swap, '💡 একই জেনেরিকের সস্তা বিকল্প দেখানো (Rx/OTC মিলিয়ে)'),
        c.chk('coupons', R.coupons, '🎟 কার্টে কুপন চিপ ও উপলভ্য কুপনের তালিকা'),
        c.chk('undo', R.undo, '↩ পণ্য সরালে/কার্ট খালি করলে Undo'),
        c.chk('share', R.share, '📋 কপি / WhatsApp / প্রিন্ট বাটন'),
        h('button', { class: 'btn' }, 'সেভ করুন'));
      return h('div', {}, h('h2', {}, '🛒 Cart Rules'), h('p', { class: 'muted' }, 'গ্রাহকের শপিং কার্টে কোন সুবিধা/সীমা থাকবে এখান থেকে ঠিক করুন। ডেমো মোডে নিয়ম গ্রাহকের ব্রাউজারেই প্রয়োগ হয়।'), f);
    };
    x.tabs.push(['cartrules', '🛒 Cart Rules']);
    return x;
  };
})();
