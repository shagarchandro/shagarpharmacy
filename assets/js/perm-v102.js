/* v102 — স্টাফ পেজ (Dashboard/POS/Customers/Reports…): ক্ষমতা-ভিত্তিক ছোট অনুমতি-স্তর।
   window.MCPerm.can(action) — actions: void · export · exportCustomers · backup
   শুধু বোতাম লুকানো নয়: যে ফাংশন আসল কাজ করে (mcVoid, export*) সেটাও রোল চেক করে, তাই কনসোল/পুরনো লিংক দিয়েও পার পায় না।
     void/export: Admin, Pharmacist (বা Ops Owner/Pharmacist)  ·  exportCustomers: Admin, Pharmacist
   Staff ও কাস্টম রোল: নেই (Control Center-এ যার জন্য খোলা হবে না, সে পাবে না)।
   প্রত্যাখ্যাত চেষ্টা pharmacy_audit-এ লেখা হয়। ডেমো মোড = ক্লায়েন্ট-সাইড চেক, সার্ভার-সাইড নয়। */
(function () {
  'use strict';
  function g(k) { try { return localStorage.getItem(k) || sessionStorage.getItem(k); } catch (e) { return null; } }
  function user() { try { return JSON.parse(g('user')) || {}; } catch (e) { return {}; } }
  function role() { var r = String(user().role || '').toLowerCase(), o = ''; try { o = sessionStorage.getItem('mc_role') || ''; } catch (e) { } return r || o.toLowerCase(); }
  var RULES = {
    void: ['admin', 'pharmacist', 'owner'],
    export: ['admin', 'pharmacist', 'owner'],
    exportCustomers: ['admin', 'pharmacist', 'owner'],
    backup: ['admin', 'owner']
  };
  function can(a) { var r = role(); return !!r && (RULES[a] || []).indexOf(r) > -1; }
  function audit(m) { try { var a = JSON.parse(localStorage.getItem('pharmacy_audit') || '[]'); a.push({ at: new Date().toISOString(), by: user().name || role() || '?', msg: '🔒 ' + m }); localStorage.setItem('pharmacy_audit', JSON.stringify(a.slice(-500))); } catch (e) { } }
  function deny(what) {
    audit('অনুমতিহীন চেষ্টা: ' + what + ' (' + role() + ')');
    var m = 'এই কাজের অনুমতি আপনার রোলে নেই / Not allowed for your role: ' + what;
    if (window.MCD && MCD.alert) MCD.alert(m); else alert(m);
  }
  window.MCPerm = { can: can, role: role };

  function wrap(name, action, label, failVal) {
    var f = window[name]; if (typeof f !== 'function' || f.__v102) return;
    var w = function () { if (!can(action)) { deny(label); return failVal; } return f.apply(this, arguments); };
    w.__v102 = 1; window[name] = w;
  }
  function apply() {
    wrap('mcVoid', 'void', 'Void', { ok: false, msg: 'Void করার অনুমতি নেই — ফার্মাসিস্ট/অ্যাডমিনকে বলুন' });
    wrap('exportCustomers', 'exportCustomers', 'গ্রাহক তালিকা এক্সপোর্ট');
    wrap('exportAllReports', 'export', 'রিপোর্ট এক্সপোর্ট');
    wrap('exportSalesTable', 'export', 'বিক্রয় টেবিল এক্সপোর্ট');
    /* যে রোল পারে না, তার কাছে বোতামই দেখাবে না (গার্ড-ফাংশনের সঙ্গে জোড়া) */
    var css = '';
    if (!can('exportCustomers')) css += 'button[onclick*="exportCustomers"]{display:none!important}';
    if (!can('export')) css += 'button[onclick*="exportAllReports"],button[onclick*="exportSalesTable"]{display:none!important}';
    if (css && !document.getElementById('v102css')) { var s = document.createElement('style'); s.id = 'v102css'; s.textContent = css; document.head.appendChild(s); }
  }
  apply();
  addEventListener('load', apply);
  setTimeout(apply, 800);
})();
