/* Ops Panel v42: Notifications become an inbox — filters, mark-read per message, and written replies
   to customer questions/contact messages (shown to the customer in the shop under "Your recent messages"). */
(function () {
  'use strict';
  let F = 'all';
  const kindOf = n => n.kind === 'ask' ? 'q' : /^Contact \[/.test(n.msg) ? 'q' : /order/i.test(n.msg) ? 'o' : 'x';
  const canReply = () => ['Owner', 'Pharmacist'].includes(R);
  const n0 = V.notes;
  V.notes = () => {
    const r = n0(), L = (D.notes || []).slice().reverse(), body = r.querySelector('tbody'); if (!body) return r;
    const rows = [...body.rows].filter(x => !x.querySelector('td.empty'));
    rows.forEach((tr, i) => {
      const n = L[i]; if (!n || !tr.cells[1]) return; const k = kindOf(n); tr.dataset.k = k + (n.read ? '' : 'u'); const td = tr.cells[1];
      if (n.reply) td.append(h('div', { class: 'ok' }, '↩ ' + n.reply.text + ' (' + n.reply.by + ')'));
      const bar = h('div', { class: 'row' });
      if (!n.read) bar.append(h('button', { class: 'mini', type: 'button', onclick() { n.read = true; save(D); go(); } }, 'Mark read'));
      if (k === 'q' && canReply() && !n.reply) {
        const inp = h('input', { placeholder: 'Write a reply…', maxlength: 300, 'aria-label': 'Reply to customer', style: 'flex:1;min-width:140px' });
        bar.append(inp, h('button', { class: 'mini', type: 'button', onclick() { const t = inp.value.trim(); if (t.length < 2) return toast('Write a reply first', 1); n.reply = { text: t.slice(0, 300), by: R, at: new Date().toISOString() }; n.read = true; save(D); toast('Reply saved — the customer sees it in the shop'); go(); } }, 'Reply'));
      }
      if (bar.children.length) td.append(bar);
    });
    const chips = [['all', 'All'], ['u', 'Unread'], ['q', 'Questions'], ['o', 'Orders']].map(([k, l]) => {
      const cnt = k === 'all' ? rows.length : rows.filter(t => k === 'u' ? /u$/.test(t.dataset.k) : t.dataset.k.startsWith(k)).length;
      return h('button', { class: F === k ? 'on' : '', type: 'button', onclick() { F = k; go(); } }, l + ' (' + cnt + ')');
    });
    rows.forEach(t => { const k = t.dataset.k || ''; t.style.display = F === 'all' || (F === 'u' ? /u$/.test(k) : k.startsWith(F)) ? '' : 'none'; });
    r.prepend(h('div', { class: 'chips' }, chips));
    return r;
  };
})();
