/* v97 — POS Billing আপডেট (sales.html: invoice-v96.js এর পরে লোড হয়):
   • পণ্যের গ্রিডে ফিল্টার/সর্ট বার: সব · Rx · কম স্টক · মেয়াদ ≤৬০ দিন · স্টক শেষ, ক্যাটাগরি, সর্ট (নাম/দাম/স্টক) + "N টি পণ্য"
   • কার্ডে জেনেরিক নাম ও মেয়াদের ব্যাজ (⏳ N দিন / মেয়াদোত্তীর্ণ)
   • স্টক শেষ পণ্যে 🔁 "বিকল্প" — একই জেনেরিকের স্টকে-থাকা, মেয়াদ-ঠিক পণ্য দাম সহ; ক্লিকে কার্টে যোগ
   • ৩০ দিনের মধ্যে মেয়াদ শেষ হবে এমন ওষুধ কার্টে তুললে সতর্কতা
   • ↩ "ফেরত আনুন": ভুলে আইটেম/পুরো কার্ট মুছলে (Ctrl+Z)। ৳৫০০+ কার্ট খালি করলে audit-এ লেখা থাকে
   • 📝 বিলের নোট (ডাক্তার/রোগীর নাম ইত্যাদি) — বিক্রির সাথে সেভ + ইনভয়েসে ছাপা
   • শর্টকাট: F6 কাস্টমার, F8 ক্যাশ, Delete শেষ আইটেম বাদ, Ctrl+Z ফেরত */
(function () {
  'use strict';
  if (typeof displayProducts !== 'function' || typeof updateCart !== 'function') return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(i) { return document.getElementById(i); }
  function tk(n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN'); }
  function say(m, t) { try { showToast(m, t || 'info'); } catch (e) { } }
  function user() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || {}; } catch (e) { return {}; } }
  function daysLeft(exp) {
    if (!exp) return null; var t = new Date(Date.now() + 216e5).toISOString().slice(0, 10), a = Date.parse(t), b = Date.parse(String(exp).slice(0, 10));
    return isNaN(b) ? null : Math.round((b - a) / 864e5);
  }
  function cat(id) { var m = rj('pharmacy_medicines', []).filter(function (x) { return String(x.id) === String(id); })[0]; return (m && m.category) || ''; }

  var st = document.createElement('style');
  st.textContent = '.v97-bar{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin:.2rem 0 .7rem}.v97-chip{border:1px solid rgba(100,110,160,.35);background:transparent;color:inherit;border-radius:999px;padding:.2rem .7rem;font-size:.82rem;cursor:pointer}' +
    '.v97-chip.on{background:#3b82f6;border-color:#3b82f6;color:#fff}.v97-sel{border:1px solid rgba(100,110,160,.35);border-radius:10px;padding:.2rem .5rem;font-size:.82rem;background:transparent;color:inherit}.v97-n{font-size:.8rem;opacity:.7;margin-left:auto}' +
    '.v97-hint{font-size:.74rem;opacity:.65;margin:-.3rem 0 .6rem}.v97-g{font-size:.74rem;color:#6b7280;display:block}.v97-exp{font-size:.72rem;display:inline-block;margin-top:.15rem;padding:.05rem .45rem;border-radius:999px;background:#fef3c7;color:#92400e}.v97-exp.x{background:#fee2e2;color:#b91c1c}' +
    '.v97-oos{opacity:.55}.v97-alt{display:block;margin:.3rem auto 0;border:1px solid #3b82f6;color:#3b82f6;background:transparent;border-radius:999px;font-size:.74rem;padding:.05rem .6rem;cursor:pointer}' +
    '.v97-undo{display:none;border:1px solid #b45309;color:#b45309;background:transparent;border-radius:999px;font-size:.78rem;padding:.1rem .7rem;cursor:pointer;margin-left:.5rem}.v97-undo.on{display:inline-block}' +
    '.v97-ov{position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px}.v97-box{background:#fff;color:#16213a;border-radius:16px;max-width:440px;width:100%;padding:1.1rem 1.2rem;box-shadow:0 20px 60px rgba(0,0,0,.35);max-height:85vh;overflow:auto}body.dark-mode .v97-box{background:#171e36;color:#e8ecfa}' +
    '.v97-row{display:flex;justify-content:space-between;align-items:center;gap:.5rem;padding:.45rem 0;border-bottom:1px solid rgba(120,130,170,.2)}.v97-note{width:100%;margin-top:.5rem}';
  document.head.appendChild(st);

  /* ---------- ফিল্টার বার ---------- */
  var F = { chip: 'all', cat: '', sort: 'name' };
  var grid = $('productsGrid');
  var CH = [['all', 'সব'], ['rx', 'Rx'], ['low', '⚠ কম স্টক'], ['exp', '⏳ মেয়াদ ≤৬০ দিন'], ['out', '❌ স্টক শেষ']];
  function pass(p) {
    if (F.chip === 'rx' && !p.rx) return false;
    if (F.chip === 'low' && !(p.stock > 0 && p.stock <= 10)) return false;
    if (F.chip === 'out' && p.stock > 0) return false;
    if (F.chip === 'exp') { var d = daysLeft(p.expiry); if (d == null || d > 60) return false; }
    if (F.cat && cat(p.id) !== F.cat) return false;
    return true;
  }
  function sorter(a, b) {
    if (F.sort === 'pa') return a.price - b.price; if (F.sort === 'pd') return b.price - a.price; if (F.sort === 'sa') return a.stock - b.stock;
    return String(a.name).localeCompare(String(b.name));
  }
  function buildBar() {
    if (!grid || $('v97Bar')) return;
    var cats = {}; rj('pharmacy_medicines', []).forEach(function (m) { if (m && m.category) cats[m.category] = 1; });
    var bar = document.createElement('div'); bar.id = 'v97Bar'; bar.className = 'v97-bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Product filters');
    bar.innerHTML = CH.map(function (c) { return '<button type="button" class="v97-chip' + (c[0] === 'all' ? ' on' : '') + '" data-c="' + c[0] + '">' + c[1] + '</button>'; }).join('') +
      '<select class="v97-sel" id="v97Cat" aria-label="Category"><option value="">সব ক্যাটাগরি</option>' + Object.keys(cats).sort().map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select>' +
      '<select class="v97-sel" id="v97Sort" aria-label="Sort"><option value="name">নাম</option><option value="pa">দাম ↑</option><option value="pd">দাম ↓</option><option value="sa">স্টক ↑</option></select><span class="v97-n" id="v97N"></span>';
    grid.parentNode.insertBefore(bar, grid);
    var hint = document.createElement('div'); hint.className = 'v97-hint'; hint.textContent = 'F2 খুঁজুন · F4 হোল্ড · F6 কাস্টমার · F8 ক্যাশ · F9 পেমেন্ট · Delete শেষ আইটেম বাদ · Ctrl+Z ফেরত'; grid.parentNode.insertBefore(hint, grid);
    bar.addEventListener('click', function (e) { var b = e.target.closest('.v97-chip'); if (!b) return; F.chip = b.getAttribute('data-c'); [].forEach.call(bar.querySelectorAll('.v97-chip'), function (x) { x.classList.toggle('on', x === b); }); redraw(); });
    $('v97Cat').onchange = function () { F.cat = this.value; redraw(); }; $('v97Sort').onchange = function () { F.sort = this.value; redraw(); };
  }
  function redraw() { var s = $('searchProduct'); displayProducts(s ? s.value : ''); }

  var _dp = displayProducts;
  window.displayProducts = function (term) {
    var orig = products, shown = 0;
    try { products = orig.filter(pass).sort(sorter); shown = products.length; _dp.call(this, term); } finally { products = orig; }
    try { decorate(); var n = $('v97N'); if (n) n.textContent = (grid.querySelectorAll('.product-card').length) + ' / ' + orig.length + ' টি পণ্য'; } catch (e) { }
  };
  function decorate() {
    [].forEach.call(grid.querySelectorAll('.product-card'), function (c) {
      var m = (c.getAttribute('onclick') || '').match(/addToCart\(([^)]+)\)/); if (!m) return;
      var p = products.filter(function (x) { return String(x.id) === m[1].replace(/['"]/g, ''); })[0]; if (!p || c.querySelector('.v97-g,.v97-exp,.v97-alt')) return;
      var nm = c.querySelector('.product-name');
      if (nm && p.generic && p.generic.toLowerCase() !== String(p.name).toLowerCase()) nm.insertAdjacentHTML('afterend', '<span class="v97-g">' + esc(p.generic) + '</span>');
      var d = daysLeft(p.expiry);
      if (d != null && d <= 60) c.insertAdjacentHTML('beforeend', '<span class="v97-exp' + (d <= 0 ? ' x' : '') + '">' + (d <= 0 ? 'মেয়াদোত্তীর্ণ' : '⏳ ' + d + ' দিন') + '</span>');
      if (p.stock <= 0) { c.classList.add('v97-oos'); var b = document.createElement('button'); b.type = 'button'; b.className = 'v97-alt'; b.textContent = '🔁 বিকল্প'; b.onclick = function (e) { e.stopPropagation(); alts(p); }; c.appendChild(b); }
    });
  }

  /* ---------- বিকল্প ওষুধ ---------- */
  function overlay(html) {
    var o = document.createElement('div'); o.className = 'v97-ov'; o.setAttribute('role', 'dialog'); o.innerHTML = '<div class="v97-box">' + html + '</div>';
    o.addEventListener('click', function (e) { if (e.target === o || e.target.hasAttribute('data-x')) o.remove(); }); document.body.appendChild(o);
    document.addEventListener('keydown', function f(e) { if (e.key === 'Escape') { o.remove(); document.removeEventListener('keydown', f); } }); return o;
  }
  function alts(p) {
    var g = String(p.generic || '').trim().toLowerCase(), L = g ? products.filter(function (x) { var d = daysLeft(x.expiry); return x.id !== p.id && x.stock > 0 && String(x.generic || '').trim().toLowerCase() === g && (d == null || d > 0); }).sort(function (a, b) { return a.price - b.price; }) : [];
    var o = overlay('<h6 style="margin:0 0 .5rem">🔁 ' + esc(p.name) + ' এর বিকল্প</h6><div class="small text-muted" style="margin-bottom:.4rem">একই জেনেরিক: ' + esc(p.generic || '—') + '</div>' +
      (L.length ? L.map(function (x) { return '<div class="v97-row"><div><b>' + esc(x.name) + '</b><span class="v97-g">স্টক ' + x.stock + (x.brand ? ' · ' + esc(x.brand) : '') + '</span></div><div>' + tk(x.price) + ' <button type="button" class="v97-chip on" data-add="' + x.id + '">যোগ</button></div></div>'; }).join('') : '<div class="text-muted" style="padding:.6rem 0">' + (g ? 'এই জেনেরিকের স্টকে-থাকা কোনো পণ্য নেই।' : 'এই পণ্যের জেনেরিক নাম দেওয়া নেই — Medicines থেকে যোগ করলে বিকল্প খুঁজে দেবে।') + '</div>') +
      '<div style="text-align:right;margin-top:.7rem"><button type="button" class="v97-chip" data-x>বন্ধ</button></div>');
    o.addEventListener('click', function (e) { var b = e.target.closest('[data-add]'); if (b) { addToCart(isNaN(+b.getAttribute('data-add')) ? b.getAttribute('data-add') : +b.getAttribute('data-add')); o.remove(); } });
  }
  var _add = addToCart, warned = {};
  window.addToCart = function (id) {
    var p = products.filter(function (x) { return String(x.id) === String(id); })[0];
    var r = _add.apply(this, arguments);
    try {
      if (p && p.stock <= 0 && p.generic) alts(p);
      else if (p && cart.some(function (i) { return i.id === p.id; })) { var d = daysLeft(p.expiry); if (d != null && d > 0 && d <= 30 && !warned[p.id]) { warned[p.id] = 1; say('⏳ ' + p.name + ' — মেয়াদ আর ' + d + ' দিন বাকি। গ্রাহককে জানান।', 'warning'); } }
    } catch (e) { }
    return r;
  };

  /* ---------- কার্ট: ফেরত আনুন (সংখ্যা টাইপ pos-extra.js-এ আগে থেকেই আছে) ---------- */
  var UNDO = null;
  var _uc = updateCart;
  window.updateCart = function () {
    var r = _uc.apply(this, arguments);
    try {
      var u = $('v97Undo'); if (u) u.classList.toggle('on', !!UNDO);
    } catch (e) { }
    return r;
  };
  function snap() { return cart.map(function (i) { return { id: i.id, name: i.name, price: i.price, quantity: i.quantity, total: i.total }; }); }
  var _rm = removeFromCart;
  window.removeFromCart = function (id) { var s = snap(), n = cart.length, r = _rm.apply(this, arguments); if (cart.length < n) { UNDO = s; var u = $('v97Undo'); if (u) u.classList.add('on'); } return r; };
  var _cc = clearCart;
  window.clearCart = function () {
    var s = snap(), tot = cart.reduce(function (a, i) { return a + (+i.total || 0); }, 0), r = _cc.apply(this, arguments);
    if (s.length && !cart.length) {
      UNDO = s; var u = $('v97Undo'); if (u) u.classList.add('on');
      if (tot >= 500) { try { var A = rj('pharmacy_audit', []); A.push({ at: new Date().toISOString(), by: user().name || user().role || '?', msg: 'POS কার্ট খালি করা হয়েছে (' + s.length + ' আইটেম, ' + tk(tot) + ')' }); localStorage.setItem('pharmacy_audit', JSON.stringify(A.slice(-500))); } catch (e) { } }
    }
    return r;
  };
  function undo() {
    if (!UNDO) return; var back = 0;
    UNDO.forEach(function (i) { var p = products.filter(function (x) { return x.id === i.id; })[0]; if (!p || p.stock <= 0) return; var q = Math.min(i.quantity, p.stock), ex = cart.filter(function (c) { return c.id === i.id; })[0]; if (ex) return; cart.push({ id: i.id, name: i.name, price: i.price, quantity: q, total: q * i.price }); back++; });
    UNDO = null; updateCart(); say(back ? '↩ ' + back + 'টি আইটেম ফিরে এসেছে' : 'ফেরত আনার মতো কিছু নেই', back ? 'success' : 'warning');
  }
  function mkUndo() {
    var cc = $('cartCount'); if (!cc || $('v97Undo')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'v97Undo'; b.className = 'v97-undo'; b.textContent = '↩ ফেরত আনুন'; b.onclick = undo;
    (cc.closest('h5,h6,.card-title,div') || cc.parentNode).appendChild(b);
  }
  addEventListener('mc-sale', function () { UNDO = null; var u = $('v97Undo'); if (u) u.classList.remove('on'); var n = $('v97Note'); if (n) n.value = ''; });

  /* ---------- বিলের নোট ---------- */
  function mkNote() {
    var cs = $('customerSelect'); if (!cs || $('v97Note')) return;
    var n = document.createElement('input'); n.id = 'v97Note'; n.className = 'form-control v97-note'; n.maxLength = 120; n.placeholder = '📝 বিলের নোট (ডাক্তার/রোগীর নাম ইত্যাদি) — ইনভয়েসে ছাপা হবে'; n.setAttribute('aria-label', 'Bill note');
    (cs.parentNode.classList.contains('input-group') ? cs.parentNode : cs).insertAdjacentElement('afterend', n);
  }
  var _pp = window.processPayment;
  if (typeof _pp === 'function') window.processPayment = function () { var n = $('v97Note'); window.__v97note = n ? n.value.trim() : ''; try { return _pp.apply(this, arguments); } finally { setTimeout(function () { window.__v97note = ''; }, 0); } };
  var _si = window.showInvoice;
  if (typeof _si === 'function') window.showInvoice = function (inv) {
    var note = window.__v97note || '', S = rj('pharmacy_sales', []), i = -1;
    for (var k = S.length - 1; k >= 0; k--) if (S[k] && S[k].invoiceNo === (inv || {}).invoiceNo) { i = k; break; }
    if (i >= 0) { if (note && !S[i].note) { S[i].note = note.slice(0, 120); try { localStorage.setItem('pharmacy_sales', JSON.stringify(S)); } catch (e) { } } else if (!note) note = S[i].note || ''; }
    var r = _si.apply(this, arguments);
    try { var p = document.querySelector('#invoiceContent .text-center.mb-4 p:last-of-type'); if (note && p && !p.querySelector('.v97-nt')) p.insertAdjacentHTML('beforeend', '<br class="v97-nt"><strong>Note:</strong> ' + esc(note)); } catch (e) { }
    return r;
  };

  /* ---------- শর্টকাট ---------- */
  document.addEventListener('keydown', function (e) {
    var t = (e.target.tagName || '').toLowerCase(), typing = /input|textarea|select/.test(t) || e.target.isContentEditable;
    if (e.key === 'F6') { e.preventDefault(); var c = $('customerSelect'); if (c) c.focus(); }
    else if (e.key === 'F8') { e.preventDefault(); var a = $('cashAmount'); if (a) a.focus(); }
    else if (!typing && !e.ctrlKey && !e.metaKey && e.key === 'Delete' && cart.length) { e.preventDefault(); removeFromCart(cart[cart.length - 1].id); }
    else if (!typing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && UNDO) { e.preventDefault(); undo(); }
  });

  buildBar(); mkUndo(); mkNote(); redraw(); updateCart();
})();
