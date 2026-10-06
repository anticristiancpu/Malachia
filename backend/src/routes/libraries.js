// Librerie: un raggruppamento sopra gli scaffali.
//
// Uno scaffale può non appartenere a nessuna libreria: resta fra quelli non
// assegnati. Eliminare una libreria non tocca gli scaffali, che tornano
// semplicemente senza assegnazione: non si perde niente.

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const PASSO = 10;

/* GET /api/libraries — con quanti scaffali contiene */
router.get('/', (req, res) => {
  const db = getDb();
  res.json(db.prepare(`
    SELECT l.*, COUNT(s.id) AS shelf_count
      FROM libraries l LEFT JOIN shelves s ON s.library_id = l.id
     GROUP BY l.id
     ORDER BY l.position IS NULL, l.position, l.name COLLATE NOCASE
  `).all());
});

/* POST /api/libraries { name } */
router.post('/', (req, res) => {
  const db = getDb();
  const nome = String(req.body?.name || '').trim();
  if (!nome) return res.status(400).json({ error: 'Serve un nome' });
  const id = uuidv4();
  const ultima = db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM libraries').get().m;
  db.prepare('INSERT INTO libraries (id, name, position) VALUES (?,?,?)')
    .run(id, nome, ultima + PASSO);
  res.status(201).json(db.prepare('SELECT * FROM libraries WHERE id = ?').get(id));
});

/* PATCH /api/libraries/:id { name, after_library_id } */
router.patch('/:id', (req, res) => {
  const db = getDb();
  const attuale = db.prepare('SELECT * FROM libraries WHERE id = ?').get(req.params.id);
  if (!attuale) return res.status(404).json({ error: 'Libreria non trovata' });
  const { name, after_library_id } = req.body;

  let posizione = attuale.position;
  if (after_library_id !== undefined) {
    const altre = db.prepare(
      'SELECT id, position FROM libraries WHERE id != ? ORDER BY position IS NULL, position'
    ).all(req.params.id);
    if (!after_library_id) {
      posizione = (altre.length ? altre[0].position : PASSO) - PASSO / 2;
    } else {
      const i = altre.findIndex(x => x.id === after_library_id);
      if (i < 0) posizione = (altre.length ? altre[altre.length - 1].position : 0) + PASSO;
      else {
        const prima = altre[i].position;
        const dopo = altre[i + 1]?.position;
        posizione = dopo === undefined ? prima + PASSO : prima + (dopo - prima) / 2;
      }
    }
  }

  db.prepare('UPDATE libraries SET name = ?, position = ? WHERE id = ?').run(
    name !== undefined ? (String(name).trim() || attuale.name) : attuale.name,
    posizione, req.params.id
  );
  res.json(db.prepare('SELECT * FROM libraries WHERE id = ?').get(req.params.id));
});

/* DELETE /api/libraries/:id — gli scaffali restano, senza assegnazione */
router.delete('/:id', (req, res) => {
  const db = getDb();
  const quanti = db.prepare('SELECT COUNT(*) AS n FROM shelves WHERE library_id = ?')
    .get(req.params.id).n;
  db.transaction(() => {
    db.prepare('UPDATE shelves SET library_id = NULL WHERE library_id = ?').run(req.params.id);
    db.prepare('DELETE FROM libraries WHERE id = ?').run(req.params.id);
  })();
  res.json({ ok: true, scaffali_liberati: quanti });
});

module.exports = router;
