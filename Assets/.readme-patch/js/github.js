/*
 * github.js: fetches public profile data from the GitHub API.
 * Browser: window.ReadmeGitHub.fetchProfile(username, { token })
 * Node 18+: require("./github.js").fetchProfile(username, { token })
 *
 * Activity numbers (commits, pull requests, issues, code reviews, streaks):
 *   - with a token: one GraphQL call, exact contribution calendar and totals for the past year
 *   - without a token: the search API for all-time totals, and the public events feed (max 90 days) for streaks
 * A token that GraphQL won't accept for contributions (for example the temporary GITHUB_TOKEN of a GitHub Action)
 * falls back to the public path. If the public path can't read anything at all, activity is reported as unavailable
 * (null) instead of as a believable-looking set of zeros, so a scheduled run can refuse to overwrite good data.
 * GITHUB_API_URL (set automatically inside GitHub Actions) overrides the API address in Node.
 */
(function (root, factory) {
  var core = (typeof module === "object" && module.exports) ? require("./core.js") : root.ReadmeCore;
  var api = factory(core);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ReadmeGitHub = api;
})(typeof self !== "undefined" ? self : this, function (core) {
  "use strict";

  var API = ((typeof process === "object" && process.env && process.env.GITHUB_API_URL) || "https://api.github.com").replace(/\/+$/, "");

  function headers(opts) {
    var h = { Accept: "application/vnd.github+json" };
    if (opts.token) h.Authorization = "Bearer " + opts.token;
    return h;
  }

  function check(r) {
    if (r.status === 404) throw new Error("No GitHub user with that name. Check the spelling of the link.");
    if (r.status === 401) throw new Error("GitHub rejected the token. Remove it or paste a valid one.");
    if (r.status === 403 || r.status === 429) {
      throw new Error("GitHub's rate limit is used up. Wait a while, or add a token to raise the limit.");
    }
    if (!r.ok) throw new Error("GitHub answered with status " + r.status + ". Try again in a moment.");
    return r.json();
  }

  function request(path, opts) {
    var f = opts.fetch || fetch;
    return f(API + path, { headers: headers(opts) }).then(check);
  }

  /* ---------- activity ---------- */
  var GQL = "query($login:String!){user(login:$login){contributionsCollection{totalCommitContributions" +
    " totalPullRequestContributions totalIssueContributions totalPullRequestReviewContributions contributionCalendar{totalContributions" +
    " weeks{contributionDays{date contributionCount}}}}}}";

  function activityGraphQL(username, opts) {
    var f = opts.fetch || fetch;
    var h = headers(opts); h["Content-Type"] = "application/json";
    return f(API + "/graphql", {
      method: "POST", headers: h, body: JSON.stringify({ query: GQL, variables: { login: username } })
    }).then(check).then(function (res) {
      var cc = res && res.data && res.data.user && res.data.user.contributionsCollection;
      if (!cc) throw new Error("No contribution data returned.");
      var days = [];
      cc.contributionCalendar.weeks.forEach(function (w) {
        w.contributionDays.forEach(function (d) { days.push({ date: d.date, count: d.contributionCount }); });
      });
      return core.makeActivity(days, {
        source: "graphql", total: cc.contributionCalendar.totalContributions,
        commits: cc.totalCommitContributions, prs: cc.totalPullRequestContributions, issues: cc.totalIssueContributions,
        reviews: cc.totalPullRequestReviewContributions
      });
    });
  }

  function activityPublic(username, opts) {
    var q = encodeURIComponent("author:" + username), rq = encodeURIComponent("reviewed-by:" + username), failed = 0, asked = 0;
    // some requests may fail (a search rate limit, say) and the rest still give a useful picture; but if ALL fail we must say so
    function soft(promise, fallback) { asked++; return promise.catch(function () { failed++; return fallback; }); }
    function total(path) { return soft(request(path, opts).then(function (r) { return typeof r.total_count === "number" ? r.total_count : null; }), null); }
    var pages = [1, 2, 3].map(function (n) {
      return soft(request("/users/" + encodeURIComponent(username) + "/events/public?per_page=100&page=" + n, opts), []);
    });
    return Promise.all([
      total("/search/issues?q=" + q + "+type:pr&per_page=1"),
      total("/search/issues?q=" + q + "+type:issue&per_page=1"),
      total("/search/commits?q=" + q + "&per_page=1"),
      total("/search/issues?q=" + rq + "+type:pr&per_page=1"),
      Promise.all(pages)
    ]).then(function (res) {
      if (failed === asked) throw new Error("GitHub activity could not be read.");
      var events = [].concat.apply([], res[4]);
      var days = core.daysFromEvents(events, Date.now());
      return core.makeActivity(days, { source: "public", prs: res[0], issues: res[1], commits: res[2], reviews: res[3] });
    });
  }

  function fetchActivity(username, opts) {
    var run = opts.token
      ? activityGraphQL(username, opts).catch(function () { return activityPublic(username, opts); })
      : activityPublic(username, opts);
    return run.catch(function () { return null; });
  }

  /** Resolves with a model ready for core.buildReadme and the card builders. */
  function fetchProfile(username, opts) {
    opts = opts || {};
    var u = encodeURIComponent(username);
    return Promise.all([
      request("/users/" + u, opts),
      request("/users/" + u + "/repos?per_page=100&sort=pushed&type=owner", opts),
      fetchActivity(username, opts)
    ]).then(function (res) { return core.buildModel(res[0], res[1], res[2]); });
  }

  return { fetchProfile: fetchProfile, fetchActivity: fetchActivity };
});
