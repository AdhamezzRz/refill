// Renders the Google Business Profile images: node google-business/tools/render.js
// cover-1920x1080.png  (cover photo; everything sits in the centre square so Google's crops stay safe)
// post-opening-1200x900.png  (image for the first "Opening soon" update)
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const fs = require('fs');
const FONTDIR = path.resolve(ROOT, '../website/public/assets/fonts');
const font = f => 'data:font/woff2;base64,' + fs.readFileSync(path.join(FONTDIR, f)).toString('base64');
const C = { plaster: '#F3EFE6', espresso: '#352317', muted: 'rgba(53,35,23,.6)' };

const mark = (color, w) => `<svg width="${w}" height="${w}" viewBox="0 0 100 100" style="overflow:visible">
  <g fill="none" stroke="${color}" stroke-width="6.72">
    <path d="M6.2 3.36H93.8"/><path d="M13.36 55.52V23.68H86.64V55.52A36.64 36.64 0 0 1 13.36 55.52Z"/></g></svg>`;

const base = (bg, fg, body) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:M;src:url(${font('montserrat-latin.woff2')}) format('woff2');font-weight:200 700}
@font-face{font-family:A;src:url(${font('alexandria-arabic.woff2')}) format('woff2');font-weight:300 600}
@font-face{font-family:I;src:url(${font('inter-latin.woff2')}) format('woff2');font-weight:400 600}
*{margin:0;box-sizing:border-box}html,body{width:100%;height:100%;background:${bg};color:${fg}}
body{display:grid;place-items:center;font-family:M}
.lock{display:grid;justify-items:center}
.word{font:600 var(--ws) M;letter-spacing:.6em;margin-right:-.6em}
.sub{font:500 var(--ss) M;letter-spacing:.42em;margin-right:-.42em;text-transform:uppercase;opacity:.62}
</style></head><body>${body}</body></html>`;

const cover = base(C.plaster, C.espresso, `
  <div class="lock" style="--ws:62px;--ss:15px">
    ${mark(C.espresso, 150)}
    <p class="word" style="margin-top:60px">REFILL</p>
    <p class="sub" style="margin-top:22px">Specialty coffee</p>
    <p style="margin-top:64px;font:400 17px I;letter-spacing:.02em;opacity:.7">El Shorouk · New Cairo</p>
  </div>`);

const post = base(C.espresso, C.plaster, `
  <div class="lock" style="--ws:30px;--ss:10px;text-align:center">
    ${mark(C.plaster, 84)}
    <p class="word" style="margin-top:34px">REFILL</p>
    <p class="sub" style="margin-top:14px">Specialty coffee</p>
    <h1 style="margin-top:76px;font:300 74px/1 M;letter-spacing:-.04em">Opening soon<br>in El Shorouk.</h1>
    <p style="margin-top:30px;font:300 34px A" dir="rtl" lang="ar">قريباً في الشروق</p>
    <p style="margin-top:44px;font:500 13px M;letter-spacing:.3em;text-transform:uppercase;opacity:.6">Coffee · Bakehouse · Pizza soon</p>
  </div>`);

(async () => {
  const b = await chromium.launch();
  for (const [name, html, w, h] of [['cover-1920x1080', cover, 1920, 1080], ['post-opening-1200x900', post, 1200, 900]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(html, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(ROOT, 'png', name + '.png') });
    console.log('wrote', name);
  }
  await b.close();
})();
