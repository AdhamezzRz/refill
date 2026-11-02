"""Idea 1 - 'Drawn before it's brewed' carousel. 5 slides 1080x1350 + a continuous line across slides."""
import math, random, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = sys.argv[1]
G, F = f"{S}/gen", f"{S}/fonts"
OUT = sys.argv[2]
W, H, N = 1080, 1350, 5
PLASTER, ESPRESSO, INK, OLIVE = (243, 239, 230), (53, 35, 23), (13, 13, 13), (92, 96, 80)

def font(w, size):
    return ImageFont.truetype(f"{F}/Montserrat-{w}.ttf", size)

def tracked(draw, xy, text, fnt, fill, track_em=0.0, anchor="l"):
    """Draw text with letter spacing. anchor l/c/r on x. Returns width."""
    sp = fnt.size * track_em
    widths = [draw.textlength(ch, font=fnt) for ch in text]
    total = sum(widths) + sp * (len(text) - 1)
    x, y = xy
    if anchor == "c": x -= total / 2
    elif anchor == "r": x -= total
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += w + sp
    return total

def tracked_width(draw, text, fnt, track_em):
    return sum(draw.textlength(c, font=fnt) for c in text) + fnt.size * track_em * (len(text) - 1)

# --- panorama of the five slides
pano = Image.new("RGB", (W * N, H))
for i in range(N):
    im = Image.open(f"{G}/s{i+1}.jpg").convert("RGB").resize((W, H), Image.LANCZOS)
    pano.paste(im, (i * W, 0))

# top gradient (espresso) for headline legibility, bottom gradient for the line
grad = Image.new("L", (1, H))
for y in range(H):
    top = max(0, 1 - y / 640) ** 1.5 * 200
    bot = max(0, (y - (H - 260)) / 260) ** 1.8 * 150
    grad.putpixel((0, y), int(max(top, bot)))
shade = Image.new("RGB", (W * N, H), ESPRESSO)
pano = Image.composite(shade, pano, grad.resize((W * N, H)))

d = ImageDraw.Draw(pano)

# --- the continuous pencil line across all slides (hand-drawn wobble)
random.seed(7)
y0 = H - 92
pts = []
x = 70
while x < W * 4 + 520:
    wob = 5 * math.sin(x / 97) + 3 * math.sin(x / 31 + 1.3) + random.uniform(-1.0, 1.0)
    pts.append((x, y0 + wob))
    x += 6
d.line(pts, fill=PLASTER, width=5, joint="curve")
# pencil-start dot on slide 1
d.ellipse((70 - 9, y0 - 9, 70 + 9, y0 + 9), fill=PLASTER)
# slide-boundary labels on the line: the countdown of what is being built
stops = ["WALLS", "PLANTERS", "SEATS", "LIGHTS"]
for k, lab in enumerate(stops):
    bx = k * W
    if k: d.line((bx, y0 - 16, bx, y0 + 16), fill=PLASTER, width=4)
    tracked(d, (bx + (100 if k == 0 else 28), y0 + 26), lab, font(600, 19), PLASTER, 0.32)
# line ends on slide 5 and rises into the cup-arch icon
ex, ey = pts[-1]
cx, top = W * 4 + 590, y0 - 150         # arch icon geometry
aw, ah, bar_gap, stroke = 120, 132, 26, 7
# connect line up into the left side of the arch
d.line([(ex, ey), (cx - aw / 2 - 40, y0), (cx - aw / 2, y0 - 30)], fill=PLASTER, width=5, joint="curve")
# arch: top bar, then a cup (flat top, straight sides, round bottom)
d.line((cx - aw / 2 - 18, top, cx + aw / 2 + 18, top), fill=PLASTER, width=stroke)
cup_top = top + bar_gap
r = aw / 2
d.line((cx - aw / 2, cup_top, cx + aw / 2, cup_top), fill=PLASTER, width=stroke)
d.line((cx - aw / 2, cup_top, cx - aw / 2, cup_top + ah - r), fill=PLASTER, width=stroke)
d.line((cx + aw / 2, cup_top, cx + aw / 2, cup_top + ah - r), fill=PLASTER, width=stroke)
d.arc((cx - r, cup_top + ah - 2 * r, cx + r, cup_top + ah), 0, 180, fill=PLASTER, width=stroke)
tracked(d, (cx + 6, top - 50), "SOON", font(600, 26), PLASTER, 0.4, anchor="c")

# --- per-slide typography
def header(i, right):
    x0 = i * W
    tracked(d, (x0 + 64, 58), "REFILL", font(600, 26), PLASTER, 0.6)
    tracked(d, (x0 + W - 64, 62), right, font(500, 18), PLASTER, 0.32, anchor="r")

def headline(i, lines, size=74, y=128, color=PLASTER, track=0.06, sub=None):
    x0 = i * W + 64
    f = font(600, size)
    for k, ln in enumerate(lines):
        tracked(d, (x0, y + k * size * 1.08), ln, f, color, track)
    if sub:
        sy = y + len(lines) * size * 1.08 + 22
        for k, s in enumerate(sub):
            d.text((x0, sy + k * 38), s, font=font(500, 28), fill=color)

header(0, "01 / 05")
headline(0, ["SOMETHING", "IS BREWING."], 84,
         sub=["We're drawing your next", "favourite place. Swipe."])
header(1, "02 / 05")
headline(1, ["PLANTERS: POURED.", "PLANTS: PENDING."], 64)
header(2, "03 / 05")
headline(2, ["THE BEST SEAT", "IS ALREADY TAKEN."], 66, sub=["(Only until we open.)"])
header(3, "04 / 05")
headline(3, ["HEAVY LIFTING", "IN PROGRESS."], 70, sub=["Coffee / People / Good days"])
header(4, "05 / 05")
headline(4, ["REFILLING", "SOON."], 84, sub=["El Shorouk, Cairo"])

# --- slide 5: the real wordmark inside the dashed sign frame on the facade
sign = Image.new("RGBA", (420, 140), (0, 0, 0, 0))
sd = ImageDraw.Draw(sign)
fw = font(600, 40)
tw = tracked_width(sd, "REFILL", fw, 0.6)
size = 40
while tw > 262:
    size -= 1; fw = font(600, size); tw = tracked_width(sd, "REFILL", fw, 0.6)
tracked(sd, (210, 26), "REFILL", fw, INK + (255,), 0.6, anchor="c")
fs = font(500, 11)
tracked(sd, (210, 26 + size + 10), "SPECIALTY COFFEE", fs, INK + (255,), 0.5, anchor="c")
sign = sign.rotate(2.2, resample=Image.BICUBIC, expand=False)
pano.paste(sign, (4 * W + 482 - 210, 528 - 64), sign)

# --- export slides and an overview strip
for i in range(N):
    pano.crop((i * W, 0, (i + 1) * W, H)).save(f"{OUT}/carousel-{i+1:02d}.jpg", quality=93)
strip = pano.resize((W * N // 3, H // 3), Image.LANCZOS)
strip.save(f"{OUT}/carousel-overview.jpg", quality=88)
print("ok")
