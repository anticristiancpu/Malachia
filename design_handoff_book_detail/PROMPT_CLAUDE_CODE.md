# Prompt da incollare in Claude Code

> Copia la cartella `design_handoff_book_detail/` nella root del progetto Malachia,
> apri il progetto in Claude Code, e incolla il prompt qui sotto.

---

## ⤵ Prompt (copia da qui)

Ciao. Devi **ri-stilare** nel codebase Malachia la schermata **"Dettaglio libro"** descritta in `design_handoff_book_detail/README.md`. È un'aggiunta al ridisegno "cinematic" già fatto sulle altre 8 schermate.

## ⚠️ Regola d'oro — leggere PRIMA di tutto

**Questo NON è un greenfield.** La pagina di dettaglio libro **esiste già** nel codebase, con i suoi pulsanti, le sue azioni, i suoi metadati, i suoi tab/sezioni. Il tuo lavoro è **ri-skinarla nello stile cinematic**, NON riscriverla.

Quindi, **prima di toccare qualunque markup**:

1. Trova la pagina di dettaglio libro attuale nel codebase.
2. **Fai l'inventario** di TUTTO ciò che già fa: ogni pulsante, ogni dropdown, ogni campo metadato mostrato, ogni tab/sezione, ogni stato (preferito, stato lettura, ecc.), ogni interazione (modali, link, navigazioni). Scrivilo in una lista nella tua risposta prima di partire.
3. Mappa quell'inventario sul layout descritto in `README.md`:
   - La toolbar a 6 bottoni del nuovo design è un **bucket visivo** — se hai più azioni delle 6 descritte, **NON cancellarle**: aggiungile alla toolbar mantenendo lo stesso stile `IconBtn` (icona-only secondary, primary per quella più importante). Se ne hai meno, mostra solo quelle che esistono.
   - La striscia metadati (§6.3.3) è un **bucket visivo** per le coppie chiave/valore — se mostri già più metadati di quelli del prototipo, **mantienili tutti**, applicando lo stesso stile tipografico (chiave Cinzel uppercase 9px / valore Agmena 13px).
   - I 5 tab del prototipo (Sinossi · Frammenti · Note · Prestiti · Storico) sono indicativi: se nel codebase hai tab/sezioni diverse, **usa i nomi reali del prodotto**, non sostituirli ciecamente con questi.
4. **Non rimuovere nessuna funzionalità esistente** senza chiedermelo. Se qualcosa nel design del prototipo sembra contraddire qualcosa che già fa la pagina, **fermati e chiedimi** invece di scegliere unilateralmente.

In sintesi: **prendi i bottoni e le informazioni che hai già programmato, e RIDISEGNALI in questo stile**. Non ricostruire da zero.

---

**Prima di toccare codice:**

1. Apri e leggi **tutto** `design_handoff_book_detail/README.md`. È la specifica completa: tokens, layout, tipografia, comportamenti, edge case.
2. Apri brevemente `design_handoff_book_detail/preview/screens-cinematic-4.jsx` per vedere il prototipo React-in-browser. È **riferimento visivo**, non codice di produzione: gli inline-style sono lì solo perché è un mock standalone. Non copiarli verbatim — riporta l'intento (tokens, spacing, tipografia) nello stack/styling system di Malachia.
3. Verifica che i token cinematici (`--cine-cream`, `--cine-gold`, `--cine-text-shadow`, font-face `Cinzel` (Google Fonts) / `Agmena Pro`, ecc.) **siano già definiti** nel codebase dal precedente handoff. Se non lo sono: importali da §4 del README **prima** di iniziare. Non duplicarli se ci sono già.
4. Identifica nel codebase **dove vive oggi la pagina di dettaglio libro** (probabile route: `/libreria/[id]` o equivalente). Se non esiste ancora una pagina di dettaglio, crea il file/route nel pattern del codebase.

**Dimmi cosa hai trovato** prima di procedere, specialmente:

- la route attuale del dettaglio libro
- l'**inventario completo** di pulsanti, azioni, metadati, tab/sezioni che la pagina mostra OGGI
- quale componente "Cover" esiste e quale sarà ri-skinato vs. ri-implementato
- la mappatura: per ogni elemento esistente, dove finisce nel nuovo layout (toolbar / meta strip / tab / titolo / fuori dalla pagina)
- se qualche elemento esistente non ha un posto ovvio nel nuovo layout — **chiedimi** invece di tagliarlo
- se manca qualcosa di critico, segnalalo prima di iniziare a codare.

**Step 1 — Skeleton + colonna sinistra:**

- Implementa la route con la `CinematicShell` (top bar "Libreria" attivo, backdrop, grain).
- Implementa il grid `1fr 1fr` con `gap: 56px` (vedi §6.2 README), e il link "Indietro" sopra (§6.1).
- Implementa la **colonna sinistra**: copertina 380×540 con il box-shadow stack (§6.3.1), toolbar 6 bottoni icona (§6.3.2), striscia metadati (§6.3.3).
- Per la copertina: **riusa il vero componente "Cover"** del codebase con i metadati reali — non ricreare le label SVG-overlay del prototipo (quelle sono solo placeholder visivi per il mock).
- Tutti gli `onClick` della toolbar possono essere ancora `console.log` in questa fase; le wireremo al vero state nello Step 3.

Quando finisci lo Step 1, **mostrami uno screenshot** della pagina con un libro reale dal database — voglio vedere la copertina + toolbar + meta strip funzionanti, prima di andare avanti.

**Step 2 — Colonna destra (testata + tab + Sinossi):**

- Eyebrow + titolo 46px + autore (§6.4.1–6.4.3).
- Tab bar a 5 voci con underline vermilion sull'attivo (§6.4.4). Default: "Sinossi". Lo stato del tab attivo è locale alla pagina.
- Contenuto del tab "Sinossi" con scroll mascherato (`mask-image` linear-gradient), paragrafi (§6.4.5.a), pull-quote (§6.4.5.b), paragrafo outro (§6.4.5.c), micro-meta footer (§6.4.5.d).
- Per la pull-quote: **caricala dai frammenti realmente salvati** dall'utente; se ce ne sono ≥1, mostra il primo (o quello featured); se 0, **ometti il blocco** (no placeholder).
- I 3 paragrafi della sinossi vengono dal campo `synopsis` (o `description`) del modello libro. Se il campo è vuoto, mostra una italica grigia "Sinossi non disponibile" centrata e niente pull-quote né outro.
- Le date nei micro-meta: per ora formato italiano standard (`12 marzo 2026`). Il formato romano del prototipo (`XII martii MMXXVI`) è un nice-to-have, non bloccante.

Quando finisci lo Step 2, **un altro screenshot** con un libro che ha sinossi + un frammento salvato. Verifico tipografia, spacing, mask del scroll.

**Step 3 — Wiring delle azioni + tab non-Sinossi:**

- Cabla i 6 bottoni della toolbar (§7 "Toolbar azioni"): Nota, Cambia stato, Preferiti, Modifica, Stima valore, Elimina. Riusa i flow/modal esistenti del codebase — non reinventarli.
- Implementa i contenuti dei tab **Frammenti, Note, Prestiti, Storico** leggendo dai model esistenti. Se uno di questi non esiste ancora come feature, mostra un empty-state appropriato (vedi suggerimenti in §7 README) e **dimmelo**, non inventare un model nuovo unilateralmente.
- Il link "Indietro" naviga via `router.back()` con fallback `/libreria` se l'history è vuoto.
- Click su Elimina → conferma → se confermato, redirect a `/libreria`.

**Convenzioni e vincoli:**

- ❌ **Niente `border-radius`** da nessuna parte di questa pagina.
- ❌ Niente `<script src=https://unpkg…>` — usa lo stack del codebase (Next/Vite/Remix/qualunque sia).
- ❌ Niente inline-style copiati a mano dal prototipo — porta i valori nei CSS modules / Tailwind / styled-components / qualunque sia il sistema di styling Malachia.
- ❌ Non rimuovere logica di business esistente sulla scheda libro — questo è un re-skin + ristrutturazione del layout, non una riscrittura del data layer.
- ❌ Non rimuovere pulsanti, azioni, metadati, tab o sezioni che la pagina mostra già. Se non hanno un posto ovvio nel nuovo layout, **chiedi**, non tagliare.
- ❌ Non aggiungere pulsanti/sezioni nuove solo perché compaiono nel prototipo (es. "Stima valore" se non esiste già un flow nel codebase). Mantieni l'inventario reale dell'app.
- ✅ Il font heading è **Cinzel** (Google Fonts — `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap')`). Il font body è **Agmena Pro**: il file `AgmenaPro-Regular.ttf` sta in `design_handoff_book_detail/fonts/` se non lo avessi già installato dal precedente handoff.
- ✅ Tutti i corsivi sono ottenuti via `font-style: italic` sintetizzato — è una scelta accettata (vedi §5 README). Non aggiungere un secondo font file italico ora.
- ✅ Mostrami screenshot dopo Step 1, Step 2, e Step 3, e fammi domande in batch invece di tirare a indovinare quando le spec sono ambigue.

Pronto?

---

## Note operative per te (utente)

Quando incolli il prompt, ricorda a Claude Code:

- I file della **specifica** stanno in `design_handoff_book_detail/README.md` (testo completo) e `design_handoff_book_detail/preview/screens-cinematic-4.jsx` (riferimento visivo).
- I **font** stanno in `design_handoff_book_detail/fonts/` (sono identici a quelli del precedente handoff — se già installati in static assets, non serve duplicarli).
- Se Claude Code chiede dove si applica il vermilion: **solo sull'underline del tab attivo**. Da nessun'altra parte in questa pagina.
- Se chiede dell'aspect-ratio responsive della cover, dìgli: "non priorità ora, desktop-first, mantieni 380×540 a 1280-wide e scala proporzionalmente".
- Se il bottone "Stima valore" non ha già un flow nel codebase, fagli emettere `console.warn` e segnalarlo come domanda aperta — non inventare un flow ex novo senza chiedere.

## Per testare il prototipo prima di mandarlo a Claude Code

```bash
cd design_handoff_book_detail/preview
python -m http.server 8000
# apri http://localhost:8000/
```

Dovresti vedere la schermata "Dettaglio libro" da sola, scalata in viewport con letterbox.
