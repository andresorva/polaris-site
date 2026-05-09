/* ============================================
   POLARIS — Shared UI Components
   Logo, icons, charts, primitives
   ============================================ */

// --- Logo ---
// Pure SVG star — no square frame, no PNG. Integrates with dark backgrounds.
function PolarisLogo({ size = 22, full = true, pulse = false, glow = false }) {
  const s = size;
  const id = React.useMemo(() => 'pl' + Math.random().toString(36).slice(2, 8), []);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.max(8, s * 0.36) }}>
      <span style={{
        position: 'relative', width: s, height: s, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Soft organic glow (teal → blue) — no hard edges, blends with bg */}
        {glow && (
          <span style={{
            position: 'absolute',
            width: s * 2.4, height: s * 2.4,
            left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(circle, rgba(46,230,200,0.55), rgba(77,124,255,0.18) 45%, transparent 70%)',
            filter: 'blur(' + (s * 0.35) + 'px)',
            animation: pulse ? 'logoGlow 2.6s ease-in-out infinite' : 'none',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }} />
        )}
        <svg viewBox="0 0 64 64" width={s} height={s} style={{
          display: 'block', position: 'relative',
          filter: 'drop-shadow(0 0 ' + (s * 0.25) + 'px rgba(46,230,200,0.55))',
          animation: pulse ? 'logoPulse 2.6s ease-in-out infinite' : 'none',
        }}>
          <defs>
            <radialGradient id={id + '-core'} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="35%" stopColor="#A6FFE0" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#2EE6C8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#4D7CFF" stopOpacity="0.6" />
            </radialGradient>
            <radialGradient id={id + '-halo'} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2EE6C8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#2EE6C8" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Soft inner halo */}
          <circle cx="32" cy="32" r="26" fill={'url(#' + id + '-halo)'} />
          {/* 4-point star — sharp, gradient-filled */}
          <path
            d="M32 4 L36.5 27.5 L60 32 L36.5 36.5 L32 60 L27.5 36.5 L4 32 L27.5 27.5 Z"
            fill={'url(#' + id + '-core)'}
          />
          {/* Bright center */}
          <circle cx="32" cy="32" r="3" fill="#FFFFFF" />
        </svg>
      </span>
      {full && (
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: s * 0.62,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: 'var(--text-1)',
        }}>POLARIS</span>
      )}
    </span>
  );
}

// --- Icon set (line, 1.6 stroke, 18×18) ---
const Icon = ({ name, size = 18, strokeWidth = 1.6, ...rest }) => {
  const paths = {
    'home':       <><path d="M3 11l9-8 9 8" /><path d="M5 9.5V20h14V9.5" /></>,
    'compass':    <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
    'chart':      <><path d="M4 20h16" /><path d="M7 16V9" /><path d="M12 16V5" /><path d="M17 16v-7" /></>,
    'pulse':      <path d="M3 12h4l3-7 4 14 3-7h4" />,
    'volume':     <><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16 8c1.5 1.5 1.5 6.5 0 8" /></>,
    'users':      <><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M21 19c0-2.4-1.8-4.5-4-4.5" /></>,
    'bell':       <><path d="M6 16V11a6 6 0 0112 0v5l1.5 2H4.5z" /><path d="M10 21h4" /></>,
    'doc':        <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 15h6M9 18h4" /></>,
    'plug':       <><path d="M9 4v4M15 4v4" /><path d="M7 8h10v3a5 5 0 01-10 0z" /><path d="M12 16v4" /></>,
    'search':     <><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></>,
    'filter':     <path d="M4 5h16l-6 8v6l-4-2v-4z" />,
    'plus':       <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    'arrow-up':   <><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></>,
    'arrow-down': <><path d="M12 5v14" /><path d="M5 12l7 7 7-7" /></>,
    'arrow-r':    <><path d="M5 12h14" /><path d="M13 5l7 7-7 7" /></>,
    'arrow-tr':   <><path d="M7 17L17 7" /><path d="M9 7h8v8" /></>,
    'check':      <path d="M5 12l4 4 10-10" />,
    'x':          <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
    'eye':        <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
    'flag':       <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
    'dots':       <><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>,
    'sliders':    <><path d="M4 6h11" /><circle cx="17" cy="6" r="2" /><path d="M9 12h11" /><circle cx="6" cy="12" r="2" /><path d="M4 18h11" /><circle cx="17" cy="18" r="2" /></>,
    'shield':     <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
    'globe':      <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a13 13 0 010 18" /><path d="M12 3a13 13 0 000 18" /></>,
    'zap':        <path d="M13 3L4 14h7l-1 7 9-11h-7z" />,
    'mail':       <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
    'lock':       <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
    'logo-x':     <path fill="currentColor" stroke="none" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
    'logo-tt':    <path fill="currentColor" stroke="none" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1Z" />,
    'logo-ig':    <path fill="currentColor" stroke="none" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />,
    'logo-fb':    <path fill="currentColor" stroke="none" d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />,
    'logo-yt':    <path fill="currentColor" stroke="none" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
    'logo-tg':    <path d="M21 4L3 11l5 2 2 6 3-4 5 4z" />,
    'logo-wa':    <><path d="M4 20l1.5-4A8 8 0 1112 20z" /></>,
    'logo-w':     <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a13 13 0 010 18" /></>,
    'logo-r':     <><circle cx="12" cy="12" r="9" /><path d="M8 14c1 1 2.5 1.5 4 1.5s3-0.5 4-1.5" /></>,
    'logo-bsky':  <path fill="currentColor" stroke="none" d="M5.46 2.79C7.66 4.43 10.04 7.74 11.5 9.5c1.46-1.76 3.84-5.07 6.04-6.71 1.56-1.18 4.09-2.07 4.09.78 0 .57-.32 4.78-.51 5.47-.66 2.4-3.21 3.01-5.49 2.62 4.96.81 6.23 3.6 3.51 6.39-5.16 5.31-7.41-1.33-7.99-3.03-.11-.31-.16-.45-.16-.33 0-.12-.05.02-.16.33-.58 1.7-2.83 8.34-7.99 3.03-2.72-2.79-1.45-5.58 3.51-6.39C4.07 11.66 1.52 11.05.86 8.65.67 7.96.34 3.75.34 3.18.34.33 2.87 1.22 4.43 2.4z" />,
    'star':       <path d="M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5L12 17l-5.5 3.5L8 14 3 9.5 9.5 9z" />,
    'spark':      <><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /><path d="M5.5 5.5l4 4M14.5 14.5l4 4M5.5 18.5l4-4M14.5 9.5l4-4" /></>,
    'grid':       <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>,
    'list':       <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>,
    'play':       <path d="M7 5l12 7-12 7z" />,
    'pause':      <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>,
    'download':   <><path d="M12 4v12" /><path d="M6 12l6 6 6-6" /><path d="M5 20h14" /></>,
    'share':      <><circle cx="6" cy="12" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 11l8-4M8 13l8 4" /></>,
    'heart':      <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />,
    'reply':      <><path d="M9 7L3 12l6 5" /><path d="M3 12h11a6 6 0 016 6v2" /></>,
    'cog':        <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 00-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 00-2.1 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 002.1 1.2L10 21h4l.5-2.6a7 7 0 002.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" /></>,
    'logout':     <><path d="M9 4H5a2 2 0 00-2 2v12a2 2 0 002 2h4" /><path d="M14 8l4 4-4 4" /><path d="M18 12H8" /></>,
    'menu':       <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    'caret':      <path d="M6 9l6 6 6-6" />,
    'circle':     <circle cx="12" cy="12" r="9" />,
    'warning':    <><path d="M12 3l10 17H2z" /><path d="M12 10v5" /><circle cx="12" cy="18" r="0.8" fill="currentColor" /></>,
    'info':       <><circle cx="12" cy="12" r="9" /><path d="M12 8v.5M12 11v6" /></>,
    'crosshair':  <><circle cx="12" cy="12" r="9" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><circle cx="12" cy="12" r="2" /></>,
    'broadcast':  <><circle cx="12" cy="12" r="2" /><path d="M8 8c-2.2 2.2-2.2 5.8 0 8M16 8c2.2 2.2 2.2 5.8 0 8M5 5c-3.9 3.9-3.9 10.1 0 14M19 5c3.9 3.9 3.9 10.1 0 14" /></>,
    'history':    <><path d="M3 12a9 9 0 109-9 9 9 0 00-9 9z" /><path d="M3 5v4h4" /><path d="M12 7v5l3 2" /></>,
    'expand':     <><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></>,
    'sun':        <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    'moon':       <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}
         fill="none" stroke="currentColor" strokeWidth={strokeWidth}
         strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {paths[name] || null}
    </svg>
  );
};

// --- Sparkline ---
function Sparkline({ data, color = 'var(--teal)', height = 32, fill = true, width = 120 }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = width;
  const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y];
  });
  const safeNum = (n) => (typeof n === 'number' && !isNaN(n) ? n.toFixed(1) : '0');
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${safeNum(p?.[0])} ${safeNum(p?.[1])}`).join(' ');
  const fillPath = `${path} L${w} ${h} L0 ${h} Z`;
  const id = 'spark-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height, width: '100%' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={fillPath} fill={`url(#${id})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// --- Area chart (multi-series sentiment) ---
function AreaChart({ data, height = 220, showAxis = true }) {
  const w = 800;
  const h = height;
  const padL = 36, padR = 12, padT = 12, padB = 24;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const len = data.length;

  const series = ['pos', 'neu', 'neg'];
  const colors = { pos: '#2EE6C8', neu: '#6B7794', neg: '#FF4D6D' };

  const xAt = (i) => padL + (i / (len - 1)) * innerW;
  const yAt = (v) => padT + innerH - (v / 100) * innerH;

  const safeNum = (n) => (typeof n === 'number' && !isNaN(n) ? n.toFixed(1) : '0');
  const buildPath = (key) => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'}${safeNum(xAt(i))} ${safeNum(yAt(d?.[key]))}`).join(' ');
  };
  const buildArea = (key) => {
    return `${buildPath(key)} L${safeNum(xAt(len-1))} ${safeNum(padT + innerH)} L${padL} ${safeNum(padT + innerH)} Z`;
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height, display: 'block' }} preserveAspectRatio="none">
      <defs>
        {series.map(s => (
          <linearGradient key={s} id={`area-${s}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[s]} stopOpacity="0.28" />
            <stop offset="100%" stopColor={colors[s]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={padL} x2={w - padR} y1={yAt(v)} y2={yAt(v)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          {showAxis && (
            <text x={padL - 8} y={yAt(v) + 3} fontSize="10" fill="var(--text-4)" textAnchor="end" fontFamily="var(--font-mono)">{v}</text>
          )}
        </g>
      ))}

      {/* Areas */}
      {series.map(s => (
        <path key={`a-${s}`} d={buildArea(s)} fill={`url(#area-${s})`} />
      ))}
      {/* Lines */}
      {series.map(s => (
        <path key={`l-${s}`} d={buildPath(s)} fill="none" stroke={colors[s]} strokeWidth="1.6" strokeLinejoin="round" />
      ))}

      {/* X axis ticks */}
      {showAxis && [0, 7, 14, 21, 29].map(i => (
        i < len && <text key={i} x={xAt(i)} y={h - 6} fontSize="10" fill="var(--text-4)" textAnchor="middle" fontFamily="var(--font-mono)">
          {`d${len - 1 - i}`}
        </text>
      ))}
    </svg>
  );
}

// --- Bar chart (horizontal) ---
function HBar({ value, max = 100, color = 'var(--teal)', height = 6 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ height, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: color,
        borderRadius: 999,
        transition: 'width 600ms var(--ease-out)',
      }} />
    </div>
  );
}

// --- Donut chart ---
function Donut({ value, size = 80, stroke = 8, color = 'var(--teal)', label, sublabel }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 800ms var(--ease-out)' }} />
      </svg>
      {(label !== undefined) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div className="display" style={{ fontSize: size * 0.28, fontWeight: 500, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>{label}</div>
          {sublabel && <div className="mono" style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.06em' }}>{sublabel}</div>}
        </div>
      )}
    </div>
  );
}

// --- Heatmap (8×24 — day×hour) ---
function Heatmap({ rows = 8, cols = 24, accent = '#2EE6C8' }) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = Math.max(0, Math.min(1,
        0.3 +
        Math.sin(r * 0.7 + c * 0.4) * 0.3 +
        Math.cos(c * 0.25 + r * 0.5) * 0.25 +
        (c >= 18 && c <= 22 ? 0.35 : 0) +
        (r === 4 && c >= 14 && c <= 20 ? 0.3 : 0)
      ));
      cells.push({ r, c, v });
    }
  }
  return (
    <div className="heatmap-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 3 }}>
      {cells.map((c) => (
        <div key={`${c.r}-${c.c}`}
             title={`r${c.r} h${c.c}: ${(() => { const n = (c?.v ?? 0) * 100; return (typeof n === 'number' && !isNaN(n) ? n.toFixed(0) : '—'); })()}`}
             style={{
               aspectRatio: '1',
               borderRadius: 3,
               background: c.v < 0.05 ? 'var(--bg-3)' : `${accent}${Math.floor(c.v * 220).toString(16).padStart(2, '0')}`,
               transition: 'background 200ms var(--ease)',
             }} />
      ))}
    </div>
  );
}

// --- Trend indicator ---
function Trend({ value, suffix = '%' }) {
  const isValid = typeof value === 'number' && !isNaN(value);
  const up = isValid && value > 0;
  const flat = !isValid || value === 0;
  return (
    <span className="mono" style={{
      fontSize: 11,
      fontWeight: 500,
      color: flat ? 'var(--text-3)' : up ? 'var(--pos)' : 'var(--neg)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
    }}>
      {!flat && (
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
          <path d={up ? 'M2 8l4-4 4 4' : 'M2 4l4 4 4-4'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {up && '+'}{isValid ? value.toFixed(1) : '—'}{suffix}
    </span>
  );
}

// --- Avatar (initials) ---
function Avatar({ initials, color, size = 32, gradient }) {
  const bg = gradient || (color ? `linear-gradient(135deg, ${color}, ${color}cc)` : 'linear-gradient(135deg, var(--blue-dim), var(--purple-dim))');
  return (
    <div className="avatar" style={{
      width: size, height: size,
      fontSize: size * 0.36,
      background: bg,
    }}>{initials}</div>
  );
}

// --- Platform icon (with brand chip) ---
function PlatformChip({ platform, size = 22 }) {
  const map = {
    'X': { c: '#fff', i: 'logo-x' },
    'Twitter': { c: '#fff', i: 'logo-x' },
    'twitter': { c: '#fff', i: 'logo-x' },
    'twitter_unofficial': { c: '#fff', i: 'logo-x' },
    'TikTok': { c: '#FF4D6D', i: 'logo-tt' },
    'tiktok': { c: '#FF4D6D', i: 'logo-tt' },
    'tiktok_comment': { c: '#FF4D6D', i: 'logo-tt' },
    'Instagram': { c: '#E4405F', i: 'logo-ig' },
    'instagram': { c: '#E4405F', i: 'logo-ig' },
    'instagram_comment': { c: '#E4405F', i: 'logo-ig' },
    'Facebook': { c: '#1877F2', i: 'logo-fb' },
    'facebook': { c: '#1877F2', i: 'logo-fb' },
    'facebook_comment': { c: '#1877F2', i: 'logo-fb' },
    'YouTube': { c: '#FF0000', i: 'logo-yt' },
    'youtube': { c: '#FF0000', i: 'logo-yt' },
    'youtube_comment': { c: '#FF0000', i: 'logo-yt' },
    'Bluesky': { c: '#0085FF', i: 'logo-bsky' },
    'bluesky': { c: '#0085FF', i: 'logo-bsky' },
    'Telegram': { c: '#4D7CFF', i: 'logo-tg' },
    'WhatsApp': { c: '#2EE6C8', i: 'logo-wa' },
    'Web': { c: '#FFB546', i: 'logo-w' },
    'Reddit': { c: '#FFB546', i: 'logo-r' },
  };
  const p = map[platform] || map['X'];
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 6,
      background: 'var(--bg-3)',
      border: '1px solid var(--line-2)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: p.c,
      flexShrink: 0,
    }}>
      <Icon name={p.i} size={size * 0.55} strokeWidth={1.8} />
    </div>
  );
}

// --- KPI tile ---
function KPI({ label, value, delta, deltaSuffix = '%', sub, sparkData, sparkColor, accent }) {
  return (
    <div className="card card-pad lift" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
      {accent && <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        opacity: 0.7,
      }} />}
      <div className="flex between items-s">
        <div className="eyebrow" style={{ fontSize: 10 }}>{label}</div>
        {delta !== undefined && <Trend value={delta} suffix={deltaSuffix} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
        <span className="metric-num"><CountUp value={value} /></span>
        {sub && <span className="t-3 mono" style={{ fontSize: 11 }}>{sub}</span>}
      </div>
      {sparkData && (
        <div style={{ marginTop: 14, marginLeft: -4, marginRight: -4 }}>
          <Sparkline data={sparkData} color={sparkColor || accent || 'var(--teal)'} height={28} />
        </div>
      )}
    </div>
  );
}

// --- CountUp: anima un valor numérico de 0 al final en 1.5s, ease-out, sólo en primer mount ---
function CountUp({ value, duration = 1500 }) {
  // Parse el valor: extrae número y sufijo (K, M, %, etc.)
  const parsed = React.useMemo(() => {
    if (value === undefined || value === null) return { animatable: false, raw: '' };
    if (typeof value !== 'string' && typeof value !== 'number') return { animatable: false, raw: value };
    const str = String(value);
    // No animar placeholders
    if (str === '…' || str === '—' || str === '') return { animatable: false, raw: str };
    // Match opcional signo + número con decimal opcional + sufijo opcional
    const match = str.match(/^(-?\d+\.?\d*)([KMB]|%)?$/i);
    if (!match) return { animatable: false, raw: str };
    const num = parseFloat(match[1]);
    if (isNaN(num)) return { animatable: false, raw: str };
    return {
      animatable: true,
      target: num,
      suffix: match[2] || '',
      decimals: match[1].includes('.') ? (match[1].split('.')[1] || '').length : 0,
      raw: str,
    };
  }, [value]);

  const hasAnimatedRef = React.useRef(false);
  const [displayValue, setDisplayValue] = React.useState(parsed.animatable ? 0 : parsed.raw);

  React.useEffect(() => {
    if (!parsed.animatable) {
      setDisplayValue(parsed.raw);
      return;
    }
    if (hasAnimatedRef.current) {
      // Re-render por cambio de valor después del mount inicial: salta directo al valor final
      setDisplayValue(formatCountUp(parsed.target, parsed.decimals, parsed.suffix));
      return;
    }
    hasAnimatedRef.current = true;
    const start = performance.now();
    const target = parsed.target;
    let raf;
    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = target * eased;
      setDisplayValue(formatCountUp(current, parsed.decimals, parsed.suffix));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplayValue(formatCountUp(target, parsed.decimals, parsed.suffix));
    };
    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [parsed, duration]);

  return <>{displayValue}</>;
}

function formatCountUp(num, decimals, suffix) {
  if (decimals > 0) {
    return num.toFixed(decimals) + suffix;
  }
  // Enteros con commas
  return Math.round(num).toLocaleString('es-MX') + suffix;
}


// --- ExpandableChart: wrap any chart/KPI to make it tap-to-fullscreen ---
function ExpandableChart({ title, description, children }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        className="expandable-chart-wrap"
        onClick={() => { haptic('light'); setOpen(true); }}
        role="button"
        tabIndex={0}
        aria-label={`Expandir ${title || 'gráfica'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
        }}
      >
        {children}
        <span className="expandable-chart-hint" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </span>
      </div>
      {open && (
        <>
          <div className="expandable-chart-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="expandable-chart-modal" role="dialog" aria-modal="true" aria-label={title || 'Gráfica expandida'}>
            <div className="expandable-chart-modal-header">
              <div>
                <div className="display" style={{ fontSize: 18, fontWeight: 500 }}>{title || 'Gráfica'}</div>
              </div>
              <button
                className="expandable-chart-close"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className="expandable-chart-modal-body">{children}</div>
            {description && (
              <div className="expandable-chart-modal-desc">
                <Icon name="info" size={14} style={{ flexShrink: 0, color: 'var(--blue)' }} />
                <span>{description}</span>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}




// --- Haptic feedback util (Día 5 Ronda 4 — Android only, iOS Safari no support) ---
function haptic(intensity = 'light') {
  try {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    const map = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(map[intensity] || 10);
  } catch (e) { /* silent fail */ }
}


// --- Pull-to-refresh hook (Día 5 Ronda 4) ---
function usePullToRefresh({ onRefresh, threshold = 80, scrollEl = null } = {}) {
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const startYRef = React.useRef(null);
  const elRef = React.useRef(null);

  React.useEffect(() => {
    const el = scrollEl || elRef.current;
    if (!el) return;
    if (typeof window === 'undefined' || window.innerWidth > 768) return; // solo mobile

    const onTouchStart = (e) => {
      if (el.scrollTop > 0) { startYRef.current = null; return; }
      startYRef.current = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (startYRef.current === null) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0 && el.scrollTop === 0) {
        const eased = Math.min(delta * 0.5, threshold * 1.5);
        setPullDistance(eased);
      }
    };
    const onTouchEnd = async () => {
      if (startYRef.current === null) return;
      startYRef.current = null;
      if (pullDistance >= threshold && !isRefreshing) {
        haptic('medium');
        setIsRefreshing(true);
        setPullDistance(threshold);
        try { await Promise.resolve(onRefresh && onRefresh()); }
        catch {}
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 600);
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, threshold, scrollEl, pullDistance, isRefreshing]);

  return { pullDistance, isRefreshing, scrollRef: elRef };
}

function PullToRefreshIndicator({ pullDistance, isRefreshing, threshold = 80 }) {
  if (pullDistance === 0 && !isRefreshing) return null;
  const progress = Math.min(pullDistance / threshold, 1);
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: '50%',
      transform: `translate(-50%, ${Math.min(pullDistance - 28, threshold - 28)}px)`,
      width: 36, height: 36,
      borderRadius: '50%',
      background: 'rgba(15, 22, 38, 0.92)',
      border: '1px solid var(--line-2)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      transition: isRefreshing ? 'transform 200ms var(--ease)' : 'none',
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="var(--teal)" strokeWidth="2" strokeLinecap="round"
           style={{
             transform: `rotate(${progress * 360}deg)`,
             animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
             opacity: 0.4 + (progress * 0.6),
           }}>
        <path d="M21 12a9 9 0 11-9-9" />
        <path d="M21 3v6h-6" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// --- Theme Toggle (Día 5 Ronda 4 — pedido por cliente) ---
function ThemeToggle() {
  const [theme, setTheme] = React.useState(() => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') || 'dark';
  });

  const toggle = () => {
    haptic('light');
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('polaris_theme', next); } catch {}
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
    </button>
  );
}

// --- Loading Skeletons ---
function SkeletonKPI({ accent }) {
  return (
    <div className="card card-pad" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
      {accent && <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        opacity: 0.7,
      }} />}
      <div className="skeleton skeleton-text" style={{ width: '40%', height: 10 }} />
      <div className="skeleton" style={{ width: '60%', height: 32, marginTop: 14, borderRadius: 6 }} />
      <div className="skeleton" style={{ width: '100%', height: 28, marginTop: 14, borderRadius: 6 }} />
    </div>
  );
}

function SkeletonCard({ height = 200 }) {
  return (
    <div className="card card-pad" style={{ padding: 20, height }}>
      <div className="skeleton skeleton-text" style={{ width: '50%', height: 12 }} />
      <div className="skeleton skeleton-text" style={{ width: '80%', height: 18, marginTop: 12 }} />
      <div className="flex items-c gap-3" style={{ marginTop: 18 }}>
        <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '70%', height: 14 }} />
          <div className="skeleton skeleton-text" style={{ width: '40%', height: 11, marginTop: 8 }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: '100%', height: 8, marginTop: 18, borderRadius: 4 }} />
    </div>
  );
}

function SkeletonChart({ height = 240 }) {
  return (
    <div style={{ width: '100%', height }}>
      <div className="skeleton skeleton-text" style={{ width: '35%', height: 14 }} />
      <div className="skeleton" style={{ width: '100%', height: height - 40, marginTop: 14, borderRadius: 8 }} />
    </div>
  );
}

// Make available globally
Object.assign(window, {
  PolarisLogo, Icon, Sparkline, AreaChart, HBar, Donut, Heatmap, Trend, Avatar, PlatformChip, KPI, ExpandableChart,
  SkeletonKPI, SkeletonCard, SkeletonChart, ThemeToggle,
  usePullToRefresh, PullToRefreshIndicator, haptic,
});
