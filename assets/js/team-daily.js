/* v74 — Team Board: 🔁 দৈনিক চেকলিস্ট। প্রতিদিন (ঢাকার তারিখ) নতুন করে শুরু; কে কখন টিক দিল তা থাকে;
   শেষ ৭ দিনের পূর্ণতা; Admin/Pharmacist তালিকা বদলাতে পারেন। ডেটা: pharmacy_team_daily */
(function () {
  'use strict';
  var box = document.getElementById('box'); if (!box || box.hidden) return;
  var KEY = 'pharmacy_team_daily', DEF = ['দোকান খুলে ক্যাশ ড্রয়ার গোনা', 'ফ্রিজ/তাপমাত্রা দেখা', 'মেয়াদোত্তীর্ণ ওষুধ আলাদা করা', 'শেলফ গোছানো ও দাম/ট্যাগ ঠিক আছে কিনা', 'অনলাইন অর্ডার ও প্রেসক্রিপশন দেখা', 'দিন শেষে ক্যাশ ক্লোজিং করা', 'বন্ধের আগে বিদ্যুৎ/তালা ঠিক আছে কিনা'];
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var u = null; try { u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { } if (!u) return;
  var lead = u.role === 'admin' || u.role === 'pharmacist', me = u.name || u.role;
  var day = function (t) { return new Date(t == null ? Date.now() : t).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); };
  function load() { var d = rj(KEY, null); if (!d || !Array.isArray(d.items) || !d.items.length) d = { items: DEF.slice(), log: {} }; d.log = d.log || {}; return d; }
  function save(d) { var ks = Object.keys(d.log).sort(); ks.slice(0, Math.max(ks.length - 60, 0)).forEach(function (k) { delete d.log[k]; }); localStorage.setItem(KEY, JSON.stringify(d)); }
  var card = document.createElement('div'); card.className = 'card'; card.style.gridColumn = '1/-1'; box.insertBefore(card, box.children[1] || null);
  function draw() {
    var d = load(), t = day(), L = d.log[t] || {}, done = d.items.filter(function (x, i) { return L[i] && L[i].text === x; }).length, pct = Math.round(done / d.items.length * 100);
    var wk = ''; for (var i = 6; i >= 0; i--) { var k = day(Date.now() - i * 864e5), Lk = d.log[k] || {}, n = d.items.filter(function (x, j) { return Lk[j] && Lk[j].text === x; }).length, p = Math.round(n / d.items.length * 100); wk += '<div title="' + k + ': ' + p + '%" style="flex:1;text-align:center;font-size:.7rem;color:var(--mut)"><div style="height:' + Math.max(3, p * .4) + 'px;background:' + (p === 100 ? '#16a34a' : p >= 50 ? '#f59e0b' : '#cbd5e1') + ';border-radius:4px 4px 0 0;margin-top:' + (40 - Math.max(3, p * .4)) + 'px"></div>' + k.slice(8) + '</div>'; }
    card.innerHTML = '<h3>🔁 দৈনিক চেকলিস্ট <span class="muted" style="font-weight:400;font-size:.85rem">· ' + t + ' · ' + done + '/' + d.items.length + ' (' + pct + '%)</span></h3>'
      + '<div style="height:8px;background:#e5e7eb;border-radius:99px;overflow:hidden;margin:.3rem 0 .6rem"><div style="height:100%;width:' + pct + '%;background:' + (pct === 100 ? '#16a34a' : '#0f766e') + '"></div></div>'
      + d.items.map(function (x, i) { var l = L[i] && L[i].text === x ? L[i] : null; return '<div class="it"><label class="' + (l ? 'done' : '') + '"><input type="checkbox" data-di="' + i + '" ' + (l ? 'checked' : '') + '> ' + esc(x) + '</label>' + (l ? ' <small class="muted">— ' + esc(l.by) + ' · ' + new Date(l.at).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' }) + '</small>' : '') + '</div>'; }).join('')
      + '<div style="display:flex;gap:4px;align-items:flex-end;height:60px;margin-top:.6rem" aria-label="গত ৭ দিন">' + wk + '</div>'
      + (lead ? '<div class="row" style="margin-top:.5rem"><button class="btn2" id="dcEdit">✏️ তালিকা বদলান</button></div>' : '');
  }
  card.addEventListener('change', function (e) {
    var c = e.target; if (!c.dataset || c.dataset.di == null) return; var d = load(), t = day(), i = +c.dataset.di; d.log[t] = d.log[t] || {};
    if (c.checked) d.log[t][i] = { by: me, at: new Date().toISOString(), text: d.items[i] }; else if (d.log[t][i] && d.log[t][i].by !== me && !lead) { c.checked = true; return; } else delete d.log[t][i];
    save(d); draw();
  });
  card.addEventListener('click', function (e) {
    if (e.target.id !== 'dcEdit') return; var d = load();
    var ask = window.MCD && MCD.prompt ? MCD.prompt('কাজগুলো সেমিকোলন ( ; ) দিয়ে আলাদা করে লিখুন (সর্বোচ্চ ১৫টি):', { title: 'দৈনিক চেকলিস্ট', def: d.items.join('; ') }) : Promise.resolve(prompt('কাজগুলো ; দিয়ে আলাদা করুন:', d.items.join('; ')));
    ask.then(function (v) { if (v == null) return; var items = String(v).split(/\n|;/).map(function (s) { return s.trim().slice(0, 100); }).filter(Boolean).slice(0, 15); if (!items.length) return; d.items = items; save(d); draw(); });
  });
  window.addEventListener('storage', function (e) { if (e.key === KEY) draw(); });
  draw();
})();
