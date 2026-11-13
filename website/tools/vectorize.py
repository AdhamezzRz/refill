"""Trace the white line-art founder poses (8-bit ink masks) into centre-line SVG strokes.
Each stroke is a separate <path pathLength="1">, ordered top to bottom, so the site can draw him line by line.
Usage: python3 tools/vectorize.py   (reads source/poses/pose-*.png, writes public/assets/poses/*.svg)"""
import glob, os, sys
import numpy as np
from PIL import Image, ImageDraw
from skimage.morphology import skeletonize, closing, disk

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = 1000  # working height in px; also the viewBox height

def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = np.array(pts[0], float), np.array(pts[-1], float); ab = b - a; n = np.hypot(*ab)
    P = np.array(pts, float)
    d = np.abs(ab[0] * (P[:, 1] - a[1]) - ab[1] * (P[:, 0] - a[0])) / n if n > 0 else np.hypot(P[:, 0] - a[0], P[:, 1] - a[1])
    i = int(d.argmax())
    if d[i] > eps: return rdp(pts[:i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]

def trace(mask):
    sk = skeletonize(mask)
    pts = set(zip(*np.nonzero(sk)))
    def nb(p): return [(p[0] + dy, p[1] + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1)
                       if (dy or dx) and (p[0] + dy, p[1] + dx) in pts]
    deg = {p: len(nb(p)) for p in pts}
    nodes = {p for p in pts if deg[p] != 2}
    seen, paths = set(), []
    for n in nodes:
        for q in nb(n):
            if (n, q) in seen: continue
            path = [n, q]; seen.add((n, q)); seen.add((q, n)); prev, cur = n, q
            while cur not in nodes:
                nx = [r for r in nb(cur) if r != prev]
                if not nx: break
                nxt = nx[0]; seen.add((cur, nxt)); seen.add((nxt, cur)); path.append(nxt); prev, cur = cur, nxt
            paths.append(path)
    left = pts - nodes - {p for path in paths for p in path}
    while left:                                   # closed loops with no junctions
        s = left.pop(); path = [s]; prev, cur = None, s
        while True:
            nx = [r for r in nb(cur) if r != prev and (r in left or r == s)]
            if not nx: break
            nxt = nx[0]
            if nxt == s: path.append(s); break
            left.discard(nxt); path.append(nxt); prev, cur = cur, nxt
        paths.append(path)
    return paths, int(sk.sum())

def to_d(p):
    f = lambda v: f"{v[1]:.1f} {v[0]:.1f}"          # (y,x) -> "x y"
    if len(p) < 3: return f"M{f(p[0])}L{f(p[-1])}"
    mid = lambda a, b: ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    d = f"M{f(p[0])}L{f(mid(p[0], p[1]))}"
    for i in range(1, len(p) - 1): d += f"Q{f(p[i])} {f(mid(p[i], p[i + 1]))}"
    return d + f"L{f(p[-1])}"

report = []
for src in sorted(glob.glob(f"{ROOT}/source/poses/pose-*.png")):
    name = os.path.basename(src)[5:-4]
    im = Image.open(src); im = im if im.mode == "L" else im.convert("RGBA").split()[3]   # 8-bit ink mask
    a = np.array(im)
    ys, xs = np.nonzero(a > 30); im = im.crop((xs.min() - 6, ys.min() - 6, xs.max() + 7, ys.max() + 7))
    W = round(im.width * H / im.height); a = np.array(im.resize((W, H), Image.LANCZOS))
    mask = closing(a > 96, disk(1))
    raw, sklen = trace(mask)
    sw = max(2.0, min(14.0, 0.86 * mask.sum() / max(sklen, 1)))   # mean line width, slightly lighter
    paths = []
    for p in raw:
        L = sum(np.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]) for i in range(len(p) - 1))
        if L < 3.5: continue
        paths.append((min(q[0] for q in p), L, rdp(p, 0.75)))
    paths.sort(key=lambda t: t[0])
    body = "".join(f'<path pathLength="1" d="{to_d(p)}"/>' for _, _, p in paths)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="pose pose-{name}" data-pose="{name}" '
           f'fill="none" stroke="currentColor" stroke-width="{sw:.2f}" stroke-linecap="round" stroke-linejoin="round" '
           f'aria-hidden="true">{body}</svg>')
    open(f"{ROOT}/public/assets/poses/{name}.svg", "w").write(svg)
    report.append((name, W, len(paths), round(sw, 2), len(svg) // 1024))
    if "--preview" in sys.argv:                    # raster check of the traced strokes
        pv = Image.new("RGB", (W, H), (53, 35, 23)); d = ImageDraw.Draw(pv)
        for _, _, p in paths: d.line([(q[1], q[0]) for q in p], fill=(243, 239, 230), width=round(sw))
        pv.save(f"{sys.argv[sys.argv.index('--preview') + 1]}/{name}.png")
for r in report: print("%-8s w=%-4d paths=%-4d stroke=%-5s %d KB" % r)
