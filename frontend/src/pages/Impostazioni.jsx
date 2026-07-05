import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { settings as settingsApi, authors as authorsApi } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';
import {
  applyGold, applyVermilion, applyOverlay, extractAccentFromImage,
  DEFAULT_GOLD, DEFAULT_VERMILION, DEFAULT_OVERLAY,
} from '../utils/theme.js';
import { AppContext } from '../AppContext.jsx';

/* ── shared style constants ──────────────────────────────────────────── */
const LABEL_STYLE = {
  fontFamily: "'Cinzel', 'Mantinia', serif",
  fontSize: 13,
  letterSpacing: '0.08em',
  color: 'var(--cine-cream)',
  textTransform: 'uppercase',
  marginBottom: 2,
};
const SUBLABEL_STYLE = {
  fontSize: 12,
  color: 'var(--cine-gold-dim)',
  fontFamily: "'EB Garamond', Georgia, serif",
  fontStyle: 'italic',
};
const RESET_BTN = (off) => ({
  background: 'none',
  border: `1px solid ${off ? 'rgba(216,180,106,0.10)' : 'var(--cine-border)'}`,
  color: off ? 'rgba(216,180,106,0.28)' : 'var(--cine-gold-dim)',
  cursor: off ? 'default' : 'pointer',
  padding: '5px 10px',
  fontFamily: "'Cinzel', serif",
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  transition: 'all 0.2s',
  flexShrink: 0,
});
const GHOST_BTN = {
  background: 'none',
  border: '1px solid var(--cine-border)',
  color: 'var(--cine-gold-dim)',
  cursor: 'pointer',
  padding: '6px 12px',
  fontFamily: "'Cinzel', serif",
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  transition: 'all 0.2s',
};

/* ── Toggle switch ───────────────────────────────────────────────────── */
function Toggle({ checked, onChange, label, sublabel }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer' }}>
      <div style={{
        position: 'relative', width: 36, height: 20, marginTop: 1,
        background: checked ? 'rgba(216,180,106,0.28)' : 'rgba(232,220,192,0.08)',
        border: `1px solid ${checked ? 'var(--cine-gold)' : 'var(--cine-border)'}`,
        transition: 'all 0.22s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 2, left: checked ? 16 : 2,
          width: 14, height: 14,
          background: checked ? 'var(--cine-gold)' : 'rgba(232,220,192,0.30)',
          transition: 'left 0.22s, background 0.22s', pointerEvents: 'none',
        }}/>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, inset: 0, margin: 0, cursor: 'pointer' }}/>
      </div>
      <div>
        <div style={LABEL_STYLE}>{label}</div>
        {sublabel && <div style={SUBLABEL_STYLE}>{sublabel}</div>}
      </div>
    </label>
  );
}

/* ── ColorRow ────────────────────────────────────────────────────────── */
function ColorRow({ label, sublabel, value, defaultValue, onChange, onReset, disabled }) {
  const inputRef = React.useRef(null);
  const isDefault = value === defaultValue;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      opacity: disabled ? 0.42 : 1, transition: 'opacity 0.22s',
      pointerEvents: disabled ? 'none' : 'auto',
    }}>
      <div role="button" tabIndex={disabled ? -1 : 0}
        title="Clicca per scegliere il colore"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        style={{
          position: 'relative', width: 42, height: 42,
          background: value, border: '2px solid var(--cine-border-strong)',
          cursor: disabled ? 'default' : 'pointer', flexShrink: 0,
        }}>
        <input ref={inputRef} type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', border: 'none', padding: 0 }}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={LABEL_STYLE}>{label}</div>
        <div style={SUBLABEL_STYLE}>
          {disabled ? <em>Gestito automaticamente dallo sfondo</em> : sublabel}
        </div>
        <div style={{ marginTop: 3, fontSize: 11, color: 'rgba(232,220,192,0.38)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
          {value}
        </div>
      </div>
      <button onClick={isDefault || disabled ? undefined : onReset} disabled={isDefault || disabled}
        title={isDefault ? 'Già al valore predefinito' : 'Ripristina'} style={RESET_BTN(isDefault || disabled)}>
        Reset
      </button>
    </div>
  );
}

/* ── Palette preset colori ───────────────────────────────────────────── */
const GOLD_PRESETS = [
  { name: 'Oro',          hex: '#d8b46a' },
  { name: 'Ambra',        hex: '#c89a4a' },
  { name: 'Avorio',       hex: '#e8d8a8' },
  { name: 'Argento',      hex: '#a8b4c0' },
  { name: 'Giada',        hex: '#7aaa8a' },
  { name: 'Ametista',     hex: '#9a7aaa' },
  { name: 'Lapislazzuli', hex: '#6a8aaa' },
  { name: 'Rosa',         hex: '#c87a7a' },
];
const VERMILION_PRESETS = [
  { name: 'Vermiglio',    hex: '#c0533b' },
  { name: 'Cremisi',      hex: '#9a2030' },
  { name: 'Ocra',         hex: '#b87a20' },
  { name: 'Foresta',      hex: '#3a7a4a' },
  { name: 'Azzurro',      hex: '#2a5a9a' },
  { name: 'Viola',        hex: '#7a3a9a' },
  { name: 'Terracotta',   hex: '#c07840' },
];

function PresetRow({ presets, value, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', opacity: disabled ? 0.30 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {presets.map(p => (
        <button key={p.hex} title={p.name} onClick={() => onChange(p.hex)}
          style={{
            width: 22, height: 22, background: p.hex,
            border: value === p.hex ? '2px solid var(--cine-cream)' : '1px solid rgba(232,220,192,0.18)',
            cursor: 'pointer', flexShrink: 0, transition: 'transform 0.12s, border 0.12s',
            transform: value === p.hex ? 'scale(1.18)' : 'scale(1)',
          }}/>
      ))}
    </div>
  );
}

/* ── Section divider ─────────────────────────────────────────────────── */
function Sec({ title, first, children }) {
  return (
    <section style={{ paddingTop: first ? 0 : 22, marginTop: first ? 0 : 22, borderTop: first ? 'none' : '1px solid var(--cine-border)' }}>
      <div className="m-eyebrow" style={{ marginBottom: 14, fontSize: 13 }}>{title}</div>
      {children}
    </section>
  );
}

/* ── Galleria sfondi ─────────────────────────────────────────────────── */
function BgGallery({ backgrounds, activeBgUrl, onSelect, onDelete, onUpload, uploading }) {
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {backgrounds.map(bg => {
          const isActive = bg.url === activeBgUrl;
          return (
            <div key={bg.url} style={{ position: 'relative', width: 82, height: 82, flexShrink: 0 }}>
              <img
                src={bg.url}
                alt=""
                onClick={() => onSelect(bg.url)}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  cursor: 'pointer', display: 'block',
                  border: isActive ? '2px solid var(--cine-gold)' : '1px solid var(--cine-border)',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.18s',
                }}
              />
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: 4, left: 4,
                  background: 'rgba(216,180,106,0.85)',
                  width: 8, height: 8,
                }} title="Sfondo attivo"/>
              )}
              <button
                onClick={() => onDelete(bg.filename)}
                title="Elimina sfondo"
                style={{
                  position: 'absolute', top: 3, right: 3,
                  background: 'rgba(10,7,4,0.80)', border: 'none',
                  color: 'rgba(232,220,192,0.70)', cursor: 'pointer',
                  width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, lineHeight: 1, padding: 0,
                }}
              >×</button>
            </div>
          );
        })}

        {/* Pulsante aggiungi */}
        <button
          onClick={onUpload}
          disabled={uploading}
          title="Carica nuovo sfondo"
          style={{
            width: 82, height: 82,
            background: 'rgba(232,220,192,0.04)',
            border: '1px dashed rgba(216,180,106,0.30)',
            color: uploading ? 'rgba(216,180,106,0.30)' : 'var(--cine-gold-dim)',
            cursor: uploading ? 'wait' : 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4, fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em',
            textTransform: 'uppercase', flexShrink: 0, transition: 'all 0.18s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square"/>
          </svg>
          {uploading ? '…' : 'Aggiungi'}
        </button>
      </div>

      {backgrounds.length === 0 && (
        <div style={{ fontSize: 12, color: 'rgba(232,220,192,0.30)', fontFamily: "'EB Garamond', serif", fontStyle: 'italic', marginBottom: 8 }}>
          Nessuno sfondo caricato. Clicca Aggiungi per iniziare.
        </div>
      )}
    </div>
  );
}

/* ── Slideshow preset card ───────────────────────────────────────────── */
const INTERVAL_OPTS = [
  { label: '10 s',   value: 10 },
  { label: '30 s',   value: 30 },
  { label: '1 min',  value: 60 },
  { label: '5 min',  value: 300 },
  { label: '15 min', value: 900 },
  { label: '1 ora',  value: 3600 },
];

function SlideshowPresetCard({ preset, backgrounds, isActive, onActivate, onDeactivate, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(preset);

  function toggleImage(url) {
    setDraft(d => ({
      ...d,
      images: d.images.includes(url)
        ? d.images.filter(u => u !== url)
        : [...d.images, url],
    }));
  }

  function save() {
    onUpdate(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(preset);
    setEditing(false);
  }

  return (
    <div style={{
      border: `1px solid ${isActive ? 'var(--cine-gold)' : 'var(--cine-border)'}`,
      background: isActive ? 'rgba(216,180,106,0.04)' : 'rgba(232,220,192,0.02)',
      marginBottom: 10, transition: 'all 0.2s',
    }}>
      {/* Header card */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...LABEL_STYLE, marginBottom: 0 }}>
            {preset.name || 'Preset senza nome'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(232,220,192,0.40)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
            {preset.images.length} {preset.images.length === 1 ? 'sfondo' : 'sfondi'}
            {' · '}
            {INTERVAL_OPTS.find(o => o.value === preset.interval)?.label ?? `${preset.interval}s`}
          </div>
        </div>

        {/* Attiva/Disattiva */}
        <button
          onClick={() => isActive ? onDeactivate() : onActivate(preset.id)}
          style={{
            ...GHOST_BTN,
            borderColor: isActive ? 'var(--cine-gold)' : undefined,
            color: isActive ? 'var(--cine-gold)' : undefined,
          }}
        >
          {isActive ? '■ Attivo' : '▶ Attiva'}
        </button>

        <button onClick={() => { setDraft(preset); setEditing(e => !e); }} style={GHOST_BTN}>
          {editing ? 'Chiudi' : 'Modifica'}
        </button>
        <button onClick={() => onDelete(preset.id)} style={{ ...GHOST_BTN, color: 'rgba(192,83,59,0.70)', borderColor: 'rgba(192,83,59,0.25)' }}>
          Elimina
        </button>
      </div>

      {/* Pannello modifica */}
      {editing && (
        <div style={{ borderTop: '1px solid var(--cine-border)', padding: '14px 14px 16px' }}>
          {/* Nome */}
          <div className="m-field" style={{ marginBottom: 12 }}>
            <label style={{ ...LABEL_STYLE, display: 'block', marginBottom: 4 }}>Nome preset</label>
            <input
              className="m-input"
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              placeholder="es. Paesaggi serali"
            />
          </div>

          {/* Intervallo */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ ...LABEL_STYLE, marginBottom: 8 }}>Intervallo cambio sfondo</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {INTERVAL_OPTS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDraft(d => ({ ...d, interval: opt.value }))}
                  style={{
                    ...GHOST_BTN,
                    padding: '4px 10px',
                    borderColor: draft.interval === opt.value ? 'var(--cine-gold)' : undefined,
                    color: draft.interval === opt.value ? 'var(--cine-gold)' : undefined,
                    background: draft.interval === opt.value ? 'rgba(216,180,106,0.08)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selezione sfondi */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ ...LABEL_STYLE, marginBottom: 8 }}>Sfondi inclusi nel preset</div>
            {backgrounds.length === 0 ? (
              <div style={{ fontSize: 12, color: 'rgba(232,220,192,0.30)', fontStyle: 'italic', fontFamily: "'EB Garamond', serif" }}>
                Carica prima degli sfondi nella galleria.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {backgrounds.map(bg => {
                  const selected = draft.images.includes(bg.url);
                  return (
                    <div
                      key={bg.url}
                      onClick={() => toggleImage(bg.url)}
                      style={{
                        position: 'relative', width: 64, height: 64, cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <img src={bg.url} alt="" style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        border: selected ? '2px solid var(--cine-gold)' : '1px solid rgba(232,220,192,0.15)',
                        boxSizing: 'border-box',
                        opacity: selected ? 1 : 0.45,
                        transition: 'all 0.15s',
                      }}/>
                      {selected && (
                        <div style={{
                          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(216,180,106,0.15)',
                        }}>
                          <div style={{ color: 'var(--cine-gold)', fontSize: 18, lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>✓</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Azioni modifica */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="m-btn" onClick={save}>Salva preset</button>
            <button className="m-btn m-btn-ghost" onClick={cancel}>Annulla</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ Main ═══════════════════════════════════════════════════════════════ */
export default function Impostazioni() {
  const toast = useToast();
  const {
    setBgImageUrl,
    slideshowPresets, setSlideshowPresets,
    activeSlideshowId, setActiveSlideshowId,
    themes, setThemes,
    activeGeneralThemeId, setActiveGeneralThemeId,
    setTolkienBgUrl,
    activeTolkienThemeId, setActiveTolkienThemeId,
  } = useContext(AppContext);
  const bgInputRef = useRef(null);
  const [bgUploading, setBgUploading] = useState(false);
  const [backgrounds, setBackgrounds] = useState([]);
  const [activeBgUrl, setActiveBgUrl] = useState(null);

  const [cfg, setCfg] = useState({
    google_books_key:  '',
    grimmory_url:      '',
    grimmory_user:     '',
    grimmory_password: '',
    hardcover_token:   '',
    provider_order:    'goodreads,google_books,open_library',
    accentGold:        DEFAULT_GOLD,
    accentVermilion:   DEFAULT_VERMILION,
    overlayOpacity:    DEFAULT_OVERLAY,
    autoAccent:        false,
  });
  const [saving,       setSaving]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [cleaning,     setCleaning]     = useState(false);
  const [orphansCount, setOrphansCount] = useState(null);

  const loadBackgrounds = useCallback(() => {
    settingsApi.listBackgrounds().then(setBackgrounds).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([settingsApi.get(), settingsApi.listBackgrounds()])
      .then(([s, bgs]) => {
        const p = { ...s };
        if (p.overlayOpacity != null) p.overlayOpacity = parseFloat(p.overlayOpacity);
        if (p.autoAccent     != null) p.autoAccent = p.autoAccent === true || p.autoAccent === 'true';
        setCfg(c => ({ ...c, ...p }));
        try { localStorage.setItem('malachia_autoAccent', String(p.autoAccent === true)); } catch {}
        setActiveBgUrl(s.bgImageUrl || null);
        setBackgrounds(bgs);
        // I temi sono già caricati in AppContext da App.jsx, ma sincronizziamo anche il cfg locale
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* ── Selezione sfondo dalla galleria ─── */
  function selectBackground(url) {
    setBgImageUrl(url);
    setActiveBgUrl(url);
    settingsApi.save({ bgImageUrl: url })
      .then(() => toast('Sfondo aggiornato', 'success'))
      .catch(() => toast('Errore nel salvataggio sfondo', 'error'));
  }

  /* ── Eliminazione sfondo ─── */
  async function deleteBackground(filename) {
    try {
      await settingsApi.deleteBackground(filename);
      loadBackgrounds();
      // Aggiorna preset nel context se contenevano questo sfondo
      const url = `/uploads/backgrounds/${filename}`;
      const updated = slideshowPresets.map(p => ({ ...p, images: p.images.filter(u => u !== url) }));
      setSlideshowPresets(updated);
      if (activeBgUrl === url) { setActiveBgUrl(null); setBgImageUrl(null); }
      toast('Sfondo eliminato', 'success');
    } catch { toast('Errore durante l\'eliminazione', 'error'); }
  }

  /* ── Upload nuovo sfondo ─── */
  function handleBgChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setBgImageUrl(dataUrl);
      if (cfg.autoAccent) {
        extractAccentFromImage(dataUrl).then(hex => {
          if (hex) { applyGold(hex); setCfg(c => ({ ...c, accentGold: hex })); toast('Colore accento adattato allo sfondo', 'success'); }
        });
      }
    };
    reader.readAsDataURL(file);

    setBgUploading(true);
    settingsApi.uploadBackground(file)
      .then(result => {
        if (result?.url) {
          setBgImageUrl(result.url);
          setActiveBgUrl(result.url);
          try { localStorage.removeItem('malachia_bg'); } catch {}
        }
        loadBackgrounds();
        toast('Sfondo aggiunto alla galleria', 'success');
      })
      .catch(() => toast('Sfondo impostato (solo locale)', 'success'))
      .finally(() => {
        setBgUploading(false);
        if (bgInputRef.current) bgInputRef.current.value = '';
      });
  }

  /* ── Slideshow presets ─── */
  function createPreset() {
    const newPreset = {
      id: `preset_${Date.now()}`,
      name: 'Nuovo preset',
      interval: 30,
      images: [],
    };
    const updated = [...slideshowPresets, newPreset];
    setSlideshowPresets(updated);
    settingsApi.save({ slideshowPresets: updated }).catch(() => {});
  }

  function updatePreset(updatedPreset) {
    const updated = slideshowPresets.map(p => p.id === updatedPreset.id ? updatedPreset : p);
    setSlideshowPresets(updated);
    settingsApi.save({ slideshowPresets: updated })
      .then(() => toast('Preset salvato', 'success'))
      .catch(() => toast('Errore nel salvataggio preset', 'error'));
  }

  function deletePreset(id) {
    const updated = slideshowPresets.filter(p => p.id !== id);
    setSlideshowPresets(updated);
    const newActiveId = activeSlideshowId === id ? null : activeSlideshowId;
    setActiveSlideshowId(newActiveId);
    settingsApi.save({ slideshowPresets: updated, activeSlideshowId: newActiveId }).catch(() => {});
    toast('Preset eliminato', 'success');
  }

  function activatePreset(id) {
    setActiveSlideshowId(id);
    settingsApi.save({ activeSlideshowId: id })
      .then(() => toast('Slideshow avviato', 'success'))
      .catch(() => {});
  }

  function deactivateSlideshow() {
    setActiveSlideshowId(null);
    settingsApi.save({ activeSlideshowId: null }).catch(() => {});
    toast('Slideshow disattivato', 'success');
  }

  /* ── Temi ─── */
  const [newThemeName, setNewThemeName] = useState('');
  const [savingTheme,  setSavingTheme]  = useState(false);

  async function saveCurrentTheme() {
    const name = newThemeName.trim();
    if (!name) return;
    setSavingTheme(true);
    const tema = {
      id: `theme_${Date.now()}`,
      name,
      bgImageUrl:      activeBgUrl || null,
      accentGold:      cfg.accentGold,
      accentVermilion: cfg.accentVermilion,
      overlayOpacity:  cfg.overlayOpacity,
    };
    const updated = [...themes, tema];
    setThemes(updated);
    setNewThemeName('');
    try {
      await settingsApi.save({ themes: updated });
      toast('Tema salvato', 'success');
    } catch { toast('Errore nel salvataggio tema', 'error'); }
    setSavingTheme(false);
  }

  async function deleteTheme(id) {
    const updated = themes.filter(t => t.id !== id);
    setThemes(updated);
    const newGeneralId = activeGeneralThemeId === id ? null : activeGeneralThemeId;
    const newTolkienId = activeTolkienThemeId === id ? null : activeTolkienThemeId;
    setActiveGeneralThemeId(newGeneralId);
    setActiveTolkienThemeId(newTolkienId);
    await settingsApi.save({ themes: updated, activeGeneralThemeId: newGeneralId, activeTolkienThemeId: newTolkienId }).catch(() => {});
    toast('Tema eliminato', 'success');
  }

  async function applyThemeToGeneral(tema) {
    setBgImageUrl(tema.bgImageUrl);
    setActiveBgUrl(tema.bgImageUrl);
    applyGold(tema.accentGold);
    applyVermilion(tema.accentVermilion);
    applyOverlay(tema.overlayOpacity);
    setCfg(c => ({ ...c, accentGold: tema.accentGold, accentVermilion: tema.accentVermilion, overlayOpacity: tema.overlayOpacity }));
    setActiveGeneralThemeId(tema.id);
    try {
      await settingsApi.save({
        bgImageUrl: tema.bgImageUrl,
        accentGold: tema.accentGold,
        accentVermilion: tema.accentVermilion,
        overlayOpacity: tema.overlayOpacity,
        activeGeneralThemeId: tema.id,
      });
      toast(`Tema "${tema.name}" applicato`, 'success');
    } catch { toast('Errore nell\'applicazione del tema', 'error'); }
  }

  async function applyThemeToTolkien(tema) {
    setTolkienBgUrl(tema.bgImageUrl);
    try { localStorage.setItem('malachia-tolkien-cine-bg', tema.bgImageUrl || ''); } catch {}
    setActiveTolkienThemeId(tema.id);
    try {
      await settingsApi.save({ tolkienBgUrl: tema.bgImageUrl, activeTolkienThemeId: tema.id });
      toast(`Tema "${tema.name}" applicato a Tolkien`, 'success');
    } catch { toast('Errore nell\'applicazione del tema', 'error'); }
  }

  /* ── Salva impostazioni generali ─── */
  async function save() {
    setSaving(true);
    try {
      await settingsApi.save({ ...cfg, slideshowPresets, activeSlideshowId });
      toast('Impostazioni salvate', 'success');
    } catch { toast('Errore nel salvataggio', 'error'); }
    setSaving(false);
  }

  async function loadOrphansCount() {
    try { const r = await authorsApi.orphansCount(); setOrphansCount(r.count); }
    catch { setOrphansCount(0); }
  }

  async function cleanOrphans() {
    if (orphansCount === 0) { toast('Nessun autore orfano da rimuovere', 'success'); return; }
    setCleaning(true);
    try {
      const r = await authorsApi.cleanOrphans();
      toast(r.deleted === 0 ? 'Nessun autore orfano trovato' : `${r.deleted} autor${r.deleted === 1 ? 'e rimosso' : 'i rimossi'} dalla rubrica`, 'success');
      setOrphansCount(0);
    } catch { toast('Errore durante la pulizia', 'error'); }
    setCleaning(false);
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div className="m-spinner"/>
    </div>
  );

  return (
    <div style={{ padding: '28px 48px 56px' }}>

      {/* Header */}
      <div className="m-eyebrow">Configuratio</div>
      <div className="m-serif" style={{ fontSize: 38, fontWeight: 500, lineHeight: 1.05, marginTop: 4 }}>
        Impostazioni
      </div>

      {/* Hidden bg input */}
      <input ref={bgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgChange}/>

      {/* ── Two-column grid ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '0 60px', marginTop: 32, alignItems: 'start',
      }}>

        {/* ══ Left — Aspetto ══════════════════════════════════════════════ */}
        <Sec title="Aspetto" first>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Galleria sfondi */}
            <div>
              <div style={LABEL_STYLE}>Galleria sfondi</div>
              <div style={{ ...SUBLABEL_STYLE, marginBottom: 10 }}>
                Clicca su un'immagine per impostarla come sfondo attivo
              </div>
              <BgGallery
                backgrounds={backgrounds}
                activeBgUrl={activeBgUrl}
                onSelect={selectBackground}
                onDelete={deleteBackground}
                onUpload={() => bgInputRef.current?.click()}
                uploading={bgUploading}
              />
            </div>

            {/* Auto-accent toggle */}
            <Toggle
              checked={cfg.autoAccent}
              onChange={v => { setCfg(c => ({ ...c, autoAccent: v })); try { localStorage.setItem('malachia_autoAccent', String(v)); } catch {} }}
              label="Rileva colore dallo sfondo"
              sublabel="Adatta il colore accento automaticamente ad ogni cambio di sfondo"
            />

            {/* Velo slider */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={LABEL_STYLE}>Velo di sfondo</div>
                  <div style={SUBLABEL_STYLE}>Oscurità del velo uniforme sopra l'immagine</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: 'rgba(232,220,192,0.55)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em', minWidth: 36, textAlign: 'right' }}>
                    {Math.round(cfg.overlayOpacity * 100)}%
                  </span>
                  <button onClick={() => { setCfg(c => ({ ...c, overlayOpacity: DEFAULT_OVERLAY })); applyOverlay(DEFAULT_OVERLAY); }}
                    disabled={cfg.overlayOpacity === DEFAULT_OVERLAY} style={RESET_BTN(cfg.overlayOpacity === DEFAULT_OVERLAY)}>
                    Reset
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'rgba(232,220,192,0.28)', fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', flexShrink: 0 }}>Chiaro</span>
                <input type="range" min="0" max="1" step="0.01" value={cfg.overlayOpacity}
                  onChange={e => { const v = parseFloat(e.target.value); setCfg(c => ({ ...c, overlayOpacity: v })); applyOverlay(v); }}
                  style={{ flex: 1, accentColor: 'var(--cine-gold)', cursor: 'pointer' }}/>
                <span style={{ fontSize: 10, color: 'rgba(232,220,192,0.28)', fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', flexShrink: 0 }}>Scuro</span>
              </div>
            </div>

            {/* Colore accento */}
            <ColorRow
              label="Colore accento" sublabel="Oro — titoli, bordi, icone attive, grafici"
              value={cfg.accentGold} defaultValue={DEFAULT_GOLD} disabled={cfg.autoAccent}
              onChange={hex => { setCfg(c => ({ ...c, accentGold: hex })); applyGold(hex); }}
              onReset={() => { setCfg(c => ({ ...c, accentGold: DEFAULT_GOLD })); applyGold(DEFAULT_GOLD); }}
            />
            <PresetRow presets={GOLD_PRESETS} value={cfg.accentGold} disabled={cfg.autoAccent}
              onChange={hex => { setCfg(c => ({ ...c, accentGold: hex })); applyGold(hex); }}/>

            {/* Colore enfasi */}
            <ColorRow
              label="Colore enfasi" sublabel="Vermiglio — stati, badge, avvisi, etichette speciali"
              value={cfg.accentVermilion} defaultValue={DEFAULT_VERMILION}
              onChange={hex => { setCfg(c => ({ ...c, accentVermilion: hex })); applyVermilion(hex); }}
              onReset={() => { setCfg(c => ({ ...c, accentVermilion: DEFAULT_VERMILION })); applyVermilion(DEFAULT_VERMILION); }}
            />
            <PresetRow presets={VERMILION_PRESETS} value={cfg.accentVermilion}
              onChange={hex => { setCfg(c => ({ ...c, accentVermilion: hex })); applyVermilion(hex); }}/>

            <div style={{ fontSize: 12, color: 'rgba(232,220,192,0.36)', borderTop: '1px solid var(--cine-border)', paddingTop: 12, fontFamily: "'EB Garamond', Georgia, serif", fontStyle: 'italic' }}>
              Le modifiche ai colori sono immediate. Premi <em style={{ color: 'var(--cine-gold-dim)', fontStyle: 'normal' }}>Salva impostazioni</em> per renderle permanenti.
            </div>
          </div>
        </Sec>

        {/* ══ Right col ══════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* ── Slideshow ── */}
          <Sec title="Slideshow sfondi" first>
            <div style={{ fontSize: 12, color: 'rgba(232,220,192,0.40)', fontFamily: "'EB Garamond', serif", fontStyle: 'italic', marginBottom: 14, lineHeight: 1.6 }}>
              Crea preset di slideshow con sfondi e tempi diversi. Lo slideshow non si attiva nella Collezione Tolkien.
            </div>

            {slideshowPresets.length === 0 && (
              <div style={{ fontSize: 12, color: 'rgba(232,220,192,0.30)', fontFamily: "'EB Garamond', serif", fontStyle: 'italic', marginBottom: 12 }}>
                Nessun preset creato. Aggiungine uno per iniziare.
              </div>
            )}

            {slideshowPresets.map(preset => (
              <SlideshowPresetCard
                key={preset.id}
                preset={preset}
                backgrounds={backgrounds}
                isActive={activeSlideshowId === preset.id}
                onActivate={activatePreset}
                onDeactivate={deactivateSlideshow}
                onUpdate={updatePreset}
                onDelete={deletePreset}
              />
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={createPreset} style={GHOST_BTN}>
                + Nuovo preset
              </button>
              {activeSlideshowId && (
                <button onClick={deactivateSlideshow} style={{ ...GHOST_BTN, color: 'rgba(192,83,59,0.70)', borderColor: 'rgba(192,83,59,0.25)' }}>
                  ■ Ferma slideshow
                </button>
              )}
            </div>
          </Sec>

          <Sec title="API & Integrazioni">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="m-field">
                <label>Google Books API Key <span style={{ opacity: 0.55, fontStyle: 'italic' }}>(opzionale)</span></label>
                <input className="m-input" type="text" value={cfg.google_books_key}
                  onChange={e => setCfg(c => ({ ...c, google_books_key: e.target.value }))} placeholder="AIza…"/>
                <small className="m-marginalia">Senza chiave funziona con limiti più severi.</small>
              </div>
              <div className="m-field">
                <label>Hardcover API Token <span style={{ opacity: 0.55, fontStyle: 'italic' }}>(opzionale)</span></label>
                <input className="m-input" type="text" value={cfg.hardcover_token}
                  onChange={e => setCfg(c => ({ ...c, hardcover_token: e.target.value }))} placeholder="Token da hardcover.app → impostazioni"/>
                <small className="m-marginalia">Registrati su hardcover.app per ottenere il token gratuito.</small>
              </div>
            </div>
          </Sec>

          <Sec title="Integrazione Grimmory">
            <div style={{ padding: '10px 13px', border: '1px solid var(--cine-border)', background: 'rgba(232,220,192,0.03)', marginBottom: 12 }}>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--m-ink-soft)', margin: 0, fontFamily: "'EB Garamond', Georgia, serif" }}>
                Grimmory è un gestore ebook self-hosted. Malachia lo legge in sola lettura.
                Imposta <code className="m-mono" style={{ fontSize: 12 }}>API_DOCS_ENABLED=true</code> nel .env di Grimmory.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="m-field">
                <label>URL base</label>
                <input className="m-input" type="url" value={cfg.grimmory_url}
                  onChange={e => setCfg(c => ({ ...c, grimmory_url: e.target.value }))} placeholder="http://localhost:6060"/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="m-field">
                  <label>Username</label>
                  <input className="m-input" value={cfg.grimmory_user} onChange={e => setCfg(c => ({ ...c, grimmory_user: e.target.value }))}/>
                </div>
                <div className="m-field">
                  <label>Password</label>
                  <input className="m-input" type="password" value={cfg.grimmory_password} onChange={e => setCfg(c => ({ ...c, grimmory_password: e.target.value }))}/>
                </div>
              </div>
            </div>
          </Sec>

          <Sec title="Ordine provider metadati">
            <div className="m-field">
              <label>Priorità <span style={{ opacity: 0.55, fontStyle: 'italic' }}>(virgola-separata)</span></label>
              <input className="m-input" value={cfg.provider_order}
                onChange={e => setCfg(c => ({ ...c, provider_order: e.target.value }))}
                placeholder="goodreads,google_books,open_library"/>
              <small className="m-marginalia">Ordine: goodreads, google_books, open_library, amazon.</small>
            </div>
          </Sec>

          <Sec title="Manutenzione dati">
            <div style={{ border: '1px solid var(--cine-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px' }}>
                <div style={{ flex: 1 }}>
                  <div className="m-serif" style={{ fontSize: 14, fontWeight: 500 }}>Autori orfani</div>
                  <div className="m-marginalia" style={{ fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>
                    Autori senza libri. Utile dopo importazioni CSV o fusioni.
                  </div>
                  {orphansCount === null ? (
                    <button className="m-btn m-btn-ghost m-btn-sm" style={{ marginTop: 6, fontSize: 11 }} onClick={loadOrphansCount}>
                      verifica quanti ›
                    </button>
                  ) : (
                    <div style={{ marginTop: 6, fontSize: 12, color: orphansCount > 0 ? 'var(--m-terracotta)' : 'var(--m-ink-muted)', fontFamily: "'EB Garamond', serif" }}>
                      {orphansCount === 0 ? '✓ Nessun autore orfano' : `⚠ ${orphansCount} autor${orphansCount === 1 ? 'e orfano' : 'i orfani'}`}
                    </div>
                  )}
                </div>
                <button className="m-btn m-btn-ghost" style={{ flexShrink: 0, marginLeft: 14 }}
                  onClick={cleanOrphans} disabled={cleaning || orphansCount === 0}>
                  {cleaning ? '…' : '✕ rimuovi'}
                </button>
              </div>
            </div>
          </Sec>

          <Sec title="Backup & Esportazione">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="m-btn m-btn-ghost" onClick={() => settingsApi.backup()}>⇓ Backup SQLite</button>
              <a className="m-btn m-btn-ghost" href="/api/export/csv" download>⇓ CSV</a>
              <a className="m-btn m-btn-ghost" href="/api/export/json" download>⇓ JSON</a>
            </div>
          </Sec>

        </div>{/* end right col */}
      </div>{/* end grid */}

      {/* ── Temi — full width ── */}
      <section style={{ marginTop: 32, paddingTop: 22, borderTop: '1px solid var(--cine-border)' }}>
        <div className="m-eyebrow" style={{ marginBottom: 6, fontSize: 13 }}>Temi</div>
        <div style={{ fontSize: 12, color: 'rgba(232,220,192,0.40)', fontFamily: "'EB Garamond', serif", fontStyle: 'italic', marginBottom: 18, lineHeight: 1.6 }}>
          Salva una combinazione di sfondo, colori e velo come tema riutilizzabile.
          Ogni tema può essere applicato alla <em style={{ fontStyle: 'normal', color: 'rgba(216,180,106,0.65)' }}>sezione generale</em> oppure alla <em style={{ fontStyle: 'normal', color: 'rgba(216,180,106,0.65)' }}>Collezione Tolkien</em> in modo indipendente.
        </div>

        {/* Salva tema corrente */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ ...LABEL_STYLE, marginBottom: 0, flexShrink: 0 }}>Salva tema corrente</div>
          <input
            className="m-input"
            style={{ maxWidth: 240 }}
            placeholder="Nome del tema…"
            value={newThemeName}
            onChange={e => setNewThemeName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && newThemeName.trim() && saveCurrentTheme()}
          />
          <button
            onClick={saveCurrentTheme}
            disabled={savingTheme || !newThemeName.trim()}
            style={{ ...GHOST_BTN, flexShrink: 0 }}
          >
            {savingTheme ? '…' : '+ Salva'}
          </button>
          <div style={{ fontSize: 11, color: 'rgba(232,220,192,0.30)', fontFamily: "'EB Garamond', serif", fontStyle: 'italic' }}>
            Cattura: sfondo attivo, colori accento e velo attuali
          </div>
        </div>

        {/* Lista temi */}
        {themes.length === 0 ? (
          <div style={{ fontSize: 12, color: 'rgba(232,220,192,0.25)', fontFamily: "'EB Garamond', serif", fontStyle: 'italic' }}>
            Nessun tema salvato.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
            {themes.map(tema => {
              const isGenActive  = activeGeneralThemeId  === tema.id;
              const isTkjActive  = activeTolkienThemeId  === tema.id;
              return (
                <div key={tema.id} style={{
                  border: `1px solid ${isGenActive || isTkjActive ? 'rgba(216,180,106,0.45)' : 'var(--cine-border)'}`,
                  background: isGenActive || isTkjActive ? 'rgba(216,180,106,0.03)' : 'rgba(232,220,192,0.02)',
                  display: 'flex', alignItems: 'stretch', gap: 0,
                  transition: 'border-color 0.2s',
                }}>
                  {/* Thumbnail sfondo */}
                  <div style={{ width: 64, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                    {tema.bgImageUrl
                      ? <img src={tema.bgImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', background: 'rgba(10,7,4,1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 18, color: 'rgba(232,220,192,0.12)' }}>◇</span>
                        </div>
                    }
                  </div>

                  {/* Info + azioni */}
                  <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                    {/* Nome + swatches */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ ...LABEL_STYLE, marginBottom: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tema.name}
                      </div>
                      {/* Gold swatch */}
                      <div title={`Accento: ${tema.accentGold}`} style={{ width: 14, height: 14, background: tema.accentGold, border: '1px solid rgba(0,0,0,0.3)', flexShrink: 0 }} />
                      {/* Vermilion swatch */}
                      <div title={`Enfasi: ${tema.accentVermilion}`} style={{ width: 14, height: 14, background: tema.accentVermilion, border: '1px solid rgba(0,0,0,0.3)', flexShrink: 0 }} />
                      {/* Overlay indicator */}
                      <div title={`Velo: ${Math.round(tema.overlayOpacity * 100)}%`}
                        style={{ width: 14, height: 14, flexShrink: 0, border: '1px solid rgba(232,220,192,0.15)', background: `rgba(0,0,0,${tema.overlayOpacity})` }} />
                    </div>

                    {/* Badge sezioni attive */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {isGenActive  && <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(216,180,106,0.15)', border: '1px solid rgba(216,180,106,0.35)', color: 'var(--cine-gold)', fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>✓ Generale</span>}
                      {isTkjActive  && <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(216,180,106,0.15)', border: '1px solid rgba(216,180,106,0.35)', color: 'var(--cine-gold)', fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>✓ Tolkien</span>}
                    </div>

                    {/* Pulsanti azione */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                      <button
                        onClick={() => applyThemeToGeneral(tema)}
                        style={{
                          ...GHOST_BTN, padding: '4px 9px', fontSize: 9,
                          borderColor: isGenActive ? 'var(--cine-gold)' : undefined,
                          color: isGenActive ? 'var(--cine-gold)' : undefined,
                        }}
                      >
                        {isGenActive ? '✓ Generale' : '▶ Applica a Generale'}
                      </button>
                      <button
                        onClick={() => applyThemeToTolkien(tema)}
                        style={{
                          ...GHOST_BTN, padding: '4px 9px', fontSize: 9,
                          borderColor: isTkjActive ? 'var(--cine-gold)' : undefined,
                          color: isTkjActive ? 'var(--cine-gold)' : undefined,
                        }}
                      >
                        {isTkjActive ? '✓ Tolkien' : '▶ Applica a Tolkien'}
                      </button>
                      <button
                        onClick={() => deleteTheme(tema.id)}
                        style={{ ...GHOST_BTN, padding: '4px 9px', fontSize: 9, marginLeft: 'auto', color: 'rgba(192,83,59,0.65)', borderColor: 'rgba(192,83,59,0.20)' }}
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Salva — full width ── */}
      <div style={{ paddingTop: 24, marginTop: 32, borderTop: '1px solid var(--cine-border)' }}>
        <button className="m-btn" onClick={save} disabled={saving}>
          {saving ? 'Salvando…' : 'Salva impostazioni'}
        </button>
      </div>

      {/* ── Disclaimer ── */}
      <div style={{ padding: '13px 16px', border: '1px solid var(--cine-border)', background: 'rgba(122,59,46,0.04)', marginTop: 20 }}>
        <div className="m-eyebrow" style={{ marginBottom: 5 }}>Disclaimer scraping Goodreads</div>
        <p className="m-marginalia" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Malachia recupera metadati da Goodreads tramite scraping delle pagine pubbliche.
          Goodreads non ha un'API pubblica dal 2020. I risultati dipendono dalla disponibilità del sito
          e possono variare. L'uso è soggetto ai Termini di Servizio di Goodreads.
        </p>
      </div>

    </div>
  );
}
