import { useEffect } from 'react';

/* Sul telefono non c'è il tasto destro, e Safari su iPhone non trasforma il
   tocco prolungato in un evento "contextmenu". Tutti i menu di Malachia sono
   agganciati a quell'evento: senza questo, sul telefono resterebbero chiusi.

   Qui un tocco tenuto fermo per mezzo secondo diventa un "contextmenu" vero,
   lanciato sull'elemento toccato e nel punto toccato: i gestori esistenti lo
   ricevono come se fosse il tasto destro e non sanno la differenza.

   Va attivato solo sul telefono. Su Android il browser il contextmenu lo
   genera già da sé: in quel caso questo si fa da parte, per non aprire il
   menu due volte. */

const ATTESA_MS = 550;   // un filo più di Android, così di solito vince il suo
const TOLLERANZA_PX = 10;   // oltre, è uno scorrimento e non un tocco fermo

export default function useToccoLungo(attivo) {
  useEffect(() => {
    if (!attivo) return;

    let timer = null;
    let inizio = null;
    let bersaglio = null;
    let scattato = false;      // il menu è stato aperto: il clic che segue va ignorato
    let ultimoNostro = 0;      // quando abbiamo aperto noi il menu

    const annulla = () => { clearTimeout(timer); timer = null; };

    const giu = (e) => {
      if (e.touches.length !== 1) { annulla(); return; }
      const t = e.touches[0];
      inizio = { x: t.clientX, y: t.clientY };
      bersaglio = e.target;
      scattato = false;
      annulla();
      timer = setTimeout(() => {
        timer = null;
        scattato = true;
        ultimoNostro = Date.now();
        bersaglio.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true, cancelable: true, view: window,
          clientX: inizio.x, clientY: inizio.y,
          screenX: inizio.x, screenY: inizio.y,
          button: 2, buttons: 2,
        }));
        if (navigator.vibrate) navigator.vibrate(12);
      }, ATTESA_MS);
    };

    const muovi = (e) => {
      if (!timer || !inizio) return;
      const t = e.touches[0];
      if (Math.abs(t.clientX - inizio.x) > TOLLERANZA_PX ||
          Math.abs(t.clientY - inizio.y) > TOLLERANZA_PX) annulla();
    };

    const su = () => annulla();

    /* Su Android il browser genera già il suo contextmenu. Se arriva prima del
       nostro, ci facciamo da parte; se arriva subito dopo, è un doppione e lo
       fermiamo, altrimenti il menu si aprirebbe due volte. */
    const nativo = (e) => {
      if (!e.isTrusted) return;
      if (timer) { annulla(); return; }
      if (Date.now() - ultimoNostro < 1000) { e.preventDefault(); e.stopPropagation(); }
    };

    // Dopo un tocco lungo arriva anche un clic: aprirebbe la scheda del libro
    // proprio mentre si apre il menu. Lo fermiamo prima che arrivi a React.
    const clic = (e) => {
      if (!scattato) return;
      scattato = false;
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('touchstart', giu, { passive: true });
    document.addEventListener('touchmove', muovi, { passive: true });
    document.addEventListener('touchend', su, { passive: true });
    document.addEventListener('touchcancel', su, { passive: true });
    document.addEventListener('contextmenu', nativo, true);
    document.addEventListener('click', clic, true);
    return () => {
      annulla();
      document.removeEventListener('touchstart', giu);
      document.removeEventListener('touchmove', muovi);
      document.removeEventListener('touchend', su);
      document.removeEventListener('touchcancel', su);
      document.removeEventListener('contextmenu', nativo, true);
      document.removeEventListener('click', clic, true);
    };
  }, [attivo]);
}
