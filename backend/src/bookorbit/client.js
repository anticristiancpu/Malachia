// Client di sola lettura verso BookOrbit.
//
// Due regole che valgono per tutto il file:
//  - non viene mai inviata una richiesta che modifichi qualcosa su BookOrbit;
//    l'unico POST usato è /books/query, che nonostante il verbo è una lettura;
//  - le credenziali restano qui dentro. Non finiscono nelle risposte dell'API
//    di Malachia e non vengono mai scritte nei log, nemmeno in caso di errore.

const axios = require('axios');

const BASE = (process.env.BOOKORBIT_URL || '').replace(/\/+$/, '');
const UTENTE = process.env.BOOKORBIT_USERNAME || '';
const PASSWORD = process.env.BOOKORBIT_PASSWORD || '';

const API = () => `${BASE}/api/v1`;
const configurato = () => Boolean(BASE && UTENTE && PASSWORD);

// Il token vive solo in memoria: niente su disco, niente verso il frontend.
let token = null;
let scadenza = 0;
let inCorso = null;

// Un messaggio d'errore di axios può contenere l'URL con le credenziali o il
// corpo della richiesta. Lo riduciamo a qualcosa che si può mostrare e scrivere.
function errorePulito(e, cosa) {
  const stato = e?.response?.status;
  if (stato === 401 || stato === 403) return `credenziali rifiutate da BookOrbit (${stato})`;
  if (stato) return `BookOrbit ha risposto ${stato} a ${cosa}`;
  if (e?.code === 'ECONNREFUSED') return 'BookOrbit non risponde (connessione rifiutata)';
  if (e?.code === 'ETIMEDOUT' || e?.code === 'ECONNABORTED') return 'BookOrbit non risponde (tempo scaduto)';
  if (e?.code === 'ENOTFOUND') return 'indirizzo di BookOrbit non raggiungibile';
  return `BookOrbit non raggiungibile${cosa ? ` (${cosa})` : ''}`;
}

class ErroreBookOrbit extends Error {
  constructor(messaggio, stato) {
    super(messaggio);
    this.name = 'ErroreBookOrbit';
    this.stato = stato || 502;
  }
}

// Il token dura 15 minuti: lo rinnoviamo con un minuto di margine.
const MARGINE_MS = 60 * 1000;

async function accedi() {
  if (!configurato()) {
    throw new ErroreBookOrbit('BookOrbit non è configurato: manca BOOKORBIT_URL, BOOKORBIT_USERNAME o BOOKORBIT_PASSWORD nel .env', 503);
  }
  try {
    const r = await axios.post(`${API()}/auth/login`,
      { username: UTENTE, password: PASSWORD },
      { timeout: 15000, headers: { 'Content-Type': 'application/json' } });
    const t = r.data?.accessToken;
    if (!t) throw new ErroreBookOrbit('BookOrbit non ha restituito un token di accesso', 502);
    token = t;
    // La scadenza dichiarata nel token, se leggibile; altrimenti 15 minuti.
    let durata = 15 * 60 * 1000;
    try {
      const corpo = JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString());
      if (corpo?.exp) durata = corpo.exp * 1000 - Date.now();
    } catch { /* un token opaco va bene comunque */ }
    scadenza = Date.now() + Math.max(durata - MARGINE_MS, 30 * 1000);
    return token;
  } catch (e) {
    if (e instanceof ErroreBookOrbit) throw e;
    throw new ErroreBookOrbit(errorePulito(e, 'accesso'), e?.response?.status === 401 ? 401 : 502);
  }
}

// Una sola richiesta di accesso alla volta, anche se arrivano chiamate in parallelo.
async function tokenValido() {
  if (token && Date.now() < scadenza) return token;
  if (!inCorso) inCorso = accedi().finally(() => { inCorso = null; });
  return inCorso;
}

// Esegue la richiesta e, se il token è stato invalidato dall'altra parte,
// riprova una volta sola con un token nuovo.
async function chiama(config, { secondoTentativo = false } = {}) {
  const t = await tokenValido();
  try {
    return await axios({
      ...config,
      url: `${API()}${config.url}`,
      timeout: config.timeout || 20000,
      headers: { ...(config.headers || {}), Authorization: `Bearer ${t}` },
    });
  } catch (e) {
    if (e?.response?.status === 401 && !secondoTentativo) {
      token = null; scadenza = 0;
      return chiama(config, { secondoTentativo: true });
    }
    throw new ErroreBookOrbit(errorePulito(e, config.url), e?.response?.status === 401 ? 401 : 502);
  }
}

// ── lettura ────────────────────────────────────────────────────────────────

// Elenco completo del catalogo BookOrbit. La rotta è POST /books/query:
// paginazione a base zero, pagina di 200 righe al massimo.
async function elencoLibri({ perPagina = 200, maxPagine = 200 } = {}) {
  const tutti = [];
  for (let pagina = 0; pagina < maxPagine; pagina++) {
    const r = await chiama({
      method: 'post', url: '/books/query',
      data: { pagination: { page: pagina, size: perPagina } },
      headers: { 'Content-Type': 'application/json' },
    });
    const righe = r.data?.items;
    if (!Array.isArray(righe) || righe.length === 0) break;
    tutti.push(...righe);
    if (typeof r.data.total === 'number' && tutti.length >= r.data.total) break;
  }
  return tutti;
}

// Copertina di un libro, come buffer. Usata solo quando in Malachia manca.
async function copertina(idRemoto) {
  const r = await chiama({
    method: 'get', url: `/books/${idRemoto}/cover`,
    responseType: 'arraybuffer', timeout: 30000,
  });
  return {
    dati: Buffer.from(r.data),
    tipo: String(r.headers['content-type'] || 'image/jpeg').toLowerCase(),
  };
}

// Prova di raggiungibilità: non solleva, risponde sempre con un esito.
async function prova() {
  if (!configurato()) {
    return { configurato: false, raggiungibile: false, errore: 'BookOrbit non è configurato nel .env' };
  }
  try {
    const r = await chiama({ method: 'get', url: '/auth/me', timeout: 8000 });
    return { configurato: true, raggiungibile: true, utente: r.data?.username || r.data?.name || null };
  } catch (e) {
    return { configurato: true, raggiungibile: false, errore: e.message };
  }
}

// ── link costruiti al momento ──────────────────────────────────────────────
// Non salviamo indirizzi completi: si romperebbero se BookOrbit cambiasse
// indirizzo o sostituisse il file. Qui li ricomponiamo da BOOKORBIT_URL e dal
// fileId più recente che abbiamo nello specchio.

function linkScheda(idRemoto) {
  return BASE && idRemoto ? `${BASE}/book/${idRemoto}` : null;
}
function linkLettore(idRemoto, fileId) {
  return BASE && idRemoto && fileId ? `${BASE}/read/${idRemoto}/${fileId}` : null;
}

module.exports = {
  configurato, elencoLibri, copertina, prova,
  linkScheda, linkLettore, ErroreBookOrbit,
  get base() { return BASE; },
};
