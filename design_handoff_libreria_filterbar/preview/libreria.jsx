/* Malachia · Libreria · prototype of the redesigned filter bar.
   Single component: the filter strip is shared between grid and list
   view. The "Griglia | Lista" toggle in the strip swaps the body below.
   Standalone — does NOT depend on the cinematic top-bar chrome (that
   stays as it already is in the codebase). */

const CINE_GOLD = '#d8b46a';
const CINE_GOLD_DIM = '#9a7e3a';
const CINE_CREAM = '#e8dcc0';
const CINE_VERM = '#c0533b';
const CINE_BG = '#0a0704';

const CINZEL  = "'Cinzel', 'Cormorant Garamond', serif";
const AGMENA  = "'Agmena Pro', Georgia, serif";

const BOOK_PALETTES = [
  ['#3a2a1a','#f4ecd8','#bfa15a'], ['#7a3b2e','#f4ecd8','#d8c389'],
  ['#1a2a4a','#d8c389','#bfa15a'], ['#2a3a1e','#ebe0c4','#d8c389'],
  ['#4a2a3e','#f4ecd8','#d8c389'], ['#5a3a1e','#f4ecd8','#bfa15a'],
  ['#1e2a2a','#d8c389','#9a7e3a'], ['#6a4a1e','#f4ecd8','#d8c389'],
  ['#3a1e2a','#ebe0c4','#bfa15a'],
];

const BOOKS = [
  {t:'Paradisi proibiti',                a:'Claudio Pescio',          stato:'Da leggere', y:2019, pp:240, p:0, active:true},
  {t:'Negative Dialektik',               a:'Theodor W. Adorno',       stato:'Letto',      y:1999, pp:412, p:1},
  {t:'Storia naturale dei demoni',       a:'Cesare Catà',             stato:'In lettura', y:2021, pp:188, p:2},
  {t:'Il concetto di filosofia',         a:'Theodor W. Adorno',       stato:'Da leggere', y:1999, pp:296, p:3},
  {t:'L\u2019attualità della filosofia', a:'Theodor W. Adorno',       stato:'Da leggere', y:1962, pp:152, p:4},
  {t:'Filosofia della musica moderna',   a:'Theodor W. Adorno',       stato:'Letto',      y:2002, pp:328, p:5},
  {t:'Kierkegaard. La costruzione',      a:'Theodor W. Adorno',       stato:'Da leggere', y:1962, pp:204, p:6},
  {t:'Il gergo dell\u2019autenticità',   a:'Theodor W. Adorno',       stato:'Letto',      y:1989, pp:176, p:7},
  {t:'Immagini dialettiche',             a:'Theodor W. Adorno',       stato:'Da leggere', y:2004, pp:288, p:8},
  {t:'Scritti sociologici',              a:'Theodor W. Adorno',       stato:'Letto',      y:1978, pp:364, p:0},
  {t:'Ästhetische Theorie',              a:'Theodor W. Adorno',       stato:'Da leggere', y:1973, pp:512, p:5},
  {t:'Progresso e feticismo',            a:'Theodor W. Adorno',       stato:'Da leggere', y:2002, pp:148, p:2},
  {t:'Dialettica dell\u2019illuminismo', a:'Adorno & Horkheimer',     stato:'Letto',      y:1947, pp:280, p:1},
  {t:'Minima moralia',                   a:'Theodor W. Adorno',       stato:'Letto',      y:1951, pp:312, p:3},
];

/* ---------- atoms ---------- */

function litStripBg({h=54, intensity=0.46, center='50%'} = {}) {
  return {
    position:'relative', height:h,
    backgroundImage:
      `radial-gradient(ellipse 60% 180% at ${center} 50%, rgba(232,220,192,${intensity}) 0%, rgba(216,180,106,${intensity*0.55}) 18%, rgba(216,180,106,0.04) 56%, transparent 80%),` +
      `linear-gradient(180deg, rgba(232,220,192,0.04) 0%, rgba(216,180,106,0.10) 50%, rgba(232,220,192,0.04) 100%)`,
    boxShadow:
      `inset 0 1px 0 rgba(232,220,192,0.18),` +
      `inset 0 -1px 0 rgba(0,0,0,0.55)`,
  };
}

const VRule = ({h=18, op=0.28}) =>
  <span style={{width:1, height:h, background:`rgba(216,180,106,${op})`, alignSelf:'center'}}/>;

const CinzelLabel = ({children, size=11, tracking='0.22em', color='rgba(232,220,192,0.82)', weight=500}) =>
  <span style={{
    fontFamily:CINZEL, textTransform:'uppercase',
    letterSpacing:tracking, fontSize:size, fontWeight:weight,
    color, lineHeight:1, whiteSpace:'nowrap',
    textShadow:'0 1px 0 rgba(0,0,0,0.6)',
  }}>{children}</span>;

const IconMagnifier = ({s=12}) => <svg width={s} height={s} viewBox="0 0 13 13" fill="none">
  <circle cx="5.5" cy="5.5" r="3.8" stroke="currentColor" strokeWidth="1.2"/>
  <path d="M8.4 8.4 L11.8 11.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
</svg>;

const IconChevron = ({s=8}) => <svg width={s} height={s*0.75} viewBox="0 0 8 6" fill="none">
  <path d="M1 1 L4 4.5 L7 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
</svg>;

const IconStack = ({s=14}) => <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
  <rect x="2" y="3" width="10" height="2.4" stroke="currentColor" strokeWidth="1" fill="none"/>
  <rect x="3" y="6" width="8"  height="2.4" stroke="currentColor" strokeWidth="1" fill="none"/>
  <rect x="2" y="9" width="10" height="2.4" stroke="currentColor" strokeWidth="1" fill="none"/>
</svg>;

const IconFunnel = ({s=12}) => <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
  <path d="M1.5 2 L10.5 2 L7 6.5 L7 10.5 L5 11.5 L5 6.5 Z"
    stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="miter"/>
</svg>;

const IconGrid = ({s=12}) => <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
  <rect x="1" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1" fill="none"/>
  <rect x="7" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1" fill="none"/>
  <rect x="1" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1" fill="none"/>
  <rect x="7" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1" fill="none"/>
</svg>;

const IconList = ({s=12}) => <svg width={s} height={s} viewBox="0 0 12 12" fill="none"
  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
  <line x1="1" y1="2.5" x2="11" y2="2.5"/>
  <line x1="1" y1="6"   x2="11" y2="6"/>
  <line x1="1" y1="9.5" x2="11" y2="9.5"/>
</svg>;

const IconRune = ({s=18, color=CINE_GOLD}) => <svg width={s} height={s} viewBox="0 0 18 18" fill="none">
  <path d="M3 2 L3 16 L9 14 L15 16 L15 2 L9 4 Z"
    stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="miter"/>
  <path d="M9 4 L9 14" stroke={color} strokeWidth="0.9" opacity="0.55"/>
  <path d="M9 1 L10 3 L9 5 L8 3 Z" fill={color} opacity="0.85"/>
</svg>;

const btnGhost = {
  display:'inline-flex', alignItems:'center', gap:8, padding:'6px 12px',
  background:'transparent', border:'1px solid rgba(216,180,106,0.22)',
  color:CINE_CREAM, cursor:'pointer', fontFamily:AGMENA,
};

const iconBtn = {
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  width:32, height:32, padding:0,
  background:'rgba(0,0,0,0.28)', border:'1px solid rgba(232,220,192,0.22)',
  color:CINE_CREAM, cursor:'pointer',
};

const segBtn = {
  padding:'6px 12px', background:'transparent', border:'none',
  color:'rgba(232,220,192,0.62)', cursor:'pointer',
  display:'inline-flex', alignItems:'center', justifyContent:'center',
};
const segActive = { background:'rgba(216,180,106,0.16)', color:CINE_CREAM };

/* ---------- the shared filter strip ---------- */

function FilterStrip({view, onView, count, total}) {
  return (
    <div style={litStripBg({h:54, intensity:0.46, center:'50%'})}>
      <div style={{position:'absolute', inset:0, padding:'0 22px', display:'flex', alignItems:'center', gap:18}}>
        {/* Section label */}
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <IconRune s={18}/>
          <CinzelLabel size={16} tracking="0.22em" color={CINE_CREAM} weight={600}>Libreria</CinzelLabel>
        </div>

        <VRule h={26}/>

        <button style={btnGhost} title="Filtri">
          <IconFunnel s={11}/>
          <CinzelLabel size={11} color={CINE_CREAM}>Filtri</CinzelLabel>
          <span style={{fontFamily:AGMENA, fontStyle:'italic', fontSize:12, color:'rgba(232,220,192,0.7)', marginLeft:6}}>Tutti</span>
        </button>

        <button style={btnGhost} title="Ordina">
          <CinzelLabel size={11} color={CINE_CREAM}>Ordina</CinzelLabel>
          <span style={{fontFamily:AGMENA, fontStyle:'italic', fontSize:12, color:'rgba(232,220,192,0.7)', marginLeft:2}}>data aggiunta</span>
          <IconChevron s={8}/>
        </button>

        <div style={{flex:1}}/>

        <button style={iconBtn} title="Cerca"><IconMagnifier s={13}/></button>

        <div style={{display:'inline-flex', border:'1px solid rgba(232,220,192,0.22)'}}>
          <button onClick={()=>onView('grid')}
            style={{...segBtn, ...(view==='grid' ? segActive : {})}} title="Griglia"><IconGrid s={11}/></button>
          <button onClick={()=>onView('list')}
            style={{...segBtn, ...(view==='list' ? segActive : {})}} title="Lista"><IconList s={11}/></button>
        </div>

        <VRule h={26}/>

        <div style={{display:'inline-flex', alignItems:'center', gap:8, color:CINE_GOLD}}>
          <IconStack s={14}/>
          <span style={{
            fontFamily:CINZEL, fontSize:14, fontWeight:600, letterSpacing:'0.04em',
            color:CINE_CREAM, fontVariantNumeric:'tabular-nums',
            textShadow:'0 1px 0 rgba(0,0,0,0.6)',
          }}>{count}<span style={{color:'rgba(232,220,192,0.55)', fontWeight:400}}> / {total}</span></span>
        </div>
      </div>
    </div>
  );
}

/* ---------- grid view ---------- */

function MiniCover({title, author, w=132, h=190, palette, active}) {
  const [bg, fg, accent] = palette;
  return (
    <div style={{display:'flex', flexDirection:'column', gap:6, width:w, cursor:'pointer'}}>
      <div style={{
        width:w, height:h, background:bg, color:fg, position:'relative',
        boxShadow: active
          ? 'inset 0 0 0 1px rgba(0,0,0,0.25), inset 6px 0 0 rgba(0,0,0,0.18), 0 8px 22px rgba(0,0,0,0.6), 0 0 0 1px '+CINE_GOLD+', 0 0 24px rgba(216,180,106,0.45)'
          : 'inset 0 0 0 1px rgba(0,0,0,0.25), inset 6px 0 0 rgba(0,0,0,0.15), 0 4px 14px rgba(0,0,0,0.55)',
        overflow:'hidden', flexShrink:0,
      }}>
        <div style={{position:'absolute', inset:'8% 10%', border:'1px solid '+accent, opacity:0.45}}/>
        <div style={{
          position:'absolute', top:'18%', left:'14%', right:'14%',
          fontFamily:CINZEL, fontSize:Math.max(10, w*0.11),
          textTransform:'uppercase', letterSpacing:'0.08em',
          lineHeight:1.18, fontWeight:600, color:fg,
        }}>{title}</div>
        <div style={{
          position:'absolute', bottom:'10%', left:'14%', right:'14%',
          fontFamily:AGMENA, fontStyle:'italic', fontSize:Math.max(8, w*0.075),
          color:accent, opacity:0.9,
        }}>{author}</div>
      </div>
      <div style={{
        fontFamily:AGMENA, fontSize:12,
        color: active ? CINE_CREAM : 'rgba(232,220,192,0.95)',
        lineHeight:1.25, textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
      }}>{title}</div>
      <div style={{fontFamily:AGMENA, fontSize:11, fontStyle:'italic', color:'rgba(232,220,192,0.72)'}}>{author}</div>
    </div>
  );
}

function GridView() {
  return (
    <div style={{
      marginTop:24, display:'grid', gridTemplateColumns:'repeat(7, 1fr)',
      gap:'30px 22px', paddingBottom:24,
    }}>
      {BOOKS.map((b, i) => (
        <MiniCover key={i} title={b.t} author={b.a} w={132} h={190}
          palette={BOOK_PALETTES[b.p % BOOK_PALETTES.length]} active={b.active}/>
      ))}
    </div>
  );
}

/* ---------- list view ---------- */

const COLS = [
  {label:'NOME',   w:'2.2fr', align:'left',
    render:b => <span style={{fontFamily:AGMENA, fontSize:14, color:CINE_CREAM, textShadow:'0 1px 0 rgba(0,0,0,0.55)'}}>{b.t}</span>},
  {label:'AUTORE', w:'1.4fr', align:'left',
    render:b => <span style={{fontFamily:AGMENA, fontSize:13, color:'rgba(232,220,192,0.78)'}}>{b.a}</span>},
  {label:'STATO',  w:'130px', align:'right',
    render:b => <span style={{
      fontFamily:CINZEL, fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase',
      color: b.stato==='Letto'?CINE_GOLD : b.stato==='In lettura'?CINE_VERM : 'rgba(232,220,192,0.7)',
    }}>{b.stato}</span>},
  {label:'ANNO',   w:'70px',  align:'right',
    render:b => <span style={{fontFamily:CINZEL, fontSize:12, color:CINE_CREAM, fontVariantNumeric:'tabular-nums'}}>{b.y}</span>},
  {label:'PAG.',   w:'60px',  align:'right',
    render:b => <span style={{fontFamily:CINZEL, fontSize:12, color:'rgba(232,220,192,0.78)', fontVariantNumeric:'tabular-nums'}}>{b.pp}</span>},
];

function ColumnHeader() {
  return (
    <div style={{
      display:'grid', gridTemplateColumns: COLS.map(c=>c.w).join(' '),
      alignItems:'center', padding:'8px 18px',
      borderBottom:'1px solid rgba(216,180,106,0.22)',
    }}>
      {COLS.map((c, i) => (
        <div key={i} style={{textAlign:c.align}}>
          <CinzelLabel size={9} tracking="0.26em" color="rgba(232,220,192,0.55)">{c.label}</CinzelLabel>
        </div>
      ))}
    </div>
  );
}

function ListRow({b}) {
  return (
    <div style={{
      display:'grid', gridTemplateColumns: COLS.map(c=>c.w).join(' '),
      alignItems:'center', padding:'10px 18px',
      borderBottom:'1px solid rgba(216,180,106,0.10)',
      background: b.active
        ? 'linear-gradient(90deg, transparent 0%, rgba(232,220,192,0.10) 30%, rgba(232,220,192,0.14) 50%, rgba(232,220,192,0.10) 70%, transparent 100%)'
        : 'transparent',
      position:'relative', cursor:'pointer',
    }}>
      {b.active && <span style={{position:'absolute', left:0, top:0, bottom:0, width:2, background:CINE_GOLD}}/>}
      {COLS.map((c, i) => (
        <div key={i} style={{textAlign:c.align, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
          {c.render(b)}
        </div>
      ))}
    </div>
  );
}

function ListView() {
  return (
    <div style={{marginTop:6}}>
      <ColumnHeader/>
      {BOOKS.map((b, i) => <ListRow key={i} b={b}/>)}
    </div>
  );
}

/* ---------- page wrapper ---------- */

function PageShell({children}) {
  return (
    <div style={{
      width:'100%', height:'100%',
      background:
        'radial-gradient(ellipse 800px 540px at 78% 32%, rgba(255,210,140,0.10), transparent 65%),' +
        'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.45) 100%),' +
        CINE_BG,
      color:CINE_CREAM, position:'relative', overflow:'hidden', fontFamily:AGMENA,
    }}>
      <div style={{
        position:'absolute', inset:0, opacity:0.28, mixBlendMode:'overlay', pointerEvents:'none',
        backgroundImage: 'url("data:image/svg+xml;utf8,'+ encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.6  0 0 0 0 0.5  0 0 0 0 0.3  0 0 0 0.5 0"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>'
        ) + '")',
      }}/>
      <div style={{position:'relative', zIndex:1, padding:'24px 56px', height:'100%', boxSizing:'border-box', overflow:'auto'}}>
        {children}
      </div>
    </div>
  );
}

function LibreriaPage() {
  const [view, setView] = React.useState('grid');
  return (
    <PageShell>
      <FilterStrip view={view} onView={setView} count={BOOKS.length} total={543}/>
      {view === 'grid' ? <GridView/> : <ListView/>}
    </PageShell>
  );
}

window.LibreriaPage = LibreriaPage;
