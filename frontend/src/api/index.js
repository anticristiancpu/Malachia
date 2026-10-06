import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const books = {
  list:    (params) => api.get('/books', { params }).then(r => r.data),
  get:     (id)    => api.get(`/books/${id}`).then(r => r.data),
  create:  (data)  => api.post('/books', data).then(r => r.data),
  update:  (id, data) => api.patch(`/books/${id}`, data).then(r => r.data),
  delete:  (id)    => api.delete(`/books/${id}`).then(r => r.data),
  setPage: (id, page) => api.post(`/books/${id}/page`, { page }).then(r => r.data),
  addReading: (id, data) => api.post(`/books/${id}/reading`, data).then(r => r.data),
  uploadCover: (id, file) => {
    const fd = new FormData(); fd.append('cover', file);
    return api.post(`/books/${id}/cover`, fd).then(r => r.data);
  },
  shelves: (id) => api.get(`/books/${id}/shelves`).then(r => r.data),
  downloadMissingCovers: () => api.post('/books/covers/download-missing').then(r => r.data),
};

export const authors = {
  list:   (params) => api.get('/authors', { params }).then(r => r.data),
  get:    (id)    => api.get(`/authors/${id}`).then(r => r.data),
  create: (data)  => api.post('/authors', data).then(r => r.data),
  update: (id, data) => api.patch(`/authors/${id}`, data).then(r => r.data),
  delete: (id)    => api.delete(`/authors/${id}`).then(r => r.data),
  merge:  (keep_id, merge_id) => api.post('/authors/merge', { keep_id, merge_id }).then(r => r.data),
  fuzzy:  (name)  => api.get('/authors/search/fuzzy', { params: { name } }).then(r => r.data),
  wikipedia: (id) => api.get(`/authors/${id}/wikipedia`).then(r => r.data),
  orphansCount: () => api.get('/authors/orphans').then(r => r.data),
  cleanOrphans: () => api.delete('/authors/orphans').then(r => r.data),
};

export const notes = {
  list:   (params) => api.get('/notes', { params }).then(r => r.data),
  get:    (id)    => api.get(`/notes/${id}`).then(r => r.data),
  create: (data)  => api.post('/notes', data).then(r => r.data),
  update: (id, data) => api.patch(`/notes/${id}`, data).then(r => r.data),
  delete: (id)    => api.delete(`/notes/${id}`).then(r => r.data),
  allTags: ()     => api.get('/notes/tags/all').then(r => r.data),
};

export const loans = {
  list:   (params) => api.get('/loans', { params }).then(r => r.data),
  create: (data)  => api.post('/loans', data).then(r => r.data),
  return: (id, date) => api.patch(`/loans/${id}/return`, { date }).then(r => r.data),
  overdue: () => api.get('/loans/overdue').then(r => r.data),
};

export const shelves = {
  list:      ()        => api.get('/shelves').then(r => r.data),
  get:       (id)      => api.get(`/shelves/${id}`).then(r => r.data),
  create:    (data)    => api.post('/shelves', data).then(r => r.data),
  update:    (id, data)=> api.patch(`/shelves/${id}`, data).then(r => r.data),
  delete:    (id)      => api.delete(`/shelves/${id}`).then(r => r.data),
  // opzioni: { section_id, after_book_id } — senza after_book_id va in coda
  addBook:   (id, book_id, opzioni = {}) =>
    api.post(`/shelves/${id}/books`, { book_id, ...opzioni }).then(r => r.data),
  removeBook:(id, bookId)  => api.delete(`/shelves/${id}/books/${bookId}`).then(r => r.data),
  // riordino dentro lo scaffale: after_book_id null = in testa
  moveBook:  (id, bookId, { after_book_id = null, section_id } = {}) =>
    api.patch(`/shelves/${id}/books/${bookId}`,
      section_id !== undefined ? { after_book_id, section_id } : { after_book_id }).then(r => r.data),
  // sposta ('move') o copia ('copy') su un altro scaffale
  transfer:  (id, bookId, target_shelf_id, mode = 'move') =>
    api.post(`/shelves/${id}/books/${bookId}/transfer`, { target_shelf_id, mode }).then(r => r.data),
  ofBook:    (bookId) => api.get(`/shelves/of-book/${bookId}`).then(r => r.data),
  // sezioni dentro uno scaffale
  addSection:    (id, name)          => api.post(`/shelves/${id}/sections`, { name }).then(r => r.data),
  updateSection: (id, sid, data)     => api.patch(`/shelves/${id}/sections/${sid}`, data).then(r => r.data),
  deleteSection: (id, sid)           => api.delete(`/shelves/${id}/sections/${sid}`).then(r => r.data),
  uploadImage: (id, file) => {
    const fd = new FormData(); fd.append('image', file);
    return api.post(`/shelves/${id}/image`, fd).then(r => r.data);
  },
  deleteImage: (id) => api.delete(`/shelves/${id}/image`).then(r => r.data),
  // ebook di tipo ebook che non stanno su nessuno scaffale
  ebookSenzaScaffale: () => api.get('/shelves/ebook-senza-scaffale').then(r => r.data),
  // ogni scaffale con le prime copertine, per la pagina generale
  panoramica: (per = 40) => api.get('/shelves/panoramica', { params: { per } }).then(r => r.data),
  // sposta uno scaffale: after_shelf_id null lo porta in testa
  moveShelf: (id, { after_shelf_id = null, library_id } = {}) =>
    api.patch(`/shelves/${id}/posizione`,
      library_id !== undefined ? { after_shelf_id, library_id } : { after_shelf_id }).then(r => r.data),
  // l'etichetta dei record senza sezione: si rinomina e si sposta come le altre
  updateBase: (id, dati) => api.patch(`/shelves/${id}/base`, dati).then(r => r.data),
};

export const libraries = {
  list:   ()         => api.get('/libraries').then(r => r.data),
  create: (name)     => api.post('/libraries', { name }).then(r => r.data),
  update: (id, dati) => api.patch(`/libraries/${id}`, dati).then(r => r.data),
  delete: (id)       => api.delete(`/libraries/${id}`).then(r => r.data),
};

// Ebook in BookOrbit. Di là si legge soltanto; qui si scrive solo su conferma.
export const bookorbit = {
  status:     ()        => api.get('/bookorbit/status').then(r => r.data),
  // anteprima: dice cosa cambierebbe senza scrivere niente
  sync:       ({ anteprima = false } = {}) =>
    api.post(`/bookorbit/sync${anteprima ? '?anteprima=1' : ''}`).then(r => r.data),
  proposals:  ()        => api.get('/bookorbit/proposals').then(r => r.data),
  items:      (params)  => api.get('/bookorbit/items', { params }).then(r => r.data),
  // abbinamenti: [{ bookorbit_id, book_id }] — vale per uno o per molti
  link:       (abbinamenti) => api.post('/bookorbit/link', { abbinamenti }).then(r => r.data),
  unlink:     (ids)     => api.post('/bookorbit/unlink', { ids }).then(r => r.data),
  ignore:     (ids)     => api.post('/bookorbit/ignore', { ids }).then(r => r.data),
  restore:    (ids)     => api.post('/bookorbit/restore', { ids }).then(r => r.data),
  create:     (ids, { anteprima = false } = {}) =>
    api.post('/bookorbit/create', { ids, anteprima }).then(r => r.data),
  // credenziali: la password si manda solo quando cambia, e non torna mai indietro
  credenziali:        ()     => api.get('/bookorbit/credenziali').then(r => r.data),
  salvaCredenziali:   (dati) => api.put('/bookorbit/credenziali', dati).then(r => r.data),
  dimenticaCredenziali: ()   => api.delete('/bookorbit/credenziali').then(r => r.data),
};

export const wishlist = {
  list:    (params) => api.get('/wishlist', { params }).then(r => r.data),
  create:  (data)  => api.post('/wishlist', data).then(r => r.data),
  update:  (id, data) => api.patch(`/wishlist/${id}`, data).then(r => r.data),
  delete:  (id)    => api.delete(`/wishlist/${id}`).then(r => r.data),
  acquire: (id)    => api.post(`/wishlist/${id}/acquire`).then(r => r.data),
};

export const search = {
  quick:    (q, limit) => api.get('/search', { params: { q, limit } }).then(r => r.data),
  advanced: (q)        => api.get('/search/advanced', { params: { q } }).then(r => r.data),
};

export const stats = {
  get: (year) => api.get('/stats', { params: { year } }).then(r => r.data),
};

export const genres = {
  list: () => api.get('/genres').then(r => r.data),
};

export const importApi = {
  search:           (data) => api.post('/import/search', data).then(r => r.data),
  goodreadsSearch:  (query) => api.post('/import/goodreads/search', { query }).then(r => r.data),
  goodreadsDetail:  (id, reviews) => api.get(`/import/goodreads/${id}`, { params: { reviews } }).then(r => r.data),
  goodreadsCSV:     (file) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post('/import/goodreads/csv', fd).then(r => r.data);
  },
  goodreadsCSVConfirm: (rows, skip) => api.post('/import/goodreads/csv/confirm', { rows, skip_duplicates: skip }).then(r => r.data),
  importBook:       (data) => api.post('/import/book', data).then(r => r.data),
};

export const publishers = {
  list:   (params) => api.get('/publishers', { params }).then(r => r.data),
  books:  (name)   => api.get(`/publishers/${encodeURIComponent(name)}/books`).then(r => r.data),
  merge:  (keep_name, merge_name) => api.post('/publishers/merge', { keep_name, merge_name }).then(r => r.data),
  series: (name)   => api.get(`/publishers/${encodeURIComponent(name)}/series`).then(r => r.data),
};

export const prices = {
  // params: { author, title, keywords }  — keywords può essere ISBN o testo libero
  search: (params) => api.get('/prices/search', { params }).then(r => r.data),
};

export const placement = {
  tree:  ()       => api.get('/placement/tree').then(r => r.data),
  books: (params) => api.get('/placement/books', { params }).then(r => r.data),
  facets: ()      => api.get('/placement/facets').then(r => r.data),
  set:   (id, placement_id) => api.patch(`/placement/books/${id}`, { placement_id }).then(r => r.data),
  bulk:  (ids, placement_id) => api.post('/placement/bulk', { ids, placement_id }).then(r => r.data),
};

export const settings = {
  get:    ()     => api.get('/settings').then(r => r.data),
  save:   (data) => api.put('/settings', data).then(r => r.data),
  backup: ()     => { window.open('/api/settings/backup', '_blank'); },
  uploadBackground: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/settings/background-image', fd).then(r => r.data);
  },
  listBackgrounds: () => api.get('/settings/backgrounds').then(r => r.data),
  deleteBackground: (filename) => api.delete(`/settings/backgrounds/${encodeURIComponent(filename)}`).then(r => r.data),
};

export default api;
