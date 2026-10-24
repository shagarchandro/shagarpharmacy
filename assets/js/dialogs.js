/* v63 – সুন্দর Dialogs: নেটিভ alert / confirm / prompt-এর বদলে আধুনিক মোডাল (লাইট/ডার্ক, মোবাইলে bottom-sheet).
   confirm/prompt সিঙ্ক্রোনাস, তাই মোডাল দেখিয়ে ব্যবহারকারীর উত্তর নিয়ে মূল ক্লিক/সাবমিট ইভেন্টটি আবার চালানো হয় (replay)।
   ইভেন্ট ধরা না গেলে নিরাপদে নেটিভ পপআপে ফিরে যায়। Promise API: MCD.alert / MCD.confirm / MCD.prompt */
(function () {
  'use strict';
  if (window.MCD) return;
  var N = { alert: window.alert.bind(window), confirm: window.confirm.bind(window), prompt: window.prompt.bind(window) };
  var DANGER = /delete|remove|wipe|reset|clear|void|discard|restore|overwrite|purge|মুছ|রিসেট|ডিলিট|বাতিল করবেন|রিস্টোর|ওভাররাইট|ফেলে/i;
  var BAD = /error|fail|invalid|denied|cannot|can't|not allowed|required|read-only|enter a valid|ব্যর্থ|ত্রুটি|সম্ভব নয়|পারবে না|দিন$|আবশ্যক|ভুল|হয়নি/i;
  var GOOD = /success|saved|done|complete|সফল|সংরক্ষিত|সম্পন্ন/i;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function enabled() { return !(navigator.webdriver && !window.__MCD_FORCE); }

  function css() {
    if (document.getElementById('mcd-css')) return;
    var s = document.createElement('style'); s.id = 'mcd-css';
    s.textContent = '.mcd-ov{--mb:#fff;--mf:#16213a;--mm:#5c6783;--mbr:#e3e7f5;--mp:#667eea;--md:#d93025;position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,20,40,.55);backdrop-filter:blur(4px);animation:mcdf .15s ease;font-family:Inter,system-ui,-apple-system,"Segoe UI","Noto Sans Bengali",sans-serif}' +
      '@media(prefers-color-scheme:dark){.mcd-ov{--mb:#171e36;--mf:#e8ecfa;--mm:#a3adcb;--mbr:#2d3659}}html[data-theme=dark] .mcd-ov,html.dark .mcd-ov{--mb:#171e36;--mf:#e8ecfa;--mm:#a3adcb;--mbr:#2d3659}html[data-theme=light] .mcd-ov{--mb:#fff;--mf:#16213a;--mm:#5c6783;--mbr:#e3e7f5}' +
      '.mcd-box{background:var(--mb);color:var(--mf);width:100%;max-width:420px;border-radius:20px;box-shadow:0 25px 70px rgba(0,0,0,.35);padding:1.4rem 1.3rem 1.1rem;animation:mcdp .2s cubic-bezier(.2,.9,.3,1.2);border:1px solid var(--mbr);box-sizing:border-box}' +
      '.mcd-h{display:flex;gap:.75rem;align-items:center;margin-bottom:.6rem}.mcd-ic{flex:none;width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-size:1.4rem;background:color-mix(in srgb,var(--mp) 15%,transparent)}.mcd-ic.d{background:color-mix(in srgb,var(--md) 15%,transparent)}.mcd-ic.g{background:rgba(25,135,84,.15)}.mcd-ic.w{background:rgba(242,153,0,.18)}' +
      '.mcd-t{font-weight:800;font-size:1.1rem;margin:0}.mcd-m{white-space:pre-line;overflow-wrap:anywhere;line-height:1.55;color:var(--mm);margin:.2rem 0 .9rem;max-height:40vh;overflow:auto}' +
      '.mcd-in{width:100%;box-sizing:border-box;padding:.7rem .85rem;border-radius:12px;border:2px solid var(--mbr);background:transparent;color:var(--mf);font:inherit;font-size:1.05rem;outline:0;transition:border-color .15s,box-shadow .15s}.mcd-in:focus{border-color:var(--mp);box-shadow:0 0 0 4px color-mix(in srgb,var(--mp) 20%,transparent)}.mcd-in.bad{border-color:var(--md)}' +
      '.mcd-q{display:flex;flex-wrap:wrap;gap:.4rem;margin:.55rem 0 0}.mcd-q button{border:1px solid var(--mbr);background:transparent;color:var(--mf);border-radius:99px;padding:.25rem .75rem;cursor:pointer;font:inherit;font-size:.85rem}.mcd-q button:hover{border-color:var(--mp);color:var(--mp)}' +
      '.mcd-b{display:flex;gap:.6rem;justify-content:flex-end;margin-top:1.1rem}.mcd-b button{border-radius:12px;padding:.6rem 1.15rem;font:inherit;font-weight:700;cursor:pointer;border:1px solid var(--mbr);background:transparent;color:var(--mf);min-height:44px}.mcd-b .ok{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:0}.mcd-b .ok.d{background:var(--md)}.mcd-b button:focus-visible{outline:3px solid color-mix(in srgb,var(--mp) 45%,transparent);outline-offset:2px}' +
      '.mcd-l{display:flex;flex-direction:column;gap:.45rem;max-height:46vh;overflow:auto;margin:.2rem 0}.mcd-l button{display:flex;justify-content:space-between;align-items:center;gap:.6rem;text-align:left;border:2px solid var(--mbr);background:transparent;color:var(--mf);border-radius:14px;padding:.65rem .85rem;font:inherit;cursor:pointer;min-height:48px}.mcd-l button:hover,.mcd-l button:focus-visible{border-color:var(--mp);outline:0;background:color-mix(in srgb,var(--mp) 8%,transparent)}.mcd-l small{color:var(--mm);display:block}.mcd-l b{white-space:nowrap}.mcd-lv{margin:.5rem 0 0;min-height:1.4em;font-weight:700}.mcd-lv.neg{color:var(--md)}.mcd-lv.pos{color:#198754}' +
      '.mcd-ov.out{animation:mcdo .12s ease forwards}@keyframes mcdf{from{opacity:0}}@keyframes mcdo{to{opacity:0}}@keyframes mcdp{from{opacity:0;transform:translateY(14px) scale(.96)}}' +
      '@media(max-width:520px){.mcd-ov{align-items:flex-end;padding:0}.mcd-box{max-width:none;border-radius:22px 22px 0 0;padding-bottom:1.3rem}.mcd-b button{flex:1}}@media(prefers-reduced-motion:reduce){.mcd-ov,.mcd-box{animation:none}}';
    document.head.appendChild(s);
  }

  var queue = [], busy = false;
  function run(job) { queue.push(job); if (!busy) next(); }
  function next() { var j = queue.shift(); if (!j) { busy = false; return; } busy = true; show(j); }

  function show(j) {
    css();
    var kind = j.kind, o = j.o || {}, msg = String(j.msg == null ? '' : j.msg), danger = o.danger != null ? o.danger : (kind !== 'alert' && DANGER.test(msg));
    var items = o.items || [];
    var tone = kind === 'alert' ? (BAD.test(msg) ? 'w' : GOOD.test(msg) ? 'g' : '') : (danger ? 'd' : '');
    var ic = o.icon || (kind === 'alert' ? (BAD.test(msg) ? '⚠️' : GOOD.test(msg) ? '✅' : 'ℹ️') : kind === 'confirm' ? (danger ? '🗑️' : '❓') : kind === 'choose' ? '📋' : '✏️');
    var title = o.title || (kind === 'alert' ? (BAD.test(msg) ? 'দেখে নিন' : GOOD.test(msg) ? 'সফল' : 'বার্তা') : kind === 'confirm' ? (danger ? 'সতর্কতা' : 'নিশ্চিত করুন') : kind === 'choose' ? 'বেছে নিন' : 'তথ্য দিন');
    var def = o.def == null ? '' : String(o.def), numeric = kind === 'prompt' && (o.type === 'num' || (def !== '' && !isNaN(+def) && o.type !== 'text'));
    var chips = '';
    if (numeric && o.chips !== false && +def > 0 && /pay|amount|টাকা|পরিশোধ|payment|ফেরত/i.test(msg)) chips = '<div class="mcd-q"><button type="button" data-v="' + esc(def) + '">সম্পূর্ণ ' + esc(def) + '</button><button type="button" data-v="' + esc(Math.round(+def / 2 * 100) / 100) + '">অর্ধেক</button></div>';
    var ov = document.createElement('div'); ov.className = 'mcd-ov'; ov.setAttribute('role', kind === 'alert' ? 'alertdialog' : 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = '<div class="mcd-box"><div class="mcd-h"><div class="mcd-ic ' + tone + '">' + ic + '</div><h3 class="mcd-t">' + esc(title) + '</h3></div><div class="mcd-m" id="mcdm">' + esc(msg) + '</div>' +
      (kind === 'choose' ? '<div class="mcd-l">' + items.map(function (it, i) { return '<button type="button" data-i="' + i + '"><span>' + esc(it.label) + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</span>' + (it.right ? '<b>' + esc(it.right) + '</b>' : '') + '</button>'; }).join('') + '</div>' : '') +
      (kind === 'prompt' ? '<input class="mcd-in" id="mcdi" ' + (numeric ? 'type="number" step="any" inputmode="decimal"' : 'type="text" maxlength="300"') + ' value="' + esc(def) + '" aria-describedby="mcdm" autocomplete="off">' + chips + (o.live ? '<div class="mcd-lv" id="mcdlv"></div>' : '') : '') +
      '<div class="mcd-b">' + (kind === 'alert' ? '' : '<button type="button" class="cn">' + esc(o.cancel || 'বাতিল') + '</button>') + (kind === 'choose' ? '' : '<button type="button" class="ok' + (danger ? ' d' : '') + '">' + esc(o.ok || (kind === 'confirm' ? (danger ? 'হ্যাঁ, নিশ্চিত' : 'নিশ্চিত করুন') : 'ঠিক আছে')) + '</button>') + '</div></div>';
    var prev = document.activeElement, inp = ov.querySelector('#mcdi'), okB = ov.querySelector('.ok') || ov.querySelector('.mcd-l button') || ov.querySelector('.cn'), done = false;
    var lv = ov.querySelector('#mcdlv'); function live() { if (!lv || !o.live) return; var r = o.live(inp.value) || {}; lv.textContent = r.text || ''; lv.className = 'mcd-lv ' + (r.cls || ''); } if (inp && o.live) { inp.addEventListener('input', live); live(); }
    function close(v) { if (done) return; done = true; document.removeEventListener('keydown', key, true); ov.classList.add('out'); setTimeout(function () { ov.remove(); try { prev && prev.focus && prev.focus(); } catch (e) {} }, 110); j.res(v); next(); }
    function ok() { if (kind === 'prompt') close(inp.value); else if (kind === 'confirm') close(true); else close(); }
    function cancel() { close(kind === 'confirm' ? false : (kind === 'prompt' || kind === 'choose') ? null : undefined); }
    function key(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); }
      else if (e.key === 'Enter' && kind !== 'choose' && !(e.target && e.target.tagName === 'BUTTON' && !e.target.classList.contains('ok'))) { e.preventDefault(); e.stopPropagation(); ok(); }
      else if (e.key === 'Tab') { var f = [].slice.call(ov.querySelectorAll('input,button')); if (!f.length) return; var i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    }
    ov.addEventListener('mousedown', function (e) { if (e.target === ov && kind !== 'alert') cancel(); });
    ov.addEventListener('click', function (e) { var t = e.target.closest('button'); if (!t) return; if (t.dataset.i != null && kind === 'choose') close(items[+t.dataset.i].value); else if (t.classList.contains('ok')) ok(); else if (t.classList.contains('cn')) cancel(); else if (t.dataset.v != null && inp) { inp.value = t.dataset.v; inp.focus(); inp.select(); } });
    document.addEventListener('keydown', key, true);
    document.body.appendChild(ov);
    setTimeout(function () { var f = inp || okB; f.focus(); if (inp) inp.select(); }, 30);
  }

  function api(kind) { return function (msg, o) { return new Promise(function (res) { run({ kind: kind, msg: msg, o: o, res: res }); }); }; }
  var MCD = window.MCD = { alert: api('alert'), confirm: api('confirm'), choose: api('choose'), enabled: enabled, prompt: function (msg, o) { return api('prompt')(msg, typeof o === 'string' || typeof o === 'number' ? { def: o } : o); } };

  /* ---- নেটিভ ফাংশন বদল: ইভেন্ট replay ---- */
  var sess = null, lastG = null, replaying = false, TYPES = { click: 1, submit: 1, change: 1, input: 1 };
  ['click', 'submit', 'change'].forEach(function (t) {
    document.addEventListener(t, function (e) {
      if (replaying || !e.isTrusted || (e.target && e.target.closest && e.target.closest('.mcd-ov'))) return;
      lastG = { type: e.type, target: e.target, t: Date.now() }; sess = null;
    }, true);
  });
  function gesture() {
    var e = window.event;
    if (e && e.isTrusted && TYPES[e.type] && e.target && e.target.isConnected) return { type: e.type, target: e.target };
    if (lastG && Date.now() - lastG.t < 2500 && lastG.target && lastG.target.isConnected) return { type: lastG.type, target: lastG.target };
    return null;
  }
  function replay(s) {
    var t = s.ev.target; if (!t || !t.isConnected) { sess = null; return; }
    s.i = 0; s.until = Date.now() + 5000;
    replaying = true;
    try {
      if (s.ev.type === 'click') t.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      else if (s.ev.type === 'submit') { var f = t.closest ? (t.closest('form') || t) : t; if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
      else t.dispatchEvent(new Event(s.ev.type, { bubbles: true }));
    } catch (e) { sess = null; }
    replaying = false;
  }
  function ask(kind, msg, def) {
    var cancelV = kind === 'confirm' ? false : null;
    if (!enabled()) return N[kind](msg, def);
    var s = sess;
    if (s && Date.now() < s.until) {
      var i = s.i++; if (i < s.a.length) return s.a[i];
      if (s.busy) return cancelV;
    } else {
      var ev = gesture(); if (!ev) return N[kind](msg, def);
      s = sess = { a: [], i: 0, until: 0, busy: false, ev: ev };
    }
    s.busy = true;
    MCD[kind](msg, kind === 'prompt' ? { def: def } : undefined).then(function (v) {
      s.busy = false;
      if ((kind === 'confirm' && v !== true) || (kind === 'prompt' && v === null)) { if (sess === s) sess = null; return; }
      s.a.push(v); replay(s);
    });
    return cancelV;
  }
  window.confirm = function (m) { return ask('confirm', m); };
  window.prompt = function (m, d) { return ask('prompt', m, d); };
  window.alert = function (m) { if (!enabled()) return N.alert(m); MCD.alert(m); };
  MCD.native = N;
})();
