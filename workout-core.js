(function attachWorkoutCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.WorkoutCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createWorkoutCore() {
  "use strict";

  const STRONG_HEADERS = [
    "Workout #",
    "Date",
    "Workout Name",
    "Duration (sec)",
    "Exercise Name",
    "Set Order",
    "Weight (kg)",
    "Reps",
    "RPE",
    "Distance (meters)",
    "Seconds",
    "Notes",
    "Workout Notes",
  ];

  const STRONG_RECORD_START = /^"\d+";"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}";/;

  function splitTolerantStrongRecords(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .replace(/\r\n?/g, "\n")
      .split("\n");
    while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
    const chunks = [];
    let current = "";

    lines.slice(1).forEach((line) => {
      if (STRONG_RECORD_START.test(line)) {
        if (current) chunks.push(current);
        current = line;
      } else if (current) {
        current += `\n${line}`;
      }
    });
    if (current) chunks.push(current);
    return chunks;
  }

  function parseTolerantStrongRow(chunk) {
    const source = String(chunk || "");
    const unwrapped = source.startsWith('"') ? source.slice(1) : source;
    const withoutLastQuote = unwrapped.endsWith('"') ? unwrapped.slice(0, -1) : unwrapped;
    return withoutLastQuote.split('";"').map((value) => value.replace(/""/g, '"'));
  }

  function inferRoutineCode(workoutName) {
    const name = String(workoutName || "").trim().toUpperCase();
    if (!name) return "";

    const namedPrefixes = [
      ["A", ["ALFA", "ALPHA", "Α"]],
      ["B", ["BETA", "Β"]],
      ["C", ["GAMMA", "Γ"]],
      ["D", ["DELTA", "Δ"]],
      ["E", ["EPSILON", "Ε"]],
    ];
    for (const [code, prefixes] of namedPrefixes) {
      if (prefixes.some((prefix) => name === prefix || name.startsWith(`${prefix} `) || name.startsWith(`${prefix}-`))) {
        return code;
      }
    }

    const leadingCode = /^([A-F])(?:$|[\s._-])/.exec(name);
    if (leadingCode) return leadingCode[1];
    const embeddedWorkoutCode = /(?:^|\s)WORKOUT\s+([A-F])(?:$|[\s._-])/.exec(name);
    return embeddedWorkoutCode ? embeddedWorkoutCode[1] : "";
  }

  function makeStrongEntry(row, entryOrder) {
    return {
      exerciseName: row["Exercise Name"],
      entryOrder,
      setOrder: row["Set Order"],
      weightKg: row["Weight (kg)"],
      reps: row.Reps,
      rpe: row.RPE,
      distanceMeters: row["Distance (meters)"],
      seconds: row.Seconds,
      notes: row.Notes,
    };
  }

  function groupStrongRows(rows) {
    const byKey = new Map();
    rows.forEach((row) => {
      const externalKey = `strong:${row["Workout #"]}:${row.Date}`;
      let workout = byKey.get(externalKey);
      if (!workout) {
        workout = {
          externalKey,
          externalWorkoutNumber: row["Workout #"],
          date: row.Date,
          workoutName: row["Workout Name"],
          routineCode: inferRoutineCode(row["Workout Name"]),
          durationSeconds: row["Duration (sec)"],
          workoutNotes: row["Workout Notes"],
          entries: [],
        };
        byKey.set(externalKey, workout);
      }
      workout.entries.push(makeStrongEntry(row, workout.entries.length));
    });
    return Array.from(byKey.values());
  }

  function csvValue(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function exportStrongCsv(workouts) {
    const lines = [STRONG_HEADERS.map(csvValue).join(";")];
    (Array.isArray(workouts) ? workouts : []).forEach((workout, workoutIndex) => {
      const workoutNumber = workout.externalWorkoutNumber || String(workoutIndex + 1);
      const entries = Array.isArray(workout.entries) ? workout.entries : [];
      entries.forEach((entry) => {
        const row = [
          workoutNumber,
          workout.date || workout.startedAt || "",
          workout.workoutName || "",
          workout.durationSeconds ?? "",
          entry.exerciseName || "",
          entry.setOrder || "",
          entry.weightKg ?? "",
          entry.reps ?? "",
          entry.rpe ?? "",
          entry.distanceMeters ?? "",
          entry.seconds ?? "",
          entry.notes || "",
          workout.workoutNotes || "",
        ];
        lines.push(row.map(csvValue).join(";"));
      });
    });
    return `${lines.join("\r\n")}\r\n`;
  }

  function parseStrongCsv(text) {
    const normalized = String(text || "").replace(/^\uFEFF/, "");
    const headerLine = normalized.replace(/\r\n?/g, "\n").split("\n", 1)[0] || "";
    const parsedHeaders = parseTolerantStrongRow(headerLine);
    const errors = [];
    if (
      parsedHeaders.length !== STRONG_HEADERS.length ||
      parsedHeaders.some((header, index) => header !== STRONG_HEADERS[index])
    ) {
      errors.push("Strong CSV header does not match the expected 13-column format.");
    }

    const rows = [];
    splitTolerantStrongRecords(normalized).forEach((chunk, index) => {
      const values = parseTolerantStrongRow(chunk);
      if (values.length !== STRONG_HEADERS.length) {
        errors.push(`Record ${index + 1} has ${values.length} columns; expected 13.`);
        return;
      }
      rows.push(Object.fromEntries(STRONG_HEADERS.map((header, column) => [header, values[column]])));
    });

    return { headers: [...STRONG_HEADERS], rows, workouts: groupStrongRows(rows), errors };
  }

  return {
    STRONG_HEADERS,
    exportStrongCsv,
    inferRoutineCode,
    parseStrongCsv,
  };
});
