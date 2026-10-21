/* Prescriptions v56: "needs attention" panel (expiring / expired & unfilled), real WhatsApp/SMS reminders (the old button only
   showed a fake "Reminder sent" toast), expired prescriptions cannot be sent to POS without an explicit override, demo-OCR notice. */
(function () {
  'use strict';
  if (typeof prescriptions === 'undefined' || !document.getElementById('prescriptionsGrid')) return;
  function el(t, a, kids) { var e = document.createElement(t); a = a || {}; for (var k in a) { if (k === 'text') e.textContent = a[k]; else if (k.slice(0, 2) === 'on') e[k] = a[k]; else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(c); }); return e; }
  var today = function () { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); };
  var dd = function (a, b) { return Math.round((new Date(a + 'T00:00:00') - new Date(b + 'T00:00:00')) / 864e5); };
  var phone = function (p) { return String(p || '').replace(/[^\d+]/g, ''); };
  function pendingMeds(p) { return (p.medicines || []).filter(function (m) { return m.status !== 'filled'; }); }
  function open(p) { return p.status !== 'filled' && p.status !== 'cancelled' && pendingMeds(p).length > 0; }
  function state(p) { if (!open(p) || !p.validUntil) return null; var d = dd(p.validUntil, today()); return d < 0 ? { k: 'expired', d: -d } : d <= 7 ? { k: 'soon', d: d } : null; }
  function msg(p) { var m = pendingMeds(p).map(function (x) { return x.name; }).join(', '), s = state(p); return 'Hello ' + (p.patientName || '') + ', this is a reminder from our pharmacy about prescription ' + (p.prescriptionNo || '') + '. Pending medicine(s): ' + m + '.' + (p.validUntil ? (s && s.k === 'expired' ? ' The prescription expired on ' + p.validUntil + ' — please contact your doctor for a renewal.' : ' It is valid until ' + p.validUntil + '.') : '') + ' Thank you.'; }
  function remind(p, how) {
    var ph = phone(p.patientPhone); if (!ph) return showToast('No phone number saved for this patient', 'warning');
    var url = how === 'sms' ? 'sms:' + ph + '?body=' + encodeURIComponent(msg(p)) : 'https://wa.me/' + ph.replace(/^\+/, '') + '?text=' + encodeURIComponent(msg(p));
    window.open(url, '_blank', 'noopener'); p.reminders = (p.reminders || []).concat([{ at: new Date().toISOString(), how: how }]).slice(-10); savePrescriptionsToStorage(); showToast('Reminder opened in ' + (how === 'sms' ? 'SMS' : 'WhatsApp') + ' — press send there', 'success'); draw();
  }
  sendPrescriptionReminder = function () { var p = prescriptions.find(function (x) { return x.id === currentPrescriptionId; }); if (p) remind(p, 'wa'); };
  var guard = function (orig) { return function (id) { var p = prescriptions.find(function (x) { return x.id === (id === undefined ? currentPrescriptionId : id); }), s = p && state(p); if (s && s.k === 'expired' && !confirm('⚠ Prescription ' + (p.prescriptionNo || '') + ' expired on ' + p.validUntil + ' (' + s.d + ' day(s) ago).\nDispensing an expired prescription is normally not allowed. Continue anyway (pharmacist override)?')) return; return orig.apply(this, arguments); }; };
  fillPrescription = guard(fillPrescription); fillPrescriptionFromCard = guard(fillPrescriptionFromCard);
  if (typeof simulateOCR === 'function') { var _o = simulateOCR; simulateOCR = function () { _o.apply(this, arguments); var b = document.getElementById('ocrResult'); if (b && !b.querySelector('.mc-demo')) b.prepend(el('div', { class: 'alert alert-warning py-1 small mc-demo', text: '⚠ Demo scan: these values are sample data, not read from your photo. Check every field before saving.' })); }; }
  var host = el('div', { class: 'card mb-3', style: 'padding:.9rem;border-radius:12px;max-width:100%;overflow-x:auto' }), grid = document.getElementById('prescriptionsGrid'); grid.parentNode.insertBefore(host, grid);
  function draw() {
    var L = prescriptions.map(function (p) { return { p: p, s: state(p) }; }).filter(function (x) { return x.s; }).sort(function (a, b) { return (a.s.k === 'expired' ? -1 : 0) - (b.s.k === 'expired' ? -1 : 0) || (a.s.k === 'soon' ? a.s.d : 0) - (b.s.k === 'soon' ? b.s.d : 0); });
    var exp = L.filter(function (x) { return x.s.k === 'expired'; }).length, soon = L.length - exp;
    host.textContent = ''; host.append(el('div', { class: 'd-flex flex-wrap gap-2 align-items-center mb-2' }, [el('h6', { class: 'fw-bold mb-0 me-auto', text: '🔔 Needs attention' }), el('span', { class: 'small', text: soon + ' expiring within 7 days · ' + exp + ' expired & not fully dispensed' })]));
    if (!L.length) return host.append(el('div', { class: 'text-success small', text: '✅ No prescriptions need follow-up.' }));
    var t = el('table', { class: 'table table-sm align-middle mb-0' }); t.append(el('thead', {}, [el('tr', {}, ['Rx', 'Patient', 'Pending', 'Valid until', 'Reminded', ''].map(function (h) { return el('th', { text: h }); }))])); var tb = el('tbody');
    L.slice(0, 15).forEach(function (x) { var p = x.p, last = (p.reminders || []).slice(-1)[0];
      tb.append(el('tr', {}, [el('td', { text: p.prescriptionNo || '#' + p.id }), el('td', { text: p.patientName }), el('td', { text: pendingMeds(p).length + ' med(s)' }), el('td', { text: p.validUntil + (x.s.k === 'expired' ? ' (expired ' + x.s.d + 'd)' : x.s.d === 0 ? ' (today)' : ' (' + x.s.d + 'd left)'), class: x.s.k === 'expired' ? 'text-danger fw-bold' : 'text-warning fw-bold' }), el('td', { text: last ? new Date(last.at).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' }) : '—', class: 'small' }),
        el('td', { style: 'white-space:nowrap' }, [el('button', { type: 'button', class: 'btn btn-sm btn-outline-success me-1', text: '💬', 'aria-label': 'WhatsApp reminder', onclick: function () { remind(p, 'wa'); } }), el('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary me-1', text: '✉', 'aria-label': 'SMS reminder', onclick: function () { remind(p, 'sms'); } }), el('button', { type: 'button', class: 'btn btn-sm btn-outline-primary', text: 'Open', onclick: function () { viewPrescription(p.id); } })])])); });
    t.append(tb); host.append(el('div', { class: 'table-responsive' }, [t]));
  }
  var _d = displayPrescriptions; displayPrescriptions = function () { _d.apply(this, arguments); try { draw(); } catch (e) { } };
  draw();
})();
