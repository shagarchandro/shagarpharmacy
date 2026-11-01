/* v115 — Control Center → 📣 Customer Voice
   গ্রাহকের কথা এক জায়গায়: ওষুধের চাহিদা (অনুরোধ + স্টকে-এলে-জানান), জরুরি প্রশ্ন (উত্তরহীন, কত ঘণ্টা), অর্ডার-রেটিং; এক ক্লিকে সবাইকে উত্তর;
   সাথে শপের নতুন সুবিধা (ফিল্টার, ওষুধ-অনুরোধ, উইশলিস্ট টুল, অর্ডার টুল/রেটিং, Help/Contact/Ask এক্সট্রা, 💬 ব্যাজ) চালু/বন্ধের সুইচ। */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  var SW = [['filters', '💊 ক্যাটালগে ধরন/ব্র্যান্ড ফিল্টার ও তালিকা-ভিউ'], ['medreq', '📩 "ওষুধটি চাই" অনুরোধ-ফর্ম'], ['wishtools', '♡ Wishlist: সাজানো/শেয়ার/স্টক-জানান'], ['orderplus', '📦 Orders: ফিল্টার, ইনভয়েস, "সাহায্য" বাটন'], ['rating', '⭐ ডেলিভারির পর রেটিং নেওয়া'], ['helpplus', '❓ Help: ক্যাটেগরি, জরুরি নম্বর, টিপস'], ['contactplus', '✉ Contact: খোলা/বন্ধ, WhatsApp/ম্যাপ, কলব্যাক'], ['askplus', '💊 Ask: জরুরি/কার জন্য/অ্যালার্জি/কলব্যাক'], ['badge', '💬 উত্তর এলে নেভে ব্যাজ/ব্যানার']];
  var tm = function (t) { return new Date(t).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' }); };
  function csv(name, rows) { var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"'; }, b = new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500); }
  function css() {
    if (document.getElementById('v115css')) return; var s = document.createElement('style'); s.id = 'v115css';
    s.textContent = '.v115k{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.6rem;margin:.6rem 0}.v115k div{border:1px solid var(--br);border-radius:12px;padding:.6rem .8rem;background:var(--card)}.v115k b{display:block;font-size:1.25rem}.v115k small{color:var(--mut)}.v115k .bad b{color:#b42318}.v115k .good b{color:#0b6b3a}' +
      '.v115bar{display:flex;align-items:center;gap:.5rem;margin:.2rem 0}.v115bar i{display:block;height:10px;border-radius:6px;background:#2e9e5b}.v115bar span{min-width:2.2rem;font-size:.85rem}.v115r{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center}.v115r input{flex:1;min-width:180px}' +
      '.v115tag{display:inline-block;border-radius:99px;padding:.05rem .55rem;font-size:.78rem;font-weight:700;background:#e5efec}.v115tag.b{background:#fde2e0;color:#7a1410}.v115tag.g{background:#d9f5e5;color:#0b5a32}.v115tag.w{background:#fff0c2}.v115low{background:#fde8e6}';
    document.head.appendChild(s);
  }
  var parse = function (m) { var r = /^(?:\S+\s)?.*? (Q[A-Z0-9]{3,8})(?: \[[^\]]*\])? from (.+?) \((\+?\d[\d-]{8,})\): (.*)$/s.exec(m || ''); return r ? { ref: r[1], who: r[2], ph: r[3], text: r[4] } : null; };

  window.CCX = function (c) {
    var x = prev(c), h = c.h;
    x.panels.voice = function () {
      css(); var D = c.db(), s = (D.settings = D.settings || {}), notes = D.notes || [], now = Date.now(), off = s.shopX || [];
      var reply = function (list, text) { text = String(text || '').trim().slice(0, 300); if (text.length < 3) return c.bad('উত্তর লিখুন (৩+ অক্ষর)'); var d = c.db(), n = 0; list.forEach(function (id) { var x = (d.notes || []).find(function (q) { return q.id === id; }); if (x && !x.reply) { x.reply = { text: text, by: 'Control Center', at: new Date().toISOString() }; x.read = true; n++; } }); c.save(d); c.audit('Customer Voice: replied to ' + n + ' message(s)'); c.ok(n + 'জনকে উত্তর পাঠানো হয়েছে'); c.show('voice'); };
      /* --- ওষুধের চাহিদা --- */
      var dem = {};
      notes.forEach(function (n) {
        var m = n.msg || '', name = null, who = null, ph = null, ref = null, kind = null;
        if (/Medicine request/.test(m)) { var p = parse(m); if (p) { name = p.text.replace(/^Medicine request:\s*/i, ''); who = p.who; ph = p.ph; ref = p.ref; kind = 'req'; } }
        else { var b = /^Back-in-stock request:\s*(.+?)\s*\(from (.*)\)\s*$/.exec(m); if (b) { name = b[1]; who = b[2]; kind = 'bis'; } }
        if (!name) return; var k = name.toLowerCase().trim(), g = dem[k] || (dem[k] = { name: name, ids: [], who: {}, req: 0, bis: 0, last: '', open: [] });
        g.who[String(who || ph || n.id).toLowerCase().trim()] = 1; g[kind]++; g.ids.push(n.id); if ((n.at || '') > g.last) g.last = n.at; if (!n.reply && kind === 'req') g.open.push(n.id);
      });
      var inStock = function (nm) { var p = (D.products || []).filter(function (p) { return p.name.toLowerCase() === nm.toLowerCase() || (nm.length > 3 && p.name.toLowerCase().indexOf(nm.toLowerCase()) === 0); })[0]; if (!p) return null; var q = (D.batches || []).filter(function (b) { return b.pid === p.id && b.qty > 0 && b.exp >= new Date(now + 216e5).toISOString().slice(0, 10); }).reduce(function (t, b) { return t + b.qty; }, 0); return q; };
      var rows = Object.keys(dem).map(function (k) { var g = dem[k]; g.n = Object.keys(g.who).length; g.stock = inStock(g.name); return g; }).sort(function (a, b) { return b.n - a.n || (b.last > a.last ? 1 : -1); });
      var demT = c.tbl(['ওষুধ', 'কতজন চান', 'অনুরোধ / জানান', 'শেষ', 'এখন স্টক', 'উত্তর দিন'], rows.slice(0, 25).map(function (g) {
        var inp = h('input', { placeholder: 'গ্রাহককে উত্তর…', maxlength: 300, 'aria-label': 'Reply for ' + g.name });
        var quick = function (t, label) { return c.btn(label, function () { reply(g.open, t); }); };
        return h('tr', {}, h('td', {}, h('b', {}, g.name)), h('td', {}, g.n), h('td', {}, g.req + ' / ' + g.bis), h('td', {}, tm(g.last)),
          h('td', {}, g.stock == null ? h('span', { class: 'v115tag' }, 'তালিকায় নেই') : g.stock > 0 ? h('span', { class: 'v115tag g' }, g.stock + ' আছে') : h('span', { class: 'v115tag b' }, 'শেষ')),
          h('td', {}, g.open.length ? h('div', { class: 'v115r' }, quick('আপনার অনুরোধ করা ওষুধটি আনার ব্যবস্থা করছি। স্টকে এলে কল করব।', '✅ আনাচ্ছি'), quick('ওষুধটি এখন স্টকে আছে — আপনি অর্ডার করতে পারেন।', '📦 স্টকে এসেছে'), quick('দুঃখিত, এই ওষুধ আমরা রাখছি না। বিকল্প জানতে ফার্মাসিস্টকে জিজ্ঞাসা করুন।', '🚫 রাখব না'), inp, c.btn('পাঠান', function () { reply(g.open, inp.value); })) : h('small', { class: 'muted' }, g.req ? 'সবাইকে উত্তর দেওয়া হয়েছে' : '—')));
      }), 'এখনো কোনো চাহিদা নেই');
      /* --- জরুরি / উত্তরহীন প্রশ্ন --- */
      var asks = notes.filter(function (n) { return n.kind === 'ask' && /Pharmacist question/.test(n.msg || '') && !n.reply; }).map(function (n) { var p = parse(n.msg) || { who: '?', ph: '', text: n.msg }; return { n: n, p: p, urgent: /URGENT/.test(n.msg), age: Math.round((now - Date.parse(n.at)) / 36e5) }; }).sort(function (a, b) { return (b.urgent - a.urgent) || (b.age - a.age); });
      var urg = asks.filter(function (a) { return a.urgent; }), oldest = asks.length ? Math.max.apply(null, asks.map(function (a) { return a.age; })) : 0;
      var askT = c.tbl(['', 'গ্রাহক', 'প্রশ্ন', 'কত আগে', 'উত্তর'], asks.slice(0, 20).map(function (a) {
        var inp = h('input', { placeholder: 'উত্তর লিখুন…', maxlength: 300, 'aria-label': 'Reply ' + a.p.ref });
        return h('tr', { class: a.urgent ? 'v115low' : '' }, h('td', {}, a.urgent ? h('span', { class: 'v115tag b' }, '🔴 জরুরি') : ''), h('td', {}, a.p.who + ' · ' + a.p.ph), h('td', { style: 'max-width:340px' }, a.p.text.slice(0, 220)), h('td', {}, a.age + ' ঘণ্টা'), h('td', {}, h('div', { class: 'v115r' }, inp, c.btn('পাঠান', function () { reply([a.n.id], inp.value); }))));
      }), 'সব প্রশ্নের উত্তর দেওয়া হয়েছে 👍');
      /* --- রেটিং --- */
      var rated = (D.orders || []).filter(function (o) { return o.rating && o.rating.stars; }), dist = [0, 0, 0, 0, 0, 0]; rated.forEach(function (o) { dist[o.rating.stars]++; });
      var avg = rated.length ? rated.reduce(function (t, o) { return t + o.rating.stars; }, 0) / rated.length : 0, low = rated.filter(function (o) { return o.rating.stars <= 2; }), mx = Math.max.apply(null, dist.concat([1]));
      var delivered = (D.orders || []).filter(function (o) { return o.status === 'Delivered'; }).length;
      var rateT = c.tbl(['অর্ডার', 'গ্রাহক', 'রেটিং', 'মন্তব্য', 'সময়'], rated.slice().sort(function (a, b) { return a.rating.stars - b.rating.stars || (b.rating.at > a.rating.at ? 1 : -1); }).slice(0, 15).map(function (o) { return h('tr', { class: o.rating.stars <= 2 ? 'v115low' : '' }, h('td', {}, o.no), h('td', {}, o.customer + (o.rating.stars <= 2 ? ' · ' + o.phone : '')), h('td', {}, '★'.repeat(o.rating.stars) + '☆'.repeat(5 - o.rating.stars)), h('td', {}, o.rating.comment || '—'), h('td', {}, tm(o.rating.at))); }), 'এখনো কোনো রেটিং নেই');
      /* --- শপ-সুবিধার সুইচ --- */
      var boxes = {}, sw = h('form', { class: 'cc-form', onsubmit: function (e) {
        e.preventDefault(); var d = c.db(); d.settings = d.settings || {}; d.settings.shopX = SW.filter(function (k) { return !boxes[k[0]].checked; }).map(function (k) { return k[0]; }); c.save(d); c.audit('Shop extras: off=' + (d.settings.shopX.join(',') || 'none')); c.ok('সেভ হয়েছে — শপ রিলোড করলে কার্যকর'); c.show('voice');
      } }, h('div', { class: 'cc-grid' }, SW.map(function (k) { var cb = h('input', { type: 'checkbox', name: k[0], checked: off.indexOf(k[0]) < 0 ? 'checked' : null }); boxes[k[0]] = cb; return h('div', { class: 'cc-card' }, h('label', { class: 'cc-chk' }, cb, ' ' + k[1])); })), h('button', { class: 'btn' }, 'সুবিধাগুলো সেভ করুন'));
      var kp = function (a) { return h('div', { class: 'v115k' }, a.map(function (r) { return h('div', { class: r[2] || '' }, h('b', {}, r[1]), h('small', {}, r[0])); })); };
      return h('div', {}, h('h2', {}, '📣 Customer Voice'), h('p', { class: 'muted' }, 'গ্রাহক শপ থেকে যা চেয়েছে, জিজ্ঞেস করেছে বা রেটিং দিয়েছে — এক জায়গায়। উত্তর দিলে গ্রাহক শপের Ask/Contact পেজে 💬 ব্যাজসহ দেখে।'),
        kp([['চাহিদা-তালিকায় ওষুধ', rows.length], ['উত্তরহীন প্রশ্ন', asks.length, asks.length ? 'bad' : 'good'], ['🔴 জরুরি (উত্তরহীন)', urg.length, urg.length ? 'bad' : 'good'], ['সবচেয়ে পুরনো অপেক্ষা', oldest + ' ঘণ্টা', oldest > 24 ? 'bad' : ''], ['গড় রেটিং', rated.length ? avg.toFixed(1) + ' ★' : '—', avg && avg < 3.5 ? 'bad' : 'good'], ['রেটিং দিয়েছে', rated.length + ' / ' + delivered + ' ডেলিভারড'], ['কম রেটিং (≤২★)', low.length, low.length ? 'bad' : 'good']]),
        h('h3', {}, '💊 ওষুধের চাহিদা (কেনার সিদ্ধান্তে কাজে লাগবে)'), demT, rows.length ? h('p', {}, c.btn('⬇ CSV', function () { csv('demand-' + new Date().toISOString().slice(0, 10) + '.csv', [['Medicine', 'Customers', 'Requests', 'BackInStock', 'Last', 'Stock']].concat(rows.map(function (g) { return [g.name, g.n, g.req, g.bis, g.last, g.stock == null ? 'not listed' : g.stock]; }))); }, 'btn')) : '',
        h('h3', {}, '❓ উত্তরহীন প্রশ্ন (জরুরি আগে)'), askT,
        h('h3', {}, '⭐ অর্ডার-রেটিং'), rated.length ? h('div', {}, [5, 4, 3, 2, 1].map(function (n) { return h('div', { class: 'v115bar' }, h('span', {}, n + '★'), h('i', { style: 'width:' + Math.round(dist[n] / mx * 220) + 'px' }), h('span', {}, dist[n])); })) : '', rateT,
        h('h3', {}, '🛍 শপের নতুন সুবিধা — চালু/বন্ধ'), sw);
    };
    x.tabs.push(['voice', '📣 Customer Voice']);
    return x;
  };
})();
