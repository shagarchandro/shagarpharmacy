/* Control Center v32 extras: Payments tab (methods on/off, wallet numbers, TrxID rule) and Insights tab
   (14-day revenue, payment mix, top products, unpaid orders, CSV). Loaded before center.js, which calls CCX(ctx). */
window.CCX = function (c) {
  'use strict';
  const { h, rj, wj, audit, ok, bad, field, inp, chk, tbl, tk } = c;
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
    const D = c.db(), sales = rj('pharmacy_sales', []).filter(x => x && x.real), orders = (D.orders || []).filter(o => o.status !== 'Cancelled');
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
  return { tabs: [['shop', '🛍 Customer shop'], ['payments', '💳 Payments'], ['delivery', '🚚 Delivery'], ['insights', '📊 Insights'], ['maint', '🛠 Maintenance']], panels };
};
