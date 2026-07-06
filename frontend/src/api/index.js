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
  addBook:   (id, book_id) => api.post(`/shelves/${id}/books`, { book_id }).then(r => r.data),
  removeBook:(id, bookId)  => api.delete(`/shelves/${id}/books/${bookId}`).then(r => r.data),
  uploadImage: (id, file) => {
    const fd = new FormData(); fd.append('image', file);
    return api.post(`/shelves/${id}/image`, fd).then(r => r.data);
  },
  deleteImage: (id) => api.delete(`/shelves/${id}/image`).then(r => r.data),
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
