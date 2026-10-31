/* v102 — Ops Panel: "যার যতটুকু দরকার ততটুকুই" (least privilege).
   1) go() এখন নিজেই চেক করে: ACC[R]-তে নেই এমন ট্যাব কখনও রেন্ডার হয় না (আগে শুধু মেনু লুকানো ছিল —
      কোনো ওভারলে/লিংক tab বদলে দিলে নিষিদ্ধ ভিউও খুলে যেত)।
   2) অর্ডার: রোল অনুযায়ী কোন অর্ডার দেখা যাবে + কোন স্ট্যাটাস থেকে কোথায় যাওয়া যাবে।
        Owner/Pharmacist: সব  ·  Cashier: Pending → Confirmed/Cancelled (Rx ছাড়া)
        Delivery Staff: শুধু Packed/Shipped/Delivered, Packed→Shipped→Delivered; ক্যানসেল নয়
   3) Rx অর্ডারের ওষুধের নাম Cashier/Delivery-র কাছে ঢাকা থাকে; Export CSV ও পেমেন্ট প্যানেল শুধু যাদের দরকার তারা দেখে।
   সব ব্লক audit লগে যায়। (ডেমো মোড: ব্রাউজারে ক্লায়েন্ট-সাইড; সার্ভার-সাইড এনফোর্সমেন্ট নয়) */
(function () {
  'use strict';
  if (typeof R === 'undefined' || typeof ACC === 'undefined' || typeof go !== 'function' || typeof V === 'undefined') return;
  var full = R === 'Owner', ph = R === 'Pharmacist';
  var T_ = function (m, bad) { try { toast(m, bad ? 1 : 0); } catch (e) { } };
  var log = function (m) { try { audit('🔒 ' + m + ' (' + R + ')'); } catch (e) { } };

  /* 1 — ট্যাব গার্ড */
  var go0 = go;
  go = function () {
    if (ACC[R].indexOf(tab) < 0) { log('অনুমতিহীন ভিউ খোলার চেষ্টা: ' + tab); tab = ACC[R][0]; }
    return go0.apply(this, arguments);
  };

  /* 2 — অর্ডার নিয়ম */
  var NEXT = {
    Cashier: function (o) { return (o.status === 'Pending' && !o.rx) ? ['Confirmed', 'Cancelled'] : []; },
    'Delivery Staff': function (o) { return o.status === 'Packed' ? ['Shipped'] : o.status === 'Shipped' ? ['Delivered'] : []; }
  };
  function nextOf(o) { if (full || ph) return null; var f = NEXT[R]; return f ? f(o) : []; }   // null = সব চলবে
  function riders() { try { var a = JSON.parse(localStorage.getItem('pharmacy_riders')); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  var me = (sessionStorage.getItem('mc_ops_name') || '').trim().toLowerCase();
  function seen(o) {
    if (full || ph) return true;
    if (R === 'Delivery Staff') {
      if (['Packed', 'Shipped', 'Delivered'].indexOf(o.status) < 0) return false;
      var rl = riders().map(function (x) { return String(x && (x.name || x) || '').toLowerCase(); });
      if (o.rider && me && rl.indexOf(me) > -1 && String(o.rider).toLowerCase() !== me) return false;   // অন্যের অ্যাসাইন-করা অর্ডার নয়
      return true;
    }
    return R === 'Cashier';
  }
  function byNo(no) { no = String(no || '').trim(); var L = (typeof D !== 'undefined' && D.orders) || [], best = null; for (var i = 0; i < L.length; i++) { var n = String(L[i].no); if (no === n || no.indexOf(n) === 0) { if (!best || n.length > String(best.no).length) best = L[i]; } } return best; }

  var base = V.orders;
  if (!full && !ph) V.orders = function () {
    var r = base.apply(this, arguments);
    try {
      [].slice.call(r.querySelectorAll('tbody tr')).forEach(function (tr) {
        var c0 = tr.cells[0], no = c0 && ((c0.firstChild && c0.firstChild.nodeType === 3 ? c0.firstChild.textContent : c0.textContent) || '').trim(), o = byNo(no); if (!o) return;
        if (!seen(o)) { tr.remove(); return; }
        if (o.rx && tr.cells[2]) tr.cells[2].textContent = '🔒 প্রেসক্রিপশন অর্ডার — ওষুধের তালিকা শুধু ফার্মাসিস্ট/ওনার দেখবেন';
        var sel = tr.querySelector('select'), allow = nextOf(o) || [];
        if (sel) {
          [].slice.call(sel.options).forEach(function (op) { if (op.value !== o.status && allow.indexOf(op.value) < 0) op.disabled = true; });
          if (!allow.length) { sel.disabled = true; sel.title = 'এই অর্ডারে আপনার রোলের কোনো পদক্ষেপ নেই'; }
        }
      });
      /* যাদের দরকার নেই তাদের কাছে এক্সপোর্ট (গ্রাহকের ফোন/ঠিকানার বাল্ক কপি) ও পেমেন্ট প্যানেল নেই */
      [].slice.call(r.querySelectorAll('button')).forEach(function (b) { if (/export/i.test(b.textContent)) b.remove(); });
      if (R !== 'Cashier') [].slice.call(r.querySelectorAll('details.v100p')).forEach(function (d) { d.remove(); });
      if (!r.querySelector('tbody tr')) { var tb = r.querySelector('tbody'); if (tb && !tb.children.length) tb.append(h('tr', {}, h('td', { colspan: 6 }, 'আপনার জন্য কোনো অর্ডার নেই।'))); }
    } catch (e) { }
    return r;
  };

  /* স্ট্যাটাস বদলের ডিফেন্স — ক্লায়েন্ট কোডের আগেই ধরে */
  document.addEventListener('change', function (e) {
    var s = e.target; if (!s || s.tagName !== 'SELECT') return;
    var m = /^Status (.+)$/.exec(s.getAttribute('aria-label') || ''); if (!m) return;
    var o = byNo(m[1]), al = o && nextOf(o); if (!o || al == null) return;
    if (al.indexOf(s.value) < 0) { e.stopImmediatePropagation(); log('অননুমোদিত স্ট্যাটাস বদল: ' + o.no + ' ' + o.status + ' → ' + s.value); T_('এই স্ট্যাটাস বদলানোর অনুমতি আপনার রোলের নেই', 1); try { go(); } catch (x) { } }
  }, true);
})();
