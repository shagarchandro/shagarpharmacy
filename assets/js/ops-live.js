/* v73 — Ops Panel লাইভ: নতুন অনলাইন অর্ডার এলে 🔔 শব্দ + বার্তা + ট্যাব-টাইটেলে সংখ্যা, এবং তালিকা নিজে থেকে রিফ্রেশ।
   সার্ভার মোডে অন্য ডিভাইস থেকে (SSE), ডেমো মোডে একই ব্রাউজারের অন্য ট্যাব থেকে (storage event) কাজ করে।
   টাইপ করার সময় বা পপআপ খোলা থাকলে রিফ্রেশ অপেক্ষা করে — আপনার লেখা নষ্ট হয় না। */
(function () {
  'use strict';
  if (typeof db !== 'function' || typeof go !== 'function') return;
  window.__mcLive = { mc_db: 1 };
  var LIVE = { dash: 1, orders: 1, rx: 1, alerts: 1, returns: 1, notes: 1, delivery: 1 }, known = {}, unread = 0, t0 = document.title, pend = false, timer = null, st = null;
  try { (db().orders || []).forEach(function (o) { known[o.id] = o.status; }); } catch (e) { }
  function beep() { try { var A = window.AudioContext || window.webkitAudioContext, a = new A(), o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = 880; g.gain.value = .08; o.connect(g); g.connect(a.destination); o.start(); setTimeout(function () { o.frequency.value = 1175; }, 130); setTimeout(function () { o.stop(); a.close(); }, 300); } catch (e) { } }
  function title() { document.title = unread ? '(' + unread + ') 🔔 নতুন অর্ডার — ' + t0 : t0; }
  function busy() { var a = document.activeElement; return !!((a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) || document.querySelector('.mcd-ov, .mcd-box, dialog[open]')); }
  function refresh() { if (typeof tab !== 'undefined' && !LIVE[tab]) return; if (busy()) { pend = true; return; } pend = false; try { go(); } catch (e) { } }
  function check() {
    var D; try { D = db(); } catch (e) { return; } var fresh = [];
    (D.orders || []).forEach(function (o) { if (!(o.id in known)) fresh.push(o); known[o.id] = o.status; });
    if (fresh.length) { unread += fresh.length; title(); beep(); if (typeof toast === 'function') toast('🔔 নতুন অর্ডার ' + fresh.map(function (o) { return o.no + ' (৳' + o.total + ')'; }).join(', ') + (fresh.some(function (o) { return o.rx; }) ? ' · প্রেসক্রিপশন রিভিউ লাগবে' : '')); }
    refresh();
  }
  function soon() { clearTimeout(timer); timer = setTimeout(check, 350); }
  window.addEventListener('storage', function (e) { if (e.key === 'mc_db') soon(); });
  window.addEventListener('mcsrv:update', function (e) { if (e.detail && e.detail.key === 'mc_db') soon(); });
  document.addEventListener('focusout', function () { if (pend) setTimeout(function () { if (pend) refresh(); }, 600); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { unread = 0; title(); } });
  window.addEventListener('focus', function () { unread = 0; title(); });
})();
