/* Admin-only dashboard widgets (v33): online-shop snapshot, system health, recent sign-ins and changes, shortcuts. */
(function () {
  'use strict';
  var rj = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var user = rj('user', null) || (function () { try { return JSON.parse(sessionStorage.getItem('user')); } catch (e) { return null; } })();
  if (!user || user.role !== 'admin') return;
  var esc = function (x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var tk = function (n) { return '৳' + Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 }); };
  var dk = function (x) { return new Date(x).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); };
  var st = document.createElement('style');
  st.textContent = '#mcAdmin{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin:0 0 1.2rem}#mcAdmin .pn{background:#fff;border:1px solid #e3e7f5;border-radius:18px;padding:1rem 1.1rem;box-shadow:0 4px 14px rgba(60,70,140,.07);color:#16213a}#mcAdmin h3{font-size:1rem;margin:0 0 .6rem;font-weight:700}#mcAdmin ul{list-style:none;margin:0;padding:0}#mcAdmin li{display:flex;justify-content:space-between;gap:.5rem;padding:.3rem 0;border-bottom:1px solid #eef1fa;font-size:.88rem}#mcAdmin li:last-child{border:0}#mcAdmin small{color:#6b7794}#mcAdmin .bad{color:#b3261e}#mcAdmin .ok{color:#0a7d5a}#mcAdmin .lk{display:flex;flex-wrap:wrap;gap:.4rem}#mcAdmin .lk a{border:1px solid #cfd6f0;border-radius:999px;padding:.25rem .75rem;font-size:.82rem;text-decoration:none;color:#3a47a6;background:#f6f7ff}';
  document.head.appendChild(st);
  function build() {
    var host = document.getElementById('mcInsights'); if (!host) return false;
    var db = rj('mc_db', null), orders = (db && db.orders) || [], live = orders.filter(function (o) { return o.status !== 'Cancelled'; }), t = dk(Date.now());
    var pend = orders.filter(function (o) { return o.status === 'Pending' || o.status === 'Prescription Review'; }).length;
    var unpaid = live.filter(function (o) { return !o.paid && o.status !== 'Delivered'; });
    var todayRev = live.filter(function (o) { return dk(o.at) === t; }).reduce(function (a, o) { return a + (+o.total || 0); }, 0);
    var shop = '<div class="pn"><h3>🛒 অনলাইন শপ</h3>' + (db ? '<ul><li><span>আজকের অনলাইন আয়</span><b>' + tk(todayRev) + '</b></li><li><span>অ্যাকশনের অপেক্ষায় অর্ডার</span><b class="' + (pend ? 'bad' : 'ok') + '">' + pend + '</b></li><li><span>অপরিশোধিত অর্ডার</span><b>' + unpaid.length + ' · ' + tk(unpaid.reduce(function (a, o) { return a + (+o.total || 0); }, 0)) + '</b></li></ul>' : '<small>এখনও শপের ডেটা তৈরি হয়নি।</small>') + '<p style="margin:.6rem 0 0"><a href="admin/index.html">Ops Panel খুলুন →</a></p></div>';
    var lb = localStorage.getItem('pharmacy_lastbackup'), age = lb ? Math.floor((Date.now() - new Date(lb)) / 864e5) : null, used = 0;
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); used += k.length + (localStorage.getItem(k) || '').length; } } catch (e) { }
    var kb = Math.round(used * 2 / 1024), accts = rj('pharmacy_accounts', []), cr = rj('pharmacy_creds', {});
    var health = '<div class="pn"><h3>🩺 সিস্টেম অবস্থা</h3><ul><li><span>শেষ ব্যাকআপ</span><b class="' + (age == null || age > 7 ? 'bad' : 'ok') + '">' + (age == null ? 'কখনো নয়' : age + ' দিন আগে') + '</b></li><li><span>ব্রাউজার স্টোরেজ (≈)</span><b class="' + (kb > 3500 ? 'bad' : 'ok') + '">' + kb + ' KB / ~5000</b></li><li><span>কাস্টম অ্যাকাউন্ট</span><b>' + accts.length + '</b></li><li><span>ডিফল্ট পাসওয়ার্ড বদলানো</span><b class="' + (Object.keys(cr).length >= 3 ? 'ok' : 'bad') + '">' + Object.keys(cr).length + '/3</b></li></ul><p style="margin:.6rem 0 0"><a href="backup.html">ব্যাকআপ নিন →</a></p></div>';
    var LG = rj('pharmacy_loginlog', []).slice(-5).reverse(), AU = rj('pharmacy_audit', []).slice(-5).reverse();
    var act = '<div class="pn"><h3>🕒 সাম্প্রতিক কার্যকলাপ</h3><ul>' + LG.map(function (l) { return '<li><span>' + (l.ok ? '✅' : '⚠️') + ' ' + esc(l.email || '?') + '</span><small>' + new Date(l.at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</small></li>'; }).join('') + AU.map(function (a) { return '<li><span>📝 ' + esc(a.msg) + '</span><small>' + esc(a.by || '') + '</small></li>'; }).join('') + ((LG.length + AU.length) ? '' : '<li><small>এখনও কিছু নেই</small></li>') + '</ul></div>';
    var lk = '<div class="pn"><h3>⚙️ অ্যাডমিন শর্টকাট</h3><div class="lk"><a href="admin-center.html#payments">💳 Payments</a><a href="admin-center.html#insights">📊 Insights</a><a href="admin-center.html#accounts">👥 Accounts</a><a href="admin-center.html#security">🔐 Security</a><a href="admin-center.html#features">🧩 Features</a><a href="closing.html">🧮 Daily closing</a></div></div>';
    var old = document.getElementById('mcAdmin'); if (old) old.remove();
    var box = document.createElement('div'); box.id = 'mcAdmin'; box.innerHTML = shop + health + act + lk;
    host.parentNode.insertBefore(box, host.nextSibling); return true;
  }
  function go() { var n = 0, t = setInterval(function () { if (build() || ++n > 50) clearInterval(t); }, 200); window.addEventListener('mc-sale', function () { setTimeout(build, 300); }); window.addEventListener('mc-team', function () { setTimeout(build, 300); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
