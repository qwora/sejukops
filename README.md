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

Current implementation:

- Phase 0: project documentation and architecture foundation
- Phase 2: Supabase-backed admin order creation, assignment and order details
- Phase 3: mobile technician jobs, evidence upload, completion success and history
- Phase 4: manager review queue and manual WhatsApp deep links
- Phase 5: data-backed weekly KPI dashboard and technician leaderboard
- Phase 6: controlled operations query endpoint and manager Sidekick panel
- Real Supabase Auth sign-in, signup and role profiles

See plan.md for the complete implementation plan.

## Local development

The exact commands will be added when the application scaffold is created.

Environment variables must be copied from .env.example into a local .env.local file. Never commit secret values.

## Important limitations

- WhatsApp currently uses a pre-filled wa.me link for manual sending.
- WhatsApp Business API credentials and business phone registration are not included yet.
- AI queries must use controlled query types and structured Supabase results.
- Some role restrictions may initially be simulated in the interface for the assessment.

## Handoff

A new developer or AI agent should read these files in order:

1. AGENTS.md
2. plan.md
3. docs/decisions.md
4. The relevant source files for the current phase
