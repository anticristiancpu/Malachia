PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- Autori
CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_sort TEXT,
  birth_date TEXT,
  death_date TEXT,
  nationality TEXT,
  biography TEXT,
  photo_url TEXT,
  viaf_id TEXT,
  isni TEXT,
  wikipedia_url TEXT,
  alternate_names TEXT, -- JSON array
  follow INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Generi (tassonomia gerarchica)
CREATE TABLE IF NOT EXISTS genres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES genres(id),
  slug TEXT UNIQUE
);

-- Libri
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  original_title TEXT,
  publisher TEXT,
  publisher_place TEXT,
  year INTEGER,
  edition INTEGER,
  reprint INTEGER,
  isbn10 TEXT,
  isbn13 TEXT,
  language TEXT,
  original_language TEXT,
  reading_language TEXT,
  pages INTEGER,
  genre_id TEXT REFERENCES genres(id),
  series_name TEXT,
  series_volume REAL,
  cover_url TEXT,
  cover_local TEXT,
  cover_palette TEXT, -- JSON [bg, fg, accent]
  cover_variant TEXT DEFAULT 'monastic',
  synopsis TEXT,
  status TEXT DEFAULT 'tbr' CHECK(status IN ('wishlist','tbr','reading','read','abandoned')),
  current_page INTEGER DEFAULT 0,
  difficulty INTEGER CHECK(difficulty BETWEEN 1 AND 5),
  location_room TEXT,
  location_bookcase TEXT,
  location_shelf INTEGER,
  location_position INTEGER,
  format TEXT DEFAULT 'paperback' CHECK(format IN ('hardcover','paperback','ebook','audiobook','comics')),
  condition TEXT CHECK(condition IN ('new','good','fair','poor')),
  acquisition TEXT CHECK(acquisition IN ('purchased','gift','loan','digital')),
  price REAL,
  signed INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]', -- JSON array
  discovered_via TEXT,
  personal_notes TEXT,
  average_rating REAL,
  -- ID esterni
  goodreads_id TEXT,
  google_books_id TEXT,
  open_library_id TEXT,
  amazon_asin TEXT,
  hardcover_id TEXT,
  -- Collezionismo
  edition_type TEXT,
  print_run INTEGER,
  copy_number TEXT,
  spine_condition TEXT,
  foxing INTEGER DEFAULT 0,
  underlinings INTEGER DEFAULT 0,
  missing_pages INTEGER DEFAULT 0,
  binding_condition TEXT,
  smell_notes TEXT,
  provenance TEXT,
  previous_owners TEXT,
  ex_libris TEXT,
  stamps TEXT,
  manuscript_notes TEXT,
  inscriptions TEXT, -- JSON [{signer, date, occasion, text, personalized}]
  purchase_date TEXT,
  market_value REAL,
  value_log TEXT DEFAULT '[]', -- JSON
  insurance_flag INTEGER DEFAULT 0,
  insurance_value REAL,
  insurance_policy TEXT,
  for_sale INTEGER DEFAULT 0,
  asking_price REAL,
  -- Metadati Grimmory
  grimmory_id TEXT,
  grimmory_synced_at TEXT,
  file_format TEXT,
  file_size INTEGER,
  reading_progress REAL,
  annotation_count INTEGER,
  source_removed INTEGER DEFAULT 0,
  -- Misc
  favorite INTEGER DEFAULT 0,
  added_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Relazione libri-autori
CREATE TABLE IF NOT EXISTS book_authors (
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES authors(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'author' CHECK(role IN ('author','editor','translator','illustrator')),
  display_order INTEGER DEFAULT 0,
  PRIMARY KEY (book_id, author_id, role)
);

-- Sessioni di lettura
CREATE TABLE IF NOT EXISTS reading_sessions (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  from_page INTEGER DEFAULT 0,
  to_page INTEGER DEFAULT 0,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  notes TEXT
);

-- Storico letture (per conteggio relectures)
CREATE TABLE IF NOT EXISTS reading_history (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  date_start TEXT,
  date_end TEXT,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  notes TEXT,
  reread_number INTEGER DEFAULT 1
);

-- Note e citazioni
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  page INTEGER,
  quote TEXT,
  gloss TEXT,
  note_type TEXT DEFAULT 'quote' CHECK(note_type IN ('quote','note','annotation')),
  tags TEXT DEFAULT '[]', -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Scaffali / Collezioni
CREATE TABLE IF NOT EXISTS shelves (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  cover_url TEXT,
  shelf_type TEXT DEFAULT 'custom',
  public INTEGER DEFAULT 0,
  share_token TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shelf_books (
  shelf_id TEXT REFERENCES shelves(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  added_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (shelf_id, book_id)
);

-- Prestiti
CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,
  loan_date TEXT NOT NULL,
  expected_return TEXT,
  actual_return TEXT,
  notes TEXT,
  active INTEGER DEFAULT 1
);

-- Lista desideri
CREATE TABLE IF NOT EXISTS wishlist (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT,
  year INTEGER,
  isbn TEXT,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
  estimated_price REAL,
  shop_notes TEXT,
  shop_url TEXT,
  notes TEXT,
  cover_url TEXT,
  goodreads_id TEXT,
  google_books_id TEXT,
  tags TEXT DEFAULT '[]',
  acquired INTEGER DEFAULT 0,
  added_at TEXT DEFAULT (datetime('now'))
);

-- Riviste / Testate
CREATE TABLE IF NOT EXISTS periodicals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  publisher TEXT,
  issn TEXT,
  country TEXT,
  language TEXT,
  frequency TEXT,
  subject TEXT,
  cover_url TEXT,
  year_start INTEGER,
  year_end INTEGER,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS periodical_issues (
  id TEXT PRIMARY KEY,
  periodical_id TEXT NOT NULL REFERENCES periodicals(id) ON DELETE CASCADE,
  issue_number TEXT,
  volume TEXT,
  issue_date TEXT,
  special_flag INTEGER DEFAULT 0,
  cover_url TEXT,
  condition TEXT,
  location TEXT,
  summary TEXT,
  owned INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Libri correlati
CREATE TABLE IF NOT EXISTS related_books (
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  related_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  relation_type TEXT DEFAULT 'related',
  PRIMARY KEY (book_id, related_id)
);

-- Impostazioni
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_year ON books(year);
CREATE INDEX IF NOT EXISTS idx_books_isbn13 ON books(isbn13);
CREATE INDEX IF NOT EXISTS idx_books_goodreads ON books(goodreads_id);
CREATE INDEX IF NOT EXISTS idx_notes_book ON notes(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_active ON loans(active);
CREATE INDEX IF NOT EXISTS idx_reading_history_book ON reading_history(book_id);

-- FTS5 per ricerca full-text
CREATE VIRTUAL TABLE IF NOT EXISTS books_fts USING fts5(
  id UNINDEXED,
  title, subtitle, original_title, author_names,
  publisher, synopsis, personal_notes, tags,
  isbn10, isbn13,
  content='',
  tokenize='unicode61'
);
