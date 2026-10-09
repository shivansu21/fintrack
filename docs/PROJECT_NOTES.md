# Project notes and viva preparation

## Problem and objective

People often record expenses in separate notes and cannot easily compare actual spending with their plans. FinTrack brings personal income, expenses, category budgets, recurring records and visual summaries into one authenticated application.

## Architecture

React renders the interface and calls REST endpoints. During development Vite proxies `/api` to Express on port 5000. Express validates inputs, checks the login cookie and record ownership, then uses Mongoose to query MongoDB. In a built local deployment, Express serves both the frontend and API.

CSS is hand-written and responsive. React component state handles the small application; chart components use Recharts. Forms use native browser checks plus authoritative Zod validation on the server.

## Collections

| Collection | Important fields | Relationships / indexes |
|---|---|---|
| users | name, email, passwordHash, categories, tokenVersion, resetHash, resetExpires | Unique email; categories embedded as a short per-user list |
| transactions | userId, type, amountPaise, category, description, paymentMethod, date, recurrenceKey | userId/date index; unique userId/recurrenceKey only for recurring records |
| budgets | userId, month, category, amountPaise | Unique userId/month/category |
| recurrings | userId, type, amountPaise, category, description, paymentMethod, nextDate, frequency, dayOfMonth | Each schedule belongs to one user |

Dates are calendar strings (`YYYY-MM-DD`), preserving the user's chosen transaction day without accidental UTC date shifts. Month strings use `YYYY-MM`. Model timestamps record technical creation/update times separately.

## Key logic

### Money

₹12.34 becomes 1234 paise. Sums use integers; conversion happens only for API views and display. This avoids common binary floating-point addition errors. There is no external bank balance or opening-balance field; record an initial income entry if you want an opening amount included.

### Dashboard

Selected-month income = sum of that month's income rows. Expense = sum of that month's expense rows. Net savings = income − expenses. Recorded balance = all entered income − all entered expenses. Six-month trends end at the selected month. Category breakdown includes expenses only.

This educational implementation calculates summaries from a user's records in application memory. For very large histories, replace this with MongoDB aggregation/date-window queries and appropriate summary caching. CSV already uses a database cursor.

### Budgets

An `All` budget covers all expense categories for that month. A category budget covers its own expenses. These are separate comparisons, so setting overall ₹20,000 and Food ₹5,000 does not mean a ₹25,000 combined limit. >=80% displays an approaching-limit warning; >=100% displays a reached/exceeded message. Budgets do not prevent saving transactions.

### Recurrence

A rule has a next due date and frequency. Each occurrence has a deterministic key `ruleId:YYYY-MM-DD`. An atomic upsert plus unique index prevents duplicate occurrence insertion when two requests process the same schedule. The next date is conditionally advanced. A background minute interval processes due rules; relevant API reads also catch up. A stopped server does not run timers; catch-up occurs after restart.

Monthly schedules retain their original day-of-month even when a shorter month clamps a due date. To amend schedules in the UI, stop and recreate them. Existing entries can be edited/deleted like any other transaction. Stopping a rule while an occurrence is already being processed can race with that occurrence; check recent entries if stopping exactly at a due time. This app is a record keeper, not a banking/payment scheduler.

### CSV

Exports share transaction filters and contain all matching rows. Text is quoted, embedded quotes doubled and formula-like prefixes neutralized. UTF-8 BOM improves spreadsheet compatibility. All amounts are positive; the Type column indicates income/expense.

## Authentication and privacy

Passwords are salted and hashed with bcrypt (cost 12). JWT is signed using the generated secret and delivered in an HttpOnly cookie. Token lifetime is seven days. Browser state-changing requests require a custom header and matching Origin; cookies use SameSite=Lax and Secure in production.

Each protected query is scoped by the authenticated user. Changing an ID in a URL cannot modify another user's record. Reset tokens are random, hashed in the database, time-limited and single-use. Password resets increment tokenVersion to invalidate older JWTs. Logout clears the current browser cookie; it does not revoke a stolen copy of a token. No refresh token flow is included.

## Common viva questions

1. **Why MongoDB?** Transactions, budgets and users map naturally to documents; Mongoose provides schemas and indexes.
2. **Why is userId needed?** It establishes ownership and lets every query filter for the logged-in account.
3. **What is CRUD here?** Create/read/update/delete transaction records through REST endpoints.
4. **Why validate on frontend and backend?** Frontend improves feedback; the backend protects data even when requests bypass the interface.
5. **How are budgets compared?** Sum matching expense paise for the chosen month/category, divide by the limit and display usage.
6. **What is middleware?** Request-processing logic, such as JSON parsing, request protection, authentication and error handling, executed around route handlers.
7. **What does a unique index do?** Prevent duplicate email/budget/recurring-occurrence keys at database level, including concurrent writes.
8. **Authentication versus authorization?** Authentication establishes who the user is; authorization checks which records they may access.
9. **How is a chart populated?** The server produces summary arrays; React passes these arrays into Recharts.
10. **Why not store money as a floating point decimal?** Integer paise avoids errors in common decimal additions.

## Scope and extensions

Included: personal records and analytics. Not included: bank integration, automatic payments, multi-currency conversion, AI recommendations, receipt uploads, email verification, admin management or collaborative accounts. Future extensions could add these after the core workflow is understood.

For public/large-scale use, add deployment-specific proxy/rate-limit configuration, monitoring, backups, broader automated browser tests, more robust scheduling/cancellation, accessibility review, load tests and dependency/security review. No online deployment or live SMTP delivery was performed as part of packaging.
