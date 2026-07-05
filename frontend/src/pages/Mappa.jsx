import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCover, { BOOK_PALETTES } from '../components/BookCover.jsx';
import { books as booksApi } from '../api/index.js';

const ROOMS = ['studio', 'salotto', 'camera', 'ingresso'];

export default function Mappa() {
  const navigate = useNavigate();
  const [room, setRoom] = useState('salotto');
  const [books, setBooks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    booksApi.list({ limit: 200 }).then(r => { setBooks(r.books || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Raggruppa per ripiano
  const byShelf = {};
  for (const b of books) {
    if (!b.location_room || b.location_room !== room) continue;
    const shelf = b.location_shelf || 1;
    if (!byShelf[shelf]) byShelf[shelf] = [];
    byShelf[shelf].push(b);
  }

  // Se nessun libro ha collocazione per questa stanza, simula
  const numShelves = Object.keys(byShelf).length || 4;
  const booksWithLocation = books.filter(b => b.location_room);
  const booksWithoutLocation = books.filter(b => !b.location_room).slice(0, 50);

  // Usa libri simulati se non ci sono posizioni fisiche
  const displayShelves = Object.keys(byShelf).length > 0 ? byShelf : simulateShelves(booksWithoutLocation);

  return (
    <div style={{ padding: '24px 36px', height: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="m-eyebrow">Capitulum V · Topografia della stanza</div>
          <div className="m-serif" style={{ fontSize: 38, fontWeight: 500, lineHeight: 1.05, marginTop: 2 }}>
            Mappa della <em style={{ color: 'var(--m-terracotta)' }}>biblioteca</em>
          </div>
          <div className="m-marginalia" style={{ marginTop: 4 }}>
            tocca un dorso per sapere dov'è · la collocazione si imposta nella scheda del libro
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {ROOMS.map(r => (
            <button key={r} className={`m-btn${room === r ? '' : ' m-btn-ghost'}`} onClick={() => setRoom(r)}>
              {r}
            </button>
          ))}
          <button className="m-btn m-btn-ghost">+ stanza</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, flex: 1, minHeight: 0 }}>
        {/* Libreria fisica */}
        <div style={{
          background: 'linear-gradient(180deg, #2a1d10 0%, #2a1d10 100%)',
          padding: '20px 18px',
          boxShadow: 'inset 0 0 0 6px #1a140a, 0 0 40px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 8, left: 14, color: 'var(--m-gold-pale)', fontFamily: "'EB Garamond', serif", fontVariant: 'small-caps', letterSpacing: '.2em', fontSize: 11, opacity: .8 }}>
            {room} · libreria A · parete nord
          </div>
          <div style={{ height: 20 }}/>

          {Object.entries(displayShelves).map(([shelfNum, shelfBooks]) => (
            <div key={shelfNum} style={{
              background: '#3a2a1a',
              borderTop: '2px solid #1a140a',
              borderBottom: '4px solid #1a140a',
              padding: '8px 10px',
              display: 'flex', alignItems: 'flex-end', gap: 3,
              minHeight: 90, position: 'relative',
            }}>
              <div style={{ position: 'absolute', left: -2, top: 6, color: 'var(--m-gold-pale)', fontFamily: "'EB Garamond', serif", fontSize: 10, transform: 'rotate(-90deg)', transformOrigin: 'left top', opacity: .8 }}>
                rip.{shelfNum}
              </div>
              {shelfBooks.map((b, i) => {
                const p = BOOK_PALETTES[i % BOOK_PALETTES.length];
                const isSelected = selected?.id === b.id;
                return (
                  <div key={b.id}
                    onClick={() => setSelected(b)}
                    title={b.title}
                    style={{
                      width: 18 + (i % 4) * 5,
                      height: '100%', minHeight: 60,
                      background: b.cover_palette ? JSON.parse(b.cover_palette || '[]')[0] || p[0] : p[0],
                      boxShadow: isSelected
                        ? '0 0 0 2px var(--m-vermilion), 0 0 16px var(--m-vermilion)'
                        : 'inset 0 0 0 1px rgba(0,0,0,0.4), inset 0 -3px 0 rgba(0,0,0,0.2), 1px 0 0 rgba(255,255,255,0.05)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'box-shadow 0.15s',
                    }}>
                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: p[1], fontSize: 8, fontFamily: "'Cormorant Garamond', serif", fontVariant: 'small-caps', letterSpacing: '.06em', opacity: .85, padding: '8px 0', overflow: 'hidden', maxHeight: '100%' }}>
                      {b.author_names?.split(',')[0] || b.title?.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
              <div style={{ flex: 1 }}/>
            </div>
          ))}

          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><div className="m-spinner"/></div>}
          {!loading && Object.keys(displayShelves).length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--m-gold-pale)', fontFamily: "'EB Garamond', serif", fontStyle: 'italic', padding: 40, opacity: .7 }}>
              Nessun libro con collocazione assegnata per questa stanza.
              <br/>Assegna la stanza "{room}" dalla scheda di ogni libro.
            </div>
          )}
        </div>

        {/* Pannello laterale */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="m-eyebrow">Volume selezionato</div>
          {selected ? (
            <>
              <BookCover book={selected} w={200} h={290}/>
              <div className="m-serif" style={{ fontSize: 20, lineHeight: 1.1 }}>{selected.title}</div>
              <div className="m-marginalia">{selected.author_names} {selected.year ? `· ${selected.year}` : ''}</div>
              {selected.location_bookcase && (
                <div style={{ borderTop: '1px solid var(--m-rule)', borderBottom: '1px solid var(--m-rule)', padding: '10px 0' }}>
                  <div className="m-eyebrow" style={{ marginBottom: 4 }}>Collocazione fisica</div>
                  <div className="m-serif" style={{ fontSize: 16 }}>
                    {selected.location_room} · {selected.location_bookcase}
                    {selected.location_shelf ? ` · ripiano ${selected.location_shelf}` : ''}
                    {selected.location_position ? `, posizione ${selected.location_position}` : ''}
                  </div>
                </div>
              )}
              <button className="m-btn m-btn-ghost" style={{ justifyContent: 'center' }}
                onClick={() => navigate(`/libro/${selected.id}`)}>Apri scheda ›</button>
            </>
          ) : (
            <div className="m-marginalia" style={{ fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
              Clicca su un dorso per vedere i dettagli del libro.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function simulateShelves(books) {
  const shelves = { 1: [], 2: [], 3: [], 4: [] };
  books.forEach((b, i) => {
    const shelf = (i % 4) + 1;
    shelves[shelf].push(b);
  });
  return shelves;
}
