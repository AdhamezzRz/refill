// REFILL · December reels (1080×1920).
//   node campaign/04-december/tools/reels.js stop     → out/20-stop-the-reel/stop-the-reel.mp4
//   node campaign/04-december/tools/reels.js latte    → out/19-our-logo-poured/our-logo-poured.mp4 (needs src/latte-pour.mp4 + src/latte-pour.wav)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const FONTS = 'file://' + path.resolve(ROOT, '../../website/public/assets/fonts') + '/';
const TMP = path.join(require('os').tmpdir(), 'refill-reels'); fs.mkdirSync(TMP, { recursive: true });
const CUP = (c, sw = 6.72) => `<svg viewBox="0 0 100 100" style="overflow:visible;width:100%;height:100%"><g fill="none" stroke="${c}" stroke-width="${sw}"><path d="M6.2 3.36H93.8"/><path d="M13.36 55.52V23.68H86.64V55.52A36.64 36.64 0 0 1 13.36 55.52Z"/></g></svg>`;
const CSS = `@font-face{font-family:M;src:url(${FONTS}montserrat-latin.woff2) format('woff2');font-weight:200 700}
@font-face{font-family:I;src:url(${FONTS}inter-latin.woff2) format('woff2');font-weight:400 600}
@font-face{font-family:A;src:url(${FONTS}alexandria-arabic.woff2) format('woff2');font-weight:300 600}
*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1920px;overflow:hidden;background:transparent}
body{font-family:M;position:relative;-webkit-font-smoothing:antialiased}
.abs{position:absolute}.label{font:600 18px/1.2 M;letter-spacing:.2em;text-transform:uppercase}
.h{font-weight:500;letter-spacing:-.03em;line-height:1.02;text-wrap:balance}.t{font:400 30px/1.4 I}
.ar{font-family:A;font-weight:500;direction:rtl;text-align:right;line-height:1.25}
.lock{display:flex;align-items:center;gap:14px}.lock i{width:34px;height:34px;display:block}.lock span{font:600 19px/1 M;letter-spacing:.6em}`;
const LOCK = c => `<div class="lock" style="color:${c}"><i>${CUP(c)}</i><span>REFILL</span></div>`;
const html = body => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;

async function shoot(b, name, body, transparent = false) {
  const f = path.join(TMP, name + '.html'); fs.writeFileSync(f, html(body));
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + f); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120);
  const out = path.join(TMP, name + '.png'); await p.screenshot({ path: out, omitBackground: transparent }); await p.close();
  return out;
}
const ff = args => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

/* a click track: one tick per frame change and a soft chime at the end */
function clicks(file, times, chimeAt, total) {
  const sr = 44100, n = Math.round(total * sr), buf = new Float32Array(n);
  for (const t of times) { const s = Math.round(t * sr); for (let i = 0; i < 900 && s + i < n; i++) buf[s + i] += (Math.random() * 2 - 1) * Math.exp(-i / 140) * 0.55; }
  if (chimeAt != null) { const s = Math.round(chimeAt * sr); for (let i = 0; i < sr * 1.6 && s + i < n; i++) { const e = Math.exp(-i / (sr * 0.45)); buf[s + i] += 0.22 * e * (Math.sin(2 * Math.PI * 1318.5 * i / sr) + 0.6 * Math.sin(2 * Math.PI * 1975.5 * i / sr)); } }
  const data = Buffer.alloc(44 + n * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + n * 2, 4); data.write('WAVEfmt ', 8); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(sr, 24); data.writeUInt32LE(sr * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) data.writeInt16LE(Math.max(-1, Math.min(1, buf[i])) * 32000 | 0, 44 + i * 2);
  fs.writeFileSync(file, data);
}

async function stopTheReel() {
  const items = [
    ['p-flatwhite', 'Flat white', 'Productive day ahead.'], ['t-croissant', 'Butter croissant', 'Come before 11.'],
    ['p-spanish', 'Spanish latte', 'Sweet day ahead.'], ['t-cruffin', 'Pistachio cruffin', 'Treat yourself. Seriously.'],
    ['p-caramel', 'Caramel latte', 'Main character energy.'], ['t-cheesecake', 'Basque cheesecake', 'Dessert first.'],
    ['p-hotchoc', 'Hot chocolate', 'Refill guaranteed.'], ['t-cardamom', 'Cardamom knot', 'Bring a friend.'],
    ['p-matcha', 'Iced matcha', 'Unbothered all day.'], ['t-v60', 'V60 pour-over', 'Ask about the beans.'],
    ['p-cappuccino', 'Cappuccino', 'A classic. On time.'], ['t-ahwa', 'Ahwa mazbout', 'Bring your dad.'],
    ['t-karkade', 'Karkade spritz', 'Very Cairo. Very cold.'],
  ];
  const b = await chromium.launch();
  const frames = [];
  const INK = '#352317', PAPER = '#F3EFE6', MUTED = '#7A6A5C', SAND = '#C9B49C';
  const head = `<div class="abs" style="left:0;right:0;top:0;height:330px;background:${PAPER}"></div>
    <div class="abs" style="left:72px;right:72px;top:150px;display:flex;justify-content:space-between;align-items:baseline;color:${INK}">
      <p class="h" style="font-size:58px">Stop the reel.</p><p class="ar" style="font-size:44px">وقّف الريل</p></div>
    <p class="abs label" style="left:72px;top:250px;color:${MUTED}">Pause it. That's your order tomorrow.</p>`;
  const intro = await shoot(b, 'intro', `<div class="abs" style="inset:0;background:${INK}"></div>
    <div class="abs" style="left:80px;right:80px;top:640px;color:${PAPER}">
      <h1 class="h" style="font-size:150px">Stop the reel.</h1>
      <p class="h" style="font-size:52px;font-weight:400;margin-top:44px">Whatever you land on is your order tomorrow.</p>
      <p class="ar" style="font-size:52px;margin-top:40px;color:${SAND}">وقّف الريل، وده طلبك بكرة</p>
    </div>
    <div class="abs" style="left:80px;bottom:150px;width:40px;height:40px">${CUP(SAND, 8)}</div>`);
  for (const [i, [f, name, line]] of items.entries()) {
    frames.push(await shoot(b, 'item' + i, `<img class="abs" src="file://${SRC}/${f}.jpg" style="left:-468px;top:210px;width:2016px;height:2016px;object-fit:cover">
      ${head}
      <div class="abs" style="left:0;bottom:0;width:1080px;background:${PAPER};padding:46px 72px 140px">
        <h2 class="h" style="font-size:92px;color:${INK}">${name}</h2><p class="t" style="margin-top:14px;color:${MUTED}">${line}</p></div>`));
  }
  const outro = await shoot(b, 'outro', `<div class="abs" style="inset:0;background:${PAPER}"></div>
    <div class="abs" style="left:80px;right:80px;top:640px;color:${INK}"><h1 class="h" style="font-size:140px">What did you get?</h1>
      <p class="h" style="font-size:50px;font-weight:400;margin-top:40px">Tell us in the comments. We'll have it ready.</p>
      <p class="ar" style="font-size:52px;margin-top:40px">قولنا طلعلك إيه</p></div>
    <div class="abs" style="left:80px;bottom:150px;width:40px;height:40px">${CUP(MUTED, 8)}</div>`);
  await b.close();

  // timeline: intro 1.8 s, two passes through the menu (fast), outro 2.4 s
  const seq = [[intro, 1.8]];
  for (let pass = 0; pass < 2; pass++) for (const f of frames) seq.push([f, pass ? 0.24 : 0.3]);
  seq.push([outro, 2.4]);
  const list = path.join(TMP, 'stop.txt');
  fs.writeFileSync(list, seq.map(([f, d]) => `file '${f}'\nduration ${d}`).join('\n') + `\nfile '${outro}'\n`);
  let t = 0; const ticks = []; for (const [, d] of seq) { ticks.push(t); t += d; }
  const total = t, wav = path.join(TMP, 'ticks.wav');
  clicks(wav, ticks.slice(1, -1), ticks[ticks.length - 1], total);
  const dir = path.join(ROOT, 'out', '20-stop-the-reel'); fs.mkdirSync(dir, { recursive: true });
  ff(['-f', 'concat', '-safe', '0', '-i', list, '-i', wav, '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', path.join(dir, 'stop-the-reel.mp4')]);
  fs.copyFileSync(intro, path.join(dir, 'cover.png'));
  console.log('stop the reel:', total.toFixed(1), 's');
}

async function latte() {
  const vid = path.join(SRC, 'latte-pour.mp4'), wav = path.join(SRC, 'latte-pour.wav');
  const b = await chromium.launch();
  const INK = '#352317', PAPER = '#F3EFE6', MUTED = '#7A6A5C';
  const top = await shoot(b, 'latte-top', `<div class="abs" style="left:72px;right:72px;top:150px;display:flex;justify-content:space-between;align-items:baseline;color:${INK}">
    <p class="label">Watch closely</p></div>`, true);
  const end = await shoot(b, 'latte-end', `<div class="abs" style="left:0;right:0;bottom:0;background:${PAPER};padding:56px 72px 150px">
    <div style="display:flex;justify-content:space-between;align-items:baseline;color:${INK}"><h1 class="h" style="font-size:96px">Poured, not printed.</h1></div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:22px;gap:30px"><p class="t" style="color:${MUTED}">Every cup at Refill is made by hand.</p><p class="ar" style="font-size:42px;color:${INK}">كل كوباية بالإيد</p></div></div>`, true);
  await b.close();
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', vid]).toString());
  const hold = 2.6, total = dur + hold, t1 = dur - 0.6;
  const dir = path.join(ROOT, 'out', '19-our-logo-poured'); fs.mkdirSync(dir, { recursive: true });
  ff(['-i', vid, '-loop', '1', '-i', top, '-loop', '1', '-i', end, '-i', wav,
    '-filter_complex',
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,tpad=stop_mode=clone:stop_duration=${hold}[v];` +
    `[1:v]format=rgba,fade=t=in:st=0.2:d=0.5:alpha=1,fade=t=out:st=${t1 - 0.8}:d=0.6:alpha=1[a];` +
    `[2:v]format=rgba,fade=t=in:st=${t1}:d=0.5:alpha=1[b];` +
    `[v][a]overlay=0:0:shortest=1[v1];[v1][b]overlay=0:0:shortest=1,format=yuv420p[vout];` +
    `[3:a]apad,atrim=0:${total},afade=t=out:st=${total - 1}:d=1[aout]`,
    '-map', '[vout]', '-map', '[aout]', '-t', String(total), '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', path.join(dir, 'our-logo-poured.mp4')]);
  console.log('latte reel:', total.toFixed(1), 's');
}

(async () => {
  const which = process.argv[2] || 'all';
  if (which === 'stop' || which === 'all') await stopTheReel();
  if (which === 'latte' || which === 'all') await latte();
})();
