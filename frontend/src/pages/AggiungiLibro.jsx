import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import { importApi, books as booksApi, authors as authorsApi, prices as pricesApi, publishers as publishersApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';

/* ── Provider config ───────────────────────────────────────────── */
const PROVIDERS = [
  { id: 'google_books', label: 'Google Books', short: 'G',   color: '#2a3a5a', light: 'rgba(42,58,90,0.12)'   },
  { id: 'open_library', label: 'Open Library', short: 'OL',  color: '#3a5a2a', light: 'rgba(58,90,42,0.12)'   },
  { id: 'goodreads',    label: 'Goodreads',    short: 'GR',  color: '#7b3f00', light: 'rgba(123,63,0,0.10)'   },
  { id: 'abebooks',     label: 'AbeBooks',     short: 'AB',  color: '#c9000b', light: 'rgba(201,0,11,0.10)'   },
  { id: 'libraccio',    label: 'Libraccio',    short: 'LB',  color: '#8b1a1a', light: 'rgba(139,26,26,0.10)'  },
  { id: 'sbn',          label: 'SBN',          short: 'SBN', color: '#1a4f8b', light: 'rgba(26,79,139,0.10)'  },
];

const STATUS_LABELS = { tbr: 'Da leggere', reading: 'In lettura', read: 'Letto' };

/* Campi disponibili nel merge modal */
const MERGE_FIELDS = [
  { key: 'title',       label: 'Titolo *',   required: true },
  { key: 'subtitle',    label: 'Sottotitolo' },
  { key: 'authors_str', label: 'Autore/i' },
  { key: 'publisher',   label: 'Editore' },
  { key: 'year',        label: 'Anno',       type: 'number' },
  { key: 'pages',       label: 'Pagine',     type: 'number' },
  { key: 'language',    label: 'Lingua' },
  { key: 'isbn13',      label: 'ISBN-13',    mono: true },
  { key: 'isbn10',      label: 'ISBN-10',    mono: true },
  { key: 'series',        label: 'Serie' },
  { key: 'series_volume', label: 'Vol. serie', type: 'number' },
];

/* ── Helpers ───────────────────────────────────────────────────── */
function hasValue(v) { return v !== null && v !== undefined && v !== ''; }

function normalizeSrc(data) {
  if (!data) return null;
  return {
    ...data,
    authors_str: (data.authors || [])
      .map(a => (typeof a === 'string' ? a : a.name))
      .filter(Boolean)
      .join(', '),
  };
}

function dedup(items) {
  const seen = new Set();
  return items.filter(item => {
    let key;
    if (item.source === 'abebooks') {
      // Le inserzioni AbeBooks sono annunci di venditori diversi per lo stesso libro:
      // ogni URL è un annuncio unico — non deduplicare tra di loro né con le altre fonti.
      key = item._abebooks_url || `ab|${item.title}|${item.price}|${item.condition || ''}`;
    } else {
      // Fonti di metadati: deduplica per ISBN o titolo tra provider diversi
      key = item.isbn13 || item.isbn10 || (item.title || '').toLowerCase().trim();
    }
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bookKey(b) {
  return b.isbn13 || b.isbn10 || b.goodreads_id || b.google_books_id || b.open_library_id
    || ((b.title || '') + '|' + ((b.authors?.[0]?.name ?? b.authors?.[0] ?? '')));
}

/* ── Hook: carica collane di un editore (debounced 450ms) ──────── */
function usePublisherSeries(publisherName) {
  const [collane, setCollane] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    const name = (publisherName || '').trim();
    if (!name) { setCollane([]); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await publishersApi.series(name);
        setCollane(res.series || []);
      } catch { setCollane([]); }
    }, 450);
    return () => clearTimeout(timerRef.current);
  }, [publisherName]);

  return collane;
}

/* ── CollanePicker: select collane + input manuale ─────────────── */
function CollanePicker({ collane, value, onChange }) {
  if (collane.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
      <select
        className="m-select"
        style={{ fontSize: 11, padding: '3px 22px 3px 8px', flex: 1, color: 'var(--m-ink-muted)' }}
        value=""
        onChange={e => { if (e.target.value) onChange(e.target.value); }}
      >
        <option value="">collane di questo editore…</option>
        {collane.map(c => (
          <option key={c.series_name} value={c.series_name}>
            {c.series_name} ({c.book_count})
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── ResultCard ────────────────────────────────────────────────── */
function ResultCard({ book, onSelect, onToggleSelect, selected, disabled }) {
  const [hov, setHov] = useState(false);
  const p = PROVIDERS.find(p => p.id === book.source) || PROVIDERS[0];
  const authors = (book.authors || []).map(a => (typeof a === 'string' ? a : a.name)).filter(Boolean).join(', ');

  return (
    <div
      style={{
        width: 130, cursor: disabled ? 'wait' : 'pointer',
        position: 'relative', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
        outline: selected ? `2px solid var(--m-gold)` : '2px solid transparent',
        outlineOffset: 3,
        transition: 'outline-color 120ms',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => !disabled && onSelect(book)}
    >
      <div style={{ position: 'relative' }}>
        <BookCover book={book} title={book.title} author={authors} w={130} h={190} />

        {/* Overlay hover (apre merge modal) */}
        {hov && !disabled && !selected && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(42,29,16,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'EB Garamond', serif", fontSize: 13,
            fontVariant: 'small-caps', letterSpacing: '0.14em', color: 'var(--m-gold-pale)',
            pointerEvents: 'none',
          }}>dettagli</div>
        )}

        {/* Overlay selezione attiva */}
        {selected && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(191,161,90,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--m-gold)', color: 'var(--m-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700,
            }}>✓</div>
          </div>
        )}

        {/* Checkbox selezione — top left */}
        <div
          title={selected ? 'Rimuovi dalla selezione' : 'Aggiungi alla selezione multipla'}
          onClick={e => { e.stopPropagation(); if (!disabled) onToggleSelect(book); }}
          style={{
            position: 'absolute', top: 5, left: 5, zIndex: 10,
            width: 18, height: 18,
            background: selected ? 'var(--m-gold)' : 'rgba(20,18,16,0.65)',
            border: `1.5px solid ${selected ? 'var(--m-gold)' : 'rgba(255,255,255,0.45)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: selected ? 'var(--m-ink)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 150ms',
            opacity: (hov || selected) ? 1 : 0.55,
          }}
        >✓</div>

        {/* Badge provider — top right */}
        <div style={{
          position: 'absolute', top: 6, right: 6, background: p.color, color: '#fff',
          fontSize: 8, fontVariant: 'small-caps', padding: '2px 5px', lineHeight: 1.4,
        }}>{p.short}</div>
      </div>

      <div style={{ marginTop: 7 }}>
        <div className="m-serif" style={{ fontSize: 12, lineHeight: 1.3, fontWeight: 600 }}>
          {(book.title || '').length > 38 ? book.title.slice(0, 38) + '…' : book.title}
        </div>
        <div className="m-marginalia" style={{ fontSize: 11, marginTop: 2 }}>
          {authors.length > 28 ? authors.slice(0, 28) + '…' : (authors || '—')}
        </div>
        {book.year && <div className="m-mono" style={{ fontSize: 10, color: 'var(--m-ink-muted)', marginTop: 2 }}>{book.year}</div>}
      </div>
    </div>
  );
}

/* ── MergePriceCard: carta prezzo compatta per il MergeModal ──── */
function MergePriceCard({ result, onUse }) {
  const [hov, setHov] = useState(false);
  const price = Number(result.price || 0);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 140, flexShrink: 0, position: 'relative', overflow: 'hidden',
        border: `1px solid ${hov ? '#c9000b' : 'var(--m-rule)'}`,
        background: hov ? 'rgba(201,0,11,0.05)' : 'transparent',
        transition: 'border-color 150ms, background 150ms',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ width: 140, height: 188, background: 'var(--m-parchment-2)', position: 'relative', overflow: 'hidden' }}>
        {result.cover
          ? <img src={result.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} onError={e => { e.target.style.display='none'; }}/>
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--m-ink-muted)', textAlign: 'center', fontFamily: "'EB Garamond', serif", lineHeight: 1.3 }}>
                {(result.title || '').slice(0, 38)}
              </div>
            </div>
        }
        <div style={{ position: 'absolute', bottom: 4, left: 4, background: '#c9000b', color: '#fff', fontSize: 8, padding: '1px 5px', fontVariant: 'small-caps' }}>AbeBooks</div>
        {result.url && (
          <a href={result.url} target="_blank" rel="noopener noreferrer"
            style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', textDecoration: 'none', opacity: hov ? 1 : 0, transition: 'opacity 150ms' }}
            title="Apri pagina originale">↗</a>
        )}
      </div>
      <div style={{ padding: '7px 9px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 21, fontFamily: "'EB Garamond', serif", color: 'var(--m-gold)', lineHeight: 1, fontWeight: 500 }}>
          € {price.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        {result.condition && (
          <div style={{ fontSize: 9, color: 'var(--m-ink-muted)', fontStyle: 'italic' }}>{result.condition}</div>
        )}
        {result.title && (
          <div style={{ fontSize: 10, fontFamily: "'EB Garamond', serif", lineHeight: 1.3, color: 'var(--m-ink)', maxHeight: '2.6em', overflow: 'hidden' }}>
            {result.title}
          </div>
        )}
        <button
          className="m-btn m-btn-sm"
          style={{ marginTop: 'auto', width: '100%', justifyContent: 'center', fontSize: 11, background: hov ? '#c9000b' : 'transparent', borderColor: hov ? '#c9000b' : 'var(--m-rule)', color: hov ? '#fff' : 'var(--m-ink)', transition: 'all 150ms' }}
          onClick={() => onUse(price)}
        >← usa prezzo</button>
      </div>
    </div>
  );
}

/* ── MergePriceModal: ricerca AbeBooks sovrapposta al MergeModal ─ */
function MergePriceModal({ initialTitle, initialAuthors, initialIsbn, onUse, onClose }) {
  const [qTitle,    setQTitle]    = useState(initialTitle   || '');
  const [qAuthor,   setQAuthor]   = useState(initialAuthors || '');
  const [qKeywords, setQKeywords] = useState(initialIsbn    || '');
  const [searching, setSearching] = useState(false);
  const [results,   setResults]   = useState([]);
  const [searched,  setSearched]  = useState(false);

  const hasQuery = qTitle.trim() || qAuthor.trim() || qKeywords.trim();

  const doSearch = async () => {
    if (!hasQuery) return;
    setSearching(true);
    setResults([]);
    setSearched(true);
    try {
      const data = await pricesApi.search({
        title:    qTitle.trim()    || undefined,
        author:   qAuthor.trim()   || undefined,
        keywords: qKeywords.trim() || undefined,
      });
      setResults(data.results || []);
    } catch { setResults([]); }
    setSearching(false);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 700 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--m-parchment)', border: '1px solid var(--m-rule-strong)', width: 860, maxWidth: '96vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid var(--m-rule)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div className="m-eyebrow" style={{ marginBottom: 2 }}>Quotazione di mercato · AbeBooks</div>
              <div className="m-serif" style={{ fontSize: 19, fontWeight: 500 }}>Stima del valore di mercato</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--m-ink-muted)', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="m-field" style={{ flex: '2 1 180px', margin: 0 }}>
              <label style={{ fontSize: 10 }}>Titolo</label>
              <input className="m-input" style={{ padding: '6px 10px', fontSize: 13 }}
                value={qTitle} onChange={e => setQTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()} />
            </div>
            <div className="m-field" style={{ flex: '1 1 140px', margin: 0 }}>
              <label style={{ fontSize: 10 }}>Autore</label>
              <input className="m-input" style={{ padding: '6px 10px', fontSize: 13 }}
                value={qAuthor} onChange={e => setQAuthor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()} />
            </div>
            <div className="m-field" style={{ flex: '1 1 120px', margin: 0 }}>
              <label style={{ fontSize: 10 }}>ISBN / Parole chiave</label>
              <input className="m-input" style={{ padding: '6px 10px', fontSize: 13 }}
                value={qKeywords} onChange={e => setQKeywords(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()} />
            </div>
            <button className="m-btn" style={{ flexShrink: 0 }} onClick={doSearch} disabled={searching || !hasQuery}>
              {searching ? '…' : '⌕ cerca'}
            </button>
          </div>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {searching && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
              <div className="m-spinner" />
            </div>
          )}
          {!searching && searched && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--m-ink-muted)', fontFamily: "'EB Garamond', serif", fontStyle: 'italic' }}>
              Nessun risultato trovato — prova a modificare i parametri di ricerca
            </div>
          )}
          {!searching && results.length > 0 && (
            <>
              <div className="m-eyebrow" style={{ marginBottom: 12 }}>
                {results.length} offert{results.length === 1 ? 'a' : 'e'} · ordinate per prezzo crescente
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {results.map((r, i) => (
                  <MergePriceCard key={i} result={r} onUse={price => { onUse(price); onClose(); }} />
                ))}
              </div>
            </>
          )}
          {!searching && !searched && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--m-ink-muted)', fontFamily: "'EB Garamond', serif", fontStyle: 'italic', fontSize: 15 }}>
              Inserisci i dati e cerca per trovare le quotazioni correnti di mercato
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── MergeModal — stile tabella Grimmory ───────────────────────── */
/*
   Layout:
   ┌────────┬──────────────────────────────────────────────┐
   │ Cover  │  Campo      │ Google Books │ Open Lib │ GR │ ✎ Finale │
   │ picker │─────────────────────────────────────────────────────────│
   │        │  Titolo     │ [valore]     │ [valore] │ — │ [input]  │
   │        │  Autore/i   │ [valore]     │ [valore] │[v]│ [input]  │
   │        │  ...        │ ...          │ ...      │...│ ...      │
   │        │─────────────────────────────────────────────────────────│
   │        │  Sinossi    │ [blocco testo cliccabile per fonte]       │
   │        │─────────────────────────────────────────────────────────│
   │        │  Stato · Tag · Note · [✦ aggiungi]                     │
   └────────┴──────────────────────────────────────────────────────────┘
   Cliccando una cella di un provider → quel valore va nel campo Finale.
   Il campo Finale è sempre editabile manualmente.
*/
function MergeModal({ sources, primarySource, onConfirm, onClose, saving, allResults = [] }) {
  const norm = {};
  for (const [sid, data] of Object.entries(sources)) {
    if (data) norm[sid] = normalizeSrc(data);
  }
  // Ordina provider in modo consistente
  const sids = PROVIDERS.map(p => p.id).filter(id => norm[id]);

  // Extra fonti aggiunte dall'utente dalla griglia risultati
  const [extraSources, setExtraSources] = useState({});
  const [extraMeta,    setExtraMeta]    = useState({});
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showPriceSearch,  setShowPriceSearch]  = useState(false);

  // Sorgenti combinate (primarie + extra)
  const allSids = [...sids, ...Object.keys(extraSources)];
  const allNorm = { ...norm, ...extraSources };
  const getProvMeta = (sid) => {
    if (extraMeta[sid]) return extraMeta[sid];
    return PROVIDERS.find(p => p.id === sid);
  };
  const addExtraSource = (book) => {
    const n = Object.keys(extraSources).length;
    const key = `extra_${n}`;
    const p = PROVIDERS.find(pv => pv.id === book.source);
    setExtraMeta(prev => ({ ...prev, [key]: {
      id: key,
      label: (p?.label || book.source) + ' +',
      short: (p?.short || book.source.slice(0, 2).toUpperCase()) + '+',
      color: p?.color || '#555555',
      light: p?.light || 'rgba(80,80,80,0.10)',
    }}));
    setExtraSources(prev => ({ ...prev, [key]: normalizeSrc(book) }));
    setShowSourcePicker(false);
  };

  // Collane dell'editore corrente
  const [values, setValues] = useState(() => {
    const v = {};
    for (const { key } of MERGE_FIELDS) {
      for (const sid of ['google_books', 'goodreads', 'open_library', ...sids]) {
        const raw = norm[sid]?.[key];
        if (hasValue(raw)) { v[key] = String(raw); break; }
      }
      if (!v[key]) v[key] = '';
    }
    return v;
  });

  // Quale provider è "selezionato" per ogni campo (per evidenziazione)
  const [activeSid, setActiveSid] = useState(() => {
    const a = {};
    for (const { key } of MERGE_FIELDS) {
      for (const sid of ['google_books', 'goodreads', 'open_library', ...sids]) {
        if (hasValue(norm[sid]?.[key])) { a[key] = sid; break; }
      }
    }
    return a;
  });

  // Copertina — priorità alla fonte selezionata dall'utente
  const [customCoverUrl,  setCustomCoverUrl]  = useState('');
  const [customCoverFile, setCustomCoverFile] = useState(null);
  const [coverSid, setCoverSid] = useState(() => {
    const order = [primarySource, 'goodreads', 'google_books', 'open_library', ...sids].filter(Boolean);
    for (const sid of order) {
      if (norm[sid]?.cover_url) return sid;
    }
    return sids[0] || null;
  });

  // Sinossi
  const [synopsisSid, setSynopsisSid] = useState(() => {
    for (const sid of ['goodreads', 'google_books', 'open_library', ...sids]) {
      if (norm[sid]?.synopsis) return sid;
    }
    return null;
  });
  const [synopsisOverride, setSynopsisOverride] = useState(null);
  const synopsisValue = synopsisOverride ?? (synopsisSid ? allNorm[synopsisSid]?.synopsis : '') ?? '';

  // Collane editore
  const collane = usePublisherSeries(values.publisher);

  // Biblioteca
  const [status, setStatus] = useState('tbr');
  const [tags, setTags]     = useState('');
  const [notes, setNotes]   = useState('');
  // Valore di mercato (pre-compilato dal prezzo AbeBooks se disponibile)
  const [marketValue, setMarketValue] = useState(() => {
    const price = norm.abebooks?._abebooks_price;
    return price ? String(price) : '';
  });

  const pickCell = (key, sid) => {
    const raw = allNorm[sid]?.[key];
    if (!hasValue(raw)) return;
    setValues(v => ({ ...v, [key]: String(raw) }));
    setActiveSid(a => ({ ...a, [key]: sid }));
  };

  const handleConfirm = () => {
    const title = values.title;
    if (!title?.trim()) return;
    onConfirm({
      bookData: {
        title,
        subtitle:    values.subtitle    || null,
        publisher:   values.publisher   || null,
        year:        values.year        ? parseInt(values.year)  : null,
        pages:       values.pages       ? parseInt(values.pages) : null,
        language:    values.language    || null,
        isbn13:      values.isbn13      || null,
        isbn10:      values.isbn10      || null,
        series:        values.series        || null,
        series_volume: values.series_volume ? parseFloat(values.series_volume) : null,
        cover_url:   coverSid === 'custom'
          ? (customCoverUrl || null)
          : (coverSid ? (allNorm[coverSid]?.cover_url ?? norm[coverSid]?.cover_url) : null),
        synopsis:    synopsisValue || null,
        average_rating:  norm.goodreads?.average_rating || null,
        goodreads_id:    norm.goodreads?.goodreads_id    || null,
        google_books_id: norm.google_books?.google_books_id || null,
        open_library_id: norm.open_library?.open_library_id || null,
        genres: (norm.goodreads?.genres || norm.google_books?.categories || norm.open_library?.categories || norm.sbn?.categories || []),
        market_value: marketValue ? parseFloat(marketValue) : null,
      },
      authorNames: values.authors_str,
      status, tags, notes,
      coverFile: coverSid === 'custom' ? customCoverFile : null,
    });
  };

  // Colonne: larghezza campo-nome + 1 col per provider + 1 col finale
  const colTemplate = `140px ${allSids.map(() => '1fr').join(' ')} 1.2fr`;

  const ROW = { display: 'grid', gridTemplateColumns: colTemplate, gap: 0, borderBottom: '1px solid var(--m-rule)' };
  const CELL = (bg, color, clickable) => ({
    padding: '6px 10px', fontSize: 12, lineHeight: 1.35,
    background: bg || 'transparent', color: color || 'var(--m-ink)',
    cursor: clickable ? 'pointer' : 'default',
    transition: 'background 100ms',
    display: 'flex', alignItems: 'center', wordBreak: 'break-word',
    minHeight: 32,
  });

  return (
    <>
    <div className="m-overlay" onClick={onClose}>
      <div className="m-modal"
        style={{ width: 960, padding: '28px 32px', maxHeight: '94vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div className="m-eyebrow">
              Componi il libro · {sids.length} font{sids.length === 1 ? 'e' : 'i'}
              {allSids.length > sids.length && (
                <span style={{ color: 'var(--m-gold-deep)', marginLeft: 6 }}>+ {allSids.length - sids.length} extra</span>
              )}
            </div>
            <div className="m-serif" style={{ fontSize: 22, fontWeight: 500, marginTop: 2 }}>
              {values.title || 'Senza titolo'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => setShowSourcePicker(s => !s)}
              style={{
                background: showSourcePicker ? 'var(--m-parchment-2)' : 'none',
                border: '1px solid var(--m-rule)',
                cursor: 'pointer', fontSize: 12,
                fontFamily: "'EB Garamond', serif",
                fontVariant: 'small-caps', letterSpacing: '0.08em',
                padding: '4px 12px', color: 'var(--m-ink-soft)',
                transition: 'all 150ms',
              }}
              title="Aggiungi dati da un altro risultato della ricerca"
            >＋ aggiungi fonte</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--m-ink-muted)' }}>×</button>
          </div>
        </div>

        {/* ── Source picker panel ── */}
        {showSourcePicker && (
          <div style={{ marginBottom: 6, border: '1px solid var(--m-rule-strong)', background: 'var(--m-parchment-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 14px', borderBottom: '1px solid var(--m-rule)' }}>
              <div className="m-eyebrow" style={{ fontSize: 9 }}>
                Scegli un risultato dalla ricerca da aggiungere come colonna aggiuntiva
                <span style={{ fontVariant: 'normal', color: 'var(--m-ink-muted)', marginLeft: 6 }}>({allResults.length} disponibili)</span>
              </div>
              <button onClick={() => setShowSourcePicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--m-ink-muted)', lineHeight: 1 }}>×</button>
            </div>
            {allResults.length === 0
              ? <div style={{ padding: '14px 14px', color: 'var(--m-ink-muted)', fontStyle: 'italic', fontFamily: "'EB Garamond', serif", fontSize: 13 }}>
                  Nessun risultato disponibile — esegui prima una ricerca
                </div>
              : <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 14px', scrollbarWidth: 'thin' }}>
                  {allResults.map((r, i) => {
                    const p = PROVIDERS.find(pv => pv.id === r.source);
                    return (
                      <div
                        key={`${r.source}-${i}`}
                        onClick={() => addExtraSource(r)}
                        title={`Aggiungi "${r.title}" come fonte extra`}
                        style={{
                          flexShrink: 0, width: 86, cursor: 'pointer',
                          border: '1px solid var(--m-rule)',
                          padding: '5px 5px 7px',
                          background: 'var(--m-parchment)',
                          position: 'relative',
                          transition: 'border-color 120ms',
                        }}
                      >
                        <div style={{ position: 'absolute', top: 3, right: 3, background: p?.color || '#555', color: '#fff', fontSize: 7, padding: '1px 4px', fontVariant: 'small-caps', zIndex: 1 }}>
                          {p?.short || r.source.slice(0, 2).toUpperCase()}
                        </div>
                        {r.cover_url
                          ? <img src={r.cover_url} alt="" style={{ width: '100%', height: 62, objectFit: 'contain', display: 'block', background: '#f4ecd8' }} onError={e => { e.target.style.display='none'; }} />
                          : <div style={{ height: 62, background: 'var(--m-parchment-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: 16, color: 'var(--m-rule-strong)' }}>◇</span>
                            </div>
                        }
                        <div style={{ fontSize: 9, lineHeight: 1.3, marginTop: 4, fontFamily: "'EB Garamond', serif", wordBreak: 'break-word', color: 'var(--m-ink)' }}>
                          {(r.title || '').slice(0, 22)}{(r.title || '').length > 22 ? '…' : ''}
                        </div>
                        {r._abebooks_price && (
                          <div style={{ fontSize: 9, color: 'var(--m-gold)', fontFamily: "'EB Garamond', serif", fontWeight: 500 }}>
                            € {r._abebooks_price}
                          </div>
                        )}
                        <div style={{ fontSize: 8, color: 'var(--m-terracotta)', marginTop: 3, fontVariant: 'small-caps', textAlign: 'center', letterSpacing: '0.04em' }}>
                          ＋ aggiungi
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 20 }}>

          {/* ── Colonna copertine ── */}
          <div>
            <div className="m-eyebrow" style={{ fontSize: 9, marginBottom: 6 }}>Copertina · clicca per scegliere</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sids.map(sid => {
                const p = PROVIDERS.find(p => p.id === sid);
                const url = norm[sid]?.cover_url;
                const isActive = coverSid === sid;
                return (
                  <div key={sid} onClick={() => setCoverSid(sid)} style={{
                    cursor: 'pointer', transition: 'all 150ms',
                    outline: isActive ? `2px solid ${p?.color}` : '2px solid transparent',
                    outlineOffset: 2, opacity: isActive ? 1 : 0.38,
                  }}>
                    {url
                      ? <img src={url} alt="" style={{ width: '100%', display: 'block', maxHeight: 160, objectFit: 'contain', background: '#f4ecd8' }} onError={e => { e.target.style.display='none'; }} />
                      : <div style={{ height: 60, background: 'var(--m-parchment-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 9, color: 'var(--m-ink-muted)' }}>nessuna</span></div>
                    }
                    <div style={{ textAlign: 'center', fontSize: 9, padding: '2px 0', background: p?.color || '#555', color: '#fff', fontVariant: 'small-caps' }}>
                      {p?.short}{isActive ? ' ✓' : ''}
                    </div>
                  </div>
                );
              })}

              {/* Opzione copertina personalizzata */}
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 9, color: 'var(--m-ink-muted)', marginBottom: 3, fontVariant: 'small-caps', letterSpacing: '0.06em' }}>Personalizzata</div>
                <div
                  onClick={() => setCoverSid('custom')}
                  style={{
                    cursor: 'pointer',
                    outline: coverSid === 'custom' ? '2px solid var(--cine-gold)' : '2px solid transparent',
                    outlineOffset: 2, opacity: coverSid === 'custom' ? 1 : 0.55,
                  }}
                >
                  {(customCoverFile || customCoverUrl) ? (
                    <img
                      src={customCoverFile ? URL.createObjectURL(customCoverFile) : customCoverUrl}
                      alt="" onError={e => { e.target.style.display='none'; }}
                      style={{ width: '100%', display: 'block', maxHeight: 120, objectFit: 'contain', background: 'var(--m-parchment-2)' }}
                    />
                  ) : (
                    <div style={{ height: 48, background: 'var(--m-parchment-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, color: 'var(--m-ink-muted)' }}>nessuna</span>
                    </div>
                  )}
                  <div style={{ textAlign: 'center', fontSize: 9, padding: '2px 0', background: 'var(--m-parchment-3)', color: 'var(--m-ink)', fontVariant: 'small-caps' }}>
                    custom{coverSid === 'custom' ? ' ✓' : ''}
                  </div>
                </div>
                <input
                  type="text" placeholder="URL copertina…" value={customCoverUrl}
                  onChange={e => { setCustomCoverUrl(e.target.value); setCustomCoverFile(null); if (e.target.value) setCoverSid('custom'); }}
                  style={{ width: '100%', fontSize: 9, padding: '3px 5px', marginTop: 4, boxSizing: 'border-box',
                    border: '1px solid var(--m-rule)', background: 'var(--m-parchment-2)', color: 'var(--m-ink)' }}
                />
                <input
                  type="file" accept="image/*"
                  style={{ fontSize: 9, marginTop: 3, width: '100%' }}
                  onChange={e => {
                    const f = e.target.files[0];
                    if (f) { setCustomCoverFile(f); setCustomCoverUrl(''); setCoverSid('custom'); }
                  }}
                />
              </div>
            </div>

            {norm.goodreads?.average_rating > 0 && (
              <div className="m-mono" style={{ fontSize: 11, textAlign: 'center', marginTop: 10, color: 'var(--m-gold-deep)' }}>
                ★ {Number(norm.goodreads.average_rating).toFixed(2)}
                <div style={{ fontSize: 9, fontVariant: 'small-caps', opacity: 0.7 }}>Goodreads</div>
              </div>
            )}

            {(() => {
              const genres = norm.goodreads?.genres || norm.google_books?.categories || norm.open_library?.categories || [];
              return genres.length > 0 ? (
                <div style={{ marginTop: 10 }}>
                  <div className="m-eyebrow" style={{ fontSize: 8, marginBottom: 4 }}>Generi</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {genres.slice(0, 6).map(g => (
                      <span key={g} style={{ fontSize: 8, padding: '1px 4px', background: 'var(--m-parchment-2)', border: '1px solid var(--m-rule)', fontVariant: 'small-caps' }}>{g}</span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>

          {/* ── Tabella dati ── */}
          <div style={{ border: '1px solid var(--m-rule)' }}>

            {/* Intestazione colonne */}
            <div style={{ ...ROW, background: 'var(--m-parchment-2)', borderBottom: '2px solid var(--m-rule-strong)' }}>
              <div style={{ ...CELL(), fontSize: 10, fontVariant: 'small-caps', letterSpacing: '0.08em', color: 'var(--m-ink-muted)' }}>Campo</div>
              {allSids.map(sid => {
                const p = getProvMeta(sid);
                return (
                  <div key={sid} style={{ ...CELL(p?.color, '#fff'), justifyContent: 'center', fontVariant: 'small-caps', fontSize: 11, letterSpacing: '0.08em', fontWeight: 600 }}>
                    {p?.label || sid}
                  </div>
                );
              })}
              <div style={{ ...CELL('var(--m-parchment-3)', 'var(--m-ink)'), justifyContent: 'center', fontVariant: 'small-caps', fontSize: 11, letterSpacing: '0.08em' }}>
                ✎ Valore finale
              </div>
            </div>

            {/* Righe campi */}
            {MERGE_FIELDS.map(({ key, label, type = 'text', mono }) => {
              const curSid = activeSid[key];
              return (
                <div key={key} style={ROW}>
                  {/* Nome campo */}
                  <div style={{ ...CELL('var(--m-parchment-2)', 'var(--m-ink-muted)'), fontSize: 11, fontVariant: 'small-caps', letterSpacing: '0.06em', borderRight: '1px solid var(--m-rule)' }}>
                    {label}
                  </div>

                  {/* Celle provider */}
                  {allSids.map(sid => {
                    const p = getProvMeta(sid);
                    const raw = allNorm[sid]?.[key];
                    const hasV = hasValue(raw);
                    const isActive = curSid === sid && String(raw ?? '') === values[key];
                    return (
                      <div key={sid}
                        onClick={() => pickCell(key, sid)}
                        title={hasV ? `Usa il valore da ${p?.label}` : undefined}
                        style={{
                          ...CELL(
                            isActive ? p?.light : hasV ? undefined : 'transparent',
                            hasV ? 'var(--m-ink)' : 'var(--m-rule-strong)',
                          ),
                          cursor: hasV ? 'pointer' : 'default',
                          borderLeft: isActive ? `3px solid ${p?.color}` : '3px solid transparent',
                          borderRight: '1px solid var(--m-rule)',
                        }}
                      >
                        <span style={{ fontFamily: mono ? 'monospace' : undefined, fontSize: mono ? 11 : 12 }}>
                          {hasV ? String(raw) : '—'}
                        </span>
                      </div>
                    );
                  })}

                  {/* Input finale */}
                  <div style={{ padding: '3px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {/* Picker collane — solo per il campo serie, quando ci sono collane */}
                    {key === 'series' && (
                      <CollanePicker
                        collane={collane}
                        value={values[key]}
                        onChange={v => {
                          setValues(prev => ({ ...prev, series: v }));
                          setActiveSid(a => ({ ...a, series: null }));
                        }}
                      />
                    )}
                    <input
                      className={`m-input${mono ? ' m-mono' : ''}`}
                      style={{ padding: '3px 7px', fontSize: mono ? 11 : 13, width: '100%' }}
                      type={type}
                      value={values[key] ?? ''}
                      onChange={e => {
                        setValues(v => ({ ...v, [key]: e.target.value }));
                        setActiveSid(a => ({ ...a, [key]: null })); // deseleziona provider
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Sinossi */}
            <div style={{ borderBottom: '1px solid var(--m-rule)' }}>
              {/* Header sinossi */}
              <div style={{ ...ROW, borderBottom: '1px solid var(--m-rule)', background: 'var(--m-parchment-2)' }}>
                <div style={{ ...CELL('var(--m-parchment-2)', 'var(--m-ink-muted)'), fontSize: 11, fontVariant: 'small-caps', borderRight: '1px solid var(--m-rule)' }}>Sinossi</div>
                {allSids.map(sid => {
                  const p = getProvMeta(sid);
                  const hasSyn = !!allNorm[sid]?.synopsis;
                  const isActive = synopsisSid === sid && synopsisOverride === null;
                  return (
                    <div key={sid}
                      onClick={() => { if (hasSyn) { setSynopsisSid(sid); setSynopsisOverride(null); } }}
                      style={{
                        ...CELL(isActive ? p?.light : undefined, hasSyn ? 'var(--m-ink)' : 'var(--m-rule-strong)'),
                        cursor: hasSyn ? 'pointer' : 'default',
                        borderLeft: isActive ? `3px solid ${p?.color}` : '3px solid transparent',
                        borderRight: '1px solid var(--m-rule)',
                        fontSize: 11, fontVariant: 'small-caps',
                      }}>
                      {hasSyn ? `clicca (${(norm[sid].synopsis || '').length} car.)` : '—'}
                    </div>
                  );
                })}
                <div style={{ ...CELL(), fontSize: 11, color: 'var(--m-ink-muted)', fontVariant: 'small-caps' }}>
                  ✎ modificabile sotto
                </div>
              </div>
              {/* Textarea sinossi */}
              <div style={{ padding: '8px 10px' }}>
                <textarea className="m-textarea"
                  style={{ minHeight: 90, fontSize: 13, lineHeight: 1.6, width: '100%' }}
                  value={synopsisValue}
                  onChange={e => setSynopsisOverride(e.target.value)}
                />
              </div>
            </div>

            {/* Biblioteca */}
            <div style={{ padding: '14px 12px', background: 'var(--m-parchment-2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="m-field">
                <label>Stato iniziale</label>
                <select className="m-select" value={status} onChange={e => setStatus(e.target.value)}>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="m-field">
                <label>Tag (separati da virgola)</label>
                <input className="m-input" style={{ padding: '6px 10px' }} value={tags} onChange={e => setTags(e.target.value)} placeholder="romanzo, preferito…" />
              </div>
              <div className="m-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  Valore stimato (€)
                  {allNorm.abebooks?._abebooks_price && (
                    <span style={{ fontSize: 9, background: '#c9000b', color: '#fff', padding: '1px 5px', fontVariant: 'small-caps' }}>AbeBooks</span>
                  )}
                  <button
                    onClick={() => setShowPriceSearch(true)}
                    style={{
                      marginLeft: 'auto', background: 'none',
                      border: '1px solid var(--m-rule)',
                      cursor: 'pointer', fontSize: 10,
                      fontFamily: "'EB Garamond', serif",
                      fontVariant: 'small-caps', letterSpacing: '0.06em',
                      padding: '1px 8px', color: 'var(--m-ink-muted)',
                      transition: 'border-color 150ms',
                    }}
                  >cerca ↗</button>
                </label>
                <input className="m-input" style={{ padding: '6px 10px' }} type="number" min="0" step="0.01"
                  value={marketValue} onChange={e => setMarketValue(e.target.value)} placeholder="es. 12.50"/>
              </div>
              <div className="m-field" style={{ gridColumn: 'span 2' }}>
                <label>Note personali</label>
                <textarea className="m-textarea" style={{ minHeight: 44 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Prime impressioni…" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <button className="m-btn m-btn-gold" style={{ width: '100%', justifyContent: 'center', fontSize: 16 }}
                  onClick={handleConfirm} disabled={saving || !values.title?.trim()}>
                  {saving ? 'Aggiungendo…' : '✦ aggiungi alla biblioteca'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {showPriceSearch && (
      <MergePriceModal
        initialTitle={values.title}
        initialAuthors={values.authors_str}
        initialIsbn={values.isbn13 || values.isbn10}
        onUse={(price) => { setMarketValue(String(price)); setShowPriceSearch(false); }}
        onClose={() => setShowPriceSearch(false)}
      />
    )}
    </>
  );
}

/* ── ConfirmModal (solo per inserimento manuale) ───────────────── */
function ConfirmModal({ book, onConfirm, onClose, saving }) {
  const [status, setStatus]         = useState('tbr');
  const [tags, setTags]             = useState('');
  const [notes, setNotes]           = useState('');
  const [title, setTitle]           = useState(book.title || '');
  const [subtitle, setSubtitle]     = useState(book.subtitle || '');
  const [author, setAuthor]         = useState(
    (book.authors || []).map(a => (typeof a === 'string' ? a : a.name)).filter(Boolean).join(', ')
  );
  const [publisher, setPublisher]   = useState(book.publisher || '');
  const [year, setYear]             = useState(String(book.year || ''));
  const [pages, setPages]           = useState(String(book.pages || ''));
  const [isbn13, setIsbn13]         = useState(book.isbn13 || '');
  const [isbn10, setIsbn10]         = useState(book.isbn10 || '');
  const [language, setLanguage]     = useState(book.language || '');
  const [synopsis, setSynopsis]     = useState(book.synopsis || '');
  const [signed, setSigned]         = useState(book.signed ? true : false);
  const [marketValue, setMarketValue] = useState(book.market_value ? String(book.market_value) : '');
  const [seriesName, setSeriesName] = useState(book.series_name || '');
  const [seriesVol, setSeriesVol]   = useState(String(book.series_volume || ''));

  // Collane dell'editore corrente
  const collane = usePublisherSeries(publisher);

  // Copertina
  const [coverUrl, setCoverUrl]     = useState(book.cover_url || '');
  const [coverFile, setCoverFile]   = useState(book._coverFile || null);
  const [filePreview, setFilePreview] = useState(
    book._coverFile ? URL.createObjectURL(book._coverFile) : null
  );
  const displayCover = filePreview || coverUrl || null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setFilePreview(URL.createObjectURL(file));
    setCoverUrl('');
  };

  const bookPreview = { ...book, cover_url: displayCover, cover_local: null };

  return (
    <div className="m-overlay" onClick={onClose}>
      <div className="m-modal" style={{ width: 780, padding: '36px 40px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div className="m-eyebrow">Inserimento manuale</div>
            <div className="m-serif" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>{title || 'Senza titolo'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--m-ink-muted)' }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 28 }}>

          {/* Colonna sinistra: copertina + controlli */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <BookCover book={bookPreview} title={title} author={author} w={160} h={230} />
            <div className="m-field">
              <label style={{ fontSize: 11 }}>URL copertina</label>
              <input className="m-input" style={{ padding: '4px 8px', fontSize: 12 }}
                value={coverUrl}
                onChange={e => { setCoverUrl(e.target.value); if (e.target.value) { setCoverFile(null); setFilePreview(null); } }}
                placeholder="https://…"/>
            </div>
            <div className="m-field">
              <label style={{ fontSize: 11 }}>Carica file</label>
              <input type="file" accept="image/*" style={{ fontSize: 11 }} onChange={handleFileChange}/>
            </div>
            {displayCover && (
              <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11 }}
                onClick={() => { setCoverUrl(''); setCoverFile(null); setFilePreview(null); }}>
                ✕ rimuovi
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['Titolo *', title, setTitle], ['Sottotitolo', subtitle, setSubtitle]].map(([l, v, s]) => (
                <div key={l} className="m-field"><label>{l}</label><input className="m-input" style={{ padding: '6px 10px' }} value={v} onChange={e => s(e.target.value)} /></div>
              ))}
              <div className="m-field" style={{ gridColumn: 'span 2' }}><label>Autore/i (separati da virgola)</label><input className="m-input" style={{ padding: '6px 10px' }} value={author} onChange={e => setAuthor(e.target.value)} /></div>
              <div className="m-field"><label>Editore</label><input className="m-input" style={{ padding: '6px 10px' }} value={publisher} onChange={e => setPublisher(e.target.value)} /></div>
              <div className="m-field"><label>Anno</label><input className="m-input" style={{ padding: '6px 10px' }} type="number" value={year} onChange={e => setYear(e.target.value)} /></div>
              <div className="m-field"><label>Pagine</label><input className="m-input" style={{ padding: '6px 10px' }} type="number" value={pages} onChange={e => setPages(e.target.value)} /></div>
              <div className="m-field"><label>Lingua</label><input className="m-input" style={{ padding: '6px 10px' }} value={language} onChange={e => setLanguage(e.target.value)} /></div>
              <div className="m-field"><label>ISBN-13</label><input className="m-input m-mono" style={{ padding: '6px 10px', fontSize: 13 }} value={isbn13} onChange={e => setIsbn13(e.target.value)} /></div>
              <div className="m-field"><label>ISBN-10</label><input className="m-input m-mono" style={{ padding: '6px 10px', fontSize: 13 }} value={isbn10} onChange={e => setIsbn10(e.target.value)} /></div>

              {/* Collana / Serie */}
              <div className="m-field" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Collana / Serie</span>
                  {collane.length > 0 && (
                    <span className="m-mono" style={{ fontSize: 10, color: 'var(--m-gold-deep)', fontWeight: 400 }}>
                      {collane.length} collane disponibili
                    </span>
                  )}
                </label>
                <CollanePicker
                  collane={collane}
                  value={seriesName}
                  onChange={v => setSeriesName(v)}
                />
                <input
                  className="m-input"
                  style={{ padding: '6px 10px' }}
                  value={seriesName}
                  onChange={e => setSeriesName(e.target.value)}
                  placeholder="es. Piccola Biblioteca Adelphi"
                />
              </div>
              <div className="m-field">
                <label>Volume #</label>
                <input className="m-input" style={{ padding: '6px 10px' }} type="number" min="1"
                  value={seriesVol} onChange={e => setSeriesVol(e.target.value)} />
              </div>
              <div style={{}} />{/* spacer */}
            </div>
            <div className="m-field"><label>Sinossi</label><textarea className="m-textarea" style={{ minHeight: 80 }} value={synopsis} onChange={e => setSynopsis(e.target.value)} /></div>
            <div style={{ borderTop: '1px solid var(--m-rule)', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="m-field"><label>Stato</label><select className="m-select" value={status} onChange={e => setStatus(e.target.value)}>{Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              <div className="m-field"><label>Tag</label><input className="m-input" style={{ padding: '6px 10px' }} value={tags} onChange={e => setTags(e.target.value)} placeholder="romanzo, preferito…" /></div>
              <div className="m-field">
                <label>Valore stimato (€)</label>
                <input className="m-input" style={{ padding: '6px 10px' }} type="number" min="0" step="0.01"
                  value={marketValue} onChange={e => setMarketValue(e.target.value)} placeholder="es. 12.50"/>
              </div>
              <div className="m-field" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', paddingBottom: 6 }}>
                  <input type="checkbox" checked={signed} onChange={e => setSigned(e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: 'var(--m-gold)', cursor: 'pointer' }}/>
                  <span>Autografato</span>
                </label>
              </div>
              <div className="m-field" style={{ gridColumn: 'span 2' }}><label>Note personali</label><textarea className="m-textarea" style={{ minHeight: 50 }} value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </div>
            <button className="m-btn m-btn-gold" style={{ marginTop: 6, justifyContent: 'center', fontSize: 16 }}
              onClick={() => onConfirm({
                bookData: { ...book, title, subtitle, publisher,
                  year: year ? parseInt(year) : null,
                  pages: pages ? parseInt(pages) : null,
                  isbn13, isbn10, language, synopsis,
                  cover_url: coverUrl || null,
                  signed: signed ? 1 : 0,
                  market_value: marketValue ? parseFloat(marketValue) : null,
                  series_name:   seriesName   || null,
                  series_volume: seriesVol    ? parseFloat(seriesVol) : null,
                },
                authorNames: author, status, tags, notes,
                coverFile: coverFile || null,
              })}
              disabled={saving || !title.trim()}>
              {saving ? 'Aggiungendo…' : '✦ aggiungi alla biblioteca'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Pagina principale ─────────────────────────────────────────── */
export default function AggiungiLibro() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast    = useToast();

  const [method, setMethod] = useState('search');

  // Ricerca
  const [isbn, setIsbn]     = useState('');
  const [titolo, setTitolo] = useState('');
  const [autore, setAutore] = useState('');

  const [pStatus, setPStatus] = useState({ google_books: 'idle', open_library: 'idle', goodreads: 'idle', abebooks: 'idle', libraccio: 'idle', sbn: 'idle' });
  const [pError, setPError]   = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [results, setResults]  = useState([]);

  // Merge modal
  const [mergeSources, setMergeSources] = useState(null);
  const [mergePrimary, setMergePrimary] = useState(null);
  const [loadingMerge, setLoadingMerge] = useState(false);

  // Inserimento manuale → vecchio ConfirmModal
  const [manualBook, setManualBook] = useState(location.state?.prefill || null);

  const [saving, setSaving] = useState(false);

  // Selezione multipla
  const [selectedBooks, setSelectedBooks]   = useState([]);
  const [bulkStatus, setBulkStatus]         = useState('tbr');
  const [bulkSaving, setBulkSaving]         = useState(false);
  const [bulkProgress, setBulkProgress]     = useState(null); // { done, total }

  const [manual, setManual] = useState({
    title: '', subtitle: '', author: '', publisher: '', year: '', pages: '',
    isbn13: '', isbn10: '', language: '', synopsis: '', series_name: '', series_volume: '',
    cover_url: '', signed: false, market_value: '',
  });
  const [manualCoverFile, setManualCoverFile] = useState(null);
  const [manualCoverPreview, setManualCoverPreview] = useState(null);

  const [csvPreview, setCsvPreview] = useState(null);
  const [importing, setImporting]   = useState(false);

  /* ── Ricerca per-provider ── */
  const doSearch = useCallback(async () => {
    const hasIsbn  = isbn.trim().replace(/[-\s]/g, '').length >= 10;
    const hasQuery = titolo.trim() || autore.trim();
    if (!hasIsbn && !hasQuery) { toast('Inserisci almeno un campo di ricerca', 'error'); return; }

    setResults([]);
    setPStatus({ google_books: 'loading', open_library: 'loading', goodreads: 'loading', abebooks: 'loading', libraccio: 'loading', sbn: 'loading' });
    setPError({});
    setActiveFilter(null);

    const q = [titolo.trim(), autore.trim()].filter(Boolean).join(' ');

    const fetchGoogle = async () => {
      try {
        const data = await importApi.search(hasIsbn ? { isbn: isbn.trim(), providers: ['google_books'] } : { query: q, providers: ['google_books'] });
        const items = (data.results || []).map(r => ({ ...r, source: 'google_books' }));
        setResults(prev => dedup([...prev, ...items]));
        setPStatus(ps => ({ ...ps, google_books: items.length }));
      } catch (e) {
        setPStatus(ps => ({ ...ps, google_books: 'error' }));
        setPError(pe => ({ ...pe, google_books: e?.message }));
      }
    };

    const fetchOL = async () => {
      try {
        const data = await importApi.search(hasIsbn ? { isbn: isbn.trim(), providers: ['open_library'] } : { query: q, providers: ['open_library'] });
        const items = (data.results || []).map(r => ({ ...r, source: 'open_library' }));
        setResults(prev => dedup([...prev, ...items]));
        setPStatus(ps => ({ ...ps, open_library: items.length }));
      } catch (e) {
        setPStatus(ps => ({ ...ps, open_library: 'error' }));
        setPError(pe => ({ ...pe, open_library: e?.message }));
      }
    };

    const fetchGR = async () => {
      try {
        const searchQuery = [titolo.trim(), autore.trim(), isbn.trim()].filter(Boolean).join(' ');
        const data = await importApi.goodreadsSearch(searchQuery);
        const items = (data.results || []).map(r => ({ ...r, source: 'goodreads' }));
        setResults(prev => dedup([...prev, ...items]));
        if (data.error) {
          setPStatus(ps => ({ ...ps, goodreads: 'error' }));
          setPError(pe => ({ ...pe, goodreads: data.error }));
        } else {
          setPStatus(ps => ({ ...ps, goodreads: items.length }));
        }
      } catch (e) {
        setPStatus(ps => ({ ...ps, goodreads: 'error' }));
        setPError(pe => ({ ...pe, goodreads: e?.message }));
      }
    };

    const fetchAB = async () => {
      try {
        const hasIsbnClean = isbn.trim().replace(/[-\s]/g, '').length >= 10;
        const data = await pricesApi.search({
          keywords: hasIsbnClean ? isbn.trim() : undefined,
          title:    !hasIsbnClean && titolo.trim() ? titolo.trim() : undefined,
          author:   !hasIsbnClean && autore.trim() ? autore.trim() : undefined,
        });
        const items = (data.results || []).map(r => ({
          source:          'abebooks',
          title:           r.title,
          authors:         r.author ? [{ name: r.author }] : [],
          cover_url:       r.cover  || null,
          isbn13:          r.isbn13 || null,
          publisher:       r.publisher || null,
          year:            r.year   || null,
          _abebooks_price: r.price  || null,   // prezzo mercato AbeBooks
          _abebooks_url:   r.url    || null,
          _condition:      r.condition || null,
        }));
        setResults(prev => dedup([...prev, ...items]));
        setPStatus(ps => ({ ...ps, abebooks: items.length }));
      } catch (e) {
        setPStatus(ps => ({ ...ps, abebooks: 'error' }));
        setPError(pe => ({ ...pe, abebooks: e?.message }));
      }
    };

    const fetchLibraccio = async () => {
      try {
        const data = await importApi.search(
          hasIsbn
            ? { isbn: isbn.trim(), providers: ['libraccio'] }
            : { title: titolo.trim() || undefined, author: autore.trim() || undefined, query: !titolo.trim() && !autore.trim() ? q : undefined, providers: ['libraccio'] }
        );
        const items = (data.results || []).map(r => ({ ...r, source: 'libraccio' }));
        setResults(prev => dedup([...prev, ...items]));
        setPStatus(ps => ({ ...ps, libraccio: items.length }));
      } catch (e) {
        setPStatus(ps => ({ ...ps, libraccio: 'error' }));
        setPError(pe => ({ ...pe, libraccio: e?.message }));
      }
    };

    const fetchSBN = async () => {
      try {
        const data = await importApi.search(
          hasIsbn
            ? { isbn: isbn.trim(), providers: ['sbn'] }
            : { title: titolo.trim() || undefined, author: autore.trim() || undefined, query: !titolo.trim() && !autore.trim() ? q : undefined, providers: ['sbn'] }
        );
        const items = (data.results || []).map(r => ({ ...r, source: 'sbn' }));
        setResults(prev => dedup([...prev, ...items]));
        setPStatus(ps => ({ ...ps, sbn: items.length }));
      } catch (e) {
        setPStatus(ps => ({ ...ps, sbn: 'error' }));
        setPError(pe => ({ ...pe, sbn: e?.message }));
      }
    };

    await Promise.all([fetchGoogle(), fetchOL(), fetchGR(), fetchAB(), fetchLibraccio(), fetchSBN()]);
  }, [isbn, titolo, autore, toast]);

  /* ── Selezione carta → fetch parallelo tutte le fonti ── */
  const handleSelect = useCallback(async (book) => {
    setLoadingMerge(true);
    const sources = {};
    try {
      // 1. Dettaglio fonte primaria
      let primary = { ...book };
      if (book.source === 'goodreads' && book.goodreads_id) {
        try {
          const detail = await importApi.goodreadsDetail(book.goodreads_id);
          if (!detail.error && detail.title) {
            // Merge intelligente: sovrascriviamo solo i campi con valore reale,
            // per non perdere i dati già estratti dall'autocomplete (pagine, sinossi, serie…)
            for (const [k, v] of Object.entries(detail)) {
              const isUseful = v !== null && v !== undefined && v !== ''
                && !(Array.isArray(v) && v.length === 0);
              if (isUseful) primary[k] = v;
            }
            primary.source = 'goodreads';
          }
        } catch { /* WAF o errore rete: usiamo i dati autocomplete già disponibili */ }
      }
      sources[primary.source] = primary;

      // 2. Cerca il libro nelle altre fonti in parallelo
      const isbn13 = primary.isbn13 || primary.isbn10;
      const titleQ  = primary.title  || book.title  || '';
      const authorQ = primary.authors?.[0]?.name || book.authors?.[0]?.name || '';

      const otherProviders = PROVIDERS.filter(p => p.id !== primary.source && p.id !== 'abebooks');

      await Promise.allSettled(otherProviders.map(async (p) => {
        try {
          if (p.id === 'goodreads') {
            const res = await importApi.goodreadsSearch(titleQ);
            const first = res.results?.[0];
            if (first?.goodreads_id) {
              // Parti dai dati autocomplete (già ricchi: pagine, sinossi, serie…)
              const grData = { ...first, source: 'goodreads' };
              // Prova ad arricchire col detail; se WAF-bloccato usiamo comunque l'autocomplete
              try {
                const detail = await importApi.goodreadsDetail(first.goodreads_id);
                if (!detail.error && detail.title) {
                  for (const [k, v] of Object.entries(detail)) {
                    const useful = v !== null && v !== undefined && v !== ''
                      && !(Array.isArray(v) && v.length === 0);
                    if (useful) grData[k] = v;
                  }
                }
              } catch {}
              sources.goodreads = grData;
            }
          } else {
            // Passa title+author separati per ricerca più precisa (GB: intitle+inauthor)
            const res = await importApi.search(
              isbn13
                ? { isbn: isbn13, providers: [p.id] }
                : { title: titleQ, author: authorQ, providers: [p.id] }
            );
            const first = res.results?.[0];
            if (first?.title) sources[p.id] = { ...first, source: p.id };
          }
        } catch {}
      }));

      setMergePrimary(primary.source);
      setMergeSources(sources);
    } catch (e) {
      toast('Errore nel caricamento dei dati: ' + e.message, 'error');
    } finally {
      setLoadingMerge(false);
    }
  }, [toast]);

  /* ── Core: aggiunge un singolo libro, restituisce il risultato ── */
  const addOneBook = useCallback(async ({ bookData, authorNames, status, tags, notes, coverFile }) => {
    const authorList = (authorNames || '').split(',').map(s => s.trim()).filter(Boolean);
    const authorsData = [];
    for (const name of authorList) {
      const found = await authorsApi.fuzzy(name);
      if (found?.[0]?.id) {
        authorsData.push({ author_id: found[0].id, role: 'author' });
      } else {
        const created = await authorsApi.create({ name });
        authorsData.push({ author_id: created.id, role: 'author' });
      }
    }
    const tagList = (tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const result = await importApi.importBook({
      book_data: { ...bookData, tags: tagList },
      authors_data: authorsData,
      status,
    });
    if (notes) await booksApi.update(result.id, { personal_notes: notes });
    if (coverFile) { try { await booksApi.uploadCover(result.id, coverFile); } catch {} }
    return result;
  }, []);

  /* ── Aggiungi un libro (merge modal → naviga alla scheda) ── */
  const handleConfirm = async ({ bookData, authorNames, status, tags, notes, coverFile }) => {
    setSaving(true);
    try {
      const result = await addOneBook({ bookData, authorNames, status, tags, notes, coverFile });
      toast('Libro aggiunto con successo!', 'success');
      window.dispatchEvent(new CustomEvent('malachia:stats-changed'));
      navigate(`/libro/${result.id}`);
    } catch (e) {
      toast('Errore: ' + (e?.message || 'sconosciuto'), 'error');
      setSaving(false);
    }
  };

  /* ── Toggle selezione multipla ── */
  const toggleBookSelect = useCallback((book) => {
    const key = bookKey(book);
    setSelectedBooks(prev => {
      const exists = prev.some(b => bookKey(b) === key);
      return exists ? prev.filter(b => bookKey(b) !== key) : [...prev, book];
    });
  }, []);

  /* ── Aggiungi tutti i libri selezionati (quick-add senza merge modal) ── */
  const handleBulkAdd = async () => {
    if (selectedBooks.length === 0) return;
    setBulkSaving(true);
    setBulkProgress({ done: 0, total: selectedBooks.length });
    let added = 0, failed = 0;
    for (const book of selectedBooks) {
      try {
        const authorNames = (book.authors || [])
          .map(a => (typeof a === 'string' ? a : a.name))
          .filter(Boolean)
          .join(', ');
        await addOneBook({
          bookData: {
            title:           book.title,
            subtitle:        book.subtitle        || null,
            publisher:       book.publisher       || null,
            year:            book.year            || null,
            pages:           book.pages           || null,
            language:        book.language        || null,
            isbn13:          book.isbn13          || null,
            isbn10:          book.isbn10          || null,
            cover_url:       book.cover_url       || null,
            synopsis:        book.synopsis        || null,
            google_books_id: book.google_books_id || null,
            open_library_id: book.open_library_id || null,
            goodreads_id:    book.goodreads_id    || null,
            genres:          book.categories || book.genres || [],
          },
          authorNames: authorNames || '',
          status: bulkStatus,
          tags: '', notes: '',
        });
        added++;
      } catch { failed++; }
      setBulkProgress(p => ({ ...p, done: (p?.done ?? 0) + 1 }));
    }
    const msg = failed > 0
      ? `${added} aggiunt${added === 1 ? 'o' : 'i'} · ${failed} error${failed === 1 ? 'e' : 'i'}`
      : `${added} libr${added === 1 ? 'o aggiunto' : 'i aggiunti'}`;
    toast(msg, failed > 0 ? 'error' : 'success');
    setBulkSaving(false);
    setBulkProgress(null);
    setSelectedBooks([]);
    navigate('/libreria');
  };

  const anyLoading = Object.values(pStatus).some(s => s === 'loading');
  const anySearched = Object.values(pStatus).some(s => s !== 'idle');

  // Fonti di metadati prima, poi fonti italiane, poi AbeBooks prezzi
  const SOURCE_ORDER = { goodreads: 0, google_books: 1, open_library: 2, sbn: 3, libraccio: 4, abebooks: 5 };
  const sorted = [...results].sort((a, b) =>
    (SOURCE_ORDER[a.source] ?? 9) - (SOURCE_ORDER[b.source] ?? 9)
  );
  const visible = activeFilter ? sorted.filter(r => r.source === activeFilter) : sorted;

  /* CSV */
  const loadCSV = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const data = await importApi.goodreadsCSV(file); setCsvPreview(data); }
    catch { toast('Errore nel parsing del CSV', 'error'); }
  };
  const confirmCSV = async (skip = true) => {
    setImporting(true);
    try {
      const r = await importApi.goodreadsCSVConfirm(csvPreview.preview, skip);
      toast(`Importati ${r.imported} libri · Saltati: ${r.skipped}`, 'success');
      navigate('/libreria');
    } catch { toast('Errore importazione', 'error'); setImporting(false); }
  };

  return (
    <div style={{ padding: '40px 48px', minHeight: '100%' }}>
      <div className="m-eyebrow">Nuovo ingresso · ad bibliothecam</div>
      <div className="m-serif" style={{ fontSize: 40, fontWeight: 500, lineHeight: 1.05, marginTop: 4 }}>
        Aggiungi un <em style={{ color: 'var(--m-terracotta)' }}>volume</em>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 0, marginTop: 28, borderBottom: '1px solid var(--m-rule)' }}>
        {[
          { key: 'search', label: '⌕  cerca online' },
          { key: 'manual', label: '✎  inserimento manuale' },
          { key: 'csv',    label: '⇡  importa CSV' },
        ].map(m => (
          <button key={m.key} onClick={() => setMethod(m.key)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'EB Garamond', serif", fontSize: 14, fontVariant: 'small-caps',
            letterSpacing: '0.1em', padding: '10px 22px',
            color: method === m.key ? 'var(--m-ink)' : 'var(--m-ink-muted)',
            borderBottom: method === m.key ? '2px solid var(--m-terracotta)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 150ms',
          }}>{m.label}</button>
        ))}
      </div>

      {/* ── CERCA ONLINE ── */}
      {method === 'search' && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
            <div className="m-field">
              <label>ISBN</label>
              <input className="m-input m-mono" style={{ padding: '8px 10px', fontSize: 14 }}
                value={isbn} onChange={e => setIsbn(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="9788845292422" />
            </div>
            <div className="m-field">
              <label>Titolo</label>
              <input className="m-input" style={{ padding: '8px 10px' }}
                value={titolo} onChange={e => setTitolo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Il nome della rosa" />
            </div>
            <div className="m-field">
              <label>Autore</label>
              <input className="m-input" style={{ padding: '8px 10px' }}
                value={autore} onChange={e => setAutore(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Umberto Eco" />
            </div>
            <button className="m-btn" style={{ padding: '9px 24px' }} onClick={doSearch} disabled={anyLoading}>
              {anyLoading ? '…' : 'cerca'}
            </button>
          </div>

          {/* Pills provider */}
          {anySearched && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="m-eyebrow" style={{ marginRight: 4 }}>Fonti:</span>
              {PROVIDERS.map(p => {
                const st = pStatus[p.id];
                const errMsg = pError[p.id];
                const isActive = activeFilter === p.id;
                return (
                  <button key={p.id}
                    onClick={() => st !== 'error' && setActiveFilter(isActive ? null : p.id)}
                    title={errMsg || undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 12px', cursor: st === 'error' ? 'help' : 'pointer',
                      border: `1px solid ${st === 'error' ? 'var(--m-vermilion)' : isActive ? p.color : 'var(--m-rule-strong)'}`,
                      background: st === 'error' ? 'rgba(168,58,38,0.06)' : isActive ? p.light : 'transparent',
                      fontFamily: "'EB Garamond', serif", fontSize: 13, fontVariant: 'small-caps',
                      color: st === 'error' ? 'var(--m-vermilion)' : 'var(--m-ink-soft)',
                      transition: 'all 150ms',
                    }}>
                    {st === 'loading'
                      ? <span style={{ width: 8, height: 8, borderRadius: '50%', border: `2px solid ${p.color}`, borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      : <span style={{ width: 8, height: 8, borderRadius: '50%', background: st === 'error' ? 'var(--m-vermilion)' : typeof st === 'number' && st > 0 ? p.color : 'var(--m-rule-strong)' }} />
                    }
                    {p.label}
                    {typeof st === 'number' && <span className="m-mono" style={{ fontSize: 11, color: 'var(--m-ink-muted)' }}>{st}</span>}
                    {st === 'loading' && <span style={{ fontSize: 11, color: 'var(--m-ink-muted)', fontVariant: 'normal' }}>…</span>}
                    {st === 'error' && errMsg && <span style={{ fontSize: 11, fontVariant: 'normal' }}>⚠ {errMsg.slice(0, 35)}</span>}
                  </button>
                );
              })}
              {activeFilter && (
                <button onClick={() => setActiveFilter(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--m-ink-muted)', textDecoration: 'underline', fontFamily: "'EB Garamond'" }}>
                  mostra tutti
                </button>
              )}
            </div>
          )}

          {/* Indicatore caricamento merge */}
          {loadingMerge && (
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--m-ink-muted)', fontFamily: "'EB Garamond'", fontStyle: 'italic', fontSize: 15 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--m-terracotta)', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              Raccolta dati da tutte le fonti…
            </div>
          )}

          {/* Griglia */}
          {visible.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 16 }}>
                <div className="m-eyebrow">
                  {visible.length} risultat{visible.length === 1 ? 'o' : 'i'}
                  {activeFilter && ` · ${PROVIDERS.find(p => p.id === activeFilter)?.label}`}
                  {selectedBooks.length > 0 && (
                    <span style={{ color: 'var(--m-gold-deep)', marginLeft: 12 }}>
                      · {selectedBooks.length} selezionat{selectedBooks.length === 1 ? 'o' : 'i'}
                    </span>
                  )}
                </div>
                {selectedBooks.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      onClick={() => setSelectedBooks(visible)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: "'EB Garamond', serif", color: 'var(--m-ink-muted)', textDecoration: 'underline' }}>
                      seleziona tutti
                    </button>
                    <button
                      onClick={() => setSelectedBooks([])}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: "'EB Garamond', serif", color: 'var(--m-ink-muted)', textDecoration: 'underline' }}>
                      deseleziona tutti
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, paddingBottom: selectedBooks.length > 0 ? 80 : 0 }}>
                {visible.map((book, i) => {
                  const key = `${book.source}-${book.isbn13 || book.goodreads_id || book.google_books_id || book.open_library_id || i}`;
                  const bk  = bookKey(book);
                  return (
                    <ResultCard
                      key={key}
                      book={book}
                      onSelect={handleSelect}
                      onToggleSelect={toggleBookSelect}
                      selected={selectedBooks.some(b => bookKey(b) === bk)}
                      disabled={loadingMerge || bulkSaving}
                    />
                  );
                })}
              </div>
            </>
          )}

          {visible.length === 0 && !anyLoading && anySearched && !loadingMerge && (
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, color: 'var(--m-rule-strong)' }}>◎</div>
              <div className="m-marginalia" style={{ marginTop: 12 }}>Nessun risultato. Prova con un termine diverso o usa l'inserimento manuale.</div>
            </div>
          )}
        </div>
      )}

      {/* ── MANUALE ── */}
      {method === 'manual' && (
        <div style={{ marginTop: 28, maxWidth: 720 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['Titolo *', 'title'], ['Sottotitolo', 'subtitle'],
              ['Autore/i (separati da virgola)', 'author', 'span 2'],
              ['Editore', 'publisher'], ['Anno', 'year'],
              ['Pagine', 'pages'], ['Lingua', 'language'],
              ['ISBN-13', 'isbn13'], ['ISBN-10', 'isbn10'],
              ['Serie', 'series_name'], ['Volume #', 'series_volume'],
            ].map(([label, key, span]) => (
              <div key={key} className="m-field" style={span ? { gridColumn: span } : {}}>
                <label>{label}</label>
                <input className="m-input" value={manual[key]} onChange={e => setManual(m => ({ ...m, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="m-field" style={{ gridColumn: 'span 2' }}>
              <label>Sinossi</label>
              <textarea className="m-textarea" style={{ minHeight: 80 }} value={manual.synopsis}
                onChange={e => setManual(m => ({ ...m, synopsis: e.target.value }))} />
            </div>

            {/* Valore stimato + Autografato */}
            <div className="m-field">
              <label>Valore stimato (€)</label>
              <input
                className="m-input" type="number" min="0" step="0.01"
                placeholder="es. 12.50"
                value={manual.market_value}
                onChange={e => setManual(m => ({ ...m, market_value: e.target.value }))}
              />
            </div>
            <div className="m-field" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', paddingBottom: 4 }}>
                <input
                  type="checkbox"
                  checked={manual.signed}
                  onChange={e => setManual(m => ({ ...m, signed: e.target.checked }))}
                  style={{ width: 15, height: 15, accentColor: 'var(--m-gold)', cursor: 'pointer' }}
                />
                <span>Autografato</span>
              </label>
            </div>

            {/* Copertina */}
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--m-rule)', paddingTop: 14 }}>
              <div className="m-eyebrow" style={{ marginBottom: 10 }}>Copertina (opzionale)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div className="m-field">
                  <label>URL immagine</label>
                  <input className="m-input" style={{ padding: '6px 10px' }}
                    value={manual.cover_url}
                    onChange={e => {
                      setManual(m => ({ ...m, cover_url: e.target.value }));
                      if (e.target.value) { setManualCoverFile(null); setManualCoverPreview(null); }
                    }}
                    placeholder="https://…"/>
                </div>
                <div className="m-field">
                  <label>Oppure carica file</label>
                  <input type="file" accept="image/*" style={{ fontSize: 13 }}
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setManualCoverFile(file);
                      setManualCoverPreview(URL.createObjectURL(file));
                      setManual(m => ({ ...m, cover_url: '' }));
                    }}/>
                </div>
              </div>
              {(manualCoverPreview || manual.cover_url) && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={manualCoverPreview || manual.cover_url}
                    alt="Anteprima copertina"
                    style={{ height: 100, objectFit: 'contain', border: '1px solid var(--m-rule)', background: 'var(--m-parchment-2)' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <button className="m-btn m-btn-ghost m-btn-sm" onClick={() => {
                    setManual(m => ({ ...m, cover_url: '' }));
                    setManualCoverFile(null);
                    setManualCoverPreview(null);
                  }}>✕ rimuovi</button>
                </div>
              )}
            </div>
          </div>
          <button className="m-btn m-btn-gold" style={{ marginTop: 20 }}
            onClick={() => {
              if (!manual.title.trim()) { toast('Il titolo è obbligatorio', 'error'); return; }
              setManualBook({
                ...manual,
                year: manual.year ? parseInt(manual.year) : null,
                pages: manual.pages ? parseInt(manual.pages) : null,
                series_volume: manual.series_volume ? parseInt(manual.series_volume) : null,
                market_value: manual.market_value ? parseFloat(manual.market_value) : null,
                signed: manual.signed ? 1 : 0,
                authors: manual.author.split(',').map(n => ({ name: n.trim(), role: 'author' })).filter(a => a.name),
                source: 'manual',
                _coverFile: manualCoverFile || undefined,
              });
            }}
            disabled={!manual.title.trim()}>✦ continua</button>
        </div>
      )}

      {/* ── CSV ── */}
      {method === 'csv' && (
        <div style={{ marginTop: 28, maxWidth: 800 }}>
          <div style={{ padding: '20px', border: '1px solid var(--m-rule)', background: 'rgba(255,255,255,0.15)' }}>
            <div className="m-eyebrow" style={{ marginBottom: 10 }}>Importazione CSV Goodreads</div>
            <p className="m-body" style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--m-ink-soft)', marginBottom: 14 }}>
              Esporta la libreria da Goodreads (Account → Impostazioni → Esporta libreria), poi carica <strong>goodreads_library_export.csv</strong>.
            </p>
            <input type="file" accept=".csv" onChange={loadCSV} style={{ fontFamily: "'EB Garamond'", fontSize: 15 }} />
          </div>
          {csvPreview && (
            <div style={{ marginTop: 20 }}>
              <div className="m-eyebrow" style={{ marginBottom: 10 }}>
                {csvPreview.total} libri trovati
                {csvPreview.preview.filter(r => r.duplicate).length > 0 && (
                  <span style={{ color: 'var(--m-vermilion)', marginLeft: 12 }}>⚠ {csvPreview.preview.filter(r => r.duplicate).length} duplicati</span>
                )}
              </div>
              <div style={{ maxHeight: 280, overflow: 'auto', border: '1px solid var(--m-rule)' }}>
                <table className="m-table">
                  <thead><tr><th>Titolo</th><th>Autore</th><th>Stato</th><th>Val.</th><th></th></tr></thead>
                  <tbody>
                    {csvPreview.preview.slice(0, 50).map((row, i) => (
                      <tr key={i} style={{ background: row.duplicate ? 'rgba(168,58,38,0.06)' : undefined }}>
                        <td><span className="m-serif">{row.title}</span></td>
                        <td className="m-marginalia">{row.author}</td>
                        <td style={{ fontSize: 12 }}>{row.status}</td>
                        <td className="m-nums" style={{ fontSize: 12 }}>{row.my_rating ? '★'.repeat(row.my_rating) : '—'}</td>
                        <td>{row.duplicate && <span style={{ color: 'var(--m-vermilion)', fontSize: 11 }}>dup.</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="m-marginalia" style={{ marginTop: 8, fontSize: 12 }}>{csvPreview.disclaimer}</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button className="m-btn" onClick={() => confirmCSV(true)} disabled={importing}>{importing ? 'Importando…' : 'Importa (salta duplicati)'}</button>
                <button className="m-btn m-btn-ghost" onClick={() => confirmCSV(false)} disabled={importing}>Importa tutto</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MERGE MODAL (ricerca online) ── */}
      {mergeSources && (
        <MergeModal
          sources={mergeSources}
          primarySource={mergePrimary}
          onClose={() => setMergeSources(null)}
          onConfirm={handleConfirm}
          saving={saving}
          allResults={results}
        />
      )}

      {/* ── CONFIRM MODAL (inserimento manuale) ── */}
      {manualBook && (
        <ConfirmModal
          book={manualBook}
          onClose={() => setManualBook(null)}
          onConfirm={handleConfirm}
          saving={saving}
        />
      )}

      {/* ── BARRA SELEZIONE MULTIPLA ── */}
      {selectedBooks.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--m-ink)', color: 'var(--m-parchment)',
          border: '1px solid rgba(191,161,90,0.5)',
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          zIndex: 300,
          fontFamily: "'EB Garamond', serif",
          minWidth: 420,
        }}>
          {/* Anteprima copertine */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {selectedBooks.slice(0, 5).map((b, i) => (
              <BookCover key={i} book={b} w={28} h={40}/>
            ))}
            {selectedBooks.length > 5 && (
              <div style={{
                width: 28, height: 40, background: 'rgba(191,161,90,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: 'var(--m-gold-pale)',
              }}>+{selectedBooks.length - 5}</div>
            )}
          </div>

          <div style={{ width: 1, height: 36, background: 'rgba(191,161,90,0.25)', flexShrink: 0 }}/>

          {/* Contatore */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1 }}>
              {selectedBooks.length} libr{selectedBooks.length === 1 ? 'o' : 'i'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(244,234,214,0.55)', marginTop: 2, fontVariant: 'small-caps', letterSpacing: '0.06em' }}>
              selezionat{selectedBooks.length === 1 ? 'o' : 'i'}
            </div>
          </div>

          <div style={{ width: 1, height: 36, background: 'rgba(191,161,90,0.25)', flexShrink: 0 }}/>

          {/* Status selector */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'rgba(244,234,214,0.55)', fontVariant: 'small-caps', letterSpacing: '0.08em', marginBottom: 4 }}>Stato</div>
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              disabled={bulkSaving}
              style={{
                background: 'rgba(244,234,214,0.08)',
                border: '1px solid rgba(191,161,90,0.4)',
                color: 'var(--m-parchment)',
                fontFamily: "'EB Garamond', serif",
                fontSize: 14, padding: '3px 8px',
                cursor: 'pointer',
              }}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v} style={{ background: '#1a1208' }}>{l}</option>
              ))}
            </select>
          </div>

          {/* Pulsante aggiungi */}
          <button
            onClick={handleBulkAdd}
            disabled={bulkSaving}
            style={{
              background: 'var(--m-gold)', color: '#12100d',
              border: 'none', padding: '10px 22px',
              fontFamily: "'EB Garamond', serif",
              fontSize: 15, fontVariant: 'small-caps', letterSpacing: '0.06em',
              cursor: bulkSaving ? 'wait' : 'pointer',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
            {bulkSaving ? (
              <>
                <span style={{ width: 12, height: 12, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }}/>
                {bulkProgress ? `${bulkProgress.done} / ${bulkProgress.total}` : '…'}
              </>
            ) : (
              `✦ aggiungi ${selectedBooks.length}`
            )}
          </button>

          {/* Annulla */}
          <button
            onClick={() => setSelectedBooks([])}
            disabled={bulkSaving}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(244,234,214,0.45)',
              cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '4px',
              flexShrink: 0,
            }}>×</button>
        </div>
      )}
    </div>
  );
}
