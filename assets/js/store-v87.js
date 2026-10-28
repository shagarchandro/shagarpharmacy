/* v87 — Online Shop:
   • চেকআউটে পছন্দের ডেলিভারি-সময় (ASAP / সকাল / দুপুর / সন্ধ্যা) + ডেলিভারি নোট → অর্ডারে slot/note (Ops Panel-এ দেখা যায়)
   • অর্ডার সফল হলে: 💬 WhatsApp-এ ফার্মেসিকে অর্ডার-বিবরণ পাঠান
   • 🔁 রিফিল রিমাইন্ডার (১৫/৩০/৬০ দিন): সময় হলে শপের হোমে ব্যানার + এক ক্লিকে আগের ওষুধ কার্টে (শুধু এই ব্রাউজারে সংরক্ষিত; SMS/পুশ নয়) */
(function () {
  'use strict';
  if (typeof views === 'undefined' || typeof h !== 'function' || typeof db !== 'function') return;
  var isBn = function () { try { return typeof lang === 'function' && lang() === 'bn'; } catch (e) { return false; } };
  var tx = function (b, e) { return isBn() ? b : e; };
  var SLOTS = [['', 'যত দ্রুত সম্ভব (ASAP)'], ['সকাল ৯–১২', 'সকাল ৯–১২'], ['দুপুর ১২–৪', 'দুপুর ১২–৪'], ['সন্ধ্যা ৪–৯', 'সন্ধ্যা ৪–৯']];
  var todayS = function () { return new Date(Date.now() + 216e5).toISOString().slice(0, 10); };
  var addD = function (n) { return new Date(Date.now() + 216e5 + n * 864e5).toISOString().slice(0, 10); };
  var rj = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var RK = 'mc_refill';

  /* ---------- চেকআউট ---------- */
  if (views.checkout) {
    var co0 = views.checkout;
    views.checkout = function () {
      var f = co0.apply(this, arguments);
      try {
        if (f && f.tagName === 'FORM' && !f.querySelector('[name=slot]')) {
          var box = h('fieldset', {}, h('legend', {}, tx('ডেলিভারি পছন্দ', 'Delivery preference')),
            h('label', {}, tx('পছন্দের সময়', 'Preferred time'), h('select', { name: 'slot' }, SLOTS.map(function (s) { return h('option', { value: s[0] }, s[1]); }))),
            h('label', {}, tx('ডেলিভারি নোট (ঐচ্ছিক)', 'Delivery note (optional)'), h('input', { name: 'note', maxlength: 200, placeholder: tx('যেমন: গেটে কল দিন, ৩য় তলা', 'e.g. call at the gate, 3rd floor') })));
          var sub = f.querySelector('button[type=submit], button:not([type])'); if (sub) sub.parentNode.insertBefore(box, sub); else f.append(box);
        }
      } catch (e) { console.warn('store-v87 checkout', e); }
      return f;
    };
  }
  if (typeof place === 'function') {
    var place0 = place;
    place = function (f, rx) {
      var slot = f.elements.slot ? f.elements.slot.value : '', note = f.elements.note ? f.elements.note.value.trim().slice(0, 200) : '', n0 = db().orders.length;
      var r = place0.apply(this, arguments);
      try { var d = db(); if (d.orders.length > n0 && (slot || note)) { var o = d.orders[d.orders.length - 1]; if (slot) o.slot = slot; if (note) o.note = note; save(d); } } catch (e) { console.warn('store-v87 place', e); }
      return r;
    };
  }

  /* ---------- সফল পেজ ---------- */
  if (views.success) {
    var su0 = views.success;
    views.success = function () {
      var el = su0.apply(this, arguments);
      try {
        var no = location.hash.split('/')[2], D2 = db(), o = D2.orders.find(function (x) { return x.no === no; }); if (!o || !el || !el.append) return el;
        if (o.slot) el.append(h('p', {}, '🕒 ' + tx('পছন্দের সময়: ', 'Preferred time: ') + o.slot));
        if (o.note) el.append(h('p', { class: 'muted' }, '📝 ' + o.note));
        var ph = String((D2.settings || {}).phone || '').replace(/\D/g, ''); if (/^01/.test(ph)) ph = '88' + ph;
        if (ph.length >= 10) {
          var msg = (D2.settings.store || 'MediCare') + ' — ' + tx('আমার অর্ডার ', 'My order ') + o.no + '\n' + (o.items || []).map(function (i) { return '• ' + i.name + ' × ' + i.qty; }).join('\n') + '\n' + tx('মোট ', 'Total ') + money(o.total) + (o.slot ? '\n' + tx('সময়: ', 'Time: ') + o.slot : '') + '\n' + o.customer + ' · ' + o.phone;
          el.append(h('p', {}, h('a', { class: 'btn2', href: 'https://wa.me/' + ph + '?text=' + encodeURIComponent(msg), target: '_blank', rel: 'noopener' }, '💬 ' + tx('WhatsApp-এ ফার্মেসিকে জানান', 'Send details on WhatsApp'))));
        }
        var done = rj(RK, []).some(function (x) { return x.no === o.no; });
        var sel = h('select', { 'aria-label': tx('কত দিন পরে', 'After how many days') }, [15, 30, 60].map(function (n) { return h('option', { value: n, selected: n === 30 }, n + ' ' + tx('দিন পরে', 'days')); }));
        var box = h('div', { class: 'card', style: 'margin-top:1rem' }, h('h3', {}, '🔁 ' + tx('রিফিল রিমাইন্ডার', 'Refill reminder')),
          h('p', { class: 'muted' }, tx('নিয়মিত ওষুধ ফুরানোর আগে এই ব্রাউজারে মনে করিয়ে দেব (SMS/পুশ নয়)।', 'We will remind you in this browser before your medicine runs out (no SMS/push).')));
        function paint() {
          var ex = box.querySelector('.v87r'); if (ex) ex.remove();
          if (rj(RK, []).some(function (x) { return x.no === o.no; })) { box.append(h('p', { class: 'v87r ok' }, '✅ ' + tx('রিমাইন্ডার চালু আছে', 'Reminder is on'), ' ', h('button', { type: 'button', onclick: function () { localStorage.setItem(RK, JSON.stringify(rj(RK, []).filter(function (x) { return x.no !== o.no; }))); paint(); } }, tx('বন্ধ করুন', 'Turn off')))); return; }
          box.append(h('div', { class: 'v87r row' }, sel, h('button', { type: 'button', class: 'btn2', onclick: function () { var L = rj(RK, []); L.push({ no: o.no, due: addD(+sel.value), items: (o.items || []).map(function (i) { return { pid: i.pid, name: i.name, qty: i.qty }; }) }); localStorage.setItem(RK, JSON.stringify(L.slice(-20))); toast(tx('রিমাইন্ডার চালু হয়েছে', 'Reminder set')); paint(); } }, tx('রিমাইন্ডার চালু করুন', 'Remind me'))));
        }
        paint(); el.append(box);
      } catch (e) { console.warn('store-v87 success', e); }
      return el;
    };
  }

  /* ---------- হোম: রিফিল ব্যানার ---------- */
  if (views.catalog) {
    var ca0 = views.catalog;
    views.catalog = function () {
      var el = ca0.apply(this, arguments);
      try {
        var L = rj(RK, []), due = L.filter(function (x) { return x.due <= todayS(); });
        if (due.length && el && el.insertBefore) {
          var names = {}, want = {}; due.forEach(function (x) { x.items.forEach(function (i) { names[i.pid] = i.name; want[i.pid] = Math.max(want[i.pid] || 0, i.qty); }); });
          var ids = Object.keys(names);
          el.insertBefore(h('div', { class: 'card', style: 'border-left:4px solid #e08a00;margin:.6rem 0', role: 'status' }, h('h3', {}, '💊 ' + tx('রিফিল করার সময় হয়েছে?', 'Time to refill?')), h('p', {}, ids.map(function (i) { return names[i] + ' ×' + want[i]; }).join(', ')),
            h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn', onclick: function () {
              var D2 = db(), c = cart(), n = 0, miss = 0; ids.forEach(function (i) { var p = D2.products.find(function (x) { return x.id === i; }), st = p ? stock(D2, i) : 0; if (p && st > 0) { c[i] = Math.min((c[i] || 0) + want[i], st); n++; } else miss++; });
              localStorage.setItem(RK, JSON.stringify(L.filter(function (x) { return due.indexOf(x) < 0; }))); setCart(c); toast(n ? n + tx('টি কার্টে যোগ হয়েছে', ' added to cart') + (miss ? ' (' + miss + tx('টি স্টকে নেই', ' unavailable') + ')' : '') : tx('স্টকে নেই', 'Unavailable'), !n); if (n) location.hash = '#/cart';
            } }, '🛒 ' + tx('কার্টে যোগ করুন', 'Add to cart')), h('button', { type: 'button', class: 'btn2', onclick: function () { L.forEach(function (x) { if (due.indexOf(x) > -1) x.due = addD(3); }); localStorage.setItem(RK, JSON.stringify(L)); render(); } }, tx('৩ দিন পরে', 'Later (3 days)')), h('button', { type: 'button', class: 'btn2', onclick: function () { localStorage.setItem(RK, JSON.stringify(L.filter(function (x) { return due.indexOf(x) < 0; }))); render(); } }, tx('বাদ দিন', 'Dismiss')))), el.firstChild);
        }
      } catch (e) { console.warn('store-v87 refill', e); }
      return el;
    };
  }
  try { render(); } catch (e) { }
})();
