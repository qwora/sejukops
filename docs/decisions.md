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
