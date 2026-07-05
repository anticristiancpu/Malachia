# Malachia — bibliotheca privata

> *"Stat rosa pristina nomine, nomina nuda tenemus."*
> — Bernardo di Cluny, XII sec.

Applicazione web full-stack per la gestione della biblioteca personale. Gira interamente in locale sul tuo computer. Il nome rinvia a Malachia da Hildesheim, il bibliotecario cieco de *Il nome della rosa* di Umberto Eco.

---

## Avvio in 3 passi

### Windows

```bat
cd "C:\percorso\verso\Malachia"
start.bat
```

### macOS / Linux

```bash
cd /percorso/verso/Malachia
chmod +x start.sh
./start.sh
```

### Manuale (tutti i sistemi)

```bash
# Prima installazione
npm run install:all

# Avvia
npm start
```

Apri il browser su **http://localhost:5173**

---

## Struttura

```
Malachia/
├── backend/          Node.js + Express + SQLite
│   └── src/
│       ├── db/       Schema e connessione database
│       ├── routes/   API REST
│       ├── services/ Google Books, Open Library, Goodreads
│       └── seed/     Dati iniziali (collezione Tolkieniana)
├── frontend/         React + Vite
│   └── src/
│       ├── components/   BookCover, Sidebar, Ornamenti...
│       ├── pages/        Studio, Libreria, Note, Scaffali...
│       └── api/          Client HTTP
├── uploads/          Copertine caricate dall'utente
├── .env              Configurazione (copia da .env.example)
├── malachia.db       Database SQLite (creato al primo avvio)
├── start.bat         Script avvio Windows
└── start.sh          Script avvio macOS/Linux
```

---

## Variabili d'ambiente (.env)

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `BACKEND_PORT` | `3001` | Porta backend |
| `FRONTEND_URL` | `http://localhost:5173` | URL frontend per CORS |
| `DB_PATH` | `./malachia.db` | Percorso database SQLite |
| `GOOGLE_BOOKS_API_KEY` | — | Chiave API Google Books (opzionale) |
| `HARDCOVER_TOKEN` | — | Token API Hardcover (opzionale) |
| `GRIMMORY_URL` | — | URL Grimmory (es. http://localhost:6060) |
| `GRIMMORY_USER` | — | Username Grimmory |
| `GRIMMORY_PASSWORD` | — | Password Grimmory |

---

## Integrazione Grimmory

[Grimmory](https://github.com/grimmory-tools/grimmory) è un gestore ebook self-hosted (Spring Boot + MariaDB, porta 6060 di default).

**Configurazione Grimmory:**
1. Nel file `.env` di Grimmory, imposta: `API_DOCS_ENABLED=true`
2. Riavvia Grimmory
3. In Malachia → Impostazioni, inserisci URL e credenziali

**Comportamento sync:**
- Malachia legge Grimmory in **sola lettura** — non scrive mai nel suo database
- I libri Grimmory appaiono con badge "Grimmory" nel catalogo
- La sync è manuale (su richiesta) o automatica (intervallo configurabile)
- Badge "Apri nel reader Grimmory" nella pagina di dettaglio ebook

**Formati supportati:** EPUB, MOBI, AZW, AZW3, FB2, PDF, CBZ, CBR, M4B, M4A, MP3, OPUS

---

## Importazione da Goodreads

### Metodo 1: CSV export (raccomandato)
1. Su Goodreads → Account → Impostazioni → Esporta libreria
2. Scarica `goodreads_library_export.csv`
3. In Malachia → Aggiungi libro → Importa CSV
4. Carica il file, verifica l'anteprima, conferma

### Metodo 2: Scraping (arricchimento metadati)
Disponibile in Aggiungi libro → Cerca online → fonte Goodreads.

> **Disclaimer:** Goodreads ha chiuso la sua API pubblica nel 2020. Malachia recupera metadati tramite scraping delle pagine pubbliche di goodreads.com. I risultati dipendono dalla disponibilità del sito e possono variare. L'uso è soggetto ai Termini di Servizio di Goodreads. Non viene effettuato alcun accesso autenticato.

---

## Google Books API

Senza chiave API funziona con rate limit più severo (~100 richieste/giorno per IP).

Per aumentare il limite:
1. Vai su [Google Cloud Console](https://console.cloud.google.com/apis/library/books.googleapis.com)
2. Abilita "Books API"
3. Crea una chiave API
4. Aggiungi in `.env`: `GOOGLE_BOOKS_API_KEY=AIzaSy...`

---

## Hardcover API

[Hardcover](https://hardcover.app) è un'alternativa moderna a Goodreads con API GraphQL gratuita.

1. Registrati su hardcover.app
2. Vai su Account → Sviluppatore
3. Genera un token API
4. Aggiungi in `.env`: `HARDCOVER_TOKEN=...`

---

## AbeBooks / viaLibri (Valore di mercato)

Per stimare il valore di mercato di copie rare:
- [AbeBooks](https://www.abebooks.com) — ricerca per ISBN o titolo
- [viaLibri](https://www.vialibri.net) — aggregatore di librerie antiquarie

Malachia mostra link diretti a queste fonti dalla pagina di dettaglio delle copie fisiche.

---

## Collezione Tolkieniana (seed)

Per caricare la collezione pre-configurata di 35 opere di Tolkien:

```bash
npm run seed:tolkien
```

Le opere appariranno nello scaffale "Tolkieniana" con stato "da leggere". Puoi poi aggiornare manualmente quali possiedi.

---

## Backup

- **Backup database:** Impostazioni → Backup database SQLite (scarica `malachia_backup_AAAA-MM-GG.db`)
- **Export CSV:** Impostazioni → Esporta CSV
- **Export JSON:** Impostazioni → Esporta JSON

Per ripristinare: sostituisci il file `malachia.db` nella root del progetto con il backup.

---

## API REST (backend)

Il backend espone un'API REST su `http://localhost:3001/api/`:

| Endpoint | Descrizione |
|----------|-------------|
| `GET /api/books` | Lista libri con filtri |
| `POST /api/books` | Crea libro |
| `GET /api/books/:id` | Dettaglio libro |
| `PATCH /api/books/:id` | Aggiorna libro |
| `GET /api/authors` | Lista autori |
| `GET /api/notes` | Note e citazioni |
| `GET /api/loans` | Prestiti |
| `GET /api/shelves` | Scaffali |
| `GET /api/wishlist` | Lista desideri |
| `GET /api/stats` | Statistiche |
| `POST /api/import/search` | Cerca su provider esterni |
| `POST /api/import/goodreads/csv` | Preview CSV Goodreads |
| `GET /api/search` | Ricerca full-text |
| `GET /api/export/csv` | Esporta catalogo CSV |
| `GET /api/export/json` | Esporta catalogo JSON |
| `GET /api/settings/backup` | Scarica backup SQLite |

---

*Malachia — custode dei tuoi libri.*
