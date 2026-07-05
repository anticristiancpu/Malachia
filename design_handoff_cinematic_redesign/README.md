# Handoff · Malachia — ridisegno cinematografico

> Pacchetto di handoff per Claude Code: design system + 8 schermate pronte da portare in produzione.

## 1 · Cos'è

This handoff documents a **complete restyling** of Malachia (personal-library web app) from the existing "monastic manuscript" theme to a **dark, cinematic, AAA-game-UI** theme inspired by Elden Ring / Diablo IV / Dark Souls menu screens.

The package covers **8 screens** of the existing app:

| #  | Screen                  | Notes                                                                   |
|----|-------------------------|-------------------------------------------------------------------------|
| 1  | **Studio · home**       | Title screen (no metrics). Sigil emblem + huge MALACHIA + entry prompt. |
| 2  | **Libreria**            | Filterable book grid.                                                   |
| 3  | **Autori**              | A–Z rail + author list + featured author's books.                       |
| 4  | **Editori**             | Publisher list + featured publisher's collane (series).                 |
| 5  | **Scaffali**            | User collections + featured reference collections (e.g. Tolkien card).  |
| 6  | **Collezione (Tolkien)**| Single-collection page with hero strip.                                 |
| 7  | **Desiderata**          | Wishlist grid.                                                          |
| 8  | **Annales**             | Statistics dashboard (sub-tabs + stat cards + top-10).                  |

## 2 · About the files in this bundle

The files in `preview/` are **HTML/JSX design references** — a React-in-browser prototype using `<script type="text/babel">`. **Not production code** to ship.

Your job: **port these designs into Malachia's existing codebase**, replacing the current "parchment" theme. Use the codebase's framework, component library, routing, and state primitives. The HTML mocks are the visual spec; your codebase is where the implementation lives.

**Fidelity: HIGH.** All colours, font families, sizes, letter-spacing, layouts, animations, and copy are final.

## 3 · How to use this in Claude Code

1. Place this `design_handoff_cinematic_redesign/` folder inside your Malachia project root.
2. Open the project in Claude Code.
3. Paste a prompt along these lines:

   > Please open `design_handoff_cinematic_redesign/README.md` and use it as the spec for migrating the Malachia UI from the current "parchment" theme to the new "cinematic" theme. The font files in `design_handoff_cinematic_redesign/fonts/` need to be installed into the app's static assets and loaded via @font-face (Mantinia for headings, Agmena Pro for body). The prototype files in `preview/` are visual references only — use the codebase's existing components, routing, and styling primitives. Start with the global theme tokens and the top bar (used by every screen), then migrate screen-by-screen in this order: Studio · Libreria · Autori · Editori · Scaffali · Collezione Tolkien · Desiderata · Annales. After each screen, show me a screenshot or a dev-server preview for review before moving on.

4. To preview the prototype standalone (sanity check the designs): serve `preview/` over HTTP (`cd preview && python -m http.server`) and open `http://localhost:8000/`. All 8 artboards appear in a pan/zoom canvas; double-click any artboard label to open it fullscreen.

## 4 · Migration map — old style → new style

| Aspect          | Old (parchment)                                         | New (cinematic)                                                                          |
|-----------------|---------------------------------------------------------|------------------------------------------------------------------------------------------|
| Background      | `#f4ecd8` parchment, light cream                        | `#0a0704` near-black + optional user photo via `<image-slot>` (drag-drop)               |
| Mood            | Manuscript page, daylight, monastic                     | Cinematic dark, candlelit, game-UI hero shot                                             |
| Heading font    | Cinzel / Cormorant Garamond                             | **Mantinia Regular** (`fonts/Mantinia-Regular.otf`, custom). Cinzel is the fallback only |
| Body font       | EB Garamond / Fraunces                                  | **Agmena Pro Regular** (`fonts/AgmenaPro-Regular.ttf`, custom). Georgia is the fallback |
| Decorative type | UnifrakturCook (gothic M, drop caps)                    | UnifrakturCook (only inside the heraldic Crest SVG — for use in Scaffali/Tolkien)        |
| Accent colours  | Terracotta `#7a3b2e`, gold `#bfa15a`                    | Gold `#d8b46a`, cream `#e8dcc0`, occasional vermilion `#c0533b`                          |
| Chrome          | Left sidebar + top bar                                  | **Top bar only** — left sidebar is removed                                               |
| Nav             | Vertical list                                           | Horizontal tabs separated by `|`, active tab gets ◆ marker + cream underline             |
| "Currency" stats| Hero cards on dashboard                                 | Compact counters in the top bar (volume count + estimated value)                         |
| Body density    | Tightly packed text + numbers                           | Mostly negative space; **Studio is intentionally empty** (title screen, no metrics)      |
| Treatments      | Drop caps, fleurons, dropcap rules                      | Vignette, grain, floating ember particles, sigil emblem behind home title                |
| Border radius   | Sometimes used                                          | **Zero. All shapes are sharp-cornered.**                                                 |

## 5 · Design tokens

### Colours

```css
--cine-bg:           #0a0704;                       /* page background */
--cine-cream:        #e8dcc0;                       /* primary text */
--cine-gold:         #d8b46a;                       /* accent / highlight */
--cine-gold-dim:     #9a7e3a;                       /* rules, dim borders */
--cine-vermilion:    #c0533b;                       /* rare accent */
--cine-text-mute:    rgba(232,220,192, 0.75);       /* secondary text */
--cine-text-dim:     rgba(232,220,192, 0.88);       /* tertiary text */
--cine-border:       rgba(216,180,106, 0.18);       /* card borders */
--cine-border-strong:rgba(216,180,106, 0.32);       /* emphasised borders */
--cine-panel:        rgba(20,14,7, 0.55);           /* dark translucent card */
--cine-overlay:      rgba(0,0,0, 0.35);             /* button hover bg */

/* Standard body text shadow — Elden-Ring-style for legibility on photo bg */
--cine-text-shadow:  0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7);
```

The text-shadow stack is **important** — applied to all body text, it gives the "game tooltip" embossed look that lets Agmena Pro pop on the cinematic background.

### Typography

Headings → **Mantinia Regular**. Body → **Agmena Pro Regular**. Fallbacks keep the design close even if the custom font fails to load.

```css
@font-face {
  font-family: 'Mantinia';
  src: url('/fonts/Mantinia-Regular.otf') format('opentype');
  font-weight: normal; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Agmena Pro';
  src: url('/fonts/AgmenaPro-Regular.ttf') format('truetype');
  font-weight: normal; font-style: normal; font-display: swap;
}
```

Both font files are in `fonts/` of this handoff. Copy them into your app's static-assets folder and set the `src` path accordingly.

| Role               | Family stack                                       | Size       | Letter-spacing | Notes                                            |
|--------------------|----------------------------------------------------|------------|----------------|--------------------------------------------------|
| Hero title (Studio)| `'Mantinia', 'Cinzel', 'Cormorant Garamond', serif`| 148px      | 0.08em         | `text-transform: uppercase`. Single drop-shadow + soft gold glow. |
| Page title         | `'Mantinia', 'Cinzel', 'Cormorant Garamond', serif`| 38px       | 0.03–0.04em    | uppercase                                        |
| Section header     | `'Mantinia', 'Cinzel', serif`                      | 13–14px    | 0.16–0.18em    | uppercase                                        |
| Nav tab            | `'Mantinia', 'Cinzel', serif`                      | 13px       | 0.16em         | uppercase                                        |
| Eyebrow / kicker   | `'Mantinia', 'Cinzel', serif`                      | 10–11px    | 0.22–0.32em    | uppercase, dim                                   |
| Numerals (stat)    | `'Mantinia', 'Cinzel', 'Cormorant Garamond', serif`| 18–48px    | 0.02em         | `font-variant-numeric: tabular-nums lining-nums` |
| Body               | `'Agmena Pro', Georgia, serif`                     | 14–18px    | normal         | line-height 1.5, with `--cine-text-shadow`       |
| Body italic        | `'Agmena Pro', Georgia, serif`, `font-style: italic`| 13–18px   | 0.01em         | mottos, marginalia, descriptions                 |
| Decorative M       | `'UnifrakturCook', serif`                          | 32px (svg) | —              | Only inside the heraldic crest                   |

Mantinia is a small-caps inscriptional roman — the lowercase glyphs render as small caps. Use `text-transform: uppercase` everywhere you want all full caps, or write the text in lowercase to get the Mantegna-style "big initial + small caps" effect.

Agmena Pro Regular is a humanist serif designed for screen reading at medium weight. Don't apply synthetic bold above this weight (only Regular ships with this handoff).

### Spacing & layout

- Page padding: `40px 64px` top/sides
- Section gap: `30–36px`
- Card padding: `18–22px`
- Grid gaps: `24–28px` between book covers
- Top bar height: `64px`, top-bar inner padding `0 28px`

### Borders, panels, shadows

- Card panel: `background: rgba(20,14,7,0.55); border: 1px solid rgba(216,180,106,0.18); backdrop-filter: blur(4px);`
- Rule under section headers: `border-bottom: 1px solid rgba(216,180,106,0.32); padding-bottom: 10px;`
- Dropdown / overlay: `background: rgba(14,9,5,0.92); border: 1px solid rgba(216,180,106,0.32); backdrop-filter: blur(8px); box-shadow: 0 12px 32px rgba(0,0,0,0.55);`
- Body text shadow: `0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)` (the game-tooltip look)
- Display text shadow (hero): `0 2px 0 rgba(0,0,0,0.85), 0 4px 28px rgba(0,0,0,0.75), 0 0 60px rgba(216,180,106,0.18)` + optional pulsing variant for animation
- **No border-radius anywhere.**

## 6 · Backdrop

Every screen has three layered backgrounds (`z-index 0 → 1 → 2`):

**Layer 0 — user-supplied photo** via `<image-slot>` Web Component.
Drag-drop target. The user trains the app's mood by dropping one atmospheric photo (their library, a candle, anything). The **same photo applies to all 8 screens** because every slot shares `id="cine-bg-malachia"`.

If you don't ship `<image-slot>` as-is, build the equivalent: an `<img>` filling `position: absolute; inset: 0; object-fit: cover;` whose URL comes from user preferences. Provide a file picker UI to change it.

**Layer 1 — atmospheric gradient stack** (always above the photo):

```css
background:
  radial-gradient(ellipse 800px 540px at 82% 32%, rgba(255,210,140,0.18), transparent 65%),
  linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.75) 100%),
  linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, transparent 55%, rgba(0,0,0,0.25) 100%),
  radial-gradient(ellipse at 35% 60%, transparent 35%, rgba(0,0,0,0.55) 100%);
```

**Layer 2 — film grain**: small SVG noise tile, `opacity: 0.35; mix-blend-mode: overlay`. See `CinematicOverlay` in `preview/screens-cinematic.jsx`.

## 7 · Top bar (used by every screen)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Studio | Libreria⌄ | Scaffali | Desiderata | Note | Grafo | Annales      │
│        … active tab has ◆ above + 1.5px cream underline …                 │
│                                                                            │
│                                          [📕 543]  [💰 6.636,44]  │ [🔍][+][⚙] │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Height** 64px. **Background** `linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 70%, transparent 100%)`.
- **Tabs** Mantinia uppercase 13px, tracking 0.16em. Inactive `rgba(232,220,192,0.55)`. Active `#e8dcc0`, weight up, ◆ rotated-square marker 9×9 above + 1.5px cream underline. Separator between tabs: pipe `|` in `rgba(232,220,192,0.22)`.
- **Libreria dropdown** opens on hover, items _Autori_ and _Editori_. On those routes "Libreria" is the active top-level tab AND the sub-item is bolded inside the dropdown.
- **Counters** — two metric blocks: circular outline icon (3 hlines for "volumi", €-monogram for "valore") + Mantinia/Cormorant numeral 18px.
- **Action cluster** — separator `1px solid rgba(216,180,106,0.22)` with `padding-left: 18px`, then three 38×38 icon-only buttons:
  1. Search (magnifier) — secondary
  2. `+` Aggiungi libro — primary (gold tint)
  3. Settings gear — secondary

## 8 · Screen specifications

### 8.1 — Studio · home (title screen)

**Purpose** Pure atmosphere. **All metrics live in the top bar — the body is intentionally empty.**

**Layout (over the backdrop + ember layer):**

- **Sigil emblem behind the title** — 720×720 SVG centred at vertical 42% of the content area. Contents:
  - Central radial glow `radial-gradient(rgba(216,180,106,0.5) → 0)`.
  - Two faint concentric rings (gold strokes 0.32 / 0.18 alpha).
  - Vertical axis line that extends beyond the rings (linear-gradient fade at top + bottom).
  - Thin horizontal cross-axis line.
  - Tiny diamond marks at the cardinal poles.
  - Small radial cracks (6 thin gold lines fanning out from center, opacity 0.13).
  - Brightest sparks just below center and at the bottom-most diamond.
  - **Animation** `cine-sigilPulse` 6s: opacity 0.55 ↔ 0.85 + drop-shadow blur 24px ↔ 48px.
- **MALACHIA title** — Mantinia Regular 148px, weight 400, tracking 0.08em, uppercase, colour `--cine-cream`. Padding-left 0.08em to visually-centre against the tracking. **Animation** `cine-titleGlow` 5s: text-shadow gold-glow softens 60px ↔ 90px while the dark drop is stable.
- **"Entra nello studio" prompt** — bottom-88px, Mantinia uppercase 14px tracking 0.38em, colour `--cine-cream`, **with a radial-gradient underglow** 280×6px directly below it. **Animation** `cine-breath` 2.6s opacity 0.45 ↔ 1. Clickable; routes to Libreria.
- **Credits line** — bottom-18px, Mantinia 10px tracking 0.26em, opacity 0.45. Text: `Malachia™ · Bibliotheca Secreta · MMXXVI`.
- **Floating embers** — 18 particles drifting up (`cine-emberA` / `cine-emberB`). `translateY(-180→-220px)`, `translateX(±20/30)`, opacity 0 → 0.9 → 0, over 5–9s with 0–6s staggered start delays.
- **"Cambia sfondo" button (bottom-right, hover-expanding)** — 36×36 icon-only resting state; on hover the box widens with a 250ms transition to reveal the label "CAMBIA SFONDO". Click opens the file picker that replaces the shared background photo (i.e. triggers the `<image-slot>` `input[type=file]`). Style:

   ```jsx
   /* idle */
   background: rgba(0,0,0,0.45);
   border: 1px solid rgba(216,180,106,0.28);
   color: rgba(232,220,192,0.78);
   /* hover */
   background: rgba(216,180,106,0.12);
   border-color: rgba(216,180,106,0.55);
   color: var(--cine-gold);
   ```

   Icon: a 14×14 picture frame with a small mountain triangle inside (see `preview/screens-cinematic.jsx`). In production, wire it to whatever flow your app uses for changing the user's background image — file picker, asset library, etc. Hide it on the other screens (only Studio shows it).

### 8.2 — Libreria

**Header** Eyebrow "Capitulum II" + Mantinia uppercase title "Libreria" + italic tail "· 543 volumi" (Agmena italic, gold). Right: 280-min-width inline search field.

**Filter row** (between two gold rules):
- Left: chips "Tutti · 543" (active), "Letti · 0", "In lettura · 0", "Da leggere · 543", hairline separator, "€ senza valore · 0", "Filtri".
- Right: `Ordina · data aggiunta ▾`, hairline, view toggle `Griglia | Lista` (segmented).

**Grid** 8 columns of book covers (120×172, gap `28px 22px`). Below each: Agmena 12px title + italic Agmena 11px author.

### 8.3 — Autori

**Header** "Capitulum V · Autori · 344" + search + small buttons `A→Z`, `✕ Orfani`, `⇄ Unifica`.

**Three-column grid** `20px | 220px | 1fr` (gap 20px).

- **Alphabet rail (20px)** A–Z, Mantinia 11px. Letters with data are vermilion `#c0533b`; empty letters at 35% cream.
- **Author list (220px)** Letter divider "A 17" (Mantinia 22px gold + bottom rule). Rows: Agmena 15px name (left) + Mantinia 11px count (right). Active row has a 2px left gold border + `rgba(216,180,106,0.10)` background.
- **Author detail (1fr)** Top row: 96×120 "A" badge (parchment-dark fill + gold inset border, big Mantinia "A" 52px gold) + name "THEODOR W. ADORNO" (Mantinia 32px uppercase) + sortKey "adorno, theodor w." (Agmena italic 13px dim) + vermilion-bordered chip "26 VOLUMI" + small `Scheda completa ›` button. Then a `CineSectionRule "In collezione · 26 titoli"`. Then a 6-col grid of book covers (112×162), with the year underneath in Agmena italic.

### 8.4 — Editori

**Header** "Capitulum VI · Editori · 103" + search + `Più libri prima ▾` + `⇄ Unifica`.

**Two-column grid** `210px | 1fr` (gap 28px).

- **Publisher list (210px)** rows of name + count + chevron. Active row gets gold left border + tinted bg.
- **Publisher detail (1fr)** Title block "EINAUDI" (Mantinia 38px) + Mantinia uppercase line "140 volumi · 14 collane" + primary `+ Nuova collana` button. Then for each collana:
  - Row header: drag-handle dots `⫶⫶` + collana name (Cormorant 22px) + optional Agmena italic subtitle (e.g. "(Nuova serie)") + (right) count + Modifica / Elimina buttons.
  - 8-col grid of book covers (100×144).

### 8.5 — Scaffali

**Header** "Capitulum IV · Scaffali & collezioni" + primary `+ Nuovo scaffale`.

**Section 1 — _Collezioni di riferimento_** Tall full-width card (≥130px):
- Tolkien tengwar rune on the left.
- Centre: eyebrow "Canone · edizioni italiane" + title "J.R.R. TOLKIEN" (Mantinia 30px) + italic "22 opere · Bompiani, Rusconi, Mondadori".
- Right: big numeric "14" (Mantinia 56px gold) + italic "volumi posseduti" + chevron `›`.
- Background: gradient `rgba(20,14,7,0.85) → transparent` left-to-right + decorative SVG of mountains + tower silhouette on the right at 22% opacity.

**Section 2 — _I tuoi scaffali_** Empty-state: dashed card "Nuovo scaffale" with `+` icon + caption. Real shelves render as cards in this same 3-col grid.

### 8.6 — Collezione (Tolkien)

**Hero strip** 280px tall, edge-to-edge: layered Mordor-ish mountain silhouettes + tower (with tiny glowing window) + twisted branches + falling embers. Bottom-fade to page bg.

In the hero: bottom-left has Tolkien rune (size 72) + eyebrow + title "J.R.R. TOLKIEN" (Mantinia 42px). Top-right has subtle `↑ Carica` upload affordance. Bottom-right has italic "‡ trascina per riposizionare" caption.

**Body below the hero** `‹ Collezioni` back button. Then two sections, each:
- Section header: TolkienRune + title (e.g. "Desiderata", "Nella tua libreria") + (right) volume count + small action buttons (Aggiungi, Rinomina, Nascondi).
- 8-col grid of book covers (120×170).
- Below the grid: `+ Sottocategoria` button (Desiderata section only).

### 8.7 — Desiderata

**Header** Eyebrow "Libri osservati · da acquisire" + Mantinia title "Desiderata". Right: "11 volumi" tag + `Cerca online` and primary `Manuale` buttons.

**Description line** Agmena italic 13px dim: "11 volumi desiderati · passa sopra per le azioni".

**Grid** 7 columns of book covers (130×188, gap `32px 24px`). Title + italic author below.

### 8.8 — Annales

**Header** "Capitulum VIII · Annales · Bibliotheca" + italic strapline "Statistiche complete della biblioteca personale".

**Sub-tabs** _Panoramica_ (active, vermilion 2px underline), _Libreria_, _Lettura_, _Autori & Editori_, _Scaffali_, _Desiderata & Note_.

**Body — 3 rows of `StatCard`s** (panel: `rgba(20,14,7,0.55)` bg + gold border 0.18 + blur):

Row 1 (4 cards, first wide): "Volumi in collezione" 543 + breakdown (Letti 0 gold, In lettura 0 blue, Da leggere 543 cream, Abbandonati 0 vermilion). Then "Pagine totali 160.607", "Libri letti 0", "Autori 344".

Row 2 (5 cards): Scaffali 0, Desiderata 11, Note & citazioni 0, Prestiti attivi 0, Autori seguiti 0.

Row 3 (3 cards): "Valore totale stimato" `€ 6.636,44` (gold), "Valore medio a volume" `€ 12,22` (gold), "Top 10 · volumi di maggior valore" — list card with rank + title (Agmena 14 cream) + italic author (Agmena 11 dim) + gold price.

## 9 · Reusable components

These exist as JS functions in the prototype; port them to your codebase as React/Vue/whatever components.

| Prototype function       | What it is                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `CinematicShell`         | Page chrome (backdrop + top bar) + slot for the screen's content area.              |
| `CinematicOverlay`       | The gradient + grain layer.                                                         |
| `NavTab`                 | Single top-bar tab, supports hover dropdown.                                        |
| `NavAction`              | 38×38 icon-only button.                                                             |
| `Crest`                  | Heraldic shield SVG containing a gothic "M" (UnifrakturCook).                       |
| `TolkienRune`            | Tengwar-styled rune used on Tolkien-related sections.                               |
| `CinePageTitle`          | Eyebrow + uppercase title + optional italic em-tail.                                |
| `CineSectionRule`        | Section header + count + gold underline rule.                                       |
| `CineBook`               | Book cover placeholder. Use the codebase's real cover renderer when available.      |
| `CineSearchBox`          | Dark inline search field with magnifier icon.                                       |
| `CineSmallBtn`           | Outlined small button (Mantinia uppercase + optional icon).                         |
| `CineChip`               | Filter chip (active/inactive).                                                      |
| `StatCard`               | Annales stat panel.                                                                 |

## 10 · Interactions & state

The prototype is **static** — these are intended behaviours; implement with your codebase's state primitives.

- **Top bar**: tab click → route. Hover on "Libreria" → dropdown of `Autori`, `Editori`. Search icon → command palette. `+` → Add-book flow. Gear → Settings.
- **Studio**:
  - "Entra nello studio" → navigate to Libreria (or wherever the main view is).
  - "Cambia sfondo" hover-button → open file picker, save the chosen image as the app-wide background (persists across sessions; applies to every screen).
- **Libreria**: filter chip click toggles, view toggle grid↔list, sort dropdown reorders, book click → detail.
- **Autori / Editori**: list row click swaps right-pane detail. Alphabet letter scrolls the author list.
- **Scaffali**: collection card click → Collezione detail. `+ Nuovo scaffale` opens creation flow.
- **Collezione**: hero image drag-drop replaceable. `↑ Carica` opens file picker. Section action buttons operate on the section.
- **Annales**: sub-tab click swaps the stat-card matrix. Top-10 row → book detail.

## 11 · Animations

| Where                              | Property                                            | Easing       | Duration | Loop                     |
| ---------------------------------- | --------------------------------------------------- | ------------ | -------- | ------------------------ |
| Studio · "Entra nello studio"      | opacity 0.45 ↔ 1                                    | ease-in-out  | 2.6s     | infinite                 |
| Studio · MALACHIA title glow       | text-shadow gold blur 60px ↔ 90px                   | ease-in-out  | 5s       | infinite                 |
| Studio · sigil emblem              | opacity 0.55 ↔ 0.85 + drop-shadow 24px ↔ 48px       | ease-in-out  | 6s       | infinite                 |
| Studio · ember particles (×18)     | translate up & out + fade                           | ease-out     | 5–9s     | infinite, staggered 0–6s |
| Studio · "Cambia sfondo" button    | width-expand on hover                               | ease         | 250ms    | —                        |
| `NavTab` hover dropdown            | display toggle                                      | none         | —        | —                        |

All animations are slow and ambient. **No jarring transitions.** Tab/route changes should crossfade at 200–300ms if the router supports it.

## 12 · Image-slot dependency

`preview/image-slot.js` is a Web Component handling drag-and-drop of the user's atmospheric background photo, persisted in a JSON sidecar. **In production, replace this with whatever upload + persistence flow the codebase already has**:

- Store the image URL in user preferences (a single setting for the whole app).
- Render it as the `background-image` of the body or a fixed full-bleed `<img>` behind everything.
- Apply it to **every** screen — the design treats the background photo as a single, app-wide setting, not per-screen.
- The "Cambia sfondo" button on Studio is the primary entry point for changing it. The "Carica" affordance on Collezione hero is the same flow.

## 13 · Files in this handoff

```
design_handoff_cinematic_redesign/
├── README.md                       # this document
├── fonts/
│   ├── Mantinia-Regular.otf        # custom heading font
│   └── AgmenaPro-Regular.ttf       # custom body font
└── preview/
    ├── index.html                  # working preview that loads all 8 screens
    ├── design-canvas.jsx           # pan/zoom canvas wrapper (NOT for production)
    ├── screens-cinematic.jsx       # tokens, shell, Crest, primitives, Studio
    ├── screens-cinematic-2.jsx     # Libreria, Desiderata, Autori, Editori
    ├── screens-cinematic-3.jsx     # Scaffali, Collezione (Tolkien), Annales
    ├── image-slot.js               # drag-and-drop Web Component (reference only)
    └── fonts/
        ├── Mantinia-Regular.otf    # duplicated so the preview can load fonts locally
        └── AgmenaPro-Regular.ttf
```

To open the prototype: `cd preview && python -m http.server` and visit `http://localhost:8000/`.

## 14 · Open questions for the developer

When porting, you may want to confirm with the user:

1. **Background photo source** — does the user already upload an "ambient" photo elsewhere in the app, or is this a new feature? If new, it's a single user-preference (one image, app-wide).
2. **Drop the parchment theme entirely** — or keep it as a "light mode" toggle?
3. **Search modal / command palette UI** — not designed in this handoff. Use the codebase's existing one re-skinned to the new tokens.
4. **Sub-tabs in Annales** — only _Panoramica_ is designed. Re-use the `StatCard` grid for the other sub-tabs with the relevant slice of data.
5. **List view of Libreria** — not designed. Apply tokens to the existing list template.
6. **Settings panel** — not designed. Apply tokens to the existing settings UI.

Anything not designed should still inherit the dark cinematic theme: black panels, Mantinia headings, Agmena Pro body with the standard text-shadow, gold accents, no border-radius, vignette + grain backdrop.
