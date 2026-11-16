"""Thin the inline route lines in rk-data so the map draws and zooms lighter.

Runs Ramer-Douglas-Peucker in local metres on every road leg, extra trip and
"after" line, keeps each line's first and last point exactly (so legs still
meet the camps), and rounds the other points to 5 decimals (about 1 m).
The vertex a leg's time label sits on (mid) is always kept, so labels stay put.

Idempotent: a second run keeps the same points. Run build-location-plan.py
afterwards, because the position plan is computed from these points.
Usage: python3 scripts/simplify-route.py [tolerance in metres, default 5]
"""
from math import cos, hypot, radians
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "trips/2026-11-nz-rundtur.html"
EPS = float(sys.argv[1]) if len(sys.argv) > 1 else 5.0


def project(pts):
    k = cos(radians(pts[0][0]))  # the first point is kept exactly, so every run uses the same frame
    return [(p[1] * 111320 * k, p[0] * 110540) for p in pts]


def seg_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = dx * dx + dy * dy
    t = 0 if not length else max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length))
    return hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)


def rdp(xy, eps):
    keep = [False] * len(xy)
    keep[0] = keep[-1] = True
    stack = [(0, len(xy) - 1)]
    while stack:
        first, last = stack.pop()
        best, index = 0, None
        for i in range(first + 1, last):
            d = seg_dist(xy[i], xy[first], xy[last])
            if d > best:
                best, index = d, i
        if index is not None and best > eps:
            keep[index] = True
            stack += [(first, index), (index, last)]
    return [i for i, k in enumerate(keep) if k]


def simplify(pts, mid=None):
    if len(pts) < 3:
        return pts, 0.0
    fixed = sorted({0, len(pts) - 1} | ({pts.index(mid)} if mid in pts else set()))
    # Round first and simplify the rounded line, so a second run sees the same numbers.
    rounded = [p if i in fixed else [round(p[0], 5), round(p[1], 5)] for i, p in enumerate(pts)]
    xy = project(pts)
    rxy = project(rounded)
    kept = []
    for a, b in zip(fixed, fixed[1:]):
        kept += [a + i for i in rdp(rxy[a:b + 1], EPS)][:-1]
    kept.append(len(pts) - 1)
    out = [rounded[i] for i in kept]
    nxy = project(out)
    worst = 0.0
    for j in range(len(kept) - 1):
        for i in range(kept[j], kept[j + 1] + 1):
            worst = max(worst, seg_dist(xy[i], nxy[j], nxy[j + 1]))
    return out, worst


source = PAGE.read_text()
match = re.search(r'(<script\b[^>]*\bid="rk-data"[^>]*>)(.*?)(</script>)', source, re.S)
data = json.loads(match[2])
before_total = after_total = 0
for group in ("legs", "extras", "after"):
    b = a = 0
    for n, item in enumerate(data.get(group, [])):
        old = item["pts"]
        item["pts"], worst = simplify(old, item.get("mid"))
        b += len(old)
        a += len(item["pts"])
        if len(old) != len(item["pts"]):
            print(f"{group}[{n}]: {len(old)} -> {len(item['pts'])} points, max deviation {worst:.2f} m")
    print(f"{group}: {b} -> {a} points")
    before_total += b
    after_total += a
source = source[:match.start(2)] + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + source[match.end(2):]
PAGE.write_text(source)
print(f"Total {before_total} -> {after_total} points at {EPS:g} m. Now run scripts/build-location-plan.py.")
