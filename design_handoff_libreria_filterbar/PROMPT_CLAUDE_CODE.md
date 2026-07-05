# Prompt da incollare in Claude Code

> Copia la cartella `design_handoff_libreria_filterbar/` nella root del progetto Malachia,
> apri il progetto in Claude Code, e incolla il prompt qui sotto.

---

## ⤵ Prompt (copia da qui)

Ciao. Devi **ri-stilare** nel codebase Malachia la pagina **Libreria** — in particolare la **barra dei filtri** + le due viste (Griglia e Lista) che vivono sotto di essa. La spec completa è in `design_handoff_libreria_filterbar/README.md`. È un'aggiunta al ridisegno "cinematic" già fatto sulle altre 8 schermate.

## ⚠️ Regola d'oro — leggere PRIMA di tutto

**Questo NON è un greenfield.** La pagina Libreria **esiste già** con la sua testata "Capitulum II · Libreria · 543 volumi", la sua filter-row a chip (Tutti · Letti · In lettura · Da leggere · € senza valore · filtri), il suo sort, il suo toggle griglia/lista, le sue colonne lista, i suoi flow di selezione/click/hover. Il tuo lavoro è **fondere tutto questo in una singola "lit strip" orizzontale + ridisegnare il body sotto**, NON riscriverla.

Quindi, **prima di toccare qualunque markup**:

1. Apri la pagina Libreria attuale nel codebase. Fai l'**inventario completo** di TUTTO ciò che già fa:
   - Tutti i chip/filtri (stato lettura + filtri speciali + range valore + tag + scaffale + qualunque cosa)
   - Tutti i criteri di ordinamento
   - Tutte le azioni della top-area (cerca, aggiungi libro, settings, esporta…)
   - Le **colonne reali** della vista lista (numero, ordine, contenuto)
   - Lo stato di selezione/hover/last-opened della cover/riga
   - Drag-and-drop di riordino, multi-select, qualunque interazione attiva
2. Scrivimi questo inventario nella tua prima risposta, **prima di codare**.
3. Mappa l'inventario sul nuovo layout (vedi §8 README):
   - Chip stato lettura → check-list dentro il popover **Filtri**
   - Filtri speciali → sezione "speciali" del popover
   - Criteri sort → popover **Ordina**
   - Search → icona magnifier nella striscia (apre la search-modal/command-palette esistente)
   - View toggle → segmented `Griglia | Lista` dentro la striscia
   - Count → counter `n/total` a destra della striscia
   - Colonne lista → identiche, solo restilizzate
4. **Non rimuovere niente** senza chiedere. Se qualche elemento esistente non ha un posto ovvio nel nuovo layout, chiedi.
5. **Non aggiungere niente** che non esista già (no "Preferiti" se non hai il model, no "Senza valore" se non hai il flow di stima).

In sintesi: **prendi i filtri, i sort, le azioni, le colonne che hai già programmato, e RIDISEGNALI in questo stile**. Non ricostruire da zero.

## Prima di toccare codice

1. Leggi **tutto** `design_handoff_libreria_filterbar/README.md` — è la spec completa: tokens, layout della striscia, vista griglia, vista lista, comportamenti, edge case, regole.
2. Apri `design_handoff_libreria_filterbar/preview/libreria.jsx` per il riferimento visivo. È **mock standalone**, non codice di produzione: gli inline-style sono lì solo perché è un prototipo Babel-in-browser. Non copiarli verbatim — porta i valori (tokens, spacing, tipografia) nello stack/styling system di Malachia.
3. Verifica che i token cinematici (`--cine-cream`, `--cine-gold`, `--cine-vermilion`, `--cine-text-shadow`, font-face `Cinzel` (Google Fonts) / `Agmena Pro`) **siano già definiti** dal precedente handoff. Se mancano, importali da §3 del README.
4. Identifica nel codebase la route della pagina Libreria (probabile: `/libreria` o equivalente) e il file componente.

**Dimmi cosa hai trovato** prima di procedere, in particolare:

- la route attuale e il file componente
- l'**inventario completo** elencato sopra
- la **mappatura** proposta: per ogni elemento esistente, dove finisce nel nuovo layout
- segnala qualunque elemento esistente che non ha un posto ovvio — **non tagliarlo unilateralmente**

## Step 1 — La lit strip + toggle Griglia|Lista

- Sostituisci la testata `CinePageTitle "Capitulum II · Libreria · 543 volumi"` + la `filter row` corrente con la nuova **lit strip** (§4 README).
- Layout: section label a sinistra, Filtri + Ordina al centro-sinistra, spacer, Cerca + toggle Griglia|Lista + counter a destra.
- Il **toggle Griglia|Lista** deve funzionare end-to-end fin da subito: cambia il body sotto senza navigation, persiste in `localStorage` o nelle user-pref. Default: **griglia**.
- I bottoni **Filtri** e **Ordina** possono ancora aprire `console.log("TODO: open popover")` in questa fase — i popover veri li facciamo nello Step 3.
- L'icona **Cerca** apre la search-modal esistente (nessun input inline nella striscia).

Quando finisci lo Step 1, **screenshot** con il toggle in entrambe le posizioni. Verifico la striscia, le tipografie, il counter.

## Step 2 — Vista Griglia (primaria)

- Sotto la striscia, griglia di copertine. Riusa il componente `Cover` reale del codebase. Mantieni il **count colonne attuale** del codebase (probabile 8) — la spec del prototipo (7 colonne 132×190) è indicativa.
- Implementa lo stato "active" della copertina con anello oro + glow (§5.1 README): è il sostituto visivo della "row attiva" della reference Skyrim.
- Label sotto cover: titolo Agmena 12px cream + autore italic 11px cream-72%.
- Lo scroll è di pagina (la striscia NON è sticky in questo step — chiedimi prima di renderla sticky).

## Step 3 — Vista Lista + popover Filtri/Ordina

- Column header in Cinzel micro 9px tracking 0.26em cream-55%, allineamento per colonna (testo sx, numeri/stato dx). **Usa le colonne reali del codebase**, non quelle del prototipo.
- Righe lista con border-bottom hairline gold-10%, hover crema-04%, active-row con luce orizzontale + barra oro a sinistra (§6.2 README).
- Cabla i popover **Filtri** e **Ordina** ai veri model/flow del codebase. Lo styling del popover replica quello della top-bar `NavTab` dropdown (background `rgba(14,9,5,0.92)`, border gold-32%, backdrop-blur 8px, no border-radius).
- La tail-label italica accanto a "Filtri" / "Ordina" nella striscia **riflette lo stato corrente** (§7.2-7.3 README).

Quando finisci lo Step 3, **screenshot finale** di entrambe le viste (griglia + lista) con un paio di filtri attivi per verificare la tail-label e il counter.

## Convenzioni e vincoli

- ❌ **Niente `border-radius`** da nessuna parte di questa pagina.
- ❌ Niente inline-style copiati a mano dal prototipo — porta i valori nel sistema di styling del codebase.
- ❌ Non rimuovere pulsanti, filtri, criteri di sort, colonne, interazioni esistenti. Se non hanno un posto ovvio nel nuovo layout, **chiedi**, non tagliare.
- ❌ Non aggiungere filtri/sort nuovi solo perché compaiono nel prototipo. Mantieni l'inventario reale dell'app.
- ❌ Non animare la lit-strip (no shimmer, no pulse).
- ❌ Non rendere la striscia sticky al top scroll senza approvazione design.
- ❌ Non rimpiazzare la search-modal globale con un input inline.
- ✅ Il font heading è **Cinzel** (Google Fonts — `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap')`). Il file `AgmenaPro-Regular.ttf` sta in `design_handoff_libreria_filterbar/fonts/` se non già installato dal precedente handoff.
- ✅ Tutti i corsivi via `font-style: italic` sintetizzato — coerente con gli handoff precedenti.
- ✅ Mostrami screenshot dopo Step 1, Step 2, Step 3, e fammi domande in batch invece di tirare a indovinare quando le spec sono ambigue.

Pronto?

---

## Note operative per te (utente)

Quando incolli il prompt, ricorda a Claude Code:

- I file di spec stanno in `design_handoff_libreria_filterbar/README.md` (testo completo) e `design_handoff_libreria_filterbar/preview/libreria.jsx` (riferimento visivo con toggle funzionante).
- Il font Agmena Pro sta in `design_handoff_libreria_filterbar/fonts/` (Cinzel viene da Google Fonts).
- Se Claude Code chiede dove va l'azione "Aggiungi libro" (oggi nella top-bar accanto a Settings): rimane lì, **fuori dalla lit-strip**. La striscia gestisce solo filtraggio/ordinamento/vista della collezione, non azioni globali.
- Se chiede se la striscia deve essere sticky: per ora **no**. Decideremo dopo il primo round.
- Se chiede dell'aspetto responsive sotto 980px: **non in questo round**, desktop-first.

## Testare il prototipo

```bash
cd design_handoff_libreria_filterbar/preview
python -m http.server 8000
# apri http://localhost:8000/
```

Il toggle Griglia|Lista nella striscia funziona — usalo per confrontare le due viste con la stessa lit-strip.
