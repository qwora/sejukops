# How Sejuk Ops was built

Built over three days (27–29 Oct 2026), in stages. Each stage was planned, built on its own branch, merged through a pull request, deployed to Vercel and tested on the live site before the next one started.

The git history follows the same stages. Every commit is one reviewable step, and every pull request is one stage.

This public repository carries the full commit history. The pull requests (with Vercel preview checks) are in the private working repository; access is available on request.

## Timeline

| # | Stage | When | Pull request | What changed |
|---|---|---|---|---|
| 0 | Plan | 27 Oct, morning | — | Read the brief, wrote the implementation plan and the project rules (`AGENTS.md`). |
| 1 | First working version | 27 Oct, morning–afternoon | part of #1 | App shell for 3 roles, admin orders, technician completion, manager review, Supabase database and storage, KPI dashboard, first AI assistant, Supabase Auth. |
| 2 | Audit and rebuild | 27 Oct, evening | #1 | Found and fixed bugs in the first version (login profile column, phone format, second review failing). Moved every write to the server behind one state machine, added activity logs and notifications, the WhatsApp trigger and the controlled AI pipeline. Redesigned the whole UI (Shopify-style admin, Grab-style technician app). |
| 3 | AI hardening and advanced AI | 27 Oct, evening | follow-ups after #1 | Kept key figures in AI answers, reviewer accounts, receipt photo, AI document understanding, AI workflow supervisor, assessment checklist. |
| 4 | Brand and installable app | 27 Oct, night | #7 | Company logo, colours, favicon and app icons. Technicians can decline a job. Technician app adapts to tablet/desktop and installs as a phone app (PWA). 403 vs 409 permission errors. |
| 5 | End-to-end QA | 27 Oct, late night | #8 | Full test on the live site. Fixed: times saved an hour off outside Malaysia, over-cautious AI supervisor, sign-in console error, negative price message, receipt on the job done screen. Test report. |
| 6 | Field testing on a real iPhone | 28 Oct | #9, #10 | Fixed the header under the iPhone status bar, gallery/file uploads, photo shrinking and upload limits, before/after photo reminder, pre-filled customer WhatsApp, Waze/Google Maps buttons, technician phone numbers. |
| 7 | Final audit and docs | 28 Oct | #11 | Guarded AI answers against made-up order numbers, Malay questions without AI, favicon. Documentation tidied for submission. |
| 8 | Reviewer polish | 29 Oct | #12, #13 | Review queue shows newest first with an oldest-first switch and a flagged-only filter. Separate Log out and Switch role buttons. Email sign-in accounts for each role. |

## How each stage was run

1. **Plan:** write down what the stage changes and why (`docs/history/plan.md`, `docs/decisions.md`).
2. **Branch:** one branch per stage with a plain name (`brand-refresh`, `qa-fixes`, `technician-field-fixes`).
3. **Commits:** small steps with clear messages ("Add technician completion workflow", "Fix technician headers under the iPhone status bar").
4. **Pull request:** Vercel builds a preview for every PR.
5. **Test:** type-check, production build, 54 automated workflow and permission checks against the API, then the main flow by hand in the browser at phone and desktop sizes.
6. **Merge:** merged to `main`, which deploys to https://sejuksejuk.vercel.app, then checked again on the live site.

## Key decisions along the way

| Problem found | Decision |
|---|---|
| Screens wrote straight to the database, so rules could be skipped | All writes go through server routes and one state machine (`lib/workflow.ts`). |
| Free-form AI could invent data | The AI only picks one question type from a fixed list; the server runs a typed query; answers are checked against the data. |
| No WhatsApp Business account | A server trigger builds the message and a wa.me link; the `notifications` table is ready for the API later. |
| Supabase's free email limit blocked sign-ups | Profiles created by a database trigger, plus one-click demo access for reviewers. |
| Times shifted on computers outside Malaysia | Date-time inputs are always read and shown as Malaysia time. |
| Technicians copied addresses into maps by hand | One-tap Waze and Google Maps links instead of a map library (better Malaysian address search, no API key). |
| Phone photos are large on mobile data | Photos are shrunk on the phone before upload; Supabase enforces 25 MB per file. |

Full decision records: [decisions.md](decisions.md).

## Tools used

- **Codex** produced the first working version (stage 1).
- **Claude Code** audited it, fixed the bugs above, redesigned the UI, moved the workflow server-side, built the AI pipeline, and ran the browser tests and live checks in stages 2–7.
- **Me:** product decisions and scope (for example: navigation links instead of a map library, keeping +60 as the default, the before/after photo reminder), the brand and logo, testing on a real iPhone, and approving every merge to production.

## Planning documents from the build

Kept for reference in [history/](history/):

- [plan.md](history/plan.md): the original implementation plan
- [assessment-status.md](history/assessment-status.md): checkpoint notes during stages 1–2
- [ui-roadmap.md](history/ui-roadmap.md): UI handoff notes before the rebuild
