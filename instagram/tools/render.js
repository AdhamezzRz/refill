// Renders the SVG jobs written by build.py (and optional HTML mockups) to PNG with headless Chromium.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = process.argv[2] || path.resolve(__dirname, '..');
const { jobs } = JSON.parse(fs.readFileSync(path.join(root, 'tools/_jobs.json'), 'utf8'));
const extra = fs.existsSync(path.join(root, 'tools/_mockups.json'))
  ? JSON.parse(fs.readFileSync(path.join(root, 'tools/_mockups.json'), 'utf8')) : [];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const j of [...jobs, ...extra]) {
    fs.mkdirSync(path.dirname(j.out), { recursive: true });
    await page.setViewportSize({ width: j.w, height: j.h });
    const inner = j.html ? fs.readFileSync(j.html, 'utf8') : fs.readFileSync(j.src, 'utf8');
    const html = j.html ? inner :
      `<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${inner}</body></html>`;
    await page.setContent(html, { waitUntil: 'load' });
    if (j.html) await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: j.out, omitBackground: !!j.transparent, clip: { x: 0, y: 0, width: j.w, height: j.h } });
  }
  await browser.close();
  console.log('rendered', jobs.length + extra.length);
})();
