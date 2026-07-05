# Handoff · Malachia — Filter bar di **Libreria** (grid + list)

> Ridisegno della barra dei filtri della pagina **Libreria**, ispirato alla testata orizzontale "lit" di Skyrim/Alone-in-the-Dark e adattato allo stile cinematic Malachia. La spec copre **sia la vista a copertine (griglia, primaria)** sia **la vista a lista**, perché il toggle vive dentro la barra stessa.

---

## 1 · Cos'è

La pagina **Libreria** ha oggi una "filter row" piena di chip (Tutti / Letti / In lettura / Da leggere / € senza valore / filtri) più un sort + un toggle griglia/lista. La testata della pagina ("Capitulum II · Libreria · 543 volumi") è separata sopra.

Il nuovo design **fonde tutto in una singola striscia luminosa orizzontale** (la "lit strip"), che è il **vero protagonista visivo** della pagina. La striscia:

- È larga edge-to-edge nell'area pagina (entro il padding orizzontale 56px).
- Ha un gradient cremoso/oro che simula una luce concentrata al centro che sfuma verso i bordi (come la testata della reference Skyrim).
- Contiene **tutti** i controlli di filtraggio/ordinamento/vista: section label, Filtri, Ordina, Cerca, toggle Griglia|Lista, counter.
- Resta identica in entrambe le viste — cambia solo ciò che c'è **sotto**.

Sotto la striscia:

- **Vista Griglia** (primaria): griglia di copertine 7-colonne. La copertina **attiva** ha un alone oro intorno e un'ombra atmosferica più intensa — sostituisce la "row attiva" della reference.
- **Vista Lista**: header colonne (NOME · AUTORE · STATO · ANNO · PAG.) in Cinzel uppercase micro, seguito dalle righe libro. La riga attiva è attraversata da una striscia di luce crema esattamente come nella reference.

---

## 2 · Files in questo pacchetto

```
design_handoff_libreria_filterbar/
├── README.md                       # questo documento
├── PROMPT_CLAUDE_CODE.md           # prompt da incollare in Claude Code
├── fonts/
│   └── AgmenaPro-Regular.ttf       # custom body font (Cinzel viene da Google Fonts)
└── preview/
    ├── index.html                  # prototipo standalone scalato in viewport
    ├── libreria.jsx                # componente unificato: FilterStrip + GridView + ListView
    └── fonts/                      # AgmenaPro duplicato per il preview locale
```

Per vederlo: `cd preview && python -m http.server` → `http://localhost:8000/`. Il toggle Griglia|Lista nella barra **funziona** — usalo per confrontare le due viste con la stessa striscia.

---

## 3 · Design tokens (in comune con il resto del tema)

Se hai già il tema cinematic, questi token esistono. Non duplicarli.

```css
--cine-bg:           #0a0704;
--cine-cream:        #e8dcc0;
--cine-gold:         #d8b46a;
--cine-gold-dim:     #9a7e3a;
--cine-vermilion:    #c0533b;
--cine-border:       rgba(216,180,106, 0.18);
--cine-border-strong:rgba(216,180,106, 0.32);
--cine-text-shadow:  0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7);
```

**Tipografia**

- Heading: `'Cinzel', 'Cormorant Garamond', serif` (Google Fonts; pesi 400/500/600/700)
- Body: `'Agmena Pro', Georgia, serif` (self-hosted: file `fonts/AgmenaPro-Regular.ttf`)
- Italici: `font-style: italic` sintetizzato sopra Agmena Regular (scelta accettata, vedi handoff precedenti).

**Niente `border-radius`** in tutta questa pagina.

---

## 4 · La striscia luminosa (FilterStrip)

Specifica al canvas di riferimento **1280px** di larghezza, dentro un padding-orizzontale di **56px** (quindi striscia "interna" larga 1168px). Altezza fissa **54px**.

### 4.1 — Background della striscia

La striscia è l'unico elemento "lit" della pagina. Il suo background è due gradient sovrapposti:

```css
height: 54px;
background-image:
  /* alone caldo concentrato al centro */
  radial-gradient(
    ellipse 60% 180% at 50% 50%,
    rgba(232,220,192, 0.46) 0%,
    rgba(216,180,106, 0.25) 18%,
    rgba(216,180,106, 0.04) 56%,
    transparent 80%
  ),
  /* riempimento orizzontale fioco */
  linear-gradient(
    180deg,
    rgba(232,220,192, 0.04) 0%,
    rgba(216,180,106, 0.10) 50%,
    rgba(232,220,192, 0.04) 100%
  );
box-shadow:
  inset 0  1px 0 rgba(232,220,192, 0.18),  /* top hairline crema */
  inset 0 -1px 0 rgba(0,0,0,      0.55);   /* bottom hairline nera */
```

L'alone caldo al centro **non è simmetrico statico**: è un'ellisse alta (180% di altezza), e proietta luce oltre i bordi verticali della striscia, dando un effetto "luce che filtra da dietro" tipico del tema cinematic.

### 4.2 — Contenuto della striscia (ordine sinistra → destra)

Layout: `display: flex; align-items: center; gap: 18px; padding: 0 22px; height: 100%`.

1. **Section label** — gruppo flex (gap 10):
   - Icona codice ([SVG inline `IconRune`, 18×18, color gold]; un piccolo "libro/codex" con rombo decorativo). Sostituibile col logo Malachia mini se preferisci.
   - Label `LIBRERIA` in Cinzel uppercase **16px**, weight 600, tracking `0.22em`, color cream, text-shadow `0 1px 0 rgba(0,0,0,0.6)`.

2. **Divider verticale** — 1px × 26px, color `rgba(216,180,106,0.28)`.

3. **Bottone "Filtri"** (`btnGhost`):
   ```css
   display: inline-flex; align-items: center; gap: 8px;
   padding: 6px 12px;
   background: transparent;
   border: 1px solid rgba(216,180,106, 0.22);
   color: cream;
   cursor: pointer;
   ```
   Contenuto: icona imbuto 11×11 + label `FILTRI` (Cinzel 11px cream) + tail italic Agmena 12px che mostra il filtro corrente (es. `Tutti`, oppure `Da leggere`, ecc.) in cream a 70% alpha. Clic → apre il popover filtri (vedi §7).

4. **Bottone "Ordina"** (`btnGhost` stesso stile):
   - Label `ORDINA` (Cinzel 11px cream) + tail italic Agmena 12px col criterio corrente (`data aggiunta`, `titolo`, `autore`, `anno`…) + chevron 8×6 a destra. Clic → apre il dropdown sort (vedi §7).

5. **Spacer** `flex: 1`.

6. **Bottone icona "Cerca"**:
   ```css
   width: 32px; height: 32px;
   background: rgba(0,0,0, 0.28);
   border: 1px solid rgba(232,220,192, 0.22);
   color: cream; cursor: pointer;
   ```
   Icona magnifier 13×13. Clic → apre la search modal/command palette esistente del codebase.

7. **Toggle segmented `Griglia | Lista`** — 1px border `rgba(232,220,192,0.22)`, due bottoni 32×32 affiancati:
   - Inattivo: background `transparent`, color `rgba(232,220,192, 0.62)`.
   - Attivo: background `rgba(216,180,106, 0.16)`, color cream.
   - Icone: grid 2×2 (4 rettangoli) / 3 linee orizzontali.

8. **Divider verticale** identico al primo.

9. **Counter** (gruppo flex, gap 8):
   - Icona stack 14×14, color gold.
   - Testo `{count}/{total}` in Cinzel **14px** weight 600, color cream, `font-variant-numeric: tabular-nums`, text-shadow `0 1px 0 rgba(0,0,0,0.6)`.
   - Il denominatore (`/ 543`) ha colore `rgba(232,220,192, 0.55)` e weight 400.

**Esempio counter:** quando nessun filtro è attivo → `543 / 543`. Quando l'utente filtra "Letti" e ne ha 32 → `32 / 543`. Quando filtra "Da leggere" e cerca "Adorno" → `5 / 543` (il denominatore è SEMPRE il totale collezione).

---

## 5 · Vista Griglia (primaria)

Sotto la striscia, margin-top **24px**. Griglia CSS:

```css
display: grid;
grid-template-columns: repeat(7, 1fr);
gap: 30px 22px;
padding-bottom: 24px;
```

A 1280px-1168px-utili → ogni colonna è circa 137px → copertina **132×190**.

### 5.1 — Cover atom

Riusa il componente "Cover" reale del codebase: passa solo `width: 132, height: 190` e la palette (o la cover-art reale del libro se disponibile).

**Stato "active" (libro selezionato/hovered/last-opened — dipende dalla logica esistente)**: la copertina ha box-shadow più ricco:

```css
box-shadow:
  inset 0 0 0 1px rgba(0,0,0, 0.25),
  inset 6px 0 0 rgba(0,0,0, 0.18),
  0 8px 22px rgba(0,0,0, 0.6),
  0 0 0 1px var(--cine-gold),                 /* anello oro */
  0 0 24px rgba(216,180,106, 0.45);           /* glow oro */
```

Stato normale: solo le prime tre regole, senza l'anello + glow.

### 5.2 — Labels sotto la copertina

Layout flex-column gap 6 sotto l'immagine:

- **Titolo**: Agmena 12px, color cream (active) / `rgba(232,220,192, 0.95)` (normale), line-height 1.25, text-shadow standard.
- **Autore**: Agmena italic 11px, color `rgba(232,220,192, 0.72)`.

In produzione: se l'utente ha settato "mostra anno" o "mostra stato" come info aggiuntiva nelle preferenze libreria, **aggiungile in micro-Cinzel sotto l'autore** rispettando lo stile (Cinzel 9px tracking `0.22em` cream-dim).

### 5.3 — Densità griglia

Il prototipo usa 7 colonne. Nel codebase esistente la griglia attuale è a 8 colonne (cover più piccole). Mantieni quella che hai — il design system è agnostico al count. L'unica regola: la cover **non scende mai sotto 120×170** (sotto, il titolo overlay sulla cover diventa illeggibile).

---

## 6 · Vista Lista

Margin-top **6px** dopo la striscia (più stretta perché il column-header fa da continuazione visiva della striscia stessa).

### 6.1 — Column header

```css
display: grid;
grid-template-columns: 2.2fr 1.4fr 130px 70px 60px;
align-items: center;
padding: 8px 18px;
border-bottom: 1px solid rgba(216,180,106, 0.22);
```

Le label sono in **Cinzel 9px, tracking `0.26em`, color `rgba(232,220,192, 0.55)`, weight 500, uppercase**. Allineamento: prime due a sinistra, ultime tre a destra.

Colonne nel prototipo: **NOME · AUTORE · STATO · ANNO · PAG.**

> **In produzione**: replica le colonne che la vista lista mostra OGGI nel codebase. Se mostri editore, formato, ISBN, valore stimato, ecc., conservali — la regola è solo lo stile. Le colonne numeriche / di stato vanno a destra, le testuali a sinistra.

### 6.2 — Riga (ListRow)

```css
display: grid;
grid-template-columns: 2.2fr 1.4fr 130px 70px 60px;
align-items: center;
padding: 10px 18px;
border-bottom: 1px solid rgba(216,180,106, 0.10);  /* più fioco del header */
position: relative;
cursor: pointer;
```

**Riga normale**: background `transparent`.

**Riga attiva** (selezionata / hovered / last-opened):

```css
background: linear-gradient(
  90deg,
  transparent 0%,
  rgba(232,220,192, 0.10) 30%,
  rgba(232,220,192, 0.14) 50%,
  rgba(232,220,192, 0.10) 70%,
  transparent 100%
);
```

Più una **barra verticale oro a sinistra**:

```css
::before { content:''; position:absolute; left:0; top:0; bottom:0; width:2px; background: var(--cine-gold); }
```

(Nel prototipo è uno `<span>` posizionato — usa pseudo-elemento o span, indifferente.)

### 6.3 — Contenuto delle celle

- **Nome**: Agmena 14px, color cream, text-shadow `0 1px 0 rgba(0,0,0,0.55)`.
- **Autore**: Agmena 13px, color `rgba(232,220,192, 0.78)`.
- **Stato**: Cinzel 10px uppercase tracking `0.16em`. Colore per stato:
  - `Letto` → gold
  - `In lettura` → vermilion
  - `Da leggere` → `rgba(232,220,192, 0.7)`
  - `Abbandonato` (se presente) → `rgba(232,220,192, 0.45)`
- **Anno**: Cinzel 12px cream, tabular-nums.
- **Pag.**: Cinzel 12px `rgba(232,220,192, 0.78)`, tabular-nums.

Click su una riga → naviga alla pagina dettaglio libro (riusa il flow esistente).

### 6.4 — Hover

In aggiunta agli stati definiti sopra, su hover di una riga non-active: background leggera `rgba(232,220,192, 0.04)`. Su hover di una cover non-active: opacity-up del titolo a piena (era `0.95` → `1.0`), nessun bordo.

---

## 7 · Comportamenti / state

Il prototipo è quasi statico (solo il toggle Griglia/Lista è interattivo). Implementa con i primitive del codebase:

### 7.1 — Toggle vista

Stato persistente per utente (`localStorage` o user-pref del backend). Default: **griglia**. Cambio toggle → swap del body senza navigation.

### 7.2 — Filtri

Il bottone "Filtri" non è un toggle on/off ma una **dropdown / popover**. Quando si apre, mostra:

- I 4 stati lettura come check-list (multi-select): `Tutti · Letti · In lettura · Da leggere · Abbandonato`. "Tutti" è mutualmente esclusivo (se selezionato deseleziona gli altri).
- I filtri "speciali" del codebase esistente come sezione separata sotto: `Senza valore stimato`, `Preferiti`, `Con note`, `Senza copertina`, ecc. — **mantieni esattamente i filtri che hai oggi**, solo re-stilizzati.
- Footer del popover: "Azzera filtri" (link Agmena italic gold-dim) e "Applica" (bottone primary).

La tail-label italica accanto a "Filtri" nella striscia riflette i filtri attivi:
- Nessun filtro attivo → `Tutti`
- Un solo stato attivo → quel nome (`Letti`, `Da leggere`)
- Più filtri attivi → `{n} attivi`

Lo styling del popover: vedi `screens-cinematic.jsx` → la `NavTab` dropdown della top-bar è la primitive di riferimento (background `rgba(14,9,5,0.92)`, border `rgba(216,180,106,0.32)`, backdrop-blur 8px, no border-radius).

### 7.3 — Ordina

Stesso pattern del bottone Filtri, popover singolo-select con i criteri esistenti: `data aggiunta`, `titolo`, `autore`, `anno`, `pagine`, `valore stimato`, `ultima lettura`, … (usa quelli che già esistono). Direzione asc/desc gestita da una freccia accanto al criterio nel popover.

### 7.4 — Cerca

Icona magnifier → apre la search modal / command palette esistente del codebase, con focus sull'input. La barra **non si trasforma in input inline**: la search vive nel modal globale per coerenza con la top-bar.

### 7.5 — Counter

Il numeratore (es. `32`) si aggiorna in tempo reale quando l'utente cambia filtro o digita nella search. Il denominatore (`/ 543`) è sempre il totale libri della collezione.

Quando `count === total`: il counter resta in cream (nessuna evidenziazione speciale).
Quando `count < total`: il counter resta in cream — non aggiungere un highlight o un colore diverso, ci pensa già la disparità numerica a comunicare "filtro attivo".

### 7.6 — Section label

Click su `LIBRERIA` (l'etichetta a sinistra della striscia) **non fa nulla** (è un'etichetta semantica, non un link). Non aggiungere hover state.

Però: se nel codebase la `Libreria` ha già sotto-route (Autori, Editori), un piccolo chevron di apertura accanto al label che riapre il sotto-menu della top-bar **è accettabile** — ma chiedi prima di farlo, non è scope di questo handoff.

---

## 8 · Cosa preservare dal codebase esistente

⚠️ **Regola d'oro**: questo è un **re-skin di una pagina che esiste già**, non un greenfield. Prima di toccare markup:

1. Apri la pagina Libreria attuale e fai l'inventario di:
   - Tutti i chip/filtri esistenti (stato lettura + filtri speciali + range valore + tag + collezione/scaffale + ecc.)
   - Tutti i criteri di sort esistenti
   - Tutte le azioni della top-area (cerca, aggiungi libro, settings, ecc. — se vivono lì)
   - Le colonne della vista lista (qualunque sia il loro numero/contenuto)
   - Lo stato di selezione/hover/last-opened della cover/riga
2. **Mappa l'inventario** sul nuovo layout:
   - Chip stato lettura → check-list dentro il popover "Filtri"
   - Filtri speciali → sezione "speciali" del popover
   - Criteri sort → popover "Ordina"
   - Search → icona magnifier nella striscia (apre modal esistente)
   - View toggle → segmented `Griglia | Lista` nella striscia
   - Count → counter `n/total` a destra della striscia
   - Colonne lista → identiche, solo restilizzate
3. **Non rimuovere niente** senza chiedere. Se qualcosa non ha un posto ovvio (es. un "esporta CSV" che vive accanto ai filtri), chiedi.
4. **Non aggiungere niente** che non esista già (no "Stima valore" magico, no nuovi filtri "Preferiti" se non li hai).

---

## 9 · Cose da NON fare

- ❌ Non aggiungere `border-radius` da nessuna parte della striscia o delle righe.
- ❌ Non rendere la striscia "sticky" al top scroll — è in flow normale; la pagina scrolla sotto di lei. (Se vuoi sticky, parlane con design prima: cambia il box-shadow per non sembrare staccata.)
- ❌ Non rimpiazzare la search-modal globale con un input inline nella striscia — perdi il vantaggio della command palette.
- ❌ Non animare la lit-strip (no shimmer, no pulse). È statica. L'unica "animazione" accettabile è un fade del background a 200ms quando la pagina monta.
- ❌ Non mostrare "0 risultati" come una grossa empty-state quando un filtro non matcha — mostralo come una riga sotto il column-header in Agmena italic gold-dim "nessun libro corrisponde ai filtri attivi · azzera filtri".
- ❌ Non usare la stessa lit-strip in altre pagine senza prima discuterne — è un'identità visiva forte e va dosata.

---

## 10 · Domande aperte

1. **Filtri persistenti tra sessioni**? Oggi i chip sono visivi e si resettano al reload. Vogliamo che il popover-stato dei filtri persista? (Suggerimento: sì, in `localStorage`.)
2. **Counter quando filtri attivi**: voglio aggiungere un piccolo "•" oro a sinistra del numero per segnalare "filtro attivo"? Per ora **no**, ma chiedi al PM.
3. **Mobile / viewport <980px**: la striscia non sta in una riga. La spec non copre quella breakpoint — desktop-first. Decidiamo dopo come compatta (probabile: section label + counter sopra, controlli sotto).
4. **Drag & drop** sulle copertine per riordinare manualmente la collezione: se esiste oggi, conservalo intatto.
