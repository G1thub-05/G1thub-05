/*
 * core.js: pure functions that turn GitHub profile data into README markdown and a banner SVG.
 * No network, no DOM. Works in the browser (window.ReadmeCore) and in Node (require).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ReadmeCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------- input parsing ---------- */
  function parseUser(input) {
    var s = (input || "").trim().replace(/^@/, "");
    var m = s.match(/github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))/i);
    if (m) return m[1];
    if (/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(s)) return s;
    return null;
  }

  /* ---------- model ---------- */
  function oneLine(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  /* profile text goes into markdown, so backticks would open code spans or fences */
  function plain(s) { return oneLine(s).replace(/`/g, "'"); }

  function slim(r) {
    return {
      name: r.name, url: r.html_url, desc: plain(r.description), lang: r.language || "",
      stars: r.stargazers_count || 0, forks: r.forks_count || 0, topics: (r.topics || []).slice(0, 3),
      pushed: (r.pushed_at || "").slice(0, 10), created: (r.created_at || "").slice(0, 10)
    };
  }

  /** user = GET /users/:u, repos = GET /users/:u/repos (array) */
  function buildModel(user, repos, activity) {
    var own = (repos || []).filter(function (r) { return !r.fork; });
    var counts = {}, total = 0;
    own.forEach(function (r) {
      if (r.language) { counts[r.language] = (counts[r.language] || 0) + 1; total++; }
    });
    var langs = Object.keys(counts).map(function (k) {
      return { name: k, n: counts[k], pct: Math.round(counts[k] / total * 100) || 1 };
    }).sort(function (a, b) { return b.n - a.n; }).slice(0, 6);

    var tc = {};
    own.forEach(function (r) { (r.topics || []).forEach(function (t) { tc[t] = (tc[t] || 0) + 1; }); });
    var topics = Object.keys(tc).sort(function (a, b) { return tc[b] - tc[a]; }).slice(0, 10);

    var byStars = own.slice().sort(function (a, b) {
      return (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at));
    });
    var byPush = own.slice().sort(function (a, b) { return new Date(b.pushed_at) - new Date(a.pushed_at); });

    return {
      login: user.login, name: plain(user.name) || user.login, bio: plain(user.bio),
      company: plain(user.company), location: plain(user.location),
      blog: oneLine(user.blog), twitter: user.twitter_username || "", email: user.email || "",
      followers: user.followers || 0, following: user.following || 0, publicRepos: user.public_repos || 0,
      stars: own.reduce(function (n, r) { return n + (r.stargazers_count || 0); }, 0),
      forks: own.reduce(function (n, r) { return n + (r.forks_count || 0); }, 0),
      activity: activity || null,
      since: (user.created_at || "").slice(0, 4),
      langs: langs, langTotal: total, topics: topics,
      top: byStars.slice(0, 6).map(slim),
      recent: byPush.slice(0, 5).map(slim),
      all: own.map(slim)
    };
  }

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function cell(s) { return String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " "); }
  function fence(s) { return String(s).replace(/```/g, "'''"); }
  function url(s) { return /^https?:\/\//i.test(s) ? s : "https://" + s; }
  function bar(p) { var n = Math.max(1, Math.min(20, Math.round(p / 5))); return "█".repeat(n) + "░".repeat(20 - n); }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* Curated neon pairs for the "auto" theme: chosen from the username, so every profile looks distinct. */
  var NEON = [
    ["#38e8ff", "#8b5cf6"],   // cyan / violet
    ["#ff4fd8", "#5b8cff"],   // magenta / blue
    ["#2ff5a8", "#22b8ff"],   // emerald / cyan
    ["#ffb547", "#ff5f8f"],   // amber / rose
    ["#7c9bff", "#2de2e6"],   // periwinkle / teal
    ["#c084fc", "#f472b6"]    // violet / pink
  ];

  /* Fixed themes a person can pick. ink = text colour; light themes get dark ink. */
  var THEMES = {
    aurora:   { label: "Aurora",   a1: "#5eead4", a2: "#a78bfa", bg1: "#06121a", bg2: "#10223a", ink: "#ffffff" },
    cyber:    { label: "Cyber",    a1: "#38e8ff", a2: "#ff4fd8", bg1: "#07051a", bg2: "#1a0a35", ink: "#ffffff" },
    sunset:   { label: "Sunset",   a1: "#ffb547", a2: "#ff5f8f", bg1: "#150a10", bg2: "#2d1224", ink: "#ffffff" },
    emerald:  { label: "Emerald",  a1: "#2ff5a8", a2: "#22b8ff", bg1: "#04110f", bg2: "#0a2a2a", ink: "#ffffff" },
    royal:    { label: "Royal",    a1: "#7c9bff", a2: "#c084fc", bg1: "#070a1e", bg2: "#17154a", ink: "#ffffff" },
    graphite: { label: "Graphite", a1: "#e2e8f0", a2: "#94a3b8", bg1: "#0a0d13", bg2: "#1b212d", ink: "#ffffff" },
    paper:    { label: "Paper",    a1: "#2563eb", a2: "#7c3aed", bg1: "#f8fafc", bg2: "#e3eaf6", ink: "#0f172a", light: true }
  };
  var DARK_FOR_PAPER = "royal";   // the dark partner of the light Paper theme
  var THEME_ORDER = ["auto", "aurora", "cyber", "sunset", "emerald", "royal", "graphite", "paper", "custom"];

  /* ---- colour maths, used to derive a readable light version of any theme ---- */
  function rgbOf(hex) { var n = parseInt(String(hex).replace("#", ""), 16); return [n >> 16, n >> 8 & 255, n & 255]; }
  function hexOf(c) { return "#" + c.map(function (v) { return ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(""); }
  function mixHex(a, b, t) { var x = rgbOf(a), y = rgbOf(b); return hexOf([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }
  function luminance(hex) {
    var c = rgbOf(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) { var x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  /** Darkens a colour just enough to be readable on a light background. */
  function readableOnLight(hex, bg) {
    var t = 0, c = hex;
    while (contrast(c, bg) < 4 && t < 0.95) { t += 0.05; c = mixHex(hex, "#000000", t); }
    return c;
  }

  function validHex(h) { return /^#[0-9a-f]{6}$/i.test(String(h || "")); }
  /** Lightens a colour just enough to be readable on a dark background. */
  function readableOnDark(hex, bg) {
    var t = 0, c = hex;
    while (contrast(c, bg) < 4.5 && t < 0.95) { t += 0.05; c = mixHex(hex, "#ffffff", t); }
    return c;
  }
  /** A theme built from two chosen accents. Backgrounds are near-black tinted by the accents, so white text always reads. */
  function customTheme(c1, c2) {
    var bg1 = mixHex("#04060c", c2, 0.10), bg2 = mixHex("#0a0f1e", c1, 0.14);
    return { a1: readableOnDark(c1, bg1), a2: readableOnDark(c2, bg1), bg1: bg1, bg2: bg2, ink: "#ffffff", raw1: c1, raw2: c2 };
  }

  /** Colours for one profile. theme = "auto" (default, from the username) or a key of THEMES.
   *  mode = "light" or "dark" forces that brightness while keeping the theme's accents (used for light/dark-adaptive READMEs). */
  function palette(login, theme, mode, custom) {
    var h = hash(String(login)), t = THEMES[theme];
    if (!t && theme === "custom" && custom && validHex(custom.a1) && validHex(custom.a2)) t = customTheme(custom.a1.toLowerCase(), custom.a2.toLowerCase());
    if (!t) {
      var pair = NEON[h % NEON.length];
      t = { a1: pair[0], a2: pair[1], bg1: "#060913", bg2: "#0d1428", ink: "#ffffff" };
    }
    if (mode === "light" && !t.light) {
      var paper = THEMES.paper;
      t = { a1: readableOnLight(t.raw1 || t.a1, paper.bg1), a2: readableOnLight(t.raw2 || t.a2, paper.bg1), bg1: paper.bg1, bg2: paper.bg2, ink: paper.ink, light: true };
    } else if (mode === "dark" && t.light) {
      t = THEMES[DARK_FOR_PAPER];
    }
    return { a1: t.a1, a2: t.a2, bg1: t.bg1, bg2: t.bg2, ink: t.ink, light: !!t.light, anim: true, seed: h, hue: h % 360, hue2: (h % 360 + 48) % 360 };
  }

  /**
   * Palette for a profile from the person's options (theme, light/dark mode, custom accents).
   * The two halves of a Day and night README are only ever shown on GitHub's own light or dark page, so they
   * (o.native) take GitHub's surface and border colours and keep the theme in the accents: the cards sit in the
   * page instead of floating on it. Anything shown elsewhere, like the share image, keeps its themed background.
   */
  function paletteFor(login, o) {
    var p = palette(login, o.theme, o.mode, { a1: o.accent1, a2: o.accent2 }), surface = o.native && NATIVE[o.mode];
    if (surface) { p.bg1 = surface.bg1; p.bg2 = surface.bg2; p.line = surface.line; p.native = true; }
    return p;
  }
  // flat, exactly the page colour, so the only thing marking a card is GitHub's own hairline border
  var NATIVE = {
    dark:  { bg1: "#0d1117", bg2: "#0d1117", line: "#3d444d" },   // GitHub dark: page, border
    light: { bg1: "#ffffff", bg2: "#ffffff", line: "#d1d9e0" }    // GitHub light
  };


  /* ---------- activity: streaks and weekly totals from per-day counts ---------- */
  function dayKey(ms) { return new Date(ms).toISOString().slice(0, 10); }

  /** days: [{date, count}] oldest first, ending today. */
  function streaks(days) {
    var longest = 0, run = 0;
    days.forEach(function (d) { if (d.count > 0) { run++; if (run > longest) longest = run; } else run = 0; });
    var cur = 0, i = days.length - 1;
    if (i >= 0 && days[i].count === 0) i--;               // today may simply not have happened yet
    for (; i >= 0 && days[i].count > 0; i--) cur++;
    return { current: cur, longest: longest, active: days.filter(function (d) { return d.count > 0; }).length };
  }

  /** Sums per 7-day block, counted back from the most recent day. */
  function weeklyCounts(days) {
    var out = [], i = days.length;
    while (i > 0) {
      var start = Math.max(0, i - 7), sum = 0;
      for (var j = start; j < i; j++) sum += days[j].count;
      out.unshift(sum); i = start;
    }
    return out;
  }

  /** Public events API: max 300 events or 90 days. Gives a lower bound for activity. */
  function daysFromEvents(events, nowMs) {
    var counts = {}, oldest = null;
    events.forEach(function (e) {
      var d = String(e.created_at || "").slice(0, 10);
      if (!d) return;
      counts[d] = (counts[d] || 0) + 1;
      if (oldest === null || d < oldest) oldest = d;
    });
    var start = dayKey(nowMs - 89 * 86400000);
    if (events.length >= 300 && oldest && oldest > start) start = oldest;   // API cap reached: only trust back to the oldest event
    var days = [], end = Date.parse(dayKey(nowMs) + "T00:00:00Z");
    for (var t = Date.parse(start + "T00:00:00Z"); t <= end; t += 86400000) {
      var k = dayKey(t); days.push({ date: k, count: counts[k] || 0 });
    }
    return days;
  }

  /** Turns per-day counts plus any known totals into the object the cards use. */
  function makeActivity(days, extra) {
    var st = streaks(days), a = {
      current: st.current, longest: st.longest, active: st.active,
      windowDays: days.length, weeks: weeklyCounts(days),
      daily: days.map(function (d) { return d.count; }), start: days.length ? days[0].date : ""
    };
    for (var k in (extra || {})) a[k] = extra[k];
    return a;
  }

  function list(str) {
    return String(str || "").split(",").map(function (x) { return x.replace(/`/g, "").trim(); }).filter(Boolean);
  }
  function unique(arr) {
    var seen = {};
    return arr.filter(function (x) { var k = x.toLowerCase(); if (seen[k]) return false; seen[k] = true; return true; });
  }
  function chipNames(m, o) {
    return unique(list(o.stack).concat(m.langs.map(function (l) { return l.name; }))).slice(0, 8);
  }
  function safeId(s) {
    var t = String(s).replace(/[^\w .\-]/g, "").trim().slice(0, 30);
    return t || "repo";
  }

  /** Tools and topics shown as pills: the person's own skills first, then repo topics, minus language names. */
  function toolList(m, o) {
    var langNames = m.langs.map(function (l) { return l.name.toLowerCase(); });
    return unique(list(o.stack).concat(m.topics || [])).filter(function (t) {
      return langNames.indexOf(t.toLowerCase()) === -1;
    }).slice(0, 14);
  }

  /* ---------- profile tips ----------
   * Plain-language suggestions based on what the generator can see, plus a "polish" score. `focus` names the control that fixes it. */
  function tips(m, o) {
    o = withDefaults(o);
    var top = pickProjects(m, o);
    var undescribed = top.filter(function (r) { return !r.desc; }).length;
    var checks = [
      { id: "role", ok: !!oneLine(o.role), focus: "#role", text: "Add a job title. It's shown right after your name, so it's the first thing visitors read." },
      { id: "skills", ok: !!oneLine(o.stack) || (m.topics || []).length >= 3, focus: "#stack", text: "Add your skills and tools. They fill the chips on your banner and the Languages card." },
      { id: "linkedin", ok: !!oneLine(o.linkedin) || !o.links, focus: "#linkedin", text: "Add your LinkedIn so visitors can reach you from the Connect buttons." },
      { id: "descriptions", ok: !top.length || undescribed === 0, focus: "", text: undescribed + " of your top projects " + (undescribed === 1 ? "has" : "have") + " no description. Add one on GitHub so each project card says what the repo does." },
      { id: "activity", ok: !!(m.activity && m.activity.source === "graphql"), focus: "#token", text: "Add a token for a full-year heatmap and exact streaks. Without one, only 90 days of public activity can be shown." },
      { id: "website", ok: !!m.blog, focus: "", text: "Add a website to your GitHub profile to get a Website button in Connect." }
    ];
    if (!m.all.length) checks.push({ id: "repos", ok: false, focus: "", text: "No public repositories yet. Projects, languages and the timeline fill in as soon as you have some." });
    var passed = checks.filter(function (c) { return c.ok; }).length;
    return {
      score: Math.round(passed / checks.length * 100),
      passed: passed, total: checks.length,
      tips: checks.filter(function (c) { return !c.ok; }).map(function (c) { return { id: c.id, text: c.text, focus: c.focus }; })
    };
  }

  /* ---------- shareable links ----------
   * A link like ?user=DevopsNimbus&theme=cyber reopens the tool with the same choices, so people can share their setup. */
  var SHARE_TEXT = ["role", "tagline", "stack", "linkedin"];
  var SHARE_ACCENTS = ["accent1", "accent2"];
  // the 3D universe's colours: Git3D Universe's own cosmic palettes ("neon" is the option's original name, kept so saved choices and links still work), or the profile's own theme
  var UNIVERSE_STYLES = ["neon", "theme"];
  var SHARE_FLAGS = ["adaptive", "animate", "heatmap", "credit", "banner", "cards", "bars", "pie", "timeline", "proj", "recent", "links", "universe", "wave"];

  /** Only values that differ from the defaults go into the link, so links stay short. */
  function toQuery(user, options) {
    var o = withDefaults(options), q = new URLSearchParams();
    if (user) q.set("user", user);
    if (o.theme !== DEFAULTS.theme) q.set("theme", o.theme);
    if (o.style !== DEFAULTS.style) q.set("style", o.style);
    if (o.universeStyle !== DEFAULTS.universeStyle && UNIVERSE_STYLES.indexOf(o.universeStyle) !== -1) q.set("universeStyle", o.universeStyle);
    SHARE_TEXT.forEach(function (k) { if (o[k]) q.set(k, String(o[k]).slice(0, 160)); });
    SHARE_ACCENTS.forEach(function (k) { if (validHex(o[k])) q.set(k, o[k].toLowerCase()); });
    if (sectionOrder(o).join(",") !== SECTIONS.join(",")) q.set("order", sectionOrder(o).join(","));
    if (o.featured) q.set("featured", String(o.featured).slice(0, 400));
    SHARE_FLAGS.forEach(function (k) { if (o[k] !== DEFAULTS[k]) q.set(k, o[k] ? "1" : "0"); });
    return q.toString();
  }

  /** Reads a link back into { user, opts }. Unknown or invalid values are ignored, never trusted. */
  function fromQuery(search) {
    var q = new URLSearchParams(String(search || "").replace(/^\?/, "")), opts = {};
    var user = parseUser(q.get("user") || "");
    var theme = q.get("theme");
    if (theme && THEME_ORDER.indexOf(theme) !== -1) opts.theme = theme;
    var style = q.get("style");
    if (style === "showcase" || style === "changelog") opts.style = style;
    var ustyle = q.get("universeStyle");
    if (UNIVERSE_STYLES.indexOf(ustyle) !== -1) opts.universeStyle = ustyle;
    SHARE_TEXT.forEach(function (k) { var v = q.get(k); if (v) opts[k] = oneLine(v).slice(0, 160); });
    SHARE_ACCENTS.forEach(function (k) { var v = q.get(k); if (validHex(v)) opts[k] = v.toLowerCase(); });
    var ord = q.get("order");
    if (ord) { var clean = sectionOrder({ order: ord }); if (clean.join(",") !== SECTIONS.join(",")) opts.order = clean.join(","); }
    var feat = q.get("featured");
    if (feat) opts.featured = oneLine(feat).slice(0, 400);
    SHARE_FLAGS.forEach(function (k) { var v = q.get(k); if (v === "0" || v === "1") opts[k] = v === "1"; });
    return { user: user, opts: opts };
  }

  /* ---------- motion layer ----------
   * CSS animations inside an SVG keep running when GitHub shows it as an image, and scripts are not needed.
   * Only ambient loops (drift, pulse, shine, spin) are used, never entrance effects: GitHub re-creates every README
   * image on each page view, so fade-ins and grow-ins replayed on every visit and made the cards look slow to load.
   * Content is fully visible from the first frame, and reduced motion (or a viewer that ignores CSS) gets the same still. */
  function fxStyle(p, W) {
    if (!p.anim) return "";
    return "<style>" +
      "@keyframes fxd1{0%,100%{transform:translate(0,0)}50%{transform:translate(-34px,20px)}}" +
      "@keyframes fxd2{0%,100%{transform:translate(0,0)}50%{transform:translate(36px,-18px)}}" +
      "@keyframes fxpulse{0%,100%{opacity:1}50%{opacity:.3}}" +
      "@keyframes fxspin{to{transform:rotate(360deg)}}" +
      "@keyframes fxshine{from{transform:translateX(-" + Math.round(W * 0.4) + "px)}to{transform:translateX(" + W + "px)}}" +
      ".fx-d1{animation:fxd1 18s ease-in-out infinite}" +
      ".fx-d2{animation:fxd2 22s ease-in-out infinite}" +
      ".fx-pulse{animation:fxpulse 2.8s ease-in-out infinite}" +
      ".fx-spin{animation:fxspin 120s linear infinite}" +
      ".fx-shine{animation:fxshine 9s ease-in-out infinite}" +
      "@media (prefers-reduced-motion:reduce){*{animation:none!important}}" +
      "</style>";
  }
  /** class (and optional start delay) attributes for an animated element; empty when animation is off. */
  function fx(p, name, delay, extraStyle) {
    if (!p.anim) return extraStyle ? ' style="' + extraStyle + '"' : "";
    var st = (delay ? "animation-delay:" + delay + "s;" : "") + (extraStyle || "");
    return ' class="fx-' + name + '"' + (st ? ' style="' + st + '"' : "");
  }

  var DEFAULTS = {
    style: "showcase", theme: "auto", accent1: "", accent2: "", order: "", featured: "", adaptive: true, mode: "", suffix: "", animate: true, heatmap: true, credit: true, siteUrl: "", tagline: "", role: "", stack: "", linkedin: "",
    banner: true, cards: true, bars: true, pie: false, timeline: true, proj: true, recent: false, links: true, universe: true, universeStyle: "neon", wave: true
  };
  function withDefaults(o) {
    var out = {}, k;
    for (k in DEFAULTS) out[k] = DEFAULTS[k];
    for (k in (o || {})) if (o[k] !== undefined) out[k] = o[k];
    return out;
  }

  /* ---------- README sections ---------- */
  /** Width of a half-column card, in pixels so a phone still stacks them at near full size. Two of them plus the
   * 4px space between fill GitHub's 832px desktop README column (828px), so their outer edges line up with a 100% card. */
  var HALF = "412";

  function statsRow(m) {
    var heads = ["Repos", "Followers"], vals = [m.publicRepos, m.followers];
    if (m.since) { heads.push("On GitHub since"); vals.push(m.since); }
    if (m.langs.length) { heads.push("Top language"); vals.push(m.langs[0].name); }
    return "| " + heads.join(" | ") + " |\n| " + heads.map(function () { return ":---:"; }).join(" | ") + " |\n| " + vals.join(" | ") + " |";
  }

  /**
   * One README image. Normally a plain <img> pointing at ./file.
   * In adaptive mode it becomes a <picture>: GitHub shows the dark file to viewers on the dark theme
   * and the "-light" file to everyone else, so the profile always matches the viewer's setting.
   */
  function pic(o, file, attrs) {
    if (!o.adaptive) return '<img src="./' + file + '" ' + attrs + ">";
    return '<picture><source media="(prefers-color-scheme: dark)" srcset="./' + file + '"><img src="./' + file.replace(/\.svg$/, "-light.svg") + '" ' + attrs + "></picture>";
  }

  /** The line right after the name: job title (plus company when known), else the profile bio. */
  function designation(m, o) {
    var role = oneLine(o.role);
    if (role) {
      var co = String(m.company || "").replace(/^@/, "");
      return co && role.toLowerCase().indexOf(co.toLowerCase()) === -1 ? role + " at " + co : role;
    }
    return m.bio || "";
  }

  /** main = text under the name; extra = optional smaller tagline below it. */
  function subtitle(m, o) {
    var d = designation(m, o), t = oneLine(o.tagline);
    if (d) return { main: d, extra: t };
    return { main: t || m.location || "", extra: "" };
  }

  function header(m, o) {
    var out = ['<div align="center">', ""];
    if (o.banner) {
      // the banner already shows name, designation and skills, so only the alt text repeats them
      out.push(pic(o, "banner.svg", 'alt="' + esc(m.name + (designation(m, o) ? ", " + designation(m, o) : "")) + '" width="100%"'), "");
    } else {
      var sub = subtitle(m, o);
      out.push("# " + m.name, "");
      if (sub.main) out.push("**" + sub.main.replace(/[*`]/g, "") + "**", "");
      if (sub.extra) out.push(sub.extra.replace(/[*`]/g, ""), "");
      var chips = chipNames(m, o);
      if (chips.length) out.push(chips.map(function (c) { return "`" + c + "`"; }).join(" "), "");
    }
    if (!o.cards) out.push(statsRow(m), "");
    out.push("</div>", "");
    return out;
  }

  function stack(m, o) {
    var useCard = o.cards && (m.langs.length || toolList(m, o).length);
    if (!useCard && !m.langs.length) return [];
    var out = ["## Stack", ""];
    if (useCard) {
      out.push('<div align="center">', "", pic(o, "cards/languages.svg", 'alt="Languages and tools for ' + esc(m.login) + '" width="100%"'), "", "</div>", "");
    } else if (o.bars) {
      var w = Math.max.apply(null, m.langs.map(function (l) { return l.name.length; }));
      out.push("```text");
      m.langs.forEach(function (l) {
        out.push(l.name + " ".repeat(w - l.name.length) + "  " + bar(l.pct) + "  " + l.pct + "%");
      });
      out.push("```", "");
    }
    if (o.pie && m.langs.length && !useCard) {                // with cards on, the languages card draws it as a donut
      out.push("```mermaid", "pie showData title Repos by language");
      m.langs.forEach(function (l) { out.push('  "' + l.name.replace(/"/g, "") + '" : ' + l.n); });
      out.push("```", "");
    }
    if (!useCard && !o.bars && !o.pie) out.push(m.langs.map(function (l) { return "`" + l.name + "`"; }).join(" "), "");
    return out;
  }

  function projectsTable(m, o) {
    var shown = pickProjects(m, o);
    if (!shown.length) return [];
    if (!shown.some(function (r) { return r.desc; })) {
      var plain = ["## Projects", ""];
      shown.forEach(function (r) {
        plain.push("- [" + r.name + "](" + r.url + ")" + (r.lang ? " · " + r.lang : "") + (r.stars ? " · ★ " + r.stars : ""));
      });
      plain.push("");
      return plain;
    }
    var out = ["## Projects", "", "| Repo | What it does | Lang | Stars |", "| --- | --- | --- | ---: |"];
    shown.forEach(function (r) {
      out.push("| [" + cell(r.name) + "](" + r.url + ") | " + cell(r.desc || "-") + " | " + cell(r.lang || "-") + " | " + r.stars + " |");
    });
    out.push("");
    return out;
  }

  function projectsChangelog(m) {
    if (!m.all.length) return [];
    var byYear = {};
    m.all.forEach(function (r) { var y = (r.created || "0000").slice(0, 4); (byYear[y] = byYear[y] || []).push(r); });
    var out = ["## Changelog", ""];
    Object.keys(byYear).sort(function (a, b) { return b - a; }).slice(0, 4).forEach(function (y) {
      out.push("### " + y, "");
      byYear[y].sort(function (a, b) { return b.stars - a.stars; }).slice(0, 5).forEach(function (r) {
        out.push("- **Added** [`" + r.name + "`](" + r.url + ")" + (r.desc ? ": " + r.desc : "") + (r.stars ? " (" + r.stars + " stars)" : ""));
      });
      out.push("");
    });
    return out;
  }

  var CHANGELOG_YEARS = 4;

  /** Repos grouped by the year they were created: newest year first, most-starred first within a year. */
  function changelogData(m) {
    var byYear = {};
    m.all.forEach(function (r) {
      var y = String(r.created || "").slice(0, 4);
      if (/^\d{4}$/.test(y)) (byYear[y] = byYear[y] || []).push(r);
    });
    return Object.keys(byYear).sort(function (a, b) { return b - a; }).slice(0, CHANGELOG_YEARS).map(function (y) {
      return { year: y, entries: byYear[y].slice().sort(function (a, b) { return (b.stars - a.stars) || (a.name < b.name ? -1 : 1); }) };
    });
  }
  /** Which of the two new cards the README includes. */
  function wantsChangelog(m, o) { return !!(o.cards && o.proj && o.style === "changelog" && changelogData(m).length); }
  /** The 3D contribution universe: opt-in, card mode only, and only when there is activity to draw. */
  function wantsUniverse(m, o) { return !!(o.cards && o.universe && m.activity && m.activity.daily && m.activity.daily.length); }
  function wantsRecent(m, o) { return !!(o.cards && o.recent && m.recent && m.recent.length); }

  var MAX_PROJECT_CARDS = 6;
  var SECTIONS = ["stats", "stack", "timeline", "projects", "connect"];

  /** The repos to show. A chosen list wins (in the order given, unknown names ignored); otherwise the most-starred. */
  function pickProjects(m, o) {
    var names = list(o && o.featured), out = [], seen = {};
    names.forEach(function (n) {
      var r = m.all.filter(function (x) { return x.name.toLowerCase() === n.toLowerCase(); })[0];
      if (r && !seen[r.name]) { seen[r.name] = true; out.push(r); }
    });
    return (out.length ? out : m.top).slice(0, MAX_PROJECT_CARDS);
  }
  /** Section order: the person's list first (unknown or repeated entries ignored), then anything left in the default order. */
  function sectionOrder(o) {
    var out = [];
    list(o && o.order).map(function (k) { return k.toLowerCase(); }).forEach(function (k) {
      if (SECTIONS.indexOf(k) !== -1 && out.indexOf(k) === -1) out.push(k);
    });
    SECTIONS.forEach(function (k) { if (out.indexOf(k) === -1) out.push(k); });
    return out;
  }

  /** The links that appear in Connect: GitHub always, the rest only when we have them. */
  function connectItems(m, o) {
    var items = [{ key: "github", label: "GitHub", handle: "@" + m.login, url: "https://github.com/" + m.login }];
    var li = oneLine(o && o.linkedin);
    if (li) {
      var slug = li.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "").replace(/^\/+|\/+$/g, "");
      items.push({ key: "linkedin", label: "LinkedIn", handle: slug, url: /^https?:/i.test(li) ? li : "https://www.linkedin.com/in/" + slug });
    }
    if (m.blog) items.push({ key: "website", label: "Website", handle: m.blog.replace(/^https?:\/\//, "").replace(/\/+$/, ""), url: url(m.blog) });
    if (m.twitter) items.push({ key: "x", label: "X", handle: "@" + m.twitter, url: "https://x.com/" + m.twitter });
    if (m.email) items.push({ key: "email", label: "Email", handle: m.email, url: "mailto:" + m.email });
    return items;
  }

  function statsSection(m, o) {
    var two = !!m.activity;
    var out = ["## GitHub stats", "", '<div align="center">', ""];
    var heat = o.heatmap && m.activity && m.activity.daily && m.activity.daily.length;
    // one paragraph for the whole grid: side by side and stacked cards get the same small gutter, and the
    // half-width pair lines up with the full-width heatmap's edges instead of sitting indented inside it
    var grid = [pic(o, "cards/stats.svg", 'alt="GitHub stats for ' + esc(m.login) + '" width="' + HALF + '"')];
    if (two) grid.push(pic(o, "cards/streak.svg", 'alt="Contribution streak for ' + esc(m.login) + '" width="' + HALF + '"'));
    if (heat) grid.push(pic(o, "cards/activity.svg", 'alt="Contribution heatmap for ' + esc(m.login) + '" width="100%"'));
    if (wantsUniverse(m, o)) grid.push(pic(o, "cards/universe.svg", 'alt="Contribution universe for ' + esc(m.login) + '" width="100%"'));
    out.push(grid.join("\n"), "");
    out.push("</div>", "");
    return out;
  }

  function projectCards(m, o) {
    var top = pickProjects(m, o);
    if (!top.length) return [];
    var out = ["## Projects", "", '<div align="center">', ""];
    top.forEach(function (r, i) {
      out.push('<a href="' + esc(r.url) + '">' + pic(o, "cards/project-" + (i + 1) + ".svg", 'alt="' + esc(r.name) + '" width="' + HALF + '"') + "</a>");
    });
    out.push("", "</div>", "");
    return out;
  }

  function timeline(m, o) {
    if (!o.timeline || !m.all.length) return [];
    if (o.cards) {
      return ["## Timeline", "", '<div align="center">', "", pic(o, "cards/timeline.svg", 'alt="Timeline of repositories created by ' + esc(m.login) + '" width="100%"'), "", "</div>", ""];
    }
    var repos = m.all.filter(function (r) { return r.created; }).sort(function (a, b) { return a.created < b.created ? -1 : 1; }).slice(-8);
    var out = ["## Timeline", "", "```mermaid", "gitGraph"];
    if (m.since) out.push('   commit id: "Joined GitHub ' + m.since + '"');
    repos.forEach(function (r) { out.push('   commit id: "' + safeId(r.name) + '"'); });
    out.push("```", "");
    return out;
  }

  /** Card versions of the two sections: a heading, then one image. */
  function changelogSection(m, o) {
    if (!wantsChangelog(m, o)) return [];
    return ["## Changelog", "", '<div align="center">', "", pic(o, "cards/changelog.svg", 'alt="Changelog of repositories created by ' + esc(m.login) + '" width="100%"'), "", "</div>", ""];
  }
  function recentSection(m, o) {
    if (!wantsRecent(m, o)) return [];
    return ["## Recently pushed", "", '<div align="center">', "", pic(o, "cards/recent.svg", 'alt="Recently pushed repositories of ' + esc(m.login) + '" width="100%"'), "", "</div>", ""];
  }

  function recent(m) {
    if (m.all.length <= 3 || !m.recent.length) return [];
    var out = ["## Recently pushed", ""];
    m.recent.forEach(function (r) { out.push("- [" + r.name + "](" + r.url + "), " + r.pushed); });
    out.push("");
    return out;
  }

  function links(m, o) {
    var items = connectItems(m, o);
    if (o.cards) {
      var w = items.length === 4 ? "204" : "270";   // pixels: 3 (or 4 narrower) span the 832px desktop column like the cards above, and on a phone they stack at near full size
      var out = ["## Connect", "", '<div align="center">', ""];
      items.forEach(function (it) {
        out.push('<a href="' + esc(it.url) + '">' + pic(o, "cards/connect-" + it.key + ".svg", 'alt="' + esc(it.label) + '" width="' + w + '"') + "</a>");
      });
      out.push("", "</div>", "");
      return out;
    }
    return ["## Connect", "", '<div align="center">', "",
      items.map(function (it) { return "**[" + it.label + "](" + it.url + ")**"; }).join(" · "), "", "</div>", ""];
  }

  /** Footer line; the "Made with" credit links back to the site that generated the README, when it has an address. */
  function footer(o) {
    var base = "Patched together from public GitHub data";
    if (!o.credit) return "<sub>" + base + ".</sub>";
    return "<sub>" + base + " · " + (o.siteUrl ? 'made with <a href="' + esc(o.siteUrl) + '">Patch your profile</a>' : "made with Patch your profile") + "</sub>";
  }

  function buildReadme(m, options) {
    var o = withDefaults(options), L = [].concat(header(m, o));
    var cardProjects = o.cards && o.style !== "changelog";
    var parts = {
      stats: function () { return o.cards ? statsSection(m, o) : []; },
      stack: function () { return stack(m, o); },
      timeline: function () { return timeline(m, o); },
      projects: function () {
        var out = [];
        if (o.proj) out = out.concat(o.style === "changelog" ? (o.cards ? changelogSection(m, o) : projectsChangelog(m)) : cardProjects ? projectCards(m, o) : projectsTable(m, o));
        if (o.recent) out = out.concat(o.cards ? recentSection(m, o) : recent(m));
        return out;
      },
      connect: function () { return o.links ? links(m, o) : []; }
    };
    sectionOrder(o).forEach(function (k) { L = L.concat(parts[k]()); });
    if (o.wave && o.cards) L.push('<div align="center">', "", pic(o, "cards/footer.svg", 'alt="" width="100%"'), "", footer(o), "", "</div>", "");
    else L.push("---", footer(o), "");
    return L.join("\n");
  }

  /* ---------- banner: glass panel, aurora light and an orbit system seeded from the username ---------- */
  function initials(m) {
    var text = String(m.name || m.login);
    var words = text.split(/\s+/).filter(function (w) { return /[A-Za-z0-9]/.test(w); });
    // one word: split a CamelCase or hyphen/underscore/dot handle into its parts, so "DevopsNimbus" reads as DN
    if (words.length === 1) words = words[0].match(/[A-Z]+[0-9]*(?![a-z])|[A-Z][a-z0-9]*|[a-z0-9]+/g) || words;
    var out = words.slice(0, 2).map(function (w) { return w.replace(/[^A-Za-z0-9]/g, "").charAt(0); }).join("");
    return (out || String(m.login).charAt(0)).toUpperCase();
  }

  /* ---------- wave header and footer ----------
   * A gradient band in the theme's accents with gently drifting waves along its edge, the profile name and title
   * centred on it. Everything outside the waves is transparent, so it melts into GitHub's light or dark page.
   * Self-drawn (no outside image service); the waves move with CSS, so reduced motion gets a still picture. */
  function waveColours(p) {
    // white text must stay readable on every part of the band, so each stop is darkened just enough (3:1, large text)
    function deep(c) { var t = 0, x = c; while (contrast(x, "#ffffff") < 3 && t < 0.9) { t += 0.05; x = mixHex(c, "#000000", t); } return x; }
    return [deep(mixHex(p.a2, "#0b1020", 0.62)), deep(p.a2), deep(p.a1)];
  }
  /** A wave two widths long (one hump up and one down per width), so sliding it by one width loops seamlessly. */
  function wavePath(W, H, y, amp, fillBelow) {
    var d = "M0," + y + " Q" + (W / 4) + "," + (y - 2 * amp) + " " + (W / 2) + "," + y;
    for (var x = W; x <= 2 * W; x += W / 2) d += " T" + x + "," + y;
    return d + (fillBelow ? " L" + 2 * W + "," + H + " L0," + H : " L" + 2 * W + ",0 L0,0") + " Z";
  }
  function waveLayers(W, H, p, layers) {
    var style = p.anim
      ? "<style>@keyframes wvl{to{transform:translateX(-" + W + "px)}}@keyframes wvr{from{transform:translateX(-" + W + "px)}to{transform:translateX(0)}}" +
        ".wv-l{animation:wvl 22s linear infinite}.wv-r{animation:wvr 31s linear infinite}" +
        "@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>"
      : "";
    // the gradient stays put on the band; each moving wave is only a mask that cuts its shape out of it
    return style + layers.map(function (l, i) {
      return '<mask id="wm' + i + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '"><g' + (p.anim ? ' class="' + l.cls + '"' : "") + '><path d="' + wavePath(W, H, l.y, l.amp, l.below) + '" fill="#ffffff"/></g></mask>' +
        '<rect width="' + W + '" height="' + H + '" fill="url(#wave)" mask="url(#wm' + i + ')"' + (l.op < 1 ? ' fill-opacity="' + l.op + '"' : "") + "/>";
    }).join("");
  }
  function waveDefs(p) {
    var c = waveColours(p);
    return "<defs>" +
      '<linearGradient id="wave" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="0.48" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient>' +
      '<filter id="lift" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000000" flood-opacity="0.28"/></filter>' +
      "</defs>";
  }
  /** Largest font size (up to max) at which text of this length fits the width, roughly, for a bold sans face. */
  function fitSize(text, max, min, width, k) { return Math.max(min, Math.min(max, Math.floor(width / (Math.max(1, String(text).length) * k)))); }
  function clip(text, size, width, k) { var n = Math.floor(width / (size * k)); return text.length > n ? text.slice(0, Math.max(1, n - 1)) + "\u2026" : text; }

  function buildWaveBanner(m, o, p) {
    var W = 1200, H = 260, SANS = "system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";
    var sub = subtitle(m, o), line2 = [sub.main].concat(list(o.stack).slice(0, 3)).filter(Boolean).join(" | "), line3 = sub.main ? sub.extra : "";
    var name = m.name || m.login, ns = fitSize(name, 64, 30, 1080, 0.6), ss = fitSize(line2, 22, 14, 1080, 0.56);
    var out = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(name + (line2 ? ", " + line2 : "")) + '" font-family="' + SANS + '">' +
      waveDefs(p) +
      waveLayers(W, H, p, [
        { cls: "wv-r", y: 222, amp: 15, op: p.light ? 0.45 : 0.6 },
        { cls: "wv-l", y: 206, amp: 11, op: 1 }
      ]);
    var ty = line2 ? (line3 ? 96 : 108) : 122;
    out += '<g fill="#ffffff" text-anchor="middle" filter="url(#lift)">' +
      '<text x="' + W / 2 + '" y="' + ty + '" font-size="' + ns + '" font-weight="700" letter-spacing="-0.5">' + esc(clip(name, ns, 1100, 0.6)) + "</text>" +
      (line2 ? '<text x="' + W / 2 + '" y="' + (ty + 50) + '" font-size="' + ss + '" font-weight="600">' + esc(clip(line2, ss, 1100, 0.56)) + "</text>" : "") +
      (line3 ? '<text x="' + W / 2 + '" y="' + (ty + 82) + '" font-size="16" fill-opacity="0.85">' + esc(clip(line3, 16, 1000, 0.52)) + "</text>" : "") +
      "</g></svg>";
    return out;
  }
  /** The footer: the same waves, flipped, filling the bottom edge. */
  function buildWaveFooter(m, options) {
    var o = withDefaults(options), p = paletteFor(m.login, o), W = 1200, H = 120;
    p.anim = o.animate !== false;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Footer">' +
      waveDefs(p) +
      waveLayers(W, H, p, [
        { cls: "wv-l", y: 34, amp: 13, op: p.light ? 0.45 : 0.6, below: true },
        { cls: "wv-r", y: 52, amp: 10, op: 1, below: true }
      ]) + "</svg>";
  }

  function buildBanner(m, options) {
    var o = withDefaults(options), p = paletteFor(m.login, o), r = rng(p.seed), L = p.light, I = p.ink;
    p.anim = o.animate !== false;
    if (o.wave) return buildWaveBanner(m, o, p);
    var W = 1200, H = 320, out = [];
    var SANS = "system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";
    var MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
    out.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(m.name) + '">');
    out.push("<defs>" +
      '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.bg1 + '"/><stop offset="1" stop-color="' + p.bg2 + '"/></linearGradient>' +
      '<radialGradient id="au1"><stop offset="0" stop-color="' + p.a1 + '" stop-opacity="' + (L ? 0.32 : 0.5) + '"/><stop offset="1" stop-color="' + p.a1 + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="au2"><stop offset="0" stop-color="' + p.a2 + '" stop-opacity="' + (L ? 0.3 : 0.5) + '"/><stop offset="1" stop-color="' + p.a2 + '" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (L ? "#ffffff" : I) + '" stop-opacity="' + (L ? 0.95 : 0.45) + '"/><stop offset="0.5" stop-color="' + I + '" stop-opacity="0.06"/><stop offset="1" stop-color="' + p.a2 + '" stop-opacity="0.6"/></linearGradient>' +
      '<linearGradient id="hl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="' + (L ? 0.95 : 0.65) + '"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="acc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.a1 + '"/><stop offset="1" stop-color="' + p.a2 + '"/></linearGradient>' +
      '<linearGradient id="name" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + I + '"/><stop offset="0.55" stop-color="' + I + '"/><stop offset="1" stop-color="' + p.a1 + '"/></linearGradient>' +
      '<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="' + I + '" fill-opacity="' + (L ? 0.12 : 0.09) + '"/></pattern>' +
      '<clipPath id="clip"><rect width="' + W + '" height="' + H + '" rx="' + (p.native ? 16 : 24) + '"/></clipPath>' +
      "</defs>" + fxStyle(p, W));
    out.push('<g clip-path="url(#clip)">');
    out.push('<rect width="' + W + '" height="' + H + '" fill="url(#bg)"/>');
    if (!p.native) {                   // a native-surface banner is the page itself: no dots, no aurora wash
      out.push('<rect width="' + W + '" height="' + H + '" fill="url(#dots)"/>');
      out.push("<g" + fx(p, "d1") + '><circle cx="1060" cy="-40" r="520" fill="url(#au1)"/></g>');
      out.push("<g" + fx(p, "d2") + '><circle cx="80" cy="380" r="470" fill="url(#au2)"/></g>');
      out.push('<circle cx="640" cy="330" r="260" fill="url(#au1)" opacity="0.5"/>');
    }

    // orbit system: three rings, a glowing arc and one node per repo (up to 9); the whole system turns slowly
    var ox = 1010, oy = 160, radii = [66, 106, 144];
    out.push("<g" + fx(p, "spin", 0, "transform-origin:" + ox + "px " + oy + "px") + ">");
    radii.forEach(function (R, i) {
      out.push('<circle cx="' + ox + '" cy="' + oy + '" r="' + R + '" fill="none" stroke="' + I + '" stroke-opacity="' + (0.13 - i * 0.03).toFixed(2) + '"' + (i === 1 ? ' stroke-dasharray="2 7"' : "") + "/>");
    });
    var C = 2 * Math.PI * 106, rot = Math.round(r() * 360);
    out.push('<circle cx="' + ox + '" cy="' + oy + '" r="106" fill="none" stroke="url(#acc)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="' + (C * 0.28).toFixed(1) + " " + C.toFixed(1) + '" transform="rotate(' + rot + " " + ox + " " + oy + ')" filter="url(#glow)"/>');
    var count = Math.max(3, Math.min(9, m.all.length || 3));
    for (var i = 0; i < count; i++) {
      var R = radii[i % 3], ang = r() * Math.PI * 2, nx = ox + R * Math.cos(ang), ny = oy + R * Math.sin(ang);
      var col = i % 2 ? p.a2 : p.a1, size = 3 + r() * 2.5;
      out.push('<line x1="' + ox + '" y1="' + oy + '" x2="' + nx.toFixed(1) + '" y2="' + ny.toFixed(1) + '" stroke="' + col + '" stroke-opacity="0.12"/>');
      out.push('<circle cx="' + nx.toFixed(1) + '" cy="' + ny.toFixed(1) + '" r="' + size.toFixed(1) + '" fill="' + col + '" filter="url(#glow)"/>');
    }
    out.push("</g>");
    out.push('<circle cx="' + ox + '" cy="' + oy + '" r="50" fill="' + p.bg1 + '" fill-opacity="0.6"/>');
    out.push('<circle cx="' + ox + '" cy="' + oy + '" r="50" fill="' + I + '" fill-opacity="0.06" stroke="url(#acc)" stroke-width="1.5"/>');
    out.push('<text x="' + ox + '" y="' + (oy + 12) + '" text-anchor="middle" font-family="' + SANS + '" font-size="34" font-weight="800" letter-spacing="1" fill="url(#acc)">' + esc(initials(m)) + "</text>");

    // glass sheen over everything (a native-surface banner gets GitHub's hairline border instead)
    if (!p.native) {
      out.push('<rect width="' + W + '" height="' + H + '" fill="' + I + '" fill-opacity="0.03"/>');
      out.push('<rect x="40" y="0.6" width="' + (W - 80) + '" height="1.4" fill="url(#hl)"/>');
      out.push('<rect x="0" y="0.5" width="' + Math.round(W * 0.28) + '" height="1.8" fill="url(#hl)"' + fx(p, "shine") + "/>");
    }
    out.push("</g>");
    out.push(p.native
      ? '<rect x="0.5" y="0.5" width="' + (W - 1) + '" height="' + (H - 1) + '" rx="15.5" fill="none" stroke="' + p.line + '"/>'
      : '<rect x="0.75" y="0.75" width="' + (W - 1.5) + '" height="' + (H - 1.5) + '" rx="23.5" fill="none" stroke="url(#edge)" stroke-width="1.5"/>');

    // text block
    var handle = ["@" + m.login.toUpperCase()];
    if (m.location) handle.push(m.location.toUpperCase().slice(0, 22));
    if (m.since) handle.push("SINCE " + m.since);
    out.push("<g>");
    out.push('<circle cx="70" cy="64" r="4.5" fill="' + p.a1 + '" filter="url(#glow)"' + fx(p, "pulse") + "/>");
    out.push('<text x="86" y="71" font-family="' + MONO + '" font-size="20" letter-spacing="2.5" fill="' + p.a1 + '">' + esc(handle.join(" · ")) + "</text>");
    var name = m.name.length > 22 ? m.name.slice(0, 21) + "…" : m.name;
    var size = name.length > 16 ? 62 : 76;
    out.push('<text x="62" y="152" font-family="' + SANS + '" font-size="' + size + '" font-weight="800" letter-spacing="-1.5" fill="url(#name)">' + esc(name) + "</text>");
    var sub = subtitle(m, o);
    if (sub.main.length > 46) sub.main = sub.main.slice(0, 45) + "…";
    if (sub.main) out.push('<text x="64" y="200" font-family="' + SANS + '" font-size="31" font-weight="500" fill="' + I + '" fill-opacity="0.9">' + esc(sub.main) + "</text>");
    if (sub.extra.length > 62) sub.extra = sub.extra.slice(0, 61) + "…";
    if (sub.extra) out.push('<text x="64" y="232" font-family="' + SANS + '" font-size="21" fill="' + I + '" fill-opacity="0.58">' + esc(sub.extra) + "</text>");
    var cy = sub.extra ? 252 : 228, x = 64;
    chipNames(m, o).slice(0, 4).forEach(function (label) {
      var w = Math.round(label.length * 11.6 + 40);
      out.push('<rect x="' + x + '" y="' + cy + '" width="' + w + '" height="42" rx="21" fill="' + I + '" fill-opacity="0.07" stroke="' + I + '" stroke-opacity="0.22"/>');
      out.push('<rect x="' + (x + 18) + '" y="' + (cy + 0.6) + '" width="' + (w - 36) + '" height="1" fill="url(#hl)"/>');
      out.push('<text x="' + (x + w / 2) + '" y="' + (cy + 27.5) + '" text-anchor="middle" font-family="' + SANS + '" font-size="19" font-weight="500" fill="' + I + '" fill-opacity="0.94">' + esc(label) + "</text>");
      x += w + 12;
    });
    out.push("</g>");
    out.push("</svg>");
    return out.join("\n");
  }

  /* ---------- built-in sample so the tool works offline ---------- */
  var sampleDays = [];
  for (var di = 0; di < 90; di++) {
    var c = di % 9 < 2 ? 0 : (di * 37) % 7 + 1;
    if (di >= 78) c = (di * 37) % 7 + 1;
    sampleDays.push({ date: dayKey(Date.UTC(2026, 6, 9) + di * 86400000), count: c });
  }
  var SAMPLE = buildModel(
    { login: "DevopsNimbus", name: "DevopsNimbus", bio: "Platform engineer who keeps pagers quiet.", company: "Northwind", location: "Remote", blog: "nimbus.example", twitter_username: "nimbus_example", followers: 212, following: 48, public_repos: 5, created_at: "2019-03-02T00:00:00Z" },
    [
      { name: "tf-guardrails", html_url: "https://github.com/DevopsNimbus/tf-guardrails", description: "Policy checks for Terraform plans", language: "Go", stargazers_count: 84, pushed_at: "2026-09-28T00:00:00Z", created_at: "2025-02-11T00:00:00Z", topics: ["terraform", "policy", "aws"] },
      { name: "pager-notes", html_url: "https://github.com/DevopsNimbus/pager-notes", description: "Runbook templates from real incidents", language: "Markdown", stargazers_count: 41, pushed_at: "2026-09-02T00:00:00Z", created_at: "2024-06-20T00:00:00Z", topics: ["sre", "runbooks"] },
      { name: "ecs-rollout", html_url: "https://github.com/DevopsNimbus/ecs-rollout", description: "Blue/green deploys for ECS services", language: "Python", stargazers_count: 19, pushed_at: "2026-07-14T00:00:00Z", created_at: "2023-10-01T00:00:00Z", topics: ["aws", "ecs"] },
      { name: "dotfiles", html_url: "https://github.com/DevopsNimbus/dotfiles", description: "", language: "Shell", stargazers_count: 3, pushed_at: "2026-05-01T00:00:00Z", created_at: "2021-01-05T00:00:00Z", topics: [] },
      { name: "slo-calc", html_url: "https://github.com/DevopsNimbus/slo-calc", description: "Error-budget calculator", language: "Go", stargazers_count: 7, pushed_at: "2026-03-10T00:00:00Z", created_at: "2022-08-19T00:00:00Z", topics: ["sre"] }
    ],
    makeActivity(sampleDays, { source: "public", commits: 1243, prs: 87, issues: 21, reviews: 58 }));

  return {
    parseUser: parseUser, buildModel: buildModel, buildReadme: buildReadme,
    buildBanner: buildBanner, buildWaveFooter: buildWaveFooter, SAMPLE: SAMPLE, DEFAULTS: DEFAULTS,
    palette: palette, streaks: streaks, weeklyCounts: weeklyCounts, daysFromEvents: daysFromEvents,
    makeActivity: makeActivity, MAX_PROJECT_CARDS: MAX_PROJECT_CARDS, toolList: toolList, connectItems: connectItems, designation: designation,
    THEMES: THEMES, THEME_ORDER: THEME_ORDER, fxStyle: fxStyle, fx: fx,
    toQuery: toQuery, fromQuery: fromQuery, contrast: contrast, tips: tips, changelogData: changelogData, wantsChangelog: wantsChangelog, wantsRecent: wantsRecent, wantsUniverse: wantsUniverse, hash: hash, initials: initials, subtitle: subtitle, chipNames: chipNames, paletteFor: paletteFor, mixHex: mixHex, pickProjects: pickProjects, sectionOrder: sectionOrder, SECTIONS: SECTIONS, validHex: validHex
  };
});
