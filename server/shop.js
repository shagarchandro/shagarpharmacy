'use strict';
/* অনলাইন শপ: অর্ডার সার্ভারে যাচাই ও স্টক-কাটা (FEFO), ট্র্যাকিং, গ্রাহকের প্রশ্ন */
const D = require('./db');
const A = require('./auth');
const today = () => new Date(Date.now() + 216e5).toISOString().slice(0, 10);
const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const eff = p => Math.round(p.price * (100 - (p.disc || 0)) / 100);
const usable = (d, pid) => d.batches.filter(b => b.pid === pid && b.qty > 0 && b.exp >= today()).sort((a, b) => a.exp.localeCompare(b.exp));
const stock = (d, pid) => usable(d, pid).reduce((s, b) => s + b.qty, 0);
class Bad extends Error { constructor(m, code) { super(m); this.code = code || 400; } }
function take(d, pid, q, ref) {
  if (stock(d, pid) < q) throw new Bad('Insufficient unexpired stock', 409);
  let n = q; for (const b of usable(d, pid)) { const t = Math.min(b.qty, n); b.qty -= t; n -= t; (d.log = d.log || []).push({ at: new Date().toISOString(), pid, batch: b.id, delta: -t, ref, why: 'sale' }); if (!n) break; }
}
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);
const hits = new Map();
function rate(key, max, ms) { const t = Date.now(), a = (hits.get(key) || []).filter(x => t - x < ms); if (a.length >= max) return false; a.push(t); hits.set(key, a); return true; }

function placeOrder(body, ip) {
  if (!rate('o:' + ip, 15, 3600e3)) throw new Bad('অনেক বেশি অর্ডার চেষ্টা — কিছুক্ষণ পরে আবার চেষ্টা করুন', 429);
  const o = body && body.order || {}, area = String(body && body.area || 'dhaka');
  const name = clean(o.customer || o.name, 80), phone = clean(o.phone, 20), addr = clean(o.addr, 240), pay = clean(o.pay || o.payMethod || 'Cash on delivery', 60), doc = clean(o.doc, 400);
  if (name.length < 2) throw new Bad('Enter your name'); if (!/^(\+?88)?01[3-9]\d{8}$/.test(phone)) throw new Bad('Enter a valid BD mobile number'); if (addr.length < 8) throw new Bad('Enter a fuller address');
  const items = Array.isArray(o.items) ? o.items.slice(0, 50) : []; if (!items.length) throw new Bad('Cart is empty');
  return D.tx(() => {
    const row = D.kvGet('mc_db'); if (!row) throw new Bad('শপ এখনো প্রস্তুত নয়', 503);
    const d = JSON.parse(row.value); d.orders = d.orders || []; d.notes = d.notes || []; d.batches = d.batches || []; d.log = d.log || [];
    const s = d.settings || {}; if (s.shopOpen === false) throw new Bad('The shop is closed for online orders right now.', 403);
    const seen = {}, out = []; let sub = 0;
    for (const it of items) {
      const qty = Math.floor(+it.qty), p = (d.products || []).find(x => x.id === it.pid);
      if (!p) throw new Bad('একটি পণ্য আর পাওয়া যাচ্ছে না'); if (p.hide) throw new Bad(p.name + ' is no longer sold online — please remove it from your cart.');
      if (!(qty >= 1 && qty <= 99) || seen[p.id]) throw new Bad('Invalid quantity'); seen[p.id] = 1;
      out.push({ pid: p.id, name: p.name, qty, price: eff(p), rx: !!p.rx }); sub += eff(p) * qty;
    }
    if (s.minOrder > 0 && sub < s.minOrder) throw new Bad('Minimum order is ৳' + s.minOrder);
    const hasRx = out.some(i => i.rx); if (hasRx && !doc) throw new Bad('Prescription details and confirmation are required');
    let disc = 0, coupon = '';
    const code = clean(o.coupon, 40).toUpperCase();
    if (code) {
      const c = (d.coupons || []).find(k => String(k.code).toUpperCase() === code); const usedN = d.orders.filter(x => x.coupon === (c && c.code)).length;
      if (!c || c.off || (c.expires && c.expires < today()) || (c.limit > 0 && usedN >= c.limit)) throw new Bad('Coupon is no longer valid');
      if (sub >= (c.min || 0)) { disc = Math.round(sub * c.pct / 100); if (c.max > 0 && disc > c.max) disc = c.max; coupon = c.code; }
    }
    let fee = sub ? (area === 'out' ? s.feeOut : s.feeDhaka) : 0, zone = '';
    if (area.startsWith('z:')) { const z = (s.zones || []).find(x => x && 'z:' + x.name === area); if (z && fee > 0) { fee = z.fee; zone = z.name; } }
    if (s.freeMin > 0 && sub >= s.freeMin) fee = 0;
    fee = Math.max(+fee || 0, 0);
    const wallet = /\((demo)\)/.test(pay), ref = clean(o.payRef, 30).toUpperCase();
    if (wallet && !s.payNoRef && !/^[A-Z0-9-]{6,20}$/.test(ref)) throw new Bad('Enter your wallet TrxID');
    const prefix = s.invoice || 'INV', maxN = d.orders.reduce((m, x) => { const n = parseInt(String(x.no).split('-').pop(), 10); return n > m ? n : m; }, 1000), no = prefix + '-' + (maxN + 1);
    out.forEach(i => take(d, i.pid, i.qty, no));
    const ord = { id: uid('O'), no, at: new Date().toISOString(), customer: name, phone, addr, items: out, rx: hasRx, status: hasRx ? 'Prescription Review' : 'Pending', pay, doc, sub, disc, fee, total: sub - disc + fee, paid: false, payMethod: pay };
    if (coupon) ord.coupon = coupon; if (zone) ord.zone = zone; if (wallet) ord.payRef = ref;
    d.orders.push(ord); d.notes.push({ id: uid('N'), at: ord.at, msg: 'New order ' + ord.no + (hasRx ? ' – prescription review needed' : ''), read: false });
    const ver = D.kvSet('mc_db', JSON.stringify(d), 'shop');
    D.audit('shop', 'order', ord.no + ' ৳' + ord.total);
    return { order: ord, ver, catalog: A.publicDb(d) };
  });
}
function track(no, phone) {
  const row = D.kvGet('mc_db'); if (!row) return null; const d = JSON.parse(row.value), p = String(phone || '').replace(/\D/g, '').slice(-10);
  const o = (d.orders || []).find(x => String(x.no).toUpperCase() === String(no || '').toUpperCase() && String(x.phone || '').replace(/\D/g, '').slice(-10) === p);
  return o || null;
}
function addNote(body, ip) {
  if (!rate('n:' + ip, 10, 3600e3)) throw new Bad('অনেক বেশি বার্তা — পরে চেষ্টা করুন', 429);
  const n = body && body.note || {}, msg = clean(n.msg, 500); if (msg.length < 3) throw new Bad('বার্তা খালি');
  const kind = n.kind === 'ask' ? 'ask' : 'contact';
  return D.tx(() => { const row = D.kvGet('mc_db'); if (!row) throw new Bad('শপ প্রস্তুত নয়', 503); const d = JSON.parse(row.value); (d.notes = d.notes || []).push({ id: uid('N'), at: new Date().toISOString(), kind, msg, read: false }); d.notes = d.notes.slice(-500); return D.kvSet('mc_db', JSON.stringify(d), 'shop'); });
}
/* গ্রাহকের নিজের অর্ডার বাতিল / রিটার্ন অনুরোধ (অর্ডার নং + ফোন মিললে) */
function customerAct(body, ip) {
  if (!rate('a:' + ip, 20, 3600e3)) throw new Bad('অনেক বেশি চেষ্টা — পরে করুন', 429);
  const act = body && body.act, no = String(body && body.no || '').toUpperCase(), ph = String(body && body.phone || '').replace(/\D/g, '').slice(-10);
  return D.tx(() => {
    const row = D.kvGet('mc_db'); if (!row) throw new Bad('শপ প্রস্তুত নয়', 503); const d = JSON.parse(row.value);
    const o = (d.orders || []).find(x => String(x.no).toUpperCase() === no && String(x.phone || '').replace(/\D/g, '').slice(-10) === ph); if (!o) throw new Bad('অর্ডার পাওয়া যায়নি', 404);
    if (act === 'cancel') {
      if (!['Pending', 'Confirmed', 'Prescription Review'].includes(o.status)) throw new Bad('এই অবস্থায় আর বাতিল করা যাবে না');
      d.log = d.log || []; const lines = d.log.filter(l => l.ref === o.no && l.delta < 0 && l.why === 'sale');
      lines.forEach(l => { const b = (d.batches || []).find(x => x.id === l.batch); if (b) { b.qty += -l.delta; d.log.push({ at: new Date().toISOString(), pid: l.pid, batch: b.id, delta: -l.delta, ref: o.no, why: 'cancel' }); } });
      o.status = 'Cancelled'; o.cancelledBy = 'customer'; (d.notes = d.notes || []).push({ id: uid('N'), at: new Date().toISOString(), msg: 'Customer cancelled ' + o.no, read: false });
    } else if (act === 'return') {
      if (o.status !== 'Delivered') throw new Bad('শুধু Delivered অর্ডারে রিটার্ন চাওয়া যায়');
      const rs = clean(body.reason, 200); if (rs.length < 3) throw new Bad('A reason is required'); o.status = 'Return Requested'; o.reason = rs;
      (d.notes = d.notes || []).push({ id: uid('N'), at: new Date().toISOString(), msg: 'Return requested for ' + o.no, read: false });
    } else throw new Bad('Bad action');
    const ver = D.kvSet('mc_db', JSON.stringify(d), 'shop'); D.audit('shop', 'customer-' + act, o.no); return { order: o, ver, catalog: A.publicDb(d) };
  });
}
module.exports = { placeOrder, track, addNote, customerAct, Bad };
