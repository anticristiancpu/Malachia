/* Cinematic screens, part 4: single-book detail page.
   Layout v2 — inspired by Alone-in-the-Dark style investigation page:
   big book on the left, long flowing text on the right. */

function CineBookDetail() {
  const tabs = [
    {l:'Sinossi', active:true},
    {l:'Frammenti'},
    {l:'Note'},
    {l:'Prestiti'},
    {l:'Storico'},
  ];

  const meta = [
    {k:'Stato',    v:'Da leggere'},
    {k:'Editore',  v:'Newton Compton'},
    {k:'Lingua',   v:'ita'},
    {k:'Anno',     v:'2012'},
    {k:'Pagine',   v:'318'},
    {k:'Formato',  v:'Brossura'},
    {k:'ISBN',     v:'9788854111172'},
  ];

  const IconBtn = ({label, icon, primary}) => (
    <button title={label} aria-label={label} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      gap: primary ? 8 : 0,
      width: primary ? 'auto' : 34, height:34, padding: primary ? '0 14px' : 0,
      background: primary ? 'rgba(216,180,106,0.12)' : 'rgba(0,0,0,0.35)',
      border:'1px solid '+(primary ? 'rgba(216,180,106,0.5)' : 'rgba(216,180,106,0.28)'),
      color: primary ? CINE_GOLD : 'rgba(232,220,192,0.82)',
      cursor:'pointer',
      backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
      fontFamily:"'Cinzel', serif",
      textTransform:'uppercase', letterSpacing:'0.22em', fontSize:11, fontWeight:500,
    }}>{icon}{primary && <span>Nota</span>}</button>
  );

  return (
    <CinematicShell active="Libreria">
      <div style={{padding:'24px 64px 24px', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden'}}>
        {/* Back link */}
        <div style={{marginBottom:8}}>
          <a style={{
            display:'inline-flex', alignItems:'center', gap:8,
            fontFamily:"'Cinzel', serif", textTransform:'uppercase',
            letterSpacing:'0.22em', fontSize:11, color:'rgba(232,220,192,0.65)',
            cursor:'pointer', textDecoration:'none',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2 L3 6 L8 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            Indietro
          </a>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, flex:1, minHeight:0}}>
          {/* LEFT COLUMN — big cover, centred */}
          <div style={{
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            position:'relative', minHeight:0,
          }}>
            {/* Cover */}
            <div style={{
              width:380, height:540,
              background: BOOK_PALETTES[2][0],
              position:'relative',
              boxShadow:
                'inset 0 0 0 1px rgba(0,0,0,0.35), ' +
                'inset 12px 0 0 rgba(0,0,0,0.18), ' +
                '0 18px 60px rgba(0,0,0,0.85), ' +
                '0 0 0 1px rgba(216,180,106,0.12), ' +
                '0 0 80px rgba(216,180,106,0.06)',
              overflow:'hidden',
            }}>
              {/* Inner gold border */}
              <div style={{position:'absolute', inset:'7% 9%', border:'1px solid rgba(216,195,137,0.5)', opacity:0.7}}/>
              {/* Author */}
              <div style={{
                position:'absolute', top:'12%', left:'14%', right:'14%',
                fontFamily:"'Cinzel', serif", textTransform:'uppercase',
                color:CINE_GOLD_DIM, fontSize:16, letterSpacing:'0.22em', fontWeight:500,
                textAlign:'center',
              }}>Saffo</div>
              {/* Title */}
              <div style={{
                position:'absolute', top:'24%', left:'14%', right:'14%',
                fontFamily:"'Cinzel', serif", textTransform:'uppercase',
                color:CINE_CREAM, fontSize:44, letterSpacing:'0.06em', fontWeight:500,
                lineHeight:1, textAlign:'center',
                textShadow:'0 2px 4px rgba(0,0,0,0.65)',
              }}>Poesie</div>
              {/* Diamond + subtitle */}
              <div style={{position:'absolute', top:'40%', left:0, right:0, textAlign:'center'}}>
                <svg width="14" height="14" viewBox="0 0 14 14" style={{color:CINE_GOLD}}>
                  <path d="M7 0 L8 6 L14 7 L8 8 L7 14 L6 8 L0 7 L6 6 Z" fill="currentColor"/>
                </svg>
              </div>
              <div style={{
                position:'absolute', top:'46%', left:'14%', right:'14%',
                fontFamily:"'Agmena Pro', Georgia, serif", fontStyle:'italic',
                color:'rgba(216,195,137,0.85)', fontSize:13,
                textAlign:'center', lineHeight:1.5,
              }}>testo greco a fronte<br/>ediz. integrale</div>
              {/* Publisher footer */}
              <div style={{
                position:'absolute', bottom:'10%', left:'14%', right:'14%',
                fontFamily:"'Cinzel', serif", textTransform:'uppercase',
                color:'rgba(216,195,137,0.65)', fontSize:11, letterSpacing:'0.22em',
                textAlign:'center', fontWeight:500,
              }}>Newton Compton</div>
            </div>

            {/* Action toolbar below the cover */}
            <div style={{display:'flex', gap:8, marginTop:24, alignItems:'center'}}>
              <IconBtn primary label="Nota" icon={
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 2 L6.5 11 M2 6.5 L11 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              }/>
              <IconBtn label="Cambia stato" icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7 L11 7 M3 4 L9 4 M3 10 L11 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              }/>
              <IconBtn label="Aggiungi ai preferiti" icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 12 C 2 8.5 1 5.5 3 4 C 5 2.5 6.5 4 7 5.5 C 7.5 4 9 2.5 11 4 C 13 5.5 12 8.5 7 12 Z"
                        stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
                </svg>
              }/>
              <IconBtn label="Modifica" icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 11 L2 12 L3 12 L11 4 L10 3 Z M9 4 L10 5"
                        stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
                </svg>
              }/>
              <IconBtn label="Stima valore" icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10 4 Q7.5 2.8 5.5 5 Q3.5 7 5.5 9 Q7.5 11 10 9.8 M4 7 L9 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                </svg>
              }/>
              <IconBtn label="Elimina" icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              }/>
            </div>

            {/* Metadata strip — fades in below */}
            <div style={{
              display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'10px 22px',
              marginTop:22, maxWidth:480,
            }}>
              {meta.map((m, i) => (
                <div key={m.k} style={{display:'flex', alignItems:'baseline', gap:8}}>
                  <span style={{
                    fontFamily:"'Cinzel', serif", textTransform:'uppercase',
                    letterSpacing:'0.18em', fontSize:9, color:'rgba(232,220,192,0.5)', fontWeight:500,
                  }}>{m.k}</span>
                  <span style={{
                    fontFamily:"'Agmena Pro', Georgia, serif", fontSize:13,
                    color: m.k === 'Stato' ? CINE_GOLD : CINE_CREAM,
                    textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
                  }}>{m.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — title + scrollable text */}
          <div style={{display:'flex', flexDirection:'column', minHeight:0}}>
            {/* Eyebrow */}
            <div style={{
              fontFamily:"'Cinzel', serif", textTransform:'uppercase',
              letterSpacing:'0.32em', fontSize:11,
              color:CINE_GOLD, fontWeight:500, marginBottom:10,
            }}>Da leggere · classici greci</div>

            {/* Title */}
            <h1 style={{
              fontFamily:"'Cinzel', 'Cormorant Garamond', serif",
              fontSize:46, fontWeight:400, lineHeight:1.05,
              letterSpacing:'0.04em',
              color:CINE_CREAM, textTransform:'uppercase',
              margin:'0 0 14px', maxWidth:560,
              textShadow:'0 2px 0 rgba(0,0,0,0.85), 0 4px 24px rgba(0,0,0,0.6)',
            }}>Poesie. Testo greco a fronte. Ediz. integrale</h1>

            {/* Author */}
            <div style={{
              fontFamily:"'Agmena Pro', Georgia, serif",
              fontStyle:'italic', fontSize:18,
              color:'rgba(232,220,192,0.88)',
              textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
              marginBottom:24,
            }}>di Saffo</div>

            {/* Tabs */}
            <div style={{
              display:'flex', alignItems:'center', gap:0,
              borderBottom:'1px solid rgba(216,180,106,0.18)',
              marginBottom:20,
            }}>
              {tabs.map(t => (
                <div key={t.l} style={{
                  padding:'10px 0', marginRight:32,
                  fontFamily:"'Cinzel', serif", textTransform:'uppercase',
                  letterSpacing:'0.18em', fontSize:12,
                  color: t.active ? CINE_CREAM : 'rgba(232,220,192,0.55)',
                  fontWeight: t.active ? 600 : 500,
                  borderBottom: t.active ? '2px solid '+CINE_VERM : '2px solid transparent',
                  marginBottom:-1, cursor:'pointer',
                  textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
                }}>{t.l}</div>
              ))}
            </div>

            {/* Scrollable body */}
            <div style={{
              flex:1, overflow:'auto', paddingRight:18,
              maskImage:'linear-gradient(180deg, transparent 0%, black 24px, black calc(100% - 36px), transparent 100%)',
              WebkitMaskImage:'linear-gradient(180deg, transparent 0%, black 24px, black calc(100% - 36px), transparent 100%)',
            }}>
              <p style={{
                fontFamily:"'Agmena Pro', Georgia, serif",
                fontSize:17, lineHeight:1.7, fontWeight:400,
                color:'rgba(232,220,192,0.95)', maxWidth:640, margin:'12px 0 24px',
                textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
              }}>
                L'ammirazione per l'ideale di bellezza cantato e il fascino dell'ardente e spregiudicato richiamo dell'amore omosessuale sono forse le cause principali della fama che ha accompagnato il nome di Saffo attraverso i secoli.
              </p>

              <p style={{
                fontFamily:"'Agmena Pro', Georgia, serif",
                fontSize:17, lineHeight:1.7, fontWeight:400,
                color:'rgba(232,220,192,0.92)', maxWidth:640, margin:'0 0 24px',
                textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
              }}>
                I suoi versi nascono in un mondo che ha avuto a lungo il sapore del proibito: il <em style={{color:CINE_GOLD, fontStyle:'italic'}}>"tiaso"</em>, una forma di sodalizio tra giovani donne che Saffo creò attorno a sé a Mitilene, dove, tra canti e danze in onore delle muse, nascevano brucianti passioni e gelosie.
              </p>

              <p style={{
                fontFamily:"'Agmena Pro', Georgia, serif",
                fontSize:17, lineHeight:1.7, fontWeight:400,
                color:'rgba(232,220,192,0.92)', maxWidth:640, margin:'0 0 28px',
                textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
              }}>
                Per Saffo l'amore è lotta, è battaglia, come l'impiego di termini e modi dell'epos omerico nei suoi versi rivelano. Colui e colei che amano e sanno amare sono <span style={{color:CINE_GOLD}}>gli eroi</span>.
              </p>

              {/* Pull-quote / fragment */}
              <div style={{
                borderLeft:'2px solid '+CINE_GOLD_DIM,
                paddingLeft:22, margin:'28px 0 32px', maxWidth:620,
              }}>
                <div style={{
                  fontFamily:"'Agmena Pro', Georgia, serif",
                  fontStyle:'italic', fontSize:20, lineHeight:1.6, fontWeight:400,
                  color:'rgba(232,220,192,0.95)',
                  textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
                }}>
                  "A me pare uguale agli dèi<br/>
                  quell'uomo che siede di fronte a te<br/>
                  e da vicino ti ascolta<br/>
                  mentre dolcemente parli…"
                </div>
                <div style={{
                  fontFamily:"'Cinzel', serif", textTransform:'uppercase',
                  letterSpacing:'0.22em', fontSize:10, color:'rgba(232,220,192,0.55)',
                  fontWeight:500, marginTop:12,
                }}>frammento 31 · Voigt</div>
              </div>

              <p style={{
                fontFamily:"'Agmena Pro', Georgia, serif",
                fontSize:17, lineHeight:1.7, fontWeight:400,
                color:'rgba(232,220,192,0.92)', maxWidth:640, margin:'0 0 24px',
                textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
              }}>
                Tradotti con cura filologica e accompagnati dal testo greco a fronte, i frammenti restituiscono la voce intima e potente di una poetessa che attraversa millenni senza perdere intensità — il dolore, l'estasi, la veglia, il vento di mare.
              </p>

              {/* Footer micro-meta */}
              <div style={{
                display:'flex', gap:34, marginTop:36,
                paddingTop:18, borderTop:'1px solid rgba(216,180,106,0.18)',
              }}>
                <div>
                  <div style={{
                    fontFamily:"'Cinzel', serif", textTransform:'uppercase',
                    letterSpacing:'0.22em', fontSize:10, color:'rgba(232,220,192,0.55)', fontWeight:500,
                  }}>Aggiunto</div>
                  <div style={{
                    fontFamily:"'Agmena Pro', Georgia, serif", fontSize:13,
                    color:CINE_CREAM, marginTop:4,
                    textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
                  }}>XII martii MMXXVI</div>
                </div>
                <div>
                  <div style={{
                    fontFamily:"'Cinzel', serif", textTransform:'uppercase',
                    letterSpacing:'0.22em', fontSize:10, color:'rgba(232,220,192,0.55)', fontWeight:500,
                  }}>Collocazione</div>
                  <div style={{
                    fontFamily:"'Agmena Pro', Georgia, serif", fontSize:13,
                    color:CINE_CREAM, marginTop:4,
                    textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
                  }}>Scaffale III · ripiano 2</div>
                </div>
                <div>
                  <div style={{
                    fontFamily:"'Cinzel', serif", textTransform:'uppercase',
                    letterSpacing:'0.22em', fontSize:10, color:'rgba(232,220,192,0.55)', fontWeight:500,
                  }}>Tag</div>
                  <div style={{
                    fontFamily:"'Agmena Pro', Georgia, serif", fontSize:13,
                    color:CINE_CREAM, marginTop:4, fontStyle:'italic',
                    textShadow:'0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.7)',
                  }}>poesia · classici · greco</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CinematicShell>
  );
}

window.CineBookDetail = CineBookDetail;
