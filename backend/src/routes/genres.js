const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

// GET /api/genres — albero gerarchico
router.get('/', (req, res) => {
  const db = getDb();
  const all = db.prepare('SELECT * FROM genres ORDER BY name').all();
  const tree = buildTree(all);
  res.json(tree);
});

// POST /api/genres
router.post('/', (req, res) => {
  const db = getDb();
  const { name, parent_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome richiesto' });
  const id = uuidv4();
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  db.prepare('INSERT INTO genres (id, name, parent_id, slug) VALUES (?,?,?,?)').run(id, name, parent_id||null, slug);
  res.status(201).json(db.prepare('SELECT * FROM genres WHERE id = ?').get(id));
});

function buildTree(items) {
  const map = {};
  const roots = [];
  for (const item of items) { map[item.id] = { ...item, children: [] }; }
  for (const item of items) {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  }
  return roots;
}

module.exports = router;
