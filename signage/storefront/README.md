# REFILL · storefront sign

Production drawing for the sign manufacturer: the REFILL logo as 3D letters on a black support frame above the entrance.

- `out/REFILL-storefront-sign-production.pdf`: A3 landscape, 4 sheets, vector. 1 overview, 2 sizes at 1:10, 3 colours / materials / build, 4 cutting outlines (all text as curves).
- `out/REFILL-storefront-sign-logo.pdf`: the logo alone in its final look (cream faces, brown sides), no notes.
- `out/REFILL-storefront-sign-logo-2D.pdf`: the same, flat (no sides).
- `out/refill-sign-artwork.svg`: the outlines only, 1 unit = 1 cm.
- `tools/build.js`: rebuilds both. `node signage/storefront/tools/build.js 240` sets another overall width in cm (default 200).
- `src/identity-logo-page.svg`: the logo page exported from the identity PDF; the artwork is taken from it.

The artwork uses the identity's own outlines, with two corrections for fabrication: every line is level (in the identity file REFILL and COFFEE are 0.34° off), and the cup, REFILL and the tagline share one centre line.

The overall width (200 cm) is a proposal: measure the bay above the door before production. The RAL numbers are nearest standard colours, not exact matches.
