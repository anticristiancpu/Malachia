/* Shared atoms: book covers, ornaments, icons */

const ORN = {
  // Trefoil / fleuron
  fleuron: (props = {}) => (
    <svg viewBox="0 0 24 24" width={props.size || 16} height={props.size || 16} {...props}>
      <path d="M12 2 c2 3 5 4 8 4 c-3 1 -5 4 -5 7 c2 -1 5 0 7 2 c-3 0 -6 2 -7 5 c-1 -3 -4 -5 -7 -5 c2 -2 5 -3 7 -2 c0 -3 -2 -6 -5 -7 c3 0 6 -1 8 -4 z" fill="currentColor" opacity=".8"/>
    </svg>
  ),
  // Cross florée
  cross: (props = {}) => (
    <svg viewBox="0 0 24 24" width={props.size || 14} height={props.size || 14} {...props}>
      <path d="M11 2 h2 v9 h9 v2 h-9 v9 h-2 v-9 h-9 v-2 h9 z" fill="currentColor"/>
    </svg>
  ),
  // Diamond rule
  diamond: (props = {}) => (
    <svg viewBox="0 0 8 8" width={props.size || 8} height={props.size || 8} {...props}>
      <path d="M4 0 L8 4 L4 8 L0 4 Z" fill="currentColor"/>
    </svg>
  ),
  // Quill
  quill: (props = {}) => (
    <svg viewBox="0 0 24 24" width={props.size || 16} height={props.size || 16} {...props}>
      <path d="M20 3 C12 5 6 11 4 19 L7 19 C9 13 13 9 19 7 Z M5 21 L9 17" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  // Tiny ornamental rule
  rule: (props = {}) => (
    <div style={{display:'flex', alignItems:'center', gap:8, color:'currentColor', ...props.style}}>
      <div style={{flex:1, height:1, background:'currentColor', opacity:.4}}/>
      <span style={{transform:'rotate(45deg)', width:6, height:6, background:'currentColor', display:'inline-block', opacity:.8}}/>
      <div style={{flex:1, height:1, background:'currentColor', opacity:.4}}/>
    </div>
  ),
};

/* Decorative book cover with illuminated initial.
   Variants: 'monastic' (default), 'minimal', 'illustrated' */
function BookCover({ title, author, w = 110, h = 160, palette, variant = 'monastic', initial }) {
  const p = palette || ['#3a2a1a', '#f4ecd8', '#bfa15a'];
  const [bg, fg, accent] = p;
  const letter = initial || (title || '?').trim()[0].toUpperCase();
  const style = {
    width: w, height: h,
    '--cover-bg': bg,
    '--cover-fg': fg,
  };

  if (variant === 'minimal') {
    return (
      <div className="m-book" style={style}>
        <div style={{position:'absolute', inset:0, padding:'10px 8px', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
          <div className="m-eyebrow" style={{color:fg, opacity:.6, fontSize:9}}>MALACHIA</div>
          <div>
            <div className="m-serif" style={{color:fg, fontSize: Math.max(11, w*0.13), lineHeight:1.05, fontWeight:500}}>{title}</div>
            <div className="m-body" style={{color:fg, opacity:.7, fontStyle:'italic', fontSize:10, marginTop:6}}>{author}</div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'illustrated') {
    return (
      <div className="m-book" style={style}>
        <div style={{position:'absolute', inset:'10% 12%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, textAlign:'center'}}>
          <svg viewBox="0 0 60 60" width={w*0.42} height={w*0.42} style={{color:accent}}>
            <circle cx="30" cy="30" r="26" stroke="currentColor" strokeWidth="1" fill="none"/>
            <path d="M30 6 v48 M6 30 h48 M13 13 l34 34 M47 13 l-34 34" stroke="currentColor" strokeWidth=".6" opacity=".6"/>
            <circle cx="30" cy="30" r="6" fill="currentColor"/>
          </svg>
          <div className="m-serif" style={{color:fg, fontSize:Math.max(10, w*0.11), lineHeight:1.1, fontWeight:600, fontVariant:'small-caps', letterSpacing:'.08em'}}>{title}</div>
          <div className="m-body" style={{color:fg, opacity:.65, fontStyle:'italic', fontSize:9}}>{author}</div>
        </div>
      </div>
    );
  }

  // monastic
  return (
    <div className="m-book" style={style}>
      <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', padding:'10px 8px 8px 14px'}}>
        <div style={{color:accent, fontSize:9, fontVariant:'small-caps', letterSpacing:'.18em', opacity:.8}}>Malachia</div>
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
          <div style={{
            width: w*0.5, height: w*0.5,
            background: accent,
            color: bg,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily: "'UnifrakturCook', serif",
            fontSize: w*0.42,
            lineHeight:1,
            boxShadow:'inset 0 0 0 2px '+bg+', 0 0 0 1px '+accent,
          }}>{letter}</div>
        </div>
        <div style={{textAlign:'center', color:fg}}>
          <div className="m-serif" style={{fontSize: Math.max(10, w*0.115), lineHeight:1.05, fontWeight:500, fontVariant:'small-caps', letterSpacing:'.05em'}}>{title}</div>
          <div style={{height:1, background:accent, opacity:.5, margin:'5px 14%'}}/>
          <div className="m-body" style={{fontStyle:'italic', fontSize:9, opacity:.75}}>{author}</div>
        </div>
      </div>
    </div>
  );
}

/* Book palettes — variety of warm/dark cover colors */
const BOOK_PALETTES = [
  ['#3a2a1a', '#f4ecd8', '#bfa15a'],   // brown + gold
  ['#7a3b2e', '#f4ecd8', '#d8c389'],   // terracotta + cream
  ['#2a3a5a', '#e8dcc4', '#bfa15a'],   // lapis + gold
  ['#1a2a1a', '#e8dcc4', '#bfa15a'],   // forest + gold
  ['#4a2a2a', '#f4ecd8', '#d8c389'],   // oxblood
  ['#5a4a2a', '#f4ecd8', '#c9a85a'],   // ochre
  ['#2a2a2a', '#d8c389', '#bfa15a'],   // black + gold
  ['#6a3a4a', '#f4ecd8', '#d8c389'],   // burgundy
  ['#3a3a2a', '#e8dcc4', '#bfa15a'],   // olive
];

/* Decorative initial drop (large illuminated letter) */
function Initial({ letter = 'M', size = 80, color, bg }) {
  return (
    <div style={{
      width:size, height:size,
      background: bg || 'var(--m-vermilion)',
      color: color || 'var(--m-parchment)',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'UnifrakturCook', serif",
      fontSize: size*0.78,
      lineHeight:1,
      boxShadow:'inset 0 0 0 3px var(--m-parchment), 0 0 0 1px var(--m-gold-deep), 4px 4px 0 rgba(0,0,0,0.12)',
      flexShrink:0,
    }}>{letter}</div>
  );
}

/* Ornamental section header */
function Heading({ kicker, title, italic, align = 'left', tone = 'light' }) {
  const muted = tone === 'dark' ? 'var(--m-gold-pale)' : 'var(--m-ink-muted)';
  return (
    <div style={{textAlign:align}}>
      {kicker && <div className="m-eyebrow" style={{color:muted}}>{kicker}</div>}
      <div className="m-serif" style={{fontSize:32, lineHeight:1.05, fontWeight:500, color: tone==='dark'?'var(--m-parchment)':'var(--m-ink)', marginTop:6}}>
        {title} {italic && <em style={{color: tone==='dark'?'var(--m-gold-pale)':'var(--m-terracotta)'}}>{italic}</em>}
      </div>
    </div>
  );
}

window.ORN = ORN;
window.BookCover = BookCover;
window.BOOK_PALETTES = BOOK_PALETTES;
window.Initial = Initial;
window.Heading = Heading;
