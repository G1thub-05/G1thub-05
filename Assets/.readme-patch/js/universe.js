/*
 * universe.js: the contribution "universe" card: the year as a 3D pie of month wedges round a glowing core, the top
 * repos orbiting it as planets, and a small upright pie of the contribution mix.
 * Ported from Git3D Universe v2.0.0 (MIT, Copyright (c) 2026 Sandeep Komal Pothu; repository SandeepKomal/Git3D-Universe)
 * and reworked to fit this project:
 *  - two colour styles: "neon" (the option's original name) is Git3D's own cosmic palettes (aurora at night, daylight
 *    by day), "theme" derives every colour from the profile's theme so the universe follows the chosen template;
 *  - all motion is CSS (orbits, the near/far layer swap, the planets swelling as they come closer, far-side names hiding
 *    while they would cross the pie), so a still picture and prefers-reduced-motion show the same scene, and the
 *    animated file only adds classes and keyframes;
 *  - the data comes from the same model as every other card (no extra token or workflow), a shorter window simply has
 *    fewer, wider wedges, and there is no date stamp so a quiet day changes nothing.
 * ReadmeUniverse.buildUniverse({ name, login, weeks: [[{ date, count }]], repos: [{ name, stars }],
 *   mix: { commits, pullRequests, issues, reviews }, mixSpan }, palette, { animate, style })
 */
(function (root, factory) {
  var core = (typeof module === "object" && module.exports) ? require("./core.js") : root.ReadmeCore;
  var api = factory(core);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ReadmeUniverse = api;
})(typeof self !== "undefined" ? self : this, function (core) {
  "use strict";

  // The year is the hero: a pie seen from above the front, so it reads clockwise like a clock face. The planets circle
  // its centre, the contribution mix stands in the top-left corner and the legend in the bottom-right one.
  var W = 1280, H = 760, OCX = 704, OCY = 430, PITCH = 30;
  var RINGS = [372, 438, 504], FLAT = 0.24;
  var PIE = { R: 236, r: 92, base: 22, depth: 16, maxH: 175, minH: 10 };
  var SANS = "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Inter,Helvetica,Arial,sans-serif";
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var mix = core.mixHex;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]; });
  }
  function r1(n) { return Math.round(n * 10) / 10; }

  /** Brightens (k > 1) or darkens (k < 1) a colour, for lit and shaded faces. */
  function shade(hex, k) {
    var ch = [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); });
    return "#" + ch.map(function (v) {
      var o = k >= 1 ? v + (255 - v) * (k - 1) : v * k;
      return ("0" + Math.max(0, Math.min(255, Math.round(o))).toString(16)).slice(-2);
    }).join("");
  }
  /** Colour at f (0..1) along a list of stops. */
  function along(stops, f) {
    var x = Math.max(0, Math.min(1, f)) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x));
    return mix(stops[i], stops[i + 1], x - i);
  }

  /* ---------- colours ---------- */
  // Git3D Universe's cosmic palettes, as released in v2.0.0: deep space at night, a soft dawn sky by day, one colour
  // wheel for the months in both, and four contribution-mix colours checked for colour-blind separation.
  var COSMIC = {
    dark: {
      dark: true, bgInner: "#0b1530", bgMid: "#060b1d", bgOuter: "#02040b",
      ink: "#eef4ff", mute: "#9fb0cf", rule: "#1d2a48", glow: "#5eead4", nebulaA: "#6d4bd8", nebulaB: "#0e9fb0",
      shadow: "#000000", borderA: "#5eead4", borderB: "#a78bfa", ring: "#7dd3fc", ringHi: "#e0f2fe",
      planets: ["#5eead4", "#f9a8d4", "#7dd3fc", "#fcd34d", "#c4b5fd", "#86efac", "#fdba74"],
      wheel: ["#14d3b9", "#22b4f5", "#5b6cf9", "#a24bf7", "#ee4fa8", "#f9ad1a"],
      emptyWedge: "#1b2747", discTop: "#101a36", discSide: "#0a1128", discEdge: "#3b5a9a", core: "#fde68a", peak: "#fbbf24",
      mix: ["#10a893", "#9446ec", "#c8850c", "#db3f96"], mixTrack: "#1a2646", stars: true
    },
    light: {
      dark: false, bgInner: "#ffffff", bgMid: "#f3f6fd", bgOuter: "#e7ecf8",
      ink: "#13203d", mute: "#5b6b8c", rule: "#e2e8f5", glow: "#0d9488", nebulaA: "#ede9fe", nebulaB: "#ccfbf1",
      shadow: "#7d8bb0", borderA: "#99f6e4", borderB: "#ddd6fe", ring: "#38bdf8", ringHi: "#ffffff",
      planets: ["#14b8a6", "#ec4899", "#0ea5e9", "#f59e0b", "#8b5cf6", "#22c55e", "#f97316"],
      wheel: ["#14b8a6", "#0ea5e9", "#6366f1", "#a855f7", "#ec4899", "#f59e0b"],
      emptyWedge: "#dde3f1", discTop: "#ffffff", discSide: "#dfe5f3", discEdge: "#b7c3e0", core: "#fbbf24", peak: "#f59e0b",
      mix: ["#10a893", "#9446ec", "#c8850c", "#db3f96"], mixTrack: "#e6ebf5", stars: false
    }
  };

  /** The same colour tokens, derived from the profile palette so the universe matches whatever theme is chosen. */
  function themeTokens(p) {
    var L = p.light, b = p.bg1, ink = p.ink, a1 = p.a1, a2 = p.a2, lift = L ? "#000000" : "#ffffff";
    return {
      dark: !L,
      bgOuter: b, bgMid: p.native ? b : mix(b, p.bg2, 0.6), bgInner: p.native ? b : p.bg2,
      ink: ink, mute: mix(b, ink, 0.62), rule: mix(b, ink, 0.14), glow: a1,
      nebulaA: L ? mix(b, a2, 0.3) : a2, nebulaB: L ? mix(b, a1, 0.3) : a1,
      shadow: L ? mix(b, ink, 0.45) : "#000000",
      borderA: L ? mix(b, a1, 0.35) : "#ffffff", borderB: L ? mix(b, a2, 0.35) : a1,
      ring: a1, ringHi: L ? "#ffffff" : mix(a1, "#ffffff", 0.7),
      planets: [a2, a1, mix(a1, a2, 0.5), mix(a1, lift, 0.3), mix(a2, lift, 0.3), mix(a1, "#000000", 0.25), mix(a2, "#000000", 0.25)],
      wheel: [a1, mix(a1, a2, 0.5), a2],
      emptyWedge: mix(b, ink, L ? 0.1 : 0.14),
      discTop: mix(b, ink, L ? 0.02 : 0.07), discSide: L ? mix(b, ink, 0.12) : mix(b, "#000000", 0.35), discEdge: mix(b, a1, L ? 0.4 : 0.45),
      core: L ? mix(a2, "#ffffff", 0.15) : mix(a2, "#ffffff", 0.45),
      peak: L ? mix(a2, "#000000", 0.15) : mix(a2, "#ffffff", 0.45),
      mix: [a1, a2, mix(a1, lift, 0.45), mix(a2, lift, 0.45)], mixTrack: mix(b, ink, 0.1),
      stars: !L
    };
  }

  /** Colour tokens for a style ("neon" or "theme"), plus the frame that sits the card on the README page. */
  function tokens(p, style) {
    var t = style === "theme" ? themeTokens(p) : Object.assign({}, COSMIC[p.light ? "light" : "dark"]);
    t.line = p.native ? p.line : mix(t.bgOuter, t.ink, 0.18);
    t.radius = p.native ? 12 : 18;
    return t;
  }

  /* ---------- numbers ---------- */
  function stats(weeks) {
    var days = [].concat.apply([], weeks), longest = 0, run = 0, peak = { date: null, count: 0 };
    days.forEach(function (d) {
      if (d.count > 0) { run++; if (run > longest) longest = run; } else run = 0;
      if (d.count > peak.count) peak = d;
    });
    var cur = 0, i = days.length - 1;
    if (i >= 0 && days[i].count === 0) i--;               // today may simply not have happened yet
    for (; i >= 0 && days[i].count > 0; i--) cur++;
    return {
      total: days.reduce(function (n, d) { return n + d.count; }, 0),
      active: days.filter(function (d) { return d.count > 0; }).length,
      current: cur, longest: longest, peak: peak, max: peak.count, days: days.length
    };
  }

  /** The calendar grouped into calendar months, oldest first: [{ key: "2026-06", days, total, label: "Jun" }]. */
  function monthBuckets(weeks) {
    var list = [];
    [].concat.apply([], weeks).forEach(function (day) {
      var key = String(day && day.date || "").slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(key)) return;
      var m = list[list.length - 1];
      if (!m || m.key !== key) list.push(m = { key: key, days: 0, total: 0, label: MONTHS[Number(key.slice(5)) - 1] || "" });
      m.days++;
      m.total += Math.max(0, Number(day.count) || 0);
    });
    return list;
  }

  /* ---------- 3D: rotate around the vertical axis, tilt toward the viewer, project to 2D ---------- */
  function projector(yawDeg, pitchDeg, cx, cy) {
    var yaw = yawDeg * Math.PI / 180, pitch = pitchDeg * Math.PI / 180;
    var cyw = Math.cos(yaw), syw = Math.sin(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    function project(u, v, h) {
      var x = u * cyw - v * syw, depth = u * syw + v * cyw;
      return { x: cx + x, y: cy + depth * sp - (h || 0) * cp, depth: depth };
    }
    project.facing = function (nu, nv) { return nu * syw + nv * cyw; };
    return project;
  }
  function pts(list) { return list.map(function (q) { return r1(q.x) + "," + r1(q.y); }).join(" "); }
  function poly(list, fill, extra) { return '<polygon points="' + pts(list) + '" fill="' + fill + '"' + (extra || "") + "/>"; }

  function lcg(seed) {
    return function () { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  }
  function hashName(name) {
    var h = 2166136261, s = String(name);
    for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  /** "2026-06-03" -> "Jun 3" */
  function shortDate(iso) {
    var m = String(iso).split("-").map(Number);
    return m[1] >= 1 && m[1] <= 12 && m[2] ? MONTHS[m[1] - 1] + " " + m[2] : String(iso);
  }

  /* ---------- backdrop ---------- */
  function starfield() {
    var rand = lcg(99), out = "";
    for (var i = 0; i < 150; i++) {
      var big = rand() < 0.08;
      out += '<circle cx="' + r1(rand() * W) + '" cy="' + r1(rand() * H) + '" r="' + (big ? 1.4 : 0.7) + '" fill="#fff" opacity="' + r1(0.12 + rand() * 0.45) + '"/>';
    }
    return out;
  }
  function nebula() {
    return '<ellipse cx="' + W * 0.8 + '" cy="' + H * 0.2 + '" rx="420" ry="220" fill="url(#unebA)"/><ellipse cx="' + W * 0.28 + '" cy="' + H * 0.82 + '" rx="460" ry="200" fill="url(#unebB)"/>';
  }

  /* ---------- the year as a 3D pie ---------- */
  /**
   * A ring of month wedges standing on a floating disc, with a glowing core in the hole. Each wedge spans its month's
   * share of the window (partial months at either end are thinner) and rises with that month's contributions; the
   * busiest month is outlined in gold and labelled above the pie. Wedges are cut into narrow segments so the painter's
   * sort stays exact. Returns the scene, the peak label, and the shapes far-side planet names must keep clear of.
   */
  function pie(weeks, t, P0) {
    var R = PIE.R, r = PIE.r, base = PIE.base, depth = PIE.depth, maxH = PIE.maxH, minH = PIE.minH;
    var months = monthBuckets(weeks);
    var totalDays = months.reduce(function (s, m) { return s + m.days; }, 0) || 1;
    var top = Math.max.apply(null, [1].concat(months.map(function (m) { return m.total; })));
    var peak = months.reduce(function (best, m) { return m.total > (best ? best.total : 0) ? m : best; }, null);

    // a point on the ring: angle 0 is the back (top of the image) and the year runs clockwise as seen from above
    function P(rho, a, h) { return P0(rho * Math.sin(a), -rho * Math.cos(a), h); }
    function view(nu, nv) { return P0.facing(nu, nv) > 1e-6; }
    var light = [-0.5, 0.85], ln = Math.hypot(light[0], light[1]);
    function lit(nu, nv) { return 0.5 + 0.42 * Math.max(0, (nu * light[0] + nv * light[1]) / ln); }
    function ring(rho, h, n) {
      var out = [];
      for (var k = 0; k < n; k++) out.push(P(rho, 2 * Math.PI * k / n, h));
      return out;
    }

    // the floating base disc: a soft shadow, the near side of its band, and its top
    var band = [], k;
    for (k = 0; k <= 48; k++) band.push(P(R + base, Math.PI / 2 + Math.PI * k / 48, 0));
    for (k = 48; k >= 0; k--) band.push(P(R + base, Math.PI / 2 + Math.PI * k / 48, -depth));
    var disc =
      poly(ring(R + base, -depth, 96).map(function (q) { return { x: q.x + 4, y: q.y + 18 }; }), t.shadow, ' opacity="' + (t.dark ? ".7" : ".18") + '" filter="url(#usoft)"') +
      poly(band, "url(#udiscSide)") +
      poly(ring(R + base, 0, 96), "url(#udiscTop)", ' stroke="' + t.discEdge + '" stroke-width="1.2" stroke-opacity=".9"') +
      poly(ring(r - 10, 0, 64), t.dark ? "#000" : shade(t.discTop, 0.94), ' opacity="' + (t.dark ? ".35" : ".6") + '"');

    var gap = 0.014, segs = [], start = 0;
    months.forEach(function (m, i) {
      m.a0 = start / totalDays * 2 * Math.PI + gap;
      m.a1 = (start + m.days) / totalDays * 2 * Math.PI - gap;
      start += m.days;
      if (m.a1 <= m.a0) return;                             // a single day at the window's edge is too thin to draw
      m.mid = (m.a0 + m.a1) / 2;
      m.h = m.total ? minH + m.total / top * (maxH - minH) : 3;
      m.colour = m.total ? along(t.wheel, i / Math.max(1, months.length - 1)) : t.emptyWedge;
      var n = Math.max(2, Math.round((m.a1 - m.a0) / 0.09));
      for (var j = 0; j < n; j++) {
        var b0 = m.a0 + (m.a1 - m.a0) * j / n, b1 = m.a0 + (m.a1 - m.a0) * (j + 1) / n;
        segs.push({ m: m, b0: b0, b1: b1, mid: (b0 + b1) / 2, first: j === 0, last: j === n - 1 });
      }
    });

    // each face gets a hairline stroke in its own colour, so neighbouring segments of a wedge join without a seam
    function face(list, fill) { return poly(list, fill, ' stroke="' + fill + '" stroke-width=".7" stroke-linejoin="round"'); }
    function drawSeg(s) {
      var b0 = s.b0, b1 = s.b1, h = s.m.h, c = s.m.colour, out = "", n;
      n = [-Math.sin(s.mid), Math.cos(s.mid)];
      if (view(n[0], n[1])) out += face([P(r, b0), P(r, b1), P(r, b1, h), P(r, b0, h)], shade(c, lit(n[0], n[1]) * 0.85));
      n = [-Math.cos(b0), -Math.sin(b0)];
      if (s.first && view(n[0], n[1])) out += face([P(r, b0), P(R, b0), P(R, b0, h), P(r, b0, h)], shade(c, lit(n[0], n[1])));
      n = [Math.cos(b1), Math.sin(b1)];
      if (s.last && view(n[0], n[1])) out += face([P(r, b1), P(R, b1), P(R, b1, h), P(r, b1, h)], shade(c, lit(n[0], n[1])));
      n = [Math.sin(s.mid), -Math.cos(s.mid)];
      if (view(n[0], n[1])) out += face([P(R, b0), P(R, b1), P(R, b1, h), P(R, b0, h)], shade(c, lit(n[0], n[1])));
      return out;
    }
    // a wedge's top is one smooth shape with a light rim and its month's name
    function arc(m, rho, rev) {
      var list = [];
      for (var q = 0; q <= 24; q++) list.push(P(rho, m.a0 + (m.a1 - m.a0) * q / 24, m.h));
      return rev ? list.reverse() : list;
    }
    function topOf(m) {
      var outline = arc(m, R).concat(arc(m, r, true)), isPeak = m === peak;
      var out = poly(outline, shade(m.colour, t.dark ? 1.08 : 1.12)) +
        '<polygon points="' + pts(outline.concat([outline[0]])) + '" fill="none" stroke="' + (isPeak ? t.peak : mix(m.colour, "#ffffff", 0.6)) +
        '" stroke-width="' + (isPeak ? 2 : 1) + '" stroke-linejoin="round"' + (isPeak ? ' filter="url(#uglow)"' : "") + "/>";
      if (m.days >= 12) {
        // white on a darker halo at night, as in Git3D; by day the page's dark ink on a lighter halo, so no white text sits on a light card
        var q = P((R + r) / 2 + 6, m.mid, m.h);
        out += '<text x="' + r1(q.x) + '" y="' + r1(q.y + 4) + '" text-anchor="middle" font-size="11.5" font-weight="700" fill="' + (t.dark ? "#ffffff" : t.ink) + '" fill-opacity=".95" paint-order="stroke" stroke="' +
          (t.dark ? shade(m.colour, 0.55) : mix(m.colour, "#ffffff", 0.55)) + '" stroke-width="2.4" stroke-linejoin="round">' + m.label + "</text>";
      }
      return out;
    }

    function depthOf(s) { return P((R + r) / 2, s.mid).depth; }
    segs.sort(function (a, b) { return depthOf(a) - depthOf(b); });
    // each month's top is drawn with its nearest segment, the last of that month to be painted
    segs.forEach(function (s) { s.m.nearest = s; });
    var back = "", front = "";
    segs.forEach(function (s) {
      var svg = drawSeg(s) + (s.m.nearest === s ? topOf(s.m) : "");
      if (depthOf(s) < 0) back += svg; else front += svg;
    });

    // the core: a small glowing star in the ring's hole
    var c0 = P0(0, 0, 0), c = P0(0, 0, 46);
    var coreStar =
      '<ellipse cx="' + r1(c0.x) + '" cy="' + r1(c0.y) + '" rx="' + r1(r * 0.8) + '" ry="' + r1(r * 0.4) + '" fill="url(#ucoreGlow)" opacity=".8"/>' +
      '<circle cx="' + r1(c.x) + '" cy="' + r1(c.y) + '" r="64" fill="url(#ucoreHalo)"/>' +
      '<circle cx="' + r1(c.x) + '" cy="' + r1(c.y) + '" r="30" fill="url(#ucoreBody)"/>';

    // the busiest month: a label in clear sky above the whole pie, joined to its wedge by a fine line
    var peakLabel = "";
    if (peak && peak.total && peak.h !== undefined) {
      var tip = P(R - 18, peak.mid, peak.h);
      var highest = Math.min.apply(null, months.filter(function (m) { return m.h !== undefined; }).map(function (m) { return P(R, m.mid, m.h).y; }));
      var y1 = Math.max(46, Math.min(tip.y - 40, highest - 34));
      var label = peak.label + " · " + peak.total.toLocaleString("en-US"), w = 26 + label.length * 6.6;
      peakLabel = "<g>" +
        '<line x1="' + r1(tip.x) + '" y1="' + r1(tip.y - 2) + '" x2="' + r1(tip.x) + '" y2="' + r1(y1) + '" stroke="' + t.peak + '" stroke-width="1.4" stroke-opacity=".8"/>' +
        '<circle cx="' + r1(tip.x) + '" cy="' + r1(tip.y - 2) + '" r="3" fill="' + t.peak + '" filter="url(#uglow)"/>' +
        '<rect x="' + r1(tip.x - 11) + '" y="' + r1(y1 - 20) + '" width="' + r1(w) + '" height="20" rx="10" fill="' + t.bgOuter + '" fill-opacity=".78" stroke="' + t.peak + '" stroke-opacity=".6"/>' +
        '<circle cx="' + r1(tip.x) + '" cy="' + r1(y1 - 10) + '" r="3" fill="' + t.peak + '"/>' +
        '<text x="' + r1(tip.x + 8) + '" y="' + r1(y1 - 6) + '" font-size="11" font-weight="600" fill="' + t.ink + '">' + esc(label) + "</text></g>";
    }

    // what far-side planet names must keep clear of: the disc's outline and each segment's bounding box
    var boxes = segs.map(function (s) {
      var h = s.m.h, list = [P(R, s.b0), P(R, s.b1), P(r, s.b0), P(r, s.b1), P(R, s.b0, h), P(R, s.b1, h), P(r, s.b0, h), P(r, s.b1, h)];
      var xs = list.map(function (q) { return q.x; }), ys = list.map(function (q) { return q.y; });
      return { x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys) };
    });

    var defs =
      '<linearGradient id="udiscTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + shade(t.discTop, t.dark ? 1.25 : 1) + '"/><stop offset="1" stop-color="' + shade(t.discTop, t.dark ? 0.8 : 0.96) + '"/></linearGradient>' +
      '<linearGradient id="udiscSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(t.discSide, t.dark ? 1.4 : 1) + '"/><stop offset="1" stop-color="' + shade(t.discSide, 0.7) + '"/></linearGradient>' +
      '<radialGradient id="ucoreBody" cx="40%" cy="38%" r="60%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="' + t.core + '"/><stop offset="1" stop-color="' + shade(t.core, 0.55) + '"/></radialGradient>' +
      '<radialGradient id="ucoreHalo"><stop offset=".3" stop-color="' + t.core + '" stop-opacity=".55"/><stop offset="1" stop-color="' + t.core + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ucoreGlow"><stop offset="0" stop-color="' + t.core + '" stop-opacity=".6"/><stop offset="1" stop-color="' + t.core + '" stop-opacity="0"/></radialGradient>';

    return { defs: defs, scene: disc + back + coreStar + front, peakLabel: peakLabel, blockers: { plate: ring(R + base, 0, 48), boxes: boxes } };
  }

  /** True when an axis-aligned box touches the pie: its disc (a convex polygon, tested with separating axes) or any segment's box. */
  function hitsPie(box, blockers) {
    if (blockers.boxes.some(function (b) { return box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0; })) return true;
    var shape = blockers.plate;
    var corners = [{ x: box.x0, y: box.y0 }, { x: box.x1, y: box.y0 }, { x: box.x1, y: box.y1 }, { x: box.x0, y: box.y1 }];
    var axes = [{ x: 1, y: 0 }, { x: 0, y: 1 }].concat(shape.map(function (q, i) {
      var n = shape[(i + 1) % shape.length];
      return { x: n.y - q.y, y: q.x - n.x };
    }));
    return axes.every(function (ax) {
      function proj(list) { return list.map(function (q) { return q.x * ax.x + q.y * ax.y; }); }
      var a = proj(corners), b = proj(shape);
      return Math.max.apply(null, a) > Math.min.apply(null, b) && Math.max.apply(null, b) > Math.min.apply(null, a);
    });
  }

  /* ---------- planets ---------- */
  /**
   * A lit sphere: a gradient with a highlight toward the scene light, tilted cloud bands and a storm spot clipped to the
   * disc, a terminator shadow, a specular glint and an atmosphere rim; the lead planet also gets a banded ring that
   * passes behind and in front of the body. Returns the defs once and the body to draw (each planet is drawn twice).
   */
  function sphere(i, r, color, seed, ringed) {
    var rand = lcg(seed % 100000 + 1), id = "upl" + i, light = mix(color, "#ffffff", 0.55);
    var defs = '<radialGradient id="' + id + 'b" cx="50%" cy="50%" r="50%" fx="33%" fy="30%">' +
      '<stop offset="0" stop-color="' + light + '"/><stop offset=".28" stop-color="' + shade(color, 1.12) + '"/>' +
      '<stop offset=".62" stop-color="' + color + '"/><stop offset=".88" stop-color="' + shade(color, 0.42) + '"/>' +
      '<stop offset="1" stop-color="' + shade(color, 0.2) + '"/></radialGradient>' +
      '<radialGradient id="' + id + 'a" r="50%"><stop offset=".7" stop-color="' + color + '" stop-opacity="0"/>' +
      '<stop offset=".79" stop-color="' + shade(color, 1.3) + '" stop-opacity=".38"/><stop offset=".88" stop-color="' + color + '" stop-opacity=".1"/>' +
      '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + id + 'c"><circle r="' + r1(r) + '"/></clipPath>';

    var tilt = -14 + rand() * 10, bands = "", n = 3 + Math.floor(rand() * 3);
    for (var k = 0; k < n; k++) {
      var y = r1(-r + ((k + 0.5) * 2 * r) / n + (rand() - 0.5) * r * 0.2), h = r1(r * (0.1 + rand() * 0.16));
      bands += '<ellipse cx="0" cy="' + y + '" rx="' + r1(r * 1.5) + '" ry="' + h + '" fill="' + (k % 2 ? shade(color, 0.62) : mix(color, "#ffffff", 0.35)) + '" opacity="' + r1(0.18 + rand() * 0.16) + '"/>';
    }
    var spotY = r1((rand() - 0.5) * r * 0.9);
    var spot = '<ellipse cx="' + r1((rand() - 0.5) * r) + '" cy="' + spotY + '" rx="' + r1(r * 0.26) + '" ry="' + r1(r * 0.12) + '" fill="' + shade(color, 0.55) + '" opacity=".45"/>';
    function arc(rx, ry, sweep, width, op, tone) {
      return '<path d="M' + r1(-rx) + ',0 A' + r1(rx) + "," + r1(ry) + " 0 0," + sweep + " " + r1(rx) + ',0" fill="none" stroke="' + tone + '" stroke-opacity="' + op + '" stroke-width="' + width + '"/>';
    }
    function ringSet(sweep, f) {
      return '<g transform="rotate(-18)">' +
        arc(r * 1.55, r * 0.36, sweep, r1(r * 0.16), r1(0.55 * f), mix(color, "#ffffff", 0.4)) +
        arc(r * 1.85, r * 0.43, sweep, r1(r * 0.2), r1(0.75 * f), shade(color, 1.2)) +
        arc(r * 2.15, r * 0.5, sweep, r1(r * 0.08), r1(0.45 * f), mix(color, "#ffffff", 0.6)) + "</g>";
    }
    var body =
      '<circle r="' + r1(r * 1.28) + '" fill="url(#' + id + 'a)"/>' +
      (ringed ? ringSet(1, 0.75) : "") +
      '<circle r="' + r1(r) + '" fill="url(#' + id + 'b)"/>' +
      '<g clip-path="url(#' + id + 'c)"><g transform="rotate(' + r1(tilt) + ')">' + bands + spot + "</g>" +
      (ringed ? '<ellipse cx="0" cy="' + r1(r * 0.18) + '" rx="' + r1(r * 1.9) + '" ry="' + r1(r * 0.12) + '" fill="#000" opacity=".28" transform="rotate(-18)"/>' : "") +
      "</g>" +
      '<circle r="' + r1(r) + '" fill="url(#uplTerm)"/>' +
      '<ellipse cx="' + r1(-r * 0.36) + '" cy="' + r1(-r * 0.42) + '" rx="' + r1(r * 0.3) + '" ry="' + r1(r * 0.17) + '" fill="url(#uplSpec)" transform="rotate(-38 ' + r1(-r * 0.36) + " " + r1(-r * 0.42) + ')"/>' +
      '<path d="M' + r1(r * Math.cos(3.5)) + "," + r1(r * Math.sin(3.5)) + " A" + r1(r) + "," + r1(r) + " 0 0,1 " + r1(r * Math.cos(5.1)) + "," + r1(r * Math.sin(5.1)) + '" fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width=".7" stroke-linecap="round"/>' +
      (ringed ? ringSet(0, 1) : "");
    return { defs: defs, body: body };
  }

  /**
   * Planets orbit in a plane that passes behind the pie on its far side and in front of it on its near side. Each ring
   * is split into a far and a near arc, and each planet is drawn twice, once per layer: exactly one copy is visible at a
   * time, so a planet is never cut in two. Names sit in their own layer above everything: on the near side they always
   * show, and on the far side a name shows only while it's in clear sky, hiding while it would cross the pie.
   *
   * The ellipse is a circle squashed by scale(1 FLAT): the planet's group turns around the centre, then turns back by the
   * same angle and is un-squashed, so the planet stays upright and round. The still picture is the fixed angle, the
   * visibility attribute and the scale (bigger when near); with motion on, CSS animations take over all of them from
   * that same point, and prefers-reduced-motion falls back to the still picture.
   */
  function orbits(repos, t, animate, blockers) {
    function arcPath(R, sweep) { return "M" + (OCX - R) + "," + OCY + " A" + R + "," + r1(R * FLAT) + " 0 0," + sweep + " " + (OCX + R) + "," + OCY; }
    function ringPath(R, i, sweep) {
      var d = arcPath(R, sweep), near = !sweep;
      var glow = '<path d="' + d + '" fill="none" stroke="' + t.ring + '" stroke-width="' + (near ? 7 : 5) + '" stroke-opacity="' + (near ? 0.1 : 0.05) + '" stroke-linecap="round"/>';
      return glow + (i === 2
        ? '<path d="' + d + '" fill="none" stroke="url(#uringFade)" stroke-width="' + (near ? 2.2 : 1.6) + '" stroke-dasharray="0.1 9" stroke-linecap="round" opacity="' + (near ? 1 : 0.55) + '"/>'
        : '<path d="' + d + '" fill="none" stroke="url(#uringFade)" stroke-width="' + (near ? 1.8 : 1.3) + '" opacity="' + (near ? 1 : 0.55) + '"/>' +
          '<path d="' + d + '" fill="none" stroke="' + t.ringHi + '" stroke-width=".6" stroke-opacity="' + (near ? 0.55 : 0.25) + '"/>');
    }

    // normalise repo fields so unexpected API values can't break the geometry
    var list = (repos || []).slice(0, 6).map(function (r) {
      return { name: String(r && r.name != null ? r.name : ""), stars: Math.max(0, Math.floor(Number(r && r.stars)) || 0) };
    });
    var maxStars = Math.max.apply(null, [1].concat(list.map(function (r) { return r.stars; })));
    var defs = "", far = "", near = "", labels = "", css = "";
    list.forEach(function (repo, i) {
      var ring = i % RINGS.length, R = RINGS[ring], radius = 14 + 10 * Math.sqrt(repo.stars / maxStars);
      var color = t.planets[i % t.planets.length];
      var name = esc(repo.name.length > 18 ? repo.name.slice(0, 17) + "…" : repo.name);
      var starsLabel = repo.stars > 0 ? '<tspan fill="' + t.mute + '" font-weight="500"> ★' + repo.stars + "</tspan>" : "";
      var dur = 52 + ring * 20 + i * 3, phase = (i / list.length + ring * 0.17) % 1, deg = r1(phase * 360);
      // rotating clockwise from the right goes through the near half first: the planet is in front while sin(angle) > 0
      var s = Math.sin(deg * Math.PI / 180), inFront = s > 0, swell = r1((1 + 0.18 * s) * 100) / 100;

      // where the name would sit at an angle (it swells with the planet), and whether it shows there
      var chars = Math.min(repo.name.length, 18) + (repo.stars > 0 ? 2 + String(repo.stars).length : 0);
      function nameShows(rad, isNear) {
        if (isNear) return true;
        var sc = 1 + 0.18 * Math.sin(rad), x = OCX + R * Math.cos(rad), y = OCY + R * FLAT * Math.sin(rad);
        var w = (chars * 7 + 8) * sc, base = y + (-radius - 11) * sc;
        return !hitsPie({ x0: x - w / 2, x1: x + w / 2, y0: base - 13 * sc, y1: base + 4 * sc }, blockers);
      }
      // the name's visibility through one orbit, sampled 72 times; the first half of the loop is the near side
      var N = 72, states = [];
      for (var k = 0; k < N; k++) states.push(nameShows(2 * Math.PI * k / N, k < N / 2));
      function pc(f) { return Math.round(f * 10000) / 100; }
      var steps = "", from = 0;
      states.forEach(function (v, j) {
        if (j + 1 < N && states[j + 1] === v) return;
        // each run holds its value up to just before the next one starts, so the switch is sharp
        steps += pc(from / N) + "%," + (j + 1 < N ? pc((j + 1) / N - 0.001) : 100) + "%{visibility:" + (v ? "visible" : "hidden") + "}";
        from = j + 1;
      });
      var flips = states.indexOf(false) !== -1, nameShown = nameShows(deg * Math.PI / 180, inFront);
      if (animate && flips) css += "@keyframes ul" + i + "{" + steps + "}.u-l" + i + "{animation:ul" + i + " linear infinite}";

      var sp = sphere(i, radius, color, hashName(repo.name), i === 0);
      defs += sp.defs;
      var timing = animate ? ' style="animation-duration:' + dur + "s" + (phase ? ";animation-delay:" + r1(-dur * phase) + "s" : "") + '"' : "";
      function cls(c) { return animate ? ' class="' + c + '"' : ""; }
      function copy(outer, shown, content) {
        return '<g transform="translate(' + OCX + " " + OCY + ") scale(1 " + FLAT + ')"' + (outer ? cls(outer) : "") + (shown ? "" : ' visibility="hidden"') + (outer ? timing : "") + ">" +
          "<g" + cls("u-orbit") + ' transform="rotate(' + deg + ')"' + timing + '><g transform="translate(' + R + ' 0)">' +
          "<g" + cls("u-back") + ' transform="rotate(' + (-deg) + ')"' + timing + '><g transform="scale(1 ' + r1(1 / FLAT * 1000) / 1000 + ')">' +
          "<g" + cls("u-swell") + ' transform="scale(' + swell + ')"' + timing + ">" + content + "</g></g></g></g></g></g>";
      }
      var planet = '<ellipse cx="0" cy="' + r1(radius + 7) + '" rx="' + r1(radius * 1.15) + '" ry="' + r1(radius * 0.28) + '" fill="#000" opacity=".3" filter="url(#usoft4)"/>' + sp.body;
      far += copy("u-far", !inFront, planet);
      near += copy("u-near", inFront, planet);
      labels += copy(flips ? "u-l" + i : "", nameShown,
        '<text y="' + r1(-radius - 11) + '" text-anchor="middle" font-size="12" font-weight="600" fill="' + t.ink + '" paint-order="stroke" stroke="' + t.bgOuter + '" stroke-width="3" stroke-linejoin="round">' + name + starsLabel + "</text>");
    });
    return {
      back: RINGS.map(function (R, i) { return ringPath(R, i, 1); }).join("") + far,
      front: RINGS.map(function (R, i) { return ringPath(R, i, 0); }).join("") + near,
      labels: labels, defs: defs, css: css
    };
  }

  /* ---------- contribution mix ---------- */
  /**
   * A small upright 3D pie facing the viewer, like a coin standing on its edge: how the contributions split between
   * commits, pull requests, issues and code review, as shares of those four (like GitHub's activity overview). Each
   * slice's share and name sit beside it on a leader line, so the split never relies on colour alone.
   */
  function mixPie(d, t, x0, w, top, size) {
    var m = d.mix || {};
    var raw4 = [m.commits, m.pullRequests, m.issues, m.reviews];
    var parts = [["Commits", m.commits], ["Pull requests", m.pullRequests], ["Issues", m.issues], ["Code review", m.reviews]].map(function (e, i) {
      return { label: e[0], v: Math.max(0, Math.floor(Number(e[1])) || 0), colour: t.mix[i] };
    }).filter(function (p) { return p.v > 0; });
    var sum = parts.reduce(function (n, p) { return n + p.v; }, 0);

    // shares that add up to exactly 100 (largest remainder)
    var share = parts.map(function (p) { return p.v / (sum || 1) * 100; }), pct = share.map(Math.floor);
    share.map(function (v, i) { return [v - pct[i], i]; }).sort(function (a, b) { return b[0] - a[0]; })
      .slice(0, 100 - pct.reduce(function (n, v) { return n + v; }, 0)).forEach(function (e) { pct[e[1]]++; });

    // angle 0 is 12 o'clock and slices run clockwise; the disc has depth, so its rim shows on the lower right and the
    // hole's wall on the upper left
    var R = 40 * size, hole = 0.46, depth = 7 * size, cx = x0 + w / 2, cy = top + 22 + R;
    var off = { x: depth * 0.72, y: depth * 0.7 };
    function pt(k, a, back) { return { x: cx + k * R * Math.sin(a) + (back ? off.x : 0), y: cy - k * R * Math.cos(a) + (back ? off.y : 0) }; }
    function arcPts(k, a0, a1, back, n) {
      var out = [];
      n = n || 24;
      for (var i = 0; i <= n; i++) out.push(pt(k, a0 + (a1 - a0) * i / n, back));
      return out;
    }
    // where a ring's wall faces the viewer: the outer wall where it faces the depth direction, the hole's wall elsewhere
    function facesOut(a) { return Math.sin(a) * off.x - Math.cos(a) * off.y > 0; }
    function runs(a0, a1, want) {
      var out = [], from = null;
      for (var i = 0; i <= 48; i++) {
        var a = a0 + (a1 - a0) * i / 48;
        if (want(a) && from === null) from = a;
        if ((!want(a) || i === 48) && from !== null) { out.push([from, a]); from = null; }
      }
      return out;
    }
    var a = 0;
    var slices = parts.map(function (p, i) {
      var span = p.v / sum * 2 * Math.PI, sl = { label: p.label, colour: p.colour, i: i, pct: pct[i], a0: a, a1: a + span, mid: a + span / 2 };
      a += span;
      return sl;
    });

    // materials: each face is lit from the top left; the rim and the hole's wall fall into shade along their length
    var grads = "", sides = "", inner = "", tops = "";
    function lin(id, x1, y1, x2, y2, stops) {
      grads += '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '">' +
        stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>'; }).join("") + "</linearGradient>";
    }
    slices.forEach(function (s) {
      lin("umixF" + s.i, cx - R, cy - R, cx + R, cy + R, [[0, shade(s.colour, 1.22)], [0.5, s.colour], [1, shade(s.colour, 0.82)]]);
      lin("umixR" + s.i, cx - R, cy - R, cx + R + off.x, cy + R + off.y, [[0, shade(s.colour, 0.72)], [1, shade(s.colour, 0.42)]]);
      runs(s.a0, s.a1, facesOut).forEach(function (q) { sides += poly(arcPts(1, q[0], q[1]).concat(arcPts(1, q[0], q[1], true).reverse()), "url(#umixR" + s.i + ")"); });
      runs(s.a0, s.a1, function (x) { return !facesOut(x); }).forEach(function (q) { inner += poly(arcPts(hole, q[0], q[1]).concat(arcPts(hole, q[0], q[1], true).reverse()), shade(s.colour, 0.38)); });
      tops += poly(arcPts(1, s.a0, s.a1).concat(arcPts(hole, s.a0, s.a1).reverse()), "url(#umixF" + s.i + ")");
    });
    // even-width separators between slices, in the background colour, cut through the face and the rim alike
    var seps = slices.length > 1 ? slices.map(function (s) {
      var p0 = pt(hole, s.a0), p1 = pt(1, s.a0), p2 = pt(1, s.a0, true);
      return '<line x1="' + r1(p0.x) + '" y1="' + r1(p0.y) + '" x2="' + r1(p1.x) + '" y2="' + r1(p1.y) + '"/>' +
        (facesOut(s.a0) ? '<line x1="' + r1(p1.x) + '" y1="' + r1(p1.y) + '" x2="' + r1(p2.x) + '" y2="' + r1(p2.y) + '"/>' : "");
    }).join("") : "";
    // a glossy highlight along the top-left of the outer edge, a soft shadow inside the hole, a contact shadow beneath
    var l0 = pt(1, -1.25), l1 = pt(1, 0.35);
    var finish = !sum ? "" :
      '<g mask="url(#umixHole)"><circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(R) + '" fill="url(#umixGloss)"/></g>' +
      '<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(R * hole) + '" fill="url(#umixHoleShade)"/>' +
      (seps ? '<g stroke="' + t.bgOuter + '" stroke-width="1.8" stroke-linecap="round">' + seps + "</g>" : "") +
      '<path d="M' + r1(l0.x) + "," + r1(l0.y) + " A" + r1(R) + "," + r1(R) + " 0 0,1 " + r1(l1.x) + "," + r1(l1.y) + '" fill="none" stroke="url(#umixRim)" stroke-width="1.6" stroke-linecap="round"/>';
    var ground = '<ellipse cx="' + r1(cx + off.x) + '" cy="' + r1(cy + R + off.y + 4) + '" rx="' + r1(R * 0.88) + '" ry="' + r1(R * 0.12) + '" fill="' + t.shadow + '" opacity="' + (t.dark ? ".55" : ".22") + '" filter="url(#usoft4)"/>';
    var track = sum ? "" : poly(arcPts(1, 0, 2 * Math.PI, false, 48).concat(arcPts(hole, 0, 2 * Math.PI, false, 48).reverse()), t.mixTrack);

    // labels: slices on the right half label to the right, the rest to the left, spread so they never overlap
    function labelFor(s, side, ly) {
      var edge = pt(1.04, s.mid, facesOut(s.mid)), lx = side > 0 ? cx + R + 36 : cx - R - 36;
      return '<polyline points="' + r1(edge.x) + "," + r1(edge.y) + " " + r1(lx - side * 10) + "," + r1(ly - 4) + " " + r1(lx) + "," + r1(ly - 4) + '" fill="none" stroke="' + s.colour + '" stroke-width=".9" stroke-opacity=".9" stroke-linejoin="round"/>' +
        '<circle cx="' + r1(edge.x) + '" cy="' + r1(edge.y) + '" r="2.6" fill="' + t.bgOuter + '" stroke="' + s.colour + '" stroke-width="1.3"/>' +
        '<circle cx="' + r1(lx) + '" cy="' + r1(ly - 4) + '" r="1.4" fill="' + s.colour + '"/>' +
        '<text x="' + r1(lx + side * 6) + '" y="' + r1(ly) + '" text-anchor="' + (side > 0 ? "start" : "end") + '" font-size="12" letter-spacing=".1" fill="' + t.mute + '" paint-order="stroke" stroke="' + t.bgOuter + '" stroke-width="3" stroke-linejoin="round">' +
        '<tspan fill="' + t.ink + '" font-size="13" font-weight="700">' + s.pct + "%</tspan> " + esc(s.label) + "</text>";
    }
    function place(group, side) {
      group.sort(function (p, q) { return pt(1, p.mid).y - pt(1, q.mid).y; });
      var first = cy - (group.length - 1) * 18 / 2 + 8;
      return group.map(function (s, i) { return labelFor(s, side, first + i * 18); }).join("");
    }
    // nothing known at all (every number unavailable) reads differently from a quiet year
    var unknown = raw4.every(function (v) { return v === null || v === undefined; });
    var labels = sum
      ? place(slices.filter(function (s) { return Math.sin(s.mid) >= 0; }), 1) + place(slices.filter(function (s) { return Math.sin(s.mid) < 0; }), -1)
      : '<text x="' + r1(cx + R + 22) + '" y="' + (cy + 4) + '" font-size="11" fill="' + t.mute + '">' + (unknown ? "Not available" : "No activity yet") + "</text>";

    return '<text x="' + (x0 + w / 2) + '" y="' + top + '" text-anchor="middle" font-size="12" font-weight="600" letter-spacing=".4" fill="' + t.mute + '">Contribution mix · ' + esc(d.mixSpan || "last 12 months") + "</text>" +
      "<defs>" + grads +
      '<radialGradient id="umixGloss" cx="34%" cy="26%" r="78%"><stop offset="0" stop-color="#ffffff" stop-opacity=".26"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".04"/><stop offset=".75" stop-color="#ffffff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="umixHoleShade" r="50%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="' + (t.dark ? ".55" : ".22") + '"/></radialGradient>' +
      '<linearGradient id="umixRim" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".75"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>' +
      '<mask id="umixHole"><rect x="' + r1(cx - R - 2) + '" y="' + r1(cy - R - 2) + '" width="' + r1(2 * R + 4) + '" height="' + r1(2 * R + 4) + '" fill="#fff"/><circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(R * hole) + '" fill="#000"/></mask>' +
      "</defs>" + ground + sides + inner + tops + finish + track + labels;
  }

  /* ---------- legend ---------- */
  /** Bottom-right card: the months' colours as a row of small wedge tops, oldest first, and the peak day. */
  function legend(st, t) {
    var w = 340, h = 128, x = W - 40 - w, y = H - 28 - h, ramp = "";
    for (var i = 0; i < 6; i++) {
      var color = along(t.wheel, i / 5), cx = x + 40 + i * 24, cy = y + 66, lo = cy - 3 - i * 2, hi = cy - 8 - i * 2;
      ramp += '<path d="M' + (cx - 9) + "," + (cy + 9) + " L" + (cx + 9) + "," + (cy + 9) + " L" + (cx + 9) + "," + lo + " L" + (cx - 9) + "," + lo + ' Z" fill="' + shade(color, 0.8) + '"/>' +
        '<path d="M' + (cx - 9) + "," + lo + " L" + (cx - 3) + "," + hi + " L" + (cx + 13) + "," + hi + " L" + (cx + 9) + "," + lo + ' Z" fill="' + shade(color, 1.2) + '"/>' +
        '<path d="M' + (cx + 9) + "," + (cy + 9) + " L" + (cx + 13) + "," + (cy + 4) + " L" + (cx + 13) + "," + hi + " L" + (cx + 9) + "," + lo + ' Z" fill="' + shade(color, 0.6) + '"/>';
    }
    var px = x + 196;
    var peak = st.peak.date
      ? '<text x="' + px + '" y="' + (y + 70) + '" font-size="20" font-weight="700" fill="' + t.ink + '">' + esc(shortDate(st.peak.date)) + "</text>" +
        '<text x="' + px + '" y="' + (y + 88) + '" font-size="11" fill="' + t.mute + '">' + st.max + " contributions</text>"
      : '<text x="' + px + '" y="' + (y + 70) + '" font-size="12" fill="' + t.mute + '">No activity yet</text>';
    return "<g>" +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="18" fill="url(#uglassFill)" stroke="url(#uglassEdge)"/>' +
      '<text x="' + (x + 28) + '" y="' + (y + 28) + '" font-size="11" fill="' + t.mute + '">Month wedges</text>' + ramp +
      '<text x="' + (x + 28) + '" y="' + (y + 96) + '" font-size="10" fill="' + t.mute + '" opacity=".8">oldest</text>' +
      '<text x="' + (x + 168) + '" y="' + (y + 96) + '" font-size="10" fill="' + t.mute + '" opacity=".8" text-anchor="end">latest</text>' +
      '<line x1="' + (x + 178) + '" x2="' + (x + 178) + '" y1="' + (y + 18) + '" y2="' + (y + 96) + '" stroke="' + t.rule + '"/>' +
      '<circle cx="' + (px + 4) + '" cy="' + (y + 24) + '" r="4" fill="' + t.peak + '" filter="url(#uglow)"/>' +
      '<text x="' + (px + 14) + '" y="' + (y + 28) + '" font-size="11" fill="' + t.mute + '">Peak day</text>' + peak +
      '<text x="' + (x + 28) + '" y="' + (y + h - 12) + '" font-size="10" fill="' + t.mute + '" opacity=".8">Planets: top repositories · size by stars</text>' +
      "</g>";
  }

  /** Days (oldest first, starting on `start`) as Sunday-to-Saturday weeks, with null padding before the first day. */
  function toWeeks(daily, start) {
    var startMs = Date.parse(start + "T00:00:00Z"), offset = isNaN(startMs) ? 0 : new Date(startMs).getUTCDay(), weeks = [];
    for (var i = -offset; i < daily.length; i += 7) {
      var week = [];
      for (var j = 0; j < 7; j++) {
        var k = i + j;
        week.push(k < 0 || k >= daily.length ? null : { date: isNaN(startMs) ? String(k) : new Date(startMs + k * 86400000).toISOString().slice(0, 10), count: daily[k] });
      }
      weeks.push(week);
    }
    return weeks;
  }

  /** The planets swell on the near side and shrink on the far side: twelve samples of 1 + 0.18 sin(angle). */
  function swellFrames() {
    var out = "";
    for (var k = 0; k <= 12; k++) out += r1(k / 12 * 1000) / 10 + "%{transform:scale(" + r1((1 + 0.18 * Math.sin(2 * Math.PI * k / 12)) * 100) / 100 + ")}";
    return out;
  }

  /** opts.style: "neon" (Git3D Universe's own cosmic palettes, the default) or "theme" (colours from the profile palette). */
  function buildUniverse(d, p, opts) {
    var animate = !(opts && opts.animate === false), t = tokens(p, opts && opts.style);
    var weeks = d.weeks.map(function (w) { return w.filter(Boolean); }), st = stats(weeks);
    var year = pie(weeks, t, projector(0, PITCH, OCX, OCY)), orbit = orbits(d.repos, t, animate, year.blockers);
    var label = d.name + ": " + st.total + " contributions, longest streak " + st.longest + " days";
    var desc = "3D contribution pie for @" + d.login + ": " + st.total + " contributions over " + st.active + " active days, current streak " +
      st.current + " days, longest streak " + st.longest + " days" + (st.peak.date ? ", busiest day " + st.peak.date + " with " + st.max + " contributions." : ".");
    var motion = animate
      ? // explicit start frames: without them a loop would start from the element's own fixed angle, and the orbit would
      // drift out of step with the near/far swap that shares its timing
      "<style>@keyframes uorb{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes uback{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}" +
        "@keyframes unear{0%{visibility:visible}50%,100%{visibility:hidden}}@keyframes ufar{0%,49.9%{visibility:hidden}50%,100%{visibility:visible}}" +
        "@keyframes uswell{" + swellFrames() + "}" +
        ".u-orbit{animation:uorb linear infinite}.u-back{animation:uback linear infinite}" +
        ".u-near{animation:unear linear infinite}.u-far{animation:ufar linear infinite}.u-swell{animation:uswell linear infinite}" +
        orbit.css +
        "@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>"
      : "";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(label) + '" font-family="' + SANS + '" text-rendering="geometricPrecision">' +
      "<title>" + esc(label) + "</title><desc>" + esc(desc) + "</desc>" +
      "<defs>" +
      '<radialGradient id="ubg" cx="62%" cy="58%" r="85%"><stop offset="0" stop-color="' + t.bgInner + '"/><stop offset=".55" stop-color="' + t.bgMid + '"/><stop offset="1" stop-color="' + t.bgOuter + '"/></radialGradient>' +
      '<radialGradient id="unebA"><stop offset="0" stop-color="' + t.nebulaA + '" stop-opacity="' + (t.dark ? 0.28 : 0.6) + '"/><stop offset="1" stop-color="' + t.nebulaA + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="unebB"><stop offset="0" stop-color="' + t.nebulaB + '" stop-opacity="' + (t.dark ? 0.22 : 0.55) + '"/><stop offset="1" stop-color="' + t.nebulaB + '" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="uglassFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="' + (t.dark ? 0.09 : 1) + '"/><stop offset="1" stop-color="#fff" stop-opacity="' + (t.dark ? 0.03 : 0.97) + '"/></linearGradient>' +
      '<linearGradient id="uglassEdge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + t.borderA + '" stop-opacity="' + (t.dark ? 0.35 : 0.9) + '"/><stop offset="1" stop-color="' + t.borderB + '" stop-opacity="' + (t.dark ? 0.35 : 0.9) + '"/></linearGradient>' +
      '<linearGradient id="uringFade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + t.ring + '" stop-opacity=".4"/><stop offset=".5" stop-color="' + t.ring + '" stop-opacity=".95"/><stop offset="1" stop-color="' + t.ring + '" stop-opacity=".4"/></linearGradient>' +
      '<linearGradient id="uplTerm" x1=".15" y1=".1" x2=".95" y2=".95"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></linearGradient>' +
      '<radialGradient id="uplSpec"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ufloorGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="' + t.glow + '" stop-opacity="' + (t.dark ? 0.25 : 0.06) + '"/><stop offset="1" stop-color="' + t.glow + '" stop-opacity="0"/></radialGradient>' +
      '<filter id="usoft4" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="3"/></filter>' +
      '<filter id="uglow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="usoft" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="12"/></filter>' +
      '<clipPath id="uclip"><rect width="' + W + '" height="' + H + '" rx="' + t.radius + '"/></clipPath>' +
      orbit.defs + year.defs +
      "</defs>" + motion +
      '<g clip-path="url(#uclip)">' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#ubg)"/>' +
      nebula() +
      (t.stars ? starfield() : "") +
      '<ellipse cx="' + OCX + '" cy="' + (OCY + 40) + '" rx="520" ry="200" fill="url(#ufloorGlow)"/>' +
      orbit.back + year.scene + orbit.front + year.peakLabel + orbit.labels +
      mixPie(d, t, 40, 440, 62, 1.45) +
      legend(st, t) +
      "</g>" +
      '<rect x="0.5" y="0.5" width="' + (W - 1) + '" height="' + (H - 1) + '" rx="' + (t.radius - 0.5) + '" fill="none" stroke="' + t.line + '"' + (p.native ? "" : ' stroke-width="1.5"') + "/>" +
      "</svg>";
  }

  return { buildUniverse: buildUniverse, toWeeks: toWeeks, stats: stats, monthBuckets: monthBuckets, COSMIC: COSMIC };
});
