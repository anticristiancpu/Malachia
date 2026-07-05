const axios = require('axios');

const BASE = 'https://openlibrary.org';
const COVERS = 'https://covers.openlibrary.org/b';

// Campi richiesti esplicitamente per efficienza
const SEARCH_FIELDS = 'key,title,subtitle,author_name,publisher,first_publish_year,number_of_pages_median,isbn,language,cover_i,subject,edition_count';

async function searchBooks(query) {
  const resp = await axios.get(`${BASE}/search.json`, {
    params: { q: query, limit: 15, fields: SEARCH_FIELDS },
    timeout: 12000,
  });
  return (resp.data.docs || []).map(mapDoc).filter(b => b.title);
}

// Ricerca più precisa con titolo e autore separati (OL supporta ?title=&author=)
async function searchByTitleAuthor(title, author) {
  const params = { limit: 10, fields: SEARCH_FIELDS };
  if (title)  params.title  = title;
  if (author) params.author = author;
  const resp = await axios.get(`${BASE}/search.json`, { params, timeout: 12000 });
  return (resp.data.docs || []).map(mapDoc).filter(b => b.title);
}

// Usa la search API anche per ISBN — più stabile di /isbn/:id.json
async function getByISBN(isbn) {
  try {
    const clean = isbn.replace(/[-\s]/g, '');
    const resp = await axios.get(`${BASE}/search.json`, {
      params: { isbn: clean, limit: 1, fields: SEARCH_FIELDS },
      timeout: 12000,
    });
    if (resp.data.docs?.length) return mapDoc(resp.data.docs[0]);
    return null;
  } catch {
    return null;
  }
}

async function getByOLID(olid) {
  try {
    const resp = await axios.get(`${BASE}/works/${olid}.json`, { timeout: 10000 });
    return mapWork(resp.data);
  } catch {
    return null;
  }
}

function coverUrl(id, size = 'L') {
  return id ? `${COVERS}/id/${id}-${size}.jpg` : null;
}

function mapDoc(doc) {
  const isbn13 = doc.isbn?.find(i => String(i).length === 13) || null;
  const isbn10 = doc.isbn?.find(i => String(i).length === 10) || null;
  const subjects = (doc.subject || []).slice(0, 8);

  return {
    source: 'open_library',
    open_library_id: doc.key?.replace('/works/', '') || null,
    title: doc.title || null,
    subtitle: doc.subtitle || null,
    authors: (doc.author_name || []).map(name => ({ name, role: 'author' })),
    publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : (doc.publisher || null),
    year: doc.first_publish_year || null,
    pages: doc.number_of_pages_median || null,
    isbn10,
    isbn13,
    language: Array.isArray(doc.language) ? doc.language[0] : (doc.language || null),
    cover_url: coverUrl(doc.cover_i),
    synopsis: null,
    categories: subjects,
    edition_count: doc.edition_count || null,
  };
}

function mapWork(work) {
  const coverId = work.covers?.[0];
  let synopsis = null;
  if (work.description) {
    synopsis = typeof work.description === 'string' ? work.description : work.description?.value || null;
  }
  return {
    source: 'open_library',
    open_library_id: work.key?.replace('/works/', '') || null,
    title: work.title || null,
    subtitle: work.subtitle || null,
    authors: [],
    cover_url: coverUrl(coverId),
    synopsis,
  };
}

module.exports = { searchBooks, searchByTitleAuthor, getByISBN, getByOLID };
