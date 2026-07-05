import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import { books as booksApi, wishlist as wishlistApi, importApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';
import { AppContext } from '../AppContext.jsx';

/* ─── Design tokens ─────────────────────────────────────────────────────────── */
const GOLD  = '#d8b46a';
const VERM  = '#c0533b';
const CREAM = '#e8dcc0';
const SERIF = "'Cinzel', 'Cormorant Garamond', serif";
const BODY  = "'Agmena Pro', Georgia, serif";

/* ─── LocalStorage keys ─────────────────────────────────────────────────────── */
const LS_BG           = 'malachia-tolkien-cine-bg';
const LS_WL_COVERS    = 'malachia-tolkien-wl-covers';
const LS_WORK_ORDER   = 'malachia-tolkien-work-order';
const LS_WORK_NAMES   = 'malachia-tolkien-work-names';
const LS_HIDDEN_WORKS = 'malachia-tolkien-hidden-works';
const LS_CUSTOM_WORKS = 'malachia-tolkien-custom-works';
const LS_ASSIGNMENTS    = 'malachia-tolkien-assignments';
const LS_ED_ORDERS      = 'malachia-tolkien-ed-orders';

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
async function resizeToDataUrl(file, maxW = 1400) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.width);
      const c = document.createElement('canvas');
      c.width = img.width * scale; c.height = img.height * scale;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  });
}
function getWlCover(id) {
  try { return JSON.parse(localStorage.getItem(LS_WL_COVERS) || '{}')[id] || null; } catch { return null; }
}
function setWlCover(id, dataUrl) {
  try {
    const m = JSON.parse(localStorage.getItem(LS_WL_COVERS) || '{}');
    if (dataUrl) m[id] = dataUrl; else delete m[id];
    localStorage.setItem(LS_WL_COVERS, JSON.stringify(m));
  } catch {}
}
function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function isTolkien(str) {
  return (str || '').toLowerCase().includes('tolkien');
}

/* ─── Virtual entries ────────────────────────────────────────────────────────── */
const VIRTUAL = [
  { id: '__tutti__',      t: 'Tutti i libri', isVirtual: true },
  { id: '__desiderata__', t: 'Desiderata',    isVirtual: true },
];

/* ════════════════════════════════════════════════════════════════════════════
   GLYPHS
════════════════════════════════════════════════════════════════════════════ */
function Diamond({ size = 11, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
      <path d="M6 0.5 L11.5 6 L6 11.5 L0.5 6 Z" fill="none" stroke={color || GOLD} strokeWidth="1.1" />
    </svg>
  );
}
function Check({ size = 12, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
      <path d="M2 7.4 L5.4 11 L12 2.6" fill="none" stroke={color || GOLD} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BACKGROUND
════════════════════════════════════════════════════════════════════════════ */
function TKJScene() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.5, filter: 'blur(2px)' }}>
      <svg viewBox="0 0 1280 880" preserveAspectRatio="xMidYMax slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g fill="rgba(14,20,15,0.85)">
          <path d="M0,640 L60,470 L120,640 Z" /><path d="M150,640 L210,500 L270,640 Z" />
          <path d="M900,660 L980,460 L1060,660 Z" /><path d="M1080,660 L1150,510 L1220,660 Z" />
        </g>
        <g fill="rgba(20,26,22,0.9)">
          <rect x="1040" y="300" width="34" height="430" />
          <rect x="1190" y="300" width="34" height="430" />
          <path d="M1040,300 Q1132,210 1224,300 L1224,330 Q1132,250 1040,330 Z" />
        </g>
        <rect x="0" y="600" width="1280" height="280" fill="rgba(8,11,8,0.7)" />
      </svg>
    </div>
  );
}

function TKJAtmosphere() {
  const grain = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.7  0 0 0 0 0.72  0 0 0 0 0.66  0 0 0 0.35 0"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>'
  ) + '")';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes tkj-fogA{0%{transform:translateX(-4%) translateY(0)}50%{transform:translateX(4%) translateY(-2%)}100%{transform:translateX(-4%) translateY(0)}}
        @keyframes tkj-fogB{0%{transform:translateX(3%)}50%{transform:translateX(-5%)}100%{transform:translateX(3%)}}
      `}</style>
      <div style={{ position: 'absolute', inset: '-10%', animation: 'tkj-fogA 38s ease-in-out infinite',
        background: 'radial-gradient(60% 40% at 30% 78%,rgba(190,200,185,.10),transparent 60%),radial-gradient(70% 36% at 75% 86%,rgba(170,185,175,.09),transparent 62%)' }} />
      <div style={{ position: 'absolute', inset: '-10%', animation: 'tkj-fogB 52s ease-in-out infinite',
        background: 'radial-gradient(80% 30% at 50% 96%,rgba(200,205,195,.12),transparent 64%)' }} />
      <div style={{ position: 'absolute', inset: 0, background:
        'linear-gradient(90deg,rgba(4,6,4,.6) 0%,rgba(4,6,4,.1) 28%,transparent 46%),' +
        'linear-gradient(180deg,rgba(4,6,4,.5) 0%,transparent 16%,transparent 82%,rgba(4,6,4,.55) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.45, mixBlendMode: 'overlay', backgroundImage: grain }} />
      <div style={{ position: 'absolute', inset: 0,
        background: 'radial-gradient(130% 110% at 50% 38%,transparent 44%,rgba(4,6,4,.72) 100%)' }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TOP BAR
════════════════════════════════════════════════════════════════════════════ */
function CambiaSfondoBtn({ onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      title="Cambia sfondo"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: h ? 9 : 0,
        padding: '0 12px', height: 36, overflow: 'hidden',
        background: 'rgba(8,10,7,0.5)',
        border: '1px solid ' + (h ? 'rgba(216,180,106,0.5)' : 'rgba(232,220,192,0.28)'),
        color: h ? GOLD : CREAM, cursor: 'pointer',
        backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
        transition: 'all .18s ease',
      }}>
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
        <rect x="1.2" y="2.4" width="11.6" height="9.2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="4.6" cy="5.4" r="1.1" fill="currentColor" />
        <path d="M1.4 10.4 L5 7 L7.6 9.4 L9.6 7.6 L12.6 10.6" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      </svg>
      <span style={{
        fontFamily: SERIF, textTransform: 'uppercase', letterSpacing: '0.16em',
        fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
        maxWidth: h ? 120 : 0, opacity: h ? 1 : 0,
        overflow: 'hidden', transition: 'max-width .18s ease, opacity .18s ease',
      }}>Cambia sfondo</span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   LEFT COLUMN — TITLE ROWS
════════════════════════════════════════════════════════════════════════════ */
function RowAction({ title, onClick, children }) {
  const [h, setH] = useState(false);
  return (
    <button title={title} onClick={e => { e.stopPropagation(); onClick && onClick(); }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 24, height: 24, padding: 0, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: h ? 'rgba(216,180,106,0.18)' : 'rgba(8,10,7,0.7)',
        border: '1px solid ' + (h ? 'rgba(216,180,106,0.7)' : 'rgba(232,220,192,0.3)'),
        color: h ? GOLD : 'rgba(232,220,192,0.85)', cursor: 'pointer',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        transition: 'all .15s ease',
      }}>
      {children}
    </button>
  );
}

function TKJTitleRow({ entry, selected, onClick, onRename, onDelete, onDragStart, onDragOver, onDrop, isDragOver, isEditionDropTarget }) {
  const [hover, setHover] = useState(false);
  const isVirtual = !!entry.isVirtual;
  const allDes = !isVirtual && entry.ed && entry.ed.length > 0 && entry.ed.every(e => !e.owned);
  const size = selected ? 25 : 15.5;
  const col  = selected ? CREAM : hover ? 'rgba(232,220,192,0.92)' : 'rgba(232,220,192,0.6)';

  return (
    <div
      draggable={!isVirtual}
      onDragStart={!isVirtual ? onDragStart : undefined}
      onDragOver={e => { if (!isVirtual) { e.preventDefault(); onDragOver && onDragOver(e); } }}
      onDrop={e => { e.preventDefault(); onDrop && onDrop(e); }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', display: 'grid', gridTemplateColumns: '1fr 28px',
        alignItems: 'center', cursor: 'pointer', padding: '5px 0', userSelect: 'none',
        outline: isDragOver ? '1px dashed rgba(216,180,106,0.6)' : 'none',
        outlineOffset: 2,
        background: isEditionDropTarget ? 'rgba(216,180,106,0.12)' : 'transparent',
        borderRadius: 4,
        transition: 'background .15s ease',
      }}>

      {!isVirtual && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', gap: 6, opacity: hover ? 1 : 0, pointerEvents: hover ? 'auto' : 'none',
          transition: 'opacity .15s ease', zIndex: 4,
        }}>
          <RowAction title="Trascina per spostare">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 1 L5.5 10 M3 3 L5.5 0.7 L8 3 M3 8 L5.5 10.3 L8 8"
                stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </RowAction>
          <RowAction title="Rinomina scaffale" onClick={onRename}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M8.4 1.6 L10.4 3.6 L4 10 L1.6 10.4 L2 8 Z"
                stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </RowAction>
          <RowAction title="Rimuovi scaffale" onClick={onDelete}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 1.5 L8.5 8.5 M8.5 1.5 L1.5 8.5"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </RowAction>
        </div>
      )}

      <div style={{
        textAlign: 'right', fontFamily: SERIF, textTransform: 'uppercase',
        letterSpacing: selected ? '0.03em' : '0.07em', fontSize: size,
        fontWeight: selected ? 600 : 500, color: col, lineHeight: 1.12,
        transition: 'font-size .22s ease, color .18s ease, letter-spacing .22s ease',
        textShadow: selected ? '0 2px 12px rgba(0,0,0,0.75)' : '0 1px 4px rgba(0,0,0,0.65)',
      }}>{entry.t}</div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <span style={{
          display: 'block',
          width: selected ? 2 : 1.5, height: selected ? 22 : 13,
          background: selected ? GOLD : hover ? 'rgba(232,220,192,0.7)' : 'rgba(232,220,192,0.4)',
          boxShadow: selected ? '0 0 8px rgba(216,180,106,0.6)' : 'none',
          transition: 'all .2s ease',
        }} />
        {((isVirtual && entry.id === '__desiderata__') || (!isVirtual && allDes)) && !selected && (
          <span style={{
            position: 'absolute', right: 1, width: 5, height: 5,
            transform: 'rotate(45deg)', border: '1px solid rgba(192,83,59,0.75)',
          }} />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   RIGHT PANEL DECORATIONS
════════════════════════════════════════════════════════════════════════════ */
function TKJCorner({ pos }) {
  const base = { position: 'absolute', width: 26, height: 26, pointerEvents: 'none' };
  const place = {
    tl: { top: -1, left: -1 }, tr: { top: -1, right: -1, transform: 'scaleX(-1)' },
    bl: { bottom: -1, left: -1, transform: 'scaleY(-1)' }, br: { bottom: -1, right: -1, transform: 'scale(-1,-1)' },
  }[pos];
  return (
    <svg viewBox="0 0 26 26" style={{ ...base, ...place }}>
      <path d="M0 9 L0 0 L9 0" stroke={GOLD} strokeWidth="1.3" fill="none" />
      <path d="M3 12 L12 3" stroke={GOLD} strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M6.5 2.5 L8 4 L6.5 5.5 L5 4 Z" fill={GOLD} opacity="0.9" />
    </svg>
  );
}

function TKJBanner({ title, eyebrow }) {
  const grain = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.36  0 0 0 0 0.28  0 0 0 0 0.16  0 0 0 0.4 0"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>'
  ) + '")';
  return (
    <div style={{ position: 'relative', display: 'inline-block', maxWidth: 600 }}>
      <div style={{
        position: 'relative', padding: '14px 44px 17px',
        background: 'linear-gradient(176deg, #ece1c6 0%, #ddceaa 52%, #cdbb91 100%)',
        clipPath: 'polygon(2.5% 16%, 7% 0%, 38% 7%, 62% 1%, 94% 6%, 99% 26%, 98% 70%, 95% 100%, 60% 93%, 34% 99%, 6% 92%, 1% 64%)',
        boxShadow: '0 14px 30px rgba(0,0,0,0.55), 0 2px 0 rgba(0,0,0,0.2)',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.25, mixBlendMode: 'multiply', backgroundImage: grain }} />
        {eyebrow && (
          <div style={{
            position: 'relative', fontFamily: SERIF, textTransform: 'uppercase',
            letterSpacing: '0.28em', fontSize: 10.5, color: 'rgba(42,22,6,0.82)',
            textAlign: 'center', marginBottom: 6,
            textShadow: '0 1px 0 rgba(255,255,255,0.5)',
          }}>{eyebrow}</div>
        )}
        <div style={{
          position: 'relative', fontFamily: SERIF, textTransform: 'uppercase',
          letterSpacing: '0.06em', fontSize: 26, fontWeight: 700, color: '#1e0e04',
          textAlign: 'center', lineHeight: 1.04,
          textShadow: '0 1px 2px rgba(255,255,255,0.6), 0 2px 6px rgba(0,0,0,0.15)',
        }}>{title}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   EDITION COVER (owned)
════════════════════════════════════════════════════════════════════════════ */
function EditionCover({ work, edition, onContextMenu, isDragOver, dragging }) {
  return (
    <div
      style={{
        position: 'relative', cursor: 'context-menu', width: '100%',
        outline: isDragOver ? '2px solid rgba(216,180,106,0.7)' : '2px solid transparent',
        outlineOffset: 3, opacity: dragging ? 0.45 : 1,
        transition: 'outline-color .12s ease, opacity .15s ease',
      }}
      onContextMenu={onContextMenu}
    >
      <div style={{ width: '100%', aspectRatio: '190 / 275', overflow: 'hidden' }}>
        <BookCover book={edition.book} title={work.t} author={edition.l} w='100%' h='100%' />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DESIDERATA COVER (with hover acquire button)
════════════════════════════════════════════════════════════════════════════ */
function DesiderataCover({ work, edition, onAcquire, onContextMenu, isDragOver, dragging }) {
  const [hov, setHov] = useState(false);
  const coverSrc = edition.wlCover || edition.coverUrl || null;
  return (
    <div
      style={{
        position: 'relative', cursor: 'context-menu', width: '100%',
        outline: isDragOver ? '2px solid rgba(216,180,106,0.7)' : '2px solid transparent',
        outlineOffset: 3, opacity: dragging ? 0.45 : 1,
        transition: 'outline-color .12s ease, opacity .15s ease',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onContextMenu={onContextMenu}
    >
      <div style={{ width: '100%', aspectRatio: '190 / 275', overflow: 'hidden' }}>
        {coverSrc
          ? <img src={coverSrc} alt={work.t} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <BookCover title={work.t} author={edition.l} w='100%' h='100%' />
        }
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        padding: '0 10px 12px',
        opacity: hov ? 1 : 0, pointerEvents: hov ? 'auto' : 'none',
        transition: 'opacity .18s ease',
      }}>
        <button
          onClick={e => { e.stopPropagation(); onAcquire && onAcquire(); }}
          style={{
            width: '100%', padding: '6px 0',
            background: 'rgba(216,180,106,0.18)', border: '1px solid rgba(216,180,106,0.65)',
            color: GOLD, fontFamily: SERIF, textTransform: 'uppercase',
            letterSpacing: '0.12em', fontSize: 9, fontWeight: 600, cursor: 'pointer',
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            transition: 'background .15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(216,180,106,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(216,180,106,0.18)'}
        >
          ✓ Aggiungi
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CONTEXT MENU
════════════════════════════════════════════════════════════════════════════ */
function ContextMenu({ x, y, edition, work, works, onClose, onDelete, onMove, navigate }) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  // Position the menu — flip left when near the right edge
  const menuW = 230;
  const spaceRight = window.innerWidth - x;
  const flipLeft = spaceRight < menuW + 16;
  const px = flipLeft ? Math.max(8, x - menuW) : x;
  const py = Math.min(y, window.innerHeight - 250);

  const book = edition.book;
  const moveTargets = works.filter(w => w.id !== work.id);

  return (
    <div ref={ref} style={{
      position: 'fixed', left: px, top: py, zIndex: 1000,
      background: 'rgba(10,12,10,0.96)',
      border: '1px solid rgba(216,180,106,0.35)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
      minWidth: menuW, padding: '6px 0',
      fontFamily: BODY, fontSize: 13, color: CREAM,
    }}>
      {/* Work label */}
      <div style={{
        padding: '5px 14px 8px', fontFamily: SERIF, textTransform: 'uppercase',
        fontSize: 9, letterSpacing: '0.22em', color: 'rgba(216,180,106,0.55)',
        borderBottom: '1px solid rgba(216,180,106,0.15)',
      }}>{work.t}</div>

      {/* Open page — only for owned books with an id */}
      {book && (
        <CtxItem onClick={() => { navigate(`/libro/${book.id}`); onClose(); }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="2" width="10" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.1"/>
            <path d="M4 5 L10 5 M4 7.5 L9 7.5 M4 10 L7.5 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          Apri pagina libro
        </CtxItem>
      )}

      {/* Edit — only for owned books */}
      {book && (
        <CtxItem onClick={() => { navigate(`/libro/${book.id}`); onClose(); }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <path d="M8.4 1.6 L10.4 3.6 L4 10 L1.6 10.4 L2 8 Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
          </svg>
          Modifica libro
        </CtxItem>
      )}

      {/* Move to scaffale */}
      {moveTargets.length > 0 && (
        <div style={{ position: 'relative' }}
          onMouseEnter={() => setShowMoveMenu(true)}
          onMouseLeave={() => setShowMoveMenu(false)}>
          <CtxItem arrow>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <path d="M2 7 L12 7 M9 4 L12 7 L9 10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sposta in scaffale
          </CtxItem>
          {showMoveMenu && (
            <div style={{
              position: 'absolute', left: flipLeft ? 'auto' : '100%', right: flipLeft ? '100%' : 'auto', top: 0,
              background: 'rgba(10,12,10,0.97)',
              border: '1px solid rgba(216,180,106,0.35)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
              minWidth: 200, padding: '6px 0',
              maxHeight: 300, overflowY: 'auto',
            }}>
              {moveTargets.map(w => (
                <CtxItem key={w.id} onClick={() => { onMove(w.id); onClose(); }}>
                  {w.t}
                </CtxItem>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Separator + Delete — only for owned books */}
      {book && (<>
        <div style={{ height: 1, background: 'rgba(216,180,106,0.15)', margin: '4px 0' }} />
        <CtxItem danger onClick={() => { onDelete(); onClose(); }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <path d="M2 3 L10 3 M4.5 3 L4.5 1.5 L7.5 1.5 L7.5 3 M3 3 L3 10.5 L9 10.5 L9 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Elimina dalla libreria
        </CtxItem>
      </>)}
    </div>
  );
}

function CtxItem({ onClick, children, danger, arrow }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 14px', cursor: 'pointer',
        background: h ? 'rgba(216,180,106,0.1)' : 'transparent',
        color: danger ? (h ? '#e07060' : 'rgba(200,100,80,0.85)') : (h ? CREAM : 'rgba(232,220,192,0.75)'),
        transition: 'all .1s ease',
        justifyContent: 'space-between',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>{children}</div>
      {arrow && <span style={{ opacity: 0.5, fontSize: 11 }}>▶</span>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FOOTER BUTTON
════════════════════════════════════════════════════════════════════════════ */
function FooterBtn({ title, onClick, primary }) {
  const [h, setH] = useState(false);
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 38, height: 38, padding: 0, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: primary ? (h ? 'rgba(216,180,106,0.22)' : 'rgba(216,180,106,0.13)')
                            : (h ? 'rgba(216,180,106,0.12)' : 'rgba(8,10,7,0.5)'),
        border: '1px solid ' + (primary ? 'rgba(216,180,106,0.65)'
                                        : (h ? 'rgba(216,180,106,0.5)' : 'rgba(232,220,192,0.28)')),
        color: primary || h ? GOLD : CREAM, cursor: 'pointer',
        backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
        transition: 'all .15s ease',
      }}>
      <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
        <path d="M6 1.5 L6 10.5 M1.5 6 L10.5 6"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BACK ORB
════════════════════════════════════════════════════════════════════════════ */
function BackOrb({ onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      title="Torna alle collezioni"
      style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        width: 40, height: 40, borderRadius: '50%', zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8,10,7,0.5)',
        border: '1px solid ' + (h ? 'rgba(216,180,106,0.6)' : 'rgba(232,220,192,0.28)'),
        color: h ? GOLD : CREAM, cursor: 'pointer',
        backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
        transition: 'border-color .18s ease, color .18s ease',
      }}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M11.5 4 L5.5 10 L11.5 16 M5.5 10 L16 10"
          stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MODALS
════════════════════════════════════════════════════════════════════════════ */
function TextModal({ title, label, initial, onSave, onClose }) {
  const [val, setVal] = useState(initial || '');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
      <div style={{ background: 'var(--m-parchment)', padding: 28, width: 400, border: '1px solid var(--m-rule)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="m-serif" style={{ fontSize: 18, fontWeight: 500 }}>{title}</div>
        <div className="m-field">
          <label>{label}</label>
          <input className="m-input" value={val} autoFocus
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && val.trim() && onSave(val.trim())} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="m-btn m-btn-ghost" onClick={onClose}>Annulla</button>
          <button className="m-btn" onClick={() => val.trim() && onSave(val.trim())} disabled={!val.trim()}>Salva</button>
        </div>
      </div>
    </div>
  );
}

/* WishlistItemForm (minimal, for Nuovo libro) */
const WL_PROVIDERS = [
  { id: 'google_books', label: 'Google Books', short: 'G',  color: '#2a3a5a' },
  { id: 'open_library', label: 'Open Library', short: 'OL', color: '#3a5a2a' },
  { id: 'goodreads',    label: 'Goodreads',    short: 'GR', color: '#7b3f00' },
];
function wlDedup(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.isbn13 || item.isbn10 || (item.title || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false; seen.add(key); return true;
  });
}
function wlBookKey(b) {
  return b.isbn13 || b.isbn10 || b.google_books_id || ((b.title || '') + '|' + (b.authors?.[0]?.name ?? b.authors?.[0] ?? ''));
}

function WishlistItemForm({ initial = {}, onSave, saving, submitLabel = 'Aggiungi' }) {
  const [title,     setTitle]     = useState(initial.title     || '');
  const [author,    setAuthor]    = useState(initial.author    || '');
  const [publisher, setPublisher] = useState(initial.publisher || '');
  const [year,      setYear]      = useState(String(initial.year || ''));
  const [isbn13,    setIsbn13]    = useState(initial.isbn13    || '');
  const [priority,  setPriority]  = useState(initial.priority  || 'medium');
  const [notes,     setNotes]     = useState(initial.notes     || '');
  const [coverUrl,  setCoverUrl]  = useState(initial.cover_url || '');
  const [coverData, setCoverData] = useState(initial._coverData || null);
  const [coverMode, setCoverMode] = useState('url');
  const coverPreview = coverData || coverUrl || null;

  async function handleCoverFile(e) {
    const file = e.target.files[0]; if (!file) return;
    try { const d = await resizeToDataUrl(file, 400); setCoverData(d); setCoverUrl(''); } catch {}
    e.target.value = '';
  }
  function submit() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), author: author.trim() || null, publisher: publisher.trim() || null,
      year: year ? parseInt(year) : null, isbn13: isbn13.trim() || null, priority,
      notes: notes.trim() || null, cover_url: coverUrl.trim() || null, _coverData: coverData });
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 20, alignItems: 'start' }}>
      <div>
        {coverPreview
          ? <img src={coverPreview} alt="cover" style={{ width: 110, height: 164, objectFit: 'cover', display: 'block', border: '1px solid var(--m-rule)', marginBottom: 8 }} />
          : <div style={{ width: 110, height: 164, background: 'var(--m-rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--m-rule-strong)', marginBottom: 8 }}><span style={{ fontSize: 28, opacity: 0.2 }}>◇</span></div>}
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          <button className={`m-btn m-btn-sm${coverMode === 'url' ? '' : ' m-btn-ghost'}`} style={{ fontSize: 10, flex: 1, justifyContent: 'center' }} onClick={() => setCoverMode('url')}>URL</button>
          <button className={`m-btn m-btn-sm${coverMode === 'file' ? '' : ' m-btn-ghost'}`} style={{ fontSize: 10, flex: 1, justifyContent: 'center' }} onClick={() => setCoverMode('file')}>File</button>
        </div>
        {coverMode === 'url'
          ? <input className="m-input" placeholder="https://…" value={coverUrl} style={{ fontSize: 11, padding: '4px 6px', width: '100%', boxSizing: 'border-box' }}
              onChange={e => { setCoverUrl(e.target.value); if (e.target.value) setCoverData(null); }} />
          : <input type="file" accept="image/*" onChange={handleCoverFile} style={{ fontSize: 10, width: '100%' }} />}
        {coverPreview && <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 10, marginTop: 6, width: '100%' }} onClick={() => { setCoverUrl(''); setCoverData(null); }}>× rimuovi</button>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="m-field"><label>Titolo *</label><input className="m-input" value={title} onChange={e => setTitle(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && submit()} /></div>
        <div className="m-field"><label>Autore/i</label><input className="m-input" value={author} onChange={e => setAuthor(e.target.value)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="m-field"><label>Editore</label><input className="m-input" value={publisher} onChange={e => setPublisher(e.target.value)} /></div>
          <div className="m-field"><label>Anno</label><input className="m-input" type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2024" /></div>
          <div className="m-field"><label>ISBN-13</label><input className="m-input m-mono" value={isbn13} onChange={e => setIsbn13(e.target.value)} placeholder="9780…" /></div>
          <div className="m-field"><label>Priorità</label>
            <select className="m-select" style={{ width: '100%' }} value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="high">Alta</option><option value="medium">Media</option><option value="low">Bassa</option>
            </select>
          </div>
        </div>
        <div className="m-field"><label>Note</label><textarea className="m-textarea" style={{ minHeight: 52 }} value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <button className="m-btn" onClick={submit} disabled={saving || !title.trim()}>{saving ? 'Salvataggio…' : submitLabel}</button>
      </div>
    </div>
  );
}

function WishlistModal({ onAdd, onClose }) {
  const [mode,    setMode]    = useState('search');
  const [saving,  setSaving]  = useState(false);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [pStatus, setPStatus] = useState({ google_books: 'idle', open_library: 'idle', goodreads: 'idle' });
  const [pError,  setPError]  = useState({});
  const [added,   setAdded]   = useState(new Set());
  const anyLoading = Object.values(pStatus).some(s => s === 'loading');

  async function doSearch(providers = WL_PROVIDERS.map(p => p.id)) {
    const q = query.trim(); if (!q) return;
    const fullQ = 'tolkien ' + q;
    if (providers.length === WL_PROVIDERS.length) setResults([]);
    setPStatus(ps => { const n = { ...ps }; providers.forEach(id => { n[id] = 'loading'; }); return n; });
    setPError(pe => { const n = { ...pe }; providers.forEach(id => { delete n[id]; }); return n; });

    const runs = [];
    if (providers.includes('google_books')) runs.push(async () => {
      try {
        const data = await importApi.search({ query: fullQ, providers: ['google_books'] });
        const items = (data.results || []).map(r => ({ ...r, source: 'google_books' }));
        setResults(prev => wlDedup([...prev, ...items]));
        setPStatus(ps => ({ ...ps, google_books: items.length }));
      } catch (e) { setPStatus(ps => ({ ...ps, google_books: 'error' })); setPError(pe => ({ ...pe, google_books: e?.message })); }
    });
    if (providers.includes('open_library')) runs.push(async () => {
      try {
        const data = await importApi.search({ query: fullQ, providers: ['open_library'] });
        const items = (data.results || []).map(r => ({ ...r, source: 'open_library' }));
        setResults(prev => wlDedup([...prev, ...items]));
        setPStatus(ps => ({ ...ps, open_library: items.length }));
      } catch (e) { setPStatus(ps => ({ ...ps, open_library: 'error' })); setPError(pe => ({ ...pe, open_library: e?.message })); }
    });
    if (providers.includes('goodreads')) runs.push(async () => {
      try {
        const data = await importApi.goodreadsSearch(q);
        const items = (data.results || []).map(r => ({ ...r, source: 'goodreads' }));
        setResults(prev => wlDedup([...prev, ...items]));
        if (data.error) { setPStatus(ps => ({ ...ps, goodreads: 'error' })); setPError(pe => ({ ...pe, goodreads: data.error })); }
        else setPStatus(ps => ({ ...ps, goodreads: items.length }));
      } catch (e) { setPStatus(ps => ({ ...ps, goodreads: 'error' })); setPError(pe => ({ ...pe, goodreads: e?.message || 'Non disponibile' })); }
    });
    await Promise.all(runs.map(fn => fn()));
  }

  async function addToWl(book) {
    const authors = (book.authors || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean).join(', ');
    try {
      const item = await wishlistApi.create({ title: book.title, author: authors || 'J.R.R. Tolkien', priority: 'medium', cover_url: book.thumbnail || book.cover_url || undefined, notes: [book.publisher, book.year, book.isbn13].filter(Boolean).join(' · ') || '' });
      onAdd(item); setAdded(prev => new Set([...prev, wlBookKey(book)]));
    } catch {}
  }
  async function manualAdd(data) {
    setSaving(true);
    try {
      const { _coverData, ...apiData } = data;
      const item = await wishlistApi.create(apiData);
      if (_coverData) setWlCover(item.id, _coverData);
      onAdd(item); onClose();
    } catch {} finally { setSaving(false); }
  }

  const TABS = [{ id: 'search', label: '⌕ Cerca' }, { id: 'manual', label: '✎ Manuale' }];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: 'var(--m-parchment)', width: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--m-rule)' }}>
        <div style={{ padding: '18px 28px 0', borderBottom: '1px solid var(--m-rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div className="m-eyebrow" style={{ fontSize: 10 }}>Tolkien · Desiderata</div>
              <div className="m-serif" style={{ fontSize: 20, fontWeight: 500, marginTop: 2 }}>Aggiungi un titolo</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--m-ink-muted)', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', marginBottom: -1 }}>
            {TABS.map(t => <button key={t.id} onClick={() => setMode(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '7px 16px', fontSize: 13, borderBottom: mode === t.id ? '2px solid var(--m-terracotta)' : '2px solid transparent', color: mode === t.id ? 'var(--m-ink)' : 'var(--m-ink-muted)', fontFamily: "'EB Garamond', serif" }}>{t.label}</button>)}
          </div>
        </div>
        {mode === 'search' && (<>
          <div style={{ padding: '14px 28px 10px', borderBottom: '1px solid var(--m-rule)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="m-input" placeholder="Cerca titolo, ISBN…" value={query} autoFocus onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} style={{ flex: 1 }} />
              <button className="m-btn" onClick={() => doSearch()} disabled={anyLoading}>{anyLoading ? '…' : 'cerca'}</button>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {WL_PROVIDERS.map(p => {
                const s = pStatus[p.id]; const isLoading = s === 'loading', isError = s === 'error', isIdle = s === 'idle'; const count = typeof s === 'number' ? s : null;
                return <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ fontSize: 9, fontVariant: 'small-caps', padding: '2px 5px', lineHeight: 1.4, background: isIdle ? 'var(--m-rule)' : isError ? 'rgba(180,60,40,0.15)' : p.color, color: (isIdle || isError) ? 'var(--m-ink-muted)' : '#fff', opacity: isIdle ? 0.5 : 1 }}>{p.short}</div>
                  <span className="m-marginalia" style={{ fontSize: 11, color: isError ? 'var(--m-terracotta)' : 'var(--m-ink-muted)' }}>{isLoading ? '…' : isError ? 'non disponibile' : isIdle ? '—' : `${count} risultati`}</span>
                  {isError && query.trim() && <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 10, padding: '1px 7px' }} onClick={() => doSearch([p.id])}>riprova</button>}
                </div>;
              })}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 28px 16px' }}>
            {results.length === 0 && !anyLoading && <div className="m-marginalia" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--m-ink-muted)', fontStyle: 'italic' }}>{Object.values(pStatus).some(s => s !== 'idle') ? 'Nessun risultato' : 'Digita un titolo e premi Cerca'}</div>}
            {results.map((book, i) => {
              const authors = (book.authors || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean).join(', ');
              const key = wlBookKey(book), isAdded = added.has(key);
              const prov = WL_PROVIDERS.find(p => p.id === book.source) || WL_PROVIDERS[0];
              return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < results.length - 1 ? '1px solid var(--m-rule)' : 'none' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {(book.thumbnail || book.cover_url) ? <img src={book.thumbnail || book.cover_url} alt="" style={{ width: 44, height: 64, objectFit: 'cover', display: 'block', border: '1px solid var(--m-rule)' }} /> : <div style={{ width: 44, height: 64, background: 'var(--m-rule)' }} />}
                  <div style={{ position: 'absolute', top: 2, right: 2, fontSize: 7, padding: '1px 3px', background: prov.color, color: '#fff', lineHeight: 1.4, fontVariant: 'small-caps' }}>{prov.short}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="m-serif" style={{ fontSize: 14, lineHeight: 1.2 }}>{book.title}</div>
                  {authors && <div className="m-marginalia" style={{ fontSize: 11, marginTop: 2 }}>{authors}</div>}
                  <div className="m-marginalia" style={{ fontSize: 11, marginTop: 1 }}>{[book.publisher, book.year, book.isbn13].filter(Boolean).join(' · ')}</div>
                </div>
                <button className={`m-btn${isAdded ? '' : ' m-btn-ghost'} m-btn-sm`} style={{ fontSize: 12, flexShrink: 0, minWidth: 96 }} disabled={isAdded} onClick={() => !isAdded && addToWl(book)}>{isAdded ? '✓ aggiunto' : '+ desiderata'}</button>
              </div>;
            })}
          </div>
        </>)}
        {mode === 'manual' && <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px' }}><WishlistItemForm onSave={manualAdd} saving={saving} submitLabel="Aggiungi ai desiderata" /></div>}
        <div style={{ padding: '10px 28px', borderTop: '1px solid var(--m-rule)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="m-btn m-btn-ghost" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGINA PRINCIPALE
════════════════════════════════════════════════════════════════════════════ */
export default function CollezioneTolkien() {
  const navigate  = useNavigate();
  const toast     = useToast();
  const bgFileRef = useRef();
  const { tolkienBgUrl: ctxTolkienBg, setTolkienBgUrl } = useContext(AppContext);

  /* ── Data ── */
  const [userBooks, setUserBooks] = useState([]);
  const [wlItems,   setWlItems]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  /* ── UI state ── */
  const [selId,       setSelId]       = useState('__tutti__');
  const [localBgUrl,  setLocalBgUrl]  = useState(() => localStorage.getItem(LS_BG) || null);
  const bgUrl = ctxTolkienBg || localBgUrl;
  const [contextMenu, setContextMenu] = useState(null); // {x, y, edition, work}
  const [wlModal,     setWlModal]     = useState(false);
  const [renameModal, setRenameModal] = useState(null); // {workId, name}
  const [createModal, setCreateModal] = useState(false);

  /* ── Work management (localStorage) ── */
  const [workOrder,   setWorkOrder]   = useState(() => lsGet(LS_WORK_ORDER, []));
  const [workNames,   setWorkNames]   = useState(() => lsGet(LS_WORK_NAMES, {}));
  const [hiddenWorks, setHiddenWorks] = useState(() => lsGet(LS_HIDDEN_WORKS, []));
  const [customWorks, setCustomWorks] = useState(() => lsGet(LS_CUSTOM_WORKS, []));
  const [assignments,  setAssignments]  = useState(() => lsGet(LS_ASSIGNMENTS, {}));
  const [editionOrders, setEditionOrders] = useState(() => lsGet(LS_ED_ORDERS, {}));

  /* ── Drag state — left column (work reorder) ── */
  const draggingWorkId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  /* ── Drag state — right panel (edition reorder / cross-panel move) ── */
  const draggingEdInfo = useRef(null);  // { key, edition }
  const [isDraggingEdition, setIsDraggingEdition] = useState(false);
  const [dragOverEdKey,     setDragOverEdKey]      = useState(null);
  const [dragOverWorkId,    setDragOverWorkId]      = useState(null); // left-column target

  /* ── Load ── */
  useEffect(() => {
    booksApi.list({ limit: 5000 })
      .then(r => { setUserBooks(r.books || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  useEffect(() => {
    wishlistApi.list().then(setWlItems).catch(() => {});
  }, []);

  /* ── Tolkien filter (robust: checks author_names, authors array, and author string) ── */
  const tolkienBooks = useMemo(() => userBooks.filter(b => {
    if (isTolkien(b.author_names)) return true;
    if (Array.isArray(b.authors)) return b.authors.some(a => isTolkien(typeof a === 'string' ? a : a?.name));
    if (isTolkien(b.author)) return true;
    return false;
  }), [userBooks]);

  const tolkienWl = useMemo(() =>
    wlItems.filter(i => isTolkien(i.author)), [wlItems]);

  /* ── Build works ── */
  const works = useMemo(() => {
    const map = new Map(); // workId → {id, origT, t, a, ed[]}

    function ensureWork(workId, title, author) {
      if (!map.has(workId)) map.set(workId, {
        id: workId, origT: title,
        t: workNames[workId] || title,
        a: author || 'J.R.R. Tolkien', ed: [],
      });
    }
    function defaultWorkId(title) {
      return 'wid-' + title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    tolkienBooks.forEach(book => {
      const assignedId = assignments[String(book.id)];
      const workId = assignedId || defaultWorkId(book.title);
      const workTitle = assignedId
        ? (map.get(assignedId)?.origT || book.title)
        : book.title;
      ensureWork(workId, workTitle, book.author_names || '');
      const label = [book.publisher, book.year].filter(Boolean).join(' · ') || 'Edizione posseduta';
      map.get(workId).ed.push({ l: label, owned: true, coverUrl: book.cover_url || null, book });
    });

    tolkienWl.forEach(item => {
      const assignedId = assignments['wl-' + item.id];
      const workId = assignedId || defaultWorkId(item.title);
      const workTitle = assignedId
        ? (map.get(assignedId)?.origT || item.title)
        : item.title;
      ensureWork(workId, workTitle, item.author || '');
      const label = [item.publisher, item.year].filter(Boolean).join(' · ') || 'Edizione desiderata';
      map.get(workId).ed.push({
        l: label, owned: false, coverUrl: item.cover_url || null,
        wlCover: getWlCover(item.id), wlItem: item,
      });
    });

    // Custom (user-created) works
    customWorks.forEach(cw => {
      if (!map.has(cw.id)) map.set(cw.id, {
        id: cw.id, origT: cw.title,
        t: workNames[cw.id] || cw.title,
        a: cw.author || 'J.R.R. Tolkien', ed: [],
        isCustom: true,
      });
    });

    return [...map.values()];
  }, [tolkienBooks, tolkienWl, customWorks, workNames, assignments]);

  /* ── Ordered + filtered works ── */
  const orderedWorks = useMemo(() => {
    const visible = works.filter(w => !hiddenWorks.includes(w.id));
    const ordered = [
      ...workOrder.filter(id => visible.find(w => w.id === id)).map(id => visible.find(w => w.id === id)),
      ...visible.filter(w => !workOrder.includes(w.id)),
    ];
    return ordered;
  }, [works, workOrder, hiddenWorks]);

  const ALL_ENTRIES = useMemo(() => [...VIRTUAL, ...orderedWorks], [orderedWorks]);
  const selEntry    = ALL_ENTRIES.find(e => e.id === selId) || ALL_ENTRIES[0];

  /* ── Edition stable key ── */
  function edKey(ed) { return ed.book ? String(ed.book.id) : 'wl-' + ed.wlItem.id; }

  /* ── Display editions (with custom order for single-work view) ── */
  const displayEditions = useMemo(() => {
    function applyOrder(items, order) {
      if (!order || order.length === 0) return items;
      return [...items].sort((a, b) => {
        const ia = order.indexOf(edKey(a.edition)), ib = order.indexOf(edKey(b.edition));
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1; if (ib === -1) return -1;
        return ia - ib;
      });
    }
    if (selId === '__tutti__') {
      const flat = works.flatMap(w => w.ed.filter(ed => ed.owned).map(ed => ({ work: w, edition: ed })));
      return applyOrder(flat, editionOrders['__tutti__']);
    }
    if (selId === '__desiderata__') {
      const flat = works.flatMap(w => w.ed.filter(ed => !ed.owned).map(ed => ({ work: w, edition: ed })));
      return applyOrder(flat, editionOrders['__desiderata__']);
    }
    const w = orderedWorks.find(x => x.id === selId);
    if (!w) return [];
    const order = editionOrders[selId] || [];
    const sorted = order.length > 0
      ? [...w.ed].sort((a, b) => {
          const ia = order.indexOf(edKey(a)), ib = order.indexOf(edKey(b));
          if (ia === -1 && ib === -1) return 0;
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        })
      : w.ed;
    return sorted.map(ed => ({ work: w, edition: ed }));
  }, [selId, orderedWorks, editionOrders]);

  const ownedCount = displayEditions.filter(x => x.edition.owned).length;
  const bannerTitle = selEntry?.t || 'Tutti i libri';
  const bannerEyebrow = selId === '__tutti__'
    ? `${ownedCount} ${ownedCount === 1 ? 'edizione posseduta' : 'edizioni possedute'} · ${orderedWorks.length} titoli`
    : selId === '__desiderata__'
    ? `${displayEditions.length} ${displayEditions.length === 1 ? 'edizione' : 'edizioni'} da trovare`
    : `${displayEditions.length} ${displayEditions.length === 1 ? 'edizione' : 'edizioni'}`;

  /* ── Background ── */
  async function handleBgFile(e) {
    const file = e.target.files[0]; if (!file) return;
    try {
      const url = await resizeToDataUrl(file);
      localStorage.setItem(LS_BG, url);
      setLocalBgUrl(url);
      setTolkienBgUrl(url);
    } catch { alert('Immagine troppo grande.'); }
    e.target.value = '';
  }

  /* ── Congela i nomi al primo avvistamento — non cambiano più senza rinomina esplicita ── */
  useEffect(() => {
    if (works.length === 0) return;
    const additions = {};
    works.forEach(w => { if (!(w.id in workNames)) additions[w.id] = w.origT; });
    if (Object.keys(additions).length > 0) {
      const next = { ...workNames, ...additions };
      setWorkNames(next); lsSet(LS_WORK_NAMES, next);
    }
  }, [works]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Work management ── */
  function saveWorkOrder(next) { setWorkOrder(next); lsSet(LS_WORK_ORDER, next); }
  function saveWorkNames(next) { setWorkNames(next); lsSet(LS_WORK_NAMES, next); }
  function saveHiddenWorks(next) { setHiddenWorks(next); lsSet(LS_HIDDEN_WORKS, next); }
  function saveCustomWorks(next) { setCustomWorks(next); lsSet(LS_CUSTOM_WORKS, next); }
  function saveAssignments(next) { setAssignments(next); lsSet(LS_ASSIGNMENTS, next); }
  function saveEditionOrders(next) { setEditionOrders(next); lsSet(LS_ED_ORDERS, next); }

  function renameWork(workId, name) {
    saveWorkNames({ ...workNames, [workId]: name });
    setRenameModal(null);
  }
  function hideWork(workId) {
    saveHiddenWorks([...hiddenWorks.filter(x => x !== workId), workId]);
    if (selId === workId) setSelId('__tutti__');
  }
  function createWork(title) {
    const id = 'cw-' + Date.now();
    saveCustomWorks([...customWorks, { id, title, author: 'J.R.R. Tolkien' }]);
    saveWorkOrder([...workOrder, id]);
    setCreateModal(false);
  }
  function moveEditionToWork(edition, targetWorkId) {
    const key = edition.owned ? String(edition.book.id) : 'wl-' + edition.wlItem.id;
    saveAssignments({ ...assignments, [key]: targetWorkId });
    toast('Spostato in: ' + (orderedWorks.find(w => w.id === targetWorkId)?.t || targetWorkId), 'success');
  }

  /* ── Edition drag (right panel reorder + drop on left-column title row) ── */
  function onEditionDragStart(key, edition) {
    draggingEdInfo.current = { key, edition };
    setIsDraggingEdition(true);
  }
  function onEditionDragOver(e, key) {
    const info = draggingEdInfo.current;
    if (!info || info.key === key) return;
    e.preventDefault(); e.stopPropagation();
    setDragOverEdKey(key);
    setDragOverWorkId(null);
  }
  function onEditionDrop(e, targetKey) {
    e.preventDefault(); e.stopPropagation();
    const info = draggingEdInfo.current;
    draggingEdInfo.current = null; setIsDraggingEdition(false);
    setDragOverEdKey(null); setDragOverWorkId(null);
    if (!info || info.key === targetKey) return;
    const keys = displayEditions.map(x => edKey(x.edition));
    const from = keys.indexOf(info.key), to = keys.indexOf(targetKey);
    if (from === -1 || to === -1) return;
    const next = [...keys]; next.splice(from, 1); next.splice(to, 0, info.key);
    saveEditionOrders({ ...editionOrders, [selId]: next });
  }
  function onEditionDragEnd() {
    draggingEdInfo.current = null; setIsDraggingEdition(false);
    setDragOverEdKey(null); setDragOverWorkId(null);
  }

  /* ── Drop edition onto a left-column title row ── */
  function onEditionDropOnWork(e, targetWorkId) {
    e.preventDefault(); e.stopPropagation();
    const info = draggingEdInfo.current;
    draggingEdInfo.current = null; setIsDraggingEdition(false);
    setDragOverWorkId(null); setDragOverEdKey(null);
    if (!info) return;
    moveEditionToWork(info.edition, targetWorkId);
  }

  /* ── Drag reorder of title rows ── */
  function onWorkDragStart(workId) { draggingWorkId.current = workId; }
  function onWorkDragOver(targetId) { if (draggingWorkId.current !== targetId) setDragOverId(targetId); }
  function onWorkDrop(targetId) {
    const fromId = draggingWorkId.current;
    draggingWorkId.current = null; setDragOverId(null);
    if (!fromId || fromId === targetId) return;
    const allIds = orderedWorks.map(w => w.id);
    const from = allIds.indexOf(fromId), to = allIds.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const next = [...allIds];
    next.splice(from, 1); next.splice(to, 0, fromId);
    saveWorkOrder(next);
  }

  /* ── Acquire desiderata ── */
  async function handleAcquire(edition) {
    const item = edition.wlItem; if (!item) return;
    try {
      const result = await wishlistApi.acquire(item.id);
      setWlItems(prev => prev.filter(i => i.id !== item.id));
      toast('Promosso alla libreria!', 'success');
      navigate('/aggiungi', { state: { prefill: result.book_data } });
    } catch { toast('Errore nell\'acquisizione', 'error'); }
  }

  /* ── Delete book ── */
  async function handleDeleteBook(edition) {
    const book = edition.book; if (!book) return;
    try {
      await booksApi.delete(book.id);
      setUserBooks(prev => prev.filter(b => b.id !== book.id));
      toast('Libro eliminato', 'success');
    } catch { toast('Errore nell\'eliminazione', 'error'); }
  }

  /* ── Context menu ── */
  function openContextMenu(e, edition, work) {
    e.preventDefault(); e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, edition, work });
  }

  /* ── Close context menu on Escape ── */
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setContextMenu(null); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* ── Render ── */
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: 'linear-gradient(168deg, #1a201b 0%, #141914 40%, #0c0f0c 100%)',
      color: CREAM, fontFamily: BODY,
    }}>
      {/* Background */}
      <TKJScene />
      {bgUrl && <img src={bgUrl} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />}
      <TKJAtmosphere />
      <input ref={bgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgFile} />

      {/* Back orb */}
      <BackOrb onClick={() => navigate(-1)} />

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 60, zIndex: 4,
        display: 'flex', alignItems: 'center', padding: '0 28px 0 64px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)',
      }}>
        <div style={{ fontFamily: SERIF, textTransform: 'uppercase', letterSpacing: '0.26em', fontSize: 13, color: CREAM, fontWeight: 600 }}>
          Collezione Tolkien
        </div>
        <span style={{ width: 1, height: 18, background: 'rgba(216,180,106,0.3)', margin: '0 16px' }} />
        <div style={{ fontFamily: BODY, fontStyle: 'italic', fontSize: 13.5, color: 'rgba(232,220,192,0.6)' }}>
          J.R.R. Tolkien · {orderedWorks.length} scaffali
        </div>
        <div style={{ flex: 1 }} />
        <CambiaSfondoBtn onClick={() => bgFileRef.current?.click()} />
      </div>

      {/* Body */}
      <div style={{
        position: 'absolute', top: 60, left: 0, right: 0, bottom: 60, zIndex: 3,
        display: 'flex', alignItems: 'stretch',
      }}>
        {/* Left column */}
        <div style={{
          width: 332, flexShrink: 0, position: 'relative', paddingLeft: 60,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div style={{
            position: 'absolute', right: 22, top: 40, bottom: 40, width: 1,
            background: 'linear-gradient(180deg, transparent, rgba(232,220,192,0.16) 10%, rgba(232,220,192,0.16) 90%, transparent)',
          }} />
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 3,
            maxHeight: '100%', overflowY: 'auto', paddingRight: 8,
            maskImage: 'linear-gradient(180deg, transparent, #000 6%, #000 94%, transparent)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 6%, #000 94%, transparent)',
          }}>
            <div style={{ minHeight: 10 }} />
            {loading
              ? <div style={{ textAlign: 'right', color: 'rgba(232,220,192,0.3)', fontFamily: SERIF, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 12, paddingRight: 36 }}>…</div>
              : ALL_ENTRIES.map(entry => (
                  <TKJTitleRow
                    key={entry.id}
                    entry={entry}
                    selected={entry.id === selId}
                    onClick={() => setSelId(entry.id)}
                    onRename={!entry.isVirtual ? () => setRenameModal({ workId: entry.id, name: entry.t }) : undefined}
                    onDelete={!entry.isVirtual ? () => hideWork(entry.id) : undefined}
                    onDragStart={!entry.isVirtual ? () => onWorkDragStart(entry.id) : undefined}
                    onDragOver={!entry.isVirtual ? e => {
                      e.preventDefault();
                      if (isDraggingEdition) {
                        setDragOverWorkId(entry.id);
                        setDragOverId(null);
                      } else {
                        onWorkDragOver(entry.id);
                        setDragOverWorkId(null);
                      }
                    } : undefined}
                    onDrop={!entry.isVirtual ? e => {
                      if (isDraggingEdition) onEditionDropOnWork(e, entry.id);
                      else { e.preventDefault(); onWorkDrop(entry.id); }
                    } : undefined}
                    isDragOver={!isDraggingEdition && dragOverId === entry.id}
                    isEditionDropTarget={isDraggingEdition && !entry.isVirtual && dragOverWorkId === entry.id}
                  />
                ))
            }
            <div style={{ minHeight: 10 }} />
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, position: 'relative', padding: '50px 56px 18px 26px' }}>
          <div style={{ position: 'relative', height: '100%' }}>
            <div style={{ position: 'absolute', top: -30, left: 20, zIndex: 3 }}>
              <TKJBanner eyebrow={bannerEyebrow} title={bannerTitle} />
            </div>
            <div style={{
              position: 'absolute', inset: 0,
              border: '1px solid rgba(216,180,106,0.42)',
              background: 'rgba(8,11,8,0.5)',
              backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.3)',
            }}>
              <div style={{ position: 'absolute', inset: 5, border: '1px solid rgba(216,180,106,0.14)', pointerEvents: 'none' }} />
              <TKJCorner pos="tl" /><TKJCorner pos="tr" />
              <TKJCorner pos="bl" /><TKJCorner pos="br" />

              <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '52px 48px 36px' }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16,
                  marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid rgba(216,180,106,0.16)',
                }}>
                  {selEntry?.a && !selEntry.isVirtual && (
                    <span style={{ fontFamily: BODY, fontStyle: 'italic', fontSize: 16, color: 'rgba(232,220,192,0.8)', flex: 1 }}>{selEntry.a}</span>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: SERIF, textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 11, color: 'rgba(232,220,192,0.6)' }}>
                    <Check size={12} color={GOLD} /> {ownedCount} possedute
                    <span style={{ color: 'rgba(216,180,106,0.3)' }}>·</span>
                    <Diamond size={9} color={VERM} /> {displayEditions.length - ownedCount} desiderate
                  </span>
                </div>

                {/* Covers grid */}
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="m-spinner" /></div>
                ) : displayEditions.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, fontFamily: BODY, fontStyle: 'italic', fontSize: 15, color: 'rgba(232,220,192,0.3)' }}>Nessuna edizione</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '28px 14px' }}>
                    {displayEditions.map((item, j) => {
                      const key = edKey(item.edition);
                      const isDragging = draggingEdInfo.current?.key === key;
                      const isOver    = dragOverEdKey === key;
                      return (
                      <div
                        key={item.work.id + '-' + j}
                        draggable
                        onDragStart={() => onEditionDragStart(key, item.edition)}
                        onDragOver={e => onEditionDragOver(e, key)}
                        onDrop={e => onEditionDrop(e, key)}
                        onDragEnd={onEditionDragEnd}
                        style={{ cursor: 'grab' }}
                      >
                        {item.edition.owned
                          ? <EditionCover
                              work={item.work} edition={item.edition}
                              onContextMenu={e => openContextMenu(e, item.edition, item.work)}
                              isDragOver={isOver} dragging={isDragging}
                            />
                          : <DesiderataCover
                              work={item.work} edition={item.edition}
                              onAcquire={() => handleAcquire(item.edition)}
                              onContextMenu={e => openContextMenu(e, item.edition, item.work)}
                              isDragOver={isOver} dragging={isDragging}
                            />
                        }
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, zIndex: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: 16, padding: '0 56px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.5), transparent)',
      }}>
        <FooterBtn title="Nuovo scaffale" onClick={() => setCreateModal(true)} />
        <FooterBtn title="Nuovo libro" primary onClick={() => setWlModal(true)} />
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          edition={contextMenu.edition} work={contextMenu.work}
          works={orderedWorks}
          onClose={() => setContextMenu(null)}
          onDelete={() => handleDeleteBook(contextMenu.edition)}
          onMove={targetWorkId => moveEditionToWork(contextMenu.edition, targetWorkId)}
          navigate={navigate}
        />
      )}

      {/* Modals */}
      {wlModal && <WishlistModal onAdd={item => setWlItems(prev => [item, ...prev])} onClose={() => setWlModal(false)} />}
      {renameModal && (
        <TextModal
          title="Rinomina scaffale" label="Nome"
          initial={renameModal.name}
          onSave={name => renameWork(renameModal.workId, name)}
          onClose={() => setRenameModal(null)}
        />
      )}
      {createModal && (
        <TextModal
          title="Nuovo scaffale" label="Titolo dell'opera"
          onSave={createWork}
          onClose={() => setCreateModal(false)}
        />
      )}
    </div>
  );
}
