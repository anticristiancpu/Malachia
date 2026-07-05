const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

// GET /api/loans
router.get('/', (req, res) => {
  const db = getDb();
  const { active, overdue } = req.query;
  let where = ['1=1']; const params = [];
  if (active === '1') { where.push('l.active = 1'); }
  if (active === '0') { where.push('l.active = 0'); }
  if (overdue === '1') {
    where.push("l.active = 1 AND l.expected_return IS NOT NULL AND l.expected_return < date('now')");
  }
  const loans = db.prepare(`
    SELECT l.*, b.title as book_title, b.cover_palette, b.cover_variant, b.cover_url, b.cover_local,
      (SELECT a.name FROM authors a JOIN book_authors ba ON a.id=ba.author_id WHERE ba.book_id=b.id AND ba.display_order=0 LIMIT 1) as author_name
    FROM loans l JOIN books b ON b.id = l.book_id
    WHERE ${where.join(' AND ')} ORDER BY l.loan_date DESC
  `).all(...params);
  res.json(loans);
});

// POST /api/loans
router.post('/', (req, res) => {
  const db = getDb();
  const { book_id, borrower_name, loan_date, expected_return, notes } = req.body;
  if (!book_id || !borrower_name || !loan_date) {
    return res.status(400).json({ error: 'book_id, borrower_name, loan_date richiesti' });
  }
  const id = uuidv4();
  db.prepare(`INSERT INTO loans (id, book_id, borrower_name, loan_date, expected_return, notes, active)
    VALUES (?,?,?,?,?,?,1)`
  ).run(id, book_id, borrower_name, loan_date, expected_return||null, notes||null);
  res.status(201).json(db.prepare('SELECT * FROM loans WHERE id = ?').get(id));
});

// PATCH /api/loans/:id/return — segna come restituito
router.patch('/:id/return', (req, res) => {
  const db = getDb();
  const date = req.body.date || new Date().toISOString().split('T')[0];
  db.prepare('UPDATE loans SET active = 0, actual_return = ? WHERE id = ?').run(date, req.params.id);
  res.json({ ok: true });
});

// GET /api/loans/overdue — prestiti scaduti
router.get('/overdue', (req, res) => {
  const db = getDb();
  const loans = db.prepare(`
    SELECT l.*, b.title as book_title FROM loans l JOIN books b ON b.id = l.book_id
    WHERE l.active = 1 AND l.expected_return IS NOT NULL AND l.expected_return < date('now')
    ORDER BY l.expected_return ASC
  `).all();
  res.json(loans);
});

module.exports = router;
