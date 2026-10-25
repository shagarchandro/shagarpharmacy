/* Medicines v53: CSV import (validated, preview, upsert), CSV export, bulk price change, stock adjustment with reason + log.
   Everything writes through the page's own saveMedicinesToStorage()/displayMedicines() and is audited. */
(function () {
  'use strict';
  if (typeof medicines === 'undefined' || !document.getElementById('medicinesGrid')) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function el(t, a, kids) { var e = document.createElement(t); a = a || {}; for (var k in a) { if (k === 'text') e.textContent = a[k]; else if (k.slice(0, 2) === 'on') e[k] = a[k]; else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(c); }); return e; }
  var who = (function () { try { var u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); return (u && (u.name || u.role)) || ''; } catch (e) { return ''; } })();
  function audit(msg) { try { var a = rj('pharmacy_audit', []); a.push({ at: new Date().toISOString(), by: who, msg: msg }); localStorage.setItem('pharmacy_audit', JSON.stringify(a.slice(-300))); } catch (e) { } }
  function toast(m, t) { if (typeof showToast === 'function') showToast(m, t || 'success'); }
  function commit() { saveMedicinesToStorage(medicines); displayMedicines(); }
  function csvDl(name, rows) { var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }; var a = el('a', { download: name, href: URL.createObjectURL(new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv' })) }); document.body.append(a); a.click(); a.remove(); }
  var COLS = ['name', 'genericName', 'brand', 'category', 'batchNo', 'barcode', 'rackNo', 'purchasePrice', 'sellingPrice', 'wholesalePrice', 'stock', 'minStock', 'mfgDate', 'expiryDate', 'rxRequired'];
  function parseCsv(txt) { var rows = [], r = [], f = '', q = false; txt = txt.replace(/^﻿/, ''); for (var i = 0; i < txt.length; i++) { var c = txt[i]; if (q) { if (c === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === ',') { r.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; r.push(f); f = ''; if (r.some(function (x) { return x.trim() !== ''; })) rows.push(r); r = []; } else f += c; } r.push(f); if (r.some(function (x) { return x.trim() !== ''; })) rows.push(r); return rows; }

  var panel = el('div', { class: 'card mb-3', style: 'padding:.9rem;border-radius:12px' });
  var det = el('details', { style: 'max-width:100%;overflow-x:auto' }, [el('summary', { text: '🧰 Tools: import / export · bulk price · stock adjustment', style: 'cursor:pointer;font-weight:600' }), panel]);
  var grid = document.getElementById('medicinesGrid'); grid.parentNode.insertBefore(det, grid);
  var out = el('div', { class: 'small text-muted', role: 'status' });
  function say(m, bad) { out.textContent = m; out.style.color = bad ? '#b3261e' : ''; }
  function btn(t, f, c) { return el('button', { type: 'button', class: 'btn btn-sm ' + (c || 'btn-outline-primary'), text: t, onclick: f }); }

  // ---- export + import
  var file = el('input', { type: 'file', accept: '.csv,text/csv', hidden: 'hidden' }), pv = el('div');
  file.onchange = function () {
    var f = file.files[0]; file.value = ''; pv.textContent = ''; if (!f) return; if (f.size > 5e6) return say('File too large (max 5 MB)', 1);
    var r = new FileReader(); r.onload = function () {
      var rows = parseCsv(r.result); if (rows.length < 2) return say('No data rows found', 1);
      var head = rows[0].map(function (h) { return h.trim(); }), ix = {}; COLS.forEach(function (c) { var i = head.findIndex(function (h) { return h.toLowerCase() === c.toLowerCase(); }); if (i >= 0) ix[c] = i; });
      if (ix.name == null || ix.sellingPrice == null || ix.stock == null || ix.expiryDate == null) return say('CSV needs at least these columns: name, sellingPrice, stock, expiryDate', 1);
      var good = [], bad = [], seen = {};
      rows.slice(1).forEach(function (r, n) {
        var o = {}; COLS.forEach(function (c) { if (ix[c] != null) o[c] = (r[ix[c]] || '').trim(); });
        var why = !o.name ? 'name missing' : !(+o.sellingPrice > 0) ? 'sellingPrice must be > 0' : !(+o.stock >= 0 && o.stock !== '') ? 'stock must be 0 or more' : !/^\d{4}-\d{2}-\d{2}$/.test(o.expiryDate || '') || isNaN(new Date(o.expiryDate)) ? 'expiryDate must be YYYY-MM-DD' : (o.purchasePrice && +o.purchasePrice < 0) ? 'purchasePrice negative' : '';
        var key = (o.name || '').toLowerCase() + '|' + (o.batchNo || '').toLowerCase(); if (!why && seen[key]) why = 'duplicate name+batch in file'; seen[key] = 1;
        if (why) bad.push('Row ' + (n + 2) + ': ' + why); else good.push(o);
      });
      var upd = 0, add = 0; good.forEach(function (o) { var ex = medicines.find(function (m) { return m.name.toLowerCase() === o.name.toLowerCase() && String(m.batchNo || '').toLowerCase() === (o.batchNo || '').toLowerCase(); }); ex ? upd++ : add++; });
      pv.append(el('p', { text: good.length + ' valid row(s): ' + add + ' new, ' + upd + ' will update existing (same name + batch). ' + bad.length + ' rejected.', class: 'mb-1' }));
      if (bad.length) pv.append(el('div', { class: 'small text-danger', text: bad.slice(0, 6).join(' · ') + (bad.length > 6 ? ' …' : '') }));
      if (good.length) pv.append(btn('✅ Import ' + good.length + ' row(s)', function () {
        var snap = JSON.stringify(medicines), nid = medicines.reduce(function (a, m) { return Math.max(a, +m.id || 0); }, 0);
        try { localStorage.setItem('mc_med_undo', snap); } catch (e) { }
        good.forEach(function (o) {
          var ex = medicines.find(function (m) { return m.name.toLowerCase() === o.name.toLowerCase() && String(m.batchNo || '').toLowerCase() === (o.batchNo || '').toLowerCase(); });
          var rec = ex || { id: ++nid, image: '' }; ['name', 'genericName', 'brand', 'category', 'batchNo', 'barcode', 'rackNo', 'mfgDate', 'expiryDate'].forEach(function (c) { if (o[c] !== undefined && (o[c] !== '' || !ex)) rec[c] = o[c]; });
          ['purchasePrice', 'sellingPrice', 'wholesalePrice', 'stock', 'minStock'].forEach(function (c) { if (o[c] !== undefined && o[c] !== '') rec[c] = +o[c]; else if (!ex) rec[c] = c === 'minStock' ? 10 : 0; });
          if (o.rxRequired !== undefined && o.rxRequired !== '') rec.rxRequired = /^(1|true|yes|y)$/i.test(o.rxRequired); if (!rec.barcode) rec.barcode = String(Math.random()).slice(2, 15);
          if (!ex) medicines.push(rec);
        });
        commit(); audit('Medicines CSV import: ' + add + ' new, ' + upd + ' updated'); pv.textContent = ''; say('Imported: ' + add + ' new, ' + upd + ' updated. Use "Undo last bulk change" if needed.'); undoB.hidden = false;
      }, 'btn-success'));
    }; r.readAsText(f);
  };
  var undoB = btn('↩ Undo last bulk change', function () { var s = localStorage.getItem('mc_med_undo'); if (!s || !confirm('Restore the medicine list as it was before the last import / bulk price change?')) return; medicines = JSON.parse(s); localStorage.removeItem('mc_med_undo'); commit(); undoB.hidden = true; audit('Medicines bulk change undone'); say('Restored.'); }, 'btn-outline-secondary'); undoB.hidden = !localStorage.getItem('mc_med_undo');
  panel.append(el('h6', { text: 'Import / export', class: 'fw-bold' }), el('div', { class: 'd-flex flex-wrap gap-2 mb-2' }, [
    btn('⬇ Export all (CSV)', function () { var rows = [COLS.slice()]; medicines.forEach(function (m) { rows.push(COLS.map(function (c) { return m[c] == null ? '' : m[c]; })); }); csvDl('medicines-' + new Date(Date.now() + 216e5).toISOString().slice(0, 10) + '.csv', rows); }),
    btn('⬇ CSV template', function () { csvDl('medicines-template.csv', [COLS.slice(), ['Napa 500mg', 'Paracetamol', 'Beximco', 'Pain Relief', 'B001', '', 'A-1', 2, 5, 4, 100, 20, '2026-01-01', '2028-12-31', 'no']]); }),
    el('label', { class: 'btn btn-sm btn-outline-primary mb-0', text: '⬆ Import CSV…' }, [file]), undoB]), pv);

  // ---- bulk price
  var cat = el('select', { class: 'form-select form-select-sm', style: 'max-width:11rem', 'aria-label': 'Category' }), pct = el('input', { type: 'number', class: 'form-control form-control-sm', style: 'max-width:7rem', placeholder: '% (e.g. 5 or -10)', step: '0.1', 'aria-label': 'Percent change' }), what = el('select', { class: 'form-select form-select-sm', style: 'max-width:11rem', 'aria-label': 'Which price' }, [el('option', { value: 'sellingPrice', text: 'Selling price' }), el('option', { value: 'both', text: 'Selling + wholesale' })]);
  function cats() { cat.textContent = ''; cat.append(el('option', { value: '', text: 'All categories' })); var s = {}; medicines.forEach(function (m) { s[m.category || 'Other'] = 1; }); Object.keys(s).sort().forEach(function (c) { cat.append(el('option', { value: c, text: c })); }); } cats();
  panel.append(el('h6', { text: 'Bulk price change', class: 'fw-bold mt-3' }), el('div', { class: 'd-flex flex-wrap gap-2 align-items-center mb-1' }, [cat, pct, what, btn('Apply', function () {
    var p = parseFloat(pct.value); if (isNaN(p) || p === 0 || p < -90 || p > 200) return say('Enter a percent between −90 and 200 (not 0)', 1);
    var set = medicines.filter(function (m) { return !cat.value || (m.category || 'Other') === cat.value; }); if (!set.length) return say('No medicines in that category', 1);
    var ex = set[0], np = Math.round(ex.sellingPrice * (1 + p / 100) * 100) / 100; if (!confirm(set.length + ' medicine(s) ' + (p > 0 ? '+' : '') + p + '% — e.g. ' + ex.name + ': ৳' + ex.sellingPrice + ' → ৳' + np + '. Continue?')) return;
    try { localStorage.setItem('mc_med_undo', JSON.stringify(medicines)); } catch (e) { }
    set.forEach(function (m) { m.sellingPrice = Math.max(0.01, Math.round(m.sellingPrice * (1 + p / 100) * 100) / 100); if (what.value === 'both' && m.wholesalePrice) m.wholesalePrice = Math.max(0.01, Math.round(m.wholesalePrice * (1 + p / 100) * 100) / 100); });
    commit(); audit('Bulk price ' + (p > 0 ? '+' : '') + p + '% on ' + set.length + ' medicines' + (cat.value ? ' (' + cat.value + ')' : '')); undoB.hidden = false; say('Updated ' + set.length + ' medicine(s).');
  })]));

  // ---- stock adjustment
  var msel = el('select', { class: 'form-select form-select-sm', style: 'max-width:16rem', 'aria-label': 'Medicine' }), qty = el('input', { type: 'number', step: '1', class: 'form-control form-control-sm', style: 'max-width:7rem', placeholder: '+/− qty', 'aria-label': 'Quantity change' }), why = el('select', { class: 'form-select form-select-sm', style: 'max-width:11rem', 'aria-label': 'Reason' }, ['Recount', 'Damaged', 'Lost / theft', 'Expired write-off', 'Supplier return', 'Found', 'Other'].map(function (x) { return el('option', { value: x, text: x }); })), note = el('input', { class: 'form-control form-control-sm', style: 'max-width:12rem', placeholder: 'Note (optional)', maxlength: '80' });
  function msList() { msel.textContent = ''; medicines.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (m) { msel.append(el('option', { value: m.id, text: m.name + ' · ' + (m.batchNo || '-') + ' (stock ' + m.stock + ')' })); }); } msList();
  var logBox = el('div', { class: 'small' });
  function drawLog() { var L = rj('pharmacy_stock_log', []).slice(-12).reverse(); logBox.textContent = ''; if (!L.length) return logBox.append(el('span', { class: 'text-muted', text: 'No stock adjustments yet.' })); var t = el('table', { class: 'table table-sm mb-0' }); t.append(el('thead', {}, [el('tr', {}, ['When', 'Medicine', 'Change', 'Stock', 'Reason', 'By'].map(function (h) { return el('th', { text: h }); }))])); var tb = el('tbody'); L.forEach(function (x) { tb.append(el('tr', {}, [new Date(x.at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }).slice(0, 17), x.name, (x.delta > 0 ? '+' : '') + x.delta, x.from + ' → ' + x.to, x.why + (x.note ? ' — ' + x.note : ''), x.by].map(function (c) { return el('td', { text: c }); }))); }); t.append(tb); logBox.append(el('div', { class: 'table-responsive' }, [t])); }
  panel.append(el('h6', { text: 'Stock adjustment (with reason)', class: 'fw-bold mt-3' }), el('div', { class: 'd-flex flex-wrap gap-2 align-items-center mb-2' }, [msel, qty, why, note, btn('Adjust', function () {
    var d = parseInt(qty.value, 10), m = medicines.find(function (x) { return String(x.id) === msel.value; }); if (!m || isNaN(d) || d === 0) return say('Pick a medicine and a non-zero quantity', 1);
    if (m.stock + d < 0) return say('Stock cannot go below 0 (current ' + m.stock + ')', 1);
    var from = m.stock; m.stock += d; var L = rj('pharmacy_stock_log', []); L.push({ at: new Date().toISOString(), id: m.id, name: m.name, delta: d, from: from, to: m.stock, why: why.value, note: note.value.trim(), by: who }); localStorage.setItem('pharmacy_stock_log', JSON.stringify(L.slice(-500)));
    commit(); audit('Stock ' + (d > 0 ? '+' : '') + d + ' ' + m.name + ' (' + why.value + ')'); qty.value = note.value = ''; msList(); drawLog(); say(m.name + ': ' + from + ' → ' + m.stock);
  }), btn('⬇ Log CSV', function () { var L = rj('pharmacy_stock_log', []); csvDl('stock-log.csv', [['At', 'Medicine', 'Change', 'From', 'To', 'Reason', 'Note', 'By']].concat(L.map(function (x) { return [x.at, x.name, x.delta, x.from, x.to, x.why, x.note, x.by]; }))); }, 'btn-outline-secondary')]), logBox, out); drawLog();
})();
