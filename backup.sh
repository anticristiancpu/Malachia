#!/usr/bin/env bash
# Crea un backup completo di Malachia (database + immagini) di questa installazione.
#
# Uso:  ./backup.sh [cartella-destinazione]
# Se ometti la cartella, salva nella home (~). Produce malachia-backup-AAAAMMGG-HHMMSS.tar.gz
#
# Copiare data/ (con .db + -wal + -shm) e uploads/ insieme dà un backup consistente
# anche con l'app in esecuzione. Per la massima sicurezza puoi comunque fermarla prima:
#   sudo docker compose stop
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DEST="${1:-$HOME}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$DEST/malachia-backup-$STAMP.tar.gz"

ITEMS=()
[ -d "$ROOT/data" ]    && ITEMS+=(data)
[ -d "$ROOT/uploads" ] && ITEMS+=(uploads)

if [ ${#ITEMS[@]} -eq 0 ]; then
  echo "❌ Niente da salvare: non trovo data/ né uploads/ in $ROOT"
  exit 1
fi

mkdir -p "$DEST"
tar czf "$OUT" -C "$ROOT" "${ITEMS[@]}"

echo "✓ Backup creato: $OUT"
echo "  Dimensione:    $(du -h "$OUT" | cut -f1)"
echo "  Contiene:      ${ITEMS[*]}"
echo ""
echo "⚠️  Conservalo fuori dal PC (USB / disco esterno / cloud)."
