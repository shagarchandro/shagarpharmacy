/* Customer-shop controls driven by the admin (Control Center → 🛍 Customer Shop):
   hero text, footer note, section switches, hidden products, featured strip.
   Everything is read from the shared shop data, and the shop re-renders live when the admin saves. */
(function () {
  'use strict';
  const S = () => (D && D.settings) || {};
  const off = k => (S().shopOff || []).includes(k);
  const visible = fn => function () {
    const all = D.products; D.products = all.filter(p => !p.hide);
    try { return fn.apply(this, arguments); } finally { D.products = all; }
  };
  ['catalog', 'product', 'wishlist'].forEach(k => { if (views[k]) views[k] = visible(views[k]); });
  const _ask = views.ask;
  views.ask = function () { return off('ask') ? h('section', {}, h('h1', {}, 'Ask a pharmacist'), h('p', { class: 'empty' }, 'This service is not available right now. Please use Contact.'), h('a', { class: 'btn', href: '#/contact' }, 'Contact us')) : _ask.apply(this, arguments); };
  const _pl = place;
  place = function (f, rx) {
    D = db(); const c = cart(), bad = Object.keys(c).map(i => D.products.find(p => p.id === i)).filter(p => p && p.hide);
    if (bad.length) return toast(bad.map(p => p.name).join(', ') + ' is no longer sold online — please remove it from your cart.', 1);
    return _pl(f, rx);
  };
  const _r = render;
  render = function (k) {
    _r(k); D = db();
    const a = $('#app'); if (!a) return;
    const route = (location.hash.slice(2) || 'catalog').split('/')[0], s = S();
    try {
      // section switches
      [['recent', 'recent'], ['best', 'best'], ['reviews', 'reviews'], ['eta', 'eta'], ['track', 'track'], ['filters', 'filters']].forEach(([key, sec]) => { if (off(key)) a.querySelectorAll('[data-sec="' + sec + '"]').forEach(e => e.remove()); });
      if (off('trust')) a.querySelectorAll('.trust').forEach(e => e.remove());
      if (off('offers')) a.querySelectorAll('.offers').forEach(e => e.remove());
      // nav links
      document.querySelectorAll('header.bar nav a').forEach(l => { const h0 = l.getAttribute('href'); l.style.display = (h0 === '#/wishlist' && off('wish')) || (h0 === '#/ask' && off('ask')) ? 'none' : ''; });
      // hero text + footer
      if (route === 'catalog' || route === '') {
        const hero = a.querySelector('.hero');
        if (hero) { const t = hero.querySelector('h1'), p = hero.querySelector('p'); if (t && s.heroTitle) t.textContent = s.heroTitle;
          if (p && s.heroSub) { const cp = (D.coupons || [])[0]; p.textContent = s.heroSub + (s.heroCoupon !== false && cp ? ' Code ' + cp.code + ' gives ' + cp.pct + '% off' + (cp.min ? ' ৳' + cp.min + '+' : '') + '.' : ''); }
          else if (p && s.heroCoupon === false) p.textContent = p.textContent.replace(/\s*Code [^.]*\./, ''); }
        // featured strip
        const F = (s.featured || []).map(id => D.products.find(p => p.id === id && !p.hide)).filter(Boolean);
        a.querySelectorAll('[data-sec="featured"]').forEach(e => e.remove());
        if (F.length && !off('featured')) (a.querySelector('.offers') || hero || a.firstChild).after(h('section', { class: 'rv', 'data-sec': 'featured' }, h('h2', {}, '⭐ Featured'), h('div', { class: 'rvrow' }, F.map(p => h('a', { href: '#/product/' + p.id }, h('b', {}, p.name), h('span', {}, money(eff(p)) + (p.disc > 0 ? ' · -' + p.disc + '%' : '')))))));
      }
      document.querySelectorAll('footer.foot .mc-fn').forEach(e => e.remove());
      const ft = document.querySelector('footer.foot'); if (ft && s.footerNote) ft.append(h('p', { class: 'mc-fn' }, s.footerNote));
    } catch (e) { /* never break the shop */ }
  };
  // live: when the admin saves in another tab/window, refresh the shop (theme changes need a reload)
  window.addEventListener('storage', e => {
    if (e.key === 'mc_db') { try { render(); } catch (x) { } }
    else if (e.key === 'pharmacy_theme' || e.key === 'pharmacy_settings') location.reload();
  });
  render();
})();
