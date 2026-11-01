/* v104 — Control Center → ☢️ সব ডাটা রিসেট: এক ক্লিকে (কিন্তু বহু-স্তরের সুরক্ষায়) সব ডাটা মোছা।
   • কী কী মুছবে তার গণনাসহ লাল সতর্কতা  • বাধ্যতামূলক পূর্ণ ব্যাকআপ ডাউনলোড (backup.html দিয়ে ফেরত-নেওয়া যায়)
   • দুটি টিক + "RESET ALL DATA" লেখা + Admin পাসওয়ার্ড (+PIN থাকলে PIN)  • ৫ সেকেন্ড কাউন্টডাউন (মাঝপথে বাতিল)
   • রিসেটের আগে ব্রাউজারে "রিস্টোর পয়েন্ট" (জায়গা থাকলে) — প্যানেল থেকে "রিসেট বাতিল"
   • মোড: ব্যবসার ডাটা (ডিফল্ট) / সাথে অ্যাকাউন্ট-পাসওয়ার্ড / সেটিংস-রোল-ডিজাইন / অডিট ট্রেইল — আলাদা বেছে নেওয়া যায়
   • রিসেটের পর: একদম খালি শুরু, অথবা ডেমো ডেটা ফিরিয়ে আনা  • সার্ভার মোডে সার্ভারের ডাটাবেসও (আগে সেফটি ব্যাকআপ সার্ভার নিজেই নেয়) */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  var PHRASE = 'RESET ALL DATA';
  var KEEP = /^(mc_session_start|mc_started|mc_restorepoint|mc_resetpoint|pharmacy_lastbackup|mc_lastbackup|pharmacy_resetlog)$/;
  var G_ACC = /^(pharmacy_creds|pharmacy_accounts|pharmacy_loginlog|mc_lock|pharmacy_pins|pharmacy_pwat|mc_pw_warn)$/;
  var G_SET = /^(pharmacy_settings|pharmacy_roles|mc_acc|pharmacy_theme|pharmacy_site|pharmacy_site_hist|pharmacy_v98prefs|mc_inv_paper|pharmacy_.*prefs.*)$/;
  var G_AUD = /^pharmacy_audit$/;
  var LBL = { mc_db: 'শপ ও Ops Panel (পণ্য, ব্যাচ, অর্ডার, কুপন…)', pharmacy_medicines: 'ওষুধ (ড্যাশবোর্ড)', pharmacy_customers: 'কাস্টমার', pharmacy_suppliers: 'সাপ্লায়ার', pharmacy_purchases: 'ক্রয়', pharmacy_purchase_returns: 'ক্রয় ফেরত', pharmacy_prescriptions: 'প্রেসক্রিপশন', pharmacy_sales: 'POS বিক্রি', pharmacy_shifts: 'ক্লোজ করা শিফট', pharmacy_held: 'হোল্ড বিল', pharmacy_customer_ledger: 'কাস্টমার বাকি-খাতা', pharmacy_riders: 'রাইডার' };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function allKeys() { var k = []; for (var i = 0; i < localStorage.length; i++) { var n = localStorage.key(i); if (/^(pharmacy_|mc_)/.test(n) && !KEEP.test(n)) k.push(n); } return k.sort(); }
  function grp(k) { return G_ACC.test(k) ? 'acc' : G_SET.test(k) ? 'set' : G_AUD.test(k) ? 'aud' : 'biz'; }
  function cnt(k) { var v = rj(k, null); if (Array.isArray(v)) return v.length; if (k === 'mc_db' && v) { return ['products', 'orders', 'batches'].map(function (x) { return (v[x] || []).length + ' ' + x; }).join(' · '); } if (v && typeof v === 'object') return Object.keys(v).length + ' টি এন্ট্রি'; return v == null ? 0 : 1; }
  function sz(k) { return ((k.length + (localStorage.getItem(k) || '').length) * 2); }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function css() {
    if (document.getElementById('v104css')) return; var s = document.createElement('style'); s.id = 'v104css';
    s.textContent = '.v104w{border:3px solid #c0261c;border-radius:16px;background:linear-gradient(180deg,rgba(192,38,28,.10),transparent 60%);padding:1.1rem 1.2rem;margin-bottom:1rem}' +
      '.v104w h2{margin:.1rem 0 .4rem;color:#c0261c;font-size:1.35rem}.v104w ul{margin:.4rem 0 .4rem 1.1rem;padding:0}.v104w li{margin:.18rem 0}' +
      '.v104g{display:grid;gap:.45rem;margin:.6rem 0}.v104g .it{display:flex;gap:.5rem;align-items:center;padding:.4rem .6rem;border:1px solid var(--br);border-radius:10px;background:var(--card)}' +
      '.v104g .it.ok{border-color:#2e9e5b}.v104g .it .ic{font-weight:800;width:1.4rem;text-align:center}.v104g .it.ok .ic{color:#2e9e5b}.v104g .it:not(.ok) .ic{color:#c0261c}' +
      '.v104go{background:#c0261c!important;color:#fff!important;border-color:#c0261c!important;font-weight:800;padding:.75rem 1.2rem!important;font-size:1.05rem}.v104go[disabled]{opacity:.35;cursor:not-allowed}' +
      '.v104bar{height:10px;border-radius:99px;background:rgba(192,38,28,.2);overflow:hidden;margin:.5rem 0}.v104bar i{display:block;height:100%;width:0;background:#c0261c;transition:width 1s linear}';
    document.head.appendChild(s);
  }
  function el(tag, p, kids) {
    var e = document.createElement(tag); p = p || {};
    Object.keys(p).forEach(function (k) { if (k === 'style') e.style.cssText = p[k]; else if (k === 'class') e.className = p[k]; else if (/^on/.test(k)) e.addEventListener(k.slice(2), p[k]); else if (k in e) e[k] = p[k]; else e.setAttribute(k, p[k]); });
    [].concat(kids == null ? [] : kids).forEach(function (k) { if (k != null) e.append(k.nodeType ? k : document.createTextNode(String(k))); }); return e;
  }
  function user() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || {}; } catch (e) { return {}; } }
  function isAdmin() { var u = user(); return u.role === 'admin' && !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')); }
  function verifyAdmin(pw) {
    var u = user(), em = String(u.email || '').toLowerCase(), DEF = { 'admin@medicare.com': 'admin123' };
    var cu = rj('pharmacy_accounts', []).filter(function (a) { return String(a.email).toLowerCase() === em; })[0], creds = rj('pharmacy_creds', {});
    if (!window.MCPW) return Promise.resolve(DEF[em] != null && pw === DEF[em]);
    if (cu && cu.hash) return MCPW.verify(pw, cu.hash);
    if (creds[em]) return MCPW.verify(pw, creds[em]);
    return Promise.resolve(DEF[em] != null && pw === DEF[em]);
  }

  window.CCX = function (c) {
    var x = prev(c), rjc = c.rj;
    x.panels.reset = function () {
      var admin = (function () { try { var u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || {}; return u.role === 'admin' && !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')) ? u : null; } catch (e) { return null; } })();
      var S = rjc('pharmacy_settings', {});
      return MCReset.build({ rj: rjc, audit: function (m) { c.audit(m); }, ok: c.ok, bad: c.bad, rerender: function () { c.show('reset'); }, by: admin ? (admin.name || 'Admin') : 'Owner',
        verifyPw: admin ? verifyAdmin : null, pwLabel: 'Admin পাসওয়ার্ড', verifyPin: admin && S.adminPin && window.MCPW ? function (p) { return MCPW.verify(p, S.adminPin); } : null,
        links: [['dashboard.html', 'ড্যাশবোর্ডে যান'], ['shop.html', 'শপ দেখুন']] });
    };
    var di = -1; x.tabs.forEach(function (t, i) { if (/data/i.test(t[0]) || t[0] === 'maint') di = i; });
    x.tabs.push(['reset', '☢️ সব ডাটা রিসেট']);
    return x;
  };
})();
