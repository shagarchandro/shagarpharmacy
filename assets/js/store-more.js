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
        o.rider && ['Packed', 'Shipped'].includes(o.status) ? h('div', { class: 'muted' }, '🛵 ' + (bn() ? 'রাইডার: ' : 'Rider: ') + o.rider) : null,
        o.status === 'Pending' || o.status === 'Prescription Review' ? h('button', { class: 'btn2', onclick() {
          if (!confirm(bn() ? 'অর্ডারটি বাতিল করবেন?' : 'Cancel this order?')) return;
          const d = db(), x = d.orders.find(q => q.no === o.no); if (!x || !['Pending', 'Prescription Review'].includes(x.status)) return toast('This order can no longer be cancelled', 1);
          x.items.forEach(i => put(d, i.pid, i.qty, x.no)); x.status = 'Cancelled'; x.cancelledBy = 'customer'; (d.notes = d.notes || []).push({ id: uid('N'), at: new Date().toISOString(), msg: 'Customer cancelled ' + x.no, read: false }); save(d); toast('Order cancelled'); render();
        } }, '✖ ' + (bn() ? 'বাতিল' : 'Cancel order')) : null, ' ',
        h('button', { class: 'btn2', onclick() {
          const c = cart(); let n = 0, miss = 0;
          o.items.forEach(i => { const p = D.products.find(x => x.id === i.pid); if (!p) { miss++; return; } const st = stock(D, p.id), q = Math.min(i.qty, st); if (q > 0) { c[p.id] = Math.min((c[p.id] || 0) + q, st); n++; } else miss++; });
          setCart(c); toast(n ? 'Added ' + n + ' item(s) to cart' + (miss ? ' (' + miss + ' unavailable)' : '') : 'Items are unavailable', !n); if (n) location.hash = '#/cart';
        } }, '↻ ' + (bn() ? 'আবার অর্ডার' : 'Reorder')))));
  }
  function recent(skip) {
    const ids = rd().filter(i => i !== skip), P = ids.map(i => D.products.find(p => p.id === i)).filter(Boolean).slice(0, 8);
    if (!P.length) return null;
    return h('section', { class: 'rv', 'data-sec': 'recent' }, h('h2', {}, bn() ? 'সম্প্রতি দেখেছেন' : 'Recently viewed'),
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
    if (d.orders.length > n0) { const o = d.orders[d.orders.length - 1]; o.payMethod = pay; { const z = (d.settings.zones || []).find(x => 'z:' + x.name === (f.elements.area && f.elements.area.value)); if (z) o.zone = z.name; } if (isW(pay)) { o.payRef = ref; o.paid = false; } else { o.paid = false; } save(d); D = d; }
  };

  // ---- v35: product reviews (stored in this browser only) ----
  const RK = 'mc_reviews';
  const revs = () => { try { return JSON.parse(localStorage.getItem(RK) || '{}'); } catch (e) { return {}; } };
  function reviewBox(pid) {
    const all = revs(), L = (all[pid] || []).slice().reverse(), avg = L.length ? L.reduce((a, r) => a + r.r, 0) / L.length : 0;
    const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
    const f = h('form', { onsubmit(e) {
      e.preventDefault(); const el = e.target.elements, r = +el.rate.value, c = el.comment.value.trim().slice(0, 200), nm = (el.who.value.trim() || me() || 'Customer').slice(0, 30);
      if (!(r >= 1 && r <= 5)) return toast('Choose a rating', 1);
      const a = revs(); (a[pid] = a[pid] || []).push({ n: nm, r, c, at: new Date().toISOString() }); a[pid] = a[pid].slice(-30);
      localStorage.setItem(RK, JSON.stringify(a)); toast(bn() ? 'ধন্যবাদ!' : 'Thanks for your review!'); render();
    } }, h('div', { class: 'row' }, h('select', { name: 'rate', 'aria-label': 'Rating' }, h('option', { value: '' }, 'Rating…'), [5, 4, 3, 2, 1].map(n => h('option', { value: n }, stars(n)))), h('input', { name: 'who', placeholder: 'Your name', maxlength: 30, value: me() || '', 'aria-label': 'Your name' })),
      h('input', { name: 'comment', placeholder: 'Share your experience (optional)', maxlength: 200, 'aria-label': 'Comment' }), h('button', { class: 'btn' }, 'Submit review'));
    return h('section', { class: 'rv mc-free', 'data-sec': 'reviews' }, h('h2', {}, (bn() ? 'রিভিউ' : 'Reviews') + (L.length ? ' · ' + avg.toFixed(1) + ' ' + stars(Math.round(avg)) + ' (' + L.length + ')' : '')),
      L.length ? L.slice(0, 5).map(r => h('div', { class: 'mcb' }, h('b', {}, stars(r.r) + ' ' + r.n), h('div', {}, r.c || ''), h('small', { class: 'muted' }, new Date(r.at).toLocaleDateString()))) : h('p', { class: 'muted' }, bn() ? 'এখনও কোনো রিভিউ নেই।' : 'No reviews yet — be the first.'),
      h('p', { class: 'muted', style: 'font-size:.8rem' }, 'Reviews are saved on this device only (demo).'), f);
  }

  function receipt(o) {
    const w = h('div', { class: 'mcprint' }, h('h2', {}, (D.settings && D.settings.store) || 'MediCare'), h('p', {}, o.no + ' · ' + new Date(o.at).toLocaleString()), h('p', {}, o.customer + ' · ' + o.phone), h('p', {}, o.addr),
      h('table', {}, h('tbody', {}, o.items.map(i => h('tr', {}, h('td', {}, i.name), h('td', {}, '× ' + i.qty), h('td', {}, money(i.price * i.qty)))))),
      h('p', {}, 'Subtotal ' + money(o.sub) + (o.disc ? ' · Discount −' + money(o.disc) : '') + ' · Delivery ' + money(o.fee)), h('h3', {}, 'Total ' + money(o.total)), h('p', {}, 'Payment: ' + (o.pay || '') + (o.payRef ? ' · ref ' + o.payRef : '')), h('p', {}, 'Thank you!'));
    const ps = h('style', { class: 'mcprint' }, '.mcprint{display:none}@media print{body>*:not(.mcprint){display:none!important}.mcprint{display:block!important}}');
    document.head.append(ps); document.body.append(w); setTimeout(() => print(), 50); setTimeout(() => { w.remove(); ps.remove(); }, 1500);
  }

  // ---- v39: catalog quick filters, best sellers, live coupon text ----
  const XF = { stock: false, otc: false, offer: false };
  try { Object.assign(XF, JSON.parse(sessionStorage.getItem('mc_xf') || '{}')); } catch (e) { }
  const xany = () => XF.stock || XF.otc || XF.offer;
  const _cat = views.catalog;
  views.catalog = function () {
    const all = D.products;
    if (xany()) D.products = all.filter(p => (!XF.stock || stock(D, p.id) > 0) && (!XF.otc || !p.rx) && (!XF.offer || p.disc > 0));
    try { return _cat.apply(this, arguments); } finally { D.products = all; }
  };
  function catalogExtras(a) {
    const flt = a.querySelector('.filters'), hero = a.querySelector('.hero'); if (!flt) return;
    const chip = (k, l) => h('button', { class: XF[k] ? 'btn' : '', 'aria-pressed': String(XF[k]), onclick() { XF[k] = !XF[k]; try { sessionStorage.setItem('mc_xf', JSON.stringify(XF)); } catch (e) { } S.page = 1; render(); } }, l);
    flt.before(h('div', { class: 'row mc-free', 'data-sec': 'filters', role: 'group', 'aria-label': 'Quick filters' }, chip('stock', '✅ ' + (bn() ? 'স্টকে আছে' : 'In stock')), chip('otc', '💊 ' + (bn() ? 'প্রেসক্রিপশন লাগে না' : 'No prescription')), chip('offer', '🏷 ' + (bn() ? 'অফারে' : 'On offer')),
      xany() ? h('button', { onclick() { XF.stock = XF.otc = XF.offer = false; try { sessionStorage.removeItem('mc_xf'); } catch (e) { } render(); } }, '✕ ' + (bn() ? 'ফিল্টার মুছুন' : 'Clear filters')) : null));
    // live coupon text instead of the fixed SAVE10 line
    const cp = (D.coupons || [])[0], hp = hero && hero.querySelector('p');
    if (hp) hp.textContent = 'Genuine products, pharmacist-checked prescriptions.' + (cp ? ' Code ' + cp.code + ' gives ' + cp.pct + '% off' + (cp.min ? ' ৳' + cp.min + '+' : '') + '.' : '');
    const oc = a.querySelector('.offers .card'); if (oc && cp && /Code/.test(oc.textContent)) { oc.querySelector('b').textContent = 'Code ' + cp.code; oc.querySelector('p').textContent = cp.pct + '% off' + (cp.min ? ' orders of ৳' + cp.min + ' or more' : ' every order'); } else if (oc && !cp && /Code/.test(oc.textContent)) oc.remove();
    // best sellers
    if (!xany() && !S.q && !S.cat) {
      const cnt = {}; (D.orders || []).filter(o => o.status !== 'Cancelled').forEach(o => o.items.forEach(i => cnt[i.pid] = (cnt[i.pid] || 0) + i.qty));
      const top = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x]).map(i => D.products.find(p => p.id === i)).filter(p => p && stock(D, p.id) > 0).slice(0, 5);
      if (top.length) (a.querySelector('.offers') || hero).after(h('section', { class: 'rv mc-free', 'data-sec': 'best' }, h('h2', {}, '🔥 ' + (bn() ? 'বেস্ট সেলার' : 'Best sellers')), h('div', { class: 'rvrow' }, top.map(p => h('a', { href: '#/product/' + p.id }, h('b', {}, p.name), h('span', {}, money(eff(p)) + (p.disc > 0 ? ' · -' + p.disc + '%' : '')))))));
    }
  }

  // ---- v40: product page buy tools + wishlist actions ----
  function productTools(a, pid) {
    const p = D.products.find(x => x.id === pid), card = a.querySelector('.card'), add = card && [...card.querySelectorAll('button.btn')].pop(); if (!p || !card || !add) return;
    const st = stock(D, pid);
    const qty = h('input', { type: 'number', min: 1, max: Math.max(1, st), value: 1, 'aria-label': 'Quantity', style: 'width:5rem' });
    const put = () => { const q = Math.floor(+qty.value); if (!(q >= 1) || q > st) { toast('Choose 1–' + st, 1); return false; } const c = cart(), n = (c[pid] || 0) + q; if (n > st) { toast('Only ' + st + ' available (you already have ' + (c[pid] || 0) + ')', 1); return false; } c[pid] = n; localStorage.setItem('mc_cart', JSON.stringify(c)); return true; };
    const row = h('div', { class: 'row mc-free' });
    if (st) {
      add.disabled = true; add.style.display = 'none';
      row.append(h('label', {}, 'Qty ', qty), h('button', { class: 'btn', onclick() { if (put()) { render(); toast('Added to cart'); } } }, T('Add to cart')), h('button', { class: 'btn2', onclick() { if (put()) location.hash = '#/checkout'; } }, '⚡ ' + (bn() ? 'এখনই কিনুন' : 'Buy now')));
    } else {
      const N = () => { try { return JSON.parse(localStorage.getItem('mc_notify') || '[]'); } catch (e) { return []; } };
      row.append(N().includes(pid) ? h('span', { class: 'ok' }, '🔔 ' + (bn() ? 'স্টকে এলে জানানো হবে' : "We'll let the pharmacy know you want this")) : h('button', { class: 'btn', onclick() {
        const d = db(); (d.notes = d.notes || []).push({ id: uid('N'), at: new Date().toISOString(), msg: 'Back-in-stock request: ' + p.name + ' (from ' + (me() || 'a visitor') + ')', read: false }); save(d);
        const l = N(); l.push(pid); localStorage.setItem('mc_notify', JSON.stringify(l)); toast('Request sent'); render();
      } }, '🔔 ' + (bn() ? 'স্টকে এলে জানান' : 'Notify me when back in stock')));
    }
    row.append(h('button', { class: 'btn2', onclick() { const u = location.href, t = p.name + ' – ' + money(eff(p)); if (navigator.share) navigator.share({ title: t, url: u }).catch(() => { }); else if (navigator.clipboard) navigator.clipboard.writeText(u).then(() => toast('Link copied'), () => toast('Copy the address from your browser bar')); else toast('Copy the address from your browser bar'); } }, '🔗 ' + (bn() ? 'শেয়ার' : 'Share')));
    add.after(row);
  }
  function wishTools(a) {
    const ids = wish().filter(i => D.products.find(p => p.id === i)), h1 = a.querySelector('h1'); if (!ids.length || !h1) return;
    h1.after(h('div', { class: 'cx mc-free' }, h('span', {}, ids.length + ' saved'), h('button', { class: 'btn', onclick() {
      const c = cart(); let n = 0, skip = 0; ids.forEach(i => { const st = stock(D, i); if (st > (c[i] || 0)) { c[i] = (c[i] || 0) + 1; n++; } else skip++; });
      setCart(c); toast(n ? n + ' added to cart' + (skip ? ' (' + skip + ' unavailable)' : '') : 'Nothing available to add', !n);
    } }, '🛒 ' + (bn() ? 'সব কার্টে' : 'Add all to cart')), h('button', { class: 'btn2', onclick() { if (confirm('Clear your wishlist?')) { localStorage.setItem('mc_wish', '[]'); render(); } } }, '🗑 ' + (bn() ? 'তালিকা মুছুন' : 'Clear'))));
  }

  // ---- v41: Help (searchable FAQ), Contact, Ask pharmacist, guest order tracking ----
  const MK = 'mc_msgs', BD = /^(\+?88)?01[3-9]\d{8}$/;
  const msgs = () => { try { return JSON.parse(localStorage.getItem(MK) || '[]'); } catch (e) { return []; } };
  const addMsg = (kind, text) => { const ref = 'Q' + Date.now().toString(36).toUpperCase().slice(-6), l = msgs(); l.push({ ref, kind, at: new Date().toISOString(), text: text.slice(0, 120) }); localStorage.setItem(MK, JSON.stringify(l.slice(-10))); return ref; };
  const histBox = kind => { const L = msgs().filter(m => m.kind === kind).reverse(); return L.length ? h('section', { class: 'mhist' }, h('h2', {}, bn() ? 'আপনার পাঠানো বার্তা' : 'Your recent messages'), L.slice(0, 5).map(m => h('div', { class: 'mcb' }, h('b', {}, m.ref), ' · ', new Date(m.at).toLocaleString(), h('div', { class: 'muted' }, m.text), (() => { const n = (D.notes || []).find(x => x.msg && x.msg.includes(' ' + m.ref + ' ')); return n && n.reply ? h('div', { class: 'ok', role: 'note' }, '💬 ' + (bn() ? 'ফার্মেসির উত্তর: ' : 'Pharmacy reply: ') + n.reply.text, h('small', { class: 'muted' }, ' — ' + new Date(n.reply.at).toLocaleDateString())) : h('small', { class: 'muted' }, bn() ? 'উত্তরের অপেক্ষায়' : 'Awaiting reply'); })()))) : null; };
  const shopPhone = () => ((D.settings && D.settings.phone) || '01700-000000');
  const counter = (el, max) => { const c = h('small', { class: 'muted' }, '0/' + max); el.addEventListener('input', () => { c.textContent = el.value.length + '/' + max; }); return c; };
  const FAQ = () => { const s = D.settings || {}; return [
    ['Orders', 'How do I place an order?', 'Add medicines to the cart, open Checkout, enter your name, mobile and address, choose a payment method and confirm. You can track it from Orders.'],
    ['Orders', 'Can I cancel an order?', 'Yes — from Orders you can cancel while it is Pending or in Prescription Review. After the pharmacy confirms it, call us.'],
    ['Orders', 'How can I track an order without logging in?', 'Use the "Track an order" box on the Orders page with your order number and mobile number.'],
    ['Prescriptions', 'Do I need a prescription?', 'Yes, for items tagged Rx. A pharmacist reviews them before dispatch and you show the prescription on delivery.'],
    ['Prescriptions', 'Can I get a substitute for a medicine?', 'Only a pharmacist can advise on that. Use Ask pharmacist and name the medicine.'],
    ['Delivery', 'What does delivery cost?', 'Delivery is ৳' + (s.feeDhaka == null ? 60 : s.feeDhaka) + ' in Dhaka and ৳' + (s.feeOut == null ? 120 : s.feeOut) + ' elsewhere' + (s.freeMin > 0 ? ', and free on orders of ৳' + s.freeMin + ' or more' : '') + (s.minOrder > 0 ? '. Minimum order is ৳' + s.minOrder : '') + '.'],
    ['Delivery', 'How long does delivery take?', 'Usually 2–6 hours inside Dhaka; outside Dhaka it takes longer.'],
    ['Payment', 'Which payment methods are available?', 'Cash on delivery, card on delivery and (demo) bKash / Nagad / Rocket with a transaction ID. No real payment is taken online.'],
    ['Returns', 'What is your return policy?', 'Return requests are accepted for delivered orders and reviewed by the pharmacy. Medicines that were opened or stored incorrectly cannot be returned.'],
    ['Privacy', 'Is my data safe?', 'This is a demo: data stays in your browser. Do not enter real health or payment information.']]; };
  views.info = function () {
    const q = h('input', { type: 'search', placeholder: bn() ? 'প্রশ্ন খুঁজুন…' : 'Search help…', 'aria-label': 'Search help' }), list = h('div', {});
    const draw = () => { const t = q.value.trim().toLowerCase(), F = FAQ().filter(x => !t || (x[1] + x[2] + x[0]).toLowerCase().includes(t)); list.replaceChildren(...(F.length ? F.map(x => h('details', { class: 'card' }, h('summary', {}, h('b', {}, x[1]), ' ', h('span', { class: 'tag' }, x[0])), h('p', {}, x[2]))) : [h('p', { class: 'empty' }, 'No answers match. Try Ask pharmacist or Contact.')])); };
    q.addEventListener('input', draw); draw();
    return h('section', {}, h('h1', {}, bn() ? 'সাহায্য' : 'Help, privacy & terms'), h('p', {}, 'MediCare Pharmacy · ' + shopPhone() + ' (fictional demo)'), q, list,
      h('div', { class: 'row' }, h('a', { class: 'btn', href: '#/ask' }, '💊 ' + (bn() ? 'ফার্মাসিস্টকে জিজ্ঞাসা' : 'Ask pharmacist')), h('a', { class: 'btn2', href: '#/contact' }, '✉ ' + (bn() ? 'যোগাযোগ' : 'Contact us'))));
  };
  views.contact = function () {
    const s = D.settings || {}, f = h('form', { novalidate: true, onsubmit(e) {
      e.preventDefault(); const t = e.target.elements, nm = t.n.value.trim(), ph = t.ph.value.trim(), m = t.m.value.trim();
      if (nm.length < 2 || !BD.test(ph) || m.length < 5) return toast('Enter your name, a valid BD mobile number and a message', 1);
      D = db(); const ref = addMsg('contact', t.topic.value + ': ' + m);
      (D.notes = D.notes || []).push({ id: uid('N'), at: new Date().toISOString(), msg: 'Contact [' + t.topic.value + '] ' + ref + ' from ' + nm + ' (' + ph + '): ' + m.slice(0, 300), read: false }); save(D);
      localStorage.setItem('mc_prof', JSON.stringify(Object.assign(PROF(), { name: nm, phone: ph }))); toast('Message sent. Reference ' + ref); render();
    } }, h('label', {}, 'Name', h('input', { name: 'n', value: PROF().name || '', maxlength: 60 })), h('label', {}, T('Mobile'), h('input', { name: 'ph', type: 'tel', value: PROF().phone || '' })),
      h('label', {}, 'Topic', h('select', { name: 'topic' }, ['Order help', 'Delivery', 'Payment', 'Product question', 'Feedback', 'Other'].map(x => h('option', {}, x)))),
      (() => { const ta = h('textarea', { name: 'm', rows: 4, maxlength: 300 }); return h('label', {}, T('Message'), ta, counter(ta, 300)); })(), h('button', { class: 'btn' }, T('Send message')));
    return h('section', {}, h('h1', {}, T('Contact us')),
      h('div', { class: 'grid' }, h('div', { class: 'card' }, h('b', {}, '📞 ' + (bn() ? 'ফোন' : 'Call')), h('p', {}, h('a', { href: 'tel:' + shopPhone().replace(/[^+\d]/g, '') }, shopPhone()))), h('div', { class: 'card' }, h('b', {}, '📍 ' + (bn() ? 'ঠিকানা' : 'Address')), h('p', {}, s.addr || 'Dhanmondi, Dhaka')), h('div', { class: 'card' }, h('b', {}, '🕒 ' + (bn() ? 'সময়' : 'Hours')), h('p', {}, s.hours || 'Every day, 9am–10pm'))),
      f, histBox('contact'));
  };
  views.ask = function () {
    const topics = ['Dosage', 'Side effects', 'Alternatives', 'Interactions', 'Storage', 'Other'];
    return h('section', {}, h('h1', {}, bn() ? 'ফার্মাসিস্টকে জিজ্ঞাসা করুন' : 'Ask a pharmacist'),
      h('div', { class: 'mcb', role: 'note' }, '⚠️ ' + (bn() ? 'এটি জরুরি চিকিৎসার জন্য নয়। জরুরি হলে ডাক্তার বা ৯৯৯-এ যোগাযোগ করুন।' : 'Not for emergencies. If it is urgent, see a doctor or call 999.')),
      h('form', { novalidate: true, onsubmit(e) {
        e.preventDefault(); const t = e.target.elements, nm = t.n.value.trim(), ph = t.ph.value.trim(), q = t.q.value.trim();
        if (nm.length < 2 || !BD.test(ph) || q.length < 8) return toast('Enter your name, a valid BD mobile number and a question (8+ characters)', 1);
        D = db(); const ref = addMsg('ask', t.topic.value + (t.med.value ? ' · ' + t.med.value : '') + ': ' + q);
        (D.notes = D.notes || []).push({ id: uid('N'), at: new Date().toISOString(), kind: 'ask', msg: '💊 Pharmacist question ' + ref + ' [' + t.topic.value + '] from ' + nm + ' (' + ph + ')' + (t.med.value ? ' about ' + t.med.value.slice(0, 60) : '') + ': ' + q.slice(0, 400), read: false }); save(D);
        localStorage.setItem('mc_prof', JSON.stringify(Object.assign(PROF(), { name: nm, phone: ph }))); toast('Question sent (ref ' + ref + '). The pharmacist will call you.'); render();
      } }, h('label', {}, 'Name', h('input', { name: 'n', value: PROF().name || '', maxlength: 60 })), h('label', {}, T('Mobile'), h('input', { name: 'ph', type: 'tel', value: PROF().phone || '' })),
        h('label', {}, 'About', h('select', { name: 'topic' }, topics.map(x => h('option', {}, x)))),
        h('label', {}, 'Medicine (optional)', h('input', { name: 'med', list: 'askmeds', maxlength: 60 }), h('datalist', { id: 'askmeds' }, D.products.map(p => h('option', { value: p.name })))),
        (() => { const ta = h('textarea', { name: 'q', rows: 4, maxlength: 400 }); return h('label', {}, 'Your question', ta, counter(ta, 400)); })(), h('button', { class: 'btn' }, T('Send message'))), histBox('ask'));
  };
  function guestTrack(a) {
    const out = h('div', {}), f = h('form', { novalidate: true, onsubmit(e) {
      e.preventDefault(); const t = e.target.elements, no = t.no.value.trim().toUpperCase(), ph = t.ph.value.replace(/\D/g, '').slice(-10);
      const o = D.orders.find(x => String(x.no).toUpperCase() === no && String(x.phone || '').replace(/\D/g, '').slice(-10) === ph) || (window.MCSRV && MCSRV.active ? MCSRV.trackSync(no, ph) : null);
      out.replaceChildren(o ? h('div', { class: 'mcb' }, h('b', {}, o.no), ' · ', money(o.total), ' · ', o.status, timeline(o)) : h('p', { class: 'bad' }, 'No order found for that number and mobile.'));
    } }, h('div', { class: 'row' }, h('input', { name: 'no', placeholder: 'Order no. e.g. INV-1001', 'aria-label': 'Order number' }), h('input', { name: 'ph', type: 'tel', placeholder: 'Mobile', 'aria-label': 'Mobile' }), h('button', { class: 'btn2' }, bn() ? 'ট্র্যাক' : 'Track')));
    a.append(h('section', { class: 'mc-free', 'data-sec': 'track' }, h('h2', {}, bn() ? 'অর্ডার ট্র্যাক করুন' : 'Track an order'), f, out));
  }

  // ---- v43: delivery zones + live order summary at checkout ----
  const zonesOf = () => ((D.settings || {}).zones || []).filter(z => z && z.name);
  const _tt = totals;
  totals = function (area) {
    const t = _tt(area);
    if (typeof area === 'string' && area.startsWith('z:')) { const z = zonesOf().find(x => 'z:' + x.name === area); if (z && t.fee > 0) { t.total += z.fee - t.fee; t.fee = z.fee; } }
    return t;
  };
  function checkoutSummary(a) {
    const f = a.querySelector('form'), sel = f && f.elements.area; if (!sel) return;
    const Z = zonesOf();
    if (Z.length) { sel.replaceChildren(...Z.map(z => h('option', { value: 'z:' + z.name }, z.name + ' — ' + money(z.fee) + (z.eta ? ' · ' + z.eta : '')))); }
    const box = h('div', { class: 'mcb mc-free', 'aria-live': 'polite' });
    const upd = () => { const t = totals(sel.value), z = Z.find(x => 'z:' + x.name === sel.value);
      box.replaceChildren(h('div', {}, 'Subtotal: ' + money(t.sub)), t.disc ? h('div', {}, 'Discount: −' + money(t.disc)) : '', h('div', {}, 'Delivery: ' + (t.fee ? money(t.fee) : 'Free')), h('b', {}, 'Total: ' + money(t.total)), z && z.eta ? h('div', { class: 'mc-eta' }, '🚚 ' + z.eta) : ''); };
    sel.addEventListener('change', upd); upd();
    const pr = f.querySelector('p.price'); pr ? pr.replaceWith(box) : f.append(box);
  }
  const _r = render;
  render = function (k) {
    _r(k); D = db();
    const a = $('#app'); if (!a) return;
    const parts = (location.hash.slice(2) || 'catalog').split('/'), route = parts[0];
    a.querySelectorAll('.mc-track,.rv,.mc-eta,.mc-free').forEach(e => e.remove());
    try {
      if (route === 'product' && parts[1]) {
        const l = rd().filter(i => i !== parts[1]); l.unshift(parts[1]); localStorage.setItem(RV, JSON.stringify(l.slice(0, 10)));
        productTools(a, parts[1]); const r = recent(parts[1]); const h1 = a.querySelector('h1');
        if (h1) h1.after(h('p', { class: 'mc-eta', 'data-sec': 'eta' }, '🚚 ' + (bn() ? 'ঢাকায় সাধারণত ২–৬ ঘণ্টায় ডেলিভারি' : 'Usually delivered within 2–6 hours in Dhaka')));
        a.append(reviewBox(parts[1]));
        if (r) a.append(r);
      } else if (route === 'catalog' || route === '') {
        catalogExtras(a); const r = recent(); if (r) a.append(r);
      } else if (route === 'wishlist') {
        wishTools(a);
      } else if (route === 'orders') {
        const t = track(); if (t) a.prepend(t); guestTrack(a);
      } else if (route === 'success') {
        const o = D.orders.find(x => x.no === parts[1]), card = a.querySelector('section');
        if (o && card) card.append(' ', h('button', { class: 'btn2', onclick() { receipt(o); } }, '🖨 ' + (bn() ? 'রসিদ প্রিন্ট' : 'Print receipt')));
      } else if (route === 'checkout') {
        enhanceCheckout(a); checkoutSummary(a);
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
