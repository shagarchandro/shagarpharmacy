/* Suppliers v55: purchases.html and suppliers.html used different field names for the same list
   (name/contact vs companyName/contactPerson) and each hid or broke the other's records. This runs before either page
   reads the list and makes every record carry both spellings; totals are recomputed from real purchases. */
(function () {
  'use strict';
  try {
    var raw = localStorage.getItem('pharmacy_suppliers'); if (!raw || raw === 'undefined' || raw === 'null') return;
    var L = JSON.parse(raw); if (!Array.isArray(L)) return;
    var P = []; try { P = JSON.parse(localStorage.getItem('pharmacy_purchases') || '[]') || []; } catch (e) { }
    var changed = false, B = {}; try { B = JSON.parse(localStorage.getItem('pharmacy_supplier_base') || '{}') || {}; } catch (e) { } var bChanged = false;
    L.forEach(function (s) {
      if (!s || typeof s !== 'object') return; var before = JSON.stringify(s);
      if (!s.companyName && s.name) s.companyName = s.name; if (!s.name && s.companyName) s.name = s.companyName;
      if (!s.contactPerson && s.contact) s.contactPerson = s.contact; if (!s.contact && s.contactPerson) s.contact = s.contactPerson;
      if (s.due == null || isNaN(+s.due)) s.due = +s.openingDue || 0;
      if (!s.status) s.status = 'active'; if (!s.type) s.type = 'pharmaceutical';
      var mine = P.filter(function (p) { return p && (p.supplierId == s.id || (p.supplierName && p.supplierName === s.name)); });
      var key = String(s.id); if (!B[key]) { B[key] = { p: +s.totalPurchases || 0, pay: +s.totalPayments || 0 }; bChanged = true; }
      var tp = mine.reduce(function (a, p) { return a + (+p.totalAmount || 0); }, 0), pd = mine.reduce(function (a, p) { return a + (+p.paid || 0); }, 0);
      s.totalPurchases = Math.round((B[key].p + tp) * 100) / 100; s.totalPayments = Math.round((B[key].pay + pd) * 100) / 100;
      if (JSON.stringify(s) !== before) changed = true;
    });
    if (bChanged) localStorage.setItem('pharmacy_supplier_base', JSON.stringify(B));
    if (changed) localStorage.setItem('pharmacy_suppliers', JSON.stringify(L));
  } catch (e) { /* never block the page */ }
})();
