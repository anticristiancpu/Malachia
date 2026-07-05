const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const SHELF_COVERS_DIR = path.join(__dirname, '../../../uploads/shelf-covers');

// GET /api/shelves
router.get('/', (req, res) => {
  const db = getDb();
  const shelves = db.prepare(`
    SELECT s.*, COUNT(sb.book_id) as book_count FROM shelves s
    LEFT JOIN shelf_books sb ON s.id = sb.shelf_id GROUP BY s.id ORDER BY s.name
  `).all();
  res.json(shelves);
});

// GET /api/shelves/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const shelf = db.prepare('SELECT * FROM shelves WHERE id = ?').get(req.params.id);
  if (!shelf) return res.status(404).json({ error: 'Scaffale non trovato' });
  const books = db.prepare(`
    SELECT b.*, GROUP_CONCAT(a.name, '; ') as author_names
    FROM books b
    JOIN shelf_books sb ON b.id = sb.book_id
    LEFT JOIN book_authors ba ON ba.book_id = b.id
    LEFT JOIN authors a ON a.id = ba.author_id
    WHERE sb.shelf_id = ?
    GROUP BY b.id
    ORDER BY sb.added_at
  `).all(req.params.id);
  res.json({ ...shelf, books });
});

// POST /api/shelves
router.post('/', (req, res) => {
  const db = getDb();
  const { name, subtitle, description, shelf_type = 'custom', public: isPublic = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome richiesto' });
  const id = uuidv4();
  const share_token = crypto.randomBytes(8).toString('hex');
  db.prepare('INSERT INTO shelves (id, name, subtitle, description, shelf_type, public, share_token) VALUES (?,?,?,?,?,?,?)')
    .run(id, name, subtitle||null, description||null, shelf_type, isPublic?1:0, share_token);
  res.status(201).json(db.prepare('SELECT * FROM shelves WHERE id = ?').get(id));
});

// PATCH /api/shelves/:id
router.patch('/:id', (req, res) => {
  const db = getDb();
  const { name, subtitle, description, public: isPublic } = req.body;
  db.prepare('UPDATE shelves SET name=?, subtitle=?, description=?, public=? WHERE id=?')
    .run(name, subtitle||null, description||null, isPublic?1:0, req.params.id);
  res.json(db.prepare('SELECT * FROM shelves WHERE id = ?').get(req.params.id));
});

// DELETE /api/shelves/:id
router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM shelves WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/shelves/:id/books — aggiungi libro
router.post('/:id/books', (req, res) => {
  const db = getDb();
  const { book_id } = req.body;
  if (!book_id) return res.status(400).json({ error: 'book_id richiesto' });
  db.prepare('INSERT OR IGNORE INTO shelf_books (shelf_id, book_id) VALUES (?,?)').run(req.params.id, book_id);
  res.json({ ok: true });
});

// DELETE /api/shelves/:id/books/:bookId
router.delete('/:id/books/:bookId', (req, res) => {
  getDb().prepare('DELETE FROM shelf_books WHERE shelf_id = ? AND book_id = ?')
    .run(req.params.id, req.params.bookId);
  res.json({ ok: true });
});

// POST /api/shelves/:id/image — carica immagine di sfondo
router.post('/:id/image', (req, res) => {
  if (!fs.existsSync(SHELF_COVERS_DIR)) fs.mkdirSync(SHELF_COVERS_DIR, { recursive: true });
  if (!req.files?.image) return res.status(400).json({ error: 'File mancante' });
  const file = req.files.image;
  const ext  = path.extname(file.name) || '.jpg';
  const filename = `shelf-${req.params.id}${ext}`;
  const dest = path.join(SHELF_COVERS_DIR, filename);
  file.mv(dest, err => {
    if (err) return res.status(500).json({ error: err.message });
    const url = `/uploads/shelf-covers/${filename}`;
    getDb().prepare('UPDATE shelves SET cover_url = ? WHERE id = ?').run(url, req.params.id);
    res.json({ cover_url: url });
  });
});

// DELETE /api/shelves/:id/image — rimuovi immagine di sfondo
router.delete('/:id/image', (req, res) => {
  getDb().prepare('UPDATE shelves SET cover_url = NULL WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
