import React, { useState, useRef, useEffect, useMemo } from 'react';
import BookCover from './BookCover.jsx';
import { tipoRecord } from './EbookMark.jsx';

/* Lo scaffale guardato di fronte: le copertine affiancate, tutte della stessa
   altezza, appoggiate su un ripiano. Le regole di riordino e i menu sono gli
   stessi della vista a elenco: qui cambia solo come si vede.

   Le righe vanno a capo da sole. Poiché ogni cella è alta esattamente quanto
   una copertina, il passo verticale è costante: il ripiano si disegna una
   volta sola come sfondo che si ripete, invece di contare le righe a mano. */

const SPAZIO_X = 14;   // fra una copertina e l'altra
const SPAZIO_Y = 34;   // fra una riga e la successiva: ci sta il ripiano
const SPESSORE = 3;    // del ripiano
const STACCO = 5;      // fra il piede della copertina e il ripiano
const MARGINE = 600;   // quanto prima del bordo si disegna una copertina

/* ── la proporzione vera di una copertina ───────────────────────────────────
   Le copertine devono stare tutte alla stessa altezza e prendersi la larghezza
   che gli spetta. BookCover disegna un riquadro fisso con l'immagine "contain"
   dentro: se il riquadro ha la proporzione sbagliata la copertina resta più
   bassa e non appoggia sul ripiano. Quindi la misuriamo una volta e ce la
   ricordiamo, così cambiando l'altezza col cursore non si rimisura nulla. */
const PROPORZIONI = new Map();          // url -> larghezza / altezza
const PROPORZIONE_PREDEFINITA = 0.66;   // un libro medio, finché non sappiamo
const MIN_PROP = 0.40, MAX_PROP = 1.15; // oltre questi limiti è un dato storto

function useProporzione(url) {
  const [prop, setProp] = useState(() =>
    (url && PROPORZIONI.get(url)) || PROPORZIONE_PREDEFINITA);

  useEffect(() => {
    if (!url) { setProp(PROPORZIONE_PREDEFINITA); return; }
    const nota = PROPORZIONI.get(url);
    if (nota) { setProp(nota); return; }
    let vivo = true;
    const img = new Image();
    img.onload = () => {
      if (!img.naturalHeight) return;
      const p = Math.min(Math.max(img.naturalWidth / img.naturalHeight, MIN_PROP), MAX_PROP);
      PROPORZIONI.set(url, p);
      if (vivo) setProp(p);
    };
    img.src = url;                       // già in cache: il browser non riscarica
    return () => { vivo = false; };
  }, [url]);

  return prop;
}

/* ── una copertina si disegna solo quando sta per entrare in pagina ──────────
   Lo spazio è riservato subito, così niente salta mentre si scorre.          */
function QuandoVisibile({ larghezza, altezza, children }) {
  const [vista, setVista] = useState(false);
  const rif = useRef(null);

  useEffect(() => {
    if (vista || !rif.current) return;

    /* Un controllo a mano, subito: l'osservatore non segnala niente finché la
       pagina non viene disegnata (scheda in secondo piano, finestra coperta),
       e senza questo si resterebbe con i segnaposti. */
    const vicino = () => {
      const r = rif.current?.getBoundingClientRect();
      if (!r) return false;
      return r.top < window.innerHeight + MARGINE && r.bottom > -MARGINE;
    };
    if (vicino()) { setVista(true); return; }

    if (typeof IntersectionObserver === 'undefined') { setVista(true); return; }
    const osservatore = new IntersectionObserver(([voce]) => {
      if (voce.isIntersecting) { setVista(true); osservatore.disconnect(); }
    }, { rootMargin: `${MARGINE}px 0px` });
    osservatore.observe(rif.current);

    const alloScorrere = () => { if (vicino()) { setVista(true); osservatore.disconnect(); } };
    window.addEventListener('scroll', alloScorrere, { passive: true, capture: true });
    return () => {
      osservatore.disconnect();
      window.removeEventListener('scroll', alloScorrere, { capture: true });
    };
  }, [vista]);

  return (
    <div ref={rif} style={{ width: larghezza, height: altezza }}>
      {vista ? children : (
        <div style={{
          width: '100%', height: '100%',
          background: 'rgba(232,220,192,0.05)',
          border: '1px solid rgba(232,220,192,0.08)',
        }}/>
      )}
    </div>
  );
}

/* ── mentre si trascina, la pagina scorre da sola vicino ai bordi ─────────── */
function useScorrimentoAutomatico(attivo) {
  useEffect(() => {
    if (!attivo) return;
    const SOGLIA = 90, PASSO = 18;
    let fermo = null;

    const contenitore = () => {
      let e = document.querySelector('main') || document.scrollingElement;
      return e;
    };
    const muovi = (y) => {
      const c = contenitore();
      if (!c) return;
      const r = c.getBoundingClientRect ? c.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
      const alto = y - Math.max(r.top, 0) < SOGLIA;
      const basso = Math.min(r.bottom, window.innerHeight) - y < SOGLIA;
      clearInterval(fermo);
      if (!alto && !basso) return;
      fermo = setInterval(() => { c.scrollTop += alto ? -PASSO : PASSO; }, 16);
    };
    const suTrascinamento = (e) => muovi(e.clientY);
    const stop = () => clearInterval(fermo);

    document.addEventListener('dragover', suTrascinamento);
    document.addEventListener('drop', stop);
    document.addEventListener('dragend', stop);
    return () => {
      clearInterval(fermo);
      document.removeEventListener('dragover', suTrascinamento);
      document.removeEventListener('drop', stop);
      document.removeEventListener('dragend', stop);
    };
  }, [attivo]);
}

/* ── l'etichetta che compare passando sopra una copertina ─────────────────── */
function Etichetta({ libro, versoDestra }) {
  const autori = libro.author_names
    ? libro.author_names.split(';').map(s => s.trim()).filter(Boolean).join(', ')
    : '';
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute', bottom: 'calc(100% + 8px)',
        [versoDestra ? 'left' : 'right']: 0,
        zIndex: 40, width: 'max-content', maxWidth: 'min(260px, 78vw)',
        background: 'var(--m-parchment, #f2ead7)',
        border: '1px solid var(--m-rule)',
        boxShadow: '0 6px 22px rgba(0,0,0,0.38)',
        padding: '8px 11px', pointerEvents: 'auto',
      }}>
      {autori && (
        <div className="m-eyebrow" style={{ fontSize: 9, marginBottom: 3, lineHeight: 1.3 }}>{autori}</div>
      )}
      <div className="m-serif" style={{ fontSize: 13.5, lineHeight: 1.25, color: 'var(--m-ink)' }}>
        {libro.title}
      </div>
      {libro.year && (
        <div className="m-marginalia" style={{ fontSize: 11, marginTop: 2 }}>{libro.year}</div>
      )}
      {libro.ebook?.link_lettore && (
        <a
          className="m-btn m-btn-ghost m-btn-sm"
          href={libro.ebook.link_lettore} target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ fontSize: 10, marginTop: 7, display: 'inline-block', textDecoration: 'none' }}>
          Apri in BookOrbit ↗
        </a>
      )}
      {libro.ebook?.orfano && (
        <div className="m-marginalia" style={{ fontSize: 10.5, marginTop: 6, color: '#b2543f' }}>
          non è più in BookOrbit
        </div>
      )}
    </div>
  );
}

/* ── il cartellino di una sezione, come una linguetta sul ripiano ──────────
   Si rinomina con un doppio clic, si sposta trascinandola e, se è una sezione
   vera, si elimina. Quella dei record senza sezione non si può eliminare: è
   il posto dove vivono, e non avrebbero dove andare.                        */
function Linguetta({ sezione, base, nome, conteggio, altezza, sorvolata, inTrascinamento,
                    onRinomina, onElimina,
                    onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop }) {
  const [modifica, setModifica] = useState(null);   // null = non sto rinominando
  const [sopra, setSopra] = useState(false);
  const alta = Math.min(altezza, 56);

  const salva = () => {
    const v = (modifica || '').trim();
    setModifica(null);
    if (v && v !== nome) onRinomina(v);
  };

  return (
    <div
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      onMouseEnter={() => setSopra(true)} onMouseLeave={() => setSopra(false)}
      style={{
        height: altezza, display: 'flex', alignItems: 'flex-end', flexShrink: 0,
        position: 'relative', opacity: inTrascinamento ? 0.4 : 1,
      }}>
      <div
        draggable={modifica === null}
        onDragStart={onDragStart} onDragEnd={onDragEnd}
        onDoubleClick={() => setModifica(nome)}
        title="doppio clic per rinominare, trascina per spostare"
        style={{
          height: alta, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 13px 0 10px', maxWidth: 200, cursor: modifica === null ? 'grab' : 'text',
          background: sorvolata ? 'rgba(191,161,88,0.26)' : 'rgba(232,220,192,0.07)',
          borderLeft: '3px solid var(--cine-gold)',
          borderTop: '1px solid rgba(232,220,192,0.16)',
          borderBottom: '1px solid rgba(232,220,192,0.16)',
          // la punta che sporge verso le copertine
          clipPath: 'polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%)',
        }}>
        {modifica === null ? (
          <>
            <div className="m-eyebrow" style={{
              fontSize: 10, lineHeight: 1.2, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 168,
            }}>{nome}</div>
            <div className="m-marginalia" style={{ fontSize: 10, marginTop: 1 }}>
              {conteggio} {conteggio === 1 ? 'volume' : 'volumi'}
            </div>
          </>
        ) : (
          <input
            autoFocus value={modifica}
            onChange={e => setModifica(e.target.value)}
            onBlur={salva}
            onKeyDown={e => {
              if (e.key === 'Enter') salva();
              if (e.key === 'Escape') setModifica(null);
            }}
            style={{
              width: 150, fontSize: 11, padding: '2px 4px', fontFamily: 'inherit',
              background: 'rgba(0,0,0,0.3)', color: 'var(--cine-cream)',
              border: '1px solid var(--cine-gold)', outline: 'none',
            }}/>
        )}
      </div>

      {sopra && modifica === null && !base && (
        <button
          onClick={onElimina}
          title="elimina la sezione — i suoi volumi restano sullo scaffale"
          style={{
            position: 'absolute', top: `calc(100% - ${alta}px - 9px)`, right: -4,
            width: 18, height: 18, borderRadius: '50%', zIndex: 36, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--m-terracotta, #c0533b)', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: 11, lineHeight: 1,
          }}>×</button>
      )}
    </div>
  );
}

/* ── una copertina sul ripiano ────────────────────────────────────────────── */
function Volume({ libro, altezza, trascinato, lato, selezionato,
                 onApri, onMenu, onInserisciDopo, onSeleziona,
                 onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop }) {
  const [sopra, setSopra] = useState(false);
  const rif = useRef(null);
  const [versoDestra, setVersoDestra] = useState(true);
  const immagine = libro.cover_local || libro.cover_url || null;
  const larghezza = Math.round(altezza * useProporzione(immagine));

  // L'etichetta esce a destra, tranne quando non ci sta.
  const decidiLato = () => {
    const r = rif.current?.getBoundingClientRect();
    if (r) setVersoDestra(r.left + 260 < window.innerWidth);
  };

  // Dove cadrà: a sinistra o a destra di questa copertina, secondo il puntatore.
  const sopraConLato = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    onDragOver(e, e.clientX < r.left + r.width / 2 ? 'prima' : 'dopo');
  };

  return (
    <div
      ref={rif}
      style={{
        position: 'relative', height: altezza, flexShrink: 0,
        display: 'flex', alignItems: 'flex-end',
        opacity: trascinato ? 0.3 : 1,
      }}
      onMouseEnter={() => { decidiLato(); setSopra(true); }}
      onMouseLeave={() => setSopra(false)}
    >
      {/* la guida: compare dal lato in cui cadrà la copertina trascinata */}
      {lato && (
        <div style={{
          position: 'absolute',
          [lato === 'prima' ? 'left' : 'right']: -Math.round(SPAZIO_X / 2) - 1,
          bottom: -STACCO, width: 3, height: altezza + STACCO,
          background: 'var(--m-terracotta, #c0533b)',
          zIndex: 30, pointerEvents: 'none',
        }}/>
      )}

      <div
        draggable
        onDragStart={onDragStart} onDragEnd={onDragEnd}
        onDragOver={sopraConLato} onDragLeave={onDragLeave} onDrop={onDrop}
        onContextMenu={onMenu}
        onClick={e => {
          // con ctrl/cmd o shift si sceglie, altrimenti si apre la scheda
          if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); onSeleziona(e); }
          else onApri();
        }}
        title={libro.title}
        style={{
          cursor: 'pointer', lineHeight: 0,
          outline: selezionato ? '3px solid var(--cine-gold)' : 'none',
          outlineOffset: 1,
        }}
      >
        <QuandoVisibile larghezza={larghezza} altezza={altezza}>
          <BookCover book={libro} w={larghezza} h={altezza}/>
        </QuandoVisibile>
      </div>

      {sopra && !trascinato && !lato && (
        <Etichetta libro={libro} versoDestra={versoDestra}/>
      )}

      {/* inserisci subito dopo questa copertina */}
      {sopra && !trascinato && (
        <button
          onClick={e => { e.stopPropagation(); onInserisciDopo(); }}
          title="Inserisci un libro qui accanto"
          style={{
            position: 'absolute', right: -Math.round(SPAZIO_X / 2) - 9, bottom: -STACCO - 9,
            width: 18, height: 18, borderRadius: '50%', zIndex: 35,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--cine-gold)', color: 'var(--cine-bg, #0a0704)',
            border: 'none', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0,
          }}>+</button>
      )}
    </div>
  );
}

/* ── la mensola ───────────────────────────────────────────────────────────── */
export default function VistaMensola({
  sezioni, perSezione, sezioneBase, altezza, etichettaBase, mostraEbook = true,
  trascinato, sopra,
  onTrascinaInizio, onTrascinaFine, onSorvola, onEsci, onRilascia, onRilasciaMolti,
  onApri, onMenu, onInserisci,
  onRinominaSezione, onEliminaSezione, onSpostaEtichetta,
}) {
  const larghezzaTipica = Math.round(altezza * PROPORZIONE_PREDEFINITA);
  const [selezione, setSelezione] = useState(() => new Set());
  const [etichettaTrascinata, setEtichettaTrasc] = useState(null);
  const [lato, setLato] = useState(null);          // { id, dove: 'prima'|'dopo' }

  useScorrimentoAutomatico(Boolean(trascinato || etichettaTrascinata));

  /* Il ripiano: una fascia che si ripete a ogni riga. Il passo è l'altezza di
     una copertina più lo spazio verticale, lo stesso che usa il flex. */
  const passo = altezza + SPAZIO_Y;
  const inizio = altezza + STACCO;
  const ripiano = useMemo(() => ({
    backgroundImage: `repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent ${inizio}px,
      rgba(191,161,88,0.40) ${inizio}px,
      rgba(191,161,88,0.40) ${inizio + SPESSORE}px,
      rgba(0,0,0,0.22) ${inizio + SPESSORE}px,
      rgba(0,0,0,0.22) ${inizio + SPESSORE + 2}px,
      transparent ${inizio + SPESSORE + 2}px,
      transparent ${passo}px
    )`,
    backgroundRepeat: 'repeat-y',
  }), [inizio, passo]);

  /* Le etichette nell'ordine deciso: quella dei record senza sezione sta dove
     è stata messa, e in mancanza di meglio in fondo. */
  const ordinate = useMemo(() => {
    const conNome = sezioni.filter(s => s.id !== sezioneBase);
    const base = sezioni.find(s => s.id === sezioneBase);
    if (!base) return conNome;
    const massima = conNome.reduce((m, s) => Math.max(m, s.position ?? 0), 0);
    const posBase = base.position ?? massima + 10;
    return [...conNome, { ...base, position: posBase }]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [sezioni, sezioneBase]);

  const nascostiTotali = useMemo(() => {
    if (mostraEbook) return 0;
    return Object.values(perSezione).flat().filter(b => tipoRecord(b) === 'ebook').length;
  }, [perSezione, mostraEbook]);

  const inSelezione = (id) => selezione.has(id);
  const svuota = () => setSelezione(new Set());

  const seleziona = (id) => setSelezione(s => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  /* Rilascio. Se si trascina una copertina scelta, si muove tutto il gruppo,
     nell'ordine in cui sta sullo scaffale. */
  const rilascia = (sezioneId, dopoId) => {
    setLato(null);
    if (etichettaTrascinata) {
      // un'etichetta rilasciata su una copertina va dopo la sezione di quella
      onSpostaEtichetta(etichettaTrascinata, sezioneId);
      setEtichettaTrasc(null);
      return;
    }
    if (trascinato && selezione.size > 1 && selezione.has(trascinato.id)) {
      const ordine = ordinate.flatMap(s => (perSezione[s.id] || []))
        .filter(b => selezione.has(b.id)).map(b => b.id);
      svuota();
      onRilasciaMolti(sezioneId, dopoId, ordine);
      return;
    }
    onRilascia(sezioneId, dopoId);
  };

  const celle = [];
  for (const sez of ordinate) {
    const tutte = perSezione[sez.id] || [];
    const righe = mostraEbook ? tutte : tutte.filter(b => tipoRecord(b) !== 'ebook');
    const base = sez.id === sezioneBase;
    const ultimoId = righe.length ? righe[righe.length - 1].id : null;

    celle.push(
      <Linguetta
        key={`linguetta-${sez.id}`}
        sezione={sez} base={base}
        nome={base ? (etichettaBase || 'Nuovi arrivi') : (sez.name || 'Senza nome')}
        conteggio={righe.length}
        altezza={altezza}
        sorvolata={sopra === `testa-${sez.id}`}
        inTrascinamento={etichettaTrascinata === sez.id}
        onRinomina={nome => onRinominaSezione(sez.id, nome)}
        onElimina={() => onEliminaSezione(sez.id)}
        onDragStart={() => setEtichettaTrasc(sez.id)}
        onDragEnd={() => { setEtichettaTrasc(null); onTrascinaFine(); }}
        onDragOver={e => { e.preventDefault(); onSorvola(`testa-${sez.id}`); }}
        onDragLeave={() => onEsci(`testa-${sez.id}`)}
        onDrop={e => {
          e.preventDefault();
          if (etichettaTrascinata) {
            // un'etichetta rilasciata su un'altra si mette prima di quella
            const i = ordinate.findIndex(x => x.id === sez.id);
            onSpostaEtichetta(etichettaTrascinata, i > 0 ? ordinate[i - 1].id : null);
            setEtichettaTrasc(null);
          } else {
            rilascia(sez.id, null);
          }
        }}
      />
    );

    righe.forEach((b, i) => {
      const guida = lato && lato.id === b.id ? lato.dove : null;
      celle.push(
        <Volume
          key={b.id} libro={b} altezza={altezza}
          trascinato={trascinato?.id === b.id || (trascinato && selezione.has(b.id))}
          lato={guida}
          selezionato={inSelezione(b.id)}
          onApri={() => onApri(b.id)}
          onMenu={e => onMenu(e, b, sez.id)}
          onSeleziona={() => seleziona(b.id)}
          onInserisciDopo={() => onInserisci(base ? null : sez.id, b.id)}
          onDragStart={() => { setLato(null); onTrascinaInizio(b); }}
          onDragEnd={() => { setLato(null); onTrascinaFine(); }}
          onDragOver={(e, dove) => { e.preventDefault(); setLato({ id: b.id, dove }); onSorvola(b.id); }}
          onDragLeave={() => { setLato(l => (l && l.id === b.id ? null : l)); onEsci(b.id); }}
          onDrop={e => {
            e.preventDefault();
            // "prima" significa dopo il volume che precede; se non c'è, in testa
            const dove = lato && lato.id === b.id ? lato.dove : 'dopo';
            const dopoId = dove === 'dopo' ? b.id : (i > 0 ? righe[i - 1].id : null);
            rilascia(sez.id, dopoId);
          }}
        />
      );
    });

    // in coda alla sezione: si rilascia qui per metterlo per ultimo
    celle.push(
      <div
        key={`coda-${sez.id}`}
        onDragOver={e => { e.preventDefault(); onSorvola(`coda-${sez.id}`); }}
        onDragLeave={() => onEsci(`coda-${sez.id}`)}
        onDrop={e => { e.preventDefault(); rilascia(sez.id, ultimoId); }}
        onClick={() => onInserisci(base ? null : sez.id, ultimoId)}
        title="Aggiungi in fondo a questa sezione"
        style={{
          height: altezza, width: Math.max(34, Math.round(larghezzaTipica * 0.42)),
          flexShrink: 0, display: 'flex', alignItems: 'flex-end', cursor: 'pointer',
        }}>
        <div style={{
          width: '100%', height: Math.min(altezza, 58),
          border: `1px dashed ${sopra === `coda-${sez.id}` ? 'var(--m-terracotta, #c0533b)' : 'rgba(232,220,192,0.22)'}`,
          background: sopra === `coda-${sez.id}` ? 'rgba(192,83,59,0.12)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(232,220,192,0.45)', fontSize: 16,
        }}>+</div>
      </div>
    );
  }

  return (
    <>
      {selezione.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
          padding: '7px 12px', border: '1px solid var(--cine-gold-dim)',
          background: 'rgba(191,161,88,0.10)', flexWrap: 'wrap',
        }}>
          <span className="m-eyebrow" style={{ fontSize: 10 }}>
            {selezione.size} {selezione.size === 1 ? 'scelto' : 'scelti'}
          </span>
          <span className="m-marginalia" style={{ fontSize: 11.5 }}>
            trascinane uno per spostarli tutti insieme
          </span>
          <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 10, marginLeft: 'auto' }}
            onClick={svuota}>annulla la scelta</button>
        </div>
      )}

      {nascostiTotali > 0 && (
        <div className="m-marginalia" style={{ fontSize: 12, marginBottom: 10 }}>
          {nascostiTotali} ebook nascosti.
        </div>
      )}

      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', alignContent: 'flex-start',
        columnGap: SPAZIO_X, rowGap: SPAZIO_Y,
        padding: `0 0 ${SPAZIO_Y}px`,
        ...ripiano,
      }}>
        {celle}
      </div>

      <div className="m-marginalia" style={{ fontSize: 11.5, marginTop: 14, opacity: 0.75 }}>
        Doppio clic su un cartellino per rinominarlo, trascinalo per spostarlo.
        Ctrl o Cmd mentre clicchi una copertina per sceglierne più di una.
      </div>
    </>
  );
}
