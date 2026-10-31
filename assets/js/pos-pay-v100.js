/* v100 — POS পেমেন্ট: একই TrxID/রেফারেন্স আবার ব্যবহার ঠেকানো (অন্য POS বিক্রি বা অনলাইন অর্ডারে থাকলে)। pos-v97.js এর পরে লোড হয়।
   (কার্ড স্লিপ/অনুমোদন নম্বরও একই নিয়মে মেলানো হয়; বাতিল/Void হওয়া বিক্রি ও বাতিল অর্ডার গণনায় ধরা হয় না।) */
(function () {
  'use strict';
  if (typeof processPayment !== 'function') return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var base = processPayment;
  window.processPayment = function () {
    try {
      var el = document.getElementById('pxRef'), m = typeof selectedPaymentMethod !== 'undefined' ? selectedPaymentMethod : '';
      var ref = el && el.offsetParent !== null ? (el.value || '').trim().toUpperCase() : '';
      if (ref && /^[A-Z0-9-]{6,20}$/.test(ref) && (m === 'mobile' || m === 'card' || m === 'split') && cart.length) {
        var used = rj('pharmacy_sales', []).some(function (s) { return s && s.status !== 'Voided' && String(s.payRef || '').toUpperCase() === ref; }) ||
          ((rj('mc_db', {}).orders) || []).some(function (o) { return o && o.status !== 'Cancelled' && String(o.payRef || '').toUpperCase() === ref; });
        if (used) { if (window.showToast) showToast('⚠ এই TrxID/রেফারেন্স (' + ref + ') আগেই ব্যবহার হয়েছে — সঠিকটি দিন', 'danger'); el.focus(); return; }
      }
    } catch (e) { }
    return base.apply(this, arguments);
  };
})();
