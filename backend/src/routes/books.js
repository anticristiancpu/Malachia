const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads/covers');

// Helper: arricchisce libro con autori
function enrichBook(db, book, { full = true } = {}) {
  if (!book) return null;
  const authors = db.prepare(`
    SELECT a.*, ba.role, ba.display_order
    FROM authors a JOIN book_authors ba ON a.id = ba.author_id
    WHERE ba.book_id = ? ORDER BY ba.display_order
  `).all(book.id);
  const base = {
    ...book,
    tags: safeJson(book.tags, []),
    inscriptions: safeJson(book.inscriptions, []),
    cover_palette: safeJson(book.cover_palette, null),
    value_log: safeJson(book.value_log, []),
    authors,
  };
  // Nella lista/griglia non servono cronologia letture e prestiti attivi:
  // saltarle elimina 2 query per libro (problema N+1) e accelera il caricamento.
  if (!full) return base;
  const readingHistory = db.prepare(
    'SELECT * FROM reading_history WHERE book_id = ? ORDER BY date_start DESC'
  ).all(book.id);
  const loans = db.prepare(
    'SELECT * FROM loans WHERE book_id = ? AND active = 1 ORDER BY loan_date DESC LIMIT 1'
  ).get(book.id);
  return { ...base, reading_history: readingHistory, active_loan: loans || null };
}

function safeJson(val, fallback) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

// GET /api/books — lista con filtri
router.get('/', (req, res) => {
  const db = getDb();
  const {
    status, genre_id, author_id, shelf_id, format,
    language, year_from, year_to, rating_min, rating_max,
    tags, search, signed, favorite, active_loan, no_market_value,
    sort = 'added_at', dir = 'desc',
    page = 1, limit = 50
  } = req.query;

  let where = ['1=1'];
  const params = [];

  if (status) { where.push('b.status = ?'); params.push(status); }
  if (genre_id) { where.push('b.genre_id = ?'); params.push(genre_id); }
  if (format) { where.push('b.format = ?'); params.push(format); }
  if (language) { where.push('b.language = ?'); params.push(language); }
  if (year_from) { where.push('b.year >= ?'); params.push(Number(year_from)); }
  if (year_to) { where.push('b.year <= ?'); params.push(Number(year_to)); }
  if (signed === '1') { where.push('b.signed = 1'); }
  if (favorite === '1') { where.push('b.favorite = 1'); }
  if (active_loan === '1') {
    where.push('EXISTS (SELECT 1 FROM loans l WHERE l.book_id = b.id AND l.active = 1)');
  }
  if (no_market_value === '1') {
    where.push('(b.market_value IS NULL OR b.market_value = 0)');
  }
  if (author_id) {
    where.push('EXISTS (SELECT 1 FROM book_authors ba WHERE ba.book_id = b.id AND ba.author_id = ?)');
    params.push(author_id);
  }
  if (shelf_id) {
    where.push('EXISTS (SELECT 1 FROM shelf_books sb WHERE sb.book_id = b.id AND sb.shelf_id = ?)');
    params.push(shelf_id);
  }
  if (tags) {
    const tagList = tags.split(',').map(t => t.trim());
    for (const tag of tagList) {
      where.push("b.tags LIKE ?");
      params.push(`%"${tag}"%`);
    }
  }

  const validSorts = {
    title: 'b.title', author: 'a_sort.name_sort', year: 'b.year',
    added_at: 'b.added_at', pages: 'b.pages', updated_at: 'b.updated_at'
  };
  const sortCol = validSorts[sort] || 'b.added_at';
  const sortDir = dir === 'asc' ? 'ASC' : 'DESC';
  const offset = (Number(page) - 1) * Number(limit);

  const sql = `
    SELECT DISTINCT b.*,
      (SELECT GROUP_CONCAT(a.name, ', ') FROM authors a JOIN book_authors ba ON a.id = ba.author_id WHERE ba.book_id = b.id ORDER BY ba.display_order) as author_names
    FROM books b
    LEFT JOIN book_authors ba2 ON ba2.book_id = b.id AND ba2.display_order = 0
    LEFT JOIN authors a_sort ON a_sort.id = ba2.author_id
    WHERE ${where.join(' AND ')}
    ORDER BY ${sortCol} ${sortDir}
    LIMIT ? OFFSET ?
  `;
  params.push(Number(limit), offset);

  const total = db.prepare(`
    SELECT COUNT(DISTINCT b.id) as n FROM books b
    LEFT JOIN book_authors ba2 ON ba2.book_id = b.id AND ba2.display_order = 0
    LEFT JOIN authors a_sort ON a_sort.id = ba2.author_id
    WHERE ${where.join(' AND ')}
  `).get(...params.slice(0, -2)).n;

  const books = db.prepare(sql).all(...params);
  const enriched = books.map(b => enrichBook(db, b, { full: false }));

  res.json({ books: enriched, total, page: Number(page), limit: Number(limit) });
});

// GET /api/books/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Libro non trovato' });
  const notes = db.prepare('SELECT * FROM notes WHERE book_id = ? ORDER BY created_at DESC').all(book.id);
  const loans = db.prepare('SELECT * FROM loans WHERE book_id = ? ORDER BY loan_date DESC').all(book.id);
  const shelves = db.prepare(`
    SELECT s.* FROM shelves s JOIN shelf_books sb ON s.id = sb.shelf_id WHERE sb.book_id = ?
  `).all(book.id);
  const related = db.prepare(`
    SELECT b.*, rb.relation_type FROM books b JOIN related_books rb ON b.id = rb.related_id WHERE rb.book_id = ?
  `).all(book.id);
  res.json({ ...enrichBook(db, book), notes, loans, shelves, related });
});

// Genera numero inventario univoco
function generateInvNum(db) {
  let num, exists;
  do {
    num = 'CP' + String(Math.floor(100000 + Math.random() * 900000));
    exists = db.prepare('SELECT id FROM books WHERE inventory_number = ?').get(num);
  } while (exists);
  return num;
}

// POST /api/books
router.post('/', (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const {
    title, subtitle, original_title, publisher, publisher_place, year, edition, reprint,
    isbn10, isbn13, language, original_language, reading_language, pages,
    genre_id, series_name, series_volume, cover_url, cover_palette, cover_variant,
    synopsis, status, current_page, difficulty, location_room, location_bookcase,
    location_shelf, location_position, format, condition, acquisition, price,
    signed, tags, discovered_via, personal_notes, goodreads_id, google_books_id,
    open_library_id, amazon_asin, hardcover_id, authors = [], favorite,
    edition_type, print_run, copy_number, market_value,
    volumes_count, copies_owned
  } = req.body;

  const inventory_number = req.body.inventory_number || generateInvNum(db);

  db.prepare(`INSERT INTO books (
    id, title, subtitle, original_title, publisher, publisher_place, year, edition, reprint,
    isbn10, isbn13, language, original_language, reading_language, pages, genre_id,
    series_name, series_volume, cover_url, cover_palette, cover_variant,
    synopsis, status, current_page, difficulty, location_room, location_bookcase,
    location_shelf, location_position, format, condition, acquisition, price,
    signed, tags, discovered_via, personal_notes, goodreads_id, google_books_id,
    open_library_id, amazon_asin, hardcover_id, favorite, edition_type, print_run, copy_number,
    market_value, inventory_number, volumes_count, copies_owned
  ) VALUES (
    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
  )`).run(
    id, title, subtitle||null, original_title||null, publisher||null, publisher_place||null,
    year||null, edition||null, reprint||null, isbn10||null, isbn13||null, language||null,
    original_language||null, reading_language||null, pages||null, genre_id||null,
    series_name||null, series_volume||null, cover_url||null,
    cover_palette ? JSON.stringify(cover_palette) : null, cover_variant||'monastic',
    synopsis||null, status||'tbr', current_page||0, difficulty||null,
    location_room||null, location_bookcase||null, location_shelf||null, location_position||null,
    format||'paperback', condition||null, acquisition||null, price||null,
    signed?1:0, JSON.stringify(tags||[]), discovered_via||null, personal_notes||null,
    goodreads_id||null, google_books_id||null, open_library_id||null, amazon_asin||null,
    hardcover_id||null, favorite?1:0, edition_type||null, print_run||null, copy_number||null,
    market_value||null, inventory_number,
    volumes_count ? parseInt(volumes_count) : 1,
    copies_owned  ? parseInt(copies_owned)  : 1
  );

  // Inserisci autori
  for (let i = 0; i < authors.length; i++) {
    const { author_id, role = 'author' } = authors[i];
    if (!author_id) continue;
    db.prepare('INSERT OR IGNORE INTO book_authors (book_id, author_id, role, display_order) VALUES (?,?,?,?)')
      .run(id, author_id, role, i);
  }

  // Aggiorna FTS
  updateFts(db, id);

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  res.status(201).json(enrichBook(db, book));
});

// PATCH /api/books/:id
router.patch('/:id', (req, res) => {
  try {
    const db = getDb();
    const book = db.prepare('SELECT id FROM books WHERE id = ?').get(req.params.id);
    if (!book) return res.status(404).json({ error: 'Libro non trovato' });

    // Colonne effettivamente presenti nella tabella
    const existingCols = new Set(
      db.prepare('PRAGMA table_info(books)').all().map(r => r.name)
    );

    // Auto-migrazione: aggiunge colonne mancanti senza richiedere riavvio del server
    const pendingCols = [
      ['volumes_count', 'INTEGER DEFAULT 1'],
      ['copies_owned',  'INTEGER DEFAULT 1'],
      ['inventory_number', 'TEXT'],
    ];
    for (const [col, def] of pendingCols) {
      if (!existingCols.has(col)) {
        try {
          db.exec(`ALTER TABLE books ADD COLUMN ${col} ${def}`);
          existingCols.add(col);
        } catch {}
      }
    }

    const allowed = [
      'title','subtitle','original_title','publisher','publisher_place','year','edition','reprint',
      'isbn10','isbn13','language','original_language','reading_language','pages','genre_id',
      'series_name','series_volume','cover_url','cover_local','cover_palette','cover_variant',
      'synopsis','status','current_page','difficulty','location_room','location_bookcase',
      'location_shelf','location_position','format','condition','acquisition','price',
      'signed','tags','discovered_via','personal_notes','goodreads_id','google_books_id',
      'open_library_id','amazon_asin','hardcover_id','favorite','edition_type','print_run',
      'copy_number','market_value','for_sale','asking_price','inventory_number',
      'volumes_count','copies_owned',
      'spine_condition','foxing','underlinings','missing_pages','binding_condition',
      'smell_notes','provenance','previous_owners','ex_libris','stamps','manuscript_notes',
      'inscriptions','purchase_date','insurance_flag','insurance_value','insurance_policy'
    ];

    const updates = [];
    const params = [];
    for (const key of allowed) {
      if (!(key in req.body)) continue;
      if (!existingCols.has(key)) continue;   // salta colonne non ancora migrate
      const val = req.body[key];
      updates.push(`${key} = ?`);
      if (key === 'tags' || key === 'inscriptions' || key === 'cover_palette' || key === 'value_log') {
        params.push(typeof val === 'string' ? val : JSON.stringify(val));
      } else if (typeof val === 'boolean') {
        params.push(val ? 1 : 0);
      } else {
        params.push(val ?? null);
      }
    }

    if (updates.length === 0) {
      return res.json(enrichBook(db, db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id)));
    }

    updates.push("updated_at = datetime('now')");
    params.push(req.params.id);
    db.prepare(`UPDATE books SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // Aggiorna autori se forniti
    if (req.body.authors) {
      db.prepare('DELETE FROM book_authors WHERE book_id = ?').run(req.params.id);
      for (let i = 0; i < req.body.authors.length; i++) {
        const { author_id, role = 'author' } = req.body.authors[i];
        if (!author_id) continue;
        db.prepare('INSERT OR IGNORE INTO book_authors (book_id, author_id, role, display_order) VALUES (?,?,?,?)')
          .run(req.params.id, author_id, role, i);
      }
      // Cleanup autori orfani (nessun libro, nessuna bio/foto)
      try {
        const orphans = db.prepare(`
          SELECT id FROM authors
          WHERE id NOT IN (SELECT DISTINCT author_id FROM book_authors)
            AND (biography IS NULL OR biography = '')
            AND (photo_url IS NULL OR photo_url = '')
        `).all();
        for (const { id } of orphans) {
          db.prepare('DELETE FROM authors WHERE id = ?').run(id);
        }
      } catch {}
    }

    updateFts(db, req.params.id);
    try {
      res.json(enrichBook(db, db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id)));
    } catch {
      res.json(db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id) || {});
    }
  } catch(e) {
    console.error('PATCH /books/:id error:', e.message);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

// DELETE /api/books/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/books/:id/shelves — scaffali che contengono questo libro
router.get('/:id/shelves', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT shelf_id FROM shelf_books WHERE book_id = ?').all(req.params.id);
  res.json({ shelf_ids: rows.map(r => r.shelf_id) });
});

// POST /api/books/:id/page — aggiorna pagina corrente + crea sessione
router.post('/:id/page', (req, res) => {
  const db = getDb();
  const { page } = req.body;
  if (!page) return res.status(400).json({ error: 'page richiesta' });
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Libro non trovato' });

  db.prepare('UPDATE books SET current_page = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(page, req.params.id);

  // Crea sessione
  const sid = uuidv4();
  db.prepare(`INSERT INTO reading_sessions (id, book_id, started_at, ended_at, from_page, to_page)
    VALUES (?, ?, datetime('now'), datetime('now'), ?, ?)`
  ).run(sid, req.params.id, book.current_page || 0, page);

  res.json({ current_page: page });
});

// POST /api/books/:id/reading — aggiungi voce storico letture
router.post('/:id/reading', (req, res) => {
  const db = getDb();
  const { date_start, date_end, rating, notes } = req.body;
  const existing = db.prepare('SELECT COUNT(*) as n FROM reading_history WHERE book_id = ?').get(req.params.id);
  const id = uuidv4();
  db.prepare(`INSERT INTO reading_history (id, book_id, date_start, date_end, rating, notes, reread_number)
    VALUES (?,?,?,?,?,?,?)`
  ).run(id, req.params.id, date_start||null, date_end||null, rating||null, notes||null, existing.n + 1);

  if (date_end) {
    db.prepare("UPDATE books SET status = 'read', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  }
  res.status(201).json({ id });
});

// POST /api/books/:id/cover — upload copertina
router.post('/:id/cover', (req, res) => {
  if (!req.files?.cover) return res.status(400).json({ error: 'File mancante' });
  const file = req.files.cover;
  const ext = path.extname(file.name) || '.jpg';
  const filename = `${req.params.id}${ext}`;
  const dest = path.join(UPLOADS_DIR, filename);
  file.mv(dest, err => {
    if (err) return res.status(500).json({ error: err.message });
    const url = `/uploads/covers/${filename}`;
    getDb().prepare("UPDATE books SET cover_local = ?, updated_at = datetime('now') WHERE id = ?")
      .run(url, req.params.id);
    res.json({ url });
  });
});

// POST /api/books/covers/download-missing — scarica in locale le copertine che
// hanno solo un URL esterno. Il browser spesso non le mostra (http/hotlink/mixed
// content), ma il server può scaricarle senza quei limiti e servirle in locale.
router.post('/covers/download-missing', async (req, res) => {
  const db = getDb();
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const books = db.prepare(`
    SELECT id, cover_url FROM books
    WHERE (cover_local IS NULL OR cover_local = '')
      AND cover_url IS NOT NULL AND cover_url != ''
      AND cover_url LIKE 'http%'
  `).all();

  const upd = db.prepare("UPDATE books SET cover_local = ?, updated_at = datetime('now') WHERE id = ?");
  let downloaded = 0, failed = 0;
  const errors = [];

  for (const b of books) {
    try {
      const resp = await axios.get(b.cover_url, {
        responseType: 'arraybuffer',
        timeout: 12000,
        maxRedirects: 5,
        maxContentLength: 20 * 1024 * 1024,
        headers: { 'User-Agent': 'Mozilla/5.0 (Malachia cover fetcher)' },
        validateStatus: s => s >= 200 && s < 300,
      });
      const ct = String(resp.headers['content-type'] || '').toLowerCase();
      if (!ct.startsWith('image/')) throw new Error(`risposta non-immagine (${ct || 'sconosciuto'})`);
      const ext = ct.includes('png')  ? '.png'
                : ct.includes('webp') ? '.webp'
                : ct.includes('gif')  ? '.gif'
                : ct.includes('svg')  ? '.svg'
                : '.jpg';
      const filename = `${b.id}${ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), Buffer.from(resp.data));
      upd.run(`/uploads/covers/${filename}`, b.id);
      downloaded++;
    } catch (e) {
      failed++;
      if (errors.length < 15) errors.push({ id: b.id, url: b.cover_url, error: e.message });
    }
    await new Promise(r => setTimeout(r, 120)); // piccola pausa anti-rate-limit
  }

  res.json({ total: books.length, downloaded, failed, errors });
});

function updateFts(db, bookId) {
  try {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    if (!book) return;
    const authors = db.prepare(`SELECT a.name FROM authors a JOIN book_authors ba ON a.id = ba.author_id WHERE ba.book_id = ?`).all(bookId);
    const authorNames = authors.map(a => a.name).join(' ');
    db.prepare("DELETE FROM books_fts WHERE id = ?").run(bookId);
    db.prepare(`INSERT INTO books_fts (id, title, subtitle, original_title, author_names, publisher, synopsis, personal_notes, tags, isbn10, isbn13)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).run(bookId, book.title, book.subtitle||'', book.original_title||'', authorNames,
      book.publisher||'', book.synopsis||'', book.personal_notes||'',
      book.tags||'', book.isbn10||'', book.isbn13||'');
  } catch(e) { /* FTS non critico */ }
}

module.exports = router;
module.exports.updateFts = updateFts;
