/* Write-off v59: partial / manual write-off (damaged, lost, supplier return, other) with quantity and reason,
   using the same log (pharmacy_writeoffs). Losses now appear in Reports → Financial as an expense. */
(function () {
  'use strict';
  var box = document.getElementById('box'); if (!box || box.hidden) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function el(t, a, kids) { var e = document.createElement(t); a = a || {}; for (var k in a) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(c); }); return e; }
  var u = null; try { u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { }
  var who = (u && (u.name || u.role)) || sessionStorage.getItem('mc_role') || '';
  var tk = function (n) { return '৳' + (Math.round(n * 100) / 100).toLocaleString(); };
  var meds = rj('pharmacy_medicines', []).filter(function (m) { return (+m.stock || 0) > 0; });
  var msel = el('select', { 'aria-label': 'ওষুধ' }, meds.map(function (m) { return el('option', { value: m.id, text: m.name + ' · ব্যাচ ' + (m.batchNo || '-') + ' (স্টক ' + m.stock + ')' }); }));
  var qty = el('input', { type: 'number', min: 1, step: 1, placeholder: 'পরিমাণ', 'aria-label': 'পরিমাণ', style: 'width:90px' });
  var why = el('select', { 'aria-label': 'কারণ' }, ['Damaged', 'Lost / theft', 'Supplier return', 'Other'].map(function (x) { return el('option', { value: x, text: x }); }));
  var note = el('input', { placeholder: 'নোট (ঐচ্ছিক)', maxlength: 80, style: 'flex:1;min-width:140px' }), out = el('p', { class: 'muted', role: 'status' });
  var go = el('button', { class: 'btn', text: '➖ স্টক থেকে বাদ দিন' }); go.onclick = function () {
    var all = rj('pharmacy_medicines', []), m = all.find(function (x) { return String(x.id) === msel.value; }), q = Math.floor(+qty.value || 0);
    if (!m) { out.textContent = 'ওষুধ বাছুন'; return; } if (q < 1) { out.textContent = 'পরিমাণ ১ বা বেশি দিন'; return; } if (q > (+m.stock || 0)) { out.textContent = 'স্টকের (' + m.stock + ') বেশি বাদ দেওয়া যাবে না'; return; }
    var loss = q * (+m.purchasePrice || 0); if (!confirm(m.name + ' — ' + q + ' টি (' + why.value + '), ক্ষতি ' + tk(loss) + '. নিশ্চিত?')) return;
    m.stock = (+m.stock || 0) - q; var now = new Date(), log = rj('pharmacy_writeoffs', []);
    log.push({ at: now.toISOString(), date: now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }), id: m.id, name: m.name, qty: q, loss: loss, reason: why.value + (note.value.trim() ? ' — ' + note.value.trim() : ''), by: who });
    localStorage.setItem('pharmacy_medicines', JSON.stringify(all)); localStorage.setItem('pharmacy_writeoffs', JSON.stringify(log));
    try { var a = rj('pharmacy_audit', []); a.push({ at: now.toISOString(), by: who, msg: 'Write-off ' + q + ' × ' + m.name + ' (' + why.value + ')' }); localStorage.setItem('pharmacy_audit', JSON.stringify(a.slice(-300))); } catch (e) { }
    out.textContent = '✅ ' + m.name + ': ' + q + ' টি বাদ। রিলোড হচ্ছে…'; setTimeout(function () { location.reload(); }, 600);
  };
  var card = el('div', { class: 'card noprint' }, [el('h3', { text: '➖ আংশিক / ম্যানুয়াল Write-off (নষ্ট, হারানো, সাপ্লায়ারকে ফেরত)' }), meds.length ? el('div', { class: 'row' }, [msel, qty, why, note, go]) : el('p', { class: 'muted', text: 'স্টকে কোনো ওষুধ নেই।' }), out]);
  var first = box.querySelector('.card'); first.parentNode.insertBefore(card, first.nextSibling);
})();
