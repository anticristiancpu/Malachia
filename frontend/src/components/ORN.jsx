// Ornamenti dal design handoff atoms.jsx
export const ORN = {
  fleuron: ({ size = 16, style, className }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style} className={className}>
      <path d="M12 2 c2 3 5 4 8 4 c-3 1 -5 4 -5 7 c2 -1 5 0 7 2 c-3 0 -6 2 -7 5 c-1 -3 -4 -5 -7 -5 c2 -2 5 -3 7 -2 c0 -3 -2 -6 -5 -7 c3 0 6 -1 8 -4 z" fill="currentColor" opacity=".8"/>
    </svg>
  ),
  cross: ({ size = 14, style, className }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style} className={className}>
      <path d="M11 2 h2 v9 h9 v2 h-9 v9 h-2 v-9 h-9 v-2 h9 z" fill="currentColor"/>
    </svg>
  ),
  diamond: ({ size = 8, style, className }) => (
    <svg viewBox="0 0 8 8" width={size} height={size} style={style} className={className}>
      <path d="M4 0 L8 4 L4 8 L0 4 Z" fill="currentColor"/>
    </svg>
  ),
  quill: ({ size = 16, style, className }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style} className={className}>
      <path d="M20 3 C12 5 6 11 4 19 L7 19 C9 13 13 9 19 7 Z M5 21 L9 17" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  rule: ({ style }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'currentColor', ...style }}>
      <div style={{ flex: 1, height: 1, background: 'currentColor', opacity: .4 }}/>
      <span style={{ transform: 'rotate(45deg)', width: 6, height: 6, background: 'currentColor', display: 'inline-block', opacity: .8 }}/>
      <div style={{ flex: 1, height: 1, background: 'currentColor', opacity: .4 }}/>
    </div>
  ),
};

export default ORN;
