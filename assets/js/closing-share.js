/* v76 — Daily Closing: 📤 দিনের রিপোর্ট শেয়ার — নির্বাচিত তারিখের সারাংশ টেক্সটে (WhatsApp / কপি)। মালিক দূর থেকে দেখতে পারেন। */
(function () {
  'use strict';
  var box = document.getElementById('box'); if (!box || box.hidden) return;
  var $ = function (i) { return document.getElementById(i); }; if (!$('d') || !$('pr')) return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-BD'); };
  var dd = function (t) { return new Date(new Date(t).getTime() + 6 * 3600e3).toISOString().slice(0, 10); };
  function report(date) {
    var S0 = rj('pharmacy_settings', {}), store = S0.storeName || S0.store || 'MediCare Pharmacy';
    var sales = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status !== 'Voided' && (s.date || (s.at ? dd(s.at) : '')) === date; });
    var tot = sales.reduce(function (a, s) { return a + (+s.total || 0); }, 0), pm = {}, it = {};
    sales.forEach(function (s) { var m = String(s.paymentMethod || 'cash').toLowerCase(); pm[m] = (pm[m] || 0) + (+s.total || 0); (s.items || []).forEach(function (i) { var n = i.name || '#' + i.id; it[n] = (it[n] || 0) + (+(i.quantity || i.qty) || 0); }); });
    var D = {}; try { D = JSON.parse(localStorage.getItem('mc_db')) || {}; } catch (e) { }
    var on = (D.orders || []).filter(function (o) { return dd(o.at) === date && o.status !== 'Cancelled'; }), onTot = on.reduce(function (a, o) { return a + (+o.total || 0); }, 0);
    var cl = rj('pharmacy_closings', []).filter(function (x) { return x.date === date; })[0];
    var meds = rj('pharmacy_medicines', []), low = meds.filter(function (m) { return +m.stock <= +(m.minStock || 0); }).length;
    var due = rj('pharmacy_customers', []).reduce(function (a, c) { return a + (+c.due > 0 ? +c.due : 0); }, 0);
    var top = Object.keys(it).sort(function (a, b) { return it[b] - it[a]; }).slice(0, 3).map(function (n) { return n + ' ×' + it[n]; }).join(', ');
    var L = ['📋 ' + store + ' — দিনের রিপোর্ট', '📅 ' + date, '', '🧾 POS বিক্রি: ' + tk(tot) + ' (' + sales.length + 'টি বিল)'];
    Object.keys(pm).forEach(function (m) { L.push('   • ' + m + ': ' + tk(pm[m])); });
    if (on.length) L.push('🛒 অনলাইন অর্ডার: ' + on.length + 'টি · ' + tk(onTot));
    if (top) L.push('🏆 বেশি বিক্রি: ' + top);
    if (cl) { L.push('', '💵 ক্যাশ মিলান: প্রত্যাশিত ' + tk(cl.expected) + ' · গোনা ' + tk(cl.counted) + ' · ' + (Math.abs(cl.diff) < 0.01 ? '✅ মিলেছে' : (cl.diff < 0 ? '⚠ ঘাটতি ' : '⚠ বেশি ') + tk(Math.abs(cl.diff)))); if (cl.note) L.push('📝 ' + cl.note); } else L.push('', '⚠ এই দিনের ক্যাশ ক্লোজিং এখনো করা হয়নি');
    L.push('', '📦 কম/শেষ স্টক: ' + low + 'টি ওষুধ', '💰 গ্রাহকের মোট বাকি: ' + tk(due));
    return L.join('\n');
  }
  var b = document.createElement('button'); b.className = 'btn2 noprint'; b.id = 'shr'; b.type = 'button'; b.textContent = '📤 রিপোর্ট শেয়ার'; $('pr').after(b);
  b.addEventListener('click', function () {
    var t = report($('d').value), ov = document.createElement('div'); ov.className = 'noprint'; ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:12px';
    ov.innerHTML = '<div style="background:var(--card,#fff);color:var(--ink,#111);border-radius:14px;max-width:460px;width:100%;padding:14px"><h3 style="margin:0 0 .4rem">📤 দিনের রিপোর্ট</h3><textarea readonly style="width:100%;height:260px;box-sizing:border-box;font:14px/1.5 system-ui;padding:8px;border-radius:8px;border:1px solid #cbd5e1"></textarea><div class="row" style="margin-top:.5rem"><a class="btn" target="_blank" rel="noopener" id="shWa">💬 WhatsApp</a><button class="btn2" id="shCp" type="button">📋 কপি</button><button class="btn2" id="shX" type="button">বন্ধ</button></div></div>';
    ov.querySelector('textarea').value = t; ov.querySelector('#shWa').href = 'https://wa.me/?text=' + encodeURIComponent(t);
    ov.querySelector('#shCp').onclick = function (e) { var x = e.target; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { x.textContent = '✅ কপি হয়েছে'; }, function () { ov.querySelector('textarea').select(); document.execCommand('copy'); x.textContent = '✅ কপি হয়েছে'; }); };
    ov.querySelector('#shX').onclick = function () { ov.remove(); }; ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); }); document.body.append(ov);
  });
})();
