import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import { ORN } from '../components/ORN.jsx';
import { publishers as publishersApi, books as booksApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';

const LS_COLLANE_ORDER = 'malachia-collane-orders';
function loadCollaneOrder() {
  try { return JSON.parse(localStorage.getItem(LS_COLLANE_ORDER) || '{}'); } catch { return {}; }
}

/* ─── ContextMenu ─────────────────────────────────────────────────────────── */
function ContextMenu({ x, y, book, allSectionNames, onAssign, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function onMouse(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    function onKey(e)   { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown',   onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown',   onKey);
    };
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'fixed', left: x, top: y, zIndex: 500,
      background: 'var(--m-parchment)', border: '1px solid var(--m-rule)',
      boxShadow: '0 4px 18px rgba(0,0,0,0.18)', minWidth: 210,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid var(--m-rule)' }}>
        <div className="m-eyebrow" style={{ fontSize: 10 }}>Sposta in collana</div>
        <div className="m-serif" style={{ fontSize: 13, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
          {book.title}
        </div>
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {allSectionNames.map(name => {
          const active = book.series_name === name;
          return (
            <div key={name}
              style={{
                padding: '7px 14px', cursor: 'pointer', fontSize: 13,
                background: active ? 'color-mix(in srgb, var(--m-terracotta) 12%, transparent)' : 'transparent',
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--m-rule)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = active ? 'color-mix(in srgb, var(--m-terracotta) 12%, transparent)' : 'transparent'; }}
              onClick={() => { onAssign(book, name); onClose(); }}
            >{name}</div>
          );
        })}
        {book.series_name && <>
          <div style={{ height: 1, background: 'var(--m-rule)', margin: '4px 0' }}/>
          <div
            style={{ padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--m-ink-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--m-rule)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={() => { onAssign(book, null); onClose(); }}
          >× rimuovi dalla collana</div>
        </>}
      </div>
    </div>
  );
}

/* ─── BookCard ──────────────────────────────────────────────────────────────── */
function BookCard({ book, isDragging, onDragStart, onDragEnd, onNavigate, onContextMenu, showCheckbox, isSelected, onToggleSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={onDragEnd}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onContextMenu && onContextMenu(e); }}
      style={{
        flexShrink: 0, width: 110, cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.45 : 1, transition: 'opacity 150ms', position: 'relative',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Checkbox selezione multipla */}
      {(showCheckbox || isSelected) && (
        <div
          style={{
            position: 'absolute', top: 4, left: 4, zIndex: 10,
            width: 18, height: 18,
            background: isSelected ? 'var(--m-terracotta)' : 'rgba(20,14,7,0.88)',
            border: '1.5px solid ' + (isSelected ? 'var(--m-terracotta)' : 'var(--m-rule-strong)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 120ms',
          }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onToggleSelect && onToggleSelect(); }}
        >
          {isSelected && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
        </div>
      )}

      <div style={{ position: 'relative', width: 110, height: 158, outline: isSelected ? '2px solid var(--m-terracotta)' : 'none', outlineOffset: 2 }}>
        <BookCover book={book} w={110} h={158}/>
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(18,14,8,0.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hov && !isDragging ? 1 : 0, transition: 'opacity 150ms',
          pointerEvents: hov && !isDragging ? 'auto' : 'none',
        }}>
          <button className="m-btn m-btn-sm" style={{ fontSize: 11, justifyContent: 'center' }}
            onClick={e => { e.stopPropagation(); onNavigate(); }}>
            vai al libro
          </button>
        </div>
      </div>
      <div style={{ marginTop: 6 }}>
        <div className="m-serif" style={{ fontSize: 12, lineHeight: 1.25 }}>
          {book.title}
        </div>
        {book.author_names && (
          <div className="m-marginalia" style={{ fontSize: 10, marginTop: 2, color: 'var(--m-ink-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {book.author_names}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CollanaSection ────────────────────────────────────────────────────────── */
function CollanaSection({
  name, booksList,
  isDragOver, onDragOver, onDragLeave, onDrop,
  onDelete, onRename,
  onNavigate,
  onDragStart, onDragEnd, draggingBookId,
  isSectionDragOver, onSectionDragStart, onSectionDragOver, onSectionDragLeave, onSectionDrop,
  isCollapsed, onToggleCollapse,
  selectedBooks, onToggleSelect,
  onContextMenu,
  sectionRef,
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [renaming,   setRenaming]   = useState(false);
  const [renameVal,  setRenameVal]  = useState('');
  const isDefault = name === null;
  const displayName = isDefault ? 'Fuori collana' : name;

  function startRename() { setRenameVal(name || ''); setRenaming(true); }
  function commitRename() {
    const v = renameVal.trim();
    if (v && v !== name && onRename) onRename(v);
    setRenaming(false);
  }

  return (
    <div
      ref={sectionRef}
      style={{
        borderTop: isSectionDragOver ? '3px solid var(--m-terracotta)' : '3px solid transparent',
        transition: 'border-color 150ms',
        paddingTop: isSectionDragOver ? 0 : 0,
      }}
      onDragOver={!isDefault ? onSectionDragOver : undefined}
      onDragLeave={!isDefault ? onSectionDragLeave : undefined}
      onDrop={!isDefault ? onSectionDrop : undefined}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isCollapsed ? 0 : 12 }}>

        {/* Drag handle sezione */}
        {!isDefault && (
          <div
            draggable
            onDragStart={e => { e.stopPropagation(); onSectionDragStart(e); }}
            title="Trascina per riordinare la collana"
            style={{ cursor: 'grab', color: 'var(--m-ink-muted)', fontSize: 15, flexShrink: 0, userSelect: 'none', lineHeight: 1 }}
          >⠿</div>
        )}

        {/* Titolo o input rename */}
        {renaming ? (
          <input
            className="m-input" value={renameVal} autoFocus
            onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false); }}
            onBlur={commitRename}
            style={{ fontSize: 20, fontFamily: "'EB Garamond', serif", fontWeight: 500, flex: '0 1 320px', padding: '2px 8px' }}
          />
        ) : (
          <div className="m-serif" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, flexShrink: 0 }}>
            {displayName}
          </div>
        )}

        <div style={{
          flex: 1, height: 1,
          background: isDragOver ? 'var(--m-terracotta)' : 'var(--m-rule)',
          transition: 'background 200ms',
        }}/>

        {/* Badge selezione multipla (fuori collana) */}
        {isDefault && selectedBooks && selectedBooks.size > 0 && (
          <span
            style={{ fontSize: 12, color: 'var(--m-terracotta)', flexShrink: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => onToggleSelect && onToggleSelect(null)}
          >{selectedBooks.size} selezionati · ×</span>
        )}

        {booksList.length > 0 && (
          <span className="m-nums" style={{ fontSize: 11, color: 'var(--m-ink-muted)', flexShrink: 0 }}>
            {booksList.length} {booksList.length === 1 ? 'volume' : 'volumi'}
          </span>
        )}

        {/* Rename */}
        {!isDefault && !renaming && !confirmDel && (
          <button className="m-btn m-btn-ghost m-btn-sm"
            style={{ fontSize: 11, color: 'var(--m-ink-muted)', flexShrink: 0 }}
            onClick={startRename}>✎ modifica</button>
        )}

        {/* Delete */}
        {onDelete && !confirmDel && !renaming && (
          <button className="m-btn m-btn-ghost m-btn-sm"
            style={{ fontSize: 11, color: 'var(--m-ink-muted)', flexShrink: 0 }}
            onClick={() => setConfirmDel(true)}>× elimina</button>
        )}
        {onDelete && confirmDel && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'var(--m-ink-muted)', whiteSpace: 'nowrap' }}>Rimuovere la collana?</span>
            <button className="m-btn m-btn-sm" style={{ fontSize: 11 }}
              onClick={() => { onDelete(); setConfirmDel(false); }}>Sì</button>
            <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11 }}
              onClick={() => setConfirmDel(false)}>No</button>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--m-ink-muted)', fontSize: 13, flexShrink: 0, padding: '2px 4px',
            transition: 'transform 150ms',
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Espandi' : 'Comprimi'}
        >▾</button>
      </div>

      {/* ── Griglia libri (zona drop) ── */}
      {!isCollapsed && (
        <div
          onDragOver={e => { e.stopPropagation(); onDragOver(e); }}
          onDragLeave={e => { e.stopPropagation(); onDragLeave(e); }}
          onDrop={e => { e.stopPropagation(); onDrop(e); }}
          style={{
            display: 'flex', flexWrap: 'wrap', gap: '12px 8px',
            paddingBottom: 6, minHeight: 180,
            alignItems: 'flex-start', alignContent: 'flex-start',
            outline: isDragOver ? '2px dashed var(--m-terracotta)' : '2px dashed transparent',
            outlineOffset: 6, borderRadius: 2, transition: 'outline-color 150ms',
          }}
        >
          {booksList.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', minHeight: 150, color: 'var(--m-ink-muted)',
              fontStyle: 'italic', fontSize: 14, fontFamily: "'EB Garamond', serif",
            }}>
              {isDragOver ? '↓ rilascia qui' : (isDefault ? 'Tutti i libri sono in una collana' : 'Trascina libri qui')}
            </div>
          ) : booksList.map(b => (
            <BookCard
              key={b.id}
              book={b}
              isDragging={draggingBookId === b.id}
              onDragStart={() => onDragStart(b)}
              onDragEnd={onDragEnd}
              onNavigate={() => onNavigate(b.id)}
              onContextMenu={onContextMenu ? e => onContextMenu(e, b) : undefined}
              showCheckbox={isDefault && (selectedBooks?.size > 0)}
              isSelected={isDefault && selectedBooks?.has(b.id)}
              onToggleSelect={isDefault ? () => onToggleSelect && onToggleSelect(b.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── CreateCollanaModal ────────────────────────────────────────────────────── */
function CreateCollanaModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: 'var(--m-parchment)', padding: 28, width: 400, border: '1px solid var(--m-rule)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="m-serif" style={{ fontSize: 18, fontWeight: 500 }}>Nuova collana</div>
        <div className="m-field">
          <label>Nome</label>
          <input
            className="m-input" value={name} autoFocus
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim())}
            placeholder="es. Piccola Biblioteca · Universale · I Grandi…"
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="m-btn m-btn-ghost" onClick={onClose}>Annulla</button>
          <button className="m-btn" onClick={() => name.trim() && onSave(name.trim())} disabled={!name.trim()}>Crea</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGINA PRINCIPALE
════════════════════════════════════════════════════════════════════════════ */
export default function Editori() {
  const navigate       = useNavigate();
  const toast          = useToast();
  const [searchParams] = useSearchParams();

  /* ── Publisher list ── */
  const [publishers,  setPublishers]  = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [sortMode,    setSortMode]    = useState('books_desc');

  /* ── Accordion collane pannello sinistro ── */
  const [expandedPubs,     setExpandedPubs]     = useState(new Set());
  const [pubSeries,        setPubSeries]        = useState({});
  const [pubSeriesLoading, setPubSeriesLoading] = useState(new Set());

  /* ── Right panel ── */
  const [selected,     setSelected]     = useState(null);
  const [books,        setBooks]        = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);

  /* ── Collane ── */
  const [userCreatedSeries, setUserCreatedSeries] = useState([]);
  const [showCreateCollana, setShowCreateCollana] = useState(false);
  const [collanaOrder,      setCollanaOrder]      = useState(loadCollaneOrder);
  const [collapsedSections, setCollapsedSections] = useState(new Set());

  /* ── Drag & drop libri ── */
  const [draggingBook,  setDraggingBook]  = useState(null);
  const [dropSection,   setDropSection]   = useState(null);
  const [selectedBooks, setSelectedBooks] = useState(new Set()); // multi-select "fuori collana"

  /* ── Drag & drop sezioni ── */
  const draggingSection    = useRef(null);
  const [sectionDropTarget, setSectionDropTarget] = useState(null);

  /* ── Context menu ── */
  const [contextMenu, setContextMenu] = useState(null); // { x, y, book }

  /* ── Scroll to section ── */
  const sectionRefs        = useRef({});
  const scrollContainerRef = useRef(null);
  const [scrollToSection,  setScrollToSection]  = useState(null);

  /* ── Merge modal ── */
  const [showMerge,    setShowMerge]    = useState(false);
  const [checkedNames, setCheckedNames] = useState(new Set());
  const [keepName,     setKeepName]     = useState('');
  const [modalSearch,  setModalSearch]  = useState('');
  const [merging,      setMerging]      = useState(false);

  /* ── Load publishers ── */
  const load = useCallback(() => {
    setLoading(true);
    publishersApi.list({ search: search || undefined })
      .then(r => { setPublishers(r.publishers); setTotal(r.total); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSelected(q);
  }, [searchParams]);

  /* ── Load books quando cambia editore ── */
  useEffect(() => {
    if (!selected) { setBooks([]); return; }
    setBooksLoading(true);
    setUserCreatedSeries([]);
    setSelectedBooks(new Set());
    publishersApi.books(selected)
      .then(r => { setBooks(r.books); setBooksLoading(false); })
      .catch(() => setBooksLoading(false));
  }, [selected]);

  /* ── Scroll alla sezione dopo caricamento ── */
  useEffect(() => {
    if (!scrollToSection || booksLoading) return;
    const el = sectionRefs.current[scrollToSection];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setScrollToSection(null);
  }, [scrollToSection, booksLoading]);

  /* ── Derived: collane dai libri ── */
  const seriesList = useMemo(() => {
    const counts = {};
    for (const b of books) {
      if (b.series_name) counts[b.series_name] = (counts[b.series_name] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [books]);

  const allSectionNames = useMemo(() => {
    const fromBooks = seriesList.map(s => s.name);
    const extra = userCreatedSeries.filter(n => !fromBooks.includes(n));
    return [...fromBooks, ...extra];
  }, [seriesList, userCreatedSeries]);

  /* Ordine sezioni: saved order + nuove in fondo */
  const orderedSections = useMemo(() => {
    const saved  = collanaOrder[selected] || [];
    const known  = new Set(allSectionNames);
    const ordered   = saved.filter(n => known.has(n));
    const remaining = allSectionNames.filter(n => !ordered.includes(n));
    return [...ordered, ...remaining];
  }, [allSectionNames, collanaOrder, selected]);

  /* Libri ordinati per autore (mod 7) */
  const sortedBooks = useMemo(() =>
    [...books].sort((a, b) => (a.author_names || '').localeCompare(b.author_names || '', 'it')),
  [books]);

  const noSeriesBooks = useMemo(() => sortedBooks.filter(b => !b.series_name), [sortedBooks]);

  /* ── Persist collana order ── */
  function saveCollanaOrder(pub, order) {
    const next = { ...collanaOrder, [pub]: order };
    setCollanaOrder(next);
    localStorage.setItem(LS_COLLANE_ORDER, JSON.stringify(next));
  }

  function reorderCollane(fromName, toName) {
    if (!selected || fromName === toName) return;
    const list = [...orderedSections];
    const fi = list.indexOf(fromName), ti = list.indexOf(toName);
    if (fi === -1 || ti === -1) return;
    list.splice(fi, 1);
    list.splice(ti, 0, fromName);
    saveCollanaOrder(selected, list);
  }

  /* ── Accordion ── */
  async function toggleExpand(e, pubName) {
    e.stopPropagation();
    const isExpanding = !expandedPubs.has(pubName);
    setExpandedPubs(prev => {
      const next = new Set(prev);
      isExpanding ? next.add(pubName) : next.delete(pubName);
      return next;
    });
    if (isExpanding && !pubSeries[pubName]) {
      setPubSeriesLoading(prev => new Set([...prev, pubName]));
      try {
        const r = await publishersApi.series(pubName);
        setPubSeries(ps => ({ ...ps, [pubName]: r.series }));
      } catch {}
      setPubSeriesLoading(prev => { const n = new Set(prev); n.delete(pubName); return n; });
    }
  }

  /* ── Assegna collana ── */
  async function assignSeries(book, seriesName) {
    const target = seriesName || null;
    if (book.series_name === target) return;
    try {
      await booksApi.update(book.id, { series_name: target });
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, series_name: target } : b));
      /* Aggiorna cache accordion */
      if (selected && pubSeries[selected]) {
        setPubSeries(ps => {
          const list = [...(ps[selected] || [])];
          if (book.series_name) {
            const idx = list.findIndex(s => s.series_name === book.series_name);
            if (idx !== -1) {
              if (list[idx].book_count <= 1) list.splice(idx, 1);
              else list[idx] = { ...list[idx], book_count: list[idx].book_count - 1 };
            }
          }
          if (target) {
            const idx = list.findIndex(s => s.series_name === target);
            if (idx !== -1) list[idx] = { ...list[idx], book_count: list[idx].book_count + 1 };
            else list.unshift({ series_name: target, book_count: 1 });
          }
          return { ...ps, [selected]: list };
        });
      }
      toast(target ? `"${book.title}" → ${target}` : `"${book.title}" rimosso dalla collana`, 'success');
    } catch { toast('Errore durante l\'assegnazione', 'error'); }
  }

  /* ── Rinomina collana ── */
  async function renameCollana(oldName, newName) {
    if (!newName || oldName === newName) return;
    if (allSectionNames.includes(newName)) {
      toast(`Esiste già una collana "${newName}"`, 'error'); return;
    }
    const affected = books.filter(b => b.series_name === oldName);
    try {
      await Promise.all(affected.map(b => booksApi.update(b.id, { series_name: newName })));
      setBooks(prev => prev.map(b => b.series_name === oldName ? { ...b, series_name: newName } : b));
      setUserCreatedSeries(prev => prev.map(n => n === oldName ? newName : n));
      if (selected) {
        const newOrder = (collanaOrder[selected] || []).map(n => n === oldName ? newName : n);
        saveCollanaOrder(selected, newOrder);
        if (pubSeries[selected]) {
          setPubSeries(ps => ({
            ...ps,
            [selected]: (ps[selected] || []).map(s => s.series_name === oldName ? { ...s, series_name: newName } : s),
          }));
        }
      }
      toast(`Collana rinominata in "${newName}"`, 'success');
    } catch { toast('Errore durante la rinomina', 'error'); }
  }

  /* ── Elimina collana ── */
  async function deleteCollana(seriesName) {
    const affected = books.filter(b => b.series_name === seriesName);
    try {
      await Promise.all(affected.map(b => booksApi.update(b.id, { series_name: null })));
      setBooks(prev => prev.map(b => b.series_name === seriesName ? { ...b, series_name: null } : b));
      setUserCreatedSeries(prev => prev.filter(n => n !== seriesName));
      if (selected && pubSeries[selected]) {
        setPubSeries(ps => ({ ...ps, [selected]: (ps[selected] || []).filter(s => s.series_name !== seriesName) }));
      }
      toast(`Collana "${seriesName}" rimossa (${affected.length} ${affected.length === 1 ? 'libro' : 'libri'})`, 'success');
    } catch { toast('Errore durante l\'eliminazione', 'error'); }
  }

  /* ── Crea collana ── */
  function createCollana(name) {
    setShowCreateCollana(false);
    if (!name.trim() || allSectionNames.includes(name.trim())) return;
    setUserCreatedSeries(prev => [...prev, name.trim()]);
  }

  /* ── Drag libri factory ── */
  function makeDragOver(sectionKey) {
    return e => { if (!draggingBook) return; e.preventDefault(); setDropSection(sectionKey); };
  }
  function makeDragLeave(sectionKey) {
    return e => { if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) setDropSection(s => s === sectionKey ? null : s); };
  }
  function makeDrop(sectionName) {
    return e => {
      e.preventDefault();
      if (draggingBook) {
        const target = sectionName === '__none__' ? null : sectionName;
        if (selectedBooks.size > 0 && selectedBooks.has(draggingBook.id)) {
          books.filter(b => selectedBooks.has(b.id)).forEach(b => assignSeries(b, target));
          setSelectedBooks(new Set());
        } else {
          assignSeries(draggingBook, target);
        }
      }
      setDraggingBook(null); setDropSection(null);
    };
  }

  /* ── Drag sezioni factory ── */
  function makeSectionDragStart(name) {
    return e => { e.stopPropagation(); draggingSection.current = name; e.dataTransfer.effectAllowed = 'move'; };
  }
  function makeSectionDragOver(name) {
    return e => {
      if (!draggingSection.current || draggingSection.current === name) return;
      e.preventDefault(); e.stopPropagation(); setSectionDropTarget(name);
    };
  }
  function makeSectionDragLeave(name) {
    return e => { if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) setSectionDropTarget(s => s === name ? null : s); };
  }
  function makeSectionDrop(name) {
    return e => {
      e.preventDefault(); e.stopPropagation();
      if (draggingSection.current && draggingSection.current !== name) reorderCollane(draggingSection.current, name);
      draggingSection.current = null; setSectionDropTarget(null);
    };
  }

  /* ── Collapse ── */
  function toggleCollapse(name) {
    const key = name === null ? '__none__' : name;
    setCollapsedSections(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }

  /* ── Multi-select fuori collana ── */
  function toggleSelectBook(bookId) {
    if (bookId === null) { setSelectedBooks(new Set()); return; }
    setSelectedBooks(prev => { const next = new Set(prev); next.has(bookId) ? next.delete(bookId) : next.add(bookId); return next; });
  }

  /* ── Cleanup globale drag ── */
  useEffect(() => {
    function cleanup() { setDraggingBook(null); setDropSection(null); draggingSection.current = null; setSectionDropTarget(null); }
    document.addEventListener('dragend', cleanup);
    return () => document.removeEventListener('dragend', cleanup);
  }, []);

  const sortedPublishers = useMemo(() => [...publishers].sort((a, b) => {
    if (sortMode === 'az')         return a.name.localeCompare(b.name);
    if (sortMode === 'za')         return b.name.localeCompare(a.name);
    if (sortMode === 'books_desc') return b.book_count - a.book_count;
    return a.book_count - b.book_count;
  }), [publishers, sortMode]);

  /* ── Merge modal ── */
  function openMerge()  { setCheckedNames(new Set()); setKeepName(''); setModalSearch(''); setShowMerge(true); }
  function closeMerge() { setShowMerge(false); setCheckedNames(new Set()); setKeepName(''); setModalSearch(''); }

  function toggleCheck(name) {
    setCheckedNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) { next.delete(name); if (keepName === name) setKeepName(next.size > 0 ? [...next][0] : ''); }
      else { next.add(name); if (!keepName) setKeepName(name); }
      return next;
    });
  }

  async function doMerge() {
    if (!keepName || checkedNames.size < 2) return;
    const toMerge = [...checkedNames].filter(n => n !== keepName);
    setMerging(true);
    try {
      for (const name of toMerge) await publishersApi.merge(keepName, name);
      toast(`${toMerge.length} ${toMerge.length === 1 ? 'editore unificato' : 'editori unificati'} in "${keepName}"`, 'success');
      if (selected && new Set(toMerge).has(selected)) setSelected(keepName);
      closeMerge(); load();
    } catch (e) { toast('Errore: ' + e.message, 'error'); }
    setMerging(false);
  }

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: '28px 36px 0', display: 'flex', flexDirection: 'column', gap: 18, height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
        <div>
          <div className="m-eyebrow" style={{ marginBottom: 4 }}>Capitulum VI</div>
          <div style={{
            fontFamily: "'Cinzel', 'Mantinia', serif",
            fontSize: 42, fontWeight: 400, lineHeight: 1.05, color: 'var(--cine-cream)',
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            Editori
            <em style={{
              fontFamily: "'Agmena Pro', 'EB Garamond', Georgia, serif",
              fontSize: 22, fontStyle: 'italic', fontWeight: 400,
              color: 'var(--cine-gold)', letterSpacing: '0.01em',
              textTransform: 'none', marginLeft: '0.4em',
            }}>· {total}</em>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="m-searchbar" style={{ width: 220 }}>
            <ORN.quill size={14} style={{ color: 'var(--m-ink-muted)' }}/>
            <input placeholder="cerca editore…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <select className="m-select" style={{ fontSize: 13, padding: '4px 24px 4px 8px' }}
            value={sortMode} onChange={e => setSortMode(e.target.value)}>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="books_desc">più libri prima</option>
            <option value="books_asc">meno libri prima</option>
          </select>
          <button className="m-btn m-btn-ghost" onClick={openMerge}>⇄ unifica</button>
        </div>
      </div>

      {/* Due pannelli */}
      <div style={{ borderTop: '1px solid var(--cine-gold-dim)', flex: 1, display: 'flex', minHeight: 0 }}>

        {/* ── Pannello sinistro ── */}
        <div style={{ width: 260, borderRight: '1px solid var(--m-rule)', overflowY: 'auto', flexShrink: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="m-spinner"/></div>
          ) : sortedPublishers.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--m-ink-muted)', fontStyle: 'italic', fontSize: 14 }}>Nessun editore</div>
          ) : sortedPublishers.map(p => {
            const isSelected = selected === p.name;
            const isExpanded = expandedPubs.has(p.name);
            const sLoading   = pubSeriesLoading.has(p.name);
            const series     = pubSeries[p.name] || [];
            return (
              <div key={p.name}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '10px 10px 10px 16px', cursor: 'pointer',
                    borderBottom: isExpanded ? 'none' : '1px solid var(--m-rule)',
                    background: isSelected ? 'var(--m-rule)' : 'transparent',
                    transition: 'background 120ms',
                  }}
                  onClick={() => setSelected(p.name)}
                >
                  <div className="m-serif" style={{ flex: 1, fontSize: 14, lineHeight: 1.2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <span className="m-nums" style={{ fontSize: 12, color: 'var(--m-ink-muted)', flexShrink: 0, marginLeft: 6 }}>
                    {p.book_count}
                  </span>
                  <button
                    title={isExpanded ? 'Nascondi collane' : 'Mostra collane'}
                    onClick={e => toggleExpand(e, p.name)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '2px 4px', color: 'var(--m-ink-muted)',
                      fontSize: 10, flexShrink: 0, marginLeft: 4, lineHeight: 1,
                      transition: 'transform 150ms',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  >▶</button>
                </div>

                {isExpanded && (
                  <div style={{ borderBottom: '1px solid var(--m-rule)', background: 'color-mix(in srgb, var(--m-ink) 3%, var(--m-parchment))' }}>
                    {sLoading ? (
                      <div style={{ padding: '8px 20px' }}><div className="m-spinner" style={{ width: 12, height: 12 }}/></div>
                    ) : series.length === 0 ? (
                      <div style={{ padding: '7px 20px', fontSize: 12, color: 'var(--m-ink-muted)', fontStyle: 'italic' }}>
                        Nessuna collana
                      </div>
                    ) : series.map(s => (
                      <div
                        key={s.series_name}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 10px 6px 22px', cursor: 'pointer', fontSize: 13,
                          color: 'var(--m-ink)', transition: 'background 100ms',
                        }}
                        onClick={() => {
                          setSelected(p.name);
                          setScrollToSection(s.series_name);
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--m-rule)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ color: 'var(--m-rule-strong)', fontSize: 9, flexShrink: 0 }}>◆</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.series_name}</span>
                        <span className="m-nums" style={{ fontSize: 11, color: 'var(--m-ink-muted)', flexShrink: 0 }}>{s.book_count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Pannello destro ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div className="m-serif" style={{ fontSize: 20, fontStyle: 'italic', color: 'var(--m-ink-muted)' }}>
                Seleziona un editore
              </div>
            </div>
          ) : booksLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="m-spinner"/></div>
          ) : (
            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 32px 40px' }}>

              {/* Header editore */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                  <div className="m-serif" style={{ fontSize: 30, fontWeight: 500 }}>{selected}</div>
                  <div className="m-eyebrow" style={{ marginTop: 4 }}>
                    {books.length} {books.length === 1 ? 'volume' : 'volumi'}
                    {seriesList.length > 0 && (
                      <span style={{ marginLeft: 8, color: 'var(--m-ink-muted)' }}>
                        · {seriesList.length} {seriesList.length === 1 ? 'collana' : 'collane'}
                      </span>
                    )}
                  </div>
                  {draggingBook && (
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--m-terracotta)', fontStyle: 'italic' }}>
                      {selectedBooks.size > 1 && selectedBooks.has(draggingBook.id)
                        ? `Trascina ${selectedBooks.size} libri in una collana →`
                        : 'Trascina in una collana per assegnare →'}
                    </div>
                  )}
                </div>
                <button className="m-btn m-btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowCreateCollana(true)}>
                  + nuova collana
                </button>
              </div>

              {/* Sezioni collane */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

                {orderedSections.map(name => (
                  <CollanaSection
                    key={name}
                    name={name}
                    booksList={sortedBooks.filter(b => b.series_name === name)}
                    isDragOver={dropSection === name}
                    onDragOver={makeDragOver(name)}
                    onDragLeave={makeDragLeave(name)}
                    onDrop={makeDrop(name)}
                    onDelete={() => deleteCollana(name)}
                    onRename={newName => renameCollana(name, newName)}
                    onNavigate={id => navigate(`/libro/${id}`)}
                    onDragStart={book => {
                      if (selectedBooks.size > 0 && !selectedBooks.has(book.id)) setSelectedBooks(new Set());
                      setDraggingBook(book);
                    }}
                    onDragEnd={() => { setDraggingBook(null); setDropSection(null); }}
                    draggingBookId={draggingBook?.id}
                    isSectionDragOver={sectionDropTarget === name}
                    onSectionDragStart={makeSectionDragStart(name)}
                    onSectionDragOver={makeSectionDragOver(name)}
                    onSectionDragLeave={makeSectionDragLeave(name)}
                    onSectionDrop={makeSectionDrop(name)}
                    isCollapsed={collapsedSections.has(name)}
                    onToggleCollapse={() => toggleCollapse(name)}
                    onContextMenu={(e, book) => setContextMenu({ x: e.clientX, y: e.clientY, book })}
                    sectionRef={el => { sectionRefs.current[name] = el; }}
                  />
                ))}

                {/* Fuori collana — sempre in fondo */}
                {(noSeriesBooks.length > 0 || books.length === 0) && (
                  <CollanaSection
                    name={null}
                    booksList={noSeriesBooks}
                    isDragOver={dropSection === '__none__'}
                    onDragOver={makeDragOver('__none__')}
                    onDragLeave={makeDragLeave('__none__')}
                    onDrop={makeDrop('__none__')}
                    onNavigate={id => navigate(`/libro/${id}`)}
                    onDragStart={book => setDraggingBook(book)}
                    onDragEnd={() => { setDraggingBook(null); setDropSection(null); }}
                    draggingBookId={draggingBook?.id}
                    isCollapsed={collapsedSections.has('__none__')}
                    onToggleCollapse={() => toggleCollapse(null)}
                    selectedBooks={selectedBooks}
                    onToggleSelect={toggleSelectBook}
                    onContextMenu={(e, book) => setContextMenu({ x: e.clientX, y: e.clientY, book })}
                    sectionRef={el => { sectionRefs.current['__none__'] = el; }}
                  />
                )}

                {books.length === 0 && (
                  <div className="m-body" style={{ color: 'var(--m-ink-muted)', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                    Nessun libro per questo editore
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          book={contextMenu.book}
          allSectionNames={allSectionNames}
          onAssign={assignSeries}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Modal nuova collana */}
      {showCreateCollana && (
        <CreateCollanaModal onSave={createCollana} onClose={() => setShowCreateCollana(false)}/>
      )}

      {/* Modal unificazione editori */}
      {showMerge && (() => {
        const filtered    = publishers.filter(p => !modalSearch || p.name.toLowerCase().includes(modalSearch.toLowerCase()));
        const checkedList = publishers.filter(p => checkedNames.has(p.name));
        const toMergeList = checkedList.filter(p => p.name !== keepName);
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div style={{ background: 'var(--m-parchment)', padding: 32, width: 680, height: '82vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--m-rule)' }}>
              <div className="m-serif" style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>Unifica editori</div>
              <p className="m-body" style={{ fontSize: 13, color: 'var(--m-ink-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                Seleziona gli editori da unificare (almeno 2) e scegli quale mantenere.
              </p>
              <div className="m-searchbar" style={{ marginBottom: 8, flexShrink: 0 }}>
                <ORN.quill size={13} style={{ color: 'var(--m-ink-muted)' }}/>
                <input placeholder="filtra editori…" value={modalSearch} onChange={e => setModalSearch(e.target.value)} autoFocus/>
              </div>
              <div style={{ overflowY: 'auto', border: '1px solid var(--m-rule)', flex: '1 1 0', minHeight: 100 }}>
                {filtered.length === 0 && (
                  <div style={{ padding: 20, color: 'var(--m-ink-muted)', fontSize: 13, textAlign: 'center' }}>Nessun risultato</div>
                )}
                {filtered.map(p => (
                  <label key={p.name} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                    cursor: 'pointer', borderBottom: '1px solid var(--m-rule)',
                    background: checkedNames.has(p.name) ? 'color-mix(in srgb, var(--m-terracotta) 8%, transparent)' : 'transparent',
                    transition: 'background 100ms',
                  }}>
                    <input type="checkbox" checked={checkedNames.has(p.name)} onChange={() => toggleCheck(p.name)}
                      style={{ cursor: 'pointer', accentColor: 'var(--m-terracotta)', width: 15, height: 15, flexShrink: 0 }}/>
                    <span className="m-serif" style={{ flex: 1, fontSize: 15 }}>{p.name}</span>
                    <span className="m-nums" style={{ fontSize: 12, color: 'var(--m-ink-muted)', marginRight: 2 }}>{p.book_count}</span>
                  </label>
                ))}
              </div>
              {checkedNames.size >= 2 && (
                <div style={{ marginTop: 14, flexShrink: 0 }}>
                  <label className="m-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Mantieni come principale</label>
                  <select className="m-select" style={{ width: '100%' }} value={keepName} onChange={e => setKeepName(e.target.value)}>
                    {checkedList.map(p => <option key={p.name} value={p.name}>{p.name} ({p.book_count} {p.book_count === 1 ? 'libro' : 'libri'})</option>)}
                  </select>
                </div>
              )}
              {toMergeList.length > 0 && keepName && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--m-rule)', fontSize: 13, lineHeight: 1.5, flexShrink: 0 }}>
                  <span className="m-eyebrow">Riepilogo · </span>
                  {toMergeList.map(p => `"${p.name}"`).join(', ')} → <strong>"{keepName}"</strong>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span className="m-body" style={{ fontSize: 13, color: 'var(--m-ink-muted)' }}>
                  {checkedNames.size === 0 ? 'Nessuna selezione' : `${checkedNames.size} selezionati`}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="m-btn m-btn-ghost" onClick={closeMerge}>Annulla</button>
                  <button className="m-btn" disabled={checkedNames.size < 2 || !keepName || merging} onClick={doMerge}>
                    {merging ? '…' : `⇄ Unifica ${checkedNames.size >= 2 ? checkedNames.size : ''}`}
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
