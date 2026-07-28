#!/usr/bin/env bash
# Ripristina un backup completo di Malachia (database + immagini) in questo progetto.
#
# Uso:  ./restore.sh [percorso]
# Il percorso può essere:
#   - un archivio .tar.gz (creato da backup.sh o dal tar su Umbrel), oppure
#   - una CARTELLA copiata a mano (es. la anticristiancpu-malachia/ presa da Umbrel).
# Se lo ometti, cerca ~/malachia-backup.tar.gz
#
# In entrambi i casi individua da solo dove sono data/ e uploads/.
set -euo pipefail

BACKUP="${1:-$HOME/malachia-backup.tar.gz}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "→ Ripristino da: $BACKUP"

# Prepara la sorgente: se è una cartella la usa così com'è, se è un archivio lo estrae.
if [ -d "$BACKUP" ]; then
  SRCROOT="$BACKUP"
elif [ -f "$BACKUP" ]; then
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  tar xzf "$BACKUP" -C "$TMP"
  SRCROOT="$TMP"
else
  echo "❌ Non trovo né una cartella né un archivio a: $BACKUP"
  echo "   Uso: ./restore.sh /percorso/backup.tar.gz   oppure   ./restore.sh /percorso/cartella"
  exit 1
fi

# Se ci sono già dati, non li sovrascrivo alla cieca: li metto da parte con data/ora.
if [ -e "$ROOT/data" ] || [ -e "$ROOT/uploads" ]; then
  STAMP="$(date +%Y%m%d-%H%M%S)"
  echo "→ Trovati data/ o uploads/ esistenti: li sposto in *.bak-$STAMP"
  [ -e "$ROOT/data" ]    && mv "$ROOT/data"    "$ROOT/data.bak-$STAMP"
  [ -e "$ROOT/uploads" ] && mv "$ROOT/uploads" "$ROOT/uploads.bak-$STAMP"
fi

# Individua la cartella che contiene data/ e uploads/ (con o senza il wrapper Umbrel).
SRC="$SRCROOT/anticristiancpu-malachia"
[ -d "$SRC/data" ] || [ -d "$SRC/uploads" ] || SRC="$SRCROOT"

if [ ! -d "$SRC/data" ] && [ ! -d "$SRC/uploads" ]; then
  echo "❌ L'archivio non contiene né data/ né uploads/. Contenuto:"
  find "$TMP" -maxdepth 2 -type d
  exit 1
fi

[ -d "$SRC/data" ]    && cp -a "$SRC/data"    "$ROOT/data"
[ -d "$SRC/uploads" ] && cp -a "$SRC/uploads" "$ROOT/uploads"

echo ""
echo "✓ Ripristino completato:"
[ -d "$ROOT/data" ]    && echo "    database → $ROOT/data"
[ -d "$ROOT/uploads" ] && echo "    immagini → $ROOT/uploads"
echo ""
echo "Ora avvia Malachia:   sudo docker compose up -d --build"
echo "Poi apri nel browser: http://localhost:3001"
