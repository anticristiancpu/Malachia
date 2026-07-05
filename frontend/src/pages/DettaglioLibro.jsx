import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import Stars from '../components/Stars.jsx';
import { books as booksApi, notes as notesApi, loans as loansApi, authors as authorsApi, prices as pricesApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';
import dayjs from 'dayjs';

const STATUS_LABELS = { tbr: 'Da leggere', reading: 'In lettura', read: 'Letto', abandoned: 'Abbandonato' };
const FORMAT_LABELS  = { hardcover: 'Cartonato', paperback: 'Brossura', ebook: 'Ebook', audiobook: 'Audiolibro', comics: 'Fumetto' };

const IT_MONTHS = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
function itDate(s) {
  if (!s) return null;
  const d = dayjs(s);
  return `${d.date()} ${IT_MONTHS[d.month()]} ${d.year()}`;
}

/* ── Piattaforme per la stima del valore ─────────────────────────────────── */
const PRICE_PLATFORMS = [
  {
    group: 'Mercato librario',
    items: [
      { label: 'viaLibri',   color: '#1a3a5c', url: (b) => `https://www.vialibri.net/searches?${b.isbn13 ? `all_text=${enc(b.isbn13)}` : `title=${enc(b.title)}&author=${enc(authorName(b))}`}&source=Malachia&currency=EUR&sort_by=price&sort_order=asc` },
      { label: 'AbeBooks',   color: '#c9000b', url: (b) => b.isbn13 ? `https://www.abebooks.it/servlet/SearchResults?isbn=${b.isbn13}&sortby=17` : `https://www.abebooks.it/servlet/SearchResults?an=${enc(authorName(b))}&tn=${enc(b.title)}&sortby=17` },
      { label: 'Bookfinder', color: '#3a5a2a', url: (b) => `https://www.bookfinder.com/search/?title=${enc(b.title)}&author=${enc(authorName(b))}${b.isbn13 ? `&isbn=${b.isbn13}` : ''}` },
      { label: 'Maremagnum', color: '#5a3a2a', url: (b) => `https://www.maremagnum.com/libri-antichi/ricerca?keywords=${enc(b.isbn13 || b.title)}` },
      { label: 'Bookfair',   color: '#2a4a5a', url: (b) => `https://www.bookfair.it/search?q=${enc(b.isbn13 || b.title + ' ' + authorName(b))}` },
    ]
  },
  {
    group: 'Marketplace',
    items: [
      { label: 'Amazon', color: '#ff9900', url: (b) => `https://www.amazon.it/s?k=${enc(b.isbn13 || (b.title + ' ' + authorName(b)))}` },
      { label: 'eBay',   color: '#e53238', url: (b) => `https://www.ebay.it/sch/i.html?_nkw=${enc(b.isbn13 || (b.title + ' ' + authorName(b)))}&_catid=267` },
      { label: 'Vinted', color: '#09b1ba', url: (b) => `https://www.vinted.it/catalog?search_text=${enc(b.title + ' ' + authorName(b))}` },
    ]
  },
];

function enc(s) { return encodeURIComponent(s || ''); }
function authorName(b) { return b.authors?.[0]?.name || b.author_names || ''; }

/* ── ValoreModal ─────────────────────────────────────────────────────────── */
const SOURCES = [
  { id: 'vialibri',  label: 'AbeBooks',  color: '#c9000b' },
  { id: 'libraccio', label: 'Libraccio', color: '#8b1a1a' },
];

function PriceResultCard({ result, onUse }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 148,
        border: `1px solid ${hov ? result.source_color : 'var(--m-rule)'}`,
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 150ms',
        background: hov ? `${result.source_color}08` : 'transparent',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ width: 148, height: 200, background: 'var(--m-parchment-2)', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {result.cover
          ? <img src={result.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: 'var(--m-parchment-2)' }} onError={e => { e.target.style.display = 'none'; }}/>
          : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, padding: 10 }}>
              <div style={{ fontSize: 28, opacity: 0.15 }}>◇</div>
              <div style={{ fontSize: 10, color: 'var(--m-ink-muted)', textAlign: 'center', lineHeight: 1.3, fontFamily: "'EB Garamond', serif" }}>
                {result.title.slice(0, 40)}
              </div>
            </div>
          )
        }
        <div style={{ position: 'absolute', bottom: 5, left: 5, background: result.source_color, color: '#fff', fontSize: 9, padding: '2px 6px', fontVariant: 'small-caps', letterSpacing: '0.06em' }}>
          {result.source_label}
        </div>
      </div>
      <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 22, fontFamily: "'EB Garamond', serif", color: 'var(--m-gold)', lineHeight: 1, fontWeight: 500 }}>
          € {result.price.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        {result.title && <div style={{ fontSize: 11, lineHeight: 1.3, fontFamily: "'EB Garamond', serif", color: 'var(--m-ink)', maxHeight: '2.6em', overflow: 'hidden' }}>{result.title}</div>}
        {result.author && <div style={{ fontSize: 10, color: 'var(--m-ink-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.author}</div>}
        {result.condition && <div style={{ fontSize: 9, color: 'var(--m-ink-muted)', fontStyle: 'italic', marginTop: 2 }}>{result.condition}</div>}
        <button
          className="m-btn m-btn-sm"
          style={{ marginTop: 'auto', paddingTop: 6, fontSize: 11, justifyContent: 'center', background: hov ? result.source_color : 'transparent', borderColor: hov ? result.source_color : 'var(--m-rule)', color: hov ? '#fff' : 'var(--m-ink)', transition: 'all 150ms' }}
          onClick={() => onUse(result.price)}
        >← usa prezzo</button>
      </div>
      {result.url && (
        <a href={result.url} target="_blank" rel="noopener noreferrer"
          style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', textDecoration: 'none', opacity: hov ? 1 : 0, transition: 'opacity 150ms' }}
          title="Apri pagina originale">↗</a>
      )}
    </div>
  );
}

function ValoreModal({ book, onSave, onClose }) {
  const [val,     setVal]     = useState(book.market_value ? String(book.market_value) : '');
  const [saving,  setSaving]  = useState(false);
  const [qAuthor,   setQAuthor]   = useState(authorName(book) || '');
  const [qTitle,    setQTitle]    = useState(book.title || '');
  const [qKeywords, setQKeywords] = useState(book.isbn13 || book.isbn10 || '');
  const [pStatus,   setPStatus]  = useState({ vialibri: 'idle', libraccio: 'idle' });
  const [pErrors,   setPErrors]  = useState({});
  const [results,   setResults]  = useState([]);
  const [searched,  setSearched] = useState(false);

  const anyLoading = Object.values(pStatus).some(s => s === 'loading');
  const hasQuery   = qAuthor.trim() || qTitle.trim() || qKeywords.trim();

  async function doSearch() {
    if (!hasQuery) return;
    setPStatus({ vialibri: 'loading', libraccio: 'loading' });
    setPErrors({}); setResults([]); setSearched(true);
    try {
      const data = await pricesApi.search({ author: qAuthor.trim() || undefined, title: qTitle.trim() || undefined, keywords: qKeywords.trim() || undefined });
      setResults(data.results || []);
      setPStatus({ vialibri: data.statuses?.vialibri ?? 'error', libraccio: data.statuses?.libraccio ?? 'error' });
      if (data.errors) setPErrors(data.errors);
    } catch (e) {
      setPStatus({ vialibri: 'error', libraccio: 'error' });
      setPErrors({ vialibri: e.message || 'Errore di rete', libraccio: e.message || 'Errore di rete' });
    }
  }

  async function handleSave(price) {
    const v = price !== undefined ? price : (val ? parseFloat(val) : null);
    setSaving(true);
    await onSave(v);
    setSaving(false);
    onClose();
  }

  const searchBook = { ...book, isbn13: qKeywords.trim() || book.isbn13, title: qTitle.trim() || book.title, authors: qAuthor.trim() ? [{ name: qAuthor.trim() }] : book.authors };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600 }} onClick={onClose}>
      <div style={{ background: 'var(--m-parchment)', border: '1px solid var(--m-rule)', width: 880, maxWidth: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 28px 14px', borderBottom: '1px solid var(--m-rule)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div className="m-eyebrow" style={{ marginBottom: 3 }}>Quotazione di mercato · AbeBooks · Libraccio</div>
              <div className="m-serif" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.2 }}>{book.title}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--m-ink-muted)', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="m-field" style={{ flex: '1 1 160px', margin: 0 }}>
              <label style={{ fontSize: 10 }}>Author</label>
              <input className="m-input" style={{ padding: '6px 10px', fontSize: 13 }} value={qAuthor} onChange={e => setQAuthor(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="es. Tolkien"/>
            </div>
            <div className="m-field" style={{ flex: '2 1 200px', margin: 0 }}>
              <label style={{ fontSize: 10 }}>Title</label>
              <input className="m-input" style={{ padding: '6px 10px', fontSize: 13 }} value={qTitle} onChange={e => setQTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="es. The Lord of the Rings"/>
            </div>
            <div className="m-field" style={{ flex: '1 1 160px', margin: 0 }}>
              <label style={{ fontSize: 10 }}>Keywords / ISBN</label>
              <input className="m-input" style={{ padding: '6px 10px', fontSize: 13 }} value={qKeywords} onChange={e => setQKeywords(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="9780261103573"/>
            </div>
            <button className="m-btn" style={{ flexShrink: 0, alignSelf: 'flex-end' }} onClick={doSearch} disabled={anyLoading || !hasQuery}>
              {anyLoading ? '…' : '⌕ cerca'}
            </button>
          </div>
          {searched && (
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {SOURCES.map(src => {
                const s = pStatus[src.id];
                const isLoading = s === 'loading', isError = s === 'error', isIdle = s === 'idle';
                const count = typeof s === 'number' ? s : null;
                return (
                  <div key={src.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 9, fontVariant: 'small-caps', letterSpacing: '0.07em', padding: '2px 7px', lineHeight: 1.5, background: isIdle || isLoading ? 'var(--m-rule)' : isError ? 'rgba(180,60,40,0.15)' : src.color, color: (isIdle || isLoading || isError) ? 'var(--m-ink-muted)' : '#fff', opacity: isLoading ? 0.5 : 1, transition: 'background 300ms' }}>{src.label}</div>
                    <span style={{ fontSize: 12, color: isError ? 'var(--m-terracotta)' : 'var(--m-ink-muted)', fontFamily: "'EB Garamond', serif" }} title={isError && pErrors[src.id] ? pErrors[src.id] : undefined}>
                      {isLoading ? '…' : isIdle ? '—' : isError ? (pErrors[src.id]?.slice(0, 80) || 'non raggiungibile') : `${count} risultat${count === 1 ? 'o' : 'i'}`}
                    </span>
                    {isError && !anyLoading && <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 10, padding: '1px 6px' }} onClick={doSearch}>riprova</button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {anyLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><div className="m-spinner"/></div>}
          {!anyLoading && results.length > 0 && (
            <>
              <div className="m-eyebrow" style={{ marginBottom: 14 }}>{results.length} offert{results.length === 1 ? 'a' : 'e'} trovate · ordinate per prezzo crescente</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {results.map((r, i) => <PriceResultCard key={`${r.source}-${i}`} result={r} onUse={price => handleSave(price)}/>)}
              </div>
            </>
          )}
          {!anyLoading && searched && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0 20px', color: 'var(--m-ink-muted)', fontStyle: 'italic', fontFamily: "'EB Garamond', serif", fontSize: 14 }}>
              Nessuna quotazione trovata. Prova a modificare i termini di ricerca o usa i link diretti qui sotto.
            </div>
          )}
          {!searched && (
            <div style={{ textAlign: 'center', padding: '24px 0 8px', color: 'var(--m-ink-muted)', fontFamily: "'EB Garamond', serif", fontSize: 14 }}>
              Modifica i campi se necessario, poi clicca <strong>⌕ cerca</strong> per trovare le quotazioni.
            </div>
          )}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--m-rule)' }}>
            <div className="m-eyebrow" style={{ marginBottom: 10 }}>Apri direttamente su</div>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {PRICE_PLATFORMS.map(group => (
                <div key={group.group}>
                  <div style={{ fontSize: 10, color: 'var(--m-ink-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{group.group}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {group.items.map(p => (
                      <a key={p.label} href={p.url(searchBook)} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12, fontFamily: "'EB Garamond', serif", border: '1px solid var(--m-rule)', color: 'var(--m-ink)', textDecoration: 'none', transition: 'border-color 150ms, background 150ms' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.background = `${p.color}12`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--m-rule)'; e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0 }}/>
                        {p.label} ↗
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 28px', borderTop: '1px solid var(--m-rule)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--m-parchment-2)' }}>
          <span style={{ fontSize: 13, color: 'var(--m-ink-muted)', fontFamily: "'EB Garamond', serif", flexShrink: 0 }}>Inserisci manualmente:</span>
          <span style={{ fontSize: 15, color: 'var(--m-ink-muted)' }}>€</span>
          <input className="m-input" type="number" min="0" step="0.01" style={{ padding: '5px 10px', fontSize: 16, fontFamily: "'EB Garamond', serif", width: 120 }} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="0,00"/>
          <button className="m-btn" onClick={() => handleSave()} disabled={saving || !val}>{saving ? '…' : '✦ salva'}</button>
          {val && <button className="m-btn m-btn-ghost" style={{ fontSize: 11 }} onClick={() => setVal('')}>azzera</button>}
          <button className="m-btn m-btn-ghost" onClick={onClose} style={{ marginLeft: 'auto' }}>chiudi</button>
        </div>
      </div>
    </div>
  );
}

/* ── IconBtn ─────────────────────────────────────────────────────────────── */
function IconBtn({ label, icon, primary, onClick, active, danger }) {
  const [hov, setHov] = useState(false);

  if (primary) {
    return (
      <button
        title={label} aria-label={label}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          height: 34, padding: '0 14px',
          background: hov ? 'rgba(216,180,106,0.22)' : 'rgba(216,180,106,0.12)',
          border: '1px solid rgba(216,180,106,0.5)',
          color: 'var(--cine-gold)',
          cursor: 'pointer',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          fontFamily: "'Cinzel', serif",
          textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 11, fontWeight: 500,
          transition: 'background 150ms',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={onClick}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      title={label} aria-label={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, padding: 0,
        background: danger && (active || hov) ? 'rgba(192,83,59,0.2)'
          : active ? 'rgba(216,180,106,0.15)'
          : hov   ? 'rgba(255,255,255,0.06)'
          : 'rgba(0,0,0,0.35)',
        border: `1px solid ${
          danger && (active || hov) ? 'rgba(192,83,59,0.55)' :
          active ? 'rgba(216,180,106,0.45)' :
          hov    ? 'rgba(216,180,106,0.35)' :
          'rgba(216,180,106,0.28)'
        }`,
        color: danger && (active || hov) ? 'var(--cine-vermilion)'
          : active ? 'var(--cine-gold)'
          : 'rgba(232,220,192,0.82)',
        cursor: 'pointer',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        transition: 'all 150ms',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGINA PRINCIPALE
══════════════════════════════════════════════════════════════════════════ */
export default function DettaglioLibro() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const toast        = useToast();
  const statusDropRef = useRef(null);

  const backFrom  = location.state?.from;
  const backLabel = backFrom === 'libreria' ? 'Libreria'
    : backFrom === 'cerca'    ? 'Ricerca'
    : backFrom === 'autori'   ? 'Autori'
    : backFrom === 'scaffale' ? 'Scaffale'
    : null;

  const [book,            setBook]            = useState(null);
  const [tab,             setTab]             = useState('sinossi');
  const [loading,         setLoading]         = useState(true);
  const [editMode,        setEditMode]        = useState(false);
  const [editData,        setEditData]        = useState({});
  const [showValoreModal, setShowValoreModal] = useState(false);
  const [valueHov,        setValueHov]        = useState(false);
  const [confirmDelete,   setConfirmDelete]   = useState(false);
  const [deleting,        setDeleting]        = useState(false);
  const [showStatusDrop,  setShowStatusDrop]  = useState(false);
  const [newNote,  setNewNote]  = useState({ quote: '', gloss: '', page: '', tags: '' });
  const [newLoan,  setNewLoan]  = useState({ borrower_name: '', loan_date: dayjs().format('YYYY-MM-DD'), expected_return: '' });

  /* Close status dropdown on outside click */
  useEffect(() => {
    if (!showStatusDrop) return;
    function handler(e) {
      if (statusDropRef.current && !statusDropRef.current.contains(e.target)) {
        setShowStatusDrop(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStatusDrop]);

  useEffect(() => {
    booksApi.get(id).then(b => {
      setBook(b);
      setEditData({ ...b, authors_str: (b.authors || []).map(a => a.name).join(', ') });
      setLoading(false);
    }).catch(() => navigate('/libreria'));
  }, [id]);

  async function saveEdit() {
    let saved = false;
    try {
      const { authors_str, author_name_temp, authors: _authors, ...bookFields } = editData;
      const namesStr = authors_str ?? author_name_temp ?? '';
      const names    = namesStr.split(',').map(s => s.trim()).filter(Boolean);
      const authorsPayload = [];
      for (const name of names) {
        const found = await authorsApi.fuzzy(name);
        if (found?.[0]?.id) {
          authorsPayload.push({ author_id: found[0].id, role: 'author' });
        } else {
          const created = await authorsApi.create({ name });
          authorsPayload.push({ author_id: created.id, role: 'author' });
        }
      }
      await booksApi.update(id, { ...bookFields, ...(authorsPayload.length > 0 ? { authors: authorsPayload } : {}) });
      saved = true;
    } catch (e) {
      toast('Errore nel salvataggio: ' + e.message, 'error');
    }
    try {
      const fresh = await booksApi.get(id);
      setBook(fresh);
      setEditData({ ...fresh, authors_str: (fresh.authors || []).map(a => a.name).join(', ') });
    } catch {}
    if (saved) {
      toast('Libro aggiornato', 'success');
      window.dispatchEvent(new CustomEvent('malachia:stats-changed'));
    }
    setEditMode(false);
  }

  async function deleteBook() {
    setDeleting(true);
    try {
      await booksApi.delete(id);
      toast(`"${book.title}" eliminato`, 'success');
      navigate('/libreria');
    } catch {
      toast('Errore durante l\'eliminazione', 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function saveMarketValue(value) {
    try {
      const updated = await booksApi.update(id, { market_value: value });
      setBook(updated);
      toast('Valore aggiornato', 'success');
      window.dispatchEvent(new CustomEvent('malachia:stats-changed'));
    } catch { toast('Errore', 'error'); }
  }

  async function addNote() {
    if (!newNote.quote && !newNote.gloss) return;
    try {
      const note = await notesApi.create({
        book_id: id, page: newNote.page || null,
        quote: newNote.quote, gloss: newNote.gloss,
        tags: newNote.tags ? newNote.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      setBook(b => ({ ...b, notes: [note, ...(b.notes || [])] }));
      setNewNote({ quote: '', gloss: '', page: '', tags: '' });
      toast('Nota aggiunta', 'success');
    } catch { toast('Errore', 'error'); }
  }

  async function addLoan() {
    if (!newLoan.borrower_name) return;
    try {
      const loan = await loansApi.create({ book_id: id, ...newLoan });
      setBook(b => ({ ...b, loans: [loan, ...(b.loans || [])] }));
      toast(`Prestito a ${newLoan.borrower_name} registrato`, 'success');
    } catch { toast('Errore', 'error'); }
  }

  async function returnLoan(loanId) {
    await loansApi.return(loanId);
    const updated = await booksApi.get(id);
    setBook(updated);
    toast('Restituzione registrata', 'success');
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div className="m-spinner"/>
    </div>
  );
  if (!book) return null;

  const authorLine     = book.authors?.map(a => a.name).join(', ') || book.author_names || '';
  const readingHistory = book.reading_history || [];
  const firstFragment  = (book.notes || []).find(n => n.quote?.trim());
  const genrePart      = book.genre_name || book.genre || null;
  const eyebrowText    = [STATUS_LABELS[book.status], genrePart].filter(Boolean).join(' · ');

  /* Meta strip items */
  const metaItems = [
    { k: 'Stato',    v: STATUS_LABELS[book.status], gold: true },
    book.authors?.length > 0 ? { k: 'Autore',   v: book.authors.map(a => a.name).join(', ') } : null,
    book.year       ? { k: 'Anno',      v: String(book.year) } : null,
    book.publisher  ? { k: 'Editore',   v: book.publisher }    : null,
    book.pages      ? { k: 'Pagine',    v: String(book.pages) } : null,
    book.language   ? { k: 'Lingua',    v: book.language }      : null,
    book.isbn13     ? { k: 'ISBN',      v: book.isbn13 }        : null,
    book.format     ? { k: 'Formato',   v: FORMAT_LABELS[book.format] || book.format } : null,
    book.location_bookcase ? { k: 'Posizione', v: [book.location_room, book.location_bookcase, book.location_shelf && `rip. ${book.location_shelf}`].filter(Boolean).join(' · ') } : null,
    book.inventory_number  ? { k: 'N° Inv.',   v: book.inventory_number } : null,
    book.signed            ? { k: 'Esemplare', v: '✦ Autografato' }       : null,
    (book.volumes_count > 1) ? { k: 'Volumi', v: `${book.volumes_count} tomi` }          : null,
    (book.copies_owned  > 1) ? { k: 'Copie',  v: `${book.copies_owned} esemplari` }      : null,
    book.tags?.length > 0    ? { k: 'Tag',     v: book.tags.join(', ') }                  : null,
  ].filter(Boolean);

  /* ── Shared inline style helpers ── */
  const S = {
    cinzelLabel: { fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 9, color: 'rgba(232,220,192,0.5)', fontWeight: 500 },
    cinzelMicro: { fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 9, color: 'rgba(232,220,192,0.5)', fontWeight: 500 },
    bodyText:    { fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 17, lineHeight: 1.7, color: 'rgba(232,220,192,0.95)', textShadow: 'var(--cine-text-shadow)', margin: 0 },
    rule:        { borderTop: '1px solid rgba(216,180,106,0.18)' },
    inputCine:   { width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(216,180,106,0.2)', color: 'var(--cine-cream)', fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 14, boxSizing: 'border-box' },
    btnCine:     { padding: '6px 16px', background: 'rgba(216,180,106,0.12)', border: '1px solid rgba(216,180,106,0.4)', color: 'var(--cine-gold)', cursor: 'pointer', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 10, fontWeight: 500 },
    btnGhost:    { padding: '4px 12px', background: 'transparent', border: '1px solid rgba(216,180,106,0.28)', color: 'rgba(232,220,192,0.6)', cursor: 'pointer', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 9 },
  };

  return (
    <div style={{ padding: '24px 64px 24px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>

      {/* ── Back link ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 8, flexShrink: 0 }}>
        <button
          onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/libreria'); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 11, color: 'rgba(232,220,192,0.55)', transition: 'color 120ms' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--cine-cream)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,220,192,0.55)'}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2 L3 6 L8 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {backLabel ?? 'Indietro'}
        </button>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, flex: 1, minHeight: 0 }}>

        {/* ════════════ LEFT COLUMN ════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0 }}>

          {/* Cover + shadow stack */}
          <div style={{
            width: 380, height: 540, flexShrink: 0, position: 'relative', overflow: 'hidden',
            boxShadow:
              'inset 0 0 0 1px rgba(0,0,0,0.35), ' +
              'inset 12px 0 0 rgba(0,0,0,0.18), ' +
              '0 18px 60px rgba(0,0,0,0.85), ' +
              '0 0 0 1px rgba(216,180,106,0.12), ' +
              '0 0 80px rgba(216,180,106,0.06)',
          }}>
            <BookCover book={book} w={380} h={540}/>
          </div>

          {/* Remove cover — tiny ghost link */}
          {(book.cover_local || book.cover_url) && (
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginTop: 8, fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 9, color: 'rgba(232,220,192,0.28)', transition: 'color 120ms' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--cine-vermilion)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,220,192,0.28)'}
              onClick={async () => {
                try {
                  await booksApi.update(id, { cover_local: null, cover_url: null });
                  setBook(b => ({ ...b, cover_local: null, cover_url: null }));
                  toast('Copertina rimossa', 'success');
                  window.dispatchEvent(new CustomEvent('malachia:stats-changed'));
                } catch { toast('Errore nella rimozione', 'error'); }
              }}
            >
              × rimuovi copertina
            </button>
          )}

          {/* ── Valore stimato ── */}
          <div
            onClick={() => setShowValoreModal(true)}
            onMouseEnter={() => setValueHov(true)}
            onMouseLeave={() => setValueHov(false)}
            style={{ marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: 5 }}
          >
            {book.market_value != null ? (
              <>
                <div style={{
                  fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
                  letterSpacing: '0.22em', fontSize: 9, fontWeight: 500,
                  color: 'rgba(232,220,192,0.5)',
                }}>Valore stimato</div>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 600,
                  letterSpacing: '0.04em', lineHeight: 1,
                  color: valueHov ? 'var(--cine-cream)' : 'var(--cine-gold)',
                  textShadow: valueHov
                    ? '0 0 28px rgba(216,180,106,0.55), 0 2px 4px rgba(0,0,0,0.8)'
                    : '0 0 18px rgba(216,180,106,0.28), 0 2px 4px rgba(0,0,0,0.8)',
                  transition: 'color 150ms, text-shadow 150ms',
                }}>
                  € {parseFloat(book.market_value).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </>
            ) : (
              <div style={{
                fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
                letterSpacing: '0.18em', fontSize: 10, fontWeight: 500,
                color: valueHov ? 'rgba(216,180,106,0.75)' : 'rgba(216,180,106,0.42)',
                border: `1px dashed ${valueHov ? 'rgba(216,180,106,0.45)' : 'rgba(216,180,106,0.22)'}`,
                padding: '5px 16px',
                transition: 'color 150ms, border-color 150ms',
              }}>
                + stima valore
              </div>
            )}
          </div>

          {/* ── Toolbar 6 bottoni ── */}
          <div style={{ display: 'flex', gap: 8, marginTop: 18, alignItems: 'center' }}>

            {/* 1 — Nota (primary) */}
            <IconBtn primary label="Nota" onClick={() => setTab('frammenti')} icon={
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 2 L6.5 11 M2 6.5 L11 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            }/>

            {/* 2 — Cambia stato */}
            <div ref={statusDropRef} style={{ position: 'relative' }}>
              <IconBtn label={`Stato: ${STATUS_LABELS[book.status]}`} onClick={() => setShowStatusDrop(s => !s)} icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7 L11 7 M3 4 L9 4 M3 10 L11 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              }/>
              {showStatusDrop && (
                <div style={{ position: 'absolute', top: 38, left: '50%', transform: 'translateX(-50%)', background: 'rgba(10,7,4,0.97)', border: '1px solid rgba(216,180,106,0.28)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 300, minWidth: 160, padding: '4px 0' }}>
                  {[['tbr','Da leggere'],['reading','In lettura'],['read','Letto'],['abandoned','Abbandonato']].map(([val, lbl]) => (
                    <button key={val}
                      style={{ display: 'block', width: '100%', padding: '8px 16px', textAlign: 'left', background: val === book.status ? 'rgba(216,180,106,0.12)' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 10, fontWeight: 500, color: val === book.status ? 'var(--cine-gold)' : 'rgba(232,220,192,0.82)', transition: 'background 100ms' }}
                      onMouseEnter={e => { if (val !== book.status) e.currentTarget.style.background = 'rgba(216,180,106,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = val === book.status ? 'rgba(216,180,106,0.12)' : 'transparent'; }}
                      onClick={() => {
                        booksApi.update(id, { status: val }).then(b => { setBook(b); window.dispatchEvent(new CustomEvent('malachia:stats-changed')); });
                        setShowStatusDrop(false);
                      }}
                    >{lbl}</button>
                  ))}
                </div>
              )}
            </div>

            {/* 3 — Preferiti */}
            <IconBtn
              label={book.favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              active={!!book.favorite}
              onClick={() => booksApi.update(id, { favorite: !book.favorite }).then(b => setBook(b))}
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 12 C 2 8.5 1 5.5 3 4 C 5 2.5 6.5 4 7 5.5 C 7.5 4 9 2.5 11 4 C 13 5.5 12 8.5 7 12 Z"
                    stroke="currentColor" strokeWidth="1.2" fill={book.favorite ? 'currentColor' : 'none'} strokeLinejoin="round"/>
                </svg>
              }
            />

            {/* 4 — Modifica */}
            <IconBtn label="Modifica" onClick={() => setEditMode(true)} icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 11 L2 12 L3 12 L11 4 L10 3 Z M9 4 L10 5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
              </svg>
            }/>

            {/* 5 — Stima valore */}
            <IconBtn label="Stima valore" onClick={() => setShowValoreModal(true)} icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10 4 Q7.5 2.8 5.5 5 Q3.5 7 5.5 9 Q7.5 11 10 9.8 M4 7 L9 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              </svg>
            }/>

            {/* 6 — Elimina */}
            <IconBtn label="Elimina" danger active={confirmDelete} onClick={() => setConfirmDelete(c => !c)} icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            }/>
          </div>

          {/* ── Meta strip ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 22px', marginTop: 22, maxWidth: 480 }}>
            {metaItems.map(item => (
              <div key={item.k} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 9, color: 'rgba(232,220,192,0.5)', fontWeight: 500 }}>
                  {item.k}
                </span>
                <span style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 13, color: item.gold ? 'var(--cine-gold)' : 'var(--cine-cream)', textShadow: 'var(--cine-text-shadow)' }}>
                  {item.v}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════ RIGHT COLUMN ════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Eyebrow */}
          <div style={{ fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.32em', fontSize: 11, color: 'var(--cine-gold)', fontWeight: 500, marginBottom: 10, flexShrink: 0 }}>
            {eyebrowText}
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 46, fontWeight: 400, lineHeight: 1.05, letterSpacing: '0.04em', color: 'var(--cine-cream)', textTransform: 'uppercase', margin: '0 0 0', maxWidth: 560, textShadow: 'var(--cine-display-shadow)', flexShrink: 0 }}>
            {book.title}
          </h1>

          {/* Subtitle */}
          {book.subtitle && (
            <div style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontStyle: 'italic', fontSize: 22, color: 'var(--cine-vermilion)', lineHeight: 1.2, marginTop: 8, textShadow: 'var(--cine-text-shadow)', flexShrink: 0 }}>
              {book.subtitle}
            </div>
          )}

          {/* Author */}
          <div style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontStyle: 'italic', fontSize: 18, color: 'rgba(232,220,192,0.88)', textShadow: 'var(--cine-text-shadow)', marginTop: book.subtitle ? 8 : 14, marginBottom: 24, flexShrink: 0 }}>
            {book.authors?.length > 0 ? (
              <>di {book.authors.map((a, i) => (
                <React.Fragment key={a.id}>
                  {i > 0 && ', '}
                  <span
                    style={{ cursor: 'pointer', borderBottom: '1px solid rgba(232,220,192,0.2)', paddingBottom: 1, transition: 'border-color 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(216,180,106,0.6)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(232,220,192,0.2)'}
                    onClick={() => navigate(`/autori/${a.id}`)}
                  >{a.name}</span>
                </React.Fragment>
              ))}</>
            ) : authorLine ? `di ${authorLine}` : null}
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(216,180,106,0.18)', marginBottom: 20, flexShrink: 0 }}>
            {[
              { id: 'sinossi',   label: 'Sinossi'   },
              { id: 'frammenti', label: 'Frammenti' },
              { id: 'prestiti',  label: 'Prestiti'  },
              { id: 'storico',   label: 'Storico'   },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 0', marginRight: 32,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
                  letterSpacing: '0.18em', fontSize: 12,
                  color: tab === t.id ? 'var(--cine-cream)' : 'rgba(232,220,192,0.55)',
                  fontWeight: tab === t.id ? 600 : 500,
                  borderBottom: tab === t.id ? '2px solid var(--cine-vermilion)' : '2px solid transparent',
                  marginBottom: -1,
                  textShadow: 'var(--cine-text-shadow)',
                  transition: 'color 150ms',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Scrollable content ── */}
          <div style={{
            flex: 1, overflowY: 'auto', paddingRight: 18,
            maskImage: 'linear-gradient(180deg, transparent 0%, black 24px, black calc(100% - 36px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 24px, black calc(100% - 36px), transparent 100%)',
          }}>

            {/* ─── TAB: Sinossi ─── */}
            {tab === 'sinossi' && (
              <div style={{ paddingTop: 8 }}>
                {book.synopsis ? (
                  <>
                    <p style={{ ...S.bodyText, marginBottom: 24 }}>{book.synopsis}</p>

                    {/* Pull-quote: primo frammento salvato */}
                    {firstFragment && (
                      <div style={{ borderLeft: '2px solid var(--cine-gold-dim)', paddingLeft: 22, margin: '28px 0 32px', maxWidth: 620 }}>
                        <div style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontStyle: 'italic', fontSize: 20, lineHeight: 1.6, color: 'rgba(232,220,192,0.95)', textShadow: 'var(--cine-text-shadow)' }}>
                          "{firstFragment.quote}"
                        </div>
                        {firstFragment.page && (
                          <div style={{ fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 10, color: 'rgba(232,220,192,0.55)', fontWeight: 500, marginTop: 12 }}>
                            p. {firstFragment.page}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Note personali */}
                    {book.personal_notes && (
                      <div style={{ borderLeft: '2px solid rgba(216,180,106,0.35)', paddingLeft: 18, margin: '0 0 28px', maxWidth: 640 }}>
                        <div style={{ ...S.cinzelLabel, marginBottom: 8 }}>Note personali</div>
                        <p style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 16, lineHeight: 1.65, color: 'rgba(232,220,192,0.88)', textShadow: 'var(--cine-text-shadow)', margin: 0 }}>
                          {book.personal_notes}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 16, fontStyle: 'italic', color: 'rgba(232,220,192,0.38)', textAlign: 'center', paddingTop: 24 }}>
                    Sinossi non disponibile —{' '}
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(216,180,106,0.6)', fontFamily: "'Cinzel', serif", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', padding: 0 }} onClick={() => setEditMode(true)}>
                      aggiungi
                    </button>
                  </div>
                )}

                {/* Serie */}
                {book.series_name && (
                  <div style={{ margin: '20px 0 24px', paddingTop: 18, ...S.rule }}>
                    <div style={{ ...S.cinzelLabel, marginBottom: 6 }}>Serie</div>
                    <div style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 18, color: 'var(--cine-cream)', textShadow: 'var(--cine-text-shadow)' }}>
                      {book.series_name}
                      {book.series_volume && <em style={{ color: 'var(--cine-gold-dim)', fontStyle: 'italic' }}> — vol. {book.series_volume}</em>}
                    </div>
                  </div>
                )}

                {/* Fonti esterne */}
                {(book.goodreads_id || book.google_books_id) && (
                  <div style={{ marginTop: 20, paddingTop: 18, ...S.rule }}>
                    <div style={{ ...S.cinzelLabel, marginBottom: 10 }}>Fonti esterne</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {book.goodreads_id && (
                        <a href={`https://www.goodreads.com/book/show/${book.goodreads_id}`} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', border: '1px solid rgba(216,180,106,0.28)', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 10, color: 'rgba(232,220,192,0.6)', textDecoration: 'none', transition: 'color 120ms, border-color 120ms' }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--cine-gold)'; e.currentTarget.style.borderColor = 'rgba(216,180,106,0.5)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(232,220,192,0.6)'; e.currentTarget.style.borderColor = 'rgba(216,180,106,0.28)'; }}
                        >Goodreads ↗</a>
                      )}
                      {book.google_books_id && (
                        <a href={`https://books.google.com/books?id=${book.google_books_id}`} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', border: '1px solid rgba(216,180,106,0.28)', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 10, color: 'rgba(232,220,192,0.6)', textDecoration: 'none', transition: 'color 120ms, border-color 120ms' }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--cine-gold)'; e.currentTarget.style.borderColor = 'rgba(216,180,106,0.5)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(232,220,192,0.6)'; e.currentTarget.style.borderColor = 'rgba(216,180,106,0.28)'; }}
                        >Google Books ↗</a>
                      )}
                    </div>
                  </div>
                )}

                {/* Micro-meta footer */}
                {(book.created_at || book.location_bookcase || book.tags?.length > 0 || book.market_value != null) && (
                  <div style={{ display: 'flex', gap: 34, marginTop: 40, paddingTop: 18, ...S.rule, flexWrap: 'wrap' }}>
                    {book.created_at && (
                      <div>
                        <div style={{ fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 10, color: 'rgba(232,220,192,0.55)', fontWeight: 500 }}>Aggiunto</div>
                        <div style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 13, color: 'var(--cine-cream)', marginTop: 4, textShadow: 'var(--cine-text-shadow)' }}>
                          {itDate(book.created_at)}
                        </div>
                      </div>
                    )}
                    {book.location_bookcase && (
                      <div>
                        <div style={{ fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 10, color: 'rgba(232,220,192,0.55)', fontWeight: 500 }}>Collocazione</div>
                        <div style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 13, color: 'var(--cine-cream)', marginTop: 4, textShadow: 'var(--cine-text-shadow)' }}>
                          {[book.location_room, book.location_bookcase, book.location_shelf && `rip. ${book.location_shelf}`].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    )}
                    {book.tags?.length > 0 && (
                      <div>
                        <div style={{ fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 10, color: 'rgba(232,220,192,0.55)', fontWeight: 500 }}>Tag</div>
                        <div style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 13, color: 'var(--cine-cream)', marginTop: 4, fontStyle: 'italic', textShadow: 'var(--cine-text-shadow)' }}>
                          {book.tags.join(' · ')}
                        </div>
                      </div>
                    )}
                    {book.market_value != null && (
                      <div>
                        <div style={{ fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 10, color: 'rgba(232,220,192,0.55)', fontWeight: 500 }}>Valore stimato</div>
                        <div style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 13, color: 'var(--cine-gold)', marginTop: 4, textShadow: 'var(--cine-text-shadow)' }}>
                          € {parseFloat(book.market_value).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: Frammenti ─── */}
            {tab === 'frammenti' && (
              <div style={{ paddingTop: 8 }}>
                {/* Form nuova nota */}
                <div style={{ padding: '16px', border: '1px solid rgba(216,180,106,0.28)', marginBottom: 24 }}>
                  <div style={{ ...S.cinzelLabel, marginBottom: 12 }}>Nuova citazione / nota</div>
                  <textarea
                    style={{ ...S.inputCine, minHeight: 80, resize: 'vertical', display: 'block', marginBottom: 8 }}
                    placeholder="Citazione dal testo…"
                    value={newNote.quote}
                    onChange={e => setNewNote(n => ({ ...n, quote: e.target.value }))}
                  />
                  <textarea
                    style={{ ...S.inputCine, minHeight: 60, resize: 'vertical', display: 'block', marginBottom: 8 }}
                    placeholder="Glossa — riflessione personale…"
                    value={newNote.gloss}
                    onChange={e => setNewNote(n => ({ ...n, gloss: e.target.value }))}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input style={{ ...S.inputCine, width: 100 }} type="number" placeholder="Pagina" value={newNote.page} onChange={e => setNewNote(n => ({ ...n, page: e.target.value }))}/>
                    <input style={{ ...S.inputCine, flex: 1 }} placeholder="tag1, tag2, …" value={newNote.tags} onChange={e => setNewNote(n => ({ ...n, tags: e.target.value }))}/>
                    <button style={S.btnCine} onClick={addNote}>Salva</button>
                  </div>
                </div>

                {(book.notes || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(232,220,192,0.35)' }}>
                    Nessun frammento annotato.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                    {(book.notes || []).map(n => (
                      <div key={n.id} style={{ borderLeft: '2px solid var(--cine-gold-dim)', paddingLeft: 18 }}>
                        {n.page && (
                          <div style={{ ...S.cinzelMicro, marginBottom: 8 }}>p. {n.page}</div>
                        )}
                        {n.quote && (
                          <blockquote style={{ margin: 0 }}>
                            <p style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 18, fontStyle: 'italic', lineHeight: 1.55, color: 'rgba(232,220,192,0.95)', textShadow: 'var(--cine-text-shadow)', margin: 0 }}>
                              "{n.quote}"
                            </p>
                          </blockquote>
                        )}
                        {n.gloss && (
                          <p style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 14, lineHeight: 1.6, color: 'rgba(232,220,192,0.68)', marginTop: n.quote ? 10 : 0, marginBottom: 0 }}>
                            {n.gloss}
                          </p>
                        )}
                        {n.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                            {n.tags.map(t => (
                              <span key={t} style={{ padding: '2px 8px', border: '1px solid rgba(216,180,106,0.25)', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 9, color: 'rgba(232,220,192,0.55)' }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: Prestiti ─── */}
            {tab === 'prestiti' && (
              <div style={{ paddingTop: 8 }}>
                <div style={{ padding: '16px', border: '1px solid rgba(216,180,106,0.28)', marginBottom: 20 }}>
                  <div style={{ ...S.cinzelLabel, marginBottom: 12 }}>Registra prestito</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                    {[['Nome','text','borrower_name','Chi lo prende?'],['Data prestito','date','loan_date',null],['Restituzione prevista','date','expected_return',null]].map(([lbl, type, key, ph]) => (
                      <div key={key}>
                        <div style={{ ...S.cinzelMicro, marginBottom: 5 }}>{lbl}</div>
                        <input className="m-input" type={type} value={newLoan[key]} placeholder={ph || ''} onChange={e => setNewLoan(n => ({ ...n, [key]: e.target.value }))}/>
                      </div>
                    ))}
                  </div>
                  <button style={S.btnCine} onClick={addLoan}>Registra</button>
                </div>

                {(book.loans || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(232,220,192,0.35)' }}>
                    Nessun prestito registrato.
                  </div>
                ) : (
                  (book.loans || []).map(l => (
                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(216,180,106,0.18)' }}>
                      <div>
                        <div style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 17, color: 'var(--cine-cream)', textShadow: 'var(--cine-text-shadow)' }}>{l.borrower_name}</div>
                        <div style={{ ...S.cinzelMicro, marginTop: 4 }}>
                          prestato {l.loan_date}{l.expected_return ? ` · restituzione ${l.expected_return}` : ''}
                        </div>
                        {l.active && l.expected_return && l.expected_return < new Date().toISOString().split('T')[0] && (
                          <div style={{ ...S.cinzelMicro, color: 'var(--cine-vermilion)', marginTop: 3 }}>scaduto</div>
                        )}
                      </div>
                      {l.active
                        ? <button style={S.btnGhost} onClick={() => returnLoan(l.id)}>restituito</button>
                        : <span style={{ ...S.cinzelMicro, color: 'rgba(232,220,192,0.35)' }}>restituito {l.actual_return}</span>
                      }
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ─── TAB: Storico ─── */}
            {tab === 'storico' && (
              <div style={{ paddingTop: 8 }}>
                {readingHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(232,220,192,0.35)' }}>
                    Nessuna lettura registrata.
                  </div>
                ) : (
                  readingHistory.map((rh, i) => (
                    <div key={rh.id} style={{ display: 'flex', gap: 20, padding: '16px 0', borderBottom: '1px solid rgba(216,180,106,0.18)' }}>
                      <div style={{ width: 48, textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 24, lineHeight: 1, color: 'var(--cine-gold-dim)', fontWeight: 500 }}>
                          #{rh.reread_number || i + 1}
                        </div>
                        <div style={{ ...S.cinzelMicro, fontSize: 8, marginTop: 2 }}>lettura</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          {rh.date_start && <span style={{ ...S.cinzelMicro }}>inizio: <strong style={{ color: 'var(--cine-cream)' }}>{rh.date_start}</strong></span>}
                          {rh.date_end   && <span style={{ ...S.cinzelMicro }}>fine: <strong style={{ color: 'var(--cine-cream)' }}>{rh.date_end}</strong></span>}
                        </div>
                        {rh.rating && <Stars rating={rh.rating}/>}
                        {rh.notes && (
                          <p style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 14, lineHeight: 1.6, fontStyle: 'italic', color: 'rgba(232,220,192,0.7)', marginTop: 8, marginBottom: 0 }}>
                            {rh.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <AddReadingForm bookId={book.id} onAdded={async () => { const updated = await booksApi.get(id); setBook(updated); }}/>
              </div>
            )}
          </div>{/* end scrollable */}
        </div>{/* end right col */}
      </div>{/* end grid */}

      {/* ── Confirm delete modal ───────────────────────────────────────── */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={() => setConfirmDelete(false)}>
          <div style={{ background: 'rgba(10,7,4,0.97)', border: '1px solid var(--cine-vermilion)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '28px 32px', maxWidth: 420, width: '90vw' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 10, color: 'var(--cine-vermilion)', marginBottom: 14 }}>Elimina libro</div>
            <div style={{ fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 14, lineHeight: 1.65, color: 'rgba(232,220,192,0.85)', marginBottom: 22 }}>
              Stai per eliminare definitivamente <strong style={{ color: 'var(--cine-cream)' }}>{book.title}</strong>.<br/>
              Saranno rimosse anche note, storico di lettura e prestiti associati.<br/>
              <span style={{ color: 'var(--cine-vermilion)' }}>Questa azione non è reversibile.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, padding: '8px 0', textAlign: 'center', background: 'rgba(192,83,59,0.85)', border: '1px solid var(--cine-vermilion)', color: '#fff', cursor: 'pointer', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 10, fontWeight: 500 }}
                onClick={deleteBook} disabled={deleting}>{deleting ? '…' : 'Sì, elimina'}</button>
              <button style={{ flex: 1, padding: '8px 0', textAlign: 'center', background: 'transparent', border: '1px solid rgba(216,180,106,0.28)', color: 'rgba(232,220,192,0.7)', cursor: 'pointer', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 10, fontWeight: 500 }}
                onClick={() => setConfirmDelete(false)} disabled={deleting}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal modifica ─────────────────────────────────────────────── */}
      {editMode && (
        <div className="m-overlay" onClick={() => setEditMode(false)}>
          <div className="m-modal" style={{ width: 720, padding: 32 }} onClick={e => e.stopPropagation()}>
            <div className="m-eyebrow" style={{ marginBottom: 8 }}>Modifica libro</div>
            <div className="m-serif" style={{ fontSize: 28, marginBottom: 20 }}>{book.title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
              {[
                ['Titolo', 'title'], ['Sottotitolo', 'subtitle'], ['Titolo originale', 'original_title'],
                ['Autore/i (separati da virgola)', 'authors_str'], ['Editore', 'publisher'], ['Anno', 'year'],
                ['Pagine', 'pages'], ['Lingua', 'language'], ['ISBN-13', 'isbn13'], ['ISBN-10', 'isbn10'],
                ['Serie', 'series_name'], ['Volume #', 'series_volume'],
                ['Stanza', 'location_room'], ['Libreria', 'location_bookcase'],
              ].map(([label, key]) => (
                <div key={key} className="m-field">
                  <label>{label}</label>
                  <input className="m-input" style={{ padding: '6px 10px' }}
                    value={editData[key] ?? ''} onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))}/>
                </div>
              ))}

              {/* Volumi & Copie */}
              <div className="m-field">
                <label>N° Tomi (edizione in più volumi)</label>
                <input className="m-input" style={{ padding: '6px 10px' }} type="number" min="1"
                  value={editData.volumes_count ?? 1}
                  onChange={e => setEditData(d => ({ ...d, volumes_count: parseInt(e.target.value) || 1 }))}/>
              </div>
              <div className="m-field">
                <label>Copie possedute (doppioni)</label>
                <input className="m-input" style={{ padding: '6px 10px' }} type="number" min="1"
                  value={editData.copies_owned ?? 1}
                  onChange={e => setEditData(d => ({ ...d, copies_owned: parseInt(e.target.value) || 1 }))}/>
              </div>

              {/* Valore di mercato */}
              <div className="m-field">
                <label>Valore stimato (€)</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input className="m-input" style={{ padding: '6px 10px' }} type="number" min="0" step="0.01"
                    value={editData.market_value ?? ''}
                    onChange={e => setEditData(d => ({ ...d, market_value: e.target.value }))}
                    placeholder="0.00"/>
                  <button type="button" className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11, flexShrink: 0 }}
                    onClick={() => { setEditMode(false); setShowValoreModal(true); }}>
                    cerca ↗
                  </button>
                </div>
              </div>

              {/* Numero inventario (readonly) */}
              <div className="m-field">
                <label>N° inventario</label>
                <input className="m-input m-mono" style={{ padding: '6px 10px', letterSpacing: '0.05em', color: 'var(--m-ink-muted)', cursor: 'default' }}
                  value={editData.inventory_number ?? ''} readOnly/>
              </div>

              <div className="m-field" style={{ gridColumn: 'span 2' }}>
                <label>Formato</label>
                <select className="m-select" value={editData.format || 'paperback'} onChange={e => setEditData(d => ({ ...d, format: e.target.value }))}>
                  <option value="hardcover">Cartonato</option>
                  <option value="paperback">Brossura</option>
                  <option value="ebook">Ebook</option>
                  <option value="audiobook">Audiolibro</option>
                  <option value="comics">Fumetto</option>
                </select>
              </div>

              <div className="m-field" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={!!editData.signed} onChange={e => setEditData(d => ({ ...d, signed: e.target.checked ? 1 : 0 }))} style={{ width: 16, height: 16, cursor: 'pointer' }}/>
                  <span>✦ Volume autografato</span>
                </label>
              </div>

              <div className="m-field" style={{ gridColumn: 'span 2' }}>
                <label>Sinossi</label>
                <textarea className="m-textarea" value={editData.synopsis ?? ''} onChange={e => setEditData(d => ({ ...d, synopsis: e.target.value }))}/>
              </div>
              <div className="m-field" style={{ gridColumn: 'span 2' }}>
                <label>Note personali</label>
                <textarea className="m-textarea" value={editData.personal_notes ?? ''} onChange={e => setEditData(d => ({ ...d, personal_notes: e.target.value }))}/>
              </div>
              <div className="m-field">
                <label>Tag (virgola-separati)</label>
                <input className="m-input" style={{ padding: '6px 10px' }}
                  value={(editData.tags || []).join(', ')}
                  onChange={e => setEditData(d => ({ ...d, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}/>
              </div>
              <div className="m-field" style={{ gridColumn: 'span 2' }}>
                <label>Copertina — URL immagine</label>
                <input className="m-input" style={{ padding: '6px 10px' }}
                  value={editData.cover_url ?? ''}
                  onChange={e => setEditData(d => ({ ...d, cover_url: e.target.value }))}
                  placeholder="https://…"/>
              </div>
              <div className="m-field" style={{ gridColumn: 'span 2' }}>
                <label>Copertina — carica file</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="file" accept="image/*" style={{ fontSize: 13 }}
                    onChange={async e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        const result = await booksApi.uploadCover(id, file);
                        setBook(b => ({ ...b, cover_local: result.url }));
                        toast('Copertina caricata', 'success');
                      } catch { toast('Errore caricamento copertina', 'error'); }
                    }}/>
                  {(book.cover_local || book.cover_url) && (
                    <img src={book.cover_local || book.cover_url} alt="" style={{ height: 60, objectFit: 'contain', border: '1px solid var(--m-rule)' }}/>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="m-btn m-btn-ghost" onClick={() => setEditMode(false)}>annulla</button>
              <button className="m-btn" onClick={saveEdit}>salva</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale valore ─────────────────────────────────────────────── */}
      {showValoreModal && (
        <ValoreModal book={book} onSave={saveMarketValue} onClose={() => setShowValoreModal(false)}/>
      )}
    </div>
  );
}

/* ── AddReadingForm ──────────────────────────────────────────────────────── */
function AddReadingForm({ bookId, onAdded }) {
  const [data, setData] = useState({ date_start: '', date_end: '', rating: '', notes: '' });
  const S = {
    label: { fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 9, color: 'rgba(232,220,192,0.5)', fontWeight: 500, display: 'block', marginBottom: 5 },
  };
  async function submit() {
    if (!data.date_end) return;
    const { books: bApi } = await import('../api/index.js');
    await bApi.addReading(bookId, { ...data, rating: data.rating ? parseInt(data.rating) : null });
    onAdded();
  }
  return (
    <div style={{ marginTop: 24, padding: '16px', border: '1px solid rgba(216,180,106,0.28)' }}>
      <div style={{ fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 9, color: 'rgba(232,220,192,0.5)', fontWeight: 500, marginBottom: 12 }}>
        Registra lettura
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div><span style={S.label}>Inizio</span><input className="m-input" type="date" value={data.date_start} onChange={e => setData(d => ({ ...d, date_start: e.target.value }))}/></div>
        <div><span style={S.label}>Fine</span><input className="m-input" type="date" value={data.date_end} onChange={e => setData(d => ({ ...d, date_end: e.target.value }))}/></div>
        <div><span style={S.label}>Valutazione (1–5)</span><input className="m-input" type="number" min={1} max={5} value={data.rating} onChange={e => setData(d => ({ ...d, rating: e.target.value }))}/></div>
      </div>
      <button
        style={{ padding: '6px 16px', background: 'rgba(216,180,106,0.12)', border: '1px solid rgba(216,180,106,0.4)', color: 'var(--cine-gold)', cursor: 'pointer', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 10, fontWeight: 500 }}
        onClick={submit}
      >
        Salva lettura
      </button>
    </div>
  );
}
