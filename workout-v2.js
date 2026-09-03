"use strict";

const WORKOUT_V2_STORAGE_KEY = "workoutData_v2";
const WORKOUT_V2_CODES = ["A", "B", "C", "D", "E", "F"];
const WORKOUT_V2_VIEWS = ["Log", "Templates", "History", "Progress", "Import / Export"];
const workoutV2UiState = {
  data: null,
  view: "Log",
  selectedSessionId: "",
  pendingDateKey: "",
  pendingRoutineCode: "A",
  templateCode: "A",
  historyText: "",
  historyFrom: "",
  historyTo: "",
  progressExercise: "",
  importPreview: null,
  importText: "",
  syncMessage: "",
  remoteAvailable: false,
  remoteLoading: false,
  remoteLoaded: false,
  saveTimer: 0,
  saveChain: Promise.resolve(),
};

function workoutV2Id(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}:${crypto.randomUUID()}`;
  }
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

function workoutV2Today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function workoutV2Number(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function workoutV2Integer(value) {
  const number = workoutV2Number(value);
  return number == null ? null : Math.max(0, Math.round(number));
}

function workoutV2Escape(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function workoutV2NormalizeExercise(exercise, index) {
  const source = exercise && typeof exercise === "object" ? exercise : {};
  return {
    id: String(source.id || workoutV2Id("template-entry")),
    remoteId: String(source.remoteId || ""),
    exerciseName: String(source.exerciseName || source.exercise_name || ""),
    position: Number.isInteger(Number(source.position)) ? Math.max(0, Number(source.position)) : index,
    targetSets: workoutV2Integer(source.targetSets ?? source.target_sets),
    targetReps: String(source.targetReps ?? source.target_reps ?? ""),
    targetWeightKg: workoutV2Number(source.targetWeightKg ?? source.target_weight_kg),
    restSeconds: workoutV2Integer(source.restSeconds ?? source.rest_seconds),
    notes: String(source.notes || ""),
  };
}

function workoutV2NormalizeRoutine(routine, index) {
  const source = routine && typeof routine === "object" ? routine : {};
  const fallbackCode = WORKOUT_V2_CODES[index] || "A";
  const code = WORKOUT_V2_CODES.includes(String(source.code || "").toUpperCase())
    ? String(source.code).toUpperCase()
    : fallbackCode;
  return {
    id: String(source.id || `local-routine-${code}`),
    remoteId: String(source.remoteId || ""),
    code,
    name: String(source.name || code).trim() || code,
    position: WORKOUT_V2_CODES.indexOf(code),
    isActive: source.isActive !== false && source.is_active !== false,
    exercises: (Array.isArray(source.exercises) ? source.exercises : [])
      .map(workoutV2NormalizeExercise)
      .sort((a, b) => a.position - b.position)
      .map((exercise, exerciseIndex) => ({ ...exercise, position: exerciseIndex })),
  };
}

function workoutV2NormalizeEntry(entry, index) {
  const source = entry && typeof entry === "object" ? entry : {};
  return {
    id: String(source.id || workoutV2Id("workout-entry")),
    remoteId: String(source.remoteId || ""),
    exerciseName: String(source.exerciseName ?? source.exercise_name ?? ""),
    entryOrder: index,
    setOrder: String(source.setOrder ?? source.set_order ?? index + 1),
    weightKg: workoutV2Number(source.weightKg ?? source.weight_kg),
    reps: workoutV2Number(source.reps),
    rpe: workoutV2Number(source.rpe),
    distanceMeters: workoutV2Number(source.distanceMeters ?? source.distance_meters),
    seconds: workoutV2Number(source.seconds),
    notes: String(source.notes || ""),
  };
}

function workoutV2NormalizeSession(session) {
  const source = session && typeof session === "object" ? session : {};
  const dateKey = String(source.dateKey || source.workout_date || source.startedAt || source.started_at || workoutV2Today()).slice(0, 10);
  const status = source.status === "completed" ? "completed" : "draft";
  const routineCode = WORKOUT_V2_CODES.includes(String(source.routineCode || source.routine_code || "").toUpperCase())
    ? String(source.routineCode || source.routine_code).toUpperCase()
    : "";
  return {
    id: String(source.id || workoutV2Id("session")),
    remoteId: String(source.remoteId || ""),
    externalKey: String(source.externalKey || source.external_key || ""),
    externalWorkoutNumber: String(source.externalWorkoutNumber || source.external_workout_number || ""),
    dateKey,
    startedAt: String(source.startedAt || source.started_at || `${dateKey}T12:00:00`),
    workoutName: String(source.workoutName || source.workout_name || routineCode || "Workout").trim() || "Workout",
    routineCode,
    durationSeconds: workoutV2Integer(source.durationSeconds ?? source.duration_seconds),
    workoutNotes: String(source.workoutNotes || source.workout_notes || ""),
    status,
    source: ["startpage", "strong_import", "gamify"].includes(source.source) ? source.source : "startpage",
    completedAt: status === "completed" ? String(source.completedAt || source.completed_at || source.startedAt || source.started_at || new Date().toISOString()) : "",
    entries: (Array.isArray(source.entries) ? source.entries : [])
      .map(workoutV2NormalizeEntry),
  };
}

function workoutV2SeedRoutines() {
  let plan = null;
  try {
    if (typeof loadWorkoutPlan === "function") plan = loadWorkoutPlan();
  } catch (error) {
    console.warn("Workout V2 could not read the legacy plan:", error);
  }
  const columns = Array.isArray(plan?.exercises) ? plan.exercises : [];
  const titles = Array.isArray(plan?.titles) ? plan.titles : [];
  return WORKOUT_V2_CODES.map((code, index) => {
    const legacyTitle = String(titles[index] || "").trim();
    const name = legacyTitle && legacyTitle.toUpperCase() !== code ? legacyTitle : code;
    const exercises = (Array.isArray(columns[index]) ? columns[index] : [])
      .map((exerciseName) => String(exerciseName || "").trim())
      .filter(Boolean)
      .map((exerciseName, position) => workoutV2NormalizeExercise({
        id: `legacy-${code}-${position}`,
        exerciseName,
        position,
        targetSets: 1,
      }, position));
    return workoutV2NormalizeRoutine({ id: `local-routine-${code}`, code, name, exercises }, index);
  });
}

function workoutV2NormalizeData(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const sourceRoutines = Array.isArray(source.routines) ? source.routines : [];
  const byCode = new Map(sourceRoutines.map((routine, index) => {
    const normalized = workoutV2NormalizeRoutine(routine, index);
    return [normalized.code, normalized];
  }));
  const seeded = workoutV2SeedRoutines();
  const routines = WORKOUT_V2_CODES.map((code, index) => byCode.get(code) || seeded[index]);
  return {
    version: 2,
    routines,
    sessions: (Array.isArray(source.sessions) ? source.sessions : []).map(workoutV2NormalizeSession),
  };
}

function workoutV2LoadLocal() {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(WORKOUT_V2_STORAGE_KEY));
  } catch (error) {
    console.warn("Workout V2 local data was invalid; rebuilding it.", error);
  }
  const data = workoutV2NormalizeData(parsed);
  localStorage.setItem(WORKOUT_V2_STORAGE_KEY, JSON.stringify(data));
  return data;
}

function workoutV2Data() {
  if (!workoutV2UiState.data) workoutV2UiState.data = workoutV2LoadLocal();
  return workoutV2UiState.data;
}

function workoutV2SetData(data) {
  workoutV2UiState.data = workoutV2NormalizeData(data);
  localStorage.setItem(WORKOUT_V2_STORAGE_KEY, JSON.stringify(workoutV2UiState.data));
  return workoutV2UiState.data;
}

function workoutV2Routine(code) {
  return workoutV2Data().routines.find((routine) => routine.code === code) || workoutV2Data().routines[0];
}

function workoutV2Session(id) {
  return workoutV2Data().sessions.find((session) => session.id === id) || null;
}

function getWorkoutDraftForDate(dateKey) {
  return workoutV2Data().sessions
    .filter((session) => session.dateKey === String(dateKey || "").slice(0, 10) && session.status === "draft")
    .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))[0] || null;
}

function workoutV2TemplateEntries(routine) {
  const entries = [];
  (routine?.exercises || []).forEach((exercise) => {
    const count = Math.max(1, exercise.targetSets || 1);
    for (let set = 1; set <= count; set++) {
      entries.push({
        exerciseName: exercise.exerciseName,
        setOrder: String(set),
        weightKg: exercise.targetWeightKg,
        reps: workoutV2Number(exercise.targetReps),
        rpe: null,
        distanceMeters: null,
        seconds: null,
        notes: exercise.notes,
      });
    }
  });
  return entries;
}

function workoutV2CreateDraft(dateKey, routineCode, source) {
  const routine = workoutV2Routine(routineCode);
  const result = WorkoutCore.createWorkoutDraft(workoutV2Data(), {
    dateKey,
    routineCode: routine.code,
    routineName: routine.name,
    entries: workoutV2TemplateEntries(routine),
  });
  const data = workoutV2NormalizeData(result.data);
  let session = data.sessions.find((candidate) => candidate.id === result.session.id);
  if (session) session.source = source === "gamify" ? "gamify" : "startpage";
  workoutV2SetData(data);
  workoutV2UiState.selectedSessionId = session?.id || "";
  workoutV2UiState.pendingDateKey = dateKey;
  workoutV2ScheduleSave(session ? { session } : {});
  return session;
}

function workoutV2HasBackend() {
  try {
    return Boolean(backendState?.client && getBackendUserId());
  } catch (_error) {
    return false;
  }
}

function workoutV2SetStatus(message) {
  workoutV2UiState.syncMessage = String(message || "");
  const status = document.getElementById("workoutV2SyncStatus");
  if (status) status.textContent = workoutV2UiState.syncMessage;
}

function workoutV2MissingTable(error) {
  const text = String(error?.message || error || "").toLowerCase();
  return error?.code === "42P01" || error?.code === "PGRST205" || text.includes("workout_routines") || text.includes("schema cache");
}

function workoutV2DbResult(result) {
  return typeof throwIfSupabaseError === "function" ? throwIfSupabaseError(result) : (() => {
    if (result?.error) throw result.error;
    return result?.data;
  })();
}

async function workoutV2SyncRoutine(routine) {
  if (!workoutV2UiState.remoteAvailable || !workoutV2HasBackend()) return;
  const userId = getBackendUserId();
  const planId = workoutRemoteState.planId || await ensureBackendWorkoutPlan();
  let row;
  const payload = {
    user_id: userId,
    workout_plan_id: planId,
    code: routine.code,
    name: routine.name || routine.code,
    position: WORKOUT_V2_CODES.indexOf(routine.code),
    is_active: routine.isActive !== false,
  };
  if (routine.remoteId) {
    row = workoutV2DbResult(await backendState.client.from("workout_routines")
      .update(payload).eq("id", routine.remoteId).eq("user_id", userId)
      .select("id").single());
  } else {
    row = workoutV2DbResult(await backendState.client.from("workout_routines")
      .upsert(payload, { onConflict: "user_id,workout_plan_id,code" })
      .select("id").single());
    routine.remoteId = row.id;
  }
  await workoutV2DbResult(await backendState.client.from("workout_routine_exercises")
    .delete().eq("user_id", userId).eq("routine_id", row.id));
  const rows = [];
  for (const [position, exercise] of routine.exercises.entries()) {
    const exerciseName = String(exercise.exerciseName || "").trim();
    if (!exerciseName) continue;
    const exerciseId = typeof upsertBackendWorkoutExercise === "function"
      ? await upsertBackendWorkoutExercise(exerciseName)
      : "";
    rows.push({
      user_id: userId,
      routine_id: row.id,
      exercise_id: exerciseId || null,
      exercise_name: exerciseName,
      position,
      target_sets: exercise.targetSets,
      target_reps: exercise.targetReps || null,
      target_weight_kg: exercise.targetWeightKg,
      rest_seconds: exercise.restSeconds,
      notes: exercise.notes || "",
    });
  }
  if (rows.length) workoutV2DbResult(await backendState.client.from("workout_routine_exercises").insert(rows));
}

async function workoutV2SyncSession(session) {
  if (!workoutV2UiState.remoteAvailable || !workoutV2HasBackend() || !session) return;
  const userId = getBackendUserId();
  const routine = session.routineCode ? workoutV2Routine(session.routineCode) : null;
  if (routine && !routine.remoteId) await workoutV2SyncRoutine(routine);
  const payload = {
    user_id: userId,
    routine_id: routine?.remoteId || null,
    routine_code: session.routineCode || null,
    workout_name: session.workoutName || "Workout",
    status: session.status,
    workout_date: session.dateKey,
    started_at: session.startedAt || `${session.dateKey}T12:00:00`,
    duration_seconds: session.durationSeconds,
    workout_notes: session.workoutNotes || "",
    source: session.source || "startpage",
    external_workout_number: session.externalWorkoutNumber || null,
    external_key: session.externalKey || null,
    completed_at: session.status === "completed" ? (session.completedAt || new Date().toISOString()) : null,
  };
  let row;
  if (session.remoteId) {
    row = workoutV2DbResult(await backendState.client.from("workout_sessions")
      .update(payload).eq("id", session.remoteId).eq("user_id", userId)
      .select("id").single());
  } else if (session.externalKey) {
    row = workoutV2DbResult(await backendState.client.from("workout_sessions")
      .upsert(payload, { onConflict: "user_id,external_key" }).select("id").single());
  } else {
    row = workoutV2DbResult(await backendState.client.from("workout_sessions")
      .insert(payload).select("id").single());
  }
  session.remoteId = row.id;
  await workoutV2DbResult(await backendState.client.from("workout_session_entries")
    .delete().eq("user_id", userId).eq("workout_session_id", row.id));
  const rows = [];
  for (const [entryOrder, entry] of session.entries.entries()) {
    const exerciseName = String(entry.exerciseName || "").trim();
    if (!exerciseName) continue;
    const exerciseId = typeof upsertBackendWorkoutExercise === "function"
      ? await upsertBackendWorkoutExercise(exerciseName)
      : "";
    rows.push({
      user_id: userId,
      workout_session_id: row.id,
      exercise_id: exerciseId || null,
      exercise_name: exerciseName,
      entry_order: entryOrder,
      set_order: String(entry.setOrder || entryOrder + 1),
      weight_kg: entry.weightKg,
      reps: entry.reps,
      rpe: entry.rpe,
      distance_meters: entry.distanceMeters,
      seconds: entry.seconds,
      notes: entry.notes || "",
    });
  }
  if (rows.length) workoutV2DbResult(await backendState.client.from("workout_session_entries").insert(rows));
}

async function workoutV2SyncAll() {
  for (const routine of workoutV2Data().routines) await workoutV2SyncRoutine(routine);
  for (const session of workoutV2Data().sessions) await workoutV2SyncSession(session);
  workoutV2SetData(workoutV2Data());
}

function workoutV2QueueRemoteSave(scope) {
  if (!workoutV2UiState.remoteAvailable) return;
  workoutV2UiState.saveChain = workoutV2UiState.saveChain.then(async () => {
    try {
      if (scope?.routine) await workoutV2SyncRoutine(scope.routine);
      if (scope?.session) await workoutV2SyncSession(scope.session);
      if (!scope?.routine && !scope?.session) await workoutV2SyncAll();
      workoutV2SetData(workoutV2Data());
      workoutV2SetStatus("Saved to Supabase.");
    } catch (error) {
      console.error("Workout V2 backend save error:", error);
      workoutV2SetStatus("Backend save failed; local copy kept.");
      if (workoutV2MissingTable(error)) workoutV2UiState.remoteAvailable = false;
    }
  });
}

function workoutV2ScheduleSave(scope) {
  workoutV2SetData(workoutV2Data());
  workoutV2SetStatus(workoutV2UiState.remoteAvailable ? "Saving…" : "Saved locally.");
  clearTimeout(workoutV2UiState.saveTimer);
  workoutV2UiState.saveTimer = setTimeout(() => workoutV2QueueRemoteSave(scope), 350);
}

function resetWorkoutV2BackendState() {
  workoutV2UiState.remoteAvailable = false;
  workoutV2UiState.remoteLoading = false;
  workoutV2UiState.remoteLoaded = false;
  workoutV2UiState.data = null;
  workoutV2UiState.selectedSessionId = "";
  workoutV2UiState.importPreview = null;
  if (typeof workoutRemoteState !== "undefined") {
    workoutRemoteState.v2Loaded = false;
    workoutRemoteState.v2Available = false;
  }
}

async function loadWorkoutV2BackendState() {
  if (workoutV2UiState.remoteLoading) return;
  if (!workoutV2HasBackend()) {
    resetWorkoutV2BackendState();
    workoutV2UiState.data = workoutV2LoadLocal();
    renderWorkoutV2();
    return;
  }
  workoutV2UiState.remoteLoading = true;
  const localData = workoutV2Data();
  try {
    const userId = getBackendUserId();
    const planId = await ensureBackendWorkoutPlan();
    const routineRows = workoutV2DbResult(await backendState.client.from("workout_routines")
      .select("id, code, name, position, is_active")
      .eq("user_id", userId).eq("workout_plan_id", planId).order("position", { ascending: true }));
    const routineIds = (routineRows || []).map((row) => row.id);
    let routineExerciseRows = [];
    if (routineIds.length) {
      routineExerciseRows = workoutV2DbResult(await backendState.client.from("workout_routine_exercises")
        .select("id, routine_id, exercise_name, position, target_sets, target_reps, target_weight_kg, rest_seconds, notes")
        .eq("user_id", userId).in("routine_id", routineIds).order("position", { ascending: true }));
    }
    const sessionRows = workoutV2DbResult(await backendState.client.from("workout_sessions")
      .select("id, routine_id, routine_code, workout_name, status, workout_date, started_at, duration_seconds, workout_notes, source, external_workout_number, external_key, completed_at")
      .eq("user_id", userId).order("started_at", { ascending: false }));
    const sessionIds = (sessionRows || []).map((row) => row.id);
    let entryRows = [];
    if (sessionIds.length) {
      entryRows = workoutV2DbResult(await backendState.client.from("workout_session_entries")
        .select("id, workout_session_id, exercise_name, entry_order, set_order, weight_kg, reps, rpe, distance_meters, seconds, notes")
        .eq("user_id", userId).in("workout_session_id", sessionIds).order("entry_order", { ascending: true }));
    }
    const exerciseByRoutine = new Map();
    routineExerciseRows.forEach((row) => {
      if (!exerciseByRoutine.has(row.routine_id)) exerciseByRoutine.set(row.routine_id, []);
      exerciseByRoutine.get(row.routine_id).push({
        id: row.id, remoteId: row.id, exerciseName: row.exercise_name, position: row.position,
        targetSets: row.target_sets, targetReps: row.target_reps, targetWeightKg: row.target_weight_kg,
        restSeconds: row.rest_seconds, notes: row.notes,
      });
    });
    const entriesBySession = new Map();
    entryRows.forEach((row) => {
      if (!entriesBySession.has(row.workout_session_id)) entriesBySession.set(row.workout_session_id, []);
      entriesBySession.get(row.workout_session_id).push({
        id: row.id, remoteId: row.id, exerciseName: row.exercise_name, entryOrder: row.entry_order,
        setOrder: row.set_order, weightKg: row.weight_kg, reps: row.reps, rpe: row.rpe,
        distanceMeters: row.distance_meters, seconds: row.seconds, notes: row.notes,
      });
    });
    const remoteRoutines = routineRows.map((row, index) => ({
      id: row.id, remoteId: row.id, code: row.code, name: row.name, position: row.position,
      isActive: row.is_active, exercises: exerciseByRoutine.get(row.id) || [],
    }));
    const remoteSessions = sessionRows.map((row) => ({
      id: row.id, remoteId: row.id, routineCode: row.routine_code, workoutName: row.workout_name,
      status: row.status, dateKey: row.workout_date, startedAt: row.started_at,
      durationSeconds: row.duration_seconds, workoutNotes: row.workout_notes, source: row.source,
      externalWorkoutNumber: row.external_workout_number, externalKey: row.external_key,
      completedAt: row.completed_at, entries: entriesBySession.get(row.id) || [],
    }));
    workoutV2UiState.remoteAvailable = true;
    workoutV2UiState.remoteLoaded = true;
    workoutRemoteState.v2Loaded = true;
    workoutRemoteState.v2Available = true;
    if (remoteRoutines.length === 0) {
      workoutV2SetData({ version: 2, routines: localData.routines, sessions: remoteSessions.length ? remoteSessions : localData.sessions });
      await workoutV2SyncAll();
    } else {
      workoutV2SetData({ version: 2, routines: remoteRoutines, sessions: remoteSessions });
    }
    workoutV2SetStatus("Loaded from Supabase.");
  } catch (error) {
    console.warn("Workout V2 backend unavailable; using local data:", error);
    workoutV2UiState.remoteAvailable = false;
    workoutV2UiState.remoteLoaded = false;
    workoutRemoteState.v2Loaded = false;
    workoutRemoteState.v2Available = false;
    workoutV2UiState.data = localData;
    workoutV2SetStatus(workoutV2MissingTable(error)
      ? "Workout V2 tables are not installed; using local storage."
      : "Workout backend unavailable; using local storage.");
  } finally {
    workoutV2UiState.remoteLoading = false;
    renderWorkoutV2();
  }
}

function workoutV2RoutineOptions(selected, allowBlank) {
  const blank = allowBlank ? '<option value="">Unknown / no routine</option>' : "";
  return blank + workoutV2Data().routines.map((routine) =>
    `<option value="${routine.code}"${routine.code === selected ? " selected" : ""}>${routine.code} — ${workoutV2Escape(routine.name)}</option>`
  ).join("");
}

function workoutV2RenderTabs() {
  return `<div class="workout-v2-tabs" role="tablist">${WORKOUT_V2_VIEWS.map((view) =>
    `<button type="button" role="tab" data-view="${workoutV2Escape(view)}" aria-selected="${view === workoutV2UiState.view}">${workoutV2Escape(view)}</button>`
  ).join("")}</div>`;
}

function workoutV2RenderEmptyLog() {
  const dateKey = workoutV2UiState.pendingDateKey || workoutV2Today();
  const code = workoutV2UiState.pendingRoutineCode || "A";
  return `<section class="workout-v2-panel">
    <h3>Start or open a workout</h3>
    <div class="workout-v2-form-row">
      <label>Date<input id="workoutV2NewDate" type="date" value="${workoutV2Escape(dateKey)}"></label>
      <label>Routine<select id="workoutV2NewRoutine">${workoutV2RoutineOptions(code, false)}</select></label>
      <button type="button" data-action="create-draft">Start draft</button>
    </div>
    <p class="workout-v2-help">Choose A–F. A draft does not count toward Physique until you finish it.</p>
  </section>`;
}

function workoutV2RenderEntryRow(entry, index, completed) {
  const disabled = completed ? " disabled" : "";
  const numberInput = (field, value, attrs) => `<input type="number" data-entry-index="${index}" data-entry-field="${field}" value="${value == null ? "" : workoutV2Escape(value)}" ${attrs || ""}${disabled}>`;
  return `<tr data-entry-id="${workoutV2Escape(entry.id)}">
    <td>${index + 1}</td>
    <td><input data-entry-index="${index}" data-entry-field="setOrder" value="${workoutV2Escape(entry.setOrder)}"${disabled}></td>
    <td><input data-entry-index="${index}" data-entry-field="exerciseName" value="${workoutV2Escape(entry.exerciseName)}" list="workoutV2ExerciseNames"${disabled}></td>
    <td>${numberInput("weightKg", entry.weightKg, 'min="0" step="0.01"')}</td>
    <td>${numberInput("reps", entry.reps, 'min="0" step="0.01"')}</td>
    <td>${numberInput("rpe", entry.rpe, 'min="0" max="10" step="0.5"')}</td>
    <td>${numberInput("distanceMeters", entry.distanceMeters, 'min="0" step="0.01"')}</td>
    <td>${numberInput("seconds", entry.seconds, 'min="0" step="0.01"')}</td>
    <td><input data-entry-index="${index}" data-entry-field="notes" value="${workoutV2Escape(entry.notes)}"${disabled}></td>
    <td><button type="button" data-action="remove-entry" data-index="${index}" aria-label="Remove entry"${disabled}>×</button></td>
  </tr>`;
}

function workoutV2ExerciseNames() {
  const names = new Set();
  workoutV2Data().routines.forEach((routine) => routine.exercises.forEach((exercise) => names.add(exercise.exerciseName)));
  workoutV2Data().sessions.forEach((session) => session.entries.forEach((entry) => names.add(entry.exerciseName)));
  return Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function workoutV2RenderLog() {
  const session = workoutV2Session(workoutV2UiState.selectedSessionId);
  if (!session) return workoutV2RenderEmptyLog();
  const completed = session.status === "completed";
  return `<section class="workout-v2-panel workout-v2-log">
    <div class="workout-v2-panel-heading"><h3>Workout log</h3><span class="workout-v2-status workout-v2-status--${session.status}">${session.status}</span></div>
    <div class="workout-v2-form-grid">
      <label>Date<input type="date" data-session-field="dateKey" value="${workoutV2Escape(session.dateKey)}"${completed ? " disabled" : ""}></label>
      <label>Name<input data-session-field="workoutName" value="${workoutV2Escape(session.workoutName)}"${completed ? " disabled" : ""}></label>
      <label>Routine<select data-session-field="routineCode"${completed ? " disabled" : ""}>${workoutV2RoutineOptions(session.routineCode, true)}</select></label>
      <label>Status<input value="${workoutV2Escape(session.status)}" disabled></label>
      <label>Duration (seconds)<input type="number" min="0" step="1" data-session-field="durationSeconds" value="${session.durationSeconds == null ? "" : workoutV2Escape(session.durationSeconds)}"${completed ? " disabled" : ""}></label>
    </div>
    <label class="workout-v2-block-label">Workout notes<textarea data-session-field="workoutNotes" rows="2"${completed ? " disabled" : ""}>${workoutV2Escape(session.workoutNotes)}</textarea></label>
    <div class="workout-v2-table-wrap"><table class="workout-v2-table workout-v2-entry-table">
      <thead><tr><th>#</th><th>Set order</th><th>Exercise</th><th>kg</th><th>Reps</th><th>RPE</th><th>Meters</th><th>Seconds</th><th>Notes</th><th></th></tr></thead>
      <tbody>${session.entries.map((entry, index) => workoutV2RenderEntryRow(entry, index, completed)).join("")}</tbody>
    </table></div>
    <datalist id="workoutV2ExerciseNames">${workoutV2ExerciseNames().map((name) => `<option value="${workoutV2Escape(name)}"></option>`).join("")}</datalist>
    <div class="workout-v2-actions">
      ${completed ? '<button type="button" data-action="reopen">Reopen workout</button>' : '<button type="button" data-action="add-entry">Add entry</button><button type="button" class="workout-v2-primary" data-action="finish">Finish workout</button>'}
      <button type="button" class="workout-v2-danger" data-action="delete-session">Delete workout</button>
      <button type="button" data-action="close-session">Back</button>
    </div>
  </section>`;
}

function workoutV2RenderTemplateRow(exercise, index) {
  const numberInput = (field, value, attrs) => `<input type="number" data-template-index="${index}" data-template-field="${field}" value="${value == null ? "" : workoutV2Escape(value)}" ${attrs || ""}>`;
  return `<tr>
    <td>${index + 1}</td>
    <td><input data-template-index="${index}" data-template-field="exerciseName" value="${workoutV2Escape(exercise.exerciseName)}" list="workoutV2ExerciseNames"></td>
    <td>${numberInput("targetSets", exercise.targetSets, 'min="1" step="1"')}</td>
    <td><input data-template-index="${index}" data-template-field="targetReps" value="${workoutV2Escape(exercise.targetReps)}" placeholder="8-12"></td>
    <td>${numberInput("targetWeightKg", exercise.targetWeightKg, 'min="0" step="0.01"')}</td>
    <td>${numberInput("restSeconds", exercise.restSeconds, 'min="0" step="1"')}</td>
    <td><input data-template-index="${index}" data-template-field="notes" value="${workoutV2Escape(exercise.notes)}"></td>
    <td><button type="button" data-action="remove-template-entry" data-index="${index}" aria-label="Remove template exercise">×</button></td>
  </tr>`;
}

function workoutV2RenderTemplates() {
  const routine = workoutV2Routine(workoutV2UiState.templateCode);
  return `<section class="workout-v2-panel">
    <div class="workout-v2-form-row">
      <label>Template<select id="workoutV2TemplateCode">${workoutV2RoutineOptions(routine.code, false)}</select></label>
      <label class="workout-v2-grow">Routine name<input data-routine-field="name" value="${workoutV2Escape(routine.name)}"></label>
    </div>
    <div class="workout-v2-table-wrap"><table class="workout-v2-table">
      <thead><tr><th>#</th><th>Exercise</th><th>Target sets</th><th>Target reps</th><th>Target kg</th><th>Rest sec</th><th>Notes</th><th></th></tr></thead>
      <tbody>${routine.exercises.map(workoutV2RenderTemplateRow).join("")}</tbody>
    </table></div>
    <datalist id="workoutV2ExerciseNames">${workoutV2ExerciseNames().map((name) => `<option value="${workoutV2Escape(name)}"></option>`).join("")}</datalist>
    <div class="workout-v2-actions"><button type="button" data-action="add-template-entry">Add exercise</button></div>
  </section>`;
}

function workoutV2FilteredHistory() {
  const text = workoutV2UiState.historyText.trim().toLocaleLowerCase();
  return workoutV2Data().sessions.filter((session) => {
    if (workoutV2UiState.historyFrom && session.dateKey < workoutV2UiState.historyFrom) return false;
    if (workoutV2UiState.historyTo && session.dateKey > workoutV2UiState.historyTo) return false;
    if (!text) return true;
    return [session.workoutName, session.routineCode, session.workoutNotes, ...session.entries.map((entry) => entry.exerciseName)]
      .some((value) => String(value || "").toLocaleLowerCase().includes(text));
  }).sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
}

function workoutV2RenderHistory() {
  const rows = workoutV2FilteredHistory();
  return `<section class="workout-v2-panel">
    <div class="workout-v2-form-row workout-v2-filters">
      <label class="workout-v2-grow">Text, routine, or exercise<input id="workoutV2HistoryText" value="${workoutV2Escape(workoutV2UiState.historyText)}"></label>
      <label>From<input id="workoutV2HistoryFrom" type="date" value="${workoutV2Escape(workoutV2UiState.historyFrom)}"></label>
      <label>To<input id="workoutV2HistoryTo" type="date" value="${workoutV2Escape(workoutV2UiState.historyTo)}"></label>
      <button type="button" data-action="apply-history-filters">Filter</button>
    </div>
    <div class="workout-v2-table-wrap"><table class="workout-v2-table">
      <thead><tr><th>Date</th><th>Routine</th><th>Name</th><th>Status</th><th>Duration</th><th>Exercises</th><th>Sets / rows</th><th>Notes</th><th></th></tr></thead>
      <tbody>${rows.map((session) => `<tr>
        <td>${workoutV2Escape(session.dateKey)}</td><td>${workoutV2Escape(session.routineCode || "—")}</td><td>${workoutV2Escape(session.workoutName)}</td>
        <td>${workoutV2Escape(session.status)}</td><td>${session.durationSeconds == null ? "—" : workoutV2Escape(session.durationSeconds)}</td>
        <td>${new Set(session.entries.map((entry) => entry.exerciseName).filter(Boolean)).size}</td><td>${session.entries.length}</td><td class="workout-v2-notes-cell">${workoutV2Escape(session.workoutNotes)}</td>
        <td><button type="button" data-action="open-session" data-session-id="${workoutV2Escape(session.id)}">Open</button></td>
      </tr>`).join("") || '<tr><td colspan="9">No workouts match these filters.</td></tr>'}</tbody>
    </table></div>
  </section>`;
}

function workoutV2ProgressRows(exerciseName) {
  const rows = [];
  workoutV2Data().sessions.filter((session) => session.status === "completed").forEach((session) => {
    session.entries.forEach((entry) => {
      if (entry.exerciseName !== exerciseName) return;
      const setKind = String(entry.setOrder || "").trim().toLocaleLowerCase();
      if (setKind === "note" || setKind === "rest timer") return;
      rows.push({ session, entry, volume: entry.weightKg != null && entry.reps != null ? entry.weightKg * entry.reps : null });
    });
  });
  return rows.sort((a, b) => String(b.session.startedAt).localeCompare(String(a.session.startedAt)));
}

function workoutV2RenderProgress() {
  const names = workoutV2ExerciseNames();
  if (!workoutV2UiState.progressExercise && names.length) workoutV2UiState.progressExercise = names[0];
  const exercise = workoutV2UiState.progressExercise;
  const rows = workoutV2ProgressRows(exercise);
  const weights = rows.map((row) => row.entry.weightKg).filter((value) => value != null);
  const volumes = rows.map((row) => row.volume).filter((value) => value != null);
  const bestWeight = weights.length ? Math.max(...weights) : null;
  const totalVolume = volumes.reduce((sum, value) => sum + value, 0);
  return `<section class="workout-v2-panel">
    <div class="workout-v2-form-row"><label>Exercise<select id="workoutV2ProgressExercise">${names.map((name) => `<option value="${workoutV2Escape(name)}"${name === exercise ? " selected" : ""}>${workoutV2Escape(name)}</option>`).join("")}</select></label></div>
    <div class="workout-v2-metrics"><div><strong>Best weight</strong><span>${bestWeight == null ? "—" : `${workoutV2Escape(bestWeight)} kg`}</span></div><div><strong>Recorded volume</strong><span>${volumes.length ? `${workoutV2Escape(totalVolume.toFixed(2))} kg` : "—"}</span></div><div><strong>Recent rows</strong><span>${rows.length}</span></div></div>
    <div class="workout-v2-table-wrap"><table class="workout-v2-table">
      <thead><tr><th>Date</th><th>Workout</th><th>Set</th><th>kg</th><th>Reps</th><th>RPE</th><th>Volume</th><th>Notes</th></tr></thead>
      <tbody>${rows.slice(0, 100).map(({ session, entry, volume }) => `<tr><td>${workoutV2Escape(session.dateKey)}</td><td>${workoutV2Escape(session.workoutName)}</td><td>${workoutV2Escape(entry.setOrder)}</td><td>${entry.weightKg ?? "—"}</td><td>${entry.reps ?? "—"}</td><td>${entry.rpe ?? "—"}</td><td>${volume == null ? "—" : workoutV2Escape(volume.toFixed(2))}</td><td>${workoutV2Escape(entry.notes)}</td></tr>`).join("") || '<tr><td colspan="8">No completed strength rows for this exercise.</td></tr>'}</tbody>
    </table></div>
    <p class="workout-v2-help">Note and Rest Timer rows are preserved in history/export but excluded from progress calculations.</p>
  </section>`;
}

function workoutV2RenderImportExport() {
  const preview = workoutV2UiState.importPreview;
  return `<section class="workout-v2-panel">
    <h3>Strong CSV import</h3>
    <div class="workout-v2-form-row"><label class="workout-v2-file-label">Choose CSV<input id="workoutV2CsvFile" type="file" accept=".csv,text/csv"></label></div>
    <label class="workout-v2-block-label">Or paste Strong CSV<textarea id="workoutV2CsvText" rows="6" placeholder="Paste the 13-column semicolon CSV here">${workoutV2Escape(workoutV2UiState.importText)}</textarea></label>
    <div class="workout-v2-actions"><button type="button" data-action="preview-import">Preview import</button>${preview && preview.errors.length === 0 ? '<button type="button" class="workout-v2-primary" data-action="confirm-import">Import preview</button>' : ""}</div>
    ${preview ? `<div class="workout-v2-import-preview"><strong>Preview:</strong> ${preview.workouts.length} workout(s), ${preview.rows.length} row(s), ${preview.errors.length} error(s).${preview.errors.length ? `<ul>${preview.errors.map((error) => `<li>${workoutV2Escape(error)}</li>`).join("")}</ul>` : ""}</div>` : ""}
    <hr>
    <h3>Strong CSV export</h3>
    <div class="workout-v2-form-row"><label>From<input id="workoutV2ExportFrom" type="date"></label><label>To<input id="workoutV2ExportTo" type="date"></label><button type="button" data-action="export-csv">Download CSV</button></div>
  </section>`;
}

function renderWorkoutV2() {
  const mount = document.getElementById("workoutTableDiv");
  if (!mount) return;
  workoutV2Data();
  if (workoutV2HasBackend() && !workoutV2UiState.remoteLoaded && !workoutV2UiState.remoteLoading) {
    void loadWorkoutV2BackendState();
  }
  let content = "";
  if (workoutV2UiState.view === "Templates") content = workoutV2RenderTemplates();
  else if (workoutV2UiState.view === "History") content = workoutV2RenderHistory();
  else if (workoutV2UiState.view === "Progress") content = workoutV2RenderProgress();
  else if (workoutV2UiState.view === "Import / Export") content = workoutV2RenderImportExport();
  else content = workoutV2RenderLog();
  mount.innerHTML = `<div class="workout-v2">${workoutV2RenderTabs()}<div class="workout-v2-content">${content}</div><div id="workoutV2SyncStatus" class="workout-v2-sync" role="status">${workoutV2Escape(workoutV2UiState.syncMessage || (workoutV2UiState.remoteAvailable ? "Supabase ready." : "Local storage."))}</div></div>`;
  workoutV2BindEvents(mount);
}

function workoutV2OpenWindow() {
  const container = document.getElementById("workoutContainer");
  if (container) container.style.display = "block";
}

function handleWorkoutGamifyDay(year, month, day) {
  const dateKey = typeof trackerDateKey === "function"
    ? trackerDateKey(year, month, day)
    : `${year}-${String(Number(month) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const sessions = workoutV2Data().sessions
    .filter((session) => session.dateKey === dateKey)
    .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  const session = sessions.find((candidate) => candidate.status === "completed") || sessions.find((candidate) => candidate.status === "draft");
  workoutV2UiState.view = "Log";
  workoutV2UiState.pendingDateKey = dateKey;
  workoutV2UiState.selectedSessionId = session?.id || "";
  workoutV2OpenWindow();
  renderWorkoutV2();
  return session || null;
}

async function workoutV2ReconcileDate(dateKey, previousValue) {
  const value = WorkoutCore.getFitnessTrackerValueForDate(workoutV2Data(), dateKey);
  const parts = typeof parseTrackerDateKey === "function" ? parseTrackerDateKey(dateKey) : null;
  if (!parts) return;
  let boardState = {};
  if (typeof getBoardStateSnapshot === "function") boardState = getBoardStateSnapshot("fitness", parts.year, parts.month);
  else {
    try { boardState = JSON.parse(localStorage.getItem(`fitnessBoardState_${parts.year}-${parts.month + 1}`)) || {}; }
    catch (_error) { boardState = {}; }
  }
  const prev = previousValue === undefined ? boardState[parts.day] : previousValue;
  if (value <= 0) delete boardState[parts.day];
  else if (value <= 6) boardState[parts.day] = WORKOUT_V2_CODES[value - 1];
  else boardState[parts.day] = typeof FITNESS_UNKNOWN_TRAINING !== "undefined" ? FITNESS_UNKNOWN_TRAINING : "__WORKOUT__";
  if (typeof saveBoardState === "function") saveBoardState("fitness", parts.year, parts.month, boardState);
  if (typeof syncTrackerDayValue === "function") await syncTrackerDayValue("skill", "fitness", parts.year, parts.month, parts.day, value);
  const next = boardState[parts.day];
  if (typeof syncMappedDailyFromGamifyChange === "function") await syncMappedDailyFromGamifyChange("fitness", prev, next, parts.year, parts.month, parts.day);
  if (typeof recalculateGamifySkillXp === "function") recalculateGamifySkillXp("fitness");
  if (typeof renderGamifyStreakCalendar === "function") renderGamifyStreakCalendar();
  if (typeof updateDailyCounter === "function") updateDailyCounter("fitness");
  if (typeof renderDailies === "function") renderDailies();
}

async function workoutV2ReconcileAllDates() {
  const dates = Array.from(new Set(workoutV2Data().sessions.map((session) => session.dateKey).filter(Boolean)));
  for (const dateKey of dates) await workoutV2ReconcileDate(dateKey);
}

function workoutV2UpdateSessionField(session, field, value) {
  if (field === "durationSeconds") session[field] = workoutV2Integer(value);
  else if (field === "dateKey") {
    const oldDate = session.dateKey;
    session.dateKey = String(value).slice(0, 10);
    session.startedAt = `${session.dateKey}${String(session.startedAt || "").slice(10) || "T12:00:00"}`;
    session._previousDateKey = oldDate;
  } else session[field] = String(value || "");
}

function workoutV2UpdateEntryField(entry, field, value) {
  if (["weightKg", "reps", "rpe", "distanceMeters", "seconds"].includes(field)) entry[field] = workoutV2Number(value);
  else entry[field] = String(value || "");
}

function workoutV2UpdateTemplateField(exercise, field, value) {
  if (["targetSets", "restSeconds"].includes(field)) exercise[field] = workoutV2Integer(value);
  else if (field === "targetWeightKg") exercise[field] = workoutV2Number(value);
  else exercise[field] = String(value || "");
}

async function workoutV2Finish(session) {
  const result = WorkoutCore.finishWorkoutSession(workoutV2Data(), session.id, new Date().toISOString());
  workoutV2SetData(result.data);
  const finished = workoutV2Session(session.id);
  workoutV2ScheduleSave({ session: finished });
  await workoutV2UiState.saveChain;
  await workoutV2ReconcileDate(finished.dateKey);
  renderWorkoutV2();
}

async function workoutV2Reopen(session) {
  session.status = "draft";
  session.completedAt = "";
  workoutV2ScheduleSave({ session });
  await workoutV2ReconcileDate(session.dateKey);
  renderWorkoutV2();
}

async function workoutV2DeleteSession(session) {
  const ok = typeof confirm !== "function" || confirm(`Delete ${session.workoutName} on ${session.dateKey}?`);
  if (!ok) return;
  const remoteId = session.remoteId;
  workoutV2Data().sessions = workoutV2Data().sessions.filter((candidate) => candidate.id !== session.id);
  workoutV2SetData(workoutV2Data());
  if (remoteId && workoutV2UiState.remoteAvailable) {
    try {
      workoutV2DbResult(await backendState.client.from("workout_sessions").delete()
        .eq("id", remoteId).eq("user_id", getBackendUserId()));
    } catch (error) {
      console.error("Workout V2 remote delete failed:", error);
      workoutV2SetStatus("Deleted locally; backend delete failed.");
    }
  }
  workoutV2UiState.selectedSessionId = "";
  await workoutV2ReconcileDate(session.dateKey);
  renderWorkoutV2();
}

function workoutV2ReadImportText() {
  const textarea = document.getElementById("workoutV2CsvText");
  workoutV2UiState.importText = textarea?.value || workoutV2UiState.importText;
  workoutV2UiState.importPreview = WorkoutCore.parseStrongCsv(workoutV2UiState.importText);
  renderWorkoutV2();
}

async function workoutV2ConfirmImport() {
  const preview = workoutV2UiState.importPreview;
  if (!preview || preview.errors.length) return;
  const result = WorkoutCore.importStrongWorkouts(workoutV2Data(), preview.workouts);
  workoutV2SetData(result.data);
  const importedKeys = new Set(preview.workouts.map((workout) => workout.externalKey));
  const importedSessions = workoutV2Data().sessions.filter((session) => importedKeys.has(session.externalKey));
  if (workoutV2UiState.remoteAvailable) {
    for (const session of importedSessions) await workoutV2SyncSession(session);
    workoutV2SetData(workoutV2Data());
  }
  await workoutV2ReconcileAllDates();
  workoutV2SetStatus(`Import complete: ${result.imported} imported, ${result.skipped} skipped existing.`);
  workoutV2UiState.importPreview = null;
  workoutV2UiState.importText = "";
  renderWorkoutV2();
}

function workoutV2ExportCsv() {
  const from = document.getElementById("workoutV2ExportFrom")?.value || "";
  const to = document.getElementById("workoutV2ExportTo")?.value || "";
  const sessions = workoutV2Data().sessions
    .filter((session) => session.status === "completed")
    .filter((session) => !from || session.dateKey >= from)
    .filter((session) => !to || session.dateKey <= to)
    .sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)))
    .map((session) => ({
      ...session,
      date: String(session.startedAt || `${session.dateKey}T12:00:00`).replace("T", " ").replace(/Z$/, "").slice(0, 19),
    }));
  const csv = WorkoutCore.exportStrongCsv(sessions);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `workout-strong-${workoutV2Today()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  workoutV2SetStatus(`Exported ${sessions.length} completed workout(s).`);
}

function workoutV2BindEvents(mount) {
  mount.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
    workoutV2UiState.view = button.dataset.view;
    renderWorkoutV2();
  }));
  mount.querySelectorAll("[data-session-field]").forEach((input) => input.addEventListener("input", () => {
    const session = workoutV2Session(workoutV2UiState.selectedSessionId);
    if (!session || session.status === "completed") return;
    workoutV2UpdateSessionField(session, input.dataset.sessionField, input.value);
    workoutV2ScheduleSave({ session });
  }));
  mount.querySelectorAll("[data-entry-field]").forEach((input) => input.addEventListener("input", () => {
    const session = workoutV2Session(workoutV2UiState.selectedSessionId);
    const entry = session?.entries[Number(input.dataset.entryIndex)];
    if (!entry || session.status === "completed") return;
    workoutV2UpdateEntryField(entry, input.dataset.entryField, input.value);
    workoutV2ScheduleSave({ session });
  }));
  mount.querySelectorAll("[data-template-field]").forEach((input) => input.addEventListener("input", () => {
    const routine = workoutV2Routine(workoutV2UiState.templateCode);
    const exercise = routine.exercises[Number(input.dataset.templateIndex)];
    if (!exercise) return;
    workoutV2UpdateTemplateField(exercise, input.dataset.templateField, input.value);
    workoutV2ScheduleSave({ routine });
  }));
  mount.querySelector("[data-routine-field]")?.addEventListener("input", (event) => {
    const routine = workoutV2Routine(workoutV2UiState.templateCode);
    routine.name = event.target.value || routine.code;
    workoutV2ScheduleSave({ routine });
  });
  mount.querySelector("#workoutV2TemplateCode")?.addEventListener("change", (event) => {
    workoutV2UiState.templateCode = event.target.value;
    renderWorkoutV2();
  });
  mount.querySelector("#workoutV2ProgressExercise")?.addEventListener("change", (event) => {
    workoutV2UiState.progressExercise = event.target.value;
    renderWorkoutV2();
  });
  mount.querySelector("#workoutV2CsvFile")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    workoutV2UiState.importText = await file.text();
    workoutV2UiState.importPreview = WorkoutCore.parseStrongCsv(workoutV2UiState.importText);
    renderWorkoutV2();
  });
  mount.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const session = workoutV2Session(workoutV2UiState.selectedSessionId);
    if (action === "create-draft") {
      const dateKey = document.getElementById("workoutV2NewDate")?.value || workoutV2Today();
      const code = document.getElementById("workoutV2NewRoutine")?.value || "A";
      workoutV2UiState.pendingRoutineCode = code;
      workoutV2CreateDraft(dateKey, code, workoutV2UiState.pendingDateKey ? "gamify" : "startpage");
      renderWorkoutV2();
    } else if (action === "add-entry" && session) {
      session.entries.push(workoutV2NormalizeEntry({ setOrder: String(session.entries.length + 1) }, session.entries.length));
      workoutV2ScheduleSave({ session });
      renderWorkoutV2();
    } else if (action === "remove-entry" && session) {
      session.entries.splice(Number(button.dataset.index), 1);
      session.entries.forEach((entry, index) => { entry.entryOrder = index; });
      workoutV2ScheduleSave({ session });
      renderWorkoutV2();
    } else if (action === "finish" && session) await workoutV2Finish(session);
    else if (action === "reopen" && session) await workoutV2Reopen(session);
    else if (action === "delete-session" && session) await workoutV2DeleteSession(session);
    else if (action === "close-session") {
      workoutV2UiState.selectedSessionId = "";
      renderWorkoutV2();
    } else if (action === "add-template-entry") {
      const routine = workoutV2Routine(workoutV2UiState.templateCode);
      routine.exercises.push(workoutV2NormalizeExercise({ targetSets: 1 }, routine.exercises.length));
      workoutV2ScheduleSave({ routine });
      renderWorkoutV2();
    } else if (action === "remove-template-entry") {
      const routine = workoutV2Routine(workoutV2UiState.templateCode);
      routine.exercises.splice(Number(button.dataset.index), 1);
      routine.exercises.forEach((exercise, index) => { exercise.position = index; });
      workoutV2ScheduleSave({ routine });
      renderWorkoutV2();
    } else if (action === "apply-history-filters") {
      workoutV2UiState.historyText = document.getElementById("workoutV2HistoryText")?.value || "";
      workoutV2UiState.historyFrom = document.getElementById("workoutV2HistoryFrom")?.value || "";
      workoutV2UiState.historyTo = document.getElementById("workoutV2HistoryTo")?.value || "";
      renderWorkoutV2();
    } else if (action === "open-session") {
      workoutV2UiState.selectedSessionId = button.dataset.sessionId;
      workoutV2UiState.view = "Log";
      renderWorkoutV2();
    } else if (action === "preview-import") workoutV2ReadImportText();
    else if (action === "confirm-import") await workoutV2ConfirmImport();
    else if (action === "export-csv") workoutV2ExportCsv();
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    renderWorkoutV2();
  });
}
