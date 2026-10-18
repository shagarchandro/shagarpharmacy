/* POS Sales extras (v30): hold/resume bills, draft autosave, quick-cash buttons with live change,
   cart summary, keyboard shortcuts (F2 search, F4 hold, F9 pay). Browser-only demo. */
(function () {
  'use strict';
  const HK = 'pharmacy_held', DK = 'pharmacy_pos_draft';
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } };
  const $ = id => document.getElementById(id);
  const money = n => '৳' + (+n || 0).toFixed(2);
  const el = (t, a, ...c) => { const e = document.createElement(t); Object.entries(a || {}).forEach(([k, v]) => k.startsWith('on') ? e.addEventListener(k.slice(2), v) : e.setAttribute(k, v)); c.flat().forEach(x => e.append(x == null ? '' : x)); return e; };
  document.head.append(Object.assign(document.createElement('style'), { textContent:
    '.pxq{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.4rem}.pxq button,.pxh button{border:1px solid #cfd6de;background:#fff;border-radius:999px;padding:.2rem .7rem;font-size:.85rem;cursor:pointer}.pxh{margin:.6rem 0;padding:.6rem;border:1px dashed #9db4c8;border-radius:12px}.pxh .it{display:flex;justify-content:space-between;align-items:center;gap:.4rem;margin:.25rem 0;font-size:.9rem}.pxs{font-size:.8rem;color:#667;margin:.3rem 0}@media(max-width:768px){.pxq button{padding:.4rem .8rem}}' }));

  // ---- summary + draft autosave (wrap updateCart) ----
  const sum = el('div', { class: 'pxs', id: 'pxSum', 'aria-live': 'polite' });
  $('cartItems').after(sum);
  const _uc = window.updateCart;
  window.updateCart = function () {
    _uc.apply(this, arguments);
    const u = cart.reduce((a, i) => a + i.quantity, 0);
    sum.textContent = cart.length ? u + ' unit(s) · ' + cart.length + ' product(s)' : '';
    try { cart.length ? localStorage.setItem(DK, JSON.stringify({ cart, at: Date.now() })) : localStorage.removeItem(DK); } catch (e) { }
    liveChange(); drawHeld();
  };

  // ---- hold / resume ----
  const box = el('div', { class: 'pxh', id: 'pxHeld', hidden: '' });
  const actions = document.querySelector('.d-grid.gap-2.mt-3');
  const holdBtn = el('button', { class: 'btn btn-outline-primary py-2 rounded-3', id: 'pxHold', onclick: hold }, '⏸ Hold bill (F4)');
  if (actions) { actions.prepend(holdBtn); actions.before(box); }
  function hold() {
    if (!cart.length) return showToast('Cart is empty!', 'warning');
    const H = get(HK, '[]'); H.push({ id: Date.now(), cust: $('customerSelect').value, cart, rx: typeof rxInfo !== 'undefined' ? rxInfo : null, at: new Date().toISOString() });
    localStorage.setItem(HK, JSON.stringify(H.slice(-10)));
    if (typeof rxInfo !== 'undefined') rxInfo = null;
    cart = []; updateCart(); showToast('Bill put on hold', 'info');
  }
  function resume(id) {
    const H = get(HK, '[]'), b = H.find(x => x.id === id); if (!b) return;
    if (cart.length && !confirm('Replace the current cart with the held bill?')) return;
    const fresh = [];
    b.cart.forEach(i => { const p = products.find(x => x.id === i.id); if (p && p.stock > 0) { const q = Math.min(i.quantity, p.stock); fresh.push({ id: p.id, name: p.name, price: p.price, quantity: q, total: q * p.price }); } });
    if (b.rx && typeof rxInfo !== 'undefined') rxInfo = b.rx;
    cart = fresh; $('customerSelect').value = b.cust; localStorage.setItem(HK, JSON.stringify(H.filter(x => x.id !== id)));
    updateCart(); showToast(fresh.length < b.cart.length ? 'Resumed (some items no longer in stock)' : 'Bill resumed', 'info');
  }
  function drawHeld() {
    const H = get(HK, '[]'); box.hidden = !H.length; box.replaceChildren();
    if (!H.length) return;
    box.append(el('b', {}, 'On hold (' + H.length + ')'));
    H.forEach(b => box.append(el('div', { class: 'it' }, el('span', {}, new Date(b.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + b.cart.length + ' item(s) · ' + money(b.cart.reduce((a, i) => a + i.total, 0))),
      el('span', {}, el('button', { onclick() { resume(b.id); } }, 'Resume'), ' ', el('button', { 'aria-label': 'Discard held bill', onclick() { if (confirm('Discard this held bill?')) { localStorage.setItem(HK, JSON.stringify(get(HK, '[]').filter(x => x.id !== b.id))); drawHeld(); } } }, '✕')))));
  }

  // ---- quick cash + live change ----
  const cash = $('cashAmount'), q = el('div', { class: 'pxq', id: 'pxQuick' });
  if (cash) cash.after(q);
  function liveChange() {
    if (!cash) return;
    const t = calculateTotals().total, ch = $('changeAmount'), v = parseFloat(cash.value);
    q.replaceChildren();
    if (t > 0) {
      q.append(el('button', { onclick() { cash.value = t.toFixed(2); liveChange(); } }, 'Exact ' + money(t)));
      [50, 100, 500, 1000].filter(n => n >= t).slice(0, 2).concat(Math.ceil(t / 100) * 100 > t ? [Math.ceil(t / 100) * 100] : []).filter((n, i, a) => a.indexOf(n) === i).forEach(n => q.append(el('button', { onclick() { cash.value = n; liveChange(); } }, money(n).replace('.00', ''))));
    }
    if (ch && typeof selectedPaymentMethod !== 'undefined' && selectedPaymentMethod === 'cash' && !isNaN(v) && t > 0)
      ch.innerHTML = v >= t ? '<span class="text-success">💰 Change: ' + money(v - t) + '</span>' : '<span class="text-danger">Short by ' + money(t - v) + '</span>';
  }
  cash && cash.addEventListener('input', liveChange);
  document.addEventListener('click', e => { if (e.target.closest('.payment-method, #discountSlider')) setTimeout(liveChange, 0); });
  const ds = $('discountSlider'); ds && ds.addEventListener('input', liveChange);

  // ---- shortcuts ----
  document.addEventListener('keydown', e => {
    if (e.key === 'F2') { e.preventDefault(); const s = $('searchProduct'); s && s.focus(); }
    else if (e.key === 'F4') { e.preventDefault(); hold(); }
    else if (e.key === 'F9') { e.preventDefault(); processPayment(); }
  });

  // ---- restore draft after reload ----
  try {
    const d = get(DK, 'null');
    if (d && d.cart && d.cart.length && Date.now() - d.at < 864e5 && !cart.length) {
      d.cart.forEach(i => { const p = products.find(x => x.id === i.id); if (p && p.stock > 0) { const qn = Math.min(i.quantity, p.stock); cart.push({ id: p.id, name: p.name, price: p.price, quantity: qn, total: qn * p.price }); } });
      if (cart.length) showToast('Previous unsaved cart restored', 'info');
    }
  } catch (e) { }
  updateCart();
})();
