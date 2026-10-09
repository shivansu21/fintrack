# FinTrack — Complete step-by-step setup (Windows + Hinglish)

## Pehle samjho

Ye **React + Node.js + Express + MongoDB** project hai. XAMPP, PHP aur MySQL ki zarurat nahi hai. ZIP extract karke HTML ko double-click karne se app nahi chalega. Frontend, API aur database chahiye.

Internet sirf software/dependencies install karne aur Atlas use karne par chahiye. Local MongoDB ke saath installation ke baad app locally chal sakta hai.

## Step 1 — Software install karo

1. https://nodejs.org/en/download se Node.js 24 LTS ya compatible Node 22.12+ install karo. Installer mein npm aur PATH options enabled rehne do.
2. https://code.visualstudio.com/ se VS Code install karo (optional, lekin code samajhne ke liye useful).
3. Saare purane terminals close karke Command Prompt open karo.
4. Check:

```bat
node -v
npm -v
```

Dono version dikhayenge. `node is not recognized` aaye to Node reinstall/terminal restart karo.

## Step 2 — ZIP extract karo

1. `FinTrack_Project.zip` download karo.
2. Right click → **Extract All**. ZIP ke andar se project mat run karo.
3. Extracted `fintrack` folder ko, for example, `C:\Projects\fintrack` mein rakho.
4. VS Code → File → Open Folder → `C:\Projects\fintrack` select karo.
5. Ye folder sahi hai agar usmein `package.json`, `client`, `server`, `README.md` dikh rahe hain.
6. VS Code → Terminal → New Terminal. Terminal dropdown se **Command Prompt** select kar sakte ho.

```bat
cd C:\Projects\fintrack
```

Apne actual extracted path ka use karo. Path mein spaces hon to quotes lagao: `cd "C:\My Projects\fintrack"`.

## Step 3 — Dependencies install karo

Project ke root folder mein:

```bat
npm ci
```

Pehli baar kuch minutes lag sakte hain. Ye frontend aur backend dono install karega. `node_modules` folder automatically banega. ZIP mein intentionally node_modules nahi hai.

`npm ci` lockfile ke exact versions install karta hai. Lockfile delete karna ya `npm audit fix --force` chalana setup ka part nahi hai.

## Step 4 — Environment file automatically banao

```bat
npm run setup
```

Output: `Created server/.env with a unique secret.`

Ye command random `JWT_SECRET` generate karti hai. Existing `.env` ko overwrite nahi karegi. VS Code mein `server/.env` open karo. **.env.example template hai; active settings .env mein hain.**

Default settings:

```dotenv
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fintrack
JWT_SECRET=your-generated-secret-will-already-be-here
APP_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Generated JWT_SECRET ko above placeholder se replace mat karna.

## Step 5 — Database choose karo (sirf A ya B)

### Option A — Local MongoDB (college lab/offline use)

1. https://www.mongodb.com/try/download/community se apne operating system ka MongoDB Community Server installer lo. MongoDB **Compass alone database server nahi hai**.
2. Windows installer mein Complete setup choose karo; **Install MongoDB as a Service** enabled rakho.
3. Compass optional hai: data visually dekh sakte ho.
4. Windows Start → **Services** → **MongoDB Server** dhoondo → status Running hona chahiye. Stopped ho to Start karo.
5. `server/.env` mein default URI rehne do:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/fintrack
```

6. Compass se same URI par connect kar sakte ho. `fintrack` database records create hone par dikh jayega. Database/collections manually banana zaruri nahi.

macOS/Linux ke liye official OS-specific instructions: https://www.mongodb.com/docs/manual/installation/ . Server start karne ke baad same local URI use karo.

**Optional Docker alternative**, agar Docker pehle se installed hai:

```sh
docker compose up -d
```

Included compose file MongoDB ko sirf localhost:27017 par expose karti hai aur named volume mein data preserve karti hai. Local service aur Docker dono same port par ek saath mat chalao. Stop: `docker compose stop`. `docker compose down -v` data delete karega — normal stop ke liye use mat karo.

### Option B — MongoDB Atlas (cloud database)

1. https://www.mongodb.com/cloud/atlas par account banao.
2. Apne account mein available suitable database deployment create karo. Plan/pricing dashboard mein check karo.
3. **Database Access** mein database username/password banao. Ye Atlas login password se alag hai.
4. **Network Access** mein apna current public IP allow karo. IP change hone par update karna padega.
5. Deployment → Connect → Drivers → Node.js ka connection string copy karo. Dashboard labels badal sakte hain; official guide: https://www.mongodb.com/docs/atlas/connect-to-database-deployment/ .
6. `server/.env` mein connection string paste karo, actual database credentials aur database name `fintrack` use karo:

```dotenv
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_ENCODED_PASSWORD@YOUR_CLUSTER/fintrack?retryWrites=true&w=majority
```

Ye example directly kaam nahi karega: apne real cluster hostname/credentials use karne hain. Password mein `@`, `:`, `/`, `#` jaise characters ho to URI component percent-encoding chahiye. URI/credentials kisi ko share mat karo.

## Step 6 — App start karo

Project root terminal mein:

```bat
npm run dev
```

Expected messages:

- `FinTrack API ready: http://localhost:5000`
- Vite local address: `http://localhost:5173`

Ab browser mein **http://localhost:5173** open karo. Is setup mein `127.0.0.1:5173` ke bajay exactly `localhost:5173` use karo, kyunki origin protection configured hai.

Terminal open rehna chahiye. Ctrl+C se app band hota hai. Frontend normally edit karne par refresh hota hai; API watch mode backend changes par restart hota hai.

API health check: http://localhost:5000/api/health . Expected database status: `connected`.

## Step 7 — Account banao

1. Login screen → **New here? Create an account**.
2. Name, email, minimum 8-character password enter karo.
3. **Create account** click karo. Dashboard open hoga.
4. Koi predefined admin/demo password nahi hai. Apna account create karo.
5. Email verification is project mein included nahi hai; reset emails use karna hai to apna working email do.

## Step 8 — First demonstration

Quick demo ke liye empty dashboard mein **Load sample data** click karo. Ye fictional records hain aur database mein save honge; empty account par hi sample load allowed hai. Records individually delete kar sakte ho, ya real entries ke liye doosra account banao.

Manual example:

1. **Add transaction** → Income → ₹35000 → Salary → current date → Monthly salary → Save.
2. **Add transaction** → Expense → ₹2500 → Food → current date → Groceries → Save.
3. Dashboard current month choose karo. Income ₹35000, expenses ₹2500, net savings ₹32500 dikhna chahiye (agar aur records nahi hain).
4. **Budgets** → Set budget → Overall monthly budget → ₹20000 → Save.
5. Food category ke liye ₹5000 budget bhi set karo.
6. Overall aur category limits independently compare hote hain; inhe add karke total budget nahi banate.
7. **Transactions** mein pencil se edit aur trash icon se delete karo. Delete confirmation aayega.
8. Search description, category, dates, amount, income/expense filters aur sorting try karo.
9. **Analytics** mein six-month chart aur selected month ka category donut dekho.
10. **Reports** mein selected month choose karo, **Apply selected month to report filters** click karo, phir **Download CSV**. Excel/LibreOffice mein open karo.
11. CSV saare filtered pages export karta hai, sirf visible rows nahi. Transaction list ka export bhi same behavior hai.
12. **Settings** mein profile name update karo aur custom category add karo.

## Step 9 — Recurring entries

1. **Recurring** → Add schedule.
2. Income/expense, amount, category, description, first due date, weekly/monthly choose karo.
3. First date today/past hai to due entries immediately catch up hongi. Future date hai to due day par record generate hoga.
4. Server running ho to har minute check hota hai. Band ho to reopen par missed dates catch up hoti hain. Per rule per pass maximum 400 occurrences process hote hain; bahut purane schedule ke liye next pass remaining entries process karega.
5. January 31 monthly schedule February ki last date aur March 31 ko resume karta hai.
6. **Stop** future generation rokta hai; already recorded entries remain karti hain. Changes ke liye schedule stop karke naya schedule banao.
7. Ye sirf financial record create karta hai. Bank transfer/auto payment nahi karta.

## Step 10 — Forgot password

### Local demo without email service

1. Log out → Forgot password → registered email enter karo.
2. API terminal mein `Development-only password reset link:` aayega.
3. Apne local terminal se URL browser mein open karo.
4. 30 minutes ke andar new password set karo, phir login.
5. Reset ke baad previous login sessions invalid ho jate hain.

### Real email delivery (optional)

`server/.env` mein apne SMTP provider ki details bharo:

```dotenv
SMTP_HOST=your-provider-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=FinTrack <your-verified-sender@example.com>
```

SMTP provider ke verified sender/app-password requirements follow karo. Port 465 configure karoge to direct TLS use hoga. `.env` edit ke baad server restart karo. Production mode mein SMTP ke bina email reset delivery kaam nahi karegi, aur link console par print nahi hoga.

## Step 11 — Production-style local demo (single port)

1. Ctrl+C se dev servers stop karo.
2. `server/.env` mein `APP_ORIGIN=http://localhost:5000` karo.
3. Local HTTP par `NODE_ENV=development` hi rakho.
4. Run:

```bat
npm run build
npm start
```

5. Browser: **http://localhost:5000**.
6. Dev mode mein wapas jana ho to stop, origin ko `http://localhost:5173` karo aur `npm run dev` chalao.

Online deployment ke liye HTTPS, real database settings, random secret, SMTP aur exact HTTPS APP_ORIGIN configure karna padega. `NODE_ENV=production` secure cookies enable karta hai. ZIP se automatic online hosting nahi hoti.

## Step 12 — Agli baar project kaise open karna hai?

1. MongoDB running rakho (Atlas use hai to internet/access settings check).
2. Project folder terminal open karo.
3. `npm run dev` chalao.
4. http://localhost:5173 open karo.

Har baar `npm ci` ya `npm run setup` ki zarurat nahi. Data MongoDB mein saved rehta hai. Node_modules delete/reinstall ya app restart se database clear nahi hota.

## Common errors — exact checks

| Error | Kya check karna hai |
|---|---|
| `npm is not recognized` | Node installed hai? Naya terminal open kiya? `node -v` check karo. |
| `npm.ps1 cannot be loaded` | VS Code terminal profile **Command Prompt** choose karo, ya `npm.cmd` use karo. Security policy globally change karna zaruri nahi. |
| `ENOENT package.json` | Wrong folder. Root `fintrack` folder mein `cd` karo. |
| MongoDB connection failed / ECONNREFUSED | Local MongoDB service start karo; Compass install alone enough nahi. URI 127.0.0.1:27017 check karo. |
| Atlas authentication failed | Database Access credentials, password encoding aur hostname check karo. |
| Atlas network timeout | Current public IP allowlist, internet/DNS aur cluster availability check karo. |
| Request origin is not allowed | Browser origin exactly APP_ORIGIN hona chahiye, without trailing slash. Correct port use karo. API restart karo. |
| Vite port 5173 in use / EADDRINUSE | Isi project ka old terminal Ctrl+C se stop karo. Agar ports intentionally badlo to vite config proxy/APP_ORIGIN bhi update karo. |
| `Please log in` after API restart | JWT_SECRET badal gaya ho ya session expire ho to login again. Cookies allowed honi chahiye. |
| HTTP par production login loop | Local HTTP mein NODE_ENV=development rakho; secure cookies ko HTTPS chahiye. |
| Failed to fetch / proxy error | API terminal mein MongoDB connection error to nahi? Dono dev processes running hain? |
| Empty monthly chart | Selected month aur transaction date same hain? Income-only month mein expense donut empty rahega. |
| Existing email / duplicate record | Same email se login karo ya doosra email register karo. |
| Too many attempts | Auth rate limit ke liye 15 minutes wait; repeatedly submit mat karo. |
| Forgot password email missing | Local terminal dekho (development/no SMTP), ya SMTP config/provider logs verify karo. Response account existence reveal nahi karta. |
| `npm test` MongoDB binary/start error | Integration tests temporary MongoDB executable download/start karte hain. Network/OS restrictions ho sakti hain. Pure tests: `node --test server/test/domain.test.js`. Test error ko production DB clear karke fix mat karo. |

## Submission aur viva ke liye

- `docs/PROJECT_NOTES.md` architecture/schema/logic samjhata hai.
- `docs/API.md` endpoints explain karta hai.
- `docs/TESTING.md` actual checks aur manual demo checklist deta hai.
- Apni `.env` aur database passwords submit/public GitHub upload mat karo.
- Project ka code padhkar login → transaction → database → analytics flow khud explain karna practise karo.
