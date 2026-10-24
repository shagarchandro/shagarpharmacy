/* v68 – Ops Panel: ডেস্কটপে গ্রুপ-করা সাইডবার, ইউজার চিপ, Ctrl+K বোতাম, পেজ হেডার, ক্লিকযোগ্য KPI কার্ড */
(function () {
  'use strict';
  if (typeof ACC === 'undefined' || typeof go !== 'function') return;
  var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '../assets/css/admin-ui-v68.css'; document.head.appendChild(link);
  var ICON = { dash: '🏠', products: '💊', inv: '📦', pos: '🧾', orders: '🛒', reports: '📊', data: '💾', purchases: '🚚', returns: '↩️', suppliers: '🏭', customers: '👥', expenses: '💸', delivery: '🛵', settings: '⚙️', users: '🔐', notes: '🔔', team: '📌', rx: '📝', alerts: '🚨' };
  var GROUPS = [['Overview', ['dash', 'alerts']], ['Sell', ['pos', 'orders', 'rx', 'delivery', 'returns']], ['Stock', ['products', 'inv', 'purchases', 'suppliers']], ['People', ['customers', 'notes', 'team', 'users']], ['Money & data', ['reports', 'expenses', 'data', 'settings']]];
  function st(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var T0 = typeof T === 'function' ? T : function (s) { return s; };

  /* ইউজার চিপ + Ctrl+K */
  var tools = document.querySelector('header.bar .tools');
  if (tools) {
    var chip = document.createElement('span'); chip.className = 'mcu'; chip.innerHTML = '<i>' + String(sessionStorage.getItem('mc_ops_name') || R || '?').trim().charAt(0).toUpperCase() + '</i><span>' + String(sessionStorage.getItem('mc_ops_name') || R).replace(/[<>&]/g, '') + ' · ' + R + '</span>';
    [].slice.call(tools.childNodes).forEach(function (n) { if (n.nodeType === 3 && n.textContent.trim() === R) tools.removeChild(n); });
    tools.insertBefore(chip, tools.firstChild);
    var kb = document.createElement('button'); kb.className = 'mck'; kb.type = 'button'; kb.innerHTML = '🔍 Jump <kbd>Ctrl K</kbd>'; kb.onclick = function () { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })); };
    tools.insertBefore(kb, chip);
  }

  /* সাইডবার */
  var side = document.createElement('aside'); side.id = 'mcSide'; side.setAttribute('aria-label', 'Sections'); document.body.appendChild(side); document.body.classList.add('mcsb');
  if (st('mc_side_col', '0') === '1') document.body.classList.add('col');
  function navCount(k) { var nav = document.querySelector('header.bar nav'); if (!nav) return 0; var nm = T0(NAMES[k]), n = 0; [].forEach.call(nav.querySelectorAll('button'), function (b) { var t = (b.textContent || '').trim(); if (t.indexOf(nm) === 0) { var m = t.match(/\((\d+)\)/); if (m) n = +m[1]; } }); return n; }
  function paint() {
    var seen = {}, html = '';
    GROUPS.forEach(function (g) {
      var ks = g[1].filter(function (k) { return ACC[R].indexOf(k) > -1 && NAMES[k]; }); if (!ks.length) return;
      html += '<h4>' + g[0] + '</h4>' + ks.map(function (k) { seen[k] = 1; return item(k); }).join('');
    });
    var rest = ACC[R].filter(function (k) { return !seen[k] && NAMES[k]; }); if (rest.length) html += '<h4>More</h4>' + rest.map(item).join('');
    html += '<div class="ft"><button class="it" data-col="1" type="button" title="Collapse / expand"><span class="ic">' + (document.body.classList.contains('col') ? '»' : '«') + '</span><span class="lb">Collapse</span></button></div>';
    side.innerHTML = html;
  }
  function item(k) { var n = navCount(k); return '<button type="button" class="it' + (k === tab ? ' on' : '') + '" data-k="' + k + '" title="' + String(T0(NAMES[k])).replace(/"/g, '') + '"><span class="ic">' + (ICON[k] || '•') + '</span><span class="lb">' + String(T0(NAMES[k])).replace(/\s*\(\d+\)/, '').replace(/[<>&]/g, '') + '</span>' + (n ? '<span class="bd">' + n + '</span>' : '') + '</button>'; }
  side.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.col) { document.body.classList.toggle('col'); sv('mc_side_col', document.body.classList.contains('col') ? '1' : '0'); paint(); return; }
    if (b.dataset.k) { tab = b.dataset.k; go(); }
  });

  /* পেজ হেডার + KPI সাজ */
  var KPI = [[/sales today|আজকের বিক্রি/i, '💰', null, 'ok'], [/orders|অর্ডার/i, '🛒', 'orders', ''], [/low stock|কম স্টক/i, '📉', 'alerts', 'warn'], [/near expiry|মেয়াদ শেষের কাছাকাছি/i, '⏳', 'alerts', 'warn'], [/expired|মেয়াদোত্তীর্ণ/i, '⛔', 'inv', 'bad'], [/rx review|প্রেসক্রিপশন/i, '📝', 'rx', 'warn']];
  var busy = false;
  function enhance() {
    if (busy) return; busy = true;
    try {
      var app = document.getElementById('app'), h1 = app && app.querySelector(':scope > h1');
      if (h1 && !h1.parentNode.classList.contains('pghd')) {
        var w = document.createElement('div'); w.className = 'pghd'; var ic = document.createElement('div'); ic.className = 'pi'; ic.textContent = ICON[tab] || '📋';
        var dt = document.createElement('span'); dt.className = 'dt'; dt.textContent = new Date().toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'short', day: 'numeric', month: 'long' });
        h1.replaceWith(w); w.append(ic, h1, dt);
      }
      if (tab === 'dash') [].forEach.call(document.querySelectorAll('#app h2'), function (hh) { var nx = hh.nextElementSibling; if (/^low stock$/i.test(hh.textContent.trim()) && (!nx || nx.tagName === 'H2' || nx.tagName === 'SECTION' || (nx.tagName === 'UL' && !nx.children.length)) && !hh.dataset.e68) { hh.dataset.e68 = '1'; var p = document.createElement('p'); p.className = 'muted'; p.textContent = '✅ কোনো কম-স্টক পণ্য নেই'; hh.after(p); } });
      if (tab === 'dash') [].forEach.call(document.querySelectorAll('#app .grid > .card'), function (c) {
        if (c.dataset.k68) return; c.dataset.k68 = '1'; c.classList.add('kpi');
        var lab = (c.textContent || '').trim();
        for (var i = 0; i < KPI.length; i++) if (KPI[i][0].test(lab)) {
          var n = parseFloat((c.querySelector('b') || {}).textContent) || 0, tone = KPI[i][3];
          var s = document.createElement('span'); s.className = 'ki'; s.textContent = KPI[i][1]; c.appendChild(s);
          if (tone && (tone === 'ok' || n > 0)) c.classList.add('t-' + tone);
          if (KPI[i][2]) { c.classList.add('go'); c.tabIndex = 0; c.setAttribute('role', 'button'); (function (t) { var f = function () { tab = t; go(); }; c.onclick = f; c.onkeydown = function (e) { if (e.key === 'Enter') f(); }; })(KPI[i][2]); }
          break;
        }
      });
    } catch (e) { }
    paint(); busy = false;
  }
  var mo = new MutationObserver(function () { enhance(); }); mo.observe(document.getElementById('app'), { childList: true });
  var nav = document.querySelector('header.bar nav'); if (nav) new MutationObserver(function () { if (!busy) paint(); }).observe(nav, { childList: true, subtree: true, characterData: true });
  window.addEventListener('storage', paint); window.addEventListener('mc-team', paint);
  function hh() { var b = document.querySelector('header.bar'); if (b) document.documentElement.style.setProperty('--hh', b.offsetHeight + 'px'); }
  window.addEventListener('resize', hh); hh(); setTimeout(hh, 400);
  enhance();
})();
