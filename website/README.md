# REFILL website

**A day at the bar.** The site opens on the real Refill bar at the real time in El Shorouk. At 08:00
it's morning light; at 22:00 the pendants are on and the city is lit up outside the window. A small
dial at the bottom lets you drag the sun through the whole day, 06:00 to midnight, and the light
moves across the counter. A line at each hour says what's happening ("Second bake. Sourdough cooling
on the rack."). The rest of the site is quiet: plaster, hairlines, one idea per screen.

- **Home** (`/`): the day, a short statement, the day in three acts (coffee, bakehouse, pizza
  soon), a swipeable "On the counter today", the room, and visit details.
- **Menu** (`/menu`): the real Refill menu (73 items), each with a house name, the plain name and the
  Arabic name, and its own photo. Desktop: point at an item and it is served in the Refill cup on the
  right. Phone: tap an item and a sheet slides up. A Hot / Iced switch re-pours every drink, flavour
  chips swap the photo, and "Can't decide?" spins through the menu until you tap Stop.
- **Rate** (`/rate`): the page behind the rating QR code. Five arch "cups" to fill.
- `docs/walkthrough-phone.mp4`, `docs/walkthrough-desktop.mp4`: recordings of the real site.
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

## The menu

Four numbered sections (01 Coffee, 02 Not coffee, 03 Bakehouse, 04 Kitchen, with a pizza "coming soon"
card), numbered categories, and a sticky bar that keeps the section and category in view.

Every item has a **house name** (`name`, e.g. "Quietly Particular") and right under it the **plain
name** people order by (`real`, "Flat white") and the Arabic (`ar`, "فلات وايت"), so the menu is
playful but never confusing. Some names tie in with the December posts (Sweet Talker, Main
Character, Soft Heart, Unbothered).

Everything comes from one file: **`public/js/menu-data.js`**. The items are from the café's menu
sheet; the house names and short descriptions were written for the site, so check them with the bar
and the kitchen.

- `serve: ['hot', 'iced']` prints Hot / Iced and drives the switch. `img` is the hot photo, `iced` the
  iced one; when the menu is set to Iced, drinks with an `iced` photo swap to it and hot-only drinks
  step back.
- `options: [['Cheese', 'croissant-cheese'], …]` prints flavour chips; tapping one swaps the photo.
- **Prices:** none yet. Add `price: 95` to an item and prices appear everywhere (list, stage, sheet,
  home page); until then the menu shows none.
- Also: `pairs` (id of another item, shown as "Goes well with"), `tags` (`v`, `n` contains nuts, `new`,
  `soon`).

Photos: 72 transparent cut-outs made with Higgsfield in one style (cream speckled stoneware, clear
glasses, soft window light). Sources are in `source/menu/`; after adding one, run
`bash tools/build-media.sh` (or the menu block in it) to make the 900 px and 240 px WebPs. Red Bull and
water are text-only on purpose.

## The Refill cup

The loader and every product frame use the logo's own geometry (cup width 1, lid 1.095 wide and 0.084
thick, gap 0.17, cup 0.94 tall with a round bottom). On load the cup fills with coffee as the page's
images actually arrive, the lid drops on, and the page opens. Products are served in the same cup
shape, and the rating page asks you to fill a cup.

## Settings: links, opening, ordering and ratings

Edit `site.config.json`, or set the matching environment variable in Hostinger (Environment variables):

| `site.config.json` | Env variable | What it does |
|---|---|---|
| `isOpen` | `IS_OPEN` | `false` (now): the top bar says "Opening soon". `true`: it shows live "Open now · until 00:00" or "Closed · opens 07:00". |
| `instagram` | `INSTAGRAM_URL` | Shows the Instagram links. |
| `maps` | `MAPS_URL` | Shows the "Directions" button. |
| `orderUrl` | `ORDER_URL` | `/order?table=07` redirects here with the table number. Empty: opens the menu with a "Table 07" note. |
| `rateUrl` | `RATE_URL` | `/rate?table=07` redirects here. Empty: shows the built-in rating page. |
| `googleReviewUrl` | `GOOGLE_REVIEW_URL` | After a 4 or 5 cup rating, offers "Tell everyone on Google". |
| `rateWebhookUrl` | `RATE_WEBHOOK_URL` | Each rating is also POSTed here as JSON (for example a Google Sheet or Zapier hook). |

Links with nothing set are hidden, so nothing on the site is a dead link. Opening hours (07:00 to
00:00) live in `menu-data.js` under `hours`.

**Table QR signs:** point them at `https://YOUR-DOMAIN/order?table={table}` and
`https://YOUR-DOMAIN/rate?table={table}` (see `../qr-signs/config.json`).

**Ratings:** the `/rate` page sends `{score, table, note}` to `/api/rate`. Each one is written to the
server log as a `[rating]` line (Hostinger: Runtime logs) and forwarded to the webhook if set.
Hostinger wipes app files on every deploy, so ratings are deliberately not stored on disk. Set the
webhook to keep them.

## Before launch, check

- The menu in `public/js/menu-data.js`: house names, descriptions, Hot / Iced availability, and prices.
- Exact address and the maps link; opening date; hours.
- The images are AI visualisations made from the designer's 3D render (the bar in four lights,
  three time-lapse clips) and AI product photos. Swap in real photography once the café is open.

## How it is built

- `public/js/day.js`: the hero. 49 frames (`public/assets/day/l` landscape, `/p` portrait for
  phones) are drawn on a canvas and cross-faded, so the light moves smoothly at any minute. Key frames
  load first, the rest stream in. On load the day plays from 06:00 to the current time in Cairo.
- `public/js/menu.js`: renders the menu, the desktop stage, the phone sheet (swipe down to close),
  the tab underline that follows your scroll, the Hot / Iced switch, flavour chips and the spin.
- `public/js/site.js`: top bar, index overlay, reveals, smooth wheel scrolling (Lenis), the counter
  rail.
- `public/vendor/`: GSAP 3, ScrollTrigger and Lenis, vendored (no CDN).
- `source/`: the Higgsfield originals (bar stills, time-lapse clips, product cut-outs).
  `tools/build-media.sh` turns them into the web files.
- Fonts are self-hosted: Montserrat (display), Inter (text), Alexandria (Arabic).
- `prefers-reduced-motion` is respected: no intro, no parallax, the hero jumps straight to now.
