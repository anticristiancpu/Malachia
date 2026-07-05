import React, { useContext, useState, useEffect, useRef } from 'react';
import TopBar from './TopBar.jsx';
import { AppContext } from '../AppContext.jsx';

const FADE_MS = 2400;

export default function CinematicShell({ children }) {
  const { bgImageUrl } = useContext(AppContext);

  // back = immagine correntemente visibile (opacity 1)
  // front = immagine in arrivo (fade 0 → 1 sopra back)
  const [back,         setBack]         = useState(null);
  const [front,        setFront]        = useState(null);
  const [frontVisible, setFrontVisible] = useState(false);
  const timerRef = useRef(null);
  const rafRef   = useRef(null);

  useEffect(() => {
    if (!bgImageUrl) return;

    // Prima immagine: mostra direttamente senza dissolvenza
    if (!back) {
      setBack(bgImageUrl);
      return;
    }
    if (bgImageUrl === back && !front) return;

    // Cancella eventuale transizione in corso
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);

    setFront(bgImageUrl);
    setFrontVisible(false);

    // Due frame per garantire che il front sia nel DOM a opacity 0
    // prima di avviare la transizione CSS
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setFrontVisible(true);
        timerRef.current = setTimeout(() => {
          setBack(bgImageUrl);
          setFront(null);
          setFrontVisible(false);
        }, FADE_MS + 120);
      });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    };
  }, [bgImageUrl]);

  return (
    <div className="cine-app">

      {/* Layer back: immagine corrente, sfuma via quando arriva il front */}
      {back && (
        <img
          className="cine-bg-img"
          src={back}
          alt=""
          aria-hidden="true"
          style={{
            opacity:    front && frontVisible ? 0 : 1,
            transition: front ? `opacity ${FADE_MS}ms ease` : 'none',
          }}
        />
      )}

      {/* Layer front: nuova immagine, sfuma in entrata */}
      {front && (
        <img
          className="cine-bg-img"
          src={front}
          alt=""
          aria-hidden="true"
          style={{
            opacity:    frontVisible ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease`,
            zIndex:     1,
          }}
        />
      )}

      <div className="cine-overlay" aria-hidden="true">
        <div className="cine-overlay-grad" />
        <div className="cine-overlay-grain" />
      </div>

      <TopBar />

      <main className="cine-main">
        {children}
      </main>
    </div>
  );
}
