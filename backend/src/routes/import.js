const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { searchBooks: googleSearch, getByISBN: googleByISBN, searchByTitleAuthor: googleByTitle } = require('../services/googleBooks');
const { searchBooks: olSearch, searchByTitleAuthor: olByTitle, getByISBN: olByISBN } = require('../services/openLibrary');
const { searchGoodreads, getBookDetail, parseGoodreadsCSV, DISCLAIMER } = require('../services/goodreads');
const { searchBooks: libraccioSearch, searchByTitleAuthor: libraccioByTitle, getByISBN: libraccioByISBN } = require('../services/libraccio');
const { searchBooks: sbnSearch, searchByTitleAuthor: sbnByTitle, getByISBN: sbnByISBN } = require('../services/sbn');

// Deduplication per ISBN13/ISBN10 e titolo normalizzato
function dedup(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.isbn13 || item.isbn10 || (item.title || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// POST /api/import/search — ricerca multi-provider
// Accetta: { query, isbn, providers } oppure { title, author, isbn, providers }
router.post('/search', async (req, res) => {
  try {
    const { query, title, author, isbn, providers = ['google_books', 'open_library', 'sbn'] } = req.body;
    const results = [];

    if (isbn) {
      // ISBN: cascata seriale — primo risultato valido vince
      const chain = [];
      if (providers.includes('google_books')) chain.push(() => googleByISBN(isbn));
      if (providers.includes('open_library'))  chain.push(() => olByISBN(isbn));
      if (providers.includes('libraccio'))     chain.push(() => libraccioByISBN(isbn));
      if (providers.includes('sbn'))           chain.push(() => sbnByISBN(isbn));
      for (const fn of chain) {
        try {
          const r = await fn();
          if (r?.title) { results.push(r); break; }
        } catch (e) { console.warn('ISBN search error:', e.message); }
      }
    } else {
      // Testo: ricerca parallela + dedup
      // Se arrivano title+author separati usiamo quelli, altrimenti il query generico
      const q = query || [title, author].filter(Boolean).join(' ');
      if (!q) return res.json({ results: [] });

      const promises = [];
      if (providers.includes('google_books')) {
        // Preferisce intitle+inauthor (precisa), fallback a query libera
        const gbSearch = (title)
          ? googleByTitle(title, author || undefined)
          : googleByTitle(q);
        promises.push(
          gbSearch.catch(() => googleSearch(q).catch(() => []))
        );
      }
      if (providers.includes('open_library')) {
        const olSearchFn = (title)
          ? olByTitle(title, author || undefined)
          : olSearch(q);
        promises.push(olSearchFn.catch(e => { console.warn('OL search error:', e.message); return []; }));
      }
      if (providers.includes('libraccio')) {
        const libFn = (title)
          ? libraccioByTitle(title, author || undefined)
          : libraccioSearch(q);
        promises.push(libFn.catch(e => { console.warn('Libraccio search error:', e.message); return []; }));
      }
      if (providers.includes('sbn')) {
        const sbnFn = (title)
          ? sbnByTitle(title, author || undefined)
          : sbnSearch(q);
        promises.push(sbnFn.catch(e => { console.warn('SBN search error:', e.message); return []; }));
      }
      const all = await Promise.allSettled(promises);
      for (const r of all) {
        if (r.status === 'fulfilled') results.push(...(r.value || []));
      }
    }

    res.json({ results: dedup(results) });
  } catch (e) {
    console.error('Import search error:', e);
    res.status(500).json({ error: e.message, results: [] });
  }
});

// POST /api/import/goodreads/search — scraping Goodreads
router.post('/goodreads/search', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query richiesta' });
  const data = await searchGoodreads(query);
  res.json(data);
});

// GET /api/import/goodreads/debug?q=...&id=... — diagnostica (solo sviluppo)
router.get('/goodreads/debug', async (req, res) => {
  const axios = require('axios');
  const q  = req.query.q  || 'harry potter';
  const id = req.query.id || null; // es. ?id=5 per testare la pagina del libro
  const results = {};

  const HEADERS_HTML = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'sec-ch-ua': '"Chromium";v="131", "Google Chrome";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'device-memory': '8',
    'dpr': '2',
    'ect': '4g',
    'rtt': '50',
    'Sec-Fetch-User': '?1',
  };

  // 1. Test autocomplete JSON
  try {
    const r = await axios.get(`https://www.goodreads.com/book/auto_complete?format=json&q=${encodeURIComponent(q)}`, {
      headers: {
        'User-Agent': HEADERS_HTML['User-Agent'],
        'Accept': 'application/json, */*',
        'Referer': 'https://www.goodreads.com/',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: 10000, validateStatus: () => true,
    });
    const firstId = Array.isArray(r.data) ? String(r.data[0]?.bookId || '') : null;
    results.autocomplete = {
      status: r.status,
      isArray: Array.isArray(r.data),
      count: Array.isArray(r.data) ? r.data.length : 0,
      firstBookId: firstId,
      sample: Array.isArray(r.data) ? r.data.slice(0, 2) : String(r.data).slice(0, 300),
    };
    // Usa il primo id trovato se non specificato via ?id=
    if (!id && firstId) results._testId = firstId;
  } catch (e) { results.autocomplete = { error: e.message }; }

  // 2. Test pagina di ricerca HTML
  try {
    const r = await axios.get(`https://www.goodreads.com/search?q=${encodeURIComponent(q)}&search_type=books`, {
      headers: HEADERS_HTML, timeout: 12000, validateStatus: () => true, maxRedirects: 5,
    });
    const html = typeof r.data === 'string' ? r.data : '';
    results.html_search = {
      status: r.status,
      finalUrl: r.request?.res?.responseUrl || '?',
      htmlLength: html.length,
      hasCloudflare: html.includes('cf-challenge') || html.includes('challenge-platform'),
      hasLoginRedirect: html.includes('sign_in'),
      hasBookRows: html.includes('itemtype="http://schema.org/Book"'),
      hasNextData: html.includes('__NEXT_DATA__'),
      snippet: html.slice(0, 400).replace(/\s+/g, ' '),
    };
  } catch (e) { results.html_search = { error: e.message }; }

  // 3. Test pagina del singolo libro (la più importante!)
  const bookId = id || results._testId;
  if (bookId) {
    try {
      const r = await axios.get(`https://www.goodreads.com/book/show/${bookId}`, {
        headers: HEADERS_HTML, timeout: 20000, validateStatus: () => true, maxRedirects: 5,
      });
      const html = typeof r.data === 'string' ? r.data : '';

      // Estrai chiavi Apollo state se __NEXT_DATA__ presente
      let apolloKeys = [];
      let bookFields = null;
      if (html.includes('__NEXT_DATA__')) {
        try {
          const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
          if (m) {
            const nd = JSON.parse(m[1]);
            const state = nd?.props?.pageProps?.apolloState
              || nd?.props?.apolloState
              || nd?.props?.pageProps?.initialProps?.apolloState
              || {};
            apolloKeys = Object.keys(state).filter(k =>
              k.includes('Book') || k.includes('Work')
            ).slice(0, 10);
            // Prova a trovare un libro nell'Apollo state
            for (const [key, val] of Object.entries(state)) {
              if (val?.title && (key.startsWith('Book:') || key.startsWith('Work:'))) {
                const det = val.details || val.bookDetails || {};
                bookFields = {
                  apolloKey: key,
                  title: val.title,
                  legacyId: val.legacyId,
                  numPages: det.numPages || val.numPages,
                  publisher: det.publisher || val.publisher,
                  publicationDate: det.publicationDate || val.originalPublicationDate,
                  isbn13: det.isbn13 || val.isbn13,
                  isbn10: det.isbn || det.isbn10 || val.isbn10,
                };
                break;
              }
            }
          }
        } catch {}
      }

      results.book_page = {
        status: r.status,
        finalUrl: r.request?.res?.responseUrl || '?',
        htmlLength: html.length,
        hasCloudflare: html.includes('cf-challenge') || html.includes('challenge-platform'),
        hasLoginRedirect: html.includes('sign_in'),
        hasNextData: html.includes('__NEXT_DATA__'),
        hasJsonLd: html.includes('application/ld+json'),
        hasBookTitle: html.includes('bookTitle') || html.includes('data-testid="bookTitle"'),
        apolloBookKeys: apolloKeys,
        extractedBookFields: bookFields,
        snippet: html.slice(0, 500).replace(/\s+/g, ' '),
      };
    } catch (e) { results.book_page = { error: e.message }; }
  } else {
    results.book_page = { skipped: 'nessun bookId disponibile — aggiungi ?id=NUMERO_LIBRO' };
  }

  res.json(results);
});

// GET /api/import/goodreads/:id — dettaglio libro Goodreads
router.get('/goodreads/:id', async (req, res) => {
  const maxReviews = parseInt(req.query.reviews) || 5;
  const data = await getBookDetail(req.params.id, maxReviews);
  res.json(data);
});

// POST /api/import/goodreads/csv — importazione CSV Goodreads
router.post('/goodreads/csv', (req, res) => {
  if (!req.files?.file) return res.status(400).json({ error: 'File CSV mancante' });
  try {
    const content = req.files.file.data.toString('utf8');
    const rows = parseGoodreadsCSV(content);
    const db = getDb();

    // Preview con rilevamento duplicati
    const preview = rows.map(row => {
      const dupIsbn = row.isbn13 ? db.prepare('SELECT id, title FROM books WHERE isbn13 = ?').get(row.isbn13) : null;
      const dupTitle = !dupIsbn ? db.prepare("SELECT id, title FROM books WHERE title = ? AND title != ''").get(row.title) : null;
      return { ...row, duplicate: dupIsbn || dupTitle || null };
    });

    res.json({ preview, total: rows.length, disclaimer: DISCLAIMER });
  } catch (e) {
    res.status(400).json({ error: 'Errore parsing CSV: ' + e.message });
  }
});

// POST /api/import/goodreads/csv/confirm — conferma importazione
router.post('/goodreads/csv/confirm', async (req, res) => {
  const { rows, skip_duplicates = true } = req.body;
  if (!rows?.length) return res.status(400).json({ error: 'rows richieste' });

  const db = getDb();
  const imported = []; const skipped = []; const errors = [];

  for (const row of rows) {
    try {
      // Salta duplicati se richiesto
      if (skip_duplicates && row.duplicate) { skipped.push(row.title); continue; }

      // Trova o crea autore
      let authorId = null;
      if (row.author) {
        const existing = db.prepare("SELECT id FROM authors WHERE name = ?").get(row.author);
        if (existing) {
          authorId = existing.id;
        } else {
          authorId = uuidv4();
          db.prepare("INSERT INTO authors (id, name, name_sort) VALUES (?,?,?)").run(authorId, row.author, makeSortName(row.author));
        }
      }

      const bookId = uuidv4();
      db.prepare(`INSERT INTO books (
        id, title, isbn10, isbn13, publisher, pages, year, status, tags,
        personal_notes, goodreads_id, format, average_rating, added_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        bookId, row.title, row.isbn10, row.isbn13, row.publisher, row.pages, row.year,
        row.status, JSON.stringify(row.tags || []), row.personal_notes,
        row.goodreads_id, row.format, row.average_rating,
        row.date_added || new Date().toISOString()
      );

      if (authorId) {
        db.prepare("INSERT OR IGNORE INTO book_authors (book_id, author_id, role, display_order) VALUES (?,?,?,?)")
          .run(bookId, authorId, 'author', 0);
      }

      // Aggiungi autori aggiuntivi
      for (const addName of (row.additional_authors || [])) {
        let addId = db.prepare("SELECT id FROM authors WHERE name = ?").get(addName)?.id;
        if (!addId) {
          addId = uuidv4();
          db.prepare("INSERT INTO authors (id, name, name_sort) VALUES (?,?,?)").run(addId, addName, makeSortName(addName));
        }
        db.prepare("INSERT OR IGNORE INTO book_authors (book_id, author_id, role, display_order) VALUES (?,?,?,?)")
          .run(bookId, addId, 'author', 1);
      }

      // Storico letture
      if (row.date_read && row.status === 'read') {
        db.prepare("INSERT INTO reading_history (id, book_id, date_end, rating, reread_number) VALUES (?,?,?,?,?)")
          .run(uuidv4(), bookId, row.date_read, row.my_rating, row.read_count || 1);
      }

      imported.push(row.title);
    } catch (e) {
      errors.push({ title: row.title, error: e.message });
    }
  }

  res.json({ imported: imported.length, skipped: skipped.length, errors, disclaimer: DISCLAIMER });
});

// POST /api/import/book — importa singolo libro da dati provider
router.post('/book', (req, res) => {
  const db = getDb();
  const { book_data, authors_data = [], status = 'tbr' } = req.body;
  if (!book_data?.title) return res.status(400).json({ error: 'title richiesto' });

  const bookId = uuidv4();
  const tagsJson = Array.isArray(book_data.tags) ? JSON.stringify(book_data.tags) : '[]';
  const seriesName = book_data.series_name || book_data.series || null;
  const seriesVol  = book_data.series_volume ?? null;
  db.prepare(`INSERT INTO books (
    id, title, subtitle, publisher, year, pages, language, isbn10, isbn13,
    cover_url, synopsis, status, goodreads_id, google_books_id, open_library_id,
    average_rating, tags, series_name, series_volume, market_value
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    bookId, book_data.title, book_data.subtitle||null, book_data.publisher||null,
    book_data.year||null, book_data.pages||null, book_data.language||null,
    book_data.isbn10||null, book_data.isbn13||null, book_data.cover_url||null,
    book_data.synopsis||null, status, book_data.goodreads_id||null,
    book_data.google_books_id||null, book_data.open_library_id||null, book_data.average_rating||null,
    tagsJson, seriesName, seriesVol,
    book_data.market_value != null ? parseFloat(book_data.market_value) : null
  );

  for (let i = 0; i < authors_data.length; i++) {
    const a = authors_data[i];
    let authorId = a.author_id || null;
    if (!authorId && a.name) {
      authorId = db.prepare("SELECT id FROM authors WHERE name = ?").get(a.name)?.id;
      if (!authorId) {
        authorId = uuidv4();
        db.prepare("INSERT INTO authors (id, name, name_sort) VALUES (?,?,?)").run(authorId, a.name, makeSortName(a.name));
      }
    }
    if (authorId) {
      db.prepare("INSERT OR IGNORE INTO book_authors (book_id, author_id, role, display_order) VALUES (?,?,?,?)")
        .run(bookId, authorId, a.role || 'author', i);
    }
  }

  res.status(201).json({ id: bookId });
});

const SORT_PARTICLES = new Set([
  'de', 'di', 'del', 'della', 'degli', 'dei', "de'", "d'",
  'van', 'von', 'le', 'la', 'du', 'des', 'ten', 'ter', 'lo', 'al', 'el',
]);

function makeSortName(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.toLowerCase();
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
