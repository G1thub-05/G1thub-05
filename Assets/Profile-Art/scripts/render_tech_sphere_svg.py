"""tech-sphere.svg: the tech stack as labels on a rotating 3D sphere.
Positions are sampled around one revolution and played back as SMIL value lists,
so the browser interpolates a smooth spin; size and opacity follow depth."""
import math

from common import CYAN, FG, GREEN, MUTED, ORANGE, PINK, PURPLE, esc, window, write_svg
from config import TECH

W, H = 430, 400
CX, CY, R = 215, 212, 120
TILT = math.radians(18)
PERIOD = 30
SAMPLES = 60
# COLORS = {"frontend": CYAN, "backend": GREEN, "cloud": ORANGE, "ai": PURPLE, "tools": PINK}

COLORS = {
    "languages": "#F2C14E",
    "frontend": CYAN,
    "backend": GREEN,
    "databases": ORANGE,
    "messaging": PURPLE,
    "cloud_devops": "#79C0FF",
    "monitoring": "#FF7B72",
    "testing_quality": PINK,
    "tools": FG,
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
            ys.append(f"{y + 4:.1f}")
            sizes.append(f"{8.5 + 8 * d:.1f}")
            ops.append(f"{0.18 + 0.82 * d ** 1.6:.2f}")
        a = f'dur="{PERIOD}s" repeatCount="indefinite"'
        texts.append(
            f'<text text-anchor="middle" fill="{COLORS.get(cat, FG)}" font-weight="700" x="{xs[0]}" y="{ys[0]}" font-size="{sizes[0]}" opacity="{ops[0]}">{esc(label)}'
            f'<animate attributeName="x" values="{";".join(xs)}" {a}/>'
            f'<animate attributeName="y" values="{";".join(ys)}" {a}/>'
            f'<animate attributeName="font-size" values="{";".join(sizes)}" {a}/>'
            f'<animate attributeName="opacity" values="{";".join(ops)}" {a}/></text>'
        )

    # wireframe: a few latitude ellipses (static) and spinning meridians (animated rx)
    wire = []
    for lat in (-60, -30, 0, 30, 60):
        p = math.radians(lat)
        rx = R * math.cos(p)
        wire.append(f'<ellipse cx="{CX}" cy="{CY - R * math.sin(p) * math.cos(TILT):.1f}" rx="{rx:.1f}" ry="{rx * math.sin(TILT):.1f}" fill="none" stroke="#2d3a4a"/>')
    for m in range(0, 180, 30):
        rxs = ";".join(f"{abs(R * math.sin(math.radians(m) + th)):.1f}" for th in thetas)
        wire.append(f'<ellipse cx="{CX}" cy="{CY}" rx="{R}" ry="{R}" fill="none" stroke="#2d3a4a">'
                    f'<animate attributeName="rx" values="{rxs}" dur="{PERIOD}s" repeatCount="indefinite"/></ellipse>')

    # legend, lx = [], 0
    # cats = list(TECH)
    # total = sum(len(c) + 4 for c in cats) * 6.4
    # lx = (W - total) / 2
    # for c in cats:
    #     legend.append(f'<circle cx="{lx + 4:.1f}" cy="{H - 26}" r="3.5" fill="{COLORS.get(c, FG)}"/><text x="{lx + 11:.1f}" y="{H - 22}" font-size="10.5" fill="{MUTED}">{esc(c)}</text>')
    #     lx += (len(c) + 4) * 6.4


    legend = []
    cats = list(TECH)
    cols = 4
    cell_w = W / cols
    row_h = 16
    start_y = H - 42
    padding_x = 8

    for i, c in enumerate(cats):
        row = i // cols
        col = i % cols

        lx = padding_x + col * cell_w
        ly = start_y + row * row_h

        color = COLORS.get(c, FG)
        legend.append(
            f'<circle cx="{lx + 4:.1f}" cy="{ly - 3:.1f}" r="3" fill="{color}"/>'
            f'<text x="{lx + 11:.1f}" y="{ly:.1f}" '
            f'font-size="8.5" fill="{color}">{esc(c)}</text>'
        )


    defs = f"""
<radialGradient id="core" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="{PURPLE}" stop-opacity="0.18"/><stop offset="0.6" stop-color="{CYAN}" stop-opacity="0.05"/><stop offset="1" stop-color="{CYAN}" stop-opacity="0"/></radialGradient>
<style>.fin {{ opacity: 0; animation: fin 1s ease-out .3s forwards; }} @keyframes fin {{ to {{ opacity: 1; }} }}</style>"""
    body = f"""
<text x="20" y="56" font-size="12" fill="{FG}"><tspan fill="{GREEN}">$</tspan> ls ~/stack --3d</text>
<g class="fin">
<circle cx="{CX}" cy="{CY}" r="{R * 1.25:.0f}" fill="url(#core)"/>
{''.join(wire)}
{''.join(texts)}
</g>
{''.join(legend)}
"""
    write_svg("tech-sphere.svg", window(W, H, "stack.sh", body, defs))


if __name__ == "__main__":
    main()
