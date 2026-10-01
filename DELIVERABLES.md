# Hartwell Tax & Bookkeeping — polish pass deliverables

## 1. Change log, by area

**Narrative and clarity**
- Homepage tells one story: hero with live open times (the front door), How it works, Before and after, Services and prices, Claire, Privacy, FAQ, October 15 deadline. Repeated sections removed (tax-season promises, "what we do", separate reviews block, sticky CTA bar, case-study page).
- Owner's Today opens with the impact strip from real data: appointments confirmed without you, reminders sent, empty chairs avoided, hours given back. The Report keeps the 30-day view.

**Navigation, layout, transitions**
- Both customer layouts (site, booking shell) share a 60px header; no jump between them.
- Footer "Owner view" is the intentional switch for the demo. The sticky bar that swallowed footer clicks is gone.
- Page transitions: one 200ms fade, steps slide in the direction of travel, modals scale from 96%.

**Interactive elements**
- 18 internal links checked, 0 dead. 0 console errors. 0 horizontal overflow at 390px and 1440px.
- Dead components removed (HeroVisual, InquiryVisual, Reveal, ComingSoon).

**Design system**
- Unchanged (repo DESIGN_SYSTEM.md). One button system, one tag, one stepper, one result layout, one confirm dialog. Tap targets ≥44px on phones without changing desktop sizes.

**Copy**
- One term: "appointment". CTAs say what happens: "Book an appointment", "Continue with 1:00 PM", "Book this time", "Find my appointment", "Answer the questions", "Mark as not needed".
- Error states separated: "didn't load, try again" vs "this link isn't working".

**Customer flow (front door)**
- Booking is two steps: pick a time (service, in person/video, live times), your details. Confirmed instantly.
- The five checklist questions come after booking: on the confirmation page, in the confirmation email, and first thing on the client's page until answered.
- Client page is stage-based (documents → ready → meeting → wrap-up → sign and pay → filed), with reschedule/cancel until the meeting and Join call for video.

**Owner flow (follow-through)**
- Today: impact strip, Needs you (exceptions only, including "meeting has ended"), Ready to file, today's schedule.
- Appointment window: five stages, documents grouped (needs your eyes / received / still to come), Timeline of what went out and what's next with Send now, Finish / Needs another meeting / No-show, Paid in office, Mark filed.

**States**
- Loading skeletons, empty states with a next action, retryable error states on every data-driven screen; file inputs and icon buttons have accessible names; axe WCAG AA serious/critical: 0.

## 2. Remaining known issues
- Minor: Stripe is not connected; the client's Pay step is a clearly labelled test checkout.
- Minor: final read-through of booking and client-page microcopy for voice.

## 3. Three-minute demo script

| # | Click path | Narration (one line) |
|---|---|---|
| 1 | Homepage, scroll to "Same return. None of the chasing." | "Claire runs a one-person tax practice in Montclair. In April and October she gets 40 calls a week and one in six appointments stalls." |
| 2 | Back to the top; tap a time in "Open times" → fill name and email → Book this time | "A client asks 'can you do my taxes?' at 9 pm. Two minutes later they're booked, and Claire never picked up the phone." |
| 3 | Confirmation → Answer the questions → answer five → checklist appears | "Five yes-or-no questions become the exact list of documents to bring." |
| 4 | Owner view (footer) → sign in → Demo tools → "Client uploads last year's W-2" | "Each upload is checked as it arrives. The wrong year is caught before Claire ever sees it." |
| 5 | Demo tools → "A client who isn't ready moves later" → Today | "A client two days out is missing documents; they're offered later times and take one. Today: appointments confirmed without her, reminders sent, empty chairs avoided, hours given back." |
| 6 | Open an appointment → Timeline | "Every confirmation, reminder and follow-up: sent, scheduled, or sent now with one click." |
| 7 | Finish appointment → (Demo tools) Client signs and pays → Mark filed | "From the meeting to e-filed with one email and two clicks. That's the whole season." |

## 4. Submission text
- Business: Hartwell Tax & Bookkeeping, Montclair, NJ. One Enrolled Agent, no front desk, two deadline rushes a year.
- One line: Hartwell Tax turns a late-night "can you do my taxes?" into a confirmed, fully prepared appointment, and runs the reminders, documents, signatures and payments on their own, so Claire only sees the exceptions.
- Social post: Built for the @Lovable challenge #lovablechallenge: a booking front door and follow-through for a solo tax preparer. Live times on the homepage, two-step booking, a checklist built from five questions, documents checked on arrival, and a Today screen that shows the hours given back. [link]
