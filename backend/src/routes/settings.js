const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const path = require('path');
const fs = require('fs');

const BG_DIR = path.join(__dirname, '../../../uploads/backgrounds');

function ensureBgDir() {
  if (!fs.existsSync(BG_DIR)) fs.mkdirSync(BG_DIR, { recursive: true });
}

// GET /api/settings
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  for (const r of rows) {
    try { settings[r.key] = JSON.parse(r.value); } catch { settings[r.key] = r.value; }
  }
  res.json(settings);
});

// PUT /api/settings
router.put('/', (req, res) => {
  const db = getDb();
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)');
  const tx = db.transaction((data) => {
    for (const [key, val] of Object.entries(data)) {
      upsert.run(key, typeof val === 'string' ? val : JSON.stringify(val));
    }
  });
  tx(req.body);
  res.json({ ok: true });
});

// GET /api/settings/backgrounds — lista tutti gli sfondi caricati
router.get('/backgrounds', (req, res) => {
  res.set('Cache-Control', 'no-store'); // la lista cambia a ogni upload/eliminazione
  ensureBgDir();
  const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
  let files = [];
  try {
    files = fs.readdirSync(BG_DIR)
      .filter(f => EXTS.has(path.extname(f).toLowerCase()))
      .map(f => ({
        filename: f,
        url: `/uploads/backgrounds/${f}`,
        mtime: fs.statSync(path.join(BG_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);
  } catch {}
  res.json(files);
});

// POST /api/settings/background-image — carica un nuovo sfondo (aggiunge alla galleria)
router.post('/background-image', (req, res) => {
  if (!req.files || !req.files.image) {
    return res.status(400).json({ error: 'Nessun file ricevuto' });
  }
  ensureBgDir();
  const file = req.files.image;
  const ext = path.extname(file.name) || '.jpg';
  const filename = `bg_${Date.now()}${ext}`;
  const dest = path.join(BG_DIR, filename);
  file.mv(dest, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const url = `/uploads/backgrounds/${filename}`;
    const db = getDb();
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)').run(
      'bgImageUrl', JSON.stringify(url)
    );
    res.json({ url, filename });
  });
});

// DELETE /api/settings/backgrounds/:filename — elimina uno sfondo dalla galleria
router.delete('/backgrounds/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // no path traversal
  const filePath = path.join(BG_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File non trovato' });
  try {
    fs.unlinkSync(filePath);
    const db = getDb();
    const url = `/uploads/backgrounds/${filename}`;
    // Se era lo sfondo attivo, deselezionalo
    const cur = db.prepare("SELECT value FROM settings WHERE key='bgImageUrl'").get();
    if (cur) {
      try { if (JSON.parse(cur.value) === url) db.prepare("DELETE FROM settings WHERE key='bgImageUrl'").run(); } catch {}
    }
    // Rimuovilo da tutti i preset slideshow
    const presetsRow = db.prepare("SELECT value FROM settings WHERE key='slideshowPresets'").get();
    if (presetsRow) {
      try {
        const presets = JSON.parse(presetsRow.value);
        const updated = presets.map(p => ({ ...p, images: p.images.filter(u => u !== url) }));
        db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)').run('slideshowPresets', JSON.stringify(updated));
      } catch {}
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/settings/backup — scarica backup SQLite
router.get('/backup', (req, res) => {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../data/malachia.db');
  if (!fs.existsSync(dbPath)) return res.status(404).json({ error: 'Database non trovato' });
  const date = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Disposition', `attachment; filename="malachia_backup_${date}.db"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  fs.createReadStream(dbPath).pipe(res);
});

module.exports = router;
