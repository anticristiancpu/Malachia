export const DEFAULT_GOLD      = '#d8b46a';
export const DEFAULT_VERMILION = '#c0533b';
export const DEFAULT_OVERLAY   = 0.52;

/* ── low-level helpers ────────────────────────────────────────────────── */
function clamp(v) { return Math.min(255, Math.max(0, Math.round(v))); }

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function scaleHex(hex, factor) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(clamp(r * factor), clamp(g * factor), clamp(b * factor));
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else                h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h /= 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}

/* ── apply gold accent ────────────────────────────────────────────────── */
export function applyGold(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const [r, g, b] = hexToRgb(hex);
  const root = document.documentElement;
  root.style.setProperty('--cine-gold',         hex);
  root.style.setProperty('--cine-gold-dim',      scaleHex(hex, 0.62));
  root.style.setProperty('--cine-border',        `rgba(${r},${g},${b},0.18)`);
  root.style.setProperty('--cine-border-strong', `rgba(${r},${g},${b},0.32)`);
  root.style.setProperty('--m-gold',             hex);
  root.style.setProperty('--m-terracotta-light', `rgba(${r},${g},${b},0.14)`);
}

/* ── apply vermilion accent ───────────────────────────────────────────── */
export function applyVermilion(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const root = document.documentElement;
  root.style.setProperty('--cine-vermilion',    hex);
  root.style.setProperty('--m-terracotta',      hex);
  root.style.setProperty('--m-terracotta-soft', scaleHex(hex, 1.28));
}

/* ── apply overlay opacity ────────────────────────────────────────────── */
export function applyOverlay(opacity) {
  const v = Math.max(0, Math.min(1, parseFloat(opacity)));
  if (isNaN(v)) return;
  document.documentElement.style.setProperty('--cine-overlay-opacity', v);
}

/* ── extract dominant accent from an image src (data URL or same-origin) */
export function extractAccentFromImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const SIZE = 80;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

        // 36 hue buckets of 10° each
        const counts = new Array(36).fill(0);
        const sums   = Array.from({ length: 36 }, () => [0, 0, 0]);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const [h, s, l] = rgbToHsl(r, g, b);
          // skip near-grey, near-black, near-white
          if (s < 0.15 || l < 0.08 || l > 0.90) continue;
          const bkt = Math.floor(h / 10) % 36;
          counts[bkt]++;
          sums[bkt][0] += r;
          sums[bkt][1] += g;
          sums[bkt][2] += b;
        }

        const total = counts.reduce((a, c) => a + c, 0);
        if (total < 40) { resolve(null); return; } // image too monochrome

        // find dominant bucket
        let best = 0;
        for (let i = 1; i < 36; i++) if (counts[i] > counts[best]) best = i;

        const n = counts[best];
        let r = Math.round(sums[best][0] / n);
        let g = Math.round(sums[best][1] / n);
        let b = Math.round(sums[best][2] / n);

        // Normalise to UI-usable saturation (48–78%) + lightness (46–65%)
        const [h, s, l] = rgbToHsl(r, g, b);
        const s2 = Math.min(0.78, Math.max(0.48, s));
        const l2 = Math.min(0.65, Math.max(0.46, l));
        [r, g, b] = hslToRgb(h, s2, l2);

        resolve(rgbToHex(r, g, b));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
