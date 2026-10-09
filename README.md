# FinTrack — Personal Finance & Expense Tracker with Analytics

A complete educational MERN project with a responsive React interface, Express REST API and MongoDB persistence. Designed for a BCA project and full-stack JavaScript practice.

**Start here: [SETUP_HINGLISH.md](SETUP_HINGLISH.md)** — Windows-first instructions, from installation to your first transaction.

## Included

- Registration, login, logout; bcrypt password hashes; JWT in an HttpOnly cookie.
- Forgot/reset password: SMTP email when configured; terminal link for local development.
- Add, edit, delete income and expenses; custom categories, payment method and notes.
- Date/category/type/amount/description filters, sorting and pagination.
- Monthly and category budgets, actual spending and threshold warnings.
- Dashboard, category donut chart, six-month income-versus-expense chart, net savings.
- CSV export of all matching transactions, with spreadsheet formula protection.
- Weekly/monthly recurring entries, month-end handling and duplicate prevention.
- Profile update; optional sample records for an empty account.
- Responsive layouts, loading/empty/error states, confirmation dialogs.
- Input validation, per-user record ownership, rate limiting and request origin checks.

## Stack

React 19, Vite 7, Recharts 3, Lucide icons, plain responsive CSS; Node.js, Express 5, MongoDB with Mongoose, Zod 4, JWT, bcryptjs, Nodemailer. This project intentionally uses a small dependency set: it does not require Tailwind, TanStack Query or a paid service. Exact resolved versions are in `package-lock.json`; use `npm ci` for a repeatable install. These are compatible selected versions, not a promise that every dependency is the newest available release.

## Quick start

Install Node.js 22.12+ (or Node 24 LTS) and start MongoDB Community Server, then in this folder:

```sh
npm ci
npm run setup
npm run dev
```

Open **http://localhost:5173**. Register your own account. The default database is `mongodb://127.0.0.1:27017/fintrack`. For Atlas, first replace `MONGODB_URI` in `server/.env`.

## Commands

| Command, from root | Purpose |
|---|---|
| `npm ci` | Install locked dependencies for client and server |
| `npm run setup` | Create `server/.env` with a random JWT secret; preserve existing settings |
| `npm run dev` | Start API on 5000 and frontend on 5173 |
| `npm run build` | Build frontend into `client/dist` |
| `npm start` | Start Express; serves built frontend if present |
| `npm test` | Unit tests and database-backed API integration tests |
| `node --test server/test/domain.test.js` | Calculation/validation tests without MongoDB |

## Structure

- `client/src/main.jsx`: React pages, forms, tables, charts and navigation.
- `client/src/api.js`: fetch helper and formatting.
- `client/src/styles.css`: responsive styling.
- `server/src/app.js`: Express middleware and REST routes.
- `server/src/models.js`: MongoDB schemas/indexes.
- `server/src/domain.js`: validation, exact money conversion, totals, CSV and date logic.
- `server/src/recurring.js`: recurring transaction processing.
- `server/src/index.js`: configuration, database connection, scheduler and startup.
- `server/test/`: unit and integration test suite.
- `scripts/setup.mjs`: portable environment setup.
- `docs/API.md`: endpoint reference.
- `docs/PROJECT_NOTES.md`: database design, important behavior and viva notes.
- `docs/TESTING.md`: validation results, limitations and manual checklist.

## Important behavior

INR only. Amounts are positive on input; `type` decides income versus expense. Internally amounts are stored as **integer paise**. “Recorded balance” is income minus expenses across all recorded dates, including any manually entered future dates; it is not a bank balance. Monthly cards apply to the selected month. Transaction/report filters are independent of that month until you apply it explicitly. Exports include every matching page.

Recurring entries record transactions in this app; they do not move money. The server checks every minute while running, and relevant reads also catch up due entries. India calendar dates (Asia/Kolkata) are used for scheduling. Monthly schedules keep the original day: January 31 → February 28/29 → March 31. Stop a schedule to change it, then add a new one; existing entries remain.

For password reset, configure SMTP for real delivery. Without SMTP, development mode writes a reset URL to the API terminal. Production never logs reset links. No bank sync, payment processing, AI advice, multi-currency conversion or admin panel is included.

## Build and serve on one local port

Stop development with Ctrl+C. In `server/.env`, change `APP_ORIGIN` to `http://localhost:5000` and keep `NODE_ENV=development` for local HTTP. Then:

```sh
npm run build
npm start
```

Open **http://localhost:5000**. The API and built frontend are served together. For online deployment, use HTTPS, set `NODE_ENV=production`, set `APP_ORIGIN` to the exact HTTPS origin, configure MongoDB and SMTP, and run one API instance initially. Hosting/platform-specific deployment is not performed by this ZIP.

## Reference documentation

- Node.js: https://nodejs.org/en/download
- Vite prerequisites: https://vite.dev/guide/
- Express 5: https://expressjs.com/en/guide/migrating-5.html
- MongoDB Community installation: https://www.mongodb.com/docs/manual/installation/
- MongoDB Atlas connections: https://www.mongodb.com/docs/atlas/connect-to-database-deployment/

Dependencies have their own licenses. Never upload your `.env`, database credentials or `node_modules` to a public repository.
