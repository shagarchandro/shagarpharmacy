/* Shop design layer (v47): hero call-to-actions and trust chips, offer-card icons, and a full multi-column footer
   driven by the live shop settings (contact details, payments, delivery rules, admin footer note). */
(function () {
  'use strict';
  const S = () => (D && D.settings) || {}, off = k => (S().shopOff || []).includes(k), isbn = () => typeof lang === 'function' && lang() === 'bn';
  const L = (en, bn) => isbn() ? bn : en;
  function hero(a) {
    const hr = a.querySelector('.hero'); if (!hr || hr.querySelector('.hero-cta')) return;
    const p = hr.querySelector('p');
    const cta = h('div', { class: 'hero-cta' }, h('a', { class: 'pri', href: '#/', onclick(e) { e.preventDefault(); const t = document.querySelector('.filters'); t && t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, '🛒 ' + L('Shop medicines', 'ওষুধ কিনুন')),
      off('ask') ? null : h('a', { class: 'sec', href: '#/ask' }, '💊 ' + L('Ask a pharmacist', 'ফার্মাসিস্টকে জিজ্ঞাসা')));
    const chips = h('div', { class: 'hero-chips' }, [['✔', L('Genuine medicines', 'আসল ওষুধ')], ['👩‍⚕️', L('Pharmacist-checked', 'ফার্মাসিস্ট-যাচাই')], ['🚚', L('Fast delivery', 'দ্রুত ডেলিভারি')], ['💵', L('Cash on delivery', 'ক্যাশ অন ডেলিভারি')]].map(([i, t]) => h('span', {}, i + ' ' + t)));
    (p || hr.lastChild).after(cta, chips);
    a.querySelectorAll('.offers .card b').forEach(b => { const t = b.textContent; if (!/^[🏷🚚⚕]/.test(t)) b.textContent = (/Code/.test(t) ? '🏷 ' : /Delivery/.test(t) ? '🚚 ' : /Prescription/.test(t) ? '⚕️ ' : '') + t; });
  }
  const PAYS = [['Cash on delivery', 'Cash on delivery'], ['Card on delivery', 'Card on delivery'], ['bKash (demo)', 'bKash'], ['Nagad (demo)', 'Nagad'], ['Rocket (demo)', 'Rocket']];
  function footer() {
    const ft = document.querySelector('footer.foot'); if (!ft) return;
    const s = S(), name = s.store || 'MediCare Pharmacy', phone = s.phone || '01700-000000', addr = s.addr || 'Dhanmondi, Dhaka', hours = s.hours || 'Open 9am–10pm', offp = s.payOff || [];
    const fee = '৳' + (s.feeDhaka == null ? 60 : s.feeDhaka) + ' ' + L('in Dhaka', 'ঢাকায়') + ' · ৳' + (s.feeOut == null ? 120 : s.feeOut) + ' ' + L('elsewhere', 'অন্যত্র');
    const li = (href, t) => h('li', {}, h('a', { href }, t));
    ft.className = 'foot mcfoot';
    ft.replaceChildren(
      h('div', { class: 'fgrid' },
        h('div', {}, h('div', { class: 'brandline' }, '✚ ' + name), h('p', {}, L('Your neighbourhood pharmacy, online. Genuine medicines, checked by a licensed pharmacist.', 'আপনার পাড়ার ফার্মেসি, এখন অনলাইনে। আসল ওষুধ, লাইসেন্সধারী ফার্মাসিস্টের যাচাইয়ে।')), s.footerNote ? h('div', { class: 'fnote' }, '📢 ' + s.footerNote) : null),
        h('div', {}, h('h4', {}, L('Quick links', 'দ্রুত লিংক')), h('ul', {}, li('#/', L('Shop', 'শপ')), off('wish') ? null : li('#/wishlist', L('Wishlist', 'উইশলিস্ট')), li('#/orders', L('Track orders', 'অর্ডার ট্র্যাক')), li('#/info', L('Help & FAQ', 'সাহায্য ও FAQ')), li('#/contact', L('Contact', 'যোগাযোগ')), off('ask') ? null : li('#/ask', L('Ask pharmacist', 'ফার্মাসিস্ট')))),
        h('div', {}, h('h4', {}, L('Contact', 'যোগাযোগ')), h('p', {}, '📞 ', h('a', { href: 'tel:' + String(phone).replace(/[^+\d]/g, '') }, phone)), h('p', {}, '📍 ' + addr), h('p', {}, '🕒 ' + hours), h('p', {}, h('a', { href: 'login.html' }, '🔐 ' + L('Staff login', 'স্টাফ লগইন')))),
        h('div', {}, h('h4', {}, L('Delivery & payment', 'ডেলিভারি ও পেমেন্ট')), h('p', {}, '🚚 ' + fee), s.freeMin > 0 ? h('p', {}, '🎁 ' + L('Free delivery from ৳' + s.freeMin, '৳' + s.freeMin + '-এর ওপর ফ্রি ডেলিভারি')) : null, s.minOrder > 0 ? h('p', {}, L('Minimum order ৳' + s.minOrder, 'ন্যূনতম অর্ডার ৳' + s.minOrder)) : null,
          h('div', { class: 'pays' }, PAYS.filter(x => !offp.includes(x[0])).map(x => h('span', {}, x[1]))))),
      h('div', { class: 'fbar' }, h('span', {}, '© ' + new Date().getFullYear() + ' ' + name), h('span', {}, L('Demo store — no real medicines are sold and no real payments are taken.', 'ডেমো স্টোর — আসল ওষুধ বিক্রি বা পেমেন্ট হয় না।')),
        h('span', {}, h('a', { href: '#/info' }, L('Privacy & terms', 'গোপনীয়তা ও শর্ত')), ' · ', h('a', { href: '#', onclick(e) { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); } }, '↑ ' + L('Back to top', 'ওপরে যান')))));
    if (s.footerNote) ft.append(h('p', { class: 'mc-fn' }, s.footerNote));
  }
  const _r = render;
  render = function (k) { _r(k); D = db(); try { const a = $('#app'); a && hero(a); footer(); } catch (e) { console.warn('design', e); } };
  render();
})();
