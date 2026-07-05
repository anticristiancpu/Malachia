/* Brand & system overview screens */

function BrandMark() {
  return (
    <div className="m-parchment" style={{width:1200, height:760, padding:'60px 80px', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <div className="m-eyebrow">Codex · I</div>
        <div className="m-folio">folium I</div>
      </div>

      <div style={{display:'flex', alignItems:'center', gap:60}}>
        {/* Big M */}
        <div style={{
          width:280, height:280,
          background:'var(--m-ink)',
          color:'var(--m-gold-pale)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'UnifrakturCook', serif",
          fontSize:240,
          lineHeight:1,
          boxShadow:'inset 0 0 0 6px var(--m-parchment), inset 0 0 0 8px var(--m-gold-deep)',
          position:'relative',
        }}>
          M
          <ORN.fleuron size={20} style={{position:'absolute', top:12, left:12, color:'var(--m-gold)'}}/>
          <ORN.fleuron size={20} style={{position:'absolute', top:12, right:12, color:'var(--m-gold)'}}/>
          <ORN.fleuron size={20} style={{position:'absolute', bottom:12, left:12, color:'var(--m-gold)'}}/>
          <ORN.fleuron size={20} style={{position:'absolute', bottom:12, right:12, color:'var(--m-gold)'}}/>
        </div>

        <div style={{flex:1}}>
          <div className="m-eyebrow" style={{marginBottom:14}}>Bibliotheca Privata · MMXXVI</div>
          <div className="m-serif" style={{fontSize:120, lineHeight:0.95, fontWeight:500, letterSpacing:'-0.01em'}}>Malachia</div>
          <div className="m-serif" style={{fontSize:26, fontStyle:'italic', color:'var(--m-terracotta)', marginTop:8}}>custode dei tuoi libri</div>
          <div style={{marginTop:24, maxWidth:520}} className="m-body">
            <p className="m-dropcap" style={{fontSize:17, lineHeight:1.6, color:'var(--m-ink-soft)', margin:0}}>
              Una biblioteca personale meritava un bibliotecario paziente. Malachia cataloga,
              ricorda, ritrova — e veglia sui margini dei tuoi libri come un monaco amanuense
              veglia sui suoi codici.
            </p>
          </div>
          <div style={{marginTop:28, display:'flex', gap:10}}>
            <div className="m-chip"><ORN.diamond/> volumina</div>
            <div className="m-chip"><ORN.diamond/> notae</div>
            <div className="m-chip"><ORN.diamond/> scrinia</div>
            <div className="m-chip"><ORN.diamond/> indices</div>
          </div>
        </div>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div className="m-marginalia">— "Bibliothecarius non quaerit librum: liber bibliothecarium quaerit."</div>
        <ORN.fleuron size={18} style={{color:'var(--m-terracotta)'}}/>
      </div>
    </div>
  );
}

function System() {
  const swatches = [
    ['Pergamena', '#f4ecd8', 'parchment'],
    ['Pergamena scura', '#ebe0c4', 'parchment-2'],
    ['Inchiostro', '#2a1d10', 'ink'],
    ['Legno', '#3a2a1a', 'wood'],
    ['Cotto', '#7a3b2e', 'terracotta'],
    ['Vermiglio', '#a83a26', 'vermilion'],
    ['Oro', '#bfa15a', 'gold'],
    ['Lapislazzulo', '#2a3a5a', 'lapis'],
  ];

  return (
    <div className="m-parchment" style={{width:1200, height:900, padding:'48px 64px', display:'flex', flexDirection:'column', gap:24}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <Heading kicker="Capitulum II · Sistema visivo" title="Pigmenti," italic="caratteri & ornamenti"/>
        <div className="m-folio">folium II</div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:48}}>
        {/* Palette */}
        <div>
          <div className="m-eyebrow" style={{marginBottom:10}}>Pigmenti</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
            {swatches.map(([name, hex, key]) => (
              <div key={key}>
                <div style={{height:90, background:hex, boxShadow:'inset 0 0 0 1px var(--m-rule-strong)'}}/>
                <div className="m-body" style={{fontSize:13, marginTop:6}}>{name}</div>
                <div className="m-mono" style={{fontSize:10, color:'var(--m-ink-muted)'}}>{hex}</div>
              </div>
            ))}
          </div>

          <div className="m-eyebrow" style={{marginTop:24, marginBottom:10}}>Ornamenti</div>
          <div style={{display:'flex', gap:24, alignItems:'center', padding:'12px 16px', border:'1px solid var(--m-rule)', background:'rgba(255,255,255,0.2)'}}>
            <ORN.fleuron size={28} style={{color:'var(--m-terracotta)'}}/>
            <ORN.cross size={26} style={{color:'var(--m-gold-deep)'}}/>
            <ORN.diamond size={14} style={{color:'var(--m-ink-soft)'}}/>
            <ORN.quill size={26} style={{color:'var(--m-ink-soft)'}}/>
            <div style={{flex:1}}>
              <ORN.rule style={{color:'var(--m-terracotta)'}}/>
            </div>
          </div>

          <div className="m-eyebrow" style={{marginTop:24, marginBottom:10}}>Cataloghi (chips)</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
            <span className="m-chip"><ORN.diamond/> romanzo</span>
            <span className="m-chip"><ORN.diamond/> filosofia</span>
            <span className="m-chip"><ORN.diamond/> da leggere</span>
            <span className="m-chip"><ORN.diamond/> in lettura</span>
            <span className="m-chip" style={{background:'var(--m-terracotta)', color:'var(--m-parchment)', borderColor:'var(--m-terracotta)'}}>preferito</span>
          </div>

          <div className="m-eyebrow" style={{marginTop:24, marginBottom:10}}>Pulsanti</div>
          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <button className="m-btn">aggiungi libro</button>
            <button className="m-btn m-btn-ghost">cerca</button>
            <button className="m-btn m-btn-gold">apri scaffale</button>
          </div>
        </div>

        {/* Tipografia */}
        <div>
          <div className="m-eyebrow" style={{marginBottom:10}}>Caratteri</div>
          <div style={{borderTop:'1px solid var(--m-rule)', borderBottom:'1px solid var(--m-rule)', padding:'18px 0'}}>
            <div style={{fontFamily:"'UnifrakturCook', serif", fontSize:64, color:'var(--m-vermilion)', lineHeight:1}}>Malachia</div>
            <div className="m-mono" style={{fontSize:11, color:'var(--m-ink-muted)', marginTop:6}}>UnifrakturCook · solo wordmark & capilettera</div>
          </div>
          <div style={{borderBottom:'1px solid var(--m-rule)', padding:'18px 0'}}>
            <div className="m-serif" style={{fontSize:48, lineHeight:1.05, fontWeight:500}}>Cormorant Garamond</div>
            <div className="m-serif" style={{fontSize:24, fontStyle:'italic', color:'var(--m-terracotta)'}}>titoli, sezioni, copertine</div>
            <div className="m-mono" style={{fontSize:11, color:'var(--m-ink-muted)', marginTop:6}}>300 · 400 · 500 · 600 · italics</div>
          </div>
          <div style={{borderBottom:'1px solid var(--m-rule)', padding:'18px 0'}}>
            <div className="m-body" style={{fontSize:18, lineHeight:1.55}}>
              EB Garamond per il corpo — Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </div>
            <div className="m-mono" style={{fontSize:11, color:'var(--m-ink-muted)', marginTop:6}}>EB Garamond · 16–18 px corpo</div>
          </div>
          <div style={{padding:'18px 0'}}>
            <div className="m-mono" style={{fontSize:14}}>978-88-452-1234-5 · MMXXVI · 384 p.</div>
            <div className="m-mono" style={{fontSize:11, color:'var(--m-ink-muted)', marginTop:6}}>JetBrains Mono · ISBN, dati, metadata</div>
          </div>
        </div>
      </div>

      <ORN.rule style={{color:'var(--m-terracotta)'}}/>
    </div>
  );
}

function Covers() {
  const titles = [
    ['Il Pendolo', 'Eco', 0],
    ['Austerlitz', 'Sebald', 1],
    ['Memorie di Adriano', 'Yourcenar', 2],
    ['Il Maestro e Margherita', 'Bulgakov', 3],
    ['Vita di Galileo', 'Brecht', 4],
    ['Sulla brevità della vita', 'Seneca', 5],
    ['Le cosmicomiche', 'Calvino', 6],
    ['Lessico familiare', 'Ginzburg', 7],
  ];
  return (
    <div className="m-parchment" style={{width:1200, height:680, padding:'48px 64px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <Heading kicker="Capitulum III · Copertine" title="Capilettera" italic="& miniature"/>
        <div className="m-folio">folium III</div>
      </div>

      <div className="m-eyebrow" style={{marginTop:24, marginBottom:14}}>Variante monastica · capilettera miniati</div>
      <div style={{display:'flex', gap:18, flexWrap:'wrap'}}>
        {titles.map(([t,a,p]) => <BookCover key={t} title={t} author={a} palette={BOOK_PALETTES[p]} w={120} h={170}/>) }
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:36, marginTop:30}}>
        <div>
          <div className="m-eyebrow" style={{marginBottom:14}}>Variante minimale</div>
          <div style={{display:'flex', gap:14}}>
            {titles.slice(0,4).map(([t,a,p]) => <BookCover key={t} variant="minimal" title={t} author={a} palette={BOOK_PALETTES[p]} w={110} h={155}/>) }
          </div>
        </div>
        <div>
          <div className="m-eyebrow" style={{marginBottom:14}}>Variante illustrata</div>
          <div style={{display:'flex', gap:14}}>
            {titles.slice(4,8).map(([t,a,p]) => <BookCover key={t} variant="illustrated" title={t} author={a} palette={BOOK_PALETTES[p]} w={110} h={155}/>) }
          </div>
        </div>
      </div>
    </div>
  );
}

window.BrandMark = BrandMark;
window.System = System;
window.Covers = Covers;
