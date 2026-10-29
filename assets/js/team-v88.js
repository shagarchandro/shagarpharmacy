/* v88 Team Board: অটো হ্যান্ডওভার নোট (লাইভ সংখ্যা), সিস্টেম-সাজেস্টেড কাজ (এক ক্লিকে যোগ), সব নোটিশ "পড়েছি" */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var u = null; try { u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { }
  if (!u || !$('nf')) return;
  var role = u.role, em = String(u.email || '').toLowerCase(), lead = role === 'admin' || role === 'pharmacist';
  var dayOf = function (t) { return new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); };
  var today = dayOf(Date.now());
  function facts() {
    var meds = rj('pharmacy_medicines', []), low = meds.filter(function (m) { return (+m.stock || 0) <= (+m.minStock || 0); }).length;
    var lim = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    var exp = meds.filter(function (m) { return m.expiryDate && String(m.expiryDate).slice(0, 10) <= lim && (+m.stock || 0) > 0; }).length;
    var sales = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status !== 'Voided' && dayOf(s.at || s.date) === today; });
    var tot = sales.reduce(function (a, s) { return a + (+s.total || 0); }, 0);
    var db = rj('mc_db', {}), pend = (db.orders || []).filter(function (o) { return o.status === 'Pending' || o.status === 'Prescription Review'; }).length;
    var rx = rj('pharmacy_prescriptions', []).filter(function (p) { return p.status === 'pending'; }).length;
    var cl = {}; rj('pharmacy_closings', []).forEach(function (c) { cl[c.date] = 1; });
    var days = {}; rj('pharmacy_sales', []).forEach(function (s) { if (s && s.real) days[dayOf(s.at || s.date)] = 1; });
    var unclosed = Object.keys(days).filter(function (d) { return d < today && d >= dayOf(Date.now() - 7 * 864e5) && !cl[d]; }).length;
    var due = rj('pharmacy_customers', []).reduce(function (a, c) { return a + (+c.due || +c.balance || 0); }, 0);
    return { low: low, exp: exp, n: sales.length, tot: tot, pend: pend, rx: rx, unclosed: unclosed, due: due };
  }
  /* অটো হ্যান্ডওভার */
  var row = $('nf').querySelector('.row'), b = document.createElement('button');
  b.type = 'button'; b.className = 'btn2'; b.id = 'v88Ho'; b.textContent = '📝 অটো হ্যান্ডওভার';
  b.onclick = function () {
    var f = facts(), t = 'হ্যান্ডওভার ' + today + ' — বিক্রি ' + f.n + 'টি (৳' + Math.round(f.tot).toLocaleString() + '); কম স্টক ' + f.low + '; ৩০ দিনে এক্সপায়ার ' + f.exp + '; অপেক্ষমাণ অনলাইন অর্ডার ' + f.pend + '; পেন্ডিং Rx ' + f.rx + (f.unclosed ? '; আনক্লোজড দিন ' + f.unclosed : '') + (f.due ? '; মোট বাকি ৳' + Math.round(f.due).toLocaleString() : '') + '।';
    $('nt').value = t.slice(0, 400); $('nt').focus();
  };
  row.insertBefore(b, row.firstChild);
  /* সব পড়েছি */
  var nl = $('nl'), mk = document.createElement('button'); mk.type = 'button'; mk.className = 'btn2'; mk.id = 'v88Ack'; mk.textContent = '✔ সব নোটিশ পড়েছি'; mk.style.margin = '.4rem 0';
  mk.onclick = function () {
    var d = rj('pharmacy_team', { notices: [], tasks: [] }); (d.notices || []).forEach(function (n) { n.ack = n.ack || {}; n.ack[em] = 1; });
    localStorage.setItem('pharmacy_team', JSON.stringify(d)); window.dispatchEvent(new Event('mc-team')); location.reload();
  };
  nl.parentNode.insertBefore(mk, nl);
  /* সাজেস্টেড কাজ */
  if (!lead) return;
  var card = document.createElement('div'); card.className = 'card'; card.id = 'v88Sg'; $('tl').parentNode.parentNode.appendChild(card);
  function render() {
    var f = facts(), d = rj('pharmacy_team', { tasks: [] }), have = (d.tasks || []).filter(function (t) { return !t.done; }).map(function (t) { return t.text; });
    var S = [];
    if (f.low) S.push(['কম স্টকের ' + f.low + 'টি ওষুধ রিঅর্ডার করুন (Reorder List)', 'pharmacist']);
    if (f.exp) S.push(['৩০ দিনে এক্সপায়ার হবে এমন ' + f.exp + 'টি ওষুধ আলাদা করুন', 'staff']);
    if (f.unclosed) S.push(['আনক্লোজড ' + f.unclosed + ' দিনের ডে-ক্লোজিং করুন', 'pharmacist']);
    if (f.rx) S.push(['পেন্ডিং ' + f.rx + 'টি প্রেসক্রিপশন দেখুন', 'pharmacist']);
    if (f.pend) S.push(['অপেক্ষমাণ ' + f.pend + 'টি অনলাইন অর্ডার কনফার্ম/প্রসেস করুন', 'staff']);
    S = S.filter(function (s) { return have.indexOf(s[0]) < 0; });
    card.innerHTML = '<h3>💡 সিস্টেমের সাজেশন</h3>' + (S.length ? S.map(function (s, i) { return '<div class="it">' + esc(s[0]) + ' <button class="btn2" data-v88="' + i + '">+ কাজে যোগ</button></div>'; }).join('') : '<p class="muted">✅ এখন কোনো জরুরি সাজেশন নেই</p>');
    card._S = S;
  }
  card.addEventListener('click', function (e) {
    var t = e.target.closest('[data-v88]'); if (!t) return; var s = card._S[+t.getAttribute('data-v88')]; if (!s) return;
    var d = rj('pharmacy_team', { notices: [], tasks: [] }); d.tasks = d.tasks || [];
    d.tasks.push({ id: Date.now(), at: new Date().toISOString(), by: u.name || role, text: s[0], to: s[1], due: today, done: false, auto: true });
    localStorage.setItem('pharmacy_team', JSON.stringify(d)); window.dispatchEvent(new Event('mc-team')); location.reload();
  });
  render();
})();
