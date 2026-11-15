// REFILL · December 2026 posts and carousels.
// node campaign/04-december/tools/build.js [prefix]  → out/<post>/NN.jpg (1080×1350, Instagram 4:5)
//
// Type system (print, not template):
//  · Headlines: Montserrat 500, sentence case, tight tracking. Body: Inter 400. Labels only where they carry information.
//  · English and Arabic are equal partners: English set from the left, Arabic set from the right, each in its own column.
//  · Photos either run full-bleed with type placed in their clean areas (no scrims), or sit framed on paper with type in the margin.
//  · Square paper blocks, no drop-shadow cards. The mark appears only where it earns its place.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = 'file://' + path.join(ROOT, 'src') + '/';
const FONTS = 'file://' + path.resolve(ROOT, '../../website/public/assets/fonts') + '/';
const TOOLFONTS = 'file://' + path.join(__dirname, 'fonts') + '/';
const MENU = 'file://' + path.resolve(ROOT, '../../website/public/assets/menu') + '/';
const OUT = path.join(ROOT, 'out');

const INK = '#352317', PAPER = '#F3EFE6', BRIGHT = '#FBF9F4', MUTED = '#7A6A5C', SAND = '#C9B49C';

/* ---------- brand pieces ---------- */
const CUP = (stroke = 'currentColor', sw = 6.72) =>
  `<svg viewBox="0 0 100 100" style="overflow:visible;width:100%;height:100%"><g fill="none" stroke="${stroke}" stroke-width="${sw}"><path d="M6.2 3.36H93.8"/><path d="M13.36 55.52V23.68H86.64V55.52A36.64 36.64 0 0 1 13.36 55.52Z"/></g></svg>`;
const CUP_FILL = (k, ink, liquid, sw = 5) => {
  const top = 27.04, bottom = 88.8, y = bottom - (bottom - top) * k, id = 'c' + Math.round(k * 100);
  return `<svg viewBox="0 0 100 100" style="overflow:visible;width:100%;height:100%"><defs><clipPath id="${id}"><path d="M16.72 55.52V27.04H83.28V55.52A33.28 33.28 0 0 1 16.72 55.52Z"/></clipPath></defs>
  <g clip-path="url(#${id})"><rect x="0" y="${y}" width="100" height="${100 - y}" fill="${liquid}"/></g>
  <g fill="none" stroke="${ink}" stroke-width="${sw}"><path d="M6.2 3.36H93.8"/><path d="M13.36 55.52V23.68H86.64V55.52A36.64 36.64 0 0 1 13.36 55.52Z"/></g></svg>`;
};
const MARK = (c, s = 26) => `<i style="display:block;width:${s}px;height:${s}px;color:${c}">${CUP(c, 8)}</i>`;

const GRAIN = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
const CSS = `
@font-face{font-family:M;src:url(${FONTS}montserrat-latin.woff2) format('woff2');font-weight:200 700}
@font-face{font-family:I;src:url(${FONTS}inter-latin.woff2) format('woff2');font-weight:400 600}
@font-face{font-family:A;src:url(${FONTS}alexandria-arabic.woff2) format('woff2');font-weight:300 600}
@font-face{font-family:C;src:url(${TOOLFONTS}courier-prime-1.woff2) format('woff2');font-weight:400}
@font-face{font-family:C;src:url(${TOOLFONTS}courier-prime-2.woff2) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:var(--w);height:var(--h);overflow:hidden}
body{font-family:M;color:${INK};background:${PAPER};-webkit-font-smoothing:antialiased;position:relative;font-kerning:normal}
.abs{position:absolute}
.full{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hd{font-family:M;font-weight:500;letter-spacing:-.03em;line-height:1.02;text-wrap:balance}
.t{font:400 22px/1.45 I;letter-spacing:-.003em}
.cap{font:600 14px/1.3 M;letter-spacing:.2em;text-transform:uppercase}
.ar{font-family:A;font-weight:400;direction:rtl;text-align:right;letter-spacing:0;line-height:1.35}
.arh{font-family:A;font-weight:500;direction:rtl;text-align:right;letter-spacing:0;line-height:1.25}
.finish{position:absolute;inset:0;pointer-events:none;z-index:50;background:url("data:image/svg+xml;utf8,${encodeURIComponent(GRAIN)}"),radial-gradient(120% 90% at 50% 45%,rgba(0,0,0,0) 62%,rgba(30,18,10,.14) 100%);mix-blend-mode:multiply;opacity:.5}
`;
const page = (w, h, body, extra = '') =>
  `<!doctype html><html><head><meta charset="utf-8"><style>:root{--w:${w}px;--h:${h}px}${CSS}${extra}</style></head><body>${body}<div class="finish"></div></body></html>`;

/* ---------- layouts ---------- */
// photo on paper, type in the margin: English from the left, Arabic from the right
const frame = ({ img, pos = '50% 50%', en, ar, sub = '', meta = '', dark = false, size = 52, photoH = 930, inside = '' }) => {
  const bg = dark ? INK : PAPER, fg = dark ? PAPER : INK, mu = dark ? SAND : MUTED;
  return page(1080, 1350, `
    <div class="abs" style="inset:0;background:${bg}"></div>
    <div class="abs" style="left:44px;top:44px;width:992px;height:${photoH}px;overflow:hidden"><img src="${img}" style="width:100%;height:100%;object-fit:cover;object-position:${pos}">${inside}</div>
    <div class="abs" style="left:56px;right:56px;top:${44 + photoH + 46}px;display:grid;grid-template-columns:1.55fr 1fr;gap:40px;color:${fg}">
      <div><h1 class="hd" style="font-size:${size}px">${en}</h1>${sub ? `<p class="t" style="color:${mu};margin-top:14px">${sub}</p>` : ''}</div>
      <p class="arh" style="font-size:${Math.round(size * 0.66)}px;padding-top:6px">${ar}</p>
    </div>
    <div class="abs" style="left:56px;right:56px;bottom:46px;display:flex;justify-content:space-between;align-items:center;color:${mu}"><span class="cap">${meta}</span>${MARK(mu, 24)}</div>`);
};

const cover = (sw, sh, W = 1080, H = 1350) => { const k = Math.max(W / sw, H / sh); return { k, ox: (W - sw * k) / 2, oy: (H - sh * k) / 2 }; };

/* ---------- posts ---------- */
const posts = [];
const add = (id, slides) => posts.push({ id, slides });

/* 01 · Grand opening invitation */
const ticketCss = `
.ticket{position:absolute;display:grid;grid-template-columns:1fr 150px;background:${PAPER};color:${INK};border-radius:5px;box-shadow:0 14px 30px rgba(0,0,0,.28);
  -webkit-mask:radial-gradient(circle 16px at calc(100% - 150px) 0,#0000 98%,#000) top/100% 51% no-repeat,radial-gradient(circle 16px at calc(100% - 150px) 100%,#0000 98%,#000) bottom/100% 51% no-repeat}
.t-main{padding:36px 40px 34px}
.t-stub{border-left:2px dashed rgba(53,35,23,.3);display:grid;justify-items:center;align-content:center;gap:10px;padding:16px;font-family:C}
.t-stub span{font-size:16px;color:${MUTED}}.t-stub b{font:700 34px/1.05 C;text-align:center}`;
const ticket = (style) => `
  <div class="ticket" style="${style}">
    <div class="t-main">
      <p class="cap" style="color:${MUTED}">You're invited</p>
      <p class="hd" style="font-size:44px;margin-top:14px">First drink on us for the<br>first 20 guests.</p>
      <p class="ar" style="font-size:27px;margin-top:16px;color:${MUTED}">أول ٢٠ زائر، أول مشروب علينا</p>
    </div>
    <div class="t-stub"><span>No.</span><b>01<br>to<br>20</b></div>
  </div>`;
const SKY = 'background:linear-gradient(180deg,#0559a8 0%,#0873d6 100%)';
add('01-grand-opening', [
  { html: page(1080, 1350, `
    <div class="abs" style="inset:0;${SKY}"></div>
    <img class="abs" src="${SRC}facade-night.jpg" style="left:0;top:230px;width:1080px;height:1341px;object-fit:cover;-webkit-mask:linear-gradient(180deg,transparent 0,#000 160px)">
    <div class="abs" style="left:64px;right:64px;top:84px;display:flex;justify-content:space-between;align-items:baseline;color:${BRIGHT}">
      <div><p class="cap" style="opacity:.85">Thursday 3 December, 7:00</p><h1 class="hd" style="font-size:82px;margin-top:16px">Grand opening</h1></div>
      <p class="arh" style="font-size:52px">الافتتاح</p>
    </div>
    ${ticket('left:64px;right:64px;bottom:64px')}`, ticketCss) },
]);
add('01-grand-opening-story', [
  { w: 1080, h: 1920, html: page(1080, 1920, `
    <div class="abs" style="inset:0;${SKY}"></div>
    <img class="abs" src="${SRC}facade-night.jpg" style="left:-234px;top:330px;width:1548px;height:1922px;object-fit:cover;-webkit-mask:linear-gradient(180deg,transparent 0,#000 200px)">
    <div class="abs" style="left:72px;right:72px;top:190px;color:${BRIGHT}">
      <p class="cap" style="opacity:.85">Thursday 3 December, 7:00</p>
      <h1 class="hd" style="font-size:96px;margin-top:18px">Grand opening</h1>
      <p class="arh" style="font-size:56px;margin-top:10px">الافتتاح، الخميس ٣ ديسمبر</p>
    </div>
    ${ticket('left:72px;right:72px;bottom:240px')}`, ticketCss) },
]);

/* 02 · Save us on Google Maps: the cup is the pin */
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
  <g font-family="I" font-weight="500" font-size="17" fill="#A39077"><text x="770" y="250">El Shorouk</text><text x="70" y="1060">New Cairo</text><text x="560" y="700" transform="rotate(68 560 700)">Suez Road</text></g>
</svg>`;
add('02-save-us-on-maps', [
  { html: page(1080, 1350, `
    ${mapSvg}
    <div class="abs" style="left:420px;top:560px;width:120px;height:120px;border-radius:50%;background:rgba(53,35,23,.08);transform:translate(-50%,-50%) scale(2.4)"></div>
    <div class="abs" style="left:420px;top:560px;transform:translate(-50%,-80%);width:112px;height:112px;filter:drop-shadow(0 10px 10px rgba(53,35,23,.3))">${CUP_FILL(1, INK, INK, 7)}</div>
    <div class="abs" style="left:500px;top:440px;background:#FFFFFF;border-radius:16px;padding:22px 26px;box-shadow:0 6px 18px rgba(53,35,23,.14);width:440px">
      <p style="font:600 27px/1.2 I;letter-spacing:-.01em;color:#1f1a16">Refill Specialty Coffee</p>
      <p style="font:400 19px/1.4 I;color:#6b625b;margin-top:4px">Coffee shop · El Shorouk</p>
      <div style="display:flex;gap:10px;margin-top:16px;font:600 16px/1 I">
        <span style="background:#1f1a16;color:#fff;border-radius:999px;padding:11px 18px">Save</span><span style="border:1.5px solid #cfc6bb;border-radius:999px;padding:11px 18px;color:#1f1a16">Directions</span></div>
    </div>
    <div class="abs" style="left:64px;right:64px;top:84px;display:grid;grid-template-columns:1.4fr 1fr;gap:30px;align-items:start">
      <h1 class="hd" style="font-size:70px">New favourite coffee spot.</h1>
      <p class="arh" style="font-size:40px;padding-top:8px">احفظ اللوكيشن وتعالى</p>
    </div>
    <img class="abs" src="${SRC}hand-cup.webp" style="right:-70px;bottom:-60px;width:600px;filter:drop-shadow(0 24px 30px rgba(53,35,23,.28))">`) },
]);

/* 03 · Every relationship has a Refill story */
const story = (img, en, sub, ar, pos) => frame({ img: SRC + img, pos, en, sub, ar, size: 44, meta: 'A Refill story' });
add('03-refill-stories', [
  { w: 2160, h: 1350, split: 2, html: page(2160, 1350, `
    <img class="abs" src="${SRC}story-friends.jpg" style="left:700px;top:0;width:1460px;height:1000px;object-fit:cover;object-position:46% 50%">
    <div class="abs" style="left:0;top:0;width:820px;height:1350px;background:${INK}"></div>
    <p class="abs cap" style="left:64px;top:84px;color:${SAND}">Coffee, people, good days</p>
    <h1 class="abs hd" style="left:64px;top:330px;width:660px;font-size:92px;color:${PAPER}">Every relationship has a Refill story.</h1>
    <p class="abs arh" style="left:64px;width:690px;bottom:96px;font-size:44px;color:${SAND}">كل علاقة ليها حكاية في ريفيل</p>
    <div class="abs" style="left:820px;top:1000px;width:1340px;height:350px;background:${PAPER}"></div>
    <div class="abs" style="left:1136px;right:56px;top:1046px;display:grid;grid-template-columns:1.55fr 1fr;gap:40px">
      <div><h2 class="hd" style="font-size:44px">“Just a quick coffee.” Three hours later.</h2><p class="t" style="color:${MUTED};margin-top:14px">For the friends who never run out of things to say.</p></div>
      <p class="arh" style="font-size:29px;padding-top:6px">قهوة سريعة، وبعدها ٣ ساعات</p>
    </div>
    <div class="abs" style="left:1136px;right:56px;bottom:46px;display:flex;justify-content:space-between;align-items:center;color:${MUTED}"><span class="cap">A Refill story</span>${MARK(MUTED, 24)}</div>`) },
  { html: story('story-couple.jpg', 'Their love language? Knowing each other’s order.', 'A little coffee, a lot of love.', 'بيحفظوا طلبات بعض', '50% 38%') },
  { html: story('story-laptop.jpg', 'Running on deadlines, a flat white and hope.', 'Your work deserves a coffee break too.', 'ديدلاين، فلات وايت، وأمل', '50% 40%') },
  { html: story('story-matcha.jpg', 'Not waiting for anyone. Just her matcha.', 'The best company can be yourself.', 'مش مستنية حد، مستنية الماتشا', '50% 40%') },
]);

/* 04 · Good mornings */
add('04-good-mornings', [{ html: frame({ img: SRC + 'morning-espresso.jpg', pos: '50% 55%', en: 'Good mornings begin with good coffee.', ar: 'الصبح الحلو بيبدأ بقهوة حلوة', meta: '07:00, El Shorouk' }) }]);

/* 05 · Something to sip, something to bite */
const tag = (x, y, t, s, align = 'left') => `<div class="abs" style="${align}:${x}px;top:${y}px;background:${PAPER};padding:12px 16px 13px;text-align:${align}"><p style="font:600 21px/1.15 M;letter-spacing:-.01em">${t}</p><p style="font:400 15px/1.3 I;color:${MUTED};margin-top:3px">${s}</p></div>`;
add('05-sip-and-bite', [{ html: frame({
  img: SRC + 'sip-bite.jpg', pos: '50% 62%', en: 'Something to sip. Something to bite.', ar: 'حاجة تشربها، وحاجة تاكلها', meta: 'Your little break',
  inside: `<svg class="abs" style="left:0;top:0" width="992" height="930" fill="none" stroke="${BRIGHT}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M150 470 C120 540 160 610 250 650"/><path d="M224 640 L252 652 L246 622"/>
      <path d="M840 470 C870 550 840 620 740 660"/><path d="M768 664 L738 662 L750 634"/></svg>
    ${tag(40, 380, 'Flat white', 'something to sip')}${tag(40, 380, 'Butter croissant', 'something to bite', 'right')}` }) }]);

/* 06 · Good coffee for everyone */
add('06-good-coffee-for-everyone', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}cups-pile.jpg">
    <div class="abs" style="left:0;bottom:0;width:760px;background:${PAPER};padding:52px 64px 56px 64px">
      <h1 class="hd" style="font-size:72px">Good coffee for everyone.</h1>
      <div style="display:flex;justify-content:space-between;align-items:end;margin-top:28px;gap:24px">
        <p class="t" style="color:${MUTED};max-width:340px">The daily cup, the catch-up, the five-minute break.</p>
        <p class="arh" style="font-size:36px">قهوة حلوة للكل</p></div>
    </div>`) },
]);

/* coaster and pass artwork printed onto the photos (multiply / screen, so the material shows through) */
const coasterPrint = (side) => {
  const m = cover(1856, 2304), cx = m.ox + 1354 * m.k, cy = m.oy + 1590 * m.k, r = 290 * m.k, front = side === 'front';
  return `<div class="abs" style="left:${cx - r}px;top:${cy - r}px;width:${2 * r}px;height:${2 * r}px;border-radius:50%;display:grid;place-items:center;mix-blend-mode:multiply;color:${INK};transform:rotate(-8deg)">
    <div style="display:grid;justify-items:center;gap:${r * 0.09}px;opacity:.9">
      <i style="display:block;width:${r * 0.48}px;height:${r * 0.48}px">${front ? CUP(INK, 6) : CUP_FILL(1, INK, INK, 6)}</i>
      <b style="font:600 ${r * 0.11}px/1 M;letter-spacing:.3em;margin-right:-.3em">${front ? 'STILL SIPPING' : 'REFILL ME'}</b>
      <span class="ar" style="font-size:${r * 0.12}px;text-align:center">${front ? 'لسه بشرب' : 'املاها تاني'}</span>
    </div></div>`;
};

/* 07 · Teaser */
add('07-teaser-flip-it', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}coaster-empty.jpg">${coasterPrint('back')}
    <h1 class="abs hd" style="right:64px;top:110px;font-size:150px;text-align:right">Flip it.</h1>
    <p class="abs arh" style="right:64px;top:290px;font-size:46px">اقلبها</p>
    <p class="abs cap" style="left:64px;bottom:64px">Monday</p>`) },
]);

/* 08 · The Winter Refill: swipe = flip */
add('08-the-winter-refill', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}coaster-empty.jpg">${coasterPrint('front')}
    <p class="abs arh" style="right:64px;top:110px;font-size:60px">خلّصتها؟</p>
    <h1 class="abs hd" style="left:64px;bottom:96px;width:560px;font-size:70px">Finished your hot chocolate?</h1>`) },
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}coaster-empty.jpg">${coasterPrint('back')}
    <p class="abs arh" style="right:64px;top:110px;font-size:60px">اقلب الكوستر</p>
    <h1 class="abs hd" style="left:64px;bottom:96px;width:560px;font-size:70px">Flip the coaster.</h1>`) },
  { html: frame({ img: SRC + 'pour.jpg', pos: '50% 50%', en: 'We bring the pot.', ar: 'وإحنا نملاها', sub: 'One refill per cup, at your table.', meta: 'The Winter Refill', dark: true, size: 60 }) },
  { html: page(1080, 1350, `
    <div class="abs" style="inset:0;background:${INK}"></div>
    <div class="abs" style="left:64px;top:84px;width:120px;height:120px">${CUP_FILL(0.8, PAPER, '#8A5A3B', 5)}</div>
    <h1 class="abs hd" style="left:64px;right:64px;top:430px;font-size:108px;color:${PAPER}">The Winter Refill</h1>
    <div class="abs" style="left:64px;right:64px;top:590px;display:flex;justify-content:space-between;align-items:baseline;color:${PAPER}">
      <p class="hd" style="font-size:46px;font-weight:400">Finish it. We’ll refill it.</p><p class="arh" style="font-size:54px;color:${SAND}">ريفيل الشتا</p></div>
    <div class="abs" style="left:64px;right:64px;bottom:64px;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid rgba(243,239,230,.3);color:${SAND}">
      ${['Dine-in', 'Hot chocolate', 'One refill per cup', 'All winter'].map(t => `<p class="cap" style="padding-top:20px">${t}</p>`).join('')}</div>`) },
]);

/* 09 · The Winter Refill Pass: swipe = fill */
const passFront = () => {
  const m = cover(1856, 2304), w = 880 * m.k, h = 580 * m.k, x = m.ox + 704 * m.k - w / 2, y = m.oy + 1638 * m.k - h / 2;
  return `<div class="abs" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;padding:${h * 0.11}px ${w * 0.07}px;display:grid;grid-template-rows:auto 1fr auto;color:#F1E7DA;mix-blend-mode:screen;opacity:.9;transform:rotate(3.4deg)">
    <div style="display:flex;justify-content:space-between;align-items:center"><span style="font:600 ${h * 0.06}px/1 M;letter-spacing:.5em">REFILL</span><i style="width:${h * 0.12}px;height:${h * 0.12}px;display:block">${CUP('#F1E7DA', 8)}</i></div>
    <p style="align-self:end;font:500 ${h * 0.14}px/1.02 M;letter-spacing:-.03em"><span style="display:block;font:400 ${h * 0.05}px/1 C;color:#D8C2A6;margin-bottom:${h * 0.05}px">WINTER 2026 · NO. 0247</span>The Winter<br>Refill Pass</p>
    <div style="display:flex;justify-content:space-between;font:400 ${h * 0.055}px/1 I;color:#D8C2A6;margin-top:${h * 0.06}px"><span>Five cups to full.</span><span class="ar">خمس كوبايات وتتملي</span></div>
  </div>`;
};
const fillSlide = (k, line, ar) => page(1080, 1350, `
  <div class="abs" style="inset:0;background:${INK}"></div>
  <div class="abs" style="left:50%;top:150px;transform:translateX(-50%);width:500px;height:500px">${CUP_FILL(k, PAPER, '#8A5A3B', 4.2)}</div>
  <p class="abs hd" style="left:0;right:0;top:760px;text-align:center;font-size:132px;color:${PAPER};font-variant-numeric:tabular-nums">${Math.round(k * 100)}%</p>
  <div class="abs" style="left:64px;right:64px;bottom:96px;display:flex;justify-content:space-between;align-items:baseline;color:${PAPER}">
    <p class="hd" style="font-size:44px;font-weight:400">${line}</p><p class="arh" style="font-size:36px;color:${SAND}">${ar}</p></div>`);
add('09-winter-refill-pass', [
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}pass-flatlay.jpg">${passFront()}
    <h1 class="abs hd" style="left:64px;top:96px;width:520px;font-size:84px">Five cups to full.</h1>
    <p class="abs arh" style="left:64px;width:520px;top:290px;font-size:40px">خمس كوبايات وتتملي</p>`) },
  { html: fillSlide(0.2, 'A good start.', 'بداية حلوة') },
  { html: fillSlide(0.4, 'You’re a regular now.', 'بقيت من أهل المكان') },
  { html: fillSlide(0.6, 'The barista knows your name.', 'الباريستا عارف اسمك') },
  { html: fillSlide(0.8, 'One more.', 'واحدة كمان') },
  { html: fillSlide(1, 'Fully refilled.', 'اتملت على الآخر') },
  { html: page(1080, 1350, `
    <div class="abs" style="left:64px;right:64px;top:300px;display:flex;justify-content:space-between;align-items:baseline">
      <h1 class="hd" style="font-size:132px">Cup six<br>is on us.</h1><p class="arh" style="font-size:56px">السادسة علينا</p></div>
    <div class="abs" style="left:64px;right:64px;bottom:64px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;border-top:1px solid rgba(53,35,23,.25);color:${MUTED}">
      ${['Ask for your pass at the bar.', 'One stamp per hot chocolate.', 'Valid until the end of February.'].map(t => `<p class="t" style="padding-top:20px">${t}</p>`).join('')}</div>`) },
]);

/* 10 · What's your coffee personality? */
const persona = [
  ['p-spanish', 'Spanish latte', 'Sweet talker. Always iced.'], ['p-caramel', 'Caramel latte', 'Main character. Extra drizzle.'],
  ['p-cappuccino', 'Cappuccino', 'A classic. Owns one good coat.'], ['p-flatwhite', 'Flat white', 'Quietly particular.'],
  ['p-hotchoc', 'Hot chocolate', 'Soft heart. Winter all year.'], ['p-matcha', 'Iced matcha', 'Unbothered. Thriving.'],
];
add('10-coffee-personality', [
  { html: page(1080, 1350, `
    <div class="abs" style="inset:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);gap:6px;background:${PAPER}">
      ${persona.map(([f, n, l]) => `<div style="position:relative;overflow:hidden"><img src="${SRC}${f}.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
        <div style="position:absolute;left:0;bottom:0;background:${PAPER};padding:14px 20px 15px 20px"><p style="font:600 21px/1.15 M;letter-spacing:-.01em">${n}</p><p style="font:400 15px/1.3 I;color:${MUTED};margin-top:3px">${l}</p></div></div>`).join('')}
    </div>
    <div class="abs" style="left:50%;top:50%;transform:translate(-50%,-50%);width:400px;height:400px;border-radius:50%;background:${INK};color:${PAPER};display:grid;place-items:center;text-align:center;padding:40px">
      <div><h1 class="hd" style="font-size:46px">What’s your coffee personality?</h1><p class="arh" style="font-size:28px;margin-top:14px;color:${SAND};text-align:center">إنت مين فيهم؟</p></div>
    </div>`) },
]);

/* 11 · What can you order at Refill? */
const ingSlide = (bg, cut, name, items, ar, wide) => page(1080, 1350, `
  <img class="full" src="${SRC}${bg}.jpg">
  ${items.map((t, i) => `<span class="abs cap" style="${i % 2 ? 'right' : 'left'}:24px;${i < 2 ? 'top' : 'bottom'}:24px;background:${PAPER};padding:10px 14px">${t}</span>`).join('')}
  <div class="abs" style="left:50%;top:560px;transform:translate(-50%,-50%);width:540px;height:540px;border-radius:50%;background:${PAPER}"></div>
  <img class="abs" src="${cut}" style="left:50%;top:560px;transform:translate(-50%,-52%);width:${wide ? 450 : 410}px;filter:drop-shadow(0 18px 18px rgba(53,35,23,.25))">
  <div class="abs" style="left:50%;top:880px;transform:translateX(-50%);width:600px;background:${PAPER};padding:24px 30px;display:flex;justify-content:space-between;align-items:baseline">
    <div><p class="cap" style="color:${MUTED}">What’s inside</p><p class="hd" style="font-size:40px;margin-top:8px">${name}</p></div><p class="arh" style="font-size:30px">${ar}</p></div>`);
add('11-what-can-you-order', [
  { html: frame({ img: SRC + 'lineup.jpg', pos: '50% 60%', en: 'What can you order at Refill?', ar: 'تطلب إيه من ريفيل؟', meta: 'The menu', size: 54 }) },
  { html: ingSlide('ing-caramel', SRC + 'cut-caramel.webp', 'Caramel latte', ['Espresso', 'Steamed milk', 'Caramel sauce', 'Caramel syrup'], 'كراميل لاتيه') },
  { html: ingSlide('ing-hotchoc', SRC + 'cut-hotchoc.webp', 'Hot chocolate', ['Dark chocolate', 'Milk', 'Whipped cream', 'Cocoa'], 'هوت شوكليت') },
  { html: ingSlide('ing-croissant', SRC + 'cut-croissant.webp', 'Butter croissant', ['Flour', 'French butter', 'Milk', 'Yeast'], 'كرواسون بالزبدة', true) },
  { html: page(1080, 1350, `
    <div class="abs" style="left:64px;right:64px;top:96px;display:flex;justify-content:space-between;align-items:baseline"><h1 class="hd" style="font-size:96px">And a lot more.</h1><p class="arh" style="font-size:44px">ولسه في كتير</p></div>
    <div class="abs" style="left:40px;right:40px;top:300px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
      ${['flatwhite', 'cruffin', 'plaster', 'cheesecake', 'spanish', 'cardamom'].map(f => `<img src="${MENU}${f}.webp" style="width:100%;filter:drop-shadow(0 14px 14px rgba(53,35,23,.2))">`).join('')}</div>
    <div class="abs" style="left:64px;right:64px;bottom:64px;display:flex;justify-content:space-between;border-top:1px solid rgba(53,35,23,.25);padding-top:20px"><p class="cap">Full menu, link in bio</p><p class="cap" style="color:${MUTED}">Coffee, bakehouse, kitchen</p></div>`) },
]);

/* 12 · The longest night */
add('12-longest-night', [{ html: frame({ img: SRC + 'night-bar.jpg', en: 'The longest night of the year deserves the longest refill.', ar: 'أطول ليلة في السنة، وأطول ريفيل', sub: 'Hot chocolate refills all evening, sunset to close.', meta: 'Monday 21 December', dark: true, size: 42 }) }]);

/* 13 · The Hot Chocolate Atelier */
add('13-hot-chocolate-atelier', [
  { html: page(1080, 1350, `
    <img class="abs" src="${SRC}atelier.jpg" style="left:44px;top:400px;width:992px;height:906px;object-fit:cover;object-position:50% 55%">
    <div class="abs" style="left:56px;right:56px;top:84px;display:grid;grid-template-columns:1.55fr 1fr;gap:40px">
      <h1 class="hd" style="font-size:56px">Build it. Name it. We write it on your cup.</h1><p class="arh" style="font-size:36px;padding-top:6px">اعملها وسمّيها</p></div>
    <div class="abs" style="left:56px;right:56px;top:300px;display:flex;gap:34px;color:${MUTED}">
      ${['Chocolate', 'Milk', 'Finish', 'Your name for it'].map((t, i) => `<p class="cap"><span style="font-family:C;font-weight:700;letter-spacing:0;margin-right:8px;color:${INK}">0${i + 1}</span>${t}</p>`).join('')}</div>`) },
]);

/* 14 · Refill notes: typed slips */
const slip = (no, en, ar, win) => page(1080, 1350, `
  <div class="abs" style="inset:0;background:${INK}"></div>
  <div class="abs" style="left:50%;top:50%;transform:translate(-50%,-52%) rotate(-2.5deg);width:860px;background:#F6EFE3;padding:56px 60px 52px;box-shadow:0 10px 24px rgba(0,0,0,.35)">
    <p style="font:400 20px/1 C;color:${MUTED};display:flex;justify-content:space-between"><span>REFILL NOTE No. ${no}</span><span>${win ? 'WINNER' : 'EL SHOROUK'}</span></p>
    <p style="font:400 56px/1.18 C;color:#2a2420;margin-top:34px;letter-spacing:-.01em">${en}</p>
    <p class="ar" style="font-size:36px;margin-top:26px;color:#5a4f46">${ar}</p>
  </div>`);
add('14-refill-notes', [
  { html: frame({ img: SRC + 'note.jpg', pos: '50% 60%', en: 'Every cup comes with a note.', ar: 'كل كوباية معاها ورقة', sub: 'Baked into a cocoa biscuit. One in twenty wins.', meta: '25 December', size: 52 }) },
  { html: slip('03', 'Today is a two-cup kind of day.', 'النهارده يوم كوبايتين') },
  { html: slip('11', 'Text them first.', 'ابعتله إنت الأول') },
  { html: slip('17', 'Someone in this room likes your sweater.', 'في حد هنا عاجبه البلوفر بتاعك') },
  { html: slip('20', 'This one’s on us. Show this note at the bar.', 'دي علينا. ورّي الورقة للباريستا', true) },
  { html: page(1080, 1350, `
    <h1 class="abs hd" style="left:64px;right:64px;top:320px;font-size:120px">What did yours say?</h1>
    <p class="abs arh" style="right:64px;top:620px;font-size:56px">ورقتك قالت إيه؟</p>
    <div class="abs" style="left:64px;right:64px;bottom:64px;display:flex;justify-content:space-between;border-top:1px solid rgba(53,35,23,.25);padding-top:20px"><p class="cap">Tag us #RefillElShorouk</p><p class="cap" style="color:${MUTED}">A little fortune. A lot of chocolate.</p></div>`) },
]);

/* 15 · The last refill of 2026 */
add('15-last-refill-of-2026', [{ html: frame({ img: SRC + 'nye.jpg', en: 'The last refill of 2026.', ar: 'آخر ريفيل في ٢٠٢٦', sub: 'See you in 2027 with a full cup.', meta: '31 December', dark: true, size: 56 }) }]);

/* 16 · The receipt */
const rcpt = (l, r = '', b = false) => `<div class="rr${b ? ' b' : ''}"><span>${l}</span><span>${r}</span></div>`;
const receiptCss = `
.rc{position:absolute;font:400 18px/1.5 C;color:#262321;mix-blend-mode:multiply;opacity:.9;filter:blur(.25px);letter-spacing:.02em}
.rr{display:flex;justify-content:space-between;gap:10px}.rr.b{font-weight:700}
.rc hr{border:0;border-top:2px dashed #262321;margin:10px 0;opacity:.75}
.rc .c{text-align:center}
.bars{height:46px;margin:14px 10px 0;background:repeating-linear-gradient(90deg,#262321 0 2px,transparent 2px 4px,#262321 4px 7px,transparent 7px 9px,#262321 9px 10px,transparent 10px 14px)}`;
{
  const m = cover(1856, 2304), k = m.k * 1.6, left = 540 - 930 * k, top = 60 - 420 * k;
  add('16-the-receipt', [
    { html: page(1080, 1350, `
      <img class="abs" src="${SRC}receipt-hand.jpg" style="left:${left}px;top:${top}px;width:${1856 * k}px;height:${2304 * k}px">
      <div class="rc" style="left:341px;top:215px;width:350px;transform:rotate(.7deg)">
        <div class="c"><i style="display:inline-block;width:40px;height:40px">${CUP('#262321', 8)}</i></div>
        <p class="c" style="font-weight:700;letter-spacing:.5em;margin:6px 0 0 .5em">REFILL</p>
        <p class="c" style="font-size:15px">SPECIALTY COFFEE · EL SHOROUK</p>
        <hr>${rcpt('TABLE 04', 'SAT 08:41')}${rcpt('ORDER', '#0001')}<hr>
        ${rcpt('1 FLAT WHITE', '135')}${rcpt('1 BUTTER CROISSANT', '95')}${rcpt('1 WINDOW SEAT', 'FREE')}
        ${rcpt('1 "JUST 5 MINUTES"', '3 HRS')}${rcpt('1 BAD MOOD', 'REMOVED')}${rcpt('1 REFILL', 'YES')}<hr>
        ${rcpt('TOTAL', '230 EGP', true)}${rcpt('CHANGE', 'A BETTER DAY')}<hr>
        <p class="c">THANK YOU. COME BACK HUNGRY.</p>
        <p class="c ar" style="font-size:20px;text-align:center">شكراً ونورتنا</p>
        <div class="bars"></div>
      </div>`, receiptCss) },
  ]);
}

/* 17 · Anatomy of a croissant */
const callout = (x, y, lx, ly, title, sub, align = 'left') => `
  <svg class="abs" style="left:0;top:0;z-index:3" width="1080" height="1350"><path d="M${lx} ${ly + 12} L${lx} ${ly + 34} L${x} ${y}" fill="none" stroke="${BRIGHT}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="6" fill="${BRIGHT}"/></svg>
  <div class="abs" style="${align}:${align === 'left' ? lx - 2 : 1080 - lx - 2}px;top:${ly - 58}px;text-align:${align};z-index:4;width:250px;color:${BRIGHT}">
    <p class="cap" style="font-size:13px">${title}</p><p style="font:400 17px/1.35 I;opacity:.8;margin-top:6px">${sub}</p></div>`;
add('17-anatomy-of-a-croissant', [
  { html: frame({ img: SRC + 'croissant-tear.jpg', pos: '50% 45%', en: 'We tore one open. For science.', ar: 'فتحناها للعلم', meta: 'Anatomy of a croissant', size: 56 }) },
  { html: page(1080, 1350, `
    <img class="full" src="${SRC}croissant-cut.jpg" style="transform:scale(1.04)">
    <h1 class="abs hd" style="left:64px;top:84px;font-size:56px;color:${BRIGHT};width:620px">A butter croissant, cut open.</h1>
    ${callout(330, 560, 66, 360, 'Shattered crust', 'Deep gold and loud.')}
    ${callout(470, 790, 380, 360, 'Open honeycomb', 'Air where the butter melted.')}
    ${callout(800, 700, 1014, 360, 'Thin layers', 'Folded by hand.', 'right')}
    <p class="abs cap" style="right:64px;bottom:56px;color:${BRIGHT};opacity:.85">Three days from dough to oven</p>`) },
  { html: page(1080, 1350, `
    <img class="abs" src="${SRC}croissant-lamination.jpg" style="left:44px;top:44px;width:992px;height:880px;object-fit:cover;object-position:50% 40%">
    <div class="abs" style="left:56px;right:56px;top:970px;display:grid;grid-template-columns:repeat(3,1fr);gap:32px">
      ${[['Day 1', 'The dough is mixed and rests overnight.'], ['Day 2', 'Cold butter is folded in by hand, three turns.'], ['Day 3', 'Shaped, proofed and baked at dawn.']].map(([d, t]) => `<div style="border-top:1px solid rgba(53,35,23,.3);padding-top:16px"><p class="hd" style="font-size:40px">${d}</p><p class="t" style="color:${MUTED};margin-top:10px;font-size:20px">${t}</p></div>`).join('')}</div>
    <div class="abs" style="left:56px;right:56px;bottom:46px;display:flex;justify-content:space-between;align-items:center;color:${MUTED}"><span class="cap">How it’s made</span>${MARK(MUTED, 24)}</div>`) },
  { html: frame({ img: SRC + 'croissant-tray.jpg', en: 'By 11:00, this is usually all that’s left.', ar: 'الساعة ١١، ده اللي بيفضل', meta: 'At the bakehouse', size: 48 }) },
  { html: page(1080, 1350, `
    <img class="abs" src="${MENU}croissant.webp" style="left:50%;top:120px;transform:translateX(-50%) rotate(-8deg);width:680px;filter:drop-shadow(0 24px 24px rgba(53,35,23,.25))">
    <div class="abs" style="left:64px;right:64px;bottom:200px;display:flex;justify-content:space-between;align-items:baseline"><h1 class="hd" style="font-size:112px">Come early.</h1><p class="arh" style="font-size:52px">تعالى بدري</p></div>
    <div class="abs" style="left:64px;right:64px;bottom:64px;display:flex;justify-content:space-between;border-top:1px solid rgba(53,35,23,.25);padding-top:20px"><p class="cap">Out of the oven at 07:00 and 19:00</p><p class="cap" style="color:${MUTED}">Save this</p></div>`) },
]);

/* 18 · Texts from your coffee (lock screen UI, set like the real thing) */
const lockCss = `
.ls-date{font:500 30px/1 I;color:#FBF9F4;text-align:center;text-shadow:0 1px 12px rgba(0,0,0,.2)}
.ls-time{font:600 190px/1 I;color:#FBF9F4;text-align:center;letter-spacing:-.04em;margin-top:6px;text-shadow:0 2px 20px rgba(0,0,0,.2)}
.nt{background:rgba(246,241,233,.62);-webkit-backdrop-filter:blur(28px) saturate(1.4);backdrop-filter:blur(28px) saturate(1.4);border-radius:34px;padding:22px 26px;display:grid;grid-template-columns:74px 1fr;gap:18px;align-items:center}
.nt + .nt{margin-top:12px}
.nt .ic{width:74px;height:74px;border-radius:18px;background:${INK};display:grid;place-items:center}
.nt .ic i{width:42px;height:42px;display:block}
.nt .hd2{display:flex;justify-content:space-between;font:600 24px/1.2 I;color:#1d1813}
.nt .hd2 span{font-weight:400;color:#5a5048}
.nt .bd{font:400 25px/1.32 I;color:#1d1813;margin-top:4px}`;
const notif = (when, body) => `<div class="nt"><div class="ic"><i>${CUP(PAPER, 9)}</i></div><div><div class="hd2">Refill<span>${when}</span></div><div class="bd">${body}</div></div></div>`;
const lock = (img, date, time, notes, top = 470, tint = .25, z = 1) => page(1080, 1350, `
  <img class="full" src="${SRC}${img}.jpg" style="transform:scale(${z})">
  <div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,${tint}) 0%,rgba(0,0,0,0) 40%)"></div>
  <div class="abs" style="left:0;right:0;top:110px"><p class="ls-date">${date}</p><p class="ls-time">${time}</p></div>
  <div class="abs" style="left:50px;right:50px;top:${top}px">${notes}</div>
  <div class="abs" style="left:50%;bottom:26px;transform:translateX(-50%);width:200px;height:7px;border-radius:7px;background:rgba(251,249,244,.85)"></div>`, lockCss);
add('18-texts-from-your-coffee', [
  { html: lock('notif-sunrise', 'Monday 7 December', '07:02', notif('now', 'Good morning. I’m warm and ready when you are.') + notif('1m ago', 'P.S. the croissants just came out.'), 470, .35) },
  { html: lock('notif-empty', 'Wednesday 16 December', '15:10', notif('now', 'You left me empty 3 hours ago.') + notif('now', 'Flip the coaster. I’ll get refilled.'), 430, .2) },
  { html: lock('notif-rain', 'Thursday 17 December', '17:48', notif('now', 'It’s raining. You know what that means.') + notif('now', 'Hot chocolate refills, all winter.'), 470, .25, 1.06) },
  { html: lock('notif-night', 'Sunday 20 December', '23:31', notif('now', 'Last refill of the day in 29 minutes.') + notif('now', 'Not that I’m counting.'), 470, .1) },
]);

/* 19 · Cover for the latte-art reel */
add('19-reel-cover-our-logo-poured', [{ html: frame({ img: SRC + 'latte-logo.jpg', pos: '50% 50%', en: 'We poured our logo.', ar: 'صبّينا اللوجو', meta: 'Watch closely', size: 56 }) }]);

/* ---------- render ---------- */
(async () => {
  const only = process.argv[2];
  const b = await chromium.launch();
  const tmp = path.join(require('os').tmpdir(), 'refill-dec-html'); fs.mkdirSync(tmp, { recursive: true });
  for (const post of posts) {
    if (only && !post.id.startsWith(only)) continue;
    const dir = path.join(OUT, post.id); fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) if (/^\d\d\.jpg$/.test(f)) fs.unlinkSync(path.join(dir, f));
    let n = 1;
    for (const s of post.slides) {
      const w = s.w || 1080, h = s.h || 1350;
      const file = path.join(tmp, `${post.id}-${n}.html`); fs.writeFileSync(file, s.html);
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto('file://' + file, { waitUntil: 'load' });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(150);
      const shots = s.split ? s.split : 1;
      for (let k = 0; k < shots; k++) {
        await p.screenshot({ path: path.join(dir, String(n).padStart(2, '0') + '.jpg'), type: 'jpeg', quality: 95, clip: { x: k * 1080, y: 0, width: 1080, height: h } });
        n++;
      }
      await p.close();
    }
    console.log('rendered', post.id, n - 1, 'slides');
  }
  await b.close();
})();
