# Sejuk Sejuk Operations

A role-based operations system for an air-conditioner service company, built for the Programmer Assessment — Operations System + AI Challenge.

## Product

The system digitises:

~~~text
Order → Assignment → Service Completion → Notification → Manager Review → Reporting
~~~

It is designed as one web application with separate experiences for:

- Admins working mainly on desktop
- Technicians working mainly on mobile
- Managers reviewing jobs and operational data

## UI direction

The admin portal is inspired by Shopify Admin:

- Orders are the primary object
- Admins create, assign and track service orders
- Order details show assignment, status and activity
- A Sidekick-style assistant opens in a right-side panel

The technician portal is inspired by Grab's rider workflow:

- Mobile-first job cards
- Large touch targets
- Minimal typing
- Clear next action
- Fast completion and evidence upload

## Planned stack

- Next.js and React
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Storage
- Vercel
- Serverless route handlers
- AI provider through controlled backend queries

The assessment permits a mock role selector. Real Supabase Auth is now available for email/password accounts, with the demo selector retained for assessment previews.

## Current implementation

- Admin order creation and assignment
- Technician mobile service workflow
- Supabase Storage evidence upload
- Manager review, approval, return and close flow
- Weekly KPI dashboard and technician leaderboard
- Controlled Operations Query API and Manager Sidekick
- Supabase email/password Auth with role profiles
- Manual WhatsApp deep links

See [docs/assessment-status.md](docs/assessment-status.md) for the assessment comparison, verified flow and known limitations.

See [docs/ui-roadmap.md](docs/ui-roadmap.md) for the next UI-focused phase.

## Important limitations

- WhatsApp currently uses a pre-filled wa.me link for manual sending.
- WhatsApp Business API credentials and business phone registration are not included yet.
- AI queries use controlled intent handlers and structured Supabase results.
- OpenAI formatting is optional and requires a server-side `OPENAI_API_KEY`.
- Some role restrictions are still simulated for the assessment preview.
- The AI is not a general-purpose chatbot.

## Handoff

A new developer or AI agent should read these files in order:

1. AGENTS.md
2. plan.md
3. docs/decisions.md
4. docs/assessment-status.md
5. docs/ui-roadmap.md
6. The relevant source files for the current phase

The technical workflow has been verified on the deployed preview. Future work should focus primarily on UI quality while preserving the working data flow and state transitions.
