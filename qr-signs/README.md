# Refill table QR signs

Three designs, each a different object, built to work together across the café.
All artwork is vector, set in Montserrat, Inter and Alexandria in the brand palette, with the faceless
line-art founder drawn in Higgsfield. Every QR is machine-decoded before export.

| | Design | Object and size | Job | Best placed |
|---|---|---|---|---|
| 01 | **The Arch** | Die-cut arch, **90 x 130 mm**, 4 mm matte cream acrylic (or 2 mm Dibond), standing in a light-oak block base **90 x 30 x 25 mm** with a 4 mm slot, 12 mm deep. | Front: **order**. Back: **rate**. | Window bench and pedestal tables. Small footprint, premium. |
| 02 | **Don't Get Up.** | A-frame tent, **A6 per face (105 x 148 mm)**, 400 gsm uncoated card, soft-touch matte, scored and folded. | Front (plaster): **order**. Back (olive): **rate**. | Planter benches and shared tables. Readable from both sides. |
| 03 | **The Refill-o-meter** | **100 mm round**, 4 mm espresso acrylic disc, UV print, in a round oak base **60 mm diameter** with a slot. | **Rate**, or order another. | Bar counter and pick-up point, where people wait. |

## Files

- `build/print-pdf/`: print PDFs for the sample table (07). Vector, fonts embedded,
  **3 mm bleed**, with exact **TrimBox** and **BleedBox** set.
- `build/tables/table-01 ... table-12/`: the full set for every table. Each table has its own QR
  links and its own table number.
- `build/proofs/*-cutline.png`: artwork with the die-cut line in magenta. Send these with the PDFs
  for the arch and the disc.
- `build/png-300dpi/`: 300 dpi previews.
- `02-tent-imposed-flat.pdf`: the tent laid out flat at 105 x 296 mm, back rotated 180 degrees, with the
  fold shown as a cyan dashed line.
- `mockups/`: photoreal mockups in the Refill interior.

## QR codes

- Error correction H, version 5, square finder eyes and a 4-module quiet zone. Rounded eyes failed
  real decoders in testing, so they are deliberately left square.
- Sizes: 40.5 mm (arch), 46 and 44 mm (tent), 35 mm (disc). The rule of thumb for 30 to 60 cm table distance
  is 25 mm or more.
- `tools/verify.py` decodes every code framed at 100%, 50%, 33% and 25% scale, and the full face at
  100% and 50%. All pass.

## Before printing: set the real links

The links in `config.json` are **placeholders** (`example.com`). Put in your ordering and review URLs;
`{table}` is filled in per table:

```json
{ "table": "07",
  "order_url": "https://YOUR-ORDERING-LINK/?table={table}",
  "rate_url":  "https://YOUR-REVIEW-LINK/?table={table}" }
```

Then rebuild every table. Requires Python 3 (segno, Pillow, opencv-python-headless, pypdf), Node with Playwright, and Chromium.

```bash
python3 tools/batch.py 1 12
```

Tip: point `rate_url` at a short form, and send 5-star answers on to your Google Maps review page.

## Print notes

- The PDFs are RGB. Ask the printer to convert with a coated profile and approve a printed proof
  against the brand colours: Plaster #F3EFE6, Espresso #352317, Olive #5C6050, Taupe #A39077.
- On acrylic, print a white underlayer beneath the artwork so the colours stay solid.
- Keep the oak bases natural, with a matte oil finish. No gloss anywhere, to match the room.
