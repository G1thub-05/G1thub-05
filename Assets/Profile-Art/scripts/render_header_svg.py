"""header.svg: glowing name + endless typing/deleting role loop + scanline."""
from common import CYAN, FG, GREEN, MUTED, PURPLE, esc, window, write_svg
from config import NAME, PROMPT_HOST, PROMPT_USER, ROLES, TAGLINE

W, H = 860, 210
CHAR_W = 9.6  # 16px monospace advance; textLength pins it so the cursor lines up


def roles_svg(x, y):
    n = len(ROLES)
    slot = 5.0
    T = n * slot
    out = []
    for k, role in enumerate(ROLES):
        w = len(role) * CHAR_W
        t0 = k * slot
        typed, held, gone = t0 + len(role) * 0.055, t0 + slot - 1.1, t0 + slot - 0.35
        kt = [0, t0 / T, typed / T, held / T, gone / T, 1]
        # keyTimes must be strictly ordered and start at 0 / end at 1
        keys = ";".join(f"{v:.4f}" for v in sorted(set(kt)))
        vals_w = {0: 0, t0 / T: 0, typed / T: w, held / T: w, gone / T: 0, 1: 0}
        widths = ";".join(f"{vals_w[v]:.1f}" for v in sorted(set(kt)))
        out.append(f"""<clipPath id="r{k}"><rect x="{x}" y="{y - 16}" width="0" height="22">
<animate attributeName="width" values="{widths}" keyTimes="{keys}" dur="{T}s" repeatCount="indefinite"/></rect></clipPath>
<text x="{x}" y="{y}" font-size="16" fill="{FG}" textLength="{w:.1f}" lengthAdjust="spacingAndGlyphs" clip-path="url(#r{k})">{esc(role)}</text>
<rect x="{x}" y="{y - 14}" width="9" height="18" fill="{GREEN}" opacity="0">
<animate attributeName="x" values="{';'.join(f'{x + vals_w[v]:.1f}' for v in sorted(set(kt)))}" keyTimes="{keys}" dur="{T}s" repeatCount="indefinite"/>
<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;{t0 / T:.4f};{gone / T:.4f};{min(gone / T + 0.0001, 0.9999):.4f};1" dur="{T}s" repeatCount="indefinite" calcMode="discrete"/>
</rect>""")
    return "\n".join(out)


def main():
    prompt = f"{PROMPT_USER}@{PROMPT_HOST}:~$"
    px = 40
    cmd = "./hello.sh"
    defs = f"""
<linearGradient id="nameGrad" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
  <stop offset="0" stop-color="{GREEN}"/><stop offset="0.5" stop-color="{CYAN}"/><stop offset="1" stop-color="{PURPLE}"/>
  <animateTransform attributeName="gradientTransform" type="translate" values="-1 0;1 0;-1 0" dur="8s" repeatCount="indefinite"/>
</linearGradient>
<linearGradient id="nameGradStatic" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="{GREEN}"/><stop offset="0.5" stop-color="{CYAN}"/><stop offset="1" stop-color="{PURPLE}"/>
</linearGradient>
<filter id="glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#ffffff" opacity="0.05"/></pattern>
<linearGradient id="scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{GREEN}" stop-opacity="0"/><stop offset="1" stop-color="{GREEN}" stop-opacity="0.08"/></linearGradient>
<clipPath id="inner"><rect x="1" y="33" width="{W - 2}" height="{H - 34}" rx="9"/></clipPath>
<clipPath id="cmdClip"><rect x="{px + len(prompt) * 8.4 + 8}" y="40" width="0" height="20"><animate attributeName="width" from="0" to="{len(cmd) * 8.4 + 2}" begin="0.3s" dur="0.6s" fill="freeze"/></rect></clipPath>
<style>
  .fade {{ opacity: 0; animation: in .7s ease-out forwards; }}
  @keyframes in {{ from {{ opacity: 0; transform: translateY(8px); }} to {{ opacity: 1; transform: none; }} }}
</style>"""
    body = f"""
<g clip-path="url(#inner)">
  <rect x="0" y="32" width="{W}" height="{H}" fill="url(#dots)"/>
  <rect x="0" y="-40" width="{W}" height="40" fill="url(#scan)"><animate attributeName="y" values="-10;{H}" dur="5s" repeatCount="indefinite"/></rect>
</g>
<text x="{px}" y="55" font-size="14"><tspan fill="{GREEN}">{esc(prompt)}</tspan></text>
<text x="{px + len(prompt) * 8.4 + 8}" y="55" font-size="14" fill="{FG}" textLength="{len(cmd) * 8.4:.1f}" clip-path="url(#cmdClip)">{esc(cmd)}</text>
<g class="fade" style="animation-delay:1s">
  <text x="{px}" y="112" font-size="46" font-weight="800" letter-spacing="2" fill="url(#nameGrad)" filter="url(#glow)">{esc(NAME.upper())}</text>
</g>
<g class="fade" style="animation-delay:1.4s">
  <text x="{px}" y="148" font-size="16" fill="{MUTED}">&gt;</text>
</g>
<g class="fade" style="animation-delay:1.6s">{roles_svg(px + 20, 148)}</g>
<g class="fade" style="animation-delay:1.9s">
  <text x="{px}" y="182" font-size="13" fill="{MUTED}">{esc(TAGLINE)}</text>
</g>
"""
    write_svg("header.svg", window(W, H, f"~/{PROMPT_USER} — zsh", body, defs))


if __name__ == "__main__":
    main()
