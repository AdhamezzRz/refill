// Renders build/_manifest.json faces: vector PDF at true size (+bleed), 300 dpi PNG, and a cut-line proof PNG.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const { jobs } = JSON.parse(fs.readFileSync(path.join(root, 'build/_manifest.json'), 'utf8'));
const PX = 96 / 25.4;
(async () => {
  const browser = await chromium.launch();
  for (const dir of ['print-pdf', 'png-300dpi', 'proofs']) fs.mkdirSync(path.join(root, 'build', dir), { recursive: true });
  for (const j of jobs) {
    const page = await browser.newPage({ deviceScaleFactor: 300 / 96 });
    const w = Math.ceil(j.w_mm * PX), h = Math.ceil(j.h_mm * PX);
    await page.setViewportSize({ width: w, height: h });
    await page.goto('file://' + j.html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(root, 'build/print-pdf', j.name + '.pdf'), width: (j.w_mm / 25.4).toFixed(5) + 'in', height: (j.h_mm / 25.4).toFixed(5) + 'in', printBackground: true, pageRanges: '1' });
    await page.screenshot({ path: path.join(root, 'build/png-300dpi', j.name + '.png'), omitBackground: true, clip: { x: 0, y: 0, width: j.w_mm * PX, height: j.h_mm * PX } });
    await page.evaluate(() => document.body.classList.add('proof'));
    await page.screenshot({ path: path.join(root, 'build/proofs', j.name + '-cutline.png'), omitBackground: true, clip: { x: 0, y: 0, width: j.w_mm * PX, height: j.h_mm * PX } });
    await page.close();
  }
  await browser.close();
  console.log('rendered', jobs.length, 'faces');
})();
