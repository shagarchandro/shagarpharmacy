/* v89 Rx Register: প্রতিটি Rx নম্বর প্রেসক্রিপশন-তালিকার সাথে মিলিয়ে ব্যাজ (✔ নিবন্ধিত / ⚠ অজানা / ⏰ মেয়াদোত্তীর্ণ Rx / 🔁 একই Rx বারবার), Rx-ref ছাড়া সারিতে "＋ Rx যোগ", ছাপার জন্য স্বাক্ষর-লাইন */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  if (!$('box') || $('box').hidden) return;
  var u = null; try { u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { }
  var who = (u && (u.name || u.role)) || sessionStorage.getItem('mc_role') || '';
  var RX = {}; rj('pharmacy_prescriptions', []).forEach(function (p) { RX[String(p.prescriptionNo || '').toLowerCase()] = p; });
  var SALES = rj('pharmacy_sales', []), byInv = {}; SALES.forEach(function (s) { if (s) byInv[s.invoiceNo] = s; });
  var use = {}; SALES.forEach(function (s) { if (s && s.real && s.status !== 'Voided' && s.rx && s.rx.no) { var k = String(s.rx.no).toLowerCase(); use[k] = (use[k] || 0) + 1; } });
  var st = document.createElement('style');
  st.textContent = '.rg89{display:inline-block;border-radius:99px;padding:0 .5rem;font-size:.72rem;font-weight:700;margin-left:.3rem;background:color-mix(in srgb,var(--mut) 18%,transparent);color:var(--fg)}.rg89.bad{background:color-mix(in srgb,var(--bad) 16%,transparent);color:var(--bad)}.rg89.ok{background:color-mix(in srgb,#16a34a 16%,transparent);color:#16a34a}.rg89sig{display:none}@media print{.rg89sig{display:flex;justify-content:space-between;margin-top:3rem}.rg89sig span{border-top:1px solid #000;padding-top:.3rem;min-width:30%;text-align:center}.rg89btn{display:none}}';
  document.head.appendChild(st);
  var sg = document.createElement('div'); sg.className = 'rg89sig'; sg.innerHTML = '<span>ফার্মাসিস্টের স্বাক্ষর</span><span>তারিখ</span><span>মালিকের স্বাক্ষর</span>'; $('box').appendChild(sg);
  var busy = false;
  function decorate() {
    if (busy) return; busy = true;
    Array.prototype.forEach.call($('rtb').querySelectorAll('tr'), function (tr) {
      if (tr.getAttribute('data-r89') || tr.children.length < 7) return; tr.setAttribute('data-r89', '1');
      var inv = tr.children[1].textContent.trim(), s = byInv[inv], rxc = tr.children[3], no = s && s.rx && s.rx.no, b = '';
      if (no) {
        var p = RX[String(no).toLowerCase()], n = use[String(no).toLowerCase()] || 0;
        if (!p) b += '<span class="rg89 bad" title="প্রেসক্রিপশন তালিকায় এই নম্বর নেই">⚠ অজানা Rx</span>';
        else { b += '<span class="rg89 ok">✔ নিবন্ধিত</span>'; if (p.validUntil && s.date && String(s.date) > String(p.validUntil).slice(0, 10)) b += '<span class="rg89 bad" title="বিক্রির দিনে Rx-এর মেয়াদ শেষ ছিল (' + esc(p.validUntil) + ')">⏰ মেয়াদোত্তীর্ণ Rx</span>'; }
        if (n > 1) b += '<span class="rg89" title="একই Rx নম্বরে ' + n + 'টি বিক্রি">🔁 ' + n + ' বার</span>';
        rxc.insertAdjacentHTML('beforeend', b);
      } else if (s) {
        var btn = document.createElement('button'); btn.className = 'btn2 rg89btn'; btn.textContent = '＋ Rx যোগ'; btn.style.cssText = 'padding:0 .5rem;margin-left:.3rem'; btn.setAttribute('data-inv', inv); rxc.appendChild(btn);
      }
    });
    busy = false;
  }
  $('rtb').addEventListener('click', function (e) {
    var b = e.target.closest('[data-inv]'); if (!b) return; var inv = b.getAttribute('data-inv');
    Promise.resolve(window.MCD ? MCD.prompt(inv + ' — Rx নম্বর দিন (যেমন RX-2026-0001)', { def: '', type: 'text' }) : prompt('Rx নম্বর')).then(function (v) {
      v = String(v == null ? '' : v).trim().slice(0, 40); if (!v) return;
      var all = rj('pharmacy_sales', []), s = all.find(function (x) { return x && x.invoiceNo === inv; }); if (!s) return;
      s.rx = { no: v, by: who, at: new Date().toISOString(), late: true };
      localStorage.setItem('pharmacy_sales', JSON.stringify(all));
      try { var a = rj('pharmacy_audit', []); a.push({ at: new Date().toISOString(), by: who, msg: 'Rx ref added to ' + inv + ': ' + v }); localStorage.setItem('pharmacy_audit', JSON.stringify(a.slice(-300))); } catch (x) { }
      location.reload();
    });
  });
  new MutationObserver(function () { decorate(); }).observe($('rtb'), { childList: true });
  decorate();
})();
