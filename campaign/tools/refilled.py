"""Idea 3 - '92% REFILLED'. The REFILL cup-arch becomes a measuring cup over the real site photo;
the finished cafe fills it like coffee. Renders a 9:16 reel (mp4), a 9:16 story still and a 4:5 feed still."""
import math, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter

S, OUT = sys.argv[1], sys.argv[2]
G, F = f"{S}/gen", f"{S}/fonts"
PLASTER, ESPRESSO, INK = (243, 239, 230), (53, 35, 23), (13, 13, 13)
import os
PCT = int(os.environ.get("PCT", "92"))
TARGET = PCT / 100

def font(w, size): return ImageFont.truetype(f"{F}/Montserrat-{w}.ttf", size)

def tracked(d, xy, text, fnt, fill, em=0.0, anchor="l"):
    sp = fnt.size * em
    ws = [d.textlength(c, font=fnt) for c in text]
    tot = sum(ws) + sp * (len(text) - 1)
    x, y = xy
    if anchor == "c": x -= tot / 2
    elif anchor == "r": x -= tot
    for c, w in zip(text, ws):
        d.text((x, y), c, font=fnt, fill=fill); x += w + sp
    return tot

# --- base plates (full 1080x1920 scene) and per-format layouts
SRC_RAW = Image.open(f"{S}/drive/jpg/3809.jpg").convert("RGB").resize((1080, 1920), Image.LANCZOS)
SRC_FIN = Image.open(f"{G}/fin-3809.jpg").convert("RGB").resize((1080, 1920), Image.LANCZOS)
POUR_SRC = Image.open(f"{G}/pour.png").convert("RGBA")

def layout(fmt):
    global BW, BH, raw_np, fin_np, dim_np, pour, PS, STREAM_END, FEET_Y, CX, CW, TB, CT, CB, R, yy, xx, inside, TXT
    if fmt == "story":
        BW, BH, crop_y = 1080, 1920, 0
        PS, CX, CW, TB, CB = 0.22, 540, 860, 470, 1580
        TXT = dict(head=(64, 64), num=(64, 1630, 150), lab=(70, 1800), px=600)
    else:  # feed 4:5
        BW, BH, crop_y = 1080, 1350, 250
        PS, CX, CW, TB, CB = 0.165, 540, 680, 336, 1150
        TXT = dict(head=(64, 48), num=(60, 1172, 118), lab=(400, 1196), px=548)
    CT = TB + 56; R = CW / 2
    raw = SRC_RAW.crop((0, crop_y, 1080, crop_y + BH)); fin = SRC_FIN.crop((0, crop_y, 1080, crop_y + BH))
    dim = ImageEnhance.Color(raw).enhance(0.55)
    dim = Image.blend(dim, Image.new("RGB", (BW, BH), ESPRESSO), 0.42)
    raw_np, fin_np, dim_np = (np.asarray(i).astype(np.float32) for i in (raw, fin, dim))
    pour = POUR_SRC.resize((int(POUR_SRC.width * PS), int(POUR_SRC.height * PS)), Image.LANCZOS)
    STREAM_END = (236 * PS, 2047 * PS); FEET_Y = 1995 * PS
    yy, xx = np.mgrid[0:BH, 0:BW].astype(np.float32)
    inside = (np.abs(xx - CX) <= R) & (yy >= CT) & (
        (yy <= CB - R) | (((xx - CX) ** 2 + (yy - (CB - R)) ** 2) <= R ** 2))

layout("story")

def ease(t): return t * t * (3 - 2 * t)

def frame(t, level, wave_amp, stream_on, text_a, counter):
    """t seconds; level 0..1 of cup height."""
    surf = CB - level * (CB - CT)
    wave = surf + wave_amp * np.sin(xx / 52 + t * 5.0) + wave_amp * 0.5 * np.sin(xx / 23 - t * 3.1)
    filled = inside & (yy >= wave)
    empty = inside & ~filled
    out = dim_np.copy()
    out[empty] = raw_np[empty] * 0.92 + 255 * 0.08          # empty glass: real site, a touch brighter
    out[filled] = fin_np[filled]
    img = Image.fromarray(out.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    # meniscus line
    if level > 0.003:
        pts = [(x, float(surf + wave_amp * math.sin(x / 52 + t * 5.0) + wave_amp * 0.5 * math.sin(x / 23 - t * 3.1)))
               for x in range(int(CX - R) + 4, int(CX + R) - 3, 4)]
        pts = [(x, y) for x, y in pts if inside[min(int(y), BH - 1), x]]
        if len(pts) > 1: d.line(pts, fill=PLASTER, width=4)
    # cup-arch outline (brand icon proportions)
    st = 10
    d.line((CX - R - 34, TB, CX + R + 34, TB), fill=PLASTER, width=st)
    d.line((CX - R, CT, CX + R, CT), fill=PLASTER, width=st)
    d.line((CX - R, CT - st / 2, CX - R, CB - R + 6), fill=PLASTER, width=st)
    d.line((CX + R, CT - st / 2, CX + R, CB - R + 6), fill=PLASTER, width=st)
    d.arc((CX - R - st / 2, CB - 2 * R - st / 2, CX + R + st / 2, CB + st / 2), -2, 182, fill=PLASTER, width=st)
    # measuring ticks on the left wall
    for k in range(1, 20):
        f = k / 20; y = CB - f * (CB - CT)
        if y > CB - R: continue
        ln = 46 if k % 5 == 0 else 22
        d.line((CX - R + 8, y, CX - R + 8 + ln, y), fill=PLASTER, width=4)
        if k % 5 == 0:
            tracked(d, (CX - R + 64, y - 13), f"{int(f*100)}", font(600, 22), PLASTER, 0.1)
    # target mark at 92%
    ty = CB - TARGET * (CB - CT)
    d.line((CX + R - 70, ty, CX + R - 8, ty), fill=PLASTER, width=4)
    # founder on the lid line, pouring
    px = TXT["px"]; py = int(TB - FEET_Y)
    img.paste(pour, (px, py), pour)
    if stream_on > 0:
        sx, sy = px + STREAM_END[0], py + STREAM_END[1]
        end = surf if level > 0 else CB - 6
        end = sy + (end - sy) * stream_on
        pts = [(sx + 3 * math.sin(y / 30 + t * 9), y) for y in np.arange(sy, end, 6)]
        if len(pts) > 1: d.line(pts, fill=PLASTER, width=5)
    # header
    hx, hy = TXT["head"]
    tracked(d, (hx, hy), "REFILL", font(600, 30), PLASTER, 0.6)
    tracked(d, (hx, hy + 44), "SPECIALTY COFFEE", font(500, 15), PLASTER, 0.5)
    # counter + copy
    nx, ny, ns = TXT["num"]
    tracked(d, (nx, ny), f"{counter}%", font(600, ns), PLASTER, 0.02)
    lx, ly = TXT["lab"]
    lab = Image.new("RGBA", (BW, 160), (0, 0, 0, 0)); ld = ImageDraw.Draw(lab)
    tracked(ld, (lx, 0), "REFILLED.", font(600, 46), PLASTER + (255,), 0.32)
    ld.text((lx, 70), ("Now open. El Shorouk, Cairo." if PCT >= 100 else "Almost ready. El Shorouk, Cairo."), font=font(500, 30), fill=PLASTER + (255,))
    if text_a > 0:
        a = lab.split()[3].point(lambda v: int(v * text_a)); lab.putalpha(a)
        img.paste(lab, (0, ly - int(14 * (1 - text_a))), lab)
    return img

def state(t):
    fill_t = min(max((t - 0.8) / 4.4, 0), 1)
    level = TARGET * ease(fill_t)
    amp = 14 * (1 - fill_t) + 4
    stream = 1.0 if 0.5 < t < 5.3 else (min(1, (t - 0.2) / 0.3) if t <= 0.5 else max(0, 1 - (t - 5.3) / 0.35))
    stream = max(0.0, min(1.0, stream))
    text_a = min(max((t - 5.4) / 0.6, 0), 1)
    return level, amp, stream, text_a, int(round(level * 100))

if __name__ == "__main__":
    mode = sys.argv[3] if len(sys.argv) > 3 else "all"
    if mode in ("all", "stills"):
        final = frame(7.5, TARGET, 4, 0, 1, PCT)
        final.save(f"{OUT}/refilled-{PCT}-story-1080x1920.jpg", quality=93)
        layout("feed")
        frame(7.5, TARGET, 4, 0, 1, PCT).save(f"{OUT}/refilled-{PCT}-feed-1080x1350.jpg", quality=93)
        layout("story")
    if mode in ("all", "video"):
        fps, dur = 30, 8.0
        p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                              "-s", f"{BW}x{BH}", "-r", str(fps), "-i", "-", "-c:v", "libx264",
                              "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
                              f"{OUT}/refilled-{PCT}-reel-1080x1920.mp4"], stdin=subprocess.PIPE)
        for i in range(int(fps * dur)):
            t = i / fps
            p.stdin.write(frame(t, *state(t)).tobytes())
        p.stdin.close(); p.wait()
    print("ok")
