import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import { tipoRecord } from '../components/EbookMark.jsx';
import { shelves as shelvesApi, books as booksApi, libraries as librariesApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';
import VistaMensola from '../components/VistaMensola.jsx';

/* ══════════════════════════════════════════════════════════════════════════
   Uno scaffale: i libri nell'ordine in cui dialogano fra loro.

   Ordine e sezioni vivono nel database (shelf_books.position / section_id),
   non più nel browser: seguono il catalogo su qualsiasi dispositivo e
   finiscono nei backup. Lo scaffale rimanda ai record, non li duplica:
   toglierne uno non tocca il catalogo.
   ══════════════════════════════════════════════════════════════════════════ */

const SEZIONE_BASE = '__base__'; // la sezione senza nome: section_id vuoto nel database

const conta = (libri, tipo) => libri.filter(b => tipoRecord(b) === tipo).length;

/** "12 libri · 4 ebook · 2 opere", saltando le voci a zero. */
function riepilogo(libri) {
  const voci = [
    [conta(libri, 'cartaceo'), 'libro', 'libri'],
    [conta(libri, 'ebook'), 'ebook', 'ebook'],
    [conta(libri, 'opera'), 'opera', 'opere'],
  ].filter(([n]) => n > 0);
  if (!voci.length) return 'vuoto';
  return voci.map(([n, s, p]) => `${n} ${n === 1 ? s : p}`).join(' · ');
}

/* ── Menu contestuale di una riga ─────────────────────────────────────────── */
function MenuRiga({ x, y, libro, sezioni, sezioneCorrente, altriScaffali, librerie = [], etichettaBase,
                    onSpostaInSezione, onTrasferisci, onTogli, onApri, onChiudi }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const [modo, setModo] = useState('move');        // spostare o copiare sugli altri scaffali
  const [aperto, setAperto] = useState(null);      // scaffale di cui si vedono i ripiani

  // Resta dentro la finestra anche quando si allunga aprendo i ripiani.
  useEffect(() => {
    if (!ref.current) return;
    const sistema = () => {
      const r = ref.current.getBoundingClientRect();
      setPos({
        left: x + r.width > window.innerWidth ? Math.max(4, window.innerWidth - r.width - 4) : x,
        top:  y + r.height > window.innerHeight ? Math.max(4, window.innerHeight - r.height - 6) : y,
      });
    };
    sistema();
    const oss = new ResizeObserver(sistema);
    oss.observe(ref.current);
    return () => oss.disconnect();
  }, [x, y]);

  /* Gli altri scaffali, raggruppati per libreria come nella pagina Scaffali. */
  const note = new Set(librerie.map(l => l.id));
  const gruppi = [
    ...librerie.map(l => ({ id: l.id, nome: l.name, scaffali: altriScaffali.filter(sc => sc.library_id === l.id) })),
    { id: null, nome: librerie.length ? 'Senza libreria' : null,
      scaffali: altriScaffali.filter(sc => !sc.library_id || !note.has(sc.library_id)) },
  ].filter(g => g.scaffali.length > 0);

  useEffect(() => {
    const giu = e => { if (ref.current && !ref.current.contains(e.target)) onChiudi(); };
    const tasto = e => { if (e.key === 'Escape') onChiudi(); };
    document.addEventListener('mousedown', giu);
    document.addEventListener('keydown', tasto);
    return () => { document.removeEventListener('mousedown', giu); document.removeEventListener('keydown', tasto); };
  }, [onChiudi]);

  const Voce = ({ children, onClick, pericolo }) => (
    <div onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--m-rule)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{ padding: '7px 14px', cursor: 'pointer', fontSize: 13,
        color: pericolo ? 'var(--m-vermilion)' : 'var(--m-ink)' }}>{children}</div>
  );
  const Titoletto = ({ children }) => (
    <div className="m-eyebrow" style={{ fontSize: 9, padding: '8px 14px 3px', color: 'var(--m-ink-muted)' }}>{children}</div>
  );

  return (
    <div ref={ref} style={{
      position: 'fixed', left: pos.left, top: pos.top, zIndex: 600,
      background: 'var(--m-parchment)', border: '1px solid var(--m-rule)',
      boxShadow: '0 4px 18px rgba(0,0,0,0.35)', minWidth: 236,
      maxHeight: '80vh', overflowY: 'auto', paddingBottom: 4,
    }}>
      <div style={{ padding: '8px 14px 7px', borderBottom: '1px solid var(--m-rule)' }}>
        <div className="m-serif" style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{libro.title}</div>
      </div>

      <Voce onClick={() => { onChiudi(); onApri(libro.id); }}>› Apri la scheda</Voce>

      {sezioni.length > 1 && (
        <>
          <Titoletto>Sposta nella sezione</Titoletto>
          {sezioni.map(s => (
            <Voce key={s.id} onClick={() => { onChiudi(); onSpostaInSezione(libro, s.id); }}>
              {s.id === sezioneCorrente ? '• ' : '  '}{s.name || etichettaBase || 'Nuovi arrivi'}
            </Voce>
          ))}
        </>
      )}

      {altriScaffali.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 4px' }}>
            <span className="m-eyebrow" style={{ fontSize: 9, color: 'var(--m-ink-muted)' }}>Su un altro scaffale</span>
            <div style={{ display: 'flex', marginLeft: 'auto', border: '1px solid var(--m-rule)' }}>
              {[['move', 'sposta'], ['copy', 'copia']].map(([k, nome]) => (
                <button key={k} onClick={() => setModo(k)}
                  style={{
                    padding: '2px 9px', fontSize: 11, cursor: 'pointer', border: 'none',
                    fontFamily: 'inherit',
                    background: modo === k ? 'var(--m-terracotta)' : 'transparent',
                    color: modo === k ? '#fff' : 'var(--m-ink-muted)',
                  }}>{nome}</button>
              ))}
            </div>
          </div>

          {gruppi.map(g => (
            <div key={g.id || 'senza'}>
              {g.nome && (
                <div className="m-eyebrow" style={{ fontSize: 8.5, letterSpacing: '0.16em',
                  padding: '6px 14px 2px', color: 'var(--m-ink-muted)', opacity: 0.8 }}>{g.nome}</div>
              )}
              {g.scaffali.map(sc => {
                const ripiani = [
                  ...(sc.base_hidden ? [] : [{ id: null, name: sc.base_label || 'Nuovi arrivi' }]),
                  ...(sc.sections || []),
                ];
                const espanso = aperto === sc.id;
                return (
                  <div key={sc.id}>
                    <div style={{ display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--m-rule)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div onClick={() => { onChiudi(); onTrasferisci(libro, sc.id, modo); }}
                        style={{ flex: 1, padding: '7px 4px 7px 14px', cursor: 'pointer', fontSize: 13,
                                 overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {modo === 'move' ? '→' : '⧉'} {sc.name}
                      </div>
                      <button onClick={() => setAperto(espanso ? null : sc.id)}
                        title="scegli il ripiano" aria-expanded={espanso}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px',
                                 fontSize: 13, color: 'var(--m-ink-muted)',
                                 transform: espanso ? 'rotate(90deg)' : 'none', transition: 'transform 120ms' }}>›</button>
                    </div>
                    {espanso && ripiani.map(r => (
                      <div key={r.id || 'base'}
                        onClick={() => { onChiudi(); onTrasferisci(libro, sc.id, modo, r.id); }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--m-rule)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        style={{ padding: '6px 14px 6px 36px', cursor: 'pointer', fontSize: 12.5,
                                 fontStyle: r.id ? 'normal' : 'italic' }}>
                        · {r.name || 'senza nome'}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}

      <div style={{ borderTop: '1px solid var(--m-rule)', marginTop: 4, paddingTop: 4 }}>
        <Voce pericolo onClick={() => { onChiudi(); onTogli(libro); }}>✕ Togli dallo scaffale</Voce>
      </div>
    </div>
  );
}

/* ── Aggiunta rapida: cerca nel catalogo e inserisci in un punto preciso ──── */
function AggiuntaRapida({ giaPresenti, onScegli, onChiudi }) {
  const [q, setQ] = useState('');
  const [esiti, setEsiti] = useState([]);
  const [cerco, setCerco] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const testo = q.trim();
      if (testo.length < 2) { setEsiti([]); return; }
      setCerco(true);
      booksApi.list({ search: testo, limit: 12 })
        .then(r => setEsiti(r.books || []))
        .catch(() => setEsiti([]))
        .finally(() => setCerco(false));
    }, 220); // ricerca mentre scrivo, senza interrogare a ogni tasto
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div style={{ border: '1px solid var(--m-rule-strong)', background: 'var(--m-parchment)',
                  padding: 10, marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="m-input" autoFocus value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') onChiudi(); }}
          placeholder="cerca nel catalogo per titolo o autore…"
          style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}/>
        <button className="m-btn m-btn-ghost m-btn-sm" onClick={onChiudi}>chiudi</button>
      </div>

      {q.trim().length >= 2 && (
        <div style={{ marginTop: 8, maxHeight: 260, overflowY: 'auto' }}>
          {cerco && esiti.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--m-ink-muted)', fontStyle: 'italic', padding: 6 }}>cerco…</div>
          )}
          {!cerco && esiti.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--m-ink-muted)', fontStyle: 'italic', padding: 6 }}>
              nessun record corrisponde
            </div>
          )}
          {esiti.map(b => {
            const presente = giaPresenti.has(b.id);
            return (
              <div key={b.id}
                onClick={() => { if (!presente) onScegli(b); }}
                title={presente ? 'Già su questo scaffale' : 'Inserisci qui'}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 6px',
                  cursor: presente ? 'default' : 'pointer', opacity: presente ? 0.45 : 1 }}
                onMouseEnter={e => { if (!presente) e.currentTarget.style.background = 'var(--m-rule)'; }}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <BookCover book={b} w={22} h={32}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--m-ink-muted)', fontStyle: 'italic',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.author_names || '—'}
                  </div>
                </div>
                {presente && <span style={{ fontSize: 10, color: 'var(--m-ink-muted)' }}>già qui</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══ Pagina ═══════════════════════════════════════════════════════════════ */
export default function DettaglioScaffale() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [scaffale, setScaffale]   = useState(null);
  const [tuttiScaffali, setTutti] = useState([]);
  const [librerie, setLibrerie]   = useState([]);
  const [caricamento, setCaric]   = useState(true);
  const [menu, setMenu]           = useState(null);
  const [punto, setPunto]         = useState(null);   // dove inserire: { dopo: { tipo, id } | null }
  const [rinomino, setRinomino]   = useState(false);
  const [nomeTmp, setNomeTmp]     = useState('');
  const [vista, setVista]         = useState('mensola');    // 'elenco' | 'mensola'
  const [altezza, setAltezza]     = useState(130);          // altezza delle copertine
  const [etichettaBase, setEtichettaBase] = useState('Nuovi arrivi');
  const [mostraEbook, setMostraEbook]     = useState(true);

  const carica = useCallback(() => {
    return shelvesApi.get(id)
      .then(s => {
        setScaffale(s);
        setVista(s.view_mode === 'elenco' ? 'elenco' : 'mensola');
        setAltezza(s.cover_height || 130);
        setEtichettaBase(s.base_label || 'Nuovi arrivi');
        setMostraEbook(s.show_ebooks !== 0);
      })
      .catch(() => { toast('Scaffale non trovato', 'error'); navigate('/scaffali'); })
      .finally(() => setCaric(false));
  }, [id, navigate, toast]);

  useEffect(() => { carica(); }, [carica]);
  useEffect(() => { shelvesApi.list().then(setTutti).catch(() => {}); }, []);
  useEffect(() => { librariesApi.list().then(setLibrerie).catch(() => {}); }, []);

  /* La fila: etichette e libri in un solo ordine. Un libro appartiene
     all'ultima etichetta che lo precede; quelli in testa sono i nuovi arrivi. */
  const fila = useMemo(() => {
    if (!scaffale) return [];
    const etichette = (scaffale.sections || [])
      .map(s => ({ tipo: 'etichetta', id: s.id, nome: s.name, position: s.position ?? 0 }));
    const libri = (scaffale.books || [])
      .map(b => ({ tipo: 'libro', id: b.id, libro: b, position: b.position ?? 0 }));
    return [...etichette, ...libri].sort((a, b) =>
      (a.position - b.position) || (a.tipo === b.tipo ? 0 : a.tipo === 'etichetta' ? -1 : 1));
  }, [scaffale]);

  // gli ebook nascosti spariscono dalla vista, non dalla fila
  const filaVisibile = useMemo(() => (mostraEbook ? fila
    : fila.filter(x => x.tipo === 'etichetta' || tipoRecord(x.libro) !== 'ebook')), [fila, mostraEbook]);
  const nascosti = fila.length - filaVisibile.length;

  // i nuovi arrivi si vedono se non sono stati tolti, o se in testa c'è qualche libro
  const testa = {
    visibile: !scaffale?.base_hidden || (fila.length > 0 && fila[0].tipo === 'libro'),
    nome: etichettaBase,
  };

  /* Le etichette per il menu "sposta nella sezione". */
  const sezioni = useMemo(() => [
    ...(testa.visibile ? [{ id: SEZIONE_BASE, name: null }] : []),
    ...fila.filter(x => x.tipo === 'etichetta').map(x => ({ id: x.id, name: x.nome })),
  ], [fila, testa.visibile]);

  const presenti = useMemo(() => new Set((scaffale?.books || []).map(b => b.id)), [scaffale]);
  const altriScaffali = useMemo(() => tuttiScaffali.filter(s => s.id !== id), [tuttiScaffali, id]);

  /* ── Azioni ── */
  const errore = (testo) => (e) => toast(e?.response?.data?.error || testo, 'error');

  async function inserisci(libro) {
    try {
      await shelvesApi.addBook(id, libro.id, { after: punto?.dopo ?? null });
      setPunto(null);
      await carica();
      toast(`"${libro.title}" sullo scaffale`, 'success');
    } catch (e) { errore('Non sono riuscito a inserirlo')(e); }
  }

  async function togli(libro) {
    try {
      await shelvesApi.removeBook(id, libro.id);
      await carica();
      toast(`"${libro.title}" tolto dallo scaffale — resta in catalogo`, 'success');
    } catch { toast('Errore nel togliere il record', 'error'); }
  }

  // in fondo al gruppo di un'etichetta
  async function spostaInSezione(libro, sezioneId) {
    try {
      await shelvesApi.moveBook(id, libro.id, { section_id: sezioneId === SEZIONE_BASE ? null : sezioneId });
      await carica();
    } catch { toast('Errore nello spostamento', 'error'); }
  }

  async function trasferisci(libro, scaffaleId, modo, sezioneId = null) {
    try {
      await shelvesApi.transfer(id, libro.id, scaffaleId, modo, sezioneId);
      await carica();
      const dove = tuttiScaffali.find(s => s.id === scaffaleId)?.name || 'altro scaffale';
      toast(modo === 'move' ? `Spostato in "${dove}"` : `Copiato in "${dove}"`, 'success');
    } catch { toast('Errore nel trasferimento', 'error'); }
  }

  /* Spostare un elemento della fila — libro o etichetta, è uguale — subito
     dopo `dopo` (null = in testa). */
  async function sposta(elemento, dopo) {
    try {
      if (elemento.tipo === 'libro') await shelvesApi.moveBook(id, elemento.id, { after: dopo });
      else await shelvesApi.updateSection(id, elemento.id, { after: dopo });
      await carica();
    } catch { toast('Errore nello spostamento', 'error'); await carica(); }
  }

  /* Più libri insieme, nell'ordine che avevano. */
  async function spostaMolti(ids, dopo) {
    let precedente = dopo;
    try {
      for (const bid of ids) {
        await shelvesApi.moveBook(id, bid, { after: precedente });
        precedente = { tipo: 'libro', id: bid };
      }
      await carica();
      toast(ids.length + ' volumi spostati', 'success');
    } catch { toast('Errore nello spostamento', 'error'); await carica(); }
  }

  /* Rinominare: null è la testa, i nuovi arrivi, il cui nome vive sullo scaffale. */
  async function rinomina(etichettaId, nome) {
    try {
      if (!etichettaId) await shelvesApi.updateBase(id, { label: nome });
      else await shelvesApi.updateSection(id, etichettaId, { name: nome });
      await carica();
    } catch { toast('Errore nella rinomina', 'error'); }
  }

  /* Eliminare un'etichetta: i suoi libri restano dove sono e passano al gruppo
     che la precede. Per la testa vale la regola dei nuovi arrivi. */
  async function elimina(etichettaId) {
    if (!etichettaId) return eliminaBase();
    try {
      await shelvesApi.deleteSection(id, etichettaId);
      await carica();
      toast('Etichetta tolta — i suoi volumi passano al gruppo precedente', 'success');
    } catch { toast('Errore nell’eliminazione', 'error'); }
  }

  /* Togliere i nuovi arrivi: la prima etichetta si mette davanti ai loro libri
     e li prende con sé. Senza etichette non si può. */
  async function eliminaBase() {
    const inTesta = [];
    for (const x of fila) { if (x.tipo === 'etichetta') break; inTesta.push(x); }
    const prima = fila.find(x => x.tipo === 'etichetta');
    if (inTesta.length && !prima) {
      toast(`Su «${etichettaBase}» ci sono ${inTesta.length} volumi e nessun'etichetta che possa prenderli: crea prima una sezione`, 'error');
      return;
    }
    const domanda = inTesta.length
      ? `Togliere «${etichettaBase}»? I suoi ${inTesta.length} volumi passano a «${prima.nome || 'senza nome'}».`
      : `Togliere «${etichettaBase}» da questo scaffale?`;
    if (!window.confirm(domanda)) return;
    try {
      await shelvesApi.deleteBase(id);
      await carica();
      toast(`«${etichettaBase}» tolto`, 'success');
    } catch (e) { errore('Non è stato possibile toglierlo')(e); }
  }

  async function rimettiBase() {
    try { await shelvesApi.updateBase(id, { hidden: false }); await carica(); }
    catch { toast('Errore', 'error'); }
  }

  /* La vista scelta e l'altezza restano con lo scaffale, non con il browser.
     Il cursore scrive una volta sola quando ci si ferma. */
  const salvaVista = useCallback((modo) => {
    setVista(modo);
    shelvesApi.update(id, { view_mode: modo }).catch(() => {});
  }, [id]);

  const attesaAltezza = useRef(null);
  const salvaAltezza = useCallback((valore) => {
    setAltezza(valore);
    clearTimeout(attesaAltezza.current);
    attesaAltezza.current = setTimeout(() => {
      shelvesApi.update(id, { cover_height: valore }).catch(() => {});
    }, 500);
  }, [id]);
  useEffect(() => () => clearTimeout(attesaAltezza.current), []);

  const cambiaEbook = useCallback((mostra) => {
    setMostraEbook(mostra);
    shelvesApi.update(id, { show_ebooks: mostra }).catch(() => {});
  }, [id]);

  async function salvaNome() {
    const v = nomeTmp.trim();
    setRinomino(false);
    if (!v || v === scaffale.name) return;
    try { await shelvesApi.update(id, { name: v }); await carica(); }
    catch { toast('Errore nella rinomina', 'error'); }
  }

  async function cambiaTipo() {
    const nuovo = (scaffale.kind || 'tematico') === 'fisico' ? 'tematico' : 'fisico';
    try { await shelvesApi.update(id, { kind: nuovo }); await carica(); }
    catch { toast('Errore nel cambio di tipo', 'error'); }
  }

  // un'etichetta nuova va in fondo alla fila: non prende libri a nessuno
  async function nuovaSezione() {
    try {
      await shelvesApi.addSection(id, 'Nuova etichetta');
      await carica();
      toast('Etichetta aggiunta in fondo: trascinala dove ti serve', 'success');
    } catch { toast('Errore nella creazione dell’etichetta', 'error'); }
  }

  if (caricamento) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="m-spinner"/></div>
  );
  if (!scaffale) return null;

  const libri = scaffale.books || [];
  const fisico = (scaffale.kind || 'tematico') === 'fisico';
  const apriMenu = (e, libro) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, libro, sezione: libro.section_id || SEZIONE_BASE });
  };
  const aggiunta = punto
    ? <AggiuntaRapida giaPresenti={presenti} onScegli={inserisci} onChiudi={() => setPunto(null)}/>
    : null;

  return (
    <div style={{ padding: '26px 40px 70px' }}>

      {/* ── Intestazione ── */}
      {/* si torna alla libreria di questo scaffale, non alla prima */}
      <button className="m-btn m-btn-ghost m-btn-sm"
        onClick={() => navigate('/scaffali?libreria=' + (scaffale.library_id || 'senza'))}
        style={{ fontSize: 11, marginBottom: 14 }}>‹ tutti gli scaffali</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="m-eyebrow">Scaffale {fisico ? 'fisico' : 'tematico'}</div>
          {rinomino ? (
            <input className="m-input" autoFocus value={nomeTmp}
              onChange={e => setNomeTmp(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') salvaNome(); if (e.key === 'Escape') setRinomino(false); }}
              onBlur={salvaNome}
              style={{ fontSize: 26, fontFamily: "'Cinzel', serif", padding: '2px 8px', marginTop: 4, width: '100%' }}/>
          ) : (
            <div className="m-serif" onDoubleClick={() => { setNomeTmp(scaffale.name); setRinomino(true); }}
              title="Doppio clic per rinominare"
              style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.1, marginTop: 4, cursor: 'text' }}>
              {scaffale.name}
            </div>
          )}
          <div className="m-marginalia" style={{ marginTop: 6 }}>{riepilogo(libri)}</div>
          {scaffale.description && (
            <div className="m-marginalia" style={{ marginTop: 4, fontStyle: 'italic' }}>{scaffale.description}</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="m-btn m-btn-ghost m-btn-sm" onClick={cambiaTipo}
            title="Uno scaffale fisico corrisponde a un gruppo reale sulla libreria">
            {fisico ? '▦ fisico' : '◇ tematico'}
          </button>
          <button className="m-btn m-btn-ghost m-btn-sm" onClick={nuovaSezione}>+ etichetta</button>
          {!testa.visibile && (
            <button className="m-btn m-btn-ghost m-btn-sm" onClick={rimettiBase}
              title="Rimette i nuovi arrivi in testa alla fila">+ {etichettaBase.toLowerCase()}</button>
          )}
        </div>
      </div>

      {/* ── Come guardare lo scaffale ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', margin: '18px 0 6px' }}>
        <div style={{ display: 'flex', border: '1px solid var(--cine-gold-dim)' }}>
          {[['elenco', 'Elenco'], ['mensola', 'Mensola']].map(([k, nome]) => (
            <button key={k} onClick={() => salvaVista(k)}
              style={{
                padding: '5px 14px', cursor: 'pointer', border: 'none',
                fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
                letterSpacing: '0.12em', fontSize: 10,
                background: vista === k ? 'var(--cine-gold)' : 'transparent',
                color: vista === k ? 'var(--cine-bg, #0a0704)' : 'var(--cine-gold-dim)',
              }}>{nome}</button>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
          title="Nasconde i record di tipo ebook, senza toglierli dallo scaffale">
          <input type="checkbox" checked={mostraEbook}
            onChange={e => cambiaEbook(e.target.checked)}
            style={{ accentColor: 'var(--cine-gold)', cursor: 'pointer' }}/>
          <span className="m-eyebrow" style={{ fontSize: 10 }}>Mostra ebook</span>
        </label>

        {vista === 'mensola' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span className="m-eyebrow" style={{ fontSize: 10 }}>Copertine</span>
            <input
              type="range" min="70" max="260" step="10" value={altezza}
              onChange={e => salvaAltezza(Number(e.target.value))}
              title="Altezza delle copertine"
              style={{ width: 'min(190px, 42vw)', accentColor: 'var(--cine-gold)', cursor: 'pointer' }}/>
            <span className="m-nums" style={{ fontSize: 11, opacity: 0.6, minWidth: 34 }}>{altezza}px</span>
          </label>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--m-rule)', margin: '12px 0 24px' }}/>

      {vista === 'mensola' && (
        <>
          <VistaMensola
            elementi={filaVisibile} testa={testa} altezza={altezza} nascosti={nascosti}
            onSposta={sposta} onSpostaMolti={spostaMolti}
            onApri={bid => navigate(`/libro/${bid}`)}
            onMenu={apriMenu}
            onInserisci={dopo => setPunto({ dopo })}
            onRinomina={rinomina} onElimina={elimina}
          />
          {aggiunta}
          {libri.length === 0 && (
            <div className="m-marginalia" style={{ fontStyle: 'italic', fontSize: 12.5 }}>
              Scaffale vuoto: usa il + per aggiungere i primi volumi.
            </div>
          )}
        </>
      )}

      {vista === 'elenco' && (
        <VistaElenco
          elementi={filaVisibile} testa={testa} nascosti={nascosti}
          punto={punto} aggiunta={aggiunta}
          onSposta={sposta}
          onApri={bid => navigate(`/libro/${bid}`)}
          onMenu={apriMenu}
          onInserisci={dopo => setPunto({ dopo })}
          onRinomina={rinomina} onElimina={elimina}
        />
      )}

      {menu && (
        <MenuRiga
          x={menu.x} y={menu.y} libro={menu.libro}
          sezioni={sezioni} sezioneCorrente={menu.sezione}
          altriScaffali={altriScaffali}
          librerie={librerie}
          etichettaBase={etichettaBase}
          onSpostaInSezione={spostaInSezione}
          onTrasferisci={trasferisci}
          onTogli={togli}
          onApri={bid => navigate(`/libro/${bid}`)}
          onChiudi={() => setMenu(null)}
        />
      )}
    </div>
  );
}

/* ── La vista a elenco: la stessa fila, una riga sotto l'altra ──────────────
   Etichette e libri si trascinano allo stesso modo; si lascia sulla metà alta
   di una riga per metterlo prima, sulla metà bassa per metterlo dopo.      */
const chiaveDi = (x) => `${x.tipo}:${x.id}`;
const rifDi = (x) => (x ? { tipo: x.tipo, id: x.id } : null);
const stessoRif = (a, b) => (a === null && b === null) || (a && b && a.tipo === b.tipo && a.id === b.id);

function VistaElenco({ elementi, testa, nascosti, punto, aggiunta,
                      onSposta, onApri, onMenu, onInserisci, onRinomina, onElimina }) {
  const [trascinato, setTrascinato] = useState(null);
  const [guida, setGuida] = useState(null);   // { chiave, lato }

  const conteggi = useMemo(() => {
    const m = new Map([['testa', 0]]);
    let corrente = 'testa';
    for (const x of elementi) {
      if (x.tipo === 'etichetta') { corrente = x.id; m.set(corrente, 0); }
      else m.set(corrente, (m.get(corrente) || 0) + 1);
    }
    return m;
  }, [elementi]);

  const fine = () => { setTrascinato(null); setGuida(null); };
  const latoDi = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return e.clientY < r.top + r.height / 2 ? 'prima' : 'dopo';
  };

  const rilascia = (i, lato) => {
    const mosso = trascinato;
    fine();
    if (!mosso) return;
    const dopo = lato === 'dopo' ? rifDi(elementi[i]) : (i > 0 ? rifDi(elementi[i - 1]) : null);
    if (dopo && dopo.tipo === mosso.tipo && dopo.id === mosso.id) return;
    onSposta(rifDi(mosso), dopo);
  };

  const sorgente = (x) => ({
    draggable: true,
    onDragStart: e => {
      e.dataTransfer?.setData('text/plain', chiaveDi(x));
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      setTrascinato(x);
    },
    onDragEnd: fine,
  });
  const bersaglio = (x, i) => ({
    onDragEnter: e => { e.preventDefault(); if (trascinato) setGuida({ chiave: chiaveDi(x), lato: latoDi(e) }); },
    onDragOver:  e => { e.preventDefault(); if (trascinato) setGuida({ chiave: chiaveDi(x), lato: latoDi(e) }); },
    onDragLeave: () => setGuida(g => (g && g.chiave === chiaveDi(x) ? null : g)),
    onDrop:      e => { e.preventDefault(); rilascia(i, latoDi(e)); },
  });
  const guidaDi = (x) => (guida && guida.chiave === chiaveDi(x) ? guida.lato : null);
  const quiAggiunta = (dopo) => punto && stessoRif(punto.dopo, dopo) ? aggiunta : null;
  const ultimo = elementi.length ? elementi[elementi.length - 1] : null;

  return (
    <div>
      {nascosti > 0 && (
        <div className="m-marginalia" style={{ fontSize: 12, marginBottom: 10 }}>{nascosti} ebook nascosti.</div>
      )}

      {/* la testa: lasciarci qualcosa lo porta all'inizio della fila */}
      {testa.visibile && (
        <div
          onDragEnter={e => { e.preventDefault(); if (trascinato) setGuida({ chiave: 'testa', lato: 'dopo' }); }}
          onDragOver={e => { e.preventDefault(); if (trascinato) setGuida({ chiave: 'testa', lato: 'dopo' }); }}
          onDragLeave={() => setGuida(g => (g && g.chiave === 'testa' ? null : g))}
          onDrop={e => { e.preventDefault(); const m = trascinato; fine(); if (m) onSposta(rifDi(m), null); }}>
          <IntestazioneEtichetta testa nome={testa.nome} conteggio={conteggi.get('testa') || 0}
            guida={guida && guida.chiave === 'testa' ? 'dopo' : null}
            onRinomina={nome => onRinomina(null, nome)} onElimina={() => onElimina(null)}/>
        </div>
      )}
      {quiAggiunta(null)}

      {elementi.map((x, i) => (
        <React.Fragment key={chiaveDi(x)}>
          {x.tipo === 'etichetta' ? (
            <IntestazioneEtichetta
              nome={x.nome || 'Senza nome'} conteggio={conteggi.get(x.id) || 0}
              guida={guidaDi(x)}
              inTrascinamento={trascinato && chiaveDi(trascinato) === chiaveDi(x)}
              sorgente={sorgente(x)} bersaglio={bersaglio(x, i)}
              onRinomina={nome => onRinomina(x.id, nome)} onElimina={() => onElimina(x.id)}/>
          ) : (
            <Riga
              libro={x.libro} guida={guidaDi(x)}
              inTrascinamento={trascinato && chiaveDi(trascinato) === chiaveDi(x)}
              sorgente={sorgente(x)} bersaglio={bersaglio(x, i)}
              onApri={() => onApri(x.id)}
              onMenu={e => onMenu(e, x.libro)}
              onInserisciQui={() => onInserisci(rifDi(x))}/>
          )}
          {quiAggiunta(rifDi(x))}
        </React.Fragment>
      ))}

      {/* in fondo: lasciarci qualcosa lo mette per ultimo */}
      <div
        onDragEnter={e => { e.preventDefault(); if (trascinato) setGuida({ chiave: 'coda', lato: 'prima' }); }}
        onDragOver={e => { e.preventDefault(); if (trascinato) setGuida({ chiave: 'coda', lato: 'prima' }); }}
        onDragLeave={() => setGuida(g => (g && g.chiave === 'coda' ? null : g))}
        onDrop={e => {
          e.preventDefault();
          if (ultimo) rilascia(elementi.length - 1, 'dopo');
          else { const m = trascinato; fine(); if (m) onSposta(rifDi(m), null); }
        }}
        style={{
          marginTop: 8, paddingTop: 8,
          borderTop: guida?.chiave === 'coda' ? '2px solid var(--m-terracotta)' : '2px solid transparent',
        }}>
        <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11 }}
          onClick={() => onInserisci(rifDi(ultimo))}>+ aggiungi in fondo</button>
      </div>
      {punto && ultimo && stessoRif(punto.dopo, rifDi(ultimo)) ? null : null}
    </div>
  );
}

/* ── Un'etichetta nella vista a elenco ────────────────────────────────────────
   Tutta la riga si trascina, non solo la maniglia: è quello che viene naturale
   prendere. Doppio clic per rinominare.                                      */
function IntestazioneEtichetta({ nome, conteggio, testa, guida, inTrascinamento,
                                sorgente, bersaglio, onRinomina, onElimina }) {
  const [rinomino, setRinomino] = useState(false);
  const [val, setVal] = useState('');
  const [conferma, setConferma] = useState(false);

  const salva = () => {
    const v = val.trim();
    setRinomino(false);
    if (v && v !== nome) onRinomina(v);
  };

  const trascinabile = !testa && !rinomino && sorgente;
  return (
    <div
      {...(trascinabile ? sorgente : {})}
      {...(bersaglio || {})}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        margin: '22px 0 8px', padding: '4px 2px',
        cursor: trascinabile ? 'grab' : 'default',
        opacity: inTrascinamento ? 0.4 : 1,
        borderTop: guida === 'prima' ? '3px solid var(--m-terracotta)' : '3px solid transparent',
        borderBottom: guida === 'dopo' ? '3px solid var(--m-terracotta)' : '3px solid transparent',
      }}>
      {!testa && <span style={{ color: 'var(--m-ink-muted)', fontSize: 15, userSelect: 'none' }}>⠿</span>}
      {rinomino ? (
        <input className="m-input" autoFocus value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') salva(); if (e.key === 'Escape') setRinomino(false); }}
          onBlur={salva}
          style={{ fontSize: 17, fontFamily: "'EB Garamond', serif", padding: '2px 8px', flex: '0 1 300px' }}/>
      ) : (
        <div className="m-serif"
          onDoubleClick={() => { setVal(nome); setRinomino(true); }}
          title={testa ? 'Doppio clic per rinominare — è l’inizio della fila' : 'Trascina per spostarla · doppio clic per rinominare'}
          style={{ fontSize: 19, fontWeight: 500, flexShrink: 0, userSelect: 'none',
                   fontStyle: testa ? 'italic' : 'normal' }}>
          {nome}
        </div>
      )}

      <div style={{ flex: 1, height: 1, background: 'var(--m-rule)' }}/>
      <span className="m-nums" style={{ fontSize: 11, color: 'var(--m-ink-muted)' }}>{conteggio}</span>

      {!conferma && (
        <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 10 }}
          onClick={() => setConferma(true)}>✕</button>
      )}
      {conferma && (
        <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--m-ink-muted)' }}>
            {testa ? 'togliere i nuovi arrivi?' : 'togliere l’etichetta?'}
          </span>
          <button className="m-btn m-btn-sm" style={{ fontSize: 10 }}
            onClick={() => { setConferma(false); onElimina(); }}>sì</button>
          <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 10 }}
            onClick={() => setConferma(false)}>no</button>
        </span>
      )}
    </div>
  );
}

/* ── Una riga dello scaffale ──────────────────────────────────────────────── */
function Riga({ libro, guida, inTrascinamento, sorgente, bersaglio, onApri, onMenu, onInserisciQui }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      {...sorgente} {...bersaglio}
      onContextMenu={onMenu}
      onDoubleClick={onApri}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title="Doppio clic: apri la scheda · tasto destro: altre azioni"
      style={{
        display: 'flex', alignItems: 'center', gap: 11, padding: '5px 8px',
        borderBottom: guida === 'dopo' ? '2px solid var(--m-terracotta)' : '1px solid var(--m-rule)',
        borderTop: guida === 'prima' ? '2px solid var(--m-terracotta)' : '2px solid transparent',
        background: hover ? 'var(--m-rule)' : 'transparent',
        opacity: inTrascinamento ? 0.4 : 1,
        cursor: 'grab', userSelect: 'none',
      }}>
      <span style={{ color: 'var(--m-ink-muted)', fontSize: 14, flexShrink: 0, lineHeight: 1 }}>⠿</span>
      <BookCover book={libro} w={26} h={38}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {libro.title}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--m-ink-muted)', fontStyle: 'italic',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {libro.author_names || '—'}
        </div>
      </div>
      <span className="m-nums" style={{ fontSize: 11, color: 'var(--m-ink-muted)', flexShrink: 0 }}>
        {libro.year || ''}
      </span>
      {hover && (
        <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 10, flexShrink: 0 }}
          onClick={e => { e.stopPropagation(); onInserisciQui(); }}
          title="Inserisci un record subito dopo questo">+</button>
      )}
    </div>
  );
}
