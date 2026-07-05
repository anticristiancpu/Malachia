import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import { ORN } from '../components/ORN.jsx';
import { authors as authorsApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';

export default function DettaglioAutore() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wiki, setWiki] = useState(null);
  const [wikiLoaded, setWikiLoaded] = useState(false);

  useEffect(() => {
    authorsApi.get(id)
      .then(a => { setAuthor(a); setLoading(false); })
      .catch(() => navigate('/autori'));
  }, [id]);

  /* Auto-fetch Wikipedia non appena l'autore è caricato */
  useEffect(() => {
    if (!author || wikiLoaded) return;
    setWikiLoaded(true);
    authorsApi.wikipedia(id)
      .then(data => { if (data?.extract) setWiki(data); })
      .catch(() => { /* silenzioso: Wikipedia non sempre raggiungibile */ });
  }, [author, id, wikiLoaded]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div className="m-spinner"/>
    </div>
  );
  if (!author) return null;

  const books = author.books || [];
  const CARD_W = 110;
  const CARD_H = Math.round(CARD_W * 1.44);

  const dateRange = author.birth_date
    ? (author.death_date
        ? `${author.birth_date.slice(0, 4)} – ${author.death_date.slice(0, 4)}`
        : `n. ${author.birth_date.slice(0, 4)}`)
    : null;

  return (
    <div style={{ padding: '28px 40px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Naviga indietro */}
      <button className="m-btn m-btn-ghost m-btn-sm" style={{ alignSelf: 'flex-start' }}
        onClick={() => navigate('/autori')}>
        ← tutti gli autori
      </button>

      {/* ── Hero banner Wikipedia ── */}
      {wiki ? (
        <div style={{
          display: 'flex', gap: 0,
          background: 'linear-gradient(135deg, rgba(42,29,16,0.96) 0%, rgba(62,42,22,0.92) 100%)',
          border: '1px solid rgba(191,161,90,0.3)',
          overflow: 'hidden',
          minHeight: 200,
        }}>
          {/* Foto autore */}
          {wiki.thumbnail && (
            <div style={{
              flexShrink: 0, width: 160,
              background: 'rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'stretch',
            }}>
              <img
                src={wiki.thumbnail}
                alt={author.name}
                style={{
                  width: '100%', objectFit: 'cover', objectPosition: 'top center',
                  display: 'block',
                }}
              />
            </div>
          )}

          {/* Contenuto testuale */}
          <div style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
            <div style={{
              fontFamily: "'UnifrakturCook', serif",
              fontSize: 13, letterSpacing: '0.12em',
              color: 'rgba(191,161,90,0.7)', textTransform: 'uppercase',
            }}>Autore</div>

            <div className="m-serif" style={{ fontSize: 38, fontWeight: 500, lineHeight: 1.05, color: 'var(--m-gold-pale)' }}>
              {author.name}
            </div>

            {(author.nationality || dateRange) && (
              <div style={{ fontSize: 14, color: 'rgba(191,161,90,0.6)', fontStyle: 'italic', fontFamily: "'EB Garamond', serif" }}>
                {[author.nationality, dateRange].filter(Boolean).join(' · ')}
              </div>
            )}

            {/* Divisore ornamentale */}
            <div style={{ borderTop: '1px solid rgba(191,161,90,0.25)', marginTop: 4, paddingTop: 14 }}>
              <p style={{
                fontFamily: "'EB Garamond', serif",
                fontSize: 14.5, lineHeight: 1.75,
                color: 'rgba(255,248,235,0.82)',
                margin: 0,
                display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {wiki.extract}
              </p>
            </div>

            {/* Chip contatore */}
            <div style={{ marginTop: 6 }}>
              <span style={{
                display: 'inline-block', padding: '3px 10px',
                border: '1px solid rgba(191,161,90,0.3)',
                fontSize: 12, color: 'rgba(191,161,90,0.65)',
                fontFamily: "'EB Garamond', serif", fontVariant: 'small-caps', letterSpacing: '0.1em',
              }}>
                {books.length} {books.length === 1 ? 'volume in biblioteca' : 'volumi in biblioteca'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Header semplice se Wikipedia non disponibile */
        <div style={{ borderBottom: '1px solid var(--m-rule)', paddingBottom: 20 }}>
          <div className="m-eyebrow" style={{ marginBottom: 4 }}>Autore</div>
          <div className="m-serif" style={{ fontSize: 44, fontWeight: 500, lineHeight: 1.05 }}>{author.name}</div>
          {(author.nationality || dateRange) && (
            <div className="m-body" style={{ fontSize: 16, color: 'var(--m-ink-muted)', fontStyle: 'italic', marginTop: 6 }}>
              {[author.nationality, dateRange].filter(Boolean).join(' · ')}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <span className="m-chip">
              {books.length} {books.length === 1 ? 'volume in biblioteca' : 'volumi in biblioteca'}
            </span>
          </div>
        </div>
      )}

      {/* Bio locale (se nessuna wiki e biografia presente) */}
      {!wiki && author.biography && (
        <div style={{ maxWidth: 700 }}>
          <div className="m-eyebrow" style={{ marginBottom: 8 }}>Biografia</div>
          <p className="m-body" style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{author.biography}</p>
        </div>
      )}

      {/* ── Libri ── */}
      <div>
        <div className="m-eyebrow" style={{ marginBottom: 14 }}>Opere in biblioteca</div>
        {books.length === 0 ? (
          <div className="m-body" style={{ color: 'var(--m-ink-muted)', fontStyle: 'italic' }}>
            Nessun libro in biblioteca
          </div>
        ) : (
          <div
            className="m-book-grid"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_W}px, 1fr))` }}
          >
            {books.map(b => (
              <div
                key={b.id}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                onClick={() => navigate(`/libro/${b.id}`)}
              >
                <BookCover book={b} w={CARD_W} h={CARD_H}/>
                <div className="m-serif" style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.15, width: '100%' }}>
                  {b.title}
                </div>
                {b.year && (
                  <div className="m-marginalia" style={{ fontSize: 11, textAlign: 'center' }}>{b.year}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
