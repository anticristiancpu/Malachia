import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { shelves as shelvesApi, authors as authorsApi } from '../api/index.js';
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
  const [shelves,  setShelves]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName,  setNewName]  = useState('');
  const [newSub,   setNewSub]   = useState('');
  const [newKind,  setNewKind]  = useState('tematico');

  const [tolkienCount, setTolkienCount] = useState(null);

  // Context menu + modali
  const [ctxMenu,     setCtxMenu]     = useState(null); // { x, y, shelf }
  const [editShelf,   setEditShelf]   = useState(null); // shelf da modificare
  const [deleteShelf, setDeleteShelf] = useState(null); // shelf da eliminare

  useEffect(() => {
    shelvesApi.list().then(setShelves).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    authorsApi.list({ search: 'tolkien', limit: 10 })
      .then(r => {
        const jrr = (r.authors || []).find(a => a.name.toLowerCase().includes('tolkien'));
        setTolkienCount(jrr ? jrr.book_count : 0);
      })
      .catch(() => setTolkienCount(0));
  }, []);

  async function createShelf() {
    if (!newName.trim()) return;
    try {
      const s = await shelvesApi.create({ name: newName.trim(), subtitle: newSub.trim(), kind: newKind });
      setShelves(prev => [...prev, { ...s, book_count: 0 }]);
      setCreating(false); setNewName(''); setNewSub('');
      toast('Scaffale creato', 'success');
    } catch { toast('Errore', 'error'); }
  }

  async function saveEdit(name, subtitle) {
    const shelf = editShelf;
    setEditShelf(null);
    try {
      await shelvesApi.update(shelf.id, { name, subtitle, description: shelf.description, public: shelf.public });
      setShelves(prev => prev.map(s => s.id === shelf.id ? { ...s, name, subtitle } : s));
      toast('Scaffale aggiornato', 'success');
    } catch { toast('Errore aggiornamento', 'error'); }
  }

  async function confirmDelete() {
    const shelf = deleteShelf;
    setDeleteShelf(null);
    try {
      await shelvesApi.delete(shelf.id);
      setShelves(prev => prev.filter(s => s.id !== shelf.id));
      toast(`"${shelf.name}" eliminato`, 'success');
    } catch { toast('Errore eliminazione', 'error'); }
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
    <div style={{ padding: '28px 36px 48px', display: 'flex', flexDirection: 'column', gap: 32, overflowY: 'auto', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
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
            }}>& collezioni</em>
          </div>
        </div>
        <button className="m-btn" onClick={() => setCreating(true)}>+ nuovo scaffale</button>
      </div>

      {/* ─── Collezioni di riferimento ─────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div className="m-eyebrow" style={{ fontSize: 12, letterSpacing: '0.08em' }}>Collezioni di riferimento</div>
          <div style={{ flex: 1, height: 1, background: 'var(--cine-gold-dim)' }}/>
        </div>
        <div
          onClick={() => navigate('/collezioni/tolkien')}
          style={{
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '24px 28px', cursor: 'pointer', gap: 24, minHeight: 130, overflow: 'hidden',
            border: '1px solid rgba(191,161,88,0.35)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/tolkien-banner.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 30%', filter: 'brightness(0.45) saturate(0.8)' }}/>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.5) 100%)' }}/>
          <img src="/tolkien-monogram.svg" alt="Tolkien" style={{ height: 88, width: 'auto', flexShrink: 0, position: 'relative', zIndex: 1, filter: 'invert(1) sepia(1) saturate(3) hue-rotate(5deg) brightness(1.1)', mixBlendMode: 'screen', opacity: 0.88 }}/>
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <div className="m-eyebrow" style={{ fontSize: 11, marginBottom: 3, color: 'rgba(255,255,255,0.6)' }}>Canone · edizioni italiane</div>
            <div className="m-serif" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.05, color: '#fff' }}>J.R.R. Tolkien</div>
            <div className="m-marginalia" style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>22 opere · Bompiani, Rusconi, Mondadori</div>
          </div>
          {tolkienCount !== null && (
            <div style={{ textAlign: 'right', flexShrink: 0, position: 'relative', zIndex: 1 }}>
              <div className="m-nums" style={{ fontSize: 42, lineHeight: 1, color: '#c9a84c' }}>{tolkienCount}</div>
              <div className="m-marginalia" style={{ fontSize: 11, marginTop: 3, color: 'rgba(255,255,255,0.5)' }}>
                {tolkienCount === 1 ? 'volume posseduto' : 'volumi posseduti'}
              </div>
            </div>
          )}
          <div style={{ fontSize: 22, color: '#c9a84c', flexShrink: 0, paddingLeft: 4, position: 'relative', zIndex: 1 }}>›</div>
        </div>
      </section>

      {/* ─── I tuoi scaffali ───────────────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div className="m-eyebrow" style={{ fontSize: 12, letterSpacing: '0.08em' }}>I tuoi scaffali</div>
          <div style={{ flex: 1, height: 1, background: 'var(--cine-gold-dim)' }}/>
          {shelves.length > 0 && (
            <div className="m-marginalia" style={{ fontSize: 12 }}>{shelves.length} scaffali</div>
          )}
        </div>

        {shelves.length === 0 && !creating && (
          <div style={{ color: 'var(--m-ink-muted)', fontStyle: 'italic', fontSize: 14, padding: '12px 0' }}>
            Nessuno scaffale — creane uno con il pulsante in alto
          </div>
        )}

        {GRUPPI.map(([tipo, titolo, spiega]) => {
          const gruppo = shelves.filter(x => (x.kind || 'tematico') === tipo);
          if (!gruppo.length) return null;
          return (
            <div key={tipo} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <div className="m-eyebrow" style={{ fontSize: 10 }}>{titolo}</div>
                <div className="m-marginalia" style={{ fontSize: 11 }}>{spiega}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {gruppo.map(x => (
                  <ShelfCard
                    key={x.id}
                    shelf={x}
                    onClick={() => navigate(`/scaffali/${x.id}`)}
                    onContextMenu={e => openContextMenu(e, x)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {/* Card creazione */}
          {creating ? (
            <div style={{ border: '1px solid var(--m-rule-strong)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="m-eyebrow" style={{ fontSize: 11 }}>Nuovo scaffale</div>
              <input
                className="m-input" placeholder="Nome scaffale" value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createShelf()}
                autoFocus
              />
              <input
                className="m-input" placeholder="Sottotitolo (opzionale)" value={newSub}
                onChange={e => setNewSub(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                {[['tematico', '◇ tematico', 'esiste solo nell’app'],
                  ['fisico',   '▦ fisico',   'corrisponde a un gruppo reale sulla libreria']].map(([v, etichetta, spiega]) => (
                  <button key={v} type="button" title={spiega}
                    onClick={() => setNewKind(v)}
                    className={newKind === v ? 'm-btn m-btn-sm' : 'm-btn m-btn-ghost m-btn-sm'}
                    style={{ fontSize: 11, flex: 1, justifyContent: 'center' }}>{etichetta}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="m-btn" onClick={createShelf}>crea</button>
                <button className="m-btn m-btn-ghost" onClick={() => { setCreating(false); setNewName(''); setNewSub(''); }}>annulla</button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setCreating(true)}
              style={{
                border: '1px dashed var(--m-rule-strong)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 160, cursor: 'pointer', padding: '20px 22px', textAlign: 'center',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(122,59,46,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: 44, color: 'var(--m-ink-muted)', lineHeight: 1 }}>＋</div>
              <div className="m-serif" style={{ fontSize: 20, fontStyle: 'italic', color: 'var(--m-ink-muted)', marginTop: 8 }}>nuovo scaffale</div>
              <div className="m-marginalia" style={{ marginTop: 4, maxWidth: 180, fontSize: 12 }}>
                Tasto destro su uno scaffale per modificarlo
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Ebook senza scaffale ──────────────────────────────────────────── */}
      <EbookSenzaScaffale
        shelves={shelves}
        onAggiunto={() => shelvesApi.list().then(setShelves).catch(() => {})}
      />

      {/* ─── Context menu tasto destro ─── */}
      {ctxMenu && (
        <ShelfContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          shelf={ctxMenu.shelf}
          onClose={() => setCtxMenu(null)}
          onEdit={() => setEditShelf(ctxMenu.shelf)}
          onDelete={() => setDeleteShelf(ctxMenu.shelf)}
        />
      )}

      {/* Modal modifica (include gestione immagine) */}
      {editShelf && (
        <EditShelfModal
          shelf={editShelf}
          onSave={saveEdit}
          onClose={() => setEditShelf(null)}
          onImageUploaded={(shelfId, url) => setShelves(prev => prev.map(s => s.id === shelfId ? { ...s, cover_url: url } : s))}
          onImageRemoved={(shelfId)      => setShelves(prev => prev.map(s => s.id === shelfId ? { ...s, cover_url: null } : s))}
        />
      )}

      {/* Modal conferma eliminazione */}
      {deleteShelf && (
        <DeleteConfirmModal shelf={deleteShelf} onConfirm={confirmDelete} onClose={() => setDeleteShelf(null)}/>
      )}
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
