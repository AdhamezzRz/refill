"""Print-ready PDFs for every table: python3 tools/batch.py 1 12   (tables 01..12)
Each table gets its own order/rate URLs (from config.json) and its own TABLE number on the sign.
Every QR is decoded and checked before the files are copied to build/tables/table-XX/."""
import json, os, shutil, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY = [sys.executable, "-I"]

def run(cfg=None):
    args = [f"{ROOT}/tools/build.py"] + ([cfg] if cfg else [])
    subprocess.run(PY + args, check=True, stdout=subprocess.DEVNULL)
    subprocess.run(["node", f"{ROOT}/tools/render.js"], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(PY + [f"{ROOT}/tools/verify.py"], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(PY + [f"{ROOT}/tools/boxes.py"], check=True, stdout=subprocess.DEVNULL)

a, b = int(sys.argv[1]), int(sys.argv[2])
base = json.load(open(f"{ROOT}/config.json"))
tmp = f"{ROOT}/build/_cfg.json"
for t in range(a, b + 1):
    tt = f"{t:02d}"
    json.dump(dict(base, table=tt), open(tmp, "w"))
    run(tmp)
    out = f"{ROOT}/build/tables/table-{tt}"; os.makedirs(out, exist_ok=True)
    for f in os.listdir(f"{ROOT}/build/print-pdf"):
        shutil.copy(f"{ROOT}/build/print-pdf/{f}", out)
    print(f"table {tt}: verified")
os.remove(tmp)
run()  # restore the default build from config.json
