# Sejuk Sejuk Operations System — Implementation Plan

## 1. Project Purpose

Sejuk Sejuk Operations is a simplified internal operations system for Sejuk Sejuk Service Sdn Bhd, an air-conditioner installation, servicing and repair company.

The system digitises this workflow:

~~~text
Order → Assignment → Service Completion → Notification → Manager Review → Reporting
~~~

The project is being built for the Programmer Assessment — Operations System + AI Challenge.

The goal is to demonstrate:

- Practical business workflow design
- Clear role-based user experiences
- Reliable data modelling
- A mobile-first technician workflow
- Controlled AI integration
- Explainable technical decisions
- A codebase that another developer can understand and continue

## 2. Product Direction

The desktop operations experience will be inspired by Shopify Admin:

- Orders are the main object
- Admins can create and manage orders
- Order detail pages contain assignment and workflow information
- Statuses are visible and easy to scan
- The interface uses structured tables, filters, cards and detail panels
- A Sidekick-style AI assistant can open from the bottom-right and appear as a right-side chat panel

The technician portal will have a different experience:

- Mobile-first
- Fast to use outdoors
- Large touch-friendly controls
- Minimal typing
- Clear next action
- Job cards inspired by Grab rider and delivery applications

This is one system with different role-based interfaces, not separate disconnected applications.

## 3. Application Structure

Future deployment structure:

~~~text
sejuksejuk.com
└── Public landing page

app.sejuksejuk.com
├── Admin portal
├── Technician portal
└── Manager portal
~~~

During development and assessment deployment, the application may run from:

~~~text
sejuksejuk.vercel.app
~~~

Recommended route structure:

~~~text
/
├── /login
├── /signup
├── /admin/orders
├── /admin/orders/new
├── /admin/orders/:id
├── /technician/jobs
├── /technician/jobs/:id
├── /manager/reviews
├── /manager/dashboard
└── /manager/assistant
~~~

## 4. Technology Decisions

### Required or preferred assessment technologies

- React
- Tailwind CSS
- Supabase Database
- Supabase Storage
- Vercel deployment
- Node.js or serverless functions for backend logic
- OpenAI, Claude, Gemini or equivalent for AI

### Chosen implementation approach

- Next.js with TypeScript
- React components
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Storage
- Vercel deployment
- Serverless route handlers for controlled backend operations
- Mock role login initially
- Supabase Auth only if time allows
- AI provider connected through a server-side endpoint

Next.js is used because it is a React framework and provides a practical structure for serverless operations, secure environment variables, route handlers and Vercel deployment. This is a deliberate implementation choice, not a departure from the requested React stack.

## 5. Roles

### Admin

Primary environment: desktop.

Responsibilities:

- Create service orders
- View all orders
- Assign technicians
- Update operational details
- Track order statuses
- Open customer communication links
- Review operational summaries

### Technician

Primary environment: mobile browser.

Responsibilities:

- View assigned jobs
- Start a job
- Record work completed
- Add extra charges
- Upload evidence
- Add remarks
- Record optional payment information
- Mark the assigned job as Job Done

### Manager

Primary environment: desktop or tablet.

Responsibilities:

- Review completed jobs
- Inspect evidence and final charges
- Approve or return jobs
- View performance metrics
- Ask operational questions through the AI assistant

## 6. Status Workflow

Orders use this simplified state machine:

~~~text
New → Assigned → In Progress → Job Done → Reviewed → Closed
~~~

Rules to design for:

- New orders do not have to be assigned immediately
- Only Admin can assign or reassign a technician
- Only the assigned Technician can start or complete the job
- A job must be Job Done before Manager review
- Managers can approve a completed job or return it for correction
- A Reviewed job can be Closed
- Every important status change should have a timestamp and actor
- The original quoted price must not be overwritten by technician extra charges
- Final Amount = Quoted Price + Extra Charges
- Uploads should be limited to a maximum of six files per completion
- The system should prevent duplicate completion submissions

For the assessment, some rules may be simulated in the interface rather than fully enforced with production-grade row-level security. Any such limitation must be documented.

## 7. Core Data Model

### profiles

- id
- name
- email
- role
- branch
- phone
- created_at

### technicians

- id
- name
- phone
- branch
- active
- created_at

### orders

- id
- order_no
- customer_name
- customer_phone
- address
- problem_description
- service_type
- quoted_price
- assigned_technician_id
- branch
- status
- admin_notes
- created_by
- created_at
- updated_at

### service_completions

- id
- order_id
- technician_id
- work_done
- extra_charges
- final_amount
- remarks
- payment_amount
- payment_method
- completed_at
- created_at

### service_files

- id
- order_id
- completion_id
- file_url
- file_name
- file_type
- uploaded_by
- created_at

### job_reviews

- id
- order_id
- manager_id
- review_status
- review_notes
- reviewed_at

### activity_logs

- id
- order_id
- actor_id
- action
- previous_status
- new_status
- metadata
- created_at

The activity log is important because the assessment asks for key actions to be traceable.

## 8. Phase Plan

### Phase 0 — Documentation and project foundation

Deliverables:

- Project plan
- README
- Agent instructions
- Initial application structure
- Environment variable documentation
- Shared UI conventions
- Database plan

Completion criteria:

- A new developer can understand the project purpose and planned architecture
- The assessment requirements are mapped to planned features
- No secrets are committed
- The project can be run locally with documented commands

### Phase 1 — Public landing page and application shell

Deliverables:

- Public landing page
- Simple explanation of the operations platform
- Login and signup entry points
- Application shell
- Sidebar navigation for desktop
- Mobile navigation for technician view
- Mock role selector

Initial login behaviour:

~~~text
Admin → /admin/orders
Technician → /technician/jobs
Manager → /manager/reviews
~~~

Real authentication is optional for the assessment. The architecture should allow Supabase Auth to replace the mock selector later.

### Phase 2 — Admin Orders portal

Deliverables:

- Shopify-inspired orders list
- Search and status filters
- Create order form
- Automatic order number
- Customer and service details
- Technician assignment
- Order detail page
- Status timeline
- Order summary after creation

Important UI principle:

The admin should understand what requires attention immediately. The order list should make status, technician, customer and quoted amount easy to scan.

### Phase 3 — Technician mobile workflow

Deliverables:

- Assigned jobs list
- Today and upcoming job sections
- Job detail screen
- Start Job action
- Completion form
- Extra charge input
- Automatic final amount calculation
- File upload with six-file limit
- Remarks and timestamp
- Mark Job Done action

Technician UX principles:

- One dominant action per screen
- Avoid unnecessary navigation
- Keep important customer information visible
- Use readable text outdoors
- Provide clear validation before submission
- Do not make technicians edit admin-owned information

### Phase 4 — Manager review and internal notifications

Deliverables:

- Manager review queue
- Completed job detail
- Evidence preview
- Final amount comparison
- Approve and return actions
- Review notes
- Basic activity history

Notification approach for the assessment:

- Internal notification may use Make.com and Telegram
- Customer communication uses a WhatsApp deep link
- No WhatsApp Business API is required at this stage

When a job becomes Job Done, the system generates:

~~~text
https://wa.me/{customerPhone}?text={encodedMessage}
~~~

The Admin or authorised user manually clicks the link and sends the pre-filled message.

The message should contain:

- Customer name
- Order number
- Technician name
- Completion time
- Feedback request

The production WhatsApp Cloud API can be added later through server-side environment variables without changing the job workflow.

### Phase 5 — KPI dashboard (implemented)

The first KPI slice is now live in `app/manager/dashboard/page.tsx`. It loads orders and service completions through the Supabase data-access layer and derives the current week's completed jobs, final amounts, jobs awaiting review, active orders and technician leaderboard. The view displays a clear live-data label and keeps the empty state safe when no completions exist.

Deliverables:

- Weekly jobs completed
- Total completed amount
- Jobs by technician
- Jobs awaiting review
- Postponed or rescheduled jobs
- Basic leaderboard
- Simple visualisation where useful

Metrics must be derived from database records, not hardcoded values.

### Phase 6 — AI operations assistant

Deliverables:

- Sidekick-style launcher
- Right-side chat panel
- Manager-focused operations queries
- Clear unsupported-question handling
- Loading and error states
- Query/result trace in development mode if useful

Supported initial questions:

- What jobs did technician Ali complete last week?
- Which technician completed the most jobs this week?
- How many jobs were completed today?
- Which jobs are waiting for manager review?
- Which jobs had extra charges above a selected amount?

AI architecture:

~~~text
User question
  ↓
Server identifies supported query intent
  ↓
Controlled Supabase query runs
  ↓
Only relevant structured records are returned
  ↓
AI formats the response
~~~

The AI must not receive unrestricted database access.

Optional advanced AI features should only be added after the core workflow is reliable:

- Flag final amount significantly above quote
- Flag Job Done records without photos
- Identify possible technician overload
- Help clean up technician completion notes

## 9. WhatsApp Integration Boundary

Current implementation:

- Generate a WhatsApp deep link
- Pre-fill the customer message
- Let the admin manually click Send

Not included yet:

- WhatsApp Business API
- Meta Business verification
- Permanent access token
- Production phone number registration
- Message template approval
- Delivery webhooks

Future environment variables are documented as placeholders only:

~~~text
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=
~~~

Secrets must never be entered into a normal browser form or committed to GitHub.

## 10. UI Rules

### General

- Prioritise clarity over decoration
- Use consistent spacing, typography and status colours
- Keep destructive actions visually separate
- Always show loading, empty and error states
- Use realistic sample data
- Do not hide important workflow status behind decorative interactions
- Preserve responsive behaviour at desktop, tablet and mobile widths

### Admin

- Shopify-inspired order management
- Dense but readable data tables
- Detail panels for order information
- Visible assignment state
- Status badges and timeline
- Desktop-first layout

### Technician

- Grab-inspired field workflow
- Large touch targets
- Mobile-first layout
- Minimal forms
- Sticky primary action where appropriate
- Clear completion progress
- Fast access to address and customer contact

### AI assistant

- Bottom-right launcher
- Right-side panel on desktop
- Full-screen or bottom sheet behaviour on mobile
- Suggested questions
- Clear indication that results come from system records
- No unsupported claims when data is unavailable

## 11. Engineering Rules

- Use TypeScript where practical
- Keep components focused and reusable
- Keep database access behind a clear data-access layer
- Do not place secret API keys in client components
- Validate important inputs on both client and server
- Use server-side operations for status transitions and integrations
- Do not silently change business rules inside UI components
- Prefer readable code over clever abstractions
- Avoid adding dependencies without a clear reason
- Document important architectural decisions in docs/decisions.md
- Keep mock data separate from production data access
- Do not hardcode KPI results
- Do not give AI direct unrestricted database access

## 12. Collaboration and Commit Rules

This repository is intended to be handed to another developer or AI agent.

Before changing code:

1. Read AGENTS.md
2. Read the relevant phase in this plan
3. Inspect existing implementation before replacing anything
4. Preserve working features
5. Update documentation when the design changes

Commit messages should be short and meaningful.

Good examples:

~~~text
Add project planning document
Create admin orders page
Add technician completion workflow
Implement order status transitions
Add controlled operations query endpoint
Fix mobile job submission layout
~~~

Avoid commit names such as:

~~~text
final
final2
latest
new version
blabla.final
~~~

Do not rewrite history or force-push unless explicitly agreed.

For larger work, prefer a feature branch and a pull request. Keep commits grouped by coherent implementation work rather than tiny cosmetic changes.

## 13. Verification Rules

Each phase should be verified before moving forward.

Minimum checks:

- Application starts locally
- Main route loads
- No console errors
- Desktop layout is usable
- Mobile layout is usable
- Forms validate required fields
- Database writes are confirmed
- Status changes are visible after refresh
- Upload limits work
- Role-specific navigation behaves correctly
- Unsupported AI questions receive a safe response
- WhatsApp links contain correctly encoded messages

Before submission:

- Test the full workflow from order creation to manager review
- Test with each mock role
- Check empty states and failed submissions
- Confirm no secrets are present in the repository
- Confirm Vercel build succeeds
- Confirm README explains limitations and assumptions

## 14. Assessment Mapping

| Assessment requirement | Planned implementation |
| --- | --- |
| React frontend | Next.js and React components |
| Tailwind CSS | Shared Tailwind UI system |
| Supabase database | Orders, technicians, completions, reviews and logs |
| Supabase Storage | Service photos and documents |
| Mock login | Role selector in Phase 1 |
| Admin order submission | Phase 2 |
| Technician service job | Phase 3 |
| WhatsApp notification | Manual deep link in Phase 4 |
| Manager review | Phase 4 |
| KPI dashboard | Phase 5 |
| AI operations query | Phase 6 |
| Clear README | Maintained throughout the project |
| Deployment | Vercel after the core workflow is stable |

## 15. Definition of Done

The assessment implementation is considered complete when:

- An Admin can create an order
- The order receives an automatic order number
- The Admin can assign a technician
- The assigned Technician can view the job
- The Technician can mark the job In Progress
- The Technician can submit work completed and extra charges
- The final amount is calculated correctly
- The Technician can upload up to six files
- The Technician can mark the job Job Done
- A WhatsApp message link is generated
- A Manager can review the completed job
- Basic KPI data comes from stored records
- The AI assistant answers supported questions using controlled queries
- The project can be explained clearly in the README
- Another developer can continue the work without needing private conversation context
