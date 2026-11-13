# REFILL website

**The website is a cup.** A quiet plaster page with one big moment: a small cup-shaped window of
steam that opens to fill the whole screen. After that, a day at Refill: coffee in the morning, the
bakehouse at noon, pizza after dark. Each chapter has one living window of real footage (espresso
flowing, a croissant torn open, a pizza by the fire) poured in as you scroll. The line-art founder
appears only twice: in the Refill-o-meter, and jumping when the wordmark fills to 100%.

Built phone-first: a floating dock at thumb reach (fill gauge, menu, order), a full-screen menu, swipe
gallery, and an optional café sound toggle.

- `docs/walkthrough-desktop.mp4`, `docs/walkthrough-phone.mp4`: recordings of the real site.
- Zero dependencies. Plain Node `http` server, nothing to install, no build step.

## Run it

```bash
node server.js
```

Then open http://localhost:3000. Set `PORT` to use another port.

## Deploy on Hostinger (Node.js Web App, from GitHub)

Needs a Business or Cloud hosting plan. Steps follow Hostinger's own docs
([Git deployments](https://docs.hostinger.com/node.js/git-deployments),
[build settings](https://docs.hostinger.com/node.js/build-settings)).

1. hPanel → **Websites** → **Add website** → **Web App**. Pick your domain, or a temporary one.
2. **Import your Git repository** → **Connect with GitHub** → choose this repository.
3. Set the branch to the one this site lives on.
4. Settings:

   | Setting | Value |
   |---|---|
   | Framework preset | **Other** |
   | Root directory | `website` |
   | Node.js version | 22 |
   | Build command | none (leave empty) |
   | Output directory | leave empty |
   | Entry file | `server.js` |

5. **Deploy.** Every push to that branch redeploys automatically.
6. Attach the domain: Websites → ⋮ → **Connect domain**. SSL is automatic.

The server listens on `process.env.PORT` and `0.0.0.0`, as Hostinger requires.

## Settings: links, ordering and ratings

Edit `site.config.json`, or set the matching environment variable in Hostinger (Environment variables):

| `site.config.json` | Env variable | What it does |
|---|---|---|
| `instagram` | `INSTAGRAM_URL` | Shows the "Follow on Instagram" button. |
| `maps` | `MAPS_URL` | Shows the "Get directions" button. |
| `orderUrl` | `ORDER_URL` | `/order?table=07` redirects here with the table number. Empty: shows the "You are early" page. |
| `rateUrl` | `RATE_URL` | `/rate?table=07` redirects here. Empty: shows the built-in Refill-o-meter rating page. |
| `googleReviewUrl` | `GOOGLE_REVIEW_URL` | After a 4 or 5 cup rating, offers "Tell everyone on Google". |
| `rateWebhookUrl` | `RATE_WEBHOOK_URL` | Each rating is also POSTed here as JSON (for example a Google Sheet or Zapier hook). |

Buttons with no link set are hidden, so nothing on the site is a dead link.

**Table QR signs:** point them at `https://YOUR-DOMAIN/order?table={table}` and
`https://YOUR-DOMAIN/rate?table={table}` (see `../qr-signs/config.json`).

**Ratings:** the built-in `/rate` page sends `{score, table, note}` to `/api/rate`. Each one is written
to the server log as a `[rating]` line (Hostinger: Runtime logs) and forwarded to the webhook if set.
Hostinger wipes app files on every deploy, so ratings are deliberately not stored on disk. Set the
webhook to keep them.

## Edit the content

All copy is plain HTML in `public/index.html`. Before launch, check these placeholders:

- Menu items in the Coffee and Bakehouse lists.
- The "When" line in Visit (opening date and hours).
- The copyright name in the footer.

The clock in the menu bar is "Refill time" (it runs 06:00 to 23:59 as you scroll), not opening hours.

## How it is built

- `public/js/site.js`: one wave engine drives every liquid edge (section tides, window surfaces, the
  wordmark fill, the loader, the gauge, the room clip). Scrolling fast makes it slosh.
- `public/assets/video/*.mp4`: five short slow-motion clips made with Higgsfield. Each one sits on top
  of its own first frame (`assets/img/v-*.webp`) and fades back to it before restarting, so the loop
  never jumps. Clips load and play only while on screen. The server sends them with byte ranges,
  which Safari on iPhone requires.
- `public/assets/audio/cafe.mp3`: café ambience for the sound toggle. Off until the visitor asks.
- `public/assets/poses/*.svg`: the founder, traced from the Higgsfield line art into centre-line
  strokes by `tools/vectorize.py` so each line can be drawn in order.
- GSAP, ScrollTrigger and Lenis are vendored in `public/vendor/`, and fonts are self-hosted, so the
  site makes no third-party requests.
- Reduced-motion visitors get a still, fully readable page. Phones get a swipe gallery instead of the
  pinned sideways scroll.

Re-trace the poses after changing `source/poses/*.png` (Python 3 with Pillow, numpy, scikit-image):

```bash
python3 tools/vectorize.py
```
