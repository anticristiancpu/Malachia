/* Web screens — set 1: Dashboard, Library, Book detail, Add */

/* Shared app chrome */
function WebChrome({ active = 'Libreria', dark = false, children, w = 1280, h = 880 }) {
  const items = ['Studio', 'Libreria', 'Scaffali', 'Note', 'Mappa', 'Grafo', 'Annales'];
  const isDark = dark;
  return (
    <div className={isDark ? 'm-parchment-dark' : 'm-parchment'} style={{width:w, height:h, display:'grid', gridTemplateColumns:'220px 1fr'}}>
      {/* Sidebar */}
      <aside style={{
        background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(58,42,26,0.06)',
        borderRight: '1px solid ' + (isDark ? 'rgba(216,195,137,0.18)' : 'var(--m-rule)'),
        padding: '24px 18px',
        display:'flex', flexDirection:'column', gap: 18,
      }}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{
            width:34, height:34, background: isDark ? 'var(--m-gold)' : 'var(--m-ink)',
            color: isDark ? 'var(--m-ink)' : 'var(--m-gold-pale)',
            fontFamily:"'UnifrakturCook', serif", fontSize:30, lineHeight:1,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>M</div>
          <div>
            <div className="m-serif" style={{fontSize:22, lineHeight:1, fontWeight:500, color: isDark ? 'var(--m-parchment)' : 'var(--m-ink)'}}>Malachia</div>
            <div className="m-eyebrow" style={{color: isDark ? 'var(--m-gold-pale)' : 'var(--m-ink-muted)', fontSize:9}}>bibliotheca privata</div>
          </div>
        </div>

        <div style={{marginTop:8}}>
          <div className="m-eyebrow" style={{color: isDark ? 'var(--m-gold-pale)' : 'var(--m-ink-muted)', marginBottom:8}}>Sezioni</div>
          {items.map(it => {
            const on = it === active;
            return (
              <div key={it} style={{
                padding:'7px 10px',
                display:'flex', alignItems:'center', gap:8,
                color: on ? (isDark?'var(--m-parchment)':'var(--m-ink)') : (isDark?'rgba(244,236,216,0.7)':'var(--m-ink-soft)'),
                background: on ? (isDark?'rgba(216,195,137,0.10)':'rgba(122,59,46,0.08)') : 'transparent',
                borderLeft: on ? '2px solid var(--m-terracotta)' : '2px solid transparent',
                fontSize:16, fontVariant:'small-caps', letterSpacing:'.06em',
              }}>
                <ORN.diamond size={6} style={{color: on ? 'var(--m-terracotta)' : (isDark?'rgba(216,195,137,0.4)':'var(--m-rule-strong)')}}/> {it}
              </div>
            );
          })}
        </div>

        <div style={{marginTop:'auto', borderTop:'1px solid ' + (isDark?'rgba(216,195,137,0.18)':'var(--m-rule)'), paddingTop:14}}>
          <div className="m-eyebrow" style={{color: isDark ? 'var(--m-gold-pale)' : 'var(--m-ink-muted)', marginBottom:6}}>Scrinia</div>
          {['Filosofia · 84', 'Italiani del ‘900 · 32', 'Manuali · 18', 'Notturni · 11', 'Comodino · 6'].map(s => (
            <div key={s} className="m-body" style={{padding:'4px 0', fontSize:14, color: isDark ? 'rgba(244,236,216,0.8)' : 'var(--m-ink-soft)'}}>{s}</div>
          ))}
        </div>
      </aside>

      <main style={{position:'relative', overflow:'hidden'}}>
        {children}
      </main>
    </div>
  );
}

/* 1. Dashboard / Studio */
function WebDashboard() {
  return (
    <WebChrome active="Studio">
      <div style={{padding:'32px 40px', display:'flex', flexDirection:'column', gap:24, height:'100%'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
          <div>
            <div className="m-eyebrow">Mercoledì · XX maii MMXXVI</div>
            <div className="m-serif" style={{fontSize:46, fontWeight:500, lineHeight:1.05, marginTop:4}}>
              Benvenuto nello <em style={{color:'var(--m-terracotta)'}}>scriptorium</em>.
            </div>
          </div>
          <div style={{display:'flex', gap:10}}>
            <button className="m-btn m-btn-ghost">cerca · ⌘K</button>
            <button className="m-btn">+ aggiungi libro</button>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:28, flex:1, minHeight:0}}>
          {/* Lettura in corso */}
          <section style={{display:'flex', flexDirection:'column', gap:16}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
              <div className="m-eyebrow">In lettura</div>
              <div className="m-marginalia">3 volumi aperti</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'140px 1fr', gap:24, padding:'18px 20px', border:'1px solid var(--m-rule)', background:'rgba(255,255,255,0.25)'}}>
              <BookCover title="Il nome della rosa" author="U. Eco" palette={BOOK_PALETTES[0]} w={140} h={200}/>
              <div>
                <div className="m-eyebrow">romanzo · 1980</div>
                <div className="m-serif" style={{fontSize:30, fontWeight:500, lineHeight:1.05, marginTop:4}}>Il nome della <em>rosa</em></div>
                <div className="m-body" style={{fontStyle:'italic', color:'var(--m-ink-muted)', marginTop:4}}>Umberto Eco</div>
                <div style={{marginTop:14}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:13}} className="m-body">
                    <span>p. 218 di 512</span>
                    <span className="m-nums">42%</span>
                  </div>
                  <div style={{height:6, background:'rgba(58,42,26,0.15)', marginTop:6, position:'relative'}}>
                    <div style={{position:'absolute', inset:0, width:'42%', background:'var(--m-terracotta)'}}/>
                  </div>
                </div>
                <div style={{display:'flex', gap:14, marginTop:16, fontSize:13}} className="m-body">
                  <div>
                    <div className="m-eyebrow" style={{fontSize:9}}>Sessioni</div>
                    <div className="m-nums" style={{fontSize:22}}>14</div>
                  </div>
                  <div>
                    <div className="m-eyebrow" style={{fontSize:9}}>Ore</div>
                    <div className="m-nums" style={{fontSize:22}}>9.4</div>
                  </div>
                  <div>
                    <div className="m-eyebrow" style={{fontSize:9}}>Annotazioni</div>
                    <div className="m-nums" style={{fontSize:22}}>27</div>
                  </div>
                </div>
                <div style={{display:'flex', gap:8, marginTop:14}}>
                  <button className="m-btn">▶ riprendi</button>
                  <button className="m-btn m-btn-ghost">⊕ nota</button>
                </div>
              </div>
            </div>

            <div className="m-eyebrow" style={{marginTop:8}}>Altri volumi aperti</div>
            <div style={{display:'flex', gap:14}}>
              {[1,4,6].map(i => (
                <div key={i} style={{display:'flex', gap:12, alignItems:'center', padding:'10px 12px', border:'1px solid var(--m-rule)', flex:1, background:'rgba(255,255,255,0.18)'}}>
                  <BookCover title={['Austerlitz','Vita di Galileo','Cosmicomiche'][[1,4,6].indexOf(i)]} author={['Sebald','Brecht','Calvino'][[1,4,6].indexOf(i)]} palette={BOOK_PALETTES[i]} w={56} h={80}/>
                  <div style={{flex:1}}>
                    <div className="m-serif" style={{fontSize:16, lineHeight:1.1}}>{['Austerlitz','Vita di Galileo','Cosmicomiche'][[1,4,6].indexOf(i)]}</div>
                    <div className="m-marginalia" style={{marginTop:2}}>p. {[88,42,156][[1,4,6].indexOf(i)]}</div>
                    <div style={{height:3, background:'rgba(58,42,26,0.15)', marginTop:6}}>
                      <div style={{height:3, width:[26,18,68][[1,4,6].indexOf(i)]+'%', background:'var(--m-terracotta)'}}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right column: today / queue / quote */}
          <section style={{display:'flex', flexDirection:'column', gap:18}}>
            <div style={{padding:'18px 20px', border:'1px solid var(--m-rule)', background:'rgba(255,255,255,0.25)'}}>
              <div className="m-eyebrow">Della giornata</div>
              <div className="m-serif" style={{fontSize:22, fontStyle:'italic', lineHeight:1.35, marginTop:8, color:'var(--m-ink-soft)'}}>
                "Bisogna leggere molto e poi dimenticare, perché solo allora ci accorgiamo che la lettura
                è entrata in noi."
              </div>
              <div className="m-marginalia" style={{marginTop:8}}>— da <em>Lessico familiare</em>, p. 142</div>
            </div>

            <div>
              <div className="m-eyebrow" style={{marginBottom:8}}>Prossimi · pila del comodino</div>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {[
                  ['Le città invisibili', 'I. Calvino', '1972'],
                  ['Stoner', 'J. Williams', '1965'],
                  ['L\u2019insostenibile leggerezza', 'M. Kundera', '1984'],
                  ['Confessioni', 'S. Agostino', 'IV sec.'],
                ].map(([t,a,y]) => (
                  <div key={t} style={{display:'flex', alignItems:'center', gap:12, padding:'8px 10px', borderBottom:'1px solid var(--m-rule)'}}>
                    <ORN.diamond size={8} style={{color:'var(--m-gold-deep)'}}/>
                    <div style={{flex:1}}>
                      <div className="m-serif" style={{fontSize:17}}>{t}</div>
                      <div className="m-marginalia">{a} · {y}</div>
                    </div>
                    <div className="m-mono" style={{fontSize:11, color:'var(--m-ink-muted)'}}>‹next›</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{padding:'14px 16px', border:'1px solid var(--m-rule)', background:'rgba(122,59,46,0.06)'}}>
              <div className="m-eyebrow">Questo anno</div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14, marginTop:8}}>
                <div>
                  <div className="m-nums m-serif" style={{fontSize:36, lineHeight:1, color:'var(--m-terracotta)'}}>23</div>
                  <div className="m-marginalia">volumi finiti</div>
                </div>
                <div>
                  <div className="m-nums m-serif" style={{fontSize:36, lineHeight:1, color:'var(--m-terracotta)'}}>7,412</div>
                  <div className="m-marginalia">pagine</div>
                </div>
                <div>
                  <div className="m-nums m-serif" style={{fontSize:36, lineHeight:1, color:'var(--m-terracotta)'}}>184</div>
                  <div className="m-marginalia">citazioni</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </WebChrome>
  );
}

/* 2. Library grid */
function WebLibrary() {
  // generate 36 placeholder books
  const titles = [
    'Il nome della rosa','Austerlitz','Memorie di Adriano','Il Maestro e Margherita',
    'Vita di Galileo','Sulla brevità','Le cosmicomiche','Lessico familiare',
    'Le città invisibili','Stoner','Confessioni','Il pendolo di Foucault',
    'Se una notte d\u2019inverno','Anna Karenina','La montagna incantata','Cent\u2019anni di solitudine',
    'Norwegian Wood','La strada','Pastorale americana','Il giardino dei Finzi-Contini',
    'Walden','Le anime morte','Il deserto dei tartari','Conversazione in Sicilia',
    'Diceria dell\u2019untore','Il sergente nella neve','La luna e i falò','La cognizione del dolore',
    'I Malavoglia','Vita nuova','De rerum natura','Meditazioni',
    'Etica','Critica della ragion','Tractatus','Fenomenologia',
  ];
  const authors = ['Eco','Sebald','Yourcenar','Bulgakov','Brecht','Seneca','Calvino','Ginzburg','Calvino','Williams','Agostino','Eco','Calvino','Tolstoj','Mann','García Márquez','Murakami','McCarthy','Roth','Bassani','Thoreau','Gogol\u2019','Buzzati','Vittorini','Bufalino','Rigoni Stern','Pavese','Gadda','Verga','Dante','Lucrezio','Aurelio','Spinoza','Kant','Wittgenstein','Hegel'];
  return (
    <WebChrome active="Libreria">
      <div style={{padding:'28px 36px', display:'flex', flexDirection:'column', gap:18, height:'100%'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
          <div>
            <div className="m-eyebrow">Capitulum II</div>
            <div className="m-serif" style={{fontSize:38, fontWeight:500, lineHeight:1.05, marginTop:2}}>Libreria <em style={{color:'var(--m-terracotta)'}}>· 412 volumi</em></div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <div style={{padding:'8px 14px', border:'1px solid var(--m-rule-strong)', display:'flex', alignItems:'center', gap:10, width:280}}>
              <ORN.quill size={14} style={{color:'var(--m-ink-muted)'}}/>
              <span className="m-body" style={{color:'var(--m-ink-muted)', fontStyle:'italic'}}>cerca titolo, autore, ISBN…</span>
            </div>
            <button className="m-btn m-btn-ghost">filtra</button>
            <button className="m-btn">+ aggiungi</button>
          </div>
        </div>

        {/* Filter row */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderTop:'1px solid var(--m-rule)', borderBottom:'1px solid var(--m-rule)'}}>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <span className="m-chip" style={{background:'var(--m-ink)', color:'var(--m-parchment)', borderColor:'var(--m-ink)'}}>tutti · 412</span>
            <span className="m-chip">letti · 287</span>
            <span className="m-chip">in lettura · 3</span>
            <span className="m-chip">da leggere · 122</span>
            <span className="m-chip">preferiti · 41</span>
            <span style={{width:1, background:'var(--m-rule)', margin:'0 4px'}}/>
            <span className="m-chip">romanzo</span>
            <span className="m-chip">filosofia</span>
            <span className="m-chip">saggi</span>
            <span className="m-chip">poesia</span>
            <span className="m-chip">+ 12</span>
          </div>
          <div style={{display:'flex', gap:6, alignItems:'center'}} className="m-body">
            <span className="m-eyebrow">ordina ·</span>
            <span className="m-serif" style={{fontStyle:'italic'}}>aggiunti di recente ▾</span>
            <span style={{margin:'0 14px', color:'var(--m-rule-strong)'}}>|</span>
            <span className="m-eyebrow">vista ·</span>
            <span style={{display:'inline-flex', border:'1px solid var(--m-rule-strong)'}}>
              <span style={{padding:'4px 10px', background:'var(--m-ink)', color:'var(--m-parchment)'}}>griglia</span>
              <span style={{padding:'4px 10px'}}>lista</span>
              <span style={{padding:'4px 10px'}}>scaffale</span>
            </span>
          </div>
        </div>

        {/* Grid */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(9, 1fr)', gap:'24px 18px', overflowY:'auto', paddingBottom:20}}>
          {titles.map((t, i) => (
            <div key={i} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
              <BookCover title={t} author={authors[i]} palette={BOOK_PALETTES[i % BOOK_PALETTES.length]} w={100} h={144}/>
              <div className="m-serif" style={{fontSize:13, textAlign:'center', lineHeight:1.15, marginTop:2}}>{t}</div>
              <div className="m-marginalia" style={{fontSize:11}}>{authors[i]}</div>
            </div>
          ))}
        </div>
      </div>
    </WebChrome>
  );
}

/* 3. Book detail */
function WebBookDetail() {
  return (
    <WebChrome active="Libreria">
      <div style={{padding:'28px 40px', display:'grid', gridTemplateColumns:'320px 1fr', gap:40, height:'100%', overflow:'hidden'}}>
        {/* Left: cover & meta */}
        <aside style={{display:'flex', flexDirection:'column', gap:18}}>
          <BookCover title="Il nome della rosa" author="U. Eco" palette={BOOK_PALETTES[0]} w={320} h={460}/>
          <div style={{display:'flex', gap:8}}>
            <button className="m-btn" style={{flex:1, justifyContent:'center'}}>▶ riprendi</button>
            <button className="m-btn m-btn-ghost">⊕</button>
            <button className="m-btn m-btn-ghost">♡</button>
          </div>
          <div style={{borderTop:'1px solid var(--m-rule)', paddingTop:14}}>
            <div className="m-eyebrow" style={{marginBottom:8}}>Dati bibliografici</div>
            <dl className="m-body" style={{fontSize:14, margin:0, display:'grid', gridTemplateColumns:'auto 1fr', gap:'6px 14px'}}>
              <dt style={{color:'var(--m-ink-muted)'}}>autore</dt><dd style={{margin:0}}>Umberto Eco</dd>
              <dt style={{color:'var(--m-ink-muted)'}}>anno</dt><dd style={{margin:0} } className="m-nums">1980</dd>
              <dt style={{color:'var(--m-ink-muted)'}}>editore</dt><dd style={{margin:0}}>Bompiani</dd>
              <dt style={{color:'var(--m-ink-muted)'}}>pagine</dt><dd style={{margin:0}} className="m-nums">512</dd>
              <dt style={{color:'var(--m-ink-muted)'}}>lingua</dt><dd style={{margin:0}}>italiano</dd>
              <dt style={{color:'var(--m-ink-muted)'}}>ISBN</dt><dd style={{margin:0}} className="m-mono">978-88-452-0705-2</dd>
              <dt style={{color:'var(--m-ink-muted)'}}>collocazione</dt><dd style={{margin:0}}>Scaffale B · ripiano 3</dd>
            </dl>
          </div>

          <div>
            <div className="m-eyebrow" style={{marginBottom:8}}>Etichette</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
              <span className="m-chip">romanzo</span>
              <span className="m-chip">medievale</span>
              <span className="m-chip">giallo</span>
              <span className="m-chip">semiotica</span>
              <span className="m-chip" style={{background:'var(--m-terracotta)', color:'var(--m-parchment)', borderColor:'var(--m-terracotta)'}}>preferito</span>
            </div>
          </div>
        </aside>

        {/* Right: content */}
        <div style={{overflow:'auto', paddingRight:8}}>
          <div className="m-eyebrow">Romanzo · 1980 · letto 2 volte</div>
          <div className="m-serif" style={{fontSize:60, fontWeight:500, lineHeight:1, marginTop:6}}>
            Il nome della <em style={{color:'var(--m-terracotta)'}}>rosa</em>
          </div>
          <div className="m-body" style={{fontSize:20, fontStyle:'italic', color:'var(--m-ink-muted)', marginTop:4}}>Umberto Eco</div>

          {/* Progress */}
          <div style={{marginTop:20, padding:'14px 18px', background:'rgba(255,255,255,0.25)', border:'1px solid var(--m-rule)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
              <div className="m-eyebrow">In lettura · sessione 14</div>
              <div className="m-mono" style={{fontSize:12}}>iniziato il IV maii — stimato fine il XXVIII maii</div>
            </div>
            <div style={{display:'flex', alignItems:'baseline', gap:12, marginTop:6}}>
              <div className="m-serif m-nums" style={{fontSize:40, color:'var(--m-terracotta)'}}>p. 218</div>
              <div className="m-marginalia">di 512 · 42%</div>
            </div>
            <div style={{height:6, background:'rgba(58,42,26,0.15)', marginTop:8, position:'relative'}}>
              <div style={{position:'absolute', inset:0, width:'42%', background:'var(--m-terracotta)'}}/>
              <div style={{position:'absolute', top:-4, bottom:-4, left:'42%', width:1, background:'var(--m-ink)'}}/>
            </div>
          </div>

          {/* Synopsis */}
          <div style={{marginTop:24}}>
            <Heading kicker="Sinossi" title="L'abbazia," italic="i delitti, la biblioteca"/>
            <p className="m-dropcap m-body" style={{fontSize:17, lineHeight:1.65, marginTop:10}}>
              Nel novembre del 1327, il francescano Guglielmo da Baskerville e il suo novizio Adso giungono
              in un'abbazia benedettina dell'Italia settentrionale. Sette giorni, sette morti, e una biblioteca
              labirintica che custodisce un libro proibito di Aristotele. Un giallo medievale travestito da
              trattato di semiotica — o viceversa.
            </p>
          </div>

          {/* Notes preview */}
          <div style={{marginTop:24}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
              <Heading kicker="Marginalia · 27 annotazioni" title="Note" italic="& citazioni"/>
              <button className="m-btn m-btn-ghost">tutte ›</button>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14}}>
              {[
                ['p. 47', '"I libri non son fatti per crederci, ma per essere sottoposti a indagine."', 'Sentenza che varrà come tesi del romanzo.'],
                ['p. 218', '"Stat rosa pristina nomine, nomina nuda tenemus."', 'Verso di Bernardo di Cluny — riprende il titolo.'],
                ['p. 332', '"Il riso libera il villano dalla paura del diavolo."', 'Argomento di Jorge contro la commedia.'],
                ['p. 411', '"L\u2019ordine che la nostra mente immagina è come una rete."', 'Guglielmo rinuncia all\u2019ordine totale.'],
              ].map(([loc, q, gloss], i) => (
                <div key={i} style={{padding:'12px 14px', borderLeft:'3px solid var(--m-terracotta)', background:'rgba(255,255,255,0.25)'}}>
                  <div className="m-mono" style={{fontSize:11, color:'var(--m-ink-muted)'}}>{loc}</div>
                  <div className="m-serif" style={{fontSize:17, fontStyle:'italic', lineHeight:1.4, marginTop:6}}>{q}</div>
                  <div className="m-marginalia" style={{marginTop:6}}>{gloss}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WebChrome>
  );
}

/* 4. Add book */
function WebAdd() {
  return (
    <WebChrome active="Libreria">
      <div style={{padding:'40px 60px', display:'grid', gridTemplateColumns:'1fr 380px', gap:48, height:'100%'}}>
        <div>
          <div className="m-eyebrow">Nuovo ingresso · ad bibliothecam</div>
          <div className="m-serif" style={{fontSize:46, fontWeight:500, lineHeight:1.05, marginTop:4}}>
            Aggiungi un <em style={{color:'var(--m-terracotta)'}}>volume</em>
          </div>
          <p className="m-marginalia" style={{maxWidth:520, marginTop:8, fontSize:14}}>
            Scansiona il codice a barre, cerca per titolo o autore, oppure
            inserisci a mano un libro che gli archivi digitali non conoscono.
          </p>

          {/* Three intake methods */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14, marginTop:30}}>
            {[
              ['scansiona ISBN', 'fotografa il codice a barre', '◫'],
              ['cerca online', 'titolo · autore · ISBN', '⌕'],
              ['a mano', 'per i libri introvabili', '✎'],
            ].map(([t,s,icon], i) => (
              <div key={t} style={{
                padding:'24px 18px', textAlign:'center',
                border: i===1 ? '1px solid var(--m-terracotta)' : '1px solid var(--m-rule-strong)',
                background: i===1 ? 'rgba(122,59,46,0.06)' : 'rgba(255,255,255,0.2)',
                position:'relative',
              }}>
                <div style={{fontSize:36, color: i===1?'var(--m-terracotta)':'var(--m-ink-soft)', lineHeight:1}}>{icon}</div>
                <div className="m-serif" style={{fontSize:22, fontWeight:500, marginTop:8}}>{t}</div>
                <div className="m-marginalia" style={{marginTop:4}}>{s}</div>
              </div>
            ))}
          </div>

          {/* Search input */}
          <div style={{marginTop:22, padding:'14px 18px', border:'1px solid var(--m-ink-soft)', background:'#fff', display:'flex', alignItems:'center', gap:14}}>
            <ORN.quill size={20} style={{color:'var(--m-ink-soft)'}}/>
            <input style={{flex:1, border:0, outline:0, background:'transparent', fontFamily:"'EB Garamond', serif", fontSize:20, color:'var(--m-ink)'}} defaultValue="Le città invisibili" />
            <span className="m-mono" style={{fontSize:11, color:'var(--m-ink-muted)'}}>⏎ cerca</span>
          </div>

          {/* Results */}
          <div className="m-eyebrow" style={{marginTop:24, marginBottom:10}}>Risultati · 4 corrispondenze</div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {[
              ['Le città invisibili', 'Italo Calvino', '1972', 'Einaudi', '978-88-06-12345-6', true],
              ['Le città invisibili', 'Italo Calvino', '1993', 'Mondadori, ed. economica', '978-88-04-12345-6', false],
              ['Cities & invisibles', 'AA.VV.', '2014', 'Mimesis', '978-88-575-2345-6', false],
              ['Calvino: an introduction', 'M. McLaughlin', '1998', 'Edinburgh UP', '978-07-486-1234-5', false],
            ].map(([t,a,y,p,isbn,first], i) => (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'60px 1fr auto', gap:16, alignItems:'center',
                padding:'12px 16px',
                border: first ? '1px solid var(--m-terracotta)' : '1px solid var(--m-rule)',
                background:'rgba(255,255,255,0.22)',
              }}>
                <BookCover title={t} author={a.split(' ').pop()} palette={BOOK_PALETTES[(i+2) % BOOK_PALETTES.length]} w={60} h={88}/>
                <div>
                  <div className="m-serif" style={{fontSize:20, fontWeight:500}}>{t}</div>
                  <div className="m-body" style={{fontStyle:'italic', color:'var(--m-ink-muted)', fontSize:14}}>{a} · {y} · {p}</div>
                  <div className="m-mono" style={{fontSize:11, color:'var(--m-ink-muted)', marginTop:2}}>{isbn}</div>
                </div>
                <button className={"m-btn " + (first?"":"m-btn-ghost")}>{first ? '+ aggiungi' : 'aggiungi'}</button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: meta form */}
        <aside style={{borderLeft:'1px solid var(--m-rule)', paddingLeft:32}}>
          <div className="m-eyebrow">Anteprima inserimento</div>
          <BookCover title="Le città invisibili" author="Calvino" palette={BOOK_PALETTES[6]} w={200} h={290}/>
          <div className="m-serif" style={{fontSize:24, fontWeight:500, lineHeight:1.1, marginTop:14}}>Le città invisibili</div>
          <div className="m-body" style={{fontStyle:'italic', color:'var(--m-ink-muted)'}}>Italo Calvino · 1972</div>

          <div style={{marginTop:18, display:'flex', flexDirection:'column', gap:12}}>
            {[
              ['Stato iniziale', 'da leggere'],
              ['Scaffale', 'Italiani del ‘900'],
              ['Collocazione', 'Scaffale B · ripiano 2'],
              ['Etichette', 'romanzo, fantastico'],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="m-eyebrow" style={{fontSize:10}}>{l}</div>
                <div style={{padding:'6px 0', borderBottom:'1px solid var(--m-rule)', display:'flex', justifyContent:'space-between'}}>
                  <span className="m-serif" style={{fontSize:17}}>{v}</span>
                  <span className="m-marginalia">modifica</span>
                </div>
              </div>
            ))}
          </div>

          <button className="m-btn" style={{marginTop:20, width:'100%', justifyContent:'center'}}>conferma ingresso</button>
        </aside>
      </div>
    </WebChrome>
  );
}

window.WebDashboard = WebDashboard;
window.WebLibrary = WebLibrary;
window.WebBookDetail = WebBookDetail;
window.WebAdd = WebAdd;
window.WebChrome = WebChrome;
