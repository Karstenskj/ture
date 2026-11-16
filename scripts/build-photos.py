"""Keep the NZ trip photos light. Needs macOS sips. Safe to re-run after adding photos.

1. Every JPEG over 300 KB is capped at 900 px wide and saved again at quality 78,
   but only when that makes it at least 10 % smaller. Name and format stay.
2. Every JPEG gets a 180 px wide copy in thumb/ (same name) for the small photo
   markers on the map (58 CSS px at 3x). Existing, newer thumbnails are kept.
"""
from pathlib import Path
import subprocess
import tempfile

DIR = Path(__file__).resolve().parents[1] / "trips/img/2026-11-nz-rundtur"
THUMBS = DIR / "thumb"


def sips(*args):
    out = subprocess.run(["sips", *map(str, args)], capture_output=True, text=True, check=True).stdout
    return out


def width(path):
    return int(sips("-g", "pixelWidth", path).split()[-1])


THUMBS.mkdir(exist_ok=True)
saved = made = 0
for photo in sorted(DIR.glob("*.jpg")):
    size = photo.stat().st_size
    if size > 300_000:
        with tempfile.TemporaryDirectory() as tmp:
            candidate = Path(tmp) / photo.name
            resize = ["--resampleWidth", 900] if width(photo) > 900 else []
            sips("-s", "format", "jpeg", "-s", "formatOptions", 78, *resize, photo, "--out", candidate)
            if candidate.stat().st_size < size * 0.9:
                photo.write_bytes(candidate.read_bytes())
                saved += size - photo.stat().st_size
                print(f"{photo.name}: {size} -> {photo.stat().st_size} B")
    thumb = THUMBS / photo.name
    if not thumb.exists() or thumb.stat().st_mtime < photo.stat().st_mtime:
        sips("-s", "format", "jpeg", "-s", "formatOptions", 70, "--resampleWidth", 180, photo, "--out", thumb)
        made += 1
print(f"Saved {saved} B on large photos, wrote {made} thumbnails in {THUMBS.name}/.")
