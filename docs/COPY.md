# Hartwell Tax: copy guide (customer side)

Made with the `web-ux-copywriter` skill. Check changes with:
`python3 <skill>/scripts/copy_lint.py src --glossary docs/copy-glossary.json`

## Message hierarchy
- **Business goal:** turn "can you do my taxes?" into a confirmed, prepared appointment, without Claire picking up the phone.
- **Promise:** Your tax return, done in one appointment.
- **How:** Choose a time online, upload your documents before you come in, and leave with your return done.
- **Proof (once, in "What clients say"):** 4.9 from 276 reviews (Google 212, Yelp 64) · 1,800+ returns since 2014 · 98% come back · accuracy guarantee · IRS Enrolled Agent.
- **Objections and where they're answered:** price (Services and prices, booking summary), effort (How it works), trust (What clients say, Meet Claire), privacy (Your documents are private, next to uploads), flexibility (move or cancel from the confirmation email).
- **Calls to action:** primary "Schedule an appointment" everywhere; secondary "Free 15-minute call".

## Glossary
| Concept | Use | Never |
|---|---|---|
| The main action | schedule | book, booking, reserve (exception: the "You're booked" moment and client quotes) |
| What they schedule | appointment | booking, slot, session |
| Times | available times | open times, slots |
| Getting documents to us | upload | send, share |
| The list | document checklist (first mention), checklist | list, requirements |
| Filing | file (with the IRS) | e-file, e-filed (exception: official names like "IRS Authorized e-file Provider") |
| The free option | free 15-minute call | free call alone in headings, consultation |
| The person | Claire | your preparer, our team |
| The business | we, Hartwell Tax | the firm, the practice |

## Rules we follow
- Say what happens, not a slogan. Show the detail here (link, address, price), don't send people elsewhere for it.
- Times are shown in the visitor's own time zone; never print a time-zone note.
- No device assumptions ("from your phone"), no internal mechanics, no exclamation marks.
- Done states say it's done, show what was done, then offer the next step.
- Section titles end with a period; product UI titles (booking steps, cards) don't.

# Owner dashboard

The dashboard speaks to Claire as "you". Same glossary as the customer side, plus:

| Concept | Use | Never |
|---|---|---|
| Documents waiting for Claire | To check | Needs your eyes, review queue |
| The 2-day-before check | Document check | readiness check |
| Messages that go out on their own | Automatic messages | automations, handled for you |
| A link to rebook | Link to schedule again | rebooking link |
| An open period | time, open time | slot |
| Filing | Mark filed, filed | e-filed |

Section names stay short and stable: Today, Needs you, Today's schedule, Ready to file, Calendar, Clients, Report, Settings.
Message names in history read as plain events: Confirmation, Document reminder, Document check: all in, Document check: later time offered, Day-before reminder, Review, sign and pay, Return filed.
