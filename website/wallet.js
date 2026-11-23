/* REFILL · Apple Wallet passes and the Refill Card (stamps).

   Two passes, one Pass Type ID:
     • Order ticket (eventTicket)  added after paying. Its strip is the Refill cup filling up; when the bar taps
                                   "Ready", the pass updates and the iPhone shows "Order #012: Ready at the bar".
     • Refill Card (storeCard)     five stamps, the sixth drink is on us. Online orders stamp it automatically
                                   (one stamp per drink); at the bar, staff scan its QR code on /bar.
   The Refill Card also works without Apple Wallet: /card shows it in the browser with the same QR code.

   Settings (environment variables, or website/.env locally):
     APPLE_TEAM_ID        Apple Developer Team ID (10 characters, Membership page)
     APPLE_PASS_TYPE_ID   e.g. pass.com.therefillcafe (Identifiers → Pass Type IDs)
     APPLE_PASS_CERT      optional: the Pass Type ID certificate (default: wallet/pass-cert.pem, valid until 23 Dec 2027)
     APPLE_PASS_KEY       its private key, PEM text or base64 of it (default: wallet/secret/pass.key)
     APPLE_PASS_KEY_PASSWORD   only if the key is encrypted
     SITE_URL             https address of the site (Apple calls back to SITE_URL/wallet) */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), zlib = require('zlib'), http2 = require('http2');

const ROOT = __dirname, ART = path.join(ROOT, 'wallet', 'assets');
const env = k => String(process.env[k] || '').trim();
const pem = (v, file) => {
  if (!v && file) { try { return fs.readFileSync(file, 'utf8'); } catch (e) { return ''; } }
  if (!v) return '';
  if (v.includes('-----BEGIN')) return v.replace(/\\n/g, '\n');
  try { return Buffer.from(v, 'base64').toString('utf8'); } catch (e) { return ''; }
};
const W = {
  team: env('APPLE_TEAM_ID'), type: env('APPLE_PASS_TYPE_ID'), site: env('SITE_URL').replace(/\/+$/, ''),
  cert: pem(env('APPLE_PASS_CERT'), path.join(ROOT, 'wallet', 'pass-cert.pem')),   // the certificate is public; it ships with the code
  key: pem(env('APPLE_PASS_KEY'), path.join(ROOT, 'wallet', 'secret', 'pass.key')),
  keyPass: env('APPLE_PASS_KEY_PASSWORD'),
  wwdr: fs.readFileSync(path.join(ROOT, 'wallet', 'AppleWWDRCAG4.pem'), 'utf8'),
};
const STAMPS = 5;   // five stamps, the sixth drink is on us
const COLORS = { foregroundColor: 'rgb(242, 233, 219)', backgroundColor: 'rgb(101, 61, 38)', labelColor: 'rgb(199, 173, 145)' };

let signer = null;
function loadSigner() {
  if (signer !== null) return signer;
  signer = false;
  if (!(W.team && W.type && W.cert && W.key && /^https:\/\//.test(W.site))) return signer;
  try {
    const forge = require('./lib/node-forge/index.js');
    const cert = forge.pki.certificateFromPem(W.cert);
    const key = W.keyPass ? forge.pki.decryptRsaPrivateKey(W.key, W.keyPass) : forge.pki.privateKeyFromPem(W.key);
    if (!key) throw new Error('could not read the private key');
    signer = { forge, cert, key, wwdr: forge.pki.certificateFromPem(W.wwdr) };
    console.log('[wallet] Apple Wallet passes are on (' + W.type + ')');
  } catch (e) { console.error('[wallet] signing is off: ' + e.message); signer = false; }
  return signer;
}
const enabled = () => !!loadSigner();

/* ---------- storage: data/cards.json, data/wallet.json ---------- */
const DATA = path.join(ROOT, 'data');
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch (e) { return d; } };
const cards = new Map(Object.entries(readJson('cards.json', {})));
const reg = readJson('wallet.json', { devices: {}, updated: {} });   // devices[lib] = { pushToken, serials: { serial: true } }; updated[serial] = ms
const timers = {};
function persist(f, get) {
  clearTimeout(timers[f]);
  timers[f] = setTimeout(() => {
    try { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(path.join(DATA, f + '.tmp'), JSON.stringify(get())); fs.renameSync(path.join(DATA, f + '.tmp'), path.join(DATA, f)); }
    catch (e) { console.error('[wallet] save failed: ' + e.message); }
  }, 150);
}
const saveCards = () => persist('cards.json', () => Object.fromEntries(cards));
const saveReg = () => persist('wallet.json', () => reg);

/* ---------- tiny zip writer (deflate) ---------- */
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
const crc32 = b => { let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function zip(files) {
  const parts = [], central = []; let off = 0;
  for (const [name, data] of files) {
    const n = Buffer.from(name), z = zlib.deflateRawSync(data), c = crc32(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0, 6); h.writeUInt16LE(8, 8);
    h.writeUInt32LE(0, 10); h.writeUInt32LE(c, 14); h.writeUInt32LE(z.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(n.length, 26); h.writeUInt16LE(0, 28);
    const ce = Buffer.alloc(46); ce.writeUInt32LE(0x02014b50, 0); ce.writeUInt16LE(20, 4); ce.writeUInt16LE(20, 6); ce.writeUInt16LE(0, 8); ce.writeUInt16LE(8, 10);
    ce.writeUInt32LE(0, 12); ce.writeUInt32LE(c, 16); ce.writeUInt32LE(z.length, 20); ce.writeUInt32LE(data.length, 24); ce.writeUInt16LE(n.length, 28); ce.writeUInt32LE(off, 42);
    parts.push(h, n, z); central.push(ce, n); off += 30 + n.length + z.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, end]);
}

/* ---------- building and signing a .pkpass ---------- */
const art = f => fs.readFileSync(path.join(ART, f));
function pkpass(passJson, images) {
  const s = loadSigner(); if (!s) throw new Error('wallet not configured');
  const files = [['pass.json', Buffer.from(JSON.stringify(passJson))]];
  for (const [name, src] of images) for (const suf of ['', '@2x', '@3x']) files.push([name + suf + '.png', art(src + suf + '.png')]);
  const manifest = Buffer.from(JSON.stringify(Object.fromEntries(files.map(([n, d]) => [n, crypto.createHash('sha1').update(d).digest('hex')]))));
  const f = s.forge, p7 = f.pkcs7.createSignedData();
  p7.content = f.util.createBuffer(manifest.toString('binary'));
  p7.addCertificate(s.cert); p7.addCertificate(s.wwdr);
  p7.addSigner({ key: s.key, certificate: s.cert, digestAlgorithm: f.pki.oids.sha256,
    authenticatedAttributes: [{ type: f.pki.oids.contentType, value: f.pki.oids.data }, { type: f.pki.oids.messageDigest }, { type: f.pki.oids.signingTime, value: new Date() }] });
  p7.sign({ detached: true });
  files.push(['manifest.json', manifest], ['signature', Buffer.from(f.asn1.toDer(p7.toAsn1()).getBytes(), 'binary')]);
  return zip(files);
}
const base = (serial, token, description) => ({
  formatVersion: 1, passTypeIdentifier: W.type, teamIdentifier: W.team, serialNumber: serial, authenticationToken: token,
  webServiceURL: W.site + '/wallet', organizationName: 'Refill', description, ...COLORS, sharingProhibited: true,
});
const cairoNextMorning = () => { const d = new Date(Date.now() + 24 * 3600e3); d.setUTCHours(1, 0, 0, 0); return d.toISOString(); };

/* order ticket */
const STATUS = { paid: ['Being made', 'making'], ready: ['Ready at the bar', 'ready'], collected: ['Collected · enjoy', 'done'], refunded: ['Refunded', 'done'] };
function orderPass(o, label) {
  const [statusText, strip] = STATUS[o.status] || STATUS.paid;
  const summary = o.items.map(l => (l.qty > 1 ? l.qty + '× ' : '') + label(l)).join(', ');
  const where = o.table ? ['TABLE', String(o.table).padStart(2, '0')] : ['PICK-UP', o.pickup === 'asap' ? 'At the bar' : 'In ' + (o.pickup === '60' ? '1 hour' : o.pickup + ' min')];
  return pkpass({
    ...base('o-' + o.id, o.passToken, 'Refill order #' + o.no),
    relevantDate: o.paidAt || new Date().toISOString(), expirationDate: cairoNextMorning(),
    ...(o.status === 'collected' || o.status === 'refunded' ? { voided: true } : {}),
    barcodes: [{ format: 'PKBarcodeFormatQR', message: 'RFO:' + o.id, messageEncoding: 'iso-8859-1', altText: 'Order #' + o.no }],
    eventTicket: {
      headerFields: [{ key: 'no', label: 'ORDER', value: '#' + o.no }],
      secondaryFields: [
        { key: 'status', label: 'STATUS', value: statusText, changeMessage: 'Order #' + o.no + ': %@' },
        { key: 'where', label: where[0], value: where[1], textAlignment: 'PKTextAlignmentRight' }],
      auxiliaryFields: [
        { key: 'items', label: 'YOUR ORDER', value: summary.length > 60 ? summary.slice(0, 57) + '…' : summary },
        { key: 'total', label: 'TOTAL', value: o.total + ' ' + o.currency, textAlignment: 'PKTextAlignmentRight' }],
      backFields: [
        { key: 'b-items', label: 'Order', value: o.items.map(l => l.qty + ' × ' + label(l)).join('\n') },
        { key: 'b-name', label: 'Name', value: o.name },
        { key: 'b-how', label: 'How it works', value: 'We start making it as soon as it is paid. This pass changes to "Ready at the bar" the moment it is ready, and your iPhone lets you know. Show the order number at the bar.' },
        { key: 'b-ar', label: 'بالعربي', value: 'هنبعتلك إشعار أول ما طلبك يجهز. وريّ رقم الطلب للباريستا.' },
        { key: 'b-web', label: 'Live status', value: W.site + '/pickup?id=' + o.id, attributedValue: `<a href="${W.site}/pickup?id=${o.id}">Open your order</a>` },
        { key: 'b-ref', label: 'Reference', value: o.id }],
    },
  }, [['icon', 'icon'], ['logo', 'logo'], ['strip', 'order-' + strip]]);
}

/* Refill Card */
const free = c => Math.floor(c.stamps / STAMPS);
const left = c => c.stamps % STAMPS;
function cardPass(c) {
  const f = free(c), have = f ? STAMPS : left(c);
  return pkpass({
    ...base('c-' + c.id, c.passToken, 'Refill Card'),
    barcodes: [{ format: 'PKBarcodeFormatQR', message: 'RFC:' + c.code, messageEncoding: 'iso-8859-1', altText: c.code }],
    storeCard: {
      headerFields: [{ key: 'free', label: 'ON US', value: f ? f + (f > 1 ? ' drinks' : ' drink') : '—', ...(f ? { changeMessage: 'Your next drink is on us ☕' } : {}) }],
      secondaryFields: [
        { key: 'stamps', label: 'STAMPS', value: have + ' of ' + STAMPS, changeMessage: 'Refill Card: %@ stamps' },
        { key: 'member', label: 'MEMBER', value: c.name, textAlignment: 'PKTextAlignmentRight' }],
      auxiliaryFields: [{ key: 'next', label: 'NEXT', value: f ? 'Your next drink is on us. Show this card at the bar.' : (STAMPS - left(c)) + ' more ' + (STAMPS - left(c) === 1 ? 'drink' : 'drinks') + ' to a free one' }],
      backFields: [
        { key: 'b-how', label: 'How it works', value: 'One stamp for every drink. Five stamps and the sixth drink is on us. Order online and the stamps land here by themselves; at the bar, show this card before you pay.' },
        { key: 'b-ar', label: 'بالعربي', value: 'ختم على كل مشروب. خمس أختام والسادس علينا.' },
        { key: 'b-code', label: 'Card code', value: c.code },
        { key: 'b-total', label: 'Drinks so far', value: String(c.total || 0) },
        { key: 'b-web', label: 'Your card online', value: W.site + '/card', attributedValue: `<a href="${W.site}/card">therefillcafe.com/card</a>` }],
    },
  }, [['icon', 'icon'], ['logo', 'logo'], ['strip', 'card-' + Math.min(have, STAMPS)]]);
}

/* ---------- APNs: tell iPhones that a pass changed ---------- */
let apns = null;
function push(serial) {
  reg.updated[serial] = Date.now(); saveReg();
  const s = loadSigner(); if (!s) return;
  const tokens = Object.entries(reg.devices).filter(([, d]) => d.serials[serial]).map(([lib, d]) => [lib, d.pushToken]);
  if (!tokens.length) return;
  try {
    if (!apns || apns.closed || apns.destroyed) {
      apns = http2.connect('https://api.push.apple.com', { cert: W.cert, key: W.key, passphrase: W.keyPass || undefined });
      apns.on('error', e => { console.warn('[wallet] APNs: ' + e.message); apns = null; });
      apns.setTimeout(60000, () => { if (apns) apns.close(); apns = null; });
    }
    for (const [lib, tok] of tokens) {
      const r = apns.request({ ':method': 'POST', ':path': '/3/device/' + tok, 'apns-topic': W.type });
      r.on('response', h => {
        const st = h[':status'];
        if (st === 410) { delete reg.devices[lib]; saveReg(); }
        else if (st !== 200) console.warn('[wallet] APNs ' + st + ' for ' + serial);
      });
      r.on('error', e => console.warn('[wallet] APNs request: ' + e.message));
      r.end('{}');
    }
  } catch (e) { console.warn('[wallet] push failed: ' + e.message); }
}

/* ---------- Refill Card data ---------- */
const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => { let c; do { c = 'RF-' + Array.from(crypto.randomBytes(5), b => ALPH[b % 32]).join(''); } while ([...cards.values()].some(x => x.code === c)); return c; };
function createCard(name) {
  const id = crypto.randomBytes(9).toString('base64url');
  const c = { id, code: newCode(), token: crypto.randomBytes(16).toString('hex'), passToken: crypto.randomBytes(16).toString('hex'),
    name: name || 'Friend', stamps: 0, total: 0, redeemed: 0, createdAt: new Date().toISOString(), history: [] };
  cards.set(id, c); saveCards(); return c;
}
function stamp(c, n, by) {
  c.stamps += n; c.total = (c.total || 0) + n; c.updatedAt = new Date().toISOString();
  c.history.push({ at: c.updatedAt, d: n, by }); c.history = c.history.slice(-100);
  saveCards(); push('c-' + c.id);
}
function redeem(c, by) {
  if (c.stamps < STAMPS) return false;
  c.stamps -= STAMPS; c.redeemed = (c.redeemed || 0) + 1; c.updatedAt = new Date().toISOString();
  c.history.push({ at: c.updatedAt, d: -STAMPS, by, redeem: true }); saveCards(); push('c-' + c.id); return true;
}
const same = (a, b) => { a = Buffer.from(String(a || '')); b = Buffer.from(String(b || '')); return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b); };
const cardFor = (id, token) => { const c = cards.get(String(id || '')); return c && same(c.token, token) ? c : null; };
const publicCard = c => ({ id: c.id, code: c.code, name: c.name, stamps: c.stamps, have: free(c) ? STAMPS : left(c), free: free(c), of: STAMPS, total: c.total || 0, wallet: enabled() });
const drinks = o => o.items.reduce((s, l) => s + (l.temp ? l.qty : 0), 0);

/* ---------- HTTP ---------- */
const HEAD = { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' };
const json = (res, st, o) => { res.writeHead(st, { ...HEAD, 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(o)); };
const empty = (res, st) => { res.writeHead(st, HEAD); res.end(); };
function body(req, limit, cb) { let n = 0; const ch = []; req.on('data', c => { n += c.length; if (n > limit) req.destroy(); else ch.push(c); }); req.on('end', () => { let b = {}; try { b = JSON.parse(Buffer.concat(ch).toString('utf8') || '{}'); } catch (e) { b = null; } cb(b); }); }
const sendPass = (res, buf, name) => { res.writeHead(200, { ...HEAD, 'Content-Type': 'application/vnd.apple.pkpass', 'Content-Disposition': `attachment; filename="${name}.pkpass"`, 'Last-Modified': new Date().toUTCString() }); res.end(buf); };
const hits = new Map();
function limited(req, max) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now(), l = (hits.get(ip) || []).filter(t => now - t < 600000); l.push(now); hits.set(ip, l); if (hits.size > 5000) hits.clear(); return l.length > max;
}
const applePass = req => String(req.headers.authorization || '').replace(/^ApplePass\s+/i, '');

let O = null;   // the orders module, connected by attach()
function passFor(serial) {
  if (serial.startsWith('o-')) { const o = O.get(serial.slice(2)); return o && o.passToken ? { token: o.passToken, build: () => orderPass(o, O.label) } : null; }
  if (serial.startsWith('c-')) { const c = cards.get(serial.slice(2)); return c ? { token: c.passToken, build: () => cardPass(c) } : null; }
  return null;
}

function handle(req, res, p, url, staffOk) {
  /* Apple's pass web service: /wallet/v1/… */
  let m;
  if ((m = /^\/wallet\/v1\/devices\/([^/]+)\/registrations\/([^/]+)\/([^/]+)$/.exec(p))) {
    const [, lib, type, serial] = m, pass = type === W.type && passFor(serial);
    if (!pass || !same(pass.token, applePass(req))) return empty(res, 401), true;
    if (req.method === 'DELETE') { if (reg.devices[lib]) { delete reg.devices[lib].serials[serial]; if (!Object.keys(reg.devices[lib].serials).length) delete reg.devices[lib]; saveReg(); } return empty(res, 200), true; }
    if (req.method !== 'POST') return empty(res, 405), true;
    body(req, 4096, b => {
      if (!b || !b.pushToken) return empty(res, 400);
      const d = reg.devices[lib] || (reg.devices[lib] = { pushToken: b.pushToken, serials: {} });
      const had = !!d.serials[serial]; d.pushToken = b.pushToken; d.serials[serial] = true; saveReg();
      empty(res, had ? 200 : 201);
    });
    return true;
  }
  if ((m = /^\/wallet\/v1\/devices\/([^/]+)\/registrations\/([^/]+)$/.exec(p))) {
    const d = reg.devices[m[1]]; if (!d || m[2] !== W.type) return empty(res, 204), true;
    const since = Number(url.searchParams.get('passesUpdatedSince') || 0);
    const serials = Object.keys(d.serials).filter(s => (reg.updated[s] || 0) > since);
    if (!serials.length) return empty(res, 204), true;
    return json(res, 200, { serialNumbers: serials, lastUpdated: String(Date.now()) }), true;
  }
  if ((m = /^\/wallet\/v1\/passes\/([^/]+)\/([^/]+)$/.exec(p))) {
    const pass = m[1] === W.type && passFor(m[2]);
    if (!pass || !same(pass.token, applePass(req))) return empty(res, 401), true;
    const ims = Date.parse(req.headers['if-modified-since'] || '');
    if (ims && (reg.updated[m[2]] || 0) <= ims + 999) return empty(res, 304), true;
    try { sendPass(res, pass.build(), 'refill'); } catch (e) { console.error('[wallet] ' + e.message); empty(res, 500); }
    return true;
  }
  if (p === '/wallet/v1/log') { body(req, 32768, b => { if (b && Array.isArray(b.logs)) b.logs.slice(0, 20).forEach(l => console.log('[wallet] device log: ' + String(l).slice(0, 300))); empty(res, 200); }); return true; }

  /* downloads for customers */
  if (p === '/wallet/order.pkpass') {
    if (!enabled()) return json(res, 503, { error: 'Apple Wallet is not switched on yet.' }), true;
    const o = O.get(url.searchParams.get('id') || '');
    if (!o || !same(o.token, url.searchParams.get('t')) || !['paid', 'ready', 'collected'].includes(o.status)) return json(res, 404, { error: 'Order not found.' }), true;
    if (!o.passToken) { o.passToken = crypto.randomBytes(16).toString('hex'); O.save(); }
    try { sendPass(res, orderPass(o, O.label), 'refill-order-' + o.no); } catch (e) { console.error('[wallet] ' + e.message); json(res, 500, { error: 'Could not make the pass.' }); }
    return true;
  }
  if (p === '/wallet/card.pkpass') {
    if (!enabled()) return json(res, 503, { error: 'Apple Wallet is not switched on yet.' }), true;
    const c = cardFor(url.searchParams.get('id'), url.searchParams.get('t'));
    if (!c) return json(res, 404, { error: 'Card not found.' }), true;
    try { sendPass(res, cardPass(c), 'refill-card'); } catch (e) { console.error('[wallet] ' + e.message); json(res, 500, { error: 'Could not make the pass.' }); }
    return true;
  }
  if ((m = /^\/wallet\/art\/(card-[0-5]|order-(?:making|ready|done))@2x\.png$/.exec(p))) {
    res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800', 'X-Content-Type-Options': 'nosniff' }); res.end(art(m[1] + '@2x.png')); return true;
  }

  /* the Refill Card for customers */
  if (p === '/api/card') {
    if (req.method === 'GET') { const c = cardFor(url.searchParams.get('id'), url.searchParams.get('t')); return json(res, c ? 200 : 404, c ? publicCard(c) : { error: 'Card not found.' }), true; }
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }), true;
    if (limited(req, 15)) return json(res, 429, { error: 'Too many tries. Try again later.' }), true;
    body(req, 2048, b => {
      if (!b) return json(res, 400, { error: 'Bad request' });
      const name = String(b.name || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 40);
      let c = b.id ? cardFor(b.id, b.token) : null;
      if (!c) { if (name.length < 2) return json(res, 400, { error: 'Add your first name.' }); c = createCard(name); }
      let added = 0;
      if (b.order) {   // claim the stamps of a paid online order (once)
        const o = O.get(String(b.order));
        if (o && same(o.token, b.orderToken) && ['paid', 'ready', 'collected'].includes(o.status) && !o.stamped) {
          added = drinks(o); o.stamped = true; o.cardId = c.id; O.save(); if (added) stamp(c, added, 'order ' + o.id);
        }
      }
      json(res, 200, { ...publicCard(c), token: c.token, added });
    });
    return true;
  }

  /* staff check: can this server talk to Apple's push service with the pass certificate?
     Expected answer: 400 BadDeviceToken (Apple accepted the certificate; the test device is made up). */
  if (p === '/api/bar/wallet-check') {
    if (!staffOk(req)) return json(res, 401, { error: 'Wrong staff key.' }), true;
    if (!enabled()) return json(res, 200, { wallet: false, reason: 'Apple Wallet settings are missing or the key does not load.' }), true;
    const c = http2.connect('https://api.push.apple.com', { cert: W.cert, key: W.key, passphrase: W.keyPass || undefined });
    let done = false; const finish = o => { if (done) return; done = true; try { c.close(); } catch (e) { /* */ } json(res, 200, o); };
    c.on('error', e => finish({ wallet: true, apns: 'error', reason: e.message }));
    const r = c.request({ ':method': 'POST', ':path': '/3/device/' + '0'.repeat(64), 'apns-topic': W.type });
    let st = 0, b = ''; r.on('response', h => { st = h[':status']; }); r.on('data', d => { b += d; });
    r.on('end', () => { let reason = ''; try { reason = JSON.parse(b).reason; } catch (e) { /* */ }
      finish({ wallet: true, passType: W.type, apns: st, reason, ok: st === 400 && reason === 'BadDeviceToken' }); });
    r.setTimeout(10000, () => finish({ wallet: true, apns: 'timeout' }));
    r.end('{}');
    return true;
  }

  /* the bar: look up a card, stamp it, redeem */
  if (p === '/api/bar/card') {
    if (!staffOk(req)) return json(res, 401, { error: 'Wrong staff key.' }), true;
    const find = code => { code = String(code || '').toUpperCase().replace(/^RFC:/, '').replace(/\s/g, ''); if (/^[A-Z0-9]{5}$/.test(code)) code = 'RF-' + code; return [...cards.values()].find(c => c.code === code); };
    if (req.method === 'GET') { const c = find(url.searchParams.get('code')); return json(res, c ? 200 : 404, c ? publicCard(c) : { error: 'No card with that code.' }), true; }
    body(req, 1024, b => {
      const c = b && find(b.code); if (!c) return json(res, 404, { error: 'No card with that code.' });
      if (b.action === 'stamp') { const n = Math.max(1, Math.min(10, Math.trunc(Number(b.n) || 1))); stamp(c, n, 'bar'); return json(res, 200, publicCard(c)); }
      if (b.action === 'redeem') { if (!redeem(c, 'bar')) return json(res, 409, { error: 'Not enough stamps yet.' }); return json(res, 200, { ...publicCard(c), redeemed: true }); }
      json(res, 400, { error: 'Unknown action' });
    });
    return true;
  }
  return false;
}

/* hooks from the orders module */
function attach(orders) {
  O = orders;
  orders.on('change', o => { if (o.passToken) push('o-' + o.id); });
  orders.on('paid', o => {   // online orders stamp the card they were placed with
    if (o.cardId && !o.stamped) { const c = cards.get(o.cardId); if (c) { o.stamped = true; O.save(); const n = drinks(o); if (n) stamp(c, n, 'order ' + o.id); } }
  });
}
const verifyCard = (id, token) => !!cardFor(id, token);
const orderCardInfo = o => { const c = o.cardId && cards.get(o.cardId); return c ? { stamped: !!o.stamped, added: drinks(o), card: publicCard(c) } : { stamped: false, added: drinks(o) }; };

module.exports = { handle, attach, enabled, verifyCard, orderCardInfo, _test: { zip, crc32, orderPass, cardPass, createCard, W } };
