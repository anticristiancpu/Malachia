const axios = require('axios');

const BASE = 'https://www.googleapis.com/books/v1';
let lastRequestTime = 0;
const MIN_DELAY = 2500; // ms tra richieste consecutive (anti-429)

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY) await new Promise(r => setTimeout(r, MIN_DELAY - elapsed));
  lastRequestTime = Date.now();
}

// Wrapper HTTP — fallisce subito su 429 (quota giornaliera, i retry non aiutano)
async function gbGet(url, params) {
  await rateLimit();
  const resp = await axios.get(url, { params, timeout: 12000, validateStatus: null });
  if (resp.status === 429) {
    console.warn('[GB] 429 rate limit raggiunto — nessun retry (quota giornaliera)');
    throw new Error('Google Books: quota esaurita (429)');
  }
  if (resp.status >= 400) throw new Error(`Google Books HTTP ${resp.status}`);
  return resp;
}

// Ricerca testuale generica
async function searchBooks(query) {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const params = { q: query, maxResults: 20 };
  if (key) params.key = key;
  const resp = await gbGet(`${BASE}/volumes`, params);
  return (resp.data.items || []).map(mapItem).filter(b => b.title);
}

// Ricerca per ISBN (cascata: isbn: → intitle+inauthor)
async function getByISBN(isbn) {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const clean = isbn.replace(/[-\s]/g, '');
  const params = { q: `isbn:${clean}`, maxResults: 5 };
  if (key) params.key = key;
  const resp = await gbGet(`${BASE}/volumes`, params);
  if (resp.data.items?.length) return mapItem(resp.data.items[0]);
  return null;
}

// Ricerca con titolo + autore (più precisa della generica)
async function searchByTitleAuthor(title, author) {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  let q = `intitle:${title}`;
  if (author) q += ` inauthor:${author}`;
  const params = { q, maxResults: 20 };
  if (key) params.key = key;
  const resp = await gbGet(`${BASE}/volumes`, params);
  return (resp.data.items || []).map(mapItem).filter(b => b.title);
}

async function getById(volumeId) {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const params = {};
  if (key) params.key = key;
  const resp = await gbGet(`${BASE}/volumes/${volumeId}`, params);
  return mapItem(resp.data);
}

function stripHtml(html) {
  if (!html) return null;
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim() || null;
}

function parseYear(dateStr) {
  if (!dateStr) return null;
  const m = String(dateStr).match(/(\d{4})/);
  return m ? parseInt(m[1]) : null;
}

function getBestCover(imageLinks) {
  if (!imageLinks) return null;
  const url = imageLinks.extraLarge
    || imageLinks.large
    || imageLinks.medium
    || imageLinks.thumbnail
    || imageLinks.smallThumbnail;
  if (!url) return null;
  return url
    .replace('http:', 'https:')
    .replace('&edge=curl', '')
    .replace(/zoom=\d/, 'zoom=3');
}

function mapItem(item) {
  const info = item.volumeInfo || {};
  const ids = info.industryIdentifiers || [];
  const isbn13 = ids.find(i => i.type === 'ISBN_13')?.identifier || null;
  const isbn10 = ids.find(i => i.type === 'ISBN_10')?.identifier || null;

  // Categorizzazione: rimuove marcatori gerarchia
  const categories = (info.categories || [])
    .flatMap(c => c.split('/').map(s => s.trim()))
    .filter((c, i, a) => c && a.indexOf(c) === i);

  return {
    source: 'google_books',
    google_books_id: item.id,
    title: info.title || null,
    subtitle: info.subtitle || null,
    authors: (info.authors || []).map(name => ({ name, role: 'author' })),
    publisher: info.publisher || null,
    year: parseYear(info.publishedDate),
    pages: info.pageCount || null,
    language: info.language || null,
    isbn10,
    isbn13,
    synopsis: stripHtml(info.description),
    cover_url: getBestCover(info.imageLinks),
    categories,
    average_rating: info.averageRating || null,
    ratings_count: info.ratingsCount || null,
    preview_link: info.previewLink?.replace('http:', 'https:') || null,
  };
}

module.exports = { searchBooks, getByISBN, getById, searchByTitleAuthor };
