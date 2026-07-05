'use strict';
/**
 * Libraccio.it — metadati + prezzi libri
 *
 * Ricerca testuale  → Algolia (prd_Libraccio_Physical)
 * Lookup per ISBN   → pagina prodotto /libro/{isbn}/ + JSON-LD
 *
 * Credenziali Algolia pubbliche (search-only, embedded nell'HTML):
 *   ALGOLIA_APPID  = YOUMSVBVBP
 *   ALGOLIA_APIKEY = cff26d0b41639798b377b289fc508aca
 *   INDEX          = prd_Libraccio_Physical
 */

const axios = require('axios');
const zlib  = require('zlib');
const { promisify } = require('util');

/* ── Algolia ────────────────────────────────────────────────────── */

const ALGOLIA_APP   = 'YOUMSVBVBP';
const ALGOLIA_KEY   = 'cff26d0b41639798b377b289fc508aca';
const ALGOLIA_INDEX = 'prd_Libraccio_Physical';
const ALGOLIA_URL   = `https://${ALGOLIA_APP}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;

const ALGOLIA_HEADERS = {
  'X-Algolia-Application-Id': ALGOLIA_APP,
  'X-Algolia-API-Key':        ALGOLIA_KEY,
  'Content-Type':             'application/json',
};

async function algoSearch(query, limit = 10) {
  const res = await axios.post(
    ALGOLIA_URL,
    { query, hitsPerPage: limit },
    { headers: ALGOLIA_HEADERS, timeout: 10000, validateStatus: s => s < 500 }
  );
  if (res.status >= 400) {
    console.warn(`[Libraccio/Algolia] HTTP ${res.status}`);
    return [];
  }
  return res.data?.hits || [];
}

/**
 * Mappa un hit Algolia al formato Malachia.
 *
 * Campi Algolia rilevanti:
 *   EAN      → ISBN-13
 *   Tit      → titolo
 *   Aut      → autori (array di stringhe)
 *   Pub      → editore
 *   Col      → collana/serie
 *   YyPu     → anno pubblicazione
 *   PrcN     → prezzo nuovo
 *   PrcU     → prezzo usato
 *   Mat      → categoria (es. "Italiano. Classici e narrativa")
 *   Dip      → reparto (es. "Narrativa")
 */
function mapAlgoliaHit(hit) {
  if (!hit?.Tit) return null;

  const isbn = String(hit.EAN || '').replace(/\D/g, '');
  const cover = isbn
    ? `https://www.libraccio.it/images/${isbn}_0_170_0_75.jpg`
    : null;

  const authors = (Array.isArray(hit.Aut) ? hit.Aut : (hit.Aut ? [hit.Aut] : []))
    .map(a => ({ name: String(a).trim(), role: 'author' }))
    .filter(a => a.name);

  const priceNew  = hit.PrcN != null ? parseFloat(hit.PrcN) : null;
  const priceUsed = hit.PrcU != null ? parseFloat(hit.PrcU) : null;
  const price     = priceNew ?? priceUsed;

  return {
    source:                'libraccio',
    title:                 String(hit.Tit).trim(),
    subtitle:              null,
    authors,
    publisher:             hit.Pub  || null,
    year:                  hit.YyPu || null,
    isbn13:                isbn.length === 13 ? isbn : null,
    isbn10:                isbn.length === 10 ? isbn : null,
    language:              'ita',
    cover_url:             cover,
    synopsis:              null,
    series_name:           hit.Col  || null,
    categories:            hit.Mat  ? [hit.Mat] : [],
    _libraccio_price:      price,      // miglior prezzo (per il flusso import)
    _libraccio_price_new:  priceNew,   // prezzo nuovo
    _libraccio_price_used: priceUsed,  // prezzo usato
  };
}

/* ── JSON-LD (pagine prodotto) ──────────────────────────────────── */

const BASE = 'https://www.libraccio.it';

const _gunzip  = promisify(zlib.gunzip);
const _inflate = promisify(zlib.inflate);
const _brotli  = zlib.brotliDecompress ? promisify(zlib.brotliDecompress) : null;

async function decompress(buf, enc) {
  const e = (enc || '').toLowerCase().trim();
  try {
    if (e === 'br' && _brotli) return await _brotli(buf);
    if (e === 'gzip')          return await _gunzip(buf);
    if (e === 'deflate')       return await _inflate(buf);
  } catch {}
  return buf;
}

const PAGE_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
};

async function fetchProductPage(isbn) {
  try {
    const res = await axios.get(`${BASE}/libro/${isbn}/`, {
      headers:        PAGE_HEADERS,
      responseType:   'arraybuffer',
      decompress:     false,
      timeout:        15000,
      maxRedirects:   5,
      validateStatus: s => s < 500,
    });
    if (res.status === 404) return null;
    const raw = await decompress(Buffer.from(res.data), res.headers['content-encoding']);
    const ct  = res.headers['content-type'] || '';
    const enc = ct.match(/charset=([^\s;]+)/i)?.[1]?.toLowerCase();
    return raw.toString(enc === 'iso-8859-1' || enc === 'windows-1252' ? 'latin1' : 'utf-8');
  } catch {
    return null;
  }
}

function parsePrice(raw) {
  if (!raw) return null;
  const m = String(raw).replace(/\s/g, '').match(/(\d{1,5})[,\.](\d{2})/);
  return m ? parseFloat(`${m[1]}.${m[2]}`) : null;
}

function cleanIsbn(raw) {
  return raw ? String(raw).replace(/[-\s]/g, '') : '';
}

function mapJsonLdItem(item) {
  if (!item?.name) return null;

  const ao = item.author || item.creator;
  let authors = [];
  if (ao) {
    const arr = Array.isArray(ao) ? ao : [ao];
    authors = arr
      .map(a => ({ name: (typeof a === 'string' ? a : (a.name || '')).trim(), role: 'author' }))
      .filter(a => a.name);
  }

  const rawIsbn = cleanIsbn(item.isbn || item.gtin13 || item.gtin || '');

  const offers  = Array.isArray(item.offers) ? item.offers[0] : item.offers;
  const price   = offers ? parsePrice(offers.price) : null;

  let cover = null;
  if (item.image) {
    cover = typeof item.image === 'string'
      ? item.image
      : (item.image.url || item.image.contentUrl || null);
  }
  if (cover && !cover.startsWith('http')) cover = `${BASE}${cover}`;

  const rawYear = item.datePublished || item.copyrightYear || null;
  const year    = rawYear ? (parseInt(String(rawYear).match(/\d{4}/)?.[0] || '') || null) : null;
  const pub     = item.publisher;
  const publisher = pub ? (typeof pub === 'string' ? pub : (pub.name || null)) : null;

  return {
    source:                'libraccio',
    title:                 String(item.name).trim(),
    subtitle:              item.alternativeHeadline || null,
    authors,
    publisher,
    year,
    isbn13:                rawIsbn.length === 13 ? rawIsbn : null,
    isbn10:                rawIsbn.length === 10 ? rawIsbn : null,
    language:              item.inLanguage || 'ita',
    cover_url:             cover,
    synopsis:              typeof item.description === 'string' ? item.description.trim() : null,
    _libraccio_price:      price,
    _libraccio_price_new:  price,   // pagina prodotto = prezzo nuovo
    _libraccio_price_used: null,
  };
}

/* ── API pubblica ─────────────────────────────────────────────── */

/**
 * Ricerca testuale via Algolia.
 * Molto affidabile — restituisce metadati ricchi + prezzo.
 */
async function searchBooks(query) {
  try {
    const hits = await algoSearch(query, 15);
    return hits.map(mapAlgoliaHit).filter(Boolean);
  } catch (e) {
    console.warn('[Libraccio] searchBooks error:', e.message);
    return [];
  }
}

async function searchByTitleAuthor(title, author) {
  const q = [title, author].filter(Boolean).join(' ');
  return searchBooks(q);
}

/**
 * Lookup per ISBN — usa prima Algolia (veloce), poi pagina prodotto JSON-LD.
 */
async function getByISBN(isbn) {
  const clean = cleanIsbn(isbn);
  if (!clean) return null;
  try {
    // 1. Algolia — più veloce
    const hits = await algoSearch(clean, 3);
    const exact = hits.find(h => String(h.EAN || '').replace(/\D/g, '') === clean);
    if (exact) return mapAlgoliaHit(exact);

    // 2. Pagina prodotto + JSON-LD
    const html = await fetchProductPage(clean);
    if (!html) return null;

    const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      try {
        const items = JSON.parse(m[1].trim());
        for (const item of (Array.isArray(items) ? items : [items])) {
          const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
          if (types.some(t => t === 'Book' || t === 'Product')) {
            const mapped = mapJsonLdItem(item);
            if (mapped?.title) return mapped;
          }
        }
      } catch {}
    }
    return null;
  } catch (e) {
    console.warn('[Libraccio] getByISBN error:', e.message);
    return null;
  }
}

module.exports = { searchBooks, searchByTitleAuthor, getByISBN };
