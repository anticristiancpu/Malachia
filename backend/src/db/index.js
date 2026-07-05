const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/malachia.db');

let db;

function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  initSchema();
  return db;
}

function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  // Run each statement
  const stmts = schema.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of stmts) {
    try {
      db.exec(stmt + ';');
    } catch (e) {
      if (!e.message.includes('already exists')) {
        console.warn('Schema warning:', e.message.slice(0, 100));
      }
    }
  }
  runMigrations();
}

function runMigrations() {
  // Aggiungi colonne mancanti alle tabelle esistenti (ALTER TABLE è idempotente con try/catch)
  const migrations = [
    'ALTER TABLE shelves ADD COLUMN cover_url TEXT',
    'ALTER TABLE shelves ADD COLUMN subtitle TEXT',
    'ALTER TABLE shelves ADD COLUMN description TEXT',
    "ALTER TABLE shelves ADD COLUMN shelf_type TEXT DEFAULT 'custom'",
    'ALTER TABLE shelves ADD COLUMN public INTEGER DEFAULT 0',
    'ALTER TABLE shelves ADD COLUMN share_token TEXT',
    'ALTER TABLE books ADD COLUMN inventory_number TEXT',
    'ALTER TABLE books ADD COLUMN volumes_count INTEGER DEFAULT 1',
    'ALTER TABLE books ADD COLUMN copies_owned INTEGER DEFAULT 1',
  ];
  for (const m of migrations) {
    try { db.exec(m); } catch {}
  }

  // Ricalcola name_sort con l'algoritmo aggiornato (particelle nobiliari)
  try {
    const PARTICLES = new Set([
      'de', 'di', 'del', 'della', 'degli', 'dei', "de'", "d'",
      'van', 'von', 'le', 'la', 'du', 'des', 'ten', 'ter', 'lo', 'al', 'el',
    ]);
    function sortName(name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return name.toLowerCase();
      let start = parts.length - 1;
      for (let i = parts.length - 2; i >= 1; i--) {
        if (PARTICLES.has(parts[i].toLowerCase())) start = i; else break;
      }
      return `${parts.slice(start).join(' ')}, ${parts.slice(0, start).join(' ')}`.toLowerCase();
    }
    const authors = db.prepare('SELECT id, name FROM authors').all();
    const upd = db.prepare('UPDATE authors SET name_sort = ? WHERE id = ?');
    for (const a of authors) upd.run(sortName(a.name), a.id);
  } catch {}

  // Genera numeri di inventario per libri che ne sono privi
  try {
    const booksWithout = db.prepare("SELECT id FROM books WHERE inventory_number IS NULL OR inventory_number = ''").all();
    for (const { id } of booksWithout) {
      let num, exists;
      do {
        num = 'CP' + String(Math.floor(100000 + Math.random() * 900000));
        exists = db.prepare('SELECT id FROM books WHERE inventory_number = ?').get(num);
      } while (exists);
      db.prepare('UPDATE books SET inventory_number = ? WHERE id = ?').run(num, id);
    }
  } catch {}
}

module.exports = { getDb };
