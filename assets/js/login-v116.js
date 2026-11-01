/* v116 — Staff Login আরও আপডেট (ডেমো মোড)
   • 🔑 পাসওয়ার্ড-রিসেট অনুরোধ (আসল প্রক্রিয়া): অনুরোধ → Control Center → 🔑 Reset Requests-এ Admin অস্থায়ী পাসওয়ার্ড দেন → প্রথম লগইনে নতুন পাসওয়ার্ড বাধ্যতামূলক
   • 🖥 শেয়ার্ড কম্পিউটার মোড: কিছু মনে রাখে না, ১০ মিনিট নিষ্ক্রিয়তায় সাইন-আউট
   • 🕘 সাম্প্রতিক অ্যাকাউন্ট চিপ (শুধু ইমেইল/রোল — পাসওয়ার্ড কখনো নয়)
   সার্ভার মোডে রিসেট পুরনো পথেই (Admin → Users) থাকে। */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var SRV = !!(window.MCSRV && window.MCSRV.active), EM = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var st = document.createElement('style');
  st.textContent = '.rc116{display:flex;flex-wrap:wrap;gap:.35rem;margin:-.3rem 0 .8rem}.rc116 span{display:inline-flex;align-items:center;gap:.15rem;border-radius:999px;background:#eef0ff;color:#3b3f8f;font-size:.78rem;padding:.1rem .2rem .1rem .65rem}' +
    '.rc116 button{border:0;background:none;color:inherit;cursor:pointer;padding:0 .35rem;font-size:.85rem}.sh116{border:1px dashed #c7cdf5;border-radius:10px;padding:.45rem .7rem;margin:-.6rem 0 1rem;font-size:.85rem}.sh116.on{background:#fff6e0;border-color:#f0d38a}' +
    '.rq116{font-size:.85rem;border-radius:10px;padding:.55rem .7rem;margin-top:.6rem;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}.rq116.w{background:#fffbeb;border-color:#fde68a;color:#92400e}' +
    '@media(prefers-color-scheme:dark){.rc116 span{background:#26305a;color:#c9d3ff}.sh116{border-color:#3a4375}.sh116.on{background:#3a3014}}';
  document.head.appendChild(st);

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () {
    var email = $('email'), form = $('loginForm'), remember = $('rememberMe'); if (!email || !form) return;
    var pick = function (role) { var b = document.querySelector('.role-badge[data-role="' + role + '"]'); if (b) b.click(); };

    /* ---- শেয়ার্ড কম্পিউটার ---- */
    var sh = document.createElement('label'); sh.className = 'sh116'; sh.style.display = 'block';
    sh.innerHTML = '<input type="checkbox" id="shared116" class="form-check-input me-2"><b>🖥 এটি শেয়ার্ড কম্পিউটার</b><div class="text-muted">কিছু মনে রাখা হবে না, ১০ মিনিট নিষ্ক্রিয় থাকলে নিজে সাইন-আউট। কাউন্টারের কম্পিউটারে এটি চালু রাখুন।</div>';
    var rm = remember && remember.closest('.d-flex'); (rm || form.querySelector('button[type=submit]')).after(sh);
    var cb = $('shared116'), shared = function () { return cb.checked; };
    cb.addEventListener('change', function () { sh.classList.toggle('on', cb.checked); if (cb.checked) { remember.checked = false; } remember.disabled = cb.checked; renderChips(); });

    /* ---- সাম্প্রতিক অ্যাকাউন্ট ---- */
    var chips = document.createElement('div'); chips.className = 'rc116'; chips.setAttribute('aria-label', 'Recent accounts'); (email.closest('.mb-3') || email.parentNode).after(chips);
    function renderChips() {
      var L = rj('mc_recent116', []); chips.replaceChildren();
      if (shared() || !L.length) return;
      L.forEach(function (a) {
        var s = document.createElement('span'), b = document.createElement('button'), x = document.createElement('button');
        b.type = 'button'; b.textContent = '🕘 ' + a.email; b.title = 'এই অ্যাকাউন্টে লগইন'; b.onclick = function () { if (a.role) pick(a.role); email.value = a.email; $('password').focus(); };
        x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', 'Remove ' + a.email); x.onclick = function () { wj('mc_recent116', rj('mc_recent116', []).filter(function (z) { return z.email !== a.email; })); renderChips(); };
        s.append(b, x); chips.appendChild(s);
      });
    }
    renderChips();

    /* ---- সাবমিটে: শেয়ার্ড হলে কিছু রাখা নয়; সফল হলে চিপ/শেয়ার্ড-ফ্ল্যাগ ---- */
    form.addEventListener('submit', function () {
      var em = (email.value || '').trim(), role = ($('role') || {}).value || '', wasShared = shared();
      if (wasShared) { remember.checked = false; setTimeout(function () { try { localStorage.removeItem('mc_lastlogin'); } catch (e) { } }, 0); }
      clearInterval(window.__mc116); var n = 0, w = window.__mc116 = setInterval(function () {
        n++; var u = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (u) {
          clearInterval(w);
          if (wasShared) { try { sessionStorage.setItem('mc_shared', '1'); localStorage.removeItem('mc_lastlogin'); } catch (e) { } }
          else if (em) { var L = rj('mc_recent116', []).filter(function (z) { return z.email !== em.toLowerCase(); }); L.unshift({ email: em.toLowerCase(), role: role }); wj('mc_recent116', L.slice(0, 3)); }
        } else if (n > 40) clearInterval(w);
      }, 150);
    }, true);

    /* ---- পাসওয়ার্ড-রিসেট অনুরোধ ---- */
    if (SRV) return;
    var body = document.querySelector('#forgotModal .modal-body'), title = document.querySelector('#forgotModal .modal-title'), foot = document.querySelector('#forgotModal .modal-footer');
    if (!body || !foot) return;
    title.textContent = '🔑 পাসওয়ার্ড রিসেট অনুরোধ';
    body.innerHTML = '<p class="small">ইমেইলে লিংক যায় না। অনুরোধ পাঠালে <b>Admin</b> Control Center-এ দেখে একটি <b>অস্থায়ী পাসওয়ার্ড</b> দেবেন; প্রথম লগইনে আপনাকে নতুন পাসওয়ার্ড দিতে হবে।</p>' +
      '<input type="email" class="form-control mb-2" id="rq116e" placeholder="আপনার লগইন ইমেইল" autocomplete="username"><input type="text" class="form-control mb-2" id="rq116n" maxlength="60" placeholder="আপনার নাম"><input type="text" class="form-control" id="rq116m" maxlength="120" placeholder="Admin যাতে চিনতে পারেন (যেমন: ফোন/পদবি) — ঐচ্ছিক"><div id="rq116r"></div>';
    foot.innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">বন্ধ</button><button type="button" class="btn btn-primary" id="rq116go">📨 অনুরোধ পাঠান</button>';
    document.querySelector('#forgotModal').addEventListener('show.bs.modal', function () { var e = $('rq116e'); if (e && !e.value) e.value = (email.value || '').trim(); status(); });
    function status() {
      var out = $('rq116r'), em = ($('rq116e').value || '').trim().toLowerCase(); out.innerHTML = ''; if (!EM.test(em)) return;
      var L = rj('pharmacy_pwreq', []).filter(function (r) { return r.email === em; }).slice(-1)[0]; if (!L) return;
      var d = document.createElement('div'); d.className = 'rq116' + (L.status === 'open' ? ' w' : '');
      d.innerHTML = L.status === 'open' ? '⏳ আপনার অনুরোধ (রেফ <b>' + esc(L.id) + '</b>) Admin-এর অপেক্ষায় আছে।' : L.status === 'done' ? '✅ অনুরোধ (রেফ <b>' + esc(L.id) + '</b>) অনুমোদিত। Admin-এর কাছ থেকে অস্থায়ী পাসওয়ার্ড নিন — প্রথম লগইনে নতুন পাসওয়ার্ড দিতে হবে।' : '🚫 অনুরোধ (রেফ <b>' + esc(L.id) + '</b>) বাতিল হয়েছে। প্রয়োজনে Admin-এর সাথে কথা বলুন।';
      out.appendChild(d);
    }
    $('rq116e').addEventListener('input', status);
    $('rq116go').addEventListener('click', function () {
      var em = ($('rq116e').value || '').trim().toLowerCase(), nm = ($('rq116n').value || '').trim(), note = ($('rq116m').value || '').trim();
      if (!EM.test(em)) return window.showAlert && showAlert('সঠিক ইমেইল লিখুন', 'warning');
      if (nm.length < 2) return window.showAlert && showAlert('আপনার নাম লিখুন', 'warning');
      var L = rj('pharmacy_pwreq', []), open = L.filter(function (r) { return r.email === em && r.status === 'open'; })[0];
      if (open) { status(); return window.showAlert && showAlert('এই ইমেইলের অনুরোধ আগেই পাঠানো আছে (রেফ ' + open.id + ')', 'info'); }
      var recent = L.filter(function (r) { return Date.now() - Date.parse(r.at) < 6e5; }).length; if (recent >= 5) return window.showAlert && showAlert('একসাথে অনেক অনুরোধ — কিছুক্ষণ পরে চেষ্টা করুন', 'warning');
      var known = em === 'admin@medicare.com' || em === 'pharmacist@medicare.com' || em === 'staff@medicare.com' || rj('pharmacy_accounts', []).some(function (a) { return String(a.email).toLowerCase() === em; });
      var r = { id: 'R' + Date.now().toString(36).toUpperCase().slice(-5), email: em, name: nm.slice(0, 60), note: note.slice(0, 120), at: new Date().toISOString(), status: 'open', known: known };
      L.push(r); wj('pharmacy_pwreq', L.slice(-50)); status(); if (window.showAlert) showAlert('অনুরোধ পাঠানো হয়েছে (রেফ ' + r.id + ')', 'success');
    });
  });
})();
