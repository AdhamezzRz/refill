// REFILL · December 2026 posts and carousels.
// node campaign/04-december/tools/build.js   → renders every slide to campaign/04-december/out/<post>/NN.jpg (1080×1350, Instagram 4:5)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = 'file://' + path.join(ROOT, 'src') + '/';
const FONTS = 'file://' + path.resolve(ROOT, '../../website/public/assets/fonts') + '/';
const MENU = 'file://' + path.resolve(ROOT, '../../website/public/assets/menu') + '/';
const OUT = path.join(ROOT, 'out');

/* ---------- brand pieces ---------- */
const CUP = (stroke = 'currentColor', sw = 6.72, fill = 'none') =>
  `<svg viewBox="0 0 100 100" style="overflow:visible"><g fill="${fill}" stroke="${stroke}" stroke-width="${sw}"><path d="M6.2 3.36H93.8"/><path d="M13.36 55.52V23.68H86.64V55.52A36.64 36.64 0 0 1 13.36 55.52Z"/></g></svg>`;
// cup that is filled to `k` (0..1) with `liquid`
const CUP_FILL = (k, ink, liquid, sw = 5) => {
  const top = 27.04, bottom = 88.8, y = bottom - (bottom - top) * k;
  return `<svg viewBox="0 0 100 100" style="overflow:visible"><defs><clipPath id="c${Math.round(k * 100)}"><path d="M16.72 55.52V27.04H83.28V55.52A33.28 33.28 0 0 1 16.72 55.52Z"/></clipPath></defs>
  <g clip-path="url(#c${Math.round(k * 100)})"><rect x="0" y="${y}" width="100" height="${100 - y}" fill="${liquid}"/>${k > 0 && k < 1 ? `<path d="M0 ${y} Q25 ${y - 1.6} 50 ${y} T100 ${y}" fill="none" stroke="#C9A27A" stroke-width="1.2" opacity=".8"/>` : ''}</g>
  <g fill="none" stroke="${ink}" stroke-width="${sw}"><path d="M6.2 3.36H93.8"/><path d="M13.36 55.52V23.68H86.64V55.52A36.64 36.64 0 0 1 13.36 55.52Z"/></g></svg>`;
};
const LOCK = (color) => `<div class="lock" style="color:${color}"><i>${CUP()}</i><span>REFILL</span></div>`;

const GRAIN = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
const CSS = `
@font-face{font-family:M;src:url(${FONTS}montserrat-latin.woff2) format('woff2');font-weight:200 700}
@font-face{font-family:I;src:url(${FONTS}inter-latin.woff2) format('woff2');font-weight:400 600}
@font-face{font-family:A;src:url(${FONTS}alexandria-arabic.woff2) format('woff2');font-weight:300 600}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:var(--w);height:var(--h);overflow:hidden}
body{font-family:M;color:#352317;background:#F3EFE6;-webkit-font-smoothing:antialiased;position:relative}
.full{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ar{font-family:A;font-weight:300;letter-spacing:0;direction:rtl}
.label{font:500 20px/1.2 M;letter-spacing:.24em;text-transform:uppercase}
.h{font-weight:300;letter-spacing:-.045em;line-height:.98}
.lock{display:flex;align-items:center;gap:14px}
.lock i{width:30px;height:30px;display:block}
.lock span{font:600 17px/1 M;letter-spacing:.6em;margin-right:-.6em}
.abs{position:absolute}
.swipe{display:flex;align-items:center;gap:12px;font:500 18px/1 M;letter-spacing:.22em;text-transform:uppercase}
.swipe::after{content:"";width:46px;height:1.5px;background:currentColor}
.shade-b{position:absolute;inset:0;background:linear-gradient(0deg,rgba(25,16,10,.72) 0%,rgba(25,16,10,.28) 38%,rgba(25,16,10,0) 60%)}
.shade-t{position:absolute;inset:0;background:linear-gradient(180deg,rgba(25,16,10,.55) 0%,rgba(25,16,10,0) 34%)}
.white{color:#FBF9F4}
.ink{color:#352317}
.finish{position:absolute;inset:0;pointer-events:none;z-index:50;background:url("data:image/svg+xml;utf8,${encodeURIComponent(GRAIN)}"),radial-gradient(120% 90% at 50% 45%,rgba(0,0,0,0) 60%,rgba(30,18,10,.18) 100%);mix-blend-mode:multiply;opacity:.55}
.pill{display:inline-flex;align-items:center;gap:10px;padding:12px 20px;border-radius:999px;font:500 17px/1 M;letter-spacing:.18em;text-transform:uppercase}
`;

const page = (w, h, body, extra = '') =>
  `<!doctype html><html><head><meta charset="utf-8"><style>:root{--w:${w}px;--h:${h}px}${CSS}${extra}</style></head><body>${body}<div class="finish"></div></body></html>`;

/* ---------- posts ---------- */
const posts = [];
const add = (id, slides) => posts.push({ id, slides });

/* 01 · Grand opening invitation (moves up to before opening day) */
const ticket = (w, pos) => `
  <div class="ticket" style="width:${w}px;${pos}">
    <div class="t-main">
      <p class="label" style="color:#A39077">You're invited · First drink on us</p>
      <h2 class="h" style="font-size:64px;margin-top:18px">For the first 20 guests<br>through the door.</h2>
      <p class="ar" style="font-size:30px;margin-top:20px;color:#7A6A5C">أول ٢٠ زائر… أول مشروب علينا</p>
    </div>
    <div class="t-stub"><span class="label" style="font-size:15px;color:#A39077">No.</span><b>01<br>—<br>20</b><i>${CUP('#352317', 7)}</i></div>
  </div>`;
const ticketCss = `
.ticket{position:absolute;left:50%;transform:translateX(-50%);display:grid;grid-template-columns:1fr 170px;background:#F3EFE6;color:#352317;border-radius:22px;box-shadow:0 30px 70px rgba(0,0,0,.35);
  -webkit-mask:radial-gradient(circle 22px at calc(100% - 170px) 0,#0000 98%,#000) top/100% 51% no-repeat,radial-gradient(circle 22px at calc(100% - 170px) 100%,#0000 98%,#000) bottom/100% 51% no-repeat}
.t-main{padding:44px 46px 42px}
.t-stub{border-left:3px dashed rgba(53,35,23,.25);display:grid;justify-items:center;align-content:center;gap:12px;padding:20px}
.t-stub b{font:300 44px/1 M;letter-spacing:-.03em;text-align:center}
.t-stub i{width:46px;height:46px;display:block;margin-top:8px}`;
add('01-grand-opening', [
  { html: page(1080, 1350, `
    <div class="abs" style="inset:0;background:linear-gradient(180deg,#0559a8 0%,#0873d6 100%)"></div><img class="abs" src="${SRC}facade-night.jpg" style="left:0;top:230px;width:1080px;height:1341px;object-fit:cover;-webkit-mask:linear-gradient(180deg,transparent 0,#000 160px)">
    <div class="shade-t" style="background:linear-gradient(180deg,rgba(14,18,30,.62) 0%,rgba(14,18,30,0) 36%)"></div>
    <div class="abs white" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between">${LOCK('#FBF9F4')}<span class="label" style="font-size:17px">El Shorouk</span></div>
    <div class="abs white" style="left:70px;top:150px">
      <p class="label">Thursday 3 December · 7:00 AM</p>
      <h1 class="h" style="font-size:108px;margin-top:18px">Grand opening.</h1>
    </div>
    ${ticket(940, 'bottom:70px')}`, ticketCss) },
]);
add('01-grand-opening-story', [
  { w: 1080, h: 1920, html: page(1080, 1920, `
    <div class="abs" style="inset:0;background:linear-gradient(180deg,#0559a8 0%,#0873d6 100%)"></div><img class="abs" src="${SRC}facade-night.jpg" style="left:-234px;top:330px;width:1548px;height:1922px;object-fit:cover;-webkit-mask:linear-gradient(180deg,transparent 0,#000 200px)">
    <div class="shade-t" style="background:linear-gradient(180deg,rgba(14,18,30,.7) 0%,rgba(14,18,30,0) 32%)"></div>
    <div class="abs white" style="left:80px;top:150px;right:80px">
      ${LOCK('#FBF9F4')}
      <p class="label" style="margin-top:56px">Thursday 3 December · 7:00 AM</p>
      <h1 class="h" style="font-size:112px;margin-top:18px">Grand opening.</h1>
      <p class="ar" style="font-size:38px;margin-top:18px;text-align:left">الافتتاح الخميس ٣ ديسمبر</p>
    </div>
    ${ticket(920, 'bottom:260px')}`, ticketCss) },
]);

/* 02 · Save us on Google Maps: the Refill cup is the map pin */
const mapSvg = `
<svg class="full" viewBox="0 0 1080 1350" preserveAspectRatio="xMidYMid slice">
  <rect width="1080" height="1350" fill="#ECE6DA"/>
  <g fill="#DCE3CF"><path d="M-20 980 C120 930 260 990 330 1080 C400 1170 360 1290 300 1380 L-20 1380Z"/><path d="M760 120 C840 90 960 110 1100 160 L1100 420 C980 450 860 410 800 340 C740 270 700 160 760 120Z"/><circle cx="560" cy="560" r="60"/></g>
  <g fill="none" stroke="#FBF9F4" stroke-linecap="round">
    <path d="M-40 420 C200 400 420 470 640 520 S940 560 1120 530" stroke-width="46"/>
    <path d="M300 -40 C320 200 360 420 420 640 S520 1060 560 1400" stroke-width="40"/>
    <path d="M-40 760 C240 760 520 820 760 900 S1000 990 1120 1000" stroke-width="30"/>
    <path d="M720 -40 C700 160 690 360 700 560" stroke-width="26"/>
    <path d="M100 120 L520 260 M560 300 L1100 260 M120 1180 L700 1150 M820 640 L1100 700 M160 560 L380 600" stroke-width="18"/>
  </g>
  <g fill="none" stroke="#E3DACB" stroke-width="2"><path d="M-40 420 C200 400 420 470 640 520 S940 560 1120 530"/><path d="M300 -40 C320 200 360 420 420 640 S520 1060 560 1400"/></g>
  <g font-family="M" font-weight="500" font-size="17" letter-spacing="5" fill="#A39077">
    <text x="760" y="250">EL SHOROUK</text><text x="70" y="1060">NEW CAIRO</text><text x="560" y="700" transform="rotate(68 560 700)">SUEZ ROAD</text>
  </g>
</svg>`;
add('02-save-us-on-maps', [
  { html: page(1080, 1350, `
    ${mapSvg}
    <div class="abs" style="left:420px;top:470px;width:120px;height:120px;border-radius:50%;background:rgba(53,35,23,.08);transform:translate(-50%,-50%) scale(2.6)"></div>
    <div class="abs" style="left:420px;top:470px;width:120px;height:120px;border-radius:50%;background:rgba(53,35,23,.12);transform:translate(-50%,-50%) scale(1.6)"></div>
    <div class="abs" style="left:420px;top:470px;transform:translate(-50%,-78%);width:120px;height:120px;color:#352317;filter:drop-shadow(0 12px 14px rgba(53,35,23,.35))">${CUP_FILL(1, '#352317', '#352317', 7)}</div>
    <div class="abs" style="left:500px;top:340px;background:#FBF9F4;border-radius:22px;padding:26px 30px;box-shadow:0 18px 40px rgba(53,35,23,.18);width:470px">
      <p style="font:500 30px/1.15 M;letter-spacing:-.01em">Refill Specialty Coffee</p>
      <p style="font:400 20px/1.4 I;color:#7A6A5C;margin-top:8px">Coffee shop · El Shorouk</p>
      <div style="display:flex;gap:10px;margin-top:20px">
        <span class="pill" style="background:#352317;color:#FBF9F4;font-size:15px;padding:12px 18px">${'<svg width="14" height="18" viewBox="0 0 14 18"><path d="M1 1h12v16l-6-4-6 4z" fill="#FBF9F4"/></svg>'} Save</span>
        <span class="pill" style="border:1.5px solid #352317;font-size:15px;padding:12px 18px">Directions</span>
      </div>
    </div>
    <div class="abs" style="left:70px;top:76px;right:70px">
      <p class="label" style="color:#7A6A5C">Save our location</p>
      <h1 class="h" style="font-size:86px;margin-top:20px">New favourite<br>coffee spot.</h1>
      <p class="ar" style="font-size:30px;margin-top:16px;color:#7A6A5C;text-align:left">احفظ اللوكيشن… وتعالى</p>
    </div>
    <img class="abs" src="${SRC}hand-cup.webp" style="right:-70px;bottom:-60px;width:640px;filter:drop-shadow(0 30px 40px rgba(53,35,23,.3))">
    <div class="abs" style="left:70px;bottom:70px">${LOCK('#352317')}</div>`) },
]);

/* 03 · Every relationship has a Refill story (panorama 1→2, then 3 stories) */
const storyText = (n, q, sub, ar) => `
  <div class="shade-b"></div>
  <div class="abs white" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><span class="label" style="font-size:17px">A Refill story</span>${LOCK('#FBF9F4')}</div>
  <div class="abs white" style="left:70px;right:70px;bottom:80px">
    <h2 class="h" style="font-size:66px;line-height:1.02">${q}</h2>
    <p style="font:400 26px/1.4 I;margin-top:22px;opacity:.9">${sub}</p>
    <p class="ar" style="font-size:28px;margin-top:12px;opacity:.85;text-align:left">${ar}</p>
  </div>`;
add('03-refill-stories', [
  { w: 2160, h: 1350, split: 2, html: page(2160, 1350, `
    <img class="abs" src="${SRC}story-friends.jpg" style="left:690px;top:0;width:1470px;height:1350px;object-fit:cover;object-position:46% 50%">
    <div class="abs" style="left:0;top:0;width:820px;height:1350px;background:#352317"></div>
    <div class="abs" style="left:820px;top:0;width:90px;height:1350px;background:linear-gradient(90deg,#352317,rgba(53,35,23,0))"></div>
    <div class="abs" style="left:70px;top:70px">${LOCK('#F3EFE6')}</div>
    <div class="abs" style="left:70px;top:330px;width:700px;color:#F3EFE6">
      <p class="label" style="color:#C9B49C">Coffee · People · Good days</p>
      <h1 class="h" style="font-size:100px;margin-top:28px">Every<br>relationship<br>has a Refill<br>story.</h1>
      <p class="ar" style="font-size:36px;margin-top:30px;color:#C9B49C;text-align:left">كل علاقة ليها حكاية في ريفيل</p>
    </div>
    <div class="abs swipe" style="left:70px;bottom:76px;color:#C9B49C">Swipe</div>
    <div class="shade-b" style="left:1080px;background:linear-gradient(0deg,rgba(25,16,10,.75) 0%,rgba(25,16,10,.25) 36%,rgba(25,16,10,0) 58%)"></div>
    <div class="abs white" style="left:1150px;top:70px"><span class="label" style="font-size:17px">A Refill story</span></div>
    <div class="abs white" style="left:1150px;right:70px;bottom:80px">
      <h2 class="h" style="font-size:66px;line-height:1.02">“Just a quick coffee.”<br>Three hours later.</h2>
      <p style="font:400 26px/1.4 I;margin-top:22px;opacity:.9">For the friends who never run out of things to say.</p>
      <p class="ar" style="font-size:28px;margin-top:12px;opacity:.85;text-align:left">قهوة سريعة؟ بعد ٣ ساعات…</p>
    </div>`) },
  { html: page(1080, 1350, `<img class="full" src="${SRC}story-couple.jpg" style="object-position:50% 35%">${storyText('03', 'Their love language?<br>Knowing each other’s order.', 'A little coffee, a lot of love.', 'بيحفظوا طلبات بعض')}`) },
  { html: page(1080, 1350, `<img class="full" src="${SRC}story-laptop.jpg" style="object-position:50% 40%">${storyText('04', 'Running on deadlines,<br>a flat white and hope.', 'Your work deserves a coffee break too.', 'ديدلاين، فلات وايت… وأمل')}`) },
  { html: page(1080, 1350, `<img class="full" src="${SRC}story-matcha.jpg" style="object-position:50% 40%">${storyText('05', 'Not waiting for anyone.<br>Just her matcha.', 'Because the best company can be yourself.', 'مش مستنية حد… مستنية الماتشا بتاعتها')}`) },
]);

/* 04 · Good mornings begin with good coffee */
add('04-good-mornings', [
  { html: page(1080, 1350, `
    <img class="abs" src="${SRC}morning-espresso.jpg" style="left:0;top:0;width:1080px;height:1000px;object-fit:cover;object-position:50% 55%">
    <div class="abs" style="left:0;right:0;bottom:0;height:350px;background:#F3EFE6;padding:56px 70px 0">
      <div style="display:flex;justify-content:space-between;align-items:center"><p class="label" style="color:#A39077">07:00 · El Shorouk</p>${LOCK('#352317')}</div>
      <h1 class="h" style="font-size:76px;margin-top:26px">Good mornings begin<br>with good coffee.</h1>
      <p class="ar" style="font-size:28px;margin-top:16px;color:#7A6A5C;text-align:left">الصبح الحلو بيبدأ بقهوة حلوة</p>
    </div>`) },
]);

/* 05 · Something to sip, something to bite (hand-drawn arrows) */
add('05-sip-and-bite', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}sip-bite.jpg" style="object-position:50% 70%">
    <div class="abs" style="left:0;right:0;top:0;height:420px;background:linear-gradient(180deg,rgba(243,239,230,.96) 0%,rgba(243,239,230,.85) 55%,rgba(243,239,230,0) 100%)"></div>
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label" style="color:#A39077">Your little break</p>${LOCK('#352317')}</div>
    <h1 class="abs h" style="left:70px;top:150px;font-size:84px">Something to sip.<br>Something to bite.</h1>
    <svg class="abs" style="left:0;top:0" width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" stroke="#352317" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M170 610 C140 690 180 770 290 830"/><path d="M262 822 L292 832 L284 800"/>
      <path d="M910 610 C950 700 910 780 790 840"/><path d="M820 846 L788 842 L800 812"/>
    </svg>
    <div class="abs" style="left:70px;top:500px;background:#F3EFE6;border-radius:18px;padding:16px 22px;font:500 28px/1.15 M;box-shadow:0 10px 30px rgba(53,35,23,.18)">Flat white<br><span style="font:400 18px I;color:#7A6A5C">something to sip</span></div>
    <div class="abs" style="right:70px;top:500px;text-align:right;background:#F3EFE6;border-radius:18px;padding:16px 22px;font:500 28px/1.15 M;box-shadow:0 10px 30px rgba(53,35,23,.18)">Butter croissant<br><span style="font:400 18px I;color:#7A6A5C">something to bite</span></div>
    <div class="abs white" style="left:70px;bottom:70px"><p class="ar" style="font-size:30px;text-align:left;text-shadow:0 2px 14px rgba(0,0,0,.4)">حاجة تشربها… وحاجة تاكلها</p></div>`) },
]);

/* 06 · Good coffee for everyone */
add('06-good-coffee-for-everyone', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}cups-pile.jpg">
    <div class="abs" style="left:50%;top:50%;transform:translate(-50%,-50%);background:#F3EFE6;border-radius:30px;padding:56px 64px;width:820px;box-shadow:0 30px 70px rgba(53,35,23,.25);text-align:center">
      <p class="label" style="color:#A39077">Whoever you are, whatever you order</p>
      <h1 class="h" style="font-size:96px;margin-top:22px">Good coffee<br>for everyone.</h1>
      <p class="ar" style="font-size:32px;margin-top:20px;color:#7A6A5C">قهوة حلوة للكل</p>
    </div>`) },
]);

const cover = (sw, sh, W = 1080, H = 1350) => { const k = Math.max(W / sw, H / sh); return { k, ox: (W - sw * k) / 2, oy: (H - sh * k) / 2 }; };
/* coaster artwork printed onto the blank coaster (multiply, so the board texture shows through) */
const COASTER = { cx: 1226 / 1792, cy: 1574 / 2240, r: 418 / 1792 };
const coasterPrint = (side, W = 1080, H = 1350) => {
  const m = cover(1856, 2304, W, H), cx = m.ox + 1354 * m.k, cy = m.oy + 1590 * m.k, r = 290 * m.k;
  const front = side === 'front';
  return `<div class="abs" style="left:${cx - r}px;top:${cy - r}px;width:${2 * r}px;height:${2 * r}px;border-radius:50%;display:grid;place-items:center;mix-blend-mode:multiply;color:#352317;transform:rotate(-8deg)">
    <div style="display:grid;justify-items:center;gap:${r * 0.1}px;opacity:.92">
      <i style="display:block;width:${r * 0.5}px;height:${r * 0.5}px">${front ? CUP('#352317', 6) : CUP_FILL(1, '#352317', '#352317', 6)}</i>
      <b style="font:600 ${r * 0.11}px/1 M;letter-spacing:.32em;margin-right:-.32em">${front ? 'STILL SIPPING' : 'REFILL ME'}</b>
      <span class="ar" style="font-size:${r * 0.12}px">${front ? 'لسه بشرب' : 'املاها تاني'}</span>
    </div></div>`;
};

/* 07 · Teaser: just the flip */
add('07-teaser-flip-it', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}coaster-empty.jpg">${coasterPrint('back')}
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><span></span>${LOCK('#352317')}</div>
    <h1 class="abs h" style="right:70px;top:300px;font-size:150px;text-align:right">Flip<br>it.</h1>
    <div class="abs" style="left:70px;bottom:70px"><p class="label">Monday.</p><p class="ar" style="font-size:30px;margin-top:10px;text-align:left">اقلبها… يوم الاتنين</p></div>`) },
]);

/* 08 · The Winter Refill (launch carousel): swipe = flip */
add('08-the-winter-refill', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}coaster-empty.jpg">${coasterPrint('front')}
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label">The Winter Refill</p>${LOCK('#352317')}</div>
    <h1 class="abs h" style="right:70px;top:270px;font-size:92px;text-align:right">Finished<br>your hot<br>chocolate?</h1>
    <div class="abs swipe" style="right:70px;top:640px">Flip</div>`) },
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}coaster-empty.jpg">${coasterPrint('back')}
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label">The Winter Refill</p>${LOCK('#352317')}</div>
    <h1 class="abs h" style="right:70px;top:270px;font-size:92px;text-align:right">Flip the<br>coaster.</h1>
    <p class="abs ar" style="right:70px;top:500px;font-size:32px">اقلب الكوستر</p>`) },
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}pour.jpg" style="object-position:50% 50%">
    <div class="shade-t"></div><div class="shade-b"></div>
    <div class="abs white" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label">The Winter Refill</p>${LOCK('#FBF9F4')}</div>
    <div class="abs white" style="left:70px;bottom:80px"><h1 class="h" style="font-size:100px">We bring<br>the pot.</h1><p class="ar" style="font-size:32px;margin-top:16px;text-align:left">وإحنا نملاها</p></div>`) },
  { html: page(1080, 1350, `
    <div class="abs" style="inset:0;background:#352317"></div>
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center;color:#C9B49C"><p class="label">The Winter Refill</p>${LOCK('#F3EFE6')}</div>
    <div class="abs" style="left:70px;right:70px;top:250px;color:#F3EFE6">
      <i style="display:block;width:150px;height:150px">${CUP_FILL(0.82, '#F3EFE6', '#8A5A3B', 5)}</i>
      <h1 class="h" style="font-size:118px;margin-top:60px">The Winter<br>Refill.</h1>
      <p class="ar" style="font-size:44px;margin-top:18px;color:#C9B49C;text-align:left">ريفيل الشتا</p>
      <p style="font:300 44px/1.15 M;letter-spacing:-.02em;margin-top:46px">Finish it. We’ll refill it.</p>
    </div>
    <div class="abs" style="left:70px;right:70px;bottom:70px;display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1.5px solid rgba(243,239,230,.25);color:#C9B49C">
      ${['Dine-in', 'Hot chocolate', 'One refill per cup', 'All winter'].map(t => `<p class="label" style="font-size:15px;padding-top:22px;line-height:1.4">${t}</p>`).join('')}
    </div>`) },
]);

/* 09 · The Winter Refill Pass: swipe = fill */
const passFront = (W = 1080) => {
  const m = cover(1856, 2304, W, 1350), w = 880 * m.k, h = 580 * m.k, x = m.ox + 704 * m.k - w / 2, y = m.oy + 1638 * m.k - h / 2;
  return `<div class="abs" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;padding:${h * 0.11}px ${w * 0.07}px;display:grid;grid-template-rows:auto 1fr auto;color:#F1E7DA;mix-blend-mode:screen;opacity:.9;transform:rotate(3.4deg)">
    <div style="display:flex;justify-content:space-between;align-items:center"><span style="font:600 ${h * 0.06}px/1 M;letter-spacing:.5em">REFILL</span><i style="width:${h * 0.12}px;height:${h * 0.12}px;display:block">${CUP('#F1E7DA', 8)}</i></div>
    <p style="align-self:end;font:300 ${h * 0.15}px/1 M;letter-spacing:-.03em"><span style="display:block;font:500 ${h * 0.055}px/1 M;letter-spacing:.26em;color:#D8C2A6;margin-bottom:${h * 0.05}px">WINTER 2026 · NO. 0247</span>The Winter<br>Refill Pass</p>
    <div style="display:flex;justify-content:space-between;font:400 ${h * 0.055}px/1 I;color:#D8C2A6;margin-top:${h * 0.06}px"><span>Five cups to full.</span><span class="ar">خمس كوبايات وتتملي</span></div>
  </div>`;
};
const fillSlide = (n, k, line, ar) => page(1080, 1350, `
  <div class="abs" style="inset:0;background:#352317"></div>
  <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center;color:#C9B49C"><p class="label">The Winter Refill Pass · Cup ${n}</p>${LOCK('#F3EFE6')}</div>
  <div class="abs" style="left:50%;top:230px;transform:translateX(-50%);width:520px;height:520px">${CUP_FILL(k, '#F3EFE6', '#8A5A3B', 4.2)}</div>
  <div class="abs" style="left:70px;right:70px;bottom:90px;color:#F3EFE6;text-align:center">
    <p style="font:200 150px/1 M;letter-spacing:-.05em;font-variant-numeric:tabular-nums">${Math.round(k * 100)}%</p>
    <p style="font:300 44px/1.15 M;letter-spacing:-.02em;margin-top:18px">${line}</p>
    <p class="ar" style="font-size:30px;margin-top:14px;color:#C9B49C">${ar}</p>
  </div>`);
add('09-winter-refill-pass', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}pass-flatlay.jpg">${passFront()}
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label">New at the bar</p>${LOCK('#352317')}</div>
    <h1 class="abs h" style="left:70px;top:170px;font-size:96px">Five cups<br>to full.</h1>
    <div class="abs swipe" style="left:70px;top:420px">Swipe to fill</div>`) },
  { html: fillSlide(1, 0.2, 'A good start.', 'بداية حلوة') },
  { html: fillSlide(2, 0.4, 'You’re a regular now.', 'بقيت من أهل المكان') },
  { html: fillSlide(3, 0.6, 'The barista knows your name.', 'الباريستا عارف اسمك') },
  { html: fillSlide(4, 0.8, 'One more. You can do it.', 'واحدة كمان… تقدر') },
  { html: fillSlide(5, 1, 'Fully refilled.', 'اتملت على الآخر') },
  { html: page(1080, 1350, `
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center;color:#A39077"><p class="label">The Winter Refill Pass</p>${LOCK('#352317')}</div>
    <div class="abs" style="left:70px;right:70px;top:300px">
      <p class="label" style="color:#A39077">Cup 6</p>
      <h1 class="h" style="font-size:150px;margin-top:22px">Is on us.</h1>
      <p class="ar" style="font-size:44px;margin-top:22px;color:#7A6A5C;text-align:left">السادسة علينا</p>
    </div>
    <div class="abs" style="left:70px;right:70px;bottom:70px;display:grid;grid-template-columns:repeat(3,1fr);border-top:1.5px solid rgba(53,35,23,.2);color:#7A6A5C">
      ${['Ask for your pass at the bar', 'One stamp per hot chocolate', 'Valid until end of February'].map(t => `<p style="font:400 22px/1.35 I;padding:22px 20px 0 0">${t}</p>`).join('')}
    </div>`) },
]);

/* 10 · What's your coffee personality? */
const persona = [
  ['p-spanish', 'Spanish latte', 'Sweet talker. Always iced.', '50% 50%', 1],
  ['p-caramel', 'Caramel latte', 'Main character. Extra drizzle.', '50% 50%', 1],
  ['p-cappuccino', 'Cappuccino', 'A classic. Owns one good coat.', '50% 50%', 1],
  ['p-flatwhite', 'Flat white', 'Quietly particular. Knows the bean.', '50% 50%', 1],
  ['p-hotchoc', 'Hot chocolate', 'Soft heart. Winter all year.', '50% 50%', 1],
  ['p-matcha', 'Iced matcha', 'Unbothered. Thriving.', '50% 50%', 1],
];
add('10-coffee-personality', [
  { html: page(1080, 1350, `
    <div class="abs" style="inset:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr)">
      ${persona.map(([f, n, l, pos, z]) => `<div style="position:relative;overflow:hidden">
        <img src="${SRC}${f}.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${pos};transform:scale(${z})">
        <div style="position:absolute;left:24px;bottom:22px;right:24px;background:rgba(251,249,244,.92);border-radius:16px;padding:14px 18px">
          <p style="font:500 22px/1.1 M">${n}</p><p style="font:400 16px/1.35 I;color:#7A6A5C;margin-top:4px">${l}</p></div></div>`).join('')}
    </div>
    <div class="abs" style="left:50%;top:50%;transform:translate(-50%,-50%);width:420px;height:420px;border-radius:50%;background:#352317;color:#F3EFE6;display:grid;place-items:center;text-align:center;box-shadow:0 24px 60px rgba(53,35,23,.35)">
      <div><p class="label" style="font-size:15px;color:#C9B49C">Be honest</p><h1 class="h" style="font-size:52px;margin-top:14px;line-height:1.02">What’s your<br>coffee<br>personality?</h1><p class="ar" style="font-size:26px;margin-top:12px;color:#C9B49C">إنت مين فيهم؟</p></div>
    </div>`) },
]);

/* 11 · What can you order at Refill? */
const ingSlide = (n, bg, cut, name, items, ar) => page(1080, 1350, `
  <img class="full" src="${SRC}${bg}.jpg">
  <div class="abs" style="inset:0;background:rgba(53,35,23,.18)"></div>
  ${items.map((t, i) => `<span class="abs pill" style="${i % 2 ? 'right' : 'left'}:40px;${i < 2 ? 'top' : 'bottom'}:40px;background:rgba(251,249,244,.94);color:#352317;font-size:15px">${t}</span>`).join('')}
  <div class="abs" style="left:50%;top:600px;transform:translate(-50%,-50%);width:560px;height:560px;border-radius:50%;background:#F3EFE6;box-shadow:0 30px 80px rgba(25,16,10,.4)"></div>
  <img class="abs" src="${cut}" style="left:50%;top:600px;transform:translate(-50%,-52%);width:${name === 'Butter croissant' ? 460 : 420}px;filter:drop-shadow(0 22px 22px rgba(53,35,23,.3))">
  <div class="abs" style="left:50%;top:930px;transform:translateX(-50%);text-align:center;width:520px;background:#F3EFE6;border-radius:24px;padding:26px 20px 24px;box-shadow:0 20px 50px rgba(25,16,10,.3)">
    <p class="label" style="font-size:14px;color:#A39077">What’s inside</p>
    <p style="font:400 40px/1.1 M;letter-spacing:-.02em;margin-top:10px">${name}</p>
    <p class="ar" style="font-size:24px;margin-top:6px;color:#7A6A5C">${ar}</p>
  </div>`);
add('11-what-can-you-order', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}lineup.jpg" style="object-position:50% 60%">
    <div class="abs" style="left:0;right:0;top:0;height:520px;background:linear-gradient(180deg,rgba(243,239,230,.96) 0%,rgba(243,239,230,.8) 55%,rgba(243,239,230,0) 100%)"></div>
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label" style="color:#A39077">The menu</p>${LOCK('#352317')}</div>
    <h1 class="abs h" style="left:70px;top:160px;font-size:92px">What can you<br>order at Refill?</h1>
    <p class="abs ar" style="left:70px;top:370px;font-size:30px;color:#7A6A5C">تطلب إيه من ريفيل؟</p>
    <div class="abs swipe white" style="right:70px;bottom:76px;text-shadow:0 2px 10px rgba(0,0,0,.3)">Swipe</div>`) },
  { html: ingSlide(2, 'ing-caramel', SRC + 'cut-caramel.webp', 'Caramel latte', ['Espresso', 'Steamed milk', 'Caramel sauce', 'Caramel syrup'], 'كراميل لاتيه') },
  { html: ingSlide(3, 'ing-hotchoc', SRC + 'cut-hotchoc.webp', 'Hot chocolate', ['Dark chocolate', 'Milk', 'Whipped cream', 'Cocoa powder'], 'هوت شوكليت') },
  { html: ingSlide(4, 'ing-croissant', SRC + 'cut-croissant.webp', 'Butter croissant', ['Flour', 'French butter', 'Milk', 'Yeast'], 'كرواسون بالزبدة') },
  { html: page(1080, 1350, `
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label" style="color:#A39077">The menu</p>${LOCK('#352317')}</div>
    <h1 class="abs h" style="left:70px;top:200px;font-size:110px">And a lot<br>more.</h1>
    <p class="abs ar" style="left:70px;top:450px;font-size:32px;color:#7A6A5C">ولسه في كتير</p>
    <div class="abs" style="left:40px;right:40px;top:560px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      ${['flatwhite', 'cruffin', 'plaster', 'cheesecake', 'spanish', 'cardamom'].map(f => `<img src="${MENU}${f}.webp" style="width:100%;filter:drop-shadow(0 16px 16px rgba(53,35,23,.22))">`).join('')}
    </div>
    <div class="abs" style="left:70px;right:70px;bottom:70px;display:flex;justify-content:space-between;border-top:1.5px solid rgba(53,35,23,.2);padding-top:22px"><p class="label" style="font-size:17px">Full menu · link in bio</p><p class="label" style="font-size:17px;color:#A39077">Coffee · Bakehouse · Kitchen</p></div>`) },
]);

/* 12 · The longest night (21 December) */
add('12-longest-night', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}night-bar.jpg">
    <div class="shade-t" style="background:linear-gradient(180deg,rgba(10,10,20,.66) 0%,rgba(10,10,20,0) 40%)"></div><div class="shade-b" style="background:linear-gradient(0deg,rgba(18,11,7,.92) 0%,rgba(18,11,7,.6) 34%,rgba(18,11,7,0) 58%)"></div>
    <div class="abs white" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label">Monday 21 December</p>${LOCK('#FBF9F4')}</div>
    <h1 class="abs h white" style="left:70px;top:170px;font-size:92px">The longest night<br>of the year.</h1>
    <div class="abs white" style="left:70px;right:70px;bottom:80px">
      <p style="font:300 60px/1.05 M;letter-spacing:-.03em">Deserves the<br>longest refill.</p>
      <p style="font:400 24px/1.45 I;margin-top:22px;opacity:.9">Hot chocolate refills all evening, from sunset to close.</p>
      <p class="ar" style="font-size:28px;margin-top:10px;opacity:.85;text-align:left">أطول ليلة في السنة… وأطول ريفيل</p>
    </div>`) },
]);

/* 13 · The Hot Chocolate Atelier */
add('13-hot-chocolate-atelier', [
  { html: page(1080, 1350, `
    <img class="abs" src="${SRC}atelier.jpg" style="left:0;top:390px;width:1080px;height:960px;object-fit:cover;object-position:50% 55%">
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label" style="color:#A39077">The Hot Chocolate Atelier</p>${LOCK('#352317')}</div>
    <h1 class="abs h" style="left:70px;top:150px;font-size:82px">Build it. Name it.<br>We write it on your cup.</h1>
    <div class="abs" style="left:70px;right:70px;top:338px;display:flex;gap:28px;font:500 17px/1 M;letter-spacing:.16em;text-transform:uppercase;color:#7A6A5C">
      <span>1 · Chocolate</span><span>2 · Milk</span><span>3 · Finish</span><span style="color:#352317">4 · Your name for it</span>
    </div>
    <div class="abs" style="right:40px;bottom:40px;background:#F3EFE6;border-radius:18px;padding:20px 24px;max-width:430px">
      <p style="font:400 20px/1.4 I;color:#352317">Best name of the week wins a full Winter Refill Pass.</p>
      <p class="ar" style="font-size:22px;margin-top:6px;color:#7A6A5C">سمّيها… وأحلى اسم يكسب</p>
    </div>`) },
]);

/* 14 · Refill notes (Christmas Day) */
const noteSlide = (n, en, ar, win) => page(1080, 1350, `
  <div class="abs" style="inset:0;background:#352317"></div>
  <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center;color:#C9B49C"><p class="label">Refill note · No. ${n}</p>${LOCK('#F3EFE6')}</div>
  <div class="abs" style="left:50%;top:50%;transform:translate(-50%,-50%) rotate(-3deg);width:880px;background:#F6EFE3;padding:70px 64px;box-shadow:0 30px 70px rgba(0,0,0,.4);border-radius:4px">
    ${win ? '<p class="label" style="color:#5C6050;font-size:17px;margin-bottom:24px">★ Winner</p>' : ''}
    <p style="font:300 64px/1.08 M;letter-spacing:-.03em;color:#352317">${en}</p>
    <p class="ar" style="font-size:36px;margin-top:26px;color:#7A6A5C;text-align:left">${ar}</p>
  </div>
  <p class="abs label" style="left:70px;bottom:70px;color:#C9B49C;font-size:17px">A little fortune. A lot of chocolate.</p>`);
add('14-refill-notes', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}note.jpg" style="object-position:50% 60%">
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label" style="color:#7A6A5C">25 December · Refill notes</p>${LOCK('#352317')}</div>
    <h1 class="abs h" style="left:70px;top:160px;font-size:90px">Every cup<br>comes with<br>a note.</h1>
    <div class="abs swipe" style="left:70px;top:500px;color:#7A6A5C">Read a few</div>`) },
  { html: noteSlide('03', 'Today is a<br>two-cup kind of day.', 'النهارده يوم كوبايتين.') },
  { html: noteSlide('11', 'Text them first.', 'ابعتله إنت الأول.') },
  { html: noteSlide('17', 'Someone in this room<br>likes your sweater.', 'في حد هنا عاجبه البلوفر بتاعك.') },
  { html: noteSlide('20', 'This one’s on us.<br>Show this note at the bar.', 'دي علينا. ورّي الورقة دي للباريستا.', true) },
  { html: page(1080, 1350, `
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label" style="color:#A39077">Refill notes</p>${LOCK('#352317')}</div>
    <div class="abs" style="left:70px;right:70px;top:320px">
      <h1 class="h" style="font-size:132px">What did<br>yours say?</h1>
      <p class="ar" style="font-size:40px;margin-top:22px;color:#7A6A5C;text-align:left">ورقتك قالت إيه؟</p>
    </div>
    <div class="abs" style="left:70px;right:70px;bottom:70px;border-top:1.5px solid rgba(53,35,23,.2);padding-top:22px;display:flex;justify-content:space-between"><p class="label" style="font-size:17px">Tag us · #RefillElShorouk</p><p class="label" style="font-size:17px;color:#A39077">1 in 20 wins</p></div>`) },
]);

/* 15 · The last refill of 2026 */
add('15-last-refill-of-2026', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}nye.jpg" style="object-position:50% 50%">
    <div class="shade-t" style="background:linear-gradient(180deg,rgba(10,10,20,.6) 0%,rgba(10,10,20,0) 38%)"></div><div class="shade-b"></div>
    <div class="abs white" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label">31 December</p>${LOCK('#FBF9F4')}</div>
    <div class="abs white" style="left:70px;right:70px;bottom:80px">
      <h1 class="h" style="font-size:104px">The last refill<br>of 2026.</h1>
      <p style="font:400 26px/1.45 I;margin-top:22px;opacity:.92">See you in 2027 with a full cup.</p>
      <p class="ar" style="font-size:30px;margin-top:10px;opacity:.85;text-align:left">آخر ريفيل في ٢٠٢٦… نشوفكم في ٢٠٢٧ بكوباية مليانة</p>
    </div>`) },
]);


/* =====================================================================
   NEW · five pieces with no faces (hands at most)
   ===================================================================== */
const TOOLFONTS = 'file://' + path.join(__dirname, 'fonts') + '/';
const MONO = `@font-face{font-family:C;src:url(${TOOLFONTS}courier-prime-1.woff2) format('woff2');font-weight:400}
@font-face{font-family:C;src:url(${TOOLFONTS}courier-prime-2.woff2) format('woff2');font-weight:700}`;

/* 16 · The receipt: a real thermal receipt in a real hand */
const rcpt = (l, r = '', b = false) => `<div class="rr${b ? ' b' : ''}"><span>${l}</span><span>${r}</span></div>`;
const receiptCss = MONO + `
.rc{position:absolute;font:400 18px/1.5 C;color:#262321;mix-blend-mode:multiply;opacity:.9;filter:blur(.25px);letter-spacing:.02em}
.rr{display:flex;justify-content:space-between;gap:10px}.rr.b{font-weight:700}
.rc hr{border:0;border-top:2px dashed #262321;margin:10px 0;opacity:.75}
.rc .c{text-align:center}
.bars{height:46px;margin:14px 10px 0;background:repeating-linear-gradient(90deg,#262321 0 2px,transparent 2px 4px,#262321 4px 7px,transparent 7px 9px,#262321 9px 10px,transparent 10px 14px)}`;
{
  const m = cover(1856, 2304), z = 1.6, k = m.k * z;
  const left = 540 - 930 * k, top = 60 - 420 * k;
  const rx = 516 - 175, rw = 350;
  add('16-the-receipt', [
    { html: page(1080, 1350, `
      <img class="abs" src="${SRC}receipt-hand.jpg" style="left:${left}px;top:${top}px;width:${1856 * k}px;height:${2304 * k}px">
      <div class="rc" style="left:${rx}px;top:215px;width:${rw}px;transform:rotate(.7deg)">
        <div class="c"><i style="display:inline-block;width:40px;height:40px">${CUP('#262321', 8)}</i></div>
        <p class="c" style="font-weight:700;letter-spacing:.5em;margin:6px 0 0 .5em">REFILL</p>
        <p class="c" style="font-size:15px">SPECIALTY COFFEE · EL SHOROUK</p>
        <hr>${rcpt('TABLE 04', 'SAT 08:41')}${rcpt('ORDER', '#0001')}<hr>
        ${rcpt('1 FLAT WHITE', '135')}${rcpt('1 BUTTER CROISSANT', '95')}${rcpt('1 WINDOW SEAT', 'FREE')}
        ${rcpt('1 "JUST 5 MINUTES"', '3 HRS')}${rcpt('1 BAD MOOD', 'REMOVED')}${rcpt('1 REFILL', 'YES')}<hr>
        ${rcpt('TOTAL', '230 EGP', true)}${rcpt('CHANGE', 'A BETTER DAY')}<hr>
        <p class="c">THANK YOU. COME BACK HUNGRY.</p>
        <p class="c ar" style="font-family:A;font-size:20px;direction:rtl">شكراً… ونورتنا</p>
        <div class="bars"></div>
      </div>`, receiptCss) },
  ]);
}

/* 17 · Anatomy of a butter croissant */
const callout = (x, y, lx, ly, title, sub, align = 'left') => `
  <svg class="abs" style="left:0;top:0;z-index:3" width="1080" height="1350"><g fill="none" stroke="#FBF9F4" stroke-width="2"><path d="M${lx} ${ly + 16} L${lx} ${ly + 40} L${x} ${y}"/></g><circle cx="${x}" cy="${y}" r="7" fill="#FBF9F4"/><circle cx="${x}" cy="${y}" r="14" fill="none" stroke="#FBF9F4" stroke-width="1.5" opacity=".6"/></svg>
  <div class="abs white" style="${align === 'left' ? 'left' : 'right'}:${align === 'left' ? lx - 4 : 1080 - lx - 4}px;top:${ly - 74}px;text-align:${align};z-index:4;width:260px">
    <p style="font:500 24px/1.15 M">${title}</p><p style="font:400 17px/1.35 I;opacity:.8;margin-top:4px">${sub}</p></div>`;
add('17-anatomy-of-a-croissant', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}croissant-tear.jpg">
    <div class="shade-t"></div><div class="shade-b"></div>
    <div class="abs white" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label">Anatomy of a croissant</p>${LOCK('#FBF9F4')}</div>
    <div class="abs white" style="left:70px;right:70px;bottom:80px"><h1 class="h" style="font-size:104px">We tore one open.<br>For science.</h1><p class="ar" style="font-size:30px;margin-top:16px;text-align:left">فتحناها… للعلم</p></div>`) },
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}croissant-cut.jpg" style="transform:scale(1.04)">
    <div class="abs" style="left:0;right:0;top:0;height:380px;background:linear-gradient(180deg,rgba(28,18,11,.75),rgba(28,18,11,0))"></div>
    <div class="abs white" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label">Butter croissant, cross-section</p>${LOCK('#FBF9F4')}</div>
    ${callout(330, 560, 90, 300, 'Shattered crust', 'Deep gold, glossy, loud.')}
    ${callout(470, 790, 380, 300, 'Open honeycomb', 'Air where the butter melted.')}
    ${callout(800, 700, 990, 300, 'Thin buttery layers', 'Folded by hand, not by machine.', 'right')}
    <div class="abs white" style="left:70px;bottom:70px;right:70px;display:flex;justify-content:space-between;align-items:end">
      <p style="font:300 44px/1.08 M;letter-spacing:-.02em">Three days<br>from dough to oven.</p><p class="label" style="font-size:16px;opacity:.85">Crumbs included</p></div>`) },
  { html: page(1080, 1350, `
    <img class="abs" src="${SRC}croissant-lamination.jpg" style="left:0;top:0;width:1080px;height:960px;object-fit:cover;object-position:50% 40%">
    <div class="abs" style="left:0;right:0;bottom:0;height:390px;background:#F3EFE6;padding:54px 70px 0">
      <div style="display:flex;justify-content:space-between;align-items:center"><p class="label" style="color:#A39077">How it's made</p>${LOCK('#352317')}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:34px">
        ${[['Day 1', 'The dough is mixed and rests overnight.'], ['Day 2', 'Cold butter is folded in by hand, three turns.'], ['Day 3', 'Shaped, proofed and baked at dawn.']].map(([d, t]) => `<div style="border-top:1.5px solid #352317;padding-top:16px"><p style="font:300 46px/1 M;letter-spacing:-.03em">${d}</p><p style="font:400 20px/1.4 I;color:#7A6A5C;margin-top:12px">${t}</p></div>`).join('')}
      </div></div>`) },
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}croissant-tray.jpg">
    <div class="abs" style="left:0;right:0;bottom:0;height:520px;background:linear-gradient(0deg,rgba(28,18,11,.82),rgba(28,18,11,0))"></div>
    <div class="abs white" style="left:70px;top:70px">${LOCK('#FBF9F4')}</div>
    <div class="abs white" style="left:70px;right:70px;bottom:80px"><p class="label" style="opacity:.85">11:00 at the bakehouse</p><h1 class="h" style="font-size:88px;margin-top:18px">This is usually<br>all that's left.</h1><p class="ar" style="font-size:30px;margin-top:16px;text-align:left">الساعة ١١… ده اللي بيفضل</p></div>`) },
  { html: page(1080, 1350, `
    <div class="abs" style="left:70px;top:70px;right:70px;display:flex;justify-content:space-between;align-items:center"><p class="label" style="color:#A39077">Butter croissant</p>${LOCK('#352317')}</div>
    <img class="abs" src="${MENU}croissant.webp" style="left:50%;top:150px;transform:translateX(-50%) rotate(-8deg);width:700px;filter:drop-shadow(0 30px 30px rgba(53,35,23,.28))">
    <div class="abs" style="left:70px;right:70px;bottom:70px">
      <h1 class="h" style="font-size:110px">Come early.</h1>
      <p style="font:400 26px/1.45 I;color:#7A6A5C;margin-top:18px">Out of the oven at 07:00 and again at 19:00. Save this for your next visit.</p>
      <p class="ar" style="font-size:30px;margin-top:10px;color:#7A6A5C;text-align:left">تعالى بدري… واحفظ البوست</p>
    </div>`) },
]);

/* 18 · Notifications from your coffee (lock screen) */
const lockCss = `
.ls-date{font:500 30px/1 I;color:#FBF9F4;text-align:center;letter-spacing:.01em;text-shadow:0 2px 20px rgba(0,0,0,.25)}
.ls-time{font:600 190px/1 I;color:#FBF9F4;text-align:center;letter-spacing:-.04em;margin-top:6px;text-shadow:0 4px 30px rgba(0,0,0,.25)}
.nt{background:rgba(246,241,233,.62);-webkit-backdrop-filter:blur(28px) saturate(1.4);backdrop-filter:blur(28px) saturate(1.4);border-radius:34px;padding:22px 26px;display:grid;grid-template-columns:74px 1fr;gap:18px;align-items:center;box-shadow:0 10px 40px rgba(0,0,0,.12)}
.nt + .nt{margin-top:12px}
.nt .ic{width:74px;height:74px;border-radius:18px;background:#352317;display:grid;place-items:center}
.nt .ic i{width:42px;height:42px;display:block}
.nt .hd{display:flex;justify-content:space-between;font:600 24px/1.2 I;color:#1d1813}
.nt .hd span{font-weight:400;color:#5a5048}
.nt .bd{font:400 25px/1.32 I;color:#1d1813;margin-top:4px}`;
const notif = (when, body) => `<div class="nt"><div class="ic"><i>${CUP('#F3EFE6', 9)}</i></div><div><div class="hd">Refill<span>${when}</span></div><div class="bd">${body}</div></div></div>`;
const lock = (img, date, time, notes, top = 470, tint = .25, z = 1) => page(1080, 1350, `
  <img class="full" src="${SRC}${img}.jpg" style="transform:scale(${z})">
  <div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,${tint}) 0%,rgba(0,0,0,0) 40%)"></div>
  <div class="abs" style="left:0;right:0;top:110px"><p class="ls-date">${date}</p><p class="ls-time">${time}</p></div>
  <div class="abs" style="left:50px;right:50px;top:${top}px">${notes}</div>
  <div class="abs" style="left:50%;bottom:26px;transform:translateX(-50%);width:200px;height:7px;border-radius:7px;background:rgba(251,249,244,.85)"></div>`, lockCss);
add('18-texts-from-your-coffee', [
  { html: lock('notif-sunrise', 'Monday 7 December', '07:02', notif('now', 'Good morning. I’m warm and ready when you are ☕') + notif('1m ago', 'P.S. the croissants just came out.'), 470, .35) },
  { html: lock('notif-empty', 'Wednesday 16 December', '15:10', notif('now', 'You left me empty 3 hours ago.') + notif('now', 'Flip the coaster. I’ll get refilled 🤎'), 430, .2) },
  { html: lock('notif-rain', 'Thursday 17 December', '17:48', notif('now', 'It’s raining. You know what that means.') + notif('now', 'Hot chocolate refills, all winter.'), 470, .25, 1.06) },
  { html: lock('notif-night', 'Sunday 20 December', '23:31', notif('now', 'Last refill of the day in 29 minutes.') + notif('now', 'Not that I’m counting.'), 470, .1) },
]);

/* 19 · Cover for the latte-art reel */
add('19-reel-cover-our-logo-poured', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}latte-logo.jpg" style="object-position:50% 50%">
    <div class="shade-t"></div>
    <div class="abs white" style="left:70px;top:70px;right:70px"><p class="label">Watch closely</p><h1 class="h" style="font-size:84px;margin-top:16px">We poured<br>our logo.</h1></div>`) },
]);

/* ---------- render ---------- */
(async () => {
  const only = process.argv[2];
  const b = await chromium.launch();
  const tmp = path.join(require('os').tmpdir(), 'refill-dec-html'); fs.mkdirSync(tmp, { recursive: true });
  for (const post of posts) {
    if (only && !post.id.startsWith(only)) continue;
    const dir = path.join(OUT, post.id); fs.mkdirSync(dir, { recursive: true });
    let n = 1;
    for (const s of post.slides) {
      const w = s.w || 1080, h = s.h || 1350;
      const file = path.join(tmp, `${post.id}-${n}.html`); fs.writeFileSync(file, s.html);
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto('file://' + file, { waitUntil: 'load' });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(150);
      if (s.split) {
        for (let k = 0; k < s.split; k++) {
          await p.screenshot({ path: path.join(dir, String(n).padStart(2, '0') + '.jpg'), type: 'jpeg', quality: 95, clip: { x: k * 1080, y: 0, width: 1080, height: h } });
          n++;
        }
      } else {
        await p.screenshot({ path: path.join(dir, String(n).padStart(2, '0') + '.jpg'), type: 'jpeg', quality: 95 });
        n++;
      }
      await p.close();
    }
    console.log('rendered', post.id, n - 1, 'slides');
  }
  await b.close();
})();
