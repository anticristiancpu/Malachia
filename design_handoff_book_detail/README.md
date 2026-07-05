# Handoff · Malachia — Schermata "Dettaglio libro"

> Specifica completa di una singola schermata: la pagina di dettaglio di un volume.
> Da migrare nel codebase di Malachia, coerente con il tema cinematografico già definito nel resto dell'app.

---

## 1 · Cos'è

Questa schermata è la **vista di dettaglio di un singolo libro** della libreria personale Malachia.

Layout ispirato alle "investigation pages" dei giochi d'avventura noir/horror (Alone in the Dark, L.A. Noire, Diablo IV codex pages):

- **Due colonne 50/50** edge-to-edge.
- **Sinistra**: la copertina del libro grande e centrata, una toolbar di azioni icona-only sotto, e una striscia di metadati compatta.
- **Destra**: titolo enorme + autore + un sistema a 5 tab + un corpo testuale lungo e scorrevole con sinossi, pull-quote del frammento, e micro-meta in chiusura.

Il tono è quello di una **scheda investigativa**, non di una scheda prodotto. Niente prezzi in evidenza, niente CTA "Aggiungi al carrello". È contenuto editoriale di proprietà dell'utente.

---

## 2 · Files in questo pacchetto

```
design_handoff_book_detail/
├── README.md                         # questo documento
├── PROMPT_CLAUDE_CODE.md             # prompt da incollare in Claude Code
├── fonts/
│   └── AgmenaPro-Regular.ttf         # custom body font (Cinzel viene da Google Fonts)
└── preview/
    ├── index.html                    # prototipo standalone (1 sola schermata)
    ├── image-slot.js                 # web-component per lo sfondo (reference)
    ├── screens-cinematic.jsx         # tokens + CinematicShell + Crest (dipendenza)
    ├── screens-cinematic-4.jsx       # *** la schermata Dettaglio libro ***
    └── fonts/                        # AgmenaPro per il preview locale
```

I file in `preview/` sono un **prototipo React-in-browser** (Babel standalone). **Non sono codice di produzione**. Sono il riferimento visivo: copia il layout, lo spacing, e i token, ma reimplementa nel framework/stack di Malachia.

Per vedere il prototipo: `cd preview && python -m http.server` → `http://localhost:8000/`.

---

## 3 · Posizionamento nell'app

- **Route**: `Libreria > [book id]` (o equivalente). Nella top bar resta attivo il tab **Libreria**.
- **Ingresso**: click su una copertina nella griglia Libreria, oppure su una riga nella Top-10 di Annales, oppure su una copertina nelle pagine Autori/Editori/Scaffali.
- **Uscita**: link "Indietro" in alto a sinistra del body (vedi §6.1).
- **Chrome**: usa la stessa top bar e lo stesso backdrop (foto utente + gradient + grain) del resto dell'app — non c'è nessun trattamento speciale di chrome per questa pagina.

---

## 4 · Design tokens (in comune con il resto del tema)

> Se hai già implementato il tema "cinematic" per le altre 8 schermate, **questi token esistono già**. Non duplicarli.

### Colori

```css
--cine-bg:           #0a0704;
--cine-cream:        #e8dcc0;
--cine-gold:         #d8b46a;
--cine-gold-dim:     #9a7e3a;
--cine-vermilion:    #c0533b;
--cine-border:       rgba(216,180,106, 0.18);
--cine-border-strong:rgba(216,180,106, 0.32);
--cine-panel:        rgba(20,14,7, 0.55);

/* "Tooltip-embossed" text shadow per leggibilità su foto */
--cine-text-shadow:  0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7);
```

### Tipografia

- **Heading**: `'Cinzel', 'Cormorant Garamond', serif`
- **Body**: `'Agmena Pro', Georgia, serif`
- **Body italic**: stessa famiglia, `font-style: italic` (vedi §5)

Caricamento:

```css
/* Cinzel da Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap');

/* Agmena Pro self-hosted (file in /fonts/) */
@font-face {
  font-family: 'Agmena Pro';
  src: url('/fonts/AgmenaPro-Regular.ttf') format('truetype');
  font-weight: normal; font-style: normal; font-display: swap;
}
```

### No-border-radius

**Tutta la schermata è a spigolo vivo.** Niente `border-radius`. Niente.

---

## 5 · Nota importante sull'italico di Agmena Pro

Il pacchetto contiene **solo** `AgmenaPro-Regular.ttf` (peso regolare upright).
Tutti i corsivi nel prototipo sono ottenuti con `font-style: italic` → il browser sintetizza il corsivo via skew. **È accettabile** per questo handoff (è una scelta estetica del prototipo).

Se in seguito vuoi un corsivo "vero", aggiungi `AgmenaPro-Italic.ttf` con un secondo `@font-face` `font-style: italic`.

---

## 6 · Specifica della schermata

Artboard di riferimento **1280 × 880 px**. Tutte le misure sono per quella dimensione; scala proporzionalmente nel layout reale.

Il contenuto della pagina (dentro la `CinematicShell`) ha **padding `24px 64px 24px`**, ed è un flex-column che riempie l'altezza.

### 6.1 — Link "Indietro"

In alto, prima del grid:

- Display: `inline-flex; align-items: center; gap: 8px`
- Font: Cinzel uppercase 11px, tracking `0.22em`, color `rgba(232,220,192,0.65)`
- Icona: chevron `<` SVG 12×12, stroke 1.4 cream a 0.65 alpha
- Margin-bottom: 8px
- Hover: alza opacity a 1, cream pieno
- Click: torna alla griglia Libreria (history.back oppure router push)

### 6.2 — Grid principale

```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 56px;
flex: 1;          /* riempie l'altezza disponibile */
min-height: 0;    /* per permettere l'overflow:auto della colonna destra */
```

### 6.3 — COLONNA SINISTRA · copertina + azioni + meta

Centrata verticalmente e orizzontalmente nello spazio della colonna (`display:flex; flex-direction:column; align-items:center; justify-content:center`).

#### 6.3.1 — Copertina

- Dimensioni: **380 × 540 px** (fissi a 1280×880; nel layout reale scala con `aspect-ratio: 380/540` se necessario)
- Background: il primo colore della palette del libro (nel prototipo `BOOK_PALETTES[2][0]` = `#1a2238` blu notte; nella produzione **usa il vero render della copertina dal codebase**, oppure la cover-art reale del libro se disponibile)
- Box-shadow stack (questo è ciò che le dà l'aspetto "tomo pesante"):
  ```css
  box-shadow:
    inset 0 0 0 1px rgba(0,0,0,0.35),       /* bordo interno scuro */
    inset 12px 0 0 rgba(0,0,0,0.18),         /* "spine shadow" simulata */
    0 18px 60px rgba(0,0,0,0.85),            /* drop shadow morbida */
    0 0 0 1px rgba(216,180,106,0.12),        /* sottile linea oro */
    0 0 80px rgba(216,180,106,0.06);         /* atmospheric glow */
  ```
- All'interno (solo nel prototipo, per simulare una copertina senza usare una vera immagine):
  - Bordo oro interno: `position: absolute; inset: 7% 9%; border: 1px solid rgba(216,195,137,0.5); opacity: 0.7;`
  - Autore (top 12%): Cinzel uppercase 16px, tracking `0.22em`, colore `--cine-gold-dim`, centered
  - Titolo (top 24%): Cinzel uppercase **44px**, tracking `0.06em`, colore `--cine-cream`, centered, text-shadow `0 2px 4px rgba(0,0,0,0.65)`
  - Diamante decorativo (top 40%): SVG `<path d="M7 0 L8 6 L14 7 L8 8 L7 14 L6 8 L0 7 L6 6 Z" fill="currentColor"/>` 14×14, color `--cine-gold`
  - Sottotitolo (top 46%): Agmena italic 13px, color `rgba(216,195,137,0.85)`, centered
  - Editore footer (bottom 10%): Cinzel uppercase 11px, tracking `0.22em`, colore `rgba(216,195,137,0.65)`

  > **In produzione**: rimpiazza tutto questo con il vero componente "Cover" del codebase. La cosa che conta è il **rectangle 380×540 + box-shadow stack**.

#### 6.3.2 — Toolbar azioni (sotto la copertina, 24px margin-top)

`display: flex; gap: 8px; align-items: center;`

Sei bottoni icona-only **34×34px** (il primo "Nota" è primary ed è più largo perché include la label):

| # | Label                 | Icona                | Variante  | Azione                                                |
|---|-----------------------|----------------------|-----------|-------------------------------------------------------|
| 1 | **Nota**              | `+`                  | primary   | Apre il flow "aggiungi nota / citazione" al libro     |
| 2 | Cambia stato          | 3 righe orizzontali  | secondary | Apre un dropdown stati (Da leggere / In lettura / Letto / Abbandonato) |
| 3 | Aggiungi ai preferiti | cuore outline        | secondary | Toggle preferito                                      |
| 4 | Modifica              | matita               | secondary | Apre la scheda di edit dei metadati del libro         |
| 5 | Stima valore          | simbolo €            | secondary | Apre il flow "stima valore" (lookup mercato)          |
| 6 | Elimina               | ✕                    | secondary | Apre conferma eliminazione                            |

Stile del bottone (vedi `IconBtn` in `screens-cinematic-4.jsx`):

```css
/* secondary (icon only) */
width: 34px; height: 34px;
background: rgba(0,0,0,0.35);
border: 1px solid rgba(216,180,106,0.28);
color: rgba(232,220,192,0.82);
backdrop-filter: blur(6px);

/* primary "Nota" */
height: 34px;
padding: 0 14px;
gap: 8px;                                /* tra icona e label */
background: rgba(216,180,106,0.12);
border: 1px solid rgba(216,180,106,0.5);
color: var(--cine-gold);
font-family: 'Cinzel', serif;
text-transform: uppercase;
letter-spacing: 0.22em;
font-size: 11px;
font-weight: 500;
/* label: "NOTA" */
```

Hover (entrambi): leggera intensificazione di bg + border. Suggerito: `bg → rgba(216,180,106,0.18)`, `border → rgba(216,180,106,0.6)` per il primary, e `bg → rgba(0,0,0,0.5); border → rgba(216,180,106,0.4)` per i secondary.

#### 6.3.3 — Striscia metadati (sotto la toolbar, 22px margin-top, max-width 480px)

`display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 22px;`

Sette coppie chiave-valore. Per ognuna:

```css
display: flex; align-items: baseline; gap: 8px;
/* chiave */
font-family: 'Cinzel', serif;
text-transform: uppercase; letter-spacing: 0.18em;
font-size: 9px; font-weight: 500;
color: rgba(232,220,192,0.5);
/* valore */
font-family: 'Agmena Pro', Georgia, serif;
font-size: 13px;
color: var(--cine-cream);
text-shadow: var(--cine-text-shadow);
```

**Eccezione**: la chiave "Stato" ha il valore in `--cine-gold` (non cream) — è lo stato del volume nella collezione personale, è l'informazione più "vivente" della striscia.

Le sette chiavi nel prototipo (esempio): Stato, Editore, Lingua, Anno, Pagine, Formato, ISBN. In produzione mostra **tutti i metadati che il modello ha realmente** — se l'utente non ha specificato un anno, salta la coppia "Anno". Non mostrare placeholder ("—", "n.d.").

### 6.4 — COLONNA DESTRA · testata + tab + corpo scorrevole

`display: flex; flex-direction: column; min-height: 0;` — il `min-height:0` è critico per far funzionare lo scroll del child.

#### 6.4.1 — Eyebrow

Una sola riga in Cinzel uppercase, tracking `0.32em`, **fontSize 11px**, **colore `--cine-gold`**, weight 500, `margin-bottom: 10px`.

Contenuto: lo **stato del libro + categoria principale**, separati da `·`. Esempio: `Da leggere · classici greci`.

#### 6.4.2 — Titolo

```css
font-family: 'Cinzel', 'Cormorant Garamond', serif;
font-size: 46px;
font-weight: 400;
line-height: 1.05;
letter-spacing: 0.04em;
text-transform: uppercase;
color: var(--cine-cream);
margin: 0 0 14px;
max-width: 560px;
text-shadow: 0 2px 0 rgba(0,0,0,0.85), 0 4px 24px rgba(0,0,0,0.6);
```

Il titolo è completo (sottotitolo incluso). Va a capo naturalmente entro `max-width`.

#### 6.4.3 — Autore

```css
font-family: 'Agmena Pro', Georgia, serif;
font-style: italic;
font-size: 18px;
color: rgba(232,220,192,0.88);
text-shadow: var(--cine-text-shadow);
margin-bottom: 24px;
```

Formato: `di {Autore}`. Se il libro ha più autori: `di Autore1 & Autore2` (max 2; oltre, troncare con `et al.`).

#### 6.4.4 — Tab bar

```css
display: flex;
border-bottom: 1px solid rgba(216,180,106,0.18);
margin-bottom: 20px;
```

Cinque tab: **Sinossi** (default attivo), **Frammenti**, **Note**, **Prestiti**, **Storico**.

Ogni tab:
```css
padding: 10px 0;
margin-right: 32px;
font-family: 'Cinzel', serif;
text-transform: uppercase;
letter-spacing: 0.18em;
font-size: 12px;
cursor: pointer;
margin-bottom: -1px;          /* per sovrascrivere il border-bottom del parent */
text-shadow: var(--cine-text-shadow);
/* inactive */
color: rgba(232,220,192,0.55);
font-weight: 500;
border-bottom: 2px solid transparent;
/* active */
color: var(--cine-cream);
font-weight: 600;
border-bottom: 2px solid var(--cine-vermilion);  /* IMPORTANTE: vermilion, non gold */
```

L'underline attivo è **vermilion `#c0533b`** — è l'unico uso del vermilion in questa pagina e segna il "tu sei qui". Non cambiarlo in oro.

#### 6.4.5 — Contenuto del tab attivo (Sinossi) · scrollable

Container:

```css
flex: 1;
overflow: auto;
padding-right: 18px;
/* mask: fade-in/out top e bottom per non interrompere bruscamente lo scroll */
mask-image: linear-gradient(180deg, transparent 0%, black 24px, black calc(100% - 36px), transparent 100%);
-webkit-mask-image: linear-gradient(180deg, transparent 0%, black 24px, black calc(100% - 36px), transparent 100%);
```

Lo **scrollbar è quello globale**: thin, gold a 40% (vedi `* { scrollbar-width: thin; scrollbar-color: rgba(216,180,106,0.4) transparent; }` nell'index.html).

Dentro lo scroll, in ordine:

##### a) Paragrafi di sinossi

Tre paragrafi (i primi due "pieni", il terzo "concluding"):

```css
font-family: 'Agmena Pro', Georgia, serif;
font-size: 17px;
line-height: 1.7;
font-weight: 400;
color: rgba(232,220,192,0.95);       /* primo paragrafo */
/* o */ rgba(232,220,192,0.92);      /* paragrafi successivi */
max-width: 640px;
margin: 12px 0 24px;                 /* primo */
margin: 0 0 24px;                    /* successivi */
text-shadow: var(--cine-text-shadow);
```

Dentro il testo, le **enfasi tipografiche** sono di due tipi:

1. **`<em>` per termini/concetti tecnici**:
   ```html
   <em style="color: var(--cine-gold); font-style: italic">"tiaso"</em>
   ```
2. **`<span>` per enfasi non corsivata** (rara, per parole-chiave drammatiche):
   ```html
   <span style="color: var(--cine-gold)">gli eroi</span>
   ```

Usa questi sparingly — 1-2 evidenziazioni per paragrafo al massimo.

##### b) Pull-quote (un frammento del libro)

```css
border-left: 2px solid var(--cine-gold-dim);
padding-left: 22px;
margin: 28px 0 32px;
max-width: 620px;
```

Testo della citazione:

```css
font-family: 'Agmena Pro', Georgia, serif;
font-style: italic;
font-size: 20px;
line-height: 1.6;
font-weight: 400;
color: rgba(232,220,192,0.95);
text-shadow: var(--cine-text-shadow);
```

Sotto la citazione, l'**attribuzione** (riferimento al frammento):

```css
font-family: 'Cinzel', serif;
text-transform: uppercase;
letter-spacing: 0.22em;
font-size: 10px;
color: rgba(232,220,192,0.55);
font-weight: 500;
margin-top: 12px;
```

Formato dell'attribuzione: `{descrittore} · {edizione/fonte}`. Esempio: `frammento 31 · Voigt`.

> **Comportamento di prodotto**: la pull-quote viene dalla "Note" / "Frammenti" del libro. Se l'utente non ha ancora aggiunto frammenti propri, **omettere completamente questo blocco** — non mostrare un placeholder.

##### c) Paragrafo "outro" finale

Stesso stile dei paragrafi di sinossi, un singolo paragrafo conclusivo (sul valore della traduzione, sul perché vale la pena leggere questo libro, ecc).

##### d) Micro-meta footer

Strip di tre coppie chiave/valore alla fine del contenuto:

```css
display: flex; gap: 34px;
margin-top: 36px;
padding-top: 18px;
border-top: 1px solid rgba(216,180,106,0.18);
```

Per ciascuna coppia:

```css
/* chiave */
font-family: 'Cinzel', serif;
text-transform: uppercase;
letter-spacing: 0.22em;
font-size: 10px;
color: rgba(232,220,192,0.55);
font-weight: 500;
/* valore (margin-top: 4px) */
font-family: 'Agmena Pro', Georgia, serif;
font-size: 13px;
color: var(--cine-cream);
text-shadow: var(--cine-text-shadow);
```

Le tre coppie nel prototipo: **Aggiunto** (data di aggiunta alla collezione, in date format romano se possibile — `XII martii MMXXVI` — altrimenti `12 marzo 2026`), **Collocazione** (es. `Scaffale III · ripiano 2`), **Tag** (lista compatta separata da `·`, in italic — es. `poesia · classici · greco`).

In produzione: mostra quelle che sono **realmente popolate**. Se l'utente non usa la collocazione fisica, salta la coppia "Collocazione".

---

## 7 · Comportamenti / state

Il prototipo è **statico**. Implementa con i primitive del codebase:

### Tab

- Click su un tab → cambia il contenuto a destra senza navigare di pagina.
- I 5 tab:
  - **Sinossi**: il contenuto descritto in §6.4.5 (default).
  - **Frammenti**: lista delle citazioni/quote che l'utente ha salvato per questo libro. Stesso stile della pull-quote ripetuto. Empty-state: italica grigia "Nessun frammento ancora salvato — aggiungi il primo con il bottone Nota".
  - **Note**: note libere dell'utente sul libro. Stesso paragrafo-style della sinossi, ma editabile inline. Empty-state simile.
  - **Prestiti**: tabella minimale (data, a chi, restituito sì/no). Empty-state "Mai prestato".
  - **Storico**: timeline degli eventi (aggiunto / cambiato stato / valore stimato il …). In Cinzel uppercase per le date, Agmena per il body.

Per Frammenti/Note/Prestiti/Storico ci si aspetta che le sezioni siano già implementate altrove nel codebase Malachia: **portane lo stato esistente**, non reinventarlo.

### Toolbar azioni

| Pulsante              | Azione                                                                              |
|-----------------------|-------------------------------------------------------------------------------------|
| Nota (primary)        | Apre modal o panel laterale per inserire una nuova nota/citazione, attribuita al libro |
| Cambia stato          | Dropdown 4-voci: Da leggere · In lettura · Letto · Abbandonato. Aggiorna inline.    |
| Aggiungi ai preferiti | Toggle. Quando attivo, l'icona-cuore si riempie di gold.                            |
| Modifica              | Apre la scheda di edit metadati del libro (riusa la UI esistente di Malachia).       |
| Stima valore          | Apre il flow di stima (esistente nel codebase).                                      |
| Elimina               | Mostra conferma. Su conferma, naviga indietro a Libreria.                            |

### Link "Indietro"

Naviga indietro nello stack di history; se l'history è vuoto (deep-link), vai a `/libreria`.

### Scroll

La colonna destra ha overflow propria. La pagina nel suo complesso **non scrolla** — il footer (micro-meta) sta dentro lo scroll della colonna destra.

Su viewport stretti (< 980px) il grid `1fr 1fr` non funziona; nel responsive (non disegnato qui), passa a single-column: copertina (ridotta a ~280×400) + tutto il blocco destro sotto, con scroll di pagina. **Non è prioritario per questa fase** — questa app è desktop-first.

---

## 8 · Componenti del codebase da riutilizzare

Coerenza con il resto del tema "cinematic" già migrato:

- `CinematicShell` — chrome + backdrop, identico al resto delle pagine
- `NavTab` / top bar — invariato, "Libreria" attivo
- Il sistema di icone SVG inline è coerente con quelli usati nelle altre pagine — vedi gli `<svg>` inline in `screens-cinematic-4.jsx` per le 6 icone della toolbar. Puoi astrarli in un `<Icon name="…">` se preferisci.
- Lo `IconBtn` è una nuova primitive locale a questa pagina; valuta se promuoverlo a componente riutilizzabile (es. lo userai per le toolbar di altre pagine di dettaglio in futuro).
- Il rectangle cover 380×540 con il box-shadow stack è specifico a questa pagina. **Non riusare** la `CineBook` di griglia (è dimensionata 120×170 e ha altri trattamenti di scala) — qui hai un trattamento "hero cover" più cinematico.

---

## 9 · Cose da NON fare

- ❌ Non aggiungere `border-radius`.
- ❌ Non mostrare il prezzo del libro in evidenza nella testata (non è una scheda prodotto). Il valore stimato è una info di servizio, sta nel flow "Stima valore" o in Annales.
- ❌ Non mostrare "stelle" / rating numerico (Malachia è una biblioteca personale, non Goodreads).
- ❌ Non aggiungere social sharing / "Trova online" come azione primaria.
- ❌ Non mettere placeholder vuoti ("n.d.", "—") per i metadati mancanti — **omettere** la riga.
- ❌ Non sintetizzare un bold sopra Agmena Pro Regular (l'unico peso disponibile).
- ❌ Non rimpiazzare l'underline vermilion del tab attivo con oro.

---

## 10 · Domande aperte per lo sviluppatore

Cose da chiarire col PM/owner prima di chiudere:

1. **Edge-state copertina mancante**: se il libro non ha cover-art, mostri il placeholder "interno" del prototipo (titolo composto su rectangle a tinta unita) oppure un placeholder generico? Suggerimento: il composed-cover è bello, mantienilo come default per i libri senza arte.
2. **Limite paragrafi sinossi**: se la sinossi è cortissima (1 frase) o lunghissima (1000 parole), come si comporta? Lo scroll con mask gestisce entrambi.
3. **"Stima valore" come azione**: è già implementato altrove? Se sì, dove apre? Modal, panel, route nuova?
4. **Date romane**: il formato `XII martii MMXXVI` è un dettaglio estetico cool del prototipo. Va bene fare il formatter, oppure va al formato locale italiano standard?
5. **Mobile / viewport stretto**: priorità? Quando? Non è disegnato qui.
