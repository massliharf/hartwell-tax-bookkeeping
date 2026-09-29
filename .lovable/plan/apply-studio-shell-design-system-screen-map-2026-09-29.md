# Apply "Studio Shell" design system — screen map

The new DESIGN_SYSTEM.md is saved at the project root. It is now the only visual reference. Nothing is applied yet.

## Global (applies to every screen)
- Tokens from section 11: canvas #F5F5F5, white panels, radius 16/12/8, Geist UI + Figtree display, Evergreen #1E5B47 accent, blue focus ring #4F69F2, shadow-pop.
- Buttons → section 7 Buttons (Primary dark 32h, Neutral, Secondary subtle, Ghost, Large action 40h for form submits, 40×40 mobile icon buttons).
- Paper grain, ledger lines, stacked-paper shadows and serif headings are removed. Ready ring and document stack stay (they are features), restyled in the accent + neutral fills.
- Mobile under 640px: top bar 60h and one white panel with a 16px top radius, per section 9.

## Public pages

| Screen | Template | Components |
|---|---|---|
| Homepage (announcement bar, hero, trust strip, how it works, services, about Claire, testimonials, documents safe, FAQ, footer) | E. Marketing catalog | Info bar (announcement), hero banner (current hero visual in a media card), Metadata tags (trust strip), Content cards (3 steps), Category tiles (services + "Book" accent link), Media card (portrait) + content card (bio), Carousel (testimonials, same 3 in the same order), Content cards (safety), Grouped rows (FAQ accordion), footer on surface-2. No search added. |
| Owner login / setup (/auth) | D (control panel only, centered) | Context header card, section labels, text boxes, Large action button, demo note as Info bar |
| Portal (/a/token) | D. Tool workspace | Left: context header card (appointment, Ready ring), Primary dark / Neutral buttons (I'll be there, Reschedule, Cancel), 8879 form (text box, checkbox, Large action). Right: Results area with document cards as grouped rows, Accent badge statuses, upload drop zone, privacy line |
| Move appointment (/move/token) | D | Left: context header card; right: results area with time slots as pill tabs grid |
| Waitlist claim (/claim/token) | Empty-state panel | Empty state (icon, title, description, one button) |
| /manage/token | redirect only — no UI |

## Booking flow

| Screen | Template | Components |
|---|---|---|
| Book steps 1–4 (/book) | D. Tool workspace (rule 4) | Left control panel: pill tabs row as the step indicator, context header card with "‹ Back", section labels. Step 1 service choice as select chips/list items; step 2 yes/no as Segmented controls and counts as Number steppers; step 3 dates as pill tabs, times as a grid of Neutral buttons, in person/video as Segmented control, "Full — join the waitlist" as Ghost link; step 4 text boxes. Large action at the bottom. Right results area: "Your checklist so far" with document stack + grouped rows. |
| You're booked (/book/confirmed) | D | Left: context header card (date, time, type), Neutral buttons (.ics, Google), Large action "Upload your documents now". Right: results area with checklist + Ready ring. Check animation kept. |
| Returning client (/book/returning) | D (control panel) | Section label, text box, Large action; then continues into the same booking steps |

## Owner app (rule 3: Template B shell)

Sidebar (224, collapsible to 72): logo row, primary nav Today · Calendar · Clients · Needs you (count badge) · Outbox · Insights · Settings, divider, footer icon buttons (Demo tools, phone preview, sign out). There is no "Create" button, because there is no create feature today. Header: breadcrumb. Mobile: top bar + bottom tab bar with the same 7 destinations (5 visible + "More" menu).

| Screen | Template | Components |
|---|---|---|
| Today | B main panel only | Greeting h1 (display), summary line, appointment rows as grouped row blocks (time, client, service, meeting type metadata tags, Ready ring, missing docs), actions as Neutral / Secondary buttons + dropdown menu |
| Calendar | B | Header row: title + prev/next icon buttons + "This week" neutral button; week grid in a white panel, events as 8px-radius blocks tinted by readiness (accent / amber / grey); detail dialog as Large picker modal style (narrower) |
| Clients list | B (secondary panel = list) | Secondary panel with the existing search box and client rows; main panel empty state until a client is picked (desktop); mobile keeps the list page |
| Client detail | B | Main panel header row (name + actions), content cards: contact, appointments (grouped rows), documents (project rows + viewer modal), message history (grouped rows) |
| Needs you | B | Grouped row blocks per category with one-tap Neutral buttons; empty state "Nothing needs you right now" |
| Outbox | B | Pill tabs for the type filter; grouped rows per message with metadata tag "saved X min" |
| Insights | C. Discover | Display h1 hero stat, h2 sections, content cards with the same recharts charts (accent + neutral), Before/Now as two content cards (Now = dark card #2B2B2B) |
| Settings | D (control panel, full width) | Section labels, office hours rows with switches, number steppers (buffer, reminder timings), services as grouped rows with text boxes, Large action save |
| Demo tools drawer + phone preview | Dropdown menu / Coach-mark popover | Menu items 32h with tinted icons; phone frame unchanged in structure |

## Conflicts to confirm
1. **Command palette (⌘K):** rule 3 requires one in the owner app, but rule 1 forbids new features. My plan: add it as a keyboard-only way to jump between the 7 existing owner pages, with no new actions and no visible search bar. Say no and I'll leave it out.
2. **PROJECT_BRIEF.md brand section** (paper background, Instrument Serif, ink green, paper textures) contradicts the new system. I'll mark it as replaced by DESIGN_SYSTEM.md. Project Knowledge still describes "Calm Ledger", so please update it yourself in Settings.
3. **Ready ring amber:** the new system has no amber. The partial state will use a neutral grey fill, and the full state will use Evergreen with a check.

## Technical notes
- Changes only in src/styles.css, src/components/**, route component markup and __root font links. No schema, server functions, routes, automations or email changes.
- Work screen by screen, checking each at 390px and desktop with Playwright.
