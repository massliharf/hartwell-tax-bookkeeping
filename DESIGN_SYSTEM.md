# DESIGN_SYSTEM.md — "Studio Shell"

Faithful extraction of a modern pro-tool web app shell, measured from live computed styles.
Only brand-specific items are swapped (see section 0). Everything else is exact.

---

## 0. Brand swap (the ONLY deviations)

| Original element | Use instead |
|---|---|
| Logo | Hartwell Tax wordmark (Geist 600) |
| Brand accent pink #FF57AE | Hartwell blue #2F54EB, in the same usage slots: Create button, upgrade/primary text link, count badges, accent badges at 15% alpha, active display-tab underline |
| Display font "Klarheit" (commercial license) | "Figtree" 500 (Google Fonts), same sizes and tracking |
| Category icon hues | Keep the method (icon color + the same color at 10% alpha as tile background) with our service colors |

---

## 1. Fonts

- **UI font:** Geist (400 / 500 / 600 / 700). Default body 16/24, color #0D0D0D.
- **Display font** (swap: Figtree 500): only for the greeting h1, big page tabs and content-card titles.

| Use | Font | Size / line-height | Weight | Tracking | Color |
|---|---|---|---|---|---|
| Home greeting h1 | Display | 28/42 (mobile 24/36) | 500 | 0 | #1A1A1A |
| Big page tabs | Display | 28/38.5 | 400 | -0.28px | #1A1A1A, inactive opacity 0.2 |
| Content card title | Display | 20/30 | 500 | -0.2px | #1A1A1A |
| Content card text | Display | 16/24 | 400 | 0 | #363636 |
| Section heading (h2) | Geist | 20/30 | 500 | 0 | #1A1A1A |
| Page title in panels | Geist | 18/26 | 400 | 0 | #1A1A1A |
| Command/search text, palette items | Geist | 15/24 | 400 | 0 | #424242 (placeholder #616161) |
| Category tile label | Geist | 15/24 | 500 | 0 | #1A1A1A |
| Body small, modal item title | Geist | 14/22.75 | 400 | 0 | #363636 |
| Buttons, nav, sub-nav, tabs | Geist | 12/18 | 500 | 0 | #1A1A1A |
| Descriptions, meta, nav labels | Geist | 12/18 | 400 | 0 | #616161 / #363636 |
| Segmented control items | Geist | 12/18 | 600 | 0 | active #1A1A1A, inactive #616161 |
| Micro labels, badges | Geist | 10/16 | 500 | 0.2px | per badge |
| Form section labels | Geist | 10/24 | 600 | 0 | #616161, uppercase |
| Palette section header | Geist | 14/22.75 | 400 | 0 | #616161, uppercase |
| Mobile tab bar labels | Geist | 10/15 | 400 | 0 | #737373 |
| Count badge number | Geist | 8/8 | 700 | 0 | #FFFFFF |

---

## 2. Colors

### Neutrals

| Token | Value | Use |
|---|---|---|
| canvas | #F5F5F5 | App background behind all panels |
| panel | #FFFFFF | Sidebar, sub-panel, main panels, cards, menus, modals |
| surface | #FAFAFA | Home content panel background, mobile page background |
| surface-2 | #FCFCFC | Grouped rows, sticky toolbars, mobile tab bar |
| fill-neutral | #EDEDED | Neutral buttons, segmented track, image cards background |
| fill-indicator | #DBDBDB | Segmented active indicator |
| fill-disabled | #E3E3E3 | Disabled large button (text #616161) |
| fill-subtle | rgba(115,115,115,0.05) | Secondary buttons, tags, hover |
| fill-selected | rgba(115,115,115,0.15) | Active nav item, toggled buttons |
| dark | #1A1A1A | Primary dark buttons, dark chips |
| dark-card | #2B2B2B | Dark media cards |
| skeleton | #F0F0F0 | Loading blocks |

### Text

| Token | Value |
|---|---|
| text-primary | #1A1A1A |
| text-nav | #363636 |
| text-item | #424242 |
| text-secondary | #616161 |
| text-tertiary | #737373 |

### Borders

| Token | Value | Use |
|---|---|---|
| border-faint | rgba(16,16,16,0.05) | Modals |
| border | rgba(16,16,16,0.1) | Cards, menus, inputs, command bar, tags, dividers |
| border-input | rgba(16,16,16,0.15) | Inputs inside modals |
| border-strong | rgba(16,16,16,0.2) | Strong outlines |

### Overlays

| Use | Value |
|---|---|
| Command palette | rgba(26,26,26,0.8) + backdrop blur 4px |
| Modals | rgba(0,0,0,0.4) |

### Accent and states

| Token | Value | Use |
|---|---|---|
| accent (swapped) | #2F54EB | Create button, text links, count badges, active display-tab underline |
| accent-tint | accent at 15% alpha | Accent badges, "New" pills |
| focus | #4F69F2 | Toggle switches, focused input border |

### Category tiles

Icon color at 100%, tile background = the same color at 10% alpha.
Examples: rgb(133,102,220) on rgba(133,102,220,0.1); rgb(79,105,242) on rgba(79,105,242,0.1).

---

## 3. Radius

| Value | Where |
|---|---|
| 16px | All panels (sidebar, sub-panel, main), cards, dropdown menus, modals, command bar, tile links, mobile tab bar (top corners only) |
| 12px | Context header card in forms |
| 10px | Mobile icon buttons |
| 8px | Buttons, nav items, icon tiles, menu items, inputs, text box, image cards, segmented track |
| 6px | Segmented active indicator |
| 4px | Metadata tags, accent badges |
| 3px | Project color squares |
| 9999px | Pill tabs, chips, avatar, filter chips, "New" pill |

---

## 4. Elevation

- **Panels and cards: no shadow.** Depth comes from the canvas (#F5F5F5) against white panels.
- **Dropdowns, popovers, coach marks:** 1px border rgba(16,16,16,0.1) plus this layered shadow:

```css
box-shadow:
  0 0 2px rgba(18,18,18,.08),
  0 2px 4px rgba(18,18,18,.08),
  0 6px 6px rgba(18,18,18,.04),
  0 14px 9px rgba(18,18,18,.02),
  0 25px 10px rgba(18,18,18,.02);
```

- **Modals:** 1px border rgba(16,16,16,0.05), overlay behind.

---

## 5. Motion

| What | Value |
|---|---|
| Hover color / background / border | 150ms cubic-bezier(0.4,0,0.2,1) |
| General state change | all 200ms cubic-bezier(0.4,0,0.2,1) |
| Press / scale | transform 150ms cubic-bezier(0.4,0,0.2,1) |
| Carousels, sliding panels | transform 500ms cubic-bezier(0,0,0.2,1) |
| Fade in | opacity 200ms cubic-bezier(0,0,0.2,1) |
| Sidebar collapse / expand | padding + gap 200ms cubic-bezier(0.4,0,0.2,1) |
| Segmented control, pill tabs | Active indicator slides between items |
| Menus | Open from their trigger (the Create menu slides out next to the sidebar) |
| Command bar placeholder | Rotating typewriter text between hints |
| Loading | Skeleton blocks in #F0F0F0 matching the final layout (cards, chips, toolbar) |
| prefers-reduced-motion | Respected: remove non-essential motion |

---

## 6. App shell (desktop, 640px and up)

### Root

Canvas #F5F5F5 with 8px padding on all sides.

### Sidebar (left panel)

- White, radius 16, full height.
- **Expanded:** 224px wide, padding 16px 20px, vertical gap 16.
- **Collapsed:** 72px icon rail. The collapse toggle sits right of the logo; the state is remembered per user.
- **Collapsed tooltips:** on hover, placed to the right; light grey surface, 14px text, small shadow, arrow.
- **Order, top to bottom:**
  1. Logo row with collapse toggle
  2. Create button
  3. Primary nav
  4. 1px divider rgba(16,16,16,0.1)
  5. Tools nav
  6. Flexible space
  7. Optional promo card
  8. Footer row of icon buttons (connections, learn, notifications with count badge, settings, more)
- **Create button:** 32×32 accent square (radius 8, white plus icon) + label "Create" 12/500.
- **Nav item:** 184×32, radius 8, 32×32 icon box with a 14px icon, gap 10, label 12/400 #363636. Pitch 36px (4px gap). Active: fill-selected. Hover: fill-subtle.

### Content column

- 8px gap between sidebar and content.
- **Header (60px, transparent, padding 0 16):**
  - Left: breadcrumb, 12/400 #616161 with "›" separators; the current page in #1A1A1A.
  - Right: accent text link 14/600, neutral 32h button with icon, 32×32 icon buttons, 32px avatar with colored ring.
- Panels start directly below the header (y = 68).

### Two-level pages

- Secondary panel: 256px, white, radius 16, padding 20px 10px, gap 2.
- 4px gap, then the main panel: white, radius 16, padding 16px 24px.
- **Secondary nav item:** 32h, padding 4px 16px, radius 8, 14px icon + label 12/500, active fill-selected.
- **Section label inside:** 12px uppercase #616161, padding 6px 16px, with optional trailing icon buttons (search, +).

### Main panel header row (32h)

- Title on the left (18/400).
- Actions on the right, in this order: dark primary "+ Add/Create", icon buttons, segmented control or neutral toggle buttons (Layout, Filters), search icon.
- Active filters appear below as pill chips with an avatar and ×.

---

## 7. Components

### Buttons

Base: height 32, radius 8, padding 0 16, 12/500, 14px icon with 8px gap.

| Variant | Style |
|---|---|
| Primary dark | bg #1A1A1A, white text |
| Neutral | bg #EDEDED, text #1A1A1A |
| Secondary subtle | bg rgba(115,115,115,0.05) |
| Toggled / active | bg rgba(115,115,115,0.15) |
| Ghost | Transparent; "See all ›" style with trailing chevron |
| Icon button | 32×32, radius 8 |
| Accent text link | 14/600 accent color, no background |
| Large action (forms, tools) | Full width, 40h, radius 8, 14/400, trailing icon; disabled bg #E3E3E3 with text #616161 |
| Mobile icon buttons | 40×40, radius 10, same fills |

### Command bar

- Max width 768, height 50, white, radius 16, 1px border rgba(16,16,16,0.1), inner padding 6px 16px, gap 8.
- Leading 16px search icon, placeholder 15/400 #616161, trailing "⌘ K" hint 12px.
- Clicking it or pressing ⌘K opens the **command palette** in the same position:
  - 768 wide, radius 16, 1px border, overlay rgba(26,26,26,0.8) + blur 4px.
  - Search row on top with trailing icon buttons.
  - Grouped list below, each group with an uppercase 14px header in #616161.
  - Items 40h, radius 8: 28px tinted icon tile + 15/400 label + right-aligned shortcut hints. The highlighted item gets fill-selected.
  - Footer hint bar: "↑↓ Navigate", "↵ Select", "Esc Close".

### Category tiles

- Link 104×124, radius 16, padding 20px 0, gap 12, centered.
- Icon tile 48×48, radius 8, tinted background, 20px icon.
- Label 15/500.
- Selected or current tile: grey tile (#E3E3E3).

### Info bar

- White card, radius 16, height 54, padding 12px 18px, gap 16.
- Title on the left (14/400).
- Inline links on the right, separated by 1px vertical dividers; each has icon + label + ↗, optional "New" pill.
- Close × at the end.
- Mobile: wraps and centers.

### Cards

- **Content card on surface:** white, radius 16, padding 16px 28px, no shadow.
- **Image / use-case card:** bg #EDEDED, radius 8, padding 16; text on the left, media on the right (media radius 8, play button overlay).
- **Media card (dark):** full-bleed image, radius 16. Top-left label chip (12px white on dark translucent), title in display 20/500 white, white pill button.
- **Carousel:** horizontal row, pagination dots (the active dot is a longer dark pill) plus prev/next 32px round arrow buttons.
- **Grouped row block:** bg #FCFCFC, bottom radius 16, padding 0 12px 12px. Header line with 12px text, metadata tags, checkbox and timestamp (12/400 #424242).

### Lists and badges

- **Project row:** 28h. 12px colored square (radius 3) + 14px label + trailing lock/share icon or badge.
- **Accent badge:** accent at 15% background, accent text 10/500, tracking 0.2px, uppercase, radius 4.
- **"New" pill:** accent tint background, accent text 10/500, radius 9999.
- **Metadata tag:** 24h, radius 4, 1px border rgba(16,16,16,0.1), bg rgba(115,115,115,0.05), 12/400.
- **Count badge:** accent circle 14px, white 8/700.

### Tabs

- **Pill tabs:** 32h, radius 9999, padding 0 16, 12/500. Inactive text #616161. Active text #1A1A1A on a grey pill that slides.
- **Display tabs (page-level):** display font 28/400. Inactive opacity 0.2; active opacity 1 with a 2px accent underline. A description line sits below (14–16px #616161).
- **Segmented control:** track #EDEDED, radius 8, padding 4, gap 4, height 32. Items 24h, padding 6px 16px, 12/600. Active indicator #DBDBDB, radius 6, sliding.

### Menus and modals

- **Dropdown menu:**
  - 224 wide, white, radius 16, padding 8px 0, 1px border + layered shadow.
  - Items 32h, radius 8, padding 6px 8px 6px 4px, gap 10; 14px tinted icon + 12/400 label.
  - Groups separated by a 1px divider; secondary actions (+ New …) at the bottom.
- **Large picker modal:**
  - 1024 wide, white, radius 16, padding 24, 1px border rgba(16,16,16,0.05), overlay rgba(0,0,0,0.4).
  - Header row: pill tabs on the left, search input on the right (240×32, radius 8, 1px border rgba(16,16,16,0.15)).
  - Body: uppercase group label, then a 3-column grid of items. Each item: button radius 8, padding 6; 40×40 tinted icon tile (radius 8); title 14/400 #363636; description 12/400 #616161. Optional pin icon on hover.
- **Coach mark popover:** about 250 wide, white, radius 16, border + layered shadow, image area, 12px text, dark button bottom-right, close ×.

### Forms (control panel)

- **Panel column:** about 288px content width inside a white panel.
- **Top:** pill tabs row with a horizontal scroll arrow.
- **Context header card:**
  - bg #F5F5F5 (or category tint), radius 12, padding 8px 8px 8px 12px.
  - Back link "‹ Parent" 12px; title 14/500 with help icon.
  - Square secondary button on the right (icon + 10px label).
- **Section label:** 10/600 uppercase #616161, then the control.
- **Text box:**
  - Radius 8, 1px border rgba(16,16,16,0.1), padding 12px 12px 0, text 14/400.
  - Focus: border #4F69F2.
  - Footer row inside the box: blue toggle switch + 12px label, icon actions on the right.
- **Number stepper:** "– 4 +" in a neutral 32h control.
- **Select chips:** icon + value, 32h.
- **Primary action:** full-width 40h button at the end of the form.
- **Results area:**
  - White panel, radius 16, padding 0 16 24.
  - Sticky toolbar on #FCFCFC with top radius 16, padding 12.
  - Responsive card grid (4 columns on desktop).

### Empty state

Centered in the panel:
- 24px line icon, #616161
- Title 20/500, #424242
- Description 14/400 #616161, centered, max width about 600px
- Optional single button

---

## 8. Page templates

**A. Dashboard home**
- Content panel on #FAFAFA, inner padding 48px 24px, max width 1280 centered, 48px gap between sections.
- Order:
  1. Greeting h1 (display font)
  2. Command bar
  3. Category tiles row
  4. Info bar
  5. Two-column row: list card (302px) + large card with empty state
  6. Centered "My work ›" link
  7. Pill tabs + carousel with "Explore all ›"

**B. Two-level library**
- Sidebar + 256px secondary panel + main panel.
- Header row with title and actions, filter chips, then content (list, grid or empty state).

**C. Discover / browse**
- Display tabs + description.
- Sections, each with an h2 (20/500) + "See all ›" + arrows, then a horizontal card row.

**D. Tool workspace**
- Left control panel (form pattern) + right results panel.

**E. Marketing-style catalog (inside the shell)**
- Header with a wide search.
- Hero banner: image collages left and right, centered title.
- 4-column category cards (thumbnail + label).
- Curated sections, each with an "Explore …" neutral button.

---

## 9. Responsive

### 640px and up (tested 700–1920)

- Full shell: sidebar 224 expanded by default, collapsible to a 72 rail.
- Panels on an 8px canvas.

### Below 640px (tested 390–600)

- Sidebar removed.
- **Top bar (60h):** logo left, breadcrumb centered on inner pages, avatar right.
- **Page:** bg #FAFAFA, content padding 40px 24px. Inner pages use one white panel with top radius 16.
- **Page header:** 32×32 grey back button (‹) + title 20–22px + icon-only actions (dark +, neutral filter, search).
- **Secondary navigation** becomes back navigation.
- **Content:** h1 24px, category tiles wrap into rows, info bar wraps and centers.
- **Bottom tab bar (fixed):** 63h, #FCFCFC, top radius 16, padding 12px 20px, 5 items (20px icon + 10px label #737373).

---

## 10. Rules for applying this system to our product

1. Do not add, remove or reorder features, sections, steps or fields. Keep every existing flow exactly as it is.
2. For each existing screen, pick the closest template from section 8 and the matching components from section 7. If a needed component doesn't exist here, build it from the same tokens (sizes, radius, fills, type).
3. Owner app → Template B shell: sidebar + panels, tabs, segmented controls, tables as grouped rows, command palette on ⌘K.
4. Booking flow → Template D logic: left panel holds the current step's form; right panel is the live checklist (the "results area").
5. Public pages keep their current sections and copy; only the visual layer changes to these tokens and components.
6. Change only the UI layer. Never touch the database schema, server functions, routes, automations or email logic.

---

## 11. Implementation tokens

```css
:root {
  --canvas: #F5F5F5;
  --panel: #FFFFFF;
  --surface: #FAFAFA;
  --surface-2: #FCFCFC;
  --fill-neutral: #EDEDED;
  --fill-indicator: #DBDBDB;
  --fill-disabled: #E3E3E3;
  --fill-subtle: rgba(115,115,115,0.05);
  --fill-selected: rgba(115,115,115,0.15);
  --dark: #1A1A1A;
  --dark-card: #2B2B2B;
  --skeleton: #F0F0F0;

  --text-primary: #1A1A1A;
  --text-nav: #363636;
  --text-item: #424242;
  --text-secondary: #616161;
  --text-tertiary: #737373;

  --border-faint: rgba(16,16,16,0.05);
  --border: rgba(16,16,16,0.1);
  --border-input: rgba(16,16,16,0.15);
  --border-strong: rgba(16,16,16,0.2);

  --accent: #2F54EB;
  --accent-tint: rgba(30,91,71,0.15);
  --focus: #4F69F2;

  --radius-panel: 16px;
  --radius-context: 12px;
  --radius-control: 8px;
  --radius-indicator: 6px;
  --radius-tag: 4px;

  --shadow-pop: 0 0 2px rgba(18,18,18,.08), 0 2px 4px rgba(18,18,18,.08),
                0 6px 6px rgba(18,18,18,.04), 0 14px 9px rgba(18,18,18,.02),
                0 25px 10px rgba(18,18,18,.02);

  --ease-standard: cubic-bezier(0.4,0,0.2,1);
  --ease-out: cubic-bezier(0,0,0.2,1);

  --font-ui: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-display: "Figtree", "Geist", ui-sans-serif, system-ui, sans-serif;
}

body {
  background: var(--canvas);
  color: #0D0D0D;
  font-family: var(--font-ui);
  font-size: 16px;
  line-height: 24px;
}
```

Font loading (index.html):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Figtree:wght@400;500&display=swap" rel="stylesheet">
```
