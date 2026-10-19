/* Ops Panel v44: smarter Alerts — severity levels, more checks, jump-to-fix buttons, 24h snooze,
   and a live count on the Alerts tab button. Replaces the plain alert list. */
(function () {
  'use strict';
  const SK = 'mc_snooze', H = 36e5;
  const snz = () => { try { const o = JSON.parse(localStorage.getItem(SK) || '{}'), n = Date.now(); Object.keys(o).forEach(k => { if (o[k] < n) delete o[k]; }); return o; } catch (e) { return {}; } };
  const setSnz = o => localStorage.setItem(SK, JSON.stringify(o));
  let SEV = 'all', SHOW = false;
  function build() {
    const L = [], now = Date.now(), lim = new Date(now + (D.settings.expiryDays || 30) * 864e5).toISOString().slice(0, 10), t0 = today();
    const add = (sev, key, title, text, tab) => L.push({ sev, key, title, text, tab });
    D.products.forEach(p => { const s = stock(D, p.id); if (s <= 0) add('crit', 'oos|' + p.id, 'Out of stock', p.name + ' is sold out online.', 'inv'); else if (s < p.reorder) add('warn', 'low|' + p.id, 'Low stock', p.name + ': ' + s + ' left (reorder at ' + p.reorder + ')', 'inv'); });
    D.batches.forEach(b => { if (!(b.qty > 0)) return; if (b.exp < t0) add('crit', 'exp|' + b.id, 'Expired batch', nm(b.pid) + ' batch ' + b.no + ': ' + b.qty + ' units need write-off', 'inv'); else if (b.exp <= lim) add('warn', 'nexp|' + b.id, 'Near expiry', nm(b.pid) + ' batch ' + b.no + ' expires ' + b.exp + ' (' + b.qty + ' units)', 'inv'); });
    (D.orders || []).forEach(o => {
      const age = (now - new Date(o.at)) / H;
      if (o.status === 'Prescription Review') add(age > 2 ? 'crit' : 'warn', 'rx|' + o.no, 'Prescription waiting', o.no + ' has waited ' + Math.round(age) + 'h for a pharmacist', 'rx');
      else if (o.status === 'Return Requested') add('crit', 'ret|' + o.no, 'Return request', o.no + ' needs a decision', 'returns');
      else if (o.status === 'Pending' && age > 12) add('warn', 'pend|' + o.no, 'Order not confirmed', o.no + ' has been Pending for ' + Math.round(age) + 'h', 'orders');
      if (!o.paid && o.payRef && !['Cancelled', 'Delivered'].includes(o.status) && age > 24) add('warn', 'unpaid|' + o.no, 'Wallet payment unchecked', o.no + ' (' + (o.pay || '') + ' ref ' + o.payRef + ') is not marked paid after ' + Math.round(age) + 'h', 'orders');
    });
    (D.notes || []).forEach(n => { if (n.read || n.reply) return; const age = (now - new Date(n.at)) / H;
      if (n.kind === 'ask' || /^Contact \[/.test(n.msg)) add(age > 24 ? 'warn' : 'info', 'q|' + n.id, 'Customer question', n.msg.slice(0, 90), 'notes');
      else if (/^Back-in-stock request/.test(n.msg)) add('info', 'bis|' + n.id, 'Back-in-stock request', n.msg.replace('Back-in-stock request: ', ''), 'notes'); });
    const order = { crit: 0, warn: 1, info: 2 }; L.sort((a, b) => order[a.sev] - order[b.sev]);
    return L;
  }
  const ICON = { crit: '🔴', warn: '🟠', info: '🔵' }, LAB = { crit: 'Critical', warn: 'Warning', info: 'Info' };
  V.alerts = () => {
    const all = build(), S = snz(), vis = all.filter(a => !S[a.key]), hid = all.length - vis.length;
    const cnt = k => vis.filter(a => k === 'all' || a.sev === k).length, list = vis.filter(a => SEV === 'all' || a.sev === SEV);
    const chips = h('div', { class: 'chips' }, ['all', 'crit', 'warn', 'info'].map(k => h('button', { class: SEV === k ? 'on' : '', type: 'button', onclick() { SEV = k; go(); } }, (k === 'all' ? 'All' : LAB[k]) + ' (' + cnt(k) + ')')),
      hid ? h('button', { type: 'button', onclick() { SHOW = !SHOW; go(); } }, (SHOW ? 'Hide' : 'Show') + ' snoozed (' + hid + ')') : null);
    const row = (a, snoozed) => h('li', { class: 'alr ' + a.sev, style: 'display:flex;gap:.5rem;align-items:center;justify-content:space-between;flex-wrap:wrap;border-left:4px solid ' + (a.sev === 'crit' ? '#b3261e' : a.sev === 'warn' ? '#e08a00' : '#2a6fdb') + ';padding:.4rem .6rem;margin:.35rem 0;background:#fff;border-radius:8px' },
      h('span', {}, ICON[a.sev] + ' ', h('b', {}, a.title + ': '), a.text),
      h('span', { class: 'row' }, ACC[R].includes(a.tab) ? h('button', { class: 'mini', type: 'button', onclick() { tab = a.tab; go(); } }, 'Open →') : null,
        snoozed ? h('button', { class: 'mini', type: 'button', onclick() { const s = snz(); delete s[a.key]; setSnz(s); go(); } }, 'Unsnooze') : h('button', { class: 'mini', type: 'button', 'aria-label': 'Snooze 24 hours', onclick() { const s = snz(); s[a.key] = Date.now() + 24 * H; setSnz(s); toast('Snoozed for 24 hours'); go(); } }, 'Snooze 24h')));
    return h('div', {}, chips,
      list.length ? h('ul', { style: 'list-style:none;padding:0;margin:0' }, list.map(a => row(a, false))) : h('p', { class: 'empty' }, vis.length ? 'No alerts at this level.' : '✔ No alerts. Stock, orders and customer messages look healthy.'),
      SHOW && hid ? h('div', {}, h('h3', {}, 'Snoozed'), h('ul', { style: 'list-style:none;padding:0' }, all.filter(a => S[a.key]).map(a => row(a, true)))) : null);
  };
  // live count on the Alerts tab button
  const badge = () => { try { const n = build().filter(a => !snz()[a.key]).length, crit = build().filter(a => a.sev === 'crit' && !snz()[a.key]).length;
    document.querySelectorAll('nav button, aside button, button').forEach(b => { const t = b.textContent.replace(/\s*[\(🔴].*$/, '').trim(); if (t === 'Alerts' && !b.closest('#app')) b.textContent = 'Alerts' + (n ? ' (' + n + ')' : '') + (crit ? ' 🔴' : ''); });
    document.title = (crit ? '(' + crit + '!) ' : '') + document.title.replace(/^\(\d+!\)\s*/, ''); } catch (e) { } };
  const app = document.getElementById('app'); if (app) new MutationObserver(badge).observe(app, { childList: true });
  badge();
})();
