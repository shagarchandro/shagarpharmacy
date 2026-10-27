/* Control Center v32 extras: Payments tab (methods on/off, wallet numbers, TrxID rule) and Insights tab
   (14-day revenue, payment mix, top products, unpaid orders, CSV). Loaded before center.js, which calls CCX(ctx). */
window.CCX = function (c) {
  'use strict';
  const { h, rj, wj, audit, ok, bad, field, inp, chk, tbl, tk } = c;
  const btn = c.btn;
  const SHOP = [['Cash on delivery', 'Cash on delivery'], ['Card on delivery', 'Card on delivery (rider carries a machine)'], ['bKash (demo)', 'bKash'], ['Nagad (demo)', 'Nagad'], ['Rocket (demo)', 'Rocket']];
  const POS = [['cash', 'Cash'], ['card', 'Card'], ['mobile', 'Mobile wallet']];
  const day = x => new Date(x).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  const css = document.head.appendChild(h('style', {}, '.cxbars{display:flex;align-items:flex-end;gap:4px;height:140px;margin:.6rem 0;overflow-x:auto}.cxbars div{flex:1;min-width:18px;background:var(--pri,#0a7d5a);border-radius:4px 4px 0 0;position:relative}.cxbars span{position:absolute;bottom:-1.3rem;left:50%;transform:translateX(-50%);font-size:.65rem;color:#667;white-space:nowrap}.cxlab{margin-bottom:1.6rem}.cxk{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.6rem;margin:.6rem 0}'));
  const panels = {};
  panels.payments = () => {
    const D = c.db(), s = D.settings, S = rj('pharmacy_settings', {}), off = s.payOff || [], num = s.payNum || {}, pOff = S.posPayOff || [];
    const f = h('form', {
      class: 'cc-form', onsubmit(e) {
        e.preventDefault(); const el = e.target.elements, o = SHOP.filter(([k]) => !el['s|' + k].checked).map(([k]) => k);
        if (o.length === SHOP.length) return bad('Keep at least one online payment method on');
        const po = POS.filter(([k]) => !el['p|' + k].checked).map(([k]) => k); if (po.includes('cash')) return bad('Cash must stay on in the POS');
        const ph = /^[0-9+ -]{0,16}$/; for (const n of ['bKash', 'Nagad', 'Rocket']) if (!ph.test(el['n|' + n].value.trim())) return bad(n + ' number looks wrong');
        s.payOff = o; s.payNum = { bKash: el['n|bKash'].value.trim(), Nagad: el['n|Nagad'].value.trim(), Rocket: el['n|Rocket'].value.trim() }; s.payNoRef = !el.reqRef.checked; c.save(D);
        const X = rj('pharmacy_settings', {}); X.posPayOff = po; X.posNoRef = !el.posReqRef.checked; wj('pharmacy_settings', X);
        audit('Changed payment settings'); ok('Payment settings saved');
      }
    },
      h('h3', {}, 'Online shop methods'), h('div', { class: 'cc-grid' }, SHOP.map(([k, l]) => h('div', { class: 'cc-card' }, chk('s|' + k, !off.includes(k), l)))),
      h('div', { class: 'two' }, field('bKash number (shown at checkout)', inp('n|bKash', num.bKash || '')), field('Nagad number', inp('n|Nagad', num.Nagad || ''))), field('Rocket number', inp('n|Rocket', num.Rocket || '')),
      chk('reqRef', !s.payNoRef, 'Customers must enter the wallet TrxID'),
      h('h3', {}, 'POS methods'), h('div', { class: 'cc-grid' }, POS.map(([k, l]) => h('div', { class: 'cc-card' }, chk('p|' + k, !pOff.includes(k), l)))),
      chk('posReqRef', !S.posNoRef, 'Staff must enter the TrxID / card slip number for Card & Mobile'),
      h('p', { class: 'muted' }, 'Demo only: numbers are shown to customers, but no real payment gateway is connected and TrxIDs are format-checked, not verified.'),
      h('button', { class: 'btn' }, 'Save payment settings'));
    return h('div', {}, h('h2', {}, '💳 Payments'), f);
  };
  panels.insights = () => {
    const D = c.db(), sales = rj('pharmacy_sales', []).filter(x => x && x.real && x.status !== 'Voided'), orders = (D.orders || []).filter(o => o.status !== 'Cancelled');
    const rec = [...sales.map(x => ({ d: day(x.at || x.date), t: +x.total || 0, p: (x.paymentMethod || 'cash'), items: x.items || [] })),
      ...orders.map(o => ({ d: day(o.at), t: +o.total || 0, p: (o.pay || 'Unknown').replace(/ \(demo.*\)/, ''), items: (o.items || []).map(i => ({ name: i.name, quantity: i.qty, price: i.price })) }))];
    const days = [...Array(14)].map((_, i) => day(Date.now() - (13 - i) * 864e5)), by = {}; rec.forEach(r => by[r.d] = (by[r.d] || 0) + r.t);
    const mx = Math.max(1, ...days.map(d => by[d] || 0)), tot = rec.reduce((a, r) => a + r.t, 0), t14 = days.reduce((a, d) => a + (by[d] || 0), 0);
    const pm = {}; rec.forEach(r => pm[r.p] = (pm[r.p] || 0) + r.t);
    const tp = {}; rec.forEach(r => r.items.forEach(i => tp[i.name] = (tp[i.name] || 0) + (+i.quantity || 0)));
    const top = Object.entries(tp).sort((a, b) => b[1] - a[1]).slice(0, 5), unpaid = orders.filter(o => !o.paid && o.status !== 'Delivered');
    const csv = () => { const q = v => '"' + String(v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"', b = new Blob(['﻿' + [['Date', 'Total', 'Payment']].concat(rec.map(r => [r.d, r.t, r.p])).map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' }), a = h('a', { href: URL.createObjectURL(b), download: 'all-sales.csv' }); document.body.append(a); a.click(); setTimeout(() => a.remove(), 500); audit('Exported all sales CSV'); };
    return h('div', {}, h('h2', {}, '📊 Insights'),
      h('div', { class: 'cxk' }, [['All-time revenue', tk(tot)], ['Last 14 days', tk(t14)], ['Transactions', rec.length], ['Unpaid online orders', unpaid.length]].map(([l, v]) => h('div', { class: 'cc-card' }, h('b', {}, v), h('br'), h('small', { class: 'muted' }, l)))),
      h('h3', {}, 'Revenue — last 14 days'), h('div', { class: 'cxbars cxlab', role: 'img', 'aria-label': 'Revenue per day, last 14 days' }, days.map(d => h('div', { title: d + ': ' + tk(by[d] || 0), style: 'height:' + Math.max(2, Math.round((by[d] || 0) / mx * 100)) + '%' }, h('span', {}, d.slice(8))))),
      h('h3', {}, 'Payment mix'), tbl(['Method', 'Revenue', 'Share'], Object.entries(pm).sort((a, b) => b[1] - a[1]).map(([k, v]) => h('tr', {}, h('td', {}, k), h('td', {}, tk(v)), h('td', {}, (tot ? Math.round(v / tot * 100) : 0) + '%'))), 'No sales yet'),
      h('h3', {}, 'Top products (units)'), tbl(['Product', 'Units'], top.map(([k, v]) => h('tr', {}, h('td', {}, k), h('td', {}, v))), 'No sales yet'),
      h('h3', {}, 'Unpaid online orders'), tbl(['Order', 'Customer', 'Method', 'Total', 'Status'], unpaid.map(o => h('tr', {}, h('td', {}, o.no), h('td', {}, o.customer), h('td', {}, o.pay || ''), h('td', {}, tk(o.total)), h('td', {}, o.status))), 'Nothing outstanding'),
      h('p', {}, c.btn('⬇ Export all sales (CSV)', csv, 'btn')));
  };

  panels.maint = () => {
    const keys = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i), v = localStorage.getItem(k) || ''; keys.push([k, (k.length + v.length) * 2]); }
    keys.sort((a, b) => b[1] - a[1]); const total = keys.reduce((a, x) => a + x[1], 0);
    const SAFE = { mc_recent: 'Recently viewed (shop)', mc_reviews: 'Product reviews', mc_later: 'Saved for later (shop)', pharmacy_held: 'Held POS bills', pharmacy_pos_draft: 'POS cart draft', pharmacy_loginlog: 'Login activity log', mc_lock: 'Login lockouts' };
    const clr = k => { if (!confirm('Clear "' + SAFE[k] + '"? This cannot be undone.')) return; localStorage.removeItem(k); audit('Cleared ' + k); ok('Cleared'); c.show('maint'); };
    // health checks
    const meds = rj('pharmacy_medicines', []), today = day(Date.now()), issues = [], seen = {};
    meds.forEach(m => { const b = String(m.barcode || '').trim(); if (b) { if (seen[b]) issues.push(['Duplicate barcode ' + b, m.name + ' / ' + seen[b]]); else seen[b] = m.name; }
      if (m.expiryDate && m.expiryDate < today && +m.stock > 0) issues.push(['Expired but in stock', m.name + ' (' + m.expiryDate + ', ' + m.stock + ')']);
      if (!(+m.sellingPrice > 0)) issues.push(['Missing selling price', m.name]); if (+m.stock < 0) issues.push(['Negative stock', m.name]);
      if (+m.costPrice > 0 && +m.sellingPrice > 0 && +m.sellingPrice < +m.costPrice) issues.push(['Selling below cost', m.name]); });
    const D = c.db(); (D.products || []).forEach(p => { if (!(p.price > 0)) issues.push(['Shop product has no price', p.name]); });
    const CFG = ['pharmacy_settings', 'pharmacy_roles', 'pharmacy_theme', 'mc_acc'];
    const exp = () => {
      const o = { v: 1, at: new Date().toISOString() }; CFG.forEach(k => { const v = rj(k, undefined); if (v !== undefined) o[k] = v; }); o.shop = { settings: D.settings, coupons: D.coupons };
      const b = new Blob([JSON.stringify(o, null, 1)], { type: 'application/json' }), a = h('a', { href: URL.createObjectURL(b), download: 'medicare-config-' + today + '.json' }); document.body.append(a); a.click(); setTimeout(() => a.remove(), 500); audit('Exported configuration');
    };
    const imp = e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return; if (f.size > 200000) return bad('File too large for a config file');
      f.text().then(t => {
        let o; try { o = JSON.parse(t); } catch (x) { return bad('Not a valid JSON file'); }
        if (!o || o.v !== 1 || typeof o !== 'object') return bad('This is not a MediCare config file');
        if (!confirm('Replace branding, rules, roles and shop settings with the ones in this file?')) return;
        CFG.forEach(k => { if (o[k] && typeof o[k] === 'object') wj(k, o[k]); });
        if (o.shop && typeof o.shop === 'object') { const d = c.db(); if (o.shop.settings && typeof o.shop.settings === 'object') d.settings = Object.assign(d.settings, o.shop.settings); if (Array.isArray(o.shop.coupons)) d.coupons = o.shop.coupons.filter(q => q && typeof q.code === 'string' && q.pct > 0 && q.pct <= 100).slice(0, 50); c.save(d); }
        audit('Imported configuration'); ok('Configuration imported — reload other pages to see it'); c.show('maint');
      });
    };
    return h('div', {}, h('h2', {}, '🛠 Maintenance'),
      h('h3', {}, 'Health check'), issues.length ? tbl(['Issue', 'Details'], issues.slice(0, 60).map(i => h('tr', {}, h('td', {}, i[0]), h('td', {}, i[1])))) : h('p', { class: 'ok' }, '✔ No problems found in medicines and shop products.'),
      h('h3', {}, 'Configuration backup'), h('p', { class: 'muted' }, 'Export branding, rules, roles, security and shop settings (not sales, customers or passwords) to move them to another browser/device.'),
      h('div', { class: 'row' }, c.btn('⬇ Export configuration', exp, 'btn'), h('label', { class: 'btn2', style: 'cursor:pointer' }, '⬆ Import configuration', h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: imp }))),
      h('h3', {}, 'Browser storage — ' + Math.round(total / 1024) + ' KB used (limit is about 5000 KB)'),
      tbl(['Key', 'Size', ''], keys.slice(0, 25).map(([k, n]) => h('tr', {}, h('td', {}, SAFE[k] ? SAFE[k] + ' (' + k + ')' : k), h('td', {}, (n / 1024).toFixed(1) + ' KB'), h('td', {}, SAFE[k] ? c.btn('Clear', () => clr(k)) : '')))));
  };

  panels.delivery = () => {
    const D = c.db(), s = D.settings, Z = s.zones || [];
    const f = h('form', { class: 'cc-form', onsubmit(e) {
      e.preventDefault(); const el = e.target.elements, nm = el.zn.value.trim(), fee = parseFloat(el.zf.value), eta = el.ze.value.trim().slice(0, 40);
      if (nm.length < 2 || nm.length > 30 || /[<>]/.test(nm)) return bad('Zone name must be 2–30 characters');
      if (isNaN(fee) || fee < 0 || fee > 2000) return bad('Fee must be 0–2000');
      if (Z.some(z => z.name.toLowerCase() === nm.toLowerCase())) return bad('That zone already exists'); if (Z.length >= 20) return bad('Maximum 20 zones');
      s.zones = Z.concat([{ name: nm, fee, eta }]); c.save(D); audit('Added delivery zone ' + nm); ok('Zone added'); c.show('delivery');
    } }, h('div', { class: 'two' }, field('Zone name', inp('zn', '', 'text', { placeholder: 'e.g. Dhanmondi / Mirpur' })), field('Delivery fee ৳', inp('zf', '', 'number', { min: 0, max: 2000, step: 1 }))), field('Delivery time shown to customers (optional)', inp('ze', '', 'text', { placeholder: 'e.g. 1–2 hours' })), h('button', { class: 'btn' }, 'Add zone'));
    return h('div', {}, h('h2', {}, '🚚 Delivery zones'), h('p', { class: 'muted' }, 'When at least one zone exists, customers choose a zone at checkout and its fee replaces the default Dhaka / outside-Dhaka fees (free-delivery and coupon rules still apply). Remove all zones to go back to the defaults.'),
      f, tbl(['Zone', 'Fee', 'Time', ''], Z.map((z, i) => h('tr', {}, h('td', {}, z.name), h('td', {}, tk(z.fee)), h('td', {}, z.eta || '—'), h('td', {}, c.btn('Remove', () => { if (!confirm('Remove zone "' + z.name + '"?')) return; s.zones = Z.filter((_, j) => j !== i); c.save(D); audit('Removed delivery zone ' + z.name); c.show('delivery'); })))), 'No zones — defaults (৳' + s.feeDhaka + ' Dhaka / ৳' + s.feeOut + ' outside) are used.'));
  };

  panels.shop = () => {
    const D = c.db(), s = D.settings, off = s.shopOff || [], F = s.featured || [];
    const SEC = [['offers', 'Offers cards under the banner'], ['featured', 'Featured products strip'], ['best', 'Best sellers strip'], ['recent', 'Recently viewed strip'], ['filters', 'Quick filters (In stock / No prescription / On offer)'], ['reviews', 'Product reviews & ratings'], ['eta', 'Delivery-time note on product page'], ['track', 'Guest order tracking box'], ['trust', 'Trust & testimonials section'], ['wish', 'Wishlist link'], ['ask', 'Ask pharmacist (link and page)']];
    const f = h('form', { class: 'cc-form', onsubmit(e) {
      e.preventDefault(); const el = e.target.elements;
      const mo = parseFloat(el.minOrder.value) || 0, fm = parseFloat(el.freeMin.value) || 0; if (mo < 0 || fm < 0 || mo > 1e6 || fm > 1e6) return bad('Amounts must be 0–1,000,000');
      Object.assign(s, { shopOpen: el.shopOpen.checked, notice: el.notice.value.trim().slice(0, 200), minOrder: mo, freeMin: fm,
        heroTitle: el.heroTitle.value.trim().slice(0, 80), heroSub: el.heroSub.value.trim().slice(0, 200), heroCoupon: el.heroCoupon.checked, footerNote: el.footerNote.value.trim().slice(0, 160) });
      s.shopOff = SEC.filter(([k]) => !el['sec|' + k].checked).map(([k]) => k);
      const feat = [], P = D.products || [];
      for (const p of P) { const d = parseFloat(el['d|' + p.id].value); if (!isNaN(d) && (d < 0 || d > 90)) return bad('Discount for "' + p.name + '" must be 0–90%'); }
      P.forEach(p => { p.hide = !el['v|' + p.id].checked; if (!p.hide && el['f|' + p.id].checked) feat.push(p.id); const d = parseFloat(el['d|' + p.id].value); if (isNaN(d) || d <= 0) delete p.disc; else p.disc = Math.round(d * 10) / 10; });
      if (feat.length > 12) return bad('Choose at most 12 featured products'); s.featured = feat;
      c.save(D); audit('Changed customer shop controls'); ok('Saved — the customer shop updates immediately'); c.show('shop');
    } },
      h('p', {}, h('a', { class: 'btn2', href: 'shop.html', target: '_blank', rel: 'noopener' }, '↗ Open customer shop'), ' ', h('span', { class: 'muted' }, 'Open it in another tab: it refreshes by itself when you save.')),
      h('h3', {}, 'Shop status & rules'),
      chk('shopOpen', s.shopOpen !== false, 'Shop is open for online orders'), field('Announcement banner (blank = none)', inp('notice', s.notice || '', 'text', { maxlength: 200 })),
      h('div', { class: 'two' }, field('Minimum order ৳ (0 = none)', inp('minOrder', s.minOrder || 0, 'number', { min: 0 })), field('Free delivery from ৳ (0 = off)', inp('freeMin', s.freeMin || 0, 'number', { min: 0 }))),
      h('h3', {}, 'Storefront text'),
      field('Home headline (blank = default)', inp('heroTitle', s.heroTitle || '', 'text', { maxlength: 80 })), field('Home sub-line (blank = default)', inp('heroSub', s.heroSub || '', 'text', { maxlength: 200 })),
      chk('heroCoupon', s.heroCoupon !== false, 'Mention the first coupon in the sub-line'), field('Footer note (shown on every shop page)', inp('footerNote', s.footerNote || '', 'text', { maxlength: 160 })),
      h('h3', {}, 'Sections shown to customers'), h('div', { class: 'cc-grid' }, SEC.map(([k, l]) => h('div', { class: 'cc-card' }, chk('sec|' + k, !off.includes(k), l)))),
      h('h3', {}, 'Products online'), h('p', { class: 'muted' }, 'Visible = sold on the shop. Featured = shown in the ⭐ strip. Discount % shows a strike-through price (blank = none). Prices, stock and prescription flags come from Medicines.'),
      tbl(['Product', 'Price', 'Visible', 'Featured', 'Discount %'], (D.products || []).map(p => h('tr', {}, h('td', {}, p.name), h('td', {}, tk(p.price)),
        h('td', {}, h('input', { type: 'checkbox', name: 'v|' + p.id, checked: p.hide ? null : 'checked', 'aria-label': 'Visible: ' + p.name })), h('td', {}, h('input', { type: 'checkbox', name: 'f|' + p.id, checked: F.includes(p.id) ? 'checked' : null, 'aria-label': 'Featured: ' + p.name })),
        h('td', {}, h('input', { type: 'number', name: 'd|' + p.id, min: 0, max: 90, step: 0.5, value: p.disc || '', style: 'width:5rem', 'aria-label': 'Discount % for ' + p.name })))), 'No products yet'),
      h('button', { class: 'btn' }, 'Save shop controls'));
    return h('div', {}, h('h2', {}, '🛍 Customer shop'), f);
  };
  /* ---- v48: Coupons, Checkup, Audit explorer ---- */
  const dh = x => new Date(x).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', hour12: false }).slice(0, 17);
  const csvDl = (name, rows) => { const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; const a = h('a', { download: name, href: URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' })) }); document.body.append(a); a.click(); a.remove(); };
  panels.coupons = () => {
    const D = c.db(), tdy = day(Date.now()), used = k => (D.orders || []).filter(o => o.coupon === k.code && o.status !== 'Cancelled');
    const status = k => k.off ? ['Paused', ''] : (k.expires && k.expires < tdy) ? ['Expired', 'bad'] : (k.limit > 0 && used(k).length >= k.limit) ? ['Used up', 'bad'] : ['Live', 'ok'];
    const af = h('form', { class: 'cc-form', onsubmit(e) {
      e.preventDefault(); const f = e.target.elements, code = f.code.value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ''), pct = +f.pct.value;
      if (!code || code.length > 16) return bad('Code: 1–16 letters/numbers');
      if (!(pct > 0 && pct <= 100)) return bad('Percent must be 1–100');
      if ((D.coupons || []).some(x => x.code === code)) return bad('That code already exists');
      const mn = +f.min.value || 0, mx = +f.max.value || 0, lim = Math.floor(+f.limit.value) || 0; if (mn < 0 || mx < 0 || lim < 0) return bad('Numbers cannot be negative');
      if (f.expires.value && f.expires.value < tdy) return bad('Expiry date is in the past');
      const k = { code, pct, min: mn }; if (mx) k.max = mx; if (lim) k.limit = lim; if (f.expires.value) k.expires = f.expires.value;
      D.coupons.push(k); c.save(D); audit('Added coupon ' + code); ok('Coupon ' + code + ' added'); c.show('coupons');
    } },
      h('div', { class: 'two' }, field('Code', inp('code', '', 'text', { maxlength: 16, placeholder: 'EID20' })), field('Percent off', inp('pct', '', 'number', { min: 1, max: 100 }))),
      h('div', { class: 'two' }, field('Minimum order ৳', inp('min', '', 'number', { min: 0 })), field('Max discount ৳ (blank = none)', inp('max', '', 'number', { min: 0 }))),
      h('div', { class: 'two' }, field('Expires on (blank = never)', inp('expires', '', 'date')), field('Usage limit (blank = unlimited)', inp('limit', '', 'number', { min: 1 }))),
      h('button', { class: 'btn' }, 'Add coupon'));
    const rows = (D.coupons || []).map(k => { const [st, cl] = status(k); return h('tr', {}, h('td', {}, h('b', {}, k.code)), h('td', {}, k.pct + '%' + (k.max ? ' (max ' + tk(k.max) + ')' : '')), h('td', {}, tk(k.min || 0)), h('td', {}, k.expires || '—'),
      h('td', {}, used(k).length + (k.limit ? ' / ' + k.limit : '')), h('td', { class: cl }, st),
      h('td', {}, c.btn(k.off ? 'Resume' : 'Pause', () => { k.off = !k.off; if (!k.off) delete k.off; c.save(D); audit((k.off ? 'Paused' : 'Resumed') + ' coupon ' + k.code); c.show('coupons'); }), ' ',
        c.btn('Delete', () => { if (!confirm('Delete coupon ' + k.code + '?')) return; D.coupons = D.coupons.filter(x => x !== k); c.save(D); audit('Deleted coupon ' + k.code); c.show('coupons'); }))); });
    const saved = (D.orders || []).filter(o => o.coupon && o.status !== 'Cancelled').length;
    return h('div', {}, h('h2', {}, '🎟 Coupons'), h('p', { class: 'muted' }, 'Rules are enforced in the customer shop at Apply and at checkout. Orders remember the coupon used (' + saved + ' so far).'),
      af, tbl(['Code', 'Off', 'Min order', 'Expires', 'Used', 'Status', ''], rows, 'No coupons yet'));
  };
  panels.checkup = () => {
    const D = c.db(), s = D.settings, S = rj('pharmacy_settings', {}), P = D.products || [], tdy = day(Date.now()), out = [];
    const add = (lvl, msg, tab, fix) => out.push({ lvl, msg, tab, fix });
    if (s.shopOpen === false) add('warn', 'The online shop is CLOSED — customers cannot order.', 'shop', 'Open it');
    if (!s.phone || !/\d{6,}/.test(s.phone)) add('warn', 'Shop phone number is missing or looks wrong (shown in the footer).', 'rules', 'Fix');
    if (!s.addr) add('warn', 'Shop address is empty.', 'rules', 'Fix');
    const offp = s.payOff || []; if (offp.length >= SHOP.length) add('bad', 'All online payment methods are off — checkout is impossible.', 'payments', 'Fix');
    else if (!offp.includes('bKash (demo)') && !(s.payNum || {}).bKash) add('warn', 'bKash is on but no bKash number is set.', 'payments', 'Fix');
    if (P.length && P.every(p => p.hide)) add('bad', 'Every product is hidden online — the shop is empty.', 'shop', 'Fix');
    const nostock = P.filter(p => !p.hide && typeof stock === "function" && stock(D, p.id) <= 0).length; if (nostock) add('info', nostock + ' visible product(s) are out of stock.', 'shop', 'Review');
    const bad0 = P.filter(p => !(p.price > 0)).length; if (bad0) add('bad', bad0 + ' product(s) have no valid price.', 'shop', 'Review');
    (D.coupons || []).forEach(k => { if (k.expires && k.expires < tdy && !k.off) add('info', 'Coupon ' + k.code + ' expired on ' + k.expires + '.', 'coupons', 'Manage'); });
    const pend = (D.orders || []).filter(o => o.status === 'Pending').length; if (pend) add('info', pend + ' order(s) are waiting for confirmation.', null);
    if (!(s.zones || []).length && !(s.feeDhaka >= 0)) add('info', 'No delivery fee configured.', 'delivery', 'Fix');
    const acc = D.users || []; if (acc.some(u => u.password === 'admin123' || u.pass === 'admin123' || u.pin === '1234')) add('warn', 'A demo account still uses its default password.', 'accounts', 'Change');
    const lbv = localStorage.getItem('pharmacy_lastbackup') || localStorage.getItem('mc_lastbackup') || '', lb = +lbv > 1e11 ? +lbv : (Date.parse(lbv) || 0); if (!lb) add('info', 'No backup has been taken on this browser yet.', 'data', 'Back up'); else if (Date.now() - lb > 7 * 864e5) add('info', 'Last backup is more than 7 days old.', 'data', 'Back up');
    if (S.posPayOff && S.posPayOff.includes('cash')) add('bad', 'Cash is disabled in POS.', 'rules', 'Fix');
    const ic = { bad: '⛔', warn: '⚠️', info: 'ℹ️' }, score = Math.max(0, 100 - out.filter(x => x.lvl === 'bad').length * 25 - out.filter(x => x.lvl === 'warn').length * 10 - out.filter(x => x.lvl === 'info').length * 3);
    return h('div', {}, h('h2', {}, '🩺 Checkup'), h('p', {}, h('b', { class: score >= 90 ? 'ok' : score >= 60 ? '' : 'bad', style: 'font-size:1.6rem' }, score + '/100'), ' ', h('span', { class: 'muted' }, out.length ? out.length + ' thing(s) to look at' : 'Everything looks good')),
      out.length ? h('div', { class: 'cc-grid' }, out.map(x => h('div', { class: 'cc-card' }, h('p', {}, ic[x.lvl] + ' ' + x.msg), x.tab ? c.btn(x.fix, () => c.show(x.tab)) : null))) : h('p', { class: 'ok' }, '✅ No problems found.'));
  };
  panels.audit = () => {
    const all = rj('pharmacy_audit', []).slice().reverse(); let q = '', who = '';
    const box = h('div', {}), sel = h('select', { 'aria-label': 'Filter by person', onchange() { who = sel.value; draw(); } }, h('option', { value: '' }, 'Everyone'), ...[...new Set(all.map(a => a.by))].map(w => h('option', { value: w }, w)));
    const draw = () => { const r = all.filter(a => (!who || a.by === who) && (!q || (a.msg + ' ' + a.by).toLowerCase().includes(q))); box.replaceChildren(h('p', { class: 'muted' }, r.length + ' of ' + all.length + ' entries (the log keeps the latest 300)'), tbl(['When', 'Who', 'What'], r.slice(0, 200).map(a => h('tr', {}, h('td', {}, dh(a.at)), h('td', {}, a.by), h('td', {}, a.msg))), 'Nothing matches.')); };
    draw();
    return h('div', {}, h('h2', {}, '📜 Audit explorer'), h('div', { class: 'row' }, h('input', { type: 'search', placeholder: 'Search changes…', 'aria-label': 'Search audit', oninput(e) { q = e.target.value.trim().toLowerCase(); draw(); } }), sel,
      c.btn('⬇ CSV', () => csvDl('audit-' + day(Date.now()) + '.csv', [['When', 'Who', 'What']].concat(all.map(a => [dh(a.at), a.by, a.msg]))))), box);
  };
  /* ---- v60: sign-in tab (admin PIN, Ops personal PINs, recent sign-ins) ---- */
  function pinBad(p) { if (!/^\d{4,8}$/.test(p)) return 'PIN must be 4–8 digits'; if (/^(\d)\1+$/.test(p)) return 'PIN is too simple (repeated digits)'; if ('01234567890123456789'.indexOf(p) > -1 || '98765432109876543210'.indexOf(p) > -1) return 'PIN is too simple (sequence)'; return ''; }
  panels.signin = () => {
    const S = rj('pharmacy_settings', {}), D = c.db(), pins = S.opsPins || {}, L = rj('pharmacy_loginlog', []).slice().reverse();
    const hashP = p => (window.MCPW ? MCPW.hash(p) : Promise.reject(new Error('Password helper missing')));
    const adminForm = h('form', { class: 'cc-form', onsubmit(e) {
      e.preventDefault(); const p = e.target.elements.pin.value.trim(), p2 = e.target.elements.pin2.value.trim(); const m = pinBad(p); if (m) return bad(m); if (p !== p2) return bad('The two PINs do not match');
      hashP(p).then(hs => { const x = rj('pharmacy_settings', {}); x.adminPin = hs; wj('pharmacy_settings', x); audit('Set admin sign-in PIN'); ok('Admin PIN saved — the staff login now asks Admin for it'); c.show('signin'); }, err => bad(err.message));
    } }, h('p', { class: 'muted' }, S.adminPin ? '✅ Admin PIN is ON: after the password, Admin must enter this PIN (second step).' : 'Admin PIN is OFF. Turn it on for a second step at the staff login (role Admin only).'),
      h('div', { class: 'two' }, field('New admin PIN (4–8 digits)', inp('pin', '', 'password', { inputmode: 'numeric', maxlength: 8, autocomplete: 'new-password' })), field('Repeat PIN', inp('pin2', '', 'password', { inputmode: 'numeric', maxlength: 8, autocomplete: 'new-password' }))),
      h('div', { class: 'row' }, h('button', { class: 'btn' }, S.adminPin ? 'Change PIN' : 'Turn on admin PIN'), S.adminPin ? btn('Turn off', () => { if (!confirm('Turn off the admin PIN step?')) return; const x = rj('pharmacy_settings', {}); delete x.adminPin; wj('pharmacy_settings', x); audit('Turned off admin PIN'); ok('Admin PIN turned off'); c.show('signin'); }) : null));
    const opsRows = (D.users || []).map(u => { const inpEl = h('input', { type: 'password', inputmode: 'numeric', maxlength: 8, placeholder: pins[u.id] ? 'new PIN' : 'set PIN', 'aria-label': 'PIN for ' + u.name, style: 'width:7rem', autocomplete: 'new-password' });
      return h('tr', {}, h('td', {}, u.name), h('td', {}, u.role), h('td', {}, pins[u.id] ? '🔑 PIN set' : 'demo code'), h('td', {}, inpEl, ' ', btn(pins[u.id] ? 'Change' : 'Set', () => { const m = pinBad(inpEl.value.trim()); if (m) return bad(m); hashP(inpEl.value.trim()).then(hs => { const x = rj('pharmacy_settings', {}); x.opsPins = Object.assign({}, x.opsPins, { [u.id]: hs }); wj('pharmacy_settings', x); audit('Set Ops PIN for ' + u.name); ok('PIN saved for ' + u.name); c.show('signin'); }, err => bad(err.message)); }), pins[u.id] ? [' ', btn('Remove', () => { const x = rj('pharmacy_settings', {}); if (x.opsPins) delete x.opsPins[u.id]; wj('pharmacy_settings', x); audit('Removed Ops PIN for ' + u.name); ok('PIN removed'); c.show('signin'); })] : null)); });
    const fails = L.filter(x => !x.ok).length;
    return h('div', {}, h('h2', {}, '🔑 Sign-in'), h('div', { class: 'cc-two' }, h('div', { class: 'cc-card' }, h('h3', {}, 'Admin PIN (second step)'), adminForm),
      h('div', { class: 'cc-card' }, h('h3', {}, 'Operations Panel PINs'), h('p', { class: 'muted' }, 'A user with a PIN signs in to the Ops Panel with it; others use the shared demo code. PINs are stored hashed in this browser.'), tbl(['User', 'Role', 'Sign-in', ''], opsRows, 'No Ops users'))),
      h('h3', {}, 'Recent sign-ins (' + L.length + ' · ' + fails + ' failed)'), tbl(['When', 'Who', 'Where', 'Result'], L.slice(0, 40).map(x => h('tr', {}, h('td', {}, dh(x.at)), h('td', {}, x.email || '—'), h('td', {}, x.scope === 'ops' ? 'Ops Panel' : 'Staff login · ' + (x.role || '')), h('td', { class: x.ok ? 'ok' : 'bad' }, x.ok ? '✔ success' : '✖ failed'))), 'No sign-ins recorded yet.'),
      h('div', { class: 'row' }, btn('⬇ CSV', () => csvDl('signins-' + day(Date.now()) + '.csv', [['When', 'Who', 'Where', 'Result']].concat(L.map(x => [dh(x.at), x.email || '', x.scope === 'ops' ? 'Ops' : 'Staff ' + (x.role || ''), x.ok ? 'success' : 'failed'])))), btn('Open login security settings', () => c.show('security'))));
  };
  return { tabs: [['checkup', '🩺 Checkup'], ['shop', '🛍 Customer shop'], ['coupons', '🎟 Coupons'], ['signin', '🔑 Sign-in'], ['payments', '💳 Payments'], ['delivery', '🚚 Delivery'], ['insights', '📊 Insights'], ['audit', '📜 Audit'], ['maint', '🛠 Maintenance']], panels };
};
