const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const SHELF_COVERS_DIR = path.join(__dirname, '../../../uploads/shelf-covers');

/* ══════════════════════════════════════════════════════════════════════════
   Scaffali — il "buon vicinato": libri accanto ai libri con cui dialogano.

   Lo scaffale non duplica il catalogo: tiene solo dei rimandi ai record, con
   un ordine. L'ordine sta in shelf_books.position, con valori distanziati di
   10, così per inserire un titolo in mezzo basta prendere il punto medio fra
   i due vicini, senza rinumerare l'intero scaffale.
   Le sezioni (shelf_sections) raggruppano i libri dentro uno scaffale; la
   sezione predefinita è semplicemente section_id vuoto.
   ══════════════════════════════════════════════════════════════════════════ */

const PASSO = 10;          // distanza fra due posizioni consecutive
const MIN_DIVARIO = 0.001; // sotto questa soglia conviene rinumerare

/* Un record conta come ebook se lo dice il tipo o, come paracadute, la rilegatura. */
const È_EBOOK = "(COALESCE(b.item_type,'cartaceo') = 'ebook' OR b.format = 'ebook')";
const È_OPERA = "(COALESCE(b.item_type,'cartaceo') = 'opera')";

/* Righe di uno scaffale, in ordine, con i dati minimi per disegnarle. */
function righeScaffale(db, shelfId) {
  return db.prepare(`
    SELECT b.*, sb.position, sb.section_id,
      (SELECT GROUP_CONCAT(a.name, '; ') FROM authors a
         JOIN book_authors ba ON a.id = ba.author_id
        WHERE ba.book_id = b.id ORDER BY ba.display_order) AS author_names
    FROM shelf_books sb
    JOIN books b ON b.id = sb.book_id
    WHERE sb.shelf_id = ?
    ORDER BY sb.position IS NULL, sb.position, b.title
  `).all(shelfId);
}

/* Rinumera una sezione a 10, 20, 30… quando lo spazio fra due vicini si esaurisce. */
function rinumera(db, shelfId, sectionId) {
  const righe = db.prepare(`
    SELECT book_id FROM shelf_books
    WHERE shelf_id = ? AND section_id IS ?
    ORDER BY position IS NULL, position
  `).all(shelfId, sectionId ?? null);
  const upd = db.prepare('UPDATE shelf_books SET position = ? WHERE shelf_id = ? AND book_id = ?');
  righe.forEach((r, i) => upd.run((i + 1) * PASSO, shelfId, r.book_id));
}

/* Posizione in coda a una sezione. */
function posizioneInCoda(db, shelfId, sectionId) {
  const r = db.prepare(`
    SELECT MAX(position) AS m FROM shelf_books WHERE shelf_id = ? AND section_id IS ?
  `).get(shelfId, sectionId ?? null);
  return (r?.m ?? 0) + PASSO;
}

/**
 * Posizione per inserire subito dopo un certo libro (o in testa se dopoId è null).
 * Prende il punto medio fra il vicino precedente e quello successivo; se non
 * c'è più spazio decimale, rinumera la sezione e riprova una volta sola.
 */
function posizioneDopo(db, shelfId, sectionId, dopoId) {
  const sid = sectionId ?? null;
  const elenco = db.prepare(`
    SELECT book_id, position FROM shelf_books
    WHERE shelf_id = ? AND section_id IS ?
    ORDER BY position IS NULL, position
  `).all(shelfId, sid);

  const i = dopoId ? elenco.findIndex(r => r.book_id === dopoId) : -1;
  const prima = i >= 0 ? (elenco[i].position ?? 0) : 0;
  const dopo  = elenco[i + 1]?.position;

  if (dopo == null) return prima + PASSO;          // in coda
  if (dopo - prima > MIN_DIVARIO) return (prima + dopo) / 2;

  rinumera(db, shelfId, sid);
  return posizioneDopo(db, shelfId, sid, dopoId);  // una sola ricorsione: ora c'è spazio
}

/* ── GET /api/shelves — indice, con conteggi per tipo ────────────────────── */
router.get('/', (req, res) => {
  const db = getDb();
  const scaffali = db.prepare(`
    SELECT s.*,
      COUNT(sb.book_id) AS book_count,
      COALESCE(SUM(CASE WHEN ${È_EBOOK} THEN 1 ELSE 0 END), 0) AS ebook_count,
      COALESCE(SUM(CASE WHEN ${È_OPERA} THEN 1 ELSE 0 END), 0) AS opera_count
    FROM shelves s
    LEFT JOIN shelf_books sb ON s.id = sb.shelf_id
    LEFT JOIN books b ON b.id = sb.book_id
    GROUP BY s.id
    ORDER BY s.name COLLATE NOCASE
  `).all();

  res.json(scaffali.map(s => ({
    ...s,
    kind: s.kind || 'tematico',
    // i cartacei sono quel che resta
    cartaceo_count: Math.max(0, s.book_count - s.ebook_count - s.opera_count),
  })));
});

/* ── GET /api/shelves/ebook-senza-scaffale — ebook non ancora collocati ────
   I record di tipo ebook che non stanno su nessuno scaffale. Da qui si possono
   aggiungere direttamente a uno scaffale e a una sezione.                    */
router.get('/ebook-senza-scaffale', (req, res) => {
  const db = getDb();
  const righe = db.prepare(`
    SELECT b.id, b.title, b.subtitle, b.year, b.publisher, b.cover_local, b.cover_url,
           b.item_type, b.format, b.ebook_external_id,
           (SELECT GROUP_CONCAT(a.name, ', ') FROM authors a
              JOIN book_authors ba ON a.id = ba.author_id
             WHERE ba.book_id = b.id) AS autori
      FROM books b
     WHERE ${È_EBOOK}
       AND NOT EXISTS (SELECT 1 FROM shelf_books sb WHERE sb.book_id = b.id)
     ORDER BY b.title COLLATE NOCASE`).all();
  res.json(righe);
});

/* ── GET /api/shelves/of-book/:bookId — in quali scaffali sta un record ──── */
router.get('/of-book/:bookId', (req, res) => {
  const db = getDb();
  res.json(db.prepare(`
    SELECT s.id, s.name, s.kind, sb.section_id
    FROM shelf_books sb JOIN shelves s ON s.id = sb.shelf_id
    WHERE sb.book_id = ?
    ORDER BY s.name COLLATE NOCASE
  `).all(req.params.bookId));
});

/* ── GET /api/shelves/:id — scaffale con sezioni e libri in ordine ───────── */
router.get('/:id', (req, res) => {
  const db = getDb();
  const shelf = db.prepare('SELECT * FROM shelves WHERE id = ?').get(req.params.id);
  if (!shelf) return res.status(404).json({ error: 'Scaffale non trovato' });

  const sections = db.prepare(`
    SELECT id, name, position FROM shelf_sections
    WHERE shelf_id = ? ORDER BY position IS NULL, position, created_at
  `).all(req.params.id);

  const books = righeScaffale(db, req.params.id);
  res.json({ ...shelf, kind: shelf.kind || 'tematico', sections, books });
});

/* ── POST /api/shelves — crea ───────────────────────────────────────────── */
router.post('/', (req, res) => {
  const db = getDb();
  const { name, subtitle, description, kind = 'tematico',
          shelf_type = 'custom', public: isPublic = 0 } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nome richiesto' });
  const id = uuidv4();
  db.prepare(`INSERT INTO shelves (id, name, subtitle, description, shelf_type, kind, public, share_token)
              VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, name.trim(), subtitle || null, description || null, shelf_type,
         kind === 'fisico' ? 'fisico' : 'tematico', isPublic ? 1 : 0,
         crypto.randomBytes(8).toString('hex'));
  res.status(201).json(db.prepare('SELECT * FROM shelves WHERE id = ?').get(id));
});

/* ── PATCH /api/shelves/:id — rinomina, nota, tipo ───────────────────────── */
router.patch('/:id', (req, res) => {
  const db = getDb();
  const attuale = db.prepare('SELECT * FROM shelves WHERE id = ?').get(req.params.id);
  if (!attuale) return res.status(404).json({ error: 'Scaffale non trovato' });

  const { name, subtitle, description, kind, public: isPublic } = req.body;
  db.prepare('UPDATE shelves SET name=?, subtitle=?, description=?, kind=?, public=? WHERE id=?').run(
    name !== undefined ? name : attuale.name,
    subtitle !== undefined ? (subtitle || null) : attuale.subtitle,
    description !== undefined ? (description || null) : attuale.description,
    kind !== undefined ? (kind === 'fisico' ? 'fisico' : 'tematico') : (attuale.kind || 'tematico'),
    isPublic !== undefined ? (isPublic ? 1 : 0) : attuale.public,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM shelves WHERE id = ?').get(req.params.id));
});

/* ── DELETE /api/shelves/:id — elimina solo lo scaffale, mai i record ────── */
router.delete('/:id', (req, res) => {
  const db = getDb();
  const posizioni = db.prepare('SELECT COUNT(*) AS n FROM shelf_books WHERE shelf_id = ?').get(req.params.id).n;
  db.prepare('DELETE FROM shelf_books WHERE shelf_id = ?').run(req.params.id);
  db.prepare('DELETE FROM shelf_sections WHERE shelf_id = ?').run(req.params.id);
  db.prepare('DELETE FROM shelves WHERE id = ?').run(req.params.id);
  res.json({ ok: true, posizioni_rimosse: posizioni });
});

/* ── POST /api/shelves/:id/books — inserisci un record nello scaffale ─────
   Corpo: { book_id, section_id?, after_book_id? }
   Senza after_book_id il record va in coda alla sezione.                   */
router.post('/:id/books', (req, res) => {
  const db = getDb();
  const { book_id, section_id = null, after_book_id = null } = req.body;
  if (!book_id) return res.status(400).json({ error: 'book_id richiesto' });

  const esiste = db.prepare('SELECT id FROM books WHERE id = ?').get(book_id);
  if (!esiste) return res.status(404).json({ error: 'Record non trovato in catalogo' });
  const giaPresente = db.prepare('SELECT 1 AS c FROM shelf_books WHERE shelf_id = ? AND book_id = ?')
    .get(req.params.id, book_id);
  if (giaPresente) return res.status(409).json({ error: 'Il record è già su questo scaffale' });

  const position = after_book_id
    ? posizioneDopo(db, req.params.id, section_id, after_book_id)
    : posizioneInCoda(db, req.params.id, section_id);

  db.prepare('INSERT INTO shelf_books (shelf_id, book_id, position, section_id) VALUES (?,?,?,?)')
    .run(req.params.id, book_id, position, section_id);
  res.status(201).json({ ok: true, position, section_id });
});

/* ── PATCH /api/shelves/:id/books/:bookId — riordina o cambia sezione ─────
   Corpo: { after_book_id?, section_id? }  (after_book_id null = in testa)  */
router.patch('/:id/books/:bookId', (req, res) => {
  const db = getDb();
  const riga = db.prepare('SELECT * FROM shelf_books WHERE shelf_id = ? AND book_id = ?')
    .get(req.params.id, req.params.bookId);
  if (!riga) return res.status(404).json({ error: 'Il record non è su questo scaffale' });

  const sezione = req.body.section_id !== undefined ? req.body.section_id : riga.section_id;
  const dopo = req.body.after_book_id ?? null;
  // Il libro non deve contare come vicino di se stesso mentre si ricalcola
  db.prepare('UPDATE shelf_books SET position = NULL WHERE shelf_id = ? AND book_id = ?')
    .run(req.params.id, req.params.bookId);
  const position = posizioneDopo(db, req.params.id, sezione, dopo);

  db.prepare('UPDATE shelf_books SET position = ?, section_id = ? WHERE shelf_id = ? AND book_id = ?')
    .run(position, sezione, req.params.id, req.params.bookId);
  res.json({ ok: true, position, section_id: sezione });
});

/* ── POST /api/shelves/:id/books/:bookId/transfer — sposta o copia ────────
   Corpo: { target_shelf_id, mode: 'move' | 'copy', section_id? }           */
router.post('/:id/books/:bookId/transfer', (req, res) => {
  const db = getDb();
  const { target_shelf_id, mode = 'move', section_id = null } = req.body;
  if (!target_shelf_id) return res.status(400).json({ error: 'target_shelf_id richiesto' });

  const destinazione = db.prepare('SELECT id FROM shelves WHERE id = ?').get(target_shelf_id);
  if (!destinazione) return res.status(404).json({ error: 'Scaffale di destinazione non trovato' });
  const origine = db.prepare('SELECT 1 AS c FROM shelf_books WHERE shelf_id = ? AND book_id = ?')
    .get(req.params.id, req.params.bookId);
  if (!origine) return res.status(404).json({ error: 'Il record non è sullo scaffale di partenza' });

  const esegui = db.transaction(() => {
    const presente = db.prepare('SELECT 1 AS c FROM shelf_books WHERE shelf_id = ? AND book_id = ?')
      .get(target_shelf_id, req.params.bookId);
    if (!presente) {
      db.prepare('INSERT INTO shelf_books (shelf_id, book_id, position, section_id) VALUES (?,?,?,?)')
        .run(target_shelf_id, req.params.bookId,
             posizioneInCoda(db, target_shelf_id, section_id), section_id);
    }
    if (mode === 'move') {
      db.prepare('DELETE FROM shelf_books WHERE shelf_id = ? AND book_id = ?')
        .run(req.params.id, req.params.bookId);
    }
    return !presente;
  });
  const inserito = esegui();
  res.json({ ok: true, mode, inserito_in_destinazione: inserito });
});

/* ── DELETE /api/shelves/:id/books/:bookId — toglie solo la posizione ───── */
router.delete('/:id/books/:bookId', (req, res) => {
  getDb().prepare('DELETE FROM shelf_books WHERE shelf_id = ? AND book_id = ?')
    .run(req.params.id, req.params.bookId);
  res.json({ ok: true });
});

/* ── Sezioni dentro uno scaffale ─────────────────────────────────────────── */

router.post('/:id/sections', (req, res) => {
  const db = getDb();
  const { name } = req.body;
  const id = uuidv4();
  const ultima = db.prepare('SELECT MAX(position) AS m FROM shelf_sections WHERE shelf_id = ?')
    .get(req.params.id);
  db.prepare('INSERT INTO shelf_sections (id, shelf_id, name, position) VALUES (?,?,?,?)')
    .run(id, req.params.id, name || null, (ultima?.m ?? 0) + PASSO);
  res.status(201).json(db.prepare('SELECT id, name, position FROM shelf_sections WHERE id = ?').get(id));
});

router.patch('/:id/sections/:sectionId', (req, res) => {
  const db = getDb();
  const sez = db.prepare('SELECT * FROM shelf_sections WHERE id = ? AND shelf_id = ?')
    .get(req.params.sectionId, req.params.id);
  if (!sez) return res.status(404).json({ error: 'Sezione non trovata' });
  const { name, position } = req.body;
  db.prepare('UPDATE shelf_sections SET name = ?, position = ? WHERE id = ?').run(
    name !== undefined ? (name || null) : sez.name,
    position !== undefined ? position : sez.position,
    req.params.sectionId
  );
  res.json(db.prepare('SELECT id, name, position FROM shelf_sections WHERE id = ?').get(req.params.sectionId));
});

/* Eliminando una sezione i suoi libri tornano nella sezione predefinita:
   restano sullo scaffale, non si perde nulla. */
router.delete('/:id/sections/:sectionId', (req, res) => {
  const db = getDb();
  const esegui = db.transaction(() => {
    db.prepare('UPDATE shelf_books SET section_id = NULL WHERE shelf_id = ? AND section_id = ?')
      .run(req.params.id, req.params.sectionId);
    db.prepare('DELETE FROM shelf_sections WHERE id = ? AND shelf_id = ?')
      .run(req.params.sectionId, req.params.id);
  });
  esegui();
  rinumera(db, req.params.id, null);
  res.json({ ok: true });
});

/* ── Immagine di sfondo dello scaffale (invariato) ───────────────────────── */
router.post('/:id/image', (req, res) => {
  if (!fs.existsSync(SHELF_COVERS_DIR)) fs.mkdirSync(SHELF_COVERS_DIR, { recursive: true });
  if (!req.files?.image) return res.status(400).json({ error: 'File mancante' });
  const file = req.files.image;
  const ext  = path.extname(file.name) || '.jpg';
  const filename = `shelf-${req.params.id}${ext}`;
  file.mv(path.join(SHELF_COVERS_DIR, filename), err => {
    if (err) return res.status(500).json({ error: err.message });
    const url = `/uploads/shelf-covers/${filename}`;
    getDb().prepare('UPDATE shelves SET cover_url = ? WHERE id = ?').run(url, req.params.id);
    res.json({ cover_url: url });
  });
});

router.delete('/:id/image', (req, res) => {
  getDb().prepare('UPDATE shelves SET cover_url = NULL WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
