const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/publishers — lista editori con conteggio libri
router.get('/', (req, res) => {
  const db = getDb();
  const { search } = req.query;
  let where = "publisher IS NOT NULL AND publisher != ''";
  const params = [];
  if (search) { where += ' AND publisher LIKE ?'; params.push(`%${search}%`); }
  const publishers = db.prepare(`
    SELECT publisher AS name, COUNT(*) AS book_count
    FROM books
    WHERE ${where}
    GROUP BY publisher
    ORDER BY publisher COLLATE NOCASE
  `).all(...params);
  res.json({ publishers, total: publishers.length });
});

// GET /api/publishers/:name/books — libri di un editore
router.get('/:name/books', (req, res) => {
  const db = getDb();
  const name = req.params.name;
  const books = db.prepare(`
    SELECT b.*,
      (SELECT GROUP_CONCAT(a.name, ', ')
       FROM authors a JOIN book_authors ba ON a.id = ba.author_id
       WHERE ba.book_id = b.id ORDER BY ba.display_order) AS author_names
    FROM books b
    WHERE b.publisher = ?
    ORDER BY b.year DESC, b.title
  `).all(name);
  res.json({ publisher: name, books, total: books.length });
});

// GET /api/publishers/:name/series — collane di un editore
router.get('/:name/series', (req, res) => {
  const db = getDb();
  const name = req.params.name;
  const series = db.prepare(`
    SELECT series_name, COUNT(*) AS book_count
    FROM books
    WHERE publisher = ? AND series_name IS NOT NULL AND series_name != ''
    GROUP BY series_name
    ORDER BY book_count DESC, series_name ASC
  `).all(name);
  res.json({ publisher: name, series });
});

// POST /api/publishers/merge — rinomina/unisce editori
router.post('/merge', (req, res) => {
  const db = getDb();
  const { keep_name, merge_name } = req.body;
  if (!keep_name || !merge_name) return res.status(400).json({ error: 'keep_name e merge_name richiesti' });
  if (keep_name === merge_name) return res.status(400).json({ error: 'I nomi sono identici' });
  const result = db.prepare('UPDATE books SET publisher = ? WHERE publisher = ?').run(keep_name, merge_name);
  res.json({ ok: true, updated: result.changes });
});

module.exports = router;
