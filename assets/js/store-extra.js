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
  st.textContent = '.mc-staffbar{background:#eef2ff;border:1px solid #c7d2fe;color:#3730a3;border-radius:10px;padding:.4rem .8rem;margin:.4rem 0;font-size:.9rem}.mc-staffbar a{color:#3730a3;font-weight:600}.mc-banner{background:#fff7e0;border:1px solid #f1d58a;color:#6b4a00;padding:.6rem .9rem;border-radius:10px;margin:.5rem 0}.mc-banner.closed{background:#fde8e8;border-color:#f3b4b4;color:#8a1c1c}.mc-note{padding:.5rem .8rem;border-radius:10px;background:var(--card);border:1px dashed var(--br)}.mc-note.warn{color:var(--bad)}[data-theme=dark] .mc-banner{background:#3a2f10;color:#ffd987;border-color:#6b5420}[data-theme=dark] .mc-banner.closed{background:#401818;color:#ffb3b3}';
  document.head.appendChild(st);
  render();
})();

/* ---- Ask a pharmacist (customer → pharmacist inbox in the Ops Panel) ---- */
(function () {
  'use strict';
  views.ask = function () {
    return h('section', {}, h('h1', {}, lang() === 'bn' ? 'ফার্মাসিস্টকে জিজ্ঞাসা করুন' : 'Ask a pharmacist'),
      h('p', { class: 'muted' }, lang() === 'bn' ? 'ওষুধের ব্যবহার বা বিকল্প নিয়ে প্রশ্ন করুন। এটি জরুরি চিকিৎসার জন্য নয়: জরুরি হলে ডাক্তার বা ৯৯৯-এ যোগাযোগ করুন।' : 'Questions about using a medicine or alternatives. Not for emergencies: call a doctor or 999.'),
      h('form', {
        novalidate: true, onsubmit(e) {
          e.preventDefault(); const t = e.target.elements;
          if (t.n.value.trim().length < 2 || !/^(\+?88)?01[3-9]\d{8}$/.test(t.ph.value.trim()) || t.q.value.trim().length < 8) return toast('Enter your name, a valid BD mobile number and a question (8+ characters)', 1);
          D = db(); (D.notes = D.notes || []).push({ id: uid('N'), at: new Date().toISOString(), kind: 'ask', msg: '💊 Pharmacist question from ' + t.n.value.trim() + ' (' + t.ph.value.trim() + ')' + (t.med.value.trim() ? ' about ' + t.med.value.trim().slice(0, 60) : '') + ': ' + t.q.value.trim().slice(0, 400), read: false });
          save(D); e.target.reset(); toast('Question sent. The pharmacist will call you.');
        }
      }, h('label', {}, 'Name', h('input', { name: 'n', value: (PROF().name || '') })), h('label', {}, T('Mobile'), h('input', { name: 'ph', type: 'tel', value: (PROF().phone || '') })),
        h('label', {}, 'Medicine (optional)', h('input', { name: 'med' })), h('label', {}, 'Your question', h('textarea', { name: 'q', rows: 4 })), h('button', { class: 'btn' }, T('Send message'))));
  };
  const _r = render;
  render = function (k) {
    _r(k);
    document.querySelectorAll('.mc-staffbar').forEach(e => e.remove());
    let su = null; try { su = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) {}
    const ops = sessionStorage.getItem('mc_role');
    if (su || ops) {
      const links = [];
      if (su) { links.push(['dashboard.html', 'Dashboard'], ['sales.html', 'POS']); if (su.role !== 'staff' || true) links.push(['medicines.html', 'Medicines']); }
      if (ops) links.push(['admin/index.html', 'Ops Panel']);
      $('#app').prepend(h('div', { class: 'mc-staffbar' }, '👤 ' + (su ? su.name + ' (' + su.role + ')' : ops) + (su && ops ? ' · ' + ops : '') + ' — ', ...links.flatMap(([u, l]) => [h('a', { href: u }, l), ' · ']).slice(0, -1)));
    }
    const nav = document.querySelector('header.bar nav');
    if (nav && !nav.querySelector('a[href="#/ask"]')) nav.append(h('a', { href: '#/ask' }, lang() === 'bn' ? 'ফার্মাসিস্ট' : 'Ask pharmacist'));
  };
  render();
})();
