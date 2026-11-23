// REFILL · Apple Wallet artwork. Renders the pass images into website/wallet/assets/ (run once; the server only reads them).
//   node website/tools/build-wallet.js
// Order ticket strip: the Refill cup fills as the order moves (being made → ready → enjoy).
// Refill Card strip: six cups; each stamp fills one; the sixth is on us.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const OUT = path.resolve(__dirname, '../wallet/assets'); fs.mkdirSync(OUT, { recursive: true });
const b64 = f => 'data:font/woff2;base64,' + fs.readFileSync(f).toString('base64');
const MONT = b64(path.resolve(__dirname, '../public/assets/fonts/montserrat-latin.woff2'));
const SCRIPT = b64(path.resolve(__dirname, '../../campaign/04-december/tools/fonts/great-vibes.woff2'));
const BROWN = '#653d26', DARK = '#4e2d1b', CARAMEL = '#c7ad91', CREAM = '#f2e9db', COFFEE = '#2f1a0f', CREMA = '#b98652';

const CSS = `@font-face{font-family:M;src:url(${MONT}) format('woff2');font-weight:200 700}
@font-face{font-family:S;src:url(${SCRIPT}) format('woff2')}
*{margin:0;padding:0;box-sizing:border-box}html,body{width:var(--w);height:var(--h);overflow:hidden;background:transparent}
body{position:relative;font-family:M;-webkit-font-smoothing:antialiased}.abs{position:absolute}`;
const GRAIN = `<svg class="abs" style="inset:0;opacity:.18;mix-blend-mode:soft-light" width="100%" height="100%"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .9  0 0 0 .55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;

/* the Refill cup, drawn in a 100×100 box, with liquid level k (0..1) */
function cup({ k = 0, stroke = CREAM, sw = 6, liquid = COFFEE, crema = CREMA, id = 'c', glow = false, lid = true }) {
  const top = 27.04, bottom = 88.8, y = bottom - (bottom - top) * k;
  return `<svg viewBox="-6 -6 112 112" style="overflow:visible;width:100%;height:100%">
    <defs><clipPath id="${id}"><path d="M16.72 55.52V27.04H83.28V55.52A33.28 33.28 0 0 1 16.72 55.52Z"/></clipPath>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${crema}"/><stop offset=".18" stop-color="${liquid}"/></linearGradient></defs>
    ${glow ? `<circle cx="50" cy="58" r="46" fill="${CARAMEL}" opacity=".16"/>` : ''}
    ${k > 0 ? `<g clip-path="url(#${id})"><rect x="0" y="${y}" width="100" height="${100 - y}" fill="url(#${id}g)"/><path d="M0 ${y + 0.8} Q 25 ${y - 1.6} 50 ${y + 0.8} T 100 ${y + 0.8}" stroke="${CREAM}" stroke-opacity=".35" stroke-width="1.4" fill="none"/></g>` : ''}
    <g fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="square">${lid ? '<path d="M6.2 3.36H93.8"/>' : ''}<path d="M13.36 55.52V23.68H86.64V55.52A36.64 36.64 0 0 1 13.36 55.52Z"/></g></svg>`;
}
const steam = (x, y, s) => `<svg class="abs" style="left:${x}px;top:${y}px;width:${s}px;height:${s * 1.2}px;overflow:visible" viewBox="0 0 40 48"><g fill="none" stroke="${CREAM}" stroke-width="2.2" stroke-linecap="round" opacity=".7">
  <path d="M10 46 C 4 36, 16 30, 10 20 S 14 6, 10 2"/><path d="M22 46 C 16 34, 28 28, 22 16 S 26 4, 22 0"/><path d="M34 46 C 28 36, 40 30, 34 20"/></g></svg>`;

/* ---- order ticket strip: 375 × 98 pt ---- */
function orderStrip(state, sc) {
  const W = 375 * sc, H = 98 * sc, u = sc;
  const k = { making: 0.55, ready: 1, done: 0.12 }[state];
  const script = { making: 'being made', ready: 'it’s ready', done: 'enjoy it' }[state];
  const caps = { making: 'YOUR ORDER IS', ready: 'COME TO THE BAR', done: 'SEE YOU FOR A REFILL' }[state];
  return { w: W, h: H, html: `<div class="abs" style="inset:0;background:radial-gradient(120% 140% at 80% 10%, ${BROWN} 0%, ${DARK} 100%)"></div>${GRAIN}
    <div class="abs" style="left:${22 * u}px;top:${10 * u}px;width:${78 * u}px;height:${78 * u}px">${cup({ k, sw: 5.4, id: 'o' + state, glow: state === 'ready' })}</div>
    ${state === 'ready' ? steam(46 * u, -2 * u, 26 * u) : ''}
    <p class="abs" style="left:${122 * u}px;top:${24 * u}px;font:700 ${9 * u}px/1 M;letter-spacing:.32em;color:${CARAMEL}">${caps}</p>
    <p class="abs" style="left:${118 * u}px;top:${34 * u}px;font:400 ${40 * u}px/1 S;color:${CREAM}">${script}</p>
    <div class="abs" style="right:${18 * u}px;top:${18 * u}px;bottom:${18 * u}px;width:${1 * u}px;background:${CARAMEL};opacity:.35"></div>` };
}

/* ---- Refill Card strip: 375 × 123 pt, six cups ---- */
function cardStrip(n, sc) {
  const W = 375 * sc, H = 123 * sc, u = sc, size = 44 * u, gap = (W - 6 * size - 40 * u) / 5;
  const cups = [0, 1, 2, 3, 4, 5].map(i => {
    const x = 20 * u + i * (size + gap), last = i === 5, full = i < n, free = last && n >= 5;
    const c = last
      ? cup({ k: free ? 1 : 0, stroke: free ? CREAM : CARAMEL, sw: free ? 6 : 4.5, id: 'f' + n, liquid: COFFEE, crema: CARAMEL, glow: free })
      : cup({ k: full ? 0.86 : 0, stroke: full ? CREAM : 'rgba(242,233,219,.38)', sw: full ? 6 : 4.5, id: 'c' + i + n });
    const label = last ? `<p class="abs" style="left:${x - 10 * u}px;width:${size + 20 * u}px;top:${78 * u}px;text-align:center;font:400 ${17 * u}px/1 S;color:${free ? CREAM : CARAMEL}">on us</p>`
      : `<p class="abs" style="left:${x}px;width:${size}px;top:${80 * u}px;text-align:center;font:700 ${8 * u}px/1 M;letter-spacing:.2em;color:${full ? CARAMEL : 'rgba(199,173,145,.5)'}">0${i + 1}</p>`;
    return `<div class="abs" style="left:${x}px;top:${24 * u}px;width:${size}px;height:${size}px">${c}</div>${label}${free ? steam(x + 12 * u, 6 * u, 20 * u) : ''}`;
  }).join('');
  return { w: W, h: H, html: `<div class="abs" style="inset:0;background:radial-gradient(130% 150% at 85% 0%, ${BROWN} 0%, ${DARK} 100%)"></div>${GRAIN}${cups}
    <div class="abs" style="left:${20 * u}px;right:${20 * u}px;top:${100 * u}px;height:${1 * u}px;background:${CARAMEL};opacity:.22"></div>` };
}

/* ---- icon (29 pt) and logo (up to 160 × 50 pt) ---- */
const icon = sc => ({ w: 29 * sc, h: 29 * sc, html: `<div class="abs" style="inset:0;background:${BROWN}"></div><div class="abs" style="left:18%;top:16%;width:64%;height:64%">${cup({ k: 0, sw: 9, id: 'i' })}</div>` });
const logo = sc => ({ w: 160 * sc, h: 50 * sc, html: `<div class="abs" style="left:0;top:${12 * sc}px;width:${26 * sc}px;height:${26 * sc}px">${cup({ k: 0, sw: 8, id: 'l' })}</div>
  <p class="abs" style="left:${36 * sc}px;top:${17 * sc}px;font:600 ${15 * sc}px/1 M;letter-spacing:.42em;color:${CREAM}">REFILL</p>` });

(async () => {
  const b = await chromium.launch();
  const shoot = async (name, { w, h, html }) => {
    const p = await b.newPage({ viewport: { width: Math.round(w), height: Math.round(h) } });
    await p.setContent(`<!doctype html><html><head><style>:root{--w:${w}px;--h:${h}px}${CSS}</style></head><body>${html}</body></html>`);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120);
    await p.screenshot({ path: path.join(OUT, name), omitBackground: true }); await p.close();
  };
  for (const [sc, suf] of [[1, ''], [2, '@2x'], [3, '@3x']]) {
    await shoot(`icon${suf}.png`, icon(sc));
    await shoot(`logo${suf}.png`, logo(sc));
    for (const st of ['making', 'ready', 'done']) await shoot(`order-${st}${suf}.png`, orderStrip(st, sc));
    for (let n = 0; n <= 5; n++) await shoot(`card-${n}${suf}.png`, cardStrip(n, sc));
  }
  await b.close();
  // keep passes light: 256-colour PNGs (Wallet downloads these on every update)
  require('child_process').execFileSync('python3', ['-I', '-c', `
import glob
from PIL import Image
for f in glob.glob(${JSON.stringify(OUT)} + '/*.png'):
    im = Image.open(f).convert('RGBA')
    im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(f, optimize=True)
`]);
  console.log('wallet artwork:', fs.readdirSync(OUT).length, 'files in', OUT);
})();
