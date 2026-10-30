# CashewTrace

Working prototype for a GIZ e-MOVE cashew competition entry. CashewTrace is a network of village
quality hubs in Nigeria: hub agents register cashew farmers, receive their raw cashew nut (RCN)
lots, solar-dry them, test moisture % and KOR (lbs of kernel per 80 kg bag), grade each lot and tag
it with a QR code. Buyers scan the QR to verify origin and quality.

> **Prototype · demo data.** All seeded farmers, hubs and lots are fictional. Impact figures are
> estimates and are labelled as such.

## Deploying

See [RAILWAY.md](RAILWAY.md) for the Railway setup (Postgres, variables, pre-deploy migrations,
health check at `/api/health`, domain and one-off seed).

## Stack

Next.js 16 (App Router) + TypeScript · Tailwind CSS v4 · Prisma 6 + PostgreSQL · zod · qrcode ·
iron-session · bcryptjs. No paid services or external APIs.

## Local setup

Requirements: Node.js 20+ and a PostgreSQL database.

1. **Install dependencies** (this also runs `prisma generate`):

   ```bash
   npm install
   ```

2. **Start Postgres.** Either use a local install, or Docker:

   ```bash
   docker run --name cashewtrace-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cashewtrace \
     -p 5432:5432 -d postgres:16
   ```

3. **Configure environment.** Copy the example file and fill it in:

   ```bash
   cp .env.example .env
   ```

   | Variable          | Purpose                                                          |
   | ----------------- | ---------------------------------------------------------------- |
   | `DATABASE_URL`    | Postgres connection string                                       |
   | `SESSION_SECRET`  | Cookie-encryption secret, 32+ characters                         |
   | `PUBLIC_BASE_URL` | Public origin baked into lot QR codes, e.g. `http://localhost:3000` |
   | `ADMIN_PIN`       | PIN for the admin settings login                                 |

   Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

   The database must use **UTF-8** encoding (the ₦ sign is stored in audit entries). Docker's
   `postgres` image and Railway Postgres are UTF-8 by default; a Windows-installed Postgres may not be —
   create it with `CREATE DATABASE cashewtrace ENCODING 'UTF8' TEMPLATE template0;`.

4. **Create the database tables and load demo data:**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   The seed is deterministic. It only runs on an empty database; use `npm run db:seed:reset` to wipe
   and reload. It creates 2 hubs in Kogi State,
   1 admin + 4 agents, 60 farmers, 120 lots (seasons 2025–2026) with quality tests, 40 sales and
   10 buyer enquiries — all fictional.

   Demo logins: admin phone `0800 000 9000` with PIN = `ADMIN_PIN`; agents `0800 000 9001`–`9004`
   with PIN `1234`.

5. **Run the dev server** and open <http://localhost:3000>:

   ```bash
   npm run dev
   ```

## Scripts

| Script               | What it does                                    |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Start the dev server                            |
| `npm run build`      | Generate the Prisma client and build for production |
| `npm start`          | Serve the production build on `$PORT` (default 3000) |
| `npm run lint`       | Run ESLint                                      |
| `npm test`           | Unit tests for grading and sale maths           |
| `npm run db:seed`    | Load the demo data into an **empty** database (no-op if lots exist) |
| `npm run db:seed:reset` | **Wipe everything** and reload the demo data |
| `npm run db:migrate` | Create/apply migrations locally (`prisma migrate dev`) |
| `npm run db:deploy`  | Apply migrations in production (`prisma migrate deploy`) |
| `npm run db:push`    | Sync the schema without a migration (quick prototyping) |
| `npm run db:studio`  | Browse the database in Prisma Studio            |

## Project layout

```
app/
  layout.tsx       Root layout: Inter font + persistent "Prototype · demo data" banner
  (public)/        Public pages: landing, QR lot verification, impact dashboard
  (hub)/           Hub-agent pages (PIN sign-in, farmers, lots)
components/        Shared UI components
lib/
  db.ts            Prisma client singleton
  session.ts       iron-session cookie session
  settings.ts      Single-row Settings (prices, fees, thresholds) with seeded defaults
  grading.ts       Pure grading function: moisture % + KOR → A / B / C / FAIL
  money.ts         Sale maths (in kobo, stored as Decimal naira) and ₦ / kg / tonne formatting
  ids.ts           Codes (CTF-000123, CT-KOG-2026-000123) and initials for public pages
prisma/
  schema.prisma    Data model
  migrations/      SQL migrations (applied with db:deploy on Railway)
  seed.ts          Fictional demo data
```

Money is stored as `Decimal(14,2)` naira throughout and calculated in whole kobo to avoid rounding
drift.

## Auth

Hub agents sign in at `/login` with phone + 4–6 digit PIN (bcrypt). Sessions are iron-session
cookies (httpOnly, `secure` in production, SameSite=Lax, 12-hour expiry).

- `proxy.ts` does a fast cookie-only redirect for `/hub/*` and the admin-only `/hub/settings`,
  `/hub/agents`.
- The authoritative checks are `requireAgent()` / `requireAdmin()` in `lib/auth.ts`, which re-load
  the agent from the DB. Every hub page and every server action must call one of them, and every
  server action validates its input with zod.
- Login is rate-limited in memory: 5 attempts / 15 min per phone + IP, plus 20 / 15 min per phone
  across all IPs. Errors never reveal whether a phone number exists. Counters reset on restart.

## Lot workflow

`/hub/lots/new` → **Received** → start solar drying (moisture before) → **Drying** → quality test
(moisture after, KOR, nut count, defects, drying days) → **Tested** with grade A/B/C/FAIL → **Listed**
→ record sale (buyer, ₦/tonne) → **Sold**. Any unsold lot can be **Rejected** with a reason.

- Grade comes from `lib/grading.ts` using the Settings thresholds. If moisture is above the maximum,
  no test is saved and the lot stays in Drying ("continue drying"); a low-KOR FAIL is saved but
  cannot be listed.
- Status changes go through `transitionLot()` in `lib/lots.ts`: it only applies if the lot is still
  in the expected status (no double sales) and writes an `AuditLog` row, which drives the lot timeline.
- Graded lots get a QR code to `${PUBLIC_BASE_URL}/v/<lotCode>` and printable A6 bag labels
  (`/hub/lots/<id>/labels?per=1|2`).

## Landing page

`/` — hero, the problem, how it works, who benefits, live numbers (4 aggregate KPIs from the
database, cached 5 minutes, labelled "prototype · demo data"), climate-smart, inclusion and footer.
Built for mobile speed: no images (inline SVG only), no client components (plain `<a>` links on the
public pages), and the ₦ sign drawn in the system font so Inter's 84 KiB latin-ext file isn't needed.
Orange text and white-on-orange buttons use `accent-dark` (#B4521A) so they pass WCAG AA contrast.

## Public verification

- `/v/<lotCode>` — public page a buyer reaches by scanning the bag QR code: verdict, grade, quality
  (moisture drop, KOR gauge), origin, chain of custody, status, and a buyer-interest form when the lot
  is listed. Unknown codes return a 404 "Lot not found" page.
- `/verify` — type a lot code (or paste a link) and get redirected to its page.
- `/lots` — public catalogue of LISTED lots (passed grading, farmer consented): summary of tonnes
  available by grade, filters for grade / season / state / minimum KOR, sort by KOR or weight. No
  prices are shown; "Request this lot" jumps to the interest form on the lot's page.
- Everything public goes through `lib/public-lot.ts`, the privacy boundary: farmer initials, community,
  LGA, state and a farm-size band only; agents by first name; timeline wording never includes buyer
  names, prices or payouts.
- Buyer enquiries are protected by a honeypot field and a 5-per-hour-per-IP limit, and appear on the
  hub lot page.
- Link previews (WhatsApp etc.) use Open Graph tags and a generated image per lot. Set
  `PUBLIC_BASE_URL` to the real domain so preview URLs resolve.

## Impact dashboard

- `/hub` (default after login) — KPI tiles for farmers (women / youth / women-or-youth vs the 60%
  target), volume, quality, money and environment, four charts (tonnes per month, grade split, KOR
  histogram, farmers by gender × age), latest lots and latest buyer enquiries with a "Mark contacted"
  toggle. Agents see their own hub; admins can pick a hub. Season filter defaults to the current year.
- `/impact` — public, read-only: the same aggregate KPIs and charts across all hubs, no tables or
  personal data.
- Figures come from `lib/impact.ts`. "Post-harvest loss avoided" is an **estimate**: tonnes
  solar-dried × `spoilageAvoidedFactor` (Settings, default 0.05), labelled as such with the formula.
- Chart colours were checked with a colour-vision-deficiency validator; every chart has a
  "Show data" table.

## Admin

Admins (role ADMIN) also get:

- `/hub/settings` — edit every Settings field (percentages entered as %), validated with zod
  (A > B > C thresholds). Shows when and by whom it was last changed; every change is audited
  with a before → after diff. New thresholds apply to new tests; existing grades are kept.
- `/hub/agents` — add agents, reset PINs, deactivate / reactivate. Deactivated agents can't sign
  in and lose access on their next request; their records are kept.
- `/hub/exports` — CSV downloads (farmers, lots with tests, sales) filtered by season and hub.
  Pseudonymised by default (farmer codes only); names and phone numbers only when explicitly
  ticked. Formula-injection safe, UTF-8 with BOM for Excel, and every export is audited.

## Quality checks

- Friendly 404 / 500 pages (root, hub and lot-verification) and loading skeletons on the dashboard
  and list pages. Skeletons live in route groups (`(dashboard)`, `(list)`) so detail and admin
  pages keep real 404 and redirect status codes.
- Accessibility: axe-core (WCAG 2.1 AA) reports 0 violations across 24 public and hub pages;
  visible keyboard focus everywhere; grade badges always carry text, not just colour.
- Privacy: a crawl of every public page (including all lot pages) finds no farmer name or phone
  number outside `/hub`.
- `robots.txt` allows `/`, `/impact`, `/lots`, `/verify`; disallows `/hub` and `/login`.

## Ground rules

- **Privacy:** public pages show farmer initials, community, LGA and state only — never full name,
  phone number or exact location.
- **Honesty:** the demo-data banner is on every page; computed impact figures are labelled
  "estimated".
- **Mobile-first:** every screen works at 360 px wide with large tap targets.
- **Config, not hard-coding:** prices, fees, commission and grading thresholds live in the
  `Setting` table, editable by an admin.
