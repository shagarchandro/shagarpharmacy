/* v114 — কাস্টমার শপ: Shop · Wishlist · Orders · Help · Contact · Ask pharmacist আরও আপডেট
   Shop     : ফর্ম/ব্র্যান্ড ফিল্টার, তালিকা/গ্রিড ভিউ, খুঁজে না পেলে "ভুল বানান?" সাজেশন + "ওষুধটি চাই" অনুরোধ (Ops Notifications-এ যায়)
   Wishlist : সাজানো (নতুন/দাম/স্টক), মোট মূল্য, শেয়ার (WhatsApp/কপি), স্টক-শেষ বাদ, স্টকে এলে জানান, প্রিন্ট
   Orders   : ফিল্টার (চলমান/ডেলিভারড/বাতিল) + খোঁজা, 🖨 ইনভয়েস, 💬 এই অর্ডার নিয়ে সাহায্য, ⭐ রেটিং (Ops-এ যায়)
   Help     : ক্যাটেগরি চিপ, জরুরি নম্বর, নিরাপদ ওষুধ-ব্যবহার টিপস
   Contact  : "এখন খোলা?", WhatsApp/ম্যাপ/কপি, কলব্যাক সময়, অর্ডার নম্বর, ড্রাফট সেভ
   Ask      : 🔴 জরুরি, কার জন্য (শিশু/বয়স্ক/গর্ভবতী), অন্য ওষুধ/অ্যালার্জি, কলব্যাক সময়, ড্রাফট সেভ
   নেভ      : ফার্মেসির উত্তর এলে Contact/Ask-এ 💬 ব্যাজ */
(function () {
  'use strict';
  var tx = function (b, e) { try { return lang() === 'bn' ? b : e; } catch (x) { return b; } };
  var rj = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var wj = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  var BDP = /^(\+?88)?01[3-9]\d{8}$/;
  var route = function () { return (location.hash.slice(2) || 'catalog').split('/')[0]; };
  var prod = function (id) { return D.products.find(function (p) { return p.id === id; }); };
  var shopPhone = function () { return (D.settings && D.settings.phone) || '01700-000000'; };
  var el = function (t, p) { var a = [].slice.call(arguments, 2); return h.apply(null, [t, p || {}].concat(a)); };

  var st = document.createElement('style');
  st.textContent = '.b114{display:inline-block;background:#d92d20;color:#fff;border-radius:99px;font-size:.7rem;padding:0 .4rem;margin-left:.25rem;font-weight:700}' +
    '.c114{border:1px solid #cfe3dd;border-radius:12px;padding:.6rem .8rem;margin:.6rem 0;background:#f1f8f6}.c114.w{background:#fff6e0;border-color:#f0d38a}.c114.r{background:#fde8e6;border-color:#f1b5b0}.c114 h3{margin:.1rem 0 .3rem;font-size:1rem}' +
    '.c114 .r1{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin:.3rem 0}.l114 .grid{grid-template-columns:1fr!important}.l114 .grid .card{display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center}.l114 .grid .card img{display:none}' +
    '.o114{display:inline-block;border-radius:99px;padding:.05rem .6rem;font-size:.8rem;font-weight:700}.o114.on{background:#d9f5e5;color:#0b5a32}.o114.off{background:#fde2e0;color:#7a1410}.o114.na{background:#e5efec}' +
    '.s114 button{cursor:pointer}.s114 .on{background:#0f766e;color:#fff}@media print{.c114,.b114{display:none}}';
  document.head.appendChild(st);

  /* ---------- সাধারণ: খোলা/বন্ধ ---------- */
  function openNow() {
    var s = D.settings || {}; if (s.shopOpen === false) return { open: false, txt: tx('এখন অনলাইন অর্ডার বন্ধ', 'Online orders paused') };
    var m = String(s.hours || '').match(/(\d{1,2})(?::(\d\d))?\s*(am|pm)?\s*(?:–|—|-|to)\s*(\d{1,2})(?::(\d\d))?\s*(am|pm)?/i); if (!m) return { open: null, txt: s.hours || '' };
    var cv = function (hh, mm, ap, fb) { hh = +hh; mm = +(mm || 0); ap = (ap || fb || '').toLowerCase(); if (ap === 'pm' && hh < 12) hh += 12; if (ap === 'am' && hh === 12) hh = 0; return hh * 60 + mm; };
    var ap2 = m[6] || m[3], a = cv(m[1], m[2], m[3], m[6] ? (m[3] || (+m[1] < 12 && /pm/i.test(m[6]) && +m[1] > +m[4] ? 'am' : m[6])) : m[3]), b = cv(m[4], m[5], ap2, null);
    var d = new Date(Date.now() + 6 * 3600e3), now = d.getUTCHours() * 60 + d.getUTCMinutes(), open = a <= b ? (now >= a && now < b) : (now >= a || now < b);
    return { open: open, txt: s.hours };
  }
  var chip = function () { var o = openNow(); return o.open == null ? null : el('span', { class: 'o114 ' + (o.open ? 'on' : 'off') }, (o.open ? '🟢 ' + tx('এখন খোলা', 'Open now') : '🔴 ' + tx('এখন বন্ধ', 'Closed now')) + (o.txt ? ' · ' + o.txt : '')); };

  /* ---------- মেসেজ/নোট সাহায্যকারী ---------- */
  function sendNote(kind, text, who, ph, label) {
    D = db(); var ref = 'Q' + Date.now().toString(36).toUpperCase().slice(-6);
    (D.notes = D.notes || []).push({ id: uid('N'), at: new Date().toISOString(), kind: kind, msg: label + ' ' + ref + ' from ' + who + ' (' + ph + '): ' + text.slice(0, 300), read: false }); save(D);
    var l = rj('mc_msgs', []); l.push({ ref: ref, kind: kind, at: new Date().toISOString(), text: text.slice(0, 120) }); wj('mc_msgs', l.slice(-10)); return ref;
  }
  function unseenReplies() {
    var seen = localStorage.getItem('mc_rseen114') || '', n = 0;
    rj('mc_msgs', []).forEach(function (m) { var x = (D.notes || []).find(function (q) { return q.msg && q.msg.indexOf(' ' + m.ref + ' ') > -1; }); if (x && x.reply && x.reply.at > seen) n++; }); return n;
  }

  /* ---------- 🛒 Shop ---------- */
  var F = rj('mc_f114', {}); try { F = JSON.parse(sessionStorage.getItem('mc_f114') || '{}'); } catch (e) { F = {} }
  var saveF = function () { try { sessionStorage.setItem('mc_f114', JSON.stringify(F)); } catch (e) { } };
  if (views.catalog) {
    var cat0 = views.catalog;
    views.catalog = function () {
      var all = D.products;
      if (F.form || F.maker) D.products = all.filter(function (p) { return (!F.form || p.form === F.form) && (!F.maker || p.maker === F.maker); });
      try { return cat0.apply(this, arguments); } finally { D.products = all; }
    };
  }
  function lev(a, b) { a = a.toLowerCase(); b = b.toLowerCase(); var m = a.length, n = b.length, d = []; for (var i = 0; i <= m; i++) { d[i] = [i]; } for (var j = 1; j <= n; j++) d[0][j] = j; for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
  function didYouMean(q) {
    var best = [], t = q.toLowerCase().trim(); if (t.length < 3) return best;
    D.products.forEach(function (p) {
      var words = (p.name + ' ' + (p.generic || '')).split(/[\s,()\/-]+/).filter(function (w) { return w.length > 2; }), score = 99;
      words.concat([p.name]).forEach(function (w) { var d = lev(t, w.slice(0, Math.max(t.length, 3) + 1 > w.length ? w.length : t.length)); if (d < score) score = d; });
      if (score <= Math.max(1, Math.floor(t.length / 3))) best.push([score, p]);
    });
    return best.sort(function (a, b) { return a[0] - b[0]; }).slice(0, 4).map(function (x) { return x[1]; });
  }
  function shopTools(a) {
    var flt = a.querySelector('.filters'); if (!flt) return;
    var forms = [], makers = []; D.products.forEach(function (p) { if (p.form && forms.indexOf(p.form) < 0) forms.push(p.form); if (p.maker && makers.indexOf(p.maker) < 0) makers.push(p.maker); });
    var sel = function (k, label, list) { return el('label', {}, label + ' ', el('select', { onchange: function (e) { if (e.target.value) F[k] = e.target.value; else delete F[k]; saveF(); S.page = 1; render(); } }, [el('option', { value: '' }, tx('সব', 'All'))].concat(list.sort().map(function (x) { return el('option', Object.assign({ value: x }, F[k] === x ? { selected: 'selected' } : {}), x); })))); };
    var list = localStorage.getItem('mc_view114') === 'list';
    flt.before(el('div', { class: 'row s114', role: 'group', 'aria-label': 'More filters' }, sel('form', '💊 ' + tx('ধরন', 'Form'), forms), sel('maker', '🏭 ' + tx('প্রস্তুতকারক', 'Brand'), makers),
      el('button', { 'aria-pressed': String(list), class: list ? 'on' : '', onclick: function () { localStorage.setItem('mc_view114', list ? 'grid' : 'list'); render(); } }, list ? '▦ ' + tx('গ্রিড', 'Grid') : '☰ ' + tx('তালিকা', 'List')),
      (F.form || F.maker) ? el('button', { onclick: function () { F = {}; saveF(); render(); } }, '✕ ' + tx('ফিল্টার মুছুন', 'Clear')) : null));
    a.classList.toggle('l114', list);
    if (!a.querySelector('article.card') && (S.q || S.cat || F.form || F.maker)) noResult(a);
  }
  function noResult(a) {
    var q = (S.q || '').trim(), box = el('div', { class: 'c114 w', role: 'note' }, el('h3', {}, '🔎 ' + tx('কিছু পাওয়া যায়নি', 'Nothing found') + (q ? ': “' + q + '”' : '')));
    var sg = q ? didYouMean(q) : []; if (sg.length) box.append(el('div', { class: 'r1' }, tx('এগুলো কি খুঁজছিলেন? ', 'Did you mean: '), sg.map(function (p) { return el('button', { onclick: function () { S.q = p.name; S.cat = ''; delete F.form; delete F.maker; saveF(); S.page = 1; render(); } }, p.name); })));
    if (F.form || F.maker || S.cat) box.append(el('div', { class: 'r1' }, el('button', { onclick: function () { F = {}; saveF(); S.cat = ''; render(); } }, '✕ ' + tx('সব ফিল্টার মুছে দেখুন', 'Clear filters'))));
    if (q.length >= 3) {
      var pf = rj('mc_prof', {}), done = rj('mc_medreq', []).indexOf(q.toLowerCase()) > -1;
      if (done) box.append(el('p', { class: 'ok' }, '✅ ' + tx('অনুরোধ আগেই পাঠানো হয়েছে — ফার্মেসি জানাবে', 'Request already sent — the pharmacy will contact you')));
      else {
        var nm = el('input', { placeholder: tx('আপনার নাম', 'Your name'), value: pf.name || '', maxlength: 60, 'aria-label': 'Name' }), ph = el('input', { type: 'tel', placeholder: tx('মোবাইল', 'Mobile'), value: pf.phone || '', 'aria-label': 'Mobile' });
        box.append(el('p', {}, tx('ওষুধটি আমাদের তালিকায় নেই? ফার্মেসিকে জানান, তারা আনিয়ে দেবে কি না জানাবে।', 'Not in our list? Ask the pharmacy to source it.')), el('div', { class: 'r1' }, nm, ph, el('button', { class: 'btn', onclick: function () {
          if (nm.value.trim().length < 2 || !BDP.test(ph.value.trim())) return toast('নাম ও সঠিক মোবাইল নম্বর দিন', 1);
          sendNote('ask', 'Medicine request: ' + q, nm.value.trim(), ph.value.trim(), '🔎 Medicine request'); var l = rj('mc_medreq', []); l.push(q.toLowerCase()); wj('mc_medreq', l.slice(-30));
          wj('mc_prof', Object.assign(pf, { name: nm.value.trim(), phone: ph.value.trim() })); toast(tx('অনুরোধ পাঠানো হয়েছে', 'Request sent')); render();
        } }, '📩 ' + tx('ওষুধটি চাই', 'Request this medicine'))));
      }
    }
    a.append(box);
  }

  /* ---------- ♡ Wishlist ---------- */
  var WS = 'new';
  function wishPage(a) {
    var ids = rj('mc_wish', []).filter(prod), grid = a.querySelector('.grid'), h1 = a.querySelector('h1'); if (!ids.length || !grid || !h1) return;
    var P = ids.map(prod), ins = P.filter(function (p) { return stock(D, p.id) > 0; }), val = P.reduce(function (t, p) { return t + eff(p); }, 0), valIn = ins.reduce(function (t, p) { return t + eff(p); }, 0);
    var srt = function () { var L = P.slice(); if (WS === 'new') L.reverse(); else if (WS === 'lo') L.sort(function (x, y) { return eff(x) - eff(y); }); else if (WS === 'hi') L.sort(function (x, y) { return eff(y) - eff(x); }); else if (WS === 'stock') L.sort(function (x, y) { return (stock(D, y.id) > 0) - (stock(D, x.id) > 0); }); return L; };
    var N = rj('mc_notify', []);
    grid.replaceChildren.apply(grid, srt().map(function (p) {
      var c = card(p); if (!stock(D, p.id)) c.append(N.indexOf(p.id) > -1 ? el('p', { class: 'ok' }, '🔔 ' + tx('স্টকে এলে জানানো হবে', 'We will tell the pharmacy')) : el('button', { class: 'btn2', onclick: function () { var d = db(); (d.notes = d.notes || []).push({ id: uid('N'), at: new Date().toISOString(), msg: 'Back-in-stock request: ' + p.name + ' (from ' + (me() || 'a visitor') + ')', read: false }); save(d); var l = rj('mc_notify', []); l.push(p.id); wj('mc_notify', l); toast('Request sent'); render(); } }, '🔔 ' + tx('স্টকে এলে জানান', 'Notify me')));
      return c;
    }));
    var text = function () { return '💚 ' + ((D.settings && D.settings.store) || 'MediCare') + ' — ' + tx('আমার উইশলিস্ট', 'my wishlist') + '\n' + srt().map(function (p) { return '• ' + p.name + ' — ' + money(eff(p)) + (stock(D, p.id) ? '' : ' (' + tx('স্টকে নেই', 'out of stock') + ')'); }).join('\n') + '\n' + tx('মোট', 'Total') + ': ' + money(val); };
    var bar = el('div', { class: 'c114' }, el('div', { class: 'r1' }, el('b', {}, tx('মোট মূল্য ', 'Total ') + money(val)), ins.length < P.length ? el('span', { class: 'muted' }, tx(' · স্টকে আছে এমনগুলো ' + money(valIn), ' · in stock ' + money(valIn))) : null),
      el('div', { class: 'r1 s114' }, el('label', {}, tx('সাজান: ', 'Sort: '), el('select', { onchange: function (e) { WS = e.target.value; render(); } }, [['new', tx('সর্বশেষ আগে', 'Newest')], ['lo', tx('দাম কম → বেশি', 'Price low → high')], ['hi', tx('দাম বেশি → কম', 'Price high → low')], ['stock', tx('স্টকে আছে আগে', 'In stock first')]].map(function (o) { return el('option', Object.assign({ value: o[0] }, WS === o[0] ? { selected: 'selected' } : {}), o[1]); }))),
        el('button', { onclick: function () { var t = text(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(tx('তালিকা কপি হয়েছে', 'Copied')); }, function () { prompt('Copy:', t); }); } }, '📋 ' + tx('কপি', 'Copy')),
        el('a', { class: 'btn2', target: '_blank', rel: 'noopener noreferrer', href: 'https://wa.me/?text=' + encodeURIComponent(text()) }, '💬 WhatsApp'), el('button', { onclick: function () { window.print(); } }, '🖨'),
        ins.length < P.length ? el('button', { onclick: function () { if (!confirm(tx('স্টকে নেই এমনগুলো তালিকা থেকে সরাবেন?', 'Remove out-of-stock items?'))) return; wj('mc_wish', rj('mc_wish', []).filter(function (i) { return stock(D, i) > 0; })); render(); } }, '🧹 ' + tx('স্টক-শেষ বাদ দিন', 'Remove unavailable')) : null));
    h1.after(bar);
  }

  /* ---------- 📦 Orders ---------- */
  var OF = 'all', OQ = '';
  function printInvoice(o) {
    var w = el('div', { class: 'p114' }, el('h2', {}, (D.settings && D.settings.store) || 'MediCare'), el('p', {}, o.no + ' · ' + new Date(o.at).toLocaleString()), el('p', {}, o.customer + ' · ' + o.phone), el('p', {}, o.addr || ''),
      el('table', { style: 'width:100%' }, el('tbody', {}, (o.items || []).map(function (i) { return el('tr', {}, el('td', {}, i.name), el('td', {}, '× ' + i.qty), el('td', { style: 'text-align:right' }, money(i.price * i.qty))); }))),
      el('p', {}, 'Subtotal ' + money(o.sub) + (o.disc ? ' · Discount −' + money(o.disc) : '') + ' · Delivery ' + money(o.fee)), el('h3', {}, 'Total ' + money(o.total)), el('p', {}, 'Payment: ' + (o.pay || '') + (o.payRef ? ' · ref ' + o.payRef : '')), el('p', {}, 'Status: ' + o.status));
    var ps = el('style', { class: 'p114s' }, '.p114{display:none}@media print{body>*:not(.p114){display:none!important}.p114{display:block!important}}'); document.head.append(ps); document.body.append(w); setTimeout(function () { window.print(); }, 60); setTimeout(function () { w.remove(); ps.remove(); }, 2000);
  }
  var ACTIVE = ['Pending', 'Confirmed', 'Prescription Review', 'Packed', 'Shipped'];
  function ordersPage(a) {
    var m = me(); if (!m) return; var arts = [].slice.call(a.querySelectorAll('article.card')), rows = [];
    arts.forEach(function (art) {
      var no = ((art.querySelector('h3') || {}).textContent || '').split(' · ')[0].trim(), o = D.orders.find(function (x) { return x.no === no && x.customer === m; }); if (!o) return; rows.push({ art: art, o: o });
      var ex = el('div', { class: 'r1 s114' }, el('button', { onclick: function () { printInvoice(o); } }, '🖨 ' + tx('ইনভয়েস', 'Invoice')), el('button', { onclick: function () { try { sessionStorage.setItem('mc_ctx_order', o.no); } catch (e) { } location.hash = '#/contact'; } }, '💬 ' + tx('এই অর্ডার নিয়ে সাহায্য', 'Help with this order')));
      var ageH = Math.max(0, Math.round((Date.now() - Date.parse(o.at)) / 36e5)); if (ACTIVE.indexOf(o.status) > -1) ex.append(el('small', { class: 'muted' }, '⏱ ' + tx(ageH + ' ঘণ্টা আগে অর্ডার করেছেন', 'placed ' + ageH + 'h ago')));
      art.append(ex);
      if (o.status === 'Delivered') {
        if (o.rating) art.append(el('p', { class: 'ok' }, '⭐ ' + tx('আপনার রেটিং: ', 'Your rating: ') + '★'.repeat(o.rating.stars) + '☆'.repeat(5 - o.rating.stars) + (o.rating.comment ? ' — ' + o.rating.comment : '')));
        else {
          var sc = el('select', { 'aria-label': 'Rating' }, [el('option', { value: '' }, '⭐ ' + tx('রেটিং দিন…', 'Rate…'))].concat([5, 4, 3, 2, 1].map(function (n) { return el('option', { value: n }, '★'.repeat(n) + ' (' + n + ')'); }))), cm = el('input', { placeholder: tx('মন্তব্য (ঐচ্ছিক)', 'Comment (optional)'), maxlength: 160, 'aria-label': 'Comment' });
          art.append(el('div', { class: 'r1 s114' }, sc, cm, el('button', { class: 'btn2', onclick: function () {
            var n = +sc.value; if (!(n >= 1 && n <= 5)) return toast(tx('রেটিং বেছে নিন', 'Choose a rating'), 1);
            D = db(); var x = D.orders.find(function (q) { return q.id === o.id; }); if (!x || x.rating) return; x.rating = { stars: n, comment: cm.value.trim().slice(0, 160), at: new Date().toISOString() };
            (D.notes = D.notes || []).push({ id: uid('N'), at: new Date().toISOString(), msg: '⭐ Rating ' + n + '/5 for ' + x.no + ' from ' + m + (x.rating.comment ? ': ' + x.rating.comment : ''), read: false }); save(D); toast(tx('ধন্যবাদ!', 'Thank you!')); render();
          } }, tx('পাঠান', 'Send'))));
        }
      }
    });
    if (rows.length < 2) return;
    var h1 = a.querySelector('h1'), apply = function () { rows.forEach(function (r) { var okF = OF === 'all' || (OF === 'active' && ACTIVE.indexOf(r.o.status) > -1) || (OF === 'done' && r.o.status === 'Delivered') || (OF === 'closed' && ['Cancelled', 'Refunded', 'Returned'].indexOf(r.o.status) > -1), okQ = !OQ || (r.o.no + ' ' + r.o.items.map(function (i) { return i.name; }).join(' ')).toLowerCase().indexOf(OQ) > -1; r.art.style.display = okF && okQ ? '' : 'none'; }); };
    var cnt = function (f) { return rows.filter(function (r) { return f === 'all' || (f === 'active' && ACTIVE.indexOf(r.o.status) > -1) || (f === 'done' && r.o.status === 'Delivered') || (f === 'closed' && ['Cancelled', 'Refunded', 'Returned'].indexOf(r.o.status) > -1); }).length; };
    var bar = el('div', { class: 'c114 s114' }, el('div', { class: 'r1' }, [['all', tx('সব', 'All')], ['active', tx('চলমান', 'Active')], ['done', tx('ডেলিভারড', 'Delivered')], ['closed', tx('বাতিল/ফেরত', 'Cancelled/Returned')]].map(function (f) { return el('button', { class: OF === f[0] ? 'on' : '', 'aria-pressed': String(OF === f[0]), onclick: function () { OF = f[0]; render(); } }, f[1] + ' (' + cnt(f[0]) + ')'); }),
      el('input', { type: 'search', placeholder: tx('অর্ডার নং বা ওষুধ খুঁজুন…', 'Search order or medicine…'), 'aria-label': 'Search orders', value: OQ, oninput: function (e) { OQ = e.target.value.toLowerCase(); apply(); } })));
    var anchor = a.querySelector('.mc-track') || arts[0]; anchor.before(bar); apply();
  }

  /* ---------- ❓ Help ---------- */
  var HC = 'all';
  var CATS = [['all', 'সব', 'All', null], ['del', '🚚 ডেলিভারি', '🚚 Delivery', /deliver|ডেলিভারি|fee|zone|free|ঢাকা/i], ['pay', '💳 পেমেন্ট', '💳 Payment', /pay|bkash|nagad|rocket|cash|cod|পেমেন্ট|কুপন|coupon/i], ['rx', '📋 প্রেসক্রিপশন', '📋 Prescription', /prescri|rx|প্রেসক্রিপশন/i], ['ret', '↩ ফেরত/বাতিল', '↩ Return/Cancel', /return|refund|cancel|ফেরত|বাতিল/i]];
  function helpPage(a) {
    var sec = a.querySelector('section') || a, q = a.querySelector('input[type=search]'), box = q && q.nextElementSibling; if (!q) return;
    var apply = function () { var c = CATS.filter(function (x) { return x[0] === HC; })[0]; [].forEach.call(a.querySelectorAll('details.card'), function (d) { d.style.display = !c || !c[3] || c[3].test(d.textContent) ? '' : 'none'; }); };
    var chips = el('div', { class: 'r1 s114 c114' }, CATS.map(function (c) { return el('button', { class: HC === c[0] ? 'on' : '', onclick: function () { HC = c[0]; [].forEach.call(chips.querySelectorAll('button'), function (b) { b.classList.remove('on'); }); this.classList.add('on'); apply(); } }, tx(c[1], c[2])); }));
    q.before(chips); if (box) new MutationObserver(apply).observe(box, { childList: true }); apply();
    var emg = el('div', { class: 'c114 r', role: 'note' }, el('h3', {}, '🚨 ' + tx('জরুরি অবস্থায়', 'In an emergency')), el('p', {}, tx('জরুরি চিকিৎসায় অনলাইন অর্ডারের অপেক্ষা করবেন না।', 'Do not wait for an online order in an emergency.')),
      el('div', { class: 'r1' }, el('a', { class: 'btn', href: 'tel:999' }, '📞 999 ' + tx('(জাতীয় জরুরি সেবা)', '(National emergency)')), el('a', { class: 'btn2', href: 'tel:16263' }, '☎ 16263 ' + tx('(স্বাস্থ্য বাতায়ন)', '(Health hotline)'))), el('small', { class: 'muted' }, tx('নম্বর সরকারি সেবার; ব্যবহারের আগে নিজে যাচাই করে নিন।', 'Government services; please verify before relying on them.')));
    var tips = el('details', { class: 'card' }, el('summary', {}, el('b', {}, '💡 ' + tx('নিরাপদে ওষুধ ব্যবহারের টিপস', 'Medicine safety tips'))), el('ul', {}, [
      tx('অ্যান্টিবায়োটিক ডাক্তারের দেওয়া কোর্স পুরো শেষ করুন; নিজে থেকে শুরু বা বন্ধ করবেন না।', 'Finish an antibiotic course exactly as prescribed; do not start or stop on your own.'), tx('অন্যের প্রেসক্রিপশনের ওষুধ খাবেন না, নিজের ওষুধও অন্যকে দেবেন না।', 'Never share prescription medicines.'),
      tx('ওষুধ ঠান্ডা, শুকনো জায়গায় এবং শিশুদের নাগালের বাইরে রাখুন।', 'Store in a cool, dry place away from children.'), tx('মেয়াদ ও ব্যাচ দেখে নিন; মেয়াদ-উত্তীর্ণ ওষুধ ফেলে দিন।', 'Check expiry; discard expired medicines.'),
      tx('গর্ভবতী/দুগ্ধদানকারী, শিশু বা বয়স্ক হলে নতুন ওষুধের আগে ফার্মাসিস্টকে জিজ্ঞাসা করুন।', 'Pregnant, nursing, children or elderly: ask the pharmacist first.')].map(function (t) { return el('li', {}, t); })));
    (box || q).after(tips); sec.insertBefore(emg, sec.children[2] || null);
  }

  /* ---------- ✉ Contact / 💊 Ask ---------- */
  var CB = [['', 'যেকোনো সময়', 'Any time'], ['সকাল ৯–১২', 'সকাল ৯–১২', 'Morning 9–12'], ['দুপুর ১২–৪', 'দুপুর ১২–৪', 'Noon 12–4'], ['বিকাল ৪–৮', 'বিকাল ৪–৮', 'Evening 4–8'], ['রাত ৮–১০', 'রাত ৮–১০', 'Night 8–10']];
  var cbSel = function () { return el('select', { name: 'cb114', 'aria-label': 'Callback time' }, CB.map(function (c) { return el('option', { value: c[0] }, tx(c[1], c[2])); })); };
  function draftBind(form, key, names) {
    var d = rj(key, {}); names.forEach(function (n) { var f = form.elements[n]; if (!f) return; if (d[n] && !f.value) f.value = d[n]; f.addEventListener('input', function () { var x = rj(key, {}); x[n] = f.value; wj(key, x); }); });
    return function () { localStorage.removeItem(key); };
  }
  function contactPage(a) {
    var f = a.querySelector('form'); if (!f || f.elements.cb114) return; var s = D.settings || {}, ph = shopPhone().replace(/[^+\d]/g, ''), wa = ph.replace(/^\+?88/, '').replace(/^0/, '');
    var h1 = a.querySelector('h1'), o = chip(), tools = el('div', { class: 'c114' }, el('div', { class: 'r1' }, o, el('small', { class: 'muted' }, tx('(আপনার সময় অনুযায়ী নয়, ঢাকার সময়)', '(Dhaka time)'))),
      el('div', { class: 's114 r1' }, el('a', { class: 'btn2', target: '_blank', rel: 'noopener noreferrer', href: 'https://wa.me/880' + wa }, '💬 WhatsApp'), s.addr ? el('a', { class: 'btn2', target: '_blank', rel: 'noopener noreferrer', href: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.addr) }, '🗺 ' + tx('ম্যাপে দেখুন', 'Open map')) : null,
        el('button', { onclick: function () { (navigator.clipboard ? navigator.clipboard.writeText(shopPhone()) : Promise.reject()).then(function () { toast(tx('নম্বর কপি হয়েছে', 'Number copied')); }, function () { prompt('Copy:', shopPhone()); }); } }, '📋 ' + tx('ফোন নম্বর কপি', 'Copy phone'))));
    h1.after(tools);
    var ord = el('input', { name: 'ord114', placeholder: tx('অর্ডার নম্বর (থাকলে)', 'Order no. (optional)'), maxlength: 20, 'aria-label': 'Order number', value: sessionStorage.getItem('mc_ctx_order') || '' }), topic = f.elements.topic; var ta = f.elements.m;
    if (ord.value && topic) topic.value = 'Order help';
    ta.closest('label').before(el('label', {}, tx('অর্ডার নম্বর', 'Order no.'), ord), el('label', {}, tx('কখন কল পেলে সুবিধা', 'Best time to call'), cbSel()));
    var clear = draftBind(f, 'mc_dr114_contact', ['m']);
    f.addEventListener('submit', function () { var m = ta.value.trim(); if (m.length < 5) return; var ex = []; if (ord.value.trim()) ex.push('Order ' + ord.value.trim().toUpperCase()); if (f.elements.cb114.value) ex.push('Call: ' + f.elements.cb114.value); if (ex.length) { ta.removeAttribute('maxlength'); ta.value = (m + ' [' + ex.join(' · ') + ']').slice(0, 330); } clear(); try { sessionStorage.removeItem('mc_ctx_order'); } catch (e) { } }, true);
  }
  function askPage(a) {
    var f = a.querySelector('form'); if (!f || f.elements.who114) return; var ta = f.elements.q; if (!ta) return;
    var urg = el('select', { name: 'urg114', 'aria-label': 'Urgency' }, [el('option', { value: '' }, tx('সাধারণ', 'Normal')), el('option', { value: '1' }, '🔴 ' + tx('জরুরি (আজই কল চাই)', 'Urgent (call me today)'))]);
    var who = el('select', { name: 'who114', 'aria-label': 'For' }, [['', tx('নিজের জন্য (প্রাপ্তবয়স্ক)', 'Myself (adult)')], ['শিশু', tx('শিশুর জন্য', 'A child')], ['বয়স্ক', tx('বয়স্কের জন্য', 'An elderly person')], ['গর্ভবতী/দুগ্ধদানকারী', tx('গর্ভবতী/দুগ্ধদানকারী', 'Pregnant / nursing')]].map(function (o) { return el('option', { value: o[0] }, o[1]); }));
    var oth = el('input', { name: 'oth114', maxlength: 80, placeholder: tx('এখন যে অন্য ওষুধ খাচ্ছেন (থাকলে)', 'Other medicines being taken'), 'aria-label': 'Other medicines' }), alg = el('input', { name: 'alg114', maxlength: 60, placeholder: tx('অ্যালার্জি (থাকলে)', 'Allergies (if any)'), 'aria-label': 'Allergies' });
    ta.closest('label').before(el('label', {}, tx('জরুরি কি না', 'Urgency'), urg), el('label', {}, tx('কার জন্য', 'Who is it for'), who), el('label', {}, tx('অন্য ওষুধ', 'Other medicines'), oth), el('label', {}, tx('অ্যালার্জি', 'Allergies'), alg), el('label', {}, tx('কখন কল পেলে সুবিধা', 'Best time to call'), cbSel()));
    var clear = draftBind(f, 'mc_dr114_ask', ['q', 'med', 'oth114', 'alg114']);
    f.addEventListener('submit', function () {
      var q = ta.value.trim(); if (q.length < 8) return; var ex = [];
      if (who.value) ex.push('For: ' + who.value); if (oth.value.trim()) ex.push('Taking: ' + oth.value.trim()); if (alg.value.trim()) ex.push('Allergy: ' + alg.value.trim()); if (f.elements.cb114.value) ex.push('Call: ' + f.elements.cb114.value);
      ta.removeAttribute('maxlength'); ta.value = ((urg.value ? '🔴 URGENT · ' : '') + q + (ex.length ? ' [' + ex.join(' · ') + ']' : '')).slice(0, 480); clear();
    }, true);
  }

  /* ---------- রেন্ডার-হুক ---------- */
  var _r = render;
  render = function (k) {
    _r(k); D = db(); var a = $('#app'); if (!a) return; var r = route();
    try {
      document.querySelectorAll('.b114').forEach(function (e) { e.remove(); });
      var n = unseenReplies();
      if (n && r !== 'ask' && r !== 'contact') ['#/ask', '#/contact'].forEach(function (hh) { var l = document.querySelector('a[href="' + hh + '"]'); if (l) l.append(el('span', { class: 'b114', title: tx('ফার্মেসির নতুন উত্তর', 'New reply') }, '💬 ' + n)); });
      if (r === 'catalog' || r === '') shopTools(a);
      else if (r === 'wishlist') wishPage(a);
      else if (r === 'orders') ordersPage(a);
      else if (r === 'info') helpPage(a);
      else if (r === 'contact' || r === 'ask') {
        if (n) { var h1 = a.querySelector('h1'); h1 && h1.after(el('div', { class: 'c114 w', role: 'status' }, '💬 ' + tx('ফার্মেসির ' + n + 'টি নতুন উত্তর এসেছে — নিচে “আপনার পাঠানো বার্তা” দেখুন।', n + ' new repl' + (n > 1 ? 'ies' : 'y') + ' from the pharmacy — see your messages below.'))); localStorage.setItem('mc_rseen114', new Date().toISOString()); }
        if (r === 'contact') contactPage(a); else askPage(a);
      }
    } catch (e) { /* এক্সট্রা কখনো শপ ভাঙবে না */ }
  };
  try { render(); } catch (e) { }
})();
