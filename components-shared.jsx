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
    'logo-x':     <path d="M4 4l16 16M20 4L4 20" />,
    'logo-tt':    <><path d="M14 4v10a3 3 0 11-3-3" /><path d="M14 4c0 2.5 2 4.5 4.5 4.5" /></>,
    'logo-ig':    <><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.5" /><circle cx="17" cy="7" r="0.8" fill="currentColor" stroke="none" /></>,
    'logo-fb':    <path d="M14 21v-8h2.5l.5-3H14V8c0-1 .5-1.5 1.5-1.5H17V4h-2c-2.5 0-3 1.5-3 3v3H9.5v3H12v8z" />,
    'logo-yt':    <><rect x="3" y="6" width="18" height="12" rx="3" /><path d="M11 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none" /></>,
    'logo-tg':    <path d="M21 4L3 11l5 2 2 6 3-4 5 4z" />,
    'logo-wa':    <><path d="M4 20l1.5-4A8 8 0 1112 20z" /></>,
    'logo-w':     <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a13 13 0 010 18" /></>,
    'logo-r':     <><circle cx="12" cy="12" r="9" /><path d="M8 14c1 1 2.5 1.5 4 1.5s3-0.5 4-1.5" /></>,
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
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 3 }}>
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
    'TikTok': { c: '#FF4D6D', i: 'logo-tt' },
    'Instagram': { c: '#A78BFA', i: 'logo-ig' },
    'Facebook': { c: '#4D7CFF', i: 'logo-fb' },
    'YouTube': { c: '#FF4D6D', i: 'logo-yt' },
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
        <span className="metric-num">{value}</span>
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

// Make available globally
Object.assign(window, {
  PolarisLogo, Icon, Sparkline, AreaChart, HBar, Donut, Heatmap, Trend, Avatar, PlatformChip, KPI,
});
