import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookorbit as boApi, books as booksApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';

/* Gli ebook stanno in BookOrbit; qui si decide a quale record del catalogo
   corrispondono. Niente viene collegato o creato senza una conferma esplicita. */

const LIVELLI = [
  ['certo',      'Certi',       'ISBN identico'],
  ['probabile',  'Probabili',   'titolo e autore coincidono'],
  ['verificare', 'Da verificare', 'somiglianza parziale: guarda tu'],
  ['nessuno',    'Senza corrispondenza', 'non sono in catalogo'],
];

const copertinaLibro = (b) => b?.cover_local || b?.cover_url || null;

/* ─── riquadro di una copertina, con ripiego tipografico ───────────────────── */
function Miniatura({ src, titolo, larghezza = 44 }) {
  const [rotta, setRotta] = useState(false);
  const altezza = Math.round(larghezza * 1.5);
  if (src && !rotta) {
    return (
      <img src={src} alt="" onError={() => setRotta(true)} style={{
        width: larghezza, height: altezza, objectFit: 'cover', flexShrink: 0,
        border: '1px solid var(--m-rule)', background: 'var(--m-rule)',
      }}/>
    );
  }
  return (
    <div style={{
      width: larghezza, height: altezza, flexShrink: 0,
      border: '1px solid var(--m-rule)', background: 'rgba(0,0,0,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 2, overflow: 'hidden',
    }}>
      <span className="m-serif" style={{
        fontSize: Math.max(7, Math.round(larghezza / 6)), lineHeight: 1.1,
        textAlign: 'center', color: 'var(--cine-gold-dim)', opacity: 0.8,
      }}>{(titolo || '').slice(0, 24)}</span>
    </div>
  );
}

/* ─── scelta manuale: cerca nel catalogo e scegli il record ────────────────── */
function CollegaAMano({ ebook, onScelto, onChiudi }) {
  const [q, setQ] = useState(ebook.title || '');
  const [esiti, setEsiti] = useState([]);
  const [cerco, setCerco] = useState(false);
  const campo = useRef(null);

  useEffect(() => { campo.current?.focus(); campo.current?.select(); }, []);

  useEffect(() => {
    if (!q.trim()) { setEsiti([]); return; }
    setCerco(true);
    const t = setTimeout(() => {
      booksApi.list({ search: q.trim(), limit: 20 })
        .then(r => setEsiti(r.books || []))
        .catch(() => setEsiti([]))
        .finally(() => setCerco(false));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onChiudi(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onChiudi]);

  return (
    <div onClick={onChiudi} style={{
      position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8vh 16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--m-parchment)', border: '1px solid var(--m-rule)',
        width: 'min(620px, 100%)', maxHeight: '76vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--m-rule)' }}>
          <div className="m-eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>Collega a mano</div>
          <div className="m-serif" style={{ fontSize: 16 }}>{ebook.title}</div>
          <div className="m-marginalia" style={{ fontSize: 12, marginTop: 2 }}>
            {(ebook.authors || []).join(', ') || 'senza autore'}
          </div>
        </div>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--m-rule)' }}>
          <input
            ref={campo} value={q} onChange={e => setQ(e.target.value)}
            placeholder="cerca nel catalogo per titolo, autore, editore…"
            style={{
              width: '100%', padding: '8px 10px', fontSize: 14,
              background: 'transparent', color: 'var(--m-ink)',
              border: '1px solid var(--m-rule)', outline: 'none',
            }}/>
          <div className="m-marginalia" style={{ fontSize: 11, marginTop: 6 }}>
            Serve per i casi che l’abbinamento automatico non può trovare: per esempio
            l’ebook in lingua originale e il cartaceo in traduzione.
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {cerco && <div style={{ padding: 18, textAlign: 'center' }}><div className="m-spinner"/></div>}
          {!cerco && !esiti.length && q.trim() && (
            <div className="m-marginalia" style={{ padding: 18, fontSize: 12 }}>nessun record trovato</div>
          )}
          {esiti.map(b => (
            <div key={b.id} onClick={() => onScelto(b)} style={{
              display: 'flex', gap: 10, alignItems: 'center', padding: '8px 18px',
              cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--m-rule)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Miniatura src={copertinaLibro(b)} titolo={b.title} larghezza={30}/>
              <div style={{ minWidth: 0 }}>
                <div className="m-serif" style={{ fontSize: 14, lineHeight: 1.2 }}>{b.title}</div>
                <div className="m-marginalia" style={{ fontSize: 11 }}>
                  {(b.authors || []).map(a => a.name).join(', ')}
                  {b.year ? ` · ${b.year}` : ''}{b.publisher ? ` · ${b.publisher}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── riepilogo prima di applicare ─────────────────────────────────────────── */
function Conferma({ titolo, righe, nota, onSi, onNo, inCorso }) {
  return (
    <div onClick={onNo} style={{
      position: 'fixed', inset: 0, zIndex: 850, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--m-parchment)', border: '1px solid var(--m-rule)',
        width: 'min(540px, 100%)', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--m-rule)' }}>
          <div className="m-eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>Conferma</div>
          <div className="m-serif" style={{ fontSize: 17 }}>{titolo}</div>
        </div>
        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
          {righe.map((r, i) => (
            <div key={i} style={{ fontSize: 13, marginBottom: 5, display: 'flex', gap: 8 }}>
              <span className="m-nums" style={{ color: 'var(--cine-gold)', minWidth: 34, textAlign: 'right' }}>{r[0]}</span>
              <span>{r[1]}</span>
            </div>
          ))}
          {nota && <div className="m-marginalia" style={{ fontSize: 12, marginTop: 12 }}>{nota}</div>}
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--m-rule)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="m-btn m-btn-ghost m-btn-sm" onClick={onNo} disabled={inCorso}>annulla</button>
          <button className="m-btn m-btn-sm" onClick={onSi} disabled={inCorso}>{inCorso ? '…' : 'applica'}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── una proposta ─────────────────────────────────────────────────────────── */
function Proposta({ p, livello, scelto, onSpunta, onConferma, onIgnora, onAMano, onCrea }) {
  const e = p.ebook;
  const unico = p.candidati.length === 1 ? p.candidati[0] : null;
  const [scelta, setScelta] = useState(unico?.id || null);
  const candidato = p.candidati.find(c => c.id === scelta) || null;
  const selezionabile = livello === 'probabile' || livello === 'verificare';

  return (
    <div style={{
      border: '1px solid var(--m-rule)', padding: '10px 12px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      background: scelto ? 'rgba(191,161,88,0.10)' : 'transparent',
    }}>
      {selezionabile && (
        <input type="checkbox" checked={scelto} disabled={!candidato}
          onChange={ev => onSpunta(e.id, ev.target.checked, scelta)}
          title={candidato ? 'seleziona per confermare in blocco' : 'scegli prima un candidato'}
          style={{ marginTop: 20, accentColor: 'var(--cine-gold)', cursor: 'pointer' }}/>
      )}

      {/* l'ebook */}
      <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 0 }}>
        <Miniatura src={e.copertina} titolo={e.title}/>
        <div style={{ minWidth: 0 }}>
          <div className="m-eyebrow" style={{ fontSize: 9, marginBottom: 2 }}>in BookOrbit</div>
          <div className="m-serif" style={{ fontSize: 14, lineHeight: 1.2 }}>{e.title}</div>
          <div className="m-marginalia" style={{ fontSize: 11 }}>
            {(e.authors || []).join(', ') || 'senza autore'}
            {e.year ? ` · ${e.year}` : ''}
            {e.file_format ? ` · ${e.file_format}` : ''}
          </div>
          {e.link_scheda && (
            <a href={e.link_scheda} target="_blank" rel="noreferrer"
              className="m-marginalia" style={{ fontSize: 11, color: 'var(--cine-gold)' }}>
              apri in BookOrbit ↗
            </a>
          )}
        </div>
      </div>

      {/* il candidato in catalogo */}
      {p.candidati.length > 0 && (
        <>
          <div style={{ alignSelf: 'center', color: 'var(--cine-gold-dim)', fontSize: 18 }}>≟</div>
          <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 0 }}>
            <Miniatura src={copertinaLibro(candidato)} titolo={candidato?.title}/>
            <div style={{ minWidth: 0 }}>
              <div className="m-eyebrow" style={{ fontSize: 9, marginBottom: 2 }}>in Malachia</div>
              {p.candidati.length > 1 ? (
                <select value={scelta || ''} onChange={ev => { setScelta(ev.target.value); onSpunta(e.id, false); }}
                  style={{
                    width: '100%', fontSize: 13, padding: '3px 4px', background: 'transparent',
                    color: 'var(--m-ink)', border: '1px solid var(--m-rule)',
                  }}>
                  <option value="">— scegli fra {p.candidati.length} —</option>
                  {p.candidati.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}{c.year ? ` (${c.year})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="m-serif" style={{ fontSize: 14, lineHeight: 1.2 }}>{candidato?.title}</div>
              )}
              <div className="m-marginalia" style={{ fontSize: 11 }}>
                {(candidato?.authors || []).join(', ')}
                {candidato?.year ? ` · ${candidato.year}` : ''}
                {candidato?.publisher ? ` · ${candidato.publisher}` : ''}
              </div>
            </div>
          </div>
        </>
      )}

      {/* azioni */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        {p.candidati.length > 0 && (
          <button className="m-btn m-btn-sm" disabled={!candidato} style={{ fontSize: 11 }}
            onClick={() => onConferma(e.id, scelta)}>è lo stesso libro</button>
        )}
        {p.candidati.length === 0 && (
          <button className="m-btn m-btn-sm" style={{ fontSize: 11 }}
            onClick={() => onCrea([e.id])}>crea come nuovo ebook</button>
        )}
        <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11 }}
          onClick={() => onAMano(e)}>collega a mano</button>
        <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11 }}
          onClick={() => onIgnora([e.id])}>
          {p.candidati.length > 0 ? 'sono diversi' : 'ignora'}
        </button>
      </div>
    </div>
  );
}

/* ─── pagina ───────────────────────────────────────────────────────────────── */
export default function Ebook() {
  const navigate = useNavigate();
  const toast = useToast();

  const [stato, setStato] = useState(null);
  const [proposte, setProposte] = useState(null);
  const [caricando, setCaricando] = useState(true);
  const [lavorando, setLavorando] = useState(false);
  const [scheda, setScheda] = useState('certo');
  const [spunte, setSpunte] = useState({});          // { [idEbook]: idLibro }
  const [aMano, setAMano] = useState(null);
  const [conferma, setConferma] = useState(null);
  const [collegati, setCollegati] = useState([]);
  const [ignorati, setIgnorati] = useState([]);

  const carica = useCallback(async () => {
    setCaricando(true);
    try {
      const s = await boApi.status();
      setStato(s);
      if (s.specchio.totale > 0) {
        setProposte(await boApi.proposals());
        setCollegati(await boApi.items({ stato: 'collegato' }));
        setIgnorati(await boApi.items({ stato: 'ignorato' }));
      }
    } catch (err) {
      setStato({ configurato: true, raggiungibile: false, errore: 'Malachia non riesce a interrogare BookOrbit', specchio: { totale: 0 } });
    } finally { setCaricando(false); }
  }, []);

  useEffect(() => { carica(); }, [carica]);

  const dopo = async (messaggio) => { toast?.(messaggio, 'success'); setSpunte({}); setConferma(null); await carica(); };

  /* — sincronizzazione — */
  const sincronizza = async () => {
    setLavorando(true);
    try {
      const a = await boApi.sync({ anteprima: true });
      setConferma({
        titolo: 'Aggiorna l’elenco degli ebook',
        righe: [
          [a.letti_da_bookorbit, 'ebook letti da BookOrbit'],
          [a.nuovi, 'nuovi, da esaminare'],
          [a.aggiornati, 'con dati cambiati'],
          [a.orfani, 'spariti da BookOrbit (diventano orfani)'],
          [a.tornati, 'tornati disponibili'],
        ],
        nota: 'Aggiorna soltanto l’elenco locale. Non collega niente e non modifica nessun record del catalogo.',
        azione: async () => {
          const r = await boApi.sync();
          await dopo(`elenco aggiornato: ${r.nuovi} nuovi, ${r.orfani} orfani`);
        },
      });
    } catch (err) {
      toast?.(err?.response?.data?.error || 'BookOrbit non risponde', 'error');
    } finally { setLavorando(false); }
  };

  /* — conferma singola — */
  const conferma1 = async (idEbook, idLibro) => {
    if (!idLibro) return;
    setLavorando(true);
    try {
      const r = await boApi.link([{ bookorbit_id: idEbook, book_id: idLibro }]);
      await dopo(r.copertine_scaricate ? 'collegato, copertina scaricata' : 'collegato');
    } catch { toast?.('non è stato possibile collegare', 'error'); }
    finally { setLavorando(false); }
  };

  /* — conferma in blocco: tutti i certi, o le spunte — */
  const confermaBlocco = (abbinamenti, descrizione) => {
    if (!abbinamenti.length) { toast?.('niente da confermare', 'error'); return; }
    setConferma({
      titolo: descrizione,
      righe: [[abbinamenti.length, 'abbinamenti da confermare']],
      nota: 'I record del catalogo ricevono soltanto il riferimento all’ebook. La copertina viene scaricata solo dove manca.',
      azione: async () => {
        const r = await boApi.link(abbinamenti);
        await dopo(`${r.collegati} collegati${r.copertine_scaricate ? `, ${r.copertine_scaricate} copertine` : ''}`);
      },
    });
  };

  /* — creazione di nuovi record — */
  const crea = async (ids) => {
    if (!ids.length) return;
    setLavorando(true);
    try {
      const a = await boApi.create(ids, { anteprima: true });
      setConferma({
        titolo: ids.length === 1 ? 'Crea un nuovo record ebook' : `Crea ${a.record_da_creare} nuovi record ebook`,
        righe: [
          [a.record_da_creare, 'record nuovi, di tipo ebook'],
          [a.autori_riusati, 'autori già in catalogo, riusati'],
          [a.autori_nuovi, 'autori da creare'],
        ],
        nota: 'Le copertine vengono scaricate da BookOrbit. Nessun record esistente viene modificato.',
        azione: async () => {
          const r = await boApi.create(ids);
          await dopo(`${r.creati} record creati, ${r.copertine_scaricate} copertine`);
        },
      });
    } catch { toast?.('non è stato possibile preparare la creazione', 'error'); }
    finally { setLavorando(false); }
  };

  const ignora = async (ids) => {
    try { await boApi.ignore(ids); await dopo(ids.length === 1 ? 'messo fra gli ignorati' : `${ids.length} ignorati`); }
    catch { toast?.('operazione non riuscita', 'error'); }
  };

  const spunta = (idEbook, attivo, idLibro) => setSpunte(s => {
    const n = { ...s };
    if (attivo && idLibro) n[idEbook] = idLibro; else delete n[idEbook];
    return n;
  });

  if (caricando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div className="m-spinner"/>
    </div>
  );

  const c = proposte?.conteggi || {};
  const nSpunte = Object.keys(spunte).length;
  const schede = [
    ...LIVELLI.map(([k, nome, spiega]) => [k, nome, spiega, c[k] || 0]),
    ['collegati', 'Collegati', 'già abbinati a un record', collegati.length],
    ['ignorati', 'Ignorati', 'messi da parte', ignorati.length],
  ];

  return (
    <div style={{ padding: '28px 36px 48px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', height: '100%' }}>

      {/* intestazione */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0, gap: 16 }}>
        <div>
          <div className="m-eyebrow" style={{ marginBottom: 4 }}>Capitulum V</div>
          <div style={{
            fontFamily: "'Cinzel', 'Mantinia', serif",
            fontSize: 42, fontWeight: 400, lineHeight: 1.05, color: 'var(--cine-cream)',
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            Ebook
            <em style={{
              fontFamily: "'Agmena Pro', 'EB Garamond', Georgia, serif",
              fontSize: 22, fontStyle: 'italic', fontWeight: 400,
              color: 'var(--cine-gold)', letterSpacing: '0.01em',
              textTransform: 'none', marginLeft: '0.4em',
            }}>& corrispondenze</em>
          </div>
        </div>
        <button className="m-btn" onClick={sincronizza}
          disabled={lavorando || !stato?.raggiungibile}>
          {lavorando ? '…' : '↻ aggiorna elenco'}
        </button>
      </div>

      {/* avviso: compare solo qui, il resto dell'app non ne risente */}
      {!stato?.raggiungibile && (
        <div style={{
          border: '1px solid rgba(192,57,43,0.45)', background: 'rgba(192,57,43,0.08)',
          padding: '12px 16px',
        }}>
          <div className="m-eyebrow" style={{ fontSize: 10, color: '#c0392b', marginBottom: 4 }}>
            BookOrbit non raggiungibile
          </div>
          <div style={{ fontSize: 13 }}>{stato?.errore || 'nessuna risposta dal server'}</div>
          <div className="m-marginalia" style={{ fontSize: 12, marginTop: 6 }}>
            Il resto di Malachia funziona normalmente. Gli ebook già collegati restano collegati:
            qui non si può solo aggiornare l’elenco.
          </div>
        </div>
      )}

      {/* specchio vuoto */}
      {stato?.specchio?.totale === 0 && stato?.raggiungibile && (
        <div style={{ border: '1px solid var(--m-rule)', padding: '22px 24px' }}>
          <div className="m-serif" style={{ fontSize: 17, marginBottom: 6 }}>L’elenco è ancora vuoto</div>
          <div className="m-marginalia" style={{ fontSize: 13, maxWidth: 560 }}>
            Premi <em>aggiorna elenco</em> per leggere il catalogo di BookOrbit. Viene riempito
            soltanto un elenco locale: nessun record del catalogo viene toccato, e nessun
            abbinamento viene applicato finché non lo confermi.
          </div>
        </div>
      )}

      {/* schede */}
      {proposte && (
        <>
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--cine-gold-dim)', flexWrap: 'wrap' }}>
            {schede.map(([k, nome, spiega, n]) => (
              <div key={k} onClick={() => { setScheda(k); setSpunte({}); }} title={spiega} style={{
                padding: '8px 16px', cursor: 'pointer',
                borderBottom: scheda === k ? '2px solid var(--cine-gold)' : '2px solid transparent',
                color: scheda === k ? 'var(--cine-cream)' : 'var(--cine-gold-dim)',
              }}>
                <span className="m-eyebrow" style={{ fontSize: 11 }}>{nome}</span>
                <span className="m-nums" style={{ marginLeft: 7, fontSize: 12, opacity: 0.85 }}>{n}</span>
              </div>
            ))}
          </div>

          {/* barra delle azioni in blocco */}
          {scheda === 'certo' && c.certo > 0 && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="m-btn m-btn-sm" disabled={lavorando}
                onClick={() => confermaBlocco(
                  proposte.certo.filter(p => p.candidati.length === 1)
                    .map(p => ({ bookorbit_id: p.ebook.id, book_id: p.candidati[0].id })),
                  'Conferma tutti gli abbinamenti certi')}>
                conferma tutti i certi
              </button>
              <span className="m-marginalia" style={{ fontSize: 12 }}>
                ISBN identico su entrambi i lati
              </span>
            </div>
          )}
          {(scheda === 'probabile' || scheda === 'verificare') && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="m-btn m-btn-sm" disabled={lavorando || !nSpunte}
                onClick={() => confermaBlocco(
                  Object.entries(spunte).map(([e, b]) => ({ bookorbit_id: Number(e), book_id: b })),
                  `Conferma ${nSpunte} abbinamenti selezionati`)}>
                conferma i {nSpunte || ''} selezionati
              </button>
              <button className="m-btn m-btn-ghost m-btn-sm" disabled={lavorando}
                onClick={() => {
                  const tutti = {};
                  for (const p of proposte[scheda]) if (p.candidati.length === 1) tutti[p.ebook.id] = p.candidati[0].id;
                  setSpunte(tutti);
                }}>seleziona tutti quelli con un solo candidato</button>
              {nSpunte > 0 && (
                <button className="m-btn m-btn-ghost m-btn-sm" onClick={() => setSpunte({})}>azzera</button>
              )}
            </div>
          )}
          {scheda === 'nessuno' && c.nessuno > 0 && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="m-btn m-btn-sm" disabled={lavorando}
                onClick={() => crea(proposte.nessuno.map(p => p.ebook.id))}>
                crea tutti come nuovi ebook
              </button>
              <span className="m-marginalia" style={{ fontSize: 12 }}>
                {c.nessuno} record nuovi, con copertina e autori già in catalogo dove coincidono
              </span>
            </div>
          )}

          {/* elenco */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LIVELLI.some(([k]) => k === scheda) && (proposte[scheda] || []).map(p => (
              <Proposta key={p.ebook.id} p={p} livello={scheda}
                scelto={Boolean(spunte[p.ebook.id])}
                onSpunta={spunta} onConferma={conferma1} onIgnora={ignora}
                onAMano={setAMano} onCrea={crea}/>
            ))}
            {LIVELLI.some(([k]) => k === scheda) && !(proposte[scheda] || []).length && (
              <div className="m-marginalia" style={{ fontSize: 13, padding: '18px 0' }}>niente in questa scheda</div>
            )}

            {scheda === 'collegati' && collegati.map(r => (
              <div key={r.id} style={{
                border: '1px solid var(--m-rule)', padding: '9px 12px',
                display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <Miniatura src={r.copertina} titolo={r.title} larghezza={34}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="m-serif" style={{ fontSize: 14 }}>{r.title}</div>
                  <div className="m-marginalia" style={{ fontSize: 11 }}>
                    {(r.authors || []).join(', ')}
                    {r.orfano && <span style={{ color: '#c0392b' }}> · non più in BookOrbit</span>}
                  </div>
                </div>
                {r.libro && (
                  <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11 }}
                    onClick={() => navigate(`/libro/${r.libro.id}`)}>apri la scheda</button>
                )}
                {r.link_lettore && (
                  <a className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11, textDecoration: 'none' }}
                    href={r.link_lettore} target="_blank" rel="noreferrer">leggi ↗</a>
                )}
                <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11 }}
                  onClick={async () => { await boApi.unlink([r.id]); await dopo('scollegato'); }}>scollega</button>
              </div>
            ))}

            {scheda === 'ignorati' && ignorati.map(r => (
              <div key={r.id} style={{
                border: '1px solid var(--m-rule)', padding: '9px 12px',
                display: 'flex', gap: 12, alignItems: 'center', opacity: 0.75,
              }}>
                <Miniatura src={r.copertina} titolo={r.title} larghezza={34}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="m-serif" style={{ fontSize: 14 }}>{r.title}</div>
                  <div className="m-marginalia" style={{ fontSize: 11 }}>{(r.authors || []).join(', ')}</div>
                </div>
                <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11 }}
                  onClick={async () => { await boApi.restore([r.id]); await dopo('rimesso fra quelli da vedere'); }}>
                  rimetti fra quelli da vedere
                </button>
              </div>
            ))}
            {scheda === 'ignorati' && !ignorati.length && (
              <div className="m-marginalia" style={{ fontSize: 13, padding: '18px 0' }}>nessuno messo da parte</div>
            )}
            {scheda === 'collegati' && !collegati.length && (
              <div className="m-marginalia" style={{ fontSize: 13, padding: '18px 0' }}>nessun ebook collegato</div>
            )}
          </div>
        </>
      )}

      {aMano && (
        <CollegaAMano ebook={aMano} onChiudi={() => setAMano(null)}
          onScelto={async (b) => { setAMano(null); await conferma1(aMano.id, b.id); }}/>
      )}
      {conferma && (
        <Conferma titolo={conferma.titolo} righe={conferma.righe} nota={conferma.nota} inCorso={lavorando}
          onNo={() => setConferma(null)}
          onSi={async () => {
            setLavorando(true);
            try { await conferma.azione(); }
            catch (err) { toast?.(err?.response?.data?.error || 'operazione non riuscita', 'error'); }
            finally { setLavorando(false); }
          }}/>
      )}
    </div>
  );
}
