"""Generates a placeholder 'tower assembling' frame sequence for the flipbook
scrub spike. Not part of the generator - throwaway. Also builds a sprite sheet
for the CSS-only implementation (A) and leaves individual PNGs for the
canvas+GSAP implementation (B).
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 400, 600
N_BLOCKS = 8
FRAMES_PER_BLOCK = 12
N_FRAMES = N_BLOCKS * FRAMES_PER_BLOCK  # 96

BLOCK_W = 240
BLOCK_H = 60
BLOCK_X = (W - BLOCK_W) // 2
GROUND_Y = 560

COLORS = [
    (91, 141, 239), (91, 200, 239), (91, 239, 199), (139, 239, 91),
    (239, 219, 91), (239, 160, 91), (239, 105, 91), (219, 91, 239),
]

OUT_DIR = os.path.join(os.path.dirname(__file__), "frames")
os.makedirs(OUT_DIR, exist_ok=True)

def ease_out_back(t):
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2)

def rest_y(block_index):
    return GROUND_Y - (block_index + 1) * BLOCK_H

def frame_image(frame_idx):
    img = Image.new("RGBA", (W, H), (12, 16, 22, 255))
    draw = ImageDraw.Draw(img)

    # ground line
    draw.line([(20, GROUND_Y), (W - 20, GROUND_Y)], fill=(60, 70, 80, 255), width=2)

    stage = min(frame_idx // FRAMES_PER_BLOCK, N_BLOCKS - 1)
    local = frame_idx % FRAMES_PER_BLOCK

    for b in range(N_BLOCKS):
        if b < stage or (b == stage and frame_idx >= N_FRAMES - 1):
            y = rest_y(b)
        elif b == stage:
            t = local / (FRAMES_PER_BLOCK - 1)
            eased = ease_out_back(t)
            start_y = -BLOCK_H - 20
            end_y = rest_y(b)
            y = start_y + (end_y - start_y) * eased
        else:
            continue  # not yet appeared
        color = COLORS[b % len(COLORS)]
        draw.rectangle(
            [BLOCK_X, y, BLOCK_X + BLOCK_W, y + BLOCK_H],
            fill=color, outline=(12, 16, 22, 255), width=3
        )

    # baked-in frame index label (independent visual ground truth channel)
    label = f"{frame_idx:03d}"
    draw.rectangle([10, 10, 70, 34], fill=(0, 0, 0, 180))
    draw.text((16, 14), label, fill=(255, 255, 255, 255))

    return img

def main():
    frames = []
    for i in range(N_FRAMES):
        img = frame_image(i)
        img.save(os.path.join(OUT_DIR, f"frame-{i:03d}.png"))
        frames.append(img)
    print(f"wrote {N_FRAMES} frames to {OUT_DIR}")

    # Sprite sheet for the CSS-only implementation: single row, all frames
    # side by side, so background-position stepping can address each one.
    sheet = Image.new("RGBA", (W * N_FRAMES, H), (0, 0, 0, 0))
    for i, img in enumerate(frames):
        sheet.paste(img, (i * W, 0))
    sheet_path = os.path.join(os.path.dirname(__file__), "spritesheet.png")
    sheet.save(sheet_path)
    print(f"wrote sprite sheet {sheet_path} ({sheet.width}x{sheet.height}, {os.path.getsize(sheet_path)/1024:.1f} KB)")

if __name__ == "__main__":
    main()
