# Supabase Guide

How Sejuk Ops uses Supabase: the tables, why they are shaped this way, and the security behind it.
Checked against the live project on 28 Oct 2026.

Supabase does four jobs here:

1. **Database** (Postgres): 8 tables.
2. **Auth**: email/password sign-in.
3. **Storage**: job photos, videos, PDFs and receipt photos.
4. **Row Level Security (RLS)**: rules for who may read or write each table.

---

## 1. The 8 tables

```
profiles (who logs in) ──1:1── technicians (field staff)
                                     │ assigned to
orders  (the job: one row per customer request)
  ├── service_completions   what the technician submitted (1 per order)
  │      └── service_files  photos / video / PDF / receipt (≤ 6 + receipt)
  ├── job_reviews           manager's decision (1 per order)
  ├── activity_logs         every action, who did it, from → to status
  └── notifications         WhatsApp links + internal alerts
```

| Table | What it holds | Why it is a separate table |
|---|---|---|
| **orders** | Customer, phone, address, problem, service type, branch, quoted price, assigned technician, status, scheduled time, reschedule count, admin notes | The centre of everything. One row per job, from New to Closed. |
| **technicians** | Name, phone, branch, active, link to a login | A technician can exist without an account, so the business list does not depend on Auth. |
| **profiles** | Name, email, role (`admin` / `technician` / `manager`) | Supabase keeps passwords in its own `auth.users`. This table adds our business data, mainly the role. |
| **service_completions** | Work done, extra charges (total + itemised list), final amount, payment amount and method, remarks, completed time | Kept apart from the order so the quoted price is never overwritten. Quote and final amount sit side by side, which is what the AI supervisor compares. |
| **service_files** | File path, name, type, `kind` (`evidence` or `receipt`) | One completion has many files. The files live in Storage; this table only points to them. |
| **job_reviews** | Approved / returned, notes, manager, time | One per order (`UNIQUE(order_id)`). A second review updates the first. |
| **activity_logs** | Action, actor, previous status → new status, metadata | Makes key actions traceable, as the brief asks. Insert only. |
| **notifications** | Channel (`whatsapp` / `internal`), audience, message, wa.me link, `ready` / `sent` / `read` | Proves the WhatsApp trigger fired, even though a person taps Send. |

### Design decisions

1. **Status is a database enum**: `new, assigned, in_progress, job_done, reviewed, closed`. A typo such as "Done" cannot be saved.
2. **Order numbers come from a Postgres sequence**: `'ORDER' || nextval(...)`. Two admins saving at the same moment can never get the same number.
3. **Quote vs final amount**: the quote stays on `orders`, the final amount goes in `service_completions`. The server recalculates the final amount, so a fake total sent from the browser is ignored.
4. **Extras saved twice on purpose**: `extra_charges` is the total (fast KPI sums) and `extra_items` is the itemised list (for the manager to read).
5. **One completion and one review per order**: a resubmission or second review updates the row (upsert). The full back-and-forth history lives in `activity_logs`.
6. **Foreign keys with cascade**: every completion, file, review and log must point to a real order. Deleting an order removes its children too.
7. **Indexes** on order status, assigned technician, completion date, order history and notification time. These match the controlled AI queries and the dashboard.
8. **Trigger** `orders_set_updated_at` stamps every order change.

---

## 2. Sign-in (Auth)

- Accounts live in Supabase's `auth.users`; passwords are handled by Supabase and never stored by us.
- Trigger `on_auth_user_created` creates the matching `profiles` row: it sets the role and, for `ali@demo.sejuksejuk.app`, links the login to technician Ali.
- On every API request the server verifies the token with Supabase (`auth.getUser`) and reads the role from `profiles`, never from the browser (`lib/server/actor.ts`).
- **Demo mode**: without an account, the browser sends `x-demo-role` / `x-demo-technician` headers. This is the "mock login / role switch" from the brief.

## 3. Storage

- Private bucket `service-evidence`.
- Files are uploaded under the order's folder. Screens show them through signed URLs that expire after 1 hour.
- The server checks that every file on a completion belongs to that order: at most 6 evidence files plus one receipt.

---

## 4. Security

### Strong

| Layer | What it does |
|---|---|
| Server state machine | Every action goes through `lib/workflow.ts`: wrong role → 403, wrong status → 409. Covered by 54 live API checks. |
| Server-side validation | Phone, price, files and required fields are checked again on the server, and the final amount is recalculated. |
| No service-role key | The app only uses the public anon key. The all-powerful key is not in the code or on Vercel. |
| AI key server-side | AI calls go through Vercel AI Gateway with the platform's OIDC token, so there is no key to leak. |
| AI has no database access | The model only picks an intent from a fixed list; the server runs a typed query. |
| RLS enabled | Every table has RLS switched on, ready for real policies. |

### Open for the prototype (known and documented in the README)

The live policies on all 8 tables are `using (true) with check (true)` for both `anon` and `authenticated`. This is what makes the password-free demo work.

1. The anon key is public (normal for Supabase). Someone technical could read or change tables directly and skip the server's workflow rules.
2. Demo headers can be faked: anyone can send `x-demo-role: admin` to the API.
3. Signed-in users can update any profile, including `role`.
4. Sign-up lets people pick their own role (deliberate, for the assessment).
5. Anon can read objects in the evidence bucket, so signed URLs are not the only protection yet.

### Interview answer

> "I enabled Row Level Security on every table but kept the policies open for the prototype, because the brief asked for a mock role switch without passwords. All business rules are enforced in one server-side state machine, and secrets never reach the browser. For production I would remove the anonymous policies and demo mode, write per-role policies (for example, technicians only see their own jobs), perform writes on the server with a protected key or through Postgres functions, lock the role column so only an admin can change it, and require sign-in for storage reads."

### Production hardening checklist

- [ ] Drop all `prototype_anon_*` policies.
- [ ] Add a `current_app_role()` SQL helper and per-role policies on each table.
- [ ] Technicians: select/update only orders where they are the assigned technician.
- [ ] Prevent users from changing `profiles.role` (admin only).
- [ ] Remove the self-chosen role on sign-up; roles are assigned by an admin.
- [ ] Storage: read and write for authenticated users only, scoped by order.
- [ ] Remove demo headers from `lib/server/actor.ts`.
