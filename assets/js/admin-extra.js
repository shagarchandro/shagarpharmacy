/* Ops Panel extras: shop profile & rules (open/closed, notice, free delivery, min order),
   backup health card, data overview. Wraps V.settings / V.data defined in admin.js. */
(function () {
  'use strict';
  const S0 = V.settings;
  V.settings = () => {
    const r = S0(), s = D.settings;
    const sec = h('div', {});
    sec.append(h('h2', {}, 'Online shop profile & rules'));
    const f = h('form', {
      onsubmit(e) {
        e.preventDefault(); const t = e.target.elements;
        const fm = +t.freeMin.value, mo = +t.minOrder.value;
        if (!(fm >= 0) || !(mo >= 0)) return toast('Free-delivery and minimum order must be 0 or more', 1);
        if (t.phone.value && !/^[0-9+\-\s]{6,20}$/.test(t.phone.value.trim())) return toast('Enter a valid phone number', 1);
        Object.assign(s, { phone: t.phone.value.trim(), addr: t.addr.value.trim(), hours: t.hours.value.trim(), notice: t.notice.value.trim().slice(0, 200), freeMin: fm, minOrder: mo, shopOpen: t.shopOpen.checked });
        audit('Changed shop profile & rules'); save(D); toast('Shop settings saved'); go();
      }
    },
      ...[['phone', 'Shop phone', 'text'], ['addr', 'Shop address', 'text'], ['hours', 'Opening hours', 'text'], ['notice', 'Shop announcement (shown on top of the shop)', 'text'],
        ['freeMin', 'Free delivery from order ৳ (0 = off)', 'number'], ['minOrder', 'Minimum order ৳ (0 = none)', 'number']]
        .map(([n, l, t]) => h('label', {}, l, h('input', { name: n, type: t, min: t === 'number' ? 0 : null, value: s[n] ?? (n === 'freeMin' || n === 'minOrder' ? 0 : '') }))),
      h('label', { class: 'row' }, h('input', { type: 'checkbox', name: 'shopOpen', checked: s.shopOpen !== false ? 'checked' : null }), ' Accept online orders (untick to close the shop)'),
      h('button', { class: 'btn' }, 'Save shop settings'));
    sec.append(f);
    r.insertBefore(sec, r.children[1] || null);
    return r;
  };
  if (V.data) {
    const D0 = V.data;
    V.data = () => {
      const r = D0(), last = localStorage.getItem('mc_lastbackup');
      const days = last ? Math.floor((Date.now() - new Date(last)) / 864e5) : null;
      const card = h('div', { class: 'card' }, h('h3', {}, '💾 Backup status'),
        h('p', { class: days == null || days > 7 ? 'warn' : 'ok' }, last ? `Last backup: ${dhaka(last)} (${days} day${days === 1 ? '' : 's'} ago)` : 'No backup has been taken yet.'),
        h('div', { class: 'row' }, h('a', { class: 'btn', href: '../backup.html' }, 'Open Backup & Restore'),
          h('button', { onclick() { csvAll(); } }, 'Quick export (JSON)')));
      r.prepend(card);
      return r;
    };
  }
  function csvAll() {
    const o = { app: 'medicare', v: 7, at: new Date().toISOString(), data: { mc_db: localStorage.getItem('mc_db') } };
    const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(o)], { type: 'application/json' })), download: 'mc-ops-backup-' + o.at.slice(0, 10) + '.json' });
    a.click(); localStorage.setItem('mc_lastbackup', o.at); toast('Backup downloaded'); go();
  }
  go();
})();
