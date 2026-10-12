import json
import os
from html import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
SVG_DIR = os.path.join(ROOT, "svg")

os.makedirs(SVG_DIR, exist_ok=True)



FONT = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
BG = "#0d1117"
PANEL = "#161b22"
BORDER = "#30363d"
FG = "#c9d1d9"
MUTED = "#8b949e"
GREEN = "#39d353"
CYAN = "#58d5e8"
PURPLE = "#bc8cff"
ORANGE = "#ffa657"
PINK = "#ff7b9c"
PALETTE = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353", "#69f0a0"]


def esc(s):
    return escape(str(s), quote=True)


def load(name, default=None):
    path = os.path.join(DATA, name)
    if not os.path.exists(path):
        return default
    with open(path) as f:
        return json.load(f)


def save(name, obj):
    os.makedirs(DATA, exist_ok=True)
    with open(os.path.join(DATA, name), "w") as f:
        json.dump(obj, f, indent=2)


def write_svg(name, svg):
    with open(os.path.join(SVG_DIR, name), "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"wrote {os.path.join(SVG_DIR, name)} ({len(svg) // 1024} KB)")



def window(width, height, title, body, extra_defs=""):
    """Terminal-window chrome shared by every card."""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" font-family="{FONT}">
<defs>{extra_defs}</defs>
<rect x="0.5" y="0.5" width="{width - 1}" height="{height - 1}" rx="10" fill="{BG}" stroke="{BORDER}"/>
<path d="M0.5 32 V10.5 a10 10 0 0 1 10 -10 H{width - 10.5} a10 10 0 0 1 10 10 V32 Z" fill="{PANEL}"/>
<line x1="0.5" y1="32" x2="{width - 0.5}" y2="32" stroke="{BORDER}"/>
<circle cx="18" cy="16" r="5.5" fill="#ff5f56"/><circle cx="36" cy="16" r="5.5" fill="#ffbd2e"/><circle cx="54" cy="16" r="5.5" fill="#27c93f"/>
<text x="{width / 2}" y="20.5" fill="{MUTED}" font-size="12" text-anchor="middle">{esc(title)}</text>
{body}
</svg>
"""
