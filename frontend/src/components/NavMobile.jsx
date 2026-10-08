import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/* La navigazione per telefono. Sul desktop questo file non viene mai
   disegnato: CinematicShell e TopBar lo usano solo sotto la soglia mobile.

   In basso le quattro sezioni di tutti i giorni più "Altro", a portata di
   pollice; in alto una barra corta con il conteggio, la ricerca e il "+".  */

const tratto = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

const Icona = {
  studio: (
    <svg viewBox="0 0 24 24" width="22" height="22" {...tratto}>
      <path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>
    </svg>
  ),
  libreria: (
    <svg viewBox="0 0 24 24" width="22" height="22" {...tratto}>
      <rect x="4" y="4" width="4" height="16"/><rect x="10" y="4" width="4" height="16"/>
      <path d="m16 5 3.6-.9 2.6 15.4-3.6.9z"/>
    </svg>
  ),
  scaffali: (
    <svg viewBox="0 0 24 24" width="22" height="22" {...tratto}>
      <path d="M3 8h18M3 16h18M4 4v16M20 4v16"/>
      <path d="M7 8V5M9 8V6M13 16v-4M15.5 16v-3"/>
    </svg>
  ),
  ebook: (
    <svg viewBox="0 0 24 24" width="22" height="22" {...tratto}>
      <rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h6M9 11h6M9 15h3"/>
    </svg>
  ),
  altro: (
    <svg viewBox="0 0 24 24" width="22" height="22" {...tratto}>
      <circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>
    </svg>
  ),
  cerca: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...tratto}>
      <circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>
    </svg>
  ),
  piu: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...tratto}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  libro: (
    <svg viewBox="0 0 24 24" width="16" height="16" {...tratto}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M4 20.5V5.5"/>
    </svg>
  ),
};

const PRINCIPALI = [
  { chiave: 'studio',   etichetta: 'Studio',   percorso: '/',         esatto: true },
  { chiave: 'libreria', etichetta: 'Libreria', percorso: '/libreria', anche: ['/libro'] },
  { chiave: 'scaffali', etichetta: 'Scaffali', percorso: '/scaffali' },
  { chiave: 'ebook',    etichetta: 'Ebook',    percorso: '/ebook' },
];

const ALTRE = [
  { etichetta: 'Autori',        percorso: '/autori' },
  { etichetta: 'Editori',       percorso: '/editori' },
  { etichetta: 'Desiderata',    percorso: '/desiderata' },
  { etichetta: 'Note',          percorso: '/note' },
  { etichetta: 'Annales',       percorso: '/annales' },
  { etichetta: 'Grafo',         percorso: '/grafo' },
  { etichetta: 'Impostazioni',  percorso: '/impostazioni' },
];

function dentro(pathname, percorso, esatto) {
  if (esatto) return pathname === percorso;
  return pathname === percorso || pathname.startsWith(percorso + '/');
}

/* ── la barra in alto, corta ─────────────────────────────────────────────── */
export function BarraAltaMobile({ totale, fisici }) {
  const navigate = useNavigate();
  return (
    <header className="cine-topbar cine-topbar--mobile">
      <button className="nav-mob-marchio" onClick={() => navigate('/')} aria-label="Studio">
        Malachia
      </button>

      <div className="nav-mob-conteggio"
        title={fisici != null ? `${totale} in tutto, ${fisici} di carta` : 'Volumi in collezione'}>
        {Icona.libro}
        <span>{totale ?? '—'}</span>
        {fisici != null && fisici !== totale && <span className="nav-mob-fisici">/ {fisici}</span>}
      </div>

      <button className="nav-mob-azione" aria-label="Cerca" onClick={() => navigate('/cerca')}>
        {Icona.cerca}
      </button>
      <button className="nav-mob-azione nav-mob-azione--primaria" aria-label="Aggiungi libro"
        onClick={() => navigate('/aggiungi')}>
        {Icona.piu}
      </button>
    </header>
  );
}

/* ── la barra in basso ───────────────────────────────────────────────────── */
export default function NavMobile() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [aperto, setAperto] = useState(false);

  // cambiando pagina il pannello si chiude da solo
  useEffect(() => { setAperto(false); }, [pathname]);

  const attivaPrincipale = (v) =>
    dentro(pathname, v.percorso, v.esatto) || (v.anche || []).some(p => dentro(pathname, p));
  const inAltre = ALTRE.some(v => dentro(pathname, v.percorso));

  const vai = (percorso) => { setAperto(false); navigate(percorso); };

  return (
    <>
      {aperto && (
        <div className="nav-mob-velo" onClick={() => setAperto(false)}>
          <div className="nav-mob-pannello" onClick={e => e.stopPropagation()} role="dialog" aria-label="Altre sezioni">
            <div className="nav-mob-maniglia" aria-hidden="true"/>
            {ALTRE.map(v => (
              <button key={v.percorso}
                className={'nav-mob-voce' + (dentro(pathname, v.percorso) ? ' attiva' : '')}
                onClick={() => vai(v.percorso)}>
                {v.etichetta}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="nav-mob" aria-label="Sezioni">
        {PRINCIPALI.map(v => (
          <button key={v.chiave}
            className={'nav-mob-tasto' + (attivaPrincipale(v) ? ' attivo' : '')}
            onClick={() => vai(v.percorso)}
            aria-current={attivaPrincipale(v) ? 'page' : undefined}>
            {Icona[v.chiave]}
            <span>{v.etichetta}</span>
          </button>
        ))}
        <button
          className={'nav-mob-tasto' + (aperto || inAltre ? ' attivo' : '')}
          onClick={() => setAperto(a => !a)}
          aria-expanded={aperto}>
          {Icona.altro}
          <span>Altro</span>
        </button>
      </nav>
    </>
  );
}
