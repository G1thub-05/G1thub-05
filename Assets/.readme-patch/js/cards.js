/*
 * cards.js: draws the stats, streak, heatmap, languages, timeline, project and connect cards as SVG files.
 * Visual language: glass panels, aurora light, a faint tech grid and neon accents, in one of several themes.
 * Every card carries its own background, so it reads well on GitHub's light and dark themes.
 * ReadmeCards.buildCards(model, options) -> [{ name: "cards/stats.svg", data: "<svg…>" }, …]
 */
(function (root, factory) {
  var node = typeof module === "object" && module.exports;
  var api = factory(node ? require("./core.js") : root.ReadmeCore, node ? require("./universe.js") : root.ReadmeUniverse);
  if (node) module.exports = api;
  else root.ReadmeCards = api;
})(typeof self !== "undefined" ? self : this, function (core, universe) {
  "use strict";

  var SANS = "system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  var MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DAYMS = 86400000;

  var LANG_COLORS = {
    "JavaScript": "#f1e05a", "TypeScript": "#3178c6", "Python": "#3572A5", "Go": "#00ADD8", "Rust": "#dea584",
    "Java": "#b07219", "Kotlin": "#A97BFF", "Swift": "#F05138", "C": "#9a9a9a", "C++": "#f34b7d", "C#": "#178600",
    "PHP": "#4F5D95", "Ruby": "#CC342D", "Shell": "#89e051", "HCL": "#844FBA", "Dockerfile": "#5d8fa8",
    "HTML": "#e34c26", "CSS": "#8a63d2", "SCSS": "#c6538c", "Vue": "#41b883", "Jupyter Notebook": "#DA5B0B",
    "Makefile": "#6aa84f", "Lua": "#6c7bff", "Dart": "#00B4AB", "Markdown": "#8fa3b8", "Jinja": "#c25a5a",
    "Groovy": "#4298b8", "Scala": "#DC322F", "R": "#198CE7"
  };

  /* ---------- text helpers ---------- */
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmt(n) {
    n = Number(n) || 0;
    if (n >= 10000) return Math.round(n / 1000) + "k";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }
  function trunc(s, max) {
    s = String(s);
    return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
  }
  /** Greedy word wrap into at most maxLines lines; the last line gets an ellipsis if text remains. */
  function wrap(text, maxChars, maxLines) {
    var words = String(text).split(/\s+/).filter(Boolean), lines = [], cur = "";
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (w.length > maxChars) w = w.slice(0, maxChars - 1) + "…";
      if (!cur) cur = w;
      else if ((cur + " " + w).length <= maxChars) cur += " " + w;
      else { lines.push(cur); cur = w; }
      if (lines.length === maxLines) break;
    }
    if (lines.length < maxLines && cur) { lines.push(cur); cur = ""; }
    var consumed = lines.join(" ").split(/\s+/).filter(Boolean).length;
    if (consumed < words.length && lines.length) {
      var last = lines[lines.length - 1];
      lines[lines.length - 1] = (last.length >= maxChars ? last.slice(0, maxChars - 1) : last).replace(/[\s.,;:]+$/, "") + "…";
    }
    return lines;
  }
  /** Rough rendered width of text in the page's sans font, from per-character widths (narrow i/l, wide m/w, capitals). */
  function textWidth(str, size, bold) {
    var w = 0, s = String(str), i, ch;
    for (i = 0; i < s.length; i++) {
      ch = s.charAt(i);
      if ("ijl.,;:!|' `".indexOf(ch) !== -1) w += 0.3;
      else if ("frt-_()[]{}/\\".indexOf(ch) !== -1) w += 0.4;
      else if ("mwMW@".indexOf(ch) !== -1) w += 0.9;
      else if (ch >= "A" && ch <= "Z") w += 0.7;
      else if (ch >= "0" && ch <= "9") w += 0.6;
      else w += 0.57;
    }
    return w * size * (bold ? 1.08 : 1.02);
  }
  /** Shortens text with an ellipsis until it fits the given pixel width. */
  function fitText(str, size, maxPx, bold) {
    var s = String(str);
    if (textWidth(s, size, bold) <= maxPx) return s;
    while (s.length > 1 && textWidth(s + "\u2026", size, bold) > maxPx) s = s.slice(0, -1);
    return s.trimEnd() + "\u2026";
  }
  function monthLabel(iso) {
    var mm = Number(String(iso).slice(5, 7)), yy = String(iso).slice(0, 4);
    return mm >= 1 && mm <= 12 ? MONTHS[mm - 1] + " " + yy : "";
  }
  function langColor(name, i, p) {
    return LANG_COLORS[name] || (i % 2 ? p.a2 : p.a1);
  }

  /* ---------- the glass frame shared by every card ---------- */
  function defs(p, W, H) {
    var L = p.light;
    return "<defs>" +
      '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.bg1 + '"/><stop offset="1" stop-color="' + p.bg2 + '"/></linearGradient>' +
      '<radialGradient id="au1"><stop offset="0" stop-color="' + p.a1 + '" stop-opacity="' + (L ? 0.28 : 0.42) + '"/><stop offset="1" stop-color="' + p.a1 + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="au2"><stop offset="0" stop-color="' + p.a2 + '" stop-opacity="' + (L ? 0.26 : 0.4) + '"/><stop offset="1" stop-color="' + p.a2 + '" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (L ? "#ffffff" : p.ink) + '" stop-opacity="' + (L ? 0.95 : 0.42) + '"/><stop offset="0.45" stop-color="' + p.ink + '" stop-opacity="0.07"/><stop offset="1" stop-color="' + p.a2 + '" stop-opacity="' + (L ? 0.5 : 0.55) + '"/></linearGradient>' +
      '<linearGradient id="hl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="' + (L ? 0.95 : 0.6) + '"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="acc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + p.a1 + '"/><stop offset="1" stop-color="' + p.a2 + '"/></linearGradient>' +
      '<linearGradient id="accv" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + p.a2 + '"/><stop offset="1" stop-color="' + p.a1 + '"/></linearGradient>' +
      '<linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + p.a1 + '" stop-opacity="0.6"/><stop offset="1" stop-color="' + p.a1 + '" stop-opacity="0"/></linearGradient>' +
      '<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="' + p.ink + '" stroke-opacity="' + (L ? 0.05 : 0.04) + '"/></pattern>' +
      '<clipPath id="clip"><rect width="' + W + '" height="' + H + '" rx="' + RADIUS(p) + '"/></clipPath>' +
      "</defs>" + core.fxStyle(p, W);
  }

  function RADIUS(p) { return p.native ? 12 : 18; }

  function frame(W, H, label, p, body) {
    var R = Math.max(W, H);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(label) + '">' +
      defs(p, W, H) +
      '<g clip-path="url(#clip)">' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#bg)"/>' +
      // a native-surface card is the page itself (no grid, aurora or sheen); a themed one is a glass panel
      (p.native ? "" :
        '<rect width="' + W + '" height="' + H + '" fill="url(#grid)"/>' +
        "<g" + core.fx(p, "d1") + '><circle cx="' + (W * 0.92).toFixed(0) + '" cy="' + (-H * 0.18).toFixed(0) + '" r="' + (R * 0.6).toFixed(0) + '" fill="url(#au1)"/></g>' +
        "<g" + core.fx(p, "d2") + '><circle cx="' + (W * 0.04).toFixed(0) + '" cy="' + (H * 1.18).toFixed(0) + '" r="' + (R * 0.55).toFixed(0) + '" fill="url(#au2)"/></g>' +
        '<rect width="' + W + '" height="' + H + '" fill="' + p.ink + '" fill-opacity="0.035"/>' +
        '<rect x="28" y="0.6" width="' + (W - 56) + '" height="1.2" fill="url(#hl)"/>' +
        '<rect x="0" y="0.5" width="' + Math.round(W * 0.28) + '" height="1.6" fill="url(#hl)"' + core.fx(p, "shine") + "/>") +
      "</g>" +
      // a native-surface card gets GitHub's own 1px border, like the boxes around it; a themed one keeps its glass edge
      (p.native
        ? '<rect x="0.5" y="0.5" width="' + (W - 1) + '" height="' + (H - 1) + '" rx="' + (RADIUS(p) - 0.5) + '" fill="none" stroke="' + p.line + '"/>'
        : '<rect x="0.75" y="0.75" width="' + (W - 1.5) + '" height="' + (H - 1.5) + '" rx="17.5" fill="none" stroke="url(#edge)" stroke-width="1.5"/>') +
      "<g>" + body + "</g></svg>";
  }

  /** HUD-style header: glowing status dot, label, right-hand meta, fading rule. */
  function title(p, left, right, W) {
    var edge = (W || 420) - 28;
    return '<circle cx="32" cy="34" r="3.5" fill="' + p.a1 + '" filter="url(#glow)"' + core.fx(p, "pulse") + "/>" +
      '<text x="44" y="39" font-family="' + MONO + '" font-size="13" letter-spacing="3" font-weight="600" fill="' + p.a1 + '">' + esc(left) + "</text>" +
      (right ? '<text x="' + edge + '" y="39" text-anchor="end" font-family="' + MONO + '" font-size="11.5" letter-spacing="1.5" fill="' + p.ink + '" fill-opacity="0.5">' + esc(right) + "</text>" : "") +
      '<rect x="28" y="51" width="' + (edge - 28) + '" height="1" fill="url(#fade)"/>';
  }

  /* ---------- stats card ---------- */
  /** The six numbers shown on the stats card. */
  function statTiles(m) {
    var a = m.activity, items = [], extra = [];
    function add(list, label, v, raw) { if (v !== null && v !== undefined) list.push({ label: label, value: raw ? String(v) : fmt(v), zero: Number(v) === 0 }); }
    if (a) {
      if (a.total !== null && a.total !== undefined) add(items, "Contributions", a.total);
      add(items, "Commits", a.commits); add(items, "Pull requests", a.prs); add(items, "Issues", a.issues);
    }
    // profile tiles fill the remaining slots; ones with real numbers come first
    add(extra, "Stars earned", m.stars); add(extra, "Followers", m.followers); add(extra, "Repositories", m.publicRepos);
    add(extra, "Following", m.following); add(extra, "Forks", m.forks);
    if (m.since) add(extra, "Member since", m.since, true);
    extra = extra.filter(function (t) { return !t.zero; }).concat(extra.filter(function (t) { return t.zero; }));
    return items.concat(extra).slice(0, 6);
  }

  function statsCard(m, p) {
    var a = m.activity, items = statTiles(m);
    var sub = a ? (a.source === "graphql" ? "PAST YEAR" : "PUBLIC ACTIVITY") : "PROFILE";
    var body = title(p, "GITHUB STATS", sub);
    [154, 280].forEach(function (x) {
      body += '<rect x="' + x + '" y="72" width="1" height="128" fill="' + p.ink + '" fill-opacity="0.07"/>';
    });
    body += '<rect x="28" y="136" width="364" height="1" fill="' + p.ink + '" fill-opacity="0.05"/>';
    items.forEach(function (it, i) {
      var x = 28 + (i % 3) * 126 + (i % 3 ? 10 : 0), y = 106 + Math.floor(i / 3) * 70;
      body += '<text x="' + x + '" y="' + y + '" font-family="' + SANS + '" font-size="34" font-weight="700" letter-spacing="-0.5" fill="' + p.ink + '">' + esc(it.value) + "</text>";
      body += '<text x="' + x + '" y="' + (y + 22) + '" font-family="' + SANS + '" font-size="14" fill="' + p.ink + '" fill-opacity="0.62">' + esc(it.label) + "</text>";
    });
    return frame(420, 220, "GitHub stats for " + m.login, p, body);
  }

  /* ---------- streak card ---------- */
  function ring(p, cx, cy, r, frac) {
    var C = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + p.ink + '" fill-opacity="0.03" stroke="' + p.ink + '" stroke-opacity="0.09" stroke-width="6"/>' +
      (f > 0 ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="url(#acc)" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + (f * C).toFixed(1) + " " + C.toFixed(1) + '" transform="rotate(-90 ' + cx + " " + cy + ')" filter="url(#glow)"/>' : "");
  }

  function streakCard(m, p) {
    var a = m.activity;
    if (!a) return null;
    var win = a.windowDays >= 360 ? "PAST YEAR" : "LAST " + a.windowDays + " DAYS";
    var body = title(p, "CONTRIBUTION STREAK", win);
    var cols = [
      { v: a.current, label: "Current streak", frac: a.longest ? a.current / a.longest : 0 },
      { v: a.longest, label: "Longest streak", frac: a.longest ? 1 : 0 },
      { v: a.active, label: "Active days", frac: a.windowDays ? a.active / a.windowDays : 0 }
    ];
    cols.forEach(function (c, i) {
      var cx = (28 + 364 / 3 * (i + 0.5)).toFixed(1), cy = 102;
      body += ring(p, cx, cy, 30, c.frac);
      body += '<text x="' + cx + '" y="' + (cy + 9) + '" text-anchor="middle" font-family="' + SANS + '" font-size="26" font-weight="700" fill="' + p.ink + '">' + esc(fmt(c.v)) + "</text>";
      body += '<text x="' + cx + '" y="160" text-anchor="middle" font-family="' + SANS + '" font-size="14" fill="' + p.ink + '" fill-opacity="0.62">' + c.label + "</text>";
    });
    var weeks = a.weeks || [], n = weeks.length;
    if (n) {
      var max = Math.max.apply(null, weeks.concat([1])), gap = 3, bw = Math.min(12, (364 - gap * (n - 1)) / n);
      var total = n * bw + (n - 1) * gap, x0 = 28 + (364 - total) / 2, bars = "";
      weeks.forEach(function (w, i) {
        var h = w ? Math.max(4, w / max * 24) : 2;
        bars += '<rect x="' + (x0 + i * (bw + gap)).toFixed(1) + '" y="' + (204 - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" fill="' + (w ? "url(#accv)" : p.ink) + '" fill-opacity="' + (w ? 0.95 : 0.1) + '"/>';
      });
      body += '<g filter="url(#glow)">' + bars + "</g>";
    }
    return frame(420, 220, "Contribution streak for " + m.login, p, body);
  }

  /* ---------- contribution heatmap ---------- */
  /** Day-of-week columns like GitHub's own graph. Wide (a year) runs across the card; short windows get larger cells and a stats panel. */
  function heatmapCard(m, p) {
    var a = m.activity;
    if (!a || !a.daily || !a.daily.length) return null;
    var d = a.daily, n = d.length, W = 860;
    var startMs = Date.parse(a.start + "T00:00:00Z"), hasDates = !isNaN(startMs);
    var offset = hasDates ? new Date(startMs).getUTCDay() : 0, cols = Math.ceil((offset + n) / 7);
    var nz = d.filter(function (v) { return v > 0; }).sort(function (x, y) { return x - y; });
    function q(f) { return nz.length ? nz[Math.min(nz.length - 1, Math.floor(f * nz.length))] : 1; }
    var t1 = q(0.25), t2 = q(0.5), t3 = q(0.75);
    function level(v) { return v <= 0 ? 0 : v <= t1 ? 1 : v <= t2 ? 2 : v <= t3 ? 3 : 4; }
    var OPACITY = [0.075, 0.3, 0.5, 0.75, 1];

    var wide = cols > 30, gap = wide ? 3 : 4, x0 = 64, y0 = 86;
    var cell = wide ? Math.min(14, (W - 28 - x0 - (cols - 1) * gap) / cols) : 22;
    var gw = cols * (cell + gap) - gap, gh = 7 * (cell + gap) - gap;
    var win = n >= 360 ? "PAST YEAR" : "LAST " + n + " DAYS";
    var body = title(p, "ACTIVITY", win, W);

    // weekday labels and month labels
    ["Mon", "Wed", "Fri"].forEach(function (name, i) {
      var row = 1 + i * 2;
      body += '<text x="28" y="' + (y0 + row * (cell + gap) + cell * 0.78).toFixed(1) + '" font-family="' + MONO + '" font-size="11" fill="' + p.ink + '" fill-opacity="0.45">' + name + "</text>";
    });
    var lastMonth = -1, lastX = -100;
    for (var c = 0; c < cols && hasDates; c++) {
      var idx = Math.max(0, c * 7 - offset), mo = new Date(startMs + idx * DAYMS).getUTCMonth(), cx = x0 + c * (cell + gap);
      if (mo !== lastMonth && cx - lastX >= 38) {
        body += '<text x="' + cx.toFixed(1) + '" y="' + (y0 - 12) + '" font-family="' + MONO + '" font-size="11" fill="' + p.ink + '" fill-opacity="0.55">' + MONTHS[mo] + "</text>";
        lastX = cx;
      }
      lastMonth = mo;
    }

    // cells, one group per column so each column can fade in after the last
    var total = 0, best = -1, bestIdx = 0, columns = [];
    for (var i = 0; i < n; i++) {
      var col = Math.floor((offset + i) / 7), row = (offset + i) % 7, v = d[i];
      total += v;
      if (v > best) { best = v; bestIdx = i; }
      var lv = level(v);
      (columns[col] = columns[col] || []).push('<rect x="' + (x0 + col * (cell + gap)).toFixed(1) + '" y="' + (y0 + row * (cell + gap)).toFixed(1) + '" width="' + cell.toFixed(1) + '" height="' + cell.toFixed(1) + '" rx="' + (cell > 16 ? 5 : 2.5) + '" fill="' + (lv ? p.a1 : p.ink) + '" fill-opacity="' + OPACITY[lv] + '"/>');
    }
    columns.forEach(function (g, ci) { body += "<g>" + g.join("") + "</g>"; });

    // legend
    var legendY = y0 + gh + 26, lx = wide ? W - 28 - (5 * 18 + 76) : x0;
    body += '<text x="' + lx + '" y="' + (legendY + 1) + '" font-family="' + MONO + '" font-size="11" fill="' + p.ink + '" fill-opacity="0.5">Less</text>';
    for (var k = 0; k < 5; k++) body += '<rect x="' + (lx + 32 + k * 18) + '" y="' + (legendY - 10) + '" width="13" height="13" rx="3" fill="' + (k ? p.a1 : p.ink) + '" fill-opacity="' + OPACITY[k] + '"/>';
    body += '<text x="' + (lx + 32 + 5 * 18 + 4) + '" y="' + (legendY + 1) + '" font-family="' + MONO + '" font-size="11" fill="' + p.ink + '" fill-opacity="0.5">More</text>';

    // headline numbers
    var bestDate = hasDates ? new Date(startMs + bestIdx * DAYMS) : null;
    var bestLabel = bestDate ? MONTHS[bestDate.getUTCMonth()] + " " + bestDate.getUTCDate() : "";
    var stats = [
      { big: fmt(total), label: "Contributions" },
      { big: fmt(best), label: best > 0 && bestLabel ? "Best day · " + bestLabel : "Best day" },
      { big: (total / n).toFixed(1), label: "Daily average" }
    ];
    var H;
    if (wide) {
      var sy = legendY + 52;
      stats.forEach(function (st, i) {
        var sx = 28 + i * 268;
        body += '<text x="' + sx + '" y="' + sy + '" font-family="' + SANS + '" font-size="30" font-weight="700" letter-spacing="-0.5" fill="' + p.ink + '">' + esc(st.big) + "</text>";
        body += '<text x="' + sx + '" y="' + (sy + 22) + '" font-family="' + SANS + '" font-size="14" fill="' + p.ink + '" fill-opacity="0.62">' + esc(st.label) + "</text>";
        if (i) body += '<rect x="' + (sx - 14) + '" y="' + (sy - 30) + '" width="1" height="62" fill="' + p.ink + '" fill-opacity="0.08"/>';
      });
      H = sy + 44;
    } else {
      var px = x0 + gw + 70;
      stats.forEach(function (st, i) {
        var sy2 = y0 + 24 + i * 60;
        body += '<text x="' + px + '" y="' + sy2 + '" font-family="' + SANS + '" font-size="32" font-weight="700" letter-spacing="-0.5" fill="' + p.ink + '">' + esc(st.big) + "</text>";
        body += '<text x="' + px + '" y="' + (sy2 + 22) + '" font-family="' + SANS + '" font-size="14" fill="' + p.ink + '" fill-opacity="0.62">' + esc(st.label) + "</text>";
      });
      body += '<rect x="' + (px - 26) + '" y="' + (y0 - 4) + '" width="1" height="' + (gh + 8) + '" fill="' + p.ink + '" fill-opacity="0.08"/>';
      H = legendY + 28;
    }
    return frame(W, Math.round(H), "Contribution heatmap for " + m.login, p, body);
  }

  /* ---------- languages and tools card ---------- */
  function languagesCard(m, o, p) {
    var tools = core.toolList(m, o), langs = m.langs;
    if (!langs.length && !tools.length) return null;
    var W = 860, inner = W - 56, body = "", y;
    var total = m.langTotal || langs.reduce(function (n, l) { return n + l.n; }, 0) || 1;
    var shown = langs.reduce(function (n, l) { return n + l.n; }, 0);
    var items = langs.map(function (l, i) {
      return { name: l.name, frac: l.n / total, pct: l.pct, color: langColor(l.name, i, p) };
    });
    if (langs.length && total > shown) {
      var rest = (total - shown) / total;
      items.push({ name: "Other", frac: rest, pct: Math.max(1, Math.round(rest * 100)), color: "#8b949e" });
    }
    body += title(p, langs.length ? "LANGUAGES" : "TOOLS & TOPICS", langs.length ? "BY NUMBER OF REPOS" : "", W);
    y = 52;

    if (items.length && o.pie) {
      var d = donut(items, total, p, W);
      body += d.svg; y = d.end;
    } else if (items.length) {
      var barY = 76, x = 28, segs = "";
      items.forEach(function (it) {
        var w = it.frac * inner;
        segs += '<rect x="' + x.toFixed(1) + '" y="' + barY + '" width="' + w.toFixed(1) + '" height="12" fill="' + it.color + '" stroke="' + p.bg1 + '" stroke-width="2"/>';
        x += w;
      });
      body += '<defs><clipPath id="bar"><rect x="28" y="' + barY + '" width="' + inner + '" height="12" rx="6"/></clipPath>' +
        '<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.45"/><stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>';
      body += '<g filter="url(#glow)"><g clip-path="url(#bar)">' + segs + "</g></g>";
      body += '<rect x="28" y="' + barY + '" width="' + inner + '" height="12" rx="6" fill="url(#gloss)"/>';
      var colW = inner / 3, y0 = 128;
      items.forEach(function (it, i) {
        var cx = 28 + (i % 3) * colW, cy = y0 + Math.floor(i / 3) * 40;
        body += '<circle cx="' + (cx + 6) + '" cy="' + (cy - 6) + '" r="5.5" fill="' + it.color + '" filter="url(#glow)"/>';
        body += '<text x="' + (cx + 22) + '" y="' + cy + '" font-family="' + SANS + '" font-size="17" font-weight="600" fill="' + p.ink + '">' + esc(trunc(it.name, 18)) + "</text>";
        body += '<text x="' + (cx + colW - 24).toFixed(1) + '" y="' + cy + '" text-anchor="end" font-family="' + MONO + '" font-size="15" fill="' + p.ink + '" fill-opacity="0.62">' + it.pct + "%</text>";
      });
      y = y0 + (Math.ceil(items.length / 3) - 1) * 40 + 24;
    }

    if (tools.length) {
      if (items.length) {
        body += '<rect x="28" y="' + y + '" width="' + inner + '" height="1" fill="url(#fade)"/>';
        body += '<text x="28" y="' + (y + 30) + '" font-family="' + MONO + '" font-size="12" letter-spacing="2" fill="' + p.ink + '" fill-opacity="0.55">TOOLS &amp; TOPICS</text>';
        y += 46;
      } else y += 14;
      var px = 28;
      tools.forEach(function (t) {
        var label = trunc(t, 24), w = Math.round(label.length * 9.2 + 34);
        if (px + w > W - 28) { px = 28; y += 46; }
        body += '<rect x="' + px + '" y="' + y + '" width="' + w + '" height="36" rx="18" fill="' + p.ink + '" fill-opacity="0.06" stroke="' + p.ink + '" stroke-opacity="0.16"/>';
        body += '<rect x="' + (px + 16) + '" y="' + (y + 0.6) + '" width="' + (w - 32) + '" height="1" fill="url(#hl)"/>';
        body += '<text x="' + (px + w / 2) + '" y="' + (y + 23.5) + '" text-anchor="middle" font-family="' + SANS + '" font-size="16" fill="' + p.ink + '" fill-opacity="0.92">' + esc(label) + "</text>";
        px += w + 10;
      });
      y += 36;
    }
    return frame(W, y + 26, "Languages and tools for " + m.login, p, body);
  }

  /**
   * The "pie" option in card mode: a donut of repos by language with the total in the middle and a legend beside it,
   * drawn like the rest of the card instead of GitHub's default Mermaid pie. Returns its markup and the y where it ends.
   */
  function donut(items, total, p, W) {
    var cx = 104, cy = 142, r = 54, sw = 16, C = 2 * Math.PI * r, gap = items.length > 1 ? 3 : 0, at = 0, out = "";
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + p.ink + '" stroke-opacity="0.07" stroke-width="' + sw + '"/>';
    items.forEach(function (it) {
      var len = Math.max(0.5, it.frac * C - gap);
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + it.color + '" stroke-width="' + sw + '" stroke-dasharray="' + len.toFixed(1) + " " + C.toFixed(1) + '" stroke-dashoffset="' + (-at).toFixed(1) + '" transform="rotate(-90 ' + cx + " " + cy + ')"/>';
      at += it.frac * C;
    });
    out = '<g filter="url(#glow)">' + out + "</g>";
    out += '<text x="' + cx + '" y="' + (cy + 6) + '" text-anchor="middle" font-family="' + SANS + '" font-size="28" font-weight="700" fill="' + p.ink + '">' + esc(fmt(total)) + "</text>";
    out += '<text x="' + cx + '" y="' + (cy + 26) + '" text-anchor="middle" font-family="' + MONO + '" font-size="11" letter-spacing="1.5" fill="' + p.ink + '" fill-opacity="0.55">' + (total === 1 ? "REPO" : "REPOS") + "</text>";
    // legend: one row per language, two columns when it gets long, each row with a thin share bar
    var lx = 210, cols = items.length > 5 ? 2 : 1, colW = (W - 28 - lx) / cols, rows = Math.ceil(items.length / cols);
    var rowH = 38, top = cy - Math.min(rows, 5) * rowH / 2 + 12;
    items.forEach(function (it, i) {
      var x = lx + Math.floor(i / rows) * colW, yy = top + (i % rows) * rowH, bw = colW - 40;
      out += '<circle cx="' + (x + 6) + '" cy="' + (yy - 5) + '" r="5" fill="' + it.color + '"/>';
      out += '<text x="' + (x + 20) + '" y="' + yy + '" font-family="' + SANS + '" font-size="16" font-weight="600" fill="' + p.ink + '">' + esc(trunc(it.name, cols > 1 ? 18 : 30)) + "</text>";
      out += '<text x="' + (x + 20 + bw) + '" y="' + yy + '" text-anchor="end" font-family="' + MONO + '" font-size="14" fill="' + p.ink + '" fill-opacity="0.62">' + it.pct + "%</text>";
      out += '<rect x="' + (x + 20) + '" y="' + (yy + 9) + '" width="' + bw + '" height="3" rx="1.5" fill="' + p.ink + '" fill-opacity="0.08"/>';
      out += '<rect x="' + (x + 20) + '" y="' + (yy + 9) + '" width="' + Math.max(3, it.frac * bw).toFixed(1) + '" height="3" rx="1.5" fill="' + it.color + '"/>';
    });
    return { svg: out, end: Math.max(cy + r + sw / 2, top + (rows - 1) * rowH + 12) + 26 };
  }

  /** The 3D contribution universe (universe.js), fed from the same model as the other cards: no extra token or request. */
  function universeCard(m, o, p) {
    var a = m.activity;
    var repos = m.all.slice().sort(function (x, y) { return y.stars - x.stars; }).map(function (r) {
      return { name: r.name, stars: r.stars || 0 };
    });
    // the contribution mix uses the same totals as the stats card: the past year with a token, public all-time search totals without
    return universe.buildUniverse({
      name: m.name || m.login, login: m.login, weeks: universe.toWeeks(a.daily, a.start), repos: repos,
      mix: { commits: a.commits, pullRequests: a.prs, issues: a.issues, reviews: a.reviews },
      mixSpan: a.source === "graphql" ? "last 12 months" : "all time"
    }, p, { animate: p.anim, style: o.universeStyle });
  }

  /* ---------- timeline card ---------- */
  function timelineCard(m, p) {
    var repos = m.all.filter(function (r) { return r.created; })
      .sort(function (a, b) { return a.created < b.created ? -1 : 1; }).slice(-8);
    if (!repos.length) return null;
    var nodes = [];
    if (m.since) nodes.push({ joined: true, name: "Joined GitHub", sub: String(m.since), color: p.a1 });
    repos.forEach(function (r) {
      nodes.push({ name: r.name, sub: monthLabel(r.created), color: r.lang ? (LANG_COLORS[r.lang] || p.a2) : p.a2 });
    });
    var W = 860, cy = 162, left = 100, right = W - 100;
    var y1 = String(nodes[0].sub).slice(-4), y2 = String(nodes[nodes.length - 1].sub).slice(-4);
    var body = title(p, "TIMELINE", y1 === y2 ? y1 : y1 + " – " + y2, W);
    var single = nodes.length === 1, step = single ? 0 : (right - left) / (nodes.length - 1);
    var lx1 = single ? W / 2 - 60 : left, lx2 = single ? W / 2 + 60 : right;
    body += '<line x1="' + (lx1 - 24) + '" y1="' + cy + '" x2="' + (lx2 + 24) + '" y2="' + cy + '" stroke="' + p.ink + '" stroke-opacity="0.08" stroke-width="6" stroke-linecap="round"/>';
    // userSpaceOnUse: a gradient on a perfectly horizontal line has a zero-height bounding box and would not render
    body += '<defs><linearGradient id="tl" gradientUnits="userSpaceOnUse" x1="' + lx1 + '" y1="' + cy + '" x2="' + lx2 + '" y2="' + cy + '"><stop offset="0" stop-color="' + p.a1 + '"/><stop offset="1" stop-color="' + p.a2 + '"/></linearGradient></defs>';
    // filters also use the bounding box, so the glow is built from a wide soft line instead
    body += '<line x1="' + lx1 + '" y1="' + cy + '" x2="' + lx2 + '" y2="' + cy + '" stroke="url(#tl)" stroke-opacity="0.28" stroke-width="9" stroke-linecap="round"/>';
    body += '<line x1="' + lx1 + '" y1="' + cy + '" x2="' + lx2 + '" y2="' + cy + '" stroke="url(#tl)" stroke-width="2.5" stroke-linecap="round"/>';
    nodes.forEach(function (n, i) {
      var x = (single ? W / 2 : left + i * step).toFixed(1), above = i % 2 === 0;
      var sy1 = above ? cy - 34 : cy + 13, sy2 = above ? cy - 13 : cy + 34;
      body += '<line x1="' + x + '" y1="' + sy1 + '" x2="' + x + '" y2="' + sy2 + '" stroke="' + n.color + '" stroke-opacity="0.45" stroke-dasharray="2 3"/>';
      body += '<circle cx="' + x + '" cy="' + cy + '" r="' + (n.joined ? 16 : 13) + '" fill="' + n.color + '" fill-opacity="0.16"/>';
      body += '<circle cx="' + x + '" cy="' + cy + '" r="' + (n.joined ? 8 : 6) + '" fill="' + n.color + '" stroke="' + p.bg1 + '" stroke-width="2.5" filter="url(#glow)"/>';
      if (n.joined) body += '<circle cx="' + x + '" cy="' + cy + '" r="2.8" fill="' + p.bg1 + '"/>';
      var ny = above ? cy - 64 : cy + 58, sy = above ? cy - 43 : cy + 79;
      body += '<text x="' + x + '" y="' + ny + '" text-anchor="middle" font-family="' + SANS + '" font-size="16" font-weight="700" fill="' + p.ink + '">' + esc(fitText(n.name, 16, 138, true)) + "</text>";
      body += '<text x="' + x + '" y="' + sy + '" text-anchor="middle" font-family="' + MONO + '" font-size="13" fill="' + p.ink + '" fill-opacity="0.6">' + esc(n.sub) + "</text>";
    });
    return frame(W, cy + 79 + 28, "Timeline of repositories created by " + m.login, p, body);
  }

  /** A mask that is fully visible and then fades out over its last stretch, so over-long text fades away instead of colliding. */
  function fadeMask(id, x, width, H) {
    return '<defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="0.88" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>' +
      '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="' + x + '" y="0" width="' + width + '" height="' + Math.ceil(H) + '"><rect x="' + x + '" y="0" width="' + width + '" height="' + Math.ceil(H) + '" fill="url(#' + id + 'g)"/></mask></defs>';
  }

  /* ---------- changelog card ---------- */
  var CHANGELOG_PER_YEAR = 3;

  function dateLabel(iso) {
    var mm = Number(String(iso).slice(5, 7)), dd = Number(String(iso).slice(8, 10)), yy = String(iso).slice(0, 4);
    return mm >= 1 && mm <= 12 && dd ? MONTHS[mm - 1] + " " + dd + ", " + yy : monthLabel(iso);
  }

  /** Release notes as a card: a rail of glowing year markers, and one "ADDED" row per repo under each year. */
  function changelogCard(m, p) {
    var years = core.changelogData(m);
    if (!years.length) return null;
    var W = 860, cursor = 84, firstDot = null, lastDot = 0, blocks = "";
    years.forEach(function (yr) {
      var dotY = cursor;
      if (firstDot === null) firstDot = dotY;
      lastDot = dotY;
      blocks += "<g>" +
        '<circle cx="44" cy="' + dotY + '" r="12" fill="' + p.a1 + '" fill-opacity="0.16"/>' +
        '<circle cx="44" cy="' + dotY + '" r="6.5" fill="' + p.a1 + '" stroke="' + p.bg1 + '" stroke-width="2.5" filter="url(#glow)"/>' +
        '<text x="72" y="' + (dotY + 8) + '" font-family="' + SANS + '" font-size="25" font-weight="700" letter-spacing="-0.5" fill="' + p.ink + '">' + esc(yr.year) + "</text>" +
        '<text x="832" y="' + (dotY + 6) + '" text-anchor="end" font-family="' + MONO + '" font-size="12.5" letter-spacing="1" fill="' + p.ink + '" fill-opacity="0.5">' + yr.entries.length + (yr.entries.length === 1 ? " REPO" : " REPOS") + "</text></g>";
      cursor += 40;
      yr.entries.slice(0, CHANGELOG_PER_YEAR).forEach(function (r) {
        var cy = cursor, name = trunc(r.name, 48);
        var desc = trunc(r.desc || (r.topics && r.topics.length ? r.topics.join(" · ") : ""), 160);
        blocks += "<g>" +
          '<rect x="72" y="' + (cy - 11) + '" width="62" height="22" rx="11" fill="' + p.a1 + '" fill-opacity="0.12" stroke="' + p.a1 + '" stroke-opacity="0.5"/>' +
          '<text x="103" y="' + (cy + 4) + '" text-anchor="middle" font-family="' + MONO + '" font-size="10.5" font-weight="700" letter-spacing="1.4" fill="' + p.a1 + '">ADDED</text>' +
          (r.lang ? '<circle cx="152" cy="' + cy + '" r="4.5" fill="' + (LANG_COLORS[r.lang] || p.a2) + '" filter="url(#glow)"/>' : "") +
          // one text element, so the description always starts after the name whatever font the viewer has; the mask fades overflow before the stars
          '<g mask="url(#cmask)"><text x="166" y="' + (cy + 5) + '" font-family="' + SANS + '" font-size="16"><tspan font-weight="700" fill="' + p.ink + '">' + esc(name) + "</tspan>" +
          (desc ? '<tspan dx="16" font-size="14" fill="' + p.ink + '" fill-opacity="0.62">' + esc(desc) + "</tspan>" : "") + "</text></g>" +
          (r.stars ? '<text x="832" y="' + (cy + 5) + '" text-anchor="end" font-family="' + MONO + '" font-size="14" fill="' + p.ink + '" fill-opacity="0.62">\u2605 ' + esc(fmt(r.stars)) + "</text>" : "") +
          "</g>";
        cursor += 34;
      });
      var more = yr.entries.length - CHANGELOG_PER_YEAR;
      if (more > 0) {
        blocks += '<g><text x="166" y="' + (cursor + 4) + '" font-family="' + MONO + '" font-size="13" fill="' + p.ink + '" fill-opacity="0.5">+' + more + " more</text></g>";
        cursor += 30;
      }
      cursor += 20;
    });
    var H = cursor + 4, body = title(p, "CHANGELOG", "NEWEST FIRST", W);
    body += fadeMask("cmask", 160, 588, H);
    // the rail: a faint dashed run to the bottom, and a glowing line between the year markers (userSpaceOnUse, since a vertical line has no width for a gradient to use)
    body += '<line x1="44" y1="' + firstDot + '" x2="44" y2="' + (H - 18) + '" stroke="' + p.ink + '" stroke-opacity="0.14" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>';
    if (lastDot > firstDot) {
      body += '<defs><linearGradient id="rail" gradientUnits="userSpaceOnUse" x1="44" y1="' + firstDot + '" x2="44" y2="' + lastDot + '"><stop offset="0" stop-color="' + p.a1 + '"/><stop offset="1" stop-color="' + p.a2 + '"/></linearGradient></defs>';
      body += '<line x1="44" y1="' + firstDot + '" x2="44" y2="' + lastDot + '" stroke="url(#rail)" stroke-opacity="0.28" stroke-width="9" stroke-linecap="round"/>';
      body += '<line x1="44" y1="' + firstDot + '" x2="44" y2="' + lastDot + '" stroke="url(#rail)" stroke-width="2.5" stroke-linecap="round"/>';
    }
    return frame(W, H, "Changelog of repositories created by " + m.login, p, body + blocks);
  }

  /* ---------- recently pushed card ---------- */
  function recentCard(m, p) {
    var repos = (m.recent || []).slice(0, 5);
    if (!repos.length) return null;
    var W = 860, y0 = 86, step = 50, body = title(p, "RECENTLY PUSHED", "LATEST " + repos.length, W);
    repos.forEach(function (r, i) {
      var cy = y0 + i * step + 18, first = i === 0;
      body += "<g>";
      if (first) body += '<circle cx="44" cy="' + cy + '" r="12" fill="' + p.a1 + '" fill-opacity="0.18"' + core.fx(p, "pulse") + "/>";
      body += '<circle cx="44" cy="' + cy + '" r="' + (first ? 6.5 : 4.5) + '" fill="' + (first ? p.a1 : p.ink) + '" fill-opacity="' + (first ? 1 : 0.3) + '"' + (first ? ' stroke="' + p.bg1 + '" stroke-width="2.5" filter="url(#glow)"' : "") + "/>";
      body += '<g mask="url(#rmask)"><text x="72" y="' + (cy + 6) + '" font-family="' + SANS + '" font-size="18" font-weight="700" fill="' + p.ink + '">' + esc(trunc(r.name, 60)) + "</text></g>";
      if (r.lang) {
        body += '<circle cx="470" cy="' + cy + '" r="5" fill="' + (LANG_COLORS[r.lang] || p.a2) + '" filter="url(#glow)"/>';
        body += '<text x="484" y="' + (cy + 5) + '" font-family="' + SANS + '" font-size="14" fill="' + p.ink + '" fill-opacity="0.8">' + esc(trunc(r.lang, 14)) + "</text>";
      }
      body += '<text x="832" y="' + (cy + 5) + '" text-anchor="end" font-family="' + MONO + '" font-size="14" fill="' + p.ink + '" fill-opacity="0.62">' + esc(dateLabel(r.pushed)) + "</text>";
      if (i < repos.length - 1) body += '<rect x="72" y="' + (cy + 25) + '" width="760" height="1" fill="' + p.ink + '" fill-opacity="0.07"/>';
      body += "</g>";
    });
    var Hr = y0 + repos.length * step + 8;
    return frame(W, Hr, "Recently pushed repositories of " + m.login, p, fadeMask("rmask", 60, 392, Hr) + body);
  }

  /* ---------- project card ---------- */
  function projectCard(m, r, p) {
    var body = fadeMask("pname", 28, 322, 156) + fadeMask("pdesc", 28, 364, 156);
    body += '<g mask="url(#pname)"><text x="28" y="44" font-family="' + SANS + '" font-size="21" font-weight="700" letter-spacing="-0.2" fill="' + p.ink + '">' + esc(trunc(r.name, 40)) + "</text></g>";
    body += '<path d="M372 38L386 24M377 24H386V33" fill="none" stroke="' + p.a1 + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>';
    var desc = r.desc || (r.topics && r.topics.length ? r.topics.join(" · ") : "No description yet");
    var muted = r.desc ? 0.78 : 0.48;
    wrap(desc, 46, 2).forEach(function (line, i) {
      body += '<g mask="url(#pdesc)"><text x="28" y="' + (74 + i * 22) + '" font-family="' + SANS + '" font-size="15" fill="' + p.ink + '" fill-opacity="' + muted + '">' + esc(line) + "</text></g>";
    });
    body += '<rect x="28" y="110" width="364" height="1" fill="url(#fade)"/>';
    var yb = 136;
    if (r.lang) {
      body += '<circle cx="34" cy="' + (yb - 5) + '" r="5" fill="' + (LANG_COLORS[r.lang] || p.a2) + '" filter="url(#glow)"/>';
      body += '<text x="47" y="' + yb + '" font-family="' + SANS + '" font-size="14" fill="' + p.ink + '" fill-opacity="0.85">' + esc(trunc(r.lang, 14)) + "</text>";
    }
    // footer: shorten when it would run into the language label (drop "Updated", then forks)
    var upd = monthLabel(r.pushed), langEnd = r.lang ? 47 + trunc(r.lang, 14).length * 8 : 28;
    function metaFor(withForks, longDate) {
      var parts = [];
      if (r.stars) parts.push("★ " + fmt(r.stars));
      if (withForks && r.forks) parts.push(fmt(r.forks) + (r.forks === 1 ? " fork" : " forks"));
      if (upd) parts.push((longDate ? "Updated " : "") + upd);
      return parts;
    }
    var meta = metaFor(true, true);
    [[true, false], [false, false]].forEach(function (v) {
      if (392 - meta.join(" · ").length * 7.4 < langEnd + 16) meta = metaFor(v[0], v[1]);
    });
    if (meta.length) body += '<text x="392" y="' + yb + '" text-anchor="end" font-family="' + SANS + '" font-size="14" fill="' + p.ink + '" fill-opacity="0.62">' + esc(meta.join(" · ")) + "</text>";
    return frame(420, 156, r.name, p, body);
  }

  /* ---------- connect buttons ---------- */
  function glyph(key, color) {
    var st = 'fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    switch (key) {
      case "github":
        return '<circle cx="38" cy="30" r="3" ' + st + '/><circle cx="38" cy="46" r="3" ' + st + '/><circle cx="51" cy="34" r="3" ' + st + '/>' +
          '<path d="M38 33V43M51 37C51 42 38 40 38 43" ' + st + "/>";
      case "linkedin":
        return '<text x="44" y="45" text-anchor="middle" font-family="' + SANS + '" font-size="19" font-weight="800" fill="' + color + '">in</text>';
      case "website":
        return '<circle cx="44" cy="38" r="10" ' + st + '/><ellipse cx="44" cy="38" rx="4.5" ry="10" ' + st + '/><path d="M34 38H54" ' + st + "/>";
      case "x":
        return '<path d="M37 31L51 45M51 31L37 45" ' + st + "/>";
      default:
        return '<rect x="35" y="31" width="18" height="14" rx="2.5" ' + st + '/><path d="M35.5 32L44 40L52.5 32" ' + st + "/>";
    }
  }

  function connectCard(m, it, p) {
    var body = '<g transform="translate(0 6)"><circle cx="44" cy="38" r="24" fill="' + p.ink + '" fill-opacity="0.06" stroke="url(#acc)" stroke-width="1.5"/>' +
      '<g filter="url(#glow)">' + glyph(it.key, p.a1) + "</g></g>";
    body += '<text x="84" y="40" font-family="' + SANS + '" font-size="19" font-weight="700" fill="' + p.ink + '">' + esc(it.label) + "</text>";
    body += '<text x="84" y="64" font-family="' + MONO + '" font-size="14" fill="' + p.ink + '" fill-opacity="0.62">' + esc(trunc(it.handle, 16)) + "</text>";
    body += '<path d="M236 44H250M244 37L251 44L244 51" fill="none" stroke="' + p.ink + '" stroke-opacity="0.6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
    return frame(270, 88, it.label + " for " + m.login, p, body);
  }

  /* ---------- social share image (1280 x 640) ---------- */
  var SOCIAL_PREFERENCE = ["Commits", "Pull requests", "Stars earned", "Followers", "Contributions", "Repositories", "Issues", "Forks", "Following", "Member since"];

  /**
   * A wide image for sharing the profile on LinkedIn, X or as a repository social preview.
   * Always still (no animation), since it is meant to be saved as a picture. Not used in the README.
   */
  function socialCard(m, o) {
    var p = core.paletteFor(m.login, o);
    p.anim = false;
    var W = 1280, H = 640, sub = core.subtitle(m, o), body = "";
    var meta = [];
    if (m.location) meta.push(m.location.toUpperCase().slice(0, 22));
    if (m.since) meta.push("SINCE " + m.since);
    body += title(p, "@" + m.login.toUpperCase(), meta.join(" · "), W);
    body += '<defs><linearGradient id="nm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + p.ink + '"/><stop offset="0.62" stop-color="' + p.ink + '"/><stop offset="1" stop-color="' + p.a1 + '"/></linearGradient></defs>';

    // the orbit from the banner, as a quiet decoration on the right
    var ox = 1050, oy = 196, i;
    [70, 112, 154].forEach(function (R, k) {
      body += '<circle cx="' + ox + '" cy="' + oy + '" r="' + R + '" fill="none" stroke="' + p.ink + '" stroke-opacity="' + (0.13 - k * 0.03).toFixed(2) + '"' + (k === 1 ? ' stroke-dasharray="2 7"' : "") + "/>";
    });
    var C = 2 * Math.PI * 112;
    body += '<circle cx="' + ox + '" cy="' + oy + '" r="112" fill="none" stroke="url(#acc)" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + (C * 0.3).toFixed(1) + " " + C.toFixed(1) + '" transform="rotate(-35 ' + ox + " " + oy + ')" filter="url(#glow)"/>';
    body += '<circle cx="' + ox + '" cy="' + oy + '" r="54" fill="' + p.bg1 + '" fill-opacity="0.6" stroke="url(#acc)" stroke-width="1.5"/>';
    body += '<text x="' + ox + '" y="' + (oy + 13) + '" text-anchor="middle" font-family="' + SANS + '" font-size="38" font-weight="800" fill="url(#acc)">' + esc(core.initials(m)) + "</text>";

    // name, designation, tagline, skills
    // the text must stay clear of the orbit, so it gets about 830px: shrink the type to fit, and only then shorten
    var name = m.name.length > 26 ? m.name.slice(0, 25) + "…" : m.name;
    var nameSize = Math.max(52, Math.min(92, Math.floor(830 / (name.length * 0.6))));
    body += '<text x="64" y="176" font-family="' + SANS + '" font-size="' + nameSize + '" font-weight="800" letter-spacing="-2" fill="url(#nm)">' + esc(name) + "</text>";
    var main = sub.main.length > 42 ? sub.main.slice(0, 41) + "…" : sub.main;
    if (main) body += '<text x="66" y="232" font-family="' + SANS + '" font-size="38" font-weight="500" fill="' + p.ink + '" fill-opacity="0.9">' + esc(main) + "</text>";
    var extra = sub.extra.length > 62 ? sub.extra.slice(0, 61) + "…" : sub.extra;
    if (extra) body += '<text x="66" y="272" font-family="' + SANS + '" font-size="25" fill="' + p.ink + '" fill-opacity="0.58">' + esc(extra) + "</text>";
    var cx = 66, cy = extra ? 304 : 270;
    core.chipNames(m, o).slice(0, 5).forEach(function (label) {
      var w = Math.round(label.length * 12.4 + 44);
      if (cx + w > 760) return;
      body += '<rect x="' + cx + '" y="' + cy + '" width="' + w + '" height="44" rx="22" fill="' + p.ink + '" fill-opacity="0.07" stroke="' + p.ink + '" stroke-opacity="0.22"/>';
      body += '<text x="' + (cx + w / 2) + '" y="' + (cy + 29) + '" text-anchor="middle" font-family="' + SANS + '" font-size="20" font-weight="500" fill="' + p.ink + '" fill-opacity="0.94">' + esc(label) + "</text>";
      cx += w + 12;
    });

    // four headline numbers
    var tiles = statTiles(m), picked = [];
    SOCIAL_PREFERENCE.forEach(function (label) {
      var t = tiles.filter(function (x) { return x.label === label; })[0];
      if (t && picked.length < 4) picked.push(t);
    });
    tiles.forEach(function (t) { if (picked.length < 4 && picked.indexOf(t) === -1) picked.push(t); });
    picked.forEach(function (t, k) {
      var x = 64 + k * 294, y = 424;
      body += '<rect x="' + x + '" y="' + y + '" width="272" height="150" rx="20" fill="' + p.ink + '" fill-opacity="0.06" stroke="' + p.ink + '" stroke-opacity="0.16"/>';
      body += '<rect x="' + (x + 24) + '" y="' + (y + 0.6) + '" width="224" height="1" fill="url(#hl)"/>';
      body += '<text x="' + (x + 28) + '" y="' + (y + 80) + '" font-family="' + SANS + '" font-size="58" font-weight="700" letter-spacing="-1" fill="' + p.ink + '">' + esc(t.value) + "</text>";
      body += '<text x="' + (x + 28) + '" y="' + (y + 118) + '" font-family="' + SANS + '" font-size="21" fill="' + p.ink + '" fill-opacity="0.62">' + esc(t.label) + "</text>";
      body += '<rect x="' + (x + 28) + '" y="' + (y + 132) + '" width="44" height="3" rx="1.5" fill="url(#acc)"/>';
    });
    return frame(W, H, "Share image for " + m.login, p, body);
  }

  /** Extra files for sharing. They are not used by the README, so they are kept out of the zip and the publish commit. */
  function buildExtras(m, options) {
    var o = {}, k;
    for (k in core.DEFAULTS) o[k] = core.DEFAULTS[k];
    for (k in (options || {})) if (options[k] !== undefined) o[k] = options[k];
    return [{ name: "share-image.svg", data: socialCard(m, o) }];
  }

  /** All card files for a model. Names match the paths the README references. */
  function buildCards(m, options) {
    var o = {}, k;
    for (k in core.DEFAULTS) o[k] = core.DEFAULTS[k];
    for (k in (options || {})) if (options[k] !== undefined) o[k] = options[k];
    if (!o.cards) return [];
    var p = core.paletteFor(m.login, o);
    p.anim = o.animate !== false;
    var files = [{ name: "cards/stats.svg", data: statsCard(m, p) }];
    var streak = streakCard(m, p);
    if (streak) files.push({ name: "cards/streak.svg", data: streak });
    if (o.heatmap) {
      var heat = heatmapCard(m, p);
      if (heat) files.push({ name: "cards/activity.svg", data: heat });
    }
    if (o.timeline) {
      var tl = timelineCard(m, p);
      if (tl) files.push({ name: "cards/timeline.svg", data: tl });
    }
    if (core.wantsChangelog(m, o)) files.push({ name: "cards/changelog.svg", data: changelogCard(m, p) });
    if (core.wantsRecent(m, o)) files.push({ name: "cards/recent.svg", data: recentCard(m, p) });
    var lang = languagesCard(m, o, p);
    if (lang) files.push({ name: "cards/languages.svg", data: lang });
    if (o.proj && o.style !== "changelog") {
      core.pickProjects(m, o).forEach(function (r, i) {
        files.push({ name: "cards/project-" + (i + 1) + ".svg", data: projectCard(m, r, p) });
      });
    }
    if (core.wantsUniverse(m, o)) files.push({ name: "cards/universe.svg", data: universeCard(m, o, p) });
    if (o.wave) files.push({ name: "cards/footer.svg", data: core.buildWaveFooter(m, o) });
    if (o.links) {
      core.connectItems(m, o).forEach(function (it) {
        files.push({ name: "cards/connect-" + it.key + ".svg", data: connectCard(m, it, p) });
      });
    }
    // the light half of an adaptive README keeps the same names with a "-light" suffix
    if (o.suffix) files.forEach(function (f) { f.name = f.name.replace(/\.svg$/, o.suffix + ".svg"); });
    return files;
  }

  /**
   * Every file a profile needs: README.md, the banner and the cards.
   * In adaptive mode there are two complete sets (dark, and "-light"), and the README uses <picture> to choose.
   */
  function buildFiles(m, options) {
    var o = {}, k;
    for (k in core.DEFAULTS) o[k] = core.DEFAULTS[k];
    for (k in (options || {})) if (options[k] !== undefined) o[k] = options[k];
    var files = [{ name: "README.md", data: core.buildReadme(m, o) }];
    var variants = o.adaptive ? [{ suffix: "", mode: "dark" }, { suffix: "-light", mode: "light" }] : [{ suffix: "", mode: "" }];
    variants.forEach(function (v) {
      var oo = {};
      for (var key in o) oo[key] = o[key];
      oo.mode = v.mode; oo.suffix = v.suffix; oo.native = !!v.mode;   // each half is shown only on its matching GitHub page
      if (o.banner) files.push({ name: "banner" + v.suffix + ".svg", data: core.buildBanner(m, oo) });
      Array.prototype.push.apply(files, buildCards(m, oo));
    });
    return files;
  }

  return { buildCards: buildCards, buildFiles: buildFiles, buildExtras: buildExtras, wrap: wrap, fmt: fmt };
});
