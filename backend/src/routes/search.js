const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/search?q=...
router.get('/', (req, res) => {
  const db = getDb();
  const { q = '', limit = 20 } = req.query;
  if (!q.trim()) return res.json({ books: [], notes: [], authors: [] });

  const term = `%${q}%`;

  // Libri
  const books = db.prepare(`
    SELECT b.id, b.title, b.subtitle, b.cover_palette, b.cover_variant, b.cover_url, b.cover_local, b.status, b.year,
      (SELECT a.name FROM authors a JOIN book_authors ba ON a.id=ba.author_id WHERE ba.book_id=b.id AND ba.display_order=0 LIMIT 1) as author_name
    FROM books b
    WHERE b.title LIKE ? OR b.subtitle LIKE ? OR b.isbn13 LIKE ? OR b.isbn10 LIKE ? OR b.personal_notes LIKE ?
    ORDER BY b.title LIMIT ?
  `).all(term, term, term, term, term, Number(limit));

  // Note
  const notes = db.prepare(`
    SELECT n.id, n.quote, n.gloss, n.page, b.title as book_title, b.id as book_id
    FROM notes n LEFT JOIN books b ON b.id = n.book_id
    WHERE n.quote LIKE ? OR n.gloss LIKE ? ORDER BY n.created_at DESC LIMIT ?
  `).all(term, term, Number(limit));

  // Autori
  const authors = db.prepare(`
    SELECT id, name, nationality, photo_url, (SELECT COUNT(*) FROM book_authors WHERE author_id = a.id) as book_count
    FROM authors a WHERE name LIKE ? OR alternate_names LIKE ? LIMIT ?
  `).all(term, term, Number(limit));

  res.json({ books, notes, authors });
});

// GET /api/search/advanced — sintassi campo:valore
router.get('/advanced', (req, res) => {
  const db = getDb();
  const { q = '' } = req.query;
  const parsed = parseAdvancedQuery(q);

  let where = ['1=1']; const params = [];
  if (parsed.fulltext) { where.push('(b.title LIKE ? OR b.synopsis LIKE ? OR b.personal_notes LIKE ?)'); const t = `%${parsed.fulltext}%`; params.push(t, t, t); }
  if (parsed.author) { where.push('EXISTS (SELECT 1 FROM authors a2 JOIN book_authors ba2 ON a2.id=ba2.author_id WHERE ba2.book_id=b.id AND a2.name LIKE ?)'); params.push(`%${parsed.author}%`); }
  if (parsed.genre) { where.push('EXISTS (SELECT 1 FROM genres g WHERE g.id=b.genre_id AND g.name LIKE ?)'); params.push(`%${parsed.genre}%`); }
  if (parsed.year_from) { where.push('b.year >= ?'); params.push(Number(parsed.year_from)); }
  if (parsed.year_to) { where.push('b.year <= ?'); params.push(Number(parsed.year_to)); }
  if (parsed.status) { where.push('b.status = ?'); params.push(parsed.status); }
  if (parsed.language) { where.push('b.language LIKE ?'); params.push(`%${parsed.language}%`); }
  if (parsed.rating) { where.push('EXISTS (SELECT 1 FROM reading_history rh WHERE rh.book_id=b.id AND rh.rating >= ?)'); params.push(Number(parsed.rating)); }

  const books = db.prepare(`
    SELECT b.*,
      (SELECT a.name FROM authors a JOIN book_authors ba ON a.id=ba.author_id WHERE ba.book_id=b.id AND ba.display_order=0 LIMIT 1) as author_name
    FROM books b WHERE ${where.join(' AND ')} ORDER BY b.title LIMIT 100
  `).all(...params);
  res.json({ books, query: parsed });
});

function parseAdvancedQuery(q) {
  const result = {};
  const patterns = {
    author: /autore:(\S+)/i,
    genre: /genere:(\S+)/i,
    year: /anno:(\d{4})(?:[-–](\d{4}))?/i,
    status: /stato:(\S+)/i,
    language: /lingua:(\S+)/i,
    rating: /valutazione:(\d)/i,
  };
  let remaining = q;
  for (const [key, re] of Object.entries(patterns)) {
    const m = remaining.match(re);
    if (m) {
      if (key === 'year') {
        result.year_from = m[1]; result.year_to = m[2] || m[1];
      } else {
        result[key] = m[1];
      }
      remaining = remaining.replace(m[0], '').trim();
    }
  }
  if (remaining.trim()) result.fulltext = remaining.trim().replace(/^["']|["']$/g, '');
  return result;
}

module.exports = router;
