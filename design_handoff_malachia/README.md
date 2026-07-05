# Handoff — Malachia

> App / sito per la gestione di una biblioteca personale, dal sapore monastico–medievale.
> Il nome rinvia al bibliotecario di *Il nome della rosa*.

---

## 1. Sui file in questo pacchetto

I file contenuti in questa cartella sono **prototipi di design realizzati in HTML/React via Babel**: servono come riferimento visivo e comportamentale, **non sono codice di produzione da copiare così com'è**.

Il compito di chi prende in carico l'implementazione è **ricreare questi design** nell'ambiente del codice obiettivo (es. Next.js + React, Remix, SvelteKit, SwiftUI, ecc.) usando i pattern e le librerie già adottate dal progetto. Se non esiste ancora un codebase, scegli lo stack più adatto — la mia raccomandazione qui sotto.

### Stack consigliato
- **Web responsive**: Next.js (App Router) + React + TypeScript + Tailwind CSS (con tokens custom — vedi §7) + Radix Primitives per i componenti accessibili.
- **Mobile**: Expo (React Native) o iOS nativo (SwiftUI) — il design è già pensato in 390×844.
- **Backend / dati**: SQLite o Postgres con Prisma, ricerca con SQLite FTS5 o Meilisearch, scansione ISBN via API Google Books / Open Library, OCR locale per la "scansione ripiano" tramite ML Kit / Vision.
- **Auth**: opzionale — l'app è pensata come strumento personale. Auth + sync via Clerk o iCloud.

## 2. Fedeltà

**Hi-fi.** Mockup ad alta fedeltà con palette, tipografia, spaziature e composizione finali. Devono essere ricostruiti pixel-perfect (o quasi) nell'ambiente di destinazione. Le micro-interazioni descritte in §5 sono indicative — sono assenti dai mockup statici.

## 3. Direzione visiva

**Aesthetic**: medievale / monastico — pergamena, capilettera miniati, marginalia. Riferimenti: codici miniati, scriptorium benedettino, edizioni Adelphi/Einaudi anni '70. Eleganza editoriale, **mai folkloristica**: niente icone gotiche gratuite, niente texture finte.

**Tono di voce**: italiano, sobrio, leggermente arcaico. Etichette latine per sezioni principali ("Capitulum II", "scrinia", "folium", "Annales"), ma mai a costo della chiarezza. Le date sono in numeri romani solo per ornamento (es. "XX maii MMXXVI" come marca di pagina), non per dati operativi.

## 4. Schermate (artboard nel canvas)

### I · Marchio & Sistema
1. **Wordmark & introduzione** (1200×760) — logo "Malachia" con M miniata, sottotitolo "custode dei tuoi libri", citazione introduttiva in pseudo-latino.
2. **Sistema visivo** (1200×900) — palette, caratteri, chips, pulsanti, ornamenti.
3. **Copertine** (1200×680) — 3 varianti: *monastica* (capilettera miniato — default), *minimale* (titolo solo), *illustrata* (con motivo geometrico).

### II · Web — schermate principali (1280×880)
4. **Studio (dashboard)** — saluto, "in lettura" con barra di progresso, pila comodino, citazione del giorno, KPI dell'anno (volumi, pagine, citazioni).
5. **Libreria** — griglia 9 colonne di copertine, filtri chip (stato, genere), toggle vista (griglia/lista/scaffale), ordinamento.
6. **Dettaglio libro** — copertina grande, dati bibliografici (autore, anno, editore, pagine, ISBN, collocazione), barra di progresso, sinossi con drop cap, anteprima di 4 marginalia.
7. **Aggiungi volume** — 3 metodi (scansiona ISBN / cerca online / a mano), risultati API con copertine, pannello anteprima ingresso (stato iniziale, scaffale, collocazione, etichette).
8. **Ricerca avanzata** — barra a sintassi `autore:Calvino genere:romanzo anno:1970–1985`, facets (stato, genere, lingua, decennio, valutazione), risultati a lista.
9. **Wishlist** — card a griglia con copertina, "perché lo voglio", prezzo stimato, libreria/negozio, azioni "acquisita / nota".

### III · Organizzazione (1280×880)
10. **Scaffali (scrinia)** — collezioni dell'utente come card, ognuna con anteprima dei dorsi su un ripiano in legno.
11. **Mappa della biblioteca** — visualizzazione di una libreria fisica con ripiani a 1..N e dorsi colorati posizionati come nella realtà. Click sul dorso → pannello a destra con collocazione precisa (es. "ripiano 2, posizione 5"). Drag & drop fra ripiani. Switch tra stanze ("studio", "salotto", "camera").
12. **Grafo** — costellazione di nodi (autori) con archi (citazioni / traduzioni / temi). Sidebar: nodo selezionato, suoi volumi, suoi collegamenti.

### IV · Riflessione & ricordo (1280×880)
13. **Note & citazioni** — commonplace book: ogni entry ha data (XX maii), libro/autore, citazione in corsivo serif, glossa, etichette. Sidebar con filtri, etichette, autori più annotati.
14. **Annales MMXXVI** (modalità scura) — wrap statistico in stile *Spotify Wrapped*: numero grande di volumi (23), pagine sfogliate (7.412) con sparkline, ore di lettura (184) con orologio, generi a barre, autore dell'anno, citazione dell'anno, costanza (heatmap), volume più lungo.

### V · Mobile (390×844)
15. **Home / Studio** — saluto, "in lettura" compatto, citazione del giorno, KPI anno, pila comodino orizzontale, tab bar.
16. **Libreria** — griglia 3 colonne, search bar, filtri chip orizzontali.
17. **Dettaglio libro** — copertina hero centrata, dati, progresso, tabs (scheda / note / marca / simili), lista citazioni.
18. **In lettura** (modalità scura) — pagina di lettura con drop cap, evidenziazione gialla in stile sottolineato a matita, riquadro annotazione rapida con etichette, controlli pagina (+/−), progresso con stima fine.
19. **Annales wrap** (modalità scura) — versione verticale del wrap, condivisibile.

## 5. Interazioni & comportamento

### Interazioni globali
- **⌘K / Ctrl-K**: apre la ricerca avanzata (overlay).
- **Pan/zoom** del canvas solo nei prototipi di design — non è una feature dell'app finita.
- **Drag-reorder** dei volumi nella mappa fisica → aggiorna `collocazione`.
- **Long press** (mobile) su una copertina → menu rapido: aggiungi nota, sposta scaffale, segna come letto.

### Aggiungi libro
- Scan ISBN apre la camera (su mobile) o richiede l'input manuale (web).
- Cerca online: chiama Google Books → Open Library come fallback. Mostrare max 10 risultati con copertina, editore, anno.
- Selezione di un risultato precompila il form di destra. L'utente conferma lo stato iniziale (`da leggere` / `in lettura` / `letto`), lo scaffale e la collocazione.

### Lettura
- Tocca "▶ riprendi" → apre la pagina di lettura (per ora solo tracking, no testo intero: l'app non legge gli ebook, traccia letture cartacee).
- L'utente inserisce la pagina corrente manualmente (+/−). Una sessione si chiude dopo X minuti di inattività o all'uscita.
- Le sessioni alimentano le statistiche annuali e la heatmap di costanza.

### Note & citazioni
- Aggiunta rapida durante una sessione di lettura (riquadro persistente sotto la pagina).
- Sintassi: testo libero in corsivo, glossa sotto, tag con `#`. Pagina di provenienza obbligatoria.
- Da una citazione: link al libro, alla pagina; possibile cercare ricorrenze.

### Stati & validazioni
- Una collocazione è univoca: (stanza, libreria, ripiano, posizione). Spostando un libro su una posizione occupata, l'altro slitta.
- ISBN validato (10 o 13 cifre, checksum).
- Una citazione senza pagina mostra warning ma è ammessa (es. citazioni esterne).

### Animazioni
- Transizioni di pagina: fade-cross 180ms, easing `cubic-bezier(.4,.0,.2,1)`.
- Hover su copertina (web): sollevamento +2px con ombra rafforzata (160ms).
- Drag dorsi nella mappa: ombra+scala 1.02, "fantasma" sul ripiano sorgente.

### Responsive
- Sidebar collassa sotto 1024px in una topbar con menu hamburger.
- Griglia libreria: 9 col → 6 → 4 → 3 (mobile).
- Annales: layout 2-col bento → 1-col su mobile.

## 6. Stato (modello dati indicativo)

```ts
type Book = {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  year?: number;
  publisher?: string;
  language?: string;
  pages?: number;
  coverPalette: [string, string, string]; // bg, fg, accent — vedi BOOK_PALETTES
  coverVariant: 'monastic' | 'minimal' | 'illustrated';
  status: 'wishlist' | 'tbr' | 'reading' | 'read' | 'abandoned';
  currentPage?: number;
  shelves: string[];      // id di scaffale (collezione)
  location?: { room: string; bookcase: string; shelf: number; position: number };
  tags: string[];
  rating?: 1|2|3|4|5;
  favorite: boolean;
  addedAt: string; finishedAt?: string;
};

type Note = {
  id: string; bookId: string;
  page?: number;
  quote: string;          // citazione, serif italic
  gloss?: string;         // commento personale
  tags: string[];
  createdAt: string;
};

type Session = { id: string; bookId: string; startedAt: string; endedAt?: string; fromPage: number; toPage: number; };

type Shelf = { id: string; name: string; subtitle?: string; bookIds: string[]; };
type Room  = { id: string; name: string; bookcases: Bookcase[]; };
type Bookcase = { id: string; name: string; shelves: number; };
```

## 7. Design tokens

### Colori
```
--m-parchment    #f4ecd8   pergamena chiara — base
--m-parchment-2  #ebe0c4   pergamena scura — superfici elevate
--m-parchment-3  #ddcfa8   pergamena ingiallita — accenti
--m-ink          #2a1d10   inchiostro nero-bruno — testo principale
--m-ink-soft     #3a2a1a   testo secondario
--m-ink-muted    #6b5638   testo terziario / marginalia
--m-wood         #3a2a1a   legno scaffali
--m-wood-dark    #2a1d10   legno scuro / ombre
--m-terracotta   #7a3b2e   accento primario (titoli evidenziati, "preferito")
--m-terracotta-soft #9a5142
--m-vermilion    #a83a26   capilettera (rosso miniato)
--m-gold         #bfa15a   accento dorato (Annales, pulsanti)
--m-gold-deep    #9a7e3a
--m-gold-pale    #d8c389   testo su scuro
--m-lapis        #2a3a5a   accento freddo raro
--m-rule         rgba(58,42,26,0.22)  divisori sottili
--m-rule-strong  rgba(58,42,26,0.45)  divisori marcati
```

### Tipografia
- **Cormorant Garamond** — titoli, sottotitoli, citazioni (peso 400/500/600 + corsivo).
- **EB Garamond** — corpo, paragrafi, glossario (peso 400/500 + corsivo).
- **UnifrakturCook** — *solo* per il wordmark "Malachia" e capilettera miniati. **Mai** per testo di lettura.
- **JetBrains Mono** — ISBN, dati, metadati, hint da tastiera.

### Scala tipografica
```
display      60–120 px (Cormorant 500)
heading-1    40–46
heading-2    28–32
heading-3    22–24
body-lg      18 px (EB Garamond)
body         16 px
caption      13 px (italic muted)
eyebrow      12 px, small-caps, letter-spacing 0.22em
mono         11–14 px
```

### Spaziature
Scala a 4: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 60 / 80.

### Bordi & ombre
- **Niente border-radius** sul layout: le superfici sono squadrate come pagine. Solo le copertine hanno 1px di radius (carta tagliata).
- Ombre: ombre brevi, calde, mai sfumate (rendono "appiccicaticcio"). Per pulsanti elevati usare `2px 2px 0 rgba(0,0,0,0.18)` (effetto stampa).
- Le copertine usano: `inset 0 0 0 1px rgba(0,0,0,0.25), inset 4px 0 0 0 rgba(0,0,0,0.18), 2px 2px 0 rgba(0,0,0,0.18), 4px 4px 14px rgba(0,0,0,0.25)`.

### Texture "pergamena"
```css
.m-parchment {
  background-color: #f4ecd8;
  background-image:
    radial-gradient(ellipse at 20% 10%, rgba(191,161,90,0.10), transparent 60%),
    radial-gradient(ellipse at 80% 90%, rgba(122,59,46,0.08), transparent 55%),
    radial-gradient(circle at 50% 50%, rgba(122,59,46,0.04), transparent 70%);
}
```

### Ornamenti (SVG riusabili)
- **fleuron** (trifoglio stilizzato) — vedi `atoms.jsx` → `ORN.fleuron`.
- **croce florée** — `ORN.cross`.
- **rombo** (separatore piccolo) — `ORN.diamond`.
- **penna d'oca** — `ORN.quill`.
- **rule** — linea con rombo centrale per separazioni di paragrafo.

> Tutti gli ornamenti sono semplici (cerchi, archi, linee). Non disegnare draghi o miniature complesse — meglio uno spazio bianco di un ornamento mal riuscito.

## 8. Componenti chiave da implementare

| Componente | File di riferimento | Note |
|---|---|---|
| `BookCover` | `atoms.jsx` | 3 varianti, palette parametrica, generato CSS+SVG (no immagini) |
| `Initial` | `atoms.jsx` | Capilettera miniato (UnifrakturCook su sfondo vermiglio con bordo oro) |
| `Heading` | `atoms.jsx` | Eyebrow small-caps + titolo + italic accent |
| `Chip` | classe `m-chip` in `index.html` | Outline pergamena, varianti scura/preferito |
| `Button` | classe `m-btn` | 3 varianti: solid, ghost, gold |
| `Sidebar` | `screens-web.jsx` → `WebChrome` | Logo + nav small-caps + lista scaffali |
| `BookSpine` | `screens-web-2.jsx` → `WebMap` | Dorso verticale colorato con autore in vertical-rl |
| `Bookshelf` | `WebMap`, `WebShelves` | Ripiani in legno con dorsi inseriti |
| `QuoteCard` | `WebNotes`, `WebBookDetail` | Border-left terracotta 3px, citazione in corsivo serif |
| `StatCard` (Annales) | `WebAnnales` | Su sfondo scuro, numero grande oro, eyebrow chiaro |
| `Heatmap` | `WebAnnales` | Grid 14×7 di celle quadrate, opacità variabile |

## 9. Asset & risorse esterne

- **Font Google**: `Cormorant Garamond`, `EB Garamond`, `UnifrakturCook` (700), `JetBrains Mono`.
- **Nessuna immagine bitmap**: tutte le copertine sono renderizzate a runtime via React+CSS.
- **API esterne consigliate**: Google Books API, Open Library Covers, ISBNdb.

## 10. Cosa **non** è coperto dai mockup

- Onboarding (primo avvio): andrebbe progettato — suggerito 3 schermate: scegli stanze e libreria, importa CSV/Goodreads, primo libro.
- Impostazioni: tema chiaro/scuro globale, scelta lingua interfaccia, esportazione dati.
- Sincronizzazione fra dispositivi.
- Onboarding scanner ISBN (permessi camera).
- Stati di errore (nessuna connessione, ISBN non trovato).

## 11. File in questo bundle

```
design_handoff_malachia/
├── README.md              ← questo file
├── index.html             ← prototipo: design canvas con tutti gli artboard
├── design-canvas.jsx      ← shell pan/zoom (non rispecchiare nell'app)
├── ios-frame.jsx          ← scocca iPhone (solo per il prototipo)
├── atoms.jsx              ← BookCover, Initial, Heading, ORN — DA PORTARE
├── screens-brand.jsx      ← Marchio & sistema visivo
├── screens-web.jsx        ← Studio, Libreria, Dettaglio, Aggiungi
├── screens-web-2.jsx      ← Scaffali, Mappa, Note, Grafo, Annales, Search, Wishlist
└── screens-mobile.jsx     ← 5 schermate iPhone
```

Aprire `index.html` direttamente in un browser moderno mostra il canvas completo. I file `*.jsx` sono trasformati a runtime tramite Babel standalone (non richiede build).

---

*"Stat rosa pristina nomine, nomina nuda tenemus."*
