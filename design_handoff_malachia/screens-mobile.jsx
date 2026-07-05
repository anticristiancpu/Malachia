/* Mobile screens (iOS framed) */

function MobileShell({ children, scheme = 'light' }) {
  return (
    <IOSDevice dark={scheme === 'dark'} width={390} height={844}>
      <div style={{height:'100%', overflow:'auto', background: scheme==='dark' ? '#1a140a' : 'var(--m-parchment)'}}>
        {children}
      </div>
    </IOSDevice>
  );
}

function TabBar({ active }) {
  const tabs = [
    ['studio','◇'],
    ['libreria','▦'],
    ['note','✎'],
    ['cerca','⌕'],
    ['io','M'],
  ];
  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0,
      paddingBottom: 26, paddingTop: 8,
      borderTop:'1px solid var(--m-rule)',
      background:'rgba(244,236,216,0.95)',
      backdropFilter:'blur(8px)',
      display:'grid', gridTemplateColumns:'repeat(5,1fr)',
    }}>
      {tabs.map(([t,i]) => {
        const on = t === active;
        return (
          <div key={t} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            color: on ? 'var(--m-terracotta)' : 'var(--m-ink-muted)',
          }}>
            <div style={{fontSize:18, lineHeight:1}}>{i}</div>
            <div style={{fontSize:10, fontVariant:'small-caps', letterSpacing:'.12em'}}>{t}</div>
          </div>
        );
      })}
    </div>
  );
}

/* M1. Mobile Home */
function MobileHome() {
  return (
    <MobileShell>
      <div className="m-parchment" style={{minHeight:'100%', paddingBottom:80}}>
        <div style={{padding:'16px 20px 8px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
            <div className="m-eyebrow">XX maii MMXXVI</div>
            <div style={{display:'flex', gap:10, alignItems:'center'}}>
              <ORN.quill size={16} style={{color:'var(--m-ink-soft)'}}/>
              <div style={{width:28, height:28, background:'var(--m-ink)', color:'var(--m-gold-pale)', fontFamily:"'UnifrakturCook',serif", fontSize:24, display:'flex', alignItems:'center', justifyContent:'center'}}>M</div>
            </div>
          </div>
          <div className="m-serif" style={{fontSize:36, fontWeight:500, lineHeight:1.05, marginTop:6}}>
            Buonasera, <em style={{color:'var(--m-terracotta)'}}>Adso</em>.
          </div>
          <div className="m-marginalia" style={{marginTop:4}}>tre volumi ti aspettano.</div>
        </div>

        {/* In lettura */}
        <div style={{padding:'14px 20px 0'}}>
          <div className="m-eyebrow" style={{marginBottom:8}}>In lettura</div>
          <div style={{display:'flex', gap:14, padding:'14px', border:'1px solid var(--m-rule)', background:'rgba(255,255,255,0.4)'}}>
            <BookCover title="Il nome della rosa" author="Eco" palette={BOOK_PALETTES[0]} w={84} h={120}/>
            <div style={{flex:1}}>
              <div className="m-serif" style={{fontSize:20, lineHeight:1.05, fontWeight:500}}>Il nome della rosa</div>
              <div className="m-marginalia">Umberto Eco</div>
              <div style={{marginTop:10, height:5, background:'rgba(58,42,26,0.15)', position:'relative'}}>
                <div style={{position:'absolute', inset:0, width:'42%', background:'var(--m-terracotta)'}}/>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:5, fontSize:12}} className="m-mono">
                <span>p. 218 / 512</span><span>42%</span>
              </div>
              <button className="m-btn" style={{marginTop:10, padding:'6px 14px', fontSize:12}}>▶ riprendi</button>
            </div>
          </div>

          <div style={{display:'flex', gap:8, marginTop:10}}>
            {[1,4,6].map((p,i) => (
              <div key={i} style={{flex:1, padding:'8px', border:'1px solid var(--m-rule)', display:'flex', gap:8, alignItems:'center'}}>
                <BookCover title="X" author="" palette={BOOK_PALETTES[p]} w={32} h={46}/>
                <div style={{flex:1, minWidth:0}}>
                  <div className="m-serif" style={{fontSize:12, lineHeight:1.05, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{['Austerlitz','Galileo','Cosmic.'][i]}</div>
                  <div style={{height:2, background:'rgba(58,42,26,0.15)', marginTop:4}}>
                    <div style={{height:2, width:[26,18,68][i]+'%', background:'var(--m-terracotta)'}}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div style={{margin:'18px 20px', padding:'14px 16px', borderLeft:'3px solid var(--m-terracotta)', background:'rgba(255,255,255,0.3)'}}>
          <div className="m-eyebrow" style={{marginBottom:6}}>Della giornata</div>
          <div className="m-serif" style={{fontSize:17, fontStyle:'italic', lineHeight:1.4}}>
            "Bisogna leggere molto e poi dimenticare, perché solo allora ci accorgiamo che la lettura è entrata in noi."
          </div>
          <div className="m-marginalia" style={{marginTop:6}}>— Lessico familiare, p. 142</div>
        </div>

        {/* Stats inline */}
        <div style={{margin:'0 20px', padding:'14px 16px', border:'1px solid var(--m-rule)', background:'rgba(122,59,46,0.05)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
            <div className="m-eyebrow">Annales MMXXVI</div>
            <div className="m-marginalia">› dettaglio</div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:8}}>
            <div><div className="m-serif m-nums" style={{fontSize:28, color:'var(--m-terracotta)', lineHeight:1}}>23</div><div className="m-marginalia">volumi</div></div>
            <div><div className="m-serif m-nums" style={{fontSize:28, color:'var(--m-terracotta)', lineHeight:1}}>7.4k</div><div className="m-marginalia">pagine</div></div>
            <div><div className="m-serif m-nums" style={{fontSize:28, color:'var(--m-terracotta)', lineHeight:1}}>47</div><div className="m-marginalia">giorni di fila</div></div>
          </div>
        </div>

        {/* Comodino preview */}
        <div style={{margin:'18px 20px 0'}}>
          <div className="m-eyebrow" style={{marginBottom:8}}>Pila del comodino</div>
          <div style={{display:'flex', gap:8, overflow:'hidden'}}>
            {[2,7,1,5,4].map((p,i) => (
              <div key={i} style={{flexShrink:0}}>
                <BookCover title={['Città','Stoner','Kundera','Agost.','Galileo'][i]} author={['Calvino','Williams','Kundera','S.A.','Brecht'][i]} palette={BOOK_PALETTES[p]} w={70} h={100}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TabBar active="studio"/>
    </MobileShell>
  );
}

/* M2. Mobile Library */
function MobileLibrary() {
  const titles = [
    ['Il nome della rosa','Eco',0],
    ['Austerlitz','Sebald',1],
    ['Memorie di Adriano','Yourcenar',2],
    ['Maestro e Margherita','Bulgakov',3],
    ['Galileo','Brecht',4],
    ['Brevità della vita','Seneca',5],
    ['Cosmicomiche','Calvino',6],
    ['Lessico familiare','Ginzburg',7],
    ['Le città invisibili','Calvino',8],
    ['Stoner','Williams',0],
    ['Confessioni','Agostino',2],
    ['Pendolo','Eco',5],
    ['Se una notte','Calvino',6],
    ['Anna Karenina','Tolstoj',3],
    ['Montagna incantata','Mann',1],
    ['100 anni di solit.','Márquez',7],
    ['La strada','McCarthy',2],
    ['Pastorale','Roth',4],
  ];
  return (
    <MobileShell>
      <div className="m-parchment" style={{minHeight:'100%', paddingBottom:80}}>
        <div style={{padding:'14px 18px 4px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
            <div>
              <div className="m-eyebrow">Capitulum II</div>
              <div className="m-serif" style={{fontSize:30, fontWeight:500, lineHeight:1}}>Libreria</div>
              <div className="m-marginalia">412 volumi</div>
            </div>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <div style={{width:28, height:28, border:'1px solid var(--m-ink-soft)', display:'flex', alignItems:'center', justifyContent:'center'}}>▦</div>
              <div style={{width:28, height:28, border:'1px solid var(--m-rule)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--m-ink-muted)'}}>☰</div>
            </div>
          </div>
          <div style={{marginTop:10, padding:'8px 12px', border:'1px solid var(--m-rule-strong)', background:'rgba(255,255,255,0.4)', display:'flex', gap:10, alignItems:'center'}}>
            <ORN.quill size={13} style={{color:'var(--m-ink-muted)'}}/>
            <span className="m-body" style={{fontStyle:'italic', color:'var(--m-ink-muted)', fontSize:14}}>cerca titolo, autore…</span>
          </div>
          <div style={{display:'flex', gap:6, marginTop:10, overflowX:'auto'}}>
            <span className="m-chip" style={{background:'var(--m-ink)', color:'var(--m-parchment)', borderColor:'var(--m-ink)', flexShrink:0}}>tutti · 412</span>
            <span className="m-chip" style={{flexShrink:0}}>in lettura · 3</span>
            <span className="m-chip" style={{flexShrink:0}}>letti · 287</span>
            <span className="m-chip" style={{flexShrink:0}}>preferiti</span>
            <span className="m-chip" style={{flexShrink:0}}>romanzo</span>
          </div>
        </div>

        <div style={{padding:'14px 18px 0', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'18px 10px'}}>
          {titles.map(([t,a,p],i) => (
            <div key={i} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
              <BookCover title={t} author={a} palette={BOOK_PALETTES[p]} w={96} h={138}/>
              <div className="m-serif" style={{fontSize:11, textAlign:'center', lineHeight:1.1}}>{t}</div>
              <div className="m-marginalia" style={{fontSize:10}}>{a}</div>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="libreria"/>
    </MobileShell>
  );
}

/* M3. Mobile Book Detail */
function MobileBookDetail() {
  return (
    <MobileShell>
      <div className="m-parchment" style={{minHeight:'100%', paddingBottom:80}}>
        {/* Header */}
        <div style={{padding:'14px 18px 6px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span className="m-mono" style={{color:'var(--m-ink-soft)'}}>‹ libreria</span>
          <span className="m-mono" style={{color:'var(--m-ink-soft)'}}>⋯</span>
        </div>

        {/* Cover hero */}
        <div style={{padding:'10px 18px', textAlign:'center'}}>
          <BookCover title="Il nome della rosa" author="U. Eco" palette={BOOK_PALETTES[0]} w={170} h={240}/>
          <div className="m-eyebrow" style={{marginTop:14}}>romanzo · 1980</div>
          <div className="m-serif" style={{fontSize:30, fontWeight:500, lineHeight:1.05, marginTop:4}}>
            Il nome della <em style={{color:'var(--m-terracotta)'}}>rosa</em>
          </div>
          <div className="m-body" style={{fontStyle:'italic', color:'var(--m-ink-muted)'}}>Umberto Eco</div>
        </div>

        {/* Progress */}
        <div style={{margin:'12px 18px', padding:'12px 14px', border:'1px solid var(--m-rule)', background:'rgba(255,255,255,0.3)'}}>
          <div className="m-eyebrow">In lettura · sessione 14</div>
          <div style={{display:'flex', alignItems:'baseline', gap:8, marginTop:4}}>
            <div className="m-serif m-nums" style={{fontSize:32, color:'var(--m-terracotta)', lineHeight:1}}>p. 218</div>
            <div className="m-marginalia">di 512 · 42%</div>
          </div>
          <div style={{height:5, background:'rgba(58,42,26,0.15)', marginTop:8}}>
            <div style={{height:5, width:'42%', background:'var(--m-terracotta)'}}/>
          </div>
          <div style={{display:'flex', gap:8, marginTop:12}}>
            <button className="m-btn" style={{flex:1, justifyContent:'center', padding:'8px'}}>▶ riprendi</button>
            <button className="m-btn m-btn-ghost" style={{padding:'8px 10px'}}>⊕ nota</button>
            <button className="m-btn m-btn-ghost" style={{padding:'8px 10px'}}>♡</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{margin:'4px 18px', display:'flex', gap:0, borderBottom:'1px solid var(--m-rule)'}}>
          {['scheda','note · 27','marca','simili'].map((t,i) => (
            <div key={t} style={{
              flex:1, textAlign:'center', padding:'10px 0',
              fontVariant:'small-caps', letterSpacing:'.12em', fontSize:12,
              color: i===1 ? 'var(--m-ink)' : 'var(--m-ink-muted)',
              borderBottom: i===1 ? '2px solid var(--m-terracotta)' : '2px solid transparent',
              marginBottom:-1,
            }}>{t}</div>
          ))}
        </div>

        {/* Notes */}
        <div style={{padding:'12px 18px', display:'flex', flexDirection:'column', gap:14}}>
          {[
            ['p. 47','"I libri non son fatti per crederci, ma per essere sottoposti a indagine."'],
            ['p. 218','"Stat rosa pristina nomine, nomina nuda tenemus."'],
            ['p. 332','"Il riso libera il villano dalla paura del diavolo."'],
          ].map(([loc,q], i) => (
            <div key={i} style={{padding:'10px 12px', borderLeft:'3px solid var(--m-terracotta)', background:'rgba(255,255,255,0.3)'}}>
              <div className="m-mono" style={{fontSize:11, color:'var(--m-ink-muted)'}}>{loc}</div>
              <div className="m-serif" style={{fontSize:16, fontStyle:'italic', lineHeight:1.35, marginTop:4}}>{q}</div>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="libreria"/>
    </MobileShell>
  );
}

/* M4. Mobile Reading session in-progress */
function MobileReading() {
  return (
    <MobileShell scheme="dark" statusBarBg="#1a140a" statusBarColor="rgba(244,236,216,0.95)">
      <div className="m-parchment-dark" style={{minHeight:'100%', paddingBottom:24, color:'var(--m-parchment)'}}>
        <div style={{padding:'14px 18px 6px', display:'flex', justifyContent:'space-between', alignItems:'center', color:'var(--m-gold-pale)'}}>
          <span className="m-mono">‹ chiudi</span>
          <span className="m-eyebrow m-eyebrow-light">sessione · 47 min</span>
          <span className="m-mono">◌</span>
        </div>

        <div style={{padding:'16px 22px'}}>
          <div className="m-eyebrow m-eyebrow-light">Il nome della rosa · p. 218</div>
          <div className="m-serif" style={{fontSize:24, fontWeight:500, lineHeight:1.05, marginTop:4, color:'var(--m-gold-pale)'}}>
            Primo giorno, <em>nona</em>
          </div>
        </div>

        {/* Page */}
        <div style={{margin:'0 22px', padding:'22px 24px', background:'#251c10', boxShadow:'inset 0 0 0 1px rgba(216,195,137,0.25)'}}>
          <p className="m-dropcap m-body" style={{fontSize:16, lineHeight:1.7, margin:0, color:'#e8dcc4', textWrap:'pretty'}}>
            Sembrava infatti il bibliotecario aver dimenticato che a Salvatore si erano già fatte alcune domande, e che le risposte non erano state tutte
            <span style={{background:'rgba(191,161,90,0.25)', borderBottom:'1px solid var(--m-gold)', padding:'0 2px'}}> soddisfacenti. Stat rosa pristina nomine,</span> aggiunse poi con un sorriso, e sembrava parlasse a sé stesso.
          </p>
        </div>

        {/* Quick note */}
        <div style={{margin:'14px 22px', padding:'12px 14px', border:'1px solid rgba(216,195,137,0.3)', background:'rgba(255,255,255,0.04)'}}>
          <div className="m-eyebrow m-eyebrow-light">Annotazione · p. 218</div>
          <div className="m-serif" style={{fontSize:18, fontStyle:'italic', lineHeight:1.4, marginTop:6, color:'var(--m-parchment)'}}>
            Riprende il verso di Bernardo di Cluny — sarà il finale del romanzo.
          </div>
          <div style={{display:'flex', gap:6, marginTop:10}}>
            <span className="m-chip m-chip-dark">titolo</span>
            <span className="m-chip m-chip-dark">latino</span>
            <span className="m-chip m-chip-dark">+ etichetta</span>
          </div>
        </div>

        {/* Reading controls */}
        <div style={{margin:'14px 22px', padding:'14px 16px', border:'1px solid rgba(216,195,137,0.3)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div className="m-eyebrow m-eyebrow-light">progresso</div>
            <div className="m-serif m-nums" style={{fontSize:24, color:'var(--m-gold-pale)'}}>218 / 512</div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button style={{width:42, height:42, background:'transparent', border:'1px solid var(--m-gold-pale)', color:'var(--m-gold-pale)', fontSize:18}}>−</button>
            <button style={{width:42, height:42, background:'var(--m-gold)', border:'1px solid var(--m-gold)', color:'var(--m-ink)', fontSize:18}}>+</button>
          </div>
        </div>

        <div style={{padding:'0 22px'}}>
          <div style={{height:5, background:'rgba(216,195,137,0.18)', position:'relative'}}>
            <div style={{position:'absolute', inset:0, width:'42%', background:'var(--m-gold)'}}/>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:6}} className="m-mono">
            <span style={{color:'rgba(244,236,216,0.7)', fontSize:11}}>42% · ~3h alla fine</span>
            <span style={{color:'rgba(244,236,216,0.7)', fontSize:11}}>fine stimata XXVIII maii</span>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

/* M5. Mobile Annales wrap */
function MobileAnnales() {
  return (
    <MobileShell scheme="dark" statusBarBg="#1a140a" statusBarColor="rgba(244,236,216,0.95)">
      <div className="m-parchment-dark" style={{minHeight:'100%', paddingBottom:80, color:'var(--m-parchment)'}}>
        <div style={{padding:'14px 18px 6px', textAlign:'center'}}>
          <div className="m-eyebrow m-eyebrow-light">Annales · MMXXVI</div>
          <div className="m-serif" style={{fontSize:36, fontWeight:500, lineHeight:1, marginTop:4, color:'var(--m-parchment)'}}>
            Il tuo <em style={{color:'var(--m-gold-pale)'}}>anno</em>
          </div>
        </div>

        {/* Big number card */}
        <div style={{margin:'14px 20px', padding:'24px 20px', border:'1px solid rgba(216,195,137,0.3)', background:'rgba(255,255,255,0.04)', textAlign:'center'}}>
          <div className="m-eyebrow m-eyebrow-light">volumi conclusi</div>
          <div className="m-serif m-nums" style={{fontSize:140, lineHeight:0.9, color:'var(--m-gold-pale)', margin:'8px 0'}}>23</div>
          <div className="m-marginalia" style={{color:'rgba(244,236,216,0.7)'}}>+8 rispetto al MMXXV</div>
          <div style={{display:'flex', justifyContent:'center', gap:6, marginTop:14}}>
            {[0,1,2,4,6].map(p => <BookCover key={p} title="X" author="" palette={BOOK_PALETTES[p]} w={36} h={52}/>)}
          </div>
        </div>

        {/* Three cards */}
        <div style={{margin:'0 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <div style={{padding:'14px', border:'1px solid rgba(216,195,137,0.3)', background:'rgba(255,255,255,0.04)'}}>
            <div className="m-eyebrow m-eyebrow-light">pagine</div>
            <div className="m-serif m-nums" style={{fontSize:38, color:'var(--m-gold-pale)', lineHeight:1, marginTop:4}}>7.412</div>
          </div>
          <div style={{padding:'14px', border:'1px solid rgba(216,195,137,0.3)', background:'rgba(255,255,255,0.04)'}}>
            <div className="m-eyebrow m-eyebrow-light">ore</div>
            <div className="m-serif m-nums" style={{fontSize:38, color:'var(--m-gold-pale)', lineHeight:1, marginTop:4}}>184</div>
          </div>
          <div style={{padding:'14px', border:'1px solid rgba(216,195,137,0.3)', background:'rgba(255,255,255,0.04)'}}>
            <div className="m-eyebrow m-eyebrow-light">citazioni</div>
            <div className="m-serif m-nums" style={{fontSize:38, color:'var(--m-gold-pale)', lineHeight:1, marginTop:4}}>184</div>
          </div>
          <div style={{padding:'14px', border:'1px solid rgba(216,195,137,0.3)', background:'rgba(255,255,255,0.04)'}}>
            <div className="m-eyebrow m-eyebrow-light">giorni di fila</div>
            <div className="m-serif m-nums" style={{fontSize:38, color:'var(--m-gold-pale)', lineHeight:1, marginTop:4}}>47</div>
          </div>
        </div>

        {/* Top author */}
        <div style={{margin:'14px 20px', padding:'14px 18px', border:'1px solid rgba(216,195,137,0.3)', background:'rgba(255,255,255,0.04)', display:'flex', gap:14, alignItems:'center'}}>
          <Initial letter="C" size={64} color="var(--m-ink)" bg="var(--m-gold)"/>
          <div>
            <div className="m-eyebrow m-eyebrow-light">autore dell'anno</div>
            <div className="m-serif" style={{fontSize:24, fontWeight:500, lineHeight:1}}>Italo Calvino</div>
            <div className="m-marginalia" style={{color:'rgba(244,236,216,0.7)'}}>5 volumi · 42 citazioni</div>
          </div>
        </div>

        {/* Quote */}
        <div style={{margin:'14px 20px', padding:'18px 20px', border:'1px solid rgba(216,195,137,0.3)', background:'rgba(255,255,255,0.04)'}}>
          <div className="m-eyebrow m-eyebrow-light">citazione dell'anno</div>
          <div className="m-serif" style={{fontSize:20, fontStyle:'italic', lineHeight:1.4, marginTop:10, color:'var(--m-parchment)'}}>
            "L'inferno dei viventi non è qualcosa che sarà; se ce n'è uno, è quello che è già qui."
          </div>
          <div className="m-marginalia" style={{color:'rgba(244,236,216,0.7)', marginTop:8}}>— Calvino, Le città invisibili, p. 164</div>
        </div>

        <div style={{margin:'14px 20px'}}>
          <button className="m-btn m-btn-gold" style={{width:'100%', justifyContent:'center'}}>condividi</button>
        </div>
      </div>
    </MobileShell>
  );
}

window.MobileHome = MobileHome;
window.MobileLibrary = MobileLibrary;
window.MobileBookDetail = MobileBookDetail;
window.MobileReading = MobileReading;
window.MobileAnnales = MobileAnnales;
