#!/usr/bin/env python3
# One-shot: remove the light-gray background from the new flip-top
# drawer photos and pad them to the 750x750 RGBA convention used by
# every other product image in /public/hardware/.
#
# Run from repo root:
#   python3 scripts/process-drawer.py

from pathlib import Path
from PIL import Image
from collections import deque

REPO = Path(__file__).resolve().parent.parent
SOURCES = [
    (
        REPO.parent / "new-products" / "WhatsApp Image 2026-06-26 at 12.44.11.jpeg",
        REPO / "public" / "hardware" / "drawer-flip-top.png",
    ),
]

TARGET = 750  # square canvas
PAD_RATIO = 0.05  # 5% margin around the longer side
BG_TOLERANCE = 24  # how far from a corner sample we still call "background"


def flood_fill_alpha(img: Image.Image) -> Image.Image:
    """Make every pixel reachable from the corners within BG_TOLERANCE
    of the corner colour transparent. Keeps the central product opaque
    even when its own colour is close to the background by requiring
    contiguity with the frame.
    """
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()

    # Average the four corners to estimate the background colour.
    samples = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    bg = tuple(sum(c[i] for c in samples) // 4 for i in range(3))

    visited = [[False] * w for _ in range(h)]
    queue: deque[tuple[int, int]] = deque()
    for sx, sy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        queue.append((sx, sy))
        visited[sy][sx] = True

    while queue:
        x, y = queue.popleft()
        r, g, b, _ = px[x, y]
        if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) <= BG_TOLERANCE * 3:
            px[x, y] = (r, g, b, 0)
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                    visited[ny][nx] = True
                    queue.append((nx, ny))
    return img


def bbox_alpha(img: Image.Image) -> tuple[int, int, int, int]:
    """Bounding box of non-transparent pixels."""
    alpha = img.split()[3]
    bbox = alpha.getbbox()
    if bbox is None:
        return (0, 0, img.width, img.height)
    return bbox


def fit_to_square(img: Image.Image, size: int, pad_ratio: float) -> Image.Image:
    """Crop to the visible subject, then place into a transparent
    `size x size` canvas with `pad_ratio` margin."""
    bbox = bbox_alpha(img)
    cropped = img.crop(bbox)
    cw, ch = cropped.size

    inner = int(size * (1.0 - 2 * pad_ratio))
    scale = min(inner / cw, inner / ch)
    new_w = max(1, int(round(cw * scale)))
    new_h = max(1, int(round(ch * scale)))
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(resized, ((size - new_w) // 2, (size - new_h) // 2), resized)
    return canvas


def main() -> None:
    for src, dst in SOURCES:
        if not src.exists():
            print(f"  ✗ {src} missing")
            continue
        img = Image.open(src)
        masked = flood_fill_alpha(img)
        fitted = fit_to_square(masked, TARGET, PAD_RATIO)
        dst.parent.mkdir(parents=True, exist_ok=True)
        fitted.save(dst, "PNG", optimize=True)
        print(f"  ✓ {src.name}  →  {dst.relative_to(REPO)}")


if __name__ == "__main__":
    main()
