'use strict';
/**
 * OPAC SBN — Servizio Bibliotecario Nazionale (ICCU)
 * https://opac.sbn.it
 *
 * API interna (Liferay + Solr):
 *   POST /o/opac-api/titles-search-post
 *   Parametri (form-urlencoded): core=sbn, page=1, titolo_all=..., nome=..., monocampo=...
 *
 * I risultati non contengono ISBN (solo BID interni), ma forniscono
 * titolo, autore, editore e anno — utilissimi per libri italiani.
 */

const axios = require('axios');

const BASE        = 'https://opac.sbn.it';
const SEARCH_PATH = '/o/opac-api/titles-search-post';

const HEADERS = {
  'User-Agent':    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept':        'application/json, */*',
  'Referer':       'https://opac.sbn.it/ricerca-avanzata',
  'Content-Type':  'application/x-www-form-urlencoded',
};

/* ── Core HTTP ──────────────────────────────────────────────────── */

async function sbnPost(params, page = 1) {
  const body = new URLSearchParams({ core: 'sbn', page: String(page), ...params }).toString();
  const res  = await axios.post(BASE + SEARCH_PATH, body, {
    headers:        HEADERS,
    timeout:        18000,
    validateStatus: s => s < 500,
  });
  if (res.status >= 400) throw new Error(`SBN HTTP ${res.status}`);
  return res.data?.data || null;
}

/* ── Parsing ────────────────────────────────────────────────────── */

/**
 * Inverte "Cognome, Nome" → "Nome Cognome"
 * (formato AACR2/MARC usato dal catalogo SBN)
 */
function invertName(s) {
  if (!s) return '';
  const parts = s.split(',');
  if (parts.length < 2) return s.trim();
  return [parts.slice(1).join(',').trim(), parts[0].trim()].filter(Boolean).join(' ');
}

/**
 * Parsa "Città : Editore, Anno" → { publisher, year }
 * Gestisce varianti come "stampa 1985", "©2018", etc.
 */
function parsePubInfo(raw) {
  if (!raw) return { publisher: null, year: null };
  // Rimuove la città (prima parte separata da " : ")
  const parts = raw.split(/\s*:\s*/);
  const pubYearStr = parts.length >= 2 ? parts.slice(1).join(':').trim() : raw;

  // Anno: primo gruppo di 4 cifre dal 1400 al 2099
  const yearMatch = pubYearStr.match(/\b(1[4-9]\d{2}|20\d{2})\b/);
  const year      = yearMatch ? parseInt(yearMatch[1]) : null;

  // Editore: rimuove anno e indicatori tipo "stampa", "©", "c", "cop."
  let publisher = pubYearStr
    .replace(/[,;]\s*(stampa\s+)?(©|c\.|cop\.)?\s*\d{4}.*$/i, '')
    .replace(/^(stampa\s+)?(©|c\.|cop\.)?\s*\d{4}/i, '')
    .trim()
    .replace(/[,;]+$/, '')
    .trim() || null;

  return { publisher, year };
}

function mapResult(item) {
  if (!item) return null;

  // "title" è un oggetto { text: "Cognome, Nome", info: "Titolo / Autore" }
  // oppure (rare volte) una stringa semplice
  const titleObj   = item.title;
  const titleText  = typeof titleObj === 'string' ? titleObj : (titleObj?.text  || '');
  const titleInfo  = typeof titleObj === 'string' ? titleObj : (titleObj?.info  || '');

  // Autore: da title.text (MARC "Cognome, Nome") oppure da pretitle (se presente)
  // oppure estratto da title.info come secondo segmento dopo " / "
  let authorRaw = (item.pretitle || titleText || '').trim();
  if (!authorRaw && titleInfo.includes('/')) {
    authorRaw = (titleInfo.split(/\s*\/\s*/)[1] || '').trim();
  }
  const authorName = invertName(authorRaw);

  // Titolo: primo segmento di title.info (prima del " / ")
  const titleFull  = titleInfo || titleText;
  const titleClean = titleFull.split(/\s*\/\s*/)[0].trim();
  if (!titleClean || titleClean.length < 2) return null;

  // Editore + anno: da infos[0] = "Città : Editore, Anno" o "Editore, Anno"
  const info0 = (Array.isArray(item.infos) ? item.infos[0] : '') || '';
  const { publisher, year } = parsePubInfo(info0);

  return {
    source:    'sbn',
    title:     titleClean,
    subtitle:  null,
    authors:   authorName ? [{ name: authorName, role: 'author' }] : [],
    publisher,
    year,
    isbn13:    null,   // non presente nei risultati di lista SBN
    isbn10:    null,
    language:  'ita',
    cover_url: null,
    synopsis:  null,
  };
}

/* ── Deduplication interna ──────────────────────────────────────── */

function dedupResults(items) {
  const seen = new Set();
  return items.filter(r => {
    const key = (r.title + '|' + (r.authors[0]?.name || '') + '|' + (r.year || '')).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ── API pubblica ─────────────────────────────────────────────── */

/**
 * Ricerca testuale libera (monocampo — cerca titolo, autore, editore).
 */
async function searchBooks(query) {
  try {
    const safe  = (query || '').trim();
    if (!safe) return [];
    const data  = await sbnPost({ monocampo: safe });
    const items = (data?.results || []).map(mapResult).filter(Boolean);
    return dedupResults(items).slice(0, 15);
  } catch (e) {
    console.warn('[SBN] searchBooks error:', e.message);
    return [];
  }
}

/**
 * Ricerca per titolo + autore (più precisa del monocampo).
 */
async function searchByTitleAuthor(title, author) {
  try {
    const safeTitle  = (title  || '').trim();
    const safeAuthor = (author || '').trim();
    if (!safeTitle && !safeAuthor) return [];

    const params = {};
    if (safeTitle)  params.titolo_all = safeTitle;
    if (safeAuthor) params.nome       = safeAuthor;

    const data  = await sbnPost(params);
    const items = (data?.results || []).map(mapResult).filter(Boolean);
    if (items.length > 0) return dedupResults(items).slice(0, 15);

    // Fallback: ricerca titolo-only se la combinata non dà risultati
    if (safeTitle && safeAuthor) {
      const data2  = await sbnPost({ titolo_all: safeTitle });
      const items2 = (data2?.results || []).map(mapResult).filter(Boolean);
      return dedupResults(items2).slice(0, 15);
    }
    return [];
  } catch (e) {
    console.warn('[SBN] searchByTitleAuthor error:', e.message);
    return [];
  }
}

/**
 * Lookup per ISBN — usa monocampo con l'ISBN come parola chiave.
 * SBN non ha un endpoint ISBN dedicato accessibile pubblicamente,
 * ma l'ISBN compare nei record e viene trovato dalla ricerca libera.
 */
async function getByISBN(isbn) {
  try {
    const clean = (isbn || '').replace(/[-\s]/g, '');
    if (!clean) return null;
    const data  = await sbnPost({ monocampo: clean });
    const items = (data?.results || []).map(mapResult).filter(Boolean);
    return items[0] || null;
  } catch (e) {
    console.warn('[SBN] getByISBN error:', e.message);
    return null;
  }
}

module.exports = { searchBooks, searchByTitleAuthor, getByISBN };
