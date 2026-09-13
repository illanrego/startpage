const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("Workout browser module is an import-driven Strong analytics companion", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "workout-v2.js"), "utf8");

  assert.match(html, /workout-core\.js[^>]*defer/);
  assert.match(html, /workout-v2\.js[^>]*defer/);
  assert.ok(html.indexOf("workout-core.js") < html.indexOf("startpage.js"));
  assert.ok(html.indexOf("startpage.js") < html.indexOf("workout-v2.js"));

  for (const label of ["Overview", "History", "Exercises", "Import"]) {
    assert.ok(app.includes(label), `missing ${label} view`);
  }
  for (const hook of [
    "renderWorkoutV2",
    "loadWorkoutV2BackendState",
    "handleWorkoutGamifyDay",
    "getWorkoutDraftForDate",
  ]) {
    assert.match(app, new RegExp(`function ${hook}\\b`));
  }
  assert.match(app, /const WORKOUT_V2_VIEWS = \["Overview", "History", "Exercises", "Import"\]/);
  assert.match(app, /computeExerciseSeries/);
  assert.match(app, /Estimated 1RM/);
  assert.match(app, /Strong remains where you log workouts/);
  assert.match(app, /parseStrongCsv/);
  assert.match(app, /function workoutV2DeleteAllData/);
  assert.match(app, /DELETE WORKOUT DATA/);
  assert.match(app, /await workoutV2ReconcileDate\(dateKey\)/);
  assert.match(app, /recalculateGamifySkillXp\("fitness"\)/);
  assert.match(app, /Your Strong app data (?:will|was) not (?:be )?changed/);
});

test("Gamify delegates Physique dates to Workout V2", () => {
  const app = fs.readFileSync(path.join(root, "startpage.js"), "utf8");

  assert.match(app, /skill === "fitness"[^\n]+handleWorkoutGamifyDay/);
  assert.match(app, /FITNESS_UNKNOWN_TRAINING/);
  assert.match(app, /loadWorkoutV2BackendState/);
});

test("Workout cloud history loads through the feature sync lifecycle", () => {
  const shell = fs.readFileSync(path.join(root, "startpage.js"), "utf8");
  const workout = fs.readFileSync(path.join(root, "workout-v2.js"), "utf8");

  assert.match(shell, /workoutContainer: \{ key: "workout"/);
  assert.match(shell, /if \(key === "workout"\) \{\s*await loadWorkoutV2BackendState\(\);/);
  const renderFunction = workout.match(
    /function renderWorkoutV2\(\) \{([\s\S]*?)\n\}\n\nfunction workoutV2OpenWindow/,
  )?.[1] || "";
  assert.doesNotMatch(renderFunction, /loadWorkoutV2BackendState/);
  assert.match(workout, /function workoutV2FetchSessionEntries/);
  assert.match(workout, /\.range\(from, from \+ pageSize - 1\)/);
  assert.match(workout, /workoutV2Chunks\(sessionIds, 40\)/);
});
