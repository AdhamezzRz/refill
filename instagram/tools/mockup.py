"""Profile-in-context mockups (light + dark) for review. Writes HTML + tools/_mockups.json for render.js."""
import base64, io, json, os, sys
from PIL import Image

ROOT = sys.argv[1]; CAMPAIGN = sys.argv[2]; FONTS = sys.argv[3]
SET = sys.argv[4] if len(sys.argv) > 4 else "plaster"
PROFILE = sys.argv[5] if len(sys.argv) > 5 else "espresso"

def uri(path, size=None, fmt="JPEG"):
    im = Image.open(path).convert("RGB")
    if size: im.thumbnail(size, Image.LANCZOS)
    b = io.BytesIO(); im.save(b, fmt, quality=88); return f"data:image/{fmt.lower()};base64," + base64.b64encode(b.getvalue()).decode()

def font(path): return "data:font/ttf;base64," + base64.b64encode(open(path, "rb").read()).decode()

J = json.load(open(f"{ROOT}/tools/_jobs.json"))
hl = "".join(
    f'<div class="hl"><div class="ring"><img src="{uri(f"{ROOT}/png/highlights-{SET}/{slug}.png", (360, 640))}"></div><span>{label}</span></div>'
    for slug, label in J["glyphs"])
posts = [f"{CAMPAIGN}/03-refilled-92/refilled-92-feed-1080x1350.jpg",
         f"{CAMPAIGN}/02-same-room-soon-reel/same-room-endcard-1080x1920.jpg",
         f"{CAMPAIGN}/01-coming-soon-carousel/carousel-01.jpg",
         f"{CAMPAIGN}/01-coming-soon-carousel/carousel-03.jpg",
         f"{CAMPAIGN}/01-coming-soon-carousel/carousel-02.jpg",
         f"{CAMPAIGN}/01-coming-soon-carousel/carousel-05.jpg"]
grid = "".join(f'<div class="post"><img src="{uri(p, (500, 900))}"></div>' for p in posts)
avatar = uri(f"{ROOT}/png/profile/profile-{PROFILE}-1080.png", (400, 400), "PNG")

def page(theme):
    bg, fg, mut, line, btn = (("#FFFFFF", "#0C0C0C", "#737373", "#DBDBDB", "#EFEFEF") if theme == "light"
                              else ("#000000", "#F5F5F5", "#A8A8A8", "#262626", "#262626"))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:I;src:url({font(f"{FONTS}/Inter-500.ttf")})}}
@font-face{{font-family:M;src:url({font(f"{FONTS}/Montserrat-600.ttf")})}}
*{{box-sizing:border-box}}html,body{{margin:0;background:{bg};color:{fg};font-family:I,sans-serif}}
.ph{{width:430px;padding:14px 16px 0;zoom:3}}
.top{{display:flex;justify-content:space-between;align-items:center;font-weight:600;font-size:20px;margin-bottom:14px}}
.head{{display:flex;align-items:center;gap:22px}}
.av{{width:86px;height:86px;border-radius:50%;overflow:hidden;flex:none}}.av img{{width:100%;height:100%}}
.stats{{display:flex;gap:22px;font-size:13px}}.stats b{{display:block;font-size:16px}}
.name{{margin-top:12px;font-size:13.5px;line-height:1.35}}.name b{{font-family:M;letter-spacing:.3em;font-size:12.5px}}
.name .m{{color:{mut}}}
.btns{{display:flex;gap:6px;margin-top:12px}}.btns div{{flex:1;background:{btn};border-radius:8px;text-align:center;padding:7px 0;font-size:13px}}
.btns .f{{background:#0095F6;color:#fff}}
.hls{{display:flex;gap:14px;margin:16px -16px 0 0;overflow:hidden}}
.hl{{display:flex;flex-direction:column;align-items:center;gap:5px;flex:none;width:66px}}
.ring{{width:66px;height:66px;border-radius:50%;border:1px solid {line};padding:3px}}
.ring img{{width:100%;height:100%;border-radius:50%;object-fit:cover}}
.hl span{{font-size:11.5px;white-space:nowrap}}
.tabs{{display:flex;justify-content:space-around;border-top:1px solid {line};margin:14px -16px 0;padding:10px 0;font-size:12px;color:{mut}}}
.tabs .on{{color:{fg};border-bottom:1px solid {fg};padding-bottom:9px;margin-bottom:-11px}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin:0 -16px}}
.post{{aspect-ratio:3/4;overflow:hidden}}.post img{{width:100%;height:100%;object-fit:cover}}
</style></head><body><div class="ph">
<div class="top"><span>refill.coffee</span><span style="font-size:22px">&#9776;</span></div>
<div class="head"><div class="av"><img src="{avatar}"></div>
<div class="stats"><div><b>6</b>posts</div><div><b>&ndash;</b>followers</div><div><b>&ndash;</b>following</div></div></div>
<div class="name"><b>REFILL</b><br><span class="m">Specialty Coffee</span><br>Good coffee. Better days.<br>El Shorouk, Cairo &middot; Opening soon</div>
<div class="btns"><div class="f">Follow</div><div>Message</div></div>
<div class="hls">{hl}</div>
<div class="tabs"><span class="on">&#9638; Posts</span><span>Reels</span><span>Tagged</span></div>
<div class="grid">{grid}</div></div></body></html>"""

jobs = []
for theme in ("light", "dark"):
    h = f"{ROOT}/tools/_mock-{theme}.html"; open(h, "w").write(page(theme))
    jobs.append(dict(html=h, out=f"{ROOT}/png/mockup/profile-mockup-{theme}.png", w=1290, h=2400))
json.dump(jobs, open(f"{ROOT}/tools/_mockups.json", "w"))
print("mockups", len(jobs))
