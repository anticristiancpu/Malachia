import React from 'react';

export const BOOK_PALETTES = [
  ['#3a2a1a', '#f4ecd8', '#bfa15a'],
  ['#7a3b2e', '#f4ecd8', '#d8c389'],
  ['#2a3a5a', '#e8dcc4', '#bfa15a'],
  ['#1a2a1a', '#e8dcc4', '#bfa15a'],
  ['#4a2a2a', '#f4ecd8', '#d8c389'],
  ['#5a4a2a', '#f4ecd8', '#c9a85a'],
  ['#2a2a2a', '#d8c389', '#bfa15a'],
  ['#6a3a4a', '#f4ecd8', '#d8c389'],
  ['#3a3a2a', '#e8dcc4', '#bfa15a'],
];

export function getPalette(book) {
  if (book?.cover_palette) {
    try {
      const p = typeof book.cover_palette === 'string' ? JSON.parse(book.cover_palette) : book.cover_palette;
      if (Array.isArray(p) && p.length >= 3) return p;
    } catch {}
  }
  // Palette deterministica dall'id
  if (book?.id) {
    const idx = book.id.charCodeAt(0) % BOOK_PALETTES.length;
    return BOOK_PALETTES[idx];
  }
  return BOOK_PALETTES[0];
}

export default function BookCover({ book, title, author, cover_url, w = 110, h = 160, variant, palette, onClick, className, fit = 'contain' }) {
  const resolvedTitle  = title  ?? book?.title  ?? '?';
  const resolvedAuthor = author ?? (book?.author_names ?? book?.authors?.map(a => a.name).join(', ') ?? '');
  const resolvedVariant = variant ?? book?.cover_variant ?? 'monastic';
  const p = palette ?? getPalette(book);
  const [bg, fg, accent] = p;
  const letter = resolvedTitle.trim()[0]?.toUpperCase() ?? '?';

  // Se esiste un'immagine reale, mostrala
  const imgUrl = book?.cover_local || book?.cover_url || cover_url;
  if (imgUrl && !imgUrl.startsWith('http://placeholder')) {
    return (
      <div
        className={`m-book${className ? ' ' + className : ''}`}
        style={{
          width: w, height: h, '--var-cover-bg': bg,
          cursor: onClick ? 'pointer' : 'default',
          /* Sfondo trasparente: con contain le "bande" sono invisibili */
          background: 'transparent',
          boxShadow: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
        onClick={onClick}
      >
        <img
          src={imgUrl}
          alt={resolvedTitle}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>
    );
  }

  const baseStyle = {
    width: w, height: h,
    '--var-cover-bg': bg,
    position: 'relative',
    cursor: onClick ? 'pointer' : 'default',
  };

  if (resolvedVariant === 'minimal') {
    return (
      <div className={`m-book${className ? ' ' + className : ''}`} style={{ ...baseStyle, background: bg }} onClick={onClick}>
        <div style={{ position: 'absolute', inset: 0, padding: '10px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="m-eyebrow" style={{ color: fg, opacity: .6, fontSize: 9 }}>MALACHIA</div>
          <div>
            <div className="m-serif" style={{ color: fg, fontSize: Math.max(11, w * 0.13), lineHeight: 1.05, fontWeight: 500 }}>{resolvedTitle}</div>
            <div className="m-body" style={{ color: fg, opacity: .7, fontStyle: 'italic', fontSize: 10, marginTop: 6 }}>{resolvedAuthor}</div>
          </div>
        </div>
      </div>
    );
  }

  if (resolvedVariant === 'illustrated') {
    return (
      <div className={`m-book${className ? ' ' + className : ''}`} style={{ ...baseStyle, background: bg }} onClick={onClick}>
        <div style={{ position: 'absolute', inset: '10% 12%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center' }}>
          <svg viewBox="0 0 60 60" width={w * 0.42} height={w * 0.42} style={{ color: accent }}>
            <circle cx="30" cy="30" r="26" stroke="currentColor" strokeWidth="1" fill="none"/>
            <path d="M30 6 v48 M6 30 h48 M13 13 l34 34 M47 13 l-34 34" stroke="currentColor" strokeWidth=".6" opacity=".6"/>
            <circle cx="30" cy="30" r="6" fill="currentColor"/>
          </svg>
          <div className="m-serif" style={{ color: fg, fontSize: Math.max(10, w * 0.11), lineHeight: 1.1, fontWeight: 600, fontVariant: 'small-caps', letterSpacing: '.08em' }}>{resolvedTitle}</div>
          <div className="m-body" style={{ color: fg, opacity: .65, fontStyle: 'italic', fontSize: 9 }}>{resolvedAuthor}</div>
        </div>
      </div>
    );
  }

  // monastic (default)
  return (
    <div className={`m-book${className ? ' ' + className : ''}`} style={{ ...baseStyle, background: bg }} onClick={onClick}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '10px 8px 8px 14px' }}>
        <div style={{ color: accent, fontSize: 9, fontVariant: 'small-caps', letterSpacing: '.18em', opacity: .8 }}>Malachia</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: w * 0.5, height: w * 0.5,
            background: accent, color: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'UnifrakturCook', serif",
            fontSize: w * 0.42, lineHeight: 1,
            boxShadow: `inset 0 0 0 2px ${bg}, 0 0 0 1px ${accent}`,
          }}>{letter}</div>
        </div>
        <div style={{ textAlign: 'center', color: fg }}>
          <div className="m-serif" style={{ fontSize: Math.max(10, w * 0.115), lineHeight: 1.05, fontWeight: 500, fontVariant: 'small-caps', letterSpacing: '.05em' }}>{resolvedTitle}</div>
          <div style={{ height: 1, background: accent, opacity: .5, margin: '5px 14%' }}/>
          <div className="m-body" style={{ fontStyle: 'italic', fontSize: 9, opacity: .75 }}>{resolvedAuthor}</div>
        </div>
      </div>
    </div>
  );
}
