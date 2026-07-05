const axios = require('axios');
const cheerio = require('cheerio');

const DISCLAIMER = "Metadati recuperati tramite scraping delle pagine pubbliche di goodreads.com. Goodreads non ha un'API pubblica. I risultati dipendono dalla disponibilità del sito.";

function randomDelay(min = 500, max = 1200) {
  return new Promise(r => setTimeout(r, min + Math.floor(Math.random() * (max - min))));
}

const HEADERS_HTML = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'max-age=0',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  // Client Hints — necessari per passare il WAF di GR (Grimmory li usa)
  'sec-ch-ua': '"Chromium";v="131", "Google Chrome";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-ch-ua-platform-version': '"14.0.0"',
  'sec-ch-ua-arch': '"arm"',
  'sec-ch-ua-bitness': '"64"',
  'sec-ch-ua-full-version-list': '"Chromium";v="131.0.6778.205", "Google Chrome";v="131.0.6778.205", "Not_A Brand";v="24.0.0.0"',
  'device-memory': '8',
  'dpr': '2',
  'ect': '4g',
  'rtt': '50',
};

const HEADERS_JSON = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'X-Requested-With': 'XMLHttpRequest',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Referer': 'https://www.goodreads.com/',
};

/* ─── Diagnostica HTTP ──────────────────────────────────────────── */
function diagnoseHtml(resp) {
  const html = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
  const finalUrl = resp.request?.res?.responseUrl || '';
  if (resp.status === 403 || resp.status === 429)
    throw new Error(`Goodreads ha bloccato la richiesta (HTTP ${resp.status})`);
  if (html.includes('cf-challenge') || html.includes('challenge-platform'))
    throw new Error('Cloudflare ha bloccato la richiesta');
  // ATTENZIONE: html.includes('/user/sign_in') NON va usato — quel link è presente
  // nel navbar di OGNI pagina Goodreads, anche quelle caricate correttamente.
  // Controllare solo l'URL finale (redirect reale) o la presenza del form di login.
  if (finalUrl.includes('sign_in')
    || html.includes('action="/user/sign_in"')
    || html.includes('id="sign_in_form"'))
    throw new Error('Goodreads ha reindirizzato alla pagina di login');
  // WAF / robot-challenge page: risposta molto corta senza contenuto reale
  if (html.length < 8000 && !html.includes('__NEXT_DATA__') && !html.includes('bookTitle') && !html.includes('schema.org'))
    throw new Error('Goodreads WAF: risposta inattesa (possibile blocco bot)');
  console.log(`[GR diagnose] OK — HTTP ${resp.status}, ${html.length} chars, hasNextData=${html.includes('__NEXT_DATA__')}`);
  return html;
}

/* ─── Helpers ───────────────────────────────────────────────────── */
function stripHtmlEntities(str) {
  if (!str) return null;
  return str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim() || null;
}

// Estrae serie e volume dalla stringa titolo GR: "Title (Series Name, #3)"
function parseTitleSeries(fullTitle) {
  if (!fullTitle) return { title: fullTitle, series: null, series_volume: null };
  const m = fullTitle.match(/^(.+?)\s*\(([^)]+),\s*#([\d.]+)\)\s*$/);
  if (m) {
    return {
      title: m[1].trim(),
      series: m[2].trim(),
      series_volume: parseFloat(m[3]) || null,
    };
  }
  return { title: fullTitle, series: null, series_volume: null };
}

/* ─── Autocomplete JSON (endpoint interno GR) ──────────────────── */
async function searchViaAutocomplete(query) {
  const url = `https://www.goodreads.com/book/auto_complete?format=json&q=${encodeURIComponent(query)}`;
  const resp = await axios.get(url, { headers: HEADERS_JSON, timeout: 12000, validateStatus: () => true });
  if (resp.status !== 200 || !Array.isArray(resp.data)) return null;

  return resp.data.slice(0, 12).map(item => {
    const bare  = item.bookTitleBare || null;
    const full  = item.title || bare || null;
    const { title, series, series_volume } = parseTitleSeries(full);

    // Usa bookTitleBare se disponibile, altrimenti il titolo senza serie
    const cleanTitle = bare || title;

    // Sinossi: strip HTML + segnala se troncata
    let synopsis = null;
    if (item.description?.html) {
      synopsis = stripHtmlEntities(item.description.html);
      if (synopsis && item.description.truncated) synopsis += '…'; // …
    }

    // Copertina: rimuove i suffissi di resize ._SY75_. ecc.
    const rawImg = item.imageUrl || '';
    const cover_url = rawImg.replace(/\._[A-Z0-9]+_\./g, '.') || null;

    return {
      source: 'goodreads',
      title: cleanTitle,
      authors: item.author?.name ? [{ name: item.author.name, role: 'author' }] : [],
      cover_url,
      goodreads_id: String(item.bookId || item.id || ''),
      average_rating: item.avgRating   ? parseFloat(item.avgRating)  : null,
      ratings_count:  item.ratingsCount ? parseInt(item.ratingsCount) : null,
      pages:          item.numPages     ? parseInt(item.numPages)     : null,
      synopsis,
      series,
      series_volume,
    };
  }).filter(b => b.title);
}

/* ─── Scraping HTML search ──────────────────────────────────────── */
async function searchViaHtml(query) {
  const url = `https://www.goodreads.com/search?q=${encodeURIComponent(query)}&search_type=books`;
  const resp = await axios.get(url, { headers: HEADERS_HTML, timeout: 18000, validateStatus: () => true, maxRedirects: 5 });
  const html = diagnoseHtml(resp);
  const $ = cheerio.load(html);
  const results = [];

  $('tr[itemtype="http://schema.org/Book"]').each((i, el) => {
    if (i >= 10) return false;
    const $el = $(el);
    const titleEl = $el.find('a.bookTitle, .bookTitle');
    const title = titleEl.find('span[itemprop="name"]').text().trim() || titleEl.text().trim();
    const author = $el.find('a.authorName span[itemprop="name"]').text().trim() || $el.find('a.authorName').text().trim();
    const coverUrl = $el.find('img.bookCover').attr('src') || null;
    const link = titleEl.attr('href') || '';
    const goodreadsId = link.match(/\/book\/show\/(\d+)/)?.[1] || null;
    const rating = $el.find('.minirating').text().match(/([\d.]+)\s+avg/)?.[1];
    if (title) results.push({
      source: 'goodreads', title,
      authors: author ? [{ name: author, role: 'author' }] : [],
      cover_url: coverUrl ? coverUrl.replace('_SY75_', '_SY300_').replace('_SX50_', '_SX300_') : null,
      goodreads_id: goodreadsId,
      average_rating: rating ? parseFloat(rating) : null,
    });
  });

  if (!results.length) {
    const nextData = extractNextData(html);
    if (nextData) return extractBooksFromApollo(nextData, 10);
    console.warn('[GR search HTML] Nessun risultato, HTML (500c):', html.slice(0, 500).replace(/\s+/g, ' '));
  }
  return results;
}

/* ─── searchGoodreads ───────────────────────────────────────────── */
async function searchGoodreads(query) {
  await randomDelay();
  try {
    const ac = await searchViaAutocomplete(query).catch(e => { console.warn('[GR ac]', e.message); return null; });
    if (ac?.length) { console.log(`[GR] autocomplete → ${ac.length}`); return { results: ac, disclaimer: DISCLAIMER }; }
    await randomDelay(300, 600);
    const html = await searchViaHtml(query);
    console.log(`[GR] html scraping → ${html.length}`);
    return { results: html, disclaimer: DISCLAIMER };
  } catch (e) {
    console.error('[GR search]', e.message);
    return { results: [], disclaimer: DISCLAIMER, error: e.message };
  }
}

/* ─── Estrai __NEXT_DATA__ ──────────────────────────────────────── */
function extractNextData(html) {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

/* ─── Estrai libri dall'Apollo state (ricerca) ──────────────────── */
function extractBooksFromApollo(nextData, limit = 10) {
  const results = [];
  const state = nextData?.props?.pageProps?.apolloState || {};
  for (const [key, val] of Object.entries(state)) {
    if (!(key.includes('Book') || key.includes('Work')) || !val?.title) continue;
    const authorRef = val.primaryContributorEdge?.node?.__ref;
    const authorName = authorRef ? state[authorRef]?.name : null;
    results.push({
      source: 'goodreads', title: val.title,
      authors: authorName ? [{ name: authorName, role: 'author' }] : [],
      cover_url: val.imageUrl || null,
      goodreads_id: String(val.legacyId || key.replace(/.*Book:/, '')),
      average_rating: val.stats?.averageRating || null,
    });
    if (results.length >= limit) break;
  }
  return results;
}

/* ─── Estrai TUTTI i campi di un libro dall'Apollo state ────────── */
function extractBookDetailFromApollo(state, goodreadsId) {
  // Cerca la chiave Book con legacyId corrispondente, oppure qualsiasi Book con titolo
  let bookVal = null;
  let bookKey = null;

  // Prima passata: cerca "Book:kca:" (formato GR moderno, verificato da Grimmory)
  for (const [key, val] of Object.entries(state)) {
    if (!val || typeof val !== 'object' || !val.title) continue;
    if (!key.includes('Book:kca:')) continue;
    if (String(val.legacyId) === String(goodreadsId)) { bookVal = val; bookKey = key; break; }
    if (!bookVal) { bookVal = val; bookKey = key; }
  }

  // Seconda passata: altri formati Book: / Work: (versioni GR più vecchie o alternative)
  if (!bookVal) {
    for (const [key, val] of Object.entries(state)) {
      if (!val || typeof val !== 'object' || !val.title) continue;
      const isBook = key.startsWith('Book:') || key.startsWith('Work:')
        || key.startsWith('LegacyBook:')
        || (key.includes('Book') && key.includes('://'));
      if (!isBook) continue;
      if (String(val.legacyId) === String(goodreadsId)) { bookVal = val; bookKey = key; break; }
      if (!bookVal) { bookVal = val; bookKey = key; }
    }
  }

  // Terza passata: qualsiasi oggetto con legacyId corrispondente
  if (!bookVal && goodreadsId) {
    for (const [key, val] of Object.entries(state)) {
      if (!val || typeof val !== 'object') continue;
      if (String(val.legacyId) === String(goodreadsId) && val.title) {
        bookVal = val; bookKey = key; break;
      }
    }
  }

  if (!bookVal) return null;

  console.log(`[GR detail Apollo] chiave trovata: ${bookKey}`);
  console.log('[GR detail Apollo] campi:', Object.keys(bookVal).join(', '));

  // Risolvi autori (cerca tutte le refs tipo Contributor)
  const authors = [];
  if (bookVal.primaryContributorEdge?.node?.__ref) {
    const a = state[bookVal.primaryContributorEdge.node.__ref];
    if (a?.name) authors.push({ name: a.name, role: 'author' });
  }
  // Cerca altri contributori
  if (Array.isArray(bookVal.secondaryContributorEdges)) {
    for (const edge of bookVal.secondaryContributorEdges) {
      const a = edge?.node?.__ref ? state[edge.node.__ref] : null;
      if (a?.name) authors.push({ name: a.name, role: edge.role || 'author' });
    }
  }
  // Fallback: cerca in contributors
  if (!authors.length && bookVal.contributors) {
    for (const c of bookVal.contributors) {
      const a = c?.__ref ? state[c.__ref] : null;
      if (a?.name) authors.push({ name: a.name, role: 'author' });
    }
  }

  // Dettagli edizione — campi verificati su Grimmory GoodReadsParser.java
  const det = bookVal.details || bookVal.bookDetails || bookVal.primaryEditionDetails || {};

  // Anno: GR moderno usa publicationTime (epoch ms), fallback a publicationDate string
  let year = null;
  const pubTime = det.publicationTime || bookVal.publicationTime;
  if (pubTime) {
    // epoch ms → anno
    year = new Date(parseInt(pubTime)).getFullYear() || null;
  } else {
    const rawYear = det.publicationDate || bookVal.originalPublicationDate || bookVal.publicationDate;
    if (rawYear) year = parseInt(String(rawYear).slice(0, 4)) || null;
  }

  // ISBN — GR usa "isbn" per ISBN-10 e "isbn13" per ISBN-13
  const isbn13 = det.isbn13 || bookVal.isbn13 || null;
  const isbn10 = det.isbn   || det.isbn10 || bookVal.isbn || bookVal.isbn10 || null;

  // Pagine
  const pages = det.numPages || det.numberOfPages || bookVal.numPages || null;

  // Editore
  const publisher = det.publisher || bookVal.publisher || null;

  // Lingua
  const lang = det.language?.name || (typeof det.language === 'string' ? det.language : null)
    || bookVal.language?.name || null;

  // Generi: bookGenres è un array di { genre: { name } }
  const genres = (bookVal.bookGenres || [])
    .map(g => g?.genre?.name || g?.name || g)
    .filter(g => typeof g === 'string' && g.length > 0)
    .slice(0, 8);

  // Serie + volume
  let series = null;
  let series_volume = null;
  if (Array.isArray(bookVal.bookSeries) && bookVal.bookSeries.length > 0) {
    const s = bookVal.bookSeries[0];
    const seriesRef = s?.series?.__ref ? state[s.series.__ref] : s?.series;
    series = seriesRef?.title || seriesRef?.name || null;
    if (!series && typeof s === 'object') series = Object.values(s).find(v => typeof v === 'string' && v.length > 2) || null;
    // Volume nella serie
    const rawVol = s?.userPosition || s?.positionInSeries || s?.bookSeriesPosition || null;
    if (rawVol !== null && rawVol !== undefined) {
      const parsed = parseFloat(String(rawVol));
      if (!isNaN(parsed)) series_volume = parsed;
    }
  }

  return {
    source: 'goodreads',
    goodreads_id: goodreadsId,
    title: bookVal.title || null,
    subtitle: bookVal.titleComplete !== bookVal.title ? null : null, // GR raramente ha subtitle
    authors,
    cover_url: bookVal.imageUrl || bookVal.coverUrl || null,
    synopsis: bookVal.description || null,
    average_rating: bookVal.stats?.averageRating || bookVal.averageRating || null,
    ratings_count: bookVal.stats?.ratingsCount || bookVal.ratingsCount || null,
    pages: pages ? parseInt(pages) : null,
    year,
    isbn13: isbn13 || null,
    isbn10: isbn10 || null,
    publisher,
    language: lang,
    series,
    series_volume,
    genres,
  };
}

/* ─── getBookDetail ─────────────────────────────────────────────── */
async function getBookDetail(goodreadsId, maxReviews = 5) {
  await randomDelay();
  if (!goodreadsId || !/^\d+/.test(String(goodreadsId))) {
    return { goodreads_id: goodreadsId, error: 'ID non valido', disclaimer: DISCLAIMER };
  }
  try {
    const url = `https://www.goodreads.com/book/show/${goodreadsId}`;
    const resp = await axios.get(url, { headers: HEADERS_HTML, timeout: 20000, validateStatus: () => true, maxRedirects: 5 });
    const html = diagnoseHtml(resp);
    const $ = cheerio.load(html);

    console.log(`[GR detail] ${url} → HTTP ${resp.status}, ${html.length} chars`);

    // 1. __NEXT_DATA__ (fonte più ricca per GR moderno)
    const nextData = extractNextData(html);
    if (nextData) {
      // Prova più percorsi possibili per l'Apollo state
      const stateCandidates = [
        nextData?.props?.pageProps?.apolloState,
        nextData?.props?.apolloState,
        nextData?.props?.pageProps?.initialProps?.apolloState,
        nextData?.apolloState,
      ].filter(s => s && typeof s === 'object' && Object.keys(s).length > 0);

      let detail = null;
      for (const state of stateCandidates) {
        detail = extractBookDetailFromApollo(state, goodreadsId);
        if (detail?.title) break;
        console.warn('[GR detail] Apollo state trovato ma nessun libro estratto. Campione chiavi:',
          Object.keys(state).slice(0, 8).join(', '));
      }

      if (detail?.title) {
        console.log('[GR detail] __NEXT_DATA__ OK:', JSON.stringify(detail).slice(0, 200));
        return { ...detail, disclaimer: DISCLAIMER };
      }
      if (stateCandidates.length === 0) {
        console.warn('[GR detail] __NEXT_DATA__ trovato ma apolloState assente. Top-level keys:',
          Object.keys(nextData?.props || {}).join(', '));
      }
    } else {
      console.warn('[GR detail] Nessun __NEXT_DATA__ nella pagina');
    }

    // 2. JSON-LD
    let jsonLd = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try { const p = JSON.parse($(el).html()); if (p['@type'] === 'Book') { jsonLd = p; return false; } } catch {}
    });
    if (jsonLd) {
      const result = mapJsonLd(jsonLd, goodreadsId, $);
      if (result.title) { console.log('[GR detail] JSON-LD OK'); return { ...result, disclaimer: DISCLAIMER }; }
    }

    // 3. React data-testid selectors
    const titleNew = $('[data-testid="bookTitle"], h1.Text__title1').first().text().trim();
    if (titleNew) {
      console.log('[GR detail] data-testid OK');
      return {
        source: 'goodreads', goodreads_id: goodreadsId, title: titleNew,
        authors: $('[data-testid="name"]').map((_, el) => ({ name: $(el).text().trim(), role: 'author' })).get().slice(0, 5),
        cover_url: $('img.ResponsiveImage, .BookCover__image img').first().attr('src') || null,
        synopsis: $('[data-testid="description"] .Formatted').first().text().trim() || null,
        average_rating: parseFloat($('[class*="RatingStatistics__rating"]').first().text()) || null,
        pages: parseInt($('[data-testid="pagesFormat"]').text()) || null,
        series: $('[data-testid="bookSeries"]').text().replace(/[()]/g, '').trim() || null,
        genres: $('[data-testid="genresList"] .Button__labelItem').map((_, el) => $(el).text().trim()).get().filter(Boolean),
        publisher: null, year: null, isbn13: null, isbn10: null,
        disclaimer: DISCLAIMER,
      };
    }

    // 4. Vecchia UI
    console.log('[GR detail] fallback vecchia UI');
    return mapOldUi($, goodreadsId, DISCLAIMER);

  } catch (e) {
    console.error('[GR detail] Errore:', e.message);
    return { goodreads_id: goodreadsId, error: e.message, disclaimer: DISCLAIMER };
  }
}

function mapJsonLd(data, goodreadsId, $) {
  const author = Array.isArray(data.author)
    ? data.author.map(a => ({ name: a.name || String(a), role: 'author' }))
    : data.author?.name ? [{ name: data.author.name, role: 'author' }] : [];
  let pages = data.numberOfPages ? parseInt(data.numberOfPages) : null;
  if (!pages) pages = parseInt($('[data-testid="pagesFormat"]').text()) || null;
  const year = data.datePublished ? parseInt(String(data.datePublished).slice(0, 4)) : null;
  const series = $('[data-testid="bookSeries"]').text().replace(/[()]/g, '').trim() || null;
  return {
    source: 'goodreads', goodreads_id: goodreadsId,
    title: data.name || null, subtitle: null, authors: author,
    cover_url: data.image || null, synopsis: data.description || null,
    average_rating: data.aggregateRating?.ratingValue ? parseFloat(data.aggregateRating.ratingValue) : null,
    ratings_count: data.aggregateRating?.ratingCount ? parseInt(data.aggregateRating.ratingCount) : null,
    pages, year, isbn13: data.isbn || null, isbn10: null, series,
    genres: (data.genre || []).slice(0, 8), publisher: data.publisher || null,
  };
}

function mapOldUi($, goodreadsId, disclaimer) {
  const title = $('#bookTitle').text().trim() || $('h1.bookTitle').text().trim();
  const author = $('.authorName span[itemprop="name"]').first().text().trim();
  const cover = $('img#coverImage').attr('src') || $('img[itemprop="image"]').attr('src');
  const synopsis = $('#description span').last().text().trim();
  const avgRating = parseFloat($('#bookMeta span[itemprop="ratingValue"]').text()) || null;
  const pages = parseInt($('[itemprop="numberOfPages"]').text()) || null;
  const isbn13 = $('[itemprop="isbn"]').text().trim() || null;
  const genres = []; $('.bookPageGenreLink').each((_, el) => { const g = $(el).text().trim(); if (g && !genres.includes(g)) genres.push(g); });
  return {
    source: 'goodreads', goodreads_id: goodreadsId,
    title: title || null, authors: author ? [{ name: author, role: 'author' }] : [],
    cover_url: cover || null, synopsis: synopsis || null,
    average_rating: avgRating, pages, isbn13, isbn10: null,
    genres, series: $('h2#bookSeries').text().replace(/[()]/g, '').trim() || null,
    publisher: null, year: null, disclaimer,
  };
}

/* ─── CSV Goodreads ─────────────────────────────────────────────── */
function parseGoodreadsCSV(csvContent) {
  const { parse } = require('csv-parse/sync');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true, relax_quotes: true });
  const statusMap = { 'read': 'read', 'currently-reading': 'reading', 'to-read': 'tbr' };
  const formatMap = { 'Hardcover': 'hardcover', 'Paperback': 'paperback', 'ebook': 'ebook', 'Kindle Edition': 'ebook', 'Audio CD': 'audiobook' };
  return records.map(r => {
    const tags = [];
    if (r['Bookshelves']) r['Bookshelves'].split(',').forEach(s => { const t = s.trim(); if (t && t !== r['Exclusive Shelf']) tags.push(t); });
    return {
      goodreads_id: r['Book Id'], title: r['Title'], author: r['Author'],
      additional_authors: r['Additional Authors'] ? r['Additional Authors'].split(',').map(a => a.trim()).filter(Boolean) : [],
      isbn10: r['ISBN']?.replace(/[="]/g, '').trim() || null,
      isbn13: r['ISBN13']?.replace(/[="]/g, '').trim() || null,
      my_rating: r['My Rating'] ? parseInt(r['My Rating']) || null : null,
      average_rating: r['Average Rating'] ? parseFloat(r['Average Rating']) || null : null,
      publisher: r['Publisher'] || null,
      pages: r['Number of Pages'] ? parseInt(r['Number of Pages']) || null : null,
      year: r['Year Published'] ? parseInt(r['Year Published']) || null : null,
      date_read: r['Date Read'] || null, date_added: r['Date Added'] || null,
      status: statusMap[r['Exclusive Shelf']] || 'tbr', tags,
      personal_notes: r['My Review'] || null,
      read_count: r['Read Count'] ? parseInt(r['Read Count']) || 1 : 1,
      format: formatMap[r['Binding']] || 'paperback',
    };
  });
}

module.exports = { searchGoodreads, getBookDetail, parseGoodreadsCSV, DISCLAIMER };
