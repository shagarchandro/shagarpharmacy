/* v86 — Prescription Management:
   • স্ট্যাটাস চিপ (অপেক্ষমাণ / আংশিক / সম্পন্ন / মেয়াদ ≤৩ দিন / মেয়াদোত্তীর্ণ / আজকের)
   • কার্ডে স্টক-প্রাপ্যতা (✔ আছে · ⚠ কম · ✖ নেই) ও আনুমানিক বিল
   • বিস্তারিত দেখার সময়: ওষুধ-ভিত্তিক স্টক/দাম/বিকল্প (একই generic), আনুমানিক মোট, রোগীর আগের প্রেসক্রিপশন, 🖨 স্লিপ প্রিন্ট
   • সেভের আগে যাচাই: মেয়াদ তারিখ ≥ প্রেসক্রিপশন তারিখ, ফোন নম্বর, ডুপ্লিকেট প্রেসক্রিপশন সতর্কতা, অনন্য RX নম্বর */
(function () {
  'use strict';
  if (typeof prescriptions === 'undefined' || !document.getElementById('prescriptionsGrid')) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function $(i) { return document.getElementById(i); }
  var today = function () { return new Date(Date.now() + 216e5).toISOString().slice(0, 10); };
  var diff = function (a, b) { return Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 864e5); };
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function toast(m, t) { try { showToast(m, t || 'info'); } catch (e) { } }
  function ask(msg) { return window.MCD && MCD.confirm ? MCD.confirm(msg) : Promise.resolve(confirm(msg)); }
  function pend(p) { return (p.medicines || []).filter(function (m) { return m.status !== 'filled'; }); }
  function isOpen(p) { return p.status !== 'filled' && pend(p).length > 0; }
  function left(p) { return p.validUntil ? diff(p.validUntil, today()) : null; }
  var norm = function (s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); };
  function find(name, meds) {
    var n = norm(name); if (!n) return null; var best = null;
    meds.forEach(function (m) { var x = norm(m.name); if (x === n) best = m; else if (!best || norm(best.name) !== n) { if (x.indexOf(n) === 0 || n.indexOf(x) === 0 || (x.length > 3 && n.indexOf(x) > -1)) best = best || m; } });
    return best;
  }
  function avail(p) {
    var meds = rj('pharmacy_medicines', []), out = { ok: 0, low: 0, none: 0, unk: 0, cost: 0, rows: [] };
    pend(p).forEach(function (pm) {
      var m = find(pm.name, meds), row = { name: pm.name, dosage: pm.dosage, duration: pm.duration, m: m, st: 'unk', alt: [] };
      if (!m) out.unk++; else { var s = +m.stock || 0, min = +m.minStock > 0 ? +m.minStock : 10, price = +m.sellingPrice || +m.price || 0; row.price = price; row.stock = s;
        if (s <= 0) { out.none++; row.st = 'none'; var g = norm(m.genericName); if (g) row.alt = meds.filter(function (x) { return x.id !== m.id && norm(x.genericName) === g && (+x.stock || 0) > 0; }).slice(0, 3); }
        else if (s <= min) { out.low++; row.st = 'low'; out.cost += price; } else { out.ok++; row.st = 'ok'; out.cost += price; } }
      out.rows.push(row);
    });
    return out;
  }
  /* ---------- চিপ ---------- */
  var seg = 'all', SEGS = [['all', 'সব'], ['pending', '⏳ অপেক্ষমাণ'], ['partial', '◐ আংশিক'], ['filled', '✅ সম্পন্ন'], ['soon', '🔔 মেয়াদ ≤৩ দিন'], ['expired', '⛔ মেয়াদোত্তীর্ণ'], ['today', '🆕 আজকের']];
  var chips = document.createElement('div'); chips.id = 'v86Chips'; chips.className = 'd-flex flex-wrap gap-2 mb-3';
  var grid = $('prescriptionsGrid'); grid.parentNode.insertBefore(chips, grid);
  function pass(p) {
    var d = left(p);
    switch (seg) { case 'pending': return p.status === 'pending'; case 'partial': return p.status === 'partial'; case 'filled': return p.status === 'filled'; case 'soon': return isOpen(p) && d != null && d >= 0 && d <= 3; case 'expired': return isOpen(p) && d != null && d < 0; case 'today': return (p.prescriptionDate === today()) || (p.createdAt || '').slice(0, 10) === today(); default: return true; }
  }
  function paintChips() {
    var keep = seg, c = {}; SEGS.forEach(function (g) { seg = g[0]; c[g[0]] = prescriptions.filter(pass).length; }); seg = keep; chips.innerHTML = '';
    SEGS.forEach(function (g) { var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-sm rounded-pill ' + (seg === g[0] ? 'btn-primary' : 'btn-outline-secondary'); b.textContent = g[1] + ' (' + c[g[0]] + ')'; b.addEventListener('click', function () { seg = g[0]; try { currentPage = 1; } catch (e) { } displayPrescriptions(); }); chips.appendChild(b); });
  }
  var _d = window.displayPrescriptions;
  window.displayPrescriptions = function () {
    var all = prescriptions; try { prescriptions = all.filter(pass); _d.apply(this, arguments); } finally { prescriptions = all; }
    try { decorate(); paintChips(); } catch (e) { console.warn('rx-v86', e); }
  };
  function decorate() {
    [].forEach.call(document.querySelectorAll('#prescriptionsGrid .prescription-card'), function (card) {
      if (card.querySelector('.v86a')) return; var b = card.querySelector('button[onclick^="viewPrescription("]'); if (!b) return; var id = +b.getAttribute('onclick').match(/\d+/)[0], p = prescriptions.filter(function (x) { return x.id === id; })[0]; if (!p) return;
      var d = document.createElement('div'); d.className = 'v86a small mb-2';
      if (!isOpen(p)) d.innerHTML = '<span class="text-success">✅ সব ওষুধ দেওয়া হয়েছে</span>';
      else { var a = avail(p), dl = left(p), t = []; if (a.ok) t.push('<span class="text-success">✔ ' + a.ok + ' আছে</span>'); if (a.low) t.push('<span class="text-warning">⚠ ' + a.low + ' কম</span>'); if (a.none) t.push('<span class="text-danger">✖ ' + a.none + ' নেই</span>'); if (a.unk) t.push('<span class="text-muted">? ' + a.unk + ' স্টকে নেই/নাম মেলেনি</span>');
        d.innerHTML = t.join(' · ') + (a.cost ? ' · ≈ ' + tk(a.cost) : '') + (dl != null ? '<div class="' + (dl < 0 ? 'text-danger' : dl <= 3 ? 'text-warning' : 'text-muted') + '">' + (dl < 0 ? '⛔ মেয়াদ শেষ ' + (-dl) + ' দিন আগে' : dl === 0 ? '🔔 আজই মেয়াদ শেষ' : '⏳ আর ' + dl + ' দিন বৈধ') + '</div>' : ''); }
      var tags = card.querySelector('.medicine-tag'); (tags ? tags.parentNode : card.querySelector('.card-body')).insertAdjacentElement('afterend', d);
    });
  }
  /* ---------- বিস্তারিত ---------- */
  var _v = window.viewPrescription;
  window.viewPrescription = function (id) {
    var r = _v.apply(this, arguments);
    try {
      var p = prescriptions.filter(function (x) { return x.id === id; })[0], host = $('prescriptionDetails'); if (!p || !host) return r;
      var old = host.querySelector('.v86d'); if (old) old.remove();
      var a = avail(p), ph = String(p.patientPhone || '').replace(/\D/g, ''), hist = prescriptions.filter(function (x) { return x.id !== p.id && ((ph && String(x.patientPhone || '').replace(/\D/g, '') === ph) || (!ph && norm(x.patientName) === norm(p.patientName))); }).sort(function (x, y) { return (y.prescriptionDate || '').localeCompare(x.prescriptionDate || ''); });
      var d = document.createElement('div'); d.className = 'v86d col-12 mt-3';
      var stIcon = { ok: '<span class="text-success">✔ আছে</span>', low: '<span class="text-warning">⚠ কম</span>', none: '<span class="text-danger">✖ নেই</span>', unk: '<span class="text-muted">? নাম মেলেনি</span>' };
      d.innerHTML = '<div class="bg-light rounded-3 p-3"><h6 class="fw-bold text-primary mb-2"><i class="fas fa-boxes me-2"></i>স্টক ও আনুমানিক বিল (বাকি ওষুধ)</h6>' +
        (a.rows.length ? '<div class="table-responsive"><table class="table table-sm mb-2"><thead><tr><th>ওষুধ</th><th>স্টক</th><th>দাম</th><th>অবস্থা</th></tr></thead><tbody>' + a.rows.map(function (r) { return '<tr><td>' + esc(r.name) + '</td><td>' + (r.m ? r.stock : '—') + '</td><td>' + (r.price ? tk(r.price) : '—') + '</td><td>' + stIcon[r.st] + (r.alt.length ? '<div class="small text-muted">বিকল্প (একই generic): ' + r.alt.map(function (x) { return esc(x.name) + ' (' + (+x.stock || 0) + ')'; }).join(', ') + '</div>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div><div class="fw-bold">আনুমানিক মোট (প্রতি ওষুধ ১ ইউনিট ধরে): ' + tk(a.cost) + '</div><div class="small text-muted">দ্রষ্টব্য: ডোজ/মেয়াদ অনুযায়ী আসল পরিমাণ POS-এ ঠিক করুন।</div>' : '<div class="text-success">✅ সব ওষুধ দেওয়া হয়েছে</div>') + '</div>' +
        '<div class="bg-light rounded-3 p-3 mt-3"><h6 class="fw-bold text-primary mb-2"><i class="fas fa-history me-2"></i>রোগীর আগের প্রেসক্রিপশন (' + hist.length + ')</h6>' + (hist.length ? hist.slice(0, 5).map(function (x) { return '<div class="small">' + esc(x.prescriptionNo) + ' · ' + esc(x.prescriptionDate) + ' · ' + esc(x.doctorName || '') + ' · <b>' + esc(x.status) + '</b> — ' + esc((x.medicines || []).map(function (m) { return m.name; }).join(', ')) + '</div>'; }).join('') : '<div class="small text-muted">আর কোনো প্রেসক্রিপশন নেই</div>') + '</div>' +
        '<div class="mt-3"><button type="button" class="btn btn-sm btn-outline-secondary rounded-3" data-a="print">🖨 স্লিপ প্রিন্ট</button></div>';
      host.appendChild(d); d.querySelector('[data-a=print]').addEventListener('click', function () { slip(p); });
    } catch (e) { console.warn('rx-v86 detail', e); }
    return r;
  };
  function slip(p) {
    var name = (rj('pharmacy_theme', {}) || {}).name || 'MediCare Pharmacy', LN = (rj('pharmacy_settings', {}) || {}).licenseNo; if (LN) name += ' — Drug Licence: ' + LN; var w = window.open('', '_blank'); if (!w) { toast('পপ-আপ ব্লক — ব্রাউজারে অনুমতি দিন', 'warning'); return; }
    var rows = (p.medicines || []).map(function (m) { return '<tr><td>' + esc(m.name) + '</td><td>' + esc(m.dosage || '') + '</td><td>' + esc(m.duration || '') + '</td><td>' + (m.status === 'filled' ? '✔ দেওয়া হয়েছে' : 'বাকি') + '</td></tr>'; }).join('');
    w.document.write('<!doctype html><meta charset="utf-8"><title>' + esc(p.prescriptionNo) + '</title><style>body{font:14px system-ui,sans-serif;margin:24px;color:#111}h2{margin:0}table{border-collapse:collapse;width:100%;margin-top:10px}td,th{border:1px solid #999;padding:6px;text-align:left}.m{color:#555;font-size:12px}</style><h2>' + esc(name) + '</h2><div class="m">প্রেসক্রিপশন স্লিপ · ' + esc(today()) + '</div><hr><p><b>' + esc(p.prescriptionNo) + '</b> — রোগী: <b>' + esc(p.patientName) + '</b> ' + esc(p.patientPhone || '') + '<br>ডাক্তার: ' + esc(p.doctorName || '—') + ' · তারিখ: ' + esc(p.prescriptionDate || '') + ' · বৈধ: ' + esc(p.validUntil || '—') + '<br>রোগ নির্ণয়: ' + esc(p.diagnosis || '—') + '</p><table><tr><th>ওষুধ</th><th>ডোজ</th><th>মেয়াদ</th><th>অবস্থা</th></tr>' + rows + '</table><p class="m">এটি ডাক্তারের প্রেসক্রিপশনের বিকল্প নয়। ডোজ নিয়ে সন্দেহ হলে ডাক্তার/ফার্মাসিস্টের পরামর্শ নিন।</p><script>onload=function(){print()}<\/script>'); w.document.close();
  }
  /* ---------- সেভ: যাচাই ---------- */
  var BD = /^(?:\+?880|0)?1[3-9]\d{8}$/;
  var _s = window.savePrescription, okDup = false;
  window.savePrescription = function () {
    var ph = (($('patientPhone') || {}).value || '').replace(/[\s\-()]/g, ''), dt = ($('prescriptionDate') || {}).value || today(), vu = ($('validUntil') || {}).value, pn = (($('patientName') || {}).value || '').trim(), dn = (($('doctorName') || {}).value || '').trim();
    if (pn) {
      if (ph && !(BD.test(ph) || /^\+\d{8,15}$/.test(ph))) { toast('রোগীর ফোন নম্বর ঠিক নয় (যেমন 01712345678)', 'warning'); return; }
      if (vu && vu < dt) { toast('"বৈধ ততদিন" তারিখ প্রেসক্রিপশনের তারিখের আগে হতে পারে না', 'warning'); return; }
      if (dt > today() && diff(dt, today()) > 1) { toast('প্রেসক্রিপশনের তারিখ ভবিষ্যতের হতে পারে না', 'warning'); return; }
      var names = (medicineFields || []).map(function (f) { var e = $('medName_' + f.index); return e ? norm(e.value) : ''; }).filter(Boolean).sort().join('|');
      var dup = prescriptions.filter(function (x) { return norm(x.patientName) === norm(pn) && norm(x.doctorName) === norm(dn) && x.prescriptionDate === dt && (x.medicines || []).map(function (m) { return norm(m.name); }).sort().join('|') === names; })[0];
      if (dup && !okDup) { var self = this, a = arguments; ask('একই রোগী, ডাক্তার, তারিখ ও ওষুধের প্রেসক্রিপশন (' + dup.prescriptionNo + ') আগেই আছে। তবু নতুন করে সেভ করবেন?').then(function (v) { if (v) { okDup = true; try { window.savePrescription.apply(self, a); } finally { okDup = false; } } }); return; }
    }
    var n0 = prescriptions.length, r = _s.apply(this, arguments);
    try {
      if (prescriptions.length > n0) {
        var p = prescriptions[0], max = 0; prescriptions.forEach(function (x) { if (x !== p && x.prescriptionNo === p.prescriptionNo) max = 1; });
        if (max) { var y = new Date().getFullYear(), hi = prescriptions.reduce(function (a, x) { var m = String(x.prescriptionNo || '').match(/^RX-\d{4}-(\d+)$/); return m ? Math.max(a, +m[1]) : a; }, 0); p.prescriptionNo = 'RX-' + y + '-' + String(hi + 1).padStart(4, '0'); savePrescriptionsToStorage(); displayPrescriptions(); }
      }
    } catch (e) { }
    return r;
  };
  window.displayPrescriptions();
})();
