"""Set exact PDF page boxes: MediaBox/BleedBox = trim + 3 mm bleed, TrimBox = finished size.
Chromium rounds page sizes up to whole pixels; content is anchored top-left, so we crop the excess off the right/bottom."""
import json, os
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PT = 72 / 25.4; B = 3.0 * PT
for j in json.load(open(f"{ROOT}/build/_manifest.json"))["jobs"]:
    p = f"{ROOT}/build/print-pdf/{j['name']}.pdf"
    r = PdfReader(p); w = PdfWriter()
    for page in r.pages:
        H = float(page.mediabox.top); W, Hh = j["w_mm"] * PT, j["h_mm"] * PT
        box = RectangleObject([0, H - Hh, W, H])
        page.mediabox = box; page.cropbox = box; page.bleedbox = box
        page.trimbox = RectangleObject([B, H - Hh + B, W - B, H - B])
        w.add_page(page)
    with open(p, "wb") as fh: w.write(fh)
print("boxes set")
