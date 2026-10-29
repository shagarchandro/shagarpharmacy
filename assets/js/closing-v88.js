/* v88 Daily Closing: ডিজিটাল পেমেন্ট সেটেলমেন্ট (প্রত্যাশিত বনাম পাওয়া), গতকাল/গত সপ্তাহের তুলনা, টপ প্রোডাক্ট ও ব্যস্ত ঘণ্টা */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString(); };
  if (!$('d') || $('box').hidden) return;
  var dayOf = function (t) { return new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); };
  var hourOf = function (t) { return +new Date(t).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', hour12: false }) % 24; };
  var KEY = 'pharmacy_closing_digital';
  var card = document.createElement('div'); card.className = 'card'; card.id = 'v88Dg';
  var anchor = $('box').querySelector('.card:nth-of-type(4)') || $('box').lastElementChild;
  $('eTot').closest('.card').parentNode.insertBefore(card, $('eTot').closest('.card').nextSibling);
  function sales(d) { return rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status !== 'Voided' && dayOf(s.at || s.date) === d; }); }
  function sum(L) { return L.reduce(function (a, s) { return a + (+s.total || 0); }, 0); }
  function shift(d, n) { var t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
  function cmp(label, cur, prev) {
    var df = cur - prev, pc = prev ? Math.round(df / prev * 100) : null;
    return '<tr><td>' + label + '</td><td>' + tk(prev) + '</td><td class="' + (df < 0 ? 'bad' : 'ok') + '">' + (df >= 0 ? '▲ ' : '▼ ') + tk(Math.abs(df)) + (pc == null ? '' : ' (' + pc + '%)') + '</td></tr>';
  }
  var sig = '';
  function render() {
    var d = $('d').value; if (!d) return; var S = sales(d), saved = rj(KEY, {})[d] || {};
    var s2 = JSON.stringify([d, S.length, sum(S), saved]); if (s2 === sig && document.activeElement && document.activeElement.closest && document.activeElement.closest('#v88Dg')) return; sig = s2;
    var exp = {}; S.forEach(function (s) {
      if (s.parts && s.parts.length) s.parts.forEach(function (q) { exp[q.m] = (exp[q.m] || 0) + (+q.amt || 0); }); else exp[(s.paymentMethod || 'cash').toLowerCase()] = (exp[(s.paymentMethod || 'cash').toLowerCase()] || 0) + (+s.total || 0);
    });
    var M = Object.keys(exp).filter(function (m) { return m !== 'cash' && m !== 'due' && m !== 'credit' && exp[m] > 0; });
    var h = '<h3>📲 ডিজিটাল পেমেন্ট সেটেলমেন্ট</h3>';
    h += M.length ? '<div class="scroll"><table class="t2"><thead><tr><th>মেথড</th><th>প্রত্যাশিত</th><th>পেয়েছি (মার্চেন্ট/অ্যাকাউন্ট)</th><th>পার্থক্য</th></tr></thead><tbody>' + M.map(function (m) {
      var r = saved[m], df = r == null || r === '' ? null : r - exp[m];
      return '<tr><td>' + esc(m) + '</td><td>' + tk(exp[m]) + '</td><td><input type="number" min="0" step="any" data-m="' + esc(m) + '" value="' + (r == null ? '' : r) + '" style="width:8rem" aria-label="Received ' + esc(m) + '"></td><td class="' + (df == null ? 'muted' : Math.abs(df) < 1 ? 'ok' : 'bad') + '">' + (df == null ? '—' : Math.abs(df) < 1 ? '✔ মিলেছে' : (df > 0 ? '+' : '−') + tk(Math.abs(df)).replace('-', '')) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : '<p class="muted">এই দিনে কোনো ডিজিটাল পেমেন্ট নেই।</p>';
    var tot = sum(S), y = sum(sales(shift(d, -1))), w = sum(sales(shift(d, -7)));
    h += '<h3 style="margin-top:1rem">📊 তুলনা</h3><div class="scroll"><table class="t2"><thead><tr><th>তুলনা</th><th>তখনকার বিক্রি</th><th>এই দিনের ফারাক</th></tr></thead><tbody>' + cmp('গতকাল', tot, y) + cmp('গত সপ্তাহের একই বার', tot, w) + '</tbody></table></div>';
    var P = {}, H = {}; S.forEach(function (s) { H[hourOf(s.at || s.date)] = (H[hourOf(s.at || s.date)] || 0) + (+s.total || 0); (s.items || []).forEach(function (i) { var n = i.name || i.medicineName || '?'; P[n] = (P[n] || 0) + (+i.quantity || +i.qty || 0); }); });
    var top = Object.keys(P).sort(function (a, b) { return P[b] - P[a]; }).slice(0, 5), ph = Object.keys(H).sort(function (a, b) { return H[b] - H[a]; })[0];
    h += '<h3 style="margin-top:1rem">🏆 আজকের টপ</h3><p>' + (top.length ? top.map(function (n) { return esc(n) + ' (' + P[n] + ')'; }).join(' · ') : '<span class="muted">বিক্রি নেই</span>') + '</p>' + (ph != null ? '<p>⏰ সবচেয়ে ব্যস্ত ঘণ্টা: <b>' + ph + ':00–' + ((+ph + 1) % 24) + ':00</b> (' + tk(H[ph]) + ')</p>' : '');
    card.innerHTML = h;
  }
  card.addEventListener('change', function (e) {
    var m = e.target.getAttribute && e.target.getAttribute('data-m'); if (!m) return; var all = rj(KEY, {}), d = $('d').value; all[d] = all[d] || {};
    if (e.target.value === '') delete all[d][m]; else all[d][m] = +e.target.value;
    localStorage.setItem(KEY, JSON.stringify(all)); sig = ''; render();
  });
  render(); setInterval(render, 800);
})();
