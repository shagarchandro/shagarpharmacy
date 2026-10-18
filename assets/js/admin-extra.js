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

/* ---- Pharmacist tools: richer prescription queue, counselling note, tab badges ---- */
(function () {
  'use strict';
  function decide(o, ok) {
    if (ok) {
      if (!confirm('Approve ' + o.no + '? Confirm you have checked the prescription.')) return;
      const c = prompt('Counselling note for the customer (optional, e.g. "take after meals")') || '';
      o.status = 'Confirmed'; o.note = 'Prescription verified.' + (c.trim() ? ' Pharmacist advice: ' + c.trim().slice(0, 200) : ''); o.rxBy = R; o.rxAt = new Date().toISOString();
      audit('Approved Rx ' + o.no); save(D); toast('Approved'); go();
    } else {
      const r = prompt('Reason for rejecting (shown to the customer)'); if (!r || r.trim().length < 3) return toast('A reason is required', 1);
      o.items.forEach(i => put(D, i.pid, i.qty, o.no)); o.status = 'Cancelled'; o.note = 'Prescription rejected: ' + r.trim().slice(0, 200); o.rxBy = R; o.rxAt = new Date().toISOString();
      audit('Rejected Rx ' + o.no); save(D); go();
    }
  }
  V.rx = () => {
    const L = D.orders.filter(o => o.status === 'Prescription Review'), done = D.orders.filter(o => o.rxBy).slice(-8).reverse();
    const wrap = h('div', {});
    wrap.append(L.length ? h('div', {}, L.map(o => h('article', { class: 'card' },
      h('h3', {}, o.no + ' · ' + o.customer + ' · ' + o.phone), h('p', { class: 'muted' }, 'Ordered ' + dhaka(o.at) + ' · ' + o.addr),
      tbl(['Medicine', 'Qty', 'Rx', 'Price'], o.items.map(i => h('tr', {}, h('td', {}, i.name), h('td', {}, i.qty), h('td', {}, i.rx ? '℞' : ''), h('td', {}, money(i.price * i.qty))))),
      h('p', {}, 'Doctor / registration given by customer: ', h('b', {}, o.doc || '—')),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick() { decide(o, true); } }, T('Approve')), h('button', { onclick() { decide(o, false); } }, T('Reject')), h('a', { class: 'btn2', href: 'tel:' + o.phone }, '📞 Call customer'))))) : h('p', { class: 'empty' }, 'No prescriptions waiting. New Rx orders appear here.'));
    if (done.length) wrap.append(h('h2', {}, 'Recently reviewed'), tbl(['Order', 'Customer', 'Result', 'By', 'When', 'Note'], done.map(o => h('tr', {}, h('td', {}, o.no), h('td', {}, o.customer), h('td', {}, o.status === 'Cancelled' ? 'Rejected' : 'Approved'), h('td', {}, o.rxBy), h('td', {}, dhaka(o.rxAt)), h('td', {}, o.note || '')))));
    return wrap;
  };
  if (V.notes) {
    const N0 = V.notes;
    V.notes = () => { const r = N0(); const q = D.notes.filter(n => n.kind === 'ask' && !n.read).length; if (q) r.prepend(h('p', { class: 'warn' }, '💊 ' + q + ' unanswered pharmacist question' + (q > 1 ? 's' : '') + ' (marked with 💊 below)')); return r; };
  }
  const badge = () => {
    const nav = document.querySelector('header.bar nav'); if (!nav) return;
    const open = D.orders.filter(o => ['Pending', 'Confirmed', 'Processing', 'Packed'].includes(o.status)).length;
    const n = { rx: D.orders.filter(o => o.status === 'Prescription Review').length, notes: (D.notes || []).filter(x => !x.read).length, orders: open, delivery: D.orders.filter(o => ['Packed', 'Shipped'].includes(o.status)).length };
    [...nav.querySelectorAll('button')].forEach(b => {
      const base = b.dataset.base || (b.dataset.base = b.textContent), key = Object.keys(NAMES).find(k => T(NAMES[k]) === base);
      b.textContent = (key && n[key] > 0) ? base + ' (' + n[key] + ')' : base;
    });
  };
  const g0 = go; go = function () { g0(); badge(); };
  go();
})();

/* Owner shortcut to the Control Center */
(function () {
  if (R !== 'Owner') return;
  const t = document.querySelector('header.bar .tools');
  if (t && !t.querySelector('a[href="../admin-center.html"]')) t.prepend(h('a', { href: '../admin-center.html' }, '🎛 Control Center'));
})();
