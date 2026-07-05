const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

// GET /api/notes
router.get('/', (req, res) => {
  const db = getDb();
  const { book_id, tags, search, page = 1, limit = 50 } = req.query;
  let where = ['1=1']; const params = [];
  if (book_id) { where.push('n.book_id = ?'); params.push(book_id); }
  if (tags) {
    for (const tag of tags.split(',')) { where.push('n.tags LIKE ?'); params.push(`%"${tag.trim()}"%`); }
  }
  if (search) {
    where.push('(n.quote LIKE ? OR n.gloss LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  const offset = (Number(page)-1)*Number(limit);
  const notes = db.prepare(`
    SELECT n.*, b.title as book_title, b.cover_palette, b.cover_variant,
      (SELECT a.name FROM authors a JOIN book_authors ba ON a.id=ba.author_id WHERE ba.book_id=n.book_id AND ba.display_order=0 LIMIT 1) as author_name
    FROM notes n LEFT JOIN books b ON b.id = n.book_id
    WHERE ${where.join(' AND ')}
    ORDER BY n.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);
  const total = db.prepare(`SELECT COUNT(*) as n FROM notes n WHERE ${where.join(' AND ')}`).get(...params).n;
  res.json({ notes: notes.map(n => ({...n, tags: safeJson(n.tags, [])})), total });
});

// GET /api/notes/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!note) return res.status(404).json({ error: 'Nota non trovata' });
  res.json({...note, tags: safeJson(note.tags, [])});
});

// POST /api/notes
router.post('/', (req, res) => {
  const db = getDb();
  const { book_id, page, quote, gloss, note_type = 'quote', tags = [] } = req.body;
  if (!quote && !gloss) return res.status(400).json({ error: 'quote o gloss richiesti' });
  const id = uuidv4();
  db.prepare(`INSERT INTO notes (id, book_id, page, quote, gloss, note_type, tags) VALUES (?,?,?,?,?,?,?)`)
    .run(id, book_id||null, page||null, quote||null, gloss||null, note_type, JSON.stringify(tags));
  res.status(201).json(db.prepare('SELECT * FROM notes WHERE id = ?').get(id));
});

// PATCH /api/notes/:id
router.patch('/:id', (req, res) => {
  const db = getDb();
  const { page, quote, gloss, note_type, tags } = req.body;
  db.prepare(`UPDATE notes SET page=?, quote=?, gloss=?, note_type=?, tags=?, updated_at=datetime('now') WHERE id=?`)
    .run(page??null, quote??null, gloss??null, note_type||'quote', JSON.stringify(tags||[]), req.params.id);
  res.json(db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id));
});

// DELETE /api/notes/:id
router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/notes/tags/all — tutti i tag usati nelle note
router.get('/tags/all', (req, res) => {
  const db = getDb();
  const notes = db.prepare('SELECT tags FROM notes').all();
  const tagSet = new Set();
  for (const n of notes) {
    for (const t of safeJson(n.tags, [])) tagSet.add(t);
  }
  res.json([...tagSet].sort());
});

function safeJson(val, fallback) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

module.exports = router;
