import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ORN } from '../components/ORN.jsx';
import { notes as notesApi } from '../api/index.js';

export default function Note() {
  const navigate = useNavigate();
  const [data, setData] = useState({ notes: [], total: 0 });
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notesApi.allTags().then(setAllTags).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    notesApi.list({ search: search || undefined, tags: selectedTag || undefined, limit: 100 })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, selectedTag]);

  // Raggruppa per data
  const grouped = {};
  for (const n of (data.notes || [])) {
    const d = n.created_at?.split('T')[0] || 'senza data';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(n);
  }

  // Conteggio autori
  const authorCounts = {};
  for (const n of (data.notes || [])) {
    if (n.author_name) authorCounts[n.author_name] = (authorCounts[n.author_name] || 0) + 1;
  }
  const topAuthors = Object.entries(authorCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div style={{ padding: '28px 40px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, height: '100%', overflow: 'hidden' }}>
      {/* Contenuto principale */}
      <div style={{ overflow: 'auto', paddingRight: 8 }}>
        <div className="m-eyebrow">Capitulum VI · Marginalia</div>
        <div className="m-serif" style={{ fontSize: 46, fontWeight: 500, lineHeight: 1.05, marginTop: 2 }}>
          Note e <em style={{ color: 'var(--m-terracotta)' }}>citazioni</em>
        </div>
        <div className="m-marginalia" style={{ marginTop: 6 }}>il commonplace book: tutto ciò che hai sottolineato, in un unico filo.</div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="m-spinner"/></div>
        ) : data.notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="m-serif" style={{ fontSize: 24, fontStyle: 'italic', color: 'var(--m-ink-muted)' }}>Ancora nessuna annotazione.</div>
            <div className="m-marginalia" style={{ marginTop: 8 }}>Aggiungi note dalle pagine dei singoli libri.</div>
          </div>
        ) : (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {Object.entries(grouped).map(([date, notes]) => (
              <div key={date}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0 10px' }}>
                  <span className="m-folio" style={{ fontSize: 13 }}>{formatDate(date)}</span>
                  <ORN.rule style={{ flex: 1, color: 'var(--m-rule)' }}/>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {notes.map(n => (
                    <article key={n.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 20 }}>
                      <div style={{ textAlign: 'right' }}>
                        {n.page && <div className="m-mono" style={{ fontSize: 12, color: 'var(--m-ink-muted)', marginTop: 4 }}>p. {n.page}</div>}
                      </div>
                      <div>
                        <div className="m-eyebrow" style={{ marginBottom: 6 }}>
                          da <em style={{ fontStyle: 'italic', color: 'var(--m-ink-soft)', cursor: 'pointer' }}
                            onClick={() => navigate(`/libro/${n.book_id}`)}>
                            {n.book_title}
                          </em>
                          {n.author_name ? ` · ${n.author_name}` : ''}
                        </div>
                        {n.quote && (
                          <blockquote style={{ margin: 0, padding: '0 0 0 18px', borderLeft: '3px solid var(--m-terracotta)' }}>
                            <p className="m-serif" style={{ fontSize: 22, fontStyle: 'italic', lineHeight: 1.4, margin: 0 }}>{n.quote}</p>
                          </blockquote>
                        )}
                        {n.gloss && (
                          <p className="m-body" style={{ fontSize: 16, lineHeight: 1.55, marginTop: 8, color: 'var(--m-ink-soft)' }}>{n.gloss}</p>
                        )}
                        {n.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                            {n.tags.map(t => (
                              <span key={t} className={`m-chip${selectedTag === t ? ' active' : ''}`} style={{ fontSize: 11 }}
                                onClick={() => setSelectedTag(selectedTag === t ? '' : t)}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar destra */}
      <aside style={{ borderLeft: '1px solid var(--m-rule)', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 20, overflow: 'auto' }}>
        <div>
          <div className="m-eyebrow" style={{ marginBottom: 8 }}>Filtra · {data.total} note</div>
          <div className="m-searchbar">
            <ORN.quill size={14}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="cerca nelle citazioni…"/>
          </div>
        </div>

        {allTags.length > 0 && (
          <div>
            <div className="m-eyebrow" style={{ marginBottom: 8 }}>Etichette</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allTags.map(t => (
                <span key={t} className={`m-chip${selectedTag === t ? ' active' : ''}`}
                  onClick={() => setSelectedTag(selectedTag === t ? '' : t)}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {topAuthors.length > 0 && (
          <div>
            <div className="m-eyebrow" style={{ marginBottom: 8 }}>Autori più annotati</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topAuthors.map(([author, count]) => (
                <div key={author} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0', borderBottom: '1px solid var(--m-rule)' }}>
                  <span className="m-serif" style={{ fontSize: 15 }}>{author}</span>
                  <span className="m-nums m-mono" style={{ fontSize: 12, color: 'var(--m-ink-muted)' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="m-marginalia" style={{ marginTop: 'auto', lineHeight: 1.6 }}>
          "Quando leggo segno con una matita le frasi che mi piacciono — e poi le riporto in un quaderno."
          <br/>— abitudine di W. H. Auden.
        </div>
      </aside>
    </div>
  );
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}
