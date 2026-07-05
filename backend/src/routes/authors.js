const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// GET /api/authors
router.get('/', (req, res) => {
  const db = getDb();
  const { search, nationality, follow, page = 1, limit = 100 } = req.query;
  let where = ['1=1'];
  const params = [];
  if (search) { where.push('(a.name LIKE ? OR a.alternate_names LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (nationality) { where.push('a.nationality = ?'); params.push(nationality); }
  if (follow === '1') { where.push('a.follow = 1'); }
  const offset = (Number(page)-1)*Number(limit);
  const authors = db.prepare(`
    SELECT a.*, COUNT(ba.book_id) as book_count
    FROM authors a LEFT JOIN book_authors ba ON a.id = ba.author_id
    WHERE ${where.join(' AND ')}
    GROUP BY a.id ORDER BY a.name_sort LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);
  const total = db.prepare(`SELECT COUNT(*) as n FROM authors a WHERE ${where.join(' AND ')}`).get(...params).n;
  res.json({ authors, total });
});

// GET /api/authors/orphans — conta autori senza libri (preview)
// DEVE stare prima di /:id per non essere intercettata
router.get('/orphans', (req, res) => {
  const db = getDb();
  const { count } = db.prepare(`
    SELECT COUNT(*) as count FROM authors
    WHERE id NOT IN (SELECT DISTINCT author_id FROM book_authors WHERE author_id IS NOT NULL)
  `).get();
  res.json({ count });
});

// GET /api/authors/search/fuzzy?name=
// DEVE stare prima di /:id
router.get('/search/fuzzy', (req, res) => {
  const db = getDb();
  const { name } = req.query;
  if (!name) return res.json([]);
  const authors = db.prepare("SELECT * FROM authors WHERE name LIKE ? LIMIT 10").all(`%${name}%`);
  res.json(authors);
});

// GET /api/authors/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
  if (!author) return res.status(404).json({ error: 'Autore non trovato' });
  const books = db.prepare(`
    SELECT b.*, ba.role FROM books b JOIN book_authors ba ON b.id = ba.book_id WHERE ba.author_id = ? ORDER BY b.year
  `).all(req.params.id);
  res.json({ ...author, books });
});

// GET /api/authors/:id/wikipedia — biografie da Wikipedia
router.get('/:id/wikipedia', async (req, res) => {
  const db = getDb();
  const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
  if (!author) return res.status(404).json({ error: 'Autore non trovato' });
  try {
    const name = encodeURIComponent(author.name);
    const url = `https://it.wikipedia.org/api/rest_v1/page/summary/${name}`;
    const resp = await axios.get(url, { timeout: 8000 });
    res.json({ extract: resp.data.extract, thumbnail: resp.data.thumbnail?.source });
  } catch {
    res.status(503).json({ error: 'Wikipedia non raggiungibile' });
  }
});

// POST /api/authors
router.post('/', (req, res) => {
  const db = getDb();
  const { name, birth_date, death_date, nationality, biography, photo_url, viaf_id, isni, alternate_names } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome richiesto' });
  const id = uuidv4();
  const name_sort = makeSortName(name);
  db.prepare(`INSERT INTO authors (id, name, name_sort, birth_date, death_date, nationality, biography, photo_url, viaf_id, isni, alternate_names)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).run(id, name, name_sort, birth_date||null, death_date||null, nationality||null,
    biography||null, photo_url||null, viaf_id||null, isni||null,
    JSON.stringify(alternate_names||[]));
  res.status(201).json(db.prepare('SELECT * FROM authors WHERE id = ?').get(id));
});

// POST /api/authors/merge — unisce due autori
// DEVE stare prima di PATCH /:id per non essere intercettata (anche se è POST, è buona norma)
router.post('/merge', (req, res) => {
  const db = getDb();
  const { keep_id, merge_id } = req.body;
  if (!keep_id || !merge_id) return res.status(400).json({ error: 'keep_id e merge_id richiesti' });
  db.prepare('UPDATE book_authors SET author_id = ? WHERE author_id = ?').run(keep_id, merge_id);
  db.prepare('DELETE FROM authors WHERE id = ?').run(merge_id);
  res.json({ ok: true });
});

// PATCH /api/authors/:id
router.patch('/:id', (req, res) => {
  const db = getDb();
  const allowed = ['name','birth_date','death_date','nationality','biography','photo_url','viaf_id','isni','alternate_names','follow'];
  const updates = []; const params = [];
  for (const key of allowed) {
    if (key in req.body) {
      updates.push(`${key} = ?`);
      params.push(key === 'alternate_names' ? JSON.stringify(req.body[key]) : req.body[key]);
    }
  }
  if (req.body.name) { updates.push('name_sort = ?'); params.push(makeSortName(req.body.name)); }
  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);
  db.prepare(`UPDATE authors SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json(db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id));
});

// DELETE /api/authors/orphans — rimuove autori senza libri associati
// DEVE stare prima di /:id per non essere intercettata
router.delete('/orphans', (req, res) => {
  const db = getDb();
  const result = db.prepare(`
    DELETE FROM authors
    WHERE id NOT IN (SELECT DISTINCT author_id FROM book_authors WHERE author_id IS NOT NULL)
  `).run();
  res.json({ deleted: result.changes });
});

// DELETE /api/authors/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM authors WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

const SORT_PARTICLES = new Set([
  'de', 'di', 'del', 'della', 'degli', 'dei', "de'", "d'",
  'van', 'von', 'le', 'la', 'du', 'des', 'ten', 'ter', 'lo', 'al', 'el',
]);

function makeSortName(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.toLowerCase();
  // Risale all'indietro includendo particelle nobiliari nel cognome
  // Es. "Ernesto De Martino" → "de martino, ernesto"
  let surnameStart = parts.length - 1;
  for (let i = parts.length - 2; i >= 1; i--) {
    if (SORT_PARTICLES.has(parts[i].toLowerCase())) surnameStart = i;
    else break;
  }
  const surname = parts.slice(surnameStart).join(' ');
  const given   = parts.slice(0, surnameStart).join(' ');
  return `${surname}, ${given}`.toLowerCase();
}

module.exports = router;
