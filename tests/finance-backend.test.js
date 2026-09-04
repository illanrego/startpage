const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const appSource = fs.readFileSync("startpage.js", "utf8");
const schemaSource = fs.readFileSync(
  "supabase/migrations/20260530000000_core_app_schema.sql",
  "utf8",
);
const openingBalanceSource = fs.readFileSync(
  "supabase/migrations/20260603120000_finance_opening_balances.sql",
  "utf8",
);

test("Finance signed-in lifecycle loads and refreshes the database state", () => {
  assert.match(appSource, /async function loadBackendSession\(session\)/);
  assert.match(appSource, /if \(shouldImportLocal\) await importFinanceLocalDataOnce\(\);/);
  assert.match(appSource, /await loadFinanceRecurringState\(\);/);
  assert.match(appSource, /await refreshFinanceBackendState\(\);/);
  assert.match(appSource, /function handleBackendSession\(session\)/);
  assert.match(appSource, /backendSessionLoadPromise \|\| Promise\.resolve\(\)/);
});

test("Finance logs use an owned Supabase table for CRUD and cross-device reads", () => {
  assert.match(schemaSource, /create table if not exists public\.finance_entries/);
  assert.match(schemaSource, /alter table public\.finance_entries enable row level security/);
  assert.match(schemaSource, /auth\.uid\(\) = user_id/);
  assert.match(appSource, /\.from\("finance_entries"\)\s*\.select/);
  assert.match(appSource, /\.from\("finance_entries"\)\s*\.insert/);
  assert.match(appSource, /\.from\("finance_entries"\)\s*\.update/);
  assert.match(appSource, /\.from\("finance_entries"\)\s*\.delete/);
});

test("Finance opening balance persistence has its own RLS-protected migration", () => {
  assert.match(openingBalanceSource, /create table if not exists public\.finance_opening_balances/);
  assert.match(openingBalanceSource, /alter table public\.finance_opening_balances enable row level security/);
  assert.match(openingBalanceSource, /finance_opening_balances_all_own/);
  assert.match(appSource, /\.from\("finance_opening_balances"\)/);
});
