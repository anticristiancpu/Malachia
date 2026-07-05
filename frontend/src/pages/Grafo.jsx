import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authors as authorsApi } from '../api/index.js';

export default function Grafo() {
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const [authorsData, setAuthorsData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authorsApi.list({ limit: 50 }).then(r => {
      setAuthorsData(r.authors || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Layout a forza simulata semplificata
  const nodes = authorsData.slice(0, 30).map((a, i) => {
    const angle = (i / Math.min(30, authorsData.length)) * 2 * Math.PI;
    const radius = i === 0 ? 0 : 180 + (i % 3) * 60;
    return {
      ...a,
      x: 480 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius,
      r: Math.min(40, Math.max(16, (a.book_count || 1) * 6)),
    };
  });

  // Archi simulati (primo nodo collegato agli altri)
  const edges = nodes.length > 1 ? nodes.slice(1, 8).map(n => [nodes[0].id, n.id]) : [];
  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
  const selectedNode = selected ? nodes.find(n => n.id === selected) : null;

  return (
    <div style={{ padding: '24px 36px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div className="m-eyebrow">Capitulum VII · Costellazione</div>
          <div className="m-serif" style={{ fontSize: 38, fontWeight: 500, lineHeight: 1.05, marginTop: 2 }}>
            Grafo della <em style={{ color: 'var(--m-terracotta)' }}>collezione</em>
          </div>
          <div className="m-marginalia" style={{ marginTop: 4 }}>la costellazione degli autori nel catalogo — dimensione proporzionale ai volumi posseduti.</div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="m-spinner"/></div>
        ) : authorsData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="m-serif" style={{ fontSize: 24, fontStyle: 'italic', color: 'var(--m-ink-muted)' }}>Nessun autore nel catalogo.</div>
          </div>
        ) : (
          <div style={{ position: 'relative', border: '1px solid var(--m-rule)', background: 'rgba(255,255,255,0.18)', overflow: 'hidden', flex: 1 }}>
            <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 960 600" style={{ display: 'block' }}>
              <defs>
                <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.7" fill="rgba(58,42,26,0.18)"/>
                </pattern>
              </defs>
              <rect width="960" height="600" fill="url(#dots)"/>

              {/* Archi */}
              {edges.map(([a, b], i) => {
                const A = nodeById[a], B = nodeById[b];
                if (!A || !B) return null;
                return (
                  <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                    stroke={A.id === selected || B.id === selected ? 'var(--m-terracotta)' : 'rgba(58,42,26,0.35)'}
                    strokeWidth={A.id === selected || B.id === selected ? 1.4 : 0.9}/>
                );
              })}

              {/* Nodi */}
              {nodes.map(n => (
                <g key={n.id} className="m-graph-node" onClick={() => setSelected(selected === n.id ? null : n.id)}>
                  <circle cx={n.x} cy={n.y} r={n.r}
                    fill={n.id === selected ? 'var(--m-terracotta)' : 'var(--m-ink-soft)'}
                    stroke="var(--m-gold-deep)"
                    strokeWidth={n.id === selected ? 3 : 1}/>
                  <text x={n.x} y={n.y + 5} textAnchor="middle"
                    fontFamily="'UnifrakturCook', serif"
                    fontSize={n.r * 0.6}
                    fill={n.id === selected ? 'var(--m-parchment)' : 'var(--m-gold-pale)'}>
                    {n.name[0]}
                  </text>
                  <text x={n.x} y={n.y + n.r + 16} textAnchor="middle"
                    fontFamily="'EB Garamond', serif" fontSize="13"
                    fill="var(--m-ink-soft)">
                    {n.name.split(' ').slice(-1)[0]}
                  </text>
                  <text x={n.x} y={n.y + n.r + 30} textAnchor="middle"
                    fontFamily="'JetBrains Mono', monospace" fontSize="10"
                    fill="var(--m-ink-muted)">
                    {n.book_count || 0} vol.
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {selectedNode ? (
          <>
            <div>
              <div className="m-eyebrow">Nodo selezionato</div>
              <div className="m-serif" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.05, marginTop: 2 }}>{selectedNode.name}</div>
              {selectedNode.nationality && <div className="m-marginalia">{selectedNode.nationality}</div>}
            </div>
            <div>
              <div className="m-eyebrow" style={{ marginBottom: 8 }}>{selectedNode.book_count || 0} volumi in collezione</div>
              <button className="m-btn m-btn-ghost m-btn-sm" onClick={() => navigate(`/libreria?author_id=${selectedNode.id}`)}>
                Vedi tutti i libri ›
              </button>
            </div>
            {selectedNode.biography && (
              <div>
                <div className="m-eyebrow" style={{ marginBottom: 6 }}>Biografia</div>
                <p className="m-body" style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--m-ink-soft)' }}>
                  {selectedNode.biography.slice(0, 300)}{selectedNode.biography.length > 300 ? '…' : ''}
                </p>
              </div>
            )}
          </>
        ) : (
          <div>
            <div className="m-eyebrow" style={{ marginBottom: 8 }}>Costellazione della collezione</div>
            <div className="m-marginalia" style={{ lineHeight: 1.6 }}>
              Clicca su un nodo per vedere i volumi di quell'autore nella tua biblioteca.
              <br/><br/>
              Ogni cerchio rappresenta un autore; la dimensione è proporzionale al numero di volumi <em>posseduti</em>.
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
