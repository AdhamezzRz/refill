# Refill pre-opening campaign

Three pieces built on the real El Shorouk site photos, the 3D renders and the Refill brand system
(Montserrat, Plaster / Espresso / Ink, the cup-arch icon). The founder appears as a faceless white
line-art character drawn from his silhouette, hair, beard and outfit only.

| # | Piece | Message | Files |
|---|-------|---------|-------|
| 01 | **Drawn before it's brewed**: 5-slide carousel, 4:5 | Coming soon / under construction | `01-coming-soon-carousel/carousel-01..05.jpg` |
| 02 | **Same room. Soon.**: 16 s reel, 9:16 | Almost done | `02-same-room-soon-reel/same-room-soon-reel-1080x1920.mp4` |
| 03 | **92% refilled**: 8 s reel + story + feed post | Almost done, countdown | `03-refilled-92/` |

## Captions (brand voice: clear, warm, a little playful)

**01 Carousel**
> Right now: dust, drills and a man with a very big pencil.
> Soon: your new favourite seat in El Shorouk. Swipe to see what we're drawing.
>
> دلوقتي: تراب وشغل ورسمة كبيرة. قريب: أحلى قعدة في الشروق. اسحب وشوف بنرسم إيه.

**02 Reel**
> Same room. Soon.
> Refill Specialty Coffee, El Shorouk.
>
> نفس المكان. قريب جدًا.

**03 92% refilled**
> 92% refilled. The last 8% is the best part: the coffee.
>
> خلصنا ٩٢٪. الـ ٨٪ الباقيين أحلى حاجة: القهوة.

## Suggested sequence

1. Carousel 01: announce the build.
2. Reel 02, two to three weeks before opening.
3. 92% reel and story, then re-render at 96%, 99% and 100% (opening day) as a countdown.

Add a trending sound in Instagram for both reels; the exported videos are silent on purpose.

## Re-render

Requires Python 3 with Pillow and numpy, plus ffmpeg. Run from this folder.

```bash
python3 tools/carousel.py "$PWD/source" 01-coming-soon-carousel
```

```bash
PCT=96 python3 tools/refilled.py "$PWD/source" 03-refilled-92 all
```

```bash
python3 tools/reel.py "$PWD/source" 02-same-room-soon-reel
```

`PCT=100` switches the subline to "Now open." Copy and layout live at the top of each script.

## Sources

- `source/gen/`: Higgsfield outputs (GPT Image 2.5 for the line-art slides, character sheet and
  finished-room versions; MiniMax H3 for the two transformation shots).
- `source/gen/charsheet.jpg`: founder character sheet. Use it as the reference image for any new pose.
- Site photos: Google Drive folder, IMG_3798 to IMG_3817.

## Before posting

- Slide 05 shows the existing blue and green fascia band of the building. It is real, but it is not
  Refill's colour. Retouch it to plaster or crop tighter if it reads as another brand.
- The REFILL sign on slide 05 and every line of type are set in real Montserrat, not AI-generated text.
