/* Cinematic shell + Studio dashboard.
   Shell components are reused by all the other cinematic screens
   (screens-cinematic-2.jsx, screens-cinematic-3.jsx).
   The image-slot uses one shared id 'cine-bg-malachia' so a single
   drop fills the background everywhere. */

/* ---------- shared tokens ---------- */
const CINE_GOLD = '#d8b46a';
const CINE_GOLD_DIM = '#9a7e3a';
const CINE_CREAM = '#e8dcc0';
const CINE_VERM = '#c0533b';
const CINE_BG = '#0a0704';
const CINE_BG_SHARED_ID = 'cine-bg-malachia';

/* Cover palettes (warm/dark book covers) — used by CineBook below */
const BOOK_PALETTES = [
  ['#3a2a1a', '#f4ecd8', '#bfa15a'],   // brown + gold
  ['#7a3b2e', '#f4ecd8', '#d8c389'],   // terracotta + cream
  ['#1a2a4a', '#d8c389', '#bfa15a'],   // navy + gold
  ['#2a3a1e', '#ebe0c4', '#d8c389'],   // moss + cream
  ['#4a2a3e', '#f4ecd8', '#d8c389'],   // plum + cream
  ['#5a3a1e', '#f4ecd8', '#bfa15a'],   // sienna + gold
  ['#1e2a2a', '#d8c389', '#9a7e3a'],   // teal-black + gold
  ['#6a4a1e', '#f4ecd8', '#d8c389'],   // ochre + cream
  ['#3a1e2a', '#ebe0c4', '#bfa15a'],   // wine + gold
];

/* ---------- atmospheric overlay (gradients, vignette, grain) ---------- */
function CinematicOverlay() {
  return (
    <div style={{position:'absolute', inset:0, pointerEvents:'none', zIndex:2}}>
      <div style={{
        position:'absolute', inset:0,
        background:
          'radial-gradient(ellipse 800px 540px at 82% 32%, rgba(255,210,140,0.18), transparent 65%),' +
          'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.75) 100%),' +
          'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, transparent 55%, rgba(0,0,0,0.25) 100%),' +
          'radial-gradient(ellipse at 35% 60%, transparent 35%, rgba(0,0,0,0.55) 100%)',
      }}/>
      <div style={{
        position:'absolute', inset:0, opacity:0.35, mixBlendMode:'overlay',
        backgroundImage: 'url("data:image/svg+xml;utf8,'+ encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.6  0 0 0 0 0.5  0 0 0 0 0.3  0 0 0 0.5 0"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>'
        ) + '")',
      }}/>
    </div>
  );
}

/* ---------- heraldic crest with M ---------- */
function Crest({size=64}) {
  return (
    <div style={{position:'relative', width:size*1.4, height:size*1.2, flexShrink:0}}>
      <svg width="100%" height="100%" viewBox="0 0 90 78" fill="none">
        <path d="M45,4 L80,12 L80,40 Q80,60 45,74 Q10,60 10,40 L10,12 Z"
              fill="rgba(20,14,7,0.65)" stroke={CINE_GOLD_DIM} strokeWidth="1"/>
        <path d="M45,9 L75,16 L75,40 Q75,57 45,68 Q15,57 15,40 L15,16 Z"
              fill="none" stroke={CINE_GOLD} strokeWidth="0.5" opacity="0.5"/>
        <g stroke={CINE_GOLD} strokeWidth="0.8" fill="none" opacity="0.75">
          <path d="M10,18 Q2,22 4,32 Q6,40 12,42"/>
          <path d="M10,28 Q5,30 6,38"/>
          <path d="M80,18 Q88,22 86,32 Q84,40 78,42"/>
          <path d="M80,28 Q85,30 84,38"/>
        </g>
        <text x="45" y="50" textAnchor="middle"
              fontFamily="UnifrakturCook, serif" fontSize="32" fill={CINE_GOLD}
              style={{textShadow:'0 1px 0 rgba(0,0,0,0.6)'}}>M</text>
        <g fill={CINE_GOLD}>
          <path d="M45,18 L47,21 L45,24 L43,21 Z"/>
          <path d="M45,64 L47,67 L45,70 L43,67 Z"/>
        </g>
      </svg>
    </div>
  );
}

/* ---------- top-bar tab ---------- */
function NavTab({label, active, marker, hasMenu, menuItems, activeSub}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      style={{position:'relative', padding:'4px 14px'}}
      onMouseEnter={()=>hasMenu && setOpen(true)}
      onMouseLeave={()=>hasMenu && setOpen(false)}
    >
      {marker && (
        <svg width="9" height="9" viewBox="0 0 10 10"
             style={{position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', color:CINE_CREAM}}>
          <path d="M5,1 L9,5 L5,9 L1,5 Z" fill="currentColor" opacity="0.95"/>
        </svg>
      )}
      <div style={{
        display:'inline-flex', alignItems:'center', gap:6,
        fontFamily:"'Mantinia', 'Mantinia', 'Cinzel', serif",
        textTransform:'uppercase',
        letterSpacing:'0.16em', fontSize:13,
        color: active ? CINE_CREAM : 'rgba(232,220,192,0.75)',
        fontWeight: active ? 600 : 400,
        borderBottom: active ? '1.5px solid '+CINE_CREAM : '1.5px solid transparent',
        paddingBottom: 5,
        lineHeight:1,
        whiteSpace:'nowrap',
        cursor: hasMenu ? 'pointer' : 'default',
      }}>
        {label}
        {hasMenu && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" style={{opacity:0.7, marginTop:1}}>
            <path d="M1 1 L4 4.5 L7 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
          </svg>
        )}
      </div>
      {hasMenu && open && (
        <div style={{
          position:'absolute', top:'calc(100% + 8px)', left:'50%', transform:'translateX(-50%)',
          minWidth:160, padding:'8px 4px',
          background:'rgba(14,9,5,0.92)',
          border:'1px solid rgba(216,180,106,0.32)',
          backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
          boxShadow:'0 12px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.4) inset',
          zIndex:20,
        }}>
          <svg width="10" height="6" viewBox="0 0 10 6"
               style={{position:'absolute', top:-6, left:'50%', transform:'translateX(-50%)'}}>
            <path d="M5 0 L10 6 L0 6 Z" fill="rgba(14,9,5,0.92)" stroke="rgba(216,180,106,0.32)" strokeWidth="1"/>
          </svg>
          {menuItems.map(mi => (
            <div key={mi} style={{
              padding:'8px 16px',
              fontFamily:"'Mantinia', 'Mantinia', 'Cinzel', serif",
              textTransform:'uppercase',
              letterSpacing:'0.14em', fontSize:12,
              color: mi === activeSub ? CINE_CREAM : 'rgba(232,220,192,0.72)',
              fontWeight: mi === activeSub ? 600 : 400,
              cursor:'pointer',
              whiteSpace:'nowrap',
            }}>{mi}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- action button (cerca / aggiungi / impostazioni) ---------- */
function NavAction({label, primary, icon}) {
  return (
    <button title={label} aria-label={label} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:38, height:38, padding:0,
      background: primary ? 'rgba(216,180,106,0.12)' : 'rgba(0,0,0,0.25)',
      border: '1px solid '+(primary ? 'rgba(216,180,106,0.5)' : 'rgba(232,220,192,0.28)'),
      color: primary ? CINE_GOLD : CINE_CREAM,
      cursor:'pointer',
      backdropFilter:'blur(6px)',
      WebkitBackdropFilter:'blur(6px)',
    }}>
      {icon}
    </button>
  );
}

/* ---------- the cinematic shell ---------- */
function CinematicShell({active='Studio', activeSub, children, w=1280, h=880}) {
  const navItems = [
    {label:'Studio'},
    {label:'Libreria', hasMenu:true, menuItems:['Autori', 'Editori']},
    {label:'Scaffali'},
    {label:'Desiderata'},
    {label:'Note'},
    {label:'Grafo'},
    {label:'Annales'},
  ];

  return (
    <div style={{
      width:w, height:h, position:'relative', overflow:'hidden',
      background:CINE_BG,
      color:CINE_CREAM,
      fontFamily:"'Agmena Pro', Georgia, serif",
    }}>
      {/* shared photo bg (drop once, applies everywhere) */}
      <image-slot
        id={CINE_BG_SHARED_ID}
        shape="rect"
        fit="cover"
        placeholder="Trascina qui una foto della tua biblioteca"
        style={{position:'absolute', inset:0, width:'100%', height:'100%', zIndex:0}}
      />

      <CinematicOverlay/>

      {/* TOP BAR */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:64,
        display:'flex', alignItems:'center', padding:'0 28px', gap:20,
        zIndex:6,
        background:'linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 70%, transparent 100%)',
      }}>
        <div style={{display:'flex', alignItems:'center', gap:0}}>
          {navItems.map((t, i)=>(
            <React.Fragment key={t.label}>
              <NavTab
                label={t.label}
                active={t.label === active}
                marker={t.label === active}
                hasMenu={t.hasMenu}
                menuItems={t.menuItems}
                activeSub={t.label === active ? activeSub : undefined}
              />
              {i < navItems.length-1 && (
                <span style={{color:'rgba(232,220,192,0.22)', fontSize:18, lineHeight:1}}>|</span>
              )}
            </React.Fragment>
          ))}
        </div>

        <div style={{flex:1}}/>

        <div style={{display:'flex', alignItems:'center', gap:22}}>
          <div style={{display:'flex', alignItems:'center', gap:9}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8.5" stroke={CINE_CREAM} strokeWidth="1"/>
              <path d="M6 7 L14 7 M6 10 L14 10 M6 13 L12 13" stroke={CINE_CREAM} strokeWidth="0.9"/>
            </svg>
            <span className="m-nums" style={{
              fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif", fontSize:18, fontWeight:500,
              color:CINE_CREAM, lineHeight:1, letterSpacing:'0.02em',
            }}>543</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:9}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8.5" stroke={CINE_CREAM} strokeWidth="1"/>
              <path d="M13 7 Q10 5.8 8 8 Q6 10 8 12 Q10 14 13 12.8 M7 10 L12 10"
                    stroke={CINE_CREAM} strokeWidth="0.9" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="m-nums" style={{
              fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif", fontSize:18, fontWeight:500,
              color:CINE_CREAM, lineHeight:1, letterSpacing:'0.02em',
            }}>6.636,44</span>
          </div>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:10, marginLeft:14,
          paddingLeft:18, borderLeft:'1px solid rgba(216,180,106,0.22)',
        }}>
          <NavAction
            label="Cerca (⌘K)"
            icon={
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="6.3" cy="6.3" r="4.4" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M9.7 9.7 L13.2 13.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
          />
          <NavAction
            primary
            label="Aggiungi libro"
            icon={
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 2 L7.5 13 M2 7.5 L13 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
          />
          <NavAction
            label="Impostazioni"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M8 1.5 L8 3.5 M8 12.5 L8 14.5 M1.5 8 L3.5 8 M12.5 8 L14.5 8
                         M3.2 3.2 L4.6 4.6 M11.4 11.4 L12.8 12.8
                         M3.2 12.8 L4.6 11.4 M11.4 4.6 L12.8 3.2"
                      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            }
          />
        </div>
      </div>

      {/* CONTENT SLOT */}
      <div style={{position:'absolute', top:64, left:0, right:0, bottom:0, zIndex:3, overflow:'hidden'}}>
        {children}
      </div>
    </div>
  );
}

/* ---------- shared content primitives ---------- */
function CinePageTitle({eyebrow, title, em, right}) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:32,
                 marginBottom:24, paddingTop:8}}>
      <div>
        <div style={{
          fontFamily:"'Mantinia', 'Mantinia', 'Cinzel', serif",
          textTransform:'uppercase',
          letterSpacing:'0.32em', fontSize:11,
          color:'rgba(232,220,192,0.75)', marginBottom:6,
        }}>{eyebrow}</div>
        <div style={{
          fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif",
          fontSize:38, fontWeight:600, lineHeight:1.05,
          letterSpacing:'0.03em',
          color:CINE_CREAM,
          textTransform:'uppercase',
          textShadow:'0 1px 0 rgba(0,0,0,0.65), 0 0 18px rgba(0,0,0,0.4)',
        }}>
          {title}{em && <span style={{color:CINE_GOLD, fontWeight:400, marginLeft:14, textTransform:'none', fontFamily:"'Agmena Pro', serif", fontStyle:'italic', letterSpacing:'0.01em'}}>{em}</span>}
        </div>
      </div>
      {right}
    </div>
  );
}

function CineSectionRule({title, count, action}) {
  return (
    <div style={{
      display:'flex', alignItems:'baseline', gap:14,
      borderBottom:'1px solid '+CINE_GOLD_DIM, paddingBottom:10, marginBottom:18,
    }}>
      <span style={{
        fontFamily:"'Mantinia', 'Mantinia', 'Cinzel', serif",
        textTransform:'uppercase',
        letterSpacing:'0.18em', fontSize:13, color:CINE_CREAM, fontWeight:600,
        textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
      }}>{title}</span>
      {count != null && (
        <span style={{fontSize:12, color:CINE_GOLD, letterSpacing:'0.16em',
          fontFamily:"'Mantinia', 'Cinzel', serif", fontWeight:500,
        }}>{count}</span>
      )}
      <span style={{flex:1}}/>
      {action}
    </div>
  );
}

/* Small cinema book cover — colored placeholder w/ title overlay.
   Uses real palette + title for variety without needing real images. */
function CineBook({title, author, year, w=120, h=180, palette}) {
  const p = palette || BOOK_PALETTES[0];
  const [bg, fg, accent] = p;
  return (
    <div style={{display:'flex', flexDirection:'column', gap:6, width:w}}>
      <div style={{
        width:w, height:h,
        background:bg, color:fg,
        position:'relative',
        boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.25), inset 6px 0 0 rgba(0,0,0,0.15), 0 4px 14px rgba(0,0,0,0.5)',
        overflow:'hidden',
        flexShrink:0,
      }}>
        <div style={{position:'absolute', inset:'8% 10%', border:'1px solid '+accent, opacity:0.45}}/>
        <div style={{
          position:'absolute', top:'18%', left:'14%', right:'14%',
          fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif",
          fontSize: Math.max(9, Math.min(14, w*0.11)),
          textTransform:'uppercase',
          letterSpacing:'0.08em',
          lineHeight:1.18, fontWeight:600, color:fg,
        }}>{title}</div>
        {author && (
          <div style={{
            position:'absolute', bottom:'10%', left:'14%', right:'14%',
            fontFamily:"'Agmena Pro', serif",
            fontStyle:'italic', fontSize: Math.max(8, w*0.075),
            color:accent, opacity:0.9,
          }}>{author}</div>
        )}
      </div>
      {title !== undefined && (
        <div style={{
          fontFamily:"'Agmena Pro', serif",
          fontSize:12, color:CINE_CREAM, lineHeight:1.25,
          textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
        }}>{title}</div>
      )}
      {author && (
        <div style={{
          fontFamily:"'Agmena Pro', serif",
          fontSize:11, fontStyle:'italic',
          color:'rgba(232,220,192,0.82)',
        }}>{author}{year ? ' · ' + year : ''}</div>
      )}
    </div>
  );
}

/* ---------- Studio · cinematic title screen (Elden Ring style) ---------- */
function WebDashboardCinematic() {
  const [hoverBg, setHoverBg] = React.useState(false);
  const pickBg = () => {
    // The shared image-slot lives at top-level in CinematicShell.
    // Its file input is inside its shadow root — click it to open the picker.
    const slot = document.getElementById('cine-bg-malachia');
    if (!slot || !slot.shadowRoot) return;
    const input = slot.shadowRoot.querySelector('input[type="file"]');
    if (input) input.click();
  };
  return (
    <CinematicShell active="Studio">
      <style>{`
        @keyframes cine-breath { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
        @keyframes cine-emberA { 0% { transform: translateY(0) translateX(0); opacity: 0; }
                                 15% { opacity: 0.9; }
                                 100% { transform: translateY(-180px) translateX(20px); opacity: 0; } }
        @keyframes cine-emberB { 0% { transform: translateY(0) translateX(0); opacity: 0; }
                                 20% { opacity: 0.7; }
                                 100% { transform: translateY(-220px) translateX(-30px); opacity: 0; } }
        @keyframes cine-sigilPulse { 0%, 100% { opacity: 0.55; filter: drop-shadow(0 0 24px rgba(216,180,106,0.15)); }
                                     50% { opacity: 0.85; filter: drop-shadow(0 0 48px rgba(216,180,106,0.35)); } }
        @keyframes cine-titleGlow  { 0%, 100% { text-shadow: 0 2px 0 rgba(0,0,0,0.85), 0 4px 28px rgba(0,0,0,0.75), 0 0 60px rgba(216,180,106,0.18); }
                                     50% { text-shadow: 0 2px 0 rgba(0,0,0,0.85), 0 4px 28px rgba(0,0,0,0.75), 0 0 90px rgba(216,180,106,0.32); } }
      `}</style>

      {/* Floating embers — UNTOUCHED */}
      <div style={{position:'absolute', inset:0, pointerEvents:'none', zIndex:2}}>
        {Array.from({length: 18}).map((_, i) => {
          const left = 8 + (i * 53) % 84;
          const bottom = 4 + (i * 17) % 30;
          const size = 1 + (i % 4) * 0.6;
          const delay = (i % 7) * 0.8;
          const dur = 5 + (i % 5) * 1.4;
          return (
            <span key={i} style={{
              position:'absolute',
              left: left + '%',
              bottom: bottom + '%',
              width:size, height:size, borderRadius:'50%',
              background:'rgba(255,210,140,0.85)',
              boxShadow:'0 0 6px rgba(255,200,120,0.7)',
              animation: `${i%2 ? 'cine-emberB' : 'cine-emberA'} ${dur}s ease-out ${delay}s infinite`,
            }}/>
          );
        })}
      </div>

      {/* Title block — sigil behind + MALACHIA on top, centered upper-middle */}
      <div style={{
        position:'absolute', top:'42%', left:'50%',
        transform:'translate(-50%, -50%)', zIndex:5,
      }}>
        {/* Sigil */}
        <svg width="720" height="720" viewBox="0 0 720 720"
             style={{
               position:'absolute', top:'50%', left:'50%',
               transform:'translate(-50%, -50%)', zIndex:1,
               pointerEvents:'none',
               animation:'cine-sigilPulse 6s ease-in-out infinite',
             }}>
          <defs>
            <radialGradient id="sigilCenterGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0"    stopColor="rgba(216,180,106,0.5)"/>
              <stop offset="0.18" stopColor="rgba(216,180,106,0.18)"/>
              <stop offset="0.45" stopColor="rgba(216,180,106,0.06)"/>
              <stop offset="1"    stopColor="rgba(216,180,106,0)"/>
            </radialGradient>
            <linearGradient id="sigilVertical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0"   stopColor="rgba(216,180,106,0)"/>
              <stop offset="0.15" stopColor="rgba(216,180,106,0.45)"/>
              <stop offset="0.5"  stopColor="rgba(216,180,106,0.85)"/>
              <stop offset="0.85" stopColor="rgba(216,180,106,0.45)"/>
              <stop offset="1"    stopColor="rgba(216,180,106,0)"/>
            </linearGradient>
            <linearGradient id="sigilHorizontal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0"    stopColor="rgba(216,180,106,0)"/>
              <stop offset="0.25" stopColor="rgba(216,180,106,0.25)"/>
              <stop offset="0.5"  stopColor="rgba(216,180,106,0.5)"/>
              <stop offset="0.75" stopColor="rgba(216,180,106,0.25)"/>
              <stop offset="1"    stopColor="rgba(216,180,106,0)"/>
            </linearGradient>
          </defs>

          {/* Central radial glow */}
          <circle cx="360" cy="360" r="320" fill="url(#sigilCenterGlow)"/>

          {/* Outer ring (rays/arc) — broken at top/bottom */}
          <path d="M 360 80 A 280 280 0 1 1 360 640 A 280 280 0 1 1 360 80"
                fill="none" stroke="rgba(216,180,106,0.32)" strokeWidth="1"/>
          {/* Inner ring */}
          <path d="M 360 120 A 240 240 0 1 1 360 600 A 240 240 0 1 1 360 120"
                fill="none" stroke="rgba(216,180,106,0.18)" strokeWidth="0.6"/>
          {/* Innermost faint ring */}
          <circle cx="360" cy="360" r="195"
                  fill="none" stroke="rgba(216,180,106,0.12)" strokeWidth="0.4"/>

          {/* Vertical axis (extending past the circle) */}
          <line x1="360" y1="20" x2="360" y2="700"
                stroke="url(#sigilVertical)" strokeWidth="1.1"/>
          {/* Horizontal axis */}
          <line x1="80" y1="360" x2="640" y2="360"
                stroke="url(#sigilHorizontal)" strokeWidth="0.6"/>

          {/* Energy spikes top + bottom */}
          <g stroke="rgba(216,180,106,0.45)" strokeWidth="0.5" fill="none">
            <path d="M 354 100 L 360 80 L 366 100"/>
            <path d="M 354 620 L 360 640 L 366 620"/>
          </g>

          {/* Tiny diamonds at cardinal points */}
          <g fill="rgba(216,180,106,0.85)">
            <path d="M 360 70 L 364 80 L 360 90 L 356 80 Z"/>
            <path d="M 360 630 L 364 640 L 360 650 L 356 640 Z"/>
            <circle cx="360" cy="360" r="3"/>
          </g>

          {/* Brightest sparks just below center */}
          <g fill="rgba(255,220,160,0.9)">
            <circle cx="360" cy="492" r="2"/>
            <circle cx="360" cy="640" r="3"/>
          </g>

          {/* Subtle radial cracks */}
          <g stroke="rgba(216,180,106,0.13)" strokeWidth="0.4" fill="none">
            <path d="M 360 360 L 480 250"/>
            <path d="M 360 360 L 240 250"/>
            <path d="M 360 360 L 500 460"/>
            <path d="M 360 360 L 220 470"/>
            <path d="M 360 360 L 420 200"/>
            <path d="M 360 360 L 300 200"/>
          </g>
        </svg>

        {/* MALACHIA title (on top of sigil) */}
        <h1 style={{
          position:'relative', zIndex:2,
          margin:0,
          fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif",
          fontSize:148, fontWeight:400,
          letterSpacing:'0.08em',
          lineHeight:1,
          color:CINE_CREAM,
          textTransform:'uppercase',
          whiteSpace:'nowrap',
          animation:'cine-titleGlow 5s ease-in-out infinite',
          paddingLeft:'0.08em', // visual-centering for tracking
        }}>
          Malachia
        </h1>
      </div>

      {/* "Press any button" style prompt — lower-third */}
      <div style={{
        position:'absolute', bottom:88, left:0, right:0, zIndex:5,
        display:'flex', flexDirection:'column', alignItems:'center', gap:10,
      }}>
        <div style={{
          fontFamily:"'Mantinia', 'Cinzel', serif",
          fontSize:14, letterSpacing:'0.38em',
          color:CINE_CREAM,
          textTransform:'uppercase',
          animation:'cine-breath 2.6s ease-in-out infinite',
          textShadow:'0 1px 2px rgba(0,0,0,0.8), 0 0 18px rgba(216,180,106,0.25)',
          cursor:'pointer',
        }}>
          Entra nello studio
        </div>
        {/* Underglow */}
        <div style={{
          width:280, height:6,
          background:'radial-gradient(ellipse 140px 6px at 50% 0%, rgba(216,180,106,0.55) 0%, rgba(216,180,106,0.15) 50%, transparent 100%)',
        }}/>
      </div>

      {/* Bottom credits */}
      <div style={{
        position:'absolute', bottom:18, left:0, right:0, zIndex:5,
        textAlign:'center',
        fontFamily:"'Mantinia', 'Cinzel', serif",
        fontSize:10, letterSpacing:'0.26em',
        color:'rgba(232,220,192,0.45)',
        textTransform:'uppercase',
      }}>
        Malachia™ &nbsp;·&nbsp; Bibliotheca Secreta &nbsp;·&nbsp; MMXXVI
      </div>

      {/* Change-background hover button (bottom-right) */}
      <button
        onClick={pickBg}
        onMouseEnter={()=>setHoverBg(true)}
        onMouseLeave={()=>setHoverBg(false)}
        title="Cambia sfondo"
        aria-label="Cambia sfondo"
        style={{
          position:'absolute', bottom:48, right:28, zIndex:6,
          display:'inline-flex', alignItems:'center',
          gap: hoverBg ? 10 : 0,
          padding:'9px 12px',
          background: hoverBg ? 'rgba(216,180,106,0.12)' : 'rgba(0,0,0,0.45)',
          border:'1px solid '+(hoverBg ? 'rgba(216,180,106,0.55)' : 'rgba(216,180,106,0.28)'),
          color: hoverBg ? CINE_GOLD : 'rgba(232,220,192,0.78)',
          cursor:'pointer',
          backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
          transition:'all 0.25s ease',
          fontFamily:"'Mantinia', 'Cinzel', serif",
          textTransform:'uppercase', letterSpacing:'0.24em', fontSize:11,
          lineHeight:1,
        }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="3" width="13" height="10" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <path d="M1.5 11 L5.5 7.5 L8.5 10 L10.5 8.5 L14.5 11.5"
                stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
          <circle cx="11" cy="6" r="1.2" fill="currentColor"/>
        </svg>
        <span style={{
          maxWidth: hoverBg ? 160 : 0,
          overflow:'hidden', whiteSpace:'nowrap',
          transition:'max-width 0.25s ease',
        }}>Cambia sfondo</span>
      </button>
    </CinematicShell>
  );
}

window.BOOK_PALETTES = BOOK_PALETTES;
window.CINE_GOLD = CINE_GOLD;
window.CINE_GOLD_DIM = CINE_GOLD_DIM;
window.CINE_CREAM = CINE_CREAM;
window.CINE_VERM = CINE_VERM;
window.CINE_BG = CINE_BG;
window.CinematicShell = CinematicShell;
window.CinematicOverlay = CinematicOverlay;
window.Crest = Crest;
window.NavTab = NavTab;
window.NavAction = NavAction;
window.CinePageTitle = CinePageTitle;
window.CineSectionRule = CineSectionRule;
window.CineBook = CineBook;
window.WebDashboardCinematic = WebDashboardCinematic;
