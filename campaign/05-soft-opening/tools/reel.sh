#!/usr/bin/env bash
# REFILL · the animated countdown (1080 × 1350, about 9 s). Run build.js overlay first.
#   bash campaign/05-soft-opening/tools/reel.sh
set -euo pipefail
D="$(cd "$(dirname "$0")/.." && pwd)"; W="$D/out/work"
ffmpeg -v error -y -i "$D/src/five-cups.mp4" -loop 1 -t 9.2 -i "$W/layer-a.png" -loop 1 -t 9.2 -i "$W/layer-b.png" -loop 1 -t 9.2 -i "$W/layer-c.png" -loop 1 -t 9.2 -i "$W/layer-d.png" \
  -f lavfi -t 9.2 -i anullsrc=r=44100:cl=stereo -filter_complex "
  [0:v]fps=30,scale=1080:1440:flags=lanczos,crop=1080:1350:0:45,tpad=stop_mode=clone:stop_duration=2.7[v];
  [1:v]format=rgba,fade=t=in:st=0.2:d=0.6:alpha=1[a];
  [2:v]format=rgba,fade=t=in:st=5.9:d=0.5:alpha=1[b];
  [3:v]format=rgba,fade=t=in:st=6.3:d=0.5:alpha=1[c];
  [4:v]format=rgba,fade=t=in:st=6.7:d=0.5:alpha=1[d];
  [v][a]overlay[v1];[v1][b]overlay[v2];[v2][c]overlay[v3];[v3][d]overlay,format=yuv420p[o]" \
  -map "[o]" -map 5:a -t 9.2 -c:v libx264 -preset slow -crf 17 -profile:v high -c:a aac -b:a 96k -movflags +faststart "$D/out/01-countdown-5-days.mp4"
echo "reel: $D/out/01-countdown-5-days.mp4"
