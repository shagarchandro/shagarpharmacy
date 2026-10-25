/* v74 — Daily Closing: ⚠ ক্লোজ-না-করা দিনের সতর্কতা (বিক্রি হয়েছে কিন্তু ক্লোজিং নেই), এই মাসের সারাংশ,
   ১৪ দিনের নিট বিক্রির বার ও ঘাটতি/উদ্বৃত্তের রঙ। */
(function () {
  'use strict';
  var box = document.getElementById('box'); if (!box || box.hidden) return;
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString(); };
  var day = function (t) { return new Date(t == null ? Date.now() : t).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); };
  var card = document.createElement('div'); card.className = 'card noprint'; var anchor = $('k'); (anchor && anchor.parentNode ? anchor.parentNode : box).insertBefore(card, anchor || null);
  function sd(s) { return s.date || (s.at ? day(new Date(s.at).getTime()) : ''); }
  function draw() {
    var C = rj('pharmacy_closings', []), closed = {}; C.forEach(function (x) { closed[x.date] = x; });
    var S = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status !== 'Voided'; }), by = {};
    S.forEach(function (s) { var d = sd(s); if (d) { var o = by[d] || (by[d] = { n: 0, v: 0 }); o.n++; o.v += +s.total || 0; } });
    var today = day(), miss = []; for (var i = 1; i <= 14; i++) { var d = day(Date.now() - i * 864e5); if (by[d] && !closed[d]) miss.push(d); }
    var ym = today.slice(0, 7), mc = C.filter(function (x) { return String(x.date).slice(0, 7) === ym; }), net = mc.reduce(function (a, x) { return a + (+x.net || 0); }, 0), short = mc.reduce(function (a, x) { return a + (x.diff < 0 ? x.diff : 0); }, 0), over = mc.reduce(function (a, x) { return a + (x.diff > 0 ? x.diff : 0); }, 0);
    var best = mc.slice().sort(function (a, b) { return b.net - a.net; })[0];
    var bars = '', mx = 1; for (i = 13; i >= 0; i--) mx = Math.max(mx, (by[day(Date.now() - i * 864e5)] || { v: 0 }).v);
    for (i = 13; i >= 0; i--) { d = day(Date.now() - i * 864e5); var v = (by[d] || { v: 0 }).v, c = closed[d], col = !v ? '#e2e8f0' : !c ? '#f59e0b' : Math.abs(c.diff) < 0.01 ? '#16a34a' : '#dc2626'; bars += '<div class="cb" data-d="' + d + '" title="' + d + ' · ' + tk(v) + (c ? ' · ক্লোজ ✔ (পার্থক্য ' + tk(c.diff) + ')' : v ? ' · ক্লোজ হয়নি' : '') + '" style="flex:1;text-align:center;font-size:.65rem;color:var(--mut);cursor:pointer"><div style="height:' + Math.max(3, Math.round(v / mx * 56)) + 'px;background:' + col + ';border-radius:4px 4px 0 0;margin-top:' + (56 - Math.max(3, Math.round(v / mx * 56))) + 'px"></div>' + d.slice(8) + '</div>'; }
    card.innerHTML = (miss.length ? '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:.6rem;margin-bottom:.6rem"><b>⚠ ' + miss.length + 'টি দিনের ক্যাশ ক্লোজিং করা হয়নি</b> <span class="muted">(বিক্রি হয়েছে কিন্তু মেলানো নেই)</span><div class="row" style="margin-top:.4rem">' + miss.map(function (m) { return '<button class="btn2" data-go="' + m + '">' + m + ' · ' + tk(by[m].v) + '</button>'; }).join('') + '</div></div>' : '<p class="ok" style="margin:0 0 .5rem">✔ গত ১৪ দিনের সব বিক্রয়-দিন ক্লোজ করা আছে।</p>')
      + '<h3 style="margin:.2rem 0">📅 এই মাস (' + ym + ')</h3><div class="k" style="margin:.3rem 0">' + [['ক্লোজ করা দিন', mc.length], ['নিট বিক্রি', tk(net)], ['গড়/দিন', tk(mc.length ? net / mc.length : 0)], ['মোট ঘাটতি', '<span class="' + (short ? 'bad' : '') + '">' + tk(short) + '</span>'], ['মোট উদ্বৃত্ত', tk(over)], ['সেরা দিন', best ? best.date.slice(5) + ' · ' + tk(best.net) : '—']].map(function (p) { return '<div><b>' + p[1] + '</b><span>' + p[0] + '</span></div>'; }).join('') + '</div>'
      + '<div style="display:flex;gap:3px;align-items:flex-end;height:78px" aria-label="১৪ দিন">' + bars + '</div><p class="muted" style="font-size:.78rem;margin:.2rem 0 0">🟩 ক্লোজ ও মিলেছে · 🟥 পার্থক্য আছে · 🟧 ক্লোজ হয়নি — বারে ট্যাপ করলে সেই দিন খোলে</p>';
  }
  card.addEventListener('click', function (e) { var b = e.target.closest('[data-go],[data-d]'); if (!b) return; var d = b.getAttribute('data-go') || b.getAttribute('data-d'); if (d > day()) return; $('d').value = d; $('d').dispatchEvent(new Event('change')); scrollTo({ top: card.nextElementSibling ? card.nextElementSibling.offsetTop : 0, behavior: 'smooth' }); });
  ['h'].forEach(function (id) { var el = $(id); if (el) new MutationObserver(function () { setTimeout(draw, 50); }).observe(el, { childList: true, characterData: true, subtree: true }); });
  window.addEventListener('storage', function (e) { if (e.key === 'pharmacy_closings' || e.key === 'pharmacy_sales') draw(); });
  draw();
})();
