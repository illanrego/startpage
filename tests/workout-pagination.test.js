const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appPath = path.join(__dirname, "..", "workout-v2.js");

test("Workout V2 paginates dense views and binds delegation only once", () => {
  const app = fs.readFileSync(appPath, "utf8");
  assert.match(app, /const WORKOUT_V2_PAGE_SIZE =/);
  assert.match(app, /function workoutV2Paginate\(/);
  assert.match(app, /data-action="page"/);
  assert.match(app, /workoutV2BindEventsBound/);
  assert.match(app, /workoutV2RenderPagination\("Log"/);
  assert.match(app, /workoutV2RenderPagination\("Templates"/);
  assert.match(app, /workoutV2RenderPagination\("History"/);
  assert.match(app, /workoutV2RenderPagination\("Progress"/);
  assert.match(app, /await workoutV2ReconcileAllDates\(\)/);
  assert.match(app, /function workoutV2ExerciseGroups\(/);
  assert.match(app, /Add exercise/);
  assert.match(app, /Add set/);
  assert.match(app, /Set type/);
  assert.doesNotMatch(app, /<th>Set order<\/th>/);
});

test("Workout V2 uses neutral Win98 button/panel colors", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "workout-v2.css"), "utf8");
  assert.doesNotMatch(css, /background:\s*#b8dca7/);
  assert.doesNotMatch(css, /background:\s*#(?:00c853|00ff00|008000)/i);
  assert.match(css, /workout-v2-primary[\s\S]*background:\s*#c0c0c0/);
});
