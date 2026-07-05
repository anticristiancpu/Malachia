/* Cinematic screens, part 3:
   - Scaffali           (collections overview)
   - Collezione Tolkien (single collection detail)
   - Annales            (statistics dashboard with sub-tabs)
*/

/* small Tolkien-tengwar-style rune (decorative) */
function TolkienRune({size=42, color}) {
  const c = color || CINE_GOLD;
  return (
    <svg width={size} height={size*1.15} viewBox="0 0 42 48" fill="none">
      {/* central stem */}
      <line x1="21" y1="4" x2="21" y2="44" stroke={c} strokeWidth="1.4"/>
      {/* horizontal bar */}
      <line x1="6" y1="14" x2="36" y2="14" stroke={c} strokeWidth="1.4"/>
      {/* angled flourishes */}
      <path d="M21 24 L9 36 M21 24 L33 36" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      {/* top diamond */}
      <path d="M21 0 L25 4 L21 8 L17 4 Z" fill={c}/>
      {/* bottom diamond */}
      <path d="M21 40 L24 44 L21 48 L18 44 Z" fill={c}/>
      {/* dots */}
      <circle cx="6" cy="14" r="1.5" fill={c}/>
      <circle cx="36" cy="14" r="1.5" fill={c}/>
    </svg>
  );
}

/* ============================================================
   1) SCAFFALI — collections overview
   ============================================================ */
function CineScaffali() {
  return (
    <CinematicShell active="Scaffali">
      <div style={{padding:'40px 64px 24px', height:'100%', overflow:'auto', display:'flex', flexDirection:'column', gap:36}}>
        <CinePageTitle
          eyebrow="Capitulum IV"
          title="Scaffali"
          em="& collezioni"
          right={
            <CineSmallBtn primary icon={
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 2 L5.5 9 M2 5.5 L9 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            }>Nuovo scaffale</CineSmallBtn>
          }
        />

        {/* Collezioni di riferimento */}
        <div>
          <CineSectionRule title="Collezioni di riferimento"/>

          <div style={{
            position:'relative',
            background:'linear-gradient(90deg, rgba(20,14,7,0.85) 0%, rgba(20,14,7,0.55) 45%, rgba(20,14,7,0.2) 100%)',
            border:'1px solid rgba(216,180,106,0.28)',
            padding:'28px 32px',
            display:'flex', alignItems:'center', gap:24,
            overflow:'hidden',
            minHeight:130,
          }}>
            {/* Tolkien-themed decorative silhouette on right */}
            <svg viewBox="0 0 600 130" preserveAspectRatio="none"
                 style={{position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.22, pointerEvents:'none'}}>
              <defs>
                <linearGradient id="mountains" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgba(232,220,192,0)"/>
                  <stop offset="1" stopColor="rgba(232,220,192,0.35)"/>
                </linearGradient>
              </defs>
              {/* mountain silhouette */}
              <path d="M 250 130 L 290 60 L 330 90 L 370 30 L 420 80 L 470 50 L 520 95 L 600 70 L 600 130 Z"
                    fill="url(#mountains)"/>
              {/* tower on the right */}
              <path d="M 560 130 L 560 85 L 565 85 L 565 75 L 568 70 L 571 75 L 571 85 L 576 85 L 576 130 Z"
                    fill="rgba(232,220,192,0.4)"/>
              {/* twisty branches */}
              <g stroke="rgba(232,220,192,0.4)" strokeWidth="1" fill="none">
                <path d="M 160 0 Q 200 20 230 10 Q 270 40 320 30 Q 380 10 440 25"/>
                <path d="M 220 0 Q 240 25 280 18 Q 330 32 380 20"/>
              </g>
            </svg>

            <TolkienRune size={56}/>
            <div style={{flex:1, position:'relative', zIndex:2}}>
              <div style={{
                fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase',
                letterSpacing:'0.28em', fontSize:11, color:'rgba(232,220,192,0.75)',
              }}>Canone · edizioni italiane</div>
              <div style={{
                fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif",
                fontSize:30, fontWeight:600, color:CINE_CREAM, letterSpacing:'0.04em',
                textTransform:'uppercase', marginTop:4,
                textShadow:'0 1px 0 rgba(0,0,0,0.65)',
              }}>J.R.R. Tolkien</div>
              <div style={{
                fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:14,
                color:'rgba(232,220,192,0.88)', marginTop:6,
              }}>22 opere · Bompiani, Rusconi, Mondadori</div>
            </div>
            <div style={{textAlign:'right', position:'relative', zIndex:2}}>
              <div className="m-nums" style={{
                fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif", fontSize:56, fontWeight:500,
                color:CINE_GOLD, lineHeight:1, letterSpacing:'0.02em',
              }}>14</div>
              <div style={{
                fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:11,
                color:'rgba(232,220,192,0.82)', marginTop:2,
              }}>volumi posseduti</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{color:CINE_GOLD, opacity:0.7, position:'relative', zIndex:2}}>
              <path d="M5 2 L11 8 L5 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
        </div>

        {/* I tuoi scaffali */}
        <div>
          <CineSectionRule title="I tuoi scaffali"/>

          <div style={{
            fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:14,
            color:'rgba(232,220,192,0.75)', marginBottom:18,
          }}>
            Nessuno scaffale — creane uno con il pulsante in alto
          </div>

          <div style={{
            display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24,
          }}>
            <div style={{
              border:'1px dashed rgba(216,180,106,0.4)',
              padding:'48px 24px',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:10, minHeight:200,
              background:'rgba(20,14,7,0.25)',
              backdropFilter:'blur(2px)',
            }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 8 L20 32 M8 20 L32 20" stroke={CINE_GOLD} strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <div style={{
                fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase',
                letterSpacing:'0.18em', fontSize:13, color:CINE_CREAM, fontWeight:600, marginTop:6,
              }}>Nuovo scaffale</div>
              <div style={{
                fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:12,
                color:'rgba(232,220,192,0.75)', textAlign:'center', maxWidth:200, lineHeight:1.4,
              }}>Raggruppa volumi per tema, autore o capriccio</div>
            </div>
          </div>
        </div>
      </div>
    </CinematicShell>
  );
}

/* ============================================================
   2) COLLEZIONE TOLKIEN — single collection detail
   ============================================================ */
function CineCollezioneTolkien() {
  const desiderata = [
    {t:'The Silmarillion', a:'J.R.R. Tolkien', p:1},
    {t:'The Hobbit: Illustrated', a:'J.R.R. Tolkien', p:6},
    {t:'The Hobbit', a:'J.R.R. Tolkien', p:7},
    {t:'Il Signore degli Anelli (Illustr.)', a:'J.R.R. Tolkien', p:4},
    {t:'Il Silmarillion (Illustr.)', a:'J.R.R. Tolkien', p:1},
  ];
  const owned = [
    {t:'The Lord of the Rings', a:'J.R.R. Tolkien', p:4},
    {t:'The Hobbit', a:'J.R.R. Tolkien', p:7},
    {t:'The Silmarillion', a:'J.R.R. Tolkien', p:1},
    {t:'Lo Hobbit o la riconquista del Tesoro', a:'J.R.R. Tolkien', p:0},
    {t:'Il cacciatore di draghi', a:'J.R.R. Tolkien', p:5},
    {t:'Beren e Lúthien', a:'J.R.R. Tolkien', p:2},
    {t:'Racconti perduti', a:'J.R.R. Tolkien', p:3},
    {t:'Il Silmarillion', a:'J.R.R. Tolkien', p:1},
    {t:'Racconti ritrovati', a:'J.R.R. Tolkien', p:7},
    {t:'Nachrichten aus Mittelerde', a:'J.R.R. Tolkien', p:2},
    {t:'Die Gefährten', a:'J.R.R. Tolkien', p:6},
    {t:'Die zwei Türme', a:'J.R.R. Tolkien', p:6},
    {t:'Die Rückkehr des Königs', a:'J.R.R. Tolkien', p:6},
    {t:'La Compagnia dell\u2019Anello', a:'J.R.R. Tolkien', p:4},
  ];

  return (
    <CinematicShell active="Scaffali">
      <div style={{height:'100%', overflow:'auto', position:'relative'}}>
        {/* HERO — Tolkien atmospheric strip */}
        <div style={{
          position:'relative', height:280, overflow:'hidden',
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 40%, rgba(10,7,4,0.95) 100%),' +
            'linear-gradient(90deg, rgba(10,7,4,0.2) 0%, rgba(10,7,4,0) 50%, rgba(10,7,4,0.4) 100%),' +
            'linear-gradient(135deg, #1a1208 0%, #0a0704 100%)',
          borderBottom:'1px solid rgba(216,180,106,0.18)',
        }}>
          {/* Mordor-ish silhouette */}
          <svg viewBox="0 0 1280 280" preserveAspectRatio="none"
               style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
            {/* distant mountains */}
            <path d="M 0 200 L 80 130 L 130 170 L 180 100 L 240 150 L 300 90 L 360 140
                     L 430 60 L 500 130 L 570 90 L 640 160 L 720 110 L 800 170
                     L 870 120 L 950 180 L 1030 130 L 1110 180 L 1180 140 L 1280 190 L 1280 280 L 0 280 Z"
                  fill="rgba(10,7,4,0.85)" opacity="0.7"/>
            {/* closer mountains */}
            <path d="M 0 240 L 100 180 L 200 230 L 320 170 L 440 220 L 560 180 L 700 235
                     L 840 190 L 980 240 L 1130 200 L 1280 250 L 1280 280 L 0 280 Z"
                  fill="#06040200" stroke="rgba(232,220,192,0.05)" strokeWidth="0.5"/>
            {/* twisted branches */}
            <g stroke="rgba(232,220,192,0.18)" strokeWidth="1.2" fill="none">
              <path d="M 0 30 Q 80 50 140 30 Q 220 60 300 40 Q 380 70 460 35 Q 540 60 620 30"/>
              <path d="M 60 8 Q 120 30 180 18 Q 240 38 300 22 Q 360 45 420 25"/>
            </g>
            {/* lone tower silhouette */}
            <g fill="rgba(20,14,7,0.95)">
              <path d="M 1080 280 L 1080 130 L 1090 130 L 1090 100 L 1095 90 L 1100 100 L 1100 130 L 1110 130 L 1110 280 Z"/>
              <circle cx="1095" cy="110" r="3" fill="rgba(255,200,120,0.7)"/>
              <circle cx="1095" cy="110" r="6" fill="rgba(255,200,120,0.2)"/>
            </g>
            {/* falling embers */}
            <g fill="rgba(255,200,120,0.5)">
              {[0,1,2,3,4,5,6,7].map(i=>(
                <circle key={i} cx={400 + i*65} cy={120 + (i%3)*30} r={0.8 + (i%3)*0.4} opacity={0.4 + (i%4)*0.15}/>
              ))}
            </g>
          </svg>

          {/* "Carica" upload hint top-right */}
          <div style={{position:'absolute', top:16, right:24, display:'flex', alignItems:'center', gap:8}}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{color:CINE_CREAM, opacity:0.6}}>
              <path d="M6.5 9 L6.5 2 M3.5 5 L6.5 2 L9.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <span style={{
              fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase',
              letterSpacing:'0.18em', fontSize:11, color:'rgba(232,220,192,0.82)',
            }}>Carica</span>
          </div>

          {/* crest + title bottom-left */}
          <div style={{position:'absolute', left:64, bottom:32, display:'flex', alignItems:'flex-end', gap:22}}>
            <TolkienRune size={72}/>
            <div>
              <div style={{
                fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase',
                letterSpacing:'0.28em', fontSize:11, color:'rgba(232,220,192,0.82)',
              }}>Canone · edizioni mondiali</div>
              <div style={{
                fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif", fontSize:42, fontWeight:600,
                color:CINE_CREAM, letterSpacing:'0.04em', textTransform:'uppercase',
                lineHeight:1.05, marginTop:6,
                textShadow:'0 2px 4px rgba(0,0,0,0.8)',
              }}>J.R.R. Tolkien</div>
            </div>
          </div>

          <div style={{position:'absolute', right:24, bottom:18,
            fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:11,
            color:'rgba(232,220,192,0.45)',
          }}>‡ trascina per riposizionare</div>
        </div>

        {/* Body */}
        <div style={{padding:'24px 64px 36px', display:'flex', flexDirection:'column', gap:30}}>
          <div>
            <CineSmallBtn icon={
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M7 1 L3 5 L7 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            }>Collezioni</CineSmallBtn>
          </div>

          {/* Desiderata sub-section */}
          <div>
            <div style={{
              display:'flex', alignItems:'baseline', justifyContent:'space-between',
              borderBottom:'1px solid rgba(216,180,106,0.18)', paddingBottom:10, marginBottom:18,
            }}>
              <div style={{display:'flex', alignItems:'baseline', gap:14}}>
                <TolkienRune size={20}/>
                <span style={{
                  fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif", fontSize:24, fontWeight:600,
                  color:CINE_CREAM, letterSpacing:'0.04em', textTransform:'uppercase',
                }}>Desiderata</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <span style={{
                  fontFamily:"'Mantinia', 'Cinzel', serif", fontSize:11, letterSpacing:'0.18em',
                  color:'rgba(232,220,192,0.75)', textTransform:'uppercase',
                }}>5 volumi</span>
                <CineSmallBtn icon={<span style={{fontSize:11}}>+</span>}>Aggiungi</CineSmallBtn>
                <CineSmallBtn icon={<span style={{fontSize:11}}>✎</span>}>Rinomina</CineSmallBtn>
                <CineSmallBtn icon={<span style={{fontSize:11}}>×</span>}>Nascondi</CineSmallBtn>
              </div>
            </div>
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'24px 18px',
            }}>
              {desiderata.map((b, i) => (
                <CineBook key={i} title={b.t} author={b.a} w={120} h={170}
                  palette={BOOK_PALETTES[b.p % BOOK_PALETTES.length]}/>
              ))}
            </div>
            <div style={{marginTop:16}}>
              <CineSmallBtn icon={<span style={{fontSize:11}}>+</span>}>Sottocategoria</CineSmallBtn>
            </div>
          </div>

          {/* Nella tua libreria */}
          <div>
            <div style={{
              display:'flex', alignItems:'baseline', justifyContent:'space-between',
              borderBottom:'1px solid rgba(216,180,106,0.18)', paddingBottom:10, marginBottom:18,
            }}>
              <div style={{display:'flex', alignItems:'baseline', gap:14}}>
                <TolkienRune size={20}/>
                <span style={{
                  fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif", fontSize:24, fontWeight:600,
                  color:CINE_CREAM, letterSpacing:'0.04em', textTransform:'uppercase',
                }}>Nella tua libreria</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <span style={{
                  fontFamily:"'Mantinia', 'Cinzel', serif", fontSize:11, letterSpacing:'0.18em',
                  color:'rgba(232,220,192,0.75)', textTransform:'uppercase',
                }}>14 volumi</span>
                <CineSmallBtn icon={<span style={{fontSize:11}}>✎</span>}>Rinomina</CineSmallBtn>
              </div>
            </div>
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'24px 18px',
            }}>
              {owned.map((b, i) => (
                <CineBook key={i} title={b.t} author={b.a} w={120} h={170}
                  palette={BOOK_PALETTES[b.p % BOOK_PALETTES.length]}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CinematicShell>
  );
}

/* ============================================================
   3) ANNALES — statistics dashboard
   ============================================================ */
function StatCard({label, big, small, accent, breakdown, wide}) {
  return (
    <div style={{
      background:'rgba(20,14,7,0.55)',
      border:'1px solid rgba(216,180,106,0.18)',
      padding:'18px 22px',
      backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
      minHeight: wide ? 0 : 110,
    }}>
      <div style={{
        fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase',
        letterSpacing:'0.22em', fontSize:10, color:'rgba(232,220,192,0.75)', fontWeight:500,
      }}>{label}</div>
      <div className="m-nums" style={{
        fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif",
        fontSize: wide ? 38 : 48, fontWeight:500,
        color: accent || CINE_CREAM, lineHeight:1.05, marginTop:6,
        letterSpacing:'0.02em',
      }}>{big}</div>
      {small && <div style={{
        fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:12,
        color:'rgba(232,220,192,0.75)', marginTop:6,
      }}>{small}</div>}
      {breakdown && (
        <div style={{display:'flex', gap:18, marginTop:14, paddingTop:12, borderTop:'1px solid rgba(216,180,106,0.12)'}}>
          {breakdown.map(b => (
            <div key={b.l}>
              <div className="m-nums" style={{
                fontFamily:"'Mantinia', 'Cinzel', serif", fontSize:18, fontWeight:500,
                color:b.c, lineHeight:1,
              }}>{b.v}</div>
              <div style={{
                fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase',
                letterSpacing:'0.16em', fontSize:9, color:'rgba(232,220,192,0.5)', marginTop:4,
              }}>{b.l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CineAnnales() {
  const subTabs = [
    {l:'Panoramica', active:true},
    {l:'Libreria'},
    {l:'Lettura'},
    {l:'Autori & Editori'},
    {l:'Scaffali'},
    {l:'Desiderata & Note'},
  ];

  const top10 = [
    {n:1, t:'La filosofia di Marx: studi critici', a:'Giovanni Gentile', e:'€ 250,00'},
    {n:2, t:'Metafisica', a:'Aristotele', e:'€ 85,00'},
    {n:3, t:'Beren e Lúthien', a:'J.R.R. Tolkien', e:'€ 80,00'},
    {n:4, t:'Sculture della Sardegna nuragica', a:'Giovanni Lilliu', e:'€ 79,00'},
    {n:5, t:'Homo sacer. Edizione integrale 1995–2015', a:'Giorgio Agamben', e:'€ 75,00'},
    {n:6, t:'Theodor W. Adorno. Biografia di un intell…', a:'Stefan Müller-Doohm', e:'€ 75,00'},
    {n:7, t:'Cagliari nelle sue stampe', a:'Luigi Piloni', e:'€ 70,00'},
    {n:8, t:'Nietzsche', a:'Michel Foucault', e:'€ 65,00'},
  ];

  return (
    <CinematicShell active="Annales">
      <div style={{padding:'40px 64px 24px', height:'100%', overflow:'auto', display:'flex', flexDirection:'column', gap:24}}>
        <CinePageTitle
          eyebrow="Capitulum VIII"
          title="Annales"
          em="· Bibliotheca"
        />
        <div style={{
          fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:14,
          color:'rgba(232,220,192,0.75)', marginTop:-16,
        }}>Statistiche complete della biblioteca personale</div>

        {/* Sub-tabs */}
        <div style={{
          display:'flex', alignItems:'center', gap:0,
          borderBottom:'1px solid rgba(216,180,106,0.18)',
        }}>
          {subTabs.map((t, i) => (
            <div key={t.l} style={{
              position:'relative',
              padding:'10px 18px',
              fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase',
              letterSpacing:'0.16em', fontSize:12,
              color: t.active ? CINE_CREAM : 'rgba(232,220,192,0.75)',
              fontWeight: t.active ? 600 : 500,
              cursor:'pointer',
              borderBottom: t.active ? '2px solid '+CINE_VERM : '2px solid transparent',
              marginBottom: -1,
            }}>{t.l}</div>
          ))}
        </div>

        {/* Top row of big cards */}
        <div style={{
          display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:16,
        }}>
          <StatCard label="Volumi in collezione" big="543" wide
            breakdown={[
              {l:'Letti', v:'0', c:CINE_GOLD},
              {l:'In lettura', v:'0', c:'#7faecf'},
              {l:'Da leggere', v:'543', c:CINE_CREAM},
              {l:'Abbandonati', v:'0', c:CINE_VERM},
            ]}/>
          <StatCard label="Pagine totali" big="160.607" small="nella collezione"/>
          <StatCard label="Libri letti" big="0" small="su 543 in collezione"/>
          <StatCard label="Autori" big="344" small="103 editori distinti"/>
        </div>

        {/* Second row */}
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:16,
        }}>
          <StatCard label="Scaffali" big="0" small="0 totale assoc."/>
          <StatCard label="Desiderata" big="11" small="libri in lista"/>
          <StatCard label="Note & citazioni" big="0"/>
          <StatCard label="Prestiti attivi" big="0" small="tutto in regola"/>
          <StatCard label="Autori seguiti" big="0"/>
        </div>

        {/* Bottom row: Valore + Top 10 */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr 1.6fr', gap:16,
        }}>
          <StatCard label="Valore totale stimato" big="€ 6.636,44" accent={CINE_GOLD} small="su 543 volumi quotati"/>
          <StatCard label="Valore medio a volume" big="€ 12,22" accent={CINE_GOLD}/>

          {/* Top 10 list card */}
          <div style={{
            background:'rgba(20,14,7,0.55)',
            border:'1px solid rgba(216,180,106,0.18)',
            padding:'18px 22px',
            backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
          }}>
            <div style={{
              fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase',
              letterSpacing:'0.22em', fontSize:10, color:'rgba(232,220,192,0.75)', fontWeight:500,
              marginBottom:14,
            }}>Top 10 · volumi di maggior valore</div>
            <div style={{display:'flex', flexDirection:'column'}}>
              {top10.map(b => (
                <div key={b.n} style={{
                  display:'grid', gridTemplateColumns:'22px 1fr auto',
                  alignItems:'baseline', gap:14,
                  padding:'7px 0',
                  borderBottom:'1px solid rgba(216,180,106,0.08)',
                }}>
                  <span className="m-nums" style={{
                    fontFamily:"'Mantinia', 'Cinzel', serif", fontSize:14, fontWeight:600,
                    color:'rgba(232,220,192,0.45)',
                  }}>{b.n}.</span>
                  <div style={{minWidth:0}}>
                    <div style={{
                      fontFamily:"'Agmena Pro', serif", fontSize:14, color:CINE_CREAM,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>{b.t}</div>
                    <div style={{
                      fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:11,
                      color:'rgba(232,220,192,0.5)', marginTop:1,
                    }}>{b.a}</div>
                  </div>
                  <span className="m-nums" style={{
                    fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif", fontSize:14, fontWeight:500,
                    color:CINE_GOLD, whiteSpace:'nowrap',
                  }}>{b.e}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CinematicShell>
  );
}

window.CineScaffali = CineScaffali;
window.CineCollezioneTolkien = CineCollezioneTolkien;
window.CineAnnales = CineAnnales;
