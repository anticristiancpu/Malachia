#!/usr/bin/env bash
set -e

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   M a l a c h i a                   ║"
echo "  ║   bibliotheca privata                ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# Controlla Node.js
if ! command -v node &> /dev/null; then
    echo "  [ERRORE] Node.js non trovato. Scarica da https://nodejs.org"
    exit 1
fi

# Crea .env se non esiste
if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
    echo "  [OK] Creato file .env dalla configurazione di esempio"
fi

# Installa dipendenze se necessario
if [ ! -d node_modules ]; then
    echo "  [INFO] Installazione dipendenze root..."
    npm install --silent
fi
if [ ! -d backend/node_modules ]; then
    echo "  [INFO] Installazione dipendenze backend..."
    (cd backend && npm install --silent)
fi
if [ ! -d frontend/node_modules ]; then
    echo "  [INFO] Installazione dipendenze frontend..."
    (cd frontend && npm install --silent)
fi

echo ""
echo "  Avvio backend  → http://localhost:3001"
echo "  Avvio frontend → http://localhost:5173"
echo ""
echo "  Premi Ctrl+C per fermare."
echo ""

npm start
