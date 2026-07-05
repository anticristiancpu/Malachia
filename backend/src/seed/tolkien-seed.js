require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const tolkien = require('./tolkien.json');

const db = getDb();
console.log('\n  Seeding collezione Tolkieniana…\n');

// 1. Crea autore Tolkien
const existingAuthor = db.prepare("SELECT id FROM authors WHERE name LIKE '%Tolkien%'").get();
let authorId;
if (existingAuthor) {
  authorId = existingAuthor.id;
  console.log('  Autore già presente:', tolkien.author.name);
} else {
  authorId = uuidv4();
  db.prepare(`INSERT INTO authors (id, name, name_sort, birth_date, death_date, nationality, biography, alternate_names)
    VALUES (?,?,?,?,?,?,?,?)`
  ).run(authorId, tolkien.author.name, 'tolkien, j.r.r.',
    tolkien.author.birth_date, tolkien.author.death_date,
    tolkien.author.nationality, tolkien.author.biography,
    JSON.stringify(tolkien.author.alternate_names));
  console.log('  ✓ Autore creato:', tolkien.author.name);
}

// 2. Crea scaffale Tolkieniana
const existingShelf = db.prepare("SELECT id FROM shelves WHERE name = 'Tolkieniana'").get();
let shelfId;
if (existingShelf) {
  shelfId = existingShelf.id;
} else {
  shelfId = uuidv4();
  db.prepare(`INSERT INTO shelves (id, name, subtitle, description, shelf_type) VALUES (?,?,?,?,?)`
  ).run(shelfId, tolkien.collection.name, tolkien.collection.subtitle, tolkien.collection.description, 'tolkieniana');
  console.log('  ✓ Scaffale creato:', tolkien.collection.name);
}

// 3. Crea ogni opera
let created = 0, skipped = 0;
for (const work of tolkien.works) {
  const existing = db.prepare("SELECT id FROM books WHERE title = ? OR (isbn13 IS NOT NULL AND isbn13 = ?)")
    .get(work.title, work.isbn13 || '');

  if (existing) {
    // Aggiungi allo scaffale se non già presente
    db.prepare('INSERT OR IGNORE INTO shelf_books (shelf_id, book_id) VALUES (?,?)').run(shelfId, existing.id);
    skipped++;
    continue;
  }

  const bookId = uuidv4();
  const palette = JSON.stringify(['#3a2a1a', '#f4ecd8', '#bfa15a']); // palette Tolkien classica

  db.prepare(`INSERT INTO books (
    id, title, original_title, year, isbn13, series_name, series_volume,
    cover_palette, cover_variant, status, tags, language, original_language
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    bookId, work.title, work.original_title || null, work.year || null,
    work.isbn13 || null, work.series_name || null, work.series_volume || null,
    palette, 'monastic', 'tbr',
    JSON.stringify(work.tags || []),
    'italiano', 'inglese'
  );

  // Collega autore
  db.prepare('INSERT OR IGNORE INTO book_authors (book_id, author_id, role, display_order) VALUES (?,?,?,?)')
    .run(bookId, authorId, 'author', 0);

  // Aggiungi allo scaffale
  db.prepare('INSERT OR IGNORE INTO shelf_books (shelf_id, book_id) VALUES (?,?)').run(shelfId, bookId);

  created++;
}

console.log(`\n  ✓ Collezione Tolkieniana: ${created} opere create, ${skipped} già presenti.\n`);
console.log('  Avvia Malachia e vai su Scaffali per vedere la collezione.\n');
