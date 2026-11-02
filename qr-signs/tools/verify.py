"""Decode every QR from the rendered 300 dpi PNGs.
Two tests per code:
  framed - a crop of the QR panel plus 6 mm margin, as a phone camera frames it, at 100/50/33/25% scale
  full   - the whole face at 100/50% scale (stricter: the detector sees all the surrounding artwork)
A code passes when every test decodes to the exact configured URL."""
import json, os, sys
import cv2, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = json.load(open(f"{ROOT}/build/_manifest.json")); ok = True
det = cv2.QRCodeDetector(); MM = 300 / 25.4; BLEED = 3.0
for q in M["qrs"]:
    img = cv2.imread(f"{ROOT}/build/png-300dpi/{q['face']}.png", cv2.IMREAD_UNCHANGED)
    a = img[:, :, 3:4] / 255.0; rgb = (img[:, :, :3] * a + 255 * (1 - a)).astype(np.uint8)
    x, y, s = q["x_mm"] + BLEED, q["y_mm"] + BLEED, q["size_mm"]; m = 6
    crop = rgb[int((y - m) * MM):int((y + s + m) * MM), int((x - m) * MM):int((x + s + m) * MM)]
    framed = [det.detectAndDecode(cv2.resize(crop, None, fx=k, fy=k, interpolation=cv2.INTER_AREA))[0] == q["url"] for k in (1, .5, .33, .25)]
    full = [det.detectAndDecode(cv2.resize(rgb, None, fx=k, fy=k, interpolation=cv2.INTER_AREA))[0] == q["url"] for k in (1, .5)]
    good = all(framed) and all(full); ok &= good
    print(f"{'PASS' if good else 'FAIL'}  {q['face']:<15} {s:>4} mm  framed 100/50/33/25%: {framed}  full 100/50%: {full}  -> {q['url']}")
sys.exit(0 if ok else 1)
