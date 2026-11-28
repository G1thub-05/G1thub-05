"""globe.svg: a rotating dotted Earth with a home pin and packet arcs to cloud regions.

Under a fixed camera tilt every latitude ring traces the same closed curve on screen, just with a
phase offset per longitude. So each ring gets ONE shared CSS @keyframes path (sampled around a
full turn) and every dot on it plays that path with its own negative animation-delay. The front
half of a ring is a static clip region, so hidden dots need no per-frame data either.
Smooth, real 3D rotation with no JavaScript."""
import json
import math
import os
from collections import defaultdict
from common import esc, window, write_svg
from config import HOME, REGIONS

W, H = 420, 330
CX, CY, R = 210, 160, 100
TILT = math.radians(22)
PERIOD = 36  # seconds per revolution; starts with HOME facing the camera
SAMPLES = 36
HERE = os.path.dirname(os.path.abspath(__file__))

_ids = iter(range(10_000))
KEYFRAMES = []


def ring(lat, lons, color, r, alt=1.0, back=0.0, anim=""):
    """Dots at (lat, lons) on a sphere of radius alt*R, spinning with the globe."""
    phi = math.radians(lat)
    a = alt * R * math.cos(phi)
    b = a * math.sin(TILT)
    ty = CY - alt * R * math.sin(phi) * math.cos(TILT)
    # front half: cos(alpha) > c0  ->  screen y > ty + b*c0
    c0 = -math.tan(phi) * math.tan(TILT)
    if alt > 1:  # raised points stay visible a little past the horizon
        c0 -= (alt - 1) * 0.6

    k = next(_ids)
    steps = " ".join(
        f"{100 * i / SAMPLES:.2f}%{{transform:translate({CX + a * math.sin(2 * math.pi * i / SAMPLES):.1f}px,{ty + b * math.cos(2 * math.pi * i / SAMPLES):.1f}px)}}"
        for i in range(SAMPLES + 1)
    )
    KEYFRAMES.append(f"@keyframes k{k}{{{steps}}}.k{k}{{animation:k{k} {PERIOD}s linear infinite}}")


    # dot at longitude l must be at alpha = l + home offset at t=0
    dots = "".join(
        f'<circle r="{r}" class="k{k}" style="animation-delay:-{((l - HOME[2]) % 360) / 360 * PERIOD:.2f}s">{anim}</circle>'
        for l in lons
    )
    out = []
    if c0 < 1:
        cid = f"f{k}"
        out.append(f'<clipPath id="{cid}"><rect x="0" y="{ty + b * max(c0, -1.5):.2f}" width="{W}" height="{H}"/></clipPath><g clip-path="url(#{cid})" fill="{color}">{dots}</g>')
    if back and c0 > -1:
        cid = f"b{k}"
        out.append(f'<clipPath id="{cid}"><rect x="0" y="0" width="{W}" height="{ty + b * min(c0, 1.5):.2f}"/></clipPath><g clip-path="url(#{cid})" fill="{color}" opacity="{back}">{dots}</g>')
    return "".join(out)


def slerp(p, q, t):
    (la1, lo1), (la2, lo2) = p, q
    v1 = [math.cos(math.radians(la1)) * math.cos(math.radians(lo1)), math.cos(math.radians(la1)) * math.sin(math.radians(lo1)), math.sin(math.radians(la1))]
    v2 = [math.cos(math.radians(la2)) * math.cos(math.radians(lo2)), math.cos(math.radians(la2)) * math.sin(math.radians(lo2)), math.sin(math.radians(la2))]
    om = math.acos(max(-1, min(1, sum(x * y for x, y in zip(v1, v2)))))
    if om < 1e-6:
        return la1, lo1
    s1, s2 = math.sin((1 - t) * om) / math.sin(om), math.sin(t * om) / math.sin(om)
    v = [s1 * x + s2 * y for x, y in zip(v1, v2)]
    return math.degrees(math.asin(v[2])), math.degrees(math.atan2(v[1], v[0]))


def main():
    land = json.load(open(os.path.join(HERE, "land_points.json")))
    rings = defaultdict(list)
    for lat, lon in land:
        rings[lat].append(lon)

    layers = []
    # graticule: latitude lines (static ellipses, front half solid, back half faint)
    for lat in range(-60, 61, 30):
        phi = math.radians(lat)
        a, ty = R * math.cos(phi), CY - R * math.sin(phi) * math.cos(TILT)
        # layers.append(f'<ellipse cx="{CX}" cy="{ty:.1f}" rx="{a:.1f}" ry="{a * math.sin(TILT):.1f}" fill="none" stroke="var(--globe-grid)" stroke-width="0.55"/>')
        layers.append(f'<ellipse cx="{CX}" cy="{ty:.1f}" rx="{a:.1f}" ry="{a * math.sin(TILT):.1f}" fill="none" stroke="var(--globe-grid)" stroke-width=".7" opacity=".62"/>')



    # Rotating longitude lines — FIRST GLOBE (EARTH)
    for m in range(0, 180, 30):
        values = ";".join(
            f"{abs(R * math.sin(math.radians(m) + 2 * math.pi * k / SAMPLES)):.1f}"
            for k in range(SAMPLES + 1)
        )

        layers.append(
            f'<ellipse cx="{CX}" cy="{CY}" '
            f'rx="{R}" ry="{R}" fill="none" '
            f'stroke="var(--globe-grid)" '
            f'stroke-width=".7" opacity=".48">'
            f'<animate attributeName="rx" values="{values}" '
            f'dur="{PERIOD}s" repeatCount="indefinite"/>'
            f'</ellipse>'
        )


    # land
    for lat in sorted(rings):
        layers.append(ring(lat, rings[lat], "var(--globe-land-dot)", 1.7, back=0.14))

    # arcs: packets flow out from home to each region
    home = (HOME[1], HOME[2])
    colors = [
        "var(--globe-atmosphere)",
        "var(--color-purple)",
        "var(--globe-home-pin)",
        "var(--globe-packet-pink)",
        "var(--window-fg)",
    ]

    arcs = []
    for n, (_, la, lo) in enumerate(REGIONS):
        steps = 16
        for s in range(1, steps):
            t = s / steps
            plat, plon = slerp(home, (la, lo), t)
            alt = 1 + 0.22 * math.sin(math.pi * t)
            begin = (t * 1.4 + n * 0.5) % 2.8
            pulse = f'<animate attributeName="opacity" values="0.15;1;0.15" dur="2.8s" begin="{begin:.2f}s" repeatCount="indefinite"/>'
            arcs.append(ring(plat, [plon], colors[n % len(colors)], 1.3, alt=alt, anim=pulse))
        arcs.append(ring(la, [lo], colors[n % len(colors)], 2.8))
    pin = (
        ring(HOME[1], [HOME[2]], "var(--color-orange)", 3,
             anim='<animate attributeName="r" values="3;13" dur="1.8s" repeatCount="indefinite"/>'
                  '<animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite"/>')
        + ring(HOME[1], [HOME[2]], "var(--window-fg)", 3.2)
    )


    legend_y = H - 15
    names = " · ".join(r[0] for r in REGIONS[:3]) + (f" +{len(REGIONS) - 3}" if len(REGIONS) > 3 else "")
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

<style>{"".join(KEYFRAMES)} .fin {{ opacity: 0; animation: fin 1s ease-out .3s forwards; }} @keyframes fin {{ to {{ opacity: 1; }} }}</style>"""

# <text x="20" y="56" font-size="12" fill="var(--window-fg)"><tspan fill="var(--globe-land-dot)">$</tspan> ./deploy --from {esc(HOME[0].lower())} --global</text>
    body = f"""
<text x="20" y="56" font-size="12" fill="var(--window-fg)"><tspan fill="var(--globe-land-dot)">$</tspan> ./deploy</text>
<g class="fin">
<circle cx="{CX}" cy="{CY}" r="{R * 1.16:.0f}" fill="url(#atmo)"/>
<circle cx="{CX}" cy="{CY}" r="{R}" fill="url(#ocean)"/>
{''.join(layers)}
<circle cx="{CX}" cy="{CY}" r="{R}" fill="url(#shade)"/>
{''.join(arcs)}
{pin}
<circle cx="{CX}" cy="{CY}" r="{R}" fill="none" stroke="var(--window-border)" stroke-opacity="0.25"/>
</g>
<text x="{CX}" y="{CY + R + 30}"
      font-size="12"
      font-weight="700"
      letter-spacing="3"
      fill="var(--window-fg)"
      text-anchor="middle">
    GLOBAL NETWORK
</text>
<text x="{W / 2}" y="{legend_y}" font-size="10.5" fill="var(--window-muted)" text-anchor="middle"><tspan fill="var(--globe-home-pin)">●</tspan> {esc(HOME[0])} → {esc(names)}</text>
"""
    write_svg("globe.svg", window(W, H, "Globe.sh", body, defs))


if __name__ == "__main__":
    main()
