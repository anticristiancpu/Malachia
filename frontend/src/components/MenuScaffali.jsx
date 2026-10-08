import React, { useState, useEffect, useRef } from 'react';
import SceltaScaffali from './SceltaScaffali.jsx';

/* Il menu col tasto destro per mettere un libro su uno scaffale.
   La Libreria ha un menu suo, più ricco (modifica, elimina); questo è la sola
   parte degli scaffali, da riusare dove serve soltanto quella. L'elenco vero
   — librerie, scaffali, ripiani — sta in SceltaScaffali, condiviso. */

export default function MenuScaffali({ x, y, libro, onChiudi, onApri }) {
  const rif = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  // Il menu resta dentro la finestra anche vicino ai bordi, anche quando si
  // allunga aprendo i ripiani di uno scaffale.
  useEffect(() => {
    if (!rif.current) return;
    const sistema = () => {
      const r = rif.current.getBoundingClientRect();
      setPos({
        left: r.width + x > window.innerWidth ? Math.max(4, window.innerWidth - r.width - 4) : x,
        top: r.height + y > window.innerHeight ? Math.max(4, window.innerHeight - r.height - 4) : y,
      });
    };
    sistema();
    const oss = new ResizeObserver(sistema);
    oss.observe(rif.current);
    return () => oss.disconnect();
  }, [x, y]);

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

  return (
    <div ref={rif} style={{
      position: 'fixed', left: pos.left, top: pos.top, zIndex: 600,
      background: 'var(--m-parchment)', border: '1px solid var(--m-rule)',
      boxShadow: '0 4px 18px rgba(0,0,0,0.22)', width: 'min(290px, calc(100vw - 8px))',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '8px 14px 7px', borderBottom: '1px solid var(--m-rule)' }}>
        <div className="m-serif" style={{
          fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{libro.title}</div>
      </div>

      <SceltaScaffali libro={libro} />

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
