import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ORN } from './ORN.jsx';
import { loans } from '../api/index.js';

const NAV_ITEMS = [
  { path: '/',           label: 'Studio',   icon: '⌂' },
  { path: '/libreria',   label: 'Libreria', icon: '⊞' },
  { path: '/autori',     label: 'Autori',   icon: '✦', end: true },
  { path: '/editori',    label: 'Editori',  icon: '⊕', end: true },
  { path: '/scaffali',   label: 'Scaffali',   icon: '⊟' },
  { path: '/desiderata', label: 'Desiderata', icon: '♡' },
  { path: '/note',       label: 'Note',       icon: '✎' },
  // { path: '/mappa',   label: 'Mappa',    icon: '⊡' },   // in arrivo
  { path: '/grafo',      label: 'Grafo',      icon: '◎' },
  { path: '/annales',    label: 'Annales',  icon: '◈' },
  // { path: '/cerca',   label: 'Ricerca',  icon: '⌕' },   // in arrivo
  { path: '/impostazioni', label: 'Impostazioni', icon: '⚙' },
];

export default function Sidebar({ collapsed, onToggle, darkMode, onToggleDark }) {
  const navigate = useNavigate();
  const [overdueCount, setOverdueCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    loans.overdue().then(r => setOverdueCount(r.length)).catch(() => {});
  }, []);

  // Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/cerca');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  if (collapsed) {
    return (
      <aside className="m-sidebar" style={{
        padding: '14px 8px', alignItems: 'center', width: 56,
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {/* Logo / toggle */}
        <div
          title="Espandi sidebar"
          style={{
            width: 36, height: 36, background: 'var(--m-ink)', color: 'var(--m-gold-pale)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'UnifrakturCook', serif", fontSize: 28, cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={onToggle}
        >M</div>

        {/* Nuovo libro */}
        <NavLink
          to="/aggiungi"
          title="Nuovo libro"
          end
          className={({ isActive }) => `m-nav-item${isActive ? ' active' : ''}`}
          style={{
            marginTop: 10, marginBottom: 6,
            padding: '6px', justifyContent: 'center', fontSize: 17,
            width: 36, height: 36,
            border: '1px solid var(--m-rule)',
            color: 'var(--m-terracotta)',
            fontWeight: 600,
          }}
        >+</NavLink>

        <div style={{ width: '80%', height: 1, background: 'var(--m-rule)', margin: '4px 0 6px' }}/>

        {/* Nav items — tutti incluso Impostazioni */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path}
              title={item.path === '/libreria' && overdueCount > 0
                ? `${item.label} · ${overdueCount} prestiti in scadenza`
                : item.label}
              end={item.path === '/' || !!item.end}
              className={({ isActive }) => `m-nav-item${isActive ? ' active' : ''}`}
              style={{ padding: '7px', justifyContent: 'center', fontSize: 17 }}
            >
              {item.icon}
            </NavLink>
          ))}
        </div>

        {/* Dark mode */}
        <button
          onClick={onToggleDark}
          title={darkMode ? 'Modalità giorno' : 'Modalità notte'}
          style={{
            marginTop: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--m-ink-muted)', fontSize: 17, padding: '8px',
            transition: 'color 150ms',
          }}
        >{darkMode ? '☀' : '☾'}</button>
      </aside>
    );
  }

  return (
    <aside className="m-sidebar">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34,
          background: 'var(--m-ink)',
          color: 'var(--m-gold-pale)',
          fontFamily: "'UnifrakturCook', serif",
          fontSize: 30, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }} onClick={onToggle}>M</div>
        <div>
          <div className="m-serif" style={{ fontSize: 22, lineHeight: 1, fontWeight: 500, color: 'var(--m-ink)' }}>Malachia</div>
          <div className="m-eyebrow" style={{ fontSize: 9 }}>bibliotheca privata</div>
        </div>
      </div>

      {/* Aggiungi libro */}
      <button
        className="m-btn"
        style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
        onClick={() => navigate('/aggiungi')}
      >
        + nuovo libro
      </button>

      {/* Ricerca rapida */}
      <button
        className="m-btn m-btn-ghost"
        style={{ width: '100%', justifyContent: 'space-between', fontSize: 13 }}
        onClick={() => navigate('/cerca')}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ORN.quill size={13} style={{ color: 'var(--m-ink-muted)' }}/> cerca…
        </span>
        <span className="m-mono" style={{ fontSize: 10, color: 'var(--m-ink-muted)' }}>⌘K</span>
      </button>

      {/* Navigazione */}
      <div>
        <div className="m-eyebrow" style={{ marginBottom: 8 }}>Sezioni</div>
        {NAV_ITEMS.slice(0, 9).map(item => (
          <NavLink key={item.path} to={item.path} end={item.path === '/' || !!item.end}
            className={({ isActive }) => `m-nav-item${isActive ? ' active' : ''}`}
          >
            <ORN.diamond size={6} style={{ color: 'var(--m-rule-strong)', flexShrink: 0 }}/>
            {item.label}
            {item.path === '/libreria' && overdueCount > 0 && (
              <span className="m-overdue-badge" style={{ marginLeft: 'auto', fontSize: 10 }}>{overdueCount}</span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer: dark mode + impostazioni */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavLink to="/impostazioni"
          className={({ isActive }) => `m-nav-item${isActive ? ' active' : ''}`}
          style={{ fontSize: 13, flex: 1 }}
        >
          <ORN.diamond size={6} style={{ color: 'var(--m-rule-strong)' }}/> Impostazioni
        </NavLink>
        <button
          onClick={onToggleDark}
          title={darkMode ? 'Modalità giorno' : 'Modalità notte'}
          style={{
            background: 'none', border: '1px solid var(--m-rule)',
            cursor: 'pointer', color: 'var(--m-ink-muted)',
            fontSize: 16, width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--m-ink)'; e.currentTarget.style.borderColor = 'var(--m-rule-strong)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--m-ink-muted)'; e.currentTarget.style.borderColor = 'var(--m-rule)'; }}
        >{darkMode ? '☀' : '☾'}</button>
      </div>
    </aside>
  );
}
