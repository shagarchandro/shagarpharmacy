/* v67 – এক জায়গায় Void লজিক: স্টক ফেরত + (বাকি বিক্রি হলে) গ্রাহকের বাকি কমানো + ledger + audit।
   window.mcVoid(sale, reason, by) → { ok, msg, dueBack } */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wj(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function tk(n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN'); }
  window.mcVoid = function (s, why, by) {
    why = String(why == null ? '' : why).trim();
    if (!s) return { ok: false, msg: 'ইনভয়েস পাওয়া যায়নি' };
    if (why.length < 3) return { ok: false, msg: 'Void করার কারণ লিখুন (কমপক্ষে ৩ অক্ষর)' };
    var all = rj('pharmacy_sales', []), cur = all.filter(function (x) { return x && String(x.id) === String(s.id); })[0];
    if (!cur) return { ok: false, msg: 'ইনভয়েস পাওয়া যায়নি' };
    if (cur.status === 'Voided') return { ok: false, msg: 'এটি আগেই void করা হয়েছে' };
    var meds = rj('pharmacy_medicines', []);
    (cur.items || []).forEach(function (i) { var m = meds.filter(function (x) { return String(x.id) === String(i.id); })[0]; if (m) m.stock = (+m.stock || 0) + (+i.quantity || 0); });
    wj('pharmacy_medicines', meds);
    var dueBack = 0, note = '';
    if (cur.due && cur.customerId != null) {
      var C = rj('pharmacy_customers', []), c = C.filter(function (x) { return String(x.id) === String(cur.customerId); })[0];
      if (c) {
        var d0 = +c.due || 0, back = Math.min(+cur.total || 0, d0); dueBack = Math.round(back * 100) / 100;
        c.due = Math.round((d0 - dueBack) * 100) / 100; wj('pharmacy_customers', C);
        var L = rj('pharmacy_customer_ledger', []); L.push({ id: Date.now(), customerId: c.id, type: 'void', amount: -dueBack, invoiceNo: cur.invoiceNo, at: new Date().toISOString(), note: 'Void: ' + why.slice(0, 60) }); wj('pharmacy_customer_ledger', L.slice(-500));
        note = dueBack < (+cur.total || 0) ? ' (গ্রাহক আগেই কিছু পরিশোধ করেছেন — বাকি থেকে ' + tk(dueBack) + ' কমানো হয়েছে, বাকিটা ফেরত দিতে হবে)' : ' · গ্রাহকের বাকি ' + tk(dueBack) + ' কমেছে';
      }
    }
    all.forEach(function (x) { if (x && String(x.id) === String(cur.id)) { x.status = 'Voided'; x.voidReason = why.slice(0, 120); x.voidBy = by || ''; x.voidAt = new Date().toISOString(); } });
    wj('pharmacy_sales', all);
    var au = rj('pharmacy_audit', []); au.push({ at: new Date().toISOString(), by: by || '?', msg: 'Voided ' + cur.invoiceNo + ' (' + why.slice(0, 80) + ')' + (dueBack ? ' · due −' + dueBack : '') }); wj('pharmacy_audit', au.slice(-300));
    try { window.dispatchEvent(new Event('mc-sale')); } catch (e) {}
    return { ok: true, msg: 'Void সম্পন্ন — স্টক ফেরত গেছে' + note, dueBack: dueBack };
  };
})();
