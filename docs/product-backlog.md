# Event Aggregator: Product Backlog

Team Meridian. One-week sprints. Draft for the team to review and edit together.

## How to read this
- **Points** use the Fibonacci scale (1, 2, 3, 5, 8). They measure relative effort, not hours. A 3 is roughly "a day of focused work for one person."
- **Priority** uses MoSCoW: **M**ust, **S**hould, **C**ould.
- Plan each sprint to about **80% of capacity**. We don't know our velocity yet. Sprint 1 is the calibration sprint: plan roughly 15 points, then adjust from what we actually finish.
- Stories are written as "As a ___, I want ___ so that ___" in the short form below. Acceptance criteria (AC) are the checks the Product Owner uses to accept a story.

---

## Sprint 0: Foundation (done or nearly done)
- [x] Repo, Next.js scaffold, Prisma + Neon, initial schema and migration
- [x] CI with GitHub Actions
- [ ] Health check route merged through a reviewed PR
- [ ] Vercel staging deployment
- [ ] Branch protection on `main`
- [ ] Project board and backlog loaded
- [ ] Sprint 0 review and retrospective

---

## Sprint 1: Authentication and roles (core 15 pts, stretch 5)
**Goal:** a user can sign up, log in, and see pages that match their role.

| ID | Story | Pts | Pri | Acceptance criteria |
|---|---|---|---|---|
| US-101 | As a visitor, I can register an account | 5 | M | Name, email and password required; email must be unique; password stored hashed (never plain text); duplicate email shows a clear error |
| US-102 | As a user, I can log in and log out | 3 | M | Valid credentials start a session; wrong credentials show an error; logout ends the session |
| US-103 | As a user, I choose Organizer or Attendee when registering | included in US-101 | M | Role is saved on the user and available in the session |
| US-104 | As the system, I protect pages by role | 3 | M | Organizer-only page blocks Attendees and logged-out users (redirect or 403); Attendee pages block logged-out users |
| US-105 | As a user, the navigation reflects my login state and role | 2 | M | Logged-out: Login/Register; Attendee: Browse/My Tickets; Organizer: My Events/Dashboard |
| US-106 | As a user, I can view and edit my profile name | 2 | S | Profile page shows name, email, role; name can be updated |
| US-107 | As a user, I can reset a forgotten password by email | 5 | C (stretch) | Reset email with expiring single-use token; new password works; old token rejected. Move to Sprint 2 if behind |

Sprint 1 demo: register as an Organizer, log in, open an organizer-only page, log out; confirm an Attendee account cannot open it.

---

## Sprint 2: Event creation (core 15 pts, stretch 3)
**Goal:** organizers can create and manage events.

| ID | Story | Pts | Pri | Acceptance criteria |
|---|---|---|---|---|
| US-201 | As an organizer, I can create an event | 5 | M | Title, description, category, venue, city, start and end date/time; end must be after start; saved as Draft |
| US-202 | As an organizer, I can edit my event | 3 | M | Only the owner can edit; changes persist |
| US-203 | As an organizer, I can cancel or delete my event | 2 | M | Owner only; events with sold tickets can be cancelled but not deleted |
| US-204 | As an organizer, I can publish or unpublish an event | 2 | M | Drafts are hidden from the public; published events are visible |
| US-205 | As an organizer, I can see all my events in "My Events" | 3 | M | Lists only my events with status; links to edit |
| US-206 | As an organizer, I can upload an event image | 3 | C (stretch) | Start with an image URL field; real uploads need storage and can wait |

---

## Sprint 3: Ticket tiers (15 pts)
**Goal:** organizers define how tickets are sold.

| ID | Story | Pts | Pri | Acceptance criteria |
|---|---|---|---|---|
| US-301 | As an organizer, I can add ticket tiers to an event | 5 | M | Name, price (stored in cents), quantity, optional sales start/end |
| US-302 | As an organizer, I can edit or delete a tier | 3 | M | Cannot delete a tier that has sold tickets; cannot reduce quantity below the number already sold |
| US-303 | As the system, I validate tier input | 2 | M | No negative prices; quantity at least 1; sales end after sales start |
| US-304 | As an organizer, I can see remaining availability per tier | 2 | M | Shows quantity, sold and remaining |
| US-305 | As the system, I require at least one tier before an event can be published | 3 | S | Publish is blocked with a clear message if there are no tiers |

---

## Sprint 4: Event discovery (18 pts)
**Goal:** attendees can find events.

| ID | Story | Pts | Pri | Acceptance criteria |
|---|---|---|---|---|
| US-401 | As an attendee, I can browse a list of published events | 5 | M | Pagination; shows image, title, date, city, starting price |
| US-402 | As an attendee, I can search events by keyword | 3 | M | Matches title and description |
| US-403 | As an attendee, I can filter by date, category, city and price | 5 | S | Filters combine; clearing filters resets the list |
| US-404 | As an attendee, I can open an event detail page | 3 | M | Shows full description, venue, date and all tiers with availability |
| US-405 | As an attendee, I don't see drafts, cancelled or past events in the list | 2 | M | Past events hidden or clearly marked; drafts never visible |

---

## Sprint 5: Checkout and payments (27 pts: the heaviest sprint, expect carry-over)
**Goal:** attendees can buy tickets. Consider splitting into two sprints (5a: US-501 to US-504, 5b: US-505 and US-506).

| ID | Story | Pts | Pri | Acceptance criteria |
|---|---|---|---|---|
| US-501 | As an attendee, I can pick a tier and quantity and start checkout | 3 | M | Must be logged in; quantity limited to what's available |
| US-502 | As an attendee, I can pay with Stripe Checkout (test mode) | 5 | M | Creates a Pending order and a Stripe session; redirects to Stripe |
| US-503 | As the system, I confirm payment through a Stripe webhook | 8 | M | Verified webhook marks the order Paid and creates Ticket rows; safe to receive twice (idempotent) |
| US-504 | As the system, I prevent overselling | 5 | M | Stock check and update happen in one database transaction; two simultaneous buyers can't take the last ticket |
| US-505 | As an attendee, I get a confirmation email | 3 | S | Sent via Resend after payment; includes order summary |
| US-506 | As the system, I handle failed and abandoned payments | 3 | S | Failed orders are marked Failed; stock is released; pending orders expire |

---

## Sprint 6: Tickets and QR codes (17 pts)
**Goal:** purchased tickets are usable.

| ID | Story | Pts | Pri | Acceptance criteria |
|---|---|---|---|---|
| US-601 | As the system, I generate a unique QR code per ticket | 3 | M | QR encodes the unguessable ticket `code`, not a sequential ID |
| US-602 | As an attendee, I can see my tickets in "My Tickets" | 3 | M | Lists upcoming tickets with event and tier |
| US-603 | As an attendee, I can open and download a ticket | 3 | M | Ticket view with a scannable QR; works on a phone |
| US-604 | As an attendee, I can see my order history | 3 | S | Past orders with status and totals |
| US-605 | As an attendee, I can cancel or refund under simple rules | 5 | C | Only before a cutoff; ticket becomes Cancelled; stock returns |

---

## Sprint 7: Check-in at the door (20 pts)
**Goal:** organizers can scan and validate tickets. After this sprint we have the full core loop: create an event, sell a ticket, check someone in (**MVP**).

| ID | Story | Pts | Pri | Acceptance criteria |
|---|---|---|---|---|
| US-701 | As an organizer, I can scan QR codes with my phone camera | 5 | M | Mobile-friendly scanner page using the browser camera |
| US-702 | As the system, I validate a scanned ticket and mark it used | 5 | M | Valid ticket becomes Used and a CheckIn record is created |
| US-703 | As the system, I reject duplicate and wrong-event scans | 3 | M | Already-used and other-event tickets are refused with a reason |
| US-704 | As an organizer, I get clear success and failure feedback | 2 | M | Large green/red result with attendee name and tier |
| US-705 | As an organizer, I can look up a ticket manually | 3 | S | Search by attendee name or email when a QR won't scan |
| US-706 | As the system, only the event's organizer can check people in | 2 | M | Other users get 403 |

---

## Sprint 8: Organizer dashboard and analytics (18 pts)
**Goal:** organizers can track performance.

| ID | Story | Pts | Pri | Acceptance criteria |
|---|---|---|---|---|
| US-801 | As an organizer, I can see sales per event and tier | 5 | M | Counts per tier for each of my events |
| US-802 | As an organizer, I can see revenue and tickets remaining | 3 | M | Totals match paid orders |
| US-803 | As an organizer, I can see attendance versus sales | 5 | S | Checked-in count against tickets sold, updating as people arrive |
| US-804 | As an organizer, I can see my attendee list | 3 | M | Names, tiers, check-in status |
| US-805 | As an organizer, I can export attendees to CSV | 2 | S | Downloads a CSV of the attendee list |

---

## Sprint 9: Achievement badges (19 pts)
**Goal:** attendees are rewarded for engagement.

| ID | Story | Pts | Pri | Acceptance criteria |
|---|---|---|---|---|
| US-901 | As the system, I have a set of badge definitions | 3 | M | Seeded badges, e.g. First Event, Early Bird, 5 Events Attended, VIP |
| US-902 | As the system, I award badges automatically on check-in | 8 | M | Rules run after each check-in; correct badges awarded |
| US-903 | As an attendee, I can see my badges on my profile | 3 | M | Earned badges shown with name, description and date |
| US-904 | As an attendee, I'm notified when I earn a badge | 3 | S | In-app notification (email optional) |
| US-905 | As the system, I never award the same badge twice | 2 | M | Enforced by the database unique constraint; re-running the rules is safe |

---

## Sprint 10: Hardening and release (28 pts)
**Goal:** ship a stable v1.

| ID | Task | Pts | Pri |
|---|---|---|---|
| T-1001 | End-to-end tests for the core loop (register, create event, buy, check in) | 5 | M |
| T-1002 | Security review: auth, payment webhook verification, QR forgery, role checks | 5 | M |
| T-1003 | Accessibility and responsive design pass | 5 | S |
| T-1004 | Performance check (list queries, indexes) | 3 | S |
| T-1005 | User acceptance testing and fixing what it finds | 5 | M |
| T-1006 | Production deployment, monitoring and final documentation | 5 | M |

---

## Later (not scheduled)
Ticket transfers, promo codes, event reminders, organizer payouts, social sharing, ticket scanning offline mode, and upgrading Prisma to the next major version.

## Total
Sprints 1 to 9 come to 164 points before stretch items. If Sprint 1 shows we finish about 12 to 15 points a week, expect the full plan to take longer than 10 sprints. Use the shorter-timeline option: merge Sprints 2 and 3, and merge Sprints 8 and 9 into a basic analytics plus a simple badge set.