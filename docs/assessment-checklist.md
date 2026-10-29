# Assessment Checklist

Every requirement in the assessment brief, checked against the live app (https://sejuksejuk.vercel.app), last on 28 Oct 2026.

✅ done · ➕ done beyond what was asked · ⚠️ partial (reason given)

## Tech stack

| Requirement | Status | Evidence |
| --- | --- | --- |
| React front-end | ✅ | Next.js 15 + React 19 (`app/`) |
| Tailwind CSS | ✅ | `tailwind.config.ts`, all screens |
| Supabase backend / database | ✅ | Tables: orders, technicians, service_completions, service_files, job_reviews, activity_logs, notifications, profiles |
| Supabase Storage | ✅ | Private bucket `service-evidence`, signed URLs for previews |
| Vercel deployment | ✅ | Production on `main` |
| Mock login / role switch | ✅ | `/login` role cards → Continue |
| Bonus: basic authentication | ➕ | Supabase email/password, profiles created by DB trigger, API verifies the session |

## AI integration rules

| Requirement | Status | Evidence |
| --- | --- | --- |
| AI API (OpenAI / Claude / Gemini / equivalent) | ✅ | Vercel AI Gateway → `openai/gpt-4o-mini` |
| Backend AI logic in serverless functions | ✅ | `app/api/operations/query`, `app/api/ai/extract`, `app/api/orders/[no]/ai-review` |
| Answers based on data retrieved through controlled queries | ✅ | `lib/server/ai/queries.ts`: one typed query per intent |
| No unrestricted database access | ✅ | Model only picks an intent from a fixed list and receives the rows for that intent |

## Workflow and system rules

| Requirement | Status | Evidence |
| --- | --- | --- |
| New → Assigned → In Progress → Job Done → Reviewed → Closed | ✅ | `lib/workflow.ts` state machine; stepper on order and review pages |
| Only Admin can assign technicians | ✅ | API returns 403 "Only admin can assign a job." for other roles |
| Only the assigned technician can complete | ✅ | API returns "Only the assigned technician can complete this job." |
| Managers review completed jobs | ✅ | `/manager/reviews` → approve / return with notes / close; admins see the review read-only |
| Technician can hand a job back | ➕ | Decline with a reason → order returns to New, admin notified, logged |
| Key actions traceable | ✅ | `activity_logs` row for every action (actor, role, from → to, note); Activity timeline on order pages |
| System sends notification on completion | ✅ | `notifications` rows + bell in the top bar |
| Dashboard updates performance metrics | ✅ | KPIs computed live from records |

## Module 1 — Admin order submission (`/admin/orders/new`)

| Field / item | Status | Notes |
| --- | --- | --- |
| Order No (auto-generated) | ✅ | Postgres sequence → `ORDER1268`… |
| Customer Name | ✅ | |
| Phone | ✅ | Validated Malaysian number, stored as `60…` |
| Address | ✅ | |
| Problem Description | ✅ | |
| Service Type (dropdown) | ✅ | 5 service types |
| Quoted Price | ✅ | Never overwritten later |
| Assigned Technician | ✅ | Picker cards with branch, open jobs and today's load |
| Admin Notes | ✅ | Shown to the technician |
| Responsive form, clean UI | ✅ | Two-column on desktop, stacks on phone |
| Back-end: auto ID + write to DB | ✅ | `POST /api/orders` |
| Bonus: order summary after submission | ✅ | Redirects to the order page with a "created" banner and summary |
| Bonus: WhatsApp notification to technician | ✅ | "New job" message with wa.me link |
| Extra | ➕ | Branch, preferred slot, reschedule, reassign, **AI fill from document** |

## Module 2 — Technician service job (`/technician/jobs`)

| Field / item | Status | Notes |
| --- | --- | --- |
| Mobile-first, fast field workflow | ✅ | Full-screen on phones, 48px+ buttons, sticky action; adapts to desktop; installable as a PWA (tested on a real iPhone) |
| Order ID (read-only) | ✅ | Header of every job screen |
| Work Done | ✅ | Quick chips + free text |
| Extra Charges | ✅ | Preset chips + custom lines, stored itemised |
| Upload ≤ 6 photos / video / PDF | ✅ | Camera, gallery or files; photos shrunk before upload; 6 files, 25 MB per file, 60 MB per job, enforced on the phone, the server and the storage bucket |
| Final Amount (auto-calculated) | ✅ | Live on screen; recalculated on the server |
| Remarks | ✅ | |
| Technician Name | ✅ | From the signed-in technician; shown in the header |
| Timestamp | ✅ | `completed_at`, shown in the header and record |
| Bonus: payment amount | ✅ | Defaults to the final amount, editable |
| Bonus: payment method | ✅ | Cash, QR, bank transfer, card, not paid |
| Bonus: receipt photo | ✅ | Stored separately (`kind = receipt`), viewable by manager |
| Bonus: WhatsApp feedback message to customer | ✅ | Job done screen |
| Bonus: notify manager / accounts | ✅ | Internal notification + review queue |
| Back-end: file upload + completion write | ✅ | Storage upload → `POST /api/orders/[no]/complete` |
| Extra | ➕ | Accept-job screen, Waze / Google Maps buttons, before/after photo reminder, pre-filled WhatsApp to customer, checklist, history, returned-job banner, decline with reason, duplicate submit blocked |

## Module 3 — WhatsApp trigger

| Item | Status | Notes |
| --- | --- | --- |
| Trigger when status = Job Done | ✅ | Same server request that sets Job Done |
| Deep-link URL with pre-filled message | ✅ | `https://wa.me/60…?text=…` |
| Message template | ✅ | Word for word: customer name, order, technician, time, feedback request |
| Back-end trigger logic | ✅ | `completeOrder()` in `lib/server/orders.ts` writes the notification |
| ⚠️ Automatic sending | ⚠️ | Sending needs one tap (no WhatsApp Business API account); click is logged as sent |

## Bonus — KPI dashboard (`/manager/dashboard`)

| Item | Status |
| --- | --- |
| Technician | ✅ leaderboard |
| Jobs completed | ✅ |
| Total amount | ✅ |
| Postpone / reschedule | ✅ reschedule action + count |
| Card layout, leaderboard, simple charts | ✅ |
| Weekly data | ✅ |
| Additional views | ➕ today / month, branch breakdown, avg job value, open jobs, overload insight, change vs previous period |

## AI module — Operations query window (`/manager/assistant` and "Ask Ops")

| Item | Status | Notes |
| --- | --- | --- |
| "What jobs did technician Ali complete last week?" | ✅ | List of orders + total |
| "Which technician completed the most jobs this week?" | ✅ | |
| "How many jobs were completed today?" | ✅ | |
| Flow: question → interpret → retrieve → format | ✅ | UI shows intent, parameters, rows used, AI vs rules |
| Output format like the example | ✅ | "Technician Ali completed 4 jobs last week…" + `ORDER – service` lines |
| Limitations handled | ✅ | Fixed refusal for off-topic questions, rules fallback, figure check |
| Extra | ➕ | Malay questions, revenue, unassigned, flagged, extra charges above RM X |

## Optional advanced AI challenges

| Challenge | Status | Where |
| --- | --- | --- |
| AI Workflow Supervisor | ✅ | Review page: rule flags + AI approve/check note using similar-job median |
| AI Document Understanding | ✅ | Create order → Fill from a document (photo or pasted text) |
| AI Operational Insight | ✅ | Dashboard insight + "Which technician might be overloaded this week?" |

## README and submission

| Item | Status |
| --- | --- |
| Live demo | ✅ https://sejuksejuk.vercel.app |
| GitHub repo | ✅ Public. Build history: `docs/development-history.md` |
| README: what was built | ✅ |
| Tech stack | ✅ |
| Architecture decisions | ✅ README + `docs/decisions.md` |
| Challenges / assumptions | ✅ |
| How AI was integrated | ✅ |
| Supported AI query types | ✅ |
| AI limitations | ✅ |
| Implementation limitations | ✅ |
| Self-assessment (easiest, hardest, production, AI tools) | ✅ |
| Design: clean, simple, practical, no logo needed | ➕ | Company logo traced to SVG, favicon and app icons, brand colours from the logo |
