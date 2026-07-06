# Liver Department — Backend API

Backend for the GEM Institute Liver Department app (Screens 1–8: registration,
PIN login, patient records, MELD and Child-Pugh tracking).

## What this is

A Node.js + Express REST API backed by PostgreSQL (via Prisma). It's the real
data store behind the phone screens we designed — once this is deployed and
the app is pointed at it, all 5 colleagues see the same shared patient data.

## 1. Get a Postgres database (5 minutes)

You don't need to run your own database server. Free/cheap managed options
that work well for a team of 5:

- **Neon** (neon.tech) — generous free tier, easiest to set up
- **Supabase** (supabase.com) — free tier, includes a nice data browser
- **Railway** (railway.app) — free trial credit, simple

Create a project, then copy the **connection string** it gives you
(looks like `postgresql://user:pass@host/dbname`).

## 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — paste the connection string from step 1
- `JWT_SECRET` — generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

## 3. Install and set up the database

```bash
npm install
npx prisma migrate dev --name init
```

This creates all the tables (Staff, Patient, PatientPhone, MeldReading,
ChildPughReading) in your database.

## 4. Run it

```bash
npm run dev
```

The API is now running at `http://localhost:4000`. Check `http://localhost:4000/health`
to confirm it's up.

## Step-by-step deployment (so your colleagues' phones can reach it)

### 1. Get a Postgres database — Neon (free, ~3 minutes)

1. Go to **neon.tech** and sign up (GitHub sign-in is fastest)
2. Click **Create a project** — name it `liver-department`, any region close to Chennai/Coimbatore works
3. On the project dashboard, copy the **connection string** — it looks like:
   `postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/liver_department?sslmode=require`
4. Keep this tab open, you'll paste this string into Render in step 3

### 2. Push this code to GitHub (~3 minutes)

If you don't already have this project in a GitHub repo:

```bash
cd liver-backend
git init
git add .
git commit -m "Initial backend"
```

Then create a new empty repo on **github.com** (no README/gitignore, we already have one),
and push:

```bash
git remote add origin https://github.com/<your-username>/liver-backend.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Render using the included Blueprint (~3 minutes)

This repo includes a `render.yaml` file, so Render can set almost everything up
automatically:

1. Go to **render.com** and sign up (GitHub sign-in is fastest)
2. Click **New +** → **Blueprint**
3. Connect your GitHub account and select the `liver-backend` repo you just pushed
4. Render will detect `render.yaml` and show one service: `liver-dept-api`.
   Click **Apply**.
5. It will ask for the `DATABASE_URL` value (the only one not auto-generated) —
   paste the Neon connection string from step 1. `JWT_SECRET` is generated
   for you automatically.
6. Click **Deploy**. First deploy takes a few minutes — it runs
   `npm install`, generates the Prisma client, and runs the database
   migration automatically (creating all your tables).
7. When it's done, Render gives you a URL like:
   `https://liver-dept-api.onrender.com`

### 4. Point the app at your live backend

Open `liver_dept_app.jsx` and change:

```js
const API_BASE = "http://localhost:4000";
```

to your real Render URL:

```js
const API_BASE = "https://liver-dept-api.onrender.com";
```

That's it — re-share the app artifact, and every screen (register, PIN
login, patients, MELD, Child-Pugh) now talks to your live, shared database.

**Free-tier note:** Render's free web services "sleep" after 15 minutes of
inactivity and take ~30–50 seconds to wake up on the next request. Fine for
testing with your 5 colleagues; if that delay becomes annoying day-to-day,
Render's cheapest paid tier ($7/mo) removes it.


## API endpoints

| Screen | Method | Path | Purpose |
|---|---|---|---|
| 2+3 | POST | `/auth/register` | Create staff account + PIN |
| 4 | POST | `/auth/login` | Log in with 4-digit PIN |
| 6 | POST | `/patients` | Create a new patient (incl. referral source) |
| 5/15/21 | GET | `/patients` | List all patients — latest MELD/CP/status/DDLT/HCC-due for dashboard & search |
| 6 detail | GET | `/patients/:id` | Full patient record + complete history across every screen |
| 7 | POST | `/patients/:id/meld` | Add a dated MELD reading |
| 7 | GET | `/patients/:id/meld` | MELD history for trend chart |
| 8 | POST | `/patients/:id/child-pugh` | Add a dated Child-Pugh reading |
| 8 | GET | `/patients/:id/child-pugh` | Child-Pugh history for trend chart |
| 14 | POST | `/patients/:id/endoscopy` | Add an endoscopy findings entry |
| 14 | GET | `/patients/:id/endoscopy` | Endoscopy findings history |
| 10 | POST | `/patients/:id/etiology` | Record/revise etiology |
| 10 | GET | `/patients/:id/etiology` | Etiology history |
| 11 | POST | `/patients/:id/disease-status` | Record compensated/decompensated status |
| 11 | GET | `/patients/:id/disease-status` | Disease status history |
| 12 | POST | `/patients/:id/ddlt` | Record DDLT registration status |
| 12 | GET | `/patients/:id/ddlt` | DDLT registration history |
| 17 | POST | `/patients/:id/status` | Update patient status (transplanted, expired, etc.) |
| 17 | GET | `/patients/:id/status` | Patient status history |
| 19 | GET | `/patients/:id/medications` | Current medications + full change log |
| 19 | POST | `/patients/:id/medications` | Start a new medication |
| 19 | POST | `/patients/:id/medications/:medId/change` | Log a dose change / stop / restart |
| 20 | POST | `/patients/:id/hcc` | Add an HCC surveillance screening |
| 20 | GET | `/patients/:id/hcc` | HCC surveillance history |
| Export | GET | `/export/xlsx` | Download everything as an Excel workbook |

All routes except `/auth/*` require an `Authorization: Bearer <token>` header
— the token returned by register/login.

## Security notes (please read before using real patient data)

- PINs are never stored in plain text — only a bcrypt hash, plus a separate
  keyed hash used just to look up/enforce PIN uniqueness.
- Every patient, MELD, and Child-Pugh entry records **who** entered it
  (`enteredById` / `createdById`) — this is your audit trail.
- This backend does **not** yet encrypt data at rest beyond what your database
  host provides by default, and does not yet have rate-limiting on login
  attempts (worth adding before wider real-world use, given only 10,000
  possible 4-digit PINs).
- Always use `https://` for the deployed URL, never `http://`, so data isn't
  sent in the clear over hospital wifi.
- Given this holds real patient health data, it's worth having someone
  familiar with India's DPDP Act (or your hospital's data policy) review the
  setup before go-live — this backend gives you the technical pieces (hashed
  auth, audit trail, per-user attribution) but the policy/compliance side is
  separate from the code.

## Next steps

- **Reconnect the frontend**: the app (`liver-frontend`) is currently in `MOCK_MODE`
  (see the `MOCK_MODE` constant near the top of `App.jsx`), using an in-memory
  fake backend so screens could be designed and tested without a live server.
  Etiology, Disease Status, DDLT, Patient Status, Medications, and HCC
  Surveillance all currently manage their own state client-side and don't yet
  call these new endpoints — that wiring (same pattern already used for
  Register/Login/Patients/MELD/Child-Pugh) is the next step before this is
  usable by your team for real.
- If you're already deployed once before, this update includes a new
  migration (`20260706000000_add_clinical_screens`) — pushing this to Render
  will run it automatically via `prisma migrate deploy` in the build step, no
  manual database changes needed.
- Add HTTPS + deploy (step 5 above), if not done already
- Consider adding rate-limiting on `/auth/login` to slow down PIN guessing
