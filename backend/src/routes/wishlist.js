const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

// GET /api/wishlist
router.get('/', (req, res) => {
  const db = getDb();
  const { priority, search } = req.query;
  let where = ['acquired = 0']; const params = [];
  if (priority) { where.push('priority = ?'); params.push(priority); }
  if (search) { where.push('(title LIKE ? OR author LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  const items = db.prepare(`SELECT * FROM wishlist WHERE ${where.join(' AND ')} ORDER BY priority DESC, added_at DESC`).all(...params);
  res.json(items.map(i => ({...i, tags: safeJson(i.tags, [])})));
});

// POST /api/wishlist
router.post('/', (req, res) => {
  const db = getDb();
  const { title, subtitle, author, year, isbn, priority = 'medium', estimated_price, shop_notes, shop_url, notes, cover_url, tags = [] } = req.body;
  if (!title) return res.status(400).json({ error: 'Titolo richiesto' });

  // Rilevamento duplicati
  const dup = db.prepare("SELECT id FROM books WHERE isbn13 = ? OR (title = ? AND title != '')").get(isbn||'__none__', title);
  const dupWish = db.prepare("SELECT id FROM wishlist WHERE isbn = ? AND acquired = 0").get(isbn||'__none__');

  const id = uuidv4();
  db.prepare(`INSERT INTO wishlist (id, title, subtitle, author, year, isbn, priority, estimated_price, shop_notes, shop_url, notes, cover_url, tags)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(id, title, subtitle||null, author||null, year||null, isbn||null, priority, estimated_price||null, shop_notes||null, shop_url||null, notes||null, cover_url||null, JSON.stringify(tags));

  res.status(201).json({
    ...db.prepare('SELECT * FROM wishlist WHERE id = ?').get(id),
    duplicate_book: dup?.id || null,
    duplicate_wish: dupWish?.id || null,
  });
});

// PATCH /api/wishlist/:id
router.patch('/:id', (req, res) => {
  const db = getDb();
  const { title, subtitle, author, year, isbn, priority, estimated_price, shop_notes, shop_url, notes, tags } = req.body;
  db.prepare(`UPDATE wishlist SET title=?, subtitle=?, author=?, year=?, isbn=?, priority=?, estimated_price=?, shop_notes=?, shop_url=?, notes=?, tags=? WHERE id=?`)
    .run(title, subtitle||null, author||null, year||null, isbn||null, priority||'medium', estimated_price||null, shop_notes||null, shop_url||null, notes||null, JSON.stringify(tags||[]), req.params.id);
  res.json(db.prepare('SELECT * FROM wishlist WHERE id = ?').get(req.params.id));
});

// DELETE /api/wishlist/:id
router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM wishlist WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/wishlist/:id/acquire — promuovi a catalogo
router.post('/:id/acquire', (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM wishlist WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Voce non trovata' });
  db.prepare("UPDATE wishlist SET acquired = 1 WHERE id = ?").run(req.params.id);
  res.json({
    ok: true,
    book_data: {
      title: item.title,
      subtitle: item.subtitle,
      isbn13: item.isbn,
      cover_url: item.cover_url,
      tags: safeJson(item.tags, []),
    }
  });
});

function safeJson(val, fallback) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

module.exports = router;
