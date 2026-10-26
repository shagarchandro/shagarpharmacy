/* Customers v57: real SMS / WhatsApp messages (the old SMS button only showed a fake "SMS sent" toast), date of birth is now
   actually saved (the form field existed but was ignored), join date is kept on edit, and a follow-up panel:
   dues to collect, birthdays, inactive customers — computed from real POS sales — with one-tap WhatsApp/SMS and CSV. */
(function () {
  'use strict';
  if (typeof customers === 'undefined' || !document.getElementById('customersGrid')) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function el(t, a, kids) { var e = document.createElement(t); a = a || {}; for (var k in a) { if (k === 'text') e.textContent = a[k]; else if (k.slice(0, 2) === 'on') e[k] = a[k]; else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(c); }); return e; }
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var dayOf = function (iso) { return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); };
  var today = function () { return dayOf(Date.now()); };
  var ph = function (p) { return String(p || '').replace(/[^\d+]/g, ''); };
  var store = function () { return (rj('pharmacy_settings', {}).storeName || rj('pharmacy_settings', {}).store || 'our pharmacy'); };
  function msgFor(c, kind) {
    var hi = 'Hello ' + c.name + ', ';
    if (kind === 'due' || (kind == null && c.due > 0)) return hi + 'this is a friendly reminder from ' + store() + ': your outstanding balance is ' + tk(c.due) + '. Please visit us or pay at your convenience. Thank you!';
    if (kind === 'bday') return hi + 'happy birthday from all of us at ' + store() + '! 🎂 Stay healthy and happy.';
    if (kind === 'refill') return hi + 'আপনার ' + (c._med || 'ওষুধ') + ' সম্ভবত শেষ হয়ে আসছে। ' + store() + ' থেকে রিফিল নিতে চাইলে জানাবেন — আমরা প্রস্তুত রাখব। 💊';
    if (kind === 'back') return hi + 'we haven\'t seen you in a while at ' + store() + '. If you need any medicine or advice, we are here to help.';
    return hi + 'this is a message from ' + store() + '. How can we help you today?';
  }
  function send(c, how, kind) { var p = ph(c.phone); if (!p) return showToast('No phone number saved', 'warning'); window.open(how === 'sms' ? 'sms:' + p + '?body=' + encodeURIComponent(msgFor(c, kind)) : 'https://wa.me/' + p.replace(/^\+/, '') + '?text=' + encodeURIComponent(msgFor(c, kind)), '_blank', 'noopener'); }
  sendSMS = function () { var c = customers.find(function (x) { return x.id === currentCustomerId; }); if (c) send(c, 'sms'); };
  sendWhatsApp = function () { var c = customers.find(function (x) { return x.id === currentCustomerId; }); if (c) send(c, 'wa'); };

  // ---- save DOB, keep join date
  var _sc = saveCustomer;
  saveCustomer = function () {
    var editId = document.getElementById('editCustomerId').value, dob = document.getElementById('custDob').value, name = document.getElementById('custName').value.trim(), phone = document.getElementById('custPhone').value.trim();
    var old = editId ? customers.find(function (c) { return c.id == editId; }) : null, keep = old ? { joinDate: old.joinDate } : null, n0 = customers.length;
    _sc.apply(this, arguments);
    var c = editId ? customers.find(function (x) { return x.id == editId; }) : (customers.length > n0 ? customers[customers.length - 1] : null);
    if (c) { if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) dob = ''; c.dob = dob || ''; if (keep && keep.joinDate) c.joinDate = keep.joinDate; saveCustomersToStorage(); draw(); }
  };
  var _ec = editCustomer; editCustomer = function (id) { _ec.apply(this, arguments); var c = customers.find(function (x) { return x.id === id; }); var f = document.getElementById('custDob'); if (f) f.value = (c && c.dob) || ''; };
  var _rc = resetCustomerForm; resetCustomerForm = function () { _rc.apply(this, arguments); var f = document.getElementById('custDob'); if (f) f.value = ''; };

  // ---- follow-up panel
  var host = el('div', { class: 'card mb-3', style: 'padding:.9rem;border-radius:12px;max-width:100%;overflow-x:auto' }), grid = document.getElementById('customersGrid'); grid.parentNode.insertBefore(host, grid);
  var mode = 'due';
  function stats() {
    var by = {}; rj('pharmacy_sales', []).forEach(function (s) { if (!s || !s.real || s.status === 'Voided') return; var k = s.customerId != null ? 'id' + s.customerId : 'n' + String(s.customer || '').toLowerCase(), a = by[k] || (by[k] = { n: 0, t: 0, last: '' }), d = dayOf(s.at || s.date); a.n++; a.t += +s.total || 0; if (d > a.last) a.last = d; });
    return function (c) { return by['id' + c.id] || by['n' + String(c.name).toLowerCase()] || { n: 0, t: 0, last: '' }; };
  }
  function refills(td) {
    var by = {}; rj('pharmacy_sales', []).forEach(function (s) { if (!s || !s.real || s.status === 'Voided') return; var k = s.customerId != null ? 'id' + s.customerId : 'n' + String(s.customer || '').toLowerCase(), d = s.date || (s.at ? dayOf(s.at) : ''); if (!d) return; (s.items || []).forEach(function (i) { var m = (by[k] = by[k] || {})[i.name] = by[k][i.name] || {}; m[d] = true; }); });
    var out = {}, t0 = new Date(td + 'T00:00:00');
    Object.keys(by).forEach(function (k) { Object.keys(by[k]).forEach(function (n) { var ds = Object.keys(by[k][n]).sort(); if (ds.length < 2) return; var span = (new Date(ds[ds.length - 1]) - new Date(ds[0])) / 864e5, every = Math.min(Math.max(Math.round(span / (ds.length - 1)), 7), 120), next = new Date(new Date(ds[ds.length - 1] + 'T00:00:00').getTime() + every * 864e5), late = Math.round((t0 - next) / 864e5); if (late >= -5 && late <= 30) (out[k] = out[k] || []).push({ name: n, every: every, late: late }); }); });
    return out;
  }
  function lists() {
    var st = stats(), td = today(), md = td.slice(5), out = { due: [], bday: [], back: [], refill: [] }, rf = refills(td);
    customers.forEach(function (c) {
      var s = st(c); var r = rf['id' + c.id] || rf['n' + String(c.name).toLowerCase()]; if (r && r.length) out.refill.push({ c: Object.assign({}, c, { _med: r.map(function (x) { return x.name; }).join(', ') }), note: r.map(function (x) { return x.name + ' · প্রতি ~' + x.every + ' দিনে · ' + (x.late > 0 ? x.late + ' দিন দেরি' : x.late === 0 ? 'আজই' : (-x.late) + ' দিন পরে'); }).join(' | '), sort: Math.min.apply(null, r.map(function (x) { return -x.late; })) }); if (+c.due > 0) out.due.push({ c: c, note: tk(c.due), sort: -c.due });
      if (c.dob && /^\d{4}-\d{2}-\d{2}$/.test(c.dob)) { var d0 = new Date(td + 'T00:00:00'), d1 = new Date(d0.getFullYear() + c.dob.slice(4) + 'T00:00:00'); if (d1 < d0) d1.setFullYear(d0.getFullYear() + 1); var diff = Math.round((d1 - d0) / 864e5); if (diff <= 14) out.bday.push({ c: c, note: diff === 0 ? 'Today 🎂' : 'in ' + diff + ' day(s) · ' + c.dob.slice(5), sort: diff }); }
      if (s.n > 0 && s.last) { var gone = Math.round((new Date(td) - new Date(s.last)) / 864e5); if (gone >= 60) out.back.push({ c: c, note: 'last visit ' + gone + ' days ago · ' + s.n + ' orders · ' + tk(s.t), sort: -gone }); }
    });
    Object.keys(out).forEach(function (k) { out[k].sort(function (a, b) { return a.sort - b.sort; }); }); return out;
  }
  function draw() {
    var L = lists(), tabs = [['due', '💰 Dues (' + L.due.length + ')'], ['bday', '🎂 Birthdays 14d (' + L.bday.length + ')'], ['back', '👋 Inactive 60d+ (' + L.back.length + ')'], ['refill', '💊 Refill (' + L.refill.length + ')']];
    host.textContent = ''; host.append(el('div', { class: 'd-flex flex-wrap gap-2 align-items-center mb-2' }, [el('h6', { class: 'fw-bold mb-0 me-auto', text: '📣 Follow-ups' })].concat(tabs.map(function (t) { return el('button', { type: 'button', class: 'btn btn-sm ' + (mode === t[0] ? 'btn-primary' : 'btn-outline-primary'), text: t[1], onclick: function () { mode = t[0]; draw(); } }); }), [el('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary', text: '⬇ CSV', onclick: function () { var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }, rr = [['List', 'Name', 'Phone', 'Note']]; Object.keys(L).forEach(function (k) { L[k].forEach(function (x) { rr.push([k, x.c.name, x.c.phone, x.note]); }); }); var a = el('a', { download: 'customer-followups.csv', href: URL.createObjectURL(new Blob(['﻿' + rr.map(function (x) { return x.map(q).join(','); }).join('\n')], { type: 'text/csv' })) }); document.body.append(a); a.click(); a.remove(); } })])));
    var rows = L[mode]; if (!rows.length) return host.append(el('div', { class: 'small text-muted', text: mode === 'due' ? '✅ Nobody owes anything.' : mode === 'bday' ? 'No birthdays in the next 14 days (add a date of birth when editing a customer).' : mode === 'refill' ? 'এখনো রিফিলের সময় হওয়া কেউ নেই (একই গ্রাহক একই ওষুধ ২ বার কিনলে হিসাব শুরু হয়)।' : 'Nobody has been inactive that long.' }));
    var t = el('table', { class: 'table table-sm align-middle mb-0' }), tb = el('tbody'); t.append(tb);
    rows.slice(0, 20).forEach(function (x) { tb.append(el('tr', {}, [el('td', { text: x.c.name }), el('td', { text: x.note, class: 'small' }), el('td', { style: 'white-space:nowrap;text-align:right' }, [el('button', { type: 'button', class: 'btn btn-sm btn-outline-success me-1', text: '💬', 'aria-label': 'WhatsApp ' + x.c.name, onclick: function () { send(x.c, 'wa', mode); } }), el('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary me-1', text: '✉', 'aria-label': 'SMS ' + x.c.name, onclick: function () { send(x.c, 'sms', mode); } }), el('button', { type: 'button', class: 'btn btn-sm btn-outline-primary', text: 'Open', onclick: function () { viewCustomer(x.c.id); } })])])); });
    host.append(el('div', { class: 'table-responsive' }, [t]));
  }
  var _d = displayCustomers; displayCustomers = function () { _d.apply(this, arguments); try { draw(); } catch (e) { } };
  draw();
})();
