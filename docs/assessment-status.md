# Assessment Status and Handoff

Last verified: 27 October 2026
Working branch: `lockin-final` (merged to `main` for production)
Production: https://sejuksejuk.vercel.app

## Lock-in update (27 Oct 2026)

- New UI across all roles (Shopify-style admin and manager, Grab-style technician app).
- All writes moved to server routes with one state machine and activity logs.
- WhatsApp: server trigger on Job Done creates the customer message (exact assessment template) and a manager alert; Module 1 bonus message to technician on assignment.
- AI: interpret → filtered query → format via Vercel AI Gateway, with rule fallback. Added overload insight and supervisor flags (two optional AI challenges).
- Fixed: profile column mismatch (`full_name`) that broke login, phone numbers stored without country code, second review on the same order failing, order numbers generated in the browser.
- Reschedule action and Postpone/Reschedule KPI added.
- Verified end to end on 27 Oct with ORDER1267: create (admin) → accept, start, complete with photo and extra charge (technician) → WhatsApp link → approve and close (manager).

Everything below is the earlier checkpoint, kept for history.

---


Last verified: 27 October 2026
Working branch: `phase-3-technician-workflow`
Latest verified workflow record: `ORDER1240`
Latest preview: https://sejuksejukops-o9uo9svcl-klynns-projects.vercel.app

This document is the handoff checkpoint for the Sejuk Sejuk Operations assessment. Read it before changing the application.

## What is implemented

### Product structure

- One Next.js/React application
- One Supabase database and storage project
- Admin desktop workspace
- Technician mobile-first workspace
- Manager review and KPI workspace
- Demo role selector retained for assessment reviewers
- Supabase email/password Auth and role profiles added as a bonus

### Admin

- Orders list connected to Supabase
- Search and status filter
- Create-order form
- Automatic order number
- Customer name, phone, address and problem description
- Service type and branch selection
- Quoted price
- Technician assignment
- Admin notes
- Order detail page
- Manual WhatsApp deep link with pre-filled message

### Technician

- Assigned job list
- Today route and completion history
- Assigned -> In Progress transition
- Work-done form
- Extra charges
- Automatic final amount display
- Evidence upload with a six-file limit
- Remarks
- Optional payment amount and method
- Completion timestamp
- Job Done success page
- Supabase Storage evidence persistence

### Manager

- Jobs needing review
- Final amount versus quoted amount
- Technician and completion details
- Approve action
- Return-for-correction action
- Close-order action
- Completion history
- Weekly KPI dashboard
- Technician leaderboard
- Operations assistant launcher

### AI Operations Query Window

The manager Sidekick calls:

`POST /api/operations/query`

The route first classifies the question into a small supported set. It then retrieves structured operational records and calculates the deterministic answer.

Current supported query types:

- Completed jobs today
- Technician completed jobs this week
- Technician completed jobs last week
- Technician with the most jobs this week
- Jobs waiting for manager review

The optional formatter uses the OpenAI Chat Completions API:

`https://api.openai.com/v1/chat/completions`

Configuration:

`OPENAI_API_KEY` and `OPENAI_MODEL`

The default model is `gpt-4o-mini`.

OpenAI is not required for the deterministic fallback. If no key is configured, the assistant still answers supported questions using backend logic. If OpenAI is configured, it receives only the question, deterministic answer and relevant structured records. Its system instruction prohibits inventing facts, names or numbers. It does not receive unrestricted database access.

Unsupported questions return a safe fixed response. The assistant is not a general-purpose chatbot.

## Assessment mapping

| Requirement | Status | Notes |
| --- | --- | --- |
| React frontend | Complete | Next.js with React and TypeScript |
| Tailwind CSS | Complete | Used across all workspaces |
| Supabase database | Complete | Orders, technicians, completions, reviews and logs |
| Supabase Storage | Complete | Private service evidence bucket |
| Vercel deployment | Complete | Preview deployment is working |
| Mock login | Complete | Admin, Technician and Manager selector |
| Real authentication bonus | Implemented | Signup, login, profiles and sign out |
| Admin order submission | Complete | Writes orders to Supabase |
| Technician service job | Complete | Mobile-first completion workflow |
| File upload | Complete | Maximum six files per completion |
| WhatsApp notification | Partial by design | Manual `wa.me` deep link; Business API deferred |
| Manager review | Complete | Approve, return and close |
| KPI dashboard | Complete | Live Supabase aggregation |
| AI query window | Complete | Controlled query endpoint and Sidekick panel |
| AI workflow supervisor | Not implemented | Optional |
| AI document understanding | Not implemented | Optional |
| AI overload insight | Not implemented | Optional |
| README and technical explanation | Complete | This handoff supplements the README |

## Verified end-to-end flow

The following flow was tested against the deployed preview:

1. Admin created `ORDER1240`.
2. Order was assigned to Ali.
3. Technician opened the assigned job.
4. Technician started the job.
5. Status changed from Assigned to In Progress.
6. Technician entered work done and remarks.
7. Extra charges of RM25 were added to a RM275 quote.
8. Final amount displayed as RM300.
9. Technician submitted the job.
10. Success page appeared.
11. Manager saw the job in Needs Review.
12. Manager approved the job.
13. Manager closed the order.
14. The job appeared in Technician completion history.
15. KPI dashboard updated.
16. AI answered a supported operational query.
17. AI safely rejected an unrelated weather query.

`ORDER1240` is intentionally retained as a completed test record. Do not delete or reset demo data without explicit approval.

## Known limitations

### Authentication and authorization

- Demo access remains available for assessment review.
- Routes are not globally protected by middleware yet.
- Backend operations do not consistently verify the authenticated user's role.
- Technician ownership is represented by the demo technician context and should receive stronger server-side enforcement.
- Signup role selection is prototype-friendly. Production should use invitations or admin-controlled role assignment.

### AI security and retrieval

- The query route uses controlled intent handling, but current data-access helpers retrieve collections and filter them in server-side code.
- A production version should push filters, date ranges and aggregations into Supabase queries or database functions.
- The API route should verify that the caller is an authenticated Manager.
- OpenAI wording is constrained by prompt and structured input but is not a mathematical authority. Deterministic values remain the source of truth.

### Financial and workflow validation

- Final amount is displayed as quoted price plus extra charges. The server should independently recalculate it before writing.
- Status transition validation exists for starting and closing, but every transition should be validated in one shared server-side state-machine layer.
- Activity-log schema exists, but every important action should consistently write an actor, timestamp, previous status and new status.
- File count is limited in the client/data layer; explicit file type, size and seventh-file feedback should be improved.
- Postpone/reschedule KPI is not implemented.

### Integrations

- WhatsApp Business API is intentionally not connected because credentials and a registered business number are unavailable.
- Telegram/Make.com notification automation is deferred.
- Customer WhatsApp messages are currently manually sent through a pre-filled deep link.

## Handoff rules

- Preserve the workflow and database behavior while improving UI.
- Do not replace Supabase-backed data with hardcoded arrays.
- Do not remove the demo selector until a reviewer-friendly alternative exists.
- Do not add a generic unrestricted chatbot.
- Do not expose `OPENAI_API_KEY`, Supabase service-role keys or WhatsApp secrets in client code.
- Use focused commits with meaningful messages.
- Run a production build and test the affected role flow after changes.
- Prefer UI changes in isolated components so workflow logic remains easy to review.
