// REFILL · soft opening (1 Dec 2026) Instagram posts. 1080 × 1350 (4:5); type sits inside the 3:4 safe area.
//   node campaign/05-soft-opening/tools/build.js            → out/*.jpg
//   node campaign/05-soft-opening/tools/build.js overlay    → also out/work/layer-*.png (type layers for the reel; see tools/reel.sh)
// Identity: Montserrat Bold capitals, small and scattered around the subject; brown #653d26, caramel #c7ad91, grey #8e847e, cream #f2e9db.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'out');
const b64 = (f, m) => `data:${m};base64,` + fs.readFileSync(f).toString('base64');
const MONT = b64(path.resolve(ROOT, '../../website/public/assets/fonts/montserrat-latin.woff2'), 'font/woff2');
const img = f => b64(path.join(ROOT, 'src', f), 'image/jpeg');
const BROWN = '#653d26', CREAM = '#f2e9db';

const CSS = `@font-face{font-family:M;src:url(${MONT}) format('woff2');font-weight:200 700}
*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1350px;overflow:hidden;background:transparent}
body{position:relative;font-family:M;-webkit-font-smoothing:antialiased}
.ph{position:absolute;left:0;width:1080px}
.t{position:absolute;font:700 46px/1.12 M;letter-spacing:.035em;text-transform:uppercase;white-space:nowrap}
.c{transform:translate(-50%,-50%);text-align:center}.l{transform:translateY(-50%)}.r{transform:translate(-100%,-50%);text-align:right}
.s{position:absolute;font:700 21px/1 M;letter-spacing:.2em;text-transform:uppercase;white-space:nowrap}`;
const T = (x, y, html, cls = 'c', color = CREAM, extra = '') => `<p class="t ${cls}" style="left:${x}px;top:${y}px;color:${color};${extra}">${html}</p>`;
const S = (pos, html, color = CREAM) => `<p class="s" style="${pos};color:${color}">${html}</p>`;

// the photos are 3:4 (1080 × 1446 at this width); `top` chooses which 1350 px to show
const photo = (f, top) => `<img class="ph" src="${img(f)}" style="top:${-top}px">`;

/* 01 · countdown: five cups, laid out like the five on a dice. One gets finished every day; on 1 Dec they are all empty and we refill. */
const countdownType = n => `
  ${T(520, 214, `${n} ${n === 1 ? 'day' : 'days'}<br>left`)}
  ${T(190, 666, 'One cup<br>a day')}
  ${T(890, 640, 'Then we<br>refill')}
  ${T(520, 1118, 'Soft<br>opening<br>01.12')}`;
const posts = {
  '01-countdown-5-days': photo('five-cups.jpg', 48) + countdownType(5),
  /* 02 · menu hint: the matcha bar */
  '02-not-everything-is-coffee': photo('matcha-pour.jpg', 24) +
    T(96, 190, 'Not', 'l', BROWN) + T(96, 446, 'Everything', 'l', BROWN) + T(984, 1150, 'Is coffee', 'r', BROWN) +
    S('left:96px;bottom:70px', 'Matcha bar', BROWN) + S('right:96px;bottom:70px', '01.12', BROWN),
  /* 03 · menu hint: one croissant, four fillings, a label in each corner like the identity's poster */
  '03-pick-a-corner': photo('four-croissants.jpg', 44) +
    S('left:96px;top:70px', 'Cheese') + S('right:96px;top:70px', 'Berry') + S('left:96px;bottom:70px', 'Almond') + S('right:96px;bottom:70px', 'Chocolate') +
    T(540, 668, 'Pick<br>a corner'),
};

(async () => {
  fs.mkdirSync(path.join(OUT, 'work'), { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const shoot = async (html, file, opts) => { await p.setContent(`<!doctype html><html><head><style>${CSS}</style></head><body>${html}</body></html>`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150); await p.screenshot({ path: file, ...opts }); };
  for (const [name, html] of Object.entries(posts)) { await shoot(html, path.join(OUT, name + '.jpg'), { type: 'jpeg', quality: 95 }); console.log('rendered', name); }
  if (process.argv[2] === 'overlay') {   // type layers for the reel: a = on from the start, b/c/d = appear once the cup is gone
    const layers = { a: T(520, 214, '5 days<br>left') + T(190, 666, 'One cup<br>a day'), b: T(890, 640, 'Then we<br>refill'),
      c: T(520, 652, '01.12', 'c', CREAM, 'font-size:64px'), d: T(520, 1118, 'Soft<br>opening') };
    for (const [k, html] of Object.entries(layers)) await shoot(html, path.join(OUT, 'work', `layer-${k}.png`), { omitBackground: true });
  }
  await b.close();
})();
