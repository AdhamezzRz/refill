// REFILL · December 2026 posts and carousels, set in the REFILL identity (NAJ).
// node campaign/04-december/tools/build.js [prefix]  → out/<post>/NN.jpg (1080×1350, Instagram 4:5)
//
// Identity: brown #653d26 · caramel #c7ad91 · warm grey #8e847e · cream #f2e9db
// Type: Montserrat Bold capitals for words, a formal script for the voice (stand-in for Vladimir Script), Alexandria for Arabic.
// Placement changes with every post, the way the identity's own posters do it:
//   scattered words that follow the objects · two words flanking the subject · small centred stacks · four-corner labels ·
//   vertical type along an edge · the cup logo as a window onto the photo · a giant word behind a product.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = 'file://' + path.join(ROOT, 'src') + '/';
const FONTS = 'file://' + path.resolve(ROOT, '../../website/public/assets/fonts') + '/';
const TOOLFONTS = 'file://' + path.join(__dirname, 'fonts') + '/';
const MENU = 'file://' + path.resolve(ROOT, '../../website/public/assets/menu') + '/';
const OUT = path.join(ROOT, 'out');

const BROWN = '#653d26', CARAMEL = '#c7ad91', GREY = '#8e847e', CREAM = '#f2e9db';

/* ---------- brand pieces ---------- */
const CUP = (stroke = 'currentColor', sw = 6.72) =>
  `<svg viewBox="0 0 100 100" style="overflow:visible;width:100%;height:100%"><g fill="none" stroke="${stroke}" stroke-width="${sw}"><path d="M6.2 3.36H93.8"/><path d="M13.36 55.52V23.68H86.64V55.52A36.64 36.64 0 0 1 13.36 55.52Z"/></g></svg>`;
const CUP_FILL = (k, ink, liquid, sw = 5) => {
  const top = 27.04, bottom = 88.8, y = bottom - (bottom - top) * k, id = 'c' + Math.round(k * 100);
  return `<svg viewBox="0 0 100 100" style="overflow:visible;width:100%;height:100%"><defs><clipPath id="${id}"><path d="M16.72 55.52V27.04H83.28V55.52A33.28 33.28 0 0 1 16.72 55.52Z"/></clipPath></defs>
  <g clip-path="url(#${id})"><rect x="0" y="${y}" width="100" height="${100 - y}" fill="${liquid}"/></g>
  <g fill="none" stroke="${ink}" stroke-width="${sw}"><path d="M6.2 3.36H93.8"/><path d="M13.36 55.52V23.68H86.64V55.52A36.64 36.64 0 0 1 13.36 55.52Z"/></g></svg>`;
};
// the cup logo as a window: photo inside the cup, thick cream outline and lid, like the identity's ICED SIGNATURE poster
const cupWindow = (img, cx, top, w, stroke = CREAM, pos = '50% 50%') => {
  const sw = w * 0.084, lidW = w * 1.095, gap = w * 0.17, cupTop = top + sw + gap, h = w * 0.94, r = w / 2;
  const x0 = cx - w / 2, x1 = cx + w / 2, id = 'w' + Math.round(cx + top + w);
  const p = `M${x0} ${cupTop} H${x1} V${cupTop + h - r} A${r} ${r} 0 0 1 ${x0} ${cupTop + h - r} Z`;
  return `<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1350"><defs><clipPath id="${id}"><path d="${p}"/></clipPath></defs>
    <foreignObject x="${x0}" y="${cupTop}" width="${w}" height="${h}" clip-path="url(#${id})"><img xmlns="http://www.w3.org/1999/xhtml" src="${img}" style="width:${w}px;height:${h}px;object-fit:cover;object-position:${pos};display:block"/></foreignObject>
    <path d="${p}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>
    <rect x="${cx - lidW / 2}" y="${top}" width="${lidW}" height="${sw}" fill="${stroke}"/></svg>`;
};

const GRAIN = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
const CSS = `
@font-face{font-family:M;src:url(${FONTS}montserrat-latin.woff2) format('woff2');font-weight:200 700}
@font-face{font-family:I;src:url(${FONTS}inter-latin.woff2) format('woff2');font-weight:400 600}
@font-face{font-family:A;src:url(${FONTS}alexandria-arabic.woff2) format('woff2');font-weight:300 600}
@font-face{font-family:C;src:url(${TOOLFONTS}courier-prime-1.woff2) format('woff2');font-weight:400}
@font-face{font-family:C;src:url(${TOOLFONTS}courier-prime-2.woff2) format('woff2');font-weight:700}
@font-face{font-family:S;src:url(${TOOLFONTS}great-vibes.woff2) format('woff2')}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:var(--w);height:var(--h);overflow:hidden}
body{font-family:M;color:${BROWN};background:${CREAM};-webkit-font-smoothing:antialiased;position:relative}
.abs{position:absolute}
.full{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.b{font-family:M;font-weight:700;text-transform:uppercase;letter-spacing:.02em;line-height:1.08}
.s{font-family:S;font-weight:400;line-height:1;letter-spacing:0}
.ar{font-family:A;font-weight:600;direction:rtl;letter-spacing:0;line-height:1.3}
.sm{font-family:M;font-weight:700;text-transform:uppercase;letter-spacing:.14em;font-size:18px;line-height:1.3}
.lit{text-shadow:0 1px 16px rgba(40,22,12,.38)}
.finish{position:absolute;inset:0;pointer-events:none;z-index:50;background:url("data:image/svg+xml;utf8,${encodeURIComponent(GRAIN)}");mix-blend-mode:multiply;opacity:.45}
`;
const page = (w, h, body, extra = '') =>
  `<!doctype html><html><head><meta charset="utf-8"><style>:root{--w:${w}px;--h:${h}px}${CSS}${extra}</style></head><body>${body}<div class="finish"></div></body></html>`;

/* placement helper: T(x, y, html, {size, color, align, cls, w, lit, rot}) ; x/y are the anchor in px */
const T = (x, y, html, o = {}) => {
  const { size = 40, color = BROWN, align = 'left', cls = 'b', w = 900, lit = false, rot = 0 } = o;
  const left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  return `<div class="abs ${cls}${lit ? ' lit' : ''}" style="left:${left}px;top:${y}px;width:${w}px;text-align:${align};font-size:${size}px;color:${color};${rot ? `transform:rotate(${rot}deg);transform-origin:${align === 'right' ? 'right' : 'left'} top;` : ''}">${html}</div>`;
};
const AR = (x, y, text, o = {}) => T(x, y, text, { cls: 'ar', align: 'right', size: 34, ...o });
const SCRIPT = (x, y, text, o = {}) => T(x, y, text, { cls: 's', size: 96, ...o });
const SM = (x, y, text, o = {}) => T(x, y, text, { cls: 'sm', size: 18, ...o });
const IMG = (file, pos = '50% 50%', zoom = 1) => `<img class="full" src="${SRC}${file}" style="object-position:${pos};transform:scale(${zoom})">`;
const cover = (sw, sh, W = 1080, H = 1350) => { const k = Math.max(W / sw, H / sh); return { k, ox: (W - sw * k) / 2, oy: (H - sh * k) / 2 }; };

/* ---------- posts ---------- */
const posts = [];
const add = (id, slides) => posts.push({ id, slides });

/* 01 · Grand opening: four corners + the invitation in script */
add('01-grand-opening', [{ html: page(1080, 1350, `
  <div class="abs" style="inset:0;background:linear-gradient(180deg,#0559a8 0%,#0873d6 100%)"></div>
  <img class="abs" src="${SRC}facade-night.jpg" style="left:0;top:200px;width:1080px;height:1341px;object-fit:cover;-webkit-mask:linear-gradient(180deg,transparent 0,#000 150px)">
  ${SM(64, 64, 'Grand opening', { color: CREAM })}${SM(1016, 64, 'El Shorouk', { color: CREAM, align: 'right' })}
  ${SCRIPT(540, 96, 'You’re invited', { color: CREAM, align: 'center', size: 120, lit: true })}
  ${T(540, 250, 'First drink on us · the first 20 guests', { color: CREAM, align: 'center', size: 25, w: 1000 })}
  ${AR(540, 292, 'أول ٢٠ زائر، أول مشروب علينا', { color: CREAM, align: 'center', size: 26, w: 700 })}
  ${SM(64, 1270, 'Thu 03 Dec', { color: CREAM, lit: true })}${SM(1016, 1270, '07:00', { color: CREAM, align: 'right', lit: true })}`) }]);
add('01-grand-opening-story', [{ w: 1080, h: 1920, html: page(1080, 1920, `
  <div class="abs" style="inset:0;background:linear-gradient(180deg,#0559a8 0%,#0873d6 100%)"></div>
  <img class="abs" src="${SRC}facade-night.jpg" style="left:-234px;top:420px;width:1548px;height:1922px;object-fit:cover;-webkit-mask:linear-gradient(180deg,transparent 0,#000 200px)">
  ${SM(72, 150, 'Grand opening', { color: CREAM })}${SM(1008, 150, 'El Shorouk', { color: CREAM, align: 'right' })}
  ${SCRIPT(540, 250, 'You’re invited', { color: CREAM, align: 'center', size: 140, lit: true })}
  ${AR(540, 420, 'الافتتاح، الخميس ٣ ديسمبر', { color: CREAM, align: 'center', size: 44, w: 800 })}
  ${T(540, 1480, 'First drink on us<br>for the first 20 guests', { color: CREAM, align: 'center', size: 42, lit: true })}
  ${SM(72, 1720, 'Thu 03 Dec', { color: CREAM, lit: true })}${SM(1008, 1720, '07:00', { color: CREAM, align: 'right', lit: true })}`) }]);

/* 02 · Save us on Google Maps: the cup is the pin */
const mapSvg = `
<svg class="full" viewBox="0 0 1080 1350" preserveAspectRatio="xMidYMid slice">
  <rect width="1080" height="1350" fill="#efe5d4"/>
  <g fill="#dfd9c4"><path d="M-20 980 C120 930 260 990 330 1080 C400 1170 360 1290 300 1380 L-20 1380Z"/><path d="M760 120 C840 90 960 110 1100 160 L1100 420 C980 450 860 410 800 340 C740 270 700 160 760 120Z"/><circle cx="560" cy="560" r="60"/></g>
  <g fill="none" stroke="#fbf6ee" stroke-linecap="round">
    <path d="M-40 420 C200 400 420 470 640 520 S940 560 1120 530" stroke-width="46"/>
    <path d="M300 -40 C320 200 360 420 420 640 S520 1060 560 1400" stroke-width="40"/>
    <path d="M-40 760 C240 760 520 820 760 900 S1000 990 1120 1000" stroke-width="30"/>
    <path d="M720 -40 C700 160 690 360 700 560" stroke-width="26"/>
    <path d="M100 120 L520 260 M560 300 L1100 260 M120 1180 L700 1150 M820 640 L1100 700 M160 560 L380 600" stroke-width="18"/>
  </g>
  <g font-family="I" font-weight="500" font-size="17" fill="${GREY}"><text x="770" y="250">El Shorouk</text><text x="70" y="1060">New Cairo</text><text x="560" y="700" transform="rotate(68 560 700)">Suez Road</text></g>
</svg>`;
add('02-save-us-on-maps', [{ html: page(1080, 1350, `
  ${mapSvg}
  <div class="abs" style="left:420px;top:560px;width:120px;height:120px;border-radius:50%;background:rgba(101,61,38,.1);transform:translate(-50%,-50%) scale(2.4)"></div>
  <div class="abs" style="left:420px;top:560px;transform:translate(-50%,-80%);width:112px;height:112px;filter:drop-shadow(0 10px 10px rgba(101,61,38,.3))">${CUP_FILL(1, BROWN, BROWN, 7)}</div>
  <div class="abs" style="left:500px;top:440px;background:#FFFFFF;border-radius:16px;padding:22px 26px;box-shadow:0 6px 18px rgba(101,61,38,.14);width:440px">
    <p style="font:600 27px/1.2 I;letter-spacing:-.01em;color:#1f1a16">Refill Specialty Coffee</p>
    <p style="font:400 19px/1.4 I;color:#6b625b;margin-top:4px">Coffee shop · El Shorouk</p>
    <div style="display:flex;gap:10px;margin-top:16px;font:600 16px/1 I"><span style="background:#1f1a16;color:#fff;border-radius:999px;padding:11px 18px">Save</span><span style="border:1.5px solid #cfc6bb;border-radius:999px;padding:11px 18px;color:#1f1a16">Directions</span></div></div>
  ${T(64, 84, 'New<br>favourite<br>coffee spot', { size: 58 })}
  ${SCRIPT(160, 290, 'save us', { size: 92, rot: -6 })}
  ${AR(1016, 96, 'احفظ اللوكيشن<br>وتعالى', { size: 38, w: 400 })}
  <img class="abs" src="${SRC}hand-cup.webp" style="right:-70px;bottom:-60px;width:600px;filter:drop-shadow(0 24px 30px rgba(101,61,38,.28))">`) }]);

/* 03 · Every relationship has a Refill story */
add('03-refill-stories', [
  { w: 2160, h: 1350, split: 2, html: page(2160, 1350, `
    <img class="abs" src="${SRC}story-friends.jpg" style="left:760px;top:0;width:1400px;height:1350px;object-fit:cover;object-position:46% 50%">
    <div class="abs" style="left:0;top:0;width:860px;height:1350px;background:${BROWN}"></div>
    ${SCRIPT(70, 300, 'every relationship', { color: CARAMEL, size: 110, w: 760 })}
    ${T(74, 450, 'has a<br>Refill story', { color: CREAM, size: 86, w: 760 })}
    ${AR(790, 700, 'كل علاقة ليها<br>حكاية في ريفيل', { color: CARAMEL, size: 40, w: 600 })}
    ${SM(74, 74, '“Just a quick coffee”', { color: CARAMEL })}
    ${SM(74, 1260, 'Swipe', { color: CARAMEL })}
    ${SCRIPT(2096, 1110, 'three hours later', { color: CREAM, align: 'right', size: 88, w: 900, lit: true })}
    ${AR(1150, 1232, 'قهوة سريعة، وبعدها ٣ ساعات', { color: CREAM, align: 'left', size: 30, w: 600, lit: true })}`) },
  { html: page(1080, 1350, `${IMG('story-couple.jpg', '50% 40%')}
    ${T(540, 52, 'Their love language?', { align: 'center', size: 40 })}
    ${SCRIPT(540, 1150, 'knowing each other’s order', { color: CREAM, align: 'center', size: 76, w: 1040, lit: true })}
    ${AR(1016, 1262, 'بيحفظوا طلبات بعض', { color: CREAM, size: 30, lit: true })}`) },
  { html: page(1080, 1350, `${IMG('story-laptop.jpg', '50% 40%')}
    ${T(48, 56, 'Running on', { color: CREAM, size: 44, lit: true })}
    ${T(1032, 56, 'deadlines', { align: 'right', size: 44 })}
    ${T(48, 1160, 'a flat white', { color: CREAM, size: 44, lit: true })}
    ${SCRIPT(1032, 1190, 'and hope', { color: CREAM, align: 'right', size: 100, lit: true })}
    ${AR(48, 1236, 'ديدلاين، فلات وايت، وأمل', { color: CREAM, align: 'left', size: 28, lit: true })}`) },
  { html: page(1080, 1350, `${IMG('story-matcha.jpg', '50% 40%')}
    ${T(1030, 80, 'Not<br>waiting<br>for<br>anyone', { align: 'right', size: 42, w: 300 })}
    ${SCRIPT(50, 1160, 'just her matcha', { color: CREAM, size: 92, lit: true })}
    ${AR(1030, 1250, 'مستنية الماتشا بس', { color: CREAM, size: 30, lit: true })}`) },
]);

/* 04 · Good mornings: script over the window, the line on the drip tray */
add('04-good-mornings', [{ html: page(1080, 1350, `${IMG('morning-espresso.jpg', '50% 55%')}
  ${SCRIPT(1030, 40, 'good<br>mornings', { color: CREAM, align: 'right', size: 104, w: 460, lit: true })}
  ${T(1020, 410, 'begin<br>with good<br>coffee', { color: CREAM, align: 'right', size: 44, w: 360, lit: true })}
  ${SM(60, 1270, '07:00 El Shorouk', { color: CREAM, lit: true })}
  ${AR(1020, 1256, 'الصبح الحلو بيبدأ بقهوة حلوة', { color: CREAM, size: 28, lit: true })}`) }]);

/* 05 · Something to sip, something to bite: words placed beside what they name */
add('05-sip-and-bite', [{ html: page(1080, 1350, `${IMG('sip-bite.jpg', '50% 60%')}
  ${T(64, 440, 'Something', { color: CREAM, size: 46, lit: true })}
  ${SCRIPT(90, 486, 'to sip', { color: CREAM, size: 96, lit: true })}
  ${T(1016, 440, 'Something', { color: CREAM, align: 'right', size: 46, lit: true })}
  ${SCRIPT(990, 486, 'to bite', { color: CREAM, align: 'right', size: 96, lit: true })}
  ${AR(540, 1268, 'حاجة تشربها، وحاجة تاكلها', { align: 'center', size: 28, w: 600 })}`) }]);

/* 06 · Good coffee for everyone: the cup as a window */
add('06-good-coffee-for-everyone', [{ html: page(1080, 1350, `
  <div class="abs" style="inset:0;background:${BROWN}"></div>
  ${cupWindow(SRC + 'cups-pile.jpg', 540, 300, 560, CREAM)}
  ${SM(64, 64, 'Good coffee', { color: CREAM })}${SM(1016, 64, 'For everyone', { color: CREAM, align: 'right' })}
  ${SM(64, 1270, 'Refill', { color: CREAM })}${AR(1016, 1258, 'قهوة حلوة للكل', { color: CREAM, size: 26 })}
  ${SCRIPT(540, 1080, 'one for everyone', { color: CARAMEL, align: 'center', size: 80 })}`) }]);

/* coaster and pass artwork printed onto the photos */
const coasterPrint = (side) => {
  const m = cover(1856, 2304), cx = m.ox + 1354 * m.k, cy = m.oy + 1590 * m.k, r = 290 * m.k, front = side === 'front';
  return `<div class="abs" style="left:${cx - r}px;top:${cy - r}px;width:${2 * r}px;height:${2 * r}px;border-radius:50%;display:grid;place-items:center;mix-blend-mode:multiply;color:${BROWN};transform:rotate(-8deg)">
    <div style="display:grid;justify-items:center;gap:${r * 0.09}px;opacity:.92">
      <i style="display:block;width:${r * 0.48}px;height:${r * 0.48}px">${front ? CUP(BROWN, 6) : CUP_FILL(1, BROWN, BROWN, 6)}</i>
      <b style="font:700 ${r * 0.11}px/1 M;letter-spacing:.3em;margin-right:-.3em">${front ? 'STILL SIPPING' : 'REFILL ME'}</b>
      <span class="ar" style="font-size:${r * 0.12}px;text-align:center">${front ? 'لسه بشرب' : 'املاها تاني'}</span>
    </div></div>`;
};

/* 07 · Teaser */
add('07-teaser-flip-it', [{ html: page(1080, 1350, `${IMG('coaster-empty.jpg')}${coasterPrint('back')}
  ${T(1016, 90, 'Flip', { align: 'right', size: 170, w: 600 })}
  ${SCRIPT(1016, 270, 'it', { align: 'right', size: 150, w: 400 })}
  ${SM(64, 1270, 'Monday')}${AR(64, 1256, 'اقلبها يوم الاتنين', { align: 'left', size: 26, w: 500 })}`) }]);

/* 08 · The Winter Refill: swipe = flip */
add('08-the-winter-refill', [
  { html: page(1080, 1350, `${IMG('coaster-empty.jpg')}${coasterPrint('front')}
    ${T(1016, 96, 'Finished<br>your hot<br>chocolate?', { align: 'right', size: 56, w: 500 })}
    ${AR(1016, 320, 'خلّصتها؟', { size: 40 })}
    ${SCRIPT(140, 1060, 'flip it', { size: 110, rot: -8 })}`) },
  { html: page(1080, 1350, `${IMG('coaster-empty.jpg')}${coasterPrint('back')}
    ${T(1016, 96, 'Flip the<br>coaster', { align: 'right', size: 56, w: 500 })}
    ${AR(1016, 250, 'اقلب الكوستر', { size: 40 })}
    ${SCRIPT(120, 1060, 'refill me', { size: 110, rot: -8 })}`) },
  { html: page(1080, 1350, `${IMG('pour.jpg', '50% 45%')}
    ${T(48, 56, 'We bring', { color: CREAM, size: 48, lit: true })}
    ${T(1032, 56, 'the pot', { color: CREAM, align: 'right', size: 48, lit: true })}
    ${SCRIPT(48, 1170, 'at your table', { color: CREAM, size: 90, lit: true })}
    ${AR(1032, 1250, 'وإحنا نملاها', { color: CREAM, size: 32, lit: true })}`) },
  { html: page(1080, 1350, `
    <div class="abs" style="inset:0;background:${BROWN}"></div>
    ${SM(64, 64, 'Hot chocolate', { color: CARAMEL })}${SM(1016, 64, 'All winter', { color: CARAMEL, align: 'right' })}
    <div class="abs" style="left:440px;top:240px;width:200px;height:200px">${CUP_FILL(0.8, CREAM, CARAMEL, 5)}</div>
    ${T(540, 560, 'The Winter<br>Refill', { color: CREAM, align: 'center', size: 112 })}
    ${SCRIPT(540, 800, 'finish it, we’ll refill it', { color: CARAMEL, align: 'center', size: 84, w: 1000 })}
    ${AR(540, 930, 'ريفيل الشتا', { color: CREAM, align: 'center', size: 42, w: 500 })}
    ${SM(64, 1270, 'Dine-in', { color: CARAMEL })}${SM(1016, 1270, 'One refill per cup', { color: CARAMEL, align: 'right' })}`) },
]);

/* 09 · The Winter Refill Pass: swipe = fill */
const passFront = () => {
  const m = cover(1856, 2304), w = 880 * m.k, h = 580 * m.k, x = m.ox + 704 * m.k - w / 2, y = m.oy + 1638 * m.k - h / 2;
  return `<div class="abs" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;padding:${h * 0.11}px ${w * 0.07}px;display:grid;grid-template-rows:auto 1fr auto;color:#F1E7DA;mix-blend-mode:screen;opacity:.9;transform:rotate(3.4deg)">
    <div style="display:flex;justify-content:space-between;align-items:center"><span style="font:700 ${h * 0.06}px/1 M;letter-spacing:.5em">REFILL</span><i style="width:${h * 0.12}px;height:${h * 0.12}px;display:block">${CUP('#F1E7DA', 8)}</i></div>
    <p style="align-self:end;font:700 ${h * 0.12}px/1.02 M;text-transform:uppercase"><span style="display:block;font:400 ${h * 0.05}px/1 C;color:#D8C2A6;margin-bottom:${h * 0.05}px;text-transform:none">Winter 2026 · No. 0247</span>The Winter<br>Refill Pass</p>
    <div style="display:flex;justify-content:space-between;font:400 ${h * 0.055}px/1 I;color:#D8C2A6;margin-top:${h * 0.06}px"><span>Five cups to full.</span><span class="ar">خمس كوبايات وتتملي</span></div>
  </div>`;
};
const fillSlide = (n, k, line, ar) => page(1080, 1350, `
  <div class="abs" style="inset:0;background:${BROWN}"></div>
  ${SM(64, 64, 'Cup 0' + n, { color: CARAMEL })}${T(1016, 52, Math.round(k * 100) + '%', { color: CREAM, align: 'right', size: 64, w: 400 })}
  <div class="abs" style="left:50%;top:300px;transform:translateX(-50%);width:560px;height:560px">${CUP_FILL(k, CREAM, CARAMEL, 4.2)}</div>
  ${T(64, 1150, line, { color: CREAM, size: 46, w: 700 })}
  ${AR(1016, 1160, ar, { color: CARAMEL, size: 36 })}`);
add('09-winter-refill-pass', [
  { html: page(1080, 1350, `${IMG('pass-flatlay.jpg')}${passFront()}
    ${T(64, 440, 'Five cups<br>to full', { size: 54, w: 400 })}
    ${SCRIPT(70, 572, 'your winter pass', { size: 62, w: 440 })}
    ${AR(64, 652, 'خمس كوبايات وتتملي', { align: 'left', size: 28, w: 420 })}`) },
  { html: fillSlide(1, 0.2, 'A good start', 'بداية حلوة') },
  { html: fillSlide(2, 0.4, 'A regular now', 'بقيت من أهل المكان') },
  { html: fillSlide(3, 0.6, 'The barista<br>knows your name', 'الباريستا عارف اسمك') },
  { html: fillSlide(4, 0.8, 'One more', 'واحدة كمان') },
  { html: fillSlide(5, 1, 'Fully refilled', 'اتملت على الآخر') },
  { html: page(1080, 1350, `
    ${SCRIPT(540, 260, 'cup six', { align: 'center', size: 170 })}
    ${T(540, 480, 'is on us', { align: 'center', size: 110 })}
    ${AR(540, 640, 'السادسة علينا', { align: 'center', size: 48, w: 600 })}
    ${SM(64, 1270, 'Ask at the bar', { color: GREY })}${SM(540, 1270, 'One stamp per cup', { color: GREY, align: 'center', w: 400 })}${SM(1016, 1270, 'Until February', { color: GREY, align: 'right' })}`) },
]);

/* 10 · What's your coffee personality? */
const persona = [
  ['p-spanish', 'Spanish latte', 'Sweet talker'], ['p-caramel', 'Caramel latte', 'Main character'],
  ['p-cappuccino', 'Cappuccino', 'A classic'], ['p-flatwhite', 'Flat white', 'Quietly particular'],
  ['p-hotchoc', 'Hot chocolate', 'Soft heart'], ['p-matcha', 'Iced matcha', 'Unbothered'],
];
add('10-coffee-personality', [{ html: page(1080, 1350, `
  <div class="abs" style="inset:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr)">
    ${persona.map(([f, n, l], i) => `<div style="position:relative;overflow:hidden"><img src="${SRC}${f}.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      <p class="b" style="position:absolute;${i % 2 ? 'right' : 'left'}:28px;top:24px;text-align:${i % 2 ? 'right' : 'left'};font-size:22px;color:${BROWN}">${n}<br><span class="s" style="font-size:40px;text-transform:none;display:block;margin-top:2px">${l}</span></p></div>`).join('')}
  </div>
  <div class="abs" style="left:50%;top:50%;transform:translate(-50%,-50%);width:430px;height:300px;background:${BROWN};color:${CREAM};display:grid;place-items:center;text-align:center">
    <div><p class="b" style="font-size:34px">What’s your<br>coffee personality?</p><p class="ar" style="font-size:26px;margin-top:14px;color:${CARAMEL}">إنت مين فيهم؟</p></div>
  </div>`) }]);

/* 11 · What can you order at Refill? */
const behind = (word, cut, items, ar, cutW = 600, wordSize = 210) => (wordSize = Math.min(wordSize, Math.floor(1010 / (word.length * 0.8))), page(1080, 1350, `
  <div class="abs" style="inset:0;background:${CREAM}"></div>
  ${T(540, 470, word, { align: 'center', size: wordSize, w: 1200, color: CARAMEL })}
  <img class="abs" src="${cut}" style="left:50%;top:260px;transform:translateX(-50%);width:${cutW}px;filter:drop-shadow(0 28px 26px rgba(101,61,38,.28))">
  ${SM(64, 64, items[0])}${SM(1016, 64, items[1], { align: 'right' })}${SM(64, 1270, items[2])}${SM(1016, 1270, items[3], { align: 'right' })}
  ${SCRIPT(540, 1000, 'what’s inside', { align: 'center', size: 84 })}
  ${AR(540, 1130, ar, { align: 'center', size: 36, w: 600 })}`));
add('11-what-can-you-order', [
  { html: page(1080, 1350, `
    <div class="abs" style="inset:0;background:${CREAM}"></div>
    ${cupWindow(SRC + 'lineup.jpg', 540, 330, 620, BROWN, '40% 60%')}
    ${T(64, 70, 'What can<br>you order', { size: 60 })}
    ${T(1016, 70, 'at<br>Refill?', { size: 60, align: 'right', w: 400 })}
    ${AR(540, 1250, 'تطلب إيه من ريفيل؟', { align: 'center', size: 32, w: 600 })}`) },
  { html: behind('Caramel', SRC + 'cut-caramel.webp', ['Espresso', 'Steamed milk', 'Caramel sauce', 'Caramel syrup'], 'كراميل لاتيه', 520) },
  { html: behind('Cocoa', SRC + 'cut-hotchoc.webp', ['Dark chocolate', 'Milk', 'Whipped cream', 'Cocoa'], 'هوت شوكليت', 600, 250) },
  { html: behind('Butter', SRC + 'cut-croissant.webp', ['Flour', 'French butter', 'Milk', 'Yeast'], 'كرواسون بالزبدة', 560, 250) },
  { html: page(1080, 1350, `
    <div class="abs" style="inset:0;background:${BROWN}"></div>
    ${SCRIPT(64, 70, 'and', { color: CARAMEL, size: 110 })}
    ${T(64, 190, 'a lot more', { color: CREAM, size: 92 })}
    ${AR(1016, 230, 'ولسه في كتير', { color: CARAMEL, size: 38 })}
    <div class="abs" style="left:40px;right:40px;top:380px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
      ${['flatwhite', 'cruffin', 'plaster', 'cheesecake', 'spanish', 'cardamom'].map(f => `<img src="${MENU}${f}.webp" style="width:100%;filter:drop-shadow(0 14px 14px rgba(0,0,0,.25))">`).join('')}</div>
    ${SM(64, 1270, 'Full menu, link in bio', { color: CARAMEL })}${SM(1016, 1270, 'Refill', { color: CARAMEL, align: 'right' })}`) },
]);

/* 12 · The longest night: vertical type up the window */
add('12-longest-night', [{ html: page(1080, 1350, `${IMG('night-bar.jpg')}
  <div class="abs b" style="left:60px;top:1260px;transform:rotate(-90deg);transform-origin:left top;font-size:58px;color:${CREAM};white-space:nowrap">The longest night</div>
  ${SM(150, 64, '21 December', { color: CREAM })}
  ${SCRIPT(150, 560, 'deserves the<br>longest refill', { color: CREAM, size: 76, w: 520, lit: true })}
  ${T(150, 170, 'Refills<br>all evening', { color: CREAM, size: 44, w: 400 })}
  ${AR(150, 290, 'أطول ليلة في السنة،<br>وأطول ريفيل', { color: CREAM, align: 'left', size: 28, w: 400 })}`) }]);

/* 13 · The Hot Chocolate Atelier: every dish labelled where it sits */
add('13-hot-chocolate-atelier', [{ html: page(1080, 1350, `${IMG('atelier.jpg', '50% 50%', 1.06)}
  ${SM(392, 205, 'Orange')}${SM(195, 300, 'Sea salt', { align: 'right', w: 200 })}${SM(930, 340, 'Pistachio', { align: 'right', w: 200 })}
  ${SM(104, 545, 'Zest', { w: 200 })}${SM(1010, 570, 'Tahini & date', { align: 'right', w: 260 })}
  ${SM(150, 1060, 'Marshmallow', { w: 260 })}${SM(1000, 1020, 'Cardamom', { align: 'right', w: 260 })}
  ${SCRIPT(540, 640, 'your name', { color: CREAM, align: 'center', size: 64, lit: true })}
  ${T(64, 64, 'Build it.<br>Name it.', { size: 46 })}
  ${T(1016, 64, 'We write it<br>on your cup', { size: 26, align: 'right', w: 400 })}
  ${AR(1016, 1250, 'اعملها وسمّيها', { size: 32 })}
  ${SM(64, 1270, 'The hot chocolate atelier')}`) }]);

/* 14 · Refill notes */
const slip = (no, en, ar, win, rot = -2.5) => page(1080, 1350, `
  <div class="abs" style="inset:0;background:${BROWN}"></div>
  ${SM(64, 64, 'Refill note', { color: CARAMEL })}${SM(1016, 64, 'No. ' + no, { color: CARAMEL, align: 'right' })}
  <div class="abs" style="left:50%;top:50%;transform:translate(-50%,-52%) rotate(${rot}deg);width:860px;background:#F6EFE3;padding:56px 60px 52px;box-shadow:0 10px 24px rgba(0,0,0,.35)">
    <p style="font:400 20px/1 C;color:${GREY};display:flex;justify-content:space-between"><span>REFILL NOTE No. ${no}</span><span>${win ? 'WINNER' : 'EL SHOROUK'}</span></p>
    <p style="font:400 56px/1.18 C;color:#2a2420;margin-top:34px;letter-spacing:-.01em">${en}</p>
    <p class="ar" style="font-size:34px;margin-top:26px;color:${BROWN};font-weight:400">${ar}</p>
  </div>
  ${SCRIPT(540, 1150, 'a little fortune', { color: CARAMEL, align: 'center', size: 72 })}`);
add('14-refill-notes', [
  { html: page(1080, 1350, `${IMG('note.jpg', '50% 60%')}
    ${T(1016, 84, 'Every cup<br>comes with<br>a note', { color: CREAM, align: 'right', size: 52, w: 500, lit: true })}
    ${AR(1016, 300, 'كل كوباية معاها ورقة', { color: CREAM, size: 30, lit: true })}
    ${SCRIPT(64, 1180, 'one in twenty wins', { size: 76 })}`) },
  { html: slip('03', 'Today is a two-cup kind of day.', 'النهارده يوم كوبايتين') },
  { html: slip('11', 'Text them first.', 'ابعتله إنت الأول', false, 1.8) },
  { html: slip('17', 'Someone in this room likes your sweater.', 'في حد هنا عاجبه البلوفر بتاعك', false, -1.2) },
  { html: slip('20', 'This one’s on us. Show this note at the bar.', 'دي علينا. ورّي الورقة للباريستا', true, 2.4) },
  { html: page(1080, 1350, `
    ${SCRIPT(540, 330, 'what did', { align: 'center', size: 170 })}
    ${T(540, 560, 'yours say?', { align: 'center', size: 110 })}
    ${AR(540, 720, 'ورقتك قالت إيه؟', { align: 'center', size: 48, w: 600 })}
    ${SM(64, 1270, 'Tag us', { color: GREY })}${SM(1016, 1270, '#RefillElShorouk', { color: GREY, align: 'right' })}`) },
]);

/* 15 · The last refill of 2026: two words flanking the clink */
add('15-last-refill-of-2026', [{ html: page(1080, 1350, `${IMG('nye.jpg', '50% 50%')}
  ${SCRIPT(540, 300, 'see you in 2027', { color: CREAM, align: 'center', size: 96, lit: true })}
  ${T(48, 720, 'Last<br>refill', { color: CREAM, size: 58, lit: true })}
  ${T(1032, 720, 'of<br>2026', { color: CREAM, size: 58, align: 'right', lit: true })}
  ${SM(64, 64, '31 December', { color: CREAM })}
  ${AR(1016, 1250, 'آخر ريفيل في ٢٠٢٦', { color: CREAM, size: 30, lit: true })}`) }]);

/* 16 · The receipt (the receipt is the type) */
const rcpt = (l, r = '', b = false) => `<div class="rr${b ? ' b2' : ''}"><span>${l}</span><span>${r}</span></div>`;
const receiptCss = `
.rc{position:absolute;font:400 18px/1.5 C;color:#262321;mix-blend-mode:multiply;opacity:.9;filter:blur(.25px);letter-spacing:.02em}
.rr{display:flex;justify-content:space-between;gap:10px}.rr.b2{font-weight:700}
.rc hr{border:0;border-top:2px dashed #262321;margin:10px 0;opacity:.75}
.rc .c{text-align:center}
.bars{height:46px;margin:14px 10px 0;background:repeating-linear-gradient(90deg,#262321 0 2px,transparent 2px 4px,#262321 4px 7px,transparent 7px 9px,#262321 9px 10px,transparent 10px 14px)}`;
{
  const m = cover(1856, 2304), k = m.k * 1.6, left = 540 - 930 * k, top = 60 - 420 * k;
  add('16-the-receipt', [{ html: page(1080, 1350, `
    <img class="abs" src="${SRC}receipt-hand.jpg" style="left:${left}px;top:${top}px;width:${1856 * k}px;height:${2304 * k}px">
    <div class="rc" style="left:341px;top:215px;width:350px;transform:rotate(.7deg)">
      <div class="c"><i style="display:inline-block;width:40px;height:40px">${CUP('#262321', 8)}</i></div>
      <p class="c" style="font-weight:700;letter-spacing:.5em;margin:6px 0 0 .5em">REFILL</p>
      <p class="c" style="font-size:15px">SPECIALITY COFFEE · EL SHOROUK</p>
      <hr>${rcpt('TABLE 04', 'SAT 08:41')}${rcpt('ORDER', '#0001')}<hr>
      ${rcpt('1 FLAT WHITE', '135')}${rcpt('1 BUTTER CROISSANT', '95')}${rcpt('1 WINDOW SEAT', 'FREE')}
      ${rcpt('1 "JUST 5 MINUTES"', '3 HRS')}${rcpt('1 BAD MOOD', 'REMOVED')}${rcpt('1 REFILL', 'YES')}<hr>
      ${rcpt('TOTAL', '230 EGP', true)}${rcpt('CHANGE', 'A BETTER DAY')}<hr>
      <p class="c">THANK YOU. COME BACK HUNGRY.</p>
      <p class="c ar" style="font-size:20px;text-align:center;font-weight:400">شكراً ونورتنا</p>
      <div class="bars"></div>
    </div>
    ${SCRIPT(1040, 1180, 'your receipt', { align: 'right', size: 80, color: CREAM, lit: true })}`, receiptCss) }]);
}

/* 17 · Anatomy of a croissant */
const callout = (x, y, lx, ly, title, sub, align = 'left') => `
  <svg class="abs" style="left:0;top:0;z-index:3" width="1080" height="1350"><path d="M${lx} ${ly + 12} L${lx} ${ly + 34} L${x} ${y}" fill="none" stroke="${CREAM}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="6" fill="${CREAM}"/></svg>
  <div class="abs" style="${align}:${align === 'left' ? lx - 2 : 1080 - lx - 2}px;top:${ly - 58}px;text-align:${align};z-index:4;width:250px;color:${CREAM}">
    <p class="sm">${title}</p><p class="s" style="font-size:34px;margin-top:2px">${sub}</p></div>`;
add('17-anatomy-of-a-croissant', [
  { html: page(1080, 1350, `${IMG('croissant-tear.jpg', '50% 45%')}
    ${T(48, 60, 'We tore', { color: CREAM, size: 52, lit: true })}
    ${T(1032, 560, 'one<br>open', { color: CREAM, align: 'right', size: 52, w: 300, lit: true })}
    ${SCRIPT(48, 1120, 'for science', { color: CREAM, size: 104, lit: true })}
    ${AR(1032, 1250, 'فتحناها للعلم', { color: CREAM, size: 30, lit: true })}`) },
  { html: page(1080, 1350, `${IMG('croissant-cut.jpg', '50% 50%', 1.04)}
    ${T(64, 70, 'Cut open', { color: CREAM, size: 60 })}
    ${callout(330, 560, 66, 360, 'Crust', 'shattered')}
    ${callout(470, 790, 400, 360, 'Honeycomb', 'open')}
    ${callout(800, 700, 1014, 360, 'Layers', 'folded by hand', 'right')}
    ${SM(1016, 1270, 'Three days from dough to oven', { color: CREAM, align: 'right' })}`) },
  { html: page(1080, 1350, `${IMG('croissant-lamination.jpg', '50% 40%')}
    ${SM(64, 64, 'Day 01 · the dough rests', { color: CREAM })}
    ${SM(1016, 64, 'Day 02 · butter folded in', { align: 'right' })}
    ${SM(1016, 1270, 'Day 03 · baked at dawn', { align: 'right' })}
    ${SCRIPT(64, 1150, 'by hand', { color: CREAM, size: 110, lit: true })}`) },
  { html: page(1080, 1350, `${IMG('croissant-tray.jpg')}
    ${T(1020, 1150, 'By 11:00 this is<br>all that’s left', { color: CREAM, align: 'right', size: 46, lit: true })}
    ${AR(1020, 1262, 'الساعة ١١، ده اللي بيفضل', { color: CREAM, size: 28, w: 600, lit: true })}`) },
  { html: page(1080, 1350, `
    <div class="abs" style="inset:0;background:${CREAM}"></div>
    ${T(540, 170, 'Come', { align: 'center', size: 250, w: 1200, color: CARAMEL })}
    ${T(540, 830, 'early', { align: 'center', size: 250, w: 1200, color: CARAMEL })}
    <img class="abs" src="${MENU}croissant.webp" style="left:50%;top:300px;transform:translateX(-50%) rotate(-8deg);width:720px;filter:drop-shadow(0 28px 26px rgba(101,61,38,.28))">
    ${SM(64, 64, 'Butter croissant')}${SM(1016, 64, '07:00 & 19:00', { align: 'right' })}
    ${AR(540, 1240, 'تعالى بدري', { align: 'center', size: 40, w: 600 })}`) },
]);

/* 18 · Texts from your coffee (lock-screen UI) */
const lockCss = `
.ls-date{font:500 30px/1 I;color:#FBF9F4;text-align:center;text-shadow:0 1px 12px rgba(0,0,0,.2)}
.ls-time{font:600 190px/1 I;color:#FBF9F4;text-align:center;letter-spacing:-.04em;margin-top:6px;text-shadow:0 2px 20px rgba(0,0,0,.2)}
.nt{background:rgba(246,241,233,.62);-webkit-backdrop-filter:blur(28px) saturate(1.4);backdrop-filter:blur(28px) saturate(1.4);border-radius:34px;padding:22px 26px;display:grid;grid-template-columns:74px 1fr;gap:18px;align-items:center}
.nt + .nt{margin-top:12px}
.nt .ic{width:74px;height:74px;border-radius:18px;background:${BROWN};display:grid;place-items:center}
.nt .ic i{width:42px;height:42px;display:block}
.nt .hd2{display:flex;justify-content:space-between;font:600 24px/1.2 I;color:#1d1813}
.nt .hd2 span{font-weight:400;color:#5a5048}
.nt .bd{font:400 25px/1.32 I;color:#1d1813;margin-top:4px}`;
const notif = (when, body) => `<div class="nt"><div class="ic"><i>${CUP(CREAM, 9)}</i></div><div><div class="hd2">Refill<span>${when}</span></div><div class="bd">${body}</div></div></div>`;
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
add('19-reel-cover-our-logo-poured', [{ html: page(1080, 1350, `${IMG('latte-logo.jpg')}
  <div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(60,34,20,.62) 0%,rgba(60,34,20,0) 26%,rgba(60,34,20,0) 72%,rgba(60,34,20,.66) 100%)"></div>
  ${T(48, 56, 'We poured', { color: CREAM, size: 54 })}
  ${SCRIPT(1032, 50, 'watch closely', { color: CARAMEL, size: 74, align: 'right', w: 600 })}
  ${T(1032, 1226, 'our logo', { color: CREAM, size: 54, align: 'right' })}
  ${AR(48, 1240, 'صبّينا اللوجو', { color: CREAM, align: 'left', size: 32, w: 500 })}`) }]);

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
      for (let k = 0; k < (s.split || 1); k++) {
        await p.screenshot({ path: path.join(dir, String(n).padStart(2, '0') + '.jpg'), type: 'jpeg', quality: 95, clip: { x: k * 1080, y: 0, width: 1080, height: h } });
        n++;
      }
      await p.close();
    }
    console.log('rendered', post.id, n - 1, 'slides');
  }
  await b.close();
})();
