import React, { useState, useEffect, useRef } from 'react';
import { shelves as shelvesApi, books as booksApi } from '../api/index.js';
import { useToast } from './Toast.jsx';

/* Il menu col tasto destro per mettere un libro su uno scaffale.
   La Libreria ha un menu suo, più ricco (modifica, elimina); questo è la sola
   parte degli scaffali, da riusare dove serve soltanto quella. */

export default function MenuScaffali({ x, y, libro, onChiudi, onApri }) {
  const toast = useToast();
  const rif = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const [scaffali, setScaffali] = useState([]);
  const [suoi, setSuoi] = useState(new Set());
  const [nuovo, setNuovo] = useState(null);     // null = non sto creando

  useEffect(() => {
    shelvesApi.list().then(setScaffali).catch(() => setScaffali([]));
    booksApi.shelves(libro.id)
      .then(r => setSuoi(new Set(r.shelf_ids)))
      .catch(() => setSuoi(new Set()));
  }, [libro.id]);

  // Il menu resta dentro la finestra anche vicino ai bordi.
  useEffect(() => {
    if (!rif.current) return;
    const r = rif.current.getBoundingClientRect();
    setPos({
      left: r.right > window.innerWidth ? Math.max(4, x - r.width) : x,
      top: r.bottom > window.innerHeight ? Math.max(4, y - r.height) : y,
    });
  }, [x, y, scaffali.length]);

  useEffect(() => {
    const fuori = (e) => { if (rif.current && !rif.current.contains(e.target)) onChiudi(); };
    const tasto = (e) => { if (e.key === 'Escape') onChiudi(); };
    document.addEventListener('mousedown', fuori);
    document.addEventListener('keydown', tasto);
    return () => {
      document.removeEventListener('mousedown', fuori);
      document.removeEventListener('keydown', tasto);
    };
  }, [onChiudi]);

  async function cambia(scaffale) {
    const dentro = suoi.has(scaffale.id);
    try {
      if (dentro) {
        await shelvesApi.removeBook(scaffale.id, libro.id);
        setSuoi(s => new Set([...s].filter(i => i !== scaffale.id)));
        toast(`tolto da "${scaffale.name}"`, 'success');
      } else {
        await shelvesApi.addBook(scaffale.id, libro.id);
        setSuoi(s => new Set([...s, scaffale.id]));
        toast(`aggiunto a "${scaffale.name}"`, 'success');
      }
    } catch { toast('Operazione non riuscita', 'error'); }
  }

  async function crea() {
    const nome = (nuovo || '').trim();
    setNuovo(null);
    if (!nome) return;
    try {
      const s = await shelvesApi.create({ name: nome });
      await shelvesApi.addBook(s.id, libro.id);
      setScaffali(prev => [...prev, { ...s, book_count: 1 }]);
      setSuoi(x => new Set([...x, s.id]));
      toast(`"${libro.title}" in "${nome}"`, 'success');
    } catch { toast('Non è stato possibile creare lo scaffale', 'error'); }
  }

  return (
    <div ref={rif} style={{
      position: 'fixed', left: pos.left, top: pos.top, zIndex: 600,
      background: 'var(--m-parchment)', border: '1px solid var(--m-rule)',
      boxShadow: '0 4px 18px rgba(0,0,0,0.22)', minWidth: 230, maxWidth: 300,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '8px 14px 7px', borderBottom: '1px solid var(--m-rule)' }}>
        <div className="m-serif" style={{
          fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{libro.title}</div>
      </div>

      <div className="m-eyebrow" style={{
        fontSize: 9, letterSpacing: '0.14em', padding: '6px 14px 4px', color: 'var(--m-ink-muted)',
      }}>Scaffali</div>

      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {scaffali.length === 0 && nuovo === null && (
          <div style={{ padding: '6px 14px', fontSize: 12, color: 'var(--m-ink-muted)', fontStyle: 'italic' }}>
            Nessuno scaffale creato
          </div>
        )}
        {scaffali.map(s => {
          const dentro = suoi.has(s.id);
          return (
            <div key={s.id} onClick={() => cambia(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', cursor: 'pointer', fontSize: 13,
                background: dentro ? 'color-mix(in srgb, var(--m-terracotta) 8%, transparent)' : 'transparent',
              }}
              onMouseEnter={e => { if (!dentro) e.currentTarget.style.background = 'var(--m-rule)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = dentro ? 'color-mix(in srgb, var(--m-terracotta) 8%, transparent)' : 'transparent'; }}>
              <div style={{
                width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                background: dentro ? 'var(--m-terracotta)' : 'transparent',
                border: '1.5px solid ' + (dentro ? 'var(--m-terracotta)' : 'var(--m-rule-strong)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {dentro && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.name}
              </span>
            </div>
          );
        })}
      </div>

      {nuovo === null ? (
        <div onClick={() => setNuovo('')}
          style={{ padding: '7px 14px', cursor: 'pointer', fontSize: 12.5, color: 'var(--m-ink-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--m-rule)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          + nuovo scaffale
        </div>
      ) : (
        <div style={{ padding: '7px 14px 9px' }}>
          <input autoFocus value={nuovo}
            onChange={e => setNuovo(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') crea();
              if (e.key === 'Escape') setNuovo(null);
            }}
            placeholder="nome dello scaffale"
            style={{
              width: '100%', padding: '5px 7px', fontSize: 12.5, fontFamily: 'inherit',
              background: 'transparent', color: 'var(--m-ink)', border: '1px solid var(--m-rule)',
            }}/>
        </div>
      )}

      {onApri && (
        <div onClick={() => { onChiudi(); onApri(libro.id); }}
          style={{
            padding: '7px 14px', cursor: 'pointer', fontSize: 12.5,
            borderTop: '1px solid var(--m-rule)', color: 'var(--m-ink-muted)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--m-rule)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          › apri la scheda
        </div>
      )}
    </div>
  );
}
