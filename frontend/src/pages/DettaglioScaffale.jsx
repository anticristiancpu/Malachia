import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import { shelves as shelvesApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';

const SEC_DEFAULT = '__default__';

/* ── localStorage helpers ── */
function lsKey(shelfId) { return `malachia-shelf-sections-${shelfId}`; }

function loadSections(shelfId, allBooks) {
  try {
    const raw = JSON.parse(localStorage.getItem(lsKey(shelfId)) || 'null');
    if (!raw || raw.length === 0) throw new Error('empty');
    const allIds  = new Set(allBooks.map(b => b.id));
    const inMeta  = new Set(raw.flatMap(s => s.bookIds));
    const newItems = allBooks.map(b => b.id).filter(id => !inMeta.has(id));
    // Individua la sezione "principale" (quella che accoglie i nuovi libri)
    const defaultIdx = raw.findIndex(s => s.id === SEC_DEFAULT);
    const sections = raw.map((s, i) => ({
      ...s,
      bookIds: [
        ...s.bookIds.filter(id => allIds.has(id)),
        ...(i === (defaultIdx >= 0 ? defaultIdx : 0) ? newItems : []),
      ],
    }));
    // Se non c'è nessuna sezione SEC_DEFAULT ma ci sono sezioni, aggiungi i nuovi alla prima
    if (defaultIdx === -1 && newItems.length > 0 && sections.length > 0) {
      sections[0] = { ...sections[0], bookIds: [...sections[0].bookIds, ...newItems] };
    }
    return sections.length > 0 ? sections : [{ id: SEC_DEFAULT, name: null, bookIds: allBooks.map(b => b.id) }];
  } catch {
    return [{ id: SEC_DEFAULT, name: null, bookIds: allBooks.map(b => b.id) }];
  }
}

function saveSections(shelfId, sections) {
  localStorage.setItem(lsKey(shelfId), JSON.stringify(sections));
}

/* ─── BookContextMenu ─────────────────────────────────────────────────────── */
function BookContextMenu({ x, y, book, sections, onMoveToSection, onRemove, onClose, onNavigate }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useEffect(() => {
    if (!ref.current) return;
    const r  = ref.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    setPos({
      left: r.right  > vw ? Math.max(4, x - r.width)  : x,
      top:  r.bottom > vh ? Math.max(4, y - r.height) : y,
    });
  }, [x, y]);

  useEffect(() => {
    function onMouse(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    function onKey(e)   { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown',   onKey);
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const currentSectionId = sections.find(s => s.bookIds.includes(book.id))?.id;

  return (
    <div ref={ref} style={{
      position: 'fixed', left: pos.left, top: pos.top, zIndex: 600,
      background: 'var(--m-parchment)', border: '1px solid var(--m-rule)',
      boxShadow: '0 4px 18px rgba(0,0,0,0.18)', minWidth: 210,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '8px 12px 7px', borderBottom: '1px solid var(--m-rule)' }}>
        <div className="m-eyebrow" style={{ fontSize: 10 }}>Sposta in sottosezione</div>
        <div className="m-serif" style={{ fontSize: 13, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 230 }}>
          {book.title}
        </div>
      </div>

      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {sections.map(sec => {
          const isCurrent = sec.id === currentSectionId;
          const label = sec.name || 'Sezione generica';
          return (
            <div key={sec.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', cursor: isCurrent ? 'default' : 'pointer', fontSize: 13,
                background: isCurrent ? 'color-mix(in srgb, var(--m-terracotta) 9%, transparent)' : 'transparent',
                color: isCurrent ? 'var(--m-terracotta)' : 'var(--m-ink)',
                fontWeight: isCurrent ? 600 : 400, transition: 'background 100ms',
              }}
              onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--m-rule)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = isCurrent ? 'color-mix(in srgb, var(--m-terracotta) 9%, transparent)' : 'transparent'; }}
              onClick={() => { if (!isCurrent) { onMoveToSection(book, sec.id); onClose(); } }}
            >
              {isCurrent && <span style={{ fontSize: 10 }}>✓</span>}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid var(--m-rule)' }}>
        <div
          style={{ padding: '7px 14px', cursor: 'pointer', fontSize: 12, color: 'var(--m-ink-muted)', transition: 'background 100ms' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--m-rule)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          onClick={() => { onClose(); onNavigate(book.id); }}
        >› apri dettaglio libro</div>
        <div
          style={{ padding: '7px 14px', cursor: 'pointer', fontSize: 12, color: '#c0392b', transition: 'background 100ms' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.07)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          onClick={() => { onRemove(book); onClose(); }}
        >× rimuovi dallo scaffale</div>
      </div>
    </div>
  );
}

/* ─── CreateSectionModal ─────────────────────────────────────────────────── */
function CreateSectionModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
      <div style={{ background: 'var(--m-parchment)', padding: 28, width: 380, border: '1px solid var(--m-rule)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="m-serif" style={{ fontSize: 18, fontWeight: 500 }}>Nuova sottosezione</div>
        <div className="m-field">
          <label>Nome</label>
          <input
            className="m-input" value={name} autoFocus
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave(name.trim()); if (e.key === 'Escape') onClose(); }}
            placeholder="es. Letti · Da rileggere · Preferiti…"
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

/* ─── SectionBlock ─────────────────────────────────────────────────────────── */
function SectionBlock({
  section, booksMap, canDelete,
  isSectionDragOver,
  onSectionDragStart, onSectionDragOver, onSectionDragLeave, onSectionDrop,
  isCollapsed, onToggleCollapse,
  onRename, onDelete,
  onBookContextMenu, onNavigate,
}) {
  const [renaming,   setRenaming]   = useState(false);
  const [renameVal,  setRenameVal]  = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  const isDefault = section.id === SEC_DEFAULT;
  const displayName = section.name || 'Sezione generica';
  const books = section.bookIds.map(id => booksMap[id]).filter(Boolean);

  function startRename() { setRenameVal(section.name || ''); setRenaming(true); }
  function commitRename() {
    const v = renameVal.trim();
    if (v !== section.name) onRename(section.id, v || null);
    setRenaming(false);
  }

  return (
    <div
      style={{
        borderTop: isSectionDragOver ? '3px solid var(--m-terracotta)' : '3px solid transparent',
        transition: 'border-color 150ms',
      }}
      onDragOver={onSectionDragOver}
      onDragLeave={onSectionDragLeave}
      onDrop={onSectionDrop}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isCollapsed ? 0 : 16 }}>

        {/* Drag handle — tutte le sezioni */}
        <div
          draggable
          onDragStart={e => { e.stopPropagation(); onSectionDragStart(e); }}
          title="Trascina per riordinare"
          style={{ cursor: 'grab', color: 'var(--m-ink-muted)', fontSize: 15, flexShrink: 0, userSelect: 'none', lineHeight: 1 }}
        >⠿</div>

        {/* Titolo o rename input */}
        {renaming ? (
          <input
            className="m-input" value={renameVal} autoFocus
            onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false); }}
            onBlur={commitRename}
            style={{ fontSize: 18, fontFamily: "'EB Garamond', serif", fontWeight: 500, flex: '0 1 280px', padding: '2px 8px' }}
          />
        ) : (
          <div className="m-serif" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.1, flexShrink: 0 }}>
            {displayName}
          </div>
        )}

        <div style={{ flex: 1, height: 1, background: 'var(--m-rule)' }}/>

        <span className="m-nums" style={{ fontSize: 11, color: 'var(--m-ink-muted)', flexShrink: 0 }}>
          {books.length} {books.length === 1 ? 'vol.' : 'vol.'}
        </span>

        {/* Rename */}
        {!renaming && !confirmDel && (
          <button
            className="m-btn m-btn-ghost m-btn-sm"
            style={{ fontSize: 11, color: 'var(--m-ink-muted)' }}
            onClick={startRename}
          >✎ rinomina</button>
        )}

        {/* Delete */}
        {!confirmDel && !renaming && canDelete && (
          <button
            className="m-btn m-btn-ghost m-btn-sm"
            style={{ fontSize: 11, color: 'var(--m-ink-muted)' }}
            onClick={() => setConfirmDel(true)}
          >× elimina</button>
        )}
        {confirmDel && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'var(--m-ink-muted)', whiteSpace: 'nowrap' }}>Eliminare la sezione?</span>
            <button className="m-btn m-btn-sm" style={{ fontSize: 11 }}
              onClick={() => { onDelete(section.id); setConfirmDel(false); }}>Sì</button>
            <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11 }}
              onClick={() => setConfirmDel(false)}>No</button>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--m-ink-muted)', fontSize: 13, flexShrink: 0, padding: '2px 4px',
            transition: 'transform 150ms', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
          onClick={onToggleCollapse} title={isCollapsed ? 'Espandi' : 'Comprimi'}
        >▾</button>
      </div>

      {/* ── Griglia libri (multi-riga, flex-wrap) ── */}
      {!isCollapsed && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '20px 16px',
          alignItems: 'flex-start', alignContent: 'flex-start',
          paddingBottom: 8, minHeight: 240,
        }}>
          {books.length === 0 ? (
            <div style={{
              width: '100%', textAlign: 'center', padding: '32px 0',
              color: 'var(--m-ink-muted)', fontStyle: 'italic', fontSize: 14,
              fontFamily: "'EB Garamond', serif",
            }}>
              {isDefault ? 'Nessun libro non assegnato' : 'Nessun libro in questa sezione'}
            </div>
          ) : books.map(b => (
            <div
              key={b.id}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', width: 150 }}
              onClick={() => onNavigate(b.id)}
              onContextMenu={e => { e.preventDefault(); onBookContextMenu(e, b); }}
            >
              <BookCover book={b} w={150} h={216}/>
              <div className="m-serif" style={{
                fontSize: 14, textAlign: 'center', lineHeight: 1.2,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                width: '100%',
              }}>{b.title}</div>
              {b.author_names && (
                <div className="m-marginalia" style={{
                  fontSize: 12, textAlign: 'center', color: 'var(--m-ink-muted)', lineHeight: 1.2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%',
                }}>{b.author_names}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGINA PRINCIPALE
════════════════════════════════════════════════════════════════════════════ */
export default function DettaglioScaffale() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const [shelf,   setShelf]   = useState(null);
  const [loading, setLoading] = useState(true);

  const [sections,          setSections]          = useState([]);
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [showCreateSection, setShowCreateSection] = useState(false);

  // Drag sezioni
  const draggingSection   = useRef(null);
  const [sectionDropTarget, setSectionDropTarget] = useState(null);

  // Context menu libro
  const [contextMenu, setContextMenu] = useState(null);

  /* ── Carica scaffale ── */
  useEffect(() => {
    shelvesApi.get(id)
      .then(s => {
        setShelf(s);
        setSections(loadSections(id, s.books || []));
        setLoading(false);
      })
      .catch(() => navigate('/scaffali'));
  }, [id]);

  /* ── Mappa id → libro ── */
  const booksMap = shelf
    ? Object.fromEntries((shelf.books || []).map(b => [b.id, b]))
    : {};

  /* ── Salva sezioni ── */
  function updateSections(next) {
    setSections(next);
    saveSections(id, next);
  }

  /* ── Crea sezione ── */
  function createSection(name) {
    setShowCreateSection(false);
    const newSec = { id: `sec-${Date.now()}`, name, bookIds: [] };
    updateSections([...sections, newSec]);
  }

  /* ── Rinomina sezione ── */
  function renameSection(secId, newName) {
    updateSections(sections.map(s => s.id === secId ? { ...s, name: newName } : s));
  }

  /* ── Elimina sezione (libri → prima sezione rimanente) ── */
  function deleteSection(secId) {
    if (sections.length <= 1) {
      toast('Non puoi eliminare l\'unica sezione', 'error');
      return;
    }
    const sec     = sections.find(s => s.id === secId);
    if (!sec) return;
    const orphans  = sec.bookIds;
    let remaining  = sections.filter(s => s.id !== secId);

    // I libri orfani vanno alla prima sezione rimanente
    remaining = remaining.map((s, i) =>
      i === 0 ? { ...s, bookIds: [...s.bookIds, ...orphans] } : s
    );

    // Se la sezione eliminata era SEC_DEFAULT, la prima rimanente diventa il nuovo default
    if (secId === SEC_DEFAULT) {
      remaining = remaining.map((s, i) => i === 0 ? { ...s, id: SEC_DEFAULT } : s);
    }

    updateSections(remaining);
  }

  /* ── Sposta libro in sezione ── */
  function moveBookToSection(book, targetSecId) {
    const next = sections.map(s => ({
      ...s,
      bookIds: s.id === targetSecId
        ? (s.bookIds.includes(book.id) ? s.bookIds : [...s.bookIds, book.id])
        : s.bookIds.filter(bid => bid !== book.id),
    }));
    updateSections(next);
  }

  /* ── Rimuovi libro dallo scaffale ── */
  async function removeBook(book) {
    try {
      await shelvesApi.removeBook(id, book.id);
      setShelf(sh => ({
        ...sh,
        books: (sh.books || []).filter(b => b.id !== book.id),
        book_count: Math.max(0, (sh.book_count || 0) - 1),
      }));
      updateSections(sections.map(s => ({ ...s, bookIds: s.bookIds.filter(bid => bid !== book.id) })));
      toast(`"${book.title}" rimosso dallo scaffale`, 'success');
    } catch { toast('Errore durante la rimozione', 'error'); }
  }

  /* ── Drag sezioni ── */
  function makeSectionDragStart(secId) {
    return e => { e.stopPropagation(); draggingSection.current = secId; e.dataTransfer.effectAllowed = 'move'; };
  }
  function makeSectionDragOver(secId) {
    return e => {
      if (!draggingSection.current || draggingSection.current === secId) return;
      e.preventDefault(); e.stopPropagation(); setSectionDropTarget(secId);
    };
  }
  function makeSectionDragLeave(secId) {
    return e => {
      if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget))
        setSectionDropTarget(s => s === secId ? null : s);
    };
  }
  function makeSectionDrop(secId) {
    return e => {
      e.preventDefault(); e.stopPropagation();
      if (draggingSection.current && draggingSection.current !== secId) {
        const from = sections.findIndex(s => s.id === draggingSection.current);
        const to   = sections.findIndex(s => s.id === secId);
        if (from !== -1 && to !== -1) {
          const next = [...sections];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          updateSections(next);
        }
      }
      draggingSection.current = null; setSectionDropTarget(null);
    };
  }

  /* ── Cleanup drag globale ── */
  useEffect(() => {
    function cleanup() { draggingSection.current = null; setSectionDropTarget(null); }
    document.addEventListener('dragend', cleanup);
    return () => document.removeEventListener('dragend', cleanup);
  }, []);

  /* ── Toggle collapse ── */
  function toggleCollapse(secId) {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(secId) ? next.delete(secId) : next.add(secId);
      return next;
    });
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div className="m-spinner"/>
    </div>
  );
  if (!shelf) return null;

  const totalBooks = (shelf.books || []).length;

  return (
    <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexShrink: 0 }}>
        <div>
          <button className="m-btn m-btn-ghost m-btn-sm" style={{ marginBottom: 10 }} onClick={() => navigate('/scaffali')}>
            ‹ Scaffali
          </button>
          <div className="m-eyebrow">{totalBooks} {totalBooks === 1 ? 'volume' : 'volumi'}</div>
          <div className="m-serif" style={{ fontSize: 38, fontWeight: 500, lineHeight: 1.05, marginTop: 2 }}>{shelf.name}</div>
          {shelf.subtitle && <div className="m-marginalia" style={{ marginTop: 2 }}>{shelf.subtitle}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <button className="m-btn m-btn-ghost" onClick={() => setShowCreateSection(true)}>
            + sottosezione
          </button>
          <div style={{ fontSize: 11, color: 'var(--m-ink-muted)', fontStyle: 'italic' }}>
            Tasto destro su un libro per spostarlo o rimuoverlo
          </div>
        </div>
      </div>

      {/* Sezioni */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 40, paddingBottom: 40 }}>

        {sections.map(sec => (
          <SectionBlock
            key={sec.id}
            section={sec}
            booksMap={booksMap}
            canDelete={sections.length > 1}
            isSectionDragOver={sectionDropTarget === sec.id}
            onSectionDragStart={makeSectionDragStart(sec.id)}
            onSectionDragOver={makeSectionDragOver(sec.id)}
            onSectionDragLeave={makeSectionDragLeave(sec.id)}
            onSectionDrop={makeSectionDrop(sec.id)}
            isCollapsed={collapsedSections.has(sec.id)}
            onToggleCollapse={() => toggleCollapse(sec.id)}
            onRename={renameSection}
            onDelete={deleteSection}
            onBookContextMenu={(e, book) => setContextMenu({ x: e.clientX, y: e.clientY, book })}
            onNavigate={bookId => navigate(`/libro/${bookId}`)}
          />
        ))}

        {totalBooks === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--m-ink-muted)', fontStyle: 'italic', fontFamily: "'EB Garamond', serif", fontSize: 18 }}>
            Scaffale vuoto — aggiungi libri con tasto destro dalla Libreria
          </div>
        )}
      </div>

      {/* Context menu libro */}
      {contextMenu && (
        <BookContextMenu
          x={contextMenu.x} y={contextMenu.y}
          book={contextMenu.book}
          sections={sections}
          onMoveToSection={moveBookToSection}
          onRemove={removeBook}
          onClose={() => setContextMenu(null)}
          onNavigate={bookId => navigate(`/libro/${bookId}`)}
        />
      )}

      {/* Modal nuova sezione */}
      {showCreateSection && (
        <CreateSectionModal
          onSave={createSection}
          onClose={() => setShowCreateSection(false)}
        />
      )}
    </div>
  );
}
