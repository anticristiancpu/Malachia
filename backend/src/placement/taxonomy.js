/**
 * Sistema di collocazione della biblioteca.
 *
 * Quattro livelli: Grande Era › Sotto-periodo › Disciplina › Autore (alfabetico).
 * Il sotto-periodo è determinato dal periodo di cui l'opera TRATTA, non da quando
 * è stata scritta. Le opere che attraversano più Grandi Ere vanno nella sezione
 * trasversale; i libri appena arrivati sostano in "Nuovi acquisti".
 *
 * ID canonico di una sezione:
 *   "<era>/<periodo>/<disciplina>"   es. "antichita/grecia/storia"
 *   "trasversale/<voce>"             es. "trasversale/riviste"
 *   "nuovi-acquisti"
 */

// Le 7 discipline, nell'ordine di scaffalatura (Storia sempre per prima).
const DISCIPLINES = [
  { id: 'storia',            name: 'Storia',                 full: 'Storia (+ Geografia)' },
  { id: 'filosofia',         name: 'Filosofia',              full: 'Filosofia' },
  { id: 'scienze-sociali',   name: 'Scienze Sociali',        full: 'Scienze Sociali, Politiche, Psicologia, Antropologia e Religione' },
  { id: 'linguistica',       name: 'Linguaggio e Linguistica', full: 'Linguaggio e Linguistica' },
  { id: 'scienze-naturali',  name: 'Scienze Naturali',       full: 'Scienze Naturali, Matematica e Tecnologia' },
  { id: 'arti',              name: 'Arti e Spettacolo',      full: 'Arti e Spettacolo' },
  { id: 'letteratura',       name: 'Letteratura',            full: 'Letteratura (Narrativa + Teatro + Poesia)' },
];

// Le 4 Grandi Ere con i rispettivi sotto-periodi (16 blocchi in totale).
const ERAS = [
  {
    id: 'antichita', name: 'Antichità', range: 'fino al 476 d.C.', numeral: 'I',
    periods: [
      { id: 'generale',        name: 'Generale',                     note: 'opere sull\'intera Antichità' },
      { id: 'vicino-oriente',  name: 'Vicino Oriente antico ed Egitto' },
      { id: 'grecia',          name: 'Grecia antica',                range: 'fino al 31 a.C.' },
      { id: 'roma',            name: 'Roma antica',                  range: 'dalle origini al 476 d.C.' },
    ],
  },
  {
    id: 'medioevo', name: 'Medioevo', range: '476–1400', numeral: 'II',
    periods: [
      { id: 'generale',      name: 'Generale',       note: 'opere sull\'intero Medioevo' },
      { id: 'alto-medioevo', name: 'Alto Medioevo',  range: '476–1000' },
      { id: 'basso-medioevo',name: 'Basso Medioevo', range: '1000–1400' },
    ],
  },
  {
    id: 'modernita', name: 'Modernità', range: '1400–1815', numeral: 'III',
    periods: [
      { id: 'generale',      name: 'Generale',                                note: 'opere sull\'intera Modernità' },
      { id: 'rinascimento',  name: 'Rinascimento e prima Età Moderna',        range: '1400–1650' },
      { id: 'antico-regime', name: 'Antico Regime e Illuminismo',             range: '1650–1789' },
      { id: 'rivoluzione',   name: 'Rivoluzione Francese ed Età Napoleonica', range: '1789–1815' },
    ],
  },
  {
    id: 'contemporanea', name: 'Età Contemporanea', range: 'dal 1815 a oggi', numeral: 'IV',
    periods: [
      { id: 'generale',          name: 'Generale',                  note: 'opere sull\'intera Età Contemporanea' },
      { id: 'ottocento',         name: 'Restaurazione e Ottocento', range: '1815–1900' },
      { id: 'primo-novecento',   name: 'Prima metà del Novecento',  range: '1900–1945' },
      { id: 'secondo-novecento', name: 'Seconda metà del Novecento',range: '1945–1989' },
      { id: 'eta-recente',       name: 'Età recente',               range: '1989–oggi' },
    ],
  },
];

// Sezione trasversale: opere che attraversano più Grandi Ere.
const TRASVERSALE = [
  { id: 'riferimento',      name: 'Opere di riferimento generali', note: 'enciclopedie, dizionari, atlanti' },
  { id: 'storia',           name: 'Storia generale' },
  { id: 'filosofia',        name: 'Filosofia generale',            note: 'storie della filosofia, manuali' },
  { id: 'scienze-sociali',  name: 'Scienze Sociali generali' },
  { id: 'linguistica',      name: 'Linguaggio e Linguistica generali' },
  { id: 'scienze-naturali', name: 'Scienze Naturali generali' },
  { id: 'arti',             name: 'Arti e Spettacolo generali',    note: 'storie dell\'arte, manuali' },
  { id: 'letteratura',      name: 'Letteratura generale',          note: 'antologie, storie della letteratura' },
  { id: 'riviste',          name: 'Riviste e periodici',           note: 'ordinate per testata' },
];

const NUOVI_ACQUISTI = { id: 'nuovi-acquisti', name: 'Nuovi acquisti', note: 'zona di transito, ordinata per data di acquisizione' };

/** Albero completo delle sezioni, pronto per la UI. */
function buildTree() {
  return {
    disciplines: DISCIPLINES,
    eras: ERAS.map(era => ({
      ...era,
      periods: era.periods.map(p => ({
        ...p,
        sections: DISCIPLINES.map(d => ({
          id: `${era.id}/${p.id}/${d.id}`,
          discipline: d.id,
          name: d.name,
        })),
      })),
    })),
    trasversale: TRASVERSALE.map(t => ({ ...t, id: `trasversale/${t.id}` })),
    nuoviAcquisti: NUOVI_ACQUISTI,
  };
}

/** Tutti gli ID di sezione validi. */
function allSectionIds() {
  const ids = [NUOVI_ACQUISTI.id];
  for (const era of ERAS) {
    for (const p of era.periods) {
      for (const d of DISCIPLINES) ids.push(`${era.id}/${p.id}/${d.id}`);
    }
  }
  for (const t of TRASVERSALE) ids.push(`trasversale/${t.id}`);
  return ids;
}

const VALID = new Set(allSectionIds());
function isValidSection(id) { return typeof id === 'string' && VALID.has(id); }

/** Etichetta leggibile di una sezione, es. "Antichità › Grecia antica › Storia". */
function labelFor(id) {
  if (!id) return null;
  if (id === NUOVI_ACQUISTI.id) return NUOVI_ACQUISTI.name;
  const parts = id.split('/');
  if (parts[0] === 'trasversale') {
    const t = TRASVERSALE.find(x => x.id === parts[1]);
    return t ? `Trasversale › ${t.name}` : null;
  }
  const era = ERAS.find(e => e.id === parts[0]);
  const per = era?.periods.find(p => p.id === parts[1]);
  const dis = DISCIPLINES.find(d => d.id === parts[2]);
  if (!era || !per || !dis) return null;
  return `${era.name} › ${per.name} › ${dis.name}`;
}

module.exports = {
  DISCIPLINES, ERAS, TRASVERSALE, NUOVI_ACQUISTI,
  buildTree, allSectionIds, isValidSection, labelFor,
};
