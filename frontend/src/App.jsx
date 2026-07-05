import React, { useState, useEffect, useRef, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CinematicShell from './components/CinematicShell.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { AppContext } from './AppContext.jsx';
import { settings } from './api/index.js';
import { applyGold, applyVermilion, applyOverlay } from './utils/theme.js';

import Studio            from './pages/Studio.jsx';
import Libreria          from './pages/Libreria.jsx';
import DettaglioLibro    from './pages/DettaglioLibro.jsx';
import Note              from './pages/Note.jsx';
import Scaffali          from './pages/Scaffali.jsx';
import DettaglioScaffale from './pages/DettaglioScaffale.jsx';
import Mappa             from './pages/Mappa.jsx';
import Grafo             from './pages/Grafo.jsx';
import Wishlist          from './pages/Wishlist.jsx';
import Annales           from './pages/Annales.jsx';
import Ricerca           from './pages/Ricerca.jsx';
import AggiungiLibro     from './pages/AggiungiLibro.jsx';
import Autori            from './pages/Autori.jsx';
import DettaglioAutore   from './pages/DettaglioAutore.jsx';
import Editori           from './pages/Editori.jsx';
import Impostazioni      from './pages/Impostazioni.jsx';
import CollezioneTolkien from './pages/CollezioneTolkien.jsx';
import Desiderata        from './pages/Desiderata.jsx';

/* ── Motore slideshow ────────────────────────────────────────────────── */
function SlideshowEngine() {
  const { setBgImageUrl, slideshowPresets, activeSlideshowId } = useContext(AppContext);
  const location = useLocation();
  const isTolkien = location.pathname.startsWith('/collezioni/tolkien');
  const indexRef  = useRef(0);

  useEffect(() => {
    if (isTolkien || !activeSlideshowId) return;
    const preset = slideshowPresets.find(p => p.id === activeSlideshowId);
    if (!preset || preset.images.length < 1) return;

    indexRef.current = indexRef.current % preset.images.length;
    setBgImageUrl(preset.images[indexRef.current]);
    if (preset.images.length < 2) return;

    const timer = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % preset.images.length;
      setBgImageUrl(preset.images[indexRef.current]);
    }, (preset.interval || 30) * 1000);

    return () => clearInterval(timer);
  }, [activeSlideshowId, slideshowPresets, isTolkien]);

  return null;
}

/* ══ Root ════════════════════════════════════════════════════════════════ */
export default function App() {
  const [bgImageUrl,           setBgImageUrl]           = useState(null);
  const [slideshowPresets,     setSlideshowPresets]     = useState([]);
  const [activeSlideshowId,    setActiveSlideshowId]    = useState(null);
  const [themes,               setThemes]               = useState([]);
  const [activeGeneralThemeId, setActiveGeneralThemeId] = useState(null);
  const [tolkienBgUrl,         setTolkienBgUrl]         = useState(null);
  const [activeTolkienThemeId, setActiveTolkienThemeId] = useState(null);

  useEffect(() => {
    try {
      const local = localStorage.getItem('malachia_bg');
      if (local) setBgImageUrl(local);
    } catch {}

    // Tolkien bg da localStorage come fallback iniziale
    try {
      const tkj = localStorage.getItem('malachia-tolkien-cine-bg');
      if (tkj) setTolkienBgUrl(tkj);
    } catch {}

    settings.get().then(s => {
      if (s.bgImageUrl) {
        setBgImageUrl(s.bgImageUrl);
        try { localStorage.removeItem('malachia_bg'); } catch {}
      }
      if (s.tolkienBgUrl) {
        setTolkienBgUrl(s.tolkienBgUrl);
        try { localStorage.setItem('malachia-tolkien-cine-bg', s.tolkienBgUrl); } catch {}
      }
      if (s.accentGold)             applyGold(s.accentGold);
      if (s.accentVermilion)        applyVermilion(s.accentVermilion);
      if (s.overlayOpacity != null) applyOverlay(s.overlayOpacity);
      const auto = s.autoAccent === true || s.autoAccent === 'true';
      try { localStorage.setItem('malachia_autoAccent', String(auto)); } catch {}

      if (Array.isArray(s.slideshowPresets))  setSlideshowPresets(s.slideshowPresets);
      if (s.activeSlideshowId)               setActiveSlideshowId(s.activeSlideshowId);
      if (Array.isArray(s.themes))           setThemes(s.themes);
      if (s.activeGeneralThemeId)            setActiveGeneralThemeId(s.activeGeneralThemeId);
      if (s.activeTolkienThemeId)            setActiveTolkienThemeId(s.activeTolkienThemeId);
    }).catch(() => {});
  }, []);

  return (
    <AppContext.Provider value={{
      bgImageUrl,           setBgImageUrl,
      slideshowPresets,     setSlideshowPresets,
      activeSlideshowId,    setActiveSlideshowId,
      themes,               setThemes,
      activeGeneralThemeId, setActiveGeneralThemeId,
      tolkienBgUrl,         setTolkienBgUrl,
      activeTolkienThemeId, setActiveTolkienThemeId,
    }}>
      <BrowserRouter>
        <ToastProvider>
          <SlideshowEngine />
          <CinematicShell>
            <Routes>
              <Route path="/"                   element={<Studio />} />
              <Route path="/libreria"           element={<Libreria />} />
              <Route path="/libro/:id"          element={<DettaglioLibro />} />
              <Route path="/aggiungi"           element={<AggiungiLibro />} />
              <Route path="/autori"             element={<Autori />} />
              <Route path="/autori/:id"         element={<DettaglioAutore />} />
              <Route path="/editori"            element={<Editori />} />
              <Route path="/note"               element={<Note />} />
              <Route path="/scaffali"           element={<Scaffali />} />
              <Route path="/scaffali/:id"       element={<DettaglioScaffale />} />
              <Route path="/mappa"              element={<Mappa />} />
              <Route path="/grafo"              element={<Grafo />} />
              <Route path="/wishlist"           element={<Wishlist />} />
              <Route path="/annales"            element={<Annales />} />
              <Route path="/cerca"              element={<Ricerca />} />
              <Route path="/impostazioni"       element={<Impostazioni />} />
              <Route path="/collezioni/tolkien" element={<CollezioneTolkien />} />
              <Route path="/desiderata"         element={<Desiderata />} />
              <Route path="*"                   element={<Navigate to="/" replace />} />
            </Routes>
          </CinematicShell>
        </ToastProvider>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
