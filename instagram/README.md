# Refill: Instagram profile picture and highlight covers

Every mark is drawn on the measured geometry of the Refill cup-arch icon (cup 0.94 tall to 1 wide,
lid 1.095 wide, gap 0.17, stroke 0.084), in the brand palette only. Vector SVG sources included.

## Profile picture: `png/profile/`
| File | Use |
|---|---|
| `profile-espresso-1080.png` | **Recommended.** Plaster arch on Espresso. Strongest contrast in both IG themes. |
| `profile-plaster-1080.png` | Ink arch on Plaster. |
| `profile-olive-1080.png` | Plaster arch on Olive. For a seasonal or event swap. |

The arch is optically centred (lifted 1.2%) and sized to clear Instagram's circle crop.

## Highlight covers: `png/highlights-*/` (1080 x 1920 story size)
Eight covers, following the guideline's highlight structure: Location, Menu, Best sellers,
About Refill, Beans, Seasonal, Reviews, Events.

| Set | Look |
|---|---|
| `highlights-plaster/` | **Recommended.** Espresso line icons on Plaster. Calm, and contrasts with the dark profile picture. |
| `highlights-espresso/` | Plaster on Espresso. Bold, dark row. |
| `highlights-tonal/` | Each cover takes a palette colour (plaster, greige, taupe, olive, espresso), so the row reads as a colour ramp. |

The icons have no text inside them, because Instagram already prints the label under each circle.
The brand details in the icons:
- **About Refill** is the arched door with the round porthole from the interior.
- **Location** is a pin with the same porthole.
- **Best sellers** is the cup-arch itself.
- **Menu** carries the arch's lid bar.
- **Seasonal** is an olive branch, the brand's accent colour.

## How to set a cover
Post the cover PNG to your story, add it to the highlight, then Edit highlight > Edit cover and
pick it from the story. Instagram centres the crop automatically.

## Files
- `svg/icons/`: the eight icons on a 100-unit grid in `currentColor`, for web, menus and signage.
- `svg/profile/arch-icon-*.svg` and `png/logo/`: the master arch icon, transparent, in ink, plaster and espresso.
- `png/mockup/`: the profile in context, in light and dark mode.

## Re-render
Requires Python 3 with Pillow, Node with Playwright, and Chromium.

```bash
python3 tools/build.py "$PWD"
```

```bash
node tools/render.js "$PWD"
```
