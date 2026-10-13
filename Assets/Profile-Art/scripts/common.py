
import json
import os
from html import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
SVG_DIR = os.path.join(ROOT, "svg")

os.makedirs(DATA, exist_ok=True)
os.makedirs(SVG_DIR, exist_ok=True)

FONT = (
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, "
    "Consolas, 'Liberation Mono', monospace"
)

# Default colors used by existing Python scripts (dark theme).
BG = "#0d1117"         # Main background dark SVG
PANEL = "#161b22"      # Background of top terminal header
BORDER = "#30363d"     # Outer border and header separator
FG = "#c9d1d9"         # Command text and contribution description
GREEN = "#39d353"      # Command of $ sign and green highlights (44 / 366)
MUTED = "#8b949e"      # skyline.sh in header and muted labels (current streak, longest streak, busiest weekday, active days)
CYAN = "#58d5e8"       # 6 days (current streak)
PURPLE = "#bc8cff"     # 6 days (longest streak)
ORANGE = "#ffa657"     # sunday (busiest weekday, peak 139 - may 17)
PINK = "#ff7b9c"

PALETTE = [
    "#161b22",  # Level 0: No contributions
    "#0e4429",  # Level 1: Very low
    "#006d32",  # Level 2: Low
    "#26a641",  # Level 3: Medium
    "#39d353",  # Level 4: High
    "#69f0a0",  # Level 5: Highest
]

# CSS variables for all theme-aware SVG colors.
WINDOW_THEME_CSS = """
:root {
    color-scheme: dark;

    --window-bg: #0d1117;
    --window-fg: #c9d1d9;
    --window-panel: #161b22;
    --window-border: #30363d;
    --window-muted: #8b949e;

    --color-green: #39d353;
    --color-cyan: #58d5e8;
    --color-purple: #bc8cff;
    --color-orange: #ffa657;
    --color-pink: #ff7b9c;
    --color-sweep: #fff;

    --globe-land-dot: #39d353;
    --globe-atmosphere: #58d5e8;
    --globe-home-pin: #ffa657;
    --globe-packet-pink: #ff7b9c;


    --ocean-center: #16324a;
    --ocean-mid: #0c1724;
    --ocean-edge: #070b12;
    --shade-color: #05080d;
    --shade-opacity: 0.75;
    --globe-grid: #2d3a4a;

    --tech-languages: #F2C14E;
    --tech-frontend: #58D5E8;
    --tech-backend: #39D353;
    --tech-databases: #FFA657;
    --tech-messaging: #BC8CFF;
    --tech-cloud-devops: #79C0FF;
    --tech-monitoring: #FF7B72;
    --tech-testing-quality: #FF7B9C;
    --tech-wireframe: #2D3A4A;
    --tech-core: #BC8CFF;
    --tech-glow: #58D5E8;
    --tech-wireframe-width: 0.9;
    --tech-wireframe-opacity: 0.9;

    --top-0: #161b22; /* Level 0: No contributions */
    --top-1: #0e4429; /* Level 1: Very low */
    --top-2: #006d32; /* Level 2: Low */
    --top-3: #26a641; /* Level 3: Medium */
    --top-4: #39d353; /* Level 4: High */
    --top-5: #69f0a0; /* Level 5: Highest */

    --left-0: #171d25; /* Level 0: No contributions */
    --left-1: #0a3820; /* Level 1: Very low */
    --left-2: #005528; /* Level 2: Low */
    --left-3: #1d8136; /* Level 3: Medium */
    --left-4: #2d9f46; /* Level 4: High */
    --left-5: #4bbd70; /* Level 5: Highest */

    --right-0: #12171e; /* Level 0: No contributions */
    --right-1: #082d1b; /* Level 1: Very low */
    --right-2: #06451f; /* Level 2: Low */
    --right-3: #155c29; /* Level 3: Medium */
    --right-4: #227538; /* Level 4: High */
    --right-5: #3d995b; /* Level 5: Highest */
}


/* Glass effect styles — yahan add karo */
.glass-panel {
    fill: var(--window-panel);
    stroke: var(--window-border);
    stroke-width: 1;
}

.glass-highlight {
    fill: none;
    stroke: rgba(255, 255, 255, 0.8);
    stroke-width: 1;
}


@media (prefers-color-scheme: light) {
    :root {
        color-scheme: light;

        /* Main window */
        --window-bg: #E8ECF0;
        --window-fg: #161B22;
        --window-panel: rgba(255, 255, 255, 0.68);
        --window-border: rgba(255, 255, 255, 0.85);
        --window-muted: #57606A;

        /* Accent colors */
        --color-green: #03d329;
        --color-cyan: #58d5e8;
        --color-purple: #8250DF;
        --color-orange: #f07a05;
        --color-sweep: #03d329;
        --color-cmd:#CF222E;


        --globe-land-dot: #2F8F46;
        --globe-atmosphere: #36AFC0;
        --globe-home-pin: #B54708;
        --globe-packet-pink: #C04483;
        --ocean-center: #E3EDF6;
        --ocean-mid: #C7D9E9;
        --ocean-edge: #9CB5CC;
        --shade-color: #526779;
        --shade-opacity: 0.22;
        --globe-grid: #7193B1;

        --tech-languages: #8A6500;
        --tech-frontend: #218B9A;
        --tech-backend: #2F8F46;
        --tech-databases: #BC4C00;
        --tech-messaging: #8250DF;
        --tech-cloud-devops: #0969DA;
        --tech-monitoring: #CF222E;
        --tech-testing-quality: #BF3989;
        --tech-wireframe: #7193B1;
        --tech-core: #40C463;
        --tech-glow: #218B9A;
        --tech-wireframe-width: 0.7;
        --tech-wireframe-opacity: 0.48;

        /* Contribution tops */
        --top-0: #E0E0E0;        /* Level 0: No contributions */
        --top-1: #9BE9A8;        /* Level 1: Very low */
        --top-2: #40C463;        /* Level 2: Low */
        --top-3: #30A14E;        /* Level 3: Medium */
        --top-4: #216E39;        /* Level 4: High */
        --top-5: #14532D;        /* Level 5: Highest */

        /* Left building faces */
        --left-0: #171D25;        /* Level 0: No contributions */
        --left-1: #78C985;        /* Level 1: Very low */
        --left-2: #329C4D;        /* Level 2: Low */
        --left-3: #268440;        /* Level 3: Medium */
        --left-4: #195A30;        /* Level 4: High */
        --left-5: #104523;        /* Level 5: Highest */

        /* Right building faces */
        --right-0: #12171E;       /* Level 0: No contributions */
        --right-1: #60AE70;       /* Level 1: Very low */
        --right-2: #278440;       /* Level 2: Low */
        --right-3: #1C6C35;       /* Level 3: Medium */
        --right-4: #164A29;       /* Level 4: High */
        --right-5: #0C381C;       /* Level 5: Highest */
    }
}

"""



def esc(s):
    """Escape text safely for SVG/XML."""
    return escape(str(s), quote=True)


def load(name, default=None):
    """Load a JSON file from the data directory."""
    path = os.path.join(DATA, name)

    if not os.path.exists(path):
        return default

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save(name, obj):
    """Save JSON data to the data directory."""
    os.makedirs(DATA, exist_ok=True)

    path = os.path.join(DATA, name)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)


def write_svg(name, svg):
    """Write an SVG file to the SVG output directory."""
    os.makedirs(SVG_DIR, exist_ok=True)

    path = os.path.join(SVG_DIR, name)

    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)

    print(f"wrote {path} ({len(svg) // 1024} KB)")


def window(width, height, title, body, extra_defs=""):
    """Create terminal-window chrome with automatic theme colors."""

    return f"""<svg
    xmlns="http://www.w3.org/2000/svg"
    width="{width}"
    height="{height}"
    viewBox="0 0 {width} {height}"
    font-family="{FONT}">

<defs>
    <style>{WINDOW_THEME_CSS}</style>
    {extra_defs}
</defs>

<rect
    x="0.5"
    y="0.5"
    width="{width - 1}"
    height="{height - 1}"
    rx="10"
    fill="var(--window-bg)"
    stroke="var(--window-border)"
/>

<path
    d="M0.5 27 V10.5
       a10 10 0 0 1 10 -10
       H{width - 10.5}
       a10 10 0 0 1 10 10
       V28 Z"
    fill="var(--window-panel)"
/>

<line
    x1="0.5"
    y1="27"
    x2="{width - 0.5}"
    y2="27"
    stroke="var(--window-border)"
/>

<circle cx="18" cy="14" r="3.5" fill="#ff5f56"/>
<circle cx="36" cy="14" r="3.5" fill="#ffbd2e"/>
<circle cx="54" cy="14" r="3.5" fill="#27c93f"/>

<text
    x="{width / 2}"
    y="18"
    fill="var(--window-muted)"
    font-size="13"
    text-anchor="middle">{esc(title)}</text>

{body}

</svg>
"""
