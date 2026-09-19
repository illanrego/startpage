const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "startpage.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "startpage.css"), "utf8");
const migration = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260919000000_content_posts.sql"),
  "utf8",
);

test("the Content board window is present and reachable like other features", () => {
  assert.match(html, /id="contentContainer"/);
  assert.match(html, /id="contentBoardGrid"/);
  assert.match(html, /id="contentLaneLegend"/);
  assert.match(html, /id="contentMonthNav"/);
  assert.match(html, /id="contentStatus"/);
  assert.match(html, /hideQuadro\('contentContainer'\)/);
  assert.match(html, /content-core\.js\?v=/);
  // Desktop icon + start menu entry.
  assert.match(html, /id="contentIconDiv"/);
});

test("the board renders lanes per day and a square window frame", () => {
  assert.match(app, /function renderContentBoard\(\)/);
  assert.match(app, /function initContentBoard\(\)/);
  assert.match(app, /function buildContentLaneLegend\(/);
  assert.match(app, /core\.CONTENT_LANES/);
  assert.match(app, /draggable\("contentContainer"\)/);
  assert.match(app, /makeResizable\("contentContainer",/);
  assert.match(app, /onResize: scheduleContentBoardRender/);
  const flexQuadros = /const flexQuadros = \[(.*?)\];/.exec(app);
  assert.ok(flexQuadros, "flexQuadros list is present");
  assert.match(flexQuadros[1], /"contentContainer"/);
  assert.match(css, /\.content-board-grid \{/);
  assert.match(css, /\.content-lane-dot \{/);
  assert.match(css, /\.content-day \{/);
});

test("opening the Content window repaints the board", () => {
  assert.match(app, /if \(opening && idQuadro === "contentContainer"\) \{\s*scheduleContentBoardRender\(\);/);
});

test("a lane mark is local-first and mirrored to content_posts when signed in", () => {
  assert.match(app, /const CONTENT_POSTS_STORAGE_KEY = "contentPosts_v1"/);
  assert.match(app, /async function toggleContentPost\(dateKey, lane\)/);
  assert.match(app, /async function loadContentBackendState\(\)/);
  assert.match(app, /from\("content_posts"\)/);
  assert.match(app, /onConflict: "user_id,lane,posted_on"/);
  assert.match(app, /writeLocalContentPosts/);

  // The migration matches the client: lane check + the upsert conflict target.
  assert.match(migration, /create table if not exists public\.content_posts/);
  assert.match(migration, /unique \(user_id, lane, posted_on\)/);
  assert.match(migration, /content_posts_lane_valid/);
  assert.match(migration, /content_posts_all_own/);
});
