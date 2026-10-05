// Ebook: specchio locale di BookOrbit e abbinamento al catalogo.
//
// Verso BookOrbit si legge soltanto. Verso Malachia si scrive solo dopo una
// conferma esplicita arrivata dalla pagina Ebook: la sincronizzazione da sola
// non collega niente e non crea niente.

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const cliente = require('../bookorbit/client');
const { proponi, indicizzaCatalogo, norm, autoreGiaNoto } = require('../bookorbit/match');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads/covers');
const SERVER = 'bookorbit';

// ── utilità ────────────────────────────────────────────────────────────────

const comeJson = (v, def) => { try { return JSON.parse(v); } catch { return def; } };

// La riga dello specchio come la vede il frontend: con i link ricomposti ora,
// non salvati. Il fileId è quello aggiornato dall'ultima sincronizzazione.
function vestiRiga(r) {
  return {
    ...r,
    authors: comeJson(r.authors, []),
    genres: comeJson(r.genres, []),
    has_cover: Boolean(r.has_cover),
    orfano: r.stato === 'orfano',
    link_scheda: cliente.linkScheda(r.id),
    link_lettore: cliente.linkLettore(r.id, r.file_id),
    copertina: `/api/bookorbit/items/${r.id}/cover`,
  };
}

const SQL_RIGHE = 'SELECT * FROM bookorbit_items';

// Il record di catalogo mostrato come candidato, in forma essenziale.
function vestiCandidato(db, r) {
  return {
    id: r.id, title: r.title, subtitle: r.subtitle, year: r.year,
    publisher: r.publisher, isbn13: r.isbn13, item_type: r.item_type,
    cover_local: r.cover_local, cover_url: r.cover_url,
    authors: String(r.autori || '').split('|').filter(Boolean),
  };
}

function conteggi(db) {
  const righe = db.prepare('SELECT stato, COUNT(*) AS n FROM bookorbit_items GROUP BY stato').all();
  const c = { totale: 0, da_vedere: 0, collegato: 0, ignorato: 0, orfano: 0 };
  for (const r of righe) { c[r.stato] = r.n; c.totale += r.n; }
  return c;
}

// ── stato ──────────────────────────────────────────────────────────────────

// GET /api/bookorbit/status
// Non solleva mai: se BookOrbit è spento lo dice e basta, così il resto
// dell'app non viene disturbato.
router.get('/status', async (req, res) => {
  const db = getDb();
  const esito = await cliente.prova();
  const ultima = db.prepare('SELECT MAX(visto_at) AS v FROM bookorbit_items').get()?.v || null;
  res.json({ ...esito, specchio: conteggi(db), ultima_sincronizzazione: ultima });
});

// ── sincronizzazione ───────────────────────────────────────────────────────

// POST /api/bookorbit/sync        applica
// POST /api/bookorbit/sync?anteprima=1   dice solo cosa cambierebbe
//
// Aggiorna lo specchio. Non tocca mai i record del catalogo: gli abbinamenti
// già confermati restano come sono, e un ebook sparito da BookOrbit diventa
// "orfano" senza che il libro collegato subisca niente.
router.post('/sync', async (req, res) => {
  const db = getDb();
  const anteprima = req.query.anteprima === '1' || req.body?.anteprima === true;

  let remoti;
  try {
    remoti = await cliente.elencoLibri();
  } catch (e) {
    return res.status(e.stato || 502).json({ error: e.message });
  }

  const presenti = new Map(db.prepare('SELECT * FROM bookorbit_items').all().map(r => [r.id, r]));
  const idRemoti = new Set(remoti.map(r => r.id));

  const nuovi = remoti.filter(r => !presenti.has(r.id));
  const aggiornati = remoti.filter(r => {
    const p = presenti.get(r.id);
    return p && p.remote_updated_at !== (r.updatedAt || null);
  });
  // Orfani: c'erano, non ci sono più. Quelli già segnati tali non si ricontano.
  const orfani = [...presenti.values()].filter(p => !idRemoti.has(p.id) && p.stato !== 'orfano');
  // Tornati: erano orfani e sono riapparsi.
  const tornati = [...presenti.values()].filter(p => idRemoti.has(p.id) && p.stato === 'orfano');

  const riepilogo = {
    letti_da_bookorbit: remoti.length,
    nuovi: nuovi.length,
    aggiornati: aggiornati.length,
    orfani: orfani.length,
    tornati: tornati.length,
    invariati: remoti.length - nuovi.length - aggiornati.length,
  };

  if (anteprima) {
    return res.json({
      anteprima: true, ...riepilogo,
      esempi_nuovi: nuovi.slice(0, 10).map(r => ({ id: r.id, title: r.title, authors: r.authors || [] })),
      esempi_orfani: orfani.slice(0, 10).map(r => ({ id: r.id, title: r.title })),
    });
  }

  const ora = new Date().toISOString();
  const inserisci = db.prepare(`INSERT INTO bookorbit_items (
      id, title, subtitle, authors, publisher, year, isbn13, isbn10, language, pages,
      series_name, series_index, genres, library_name, file_id, file_format, has_cover,
      remote_updated_at, stato, visto_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'da_vedere',?)`);
  // L'aggiornamento non tocca né stato né book_id: un abbinamento confermato resta.
  const aggiorna = db.prepare(`UPDATE bookorbit_items SET
      title=?, subtitle=?, authors=?, publisher=?, year=?, isbn13=?, isbn10=?, language=?,
      pages=?, series_name=?, series_index=?, genres=?, library_name=?, file_id=?,
      file_format=?, has_cover=?, remote_updated_at=?, visto_at=?,
      updated_at=datetime('now')
    WHERE id=?`);
  const segnaVisto = db.prepare('UPDATE bookorbit_items SET visto_at=? WHERE id=?');
  const segnaOrfano = db.prepare("UPDATE bookorbit_items SET stato='orfano', updated_at=datetime('now') WHERE id=?");
  // Un ebook tornato riprende il suo stato: collegato se ha un libro, altrimenti da vedere.
  const segnaTornato = db.prepare(`UPDATE bookorbit_items
      SET stato = CASE WHEN book_id IS NOT NULL THEN 'collegato' ELSE 'da_vedere' END,
          updated_at = datetime('now') WHERE id=?`);

  const valori = (r) => {
    const primo = (r.files || []).find(f => f.role === 'primary') || (r.files || [])[0] || {};
    return [
      r.title || null, r.subtitle || null, JSON.stringify(r.authors || []),
      r.publisher || null, r.publishedYear || null, r.isbn13 || null, r.isbn10 || null,
      r.language || null, r.pageCount || null, r.seriesName || null,
      r.seriesIndex != null ? String(r.seriesIndex) : null,
      JSON.stringify(r.genres || []), r.libraryName || null,
      primo.id || null, primo.format || null, r.hasCover ? 1 : 0,
      r.updatedAt || null, ora,
    ];
  };

  db.transaction(() => {
    for (const r of nuovi) inserisci.run(r.id, ...valori(r));
    for (const r of aggiornati) aggiorna.run(...valori(r), r.id);
    for (const r of remoti) segnaVisto.run(ora, r.id);
    for (const p of orfani) segnaOrfano.run(p.id);
    for (const p of tornati) segnaTornato.run(p.id);
  })();

  res.json({ anteprima: false, ...riepilogo, specchio: conteggi(db) });
});

// ── proposte ───────────────────────────────────────────────────────────────

// GET /api/bookorbit/proposals
// Calcola le proposte sugli ebook ancora da vedere. Non scrive niente.
router.get('/proposals', (req, res) => {
  const db = getDb();
  const daVedere = db.prepare(`${SQL_RIGHE} WHERE stato = 'da_vedere' ORDER BY title COLLATE NOCASE`).all();
  const indice = indicizzaCatalogo(db);

  const livelli = { certo: [], probabile: [], verificare: [], nessuno: [] };
  for (const r of daVedere) {
    const autori = comeJson(r.authors, []);
    const { livello, candidati } = proponi({ ...r, authors: autori }, indice);
    livelli[livello].push({
      ebook: vestiRiga(r),
      candidati: candidati.map(c => vestiCandidato(db, c)),
      // per i "senza corrispondenza": l'autore ce l'hai già oppure è nuovo?
      autore_noto: autoreGiaNoto(autori, indice),
    });
  }

  res.json({
    conteggi: {
      certo: livelli.certo.length,
      probabile: livelli.probabile.length,
      verificare: livelli.verificare.length,
      nessuno: livelli.nessuno.length,
      nessuno_autore_noto: livelli.nessuno.filter(p => p.autore_noto).length,
      nessuno_autore_nuovo: livelli.nessuno.filter(p => !p.autore_noto).length,
    },
    ...livelli,
  });
});

// GET /api/bookorbit/items?stato=&q=&limit=
router.get('/items', (req, res) => {
  const db = getDb();
  const { stato, q } = req.query;
  const limite = Math.min(parseInt(req.query.limit) || 500, 2000);
  const dove = [], par = [];
  if (stato) { dove.push('stato = ?'); par.push(stato); }
  if (q) { dove.push('(title LIKE ? OR authors LIKE ?)'); par.push(`%${q}%`, `%${q}%`); }
  const righe = db.prepare(
    `${SQL_RIGHE} ${dove.length ? `WHERE ${dove.join(' AND ')}` : ''}
     ORDER BY title COLLATE NOCASE LIMIT ?`).all(...par, limite);

  // Per i collegati serve anche il libro a cui puntano.
  const libri = db.prepare('SELECT id, title, item_type FROM books WHERE id = ?');
  res.json(righe.map(r => ({
    ...vestiRiga(r),
    libro: r.book_id ? libri.get(r.book_id) || null : null,
  })));
});

// GET /api/bookorbit/items/:id/cover — copertina remota, per il confronto a
// video. Passa dal backend perché il token non deve arrivare al browser.
router.get('/items/:id/cover', async (req, res) => {
  try {
    const { dati, tipo } = await cliente.copertina(parseInt(req.params.id));
    res.set('Content-Type', tipo);
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(dati);
  } catch (e) {
    res.status(e.stato === 401 ? 401 : 404).json({ error: e.message });
  }
});

// ── copertina: scaricata solo se in Malachia manca ─────────────────────────

async function copertinaSeManca(db, idRemoto, bookId) {
  const libro = db.prepare('SELECT cover_local, cover_url FROM books WHERE id = ?').get(bookId);
  if (!libro) return false;
  if (libro.cover_local || libro.cover_url) return false; // c'è già: non si tocca
  try {
    const { dati, tipo } = await cliente.copertina(idRemoto);
    if (!tipo.startsWith('image/')) return false;
    const est = tipo.includes('png') ? '.png' : tipo.includes('webp') ? '.webp' : '.jpg';
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, `${bookId}${est}`), dati);
    db.prepare("UPDATE books SET cover_local = ?, updated_at = datetime('now') WHERE id = ?")
      .run(`/uploads/covers/${bookId}${est}`, bookId);
    return true;
  } catch { return false; }
}

// ── collegamento ───────────────────────────────────────────────────────────

// POST /api/bookorbit/link   { abbinamenti: [{ bookorbit_id, book_id }] }
//
// Vale sia per una conferma singola sia per un blocco. Scrive sul libro soltanto
// i campi neutri del riferimento esterno; non salva indirizzi completi.
router.post('/link', async (req, res) => {
  const db = getDb();
  const abbinamenti = Array.isArray(req.body?.abbinamenti)
    ? req.body.abbinamenti
    : (req.body?.bookorbit_id ? [{ bookorbit_id: req.body.bookorbit_id, book_id: req.body.book_id }] : []);
  if (!abbinamenti.length) return res.status(400).json({ error: 'nessun abbinamento da confermare' });

  const leggiEbook = db.prepare('SELECT * FROM bookorbit_items WHERE id = ?');
  const leggiLibro = db.prepare('SELECT id FROM books WHERE id = ?');
  const collega = db.prepare(`UPDATE bookorbit_items
      SET book_id = ?, stato = 'collegato', updated_at = datetime('now') WHERE id = ?`);
  // Solo i campi neutri: ebook_url resta un percorso relativo, non un indirizzo.
  const segnaLibro = db.prepare(`UPDATE books
      SET ebook_server = ?, ebook_external_id = ?, ebook_url = ?, updated_at = datetime('now')
      WHERE id = ?`);

  const fatti = [], scartati = [];
  for (const a of abbinamenti) {
    const idRemoto = parseInt(a.bookorbit_id);
    const e = leggiEbook.get(idRemoto);
    if (!e) { scartati.push({ bookorbit_id: a.bookorbit_id, motivo: 'ebook non presente nello specchio' }); continue; }
    if (!leggiLibro.get(a.book_id)) { scartati.push({ bookorbit_id: idRemoto, motivo: 'record di catalogo inesistente' }); continue; }
    db.transaction(() => {
      collega.run(a.book_id, idRemoto);
      segnaLibro.run(SERVER, String(idRemoto), `/book/${idRemoto}`, a.book_id);
    })();
    fatti.push({ bookorbit_id: idRemoto, book_id: a.book_id });
  }

  // La copertina si scarica solo dove manca del tutto.
  let copertine = 0;
  for (const f of fatti) if (await copertinaSeManca(db, f.bookorbit_id, f.book_id)) copertine++;

  res.json({ collegati: fatti.length, copertine_scaricate: copertine, scartati, specchio: conteggi(db) });
});

// POST /api/bookorbit/unlink  { ids: [...] }
// Scollega senza toccare il record di catalogo più del necessario.
router.post('/unlink', (req, res) => {
  const db = getDb();
  const ids = (req.body?.ids || []).map(Number).filter(Boolean);
  if (!ids.length) return res.status(400).json({ error: 'nessun ebook indicato' });
  const leggi = db.prepare('SELECT book_id FROM bookorbit_items WHERE id = ?');
  const scollega = db.prepare(`UPDATE bookorbit_items
      SET book_id = NULL, stato = 'da_vedere', updated_at = datetime('now') WHERE id = ?`);
  const pulisciLibro = db.prepare(`UPDATE books
      SET ebook_server = NULL, ebook_external_id = NULL, ebook_url = NULL,
          updated_at = datetime('now')
      WHERE id = ? AND ebook_server = ?`);
  db.transaction(() => {
    for (const id of ids) {
      const r = leggi.get(id);
      scollega.run(id);
      if (r?.book_id) pulisciLibro.run(r.book_id, SERVER);
    }
  })();
  res.json({ scollegati: ids.length, specchio: conteggi(db) });
});

// POST /api/bookorbit/ignore  { ids: [...] }
router.post('/ignore', (req, res) => {
  const db = getDb();
  const ids = (req.body?.ids || []).map(Number).filter(Boolean);
  if (!ids.length) return res.status(400).json({ error: 'nessun ebook indicato' });
  const upd = db.prepare("UPDATE bookorbit_items SET stato='ignorato', updated_at=datetime('now') WHERE id=?");
  db.transaction(() => { for (const id of ids) upd.run(id); })();
  res.json({ ignorati: ids.length, specchio: conteggi(db) });
});

// POST /api/bookorbit/restore { ids: [...] } — rimette fra quelli da vedere
router.post('/restore', (req, res) => {
  const db = getDb();
  const ids = (req.body?.ids || []).map(Number).filter(Boolean);
  if (!ids.length) return res.status(400).json({ error: 'nessun ebook indicato' });
  const upd = db.prepare(`UPDATE bookorbit_items SET stato='da_vedere', updated_at=datetime('now')
      WHERE id=? AND book_id IS NULL`);
  db.transaction(() => { for (const id of ids) upd.run(id); })();
  res.json({ ripristinati: ids.length, specchio: conteggi(db) });
});

// ── creazione di nuovi record ebook ────────────────────────────────────────

// Un autore già in catalogo non va duplicato: si cerca per nome normalizzato.
function cacheAutori(db) {
  const m = new Map();
  for (const a of db.prepare('SELECT id, name FROM authors').all()) {
    const k = norm(a.name);
    if (k && !m.has(k)) m.set(k, { id: a.id, nome: a.name, creato: false });
  }
  return m;
}

function numeroInventario(db) {
  let num, c = 0;
  do {
    num = `CP${String(Math.floor(100000 + Math.random() * 900000))}`;
    c++;
  } while (db.prepare('SELECT id FROM books WHERE inventory_number = ?').get(num) && c < 50);
  return num;
}

// POST /api/bookorbit/create  { ids: [...], anteprima?: true }
// Crea un record nuovo per ogni ebook indicato. Con anteprima dice soltanto
// cosa farebbe: quanti autori riuserebbe e quanti ne creerebbe.
router.post('/create', async (req, res) => {
  const db = getDb();
  const ids = (req.body?.ids || []).map(Number).filter(Boolean);
  const anteprima = req.body?.anteprima === true;
  if (!ids.length) return res.status(400).json({ error: 'nessun ebook indicato' });

  const righe = ids.map(id => db.prepare('SELECT * FROM bookorbit_items WHERE id = ?').get(id)).filter(Boolean);
  const giaCollegati = righe.filter(r => r.book_id);
  const daCreare = righe.filter(r => !r.book_id);

  if (anteprima) {
    const noti = cacheAutori(db);
    const riusati = new Set(), nuoviAutori = new Set();
    for (const r of daCreare) {
      for (const nome of comeJson(r.authors, [])) {
        const k = norm(nome);
        if (!k) continue;
        (noti.has(k) ? riusati : nuoviAutori).add(k);
      }
    }
    return res.json({
      anteprima: true,
      record_da_creare: daCreare.length,
      saltati_perche_gia_collegati: giaCollegati.length,
      autori_riusati: riusati.size,
      autori_nuovi: nuoviAutori.size,
      titoli: daCreare.slice(0, 20).map(r => r.title),
    });
  }

  const noti = cacheAutori(db);
  const creati = [];
  let autoriNuovi = 0;

  const inserisci = db.prepare(`INSERT INTO books (
      id, title, subtitle, publisher, year, isbn10, isbn13, language, pages,
      series_name, series_volume, format, item_type, status, cover_variant,
      tags, inventory_number, volumes_count, copies_owned,
      ebook_server, ebook_external_id, ebook_url
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,'ebook','ebook','tbr','monastic','[]',?,1,1,?,?,?)`);
  const legaAutore = db.prepare(
    'INSERT OR IGNORE INTO book_authors (book_id, author_id, role, display_order) VALUES (?,?,?,?)');
  const collega = db.prepare(`UPDATE bookorbit_items
      SET book_id = ?, stato = 'collegato', updated_at = datetime('now') WHERE id = ?`);

  for (const r of daCreare) {
    const bookId = uuidv4();
    const nomi = comeJson(r.authors, []);
    db.transaction(() => {
      inserisci.run(
        bookId, r.title || 'senza titolo', r.subtitle || null, r.publisher || null,
        r.year || null, r.isbn10 || null, r.isbn13 || null, r.language || null,
        r.pages || null, r.series_name || null, r.series_index || null,
        numeroInventario(db), SERVER, String(r.id), `/book/${r.id}`);
      for (let i = 0; i < nomi.length; i++) {
        const k = norm(nomi[i]);
        if (!k) continue;
        let a = noti.get(k);
        if (!a) {
          a = { id: uuidv4(), nome: nomi[i] };
          db.prepare('INSERT INTO authors (id, name, name_sort) VALUES (?,?,?)').run(a.id, nomi[i], nomi[i]);
          noti.set(k, a); autoriNuovi++;
        }
        legaAutore.run(bookId, a.id, 'author', i);
      }
      collega.run(bookId, r.id);
    })();
    creati.push({ bookorbit_id: r.id, book_id: bookId, title: r.title });
  }

  // Le copertine dei record appena nati mancano per definizione.
  let copertine = 0;
  for (const c of creati) if (await copertinaSeManca(db, c.bookorbit_id, c.book_id)) copertine++;

  res.json({
    anteprima: false,
    creati: creati.length,
    autori_nuovi: autoriNuovi,
    copertine_scaricate: copertine,
    saltati_perche_gia_collegati: giaCollegati.length,
    record: creati,
    specchio: conteggi(db),
  });
});

module.exports = router;
