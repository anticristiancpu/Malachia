import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { stats } from '../api/index.js';

/* ── Palette ──────────────────────────────────────────────────────────── */
const GOLD    = '#bfa15a';
const TERRA   = '#7a3b2e';
const BLUE    = '#2a4a8a';
const GREEN   = '#3a6a4a';
const SLATE   = '#4a5a6a';
const PALETTE = ['#bfa15a','#7a3b2e','#2a4a8a','#3a6a4a','#9a7e3a','#5a4a7a','#4a6a5a','#7a5a3a','#3a4a6a','#6a3a4a'];

const STATUS_META = [
  { key: 'read',      label: 'Letti',       color: GREEN },
  { key: 'reading',   label: 'In lettura',  color: BLUE  },
  { key: 'tbr',       label: 'Da leggere',  color: GOLD  },
  { key: 'abandoned', label: 'Abbandonati', color: TERRA },
];

const FORMAT_LABEL   = { hardcover: 'Rilegato', paperback: 'Brossura', ebook: 'eBook', audiobook: 'Audiolibro', comics: 'Fumetti' };
const ROLE_LABEL     = { author: 'Autori', editor: 'Curatori', translator: 'Traduttori', illustrator: 'Illustratori' };
const PRIORITY_LABEL = { high: 'Alta', medium: 'Media', low: 'Bassa' };
const PRIORITY_COLOR = { high: TERRA, medium: GOLD, low: GREEN };
const NOTE_LABEL     = { quote: 'Citazioni', note: 'Note', annotation: 'Annotazioni' };

/* ── Utilities ────────────────────────────────────────────────────────── */
const n   = (v, fb = 0) => v != null ? v : fb;
const pct = (v, tot)    => tot > 0 ? Math.round((v / tot) * 100) : 0;
const fmt = v => Number(v).toLocaleString('it');

const lightTooltip = {
  contentStyle: {
    background: 'var(--m-parchment)', border: '1px solid var(--m-rule-strong)',
    color: 'var(--m-ink)', fontFamily: "'EB Garamond', Georgia, serif",
    fontSize: 13, borderRadius: 0,
  },
  cursor: { fill: 'rgba(0,0,0,0.04)' },
};

/* ── Blocchi UI riutilizzabili ────────────────────────────────────────── */
function Card({ children, kicker, span = 1, style = {} }) {
  return (
    <div style={{ gridColumn: `span ${span}`, border: '1px solid var(--cine-gold-dim)', padding: '18px 20px', display: 'flex', flexDirection: 'column', ...style }}>
      {kicker && <div className="m-eyebrow" style={{ marginBottom: 10 }}>{kicker}</div>}
      {children}
    </div>
  );
}

function Kpi({ kicker, value, sub, span = 1, valueColor }) {
  return (
    <Card kicker={kicker} span={span}>
      <div style={{ fontSize: 46, lineHeight: 1, fontFamily: "'EB Garamond', Georgia, serif", color: valueColor || 'var(--m-ink)', marginTop: 4 }}>
        {value}
      </div>
      {sub && <div className="m-marginalia" style={{ marginTop: 6, fontSize: 12, color: 'var(--m-ink-muted)' }}>{sub}</div>}
    </Card>
  );
}

function HBar({ label, value, max, color = GOLD, sub, pctSuffix }) {
  const p = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
      <div style={{ fontSize: 13, fontFamily: "'EB Garamond', Georgia, serif", color: 'var(--m-ink)', minWidth: 140, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }} title={label}>
        {label}
      </div>
      <div style={{ flex: 1, height: 6, background: 'var(--m-rule)' }}>
        <div style={{ height: 6, width: `${p}%`, background: color, transition: 'width 600ms ease' }}/>
      </div>
      <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--m-ink-muted)', minWidth: 36, textAlign: 'right', flexShrink: 0 }}>
        {value}{pctSuffix && <span style={{ fontSize: 10, marginLeft: 2 }}>({pctSuffix}%)</span>}
        {sub && <span style={{ fontSize: 10, marginLeft: 2, color: 'var(--m-ink-muted)' }}>{sub}</span>}
      </div>
    </div>
  );
}

function SecRule({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, marginTop: 4 }}>
      <div style={{ fontFamily: "'UnifrakturCook', serif", fontSize: 22, color: 'var(--m-terracotta)', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: 'var(--cine-gold-dim)' }}/>
    </div>
  );
}

function Empty({ msg = 'Nessun dato disponibile' }) {
  return <div style={{ fontSize: 13, color: 'var(--m-ink-muted)', fontStyle: 'italic', padding: '6px 0' }}>{msg}</div>;
}

/* ── Tab bar ──────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'panoramica', label: 'Panoramica'       },
  { id: 'libreria',   label: 'Libreria'         },
  { id: 'lettura',    label: 'Lettura'          },
  { id: 'persone',    label: 'Autori & Editori' },
  { id: 'scaffali',   label: 'Scaffali'         },
  { id: 'extra',      label: 'Desiderata & Note'},
];

function TabBar({ active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--cine-gold-dim)', flexShrink: 0 }}>
      {TABS.map(t => {
        const isActive = t.id === active;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 18px', fontSize: 13,
              fontFamily: "'EB Garamond', Georgia, serif",
              color: isActive ? 'var(--m-ink)' : 'var(--m-ink-muted)',
              borderBottom: isActive ? '2px solid var(--m-terracotta)' : '2px solid transparent',
              marginBottom: -1, fontWeight: isActive ? 600 : 400,
              transition: 'color 150ms',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--m-ink)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--m-ink-muted)'; }}
          >{t.label}</button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PAGINA
══════════════════════════════════════════════════════════════════════ */
export default function Annales() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('panoramica');

  useEffect(() => {
    stats.get()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statusTotal = useMemo(
    () => (data?.by_status || []).reduce((s, r) => s + r.count, 0), [data]
  );

  return (
    <div style={{ padding: '28px 36px 0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <div className="m-eyebrow" style={{ marginBottom: 4 }}>Capitulum VIII</div>
        <div style={{
          fontFamily: "'Cinzel', 'Mantinia', serif",
          fontSize: 42, fontWeight: 400, lineHeight: 1.05, color: 'var(--cine-cream)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          Annales
          <em style={{
            fontFamily: "'Agmena Pro', 'EB Garamond', Georgia, serif",
            fontSize: 22, fontStyle: 'italic', fontWeight: 400,
            color: 'var(--cine-gold)', letterSpacing: '0.01em',
            textTransform: 'none', marginLeft: '0.4em',
          }}>· Bibliotheca</em>
        </div>
        <div style={{ fontSize: 13, color: 'var(--m-ink-muted)', marginTop: 4, fontFamily: "'EB Garamond', serif", fontStyle: 'italic' }}>
          Statistiche complete della biblioteca personale
        </div>
      </div>

      <TabBar active={tab} onChange={setTab}/>

      {/* ── Contenuto tab ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 0 60px' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="m-spinner"/>
          </div>
        ) : !data ? (
          <div style={{ textAlign: 'center', color: 'var(--m-ink-muted)', padding: 60, fontStyle: 'italic' }}>
            Impossibile caricare i dati
          </div>
        ) : (
          <>

            {/* ══════════════════ TAB: PANORAMICA ══════════════════ */}
            {tab === 'panoramica' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Hero + status inline */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(3,1fr)', gap: 14 }}>
                  <Card style={{ justifyContent: 'center' }}>
                    <div className="m-eyebrow" style={{ marginBottom: 8 }}>Volumi in collezione</div>
                    <div style={{ fontSize: 96, lineHeight: 0.88, fontFamily: "'EB Garamond', Georgia, serif", color: 'var(--m-ink)' }}>
                      {n(data.total_books)}
                    </div>
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--m-rule)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      {STATUS_META.map(({ key, label, color }) => {
                        const cnt = (data.by_status || []).find(s => s.status === key)?.count || 0;
                        return (
                          <div key={key}>
                            <div style={{ fontSize: 10, color: 'var(--m-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                            <div style={{ fontSize: 26, fontFamily: "'EB Garamond', serif", color, lineHeight: 1.15 }}>{cnt}</div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                  <Kpi kicker="Pagine totali"     value={fmt(n(data.total_pages_collection))} sub="nella collezione"/>
                  <Kpi kicker="Libri letti"       value={n(data.total_books_read)} sub={`su ${n(data.total_books)} in collezione`}/>
                  <Kpi kicker="Autori"            value={n(data.total_authors_count)} sub={`${n(data.total_publishers_count)} editori distinti`}/>
                </div>

                {/* KPI riga 2 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
                  <Kpi kicker="Scaffali"          value={n(data.shelf_count)} sub={`${n(data.total_shelf_assoc)} totale assoc.`}/>
                  <Kpi kicker="Desiderata"        value={n(data.wishlist_table_count)} sub="libri in lista"/>
                  <Kpi kicker="Note & citazioni"  value={n(data.total_notes)}/>
                  <Kpi kicker="Prestiti attivi"   value={n(data.active_loans)} sub={n(data.overdue_loans) > 0 ? `${n(data.overdue_loans)} in scadenza` : 'tutto in regola'} valueColor={n(data.overdue_loans) > 0 ? TERRA : undefined}/>
                  <Kpi kicker="Autori seguiti"    value={n(data.followed_authors)}/>
                </div>

                {/* Valore della collezione (solo se ci sono volumi quotati) */}
                {n(data.books_with_value) > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 14 }}>
                    <Card kicker="Valore totale stimato" style={{ background: 'rgba(191,161,90,0.06)' }}>
                      <div style={{ fontSize: 38, lineHeight: 1, fontFamily: "'EB Garamond', Georgia, serif", color: GOLD, marginTop: 4 }}>
                        € {Number(n(data.total_market_value)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="m-marginalia" style={{ marginTop: 6 }}>su {n(data.books_with_value)} volumi quotati</div>
                    </Card>
                    <Card kicker="Valore medio a volume">
                      <div style={{ fontSize: 38, lineHeight: 1, fontFamily: "'EB Garamond', Georgia, serif", marginTop: 4 }}>
                        {data.avg_market_value
                          ? `€ ${Number(data.avg_market_value).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '–'}
                      </div>
                    </Card>
                    <Card kicker="Top 10 · Volumi di maggior valore">
                      {(data.top_value_books || []).slice(0, 10).map((b, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5, borderBottom: '1px solid var(--m-rule)', paddingBottom: 5 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', overflow: 'hidden' }}>
                            <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--m-ink-muted)', minWidth: 14, flexShrink: 0 }}>{i + 1}.</span>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: 13, fontFamily: "'EB Garamond', serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{b.title}</div>
                              {b.author_names && <div style={{ fontSize: 10, color: 'var(--m-ink-muted)' }}>{b.author_names}</div>}
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontFamily: 'monospace', color: GOLD, flexShrink: 0, marginLeft: 12 }}>
                            € {Number(b.market_value).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      ))}
                    </Card>
                  </div>
                )}

                {/* Ultimi aggiunti */}
                {(data.recently_added || []).length > 0 && (
                  <Card kicker="Ultimi volumi aggiunti">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 4 }}>
                      {(data.recently_added || []).map((b, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: i < data.recently_added.length - 1 ? '1px solid var(--m-rule)' : 'none' }}>
                          <div>
                            <span style={{ fontSize: 14, fontFamily: "'EB Garamond', serif" }}>{b.title}</span>
                            {b.author_names && <span style={{ fontSize: 12, color: 'var(--m-ink-muted)', marginLeft: 10 }}>{b.author_names}</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--m-ink-muted)', flexShrink: 0, marginLeft: 20, fontFamily: 'monospace' }}>
                            {b.added_at ? new Date(b.added_at).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' }) : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Mini grafici affiancati */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14 }}>
                  <Card kicker="Acquisizioni per anno">
                    {(data.added_per_year || []).length > 0 ? (
                      <div style={{ height: 160, marginTop: 8 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.added_per_year} barSize={16}>
                            <XAxis dataKey="yr" tick={{ fill: 'var(--m-ink-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                            <YAxis hide allowDecimals={false}/>
                            <Tooltip {...lightTooltip} formatter={v => [v, 'volumi']}/>
                            <Bar dataKey="count" fill={GOLD}>
                              {(data.added_per_year || []).map((_,i) => (
                                <Cell key={i} fill={i === data.added_per_year.length-1 ? TERRA : GOLD}/>
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <Empty/>}
                  </Card>
                  <Card kicker="Per decennio di pubblicazione">
                    {(data.by_decade || []).length > 0 ? (
                      <div style={{ height: 160, marginTop: 8 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.by_decade} barSize={12}>
                            <XAxis dataKey="decade" tick={{ fill: 'var(--m-ink-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `'${String(v).slice(-2)}s`}/>
                            <YAxis hide allowDecimals={false}/>
                            <Tooltip {...lightTooltip} formatter={v => [v, 'libri']} labelFormatter={l => `Anni ${l}`}/>
                            <Bar dataKey="count" fill={TERRA} opacity={0.85}/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <Empty/>}
                  </Card>
                </div>
              </div>
            )}

            {/* ══════════════════ TAB: LIBRERIA ══════════════════ */}
            {tab === 'libreria' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                  <Kpi kicker="Volumi"        value={n(data.total_books)}/>
                  <Kpi kicker="Pagine totali" value={fmt(n(data.total_pages_collection))}/>
                  <Kpi kicker="Pagine medie"  value={data.avg_pages ? Math.round(data.avg_pages) : '–'}/>
                  <Card kicker="Dettagli raccolta">
                    {[
                      { label: 'Con posizione',  value: n(data.books_with_location) },
                      { label: 'Con copertina',  value: n(data.books_with_cover) },
                      { label: 'Autografati',    value: n(data.signed_books) },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                        <span style={{ fontSize: 13, color: 'var(--m-ink-muted)' }}>{label}</span>
                        <span style={{ fontSize: 24, fontFamily: "'EB Garamond', serif", lineHeight: 1 }}>{value}</span>
                      </div>
                    ))}
                  </Card>
                </div>

                {/* Distribuzione status + formato */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Card kicker="Per status di lettura">
                    {STATUS_META.map(({ key, label, color }) => {
                      const cnt = (data.by_status || []).find(s => s.status === key)?.count || 0;
                      const max = Math.max(...(data.by_status || []).map(s => s.count), 1);
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 10, height: 10, background: color, flexShrink: 0, transform: 'rotate(45deg)' }}/>
                          <div style={{ fontSize: 13, fontFamily: "'EB Garamond', serif", minWidth: 100, flexShrink: 0 }}>{label}</div>
                          <div style={{ flex: 1, height: 7, background: 'var(--m-rule)' }}>
                            <div style={{ height: 7, width: `${(cnt/max)*100}%`, background: color, transition: 'width 600ms' }}/>
                          </div>
                          <div style={{ minWidth: 60, textAlign: 'right', flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--m-ink-muted)' }}>{cnt}</span>
                            <span style={{ fontSize: 10, color: 'var(--m-ink-muted)', marginLeft: 4 }}>({pct(cnt, statusTotal)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                  <Card kicker="Per formato">
                    {(data.by_format||[]).length > 0
                      ? data.by_format.map((f,i) => <HBar key={f.format} label={FORMAT_LABEL[f.format]||f.format||'Altro'} value={f.count} max={data.by_format[0]?.count||1} color={PALETTE[i%PALETTE.length]}/>)
                      : <Empty/>}
                  </Card>
                </div>

                {/* Lingua + Genere */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Card kicker="Per lingua">
                    {(data.by_language||[]).length > 0
                      ? data.by_language.map((l,i) => <HBar key={l.language} label={l.language} value={l.count} max={data.by_language[0]?.count||1} color={PALETTE[i%PALETTE.length]}/>)
                      : <Empty/>}
                  </Card>
                  <Card kicker="Per genere letterario">
                    {(data.by_genre_collection||[]).length > 0
                      ? data.by_genre_collection.map((g,i) => <HBar key={g.name} label={g.name} value={g.count} max={data.by_genre_collection[0]?.count||1} color={PALETTE[i%PALETTE.length]}/>)
                      : <Empty/>}
                  </Card>
                </div>

                {/* Serie */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
                  <Card kicker="Saghe & Serie">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                      {[
                        { label: 'Serie distinte',  value: n(data.unique_series) },
                        { label: 'Volumi in serie', value: n(data.books_in_series) },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: 13, color: 'var(--m-ink-muted)' }}>{label}</span>
                          <span style={{ fontSize: 28, fontFamily: "'EB Garamond', serif", lineHeight: 1 }}>{value}</span>
                        </div>
                      ))}
                      {data.longest_book && (
                        <div style={{ paddingTop: 10, borderTop: '1px solid var(--m-rule)', marginTop: 2 }}>
                          <div style={{ fontSize: 11, color: 'var(--m-ink-muted)', marginBottom: 3 }}>Volume più lungo</div>
                          <div style={{ fontSize: 13, fontFamily: "'EB Garamond', serif", lineHeight: 1.3 }}>{data.longest_book.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--m-ink-muted)', marginTop: 2 }}>{data.longest_book.pages} pagine</div>
                        </div>
                      )}
                    </div>
                  </Card>
                  <Card kicker="Top serie per volumi posseduti">
                    {(data.top_series||[]).length > 0
                      ? data.top_series.map((s,i) => <HBar key={s.series_name} label={s.series_name} value={s.count} max={data.top_series[0]?.count||1} color={PALETTE[i%PALETTE.length]}/>)
                      : <Empty/>}
                  </Card>
                </div>

                {/* Valore stimato */}
                {(n(data.books_with_value) > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 14 }}>
                    <Kpi
                      kicker="Valore totale stimato"
                      value={`€ ${Number(n(data.total_market_value)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      sub={`su ${n(data.books_with_value)} volumi quotati`}
                    />
                    <Kpi
                      kicker="Valore medio a volume"
                      value={data.avg_market_value ? `€ ${Number(data.avg_market_value).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '–'}
                    />
                    <Card kicker="Volumi di maggior valore">
                      {(data.top_value_books||[]).map((b, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, borderBottom: i < (data.top_value_books.length-1) ? '1px solid var(--m-rule)' : 'none', paddingBottom: 6 }}>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontFamily: "'EB Garamond', serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{b.title}</div>
                            {b.author_names && <div style={{ fontSize: 11, color: 'var(--m-ink-muted)' }}>{b.author_names}</div>}
                          </div>
                          <div style={{ fontSize: 14, fontFamily: 'monospace', color: GOLD, flexShrink: 0, marginLeft: 12 }}>
                            € {Number(b.market_value).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      ))}
                    </Card>
                  </div>
                )}

                {/* Grafici storici */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14 }}>
                  <Card kicker="Volumi acquisiti per anno">
                    {(data.added_per_year||[]).length > 0 ? (
                      <div style={{ height: 190, marginTop: 8 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.added_per_year} barSize={18}>
                            <XAxis dataKey="yr" tick={{ fill: 'var(--m-ink-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                            <YAxis hide allowDecimals={false}/>
                            <Tooltip {...lightTooltip} formatter={v => [v, 'volumi']}/>
                            <Bar dataKey="count" fill={GOLD}>
                              {(data.added_per_year||[]).map((_,i) => <Cell key={i} fill={i===data.added_per_year.length-1?TERRA:GOLD}/>)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <Empty/>}
                  </Card>
                  <Card kicker="Per decennio di pubblicazione">
                    {(data.by_decade||[]).length > 0 ? (
                      <div style={{ height: 190, marginTop: 8 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.by_decade} barSize={13}>
                            <XAxis dataKey="decade" tick={{ fill: 'var(--m-ink-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v=>`'${String(v).slice(-2)}s`}/>
                            <YAxis hide allowDecimals={false}/>
                            <Tooltip {...lightTooltip} formatter={v=>[v,'libri']} labelFormatter={l=>`Anni ${l}`}/>
                            <Bar dataKey="count" fill={TERRA} opacity={0.85}/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <Empty/>}
                  </Card>
                </div>
              </div>
            )}

            {/* ══════════════════ TAB: LETTURA ══════════════════ */}
            {tab === 'lettura' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                  <Kpi kicker="Libri letti"     value={n(data.total_books_read)}/>
                  <Kpi kicker="Pagine lette"    value={fmt(n(data.total_pages_read))} sub="stima dalla biblioteca"/>
                  <Kpi kicker="Valutazione media" value={data.avg_rating ? `${data.avg_rating}★` : '–'}/>
                  <Card kicker="In corso & abbandonati">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--m-ink-muted)' }}>In lettura</span>
                      <span style={{ fontSize: 28, fontFamily: "'EB Garamond', serif", color: BLUE, lineHeight: 1 }}>{n(data.currently_reading)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'var(--m-ink-muted)' }}>Abbandonati</span>
                      <span style={{ fontSize: 28, fontFamily: "'EB Garamond', serif", color: TERRA, lineHeight: 1 }}>{n(data.abandoned_count)}</span>
                    </div>
                    {n(data.rereads_count) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                        <span style={{ fontSize: 13, color: 'var(--m-ink-muted)' }}>Riletture</span>
                        <span style={{ fontSize: 28, fontFamily: "'EB Garamond', serif", lineHeight: 1 }}>{n(data.rereads_count)}</span>
                      </div>
                    )}
                  </Card>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                  <Card kicker="Libri terminati per anno">
                    {(data.read_per_year||[]).length > 0 ? (
                      <div style={{ height: 200, marginTop: 8 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.read_per_year} barSize={20}>
                            <XAxis dataKey="yr" tick={{ fill: 'var(--m-ink-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                            <YAxis hide allowDecimals={false}/>
                            <Tooltip {...lightTooltip} formatter={v=>[v,'libri']}/>
                            <Bar dataKey="count" fill={GREEN}>
                              {(data.read_per_year||[]).map((_,i) => <Cell key={i} fill={i===data.read_per_year.length-1?TERRA:GREEN}/>)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <Empty msg="Aggiungi date di fine lettura per vedere il grafico"/>}
                  </Card>

                  <Card kicker="Distribuzione voti">
                    {(data.rating_distribution||[]).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                        {[5,4,3,2,1].map(star => {
                          const entry = (data.rating_distribution||[]).find(r => r.rating === star);
                          const cnt   = entry?.count || 0;
                          const max   = Math.max(...(data.rating_distribution||[]).map(r=>r.count), 1);
                          return (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ minWidth: 50, fontSize: 13, color: GOLD, letterSpacing: -1 }}>{'★'.repeat(star)}</div>
                              <div style={{ flex: 1, height: 8, background: 'var(--m-rule)' }}>
                                <div style={{ height: 8, width: `${(cnt/max)*100}%`, background: GOLD, transition: 'width 600ms' }}/>
                              </div>
                              <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--m-ink-muted)', minWidth: 20, textAlign: 'right' }}>{cnt}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <Empty msg="Nessuna valutazione registrata"/>}
                  </Card>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Card kicker="Tempi di lettura">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                      {data.avg_reading_duration != null ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: 13, color: 'var(--m-ink-muted)' }}>Durata media</span>
                          <span style={{ fontSize: 26, fontFamily: "'EB Garamond', serif" }}>{Math.round(data.avg_reading_duration)} giorni</span>
                        </div>
                      ) : null}
                      {data.longest_read && (
                        <div style={{ paddingTop: 10, borderTop: '1px solid var(--m-rule)' }}>
                          <div style={{ fontSize: 11, color: 'var(--m-ink-muted)', marginBottom: 3 }}>Lettura più lunga</div>
                          <div style={{ fontSize: 13, fontFamily: "'EB Garamond', serif", lineHeight: 1.3 }}>{data.longest_read.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--m-ink-muted)', marginTop: 2 }}>{data.longest_read.days} giorni</div>
                        </div>
                      )}
                      {data.fastest_read && (
                        <div style={{ paddingTop: 10, borderTop: '1px solid var(--m-rule)' }}>
                          <div style={{ fontSize: 11, color: 'var(--m-ink-muted)', marginBottom: 3 }}>Lettura più rapida</div>
                          <div style={{ fontSize: 13, fontFamily: "'EB Garamond', serif", lineHeight: 1.3 }}>{data.fastest_read.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--m-ink-muted)', marginTop: 2 }}>
                            {data.fastest_read.days === 0 ? 'In giornata' : `${data.fastest_read.days} giorni`}
                          </div>
                        </div>
                      )}
                      {!data.avg_reading_duration && !data.longest_read && !data.fastest_read && (
                        <Empty msg="Aggiungi date di inizio/fine lettura per vedere le statistiche"/>
                      )}
                    </div>
                  </Card>

                  <Card kicker="Ultimi 5 stelle">
                    {(data.top_rated_books||[]).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 4 }}>
                        {(data.top_rated_books||[]).map((b,i) => (
                          <div key={i} style={{ padding: '8px 0', borderBottom: i < data.top_rated_books.length-1 ? '1px solid var(--m-rule)' : 'none' }}>
                            <div style={{ fontSize: 13, fontFamily: "'EB Garamond', serif", lineHeight: 1.3 }}>{b.title}</div>
                            {b.author_names && <div style={{ fontSize: 11, color: 'var(--m-ink-muted)', marginTop: 1 }}>{b.author_names}</div>}
                          </div>
                        ))}
                      </div>
                    ) : <Empty msg="Nessun libro con voto massimo nel registro"/>}
                  </Card>
                </div>
              </div>
            )}

            {/* ══════════════════ TAB: PERSONE ══════════════════ */}
            {tab === 'persone' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <SecRule label="Autori"/>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                  <Kpi kicker="In collezione"   value={n(data.total_authors_count)} sub="autori con almeno un volume"/>
                  <Kpi kicker="Nel catalogo"    value={n(data.total_authors_db)} sub="totale nel database"/>
                  <Kpi kicker="Seguiti"         value={n(data.followed_authors)}/>
                  <Kpi kicker="Editori distinti" value={n(data.total_publishers_count)}/>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Card kicker="Top autori per volumi posseduti">
                    {(data.top_authors||[]).length > 0
                      ? data.top_authors.map((a,i) => <HBar key={a.name} label={a.name} value={a.count} max={data.top_authors[0]?.count||1} color={i===0?TERRA:GOLD}/>)
                      : <Empty/>}
                  </Card>
                  <Card kicker="Autori per nazionalità">
                    {(data.authors_by_nationality||[]).length > 0
                      ? data.authors_by_nationality.map((a,i) => <HBar key={a.nationality} label={a.nationality} value={a.count} max={data.authors_by_nationality[0]?.count||1} color={PALETTE[i%PALETTE.length]}/>)
                      : <Empty msg="Aggiungi la nazionalità nelle schede autore"/>}
                  </Card>
                </div>

                <Card kicker="Collaboratori per ruolo">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 4 }}>
                    {(data.authors_by_role||[]).map(r => (
                      <div key={r.role} style={{ textAlign: 'center', padding: '12px 8px', border: '1px solid var(--m-rule)' }}>
                        <div style={{ fontSize: 11, color: 'var(--m-ink-muted)', marginBottom: 4 }}>{ROLE_LABEL[r.role]||r.role}</div>
                        <div style={{ fontSize: 32, fontFamily: "'EB Garamond', serif", lineHeight: 1 }}>{r.count}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <SecRule label="Editori"/>

                <Card kicker="Top editori per volumi posseduti">
                  {(data.top_publishers||[]).length > 0
                    ? data.top_publishers.map((p,i) => <HBar key={p.publisher} label={p.publisher} value={p.count} max={data.top_publishers[0]?.count||1} color={i===0?TERRA:SLATE}/>)
                    : <Empty/>}
                </Card>
              </div>
            )}

            {/* ══════════════════ TAB: SCAFFALI ══════════════════ */}
            {tab === 'scaffali' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                  <Kpi kicker="Scaffali totali"          value={n(data.shelf_count)}/>
                  <Kpi kicker="Totale assegnazioni"      value={n(data.total_shelf_assoc)} sub="libro → scaffale"/>
                  <Kpi kicker="Media per scaffale"       value={n(data.avg_books_per_shelf)} sub="volumi"/>
                  <Kpi kicker="Senza scaffale"           value={n(data.books_in_no_shelf)} sub="volumi non categorizzati"/>
                </div>

                {(data.shelf_stats||[]).length > 0 ? (
                  <Card kicker="Scaffali per numero di volumi">
                    <div style={{ marginTop: 4 }}>
                      {data.shelf_stats.map((s,i) => (
                        <HBar key={s.name+i} label={s.name} value={s.book_count} max={data.shelf_stats[0]?.book_count||1} color={PALETTE[i%PALETTE.length]}/>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <Card><Empty msg="Nessuno scaffale creato — vai alla sezione Scaffali"/></Card>
                )}
              </div>
            )}

            {/* ══════════════════ TAB: DESIDERATA & NOTE ══════════════════ */}
            {tab === 'extra' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <SecRule label="Desiderata"/>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                  <Kpi kicker="Libri desiderati"  value={n(data.wishlist_table_count)}/>
                  <Kpi kicker="Già acquisiti"     value={n(data.wishlist_acquired)} sub="dalla lista desideri"/>
                  <Kpi kicker="Valore stimato"
                    value={n(data.wishlist_estimated_value) > 0 ? `€ ${fmt(Math.round(n(data.wishlist_estimated_value)))}` : '–'}
                    sub="totale lista attiva"/>
                  <Card kicker="Per priorità">
                    {(data.wishlist_by_priority||[]).length > 0
                      ? data.wishlist_by_priority.map((p,i) => (
                          <HBar key={p.priority} label={PRIORITY_LABEL[p.priority]||p.priority} value={p.count} max={data.wishlist_by_priority[0]?.count||1} color={PRIORITY_COLOR[p.priority]||GOLD}/>
                        ))
                      : <Empty/>}
                  </Card>
                </div>

                <SecRule label="Note"/>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  <Kpi kicker="Note totali"    value={n(data.total_notes)}/>
                  <Kpi kicker="Con etichette"  value={n(data.notes_with_tags)}/>
                  <Card kicker="Per tipo">
                    {(data.notes_by_type||[]).length > 0
                      ? data.notes_by_type.map((t,i) => (
                          <HBar key={t.note_type} label={NOTE_LABEL[t.note_type]||t.note_type} value={t.count} max={data.notes_by_type[0]?.count||1} color={PALETTE[i%PALETTE.length]}/>
                        ))
                      : <Empty/>}
                  </Card>
                </div>

                {(data.notes_per_book||[]).length > 0 && (
                  <Card kicker="Libri più annotati">
                    {data.notes_per_book.map((b,i) => (
                      <HBar key={b.title+i} label={b.title} value={b.note_count} max={data.notes_per_book[0]?.note_count||1} color={GOLD}/>
                    ))}
                  </Card>
                )}

                <SecRule label="Prestiti"/>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                  <Kpi kicker="Prestiti totali"   value={n(data.total_loans)}/>
                  <Kpi kicker="Attivi ora"         value={n(data.active_loans)}/>
                  <Kpi kicker="In scadenza"        value={n(data.overdue_loans)} valueColor={n(data.overdue_loans) > 0 ? TERRA : undefined}/>
                  <Kpi kicker="Durata media"       value={data.avg_loan_days ? `${Math.round(data.avg_loan_days)} gg` : '–'}/>
                </div>

                {(data.top_borrowers||[]).length > 0 && (
                  <Card kicker="Chi prende più in prestito">
                    {data.top_borrowers.map((b,i) => (
                      <HBar key={b.borrower_name} label={b.borrower_name} value={b.count} max={data.top_borrowers[0]?.count||1} color={PALETTE[i%PALETTE.length]}/>
                    ))}
                  </Card>
                )}
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}
