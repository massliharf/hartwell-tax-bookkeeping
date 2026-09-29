# Patel Tax & Bookkeeping — "Workbench" Design System

Version 1.0 · For the Lovable build · UI/UX layer only (does not change data, routes or logic)

---

## 0. Where this comes from, and what is ours

This system studies the structure of a modern pro-tool app shell: a quiet grey canvas, floating white panels, a compact left sidebar, one command-style search bar, tinted category tiles, segmented controls, and calm empty states. Those are shared interface patterns.

Nothing brand-specific is copied: no logo, no proprietary display typeface, no signature pink, no illustrations, no copy. Our identity comes from three things that belong only to Priya's practice:

1. **Evergreen** as the brand color (money, trust, calm), never pink.
2. **The Ready ring**: the one bold, memorable element. Everything else stays quiet.
3. **Documents as the main object**: the checklist and document cards replace media thumbnails.

---

## 1. Principles

1. **Quiet shell, one bold moment.** Neutral canvas and panels. The only strong visual is the Ready ring and its marigold fill.
2. **One decision per surface.** Each panel answers one question: which service, which time, which document.
3. **The next action is always visible.** Primary button in a fixed, predictable place on every screen.
4. **Numbers are the product.** Dates, times, prices and progress use tabular figures and never a decorative font.
5. **Calm density for Priya, generous space for clients.** The owner app is compact like a pro tool; the client side is larger and slower.
6. **Structure is information.** Borders, dividers and numbers appear only when they mean something. No decorative eyebrows, no numbered markers unless it is a real sequence.

---

## 2. Color

### Core palette

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F3F3F1` | App background behind panels |
| `paper` | `#FFFFFF` | Panels, cards, inputs |
| `ink` | `#1A1A1A` | Primary text, dark neutral buttons |
| `graphite` | `#5F5F5B` | Secondary text |
| `evergreen` | `#1E5B47` | Brand, primary action, links, focus, selected states |
| `marigold` | `#F0A534` | Ready ring fill and progress **only** |

### Supporting neutrals

| Token | Value | Use |
|---|---|---|
| `muted` | `#8E8E89` | Tertiary text, placeholders, timestamps |
| `line` | `#E8E8E5` | Dividers and input borders (use sparingly) |
| `control` | `#EDEDEB` | Neutral button fill, segmented control track |
| `hover` | `rgba(90,90,85,0.08)` | Hover on rows and nav items |
| `selected` | `rgba(90,90,85,0.14)` | Active nav item, selected segment |
| `evergreen-hover` | `#174A39` | Hover on primary |
| `evergreen-tint` | `#E6F0EC` | Selected card background, success tint |

### Status

| Token | Hex | Tint |
|---|---|---|
| `success` | `#2F7D5B` | `#E7F3EC` |
| `warning` | `#B86E12` | `#FBF0DF` |
| `danger` | `#C2412D` | `#FBE9E6` |
| `info` | `#3A5A8C` | `#E8EEF7` |

### Service tints (for icon tiles only)

| Service | Tile background | Icon color |
|---|---|---|
| Individual return | `#E6F0EC` | `#1E5B47` |
| Self-employed | `#E8EEF7` | `#3A5A8C` |
| Rental property | `#F6EEE3` | `#8A5A1E` |
| Extension / IRS letter | `#F3E9F1` | `#7A3F6E` |
| Bookkeeping consult | `#EFEFEA` | `#4A4A45` |

### Rules

- Marigold never appears on buttons, links or text.
- Evergreen is the only saturated color on a normal screen.
- Text contrast: body text on paper must be at least 4.5:1 (ink and graphite both pass).
- No gradients, no textures, no cream or beige backgrounds.

---

## 3. Typography

One family: **Geist** (open source, Google Fonts). Weights 400, 500, 600. Tabular figures on for all numbers (`font-variant-numeric: tabular-nums`).

### Client side scale

| Role | Size / line-height | Weight | Tracking |
|---|---|---|---|
| Display (hero) | 52 / 56 (mobile 36 / 40) | 600 | -0.03em |
| H1 | 36 / 42 | 600 | -0.025em |
| H2 | 28 / 34 | 600 | -0.02em |
| H3 | 20 / 26 | 600 | -0.01em |
| Body large | 18 / 28 | 400 | 0 |
| Body | 16 / 24 | 400 | 0 |
| Small | 14 / 20 | 400 | 0 |
| Caption | 12 / 16 | 500 | 0 |

### Owner app scale (compact)

| Role | Size / line-height | Weight |
|---|---|---|
| Page title | 22 / 28 | 600 |
| Section title | 16 / 22 | 600 |
| UI text | 14 / 20 | 400 |
| Controls and nav | 13 / 18 | 500 |
| Meta | 12 / 16 | 400 |

### Rules

- Sentence case everywhere. No all-caps labels.
- No italic or colored single-word emphasis in headlines.
- No labels above headings unless they carry real information.
- Line length under 72 characters for body copy.
- Do not append arrows to button text. Use an icon only where it means "goes somewhere else" (external link).

---

## 4. Spacing, radius, elevation

### Spacing

4px base. Allowed steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96.
- Panel inner padding: 24 (client), 20 (owner).
- Gap between panels: 12 (owner shell), 16 (client).
- Section spacing on the client homepage: 96 desktop, 64 mobile.

### Radius (hierarchy, not one value for everything)

| Element | Radius |
|---|---|
| Shell panels | 20px |
| Cards inside panels | 14px |
| Inputs, buttons, nav items | 10px (owner 8px) |
| Chips, segmented control, command bar, Ready ring track | full |
| Thumbnails and document previews | 10px |

### Elevation

The shell is mostly flat. Depth comes from the canvas/paper contrast, not shadows.

| Level | Value | Use |
|---|---|---|
| 0 | none | Panels on canvas |
| 1 | `0 1px 2px rgba(20,20,15,0.05)` | Cards inside panels, inputs |
| 2 | `0 8px 24px rgba(20,20,15,0.08)` | Popovers, dropdowns, command palette |
| 3 | `0 16px 48px rgba(20,20,15,0.14)` | Modals, sheets, sticky mobile bars |

---

## 5. Layout

### Client side: "canvas and panels"

The whole site sits on `canvas`. Content lives in large white panels with 20px radius and 12–16px margin from the viewport edge, so the page reads as one calm workspace, not a stack of sections.

```
+--------------------------------------------------------------+
| canvas                                                       |
|  +--------------------------------------------------------+  |
|  | top bar: wordmark      Services  About  Reviews   Book |  |
|  +--------------------------------------------------------+  |
|  +--------------------------------------------------------+  |
|  |           Taxes, done once. Booked in two minutes.     |  |
|  |   [ What do you need help with?          | Find a time ]| |
|  |   [tile] [tile] [tile] [tile] [tile]   service tiles   |  |
|  |   Next opening Thu 10:30, 6 slots left before Oct 15   |  |
|  +--------------------------------------------------------+  |
|  +-------------------------+  +---------------------------+  |
|  | Build your checklist    |  |  Ready ring demo          |  |
|  | situation chips         |  |  documents landing        |  |
|  +-------------------------+  +---------------------------+  |
+--------------------------------------------------------------+
```

- Hero is centered (like a search home), everything below is left-aligned.
- Max content width 1120px inside panels.
- Mobile: panels go edge-to-edge with 8px outer margin and 16px radius.

### Booking flow: "workspace with a live side panel"

```
+--------------------------------------------------------------+
| canvas                                                       |
|  +------------------------------------+  +-----------------+ |
|  | stepper (4 steps)             [x]  |  | Your checklist  | |
|  |                                    |  | Ready ring  0%  | |
|  |  One question per step             |  | doc card        | |
|  |                                    |  | doc card        | |
|  |                                    |  | doc card        | |
|  |  [Back]                [Continue]  |  | Summary         | |
|  +------------------------------------+  +-----------------+ |
+--------------------------------------------------------------+
```

- Left panel flexible, right panel 340px, sticky.
- The right panel is visible on every step, including details.
- Mobile: right panel becomes a bottom bar "Your checklist (4)" that opens a sheet.

### Owner app: "pro tool shell"

```
+-----------+--------------------------------------------------+
| sidebar   |  top bar: breadcrumb   [ Search or jump  ⌘K ]   |
| (canvas)  +--------------------------------------------------+
|           |  +--------------------------------------------+  |
| Priya     |  | page panel (paper, 20px radius)            |  |
| + New     |  |  title            segmented filter  action |  |
|           |  |                                            |  |
| Today     |  |  content                                   |  |
| Calendar  |  |                                            |  |
| Clients   |  +--------------------------------------------+  |
| Needs you |                                                  |
| Outbox    |                                                  |
| Insights  |                                                  |
| --------  |                                                  |
| Settings  |                                                  |
| Test ctrl |                                                  |
+-----------+--------------------------------------------------+
```

- Sidebar 232px, sits directly on canvas (no panel), collapsible to 64px icon rail.
- Main content is one paper panel with 12px margin to the canvas.
- Pages with sub-navigation use a second, narrower panel (220px) inside the main area.
- Mobile: sidebar becomes a bottom tab bar with 5 items (Today, Calendar, Needs you, Clients, More).

---

## 6. Components

### Buttons

| Variant | Style | Use |
|---|---|---|
| Primary | evergreen fill, white text, 600 weight | One per screen: Book, Continue, Confirm |
| Dark neutral | ink fill, white text | Owner app actions: New, Add, Save |
| Neutral | control fill, ink text | Secondary actions |
| Ghost | transparent, ink text, hover tint | Tertiary, toolbars |
| Danger | danger text on white, danger fill on confirm | Cancel appointment, delete |

Heights: client 48px (mobile 52px), owner 32px. Padding 16–20px. Icon + label gap 8px. Disabled state keeps readable contrast (control fill, muted text), never a faded primary.

### Command bar (client hero and owner top bar)

Full-radius field on paper, 1px line border, level 1 shadow. Leading search icon, placeholder in muted. Client version has an evergreen "Find a time" button inside the right end. Owner version shows a `⌘K` hint and opens a command palette (level 2).

### Service tiles

Square 56px icon tile with service tint, label below (14px, 500). Hover: tile darkens slightly. Selected: 2px evergreen ring around the tile. Used on the homepage and step 1 of booking.

### Situation chips

Full-radius, 36px height, control fill. Selected: evergreen-tint fill, evergreen text, check icon. Wrap on desktop, horizontal scroll on mobile.

### Segmented control

Control track, full radius, 4px inset. Selected segment is paper with level 1 shadow. Used for In person / Video, All / Upcoming / Past, week / month.

### Stepper

Four steps in a single row: small circle + label. Done: evergreen filled circle with check. Current: ink outline circle, 600 label. Upcoming: line outline, muted label. Connector lines 1px, evergreen when completed. This is the only progress indicator in the flow.

### Date strip and time slots

- Date strip: horizontal scroll of day pills (weekday, date). Selected: ink fill, white text. Full days: muted with "Full" caption. Closed days hidden, not shown as disabled.
- Time slots: grouped under Morning / Afternoon / Evening, 30-minute starts, max 8 visible per day. Slot button 44px, neutral fill. Selected: evergreen fill. Low availability caption in warning color ("2 left").
- Selecting a time never auto-advances. The Continue button activates.

### Document card

Row card on paper: 36px file icon tile, document name (14px, 500, wraps), one-line hint (12px, graphite), status on the right.
- Missing: empty circle, "Upload" ghost button.
- Uploaded: success check, file name and size, "Replace" link.
- Not applicable: muted text, reason shown.
Drag over state: dashed evergreen border and evergreen-tint fill.

### Ready ring (signature element)

- Sizes: 40px (lists), 72px (cards), 128px (hero and confirmation).
- Track: control color. Fill: marigold, round caps. At 100%: fill turns evergreen and a check replaces the number.
- Center: percentage in tabular figures, 600 weight.
- Animation: fill animates from previous to new value in 600ms ease-out, only when the value changes.

### Appointment card (owner)

Paper card, 14px radius. Left: time (tabular, 600) and duration. Middle: client name, service, meeting type icon, missing documents as small chips. Right: Ready ring 40px and a kebab menu. Readiness shown by ring, not by card color.

### Tables (clients, outbox)

Rows 44px, 13px text, hover tint, no zebra stripes, 1px line between rows. Sticky header in muted 12px. Row click opens a side drawer (level 3), not a new page.

### Badges

Full radius, 20px height, 12px 500 text, tint background with matching text color. Examples: Ready, Missing 3, Unconfirmed, Paid, Unpaid.

### Empty states

Centered in the panel: 32px line icon in graphite, one-line title (16px, 600), one sentence that says what to do, one action button when there is one. Example: "Nothing needs you right now. Reminders and reschedules are running on their own."

### Toasts

Bottom center, ink fill, white text, 10px radius, level 3. Name the action in past tense ("Reminder sent", "Appointment moved"). Optional "Undo".

### Modals and sheets

Desktop: centered modal, max 520px, 20px radius, level 3, dimmed canvas (rgba(20,20,15,0.32)). Mobile: bottom sheet with drag handle, 20px top radius.

### Phone preview (demo)

Owner-side drawer showing messages as the client sees them: SMS bubbles (control fill incoming style) and email previews (paper card with subject line). New messages slide in from the bottom.

---

## 7. Motion

- Durations: 120ms (hover, press), 200ms (popovers, segments), 300ms (sheets, modals), 600ms (Ready ring fill).
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` for enter, `ease-in` 150ms for exit.
- Only one orchestrated moment: the confirmation screen, where the Ready ring draws in and the checklist cards appear one after another (60ms stagger).
- No scroll-triggered fades on sections. Content is visible on load.
- Step changes in booking: 150ms cross-fade, no slide, no delay.
- Respect `prefers-reduced-motion`: remove all non-essential motion, keep instant state changes.

---

## 8. Iconography and imagery

- Icons: Lucide, 1.5px stroke, 16px (owner) and 20px (client). Always paired with a label in navigation.
- Photography: bright, natural light, real-looking. Priya's portrait, her office, hands with documents, a laptop on a desk. No stock handshakes, no illustrations, no text inside images.
- Images always have 10–14px radius and sit inside panels.

---

## 9. Content and voice

- Plain, warm, direct. Second person.
- Buttons say exactly what happens: "Book this time", "Upload document", "Move appointment", "Send reminder".
- The same action keeps the same name through the flow and in the toast.
- Errors say what happened and how to fix it: "That time was just taken. Here are the three closest times."
- Avoid: "·" chains in meta text (use commas or separate lines), arrows in button text, marketing adjectives.

---

## 10. Page patterns

| Page | Pattern |
|---|---|
| Home | Centered hero panel with command bar and service tiles, live next-opening line, checklist builder panel with situation chips and Ready ring, how-it-works as a real sequence (3 steps), Priya panel with portrait and stats, reviews, privacy, FAQ, footer panel |
| Booking | Workspace layout with sticky checklist panel, stepper, one question per step |
| You're booked | The orchestrated motion moment: 128px Ready ring, summary card, calendar buttons, checklist with upload |
| Client portal | Summary panel with Ready ring and actions (I'll be there, Move, Cancel), checklist panel, history panel, Review sign and pay panel when due |
| Find my appointment | Single centered panel, email field, neutral confirmation text |
| Owner: Today | Greeting line, three counts (Appointments, Ready, Needs you), appointment cards in time order |
| Owner: Calendar | Week grid inside the panel, segmented week/month, cards colored by service tint, ring on each card |
| Owner: Clients | Table plus side drawer with documents, messages, history |
| Owner: Needs you | List of exception cards, each with one clear action; strong empty state |
| Owner: Outbox | Table with message type badge, recipient, time, minutes saved |
| Owner: Insights | One large number (hours given back), then 4–6 small metric cards with sparklines in evergreen and marigold |
| Owner: Settings | Sub-navigation panel plus form panel |

---

## 11. Accessibility

- Visible focus on every interactive element: 2px evergreen outline with 2px offset.
- Tap targets at least 44px on client side.
- Status never communicated by color alone (icon + text).
- All form fields have visible labels.
- Keyboard: full booking flow and owner command palette usable without a mouse.

---

## 12. Do and don't

| Do | Don't |
|---|---|
| Grey canvas with white panels | Cream, beige or textured backgrounds |
| One family (Geist), hierarchy by size and weight | Serif display fonts, italic accents |
| Evergreen for actions, marigold for readiness only | Extra accent colors, gradients |
| Different radius per level | One radius on everything |
| Content visible on load | Scroll-triggered fade-ins on every section |
| Group time slots, max 8 per day | Walls of 30+ time buttons |
| Real portrait and photos | Initials placeholders ("PP") |
| Sentence case, plain labels | ALL-CAPS eyebrows, "·" chains, "→" in buttons |

---

## 13. Implementation tokens

### CSS variables

```css
:root {
  --canvas: #F3F3F1;
  --paper: #FFFFFF;
  --ink: #1A1A1A;
  --graphite: #5F5F5B;
  --muted: #8E8E89;
  --line: #E8E8E5;
  --control: #EDEDEB;
  --hover: rgba(90, 90, 85, 0.08);
  --selected: rgba(90, 90, 85, 0.14);
  --evergreen: #1E5B47;
  --evergreen-hover: #174A39;
  --evergreen-tint: #E6F0EC;
  --marigold: #F0A534;
  --success: #2F7D5B;  --success-tint: #E7F3EC;
  --warning: #B86E12;  --warning-tint: #FBF0DF;
  --danger:  #C2412D;  --danger-tint:  #FBE9E6;
  --info:    #3A5A8C;  --info-tint:    #E8EEF7;

  --radius-panel: 20px;
  --radius-card: 14px;
  --radius-control: 10px;
  --radius-control-owner: 8px;

  --shadow-1: 0 1px 2px rgba(20, 20, 15, 0.05);
  --shadow-2: 0 8px 24px rgba(20, 20, 15, 0.08);
  --shadow-3: 0 16px 48px rgba(20, 20, 15, 0.14);

  --ease-enter: cubic-bezier(0.2, 0.8, 0.2, 1);
  --font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

body {
  background: var(--canvas);
  color: var(--ink);
  font-family: var(--font-sans);
  font-feature-settings: "tnum" 1;
}
```

### Tailwind theme extension

```js
theme: {
  extend: {
    colors: {
      canvas: "var(--canvas)", paper: "var(--paper)", ink: "var(--ink)",
      graphite: "var(--graphite)", muted: "var(--muted)", line: "var(--line)",
      control: "var(--control)", evergreen: { DEFAULT: "var(--evergreen)", hover: "var(--evergreen-hover)", tint: "var(--evergreen-tint)" },
      marigold: "var(--marigold)",
    },
    borderRadius: { panel: "20px", card: "14px", control: "10px" },
    boxShadow: { 1: "var(--shadow-1)", 2: "var(--shadow-2)", 3: "var(--shadow-3)" },
    fontFamily: { sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"] },
  },
}
```

Font loading (index.html):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
```
