import { useState, useEffect } from 'react';

/* Sotto questa larghezza Malachia usa la versione per telefono. È la stessa
   soglia di mobile.css: tenerle uguali, o le due metà si contraddicono. */
export const SOGLIA_MOBILE = 820;

const QUERY = `(max-width: ${SOGLIA_MOBILE}px)`;

/* Vero sui telefoni e sui tablet in verticale. Si aggiorna se la finestra
   cambia larghezza, così ruotando il tablet la navigazione si adegua. */
export default function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const aggiorna = () => setMobile(mq.matches);
    aggiorna();
    mq.addEventListener('change', aggiorna);
    return () => mq.removeEventListener('change', aggiorna);
  }, []);

  return mobile;
}
