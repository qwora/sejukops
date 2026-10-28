# AGENTS.md

## Project

This repository contains the Sejuk Sejuk Operations System assessment project.

Before making changes:

1. Read docs/history/plan.md (original plan) and docs/development-history.md.
2. Read the relevant phase before implementing it.
3. Inspect existing code before replacing anything.
4. Preserve working behaviour.
5. Explain meaningful architecture changes in docs/decisions.md.

## Product direction

- Admin experience: Shopify-inspired desktop order management.
- Technician experience: Grab-inspired mobile-first field workflow.
- Manager experience: review queue, metrics and controlled AI assistant.
- Use one application and one Supabase data model with role-based interfaces.

## Engineering rules

- Use TypeScript and readable React components.
- Keep database access behind a clear data-access layer.
- Keep secrets server-side only.
- Validate important inputs on the client and server.
- Do not give the AI unrestricted database access.
- Do not hardcode KPI values.
- Do not silently change workflow rules inside UI components.
- Avoid unnecessary dependencies.
- Always handle loading, empty and error states.
- Keep mock data separate from real Supabase access.

## Scope rules

- WhatsApp currently means a pre-filled wa.me link that a user sends manually.
- Do not implement the WhatsApp Business API until credentials and a business number are available.
- Internal Telegram notifications may use Make.com later.
- Do not build optional AI features before the core workflow is reliable.

## Verification

Before declaring a phase complete:

- Run the project locally.
- Check desktop and mobile layouts.
- Check the main user flow from the affected role's perspective.
- Check browser console and build errors.
- Update README or decision notes when behaviour changes.

## Collaboration

Use focused branches and meaningful commits when practical.

Good commit messages:

- Create admin orders page
- Add technician completion workflow
- Implement controlled operations query
- Fix mobile job submission layout

Avoid vague names such as final, latest, version2, blabla.final or similar.
