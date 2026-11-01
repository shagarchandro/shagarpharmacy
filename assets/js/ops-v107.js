/* v107 — Ops Panel → Data: পুরনো এক-ক্লিক "Reset ALL data" (শুধু একটা confirm) বদলে শক্ত "☢️ সব ডাটা রিসেট"।
   Owner-এর জন্য (Data ট্যাব শুধু Owner-এর): সতর্কতা-তালিকা, বাধ্যতামূলক ব্যাকআপ, দুই টিক, "RESET ALL DATA" লেখা,
   Ops PIN / ডেমো কোড পুনরায় দেওয়া, ৫ সেকেন্ড কাউন্টডাউন, রিস্টোর পয়েন্ট — Control Center-এর সাথে একই MCReset ইউনিট। */
(function () {
  'use strict';
  if (typeof V === 'undefined' || !V.data || !window.MCReset || typeof h !== 'function') return;
  var base = V.data;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function me() { var n = sessionStorage.getItem('mc_ops_name'), L = (typeof D !== 'undefined' && D.users) || []; return L.filter(function (u) { return u.name === n && u.role === R; })[0] || L.filter(function (u) { return u.role === R; })[0] || null; }
  V.data = function () {
    var root = base.apply(this, arguments);
    try {
      [].slice.call(root.querySelectorAll('button')).forEach(function (b) { if (/reset all data/i.test(b.textContent)) b.remove(); });
      var u = me(), pins = (rj('pharmacy_settings', {}).opsPins) || {}, srv = !!(window.MCSRV && MCSRV.active);
      root.append(h('hr', {}), MCReset.build({
        rj: rj, audit: function () { /* স্টেইল D সেভ হয়ে মোছা ডাটা ফিরিয়ে আনতে পারে — তাই এখানে অডিট নয়; pharmacy_resetlog-এ রেকর্ড থাকে */ }, ok: function (m) { toast(m); }, bad: function (m) { toast(m, 1); }, rerender: function () { go(); },
        by: (sessionStorage.getItem('mc_ops_name') || 'Owner') + ' (Owner)',
        verifyPw: srv ? null : function (v) { v = String(v || '').trim(); if (u && pins[u.id] && window.MCPW) return MCPW.verify(v, pins[u.id]); return Promise.resolve(v.toLowerCase() === 'demo'); },
        pwLabel: u && pins[u.id] ? 'আপনার Ops PIN' : 'ডেমো কোড', verifyPin: null, links: [['index.html', 'Ops Panel-এ ফিরুন'], ['../shop.html', 'শপ দেখুন']]
      }));
    } catch (e) { console.warn('v107', e); }
    return root;
  };
})();
