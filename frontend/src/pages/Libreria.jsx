import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import { books as booksApi, shelves as shelvesApi, authors as authorsApi, prices as pricesApi, stats as statsApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';

/* ── Constants ───────────────────────────────────────────────────────────────── */
const STATUS_LABELS   = { tbr: 'da leggere', reading: 'in lettura', read: 'letti', abandoned: 'abbandonati' };
const STATUS_OPTIONS  = [
  { value: 'tbr',       label: 'Da leggere' },
  { value: 'reading',   label: 'In lettura' },
  { value: 'read',      label: 'Letto'      },
  { value: 'abandoned', label: 'Abbandonato'},
];
const FORMAT_OPTIONS  = [
  { value: 'paperback',  label: 'Brossura'  },
  { value: 'hardcover',  label: 'Cartonato' },
  { value: 'ebook',      label: 'Ebook'     },
  { value: 'audiobook',  label: 'Audiolibro'},
  { value: 'comics',     label: 'Fumetto'   },
];
const LANG_OPTIONS = [
  { value: 'it', label: 'Italiano'   },
  { value: 'en', label: 'Inglese'    },
  { value: 'fr', label: 'Francese'   },
  { value: 'de', label: 'Tedesco'    },
  { value: 'es', label: 'Spagnolo'   },
  { value: 'pt', label: 'Portoghese' },
  { value: 'la', label: 'Latino'     },
  { value: 'el', label: 'Greco'      },
];
const SORT_LABELS = {
  added_at: 'data aggiunta',
  title:    'titolo',
  author:   'autore',
  year:     'anno',
  pages:    'pagine',
};
const STATUS_LABELS_STRIP = {
  '':        'Tutti',
  tbr:       'Da leggere',
  reading:   'In lettura',
  read:      'Letti',
  abandoned: 'Abbandonati',
  no_value:  'Da stimare',
};
const STATUS_DISPLAY = {
  tbr:       { label: 'Da leggere',  color: 'rgba(232,220,192,0.7)'  },
  reading:   { label: 'In lettura',  color: 'var(--cine-vermilion)'  },
  read:      { label: 'Letto',       color: 'var(--cine-gold)'       },
  abandoned: { label: 'Abbandonato', color: 'rgba(232,220,192,0.4)'  },
  no_value:  { label: 'Da stimare',  color: 'rgba(232,220,192,0.55)' },
};

/* ── Strip SVG icons ─────────────────────────────────────────────────────────── */
const IconRune = ({ s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <path d="M3 2 L3 16 L9 14 L15 16 L15 2 L9 4 Z"
      stroke="var(--cine-gold)" strokeWidth="1.1" fill="none" strokeLinejoin="miter"/>
    <path d="M9 4 L9 14" stroke="var(--cine-gold)" strokeWidth="0.9" opacity="0.55"/>
    <path d="M9 1 L10 3 L9 5 L8 3 Z" fill="var(--cine-gold)" opacity="0.85"/>
  </svg>
);
const IconFunnel = ({ s = 12 }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
    <path d="M1.5 2 L10.5 2 L7 6.5 L7 10.5 L5 11.5 L5 6.5 Z"
      stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="miter"/>
  </svg>
);
const IconChevron = ({ s = 8 }) => (
  <svg width={s} height={Math.round(s * 0.75)} viewBox="0 0 8 6" fill="none">
    <path d="M1 1 L4 4.5 L7 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  </svg>
);
const IconGrid = ({ s = 12 }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
    <rect x="1" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1" fill="none"/>
    <rect x="7" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1" fill="none"/>
    <rect x="1" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1" fill="none"/>
    <rect x="7" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
);
const IconList = ({ s = 12 }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none"
    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
    <line x1="1" y1="2.5" x2="11" y2="2.5"/>
    <line x1="1" y1="6"   x2="11" y2="6"/>
    <line x1="1" y1="9.5" x2="11" y2="9.5"/>
  </svg>
);
const IconMagnifier = ({ s = 12 }) => (
  <svg width={s} height={s} viewBox="0 0 13 13" fill="none">
    <circle cx="5.5" cy="5.5" r="3.8" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M8.4 8.4 L11.8 11.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconStack = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
    <rect x="2" y="3"  width="10" height="2.4" stroke="currentColor" strokeWidth="1" fill="none"/>
    <rect x="3" y="6"  width="8"  height="2.4" stroke="currentColor" strokeWidth="1" fill="none"/>
    <rect x="2" y="9"  width="10" height="2.4" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
);

/* ── Strip atoms ─────────────────────────────────────────────────────────────── */
const VRule = ({ h = 18, op = 0.28 }) => (
  <span style={{
    width: 1, height: h,
    background: `rgba(216,180,106,${op})`,
    alignSelf: 'center', flexShrink: 0,
  }}/>
);

/* ── FilterStrip ─────────────────────────────────────────────────────────────── */
function FilterStrip({
  view, onView,
  count, total,
  sort, status, filterFormat, filterLang,
  noValueCount,
  onSearch,
  onFiltriClick, filtriTriggerRef, filtriOpen,
  onOrdinaClick, ordinaTriggerRef, ordinaOpen,
  cardW, onZoom,
}) {
  const filtriTail      = STATUS_LABELS_STRIP[status] ?? 'Tutti';
  const ordinaTail      = SORT_LABELS[sort] ?? 'data aggiunta';
  const hasActiveFilters = !!(status || filterFormat || filterLang);

  const stripStyle = {
    position: 'relative', height: 54, flexShrink: 0,
    backgroundImage:
      'radial-gradient(ellipse 60% 180% at 50% 50%, rgba(232,220,192,0.46) 0%, rgba(216,180,106,0.25) 18%, rgba(216,180,106,0.04) 56%, transparent 80%),' +
      'linear-gradient(180deg, rgba(232,220,192,0.04) 0%, rgba(216,180,106,0.10) 50%, rgba(232,220,192,0.04) 100%)',
    boxShadow:
      'inset 0 1px 0 rgba(232,220,192,0.18),' +
      'inset 0 -1px 0 rgba(0,0,0,0.55)',
  };

  const btnGhost = {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px',
    background: 'transparent', border: '1px solid rgba(216,180,106,0.22)',
    color: 'var(--cine-cream)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
  };
  const iconBtn = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, padding: 0,
    background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(232,220,192,0.22)',
    color: 'var(--cine-cream)', cursor: 'pointer', flexShrink: 0,
  };
  const segBase = {
    padding: '6px 10px', background: 'transparent', border: 'none',
    color: 'rgba(232,220,192,0.62)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  };
  const cinzel = (sz, tracking = '0.22em', color = 'var(--cine-cream)', weight = 500) => ({
    fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
    letterSpacing: tracking, fontSize: sz, fontWeight: weight,
    color, lineHeight: 1, whiteSpace: 'nowrap',
    textShadow: '0 1px 0 rgba(0,0,0,0.6)',
  });
  const tailStyle = {
    fontFamily: "'Agmena Pro', Georgia, serif",
    fontStyle: 'italic', fontSize: 12,
    color: 'rgba(232,220,192,0.7)', marginLeft: 2, whiteSpace: 'nowrap',
  };

  return (
    <div style={stripStyle}>
      <div style={{
        position: 'absolute', inset: 0, padding: '0 28px',
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <IconRune s={18}/>
          <span style={cinzel(16, '0.22em', 'var(--cine-cream)', 600)}>Libreria</span>
        </div>

        <VRule h={26}/>

        {/* Filtri */}
        <button
          ref={filtriTriggerRef}
          onClick={onFiltriClick}
          style={{
            ...btnGhost,
            background: filtriOpen
              ? 'rgba(216,180,106,0.12)'
              : hasActiveFilters ? 'rgba(216,180,106,0.06)' : 'transparent',
            borderColor: hasActiveFilters ? 'rgba(216,180,106,0.45)' : 'rgba(216,180,106,0.22)',
          }}
        >
          <IconFunnel s={11}/>
          <span style={cinzel(11)}>Filtri</span>
          <span style={{ ...tailStyle, color: hasActiveFilters ? 'var(--cine-gold)' : 'rgba(232,220,192,0.7)' }}>
            {filtriTail}
          </span>
        </button>

        {/* Ordina */}
        <button
          ref={ordinaTriggerRef}
          onClick={onOrdinaClick}
          style={{ ...btnGhost, background: ordinaOpen ? 'rgba(216,180,106,0.12)' : 'transparent' }}
        >
          <span style={cinzel(11)}>Ordina</span>
          <span style={tailStyle}>{ordinaTail}</span>
          <IconChevron s={8}/>
        </button>

        <div style={{ flex: 1 }}/>

        {/* Search */}
        <button onClick={onSearch} style={iconBtn} title="Cerca">
          <IconMagnifier s={13}/>
        </button>

        {/* Zoom slider — solo in modalità griglia */}
        {view === 'grid' && cardW !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'rgba(232,220,192,0.38)', userSelect: 'none', lineHeight: 1 }}>⊟</span>
            <input
              type="range" min={70} max={200} step={10} value={cardW}
              onChange={e => onZoom && onZoom(parseInt(e.target.value))}
              style={{ width: 68, accentColor: 'var(--cine-gold)', cursor: 'pointer' }}
              title={`Copertine: ${cardW}px`}
            />
            <span style={{ fontSize: 11, color: 'rgba(232,220,192,0.38)', userSelect: 'none', lineHeight: 1 }}>⊞</span>
          </div>
        )}

        {/* Griglia | Lista */}
        <div style={{ display: 'inline-flex', border: '1px solid rgba(232,220,192,0.22)', flexShrink: 0 }}>
          <button
            onClick={() => onView('grid')}
            style={{ ...segBase, ...(view === 'grid' ? { background: 'rgba(216,180,106,0.16)', color: 'var(--cine-cream)' } : {}) }}
            title="Griglia"
          ><IconGrid s={11}/></button>
          <button
            onClick={() => onView('list')}
            style={{ ...segBase, ...(view === 'list' ? { background: 'rgba(216,180,106,0.16)', color: 'var(--cine-cream)' } : {}) }}
            title="Lista"
          ><IconList s={11}/></button>
        </div>

        <VRule h={26}/>

        {/* Counter */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0, color: 'var(--cine-gold)' }}>
          <IconStack s={14}/>
          <span style={{
            fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 600,
            letterSpacing: '0.04em', color: 'var(--cine-cream)',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 1px 0 rgba(0,0,0,0.6)',
          }}>
            {count}
            <span style={{ color: 'rgba(232,220,192,0.55)', fontWeight: 400 }}> / {total}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── FiltriOption ─────────────────────────────────────────────────────────────── */
function FiltriOption({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(216,180,106,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(216,180,106,0.06)' : 'transparent'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px', cursor: 'pointer',
        background: active ? 'rgba(216,180,106,0.06)' : 'transparent',
        transition: 'background 80ms',
      }}
    >
      <div style={{
        width: 14, height: 14, flexShrink: 0,
        border: `1px solid ${active ? 'var(--cine-gold)' : 'rgba(216,180,106,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(216,180,106,0.15)' : 'transparent',
      }}>
        {active && <span style={{ color: 'var(--cine-gold)', fontSize: 9, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{
        fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 13,
        color: active ? 'var(--cine-cream)' : 'rgba(232,220,192,0.72)',
      }}>{label}</span>
    </div>
  );
}

/* ── FiltriPopover ───────────────────────────────────────────────────────────── */
function FiltriPopover({ popoverRef, rect, status, onStatus, filterFormat, onFilterFormat, filterLang, onFilterLang, noValueCount }) {
  const sectionLabel = {
    display: 'block',
    fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
    letterSpacing: '0.22em', fontSize: 9, fontWeight: 500,
    color: 'rgba(232,220,192,0.45)', padding: '12px 16px 6px',
  };
  return (
    <div ref={popoverRef} style={{
      position: 'fixed', top: rect.bottom + 4, left: rect.left,
      zIndex: 500,
      background: 'rgba(13,9,5,0.96)',
      border: '1px solid rgba(216,180,106,0.32)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      minWidth: 220, maxHeight: '80vh', overflowY: 'auto',
    }}>

      <span style={sectionLabel}>Stato</span>
      <FiltriOption label="Tutti"       active={status === ''}         onClick={() => onStatus('')}/>
      <FiltriOption label="Da leggere"  active={status === 'tbr'}      onClick={() => onStatus('tbr')}/>
      <FiltriOption label="In lettura"  active={status === 'reading'}  onClick={() => onStatus('reading')}/>
      <FiltriOption label="Letti"       active={status === 'read'}     onClick={() => onStatus('read')}/>
      <FiltriOption label="Abbandonati" active={status === 'abandoned'} onClick={() => onStatus('abandoned')}/>
      <FiltriOption
        label={`Da stimare${noValueCount !== null ? ` (${noValueCount})` : ''}`}
        active={status === 'no_value'}
        onClick={() => onStatus('no_value')}
      />

      <div style={{ borderTop: '1px solid rgba(216,180,106,0.12)', marginTop: 4 }}/>
      <span style={sectionLabel}>Formato</span>
      <FiltriOption label="Tutti i formati" active={filterFormat === ''} onClick={() => onFilterFormat('')}/>
      {FORMAT_OPTIONS.map(o => (
        <FiltriOption key={o.value} label={o.label}
          active={filterFormat === o.value} onClick={() => onFilterFormat(o.value)}/>
      ))}

      <div style={{ borderTop: '1px solid rgba(216,180,106,0.12)', marginTop: 4 }}/>
      <span style={sectionLabel}>Lingua</span>
      <FiltriOption label="Tutte le lingue" active={filterLang === ''} onClick={() => onFilterLang('')}/>
      {LANG_OPTIONS.map(o => (
        <FiltriOption key={o.value} label={o.label}
          active={filterLang === o.value} onClick={() => onFilterLang(o.value)}/>
      ))}

      {(status || filterFormat || filterLang) && (
        <>
          <div style={{ borderTop: '1px solid rgba(216,180,106,0.12)', marginTop: 4 }}/>
          <div
            onClick={() => { onStatus(''); onFilterFormat(''); onFilterLang(''); }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--cine-gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(216,180,106,0.65)'; }}
            style={{
              padding: '10px 16px', cursor: 'pointer',
              fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
              letterSpacing: '0.16em', fontSize: 10, color: 'rgba(216,180,106,0.65)',
            }}
          >✕ Azzera filtri</div>
        </>
      )}
    </div>
  );
}

/* ── OrdinaPopover ───────────────────────────────────────────────────────────── */
function OrdinaPopover({ popoverRef, rect, sort, onSort }) {
  const options = [
    { value: 'added_at', label: 'Data aggiunta', dir: 'desc' },
    { value: 'title',    label: 'Titolo',         dir: 'asc'  },
    { value: 'author',   label: 'Autore',          dir: 'asc'  },
    { value: 'year',     label: 'Anno',            dir: 'desc' },
    { value: 'pages',    label: 'Pagine',          dir: 'desc' },
  ];
  return (
    <div ref={popoverRef} style={{
      position: 'fixed', top: rect.bottom + 4, left: rect.left,
      zIndex: 500,
      background: 'rgba(13,9,5,0.96)',
      border: '1px solid rgba(216,180,106,0.32)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      minWidth: 200, paddingTop: 6, paddingBottom: 6,
    }}>
      {options.map(opt => {
        const active = sort === opt.value;
        return (
          <div
            key={opt.value}
            onClick={() => onSort(opt.value)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(216,180,106,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(216,180,106,0.12)' : 'transparent'; }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 16px', cursor: 'pointer',
              background: active ? 'rgba(216,180,106,0.12)' : 'transparent',
              transition: 'background 80ms',
            }}
          >
            <span style={{
              fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
              letterSpacing: '0.16em', fontSize: 11, fontWeight: active ? 500 : 400,
              color: active ? 'var(--cine-cream)' : 'rgba(232,220,192,0.72)',
            }}>{opt.label}</span>
            <span style={{
              fontSize: 13, marginLeft: 16, flexShrink: 0,
              color: active ? 'var(--cine-gold)' : 'rgba(216,180,106,0.35)',
            }}>{opt.dir === 'asc' ? '↑' : '↓'}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── MenuItem helper ───────────────────────────────────────────────────────── */
function MenuItem({ icon, label, danger, onClick, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 14px', cursor: disabled ? 'default' : 'pointer', fontSize: 13,
        color: danger ? 'var(--m-vermilion)' : 'var(--m-ink)',
        background: hov && !disabled ? (danger ? 'rgba(168,58,38,0.07)' : 'var(--m-rule)') : 'transparent',
        opacity: disabled ? 0.45 : 1,
        transition: 'background 80ms',
        userSelect: 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={disabled ? undefined : onClick}
    >
      <span style={{ fontSize: 12, width: 14, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      {label}
    </div>
  );
}

/* ─── BookContextMenu ───────────────────────────────────────────────────────── */
function BookContextMenu({
  x, y, book, shelves, shelfIds,
  onToggle, onClose, onNavigate, onEdit, onDelete,
}) {
  const ref = useRef(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pos, setPos] = useState({ left: x, top: y });

  useEffect(() => {
    if (!ref.current) return;
    const r  = ref.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    setPos({
      left: r.right  > vw ? Math.max(0, x - r.width)  : x,
      top:  r.bottom > vh ? Math.max(0, y - r.height) : y,
    });
  }, [x, y]);

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
      position: 'fixed', left: pos.left, top: pos.top, zIndex: 600,
      background: 'var(--m-parchment)', border: '1px solid var(--m-rule)',
      boxShadow: '0 4px 18px rgba(0,0,0,0.18)', minWidth: 230,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '8px 14px 7px', borderBottom: '1px solid var(--m-rule)' }}>
        <div className="m-serif" style={{
          fontSize: 13, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260,
        }}>{book.title}</div>
        {book.author_names && (
          <div className="m-marginalia" style={{
            fontSize: 10, marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{book.author_names}</div>
        )}
      </div>

      <div style={{ paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid var(--m-rule)' }}>
        <MenuItem icon="✎" label="Modifica libro" onClick={() => { onClose(); onEdit(book); }} />
        {!confirmDelete ? (
          <MenuItem icon="✕" label="Elimina libro" danger onClick={() => setConfirmDelete(true)} />
        ) : (
          <div style={{ padding: '8px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--m-vermilion)', marginBottom: 7, lineHeight: 1.4 }}>
              Eliminare definitivamente <strong>{book.title}</strong>?<br/>
              <span style={{ color: 'var(--m-ink-muted)' }}>Questa azione non è reversibile.</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                style={{
                  flex: 1, padding: '5px 0', fontSize: 12, cursor: 'pointer',
                  background: 'var(--m-vermilion)', color: '#fff',
                  border: 'none', fontFamily: 'inherit',
                }}
                onClick={() => { onDelete(book); onClose(); }}
              >Sì, elimina</button>
              <button
                style={{
                  flex: 1, padding: '5px 0', fontSize: 12, cursor: 'pointer',
                  background: 'transparent', border: '1px solid var(--m-rule)',
                  fontFamily: 'inherit', color: 'var(--m-ink)',
                }}
                onClick={() => setConfirmDelete(false)}
              >Annulla</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ paddingTop: 4 }}>
        <div className="m-eyebrow" style={{ fontSize: 9, letterSpacing: '0.14em', padding: '2px 14px 4px', color: 'var(--m-ink-muted)' }}>
          Scaffali
        </div>
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {shelves.length === 0 ? (
            <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--m-ink-muted)', fontStyle: 'italic' }}>
              Nessuno scaffale creato
            </div>
          ) : shelves.map(shelf => {
            const inShelf = shelfIds.has(shelf.id);
            return (
              <div
                key={shelf.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 14px', cursor: 'pointer', fontSize: 13,
                  background: inShelf ? 'color-mix(in srgb, var(--m-terracotta) 8%, transparent)' : 'transparent',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => { if (!inShelf) e.currentTarget.style.background = 'var(--m-rule)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = inShelf ? 'color-mix(in srgb, var(--m-terracotta) 8%, transparent)' : 'transparent'; }}
                onClick={() => onToggle(shelf)}
              >
                <div style={{
                  width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                  background: inShelf ? 'var(--m-terracotta)' : 'transparent',
                  border: '1.5px solid ' + (inShelf ? 'var(--m-terracotta)' : 'var(--m-rule-strong)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 120ms',
                }}>
                  {inShelf && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {shelf.name}
                </span>
                <span className="m-nums" style={{ fontSize: 11, color: 'var(--m-ink-muted)', flexShrink: 0 }}>
                  {shelf.book_count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--m-rule)', padding: '5px 8px' }}>
        <div
          style={{
            padding: '5px 6px', cursor: 'pointer', fontSize: 12,
            color: 'var(--m-ink-muted)', borderRadius: 2, transition: 'background 100ms',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--m-rule)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          onClick={() => { onClose(); onNavigate(book.id); }}
        >› apri dettaglio libro</div>
      </div>
    </div>
  );
}

/* ─── EditBookModal helpers ─────────────────────────────────────────────────── */
function _enc(s) { return encodeURIComponent(s || ''); }
function _authorName(b) { return b.authors?.[0]?.name || b.author_names || ''; }

const PRICE_PLATFORMS = [
  {
    group: 'Mercato librario',
    items: [
      { label: 'viaLibri',   color: '#1a3a5c', url: (b) => `https://www.vialibri.net/searches?${b.isbn13 ? `all_text=${_enc(b.isbn13)}` : `title=${_enc(b.title)}&author=${_enc(_authorName(b))}`}&source=Malachia&currency=EUR&sort_by=price&sort_order=asc` },
      { label: 'AbeBooks',   color: '#c9000b', url: (b) => b.isbn13 ? `https://www.abebooks.it/servlet/SearchResults?isbn=${b.isbn13}&sortby=17` : `https://www.abebooks.it/servlet/SearchResults?an=${_enc(_authorName(b))}&tn=${_enc(b.title)}&sortby=17` },
      { label: 'Bookfinder', color: '#3a5a2a', url: (b) => `https://www.bookfinder.com/search/?title=${_enc(b.title)}&author=${_enc(_authorName(b))}${b.isbn13 ? `&isbn=${b.isbn13}` : ''}` },
      { label: 'Maremagnum', color: '#5a3a2a', url: (b) => `https://www.maremagnum.com/libri-antichi/ricerca?keywords=${_enc(b.isbn13 || b.title)}` },
      { label: 'Bookfair',   color: '#2a4a5a', url: (b) => `https://www.bookfair.it/search?q=${_enc(b.isbn13 || b.title + ' ' + _authorName(b))}` },
    ],
  },
  {
    group: 'Marketplace',
    items: [
      { label: 'Amazon', color: '#ff9900', url: (b) => `https://www.amazon.it/s?k=${_enc(b.isbn13 || (b.title + ' ' + _authorName(b)))}` },
      { label: 'eBay',   color: '#e53238', url: (b) => `https://www.ebay.it/sch/i.html?_nkw=${_enc(b.isbn13 || (b.title + ' ' + _authorName(b)))}&_catid=267` },
      { label: 'Vinted',  color: '#09b1ba', url: (b) => `https://www.vinted.it/catalog?search_text=${_enc(b.title + ' ' + _authorName(b))}` },
    ],
  },
];

const PRICE_SOURCES = [
  { id: 'vialibri',  label: 'AbeBooks',  color: '#c9000b' },
  { id: 'libraccio', label: 'Libraccio', color: '#8b1a1a' },
];

/* ─── PriceResultCard ───────────────────────────────────────────────────── */
function PriceResultCard({ result, onUse }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
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
          ? <img src={result.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} onError={e => { e.target.style.display = 'none'; }}/>
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, padding: 10 }}>
              <div style={{ fontSize: 28, opacity: 0.15 }}>◇</div>
              <div style={{ fontSize: 10, color: 'var(--m-ink-muted)', textAlign: 'center', lineHeight: 1.3, fontFamily: "'EB Garamond', serif" }}>{result.title?.slice(0, 40)}</div>
            </div>
        }
        <div style={{ position: 'absolute', bottom: 5, left: 5, background: result.source_color, color: '#fff', fontSize: 9, padding: '2px 6px', fontVariant: 'small-caps', letterSpacing: '0.06em' }}>{result.source_label}</div>
      </div>
      <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 22, fontFamily: "'EB Garamond', serif", color: 'var(--m-gold)', lineHeight: 1, fontWeight: 500 }}>
          € {result.price.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        {result.title && <div style={{ fontSize: 11, lineHeight: 1.3, fontFamily: "'EB Garamond', serif", maxHeight: '2.6em', overflow: 'hidden' }}>{result.title}</div>}
        {result.author && <div style={{ fontSize: 10, color: 'var(--m-ink-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.author}</div>}
        {result.condition && <div style={{ fontSize: 9, color: 'var(--m-ink-muted)', fontStyle: 'italic', marginTop: 2 }}>{result.condition}</div>}
        <button className="m-btn m-btn-sm"
          style={{ marginTop: 'auto', paddingTop: 6, fontSize: 11, justifyContent: 'center', background: hov ? result.source_color : 'transparent', borderColor: hov ? result.source_color : 'var(--m-rule)', color: hov ? '#fff' : 'var(--m-ink)', transition: 'all 150ms' }}
          onClick={() => onUse(result.price)}>← usa prezzo</button>
      </div>
      {result.url && (
        <a href={result.url} target="_blank" rel="noopener noreferrer"
          style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', textDecoration: 'none', opacity: hov ? 1 : 0, transition: 'opacity 150ms' }}
          title="Apri pagina originale">↗</a>
      )}
    </div>
  );
}

/* ─── ValoreModal ───────────────────────────────────────────────────────── */
function ValoreModal({ book, onSave, onClose }) {
  const [val,      setVal]      = useState(book.market_value != null ? String(book.market_value) : '');
  const [saving,   setSaving]   = useState(false);
  const [qAuthor,  setQAuthor]  = useState(_authorName(book) || '');
  const [qTitle,   setQTitle]   = useState(book.title || '');
  const [qKw,      setQKw]      = useState(book.isbn13 || book.isbn10 || '');
  const [pStatus,  setPStatus]  = useState({ vialibri: 'idle', libraccio: 'idle' });
  const [pErrors,  setPErrors]  = useState({});
  const [results,  setResults]  = useState([]);
  const [searched, setSearched] = useState(false);

  const anyLoading = Object.values(pStatus).some(s => s === 'loading');
  const hasQuery   = qAuthor.trim() || qTitle.trim() || qKw.trim();

  async function doSearch() {
    if (!hasQuery) return;
    setPStatus({ vialibri: 'loading', libraccio: 'loading' });
    setPErrors({}); setResults([]); setSearched(true);
    try {
      const data = await pricesApi.search({ author: qAuthor.trim() || undefined, title: qTitle.trim() || undefined, keywords: qKw.trim() || undefined });
      setResults(data.results || []);
      setPStatus({
        vialibri:  data.statuses?.vialibri  ?? 'error',
        libraccio: data.statuses?.libraccio ?? 'error',
      });
      if (data.errors) setPErrors(data.errors);
    } catch (e) {
      setPStatus({ vialibri: 'error', libraccio: 'error' });
      setPErrors({ vialibri: e.message || 'Errore di rete', libraccio: e.message || 'Errore di rete' });
    }
  }

  async function handleSave(price) {
    const v = price !== undefined ? price : (val ? parseFloat(val) : null);
    setSaving(true);
    onSave(v);
    setSaving(false);
    onClose();
  }

  const searchBook = { ...book, isbn13: qKw.trim() || book.isbn13, title: qTitle.trim() || book.title, authors: qAuthor.trim() ? [{ name: qAuthor.trim() }] : book.authors };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 700 }} onClick={onClose}>
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
            <div className="m-field" style={{ flex: '1 1 160px', margin: 0 }}><label style={{ fontSize: 10 }}>Author</label><input className="m-input" style={{ padding: '6px 10px', fontSize: 13 }} value={qAuthor} onChange={e => setQAuthor(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="es. Tolkien"/></div>
            <div className="m-field" style={{ flex: '2 1 200px', margin: 0 }}><label style={{ fontSize: 10 }}>Title</label><input className="m-input" style={{ padding: '6px 10px', fontSize: 13 }} value={qTitle} onChange={e => setQTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="es. The Lord of the Rings"/></div>
            <div className="m-field" style={{ flex: '1 1 160px', margin: 0 }}><label style={{ fontSize: 10 }}>Keywords / ISBN</label><input className="m-input" style={{ padding: '6px 10px', fontSize: 13 }} value={qKw} onChange={e => setQKw(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="9780261103573"/></div>
            <button className="m-btn" style={{ flexShrink: 0, alignSelf: 'flex-end' }} onClick={doSearch} disabled={anyLoading || !hasQuery}>{anyLoading ? '…' : '⌕ cerca'}</button>
          </div>
          {searched && (
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {PRICE_SOURCES.map(src => {
                const s = pStatus[src.id]; const isLoading = s === 'loading'; const isError = s === 'error'; const count = typeof s === 'number' ? s : null;
                return (
                  <div key={src.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 9, fontVariant: 'small-caps', letterSpacing: '0.07em', padding: '2px 7px', lineHeight: 1.5, background: isLoading ? 'var(--m-rule)' : isError ? 'rgba(180,60,40,0.15)' : src.color, color: (isLoading || isError) ? 'var(--m-ink-muted)' : '#fff', transition: 'background 300ms' }}>{src.label}</div>
                    <span style={{ fontSize: 12, color: isError ? 'var(--m-terracotta)' : 'var(--m-ink-muted)', fontFamily: "'EB Garamond', serif" }} title={isError && pErrors[src.id] ? pErrors[src.id] : undefined}>{isLoading ? '…' : isError ? (pErrors[src.id]?.slice(0, 80) || 'non raggiungibile') : `${count} risultat${count === 1 ? 'o' : 'i'}`}</span>
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
          {!anyLoading && searched && results.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0 20px', color: 'var(--m-ink-muted)', fontStyle: 'italic', fontFamily: "'EB Garamond', serif", fontSize: 14 }}>Nessuna quotazione trovata. Prova a modificare i termini di ricerca o usa i link diretti qui sotto.</div>}
          {!searched && <div style={{ textAlign: 'center', padding: '24px 0 8px', color: 'var(--m-ink-muted)', fontFamily: "'EB Garamond', serif", fontSize: 14 }}>Modifica i campi se necessario, poi clicca <strong>⌕ cerca</strong> per trovare le quotazioni.</div>}
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
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--m-rule)'; e.currentTarget.style.background = 'transparent'; }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0 }}/>{p.label} ↗
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

/* ─── EditBookModal ─────────────────────────────────────────────────────────── */
function EditBookModal({ book, onSave, onClose }) {
  const toast = useToast();
  const [editData, setEditData] = useState({
    ...book,
    authors_str: (book.authors || []).map(a => a.name).join(', ') || book.author_names || '',
    tags: Array.isArray(book.tags) ? book.tags : (typeof book.tags === 'string' ? JSON.parse(book.tags || '[]') : []),
  });
  const [saving,          setSaving]          = useState(false);
  const [showValoreModal, setShowValoreModal] = useState(false);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && !showValoreModal) onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, showValoreModal]);

  const set = (k, v) => setEditData(d => ({ ...d, [k]: v }));

  async function handleSave() {
    if (!editData.title?.trim()) return;
    setSaving(true);
    try {
      const { authors_str, authors: _authors, author_names, ...bookFields } = editData;
      if (bookFields.cover_local) bookFields.cover_local = String(bookFields.cover_local).split('?')[0];
      const names = (authors_str || '').split(',').map(s => s.trim()).filter(Boolean);
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
      await onSave({
        ...bookFields,
        ...(authorsPayload.length > 0 ? { authors: authorsPayload } : {}),
      });
    } catch (e) {
      toast('Errore durante il salvataggio: ' + e.message, 'error');
      setSaving(false);
    }
  }

  return (
    <>
      <div className="m-overlay" onClick={onClose}>
        <div className="m-modal" style={{ width: 720, padding: 32 }} onClick={e => e.stopPropagation()}>
          <div className="m-eyebrow" style={{ marginBottom: 8 }}>Modifica libro</div>
          <div className="m-serif" style={{ fontSize: 28, marginBottom: 20 }}>{book.title}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
            {[
              ['Titolo',                              'title'],
              ['Sottotitolo',                         'subtitle'],
              ['Titolo originale',                    'original_title'],
              ['Autore/i (separati da virgola)',       'authors_str'],
              ['Editore',                             'publisher'],
              ['Anno',                                'year'],
              ['Pagine',                              'pages'],
              ['Lingua',                              'language'],
              ['ISBN-13',                             'isbn13'],
              ['ISBN-10',                             'isbn10'],
              ['Serie',                               'series_name'],
              ['Volume #',                            'series_volume'],
              ['Stanza',                              'location_room'],
              ['Libreria',                            'location_bookcase'],
            ].map(([label, key]) => (
              <div key={key} className="m-field">
                <label>{label}</label>
                <input className="m-input" style={{ padding: '6px 10px' }}
                  value={editData[key] ?? ''}
                  onChange={e => set(key, e.target.value)}
                  autoFocus={key === 'title'}/>
              </div>
            ))}

            <div className="m-field">
              <label>N° Tomi (edizione in più volumi)</label>
              <input className="m-input" style={{ padding: '6px 10px' }} type="number" min="1"
                value={editData.volumes_count ?? 1}
                onChange={e => set('volumes_count', parseInt(e.target.value) || 1)}/>
            </div>
            <div className="m-field">
              <label>Copie possedute (doppioni)</label>
              <input className="m-input" style={{ padding: '6px 10px' }} type="number" min="1"
                value={editData.copies_owned ?? 1}
                onChange={e => set('copies_owned', parseInt(e.target.value) || 1)}/>
            </div>

            <div className="m-field">
              <label>Valore stimato (€)</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input className="m-input" style={{ padding: '6px 10px' }} type="number" min="0" step="0.01"
                  value={editData.market_value ?? ''}
                  onChange={e => set('market_value', e.target.value)}
                  placeholder="0.00"/>
                <button type="button" className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11, flexShrink: 0 }}
                  onClick={() => setShowValoreModal(true)}>cerca ↗</button>
              </div>
            </div>

            <div className="m-field">
              <label>N° inventario</label>
              <input className="m-input" style={{ padding: '6px 10px', letterSpacing: '0.05em', color: 'var(--m-ink-muted)', cursor: 'default', fontFamily: 'var(--m-mono)', fontSize: 13 }}
                value={editData.inventory_number ?? ''} readOnly/>
            </div>

            <div className="m-field">
              <label>Stato</label>
              <select className="m-select" value={editData.status || 'tbr'} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="m-field" style={{ gridColumn: 'span 2' }}>
              <label>Formato</label>
              <select className="m-select" value={editData.format || 'paperback'} onChange={e => set('format', e.target.value)}>
                {FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="m-field" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox"
                  checked={!!editData.signed}
                  onChange={e => set('signed', e.target.checked ? 1 : 0)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}/>
                <span>✦ Volume autografato</span>
              </label>
            </div>

            <div className="m-field" style={{ gridColumn: 'span 2' }}>
              <label>Sinossi</label>
              <textarea className="m-textarea" value={editData.synopsis ?? ''}
                onChange={e => set('synopsis', e.target.value)}/>
            </div>

            <div className="m-field" style={{ gridColumn: 'span 2' }}>
              <label>Note personali</label>
              <textarea className="m-textarea" value={editData.personal_notes ?? ''}
                onChange={e => set('personal_notes', e.target.value)}/>
            </div>

            <div className="m-field">
              <label>Tag (virgola-separati)</label>
              <input className="m-input" style={{ padding: '6px 10px' }}
                value={(editData.tags || []).join(', ')}
                onChange={e => set('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}/>
            </div>

            <div className="m-field" style={{ gridColumn: 'span 2' }}>
              <label>Copertina — URL immagine</label>
              <input className="m-input" style={{ padding: '6px 10px' }}
                value={editData.cover_url ?? ''}
                onChange={e => set('cover_url', e.target.value)}
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
                      const result = await booksApi.uploadCover(book.id, file);
                      set('cover_local', `${result.url}?t=${Date.now()}`);
                      toast('Copertina caricata', 'success');
                    } catch { toast('Errore caricamento copertina', 'error'); }
                  }}/>
                {(editData.cover_local || editData.cover_url) && (
                  <img src={editData.cover_local || editData.cover_url} alt=""
                    style={{ height: 60, objectFit: 'contain', border: '1px solid var(--m-rule)' }}/>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button className="m-btn m-btn-ghost" onClick={onClose} disabled={saving}>annulla</button>
            <button className="m-btn" onClick={handleSave} disabled={saving || !editData.title?.trim()}>
              {saving ? '…' : 'salva'}
            </button>
          </div>
        </div>
      </div>

      {showValoreModal && (
        <ValoreModal
          book={editData}
          onSave={v => set('market_value', v != null ? String(v) : '')}
          onClose={() => setShowValoreModal(false)}
        />
      )}
    </>
  );
}

/* ── Module-level cache per scroll restoration ────────────────────────────────── */
let _libBooks  = null;
let _libScroll = 0;
// Cache stale-while-revalidate: chiave = combinazione filtri, valore = { books, total }.
// Persiste tra le navigazioni, così tornare in Libreria è istantaneo.
const _libCache = new Map();

/* ════════════════════════════════════════════════════════════════════════════ */
export default function Libreria() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [params] = useSearchParams();

  const [sessionSnap] = useState(() => {
    try {
      const raw = sessionStorage.getItem('malachia-libreria-state');
      if (raw) { sessionStorage.removeItem('malachia-libreria-state'); return JSON.parse(raw); }
    } catch {}
    return {};
  });

  const [view,         setView]         = useState(() => localStorage.getItem('malachia-view') || 'grid');
  const [books,        setBooks]        = useState(() => _libBooks ?? []);
  const initialScrollRef                = useRef(_libScroll);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(books.length === 0);
  const [status,       setStatus]       = useState(
    sessionSnap.status ?? params.get('status') ?? localStorage.getItem('malachia-status') ?? ''
  );
  const [sort,         setSort]         = useState(
    sessionSnap.sort ?? localStorage.getItem('malachia-sort') ?? 'added_at'
  );
  const [filterFormat, setFilterFormat] = useState(sessionSnap.filterFormat ?? '');
  const [filterLang,   setFilterLang]   = useState(sessionSnap.filterLang   ?? '');
  const [noValueCount, setNoValueCount] = useState(null);
  const [totalAll,     setTotalAll]     = useState(0);
  const [shelves,      setShelves]      = useState([]);
  const [contextMenu,  setContextMenu]  = useState(null);
  const [editBook,     setEditBook]     = useState(null);

  /* ── Popover state ── */
  const [cardW, setCardW] = useState(() => {
    const saved = localStorage.getItem('malachia-grid-zoom');
    return saved ? parseInt(saved) : 110;
  });
  const onZoom = (v) => { setCardW(v); localStorage.setItem('malachia-grid-zoom', String(v)); };

  const [filtriOpen,  setFiltriOpen]  = useState(false);
  const [ordinaOpen,  setOrdinaOpen]  = useState(false);
  const [filtriRect,  setFiltriRect]  = useState(null);
  const [ordinaRect,  setOrdinaRect]  = useState(null);
  const filtriTriggerRef = useRef(null);
  const ordinaTriggerRef = useRef(null);
  const filtriPopRef     = useRef(null);
  const ordinaPopRef     = useRef(null);

  /* ── Outside-click closes popovers ── */
  useEffect(() => {
    function onMouseDown(e) {
      if (filtriOpen && filtriPopRef.current &&
          !filtriPopRef.current.contains(e.target) &&
          !(filtriTriggerRef.current && filtriTriggerRef.current.contains(e.target))) {
        setFiltriOpen(false);
      }
      if (ordinaOpen && ordinaPopRef.current &&
          !ordinaPopRef.current.contains(e.target) &&
          !(ordinaTriggerRef.current && ordinaTriggerRef.current.contains(e.target))) {
        setOrdinaOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [filtriOpen, ordinaOpen]);

  function toggleFiltri() {
    if (!filtriOpen && filtriTriggerRef.current) {
      setFiltriRect(filtriTriggerRef.current.getBoundingClientRect());
    }
    setFiltriOpen(f => !f);
    setOrdinaOpen(false);
  }
  function toggleOrdina() {
    if (!ordinaOpen && ordinaTriggerRef.current) {
      setOrdinaRect(ordinaTriggerRef.current.getBoundingClientRect());
    }
    setOrdinaOpen(o => !o);
    setFiltriOpen(false);
  }
  function handleSetView(v)   { setView(v);   localStorage.setItem('malachia-view',   v); }
  function handleSetStatus(s) { setStatus(s); localStorage.setItem('malachia-status', s); }
  function handleSetSort(s)   { setSort(s);   localStorage.setItem('malachia-sort',   s); }

  /* ── Data loading ── */
  useEffect(() => { shelvesApi.list().then(setShelves).catch(() => {}); }, []);

  useEffect(() => {
    booksApi.list({ no_market_value: '1', limit: 1 })
      .then(r => setNoValueCount(r.total))
      .catch(() => {});
  }, []);

  const fetchLibTotal = useCallback(() => {
    statsApi.get().then(s => setTotalAll(s.total_books ?? 0)).catch(() => {});
  }, []);
  useEffect(() => { fetchLibTotal(); }, [fetchLibTotal]);
  useEffect(() => {
    window.addEventListener('malachia:stats-changed', fetchLibTotal);
    return () => window.removeEventListener('malachia:stats-changed', fetchLibTotal);
  }, [fetchLibTotal]);

  useLayoutEffect(() => {
    const scroll = initialScrollRef.current;
    _libScroll = 0;
    if (scroll <= 0) return;
    const el = document.querySelector('.cine-main');
    if (el) el.scrollTop = scroll;
  }, []);

  const handleNavigateToBook = useCallback((bookId) => {
    _libScroll = document.querySelector('.cine-main')?.scrollTop ?? 0;
    _libBooks  = books;
    sessionStorage.setItem('malachia-libreria-state', JSON.stringify({
      status, sort, filterFormat, filterLang,
    }));
    navigate(`/libro/${bookId}`, { state: { from: 'libreria' } });
  }, [navigate, books, status, sort, filterFormat, filterLang]);

  const load = useCallback(() => {
    const dir       = (sort === 'title' || sort === 'author') ? 'asc' : 'desc';
    const isNoValue = status === 'no_value';
    const key = JSON.stringify({ status, sort, filterFormat, filterLang });
    // Se abbiamo già questi risultati, mostrali subito (niente spinner) e aggiorna in background.
    const cached = _libCache.get(key);
    if (cached) { setBooks(cached.books); setTotal(cached.total); setLoading(false); }
    else setLoading(true);
    booksApi.list({
      status:          (!isNoValue && status) ? status : undefined,
      no_market_value: isNoValue ? '1' : undefined,
      sort, dir, page: 1, limit: 50000,
      format:   filterFormat || undefined,
      language: filterLang   || undefined,
    })
      .then(r => {
        _libCache.set(key, { books: r.books, total: r.total });
        setBooks(r.books); setTotal(r.total); setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, sort, filterFormat, filterLang]);

  useEffect(() => { load(); }, [load]);

  /* ── Context menu ── */
  async function handleBookContextMenu(e, book) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, book, shelfIds: new Set(), loading: true });
    try {
      const r = await booksApi.shelves(book.id);
      setContextMenu(c => c?.book.id === book.id
        ? { ...c, shelfIds: new Set(r.shelf_ids), loading: false } : c);
    } catch {
      setContextMenu(c => c?.book.id === book.id ? { ...c, loading: false } : c);
    }
  }

  async function toggleShelf(shelf) {
    if (!contextMenu) return;
    const { book, shelfIds } = contextMenu;
    const inShelf = shelfIds.has(shelf.id);
    try {
      if (inShelf) {
        await shelvesApi.removeBook(shelf.id, book.id);
        setContextMenu(c => c ? { ...c, shelfIds: new Set([...c.shelfIds].filter(id => id !== shelf.id)) } : c);
        setShelves(prev => prev.map(s => s.id === shelf.id ? { ...s, book_count: Math.max(0, (s.book_count || 0) - 1) } : s));
        toast(`"${book.title}" rimosso da "${shelf.name}"`, 'success');
      } else {
        await shelvesApi.addBook(shelf.id, book.id);
        setContextMenu(c => c ? { ...c, shelfIds: new Set([...c.shelfIds, shelf.id]) } : c);
        setShelves(prev => prev.map(s => s.id === shelf.id ? { ...s, book_count: (s.book_count || 0) + 1 } : s));
        toast(`"${book.title}" aggiunto a "${shelf.name}"`, 'success');
      }
    } catch { toast('Errore', 'error'); }
  }

  async function handleEditBook(book, data) {
    let saved = false;
    try { await booksApi.update(book.id, data); saved = true; }
    catch { toast('Errore durante il salvataggio', 'error'); }
    try {
      const fresh = await booksApi.get(book.id);
      setBooks(prev => prev.map(b => b.id === book.id ? fresh : b));
    } catch {}
    _libCache.clear(); // i dati in cache non sono più aggiornati
    setEditBook(null);
    if (saved) {
      toast(`"${book.title}" aggiornato`, 'success');
      window.dispatchEvent(new CustomEvent('malachia:stats-changed'));
    }
  }

  async function handleDeleteBook(book) {
    try {
      await booksApi.delete(book.id);
      setBooks(prev => prev.filter(b => b.id !== book.id));
      setTotal(t => Math.max(0, t - 1));
      setTotalAll(t => Math.max(0, t - 1));
      _libCache.clear(); // i dati in cache non sono più aggiornati
      toast(`"${book.title}" eliminato`, 'success');
      window.dispatchEvent(new CustomEvent('malachia:stats-changed'));
    } catch { toast('Errore durante l\'eliminazione', 'error'); }
  }

  /* ── Render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      <FilterStrip
        view={view}          onView={handleSetView}
        count={total}        total={totalAll}
        sort={sort}          status={status}
        filterFormat={filterFormat} filterLang={filterLang}
        noValueCount={noValueCount}
        onSearch={() => navigate('/cerca')}
        onFiltriClick={toggleFiltri}   filtriTriggerRef={filtriTriggerRef} filtriOpen={filtriOpen}
        onOrdinaClick={toggleOrdina}   ordinaTriggerRef={ordinaTriggerRef} ordinaOpen={ordinaOpen}
        cardW={cardW} onZoom={onZoom}
      />

      <div style={{ padding: '24px 56px 24px' }}>
        {loading && books.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="m-spinner"/>
          </div>
        ) : books.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="m-serif" style={{ fontSize: 28, fontStyle: 'italic', color: 'var(--m-ink-muted)' }}>
              Nessun volume trovato
            </div>
            <button className="m-btn" style={{ marginTop: 20 }} onClick={() => navigate('/aggiungi')}>
              + Aggiungi il tuo primo libro
            </button>
          </div>
        ) : view === 'grid' ? (
          <GridView
            books={books} navigate={navigate} cardW={cardW}
            onContextMenu={handleBookContextMenu}
            onBookClick={handleNavigateToBook}
          />
        ) : (
          <ListView
            books={books} navigate={navigate}
            onContextMenu={handleBookContextMenu}
            onBookClick={handleNavigateToBook}
          />
        )}
      </div>

      {/* Filtri popover */}
      {filtriOpen && filtriRect && (
        <FiltriPopover
          popoverRef={filtriPopRef}
          rect={filtriRect}
          status={status}           onStatus={handleSetStatus}
          filterFormat={filterFormat} onFilterFormat={setFilterFormat}
          filterLang={filterLang}    onFilterLang={setFilterLang}
          noValueCount={noValueCount}
        />
      )}

      {/* Ordina popover */}
      {ordinaOpen && ordinaRect && (
        <OrdinaPopover
          popoverRef={ordinaPopRef}
          rect={ordinaRect}
          sort={sort} onSort={handleSetSort}
        />
      )}

      {contextMenu && (
        <BookContextMenu
          x={contextMenu.x} y={contextMenu.y}
          book={contextMenu.book} shelves={shelves} shelfIds={contextMenu.shelfIds}
          onToggle={toggleShelf}   onClose={() => setContextMenu(null)}
          onNavigate={handleNavigateToBook} onEdit={book => setEditBook(book)}
          onDelete={handleDeleteBook}
        />
      )}

      {editBook && (
        <EditBookModal
          book={editBook}
          onSave={data => handleEditBook(editBook, data)}
          onClose={() => setEditBook(null)}
        />
      )}
    </div>
  );
}

/* ─── GridView ──────────────────────────────────────────────────────────────── */
function GridView({ books, navigate, cardW = 110, onContextMenu, onBookClick }) {
  const [hoveredId, setHoveredId] = useState(null);
  const cardH = Math.round(cardW * 1.44);
  const titleSize  = Math.max(9,  Math.round(cardW * 0.10));
  const authorSize = Math.max(9,  Math.round(cardW * 0.09));

  const SHADOW_ACTIVE =
    'inset 0 0 0 1px rgba(0,0,0,0.25), inset 6px 0 0 rgba(0,0,0,0.18), ' +
    '0 8px 22px rgba(0,0,0,0.6), 0 0 0 1px var(--cine-gold), 0 0 24px rgba(216,180,106,0.45)';
  const SHADOW_REST =
    'inset 0 0 0 1px rgba(0,0,0,0.25), inset 6px 0 0 rgba(0,0,0,0.15), ' +
    '0 4px 14px rgba(0,0,0,0.55)';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${cardW}px, 1fr))`,
      gap: '30px 22px',
      paddingBottom: 24,
      alignItems: 'start',
    }}>
      {books.map(b => (
        <div
          key={b.id}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          onClick={() => onBookClick ? onBookClick(b.id) : navigate(`/libro/${b.id}`)}
          onContextMenu={e => onContextMenu(e, b)}
          onMouseEnter={() => setHoveredId(b.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <div style={{
            width: cardW, height: cardH, flexShrink: 0,
            position: 'relative', overflow: 'hidden',
            boxShadow: hoveredId === b.id ? SHADOW_ACTIVE : SHADOW_REST,
            transition: 'box-shadow 200ms',
          }}>
            <BookCover book={b} w={cardW} h={cardH}/>
          </div>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: titleSize, color: 'rgba(232,220,192,0.95)', lineHeight: 1.3,
            letterSpacing: '0.04em',
            textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
            width: '100%', textAlign: 'center',
          }}>{b.title}</div>
          <div
            style={{
              fontFamily: "'Agmena Pro', Georgia, serif", fontStyle: 'italic',
              fontSize: authorSize, color: 'rgba(232,220,192,0.72)', lineHeight: 1.3,
              width: '100%', textAlign: 'center',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
            }}
            onClick={e => e.stopPropagation()}
          >
            {b.authors?.length > 0
              ? b.authors.map((a, i) => (
                  <React.Fragment key={a.id}>
                    {i > 0 && ', '}
                    <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/autori/${a.id}`)}>
                      {a.name}
                    </span>
                  </React.Fragment>
                ))
              : (b.author_names || '')}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── ListView ──────────────────────────────────────────────────────────────── */
const LIST_COLS = [
  { key: 'nome',   label: 'Nome',   w: '2.2fr', align: 'left'  },
  { key: 'autore', label: 'Autore', w: '1.4fr', align: 'left'  },
  { key: 'stato',  label: 'Stato',  w: '130px', align: 'right' },
  { key: 'anno',   label: 'Anno',   w: '70px',  align: 'right' },
  { key: 'pag',    label: 'Pag.',   w: '60px',  align: 'right' },
];
const LIST_COLS_TPL = LIST_COLS.map(c => c.w).join(' ');

function ListHeader() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: LIST_COLS_TPL,
      alignItems: 'center', padding: '8px 18px',
      borderBottom: '1px solid rgba(216,180,106,0.22)',
    }}>
      {LIST_COLS.map(c => (
        <div key={c.key} style={{ textAlign: c.align }}>
          <span style={{
            fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
            letterSpacing: '0.26em', fontSize: 9, fontWeight: 500,
            color: 'rgba(232,220,192,0.55)',
            textShadow: '0 1px 0 rgba(0,0,0,0.6)',
          }}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

function ListView({ books, navigate, onContextMenu, onBookClick }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div style={{ paddingBottom: 20 }}>
      <ListHeader/>
      {books.map(b => {
        const sd      = STATUS_DISPLAY[b.status] || { label: b.status || '—', color: 'rgba(232,220,192,0.5)' };
        const hovered = hoveredId === b.id;
        return (
          <div
            key={b.id}
            style={{
              display: 'grid', gridTemplateColumns: LIST_COLS_TPL,
              alignItems: 'center', padding: '10px 18px',
              borderBottom: '1px solid rgba(216,180,106,0.10)',
              background: hovered
                ? 'linear-gradient(90deg, transparent 0%, rgba(232,220,192,0.10) 30%, rgba(232,220,192,0.14) 50%, rgba(232,220,192,0.10) 70%, transparent 100%)'
                : 'transparent',
              position: 'relative', cursor: 'pointer',
              transition: 'background 120ms',
            }}
            onClick={() => onBookClick ? onBookClick(b.id) : navigate(`/libro/${b.id}`)}
            onContextMenu={e => onContextMenu(e, b)}
            onMouseEnter={() => setHoveredId(b.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {hovered && (
              <span style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: 2, background: 'var(--cine-gold)',
              }}/>
            )}

            {/* Nome */}
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: hovered ? 6 : 0, transition: 'padding 120ms' }}>
              <span style={{
                fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 14,
                color: 'var(--cine-cream)', textShadow: '0 1px 0 rgba(0,0,0,0.55)',
              }}>{b.title}</span>
              {b.series_name && (
                <span style={{
                  fontFamily: "'Agmena Pro', Georgia, serif", fontStyle: 'italic',
                  fontSize: 11, color: 'var(--cine-gold-dim)', marginLeft: 8,
                }}>
                  {b.series_name}{b.series_volume ? ` #${b.series_volume}` : ''}
                </span>
              )}
            </div>

            {/* Autore */}
            <div
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              onClick={e => e.stopPropagation()}
            >
              <span style={{
                fontFamily: "'Agmena Pro', Georgia, serif", fontSize: 13,
                color: 'rgba(232,220,192,0.78)',
              }}>
                {b.authors?.length > 0
                  ? b.authors.map((a, i) => (
                      <React.Fragment key={a.id}>
                        {i > 0 && ', '}
                        <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/autori/${a.id}`)}>
                          {a.name}
                        </span>
                      </React.Fragment>
                    ))
                  : (b.author_names || '—')}
              </span>
            </div>

            {/* Stato */}
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 10,
                letterSpacing: '0.16em', textTransform: 'uppercase', color: sd.color,
              }}>{sd.label}</span>
            </div>

            {/* Anno */}
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 12,
                color: 'var(--cine-cream)', fontVariantNumeric: 'tabular-nums',
              }}>{b.year || ''}</span>
            </div>

            {/* Pagine */}
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 12,
                color: 'rgba(232,220,192,0.78)', fontVariantNumeric: 'tabular-nums',
              }}>{b.pages || ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
