import React from 'react';

/* ══════════════════════════════════════════════════════════════════════════
   Il segno sull'angolo della copertina — l'equivalente digitale della
   linguetta di cartoncino che sullo scaffale fisico segnala gli ebook.

   Un triangolo pieno nell'angolo in alto a destra, come un'orecchia ripiegata,
   con dentro una lettera bianca. È sovrapposto alla copertina: non la ritaglia
   e non la sposta. Questo è il punto unico in cui il segno si cambia.
   ══════════════════════════════════════════════════════════════════════════ */

const SEGNI = {
  ebook: { colore: '#6B4C3D', lettera: 'e', etichetta: 'Ebook',     titolo: 'Ebook in BookOrbit' },
  opera: { colore: '#2E4A6B', lettera: 'o', etichetta: "Opera d'arte", titolo: "Opera d'arte" },
};

/** Quota della larghezza della copertina occupata dal segno, mai sotto i 20 px. */
const QUOTA = 0.27;
const MINIMO = 20;

/**
 * Il tipo di un record, con paracadute: se la rilegatura dice 'ebook' il
 * record è un ebook anche quando il tipo non è stato ancora impostato.
 * Restituisce 'cartaceo' | 'ebook' | 'opera'.
 */
export function tipoRecord(book) {
  if (!book) return 'cartaceo';
  if (book.item_type === 'ebook' || book.format === 'ebook') return 'ebook';
  if (book.item_type === 'opera') return 'opera';
  return 'cartaceo';
}

/**
 * @param {'ebook'|'opera'} tipo      quale segno disegnare
 * @param {number} larghezzaCopertina larghezza della copertina, per la proporzione
 */
export default function EbookMark({ tipo = 'ebook', larghezzaCopertina = 100 }) {
  const segno = SEGNI[tipo];
  if (!segno) return null;                       // i cartacei non hanno segno

  const lato = Math.max(MINIMO, Math.round(larghezzaCopertina * QUOTA));

  return (
    <div
      role="img"
      aria-label={segno.etichetta}
      title={segno.titolo}
      style={{
        position: 'absolute', top: 0, right: 0,
        width: lato, height: lato,
        pointerEvents: 'none', zIndex: 2,
        // stacca il segno anche dalle copertine scure o brune
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))',
      }}
    >
      <svg viewBox="0 0 100 100" width={lato} height={lato} style={{ display: 'block' }} aria-hidden="true">
        {/* un filo di chiaro sul taglio: stacca il segno anche dalle copertine scure */}
        <polygon points="0,0 100,0 100,100" fill={segno.colore} />
        <polyline points="0,0 100,100" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
        <text
          x="66" y="32"
          textAnchor="middle" dominantBaseline="central"
          fontSize="52" fontWeight="700" fill="#ffffff"
          fontFamily="'Agmena Pro', Georgia, serif"
        >{segno.lettera}</text>
      </svg>
    </div>
  );
}
