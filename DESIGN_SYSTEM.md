# DESIGN_SYSTEM v2 — "Studio Shell", re-extracted from magnific.com

Source: live extraction on 30 Sep 2026 from the full stylesheet (app-initial.css, 757 KB: 239 theme tokens, 40 keyframes,
all easing/shadow/type/radius utilities) plus DOM measurement of 16 pages at 1568px:
App: /app, /app/explore, /app/projects/work, /app/library/characters, /app/spaces, /app/ai-image-generator,
/app/ai-video-generator, /app/voiceover-generator, /app/tools/image, /app/tools/designer, /user/organization/api-keys, /academy, /pricing
Marketing: /desktop, /api (+ mega menu, footer)
Overlays opened live: popover (Layout/Filters), modal (Upgrade), mega menu.

What changed vs v1 (v1 was built from 7 pages and guessed several things):
- Magnific's primary color is BLUE #4f69f2 (hover #344ce7, pressed #2236d2). Dark #1a1a1a is "secondary". Pink #ff58ae is "emphasis"
  (Create button, Upgrade link, notification counts), not the main accent.
- Fonts: UI = Geist; headings/display = Klarheit (500 in app, 600–700 on marketing). Our substitute for Klarheit: Figtree 500/600.
- Motion is a real system (staggered entrances, expo-out easing, blur-in hero), not just 150ms hovers.
- Modal overlay is LIGHT (rgba(229,231,235,.7)), not dark.
- Every interactive fill has 3 steps: rest / hover / pressed (…-0 / …-1 / …-2).

------------------------------------------------------------------------------------------------------------------------
## 1. Color tokens (use these names; values are Magnific's, brand swap in §1.9)

### 1.1 Surfaces
surface-0 #ffffff (panels, cards) · surface-1 #f5f5f5 (app canvas) · surface-2 #ececec (selected nav, skeleton) · surface-3 #e3e3e3 · surface-4 #dbdbdb
panel-2 #fafafa (settings panel) · panel-4 #ffffff (main panel) · panel-6 #fcfcfc (popovers) · surface-modal #ffffff

### 1.2 Text
fg-0 #1a1a1a (primary) · fg-1 #353535 · fg-2 #424242 (body on marketing) · fg-3 #616161 (secondary) · fg-4 #737373 (placeholder, meta)

### 1.3 Borders
alpha-0 #1010100d (card/modal hairline, 5%) · alpha-1 #1010101a (dividers, 10%) · alpha-2 #10101033 (outline buttons, 20%)
solid-10 #1a1a1a (selected/checked) · accent-alpha #4f69f24d (focus/selected accent)

### 1.4 Button fills (0 rest / 1 hover / 2 pressed)
primary   #4f69f2 / #344ce7 / #2236d2, text #fafafa
secondary #1a1a1a / #424242 / #616161, text #ffffff
default   #7373730d / #7373731a / #73737326, text #1a1a1a   (neutral tinted: chips, filters, toolbar)
ghost     transparent / #7373731a / #73737326, text #1a1a1a (nav items, icon buttons)
outline   transparent / #1010101a / #7373731a, border #10101033 → #1010104d → #10101080
emphasis  #ff58ae / #ff389f / #ff1a90 (Create, counters), soft #ff58ae26
premium   #feb602 / #f4980a / #ea7e11 (gold)
destructive bg #f9c7be, text #f66950, strong text #8c1b07
blurred   #ffffff40 / 59 / 66 + backdrop-blur (chips over images)

### 1.5 Forms
field bg #ffffff · border #10101026 · focus/active #90abfa · error #f66950 · success #17cb8d · warning #e7ad16 · placeholder #737373

### 1.6 Alerts / status (soft bg + icon color)
success #e7f5f0 / #14a372 · information #edf0fd / #4f69f2 · warning #fdf8ea / #e7ad16 · negative #fef0ed / #f66950 · neutral #fafafa / #424242

### 1.7 Category (app) colors — tile bg = color at 10%, icon = color
image #4f69f2 · video #3cd39f · audio #00cdc6 · 3d #b39581 · designer #cc7e80 · spaces #8566dc · stock #101010

### 1.8 Marketing palette (landing pages only)
surface #f4f3ef (warm paper) · primary/ink #2c0000 (oxblood) · #3f0808 · footer bg #0f0f0f-ish (grey-950) · accents pink #ff58ae
Dark marketing pages (API): near-black #0d0d0d background, white text, pink eyebrow labels, hairline dark cards.

### 1.9 Brand swap for Hartwell Tax (the only deviations)
primary #4f69f2 → Hartwell blue #2F54EB (hover #2441C9, pressed #1B33A6) — same role, same 3-step behavior
emphasis pink → keep for tiny "New" dots only; Create/primary actions use primary blue
success stays green #17804F (status only); everything else unchanged.

------------------------------------------------------------------------------------------------------------------------
## 2. Typography
UI font: Geist (400/500/600). Display: Klarheit → substitute Figtree (500 app, 600 marketing).
Scale (rem = 16px): 2xs .62rem · xs .75rem · sm .875rem/1.625 · base 15px · lg 1.125rem/1.5 · xl 1.25rem/1.5
2xl 1.75rem · 3xl 1.75rem/1.375 −0.01em · 4xl 2rem/1.375 · 5xl 2.25rem/1.2 · 6xl 2.75rem/1.2 · 8xl 4rem/1.2
Measured usage:
- App page title (Home greeting): display 28/42 500, fg-0, centered on Home
- Section headings in app: 20px (xl) 500, fg-0 ("Use Cases", "Featured Courses")
- Card titles: 14px 500 (line-clamp 2); meta 12px 500/400 fg-3
- Nav items / buttons: 13–14px; small buttons 12px 500
- Tags/pills: 10–11px 500–600, often UPPERCASE with 0.2px tracking
- Modal headline: display 36/49.5 400, −0.36px
- Marketing hero: display 44–64px 600–700, tight leading (1.1–1.2); section titles 36/43 600 −0.36px
- Marketing reading text: 20–24px, fg-3 grey with a bold fg-0 lead-in sentence ("Folders that sync themselves. Mirror any…")
- Eyebrow label: 11px uppercase pink, above centered section titles

------------------------------------------------------------------------------------------------------------------------
## 3. Shape & elevation
Radius: 4 (rounded) · 6 (md) · 8 (lg: buttons, inputs, nav items, icon buttons) · 12 (2lg: cards, tiles, pricing cards) · 16 (xl/2xl:
panels, popovers, modals, big cards) · 22–24 (marketing feature cards) · full (pills, avatars, counters)
Shadows (layered, faint): xs 0 2px 5px #3749571a · sm/md/lg/xl = 0 0 2px #12121214 + long soft drops at 2–5% (see tokens)
Rules: panels on canvas have NO shadow (hairline border only); popovers/menus use shadow-lg; modals: border + no/soft shadow; floating
chips over media use blur instead of shadow.

------------------------------------------------------------------------------------------------------------------------
## 4. Motion (the system)
Easing: EXPO-OUT cubic-bezier(.16,1,.3,1) = signature for enters, modals, overlays, tiles
        quint-out (.22,1,.36,1) enters · drawer (.32,.72,0,1) · pop (.34,1.56,.64,1) small overshoot · standard (.4,0,.2,1) state changes
Durations: 150ms hover/color (default `transition duration-150 ease-in-out` on every button/link) · 200ms state/width/padding
           300ms layout width (panels collapsing) · 450ms tile enter · 800ms spotlight · 1s hero title
Recipes (measured on /app):
- Page title enter: translateY(50px) scale(.96) opacity 0 → 1, 1s expo-out
- Hero search/spotlight enter: blur(5px) scale(.96) opacity 0 → 1, 0.8s
- Tile/list enter: translateY(12px) opacity 0 → 1, 0.45s expo-out, STAGGER 80ms per item (0, .08, .16, … .48s)
- Grid/list item enter (projects, home lists): translateY(4px) opacity 0 → 1, staggered
- Dropdown/menu: translateY(−2px) + fade (slideDownAndFade); popover/tooltip: scale(.96) translateY(2px) + fade
- Tooltip: 6px → 4px offset + fade in the first 25% of the animation
- Modal: overlay fade .15s expo-out; content fade + scale(.96→1)
- Accordion: height 0 ↔ content height + opacity
- Loading: skeleton-fade (opacity 1 → .6 → 1) on #ececec blocks; shimmer (bg-position −200% → 200%) on text bars
- Hover micro: icon tiles scale(1.1) inside cards (group-hover), hidden row actions fade in (opacity 0 → 1, 150ms)
- Numbers/progress: width transitions 300ms ease-out; progress bars animate width to 100%
- Marketing: scroll-linked sticky index (active item gets a 2px left bar in the accent color), hover colors 150ms; content itself does not animate on scroll
- Always honor prefers-reduced-motion (disable transforms, keep opacity)

------------------------------------------------------------------------------------------------------------------------
## 5. Layout
App: canvas surface-1; sidebar sits on canvas (no card), collapsible (icon rail 48px ↔ 200px, width transition 300ms);
main = white panel (panel-4) radius 16 (rounded-xl) with 16–20px padding, full height; optional secondary column 240px
(tool list, settings sub-nav) inside the panel on panel-2/white; top bar 56–60px with breadcrumb left, actions right.
Content max width on Home ~ 590px (centered hero + search), grids 3–8 columns for media.
Marketing: sticky top nav 60–80px, bg white/95 + backdrop-blur; mega menu = dark panel (#111) radius 16 with columns;
content width 1040–1200px; sections separated by 96–160px; footer dark with 4 link columns and pink column headings.

------------------------------------------------------------------------------------------------------------------------
## 6. Components (measured recipes)
Buttons (all: inline-flex, gap 8px, radius 8, font 500, transition 150ms ease-in-out, disabled opacity .5, focus-visible outline 2px offset 2):
- sm h32 px16 12px · md h40 px16 14px · lg h48 px24 15px · icon 32×32 (ghost) · tiny round 20–24 (row actions)
- Variants: primary (blue), secondary (dark), outline, default (tinted), ghost, emphasis (pink, only "Create"), premium (gold)
- Text link "Upgrade": 14px 600 emphasis color, hover opacity .8
- Arrow buttons on marketing: outline, h32–40, trailing → icon
Nav item (sidebar): h32, radius 8, gap 10px, 13–14px, ghost; selected = ghost-2 fill (#73737326) — i.e. neutral grey, never colored
Segmented control: track surface-2/default-0, items h30 12px 600, selected = white pill with hairline + text fg-0, 200ms
Tabs (Explore): display font 28–32px, selected fg-0 with underline, others fg-4
Chip filters (Academy): h28–32 pills; selected = secondary dark pill with white text; others default tint
Tags/badges: h16–18 px6 rounded-full 10–11px 500–600; "New" = soft blue (#e8edfe / #1e3a8a text) or soft pink; counter = pink
  circle h16 8px bold; over-media chips = blurred white pill with backdrop-blur
Cards: white on canvas, border alpha-0/alpha-1, radius 12–16, padding 16–24; clickable cards change bg to surface-1/2 on hover
  (200ms) and scale their icon tile 1.1; shortcut tiles 124px tall, centered 48px icon tile (radius 8, category color 10%) + 13px label
Pricing card: radius 12, border alpha-1 (current plan: emphasis border), 18px padding, display-font plan name 28px, dark CTA h32
Popover/menu: panel-6 bg, 1px alpha-0 border, radius 16, shadow-lg, width 260, section labels 11px fg-4, items h32 radius 8
Modal: light overlay rgba(229,231,235,.7); card white radius 16, hairline border, up to 1024px; split layout option (illustration left
  on warm tinted bg, content right); close icon 32px top-right; CTA row: primary/secondary h48 + ghost h40
Empty state: centered; 20–24px outline icon in fg-3; title 16–18px 500; one 13px sentence fg-3; small secondary/outline button
Skeletons: surface-2 blocks radius 12, text bars h10–12 radius full, skeleton-fade 2s
Forms: field h32–40, radius 8, white bg, border #10101026, focus border #90abfa (+ 3–4px soft ring), error #f66950 with 12px message
Toggle/checkbox: checked = secondary dark (#1a1a1a) fill
Tooltip: dark #1a1a1a bg, white 12px, radius 6–8, 4px offset, tooltipFadeIn
Toasts: bottom-center stack, white card radius 12 shadow-lg, countdown sheen line
Info bar (Home): white row radius 12, left text 13px, right inline links with ↗ and small logos, close X
Media grid tile: radius 8–12, hover reveals top-right actions (opacity), meta row below 11–12px with tiny avatar

------------------------------------------------------------------------------------------------------------------------
## 7. Page templates
App Home: greeting (display 28) → spotlight search (h40 pill-ish radius 12, ⌘K hint) → 8 shortcut tiles row (staggered enter)
  → info bar → two-column (Projects list card + big empty-state/feature card) → tabbed media rail ("What's new", "Academy"…)
List/Library: breadcrumb + title, filter chips row, grid of cards, "View all ↗" links on section headers
Tool page: left 240px control column (segmented tool switcher, labeled sections 11px caps, primary CTA full width at bottom) +
  right feed (toolbar with default buttons: Layout, Filters) — empty state centered
Settings: sub-nav column with section labels, content card(s) centered max ~720px
Pricing: centered display title + subtitle, billing segmented + "Save 25%" note, 3 plan cards, comparison table
Marketing product page: hero (full-bleed media or dark), centered display headline + subline + 2 buttons (white pill + text link),
  big framed product shot (radius 16–22, deep shadow, gradient bg), sticky-index feature section, sticky bottom CTA bar
  (frosted white pill with dark button), dark footer

------------------------------------------------------------------------------------------------------------------------
## 8. Mapping to Hartwell Tax (so nothing is guessed)
Owner app = App Home/List/Tool/Settings templates. Today = App Home (greeting enter, stat tiles as shortcut tiles with stagger,
  Needs-you as info-bar-style rows). Calendar/Clients = List template. Appointment modal = Modal. Document review = media viewer.
Booking flow = Tool page pattern (left control column → right preview) on desktop; single column on mobile.
Client portal = Settings-like centered content card with a progress segmented header.
Public site = Marketing product page (hero, framed product shot of the checklist, sticky-index feature section, sticky bottom CTA bar,
  dark footer), using marketing warm paper #f4f3ef for section backgrounds instead of pure grey.
Status colors: alerts palette (success/info/warning/negative) — never the brand blue for status.
