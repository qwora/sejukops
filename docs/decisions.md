# Architecture Decisions

## ADR-001: One application with role-based interfaces

Decision: Use one web application and one Supabase database for Admin, Technician and Manager workflows.

Reason:

- The roles share the same operational records.
- Shared status transitions are easier to maintain.
- It avoids duplicated applications and inconsistent business logic.
- The UI can still be optimised separately for desktop and mobile.

## ADR-002: Next.js as the React implementation

Decision: Use Next.js with TypeScript rather than a plain React setup.

Reason:

- Next.js is a React framework.
- It provides serverless route handlers for secure operations.
- It fits Vercel deployment.
- It allows future middleware and authentication without restructuring the project.

## ADR-003: Shopify-inspired admin experience

Decision: Treat Orders as the primary admin object.

Reason:

- The assessment is an operations workflow centred on service orders.
- Shopify's order model is familiar and easy to understand.
- Assignment, status, customer data and service completion can live naturally inside an order detail page.

## ADR-004: Mobile-first technician workflow

Decision: Use a separate mobile-first interface within the same application.

Reason:

- Technicians work in the field using mobile devices.
- A dense desktop table would slow down completion.
- The primary technician action should always be obvious.

## ADR-005: WhatsApp deep link before API integration

Decision: Implement a pre-filled WhatsApp link first.

Reason:

- A WhatsApp Business API account and business phone number are not available yet.
- The assessment explicitly accepts a deep-link URL.
- The workflow can later switch to server-side API delivery without changing the job-completion model.
- No customer-facing API credentials should be fabricated or exposed.

## ADR-006: Controlled AI queries

Decision: AI receives structured results from known query handlers, not unrestricted database access.

Reason:

- It is safer and easier to explain.
- Results remain deterministic and auditable.
- It demonstrates the assessment's expected flow: interpret, query, format.

## ADR-007: UI-first demo persistence

Decision: Use browser localStorage for the first Admin Orders UI iteration, behind a small demo data module.

Reason:

- The workflow can be reviewed immediately in a branch preview without waiting for Supabase credentials.
- The UI can be tested with create, search, filter and detail interactions.
- The data module can later be replaced with Supabase repository functions without rewriting the page components.
- This is temporary assessment scaffolding, not the intended production persistence layer.


## Technical workflow and AI query boundary

The workflow now exposes explicit transition functions for `Assigned → In Progress`, `Job Done → Reviewed`, `Reviewed → Closed`, and review return. The UI calls these functions instead of changing status locally.

The operations assistant uses `POST /api/operations/query`. The route classifies a small supported query set, retrieves only the matching Supabase records, and returns a deterministic answer. If `OPENAI_API_KEY` is configured server-side, the same structured result may be passed to the model for wording only. The model never receives unrestricted database access, and the deterministic response remains the fallback when no AI key is configured.


## ADR-008: Real Supabase Auth with demo fallback

Decision: Add Supabase email/password authentication and role profiles without removing demo mode.

Reason:

- Real Auth demonstrates production-oriented account handling.
- Profiles provide a stable place for role and future branch or technician mapping.
- Demo mode keeps the assessment preview easy to access before reviewer accounts exist.
- The Auth client uses only the public Supabase anon key; no service-role key is exposed in the browser.

## ADR-009: Writes go through server routes with one state machine

Decision: All status changes and order writes go through `app/api/orders/*`, which call `lib/server/orders.ts`. Allowed transitions live in `lib/workflow.ts` (`WORKFLOW`).

Reason:

- Workflow rules are enforced in one place, not scattered across screens.
- Every action writes an `activity_logs` row (actor, role, previous and new status, note), which makes key actions traceable.
- The server recalculates the final amount, so the client cannot change prices.
- Signed-in callers are verified with Supabase Auth; demo callers send a role header (documented limitation).

## ADR-010: Notifications table for WhatsApp and internal alerts

Decision: Job events create rows in `notifications` (channel `whatsapp` or `internal`, audience, message, link, status). WhatsApp delivery is a wa.me deep link that the user clicks; clicking marks the row `sent` and logs it.

Reason:

- Meets Module 3 (back-end trigger + deep link) without Business API credentials.
- Swapping in the WhatsApp Cloud API later only changes how a `ready` row is delivered.

## ADR-011: AI via Vercel AI Gateway with a fixed intent list

Decision: The assistant asks the model to choose one intent from a fixed list (JSON), runs a typed Supabase query for that intent, then asks the model to word the answer from those rows only. Rules are the fallback for both steps.

Reason:

- The model never touches the database and cannot invent query shapes.
- AI Gateway on Vercel authenticates with the deployment OIDC token, so no AI key is stored.
- The deterministic fallback keeps the feature working locally and when AI is unavailable.

## ADR-012: Design system

Decision: Shopify Admin patterns for desktop (black top bar, grey sidebar, white cards, dense tables, status pills) and Grab driver patterns for the technician phone app (green header, one primary action pinned to the bottom, 48px+ targets). One shared token set in `tailwind.config.ts`; one colour per workflow status used everywhere.

Reason:

- Admins scan many orders; technicians need speed with one hand outdoors.
- Shared tokens keep the two experiences recognisably one product.

## ADR-013: Schema and demo data in the repo

Decision: `supabase/migrations/` holds schema changes; `supabase/seed/` holds demo history tagged `[demo]`.

Reason:

- The schema was previously only in the Supabase dashboard.
- Reviewers see a realistic two-week history in the KPI dashboard and AI answers; demo rows are easy to remove.
