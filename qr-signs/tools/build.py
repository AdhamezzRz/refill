"""Refill table QR signs: three designs, print-ready.
Every face is one SVG drawn in millimetres (viewBox = mm, 3 mm bleed), wrapped in HTML with embedded fonts.
tools/render.js turns each into a vector PDF at true size and a 300 dpi PNG; tools/verify.py decodes every QR.

Usage: python3 tools/build.py [config.json]
"""
import base64, io, json, math, os, sys
import segno
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(sys.argv[1] if len(sys.argv) > 1 else f"{ROOT}/config.json"))
SRC, FONTS, OUT = f"{ROOT}/source", f"{ROOT}/source/fonts", f"{ROOT}/build"
os.makedirs(f"{OUT}/html", exist_ok=True)

C = dict(plaster="#F3EFE6", greige="#C2B1A2", taupe="#A39077", olive="#5C6050", espresso="#352317", ink="#0D0D0D")
BLEED = 3.0

# ---------------------------------------------------------------- helpers
def b64(path): return base64.b64encode(open(path, "rb").read()).decode()

FONT_CSS = "".join(
    f"@font-face{{font-family:'{fam}';font-weight:{w};src:url(data:font/ttf;base64,{b64(f'{FONTS}/{fn}')})}}"
    for fam, w, fn in [("Montserrat", 500, "Montserrat-500.ttf"), ("Montserrat", 600, "Montserrat-600.ttf"),
                       ("Inter", 400, "Inter-400.ttf"), ("Inter", 500, "Inter-500.ttf"),
                       ("Alexandria", 400, "Alexandria-400.ttf"), ("Alexandria", 600, "Alexandria-600.ttf")])

_tint_cache = {}
def lineart(name, color):
    """Recolour a white line-art pose to a brand colour, return data URI + aspect."""
    key = (name, color)
    if key not in _tint_cache:
        im = Image.open(f"{SRC}/pose-{name}.png").convert("RGBA")
        solid = Image.new("RGBA", im.size, color); solid.putalpha(im.split()[3])
        buf = io.BytesIO(); solid.save(buf, "PNG", optimize=True)
        _tint_cache[key] = ("data:image/png;base64," + base64.b64encode(buf.getvalue()).decode(), im.height / im.width)
    return _tint_cache[key]

def text(x, y, s, size, fam="Montserrat", weight=600, fill=C["ink"], ls=0.0, anchor="middle", extra=""):
    """SVG text in mm. ls = letter-spacing in em; centred text is shifted to cancel the trailing space."""
    dx = (size * ls / 2) if anchor == "middle" and ls else 0
    s = s.replace("&", "&amp;")
    return (f'<text x="{x + dx:.3f}" y="{y:.3f}" font-family="{fam}" font-weight="{weight}" font-size="{size}" '
            f'fill="{fill}" text-anchor="{anchor}" letter-spacing="{ls}em" {extra}>{s}</text>')

def arabic(x, y, s, size, fill, weight=400):
    return (f'<text x="{x:.3f}" y="{y:.3f}" font-family="Alexandria" font-weight="{weight}" font-size="{size}" '
            f'fill="{fill}" text-anchor="middle" direction="rtl" unicode-bidi="plaintext">{s}</text>')

def arch_icon(cx, top, w, color, sw=None):
    """The Refill cup-arch on its measured geometry (outer width w)."""
    sw = sw or w * 0.084
    W = w - sw; lid = w * 1.095; r = W / 2
    lid_y = top + sw / 2; cup_top = top + sw + w * 0.17 + sw / 2
    end = cup_top + (w * 0.94 - sw) - r; x0, x1 = cx - W / 2, cx + W / 2
    return (f'<g fill="none" stroke="{color}" stroke-width="{sw:.3f}">'
            f'<line x1="{cx-lid/2:.3f}" y1="{lid_y:.3f}" x2="{cx+lid/2:.3f}" y2="{lid_y:.3f}"/>'
            f'<path d="M{x0:.3f} {end:.3f} V{cup_top:.3f} H{x1:.3f} V{end:.3f} A{r:.3f} {r:.3f} 0 0 1 {x0:.3f} {end:.3f} Z"/></g>')

def arch_height(w): return w * 0.084 + w * 0.17 + w * 0.94

def wordmark(cx, y, cap, color, sub=True):
    out = text(cx, y, "REFILL", cap, ls=0.6, fill=color)
    if sub: out += text(cx, y + cap * 0.62, "SPECIALTY COFFEE", cap * 0.27, weight=500, ls=0.5, fill=color)
    return out

def qr(url, x, y, size, dark, light, logo=True):
    """Vector QR (ECC H). Square data modules for scan reliability; finder eyes softened slightly;
    7x7-module centre knockout carrying the arch icon. Draws its own quiet-zone panel."""
    global LAST; LAST = (x, y)
    q = segno.make(url, error="h", micro=False)
    m = [list(r) for r in q.matrix]; n = len(m)
    quiet = 4; u = size / (n + 2 * quiet)
    ox, oy = x + quiet * u, y + quiet * u
    c0 = (n - 7) // 2
    def in_finder(r, c):
        return (r < 7 and c < 7) or (r < 7 and c >= n - 7) or (r >= n - 7 and c < 7)
    def in_logo(r, c): return logo and c0 <= r < c0 + 7 and c0 <= c < c0 + 7
    parts = [f'<rect x="{x:.3f}" y="{y:.3f}" width="{size:.3f}" height="{size:.3f}" rx="{u*1.2:.3f}" fill="{light}"/>']
    path = []
    for r in range(n):
        c = 0
        while c < n:
            if m[r][c] and not in_finder(r, c) and not in_logo(r, c):
                s = c
                while c < n and m[r][c] and not in_finder(r, c) and not in_logo(r, c): c += 1
                path.append(f"M{ox+s*u:.3f} {oy+r*u:.3f}h{(c-s)*u:.3f}v{u:.3f}h{-(c-s)*u:.3f}z")
            else:
                c += 1
    parts.append(f'<path d="{"".join(path)}" fill="{dark}"/>')
    for fr, fc in ((0, 0), (0, n - 7), (n - 7, 0)):   # standard square finders: rounded eyes fail real-world decoders
        fx, fy = ox + fc * u, oy + fr * u
        parts.append(f'<path d="M{fx:.3f} {fy:.3f}h{7*u:.3f}v{7*u:.3f}h{-7*u:.3f}z M{fx+u:.3f} {fy+u:.3f}v{5*u:.3f}h{5*u:.3f}v{-5*u:.3f}z" '
                     f'fill="{dark}" fill-rule="evenodd"/>'
                     f'<rect x="{fx+2*u:.3f}" y="{fy+2*u:.3f}" width="{3*u:.3f}" height="{3*u:.3f}" fill="{dark}"/>')
    if logo:
        lw = 4.2 * u; lh = arch_height(lw)
        parts.append(arch_icon(ox + (c0 + 3.5) * u, oy + (c0 + 3.5) * u - lh / 2, lw, dark))
    return "".join(parts), n

def corners(x, y, w, h, l, sw, color):
    """Frame brackets, the 'frame' device from the social grid."""
    p = []
    for cx, cy, sx, sy in ((x, y, 1, 1), (x + w, y, -1, 1), (x, y + h, 1, -1), (x + w, y + h, -1, -1)):
        p.append(f'<path d="M{cx:.3f} {cy + sy*l:.3f} V{cy:.3f} H{cx + sx*l:.3f}" fill="none" stroke="{color}" stroke-width="{sw}"/>')
    return "".join(p)

def page(name, w, h, body, clip=None, note=""):
    """Write one face. w,h = trim size in mm; the SVG adds BLEED on all sides; content uses trim coordinates."""
    W, H = w + 2 * BLEED, h + 2 * BLEED
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="{-BLEED} {-BLEED} {W} {H}">'
           f'{body}</svg>')
    html = (f'<!doctype html><html><head><meta charset="utf-8"><style>{FONT_CSS}'
            f'@page{{size:{W}mm {H}mm;margin:0}}html,body{{margin:0;padding:0;background:transparent}}svg{{display:block}}.cut{{display:none}}.proof .cut{{display:inline}}'
            f'</style></head><body>{svg}</body></html>')
    open(f"{OUT}/html/{name}.html", "w").write(html)
    JOBS.append(dict(name=name, w_mm=W, h_mm=H, html=f"{OUT}/html/{name}.html", note=note))

JOBS, QRS = [], []
T = CFG["table"]; ORDER = CFG["order_url"].format(table=T); RATE = CFG["rate_url"].format(table=T)

# ================================================================ 01 THE ARCH  (standee, 90 x 130 mm arch, oak base)
AW, AH, R = 90.0, 130.0, 45.0
SLOT = 12.0   # hidden in the oak base
def arch_shape(): return f"M0 {AH} V{R} A{R} {R} 0 0 1 {AW} {R} V{AH} Z"
def arch_bleed():
    b = BLEED; return f"M{-b} {AH+b} V{R} A{R+b} {R+b} 0 0 1 {AW+b} {R} V{AH+b} Z"
CUT = f'<path class="cut" d="{arch_shape()}" fill="none" stroke="#FF00FF" stroke-width="0.25"/>'

def porthole(cx, cy, d, col):
    return (f'<circle cx="{cx}" cy="{cy}" r="{d/2}" fill="none" stroke="{col}" stroke-width="0.45"/>'
            + arch_icon(cx, cy - arch_height(d * 0.42) / 2, d * 0.42, col))

def arch_face(side):
    bg, fg, sub = (C["plaster"], C["ink"], C["espresso"]) if side == "front" else (C["espresso"], C["plaster"], C["greige"])
    url, verb, line1, ar = ((ORDER, "SCAN TO ORDER", "Stay seated. We'll bring it to you.", "خليك مكانك، اطلب وإحنا نجيبهولك")
                            if side == "front" else
                            (RATE, "SCAN TO RATE", "Two taps. Honest answers welcome.", "قيّم قهوتك في ثانيتين"))
    cx = AW / 2
    body = f'<path d="{arch_bleed()}" fill="{bg}"/>'
    # inner arch keyline, echoing the doorway
    body += f'<path d="M6 {AH-SLOT-2} V{R} A{R-6} {R-6} 0 0 1 {AW-6} {R} V{AH-SLOT-2}" fill="none" stroke="{fg}" stroke-width="0.3" opacity=".55"/>'
    body += porthole(cx, 20.5, 15, fg)
    body += wordmark(cx, 38.5, 5.6, fg)
    qs = 40.5; qx, qy = cx - qs / 2, 47.6
    g, n = qr(url, qx, qy, qs, C["espresso"] if side == "front" else C["espresso"], C["plaster"] if side == "back" else "#FBF9F4")
    body += g; QRS.append(dict(x_mm=LAST[0], y_mm=LAST[1], face=f"01-arch-{side}", url=url, modules=n, size_mm=qs))
    body += corners(qx - 3.2, qy - 3.2, qs + 6.4, qs + 6.4, 4, 0.45, fg)
    body += text(cx, 96.6, verb, 3.4, ls=0.32, fill=fg)
    body += text(cx, 101.4, line1, 2.45, fam="Inter", weight=400, fill=sub if side == "front" else C["greige"])
    body += arabic(cx, 106.0, ar, 2.5, sub if side == "front" else C["greige"])
    body += (f'<line x1="{cx-9}" y1="109.3" x2="{cx+9}" y2="109.3" stroke="{fg}" stroke-width="0.3"/>'
             + text(cx, 113.2, f"TABLE {T}" if side == "front" else "GOOD COFFEE. BETTER DAYS.", 1.9, weight=500, ls=0.4, fill=fg))
    page(f"01-arch-{side}", AW, AH, body + CUT, note="Die-cut arch, 3 mm bleed. Magenta = cut line. Bottom 12 mm sits in the oak base slot.")

arch_face("front"); arch_face("back")

# ================================================================ 02 DON'T GET UP  (A6 tent card, 105 x 148 per face)
TW, TH = 105.0, 148.0
def tent_front():
    bg, fg = C["plaster"], C["ink"]
    body = f'<rect x="{-BLEED}" y="{-BLEED}" width="{TW+2*BLEED}" height="{TH+2*BLEED}" fill="{bg}"/>'
    body += text(9, 11.5, "REFILL", 3.2, ls=0.6, fill=fg, anchor="start")
    body += text(TW - 9, 11.5, f"TABLE {T}", 2.1, weight=500, ls=0.35, fill=fg, anchor="end")
    body += text(9, 30, "DON'T", 12.5, ls=0.04, fill=fg, anchor="start") + text(9, 43, "GET UP.", 12.5, ls=0.04, fill=fg, anchor="start")
    # QR panel with the founder lounging on its top edge
    qs = 46.0; qx, qy = (TW - qs) / 2, 72.0
    uri, ar = lineart("lounge", C["espresso"]); lw = 74.0; lh = lw * ar
    body += f'<image href="{uri}" x="{(TW-lw)/2 + 4:.3f}" y="{qy - lh + 1.6:.3f}" width="{lw}" height="{lh:.3f}"/>'
    body += f'<line x1="{qx-6}" y1="{qy-0.6}" x2="{qx+qs+6}" y2="{qy-0.6}" stroke="{C["espresso"]}" stroke-width="0.7"/>'
    g, n = qr(ORDER, qx, qy + 1.2, qs, C["espresso"], "#FBF9F4"); body += g
    QRS.append(dict(x_mm=LAST[0], y_mm=LAST[1], face="02-tent-front", url=ORDER, modules=n, size_mm=qs))
    body += text(TW / 2, 128, "SCAN TO ORDER", 3.4, ls=0.32, fill=fg)
    body += text(TW / 2, 133.6, "Order from your seat. We'll walk it over.", 2.6, fam="Inter", weight=400, fill=C["espresso"])
    body += arabic(TW / 2, 139.2, "متقومش. اطلب من مكانك وإحنا هنجيبهولك", 2.6, C["espresso"])
    page("02-tent-front", TW, TH, body, note="A6 face. Fold line on the top edge (see imposed sheet).")

def tent_back():
    bg, fg = C["olive"], C["plaster"]
    body = f'<rect x="{-BLEED}" y="{-BLEED}" width="{TW+2*BLEED}" height="{TH+2*BLEED}" fill="{bg}"/>'
    body += text(9, 11.5, "REFILL", 3.2, ls=0.6, fill=fg, anchor="start")
    body += text(TW - 9, 11.5, f"TABLE {T}", 2.1, weight=500, ls=0.35, fill=fg, anchor="end")
    body += text(9, 30, "LOVED IT?", 11, ls=0.04, fill=fg, anchor="start")
    body += text(9, 42, "TELL EVERYONE.", 8.6, ls=0.04, fill=fg, anchor="start")
    body += text(9, 49.5, "Not quite right? Tell us first. We'll fix it.", 2.6, fam="Inter", weight=400, fill=C["plaster"], anchor="start")
    qs = 44.0; qx, qy = 9.0, 62.0
    g, n = qr(RATE, qx, qy, qs, C["espresso"], C["plaster"]); body += g
    QRS.append(dict(x_mm=LAST[0], y_mm=LAST[1], face="02-tent-back", url=RATE, modules=n, size_mm=qs))
    uri, ar = lineart("waiter", C["plaster"]); ww = 26.0; wh = ww * ar
    body += f'<image href="{uri}" x="{TW - 9 - ww + 1:.3f}" y="{qy + qs + 14 - wh:.3f}" width="{ww}" height="{wh:.3f}"/>'
    body += text(9, 119, "SCAN TO RATE", 3.4, ls=0.32, fill=fg, anchor="start")
    body += (f'<text x="9" y="125.4" font-family="Alexandria" font-weight="400" font-size="2.6" fill="{C["plaster"]}" '
             f'text-anchor="end" direction="rtl">عجبتك؟ قول للكل. مش مظبوطة؟ قولنا إحنا الأول</text>')
    body += f'<line x1="9" y1="137.5" x2="{TW-9}" y2="137.5" stroke="{fg}" stroke-width="0.3" opacity=".6"/>'
    body += text(9, 142, "GOOD COFFEE. BETTER DAYS.", 1.9, weight=500, ls=0.4, fill=fg, anchor="start")
    body += text(TW - 9, 142, "EL SHOROUK", 1.9, weight=500, ls=0.4, fill=fg, anchor="end")
    page("02-tent-back", TW, TH, body, note="A6 face.")

tent_front(); tent_back()

# imposed flat sheet: back (rotated 180) on top, front below, fold in the middle
def tent_sheet():
    W, H = TW, TH * 2
    f = open(f"{OUT}/html/02-tent-front.html").read(); b = open(f"{OUT}/html/02-tent-back.html").read()
    svg_f = f[f.index("<svg"):f.index("</svg>") + 6]; svg_b = b[b.index("<svg"):b.index("</svg>") + 6]
    inner = lambda s: s[s.index(">") + 1:s.rindex("</svg>")]
    body = (f'<g transform="rotate(180 {TW/2} {TH/2})"><svg x="{-BLEED}" y="{-BLEED}" width="{TW+2*BLEED}" height="{TH+BLEED}" '
            f'viewBox="{-BLEED} {-BLEED} {TW+2*BLEED} {TH+BLEED}" overflow="hidden">{inner(svg_b)}</svg></g>'
            f'<svg x="{-BLEED}" y="{TH}" width="{TW+2*BLEED}" height="{TH+BLEED}" viewBox="{-BLEED} 0 {TW+2*BLEED} {TH+BLEED}" overflow="hidden">{inner(svg_f)}</svg>'
            f'<line x1="{-BLEED}" y1="{TH}" x2="{TW+BLEED}" y2="{TH}" stroke="#00AEEF" stroke-width="0.25" stroke-dasharray="1.5 1"/>')
    page("02-tent-imposed-flat", W, H, body, note="Imposed flat: 105 x 296 mm + bleed. Cyan dashed = fold.")
tent_sheet()

# ================================================================ 03 REFILL-O-METER  (100 mm round disc)
D = 100.0; RR = D / 2; cx = cy = RR
def disc():
    bg, fg = C["espresso"], C["plaster"]
    body = f'<circle cx="{cx}" cy="{cy}" r="{RR+BLEED}" fill="{bg}"/>'
    # gauge: 5 cups on a 150-degree arc over the top, each filled a little more, taupe liquid
    levels = [(0.0, "SLEEPY"), (0.25, "WAKING UP"), (0.5, "GETTING THERE"), (0.75, "GOOD DAY"), (1.0, "REFILLED")]
    ra = 38.0; a0, a1 = 195, 345
    body += (f'<path d="M{cx+ (ra-6.2)*math.cos(math.radians(a0)):.3f} {cy+(ra-6.2)*math.sin(math.radians(a0)):.3f} '
             f'A{ra-6.2} {ra-6.2} 0 0 1 {cx+(ra-6.2)*math.cos(math.radians(a1)):.3f} {cy+(ra-6.2)*math.sin(math.radians(a1)):.3f}" '
             f'fill="none" stroke="{fg}" stroke-width="0.3" opacity=".5"/>')
    for k in range(31):  # ticks
        a = math.radians(a0 + (a1 - a0) * k / 30); L = 1.6 if k % 15 == 0 else (1.1 if k % 3 == 0 else 0.6)
        r1 = ra - 6.2; body += (f'<line x1="{cx+r1*math.cos(a):.3f}" y1="{cy+r1*math.sin(a):.3f}" x2="{cx+(r1+L)*math.cos(a):.3f}" '
                                f'y2="{cy+(r1+L)*math.sin(a):.3f}" stroke="{fg}" stroke-width="0.25"/>')
    defs = []
    for i, (lv, lab) in enumerate(levels):
        a = a0 + (a1 - a0) * i / 4; ar_ = math.radians(a)
        px, py = cx + ra * math.cos(ar_), cy + ra * math.sin(ar_)
        w = 5.4; h = arch_height(w); top = -h / 2
        sw = w * 0.084; W = w - sw; r = W / 2; cup_top = top + sw + w * 0.17 + sw / 2; end = cup_top + (w * 0.94 - sw) - r
        inner = f"M{-W/2:.3f} {end:.3f} V{cup_top:.3f} H{W/2:.3f} V{end:.3f} A{r:.3f} {r:.3f} 0 0 1 {-W/2:.3f} {end:.3f} Z"
        fill_y = (cup_top + (end + r - cup_top) * (1 - lv))
        defs.append(f'<clipPath id="cup{i}"><path d="{inner}"/></clipPath>')
        body += (f'<g transform="translate({px:.3f} {py:.3f}) rotate({a+90:.2f})">'
                 f'<rect x="{-W/2}" y="{fill_y:.3f}" width="{W}" height="{end + r - fill_y + 0.5:.3f}" fill="{C["taupe"]}" clip-path="url(#cup{i})"/>'
                 f'{arch_icon(0, top, w, fg)}</g>')
        # curved label outside the cup
        lr = ra + 5.6; span = 13
        sa, ea = math.radians(a - span), math.radians(a + span)
        defs.append(f'<path id="lab{i}" d="M{cx+lr*math.cos(sa):.3f} {cy+lr*math.sin(sa):.3f} A{lr} {lr} 0 0 1 {cx+lr*math.cos(ea):.3f} {cy+lr*math.sin(ea):.3f}"/>')
        body += (f'<text font-family="Montserrat" font-weight="600" font-size="1.55" fill="{fg}" letter-spacing="0.22em">'
                 f'<textPath href="#lab{i}" startOffset="50%" text-anchor="middle">{lab}</textPath></text>')
    # needle: sweeps up to REFILLED
    na = math.radians(a1 - 4)
    body += (f'<line x1="{cx+(ra-14)*math.cos(na):.3f}" y1="{cy+(ra-14)*math.sin(na):.3f}" x2="{cx+(ra-7.6)*math.cos(na):.3f}" '
             f'y2="{cy+(ra-7.6)*math.sin(na):.3f}" stroke="{C["taupe"]}" stroke-width="0.7"/>')
    # QR on a plaster card, founder sitting on top pointing down
    qs = 35.0; qx, qy = cx - qs / 2, 44.0
    uri, ar = lineart("point", fg); fw = 12.5; fh = fw * ar
    body += f'<image href="{uri}" x="{cx - fw*0.50:.3f}" y="{qy - fh*0.40:.3f}" width="{fw}" height="{fh:.3f}"/>'
    g, n = qr(RATE, qx, qy, qs, C["espresso"], C["plaster"]); body += g
    QRS.append(dict(x_mm=LAST[0], y_mm=LAST[1], face="03-meter-disc", url=RATE, modules=n, size_mm=qs))
    body += text(cx, 84.2, "HOW REFILLED ARE YOU?", 2.5, ls=0.18, fill=fg)
    body += arabic(cx, 88.6, "مزاجك اتملى قد إيه؟", 2.3, C["greige"])
    # bottom arc text
    br = 46.0; sa, ea = math.radians(150), math.radians(30)
    defs.append(f'<path id="bot" d="M{cx+br*math.cos(sa):.3f} {cy+br*math.sin(sa):.3f} A{br} {br} 0 0 0 {cx+br*math.cos(ea):.3f} {cy+br*math.sin(ea):.3f}"/>')
    body += (f'<text font-family="Montserrat" font-weight="500" font-size="1.6" fill="{C["greige"]}" letter-spacing="0.4em">'
             f'<textPath href="#bot" startOffset="50%" text-anchor="middle">SCAN TO RATE · OR ORDER ANOTHER · TABLE {T}</textPath></text>')
    body = f"<defs>{''.join(defs)}</defs>" + body
    body += f'<circle class="cut" cx="{cx}" cy="{cy}" r="{RR}" fill="none" stroke="#FF00FF" stroke-width="0.25"/>'
    page("03-meter-disc", D, D, body, note="100 mm round, die-cut. Magenta = cut line.")
disc()

json.dump(dict(jobs=JOBS, qrs=QRS, order_url=ORDER, rate_url=RATE), open(f"{OUT}/_manifest.json", "w"), indent=1)
print(len(JOBS), "faces;", ", ".join(f"{q['face']} v{(q['modules']-17)//4} {q['size_mm']}mm" for q in QRS))
