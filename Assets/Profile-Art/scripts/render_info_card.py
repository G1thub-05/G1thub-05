"""info-card.svg: neofetch-style card, refreshed daily with live stats + language bar."""
import os
from datetime import datetime, timezone

from common import BORDER, CYAN, FG, GREEN, MUTED, ORANGE, PINK, PURPLE, esc, load, window, write_svg
from config import INFO_ROWS, PROMPT_HOST, PROMPT_USER

W, H = 490, 420
STATIC = os.environ.get("STATIC") == "1"
LANG_COLORS = {
    "JavaScript": "#f1e05a", "TypeScript": "#3178c6", "Python": "#3572A5", "CSS": "#663399",
    "HTML": "#e34c26", "Go": "#00ADD8", "Java": "#b07219", "Shell": "#89e051", "Dockerfile": "#384d54",
    "SCSS": "#c6538c", "Jupyter Notebook": "#DA5B0B", "Rust": "#dea584", "HCL": "#844FBA",
}
KEY_COLORS = [GREEN, CYAN, PURPLE, ORANGE, PINK]


def uptime(created):
    c = datetime.fromisoformat(created.replace("Z", "+00:00"))
    months = (datetime.now(timezone.utc) - c).days * 12 // 365
    y, m = divmod(months, 12)
    return f"{y} yrs, {m} mos" if m else f"{y} yrs"


def main():
    st = load("contributions.json", {}).get("stats", {})
    prof = load("profile.json", {})
    langs = prof.get("languages", {})
    total_bytes = sum(langs.values()) or 1
    fill = {
        "uptime": uptime(prof["created_at"]) if prof.get("created_at") else "-",
        "top_langs": " · ".join(list(langs)[:3]) or "-",
        "public_repos": prof.get("public_repos", "-"),
        "stars": prof.get("stars", "-"),
        "total": f"{st.get('total', 0):,}",
        "current_streak": st.get("current_streak", 0),
        "longest_streak": st.get("longest_streak", 0),
    }

    def anim(k):
        return "" if STATIC else f' class="ln" style="animation-delay:{0.5 + k * 0.09:.2f}s"'

    x, y = 24, 60
    head = f"{PROMPT_USER}@{PROMPT_HOST}"
    lines = [
        f'<g{anim(0)}><text x="{x}" y="{y}" font-size="13" fill="{FG}"><tspan fill="{GREEN}">$</tspan> neofetch</text></g>',
        f'<g{anim(1)}><text x="{x}" y="{y + 28}" font-size="15" font-weight="700"><tspan fill="{GREEN}">{esc(PROMPT_USER)}</tspan><tspan fill="{FG}">@</tspan><tspan fill="{CYAN}">{esc(PROMPT_HOST)}</tspan></text>'
        f'<text x="{x}" y="{y + 42}" font-size="13" fill="{MUTED}">{"-" * len(head)}</text></g>',
    ]
    ry = y + 64
    for k, (key, val) in enumerate(INFO_ROWS):
        color = KEY_COLORS[k % len(KEY_COLORS)]
        lines.append(
            f'<g{anim(k + 2)}><text x="{x}" y="{ry + k * 20}" font-size="13"><tspan fill="{color}" font-weight="700">{esc(key)}</tspan>'
            f'<tspan x="{x + 92}" fill="{FG}">{esc(val.format(**fill))}</tspan></text></g>'
        )

    # language bar
    by = ry + len(INFO_ROWS) * 20 + 4
    bar_w = W - 2 * x
    segs, legend, cx, lx, ly = [], [], x, x, by + 28
    for k, (lang, size) in enumerate(list(langs.items())[:6]):
        w = bar_w * size / total_bytes
        c = LANG_COLORS.get(lang, MUTED)
        segs.append(f'<rect x="{cx:.1f}" y="{by}" width="{max(w, 1):.1f}" height="8" fill="{c}"/>')
        cx += w
        label = f"{lang} {100 * size / total_bytes:.1f}%"
        if lx + len(label) * 6.6 + 18 > W - x:
            lx, ly = x, ly + 17
        legend.append(f'<circle cx="{lx + 4}" cy="{ly - 4}" r="4" fill="{c}"/><text x="{lx + 13}" y="{ly}" font-size="11" fill="{MUTED}">{esc(label)}</text>')
        lx += len(label) * 6.6 + 30
    bar_anim = "" if STATIC else '<animate attributeName="width" from="0" to="{0}" begin="1.6s" dur="1.2s" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1" keyTimes="0;1"/>'.format(bar_w)
    lines.append(
        f'<clipPath id="barClip"><rect x="{x}" y="{by}" width="{0 if not STATIC else bar_w}" height="8" rx="4">{bar_anim}</rect></clipPath>'
        f'<rect x="{x}" y="{by}" width="{bar_w}" height="8" rx="4" fill="{BORDER}"/>'
        f'<g clip-path="url(#barClip)">{"".join(segs)}</g>'
        f'<g{anim(len(INFO_ROWS) + 4)}>{"".join(legend)}</g>'
    )

    defs = "" if STATIC else """<style>
  .ln { opacity: 0; animation: ln .5s ease-out forwards; }
  @keyframes ln { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
</style>"""
    write_svg("info-card.svg", window(W, H, f"{PROMPT_USER}@{PROMPT_HOST}: ~", "\n".join(lines), defs))


if __name__ == "__main__":
    main()
