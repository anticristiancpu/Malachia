import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { stats } from '../api/index.js';

const TABS = [
  { label: 'Studio',     path: '/',           end: true },
  {
    label: 'Libreria',   path: '/libreria',
    dropdown: [
      { label: 'Autori',  path: '/autori' },
      { label: 'Editori', path: '/editori' },
    ],
  },
  { label: 'Scaffali',   path: '/scaffali' },
  { label: 'Desiderata', path: '/desiderata' },
  { label: 'Note',       path: '/note' },
  {
    label: 'Annales',    path: '/annales',
    dropdown: [
      { label: 'Grafo',  path: '/grafo' },
    ],
  },
];

function BookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="1" width="10" height="13" stroke="currentColor" strokeWidth="1"/>
      <line x1="3" y1="4" x2="8" y2="4" stroke="currentColor" strokeWidth="0.9"/>
      <line x1="3" y1="7" x2="8" y2="7" stroke="currentColor" strokeWidth="0.9"/>
      <line x1="3" y1="10" x2="6" y2="10" stroke="currentColor" strokeWidth="0.9"/>
      <rect x="11" y="8" width="3" height="6" stroke="currentColor" strokeWidth="0.8"/>
    </svg>
  );
}

function EuroIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1"/>
      <text x="7.5" y="11" textAnchor="middle" fontSize="7" fill="currentColor"
            fontFamily="'Cinzel','Mantinia',serif">€</text>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M11.2 4.8l1.4-1.4M3.4 12.6l1.4-1.4"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function CaretIcon() {
  return (
    <svg width="8" height="6" viewBox="0 0 8 6" fill="none" className="cine-tab-caret">
      <path d="M1 1 L4 4.5 L7 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function DiamondMarker() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" className="cine-tab-marker">
      <path d="M5,1 L9,5 L5,9 L1,5 Z" fill="currentColor" opacity="0.95"/>
    </svg>
  );
}

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [totalBooks, setTotalBooks] = useState(null);
  const [totalValue, setTotalValue] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const closeTimerRef = useRef(null);

  const fetchStats = useCallback(() => {
    stats.get().then(s => {
      setTotalBooks(s.total_books ?? null);
      setTotalValue(s.total_market_value ?? null);
    }).catch(() => {});
  }, []);

  /* Refetch ad ogni cambio di route */
  useEffect(() => { fetchStats(); }, [location.pathname, fetchStats]);

  /* Refetch immediato ad ogni operazione sui libri (add/edit/delete/value) */
  useEffect(() => {
    window.addEventListener('malachia:stats-changed', fetchStats);
    return () => window.removeEventListener('malachia:stats-changed', fetchStats);
  }, [fetchStats]);

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

  const isSubOf = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const isLibreriaSub = isSubOf('/autori') || isSubOf('/editori');
  const isAnnalesSub  = isSubOf('/grafo');

  const isTabActive = (tab) => {
    if (tab.end) return location.pathname === tab.path;
    if (tab.path === '/libreria') return isSubOf(tab.path) || isLibreriaSub;
    if (tab.path === '/annales')  return isSubOf(tab.path) || isAnnalesSub;
    if (tab.dropdown) return isSubOf(tab.path);
    return isSubOf(tab.path);
  };

  const isDropdownItemActive = (item) => isSubOf(item.path);

  return (
    <header className="cine-topbar">
      <nav className="cine-tabs">
        {TABS.map((tab) => {
          const active = isTabActive(tab);
          return (
            <div
              key={tab.path}
              className="cine-tab-wrapper"
              onMouseEnter={() => {
                if (tab.dropdown) {
                  if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
                  setOpenDropdown(tab.path);
                }
              }}
              onMouseLeave={() => {
                if (tab.dropdown) {
                  closeTimerRef.current = setTimeout(() => setOpenDropdown(null), 200);
                }
              }}
            >
              {active && <DiamondMarker />}
              <button
                className={`cine-tab${active ? ' active' : ''}`}
                onClick={() => navigate(tab.path)}
              >
                {tab.label}
                {tab.dropdown && <CaretIcon />}
              </button>

              {tab.dropdown && openDropdown === tab.path && (
                <div
                  className="cine-dropdown"
                  onMouseEnter={() => {
                    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
                  }}
                  onMouseLeave={() => {
                    closeTimerRef.current = setTimeout(() => setOpenDropdown(null), 200);
                  }}
                >
                  {tab.dropdown.map((item) => (
                    <button
                      key={item.path}
                      className={`cine-dropdown-item${isDropdownItemActive(item) ? ' active' : ''}`}
                      onClick={() => { navigate(item.path); setOpenDropdown(null); }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="cine-topbar-right">
        <div className="cine-counter" title="Volumi in collezione">
          <BookIcon />
          <span className="cine-counter-num">{totalBooks ?? '—'}</span>
        </div>
        <div className="cine-counter" title="Valore stimato">
          <EuroIcon />
          <span className="cine-counter-num">
            {totalValue != null
              ? totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '—'}
          </span>
        </div>

        <div className="cine-topbar-sep" />

        <button className="cine-action-btn" title="Cerca" onClick={() => navigate('/cerca')}>
          <SearchIcon />
        </button>
        <button
          className="cine-action-btn cine-action-btn--primary"
          title="Aggiungi libro"
          onClick={() => navigate('/aggiungi')}
        >
          <PlusIcon />
        </button>
        <button className="cine-action-btn" title="Impostazioni" onClick={() => navigate('/impostazioni')}>
          <GearIcon />
        </button>
      </div>
    </header>
  );
}
