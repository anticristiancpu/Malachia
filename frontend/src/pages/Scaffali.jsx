import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { shelves as shelvesApi, libraries as librariesApi } from '../api/index.js';
import BookCover from '../components/BookCover.jsx';
import { tipoRecord } from '../components/EbookMark.jsx';
import { useToast } from '../components/Toast.jsx';

const GRUPPI = [
  ['fisico',   'Scaffali fisici',   'corrispondono a un gruppo reale sulla libreria'],
  ['tematico', 'Scaffali tematici', 'esistono solo qui'],
];

/* "12 libri · 4 ebook · 2 opere" — le voci a zero non si scrivono. */
function riepilogoTipi(shelf) {
  const voci = [
    [shelf.cartaceo_count ?? shelf.book_count ?? 0, 'libro', 'libri'],
    [shelf.ebook_count ?? 0, 'ebook', 'ebook'],
    [shelf.opera_count ?? 0, 'opera', 'opere'],
  ].filter(([n]) => n > 0);
  if (!voci.length) return 'vuoto';
  return voci.map(([n, sing, plur]) => `${n} ${n === 1 ? sing : plur}`).join(' · ');
}

/* ─── ShelfContextMenu ──────────────────────────────────────────────────────── */
function ShelfContextMenu({ x, y, shelf, onClose, onEdit, onDelete }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useEffect(() => {
    if (!ref.current) return;
    const r  = ref.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    setPos({
      left: r.right  > vw ? Math.max(4, x - r.width)  : x,
      top:  r.bottom > vh ? Math.max(4, y - r.height) : y,
    });
  }, [x, y]);

  useEffect(() => {
    function onMouse(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    function onKey(e)   { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown',   onKey);
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const item = (label, action, danger = false) => (
    <div
      style={{
        padding: '8px 14px', cursor: 'pointer', fontSize: 13,
        color: danger ? '#c0392b' : 'var(--m-ink)',
        transition: 'background 100ms',
      }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(192,57,43,0.07)' : 'var(--m-rule)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      onClick={() => { onClose(); action(); }}
    >{label}</div>
  );

  return (
    <div ref={ref} style={{
      position: 'fixed', left: pos.left, top: pos.top, zIndex: 700,
      background: 'var(--m-parchment)', border: '1px solid var(--m-rule)',
      boxShadow: '0 4px 18px rgba(0,0,0,0.18)', minWidth: 190,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '7px 12px 6px', borderBottom: '1px solid var(--m-rule)' }}>
        <div className="m-serif" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
          {shelf.name}
        </div>
      </div>
      {item('✎ modifica', onEdit)}
      <div style={{ height: 1, background: 'var(--m-rule)', margin: '2px 0' }}/>
      {item('× elimina scaffale', onDelete, true)}
    </div>
  );
}

/* ─── EditShelfModal ─────────────────────────────────────────────────────────── */
function EditShelfModal({ shelf, onSave, onClose, onImageUploaded, onImageRemoved }) {
  const [name,       setName]       = useState(shelf.name);
  const [sub,        setSub]        = useState(shelf.subtitle || '');
  const [coverUrl,   setCoverUrl]   = useState(shelf.cover_url || null);
  const [uploading,  setUploading]  = useState(false);
  const fileRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const r = await shelvesApi.uploadImage(shelf.id, file);
      setCoverUrl(r.cover_url);
      onImageUploaded && onImageUploaded(shelf.id, r.cover_url);
    } catch {}
    setUploading(false);
    e.target.value = '';
  }

  async function handleRemoveCover() {
    try {
      await shelvesApi.deleteImage(shelf.id);
      setCoverUrl(null);
      onImageRemoved && onImageRemoved(shelf.id);
    } catch {}
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
      <div style={{ background: 'var(--m-parchment)', padding: 28, width: 440, border: '1px solid var(--m-rule)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="m-serif" style={{ fontSize: 18, fontWeight: 500 }}>Modifica scaffale</div>

        <div className="m-field">
          <label>Nome</label>
          <input className="m-input" value={name} autoFocus onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim(), sub.trim())}/>
        </div>
        <div className="m-field">
          <label>Sottotitolo <span style={{ fontWeight: 400, color: 'var(--m-ink-muted)' }}>(opzionale)</span></label>
          <input className="m-input" value={sub} onChange={e => setSub(e.target.value)}/>
        </div>

        {/* Sfondo */}
        <div>
          <div className="m-eyebrow" style={{ fontSize: 11, marginBottom: 8 }}>Immagine di sfondo</div>
          {coverUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 80, height: 50, flexShrink: 0,
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                border: '1px solid var(--m-rule)', borderRadius: 2,
              }}/>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 12 }}
                  onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? '…' : '↺ cambia'}
                </button>
                <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 12, color: 'var(--m-ink-muted)' }}
                  onClick={handleRemoveCover}>
                  × rimuovi
                </button>
              </div>
            </div>
          ) : (
            <button className="m-btn m-btn-ghost" style={{ fontSize: 13 }}
              onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Caricamento…' : '+ carica immagine'}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange}/>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="m-btn m-btn-ghost" onClick={onClose}>Chiudi</button>
          <button className="m-btn" disabled={!name.trim()} onClick={() => onSave(name.trim(), sub.trim())}>Salva</button>
        </div>
      </div>
    </div>
  );
}

/* ─── DeleteConfirmModal ─────────────────────────────────────────────────────── */
function DeleteConfirmModal({ shelf, onConfirm, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
      <div style={{ background: 'var(--m-parchment)', padding: 28, width: 380, border: '1px solid var(--m-rule)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="m-serif" style={{ fontSize: 18, fontWeight: 500 }}>Elimina scaffale</div>
        <p className="m-body" style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--m-ink-muted)', margin: 0 }}>
          Eliminare <strong>"{shelf.name}"</strong>? I libri non verranno rimossi dalla libreria.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="m-btn m-btn-ghost" onClick={onClose}>Annulla</button>
          <button className="m-btn" style={{ background: '#c0392b', borderColor: '#c0392b' }} onClick={onConfirm}>Elimina</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGINA PRINCIPALE
════════════════════════════════════════════════════════════════════════════ */
export default function Scaffali() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [shelves,   setShelves]   = useState([]);
  const [librerie,  setLibrerie]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [newName,   setNewName]   = useState('');
  const [newSub,    setNewSub]    = useState('');
  const [newKind,   setNewKind]   = useState('tematico');
  const [nuovaLib,  setNuovaLib]  = useState(null);   // null = non sto creando

  // Context menu + modali
  const [ctxMenu,     setCtxMenu]     = useState(null);
  const [editShelf,   setEditShelf]   = useState(null);
  const [deleteShelf, setDeleteShelf] = useState(null);

  // Trascinamento degli scaffali
  const [trascinato, setTrasc] = useState(null);
  const [sopra,      setSopra] = useState(null);

  const carica = useCallback(() => {
    return Promise.all([
      shelvesApi.panoramica(40).catch(() => []),
      librariesApi.list().catch(() => []),
    ]).then(([s, l]) => { setShelves(s); setLibrerie(l); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { carica(); }, [carica]);

  /* Le librerie in ordine, e in fondo gli scaffali non assegnati. */
  const gruppi = useMemo(() => {
    const perLib = new Map(librerie.map(l => [l.id, []]));
    const liberi = [];
    for (const s of shelves) {
      if (s.library_id && perLib.has(s.library_id)) perLib.get(s.library_id).push(s);
      else liberi.push(s);
    }
    const elenco = librerie.map(l => ({ ...l, scaffali: perLib.get(l.id) || [] }));
    if (liberi.length || librerie.length === 0) {
      elenco.push({ id: null, name: librerie.length ? 'Senza libreria' : 'I tuoi scaffali', scaffali: liberi });
    }
    return elenco;
  }, [shelves, librerie]);

  async function createShelf() {
    const nome = newName.trim();
    if (!nome) return;
    try {
      const s = await shelvesApi.create({ name: nome, subtitle: newSub.trim() || undefined, kind: newKind });
      setCreating(false); setNewName(''); setNewSub(''); setNewKind('tematico');
      await carica();
      toast('"' + s.name + '" creato', 'success');
    } catch { toast('Errore nella creazione', 'error'); }
  }

  async function saveEdit(shelf, { name, subtitle }) {
    try {
      await shelvesApi.update(shelf.id, { name, subtitle });
      setEditShelf(null);
      setShelves(prev => prev.map(s => s.id === shelf.id ? { ...s, name, subtitle } : s));
      toast('Scaffale aggiornato', 'success');
    } catch { toast('Errore aggiornamento', 'error'); }
  }

  async function confirmDelete(shelf) {
    try {
      await shelvesApi.delete(shelf.id);
      setDeleteShelf(null);
      setShelves(prev => prev.filter(s => s.id !== shelf.id));
      toast('"' + shelf.name + '" eliminato', 'success');
    } catch { toast('Errore eliminazione', 'error'); }
  }

  async function creaLibreria() {
    const nome = (nuovaLib || '').trim();
    setNuovaLib(null);
    if (!nome) return;
    try { await librariesApi.create(nome); await carica(); toast('Libreria "' + nome + '" creata', 'success'); }
    catch { toast('Errore nella creazione della libreria', 'error'); }
  }

  async function rinominaLibreria(lib) {
    const nome = window.prompt('Nome della libreria', lib.name);
    if (nome === null || !nome.trim() || nome === lib.name) return;
    try { await librariesApi.update(lib.id, { name: nome.trim() }); await carica(); }
    catch { toast('Errore nella rinomina', 'error'); }
  }

  async function eliminaLibreria(lib) {
    try {
      const r = await librariesApi.delete(lib.id);
      await carica();
      toast(r.scaffali_liberati
        ? 'Libreria eliminata, ' + r.scaffali_liberati + ' scaffali restano senza'
        : 'Libreria eliminata', 'success');
    } catch { toast('Errore eliminazione', 'error'); }
  }

  /* Rilascio: lo scaffale va dopo quello su cui cade, dentro la sua libreria. */
  async function rilascia(dopoScaffale, libreriaId) {
    if (!trascinato) return;
    const mosso = trascinato;
    setTrasc(null); setSopra(null);
    if (dopoScaffale && dopoScaffale.id === mosso.id) return;
    try {
      await shelvesApi.moveShelf(mosso.id, {
        after_shelf_id: dopoScaffale ? dopoScaffale.id : null,
        library_id: libreriaId,
      });
      await carica();
    } catch { toast('Errore nello spostamento', 'error'); }
  }

  function openContextMenu(e, shelf) {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, shelf });
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div className="m-spinner"/>
    </div>
  );

  return (
    <div style={{ padding: '28px 36px 48px', display: 'flex', flexDirection: 'column', gap: 26, overflowY: 'auto', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0, gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div className="m-eyebrow" style={{ marginBottom: 4 }}>Capitulum IV</div>
          <div style={{
            fontFamily: "'Cinzel', 'Mantinia', serif",
            fontSize: 42, fontWeight: 400, lineHeight: 1.05, color: 'var(--cine-cream)',
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            Scaffali
            <em style={{
              fontFamily: "'Agmena Pro', 'EB Garamond', Georgia, serif",
              fontSize: 22, fontStyle: 'italic', fontWeight: 400,
              color: 'var(--cine-gold)', letterSpacing: '0.01em',
              textTransform: 'none', marginLeft: '0.4em',
            }}>& librerie</em>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="m-btn m-btn-ghost m-btn-sm" onClick={() => setNuovaLib('')}>+ libreria</button>
          <button className="m-btn" onClick={() => setCreating(true)}>+ nuovo scaffale</button>
        </div>
      </div>

      {nuovaLib !== null && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="m-input" autoFocus value={nuovaLib}
            onChange={e => setNuovaLib(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') creaLibreria(); if (e.key === 'Escape') setNuovaLib(null); }}
            placeholder="nome della libreria, per esempio Studio o Camera"
            style={{ maxWidth: 340, fontSize: 13 }}/>
          <button className="m-btn m-btn-sm" onClick={creaLibreria}>crea</button>
          <button className="m-btn m-btn-ghost m-btn-sm" onClick={() => setNuovaLib(null)}>annulla</button>
        </div>
      )}

      {/* Creazione di uno scaffale */}
      {creating && (
        <div style={{ border: '1px solid var(--cine-gold-dim)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 520 }}>
          <div className="m-eyebrow" style={{ fontSize: 11 }}>Nuovo scaffale</div>
          <input className="m-input" autoFocus placeholder="nome" value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createShelf(); if (e.key === 'Escape') setCreating(false); }}/>
          <input className="m-input" placeholder="sottotitolo (facoltativo)" value={newSub}
            onChange={e => setNewSub(e.target.value)}/>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {GRUPPI.map(([k, titolo, spiega]) => (
              <button key={k} className={'m-btn m-btn-sm' + (newKind === k ? '' : ' m-btn-ghost')}
                style={{ fontSize: 11 }} title={spiega} onClick={() => setNewKind(k)}>{titolo}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="m-btn m-btn-sm" onClick={createShelf}>crea</button>
            <button className="m-btn m-btn-ghost m-btn-sm" onClick={() => setCreating(false)}>annulla</button>
          </div>
        </div>
      )}

      {/* Le librerie, ognuna con i suoi scaffali in fila */}
      {gruppi.map(gruppo => (
        <section key={gruppo.id || 'senza'}>
          <div
            onDragOver={e => { if (trascinato) { e.preventDefault(); setSopra('lib-' + gruppo.id); } }}
            onDragLeave={() => setSopra(x => x === 'lib-' + gruppo.id ? null : x)}
            onDrop={e => { e.preventDefault(); rilascia(null, gruppo.id); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
              padding: '4px 6px', flexWrap: 'wrap',
              background: sopra === 'lib-' + gruppo.id ? 'rgba(191,161,88,0.14)' : 'transparent',
            }}>
            <div className="m-eyebrow" style={{ fontSize: 12, letterSpacing: '0.08em' }}>{gruppo.name}</div>
            <div style={{ flex: 1, height: 1, background: 'var(--cine-gold-dim)', minWidth: 20 }}/>
            <div className="m-marginalia" style={{ fontSize: 12 }}>
              {gruppo.scaffali.length} {gruppo.scaffali.length === 1 ? 'scaffale' : 'scaffali'}
            </div>
            {gruppo.id && (
              <>
                <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 10 }}
                  onClick={() => rinominaLibreria(gruppo)}>rinomina</button>
                <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 10 }}
                  onClick={() => eliminaLibreria(gruppo)}>elimina</button>
              </>
            )}
          </div>

          {gruppo.scaffali.length === 0 && (
            <div className="m-marginalia" style={{ fontSize: 12.5, fontStyle: 'italic', padding: '4px 0 10px' }}>
              {gruppo.id ? 'Trascina qui uno scaffale per metterlo in questa libreria.' : 'Nessuno scaffale.'}
            </div>
          )}

          {gruppo.scaffali.map(s => (
            <FilaScaffale
              key={s.id} scaffale={s}
              inTrascinamento={trascinato?.id === s.id}
              sorvolato={sopra === s.id}
              onApri={() => navigate('/scaffali/' + s.id)}
              onMenu={e => openContextMenu(e, s)}
              onApriLibro={bid => navigate('/libro/' + bid)}
              onDragStart={() => setTrasc(s)}
              onDragEnd={() => { setTrasc(null); setSopra(null); }}
              onDragOver={e => { if (trascinato) { e.preventDefault(); setSopra(s.id); } }}
              onDragLeave={() => setSopra(x => x === s.id ? null : x)}
              onDrop={e => { e.preventDefault(); rilascia(s, gruppo.id); }}
            />
          ))}
        </section>
      ))}

      <EbookSenzaScaffale shelves={shelves} onAggiunto={carica} />

      {ctxMenu && (
        <ShelfContextMenu
          x={ctxMenu.x} y={ctxMenu.y} shelf={ctxMenu.shelf}
          onClose={() => setCtxMenu(null)}
          onEdit={() => setEditShelf(ctxMenu.shelf)}
          onDelete={() => setDeleteShelf(ctxMenu.shelf)}
        />
      )}

      {editShelf && (
        <EditShelfModal
          shelf={editShelf}
          onSave={saveEdit}
          onClose={() => setEditShelf(null)}
          onImageUploaded={(shelfId, url) => setShelves(prev => prev.map(s => s.id === shelfId ? { ...s, cover_url: url } : s))}
          onImageRemoved={(shelfId)      => setShelves(prev => prev.map(s => s.id === shelfId ? { ...s, cover_url: null } : s))}
        />
      )}

      {deleteShelf && (
        <DeleteConfirmModal shelf={deleteShelf} onConfirm={confirmDelete} onClose={() => setDeleteShelf(null)}/>
      )}
    </div>
  );
}

/* ── Uno scaffale visto di fronte: una fila di copertine che scorre ────────
   Qui non si riordina niente: e' una vetrina, per lavorarci si apre lo
   scaffale. Si trascina invece lo scaffale intero, per cambiarne l'ordine o
   spostarlo in un'altra libreria.                                          */
function FilaScaffale({ scaffale, inTrascinamento, sorvolato, onApri, onMenu, onApriLibro,
                        onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop }) {
  const altezza = Math.min(scaffale.cover_height || 130, 118);
  const libri = (scaffale.books || []).filter(b =>
    scaffale.show_ebooks ? true : tipoRecord(b) !== 'ebook');
  const nascosti = (scaffale.books || []).length - libri.length;
  const restanti = (scaffale.book_count || 0) - (scaffale.books || []).length;

  return (
    <div
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      style={{
        marginBottom: 20, opacity: inTrascinamento ? 0.4 : 1,
        borderTop: sorvolato ? '2px solid var(--m-terracotta, #c0533b)' : '2px solid transparent',
        paddingTop: 6,
      }}>
      {/* intestazione: e' questa che si trascina */}
      <div
        draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
        onContextMenu={onMenu}
        style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 7, cursor: 'grab', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--cine-gold-dim)', fontSize: 13 }} title="trascina per spostare lo scaffale">&#10239;</span>
        <span className="m-serif" onClick={onApri}
          style={{ fontSize: 19, color: 'var(--cine-cream)', cursor: 'pointer' }}>{scaffale.name}</span>
        <span className="m-marginalia" style={{ fontSize: 11.5 }}>
          {riepilogoTipi(scaffale)}
          {nascosti > 0 ? ' \u00b7 ' + nascosti + ' ebook nascosti' : ''}
        </span>
        <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 10, marginLeft: 'auto' }}
          onClick={onApri}>apri &rsaquo;</button>
      </div>

      {/* la fila che scorre in orizzontale */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 9,
        overflowX: 'auto', overflowY: 'hidden',
        padding: '0 2px 18px',
        backgroundImage: 'linear-gradient(to bottom,' +
          'transparent calc(100% - 11px),' +
          'rgba(191,161,88,0.40) calc(100% - 11px),' +
          'rgba(191,161,88,0.40) calc(100% - 8px),' +
          'rgba(0,0,0,0.22) calc(100% - 8px),' +
          'rgba(0,0,0,0.22) calc(100% - 6px),' +
          'transparent calc(100% - 6px))',
      }}>
        {libri.length === 0 && (
          <div className="m-marginalia" style={{ fontSize: 12, fontStyle: 'italic', paddingBottom: 10 }}>
            {nascosti > 0 ? 'Solo ebook, nascosti.' : 'Scaffale vuoto.'}
          </div>
        )}
        {libri.map(b => (
          <div key={b.id} onClick={() => onApriLibro(b.id)} title={b.title}
            style={{ flexShrink: 0, cursor: 'pointer', lineHeight: 0 }}>
            <BookCover book={b} w={Math.round(altezza * 0.66)} h={altezza}/>
          </div>
        ))}
        {restanti > 0 && (
          <div onClick={onApri} title="apri lo scaffale"
            style={{
              flexShrink: 0, height: altezza, width: 60, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px dashed rgba(232,220,192,0.22)',
              color: 'rgba(232,220,192,0.5)', fontSize: 12,
            }}>+{restanti}</div>
        )}
      </div>
    </div>
  );
}

/* ─── ShelfCard ─────────────────────────────────────────────────────────────── */
function ShelfCard({ shelf, onClick, onContextMenu }) {
  const [hov, setHov] = useState(false);
  const hasCover = !!shelf.cover_url;

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        border: '1px solid var(--m-rule)',
        minHeight: 160, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        background: 'var(--m-parchment)',
        transition: 'box-shadow 150ms',
        boxShadow: hov ? '0 0 0 1px var(--cine-gold-dim), 0 4px 24px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      {/* Immagine di sfondo */}
      {hasCover && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${shelf.cover_url})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.42) saturate(0.85)',
        }}/>
      )}
      {hasCover && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.05) 65%)',
        }}/>
      )}

      {/* Testo */}
      <div style={{ position: 'relative', zIndex: 1, padding: '16px 18px' }}>
        <div className="m-eyebrow" style={{ fontSize: 11, color: hasCover ? 'rgba(255,255,255,0.55)' : undefined }}>
          {riepilogoTipi(shelf)}
        </div>
        <div className="m-serif" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.1, marginTop: 5, color: hasCover ? '#fff' : undefined }}>
          {shelf.name}
        </div>
        {shelf.subtitle && (
          <div className="m-marginalia" style={{ marginTop: 3, fontSize: 12, color: hasCover ? 'rgba(255,255,255,0.55)' : undefined }}>
            {shelf.subtitle}
          </div>
        )}
      </div>

      {/* Hint tasto destro (su hover, solo senza cover) */}
      {hov && !hasCover && (
        <div style={{
          position: 'absolute', top: 8, right: 10, fontSize: 10,
          color: 'var(--m-ink-muted)', userSelect: 'none',
        }}>tasto destro ›</div>
      )}

      {/* Freccia */}
      <div style={{
        position: 'absolute', bottom: 12, right: 14, zIndex: 1,
        fontSize: 18, color: hasCover ? 'rgba(255,255,255,0.35)' : 'var(--m-ink-muted)',
      }}>›</div>
    </div>
  );
}

/* ── Ebook senza scaffale ───────────────────────────────────────────────────
   I record di tipo ebook che non stanno su nessuno scaffale. Da qui si
   aggiungono direttamente a uno scaffale e, se ne ha, a una sua sezione.   */
function EbookSenzaScaffale({ shelves, onAggiunto }) {
  const toast = useToast();
  const [righe, setRighe]   = useState([]);
  const [aperto, setAperto] = useState(false);
  const [sezioni, setSezioni] = useState({});   // { [shelfId]: [sezioni] }
  const [scelte, setScelte]   = useState({});   // { [bookId]: { shelf, sezione } }
  const [inCorso, setInCorso] = useState(null);

  const carica = useCallback(() => {
    shelvesApi.ebookSenzaScaffale().then(setRighe).catch(() => setRighe([]));
  }, []);
  useEffect(() => { carica(); }, [carica]);

  // Le sezioni di uno scaffale si leggono solo quando serve.
  const scegliScaffale = async (bookId, shelfId) => {
    setScelte(s => ({ ...s, [bookId]: { shelf: shelfId, sezione: '' } }));
    if (shelfId && !sezioni[shelfId]) {
      try {
        const sc = await shelvesApi.get(shelfId);
        setSezioni(m => ({ ...m, [shelfId]: sc.sections || [] }));
      } catch { setSezioni(m => ({ ...m, [shelfId]: [] })); }
    }
  };

  if (!righe.length) return null;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="m-eyebrow" style={{ fontSize: 12, letterSpacing: '0.08em' }}>Ebook senza scaffale</div>
        <div style={{ flex: 1, height: 1, background: 'var(--cine-gold-dim)' }}/>
        <div className="m-marginalia" style={{ fontSize: 12 }}>{righe.length}</div>
        <button className="m-btn m-btn-ghost m-btn-sm" style={{ fontSize: 11 }}
          onClick={() => setAperto(a => !a)}>{aperto ? 'nascondi' : 'mostra'}</button>
      </div>

      {aperto && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {!shelves.length && (
            <div className="m-marginalia" style={{ fontSize: 12 }}>
              Crea prima uno scaffale, poi potrai collocarli.
            </div>
          )}
          {righe.map(r => {
            const scelta = scelte[r.id] || {};
            const elenco = sezioni[scelta.shelf] || [];
            return (
              <div key={r.id} style={{
                border: '1px solid var(--m-rule)', padding: '7px 10px',
                display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="m-serif" style={{ fontSize: 13.5, lineHeight: 1.2 }}>{r.title}</div>
                  <div className="m-marginalia" style={{ fontSize: 11 }}>
                    {r.autori || 'senza autore'}{r.year ? ` · ${r.year}` : ''}
                  </div>
                </div>
                <select value={scelta.shelf || ''} disabled={!shelves.length}
                  onChange={e => scegliScaffale(r.id, e.target.value)}
                  style={{
                    fontSize: 12, padding: '4px 6px', background: 'transparent',
                    color: 'var(--m-ink)', border: '1px solid var(--m-rule)', minWidth: 150,
                  }}>
                  <option value="">— scaffale —</option>
                  {shelves.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={scelta.sezione || ''} disabled={!scelta.shelf || !elenco.length}
                  onChange={e => setScelte(m => ({ ...m, [r.id]: { ...scelta, sezione: e.target.value } }))}
                  style={{
                    fontSize: 12, padding: '4px 6px', background: 'transparent',
                    color: 'var(--m-ink)', border: '1px solid var(--m-rule)', minWidth: 130,
                  }}>
                  <option value="">{elenco.length ? '— senza sezione —' : 'nessuna sezione'}</option>
                  {elenco.map(sz => <option key={sz.id} value={sz.id}>{sz.name}</option>)}
                </select>
                <button className="m-btn m-btn-sm" style={{ fontSize: 11 }}
                  disabled={!scelta.shelf || inCorso === r.id}
                  onClick={async () => {
                    setInCorso(r.id);
                    try {
                      await shelvesApi.addBook(scelta.shelf, r.id,
                        scelta.sezione ? { section_id: scelta.sezione } : {});
                      toast('aggiunto allo scaffale', 'success');
                      setRighe(prev => prev.filter(x => x.id !== r.id));
                      onAggiunto?.();
                    } catch { toast('non è stato possibile aggiungerlo', 'error'); }
                    finally { setInCorso(null); }
                  }}>
                  {inCorso === r.id ? '…' : 'aggiungi'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
