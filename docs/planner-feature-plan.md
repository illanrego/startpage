# Startpage Planner Feature Plan

Created: 2026-08-31

## Name

Planner.

## Problem

Startpage already has execution surfaces: To-do, Dailies, Kanban, Calendar, Ideas, Feature backlog,
ClickUp, Finance, and Gamify. What is missing is the layer between a strategy doc and today's tasks:
a time-horizon planner that keeps 2-month / quarter plans visible without turning them into daily
noise.

## Product truth

Planner is the horizon layer. It answers: "What period are we in, what are the outcomes, what phase
is active, and what weekly blocks keep it moving?"

It does not replace To-do, Kanban, Calendar, ClickUp, or Gamify. It links the strategic decision to
execution.

## V1/V2 scope

- Add a Windows-98 style Planner app/window to Startpage.
- Persist a single active plan locally and in Supabase when signed in.
- Seed new users/local mode with the current Farming Window plan:
  - horizon: 2026-08-31 to 2026-10-31
  - primary: nerd/comedy lane
  - hedge: dev / portfolio fuel
  - floor: comics-legendados pipeline + minimal IG
- Show:
  - plan title and date range
  - strategy summary
  - lanes (Primary, Hedge, Floor)
  - milestones
  - weekly blocks
  - next review date
- Add an active sprint/week inside the horizon:
  - sprint title, start/end dates, focus, planned outcomes, result, notes
  - close sprint button marks it done and moves it into a visible Sprint Log
  - the next sprint starts from carry-over work instead of erasing history
- Allow inline editing through plain text inputs/textareas and one Save button.
- Provide a small "send to today" affordance that copies one selected weekly block into the To-do
  input instead of creating tasks automatically. No Habitica write from Planner V1.

## V1 boundaries

- No multi-plan archive UI yet.
- No drag/drop roadmap editor.
- No calendar generation.
- No automatic Habitica/ClickUp writes.
- No AI planning inside the app yet.

## Data model

Local storage key: `plannerState`

Supabase table: `planner_plans`

Fields:
- `id`
- `user_id`
- `title`
- `starts_on`
- `ends_on`
- `summary`
- `primary_lane`
- `hedge_lane`
- `floor_lane`
- `milestones jsonb`
- `sprints jsonb` (active sprint + closed sprint log)
- `review_on`
- `status` (`active`, `archived`)
- timestamps

## Verification

- Static verifier confirms Planner UI exists in `index.html`.
- Static verifier confirms Planner logic/storage/backend hooks exist in `startpage.js`.
- Static verifier confirms Planner CSS selectors exist.
- Static verifier confirms Supabase migration exists with RLS and ownership policy.
