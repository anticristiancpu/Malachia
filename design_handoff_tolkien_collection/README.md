# Handoff: Collezione Tolkien — Quest-Journal Redesign

## Overview

The **Collezione Tolkien** screen is the detail view for a single curated author collection within **Malachia**, a cinematic book-collection app. This redesign reimagines it as a Skyrim-style quest journal: a left index of book titles acting as "scaffali", and a right panel showing the owned or desired editions of whichever title is selected, presented as book covers in a grid.

The design is **high-fidelity (hifi)**. Recreate it pixel-accurately using the existing Malachia codebase patterns — do not ship the HTML directly.

> ⚠️ **Do not touch any other screen or functionality already implemented in the app.** This handoff concerns only the `CineCollezioneTolkien` component (the Tolkien author-collection detail view).

---

## About the Design Files

`screens-tolkien-journal.jsx` is a **React/JSX design reference** written as a self-contained prototype. It reads shared tokens from `window` (set by `screens-cinematic.jsx`) and mounts as `window.CineCollezioneTolkien`. Treat it as a precise visual and interaction spec — not production code.

---

## Design Tokens (from `screens-cinematic.jsx`)

| Token | Value | Usage |
|---|---|---|
| `CINE_GOLD` | `#d8b46a` | Primary accent, borders, selected states |
| `CINE_GOLD_DIM` | `#9a7e3a` | Secondary gold, progress bar start |
| `CINE_CREAM` | `#e8dcc0` | Body text, unselected labels |
| `CINE_VERM` | `#c0533b` | Desiderata marker colour |
| `CINE_BG` | `#0a0704` | App-wide background |
| Serif display | `'Cinzel', 'Cormorant Garamond', serif` | All uppercase headings, tabs, labels |
| Body serif | `'Agmena Pro', Georgia, serif` | Body text, synopses, italic lines |

---

## Screen: Collezione Tolkien

**Canvas size**: 1280 × 880 px (the fixed artboard used by the Malachia design system).

### Layout overview

```
┌──────────────────────────────────────────────────────────────┐
│  TOP BAR  (h: 60px)                                          │
│  ← back   "Collezione Tolkien · J.R.R. Tolkien · N scaffali" │
│           [image icon]  (hover → "Cambia sfondo")            │
├────────────────┬─────────────────────────────────────────────┤
│                │                                             │
│  LEFT          │  RIGHT PANEL                                │
│  TITLES        │  (gold-framed, torn-parchment banner)       │
│  (w: 332px)    │  Edition covers in 4-column grid            │
│                │                                             │
│                │                                             │
├────────────────┴─────────────────────────────────────────────┤
│  FOOTER  (h: 60px)            [+ nuovo scaffale] [+ nuovo libro] │
└──────────────────────────────────────────────────────────────┘
```

---

## Background (CRITICAL — keep separate from app background)

The Tolkien collection has its **own independent background**, completely separate from the app-wide background (`cine-bg-malachia` image slot). Do not reuse or inherit the app background here.

Implement as a dedicated drag-and-drop image slot (id `tolkien-bg`) that:
- covers `position: absolute; inset: 0` at `z-index: 0`
- defaults to a painted forest/ruin SVG scene + atmosphere overlays when empty
- accepts a user-dropped image that overrides the default

**Default background stack (bottom → top):**
1. CSS gradient: `linear-gradient(168deg, #1a201b, #141914 40%, #0c0f0c)`
2. SVG scene art (ruined arch + tree silhouettes, 50% opacity, blur 2px)
3. User image slot (`tolkien-bg`) — `object-fit: cover`, `z-index: 0`
4. Atmosphere overlays (`z-index: 1`, `pointer-events: none`):
   - Two animated fog banks (`radial-gradient`, `translateX` animation, 38s + 52s)
   - Left-edge darken gradient for left column legibility
   - Top/bottom gradient fades
   - Film-grain texture (SVG `feTurbulence`, `mix-blend-mode: overlay`, 45% opacity)
   - Vignette (`radial-gradient` from transparent → dark at edges)

**"Cambia sfondo" button** (top right):
- Icon only by default (landscape/mountains SVG icon, 15×15)
- On hover: label "Cambia sfondo" slides in from the right (`max-width` animation, 0→120px, 0.18s ease)
- Clicking it triggers the file input on the `tolkien-bg` image slot

---

## Top Bar

- Height: 60px
- Background: `linear-gradient(180deg, rgba(0,0,0,0.5), transparent)`
- `z-index: 4`
- Left padding: 64px (to clear the back orb)
- Right padding: 28px

**Back orb** (far left, vertically centered):
- `position: absolute; left: 12px`
- 40×40px circle, `border-radius: 50%`
- Background: `rgba(8,10,7,0.5)`, border: `1px solid rgba(232,220,192,0.28)`
- Icon: left-pointing arrow SVG (`←` path), 18×18
- Hover: border → `rgba(216,180,106,0.6)`, color → `CINE_GOLD`
- `backdrop-filter: blur(5px)`

**Title row** (left of top bar):
- "Collezione Tolkien" — Cinzel, uppercase, 13px, weight 600, `CINE_CREAM`, `letter-spacing: 0.26em`
- Separator: 1×18px, `rgba(216,180,106,0.3)`
- "J.R.R. Tolkien · N scaffali" — Agmena Pro italic, 13.5px, `rgba(232,220,192,0.6)`

---

## Left Column — Title Index

- Width: 332px
- Padding-left: 60px (left inset, clearing back orb)
- Vertically centered within body area
- Scrollable if content overflows, with fade masks top/bottom (`mask-image` gradient)

**Continuous spine marker** (vertical line):
- `position: absolute; right: 22px; top: 40px; bottom: 40px`
- 1px wide, gradient: `transparent → rgba(232,220,192,0.16) → transparent`

**Entry list**: `[...VIRTUAL_ENTRIES, ...TK_WORKS]` — virtual entries first:

| id | label | behaviour |
|---|---|---|
| `__tutti__` | Tutti i libri | Shows all **owned** editions (owned:true only) |
| `__desiderata__` | Desiderata | Shows all editions where owned:false |
| `<work_id>` | Book title | Shows all editions of that specific work |

> ⚠️ **Desiderata volumes (owned: false) must NOT appear in "Tutti i libri"**. The two lists are mutually exclusive: "Tutti i libri" = possedute, "Desiderata" = non possedute.

**Row — unselected state:**
- Font: Cinzel uppercase, 15.5px, weight 500, `letter-spacing: 0.07em`
- Color: `rgba(232,220,192,0.6)`
- Grid: `1fr 28px` (text right-aligned | spine marker column)
- Spine tick: 1.5px wide × 13px tall, `rgba(232,220,192,0.4)`
- Vermilion diamond (5×5px rotated 45°, border `1px solid rgba(192,83,59,0.75)`) overlaid on spine tick when ALL editions are desiderata (or for the Desiderata virtual entry)

**Row — selected state:**
- Font size → 25px, weight 600, `letter-spacing: 0.03em`, color `CINE_CREAM`
- Text shadow: `0 2px 12px rgba(0,0,0,0.75)`
- Spine tick → 2px wide × 22px tall, `CINE_GOLD`, `box-shadow: 0 0 8px rgba(216,180,106,0.6)`
- Transition: `font-size 0.22s ease`, `color 0.18s ease`, `letter-spacing 0.22s ease`

**Row — hover state (for real book entries only, NOT virtual entries):**
- Color → `rgba(232,220,192,0.92)`
- Spine tick → `rgba(232,220,192,0.7)`
- Three small round action buttons fade in (`opacity: 0 → 1`, transition `0.15s ease`) at the left edge of the row:
  - Sposta scaffale (up/down arrows icon)
  - Modifica scaffale (pencil icon)
  - Elimina scaffale (× icon)
  - Each: 24×24px circle, `border-radius: 50%`, `background: rgba(8,10,7,0.7)`, `border: 1px solid rgba(232,220,192,0.3)`, `backdrop-filter: blur(4px)`
  - Own hover: border → `rgba(216,180,106,0.7)`, bg → `rgba(216,180,106,0.18)`, color → `CINE_GOLD`

---

## Right Panel — Edition Covers

- `flex: 1`, padding: `50px 56px 18px 26px` (within the body flex row)
- Contains a relative-positioned inner box that is 100% height

**Gold-framed panel:**
- `position: absolute; inset: 0`
- Border: `1px solid rgba(216,180,106,0.42)`
- Background: `rgba(8,11,8,0.5)`
- `backdrop-filter: blur(7px)`
- Box shadow: `0 24px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.3)`
- Inner inset border: `position: absolute; inset: 5px; border: 1px solid rgba(216,180,106,0.14)` (non-interactive)
- Four gold corner ornaments (26×26px SVG, one at each corner), each consisting of:
  - An L-bracket: `M0 9 L0 0 L9 0`, stroke `CINE_GOLD`, strokeWidth 1.3
  - A diagonal accent line: `M3 12 L12 3`, stroke `CINE_GOLD`, 0.8px, 50% opacity
  - A small diamond: `M6.5 2.5 L8 4 L6.5 5.5 L5 4 Z`, fill `CINE_GOLD`, 90% opacity
  - Corners tr/bl/br are CSS-mirrored (`scaleX(-1)` / `scaleY(-1)` / `scale(-1,-1)`)

**Torn parchment banner** (overlaps panel top edge):
- `position: absolute; top: -30px; left: 20px; z-index: 3`
- Parchment base: `linear-gradient(176deg, #ece1c6, #ddceaa 52%, #cdbb91)`
- Shape via `clip-path: polygon(...)` simulating torn/ragged edges
- Box shadow: `0 14px 30px rgba(0,0,0,0.55)`
- Film-grain overlay (SVG feTurbulence, `mix-blend-mode: multiply`, 50% opacity)
- Eyebrow: Cinzel uppercase, 9.5px, `rgba(74,46,22,0.62)`, `letter-spacing: 0.3em`
  - "Tutti i libri" → "N edizioni possedute · M titoli"
  - "Desiderata" → "N edizioni da trovare"
  - Single work → "N edizione/i"
- Title: Cinzel uppercase, 22px, weight 600, `#3a2410`, `letter-spacing: 0.05em`

**Scrollable content area** (inside panel):
- Padding: `52px 48px 36px` (top padding clears the banner)

**Header row:**
- Author name (italic, Agmena Pro, 16px, `rgba(232,220,192,0.8)`, `flex: 1`) — hidden for virtual entries
- Tally: `✓ N possedute · ◇ M desiderate` (Cinzel uppercase, 11px, `letter-spacing: 0.16em`, `rgba(232,220,192,0.6)`)
- Separated from grid by `border-bottom: 1px solid rgba(216,180,106,0.16)`, margin-bottom 26px

**Edition covers grid:**
- `display: grid; grid-template-columns: repeat(4, 164px); gap: 34px 26px; justify-content: start`
- Each cover: `CineBook` component (164×236px), palette rotated from `BOOK_PALETTES`
- Status badge (top-right of cover):
  - 24×24px circle, `background: rgba(8,11,8,0.72)`, `backdrop-filter: blur(3px)`
  - Posseduta: gold border `rgba(216,180,106,0.7)` + checkmark SVG (color `CINE_GOLD`)
  - Desiderata: vermilion border `rgba(192,83,59,0.8)` + rotated diamond SVG (color `CINE_VERM`)

---

## Footer

- Height: 60px, `z-index: 4`
- Background: `linear-gradient(0deg, rgba(0,0,0,0.5), transparent)`
- Content: `justify-content: flex-end; gap: 16px; padding-right: 56px`

**Two icon-only action buttons** (bottom right):

| Button | Title tooltip | Style |
|---|---|---|
| Nuovo scaffale | "Nuovo scaffale" | Secondary — border `rgba(232,220,192,0.28)`, color `CINE_CREAM` |
| Nuovo libro | "Nuovo libro" | Primary — border `rgba(216,180,106,0.65)`, color `CINE_GOLD` |

Both: 38×38px circle, `border-radius: 50%`, `backdrop-filter: blur(5px)`, `+` icon SVG (13×13, strokeWidth 1.5, round caps). Hover brightens border and applies `rgba(216,180,106,...)` background tint.

---

## State Management

```ts
// Single selection state — determines what appears in the right panel
selId: string   // '__tutti__' | '__desiderata__' | workId

// Derived
displayEditions: Array<{ work: Work, edition: Edition, pal: Palette }>
// '__tutti__'      → all editions where edition.owned === true
// '__desiderata__' → all editions where edition.owned === false
// workId           → all editions of that specific work (owned AND desired)
```

No external data fetching in the prototype — data is static. In the real app, replace with the appropriate data layer.

---

## Data Model

```ts
interface Work {
  id: string
  t: string       // title
  a: string       // author / editor credit line
  ed: Edition[]
}

interface Edition {
  l: string       // edition label (publisher, year, etc.)
  owned: boolean  // true = in collection; false = desiderata
}
```

---

## Animations & Transitions

| Element | Animation |
|---|---|
| Fog banks (2) | `translateX` keyframe loop, 38s / 52s ease-in-out infinite |
| Row selection | `font-size`, `color`, `letter-spacing`, `width`/`height` of spine tick — all CSS transitions 0.18–0.22s ease |
| Hover actions | `opacity: 0 → 1`, 0.15s ease |
| "Cambia sfondo" label | `max-width: 0 → 120px` + `opacity: 0 → 1`, 0.18s ease |
| Back orb / buttons | `border-color`, `background`, `color`, 0.15–0.18s ease |

---

## Assets

No external images are required. All visuals are:
- SVG-drawn scene art (inline)
- CSS gradients
- `feTurbulence` grain textures (inline SVG data URIs)
- `CineBook` placeholder covers (colored rectangles + Cinzel text)
- User-uploadable background via `tolkien-bg` image slot (optional)

---

## Files in This Package

| File | Description |
|---|---|
| `screens-tolkien-journal.jsx` | Full JSX prototype of the redesigned screen |
| `README.md` | This document |

The rest of the Malachia prototype (shell, nav, other screens, `CineBook`, `BOOK_PALETTES`, shared tokens) lives in the parent project and should not be modified.
