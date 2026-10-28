/* v87 — Ops Panel:
   • Orders: খোঁজা (নং/নাম/ফোন), স্ট্যাটাস-চিপ (সংখ্যাসহ), ⏱ অপেক্ষার সময়/দেরি-সতর্কতা (৩০ মিনিটের বেশি Pending), 💬 WhatsApp, গ্রাহকের ডেলিভারি-সময় ও নোট, সব অর্ডার CSV
   • Customers: খোঁজা, সেগমেন্ট (নতুন/নিয়মিত/শীর্ষ/৬০+ দিন আসেননি), শেষ অর্ডার, গড় অর্ডার, CSV, WhatsApp
   • Reports: সময়-তুলনা (আগের সমান সময়ের সাথে) ও শীর্ষ পণ্য
   • Dashboard: "এখনই দরকার" কার্ড (দেরির অর্ডার, Rx রিভিউ, রাইডার ছাড়া, কম স্টক) */
(function () {
  'use strict';
  if (typeof V === 'undefined' || typeof h !== 'function' || typeof D === 'undefined') return;
  var esc = function (t) { return String(t == null ? '' : t); };
  var wa = function (ph, msg) { var p = String(ph || '').replace(/\D/g, ''); if (/^01/.test(p)) p = '88' + p; return 'https://wa.me/' + p + (msg ? '?text=' + encodeURIComponent(msg) : ''); };
  var WAIT = { 'Pending': 1, 'Confirmed': 1, 'Prescription Review': 1 };
  var age = function (m) { m = Math.max(0, Math.round(m)); return m < 60 ? m + ' মি' : m < 1440 ? Math.floor(m / 60) + 'ঘ ' + (m % 60) + 'মি' : Math.floor(m / 1440) + 'দিন ' + Math.floor(m % 1440 / 60) + 'ঘ'; };
  var mins = function (o) { return (Date.now() - new Date(o.at).getTime()) / 6e4; };
  function csv(name, rows) { var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }; var a = h('a', { href: URL.createObjectURL(new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv;charset=utf-8' })), download: name }); document.body.append(a); a.click(); a.remove(); }
  var canOrd = function () { return typeof R !== 'undefined' && ['Owner', 'Pharmacist'].indexOf(R) > -1; };

  /* ---------- ORDERS ---------- */
  var oq = '', ost = 'all';
  if (V.orders) {
    var ord0 = V.orders;
    V.orders = function () {
      var r = ord0.apply(this, arguments), L = D.orders.slice().reverse(), rows = [].slice.call(r.querySelectorAll('tbody tr'));
      if (!L.length || rows.length !== L.length) return r;
      rows.forEach(function (tr, i) {
        var o = L[i], c0 = tr.children[0], c1 = tr.children[1];
        if (WAIT[o.status]) { var m = mins(o), late = m > 30 && o.status !== 'Confirmed' || m > 180; c0.append(h('div', { class: late ? 'bad' : 'muted', style: 'font-size:.8rem;white-space:nowrap' }, (late ? '⚠ ' : '⏱ ') + age(m))); }
        if (o.slot) c1.append(h('div', { class: 'muted', style: 'font-size:.8rem' }, '🕒 ' + o.slot));
        if (o.note) c1.append(h('div', { class: 'muted', style: 'font-size:.8rem' }, '📝 ' + esc(o.note).slice(0, 120)));
        if (o.phone) c1.append(h('a', { href: wa(o.phone, 'আপনার অর্ডার ' + o.no + ' সম্পর্কে — ' + (D.settings.store || 'MediCare')), target: '_blank', rel: 'noopener', style: 'font-size:.8rem;display:inline-block;margin-top:2px' }, '💬 WhatsApp'));
        tr.dataset.v87 = (o.no + ' ' + o.customer + ' ' + o.phone + ' ' + (o.items || []).map(function (x) { return x.name; }).join(' ')).toLowerCase(); tr.dataset.st = o.status; tr.dataset.late = WAIT[o.status] && mins(o) > 30 && o.status !== 'Confirmed' ? '1' : '';
      });
      var cnt = {}; L.forEach(function (o) { cnt[o.status] = (cnt[o.status] || 0) + 1; });
      var late = L.filter(function (o) { return WAIT[o.status] && o.status !== 'Confirmed' && mins(o) > 30; }).length;
      function apply() { rows.forEach(function (tr) { var ok = (!oq || tr.dataset.v87.indexOf(oq) > -1) && (ost === 'all' || (ost === 'late' ? tr.dataset.late === '1' : tr.dataset.st === ost)); tr.style.display = ok ? '' : 'none'; }); chips.querySelectorAll('button[data-s]').forEach(function (b) { b.className = b.dataset.s === ost ? 'on' : ''; }); }
      var chips = h('div', { class: 'row', style: 'flex-wrap:wrap;gap:.4rem;margin:.4rem 0' });
      var defs = [['all', 'সব (' + L.length + ')']]; if (late) defs.push(['late', '⚠ দেরি (' + late + ')']); STATUS.forEach(function (s) { if (cnt[s]) defs.push([s, s + ' (' + cnt[s] + ')']); });
      defs.forEach(function (d) { chips.append(h('button', { 'data-s': d[0], type: 'button', onclick: function () { ost = d[0]; apply(); } }, d[1])); });
      var s = h('input', { type: 'search', placeholder: '🔎 অর্ডার নং / নাম / ফোন / ওষুধ', 'aria-label': 'অর্ডার খুঁজুন', value: oq, oninput: function (e) { oq = e.target.value.trim().toLowerCase(); apply(); } });
      var bar = h('div', { class: 'row', style: 'flex-wrap:wrap;gap:.5rem;align-items:center' }, s);
      bar.append(h('button', { type: 'button', onclick: function () { csv('orders-' + today() + '.csv', [['No', 'Date', 'Customer', 'Phone', 'Address', 'Items', 'Total', 'Pay', 'Status', 'Slot', 'Note']].concat(L.map(function (o) { return [o.no, o.at, o.customer, o.phone, o.addr, (o.items || []).map(function (i) { return i.name + 'x' + i.qty; }).join('; '), o.total, o.pay, o.status, o.slot || '', o.note || '']; }))); toast('CSV নামানো হয়েছে'); } }, '⬇ সব অর্ডার CSV'));
      r.insertBefore(chips, r.firstChild); r.insertBefore(bar, r.firstChild); apply(); return r;
    };
  }

  /* ---------- CUSTOMERS ---------- */
  var cq = '', cseg = 'all';
  V.customers = function () {
    var m = {};
    D.orders.forEach(function (o) {
      var k = o.phone || o.customer, c = m[k] || (m[k] = { n: o.customer, ph: o.phone, t: 0, c: 0, last: '', real: 0 }); c.c++; if (o.status !== 'Refunded' && o.status !== 'Cancelled') { c.t += +o.total || 0; c.real++; if (o.at > c.last) c.last = o.at; }
    });
    var L = Object.keys(m).map(function (k) { var c = m[k]; c.avg = c.real ? c.t / c.real : 0; c.ago = c.last ? Math.floor((Date.now() - new Date(c.last).getTime()) / 864e5) : null; return c; });
    var seg = { all: function () { return true; }, new: function (c) { return c.real <= 1; }, repeat: function (c) { return c.real >= 3; }, top: function (c) { return c.t >= 2000; }, lapsed: function (c) { return c.ago != null && c.ago >= 60; } };
    var names = { all: 'সব', new: '🆕 নতুন (১ অর্ডার)', repeat: '🔁 নিয়মিত (৩+)', top: '⭐ শীর্ষ (৳২০০০+)', lapsed: '😴 ৬০+ দিন আসেননি' };
    var box = h('div', {}), chips = h('div', { class: 'row', style: 'flex-wrap:wrap;gap:.4rem;margin:.4rem 0' });
    function draw() {
      var rows = L.filter(function (c) { return seg[cseg](c) && (!cq || (c.n + ' ' + c.ph).toLowerCase().indexOf(cq) > -1); }).sort(function (a, b) { return b.t - a.t; });
      chips.replaceChildren.apply(chips, Object.keys(names).map(function (k) { return h('button', { type: 'button', class: k === cseg ? 'on' : '', onclick: function () { cseg = k; draw(); } }, names[k] + ' (' + L.filter(seg[k]).length + ')'); }));
      box.replaceChildren(tbl(['Customer', 'Phone', 'Orders', 'Spend', 'Avg', 'Last order', 'Loyalty', ''], rows.map(function (c) { return h('tr', {}, h('td', {}, c.n), h('td', {}, c.ph), h('td', {}, c.c), h('td', {}, money(c.t)), h('td', {}, money(c.avg)), h('td', {}, c.last ? (c.ago === 0 ? 'আজ' : c.ago + ' দিন আগে') : '—'), h('td', {}, Math.floor(c.t / 100)), h('td', {}, c.ph ? h('a', { href: wa(c.ph, 'নমস্কার ' + c.n + ', ' + (D.settings.store || 'MediCare') + '-এর পক্ষ থেকে।'), target: '_blank', rel: 'noopener' }, '💬') : '')); })));
    }
    var s = h('input', { type: 'search', placeholder: '🔎 নাম / ফোন', 'aria-label': 'গ্রাহক খুঁজুন', value: cq, oninput: function (e) { cq = e.target.value.trim().toLowerCase(); draw(); } });
    var top = h('div', { class: 'row', style: 'flex-wrap:wrap;gap:.5rem;align-items:center' }, s, h('button', { type: 'button', onclick: function () { csv('customers-' + today() + '.csv', [['Name', 'Phone', 'Orders', 'Spend', 'Avg order', 'Last order', 'Loyalty']].concat(L.map(function (c) { return [c.n, c.ph, c.c, Math.round(c.t), Math.round(c.avg), c.last ? c.last.slice(0, 10) : '', Math.floor(c.t / 100)]; }))); toast('CSV নামানো হয়েছে'); } }, '⬇ CSV'), h('span', { class: 'muted' }, L.length + ' জন গ্রাহক (অনলাইন অর্ডার থেকে)'));
    draw(); return h('div', {}, top, chips, box);
  };

  /* ---------- REPORTS: তুলনা ---------- */
  if (V.reports) {
    var rep0 = V.reports, rng = 30;
    V.reports = function () {
      var r = rep0.apply(this, arguments);
      try {
        var k = function (x) { return new Date(new Date(x).getTime() + 216e5).toISOString().slice(0, 10); }, t0 = today(), d0 = function (n) { return k(Date.now() - n * 864e5); };
        var sales = D.sales.map(function (s) { return { at: s.at, total: +s.total || 0, items: s.items || [], src: 'POS' }; }).concat(D.orders.filter(function (o) { return o.status === 'Delivered'; }).map(function (o) { return { at: o.at, total: +o.total || 0, items: o.items || [], src: 'Online' }; }));
        var a = d0(rng - 1), pb = d0(2 * rng - 1), pe = d0(rng), cur = sales.filter(function (s) { var d = k(s.at); return d >= a && d <= t0; }), prv = sales.filter(function (s) { var d = k(s.at); return d >= pb && d <= pe; });
        var sum = function (L) { return L.reduce(function (x, s) { return x + s.total; }, 0); }, dl = function (c, p) { if (!(p > 0)) return c > 0 ? 'নতুন' : '—'; var q = Math.round((c - p) / p * 100); return (q >= 0 ? '▲ ' : '▼ ') + Math.abs(q) + '%'; };
        var prod = {}; cur.forEach(function (s) { s.items.forEach(function (i) { var p = prod[i.name] || (prod[i.name] = { q: 0, v: 0 }); p.q += +i.qty || 0; p.v += (+i.qty || 0) * (+i.price || 0); }); });
        var top = Object.keys(prod).map(function (n) { return [n, prod[n].q, prod[n].v]; }).sort(function (x, y) { return y[2] - x[2]; }).slice(0, 10);
        var sel = h('select', { 'aria-label': 'সময়', onchange: function (e) { rng = +e.target.value; go(); } }, [7, 30, 90].map(function (n) { return h('option', { value: n, selected: n === rng }, 'গত ' + n + ' দিন'); }));
        r.prepend(h('div', { class: 'card', style: 'margin-bottom:1rem' }, h('h2', {}, '🆚 আগের সময়ের সাথে তুলনা'), h('div', { class: 'row', style: 'align-items:center;gap:.6rem' }, sel, h('span', { class: 'muted' }, a + ' → ' + t0 + ' বনাম ' + pb + ' → ' + pe)),
          tbl(['', 'এই সময়', 'আগের সময়', 'বদল'], [['বিক্রি', money(sum(cur)), money(sum(prv)), dl(sum(cur), sum(prv))], ['বিল/অর্ডার', cur.length, prv.length, dl(cur.length, prv.length)], ['গড় বিল', money(cur.length ? sum(cur) / cur.length : 0), money(prv.length ? sum(prv) / prv.length : 0), dl(cur.length ? sum(cur) / cur.length : 0, prv.length ? sum(prv) / prv.length : 0)]].map(function (x) { return h('tr', {}, x.map(function (c) { return h('td', {}, c); })); })),
          h('h3', {}, '🏆 শীর্ষ ১০ পণ্য'), tbl(['পণ্য', 'ইউনিট', 'বিক্রি'], top.map(function (x) { return h('tr', {}, h('td', {}, x[0]), h('td', {}, x[1]), h('td', {}, money(x[2]))); })), h('p', { class: 'muted' }, 'POS বিক্রি + Delivered অনলাইন অর্ডার ধরে।')));
      } catch (e) { console.warn('ops-v87 reports', e); }
      return r;
    };
  }

  /* ---------- DASHBOARD: এখনই দরকার ---------- */
  if (V.dash) {
    var dash0 = V.dash;
    V.dash = function () {
      var r = dash0.apply(this, arguments);
      try {
        var late = D.orders.filter(function (o) { return (o.status === 'Pending' || o.status === 'Prescription Review') && mins(o) > 30; }), rx = D.orders.filter(function (o) { return o.status === 'Prescription Review'; }),
          noRider = D.orders.filter(function (o) { return (o.status === 'Packed' || o.status === 'Shipped') && !o.rider; }), cod = D.orders.filter(function (o) { return o.status === 'Delivered' && /cash/i.test(o.pay || '') && o.rider && !o.codSettledAt; });
        var go2 = function (t) { return function () { tab = t; go(); }; }, items = [];
        if (late.length) items.push(['⚠', late.length + 'টি অর্ডার ৩০ মিনিটের বেশি অপেক্ষায় (সবচেয়ে পুরোনো ' + age(Math.max.apply(null, late.map(mins))) + ')', 'orders']);
        if (rx.length) items.push(['📝', rx.length + 'টি প্রেসক্রিপশন রিভিউ বাকি', 'rx']);
        if (noRider.length) items.push(['🛵', noRider.length + 'টি অর্ডারে রাইডার অ্যাসাইন হয়নি', 'delivery']);
        if (cod.length) items.push(['💵', cod.length + 'টি COD ক্যাশ হিসাব বাকি (' + money(cod.reduce(function (a, o) { return a + (+o.total || 0); }, 0)) + ')', 'delivery']);
        var ACCs = typeof ACC !== 'undefined' && ACC[R] || [];
        items = items.filter(function (x) { return ACCs.indexOf(x[2]) > -1; });
        r.prepend(h('div', { class: 'card', style: 'margin-bottom:1rem;border-left:4px solid ' + (items.length ? '#e08a00' : '#2e9e5b') }, h('h2', {}, items.length ? '🔥 এখনই দরকার' : '✅ এই মুহূর্তে সব ঠিক আছে'), items.length ? h('ul', { style: 'list-style:none;padding:0;margin:0' }, items.map(function (x) { return h('li', { style: 'margin:.3rem 0' }, x[0] + ' ' + x[1] + ' ', h('button', { type: 'button', onclick: go2(x[2]) }, 'দেখুন →')); })) : h('p', { class: 'muted' }, 'দেরির অর্ডার, Rx রিভিউ বা রাইডার-বাকি নেই।')));
      } catch (e) { console.warn('ops-v87 dash', e); }
      return r;
    };
  }
  try { go(); } catch (e) { }
})();
