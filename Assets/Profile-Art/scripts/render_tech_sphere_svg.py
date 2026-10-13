"""tech-sphere.svg: the tech stack as labels on a rotating 3D sphere.
Positions are sampled around one revolution and played back as SMIL value lists,
so the browser interpolates a smooth spin; size and opacity follow depth."""
import math

from common import esc, window, write_svg
from config import TECH


W, H = 420, 330
CX, CY, R = 210, 160, 100
TILT = math.radians(18)
PERIOD = 30
SAMPLES = 60


COLORS = {
    "languages": "var(--tech-languages)",
    "frontend": "var(--tech-frontend)",
    "backend": "var(--tech-backend)",
    "databases": "var(--tech-databases)",
    "messaging": "var(--tech-messaging)",
    "cloud_devops": "var(--tech-cloud-devops)",
    "monitoring": "var(--tech-monitoring)",
    "testing_quality": "var(--tech-testing-quality)",
    "tools": "var(--window-fg)",
}

def project(v, theta):
    x, y, z = v
    # spin around the vertical axis, then tilt toward the camera
    x, z = x * math.cos(theta) + z * math.sin(theta), -x * math.sin(theta) + z * math.cos(theta)
    y, z = y * math.cos(TILT) - z * math.sin(TILT), y * math.sin(TILT) + z * math.cos(TILT)
    return CX + R * x, CY - R * y, z


def main():
    labels = [(t, cat) for cat, items in TECH.items() for t in items]
    n = len(labels)
    golden = math.pi * (3 - math.sqrt(5))
    pts = []
    for i in range(n):  # Fibonacci sphere: evenly spread points
        y = 1 - 2 * (i + 0.5) / n
        r = math.sqrt(1 - y * y)
        pts.append((r * math.cos(golden * i), y, r * math.sin(golden * i)))

    thetas = [2 * math.pi * k / SAMPLES for k in range(SAMPLES + 1)]
    texts = []
    for (label, cat), v in zip(labels, pts):
        xs, ys, sizes, ops = [], [], [], []
        for th in thetas:
            x, y, z = project(v, th)
            d = (z + 1) / 2  # 0 back .. 1 front
            xs.append(f"{x:.1f}")
            ys.append(f"{y + 10:.1f}")
            sizes.append(f"{3.5 + 8 * d:.1f}")
            ops.append(f"{0.18 + 0.82 * d ** 1.6:.2f}")
        a = f'dur="{PERIOD}s" repeatCount="indefinite"'
        texts.append(
            f'<text text-anchor="middle" fill="{COLORS.get(cat, "var(--window-fg)")}" font-weight="700" x="{xs[0]}" y="{ys[0]}" font-size="{sizes[0]}" opacity="{ops[0]}">{esc(label)}'
            f'<animate attributeName="x" values="{";".join(xs)}" {a}/>'
            f'<animate attributeName="y" values="{";".join(ys)}" {a}/>'
            f'<animate attributeName="font-size" values="{";".join(sizes)}" {a}/>'
            f'<animate attributeName="opacity" values="{";".join(ops)}" {a}/></text>'
        )

    # wireframe: a few latitude ellipses (static) and spinning meridians (animated rx)
    wire = []
    # graticule: latitude lines (static ellipses, front half solid, back half faint)
    for lat in range(-60, 61, 30):
        phi = math.radians(lat)
        a, ty = R * math.cos(phi), CY - R * math.sin(phi) * math.cos(TILT)
        wire.append(f'<ellipse cx="{CX}" cy="{ty:.1f}" rx="{a:.1f}" ry="{a * math.sin(TILT):.1f}" fill="none" stroke="var(--tech-wireframe)" stroke-width="var(--tech-wireframe-width)" opacity="var(--tech-wireframe-opacity)"/>')

    # Rotating longitude lines — FIRST GLOBE (EARTH)
    for m in range(0, 180, 30):
        values = ";".join(
            f"{abs(R * math.sin(math.radians(m) + 2 * math.pi * k / SAMPLES)):.1f}"
            for k in range(SAMPLES + 1)
        )

        wire.append(
            f'<ellipse cx="{CX}" cy="{CY}" '
            f'rx="{R}" ry="{R}" fill="none" '
            f'stroke="var(--tech-wireframe)" '
            f'stroke-width="var(--tech-wireframe-width)" opacity="var(--tech-wireframe-opacity)">'
            f'<animate attributeName="rx" values="{values}" '
            f'dur="{PERIOD}s" repeatCount="indefinite"/>'
            f'</ellipse>'
        )

    legend = []
    cats = list(TECH)
    cols = 4
    row_h = 16
    start_y = H - 42
    padding_x = 23
    cell_w = (W - 2 * padding_x) / cols

    for i, c in enumerate(cats):
        row = i // cols
        col = i % cols

        lx = padding_x + col * cell_w
        ly = start_y + row * row_h

        color = COLORS.get(c, "var(--window-fg)")
        legend.append(
            f'<circle cx="{lx + 4:.1f}" cy="{ly - 3:.1f}" r="3" fill="{color}"/>'
            f'<text x="{lx + 11:.1f}" y="{ly:.1f}" '
            f'font-size="8.5" fill="{color}">{esc(c)}</text>'
        )


    defs = f"""
    <radialGradient id="ocean" cx="0.38" cy="0.32" r="0.75">
        <stop offset="0" stop-color="var(--ocean-center)"/>
        <stop offset="0.7" stop-color="var(--ocean-mid)"/>
        <stop offset="1" stop-color="var(--ocean-edge)"/>
    </radialGradient>

    <radialGradient id="shade" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.72" stop-color="var(--shade-color)" stop-opacity="0"/>
        <stop offset="1" stop-color="var(--shade-color)" stop-opacity="var(--shade-opacity)"/>
    </radialGradient>

    <radialGradient id="atmo" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.86" stop-color="var(--globe-atmosphere)" stop-opacity="0"/>
        <stop offset="0.92" stop-color="var(--globe-atmosphere)" stop-opacity="0.12"/>
        <stop offset="1" stop-color="var(--globe-atmosphere)" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="core" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="var(--tech-core)" stop-opacity="0.18"/>
        <stop offset="0.6" stop-color="var(--tech-glow)" stop-opacity="0.05"/>
        <stop offset="1" stop-color="var(--tech-glow)" stop-opacity="0"/>
    </radialGradient>

    <style>
    .fin {{ opacity: 0; animation: fin 1s ease-out .3s forwards; }}
    @keyframes fin {{ to {{ opacity: 1; }} }}
    </style>
    """




    body = f"""
<text x="20" y="56" font-size="12" fill="var(--window-fg)"><tspan fill="var(--color-green)">$</tspan> ls ~/stack --3d</text>
<g class="fin">



    <!-- Outer atmosphere -->
    <circle cx="{CX}" cy="{CY}" r="{R * 1.16:.0f}" fill="url(#atmo)"/>

    <!-- Dark blue sphere background -->
    <circle cx="{CX}" cy="{CY}" r="{R}" fill="url(#ocean)"/>

    <!-- Center glow -->
    <circle cx="{CX}" cy="{CY}" r="{R}" fill="url(#core)"/>

    <!-- Grid lines -->
    {''.join(wire)}

    <!-- Edge shadow -->
    <circle cx="{CX}" cy="{CY}" r="{R}" fill="url(#shade)"/>

    <!-- Rotating labels -->
    {''.join(texts)}

    <!-- Outer border -->
    <circle cx="{CX}" cy="{CY}" r="{R}" fill="none"
            stroke="var(--window-border)" stroke-opacity="0.25"/>
</g>
{''.join(legend)}
"""
# <text x="{CX}" y="{CY + R + 30}"
#       font-size="12"
#       font-weight="700"
#       letter-spacing="3"
#       fill="var(--window-fg)"
#       text-anchor="middle">
#     TECH STACK
# </text>

    write_svg("tech-sphere.svg", window(W, H, "Tech-Stack.sh", body, defs))


if __name__ == "__main__":
    main()
