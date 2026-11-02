"""Idea 2 - 'SAME ROOM. SOON.' reel: two AI transformation shots + typography overlays + branded end card."""
import subprocess, sys
from PIL import Image, ImageDraw, ImageFont

S, OUT = sys.argv[1], sys.argv[2]
G, F, T = f"{S}/gen", f"{S}/fonts", f"{S}/gen/reel"
import os; os.makedirs(T, exist_ok=True)
W, H = 1080, 1920
PLASTER, ESPRESSO, INK = (243, 239, 230), (53, 35, 23), (13, 13, 13)

def font(w, s): return ImageFont.truetype(f"{F}/Montserrat-{w}.ttf", s)
def tracked(d, xy, text, fnt, fill, em=0.0, anchor="l"):
    sp = fnt.size * em; ws = [d.textlength(c, font=fnt) for c in text]
    tot = sum(ws) + sp * (len(text) - 1); x, y = xy
    if anchor == "c": x -= tot / 2
    for c, w in zip(text, ws): d.text((x, y), c, font=fnt, fill=fill); x += w + sp
    return tot

def rgba(): return Image.new("RGBA", (W, H), (0, 0, 0, 0))

# persistent header + top gradient
head = rgba(); hd = ImageDraw.Draw(head)
for y in range(560):
    a = int(185 * (1 - y / 560) ** 1.6); hd.line((0, y, W, y), fill=ESPRESSO + (a,))
tracked(hd, (64, 70), "REFILL", font(600, 30), PLASTER, 0.6)
tracked(hd, (W - 64 - hd.textlength("EL SHOROUK", font=font(500, 18)) - 18 * 0.32 * 9, 76), "EL SHOROUK", font(500, 18), PLASTER, 0.32)
head.save(f"{T}/head.png")

def line_img(text, y, size=96):
    im = rgba(); d = ImageDraw.Draw(im)
    tracked(d, (64, y), text, font(600, size), PLASTER, 0.06); im.save(f"{T}/{text.replace(' ', '_').replace('.', '')}_{y}.png")
    return f"{T}/{text.replace(' ', '_').replace('.', '')}_{y}.png"

shots = [  # video, first line, swap time (s) when 'SOON.' appears
    (f"{G}/shot1-planter.mp4", "SAME ROOM.", 2.2),
    (f"{G}/shot2-bar.mp4", "SAME BAR.", 3.4),
]
segs = []
for i, (vid, l1, tswap) in enumerate(shots):
    a = line_img(l1, 150); b = line_img("SOON.", 258)
    seg = f"{T}/seg{i}.mp4"
    fc = (f"[0:v]scale={W}:{H}:flags=lanczos,fps=30,setsar=1[v];"
          f"[1:v]format=rgba[h];[2:v]format=rgba,fade=t=in:st=0.15:d=0.45:alpha=1[a];"
          f"[3:v]format=rgba,fade=t=in:st={tswap}:d=0.45:alpha=1[b];"
          f"[v][h]overlay=0:0[v1];[v1][a]overlay=0:0[v2];[v2][b]overlay=0:0,format=yuv420p[o]")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", vid,
                    "-loop", "1", "-i", f"{T}/head.png", "-loop", "1", "-i", a, "-loop", "1", "-i", b,
                    "-filter_complex", fc, "-map", "[o]", "-t", "6.5", "-an",
                    "-c:v", "libx264", "-crf", "18", "-preset", "medium", seg], check=True)
    segs.append(seg)

# end card: plaster, ink founder pouring into the cup-arch, wordmark
card = Image.new("RGB", (W, H), PLASTER); d = ImageDraw.Draw(card)
pour = Image.open(f"{G}/pour.png").convert("RGBA")
PS = 0.20; pour = pour.resize((int(pour.width * PS), int(pour.height * PS)), Image.LANCZOS)
ink = Image.new("RGBA", pour.size, INK + (255,)); ink.putalpha(pour.split()[3])
cx, aw, st = 540, 300, 9
tb = 760; ct = tb + 34; cb = ct + 330; r = aw / 2
px = 418; py = int(tb - 1995 * PS) - 2
card.paste(ink, (px, py), ink)
d.line((cx - r - 20, tb, cx + r + 20, tb), fill=INK, width=st)
d.line((cx - r, ct, cx + r, ct), fill=INK, width=st)
d.line((cx - r, ct - st / 2, cx - r, cb - r + 6), fill=INK, width=st)
d.line((cx + r, ct - st / 2, cx + r, cb - r + 6), fill=INK, width=st)
d.arc((cx - r - st / 2, cb - 2 * r - st / 2, cx + r + st / 2, cb + st / 2), -2, 182, fill=INK, width=st)
tracked(d, (cx, 1230), "REFILL", font(600, 92), INK, 0.6, anchor="c")
tracked(d, (cx, 1350), "SPECIALTY COFFEE", font(500, 24), INK, 0.5, anchor="c")
tracked(d, (cx, 1500), "ALMOST THERE.", font(600, 40), ESPRESSO, 0.3, anchor="c")
tracked(d, (cx, 1566), "El Shorouk, Cairo", font(500, 30), ESPRESSO, 0.02, anchor="c")
card.save(f"{OUT}/same-room-endcard-1080x1920.jpg", quality=93)
endseg = f"{T}/end.mp4"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-loop", "1", "-i", f"{OUT}/same-room-endcard-1080x1920.jpg",
                "-vf", "fps=30,format=yuv420p,fade=t=in:st=0:d=0.5", "-t", "3",
                "-c:v", "libx264", "-crf", "18", endseg], check=True)
segs.append(endseg)
with open(f"{T}/list.txt", "w") as fh:
    for s in segs: fh.write(f"file '{s}'\n")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", f"{T}/list.txt",
                "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                f"{OUT}/same-room-soon-reel-1080x1920.mp4"], check=True)
print("ok")
