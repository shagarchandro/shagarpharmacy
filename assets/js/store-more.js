/* Storefront extras (v29): recently viewed, order tracking timeline + reorder, free-delivery progress,
   sticky mobile cart bar, back-to-top, delivery ETA. Wraps render(). Browser-only demo. */
(function () {
  'use strict';
  const RV = 'mc_recent';
  const rd = () => { try { return JSON.parse(localStorage.getItem(RV) || '[]'); } catch (e) { return []; } };
  const bn = () => typeof lang === 'function' && lang() === 'bn';
  const css = h('style', {}, `
  .rv{margin:1.2rem 0}.rv .rvrow{display:flex;gap:.6rem;overflow-x:auto;padding:.3rem 0;scroll-snap-type:x mandatory}
  .rv a{flex:0 0 150px;scroll-snap-align:start;border:1px solid #dde3ea;border-radius:12px;padding:.6rem;text-decoration:none;color:inherit;background:#fff}
  .rv a b{display:block;font-size:.9rem}.rv a span{font-size:.8rem;color:#667}
  .tl{display:flex;gap:0;margin:.6rem 0;flex-wrap:wrap}.tl i{flex:1;min-width:70px;text-align:center;font-style:normal;font-size:.72rem;color:#889;position:relative;padding-top:20px}
  .tl i:before{content:"";position:absolute;top:4px;left:50%;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#cfd6de}
  .tl i:after{content:"";position:absolute;top:9px;left:-50%;width:100%;height:2px;background:#cfd6de;z-index:0}
  .tl i:first-child:after{display:none}.tl i.on{color:#0a7d5a;font-weight:600}.tl i.on:before,.tl i.on:after{background:#0a7d5a}
  .tl.x i{color:#b42318}.tl.x i:before{background:#b42318}
  .mcb{background:#e8f6f0;border:1px solid #bfe5d6;border-radius:12px;padding:.6rem .8rem;margin:.6rem 0}
  .mcb .bar{height:8px;border-radius:6px;background:#d6e4de;margin-top:.4rem;overflow:hidden}.mcb .bar b{display:block;height:100%;background:#0a7d5a}
  .mc-eta{font-size:.85rem;color:#0a7d5a;margin:.4rem 0}
  #mcCartBar{position:fixed;left:.6rem;right:.6rem;bottom:.6rem;z-index:60;display:none;align-items:center;justify-content:space-between;gap:.6rem;background:#0a7d5a;color:#fff;padding:.7rem 1rem;border-radius:14px;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.25)}
  #mcTop{position:fixed;right:.8rem;bottom:4.2rem;z-index:59;display:none;width:40px;height:40px;border-radius:50%;border:0;background:#334;color:#fff;cursor:pointer}
  @media(min-width:769px){#mcCartBar{display:none!important}}
  @media print{#mcCartBar,#mcTop{display:none!important}}`);
  document.head.append(css);
  const top = h('button', { id: 'mcTop', 'aria-label': 'Back to top', onclick() { scrollTo({ top: 0, behavior: 'smooth' }); } }, '↑');
  const bar = h('a', { id: 'mcCartBar', href: '#/cart' });
  document.body.append(top, bar);
  addEventListener('scroll', () => { top.style.display = scrollY > 500 ? 'block' : 'none'; }, { passive: true });

  const STEPS = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
  function timeline(o) {
    if (o.status === 'Cancelled') return h('div', { class: 'tl x' }, h('i', {}, '✖ Cancelled'));
    const rv = o.status === 'Prescription Review';
    const idx = rv ? 0 : Math.max(0, STEPS.indexOf(o.status));
    const L = rv ? ['Rx review'].concat(STEPS.slice(1)) : STEPS;
    return h('div', { class: 'tl', role: 'img', 'aria-label': 'Order status: ' + o.status }, L.map((s, i) => h('i', { class: i <= idx ? 'on' : '' }, s)));
  }
  function track() {
    const m = me(); if (!m) return null;
    const L = (D.orders || []).filter(o => o.customer === m).slice().reverse(); if (!L.length) return null;
    return h('section', { class: 'mc-track' }, h('h2', {}, bn() ? 'আপনার অর্ডার ট্র্যাকিং' : 'Track your orders'),
      L.slice(0, 5).map(o => h('div', { class: 'mcb' },
        h('b', {}, o.no), ' · ', money(o.total), ' · ', new Date(o.at).toLocaleDateString(),
        timeline(o),
        h('button', { class: 'btn2', onclick() {
          const c = cart(); let n = 0, miss = 0;
          o.items.forEach(i => { const p = D.products.find(x => x.id === i.pid); if (!p) { miss++; return; } const st = stock(D, p.id), q = Math.min(i.qty, st); if (q > 0) { c[p.id] = Math.min((c[p.id] || 0) + q, st); n++; } else miss++; });
          setCart(c); toast(n ? 'Added ' + n + ' item(s) to cart' + (miss ? ' (' + miss + ' unavailable)' : '') : 'Items are unavailable', !n); if (n) location.hash = '#/cart';
        } }, '↻ ' + (bn() ? 'আবার অর্ডার' : 'Reorder')))));
  }
  function recent(skip) {
    const ids = rd().filter(i => i !== skip), P = ids.map(i => D.products.find(p => p.id === i)).filter(Boolean).slice(0, 8);
    if (!P.length) return null;
    return h('section', { class: 'rv' }, h('h2', {}, bn() ? 'সম্প্রতি দেখেছেন' : 'Recently viewed'),
      h('div', { class: 'rvrow' }, P.map(p => h('a', { href: '#/product/' + p.id }, h('b', {}, p.name), h('span', {}, money(eff(p)))))));
  }

  // ---- v30: shopping cart upgrades ----
  const LT = 'mc_later';
  const later = () => { try { return JSON.parse(localStorage.getItem(LT) || '{}'); } catch (e) { return {}; } };
  const setLater = o => localStorage.setItem(LT, JSON.stringify(o));
  document.head.append(h('style', {}, '.stp{display:inline-flex;align-items:center;gap:.25rem;margin-left:.4rem}.stp button{width:30px;height:30px;border-radius:8px;border:1px solid #cfd6de;background:#fff;cursor:pointer;font-size:1rem}.cx{display:flex;gap:.5rem;flex-wrap:wrap;margin:.6rem 0}.sfl{margin:1rem 0}.sfl .it{display:flex;justify-content:space-between;align-items:center;gap:.5rem;border:1px solid #dde3ea;border-radius:10px;padding:.5rem .7rem;margin:.3rem 0;background:#fff}'));
  function enhanceCart(a) {
    const c = cart(), ids = Object.keys(c).filter(i => D.products.find(p => p.id === i));
    const rows = a.querySelectorAll('table tbody tr');
    ids.forEach((id, n) => {
      const tr = rows[n], inp = tr && tr.querySelector('input[type=number]'), p = D.products.find(x => x.id === id), st = stock(D, id);
      if (!inp) return;
      const bump = d => { const q = (cart()[id] || 0) + d, cc = cart(); if (q < 1) { delete cc[id]; setCart(cc); return; } if (q > st) return toast('Only ' + st + ' available', 1); cc[id] = q; setCart(cc); };
      inp.after(h('span', { class: 'stp' }, h('button', { 'aria-label': 'Decrease ' + p.name, onclick() { bump(-1); } }, '−'), h('button', { 'aria-label': 'Increase ' + p.name, onclick() { bump(1); } }, '+')));
      const td = tr.children[0]; td.append(h('div', { class: 'muted', style: 'font-size:.8rem' }, money(eff(p)) + ' each' + (st < 5 ? ' · only ' + st + ' left' : '')));
      const rm = tr.querySelector('td:last-child');
      rm && rm.append(' ', h('button', { onclick() { const l = later(); l[id] = 1; setLater(l); const cc = cart(); delete cc[id]; setCart(cc); toast('Saved for later'); } }, bn() ? 'পরে কিনব' : 'Save for later'));
    });
    const units = ids.reduce((x, i) => x + c[i], 0), save = ids.reduce((x, i) => { const p = D.products.find(y => y.id === i); return x + (p.price - eff(p)) * c[i]; }, 0);
    const tbl = a.querySelector('table');
    const info = [h('span', {}, units + ' item(s) · ' + ids.length + ' product(s)')];
    if (save > 0) info.push(h('span', {}, ' · 🎉 You save ' + money(save)));
    tbl.before(h('div', { class: 'cx mc-free' }, info, h('button', { class: 'btn2', onclick() { if (confirm(bn() ? 'কার্ট খালি করবেন?' : 'Clear the whole cart?')) { localStorage.setItem('mc_cart', '{}'); render(); } } }, '🗑 ' + (bn() ? 'কার্ট খালি' : 'Clear cart'))));
    if (ids.some(i => D.products.find(p => p.id === i).rx)) tbl.after(h('div', { class: 'mcb mc-free', role: 'note' }, '⚕️ ' + (bn() ? 'কার্টে প্রেসক্রিপশন-ওষুধ আছে — চেকআউটে প্রেসক্রিপশন লাগবে এবং ফার্মাসিস্ট যাচাই করবেন।' : 'Your cart has prescription medicines — a valid prescription is needed at checkout and a pharmacist will verify it.')));
    const gs = new Set(ids.map(i => D.products.find(p => p.id === i).generic));
    const sug = D.products.filter(p => !c[p.id] && stock(D, p.id) > 0 && !p.rx && !gs.has(p.generic)).slice(0, 4);
    if (sug.length) a.append(h('section', { class: 'rv mc-free' }, h('h2', {}, bn() ? 'এগুলোও লাগতে পারে' : 'You may also need'), h('div', { class: 'rvrow' }, sug.map(p => h('a', { href: '#/product/' + p.id }, h('b', {}, p.name), h('span', {}, money(eff(p))))))));
  }
  function laterBox(a) {
    const l = later(), ids = Object.keys(l).filter(i => D.products.find(p => p.id === i));
    if (!ids.length) return;
    a.append(h('section', { class: 'sfl mc-free' }, h('h2', {}, (bn() ? 'পরে কেনার জন্য সেভ' : 'Saved for later') + ' (' + ids.length + ')'),
      ids.map(i => { const p = D.products.find(x => x.id === i), st = stock(D, i); return h('div', { class: 'it' }, h('span', {}, p.name + ' · ' + money(eff(p))),
        h('span', {}, h('button', { class: 'btn2', disabled: !st, onclick() { const cc = cart(); cc[i] = Math.min((cc[i] || 0) + 1, st); const ll = later(); delete ll[i]; setLater(ll); setCart(cc); } }, st ? 'Move to cart' : 'Out of stock'), ' ',
          h('button', { onclick() { const ll = later(); delete ll[i]; setLater(ll); render(); } }, '✕'))); })));
  }

  // ---- v31: checkout payment options (demo; no real gateway) ----
  const PAYS = [['Cash on delivery', 'Pay the rider in cash when your order arrives.'], ['Card on delivery', 'The rider brings a card machine (no card details are taken online).'], ['bKash (demo)', 'Send to the shop bKash number, then enter your TrxID below.'], ['Nagad (demo)', 'Send to the shop Nagad number, then enter your TrxID below.'], ['Rocket (demo)', 'Send to the shop Rocket number, then enter your TrxID below.']];
  const isW = v => /\((demo)\)/.test(v || '');
  function enhanceCheckout(a) {
    const f = a.querySelector('form'), sel = f && f.elements.pay; if (!sel) return;
    const st0 = (D.settings || {}), off = st0.payOff || [], num = st0.payNum || {}, PL = PAYS.filter(x => !off.includes(x[0]));
    const keep = sel.value; sel.replaceChildren(...(PL.length ? PL : PAYS).map(x => h('option', { value: x[0], selected: x[0] === keep }, x[0])));
    const note = h('small', { class: 'muted', id: 'payNote' }), ref = h('input', { name: 'payref', maxlength: 20, autocomplete: 'off', placeholder: 'e.g. 9A7B3C2D1E' }), lab = h('label', { id: 'payRefL' }, 'Transaction ID (TrxID)', ref, h('small', { class: 'err', id: 'e-payref' }));
    const upd = () => { const v = sel.value, w = isW(v), n = PAYS.find(x => x[0] === v); const nm = (v.match(/^(bKash|Nagad|Rocket)/) || [])[1]; note.textContent = n ? n[1] + (nm && num[nm] ? ' Number: ' + num[nm] : '') : ''; ref.required = false;  lab.style.display = w && !st0.payNoRef ? '' : 'none'; };
    sel.addEventListener('change', upd); sel.closest('label').after(note, lab); upd();
    const t = totals(f.elements.area ? f.elements.area.value : 'dhaka'); note.after(h('p', { class: 'mc-eta' }, '🔒 ' + (bn() ? 'ডেমো — কোনো আসল পেমেন্ট হয় না, কার্ড নম্বর/PIN দেবেন না। মোট: ' : 'Demo — no real payment is taken; never enter card numbers or PINs. Total: ') + money(t.total)));
  }
  const _pl = place;
  place = function (f, rx) {
    D = db(); const pay = f.elements.pay ? f.elements.pay.value : '', ref = f.elements.payref ? f.elements.payref.value.trim().toUpperCase() : '';
    const e = document.getElementById('e-payref'); if (e) e.textContent = '';
    if (isW(pay) && !(D.settings || {}).payNoRef && !/^[A-Z0-9-]{6,20}$/.test(ref)) { if (e) e.textContent = 'Enter the TrxID (6–20 letters/digits)'; return toast('Enter your wallet TrxID', 1); }
    const n0 = D.orders.length; _pl(f, rx); const d = db();
    if (d.orders.length > n0) { const o = d.orders[d.orders.length - 1]; o.payMethod = pay; if (isW(pay)) { o.payRef = ref; o.paid = false; } else { o.paid = false; } save(d); D = d; }
  };
  const _r = render;
  render = function (k) {
    _r(k); D = db();
    const a = $('#app'); if (!a) return;
    const parts = (location.hash.slice(2) || 'catalog').split('/'), route = parts[0];
    a.querySelectorAll('.mc-track,.rv,.mc-eta,.mc-free').forEach(e => e.remove());
    try {
      if (route === 'product' && parts[1]) {
        const l = rd().filter(i => i !== parts[1]); l.unshift(parts[1]); localStorage.setItem(RV, JSON.stringify(l.slice(0, 10)));
        const r = recent(parts[1]); const h1 = a.querySelector('h1');
        if (h1) h1.after(h('p', { class: 'mc-eta' }, '🚚 ' + (bn() ? 'ঢাকায় সাধারণত ২–৬ ঘণ্টায় ডেলিভারি' : 'Usually delivered within 2–6 hours in Dhaka')));
        if (r) a.append(r);
      } else if (route === 'catalog' || route === '') {
        const r = recent(); if (r) a.append(r);
      } else if (route === 'orders') {
        const t = track(); if (t) a.prepend(t);
      } else if (route === 'checkout') {
        enhanceCheckout(a);
      } else if (route === 'cart') {
        if (Object.keys(cart()).length) enhanceCart(a); laterBox(a);
        const s = D.settings || {}, sub = totals('dhaka').sub;
        if (s.freeMin > 0 && sub > 0) {
          const left = s.freeMin - sub, pct = Math.min(100, Math.round(sub / s.freeMin * 100));
          const h1 = a.querySelector('h1');
          h1 && h1.after(h('div', { class: 'mcb mc-free' }, left > 0 ? (bn() ? money(left) + ' আরও কিনলে ফ্রি ডেলিভারি' : 'Add ' + money(left) + ' more for free delivery') : '🎉 ' + (bn() ? 'আপনি ফ্রি ডেলিভারি পাচ্ছেন' : 'You get free delivery'), h('div', { class: 'bar' }, h('b', { style: 'width:' + pct + '%' }))));
        }
      }
    } catch (e) { /* extras must never break the shop */ }
    const c = cart(), n = Object.values(c).reduce((x, y) => x + y, 0);
    if (n && route !== 'cart' && route !== 'checkout') {
      let sub = 0; Object.keys(c).forEach(i => { const p = D.products.find(x => x.id === i); if (p) sub += eff(p) * c[i]; });
      bar.replaceChildren(h('span', {}, '🛒 ' + n + ' item(s)'), h('b', {}, money(sub) + ' →')); bar.style.display = 'flex';
    } else bar.style.display = 'none';
  };
  render();
})();
