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

/* ── la chiave di un elemento della fila ──────────────────────────────────── */
const chiave = (x) => `${x.tipo}:${x.id}`;
const rif = (x) => (x ? { tipo: x.tipo, id: x.id } : null);

/* ── l'etichetta: un elemento della fila come un libro ───────────────────────
   Si trascina come una copertina e i libri che la seguono, fino alla prossima
   etichetta, sono suoi. Si rinomina con un doppio clic e si elimina con la ×:
   i suoi libri passano al gruppo che la precede. Quella dei nuovi arrivi è la
   testa della fila: si rinomina e si toglie, ma non si sposta.             */
function Linguetta({ nome, conteggio, altezza, testa, inTrascinamento, guida,
                    onRinomina, onElimina,
                    onDragStart, onDragEnd, onSorvola, onEsci, onRilascia }) {
  const [modifica, setModifica] = useState(null);   // null = non sto rinominando
  const [sopra, setSopra] = useState(false);
  const alta = Math.min(altezza, 56);

  const salva = () => {
    const v = (modifica || '').trim();
    setModifica(null);
    if (v && v !== nome) onRinomina(v);
  };
  const lato = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return e.clientX < r.left + r.width / 2 ? 'prima' : 'dopo';
  };

  return (
    <div
      onDragEnter={e => { e.preventDefault(); onSorvola(lato(e)); }}
      onDragOver={e => { e.preventDefault(); onSorvola(lato(e)); }}
      onDragLeave={onEsci}
      onDrop={e => { e.preventDefault(); onRilascia(lato(e)); }}
      onMouseEnter={() => setSopra(true)} onMouseLeave={() => setSopra(false)}
      style={{
        height: altezza, display: 'flex', alignItems: 'flex-end', flexShrink: 0,
        position: 'relative', opacity: inTrascinamento ? 0.35 : 1,
      }}>
      {guida && (
        <div style={{
          position: 'absolute', [guida === 'prima' ? 'left' : 'right']: -Math.round(SPAZIO_X / 2) - 2,
          bottom: -STACCO, width: 4, height: altezza + STACCO,
          background: 'var(--m-terracotta, #c0533b)', zIndex: 30, pointerEvents: 'none',
        }}/>
      )}
      <div
        draggable={!testa && modifica === null}
        onDragStart={testa ? undefined : onDragStart}
        onDragEnd={testa ? undefined : onDragEnd}
        onDoubleClick={() => setModifica(nome)}
        title={testa
          ? 'doppio clic per rinominare — è l’inizio della fila, non si sposta'
          : 'trascina per spostarla, doppio clic per rinominare'}
        style={{
          height: alta, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 13px 0 10px', maxWidth: 200,
          cursor: modifica !== null ? 'text' : testa ? 'default' : 'grab',
          background: guida ? 'rgba(191,161,88,0.26)' : 'rgba(232,220,192,0.07)',
          borderLeft: `3px solid ${testa ? 'var(--cine-gold-dim)' : 'var(--cine-gold)'}`,
          borderTop: '1px solid rgba(232,220,192,0.16)',
          borderBottom: '1px solid rgba(232,220,192,0.16)',
          clipPath: 'polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%)',
        }}>
        {modifica === null ? (
          <>
            <div className="m-eyebrow" style={{
              fontSize: 10, lineHeight: 1.2, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 168,
              fontStyle: testa ? 'italic' : 'normal',
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
            onKeyDown={e => { if (e.key === 'Enter') salva(); if (e.key === 'Escape') setModifica(null); }}
            style={{
              width: 150, fontSize: 11, padding: '2px 4px', fontFamily: 'inherit',
              background: 'rgba(0,0,0,0.3)', color: 'var(--cine-cream)',
              border: '1px solid var(--cine-gold)', outline: 'none',
            }}/>
        )}
      </div>

      {sopra && modifica === null && (
        <button
          onClick={onElimina}
          title={testa
            ? 'togli i nuovi arrivi — i loro volumi passano alla prima etichetta'
            : 'elimina l’etichetta — i suoi volumi passano al gruppo precedente'}
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
function Volume({ libro, altezza, inTrascinamento, guida, selezionato,
                 onApri, onMenu, onInserisciDopo, onSeleziona,
                 onDragStart, onDragEnd, onSorvola, onEsci, onRilascia }) {
  const [sopra, setSopra] = useState(false);
  const rifEl = useRef(null);
  const [versoDestra, setVersoDestra] = useState(true);
  const immagine = libro.cover_local || libro.cover_url || null;
  const larghezza = Math.round(altezza * useProporzione(immagine));

  const decidiLato = () => {
    const r = rifEl.current?.getBoundingClientRect();
    if (r) setVersoDestra(r.left + 260 < window.innerWidth);
  };
  const lato = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return e.clientX < r.left + r.width / 2 ? 'prima' : 'dopo';
  };

  return (
    <div
      ref={rifEl}
      style={{
        position: 'relative', height: altezza, flexShrink: 0,
        display: 'flex', alignItems: 'flex-end',
        opacity: inTrascinamento ? 0.3 : 1,
      }}
      onMouseEnter={() => { decidiLato(); setSopra(true); }}
      onMouseLeave={() => setSopra(false)}
    >
      {guida && (
        <div style={{
          position: 'absolute', [guida === 'prima' ? 'left' : 'right']: -Math.round(SPAZIO_X / 2) - 1,
          bottom: -STACCO, width: 3, height: altezza + STACCO,
          background: 'var(--m-terracotta, #c0533b)', zIndex: 30, pointerEvents: 'none',
        }}/>
      )}

      <div
        draggable
        onDragStart={onDragStart} onDragEnd={onDragEnd}
        onDragEnter={e => { e.preventDefault(); onSorvola(lato(e)); }}
        onDragOver={e => { e.preventDefault(); onSorvola(lato(e)); }}
        onDragLeave={onEsci}
        onDrop={e => { e.preventDefault(); onRilascia(lato(e)); }}
        onContextMenu={onMenu}
        onClick={e => {
          // con ctrl/cmd o shift si sceglie, altrimenti si apre la scheda
          if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); onSeleziona(); }
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

      {sopra && !inTrascinamento && !guida && (
        <Etichetta libro={libro} versoDestra={versoDestra}/>
      )}

      {sopra && !inTrascinamento && (
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
  elementi,          // la fila che si vede: { tipo: 'etichetta', id, nome } | { tipo: 'libro', id, libro }
  testa,             // { visibile, nome }: i nuovi arrivi, cioè i libri prima della prima etichetta
  altezza, nascosti = 0,
  onSposta,          // (elemento, dopo) — dopo = { tipo, id } | null (in testa alla fila)
  onSpostaMolti,     // (idLibri, dopo)
  onApri, onMenu, onInserisci,
  onRinomina, onElimina,      // (idEtichetta | null per la testa, …)
}) {
  const [trascinato, setTrascinato] = useState(null);   // l'elemento che si sta trascinando
  const [guida, setGuida] = useState(null);             // { chiave, lato } dove cadrà
  const [selezione, setSelezione] = useState(() => new Set());

  useScorrimentoAutomatico(Boolean(trascinato));

  /* Il ripiano: una fascia che si ripete a ogni riga. */
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

  /* Quanti libri ha ogni etichetta, e quanti sono in testa. */
  const conteggi = useMemo(() => {
    const m = new Map();
    let corrente = 'testa';
    m.set('testa', 0);
    for (const x of elementi) {
      if (x.tipo === 'etichetta') { corrente = x.id; m.set(corrente, 0); }
      else m.set(corrente, (m.get(corrente) || 0) + 1);
    }
    return m;
  }, [elementi]);

  const fine = () => { setTrascinato(null); setGuida(null); };

  const inizia = (x) => (e) => {
    // senza un dato da trasportare Firefox non fa partire il trascinamento
    e.dataTransfer?.setData('text/plain', chiave(x));
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    setTrascinato(x);
  };

  /* Dove va ciò che si lascia sull'elemento i, dal lato indicato. */
  const rilascia = (i, lato) => {
    const mosso = trascinato;
    fine();
    if (!mosso) return;
    const dopo = lato === 'dopo' ? rif(elementi[i]) : (i > 0 ? rif(elementi[i - 1]) : null);
    if (dopo && dopo.tipo === mosso.tipo && dopo.id === mosso.id) return;   // resta dov'è

    // più copertine scelte: si muovono tutte, nell'ordine in cui stanno
    if (mosso.tipo === 'libro' && selezione.size > 1 && selezione.has(mosso.id)) {
      const ordine = elementi.filter(x => x.tipo === 'libro' && selezione.has(x.id)).map(x => x.id);
      setSelezione(new Set());
      onSpostaMolti(ordine, dopo);
      return;
    }
    onSposta(rif(mosso), dopo);
  };

  const sorvola = (x) => (lato) => {
    if (!trascinato) return;
    setGuida(g => (g && g.chiave === chiave(x) && g.lato === lato ? g : { chiave: chiave(x), lato }));
  };
  const esci = (x) => () => setGuida(g => (g && g.chiave === chiave(x) ? null : g));
  const guidaPer = (x) => (guida && guida.chiave === chiave(x) ? guida.lato : null);

  const celle = [];

  // la testa: i nuovi arrivi. Lasciarci qualcosa lo porta all'inizio della fila.
  if (testa.visibile) {
    celle.push(
      <Linguetta key="testa"
        testa nome={testa.nome} conteggio={conteggi.get('testa') || 0} altezza={altezza}
        guida={guida && guida.chiave === 'testa' ? 'dopo' : null}
        onRinomina={nome => onRinomina(null, nome)}
        onElimina={() => onElimina(null)}
        onSorvola={() => { if (trascinato) setGuida({ chiave: 'testa', lato: 'dopo' }); }}
        onEsci={() => setGuida(g => (g && g.chiave === 'testa' ? null : g))}
        onRilascia={() => {
          const mosso = trascinato; fine();
          if (!mosso) return;
          if (mosso.tipo === 'libro' && selezione.size > 1 && selezione.has(mosso.id)) {
            const ordine = elementi.filter(x => x.tipo === 'libro' && selezione.has(x.id)).map(x => x.id);
            setSelezione(new Set());
            onSpostaMolti(ordine, null);
          } else onSposta(rif(mosso), null);
        }}
      />
    );
  }

  elementi.forEach((x, i) => {
    if (x.tipo === 'etichetta') {
      celle.push(
        <Linguetta key={chiave(x)}
          nome={x.nome || 'Senza nome'} conteggio={conteggi.get(x.id) || 0} altezza={altezza}
          inTrascinamento={trascinato && chiave(trascinato) === chiave(x)}
          guida={guidaPer(x)}
          onRinomina={nome => onRinomina(x.id, nome)}
          onElimina={() => onElimina(x.id)}
          onDragStart={inizia(x)} onDragEnd={fine}
          onSorvola={sorvola(x)} onEsci={esci(x)}
          onRilascia={lato => rilascia(i, lato)}
        />
      );
    } else {
      const sceltoIo = selezione.has(x.id);
      celle.push(
        <Volume key={chiave(x)}
          libro={x.libro} altezza={altezza}
          inTrascinamento={trascinato && (chiave(trascinato) === chiave(x)
            || (trascinato.tipo === 'libro' && sceltoIo && selezione.has(trascinato.id)))}
          guida={guidaPer(x)}
          selezionato={sceltoIo}
          onApri={() => onApri(x.id)}
          onMenu={e => onMenu(e, x.libro)}
          onSeleziona={() => setSelezione(s => {
            const n = new Set(s); if (n.has(x.id)) n.delete(x.id); else n.add(x.id); return n;
          })}
          onInserisciDopo={() => onInserisci(rif(x))}
          onDragStart={inizia(x)} onDragEnd={fine}
          onSorvola={sorvola(x)} onEsci={esci(x)}
          onRilascia={lato => rilascia(i, lato)}
        />
      );
    }
  });

  // in fondo alla fila: lasciarci qualcosa lo mette per ultimo
  const ultimo = elementi.length ? elementi[elementi.length - 1] : null;
  celle.push(
    <div key="coda"
      onDragEnter={e => { e.preventDefault(); if (trascinato) setGuida({ chiave: 'coda', lato: 'dopo' }); }}
      onDragOver={e => { e.preventDefault(); if (trascinato) setGuida({ chiave: 'coda', lato: 'dopo' }); }}
      onDragLeave={() => setGuida(g => (g && g.chiave === 'coda' ? null : g))}
      onDrop={e => {
        e.preventDefault();
        if (ultimo) rilascia(elementi.length - 1, 'dopo');
        else { const m = trascinato; fine(); if (m) onSposta(rif(m), null); }
      }}
      onClick={() => onInserisci(rif(ultimo))}
      title="Aggiungi in fondo"
      style={{
        height: altezza, width: Math.max(34, Math.round(altezza * PROPORZIONE_PREDEFINITA * 0.42)),
        flexShrink: 0, display: 'flex', alignItems: 'flex-end', cursor: 'pointer',
      }}>
      <div style={{
        width: '100%', height: Math.min(altezza, 58),
        border: `1px dashed ${guida?.chiave === 'coda' ? 'var(--m-terracotta, #c0533b)' : 'rgba(232,220,192,0.22)'}`,
        background: guida?.chiave === 'coda' ? 'rgba(192,83,59,0.12)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(232,220,192,0.45)', fontSize: 16,
      }}>+</div>
    </div>
  );

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
            onClick={() => setSelezione(new Set())}>annulla la scelta</button>
        </div>
      )}

      {nascosti > 0 && (
        <div className="m-marginalia" style={{ fontSize: 12, marginBottom: 10 }}>
          {nascosti} ebook nascosti.
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
        Le etichette si trascinano come i libri: i volumi che seguono un’etichetta sono suoi.
        Doppio clic su un’etichetta per rinominarla. Ctrl o Cmd per scegliere più copertine.
      </div>
    </>
  );
}
