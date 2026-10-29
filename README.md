# Sejuk Ops

Internal operations system for **Sejuk Sejuk Service Sdn Bhd** (aircond installation, servicing and repair), built for the *Programmer Assessment – Operations System + AI Challenge*.

**Live demo:** https://sejuksejuk.vercel.app · open it, pick a role, press **Continue**. No password needed.

**Email sign-in (real Supabase Auth):** on the sign-in page press **Sign in with email** and use one of these test accounts. Each one opens its own workspace, and the server checks the role on every action.

| Role | Email | Password | Opens |
| --- | --- | --- | --- |
| Admin | `admin@demo.sejuksejuk.app` | `abcd1234` | Orders |
| Manager | `manager@demo.sejuksejuk.app` | `abcd1234` | Review queue |
| Technician (Ali) | `ali@demo.sejuksejuk.app` | `abcd1234` | Ali's jobs |

These are shared demo accounts with no real data behind them. **Switch role** goes back to the role picker; **Log out** ends the session.

**How it was built:** in stages over three days, each merged through a pull request and tested on the live site. See [docs/development-history.md](docs/development-history.md).

**Tested:** 54 automated workflow and permission checks, 38 screens at phone and desktop size, and the full job flow on a real iPhone. See [docs/test-report.md](docs/test-report.md).

![Sejuk Sejuk mark](public/brand/sejuk-mark.svg)

```text
Order → Assignment → Service completion → Notification → Manager review → Reporting
New  →  Assigned  →  In Progress  →  Job Done  →  Reviewed  →  Closed
```

## What I built

One Next.js app, one Supabase database, three role-specific experiences.

| Role | Device | Design reference | Screens |
| --- | --- | --- | --- |
| **Admin** | Desktop | Shopify Admin | Orders (live stats, status tabs, search, branch/technician filters) · Create order (technician picker with live workload, WhatsApp preview) · Order detail (status stepper, assign / reassign, reschedule, activity timeline, notifications) |
| **Technician** | Phone first, adapts to desktop · installable | Grab driver app | Today (next job, stats, today's list) · New job assigned (Waze / Google Maps, before-photo reminder, accept & start, or decline with a reason) · Job in progress (call, pre-filled WhatsApp, navigation, checklist incl. before/after photos, sticky CTA) · Complete job (quick chips, ≤6 photos/video/PDF from camera, gallery or files, itemised extras, payment, auto final amount) · Job done (receipt + WhatsApp feedback message) · History |
| **Manager** | Desktop | Shopify Admin | Review queue (supervisor flags, quote vs final) · Review detail (evidence previews, approve / return with notes / close) · Performance (today / week / month, daily chart, branches, leaderboard, reschedules, overload insight) · Ops assistant (full page + side panel) |

### Assessment coverage

| Module | Status | Where |
| --- | --- | --- |
| 1 · Admin order submission | ✅ + both bonuses (summary page, WhatsApp to technician) | `/admin/orders/new` → `/admin/orders/[id]` |
| 2 · Technician service job | ✅ + payment bonus (amount, method, receipt photo), feedback message bonus, manager notified | `/technician/jobs/...` |
| 3 · WhatsApp trigger on Job Done | ✅ server-side trigger + wa.me deep link | `lib/server/orders.ts → completeOrder` |
| Bonus · KPI dashboard | ✅ jobs, amount, postpone/reschedule, leaderboard, chart, branch view | `/manager/dashboard` |
| AI · Operations query window | ✅ interpret → query → format | `/manager/assistant`, `POST /api/operations/query` |
| Advanced · AI workflow supervisor | ✅ rule flags (amount over quote, no photos, unexplained extras, underpayment) + AI review note comparing with similar jobs | `lib/supervisor.ts`, `POST /api/orders/[no]/ai-review`, review screen |
| Advanced · AI operational insight | ✅ overloaded technicians vs team average | dashboard insight + `overloaded_technicians` query |
| Advanced · AI document understanding | ✅ photo of a job sheet / quotation / WhatsApp screenshot, or pasted text → name, phone, address, service, problem, amount, date | Create order → *Fill from a document*, `POST /api/ai/extract` |
| Auth | ✅ mock role selector **and** real Supabase Auth (bonus) | `/login`, `/signup` |

## Roles and permissions

Enforced on the server in `lib/workflow.ts` (role + current status), not just hidden in the UI. A role that isn't allowed gets **403**; a wrong status gets **409**.

| Action | Admin | Technician | Manager |
| --- | --- | --- | --- |
| Create order · fill from document (AI) | ✅ | — | — |
| Assign / reassign · reschedule | ✅ (New or Assigned) | — | — |
| See orders | all | own jobs | all, read-only |
| Accept (start) or decline a job | — | ✅ own job only; decline needs a reason | — |
| Complete job (photos, extras, payment, receipt) | — | ✅ own job only, once | — |
| Approve / return with notes | — | — | ✅ |
| Close a reviewed order | ✅ | — | ✅ |
| Dashboard, Ops assistant, AI supervisor note | ✅ | — | ✅ |

Declining puts the order back to **New**, unassigned, logs the reason and notifies the admin. Every action is written to the activity log with actor, role, from → to status and note.

## Brand and design

- Logo traced to SVG (`public/brand/`), used for the favicon (`app/icon.svg`) and generated app icons (`app/icons/[file]`).
- Colours come from the logo: navy `#01202F`, steel blue `#2E7BAA` for actions, frost `#C3CAD1`; green is kept only for success. Tokens live in `tailwind.config.ts`.
- Desktop follows Shopify Admin patterns; the technician app follows the Grab driver app; the landing page uses a dark, thin-type style.

## Technician app on any device (PWA)

- **Phone:** full-screen screens, one main action pinned to the bottom, bottom tabs.
- **Tablet / desktop:** the same screens in a centred column with the technician's job list on the left. Nothing is forced to look like a phone.
- **Installable:** web app manifest, app icons and a service worker. Android/Chrome shows an *Install* button; iPhone shows an *Add to Home Screen* hint. It opens full screen on the technician's jobs.
- **Offline:** the app shell and an offline page are cached. Job data and API calls are never cached, so records are always live. Saving work offline is future work.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Storage) · Vercel (hosting + AI Gateway) · lucide-react icons · Inter.

No other runtime dependencies.

## Architecture decisions

- **One app, one data model, role-based UI.** All roles share the same orders, so status rules live in one place (`lib/workflow.ts`).
- **Reads on the client, writes on the server.** Screens read through `lib/data.ts`. Every change goes through an API route (`app/api/orders/...`) that resolves the caller, checks the role and the current status against the state machine, writes the change, writes an **activity log** row (actor, previous → new status, note) and creates **notifications**.
- **Server recalculates money.** Final amount = quoted price + extra charges, computed on the server; the quote is never overwritten. Extra charges are stored as line items.
- **Order numbers from a Postgres sequence** (`ORDER1241`, `ORDER1242`…), so two admins can't create the same number.
- **Evidence** is uploaded to a private Supabase Storage bucket; managers see it through short-lived signed URLs. Photos are shrunk on the phone (1600 px JPEG) before upload. Limits: 6 files, 25 MB per file, 60 MB per job. The bucket itself rejects files over 25 MB or that aren't photos, videos or PDFs, and the server checks the real stored sizes before accepting a job.
- **Phone numbers** are normalised to Malaysian E.164 (`012-345 6789` → `60123456789`) so WhatsApp links open the right chat.
- **Navigation** is a one-tap Waze / Google Maps link built from the address. No map library or API key; Google and Waze search Malaysian addresses better than free geocoders.
- Database changes are kept as SQL in `supabase/migrations` and demo data in `supabase/seed` (all demo rows are tagged `[demo]`).

More detail: [docs/decisions.md](docs/decisions.md).

## WhatsApp (Module 3)

When a technician submits a job, `completeOrder` (server) sets the status to **Job Done** and in the same request:

1. Builds the assessment's message: *Hi {Customer}, Job {Order} has been completed by Technician {Name} at {Time}. Please check and leave feedback. Thank you!*
2. Stores it in `notifications` with a `https://wa.me/60…?text=…` link (status `ready`).
3. Creates an internal notification for the manager / accounts (shown in the top-bar bell).

The technician's **Job done** screen, the order page and the bell all show a **Send on WhatsApp** button. Clicking it opens WhatsApp with the message filled in and marks the notification `sent` (logged in the activity timeline). Assigning a technician creates a matching "new job" message for the technician, including a Google Maps link. On the job screen, the technician's WhatsApp button opens a chat with the customer starting *"Hi {Customer}, I'm {Technician}, your technician from Sejuk Sejuk Service for job {Order}."*

Not included: automatic sending through the WhatsApp Business (Cloud) API. That needs a Meta business account, a registered number and approved templates. The `notifications` table already has the shape needed to switch to API delivery later without changing the workflow.

## How AI is integrated

`POST /api/operations/query` (managers and admins only):

```text
Question
  → 1. Interpret: the model must pick ONE intent from a fixed list and return JSON
        (falls back to a rule-based classifier if AI is unavailable)
  → 2. Retrieve: a typed Supabase query for that intent only
        (date range, technician, status filters pushed into the query, limited columns)
  → 3. Format: the model writes the answer using ONLY those rows
        (falls back to the deterministic answer)
  → UI shows the intent, its parameters, the rows used and whether AI or rules answered
```

The model never sees the database, credentials or unrelated rows, and cannot write data. AI runs through **Vercel AI Gateway** using the deployment's built-in OIDC token, so no API key is stored. The model list is configurable (`AI_MODEL`).

**Supported questions**

- What jobs did technician *Ali* complete *last week*? (any technician, today / yesterday / this week / last week / last 7 days / this month)
- Which technician completed the most jobs (or brought in the most revenue) this week?
- How many jobs were completed today? / How much did we collect this month?
- Which jobs are waiting for manager review?
- Which orders are unassigned?
- Which technician might be overloaded this week? (≥ 1.5× team average)
- Show flagged jobs this week (≥ 25 % over quote, or no photos)
- Which jobs had extra charges above RM 100?

**Limitations**

- Only the question types above. Anything else gets a fixed "I can only answer…" reply with suggestions.
- One question at a time: no follow-ups that depend on the previous answer ("and John?").
- Dates are interpreted in Malaysia time using fixed periods; custom date ranges aren't parsed.
- The model may phrase things differently between runs, but numbers and order numbers come from the query rows. If AI is down, rule-based answers are used (English and common Malay questions).
- AI Gateway free credit is limited; heavy use would need paid credit.

### Other AI features

- **Document understanding** (`POST /api/ai/extract`, Admin): a photo or pasted message is sent to the model with a fixed JSON schema. The result is validated (service type and branch must match the dropdown lists, phone normalised, price must be a number) and only fills the form. The admin checks it and saves; nothing is written by the AI.
- **Workflow supervisor** (`POST /api/orders/[no]/ai-review`, Manager): rule flags are always computed. The AI then reads this one job (amounts, extras, work done, evidence and payment) plus the median final amount of similar jobs in the last 60 days, and returns *approve* or *check* with a 2–3 sentence reason. A high-severity rule flag can never be overridden to *approve*.

## Challenges

- **The email rate limit.** Supabase's free mailer sends 2 emails per hour, so signups failed. The real login bug was underneath it: the code read a `name` column, but the table has `full_name`. Fixed with a database trigger that creates profiles, confirmation emails switched off, and one-click reviewer access.
- **Keeping AI honest.** Free-form text-to-SQL was too risky. The model only chooses from a fixed list of intents, queries are typed, and answers are checked. If the AI's wording drops a figure from the verified answer, or mentions an order number that isn't in the data, the verified answer is shown instead.
- **No AI key or budget.** Vercel AI Gateway authenticates deployed functions with OIDC, so no secret is stored, and the free credit covers `gpt-4o-mini`. Blocked models are skipped automatically.
- **WhatsApp without the Business API.** Built a notifications table and a server trigger, so delivery is a deep link today and can become an API call later without changing the workflow.
- **One codebase, two very different users.** Admins need density; technicians need speed with one hand. Solved with shared tokens and status colours but separate shells and layouts.

## Running locally

```bash
npm install
cp .env.example .env.local   # add your Supabase URL + anon key
npm run dev
```

Database: run the files in `supabase/migrations/` in order, then (optional) the two files in `supabase/seed/`, in the Supabase SQL editor.

Environment variables are listed in `.env.example`. Locally, the assistant uses rules unless `AI_GATEWAY_API_KEY` is set.

## Assumptions and limitations

- **Demo access.** Reviewers can pick a role without an account. In demo mode the role is sent as a header and trusted by the API. With a real account the API verifies the Supabase session and reads the role from `profiles`.
- **Row Level Security** is permissive for the prototype (anon can read/write the operations tables) so demo mode works. Production should remove the anon policies and require accounts.
- Technicians see only their own jobs in the UI, and the API blocks starting or completing someone else's job when the technician is known.
- Signup lets you choose a role, and technicians are added in the database. Production should have an admin-only Technicians page with invitations.
- Technicians can install the app, but submitting a job still needs a connection (no offline queue yet).
- No map view or GPS tracking; navigation opens Waze or Google Maps from the address text.
- Customer phone numbers must be Malaysian (+60).
- Supabase's free email sender allows 2 emails per hour, so email confirmation is turned off.

## Self-assessment

- **Easiest:** Module 1. The form is simple once the data model and state machine exist.
- **Hardest:** making the AI genuinely controlled: forcing the model into a fixed intent list, keeping retrieval narrow, and still giving useful, readable answers with a safe fallback. Second hardest: making the technician completion flow fast on a phone (chips, presets, sticky total) without losing data quality.
- **For production I would add:** remove anon RLS policies and enforce roles in Postgres; WhatsApp Cloud API with delivery webhooks; offline queue for technicians; customer feedback capture; scheduling/calendar view with conflict checks; automated tests for the state machine and AI intents; audit export for accounts.
- **How I used AI tools:** Codex built the first working version (Supabase wiring, workflow, first UI). Claude Code audited it, fixed the auth profile, phone format and single-review bugs, designed and rebuilt the UI (Shopify / Grab references), moved writes server-side with activity logs and notifications, built the AI query pipeline, and ran browser and API tests on every stage. I made the product calls, provided the brand, tested on a real iPhone and approved each merge. The full story is in [docs/development-history.md](docs/development-history.md).

## Docs

- [docs/development-history.md](docs/development-history.md) – how it was built, stage by stage, with the pull requests
- [docs/assessment-checklist.md](docs/assessment-checklist.md) – every requirement, status and where to see it
- [docs/test-report.md](docs/test-report.md) – final test on the live site
- [docs/manual-test-guide.md](docs/manual-test-guide.md) – step-by-step script to test it yourself (about 30 minutes)
- [docs/decisions.md](docs/decisions.md) – architecture decisions
- [docs/supabase-guide.md](docs/supabase-guide.md) – tables, why they're shaped this way, and security
- [docs/history/](docs/history/) – planning notes written during the build
- [AGENTS.md](AGENTS.md) – rules for anyone continuing the work
