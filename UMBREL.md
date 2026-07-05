# Installare Malachia su UmbrelOS

UmbrelOS installa le app da un **community app store** (repo GitHub) che punta a
un'**immagine Docker già pubblicata** — Umbrel non compila dal sorgente. Servono
quindi **due repo**, entrambi tuoi:

| Repo | Ruolo |
|------|-------|
| `anticristiancpu/Malachia` (questo progetto) | Sorgente + `Dockerfile` + CI che pubblica l'immagine su GHCR |
| `anticristiancpu/appstore` (il tuo store) | Manifest dell'app che Umbrel legge per installarla |

I nomi (store id `anticristiancpu`, prefisso app, `APP_HOST`, `:latest`, icona via URL)
sono già allineati alle altre tue app (shelfmark, pkvault, …).

---

## Passo 1 — Pubblica l'immagine (repo `Malachia`)

1. Carica questo progetto su `https://github.com/anticristiancpu/Malachia`
   (assicurati che l'`icon.svg` nella root sia incluso: serve come icona dell'app).
2. Crea un tag versione per avviare la GitHub Action che builda e pubblica su GHCR:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. A build finita, su GitHub → **Packages** rendi il package `malachia` **Public**
   (così Umbrel lo scarica senza login).

L'immagine risultante è `ghcr.io/anticristiancpu/malachia:latest` — già referenziata
nel `docker-compose.yml` dell'app. La build è **multi-arch (x86 + ARM64)**, quindi
funziona sia su Umbrel Home sia su Raspberry Pi.

## Passo 2 — Aggiungi l'app allo store (repo `appstore`)

Copia la cartella **`anticristiancpu-malachia/`** di questo progetto nella root del
tuo repo `appstore`, accanto alle altre app. Contiene:

```
anticristiancpu-malachia/
├── umbrel-app.yml       # manifest (nome, versione, porta 8099, icona, descrizione)
└── docker-compose.yml   # servizio web + app_proxy, volumi su ${APP_DATA_DIR}
```

Poi committa e pusha lo store:
```bash
git add anticristiancpu-malachia
git commit -m "Aggiungi Malachia"
git push
```

## Passo 3 — Installa da Umbrel

1. Umbrel → **App Store** → **Community App Stores** → il tuo store `Anticristiancpu Store`.
   (Se non l'hai ancora aggiunto: incolla `https://github.com/anticristiancpu/appstore`.)
2. Trova **Malachia** → **Install**.

Alla prima installazione Umbrel crea la cartella dati in:
```
~/umbrel/app-data/anticristiancpu-malachia/
```

## Passo 4 — Porta il database attuale sul server

Per usare la **tua libreria esistente**, copia i dati dal PC dentro la cartella dati
dell'app. Fallo con l'app **ferma** (dalla dashboard: Stop):

```bash
# crea le cartelle di destinazione (se non esistono)
ssh umbrel@umbrel.local "mkdir -p ~/umbrel/app-data/anticristiancpu-malachia/data ~/umbrel/app-data/anticristiancpu-malachia/uploads"

# copia database e immagini (sostituisci umbrel.local con l'IP/hostname del tuo Umbrel)
scp -r ./data/*    umbrel@umbrel.local:~/umbrel/app-data/anticristiancpu-malachia/data/
scp -r ./uploads/* umbrel@umbrel.local:~/umbrel/app-data/anticristiancpu-malachia/uploads/
```

Riavvia l'app (Start): ora Malachia usa il tuo `malachia.db` originale con copertine
e sfondi. (Basta copiare `malachia.db`; i file `-wal`/`-shm` si ricreano da soli, ma
copiarli tutti e tre non fa danni.)

---

## Aggiornamenti futuri

1. Modifichi il codice → nuovo tag (`v1.0.1`) sul repo `Malachia` → la CI ripubblica
   `:latest`.
2. Nel repo `appstore` alza `version: "v1.0.1"` in `anticristiancpu-malachia/umbrel-app.yml`
   e pusha: Umbrel mostrerà l'aggiornamento disponibile.

## Note

- **Porta dashboard**: `8099` (campo `port`). Cambiala se confligge con un'altra tua app.
- **Dati persistenti**: `${APP_DATA_DIR}/data` → DB, `${APP_DATA_DIR}/uploads` → immagini.
  Nessun dato vive dentro l'immagine; per un backup copia queste due cartelle.
- **Icona**: `umbrel-app.yml` la referenzia via URL raw del repo Malachia
  (`.../Malachia/HEAD/icon.svg`). Se non dovesse comparire, convertila in PNG 256×256
  e aggiorna il campo `icon:`.
