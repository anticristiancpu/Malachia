import React, { useState, useMemo, useRef, useCallback } from 'react';

/* ══════════════════════════════════════════════════════════════════════════
   Sistema di collocazione — pagina di consultazione.
   Riferimento stabile del criterio: quali sezioni esistono, come si decide
   dove va un libro, come lo schema si traduce sugli scaffali.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Stili condivisi ──────────────────────────────────────────────────────── */
const cinzel = (size, tracking = '0.18em', color = 'var(--cine-cream)', weight = 500) => ({
  fontFamily: "'Cinzel', 'Mantinia', serif", textTransform: 'uppercase',
  letterSpacing: tracking, fontSize: size, fontWeight: weight, color, lineHeight: 1.2,
});
const serif = { fontFamily: "'Agmena Pro', 'EB Garamond', Georgia, serif" };
const mono  = { fontFamily: "'JetBrains Mono', 'Courier New', monospace" };

const BORDER  = '1px solid var(--cine-border)';
const BORDER2 = '1px solid var(--cine-border-strong)';
const PANEL   = 'rgba(20,14,7,0.55)';
const GOLD    = 'var(--cine-gold)';
const CREAM   = 'var(--cine-cream)';
const DIM     = 'rgba(232,220,192,0.70)';
const MUTE    = 'rgba(232,220,192,0.52)';

/* ── Le sette discipline, con le loro sottosezioni ────────────────────────── */
const DISCIPLINE = [
  { key: 'storia', label: 'Storia', tiers: [
      { name: 'della civiltà', note: 'mentalità · cultura · idee' },
      { name: 'degli eventi',  note: 'guerre · istituzioni · diplomazia' },
      { name: 'geografia',     note: 'atlanti · geografia storica' },
  ]},
  { key: 'filosofia', label: 'Filosofia' },
  { key: 'sociali', label: 'Scienze Sociali', tiers: [
      { name: 'politica',   note: 'teoria e dottrine politiche' },
      { name: 'economia',   note: 'teoria economica · storia economica' },
      { name: 'sociologia', note: 'società · istituzioni · movimenti' },
      { name: 'psicologia', note: 'psicoanalisi · scienze della mente' },
  ]},
  { key: 'religioni', label: 'Antropologia, Religioni, Esoterismo', tiers: [
      { name: 'antropologia', note: 'etnologia · folklore · miti e riti' },
      { name: 'religioni',    note: 'teologia · mistica · storia delle chiese' },
      { name: 'esoterismo',   note: 'magia · alchimia · astrologia · gnosi' },
  ]},
  { key: 'scienze', label: 'Scienze' },
  { key: 'arti', label: 'Arti', sub: 'Spettacolo' },
  { key: 'lettere', label: 'Linguaggio e Letteratura', tiers: [
      { name: 'linguistica', note: 'filologia · teoria del linguaggio' },
      { name: 'narrativa',   note: '' },
      { name: 'teatro',      note: '' },
      { name: 'poesia',      note: '' },
  ]},
];

/* ── Le quattro Grandi Ere ────────────────────────────────────────────────── */
const ERE = [
  { id: 'antichita', numeral: 'I', title: 'Antichità', range: 'fino al 476 d.C.', periodi: [
      { name: 'Generale', generale: true, note: "opere sull'intera Antichità" },
      { name: 'Vicino Oriente antico ed Egitto' },
      { name: 'Grecia antica', range: 'fino al 31 a.C.' },
      { name: 'Roma antica', range: 'dalle origini al 476 d.C.' },
  ]},
  { id: 'medioevo', numeral: 'II', title: 'Medioevo', range: '476–1400', periodi: [
      { name: 'Generale', generale: true, note: "opere sull'intero Medioevo" },
      { name: 'Alto Medioevo', range: '476–1000' },
      { name: 'Basso Medioevo', range: '1000–1400' },
  ]},
  { id: 'modernita', numeral: 'III', title: 'Modernità', range: '1400–1815', periodi: [
      { name: 'Generale', generale: true, note: "opere sull'intera Modernità" },
      { name: 'Rinascimento e prima Età Moderna', range: '1400–1650' },
      { name: 'Antico Regime e Illuminismo', range: '1650–1789' },
      { name: 'Rivoluzione Francese ed Età Napoleonica', range: '1789–1815' },
  ]},
  { id: 'contemporanea', numeral: 'IV', title: 'Età Contemporanea', range: 'dal Congresso di Vienna, 1815–oggi', periodi: [
      { name: 'Generale', generale: true, note: "opere sull'intera Età Contemporanea" },
      { name: 'Restaurazione e Ottocento', range: '1815–1900' },
      { name: 'Prima metà del Novecento', range: '1900–1945' },
      { name: 'Seconda metà del Novecento', range: '1945–1989' },
      { name: 'Età recente', range: '1989–oggi' },
  ]},
];

const TRASVERSALI = [
  'Opere di riferimento generali (enciclopedie, dizionari, atlanti)',
  'Storia della civiltà generale',
  'Storia degli eventi generale',
  'Geografia generale',
  'Filosofia generale',
  'Scienze Sociali generali (politica · economia · sociologia · psicologia)',
  'Antropologia generale',
  'Religioni generali',
  'Esoterismo generale',
  'Scienze generali',
  'Arti generali',
  'Linguaggio e Letteratura generali',
  'Riviste e periodici — ordinate per testata',
];

const PERCORSO = [
  { q: "È un'opera di servizio?", stop: true,
    a: "Introduzione, invito alla lettura, manuale, guida, biografia divulgativa. Va <em>sotto l'autore trattato</em>, quale che sia la firma in copertina." },
  { q: 'È una fonte?', stop: true,
    a: "Testo originale, edizione, traduzione, epistolario. Va per la <em>data reale di composizione</em>: il Corpus Hermeticum sta in Antichità, non nel Rinascimento che lo riscopre." },
  { q: 'Ricostruisce un passato o pensa con un autore?',
    a: "Storiografia → periodo trattato. Opera teorica → periodo del proprio autore. Nel dubbio: <em>toglieresti questo libro dalla bibliografia sul suo autore?</em> Se no, sta con lui." },
  { q: 'Il suo autore è un residente?',
    a: 'Sì → va con lui, e non si smembra fra i filosofi di cui ha scritto. No → va sotto il filosofo trattato, nella letteratura critica.' },
  { q: 'Quale disciplina?',
    a: "Se l'autore è un residente, quella del suo baricentro — un autore, una disciplina. Altrimenti quella dell'oggetto del libro." },
  { q: 'La sezione esiste sullo scaffale?',
    a: 'Sì → collocalo. No → sezione <em>Generale</em> della sua Grande Era, annotando la cella nel catalogo.' },
];

const REGOLE = [
  { tag: 'Criterio di datazione', p: "Tre casi, non uno. La <strong>storiografia</strong> va nel periodo che ricostruisce: un saggio del 2020 su Platone sta nell'Antichità. L'<strong>opera teorica</strong> va col proprio autore: <em>Pour Marx</em> di Althusser sta nel secondo Novecento, non nell'Ottocento. <strong>Manuali e introduzioni</strong> stanno col soggetto trattato, perché è lì che si cercano." },
  { tag: 'Il test', p: "Nel dubbio fra le prime due: <strong>toglieresti questo libro dalla bibliografia sul suo autore?</strong> Se no, sta con lui. Heller sui bisogni in Marx si legge come Heller; <em>Karl Marx. La vita e l'opera</em> si legge per Marx." },
  { tag: 'Fonti e studi', p: "Le <strong>fonti</strong> si collocano per la data reale di composizione, gli studi per il periodo che ricostruiscono. Il Corpus Hermeticum sta in Antichità; Ficino che lo traduce e Yates che ne racconta la fortuna stanno nel Rinascimento. <strong>La ricezione non si colloca: la documentano gli studi.</strong>" },
  { tag: 'Un autore, una disciplina', p: "Un autore sta <strong>interamente in una sola disciplina</strong>, scelta per il suo baricentro, anche quando singole opere sconfinerebbero. Marx tutto in Filosofia, <em>Il Capitale</em> e il <em>18 Brumaio</em> compresi. Lo stesso per Gramsci, Weber, Foucault." },
  { tag: 'Storia: civiltà o eventi', p: "Dentro la colonna Storia, <strong>la storia della civiltà precede quella degli eventi</strong>. Nella prima: mentalità, cultura, clima intellettuale di un'epoca — i libri che riguardano un periodo ma nessuna disciplina in particolare. Nella seconda: politica, guerre, istituzioni, geografia storica." },
  { tag: 'Ordine dentro la cella', p: "L'alfabeto è per <strong>autore residente</strong>: il pensatore che appartiene a quel periodo e di cui si raccoglie l'opera. Sotto ciascun nome la sequenza è fissa — opere complete, opere singole, traduzioni, epistolari, biografia, letteratura critica. In testa alla cella, manuali e repertori del periodo." },
  { tag: 'Principio di autorità', p: "Un libro sta col suo autore <strong>se il suo autore ha una sede</strong>. I <em>Tre studi su Hegel</em> stanno con Adorno, <em>Spinoza e il problema dell'espressione</em> con Deleuze. Un autore non si smembra mai fra le sezioni dei filosofi di cui ha scritto." },
  { tag: 'Chi è un interprete', p: "Prima il <strong>genere</strong>: introduzioni, inviti alla lettura, manuali e biografie di servizio vanno sempre sotto il filosofo trattato, quale che sia la firma. Poi l'<strong>autorità</strong>: fra le monografie, va col proprio autore quella che vale come contributo teorico autonomo, va col soggetto quella che vale come commento." },
  { tag: 'Elenco dei residenti', p: "Il giudizio si dà <strong>sull'autore, una volta sola, e si annota</strong>. Un nome entra nell'elenco quando se ne vuole raccogliere l'opera, non quando è celebre; da quel momento ogni suo libro lo segue senza riaprire la questione. Chi non è nell'elenco è un interprete." },
  { tag: 'Rimandi', p: "La letteratura su un filosofo si divide fra la sua sezione e quelle dei residenti che ne hanno scritto. Sotto i nomi che attirano più commento — Hegel, Marx, Nietzsche, Spinoza, Heidegger — un <strong>cartoncino di rimando</strong> indica dove cercare il resto." },
  { tag: 'Soglia di apertura', p: "Una cella <strong>si materializza sullo scaffale solo sopra i dieci volumi</strong>. Sotto quella soglia i libri risalgono alla sezione Generale della propria Grande Era. La griglia resta intera come mappa; le etichette seguono i libri, non la simmetria." },
  { tag: 'Riviste', p: "Le riviste e i periodici seguono un ordine a parte: <strong>alfabetico per testata</strong>, e per numero/data all'interno di ciascuna." },
];

const SEQUENZA = ['opere complete', 'opere scelte', 'opere singole, per titolo', 'traduzioni', 'epistolari e carteggi', 'biografia', 'letteratura critica'];

const SPAZIO = [
  { t: 'Una linea continua', p: "Ripiano per ripiano dall'alto in basso, ogni ripiano da sinistra a destra, scaffali nel verso in cui percorri la stanza. <strong>Nessun salto:</strong> una collocazione mobile funziona solo se puoi intercalare, e lo slittamento ha bisogno di una sequenza senza interruzioni." },
  { t: 'Due terzi, non uniformi', p: "Un metro lineare regge 40–45 brossure da pieno, <strong>circa 30 a densità di lavoro</strong>. Il vuoto va concentrato dove la crescita è attesa — Ottocento e Novecento — non distribuito in parti uguali." },
  { t: 'Taglia fra le ere', p: "Il passaggio da un mobile al successivo va fatto <strong>al confine di Grande Era</strong>, mai in mezzo a una disciplina. Ogni era che comincia in cima a uno scaffale diventa un oggetto riconoscibile a distanza." },
  { t: 'Etichette sul ripiano', p: "Sul bordo del ripiano, <strong>mai sul dorso</strong>: reversibili, gratuite, non danneggiano le brossure. Divisorie verticali per marcare il cambio di disciplina." },
  { t: 'Cartoncini di rimando', p: "Sotto i nomi che attirano più letteratura secondaria — Hegel, Marx, Nietzsche, Spinoza, Heidegger — un cartoncino indica dove sta il resto. È la contromisura alla dispersione che il principio di autorità produce." },
  { t: 'Fuori formato a parte', p: "Cataloghi d'arte, atlanti, grandi opere: sequenza separata su ripiani più alti. Tenerli in linea costringerebbe a regolare <strong>tutti</strong> i ripiani sull'altezza del volume più alto." },
];

const CATALOGO = [
  { t: "L'autore", p: "Senza un campo autore il quarto livello del sistema <strong>non è eseguibile</strong>. È il prerequisito di tutto il resto." },
  { t: 'La collocazione, fino al ripiano', p: "Stanza, scaffale, ripiano. <strong>Non la posizione dentro il ripiano:</strong> cambia a ogni intercalazione e costerebbe decine di aggiornamenti per ogni libro comprato. Un ripiano si scorre in tre secondi." },
  { t: 'Le appartenenze multiple', p: "Periodi, discipline, figure, correnti: tutto ciò che la collocazione fisica ha dovuto sacrificare. Un tag <em>marxismo</em>, un tag <em>hegel</em>. È qui che i tagli trasversali diventano possibili senza spostare un libro." },
  { t: 'Il registro delle decisioni', p: "Poche righe con i casi già risolti: <em>Marx → Filosofia</em>, <em>Habermas → periodo dell'autore</em>, <em>Croce → residente</em>. Impedisce che le scelte si contraddicano a distanza di due anni." },
];

/* ── Testo con enfasi (contenuto statico, redatto qui) ────────────────────── */
const Rich = ({ html, style }) => <span style={style} dangerouslySetInnerHTML={{ __html: html }} />;

/* ── Elenco delle sottosezioni di una disciplina ──────────────────────────── */
function Tiers({ tiers, evidenzia }) {
  return (
    <div style={{
      margin: '6px 0 2px 3px', paddingLeft: 11,
      borderLeft: `1px solid ${evidenzia ? 'var(--cine-gold-dim)' : 'var(--cine-border)'}`,
      display: 'flex', flexDirection: 'column', gap: 5,
    }}>
      {tiers.map(t => (
        <div key={t.name} style={{ display: 'flex', alignItems: 'baseline', gap: 7, fontSize: 13.5 }}>
          <span style={{ width: 7, height: 1, background: 'var(--cine-gold-dim)', flex: 'none', transform: 'translateY(-4px)' }}/>
          <span style={{ ...serif, color: 'rgba(232,220,192,0.84)' }}>{t.name}</span>
          {t.note && <span style={{ ...serif, color: MUTE, fontSize: 12.5, fontStyle: 'italic' }}>{t.note}</span>}
        </div>
      ))}
    </div>
  );
}

/* ── Scheda di un sotto-periodo ───────────────────────────────────────────── */
function SchedaPeriodo({ periodo, disciplinaAttiva }) {
  return (
    <div style={{
      background: periodo.generale ? 'transparent' : PANEL,
      border: periodo.generale ? '1px dashed var(--cine-border-strong)' : BORDER,
      padding: '20px 20px 18px',
    }}>
      <div className="m-serif" style={{ fontSize: 18, fontWeight: 500, color: CREAM, lineHeight: 1.25 }}>
        {periodo.name}
      </div>
      {periodo.range && <div style={{ ...mono, fontSize: 13, color: GOLD, marginTop: 3 }}>{periodo.range}</div>}
      {periodo.note && <div style={{ ...serif, fontSize: 15, fontStyle: 'italic', color: MUTE, marginTop: 4 }}>{periodo.note}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, paddingTop: 12, borderTop: BORDER }}>
        {DISCIPLINE.map(d => {
          const spenta = disciplinaAttiva && d.key !== disciplinaAttiva;
          const accesa = disciplinaAttiva && d.key === disciplinaAttiva;
          return (
            <div key={d.key} style={{ opacity: spenta ? 0.26 : 1, transition: 'opacity 150ms' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 15 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flex: 'none',
                  background: accesa ? GOLD : 'var(--cine-gold-dim)',
                }}/>
                <span style={{ ...serif, color: accesa ? GOLD : CREAM, fontWeight: accesa ? 600 : 400 }}>{d.label}</span>
                {d.sub && <span style={{ ...serif, color: MUTE, fontSize: 13 }}>— {d.sub}</span>}
              </div>
              {d.tiers && <Tiers tiers={d.tiers} evidenzia={accesa}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Pannello ─────────────────────────────────────────────────────────────── */
function Pannello({ titolo, nota, children, accento }) {
  return (
    <div style={{
      border: accento ? '1px solid var(--cine-gold-dim)' : BORDER,
      background: accento
        ? 'linear-gradient(160deg, rgba(216,180,106,0.10), transparent 60%), ' + PANEL
        : PANEL,
      padding: '26px 26px 24px',
    }}>
      <div className="m-serif" style={{ fontSize: 22, fontWeight: 500, color: CREAM, marginBottom: 6 }}>{titolo}</div>
      {nota && <div style={{ ...serif, fontSize: 15, color: DIM, lineHeight: 1.65, marginBottom: 16 }}>{nota}</div>}
      {children}
    </div>
  );
}

/* ── Titolo di sezione ────────────────────────────────────────────────────── */
const Titolo = ({ children, top = 60 }) => (
  <div className="m-serif" style={{
    fontSize: 24, fontWeight: 500, color: CREAM,
    marginTop: top, marginBottom: 4, paddingBottom: 12, borderBottom: BORDER,
  }}>{children}</div>
);

/* ── Griglia di voci con titolo e testo ───────────────────────────────────── */
const GrigliaVoci = ({ voci, pallino }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '26px 38px', marginTop: 22 }}>
    {voci.map(v => (
      <div key={v.t}>
        <div className="m-serif" style={{ fontSize: 18, fontWeight: 500, color: CREAM, marginBottom: 6 }}>
          {pallino && <span style={{ color: GOLD, fontSize: 11, marginRight: 7, verticalAlign: 'middle' }}>▪</span>}
          {v.t}
        </div>
        <Rich html={v.p} style={{ ...serif, fontSize: 15, lineHeight: 1.72, color: DIM, display: 'block' }}/>
      </div>
    ))}
  </div>
);

/* ══ Pagina ═══════════════════════════════════════════════════════════════ */
export default function Sistema() {
  const [ricerca, setRicerca]       = useState('');
  const [disciplina, setDisciplina] = useState(null);
  const [chiuse, setChiuse]         = useState(() => new Set());
  const eraRefs = useRef({});

  const q = ricerca.trim().toLowerCase();

  // Sotto-periodi visibili per ciascuna era, secondo la ricerca
  const visibili = useMemo(() => {
    const out = {};
    for (const era of ERE) {
      out[era.id] = era.periodi.filter(p =>
        !q || `${p.name} ${p.range || ''}`.toLowerCase().includes(q));
    }
    return out;
  }, [q]);

  const totVisibili = Object.values(visibili).reduce((n, l) => n + l.length, 0);
  const totPeriodi  = ERE.reduce((n, e) => n + e.periodi.length, 0);
  const filtriAttivi = !!(disciplina || q);

  const toggleEra = useCallback(id => {
    setChiuse(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const vaiAllEra = id => eraRefs.current[id]?.scrollIntoView({ block: 'start', behavior: 'smooth' });

  return (
    <div style={{ padding: '30px 44px 90px' }}>

      {/* ── Intestazione ── */}
      <div style={{ paddingBottom: 22, borderBottom: BORDER }}>
        <div style={{ ...cinzel(12, '0.24em', GOLD), display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 15.5 }}>❦</span> Catalogo personale
        </div>
        <div className="m-serif" style={{ fontSize: 48, fontWeight: 500, lineHeight: 1.05, marginTop: 8, color: CREAM }}>
          Sistema di collocazione
        </div>
        <div style={{ ...serif, fontSize: 18, lineHeight: 1.72, color: DIM, maxWidth: 900, marginTop: 12 }}>
          Grande Era → sotto-periodo → disciplina → sottosezione → autore residente.
          Sedici sotto-periodi per sette discipline, articolate in diciassette sottosezioni.
          Dentro ogni sezione i libri si raccolgono attorno ai pensatori di cui si colleziona
          l'opera; tutto il resto si dispone attorno al filosofo di cui tratta.
        </div>
      </div>

      {/* ── Console: ricerca, discipline, ere ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--cine-bg)', paddingTop: 16, paddingBottom: 12, marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={ricerca} onChange={e => setRicerca(e.target.value)}
            placeholder="cerca un sotto-periodo o un intervallo d'anni…"
            style={{
              ...serif, fontSize: 16, padding: '11px 14px', flex: '1 1 260px', minWidth: 220,
              background: 'rgba(0,0,0,0.32)', border: BORDER, color: CREAM, outline: 'none',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {DISCIPLINE.map(d => {
              const attiva = disciplina === d.key;
              return (
                <button key={d.key}
                  onClick={() => setDisciplina(attiva ? null : d.key)}
                  style={{
                    ...serif, fontSize: 15, padding: '8px 15px', cursor: 'pointer',
                    background: attiva ? GOLD : 'transparent',
                    border: `1px solid ${attiva ? GOLD : 'var(--cine-border)'}`,
                    color: attiva ? '#17100a' : DIM,
                    fontWeight: attiva ? 600 : 400, whiteSpace: 'nowrap',
                    transition: 'all 150ms',
                  }}>{d.label}</button>
              );
            })}
          </div>
          {filtriAttivi && (
            <button onClick={() => { setDisciplina(null); setRicerca(''); }}
              style={{ ...mono, fontSize: 13, background: 'none', border: 'none', color: DIM,
                cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, padding: '6px 2px' }}>
              azzera filtri
            </button>
          )}
        </div>

        {/* Nastro delle Grandi Ere */}
        <div style={{ display: 'flex', border: BORDER, marginTop: 14 }}>
          {ERE.map((era, i) => (
            <button key={era.id} onClick={() => vaiAllEra(era.id)}
              style={{
                flex: '1 1 0', background: PANEL, cursor: 'pointer', textAlign: 'left',
                border: 'none', borderRight: i < ERE.length - 1 ? BORDER : 'none',
                padding: '14px 16px', transition: 'background 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(216,180,106,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = PANEL; }}>
              <span style={{ ...mono, fontSize: 12.5, color: GOLD, display: 'block', marginBottom: 3 }}>{era.numeral}</span>
              <span className="m-serif" style={{ fontSize: 17, color: CREAM, display: 'block' }}>{era.title}</span>
              <span style={{ ...mono, fontSize: 12, color: MUTE, display: 'block', marginTop: 2 }}>{era.range}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Le quattro Grandi Ere ── */}
      {ERE.map(era => {
        const periodi = visibili[era.id];
        if (!periodi.length) return null;
        const chiusa = chiuse.has(era.id);
        return (
          <section key={era.id} ref={el => { eraRefs.current[era.id] = el; }}
            style={{ marginTop: 46, scrollMarginTop: 150 }}>
            <div onClick={() => toggleEra(era.id)}
              style={{
                display: 'flex', alignItems: 'baseline', gap: 15, cursor: 'pointer',
                userSelect: 'none', paddingBottom: 12, borderBottom: BORDER2, marginBottom: 20,
              }}>
              <span className="m-serif" style={{
                fontSize: 17, color: GOLD, border: '1px solid var(--cine-gold-dim)',
                width: 35, height: 35, borderRadius: '50%', flex: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
              }}>{era.numeral}</span>
              <span className="m-serif" style={{ fontSize: 31, fontWeight: 500, color: CREAM, flex: 1 }}>{era.title}</span>
              <span style={{ ...mono, fontSize: 14, color: MUTE }}>{era.range}</span>
              <span style={{
                border: BORDER, color: DIM, width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
                alignSelf: 'center', fontSize: 13,
                transform: chiusa ? 'rotate(-90deg)' : 'none', transition: 'transform 200ms',
              }}>⌃</span>
            </div>
            {!chiusa && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 18 }}>
                {periodi.map(p => (
                  <SchedaPeriodo key={p.name} periodo={p} disciplinaAttiva={disciplina}/>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {totVisibili === 0 && (
        <div style={{ ...serif, fontStyle: 'italic', color: MUTE, textAlign: 'center', padding: '50px 0', fontSize: 17 }}>
          Nessun sotto-periodo corrisponde alla ricerca.
        </div>
      )}

      {/* ── Trasversale e nuovi acquisti ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 20, marginTop: 56 }}>
        <Pannello titolo="Sezione trasversale"
          nota="Opere che attraversano più Grandi Ere, o l'intera storia, e non appartengono a un sotto-periodo preciso.">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {TRASVERSALI.map((t, i) => (
              <div key={t} style={{
                display: 'flex', gap: 12, alignItems: 'baseline', padding: '13px 0',
                borderBottom: i < TRASVERSALI.length - 1 ? BORDER : 'none',
              }}>
                <span style={{ ...mono, fontSize: 12.5, color: GOLD, flex: 'none', width: 20 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ ...serif, fontSize: 15.5, color: 'rgba(232,220,192,0.88)' }}>{t}</span>
              </div>
            ))}
          </div>
        </Pannello>

        <Pannello accento titolo="✦ Scaffale «Nuovi acquisti»"
          nota="Zona cuscinetto per i libri appena arrivati, prima della collocazione definitiva.">
          <div style={{ ...serif, fontSize: 15, color: DIM, lineHeight: 1.72, paddingTop: 14, borderTop: '1px dashed var(--cine-border)' }}>
            <strong style={{ color: CREAM }}>Ordine:</strong> per data di acquisizione, non alfabetico — è una zona di transito.
            <br/><br/>
            <strong style={{ color: CREAM }}>Ricollocazione:</strong> a cadenza periodica, spostando ogni titolo nella sua sezione definitiva.
          </div>
        </Pannello>
      </div>

      {/* ── Guida ── */}
      <div style={{ marginTop: 78, paddingTop: 30, borderTop: BORDER }}>
        <div style={cinzel(12, '0.24em', GOLD)}>Guida</div>
        <div className="m-serif" style={{ fontSize: 34, fontWeight: 500, color: CREAM, margin: '10px 0 8px' }}>
          Dove va questo libro
        </div>
        <div style={{ ...serif, fontSize: 17, lineHeight: 1.7, color: DIM, maxWidth: 880 }}>
          Sei domande, in quest'ordine. La prima che dà una risposta chiude la questione.
        </div>

        <ol style={{
          listStyle: 'none', margin: '30px 0 0', padding: '0 0 0 36px',
          borderLeft: BORDER, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000,
        }}>
          {PERCORSO.map((f, i) => (
            <li key={f.q} style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: -50, top: -1, width: 29, height: 29,
                border: '1px solid var(--cine-gold-dim)', borderRadius: '50%',
                background: 'var(--cine-bg)', color: GOLD, ...mono, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{i + 1}</span>
              <span className="m-serif" style={{ fontSize: 20, color: CREAM, display: 'block', marginBottom: 5 }}>
                {f.q}
                {f.stop && <span style={{ ...mono, fontSize: 12, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 8 }}>fine</span>}
              </span>
              <Rich html={f.a} style={{ ...serif, fontSize: 15.5, lineHeight: 1.72, color: DIM, display: 'block' }}/>
            </li>
          ))}
        </ol>

        <div style={{
          margin: '30px 0 0', padding: '20px 24px', maxWidth: 1000,
          border: '1px dashed var(--cine-gold-dim)', ...serif,
          fontSize: 16, lineHeight: 1.72, color: DIM,
        }}>
          Se al termine restano due collocazioni ugualmente difendibili, scegline una, scrivila
          nel registro delle decisioni e registra l'altra come tag.{' '}
          <strong style={{ color: CREAM }}>Lo scaffale realizza un ordine solo; il catalogo ne consente infiniti.</strong>
        </div>

        <Titolo>Le regole</Titolo>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px 38px', marginTop: 22 }}>
          {REGOLE.map(r => (
            <div key={r.tag}>
              <div style={{ ...cinzel(11.5, '0.14em', GOLD), marginBottom: 8 }}>{r.tag}</div>
              <Rich html={r.p} style={{ ...serif, fontSize: 15.5, lineHeight: 1.72, color: DIM, display: 'block' }}/>
            </div>
          ))}
        </div>

        <Titolo>Ordine dentro la sezione</Titolo>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,1fr)', gap: 32, marginTop: 22, alignItems: 'start' }}>
          <div style={{ ...serif, fontSize: 15.5, lineHeight: 1.7, color: DIM }}>
            <p style={{ margin: '0 0 12px' }}>
              <strong style={{ color: CREAM }}>In testa</strong> gli strumenti di quel periodo e di quella
              disciplina: dizionari, repertori, storie generali, antologie.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: CREAM }}>Poi i residenti</strong>, in ordine alfabetico. Sotto ciascun
              nome la sequenza è fissa, ed è presa dalla classe B della Library of Congress: applicata alla
              lettera restituisce il dossier completo di un pensatore invece di una fila casuale di cognomi.
            </p>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, border: BORDER, background: PANEL }}>
            {SEQUENZA.map((s, i) => (
              <li key={s} style={{
                display: 'flex', gap: 12, alignItems: 'baseline', padding: '12px 18px',
                borderBottom: i < SEQUENZA.length - 1 ? BORDER : 'none',
                ...serif, fontSize: 15.5, color: 'rgba(232,220,192,0.88)',
              }}>
                <span style={{ ...mono, fontSize: 12.5, color: GOLD, flex: 'none' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        <Titolo>Dallo schema allo spazio</Titolo>
        <GrigliaVoci voci={SPAZIO}/>

        <Titolo>Il catalogo</Titolo>
        <GrigliaVoci voci={CATALOGO} pallino/>
      </div>

      {/* ── Piede ── */}
      <div style={{
        marginTop: 60, paddingTop: 18, borderTop: BORDER, ...mono, fontSize: 13, color: MUTE,
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <span>Biblioteca personale — riferimento di consultazione</span>
        <span>{totVisibili} sotto-periodi visibili su {totPeriodi}</span>
      </div>
    </div>
  );
}
