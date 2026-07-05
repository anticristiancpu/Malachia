/* Cinematic screens, part 2:
   - Libreria      (book grid, full-width)
   - Desiderata    (wishlist grid)
   - Autori        (A-Z list + featured author detail)
   - Editori       (publisher list + featured publisher's collane)
*/

/* ---------- shared helpers ---------- */
function CineSearchBox({placeholder='cerca…'}) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'9px 14px', minWidth:280,
      background:'rgba(0,0,0,0.35)',
      border:'1px solid rgba(232,220,192,0.25)',
      backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
    }}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{color:'rgba(232,220,192,0.75)'}}>
        <circle cx="5.5" cy="5.5" r="3.8" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8.4 8.4 L11.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <span style={{
        fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:14,
        color:'rgba(232,220,192,0.75)',
      }}>{placeholder}</span>
    </div>
  );
}

function CineSmallBtn({children, primary, icon}) {
  return (
    <button style={{
      display:'inline-flex', alignItems:'center', gap:8,
      padding:'8px 14px',
      background: primary ? 'rgba(216,180,106,0.12)' : 'rgba(0,0,0,0.3)',
      border:'1px solid '+(primary ? 'rgba(216,180,106,0.5)' : 'rgba(232,220,192,0.24)'),
      color: primary ? CINE_GOLD : CINE_CREAM,
      fontFamily:"'Mantinia', 'Cinzel', serif",
      textTransform:'uppercase',
      letterSpacing:'0.14em', fontSize:11, fontWeight:500,
      cursor:'pointer', whiteSpace:'nowrap',
      backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
    }}>{icon}{children}</button>
  );
}

function CineChip({label, count, active}) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'baseline', gap:8,
      padding:'5px 12px',
      background: active ? 'rgba(216,180,106,0.14)' : 'transparent',
      border:'1px solid '+(active ? 'rgba(216,180,106,0.55)' : 'rgba(232,220,192,0.2)'),
      color: active ? CINE_CREAM : 'rgba(232,220,192,0.9)',
      fontFamily:"'Mantinia', 'Cinzel', serif",
      textTransform:'uppercase',
      letterSpacing:'0.14em', fontSize:10, fontWeight:500,
      whiteSpace:'nowrap',
    }}>
      <span>{label}</span>
      {count != null && <span style={{color: active ? CINE_GOLD : 'rgba(216,180,106,0.7)'}}>· {count}</span>}
    </span>
  );
}

/* ============================================================
   1) LIBRERIA — book grid view
   ============================================================ */
function CineLibreria() {
  const books = [
    {t:'Paradisi proibiti', a:'Claudio Pescio', p:0},
    {t:'Stato e rivoluzione', a:'V. I. Lenin', p:5},
    {t:'Leggere il Capitale', a:'L. Althusser', p:6},
    {t:'Per Marx', a:'L. Althusser', p:1},
    {t:'Nietzsche', a:'Michel Foucault', p:2},
    {t:'Logica della disgregazione', a:'G. Cherchi', p:7},
    {t:'Adorno', a:'Sergio Moravia', p:1},
    {t:'Il nome della rosa', a:'Umberto Eco', p:5},
    {t:'Representations of the Intellectual', a:'Edward W. Said', p:4},
    {t:'Du contrat social', a:'J.-J. Rousseau', p:8},
    {t:'The Pale King', a:'D. F. Wallace', p:4},
    {t:'De Stijl', a:'Carel Blotkamp', p:3},
    {t:'Werke', a:'Aby Warburg', p:0},
    {t:'Die Rückkehr des Königs', a:'J. R. R. Tolkien', p:6},
    {t:'Die zwei Türme', a:'J. R. R. Tolkien', p:6},
    {t:'Die Gefährten', a:'J. R. R. Tolkien', p:6},
    {t:'The Lord of the Rings', a:'J. R. R. Tolkien', p:4},
    {t:'The Hobbit', a:'J. R. R. Tolkien', p:7},
    {t:'Nachrichten aus Mittelerde', a:'J. R. R. Tolkien', p:2},
    {t:'Il mondo dell\u2019Illuminismo', a:'V. Ferrone', p:0},
    {t:'Per l\u2019Italia dall\u2019esilio', a:'Emilio Lussu', p:1},
    {t:'Lector in fabula', a:'Umberto Eco', p:1},
    {t:'La rivolta dell\u2019oggetto', a:'M. Pira', p:8},
    {t:'La philosophie critique de Kant', a:'G. Deleuze', p:4},
    {t:'L\u2019anti-Edipo', a:'Deleuze & Guattari', p:7},
    {t:'Vita di Galileo', a:'Bertolt Brecht', p:5},
    {t:'Le città invisibili', a:'Italo Calvino', p:0},
    {t:'Confessioni', a:'Agostino', p:1},
  ];

  return (
    <CinematicShell active="Libreria">
      <div style={{padding:'40px 64px 24px', height:'100%', display:'flex', flexDirection:'column', gap:18}}>
        <CinePageTitle
          eyebrow="Capitulum II"
          title="Libreria"
          em="· 543 volumi"
          right={
            <div style={{display:'flex', gap:10, alignItems:'center'}}>
              <CineSearchBox placeholder="cerca titolo, autore, ISBN…"/>
            </div>
          }
        />

        {/* Filter row */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'12px 0', borderTop:'1px solid rgba(216,180,106,0.18)',
          borderBottom:'1px solid rgba(216,180,106,0.18)',
        }}>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <CineChip label="Tutti" count="543" active/>
            <CineChip label="Letti" count="0"/>
            <CineChip label="In lettura" count="0"/>
            <CineChip label="Da leggere" count="543"/>
            <span style={{width:1, height:24, background:'rgba(216,180,106,0.22)', margin:'0 6px', alignSelf:'center'}}/>
            <CineChip label="€ senza valore" count="0"/>
            <CineChip label="filtri"/>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <span style={{
              fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase',
              letterSpacing:'0.16em', fontSize:10, color:'rgba(232,220,192,0.75)',
            }}>ordina ·</span>
            <span style={{
              fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:13,
              color:CINE_CREAM, display:'inline-flex', alignItems:'center', gap:4,
            }}>data aggiunta
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 1 L4 4.5 L7 1" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>
            </span>
            <span style={{width:1, height:18, background:'rgba(216,180,106,0.22)', margin:'0 6px'}}/>
            <span style={{display:'inline-flex', border:'1px solid rgba(232,220,192,0.24)'}}>
              <span style={{padding:'5px 12px', background:'rgba(216,180,106,0.16)', color:CINE_CREAM,
                fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase', letterSpacing:'0.14em', fontSize:10, fontWeight:600}}>griglia</span>
              <span style={{padding:'5px 12px', color:'rgba(232,220,192,0.75)',
                fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase', letterSpacing:'0.14em', fontSize:10}}>lista</span>
            </span>
          </div>
        </div>

        {/* Book grid */}
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'28px 22px',
          overflowY:'auto', paddingBottom:24, paddingTop:6,
        }}>
          {books.map((b, i) => (
            <CineBook key={i} title={b.t} author={b.a} w={120} h={172}
              palette={BOOK_PALETTES[b.p % BOOK_PALETTES.length]}/>
          ))}
        </div>
      </div>
    </CinematicShell>
  );
}

/* ============================================================
   2) DESIDERATA — wishlist grid
   ============================================================ */
function CineDesiderata() {
  const items = [
    {t:'The Hobbit', a:'J.R.R. Tolkien', p:7},
    {t:'The Silmarillion', a:'J.R.R. Tolkien', p:8},
    {t:'The Hobbit: Illustrated', a:'J.R.R. Tolkien', p:6},
    {t:'Fra Dolcino e gli apostolici', a:'Centro Studi Dolciniani', p:4},
    {t:"L'individuazione psichica e collettiva", a:'Gilbert Simondon', p:1},
    {t:'I miti di Cthulhu', a:'H. P. Lovecraft', p:2},
    {t:'Dracula', a:'Bram Stoker', p:0},
    {t:'Frankenstein', a:'Mary W. Shelley', p:0},
    {t:'Se accendono le stelle', a:'V. Majakovskij', p:5},
    {t:'Il Silmarillion', a:'J.R.R. Tolkien', p:8},
    {t:'Il Signore degli Anelli', a:'J.R.R. Tolkien', p:4},
  ];
  return (
    <CinematicShell active="Desiderata">
      <div style={{padding:'40px 64px 24px', height:'100%', display:'flex', flexDirection:'column', gap:22}}>
        <CinePageTitle
          eyebrow="Libri osservati · da acquisire"
          title="Desiderata"
          right={
            <div style={{display:'flex', gap:10, alignItems:'center'}}>
              <span style={{
                fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase',
                letterSpacing:'0.18em', fontSize:11, color:CINE_GOLD, marginRight:8,
              }}>11 volumi</span>
              <CineSmallBtn icon={
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="5.5" cy="5.5" r="3.8" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M8.4 8.4 L11.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              }>Cerca online</CineSmallBtn>
              <CineSmallBtn primary icon={
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 2 L6.5 11 M2 6.5 L11 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              }>Manuale</CineSmallBtn>
            </div>
          }
        />

        <div style={{
          fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:13,
          color:'rgba(232,220,192,0.5)',
        }}>
          11 volumi desiderati · passa sopra per le azioni
        </div>

        <div style={{
          display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'32px 24px',
          overflowY:'auto', paddingTop:4,
        }}>
          {items.map((b, i) => (
            <CineBook key={i} title={b.t} author={b.a} w={130} h={188}
              palette={BOOK_PALETTES[b.p % BOOK_PALETTES.length]}/>
          ))}
        </div>
      </div>
    </CinematicShell>
  );
}

/* ============================================================
   3) AUTORI — A-Z list + featured author detail
   ============================================================ */
function CineAutori() {
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const authors = [
    {l:'A', n:'Theodor W. Adorno', c:26, active:true},
    {l:'A', n:'Giorgio Agamben', c:4},
    {l:'A', n:'Emilio Agazzi', c:1},
    {l:'A', n:'Francesca Di Lorenzo Ajello', c:1},
    {l:'A', n:'Louis Althusser', c:2},
    {l:'A', n:'Ludwig Friedrich Ancillon', c:1},
    {l:'A', n:'Benedict Anderson', c:1},
    {l:'A', n:'Giulio Angioni', c:1},
    {l:'A', n:'Anonimo', c:1},
    {l:'A', n:'Leo Apostel', c:1},
    {l:'A', n:'Arjun Appadurai', c:1},
    {l:'A', n:'Hannah Arendt', c:2},
    {l:'A', n:'Aristotele', c:5},
    {l:'A', n:'Antonin Artaud', c:2},
    {l:'A', n:'Centro sociale Askatasuna', c:1},
    {l:'A', n:'Marc Augé', c:1},
    {l:'A', n:'Averroè', c:1},
    {l:'B', n:'Fabio Bacà', c:1},
    {l:'B', n:'Johann Jakob Bachofen', c:2},
    {l:'B', n:'Michail Bachtin', c:2},
    {l:'B', n:'Nicola Badaloni', c:1},
    {l:'B', n:'Alain Badiou', c:6},
    {l:'B', n:'Roland H. Bainton', c:1},
  ];
  const adornoBooks = [
    {t:"L'attualità della filosofia", y:null, p:0},
    {t:'Kierkegaard. La costruzione…', y:1962, p:1},
    {t:'Istituto per la Ricerca Sociale di F.', y:1970, p:5},
    {t:'Introduzione alla sociologia', y:1971, p:4},
    {t:'Ästhetische Theorie', y:1973, p:6},
    {t:'Scritti sociologici', y:1978, p:0},
    {t:"Il gergo dell'autenticità", y:1989, p:7},
    {t:'Il concetto di filosofia', y:1999, p:4},
    {t:'Negative Dialektik', y:1999, p:1},
    {t:'Philosophische Terminologie 2', y:2001, p:1},
    {t:'Filosofia della musica moderna', y:2002, p:5},
    {t:'Progresso e feticismo', y:2002, p:2},
    {t:'Philosophie der Neuen Musik', y:2003, p:8},
    {t:'Immagini dialettiche', y:2004, p:0},
  ];

  const Letter = ({letter, count}) => (
    <div style={{
      display:'flex', alignItems:'baseline', gap:8, padding:'10px 0 6px 0',
      borderBottom:'1px solid rgba(216,180,106,0.18)', marginBottom:4,
    }}>
      <span style={{
        fontFamily:"'Mantinia', 'Cinzel', serif", fontSize:22, fontWeight:500,
        color:CINE_GOLD, letterSpacing:'0.05em',
      }}>{letter}</span>
      {count!=null && <span style={{
        fontFamily:"'Mantinia', 'Cinzel', serif", fontSize:11, fontWeight:500,
        color:'rgba(232,220,192,0.5)', letterSpacing:'0.16em',
      }}>{count}</span>}
    </div>
  );

  return (
    <CinematicShell active="Libreria" activeSub="Autori">
      <div style={{padding:'40px 64px 24px', height:'100%', display:'flex', flexDirection:'column', gap:18}}>
        <CinePageTitle
          eyebrow="Capitulum V"
          title="Autori"
          em="· 344"
          right={
            <div style={{display:'flex', gap:10, alignItems:'center'}}>
              <CineSearchBox placeholder="cerca autore…"/>
              <CineSmallBtn icon={
                <span style={{
                  fontFamily:"'Mantinia', 'Cinzel', serif", letterSpacing:'0.05em',
                }}>A→Z</span>
              }>{' '}</CineSmallBtn>
              <CineSmallBtn icon={
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 2 L9 9 M9 2 L2 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              }>Orfani</CineSmallBtn>
              <CineSmallBtn icon={
                <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                  <path d="M1 3 L12 3 L10 1 M12 8 L1 8 L3 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              }>Unifica</CineSmallBtn>
            </div>
          }
        />

        <div style={{display:'grid', gridTemplateColumns:'20px 220px 1fr', gap:20, overflow:'hidden', flex:1}}>
          {/* Alphabet rail */}
          <div style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            paddingTop:6, overflowY:'auto',
          }}>
            {ALPHA.map(l => (
              <span key={l} style={{
                fontFamily:"'Mantinia', 'Cinzel', serif", fontSize:11, fontWeight:500, letterSpacing:'0.08em',
                color: l==='A' || l==='B' ? CINE_VERM : 'rgba(232,220,192,0.35)',
                cursor:'pointer',
              }}>{l}</span>
            ))}
          </div>

          {/* Authors list */}
          <div style={{overflowY:'auto', paddingRight:8}}>
            <Letter letter="A" count={17}/>
            {authors.filter(a => a.l === 'A').map((a, i) => (
              <div key={i} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'9px 14px',
                background: a.active ? 'rgba(216,180,106,0.10)' : 'transparent',
                borderLeft: a.active ? '2px solid '+CINE_GOLD : '2px solid transparent',
                fontFamily:"'Agmena Pro', serif", fontSize:15,
                color: a.active ? CINE_CREAM : 'rgba(232,220,192,0.95)',
                cursor:'pointer',
              }}>
                <span>{a.n}</span>
                <span style={{
                  fontFamily:"'Mantinia', 'Cinzel', serif", fontSize:11, letterSpacing:'0.14em',
                  color: a.active ? CINE_GOLD : 'rgba(232,220,192,0.45)', fontWeight:500,
                }}>{a.c}</span>
              </div>
            ))}
            <Letter letter="B" count={33}/>
            {authors.filter(a => a.l === 'B').map((a, i) => (
              <div key={i} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'9px 14px',
                fontFamily:"'Agmena Pro', serif", fontSize:15,
                color:'rgba(232,220,192,0.95)', cursor:'pointer',
              }}>
                <span>{a.n}</span>
                <span style={{
                  fontFamily:"'Mantinia', 'Cinzel', serif", fontSize:11, letterSpacing:'0.14em',
                  color:'rgba(232,220,192,0.45)', fontWeight:500,
                }}>{a.c}</span>
              </div>
            ))}
          </div>

          {/* Featured author detail */}
          <div style={{overflowY:'auto', paddingRight:12, paddingTop:6}}>
            <div style={{display:'flex', alignItems:'flex-start', gap:24, marginBottom:18}}>
              {/* Author "initial" badge */}
              <div style={{
                width:96, height:120, flexShrink:0,
                background:'rgba(20,14,7,0.6)',
                border:'1px solid rgba(216,180,106,0.32)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'inset 0 0 0 4px rgba(20,14,7,0.6), inset 0 0 0 5px rgba(216,180,106,0.18)',
              }}>
                <span style={{
                  fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif", fontSize:52, fontWeight:600,
                  color:CINE_GOLD, letterSpacing:'0.02em',
                  textShadow:'0 1px 0 rgba(0,0,0,0.6)',
                }}>A</span>
              </div>
              <div style={{flex:1}}>
                <div style={{
                  fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif",
                  fontSize:32, fontWeight:600, lineHeight:1.05,
                  letterSpacing:'0.03em', color:CINE_CREAM,
                  textTransform:'uppercase',
                  textShadow:'0 1px 0 rgba(0,0,0,0.65)',
                }}>Theodor W. Adorno</div>
                <div style={{
                  fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:13,
                  color:'rgba(232,220,192,0.5)', marginTop:6,
                }}>adorno, theodor w.</div>
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  marginTop:12, padding:'5px 12px',
                  border:'1px solid rgba(192,83,59,0.6)',
                  color:CINE_VERM,
                  fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase',
                  letterSpacing:'0.16em', fontSize:11, fontWeight:600,
                }}>26 volumi</div>
              </div>
              <CineSmallBtn icon={
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M3 1 L8 5.5 L3 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              }>Scheda completa</CineSmallBtn>
            </div>

            <CineSectionRule title="In collezione · 26 titoli"/>

            <div style={{
              display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'28px 18px',
            }}>
              {adornoBooks.map((b, i) => (
                <CineBook key={i} title={b.t} year={b.y} w={112} h={162}
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
   4) EDITORI — publisher list + featured publisher's collane
   ============================================================ */
function CineEditori() {
  const pubs = [
    {n:'Einaudi', c:140, active:true},
    {n:'Adelphi', c:49},
    {n:'DeriveApprodi', c:31},
    {n:'Bompiani', c:26},
    {n:'Feltrinelli', c:23},
    {n:'Mimesis', c:18},
    {n:'Mondadori', c:13},
    {n:'Suhrkamp', c:13},
    {n:'Laterza', c:12},
    {n:'Carocci', c:10},
    {n:'Meltemi', c:10},
    {n:'Quodlibet', c:10},
    {n:'Rizzoli', c:9},
    {n:'SE', c:9},
    {n:'Cronopio', c:8},
    {n:'Gallimard', c:8},
    {n:'Il Mulino', c:7},
    {n:'Bollati Boringhieri', c:6},
    {n:'UTET', c:6},
  ];
  const einaudiCollana1 = [
    {t:"L'anti-Edipo. Capitalismo e schizofrenia", a:'F. Guattari, G. Deleuze', p:4},
    {t:'La scrittura e la differenza', a:'J. Derrida', p:5},
    {t:'Il seminario. Libro II. L\u2019io', a:'J. Lacan', p:7},
    {t:'Tempo della Chiesa', a:'J. Le Goff', p:0},
    {t:'Dialettica negativa', a:'T. W. Adorno', p:1},
    {t:'Metafisica. Concetto e problemi', a:'T. W. Adorno', p:5},
    {t:'Immagini dialettiche', a:'T. W. Adorno', p:0},
    {t:'Sul concetto di storia', a:'W. Benjamin', p:6},
    {t:'Il dramma barocco tedesco', a:'W. Benjamin', p:2},
  ];
  const einaudiCollana2 = [
    {t:'Costellazioni: Le parole di Benjamin', a:'A. Pinotti', p:8},
    {t:"La mente, l'anima, il corpo", a:'A. Long', p:7},
    {t:"Il teatro e il suo doppio", a:'A. Artaud', p:1},
    {t:"L'invenzione della tradizione", a:'E. Hobsbawm', p:5},
    {t:'La storia velata', a:'E. De Martino', p:0},
    {t:'La terra del rimorso', a:'E. De Martino', p:0},
    {t:'Morte e pianto rituale', a:'E. De Martino', p:1},
  ];

  return (
    <CinematicShell active="Libreria" activeSub="Editori">
      <div style={{padding:'40px 64px 24px', height:'100%', display:'flex', flexDirection:'column', gap:18}}>
        <CinePageTitle
          eyebrow="Capitulum VI"
          title="Editori"
          em="· 103"
          right={
            <div style={{display:'flex', gap:10, alignItems:'center'}}>
              <CineSearchBox placeholder="cerca editore…"/>
              <CineSmallBtn icon={
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none" style={{opacity:0.7}}>
                  <path d="M1 1 L4 4.5 L7 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                </svg>
              }>Più libri prima</CineSmallBtn>
              <CineSmallBtn icon={
                <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                  <path d="M1 3 L12 3 L10 1 M12 8 L1 8 L3 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              }>Unifica</CineSmallBtn>
            </div>
          }
        />

        <div style={{display:'grid', gridTemplateColumns:'210px 1fr', gap:28, overflow:'hidden', flex:1}}>
          {/* Publishers list */}
          <div style={{overflowY:'auto', paddingRight:8}}>
            {pubs.map((p, i) => (
              <div key={i} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'11px 14px',
                background: p.active ? 'rgba(216,180,106,0.12)' : 'transparent',
                borderLeft: p.active ? '2px solid '+CINE_GOLD : '2px solid transparent',
                fontFamily:"'Agmena Pro', serif", fontSize:15,
                color: p.active ? CINE_CREAM : 'rgba(232,220,192,0.95)',
                fontWeight: p.active ? 500 : 400,
                cursor:'pointer',
              }}>
                <span>{p.n}</span>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <span style={{
                    fontFamily:"'Mantinia', 'Cinzel', serif", fontSize:11, letterSpacing:'0.14em',
                    color: p.active ? CINE_GOLD : 'rgba(232,220,192,0.45)', fontWeight:500,
                  }}>{p.c}</span>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{opacity: p.active ? 1 : 0.4}}>
                    <path d="M2 1 L7 4.5 L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Featured publisher */}
          <div style={{overflowY:'auto', paddingRight:12}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24}}>
              <div>
                <div style={{
                  fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif",
                  fontSize:38, fontWeight:600, lineHeight:1, letterSpacing:'0.04em',
                  color:CINE_CREAM, textTransform:'uppercase',
                  textShadow:'0 1px 0 rgba(0,0,0,0.65)',
                }}>Einaudi</div>
                <div style={{
                  fontFamily:"'Mantinia', 'Cinzel', serif", textTransform:'uppercase',
                  letterSpacing:'0.22em', fontSize:11, color:'rgba(232,220,192,0.82)',
                  marginTop:8,
                }}>140 volumi · 14 collane</div>
              </div>
              <CineSmallBtn primary icon={
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 2 L5.5 9 M2 5.5 L9 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              }>Nuova collana</CineSmallBtn>
            </div>

            {/* Collana 1 */}
            <div style={{marginBottom:34}}>
              <div style={{
                display:'flex', alignItems:'baseline', justifyContent:'space-between',
                borderBottom:'1px solid rgba(216,180,106,0.18)', paddingBottom:10, marginBottom:16,
              }}>
                <div style={{display:'flex', alignItems:'baseline', gap:14}}>
                  <span style={{color:'rgba(232,220,192,0.4)', fontSize:14}}>⫶⫶</span>
                  <span style={{
                    fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif", fontSize:22, fontWeight:600,
                    color:CINE_CREAM, letterSpacing:'0.04em',
                  }}>Biblioteca Einaudi</span>
                </div>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <span style={{
                    fontFamily:"'Mantinia', 'Cinzel', serif", fontSize:10, letterSpacing:'0.16em',
                    color:'rgba(232,220,192,0.5)', textTransform:'uppercase',
                  }}>9 volumi</span>
                  <CineSmallBtn icon={<span style={{fontSize:11}}>✎</span>}>Modifica</CineSmallBtn>
                  <CineSmallBtn icon={<span style={{fontSize:11}}>×</span>}>Elimina</CineSmallBtn>
                </div>
              </div>
              <div style={{
                display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'26px 18px',
              }}>
                {einaudiCollana1.map((b, i) => (
                  <CineBook key={i} title={b.t} author={b.a} w={100} h={144}
                    palette={BOOK_PALETTES[b.p % BOOK_PALETTES.length]}/>
                ))}
              </div>
            </div>

            {/* Collana 2 */}
            <div>
              <div style={{
                display:'flex', alignItems:'baseline', justifyContent:'space-between',
                borderBottom:'1px solid rgba(216,180,106,0.18)', paddingBottom:10, marginBottom:16,
              }}>
                <div style={{display:'flex', alignItems:'baseline', gap:14}}>
                  <span style={{color:'rgba(232,220,192,0.4)', fontSize:14}}>⫶⫶</span>
                  <span style={{
                    fontFamily:"'Mantinia', 'Cinzel', 'Cormorant Garamond', serif", fontSize:22, fontWeight:600,
                    color:CINE_CREAM, letterSpacing:'0.04em',
                  }}>Piccola Biblioteca Einaudi <span style={{
                    fontFamily:"'Agmena Pro', serif", fontStyle:'italic', fontSize:14,
                    color:CINE_GOLD, letterSpacing:'0.01em', textTransform:'none', marginLeft:6, fontWeight:400,
                  }}>(Nuova serie)</span></span>
                </div>
                <span style={{
                  fontFamily:"'Mantinia', 'Cinzel', serif", fontSize:10, letterSpacing:'0.16em',
                  color:'rgba(232,220,192,0.5)', textTransform:'uppercase',
                }}>27 volumi</span>
              </div>
              <div style={{
                display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'26px 18px',
              }}>
                {einaudiCollana2.map((b, i) => (
                  <CineBook key={i} title={b.t} author={b.a} w={100} h={144}
                    palette={BOOK_PALETTES[b.p % BOOK_PALETTES.length]}/>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CinematicShell>
  );
}

window.CineLibreria = CineLibreria;
window.CineDesiderata = CineDesiderata;
window.CineAutori = CineAutori;
window.CineEditori = CineEditori;
