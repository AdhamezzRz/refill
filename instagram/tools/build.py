"""Refill Instagram identity: profile picture + highlight covers.
All marks are drawn on the measured geometry of the Refill cup-arch icon
(cup width 1, height 0.94, lid 1.095 wide, gap 0.17, stroke 0.084).
Writes SVG sources and an HTML render queue; tools/render.js turns them into PNG."""
import json, os, sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG = f"{ROOT}/svg"; os.makedirs(f"{SVG}/icons", exist_ok=True); os.makedirs(f"{SVG}/covers", exist_ok=True); os.makedirs(f"{SVG}/profile", exist_ok=True)

C = dict(plaster="#F3EFE6", greige="#C2B1A2", taupe="#A39077", olive="#5C6050", espresso="#352317", ink="#0D0D0D")
SW = 5.2  # icon stroke on the 100-unit grid (matches arch stroke/width ratio at icon scale)

def arch(cx, top, w, sw):
    """Refill cup-arch, centerline geometry so the outer edge matches the logo."""
    W = w - sw                       # centerline width of cup
    lid_w = w * 1.095 - sw * 0.0
    lid_y = top + sw / 2
    cup_top = top + sw + w * 0.17 + sw / 2
    cup_h = w * 0.94 - sw            # centerline height
    r = W / 2
    straight_end = cup_top + cup_h - r
    x0, x1 = cx - W / 2, cx + W / 2
    return (f'<line x1="{cx-lid_w/2:.2f}" y1="{lid_y:.2f}" x2="{cx+lid_w/2:.2f}" y2="{lid_y:.2f}"/>'
            f'<path d="M{x0:.2f} {straight_end:.2f} V{cup_top:.2f} H{x1:.2f} V{straight_end:.2f} '
            f'A{r:.2f} {r:.2f} 0 0 1 {x0:.2f} {straight_end:.2f} Z"/>')

def arch_height(w, sw): return sw + w * 0.17 + w * 0.94

# ---------- highlight glyphs, 100x100 grid, live area ~ 20..80 ----------
def g_location():
    return ('<path d="M31 42 A19 19 0 0 1 69 42 C69 56 58 66 50 78 C42 66 31 56 31 42 Z"/>'
            '<circle cx="50" cy="42" r="6.5"/>'
            '<line x1="36" y1="86" x2="64" y2="86"/>')

def g_menu():
    return ('<line x1="27" y1="20" x2="73" y2="20"/>'
            '<rect x="31" y="29" width="38" height="53"/>'
            '<line x1="40" y1="43" x2="60" y2="43"/><line x1="40" y1="54" x2="60" y2="54"/><line x1="40" y1="65" x2="53" y2="65"/>')

def g_bestsellers():
    w = 46; h = arch_height(w, SW); top = 50 - h / 2 + 7
    spark = ('<path d="M76 12 L78.2 19.8 L86 22 L78.2 24.2 L76 32 L73.8 24.2 L66 22 L73.8 19.8 Z" '
             'fill="currentColor" stroke="none"/>')
    return arch(46, top, w, SW) + spark

def g_about():
    return ('<path d="M34 82 V44 A16 16 0 0 1 66 44 V82"/>'
            '<circle cx="50" cy="47" r="6.5"/>'
            '<line x1="58.5" y1="62" x2="58.5" y2="70"/>'
            '<line x1="22" y1="82" x2="78" y2="82"/>')

def g_beans():
    return ('<g transform="rotate(32 50 50)">'
            '<ellipse cx="50" cy="50" rx="18" ry="27"/>'
            '<path d="M50 23 C41 36 59 62 50 77"/></g>')

def g_seasonal():
    import math
    # stem: quadratic bezier from bottom-left to top-right; leaves are long almonds set at +-48deg to the stem
    P0, P1, P2 = (32, 84), (40, 46), (70, 18)
    def pt(t): return tuple((1-t)**2*P0[i] + 2*(1-t)*t*P1[i] + t*t*P2[i] for i in range(2))
    def tan(t):
        dx = 2*(1-t)*(P1[0]-P0[0]) + 2*t*(P2[0]-P1[0]); dy = 2*(1-t)*(P1[1]-P0[1]) + 2*t*(P2[1]-P1[1])
        return math.degrees(math.atan2(dy, dx))
    out = [f'<path d="M{P0[0]} {P0[1]} Q{P1[0]} {P1[1]} {P2[0]} {P2[1]}"/>']
    for k, t in enumerate((0.30, 0.46, 0.62, 0.78)):
        x, y = pt(t); side = 1 if k % 2 == 0 else -1; L = 21 - k * 1.6
        ang = tan(t) + side * 48
        out.append(f'<path transform="translate({x:.2f} {y:.2f}) rotate({ang:.2f})" '
                   f'd="M0 0 C{L*0.3:.1f} {-L*0.24:.1f} {L*0.7:.1f} {-L*0.24:.1f} {L:.1f} 0 C{L*0.7:.1f} {L*0.24:.1f} {L*0.3:.1f} {L*0.24:.1f} 0 0 Z"/>')
    tx, ty = P2; a2 = tan(1.0)
    out.append(f'<path transform="translate({tx} {ty}) rotate({a2:.2f})" d="M-2 0 C2 -4 8 -4 12 0 C8 4 2 4 -2 0 Z"/>')
    x, y = pt(0.40)
    out.append(f'<line x1="{x:.2f}" y1="{y:.2f}" x2="{x+9:.2f}" y2="{y+7:.2f}"/><ellipse cx="{x+13:.2f}" cy="{y+12:.2f}" rx="5" ry="6.4" transform="rotate(-30 {x+13:.2f} {y+12:.2f})"/>')
    return "".join(out)

def g_reviews():
    star = []
    import math
    for i in range(10):
        r = 11 if i % 2 == 0 else 4.8
        a = -math.pi / 2 + i * math.pi / 5
        star.append(f"{50 + r * math.cos(a):.2f} {46 + r * math.sin(a):.2f}")
    return ('<path d="M26 24 H74 V58 A10 10 0 0 1 64 68 H44 L32 80 V68 H36 A10 10 0 0 1 26 58 Z"/>'
            f'<path d="M{" L".join(star)} Z" stroke-width="{SW*0.8:.2f}"/>')

def g_events():
    return ('<rect x="25" y="28" width="50" height="52"/>'
            '<line x1="25" y1="42" x2="75" y2="42"/>'
            '<line x1="38" y1="20" x2="38" y2="34"/><line x1="62" y1="20" x2="62" y2="34"/>'
            + ''.join(f'<rect x="{x}" y="{y}" width="5" height="5" fill="currentColor" stroke="none"/>'
                      for y in (51, 64) for x in (34, 47.5, 61) if not (x == 61 and y == 64)) +
            '<circle cx="63.5" cy="66.5" r="5.8"/>')

GLYPHS = [("location", "Location", g_location), ("menu", "Menu", g_menu), ("best-sellers", "Best sellers", g_bestsellers),
          ("about", "About Refill", g_about), ("beans", "Beans", g_beans), ("seasonal", "Seasonal", g_seasonal),
          ("reviews", "Reviews", g_reviews), ("events", "Events", g_events)]

def icon_svg(body, color="currentColor", size=None):
    sz = f' width="{size}" height="{size}"' if size else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"{sz} color="{color}">'
            f'<g fill="none" stroke="currentColor" stroke-width="{SW}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4">'
            f'{body}</g></svg>')

# ---------- cover sets (1080x1920 story; the highlight circle shows the centre) ----------
SETS = {
    "plaster":  [("plaster", "espresso")] * 8,
    "espresso": [("espresso", "plaster")] * 8,
    "tonal":    [("plaster", "espresso"), ("greige", "espresso"), ("taupe", "ink"), ("olive", "plaster"),
                 ("espresso", "plaster"), ("olive", "plaster"), ("taupe", "ink"), ("greige", "espresso")],
}
ICON_PX = 760  # 100-grid rendered at 430px -> glyph ~ 260px inside a ~1080px visible circle

def cover_svg(body, bg, fg):
    x = (1080 - ICON_PX) / 2; y = (1920 - ICON_PX) / 2
    s = ICON_PX / 100
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" color="{C[fg]}">'
            f'<rect width="1080" height="1920" fill="{C[bg]}"/>'
            f'<g transform="translate({x} {y}) scale({s})" fill="none" stroke="currentColor" stroke-width="{SW}" '
            f'stroke-linecap="butt" stroke-linejoin="miter">{body}</g></svg>')

# ---------- profile picture (1080x1080, circle-safe, optically centred) ----------
PROFILES = [("espresso", "plaster"), ("plaster", "ink"), ("olive", "plaster")]

def profile_svg(bg, fg, size=1080):
    w = size * 0.40; sw = w * 0.084; h = arch_height(w, sw)
    top = (size - h) / 2 - size * 0.012          # optical lift: the round bottom reads heavier
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
            f'<rect width="{size}" height="{size}" fill="{C[bg]}"/>'
            f'<g fill="none" stroke="{C[fg]}" stroke-width="{sw:.2f}" stroke-linecap="butt" stroke-linejoin="miter">'
            f'{arch(size/2, top, w, sw)}</g></svg>')

jobs = []
for slug, label, fn in GLYPHS:
    p = f"{SVG}/icons/{slug}.svg"; open(p, "w").write(icon_svg(fn()))
    for setname, combos in SETS.items():
        bg, fg = combos[[g[0] for g in GLYPHS].index(slug)]
        p = f"{SVG}/covers/{setname}-{slug}.svg"; open(p, "w").write(cover_svg(fn(), bg, fg))
        jobs.append(dict(src=p, out=f"{ROOT}/png/highlights-{setname}/{slug}.png", w=1080, h=1920))
for bg, fg in PROFILES:
    p = f"{SVG}/profile/profile-{bg}.svg"; open(p, "w").write(profile_svg(bg, fg))
    jobs.append(dict(src=p, out=f"{ROOT}/png/profile/profile-{bg}-1080.png", w=1080, h=1080))
# master logo icon (transparent, ink and plaster)
for name, col in (("ink", C["ink"]), ("plaster", C["plaster"]), ("espresso", C["espresso"])):
    w = 800; sw = w * 0.084; h = arch_height(w, sw)
    p = f"{SVG}/profile/arch-icon-{name}.svg"
    open(p, "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w*1.095+2:.0f}" height="{h+2:.0f}" '
                       f'viewBox="{-w*0.0475-1:.2f} -1 {w*1.095+2:.2f} {h+2:.2f}"><g fill="none" stroke="{col}" '
                       f'stroke-width="{sw:.2f}" stroke-linecap="butt">{arch(w/2, 0, w, sw)}</g></svg>')
    jobs.append(dict(src=p, out=f"{ROOT}/png/logo/arch-icon-{name}.png", w=round(w * 1.095 + 2), h=round(h + 2), transparent=True))
json.dump(dict(jobs=jobs, glyphs=[(s, l) for s, l, _ in GLYPHS], sets=list(SETS), colors=C), open(f"{ROOT}/tools/_jobs.json", "w"), indent=1)
print(len(jobs), "render jobs")
