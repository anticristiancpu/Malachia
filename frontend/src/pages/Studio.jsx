import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { stats, books as booksApi } from '../api/index.js';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
dayjs.locale('it');

/* Kept for business logic — data is used by Annales/TopBar,
   fetching here keeps the cache warm without disrupting existing API contract. */
function useStudioData() {
  const [data, setData] = useState(null);
  const [reading, setReading] = useState([]);
  useEffect(() => {
    Promise.all([
      stats.get(),
      booksApi.list({ status: 'reading', limit: 10, sort: 'updated_at', dir: 'desc' }),
    ])
      .then(([s, booksRes]) => {
        setData(s);
        setReading(booksRes?.books || []);
      })
      .catch(() => {});
  }, []);
  return { data, reading };
}

/* 18 ember particles — deterministic positions/timings from index */
const EMBERS = Array.from({ length: 18 }, (_, i) => ({
  left:   8 + (i * 53) % 84,
  bottom: 4 + (i * 17) % 30,
  size:   1 + (i % 4) * 0.6,
  delay:  (i % 7) * 0.8,
  dur:    5 + (i % 5) * 1.4,
  type:   i % 2 === 0 ? 'cine-emberA' : 'cine-emberB',
}));

export default function Studio() {
  const navigate = useNavigate();

  /* Keep data warm — not displayed in Studio body, used by TopBar and Annales */
  useStudioData();

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Floating embers — colore segue var(--cine-gold) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
        {EMBERS.map((e, i) => (
          <span key={i} style={{
            position: 'absolute',
            left: e.left + '%',
            bottom: e.bottom + '%',
            width: e.size,
            height: e.size,
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--cine-gold) 85%, transparent)',
            boxShadow: '0 0 6px color-mix(in srgb, var(--cine-gold) 70%, transparent)',
            animation: `${e.type} ${e.dur}s ease-out ${e.delay}s infinite`,
          }}/>
        ))}
      </div>

      {/* Title block: sigil behind + MALACHIA on top — centred at 42% */}
      <div style={{
        position: 'absolute',
        top: '42%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Sigil emblem SVG — tutti i colori seguono var(--cine-gold) */}
        <svg
          width="720" height="720" viewBox="0 0 720 720"
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            pointerEvents: 'none',
            animation: 'cine-sigilPulse 6s ease-in-out infinite',
          }}
        >
          <defs>
            <radialGradient id="sigilCenterGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0"    style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0.50 }}/>
              <stop offset="0.18" style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0.18 }}/>
              <stop offset="0.45" style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0.06 }}/>
              <stop offset="1"    style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0 }}/>
            </radialGradient>
            <linearGradient id="sigilVertical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0"    style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0 }}/>
              <stop offset="0.15" style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0.45 }}/>
              <stop offset="0.5"  style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0.85 }}/>
              <stop offset="0.85" style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0.45 }}/>
              <stop offset="1"    style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0 }}/>
            </linearGradient>
            <linearGradient id="sigilHorizontal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0"    style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0 }}/>
              <stop offset="0.25" style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0.25 }}/>
              <stop offset="0.5"  style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0.50 }}/>
              <stop offset="0.75" style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0.25 }}/>
              <stop offset="1"    style={{ stopColor: 'var(--cine-gold)', stopOpacity: 0 }}/>
            </linearGradient>
          </defs>

          <circle cx="360" cy="360" r="320" fill="url(#sigilCenterGlow)"/>
          <path d="M 360 80 A 280 280 0 1 1 360 640 A 280 280 0 1 1 360 80"
                fill="none"
                style={{ stroke: 'color-mix(in srgb, var(--cine-gold) 32%, transparent)' }}
                strokeWidth="1"/>
          <path d="M 360 120 A 240 240 0 1 1 360 600 A 240 240 0 1 1 360 120"
                fill="none"
                style={{ stroke: 'color-mix(in srgb, var(--cine-gold) 18%, transparent)' }}
                strokeWidth="0.6"/>
          <circle cx="360" cy="360" r="195"
                  fill="none"
                  style={{ stroke: 'color-mix(in srgb, var(--cine-gold) 12%, transparent)' }}
                  strokeWidth="0.4"/>
          <line x1="360" y1="20" x2="360" y2="700"
                stroke="url(#sigilVertical)" strokeWidth="1.1"/>
          <line x1="80" y1="360" x2="640" y2="360"
                stroke="url(#sigilHorizontal)" strokeWidth="0.6"/>
          <g style={{ stroke: 'color-mix(in srgb, var(--cine-gold) 45%, transparent)' }}
             strokeWidth="0.5" fill="none">
            <path d="M 354 100 L 360 80 L 366 100"/>
            <path d="M 354 620 L 360 640 L 366 620"/>
          </g>
          <g style={{ fill: 'color-mix(in srgb, var(--cine-gold) 85%, transparent)' }}>
            <path d="M 360 70 L 364 80 L 360 90 L 356 80 Z"/>
            <path d="M 360 630 L 364 640 L 360 650 L 356 640 Z"/>
            <circle cx="360" cy="360" r="3"/>
          </g>
          <g style={{ fill: 'color-mix(in srgb, var(--cine-gold) 90%, transparent)' }}>
            <circle cx="360" cy="492" r="2"/>
            <circle cx="360" cy="640" r="3"/>
          </g>
          <g style={{ stroke: 'color-mix(in srgb, var(--cine-gold) 13%, transparent)' }}
             strokeWidth="0.4" fill="none">
            <path d="M 360 360 L 480 250"/>
            <path d="M 360 360 L 240 250"/>
            <path d="M 360 360 L 500 460"/>
            <path d="M 360 360 L 220 470"/>
            <path d="M 360 360 L 420 200"/>
            <path d="M 360 360 L 300 200"/>
          </g>
        </svg>

        {/* MALACHIA title */}
        <h1 style={{
          position: 'relative',
          zIndex: 2,
          margin: 0,
          fontFamily: "'Cinzel', 'Mantinia', 'Cormorant Garamond', serif",
          fontSize: 148,
          fontWeight: 400,
          letterSpacing: '0.08em',
          lineHeight: 1,
          color: '#e8dcc0',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          paddingLeft: '0.08em',
          animation: 'cine-titleGlow 5s ease-in-out infinite',
        }}>
          Malachia
        </h1>
      </div>

      {/* "Entra nello scriptorium" prompt */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate('/libreria')}
        onKeyDown={e => e.key === 'Enter' && navigate('/libreria')}
        style={{
          position: 'absolute',
          bottom: 88,
          left: 0, right: 0,
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontFamily: "'Cinzel', 'Mantinia', serif",
          fontSize: 14,
          letterSpacing: '0.38em',
          color: '#e8dcc0',
          textTransform: 'uppercase',
          animation: 'cine-breath 2.6s ease-in-out infinite',
          textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 18px color-mix(in srgb, var(--cine-gold) 25%, transparent)',
          userSelect: 'none',
        }}>
          Entra nello scriptorium
        </span>
        <div style={{
          width: 280,
          height: 6,
          background: 'radial-gradient(ellipse 140px 6px at 50% 0%, color-mix(in srgb, var(--cine-gold) 55%, transparent) 0%, color-mix(in srgb, var(--cine-gold) 15%, transparent) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}/>
      </div>

      {/* Credits */}
      <div style={{
        position: 'absolute',
        bottom: 18,
        left: 0, right: 0,
        zIndex: 5,
        textAlign: 'center',
        fontFamily: "'Cinzel', 'Mantinia', serif",
        fontSize: 10,
        letterSpacing: '0.26em',
        color: 'color-mix(in srgb, var(--cine-gold) 45%, transparent)',
        textTransform: 'uppercase',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        Malachia™ &nbsp;·&nbsp; Bibliotheca Secreta &nbsp;·&nbsp; MMXXVI
      </div>
    </div>
  );
}
