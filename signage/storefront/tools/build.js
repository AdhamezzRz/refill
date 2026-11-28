// REFILL · storefront sign: production PDF for the sign manufacturer.
//   node signage/storefront/tools/build.js [overall width in cm, default 200] [one-line]
//   one-line = SPECIALTY COFFEE on a single line; the files get the suffix -one-line
// → out/REFILL-storefront-sign-production.pdf (A3 landscape, 4 sheets, vector), out/REFILL-storefront-sign-logo.pdf (the logo alone in its final look)
//   and out/refill-sign-artwork.svg (outlines only, 1 unit = 1 cm)
//
// The artwork is taken from the identity file (src/identity-logo-page.svg, exported from page 5 of REFILLL_IDENTITY.pdf):
// the same Montserrat Bold outlines and the same cup. Two things are corrected for fabrication:
//   • in the identity file "REFILL" and "COFFEE" sit 0.34° off level; here every line is level
//   • the cup, "REFILL" and the two tagline lines are centred on one axis (they are 2–3 px apart in the file)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'out');
const WCM = Number(process.argv[2]) || 200;
const ONE = process.argv.includes('one-line');   // SPECIALTY COFFEE on one line instead of two
const SUF = ONE ? '-one-line' : '';
const BROWN = '#653d26', CARAMEL = '#c7ad91', GREY = '#8e847e', CREAM = '#f2e9db', INK = '#1d1410';

/* ---------- 1. the artwork, rebuilt level and centred, in "logo units" ---------- */
const svgSrc = fs.readFileSync(path.join(ROOT, 'src', 'identity-logo-page.svg'), 'utf8');
const glyph = {}; for (const m of svgSrc.matchAll(/<g id="(glyph-\d+-\d+)">\s*<path d="([^"]+)"/g)) glyph[m[1]] = m[2];
const TILT = Math.atan2(608.361153 - 605.7109, 1155.579247 - 710.1696);   // 0.34° in the identity file
function tf(d, rot, tx, ty) {   // absolute M/L/C/Z path → rotated by -rot and moved; returns [d, bbox]
  const c = Math.cos(rot), s = Math.sin(rot), bb = [1e9, 1e9, -1e9, -1e9]; let out = '';
  for (const seg of d.trim().split(/(?=[MLCZ])/)) {
    const cmd = seg[0], n = (seg.slice(1).match(/-?\d+\.?\d*/g) || []).map(Number);
    out += cmd;
    for (let i = 0; i < n.length; i += 2) {
      const x = n[i] * c + n[i + 1] * s + tx, y = -n[i] * s + n[i + 1] * c + ty;
      bb[0] = Math.min(bb[0], x); bb[1] = Math.min(bb[1], y); bb[2] = Math.max(bb[2], x); bb[3] = Math.max(bb[3], y);
      out += (i ? ' ' : '') + x.toFixed(3) + ' ' + y.toFixed(3);
    }
  }
  return [out.replace(/M[\d. -]+Z?$/, m => /Z$/.test(m) ? 'Z' : ''), bb];
}
function line(ids, xs, rot, baseline, letters) {   // a row of glyphs on a level baseline, later centred on the axis
  const rt = i => Array.isArray(rot) ? rot[i] : rot;
  const raw = ids.map((id, i) => tf(glyph[id], rt(i), xs[i] - xs[0], baseline));
  const x0 = Math.min(...raw.map(r => r[1][0])), x1 = Math.max(...raw.map(r => r[1][2]));
  return { w: x1 - x0, place: cx => ids.map((id, i) => { const [d, bb] = tf(glyph[id], rt(i), xs[i] - xs[0] - x0 + cx - (x1 - x0) / 2, baseline); return { d, bb, ch: letters[i] }; }) };
}
const TOP = 363.16;   // top of the lid in the identity page
const refill = line(['glyph-0-0', 'glyph-0-1', 'glyph-0-2', 'glyph-0-3', 'glyph-0-4', 'glyph-0-4'],
  [710.1696, 811.744836, 907.592482, 1000.576332, 1065.727673, 1155.579247], TILT, 607.036 - TOP, 'REFILL');
// The identity file spells the tagline SPECIALITY; the sign uses SPECIALTY (the client's spelling, as on Google and the website).
// Same glyphs and tracking, without the second I. L→T uses Montserrat Bold's own kerning for that pair (-75/1000 em = 1.95 units).
const SPEC_IDS = ['glyph-2-0', 'glyph-2-1', 'glyph-2-2', 'glyph-2-3', 'glyph-2-4', 'glyph-2-5', 'glyph-2-6', 'glyph-2-7', 'glyph-2-8'];
const SPEC_X = [844.6431, 868.743603, 895.00236, 919.950749, 946.260893, 962.396411, 989.785682, 1011.062682, 1034.315299];
const COF_IDS = ['glyph-1-0', 'glyph-1-1', 'glyph-1-2', 'glyph-1-2', 'glyph-1-3', 'glyph-1-3'];
const COF_X = [884.6978, 910.210949, 939.603741, 963.729468, 987.855195, 1012.803098];
// One line: COFFEE follows SPECIALTY on the same baseline after one word space with the same tracking
// (Montserrat Bold: Y advance 17.579 + tracking 7.5, space 7.359 + tracking 7.5, at this type size).
const COF_START = SPEC_X[8] + 25.079 + 14.859;
const spec = ONE
  ? line([...SPEC_IDS, ...COF_IDS], [...SPEC_X, ...COF_X.map(x => x - COF_X[0] + COF_START)], [...SPEC_IDS.map(() => 0), ...COF_IDS.map(() => TILT)], 673.9082 - TOP, 'SPECIALTYCOFFEE')
  : line(SPEC_IDS, SPEC_X, 0, 673.9082 - TOP, 'SPECIALTY');
const coffee = ONE ? { place: () => [] } : line(COF_IDS, COF_X, TILT, 703.804 - TOP, 'COFFEE');
const WU = refill.w, CX = WU / 2;   // the wordmark is the widest element: it sets the overall width
const LID = { w: 125.70, h: 14.29 }, CUP = { ro: 63.375, ri: 49.13, top: 26.86, itop: 41.15, yc: 79.23 };
const r3 = n => n.toFixed(3);
const lidD = `M${r3(CX - LID.w / 2)} 0H${r3(CX + LID.w / 2)}V${LID.h}H${r3(CX - LID.w / 2)}Z`;
const cupD = `M${r3(CX - CUP.ro)} ${CUP.top}H${r3(CX + CUP.ro)}V${CUP.yc}A${CUP.ro} ${CUP.ro} 0 0 1 ${r3(CX - CUP.ro)} ${CUP.yc}Z` +
  `M${r3(CX - CUP.ri)} ${CUP.itop}V${CUP.yc}A${CUP.ri} ${CUP.ri} 0 0 0 ${r3(CX + CUP.ri)} ${CUP.yc}V${CUP.itop}Z`;
const R = refill.place(CX), SP = spec.place(CX), CO = coffee.place(CX);
const HU = Math.max(...[...SP, ...CO].map(g => g.bb[3]));   // overall height in units
const bbOf = gs => [Math.min(...gs.map(g => g.bb[0])), Math.min(...gs.map(g => g.bb[1])), Math.max(...gs.map(g => g.bb[2])), Math.max(...gs.map(g => g.bb[3]))];
const bR = bbOf(R), bS = bbOf(SP), bC = ONE ? [0, 0, 0, 0] : bbOf(CO), capS = 18.203, capR = 62.65;
const art = (fill, stroke = 'none', sw = 0) => `<g fill="${fill}" stroke="${stroke}" stroke-width="${sw}" fill-rule="evenodd" stroke-linejoin="round"><path d="${lidD}"/><path d="${cupD}"/>` +
  [...R, ...SP, ...CO].map(g => `<path d="${g.d}"/>`).join('') + '</g>';

/* ---------- 2. real sizes ---------- */
const K = WCM / WU;                         // cm per unit
const cm = (u, dp = 1) => (u * K).toFixed(dp);
const dims = W => { const k = W / WU, f = (u, dp = 1) => (u * k).toFixed(dp); return { W: f(WU, 0), H: f(HU), iconW: f(CUP.ro * 2), iconH: f(CUP.yc + CUP.ro), lidT: f(LID.h), wall: f(CUP.ro - CUP.ri), refillH: f(capR), stem: f(14.88), tagH: f(capS), tagStem: f(4.17, 2), specW: f(bS[2] - bS[0]), cofW: f(bC[2] - bC[0]) }; };
const D0 = dims(WCM);

/* ---------- 3. sheets ---------- */
const b64 = (f, m) => `data:${m};base64,` + fs.readFileSync(f).toString('base64');
const MONT = b64(path.resolve(ROOT, '../../website/public/assets/fonts/montserrat-latin.woff2'), 'font/woff2');
const INTER = b64(path.resolve(ROOT, '../../website/public/assets/fonts/inter-latin.woff2'), 'font/woff2');
const PHOTO = b64(path.join(ROOT, 'src', 'reference-build.jpg'), 'image/jpeg');
const today = '28 November 2026';
const CSS = `@font-face{font-family:M;src:url(${MONT}) format('woff2');font-weight:200 700}
@font-face{font-family:I;src:url(${INTER}) format('woff2');font-weight:400 600}
@page{size:420mm 297mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:I,Arial,sans-serif;color:${INK};-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sheet{position:relative;width:420mm;height:297mm;overflow:hidden;page-break-after:always;background:#fff}
.abs{position:absolute}
.hd{position:absolute;left:14mm;right:14mm;top:10mm;height:14mm;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:.35mm solid ${INK};padding-bottom:3mm}
.hd h1{font:700 6.2mm/1 M;letter-spacing:.02em;text-transform:uppercase}.hd p{font:600 2.6mm/1 M;letter-spacing:.18em;text-transform:uppercase;color:#6b5d54}
.ft{position:absolute;left:14mm;right:14mm;bottom:8mm;display:flex;justify-content:space-between;font:400 2.4mm/1.3 I;color:#6b5d54;border-top:.2mm solid #cfc6bd;padding-top:2.4mm}
.k{font:700 2.3mm/1.2 M;letter-spacing:.18em;text-transform:uppercase;color:#8a6a4f}
h2{font:700 4mm/1.15 M;letter-spacing:.01em;text-transform:uppercase;margin-top:1.4mm}
p,li{font:400 2.95mm/1.5 I}ul{padding-left:4.2mm}li{margin-top:.9mm}
.box{border:.25mm solid #cfc6bd;padding:4mm;border-radius:1mm}
.warn{background:#fbf3e6;border:.3mm solid #d9b98a;padding:3.4mm 4mm;border-radius:1mm}
.warn b,.box b{font-weight:600}
table{border-collapse:collapse;width:100%}th,td{font:400 2.75mm/1.35 I;text-align:left;padding:1.5mm 2mm;border-bottom:.2mm solid #ddd4ca;vertical-align:top}
th{font:700 2.2mm/1.2 M;letter-spacing:.14em;text-transform:uppercase;color:#6b5d54;border-bottom:.3mm solid ${INK}}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}tr.on td{background:#fbf3e6;font-weight:600}
.sw{display:grid;grid-template-columns:18mm 1fr;gap:3.4mm;align-items:center;margin-top:3mm}.sw i{display:block;width:18mm;height:18mm;border:.2mm solid #b9ada2;border-radius:.8mm}
.sw b{font:700 3mm/1.2 M;text-transform:uppercase;letter-spacing:.04em}.sw span{display:block;font:400 2.6mm/1.45 I;color:#4a3d35}
svg text{font-family:I,Arial,sans-serif}`;
const head = (title, n) => `<div class="hd"><h1>${title}</h1><p>REFILL Specialty Coffee · Storefront sign · Sheet ${n} of 4</p></div>
  <div class="ft"><span>REFILL · El Shorouk, New Cairo · therefillcafe.com</span><span>Rev B · ${today} · All sizes in centimetres unless noted · Do not scale from a print: use the stated sizes</span><span>Brand identity: NAJ</span></div>`;

/* dimension helpers, drawing units = mm on the sheet */
const DIM = '#b0462e';
const dimH = (x1, x2, y, label, up = true, ext = 0) => `<g stroke="${DIM}" stroke-width=".18" fill="none"><path d="M${x1} ${y}H${x2}M${x1} ${y - 1.3}v${2.6 + (up ? 0 : 0)}M${x2} ${y - 1.3}v2.6"/>${ext ? `<path stroke-dasharray=".6 .6" d="M${x1} ${y}v${ext}M${x2} ${y}v${ext}"/>` : ''}</g>
  <text x="${(x1 + x2) / 2}" y="${up ? y - 1.3 : y + 3.6}" text-anchor="middle" font-size="2.7" font-weight="600" fill="${DIM}">${label}</text>`;
const dimV = (x, y1, y2, label, left = true, ext = 0) => `<g stroke="${DIM}" stroke-width=".18" fill="none"><path d="M${x} ${y1}V${y2}M${x - 1.3} ${y1}h2.6M${x - 1.3} ${y2}h2.6"/>${ext ? `<path stroke-dasharray=".6 .6" d="M${x} ${y1}h${ext}M${x} ${y2}h${ext}"/>` : ''}</g>
  <text x="${left ? x - 1.6 : x + 1.6}" y="${(y1 + y2) / 2 + 1}" text-anchor="${left ? 'end' : 'start'}" font-size="2.7" font-weight="600" fill="${DIM}">${label}</text>`;
const logoAt = (x, y, wmm, inner) => `<g transform="translate(${x} ${y}) scale(${wmm / WU})">${inner}</g>`;

/* sheet 1: overview with an illustrative elevation at 1:25 */
function sheet1() {
  const sc = 0.4;                         // 1:25 → 1 cm = 0.4 mm
  const FW = 520 * sc, canopy = 12, signZone = (Number(D0.H) + 30) * sc, doorH = 235 * sc, FH = canopy + signZone + doorH;
  const ox = 22, oy = 46, cx = ox + FW / 2, sw = WCM * sc, sh = Number(D0.H) * sc, sy = oy + canopy + (signZone - sh) / 2;
  const bayW = (WCM + 24) * sc, doorW = 190 * sc;
  const grid = [0.16, 0.42, 0.7, 0.93].map(f => `<path d="M${cx - bayW / 2} ${oy + canopy + signZone * f}H${cx + bayW / 2}"/>`).join('') + [0.3, 0.5, 0.7].map(f => `<path d="M${cx - bayW / 2 + bayW * f} ${oy + canopy + 2}V${oy + canopy + signZone - 1}"/>`).join('');
  return `<section class="sheet">${head('Storefront sign · overview', 1)}
  <svg class="abs" style="left:0;top:0" width="420mm" height="297mm" viewBox="0 0 420 297">
    <defs><linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8d989d"/><stop offset=".55" stop-color="#5f6b71"/><stop offset="1" stop-color="#77848a"/></linearGradient></defs>
    <rect x="${ox}" y="${oy}" width="${FW}" height="${FH}" fill="url(#gl)"/>
    <rect x="${ox}" y="${oy}" width="${FW}" height="${canopy}" fill="#2b2d2f"/>
    <g fill="#141414"><rect x="${cx - bayW / 2 - 1.2}" y="${oy + canopy}" width="2.4" height="${FH - canopy}"/><rect x="${cx + bayW / 2 - 1.2}" y="${oy + canopy}" width="2.4" height="${FH - canopy}"/>
      <rect x="${ox}" y="${oy + canopy + signZone - 1}" width="${FW}" height="2"/><rect x="${ox}" y="${oy + canopy}" width="1.6" height="${FH - canopy}"/><rect x="${ox + FW - 1.6}" y="${oy + canopy}" width="1.6" height="${FH - canopy}"/></g>
    <g stroke="#141414" stroke-width=".9" fill="none">${grid}</g>
    <g fill="none" stroke="#141414" stroke-width="2.2"><rect x="${cx - doorW / 2}" y="${oy + canopy + signZone + 1}" width="${doorW / 2}" height="${doorH - 2}"/><rect x="${cx}" y="${oy + canopy + signZone + 1}" width="${doorW / 2}" height="${doorH - 2}"/></g>
    <g stroke="#141414" stroke-width="1.1" stroke-linecap="round"><path d="M${cx - 3.4} ${oy + canopy + signZone + doorH * .5}v10M${cx + 3.4} ${oy + canopy + signZone + doorH * .5}v10"/></g>
    <rect x="${ox - 6}" y="${oy + FH}" width="${FW + 12}" height="1.2" fill="#8b8f92"/>
    ${logoAt(cx - sw / 2 + 0.7, sy + 0.7, sw, art(BROWN))}${logoAt(cx - sw / 2, sy, sw, art(CREAM))}
    ${dimH(cx - sw / 2, cx + sw / 2, oy - 4, `${D0.W} cm overall width (proposed)`, true, 4 + canopy + (signZone - sh) / 2)}
    ${dimV(ox + FW + 8, sy, sy + sh, `${D0.H} cm`, false)}
    <text x="${ox}" y="${oy + FH + 7}" font-size="2.5" fill="#6b5d54">Illustrative front view, about 1:25. This is not a survey of the shop: the glazing, door and frame are drawn only to show how the sign sits.</text>
  </svg>
  <div class="abs" style="left:258mm;top:34mm;width:148mm">
    <p class="k">What to make</p><h2>One illuminated sign, 3D letters on a support frame</h2>
    <p style="margin-top:2mm">The REFILL logo as separate 3D letters fixed to a slim black frame above the entrance, the same construction as the reference sign below. Faces in cream, sides in brown, lit from inside in warm white.</p>
    <div class="warn" style="margin-top:4mm"><p><b>Size to confirm on site.</b> This drawing uses an overall width of <b>${D0.W} cm</b> (height ${D0.H} cm). Measure the bay above the door first. Sheet 2 lists the sizes for other widths: the proportions never change.</p></div>
    <div style="display:grid;grid-template-columns:52mm 1fr;gap:5mm;margin-top:5mm">
      <div><img src="${PHOTO}" style="width:52mm;display:block;border-radius:1mm"><p style="font-size:2.4mm;color:#6b5d54;margin-top:1.4mm">Construction reference only (another brand's sign): letters on a black tube frame in front of the glazing.</p></div>
      <div><p class="k">Sheets</p>
        <table style="margin-top:1.4mm"><tr><td>1</td><td>Overview</td></tr><tr><td>2</td><td>Sizes and proportions</td></tr><tr><td>3</td><td>Colours, materials and build</td></tr><tr><td>4</td><td>Cutting outlines, 1:10, all text as curves</td></tr></table>
        <p class="k" style="margin-top:4mm">Pieces</p>
        <table style="margin-top:1.4mm"><tr><td>Cup symbol</td><td class="n">2</td></tr><tr><td>REFILL</td><td class="n">6</td></tr><tr><td>SPECIALTY COFFEE</td><td class="n">15</td></tr><tr><td>Support frame</td><td class="n">1</td></tr></table>
      </div></div>
  </div></section>`;
}

/* sheet 2: dimensions at 1:10 */
function sheet2() {
  const sc = WCM / WU;                   // at 1:10, 1 cm = 1 mm → wmm = WCM
  const x = 34, y = 62, u = v => v * sc, X = v => x + u(v), Y = v => y + u(v);
  const ys = { lid0: 0, lid1: LID.h, cup0: CUP.top, cup1: CUP.yc + CUP.ro, r0: bR[3] - capR - 0.3, r1: 607.036 - TOP, s0: 673.9082 - TOP - capS, s1: 673.9082 - TOP, c0: 703.804 - TOP - capS, c1: 703.804 - TOP };
  if (ONE) { delete ys.c0; delete ys.c1; }
  const chain = [['lid0', 'lid1'], ['lid1', 'cup0'], ['cup0', 'cup1'], ['cup1', 'r0'], ['r0', 'r1'], ['r1', 's0'], ['s0', 's1'], ['s1', 'c0'], ['c0', 'c1']].filter(([a, b]) => a in ys && b in ys);
  const rx = X(WU) + 12;
  const widths = [160, 180, 200, 220, 240, 280].includes(WCM) ? [160, 180, 200, 220, 240, 280] : [160, 180, 200, 240, WCM].sort((a, b) => a - b);
  return `<section class="sheet">${head('Sizes and proportions · scale 1:10', 2)}
  <svg class="abs" style="left:0;top:0" width="420mm" height="297mm" viewBox="0 0 420 297">
    <path d="M${X(CX)} ${y - 9}V${Y(HU) + 6}" stroke="#9aa3a8" stroke-width=".15" stroke-dasharray="3 1 .6 1"/><text x="${X(CX) + 1.2}" y="${y - 7}" font-size="2.2" fill="#6b7479">centre line</text>
    ${logoAt(x, y, WCM, art(BROWN))}
    ${dimH(X(0), X(WU), y - 14, `${D0.W} overall width`, true, 13)}
    ${dimV(x - 12, Y(0), Y(HU), `${D0.H}`, true, 11)}
    ${dimH(X(CX - CUP.ro), X(CX + CUP.ro), Y(CUP.yc + CUP.ro) + 5, `${D0.iconW} cup`, false)}
    ${dimH(X(bS[0]), X(bS[2]), Y(HU) + 6, `${D0.specW}`, false)}${ONE ? '' : dimH(X(bC[0]), X(bC[2]), Y(HU) + 13, `${D0.cofW}`, false)}
    ${chain.map(([a, b]) => dimV(rx, Y(ys[a]), Y(ys[b]), cm(ys[b] - ys[a]), false)).join('')}
    <g stroke="${DIM}" stroke-width=".12" stroke-dasharray=".6 .6">${Object.values(ys).map(v => `<path d="M${X(WU) + 1.5} ${Y(v)}H${rx}"/>`).join('')}</g>
    <text x="${x}" y="${Y(HU) + 24}" font-size="2.5" fill="#6b5d54">Drawn at 1:10 (1 mm on this A3 sheet = 1 cm on the sign). Shown in brown for legibility; face and side colours are on sheet 3. Letter heights are flat-letter (cap) heights; round letters overshoot by about 1%.</text>
  </svg>
  <div class="abs" style="left:286mm;top:34mm;width:120mm">
    <p class="k">Key sizes at ${D0.W} cm wide</p>
    <table style="margin-top:1.6mm">
      <tr><td>Overall</td><td class="n">${D0.W} × ${D0.H}</td></tr>
      <tr><td>Cup symbol, width × height</td><td class="n">${D0.iconW} × ${D0.iconH}</td></tr>
      <tr><td>Lid bar, length × thickness</td><td class="n">${cm(LID.w)} × ${D0.lidT}</td></tr>
      <tr><td>Cup wall thickness</td><td class="n">${D0.wall}</td></tr>
      <tr><td>REFILL letter height</td><td class="n">${D0.refillH}</td></tr>
      <tr><td>REFILL stroke (width of the I)</td><td class="n">${D0.stem}</td></tr>
      <tr><td>SPECIALTY COFFEE letter height</td><td class="n">${D0.tagH}</td></tr>
      <tr><td>SPECIALTY COFFEE stroke</td><td class="n">${D0.tagStem}</td></tr>
    </table>
    <p class="k" style="margin-top:6mm">Other widths (same proportions)</p>
    <table style="margin-top:1.6mm"><tr><th class="n">Width</th><th class="n">Height</th><th class="n">Cup W</th><th class="n">REFILL H</th><th class="n">Tagline H</th><th class="n">Tagline stroke</th></tr>
      ${widths.map(w => { const d = dims(w); return `<tr class="${w === WCM ? 'on' : ''}"><td class="n">${d.W}</td><td class="n">${d.H}</td><td class="n">${d.iconW}</td><td class="n">${d.refillH}</td><td class="n">${d.tagH}</td><td class="n">${d.tagStem}</td></tr>`; }).join('')}
    </table>
    <div class="box" style="margin-top:6mm"><p><b>Proportions.</b> Height = ${(HU / WU).toFixed(4)} × width. Scale everything together; do not stretch, re-space or re-draw the letters. The cup, REFILL and ${ONE ? 'the tagline' : 'both tagline lines'} share one centre line.</p></div>
    <div class="box" style="margin-top:3mm"><p><b>The tagline is small.</b> At this size its strokes are only ${D0.tagStem} cm wide, too thin to light from inside, so SPECIALTY COFFEE is made as flat-cut solid letters (see sheet 3).</p></div>
  </div></section>`;
}

/* sheet 3: colours, materials, build */
function sheet3() {
  const sect = `<svg viewBox="0 0 150 78" width="150mm" height="78mm">
    <rect x="96" y="4" width="3" height="70" fill="#bfd0d6"/><text x="101" y="72" font-size="2.5" fill="#4a5a61">glazing</text>
    <rect x="80" y="10" width="5" height="5" fill="#141414"/><rect x="80" y="62" width="5" height="5" fill="#141414"/><rect x="85" y="11.5" width="11" height="2" fill="#141414"/><rect x="85" y="63.5" width="11" height="2" fill="#141414"/>
    <rect x="50" y="18" width="30" height="42" fill="#fff" stroke="${BROWN}" stroke-width="1"/><rect x="47" y="17" width="3" height="44" fill="${CREAM}" stroke="#8a7f74" stroke-width=".25"/>
    <rect x="78.4" y="18.5" width="1.1" height="41" fill="#9a9a9a"/>
    <g fill="#f4c66a" stroke="#a6792a" stroke-width=".2"><rect x="73.5" y="24" width="4" height="5"/><rect x="73.5" y="36.5" width="4" height="5"/><rect x="73.5" y="49" width="4" height="5"/></g>
    <g stroke="#e9b44c" stroke-width=".25" stroke-dasharray="1 1"><path d="M73 26.5H52M73 39H52M73 51.5H52"/></g>
    <g stroke="#555" stroke-width=".2" fill="none"><path d="M45 29.2H47M45 12.2H62V18M45 46.2H66L73.5 39.5M45 68.2H79V59.5"/></g>
    <g font-size="2.5" fill="${INK}"><text x="44" y="13" text-anchor="end">B · sides, 1 mm aluminium, brown</text><text x="44" y="30" text-anchor="end">A · face, 3 mm opal acrylic, cream</text><text x="44" y="47" text-anchor="end">C · LED modules, warm white</text><text x="44" y="69" text-anchor="end">D · back, 3–5 mm ACP or PVC</text><text x="101" y="14">E · frame, 2 × 2 cm tube, black</text></g>
    ${dimH(47, 80, 74, '8 cm deep', false)}
  </svg>`;
  return `<section class="sheet">${head('Colours, materials and build', 3)}
  <div class="abs" style="left:14mm;top:34mm;width:116mm">
    <p class="k">Colours</p>
    <div class="sw"><i style="background:${CREAM}"></i><div><b>Cream · letter faces</b><span>HEX #F2E9DB · RGB 242 233 219<br>Nearest standard: RAL 9001 (approximate)</span></div></div>
    <div class="sw"><i style="background:${BROWN}"></i><div><b>Brown · letter sides</b><span>HEX #653D26 · RGB 101 61 38 · CMYK 41 69 84 45<br>Nearest standard: RAL 8011 (approximate)</span></div></div>
    <div class="sw"><i style="background:#141414"></i><div><b>Black · support frame</b><span>RAL 9005, matt powder coat</span></div></div>
    <div class="warn" style="margin-top:5mm"><p><b>Approve real samples.</b> The RAL numbers are the closest standard colours, not exact matches. Before production, show a sample of the cream acrylic and the brown paint against the HEX values above, in daylight and lit.</p></div>
    <p class="k" style="margin-top:6mm">Light</p>
    <ul><li>Warm white LED, 3000 K, even with no hot spots or dark ends.</li><li>12 V modules, IP65 or better; drivers inside the shop, reachable for service.</li><li>On a timer or light sensor, with its own switch.</li></ul>
    <p class="k" style="margin-top:6mm">If the sign goes on a light wall instead of glass</p>
    <p style="margin-top:1.2mm">Swap the colours: brown faces with brown sides, so the logo stays readable on a pale background.</p>
  </div>
  <div class="abs" style="left:142mm;top:34mm;width:264mm">
    <p class="k">Pieces and how each is made</p>
    <table style="margin-top:1.6mm">
      <tr><th style="width:44mm">Piece</th><th style="width:16mm" class="n">Qty</th><th>Build</th><th style="width:60mm">Finish</th></tr>
      <tr><td><b>Cup symbol</b><br>lid bar and cup ring</td><td class="n">2</td><td>Fabricated 3D letters, 8 cm deep, lit through the face. The cup is one ring; do not join it to the lid.</td><td>Cream face, brown sides</td></tr>
      <tr><td><b>REFILL</b><br>letters ${D0.refillH} cm high</td><td class="n">6</td><td>Same build as the symbol: 8 cm deep, lit through the face.</td><td>Cream face, brown sides</td></tr>
      <tr><td><b>SPECIALTY COFFEE</b><br>letters ${D0.tagH} cm high</td><td class="n">15</td><td>Flat-cut solid acrylic, 1 to 2 cm thick, not lit. Fix on a thin brown rail or on studs so ${ONE ? 'the line stays' : 'the two lines stay'} level and evenly spaced.</td><td>Cream face, brown painted edges</td></tr>
      <tr><td><b>Support frame</b></td><td class="n">1</td><td>Square aluminium or steel tube, 2 × 2 cm, fixed to the shopfront frame. Run the cables inside the tube. Keep the members behind the letters where possible, as in the reference photo.</td><td>Black, RAL 9005 matt</td></tr>
    </table>
    <div style="display:grid;grid-template-columns:152mm 1fr;gap:8mm;margin-top:6mm">
      <div><p class="k">Section through a lit letter (not to scale)</p><div style="margin-top:2mm">${sect}</div></div>
      <div><p class="k">The manufacturer confirms</p>
        <ul><li>Measured width and height of the bay above the door, and the final overall width.</li><li>A shop drawing with the frame layout and fixing points, for approval before production.</li><li>Fixings and structure suited to the facade and to wind load.</li><li>Electrical work to the local code; cable route and driver position.</li><li>Colour samples approved (see left).</li></ul>
        <p class="k" style="margin-top:5mm">Do not</p>
        <ul><li>Re-type the name in another font: use the outlines on sheet 4.</li><li>Change the spacing between letters or between lines.</li><li>Add an outline, shadow or backing panel behind the logo.</li></ul></div>
    </div>
  </div></section>`;
}

/* sheet 4: outlines only, 1:10 */
function sheet4() {
  const x = 110, y = 70;
  return `<section class="sheet">${head('Cutting outlines · scale 1:10', 4)}
  <svg class="abs" style="left:0;top:0" width="420mm" height="297mm" viewBox="0 0 420 297">
    ${logoAt(x, y, WCM, art('none', '#000', 0.25 * WU / WCM))}
    <g stroke="#000" stroke-width=".2"><path d="M${x} ${y + Number(D0.H) + 14}h${WCM}M${x} ${y + Number(D0.H) + 12.5}v3M${x + WCM} ${y + Number(D0.H) + 12.5}v3M${x + WCM / 2} ${y + Number(D0.H) + 13}v2"/></g>
    <text x="${x + WCM / 2}" y="${y + Number(D0.H) + 20}" text-anchor="middle" font-size="2.8" font-weight="600">${D0.W} cm on the sign = ${WCM} mm on this sheet. Enlarge 1000% for full size.</text>
  </svg>
  <div class="abs" style="left:14mm;top:34mm;width:80mm">
    <p class="k">For the cutting file</p>
    <ul><li>Every shape on this sheet is a vector outline. All text is converted to curves: no fonts are needed.</li><li>23 pieces: the lid, the cup ring, and ${ONE ? '6 + 15' : '6 + 9 + 6'} letters.</li><li>The outline is the finished face edge. Add your own allowance for trim or returns.</li><li>Open this PDF in Illustrator or CorelDRAW, or use the SVG file sent with it (1 unit = 1 cm).</li></ul>
    <div class="warn" style="margin-top:5mm"><p><b>Check the size first.</b> ${D0.W} cm is the proposed width. If the bay is different, scale the whole drawing in one step.</p></div>
  </div></section>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>REFILL storefront sign · production drawing</title><style>${CSS}</style></head><body>${sheet1()}${sheet2()}${sheet3()}${sheet4()}</body></html>`;
  const b = await chromium.launch(), p = await b.newPage();
  await p.setContent(html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(OUT, `REFILL-storefront-sign-production${SUF}.pdf`), width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
  // the logo alone in its final look: cream faces, brown sides, on a dark ground. No notes.
  const depth = 2.6 / K, steps = 14;   // the sides, seen slightly from the left and above (about 2.6 cm of the 8 cm depth shows)
  const grp = (ds, fill) => `<g fill="${fill}" fill-rule="evenodd">${ds.map(d => `<path d="${d}"/>`).join('')}</g>`;
  const big = [lidD, cupD, ...R.map(g => g.d)], small = [...SP, ...CO].map(g => g.d);   // the tagline letters are only 1–2 cm thick, so their sides show less
  const side = (ds, dp) => Array.from({ length: steps }, (_, i) => `<g transform="translate(${(dp * (steps - i) / steps).toFixed(3)} ${(dp * (steps - i) / steps).toFixed(3)})">${grp(ds, i < 2 ? '#4a2b1a' : BROWN)}</g>`).join('');
  const sides = side(big, depth) + side(small, depth * 0.28);
  const lw = 250, lx = (420 - lw) / 2, ly = (297 - lw * HU / WU) / 2 - 2;
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><title>REFILL storefront sign</title><style>@page{size:420mm 297mm;margin:0}*{margin:0;padding:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head>
    <body><svg width="420mm" height="297mm" viewBox="0 0 420 297" style="display:block"><rect width="420" height="297" fill="#2a2e30"/>${logoAt(lx, ly, lw, sides + art(CREAM))}</svg></body></html>`, { waitUntil: 'load' });
  await p.pdf({ path: path.join(OUT, `REFILL-storefront-sign-logo${SUF}.pdf`), width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
  // the same, flat: cream logo only, no sides
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><title>REFILL storefront sign</title><style>@page{size:420mm 297mm;margin:0}*{margin:0;padding:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head>
    <body><svg width="420mm" height="297mm" viewBox="0 0 420 297" style="display:block"><rect width="420" height="297" fill="#2a2e30"/>${logoAt(lx, ly, lw, art(CREAM))}</svg></body></html>`, { waitUntil: 'load' });
  await p.pdf({ path: path.join(OUT, `REFILL-storefront-sign-logo-2D${SUF}.pdf`), width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
  await b.close();
  // artwork only: 1 unit = 1 cm at the chosen width
  fs.writeFileSync(path.join(OUT, `refill-sign-artwork${SUF}.svg`),
    `<?xml version="1.0" encoding="UTF-8"?>\n<!-- REFILL storefront sign artwork. Outlines only. 1 unit = 1 cm at ${D0.W} cm overall width. -->\n<svg xmlns="http://www.w3.org/2000/svg" width="${D0.W}cm" height="${D0.H}cm" viewBox="0 0 ${WU.toFixed(3)} ${HU.toFixed(3)}">${art(BROWN)}</svg>\n`);
  console.log(JSON.stringify(D0));
})();
