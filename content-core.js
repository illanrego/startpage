(function attachContentCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ContentCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createContentCore() {
  "use strict";

  // The content lanes = the contentflow lane set (moc, teacher, standup,
  // comics, freela). Order here is the order shown in the legend and the
  // order of the per-day lane dots inside a calendar cell.
  const CONTENT_LANES = [
    { code: "standup", label: "Stand Up", color: "#ef5350" },
    { code: "comics", label: "Comics Legendados", color: "#7e57c2" },
    { code: "moc", label: "MoC / Personal", color: "#ff8a00" },
    { code: "teacher", label: "Nerd / Teacher", color: "#00c853" },
    { code: "freela", label: "Freela", color: "#00bcd4" },
  ];

  const LANES_BY_CODE = Object.fromEntries(CONTENT_LANES.map((lane) => [lane.code, lane]));

  function laneCodes() {
    return CONTENT_LANES.map((lane) => lane.code);
  }

  function isContentLane(code) {
    return Object.prototype.hasOwnProperty.call(LANES_BY_CODE, String(code || ""));
  }

  function laneMeta(code) {
    return LANES_BY_CODE[String(code || "")] || null;
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  /** "YYYY-MM-DD" for a 0-based month, matching the tracker date key. */
  function dateKey(year, month, day) {
    return `${year}-${pad2(month + 1)}-${pad2(day)}`;
  }

  function parseDateKey(key) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Monday-first month grid. `cells` is always a whole number of weeks so the
   * grid never has a ragged last row.
   */
  function monthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const startPad = (firstDay.getDay() + 6) % 7;
    const total = daysInMonth(year, month);
    const totalCells = Math.ceil((startPad + total) / 7) * 7;

    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      const date = new Date(year, month, 1 - startPad + i);
      cells.push({
        day: date.getDate(),
        inMonth: i >= startPad && i < startPad + total,
        dateKey: dateKey(date.getFullYear(), date.getMonth(), date.getDate()),
      });
    }

    return {
      year,
      month,
      startPad,
      daysInMonth: total,
      totalCells,
      rowCount: totalCells / 7,
      cells,
    };
  }

  /**
   * Posts are stored as { "YYYY-MM-DD": { <lane>: true } } - a lane is either
   * posted on that day or not. Unknown lanes and malformed keys are dropped.
   */
  function normalizePosts(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const out = {};
    Object.keys(source).forEach((key) => {
      const parsed = parseDateKey(key);
      if (!parsed) return;
      const lanes = source[key];
      if (!lanes || typeof lanes !== "object") return;
      const kept = {};
      Object.keys(lanes).forEach((lane) => {
        if (lane === "_note") return;
        if (!isContentLane(lane)) return;
        if (!lanes[lane]) return;
        kept[lane] = true;
      });
      if (Object.keys(kept).length > 0) out[key] = kept;
    });
    return out;
  }

  function isPosted(posts, key, lane) {
    const day = posts && posts[key];
    return Boolean(day && day[lane]);
  }

  function lanesOn(posts, key) {
    const day = (posts && posts[key]) || {};
    return laneCodes().filter((lane) => Boolean(day[lane]));
  }

  /** Returns the posts map with `lane` flipped on `key`; never mutates input. */
  function togglePost(posts, key, lane) {
    if (!isContentLane(lane)) return { posts: normalizePosts(posts), posted: false };
    const parsed = parseDateKey(key);
    if (!parsed) return { posts: normalizePosts(posts), posted: false };

    const next = normalizePosts(posts);
    const day = { ...(next[key] || {}) };
    const posted = !day[lane];
    if (posted) day[lane] = true;
    else delete day[lane];

    if (Object.keys(day).length > 0) next[key] = day;
    else delete next[key];

    return { posts: next, posted };
  }

  /** Per-lane month count + the most recent posted date overall. */
  function laneSummary(posts, year, month) {
    const clean = normalizePosts(posts);
    const summary = {};
    laneCodes().forEach((lane) => {
      summary[lane] = { count: 0, lastDateKey: "" };
    });

    const monthPrefix = `${year}-${pad2(month + 1)}`;
    Object.keys(clean)
      .sort()
      .forEach((key) => {
        Object.keys(clean[key]).forEach((lane) => {
          const entry = summary[lane];
          if (!entry) return;
          if (key.startsWith(monthPrefix)) entry.count += 1;
          entry.lastDateKey = key;
        });
      });

    return summary;
  }

  return {
    CONTENT_LANES,
    laneCodes,
    isContentLane,
    laneMeta,
    dateKey,
    parseDateKey,
    daysInMonth,
    monthGrid,
    normalizePosts,
    isPosted,
    lanesOn,
    togglePost,
    laneSummary,
  };
});
