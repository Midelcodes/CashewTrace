# Deploying CashewTrace to Railway

One web service (this repo) plus Railway's PostgreSQL. About 15 minutes end to end.

## How the deploy is wired

| Step | Command | When it runs |
| --- | --- | --- |
| Install | `npm ci` (+ `postinstall`: `prisma generate`) | build |
| Build | `npm run build` → `prisma generate && next build` | build |
| Migrate | `npm run db:deploy` → `prisma migrate deploy` | **pre-deploy**, every deploy |
| Start | `npm start` → `next start` (listens on Railway's `$PORT`, host `0.0.0.0`) | runtime |
| Health | `GET /api/health` → `{"ok":true}` (also pings Postgres) | before traffic switches |
| Seed | `npm run db:seed` | **once, by hand** |

**Why migrations are not in the build:** Railway's private network (`postgres.railway.internal`) is
only reachable at runtime, not while building, so `prisma migrate deploy` inside `npm run build`
fails with `P1001: Can't reach database server`. The pre-deploy command runs after the build, inside
the private network with the service's variables, and a failed migration stops the deploy.

---

## 1. Create the project and database

1. Go to <https://railway.com> → **New Project** → **Empty project** (or deploy from repo — see step 2).
2. In the project canvas click **+ Create** (or **New**) → **Database** → **PostgreSQL**.
   Railway creates a service called **Postgres** with a `DATABASE_URL` variable.

## 2. Add the app from GitHub

1. Push this repo to GitHub first (commands at the bottom).
2. In the same project click **+ Create** → **GitHub Repo** → pick `cashewtrace`.
   Railway detects Node.js and starts a first build — it is expected to fail its health check
   until the variables below are set.

## 3. Set variables on the app service

Open the **cashewtrace** service → **Variables** → **Raw Editor**, paste, then fill in the values:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
SESSION_SECRET=<64 random hex characters — see below>
ADMIN_PIN=<4–6 digit admin PIN>
PUBLIC_BASE_URL=https://placeholder.up.railway.app
NODE_ENV=production
```

- `DATABASE_URL` must be the **reference** `${{Postgres.DATABASE_URL}}` (the service name must match
  your database service; Railway autocompletes it when you type `${{`).
- Generate `SESSION_SECRET` locally:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `ADMIN_PIN` is used **only by the seed** to set the admin's PIN (admin phone `0800 000 9000`).
  Use a real secret, not the local demo value.
- `PUBLIC_BASE_URL` is a placeholder until step 5.

## 4. Service settings

**cashewtrace** service → **Settings**:

- **Deploy → Pre-deploy command:** `npm run db:deploy`
- **Deploy → Custom start command:** leave empty (uses `npm start`) or set `npm start`
- **Deploy → Healthcheck path:** `/api/health` (default timeout 300 s is fine)
- **Build:** leave the default build command (`npm run build`)

Click **Deploy** (Railway shows staged changes until you apply them).

## 5. Generate the public domain, then point QR codes at it

1. **Settings → Networking → Public Networking → Generate Domain.**
   If asked for a port, accept the detected one (the app listens on Railway's `PORT`).
2. Copy the domain, e.g. `https://cashewtrace-production.up.railway.app`.
3. **Variables:** set `PUBLIC_BASE_URL` to that exact URL (https, **no trailing slash**).
4. Apply/redeploy. `PUBLIC_BASE_URL` is baked into QR codes, bag labels, link previews and
   `robots.txt`, so this redeploy is required. **Only print bag labels after this step.**

## 6. Seed the demo data — once

Install the CLI and open a shell **inside** the running container (`railway run` would run on your
own computer, which can't reach the private database):

```bash
npm i -g @railway/cli        # or: scoop install railway
railway login
railway link                 # choose the CashewTrace project + environment
railway ssh                  # choose the cashewtrace service; first run asks to register an SSH key
# now inside the container:
npm run db:seed
exit
```

Dashboard alternative: right-click the service → **Copy SSH Command**, paste it in a terminal.

`npm run db:seed` refuses to touch a database that already has lots, so running it twice is safe.
To **wipe everything** and reload the demo data later: `npm run db:seed:reset` (inside `railway ssh`).

## 7. Check it

- `https://<your-domain>/api/health` → `{"ok":true}`
- `/` landing page shows live numbers; `/lots`, `/impact`, `/verify` load
- `/login` → admin `0800 000 9000` + your `ADMIN_PIN`; agent `0800 000 9001` + `1234`
- Open a listed lot in the hub → its QR code / verify link must start with your Railway domain
- Run <https://pagespeed.web.dev> on the landing page (mobile)

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Build log: `P1001 Can't reach database server at postgres.railway.internal` | Something runs migrations during the build. Keep `prisma migrate deploy` only in the **pre-deploy command**. |
| Deploy fails at pre-deploy | Check `DATABASE_URL` is the `${{Postgres.DATABASE_URL}}` reference and the Postgres service is running. |
| Health check fails / "service unavailable" | Open deploy logs. The app must listen on `$PORT` (default `npm start` does). `/api/health` returns 503 if Postgres is unreachable. |
| Sign-in or forms fail with an origin / "Server Action" error | `PUBLIC_BASE_URL` must exactly match the domain in the browser (https, no trailing slash); redeploy after changing it. |
| QR codes or link previews show `localhost` or an old domain | Update `PUBLIC_BASE_URL` and redeploy. Re-print any labels made before the change. |
| `SESSION_SECRET must be set and at least 32 characters long` | Set `SESSION_SECRET` (64 hex characters from the command above). |
| Changed `ADMIN_PIN` but the old PIN still works | The PIN is set when seeding. Change it in **Hub → Agents → Reset PIN**, or re-seed with `db:seed:reset` (wipes data). |
