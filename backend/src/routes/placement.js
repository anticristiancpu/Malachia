const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { buildTree, isValidSection, labelFor } = require('../placement/taxonomy');

// Campi minimi per disegnare una copertina nella griglia: niente payload inutile.
const CARD_FIELDS = `
  b.id, b.title, b.subtitle, b.year, b.publisher, b.cover_local, b.cover_url,
  b.cover_palette, b.cover_variant, b.placement_id, b.placement_at, b.added_at,
  (SELECT GROUP_CONCAT(a.name, ', ')
     FROM authors a JOIN book_authors ba ON a.id = ba.author_id
    WHERE ba.book_id = b.id ORDER BY ba.display_order) AS author_names,
  (SELECT a.name_sort
     FROM authors a JOIN book_authors ba ON a.id = ba.author_id
    WHERE ba.book_id = b.id ORDER BY ba.display_order LIMIT 1) AS author_sort
`;

// GET /api/placement/tree — tassonomia completa + conteggio libri per sezione
router.get('/tree', (req, res) => {
  const db = getDb();
  const counts = {};
  let placed = 0;
  for (const r of db.prepare(`
    SELECT placement_id AS id, COUNT(*) AS n FROM books
    WHERE placement_id IS NOT NULL AND placement_id <> '' AND status <> 'wishlist'
    GROUP BY placement_id
  `).all()) {
    counts[r.id] = r.n;
    placed += r.n;
  }
  const unplaced = db.prepare(`
    SELECT COUNT(*) AS n FROM books
    WHERE (placement_id IS NULL OR placement_id = '') AND status <> 'wishlist'
  `).get().n;

  res.json({ ...buildTree(), counts, totals: { placed, unplaced } });
});

// GET /api/placement/books?section=<id|unplaced>&search=&limit=&offset=
router.get('/books', (req, res) => {
  const db = getDb();
  const { section = 'unplaced', search = '', limit = 200, offset = 0 } = req.query;

  const where = ["b.status <> 'wishlist'"];
  const params = [];
  if (section === 'unplaced') {
    where.push("(b.placement_id IS NULL OR b.placement_id = '')");
  } else if (section !== 'all') {
    if (!isValidSection(section)) return res.status(400).json({ error: 'Sezione non valida' });
    where.push('b.placement_id = ?');
    params.push(section);
  }
  if (search.trim()) {
    where.push(`(b.title LIKE ? OR b.publisher LIKE ? OR EXISTS (
      SELECT 1 FROM authors a JOIN book_authors ba ON a.id = ba.author_id
      WHERE ba.book_id = b.id AND a.name LIKE ?))`);
    const q = `%${search.trim()}%`;
    params.push(q, q, q);
  }
  const whereSql = where.join(' AND ');

  const total = db.prepare(`SELECT COUNT(*) AS n FROM books b WHERE ${whereSql}`).get(...params).n;

  // Nei "Nuovi acquisti" conta l'ordine di arrivo; altrove l'ordine di scaffale (autore).
  const orderBy = section === 'nuovi-acquisti'
    ? 'b.added_at DESC'
    : "COALESCE(author_sort, '~') ASC, b.year ASC, b.title ASC";

  const books = db.prepare(`
    SELECT ${CARD_FIELDS} FROM books b
    WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, Number(limit), Number(offset));

  res.json({ books, total, section });
});

// PATCH /api/placement/books/:id — colloca (o rimuove la collocazione di) un libro
router.patch('/books/:id', (req, res) => {
  const db = getDb();
  const { placement_id } = req.body;
  if (placement_id !== null && placement_id !== '' && !isValidSection(placement_id)) {
    return res.status(400).json({ error: 'Sezione non valida' });
  }
  const exists = db.prepare('SELECT id FROM books WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Libro non trovato' });

  const value = placement_id || null;
  db.prepare(`UPDATE books SET placement_id = ?, placement_at = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(value, value ? new Date().toISOString() : null, req.params.id);

  res.json({ ok: true, id: req.params.id, placement_id: value, label: labelFor(value) });
});

// POST /api/placement/bulk — colloca più libri in una volta { ids: [], placement_id }
router.post('/bulk', (req, res) => {
  const db = getDb();
  const { ids, placement_id } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Nessun libro indicato' });
  if (placement_id !== null && placement_id !== '' && !isValidSection(placement_id)) {
    return res.status(400).json({ error: 'Sezione non valida' });
  }
  const value = placement_id || null;
  const at = value ? new Date().toISOString() : null;
  const upd = db.prepare(`UPDATE books SET placement_id = ?, placement_at = ?, updated_at = datetime('now') WHERE id = ?`);
  const tx = db.transaction(list => { for (const id of list) upd.run(value, at, id); });
  tx(ids);
  res.json({ ok: true, updated: ids.length, placement_id: value, label: labelFor(value) });
});

module.exports = router;
