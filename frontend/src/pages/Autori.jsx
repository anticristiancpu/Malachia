import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import { ORN } from '../components/ORN.jsx';
import { authors as authorsApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';

/* ── Costanti ──────────────────────────────────────────────────────── */
const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

/* ── Lettera iniziale decorativa ───────────────────────────────────── */
function AuthorInitial({ name, size = 32, active = false }) {
  const letter = ((name || '?').trim()[0] || '?').toUpperCase();
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      background: active ? 'var(--m-terracotta)' : 'var(--m-parchment-2)',
      border: `1px solid ${active ? 'var(--m-terracotta)' : 'var(--m-rule)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'EB Garamond', serif",
      fontSize: size * 0.48, fontStyle: 'italic', fontWeight: 700,
      color: active ? '#fff' : 'var(--m-ink-muted)',
      userSelect: 'none', transition: 'all 150ms',
      flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

/* ── Riga autore ────────────────────────────────────────────────────── */
function AuthorRow({ author, selected, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px 8px 14px', cursor: 'pointer',
        borderBottom: '1px solid var(--m-rule)',
        borderLeft: `3px solid ${selected ? 'var(--m-terracotta)' : 'transparent'}`,
        background: selected
          ? 'color-mix(in srgb, var(--m-terracotta) 7%, var(--m-parchment))'
          : hov ? 'var(--m-parchment-2)' : 'transparent',
        transition: 'background 100ms, border-left-color 100ms',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="m-serif" style={{
          fontSize: 16, lineHeight: 1.2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {author.name}
        </div>
        {(author.nationality || author.birth_date) && (
          <div style={{
            fontSize: 11, color: 'var(--m-ink-muted)', marginTop: 2,
            fontFamily: "'EB Garamond', serif",
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {[
              author.nationality,
              author.birth_date && (author.death_date
                ? `${author.birth_date.slice(0,4)}–${author.death_date.slice(0,4)}`
                : `n. ${author.birth_date.slice(0,4)}`),
            ].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
      <div className="m-nums" style={{
        fontSize: 12, flexShrink: 0, marginLeft: 4,
        color: selected ? 'var(--m-terracotta)' : 'var(--m-ink-muted)',
        fontWeight: selected ? 700 : 400,
      }}>
        {author.book_count}
      </div>
    </div>
  );
}

/* ── Letter Slider ─────────────────────────────────────────────────
   Striscia verticale trascinabile con le lettere A-Z.
   Clic o drag → scrolla la lista alla sezione corrispondente.
────────────────────────────────────────────────────────────────── */
function LetterSlider({ availableLetters, onSelect }) {
  const trackRef   = useRef(null);
  const dragging   = useRef(false);
  const lastLetter = useRef(null);
  const availRef   = useRef(availableLetters);
  const selectRef  = useRef(onSelect);
  const [active, setActive] = useState(null); // lettera attiva (hover o drag)

  // Aggiorna i ref senza ri-registrare i listener
  useEffect(() => { availRef.current  = availableLetters; }, [availableLetters]);
  useEffect(() => { selectRef.current = onSelect;         }, [onSelect]);

  // Ricava la lettera dalla coordinata Y del mouse
  function letterAtY(clientY) {
    const el = trackRef.current;
    if (!el) return null;
    const { top, height } = el.getBoundingClientRect();
    const rel = Math.max(0, Math.min(clientY - top, height - 1));
    return ALL_LETTERS[Math.floor((rel / height) * ALL_LETTERS.length)];
  }

  function trySelect(letter) {
    if (!letter || letter === lastLetter.current) return;
    if (!availRef.current.has(letter)) return;
    lastLetter.current = letter;
    setActive(letter);
    selectRef.current(letter);
  }

  // Listener globali per il drag (registrati una sola volta)
  useEffect(() => {
    function onMove(e) {
      if (!dragging.current) return;
      trySelect(letterAtY(e.clientY));
    }
    function onUp() {
      if (!dragging.current) return;
      dragging.current  = false;
      lastLetter.current = null;
      setActive(null);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={trackRef}
      style={{
        width: 28, flexShrink: 0,
        borderRight: '1px solid var(--m-rule)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 0',
        userSelect: 'none',
        position: 'relative',
        cursor: 'default',
      }}
      onMouseLeave={() => { if (!dragging.current) setActive(null); }}
      onMouseDown={e => {
        e.preventDefault();
        dragging.current = true;
        lastLetter.current = null;
        trySelect(letterAtY(e.clientY));
      }}
    >
      {/* Track line */}
      <div style={{
        position: 'absolute', left: '50%', top: 10, bottom: 10,
        width: 1, background: 'var(--m-rule)',
        transform: 'translateX(-50%)', pointerEvents: 'none',
      }}/>

      {ALL_LETTERS.map(letter => {
        const avail    = availableLetters.has(letter);
        const isActive = active === letter;
        return (
          <div
            key={letter}
            style={{
              position: 'relative', zIndex: 1,
              width: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: avail ? 'pointer' : 'default',
            }}
            onMouseEnter={() => { if (!dragging.current && avail) setActive(letter); }}
          >
            {/* Indicatore attivo (diamond) */}
            {isActive && avail && (
              <div style={{
                position: 'absolute', inset: 3,
                transform: 'rotate(45deg)',
                background: 'var(--m-terracotta)',
                transition: 'opacity 80ms',
              }}/>
            )}
            <span style={{
              position: 'relative', zIndex: 1,
              fontSize: 10, lineHeight: 1,
              fontFamily: "'EB Garamond', serif",
              fontWeight: avail ? 700 : 400,
              color: isActive && avail ? '#fff'
                   : avail            ? 'var(--m-terracotta)'
                   :                    'var(--m-rule-strong)',
              transition: 'color 80ms',
            }}>
              {letter}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPALE
═══════════════════════════════════════════════════════════════════ */
export default function Autori() {
  const navigate   = useNavigate();
  const toast      = useToast();
  const listRef    = useRef(null);
  const letterRefs = useRef({});

  /* ── Stato ── */
  const [authors,       setAuthors]       = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [sortMode,      setSortMode]      = useState('az');
  const [selected,      setSelected]      = useState(null);
  const [authorDetail,  setAuthorDetail]  = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* Merge */
  const [showMerge,   setShowMerge]   = useState(false);
  const [checkedIds,  setCheckedIds]  = useState(new Set());
  const [keepId,      setKeepId]      = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [merging,     setMerging]     = useState(false);

  /* Pulizia orfani */
  const [orphansCount, setOrphansCount] = useState(null); // null = non ancora verificato
  const [cleaning,     setCleaning]     = useState(false);

  /* ── Caricamento ── */
  const load = useCallback(() => {
    setLoading(true);
    authorsApi.list({ search: search || undefined, limit: 2000 })
      .then(r => { setAuthors(r.authors); setTotal(r.total); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  /* ── Dettaglio autore ── */
  useEffect(() => {
    if (!selected) { setAuthorDetail(null); return; }
    setDetailLoading(true);
    authorsApi.get(selected)
      .then(r  => { setAuthorDetail(r);  setDetailLoading(false); })
      .catch(() => setDetailLoading(false));
  }, [selected]);

  /* ── Ordinamento ── */
  const sortedAuthors = useMemo(() => [...authors].sort((a, b) => {
    if (sortMode === 'az')         return (a.name_sort || a.name || '').localeCompare(b.name_sort || b.name || '', 'it');
    if (sortMode === 'za')         return (b.name_sort || b.name || '').localeCompare(a.name_sort || a.name || '', 'it');
    if (sortMode === 'books_desc') return b.book_count - a.book_count;
    return a.book_count - b.book_count;
  }), [authors, sortMode]);

  /* ── Raggruppamento per lettera (solo A→Z) ── */
  const showGroups = sortMode === 'az' && !search;

  const groupedAuthors = useMemo(() => {
    if (!showGroups) return null;
    const groups = new Map();
    const misc   = [];
    sortedAuthors.forEach(a => {
      const ch = ((a.name_sort || a.name || '').trim()[0] || '?').toUpperCase();
      if (/[A-Z]/.test(ch)) {
        if (!groups.has(ch)) groups.set(ch, []);
        groups.get(ch).push(a);
      } else {
        misc.push(a);
      }
    });
    if (misc.length > 0) groups.set('#', misc);
    return groups;
  }, [sortedAuthors, showGroups]);

  const availableLetters = useMemo(() => {
    if (!groupedAuthors) return new Set();
    return new Set(groupedAuthors.keys());
  }, [groupedAuthors]);

  /* ── Scroll alla lettera ── */
  function scrollToLetter(letter) {
    const el        = letterRefs.current[letter];
    const container = listRef.current;
    if (!el || !container) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    container.scrollTo({ top: container.scrollTop + eRect.top - cRect.top, behavior: 'smooth' });
  }

  /* ── Merge ── */
  function openMerge()  { setCheckedIds(new Set()); setKeepId(''); setModalSearch(''); setShowMerge(true); }
  function closeMerge() { setShowMerge(false); setCheckedIds(new Set()); setKeepId(''); setModalSearch(''); }

  function toggleCheck(id) {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); if (keepId === id) setKeepId(next.size > 0 ? [...next][0] : ''); }
      else { next.add(id); if (!keepId) setKeepId(id); }
      return next;
    });
  }

  async function doMerge() {
    if (!keepId || checkedIds.size < 2) return;
    const toMerge = [...checkedIds].filter(id => id !== keepId);
    setMerging(true);
    try {
      for (const id of toMerge) await authorsApi.merge(keepId, id);
      const keepName = authors.find(a => a.id === keepId)?.name;
      toast(`${toMerge.length} ${toMerge.length === 1 ? 'autore unificato' : 'autori unificati'} in "${keepName}"`, 'success');
      if (selected && toMerge.includes(selected)) setSelected(keepId);
      closeMerge(); load();
    } catch (e) { toast('Errore: ' + e.message, 'error'); }
    setMerging(false);
  }

  /* ── Orfani ── */
  async function loadOrphansCount() {
    try {
      const r = await authorsApi.orphansCount();
      setOrphansCount(r.count);
    } catch { setOrphansCount(0); }
  }

  async function cleanOrphans() {
    if (orphansCount === 0) return;
    setCleaning(true);
    try {
      const r = await authorsApi.cleanOrphans();
      toast(
        r.deleted === 0
          ? 'Nessun autore orfano trovato'
          : `${r.deleted} autor${r.deleted === 1 ? 'e rimosso' : 'i rimossi'} dalla rubrica`,
        'success'
      );
      setOrphansCount(0);
      if (r.deleted > 0) load();
    } catch { toast('Errore durante la pulizia', 'error'); }
    setCleaning(false);
  }

  /* ── Render lista ── */
  function renderList() {
    if (loading) return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div className="m-spinner"/>
      </div>
    );
    if (sortedAuthors.length === 0) return (
      <div style={{ padding: 24, color: 'var(--m-ink-muted)', fontStyle: 'italic', fontSize: 14, textAlign: 'center' }}>
        Nessun autore trovato
      </div>
    );

    /* Raggruppato per lettera */
    if (groupedAuthors) {
      return [...groupedAuthors.entries()].map(([letter, letterAuthors]) => (
        <div key={letter}>
          {/* Intestazione lettera — sticky */}
          <div
            ref={el => { if (el) letterRefs.current[letter] = el; }}
            style={{
              position: 'sticky', top: 0, zIndex: 2,
              padding: '4px 14px 3px',
              background: 'var(--m-parchment)',
              borderBottom: '2px solid var(--m-rule)',
              borderTop: '1px solid var(--m-rule)',
              display: 'flex', alignItems: 'baseline', gap: 10,
            }}
          >
            <span className="m-serif" style={{
              fontSize: 30, fontWeight: 700, fontStyle: 'italic',
              color: 'var(--m-terracotta)', lineHeight: 1,
            }}>
              {letter}
            </span>
            <span style={{
              fontSize: 10, color: 'var(--m-ink-muted)',
              fontFamily: "'EB Garamond', serif",
              fontVariant: 'small-caps', letterSpacing: '0.08em',
            }}>
              {letterAuthors.length}
            </span>
          </div>

          {letterAuthors.map(a => (
            <AuthorRow
              key={a.id}
              author={a}
              selected={selected === a.id}
              onClick={() => setSelected(a.id === selected ? null : a.id)}
            />
          ))}
        </div>
      ));
    }

    /* Lista piatta (ricerca o ordinamento per libri) */
    return sortedAuthors.map(a => (
      <AuthorRow
        key={a.id}
        author={a}
        selected={selected === a.id}
        onClick={() => setSelected(a.id === selected ? null : a.id)}
      />
    ));
  }

  /* ── Render dettaglio ── */
  function renderDetail() {
    if (!selected) return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 14, color: 'var(--m-ink-muted)',
      }}>
        <div style={{
          fontSize: 64, fontFamily: "'EB Garamond', serif",
          fontStyle: 'italic', fontWeight: 700,
          color: 'var(--m-rule-strong)', lineHeight: 1,
        }}>A</div>
        <div className="m-serif" style={{ fontSize: 18, fontStyle: 'italic' }}>
          Seleziona un autore dalla lista
        </div>
      </div>
    );

    if (detailLoading) return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div className="m-spinner"/>
      </div>
    );

    if (!authorDetail) return null;

    const books      = authorDetail.books || [];
    const sortLetter = ((authorDetail.name_sort || authorDetail.name || '').trim()[0] || '?').toUpperCase();
    const lifespan   = authorDetail.birth_date
      ? (authorDetail.death_date
          ? `${authorDetail.birth_date.slice(0,4)} – ${authorDetail.death_date.slice(0,4)}`
          : `n. ${authorDetail.birth_date.slice(0,4)}`)
      : null;

    return (
      <>
        {/* ── Header autore ── */}
        <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', marginBottom: 22 }}>
          {/* Monogramma */}
          <div style={{
            width: 76, height: 76, flexShrink: 0,
            background: 'var(--m-parchment-2)',
            border: '1px solid var(--m-rule)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'EB Garamond', serif",
            fontSize: 46, fontStyle: 'italic', fontWeight: 700,
            color: 'var(--m-terracotta)', userSelect: 'none',
          }}>
            {sortLetter}
          </div>

          {/* Metadata */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="m-serif" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.05 }}>
              {authorDetail.name}
            </div>

            {/* Sottotitolo sort name (se diverso) */}
            {authorDetail.name_sort && authorDetail.name_sort !== authorDetail.name && (
              <div className="m-mono" style={{ fontSize: 11, color: 'var(--m-ink-muted)', marginTop: 3, letterSpacing: '0.04em' }}>
                {authorDetail.name_sort}
              </div>
            )}

            {/* Pills metadati */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {authorDetail.nationality && (
                <span style={{
                  fontSize: 11, fontVariant: 'small-caps', letterSpacing: '0.08em',
                  padding: '2px 8px', border: '1px solid var(--m-rule)',
                  fontFamily: "'EB Garamond', serif", color: 'var(--m-ink-soft)',
                }}>
                  {authorDetail.nationality}
                </span>
              )}
              {lifespan && (
                <span className="m-mono" style={{ fontSize: 11, color: 'var(--m-ink-muted)' }}>
                  {lifespan}
                </span>
              )}
              <span style={{
                fontSize: 11, fontVariant: 'small-caps', letterSpacing: '0.08em',
                padding: '2px 8px',
                background: 'color-mix(in srgb, var(--m-terracotta) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--m-terracotta) 30%, transparent)',
                fontFamily: "'EB Garamond', serif", color: 'var(--m-terracotta)',
              }}>
                {books.length} {books.length === 1 ? 'volume' : 'volumi'}
              </span>
            </div>

            {/* Bio snippet */}
            {authorDetail.bio && (
              <div style={{
                marginTop: 12, fontSize: 13, lineHeight: 1.7,
                color: 'var(--m-ink-soft)', fontFamily: "'EB Garamond', serif",
                fontStyle: 'italic',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {authorDetail.bio}
              </div>
            )}
          </div>

          {/* Pulsante scheda completa */}
          <button
            className="m-btn m-btn-ghost m-btn-sm"
            style={{ flexShrink: 0, fontSize: 12 }}
            onClick={() => navigate(`/autori/${authorDetail.id}`)}
          >
            scheda completa ›
          </button>
        </div>

        <div style={{ height: 1, background: 'var(--m-rule)', marginBottom: 22 }}/>

        {/* ── Libri ── */}
        {books.length === 0 ? (
          <div style={{
            fontFamily: "'EB Garamond', serif", fontStyle: 'italic',
            fontSize: 14, color: 'var(--m-ink-muted)',
          }}>
            Nessun libro in collezione
          </div>
        ) : (
          <>
            <div className="m-eyebrow" style={{ marginBottom: 14, fontSize: 10 }}>
              In collezione · {books.length} {books.length === 1 ? 'titolo' : 'titoli'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {books.map(b => (
                <div
                  key={b.id}
                  style={{ width: 110, cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => navigate(`/libro/${b.id}`)}
                >
                  <BookCover book={b} w={110} h={158}/>
                  <div className="m-serif" style={{ fontSize: 11, lineHeight: 1.25, marginTop: 6 }}>
                    {b.title}
                  </div>
                  {b.year && (
                    <div className="m-mono" style={{ fontSize: 10, color: 'var(--m-ink-muted)', marginTop: 2 }}>
                      {b.year}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </>
    );
  }

  /* ── Render principale ── */
  return (
    <div style={{ padding: '28px 36px 0', display: 'flex', flexDirection: 'column', gap: 18, height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
        <div>
          <div className="m-eyebrow" style={{ marginBottom: 4 }}>Capitulum V</div>
          <div style={{
            fontFamily: "'Cinzel', 'Mantinia', serif",
            fontSize: 42, fontWeight: 400, lineHeight: 1.05, color: 'var(--cine-cream)',
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            Autori
            <em style={{
              fontFamily: "'Agmena Pro', 'EB Garamond', Georgia, serif",
              fontSize: 22, fontStyle: 'italic', fontWeight: 400,
              color: 'var(--cine-gold)', letterSpacing: '0.01em',
              textTransform: 'none', marginLeft: '0.4em',
            }}>· {total}</em>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="m-searchbar" style={{ width: 240 }}>
            <ORN.quill size={14} style={{ color: 'var(--m-ink-muted)' }}/>
            <input
              placeholder="cerca autore…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="m-select" style={{ fontSize: 13, padding: '4px 24px 4px 8px' }}
            value={sortMode} onChange={e => setSortMode(e.target.value)}
          >
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="books_desc">più libri prima</option>
            <option value="books_asc">meno libri prima</option>
          </select>
          <button
            className="m-btn m-btn-ghost"
            disabled={cleaning || orphansCount === 0}
            onClick={orphansCount === null ? loadOrphansCount : cleanOrphans}
          >
            {cleaning        ? '…'
             : orphansCount === null ? '✕ orfani'
             : orphansCount === 0   ? '✓ orfani'
             :                        `✕ rimuovi ${orphansCount}`}
          </button>
          <button className="m-btn m-btn-ghost" onClick={openMerge}>⇄ unifica</button>
        </div>
      </div>

      {/* ── Pannelli ── */}
      <div style={{ borderTop: '1px solid var(--cine-gold-dim)', flex: 1, display: 'flex', minHeight: 0 }}>

        {/* ── Lista autori (sinistra) ── */}
        <div style={{
          width: 320, borderRight: '1px solid var(--m-rule)',
          display: 'flex', flexShrink: 0,
        }}>
          {/* ── Letter slider (solo A→Z senza ricerca) ── */}
          {showGroups && (
            <LetterSlider
              availableLetters={availableLetters}
              onSelect={scrollToLetter}
            />
          )}

          {/* Area scrollabile */}
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }}>
            {renderList()}
          </div>
        </div>

        {/* ── Pannello dettaglio (destra) ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {renderDetail()}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           MODALE UNIFICAZIONE  (invariata)
      ══════════════════════════════════════════════════════════════ */}
      {showMerge && (() => {
        const filtered    = authors.filter(a => !modalSearch || a.name.toLowerCase().includes(modalSearch.toLowerCase()));
        const checkedList = authors.filter(a => checkedIds.has(a.id));
        const toMergeList = checkedList.filter(a => a.id !== keepId);
        const keepAuthor  = authors.find(a => a.id === keepId);
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div style={{ background: 'var(--m-parchment)', padding: 32, width: 680, height: '82vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--m-rule)' }}>

              <div className="m-serif" style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>Unifica autori</div>
              <p className="m-body" style={{ fontSize: 13, color: 'var(--m-ink-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                Seleziona gli autori da unificare (almeno 2) e scegli quale mantenere.
              </p>

              <div className="m-searchbar" style={{ marginBottom: 8, flexShrink: 0 }}>
                <ORN.quill size={13} style={{ color: 'var(--m-ink-muted)' }}/>
                <input placeholder="filtra autori…" value={modalSearch} onChange={e => setModalSearch(e.target.value)} autoFocus/>
              </div>

              <div style={{ overflowY: 'auto', border: '1px solid var(--m-rule)', flex: '1 1 0', minHeight: 100 }}>
                {filtered.length === 0 && (
                  <div style={{ padding: 20, color: 'var(--m-ink-muted)', fontSize: 13, textAlign: 'center' }}>Nessun risultato</div>
                )}
                {filtered.map(a => (
                  <label key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                    cursor: 'pointer', borderBottom: '1px solid var(--m-rule)',
                    background: checkedIds.has(a.id) ? 'color-mix(in srgb, var(--m-terracotta) 8%, transparent)' : 'transparent',
                    transition: 'background 100ms',
                  }}>
                    <input
                      type="checkbox" checked={checkedIds.has(a.id)} onChange={() => toggleCheck(a.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--m-terracotta)', width: 15, height: 15, flexShrink: 0 }}
                    />
                    <span className="m-serif" style={{ flex: 1, fontSize: 15 }}>{a.name}</span>
                    <span className="m-nums" style={{ fontSize: 12, color: 'var(--m-ink-muted)', marginRight: 2 }}>{a.book_count}</span>
                  </label>
                ))}
              </div>

              {checkedIds.size >= 2 && (
                <div style={{ marginTop: 14, flexShrink: 0 }}>
                  <label className="m-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Mantieni come principale</label>
                  <select className="m-select" style={{ width: '100%' }} value={keepId} onChange={e => setKeepId(e.target.value)}>
                    {checkedList.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.book_count} {a.book_count === 1 ? 'libro' : 'libri'})</option>
                    ))}
                  </select>
                </div>
              )}

              {toMergeList.length > 0 && keepAuthor && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--m-rule)', fontSize: 13, lineHeight: 1.5, flexShrink: 0 }}>
                  <span className="m-eyebrow">Riepilogo · </span>
                  {toMergeList.map(a => `"${a.name}"`).join(', ')} → <strong>"{keepAuthor.name}"</strong>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span className="m-body" style={{ fontSize: 13, color: 'var(--m-ink-muted)' }}>
                  {checkedIds.size === 0 ? 'Nessuna selezione' : `${checkedIds.size} selezionati`}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="m-btn m-btn-ghost" onClick={closeMerge}>Annulla</button>
                  <button
                    className="m-btn"
                    disabled={checkedIds.size < 2 || !keepId || merging}
                    onClick={doMerge}
                  >
                    {merging ? '…' : `⇄ Unifica ${checkedIds.size >= 2 ? checkedIds.size : ''}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
