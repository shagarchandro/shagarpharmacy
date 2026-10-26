/* v62 – Smart Alerts: আসল ডেটা থেকে সতর্কতা কেন্দ্র, বেল নোটিফিকেশন, উন্নত Low-stock/Expiry কার্ড, ২৪ ঘণ্টা snooze */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dhaka(d) { return (d || new Date()).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); }
  function dayDiff(a, b) { return Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 864e5); }
  function money(n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN'); }
  var KEY = 'pharmacy_alert_snooze', filter = 'all', showAll = false, showSnoozed = false;

  function snoozed() { var m = rj(KEY, {}), now = Date.now(), o = {}, ch = false; Object.keys(m).forEach(function (k) { if (m[k] > now) o[k] = m[k]; else ch = true; }); if (ch) localStorage.setItem(KEY, JSON.stringify(o)); return o; }
  function snooze(k) { var m = snoozed(); m[k] = Date.now() + 864e5; localStorage.setItem(KEY, JSON.stringify(m)); }

  function collect() {
    var A = [], td = dhaka(), meds = rj('pharmacy_medicines', []);
    meds.forEach(function (m) {
      var st = +m.stock || 0, mn = +m.minStock || 0, nm = m.name || ('#' + m.id);
      if (m.expiryDate) {
        var d = dayDiff(String(m.expiryDate).slice(0, 10), td);
        if (st > 0 && d < 0) A.push({ k: 'exp-' + m.id, sev: 'crit', ic: '⛔', t: nm + ' — মেয়াদোত্তীর্ণ', s: Math.abs(d) + ' দিন আগে শেষ · স্টকে ' + st + ' · বিক্রি বন্ধ করে write-off করুন', href: 'writeoff.html', cta: 'Write-off', grp: 'expiry', n: d });
        else if (st > 0 && d <= 30) A.push({ k: 'exp-' + m.id, sev: 'crit', ic: '⏳', t: nm + ' — ' + d + ' দিনে মেয়াদ শেষ', s: 'স্টকে ' + st + ' · আগে বিক্রি করুন / ফেরত দিন', href: 'medicines.html', cta: 'দেখুন', grp: 'expiry', n: d });
        else if (st > 0 && d <= 60) A.push({ k: 'exp-' + m.id, sev: 'warn', ic: '⏳', t: nm + ' — ' + d + ' দিন বাকি', s: 'স্টকে ' + st, href: 'medicines.html', cta: 'দেখুন', grp: 'expiry', n: d });
        else if (st > 0 && d <= 90) A.push({ k: 'exp-' + m.id, sev: 'info', ic: '📅', t: nm + ' — ' + d + ' দিন বাকি', s: 'স্টকে ' + st, href: 'medicines.html', cta: 'দেখুন', grp: 'expiry', n: d });
      }
      if (st <= 0) A.push({ k: 'stk-' + m.id, sev: 'crit', ic: '🚫', t: nm + ' — স্টক শেষ', s: 'মিনিমাম ' + mn + ' · দ্রুত অর্ডার করুন', href: 'reorder.html', cta: 'Reorder', grp: 'stock', n: st });
      else if (st <= mn) A.push({ k: 'stk-' + m.id, sev: 'warn', ic: '📦', t: nm + ' — কম স্টক', s: 'আছে ' + st + ' / মিনিমাম ' + mn + ' · প্রস্তাবিত অর্ডার ' + Math.max(mn * 2 - st, mn), href: 'reorder.html', cta: 'Reorder', grp: 'stock', n: st });
    });
    var cu = rj('pharmacy_customers', []).filter(function (c) { return (+c.due || 0) > 0; });
    if (cu.length) A.push({ k: 'cust-due', sev: 'warn', ic: '💰', t: cu.length + ' জন গ্রাহকের বাকি আছে', s: 'মোট ' + money(cu.reduce(function (a, c) { return a + (+c.due || 0); }, 0)) + ' আদায়যোগ্য', href: 'customers.html', cta: 'আদায়', grp: 'money' });
    var su = rj('pharmacy_suppliers', []).filter(function (c) { return (+c.due || 0) > 0; });
    if (su.length) A.push({ k: 'sup-due', sev: 'warn', ic: '🏭', t: su.length + ' জন সরবরাহকারীকে বাকি দিতে হবে', s: 'মোট ' + money(su.reduce(function (a, c) { return a + (+c.due || 0); }, 0)), href: 'suppliers.html', cta: 'পরিশোধ', grp: 'money' });
    var sales = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status !== 'Voided'; });
    var y = dhaka(new Date(Date.now() - 864e5)), cl = rj('pharmacy_closings', []);
    var ys = sales.some(function (s) { return String(s.date || s.at || '').slice(0, 10) === y; });
    if (ys && !cl.some(function (c) { return c.date === y; })) A.push({ k: 'noclose-' + y, sev: 'warn', ic: '🧾', t: 'গতকালের (' + y + ') ক্লোজিং বাকি', s: 'বিক্রি হয়েছে কিন্তু ডে-ক্লোজ করা হয়নি', href: 'closing.html', cta: 'ক্লোজ করুন', grp: 'ops' });
    var mcs = rj('pharmacy_medicines', []), rxIds = {}; mcs.forEach(function (m) { if (m.rxRequired) rxIds[String(m.id)] = 1; });
    var noRef = sales.filter(function (s) { return !s.rx && (s.items || []).some(function (i) { return rxIds[String(i.id)]; }); }).length;
    if (noRef) A.push({ k: 'norx-' + noRef, sev: 'warn', ic: '📒', t: noRef + 'টি Rx ওষুধ-বিক্রিতে প্রেসক্রিপশন ref নেই', s: 'নিয়ম অনুযায়ী Rx নম্বর ও verifier দরকার', href: 'register.html', cta: 'Register', grp: 'ops' });
    var pend = rj('pharmacy_prescriptions', []).filter(function (p) { return p && p.status === 'pending'; }).length;
    if (pend) A.push({ k: 'rx-pend-' + pend, sev: 'info', ic: '📝', t: pend + 'টি প্রেসক্রিপশন অপেক্ষমাণ', s: 'যাচাই করে শেষ করুন', href: 'prescriptions.html', cta: 'দেখুন', grp: 'ops' });
    var lb = localStorage.getItem('pharmacy_lastbackup') || localStorage.getItem('mc_lastbackup');
    if (!lb) A.push({ k: 'bk-none', sev: 'warn', ic: '💾', t: 'এখনো কোনো ব্যাকআপ নেওয়া হয়নি', s: 'ডেটা হারানোর ঝুঁকি — এখনই ব্যাকআপ নিন', href: 'backup.html', cta: 'ব্যাকআপ', grp: 'ops' });
    else { var bd = Math.floor((Date.now() - new Date(lb)) / 864e5); if (bd >= 7) A.push({ k: 'bk-old-' + dhaka(new Date(lb)), sev: bd >= 30 ? 'crit' : 'warn', ic: '💾', t: 'শেষ ব্যাকআপ ' + bd + ' দিন আগে', s: 'নিয়মিত ব্যাকআপ নিন', href: 'backup.html', cta: 'ব্যাকআপ', grp: 'ops' }); }
    var shop = rj('mc_db', {}), po = (shop.orders || []).filter(function (o) { return o && /^(Ordered|Pending|Prescription Review|Return Requested)$/.test(o.status || ''); });
    if (po.length) A.push({ k: 'ord-' + po.length, sev: 'info', ic: '🛒', t: po.length + 'টি অনলাইন অর্ডারে মনোযোগ দরকার', s: 'Pending / Rx review / return request', href: 'admin/login.html', cta: 'Ops Panel', grp: 'ops' });
    try { var P80 = rj('pharmacy_prefs_v80', {}), me80 = (function () { try { return String(JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')).email || '').toLowerCase(); } catch (e) { return ''; } })(), pr80 = P80[me80] || {};
      A = A.filter(function (x) { if (pr80.noStock && x.grp === 'stock') return false; if (pr80.noExpiry && x.grp === 'expiry') return false; if (pr80.noMoney && x.grp === 'money') return false; if (pr80.noOps && x.grp === 'ops') return false; if (x.grp === 'expiry' && pr80.expDays && x.n > pr80.expDays) return false; return true; }); } catch (e) { }
    var ord = { crit: 0, warn: 1, info: 2 };
    A.sort(function (a, b) { return ord[a.sev] - ord[b.sev] || (a.n == null ? 999 : a.n) - (b.n == null ? 999 : b.n); });
    return A;
  }

  function css() {
    if (document.getElementById('al62css')) return;
    var s = document.createElement('style'); s.id = 'al62css';
    s.textContent = '.al62{margin-bottom:1.5rem}.al62 .hd{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;justify-content:space-between;margin-bottom:.7rem}.al62 .chips{display:flex;flex-wrap:wrap;gap:.4rem}.al62 .chip{border:1px solid rgba(128,128,128,.35);background:transparent;color:inherit;border-radius:99px;padding:.2rem .75rem;cursor:pointer;font:inherit;font-size:.85rem}.al62 .chip.on{background:#667eea;color:#fff;border-color:#667eea}' +
      '.al62 .it{display:flex;gap:.7rem;align-items:center;border-radius:12px;padding:.6rem .8rem;margin:.4rem 0;border-left:5px solid;background:rgba(128,128,128,.08)}.al62 .it.crit{border-color:#d93025;background:rgba(217,48,37,.10)}.al62 .it.warn{border-color:#f29900;background:rgba(242,153,0,.12)}.al62 .it.info{border-color:#1a73e8;background:rgba(26,115,232,.10)}' +
      '.al62 .it .ic{font-size:1.3rem}.al62 .it .tx{flex:1;min-width:0}.al62 .it .tx b{display:block;overflow-wrap:anywhere}.al62 .it .tx small{opacity:.75}.al62 .it a,.al62 .it button{font-size:.8rem;border-radius:8px;padding:.25rem .6rem;border:1px solid rgba(128,128,128,.4);background:transparent;color:inherit;text-decoration:none;cursor:pointer;white-space:nowrap}' +
      '.al62 .ok{text-align:center;padding:1rem;border-radius:12px;background:rgba(25,135,84,.12)}.al62 .sm{font-size:.85rem;opacity:.8}@media(max-width:560px){.al62 .it{flex-wrap:wrap}.al62 .it .acts{width:100%;display:flex;gap:.4rem;justify-content:flex-end}}' +
      '.x62 .r{display:flex;justify-content:space-between;align-items:center;gap:.5rem;border-radius:10px;padding:.5rem .7rem;margin:.35rem 0;border-left:4px solid}.x62 .r.c{border-color:#d93025;background:rgba(217,48,37,.10)}.x62 .r.w{border-color:#f29900;background:rgba(242,153,0,.12)}.x62 .r.i{border-color:#1a73e8;background:rgba(26,115,232,.10)}.x62 .r small{opacity:.75}.x62 .pl{display:inline-block;border-radius:99px;padding:0 .5rem;font-size:.75rem;font-weight:700;background:rgba(128,128,128,.2);margin-left:.3rem}.x62 a.b{font-size:.8rem;border:1px solid rgba(128,128,128,.4);border-radius:8px;padding:.2rem .6rem;color:inherit;text-decoration:none;white-space:nowrap}';
    document.head.appendChild(s);
  }

  var host;
  function ensureHost() {
    if (host && document.body.contains(host)) return host;
    var low = document.getElementById('lowStockAlerts'); if (!low) return null;
    var row = low.closest('.row'); host = document.createElement('div'); host.className = 'al62'; host.id = 'al62';
    row.parentNode.insertBefore(host, row); return host;
  }

  function render() {
    css(); var h = ensureHost(); if (!h) return;
    var all = collect(), sn = snoozed(), act = all.filter(function (a) { return !sn[a.k]; }), hid = all.length - act.length;
    var cnt = { crit: 0, warn: 0, info: 0 }; act.forEach(function (a) { cnt[a.sev]++; });
    var list = showSnoozed ? all.filter(function (a) { return sn[a.k]; }) : act.filter(function (a) { return filter === 'all' || a.sev === filter; });
    var cap = showAll || showSnoozed ? 999 : 8, shown = list.slice(0, cap);
    var chip = function (f, l) { return '<button class="chip' + (!showSnoozed && filter === f ? ' on' : '') + '" data-f="' + f + '">' + l + '</button>'; };
    h.innerHTML = '<div class="stat-card"><div class="hd"><h5 class="fw-bold mb-0">🔔 Smart Alerts <span class="sm">· জরুরি ' + cnt.crit + ' · সতর্ক ' + cnt.warn + ' · তথ্য ' + cnt.info + '</span></h5><div class="chips">' + chip('all', 'সব ' + act.length) + chip('crit', '🔴 জরুরি') + chip('warn', '🟠 সতর্ক') + chip('info', '🔵 তথ্য') + (hid ? '<button class="chip' + (showSnoozed ? ' on' : '') + '" data-f="snz">💤 Snoozed ' + hid + '</button>' : '') + '</div></div>' +
      (shown.length ? shown.map(function (a) { return '<div class="it ' + a.sev + '"><span class="ic">' + a.ic + '</span><div class="tx"><b>' + esc(a.t) + '</b><small>' + esc(a.s) + '</small></div><div class="acts"><a href="' + esc(a.href) + '">' + esc(a.cta) + '</a> ' + (showSnoozed ? '<button data-un="' + esc(a.k) + '">↩︎ ফেরান</button>' : '<button data-sz="' + esc(a.k) + '" title="২৪ ঘণ্টা লুকান">💤</button>') + '</div></div>'; }).join('') : '<div class="ok">✅ ' + (showSnoozed ? 'কিছু snooze করা নেই' : (act.length ? 'এই ধরনের কোনো সতর্কতা নেই' : 'সব ঠিক আছে — কোনো সতর্কতা নেই')) + '</div>') +
      (list.length > cap ? '<div style="text-align:center;margin-top:.5rem"><button class="chip" data-f="more">আরও ' + (list.length - cap) + 'টি দেখুন</button></div>' : '') + '</div>';
    bell(act, cnt);
  }

  function bell(act, cnt) {
    var b = document.getElementById('notificationBadge'), l = document.getElementById('notificationList'), n = cnt.crit + cnt.warn;
    if (b) { b.textContent = n > 99 ? '99+' : n; b.style.display = n ? '' : 'none'; }
    if (l) l.innerHTML = act.slice(0, 6).map(function (a) { return '<a href="' + esc(a.href) + '" class="dropdown-item p-3 border-bottom" style="white-space:normal"><small>' + a.ic + ' <b>' + esc(a.t) + '</b><br><span style="opacity:.7">' + esc(a.s) + '</span></small></a>'; }).join('') + (act.length ? '<a href="#al62" class="dropdown-item p-2 text-center"><small>সব সতর্কতা দেখুন (' + act.length + ')</small></a>' : '<div class="p-3 text-center"><small>✅ কোনো নতুন সতর্কতা নেই</small></div>');
  }

  document.addEventListener('click', function (e) {
    var h = document.getElementById('al62'); if (!h || !h.contains(e.target)) return;
    var b = e.target.closest('[data-f],[data-sz],[data-un]'); if (!b) return;
    if (b.dataset.sz) snooze(b.dataset.sz);
    else if (b.dataset.un) { var m = snoozed(); delete m[b.dataset.un]; localStorage.setItem(KEY, JSON.stringify(m)); }
    else if (b.dataset.f === 'more') showAll = true;
    else if (b.dataset.f === 'snz') { showSnoozed = !showSnoozed; }
    else { filter = b.dataset.f; showSnoozed = false; showAll = false; }
    render(); cards();
  });

  /* উন্নত Low-stock / Expiry কার্ড */
  function cards() {
    var A = collect(), sn = snoozed(), low = document.getElementById('lowStockAlerts'), ex = document.getElementById('expiryAlerts');
    if (low) { var L = A.filter(function (a) { return a.grp === 'stock'; });
      low.className = 'x62'; low.innerHTML = L.length ? L.slice(0, 10).map(function (a) { return '<div class="r ' + (a.sev === 'crit' ? 'c' : 'w') + '"><div><strong>' + esc(a.t.split(' — ')[0]) + '</strong><span class="pl">' + (a.sev === 'crit' ? 'শেষ' : 'কম') + '</span><br><small>' + esc(a.s) + '</small></div><a class="b" href="reorder.html">Reorder</a></div>'; }).join('') + (L.length > 10 ? '<div class="text-center"><a href="reorder.html"><small>আরও ' + (L.length - 10) + 'টি…</small></a></div>' : '') : '<div class="text-center text-muted py-3">✅ কম স্টকের ওষুধ নেই</div>'; }
    if (ex) { var E = A.filter(function (a) { return a.grp === 'expiry'; });
      ex.className = 'x62'; ex.innerHTML = E.length ? E.slice(0, 10).map(function (a) { return '<div class="r ' + (a.sev === 'crit' ? 'c' : a.sev === 'warn' ? 'w' : 'i') + '"><div><strong>' + esc(a.t.split(' — ')[0]) + '</strong><span class="pl">' + (a.n < 0 ? 'মেয়াদোত্তীর্ণ' : a.n + ' দিন') + '</span><br><small>' + esc(a.s) + '</small></div><a class="b" href="' + esc(a.href) + '">' + esc(a.cta) + '</a></div>'; }).join('') + (E.length > 10 ? '<div class="text-center"><a href="medicines.html"><small>আরও ' + (E.length - 10) + 'টি…</small></a></div>' : '') : '<div class="text-center text-muted py-3">✅ ৯০ দিনের মধ্যে মেয়াদ শেষ হবে এমন ওষুধ নেই</div>'; }
  }
  function all() { render(); cards(); }

  /* পুরনো fake handler বদলান */
  window.orderNow = function () { location.href = 'reorder.html'; };
  window.takeAction = function () { location.href = 'medicines.html'; };
  var u1 = window.updateLowStockAlerts, u2 = window.updateExpiryAlerts;
  window.updateLowStockAlerts = function (m) { try { if (u1) u1(m); } catch (e) {} all(); };
  window.updateExpiryAlerts = function (m) { try { if (u2) u2(m); } catch (e) {} all(); };
  window.mcAlerts = { collect: collect, render: all };
  window.addEventListener('storage', all);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) all(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(all, 50); }); else setTimeout(all, 50);
})();
