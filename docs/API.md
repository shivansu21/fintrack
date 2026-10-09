# REST API reference

Base URL in development: `http://localhost:5000/api`. The React app requests `/api` through Vite's proxy. Production builds and Express can share an origin.

JSON requests use `Content-Type: application/json`. All POST, PUT, PATCH and DELETE requests must send `X-FinTrack: 1`. Browser Origin must match `APP_ORIGIN`. Authentication is an HttpOnly `fintrack` cookie. In Postman, use the cookie jar; register/login first.

| Method | Endpoint | Input / result |
|---|---|---|
| GET | `/health` | API status, database connection status |
| POST | `/auth/register` | `{name,email,password}` → public user + cookie |
| POST | `/auth/login` | `{email,password}` → public user + cookie |
| POST | `/auth/logout` | Clears cookie |
| POST | `/auth/forgot-password` | `{email}` → generic message; reset email or dev terminal URL |
| POST | `/auth/reset-password` | `{token,password}` → single-use reset; old sessions invalidated |
| GET | `/me` | Current user's id, name, email, categories |
| PATCH | `/me` | `{name}` → updated public user |
| POST | `/categories` | `{name}` → add category (max 50 categories per user) |
| GET | `/transactions` | Filtered records, 15 per page; `{rows,total,page,pages}` |
| POST | `/transactions` | Transaction input below → created row |
| PUT | `/transactions/:id` | Full editable transaction input → updated row |
| DELETE | `/transactions/:id` | Delete owned transaction |
| GET | `/transactions/export` | CSV, all matching rows using same filters |
| GET | `/summary?month=2026-10` | Income, expense, savings, all-date balance, categories, six-month trends |
| GET | `/budgets?month=2026-10` | Budget rows with amount and actual expense spending |
| PUT | `/budgets` | `{month,category,amount}` → insert/update same user/month/category |
| DELETE | `/budgets/:id` | Delete owned budget |
| GET | `/recurring` | Active schedules and next due dates |
| POST | `/recurring` | Transaction input without `date`, plus `nextDate`, `frequency` |
| DELETE | `/recurring/:id` | Stop owned schedule; generated records remain |
| POST | `/demo-data` | Add fictional current-month records to empty account only |

All endpoints except health and auth routes require login. Protected writes always use the authenticated user ID, never a user ID supplied by the client.

## Transaction input

```json
{
  "type": "expense",
  "amount": 250.50,
  "category": "Food",
  "description": "Lunch",
  "paymentMethod": "UPI",
  "date": "2026-10-06"
}
```

`amount` is positive INR, at most two decimal places and no more than ₹100,000,000 per record. Type: income/expense. Payment method: UPI/Cash/Card/Bank transfer/Other. Category must exist in the current user's category list. Dates: valid ISO calendar days between 2000 and 2100. Description: up to 200 characters.

The model stores `amountPaise`; API transaction views also return `amount` in INR.

## Filtering

`GET /transactions?type=expense&category=Food&from=2026-10-01&to=2026-10-31&min=100&max=1000&q=lunch&sort=newest&page=1`

- from/to: inclusive calendar dates.
- min/max: inclusive positive amount bounds in INR; zero allowed for filters.
- q: literal case-insensitive description substring; not raw regular expression input.
- sort: newest / oldest / highest / lowest.
- page: positive integer; page size 15.
- Export shares filters; page is ignored so the entire matching report is exported. Export order is date descending.

## Error handling

JSON shape: `{ "message": "Human-readable error" }`.

400 invalid input; 401 missing/invalid login; 403 request protection failed; 404 missing/not-owned record; 409 duplicate/existing data; 429 rate limit; 500 unexpected server failure. The shared API rate limiter may return a plain-text 429 response. The frontend handles non-JSON responses with a fallback message.

Auth: up to 30 requests per 15 minutes per IP. API: up to 300 requests/minute per IP. These limits use memory and apply to a single process.
