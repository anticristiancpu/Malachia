import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import { wishlist as wishlistApi, importApi, authors as authorsApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';

/* ─── Strip atoms (stesso pattern di Libreria) ──────────────────────────────── */
const stripStyle = {
  position: 'relative', height: 54, flexShrink: 0,
  backgroundImage:
    'radial-gradient(ellipse 60% 180% at 50% 50%, rgba(232,220,192,0.46) 0%, rgba(216,180,106,0.25) 18%, rgba(216,180,106,0.04) 56%, transparent 80%),' +
    'linear-gradient(180deg, rgba(232,220,192,0.04) 0%, rgba(216,180,106,0.10) 50%, rgba(232,220,192,0.04) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(232,220,192,0.18), inset 0 -1px 0 rgba(0,0,0,0.55)',
};
const cinzelStyle = (sz, tracking = '0.22em', color = 'var(--cine-cream)', weight = 500) => ({
  fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
  letterSpacing: tracking, fontSize: sz, fontWeight: weight,
  color, lineHeight: 1, whiteSpace: 'nowrap',
  textShadow: '0 1px 0 rgba(0,0,0,0.6)',
});
const btnGhostStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px',
  background: 'transparent', border: '1px solid rgba(216,180,106,0.22)',
  color: 'var(--cine-cream)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
};
const VRule = ({ h = 18, op = 0.28 }) => (
  <span style={{ width: 1, height: h, background: `rgba(216,180,106,${op})`, alignSelf: 'center', flexShrink: 0 }}/>
);
const IconRune = () => (
  <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <path d="M3 2 L3 16 L9 14 L15 16 L15 2 L9 4 Z" stroke="var(--cine-gold)" strokeWidth="1.1" fill="none" strokeLinejoin="miter"/>
    <path d="M9 4 L9 14" stroke="var(--cine-gold)" strokeWidth="0.9" opacity="0.55"/>
    <path d="M9 1 L10 3 L9 5 L8 3 Z" fill="var(--cine-gold)" opacity="0.85"/>
  </svg>
);
const IconMagnifier = () => (
  <svg width={13} height={13} viewBox="0 0 13 13" fill="none">
    <circle cx="5.5" cy="5.5" r="3.8" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M8.4 8.4 L11.8 11.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconPlus = () => (
  <svg width={11} height={11} viewBox="0 0 11 11" fill="none">
    <path d="M5.5 1 L5.5 10 M1 5.5 L10 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconStack = () => (
  <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <rect x="2" y="3"  width="10" height="2.4" stroke="currentColor" strokeWidth="1" fill="none"/>
    <rect x="3" y="6"  width="8"  height="2.4" stroke="currentColor" strokeWidth="1" fill="none"/>
    <rect x="2" y="9"  width="10" height="2.4" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
);

function DesiderataStrip({ count, searchOpen, onToggleSearch, onManuale }) {
  return (
    <div style={stripStyle}>
      <div style={{ position: 'absolute', inset: 0, padding: '0 28px', display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <IconRune/>
          <span style={cinzelStyle(16, '0.22em', 'var(--cine-cream)', 600)}>Desiderata</span>
        </div>

        <VRule h={26}/>

        {/* Cerca online */}
        <button
          onClick={onToggleSearch}
          style={{
            ...btnGhostStyle,
            background: searchOpen ? 'rgba(216,180,106,0.12)' : 'transparent',
            borderColor: searchOpen ? 'rgba(216,180,106,0.45)' : 'rgba(216,180,106,0.22)',
          }}
        >
          <IconMagnifier/>
          <span style={cinzelStyle(11)}>Cerca online</span>
        </button>

        {/* Aggiungi manuale */}
        <button onClick={onManuale} style={btnGhostStyle}>
          <IconPlus/>
          <span style={cinzelStyle(11)}>Manuale</span>
        </button>

        <div style={{ flex: 1 }}/>

        <VRule h={26}/>

        {/* Counter */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0, color: 'var(--cine-gold)' }}>
          <IconStack/>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--cine-cream)', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 0 rgba(0,0,0,0.6)' }}>
            {count}
            <span style={{ color: 'rgba(232,220,192,0.55)', fontWeight: 400, fontSize: 12 }}> {count === 1 ? 'volume' : 'volumi'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Provider config (stesso di AggiungiLibro) ────────────────────────────── */
const PROVIDERS = [
  { id: 'google_books', label: 'Google Books', short: 'G',  color: '#2a3a5a', light: 'rgba(42,58,90,0.12)'  },
  { id: 'open_library', label: 'Open Library', short: 'OL', color: '#3a5a2a', light: 'rgba(58,90,42,0.12)'  },
  { id: 'goodreads',    label: 'Goodreads',    short: 'GR', color: '#7b3f00', light: 'rgba(123,63,0,0.10)'  },
];

/* ─── LocalStorage per copertine file-upload ────────────────────────────────── */
const LS_COVERS = 'malachia-desiderata-covers';

function getLocalCover(id) {
  try { return JSON.parse(localStorage.getItem(LS_COVERS) || '{}')[id] || null; }
  catch { return null; }
}
function saveLocalCover(id, dataUrl) {
  try {
    const m = JSON.parse(localStorage.getItem(LS_COVERS) || '{}');
    if (dataUrl) m[id] = dataUrl; else delete m[id];
    localStorage.setItem(LS_COVERS, JSON.stringify(m));
  } catch {}
}
function deleteLocalCover(id) {
  try {
    const m = JSON.parse(localStorage.getItem(LS_COVERS) || '{}');
    delete m[id];
    localStorage.setItem(LS_COVERS, JSON.stringify(m));
  } catch {}
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function dedup(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.isbn13 || item.isbn10 || (item.title || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function authorsStr(book) {
  return (book.authors || [])
    .map(a => (typeof a === 'string' ? a : a.name))
    .filter(Boolean)
    .join(', ');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ════════════════════════════════════════════════════════════════════
   SOTTO-COMPONENTI
════════════════════════════════════════════════════════════════════ */

/* ─── Risultato ricerca ──────────────────────────────────────────── */
function SearchResultCard({ book, onSelect, busy }) {
  const [hov, setHov] = useState(false);
  const p       = PROVIDERS.find(p => p.id === book.source) || PROVIDERS[0];
  const authors = authorsStr(book);
  return (
    <div
      style={{ width: 130, cursor: busy ? 'wait' : 'pointer', position: 'relative', flexShrink: 0, opacity: busy ? 0.5 : 1 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => !busy && onSelect(book)}
    >
      <div style={{ position: 'relative' }}>
        <BookCover book={book} title={book.title} author={authors} w={130} h={190} />
        {hov && !busy && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(42,29,16,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'EB Garamond', serif", fontSize: 12,
            fontVariant: 'small-caps', letterSpacing: '0.12em', color: 'var(--m-gold-pale)',
            pointerEvents: 'none',
          }}>♡ aggiungi</div>
        )}
        <div style={{
          position: 'absolute', top: 5, right: 5, background: p.color, color: '#fff',
          fontSize: 8, fontVariant: 'small-caps', padding: '2px 5px', lineHeight: 1.4,
        }}>{p.short}</div>
      </div>
      <div style={{ marginTop: 7 }}>
        <div className="m-serif" style={{ fontSize: 11, lineHeight: 1.3, fontWeight: 600 }}>
          {(book.title || '').length > 38 ? book.title.slice(0, 38) + '…' : book.title}
        </div>
        <div className="m-marginalia" style={{ fontSize: 10, marginTop: 2 }}>
          {authors.length > 28 ? authors.slice(0, 28) + '…' : (authors || '—')}
        </div>
        {book.year && <div className="m-mono" style={{ fontSize: 10, color: 'var(--m-ink-muted)', marginTop: 2 }}>{book.year}</div>}
      </div>
    </div>
  );
}

/* ─── Modal aggiunta / modifica ──────────────────────────────────── */
function DesiderataModal({ heading, initial, onConfirm, onClose, saving }) {
  const [title,     setTitle]     = useState(initial?.title     || '');
  const [author,    setAuthor]    = useState(initial?.author    || '');
  const [publisher, setPublisher] = useState(initial?.publisher || '');
  const [year,      setYear]      = useState(String(initial?.year || ''));
  const [isbn13,    setIsbn13]    = useState(initial?.isbn13    || '');
  const [isbn10,    setIsbn10]    = useState(initial?.isbn10    || '');
  const [notes,     setNotes]     = useState(initial?.notes     || '');

  /* Copertina:
     - coverUrl  → campo testo (cover_url API)
     - preview   → data URL da file upload O copertura locale pre-esistente
     - isNewFile → true se preview viene da un nuovo file caricato in questa sessione
  */
  const [coverUrl,  setCoverUrl]  = useState(initial?.cover_url   || '');
  const [preview,   setPreview]   = useState(initial?._localCover || null);
  const [isNewFile, setIsNewFile] = useState(false);

  const displayCover = preview || coverUrl || null;

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const data = await readFileAsDataUrl(file);
    setPreview(data);
    setIsNewFile(true);
    setCoverUrl('');
  }

  function clearCover() {
    setCoverUrl('');
    setPreview(null);
    setIsNewFile(false);
  }

  function handleUrlChange(val) {
    setCoverUrl(val);
    if (val) { setPreview(null); setIsNewFile(false); }
  }

  return (
    <div className="m-overlay" onClick={onClose}>
      <div
        className="m-modal"
        style={{ width: 700, padding: '28px 32px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Intestazione */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div className="m-eyebrow">{heading}</div>
            <div className="m-serif" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>
              {title || 'Senza titolo'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--m-ink-muted)' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '155px 1fr', gap: 24 }}>
          {/* Colonna copertina */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <BookCover
              book={{ cover_url: displayCover }}
              title={title} author={author} w={155} h={220}
            />
            <div className="m-field">
              <label style={{ fontSize: 11 }}>URL copertina</label>
              <input
                className="m-input" style={{ padding: '4px 8px', fontSize: 12 }}
                value={coverUrl}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="m-field">
              <label style={{ fontSize: 11 }}>Carica file</label>
              <input type="file" accept="image/*" style={{ fontSize: 11 }} onChange={handleFile} />
            </div>
            {displayCover && (
              <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11 }} onClick={clearCover}>
                ✕ rimuovi copertina
              </button>
            )}
          </div>

          {/* Campi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="m-field">
              <label>Titolo *</label>
              <input className="m-input" style={{ padding: '6px 10px' }} value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="m-field">
              <label>Autore/i <span style={{ fontWeight: 400, opacity: 0.7 }}>(separati da virgola)</span></label>
              <input className="m-input" style={{ padding: '6px 10px' }} value={author} onChange={e => setAuthor(e.target.value)} placeholder="J.R.R. Tolkien, C.S. Lewis" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="m-field">
                <label>Editore</label>
                <input className="m-input" style={{ padding: '6px 10px' }} value={publisher} onChange={e => setPublisher(e.target.value)} />
              </div>
              <div className="m-field">
                <label>Anno</label>
                <input className="m-input" style={{ padding: '6px 10px' }} type="number" value={year} onChange={e => setYear(e.target.value)} />
              </div>
              <div className="m-field">
                <label>ISBN-13</label>
                <input className="m-input m-mono" style={{ padding: '6px 10px', fontSize: 13 }} value={isbn13} onChange={e => setIsbn13(e.target.value)} />
              </div>
              <div className="m-field">
                <label>ISBN-10</label>
                <input className="m-input m-mono" style={{ padding: '6px 10px', fontSize: 13 }} value={isbn10} onChange={e => setIsbn10(e.target.value)} />
              </div>
            </div>
            <div className="m-field">
              <label>Note personali</label>
              <textarea
                className="m-textarea" style={{ minHeight: 80 }}
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Perché lo voglio, dove l'ho visto, citato da…"
              />
            </div>
            <button
              className="m-btn m-btn-gold"
              style={{ marginTop: 4, justifyContent: 'center', fontSize: 15 }}
              disabled={saving || !title.trim()}
              onClick={() => onConfirm({
                title, author, publisher,
                year:  year  ? parseInt(year)  : null,
                isbn13: isbn13 || null,
                isbn10: isbn10 || null,
                notes:  notes  || null,
                coverUrl:  coverUrl || null,
                coverPreview: preview,
                isNewFile,
              })}
            >
              {saving ? 'Salvataggio…' : '✦ ' + (initial?.id ? 'salva modifiche' : 'aggiungi ai desiderata')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal conferma spostamento in biblioteca ────────────────────── */
function AcquireModal({ item, onConfirm, onClose, saving }) {
  const [status, setStatus] = useState('tbr');
  const coverUrl = getLocalCover(item.id) || item.cover_url;
  return (
    <div className="m-overlay" onClick={onClose}>
      <div className="m-modal" style={{ width: 440, padding: '28px 32px' }} onClick={e => e.stopPropagation()}>
        <div className="m-eyebrow" style={{ marginBottom: 8 }}>Sposta in biblioteca</div>
        <div className="m-serif" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.1, marginBottom: 18 }}>
          {item.title}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 18, marginBottom: 22 }}>
          <BookCover book={{ cover_url: coverUrl }} title={item.title} author={item.author} w={90} h={128} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
            {item.author    && <div className="m-marginalia">{item.author}</div>}
            {item.publisher && <div className="m-marginalia" style={{ color: 'var(--m-ink-muted)' }}>{item.publisher}</div>}
            {item.year      && <div className="m-mono" style={{ fontSize: 12 }}>{item.year}</div>}
            <div className="m-field" style={{ marginTop: 8 }}>
              <label>Stato iniziale</label>
              <select className="m-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="tbr">Da leggere</option>
                <option value="reading">In lettura</option>
                <option value="read">Letto</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="m-btn m-btn-ghost" onClick={onClose}>annulla</button>
          <button className="m-btn m-btn-gold" onClick={() => onConfirm(status)} disabled={saving}>
            {saving ? 'Aggiungendo…' : '✦ aggiungi alla biblioteca'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Card singolo volume desiderato ─────────────────────────────── */
function DesiderataCard({ item, onEdit, onRemove, onAcquire }) {
  const [hov, setHov] = useState(false);
  const coverUrl = getLocalCover(item.id) || item.cover_url;
  return (
    <div
      style={{ width: '100%' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Copertina con aspect-ratio fisso */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 3', overflow: 'hidden' }}>
        <BookCover
          book={{ cover_url: coverUrl }} title={item.title} author={item.author}
          w='100%' h='100%'
        />
        {/* Overlay azioni */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(18,12,6,0.88)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'stretch', justifyContent: 'center',
          gap: 8, padding: '16px 14px',
          opacity: hov ? 1 : 0, transition: 'opacity .18s ease',
          pointerEvents: hov ? 'auto' : 'none',
        }}>
          <button
            className="m-btn m-btn-gold"
            style={{ justifyContent: 'center', fontSize: 12, padding: '8px 10px' }}
            onClick={onAcquire}
          >→ in biblioteca</button>
          <button
            className="m-btn m-btn-ghost"
            style={{
              justifyContent: 'center', fontSize: 12, padding: '8px 10px',
              color: 'var(--m-parchment)', borderColor: 'rgba(244,234,214,0.28)',
            }}
            onClick={onEdit}
          >✎ modifica</button>
          <button
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'rgba(244,234,214,0.4)',
              fontFamily: "'EB Garamond', serif", lineHeight: 1,
              marginTop: 2, textAlign: 'center',
            }}
            onClick={onRemove}
          >rimuovi</button>
        </div>
      </div>

      {/* Testo sotto copertina */}
      <div style={{ paddingTop: 9 }}>
        <div className="m-serif" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
          {item.title.length > 36 ? item.title.slice(0, 36) + '…' : item.title}
        </div>
        {item.author && (
          <div className="m-marginalia" style={{ fontSize: 11, marginTop: 3, color: 'var(--m-ink-soft)' }}>
            {item.author.length > 26 ? item.author.slice(0, 26) + '…' : item.author}
          </div>
        )}
        {item.year && (
          <div className="m-mono" style={{ fontSize: 10, color: 'var(--m-ink-muted)', marginTop: 2 }}>
            {item.year}
          </div>
        )}
        {item.notes && (
          <div style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--m-terracotta)', marginTop: 4, lineHeight: 1.35 }}>
            {item.notes.length > 50 ? item.notes.slice(0, 50) + '…' : item.notes}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PAGINA PRINCIPALE
════════════════════════════════════════════════════════════════════ */
export default function Desiderata() {
  const navigate = useNavigate();
  const toast    = useToast();

  /* ── Stato ── */
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  /* Ricerca */
  const [isbn,   setIsbn]   = useState('');
  const [titolo, setTitolo] = useState('');
  const [autore, setAutore] = useState('');
  const [results,      setResults]      = useState([]);
  const [pStatus,      setPStatus]      = useState({ google_books: 'idle', open_library: 'idle', goodreads: 'idle' });
  const [pError,       setPError]       = useState({});
  const [activeFilter, setActiveFilter] = useState(null);

  /* Modali */
  const [addModal,     setAddModal]     = useState(null); // null | { heading, initial }
  const [editingId,    setEditingId]    = useState(null); // id elemento in modifica
  const [acquireItem,  setAcquireItem]  = useState(null); // null | wishlist item

  /* Salvataggio */
  const [saving, setSaving] = useState(false);

  /* ── Caricamento ── */
  useEffect(() => {
    wishlistApi.list()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ── Ricerca ── */
  const doSearch = useCallback(async () => {
    const hasIsbn  = isbn.trim().replace(/[-\s]/g, '').length >= 10;
    const hasQuery = titolo.trim() || autore.trim();
    if (!hasIsbn && !hasQuery) { toast('Inserisci almeno un campo di ricerca', 'error'); return; }

    setResults([]);
    setPStatus({ google_books: 'loading', open_library: 'loading', goodreads: 'loading' });
    setPError({});
    setActiveFilter(null);

    const q = [titolo.trim(), autore.trim()].filter(Boolean).join(' ');

    const fetchGoogle = async () => {
      try {
        const data  = await importApi.search(hasIsbn ? { isbn: isbn.trim(), providers: ['google_books'] } : { query: q, providers: ['google_books'] });
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
        const data  = await importApi.search(hasIsbn ? { isbn: isbn.trim(), providers: ['open_library'] } : { query: q, providers: ['open_library'] });
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
        const searchQ = [titolo.trim(), autore.trim(), isbn.trim()].filter(Boolean).join(' ');
        const data    = await importApi.goodreadsSearch(searchQ);
        const items   = (data.results || []).map(r => ({ ...r, source: 'goodreads' }));
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

    await Promise.all([fetchGoogle(), fetchOL(), fetchGR()]);
  }, [isbn, titolo, autore, toast]);

  /* ── Seleziona risultato ricerca ── */
  function handleSelectResult(book) {
    setAddModal({
      heading: 'Aggiungi ai desiderata',
      initial: {
        title:     book.title       || '',
        author:    authorsStr(book) || '',
        publisher: book.publisher   || '',
        year:      book.year        || '',
        isbn13:    book.isbn13      || '',
        isbn10:    book.isbn10      || '',
        cover_url: book.cover_url   || '',
        notes:     '',
      },
    });
    setEditingId(null);
  }

  /* ── Conferma aggiunta / modifica ── */
  async function handleModalConfirm({ title, author, publisher, year, isbn13, isbn10, notes, coverUrl, coverPreview, isNewFile }) {
    setSaving(true);
    try {
      const payload = {
        title,
        author:    author    || null,
        publisher: publisher || null,
        year:      year      || null,
        isbn13:    isbn13    || null,
        isbn10:    isbn10    || null,
        notes:     notes     || null,
        cover_url: coverUrl  || null,
      };

      if (editingId) {
        /* Modifica */
        const updated = await wishlistApi.update(editingId, payload);
        if (isNewFile && coverPreview) {
          saveLocalCover(editingId, coverPreview);
        } else if (!coverUrl && !coverPreview) {
          deleteLocalCover(editingId);
        }
        setItems(prev => prev.map(i => i.id === editingId ? { ...i, ...updated } : i));
        toast('Modifiche salvate', 'success');
      } else {
        /* Aggiunta */
        const created = await wishlistApi.create(payload);
        if (isNewFile && coverPreview) {
          saveLocalCover(created.id, coverPreview);
        }
        setItems(prev => [created, ...prev]);
        toast('Aggiunto ai desiderata', 'success');
      }

      setAddModal(null);
      setEditingId(null);
    } catch {
      toast('Errore nel salvataggio', 'error');
    }
    setSaving(false);
  }

  /* ── Rimozione ── */
  async function handleRemove(id) {
    try {
      await wishlistApi.delete(id);
      deleteLocalCover(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      toast('Errore nella rimozione', 'error');
    }
  }

  /* ── Spostamento in biblioteca ── */
  async function handleAcquire(item, status) {
    setSaving(true);
    try {
      const result    = await wishlistApi.acquire(item.id);
      const bd        = result.book_data || {};
      const localCover = getLocalCover(item.id);

      /* Risolvi autori */
      const authorList = (item.author || '').split(',').map(s => s.trim()).filter(Boolean);
      const authorsData = [];
      for (const name of authorList) {
        try {
          const found = await authorsApi.fuzzy(name);
          if (found?.[0]?.id) {
            authorsData.push({ author_id: found[0].id, role: 'author' });
          } else {
            const c = await authorsApi.create({ name });
            authorsData.push({ author_id: c.id, role: 'author' });
          }
        } catch {}
      }

      const book = await importApi.importBook({
        book_data: {
          title:     bd.title     || item.title,
          publisher: bd.publisher || item.publisher || null,
          year:      bd.year      || item.year      || null,
          isbn13:    bd.isbn13    || item.isbn13     || null,
          isbn10:    bd.isbn10    || item.isbn10     || null,
          cover_url: localCover  || bd.cover_url    || item.cover_url || null,
          synopsis:  bd.synopsis  || null,
        },
        authors_data: authorsData,
        status,
      });

      deleteLocalCover(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      setAcquireItem(null);
      toast('Aggiunto alla biblioteca!', 'success');
      navigate(`/libro/${book.id}`);
    } catch (e) {
      toast('Errore: ' + (e?.message || 'sconosciuto'), 'error');
    }
    setSaving(false);
  }

  /* ── Computed ── */
  const anyLoading  = Object.values(pStatus).some(s => s === 'loading');
  const anySearched = Object.values(pStatus).some(s => s !== 'idle');
  const visible     = activeFilter ? results.filter(r => r.source === activeFilter) : results;

  /* ── Render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Strip ── */}
      <DesiderataStrip
        count={items.length}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen(s => !s)}
        onManuale={() => { setAddModal({ heading: 'Aggiungi ai desiderata', initial: {} }); setEditingId(null); }}
      />

      {/* ── Pannello ricerca (collassabile) ── */}
      <div style={{ flexShrink: 0 }}>
        {searchOpen && (
          <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(216,180,106,0.25)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr auto', gap: 10, alignItems: 'flex-end', marginBottom: 12 }}>
              <div className="m-field">
                <label>ISBN</label>
                <input
                  className="m-input m-mono" style={{ padding: '8px 10px', fontSize: 14 }}
                  value={isbn} onChange={e => setIsbn(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doSearch()}
                  placeholder="9788845292422"
                />
              </div>
              <div className="m-field">
                <label>Titolo</label>
                <input
                  className="m-input" style={{ padding: '8px 10px' }}
                  value={titolo} onChange={e => setTitolo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doSearch()}
                  placeholder="Il nome della rosa"
                />
              </div>
              <div className="m-field">
                <label>Autore</label>
                <input
                  className="m-input" style={{ padding: '8px 10px' }}
                  value={autore} onChange={e => setAutore(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doSearch()}
                  placeholder="Umberto Eco"
                />
              </div>
              <button
                className="m-btn" style={{ padding: '9px 24px' }}
                onClick={doSearch} disabled={anyLoading}
              >
                {anyLoading ? '…' : 'cerca'}
              </button>
            </div>

            {/* Pills provider */}
            {anySearched && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="m-eyebrow" style={{ marginRight: 4 }}>Fonti:</span>
                {PROVIDERS.map(p => {
                  const st     = pStatus[p.id];
                  const errMsg = pError[p.id];
                  const isAct  = activeFilter === p.id;
                  return (
                    <button key={p.id}
                      onClick={() => st !== 'error' && setActiveFilter(isAct ? null : p.id)}
                      title={errMsg || undefined}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '3px 10px', cursor: st === 'error' ? 'help' : 'pointer',
                        border: `1px solid ${st === 'error' ? 'var(--m-vermilion)' : isAct ? p.color : 'var(--m-rule-strong)'}`,
                        background: st === 'error' ? 'rgba(168,58,38,0.06)' : isAct ? p.light : 'transparent',
                        fontFamily: "'EB Garamond', serif", fontSize: 13, fontVariant: 'small-caps',
                        color: st === 'error' ? 'var(--m-vermilion)' : 'var(--m-ink-soft)',
                        transition: 'all 120ms',
                      }}
                    >
                      {st === 'loading'
                        ? <span style={{ width: 7, height: 7, border: `2px solid ${p.color}`, borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.7s linear infinite' }}/>
                        : <span style={{ width: 7, height: 7, transform: 'rotate(45deg)', display: 'inline-block', background: st === 'error' ? 'var(--m-vermilion)' : typeof st === 'number' && st > 0 ? p.color : 'var(--m-rule-strong)' }}/>
                      }
                      {p.label}
                      {typeof st === 'number' && <span className="m-mono" style={{ fontSize: 11, color: 'var(--m-ink-muted)' }}>{st}</span>}
                      {st === 'error' && errMsg && <span style={{ fontSize: 11, fontVariant: 'normal' }}>⚠ {errMsg.slice(0, 30)}</span>}
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
          </div>
        )}

      </div>

      {/* ── Contenuto scrollabile ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 40px 48px' }}>

        {/* Risultati ricerca */}
        {searchOpen && visible.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div className="m-eyebrow" style={{ marginBottom: 14 }}>
              {visible.length} risultat{visible.length === 1 ? 'o' : 'i'} · clicca per aggiungere
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
              {visible.map((book, i) => (
                <SearchResultCard
                  key={`${book.source}-${book.isbn13 || book.goodreads_id || book.google_books_id || book.open_library_id || i}`}
                  book={book}
                  onSelect={handleSelectResult}
                  busy={false}
                />
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--m-rule)', margin: '24px 0 0' }}/>
          </div>
        )}

        {/* Lista desiderata */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="m-spinner"/>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, color: 'var(--m-rule-strong)' }}>♡</div>
            <div className="m-serif" style={{ fontSize: 26, fontStyle: 'italic', color: 'var(--m-ink-muted)', marginTop: 12 }}>
              Nessun libro nei desiderata.
            </div>
            <div className="m-marginalia" style={{ marginTop: 6 }}>
              Libri visti in libreria, citati, incontrati per caso.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <button className="m-btn m-btn-ghost" onClick={() => setSearchOpen(true)}>
                ⌕ cerca online
              </button>
              <button
                className="m-btn"
                onClick={() => { setAddModal({ heading: 'Aggiungi ai desiderata', initial: {} }); setEditingId(null); }}
              >
                + aggiungi manuale
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="m-eyebrow" style={{ marginBottom: 18 }}>
              {items.length} {items.length === 1 ? 'volume desiderato' : 'volumi desiderati'} · passa sopra per le azioni
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '36px 24px',
              justifyItems: 'center',
            }}>
              {items.map(item => (
                <DesiderataCard
                  key={item.id}
                  item={item}
                  onEdit={() => {
                    setEditingId(item.id);
                    setAddModal({
                      heading: 'Modifica desiderata',
                      initial: { ...item, _localCover: getLocalCover(item.id) },
                    });
                  }}
                  onRemove={() => handleRemove(item.id)}
                  onAcquire={() => setAcquireItem(item)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modal aggiunta / modifica ── */}
      {addModal && (
        <DesiderataModal
          heading={addModal.heading}
          initial={addModal.initial}
          onConfirm={handleModalConfirm}
          onClose={() => { setAddModal(null); setEditingId(null); }}
          saving={saving}
        />
      )}

      {/* ── Modal spostamento in biblioteca ── */}
      {acquireItem && (
        <AcquireModal
          item={acquireItem}
          onConfirm={(status) => handleAcquire(acquireItem, status)}
          onClose={() => setAcquireItem(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
