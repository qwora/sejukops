# Manual Test Guide

A step-by-step script for testing Sejuk Ops by hand on **https://sejuksejuk.vercel.app**.
Takes about 30 minutes. Use a laptop for Admin and Manager, and a phone for Technician.

**Tips before you start**

- Name every test customer starting with **"Test"** (e.g. "Test Ahmad") so test orders are easy to find later.
- To switch role: go to **/login**, pick another role card, press **Continue**.
- Demo sign-in remembers the role per browser tab. Using two tabs (or laptop + phone) lets you be Admin and Technician at the same time.
- ✅ = what you should see. If you see something else, note the step number.

---

## Part A — Admin creates an order (laptop)

| # | Do this | ✅ Expect |
|---|---|---|
| A1 | Open the site. | Dark landing page with the Sejuk Ops logo. |
| A2 | Click sign in → choose **Admin** → **Continue as admin**. | Orders list opens. |
| A3 | Click **Create order**. | Form with Customer, Service, Assign technician, Pricing. |
| A4 | Press the create button with the form empty. | Name, phone, address and price turn red. Nothing is saved. |
| A5 | Type phone `123`. | "Enter a Malaysian mobile number". |
| A6 | Type price `-5`. | Price field stays red; cannot save. |
| A7 | Fill properly: name `Test Ahmad`, phone `012-345 6789`, an address, service **Aircond cleaning**, branch, price `180`, a problem, admin note "Call before arrival". | Fields turn normal. |
| A8 | Look at **Preferred slot**. | Labelled **"· Malaysia time"**, about 3 hours from now. |
| A9 | In **Assign technician**, pick **Ali**. | Cards show branch, open jobs, Best match / Busy / Overloaded. WhatsApp preview appears on the right. |
| A10 | Press **Create & assign to Ali**. | Order page opens with a new number (**ORDER12xx**) and a "created and assigned to Ali" message. |
| A11 | On the order page, press **Reschedule**, pick a new time, give a reason, **Save**. | New time shown; Activity timeline shows the reschedule. |
| A12 | Write down the order number. | — |

**Bonus: AI fill from a document**

| # | Do this | ✅ Expect |
|---|---|---|
| A13 | Create order → **Fill from a document** → **Or paste text**, paste: `Salam, saya Test Siti 0198765432, rumah di No 5 Jalan Mawar, Shah Alam. Aircond bocor air, nak servis esok 11 pagi. Quote RM150.` | Name, phone, address, service, problem, price and tomorrow 11:00 are filled in. You can still edit them. (No need to save this one.) |

---

## Part B — Technician does the job (phone)

| # | Do this | ✅ Expect |
|---|---|---|
| B1 | On your phone open the site → sign in → **Technician**, technician **Ali** → Continue. | "Today's jobs" in a phone-style screen with a bottom tab bar. |
| B2 | Find your order and tap it. | Job details: customer, **Call** and **WhatsApp** buttons, problem, admin note, quote. |
| B3 | Tap **Waze** and **Google Maps**. | Each opens navigation to the customer's address. |
| B3a | Tap **Accept & start job**. | Reminder "Take before photos first" appears. Tap **Got it, start job**. |
| B3b | — | Status changes to **In progress**; checklist includes before and after photos. Tap **WhatsApp**: chat opens with "Hi …, I'm Ali, your technician from Sejuk Sejuk Service…". |
| B4 | Tap **Complete job**. | Completion form: Work done, Extra charges, files, Payment, Receipt, Remarks. |
| B5 | Tap **Mark job done** with Work done empty. | Asked to fill in Work done. |
| B6 | Pick a work-done chip and add an extra charge (e.g. "Drain pipe flush", RM 40). | **Final amount** updates live to RM 220. |
| B7 | Tap **Add**: the phone offers camera, photo library or files. Add 1–2 photos. Try a 7th file. | Previews appear; more than 6 files is refused. Files over 25 MB are skipped. |
| B8 | Payment method **Cash**, add a **Receipt photo**, a remark → **Mark job done**. | **Job done** screen: amount, "evidence files · receipt attached", "Manager & accounts notified". |
| B9 | Read the **customer feedback message**, tap **Send on WhatsApp**. | WhatsApp opens to the customer number with: *"Hi Test Ahmad, Job ORDER12xx has been completed by Technician Ali at …"*. You don't have to actually send it. |
| B10 | Press the browser back button to return to the completion form. | "This job is job done." The form can't be submitted twice. |

**Decline test (optional, needs a second order assigned to Ali)**

| # | Do this | ✅ Expect |
|---|---|---|
| B11 | Open the job → **Decline job** → pick a reason (or type one) → confirm. | Job disappears from Ali's list. |
| B12 | As Admin, open that order. | Back to **New**, not assigned, warning "Ali couldn't take this job: …". |

---

## Part C — Manager reviews (laptop)

| # | Do this | ✅ Expect |
|---|---|---|
| C1 | /login → **Manager** → Continue → **Review queue**. | Your order is in the queue as **Waiting for manager review**. |
| C2 | Open it. | Service record with work done, extras, photos, receipt, payment; AI note **SUGGEST APPROVE** or **CHECK BEFORE APPROVING** with a reason. |
| C3 | Type a note (e.g. "Please add the after photo") → **Return to technician**. | Status goes back to the technician. |
| C4 | Phone (Ali): open the job. | Red **Returned by manager** banner with the note. Complete it again. |
| C5 | Manager: open it again → **Mark as reviewed**. | Status **Reviewed** / "Approved · ready to close". |
| C6 | **Close order**. | Status **Closed**. The stepper shows all six steps done. |
| C7 | Admin: open the order → scroll to **Activity**. | Every step with who did it: created → reschedule → assign → start → complete → WhatsApp → return → complete → approve → close. |

---

## Part D — KPI dashboard (Manager)

| # | Do this | ✅ Expect |
|---|---|---|
| D1 | Open **Performance**. | Cards: jobs completed, revenue, reschedules, open jobs; technician leaderboard; branch chart. |
| D2 | Switch between **Today / This week / Month**. | Numbers change; your test job is counted in "Today" and "Week". |
| D3 | Compare reschedule count with step A11. | Includes your reschedule. |

---

## Part E — AI operations assistant (Manager)

Open **Ops assistant** in the sidebar (or **Ask Ops** in the top bar) and ask each question:

| # | Ask | ✅ Expect |
|---|---|---|
| E1 | What jobs did technician Ali complete last week? | "Technician Ali completed N jobs last week…" with an `ORDER – service` list. |
| E2 | Which technician completed the most jobs this week? | One name with a count. |
| E3 | How many jobs were completed today? | A number that includes your test job. |
| E4 | Which technician might be overloaded this week? | Names with open-job counts. |
| E5 | Berapa kerja siap hari ini? | Answer to the same question in Malay. |
| E6 | What is the weather in KL? | Polite refusal: only operations questions are supported. |
| E7 | Delete all orders | Refused. Nothing is changed. |

Each answer shows how it was produced (the question type, filters and number of records used).

---

## Part F — Role rules (who can do what)

| # | Do this | ✅ Expect |
|---|---|---|
| F1 | As Technician, open `/admin/orders` in the address bar. | "This page isn't part of the technician workspace". |
| F2 | As Technician, open `/manager/dashboard`. | Same message. |
| F3 | As Technician **John**, open Ali's job link. | "This job is assigned to Ali." No start button. |
| F4 | As Admin, open a Job Done order. | Review is read-only; no approve button. |
| F5 | As Admin, open a Closed order. | No Assign / Reschedule buttons. |

---

## Part G — Phone app (PWA)

| # | Do this | ✅ Expect |
|---|---|---|
| G1 | **Android (Chrome):** sign in as Technician → tap **Install** (or ⋮ → *Install app*). | Sejuk Ops icon on the home screen. |
| G2 | **iPhone (Safari):** Share → **Add to Home Screen**. | Same. |
| G3 | Open it from the icon. | Full screen, no browser bar, navy top. |
| G4 | Turn on airplane mode, open a new page. | "You're offline" page instead of a browser error. |

---

## Part H — Looks and layout

| # | Do this | ✅ Expect |
|---|---|---|
| H1 | Each screen on a laptop and on a phone. | Nothing cut off; no sideways scrolling. |
| H2 | Browser tab icon. | Sejuk Ops logo. |
| H3 | Technician screens on a laptop. | Job list on the left, job in the middle (phone-style column). |

---

## After testing

Your test orders all start with "Test". They count in the dashboard and in technician workload. Ask before deleting any of them.
