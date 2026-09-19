const test = require("node:test");
const assert = require("node:assert/strict");
const ContentCore = require("../content-core.js");

test("the lane set is the contentflow lane set", () => {
  assert.deepEqual(ContentCore.laneCodes(), [
    "standup",
    "comics",
    "moc",
    "teacher",
    "freela",
  ]);
  assert.equal(ContentCore.isContentLane("moc"), true);
  assert.equal(ContentCore.isContentLane("coding"), false);
  assert.equal(ContentCore.laneMeta("standup").label, "Stand Up");
});

test("the month grid is Monday-first and always whole weeks", () => {
  // September 2026 starts on a Tuesday -> one Monday-first pad cell.
  const grid = ContentCore.monthGrid(2026, 8);
  assert.equal(grid.startPad, 1);
  assert.equal(grid.daysInMonth, 30);
  assert.equal(grid.totalCells % 7, 0);
  assert.equal(grid.rowCount, grid.totalCells / 7);

  const first = grid.cells[grid.startPad];
  assert.equal(first.day, 1);
  assert.equal(first.inMonth, true);
  assert.equal(first.dateKey, "2026-09-01");

  const pad = grid.cells[0];
  assert.equal(pad.inMonth, false);
  assert.equal(pad.dateKey, "2026-08-31");
});

test("posts only keep known lanes on well-formed dates", () => {
  const posts = ContentCore.normalizePosts({
    "2026-09-01": { standup: true, coding: true, teacher: false },
    "not-a-date": { standup: true },
    "2026-09-02": null,
  });
  assert.deepEqual(posts, { "2026-09-01": { standup: true } });
});

test("toggling a lane flips it without mutating the input", () => {
  const start = { "2026-09-01": { standup: true } };
  const on = ContentCore.togglePost(start, "2026-09-01", "moc");
  assert.equal(on.posted, true);
  assert.deepEqual(on.posts["2026-09-01"], { standup: true, moc: true });
  assert.deepEqual(start, { "2026-09-01": { standup: true } });

  const off = ContentCore.togglePost(on.posts, "2026-09-01", "standup");
  assert.equal(off.posted, false);
  assert.deepEqual(off.posts["2026-09-01"], { moc: true });

  const empty = ContentCore.togglePost(off.posts, "2026-09-01", "moc");
  assert.deepEqual(empty.posts, {});
});

test("toggling ignores unknown lanes and bad dates", () => {
  const posts = {};
  assert.equal(ContentCore.togglePost(posts, "2026-09-01", "coding").posted, false);
  assert.equal(ContentCore.togglePost(posts, "nope", "moc").posted, false);
  assert.deepEqual(ContentCore.togglePost(posts, "2026-09-01", "moc").posts, {
    "2026-09-01": { moc: true },
  });
});

test("lanesOn lists the lanes posted on a day in legend order", () => {
  const posts = ContentCore.normalizePosts({
    "2026-09-01": { moc: true, standup: true },
  });
  assert.deepEqual(ContentCore.lanesOn(posts, "2026-09-01"), ["standup", "moc"]);
  assert.deepEqual(ContentCore.lanesOn(posts, "2026-09-02"), []);
});

test("lane summary counts the month and remembers the last posted date", () => {
  const posts = ContentCore.normalizePosts({
    "2026-08-30": { moc: true },
    "2026-09-01": { moc: true, standup: true },
    "2026-09-03": { standup: true },
  });
  const summary = ContentCore.laneSummary(posts, 2026, 7);
  assert.deepEqual(summary.moc, { count: 1, lastDateKey: "2026-09-01" });
  assert.deepEqual(summary.standup, { count: 0, lastDateKey: "2026-09-03" });
  assert.deepEqual(summary.freela, { count: 0, lastDateKey: "" });

  // The September view counts both September posts for standup.
  const september = ContentCore.laneSummary(posts, 2026, 8);
  assert.equal(september.standup.count, 2);
  assert.equal(september.moc.count, 1);
});
