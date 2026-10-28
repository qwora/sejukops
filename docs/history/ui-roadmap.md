# UI Improvement Roadmap

The technical workflow is now functional. The next phase should focus mainly on making the product feel intentional, practical and less AI-generated while preserving behavior.

## Product references

- Admin: Shopify Admin order-management patterns
- Technician: Grab rider/field-service patterns
- Manager: calm desktop review workspace with clear operational hierarchy

The application should remain one product with three role-specific experiences.

## Priority 1 — Shared visual system

Create or refine shared tokens for:

- Ink/navy primary color
- Sea/blue action color
- Mint success state
- Amber attention state
- Rose error state
- Neutral page backgrounds
- Border, radius and shadow rules
- Heading and body typography
- Consistent status-pill styles
- Consistent button hierarchy

Avoid adding decorative effects that slow down field workflows.

## Priority 2 — Admin workspace

Improve:

- Shopify-like page header with title, count and primary Create order action
- Search, status filter and branch filter hierarchy
- Table density and row hover states
- Clear status badges
- Assignment visibility
- Empty, loading and error states
- Order detail information hierarchy
- Activity timeline with actor and timestamp
- Desktop spacing at 1280px and 1440px widths
- Responsive fallback for smaller tablets

The main admin question should be immediately visible:

> Which orders require attention right now?

## Priority 3 — Technician workspace

Keep mobile as the primary design target.

Improve:

- Stronger Today section
- Larger job cards
- Clear appointment time and status
- Prominent address and customer contact
- One dominant action per screen
- Sticky or easy-to-reach primary action
- Shorter completion form
- Better upload preview and removal states
- Clear progress indicator for evidence
- More useful success summary
- Completion history grouping by date

Do not make technicians edit admin-owned fields.

## Priority 4 — Manager workspace

Improve:

- Review queue summary at the top
- Strong visual comparison between quoted and final amount
- Evidence preview
- Review notes
- Approve, Return and Close action hierarchy
- KPI cards with clear date range
- Leaderboard rows with amount and completion count
- Better empty states
- Assistant panel with query suggestions and response history

## Priority 5 — Sidekick AI panel

Keep the AI boundary visible in the interface:

- Label it as an Operations assistant
- Explain that answers use controlled service records
- Show supported question examples
- Show loading state
- Show safe unsupported response
- Preserve readable multiline answers
- Do not present unsupported general knowledge as an answer

## UI acceptance checks

Before committing UI work:

- Test Admin at desktop width
- Test Technician at 390px mobile width
- Test Manager at desktop and tablet widths
- Check keyboard focus states
- Check loading, empty and error states
- Confirm every button still reaches the existing workflow action
- Confirm no API route or Supabase data behavior is changed unintentionally
- Run the production build
- Test one complete workflow after visual changes

## Suggested implementation order

1. Shared tokens and status components
2. Admin orders list and order detail
3. Technician job list and job detail
4. Manager review queue
5. Manager KPI dashboard
6. Sidekick panel
7. Landing page and login/signup polish
8. Responsive regression pass
