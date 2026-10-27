/* v86 — Supplier Management:
   • সেগমেন্ট চিপ (বাকি / ওভারডিউ / লিমিটের কাছে / নিষ্ক্রিয় / ৯০ দিন কেনা হয়নি)
   • কার্ডে শেষ কেনা, অর্ডার-সংখ্যা, ⏰ ওভারডিউ, দ্রুত বোতাম: 📈 প্রোফাইল · 🛒 কেনা · ⏯ সক্রিয়/নিষ্ক্রিয় · 📞 · WhatsApp
   • 📈 প্রোফাইল: মোট কেনা/পরিশোধ/বাকি, ক্রেডিট ব্যবহার, গড় অর্ডার, সময়মতো পরিশোধ %, সরবরাহ করা ওষুধ ও দাম (অন্যদের চেয়ে সস্তা/দামী), সাম্প্রতিক কেনা
   • 💰 দাম তুলনা: একই ওষুধ একাধিক সাপ্লায়ারের কাছ থেকে কিনলে কে সবচেয়ে সস্তা
   • ফোন যাচাই + ডুপ্লিকেট (ফোন/কোম্পানি) প্রতিরোধ; মুছতে গেলে বাকি/ইতিহাস সতর্কতা */
(function () {
  'use strict';
  if (typeof suppliers === 'undefined' || !document.getElementById('suppliersGrid')) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function $(i) { return document.getElementById(i); }
  var today = function () { return new Date(Date.now() + 216e5).toISOString().slice(0, 10); };
  var diff = function (a, b) { return Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 864e5); };
  var addDays = function (d, n) { var t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function toast(m, t) { try { showToast(m, t || 'info'); } catch (e) { } }
  function ask(msg) { return window.MCD && MCD.confirm ? MCD.confirm(msg) : Promise.resolve(confirm(msg)); }
  function audit(msg) { try { var a = rj('pharmacy_audit', []), u = rj('user', null) || {}; a.push({ at: new Date().toISOString(), by: u.name || u.role || 'staff', msg: msg }); localStorage.setItem('pharmacy_audit', JSON.stringify(a.slice(-300))); } catch (e) { } }
  function nm(s) { return s.companyName || s.name || ''; }
  function terms(s) { var t = String((s && s.paymentTerms) || ''); var m = t.match(/(\d+)/); return m ? +m[1] : (/cash|advance|immediate/i.test(t) ? 0 : 30); }
  function mine(s) { return rj('pharmacy_purchases', []).filter(function (p) { return p && (p.supplierId == s.id || (p.supplierName && p.supplierName === nm(s))); }); }
  function stats(s) {
    var P = mine(s), last = P.reduce(function (a, p) { return (p.date || '') > a ? p.date : a; }, ''), tot = P.reduce(function (a, p) { return a + (+p.totalAmount || 0); }, 0), paid = P.reduce(function (a, p) { return a + (+p.paid || 0); }, 0);
    var open = P.filter(function (p) { return p.due > 0; }), t = terms(s), over = open.filter(function (p) { return p.date && diff(today(), addDays(p.date, t)) > 0; });
    var oldest = over.reduce(function (a, p) { return Math.max(a, diff(today(), addDays(p.date, t))); }, 0);
    var settled = P.filter(function (p) { return !(p.due > 0); }).length, ontime = P.length ? Math.round(settled / P.length * 100) : null;
    var lim = +s.creditLimit || 0, due = +s.due || 0;
    return { P: P, n: P.length, last: last, ago: last ? diff(today(), last) : null, tot: tot, paid: paid, due: due, over: over.length, oldest: oldest, ontime: ontime, avg: P.length ? tot / P.length : 0, use: lim ? Math.round(due / lim * 100) : 0, lim: lim };
  }
  /* ---------- চিপ + কার্ড ---------- */
  var seg = 'all', SEGS = [['all', 'সব'], ['due', '💰 বাকি'], ['over', '⏰ ওভারডিউ'], ['limit', '⚠ লিমিটের কাছে'], ['off', '⏸ নিষ্ক্রিয়'], ['dorm', '😴 ৯০+ দিন কেনা হয়নি']];
  var chips = document.createElement('div'); chips.id = 'v86Chips'; chips.className = 'd-flex flex-wrap gap-2 mb-3';
  var grid = $('suppliersGrid'); grid.parentNode.insertBefore(chips, grid);
  function pass(s) {
    var st = stats(s);
    if (seg === 'due') return st.due > 0; if (seg === 'over') return st.over > 0; if (seg === 'limit') return st.lim > 0 && st.use >= 80; if (seg === 'off') return s.status !== 'active';
    if (seg === 'dorm') return st.n > 0 ? st.ago > 90 : diff(today(), s.joinDate || today()) > 90; return true;
  }
  function counts() { var c = {}; SEGS.forEach(function (g) { c[g[0]] = 0; }); var keep = seg; suppliers.forEach(function (s) { if (!s || !s.id) return; SEGS.forEach(function (g) { seg = g[0]; if (pass(s)) c[g[0]]++; }); }); seg = keep; return c; }
  function paintChips() {
    var c = counts(); chips.innerHTML = '';
    SEGS.forEach(function (g) { var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-sm rounded-pill ' + (seg === g[0] ? 'btn-primary' : 'btn-outline-secondary'); b.textContent = g[1] + ' (' + c[g[0]] + ')'; b.addEventListener('click', function () { seg = g[0]; try { currentPage = 1; } catch (e) { } displaySuppliers(); }); chips.appendChild(b); });
    var pc = document.createElement('button'); pc.type = 'button'; pc.className = 'btn btn-sm btn-outline-success rounded-pill ms-auto'; pc.textContent = '💰 দাম তুলনা'; pc.addEventListener('click', priceCompare); chips.appendChild(pc);
  }
  var _d = window.displaySuppliers;
  window.displaySuppliers = function () {
    var all = suppliers; try { suppliers = all.filter(function (s) { return s && s.id && pass(s); }); _d.apply(this, arguments); } finally { suppliers = all; }
    try { decorate(); paintChips(); } catch (e) { console.warn('sup-v86', e); }
  };
  function decorate() {
    [].forEach.call(document.querySelectorAll('#suppliersGrid .supplier-card'), function (card) {
      if (card.querySelector('.v86x')) return; var e = card.querySelector('button[onclick^="editSupplier("]'); if (!e) return; var id = +e.getAttribute('onclick').match(/\d+/)[0], s = suppliers.filter(function (x) { return x.id === id; })[0]; if (!s) return;
      var st = stats(s), ph = String(s.phone || '').replace(/[^\d+]/g, ''), body = card.querySelector('.card-body'), d = document.createElement('div'); d.className = 'v86x mt-2 pt-2 border-top small';
      d.innerHTML = '<div class="text-muted">🕒 ' + (st.last ? 'শেষ কেনা ' + (st.ago === 0 ? 'আজ' : st.ago + ' দিন আগে') : 'এখনও কেনা হয়নি') + ' · ' + st.n + 'টি অর্ডার' + (st.over ? ' · <b class="text-danger">⏰ ' + st.over + 'টি ওভারডিউ (' + st.oldest + ' দিন)</b>' : '') + (st.lim && st.use >= 80 ? ' · <b class="text-warning">লিমিট ' + st.use + '%</b>' : '') + '</div>' +
        '<div class="d-flex flex-wrap gap-1 mt-2"><button type="button" class="btn btn-sm btn-outline-primary rounded-3" data-a="prof">📈 প্রোফাইল</button><a class="btn btn-sm btn-outline-success rounded-3" href="purchases.html?supplier=' + id + '">🛒 কেনা</a><button type="button" class="btn btn-sm btn-outline-secondary rounded-3" data-a="tog">' + (s.status === 'active' ? '⏸' : '▶') + '</button>' +
        (ph ? '<a class="btn btn-sm btn-outline-secondary rounded-3" href="tel:' + esc(ph) + '">📞</a>' : '') + '</div>';
      body.appendChild(d);
      d.querySelector('[data-a=prof]').addEventListener('click', function () { profile(s); });
      d.querySelector('[data-a=tog]').addEventListener('click', function () { var on = s.status === 'active'; ask((on ? 'নিষ্ক্রিয়' : 'সক্রিয়') + ' করবেন: ' + nm(s) + '?').then(function (v) { if (!v) return; s.status = on ? 'inactive' : 'active'; saveSuppliersToStorage(); audit((on ? 'Deactivated' : 'Activated') + ' supplier ' + nm(s)); displaySuppliers(); }); });
    });
  }
  /* ---------- ওভারলে ---------- */
  function overlay(title, html) {
    var o = document.createElement('div'); o.className = 'v86-ov'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(10,15,30,.55);display:flex;align-items:flex-start;justify-content:center;padding:4vh 12px;overflow:auto';
    o.innerHTML = '<div class="v86-bx" style="background:#fff;color:#16213a;border-radius:16px;max-width:860px;width:100%;padding:1.2rem;box-shadow:0 20px 60px rgba(0,0,0,.35)"><div class="d-flex align-items-center mb-2"><h5 class="mb-0 me-auto">' + title + '</h5><button type="button" class="btn btn-sm btn-outline-secondary" data-x>✕</button></div>' + html + '</div>';
    var close = function () { o.remove(); document.removeEventListener('keydown', k); }, k = function (e) { if (e.key === 'Escape') close(); };
    o.addEventListener('click', function (e) { if (e.target === o || e.target.hasAttribute('data-x')) close(); }); document.addEventListener('keydown', k); document.body.appendChild(o); return o;
  }
  var dark = function () { return document.documentElement.getAttribute('data-mc') === 'dark'; };
  function prices() {
    var by = {}; rj('pharmacy_purchases', []).forEach(function (p) { (p.items || []).forEach(function (it) { if (!(+it.unitPrice > 0)) return; var m = by[it.medicineId] || (by[it.medicineId] = { name: it.medicineName, sup: {} }), k = p.supplierName || ('#' + p.supplierId), cur = m.sup[k]; if (!cur || (p.date || '') >= cur.date) m.sup[k] = { price: +it.unitPrice, date: p.date || '' }; }); }); return by;
  }
  function profile(s) {
    var st = stats(s), PR = prices(), items = {};
    st.P.forEach(function (p) { (p.items || []).forEach(function (it) { var x = items[it.medicineId] || (items[it.medicineId] = { name: it.medicineName, q: 0 }); x.q += +it.qty || 0; }); });
    var rows = Object.keys(items).map(function (id) { var x = items[id], m = PR[id], mine = m && m.sup[nm(s)] || null, others = m ? Object.keys(m.sup).filter(function (k) { return k !== nm(s); }).map(function (k) { return m.sup[k].price; }) : [], best = others.length ? Math.min.apply(null, others) : null; var tag = '—'; if (mine && best != null) tag = mine.price < best ? '<span class="text-success">✅ সবচেয়ে সস্তা</span>' : mine.price > best ? '<span class="text-danger">⚠ অন্যরা ' + tk(best) + '-এ দেয়</span>' : 'সমান'; return '<tr><td>' + esc(x.name) + '</td><td>' + x.q + '</td><td>' + (mine ? tk(mine.price) : '—') + '</td><td>' + tag + '</td></tr>'; }).join('');
    var recent = st.P.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); }).slice(0, 8).map(function (p) { return '<tr><td>' + esc(p.invoiceNo) + '</td><td>' + esc(p.date) + '</td><td>' + tk(p.totalAmount) + '</td><td>' + tk(p.paid) + '</td><td class="' + (p.due > 0 ? 'text-danger fw-bold' : '') + '">' + tk(p.due) + '</td></tr>'; }).join('');
    var ph = String(s.phone || '').replace(/[^\d+]/g, ''), wa = ph ? 'https://wa.me/' + ph.replace(/^\+/, '').replace(/^0/, '880') + '?text=' + encodeURIComponent('হ্যালো ' + (s.contactPerson || nm(s)) + ', ' + nm(s) + '-এর সাথে আমাদের বর্তমান বাকি ' + tk(st.due) + '। অনুগ্রহ করে মিলিয়ে নিন।') : '';
    var kp = function (a, b, c) { return '<div class="col-6 col-md-3"><div class="p-2 rounded-3" style="background:rgba(120,130,180,.12)"><div class="small text-muted">' + a + '</div><div class="fw-bold ' + (c || '') + '">' + b + '</div></div></div>'; };
    var o = overlay('📈 ' + esc(nm(s)) + ' <span class="badge ' + (s.status === 'active' ? 'bg-success' : 'bg-secondary') + '">' + (s.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়') + '</span>',
      '<p class="small text-muted mb-2">' + esc(s.contactPerson || '') + ' · ' + esc(s.phone || '') + ' · শর্ত: ' + esc(s.paymentTerms || '—') + '</p><div class="row g-2 mb-3">' +
      kp('মোট কেনা', tk(st.tot)) + kp('পরিশোধ', tk(st.paid)) + kp('বর্তমান বাকি', tk(st.due), st.due > 0 ? 'text-danger' : 'text-success') + kp('ক্রেডিট ব্যবহার', st.lim ? st.use + '% of ' + tk(st.lim) : '—', st.use >= 80 ? 'text-warning' : '') +
      kp('অর্ডার', st.n) + kp('গড় অর্ডার', tk(st.avg)) + kp('পুরো পরিশোধিত অর্ডার', st.ontime == null ? '—' : st.ontime + '%') + kp('শেষ কেনা', st.last ? (st.ago === 0 ? 'আজ' : st.ago + ' দিন আগে') : '—') + '</div>' +
      '<div class="d-flex flex-wrap gap-2 mb-3"><a class="btn btn-sm btn-primary rounded-3" href="purchases.html?supplier=' + s.id + '">🛒 নতুন কেনা</a>' + (ph ? '<a class="btn btn-sm btn-outline-secondary rounded-3" href="tel:' + esc(ph) + '">📞 কল</a>' : '') + (wa && st.due > 0 ? '<a class="btn btn-sm btn-outline-success rounded-3" target="_blank" rel="noopener" href="' + wa + '">💬 বাকি মিলিয়ে নিতে WhatsApp</a>' : '') + '</div>' +
      '<h6>💊 সরবরাহ করা ওষুধ</h6><div class="table-responsive mb-3"><table class="table table-sm"><thead><tr><th>ওষুধ</th><th>মোট পরিমাণ</th><th>শেষ দাম</th><th>তুলনা</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4" class="text-muted">এখনও কোনো কেনা নেই</td></tr>') + '</tbody></table></div>' +
      '<h6>🧾 সাম্প্রতিক কেনা</h6><div class="table-responsive"><table class="table table-sm"><thead><tr><th>ইনভয়েস</th><th>তারিখ</th><th>মোট</th><th>পরিশোধ</th><th>বাকি</th></tr></thead><tbody>' + (recent || '<tr><td colspan="5" class="text-muted">—</td></tr>') + '</tbody></table></div>');
    if (dark()) { var bx = o.querySelector('.v86-bx'); bx.style.background = '#171e36'; bx.style.color = '#e8ecfa'; }
  }
  function priceCompare() {
    var PR = prices(), rows = Object.keys(PR).map(function (id) { return PR[id]; }).filter(function (m) { return Object.keys(m.sup).length >= 2; }).map(function (m) {
      var ks = Object.keys(m.sup).sort(function (a, b) { return m.sup[a].price - m.sup[b].price; }), lo = m.sup[ks[0]].price, hi = m.sup[ks[ks.length - 1]].price, pct = hi > 0 ? Math.round((hi - lo) / hi * 100) : 0;
      return { m: m, ks: ks, lo: lo, hi: hi, pct: pct };
    }).sort(function (a, b) { return b.pct - a.pct; });
    var html = rows.length ? '<p class="small text-muted">একাধিক সাপ্লায়ারের কাছ থেকে কেনা ওষুধের শেষ দাম। সবচেয়ে সস্তা সবুজ।</p><div class="table-responsive"><table class="table table-sm"><thead><tr><th>ওষুধ</th><th>সাপ্লায়ার ও শেষ দাম</th><th>সাশ্রয়</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td>' + esc(r.m.name) + '</td><td>' + r.ks.map(function (k, i) { return '<span class="me-2 ' + (i === 0 ? 'text-success fw-bold' : '') + '">' + esc(k) + ' ' + tk(r.m.sup[k].price) + '</span>'; }).join('') + '</td><td>' + (r.pct ? r.pct + '% (' + tk(r.hi - r.lo) + '/ইউনিট)' : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="text-muted">দাম তুলনার মতো ডেটা এখনও নেই — একই ওষুধ অন্তত দুই সাপ্লায়ারের কাছ থেকে কিনলে এখানে দেখা যাবে।</p>';
    var o = overlay('💰 সাপ্লায়ার দাম তুলনা', html); if (dark()) { var bx = o.querySelector('.v86-bx'); bx.style.background = '#171e36'; bx.style.color = '#e8ecfa'; }
  }
  /* ---------- যাচাই ---------- */
  var BD = /^(?:\+?880|0)?1[3-9]\d{8}$/, INTL = /^\+\d{8,15}$/, norm = function (p) { return String(p || '').replace(/[\s\-()]/g, ''); };
  var _s = window.saveSupplier;
  window.saveSupplier = function () {
    var name = ($('companyName') || {}).value || '', ph = norm(($('supplierPhone') || {}).value), id = ($('editSupplierId') || {}).value, cl = parseFloat(($('creditLimit') || {}).value), od = parseFloat(($('openingDue') || {}).value);
    if (name.trim() && ph) {
      if (!(BD.test(ph) || INTL.test(ph) || /^\d{6,12}$/.test(ph))) { toast('ফোন নম্বর ঠিক নয় (যেমন 01712345678 বা +8801712345678)', 'warning'); return; }
      if (cl < 0 || od < 0) { toast('ক্রেডিট লিমিট/বাকি ঋণাত্মক হতে পারে না', 'warning'); return; }
      var dup = suppliers.filter(function (s) { return s && String(s.id) !== String(id) && (norm(s.phone) === ph || nm(s).trim().toLowerCase() === name.trim().toLowerCase()); })[0];
      if (dup) { toast('এই ফোন/কোম্পানির সাপ্লায়ার আগেই আছে: ' + nm(dup), 'warning'); return; }
    }
    var n0 = suppliers.length, r = _s.apply(this, arguments); if (!id && suppliers.length > n0) audit('Added supplier ' + name.trim()); else if (id) audit('Edited supplier ' + name.trim()); return r;
  };
  var _ds = window.deleteSupplier, okDel = false;
  window.deleteSupplier = function () {
    var s = suppliers.filter(function (x) { return x.id === deleteSupplierId; })[0];
    if (s && !okDel) { var st = stats(s); if (st.due > 0 || st.n > 0) { var self = this, a = arguments; ask(nm(s) + '-এর বাকি ' + tk(st.due) + ' এবং ' + st.n + 'টি কেনার ইতিহাস আছে। মুছলে সাপ্লায়ারের নাম ঐ কেনাগুলোতে থাকবে কিন্তু প্রোফাইল থাকবে না। তবু মুছবেন?').then(function (v) { if (v) { okDel = true; try { window.deleteSupplier.apply(self, a); } finally { okDel = false; } } }); return; } }
    var nme = s ? nm(s) : ''; var r = _ds.apply(this, arguments); if (nme) audit('Deleted supplier ' + nme); return r;
  };
  window.displaySuppliers();
})();
