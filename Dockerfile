# syntax=docker/dockerfile:1

# ============================================================
# Stage 1 — Build del frontend (Vite → static files)
# ============================================================
FROM node:20-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ============================================================
# Stage 2 — Dipendenze backend (compila better-sqlite3)
# ============================================================
FROM node:20-bookworm-slim AS backend-deps
WORKDIR /app/backend
# Strumenti di build necessari se better-sqlite3 deve compilare da sorgente
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm ci --omit=dev

# ============================================================
# Stage 3 — Runtime
# ============================================================
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Codice backend + dipendenze già installate
COPY backend/ ./backend/
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules

# Frontend buildato, servito dal backend Express
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# I dati persistenti (database e uploads) sono montati come volumi a runtime.
EXPOSE 3001

CMD ["node", "backend/src/index.js"]
