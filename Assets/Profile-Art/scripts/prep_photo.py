"""Local only. Cut out the subject, boost local contrast, write grayscale source-prepped.png.
usage: python scripts/prep_photo.py [photo]   (defaults to your GitHub avatar)"""
import io
import os
import sys

import cv2
import numpy as np
import requests
from PIL import Image
from rembg import new_session, remove

from common import ROOT
from config import USERNAME


def main():
    if len(sys.argv) > 1:
        img = Image.open(sys.argv[1])
    else:
        raw = requests.get(f"https://github.com/{USERNAME}.png?size=460", timeout=30).content
        img = Image.open(io.BytesIO(raw))
    # u2netp is tiny (5 MB); set REMBG_MODEL=u2net_human_seg for cleaner edges
    session = new_session(os.environ.get("REMBG_MODEL", "u2netp"))
    cut = remove(img.convert("RGB"), session=session)  # RGBA, transparent background

    rgba = np.array(cut).astype(np.float32) / 255
    alpha = rgba[..., 3:4]
    gray = cv2.cvtColor((rgba[..., :3] * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    gray = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8)).apply(gray)
    # subject over pure black: the portrait is drawn as light glyphs on a dark card
    out = (gray.astype(np.float32) * alpha[..., 0]).astype(np.uint8)

    # ys, xs = np.where(alpha[..., 0] > 0.2)
    # pad = 12
    # y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, out.shape[0])
    # x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, out.shape[1])
    # out = out[y0:y1, x0:x1]

    ys, xs = np.where(alpha[..., 0] > 0.2)
    pad = 35
    
    y0 = max(ys.min() - pad, 0)
    y1 = min(ys.max() + pad, out.shape[0])
    x0 = max(xs.min() - pad, 0)
    x1 = min(xs.max() + pad, out.shape[1])
    
    out = out[y0:y1, x0:x1]
    
    Image.fromarray(out).save(os.path.join(ROOT, "source-prepped.png"))
    print("wrote source-prepped.png", out.shape)


if __name__ == "__main__":
    main()
