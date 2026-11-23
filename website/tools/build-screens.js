// REFILL · export the in-store menu screens as looping MP4s (for TVs that play from a USB stick).
//   node website/tools/build-screens.js <clips-dir> <out-dir> [fps]
// <clips-dir> holds the source clips (latte.mp4, spanish.mp4, … the same names as public/assets/screens/*.jpg).
// Renders /screen/1 and /screen/2 frame by frame at 2160 × 3840 (render(t) is deterministic), then encodes:
//   refill-screen-1-4k.mp4, refill-screen-2-4k.mp4 (2160 × 3840) and -1080p versions (1080 × 1920). One loop = 72 s.
// Needs the site running locally on :3100 (PORT=3100 node website/server.js), ffmpeg and Playwright.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');

const [CLIPS, OUT, FPSARG] = process.argv.slice(2);
const FPS = Number(FPSARG) || 25, LOOP = 72, N = LOOP * FPS;
const WORK = path.join(OUT, 'work'); fs.mkdirSync(WORK, { recursive: true });
const ff = a => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: 'inherit' });
const NAMES = ['latte', 'spanish', 'matcha', 'hotchoc', 'fudge', 'sansebastian', 'croissant', 'frenchtoast'];

// 1. clip frames (the hero is 1080 CSS px wide; at 2× that is 2160 px)
for (const n of NAMES) {
  const d = path.join(WORK, 'frames', n);
  if (fs.existsSync(path.join(d, '164.jpg'))) continue;
  fs.mkdirSync(d, { recursive: true });
  ff(['-i', path.join(CLIPS, n + '.mp4'), '-vf', `fps=${FPS},scale=2160:1620:flags=lanczos`, '-frames:v', '164', '-q:v', '3', path.join(d, '%03d.jpg')]);
}

(async () => {
  const b = await chromium.launch();
  await Promise.all([1, 2].map(async scr => {
    const dir = path.join(WORK, 'cap' + scr); fs.mkdirSync(dir, { recursive: true });
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
    await p.route('**/screens/frames/**', r => {
      const u = r.request().url().split('/frames/')[1], [n, f] = u.split('/');
      let file = path.join(WORK, 'frames', n, f);
      if (!fs.existsSync(file)) { const all = fs.readdirSync(path.join(WORK, 'frames', n)).sort(); file = path.join(WORK, 'frames', n, all[all.length - 1]); }
      r.fulfill({ path: file, contentType: 'image/jpeg' });
    });
    await p.goto(`http://localhost:3100/screen/${scr}?capture=1`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    for (let i = 0; i < N; i++) {
      const file = path.join(dir, String(i).padStart(5, '0') + '.jpg');
      if (fs.existsSync(file)) continue;
      await p.evaluate(t => window.__render(t), i / FPS);
      await p.evaluate(() => Promise.all([...document.images].filter(im => !im.complete).map(im => new Promise(r => { im.onload = im.onerror = r; }))));
      await p.screenshot({ path: file, type: 'jpeg', quality: 92 });
      if (i % 250 === 0) console.log(`screen ${scr}: ${i}/${N}`);
    }
    await p.close();
  }));
  await b.close();
  // 2. encode: H.264 High, 4K and 1080p, no audio (menu screens are silent)
  for (const scr of [1, 2]) {
    const src = path.join(WORK, 'cap' + scr, '%05d.jpg');
    ff(['-framerate', String(FPS), '-i', src, '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '5.1', '-movflags', '+faststart', path.join(OUT, `refill-screen-${scr}-4k.mp4`)]);
    ff(['-framerate', String(FPS), '-i', src, '-vf', 'scale=1080:1920:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2', '-movflags', '+faststart', path.join(OUT, `refill-screen-${scr}-1080p.mp4`)]);
    console.log('encoded screen', scr);
  }
})();
