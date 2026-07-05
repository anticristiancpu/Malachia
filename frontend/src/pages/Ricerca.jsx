import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ORN } from '../components/ORN.jsx';
import BookCover from '../components/BookCover.jsx';
import { search as searchApi } from '../api/index.js';

/* ── Row hover helper ───────────────────────────────────────────────── */
function HoverRow({ onClick, children, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        cursor: 'pointer',
        background: hov ? 'rgba(255,255,255,0.35)' : 'transparent',
        transition: 'background 120ms',
        ...style,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

const HINT = 'autore:Calvino · genere:romanzo · anno:1970–1985 · "città"';

export default function Ricerca() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ books: [], notes: [], authors: [] });
  const [advResults, setAdvResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const isAdvanced = /autore:|genere:|anno:|stato:|lingua:|valutazione:/.test(query);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults({ books: [], notes: [], authors: [] }); setAdvResults(null); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        if (isAdvanced) {
          const r = await searchApi.advanced(query);
          setAdvResults(r);
          setResults({ books: [], notes: [], authors: [] });
        } else {
          const r = await searchApi.quick(query, 20);
          setResults(r);
          setAdvResults(null);
        }
      } catch {}
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const totalResults = advResults ? advResults.books?.length : (results.books.length + results.notes.length + results.authors.length);

  return (
    <div style={{ padding: '32px 48px', height: '100%', overflow: 'auto' }}>
      <div className="m-eyebrow">Index quaerendi · ricerca avanzata</div>
      <div className="m-serif" style={{ fontSize: 50, fontWeight: 500, lineHeight: 1, marginTop: 4 }}>
        Cerca un <em style={{ color: 'var(--m-terracotta)' }}>volume</em>
      </div>

      <div className="m-searchbar" style={{ marginTop: 18, fontSize: 22 }}>
        <ORN.quill size={22} style={{ color: 'var(--m-ink-soft)' }}/>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={HINT}
          style={{ fontSize: 20 }}
        />
        {loading && <div className="m-spinner" style={{ width: 18, height: 18, flexShrink: 0 }}/>}
      </div>

      {isAdvanced && (
        <div className="m-marginalia" style={{ marginTop: 8, fontSize: 12 }}>
          Ricerca avanzata attiva. Campi: autore:, genere:, anno:AAAA–AAAA, stato:read/tbr/reading, lingua:, valutazione:1-5
        </div>
      )}

      {query && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, marginTop: 24 }}>
          {/* Facets */}
          <aside>
            <div className="m-eyebrow" style={{ marginBottom: 8 }}>Risultati</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { label: `Libri · ${advResults?.books?.length ?? results.books.length}`, active: true },
                { label: `Note · ${results.notes.length}` },
                { label: `Autori · ${results.authors.length}` },
              ].map(({ label, active }) => (
                <div key={label} className="m-body" style={{ padding: '6px 0', fontSize: 15, color: active ? 'var(--m-ink)' : 'var(--m-ink-muted)' }}>
                  {active && <span style={{ marginRight: 8, color: 'var(--m-terracotta)' }}>◆</span>}{label}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20 }}>
              <div className="m-eyebrow" style={{ marginBottom: 6 }}>Sintassi</div>
              {[
                ['autore:', 'Filtra per autore'],
                ['genere:', 'Filtra per genere'],
                ['anno:', 'Es. anno:1970–1985'],
                ['stato:', 'read / tbr / reading'],
              ].map(([k, v]) => (
                <div key={k} style={{ marginBottom: 6 }}>
                  <span className="m-mono" style={{ fontSize: 12, color: 'var(--m-terracotta)' }}>{k}</span>
                  <span className="m-marginalia" style={{ marginLeft: 6, fontSize: 12 }}>{v}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Risultati */}
          <div>

            {/* ── Libri ── */}
            {(advResults?.books || results.books).length > 0 && (
              <>
                <div className="m-eyebrow" style={{ marginBottom: 10 }}>
                  {(advResults?.books || results.books).length} {(advResults?.books || results.books).length === 1 ? 'libro' : 'libri'}
                </div>
                {(advResults?.books || results.books).map(b => (
                  <HoverRow
                    key={b.id}
                    style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 14, alignItems: 'center', padding: '10px 8px', borderBottom: '1px solid var(--m-rule)' }}
                    onClick={() => navigate(`/libro/${b.id}`, { state: { from: 'cerca' } })}
                  >
                    <BookCover book={b} w={60} h={86}/>
                    <div>
                      <div className="m-serif" style={{ fontSize: 19, lineHeight: 1.2 }}>{b.title}</div>
                      {/* autori cliccabili inline */}
                      <div className="m-marginalia" style={{ marginTop: 3 }}
                        onClick={e => e.stopPropagation()}>
                        {b.authors?.length > 0
                          ? b.authors.map((a, i) => (
                              <React.Fragment key={a.id}>
                                {i > 0 && ', '}
                                <span
                                  style={{ cursor: 'pointer', borderBottom: '1px dotted currentColor' }}
                                  onClick={() => navigate(`/autori/${a.id}`)}
                                >{a.name}</span>
                              </React.Fragment>
                            ))
                          : (b.author_names || b.author_name || '')}
                        {b.year ? <span style={{ color: 'var(--m-ink-muted)' }}> · {b.year}</span> : ''}
                        {b.publisher ? <span style={{ color: 'var(--m-ink-muted)' }}> · {b.publisher}</span> : ''}
                      </div>
                      {b.isbn13 && (
                        <div className="m-mono" style={{ fontSize: 10, color: 'var(--m-ink-muted)', marginTop: 2 }}>{b.isbn13}</div>
                      )}
                    </div>
                  </HoverRow>
                ))}
              </>
            )}

            {/* ── Note ── */}
            {results.notes.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div className="m-eyebrow" style={{ marginBottom: 10 }}>
                  {results.notes.length} {results.notes.length === 1 ? 'nota' : 'note'} & citazioni
                </div>
                {results.notes.map(n => (
                  <HoverRow
                    key={n.id}
                    style={{ marginBottom: 10, padding: '2px 0' }}
                    onClick={() => navigate(`/libro/${n.book_id}#note`)}
                  >
                    <div className="m-quote-card">
                      {n.quote && (
                        <div className="m-serif" style={{ fontSize: 17, fontStyle: 'italic', lineHeight: 1.4 }}>
                          {n.quote.slice(0, 200)}{n.quote.length > 200 ? '…' : ''}
                        </div>
                      )}
                      <div className="m-marginalia" style={{ marginTop: 6 }}>
                        da <em>{n.book_title}</em>
                        {n.page && <span> · p. {n.page}</span>}
                      </div>
                    </div>
                  </HoverRow>
                ))}
              </div>
            )}

            {/* ── Autori ── */}
            {results.authors.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div className="m-eyebrow" style={{ marginBottom: 10 }}>
                  {results.authors.length} {results.authors.length === 1 ? 'autore' : 'autori'}
                </div>
                {results.authors.map(a => (
                  <HoverRow
                    key={a.id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 8px', borderBottom: '1px solid var(--m-rule)' }}
                    onClick={() => navigate(`/autori/${a.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Iniziale decorativa */}
                      <div style={{
                        width: 36, height: 36, flexShrink: 0,
                        background: 'var(--m-rule)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--m-serif)', fontSize: 18, color: 'var(--m-ink-muted)',
                        fontStyle: 'italic',
                      }}>
                        {a.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="m-serif" style={{ fontSize: 18, lineHeight: 1.15 }}>{a.name}</div>
                        {a.nationality && (
                          <div className="m-marginalia" style={{ fontSize: 11 }}>{a.nationality}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="m-marginalia">{a.book_count} {a.book_count === 1 ? 'volume' : 'volumi'}</span>
                      <span style={{ fontSize: 12, color: 'var(--m-ink-muted)' }}>›</span>
                    </div>
                  </HoverRow>
                ))}
              </div>
            )}

            {query && totalResults === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="m-serif" style={{ fontSize: 24, fontStyle: 'italic', color: 'var(--m-ink-muted)' }}>
                  Nessun risultato per "<em>{query}</em>"
                </div>
                <div className="m-marginalia" style={{ marginTop: 8 }}>
                  Prova con un termine diverso o usa la sintassi avanzata
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!query && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <ORN.fleuron size={40} style={{ color: 'var(--m-rule-strong)', display: 'block', margin: '0 auto' }}/>
          <div className="m-serif" style={{ fontSize: 24, fontStyle: 'italic', color: 'var(--m-ink-muted)', marginTop: 16 }}>
            Digita per cercare nella tua biblioteca.
          </div>
          <div className="m-marginalia" style={{ marginTop: 8 }}>Cerca per titolo, autore, ISBN, citazione…</div>
        </div>
      )}
    </div>
  );
}
