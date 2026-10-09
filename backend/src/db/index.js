const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/malachia.db');

// Versione dello schema. Va alzata di uno ogni volta che si aggiunge una
// migrazione: è questo numero a dire se c'è davvero qualcosa da applicare,
// e quindi se serve un backup prima di toccare il database.
const VERSIONE_SCHEMA = 8;

// Quante copie di sicurezza tenere accanto al database.
const BACKUP_DA_TENERE = 5;

/* Copia il database accanto a sé stesso, con data e ora nel nome, e tiene
   solo le ultime BACKUP_DA_TENERE. Solleva se non ci riesce: senza una copia
   buona le migrazioni non devono partire. */
function backupPrimaDelleMigrazioni(versioneAttuale) {
  const ora = new Date();
  const p = (n, c = 2) => String(n).padStart(c, '0');
  const stampo = `${ora.getFullYear()}${p(ora.getMonth() + 1)}${p(ora.getDate())}`
               + `-${p(ora.getHours())}${p(ora.getMinutes())}${p(ora.getSeconds())}`;
  const destinazione = `${DB_PATH}.backup-${stampo}`;

  // Il WAL va riversato nel file principale, altrimenti la copia è parziale.
  db.pragma('wal_checkpoint(TRUNCATE)');
  fs.copyFileSync(DB_PATH, destinazione);

  const copiato = fs.statSync(destinazione).size;
  if (copiato === 0) throw new Error('la copia risulta vuota');
  console.log(`  ✦ Backup prima delle migrazioni: ${path.basename(destinazione)}`
            + ` (${(copiato / 1048576).toFixed(1)} MB, schema ${versioneAttuale} → ${VERSIONE_SCHEMA})`);

  // Via le copie più vecchie, tenendo le ultime per nome (il nome è cronologico).
  try {
    const cartella = path.dirname(DB_PATH);
    const prefisso = `${path.basename(DB_PATH)}.backup-`;
    // Solo i backup veri: un eventuale -wal accanto a una copia non va contato
    // come se fosse una copia a sé, altrimenti la rotazione sbaglia i conti.
    // Solo i backup veri: il nome finisce con AAAAMMGG-HHMMSS e basta. Un
    // eventuale -wal accanto a una copia non deve contare come una copia a sé,
    // altrimenti la rotazione sbaglia i conti e ne tiene meno di cinque.
    const stampoValido = (f) => {
      const coda = f.slice(prefisso.length);
      return coda.length === 15 && coda[8] === '-'
          && /^[0-9]+$/.test(coda.slice(0, 8))
          && /^[0-9]+$/.test(coda.slice(9));
    };
    const vecchie = fs.readdirSync(cartella)
      .filter(f => f.startsWith(prefisso) && stampoValido(f))
      .sort()
      .slice(0, -BACKUP_DA_TENERE);
    for (const f of vecchie) fs.unlinkSync(path.join(cartella, f));
    if (vecchie.length) console.log(`  ✦ Rimosse ${vecchie.length} copie più vecchie`);
  } catch (e) {
    // Non essere riusciti a fare pulizia non è un motivo per fermarsi.
    console.warn('  Copie vecchie non rimosse:', e.message);
  }
}

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
  const versione = db.pragma('user_version', { simple: true });
  if (versione >= VERSIONE_SCHEMA) return;   // niente da applicare: non si tocca niente

  // Un database appena creato non ha niente da salvare.
  const daSalvare = db.prepare('SELECT COUNT(*) AS n FROM books').get().n > 0;
  if (daSalvare) {
    try {
      backupPrimaDelleMigrazioni(versione);
    } catch (e) {
      console.error('');
      console.error('  ✗ Backup del database non riuscito:', e.message);
      console.error(`    File: ${DB_PATH}`);
      console.error("    Le migrazioni NON sono state applicate: il database e' rimasto");
      console.error("    com'era. Libera spazio o correggi i permessi sulla cartella,");
      console.error('    poi riavvia.');
      console.error('');
      throw new Error('migrazioni interrotte: backup del database non riuscito');
    }
  }

  runMigrations();
  if (versione < 8) convertiInFila();
  db.pragma(`user_version = ${VERSIONE_SCHEMA}`);
}

/* Schema 8: le sezioni diventano etichette nella fila dei libri.
   Prima ogni sezione aveva le sue posizioni e i libri le sue; ora libri ed
   etichette stanno nello stesso spazio, e un libro appartiene all'ultima
   etichetta che lo precede. Qui si riscrive ogni scaffale conservando
   l'ordine in cui lo si vedeva.

   I "nuovi arrivi" diventano la testa della fila. Se però erano stati
   spostati apposta in mezzo alle sezioni, quella scelta si rispetta: al loro
   posto nasce un'etichetta vera con lo stesso nome, e la testa resta vuota. */
function convertiInFila() {
  const crypto = require('crypto');
  const scaffali = db.prepare('SELECT id, base_position, base_label FROM shelves').all();
  const updL = db.prepare('UPDATE shelf_books SET position = ?, section_id = ? WHERE shelf_id = ? AND book_id = ?');
  const updE = db.prepare('UPDATE shelf_sections SET position = ? WHERE id = ?');
  const insE = db.prepare('INSERT INTO shelf_sections (id, shelf_id, name, position) VALUES (?,?,?,?)');
  const libriDi = db.prepare(`SELECT book_id FROM shelf_books WHERE shelf_id = ? AND section_id IS ?
                               ORDER BY position IS NULL, position`);

  db.transaction(() => {
    for (const sc of scaffali) {
      const sezioni = db.prepare(`SELECT id, position FROM shelf_sections WHERE shelf_id = ?
                                  ORDER BY position IS NULL, position, created_at`).all(sc.id);
      // mai spostati: i nuovi arrivi vanno in testa, come nel modello nuovo
      const base = { id: null, position: sc.base_position ?? -Infinity };
      const etichette = [...sezioni, base].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      const libriBase = libriDi.all(sc.id, null);
      let k = 0;
      const prossima = () => (++k) * 10;

      etichette.forEach((e, i) => {
        if (e.id === null) {
          if (!libriBase.length) return;
          if (i === 0) {                       // in testa: restano senza etichetta
            libriBase.forEach(b => updL.run(prossima(), null, sc.id, b.book_id));
            return;
          }
          const nuova = crypto.randomUUID();   // in mezzo: un'etichetta vera al loro posto
          insE.run(nuova, sc.id, sc.base_label || 'Nuovi arrivi', prossima());
          libriBase.forEach(b => updL.run(prossima(), nuova, sc.id, b.book_id));
          db.prepare('UPDATE shelves SET base_hidden = 1 WHERE id = ?').run(sc.id);
          return;
        }
        updE.run(prossima(), e.id);
        libriDi.all(sc.id, e.id).forEach(b => updL.run(prossima(), e.id, sc.id, b.book_id));
      });
    }
  })();
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
    // Sistema di collocazione: "<era>/<periodo>[/<disciplina>]" o "trasversale/<voce>"
    'ALTER TABLE books ADD COLUMN placement_id TEXT',
    'ALTER TABLE books ADD COLUMN placement_at TEXT',
    'CREATE INDEX IF NOT EXISTS idx_books_placement ON books(placement_id)',
    // ─── Scaffali virtuali ───
    // L'ordine e i raggruppamenti stavano nel localStorage del browser: li
    // portiamo nel database, così sopravvivono al cambio di dispositivo e
    // finiscono nei backup. Posizioni distanziate (10, 20, 30...) per poter
    // inserire in mezzo senza rinumerare lo scaffale.
    'ALTER TABLE shelf_books ADD COLUMN position REAL',
    'ALTER TABLE shelf_books ADD COLUMN section_id TEXT',
    "ALTER TABLE shelves ADD COLUMN kind TEXT DEFAULT 'tematico'",
    `CREATE TABLE IF NOT EXISTS shelf_sections (
       id TEXT PRIMARY KEY,
       shelf_id TEXT REFERENCES shelves(id) ON DELETE CASCADE,
       name TEXT,
       position REAL,
       created_at TEXT DEFAULT (datetime('now'))
     )`,
    'CREATE INDEX IF NOT EXISTS idx_shelf_books_book ON shelf_books(book_id)',
    'CREATE INDEX IF NOT EXISTS idx_shelf_sections_shelf ON shelf_sections(shelf_id)',

    // ─── Tipo del record ───
    // item_type è il tipo autoritativo (cartaceo / ebook / opera); format
    // resta il tipo di rilegatura. Il default riempie i record esistenti,
    // che sono tutti cartacei.
    "ALTER TABLE books ADD COLUMN item_type TEXT DEFAULT 'cartaceo'",
    // Riferimenti al gestore ebook, neutri rispetto al prodotto usato
    'ALTER TABLE books ADD COLUMN ebook_server TEXT',
    'ALTER TABLE books ADD COLUMN ebook_external_id TEXT',
    'ALTER TABLE books ADD COLUMN ebook_url TEXT',
    // Opere d'arte
    'ALTER TABLE books ADD COLUMN artwork_place TEXT',
    'ALTER TABLE books ADD COLUMN artwork_date TEXT',
    'ALTER TABLE books ADD COLUMN artwork_technique TEXT',
    'ALTER TABLE books ADD COLUMN artwork_image TEXT',
    'CREATE INDEX IF NOT EXISTS idx_books_item_type ON books(item_type)',

    // "Nuovi acquisti" non fa più parte della collocazione: quei volumi tornano da collocare
    "UPDATE books SET placement_id = NULL WHERE placement_id = 'nuovi-acquisti'",

    // Specchio locale del gestore ebook esterno (BookOrbit). È di sola lettura:
    // viene riempito dalla sincronizzazione e non torna mai indietro al server.
    // Non contiene indirizzi completi: i link si costruiscono al momento.
    `CREATE TABLE IF NOT EXISTS bookorbit_items (
       id INTEGER PRIMARY KEY,
       title TEXT,
       subtitle TEXT,
       authors TEXT,
       publisher TEXT,
       year INTEGER,
       isbn13 TEXT,
       isbn10 TEXT,
       language TEXT,
       pages INTEGER,
       series_name TEXT,
       series_index TEXT,
       genres TEXT,
       library_name TEXT,
       file_id INTEGER,
       file_format TEXT,
       has_cover INTEGER DEFAULT 0,
       remote_updated_at TEXT,
       book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
       stato TEXT DEFAULT 'da_vedere',
       visto_at TEXT,
       created_at TEXT DEFAULT (datetime('now')),
       updated_at TEXT DEFAULT (datetime('now'))
     )`,
    'CREATE INDEX IF NOT EXISTS idx_bookorbit_book ON bookorbit_items(book_id)',
    'CREATE INDEX IF NOT EXISTS idx_bookorbit_stato ON bookorbit_items(stato)',
    'CREATE INDEX IF NOT EXISTS idx_bookorbit_isbn13 ON bookorbit_items(isbn13)',

    // L'indice full-text non è mai stato interrogato: la ricerca usa LIKE.
    // Lo eliminiamo invece di continuare a tenerlo allineato.
    'DROP TABLE IF EXISTS books_fts',

    // Come si guarda uno scaffale: a elenco o a mensola, e quanto grandi le
    // copertine. Sono preferenze di ciascuno scaffale, non del browser.
    "ALTER TABLE shelves ADD COLUMN view_mode TEXT DEFAULT 'elenco'",
    'ALTER TABLE shelves ADD COLUMN cover_height INTEGER DEFAULT 130',

    // Librerie: un raggruppamento sopra gli scaffali. Uno scaffale può non
    // appartenere a nessuna: resta fra quelli non assegnati.
    `CREATE TABLE IF NOT EXISTS libraries (
       id TEXT PRIMARY KEY,
       name TEXT,
       position REAL,
       created_at TEXT DEFAULT (datetime('now'))
     )`,
    'ALTER TABLE shelves ADD COLUMN library_id TEXT REFERENCES libraries(id) ON DELETE SET NULL',
    'ALTER TABLE shelves ADD COLUMN position REAL',
    'CREATE INDEX IF NOT EXISTS idx_shelves_library ON shelves(library_id)',

    // L'etichetta dei record senza sezione: si può rinominare e spostare come
    // le altre, pur non essendo una sezione vera.
    'ALTER TABLE shelves ADD COLUMN base_label TEXT',
    'ALTER TABLE shelves ADD COLUMN base_position REAL',

    // Mostrare o nascondere gli ebook sullo scaffale
    'ALTER TABLE shelves ADD COLUMN show_ebooks INTEGER DEFAULT 1',

    // La mensola diventa il modo predefinito di guardare uno scaffale
    "UPDATE shelves SET view_mode = 'mensola' WHERE COALESCE(view_mode,'') IN ('', 'elenco')",

    // Il ripiano dei nuovi arrivi si può togliere da uno scaffale
    'ALTER TABLE shelves ADD COLUMN base_hidden INTEGER DEFAULT 0',
  ];
  for (const m of migrations) {
    try { db.exec(m); } catch {}
  }

  // Posizioni mancanti negli scaffali: assegnate in ordine di inserimento e
  // distanziate di 10, così resta spazio per intercalare senza rinumerare.
  try {
    const senzaPosizione = db.prepare(
      'SELECT shelf_id, book_id FROM shelf_books WHERE position IS NULL ORDER BY shelf_id, added_at'
    ).all();
    if (senzaPosizione.length) {
      const upd = db.prepare('UPDATE shelf_books SET position = ? WHERE shelf_id = ? AND book_id = ?');
      const contatore = {};
      db.transaction(righe => {
        for (const r of righe) {
          contatore[r.shelf_id] = (contatore[r.shelf_id] || 0) + 10;
          upd.run(contatore[r.shelf_id], r.shelf_id, r.book_id);
        }
      })(senzaPosizione);
    }
  } catch {}

  // Ordine degli scaffali: chi non ce l'ha lo prende in ordine alfabetico,
  // distanziato di 10 così resta spazio per intercalare senza rinumerare.
  try {
    const senza = db.prepare(
      'SELECT id FROM shelves WHERE position IS NULL ORDER BY name COLLATE NOCASE'
    ).all();
    if (senza.length) {
      const massimo = db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM shelves').get().m;
      const upd = db.prepare('UPDATE shelves SET position = ? WHERE id = ?');
      db.transaction(righe => {
        righe.forEach((r, i) => upd.run(massimo + (i + 1) * 10, r.id));
      })(senza);
    }
  } catch {}

  // Tipo del record: nessuno resta senza, e un ebook segnato solo nella
  // rilegatura viene riconosciuto anche come tipo.
  try { db.exec("UPDATE books SET item_type = 'cartaceo' WHERE item_type IS NULL OR item_type = ''"); } catch {}
  try { db.exec("UPDATE books SET item_type = 'ebook' WHERE format = 'ebook' AND COALESCE(item_type,'') <> 'ebook'"); } catch {}

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

module.exports = { getDb, DB_PATH };
