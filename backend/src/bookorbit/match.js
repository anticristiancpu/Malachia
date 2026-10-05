// Abbinamento fra gli ebook di BookOrbit e i record del catalogo.
//
// Non decide niente da solo: produce soltanto proposte, divise in tre livelli
// di certezza. L'abbinamento vero avviene unicamente quando arriva una conferma
// esplicita dalla pagina Ebook.

// ── normalizzazione ────────────────────────────────────────────────────────

const ARTICOLI = /^(il|lo|la|i|gli|le|l|un|uno|una|the|a|an|der|die|das|les|le)\s+/;

// Minuscole, senza accenti, senza punteggiatura, senza articolo iniziale.
function norm(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(ARTICOLI, '')
    .replace(/\s+/g, ' ');
}

// La parte di titolo prima del sottotitolo. Serve per riconoscere lo stesso
// libro quando le due schede spezzano il titolo in modo diverso.
function nucleo(titolo) {
  const primo = String(titolo || '').split(/[:.(–—]/)[0];
  return norm(primo) || norm(titolo);
}

function isbnPulito(s) {
  return String(s || '').replace(/[^0-9Xx]/g, '').toUpperCase();
}

function cognome(nome) {
  const parti = norm(nome).split(' ').filter(Boolean);
  return parti[parti.length - 1] || '';
}

// Un titolo è il prefisso dell'altro: differiscono solo per il sottotitolo.
// La soglia di 12 caratteri evita che un titolo cortissimo peschi a caso.
function unoPrefissoDellAltro(a, b) {
  if (!a || !b || a.length < 12 || b.length < 12) return false;
  return b.startsWith(`${a} `) || a.startsWith(`${b} `);
}

// ── indice del catalogo ────────────────────────────────────────────────────

const SQL_CATALOGO = `
  SELECT b.id, b.title, b.subtitle, b.isbn13, b.isbn10, b.publisher, b.year,
         b.item_type, b.format, b.cover_local, b.cover_url,
         (SELECT GROUP_CONCAT(a.name, '|') FROM authors a
            JOIN book_authors ba ON a.id = ba.author_id
           WHERE ba.book_id = b.id) AS autori
    FROM books b`;

function indicizzaCatalogo(db) {
  const righe = db.prepare(SQL_CATALOGO).all();
  const perIsbn = new Map(), perTitolo = new Map(), perNucleo = new Map();
  const spingi = (m, k, v) => { if (!k) return; if (!m.has(k)) m.set(k, []); m.get(k).push(v); };

  for (const r of righe) {
    r._titoloSolo = norm(r.title);
    r._titoloPieno = norm([r.title, r.subtitle].filter(Boolean).join(' '));
    r._nucleo = nucleo(r.title);
    r._cognomi = new Set(String(r.autori || '').split('|').filter(Boolean).map(cognome).filter(Boolean));
    spingi(perIsbn, isbnPulito(r.isbn13), r);
    spingi(perIsbn, isbnPulito(r.isbn10), r);
    spingi(perTitolo, r._titoloSolo, r);
    if (r._titoloPieno !== r._titoloSolo) spingi(perTitolo, r._titoloPieno, r);
    spingi(perNucleo, r._nucleo, r);
  }
  return { righe, perIsbn, perTitolo, perNucleo };
}

// ── proposta per un singolo ebook ──────────────────────────────────────────

// `ebook` è una riga dello specchio: { id, title, subtitle, authors (JSON o
// array), isbn13, isbn10 }. Restituisce { livello, candidati }.
function proponi(ebook, indice) {
  const autori = Array.isArray(ebook.authors)
    ? ebook.authors
    : (() => { try { return JSON.parse(ebook.authors || '[]'); } catch { return []; } })();
  const cognomi = new Set(autori.map(cognome).filter(Boolean));
  const stessoAutore = (r) => [...cognomi].some(c => r._cognomi.has(c));

  const tSolo = norm(ebook.title);
  const tPieno = norm([ebook.title, ebook.subtitle].filter(Boolean).join(' '));
  const nuc = nucleo(ebook.title);

  // 1. ISBN identico: certo.
  for (const i of [isbnPulito(ebook.isbn13), isbnPulito(ebook.isbn10)]) {
    if (i && indice.perIsbn.has(i)) {
      return { livello: 'certo', candidati: [...new Set(indice.perIsbn.get(i))] };
    }
  }

  // 2. Titolo e autore normalizzati coincidono: probabile.
  const perTitolo = [...new Set([
    ...(indice.perTitolo.get(tSolo) || []),
    ...(indice.perTitolo.get(tPieno) || []),
  ])];
  const conAutore = perTitolo.filter(stessoAutore);
  if (conAutore.length) return { livello: 'probabile', candidati: conAutore };

  // 3. Un titolo è il prefisso dell'altro e l'autore coincide: probabile.
  const perPrefisso = indice.righe.filter(r => stessoAutore(r) && (
    unoPrefissoDellAltro(tSolo, r._titoloSolo) ||
    unoPrefissoDellAltro(tSolo, r._titoloPieno) ||
    unoPrefissoDellAltro(tPieno, r._titoloSolo)
  ));
  if (perPrefisso.length) return { livello: 'probabile', candidati: perPrefisso };

  // 4. Titolo identico ma autore diverso o assente, oppure solo il nucleo del
  //    titolo coincide: da verificare a mano.
  const perNucleo = (indice.perNucleo.get(nuc) || []).filter(stessoAutore);
  if (perTitolo.length) return { livello: 'verificare', candidati: perTitolo };
  if (perNucleo.length) return { livello: 'verificare', candidati: perNucleo };

  // 5. Niente: candidato a diventare un nuovo record ebook.
  return { livello: 'nessuno', candidati: [] };
}

// Proposte per un elenco di ebook, con un solo indice del catalogo.
function proponiTutti(db, ebooks) {
  const indice = indicizzaCatalogo(db);
  return ebooks.map(e => ({ ebook: e, ...proponi(e, indice) }));
}

module.exports = {
  norm, nucleo, isbnPulito, cognome,
  indicizzaCatalogo, proponi, proponiTutti,
};
