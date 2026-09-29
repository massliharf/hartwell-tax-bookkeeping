# PROJECT BRIEF — Patel Tax & Bookkeeping

> Read and follow this file in every future request. It is the source of truth for
> scope, business rules, data, brand, and constraints. If a request conflicts with
> this brief, flag it before implementing.

## 1. What we are building

A real client project: the website and booking system for **Patel Tax &
Bookkeeping**, Edison, New Jersey.

## 2. The client

Priya Patel, EA (IRS Enrolled Agent). Solo practice, small office on Oak Tree
Road, Edison NJ. She prepares individual returns, self-employed returns, rental
property returns, and does small-business bookkeeping. No staff. Clients meet in
person or by video call.

## 3. The problems (the real brief)

- Tax season (Jan–Apr) and the October 15 extension deadline are crushing: 60+
  hour weeks, phone and email full of "can I come in Saturday?"
- About 1 in 3 clients show up without all their documents (W-2s, 1099s, 1098s).
  The appointment is wasted and has to be repeated. This is her biggest cost.
- No-shows during the busiest weeks leave valuable slots empty while other people
  are waiting.
- After the appointment she chases missing documents and the e-file signature form
  (Form 8879) for days.
- Half-finished inquiries and last year's clients are never followed up.

## 4. The goal

Turn "can I book with you?" into "you're booked" with zero effort from Priya, and
make sure every client arrives ready. **The booking is ALWAYS confirmed instantly;
documents are collected afterwards and never block the booking.** Priya only
handles exceptions.

## 5. Services (duration / price — fee paid at filing, no payment at booking)

| Service | Duration | Price |
| --- | --- | --- |
| Individual return (W-2 income) | 45 min | from $250 |
| Self-employed / freelancer (1099, Schedule C) | 75 min | from $450 |
| Rental property | 60 min | from $400 |
| Extension / IRS letter review | 30 min | $150 |
| Small business bookkeeping consult | 60 min | $200 |

**Office hours:** Mon–Fri 9:00–18:00, Sat 10:00–14:00.
**Buffer:** 15 minutes between appointments.
**Time zone:** America/New_York.

## 6. Privacy

Tax documents are sensitive.

- **Never ask for a Social Security number anywhere.**
- Uploaded files go to private storage, visible only to Priya, accessed through
  short-lived signed URLs.
- Always show calm, clear privacy reassurance near uploads.

## 7. Clock

All automations and "today" logic must use a single helper `getNow()` that returns
real time plus an optional demo offset stored in settings. This lets us fast-forward
time for demos.

## 8. Brand & design

Follow `DESIGN_SYSTEM.md` (Workbench) for every visual and UX decision. The
Workbench design replaces the previous serif, beige, textured-paper visual
direction; all service, privacy, booking, and clock rules above remain in force.

Use a grey canvas (`#F3F3F1`) with white panels, Geist typography, evergreen
actions (`#1E5B47`), and marigold (`#F0A534`) only for the Ready ring and
progress. No serif fonts, beige, textures, gradients, all-caps eyebrows,
decorative dot chains, arrows in button text, or scroll-triggered fade-ins.
Keep the Ready ring as the signature element and documents central to the UI.
No payment is collected in this transformation: fees remain due at filing.
