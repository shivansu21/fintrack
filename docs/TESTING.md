# Validation and test checklist

## Checks performed while packaging

- `npm ci`/dependency installation: completed (initial install generated the committed lockfile).
- `npm run build`: passed; Vite produced a production bundle. Vite reports a non-fatal large-chunk warning for the chart-inclusive bundle.
- `node --check server/src/app.js`: passed.
- `node --test server/test/domain.test.js server/test/security.test.js`: **8 tests passed**.
  - Exact paise arithmetic and rejection of sub-paise input.
  - Invalid calendar date rejection.
  - Recurrence across short months, leap years and year boundaries.
  - CSV quoting and formula-prefix neutralization.
  - Monthly summaries versus all-date balance.
  - Rejection of missing/invalid login tokens.
  - Request header/origin enforcement.
  - Invalid registration/JSON error responses.
- Full MongoDB API integration suite: **not verified here**. The MongoDB binary downloaded, but the execution environment refused a database startup operation (`open: Operation not permitted`). The integration test was attempted and failed during setup, before assertions could run. This is not reported as a passing test.
- Real browser UI checks: **not completed**. No browser binary was installed, and browser download returned an unusable archive. React compilation is verified, not end-to-end UI behavior.
- Real SMTP email delivery and online deployment: not tested.

Do not interpret the build and unit test results as a full end-to-end certification. Run the integration suite and checklist below on your own computer after configuring MongoDB.

## Running tests

From project root:

```sh
npm test
```

Integration tests use `mongodb-memory-server`, which downloads and launches an isolated temporary MongoDB executable. It does not use or clear your normal `fintrack` database. The first run requires an internet connection and an OS able to run MongoDB. Temporary test data is discarded at the end.

For tests without a MongoDB executable:

```sh
node --test server/test/domain.test.js server/test/security.test.js
```

The supplied API workflow test covers registration, ownership isolation, transaction CRUD, budget calculations, filters/pagination, CSV, recurrence deduplication, sample data and password reset session invalidation.

## Manual acceptance checklist

Use fresh test accounts and your own local database.

1. Register account A, add income ₹1000 and expense ₹250.50 in the same month. Expected: income ₹1000, expense ₹250.50, net savings and recorded balance ₹749.50 if there are no other records.
2. Refresh/restart the application. Records should persist.
3. Change expense to ₹300. Expected savings ₹700. Delete it; expected ₹1000.
4. Set a category budget ₹100, add matching expense ₹85. Expect 85% warning. Edit to ₹120; expect 120% and ₹20 over.
5. Change selected month. The budget and month totals should follow it; all-date recorded balance should remain unchanged.
6. Try each filter, sort and a combination. Enter more than 15 rows to test pagination. Clear filters and verify results reset.
7. Export a filtered CSV. Verify all matching pages are included. Test description containing comma, quotes and line breaks via API if desired.
8. Register account B. It must not see account A's transactions, budgets or schedules.
9. Add a due-today recurrence. Reload repeatedly and confirm one occurrence. Stop the rule and confirm existing records remain.
10. Add a future recurrence. Confirm no transaction is generated early.
11. Check January 31 / February / March recurrence behavior using the unit tests.
12. Forgot-password development flow: inspect terminal URL; reset password, test new login and rejection of old password/reset link.
13. Test empty dashboard, empty search results and no expenses in a month.
14. Resize to mobile width. Test navigation, form dialogs, scrolling tables, charts and logout.
15. Stop the API, attempt an action, restart it and retry. Check readable error feedback.
16. Build and run the single-port mode using the setup guide. Confirm it works at the matching APP_ORIGIN.
