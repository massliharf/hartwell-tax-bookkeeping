# Hartwell Tax — every state, what happens automatically, and what Claire can do by hand

Rule: nothing waits on Claire unless it needs judgment. Every automatic message can also be sent by hand
("Send now" in the appointment's Follow-ups), and a manual send is limited to once an hour so a double click never sends twice.

## 1. Before booking
| State | Automatic | Manual (where) |
|---|---|---|
| Started booking, left before finishing | "Pick up where you left off" email 1 hour later (once) | — |
| Returning client wants their appointment | "Email me my link" sends private links (never shown on screen) | Resend the appointment link (appointment "…" menu) |
| Day is full | Waitlist join; when a slot frees, first waitlisted client gets a claim link | — |

## 2. Booked (before the appointment)
| State | Automatic | Manual |
|---|---|---|
| Booked | Confirmation email + calendar invite + portal link; checklist built from answers | Resend link |
| Booked by phone (owner) | Same confirmation; client answers the questions from the portal, checklist rebuilds | — |
| Documents missing, 7+ days out | Document reminder 7 days before (only if something is missing) | Document reminder: Send now |
| Still missing 48h before | Readiness check; offers a later time if still not ready; appears in Needs you | Keep appointment / let the offer stand |
| 24h before | Appointment reminder (email + text), video link for video calls | Appointment reminder: Send now |
| Client confirms / moves / cancels | Confirm updates status; a move keeps documents; a cancel frees the slot and offers it to the waitlist | Owner can drag to move (with confirm) or Cancel appointment… (emails a rebooking link, offers the slot) |
| Time off added over a booking | Warned in Settings, booking kept | Open the appointment from the warning |

## 3. Documents
| State | Automatic | Manual |
|---|---|---|
| Uploaded, AI says it's right | Auto-accepted ("Auto-checked") | Ask for a new copy (gallery) |
| Uploaded, AI flags it (wrong year/form/name) | Client warned at upload, can replace or keep | — |
| Client keeps a flagged file / unreadable | Goes to "Documents to check" (the only files Claire looks at) | It's fine / Ask for a new copy (reason + note prefilled from the AI) |
| Fix requested | Client emailed with the reason, item shows "Needs a fix" in the portal; replacing it re-checks | — |
| Claire needs something not on the list | — | Ask for another document (adds it to the checklist and emails the client) |
| Doesn't apply | Client marks it with a reason; counts as done | — |

## 4. After the appointment
| State | Automatic | Manual |
|---|---|---|
| Finished (fee + note) | "Review, sign and pay" email; portal switches to the sign-and-pay step | — |
| Not signed | Signature reminders; after 3 days in Needs you | Signature reminder: Send now |
| Signed, not paid | Payment reminders 1, 3 and 5 days after; after 5 days in Needs you | Payment reminder: Send now / Paid in office |
| Signed and paid | Moves to "Ready to file" | Mark filed (only possible when signed and paid) |
| Filed | "Your return has been e-filed" email | — |
| No-show | Marked by Claire | Send a rebooking link |

## 5. Where Claire sees it
Today: Needs you (exceptions only), Documents to check, Unpaid, Ready to file, today's schedule, next up.
Appointment window: five stages, documents grouped (Needs your eyes / Received / Still to come), Follow-ups (sent, scheduled with
date, or why it was skipped) with Send now, Finish / No-show, "…" menu for less common actions.
Report: every message sent, time saved, collected this month, waiting for payment.

## 6. One lifecycle, both sides (src/lib/lifecycle.ts)
documents → ready → meeting → wrap_up → sign_pay → to_file → filed, with side exits cancelled and no_show.
The client's page and Claire's window both call stageOf(), so they always agree. Each stage shows only what matters:
| Stage | Client sees | Claire's footer |
|---|---|---|
| documents / ready | When and where, confirm / reschedule / cancel, checklist (collapsed once complete) | Reschedule, … |
| meeting (10 min before → end) | "Happening now", Join call for video; no reschedule/cancel | Finish appointment, Needs another meeting, … (No-show) |
| wrap_up (ended, not finished) | "Claire is finishing your return", fixes if any; no meeting details | Same as meeting; also listed in Needs you |
| another meeting needed | New time on the same appointment; documents and answers carry over; email "Let's finish at your next meeting" | picks a time with the shared slot picker |
| sign_pay | Review, sign (Form 8879), pay (checkout) | Paid in office, Mark filed (locked until signed + paid) |
| to_file / filed | Done card | Mark filed / nothing |
Both sides show a dated timeline: what happened (booked, each upload, each message, meeting, finished, signed, paid, filed) and what's next.
