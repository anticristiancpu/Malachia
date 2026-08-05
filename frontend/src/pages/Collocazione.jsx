import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import { placement as placementApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';

/* ── Stili condivisi ──────────────────────────────────────────────────────── */
const cinzel = (size, tracking = '0.18em', color = 'var(--cine-cream)', weight = 500) => ({
  fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
  letterSpacing: tracking, fontSize: size, fontWeight: weight, color, lineHeight: 1.2,
});
const serif = { fontFamily: "'EB Garamond', Georgia, serif" };

const STATUS_LABELS = { tbr: 'Da leggere', reading: 'In lettura', read: 'Letto', abandoned: 'Abbandonato' };
const FORMAT_LABELS = { paperback: 'Brossura', hardcover: 'Cartonato', ebook: 'Ebook', audiobook: 'Audiolibro', comics: 'Fumetto' };
const LANG_LABELS   = { it: 'Italiano', en: 'Inglese', fr: 'Francese', de: 'Tedesco', es: 'Spagnolo', pt: 'Portoghese', la: 'Latino', el: 'Greco', ru: 'Russo' };
const SORT_LABELS   = { author: 'autore', title: 'titolo', year: 'anno', pages: 'pagine', publisher: 'editore', added_at: 'data aggiunta' };

const PANEL_BG   = 'rgba(13,9,5,0.55)';
const BORDER     = '1px solid var(--cine-border, rgba(216,180,106,0.22))';
const HOVER_BG   = 'rgba(216,180,106,0.10)';
const DROP_BG    = 'rgba(216,180,106,0.26)';

/* ── Icone ────────────────────────────────────────────────────────────────── */
const Chevron = ({ open, s = 8 }) => (
  <svg width={s} height={s} viewBox="0 0 8 8" fill="none" style={{
    transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 140ms', flexShrink: 0,
  }}>
    <path d="M2.5 1 L6 4 L2.5 7" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
  </svg>
);

/* ── Menu a tendina compatto per i filtri ─────────────────────────────────── */
function Select({ value, onChange, options, placeholder, allowEmpty = true }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        ...serif, fontSize: 12.5, padding: '3px 8px', cursor: 'pointer',
        background: 'rgba(0,0,0,0.35)', border: BORDER, outline: 'none',
        color: value && allowEmpty ? 'var(--cine-gold)' : 'rgba(232,220,192,0.72)',
      }}
    >
      {allowEmpty && <option value="" style={{ background: '#14100a' }}>{placeholder}</option>}
      {options.map(([v, label]) => (
        <option key={v} value={v} style={{ background: '#14100a', color: '#e8dcc0' }}>{label}</option>
      ))}
    </select>
  );
}

/* ── Card libro (trascinabile) ────────────────────────────────────────────── */
function BookCard({ book, w, selected, onSelect, onContextMenu, onDragStart, onDragEnd, onOpen }) {
  const [hover, setHover] = useState(false);
  const h = Math.round(w * 1.45);
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, book)}
      onDragEnd={onDragEnd}
      onClick={e => onSelect(book, e)}
      onDoubleClick={() => onOpen(book.id)}
      onContextMenu={e => onContextMenu(e, book)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={`${book.title}${book.author_names ? ' — ' + book.author_names : ''}\n(doppio clic: apri · tasto destro: colloca)`}
      style={{
        width: w, cursor: 'grab', position: 'relative', flexShrink: 0,
        outline: selected ? '2px solid var(--cine-gold)' : hover ? '1px solid rgba(216,180,106,0.45)' : '1px solid transparent',
        outlineOffset: 2, background: selected ? 'rgba(216,180,106,0.10)' : 'transparent',
        padding: 4, transition: 'outline-color 120ms, background 120ms',
      }}
    >
      <BookCover book={book} w={w - 8} h={h} />
      <div style={{
        ...serif, fontSize: 11, color: 'var(--cine-cream)', marginTop: 5, lineHeight: 1.25,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{book.title}</div>
      {book.author_names && (
        <div style={{
          ...serif, fontSize: 10, fontStyle: 'italic', color: 'rgba(232,220,192,0.55)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{book.author_names}</div>
      )}
      {selected && (
        <div style={{
          position: 'absolute', top: 6, left: 6, width: 16, height: 16,
          background: 'var(--cine-gold)', color: '#1a1206',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, lineHeight: 1, fontWeight: 700,
        }}>✓</div>
      )}
    </div>
  );
}

/* ── Riga elenco (trascinabile come la card) ──────────────────────────────── */
function BookRow({ book, selected, onSelect, onContextMenu, onDragStart, onDragEnd, onOpen, placementLabel }) {
  const [hover, setHover] = useState(false);
  const cell = { ...serif, fontSize: 12.5, color: 'rgba(232,220,192,0.72)', flexShrink: 0,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, book)}
      onDragEnd={onDragEnd}
      onClick={e => onSelect(book, e)}
      onDoubleClick={() => onOpen(book.id)}
      onContextMenu={e => onContextMenu(e, book)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={`${book.title}\n(doppio clic: apri · tasto destro: colloca)`}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '5px 10px', cursor: 'grab',
        background: selected ? 'rgba(216,180,106,0.16)' : hover ? 'rgba(216,180,106,0.06)' : 'transparent',
        borderBottom: '1px solid rgba(216,180,106,0.10)',
        borderLeft: selected ? '2px solid var(--cine-gold)' : '2px solid transparent',
      }}
    >
      <div style={{ width: 26, flexShrink: 0 }}>
        <BookCover book={book} w={26} h={38}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...serif, fontSize: 13.5, color: 'var(--cine-cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {book.title}
        </div>
        {book.author_names && (
          <div style={{ ...serif, fontSize: 11.5, fontStyle: 'italic', color: 'rgba(232,220,192,0.52)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {book.author_names}
          </div>
        )}
      </div>
      <div style={{ ...cell, width: 150 }}>{book.publisher || ''}</div>
      <div style={{ ...cell, width: 46, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{book.year || ''}</div>
      <div style={{ ...cell, width: 210, color: book.placement_id ? 'var(--cine-gold)' : 'rgba(232,220,192,0.28)', fontStyle: book.placement_id ? 'normal' : 'italic' }}>
        {placementLabel || 'da collocare'}
      </div>
    </div>
  );
}

/* ── Riga dell'albero (bersaglio di rilascio) ─────────────────────────────── */
function TreeRow({
  label, note, count, depth = 0, open, onToggle, hasChildren,
  sectionId, active, onActivate, onDrop, dragActive, droppable: droppableProp,
}) {
  const [over, setOver] = useState(false);
  const droppable = droppableProp ?? sectionId != null;

  return (
    <div
      onClick={() => { if (hasChildren) onToggle?.(); if (onActivate) onActivate(); }}
      onDragOver={e => { if (droppable) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { if (droppable) { e.preventDefault(); setOver(false); onDrop(sectionId); } }}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: `${depth === 0 ? 7 : 5}px 10px 5px ${10 + depth * 14}px`,
        cursor: 'pointer', userSelect: 'none',
        background: over ? DROP_BG : active ? 'rgba(216,180,106,0.14)' : 'transparent',
        borderLeft: active ? '2px solid var(--cine-gold)' : '2px solid transparent',
        outline: over ? '1px dashed var(--cine-gold)' : 'none',
        outlineOffset: -2,
        transition: 'background 110ms',
        // Durante il trascinamento evidenzia leggermente i bersagli validi
        boxShadow: dragActive && droppable && !over ? 'inset 0 0 0 1px rgba(216,180,106,0.14)' : 'none',
      }}
      onMouseEnter={e => { if (!over && !active) e.currentTarget.style.background = HOVER_BG; }}
      onMouseLeave={e => { if (!over && !active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ color: 'rgba(216,180,106,0.55)', width: 8, flexShrink: 0 }}>
        {hasChildren ? <Chevron open={open}/> : null}
      </span>
      <span style={{
        flex: 1, minWidth: 0,
        ...(depth === 0
          ? cinzel(11, '0.16em', 'var(--cine-cream)', 600)
          : depth === 1
            ? { ...serif, fontSize: 13, color: 'rgba(232,220,192,0.88)' }
            : { ...serif, fontSize: 12.5, color: 'rgba(232,220,192,0.72)' }),
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
        {note && <span style={{ fontStyle: 'italic', opacity: 0.5, fontSize: 11 }}> · {note}</span>}
      </span>
      {count > 0 && (
        <span style={{
          ...serif, fontSize: 11, color: 'var(--cine-gold)', flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}>{count}</span>
      )}
    </div>
  );
}

/* ── Voce del menu contestuale, con eventuale sottomenu ───────────────────── */
function MenuEntry({ label, note, count, submenu, onClick, danger, flipped }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
          cursor: onClick ? 'pointer' : 'default',
          background: open ? HOVER_BG : 'transparent',
          color: danger ? 'var(--cine-vermilion, #c4553d)' : 'var(--cine-cream)',
          ...serif, fontSize: 13, whiteSpace: 'nowrap',
        }}
      >
        <span style={{ flex: 1 }}>
          {label}
          {note && <span style={{ fontStyle: 'italic', opacity: 0.5, fontSize: 11 }}> · {note}</span>}
        </span>
        {count > 0 && <span style={{ fontSize: 11, color: 'var(--cine-gold)', opacity: 0.8 }}>{count}</span>}
        {submenu && <span style={{ color: 'rgba(216,180,106,0.7)' }}><Chevron open={false}/></span>}
      </div>
      {submenu && open && (
        <div style={{
          position: 'absolute', top: -4, ...(flipped ? { right: '100%' } : { left: '100%' }),
          background: 'rgba(13,9,5,0.98)', border: '1px solid rgba(216,180,106,0.34)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)', minWidth: 210,
          maxHeight: '70vh', overflowY: 'auto', zIndex: 10, padding: '4px 0',
        }}>{submenu}</div>
      )}
    </div>
  );
}

/* ── Menu contestuale (cascata Era › Periodo › Disciplina) ────────────────── */
function PlacementMenu({ x, y, tree, counts, targetCount, currentPlacement, onPick, onRemove, onOpen, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    setPos({
      left: r.right > vw - 240 ? Math.max(4, x - r.width) : x,
      top:  r.bottom > vh ? Math.max(4, vh - r.height - 6) : y,
    });
    setFlipped(x > vw - 560);
  }, [x, y]);

  useEffect(() => {
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey  = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const sectionLabel = t => (
    <div style={{ ...cinzel(9, '0.2em', 'rgba(232,220,192,0.42)'), padding: '8px 12px 4px' }}>{t}</div>
  );

  return (
    <div ref={ref} style={{
      position: 'fixed', left: pos.left, top: pos.top, zIndex: 900,
      background: 'rgba(13,9,5,0.98)', border: '1px solid rgba(216,180,106,0.34)',
      boxShadow: '0 10px 40px rgba(0,0,0,0.85)', minWidth: 250,
      maxHeight: '86vh', overflowY: 'auto', padding: '4px 0',
    }}>
      <div style={{ padding: '8px 12px 8px', borderBottom: BORDER }}>
        <div style={cinzel(9, '0.2em', 'rgba(232,220,192,0.45)')}>
          {targetCount > 1 ? `Colloca ${targetCount} volumi` : 'Colloca volume'}
        </div>
        {currentPlacement && (
          <div style={{ ...serif, fontSize: 11, fontStyle: 'italic', color: 'var(--cine-gold)', marginTop: 3 }}>
            attuale: {currentPlacement}
          </div>
        )}
      </div>

      {sectionLabel('Grandi Ere')}
      {tree.eras.map(era => (
        <MenuEntry
          key={era.id} label={era.name} note={era.range} flipped={flipped}
          submenu={era.periods.map(p => (
            <MenuEntry
              key={p.sectionId} label={p.name} note={p.range} flipped={flipped}
              count={counts[p.sectionId] || 0}
              // Cliccando il periodo si colloca lì; la disciplina si può scegliere dopo.
              onClick={() => onPick(p.sectionId)}
              submenu={
                <>
                  <div style={{ ...cinzel(9, '0.2em', 'rgba(232,220,192,0.42)'), padding: '8px 12px 4px' }}>
                    Disciplina
                  </div>
                  {p.sections.map(s => (
                    <MenuEntry key={s.id} label={s.name} count={counts[s.id] || 0}
                      onClick={() => onPick(s.id)}/>
                  ))}
                </>
              }
            />
          ))}
        />
      ))}

      {sectionLabel('Trasversale')}
      {tree.trasversale.map(t => (
        <MenuEntry key={t.id} label={t.name} note={t.note} count={counts[t.id] || 0}
          onClick={() => onPick(t.id)}/>
      ))}

      <div style={{ borderTop: BORDER, marginTop: 4, paddingTop: 4 }}>
        {currentPlacement && <MenuEntry label="✕ Rimuovi collocazione" danger onClick={onRemove}/>}
        {targetCount === 1 && <MenuEntry label="› Apri scheda del libro" onClick={onOpen}/>}
      </div>
    </div>
  );
}

/* ══ Pagina ═══════════════════════════════════════════════════════════════ */
export default function Collocazione() {
  const navigate = useNavigate();
  const toast    = useToast();

  const [tree,     setTree]     = useState(null);
  const [counts,   setCounts]   = useState({});
  const [totals,   setTotals]   = useState({ placed: 0, unplaced: 0 });
  const [section,  setSection]  = useState('unplaced');
  const [books,    setBooks]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [menu,     setMenu]     = useState(null);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set(['trasversale']));
  const [cardW,    setCardW]    = useState(() => Number(localStorage.getItem('malachia-coll-zoom')) || 104);
  const [view,     setView]     = useState(() => localStorage.getItem('malachia-coll-view') || 'grid');
  const [facets,   setFacets]   = useState({ statuses: [], formats: [], languages: [] });
  const [filters,  setFilters]  = useState({ status: '', format: '', language: '' });
  const [sort,     setSort]     = useState('author');
  const [dir,      setDir]      = useState('asc');

  const dragIdsRef = useRef([]);

  /* ── Caricamento ── */
  const loadTree = useCallback(() => {
    placementApi.tree()
      .then(t => { setTree(t); setCounts(t.counts || {}); setTotals(t.totals || { placed: 0, unplaced: 0 }); })
      .catch(() => toast('Errore nel caricamento delle sezioni', 'error'));
  }, [toast]);

  const loadBooks = useCallback(() => {
    setLoading(true);
    placementApi.books({
      section, search: search.trim() || undefined, limit: 1000, sort, dir,
      status:   filters.status   || undefined,
      format:   filters.format   || undefined,
      language: filters.language || undefined,
    })
      .then(r => { setBooks(r.books || []); setTotal(r.total || 0); })
      .catch(() => toast('Errore nel caricamento dei volumi', 'error'))
      .finally(() => setLoading(false));
  }, [section, search, sort, dir, filters, toast]);

  useEffect(() => { loadTree(); }, [loadTree]);
  useEffect(() => { placementApi.facets().then(setFacets).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(loadBooks, search ? 280 : 0); // debounce sulla ricerca
    return () => clearTimeout(t);
  }, [loadBooks, search]);
  useEffect(() => { setSelected(new Set()); }, [section]);

  /* ── Collocazione ── */
  const applyPlacement = useCallback(async (ids, placementId) => {
    if (!ids.length) return;
    try {
      const r = ids.length === 1
        ? await placementApi.set(ids[0], placementId)
        : await placementApi.bulk(ids, placementId);
      // Il libro esce dalla vista corrente (era "da collocare" o cambia sezione)
      setBooks(prev => prev.filter(b => !ids.includes(b.id)));
      setTotal(t => Math.max(0, t - ids.length));
      setSelected(new Set());
      loadTree();
      const dove = r.label || 'Nessuna collocazione';
      toast(ids.length > 1 ? `${ids.length} volumi → ${dove}` : `Collocato in ${dove}`, 'success');
    } catch {
      toast('Errore durante la collocazione', 'error');
    }
  }, [loadTree, toast]);

  /* ── Trascinamento ── */
  const handleDragStart = useCallback((e, book) => {
    // Se il libro trascinato è già selezionato, trascina l'intera selezione
    const ids = selected.has(book.id) ? [...selected] : [book.id];
    dragIdsRef.current = ids;
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ids.join(','));
  }, [selected]);

  const handleDrop = useCallback(sectionId => {
    const ids = dragIdsRef.current;
    dragIdsRef.current = [];
    setDragging(false);
    applyPlacement(ids, sectionId);
  }, [applyPlacement]);

  /* ── Selezione ── */
  const handleSelect = useCallback((book, e) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (e.shiftKey && prev.size > 0) { // range dall'ultimo selezionato
        const idx = books.findIndex(b => b.id === book.id);
        const last = books.findIndex(b => prev.has(b.id));
        const [from, to] = idx < last ? [idx, last] : [last, idx];
        for (let i = from; i <= to; i++) next.add(books[i].id);
      } else if (next.has(book.id)) next.delete(book.id);
      else next.add(book.id);
      return next;
    });
  }, [books]);

  /* ── Menu contestuale ── */
  const handleContextMenu = useCallback((e, book) => {
    e.preventDefault();
    // Se clicco su un libro non selezionato, il menu agisce solo su quello
    const ids = selected.has(book.id) ? [...selected] : [book.id];
    if (!selected.has(book.id)) setSelected(new Set([book.id]));
    setMenu({ x: e.clientX, y: e.clientY, ids, book });
  }, [selected]);

  const toggleNode = useCallback(key => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const onZoom = v => { setCardW(v); localStorage.setItem('malachia-coll-zoom', String(v)); };

  /* Volumi di un sotto-periodo: quelli assegnati al periodo stesso più quelli
     già scesi in una disciplina. */
  const periodTotal = useCallback(p =>
    (counts[p.sectionId] || 0) + p.sections.reduce((s, sec) => s + (counts[sec.id] || 0), 0),
  [counts]);

  /* ── Etichetta della vista corrente ── */
  /* Etichetta leggibile di una collocazione, con o senza disciplina. */
  const labelOf = useCallback(id => {
    if (!tree || !id) return null;
    const [a, b, c] = id.split('/');
    if (a === 'trasversale') return `Trasversale › ${tree.trasversale.find(t => t.id === id)?.name ?? ''}`;
    const era = tree.eras.find(e => e.id === a);
    const per = era?.periods.find(p => p.id === b);
    if (!era || !per) return null;
    if (!c) return `${era.name} › ${per.name}`;
    const dis = tree.disciplines.find(d => d.id === c);
    return dis ? `${era.name} › ${per.name} › ${dis.name}` : null;
  }, [tree]);

  const viewLabel = useMemo(
    () => section === 'unplaced' ? 'Da collocare' : (labelOf(section) ?? section),
    [section, labelOf]);

  const hasFilters = !!(filters.status || filters.format || filters.language || search.trim());

  const currentLabel = menu?.ids.length === 1 ? labelOf(menu.book.placement_id) : null;

  if (!tree) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="m-spinner"/>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Intestazione ── */}
      <div style={{ padding: '22px 30px 14px', flexShrink: 0 }}>
        <div style={cinzel(10, '0.24em', 'rgba(232,220,192,0.5)')}>Ordinatio</div>
        <div className="m-serif" style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.05, marginTop: 4, color: 'var(--cine-cream)' }}>
          Collocazione
        </div>
        <div style={{ ...serif, fontSize: 13, fontStyle: 'italic', color: 'rgba(232,220,192,0.5)', marginTop: 6, maxWidth: 760, lineHeight: 1.5 }}>
          Trascina le copertine sulle sezioni a sinistra, oppure usa il tasto destro.
          Il sotto-periodo è quello di cui l'opera <em>tratta</em>, non quello in cui è stata scritta.
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ ...serif, fontSize: 13, color: 'var(--cine-gold)' }}>
            {totals.placed} collocati
          </span>
          <span style={{ ...serif, fontSize: 13, color: totals.unplaced ? 'var(--cine-vermilion, #c4553d)' : 'rgba(232,220,192,0.5)' }}>
            {totals.unplaced} da collocare
          </span>
          {selected.size > 0 && (
            <span style={{ ...serif, fontSize: 13, color: 'var(--cine-cream)', borderLeft: BORDER, paddingLeft: 18 }}>
              {selected.size} selezionat{selected.size === 1 ? 'o' : 'i'}
              <button onClick={() => setSelected(new Set())}
                style={{ ...serif, marginLeft: 10, background: 'none', border: BORDER, color: 'rgba(232,220,192,0.7)', cursor: 'pointer', fontSize: 11, padding: '2px 8px' }}>
                azzera
              </button>
            </span>
          )}
        </div>
      </div>

      {/* ── Corpo: albero + griglia ── */}
      <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0, padding: '0 30px 24px' }}>

        {/* Albero delle sezioni */}
        <div style={{
          width: 340, flexShrink: 0, border: BORDER, background: PANEL_BG,
          overflowY: 'auto', maxHeight: 'calc(100vh - 230px)',
        }}>
          <div style={{ ...cinzel(9, '0.22em', 'rgba(232,220,192,0.45)'), padding: '11px 12px 7px', borderBottom: BORDER }}>
            Sezioni
          </div>

          {/* Da collocare — rilasciarci sopra un libro ne rimuove la collocazione */}
          <TreeRow
            label="Da collocare" note="senza sezione" count={totals.unplaced} depth={0}
            active={section === 'unplaced'} droppable
            onActivate={() => setSection('unplaced')}
            onDrop={() => handleDrop(null)} dragActive={dragging}
          />

          {/* Grandi Ere — periodi e discipline sono tutti bersagli di trascinamento */}
          {tree.eras.map(era => {
            const eraOpen = expanded.has(era.id);
            const eraCount = era.periods.reduce((sum, p) => sum + periodTotal(p), 0);
            return (
              <div key={era.id}>
                <TreeRow
                  label={`${era.numeral}. ${era.name}`} note={era.range} count={eraCount} depth={0}
                  open={eraOpen} hasChildren onToggle={() => toggleNode(era.id)}
                  dragActive={dragging}
                />
                {eraOpen && era.periods.map(p => (
                  <div key={p.sectionId}>
                    {/* Il sotto-periodo è collocabile di per sé: ci si può rilasciare sopra */}
                    <TreeRow
                      label={p.name} note={p.range} count={periodTotal(p)} depth={1}
                      sectionId={p.sectionId} active={section === p.sectionId}
                      onActivate={() => setSection(p.sectionId)}
                      onDrop={handleDrop} dragActive={dragging}
                    />
                    {p.sections.map(sec => (
                      <TreeRow
                        key={sec.id} label={sec.name} count={counts[sec.id] || 0} depth={2}
                        sectionId={sec.id} active={section === sec.id}
                        onActivate={() => setSection(sec.id)}
                        onDrop={handleDrop} dragActive={dragging}
                      />
                    ))}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Trasversale */}
          {(() => {
            const open = expanded.has('trasversale');
            const c = tree.trasversale.reduce((s, t) => s + (counts[t.id] || 0), 0);
            return (
              <>
                <TreeRow
                  label="Trasversale" note="più Grandi Ere" count={c} depth={0}
                  open={open} hasChildren onToggle={() => toggleNode('trasversale')}
                  dragActive={dragging}
                />
                {open && tree.trasversale.map(t => (
                  <TreeRow
                    key={t.id} label={t.name} count={counts[t.id] || 0} depth={1}
                    sectionId={t.id} active={section === t.id}
                    onActivate={() => setSection(t.id)}
                    onDrop={handleDrop} dragActive={dragging}
                  />
                ))}
              </>
            );
          })()}
        </div>

        {/* Griglia copertine */}
        <div style={{ flex: 1, minWidth: 0, border: BORDER, borderLeft: 'none', background: PANEL_BG, display: 'flex', flexDirection: 'column' }}>
          {/* Riga 1: titolo, ricerca, vista, zoom */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px',
            borderBottom: BORDER, flexShrink: 0, flexWrap: 'wrap',
          }}>
            <span style={cinzel(11, '0.16em', 'var(--cine-cream)', 600)}>{viewLabel}</span>
            <span style={{ ...serif, fontSize: 12, color: 'var(--cine-gold)' }}>{total}</span>
            <div style={{ flex: 1 }}/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="cerca titolo o autore…"
              style={{
                ...serif, fontSize: 13, padding: '5px 10px', width: 200,
                background: 'rgba(0,0,0,0.3)', border: BORDER, color: 'var(--cine-cream)', outline: 'none',
              }}
            />
            {/* Griglia | Elenco */}
            <div style={{ display: 'inline-flex', border: BORDER, flexShrink: 0 }}>
              {[['grid', '⊞', 'Griglia'], ['list', '☰', 'Elenco']].map(([v, icon, title]) => (
                <button key={v} title={title}
                  onClick={() => { setView(v); localStorage.setItem('malachia-coll-view', v); }}
                  style={{
                    padding: '4px 10px', background: view === v ? 'rgba(216,180,106,0.18)' : 'transparent',
                    border: 'none', cursor: 'pointer', fontSize: 13,
                    color: view === v ? 'var(--cine-cream)' : 'rgba(232,220,192,0.55)',
                  }}>{icon}</button>
              ))}
            </div>
            {view === 'grid' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: 'rgba(232,220,192,0.38)' }}>⊟</span>
                <input type="range" min={70} max={190} step={10} value={cardW}
                  onChange={e => onZoom(parseInt(e.target.value))}
                  style={{ width: 70, accentColor: 'var(--cine-gold)', cursor: 'pointer' }}/>
                <span style={{ fontSize: 11, color: 'rgba(232,220,192,0.38)' }}>⊞</span>
              </div>
            )}
          </div>

          {/* Riga 2: filtri e ordinamento */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
            borderBottom: BORDER, flexShrink: 0, flexWrap: 'wrap',
            background: 'rgba(0,0,0,0.18)',
          }}>
            <span style={cinzel(9, '0.2em', 'rgba(232,220,192,0.42)')}>Filtri</span>
            <Select value={filters.status} onChange={v => setFilters(f => ({ ...f, status: v }))}
              placeholder="Ogni stato"
              options={facets.statuses.map(s => [s.v, `${STATUS_LABELS[s.v] || s.v} (${s.n})`])}/>
            <Select value={filters.format} onChange={v => setFilters(f => ({ ...f, format: v }))}
              placeholder="Ogni formato"
              options={facets.formats.map(s => [s.v, `${FORMAT_LABELS[s.v] || s.v} (${s.n})`])}/>
            <Select value={filters.language} onChange={v => setFilters(f => ({ ...f, language: v }))}
              placeholder="Ogni lingua"
              options={facets.languages.map(s => [s.v, `${LANG_LABELS[s.v] || s.v} (${s.n})`])}/>
            {(filters.status || filters.format || filters.language) && (
              <button onClick={() => setFilters({ status: '', format: '', language: '' })}
                style={{ ...serif, fontSize: 11, background: 'none', border: BORDER,
                  color: 'var(--cine-gold)', cursor: 'pointer', padding: '3px 9px' }}>
                ✕ azzera
              </button>
            )}
            <div style={{ flex: 1 }}/>
            <span style={cinzel(9, '0.2em', 'rgba(232,220,192,0.42)')}>Ordina</span>
            <Select value={sort} onChange={setSort} allowEmpty={false}
              options={Object.entries(SORT_LABELS)}/>
            <button onClick={() => setDir(d => d === 'asc' ? 'desc' : 'asc')}
              title={dir === 'asc' ? 'Crescente' : 'Decrescente'}
              style={{ background: 'none', border: BORDER, color: 'var(--cine-gold)',
                cursor: 'pointer', fontSize: 12, padding: '2px 8px' }}>
              {dir === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: view === 'grid' ? 14 : 0, maxHeight: 'calc(100vh - 320px)' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="m-spinner"/></div>
            ) : books.length === 0 ? (
              <div style={{ ...serif, fontStyle: 'italic', color: 'rgba(232,220,192,0.42)', textAlign: 'center', padding: '60px 20px', fontSize: 14 }}>
                {hasFilters
                  ? 'Nessun volume corrisponde ai filtri.'
                  : section === 'unplaced'
                    ? 'Tutti i volumi sono stati collocati.'
                    : 'Sezione vuota — trascina qui i volumi da collocare.'}
              </div>
            ) : view === 'grid' ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {books.map(b => (
                  <BookCard
                    key={b.id} book={b} w={cardW}
                    selected={selected.has(b.id)}
                    onSelect={handleSelect}
                    onContextMenu={handleContextMenu}
                    onDragStart={handleDragStart}
                    onDragEnd={() => setDragging(false)}
                    onOpen={id => navigate(`/libro/${id}`)}
                  />
                ))}
              </div>
            ) : (
              <div>
                {/* Intestazione colonne */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '5px 10px',
                  borderBottom: BORDER, position: 'sticky', top: 0, zIndex: 2,
                  background: 'rgba(13,9,5,0.96)',
                }}>
                  <div style={{ width: 26, flexShrink: 0 }}/>
                  <div style={{ flex: 1, ...cinzel(9, '0.18em', 'rgba(232,220,192,0.42)') }}>Titolo e autore</div>
                  <div style={{ width: 150, ...cinzel(9, '0.18em', 'rgba(232,220,192,0.42)') }}>Editore</div>
                  <div style={{ width: 46, ...cinzel(9, '0.18em', 'rgba(232,220,192,0.42)'), textAlign: 'right' }}>Anno</div>
                  <div style={{ width: 210, ...cinzel(9, '0.18em', 'rgba(232,220,192,0.42)') }}>Collocazione</div>
                </div>
                {books.map(b => (
                  <BookRow
                    key={b.id} book={b}
                    selected={selected.has(b.id)}
                    placementLabel={labelOf(b.placement_id)}
                    onSelect={handleSelect}
                    onContextMenu={handleContextMenu}
                    onDragStart={handleDragStart}
                    onDragEnd={() => setDragging(false)}
                    onOpen={id => navigate(`/libro/${id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {menu && (
        <PlacementMenu
          x={menu.x} y={menu.y} tree={tree} counts={counts}
          targetCount={menu.ids.length}
          currentPlacement={currentLabel}
          onPick={id => { applyPlacement(menu.ids, id); setMenu(null); }}
          onRemove={() => { applyPlacement(menu.ids, null); setMenu(null); }}
          onOpen={() => { const id = menu.ids[0]; setMenu(null); navigate(`/libro/${id}`); }}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
