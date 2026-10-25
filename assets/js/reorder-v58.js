/* Smart reorder v58: suggested quantity from real sales velocity (POS), days of stock left, supplier from the last purchase
   (or one you pick, remembered), editable quantities, select rows, supplier-wise purchase orders with WhatsApp / print / CSV. */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString(); };
  var u = null; try { u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { }
  var rl = u && u.role || '', mr = sessionStorage.getItem('mc_role'); if (!(rl === 'admin' || rl === 'pharmacist' || mr === 'Owner' || mr === 'Pharmacist')) { $('deny').hidden = false; return; } $('box').hidden = false;
  var meds = rj('pharmacy_medicines', []), sups = rj('pharmacy_suppliers', []), purch = rj('pharmacy_purchases', []), pick = rj('pharmacy_med_supplier', {}), qtyOv = {}, off = {};
  var S0 = rj('pharmacy_settings', {}), lowDef = +S0.lowDefault || 0;
  var supName = function (s) { return s && (s.companyName || s.name) || ''; };
  // last purchase per medicine -> supplier + unit cost
  var last = {}; purch.slice().sort(function (a, b) { return String(a.date) < String(b.date) ? -1 : 1; }).forEach(function (p) { (p.items || []).forEach(function (i) { last[i.medicineId] = { sup: p.supplierName || supName(sups.find(function (s) { return s.id == p.supplierId; })), cost: +i.unitPrice || 0 }; }); });
  function velocity(look) {
    var from = Date.now() - look * 864e5, v = {}, byName = {}; meds.forEach(function (m) { byName[String(m.name).toLowerCase()] = m.id; });
    rj('pharmacy_sales', []).forEach(function (s) { if (!s || !s.real || s.status === 'Voided') return; if (new Date(s.at || s.date).getTime() < from) return; (s.items || []).forEach(function (i) { var id = i.id != null && meds.some(function (m) { return m.id == i.id; }) ? i.id : byName[String(i.name).toLowerCase()]; if (id != null) v[id] = (v[id] || 0) + (+i.quantity || 1); }); });
    return v;
  }
  function rows() {
    var cover = +$('cover').value || 14, look = +$('look').value || 30, vel = velocity(look), f = $('sup').value, q = $('q').value.trim().toLowerCase(), urg = $('urgent').checked;
    return meds.map(function (m) {
      var mn = +m.minStock || lowDef || 0, st = +m.stock || 0, sold = vel[m.id] || 0, perDay = sold / look, left = perDay > 0 ? st / perDay : Infinity, lp = last[m.id] || {}, sp = pick[m.id] || m.supplier || m.supplierName || lp.sup || '';
      var need = Math.max(Math.ceil(Math.max(perDay * cover, mn * 2) - st), 0), low = st <= mn || left < 7;
      return { id: m.id, n: m.name, s: sp, st: st, mn: mn, perDay: perDay, left: left, need: qtyOv[m.id] != null ? qtyOv[m.id] : need, auto: need, low: low, cost: lp.cost || +m.purchasePrice || 0, urgent: st === 0 || left < 7 };
    }).filter(function (r) { return r.low && (r.auto > 0 || qtyOv[r.id] != null) && (!f || r.s === f) && (!urg || r.urgent) && (!q || r.n.toLowerCase().indexOf(q) >= 0); }).sort(function (a, b) { return (b.urgent - a.urgent) || (a.left - b.left); });
  }
  function fill() { var s = {}; meds.forEach(function (m) { var n = pick[m.id] || (last[m.id] || {}).sup || m.supplier || m.supplierName; if (n) s[n] = 1; }); sups.forEach(function (x) { if (supName(x)) s[supName(x)] = 1; }); var cur = $('sup').value; $('sup').length = 1; Object.keys(s).sort().forEach(function (n) { $('sup').add(new Option(n, n)); }); $('sup').value = cur; }
  var cur = [];
  function draw() {
    cur = rows(); var sel = cur.filter(function (r) { return !off[r.id]; }), units = sel.reduce(function (a, r) { return a + r.need; }, 0), cost = sel.reduce(function (a, r) { return a + r.need * r.cost; }, 0), urgent = cur.filter(function (r) { return r.urgent; }).length;
    $('k').innerHTML = '<div><b>' + cur.length + '</b>কম স্টকের আইটেম</div><div><b class="' + (urgent ? 'bad' : '') + '">' + urgent + '</b>জরুরি</div><div><b>' + units + '</b>নির্বাচিত ইউনিট</div><div><b>' + tk(cost) + '</b>আনুমানিক খরচ</div>';
    var supOpts = Object.keys((function () { var o = {}; meds.forEach(function () { }); sups.forEach(function (x) { if (supName(x)) o[supName(x)] = 1; }); return o; })());
    $('tb').innerHTML = cur.map(function (r, i) {
      var sp = '<select data-s="' + r.id + '" aria-label="Supplier"><option value="">—</option>' + supOpts.map(function (n) { return '<option' + (n === r.s ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + (r.s && supOpts.indexOf(r.s) < 0 ? '<option selected>' + esc(r.s) + '</option>' : '') + '</select>';
      return '<tr><td><input type="checkbox" data-c="' + r.id + '"' + (off[r.id] ? '' : ' checked') + ' aria-label="Select"></td><td>' + esc(r.n) + (r.urgent ? ' <span class="tag bad">জরুরি</span>' : '') + '</td><td>' + sp + '</td><td class="' + (r.st === 0 ? 'bad' : '') + '">' + r.st + '</td><td>' + r.mn + '</td><td>' + (r.perDay ? r.perDay.toFixed(2) : '—') + '</td><td>' + (r.left === Infinity ? '∞' : Math.floor(r.left) + ' দিন') + '</td><td><input type="number" min="0" step="1" data-q="' + r.id + '" value="' + r.need + '" aria-label="Order qty"></td><td>' + (r.cost ? tk(r.cost) : '—') + '</td><td>' + tk(r.need * r.cost) + '</td></tr>';
    }).join('') || '<tr><td colspan="10" class="ok">✅ রিঅর্ডার দরকার নেই</td></tr>';
  }
  $('tb').addEventListener('change', function (e) { var t = e.target, id; if ((id = t.getAttribute('data-c')) != null) { off[id] = !t.checked; draw(); } else if ((id = t.getAttribute('data-q')) != null) { var v = Math.max(0, Math.floor(+t.value || 0)); qtyOv[meds.find(function (m) { return String(m.id) === id; }).id] = v; draw(); } else if ((id = t.getAttribute('data-s')) != null) { var m = meds.find(function (m) { return String(m.id) === id; }); pick[m.id] = t.value; localStorage.setItem('pharmacy_med_supplier', JSON.stringify(pick)); fill(); draw(); } });
  $('all').addEventListener('change', function () { cur.forEach(function (r) { off[r.id] = !$('all').checked; }); draw(); });
  ['cover', 'look', 'sup', 'urgent'].forEach(function (i) { $(i).addEventListener('input', function () { qtyOv = {}; draw(); }); }); $('q').addEventListener('input', draw); $('pr').onclick = function () { print(); };
  function selected() { return cur.filter(function (r) { return !off[r.id] && r.need > 0; }); }
  $('csv').onclick = function () { var L = [['Medicine', 'Supplier', 'Stock', 'Min', 'Sold per day', 'Days left', 'Order', 'Unit cost', 'Est. cost']].concat(selected().map(function (r) { return [r.n, r.s, r.st, r.mn, r.perDay.toFixed(2), r.left === Infinity ? '' : Math.floor(r.left), r.need, r.cost, r.need * r.cost]; })); var c = L.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + c], { type: 'text/csv' })); a.download = 'reorder-' + new Date(Date.now() + 216e5).toISOString().slice(0, 10) + '.csv'; document.body.append(a); a.click(); a.remove(); };
  $('po').onclick = function () {
    var S = selected(); if (!S.length) { $('pos').innerHTML = '<p class="bad">কিছু নির্বাচিত নেই।</p>'; return; } var g = {}; S.forEach(function (r) { (g[r.s || '(সাপ্লায়ার ঠিক হয়নি)'] = g[r.s || '(সাপ্লায়ার ঠিক হয়নি)'] || []).push(r); });
    var day = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' }), store = S0.storeName || S0.store || 'MediCare Pharmacy', out = '';
    Object.keys(g).forEach(function (name) {
      var L = g[name], tot = L.reduce(function (a, r) { return a + r.need * r.cost; }, 0), sp = sups.find(function (s) { return supName(s) === name; }), phn = sp ? String(sp.phone || '').replace(/[^\d+]/g, '') : '';
      var text = 'Purchase order — ' + store + ' — ' + day + '\nTo: ' + name + '\n' + L.map(function (r, i) { return (i + 1) + '. ' + r.n + ' × ' + r.need; }).join('\n') + '\nPlease confirm availability, price and delivery time. Thank you.';
      var wa = phn ? 'https://wa.me/' + phn.replace(/^\+/, '') + '?text=' + encodeURIComponent(text) : '';
      out += '<div class="card po"><h3>' + esc(name) + ' <span class="muted" style="font-weight:400">· ' + day + '</span></h3><div class="scroll"><table><thead><tr><th>#</th><th>ওষুধ</th><th>পরিমাণ</th><th>ইউনিট দাম</th><th>মোট</th></tr></thead><tbody>' + L.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(r.n) + '</td><td>' + r.need + '</td><td>' + (r.cost ? tk(r.cost) : '—') + '</td><td>' + tk(r.need * r.cost) + '</td></tr>'; }).join('') + '</tbody><tfoot><tr><th colspan="4">মোট (আনুমানিক)</th><th>' + tk(tot) + '</th></tr></tfoot></table></div><div class="row noprint">' + (wa ? '<a class="btn" target="_blank" rel="noopener" href="' + wa + '">💬 WhatsApp এ পাঠান</a>' : '<span class="muted">ফোন নম্বর নেই — Suppliers এ যোগ করুন</span>') + '<button class="btn2" data-copy="' + esc(text) + '">📋 টেক্সট কপি</button></div></div>';
    });
    $('pos').innerHTML = out; $('pos').scrollIntoView({ behavior: 'smooth' });
    try { var A = rj('pharmacy_audit', []); A.push({ at: new Date().toISOString(), by: (u && (u.name || u.role)) || mr || '', msg: 'Reorder PO prepared: ' + S.length + ' items, ' + Object.keys(g).length + ' supplier(s)' }); localStorage.setItem('pharmacy_audit', JSON.stringify(A.slice(-300))); } catch (e) { }
  };
  $('pos').addEventListener('click', function (e) { var t = e.target.getAttribute && e.target.getAttribute('data-copy'); if (t != null) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { e.target.textContent = '✅ কপি হয়েছে'; }, function () { prompt('কপি করুন:', t); }); } });
  fill(); draw();
})();
