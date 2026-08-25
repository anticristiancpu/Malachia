require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Assicura directory uploads
if (!fs.existsSync(path.join(UPLOADS_DIR, 'covers'))) {
  fs.mkdirSync(path.join(UPLOADS_DIR, 'covers'), { recursive: true });
}
if (!fs.existsSync(path.join(UPLOADS_DIR, 'backgrounds'))) {
  fs.mkdirSync(path.join(UPLOADS_DIR, 'backgrounds'), { recursive: true });
}

app.use(compression()); // gzip di JSON e asset: molto utile sul payload dell'intera libreria
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use(fileUpload({ limits: { fileSize: 20 * 1024 * 1024 }, useTempFiles: false }));
// Le immagini caricate non cambiano mai a parità di nome: le facciamo cacheare dal browser
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

// Semina iniziale: alla prima installazione le cartelle dei dati sono vuote,
// perché Umbrel le monta dall'host sopra quelle dell'immagine. Se l'immagine
// porta un seme, lo si copia una volta sola; da lì in poi comandano i dati
// dell'utente e il seme non viene più toccato.
const SEED_DIR = path.join(__dirname, '../../seed');

// Un catalogo è "da seminare" se il file non c'è, oppure se c'è ma è ancora
// senza libri: è il caso di un'installazione appena avviata, che crea il
// database vuoto prima che l'utente vi metta qualcosa dentro.
function catalogoVuoto(dbPath) {
  if (!fs.existsSync(dbPath)) return true;
  try {
    const Database = require('better-sqlite3');
    const db = new Database(dbPath, { readonly: true });
    let n = 0;
    try { n = db.prepare('SELECT COUNT(*) AS c FROM books').get().c; } catch { n = 0; }
    db.close();
    return n === 0;
  } catch {
    return false; // illeggibile: nel dubbio non si tocca
  }
}

function seminaSeVuoto(dbPath) {
  if (!fs.existsSync(SEED_DIR)) return;
  try {
    const semeDb = path.join(SEED_DIR, 'malachia-seed.db');
    if (fs.existsSync(semeDb) && catalogoVuoto(dbPath)) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      // Gli eventuali giornali WAL appartengono al database che stiamo sostituendo
      for (const suff of ['-wal', '-shm']) fs.rmSync(dbPath + suff, { force: true });
      fs.copyFileSync(semeDb, dbPath);
      console.log('  ✦ Catalogo iniziale installato');
    }
    for (const sub of ['covers', 'backgrounds']) {
      const src = path.join(SEED_DIR, sub);
      const dst = path.join(UPLOADS_DIR, sub);
      if (!fs.existsSync(src)) continue;
      fs.mkdirSync(dst, { recursive: true });
      if (fs.readdirSync(dst).length > 0) continue; // già popolata: non toccarla
      let n = 0;
      for (const f of fs.readdirSync(src)) {
        fs.copyFileSync(path.join(src, f), path.join(dst, f));
        n++;
      }
      if (n) console.log(`  ✦ ${n} immagini iniziali in ${sub}/`);
    }
  } catch (e) {
    console.warn('  Semina iniziale non riuscita:', e.message);
  }
}

// Inizializza DB all'avvio
const { getDb, DB_PATH } = require('./db');
seminaSeVuoto(DB_PATH);
getDb();
seedGenres();

// Routes
app.use('/api/books', require('./routes/books'));
app.use('/api/authors', require('./routes/authors'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/shelves', require('./routes/shelves'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/search', require('./routes/search'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/import', require('./routes/import'));
app.use('/api/genres', require('./routes/genres'));
app.use('/api/publishers', require('./routes/publishers'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/prices',   require('./routes/prices'));
app.use('/api/placement', require('./routes/placement'));

// Export CSV/JSON
app.get('/api/export/csv', (req, res) => {
  const db = getDb();
  const books = db.prepare(`
    SELECT b.*, GROUP_CONCAT(a.name, '; ') as author_names
    FROM books b LEFT JOIN book_authors ba ON ba.book_id=b.id LEFT JOIN authors a ON a.id=ba.author_id
    WHERE b.status != 'wishlist' GROUP BY b.id ORDER BY b.title
  `).all();
  const headers = ['id','title','subtitle','author_names','publisher','year','pages','isbn13','isbn10','language','status','format','genre_id','series_name','series_volume','location_room','location_bookcase','location_shelf','location_position','tags','personal_notes','goodreads_id','added_at'];
  const csv = [
    headers.join(','),
    ...books.map(b => headers.map(h => {
      const v = b[h] ?? '';
      return typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(','))
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="malachia_export.csv"');
  res.send('﻿' + csv);
});

app.get('/api/export/json', (req, res) => {
  const db = getDb();
  const books = db.prepare('SELECT * FROM books').all();
  res.setHeader('Content-Disposition', 'attachment; filename="malachia_export.json"');
  res.json(books);
});

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, version: '1.0.0' }));

// In produzione (Docker) serve il frontend buildato dallo stesso backend.
// In sviluppo la cartella non esiste e il blocco viene ignorato (usa Vite su :5173).
const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  // Fallback SPA: qualsiasi rotta non-API restituisce index.html
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ✦ Malachia avviato — http://localhost:${PORT}\n`);
});

function seedGenres() {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as n FROM genres').get().n;
  if (count > 0) return;
  const { v4: uuidv4 } = require('uuid');
  const genres = [
    { name: 'Narrativa', children: ['Romanzo', 'Racconto', 'Romanzo storico', 'Fantascienza', 'Fantasy', 'Noir/Giallo', 'Horror', 'Avventura'] },
    { name: 'Saggistica', children: ['Filosofia', 'Storia', 'Scienze', 'Arte', 'Musica', 'Cinema', 'Economia', 'Politica', 'Psicologia', 'Sociologia'] },
    { name: 'Poesia', children: ['Lirica', 'Epica', 'Drammatica'] },
    { name: 'Teatro', children: ['Tragedia', 'Commedia'] },
    { name: 'Fumetto', children: ['Manga', 'Graphic Novel', 'Fumetto europeo', 'Fumetto americano'] },
    { name: 'Classici', children: ['Antichità', 'Medioevo', 'Rinascimento', 'Illuminismo', 'Romanticismo'] },
    { name: 'Biografia', children: ['Autobiografia', 'Memorie', 'Diari'] },
    { name: 'Viaggi', children: [] },
    { name: 'Bambini e ragazzi', children: [] },
    { name: 'Manualistica', children: [] },
  ];
  for (const g of genres) {
    const parentId = uuidv4();
    const slug = g.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try { db.prepare('INSERT INTO genres (id, name, slug) VALUES (?,?,?)').run(parentId, g.name, slug); } catch {}
    for (const child of g.children) {
      const childId = uuidv4();
      const cs = child.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      try { db.prepare('INSERT INTO genres (id, name, parent_id, slug) VALUES (?,?,?,?)').run(childId, child, parentId, cs); } catch {}
    }
  }
}
