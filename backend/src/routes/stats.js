const express = require('express');
const router  = express.Router();
const { getDb } = require('../db');

function q(db, sql, params = []) {
  try { return db.prepare(sql).all(...params); } catch { return []; }
}
function qOne(db, sql, params = []) {
  try { return db.prepare(sql).get(...params); } catch { return null; }
}

// GET /api/stats
router.get('/', (req, res) => {
  const db = getDb();

  // Auto-migrazione: crea colonne mancanti prima di usarle
  const existingCols = new Set(db.prepare('PRAGMA table_info(books)').all().map(r => r.name));
  if (!existingCols.has('volumes_count')) {
    try { db.exec('ALTER TABLE books ADD COLUMN volumes_count INTEGER DEFAULT 1'); } catch {}
  }
  if (!existingCols.has('copies_owned')) {
    try { db.exec('ALTER TABLE books ADD COLUMN copies_owned INTEGER DEFAULT 1'); } catch {}
  }

  /* ══════════════════════════════════════════════════════════════
     LIBRERIA
  ══════════════════════════════════════════════════════════════ */
  const totalBooks = qOne(db, `
    SELECT COALESCE(SUM(COALESCE(volumes_count,1) * COALESCE(copies_owned,1)), 0) as n
    FROM books WHERE status != 'wishlist'
  `)?.n || 0;

  const totalPagesCollection = qOne(db, `
    SELECT COALESCE(SUM(pages),0) as n FROM books
    WHERE pages IS NOT NULL AND status != 'wishlist'
  `)?.n || 0;

  const avgPages = qOne(db, `
    SELECT ROUND(AVG(pages)) as avg FROM books
    WHERE pages IS NOT NULL AND status != 'wishlist'
  `)?.avg || null;

  const booksWithLocation = qOne(db,
    "SELECT COUNT(*) as n FROM books WHERE location_room IS NOT NULL AND status != 'wishlist'"
  )?.n || 0;

  const signedBooks = qOne(db,
    "SELECT COUNT(*) as n FROM books WHERE signed = 1 AND status != 'wishlist'"
  )?.n || 0;

  const booksWithCover = qOne(db,
    "SELECT COUNT(*) as n FROM books WHERE (cover_url IS NOT NULL OR cover_local IS NOT NULL) AND status != 'wishlist'"
  )?.n || 0;

  const longestBook = qOne(db,
    "SELECT title, pages FROM books WHERE pages IS NOT NULL AND status != 'wishlist' ORDER BY pages DESC LIMIT 1"
  );

  const booksInSeries = qOne(db,
    "SELECT COUNT(*) as n FROM books WHERE series_name IS NOT NULL AND series_name != '' AND status != 'wishlist'"
  )?.n || 0;

  const totalMarketValue = qOne(db,
    "SELECT COALESCE(SUM(market_value),0) as n FROM books WHERE market_value IS NOT NULL AND market_value > 0 AND status != 'wishlist'"
  )?.n || 0;

  const avgMarketValue = qOne(db,
    "SELECT ROUND(AVG(market_value),2) as avg FROM books WHERE market_value IS NOT NULL AND market_value > 0 AND status != 'wishlist'"
  )?.avg || null;

  const booksWithValue = qOne(db,
    "SELECT COUNT(*) as n FROM books WHERE market_value IS NOT NULL AND market_value > 0 AND status != 'wishlist'"
  )?.n || 0;

  const topValueBooks = q(db, `
    SELECT b.title, GROUP_CONCAT(a.name, ', ') as author_names, b.market_value
    FROM books b
    LEFT JOIN book_authors ba ON ba.book_id = b.id AND ba.role = 'author'
    LEFT JOIN authors a ON a.id = ba.author_id
    WHERE b.market_value IS NOT NULL AND b.market_value > 0 AND b.status != 'wishlist'
    GROUP BY b.id ORDER BY b.market_value DESC LIMIT 10
  `);

  const uniqueSeries = qOne(db,
    "SELECT COUNT(DISTINCT series_name) as n FROM books WHERE series_name IS NOT NULL AND series_name != '' AND status != 'wishlist'"
  )?.n || 0;

  const topSeries = q(db, `
    SELECT series_name, COUNT(*) as count FROM books
    WHERE series_name IS NOT NULL AND series_name != '' AND status != 'wishlist'
    GROUP BY series_name ORDER BY count DESC LIMIT 8
  `);

  const byStatus = q(db,
    "SELECT status, COUNT(*) as count FROM books WHERE status != 'wishlist' GROUP BY status"
  );

  const byFormat = q(db, `
    SELECT format, COUNT(*) as count FROM books
    WHERE status != 'wishlist' GROUP BY format ORDER BY count DESC
  `);

  const byLanguage = q(db, `
    SELECT language, COUNT(*) as count FROM books
    WHERE status != 'wishlist' AND language IS NOT NULL AND language != ''
    GROUP BY language ORDER BY count DESC LIMIT 10
  `);

  const byGenreCollection = q(db, `
    SELECT g.name, COUNT(*) as count
    FROM books b JOIN genres g ON g.id = b.genre_id
    WHERE b.status != 'wishlist'
    GROUP BY g.id ORDER BY count DESC LIMIT 10
  `);

  const byDecade = q(db, `
    SELECT (year/10)*10 as decade, COUNT(*) as count FROM books
    WHERE year IS NOT NULL AND year > 0 AND status != 'wishlist'
    GROUP BY decade ORDER BY decade
  `);

  const addedPerYear = q(db, `
    SELECT strftime('%Y', added_at) as yr, COUNT(*) as count FROM books
    WHERE status != 'wishlist' GROUP BY yr ORDER BY yr
  `);

  const recentlyAdded = q(db, `
    SELECT b.title, GROUP_CONCAT(a.name, ', ') as author_names, b.added_at
    FROM books b
    LEFT JOIN book_authors ba ON ba.book_id = b.id AND ba.role = 'author'
    LEFT JOIN authors a ON a.id = ba.author_id
    WHERE b.status != 'wishlist'
    GROUP BY b.id ORDER BY b.added_at DESC LIMIT 5
  `);

  /* ══════════════════════════════════════════════════════════════
     LETTURA
  ══════════════════════════════════════════════════════════════ */
  const totalBooksRead = qOne(db,
    "SELECT COUNT(*) as n FROM books WHERE status = 'read'"
  )?.n || 0;

  const totalPagesRead = qOne(db,
    "SELECT COALESCE(SUM(pages),0) as n FROM books WHERE status = 'read' AND pages IS NOT NULL"
  )?.n || 0;

  const avgRating = qOne(db,
    "SELECT ROUND(AVG(rating),1) as avg FROM reading_history WHERE rating IS NOT NULL"
  )?.avg || null;

  const readPerYear = q(db, `
    SELECT strftime('%Y', date_end) as yr, COUNT(*) as count
    FROM reading_history WHERE date_end IS NOT NULL
    GROUP BY yr ORDER BY yr
  `);

  const ratingDistribution = q(db, `
    SELECT rating, COUNT(*) as count FROM reading_history
    WHERE rating IS NOT NULL GROUP BY rating ORDER BY rating DESC
  `);

  const currentlyReading = qOne(db,
    "SELECT COUNT(*) as n FROM books WHERE status = 'reading'"
  )?.n || 0;

  const abandonedCount = qOne(db,
    "SELECT COUNT(*) as n FROM books WHERE status = 'abandoned'"
  )?.n || 0;

  const avgReadingDuration = qOne(db, `
    SELECT ROUND(AVG(julianday(date_end) - julianday(date_start))) as avg
    FROM reading_history WHERE date_start IS NOT NULL AND date_end IS NOT NULL
  `)?.avg || null;

  const longestRead = qOne(db, `
    SELECT b.title, CAST(ROUND(julianday(rh.date_end) - julianday(rh.date_start)) AS INTEGER) as days
    FROM reading_history rh JOIN books b ON b.id = rh.book_id
    WHERE rh.date_start IS NOT NULL AND rh.date_end IS NOT NULL
    ORDER BY days DESC LIMIT 1
  `);

  const fastestRead = qOne(db, `
    SELECT b.title, CAST(ROUND(julianday(rh.date_end) - julianday(rh.date_start)) AS INTEGER) as days
    FROM reading_history rh JOIN books b ON b.id = rh.book_id
    WHERE rh.date_start IS NOT NULL AND rh.date_end IS NOT NULL
    AND julianday(rh.date_end) >= julianday(rh.date_start)
    ORDER BY days ASC LIMIT 1
  `);

  const topRatedBooks = q(db, `
    SELECT b.title, GROUP_CONCAT(a.name, ', ') as author_names, MAX(rh.rating) as rating
    FROM reading_history rh
    JOIN books b ON b.id = rh.book_id
    LEFT JOIN book_authors ba ON ba.book_id = b.id AND ba.role = 'author'
    LEFT JOIN authors a ON a.id = ba.author_id
    WHERE rh.rating = 5
    GROUP BY b.id ORDER BY rh.date_end DESC LIMIT 5
  `);

  const rereadsCount = qOne(db,
    "SELECT COUNT(*) as n FROM reading_history WHERE reread_number > 1"
  )?.n || 0;

  /* ══════════════════════════════════════════════════════════════
     AUTORI & EDITORI
  ══════════════════════════════════════════════════════════════ */
  const totalAuthorsCount = qOne(db, `
    SELECT COUNT(DISTINCT a.id) as n
    FROM authors a
    JOIN book_authors ba ON a.id = ba.author_id
    JOIN books b ON b.id = ba.book_id
    WHERE b.status != 'wishlist' AND ba.role = 'author'
  `)?.n || 0;

  const totalAuthorsDB   = qOne(db, "SELECT COUNT(*) as n FROM authors")?.n || 0;
  const followedAuthors  = qOne(db, "SELECT COUNT(*) as n FROM authors WHERE follow = 1")?.n || 0;

  const topAuthors = q(db, `
    SELECT a.name, COUNT(*) as count
    FROM authors a
    JOIN book_authors ba ON a.id = ba.author_id
    JOIN books b ON b.id = ba.book_id
    WHERE b.status != 'wishlist' AND ba.role = 'author'
    GROUP BY a.id ORDER BY count DESC LIMIT 10
  `);

  const authorsByNationality = q(db, `
    SELECT nationality, COUNT(*) as count FROM authors
    WHERE nationality IS NOT NULL AND nationality != ''
    GROUP BY nationality ORDER BY count DESC LIMIT 10
  `);

  const authorsByRole = q(db, `
    SELECT ba.role, COUNT(DISTINCT ba.author_id) as count
    FROM book_authors ba JOIN books b ON b.id = ba.book_id
    WHERE b.status != 'wishlist'
    GROUP BY ba.role ORDER BY count DESC
  `);

  const totalPublishersCount = qOne(db, `
    SELECT COUNT(DISTINCT publisher) as n FROM books
    WHERE publisher IS NOT NULL AND publisher != '' AND status != 'wishlist'
  `)?.n || 0;

  const topPublishers = q(db, `
    SELECT publisher, COUNT(*) as count FROM books
    WHERE publisher IS NOT NULL AND publisher != '' AND status != 'wishlist'
    GROUP BY publisher ORDER BY count DESC LIMIT 10
  `);

  /* ══════════════════════════════════════════════════════════════
     SCAFFALI
  ══════════════════════════════════════════════════════════════ */
  const shelfCount       = qOne(db, "SELECT COUNT(*) as n FROM shelves")?.n || 0;
  const totalShelfAssoc  = qOne(db, "SELECT COUNT(*) as n FROM shelf_books")?.n || 0;
  const avgBooksPerShelf = shelfCount > 0 ? Math.round(totalShelfAssoc / shelfCount) : 0;

  const shelfStats = q(db, `
    SELECT s.name, COUNT(sb.book_id) as book_count
    FROM shelves s LEFT JOIN shelf_books sb ON s.id = sb.shelf_id
    GROUP BY s.id ORDER BY book_count DESC LIMIT 10
  `);

  const booksInNoShelf = qOne(db, `
    SELECT COUNT(*) as n FROM books
    WHERE status != 'wishlist'
    AND id NOT IN (SELECT book_id FROM shelf_books)
  `)?.n || 0;

  /* ══════════════════════════════════════════════════════════════
     DESIDERATA
  ══════════════════════════════════════════════════════════════ */
  const wishlistCount        = qOne(db, "SELECT COUNT(*) as n FROM books WHERE status = 'wishlist'")?.n || 0;
  const wishlistTableCount   = qOne(db, "SELECT COUNT(*) as n FROM wishlist WHERE acquired = 0")?.n || 0;
  const wishlistAcquired     = qOne(db, "SELECT COUNT(*) as n FROM wishlist WHERE acquired = 1")?.n || 0;
  const wishlistEstimatedVal = qOne(db, "SELECT COALESCE(SUM(estimated_price),0) as n FROM wishlist WHERE acquired = 0")?.n || 0;

  const wishlistByPriority = q(db, `
    SELECT priority, COUNT(*) as count FROM wishlist
    WHERE acquired = 0 GROUP BY priority ORDER BY count DESC
  `);

  /* ══════════════════════════════════════════════════════════════
     NOTE
  ══════════════════════════════════════════════════════════════ */
  const totalNotes    = qOne(db, "SELECT COUNT(*) as n FROM notes")?.n || 0;
  const notesWithTags = qOne(db, "SELECT COUNT(*) as n FROM notes WHERE tags IS NOT NULL AND tags != '[]'")?.n || 0;

  const notesByType = q(db,
    "SELECT note_type, COUNT(*) as count FROM notes GROUP BY note_type ORDER BY count DESC"
  );

  const notesPerBook = q(db, `
    SELECT b.title, COUNT(*) as note_count
    FROM notes n JOIN books b ON b.id = n.book_id
    WHERE n.book_id IS NOT NULL
    GROUP BY b.id ORDER BY note_count DESC LIMIT 5
  `);

  /* ══════════════════════════════════════════════════════════════
     PRESTITI
  ══════════════════════════════════════════════════════════════ */
  const totalLoans  = qOne(db, "SELECT COUNT(*) as n FROM loans")?.n || 0;
  const activeLoans = qOne(db, "SELECT COUNT(*) as n FROM loans WHERE active = 1")?.n || 0;

  const overdueLoans = qOne(db, `
    SELECT COUNT(*) as n FROM loans
    WHERE active = 1 AND expected_return IS NOT NULL
    AND expected_return < date('now')
  `)?.n || 0;

  const avgLoanDays = qOne(db, `
    SELECT ROUND(AVG(julianday(actual_return) - julianday(loan_date))) as avg
    FROM loans WHERE actual_return IS NOT NULL
  `)?.avg || null;

  const topBorrowers = q(db, `
    SELECT borrower_name, COUNT(*) as count FROM loans
    GROUP BY borrower_name ORDER BY count DESC LIMIT 5
  `);

  res.json({
    // Libreria
    total_books:             totalBooks,
    total_pages_collection:  totalPagesCollection,
    avg_pages:               avgPages,
    books_with_location:     booksWithLocation,
    signed_books:            signedBooks,
    books_with_cover:        booksWithCover,
    longest_book:            longestBook,
    books_in_series:         booksInSeries,
    unique_series:           uniqueSeries,
    total_market_value:      totalMarketValue,
    avg_market_value:        avgMarketValue,
    books_with_value:        booksWithValue,
    top_value_books:         topValueBooks,
    top_series:              topSeries,
    by_status:               byStatus,
    by_format:               byFormat,
    by_language:             byLanguage,
    by_genre_collection:     byGenreCollection,
    by_decade:               byDecade,
    added_per_year:          addedPerYear,
    recently_added:          recentlyAdded,

    // Lettura
    total_books_read:        totalBooksRead,
    total_pages_read:        totalPagesRead,
    avg_rating:              avgRating,
    read_per_year:           readPerYear,
    rating_distribution:     ratingDistribution,
    currently_reading:       currentlyReading,
    abandoned_count:         abandonedCount,
    avg_reading_duration:    avgReadingDuration,
    longest_read:            longestRead,
    fastest_read:            fastestRead,
    top_rated_books:         topRatedBooks,
    rereads_count:           rereadsCount,

    // Autori & Editori
    total_authors_count:     totalAuthorsCount,
    total_authors_db:        totalAuthorsDB,
    followed_authors:        followedAuthors,
    top_authors:             topAuthors,
    authors_by_nationality:  authorsByNationality,
    authors_by_role:         authorsByRole,
    total_publishers_count:  totalPublishersCount,
    top_publishers:          topPublishers,

    // Scaffali
    shelf_count:             shelfCount,
    shelf_stats:             shelfStats,
    total_shelf_assoc:       totalShelfAssoc,
    avg_books_per_shelf:     avgBooksPerShelf,
    books_in_no_shelf:       booksInNoShelf,

    // Desiderata
    wishlist_count:          wishlistCount,
    wishlist_table_count:    wishlistTableCount,
    wishlist_acquired:       wishlistAcquired,
    wishlist_estimated_value: wishlistEstimatedVal,
    wishlist_by_priority:    wishlistByPriority,

    // Note
    total_notes:             totalNotes,
    notes_with_tags:         notesWithTags,
    notes_by_type:           notesByType,
    notes_per_book:          notesPerBook,

    // Prestiti
    total_loans:             totalLoans,
    active_loans:            activeLoans,
    overdue_loans:           overdueLoans,
    avg_loan_days:           avgLoanDays,
    top_borrowers:           topBorrowers,
  });
});

module.exports = router;
