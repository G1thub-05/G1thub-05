"""contrib-skyline.svg: the contribution year as an isometric 3D city that rises week by week."""
import math
from datetime import date, timedelta
from common import esc, load, window, write_svg

W, H = 860, 410
IX, IY = 11.2, 4.8   # screen vector for +1 week
JX, JY = -11.2, 6.0  # screen vector for +1 weekday
HMAX = 105
INSET = 0.1

# Building faces use CSS variables from common.py.
TOPS = [f"var(--top-{i})" for i in range(6)]
LEFT = [f"var(--left-{i})" for i in range(6)]
RIGHT = [f"var(--right-{i})" for i in range(6)]

def main():
    data = load("contributions.json")
    days, st = data["days"], data["stats"]
    first = date.fromisoformat(days[0]["date"])
    start = first - timedelta(days=(first.weekday() + 1) % 7)
    cols = (date.fromisoformat(days[-1]["date"]) - start).days // 7 + 1
    peak = max(1, max(d["count"] for d in days))

    ox = (W - (cols + 7) * IX) / 2 + 7 * IX - 10
    oy = 92

    def P(i, j, h=0.0):
        return ox + i * IX + j * JX, oy + i * IY + j * JY - h

    def poly(pts, fill, extra=""):
        return f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}" fill="{fill}"{extra}/>'

    cells = []
    for d in days:
        off = (date.fromisoformat(d["date"]) - start).days
        cells.append((off // 7, off % 7, d))
    cells.sort(key=lambda t: (t[0] + t[1], t[1]))  # painter's order: far to near

    out, best_top = [], None
    a, b = INSET, 1 - INSET
    for i, j, d in cells:
        lvl = d["level"]
        if d["count"] == peak:
            lvl = 5
        h = 0 if d["count"] == 0 else 3 + math.sqrt(d["count"] / peak) * HMAX
        top = [P(i + a, j + a, h), P(i + b, j + a, h), P(i + b, j + b, h), P(i + a, j + b, h)]
        delay = 0.4 + i * 0.035 + j * 0.03
        tip = f"<title>{d['count']} contributions on {d['date']}</title>"
        if h == 0:
            out.append(f'<g class="t" style="animation-delay:{delay:.2f}s">{poly(top, TOPS[0])}{tip}</g>')
            continue
        left = [P(i + a, j + b, h), P(i + b, j + b, h), P(i + b, j + b), P(i + a, j + b)]
        right = [P(i + b, j + a, h), P(i + b, j + b, h), P(i + b, j + b), P(i + b, j + a)]
        out.append(
            f'<g class="b" style="animation-delay:{delay:.2f}s">'
            f'{poly(left, LEFT[lvl])}{poly(right, RIGHT[lvl])}{poly(top, TOPS[lvl])}{tip}</g>'
        )
        if d["count"] == peak and best_top is None:
            best_top = (P(i + 0.5, j + 0.5, h), d)

    months, seen = [], set()
    for i, j, d in cells:
        dt = date.fromisoformat(d["date"])
        if j == 0 and dt.day <= 7 and dt.month not in seen:
            seen.add(dt.month)
            x, y = P(i + 0.2, 7.5)
            ang = math.degrees(math.atan2(IY, IX))
            months.append(f'<text x="{x:.1f}" y="{y + 8:.1f}" font-size="10" fill="var(--window-muted)" transform="rotate({ang:.1f} {x:.1f} {y + 8:.1f})">{dt.strftime("%b")}</text>')

    beacon = ""
    if best_top:
        (bx, by), bd = best_top
        label = f"{bd['count']} · {date.fromisoformat(bd['date']).strftime('%b %d')}"
        beacon = f"""<g class="fin" style="animation-delay:3.2s">
  <rect x="{bx - 1.5:.1f}" y="{by - 46:.1f}" width="3" height="46" fill="url(#beam)"/>
  <circle cx="{bx:.1f}" cy="{by - 48:.1f}" r="4" fill="var(--color-orange)"><animate attributeName="r" values="3;6;3" dur="1.6s" repeatCount="indefinite"/></circle>
  <circle cx="{bx:.1f}" cy="{by - 48:.1f}" r="4" fill="var(--color-orange)" stroke="var(--color-orange)"><animate attributeName="r" values="4;16" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0" dur="1.6s" repeatCount="indefinite"/></circle>
  <text x="{bx + 12:.1f}" y="{by - 52:.1f}" font-size="11" fill="var(--color-orange)">peak {esc(label)}</text>
</g>"""

    rng = f"{date.fromisoformat(st['range'][0]).strftime('%b %Y')} → {date.fromisoformat(st['range'][1]).strftime('%b %Y')}"
    stats_tr = f"""<g class="fin" style="animation-delay:2.4s" text-anchor="end">
  <text x="{W - 36}" y="98" font-size="44" font-weight="800" fill="url(#txt)">{st['total']:,}</text>
  <text x="{W - 36}" y="120" font-size="13" fill="var(--window-fg)">contributions in the last year</text>
  <text x="{W - 36}" y="139" font-size="11" fill="var(--window-muted)">{esc(rng)}</text>
</g>"""
    rows = [
        ("current streak", f"{st['current_streak']} days", "var(--color-cyan)"),
        ("longest streak", f"{st['longest_streak']} days", "var(--color-purple)"),
        ("active days", f"{st['active_days']} / {len(days)}", "var(--color-green)"),
        ("busiest weekday", st["busiest_weekday"], "var(--color-orange)"),
    ]
    stats_bl = "".join(
        f'<g class="fin" style="animation-delay:{2.6 + k * 0.15:.2f}s"><text x="36" y="{H - 104 + k * 22}" font-size="12" fill="var(--window-muted)">{esc(lbl)}'
        f'<tspan x="168" fill="{c}" font-weight="700">{esc(v)}</tspan></text></g>'
        for k, (lbl, v, c) in enumerate(rows)
    )

    gx, gy = P(cols / 2, 3.5)
    defs = f"""
<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="var(--color-green)" stop-opacity="0.16"/><stop offset="1" stop-color="var(--color-green)" stop-opacity="0"/></radialGradient>
<linearGradient id="beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--color-orange)" stop-opacity="0.9"/><stop offset="1" stop-color="var(--color-orange)" stop-opacity="0"/></linearGradient>
<linearGradient id="txt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--color-green)"/><stop offset="1" stop-color="var(--color-cyan)"/></linearGradient>
<style>
  .b {{ transform-box: fill-box; transform-origin: 50% 100%; transform: scaleY(0); animation: rise .9s cubic-bezier(.2,1.3,.4,1) forwards; }}
  @keyframes rise {{ to {{ transform: scaleY(1); }} }}
  .t, .fin {{ opacity: 0; animation: fin .6s ease-out forwards; }}
  @keyframes fin {{ to {{ opacity: 1; }} }}
</style>"""


    body = f"""
<ellipse cx="{gx:.0f}" cy="{gy:.0f}" rx="380" ry="170" fill="url(#glow)"/>
<text x="36" y="62" font-size="13" fill="var(--window-fg)"><tspan fill="var(--color-green)">$</tspan> ./skyline --user {esc(data['username'])} --3d</text>
{''.join(out)}
{''.join(months)}
{beacon}
{stats_tr}
{stats_bl}
"""

    write_svg("contrib-skyline.svg", window(W, H, "Skyline.sh", body, defs))


if __name__ == "__main__":
    main()
