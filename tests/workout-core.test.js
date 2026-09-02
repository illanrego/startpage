const test = require("node:test");
const assert = require("node:assert/strict");

const {
  exportStrongCsv,
  inferRoutineCode,
  parseStrongCsv,
} = require("../workout-core.js");

test("parses Strong rows with embedded newlines and unescaped quotes", () => {
  const csv = [
    '"Workout #";"Date";"Workout Name";"Duration (sec)";"Exercise Name";"Set Order";"Weight (kg)";"Reps";"RPE";"Distance (meters)";"Seconds";"Notes";"Workout Notes"',
    '"1";"2026-09-02 16:40:48";"Beta";"3134";"T Bar Row";"Note";"";"";"";"";"";"strap',
    '3rd";"Qui"',
    '"1";"2026-09-02 16:40:48";"Beta";"3134";"T Bar Row";"1";"40.0";"9";"";"";"";"tempo 2\'30";"Qui"',
  ].join("\n");

  const result = parseStrongCsv(csv);

  assert.deepEqual(result.errors, []);
  assert.equal(result.rows.length, 2);
  assert.equal(result.workouts.length, 1);
  assert.equal(result.rows[0].Notes, "strap\n3rd");
  assert.equal(result.rows[1].Notes, "tempo 2'30");
  assert.equal(result.workouts[0].entries.length, 2);
  assert.equal(result.workouts[0].externalKey, "strong:1:2026-09-02 16:40:48");
});

test("infers only clear A-F routine names", () => {
  assert.equal(inferRoutineCode("Alfa ter"), "A");
  assert.equal(inferRoutineCode("α"), "A");
  assert.equal(inferRoutineCode("Strong 5x5 - Workout B"), "B");
  assert.equal(inferRoutineCode("Gamma sab"), "C");
  assert.equal(inferRoutineCode("Delta"), "D");
  assert.equal(inferRoutineCode("Epsilon"), "E");
  assert.equal(inferRoutineCode("F - conditioning"), "F");
  assert.equal(inferRoutineCode("Deadlift"), "");
  assert.equal(inferRoutineCode("Morning Workout"), "");
});

test("exports Strong-compatible CSV without losing entry fields", () => {
  const source = [{
    externalWorkoutNumber: "9",
    date: "2026-09-02 16:40:48",
    workoutName: "Beta",
    durationSeconds: 3134,
    workoutNotes: "Line one\nLine \"two\"",
    entries: [{
      exerciseName: "T Bar Row",
      entryOrder: 0,
      setOrder: "F",
      weightKg: 40,
      reps: 8,
      rpe: 9.5,
      distanceMeters: "",
      seconds: 150,
      notes: "strap; tight",
    }],
  }];

  const exported = exportStrongCsv(source);
  const reparsed = parseStrongCsv(exported);

  assert.deepEqual(reparsed.errors, []);
  assert.equal(reparsed.workouts.length, 1);
  assert.equal(reparsed.workouts[0].workoutNotes, 'Line one\nLine "two"');
  assert.deepEqual(reparsed.workouts[0].entries[0], {
    exerciseName: "T Bar Row",
    entryOrder: 0,
    setOrder: "F",
    weightKg: "40",
    reps: "8",
    rpe: "9.5",
    distanceMeters: "",
    seconds: "150",
    notes: "strap; tight",
  });
});
