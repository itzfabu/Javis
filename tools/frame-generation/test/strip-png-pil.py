#!/usr/bin/env python
"""
Strip-PNG (1xN) measurement for ASSEMBLE and FLYTHROUGH specifically, both
no-logo and approved-logo states. Not part of the shipping pipeline - a
one-off measurement helper, same status as to-webp.py.

Why PIL and not the browser canvas pipeline used for every other cell in
this experiment (measure-format-layout.js): measured directly that this
Playwright/Chromium build silently fails to rasterize a canvas wider than
somewhere between 65535px and 76800px (canvas.toDataURL returns the empty
"data:," sentinel, no exception). ASSEMBLE's strip width (96*800=76800) and
FLYTHROUGH's (72*1200=86400) both exceed that; the other four archetypes'
strip widths (28800-57600) do not, and were measured via the real
screenshot-based canvas pipeline instead (see measure-format-layout.js).

This means the ASSEMBLE/FLYTHROUGH strip-PNG numbers below use a DIFFERENT
PNG encoder (Pillow's, not Chromium/Skia's) than every other cell in this
experiment. To make that gap honest rather than silently assumed
negligible, this script also re-encodes TRANSFORM's strip (which the
browser pipeline already measured directly) via Pillow, so the two methods'
byte counts can be directly compared on shared content - the resulting
ratio is the calibration factor to apply, as a disclosed error bar, to the
ASSEMBLE/FLYTHROUGH numbers.
"""
import os
import sys
import glob
import json
from PIL import Image

BASE = os.path.join(os.path.dirname(__file__), "cost-study")

def build_strip(frames_dir, out_path):
    frame_files = sorted(glob.glob(os.path.join(frames_dir, "frame-*.png")))
    if not frame_files:
        raise RuntimeError(f"no frames found in {frames_dir}")
    images = [Image.open(f) for f in frame_files]
    w, h = images[0].size
    sheet = Image.new(images[0].mode, (w * len(images), h))
    for i, im in enumerate(images):
        sheet.paste(im, (i * w, 0))
    # Match Chromium's canvas PNG encoder defaults as closely as Pillow allows:
    # compress_level 6 (zlib default, what Skia's screenshot encoder uses),
    # not Pillow's own default of 6 either - explicit for clarity, not a guess.
    sheet.save(out_path, "PNG", compress_level=6)
    return os.path.getsize(out_path), w * len(images), h

def main():
    targets = [
        ("assemble", "no-logo"), ("assemble-approved", "approved-logo"),
        ("flythrough", "no-logo"), ("flythrough-approved", "approved-logo"),
        # calibration: TRANSFORM's strip was already measured via the real
        # browser screenshot pipeline (123.5KB no-logo, 173.9KB approved) -
        # re-measure the identical frames via Pillow to get the encoder gap.
        ("transform", "no-logo_CALIBRATION"), ("transform-approved", "approved-logo_CALIBRATION"),
    ]
    results = []
    for dir_name, label in targets:
        frames_dir = os.path.join(BASE, dir_name, "frames")
        out_path = os.path.join(BASE, dir_name, "_strip_pil_tmp.png")
        bytes_, w, h = build_strip(frames_dir, out_path)
        os.remove(out_path)
        row = {"dir": dir_name, "label": label, "bytes": bytes_, "width": w, "height": h}
        results.append(row)
        print(f"{dir_name:22s} {label:28s} {bytes_/1024:9.1f} KB  ({w}x{h})")

    with open(os.path.join(BASE, "strip-png-pil-results.json"), "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    main()
