# Malachia in Docker

L'app è impacchettata in **un unico container**: il backend Express serve sia le
API sia il frontend React già buildato. Il **database attuale** (`data/malachia.db`)
e la cartella `uploads/` vengono montati come volumi, quindi i tuoi dati restano
intatti e persistono tra un riavvio e l'altro.

## Prerequisiti
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installato e avviato.

## Avvio
Dalla cartella del progetto:

```bash
docker compose up -d --build
```

Poi apri **http://localhost:3001**

- `-d` = in background. Ometti `-d` per vedere i log a schermo.
- Il primo build richiede qualche minuto (compila le dipendenze e builda il frontend).

## Comandi utili
```bash
docker compose logs -f        # vedere i log in tempo reale
docker compose restart        # riavviare
docker compose down           # fermare e rimuovere il container
docker compose up -d --build  # ricostruire dopo modifiche al codice
```

## Dove finiscono i dati
Tutto ciò che conta vive **fuori** dal container, montato come volume:

| Sul tuo PC            | Nel container   | Contenuto                          |
|-----------------------|-----------------|------------------------------------|
| `./data/malachia.db`  | `/app/data`     | Database SQLite (+ file WAL/SHM)   |
| `./uploads/`          | `/app/uploads`  | Copertine, sfondi, immagini varie  |

Per fare un backup basta copiare la cartella `data/` (e `uploads/` per le immagini).

## Cambiare porta
Se la porta 3001 è occupata, modifica in `docker-compose.yml`:
```yaml
    ports:
      - "8080:3001"   # ora l'app è su http://localhost:8080
```

## Nota
Il vecchio flusso di sviluppo (`./start.sh` con Vite su :5173 + backend su :3001)
continua a funzionare come prima: il database è stato spostato in `data/` e il codice
punta già lì di default, sia in locale sia in Docker.
