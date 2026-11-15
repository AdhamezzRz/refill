# REFILL · December 2026 posts and carousels

21 pieces for the December content plan and the Winter Refill campaign, ready to post: the plan's posts and carousels plus 5 new ones (no faces, hands only), two of them animated reels.

- `out/<post>/NN.jpg`: the slides, 1080 × 1350 (Instagram 4:5); the story is 1080 × 1920. Post carousels in file order.
- `out/19-our-logo-poured/our-logo-poured.mp4` and `out/20-stop-the-reel/stop-the-reel.mp4`: the reels (1080 × 1920, with sound).
- `captions.md`: posting date, caption in English and Egyptian Arabic, and hashtags for every post.
- Type and colour follow the REFILL identity (NAJ): Montserrat Bold capitals, a formal script for the voice, Alexandria for Arabic; brown `#653d26`, caramel `#c7ad91`, grey `#8e847e`, cream `#f2e9db`. The script here is Great Vibes (free, `tools/fonts/great-vibes.woff2`), standing in for the identity's licensed Vladimir Script: drop the licensed font into `tools/fonts/` and point the `S` font-face in `build.js` and `reels.js` at it.
- `src/`: the Higgsfield images, generated to read as real photography (the room is inspired by the designer's renders, not copied from them).
- `tools/reels.js`: assembles the two reels (`node campaign/04-december/tools/reels.js stop|latte`).
- `tools/build.js`: the layout for every slide. Change copy there, then `node campaign/04-december/tools/build.js` (or add a prefix, e.g. `… build.js 08`, to rebuild one post).

| Date | Post | Format |
|---|---|---|
| Wed 2 Dec | 01 Grand opening invitation (+ story) | Static |
| Fri 4 Dec | 02 Save us on Google Maps | Static |
| Sun 6 Dec | 03 Every relationship has a Refill story | Carousel · 5 (slides 1–2 are one panorama) |
| Mon 7 Dec | 04 Good mornings | Static |
| Wed 9 Dec | 05 Something to sip, something to bite | Static |
| Fri 11 Dec | 06 Good coffee for everyone | Static |
| Sat 12 Dec | 07 Teaser: Flip it | Static |
| Mon 14 Dec | 08 The Winter Refill (swipe = flip the coaster) | Carousel · 4 |
| Fri 18 Dec | 09 The Winter Refill Pass (swipe = fill the cup) | Carousel · 7 |
| Sat 19 Dec | 10 What's your coffee personality? | Static |
| Mon 21 Dec | 12 The longest night | Static |
| Wed 23 Dec | 11 What can you order at Refill? | Carousel · 5 |
| Thu 24 Dec | 13 The Hot Chocolate Atelier | Static |
| Fri 25 Dec | 14 Refill notes | Carousel · 6 |
| Thu 31 Dec | 15 The last refill of 2026 | Static |
| Tue 8 Dec | 16 The receipt · new | Static |
| Thu 10 Dec | 17 Anatomy of a croissant · new | Carousel · 5 |
| Sun 13 Dec | 19 We poured our logo · new | Reel (animation) |
| Wed 16 Dec | 18 Texts from your coffee · new | Carousel · 4 |
| Tue 22 Dec | 20 Stop the reel · new | Reel (animation) |

Not included (need the real team on camera): Post 1 "Now open" video and Post 10 barista video.

Before posting: confirm the opening date and time on post 01, and that the menu items shown (caramel latte, hot chocolate, croissant and the personality drinks) are on the real menu. The images are AI visualisations: replace them with real photos once the café is open.
