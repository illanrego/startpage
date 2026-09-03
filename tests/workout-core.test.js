const test = require("node:test");
const assert = require("node:assert/strict");

const {
  computeExerciseProgress,
  createWorkoutDraft,
  exportStrongCsv,
  finishWorkoutSession,
  getFitnessTrackerValueForDate,
  importStrongWorkouts,
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

test("imports Strong workouts idempotently and preserves numeric entry data", () => {
  const parsed = parseStrongCsv([
    '"Workout #";"Date";"Workout Name";"Duration (sec)";"Exercise Name";"Set Order";"Weight (kg)";"Reps";"RPE";"Distance (meters)";"Seconds";"Notes";"Workout Notes"',
    '"1";"2026-09-02 16:40:48";"Beta";"3134";"T Bar Row";"F";"40.0";"8";"9.5";"";"150.0";"strap";"Qui"',
  ].join("\n"));

  const first = importStrongWorkouts({ version: 2, routines: [], sessions: [] }, parsed.workouts);
  const second = importStrongWorkouts(first.data, parsed.workouts);

  assert.equal(first.imported, 1);
  assert.equal(first.skipped, 0);
  assert.equal(second.imported, 0);
  assert.equal(second.skipped, 1);
  assert.equal(second.data.sessions.length, 1);
  assert.equal(second.data.sessions[0].status, "completed");
  assert.equal(second.data.sessions[0].routineCode, "B");
  assert.equal(second.data.sessions[0].entries[0].weightKg, 40);
  assert.equal(second.data.sessions[0].entries[0].rpe, 9.5);
});

test("drafts do not count for Physique until explicitly finished", () => {
  const initial = { version: 2, routines: [], sessions: [] };
  const draftResult = createWorkoutDraft(initial, {
    dateKey: "2026-09-02",
    routineCode: "A",
    routineName: "Alpha",
    entries: [{ exerciseName: "Bench Press", setOrder: "1", reps: 8 }],
  });

  assert.equal(draftResult.created, true);
  assert.equal(getFitnessTrackerValueForDate(draftResult.data, "2026-09-02"), 0);

  const repeated = createWorkoutDraft(draftResult.data, {
    dateKey: "2026-09-02",
    routineCode: "B",
    routineName: "Beta",
  });
  assert.equal(repeated.created, false);
  assert.equal(repeated.data.sessions.length, 1);
  assert.equal(repeated.session.routineCode, "B");

  const completed = finishWorkoutSession(repeated.data, repeated.session.id, "2026-09-02T18:00:00");
  assert.equal(completed.session.status, "completed");
  assert.equal(getFitnessTrackerValueForDate(completed.data, "2026-09-02"), 2);
});

test("an ambiguous completed workout produces the unlabeled tracker value", () => {
  const data = {
    version: 2,
    routines: [],
    sessions: [{
      id: "history-1",
      dateKey: "2026-08-31",
      startedAt: "2026-08-31T11:32:25",
      status: "completed",
      routineCode: "",
      entries: [],
    }],
  };

  assert.equal(getFitnessTrackerValueForDate(data, "2026-08-31"), 7);
});

test("exercise progress excludes notes and rest timers", () => {
  const data = {
    version: 2,
    routines: [],
    sessions: [
      {
        id: "draft",
        dateKey: "2026-09-03",
        status: "draft",
        entries: [{ exerciseName: "Bench", setOrder: "1", weightKg: 100, reps: 20 }],
      },
      {
        id: "done",
        dateKey: "2026-09-02",
        startedAt: "2026-09-02T10:00:00",
        status: "completed",
        entries: [
          { exerciseName: "Bench", setOrder: "Note", weightKg: 200, reps: 1 },
          { exerciseName: "Bench", setOrder: "Rest Timer", seconds: 120 },
          { exerciseName: "Bench", setOrder: "1", weightKg: 40, reps: 8 },
          { exerciseName: "Bench", setOrder: "F", weightKg: 45, reps: 5 },
        ],
      },
    ],
  };

  const progress = computeExerciseProgress(data, "Bench");
  assert.equal(progress.sets.length, 2);
  assert.equal(progress.bestWeightKg, 45);
  assert.equal(progress.totalVolumeKg, 545);
  assert.deepEqual(progress.bestRepsByWeight, { "40": 8, "45": 5 });
});
