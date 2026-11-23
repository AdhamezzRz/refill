/* REFILL online ordering: pay with Kashier, pick up at the bar.
   Zero dependencies. The menu and prices come from public/js/menu-data.js; the browser never sets a price.

   Flow
     1. POST /api/checkout          the cart is checked against the menu, an order is saved as "pending",
                                    and the customer is sent to Kashier's hosted payment page.
     2. GET  /pay/return            Kashier sends the customer back. The signature is checked with the
                                    Payment API Key; a valid SUCCESS marks the order "paid".
     3. POST /api/kashier/webhook   Kashier's server-to-server confirmation (same result, in case the
                                    customer closes the tab before step 2). Signature checked too.
     4. /pickup?id=…                the customer's live order status. /bar is the staff screen.

   Settings (environment variables, or website/.env locally):
     KASHIER_MID       Merchant ID, e.g. MID-12345-678 (Kashier dashboard, under your name at the top)
     KASHIER_API_KEY   Payment API Key for this business (Kashier dashboard → Integrations / API keys)
     KASHIER_MODE      test or live. Test and live have different API keys.
     SITE_URL          public address, e.g. https://refillcoffee.com (used for the return link)
     STAFF_KEY         passphrase for the /bar screen
     ORDERS_BEFORE_OPENING  true to accept live orders before opening day and outside hours (for a real test order) */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), vm = require('vm');

const ROOT = __dirname;
const env = k => String(process.env[k] || '').trim();
const K = {
  mid: env('KASHIER_MID'), key: env('KASHIER_API_KEY'),
  mode: /^live$/i.test(env('KASHIER_MODE')) ? 'live' : 'test',
  site: env('SITE_URL').replace(/\/+$/, ''), staff: env('STAFF_KEY'),
  base: 'https://checkout.kashier.io/',
};
const CURRENCY = 'EGP';

/* ---------- the menu, read from the same file the site uses ---------- */
const MENU_FILE = path.join(ROOT, 'public', 'js', 'menu-data.js');
let menu = null, menuMtime = 0, byId = new Map();
function loadMenu() {
  try {
    const st = fs.statSync(MENU_FILE);
    if (menu && st.mtimeMs === menuMtime) return menu;
    const box = { window: {} };
    vm.runInNewContext(fs.readFileSync(MENU_FILE, 'utf8'), box, { timeout: 500 });
    menu = box.window.MENU; menuMtime = st.mtimeMs; byId = new Map();
    menu.sections.forEach(s => s.groups.forEach(g => g.items.forEach(it => byId.set(it.id, it))));
  } catch (e) { console.warn('[orders] could not read the menu: ' + e.message); }
  return menu;
}
/* price for one unit: an option's own price, then { hot, iced }, then a single number */
function unitPrice(it, temp, opt) {
  if (it.options && it.options[opt] && it.options[opt][2] != null) return Number(it.options[opt][2]);
  const p = it.price;
  if (p == null) return null;
  if (typeof p === 'object' && !Array.isArray(p)) return p[temp] != null ? Number(p[temp]) : null;
  if (Array.isArray(p)) return p.find(x => x != null) ?? null;
  return Number(p);
}
const hasPrices = () => { loadMenu(); for (const it of byId.values()) if (unitPrice(it, (it.serve || ['hot'])[0], 0) != null) return true; return false; };
const configured = () => !!(K.mid && K.key);
const enabled = () => configured() && hasPrices();

/* ---------- orders, kept in data/orders.json ---------- */
const DATA = path.join(ROOT, 'data'), FILE = path.join(DATA, 'orders.json');
let orders = new Map();
try { for (const o of JSON.parse(fs.readFileSync(FILE, 'utf8'))) orders.set(o.id, o); } catch (e) { /* first run */ }
let saveT = null;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try {
      fs.mkdirSync(DATA, { recursive: true });
      const list = [...orders.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-3000);
      orders = new Map(list.map(o => [o.id, o]));
      fs.writeFileSync(FILE + '.tmp', JSON.stringify(list)); fs.renameSync(FILE + '.tmp', FILE);
    } catch (e) { console.error('[orders] save failed: ' + e.message); }
  }, 150);
}

/* ---------- helpers ---------- */
const cairo = (d = new Date()) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(d).map(p => [p.type, p.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, minutes: (+parts.hour % 24) * 60 + +parts.minute };
};
const hmac = s => crypto.createHmac('sha256', K.key).update(s, 'utf8').digest('hex');
const same = (a, b) => { a = Buffer.from(String(a || '').toLowerCase()); b = Buffer.from(String(b || '').toLowerCase()); return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b); };
const money = n => (Math.round(n * 100) / 100).toFixed(2);
const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const HEAD = { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
const json = (res, status, obj) => { res.writeHead(status, { ...HEAD, 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
const redirect = (res, to) => { res.writeHead(302, { ...HEAD, Location: to }); res.end(); };
function body(req, limit, cb) {
  let size = 0; const chunks = [];
  req.on('data', c => { size += c.length; if (size > limit) req.destroy(); else chunks.push(c); });
  req.on('end', () => cb(Buffer.concat(chunks).toString('utf8')));
}
function siteOf(req) {
  if (K.site) return K.site;
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  return `${proto === 'https' ? 'https' : 'http'}://${String(req.headers.host || 'localhost')}`;
}
const hits = new Map();
function limited(req, max) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  list.push(now); hits.set(ip, list); if (hits.size > 5000) hits.clear();
  return list.length > max;
}
const label = l => [l.temp === 'iced' && l.both ? 'Iced ' + l.name : l.name, l.option].filter(Boolean).join(' · ');
function publicOrder(o) {
  return { id: o.id, no: o.no, status: o.status, createdAt: o.createdAt, paidAt: o.paidAt || null, readyAt: o.readyAt || null,
    name: o.name.split(' ')[0], pickup: o.pickup, table: o.table, total: o.total, currency: o.currency, mode: o.mode,
    items: o.items.map(l => ({ label: label(l), qty: l.qty, unit: l.unit })) };
}

/* ---------- 1. checkout ---------- */
function checkout(req, res, isOpen) {
  if (limited(req, 20)) return json(res, 429, { error: 'Too many tries. Give it a few minutes.' });
  if (!enabled()) return json(res, 503, { error: 'Online ordering is not switched on yet.' });
  body(req, 16384, raw => {
    let b; try { b = JSON.parse(raw); } catch (e) { return json(res, 400, { error: 'Bad request' }); }
    loadMenu();
    const now = cairo(), h = menu.hours || { open: 420, close: 1440 };
    const early = /^(1|true|yes)$/i.test(env('ORDERS_BEFORE_OPENING'));
    if (K.mode === 'live' && !isOpen && !early) return json(res, 409, { error: 'We are not open yet. Ordering starts on opening day.' });
    if (K.mode === 'live' && !early && (now.minutes < h.open || now.minutes >= h.close - 15)) return json(res, 409, { error: 'The bar is closed right now. See you tomorrow from 07:00.' });

    const lines = Array.isArray(b.items) ? b.items.slice(0, 30) : [];
    const items = [];
    for (const l of lines) {
      const it = byId.get(String(l && l.id));
      if (!it) return json(res, 400, { error: 'Something in your order is no longer on the menu.' });
      if ((it.tags || []).includes('soon')) return json(res, 400, { error: `${it.name} is not served yet.` });
      const qty = Math.trunc(Number(l.qty));
      if (!(qty >= 1 && qty <= 20)) return json(res, 400, { error: 'Quantities go from 1 to 20.' });
      const opt = it.options ? Math.trunc(Number(l.opt) || 0) : 0;
      if (it.options && !(opt >= 0 && opt < it.options.length)) return json(res, 400, { error: 'Please pick a flavour again.' });
      const temp = it.serve ? (it.serve.includes(l.temp) ? l.temp : it.serve[0]) : null;
      const unit = unitPrice(it, temp, opt);
      if (unit == null || !(unit > 0)) return json(res, 400, { error: `${it.name} can't be ordered online yet.` });
      items.push({ id: it.id, name: it.name, ar: it.ar, temp, both: !!(it.serve && it.serve.length > 1), option: it.options ? it.options[opt][0] : '', opt, qty, unit });
    }
    if (!items.length) return json(res, 400, { error: 'Your order is empty.' });

    const name = clean(b.name, 60), phone = String(b.phone || '').replace(/[^\d+]/g, '').slice(0, 16), note = clean(b.note, 240);
    const table = /^\d{1,3}$/.test(String(b.table || '')) ? String(b.table) : '';
    const pickup = table ? 'table' : (['asap', '15', '30', '45', '60'].includes(String(b.pickup)) ? String(b.pickup) : 'asap');
    if (name.length < 2) return json(res, 400, { error: 'Add your name so we can call it out.' });
    if (!/^(\+?20|0)?1[0125]\d{8}$/.test(phone)) return json(res, 400, { error: 'Add a mobile number like 01xxxxxxxxx.' });

    const total = items.reduce((s, l) => s + l.unit * l.qty, 0);
    if (total > 20000) return json(res, 400, { error: 'For orders this big, please call us.' });
    const today = [...orders.values()].filter(o => o.day === now.day && o.status !== 'pending' && o.status !== 'failed').length;
    const id = 'RF' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
    const o = { id, token: crypto.randomBytes(16).toString('hex'), day: now.day, no: null, provisional: String(today + 1).padStart(3, '0'),
      createdAt: new Date().toISOString(), status: 'pending', name, phone, note, table, pickup, items, total, currency: CURRENCY, mode: K.mode };
    orders.set(id, o); save();

    const amount = money(total), site = siteOf(req);
    const q = new URLSearchParams({
      merchantId: K.mid, orderId: id, amount, currency: CURRENCY,
      hash: hmac(`/?payment=${K.mid}.${id}.${amount}.${CURRENCY}`),
      mode: K.mode, merchantRedirect: site + '/pay/return', serverWebhook: site + '/api/kashier/webhook',
      failureRedirect: 'true', redirectMethod: 'get', allowedMethods: 'card,wallet', display: 'en',
      brandColor: 'rgba(53, 35, 23, 1)', metaData: JSON.stringify({ source: 'refill-website', order: id }),
    });
    console.log(`[order] ${id} created · ${items.length} lines · ${amount} ${CURRENCY} · ${K.mode}`);
    json(res, 200, { id, token: o.token, url: K.base + '?' + q.toString() });
  });
}

/* ---------- marking an order paid (from the redirect or the webhook) ---------- */
function settle(merchantOrderId, ok, info, via) {
  const o = orders.get(String(merchantOrderId || ''));
  if (!o) { console.warn(`[order] ${via}: unknown order ${merchantOrderId}`); return null; }
  if (ok && info.amount != null && Math.abs(Number(info.amount) - o.total) > 0.005) {
    console.error(`[order] ${o.id} ${via}: amount mismatch (${info.amount} vs ${o.total}). Not marked paid.`); return o;
  }
  if (ok && (o.status === 'pending' || o.status === 'failed')) {
    o.status = 'paid'; o.paidAt = new Date().toISOString();
    o.no = String([...orders.values()].filter(x => x.day === o.day && x.no).length + 1).padStart(3, '0');
    console.log(`[order] ${o.id} PAID via ${via} · #${o.no}`);
  } else if (!ok && o.status === 'pending') { o.status = 'failed'; console.log(`[order] ${o.id} payment failed via ${via}`); }
  o.kashier = { ...(o.kashier || {}), ...Object.fromEntries(Object.entries(info).filter(([, v]) => v != null && v !== '')) };
  save(); return o;
}

/* ---------- 2. Kashier sends the customer back ---------- */
const REDIRECT_KEYS = ['paymentStatus', 'cardDataToken', 'maskedCard', 'merchantOrderId', 'orderId', 'cardBrand', 'orderReference', 'transactionId', 'amount', 'currency'];
function redirectSignatureOk(q) {
  const s = REDIRECT_KEYS.map(k => `${k}=${q.has(k) ? q.get(k) : 'null'}`).join('&');
  return same(hmac(s), q.get('signature'));
}
function payReturn(req, res, url) {
  const q = url.searchParams, id = q.get('merchantOrderId') || '';
  if (!configured()) return redirect(res, '/menu');
  if (!redirectSignatureOk(q)) {
    console.warn(`[order] ${id}: redirect signature did not match; waiting for the webhook`);
    return redirect(res, '/pickup?id=' + encodeURIComponent(id));
  }
  if (q.get('mode') && q.get('mode') !== K.mode) console.warn(`[order] ${id}: redirect mode ${q.get('mode')} but site is in ${K.mode}`);
  settle(id, q.get('paymentStatus') === 'SUCCESS', { transactionId: q.get('transactionId'), kashierOrderId: q.get('orderId'),
    maskedCard: q.get('maskedCard'), cardBrand: q.get('cardBrand'), amount: q.get('amount'), via: 'redirect' }, 'redirect');
  redirect(res, '/pickup?id=' + encodeURIComponent(id));
}

/* ---------- 3. Kashier's server-to-server webhook ---------- */
function webhookSignatureOk(data, sig) {
  if (!data || !Array.isArray(data.signatureKeys)) return false;
  const s = [...data.signatureKeys].sort().map(k => `${k}=${encodeURIComponent(data[k] == null ? '' : String(data[k]))}`).join('&');
  return same(hmac(s), sig);
}
function webhook(req, res) {
  body(req, 65536, raw => {
    let b; try { b = JSON.parse(raw); } catch (e) { res.writeHead(400, HEAD); return res.end(); }
    const d = b && b.data;
    if (!configured() || !webhookSignatureOk(d, req.headers['x-kashier-signature'])) {
      console.warn('[order] webhook rejected: bad signature'); res.writeHead(401, HEAD); return res.end();
    }
    if (b.event === 'pay' || b.event === 'authorize' || b.event === 'capture') {
      if (d.status === 'SUCCESS' || d.status === 'FAILURE') settle(d.merchantOrderId, d.status === 'SUCCESS',
        { transactionId: d.transactionId, kashierOrderId: d.kashierOrderId, method: d.method, amount: d.amount }, 'webhook');
    } else if (b.event === 'refund' || b.event === 'void' || b.event === 'reversal') {
      const o = orders.get(String(d.merchantOrderId || ''));
      if (o && d.status === 'SUCCESS') { o.status = 'refunded'; save(); console.log(`[order] ${o.id} ${b.event}`); }
    }
    res.writeHead(200, HEAD); res.end();
  });
}

/* ---------- 4. order status (customer) and the bar screen (staff) ---------- */
function status(req, res, url) {
  const o = orders.get(url.searchParams.get('id') || '');
  if (!o || !same(o.token, url.searchParams.get('t'))) return json(res, 404, { error: 'Order not found on this phone.' });
  json(res, 200, publicOrder(o));
}
const staffOk = req => K.staff.length >= 6 && same(crypto.createHash('sha256').update(K.staff).digest('hex'), crypto.createHash('sha256').update(String(req.headers['x-staff-key'] || '')).digest('hex'));
function bar(req, res) {
  if (!staffOk(req)) return json(res, 401, { error: 'Wrong staff key.' });
  const day = cairo().day;
  const list = [...orders.values()].filter(o => o.day === day && ['paid', 'ready', 'collected'].includes(o.status))
    .sort((a, b) => (a.paidAt || '').localeCompare(b.paidAt || ''))
    .map(o => ({ ...publicOrder(o), name: o.name, phone: o.phone, note: o.note, items: o.items.map(l => ({ label: label(l), qty: l.qty })) }));
  json(res, 200, { mode: K.mode, orders: list });
}
function barUpdate(req, res) {
  if (!staffOk(req)) return json(res, 401, { error: 'Wrong staff key.' });
  body(req, 2048, raw => {
    let b; try { b = JSON.parse(raw); } catch (e) { return json(res, 400, { error: 'Bad request' }); }
    const o = orders.get(String(b.id || '')), to = String(b.status || '');
    const allowed = { paid: ['ready'], ready: ['collected', 'paid'], collected: ['ready'] };
    if (!o || !(allowed[o.status] || []).includes(to)) return json(res, 400, { error: 'Cannot change that order.' });
    o.status = to; if (to === 'ready') o.readyAt = new Date().toISOString(); save();
    json(res, 200, { ok: true });
  });
}

/* ---------- router: returns true when it handled the request ---------- */
function handle(req, res, p, url, isOpen) {
  if (p === '/api/checkout') { if (req.method !== 'POST') return json(res, 405, { error: 'POST only' }), true; checkout(req, res, isOpen); return true; }
  if (p === '/api/kashier/webhook') { if (req.method !== 'POST') { res.writeHead(405, HEAD); res.end(); return true; } webhook(req, res); return true; }
  if (p === '/pay/return') { payReturn(req, res, url); return true; }
  if (p === '/api/order') { status(req, res, url); return true; }
  if (p === '/api/bar/orders') { if (req.method === 'POST') barUpdate(req, res); else bar(req, res); return true; }
  return false;
}
const publicConfig = () => ({ ordering: enabled(), payMode: K.mode });

module.exports = { handle, publicConfig, _test: { hmac, redirectSignatureOk, webhookSignatureOk, unitPrice, K } };
