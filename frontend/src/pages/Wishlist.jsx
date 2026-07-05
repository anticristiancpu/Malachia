import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import { ORN } from '../components/ORN.jsx';
import { wishlist as wishlistApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';

const PRIORITY_COLORS = { high: 'var(--m-vermilion)', medium: 'var(--m-terracotta)', low: 'var(--m-ink-muted)' };
const PRIORITY_LABELS = { high: 'alta', medium: 'media', low: 'bassa' };

export default function Wishlist() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', priority: 'medium', estimated_price: '', shop_notes: '', notes: '' });

  useEffect(() => {
    wishlistApi.list().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!form.title.trim()) return;
    try {
      const item = await wishlistApi.create({ ...form, estimated_price: form.estimated_price ? parseFloat(form.estimated_price) : null });
      setItems(prev => [item, ...prev]);
      setAdding(false);
      setForm({ title: '', author: '', priority: 'medium', estimated_price: '', shop_notes: '', notes: '' });
      toast(item.duplicate_book ? '⚠ Libro già in catalogo!' : 'Aggiunto alla lista desideri', item.duplicate_book ? 'error' : 'success');
    } catch { toast('Errore', 'error'); }
  }

  async function acquire(item) {
    try {
      const result = await wishlistApi.acquire(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      toast('Promosso al catalogo', 'success');
      navigate('/aggiungi', { state: { prefill: result.book_data } });
    } catch { toast('Errore', 'error'); }
  }

  async function remove(id) {
    await wishlistApi.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const total = items.reduce((s, i) => s + (i.estimated_price || 0), 0);

  return (
    <div style={{ padding: '28px 40px', height: '100%', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="m-eyebrow">Desideria · da acquisire</div>
          <div className="m-serif" style={{ fontSize: 42, fontWeight: 500, lineHeight: 1.05, marginTop: 2 }}>
            Lista dei <em style={{ color: 'var(--m-terracotta)' }}>desideri</em>
          </div>
          <div className="m-marginalia" style={{ marginTop: 4 }}>libri annotati nei margini, citati da altri libri, scorti in libreria.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
          {items.length > 0 && <div className="m-mono" style={{ fontSize: 14 }}>totale stimato · € {total.toFixed(2)} · {items.length} volumi</div>}
          <button className="m-btn" onClick={() => setAdding(true)}>+ aggiungi</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="m-spinner"/></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="m-serif" style={{ fontSize: 28, fontStyle: 'italic', color: 'var(--m-ink-muted)' }}>Nessun desiderio registrato.</div>
          <button className="m-btn" style={{ marginTop: 20 }} onClick={() => setAdding(true)}>Aggiungi il primo</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, overflow: 'auto', paddingBottom: 20 }}>
          {items.map(item => (
            <WishCard key={item.id} item={item} onAcquire={() => acquire(item)} onDelete={() => remove(item.id)}/>
          ))}
        </div>
      )}

      {/* Modal aggiunta */}
      {adding && (
        <div className="m-overlay" onClick={() => setAdding(false)}>
          <div className="m-modal" style={{ width: 560, padding: 32 }} onClick={e => e.stopPropagation()}>
            <div className="m-eyebrow" style={{ marginBottom: 12 }}>Nuovo desiderio</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="m-field"><label>Titolo *</label><input className="m-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titolo del libro"/></div>
              <div className="m-field"><label>Autore</label><input className="m-input" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Autore"/></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="m-field">
                  <label>Priorità</label>
                  <select className="m-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Bassa</option>
                  </select>
                </div>
                <div className="m-field"><label>Prezzo stimato (€)</label><input className="m-input" type="number" value={form.estimated_price} onChange={e => setForm(f => ({ ...f, estimated_price: e.target.value }))} placeholder="0.00"/></div>
              </div>
              <div className="m-field"><label>Dove trovarlo</label><input className="m-input" value={form.shop_notes} onChange={e => setForm(f => ({ ...f, shop_notes: e.target.value }))} placeholder="Feltrinelli, antiquario, Amazon…"/></div>
              <div className="m-field"><label>Note</label><textarea className="m-textarea" style={{ minHeight: 70 }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Perché lo voglio…"/></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="m-btn m-btn-ghost" onClick={() => setAdding(false)}>annulla</button>
                <button className="m-btn" onClick={save}>aggiungi</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WishCard({ item, onAcquire, onDelete }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 14, padding: '14px 16px', border: '1px solid var(--m-rule)', background: 'rgba(255,255,255,0.22)' }}>
      <BookCover title={item.title} author={item.author?.split(' ').slice(-1)[0] || ''} w={90} h={130}/>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div className="m-serif" style={{ fontSize: 18, lineHeight: 1.1, fontWeight: 500, flex: 1 }}>{item.title}</div>
          <span style={{ fontSize: 10, fontVariant: 'small-caps', color: PRIORITY_COLORS[item.priority], flexShrink: 0 }}>
            {PRIORITY_LABELS[item.priority]}
          </span>
        </div>
        {item.author && <div className="m-marginalia">{item.author}</div>}
        {item.notes && <div className="m-marginalia" style={{ marginTop: 8, fontStyle: 'italic', color: 'var(--m-terracotta)' }}>→ {item.notes}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }}>
          {item.estimated_price ? (
            <span className="m-nums m-mono" style={{ fontSize: 13 }}>€ {item.estimated_price.toFixed(2)}</span>
          ) : <span/>}
          {item.shop_notes && <span className="m-eyebrow" style={{ fontSize: 9 }}>{item.shop_notes}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button className="m-btn m-btn-sm" onClick={onAcquire}>acquisita</button>
          <button className="m-btn m-btn-ghost m-btn-sm" onClick={onDelete}>rimuovi</button>
        </div>
      </div>
    </div>
  );
}
