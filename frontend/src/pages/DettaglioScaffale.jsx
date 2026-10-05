import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import { tipoRecord } from '../components/EbookMark.jsx';
import { shelves as shelvesApi, books as booksApi } from '../api/index.js';
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
function MenuRiga({ x, y, libro, sezioni, sezioneCorrente, altriScaffali,
                    onSpostaInSezione, onTrasferisci, onTogli, onApri, onChiudi }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({
      left: r.right > window.innerWidth ? Math.max(4, x - r.width) : x,
      top:  r.bottom > window.innerHeight ? Math.max(4, window.innerHeight - r.height - 6) : y,
    });
  }, [x, y]);

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
              {s.id === sezioneCorrente ? '• ' : '  '}{s.name || 'Sezione generica'}
            </Voce>
          ))}
        </>
      )}

      {altriScaffali.length > 0 && (
        <>
          <Titoletto>Sposta su un altro scaffale</Titoletto>
          {altriScaffali.map(s => (
            <Voce key={'m' + s.id} onClick={() => { onChiudi(); onTrasferisci(libro, s.id, 'move'); }}>→ {s.name}</Voce>
          ))}
          <Titoletto>Copia su un altro scaffale</Titoletto>
          {altriScaffali.map(s => (
            <Voce key={'c' + s.id} onClick={() => { onChiudi(); onTrasferisci(libro, s.id, 'copy'); }}>⧉ {s.name}</Voce>
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
  const [caricamento, setCaric]   = useState(true);
  const [menu, setMenu]           = useState(null);
  const [punto, setPunto]         = useState(null);   // dove inserire: { sectionId, afterBookId }
  const [trascinato, setTrasc]    = useState(null);
  const [sopra, setSopra]         = useState(null);   // riga sorvolata durante il trascinamento
  const [rinomino, setRinomino]   = useState(false);
  const [nomeTmp, setNomeTmp]     = useState('');
  const [vista, setVista]         = useState('elenco');     // 'elenco' | 'mensola'
  const [altezza, setAltezza]     = useState(130);          // altezza delle copertine

  const carica = useCallback(() => {
    return shelvesApi.get(id)
      .then(s => {
        setScaffale(s);
        setVista(s.view_mode === 'mensola' ? 'mensola' : 'elenco');
        setAltezza(s.cover_height || 130);
      })
      .catch(() => { toast('Scaffale non trovato', 'error'); navigate('/scaffali'); })
      .finally(() => setCaric(false));
  }, [id, navigate, toast]);

  useEffect(() => { carica(); }, [carica]);
  useEffect(() => { shelvesApi.list().then(setTutti).catch(() => {}); }, []);

  /* Le sezioni, con in testa quella senza nome che accoglie i nuovi arrivi. */
  const sezioni = useMemo(() => {
    if (!scaffale) return [];
    return [
      { id: SEZIONE_BASE, name: null, sectionId: null },
      ...(scaffale.sections || []).map(s => ({ ...s, sectionId: s.id })),
    ];
  }, [scaffale]);

  const perSezione = useMemo(() => {
    const m = {};
    for (const s of sezioni) m[s.id] = [];
    for (const b of (scaffale?.books || [])) {
      const chiave = b.section_id || SEZIONE_BASE;
      (m[chiave] ||= []).push(b);
    }
    return m;
  }, [scaffale, sezioni]);

  const presenti = useMemo(() => new Set((scaffale?.books || []).map(b => b.id)), [scaffale]);
  const altriScaffali = useMemo(() => tuttiScaffali.filter(s => s.id !== id), [tuttiScaffali, id]);

  /* ── Azioni ── */
  async function inserisci(libro) {
    try {
      await shelvesApi.addBook(id, libro.id, {
        section_id: punto?.sectionId ?? null,
        after_book_id: punto?.afterBookId ?? null,
      });
      setPunto(null);
      await carica();
      toast(`"${libro.title}" sullo scaffale`, 'success');
    } catch (e) {
      toast(e?.response?.data?.error || 'Non sono riuscito a inserirlo', 'error');
    }
  }

  async function togli(libro) {
    try {
      await shelvesApi.removeBook(id, libro.id);
      await carica();
      toast(`"${libro.title}" tolto dallo scaffale — resta in catalogo`, 'success');
    } catch { toast('Errore nel togliere il record', 'error'); }
  }

  async function spostaInSezione(libro, sezioneId) {
    try {
      await shelvesApi.moveBook(id, libro.id, {
        after_book_id: null,
        section_id: sezioneId === SEZIONE_BASE ? null : sezioneId,
      });
      await carica();
    } catch { toast('Errore nello spostamento', 'error'); }
  }

  async function trasferisci(libro, scaffaleId, modo) {
    try {
      await shelvesApi.transfer(id, libro.id, scaffaleId, modo);
      await carica();
      const dove = tuttiScaffali.find(s => s.id === scaffaleId)?.name || 'altro scaffale';
      toast(modo === 'move' ? `Spostato in "${dove}"` : `Copiato in "${dove}"`, 'success');
    } catch { toast('Errore nel trasferimento', 'error'); }
  }

  async function rilascia(sezioneId, dopoId) {
    if (!trascinato) return;
    const dest = sezioneId === SEZIONE_BASE ? null : sezioneId;
    setTrasc(null); setSopra(null);
    if (trascinato.id === dopoId) return;
    try {
      await shelvesApi.moveBook(id, trascinato.id, { after_book_id: dopoId, section_id: dest });
      await carica();
    } catch { toast('Errore nel riordino', 'error'); }
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

  async function nuovaSezione() {
    try { await shelvesApi.addSection(id, 'Nuova sezione'); await carica(); }
    catch { toast('Errore nella creazione della sezione', 'error'); }
  }

  if (caricamento) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="m-spinner"/></div>
  );
  if (!scaffale) return null;

  const libri = scaffale.books || [];
  const fisico = (scaffale.kind || 'tematico') === 'fisico';

  return (
    <div style={{ padding: '26px 40px 70px', maxWidth: 1100 }}>

      {/* ── Intestazione ── */}
      <button className="m-btn m-btn-ghost m-btn-sm" onClick={() => navigate('/scaffali')}
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
          <button className="m-btn m-btn-ghost m-btn-sm" onClick={nuovaSezione}>+ sezione</button>
        </div>
      </div>

      {/* ── Come guardare lo scaffale ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        margin: '18px 0 6px',
      }}>
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

      {/* ── Mensola: le copertine in fila su un ripiano ── */}
      {vista === 'mensola' && (
        <>
          <VistaMensola
            sezioni={sezioni} perSezione={perSezione} sezioneBase={SEZIONE_BASE}
            altezza={altezza}
            trascinato={trascinato} sopra={sopra}
            onTrascinaInizio={setTrasc}
            onTrascinaFine={() => { setTrasc(null); setSopra(null); }}
            onSorvola={setSopra}
            onEsci={chiave => setSopra(x => (x === chiave ? null : x))}
            onRilascia={rilascia}
            onApri={bid => navigate(`/libro/${bid}`)}
            onMenu={(e, b, sezId) => {
              e.preventDefault();
              setMenu({ x: e.clientX, y: e.clientY, libro: b, sezione: sezId });
            }}
            onInserisci={(sezId, dopoId) => setPunto({ sectionId: sezId, afterBookId: dopoId })}
          />
          {punto && (
            <AggiuntaRapida giaPresenti={presenti} onScegli={inserisci} onChiudi={() => setPunto(null)}/>
          )}
          {libri.length === 0 && (
            <div className="m-marginalia" style={{ fontStyle: 'italic', fontSize: 12.5 }}>
              Scaffale vuoto. Passa all’elenco per aggiungere i primi volumi.
            </div>
          )}
        </>
      )}

      {/* ── Elenco ── */}
      {vista === 'elenco' && sezioni.map(sez => {
        const righe = perSezione[sez.id] || [];
        const base = sez.id === SEZIONE_BASE;
        return (
          <section key={sez.id} style={{ marginBottom: 30 }}>
            <IntestazioneSezione
              sezione={sez} base={base} conteggio={righe.length}
              scaffaleId={id} onCambiato={carica} toast={toast}
            />

            {righe.length === 0 && (
              <div className="m-marginalia" style={{ fontStyle: 'italic', padding: '10px 0 4px', fontSize: 12.5 }}>
                {base ? 'Nessun record. Usa “aggiungi” qui sotto.' : 'Sezione vuota.'}
              </div>
            )}

            {righe.map(b => (
              <Riga
                key={b.id} libro={b}
                sorvolata={sopra === b.id}
                inTrascinamento={trascinato?.id === b.id}
                onDragStart={() => setTrasc(b)}
                onDragEnd={() => { setTrasc(null); setSopra(null); }}
                onDragOver={e => { e.preventDefault(); setSopra(b.id); }}
                onDragLeave={() => setSopra(s => s === b.id ? null : s)}
                onDrop={e => { e.preventDefault(); rilascia(sez.id, b.id); }}
                onApri={() => navigate(`/libro/${b.id}`)}
                onMenu={e => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, libro: b, sezione: sez.id }); }}
                onInserisciQui={() => setPunto({ sectionId: base ? null : sez.id, afterBookId: b.id })}
              />
            ))}

            {/* zona di rilascio in coda alla sezione */}
            <div
              onDragOver={e => { e.preventDefault(); setSopra('coda-' + sez.id); }}
              onDragLeave={() => setSopra(s => s === 'coda-' + sez.id ? null : s)}
              onDrop={e => { e.preventDefault(); rilascia(sez.id, righe.length ? righe[righe.length - 1].id : null); }}
              style={{
                marginTop: 6, paddingTop: 6,
                borderTop: sopra === 'coda-' + sez.id ? '2px solid var(--m-terracotta)' : '2px solid transparent',
              }}>
              <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11 }}
                onClick={() => setPunto({
                  sectionId: base ? null : sez.id,
                  afterBookId: righe.length ? righe[righe.length - 1].id : null,
                })}>
                + aggiungi in questa sezione
              </button>
            </div>

            {punto && (punto.sectionId === (base ? null : sez.id)) && (
              <AggiuntaRapida giaPresenti={presenti} onScegli={inserisci} onChiudi={() => setPunto(null)}/>
            )}
          </section>
        );
      })}

      {menu && (
        <MenuRiga
          x={menu.x} y={menu.y} libro={menu.libro}
          sezioni={sezioni} sezioneCorrente={menu.sezione}
          altriScaffali={altriScaffali}
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

/* ── Intestazione di una sezione (rinomina / elimina) ─────────────────────── */
function IntestazioneSezione({ sezione, base, conteggio, scaffaleId, onCambiato, toast }) {
  const [rinomino, setRinomino] = useState(false);
  const [val, setVal] = useState('');
  const [conferma, setConferma] = useState(false);

  async function salva() {
    const v = val.trim();
    setRinomino(false);
    if (v === (sezione.name || '')) return;
    try { await shelvesApi.updateSection(scaffaleId, sezione.id, { name: v || null }); onCambiato(); }
    catch { toast('Errore nella rinomina', 'error'); }
  }
  async function elimina() {
    try {
      await shelvesApi.deleteSection(scaffaleId, sezione.id);
      onCambiato();
      toast('Sezione eliminata — i record restano sullo scaffale', 'success');
    } catch { toast('Errore nell\'eliminazione', 'error'); }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      {rinomino ? (
        <input className="m-input" autoFocus value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') salva(); if (e.key === 'Escape') setRinomino(false); }}
          onBlur={salva}
          style={{ fontSize: 17, fontFamily: "'EB Garamond', serif", padding: '2px 8px', flex: '0 1 300px' }}/>
      ) : (
        <div className="m-serif"
          onDoubleClick={() => { if (!base) { setVal(sezione.name || ''); setRinomino(true); } }}
          title={base ? undefined : 'Doppio clic per rinominare'}
          style={{ fontSize: 19, fontWeight: 500, flexShrink: 0, cursor: base ? 'default' : 'text' }}>
          {sezione.name || 'Sezione generica'}
        </div>
      )}

      <div style={{ flex: 1, height: 1, background: 'var(--m-rule)' }}/>
      <span className="m-nums" style={{ fontSize: 11, color: 'var(--m-ink-muted)' }}>{conteggio}</span>

      {!base && !conferma && (
        <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 10 }}
          onClick={() => setConferma(true)}>✕</button>
      )}
      {!base && conferma && (
        <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--m-ink-muted)' }}>eliminare la sezione?</span>
          <button className="m-btn m-btn-sm" style={{ fontSize: 10 }} onClick={elimina}>sì</button>
          <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 10 }} onClick={() => setConferma(false)}>no</button>
        </span>
      )}
    </div>
  );
}

/* ── Una riga dello scaffale ──────────────────────────────────────────────── */
function Riga({ libro, sorvolata, inTrascinamento, onDragStart, onDragEnd, onDragOver,
                onDragLeave, onDrop, onApri, onMenu, onInserisciQui }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      draggable
      onDragStart={onDragStart} onDragEnd={onDragEnd}
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      onContextMenu={onMenu}
      onDoubleClick={onApri}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title="Doppio clic: apri la scheda · tasto destro: altre azioni"
      style={{
        display: 'flex', alignItems: 'center', gap: 11, padding: '5px 8px',
        borderBottom: '1px solid var(--m-rule)',
        borderTop: sorvolata ? '2px solid var(--m-terracotta)' : '2px solid transparent',
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
