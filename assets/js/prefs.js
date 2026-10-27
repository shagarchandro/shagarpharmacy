/* Personal preferences (per user, stored in pharmacy_prefs[email]) + Settings → "My Preferences" & security extras.
   Applies on every staff page: text size, compact layout, dark mode (beta), reduced motion; start page after login;
   show/hide dashboard quick actions & insights. */
(function () {
  'use strict';
  var KEY = 'pharmacy_prefs';
  var DEF = { size: 100, compact: false, dark: false, calm: false, start: 'dashboard.html', quick: true, insights: true };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function who() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { return null; } }
  function email() { var u = who(); return u ? String(u.email || '').toLowerCase() : ''; }
  function get() { var m = rj(KEY, {}), p = {}; for (var k in DEF) p[k] = DEF[k]; var mine = m[email()] || {}; for (var k2 in mine) p[k2] = mine[k2]; return p; }
  function put(p) { var m = rj(KEY, {}); m[email()] = p; try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} apply(); }
  window.MCPrefs = { get: get, put: put, DEF: DEF };

  function apply() {
    var p = get(), css = '';
    if (+p.size !== 100) css += 'html{font-size:' + Math.min(Math.max(+p.size, 85), 130) + '%!important}';
    if (p.compact) css += '.card-body,.modal-body{padding:.6rem!important}.table td,.table th{padding:.3rem .5rem!important}.stat-card,.mcq,.mcd .pn{padding:.7rem!important}.main-content{padding-top:.6rem!important}';
    if (p.calm) css += '*,*::before,*::after{animation:none!important;transition:none!important}';
    /* v81: ডার্ক মোড এখন theme-mode.js (MCTheme) থেকে — পুরনো invert-ফিল্টার বাদ */
    var el = document.getElementById('mcPrefs'); if (!el) { el = document.createElement('style'); el.id = 'mcPrefs'; (document.head || document.documentElement).appendChild(el); }
    el.textContent = css;
    var q = document.getElementById('mcQuick'); if (q) q.style.display = p.quick ? '' : 'none';
    var i = document.getElementById('mcInsights'); if (i) i.style.display = p.insights ? '' : 'none';
  }
  apply();
  window.addEventListener('load', function () { apply(); setTimeout(apply, 800); setTimeout(apply, 2200); });

  var page = (location.pathname.split('/').pop() || '');
  // start page: once per sign-in session
  if (page === 'dashboard.html' && who()) {
    try { if (!sessionStorage.getItem('mc_started')) { sessionStorage.setItem('mc_started', '1'); var sp = get().start; if (sp && sp !== 'dashboard.html' && /^[a-z]+\.html$/.test(sp)) location.replace(sp); } } catch (e) {}
  }

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () {
    var nav = document.querySelector('#settingsModal .nav-tabs'), content = document.querySelector('#settingsModal .tab-content');
    if (!nav || !content || document.getElementById('myprefs')) return;
    var u = who(); if (!u) return;
    var li = document.createElement('li'); li.className = 'nav-item'; li.innerHTML = '<a class="nav-link" data-bs-toggle="tab" href="#myprefs">My Preferences</a>'; nav.insertBefore(li, nav.children[1]);
    var pages = [['dashboard.html', 'Dashboard'], ['sales.html', 'POS Sales'], ['medicines.html', 'Medicines'], ['customers.html', 'Customers'], ['prescriptions.html', 'Prescriptions']];
    if (u.role !== 'staff') pages.push(['reports.html', 'Reports']);
    var d = document.createElement('div'); d.className = 'tab-pane fade'; d.id = 'myprefs';
    d.innerHTML = '<p class="text-muted small mb-3">এই সেটিংস শুধু আপনার অ্যাকাউন্টের জন্য (এই ব্রাউজারে)।</p><div class="row g-3">' +
      '<div class="col-md-6"><label class="form-label">লেখার আকার <b id="pfSizeV"></b></label><input type="range" class="form-range" id="pfSize" min="90" max="125" step="5"></div>' +
      '<div class="col-md-6"><label class="form-label">লগইনের পর কোন পেজ খুলবে</label><select class="form-select" id="pfStart">' + pages.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="col-12">' + [['pfCompact', 'কমপ্যাক্ট লেআউট (ছোট স্পেসিং, বেশি ডেটা একসাথে)'], ['pfDark', 'ডার্ক মোড (বিটা)'], ['pfCalm', 'অ্যানিমেশন কমান'], ['pfQuick', 'ড্যাশবোর্ডে Quick Actions দেখান'], ['pfIns', 'ড্যাশবোর্ডে চার্ট ও ইনসাইট দেখান']].map(function (x) { return '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="' + x[0] + '"><label class="form-check-label" for="' + x[0] + '">' + x[1] + '</label></div>'; }).join('') + '</div>' +
      '<div class="col-12"><button type="button" class="btn btn-outline-secondary btn-sm" id="pfReset">ডিফল্টে ফিরুন</button> <span class="small text-success ms-2" id="pfMsg" role="status"></span></div></div>';
    content.insertBefore(d, content.children[1]);
    var $ = function (i) { return document.getElementById(i); };
    function load() { var p = get(); $('pfSize').value = p.size; $('pfSizeV').textContent = p.size + '%'; $('pfStart').value = p.start; $('pfCompact').checked = p.compact; $('pfDark').checked = p.dark; $('pfCalm').checked = p.calm; $('pfQuick').checked = p.quick; $('pfIns').checked = p.insights; }
    function save() { put({ size: +$('pfSize').value, start: $('pfStart').value, compact: $('pfCompact').checked, dark: $('pfDark').checked, calm: $('pfCalm').checked, quick: $('pfQuick').checked, insights: $('pfIns').checked }); $('pfSizeV').textContent = $('pfSize').value + '%'; $('pfMsg').textContent = '✔ সংরক্ষিত'; }
    ['pfSize', 'pfStart', 'pfCompact', 'pfDark', 'pfCalm', 'pfQuick', 'pfIns'].forEach(function (i) { $(i).addEventListener('input', save); $(i).addEventListener('change', save); });
    $('pfReset').onclick = function () { var m = rj(KEY, {}); delete m[email()]; localStorage.setItem(KEY, JSON.stringify(m)); apply(); load(); $('pfMsg').textContent = '✔ ডিফল্টে ফিরেছে'; };
    load();

    // ---- security extras: password strength + my recent sign-ins ----
    var sec = document.getElementById('security'), np = document.getElementById('newPassword');
    if (np && !document.getElementById('pwMeter')) {
      var m = document.createElement('div'); m.id = 'pwMeter'; m.className = 'small mt-1'; np.parentNode.appendChild(m);
      np.addEventListener('input', function () {
        var v = np.value, s = 0; if (v.length >= 6) s++; if (v.length >= 10) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
        var L = ['খুব দুর্বল', 'দুর্বল', 'মোটামুটি', 'ভালো', 'শক্তিশালী', 'খুব শক্তিশালী'], C = ['#b3261e', '#b3261e', '#b45309', '#2a9d8f', '#146c43', '#146c43'];
        m.innerHTML = v ? '<span style="display:inline-block;width:' + (s * 20) + '%;height:5px;border-radius:9px;background:' + C[s] + '"></span> <b style="color:' + C[s] + '">' + L[s] + '</b>' : '';
      });
    }
    if (sec && !document.getElementById('mySignins')) {
      var b = document.createElement('div'); b.id = 'mySignins'; b.className = 'mt-4';
      function draw() {
        var L = rj('pharmacy_loginlog', []).filter(function (x) { return String(x.email).toLowerCase() === email(); }).slice(-8).reverse();
        b.innerHTML = '<h6>🕒 আমার সাম্প্রতিক লগইন</h6>' + (L.length ? '<ul class="list-unstyled small mb-2">' + L.map(function (x) { return '<li>' + (x.ok ? '✅' : '❌') + ' ' + new Date(x.at).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' }) + '</li>'; }).join('') + '</ul>' : '<p class="small text-muted">এখনও কিছু নেই</p>') +
          '<button type="button" class="btn btn-sm btn-outline-secondary" id="clrLog">ইতিহাস মুছুন</button> <button type="button" class="btn btn-sm btn-outline-danger" id="soBtn">এই ডিভাইস থেকে সাইন-আউট</button>';
        b.querySelector('#clrLog').onclick = function () { var A = rj('pharmacy_loginlog', []).filter(function (x) { return String(x.email).toLowerCase() !== email(); }); localStorage.setItem('pharmacy_loginlog', JSON.stringify(A)); draw(); };
        b.querySelector('#soBtn').onclick = function () { if (window.authClear) window.authClear(); location.replace('login.html'); };
      }
      draw(); sec.appendChild(b);
    }
  });
})();
