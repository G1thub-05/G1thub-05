"""Local only. source-prepped.png -> ascii-portrait.svg: rows wipe in with a block cursor, then a slow shimmer."""
import os

import numpy as np
from PIL import Image

from common import CYAN, GREEN, PURPLE, ROOT, esc, window, write_svg

W, H = 370, 420
RAMP = " .`:-=+*cs#%@"  # dark (sparse) -> bright (dense)
COLS = 92
FONT = 6.2
CW = FONT * 0.6
LH = 7.0
CROP = (0.08, 0.0, 0.92, 0.86)  # left, top, right, bottom as fractions: frame head + shoulders


def main():
    img = Image.open(os.path.join(ROOT, "source-prepped.png")).convert("L")
    w, h = img.size
    img = img.crop((int(CROP[0] * w), int(CROP[1] * h), int(CROP[2] * w), int(CROP[3] * h)))
    rows = int(COLS * CW / LH * img.height / img.width)
    max_rows = int((H - 52) / LH)
    if rows > max_rows:  # crop from the bottom (torso) rather than squashing the face
        keep = int(img.height * max_rows / rows)
        img, rows = img.crop((0, 0, img.width, keep)), max_rows
    a = np.asarray(img.resize((COLS, rows), Image.LANCZOS), dtype=np.float32) / 255
    lo, hi = np.percentile(a[a > 0.04], [5, 99]) if (a > 0.04).any() else (0, 1)
    a = np.where(a > 0.04, np.clip((a - lo) / (hi - lo), 0, 1) ** 0.8, 0)

    grid_w = COLS * CW
    x0 = (W - grid_w) / 2
    y0 = 32 + (H - 32 - rows * LH) / 2 + LH * 0.8
    out = []
    for r in range(rows):
        line = "".join(RAMP[int(v * (len(RAMP) - 1))] for v in a[r])
        if not line.strip():
            continue
        y = y0 + r * LH
        begin, dur = 0.3 + r * 0.045, 0.55
        out.append(
            f'<clipPath id="c{r}"><rect x="{x0:.1f}" y="{y - LH:.1f}" width="0" height="{LH + 1}">'
            f'<animate attributeName="width" from="0" to="{grid_w:.1f}" begin="{begin:.2f}s" dur="{dur}s" fill="freeze"/></rect></clipPath>'
            f'<text x="{x0:.1f}" y="{y:.1f}" textLength="{grid_w:.1f}" lengthAdjust="spacing" clip-path="url(#c{r})">{esc(line).replace(" ", "\u00a0")}</text>'
            f'<rect x="{x0:.1f}" y="{y - LH + 1:.1f}" width="{CW:.1f}" height="{LH - 1}" fill="{GREEN}" opacity="0">'
            f'<set attributeName="opacity" to="1" begin="{begin:.2f}s"/>'
            f'<animate attributeName="x" from="{x0:.1f}" to="{x0 + grid_w:.1f}" begin="{begin:.2f}s" dur="{dur}s" fill="freeze"/>'
            f'<set attributeName="opacity" to="0" begin="{begin + dur:.2f}s"/></rect>'
        )

    shimmer = 0.3 + rows * 0.045 + 0.6
    defs = f"""
<linearGradient id="ink" x1="0" y1="0" x2="{W}" y2="{H}" gradientUnits="userSpaceOnUse" spreadMethod="reflect">
  <stop offset="0" stop-color="{GREEN}"/><stop offset="0.5" stop-color="{CYAN}"/><stop offset="1" stop-color="{PURPLE}"/>
  <animateTransform attributeName="gradientTransform" type="translate" values="0 0;{W} {H};0 0" begin="{shimmer:.2f}s" dur="10s" repeatCount="indefinite"/>
</linearGradient>"""
    body = f"""
<g fill="url(#ink)" font-size="{FONT}">{''.join(out)}</g>"""
    write_svg("ascii-portrait.svg", window(W, H, "portrait.txt", body, defs))


if __name__ == "__main__":
    main()
