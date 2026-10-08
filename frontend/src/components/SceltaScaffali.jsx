import React, { useState, useEffect, useCallback } from 'react';
import { shelves as shelvesApi, libraries as librariesApi } from '../api/index.js';
import { useToast } from './Toast.jsx';

/* Dove mettere un libro: tutte le librerie, sotto ognuna i suoi scaffali e,
   aprendo uno scaffale, i suoi ripiani. È il cuore dei menu col tasto destro
   (Libreria, pagina dell'autore): sta qui una volta sola, così si comportano
   tutti allo stesso modo.

   - la casella accanto a uno scaffale mette il libro sui "nuovi arrivi" di
     quello scaffale, o ce lo toglie;
   - la freccia apre i ripiani: toccandone uno il libro ci va, e se era già
     sullo scaffale cambia soltanto ripiano.                                  */

const BASE = '__base__';
const VERDE = 'color-mix(in srgb, var(--m-terracotta) 8%, transparent)';

export default function SceltaScaffali({ libro, onCambiato }) {
  const toast = useToast();
  const [scaffali, setScaffali] = useState([]);
  const [librerie, setLibrerie] = useState([]);
  const [dove, setDove] = useState(new Map());     // scaffale -> sezione (null = nuovi arrivi)
  const [aperto, setAperto] = useState(null);      // scaffale di cui si vedono i ripiani
  const [nuovo, setNuovo] = useState(null);        // null = non sto creando
  const [pronto, setPronto] = useState(false);

  const rileggiDove = useCallback(() =>
    shelvesApi.ofBook(libro.id)
      .then(r => setDove(new Map(r.map(x => [x.id, x.section_id || null]))))
      .catch(() => setDove(new Map())), [libro.id]);

  useEffect(() => {
    Promise.all([
      shelvesApi.list().catch(() => []),
      librariesApi.list().catch(() => []),
      rileggiDove(),
    ]).then(([s, l]) => { setScaffali(s); setLibrerie(l); setPronto(true); });
  }, [rileggiDove]);

  const dopo = async (messaggio) => {
    await rileggiDove();
    toast(messaggio, 'success');
    onCambiato?.();
  };

  async function cambia(s) {
    try {
      if (dove.has(s.id)) {
        await shelvesApi.removeBook(s.id, libro.id);
        await dopo(`tolto da "${s.name}"`);
      } else {
        await shelvesApi.addBook(s.id, libro.id);
        await dopo(`in "${s.name}"`);
      }
    } catch { toast('Operazione non riuscita', 'error'); }
  }

  async function mettiSulRipiano(s, sezioneId, nomeRipiano) {
    const sezione = sezioneId === BASE ? null : sezioneId;
    try {
      if (dove.has(s.id)) {
        if ((dove.get(s.id) || null) === sezione) return;
        await shelvesApi.moveBook(s.id, libro.id, { after_book_id: null, section_id: sezione });
      } else {
        await shelvesApi.addBook(s.id, libro.id, { section_id: sezione });
      }
      await dopo(`in "${s.name}" › ${nomeRipiano}`);
    } catch { toast('Operazione non riuscita', 'error'); }
  }

  async function crea() {
    const nome = (nuovo || '').trim();
    setNuovo(null);
    if (!nome) return;
    try {
      const s = await shelvesApi.create({ name: nome });
      await shelvesApi.addBook(s.id, libro.id);
      setScaffali(prev => [...prev, { ...s, sections: [], base_label: 'Nuovi arrivi' }]);
      await dopo(`"${libro.title}" in "${nome}"`);
    } catch { toast('Non è stato possibile creare lo scaffale', 'error'); }
  }

  /* Le librerie nel loro ordine, e in fondo gli scaffali senza libreria. */
  const note = new Set(librerie.map(l => l.id));
  const gruppi = [
    ...librerie.map(l => ({ id: l.id, nome: l.name, scaffali: scaffali.filter(s => s.library_id === l.id) })),
    { id: null, nome: librerie.length ? 'Senza libreria' : null,
      scaffali: scaffali.filter(s => !s.library_id || !note.has(s.library_id)) },
  ].filter(g => g.scaffali.length > 0);

  const riga = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 10px 7px 14px', cursor: 'pointer', fontSize: 13,
  };

  return (
    <div>
      <div style={{ maxHeight: 'min(320px, 50vh)', overflowY: 'auto' }}>
        {pronto && scaffali.length === 0 && nuovo === null && (
          <div style={{ padding: '6px 14px', fontSize: 12, color: 'var(--m-ink-muted)', fontStyle: 'italic' }}>
            Nessuno scaffale creato
          </div>
        )}

        {gruppi.map(g => (
          <div key={g.id || 'senza'}>
            {g.nome && (
              <div className="m-eyebrow" style={{
                fontSize: 9, letterSpacing: '0.16em', padding: '8px 14px 3px',
                color: 'var(--m-ink-muted)', borderTop: '1px solid var(--m-rule)',
              }}>{g.nome}</div>
            )}

            {g.scaffali.map(s => {
              const dentro = dove.has(s.id);
              const ripiani = [
                ...(s.base_hidden ? [] : [{ id: BASE, name: s.base_label || 'Nuovi arrivi' }]),
                ...(s.sections || []),
              ];
              const espanso = aperto === s.id;
              const ripianoAttuale = dentro ? (dove.get(s.id) || BASE) : null;
              return (
                <div key={s.id}>
                  <div style={{ ...riga, background: dentro ? VERDE : 'transparent' }}
                    onMouseEnter={e => { if (!dentro) e.currentTarget.style.background = 'var(--m-rule)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = dentro ? VERDE : 'transparent'; }}>
                    {/* casella e nome: mettono o tolgono */}
                    <div onClick={() => cambia(s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                        background: dentro ? 'var(--m-terracotta)' : 'transparent',
                        border: '1.5px solid ' + (dentro ? 'var(--m-terracotta)' : 'var(--m-rule-strong)'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {dentro && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.name}
                      </span>
                    </div>
                    {/* la freccia: apre i ripiani */}
                    <button
                      onClick={() => setAperto(espanso ? null : s.id)}
                      title="scegli il ripiano"
                      aria-expanded={espanso}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '2px 6px', fontSize: 13, color: 'var(--m-ink-muted)',
                        transform: espanso ? 'rotate(90deg)' : 'none', transition: 'transform 120ms',
                      }}>›</button>
                  </div>

                  {espanso && ripiani.map(r => {
                    const qui = ripianoAttuale === r.id;
                    return (
                      <div key={r.id} onClick={() => mettiSulRipiano(s, r.id, r.name || 'senza nome')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 14px 6px 38px', cursor: 'pointer', fontSize: 12.5,
                          color: qui ? 'var(--m-terracotta)' : 'var(--m-ink)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--m-rule)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ width: 8, textAlign: 'center' }}>{qui ? '●' : '·'}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                       fontStyle: r.id === BASE ? 'italic' : 'normal' }}>
                          {r.name || 'senza nome'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {nuovo === null ? (
        <div onClick={() => setNuovo('')}
          style={{ padding: '7px 14px', cursor: 'pointer', fontSize: 12.5, color: 'var(--m-ink-muted)',
                   borderTop: '1px solid var(--m-rule)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--m-rule)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          + nuovo scaffale
        </div>
      ) : (
        <div style={{ padding: '7px 14px 9px', borderTop: '1px solid var(--m-rule)' }}>
          <input autoFocus value={nuovo}
            onChange={e => setNuovo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') crea(); if (e.key === 'Escape') setNuovo(null); }}
            placeholder="nome dello scaffale"
            style={{
              width: '100%', padding: '5px 7px', fontSize: 12.5, fontFamily: 'inherit',
              background: 'transparent', color: 'var(--m-ink)', border: '1px solid var(--m-rule)',
            }}/>
        </div>
      )}
    </div>
  );
}
