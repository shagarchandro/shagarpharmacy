/* Coupon rules set in Control Center → 🎟 Coupons: active switch, expiry date, usage limit, max discount.
   Enforced on Apply (capture-phase), on the totals, and recorded on the order (order.coupon). */
(function () {
  'use strict';
  const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  const used = c => ((D.orders || []).filter(o => o.coupon === c.code && o.status !== 'Cancelled')).length;
  window.mcCouponProblem = c => {
    if (!c) return 'Invalid coupon';
    if (c.off) return 'This coupon is not active';
    if (c.expires && c.expires < today()) return 'This coupon expired on ' + c.expires;
    if (c.limit > 0 && used(c) >= c.limit) return 'This coupon has been fully used';
    return '';
  };
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('button'); const inp = b && b.parentElement && b.parentElement.querySelector('#cp');
    if (!inp) return;
    D = db(); const code = inp.value.trim().toUpperCase(), c = (D.coupons || []).find(k => k.code === code);
    const pr = c && mcCouponProblem(c);
    if (pr) { e.stopImmediatePropagation(); e.preventDefault(); toast(pr, 1); }
  }, true);
  const _t = totals;
  totals = function (area) {
    const r = _t(area);
    if (applied && applied.max > 0 && r.disc > applied.max) { r.total += r.disc - applied.max; r.disc = applied.max; }
    if (applied && mcCouponProblem((D.coupons || []).find(k => k.code === applied.code))) { r.total += r.disc; r.disc = 0; }
    return r;
  };
  const _p = place;
  place = function (f, rx) {
    const n = (db().orders || []).length, code = applied && applied.code, ok = !applied || !mcCouponProblem((db().coupons || []).find(k => k.code === applied.code));
    if (!ok) { toast('Coupon is no longer valid — removed', 1); applied = null; render(); return; }
    const r = _p(f, rx);
    try { const d = db(); if (code && d.orders.length > n) { d.orders[d.orders.length - 1].coupon = code; save(d); } } catch (e) { }
    return r;
  };
})();
