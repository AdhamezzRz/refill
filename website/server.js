/* REFILL website server. Zero dependencies: plain Node http, so there is nothing to install or build.
   Hostinger Web App settings: root directory "website", preset "Other", entry file "server.js". */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');

/* ---- secrets: website/.env (never committed). On Hostinger, set these as environment variables instead. ---- */
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch (e) { /* no .env: use the host's environment variables */ }
const orders = require('./orders');
const wallet = require('./wallet');
orders.connect(wallet); wallet.attach(orders);

const PUB = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

/* ---- config: site.config.json, overridable with environment variables ---- */
let file = {};
try { file = JSON.parse(fs.readFileSync(path.join(__dirname, 'site.config.json'), 'utf8')); } catch (e) { /* optional */ }
const pick = (env, key) => String(process.env[env] || file[key] || '').trim();
const isHttp = u => /^https?:\/\//i.test(u);
const CFG = {
  instagram: pick('INSTAGRAM_URL', 'instagram'), maps: pick('MAPS_URL', 'maps'),
  order: pick('ORDER_URL', 'orderUrl'), rate: pick('RATE_URL', 'rateUrl'),
  googleReview: pick('GOOGLE_REVIEW_URL', 'googleReviewUrl'), webhook: pick('RATE_WEBHOOK_URL', 'rateWebhookUrl'),
};
for (const k of Object.keys(CFG)) if (CFG[k] && !isHttp(CFG[k])) { console.warn(`[config] ignoring ${k}: not an http(s) URL`); CFG[k] = ''; }
/* isOpen: false until opening day. While false the site says "Opening soon"; when true it shows live open/closed. */
const IS_OPEN = /^(1|true|yes)$/i.test(String(process.env.IS_OPEN || file.isOpen || ''));
const PUBLIC_CFG = { instagram: CFG.instagram, maps: CFG.maps, googleReview: CFG.googleReview, isOpen: IS_OPEN };

/* ---- static files ---- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.mp4': 'video/mp4', '.mp3': 'audio/mpeg' };
const COMPRESS = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt', '.xml']);
const LONG = new Set(['.woff2', '.webp', '.jpg', '.png', '.mp4', '.mp3']);
const MEDIA = new Set(['.mp4', '.mp3']);   // served with byte ranges: Safari will not play video without them
const cache = new Map();   // path -> { mtimeMs, raw, br, gz, etag }

const HEADERS = {
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
};

function load(fp) {
  const st = fs.statSync(fp);
  if (!st.isFile()) throw Object.assign(new Error('not a file'), { code: 'ENOENT' });
  let e = cache.get(fp);
  if (e && e.mtimeMs === st.mtimeMs) return e;
  const raw = fs.readFileSync(fp), ext = path.extname(fp);
  e = { mtimeMs: st.mtimeMs, raw, etag: `"${st.size.toString(16)}-${Math.round(st.mtimeMs).toString(16)}"` };
  if (COMPRESS.has(ext) && raw.length > 600) {
    e.br = zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } });
    e.gz = zlib.gzipSync(raw, { level: 8 });
  }
  cache.set(fp, e); return e;
}

function send(req, res, fp, status = 200) {
  let e;
  try { e = load(fp); } catch (err) { return fp.endsWith('404.html') ? text(res, 404, 'Not found') : send(req, res, path.join(PUB, '404.html'), 404); }
  const ext = path.extname(fp);
  const h = { ...HEADERS, 'Content-Type': TYPES[ext] || 'application/octet-stream', ETag: e.etag, Vary: 'Accept-Encoding',
    'Cache-Control': ext === '.html' ? 'no-cache' : LONG.has(ext) ? 'public, max-age=604800' : 'public, max-age=3600' };
  if (status === 200 && req.headers['if-none-match'] === e.etag) { res.writeHead(304, h); return res.end(); }
  if (MEDIA.has(ext)) {
    h['Accept-Ranges'] = 'bytes';
    const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || '')), size = e.raw.length;
    if (m && (m[1] || m[2])) {
      let start = m[1] ? parseInt(m[1], 10) : Math.max(0, size - parseInt(m[2], 10));
      let end = m[1] && m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
      if (start >= size || start > end) { res.writeHead(416, { ...h, 'Content-Range': `bytes */${size}` }); return res.end(); }
      h['Content-Range'] = `bytes ${start}-${end}/${size}`; h['Content-Length'] = end - start + 1;
      res.writeHead(206, h);
      return res.end(req.method === 'HEAD' ? undefined : e.raw.subarray(start, end + 1));
    }
  }
  const ae = String(req.headers['accept-encoding'] || '');
  let bodyOut = e.raw;
  if (e.br && /\bbr\b/.test(ae)) { bodyOut = e.br; h['Content-Encoding'] = 'br'; }
  else if (e.gz && /\bgzip\b/.test(ae)) { bodyOut = e.gz; h['Content-Encoding'] = 'gzip'; }
  h['Content-Length'] = bodyOut.length;
  res.writeHead(status, h);
  res.end(req.method === 'HEAD' ? undefined : bodyOut);
}
const text = (res, status, msg, extra = {}) => { res.writeHead(status, { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...extra }); res.end(msg); };

/* ---- /order and /rate: where the table QR signs point ---- */
function tableLink(target, table) {
  if (target.includes('{table}')) return target.replace('{table}', encodeURIComponent(table));
  if (!table) return target;
  const u = new URL(target); u.searchParams.set('table', table); return u.toString();
}
const cleanTable = q => { const t = String(q.get('table') || ''); return /^\d{1,3}$/.test(t) ? t : ''; };

/* ---- ratings: logged to stdout (Hostinger "Runtime logs") and optionally forwarded to a webhook ---- */
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 12;
}
function rate(req, res) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (limited(ip)) return text(res, 429, 'Too many ratings. Try again later.');
  let size = 0; const chunks = [];
  req.on('data', c => { size += c.length; if (size > 4096) { req.destroy(); } else chunks.push(c); });
  req.on('end', () => {
    let b; try { b = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (e) { return text(res, 400, 'Bad request'); }
    const score = Number(b && b.score), table = String((b && b.table) || ''), note = String((b && b.note) || '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 500);
    if (!Number.isInteger(score) || score < 1 || score > 5 || !/^\d{0,3}$/.test(table)) return text(res, 400, 'Bad request');
    const entry = { at: new Date().toISOString(), score, table, note };
    console.log('[rating] ' + JSON.stringify(entry));
    if (CFG.webhook) fetch(CFG.webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry), signal: AbortSignal.timeout(8000) })
      .catch(err => console.warn('[rating] webhook failed: ' + err.message));
    res.writeHead(204, HEADERS); res.end();
  });
}

const server = http.createServer((req, res) => {
  let url;
  try { url = new URL(req.url, 'http://x'); } catch (e) { return text(res, 400, 'Bad request'); }
  let p; try { p = decodeURIComponent(url.pathname); } catch (e) { return text(res, 400, 'Bad request'); }

  if (p === '/api/rate') return req.method === 'POST' ? rate(req, res) : text(res, 405, 'Method not allowed', { Allow: 'POST' });
  if (orders.handle(req, res, p, url, IS_OPEN)) return;
  if ((p.startsWith('/wallet/') || p.startsWith('/api/card') || p === '/api/bar/card') && wallet.handle(req, res, p, url, orders.staffOk)) return;
  if (req.method !== 'GET' && req.method !== 'HEAD') return text(res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });

  if (p === '/healthz') return text(res, 200, 'ok');
  if (p === '/config.js') { res.writeHead(200, { ...HEADERS, 'Content-Type': TYPES['.js'], 'Cache-Control': 'no-cache' }); return res.end('window.REFILL=' + JSON.stringify({ ...PUBLIC_CFG, ...orders.publicConfig(), wallet: wallet.enabled() }) + ';'); }
  if (p === '/order' || p === '/rate') {
    const target = p === '/order' ? CFG.order : CFG.rate;
    if (target) { res.writeHead(302, { ...HEADERS, Location: tableLink(target, cleanTable(url.searchParams)), 'Cache-Control': 'no-store' }); return res.end(); }
    // no external ordering yet: /order?table=4 opens the menu in table mode
    return send(req, res, path.join(PUB, p === '/order' ? 'menu.html' : 'rate.html'));
  }
  if (p === '/menu' || p === '/menu/') return send(req, res, path.join(PUB, 'menu.html'));
  if (p === '/pickup') return send(req, res, path.join(PUB, 'pickup.html'));
  if (p === '/bar') return send(req, res, path.join(PUB, 'bar.html'));
  if (p === '/card') return send(req, res, path.join(PUB, 'card.html'));
  if (p.endsWith('/')) p += 'index.html';
  const fp = path.normalize(path.join(PUB, p));
  if (fp !== PUB && !fp.startsWith(PUB + path.sep)) return text(res, 403, 'Forbidden');
  send(req, res, fp);
});
server.listen(PORT, HOST, () => console.log(`REFILL is pouring on http://${HOST}:${PORT}`));
