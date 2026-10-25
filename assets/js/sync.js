/* Catalog & stock sync: Medicines (pharmacy_medicines, the master) <-> Online shop / Ops panel (mc_db).
   - Medicines ticked in the Control Center are published to the shop (price, Rx flag, expiry, stock).
   - Online orders are applied to Medicines stock once (cancelled/rejected orders give the stock back).
   - Then the shop stock is set to the Medicines stock, so POS and shop never oversell each other.
   Self-contained: works without core.js. State in mc_sync = { pub:{lid:true}, applied:{orderId:{lid:qty}}, auto:bool, last:iso } */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function today() { return new Date(Date.now() + 216e5).toISOString().slice(0, 10); }
  function shopImg(m) { return (typeof m.image === 'string' && m.image.indexOf('data:image/') === 0 && m.image.length < 60000) ? m.image : undefined; }

  window.mcSync = function (opts) {
    opts = opts || {};
    var rep = { ok: false, applied: 0, reverted: 0, upserted: 0, removed: 0, msgs: [] };
    var meds = rj('pharmacy_medicines', null), D = rj('mc_db', null);
    if (!Array.isArray(meds)) { rep.msgs.push('Medicines data not found. Open the Medicines page once, then try again.'); return rep; }
    if (!D || !Array.isArray(D.products)) { rep.msgs.push('Shop data not found. Open the shop once, then try again.'); return rep; }
    var st = rj('mc_sync', { pub: {}, applied: {}, auto: false, last: null });
    st.pub = st.pub || {}; st.applied = st.applied || {};
    var byId = {}; meds.forEach(function (m) { byId['L' + m.id] = m; });

    // 1) orders -> legacy stock (once per order; give back when cancelled/returned)
    (D.orders || []).forEach(function (o) {
      var lines = (o.items || []).filter(function (i) { return String(i.pid).charAt(0) === 'L' && byId[i.pid]; });
      if (!lines.length) return;
      var dead = ['Cancelled', 'Returned', 'Refunded'].indexOf(o.status) > -1, rec = st.applied[o.id];
      if (!rec && !dead) {
        rec = { lines: {} };
        lines.forEach(function (i) { var m = byId[i.pid]; var q = Math.min(+i.qty || 0, +m.stock || 0); m.stock = (+m.stock || 0) - q; rec.lines[i.pid] = q; });
        st.applied[o.id] = rec; rep.applied++;
      } else if (rec && dead && !rec.reverted) {
        Object.keys(rec.lines).forEach(function (pid) { var m = byId[pid]; if (m) m.stock = (+m.stock || 0) + rec.lines[pid]; });
        rec.reverted = true; rep.reverted++;
      }
    });
    localStorage.setItem('pharmacy_medicines', JSON.stringify(meds));

    // 2) legacy -> shop catalogue
    D.batches = D.batches || [];
    Object.keys(byId).forEach(function (lid) {
      var m = byId[lid], pid = lid, has = D.products.find(function (p) { return p.id === pid; });
      if (!st.pub[lid]) {
        if (has) { // unpublish: remove if never ordered, otherwise just sell out
          var used = (D.orders || []).some(function (o) { return (o.items || []).some(function (i) { return i.pid === pid; }); });
          if (used) { D.batches.filter(function (b) { return b.pid === pid; }).forEach(function (b) { b.qty = 0; }); has.hiddenByAdmin = true; }
          else { D.products = D.products.filter(function (p) { return p.id !== pid; }); D.batches = D.batches.filter(function (b) { return b.pid !== pid; }); }
          rep.removed++;
        }
        return;
      }
      var prod = {
        id: pid, name: m.name, generic: m.genericName || '—', maker: m.brand || '—', form: m.form || 'Medicine', pack: m.pack || '—',
        price: +m.sellingPrice || 0, cost: +m.purchasePrice || 0, rx: !!m.rxRequired, cat: m.category || 'General', sku: 'LG' + m.id, barcode: String(m.barcode || ''),
        reorder: +m.minStock || 20, warn: m.rxRequired ? 'Use only as directed by your prescriber.' : 'Read the leaflet before use.', src: 'legacy', img: shopImg(m)
      };
      if (!prod.img) delete prod.img;
      if (has) { var keepDisc = has.disc; Object.assign(has, prod); if (keepDisc) has.disc = keepDisc; delete has.hiddenByAdmin; } else D.products.push(prod);
      var bid = 'BL' + m.id, b = D.batches.find(function (x) { return x.id === bid; });
      var qty = Math.max(+m.stock || 0, 0), exp = m.expiryDate || '2099-12-31';
      if (b) { b.qty = qty; b.exp = exp; b.no = m.batchNo || 'SYNC'; b.cost = +m.purchasePrice || 0; }
      else D.batches.push({ id: bid, pid: pid, no: m.batchNo || 'SYNC', exp: exp, qty: qty, supplier: (D.suppliers && D.suppliers[0] && D.suppliers[0].id) || 'S1', cost: +m.purchasePrice || 0 });
      rep.upserted++;
    });
    localStorage.setItem('mc_db', JSON.stringify(D));
    st.last = new Date().toISOString(); localStorage.setItem('mc_sync', JSON.stringify(st));
    rep.ok = true; return rep;
  };

  // auto-sync (if switched on in the Control Center): on shop/ops load and after each POS sale
  function auto() { var st = rj('mc_sync', null); if (st && st.auto) { try { window.mcSync(); } catch (e) { console.warn('sync', e); } } }
  window.addEventListener('mc-sale', auto);
  if (/\/(shop|admin\/index)\.html$/.test(location.pathname) || /\/$/.test(location.pathname)) { if (typeof db === 'function') { try { db(); } catch (e) {} } auto(); }
})();
