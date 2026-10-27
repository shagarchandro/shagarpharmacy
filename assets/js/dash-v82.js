/* v82 — Dashboard: আসল সংখ্যা + নতুন উইজেট।
   ঠিক করা: আগে আসল বিক্রি না থাকলে প্রতিবার random ডেমো ডেটা তৈরি হতো; "Monthly profit" ছিল ৩০% অনুমান, ট্রেন্ড % ছিল random,
   Top-selling ও Recent Orders-এর ওষুধের নাম random ছিল। এখন সবকিছু pharmacy_sales (POS) + শপ-অর্ডার থেকে হিসাব হয়।
   নতুন: 🎯 দৈনিক/মাসিক লক্ষ্য · 📅 আজকের সারাংশ (গতকালের তুলনা, পেমেন্ট মিক্স, ব্যস্ত ঘণ্টা, লাভ) · ✅ আজ কী করতে হবে ·
   📈 বিক্রির চার্ট (৭ দিন/৩০ দিন/১২ মাস, SVG — CDN ছাড়াই) · 🏆 Top selling (আসল) · 🧾 সাম্প্রতিক অর্ডার (POS + অনলাইন) ·
   ⚙ কাস্টমাইজ (উইজেট দেখান/লুকান) · 📤 আজকের সারাংশ শেয়ার · 🔄 রিফ্রেশ। */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(i) { return document.getElementById(i); }
  function who() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { return null; } }
  var U = who(); if (!U) return;
  var ROLE = U.role, ME = String(U.email || '').toLowerCase(), STAFF = ROLE === 'staff', ADMINISH = ROLE === 'admin' || ROLE === 'pharmacist';
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); }
  function tk(n) { n = Math.round((+n || 0) * 100) / 100; return '৳' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
  function dk(ms) { return new Date(ms + 216e5).toISOString().slice(0, 10); }
  function addDays(ds, n) { return dk(Date.parse(ds + 'T00:00:00Z') - 216e5 + n * 864e5); }
  function pct(a, b) { if (!b) return a ? null : 0; return Math.round((a - b) / b * 100); }
  function pctTxt(p) { return p === null ? 'নতুন' : (p >= 0 ? '▲ ' : '▼ ') + bn(Math.abs(p)) + '%'; }
  function pctCls(p) { return p === null || p >= 0 ? 'text-success' : 'text-danger'; }

  /* ---------- ডেটা ---------- */
  function saleDate(s) { return s.date || (s.at ? dk(Date.parse(s.at)) : ''); }
  function sales() {
    var a = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status !== 'Voided'; });
    if (STAFF) { var nm = String(U.name || U.role || ''); a = a.filter(function (s) { return String(s.cashier || '') === nm; }); }
    return a;
  }
  var COST = null;
  function costOf(id) { if (!COST) { COST = {}; rj('pharmacy_medicines', []).forEach(function (m) { if (m && m.id != null && +m.purchasePrice > 0) COST[String(m.id)] = +m.purchasePrice; }); } return COST[String(id)]; }
  function profitOf(s) {
    var p = 0, known = 0, all = 0;
    (s.items || []).forEach(function (i) { var c = costOf(i.id), q = +i.quantity || 0; all += q; if (c != null) { p += ((+i.price || 0) - c) * q; known += q; } });
    return { p: p - (+s.discount || 0), cov: all ? known / all : 1 };
  }
  function sum(arr, f) { return arr.reduce(function (a, s) { return a + (f(s) || 0); }, 0); }
  function between(S, a, b) { return S.filter(function (s) { var d = saleDate(s); return d >= a && d <= b; }); }
  function itemsCount(arr) { return sum(arr, function (s) { return sum(s.items || [], function (i) { return +i.quantity || 0; }); }); }

  /* ---------- স্টাইল ---------- */
  var css = '.v82p{height:100%}.v82p h5{font-size:1rem;font-weight:700;margin:0 0 .6rem;display:flex;justify-content:space-between;align-items:center;gap:.5rem}' +
    '.v82p .big{font-size:1.6rem;font-weight:800;line-height:1.1}.v82p .sm{font-size:.8rem;opacity:.75}.v82p .bar{height:10px;border-radius:99px;background:rgba(128,128,170,.22);overflow:hidden;margin:.4rem 0}.v82p .bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#667eea,#764ba2);transition:width .5s}.v82p .bar i.ok{background:linear-gradient(90deg,#22c55e,#16a34a)}' +
    '.v82p ul{list-style:none;margin:0;padding:0}.v82p li{display:flex;justify-content:space-between;gap:.5rem;padding:.3rem 0;border-bottom:1px dashed rgba(128,128,170,.25);font-size:.9rem}.v82p li:last-child{border:0}' +
    '.v82t a{display:flex;gap:.6rem;align-items:center;padding:.4rem .5rem;border-radius:10px;text-decoration:none;color:inherit;font-size:.9rem}.v82t a:hover{background:rgba(102,126,234,.14)}.v82t .n{margin-left:auto;font-weight:700;border-radius:99px;padding:0 .55rem;background:#ef4444;color:#fff;font-size:.78rem}.v82t .n.w{background:#f59e0b}.v82t .n.i{background:#3b82f6}.v82t .ok{color:#16a34a;font-weight:600;padding:.4rem .5rem}' +
    '.v82seg{display:inline-flex;border:1px solid rgba(128,128,170,.4);border-radius:10px;overflow:hidden}.v82seg button{border:0;background:transparent;color:inherit;padding:.2rem .7rem;font-size:.8rem;cursor:pointer}.v82seg button.on{background:#667eea;color:#fff}' +
    '#v82Chart svg{width:100%;height:auto;display:block}#v82Chart text{fill:currentColor;font-size:10px;opacity:.7}#v82Chart .b{fill:#667eea;opacity:.85}#v82Chart .b.t{fill:#764ba2;opacity:1}#v82Chart .b:hover{opacity:1}' +
    '.v82tools{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin-top:.6rem}.v82btn{border:1px solid rgba(128,128,170,.45);background:transparent;color:inherit;border-radius:10px;padding:.25rem .7rem;font-size:.85rem;cursor:pointer}.v82btn:hover{background:rgba(102,126,234,.16)}' +
    '.v82cm{position:absolute;right:16px;top:100%;z-index:50;background:#fff;color:#16213a;border-radius:12px;box-shadow:0 12px 34px rgba(30,40,100,.28);padding:.6rem .9rem;display:none;min-width:240px}.v82cm.on{display:block}body.dark-mode .v82cm{background:#171e36;color:#e8ecfa}.v82cm label{display:flex;gap:.5rem;align-items:center;padding:.2rem 0;font-size:.9rem;cursor:pointer}' +
    '.v82ban{border-radius:12px;padding:.6rem .9rem;margin-bottom:1rem;background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.35);font-size:.9rem}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- কাঠামো ---------- */
  var built = false, period = '7';
  var PREF = function () { return (rj('pharmacy_dashprefs', {}))[ME] || { hide: [] }; };
  var SECT = [['v82Row', '🎯 লক্ষ্য · 📅 আজকের সারাংশ · ✅ করণীয়'], ['v82Stats', '📊 মূল সংখ্যা (বিক্রি, লাভ, ওষুধ)'], ['v82Cust', '👥 কাস্টমার/সরবরাহকারী/Rx সংখ্যা'], ['v82Alerts', '⚠️ কম স্টক ও মেয়াদ'], ['v82ChartRow', '📈 চার্ট ও Top selling'], ['v82Recent', '🧾 সাম্প্রতিক অর্ডার']];
  var GET = {
    v82Row: function () { return $('v82Row'); }, v82Stats: function () { return $('statsContainer'); },
    v82Cust: function () { var c = $('statTotalCustomers'); return c && c.closest('.row'); }, v82Alerts: function () { var a = $('lowStockAlerts'); return a && a.closest('.row'); },
    v82ChartRow: function () { var c = $('salesChart'); return c && c.closest('.row'); }, v82Recent: function () { var r = $('recentOrdersTable'); return r && r.closest('.stat-card'); }
  };
  function mark() { }
  function build() {
    if (built) return; var wm = $('welcomeMessage'); if (!wm) return; built = true; mark();
    var wc = wm.closest('.glass-card'); wc.style.position = 'relative';
    var row = document.createElement('div'); row.className = 'row g-4 mb-4'; row.id = 'v82Row';
    row.innerHTML = '<div class="col-lg-4"><div class="stat-card v82p" id="v82Goal"></div></div><div class="col-lg-4"><div class="stat-card v82p" id="v82Today"></div></div><div class="col-lg-4"><div class="stat-card v82p v82t" id="v82Todo"></div></div>';
    wc.after(row);
    var tl = document.createElement('div'); tl.className = 'v82tools';
    tl.innerHTML = '<button class="v82btn" id="v82Ref">🔄 রিফ্রেশ</button><button class="v82btn" id="v82Share">📤 আজকের সারাংশ</button><button class="v82btn" id="v82Cus">⚙ কাস্টমাইজ</button><span class="sm" id="v82Upd" style="font-size:.8rem;opacity:.7"></span>';
    wc.appendChild(tl);
    var cm = document.createElement('div'); cm.className = 'v82cm'; cm.id = 'v82Cm'; cm.innerHTML = '<b>কোন অংশ দেখাবেন</b>' + SECT.map(function (s) { return '<label><input type="checkbox" data-s="' + s[0] + '"> ' + s[1] + '</label>'; }).join('');
    wc.appendChild(cm);
    $('v82Cus').onclick = function (e) { e.stopPropagation(); cm.classList.toggle('on'); };
    document.addEventListener('click', function (e) { if (!cm.contains(e.target)) cm.classList.remove('on'); });
    cm.addEventListener('change', function (e) {
      var m = rj('pharmacy_dashprefs', {}), p = m[ME] || { hide: [] }; var id = e.target.getAttribute('data-s');
      p.hide = (p.hide || []).filter(function (x) { return x !== id; }); if (!e.target.checked) p.hide.push(id); m[ME] = p; wr('pharmacy_dashprefs', m); applyHide();
    });
    $('v82Ref').onclick = function () { refresh(true); };
    $('v82Share').onclick = shareSummary;
    /* চার্ট: canvas-এর জায়গায় SVG */
    var cv = $('salesChart'); if (cv) {
      var card = cv.closest('.stat-card'), h = card.querySelector('h5'); if (h) h.innerHTML = '📈 বিক্রির চার্ট <span class="v82seg" id="v82Seg"><button data-p="7" class="on">৭ দিন</button><button data-p="30">৩০ দিন</button><button data-p="12">১২ মাস</button></span>';
      h.style.cssText = 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem';
      cv.style.display = 'none'; var d = document.createElement('div'); d.id = 'v82Chart'; cv.after(d);
      $('v82Seg').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; period = b.dataset.p; [].forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); }); drawChart(); };
    }
    applyHide();
  }
  function applyHide() {
    var hide = PREF().hide || [];
    SECT.forEach(function (s) { var el = GET[s[0]](); if (el) el.style.display = hide.indexOf(s[0]) > -1 ? 'none' : ''; var cb = document.querySelector('#v82Cm [data-s="' + s[0] + '"]'); if (cb) cb.checked = hide.indexOf(s[0]) === -1; });
  }

  /* ---------- হিসাব ও আঁকা ---------- */
  var S = [], td = '', yd = '';
  function kpis() {
    td = dk(Date.now()); yd = addDays(td, -1);
    var all = S, today = between(all, td, td), yest = between(all, yd, yd);
    var w1 = between(all, addDays(td, -6), td), w0 = between(all, addDays(td, -13), addDays(td, -7));
    var m0 = td.slice(0, 7) + '-01', mS = between(all, m0, td), pmEnd = addDays(m0, -1), pm0 = pmEnd.slice(0, 7) + '-01', pmS = between(all, pm0, pmEnd);
    var pr = function (arr) { var p = 0, kn = 0, tot = 0; arr.forEach(function (s) { var r = profitOf(s); p += r.p; kn += r.cov * (s.total || 0); tot += (s.total || 0); }); return { p: p, cov: tot ? kn / tot : 1 }; };
    return { all: all, today: today, yest: yest, w1: w1, w0: w0, mS: mS, pmS: pmS, pm0: pm0, mProfit: pr(mS), pmProfit: pr(pmS), tProfit: pr(today) };
  }
  function setKpi() {
    var k = kpis(), T = sum(k.today, function (s) { return s.total; }), Y = sum(k.yest, function (s) { return s.total; });
    var set = function (id, h) { var e = $(id); if (e) e.innerHTML = h; };
    set('statTotalSales', tk(sum(k.all, function (s) { return s.total; })));
    var W1 = sum(k.w1, function (s) { return s.total; }), W0 = sum(k.w0, function (s) { return s.total; }), pw = pct(W1, W0);
    set('statSalesTrend', '<span class="' + pctCls(pw) + '">' + pctTxt(pw) + '</span> <span class="text-muted">গত ৭ দিন (আগের ৭ দিনের তুলনায়)</span>');
    set('statTodaySales', tk(T)); var py = pct(T, Y);
    set('statTodayInfo', bn(k.today.length) + 'টি ইনভয়েস · <span class="' + pctCls(py) + '">' + pctTxt(py) + '</span> গতকালের তুলনায়');
    if (STAFF) { set('statMonthlyProfit', '—'); set('statProfitTrend', '<span class="text-muted">শুধু Admin/Pharmacist</span>'); }
    else {
      set('statMonthlyProfit', tk(k.mProfit.p)); var pp = pct(k.mProfit.p, k.pmProfit.p);
      set('statProfitTrend', '<span class="' + pctCls(pp) + '">' + pctTxt(pp) + '</span> <span class="text-muted">গত মাসের তুলনায়' + (k.mProfit.cov < 0.95 ? ' · খরচ জানা ' + bn(Math.round(k.mProfit.cov * 100)) + '%' : '') + '</span>');
    }
    var lbl = document.querySelector('#statMonthlyProfit'); if (lbl) { var p = lbl.parentElement.querySelector('p,small.text-muted,span.text-muted'); }
    return k;
  }
  function goalCard(k) {
    var G = rj('pharmacy_goal', {}), T = sum(k.today, function (s) { return s.total; }), M = sum(k.mS, function (s) { return s.total; });
    var dayN = +td.slice(8), dim = new Date(Date.UTC(+td.slice(0, 4), +td.slice(5, 7), 0)).getUTCDate(), proj = dayN ? M / dayN * dim : 0;
    var edit = ADMINISH ? '<button class="v82btn" id="v82GoalEdit" title="লক্ষ্য বদলান">✏️</button>' : '';
    var h = '<h5>🎯 লক্ষ্য ' + edit + '</h5>';
    if (!G.daily && !G.monthly) { h += '<div class="sm mb-2">এখনো কোনো লক্ষ্য সেট করা নেই।</div>' + (ADMINISH ? '<button class="v82btn" id="v82GoalSet">লক্ষ্য সেট করুন</button>' : ''); }
    else {
      if (G.daily) { var p = Math.min(100, T / G.daily * 100); h += '<div class="sm">আজকের লক্ষ্য ' + tk(G.daily) + '</div><div class="big">' + tk(T) + ' <span class="sm">(' + bn(Math.round(T / G.daily * 100)) + '%)</span></div><div class="bar"><i class="' + (T >= G.daily ? 'ok' : '') + '" style="width:' + p + '%"></i></div><div class="sm mb-2">' + (T >= G.daily ? '🎉 আজকের লক্ষ্য পূরণ!' : 'বাকি ' + tk(G.daily - T)) + '</div>'; }
      if (G.monthly) { var pm = Math.min(100, M / G.monthly * 100); h += '<div class="sm">মাসিক লক্ষ্য ' + tk(G.monthly) + '</div><div class="bar"><i class="' + (M >= G.monthly ? 'ok' : '') + '" style="width:' + pm + '%"></i></div><div class="sm">এ পর্যন্ত ' + tk(M) + ' (' + bn(Math.round(M / G.monthly * 100)) + '%) · এই গতিতে মাস শেষে ≈ ' + tk(proj) + (proj >= G.monthly ? ' ✅' : '') + '</div>'; }
    }
    $('v82Goal').innerHTML = h;
    var f = function () {
      var run = function (d, m) { var o = rj('pharmacy_goal', {}); o.daily = d; o.monthly = m; wr('pharmacy_goal', o); refresh(); };
      var ask = function (t, def) { return window.MCD && MCD.prompt ? MCD.prompt(t, String(def || '')) : Promise.resolve(window.prompt(t, def || '')); };
      ask('দৈনিক বিক্রির লক্ষ্য (৳) — ফাঁকা = নেই', G.daily || '').then(function (d) { if (d === null || d === undefined) return; var dn = Math.max(0, parseFloat(String(d).replace(/[^\d.]/g, '')) || 0); return ask('মাসিক বিক্রির লক্ষ্য (৳) — ফাঁকা = নেই', G.monthly || '').then(function (m) { if (m === null || m === undefined) return; run(dn, Math.max(0, parseFloat(String(m).replace(/[^\d.]/g, '')) || 0)); }); });
    };
    ['v82GoalEdit', 'v82GoalSet'].forEach(function (i) { var b = $(i); if (b) b.onclick = f; });
  }
  function todayCard(k) {
    var T = sum(k.today, function (s) { return s.total; }), Y = sum(k.yest, function (s) { return s.total; }), n = k.today.length, avg = n ? T / n : 0;
    var mix = {}; k.today.forEach(function (s) { var m = s.paymentMethod || 'Cash'; mix[m] = (mix[m] || 0) + (s.total || 0); });
    var hrs = {}; k.today.forEach(function (s) { if (s.at) { var h = new Date(Date.parse(s.at) + 216e5).getUTCHours(); hrs[h] = (hrs[h] || 0) + 1; } });
    var bh = Object.keys(hrs).sort(function (a, b) { return hrs[b] - hrs[a]; })[0];
    var items = {}; k.today.forEach(function (s) { (s.items || []).forEach(function (i) { items[i.name] = (items[i.name] || 0) + (+i.quantity || 0); }); });
    var top = Object.keys(items).sort(function (a, b) { return items[b] - items[a]; })[0];
    var h = '<h5>📅 আজকের সারাংশ</h5><div class="big">' + tk(T) + '</div><div class="sm mb-2">গতকাল ' + tk(Y) + ' · <span class="' + pctCls(pct(T, Y)) + '">' + pctTxt(pct(T, Y)) + '</span></div><ul>' +
      '<li><span>ইনভয়েস</span><b>' + bn(n) + '</b></li><li><span>গড় বিল</span><b>' + tk(avg) + '</b></li><li><span>বিক্রিত ইউনিট</span><b>' + bn(itemsCount(k.today)) + '</b></li>' +
      (STAFF ? '' : '<li><span>আজকের লাভ' + (k.tProfit.cov < .95 ? ' <small>(আংশিক)</small>' : '') + '</span><b>' + tk(k.tProfit.p) + '</b></li>') +
      (top ? '<li><span>সবচেয়ে বেশি</span><b>' + esc(top) + ' ×' + bn(items[top]) + '</b></li>' : '') + (bh !== undefined ? '<li><span>ব্যস্ততম সময়</span><b>' + bn(+bh) + ':০০–' + bn(+bh + 1) + ':০০</b></li>' : '') +
      Object.keys(mix).map(function (m) { return '<li><span>' + esc(m) + '</span><b>' + tk(mix[m]) + '</b></li>'; }).join('') + '</ul>' + (n ? '' : '<div class="sm mt-2">আজ এখনো কোনো বিক্রি হয়নি। <a href="sales.html">POS খুলুন →</a></div>');
    $('v82Today').innerHTML = h;
  }
  function todoCard() {
    var P = (rj('pharmacy_prefs_v80', {})[ME]) || {}, td0 = dk(Date.now()), L = [];
    var meds = rj('pharmacy_medicines', []);
    var exp = 0, soon = 0, out = 0, low = 0;
    meds.forEach(function (m) { var s = +m.stock || 0, mn = +m.minStock || 0; if (m.expiryDate && s > 0) { var d = Math.ceil((Date.parse(String(m.expiryDate).slice(0, 10)) - Date.parse(td0)) / 864e5); if (d < 0) exp++; else if (d <= 30) soon++; } if (s <= 0) out++; else if (s <= mn) low++; });
    if (!P.noExpiry && exp) L.push(['⛔ মেয়াদোত্তীর্ণ ওষুধ (বিক্রি বন্ধ করুন)', exp, '', 'writeoff.html']);
    if (!P.noExpiry && soon) L.push(['⏳ ৩০ দিনে মেয়াদ শেষ', soon, 'w', 'medicines.html']);
    if (!P.noStock && out) L.push(['🚫 স্টক শেষ', out, '', 'reorder.html']);
    if (!P.noStock && low) L.push(['📦 কম স্টক', low, 'w', 'reorder.html']);
    var rx = rj('pharmacy_prescriptions', []).filter(function (p) { return p && p.status === 'pending'; }).length; if (!P.noOps && rx) L.push(['📋 অপেক্ষমাণ প্রেসক্রিপশন', rx, 'i', 'prescriptions.html']);
    var shop = (rj('mc_db', {}).orders || []).filter(function (o) { return o && /^(Ordered|Pending|Prescription Review|Return Requested)$/.test(o.status || ''); }).length; if (!P.noOps && shop && !STAFF) L.push(['🛒 অনলাইন অর্ডারে মনোযোগ দরকার', shop, 'i', 'admin/login.html']);
    var due = rj('pharmacy_customers', []).filter(function (c) { return (+c.due || 0) > 0; }); if (!P.noMoney && due.length && !STAFF) L.push(['💰 বাকি আদায় (' + tk(sum(due, function (c) { return +c.due; })) + ')', due.length, 'w', 'customers.html']);
    var y = addDays(td0, -1); var sl = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status !== 'Voided' && saleDate(s) === y; }).length;
    if (!P.noOps && !STAFF && sl && !rj('pharmacy_closings', []).some(function (c) { return c.date === y; })) L.push(['🧮 গতকালের ক্লোজিং বাকি', '!', 'w', 'closing.html']);
    var lb = localStorage.getItem('pharmacy_lastbackup') || localStorage.getItem('mc_lastbackup');
    if (!P.noOps && !STAFF && (!lb || (Date.now() - Date.parse(lb)) / 864e5 >= 7)) L.push([lb ? '💾 ব্যাকআপ ৭ দিনের বেশি পুরনো' : '💾 এখনো ব্যাকআপ নেওয়া হয়নি', '!', 'w', 'backup.html']);
    $('v82Todo').innerHTML = '<h5>✅ আজ কী করতে হবে</h5>' + (L.length ? L.map(function (x) { return '<a href="' + x[3] + '"><span>' + x[0] + '</span><span class="n ' + x[2] + '">' + (typeof x[1] === 'number' ? bn(x[1]) : x[1]) + '</span></a>'; }).join('') : '<div class="ok">🎉 সব ঠিক আছে — জরুরি কিছু নেই।</div>');
  }
  function drawChart() {
    var box = $('v82Chart'); if (!box) return; var N = period === '12' ? 12 : +period, bars = [], i;
    if (period === '12') { var ym = td.slice(0, 7); for (i = 11; i >= 0; i--) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - i; while (m < 1) { m += 12; y--; } var key = y + '-' + (m < 10 ? '0' : '') + m; bars.push({ k: key, l: ['জান', 'ফেব', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুল', 'আগ', 'সেপ', 'অক্টো', 'নভে', 'ডিসে'][m - 1], v: 0, c: 0 }); } S.forEach(function (s) { var d = saleDate(s).slice(0, 7); bars.forEach(function (b) { if (b.k === d) { b.v += s.total || 0; b.c++; } }); }); }
    else { for (i = N - 1; i >= 0; i--) { var d = addDays(td, -i); bars.push({ k: d, l: N === 7 ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'][new Date(d + 'T00:00:00Z').getUTCDay()] : bn(+d.slice(8)), v: 0, c: 0 }); } S.forEach(function (s) { var d2 = saleDate(s); bars.forEach(function (b) { if (b.k === d2) { b.v += s.total || 0; b.c++; } }); }); }
    var max = Math.max.apply(null, bars.map(function (b) { return b.v; }).concat([1])), W = 600, H = 220, pl = 8, pb = 22, pt = 14, bw = (W - pl * 2) / bars.length, tot = sum(bars, function (b) { return b.v; });
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="বিক্রির চার্ট">';
    [0, .5, 1].forEach(function (g) { var yy = pt + (H - pt - pb) * (1 - g); svg += '<line x1="' + pl + '" x2="' + (W - pl) + '" y1="' + yy + '" y2="' + yy + '" stroke="rgba(128,128,170,.25)"/><text x="' + (W - pl) + '" y="' + (yy - 2) + '" text-anchor="end">' + (g ? tk(max * g) : '') + '</text>'; });
    bars.forEach(function (b, n) { var h = b.v / max * (H - pt - pb), x = pl + n * bw + bw * .15, w = bw * .7, last = n === bars.length - 1; svg += '<rect class="b' + (last ? ' t' : '') + '" x="' + x + '" y="' + (H - pb - h) + '" width="' + w + '" height="' + Math.max(h, b.v ? 1.5 : 0) + '" rx="3"><title>' + esc(b.k) + ' · ' + tk(b.v) + ' · ' + bn(b.c) + 'টি ইনভয়েস</title></rect>'; if (bars.length <= 14 || n % 3 === 0 || last) svg += '<text x="' + (x + w / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + b.l + '</text>'; });
    svg += '</svg>'; box.innerHTML = tot ? svg + '<div class="sm" style="font-size:.8rem;opacity:.75">মোট ' + tk(tot) + ' · গড় ' + tk(tot / bars.length) + (period === '12' ? '/মাস' : '/দিন') + '</div>' : '<div class="text-center text-muted py-5">এই সময়ে কোনো বিক্রি নেই।</div>';
  }
  function topSelling() {
    var c = $('topSellingList'); if (!c) return; var from = addDays(td, -29), m = {};
    between(S, from, td).forEach(function (s) { (s.items || []).forEach(function (i) { var o = m[i.name] || (m[i.name] = { q: 0, r: 0 }); o.q += +i.quantity || 0; o.r += (+i.price || 0) * (+i.quantity || 0); }); });
    var rows = Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1].q - a[1].q; }).slice(0, 5), mx = rows.length ? rows[0][1].q : 1;
    var h4 = c.closest('.stat-card'); h4 = h4 && h4.querySelector('h5'); if (h4) h4.textContent = '🏆 Top Selling (গত ৩০ দিন)';
    c.innerHTML = rows.length ? rows.map(function (r) { return '<div class="mb-3"><div class="d-flex justify-content-between mb-1"><span>' + esc(r[0]) + '</span><span class="fw-bold">' + bn(r[1].q) + ' ইউনিট · ' + tk(r[1].r) + '</span></div><div class="progress" style="height:8px"><div class="progress-bar bg-gradient" style="width:' + (r[1].q / mx * 100) + '%"></div></div></div>'; }).join('') : '<div class="text-center text-muted py-3">এখনো বিক্রির তথ্য নেই।</div>';
  }
  function recent() {
    var tb = $('recentOrdersTable'); if (!tb) return; var rows = [];
    S.forEach(function (s) { rows.push({ no: s.invoiceNo, who: s.customer || 'Walk-in', it: s.items || [], total: s.total, st: s.status || 'Completed', d: saleDate(s), at: s.at || s.date, src: 'POS' }); });
    if (!STAFF) (rj('mc_db', {}).orders || []).forEach(function (o) { if (o) rows.push({ no: o.no, who: o.customer, it: (o.items || []).map(function (i) { return { name: i.name, quantity: i.qty }; }), total: o.total, st: o.status, d: String(o.at || '').slice(0, 10), at: o.at, src: 'Online' }); });
    rows.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    var h5 = tb.closest('.stat-card').querySelector('h5'); if (h5) h5.textContent = 'Recent Orders (POS + অনলাইন)';
    tb.innerHTML = rows.length ? rows.slice(0, 8).map(function (r) { var nm = r.it.length ? esc(r.it[0].name) + (r.it.length > 1 ? ' +' + bn(r.it.length - 1) : '') : '—', cls = /Completed|Delivered/.test(r.st) ? 'bg-success' : /Cancel|Reject/.test(r.st) ? 'bg-danger' : /Pending|Review|Ordered|Return/.test(r.st) ? 'bg-warning' : 'bg-info';
      return '<tr><td>' + esc(r.no) + ' <span class="badge ' + (r.src === 'POS' ? 'bg-secondary' : 'bg-primary') + '">' + r.src + '</span></td><td>' + esc(r.who) + '</td><td>' + nm + '</td><td>' + tk(r.total) + '</td><td><span class="badge ' + cls + ' rounded-pill">' + esc(r.st) + '</span></td><td>' + esc(r.d) + '</td></tr>'; }).join('') : '<tr><td colspan="6" class="text-center text-muted py-3">এখনো কোনো অর্ডার নেই — <a href="sales.html">প্রথম বিক্রি করুন</a></td></tr>';
  }
  function greet() {
    var h = +new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', hour12: false }), w = h < 5 ? 'শুভ রাত্রি' : h < 12 ? 'শুভ সকাল' : h < 16 ? 'শুভ দুপুর' : h < 19 ? 'শুভ বিকাল' : 'শুভ সন্ধ্যা';
    var wm = $('welcomeMessage'); if (wm) { wm.textContent = w + ', ' + String(U.name || '').split(' ')[0] + '! 👋'; var p = wm.parentElement.querySelector('p'); if (p) p.textContent = new Date().toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · আপনার ফার্মেসির আজকের অবস্থা'; }
  }
  function shareSummary() {
    var k = kpis(), T = sum(k.today, function (s) { return s.total; }), name = (rj('pharmacy_settings', {}).store || 'MediCare Pharmacy');
    var txt = '📅 ' + td + ' — ' + name + '\n🧾 ইনভয়েস: ' + bn(k.today.length) + '\n💰 বিক্রি: ' + tk(T) + (STAFF ? '' : '\n📈 লাভ: ' + tk(k.tProfit.p)) + '\n📦 ইউনিট: ' + bn(itemsCount(k.today)) + '\nগতকাল: ' + tk(sum(k.yest, function (s) { return s.total; }));
    var go = function (c) { if (c === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener'); else { try { navigator.clipboard.writeText(txt); } catch (e) { } if (window.showToast) showToast('সারাংশ কপি হয়েছে', 'success'); } };
    if (window.MCD && MCD.choose) MCD.choose('আজকের সারাংশ কীভাবে শেয়ার করবেন?', { items: [{ label: '💬 WhatsApp', value: 'wa' }, { label: '📋 কপি', value: 'cp' }] }).then(function (v) { if (v) go(v); }); else go('cp');
  }

  function refresh() {
    try {
      COST = null; build(); if (!built) return; S = sales(); var k = setKpi();
      goalCard(k); todayCard(k); todoCard(); drawChart(); topSelling(); recent(); greet(); mark();
      var u = $('v82Upd'); if (u) u.textContent = 'আপডেট: ' + new Date().toLocaleTimeString('bn-BD', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' });
      var nb = $('v82Ban'); var any = rj('pharmacy_sales', []).some(function (s) { return s && s.real; });
      if (!any && !nb) { nb = document.createElement('div'); nb.id = 'v82Ban'; nb.className = 'v82ban'; nb.innerHTML = 'ℹ️ এখনো কোনো আসল বিক্রি নেই, তাই সংখ্যাগুলো ০। <a href="sales.html">POS-এ প্রথম বিক্রি করুন</a> — তখন সব হিসাব নিজে থেকে আসবে।'; $('v82Row').before(nb); }
      else if (any && nb) nb.remove();
    } catch (e) { if (window.console) console.warn('dash-v82', e); }
  }
  window.v82Refresh = refresh;

  function boot() {
    if (typeof window.updateAllStats === 'function' && !window.updateAllStats.__v82) { var o = window.updateAllStats; window.updateAllStats = function () { var r = o.apply(this, arguments); refresh(); return r; }; window.updateAllStats.__v82 = 1; }
    refresh(); setTimeout(refresh, 700); setTimeout(refresh, 2000);
    addEventListener('mc-sale', refresh); addEventListener('storage', function () { refresh(); }); addEventListener('mcsrv:update', refresh); addEventListener('mctheme', function () { });
    setInterval(refresh, 60000);
  }
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
