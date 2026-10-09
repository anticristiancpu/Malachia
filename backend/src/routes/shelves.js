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
   Le sezioni (shelf_sections) sono etichette messe nella fila insieme ai
   libri, nello stesso spazio di posizioni: un libro appartiene all'ultima
   etichetta che lo precede. Quelli prima della prima etichetta sono i
   "nuovi arrivi" (section_id vuoto). Vedi "La fila" più sotto.
   ══════════════════════════════════════════════════════════════════════════ */

const PASSO = 10;          // distanza fra due posizioni consecutive
const MIN_DIVARIO = 0.001; // sotto questa soglia conviene rinumerare
// L'etichetta dei record che non stanno in nessuna sezione. Non è una riga di
// tabella: il frontend la chiama con questo nome e il backend la riconosce.
const SEZIONE_BASE = '__base__';

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

/* Attacca a ogni record il riferimento al suo ebook, se ne ha uno confermato.
   I link si compongono qui, da BOOKORBIT_URL e dal file piu' recente dello
   specchio: non sono salvati e non si rompono se il file viene sostituito. */
function conEbook(db, righe) {
  let perLibro = new Map();
  try {
    for (const r of db.prepare(
      'SELECT id, book_id, file_id, stato FROM bookorbit_items WHERE book_id IS NOT NULL'
    ).all()) perLibro.set(r.book_id, r);
  } catch { return righe; }   // specchio non ancora creato
  if (!perLibro.size) return righe;

  const bo = require('../bookorbit/client');
  return righe.map(b => {
    const e = perLibro.get(b.id);
    if (!e) return b;
    return {
      ...b,
      ebook: {
        bookorbit_id: e.id,
        orfano: e.stato === 'orfano',
        link_scheda: bo.linkScheda(e.id),
        link_lettore: bo.linkLettore(e.id, e.file_id),
      },
    };
  });
}

/* Rinumera una sezione a 10, 20, 30… quando lo spazio fra due vicini si esaurisce. */
/* ══ La fila ═══════════════════════════════════════════════════════════════
   Uno scaffale è una fila sola: libri ed etichette, ciascuno con la sua
   posizione nello stesso spazio. Spostare un'etichetta è come spostare un
   libro: cambia posizione, e i libri che la seguono, fino alla successiva,
   diventano suoi. section_id resta scritto sui libri ma è sempre ricavato
   dalla fila con normalizza(): chi lo legge (menu, conteggi) non deve sapere
   com'è fatta.                                                              */

const stesso = (a, b) => a && b && a.tipo === b.tipo && a.id === b.id;

function fila(db, shelfId, escludi = null) {
  const etichette = db.prepare('SELECT id, position FROM shelf_sections WHERE shelf_id = ?').all(shelfId)
    .map(e => ({ tipo: 'etichetta', id: e.id, position: e.position ?? 0 }));
  const libri = db.prepare('SELECT book_id AS id, position FROM shelf_books WHERE shelf_id = ?').all(shelfId)
    .map(b => ({ tipo: 'libro', id: b.id, position: b.position ?? 0 }));
  return [...etichette, ...libri]
    .filter(x => !stesso(x, escludi))
    // a parità di posizione l'etichetta viene prima del libro
    .sort((a, b) => (a.position - b.position) || (a.tipo === b.tipo ? 0 : a.tipo === 'etichetta' ? -1 : 1));
}

/* Rinumera l'intera fila a 10, 20, 30… quando lo spazio decimale finisce. */
function rinumera(db, shelfId) {
  const updL = db.prepare('UPDATE shelf_books SET position = ? WHERE shelf_id = ? AND book_id = ?');
  const updE = db.prepare('UPDATE shelf_sections SET position = ? WHERE id = ?');
  fila(db, shelfId).forEach((x, i) => {
    if (x.tipo === 'libro') updL.run((i + 1) * PASSO, shelfId, x.id);
    else updE.run((i + 1) * PASSO, x.id);
  });
}

/* Posizione subito dopo `dopo` ({ tipo, id }); null = in testa alla fila.
   `escludi` è l'elemento che si sta spostando: non conta come vicino. */
function posizioneDopo(db, shelfId, dopo, escludi = null, giaRinumerato = false) {
  const f = fila(db, shelfId, escludi);
  if (!f.length) return PASSO;
  let i = -1;
  if (dopo) {
    i = f.findIndex(x => stesso(x, dopo));
    if (i < 0) i = f.length - 1;                   // riferimento sparito: in coda
  }
  if (i === -1) return f[0].position - PASSO;      // in testa
  const prima = f[i].position;
  const succ = f[i + 1]?.position;
  if (succ === undefined) return prima + PASSO;    // in coda
  if (succ - prima > MIN_DIVARIO) return (prima + succ) / 2;
  if (giaRinumerato) return prima + MIN_DIVARIO / 2;
  rinumera(db, shelfId);                           // una sola volta: ora c'è spazio
  return posizioneDopo(db, shelfId, dopo, escludi, true);
}

/* L'ultimo elemento del gruppo di un'etichetta (sectionId null = i nuovi
   arrivi in testa): un libro messo "in fondo" a quel gruppo va dopo di lui.
   null se il gruppo è vuoto e sta in testa. */
function codaDelGruppo(db, shelfId, sectionId, escludi = null) {
  const f = fila(db, shelfId, escludi);
  let i = -1;
  if (sectionId) {
    i = f.findIndex(x => x.tipo === 'etichetta' && x.id === sectionId);
    if (i < 0) return f.length ? f[f.length - 1] : null;   // etichetta sparita: in coda
  }
  while (f[i + 1] && f[i + 1].tipo !== 'etichetta') i++;
  return i >= 0 ? f[i] : null;
}

function posizioneInCoda(db, shelfId, sectionId, escludi = null) {
  return posizioneDopo(db, shelfId, codaDelGruppo(db, shelfId, sectionId, escludi), escludi);
}

/* Riscrive section_id di ogni libro leggendo la fila. Se i nuovi arrivi
   erano stati tolti ma qualche libro è finito in testa, tornano visibili:
   un libro non deve mai stare in un posto che non si vede. */
function normalizza(db, shelfId) {
  let corrente = null, inTesta = 0;
  const upd = db.prepare('UPDATE shelf_books SET section_id = ? WHERE shelf_id = ? AND book_id = ?');
  db.transaction(() => {
    for (const x of fila(db, shelfId)) {
      if (x.tipo === 'etichetta') corrente = x.id;
      else { upd.run(corrente, shelfId, x.id); if (!corrente) inTesta++; }
    }
    if (inTesta) db.prepare('UPDATE shelves SET base_hidden = 0 WHERE id = ? AND base_hidden = 1').run(shelfId);
  })();
}

/* Dove va un libro arrivato senza sezione. Di solito sui nuovi arrivi; ma se
   quel ripiano è stato tolto va sulla prima sezione, altrimenti finirebbe in
   un posto che non si vede. Se lo scaffale non ha più sezioni, i nuovi arrivi
   tornano: un libro deve sempre avere un posto visibile.                     */
function sezioneDiArrivo(db, shelfId, sectionId) {
  if (sectionId) return sectionId;
  const scaffale = db.prepare('SELECT base_hidden FROM shelves WHERE id = ?').get(shelfId);
  if (!scaffale?.base_hidden) return null;
  const prima = db.prepare(`SELECT id FROM shelf_sections WHERE shelf_id = ?
                             ORDER BY position IS NULL, position, created_at LIMIT 1`).get(shelfId);
  if (prima) return prima.id;
  db.prepare('UPDATE shelves SET base_hidden = 0 WHERE id = ?').run(shelfId);
  return null;
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
    ORDER BY s.position IS NULL, s.position, s.name COLLATE NOCASE
  `).all();

  /* Le sezioni di tutti gli scaffali in una sola lettura: servono ai menu per
     scegliere il ripiano senza una richiesta per ogni scaffale. */
  const perScaffale = new Map();
  for (const sez of db.prepare(`
      SELECT id, shelf_id, name FROM shelf_sections
       ORDER BY shelf_id, position IS NULL, position, created_at`).all()) {
    if (!perScaffale.has(sez.shelf_id)) perScaffale.set(sez.shelf_id, []);
    perScaffale.get(sez.shelf_id).push({ id: sez.id, name: sez.name });
  }

  res.json(scaffali.map(s => ({
    ...s,
    kind: s.kind || 'tematico',
    // i cartacei sono quel che resta
    cartaceo_count: Math.max(0, s.book_count - s.ebook_count - s.opera_count),
    base_label: s.base_label || 'Nuovi arrivi',
    base_hidden: s.base_hidden ? 1 : 0,
    sections: perScaffale.get(s.id) || [],
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

/* ── GET /api/shelves/panoramica — ogni scaffale con le prime copertine ───
   Serve alla pagina generale, dove ogni scaffale è una fila che scorre.      */
router.get('/panoramica', (req, res) => {
  const db = getDb();
  const per = Math.min(Math.max(parseInt(req.query.per) || 40, 1), 120);

  const scaffali = db.prepare(`
    SELECT s.*, COUNT(sb.book_id) AS book_count
      FROM shelves s LEFT JOIN shelf_books sb ON s.id = sb.shelf_id
     GROUP BY s.id
     ORDER BY s.position IS NULL, s.position, s.name COLLATE NOCASE
  `).all();

  const primi = db.prepare(`
    SELECT b.id, b.title, b.year, b.cover_local, b.cover_url, b.cover_variant,
           b.item_type, b.format, b.cover_palette,
           (SELECT GROUP_CONCAT(a.name, '; ') FROM authors a
              JOIN book_authors ba ON a.id = ba.author_id
             WHERE ba.book_id = b.id ORDER BY ba.display_order) AS author_names
      FROM shelf_books sb JOIN books b ON b.id = sb.book_id
     WHERE sb.shelf_id = ?
     ORDER BY sb.position IS NULL, sb.position
     LIMIT ?`);

  res.json(scaffali.map(s => ({
    ...s,
    kind: s.kind || 'tematico',
    cover_height: s.cover_height || 130,
    show_ebooks: s.show_ebooks === 0 ? 0 : 1,
    books: primi.all(s.id, per),
  })));
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

  const books = conEbook(db, righeScaffale(db, req.params.id));
  res.json({
    ...shelf,
    kind: shelf.kind || 'tematico',
    view_mode: shelf.view_mode || 'mensola',
    cover_height: shelf.cover_height || 130,
    base_label: shelf.base_label || 'Nuovi arrivi',
    base_position: shelf.base_position,
    base_hidden: shelf.base_hidden ? 1 : 0,
    show_ebooks: shelf.show_ebooks === 0 ? 0 : 1,
    sections, books,
  });
});

/* ── POST /api/shelves — crea ───────────────────────────────────────────── */
router.post('/', (req, res) => {
  const db = getDb();
  const { name, subtitle, description, kind = 'tematico',
          shelf_type = 'custom', public: isPublic = 0 } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nome richiesto' });
  const id = uuidv4();
  const ultima = db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM shelves').get().m;
  db.prepare(`INSERT INTO shelves (id, name, subtitle, description, shelf_type, kind, public,
                                   share_token, view_mode, position, library_id)
              VALUES (?,?,?,?,?,?,?,?,'mensola',?,?)`)
    .run(id, name.trim(), subtitle || null, description || null, shelf_type,
         kind === 'fisico' ? 'fisico' : 'tematico', isPublic ? 1 : 0,
         crypto.randomBytes(8).toString('hex'),
         ultima + PASSO, req.body.library_id || null);
  res.status(201).json(db.prepare('SELECT * FROM shelves WHERE id = ?').get(id));
});

/* ── PATCH /api/shelves/:id — rinomina, nota, tipo ───────────────────────── */
router.patch('/:id', (req, res) => {
  const db = getDb();
  const attuale = db.prepare('SELECT * FROM shelves WHERE id = ?').get(req.params.id);
  if (!attuale) return res.status(404).json({ error: 'Scaffale non trovato' });

  const { name, subtitle, description, kind, public: isPublic,
          view_mode, cover_height, base_label, show_ebooks, library_id } = req.body;

  // Altezza delle copertine: entro limiti ragionevoli, così un valore storto
  // arrivato da fuori non rende la pagina illeggibile.
  const altezza = cover_height !== undefined
    ? Math.min(Math.max(parseInt(cover_height) || 130, 60), 300)
    : (attuale.cover_height || 130);

  db.prepare(`UPDATE shelves SET name=?, subtitle=?, description=?, kind=?, public=?,
                                 view_mode=?, cover_height=?, base_label=?,
                                 show_ebooks=?, library_id=? WHERE id=?`).run(
    name !== undefined ? name : attuale.name,
    subtitle !== undefined ? (subtitle || null) : attuale.subtitle,
    description !== undefined ? (description || null) : attuale.description,
    kind !== undefined ? (kind === 'fisico' ? 'fisico' : 'tematico') : (attuale.kind || 'tematico'),
    isPublic !== undefined ? (isPublic ? 1 : 0) : attuale.public,
    view_mode !== undefined ? (view_mode === 'mensola' ? 'mensola' : 'elenco') : (attuale.view_mode || 'elenco'),
    altezza,
    base_label !== undefined ? (String(base_label).trim() || null) : (attuale.base_label ?? null),
    show_ebooks !== undefined ? (show_ebooks ? 1 : 0) : (attuale.show_ebooks ?? 1),
    library_id !== undefined ? (library_id || null) : (attuale.library_id ?? null),
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
  const { book_id, after_book_id = null, after } = req.body;
  if (!book_id) return res.status(400).json({ error: 'book_id richiesto' });
  const section_id = sezioneDiArrivo(db, req.params.id, req.body.section_id || null);

  const esiste = db.prepare('SELECT id FROM books WHERE id = ?').get(book_id);
  if (!esiste) return res.status(404).json({ error: 'Record non trovato in catalogo' });
  const giaPresente = db.prepare('SELECT 1 AS c FROM shelf_books WHERE shelf_id = ? AND book_id = ?')
    .get(req.params.id, book_id);
  if (giaPresente) return res.status(409).json({ error: 'Il record è già su questo scaffale' });

  // dopo un elemento preciso della fila, o dopo un libro, o in fondo al gruppo
  const position = after !== undefined ? posizioneDopo(db, req.params.id, after)
    : after_book_id ? posizioneDopo(db, req.params.id, { tipo: 'libro', id: after_book_id })
    : posizioneInCoda(db, req.params.id, section_id);

  db.prepare('INSERT INTO shelf_books (shelf_id, book_id, position, section_id) VALUES (?,?,?,?)')
    .run(req.params.id, book_id, position, section_id);
  normalizza(db, req.params.id);
  const finale = db.prepare('SELECT section_id FROM shelf_books WHERE shelf_id = ? AND book_id = ?')
    .get(req.params.id, book_id);
  res.status(201).json({ ok: true, position, section_id: finale?.section_id ?? null });
});

/* ── PATCH /api/shelves/:id/books/:bookId — sposta un libro nella fila ────
   { after: { tipo, id } | null }  subito dopo quell'elemento (null = in testa)
   { section_id }                  in fondo al gruppo di quell'etichetta      */
router.patch('/:id/books/:bookId', (req, res) => {
  const db = getDb();
  const riga = db.prepare('SELECT * FROM shelf_books WHERE shelf_id = ? AND book_id = ?')
    .get(req.params.id, req.params.bookId);
  if (!riga) return res.status(404).json({ error: 'Il record non è su questo scaffale' });

  const io = { tipo: 'libro', id: req.params.bookId };
  let position;
  if (req.body.after !== undefined) {
    position = posizioneDopo(db, req.params.id, req.body.after, io);
  } else if (req.body.after_book_id) {
    position = posizioneDopo(db, req.params.id, { tipo: 'libro', id: req.body.after_book_id }, io);
  } else if (req.body.section_id !== undefined) {
    position = posizioneInCoda(db, req.params.id,
      sezioneDiArrivo(db, req.params.id, req.body.section_id || null), io);
  } else {
    return res.json({ ok: true, position: riga.position, section_id: riga.section_id });
  }

  db.prepare('UPDATE shelf_books SET position = ? WHERE shelf_id = ? AND book_id = ?')
    .run(position, req.params.id, req.params.bookId);
  normalizza(db, req.params.id);
  const finale = db.prepare('SELECT section_id FROM shelf_books WHERE shelf_id = ? AND book_id = ?')
    .get(req.params.id, req.params.bookId);
  res.json({ ok: true, position, section_id: finale?.section_id ?? null });
});

/* ── POST /api/shelves/:id/books/:bookId/transfer — sposta o copia ────────
   Corpo: { target_shelf_id, mode: 'move' | 'copy', section_id? }           */
router.post('/:id/books/:bookId/transfer', (req, res) => {
  const db = getDb();
  const { target_shelf_id, mode = 'move' } = req.body;
  if (!target_shelf_id) return res.status(400).json({ error: 'target_shelf_id richiesto' });
  const section_id = sezioneDiArrivo(db, target_shelf_id, req.body.section_id || null);

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
      normalizza(db, target_shelf_id);
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

/* ── PATCH /api/shelves/:id/posizione — sposta uno scaffale ───────────────
   { after_shelf_id, library_id } — after_shelf_id null lo porta in testa.    */
router.patch('/:id/posizione', (req, res) => {
  const db = getDb();
  const scaffale = db.prepare('SELECT * FROM shelves WHERE id = ?').get(req.params.id);
  if (!scaffale) return res.status(404).json({ error: 'Scaffale non trovato' });
  const { after_shelf_id, library_id } = req.body;

  const ordine = db.prepare(
    'SELECT id, position FROM shelves WHERE id != ? ORDER BY position IS NULL, position'
  ).all(req.params.id);

  let posizione;
  if (!after_shelf_id) {
    posizione = (ordine.length ? ordine[0].position : PASSO) - PASSO / 2;
  } else {
    const i = ordine.findIndex(x => x.id === after_shelf_id);
    if (i < 0) posizione = (ordine.length ? ordine[ordine.length - 1].position : 0) + PASSO;
    else {
      const prima = ordine[i].position;
      const dopo = ordine[i + 1]?.position;
      if (dopo === undefined) posizione = prima + PASSO;
      else if (dopo - prima > MIN_DIVARIO) posizione = prima + (dopo - prima) / 2;
      else {
        // Spazio decimale esaurito: si rinumera a 10, 20, 30… e si ricalcola
        // sulle posizioni nuove. Succede una volta ogni molti spostamenti.
        const upd = db.prepare('UPDATE shelves SET position = ? WHERE id = ?');
        db.transaction(() => {
          db.prepare('SELECT id FROM shelves ORDER BY position IS NULL, position').all()
            .forEach((r, k) => upd.run((k + 1) * PASSO, r.id));
        })();
        const rifatto = db.prepare('SELECT position FROM shelves WHERE id = ?').get(after_shelf_id);
        posizione = (rifatto?.position ?? 0) + PASSO / 2;
      }
    }
  }

  db.prepare('UPDATE shelves SET position = ?, library_id = ? WHERE id = ?').run(
    posizione,
    library_id !== undefined ? (library_id || null) : (scaffale.library_id ?? null),
    req.params.id
  );
  res.json(db.prepare('SELECT id, name, position, library_id FROM shelves WHERE id = ?').get(req.params.id));
});

/* ── Sezioni dentro uno scaffale ─────────────────────────────────────────── */

/* POST /api/shelves/:id/sections { name, after? } — un'etichetta nuova.
   Senza `after` va in fondo alla fila: non ruba libri a nessuno. */
router.post('/:id/sections', (req, res) => {
  const db = getDb();
  const { name } = req.body;
  const id = uuidv4();
  const f = fila(db, req.params.id);
  const position = req.body.after !== undefined
    ? posizioneDopo(db, req.params.id, req.body.after)
    : (f.length ? f[f.length - 1].position + PASSO : PASSO);
  db.prepare('INSERT INTO shelf_sections (id, shelf_id, name, position) VALUES (?,?,?,?)')
    .run(id, req.params.id, name || null, position);
  normalizza(db, req.params.id);
  res.status(201).json(db.prepare('SELECT id, name, position FROM shelf_sections WHERE id = ?').get(id));
});

/* PATCH /api/shelves/:id/sections/:sid { name?, after? }
   `after` sposta l'etichetta nella fila come si sposta un libro. */
router.patch('/:id/sections/:sectionId', (req, res) => {
  const db = getDb();
  const sez = db.prepare('SELECT * FROM shelf_sections WHERE id = ? AND shelf_id = ?')
    .get(req.params.sectionId, req.params.id);
  if (!sez) return res.status(404).json({ error: 'Sezione non trovata' });

  const position = req.body.after !== undefined
    ? posizioneDopo(db, req.params.id, req.body.after, { tipo: 'etichetta', id: sez.id })
    : sez.position;
  db.prepare('UPDATE shelf_sections SET name = ?, position = ? WHERE id = ?').run(
    req.body.name !== undefined ? (req.body.name || null) : sez.name,
    position, sez.id);
  normalizza(db, req.params.id);
  res.json(db.prepare('SELECT id, name, position FROM shelf_sections WHERE id = ?').get(sez.id));
});

/* DELETE /api/shelves/:id/sections/:sid — si toglie l'etichetta; i suoi libri
   restano dove sono e passano al gruppo che li precede. */
router.delete('/:id/sections/:sectionId', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM shelf_sections WHERE id = ? AND shelf_id = ?')
    .run(req.params.sectionId, req.params.id);
  normalizza(db, req.params.id);
  res.json({ ok: true });
});

/* PATCH /api/shelves/:id/base { label?, hidden: false } — rinomina i nuovi
   arrivi o li rimette. Non si spostano: sono la testa della fila. */
router.patch('/:id/base', (req, res) => {
  const db = getDb();
  const scaffale = db.prepare('SELECT * FROM shelves WHERE id = ?').get(req.params.id);
  if (!scaffale) return res.status(404).json({ error: 'Scaffale non trovato' });
  if (req.body.hidden === false) {
    db.prepare('UPDATE shelves SET base_hidden = 0 WHERE id = ?').run(req.params.id);
  }
  if (req.body.label !== undefined) {
    db.prepare('UPDATE shelves SET base_label = ? WHERE id = ?')
      .run(String(req.body.label).trim() || null, req.params.id);
  }
  const agg = db.prepare('SELECT base_label, base_hidden FROM shelves WHERE id = ?').get(req.params.id);
  res.json({ base_label: agg.base_label || 'Nuovi arrivi', base_hidden: agg.base_hidden ? 1 : 0 });
});

/* DELETE /api/shelves/:id/base — toglie i nuovi arrivi. Se in testa ci sono
   libri, la prima etichetta si sposta davanti a loro e li prende con sé.
   Senza etichette non si può: quei libri non avrebbero un nome visibile.   */
router.delete('/:id/base', (req, res) => {
  const db = getDb();
  const scaffale = db.prepare('SELECT id FROM shelves WHERE id = ?').get(req.params.id);
  if (!scaffale) return res.status(404).json({ error: 'Scaffale non trovato' });

  const f = fila(db, req.params.id);
  const inTesta = [];
  for (const x of f) { if (x.tipo === 'etichetta') break; inTesta.push(x); }
  const prima = f.find(x => x.tipo === 'etichetta');

  if (inTesta.length && !prima) {
    return res.status(409).json({
      error: "Ci sono volumi sui nuovi arrivi e nessun'etichetta che possa prenderli: crea prima una sezione.",
    });
  }
  db.transaction(() => {
    if (inTesta.length) {
      db.prepare('UPDATE shelf_sections SET position = ? WHERE id = ?')
        .run(posizioneDopo(db, req.params.id, null, prima), prima.id);
      normalizza(db, req.params.id);
    }
    db.prepare('UPDATE shelves SET base_hidden = 1 WHERE id = ?').run(req.params.id);
  })();
  res.json({ ok: true, volumi_spostati: inTesta.length, in_sezione: prima?.id ?? null });
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
