/* ============================================================
   COLLEZIONE TOLKIEN — "diario / quest-journal" reimagining (v3)
   ------------------------------------------------------------
     · left  → the titles of the collection (each = a "scaffale" holding its
               editions). Selected = enlarged, spine markers on the right.
               On hover each row reveals move / edit / delete actions.
     · right → the COVERS of the editions of the selected title, in columns,
               larger, inside a gold-framed panel with a torn-parchment banner.
     · bg    → its own image-slot (id "tolkien-bg"); "Cambia sfondo" opens it.
     · foot  → actions: Nuovo scaffale · Nuovo libro
   Self-contained: reads only window tokens + window.CineBook / BOOK_PALETTES.
   ============================================================ */
(function () {
  const GOLD = window.CINE_GOLD || '#d8b46a';
  const GOLD_DIM = window.CINE_GOLD_DIM || '#9a7e3a';
  const CREAM = window.CINE_CREAM || '#e8dcc0';
  const VERM = window.CINE_VERM || '#c0533b';
  const PALETTES = window.BOOK_PALETTES || [['#3a2a1a', '#f4ecd8', '#bfa15a']];

  const SERIF_CAPS = "'Cinzel', 'Cormorant Garamond', serif";
  const BODY = "'Agmena Pro', Georgia, serif";
  const BG_SLOT_ID = 'tolkien-bg';

  /* ---------------- collection data (each title carries its editions) ---------------- */
  const TK_WORKS = [
    { id:'sda', t:'Il Signore degli Anelli', a:'J.R.R. Tolkien', ed:[
      { l:'Bompiani · cofanetto (Alan Lee)', owned:true },
      { l:'Rusconi 1977 · prima ed. it.', owned:true },
      { l:'HarperCollins · single-volume', owned:false },
      { l:'Ed. del Cinquantenario', owned:false },
    ]},
    { id:'hobbit', t:'Lo Hobbit', a:'J.R.R. Tolkien', ed:[
      { l:'Adelphi · trad. Jeronimidis', owned:true },
      { l:'The Hobbit · illustr. dall\u2019autore', owned:false },
      { l:'Lo Hobbit annotato', owned:false },
    ]},
    { id:'silm', t:'Il Silmarillion', a:'a cura di C. Tolkien', ed:[
      { l:'Bompiani · rilegata', owned:true },
      { l:'The Silmarillion · illustrato', owned:false },
      { l:'Das Silmarillion · tedesca', owned:false },
    ]},
    { id:'incompiuti', t:'Racconti incompiuti', a:'a cura di C. Tolkien', ed:[
      { l:'Bompiani', owned:true },
      { l:'Unfinished Tales · illustrata', owned:false },
    ]},
    { id:'beren', t:'Beren e Lúthien', a:'a cura di C. Tolkien', ed:[
      { l:'Bompiani · illustr. Alan Lee', owned:true },
      { l:'Prima ed. inglese, rilegata', owned:false },
    ]},
    { id:'hurin', t:'I figli di Húrin', a:'a cura di C. Tolkien', ed:[
      { l:'Bompiani', owned:true },
      { l:'The Children of Húrin · illustr.', owned:false },
    ]},
    { id:'gondolin', t:'La caduta di Gondolin', a:'a cura di C. Tolkien', ed:[
      { l:'Bompiani · illustr. Alan Lee', owned:false },
      { l:'The Fall of Gondolin · deluxe', owned:false },
    ]},
    { id:'perduti', t:'Il libro dei racconti perduti', a:'History of Middle-earth', ed:[
      { l:'Volume I · ed. italiana', owned:false },
      { l:'Volume II · ed. italiana', owned:false },
    ]},
    { id:'lettere', t:'Le lettere di Tolkien', a:'a cura di H. Carpenter', ed:[
      { l:'Bompiani · ed. ampliata 2023', owned:false },
    ]},
    { id:'albero', t:'Albero e foglia', a:'J.R.R. Tolkien', ed:[
      { l:'Bompiani', owned:true },
      { l:'Tree and Leaf · inglese', owned:false },
    ]},
    { id:'roverandom', t:'Roverandom', a:'J.R.R. Tolkien', ed:[
      { l:'Bompiani', owned:true },
    ]},
    { id:'bombadil', t:'Le avventure di Tom Bombadil', a:'J.R.R. Tolkien', ed:[
      { l:'Bompiani · illustrata', owned:false },
    ]},
    { id:'gawain', t:'Sir Gawain e il Cavaliere Verde', a:'trad. J.R.R. Tolkien', ed:[
      { l:'Edizione italiana', owned:false },
    ]},
    { id:'natale', t:'Le lettere di Babbo Natale', a:'J.R.R. Tolkien', ed:[
      { l:'Bompiani · ed. completa', owned:true },
    ]},
  ];

  /* ---------------- glyphs ---------------- */
  function Diamond({ size=11, color, filled }) {
    const c = color || GOLD;
    return (
      <svg width={size} height={size} viewBox="0 0 12 12" style={{ flexShrink:0 }}>
        <path d="M6 0.5 L11.5 6 L6 11.5 L0.5 6 Z" fill={filled ? c : 'none'} stroke={c} strokeWidth="1.1" />
      </svg>
    );
  }
  function Check({ size=12, color }) {
    const c = color || GOLD;
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" style={{ flexShrink:0 }}>
        <path d="M2 7.4 L5.4 11 L12 2.6" fill="none" stroke={c} strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  /* ---------------- small round icon (hover row actions) ---------------- */
  function RowAction({ title, onClick, children }) {
    const [h, setH] = React.useState(false);
    return (
      <button
        title={title}
        onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{
          width:24, height:24, padding:0, borderRadius:'50%',
          display:'flex', alignItems:'center', justifyContent:'center',
          background: h ? 'rgba(216,180,106,0.18)' : 'rgba(8,10,7,0.7)',
          border:'1px solid '+(h ? 'rgba(216,180,106,0.7)' : 'rgba(232,220,192,0.3)'),
          color: h ? GOLD : 'rgba(232,220,192,0.85)', cursor:'pointer',
          backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', transition:'all .15s ease',
        }}>
        {children}
      </button>
    );
  }

  /* ---------------- virtual top entries (Tutti / Desiderata) ---------------- */
  const VIRTUAL = [
    { id:'__tutti__',      t:'Tutti i libri',  isVirtual:true },
    { id:'__desiderata__', t:'Desiderata',      isVirtual:true },
  ];

  /* ---------------- left title/shelf row ---------------- */
  function TKJTitleRow({ entry, selected, onClick }) {
    const [hover, setHover] = React.useState(false);
    const isVirtual = !!entry.isVirtual;
    const allDes = !isVirtual && entry.ed.every(e => !e.owned);
    const size = selected ? 25 : 15.5;
    const col = selected ? CREAM : hover ? 'rgba(232,220,192,0.92)' : 'rgba(232,220,192,0.6)';
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position:'relative', display:'grid', gridTemplateColumns:'1fr 28px',
          alignItems:'center', cursor:'pointer', padding:'5px 0', userSelect:'none',
        }}>

        {/* hover actions — only for real book entries */}
        {!isVirtual && (
          <div style={{
            position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
            display:'flex', gap:6, opacity: hover ? 1 : 0, pointerEvents: hover ? 'auto' : 'none',
            transition:'opacity .15s ease', zIndex:4,
          }}>
            <RowAction title="Sposta scaffale">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1 L5.5 10 M3 3 L5.5 0.7 L8 3 M3 8 L5.5 10.3 L8 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </RowAction>
            <RowAction title="Modifica scaffale">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M8.4 1.6 L10.4 3.6 L4 10 L1.6 10.4 L2 8 Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
              </svg>
            </RowAction>
            <RowAction title="Elimina scaffale">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 1.5 L8.5 8.5 M8.5 1.5 L1.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </RowAction>
          </div>
        )}

        <div style={{
          textAlign:'right', fontFamily:SERIF_CAPS, textTransform:'uppercase',
          letterSpacing: selected ? '0.03em' : '0.07em', fontSize:size,
          fontWeight: selected ? 600 : 500, color:col, lineHeight:1.12,
          transition:'font-size .22s ease, color .18s ease, letter-spacing .22s ease',
          textShadow: selected ? '0 2px 12px rgba(0,0,0,0.75)' : '0 1px 4px rgba(0,0,0,0.65)',
        }}>{entry.t}</div>

        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', position:'relative' }}>
          <span style={{
            width: selected ? 2 : 1.5, height: selected ? 22 : 13,
            background: selected ? GOLD : hover ? 'rgba(232,220,192,0.7)' : 'rgba(232,220,192,0.4)',
            boxShadow: selected ? '0 0 8px rgba(216,180,106,0.6)' : 'none', transition:'all .2s ease',
          }} />
          {(isVirtual && entry.id === '__desiderata__' && !selected) && (
            <span style={{
              position:'absolute', right:1, width:5, height:5, transform:'rotate(45deg)',
              border:'1px solid rgba(192,83,59,0.75)',
            }} />
          )}
          {(!isVirtual && allDes && !selected) && (
            <span style={{
              position:'absolute', right:1, width:5, height:5, transform:'rotate(45deg)',
              border:'1px solid rgba(192,83,59,0.75)',
            }} />
          )}
        </div>
      </div>
    );
  }

  /* ---------------- gold corner ornament ---------------- */
  function TKJCorner({ pos }) {
    const base = { position:'absolute', width:26, height:26, pointerEvents:'none' };
    const place = {
      tl:{ top:-1, left:-1 }, tr:{ top:-1, right:-1, transform:'scaleX(-1)' },
      bl:{ bottom:-1, left:-1, transform:'scaleY(-1)' }, br:{ bottom:-1, right:-1, transform:'scale(-1,-1)' },
    }[pos];
    return (
      <svg viewBox="0 0 26 26" style={{ ...base, ...place }}>
        <path d="M0 9 L0 0 L9 0" stroke={GOLD} strokeWidth="1.3" fill="none" />
        <path d="M3 12 L12 3" stroke={GOLD} strokeWidth="0.8" fill="none" opacity="0.5" />
        <path d="M6.5 2.5 L8 4 L6.5 5.5 L5 4 Z" fill={GOLD} opacity="0.9" />
      </svg>
    );
  }

  /* ---------------- torn parchment banner ---------------- */
  function TKJBanner({ title, eyebrow }) {
    const grain = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.36  0 0 0 0 0.28  0 0 0 0 0.16  0 0 0 0.4 0"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>'
    ) + '")';
    return (
      <div style={{ position:'relative', display:'inline-block', maxWidth:600 }}>
        <div style={{
          position:'relative', padding:'14px 44px 17px',
          background:'linear-gradient(176deg, #ece1c6 0%, #ddceaa 52%, #cdbb91 100%)',
          clipPath:'polygon(2.5% 16%, 7% 0%, 38% 7%, 62% 1%, 94% 6%, 99% 26%, 98% 70%, 95% 100%, 60% 93%, 34% 99%, 6% 92%, 1% 64%)',
          boxShadow:'0 14px 30px rgba(0,0,0,0.55), 0 2px 0 rgba(0,0,0,0.2)',
        }}>
          <div style={{ position:'absolute', inset:0, opacity:0.5, mixBlendMode:'multiply', backgroundImage:grain }} />
          {eyebrow && (
            <div style={{
              position:'relative', fontFamily:SERIF_CAPS, textTransform:'uppercase',
              letterSpacing:'0.3em', fontSize:9.5, color:'rgba(74,46,22,0.62)',
              textAlign:'center', marginBottom:5,
            }}>{eyebrow}</div>
          )}
          <div style={{
            position:'relative', fontFamily:SERIF_CAPS, textTransform:'uppercase',
            letterSpacing:'0.05em', fontSize:22, fontWeight:600, color:'#3a2410',
            textAlign:'center', lineHeight:1.04, textShadow:'0 1px 0 rgba(255,255,255,0.35)',
          }}>{title}</div>
        </div>
      </div>
    );
  }

  /* ---------------- footer action button (icon only) ---------------- */
  function FooterBtn({ title, onClick, primary, children }) {
    const [h, setH] = React.useState(false);
    return (
      <button
        title={title}
        onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{
          width:38, height:38, padding:0, borderRadius:'50%',
          display:'flex', alignItems:'center', justifyContent:'center',
          background: primary
            ? (h ? 'rgba(216,180,106,0.22)' : 'rgba(216,180,106,0.13)')
            : (h ? 'rgba(216,180,106,0.12)' : 'rgba(8,10,7,0.5)'),
          border:'1px solid '+(primary ? 'rgba(216,180,106,0.65)' : (h ? 'rgba(216,180,106,0.5)' : 'rgba(232,220,192,0.28)')),
          color: primary || h ? GOLD : CREAM, cursor:'pointer',
          backdropFilter:'blur(5px)', WebkitBackdropFilter:'blur(5px)', transition:'all .15s ease',
        }}>
        {children || (
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <path d="M6 1.5 L6 10.5 M1.5 6 L10.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>
    );
  }

  /* ---------------- default scene art (hidden once a bg image is dropped) ---------------- */
  function TKJScene() {
    return (
      <div style={{ position:'absolute', inset:0, zIndex:0, opacity:0.5, filter:'blur(2px)' }}>
        <svg viewBox="0 0 1280 880" preserveAspectRatio="xMidYMax slice"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
          <g fill="rgba(14,20,15,0.85)">
            <path d="M0,640 L60,470 L120,640 Z" />
            <path d="M150,640 L210,500 L270,640 Z" />
            <path d="M900,660 L980,460 L1060,660 Z" />
            <path d="M1080,660 L1150,510 L1220,660 Z" />
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

  /* ---------------- atmosphere overlay (always on) ---------------- */
  function TKJAtmosphere() {
    const grain = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.7  0 0 0 0 0.72  0 0 0 0 0.66  0 0 0 0.35 0"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>'
    ) + '")';
    return (
      <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', overflow:'hidden' }}>
        <style>{`
          @keyframes tkj-fogA { 0%{transform:translateX(-4%) translateY(0)} 50%{transform:translateX(4%) translateY(-2%)} 100%{transform:translateX(-4%) translateY(0)} }
          @keyframes tkj-fogB { 0%{transform:translateX(3%)} 50%{transform:translateX(-5%)} 100%{transform:translateX(3%)} }
        `}</style>
        <div style={{ position:'absolute', inset:'-10%', animation:'tkj-fogA 38s ease-in-out infinite',
          background:'radial-gradient(60% 40% at 30% 78%, rgba(190,200,185,0.10), transparent 60%),'+
                     'radial-gradient(70% 36% at 75% 86%, rgba(170,185,175,0.09), transparent 62%)' }} />
        <div style={{ position:'absolute', inset:'-10%', animation:'tkj-fogB 52s ease-in-out infinite',
          background:'radial-gradient(80% 30% at 50% 96%, rgba(200,205,195,0.12), transparent 64%)' }} />
        <div style={{ position:'absolute', inset:0, background:
          'linear-gradient(90deg, rgba(4,6,4,0.6) 0%, rgba(4,6,4,0.1) 28%, transparent 46%),'+
          'linear-gradient(180deg, rgba(4,6,4,0.5) 0%, transparent 16%, transparent 82%, rgba(4,6,4,0.55) 100%)' }} />
        <div style={{ position:'absolute', inset:0, opacity:0.45, mixBlendMode:'overlay', backgroundImage:grain }} />
        <div style={{ position:'absolute', inset:0,
          background:'radial-gradient(130% 110% at 50% 38%, transparent 44%, rgba(4,6,4,0.72) 100%)' }} />
      </div>
    );
  }

  /* ---------------- one edition cover ---------------- */
  function EditionCover({ work, edition, pal }) {
    return (
      <div style={{ position:'relative' }}>
        <window.CineBook title={work.t} author={edition.l} w={164} h={236} palette={pal} />
        {/* status badge on the cover */}
        <div style={{
          position:'absolute', top:9, right:9, width:24, height:24, borderRadius:'50%',
          display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(8,11,8,0.72)',
          border:'1px solid '+(edition.owned ? 'rgba(216,180,106,0.7)' : 'rgba(192,83,59,0.8)'),
          backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)',
        }}>
          {edition.owned ? <Check size={12} color={GOLD} /> : <Diamond size={10} color={VERM} />}
        </div>
      </div>
    );
  }

  /* ---------------- cambia-sfondo button (icon; label on hover) ---------------- */
  function CambiaSfondoBtn({ onClick }) {
    const [h, setH] = React.useState(false);
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        title="Cambia sfondo"
        style={{
          display:'inline-flex', alignItems:'center', gap: h ? 9 : 0,
          padding:'0 12px', height:36,
          overflow:'hidden',
          background:'rgba(8,10,7,0.5)',
          border:'1px solid '+(h ? 'rgba(216,180,106,0.5)' : 'rgba(232,220,192,0.28)'),
          color: h ? GOLD : CREAM, cursor:'pointer',
          backdropFilter:'blur(5px)', WebkitBackdropFilter:'blur(5px)',
          transition:'all .18s ease',
        }}>
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0 }}>
          <rect x="1.2" y="2.4" width="11.6" height="9.2" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="4.6" cy="5.4" r="1.1" fill="currentColor" />
          <path d="M1.4 10.4 L5 7 L7.6 9.4 L9.6 7.6 L12.6 10.6" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
        </svg>
        <span style={{
          fontFamily:SERIF_CAPS, textTransform:'uppercase', letterSpacing:'0.16em',
          fontSize:11, fontWeight:600, whiteSpace:'nowrap',
          maxWidth: h ? 120 : 0, opacity: h ? 1 : 0,
          overflow:'hidden', transition:'max-width .18s ease, opacity .18s ease',
        }}>Cambia sfondo</span>
      </button>
    );
  }

  /* ============================================================
     main screen
     ============================================================ */
  function CineCollezioneTolkien() {
    const [selId, setSelId] = React.useState('__tutti__');

    /* resolve what to show on the right based on selId */
    const ALL_ENTRIES = [...VIRTUAL, ...TK_WORKS];
    const selEntry = ALL_ENTRIES.find(e => e.id === selId) || ALL_ENTRIES[0];

    /* flat list of {work, edition, pal} to display as covers */
    const displayEditions = React.useMemo(() => {
      if (selId === '__tutti__') {
        return TK_WORKS.flatMap((w, wi) =>
          w.ed
            .filter(ed => ed.owned)
            .map((ed, j) => ({ work:w, edition:ed, pal:PALETTES[(wi*3+j) % PALETTES.length] }))
        );
      }
      if (selId === '__desiderata__') {
        return TK_WORKS.flatMap((w, wi) =>
          w.ed
            .filter(ed => !ed.owned)
            .map((ed, j) => ({ work:w, edition:ed, pal:PALETTES[(wi*3+j) % PALETTES.length] }))
        );
      }
      const w = TK_WORKS.find(x => x.id === selId);
      if (!w) return [];
      const wi = TK_WORKS.indexOf(w);
      return w.ed.map((ed, j) => ({ work:w, edition:ed, pal:PALETTES[(wi*3+j) % PALETTES.length] }));
    }, [selId]);

    const ownedCount = displayEditions.filter(x => x.edition.owned).length;
    const bannerTitle = selEntry.t;
    const bannerEyebrow = selId === '__tutti__'
      ? `${ownedCount} ${ownedCount === 1 ? 'edizione posseduta' : 'edizioni possedute'} · ${TK_WORKS.length} titoli`
      : selId === '__desiderata__'
      ? `${displayEditions.length} ${displayEditions.length === 1 ? 'edizione' : 'edizioni'} da trovare`
      : `${displayEditions.length} ${displayEditions.length === 1 ? 'edizione' : 'edizioni'}`;

    const pickBg = () => {
      const slot = document.getElementById(BG_SLOT_ID);
      if (!slot || !slot.shadowRoot) return;
      const input = slot.shadowRoot.querySelector('input[type="file"]');
      if (input) input.click();
    };

    return (
      <div style={{
        width:1280, height:880, position:'relative', overflow:'hidden',
        background:'linear-gradient(168deg, #1a201b 0%, #141914 40%, #0c0f0c 100%)',
        color:CREAM, fontFamily:BODY,
      }}>
        <TKJScene />
        <image-slot
          id={BG_SLOT_ID} shape="rect" fit="cover"
          placeholder="Trascina qui uno sfondo per la collezione Tolkien"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:0 }}
        />
        <TKJAtmosphere />

        {/* back orb */}
        <button title="Torna alle collezioni" style={{
          position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
          width:40, height:40, borderRadius:'50%', zIndex:5,
          display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(8,10,7,0.5)', border:'1px solid rgba(232,220,192,0.28)',
          color:CREAM, cursor:'pointer', backdropFilter:'blur(5px)', WebkitBackdropFilter:'blur(5px)',
        }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M11.5 4 L5.5 10 L11.5 16 M5.5 10 L16 10" stroke="currentColor"
              strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* ---- TOP ---- */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:60, zIndex:4,
          display:'flex', alignItems:'center', padding:'0 28px 0 64px',
          background:'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)',
        }}>
          <div style={{
            fontFamily:SERIF_CAPS, textTransform:'uppercase', letterSpacing:'0.26em',
            fontSize:13, color:CREAM, fontWeight:600,
          }}>Collezione Tolkien</div>
          <span style={{ width:1, height:18, background:'rgba(216,180,106,0.3)', margin:'0 16px' }} />
          <div style={{ fontFamily:BODY, fontStyle:'italic', fontSize:13.5, color:'rgba(232,220,192,0.6)' }}>
            J.R.R. Tolkien · {TK_WORKS.length} scaffali
          </div>
          <div style={{ flex:1 }} />
          <CambiaSfondoBtn onClick={pickBg} />
        </div>

        {/* ---- BODY ---- */}
        <div style={{
          position:'absolute', top:60, left:0, right:0, bottom:60, zIndex:3,
          display:'flex', alignItems:'stretch',
        }}>
          {/* left titles (shifted left, narrower) */}
          <div style={{
            width:332, flexShrink:0, position:'relative', paddingLeft:60,
            display:'flex', flexDirection:'column', justifyContent:'center',
          }}>
            <div style={{
              position:'absolute', right:22, top:40, bottom:40, width:1,
              background:'linear-gradient(180deg, transparent, rgba(232,220,192,0.16) 10%, rgba(232,220,192,0.16) 90%, transparent)',
            }} />
            <div style={{
              display:'flex', flexDirection:'column', gap:3, maxHeight:'100%', overflowY:'auto', paddingRight:8,
              maskImage:'linear-gradient(180deg, transparent, #000 6%, #000 94%, transparent)',
              WebkitMaskImage:'linear-gradient(180deg, transparent, #000 6%, #000 94%, transparent)',
            }}>
              <div style={{ minHeight:10 }} />
              {[...VIRTUAL, ...TK_WORKS].map(entry => (
                <TKJTitleRow key={entry.id} entry={entry} selected={entry.id === selId} onClick={() => setSelId(entry.id)} />
              ))}
              <div style={{ minHeight:10 }} />
            </div>
          </div>

          {/* right covers panel */}
          <div style={{ flex:1, position:'relative', padding:'50px 56px 18px 26px' }}>
            <div style={{ position:'relative', height:'100%' }}>
              <div style={{ position:'absolute', top:-30, left:20, zIndex:3 }}>
                <TKJBanner eyebrow={bannerEyebrow} title={bannerTitle} />
              </div>

              <div style={{
                position:'absolute', inset:0, border:'1px solid rgba(216,180,106,0.42)',
                background:'rgba(8,11,8,0.5)', backdropFilter:'blur(7px)', WebkitBackdropFilter:'blur(7px)',
                boxShadow:'0 24px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.3)',
              }}>
                <div style={{ position:'absolute', inset:5, border:'1px solid rgba(216,180,106,0.14)', pointerEvents:'none' }} />
                <TKJCorner pos="tl" /><TKJCorner pos="tr" /><TKJCorner pos="bl" /><TKJCorner pos="br" />

                <div style={{ position:'absolute', inset:0, overflowY:'auto', padding:'52px 48px 36px' }}>
                  {/* header: tally */}
                  <div style={{
                    display:'flex', alignItems:'center', justifyContent:'flex-end', gap:16,
                    marginBottom:26, paddingBottom:16, borderBottom:'1px solid rgba(216,180,106,0.16)',
                  }}>
                    {selEntry.a && (
                      <span style={{ fontFamily:BODY, fontStyle:'italic', fontSize:16, color:'rgba(232,220,192,0.8)', flex:1 }}>
                        {selEntry.a}
                      </span>
                    )}
                    <span style={{ display:'inline-flex', alignItems:'center', gap:9,
                      fontFamily:SERIF_CAPS, textTransform:'uppercase', letterSpacing:'0.16em',
                      fontSize:11, color:'rgba(232,220,192,0.6)' }}>
                      <Check size={12} color={GOLD} /> {ownedCount} possedute
                      <span style={{ color:'rgba(216,180,106,0.3)' }}>·</span>
                      <Diamond size={9} color={VERM} /> {displayEditions.length - ownedCount} desiderate
                    </span>
                  </div>

                  {/* edition covers in columns */}
                  <div style={{
                    display:'grid', gridTemplateColumns:'repeat(4, 164px)', gap:'34px 26px', justifyContent:'start',
                  }}>
                    {displayEditions.map((item, j) => (
                      <EditionCover key={item.work.id+'-'+j} work={item.work} edition={item.edition} pal={item.pal} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- FOOTER: actions only ---- */}
        <div style={{
          position:'absolute', left:0, right:0, bottom:0, height:60, zIndex:4,
          display:'flex', alignItems:'center', justifyContent:'flex-end', gap:16,
          padding:'0 56px', background:'linear-gradient(0deg, rgba(0,0,0,0.5), transparent)',
        }}>
          <FooterBtn title="Nuovo scaffale" />
          <FooterBtn title="Nuovo libro" primary />
        </div>
      </div>
    );
  }

  window.CineCollezioneTolkien = CineCollezioneTolkien;
})();
