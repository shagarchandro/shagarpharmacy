/* v99 — Online Shop (store-v92.js এর পরে):
   • 📍 ঠিকানা-বই: চেকআউটে সংরক্ষিত ঠিকানা বেছে নিলে নাম/ফোন/ঠিকানা/এলাকা ভরে যায়; অর্ডারের সময় "সংরক্ষণ করুন" (সর্বোচ্চ ৫টি, মুছে ফেলা যায়)
   • 📷 প্রেসক্রিপশনের ছবি: Rx অর্ডারে ছবি দেওয়া যায় (ছোট করে এই ব্রাউজারে সংরক্ষিত) → Ops Panel-এ ফার্মাসিস্ট দেখতে পান (ops-v99.js)
   • 🔎 সার্চ সাজেশন + সাম্প্রতিক সার্চ (↑↓ Enter)
   • ⚖ তুলনা: ২–৩টি ওষুধ পাশাপাশি (জেনেরিক, প্রস্তুতকারক, দাম, স্টক, মেয়াদ…)
   • ⬇ উইশলিস্টে দাম কমলে ব্যাজ
   • প্রোডাক্ট পেজ: নিকটতম ব্যাচের মেয়াদ + "💬 এই ওষুধ নিয়ে ফার্মাসিস্টকে জিজ্ঞাসা" (প্রশ্নের ফর্মে ওষুধের নাম বসে যায়)
   • অর্ডার তালিকায় 💬 WhatsApp-এ জিজ্ঞাসা
   সবই এই ব্রাউজারের localStorage-এ (ডেমো); কোনো পেমেন্ট/SMS নেই। */
(function () {
  'use strict';
  if (typeof views === 'undefined' || typeof h !== 'function' || typeof db !== 'function' || typeof render !== 'function') return;
  var isBn = function () { try { return typeof lang === 'function' && lang() === 'bn'; } catch (e) { return false; } };
  var tx = function (b, e) { return isBn() ? b : e; };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var $1 = function (s, r) { return (r || document).querySelector(s); };
  function sayT(m, bad) { try { toast(m, bad); } catch (e) { } }
  function visible() { return (D.products || []).filter(function (p) { return !p.hide; }); }
  function byName(n) { return visible().filter(function (p) { return p.name === n; })[0]; }
  function nearExp(p) { try { var b = usable(D, p.id)[0]; return b ? b.exp : ''; } catch (e) { return ''; } }

  var st = h('style', {}, '.v99sg{position:absolute;left:0;right:0;top:100%;z-index:30;background:#fff;color:#16213a;border:1px solid #cfd6de;border-radius:10px;box-shadow:0 10px 28px rgba(30,40,100,.18);margin:2px 0 0;padding:.25rem;list-style:none;max-height:300px;overflow:auto}' +
    '.v99sg li{padding:.4rem .6rem;border-radius:8px;cursor:pointer;display:flex;justify-content:space-between;gap:.5rem}.v99sg li.sel,.v99sg li:hover{background:#e8efff}.v99sg small{opacity:.7}.v99sg .hd{font-size:.72rem;opacity:.6;cursor:default}.v99sg .hd:hover{background:none}' +
    '.v99w{position:relative;display:inline-block;width:100%}.v99cb{display:inline-flex;align-items:center;gap:.25rem;font-size:.78rem;margin-top:.3rem;cursor:pointer}' +
    '#v99cmpbar{position:fixed;left:12px;bottom:12px;z-index:900;background:#1f3a8a;color:#fff;border-radius:999px;padding:.4rem .9rem;display:none;gap:.6rem;align-items:center;box-shadow:0 8px 24px rgba(0,0,0,.3);font-size:.88rem}#v99cmpbar.on{display:flex}#v99cmpbar button{border:0;border-radius:999px;padding:.2rem .7rem;cursor:pointer}' +
    '.v99ov{position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,.6);display:flex;align-items:center;justify-content:center;padding:14px}.v99bx{background:#fff;color:#16213a;border-radius:16px;max-width:880px;width:100%;max-height:88vh;overflow:auto;padding:1rem 1.2rem}' +
    '.v99bx table{width:100%;border-collapse:collapse}.v99bx th,.v99bx td{border:1px solid #d6dbe6;padding:.4rem .6rem;text-align:left;vertical-align:top}.v99bx th{background:#f1f4fb;width:130px}' +
    '.v99rx{border:1px dashed #9db4c8;border-radius:10px;padding:.6rem;margin:.5rem 0}.v99rx img{max-width:140px;max-height:140px;border-radius:8px;display:block;margin:.4rem 0}.v99ab{margin:.4rem 0}.v99ab select{max-width:100%}' +
    '.v99dn{background:#dcfce7;color:#166534;border-radius:999px;font-size:.74rem;padding:.05rem .5rem;display:inline-block;margin:.2rem 0}');
  document.head.appendChild(st);

  /* ---------- ঠিকানা-বই ---------- */
  var AK = 'mc_addrs';
  function addrs() { return rj(AK, []).filter(function (a) { return a && a.addr; }); }
  var pendingRx = '';
  function addrBook(form) {
    var L = addrs(), first = $1('label', form), box = h('div', { class: 'v99ab' });
    var sel = h('select', { 'aria-label': tx('সংরক্ষিত ঠিকানা', 'Saved addresses') }, h('option', { value: '' }, '📍 ' + tx('সংরক্ষিত ঠিকানা', 'Saved addresses') + ' (' + L.length + ')'), L.map(function (a, i) { return h('option', { value: String(i) }, (a.label || tx('ঠিকানা', 'Address')) + ' — ' + String(a.addr).slice(0, 40)); }));
    sel.onchange = function () {
      var a = L[+sel.value]; if (!a) return; var el = form.elements;
      if (el.name) el.name.value = a.name || ''; if (el.phone) el.phone.value = a.phone || ''; if (el.addr) el.addr.value = a.addr || ''; if (el.area && a.area) { el.area.value = a.area; el.area.dispatchEvent(new Event('change', { bubbles: true })); }
      [].forEach.call(form.querySelectorAll('.err'), function (e) { e.textContent = ''; });
    };
    var del = h('button', { type: 'button', class: 'btn2', 'aria-label': tx('মুছুন', 'Delete'), onclick: function () { var i = +sel.value; if (sel.value === '' || !L[i]) return sayT(tx('আগে একটি ঠিকানা বাছুন', 'Pick an address first'), 1); L.splice(i, 1); wj(AK, L); render(); } }, '🗑');
    box.append(sel, ' ', L.length ? del : '');
    if (first) first.parentNode.insertBefore(box, first); else form.prepend(box);
    var ai = form.elements.addr, lab = ai && ai.closest('label');
    if (lab) {
      var sv = h('label', { class: 'v99cb' }, h('input', { type: 'checkbox', id: 'v99save' }), tx('এই ঠিকানা সংরক্ষণ করুন', 'Save this address'), h('input', { id: 'v99lab', placeholder: tx('নাম: বাসা / অফিস', 'Label: Home / Office'), maxlength: 20, style: 'width:140px;margin-left:.4rem' }));
      lab.insertAdjacentElement('afterend', sv);
    }
  }
  function rxPhoto(form) {
    var fs = $1('fieldset', form); if (!fs || $1('.v99rx', fs)) return;
    var prev = h('div'), msg = h('small', { class: 'muted' }, tx('ঐচ্ছিক: প্রেসক্রিপশনের পরিষ্কার ছবি দিলে ফার্মাসিস্ট দ্রুত যাচাই করতে পারেন।', 'Optional: a clear photo of the prescription helps the pharmacist verify faster.'));
    var inp = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp', 'aria-label': tx('প্রেসক্রিপশনের ছবি', 'Prescription photo') });
    var box = h('div', { class: 'v99rx' }, h('b', {}, '📷 ' + tx('প্রেসক্রিপশনের ছবি', 'Prescription photo')), h('br'), inp, prev, msg);
    fs.appendChild(box);
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; pendingRx = ''; prev.textContent = ''; if (!f) return;
      if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { inp.value = ''; return sayT(tx('শুধু PNG / JPG / WebP ছবি', 'PNG / JPG / WebP images only'), 1); }
      if (f.size > 8e6) { inp.value = ''; return sayT(tx('ছবি ৮MB-এর বেশি', 'Image is over 8 MB'), 1); }
      var rd = new FileReader(); rd.onload = function () {
        var im = new Image(); im.onerror = function () { sayT(tx('ছবি পড়া যায়নি', 'Could not read the image'), 1); };
        im.onload = function () {
          var k = Math.min(1, 1100 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          var q = .72, out = c.toDataURL('image/jpeg', q); while (out.length > 330000 && q > .3) { q -= .12; out = c.toDataURL('image/jpeg', q); }
          if (out.length > 330000) { inp.value = ''; return sayT(tx('ছবিটি খুব বড় — ছোট করে আবার দিন', 'Image is too large — try a smaller one'), 1); }
          pendingRx = out; var t = h('img', { src: out, alt: tx('প্রেসক্রিপশন প্রিভিউ', 'Prescription preview') }); prev.append(t, h('small', { class: 'muted' }, Math.round(out.length / 1024) + ' KB'));
        }; im.src = rd.result;
      }; rd.readAsDataURL(f);
    };
  }
  var _pl = place;
  place = function (f, rx) {
    var el = f && f.elements || {}, want = el.addr && $1('#v99save') && $1('#v99save').checked ? { label: ($1('#v99lab').value || '').trim().slice(0, 20) || tx('ঠিকানা', 'Address'), name: el.name && el.name.value.trim(), phone: el.phone && el.phone.value.trim(), addr: el.addr.value.trim(), area: el.area && el.area.value } : null;
    var img = pendingRx, r = _pl.apply(this, arguments);
    try {
      var m = (location.hash || '').match(/^#\/success\/(.+)$/);
      if (m) {
        if (want) { var L = addrs().filter(function (a) { return !(a.addr === want.addr && a.phone === want.phone); }); L.unshift(want); wj(AK, L.slice(0, 5)); }
        if (img) { var M = rj('mc_rximg', {}), ks = Object.keys(M); while (ks.length >= 15) delete M[ks.shift()]; M[m[1]] = img; if (!wj('mc_rximg', M)) sayT(tx('ছবি সংরক্ষণ করা যায়নি (জায়গা কম) — ডেলিভারির সময় দেখান', 'Could not save the photo (storage full) — show it on delivery'), 1); pendingRx = ''; }
      }
    } catch (e) { }
    return r;
  };

  /* ---------- সার্চ সাজেশন ---------- */
  var RQ = 'mc_recent_q', skipSug = false;
  function addRecent(q) { q = String(q || '').trim(); if (q.length < 2) return; var L = rj(RQ, []).filter(function (x) { return x !== q; }); L.unshift(q); wj(RQ, L.slice(0, 5)); }
  function suggest() {
    var inp = $1('#app input[type=search]'); if (!inp || inp.__v99) return; inp.__v99 = 1;
    var par = inp.parentNode; if (getComputedStyle(par).position === 'static') par.style.position = 'relative';
    var ul = h('ul', { class: 'v99sg', role: 'listbox', hidden: true }); par.appendChild(ul); var items = [], sel = -1;
    function place() { ul.style.left = inp.offsetLeft + 'px'; ul.style.top = (inp.offsetTop + inp.offsetHeight) + 'px'; ul.style.width = Math.max(inp.offsetWidth, 220) + 'px'; ul.style.right = 'auto'; }
    function hide() { ul.hidden = true; ul.textContent = ''; items = []; sel = -1; }
    function paint() {
      ul.textContent = ''; if (!items.length) { ul.hidden = true; return; }
      items.forEach(function (it, i) { ul.appendChild(it.hd ? h('li', { class: 'hd' }, it.hd) : h('li', { class: i === sel ? 'sel' : '', role: 'option', onmousedown: function (e) { e.preventDefault(); pick(it); } }, h('span', {}, it.t), h('small', {}, it.s || ''))); });
      place(); ul.hidden = false;
    }
    function pick(it) { S.q = it.q; S.page = 1; addRecent(it.q); skipSug = true; render('q'); }
    function build() {
      var q = inp.value.trim().toLowerCase(); items = [];
      if (!q) { rj(RQ, []).forEach(function (x) { items.push({ t: '🕘 ' + x, q: x }); }); if (items.length) items.unshift({ hd: tx('সাম্প্রতিক সার্চ', 'Recent searches') }); }
      else visible().filter(function (p) { return (p.name + ' ' + (p.generic || '') + ' ' + (p.maker || '')).toLowerCase().indexOf(q) > -1; }).slice(0, 6).forEach(function (p) { items.push({ t: p.name, s: p.generic || '', q: p.name }); });
      sel = items.findIndex(function (x) { return !x.hd; }); if (!q) sel = -1; paint();
    }
    inp.addEventListener('input', build); inp.addEventListener('focus', build);
    inp.addEventListener('blur', function () { setTimeout(hide, 120); });
    inp.addEventListener('keydown', function (e) {
      if (ul.hidden || !items.length) return; var sel_ = items.map(function (x, i) { return x.hd ? -1 : i; }).filter(function (i) { return i > -1; }), at = sel_.indexOf(sel);
      if (e.key === 'ArrowDown') { sel = sel_[(at + 1) % sel_.length]; paint(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = sel_[(at - 1 + sel_.length) % sel_.length]; paint(); e.preventDefault(); }
      else if (e.key === 'Enter' && sel > -1 && items[sel] && inp.value.trim().toLowerCase() !== items[sel].q.toLowerCase()) { e.preventDefault(); pick(items[sel]); }
      else if (e.key === 'Escape') hide();
    });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.defaultPrevented) addRecent(inp.value); });
    if (document.activeElement === inp && !skipSug) build(); skipSug = false;
  }

  /* ---------- তুলনা ---------- */
  var cmp = [];
  function cmpBar() {
    var b = $1('#v99cmpbar'); if (!b) { b = h('div', { id: 'v99cmpbar', role: 'status' }); document.body.appendChild(b); }
    b.textContent = ''; b.classList.toggle('on', cmp.length > 0); if (!cmp.length) return;
    b.append('⚖ ' + tx('তুলনা', 'Compare') + ' (' + cmp.length + '/3)', h('button', { type: 'button', onclick: showCmp, disabled: cmp.length < 2 ? true : null }, tx('দেখুন', 'View')), h('button', { type: 'button', onclick: function () { cmp = []; cmpBar(); $$('.v99cbx').forEach(function (x) { x.checked = false; }); } }, '✕'));
  }
  function showCmp() {
    var P = cmp.map(function (id) { return D.products.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean); if (P.length < 2) return;
    var rows = [[tx('জেনেরিক', 'Generic'), function (p) { return p.generic || '—'; }], [tx('প্রস্তুতকারক', 'Maker'), function (p) { return p.maker || '—'; }], [tx('ধরন / প্যাক', 'Form / Pack'), function (p) { return (p.form || '—') + ' · ' + (p.pack || '—'); }],
      [tx('দাম', 'Price'), function (p) { return money(eff(p)) + (p.disc > 0 ? ' (' + tx('ছাড় ', 'off ') + p.disc + '%)' : ''); }], [tx('স্টক', 'Stock'), function (p) { var s = stock(D, p.id); return s ? (s < (p.reorder || 0) ? tx('অল্প আছে', 'Low') : tx('আছে', 'In stock')) : tx('শেষ', 'Out of stock'); }],
      [tx('প্রেসক্রিপশন', 'Prescription'), function (p) { return p.rx ? 'Rx' : 'OTC'; }], [tx('মেয়াদ (নিকটতম ব্যাচ)', 'Expiry (nearest batch)'), function (p) { return nearExp(p) || '—'; }]];
    var best = Math.min.apply(null, P.map(eff));
    var tb = h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, ''), P.map(function (p) { return h('th', { style: 'width:auto' }, h('a', { href: '#/product/' + p.id, onclick: function () { ov.remove(); } }, p.name)); }))),
      h('tbody', {}, rows.map(function (r) { return h('tr', {}, h('th', {}, r[0]), P.map(function (p) { var v = r[1](p); return h('td', {}, v, r[0] === tx('দাম', 'Price') && eff(p) === best && P.length > 1 ? h('span', { class: 'v99dn' }, tx('সবচেয়ে কম', 'Lowest')) : null); })); }),
        h('tr', {}, h('th', {}, ''), P.map(function (p) { return h('td', {}, stock(D, p.id) ? h('button', { class: 'btn', type: 'button', onclick: function () { var c = cart(); if ((c[p.id] || 0) + 1 > stock(D, p.id)) return sayT(tx('স্টক নেই', 'Not enough stock'), 1); c[p.id] = (c[p.id] || 0) + 1; setCart(c); sayT(tx('কার্টে যোগ হয়েছে', 'Added to cart')); } }, tx('কার্টে যোগ', 'Add to cart')) : h('span', { class: 'muted' }, '—')); }))));
    var ov = h('div', { class: 'v99ov', role: 'dialog', 'aria-label': tx('তুলনা', 'Compare'), onclick: function (e) { if (e.target === ov) ov.remove(); } }, h('div', { class: 'v99bx' }, h('h2', { style: 'margin-top:0' }, '⚖ ' + tx('ওষুধের তুলনা', 'Compare medicines')), tb,
      h('p', { class: 'muted', style: 'font-size:.8rem' }, tx('তুলনা ডাক্তারের পরামর্শের বিকল্প নয় — সন্দেহ হলে ফার্মাসিস্টকে জিজ্ঞাসা করুন।', 'Not a substitute for medical advice — ask the pharmacist if unsure.')), h('div', { style: 'text-align:right' }, h('button', { class: 'btn2', type: 'button', onclick: function () { ov.remove(); } }, tx('বন্ধ', 'Close')))));
    document.body.appendChild(ov);
    var onEsc = function (e) { if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', onEsc); } }; document.addEventListener('keydown', onEsc);
  }
  function cmpBoxes() {
    $$('#app .grid article.card, #app .grid .card').forEach(function (c) {
      if ($1('.v99cb', c)) return; var n = $1('h3', c), p = n && byName(n.textContent.trim()); if (!p) return;
      var cb = h('input', { type: 'checkbox', class: 'v99cbx', 'aria-label': tx('তুলনায় যোগ', 'Add to compare') }); cb.checked = cmp.indexOf(p.id) > -1;
      cb.onchange = function () { if (cb.checked) { if (cmp.length >= 3) { cb.checked = false; return sayT(tx('সর্বোচ্চ ৩টি', 'Max 3'), 1); } cmp.push(p.id); } else cmp = cmp.filter(function (x) { return x !== p.id; }); cmpBar(); };
      c.appendChild(h('label', { class: 'v99cb' }, cb, '⚖ ' + tx('তুলনা', 'Compare')));
    }); cmpBar();
  }

  /* ---------- উইশলিস্ট দাম কমা ---------- */
  function wishPrices(route) {
    var W = rj('mc_wish', []), M = rj('mc_wlp', {}), ch = false;
    W.forEach(function (id) { var p = D.products.filter(function (x) { return x.id === id; })[0]; if (!p) return; var e = eff(p); if (M[id] == null || e > M[id]) { M[id] = e; ch = true; } });
    Object.keys(M).forEach(function (id) { if (W.indexOf(id) < 0) { delete M[id]; ch = true; } }); if (ch) wj('mc_wlp', M);
    if (route !== 'wishlist') return;
    $$('#app .grid article.card').forEach(function (c) {
      var n = $1('h3', c), p = n && byName(n.textContent.trim()); if (!p || $1('.v99dn', c)) return; var was = M[p.id];
      if (was != null && eff(p) < was) c.appendChild(h('span', { class: 'v99dn' }, '⬇ ' + tx('দাম কমেছে ' + money(was - eff(p)) + ' (আগে ' + money(was) + ')', 'Price dropped ' + money(was - eff(p)) + ' (was ' + money(was) + ')')));
    });
  }

  /* ---------- প্রোডাক্ট পেজ + অর্ডার + Ask ---------- */
  function productExtras() {
    var id = location.hash.split('/')[2], p = D.products.filter(function (x) { return x.id === id; })[0], card = $1('#app .card'); if (!p || !card || $1('.v99pe', card)) return;
    var ex = nearExp(p), box = h('div', { class: 'v99pe' });
    if (ex) box.append(h('p', { class: 'muted' }, '🗓 ' + tx('নিকটতম ব্যাচের মেয়াদ: ', 'Nearest batch expiry: ') + ex));
    if (!((D.settings && D.settings.shopOff) || []).includes('ask')) box.append(h('a', { class: 'btn2', href: '#/ask', onclick: function () { try { sessionStorage.setItem('mc_ask_med', p.name); } catch (e) { } } }, '💬 ' + tx('এই ওষুধ নিয়ে ফার্মাসিস্টকে জিজ্ঞাসা', 'Ask the pharmacist about this medicine')));
    card.appendChild(box);
  }
  function askFill() {
    var m; try { m = sessionStorage.getItem('mc_ask_med'); sessionStorage.removeItem('mc_ask_med'); } catch (e) { }
    var i = m && $1('#app [name=med]'); if (i && !i.value) i.value = m;
  }
  function ordersWa() {
    var m = me && me(); if (!m) return; var phone = String((D.settings && D.settings.phone) || '').replace(/\D/g, ''); if (/^01/.test(phone)) phone = '88' + phone; if (!phone) return;
    $$('#app article.card').forEach(function (c) {
      var t = $1('h3', c), no = t && (t.textContent.match(/^(\S+)/) || [])[1]; if (!no || $1('.v99wa', c) || !D.orders.some(function (o) { return o.no === no; })) return;
      c.appendChild(h('a', { class: 'btn2 v99wa', target: '_blank', rel: 'noopener', href: 'https://wa.me/' + phone + '?text=' + encodeURIComponent((D.settings.store || 'MediCare') + ' — ' + tx('আমার অর্ডার ', 'About my order ') + no) }, '💬 ' + tx('WhatsApp-এ জিজ্ঞাসা', 'Ask on WhatsApp')));
    });
  }
  function successRx() {
    var no = location.hash.split('/')[2], M = rj('mc_rximg', {}); if (!no || !M[no]) return; var s = $1('#app section.card'); if (s && !$1('.v99dn', s)) s.appendChild(h('p', { class: 'v99dn' }, '📷 ' + tx('প্রেসক্রিপশনের ছবি জমা হয়েছে', 'Prescription photo attached')));
  }

  var _r = render;
  render = function (k) {
    var r = _r.apply(this, arguments);
    try {
      var route = (location.hash.slice(2) || 'catalog').split('/')[0];
      wishPrices(route);
      if (route === 'checkout') { var f = $1('#app form'); if (f && !$1('.v99ab', f)) { pendingRx = ''; addrBook(f); rxPhoto(f); } }
      else if (route === 'catalog' || route === '') { suggest(); cmpBoxes(); }
      else if (route === 'product') productExtras();
      else if (route === 'ask') askFill();
      else if (route === 'orders') ordersWa();
      else if (route === 'success') successRx();
    } catch (e) { if (window.console) console.warn('store-v99', e); }
    return r;
  };
  render();
})();
