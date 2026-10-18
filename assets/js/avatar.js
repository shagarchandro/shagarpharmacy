/* Profile pictures for Admin / Pharmacist / Staff (and custom accounts).
   - Upload/remove in Settings → Profile; image is centre-cropped to 256px JPEG and stored per email in pharmacy_avatars.
   - Without a photo, a coloured initials avatar is drawn locally (works offline).
   - Exposes MCAvatar.get(user) for other scripts. */
(function () {
  'use strict';
  var KEY = 'pharmacy_avatars';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function who() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { return null; } }
  var COL = { admin: '#667eea', pharmacist: '#10b981', staff: '#f59e0b' };
  function initials(n) { var p = String(n || 'U').trim().split(/\s+/); return ((p[0] || 'U')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }
  function svg(name, role) {
    var c = COL[role] || '#764ba2';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="' + c + '"/><text x="64" y="64" dy=".35em" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="52" font-weight="700">' + initials(name).replace(/[<>&]/g, '') + '</text></svg>');
  }
  function get(u) { u = u || who(); if (!u) return ''; var a = rj(KEY, {})[String(u.email || '').toLowerCase()]; return a || svg(u.name, u.role); }
  function has(u) { u = u || who(); return !!(u && rj(KEY, {})[String(u.email || '').toLowerCase()]); }
  window.MCAvatar = { get: get, has: has };

  function apply() {
    var u = who(); if (!u) return; var src = get(u);
    document.querySelectorAll('#userAvatar,#navUserAvatar,.mc-avatar').forEach(function (i) { i.src = src; i.style.objectFit = 'cover'; i.onerror = function () { i.onerror = null; i.src = svg(u.name, u.role); }; });
  }
  function resize(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var s = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = c.height = 256;
        c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 256, 256);
        cb(c.toDataURL('image/jpeg', 0.85));
      };
      im.onerror = function () { cb(null); }; im.src = fr.result;
    };
    fr.onerror = function () { cb(null); }; fr.readAsDataURL(file);
  }
  function save(dataUrl) {
    var u = who(); if (!u) return; var m = rj(KEY, {}), k = String(u.email || '').toLowerCase();
    if (dataUrl) m[k] = dataUrl; else delete m[k];
    try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) { alert('ছবি সংরক্ষণ করা যায়নি (জায়গা কম)।'); return; }
    var store = localStorage.getItem('user') ? localStorage : sessionStorage; u.avatar = get(u); try { store.setItem('user', JSON.stringify(u)); } catch (e) {}
    apply(); paint();
  }
  var box = null;
  function paint() { if (!box) return; var u = who(); box.querySelector('img').src = get(u); box.querySelector('[data-rm]').style.display = has(u) ? '' : 'none'; }
  function inject() {
    var pane = document.getElementById('profile'); if (!pane || document.getElementById('mcAvBox')) return;
    box = document.createElement('div'); box.id = 'mcAvBox'; box.className = 'mb-3 d-flex align-items-center gap-3 flex-wrap';
    box.innerHTML = '<img alt="Profile picture" width="84" height="84" style="border-radius:50%;object-fit:cover;border:3px solid #667eea"><div><div class="fw-semibold mb-1">প্রোফাইল ছবি</div>' +
      '<label class="btn btn-sm btn-outline-primary mb-1">ছবি বেছে নিন<input type="file" accept="image/png,image/jpeg,image/webp" hidden></label> ' +
      '<button type="button" class="btn btn-sm btn-outline-danger mb-1" data-rm>মুছুন</button><div class="small text-muted">JPG/PNG/WebP, সর্বোচ্চ ৫MB — নিজে থেকে বর্গাকারে ক্রপ হবে।</div><div class="small" id="mcAvMsg" role="status"></div></div>';
    pane.insertBefore(box, pane.firstChild);
    var msg = box.querySelector('#mcAvMsg');
    box.querySelector('input').addEventListener('change', function (e) {
      var f = e.target.files[0]; e.target.value = ''; if (!f) return;
      if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { msg.textContent = '❌ শুধু JPG/PNG/WebP'; return; }
      if (f.size > 5 * 1024 * 1024) { msg.textContent = '❌ ছবি ৫MB-এর বেশি'; return; }
      resize(f, function (d) { if (!d) { msg.textContent = '❌ ছবি পড়া যায়নি'; return; } save(d); msg.textContent = '✔ ছবি আপডেট হয়েছে'; });
    });
    box.querySelector('[data-rm]').onclick = function () { save(null); msg.textContent = 'ছবি মুছে ফেলা হয়েছে'; };
    paint();
  }
  function init() { apply(); inject(); window.addEventListener('storage', apply); window.addEventListener('load', function () { apply(); inject(); setTimeout(apply, 400); setTimeout(apply, 1500); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
