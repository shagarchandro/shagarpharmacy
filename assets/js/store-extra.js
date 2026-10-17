/* Shop extras driven by Ops Panel settings: announcement, open/closed, free delivery,
   minimum order, shop contact details. Wraps totals(), render() and place() from store.js. */
(function () {
  'use strict';
  const set = () => (D && D.settings) || {};
  const _totals = totals;
  totals = function (area) {                       // free delivery above the threshold
    const t = _totals(area), s = set();
    if (s.freeMin > 0 && t.sub >= s.freeMin && t.fee) { t.total -= t.fee; t.fee = 0; }
    return t;
  };
  const _place = place;
  place = function (f, rx) {
    const s = set(); D = db();
    if (set().shopOpen === false) return toast('The shop is closed for online orders right now.', 1);
    const sub = totals(f.elements.area ? f.elements.area.value : 'dhaka').sub;
    if (set().minOrder > 0 && sub < set().minOrder) return toast('Minimum order is ' + money(set().minOrder), 1);
    return _place(f, rx);
  };
  const _render = render;
  render = function (k) {
    _render(k);
    D = db(); const s = set(), a = $('#app'), route = (location.hash.slice(2) || 'catalog').split('/')[0];
    document.querySelectorAll('.mc-banner').forEach(e => e.remove());
    const b = [];
    if (s.shopOpen === false) b.push(h('div', { class: 'mc-banner closed', role: 'alert' }, '⛔ ' + (lang() === 'bn' ? 'দোকান এখন অনলাইন অর্ডার নিচ্ছে না।' : 'We are not taking online orders right now.')));
    if (s.notice) b.push(h('div', { class: 'mc-banner', role: 'status' }, '📢 ' + s.notice));
    if (b.length) a.prepend(...b);
    if (route === 'cart' || route === 'checkout') {
      const t = totals(), box = [];
      if (s.freeMin > 0 && t.sub > 0) box.push(h('p', { class: 'mc-note' }, t.sub >= s.freeMin ? '🎉 ' + (lang() === 'bn' ? 'ডেলিভারি ফ্রি!' : 'Free delivery unlocked!') : '🚚 ' + (lang() === 'bn' ? 'ফ্রি ডেলিভারির জন্য আরও ' : 'Add ') + money(s.freeMin - t.sub) + (lang() === 'bn' ? ' এর কেনাকাটা করুন' : ' more for free delivery')));
      if (s.minOrder > 0 && t.sub > 0 && t.sub < s.minOrder) box.push(h('p', { class: 'mc-note warn' }, (lang() === 'bn' ? 'ন্যূনতম অর্ডার ' : 'Minimum order ') + money(s.minOrder)));
      if (box.length) a.append(...box);
    }
    const ft = document.querySelector('footer.foot');
    if (ft && (s.phone || s.addr || s.hours)) { const p = ft.querySelector('p'); if (p) p.textContent = [s.addr || 'Dhanmondi, Dhaka', s.phone, s.hours].filter(Boolean).join(' · '); }
    document.title = (s.store || 'MediCare') + ' – Online Shop';
  };
  const st = document.createElement('style');
  st.textContent = '.mc-banner{background:#fff7e0;border:1px solid #f1d58a;color:#6b4a00;padding:.6rem .9rem;border-radius:10px;margin:.5rem 0}.mc-banner.closed{background:#fde8e8;border-color:#f3b4b4;color:#8a1c1c}.mc-note{padding:.5rem .8rem;border-radius:10px;background:var(--card);border:1px dashed var(--br)}.mc-note.warn{color:var(--bad)}[data-theme=dark] .mc-banner{background:#3a2f10;color:#ffd987;border-color:#6b5420}[data-theme=dark] .mc-banner.closed{background:#401818;color:#ffb3b3}';
  document.head.appendChild(st);
  render();
})();
