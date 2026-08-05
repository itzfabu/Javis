#!/usr/bin/env python
"""
One-off measurement helper for the sprite-sheet cost study (not part of the
shipping pipeline - tools/frame-generation's runtime has no image-processing
dependency, on purpose, per src/composite.js's own header comment).

Two things measured per archetype:
1. Attempts to re-encode the actual composited horizontal sprite.png as WebP.
   This fails for every archetype here - WebP has a hard 16383px per-dimension
   limit (libwebp), and every sprite sheet's width (28800-86400px) exceeds it
   by 1.8x-5.3x. That is itself a real, reportable finding, not a script bug -
   caught and reported per archetype with the exact numbers, not swallowed.
2. As the closest still-meaningful "same visual content, WebP format"
   comparison, re-encodes each INDIVIDUAL captured frame (from frames/) as
   WebP and sums the totals against the summed individual PNG frame sizes.
   This is not the same deliverable as one sprite-sheet file (still N HTTP
   requests instead of 1 - a real, separate cost this comparison does not
   erase), but it is the only way to get a same-content byte comparison at
   all given WebP's dimension ceiling.
"""
import sys
import os
import glob
from PIL import Image

ARCHETYPES = ["assemble", "reveal", "spin", "transform", "flythrough", "interface"]
WEBP_MAX_DIM = 16383

def try_sheet_webp(sheet_path):
    im = Image.open(sheet_path)
    w, h = im.size
    if w > WEBP_MAX_DIM or h > WEBP_MAX_DIM:
        return {"possible": False, "width": w, "height": h, "limit": WEBP_MAX_DIM,
                "overBy": round(w / WEBP_MAX_DIM, 2) if w > WEBP_MAX_DIM else round(h / WEBP_MAX_DIM, 2)}
    buf_path = sheet_path.replace(".png", ".webp")
    im.convert("RGB").save(buf_path, "WEBP", quality=80, method=6)
    return {"possible": True, "bytes": os.path.getsize(buf_path)}

def per_frame_webp_total(frames_dir):
    png_total = 0
    webp_total = 0
    frame_files = sorted(glob.glob(os.path.join(frames_dir, "frame-*.png")))
    for fp in frame_files:
        png_total += os.path.getsize(fp)
        im = Image.open(fp).convert("RGB")
        webp_path = fp.replace(".png", ".webp")
        im.save(webp_path, "WEBP", quality=80, method=6)
        webp_total += os.path.getsize(webp_path)
        os.remove(webp_path)  # measurement only, don't leave hundreds of extra files around
    return png_total, webp_total, len(frame_files)

def main():
    base = os.path.join(os.path.dirname(__file__), "cost-study")
    results = []
    for arch in ARCHETYPES:
        arch_dir = os.path.join(base, arch)
        png_path = os.path.join(arch_dir, "sprite.png")
        frames_dir = os.path.join(arch_dir, "frames")
        if not os.path.exists(png_path):
            print(f"SKIP {arch}: {png_path} not found", file=sys.stderr)
            continue

        sheet_png_bytes = os.path.getsize(png_path)
        sheet_webp = try_sheet_webp(png_path)

        frames_png_total, frames_webp_total, n_frames = per_frame_webp_total(frames_dir)

        row = {
            "archetype": arch,
            "sheet_png_bytes": sheet_png_bytes,
            "sheet_webp": sheet_webp,
            "n_frames": n_frames,
            "frames_png_total_bytes": frames_png_total,
            "frames_webp_total_bytes": frames_webp_total,
            "frames_webp_pct_of_png": round(100 * frames_webp_total / frames_png_total, 1),
        }
        results.append(row)

        if sheet_webp["possible"]:
            sheet_line = f"sheet-webp={sheet_webp['bytes']/1024:.1f}KB"
        else:
            sheet_line = f"sheet-webp=IMPOSSIBLE (width {sheet_webp['width']}px > {WEBP_MAX_DIM}px limit, {sheet_webp['overBy']}x over)"
        print(f"{arch:12s} sheet-png={sheet_png_bytes/1024:9.1f}KB  {sheet_line}")
        print(f"{'':12s} per-frame-png-total={frames_png_total/1024:9.1f}KB  per-frame-webp-total={frames_webp_total/1024:9.1f}KB ({row['frames_webp_pct_of_png']}% of png, {n_frames} files each side)")

    import json
    with open(os.path.join(base, "size-comparison.json"), "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    main()
