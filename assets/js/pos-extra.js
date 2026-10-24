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


  // ---- v31: payment details (mobile wallet / card slip reference) ----
  const pe = el('div', { id: 'pxPay', class: 'pxh', hidden: '' },
    el('label', { for: 'pxProv', class: 'form-label small fw-semibold', id: 'pxProvL' }, 'Wallet'),
    el('select', { id: 'pxProv', class: 'form-select rounded-3 mb-2' }, ['bKash', 'Nagad', 'Rocket', 'Upay'].map(x => el('option', {}, x))),
    el('label', { for: 'pxRef', class: 'form-label small fw-semibold', id: 'pxRefL' }, 'Transaction ID'),
    el('input', { id: 'pxRef', class: 'form-control rounded-3', maxlength: '20', autocomplete: 'off', placeholder: 'e.g. 9A7B3C2D1E' }),
    el('div', { id: 'pxSplitBox', style: 'display:none;margin-top:.5rem' }, el('label', { for: 'pxCashPart', class: 'form-label small fw-semibold' }, 'Cash part (৳) — the rest is paid by wallet'), el('input', { id: 'pxCashPart', type: 'number', min: '0', step: '0.01', class: 'form-control rounded-3' }), el('small', { class: 'text-muted', id: 'pxRest' })),
    el('small', { class: 'text-muted', id: 'pxPayHint' }, 'Demo only — no real payment is processed. Never enter card numbers or PINs.'));
  const cd = $('cashAmountDiv'); if (cd) cd.after(pe);
  function payUI() {
    const m = typeof selectedPaymentMethod !== 'undefined' ? selectedPaymentMethod : 'cash';
    pe.hidden = m === 'cash' || m === 'due';
    const w = m === 'mobile' || m === 'split';
    $('pxProv').style.display = w ? '' : 'none'; $('pxProvL').style.display = w ? '' : 'none';
    $('pxRefL').textContent = w ? 'Transaction ID (TrxID)' : 'Card slip / approval no.';
    $('pxSplitBox').style.display = m === 'split' ? '' : 'none'; restUI();
  }
  function restUI() { const t = calculateTotals().total, v = parseFloat($('pxCashPart').value) || 0; $('pxRest').textContent = t ? 'Wallet part: ' + money(Math.max(0, t - v)) + ' of ' + money(t) : ''; }
  $('pxCashPart').addEventListener('input', restUI);
  (function () { const mob = document.querySelector('.payment-method[data-method="mobile"]'); if (!mob) return; const col = mob.parentElement.cloneNode(true), tile = col.querySelector('.payment-method');
    tile.dataset.method = 'split'; tile.querySelector('i').className = 'fas fa-columns fa-2x mb-1 text-primary'; tile.querySelector('.small').textContent = 'Split'; mob.parentElement.after(col);
    tile.addEventListener('click', () => { document.querySelectorAll('.payment-method').forEach(x => x.classList.remove('active')); tile.classList.add('active'); selectedPaymentMethod = 'split'; $('cashAmountDiv').style.display = 'none'; setTimeout(payUI, 0); }); })();
  document.addEventListener('click', e => { if (e.target.closest('.payment-method')) setTimeout(payUI, 0); });
  (function () { const S = get('pharmacy_settings', '{}'), off = S.posPayOff || []; off.forEach(k => { const m = document.querySelector('.payment-method[data-method="' + k + '"]'); if (m && m.parentElement) m.parentElement.style.display = 'none'; }); })();
  payUI();
  const _pp = window.processPayment;
  window.__pay = null;
  window.processPayment = function () {
    const m = typeof selectedPaymentMethod !== 'undefined' ? selectedPaymentMethod : 'cash', ref = ($('pxRef').value || '').trim().toUpperCase();
    window.__pay = null;
    if (cart.length && m === 'split') {
      const t = calculateTotals().total, cp = parseFloat($('pxCashPart').value);
      if (!(cp > 0 && cp < t)) { showToast('Cash part must be more than 0 and less than ' + money(t), 'danger'); $('pxCashPart').focus(); return; }
      if (!get('pharmacy_settings', '{}').posNoRef && !/^[A-Z0-9-]{6,20}$/.test(ref)) { showToast('Enter the wallet TrxID for the wallet part', 'danger'); $('pxRef').focus(); return; }
      window.__pay = { provider: $('pxProv').value, ref, parts: [{ m: 'cash', amt: +cp.toFixed(2) }, { m: 'mobile', amt: +(t - cp).toFixed(2) }] };
    } else if (cart.length && m !== 'cash' && m !== 'due' && !get('pharmacy_settings', '{}').posNoRef) {
      if (!/^[A-Z0-9-]{6,20}$/.test(ref)) { showToast(m === 'mobile' ? 'Enter the wallet TrxID (6–20 letters/digits)' : 'Enter the card slip / approval no. (6–20 letters/digits)', 'danger'); $('pxRef').focus(); return; }
      window.__pay = { provider: m === 'mobile' ? $('pxProv').value : 'Card', ref };
    }
    const n0 = get('pharmacy_sales', '[]').length;
    _pp.apply(this, arguments);
    try {
      const S = get('pharmacy_sales', '[]');
      if (window.__pay && S.length && S[S.length - 1].real && (S.length !== n0 || cart.length === 0)) { const l = S[S.length - 1]; l.provider = window.__pay.provider; l.payRef = window.__pay.ref; l.paid = true; if (window.__pay.parts) l.parts = window.__pay.parts; localStorage.setItem('pharmacy_sales', JSON.stringify(S)); }
      if (!cart.length) $('pxRef').value = '';
    } catch (e) { }
  };
  const _si = window.showInvoice;
  window.showInvoice = function (inv) {
    _si.apply(this, arguments);
    if (window.__pay) { const w = document.querySelector('#invoiceContent .text-center.mt-4 p'); if (w) w.append(' · ' + window.__pay.provider + ' ref ' + window.__pay.ref + (window.__pay.parts ? ' · cash ' + money(window.__pay.parts[0].amt) + ' + wallet ' + money(window.__pay.parts[1].amt) : '')); }
  };


  // ---- v35: real customers in POS + "Due" (বাকি) bills ----
  const CK = 'pharmacy_customers';
  const realCust = () => get(CK, '[]').filter(c => c && c.name);
  (function () {
    const R = realCust();
    if (R.length) { customers = R.map(c => ({ id: c.id, name: c.name, phone: c.phone || '', due: +c.due || 0 })); loadCustomers(); }
    const sel = $('customerSelect'), info = el('div', { class: 'pxs', id: 'pxCust', 'aria-live': 'polite' }); sel.after(info);
    sel.addEventListener('change', () => { const c = realCust().find(x => String(x.id) === sel.value); info.textContent = c && +c.due > 0 ? '⚠ Existing due: ' + money(c.due) : ''; });
    const mob = document.querySelector('.payment-method[data-method="mobile"]'); if (!mob) return;
    const col = mob.parentElement.cloneNode(true), tile = col.querySelector('.payment-method');
    tile.dataset.method = 'due'; tile.querySelector('i').className = 'fas fa-book fa-2x mb-1 text-primary'; tile.querySelector('.small').textContent = 'Due (বাকি)'; mob.parentElement.after(col);
    tile.addEventListener('click', () => { document.querySelectorAll('.payment-method').forEach(x => x.classList.remove('active')); tile.classList.add('active'); selectedPaymentMethod = 'due'; $('cashAmountDiv').style.display = 'none'; setTimeout(payUI, 0); });
  })();
  const _pp2 = window.processPayment;
  window.processPayment = function () {
    const m = typeof selectedPaymentMethod !== 'undefined' ? selectedPaymentMethod : 'cash';
    if (m !== 'due') return _pp2.apply(this, arguments);
    if (!cart.length) return showToast('Cart is empty!', 'warning');
    const cid = $('customerSelect').value, cu = realCust().find(x => String(x.id) === cid);
    if (cid === '0' || !cu) return showToast('Select a saved customer for a due (বাকি) bill', 'danger');
    const total = calculateTotals().total;
    if (!confirm('Put ' + money(total) + ' on ' + cu.name + "'s account (due)?")) return;
    const n0 = get('pharmacy_sales', '[]').length;
    _pp2.apply(this, arguments);
    try {
      const S = get('pharmacy_sales', '[]');
      if (S.length > n0 && !cart.length) {
        const l = S[S.length - 1]; l.due = true; l.paid = false; l.customerId = cu.id; localStorage.setItem('pharmacy_sales', JSON.stringify(S));
        const C = get(CK, '[]'), i = C.findIndex(x => String(x.id) === cid); if (i >= 0) { C[i].due = +((+C[i].due || 0) + total).toFixed(2); localStorage.setItem(CK, JSON.stringify(C)); }
        const L = get('pharmacy_customer_ledger', '[]'); L.push({ id: Date.now(), customerId: cu.id, type: 'due', amount: +total.toFixed(2), invoiceNo: l.invoiceNo, at: new Date().toISOString(), note: 'POS due bill' }); localStorage.setItem('pharmacy_customer_ledger', JSON.stringify(L.slice(-500)));
        customers = realCust().map(c => ({ id: c.id, name: c.name, phone: c.phone || '', due: +c.due || 0 })); loadCustomers(); $('customerSelect').value = '0'; $('pxCust').textContent = '';
        showToast(money(total) + ' added to ' + cu.name + "'s due", 'info');
      }
    } catch (e) { }
  };

  // ---- v45: top-seller chips, editable quantities, today's bills with reprint ----
  const sales = () => get('pharmacy_sales', '[]').filter(x => x && x.real && x.status !== 'Voided');
  const dkey = x => new Date(x).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  const favs = el('div', { id: 'pxFav', class: 'pxq', 'aria-label': 'Top sellers' });
  const grid = $('productsGrid'); if (grid) grid.before(favs);
  function drawFav() {
    const cut = Date.now() - 30 * 864e5, cnt = {};
    sales().forEach(x => { if (new Date(x.at || x.date) < cut) return; (x.items || []).forEach(i => cnt[i.id] = (cnt[i.id] || 0) + (+i.quantity || 0)); });
    const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).map(id => products.find(p => String(p.id) === String(id))).filter(p => p && p.stock > 0).slice(0, 6);
    favs.replaceChildren(...(top.length ? [el('small', { class: 'text-muted' }, '⭐ Top sellers:')].concat(top.map(p => el('button', { type: 'button', onclick() { addToCart(p.id); } }, p.name))) : []));
  }
  // editable quantity: replace the number between − and + with an input
  const _uc2 = window.updateCart;
  window.updateCart = function () {
    _uc2.apply(this, arguments);
    document.querySelectorAll('#cartItems .cart-item').forEach((row, i) => {
      const it = cart[i], sp = row.querySelector('span.fw-bold.mx-2'); if (!it || !sp) return;
      const p = products.find(x => x.id === it.id), inp = el('input', { type: 'number', min: '1', max: String(p ? p.stock : 9999), value: String(it.quantity), 'aria-label': 'Quantity of ' + it.name, style: 'width:3.6rem;text-align:center', class: 'form-control form-control-sm d-inline-block' });
      inp.addEventListener('change', () => { const v = Math.floor(+inp.value); if (!(v >= 1)) { updateCart(); return; } updateQuantity(it.id, v); });
      sp.replaceWith(inp);
    });
    drawToday(); drawFav();
  };
  const today = el('details', { id: 'pxToday', class: 'pxh' });
  const acts = document.querySelector('.d-grid.gap-2.mt-3'); if (acts) acts.after(today);
  function reprint(x) {
    const items = (x.items || []).map(i => ({ id: i.id, name: i.name, price: +i.price || 0, quantity: +i.quantity || 0, total: (+i.price || 0) * (+i.quantity || 0) }));
    showInvoice({ invoiceNo: x.invoiceNo, date: new Date(x.at || x.date).toLocaleString(), customer: x.customer || 'Walk-in Customer', rx: x.rx ? { no: x.rx.no, by: x.rx.by } : null, items, subtotal: +x.subtotal || +x.total, discount: +x.discount || 0, tax: +x.tax || 0, total: +x.total || 0, paymentMethod: String(x.paymentMethod || '') + ' ', cashAmount: 0, change: 0 });
  }
  function drawToday() {
    const t = dkey(Date.now()), L = sales().filter(x => dkey(x.at || x.date) === t).reverse(), sum = L.reduce((a, x) => a + (+x.total || 0), 0);
    today.replaceChildren(el('summary', {}, '🧾 Today: ' + L.length + ' bill(s) · ' + money(sum)),
      ...(L.length ? L.slice(0, 15).map(x => el('div', { class: 'it' }, el('span', {}, new Date(x.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + (x.customer || 'Walk-in') + ' · ' + money(x.total) + ' · ' + (x.parts ? 'split' : x.paymentMethod || '')), el('button', { type: 'button', onclick() { reprint(x); } }, 'Reprint'))) : [el('small', { class: 'text-muted' }, 'No bills yet today.')]));
  }
  window.addEventListener('mc-sale', () => { drawToday(); drawFav(); });

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
