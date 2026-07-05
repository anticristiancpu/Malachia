const express  = require('express');
const router   = express.Router();
const axios    = require('axios');
const cheerio  = require('cheerio');
const zlib     = require('zlib');
const { promisify } = require('util');

const {
  searchBooks:        libraccioSearch,
  searchByTitleAuthor: libraccioByTitle,
  getByISBN:          libraccioByISBN,
} = require('../services/libraccio');

/* ── Decompressione manuale (gestisce anche brotli, non supportato da axios) */
const _gunzip  = promisify(zlib.gunzip);
const _inflate = promisify(zlib.inflate);
const _brotli  = zlib.brotliDecompress ? promisify(zlib.brotliDecompress) : null;

async function decompress(buffer, encoding) {
  const enc = (encoding || '').toLowerCase().trim();
  try {
    if (enc === 'br' && _brotli) return await _brotli(buffer);
    if (enc === 'gzip')          return await _gunzip(buffer);
    if (enc === 'deflate')       return await _inflate(buffer);
  } catch {}
  return buffer;
}

/* ── Headers identici a Chrome 124 su Windows ───────────────────────────── */
const HEADERS = {
  'User-Agent':                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language':           'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding':           'gzip, deflate, br',
  'Cache-Control':             'max-age=0',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Ch-Ua':                '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile':         '?0',
  'Sec-Ch-Ua-Platform':       '"Windows"',
  'Sec-Fetch-Dest':           'document',
  'Sec-Fetch-Mode':           'navigate',
  'Sec-Fetch-Site':           'none',
  'Sec-Fetch-User':           '?1',
};

/* ── fetchHtml: richiesta + decompressione automatica ────────────────────── */
async function fetchHtml(url, extra = {}) {
  const res = await axios.get(url, {
    headers:        { ...HEADERS, ...extra },
    responseType:   'arraybuffer',
    decompress:     false,
    timeout:        28000,
    maxRedirects:   5,
    validateStatus: s => s < 500,
  });

  if (res.status === 403) throw new Error(`HTTP 403 — accesso negato`);
  if (res.status === 404) throw new Error(`HTTP 404 — pagina non trovata`);
  if (res.status === 429) throw new Error(`HTTP 429 — troppe richieste, riprova tra qualche minuto`);

  const raw = await decompress(Buffer.from(res.data), res.headers['content-encoding']);
  const ct  = res.headers['content-type'] || '';
  const enc = ct.match(/charset=([^\s;]+)/i)?.[1]?.toLowerCase();
  return raw.toString(enc === 'iso-8859-1' || enc === 'windows-1252' ? 'latin1' : 'utf-8');
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function parsePrice(text) {
  if (!text) return null;
  const s = String(text).trim().replace(/\s/g, '');
  // "12,50" o "12.50" o "EUR 12,50"
  const m = s.match(/(\d{1,6})[,\.](\d{2})(?!\d)/);
  if (m) {
    const v = parseFloat(`${m[1]}.${m[2]}`);
    return v > 0 && v < 100000 ? v : null;
  }
  const m2 = s.match(/^(\d{1,5})$/);
  if (m2) {
    const v = parseFloat(m2[1]);
    return v > 0 && v < 100000 ? v : null;
  }
  return null;
}

function absUrl(base, href) {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  try { return new URL(href, base).href; } catch { return null; }
}

function textOf($el, selectors) {
  for (const sel of selectors) {
    const t = $el.find(sel).first().text().trim();
    if (t) return t;
  }
  return '';
}

function extractIsbn(s) {
  if (!s) return null;
  const c = s.replace(/[-\s]/g, '');
  if (/^(978|979)\d{10}$/.test(c)) return c;
  if (/^\d{9}[\dX]$/i.test(c))     return c;
  return null;
}

/* ── AbeBooks.it (prezzi in EUR, senza login) ────────────────────────────── */
async function scrapeAbeBooks({ author, title, keywords }) {
  const BASE = 'https://www.abebooks.it';
  const isbn = extractIsbn(keywords);

  let url;
  if (isbn) {
    url = `${BASE}/servlet/SearchResults?isbn=${encodeURIComponent(isbn)}&sortby=17&sts=t`;
  } else {
    const p = new URLSearchParams({ sortby: '17', sts: 't' });
    if (title)    p.set('tn', title.trim());
    if (author)   p.set('an', author.trim());
    if (keywords) p.set('kn', keywords.trim());
    url = `${BASE}/servlet/SearchResults?${p.toString()}`;
  }

  const html = await fetchHtml(url, {
    Referer:           BASE + '/',
    'Sec-Fetch-Site':  'same-origin',
  });

  const $ = cheerio.load(html);
  const results = [];

  /* ── Selettori container risultati ── */
  const ITEM_SELS = [
    '[data-cy="listing-item"]',
    'li.result',
    '.cf.result',
    '.result',
    '[class*="result-item"]',
    '[class*="listing-item"]',
    'article',
  ];

  let items = $([]);
  for (const sel of ITEM_SELS) {
    const found = $(sel);
    if (found.length > 0) { items = found; break; }
  }

  /* Fallback: nodi che contengono EUR + prezzo */
  if (items.length === 0) {
    const leaves = [];
    $('*').each((_, el) => {
      if ($(el).children().length > 0) return;
      const t = $(el).text().trim();
      if (/EUR\s*\d+[,\.]\d{2}/.test(t) || /€\s*\d+[,\.]\d{2}/.test(t)) leaves.push(el);
    });
    const containers = [...new Set(
      leaves.map(el => $(el).closest('li, article, [class*="result"], [class*="item"]').get(0)).filter(Boolean)
    )];
    if (containers.length) items = $(containers);
  }

  items.each((_, el) => {
    if (results.length >= 30) return false;
    const $el = $(el);

    /* Prezzo — priorità a schema.org itemprop="price" */
    let price = null;
    const sp = $el.find('[itemprop="price"]').first();
    if (sp.length) price = parsePrice(sp.attr('content') || sp.text());

    if (!price) {
      // Cerca testo con EUR o €
      const txt = $el.text();
      const m = txt.match(/(?:EUR|€)\s*([\d.,]+)/i);
      if (m) price = parsePrice(m[1]);
    }
    if (!price) return;

    /* Titolo */
    const itemTitle = textOf($el, [
      '[itemprop="name"]', 'h2 a', 'h3 a', '.result-title a', 'h2', 'h3', 'a',
    ]).slice(0, 120) || title || '';

    /* Autore */
    const itemAuthor = textOf($el, [
      '[itemprop="author"]', '.author', '[class*="author"]', '.result-author',
    ]).slice(0, 80) || author || '';

    /* Condizione */
    const condition = textOf($el, [
      '[data-cy="listing-condition"]', '.cf-condition', '[class*="condition"]', '.condition',
    ]).slice(0, 80);

    /* Copertina */
    const coverEl = $el.find('img[src*="pictures.abebooks"]').first()
      || $el.find('img').first();
    const cover = coverEl.attr('src') || null;

    /* URL */
    const href    = $el.find('a[href*="/book"]').first().attr('href')
      || $el.find('a[href]').first().attr('href');
    const itemUrl = absUrl(BASE, href) || url;

    /* ISBN-13 */
    const isbnEl = $el.find('[itemprop="isbn"]').first();
    let isbn13 = isbnEl.text().trim().replace(/[-\s]/g, '') || null;
    if (!isbn13) {
      const im = $el.text().match(/ISBN\s*(?:13)?[:\s]+(\d{13})/i);
      if (im) isbn13 = im[1];
    }

    /* Editore e anno */
    const pubEl  = $el.find('[itemprop="publisher"]').first();
    const yearEl = $el.find('[itemprop="datePublished"]').first();
    let publisher = pubEl.text().trim() || null;
    let year      = yearEl.attr('content') || yearEl.text().trim() || null;

    if (!publisher) {
      const pm = $el.text().match(/(?:Editore|Publisher|Verlag|Éditeur)[:\s]+([^\n,]{2,60})/i);
      if (pm) publisher = pm[1].trim();
    }
    if (!year) {
      const ym = $el.text().match(/[,\s](\d{4})(?:\s|$)/);
      if (ym && parseInt(ym[1]) > 1800 && parseInt(ym[1]) <= new Date().getFullYear() + 1) year = ym[1];
    }

    results.push({
      source:       'abebooks',
      source_label: 'AbeBooks',
      source_color: '#c9000b',
      title:        itemTitle,
      author:       itemAuthor,
      isbn13:       isbn13 || null,
      publisher:    publisher?.slice(0, 100) || null,
      year:         year ? parseInt(year) : null,
      price,
      currency:     'EUR',
      cover:        cover?.startsWith('http') ? cover : null,
      url:          itemUrl,
      condition,
      seller:       textOf($el, ['[class*="seller"]', '.seller', '[class*="libreria"]']).slice(0, 80),
    });
  });

  return results;
}

/* ── Libraccio (prezzi Nuovo + Usato via Algolia) ────────────────────────── */
async function scrapeLibraccio({ author, title, keywords }) {
  try {
    const isbn = extractIsbn(keywords);

    let items = [];
    if (isbn) {
      const hit = await libraccioByISBN(isbn);
      if (hit) items = [hit];
    } else if (title || author) {
      items = await libraccioByTitle(title || '', author || '');
    } else if (keywords) {
      items = await libraccioSearch(keywords);
    }

    // Filtra solo gli item con almeno uno dei due prezzi
    const withPrice = items.filter(
      item => item._libraccio_price_new != null || item._libraccio_price_used != null
    );

    const results = [];
    for (const item of withPrice) {
      const url = item.isbn13
        ? `https://www.libraccio.it/libro/${item.isbn13}/`
        : null;

      const base = {
        source:       'libraccio',
        source_label: 'Libraccio',
        source_color: '#8b1a1a',
        title:        item.title,
        author:       item.authors?.[0]?.name || '',
        isbn13:       item.isbn13,
        publisher:    item.publisher,
        year:         item.year,
        currency:     'EUR',
        cover:        item.cover_url,
        url,
        seller:       'Libraccio.it',
      };

      if (item._libraccio_price_new != null) {
        results.push({ ...base, price: item._libraccio_price_new, condition: 'Nuovo' });
      }
      if (item._libraccio_price_used != null) {
        results.push({ ...base, price: item._libraccio_price_used, condition: 'Usato' });
      }
    }

    return results.sort((a, b) => a.price - b.price).slice(0, 20);
  } catch (e) {
    console.error('[Libraccio prezzi] errore:', e.message);
    throw e;
  }
}

/* ── GET /api/prices/search ──────────────────────────────────────────────── */
router.get('/search', async (req, res) => {
  const { author, title, keywords } = req.query;
  if (!author && !title && !keywords) {
    return res.status(400).json({ error: 'Almeno un campo tra author, title o keywords è richiesto' });
  }

  const [abeResult, libraResult] = await Promise.allSettled([
    scrapeAbeBooks({ author, title, keywords }),
    scrapeLibraccio({ author, title, keywords }),
  ]);

  const abeResults   = abeResult.status   === 'fulfilled' ? abeResult.value   : [];
  const libraResults = libraResult.status === 'fulfilled' ? libraResult.value : [];

  const abeError = abeResult.status === 'rejected'
    ? ((abeResult.reason?.message || 'Errore di rete').slice(0, 300)
       + (abeResult.reason?.response?.status ? ` [HTTP ${abeResult.reason.response.status}]` : ''))
    : null;
  const libraError = libraResult.status === 'rejected'
    ? (libraResult.reason?.message || 'Errore di rete').slice(0, 300)
    : null;

  const results = [...abeResults, ...libraResults].sort((a, b) => a.price - b.price);

  res.json({
    results,
    errors: {
      ...(abeError   ? { vialibri:  abeError   } : {}),
      ...(libraError ? { libraccio: libraError } : {}),
    },
    statuses: {
      vialibri:  abeError   ? 'error' : abeResults.length,
      libraccio: libraError ? 'error' : libraResults.length,
    },
  });
});

module.exports = router;
