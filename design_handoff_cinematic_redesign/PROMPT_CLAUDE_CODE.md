# Prompt da incollare in Claude Code

Apri il tuo progetto Malachia in Claude Code, copia questa cartella `design_handoff_cinematic_redesign/` nella root del progetto, e incolla il seguente prompt nella prima conversazione:

---

Ciao. Devi migrare l'interfaccia di Malachia dal tema attuale "parchment / manuscript" al nuovo tema "cinematic / game-UI" descritto in `design_handoff_cinematic_redesign/README.md`.

**Prima di toccare codice:**

1. Apri e leggi tutto `design_handoff_cinematic_redesign/README.md` — è la spec completa con design tokens, tipografia, regole, e specifica schermata-per-schermata.
2. Apri brevemente i file in `design_handoff_cinematic_redesign/preview/` per confermare visivamente cosa vado a portare in produzione (sono prototipi React-in-browser, **non da copiare alla lettera**).
3. Mappa le 8 schermate del README (Studio, Libreria, Autori, Editori, Scaffali, Collezione Tolkien, Desiderata, Annales) sulle componenti/route corrispondenti del codebase Malachia. Se manca qualcosa, segnalamelo prima di iniziare.

**Step 1 — Fondamenta (theme + chrome):**

- Installa i due font custom dalla cartella `design_handoff_cinematic_redesign/fonts/` negli static assets dell'app:
  - `Mantinia-Regular.otf` (headings)
  - `AgmenaPro-Regular.ttf` (body)
  - Carica entrambi via `@font-face` come da snippet nel README §5. Le fallback chain sono `Mantinia, Cinzel, Cormorant Garamond, serif` per headings e `Agmena Pro, Georgia, serif` per body.
- Aggiungi i design tokens (colori, ombre, spacing) come variabili CSS o token del design system esistente, prendendoli da README §5.
- Sostituisci la chrome attuale (sidebar + top bar) con la nuova **top bar unica** (README §7): 7 tab + dropdown per Autori/Editori sotto "Libreria" + counters volumi/valore + 3 bottoni icona (Cerca, Aggiungi, Impostazioni).
- Implementa il sistema di sfondo: una singola immagine app-wide caricata dall'utente (vedi README §6 + §12). Conservala in user-preferences, applicala come `background` del body o di un `<img>` fixed full-bleed sotto tutto. Aggiungi l'overlay gradient + grain.

Quando finisci lo Step 1, mostrami una preview di una qualsiasi schermata con la nuova chrome e il fondo applicati, prima di andare avanti.

**Step 2 — Schermate, in quest'ordine:**

1. **Studio** (home). README §8.1. Importante:
   - Niente metriche nel body — solo l'emblema sigillo SVG dietro al titolo, "MALACHIA" in Mantinia 148px, prompt "Entra nello studio" in basso con underglow, riga di credits al fondo, ember particles animate.
   - Il pulsante hover "Cambia sfondo" in basso a destra deve aprire il file picker per cambiare l'immagine di sfondo app-wide.
2. **Libreria** — README §8.2.
3. **Autori** — README §8.3.
4. **Editori** — README §8.4.
5. **Scaffali** — README §8.5.
6. **Collezione (Tolkien)** — README §8.6.
7. **Desiderata** — README §8.7.
8. **Annales** — README §8.8.

Dopo ogni schermata, fammi vedere uno screenshot o linka la dev-server preview prima di passare alla successiva. Se trovi ambiguità nelle spec, fammi le domande in batch invece di tirare a indovinare.

**Cose da NON fare:**

- Non importare React/Babel via `<script>` da unpkg come fa il prototipo — usa il framework che già c'è.
- Non copiare gli inline-style del prototipo come sono — sono inline solo perché è un mock React-in-browser. Usa CSS/Tailwind/CSS-modules/styled-components o quello che il codebase già usa.
- Non aggiungere `border-radius` da nessuna parte. Tutto è a spigolo vivo.
- Non rimuovere logica di business esistente — sto chiedendo un re-skin, non una riscrittura.

Pronto?

---

## Note operative

- Se Claude Code chiede dove sono i font, ricordagli che stanno in `design_handoff_cinematic_redesign/fonts/`.
- Se sbaglia a far apparire il sigillo SVG dello Studio, mostragli `preview/screens-cinematic.jsx` cercando `function WebDashboardCinematic` — lì c'è il riferimento esatto.
- Se i particle embers sembrano fuori posto, le keyframes `cine-emberA` / `cine-emberB` sono definite nello stesso file dentro un `<style>` JSX block — copiale 1-a-1.
- Per il bottone "Cambia sfondo" hover-expand, l'animazione è una transizione di `max-width` 250ms da 0 a 160px sullo span del label.
