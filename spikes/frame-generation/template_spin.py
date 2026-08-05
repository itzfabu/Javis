"""Hybrid-template spike for Thread 3, option (c): a fixed "geometry" +
fixed camera path, with ONLY per-client color/logo swapped via a params
dict, scripted end-to-end (params in, sprite sheet out) with zero manual
per-client tuning.

Scope note (why 2D/Pillow, not a live three.js capture): this environment's
Bash tool blocks `node`/PowerShell execution this session (npm install and
node script runs were both denied), so a headless three.js/Playwright
capture pass — like the one used for the existing flipbook-scale spike —
could not be run here. This script instead validates the piece that
was NOT already covered by this document: that a single template
(fixed silhouette + fixed rotation path) can be driven purely by a
per-client params dict (palette + logo text, the same shape as Thread 1's
frameGeneration token block) with a plain script, no hand-tuning, frame
count and timing measured directly. Three.js's ability to *render* a
template scene per category (building, product) was already validated
earlier in this document (see "Hero-object category palette" in Visual
Richness) — this spike is evidence for the parametrization/automation
question specifically, not a re-test of that rendering capability.

Not part of the generator - throwaway.
"""
import json
import math
import os
import time

from PIL import Image, ImageDraw, ImageFont

W, H = 500, 500
N_FRAMES = 48  # SPIN: a full 360 turn read cleanly at half ASSEMBLE's
               # frame count in visual spot checks below - fewer discrete
               # states to hit (one continuous rotation vs. 8 discrete
               # block-drop events), see aspect/frame-count reasoning
               # written back to the vault note.

CLIENTS = [
    {"name": "clientA-roastery", "primary": "#C4622D", "accent": "#E8A23D",
     "bg": "#FBF6EF", "logo": "MAPLE & RYE"},
    {"name": "clientB-tech", "primary": "#2B3A55", "accent": "#4FD1C5",
     "bg": "#F4F6F8", "logo": "NIMBUS"},
]

OUT_DIR = os.path.join(os.path.dirname(__file__), "out")


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def frame_image(t, primary, accent, bg, logo_text):
    """t in [0,1) = fraction of a full 360 turn. Fixed 'camera'/geometry:
    a cylinder-like body rendered as a width-varying ellipse (pseudo-3D
    rotation), a cap ellipse on top, and a label that fades in/out as it
    turns to/away from camera - the only inputs that vary are primary/
    accent/bg/logo_text, everything else (proportions, lighting angle,
    camera framing) is fixed template logic."""
    theta = t * 2 * math.pi
    img = Image.new("RGB", (W, H), hex_to_rgb(bg))
    draw = ImageDraw.Draw(img)

    body_h = 260
    body_top = 150
    max_w = 170
    # pseudo-3D: width follows |cos(theta)|, never fully degenerate
    w = max_w * (0.35 + 0.65 * abs(math.cos(theta)))
    cx = W / 2
    body_box = [cx - w / 2, body_top, cx + w / 2, body_top + body_h]
    draw.rounded_rectangle(body_box, radius=int(w * 0.18), fill=hex_to_rgb(primary))

    # simple specular hint (fixed lighting direction, template logic)
    highlight_x = cx - w / 2 + w * 0.22
    draw.line([(highlight_x, body_top + 15), (highlight_x, body_top + body_h - 15)],
              fill=tuple(min(255, c + 60) for c in hex_to_rgb(primary)), width=max(2, int(w * 0.06)))

    cap_w = w * 0.55
    cap_h = 34
    draw.rounded_rectangle(
        [cx - cap_w / 2, body_top - cap_h + 6, cx + cap_w / 2, body_top + 10],
        radius=8, fill=hex_to_rgb(accent),
    )

    # label only reads when roughly facing camera (|cos| high) - a cheap
    # stand-in for a logo wrapped around the cylinder's front face
    facing = max(0.0, math.cos(theta))
    if facing > 0.35:
        alpha = int(255 * min(1.0, (facing - 0.35) / 0.4))
        label_img = Image.new("RGBA", (int(w * 0.85), 60), (255, 255, 255, 0))
        ldraw = ImageDraw.Draw(label_img)
        try:
            font = ImageFont.truetype("arial.ttf", 20)
        except Exception:
            font = ImageFont.load_default()
        text_color = hex_to_rgb(primary) + (alpha,)
        bbox = ldraw.textbbox((0, 0), logo_text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        ldraw.rounded_rectangle([0, 0, label_img.width, 44], radius=6,
                                 fill=(255, 255, 255, min(230, alpha)))
        ldraw.text(((label_img.width - tw) / 2, (44 - th) / 2 - bbox[1]), logo_text,
                    font=font, fill=text_color)
        img.paste(label_img, (int(cx - label_img.width / 2), body_top + 100), label_img)

    # frame index label (independent ground-truth channel, same convention
    # as flipbook-scrub/generate_frames.py)
    draw.rectangle([10, 10, 60, 30], fill=(0, 0, 0, 180))
    draw.text((14, 13), f"{int(round(t * (N_FRAMES - 1))):03d}", fill=(255, 255, 255))

    return img


def main():
    manifest = []
    for client in CLIENTS:
        client_dir = os.path.join(OUT_DIR, client["name"])
        os.makedirs(client_dir, exist_ok=True)
        t0 = time.time()
        frames = []
        for i in range(N_FRAMES):
            t = i / N_FRAMES
            img = frame_image(t, client["primary"], client["accent"], client["bg"], client["logo"])
            img.save(os.path.join(client_dir, f"frame-{i:03d}.png"))
            frames.append(img)
        elapsed = time.time() - t0

        sheet = Image.new("RGB", (W * N_FRAMES, H), hex_to_rgb(client["bg"]))
        for i, img in enumerate(frames):
            sheet.paste(img, (i * W, 0))
        sheet_path = os.path.join(OUT_DIR, f"spritesheet-{client['name']}.png")
        sheet.save(sheet_path)
        size_kb = os.path.getsize(sheet_path) / 1024

        manifest.append({
            "client": client["name"],
            "frames": N_FRAMES,
            "elapsedSec": round(elapsed, 3),
            "msPerFrame": round(elapsed * 1000 / N_FRAMES, 1),
            "spriteSheet": os.path.basename(sheet_path),
            "spriteSheetKB": round(size_kb, 1),
            "sheetDims": f"{sheet.width}x{sheet.height}",
        })
        print(f"[{client['name']}] {N_FRAMES} frames in {elapsed:.3f}s "
              f"({elapsed*1000/N_FRAMES:.1f}ms/frame), sheet {size_kb:.1f}KB")

    with open(os.path.join(OUT_DIR, "template-spin-results.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print("done:", json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
