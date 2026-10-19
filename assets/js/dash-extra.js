/* Dashboard insights per role: 7-day sales trend (inline SVG), top sellers, payment mix, and a role-specific "needs attention" list.
   Read-only: uses pharmacy_sales / medicines / customers / prescriptions / refunds from localStorage. */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var FN = { pharmacy_medicines: 'loadMedicines', pharmacy_customers: 'loadCustomers', pharmacy_prescriptions: 'loadPrescriptions' };
  function ld(k) { // page's own seeded demo list first (nothing saved yet), then storage
    try { if (localStorage.getItem(k) == null && FN[k] && typeof (0, eval)(FN[k]) === 'function') { var fb = (0, eval)(FN[k] + '()'); if (Array.isArray(fb)) return fb; } } catch (e) {}
    return rj(k, []);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString(); };
  var user = null; try { user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) {}
  if (!user) return;
  var role = user.role || 'staff', mineOnly = role === 'staff';
  var css = '.mcd{display:grid;grid-template-columns:2fr 1fr;gap:1rem;margin:0 0 1.2rem}@media(max-width:991px){.mcd{grid-template-columns:1fr}}' +
    '.mcd .pn{background:#fff;border:1px solid #e3e7f5;border-radius:18px;padding:1rem 1.1rem;box-shadow:0 4px 14px rgba(60,70,140,.07);color:#16213a}' +
    '.mcd h3{font-size:1rem;margin:0 0 .6rem;font-weight:700}.mcd .sub{color:#6b7794;font-size:.8rem;margin:-.4rem 0 .6rem}' +
    '.mcd svg{width:100%;height:auto;display:block}.mcd .bar{fill:#667eea}.mcd .bar.t{fill:#764ba2}.mcd text{fill:#6b7794;font:11px system-ui}.mcd .gl{stroke:#e3e7f5}' +
    '.mcd ol,.mcd ul{list-style:none;margin:0;padding:0}.mcd li{display:flex;justify-content:space-between;gap:.6rem;padding:.4rem 0;border-bottom:1px solid #eef0fa;font-size:.9rem}.mcd li:last-child{border:0}' +
    '.mcd .pill{display:inline-block;padding:0 .5rem;border-radius:999px;font-size:.75rem;font-weight:700;background:#eef0ff;color:#4c4fb0}.mcd .bad{background:#fde8e6;color:#b3261e}.mcd .warn{background:#fff3d6;color:#8a5a00}' +
    '.mcd .mix{display:flex;height:10px;border-radius:99px;overflow:hidden;margin:.3rem 0 .6rem;background:#eef0fa}.mcd .mix i{display:block}' +
    '.mcd .em{color:#6b7794;font-size:.9rem;padding:.6rem 0}.mcd a{color:#4c4fb0;text-decoration:none;font-weight:600}' +
    '@media(prefers-color-scheme:dark){.mcd .pn{background:#171e36;border-color:#27304f;color:#e8ecfa}.mcd .gl{stroke:#27304f}.mcd li{border-color:#27304f}.mcd .sub,.mcd text,.mcd .em{color:#a3adcb;fill:#a3adcb}.mcd .pill{background:#26305a;color:#c9d3ff}.mcd .mix{background:#26305a}.mcd a{color:#aab4ff}}' +
    '@media print{.mcd{display:none}}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  function dKey(d) { return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); }
  function build() {
    var host = document.getElementById('mcQuick'); if (!host) return false;
    var me = String(user.name || '').toLowerCase();
    var S = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status !== 'Voided' && s.status !== 'Refunded' && (!mineOnly || String(s.cashier || '').toLowerCase() === me); });
    var days = [], now = new Date();
    for (var i = 6; i >= 0; i--) { var d = new Date(now.getTime() - i * 864e5); days.push({ k: dKey(d), l: d.toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'short' }), v: 0 }); }
    S.forEach(function (s) { var x = days.filter(function (d) { return d.k === s.date; })[0]; if (x) x.v += +s.total || 0; });
    var max = Math.max.apply(null, days.map(function (d) { return d.v; }).concat([1])), tot = days.reduce(function (a, d) { return a + d.v; }, 0);
    var W = 420, H = 150, bw = 38, gap = (W - bw * 7) / 8, svg = '<svg viewBox="0 0 ' + W + ' ' + (H + 28) + '" role="img" aria-label="Last 7 days sales">';
    [0, .5, 1].forEach(function (f) { var y = H - f * (H - 14); svg += '<line class="gl" x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '"/>'; });
    days.forEach(function (d, n) { var h = d.v / max * (H - 14), x = gap + n * (bw + gap); svg += '<rect class="bar' + (n === 6 ? ' t' : '') + '" x="' + x + '" y="' + (H - h) + '" width="' + bw + '" height="' + Math.max(h, d.v ? 2 : 0) + '" rx="6"><title>' + d.k + ': ' + tk(d.v) + '</title></rect>' + (d.v ? '<text x="' + (x + bw / 2) + '" y="' + (H - h - 4) + '" text-anchor="middle">' + (d.v >= 1000 ? Math.round(d.v / 100) / 10 + 'k' : Math.round(d.v)) + '</text>' : '') + '<text x="' + (x + bw / 2) + '" y="' + (H + 16) + '" text-anchor="middle">' + d.l + '</text>'; });
    svg += '</svg>';
    // top sellers (30 days) + payment mix
    var cut = dKey(new Date(now.getTime() - 29 * 864e5)), top = {}, mix = {};
    S.forEach(function (s) { if (s.date < cut) return; (s.items || []).forEach(function (i) { var t = top[i.name] = top[i.name] || { q: 0, v: 0 }; t.q += +i.quantity || 0; t.v += (+i.price || 0) * (+i.quantity || 0); }); if (s.parts && s.parts.length) { s.parts.forEach(function (q) { mix[q.m] = (mix[q.m] || 0) + (+q.amt || 0); }); return; } var m = (s.paymentMethod || 'cash').toLowerCase(); mix[m] = (mix[m] || 0) + (+s.total || 0); });
    var tl = Object.keys(top).map(function (n) { return [n, top[n]]; }).sort(function (a, b) { return b[1].q - a[1].q; }).slice(0, 5);
    var mt = Object.keys(mix).reduce(function (a, k) { return a + mix[k]; }, 0), pal = ['#667eea', '#764ba2', '#2a9d8f', '#e9a23b', '#d6577a'];
    var mixBar = '<div class="mix">' + Object.keys(mix).map(function (k, n) { return '<i style="width:' + (mix[k] / mt * 100) + '%;background:' + pal[n % 5] + '" title="' + esc(k) + '"></i>'; }).join('') + '</div>' +
      Object.keys(mix).map(function (k, n) { return '<span class="pill" style="margin-right:.3rem"><b style="color:' + pal[n % 5] + '">●</b> ' + esc(k) + ' ' + Math.round(mix[k] / mt * 100) + '%</span>'; }).join('');
    // attention list by role
    var meds = ld('pharmacy_medicines'), today = dKey(now), in30 = dKey(new Date(now.getTime() + 30 * 864e5)), set = rj('pharmacy_settings', {});
    var low = meds.filter(function (m) { return (+m.stock || 0) <= (+m.minStock || +set.lowDefault || 0); }).length;
    var exp = meds.filter(function (m) { return m.expiryDate && m.expiryDate < today && (+m.stock || 0) > 0; }).length;
    var soon = meds.filter(function (m) { return m.expiryDate && m.expiryDate >= today && m.expiryDate <= in30 && (+m.stock || 0) > 0; }).length;
    var rx = ld('pharmacy_prescriptions').filter(function (p) { return /pending|partial/i.test(p.status || ''); }).length;
    var dues = ld('pharmacy_customers').reduce(function (a, c) { return a + (+c.due || +c.balance || 0); }, 0);
    var ref = rj('pharmacy_refunds', []).filter(function (r) { return r.date === today; }).reduce(function (a, r) { return a + (+r.amount || 0); }, 0);
    var tdy = days[6].v, A = [];
    function row(txt, n, cls, href) { A.push('<li><a href="' + href + '">' + txt + '</a><span class="pill ' + cls + '">' + n + '</span></li>'); }
    if (exp) row('মেয়াদোত্তীর্ণ (বিক্রি করবেন না)', exp, 'bad', role === 'staff' ? 'medicines.html' : 'writeoff.html');
    if (low) row('স্টক কম', low, 'warn', role === 'admin' || role === 'pharmacist' ? 'reorder.html' : 'medicines.html');
    if (soon) row('৩০ দিনে মেয়াদ শেষ', soon, 'warn', 'medicines.html');
    if (rx) row('Rx অপেক্ষমাণ', rx, '', 'prescriptions.html');
    if (role !== 'staff') { if (dues) row('কাস্টমার বাকি', tk(dues), '', 'customers.html'); if (ref) row('আজকের রিফান্ড', tk(ref), 'bad', 'refunds.html'); }
    var title = mineOnly ? 'আমার বিক্রি — ৭ দিন' : 'বিক্রি — ৭ দিন';
    var box = document.createElement('div'); box.className = 'mcd'; box.id = 'mcInsights';
    box.innerHTML = '<div class="pn"><h3>📈 ' + title + '</h3><div class="sub">মোট ' + tk(tot) + ' · আজ ' + tk(tdy) + '</div>' + (tot ? svg : '<div class="em">এখনও কোনো বিক্রি নেই — POS থেকে প্রথম বিল করুন।</div>') + '</div>' +
      '<div class="pn"><h3>🚦 মনোযোগ দরকার</h3>' + (A.length ? '<ul>' + A.join('') + '</ul>' : '<div class="em">সব ঠিক আছে ✔</div>') + '</div>' +
      '<div class="pn"><h3>🏆 সেরা বিক্রি (৩০ দিন)</h3>' + (tl.length ? '<ol>' + tl.map(function (t, n) { return '<li><span>' + (n + 1) + '. ' + esc(t[0]) + '</span><b>' + t[1].q + ' পিস</b></li>'; }).join('') + '</ol>' : '<div class="em">ডেটা নেই</div>') + '</div>' +
      '<div class="pn"><h3>💳 পেমেন্ট মিক্স</h3>' + (mt ? mixBar : '<div class="em">ডেটা নেই</div>') + '</div>';
    var TM = rj('pharmacy_team', { notices: [], tasks: [] }), em = String(user.email || '').toLowerCase(), todayK = dKey(now);
    var nts = (TM.notices || []).filter(function (n) { return !(n.ack && n.ack[em]); }).sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.id - a.id; }).slice(0, 3);
    var tks = (TM.tasks || []).filter(function (t) { return !t.done && (t.to === 'all' || t.to === role || t.to === em); }).slice(0, 4);
    if (nts.length || tks.length) box.innerHTML += '<div class="pn" style="grid-column:1/-1"><h3>📌 টিম বোর্ড <a href="team.html" style="font-size:.8rem;float:right">সব দেখুন →</a></h3><ul>' +
      nts.map(function (n) { return '<li><span>' + (n.pri === 'high' ? '🔴 ' : '📢 ') + esc(n.text) + '</span><small>' + esc(n.by) + '</small></li>'; }).join('') +
      tks.map(function (t) { return '<li><span>☐ ' + esc(t.text) + '</span><small' + (t.due && t.due < todayK ? ' style="color:#b3261e"' : '') + '>' + esc(t.due || '') + '</small></li>'; }).join('') + '</ul></div>';
    var old = document.getElementById('mcInsights'); if (old) old.remove();
    host.parentNode.insertBefore(box, host.nextSibling);
    // 2-col grid: make the two small panels share a row on wide screens
    return true;
  }
  function go() { var n = 0, t = setInterval(function () { if (build() || ++n > 40) clearInterval(t); }, 150); window.addEventListener('mc-sale', build); window.addEventListener('mc-team', build); window.addEventListener('load', function () { setTimeout(build, 600); setTimeout(build, 2000); }); window.addEventListener('storage', build); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
