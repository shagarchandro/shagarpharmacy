/* v99 — Ops Panel: অর্ডারে 📷 প্রেসক্রিপশনের ছবি (গ্রাহক শপ থেকে দিলে) — ফার্মাসিস্ট বড় করে দেখতে পারেন। ops-v93.js এর পরে লোড হয়। */
(function () {
  'use strict';
  if (typeof V === 'undefined' || typeof h !== 'function' || typeof D === 'undefined' || !V.orders) return;
  function imgs() { try { return JSON.parse(localStorage.getItem('mc_rximg') || '{}') || {}; } catch (e) { return {}; } }
  function show(no, src) {
    var ov = h('div', { role: 'dialog', 'aria-label': 'Prescription photo', style: 'position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,.75);display:flex;align-items:center;justify-content:center;padding:14px', onclick: function (e) { if (e.target === ov) ov.remove(); } },
      h('div', { style: 'background:#fff;color:#16213a;border-radius:14px;padding:1rem;max-width:min(96vw,900px);max-height:92vh;overflow:auto;text-align:center' }, h('h3', { style: 'margin:0 0 .5rem' }, '📷 ' + no + ' — প্রেসক্রিপশনের ছবি'),
        h('img', { src: src, alt: 'Prescription ' + no, style: 'max-width:100%;max-height:70vh;border-radius:8px' }),
        h('p', { style: 'font-size:.8rem;color:#667' }, 'গ্রাহকের দেওয়া ছবি — ডাক্তারের নাম/রেজিস্ট্রেশন, তারিখ ও ওষুধের তালিকা মিলিয়ে অনুমোদন করুন।'),
        h('button', { class: 'btn2', type: 'button', onclick: function () { ov.remove(); } }, 'বন্ধ')));
    document.body.appendChild(ov);
    var esc = function (e) { if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', esc); } }; document.addEventListener('keydown', esc);
  }
  var base = V.orders;
  V.orders = function () {
    var r = base.apply(this, arguments), M = imgs();
    try {
      var L = D.orders.slice().reverse(), rows = [].slice.call(r.querySelectorAll('tbody tr'));
      if (L.length && rows.length === L.length) rows.forEach(function (tr, i) {
        var o = L[i], c1 = tr.children[1]; if (!c1 || !o) return;
        if (M[o.no]) c1.append(h('div', {}, h('button', { type: 'button', class: 'btn2', style: 'font-size:.8rem;margin-top:3px', onclick: function () { show(o.no, M[o.no]); } }, '📷 Rx ছবি')));
        else if (o.rx) c1.append(h('div', { class: 'muted', style: 'font-size:.78rem' }, '📷 ছবি নেই'));
      });
    } catch (e) { if (window.console) console.warn('ops-v99', e); }
    return r;
  };
})();
