"""contrib-heatmap.svg: 53x7 grid with a diagonal wave reveal and a sweeping highlight."""
from datetime import date, timedelta

from common import esc, load, window, write_svg

W, H = 860, 270
CELL, GAP = 12, 3.2
STEP = CELL + GAP



def main():
    data = load("contributions.json")
    days, st = data["days"], data["stats"]
    first = date.fromisoformat(days[0]["date"])
    start = first - timedelta(days=(first.weekday() + 1) % 7)  # back up to Sunday
    cols = (date.fromisoformat(days[-1]["date"]) - start).days // 7 + 1

    grid_w = cols * STEP - GAP
    x0 = (W - grid_w) / 2 + 14
    y0 = 92

    cells, months, last_month = [], [], None
    for d in days:
        dt = date.fromisoformat(d["date"])
        off = (dt - start).days
        c, r = off // 7, off % 7
        x, y = x0 + c * STEP, y0 + r * STEP

        lvl = d["level"]
        if d["count"] == max(1, st["best_day"]["count"]):
            lvl = 5

        delay = (c + r * 1.5) * 0.018

        cells.append(
            f'<rect x="{x:.1f}" y="{y:.1f}" '
            f'width="{CELL}" height="{CELL}" rx="2.5" '
            f'class="c heat-{lvl}" '
            f'style="animation-delay:{delay:.3f}s">'
            f'<title>{d["count"]} on {d["date"]}</title></rect>'
        )

        if r == 0 and dt.month != last_month and dt.day <= 7 and c < cols - 2:
            months.append(f'<text x="{x:.1f}" y="{y0 - 9}" font-size="11" fill="var(--window-muted)">{dt.strftime("%b")}</text>')
            last_month = dt.month

    wd = "".join(
        f'<text x="{x0 - 10}" y="{y0 + r * STEP + 10}" font-size="10" fill="var(--window-muted)" text-anchor="end">{n}</text>'
        for r, n in ((1, "Mon"), (3, "Wed"), (5, "Fri"))
    )
    legend_x = x0 + grid_w - 6 * 15 - 40
    ly = y0 + 7 * STEP + 14
    legend = (
        f'<text x="{legend_x - 8}" y="{ly + 10}" font-size="11" fill="var(--window-muted)" text-anchor="end">Less</text>'

        # + "".join(f'<rect x="{legend_x + i * 15}" y="{ly}" width="{CELL}" height="{CELL}" rx="2.5" fill="{p}"/>' for i, p in enumerate(PALETTE))
        + "".join(
            f'<rect x="{legend_x + i * 15}" y="{ly}" '
            f'width="{CELL}" height="{CELL}" rx="2.5" '
            f'class="heat-{i}"/>'
            for i in range(6)
        )
        + f'<text x="{legend_x + 6 * 15 + 4}" y="{ly + 10}" font-size="11" fill="var(--window-muted)">More</text>'
    )
    best = date.fromisoformat(st["best_day"]["date"]).strftime("%b %d, %Y")
    # stats = [
    #     (f"{st['total']:,}", "contributions", "var(--color-green)"),
    #     (f"{st['current_streak']}d", "current streak", "var(--color-cyan)"),
    #     (f"{st['longest_streak']}d", "longest streak", "var(--color-purple)"),
    #     (f"{st['best_day']['count']}", f"best day · {best}", "var(--color-orange)"),
    # ]

    daily_avg = st["total"] / len(days) if days else 0
    stats = [
        (f"{st['total']:,}", "contributions", "var(--color-green)"),
        (f"{st['best_day']['count']}", f"best day · {best}", "var(--color-orange)"),
        (f"{daily_avg:.1f}", "daily average", "var(--color-cyan)"),
        (f"{st['longest_streak']}d", "longest streak", "var(--color-purple)"),
        (f"{st['current_streak']}d", "current streak", "var(--color-cyan)"),
    ]


    # sx = x0
    # foot = []
    # for i, (v, label, color) in enumerate(stats):
    #     foot.append(
    #         f'<g class="f" style="animation-delay:{1.6 + i * 0.15:.2f}s"><text x="{sx}" y="{H - 20}" font-size="15" font-weight="700" fill="{color}">{esc(v)}'
    #         f'<tspan font-size="11" font-weight="400" fill="var(--window-muted)" dx="6">{esc(label)}</tspan></text></g>'
    #     )
    #     sx += (len(v) + len(label)) * 7.2 + 44


    foot = []
    margin = 42
    font_value = 12
    font_label = 10

    # Estimate each stat's rendered width
    widths = [
        len(v) * font_value * 0.62
        + len(label) * font_label * 0.60
        + 4
        for v, label, color in stats
    ]

    total_text_width = sum(widths)
    gap = (W - 2 * margin - total_text_width) / (len(stats) - 1)
    sx = margin

    for i, (v, label, color) in enumerate(stats):
        foot.append(
            f'<g class="f" style="animation-delay:{1.6 + i * 0.15:.2f}s">'
            f'<text x="{sx:.1f}" y="{H - 20}" font-size="{font_value}" font-weight="700" fill="{color}">{esc(v)}'
            f'<tspan font-size="{font_label}" font-weight="400" fill="var(--window-muted)" dx="4">{esc(label)}</tspan>'
            f'</text></g>'
        )
        sx += widths[i] + gap




    defs = f"""
<linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="var(--color-sweep)" stop-opacity="0"/><stop offset="0.5" stop-color="var(--color-sweep)" stop-opacity="0.22"/><stop offset="1" stop-color="var(--color-sweep)" stop-opacity="0"/>
</linearGradient>
<clipPath id="gridClip">{''.join(c.split('<title>')[0].split(' class=')[0] + '/>' for c in cells)}</clipPath>
<style>

  .heat-0 {{ fill: var(--top-0); }}
  .heat-1 {{ fill: var(--top-1); }}
  .heat-2 {{ fill: var(--top-2); }}
  .heat-3 {{ fill: var(--top-3); }}
  .heat-4 {{ fill: var(--top-4); }}
  .heat-5 {{ fill: var(--top-5); }}

  .c {{ opacity: 0; transform-box: fill-box; transform-origin: center; animation: pop .45s cubic-bezier(.2,1.6,.4,1) forwards; }}
  @keyframes pop {{ from {{ opacity: 0; transform: scale(.2); }} to {{ opacity: 1; transform: scale(1); }} }}

  .f {{ opacity: 0; animation: fin .6s ease-out forwards; }}
  @keyframes fin {{ to {{ opacity: 1; }} }}

</style>"""

    body = f"""
<text x="{x0}" y="{y0 - 34}" font-size="13" fill="var(--window-fg)"><tspan fill="var(--color-green)">$</tspan> git log --since="1 year ago" | heatmap</text>
{''.join(months)}{wd}
{''.join(cells)}
<g clip-path="url(#gridClip)"><rect x="{x0 - 160}" y="{y0}" width="160" height="{7 * STEP}" fill="url(#sweep)">
  <animate attributeName="x" values="{x0 - 160};{x0 + grid_w + 160}" begin="2.2s" dur="3.2s" repeatCount="indefinite"/></rect></g>
{legend}
{''.join(foot)}
"""
    write_svg("contrib-heatmap.svg", window(W, H, "Contributions.sh", body, defs))


if __name__ == "__main__":
    main()
