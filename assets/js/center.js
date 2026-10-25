/* MediCare Control Center: one place for the admin to customise and control everything.
   Works on both data stores: legacy `pharmacy_*` keys and the shop/ops `mc_db`. */
(function () {
  'use strict';
  const app = document.getElementById('app'), tabsEl = document.getElementById('tabs');
  const rj = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const wj = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const legacyUser = () => rj('user', null) || (() => { try { return JSON.parse(sessionStorage.getItem('user')); } catch (e) { return null; } })();
  const isLegacyAdmin = () => { const u = legacyUser(); return !!(u && u.role === 'admin' && (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'))); };
  const isOwner = () => sessionStorage.getItem('mc_role') === 'Owner';
  const who = () => isLegacyAdmin() ? legacyUser().name : (isOwner() ? 'Owner' : '?');
  const sha = s => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''));
  const tk = n => '৳' + Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
  function audit(msg) { const a = rj('pharmacy_audit', []); a.push({ at: new Date().toISOString(), by: who(), msg }); wj('pharmacy_audit', a.slice(-300)); }
  const ok = m => toast(m);
  const bad = m => toast(m, 1);
  const field = (label, ctl, hint) => h('label', {}, label, ctl, hint && h('small', { class: 'muted' }, hint));
  const inp = (name, val, type, extra) => h('input', Object.assign({ name, type: type || 'text', value: val == null ? '' : val }, extra || {}));
  const chk = (name, on, label) => h('label', { class: 'cc-chk' }, h('input', { type: 'checkbox', name, checked: on ? 'checked' : null }), label);
  const tbl = (head, rows, empty) => h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, head.map(x => h('th', {}, x)))), h('tbody', {}, rows.length ? rows : h('tr', {}, h('td', { colspan: head.length, class: 'empty' }, empty || 'Nothing here yet.')))));
  const btn = (label, fn, cls) => h('button', { class: cls || 'mini', type: 'button', onclick: fn }, label);
  function shop() { return db(); }          // mc_db (seeds itself)
  const DEF_PAGES = [['dashboard', 'Dashboard'], ['medicines', 'Medicines'], ['customers', 'Customers'], ['sales', 'POS Sales'], ['purchases', 'Purchases'], ['suppliers', 'Suppliers'], ['prescriptions', 'Prescriptions'], ['reports', 'Reports']];
  const FIXED_FULL = ['dashboard'], ONOFF = ['sales', 'reports'];
  const DEF_LEVELS = {
    pharmacist: { dashboard: 'full', medicines: 'full', customers: 'full', sales: 'full', purchases: 'none', suppliers: 'none', prescriptions: 'full', reports: 'full' },
    staff: { dashboard: 'full', medicines: 'view', customers: 'view', sales: 'full', purchases: 'none', suppliers: 'none', prescriptions: 'view', reports: 'none' }
  };
  const DEF_META = { pharmacist: { maxDisc: 100, rx: true }, staff: { maxDisc: 10, rx: false } };
  const OPS_TABS = [['rx', 'Prescription review'], ['alerts', 'Alerts'], ['dash', 'Dashboard'], ['products', 'Products'], ['inv', 'Inventory'], ['pos', 'POS'], ['orders', 'Orders'], ['returns', 'Returns & refunds'], ['purchases', 'Purchases'], ['suppliers', 'Suppliers'], ['customers', 'Customers'], ['expenses', 'Expenses & cashbook'], ['delivery', 'Delivery'], ['reports', 'Reports'], ['notes', 'Notifications'], ['data', 'Data'], ['settings', 'Settings']];
  const OPS_DEF = { Pharmacist: ['rx', 'alerts', 'dash', 'orders', 'returns', 'notes'], Cashier: ['pos', 'orders', 'expenses'], 'Inventory Manager': ['alerts', 'dash', 'products', 'inv', 'purchases', 'suppliers', 'notes'], 'Delivery Staff': ['orders', 'delivery'] };
  const DEFAULT_ACCTS = [{ name: 'Admin User', email: 'admin@medicare.com', role: 'admin', def: true }, { name: 'John Pharmacist', email: 'pharmacist@medicare.com', role: 'pharmacist', def: true }, { name: 'Staff Member', email: 'staff@medicare.com', role: 'staff', def: true }];
  function roleDefs() {
    const r = rj('pharmacy_roles', {}), out = {};
    ['pharmacist', 'staff'].forEach(k => { out[k] = Object.assign({ label: k[0].toUpperCase() + k.slice(1), custom: false }, DEF_META[k], { level: Object.assign({}, DEF_LEVELS[k]) }, r[k] || {}); if (r[k] && r[k].level) out[k].level = Object.assign({}, DEF_LEVELS[k], r[k].level); });
    Object.keys(r).forEach(k => { if (!out[k]) out[k] = Object.assign({ label: k, maxDisc: 10, rx: false, level: {} }, r[k], { custom: true }); });
    return out;
  }

  // ---------------- pages ----------------
  const P = {};

  P.overview = () => {
    const med = rj('pharmacy_medicines', []), cus = rj('pharmacy_customers', []), sup = rj('pharmacy_suppliers', []), pur = rj('pharmacy_purchases', []), rx = rj('pharmacy_prescriptions', []);
    const sales = rj('pharmacy_sales', []).filter(x => x.real && x.status !== 'Voided'), D = shop(), today = new Date(Date.now() + 216e5).toISOString().slice(0, 10);
    const exp = med.filter(m => m.expiryDate && m.expiryDate < today).length, low = med.filter(m => +m.stock <= +(m.minStock || 0)).length;
    const rxp = rx.filter(x => x.status === 'pending' || x.status === 'partial').length, rxo = D.orders.filter(o => o.status === 'Prescription Review').length;
    const last = localStorage.getItem('pharmacy_lastbackup') || localStorage.getItem('mc_lastbackup'), days = last ? Math.floor((Date.now() - new Date(last)) / 864e5) : null;
    const st = (a, b, href) => h('a', { class: 'cc-card cc-stat', href: href || '#', style: 'text-decoration:none;color:inherit' }, h('b', {}, a), h('span', {}, b));
    const alerts = [];
    if (exp) alerts.push(['bad', exp + ' expired medicine batch(es)', 'medicines.html']);
    if (low) alerts.push(['warn', low + ' medicine(s) at or below minimum stock', 'medicines.html']);
    if (rxp + rxo) alerts.push(['warn', (rxp + rxo) + ' prescription(s) waiting (' + rxp + ' counter, ' + rxo + ' online)', 'prescriptions.html']);
    if (days == null || days > 7) alerts.push(['bad', last ? 'Last backup was ' + days + ' days ago' : 'No backup has been taken yet', 'backup.html']);
    return h('div', {},
      h('h2', {}, 'Overview'),
      h('div', { class: 'cc-grid' },
        st(med.length, 'Medicines', 'medicines.html'), st(cus.length, 'Customers', 'customers.html'), st(sup.length, 'Suppliers', 'suppliers.html'), st(pur.length, 'Purchase invoices', 'purchases.html'),
        st(rx.length, 'Prescriptions', 'prescriptions.html'), st(sales.length, 'POS sales (' + tk(sales.reduce((a, x) => a + x.total, 0)) + ')', 'sales.html'),
        st(D.products.length, 'Shop products', 'shop.html'), st(D.orders.length, 'Online orders', 'admin/index.html#orders'), st(D.users.length + rj('pharmacy_accounts', []).length + 3, 'User accounts', '#')),
      h('h2', {}, 'Needs attention'),
      alerts.length ? h('div', {}, alerts.map(([c, m, href]) => h('p', {}, h('span', { class: 'pill ' + c }, c === 'bad' ? 'Action' : 'Check'), ' ', h('a', { href }, m)))) : h('p', { class: 'ok' }, '✔ Everything looks fine.'),
      h('h2', {}, 'Quick actions'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick() { const r = mcSync(); r.ok ? ok('Synced: ' + r.upserted + ' product(s), ' + r.applied + ' online order(s) applied') : bad(r.msgs[0] || 'Sync failed'); audit('Manual sync'); show('overview'); } }, '🔄 Sync shop & stock now'),
        h('a', { class: 'btn2', href: 'backup.html' }, '💾 Backup / Restore'), h('a', { class: 'btn2', href: 'admin/login.html' }, '⚙️ Ops Panel'), h('a', { class: 'btn2', href: 'shop.html' }, '🛒 Shop')),
      h('h2', {}, 'Where to manage what'),
      tbl(['Area', 'Where', 'What you can do'], [
        ['Branding, colours, logo', 'Control Center → Branding', 'Name, tagline, colours and logo on every page'],
        ['Store, tax, receipts, shop rules', 'Control Center → Rules', 'VAT %, receipt note, open/closed, free delivery, fees, coupons'],
        ['Who can do what', 'Control Center → Roles', 'Page access, view/edit/delete, discount limit, Rx rights, Ops tabs'],
        ['People', 'Control Center → Accounts', 'Create / disable accounts, reset passwords (dashboard and Ops)'],
        ['Online catalogue & stock', 'Control Center → Shop sync', 'Publish medicines to the shop; POS and shop share stock'],
        ['Day-to-day records', 'Medicines, Customers, Suppliers, Purchases, Prescriptions', 'Add / edit / delete (module pages)'],
        ['Online orders, delivery, returns', 'Ops Panel', 'Order status, Rx review, delivery queue']
      ].map(r => h('tr', {}, r.map(c => h('td', {}, c)))))
    );
  };

  P.brand = () => {
    const T = Object.assign({ brand: 'MediCare Pharmacy', tagline: 'Your trusted pharmacy', c1: '#667eea', c2: '#764ba2', logo: '' }, rj('pharmacy_theme', {}));
    let logo = T.logo || '';
    const prev = h('div', { class: 'cc-prev' }), pset = () => { const f = form.elements; prev.style.background = `linear-gradient(135deg,${f.c1.value},${f.c2.value})`; prev.replaceChildren(...(logo ? [h('img', { src: logo, alt: '' })] : []), h('span', {}, f.brand.value || 'Brand'), h('small', { style: 'font-weight:400;margin-left:auto' }, f.tagline.value)); };
    const form = h('form', {
      class: 'cc-form', oninput: pset, onsubmit(e) {
        e.preventDefault(); const f = e.target.elements;
        if (f.brand.value.trim().length < 2) return bad('Enter a brand name');
        const t = { brand: f.brand.value.trim().slice(0, 40), tagline: f.tagline.value.trim().slice(0, 80), c1: f.c1.value, c2: f.c2.value, logo };
        wj('pharmacy_theme', t);
        const S = rj('pharmacy_settings', {}); S.store = t.brand; wj('pharmacy_settings', S);
        const D = shop(); D.settings.store = t.brand; save(D); audit('Changed branding'); ok('Branding saved. It applies on every page.'); setTimeout(() => location.reload(), 600);
      }
    },
      h('div', { class: 'two' }, field('Brand / pharmacy name', inp('brand', T.brand)), field('Tagline', inp('tagline', T.tagline))),
      h('div', { class: 'two' }, field('Primary colour', inp('c1', T.c1, 'color')), field('Second colour', inp('c2', T.c2, 'color'))),
      field('Logo (PNG/JPG, shown small; stored in this browser)', h('input', {
        type: 'file', accept: 'image/*', onchange(e) {
          const f = e.target.files[0]; if (!f) return; if (f.size > 3e6) return bad('Image must be under 3 MB');
          const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'), k = Math.min(1, 128 / Math.max(im.width, im.height)); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); logo = c.toDataURL('image/png'); pset(); }; im.onerror = () => bad('Not a valid image'); im.src = r.result; }; r.readAsDataURL(f);
        }
      })),
      prev, h('div', { class: 'row' }, h('button', { class: 'btn' }, 'Save branding'), btn('Remove logo', () => { logo = ''; pset(); }, 'btn2'), btn('Reset to default', () => { if (!confirm('Reset branding to default?')) return; localStorage.removeItem('pharmacy_theme'); audit('Reset branding'); location.reload(); }, 'btn2')));
    setTimeout(pset, 0);
    return h('div', {}, h('h2', {}, 'Branding & theme'), h('p', { class: 'muted' }, 'Name, colours and logo are applied to the shop, Ops Panel, dashboard pages, login and landing page.'), form);
  };

  P.rules = () => {
    const S = rj('pharmacy_settings', {}), D = shop(), s = D.settings;
    const f1 = h('form', {
      class: 'cc-form', onsubmit(e) {
        e.preventDefault(); const f = e.target.elements, tax = parseFloat(f.taxPct.value), low = parseInt(f.lowDefault.value, 10);
        if (isNaN(tax) || tax < 0 || tax > 50) return bad('Tax must be 0–50%');
        Object.assign(S, { store: S.store || (rj('pharmacy_theme', {}).brand) || 'MediCare Pharmacy', phone: f.phone.value.trim(), address: f.address.value.trim(), email: f.email.value.trim(), taxPct: tax, lowDefault: isNaN(low) ? 20 : low, receiptNote: f.receiptNote.value.trim().slice(0, 120), rxEnforce: f.rxEnforce.checked, idleMin: Math.max(0, parseInt(f.idleMin.value, 10) || 0) });
        wj('pharmacy_settings', S); audit('Changed POS & store rules'); ok('POS & store rules saved');
      }
    },
      h('div', { class: 'two' }, field('Phone', inp('phone', S.phone || '+8801700000000')), field('Email', inp('email', S.email || 'info@medicare.com'))),
      field('Address', inp('address', S.address || 'Dhanmondi, Dhaka')),
      h('div', { class: 'two' }, field('VAT / tax % on POS', inp('taxPct', S.taxPct == null ? 10 : S.taxPct, 'number', { min: 0, max: 50, step: 0.5 })), field('Low-stock default', inp('lowDefault', S.lowDefault == null ? 20 : S.lowDefault, 'number', { min: 0 }))),
      field('স্বয়ংক্রিয় সাইন-আউট (মিনিট, ০ = বন্ধ)', inp('idleMin', S.idleMin == null ? 30 : S.idleMin, 'number', { min: 0, max: 600 })),
      field('Receipt footer message', inp('receiptNote', S.receiptNote || '🙏 Thank you for shopping with us!')),
      chk('rxEnforce', S.rxEnforce !== false, 'Require an authorised role + prescription reference to sell Rx medicines'),
      h('button', { class: 'btn' }, 'Save POS & store rules'));
    const f2 = h('form', {
      class: 'cc-form', onsubmit(e) {
        e.preventDefault(); const f = e.target.elements, n = k => +f[k].value;
        if (![n('feeDhaka'), n('feeOut'), n('freeMin'), n('minOrder'), n('expiryDays')].every(x => x >= 0)) return bad('Numbers must be 0 or more');
        if (!/^[A-Za-z0-9-]{2,8}$/.test(f.invoice.value)) return bad('Invoice prefix: 2–8 letters/numbers');
        Object.assign(s, { shopOpen: f.shopOpen.checked, notice: f.notice.value.trim().slice(0, 200), feeDhaka: n('feeDhaka'), feeOut: n('feeOut'), freeMin: n('freeMin'), minOrder: n('minOrder'), expiryDays: n('expiryDays'), invoice: f.invoice.value, hours: f.hours.value.trim(), phone: f.phone.value.trim(), addr: f.addr.value.trim() });
        save(D); audit('Changed shop rules'); ok('Shop rules saved');
      }
    },
      chk('shopOpen', s.shopOpen !== false, 'Accept online orders (untick to close the shop)'),
      field('Announcement banner', inp('notice', s.notice || '')),
      h('div', { class: 'two' }, field('Delivery fee: Dhaka ৳', inp('feeDhaka', s.feeDhaka, 'number', { min: 0 })), field('Delivery fee: outside ৳', inp('feeOut', s.feeOut, 'number', { min: 0 }))),
      h('div', { class: 'two' }, field('Free delivery from ৳ (0 = off)', inp('freeMin', s.freeMin || 0, 'number', { min: 0 })), field('Minimum order ৳ (0 = none)', inp('minOrder', s.minOrder || 0, 'number', { min: 0 }))),
      h('div', { class: 'two' }, field('Expiry alert window (days)', inp('expiryDays', s.expiryDays, 'number', { min: 0 })), field('Online invoice prefix', inp('invoice', s.invoice))),
      h('div', { class: 'two' }, field('Shop phone', inp('phone', s.phone || '')), field('Opening hours', inp('hours', s.hours || ''))),
      field('Shop address', inp('addr', s.addr || '')), h('button', { class: 'btn' }, 'Save shop rules'));
    const cf = h('form', {
      class: 'row', onsubmit(e) {
        e.preventDefault(); const f = e.target.elements, c = f.code.value.trim().toUpperCase();
        if (!c || !(+f.pct.value > 0 && +f.pct.value <= 100) || D.coupons.some(x => x.code === c)) return bad('Unique code and 1–100% required');
        D.coupons.push({ code: c, pct: +f.pct.value, min: +f.min.value || 0 }); save(D); audit('Added coupon ' + c); show('rules');
      }
    }, inp('code', '', 'text', { placeholder: 'CODE', 'aria-label': 'Coupon code' }), inp('pct', '', 'number', { placeholder: '% off', min: 1, max: 100 }), inp('min', '', 'number', { placeholder: 'Min order ৳', min: 0 }), h('button', { class: 'btn' }, 'Add coupon'));
    return h('div', {}, h('h2', {}, 'Rules & settings'), h('div', { class: 'cc-two' }, h('div', { class: 'cc-card' }, h('h3', {}, '🧾 POS & store'), f1), h('div', { class: 'cc-card' }, h('h3', {}, '🛒 Online shop'), f2)),
      h('h2', {}, 'Coupons'), cf, tbl(['Code', 'Off', 'Minimum', ''], D.coupons.map(c => h('tr', {}, h('td', {}, c.code), h('td', {}, c.pct + '%'), h('td', {}, tk(c.min)), h('td', {}, btn('Delete', () => { if (!confirm('Delete coupon ' + c.code + '?')) return; D.coupons = D.coupons.filter(x => x !== c); save(D); audit('Deleted coupon ' + c.code); show('rules'); }))))));
  };

  P.roles = () => {
    const R = roleDefs(), keys = Object.keys(R);
    let cur = P._role && R[P._role] ? P._role : keys[0];
    const sel = h('select', { 'aria-label': 'Role', onchange(e) { P._role = e.target.value; show('roles'); } }, keys.map(k => h('option', { value: k, selected: k === cur ? 'selected' : null }, R[k].label + (R[k].custom ? ' (custom)' : ''))));
    const r = R[cur], form = h('form', {
      class: 'cc-form', onsubmit(e) {
        e.preventDefault(); const f = e.target.elements, md = parseFloat(f.maxDisc.value); if (isNaN(md) || md < 0 || md > 100) return bad('Discount limit must be 0–100%');
        const level = {}; DEF_PAGES.forEach(([k]) => { level[k] = FIXED_FULL.includes(k) ? 'full' : f['lv_' + k].value; });
        const all = rj('pharmacy_roles', {}); all[cur] = { label: r.label, custom: r.custom, maxDisc: md, rx: f.rx.checked, level }; wj('pharmacy_roles', all); audit('Changed role ' + cur); ok('Role saved. Applies on the next page load for signed-in users.'); show('roles');
      }
    },
      h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, ['Page', 'Access'].map(x => h('th', {}, x)))), h('tbody', {}, DEF_PAGES.map(([k, l]) => h('tr', {}, h('td', {}, l), h('td', {}, FIXED_FULL.includes(k) ? 'Always on' : h('select', { name: 'lv_' + k }, (ONOFF.includes(k) ? [['none', 'No access'], ['full', 'Full']] : [['none', 'No access'], ['view', 'View only'], ['edit', 'View + add/edit'], ['full', 'Full (incl. delete)']]).map(([v, t]) => h('option', { value: v, selected: ((r.level[k] === 'edit' && ONOFF.includes(k) ? 'full' : r.level[k]) || 'none') === v ? 'selected' : null }, t))))))))),
      h('div', { class: 'two' }, field('Max discount in POS (%)', inp('maxDisc', r.maxDisc, 'number', { min: 0, max: 100 })), h('div', {}, chk('rx', r.rx, 'May sell prescription (Rx) medicines'))),
      h('div', { class: 'row' }, h('button', { class: 'btn' }, 'Save role'), r.custom && btn('Delete role', () => { const users = rj('pharmacy_accounts', []); if (users.some(u => u.role === cur)) return bad('Some accounts still use this role'); if (!confirm('Delete role ' + r.label + '?')) return; const all = rj('pharmacy_roles', {}); delete all[cur]; wj('pharmacy_roles', all); audit('Deleted role ' + cur); P._role = null; show('roles'); }, 'btn2'),
        !r.custom && btn('Reset to defaults', () => { if (!confirm('Reset ' + r.label + ' to defaults?')) return; const all = rj('pharmacy_roles', {}); delete all[cur]; wj('pharmacy_roles', all); audit('Reset role ' + cur); show('roles'); }, 'btn2')));
    const addRole = h('form', {
      class: 'row', onsubmit(e) {
        e.preventDefault(); const name = e.target.elements.rname.value.trim(), key = slug(name);
        if (name.length < 2 || !key) return bad('Enter a role name'); if (R[key] || ['admin'].includes(key)) return bad('That role already exists');
        const all = rj('pharmacy_roles', {}); all[key] = { label: name, custom: true, maxDisc: 5, rx: false, level: Object.assign({}, DEF_LEVELS.staff) }; wj('pharmacy_roles', all); audit('Added role ' + key); P._role = key; show('roles');
      }
    }, inp('rname', '', 'text', { placeholder: 'New role name, e.g. Trainee', 'aria-label': 'New role name' }), h('button', { class: 'btn2' }, '+ Add custom role'));
    // Ops matrix
    const acc = rj('mc_acc', {}), opsRoles = Object.keys(OPS_DEF);
    const opsForm = h('form', {
      onsubmit(e) {
        e.preventDefault(); const o = {}; opsRoles.forEach(rn => { o[rn] = OPS_TABS.filter(([t]) => e.target.elements[rn + '|' + t].checked).map(([t]) => t); if (!o[rn].length) o[rn] = OPS_DEF[rn]; });
        wj('mc_acc', o); audit('Changed Ops tab access'); ok('Ops Panel access saved (applies on next load)');
      }, style: 'max-width:none'
    },
      h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, [h('th', {}, 'Ops tab'), ...opsRoles.map(rn => h('th', {}, rn))])), h('tbody', {}, OPS_TABS.map(([t, l]) => h('tr', {}, [h('td', {}, l), ...opsRoles.map(rn => h('td', {}, h('input', { type: 'checkbox', name: rn + '|' + t, checked: (acc[rn] || OPS_DEF[rn]).includes(t) ? 'checked' : null, 'aria-label': rn + ' ' + l })))]))))),
      h('div', { class: 'row' }, h('button', { class: 'btn' }, 'Save Ops access'), btn('Reset Ops access', () => { localStorage.removeItem('mc_acc'); audit('Reset Ops access'); show('roles'); }, 'btn2')), h('small', { class: 'muted' }, 'Owner always keeps every tab.'));
    return h('div', {}, h('h2', {}, 'Roles & permissions'),
      h('p', { class: 'muted' }, 'Admin always has full access. Changes apply to everyone with that role the next time they open a page.'),
      h('div', { class: 'cc-card' }, h('h3', {}, '🧑‍⚕️ Dashboard roles'), h('div', { class: 'row' }, h('label', { class: 'cc-chk' }, 'Role: ', sel), addRole), form),
      h('div', { class: 'cc-card', style: 'margin-top:1rem' }, h('h3', {}, '⚙️ Ops Panel tabs by role'), opsForm));
  };

  P.accounts = () => {
    const R = roleDefs(), users = rj('pharmacy_accounts', []), S = rj('pharmacy_settings', {}), dis = (S.disabled || []).map(x => x.toLowerCase());
    const setPw = async (email, label) => {
      const pw = prompt('New password for ' + label + ' (min 8, letters + numbers):'); if (pw == null) return; const pe = MCPW.policy(pw, email); if (pe) return bad(pe);
      const hx = await MCPW.hash(pw), u = rj('pharmacy_accounts', []), cu = u.find(x => x.email.toLowerCase() === email.toLowerCase());
      if (cu) { cu.hash = hx; wj('pharmacy_accounts', u); } else { const c = rj('pharmacy_creds', {}); c[email] = hx; wj('pharmacy_creds', c); }
      audit('Reset password for ' + email); ok('Password updated'); };
    const defRows = DEFAULT_ACCTS.map(a => { const off = dis.includes(a.email); return h('tr', {}, h('td', {}, a.name), h('td', {}, a.email), h('td', {}, a.role), h('td', {}, h('span', { class: 'pill ' + (off ? 'bad' : 'ok') }, off ? 'Disabled' : 'Active')), h('td', {}, btn('Reset password', () => setPw(a.email, a.email)), ' ', a.role !== 'admin' && btn(off ? 'Enable' : 'Disable', () => { S.disabled = off ? (S.disabled || []).filter(x => x.toLowerCase() !== a.email) : [...(S.disabled || []), a.email]; wj('pharmacy_settings', S); audit((off ? 'Enabled ' : 'Disabled ') + a.email); show('accounts'); }))); });
    const rows = users.map(u => h('tr', {}, h('td', {}, u.name), h('td', {}, u.email), h('td', {}, (R[u.role] || { label: u.role }).label), h('td', {}, h('span', { class: 'pill ' + (u.active === false ? 'bad' : 'ok') }, u.active === false ? 'Disabled' : 'Active')),
      h('td', {}, btn('Reset password', () => setPw(u.email, u.email)), ' ', btn(u.active === false ? 'Enable' : 'Disable', () => { u.active = u.active === false; wj('pharmacy_accounts', users); audit('Toggled ' + u.email); show('accounts'); }), ' ', btn('Delete', () => { if (!confirm('Delete ' + u.email + '?')) return; wj('pharmacy_accounts', users.filter(x => x !== u)); audit('Deleted account ' + u.email); show('accounts'); }))));
    const add = h('form', {
      class: 'cc-form', onsubmit: async e => {
        e.preventDefault(); const f = e.target.elements, email = f.email.value.trim().toLowerCase();
        if (f.name.value.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(email)) return bad('Enter a name and a valid email'); { const pe = MCPW.policy(f.pw.value, email); if (pe) return bad(pe); }
        if (DEFAULT_ACCTS.some(a => a.email === email) || users.some(u => u.email.toLowerCase() === email)) return bad('That email is already used');
        users.push({ id: 'C' + Date.now(), name: f.name.value.trim(), email, role: f.role.value, hash: await MCPW.hash(f.pw.value), active: true, created: new Date().toISOString() }); wj('pharmacy_accounts', users); audit('Created account ' + email); ok('Account created'); show('accounts');
      }
    }, h('div', { class: 'two' }, field('Full name', inp('name', '')), field('Email (login)', inp('email', '', 'email'))), h('div', { class: 'two' }, field('Password', inp('pw', '', 'password', { autocomplete: 'new-password' })), field('Role', h('select', { name: 'role' }, Object.keys(R).map(k => h('option', { value: k }, R[k].label))))), h('button', { class: 'btn' }, 'Create account'));
    // Ops users
    const D = shop();
    const opsRows = D.users.map(u => h('tr', {}, h('td', {}, u.name), h('td', {}, u.role), h('td', {}, h('span', { class: 'pill ' + (u.active ? 'ok' : 'bad') }, u.active ? 'Active' : 'Disabled')), h('td', {}, btn(u.active ? 'Disable' : 'Enable', () => { if (u.active && u.role === 'Owner' && D.users.filter(x => x.role === 'Owner' && x.active).length < 2) return bad('Keep at least one active Owner'); u.active = !u.active; save(D); audit('Toggled ops user ' + u.name); show('accounts'); }))));
    const addOps = h('form', { class: 'row', onsubmit(e) { e.preventDefault(); const f = e.target.elements; if (f.n.value.trim().length < 2) return bad('Enter a name'); D.users.push({ id: uid('U'), name: f.n.value.trim(), role: f.r.value, active: true }); save(D); audit('Added ops user ' + f.n.value.trim()); show('accounts'); } }, inp('n', '', 'text', { placeholder: 'Name', 'aria-label': 'Ops user name' }), h('select', { name: 'r', 'aria-label': 'Ops role' }, ['Owner', 'Pharmacist', 'Cashier', 'Inventory Manager', 'Delivery Staff'].map(x => h('option', {}, x))), h('button', { class: 'btn2' }, '+ Add Ops user'));
    return h('div', {}, h('h2', {}, 'Accounts'),
      h('div', { class: 'cc-card' }, h('h3', {}, '🔑 Dashboard logins'), tbl(['Name', 'Email', 'Role', 'Status', ''], [...defRows, ...rows]), h('h3', {}, 'Create account'), add),
      h('div', { class: 'cc-card', style: 'margin-top:1rem' }, h('h3', {}, '⚙️ Ops Panel users (login with the demo code)'), tbl(['Name', 'Role', 'Status', ''], opsRows), addOps));
  };

  P.sync = () => {
    const meds = rj('pharmacy_medicines', null), st = rj('mc_sync', { pub: {}, applied: {}, auto: false, last: null }), D = shop();
    if (!Array.isArray(meds)) return h('div', {}, h('h2', {}, 'Shop sync'), h('p', { class: 'empty' }, 'No medicines yet. Open the Medicines page once (it creates the demo list), then come back.'), h('a', { class: 'btn', href: 'medicines.html' }, 'Open Medicines'));
    const shopStock = pid => D.batches.filter(b => b.pid === pid && b.qty > 0 && b.exp >= new Date(Date.now() + 216e5).toISOString().slice(0, 10)).reduce((a, b) => a + b.qty, 0);
    const setAll = v => { st.pub = {}; if (v) meds.forEach(m => st.pub['L' + m.id] = true); wj('mc_sync', st); show('sync'); };
    const rows = meds.map(m => { const lid = 'L' + m.id, pub = !!st.pub[lid]; return h('tr', {}, h('td', {}, h('input', { type: 'checkbox', checked: pub ? 'checked' : null, 'aria-label': 'Publish ' + m.name, onchange(e) { st.pub[lid] = e.target.checked; if (!e.target.checked) delete st.pub[lid]; wj('mc_sync', st); } })), h('td', {}, m.name + (m.rxRequired ? ' ℞' : '')), h('td', {}, tk(m.sellingPrice)), h('td', {}, m.stock), h('td', {}, pub ? shopStock(lid) : '—'), h('td', {}, m.expiryDate || '—')); });
    const applied = Object.keys(st.applied || {}).length;
    return h('div', {}, h('h2', {}, 'Online shop sync'),
      h('p', { class: 'muted' }, 'Medicines is the master list. Tick what to sell online, then sync: shop prices, Rx flags, expiry and stock follow Medicines, and online orders reduce Medicines stock once (cancelled orders give it back).'),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick() { const r = mcSync(); r.ok ? ok(`Synced: ${r.upserted} published, ${r.applied} order(s) applied, ${r.reverted} reverted, ${r.removed} removed`) : bad(r.msgs[0]); audit('Manual sync'); show('sync'); } }, '🔄 Sync now'), btn('Publish all', () => setAll(true), 'btn2'), btn('Unpublish all', () => setAll(false), 'btn2'),
        h('label', { class: 'cc-chk' }, h('input', { type: 'checkbox', checked: st.auto ? 'checked' : null, onchange(e) { st.auto = e.target.checked; wj('mc_sync', st); audit('Auto-sync ' + (st.auto ? 'on' : 'off')); } }), 'Auto-sync (on shop load and after every POS sale)')),
      h('p', { class: 'muted' }, st.last ? 'Last sync: ' + dhaka(st.last) + ' · online orders applied so far: ' + applied : 'Never synced yet.'),
      tbl(['Publish', 'Medicine', 'Price', 'Medicines stock', 'Shop stock', 'Expiry'], rows),
      h('p', { class: 'muted' }, 'Tip: edit price, stock and Rx flag in Medicines; changes reach the shop at the next sync. Shop-side edits of published items are overwritten by the sync.'));
  };

  P.logs = () => {
    const sales = rj('pharmacy_sales', []).filter(x => x.real).slice(-30).reverse(), shifts = rj('pharmacy_shifts', []).slice(-10).reverse(), au = rj('pharmacy_audit', []).slice(-40).reverse();
    const doVoid = (s, why) => { if (why == null) return; const r = window.mcVoid ? window.mcVoid(s, why, who()) : { ok: false, msg: 'void-core.js not loaded' }; if (!r.ok) return bad(r.msg); ok(r.msg); show('logs'); };
    const voidSale = s => { const msg = 'ইনভয়েস ' + s.invoiceNo + ' (' + tk(s.total) + ') void করবেন?\nস্টক ফেরত যাবে। কারণ লিখুন:'; if (window.MCD) MCD.prompt(msg, { title: 'Void ইনভয়েস', icon: '🗑️', danger: true, type: 'text', ok: 'Void করুন' }).then(w => doVoid(s, w)); else doVoid(s, prompt(msg)); };
    return h('div', {}, h('h2', {}, 'Sales, shifts & audit'),
      h('h3', {}, 'Recent POS sales'), tbl(['Invoice', 'Date', 'Cashier', 'Payment', 'Total', ''], sales.map(s => h('tr', {}, h('td', {}, s.invoiceNo), h('td', {}, s.date), h('td', {}, s.cashier || '—'), h('td', {}, s.paymentMethod), h('td', {}, tk(s.total)), h('td', {}, s.status === 'Voided' ? 'VOID' + (s.voidReason ? ' — ' + s.voidReason : '') : btn('Void', () => voidSale(s))))), 'No POS sales yet.'),
      h('h3', {}, 'Closed shifts'), tbl(['Date', 'By', 'Invoices', 'Total', 'Counted', 'Difference'], shifts.map(x => h('tr', {}, h('td', {}, x.date), h('td', {}, x.by), h('td', {}, x.invoices), h('td', {}, tk(x.total)), h('td', {}, tk(x.counted)), h('td', { class: x.diff < 0 ? 'bad' : 'ok' }, (x.diff >= 0 ? '+' : '') + tk(x.diff)))), 'No shifts closed yet.'),
      h('h3', {}, 'Admin audit trail'), tbl(['When', 'Who', 'What'], au.map(a => h('tr', {}, h('td', {}, dhaka(a.at)), h('td', {}, a.by), h('td', {}, a.msg))), 'No admin changes recorded.'));
  };

  P.data = () => {
    const sets = [['pharmacy_medicines', 'Medicines'], ['pharmacy_customers', 'Customers'], ['pharmacy_suppliers', 'Suppliers'], ['pharmacy_purchases', 'Purchases'], ['pharmacy_purchase_returns', 'Purchase returns'], ['pharmacy_prescriptions', 'Prescriptions'], ['pharmacy_sales', 'POS sales'], ['pharmacy_shifts', 'Closed shifts'], ['pharmacy_held', 'Held bills'], ['pharmacy_audit', 'Admin audit trail']];
    const rows = sets.map(([k, l]) => { const v = rj(k, null), n = Array.isArray(v) ? v.length : (v ? 1 : 0); return h('tr', {}, h('td', {}, l), h('td', {}, n), h('td', {}, btn('Clear', () => { if (!confirm('Clear all “' + l + '”? This cannot be undone (take a backup first).')) return; localStorage.removeItem(k); audit('Cleared ' + l); show('data'); }))); });
    const D = shop();
    return h('div', {}, h('h2', {}, 'Data'), h('div', { class: 'row' }, h('a', { class: 'btn', href: 'backup.html' }, '💾 Backup / Restore all data')),
      h('h3', {}, 'Dashboard data'), tbl(['Dataset', 'Records', ''], rows),
      h('h3', {}, 'Shop & Ops data (mc_db)'), tbl(['Dataset', 'Records'], [['Products', D.products.length], ['Batches', D.batches.length], ['Orders', D.orders.length], ['Ops users', D.users.length], ['Notifications', (D.notes || []).length]].map(r => h('tr', {}, r.map(c => h('td', {}, c))))),
      h('div', { class: 'cc-card', style: 'margin-top:1rem;border-color:var(--bad)' }, h('h3', { class: 'bad' }, '⚠️ Danger zone'),
        h('div', { class: 'row' }, btn('Reset shop & Ops data to demo', () => { if (prompt('Type RESET to wipe shop and Ops data') !== 'RESET') return; localStorage.removeItem('mc_db'); localStorage.removeItem('mc_sync'); audit('Reset shop data'); ok('Shop data reset'); show('data'); }, 'btn2'), btn('Reset ALL dashboard data to demo', () => { if (prompt('Type RESET to wipe all dashboard data') !== 'RESET') return; sets.forEach(([k]) => localStorage.removeItem(k)); audit('Reset dashboard data'); ok('Dashboard data reset'); show('data'); }, 'btn2'))));
  };

  // ---------------- shell ----------------

  // ---------- Security & login ----------
  P.security = () => {
    const S = rj('pharmacy_settings', {}), L = rj('pharmacy_loginlog', []), locks = rj('mc_lock', {});
    const f = h('form', {
      class: 'cc-form', onsubmit(e) {
        e.preventDefault(); const t = e.target.elements, mx = parseInt(t.lockMax.value, 10), bs = parseInt(t.lockBase.value, 10), idle = parseInt(t.idleMin.value, 10), sh = parseInt(t.sessionHours.value, 10);
        if (!(mx >= 3 && mx <= 10)) return bad('Max attempts must be 3–10'); if (!(bs >= 10 && bs <= 600)) return bad('Lock time must be 10–600 seconds'); if (!(idle >= 0 && idle <= 600)) return bad('Idle timeout 0–600 minutes'); if (!(sh >= 0 && sh <= 72)) return bad('Session limit 0–72 hours');
        const x = rj('pharmacy_settings', {}); Object.assign(x, { sessionHours: sh, lockMax: mx, lockBase: bs, idleMin: idle, loginNotice: t.notice.value.trim().slice(0, 160) }); wj('pharmacy_settings', x); audit('Changed login security settings'); ok('Security settings saved');
      }
    },
      h('div', { class: 'two' }, field('Wrong passwords before lock (3–10)', inp('lockMax', S.lockMax || 5, 'number', { min: 3, max: 10 })), field('First lock time, seconds (doubles each round)', inp('lockBase', S.lockBase || 30, 'number', { min: 10, max: 600 }))),
      field('Auto sign-out after idle minutes (0 = off)', inp('idleMin', S.idleMin == null ? 30 : S.idleMin, 'number', { min: 0, max: 600 })),
      field('Maximum session length, hours (0 = no limit)', inp('sessionHours', S.sessionHours == null ? 12 : S.sessionHours, 'number', { min: 0, max: 72 })),
      field('Message on the staff login page (optional)', inp('notice', S.loginNotice || '', 'text', { maxlength: 160, placeholder: 'e.g. Counter opens at 9 AM — use your own account only' })),
      h('button', { class: 'btn' }, 'Save security settings'));
    const lockedNow = Object.keys(locks).filter(k => locks[k].until > Date.now());
    const rows = L.slice().reverse().filter(x => !(window.__onlyFail) || !x.ok).slice(0, 100).map(x => h('tr', {}, h('td', {}, new Date(x.at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' })), h('td', {}, x.email), h('td', {}, x.role || '—'), h('td', { class: x.ok ? 'ok' : 'bad' }, x.ok ? 'Success' : 'Failed')));
    const fails = L.filter(x => !x.ok).length;
    return h('div', {}, h('h2', {}, 'Login security'), f,
      h('h2', {}, 'Lockouts'), lockedNow.length ? h('p', {}, lockedNow.join(', ') + ' currently locked. ') : h('p', { class: 'ok' }, 'No one is locked out right now.'),
      btn('Unlock everyone', () => { localStorage.removeItem('mc_lock'); audit('Cleared all login lockouts'); ok('All lockouts cleared'); show('security'); }, 'btn2'),
      h('h2', {}, 'Login activity'), h('p', { class: 'muted' }, `${L.length} events · ${fails} failed. Stored in this browser only (last 100 kept).`),
      h('div', { class: 'row' }, btn((window.__onlyFail ? 'Show all' : 'Show failed only'), () => { window.__onlyFail = !window.__onlyFail; show('security'); }, 'btn2'),
        btn('Export CSV', () => { const c = [['Time', 'Email', 'Role', 'Result']].concat(L.map(x => [x.at, x.email, x.role || '', x.ok ? 'Success' : 'Failed'])).map(r => r.map(v => { v = String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(',')).join('\n'); h('a', { href: URL.createObjectURL(new Blob(['﻿' + c], { type: 'text/csv' })), download: 'login-activity.csv' }).click(); }, 'btn2'),
        btn('Clear log', () => { if (!confirm('Clear the login log?')) return; localStorage.removeItem('pharmacy_loginlog'); audit('Cleared login log'); show('security'); }, 'btn2')),
      tbl(['When', 'Email', 'Role', 'Result'], rows, 'No login events yet.'));
  };

  // ---------- Feature switches ----------
  const FEATS = [['team', 'Team Board', 'Notices, handover notes and tasks', 'team.html'], ['refunds', 'Refunds', 'Sales returns & refunds page', 'refunds.html'], ['writeoff', 'Expiry write-off', 'Write off expired stock', 'writeoff.html'],
    ['register', 'Rx register', 'Prescription dispensing register', 'register.html'], ['closing', 'Daily closing', 'End-of-day cash closing', 'closing.html'], ['reorder', 'Reorder list', 'Low-stock purchase suggestions', 'reorder.html']];
  P.features = () => {
    const S = rj('pharmacy_settings', {}), F = S.features || {};
    const f = h('form', {
      class: 'cc-form', onsubmit(e) {
        e.preventDefault(); const x = rj('pharmacy_settings', {}); x.features = {}; FEATS.forEach(([k]) => { if (!e.target.elements[k].checked) x.features[k] = false; });
        wj('pharmacy_settings', x); audit('Changed feature switches'); ok('Saved — hidden features disappear from menus and their pages show a notice');
      }
    }, h('div', { class: 'cc-grid' }, FEATS.map(([k, l, d]) => h('div', { class: 'cc-card' }, chk(k, F[k] !== false, l), h('small', { class: 'muted' }, d)))), h('button', { class: 'btn' }, 'Save features'));
    return h('div', {}, h('h2', {}, 'Feature switches'), h('p', { class: 'muted' }, 'Turn modules off if your pharmacy does not use them. Data is kept; the menu entries, shortcuts and quick actions are hidden and the page shows “disabled by Admin”.'), f);
  };

  const TABS = [['overview', '🏠 Overview'], ['brand', '🎨 Branding'], ['rules', '🧾 Rules'], ['roles', '🛡️ Roles'], ['accounts', '👥 Accounts'], ['features', '🧩 Features'], ['security', '🔐 Security'], ['sync', '🔄 Shop sync'], ['logs', '📋 Sales & audit'], ['data', '🗄️ Data']];
  if (window.CCX) { try { const x = window.CCX({ h, db: shop, save: d => save(d), rj, wj, audit, ok, bad, field, inp, chk, tbl, btn, tk, show: t => show(t) }); TABS.splice(TABS.length - 1, 0, ...x.tabs); Object.assign(P, x.panels); } catch (e) { console.error(e); } }
  let curTab = 'overview';
  function show(t) {
    curTab = t || curTab; tabsEl.replaceChildren(...TABS.map(([k, l]) => h('button', { class: k === curTab ? 'on' : '', role: 'tab', 'aria-selected': k === curTab ? 'true' : 'false', onclick() { location.hash = k; show(k); } }, l)));
    try { app.replaceChildren(P[curTab]()); } catch (e) { console.error(e); app.replaceChildren(h('p', { class: 'bad' }, 'Something went wrong in this section: ' + e.message)); }
    window.scrollTo(0, 0);
  }
  if (!isLegacyAdmin() && !isOwner()) {
    tabsEl.hidden = true;
    app.replaceChildren(h('div', { class: 'cc-card deny' }, h('h2', {}, '🔒 Admin only'), h('p', {}, 'The Control Center is for the Admin (dashboard login) or the Ops Panel Owner.'), h('div', { class: 'row' }, h('a', { class: 'btn', href: 'login.html' }, 'Admin login'), h('a', { class: 'btn2', href: 'admin/login.html' }, 'Owner login (Ops Panel)'))));
    return;
  }
  const first = location.hash.slice(1); show(TABS.some(t => t[0] === first) ? first : 'overview');
})();
