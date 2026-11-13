#!/usr/bin/env bash
# Rebuilds the web media from website/source/. Needs ffmpeg and python3 + Pillow.
#   bash website/tools/build-media.sh
# 1) Hero: 49 frames of the bar from dawn to night, from the three time-lapse clips
#    (16 frames from each clip + the last frame). Landscape 1440x1080 and a portrait crop
#    (left part of the room: window, REFILL letters, machine) at 600x1000.
# 2) Menu: product cut-outs trimmed, centred on a square and saved at 900px and 240px.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=source; OUT=public/assets
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT/day/l" "$OUT/day/p" "$OUT/menu"
n=0
for clip in "$SRC"/day/timelapse-1-*.mp4 "$SRC"/day/timelapse-2-*.mp4 "$SRC"/day/timelapse-3-*.mp4; do
  ffmpeg -v error -y -i "$clip" -vf "select='not(mod(n\,8))',setpts=N/TB" -vsync 0 -frames:v 16 "$TMP/c${n}_%02d.png"
  n=$((n + 1))
done
ffmpeg -v error -y -sseof -0.05 -i "$SRC"/day/timelapse-3-*.mp4 -frames:v 1 "$TMP/c3_00.png"
i=0
for f in $(ls "$TMP"/*.png | sort); do
  k=$(printf "%02d" $i)
  ffmpeg -v error -y -i "$f" -vf "scale=1440:1080" -c:v libwebp -quality 58 "$OUT/day/l/$k.webp"
  ffmpeg -v error -y -i "$f" -vf "crop=864:1440:0:0,scale=600:1000" -c:v libwebp -quality 60 "$OUT/day/p/$k.webp"
  i=$((i + 1))
done
echo "hero frames: $i"

python3 - "$SRC/menu" "$OUT/menu" <<'PY'
import sys, glob, os
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
for f in sorted(glob.glob(os.path.join(src, '*.webp'))):
    name = os.path.splitext(os.path.basename(f))[0]
    im = Image.open(f).convert('RGBA')
    im = im.crop(im.split()[3].point(lambda v: 255 if v > 8 else 0).getbbox())
    w, h = im.size; s = int(max(w, h) * 1.08)
    sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.paste(im, ((s - w) // 2, (s - h) // 2))
    for size, suffix, q in ((900, '', 84), (240, '-s', 80)):
        sq.resize((size, size), Image.LANCZOS).save(os.path.join(out, name + suffix + '.webp'), 'WEBP', quality=q, method=4)
    print('menu:', name)
PY
