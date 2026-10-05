import React, { useState, useRef, useEffect, useMemo } from 'react';
import BookCover from './BookCover.jsx';

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

    // Senza IntersectionObserver si mostra tutto: meglio lento che vuoto.
    if (typeof IntersectionObserver === 'undefined') { setVista(true); return; }
    const osservatore = new IntersectionObserver(([voce]) => {
      if (voce.isIntersecting) { setVista(true); osservatore.disconnect(); }
    }, { rootMargin: `${MARGINE}px 0px` });   // con anticipo: non si vede comparire
    osservatore.observe(rif.current);

    /* Mentre si scorre con la pagina non disegnata l'osservatore tace: il
       controllo geometrico resta valido comunque. In cattura, perché a
       scorrere è un contenitore interno e l'evento non risale alla finestra. */
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

/* ── il cartellino di una sezione, come una linguetta sul ripiano ─────────── */
function Linguetta({ nome, conteggio, altezza, sorvolata, onDragOver, onDragLeave, onDrop }) {
  const alta = Math.min(altezza, 54);
  return (
    <div
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      style={{ height: altezza, display: 'flex', alignItems: 'flex-end', flexShrink: 0 }}>
      <div style={{
        height: alta, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 11px 0 10px', maxWidth: 190,
        background: sorvolata ? 'rgba(191,161,88,0.22)' : 'rgba(232,220,192,0.07)',
        borderLeft: '3px solid var(--cine-gold)',
        borderTop: '1px solid rgba(232,220,192,0.16)',
        borderBottom: '1px solid rgba(232,220,192,0.16)',
        // la punta che sporge verso le copertine
        clipPath: 'polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%)',
      }}>
        <div className="m-eyebrow" style={{
          fontSize: 10, lineHeight: 1.2, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
        }}>{nome}</div>
        <div className="m-marginalia" style={{ fontSize: 10, marginTop: 1 }}>
          {conteggio} {conteggio === 1 ? 'volume' : 'volumi'}
        </div>
      </div>
    </div>
  );
}

/* ── una copertina sul ripiano ────────────────────────────────────────────── */
function Volume({ libro, altezza, trascinato, cadeQui,
                 onApri, onMenu, onInserisciDopo,
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

  return (
    <div
      ref={rif}
      style={{
        position: 'relative', height: altezza, flexShrink: 0,
        display: 'flex', alignItems: 'flex-end',
        opacity: trascinato ? 0.35 : 1,
      }}
      onMouseEnter={() => { decidiLato(); setSopra(true); }}
      onMouseLeave={() => setSopra(false)}
    >
      {/* dove cadrà la copertina trascinata: una guida verticale sul ripiano */}
      <div style={{
        position: 'absolute', left: -Math.round(SPAZIO_X / 2) - 1, bottom: -STACCO,
        width: 3, height: altezza + STACCO,
        background: cadeQui ? 'var(--m-terracotta, #c0533b)' : 'transparent',
        transition: 'background 90ms', zIndex: 30, pointerEvents: 'none',
      }}/>

      <div
        draggable
        onDragStart={onDragStart} onDragEnd={onDragEnd}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        onContextMenu={onMenu}
        onClick={onApri}
        title={libro.title}
        style={{ cursor: 'pointer', lineHeight: 0 }}
      >
        <QuandoVisibile larghezza={larghezza} altezza={altezza}>
          <BookCover book={libro} w={larghezza} h={altezza}/>
        </QuandoVisibile>
      </div>

      {sopra && !trascinato && (
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
  sezioni, perSezione, sezioneBase, altezza,
  trascinato, sopra,
  onTrascinaInizio, onTrascinaFine, onSorvola, onEsci, onRilascia,
  onApri, onMenu, onInserisci,
}) {
  const larghezzaTipica = Math.round(altezza * PROPORZIONE_PREDEFINITA);

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

  /* La sezione senza nome, quella dei nuovi arrivi, qui va in fondo: sul
     ripiano le sezioni con un nome vengono prima. */
  const ordinate = useMemo(() => {
    const conNome = sezioni.filter(s => s.id !== sezioneBase);
    const base = sezioni.find(s => s.id === sezioneBase);
    return base ? [...conNome, base] : conNome;
  }, [sezioni, sezioneBase]);

  const celle = [];
  for (const sez of ordinate) {
    const righe = perSezione[sez.id] || [];
    const base = sez.id === sezioneBase;
    const ultimoId = righe.length ? righe[righe.length - 1].id : null;

    celle.push(
      <Linguetta
        key={`linguetta-${sez.id}`}
        nome={base ? 'Nuovi arrivi' : (sez.name || 'Senza nome')}
        conteggio={righe.length}
        altezza={altezza}
        sorvolata={sopra === `testa-${sez.id}`}
        onDragOver={e => { e.preventDefault(); onSorvola(`testa-${sez.id}`); }}
        onDragLeave={() => onEsci(`testa-${sez.id}`)}
        onDrop={e => { e.preventDefault(); onRilascia(sez.id, null); }}
      />
    );

    for (const b of righe) {
      celle.push(
        <Volume
          key={b.id} libro={b} altezza={altezza}
          trascinato={trascinato?.id === b.id}
          cadeQui={sopra === b.id}
          onApri={() => onApri(b.id)}
          onMenu={e => onMenu(e, b, sez.id)}
          onInserisciDopo={() => onInserisci(base ? null : sez.id, b.id)}
          onDragStart={() => onTrascinaInizio(b)}
          onDragEnd={onTrascinaFine}
          onDragOver={e => { e.preventDefault(); onSorvola(b.id); }}
          onDragLeave={() => onEsci(b.id)}
          onDrop={e => { e.preventDefault(); onRilascia(sez.id, b.id); }}
        />
      );
    }

    // in coda alla sezione: si rilascia qui per metterlo per ultimo
    celle.push(
      <div
        key={`coda-${sez.id}`}
        onDragOver={e => { e.preventDefault(); onSorvola(`coda-${sez.id}`); }}
        onDragLeave={() => onEsci(`coda-${sez.id}`)}
        onDrop={e => { e.preventDefault(); onRilascia(sez.id, ultimoId); }}
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
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', alignContent: 'flex-start',
        columnGap: SPAZIO_X, rowGap: SPAZIO_Y,
        padding: `0 0 ${SPAZIO_Y}px`,
        ...ripiano,
      }}>
        {celle}
      </div>

    </>
  );
}
