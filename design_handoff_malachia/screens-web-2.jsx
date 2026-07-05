/* Web screens — set 2: Shelves, Library Map, Notes journal, Graph, Stats wrap, Search, Wishlist */

/* 5. Shelves / Collections */
function WebShelves() {
  const shelves = [
    { name: 'Filosofia', count: 84, palette: [0,1,5,7,8,4], italic: 'pensiero antico & moderno' },
    { name: 'Italiani del ‘900', count: 32, palette: [6,2,5,0,7], italic: 'da Svevo a Calvino' },
    { name: 'Notturni', count: 11, palette: [2,7,0], italic: 'letture per le ore piccole' },
    { name: 'Manuali', count: 18, palette: [4,5,3], italic: 'tecnica & artigianato' },
    { name: 'Comodino', count: 6, palette: [0,1,6], italic: 'pila attuale' },
    { name: 'Da regalare', count: 4, palette: [3,7], italic: 'volumi in uscita' },
  ];
  return (
    <WebChrome active="Scaffali">
      <div style={{padding:'28px 36px', display:'flex', flexDirection:'column', gap:24, height:'100%'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
          <div>
            <div className="m-eyebrow">Capitulum IV · Scrinia</div>
            <div className="m-serif" style={{fontSize:38, fontWeight:500, lineHeight:1.05, marginTop:2}}>Scaffali <em style={{color:'var(--m-terracotta)'}}>& collezioni</em></div>
          </div>
          <button className="m-btn">+ nuovo scaffale</button>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24, overflow:'auto', paddingBottom:20}}>
          {shelves.map(s => (
            <div key={s.name} style={{border:'1px solid var(--m-rule-strong)', background:'rgba(255,255,255,0.22)', padding:'20px 22px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                <div className="m-eyebrow">{s.count} volumi</div>
                <ORN.fleuron size={14} style={{color:'var(--m-terracotta)'}}/>
              </div>
              <div className="m-serif" style={{fontSize:28, fontWeight:500, lineHeight:1.05, marginTop:4}}>{s.name}</div>
              <div className="m-marginalia" style={{marginTop:2}}>{s.italic}</div>

              {/* book spines preview */}
              <div style={{display:'flex', gap:4, marginTop:18, padding:'10px 8px', background:'rgba(58,42,26,0.08)', borderTop:'2px solid var(--m-wood-dark)', borderBottom:'2px solid var(--m-wood-dark)'}}>
                {s.palette.map((p,i) => (
                  <div key={i} style={{
                    width: 18+(i%3)*4, height: 100,
                    background: BOOK_PALETTES[p][0],
                    boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.3), inset 0 -3px 0 rgba(0,0,0,0.2)',
                    position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <div style={{
                      writingMode:'vertical-rl', transform:'rotate(180deg)',
                      color: BOOK_PALETTES[p][1], fontSize: 9,
                      fontFamily:"'Cormorant Garamond', serif",
                      fontVariant:'small-caps', letterSpacing:'.1em',
                    }}>tomo {i+1}</div>
                  </div>
                ))}
                <div style={{flex:1}}/>
              </div>
              <div className="m-mono" style={{fontSize:11, color:'var(--m-ink-muted)', marginTop:8, display:'flex', justifyContent:'space-between'}}>
                <span>aperto · stamani</span>
                <span>›</span>
              </div>
            </div>
          ))}

          {/* Empty / new shelf card */}
          <div style={{border:'1px dashed var(--m-rule-strong)', padding:'20px 22px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:240}}>
            <div style={{fontSize:48, color:'var(--m-ink-muted)', lineHeight:1}}>＋</div>
            <div className="m-serif" style={{fontSize:22, fontStyle:'italic', color:'var(--m-ink-muted)', marginTop:6}}>nuovo scrinium</div>
            <div className="m-marginalia" style={{marginTop:4, maxWidth:200}}>raggruppa volumi per tema, autore, periodo o capriccio</div>
          </div>
        </div>
      </div>
    </WebChrome>
  );
}

/* 6. Library map — physical placement on real shelves */
function WebMap() {
  // 5 shelves x 4 ripiani
  const ripiani = [
    { books: 12, palettes: [0,5,1,7,2,4,6,0,3,5,1,7] },
    { books: 10, palettes: [1,4,2,7,5,0,6,3,1,2] },
    { books: 14, palettes: [3,0,2,6,7,5,1,4,0,2,6,1,3,5] },
    { books: 9,  palettes: [4,6,1,2,0,7,5,3,1] },
  ];
  return (
    <WebChrome active="Mappa">
      <div style={{padding:'24px 36px', height:'100%', display:'flex', flexDirection:'column', gap:18, position:'relative', overflow:'hidden'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
          <div>
            <div className="m-eyebrow">Capitulum V · Topografia della stanza</div>
            <div className="m-serif" style={{fontSize:38, fontWeight:500, lineHeight:1.05, marginTop:2}}>Mappa della <em style={{color:'var(--m-terracotta)'}}>biblioteca</em></div>
            <div className="m-marginalia" style={{marginTop:4}}>tocca un dorso per sapere dov'è — o trascina un libro su un altro ripiano per riordinare.</div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="m-btn m-btn-ghost">studio</button>
            <button className="m-btn m-btn-ghost" style={{background:'var(--m-ink)', color:'var(--m-parchment)'}}>salotto</button>
            <button className="m-btn m-btn-ghost">camera</button>
            <button className="m-btn m-btn-ghost">+ stanza</button>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 280px', gap:24, flex:1, minHeight:0}}>
          {/* Bookcase */}
          <div style={{
            background:
              'linear-gradient(180deg, #2a1d10 0%, #2a1d10 100%)',
            padding:'20px 18px',
            position:'relative',
            boxShadow:'inset 0 0 0 6px #1a140a, 0 0 40px rgba(0,0,0,0.3)',
            display:'flex', flexDirection:'column', gap:14,
          }}>
            {/* room label */}
            <div style={{position:'absolute', top:8, left:14, color:'var(--m-gold-pale)', fontFamily:"'EB Garamond', serif", fontVariant:'small-caps', letterSpacing:'.2em', fontSize:11, opacity:.8}}>
              Salotto · libreria A · parete nord
            </div>

            {ripiani.map((r, ri) => (
              <div key={ri} style={{
                background: '#3a2a1a',
                borderTop:'2px solid #1a140a',
                borderBottom:'4px solid #1a140a',
                padding:'8px 10px',
                display:'flex', alignItems:'flex-end', gap:3,
                position:'relative',
                flex:1, minHeight:0,
              }}>
                <div style={{position:'absolute', left:-2, top:6, color:'var(--m-gold-pale)', fontFamily:"'EB Garamond', serif", fontSize:10, transform:'rotate(-90deg)', transformOrigin:'left top', opacity:.8}}>ripiano {ri+1}</div>
                {r.palettes.map((p, i) => {
                  const isHL = ri === 1 && i === 4;
                  return (
                    <div key={i} style={{
                      width: 16 + (i%4)*5,
                      height: '100%',
                      background: BOOK_PALETTES[p][0],
                      boxShadow: isHL
                        ? '0 0 0 2px var(--m-vermilion), 0 0 16px var(--m-vermilion)'
                        : 'inset 0 0 0 1px rgba(0,0,0,0.4), inset 0 -3px 0 rgba(0,0,0,0.2), 1px 0 0 rgba(255,255,255,0.05)',
                      position:'relative',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <div style={{
                        writingMode:'vertical-rl', transform:'rotate(180deg)',
                        color: BOOK_PALETTES[p][1], fontSize: 9,
                        fontFamily:"'Cormorant Garamond', serif",
                        fontVariant:'small-caps', letterSpacing:'.06em',
                        opacity:.85, padding:'10px 0',
                      }}>{['Eco','Calvino','Yourcenar','Seneca','Sebald','Brecht','Bulgakov','Mann','Ginzburg','Tolstoj','Dante','Pavese','Buzzati','Murakami'][i % 14]}</div>
                      {isHL && <div style={{position:'absolute', top:-26, left:'50%', transform:'translateX(-50%)', background:'var(--m-vermilion)', color:'var(--m-parchment)', padding:'2px 8px', fontSize:11, fontVariant:'small-caps', letterSpacing:'.1em', whiteSpace:'nowrap'}}>qui!</div>}
                    </div>
                  );
                })}
                <div style={{flex:1}}/>
              </div>
            ))}
          </div>

          {/* Selected book panel */}
          <aside style={{display:'flex', flexDirection:'column', gap:14}}>
            <div className="m-eyebrow">Volume selezionato</div>
            <BookCover title="Il nome della rosa" author="Eco" palette={BOOK_PALETTES[0]} w={200} h={290}/>
            <div className="m-serif" style={{fontSize:22, lineHeight:1.1}}>Il nome della rosa</div>
            <div className="m-marginalia">Umberto Eco · 1980</div>

            <div style={{borderTop:'1px solid var(--m-rule)', borderBottom:'1px solid var(--m-rule)', padding:'10px 0'}}>
              <div className="m-eyebrow" style={{marginBottom:4}}>Collocazione fisica</div>
              <div className="m-serif" style={{fontSize:18}}>Salotto · libreria A · <em>ripiano 2, posizione 5</em></div>
            </div>

            <div className="m-marginalia">5 volumi a sinistra: Calvino, Yourcenar, Seneca, Sebald, Brecht.<br/>A destra: Bulgakov, Mann, Ginzburg…</div>

            <button className="m-btn m-btn-ghost" style={{justifyContent:'center'}}>↳ sposta su altro ripiano</button>
            <button className="m-btn m-btn-ghost" style={{justifyContent:'center'}}>scansiona ripiano (foto)</button>
          </aside>
        </div>
      </div>
    </WebChrome>
  );
}

/* 7. Notes journal / commonplace book */
function WebNotes() {
  const entries = [
    { date: 'XX maii', book: 'Il nome della rosa', author: 'U. Eco', page: 218,
      quote: '"Stat rosa pristina nomine, nomina nuda tenemus."',
      gloss: 'Verso di Bernardo di Cluny ripreso come finale. Il titolo significa "non resta che il nome" — eppure il nome è già moltissimo: gli ultimi due termini che il narratore lascia al lettore.',
      tags: ['titolo','latino','filologia']
    },
    { date: 'XIX maii', book: 'Memorie di Adriano', author: 'M. Yourcenar', page: 84,
      quote: '"Quando gli dèi non c\'erano più e Cristo non c\'era ancora, c\'è stato un momento unico, dall\'epoca di Cicerone a quella di Marco Aurelio, in cui l\'uomo solo è stato."',
      gloss: 'L\'uomo prima della provvidenza. Risuona con Lucrezio.',
      tags: ['stoicismo','antichità']
    },
    { date: 'XVII maii', book: 'Austerlitz', author: 'W. G. Sebald', page: 47,
      quote: '"Mi sembra che il tempo non esista affatto, ma esistano soltanto spazi diversi, incassati uno nell\'altro."',
      gloss: 'Topologia della memoria — stessa intuizione che Bachelard chiama "spaziosi​tà del passato".',
      tags: ['memoria','tempo']
    },
    { date: 'XV maii', book: 'Le cosmicomiche', author: 'I. Calvino', page: 12,
      quote: '"Io c\'ero, e come avrei potuto non esserci, dato che ancora non c\'era posto in cui non esserci?"',
      gloss: 'Qfwfq apre All\'alba. La grazia leggera del paradosso cosmologico.',
      tags: ['cosmologia','umorismo']
    },
  ];

  return (
    <WebChrome active="Note">
      <div style={{padding:'28px 40px', display:'grid', gridTemplateColumns:'1fr 280px', gap:32, height:'100%', overflow:'hidden'}}>
        <div style={{overflow:'auto', paddingRight:8}}>
          <div className="m-eyebrow">Capitulum VI · Marginalia</div>
          <div className="m-serif" style={{fontSize:46, fontWeight:500, lineHeight:1.05, marginTop:2}}>
            Note e <em style={{color:'var(--m-terracotta)'}}>citazioni</em>
          </div>
          <div className="m-marginalia" style={{marginTop:6}}>il commonplace book: tutto ciò che hai sottolineato, in un unico filo.</div>

          <div style={{marginTop:24, display:'flex', flexDirection:'column', gap:28}}>
            {entries.map((e, i) => (
              <article key={i} style={{display:'grid', gridTemplateColumns:'60px 1fr', gap:24}}>
                <div style={{textAlign:'right'}}>
                  <div className="m-folio" style={{fontSize:14, color:'var(--m-terracotta)'}}>{e.date}</div>
                  <div className="m-mono" style={{fontSize:11, color:'var(--m-ink-muted)', marginTop:4}}>p. {e.page}</div>
                </div>
                <div>
                  <div className="m-eyebrow" style={{marginBottom:6}}>da <em style={{fontStyle:'italic', color:'var(--m-ink-soft)'}}>{e.book}</em> · {e.author}</div>
                  <blockquote style={{margin:0, padding:'0 0 0 18px', borderLeft:'3px solid var(--m-terracotta)'}}>
                    <p className="m-serif" style={{fontSize:24, fontStyle:'italic', lineHeight:1.4, margin:0}}>{e.quote}</p>
                  </blockquote>
                  <p className="m-body" style={{fontSize:16, lineHeight:1.55, marginTop:10, color:'var(--m-ink-soft)'}}>{e.gloss}</p>
                  <div style={{display:'flex', gap:6, marginTop:10}}>
                    {e.tags.map(t => <span key={t} className="m-chip">{t}</span>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Right sidebar: tags & timeline */}
        <aside style={{borderLeft:'1px solid var(--m-rule)', paddingLeft:24, display:'flex', flexDirection:'column', gap:20}}>
          <div>
            <div className="m-eyebrow" style={{marginBottom:8}}>Filtra · 184 note</div>
            <div style={{padding:'8px 12px', border:'1px solid var(--m-rule-strong)', background:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', gap:8}}>
              <ORN.quill size={14}/> <span className="m-body" style={{fontStyle:'italic', color:'var(--m-ink-muted)'}}>cerca nelle citazioni…</span>
            </div>
          </div>
          <div>
            <div className="m-eyebrow" style={{marginBottom:8}}>Etichette</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
              {['memoria','tempo','stoicismo','cosmologia','semiotica','etica','titolo','silenzio','umorismo','antichità','filologia','latino'].map(t => (
                <span key={t} className="m-chip">{t}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="m-eyebrow" style={{marginBottom:8}}>Autori più annotati</div>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {[['U. Eco', 41],['I. Calvino', 28],['M. Yourcenar', 19],['W. G. Sebald', 14],['Seneca', 11]].map(([a, n]) => (
                <div key={a} style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'4px 0', borderBottom:'1px solid var(--m-rule)'}}>
                  <span className="m-serif" style={{fontSize:16}}>{a}</span>
                  <span className="m-nums m-mono" style={{fontSize:12, color:'var(--m-ink-muted)'}}>{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="m-marginalia" style={{marginTop:'auto'}}>
            "Quando leggo segno con una matita le frasi che mi piacciono — e poi le riporto in un quaderno." — abitudine di W. H. Auden.
          </div>
        </aside>
      </div>
    </WebChrome>
  );
}

/* 8. Connection Graph */
function WebGraph() {
  // Manually placed nodes for a constellation
  const nodes = [
    { id:'eco', x:520, y:300, r:38, label:'Umberto Eco', books:8, hl:true },
    { id:'cal', x:240, y:200, r:34, label:'Italo Calvino', books:6 },
    { id:'borg', x:380, y:130, r:30, label:'J. L. Borges', books:5 },
    { id:'aug', x:660, y:130, r:24, label:'Agostino', books:2 },
    { id:'arist', x:760, y:300, r:22, label:'Aristotele', books:2 },
    { id:'seneca', x:820, y:430, r:24, label:'Seneca', books:3 },
    { id:'yourc', x:560, y:480, r:28, label:'Yourcenar', books:4 },
    { id:'pirand', x:340, y:480, r:24, label:'Pirandello', books:3 },
    { id:'ginz', x:160, y:380, r:24, label:'N. Ginzburg', books:3 },
    { id:'gadda', x:130, y:540, r:22, label:'C. E. Gadda', books:2 },
    { id:'sebald', x:680, y:560, r:28, label:'W. G. Sebald', books:4 },
    { id:'thomas', x:880, y:200, r:22, label:'T. Mann', books:2 },
  ];
  const edges = [
    ['eco','cal'],['eco','borg'],['eco','aug'],['eco','arist'],['eco','yourc'],['eco','sebald'],
    ['cal','borg'],['cal','ginz'],['cal','pirand'],['cal','gadda'],
    ['yourc','seneca'],['yourc','sebald'],['seneca','arist'],['borg','aug'],
    ['sebald','thomas'],['pirand','gadda'],['ginz','gadda'],['thomas','aug'],
  ];
  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <WebChrome active="Grafo">
      <div style={{padding:'24px 36px', display:'grid', gridTemplateColumns:'1fr 300px', gap:24, height:'100%'}}>
        <div>
          <div className="m-eyebrow">Capitulum VII · Costellazione</div>
          <div className="m-serif" style={{fontSize:38, fontWeight:500, lineHeight:1.05, marginTop:2}}>Grafo dei <em style={{color:'var(--m-terracotta)'}}>libri letti</em></div>
          <div className="m-marginalia" style={{marginTop:4}}>chi cita chi, chi traduce chi, chi tiene chi sul comodino. la mano del bibliotecario fra gli autori.</div>

          <div style={{marginTop:14, position:'relative', height:600, border:'1px solid var(--m-rule)', background:'rgba(255,255,255,0.18)', overflow:'hidden'}}>
            <svg width="100%" height="100%" viewBox="0 0 980 640" style={{display:'block'}}>
              {/* Subtle grid */}
              <defs>
                <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.7" fill="rgba(58,42,26,0.18)"/>
                </pattern>
              </defs>
              <rect width="980" height="640" fill="url(#dots)"/>
              {/* Edges */}
              {edges.map(([a,b], i) => {
                const A = nodeById[a], B = nodeById[b];
                const hl = a==='eco' || b==='eco';
                return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={hl ? 'var(--m-terracotta)' : 'rgba(58,42,26,0.35)'} strokeWidth={hl ? 1.4 : 0.9}/>;
              })}
              {/* Nodes */}
              {nodes.map(n => (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={n.r} fill={n.hl ? 'var(--m-terracotta)' : 'var(--m-ink-soft)'}
                          stroke={n.hl ? 'var(--m-gold-deep)' : 'var(--m-gold-deep)'} strokeWidth={n.hl ? 3 : 1}/>
                  <text x={n.x} y={n.y+5} textAnchor="middle" fontFamily="'UnifrakturCook', serif"
                        fontSize={n.r*0.6} fill={n.hl ? 'var(--m-parchment)' : 'var(--m-gold-pale)'}>
                    {n.label[0]}
                  </text>
                  <text x={n.x} y={n.y + n.r + 16} textAnchor="middle" fontFamily="'EB Garamond', serif" fontSize="13" fill="var(--m-ink-soft)">
                    {n.label}
                  </text>
                  <text x={n.x} y={n.y + n.r + 30} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="10" fill="var(--m-ink-muted)">
                    {n.books} vol.
                  </text>
                </g>
              ))}
            </svg>
            <div style={{position:'absolute', top:12, right:14, display:'flex', gap:6}}>
              <span className="m-chip">autori</span>
              <span className="m-chip">temi</span>
              <span className="m-chip">epoche</span>
            </div>
          </div>
        </div>

        <aside style={{display:'flex', flexDirection:'column', gap:18}}>
          <div>
            <div className="m-eyebrow">Nodo selezionato</div>
            <div className="m-serif" style={{fontSize:28, fontWeight:500, lineHeight:1.05, marginTop:2}}>Umberto Eco</div>
            <div className="m-marginalia">1932 — 2016 · semiotico, romanziere</div>
          </div>
          <div>
            <div className="m-eyebrow" style={{marginBottom:8}}>8 volumi nella biblioteca</div>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {['Il nome della rosa','Il pendolo di Foucault','Baudolino','L\u2019isola del giorno prima','Numero zero','Trattato di semiotica','Apocalittici e integrati','La struttura assente'].map(t => (
                <div key={t} className="m-serif" style={{fontSize:15, padding:'4px 0', borderBottom:'1px solid var(--m-rule)'}}>{t}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="m-eyebrow" style={{marginBottom:8}}>Collegato a · 6 autori</div>
            <div className="m-marginalia" style={{lineHeight:1.55}}>
              cita o riprende: <strong>Borges</strong>, <strong>Aristotele</strong>, <strong>Agostino</strong>.<br/>
              tradusse: <strong>Calvino</strong> (in spagnolo).<br/>
              tema condiviso (biblioteca): <strong>Sebald</strong>, <strong>Yourcenar</strong>.
            </div>
          </div>
        </aside>
      </div>
    </WebChrome>
  );
}

/* 9. Annales — Spotify Wrapped-style stats */
function WebAnnales() {
  return (
    <WebChrome active="Annales" dark={true}>
      <div style={{padding:'30px 40px', display:'flex', flexDirection:'column', gap:18, height:'100%', color:'var(--m-parchment)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
          <div>
            <div className="m-eyebrow m-eyebrow-light">Annales · MMXXVI</div>
            <div className="m-serif" style={{fontSize:50, fontWeight:500, lineHeight:1.05, marginTop:2, color:'var(--m-parchment)'}}>
              Il tuo anno di <em style={{color:'var(--m-gold-pale)'}}>letture</em>
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="m-btn m-btn-ghost" style={{color:'var(--m-parchment)', borderColor:'var(--m-gold-pale)'}}>‹ 2025</button>
            <button className="m-btn m-btn-gold">condividi</button>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:18, flex:1, minHeight:0}}>
          {/* Big number */}
          <div style={{gridColumn:'span 2', border:'1px solid rgba(216,195,137,0.3)', padding:'24px 28px', background:'rgba(255,255,255,0.03)', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
            <div className="m-eyebrow m-eyebrow-light">Volumi conclusi</div>
            <div>
              <div className="m-serif m-nums" style={{fontSize:200, lineHeight:0.9, color:'var(--m-gold-pale)'}}>23</div>
              <div className="m-marginalia" style={{color:'rgba(244,236,216,0.7)', marginTop:6}}>+ 8 rispetto al MMXXV · pari a un libro ogni 8 giorni</div>
            </div>
            <div style={{display:'flex', gap:14}}>
              <BookCover title="Il nome" author="Eco" palette={BOOK_PALETTES[0]} w={60} h={86}/>
              <BookCover title="Austerlitz" author="Sebald" palette={BOOK_PALETTES[1]} w={60} h={86}/>
              <BookCover title="Memorie" author="Yourcenar" palette={BOOK_PALETTES[2]} w={60} h={86}/>
              <BookCover title="Stoner" author="Williams" palette={BOOK_PALETTES[4]} w={60} h={86}/>
              <BookCover title="Cosmic." author="Calvino" palette={BOOK_PALETTES[6]} w={60} h={86}/>
            </div>
          </div>

          <div style={{border:'1px solid rgba(216,195,137,0.3)', padding:'18px 20px', background:'rgba(255,255,255,0.03)'}}>
            <div className="m-eyebrow m-eyebrow-light">Pagine sfogliate</div>
            <div className="m-serif m-nums" style={{fontSize:60, lineHeight:1, color:'var(--m-gold-pale)', marginTop:12}}>7.412</div>
            <div className="m-marginalia" style={{color:'rgba(244,236,216,0.7)', marginTop:6}}>circa 20 pagine al giorno. una pila alta come un gatto.</div>
            <div style={{display:'flex', alignItems:'flex-end', gap:3, marginTop:14, height:60}}>
              {[18,22,30,28,42,38,52,46,55,48,62,58].map((v,i) => (
                <div key={i} style={{flex:1, height:v+'%', background:'var(--m-gold)', opacity:0.4 + i*0.045}}/>
              ))}
            </div>
            <div className="m-mono" style={{fontSize:9, color:'rgba(244,236,216,0.5)', marginTop:4, display:'flex', justifyContent:'space-between'}}>
              <span>gen</span><span>giu</span><span>dic</span>
            </div>
          </div>

          <div style={{border:'1px solid rgba(216,195,137,0.3)', padding:'18px 20px', background:'rgba(255,255,255,0.03)'}}>
            <div className="m-eyebrow m-eyebrow-light">Ore di lettura</div>
            <div className="m-serif m-nums" style={{fontSize:60, lineHeight:1, color:'var(--m-gold-pale)', marginTop:12}}>184</div>
            <div className="m-marginalia" style={{color:'rgba(244,236,216,0.7)', marginTop:6}}>la maggior parte fra le 22 e l'una.</div>
            {/* clock */}
            <div style={{marginTop:14, position:'relative', width:'100%', aspectRatio:'1', maxHeight:90, alignSelf:'center'}}>
              <svg viewBox="0 0 100 100" style={{width:'100%', height:'100%'}}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(216,195,137,0.2)" strokeWidth="8"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--m-gold)" strokeWidth="8"
                        strokeDasharray="264" strokeDashoffset="80" transform="rotate(-90 50 50)"/>
                <text x="50" y="56" textAnchor="middle" fill="var(--m-gold-pale)" fontFamily="'EB Garamond', serif" fontSize="14">22h–1h</text>
              </svg>
            </div>
          </div>

          {/* Genres */}
          <div style={{border:'1px solid rgba(216,195,137,0.3)', padding:'18px 20px', background:'rgba(255,255,255,0.03)'}}>
            <div className="m-eyebrow m-eyebrow-light">Generi</div>
            <div style={{display:'flex', flexDirection:'column', gap:8, marginTop:12}}>
              {[['romanzo',9,'72%'],['saggi',6,'48%'],['filosofia',4,'32%'],['poesia',2,'16%'],['storia',2,'16%']].map(([g,n,w]) => (
                <div key={g}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:13}} className="m-body">
                    <span>{g}</span>
                    <span className="m-nums" style={{color:'rgba(244,236,216,0.7)'}}>{n}</span>
                  </div>
                  <div style={{height:5, background:'rgba(216,195,137,0.15)', marginTop:3}}>
                    <div style={{height:5, width:w, background:'var(--m-gold)'}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top author */}
          <div style={{gridColumn:'span 2', border:'1px solid rgba(216,195,137,0.3)', padding:'18px 24px', background:'rgba(255,255,255,0.03)', display:'flex', gap:24, alignItems:'center'}}>
            <Initial letter="C" size={110} color="var(--m-ink)" bg="var(--m-gold)"/>
            <div>
              <div className="m-eyebrow m-eyebrow-light">Autore dell'anno</div>
              <div className="m-serif" style={{fontSize:42, fontWeight:500, lineHeight:1, marginTop:4}}>Italo <em style={{color:'var(--m-gold-pale)'}}>Calvino</em></div>
              <div className="m-marginalia" style={{color:'rgba(244,236,216,0.7)', marginTop:6}}>5 volumi · 1.840 pagine · 42 citazioni segnate</div>
              <div style={{display:'flex', gap:6, marginTop:10, flexWrap:'wrap'}}>
                <span className="m-chip m-chip-dark">Le città invisibili</span>
                <span className="m-chip m-chip-dark">Le cosmicomiche</span>
                <span className="m-chip m-chip-dark">Se una notte</span>
                <span className="m-chip m-chip-dark">Palomar</span>
                <span className="m-chip m-chip-dark">Sentiero dei nidi</span>
              </div>
            </div>
          </div>

          {/* Quote of the year */}
          <div style={{gridColumn:'span 2', border:'1px solid rgba(216,195,137,0.3)', padding:'18px 24px', background:'rgba(255,255,255,0.03)', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
            <div>
              <div className="m-eyebrow m-eyebrow-light">Citazione dell'anno</div>
              <div className="m-serif" style={{fontSize:24, fontStyle:'italic', lineHeight:1.4, marginTop:10, color:'var(--m-parchment)'}}>
                "L'inferno dei viventi non è qualcosa che sarà; se ce n'è uno, è quello che è già qui, l'inferno che abitiamo tutti i giorni."
              </div>
            </div>
            <div className="m-marginalia" style={{color:'rgba(244,236,216,0.7)'}}>— Italo Calvino, <em>Le città invisibili</em>, p. 164</div>
          </div>

          {/* Longest book */}
          <div style={{border:'1px solid rgba(216,195,137,0.3)', padding:'18px 20px', background:'rgba(255,255,255,0.03)'}}>
            <div className="m-eyebrow m-eyebrow-light">Volume più lungo</div>
            <div className="m-serif" style={{fontSize:22, lineHeight:1.1, marginTop:10}}>La montagna incantata</div>
            <div className="m-marginalia" style={{color:'rgba(244,236,216,0.7)'}}>T. Mann · 762 p. · 31 giorni</div>
            <div style={{display:'flex', gap:4, marginTop:14, alignItems:'flex-end'}}>
              {[76,62,42,38,28].map((h, i) => (
                <div key={i} style={{flex:1}}>
                  <div style={{height: h+'px', background:'var(--m-gold)', opacity: 0.4 + i*0.12}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Reading streak */}
          <div style={{border:'1px solid rgba(216,195,137,0.3)', padding:'18px 20px', background:'rgba(255,255,255,0.03)'}}>
            <div className="m-eyebrow m-eyebrow-light">Costanza</div>
            <div className="m-serif m-nums" style={{fontSize:60, lineHeight:1, color:'var(--m-gold-pale)', marginTop:12}}>47</div>
            <div className="m-marginalia" style={{color:'rgba(244,236,216,0.7)'}}>giorni consecutivi di lettura</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(14, 1fr)', gap:2, marginTop:14}}>
              {[...Array(7*14)].map((_, i) => (
                <div key={i} style={{paddingTop:'100%', background: i % 13 === 4 || i % 17 === 5 ? 'rgba(216,195,137,0.2)' : 'var(--m-gold)', opacity: Math.random()*0.6+0.3}}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WebChrome>
  );
}

/* 10. Advanced Search */
function WebSearch() {
  return (
    <WebChrome active="Libreria">
      <div style={{padding:'32px 48px', height:'100%', overflow:'auto'}}>
        <div className="m-eyebrow">Index quaerendi · ricerca avanzata</div>
        <div className="m-serif" style={{fontSize:50, fontWeight:500, lineHeight:1, marginTop:4}}>
          Cerca un <em style={{color:'var(--m-terracotta)'}}>volume</em>
        </div>

        <div style={{marginTop:18, padding:'14px 18px', border:'1px solid var(--m-ink-soft)', background:'#fff', display:'flex', alignItems:'center', gap:14}}>
          <ORN.quill size={22} style={{color:'var(--m-ink-soft)'}}/>
          <div style={{flex:1, fontSize:22, fontFamily:"'EB Garamond', serif"}}>
            autore:Calvino · genere:romanzo · anno:1970–1985 · "città"<span style={{display:'inline-block', width:1, height:22, background:'var(--m-ink)', marginLeft:2, verticalAlign:'middle'}}/>
          </div>
          <span className="m-mono" style={{fontSize:11, color:'var(--m-ink-muted)'}}>⏎</span>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'260px 1fr', gap:32, marginTop:24}}>
          {/* Facets */}
          <aside>
            {[
              ['Stato', ['letti · 287','in lettura · 3','da leggere · 122'], 0],
              ['Genere', ['romanzo · 142','saggi · 78','filosofia · 64','poesia · 28','storia · 41'], 0],
              ['Lingua originale', ['italiano','inglese','francese','tedesco','spagnolo','latino'], 0],
              ['Decennio', ['1900s','1920s','1950s','1970s','1980s','2000s'], 3],
              ['Valutazione', ['★★★★★','★★★★','★★★','★★','★'], 0],
            ].map(([title, items, hl]) => (
              <div key={title} style={{marginBottom:18}}>
                <div className="m-eyebrow" style={{marginBottom:8}}>{title}</div>
                {items.map((it, i) => (
                  <div key={it} className="m-body" style={{padding:'4px 0', display:'flex', alignItems:'center', gap:8, fontSize:14, color: i===hl ? 'var(--m-ink)' : 'var(--m-ink-soft)'}}>
                    <span style={{display:'inline-block', width:12, height:12, border:'1px solid var(--m-ink-soft)', background: i===hl ? 'var(--m-ink)' : '#fff', flexShrink:0}}/>
                    {it}
                  </div>
                ))}
              </div>
            ))}
          </aside>

          {/* Results */}
          <div>
            <div className="m-eyebrow" style={{marginBottom:10}}>14 corrispondenze</div>
            {[
              ['Le città invisibili','Italo Calvino',1972,'romanzo','Einaudi',164,'p. 164 letta XX maii'],
              ['Le cosmicomiche','Italo Calvino',1965,'romanzo','Einaudi',192,'aggiunta IX maii'],
              ['Palomar','Italo Calvino',1983,'romanzo','Einaudi',128,'da leggere'],
              ['Se una notte d\'inverno','Italo Calvino',1979,'romanzo','Einaudi',264,'letto due volte'],
              ['Il sentiero dei nidi di ragno','Italo Calvino',1947,'romanzo','Einaudi',176,'letto 2018'],
            ].map((r, i) => (
              <div key={i} style={{display:'grid', gridTemplateColumns:'60px 1fr auto auto', gap:18, alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--m-rule)'}}>
                <BookCover title={r[0]} author={r[1].split(' ').pop()} palette={BOOK_PALETTES[(i+1)%BOOK_PALETTES.length]} w={60} h={86}/>
                <div>
                  <div className="m-serif" style={{fontSize:19}}>{r[0]}</div>
                  <div className="m-marginalia">{r[1]} · {r[2]} · {r[3]} · {r[4]}</div>
                </div>
                <div className="m-nums m-mono" style={{fontSize:12, color:'var(--m-ink-muted)'}}>{r[5]} p.</div>
                <div className="m-marginalia" style={{fontStyle:'italic'}}>{r[6]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WebChrome>
  );
}

/* 11. Wishlist */
function WebWishlist() {
  const items = [
    { t:'Vita di Galileo', a:'Bertolt Brecht', y:1939, why:'citato in Sebald p.214', price:'€ 11,40', shop:'Feltrinelli', p:4 },
    { t:'Le storie di Erodoto', a:'Erodoto', y:'V sec. a.C.', why:'consigliato da R.', price:'€ 28,00', shop:'Adelphi', p:7 },
    { t:'Il libro dell\'inquietudine', a:'F. Pessoa', y:1982, why:'ripreso più volte da Calvino', price:'€ 14,00', shop:'Feltrinelli', p:2 },
    { t:'Hadrians Memoiren', a:'M. Yourcenar', y:1951, why:'edizione originale tedesca', price:'€ 38,00', shop:'antiquario', p:5 },
    { t:'Critica della ragion pura', a:'I. Kant', y:1781, why:'edizione Adelphi 1976', price:'€ 65,00', shop:'usato', p:3 },
    { t:'Lettere a Lucilio', a:'Seneca', y:'I sec.', why:'da affiancare a Marc\'Aurelio', price:'€ 22,00', shop:'BUR', p:5 },
  ];
  return (
    <WebChrome active="Libreria">
      <div style={{padding:'28px 40px', height:'100%', display:'flex', flexDirection:'column', gap:22}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
          <div>
            <div className="m-eyebrow">Desideria · da acquisire</div>
            <div className="m-serif" style={{fontSize:42, fontWeight:500, lineHeight:1.05, marginTop:2}}>Lista dei <em style={{color:'var(--m-terracotta)'}}>desideri</em></div>
            <div className="m-marginalia" style={{marginTop:4}}>libri annotati nei margini, citati da altri libri, scorti in libreria.</div>
          </div>
          <div className="m-mono" style={{fontSize:14}}>totale stimato · € 178,40 · 14 volumi</div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16}}>
          {items.map((b,i) => (
            <div key={i} style={{display:'grid', gridTemplateColumns:'90px 1fr', gap:16, padding:'14px 16px', border:'1px solid var(--m-rule)', background:'rgba(255,255,255,0.22)'}}>
              <BookCover title={b.t} author={b.a.split(' ').pop()} palette={BOOK_PALETTES[b.p]} w={90} h={130}/>
              <div>
                <div className="m-serif" style={{fontSize:19, lineHeight:1.1, fontWeight:500}}>{b.t}</div>
                <div className="m-marginalia">{b.a} · {b.y}</div>
                <div className="m-marginalia" style={{marginTop:8, fontStyle:'italic', color:'var(--m-terracotta)'}}>→ {b.why}</div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:10}}>
                  <span className="m-nums m-mono" style={{fontSize:13}}>{b.price}</span>
                  <span className="m-eyebrow" style={{fontSize:9}}>{b.shop}</span>
                </div>
                <div style={{display:'flex', gap:6, marginTop:8}}>
                  <button className="m-btn" style={{padding:'4px 10px', fontSize:11}}>acquisita</button>
                  <button className="m-btn m-btn-ghost" style={{padding:'4px 10px', fontSize:11}}>nota</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WebChrome>
  );
}

window.WebShelves = WebShelves;
window.WebMap = WebMap;
window.WebNotes = WebNotes;
window.WebGraph = WebGraph;
window.WebAnnales = WebAnnales;
window.WebSearch = WebSearch;
window.WebWishlist = WebWishlist;
