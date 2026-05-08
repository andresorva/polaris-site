/* ============================================
   POLARIS — Landing Page
   ============================================ */

function LandingNav({ onLogin }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      padding: '18px 40px',
      borderBottom: '1px solid var(--line-1)',
      background: 'rgba(5,7,13,0.72)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-c gap-6">
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 19, fontWeight: 600, letterSpacing: '0.04em',
            color: 'var(--text-1)',
          }}>POLARIS<span style={{ color: 'var(--teal)' }}>.</span></span>
          <span className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', borderLeft: '1px solid var(--line-2)', paddingLeft: 16 }}>by Datanaat</span>
        </div>
        <div className="flex items-c gap-6">
          <a className="t-2" style={{ fontSize: 13, fontWeight: 500 }}>Producto</a>
          <a className="t-2" style={{ fontSize: 13, fontWeight: 500 }}>Plataformas</a>
          <a className="t-2" style={{ fontSize: 13, fontWeight: 500 }}>Casos de uso</a>
          <a className="t-2" style={{ fontSize: 13, fontWeight: 500 }}>Precios</a>
          <a className="t-2" style={{ fontSize: 13, fontWeight: 500 }}>Documentación</a>
        </div>
        <div className="flex items-c gap-3">
          <button className="btn btn-ghost btn-sm" onClick={onLogin}>Iniciar sesión</button>
          <button className="btn btn-primary btn-sm" onClick={onLogin}>
            Solicitar acceso <Icon name="arrow-r" size={14} />
          </button>
        </div>
      </div>
    </nav>
  );
}

function HeroPreview() {
  // Mini dashboard preview floating in hero
  const series = genSentimentSeries(2, 64, 9, 30);
  return (
    <div style={{
      position: 'relative',
      borderRadius: 16,
      border: '1px solid var(--line-2)',
      background: 'linear-gradient(180deg, rgba(15,22,38,0.9), rgba(10,14,26,0.7))',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(46,230,200,0.08)',
      overflow: 'hidden',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Window chrome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--line-1)', background: 'var(--bg-1)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: 'rgba(255,77,109,0.6)' }} />
          <div style={{ width: 10, height: 10, borderRadius: 999, background: 'rgba(255,181,70,0.6)' }} />
          <div style={{ width: 10, height: 10, borderRadius: 999, background: 'rgba(46,230,200,0.6)' }} />
        </div>
        <div className="mono t-3" style={{ fontSize: 11, marginLeft: 8 }}>polaris.datanaat.com / dashboard / mc / overview</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="dot live" />
          <span className="mono t-3" style={{ fontSize: 10 }}>EN VIVO</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Left: KPIs + chart */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { l: 'Sentimiento', v: '68', d: 12.4, c: '#2EE6C8' },
              { l: 'Menciones 24h', v: '142K', d: 24.8, c: '#4D7CFF' },
              { l: 'Alcance', v: '4.2M', d: 8.1, c: '#A78BFA' },
            ].map((k, i) => (
              <div key={i} style={{ padding: 12, background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 10 }}>
                <div className="eyebrow" style={{ fontSize: 9 }}>{k.l}</div>
                <div className="display" style={{ fontSize: 22, fontWeight: 500, marginTop: 6, color: k.c }}>{k.v}</div>
                <Trend value={k.d} />
              </div>
            ))}
          </div>
          <div style={{ padding: 16, background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 10 }}>
            <div className="flex between items-c" style={{ marginBottom: 10 }}>
              <div className="display t-1" style={{ fontSize: 13, fontWeight: 500 }}>Sentimiento · 30 días</div>
              <div className="flex gap-2">
                <span className="pill teal" style={{ padding: '2px 8px', fontSize: 10 }}><span className="dot" style={{ background: '#2EE6C8' }} />Pos</span>
                <span className="pill" style={{ padding: '2px 8px', fontSize: 10 }}><span className="dot" style={{ background: '#6B7794' }} />Neu</span>
                <span className="pill coral" style={{ padding: '2px 8px', fontSize: 10 }}><span className="dot" style={{ background: '#FF4D6D' }} />Neg</span>
              </div>
            </div>
            <AreaChart data={series} height={140} showAxis={false} />
          </div>
        </div>
        {/* Right: live feed */}
        <div style={{ padding: 14, background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 10 }}>
          <div className="flex between items-c" style={{ marginBottom: 12 }}>
            <div className="display t-1" style={{ fontSize: 12, fontWeight: 500 }}>Stream en vivo</div>
            <span className="dot live" />
          </div>
          <div className="flex col gap-3">
            {FEED_ITEMS.slice(0, 3).map(f => (
              <div key={f.id} style={{ paddingBottom: 10, borderBottom: '1px solid var(--line-1)' }}>
                <div className="flex items-c gap-2" style={{ marginBottom: 4 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--bg-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={f.platform === 'X' ? 'logo-x' : f.platform === 'TikTok' ? 'logo-tt' : 'logo-ig'} size={9} />
                  </div>
                  <div className="t-1" style={{ fontSize: 10, fontWeight: 600 }}>{f.handle}</div>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: f.sentiment === 'pos' ? '#2EE6C8' : f.sentiment === 'neg' ? '#FF4D6D' : '#6B7794', marginLeft: 'auto' }} />
                </div>
                <div className="t-2" style={{ fontSize: 10, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{f.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroStarCompass() {
  return (
    <div className="hero-star-wrap" aria-hidden="true">
      <svg className="hero-star" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="20%" stopColor="#A6FFE0" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#2EE6C8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#2EE6C8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2EE6C8" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#4D7CFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#4D7CFF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="rayV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2EE6C8" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#2EE6C8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rayH" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2EE6C8" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#2EE6C8" stopOpacity="0" />
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer halo */}
        <circle cx="250" cy="250" r="220" fill="url(#halo)" opacity="0.55" />

        {/* Expanding rings (data pulse) */}
        <circle className="expand-ring" cx="250" cy="250" r="80" fill="none" stroke="#2EE6C8" strokeWidth="1" opacity="0.5" />
        <circle className="expand-ring r2" cx="250" cy="250" r="80" fill="none" stroke="#4D7CFF" strokeWidth="1" opacity="0.5" />
        <circle className="expand-ring r3" cx="250" cy="250" r="80" fill="none" stroke="#A78BFA" strokeWidth="1" opacity="0.4" />

        {/* Orbits */}
        <g className="orbit-1">
          <ellipse cx="250" cy="250" rx="170" ry="60" fill="none" stroke="#4D7CFF" strokeOpacity="0.35" strokeWidth="1" />
          <circle className="dot d1" cx="420" cy="250" r="4" fill="#2EE6C8" />
          <circle className="dot d2" cx="80" cy="250" r="3" fill="#4D7CFF" />
          <circle className="dot d3" cx="335" cy="302" r="2.5" fill="#A78BFA" />
        </g>

        <g className="orbit-2">
          <ellipse cx="250" cy="250" rx="120" ry="180" fill="none" stroke="#2EE6C8" strokeOpacity="0.3" strokeWidth="1" transform="rotate(35 250 250)" />
          <circle className="dot d4" cx="250" cy="70" r="3" fill="#2EE6C8" />
          <circle className="dot d5" cx="250" cy="430" r="2.5" fill="#A6FFE0" />
          <circle className="dot d6" cx="370" cy="250" r="2" fill="#A78BFA" />
        </g>

        {/* 4-point star rays */}
        <g className="star-rays" filter="url(#softGlow)">
          <rect x="248" y="80" width="4" height="340" fill="url(#rayV)" rx="2" />
          <rect x="80" y="248" width="340" height="4" fill="url(#rayH)" rx="2" />
          <g transform="rotate(45 250 250)" opacity="0.55">
            <rect x="249" y="140" width="2" height="220" fill="url(#rayV)" rx="1" />
          </g>
          <g transform="rotate(-45 250 250)" opacity="0.55">
            <rect x="249" y="140" width="2" height="220" fill="url(#rayV)" rx="1" />
          </g>
        </g>

        {/* Core */}
        <g className="star-core">
          <circle cx="250" cy="250" r="60" fill="url(#coreGlow)" opacity="0.9" />
          <circle cx="250" cy="250" r="14" fill="#FFFFFF" />
          <circle cx="250" cy="250" r="26" fill="#FFFFFF" opacity="0.25" />
        </g>

        {/* Floating data labels */}
        <g fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#9CA3AF">
          <text x="36" y="44" opacity="0.7">⊙ NORTH 90°</text>
          <text x="380" y="44" opacity="0.7">LIVE ●</text>
          <text x="36" y="468" opacity="0.5">SIG: 0.94</text>
          <text x="380" y="468" opacity="0.7">15ms ↻</text>
        </g>

        {/* Tiny tick marks framing */}
        <g stroke="#1F2937" strokeWidth="1">
          <line x1="20" y1="60" x2="36" y2="60" />
          <line x1="20" y1="60" x2="20" y2="76" />
          <line x1="480" y1="60" x2="464" y2="60" />
          <line x1="480" y1="60" x2="480" y2="76" />
          <line x1="20" y1="440" x2="36" y2="440" />
          <line x1="20" y1="440" x2="20" y2="424" />
          <line x1="480" y1="440" x2="464" y2="440" />
          <line x1="480" y1="440" x2="480" y2="424" />
        </g>
      </svg>
    </div>
  );
}

function _HeroStarCompass_OLD() {
  const wrapRef = React.useRef(null);
  const [m, setM] = React.useState({ x: 0.5, y: 0.5, active: false });

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      setM({ x: Math.max(-0.4, Math.min(1.4, x)), y: Math.max(-0.4, Math.min(1.4, y)), active: true });
    };
    const onLeave = () => setM(s => ({ ...s, active: false }));
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Cursor parallax offsets
  const px = (m.x - 0.5) * 30; // halo offset
  const py = (m.y - 0.5) * 30;

  return (
    <div ref={wrapRef} style={{
      position: 'relative',
      aspectRatio: '1 / 1',
      width: '100%', maxWidth: 560,
      justifySelf: 'end',
    }}>
      {/* Background grid + radial fade */}
      <div style={{
        position: 'absolute', inset: '-10%',
        backgroundImage: `
          linear-gradient(rgba(46,230,200,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(46,230,200,0.08) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
        maskImage: 'radial-gradient(circle at center, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 75%)',
      }} />

      {/* Cursor-following halo */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at ${50 + (m.x - 0.5) * 100}% ${50 + (m.y - 0.5) * 100}%, rgba(46,230,200,0.22), rgba(77,124,255,0.08) 30%, transparent 60%)`,
        transition: 'background 240ms var(--ease)',
        pointerEvents: 'none',
      }} />

      {/* Diffused background glow (breathing) */}
      <div style={{
        position: 'absolute', inset: '15%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46,230,200,0.32), rgba(77,124,255,0.12) 40%, transparent 70%)',
        filter: 'blur(24px)',
        animation: 'compassBreath 4.5s ease-in-out infinite',
        transform: `translate(${px * 0.4}px, ${py * 0.4}px)`,
        transition: 'transform 400ms var(--ease)',
      }} />

      {/* Corner labels */}
      <div className="mono" style={{ position: 'absolute', top: '8%', left: '12%', fontSize: 10, letterSpacing: '0.14em', color: 'var(--text-3)' }}>
        <span style={{ color: 'var(--teal)' }}>◎</span> NORTH 90°
      </div>
      <div className="mono" style={{ position: 'absolute', top: '8%', right: '8%', fontSize: 10, letterSpacing: '0.14em', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        LIVE <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--teal)', boxShadow: '0 0 8px var(--teal)' }} />
      </div>
      <div className="mono" style={{ position: 'absolute', bottom: '8%', left: '20%', fontSize: 10, letterSpacing: '0.14em', color: 'var(--text-4)' }}>
        SIG: 0.94
      </div>
      <div className="mono" style={{ position: 'absolute', bottom: '8%', right: '12%', fontSize: 10, letterSpacing: '0.14em', color: 'var(--text-4)' }}>
        11ms ↻
      </div>
      {/* Frame ticks (top-left bracket) */}
      <svg style={{ position: 'absolute', top: '12%', left: '8%', width: 60, height: 60, pointerEvents: 'none' }} viewBox="0 0 60 60">
        <path d="M 0 20 L 0 0 L 20 0" stroke="rgba(46,230,200,0.4)" strokeWidth="1" fill="none" />
      </svg>
      <svg style={{ position: 'absolute', top: '12%', right: '8%', width: 60, height: 60, pointerEvents: 'none' }} viewBox="0 0 60 60">
        <path d="M 60 20 L 60 0 L 40 0" stroke="rgba(46,230,200,0.4)" strokeWidth="1" fill="none" />
      </svg>

      {/* Central scene — orbits + star, with cursor parallax */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `translate(${px}px, ${py}px)`,
        transition: 'transform 320ms var(--ease)',
      }}>
        <svg viewBox="-200 -200 400 400" style={{ width: '78%', height: '78%', overflow: 'visible' }}>
          <defs>
            <radialGradient id="starCore" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="40%" stopColor="#2EE6C8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#2EE6C8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="starHalo" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#2EE6C8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2EE6C8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="orbitGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#2EE6C8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#4D7CFF" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Outer orbit — slow rotate */}
          <g style={{ transformOrigin: '0px 0px', animation: 'orbitSpin 28s linear infinite' }}>
            <ellipse cx="0" cy="0" rx="170" ry="120" fill="none" stroke="url(#orbitGrad)" strokeWidth="0.7" opacity="0.55" />
            <circle cx="170" cy="0" r="3" fill="#A78BFA">
              <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="-100" cy="-66" r="2.5" fill="#2EE6C8">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2.2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Mid orbit — counter rotate */}
          <g style={{ transformOrigin: '0px 0px', animation: 'orbitSpinRev 18s linear infinite' }}>
            <ellipse cx="0" cy="0" rx="130" ry="155" fill="none" stroke="#4D7CFF" strokeWidth="0.6" opacity="0.45" transform="rotate(28)" />
            <circle cx="115" cy="60" r="2.5" fill="#4D7CFF">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="-110" cy="80" r="2" fill="#2EE6C8">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Inner orbit */}
          <g style={{ transformOrigin: '0px 0px', animation: 'orbitSpin 12s linear infinite' }}>
            <ellipse cx="0" cy="0" rx="95" ry="80" fill="none" stroke="#2EE6C8" strokeWidth="0.5" opacity="0.5" transform="rotate(-15)" />
            <circle cx="-92" cy="-20" r="2" fill="#2EE6C8">
              <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="80" cy="40" r="1.8" fill="#A78BFA">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2.4s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Star halo (breathing) */}
          <circle cx="0" cy="0" r="80" fill="url(#starHalo)">
            <animate attributeName="r" values="65;90;65" dur="3.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;1;0.5" dur="3.6s" repeatCount="indefinite" />
          </circle>

          {/* Star rays (4-point + diagonals) */}
          <g style={{ transformOrigin: '0px 0px' }}>
            <path d="M 0 -160 L 0 160" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite" />
            </path>
            <path d="M -160 0 L 160 0" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite" />
            </path>
            <path d="M -100 -100 L 100 100" stroke="rgba(46,230,200,0.5)" strokeWidth="0.8" strokeLinecap="round">
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3s" repeatCount="indefinite" />
            </path>
            <path d="M 100 -100 L -100 100" stroke="rgba(46,230,200,0.5)" strokeWidth="0.8" strokeLinecap="round">
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Star core glow */}
          <circle cx="0" cy="0" r="42" fill="url(#starCore)">
            <animate attributeName="r" values="36;48;36" dur="2.4s" repeatCount="indefinite" />
          </circle>
          {/* Star center white dot */}
          <circle cx="0" cy="0" r="9" fill="#FFFFFF" />
          <circle cx="0" cy="0" r="6" fill="#E8FFF9">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="1.6s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </div>
  );
}

function Hero({ onLogin }) {
  return (
    <section style={{ position: 'relative', padding: '80px 40px 60px', overflow: 'hidden' }}>
      {/* Background grid + glow */}
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
      <div className="glow-teal" />
      <div className="glow-blue" />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(167,139,250,0.08), transparent 70%)',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', gap: 48, alignItems: 'center' }}>
        {/* LEFT — text */}
        <div style={{ position: 'relative' }}>
        {/* Eyebrow */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 14px', border: '1px solid var(--line-2)', borderRadius: 999, background: 'rgba(15,22,38,0.6)', backdropFilter: 'blur(8px)' }}>
          <span className="dot live" />
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-2)' }}>POLARIS v2.4 · DISPONIBLE EN AMÉRICA LATINA</span>
        </div>

        {/* Headline */}
        <h1 className="display" style={{
          fontSize: 'clamp(40px, 5.6vw, 76px)',
          fontWeight: 500,
          letterSpacing: '-0.04em',
          lineHeight: 0.98,
          margin: '32px 0 0',
          color: 'var(--text-1)',
        }}>
          La realidad política,<br />
          <span style={{
            background: 'linear-gradient(90deg, #2EE6C8 0%, #4D7CFF 50%, #A78BFA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>medida en tiempo real.</span>
        </h1>

        <p className="t-2" style={{
          fontSize: 17,
          lineHeight: 1.55,
          maxWidth: 560,
          margin: '24px 0 0',
          fontWeight: 400,
        }}>
          POLARIS unifica X, TikTok, Instagram, medios y mensajería pública en un solo
          panel operativo. Sentimiento auditable, redes coordinadas detectadas, alertas
          que llegan antes que la noticia.
        </p>

        <div className="flex items-c gap-3" style={{ marginTop: 32 }}>
          <button className="btn btn-primary" style={{ padding: '14px 22px', fontSize: 14 }} onClick={onLogin}>
            Solicitar demo <Icon name="arrow-r" size={15} />
          </button>
          <button className="btn" style={{ padding: '14px 22px', fontSize: 14 }} onClick={onLogin}>
            <Icon name="play" size={13} /> Ver POLARIS en acción
          </button>
        </div>
        </div>

        {/* RIGHT — animated star compass */}
        <HeroStarCompass />
      </div>

      {/* Trust strip — full width below the grid */}
      <div style={{ maxWidth: 1280, margin: '56px auto 0', position: 'relative' }}>
        <div className="flex items-c gap-6" style={{ paddingTop: 24, borderTop: '1px solid var(--line-1)' }}>
          <div className="eyebrow">Operando para</div>
          <div className="flex items-c gap-8 wrap" style={{ flex: 1 }}>
            {['CAMPAÑA-MX-26', 'OBSERVATORIO LATAM', 'PARTIDO-MX', 'GABINETE-MX', 'ANALISTA-MX', 'MEDIOS-MX'].map(n => (
              <span key={n} className="mono t-3" style={{ fontSize: 11, letterSpacing: '0.12em' }}>{n}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const items = [
    { icon: 'spark', title: 'Datos dispersos', desc: 'Tu equipo monitorea 8 plataformas a la vez. Cada una con su propia interfaz, sus propias métricas, su propia ventana de tiempo.' },
    { icon: 'broadcast', title: 'Ruido vs señal', desc: 'Por cada conversación que importa hay 200 que no. Encontrar el patrón requiere horas humanas que no tienes.' },
    { icon: 'shield', title: 'Ataques coordinados', desc: 'Las redes de bots y campañas pagas son sofisticadas. Detectarlas a ojo es imposible cuando publican sincronizadas.' },
    { icon: 'history', title: 'Reaccionar tarde', desc: 'Para cuando una narrativa llega a los medios, ya lleva 6 horas circulando. Para entonces, ya es tarde.' },
  ];
  return (
    <section style={{ padding: '120px 40px', borderTop: '1px solid var(--line-1)', position: 'relative' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="eyebrow">El problema</div>
        <h2 className="display" style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 500, letterSpacing: '-0.03em', margin: '16px 0 0', maxWidth: 900, lineHeight: 1.05 }}>
          Hacer política con instinto<br />
          <span className="t-3">ya no alcanza.</span>
        </h2>
        <p className="t-2" style={{ fontSize: 17, maxWidth: 640, marginTop: 24, lineHeight: 1.55 }}>
          La conversación pública se mueve más rápido que cualquier reunión de gabinete.
          Quien mide, gana. Quien improvisa, pierde la narrativa.
        </p>

        <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'var(--line-1)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--line-1)' }}>
          {items.map((it, i) => (
            <div key={i} style={{ padding: 36, background: 'var(--bg-1)', minHeight: 200 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-3)', border: '1px solid var(--line-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)' }}>
                <Icon name={it.icon} size={20} />
              </div>
              <h3 className="display" style={{ fontSize: 22, fontWeight: 500, margin: '20px 0 8px', letterSpacing: '-0.02em' }}>{it.title}</h3>
              <p className="t-2" style={{ fontSize: 14, lineHeight: 1.55, margin: 0, maxWidth: 480 }}>{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ onShowAgents }) {
  const steps = [
    { n: '01', title: 'Conecta', desc: 'Activamos tus fuentes en 24 horas: X, TikTok, Instagram, Facebook, YouTube, Telegram, medios y WhatsApp pública.' },
    { n: '02', title: 'Calibra', desc: 'Definimos tus actores: políticos a monitorear, narrativas críticas, regiones, idiomas, vocabulario propio del país.' },
    { n: '03', title: 'Procesa', desc: 'Nuestro motor clasifica sentimiento, detecta redes coordinadas, geolocaliza menciones y rastrea el origen de cada narrativa.' },
    { n: '04', title: 'Decide', desc: 'Tu equipo recibe alertas accionables, reportes ejecutivos y dashboards en vivo. Acción en minutos, no en días.' },
  ];
  return (
    <section style={{ padding: '120px 40px', borderTop: '1px solid var(--line-1)', position: 'relative' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="flex between items-s wrap gap-6" style={{ marginBottom: 64 }}>
          <div>
            <div className="eyebrow">Cómo funciona</div>
            <h2 className="display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 500, letterSpacing: '-0.03em', margin: '16px 0 0', lineHeight: 1.05, maxWidth: 700 }}>
              Cuatro pasos. <span className="t-teal">De cero a operativo en una semana.</span>
            </h2>
          </div>
          <button className="btn" onClick={onShowAgents} style={{
            position: 'relative', overflow: 'hidden',
            borderColor: 'rgba(46,230,200,0.4)',
            background: 'linear-gradient(135deg, rgba(46,230,200,0.08), rgba(77,124,255,0.06))',
          }}>
            <span className="dot live" style={{ width: 6, height: 6 }} />
            <Icon name="spark" size={14} /> Ver los 9 agentes de IA <Icon name="arrow-r" size={12} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative' }}>
          {/* Connection line */}
          <div style={{ position: 'absolute', top: 32, left: '12.5%', right: '12.5%', height: 1, background: 'linear-gradient(90deg, transparent, var(--teal) 20%, var(--blue) 50%, var(--purple) 80%, transparent)', opacity: 0.4 }} />

          {steps.map((s, i) => (
            <div key={i} style={{ padding: 24, background: 'var(--bg-1)', border: '1px solid var(--line-1)', borderRadius: 14, position: 'relative' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--bg-2)', border: '1px solid var(--line-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span className="display" style={{ fontSize: 22, fontWeight: 500, color: 'var(--teal)', letterSpacing: '-0.03em' }}>{s.n}</span>
                <div style={{ position: 'absolute', inset: -1, borderRadius: 16, border: '1px solid var(--teal)', opacity: 0.3 }} />
              </div>
              <h3 className="display" style={{ fontSize: 22, fontWeight: 500, margin: '24px 0 8px', letterSpacing: '-0.02em' }}>{s.title}</h3>
              <p className="t-2" style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    { icon: 'pulse', accent: '#2EE6C8', title: 'Stream en vivo multiplataforma',
      desc: 'X, TikTok, Instagram, Facebook, YouTube, Telegram y mensajería pública en un solo feed unificado.',
      detail: ['Latencia <15s en X', 'Filtros booleanos avanzados', 'Geolocalización a nivel municipio'] },
    { icon: 'chart', accent: '#4D7CFF', title: 'Sentimiento auditable',
      desc: 'Cada clasificación incluye su evidencia. Modelo entrenado en español, portugués e inglés latinoamericano.',
      detail: ['F1 score 0.91 en pruebas LATAM', 'Sarcasmo e ironía detectados', 'Re-clasificable por tu equipo'] },
    { icon: 'crosshair', accent: '#A78BFA', title: 'Detección de redes coordinadas',
      desc: 'Identificamos cuentas que publican sincronizadas, repiten estructuras, o muestran patrones de bot.',
      detail: ['Análisis de grafo en vivo', 'Score de sospecha por cuenta', 'Visualización de clusters'] },
    { icon: 'bell', accent: '#FFB546', title: 'Alertas en tiempo real',
      desc: 'Tu equipo se entera antes que el resto del país. Webhooks, Slack, email, SMS, WhatsApp interno.',
      detail: ['Reglas custom sin código', 'Severidad y deduplicación', 'Tiempo de aviso: <60 segundos'] },
    { icon: 'doc', accent: '#FF4D6D', title: 'Reportes generados con IA',
      desc: 'Reportes ejecutivos diarios, semanales o por evento. Listos para imprimir, enviar al jefe de campaña.',
      detail: ['Plantillas personalizables', 'Auto-traducción ES/PT/EN', 'Citas y enlaces verificables'] },
    { icon: 'shield', accent: '#2EE6C8', title: 'Auditoría y cumplimiento',
      desc: 'Trazabilidad total. Cada dato muestra su fuente, su captura, su clasificación. Conforme a GDPR y leyes locales.',
      detail: ['Exportación forense', 'Logs de acceso por usuario', 'Datos en jurisdicción local'] },
  ];
  return (
    <section style={{ padding: '120px 40px', borderTop: '1px solid var(--line-1)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="eyebrow">Capacidades</div>
        <h2 className="display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 500, letterSpacing: '-0.03em', margin: '16px 0 64px', lineHeight: 1.05, maxWidth: 800 }}>
          Una plataforma que reemplaza<br /><span className="t-3">cinco herramientas que ya pagas.</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} className="card lift" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 80, height: 80, background: `radial-gradient(circle at 0 0, ${f.accent}22, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-3)', border: '1px solid var(--line-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: f.accent }}>
                <Icon name={f.icon} size={18} />
              </div>
              <h3 className="display" style={{ fontSize: 19, fontWeight: 500, margin: '20px 0 8px', letterSpacing: '-0.015em' }}>{f.title}</h3>
              <p className="t-2" style={{ fontSize: 13, lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {f.detail.map((d, j) => (
                  <li key={j} className="flex items-c gap-2" style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    <Icon name="check" size={12} strokeWidth={2.2} style={{ color: f.accent, flexShrink: 0 }} /> {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlatformsStrip() {
  const platforms = [
    { name: 'X', icon: 'logo-x', color: '#fff' },
    { name: 'TikTok', icon: 'logo-tt', color: '#FF4D6D' },
    { name: 'Instagram', icon: 'logo-ig', color: '#A78BFA' },
    { name: 'Facebook', icon: 'logo-fb', color: '#4D7CFF' },
    { name: 'YouTube', icon: 'logo-yt', color: '#FF4D6D' },
    { name: 'Telegram', icon: 'logo-tg', color: '#4D7CFF' },
    { name: 'WhatsApp', icon: 'logo-wa', color: '#2EE6C8' },
    { name: 'Web', icon: 'logo-w', color: '#FFB546' },
    { name: 'Reddit', icon: 'logo-r', color: '#FFB546' },
  ];
  return (
    <section style={{ padding: '80px 40px', borderTop: '1px solid var(--line-1)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        <div className="flex between items-c wrap gap-6">
          <div>
            <div className="eyebrow">Plataformas conectadas</div>
            <h2 className="display" style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.025em', margin: '12px 0 0' }}>
              9 fuentes. 1 panel. <span className="t-3">Datos cada 12 segundos.</span>
            </h2>
          </div>
          <div className="mono t-3" style={{ fontSize: 12, letterSpacing: '0.06em' }}>+ APIs personalizadas bajo demanda</div>
        </div>

        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 12 }}>
          {platforms.map((p, i) => (
            <div key={i} className="card lift" style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-3)', border: '1px solid var(--line-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: p.color }}>
                <Icon name={p.icon} size={22} strokeWidth={1.8} />
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.04em' }}>{p.name}</div>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--teal)', boxShadow: '0 0 8px var(--teal-glow)' }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricsBand() {
  const stats = [
    { v: '12s', l: 'Latencia mediana', s: 'desde captura hasta tu pantalla' },
    { v: '99.97%', l: 'Uptime garantizado', s: 'SLA empresarial' },
    { v: '0.91', l: 'F1 sentimiento ES', s: 'auditado por terceros' },
    { v: '8.4M', l: 'Menciones diarias', s: 'procesadas en LATAM' },
  ];
  return (
    <section style={{ padding: '80px 40px', borderTop: '1px solid var(--line-1)', borderBottom: '1px solid var(--line-1)', background: 'var(--bg-1)', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ paddingLeft: i ? 0 : 0, borderLeft: i ? '1px solid var(--line-1)' : 'none', paddingLeft: 24 }}>
            <div className="display" style={{ fontSize: 64, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-1)' }}>
              {s.v}
            </div>
            <div className="t-1" style={{ fontSize: 14, fontWeight: 500, marginTop: 12 }}>{s.l}</div>
            <div className="t-3" style={{ fontSize: 12, marginTop: 4 }}>{s.s}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactSection({ onLogin }) {
  return (
    <section style={{ padding: '120px 40px', position: 'relative', overflow: 'hidden' }}>
      <div className="glow-teal" style={{ opacity: 0.6 }} />
      <div className="glow-purple" style={{ opacity: 0.6 }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        <div className="card" style={{ padding: 64, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(15,22,38,0.9), rgba(10,14,26,0.7))' }}>
          <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
          <div style={{ position: 'absolute', top: -40, right: -40, width: 320, height: 320, background: 'radial-gradient(circle, rgba(46,230,200,0.15), transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 64, alignItems: 'start', position: 'relative' }}>
            <div>
              <div className="eyebrow">Solicitar acceso</div>
              <h2 className="display" style={{ fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 500, letterSpacing: '-0.03em', margin: '16px 0 0', lineHeight: 1.05 }}>
                ¿Tu campaña está lista para<br /><span className="t-teal">operar con datos en vivo?</span>
              </h2>
              <p className="t-2" style={{ fontSize: 16, lineHeight: 1.55, marginTop: 24, maxWidth: 540 }}>
                POLARIS está disponible para campañas, partidos, observatorios y medios.
                Implementación guiada por nuestro equipo en 5-7 días hábiles.
              </p>

              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Implementación', 'Equipo dedicado · 5-7 días'],
                  ['Soporte', 'Slack compartido · 12h/día · ES/EN'],
                  ['Datos', 'Almacenados en jurisdicción local'],
                  ['Confidencialidad', 'NDA mutuo antes de cualquier conversación'],
                ].map((row, i) => (
                  <div key={i} className="flex between items-c" style={{ padding: '12px 0', borderBottom: '1px solid var(--line-1)' }}>
                    <span className="mono t-3" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{row[0]}</span>
                    <span className="t-1" style={{ fontSize: 13, fontWeight: 500 }}>{row[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div style={{ padding: 28, background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 14 }}>
              <div className="display" style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Hablemos</div>
              <div className="t-3" style={{ fontSize: 12 }}>Te respondemos en 24 horas hábiles</div>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Organización</label>
                  <input className="input" placeholder="Campaña / partido / observatorio" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nombre</label>
                    <input className="input" placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>País</label>
                    <select className="input" defaultValue="México">
                      <option>México</option>
                      <option>Colombia</option>
                      <option>Argentina</option>
                      <option>Chile</option>
                      <option>Otro</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email corporativo</label>
                  <input className="input" placeholder="tu@organizacion.com" type="email" />
                </div>
                <div>
                  <label className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Cuéntanos brevemente</label>
                  <textarea className="input" rows="3" style={{ resize: 'vertical' }} placeholder="¿Qué quieres monitorear? ¿Cuántas personas usarán POLARIS?"></textarea>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 14, marginTop: 8 }} onClick={onLogin}>
                  Enviar solicitud <Icon name="arrow-r" size={14} />
                </button>
                <div className="t-4" style={{ fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                  Al enviar aceptas nuestra <a className="t-3" style={{ textDecoration: 'underline' }}>Política de Privacidad</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { h: 'Producto', l: ['Plataforma', 'Conectores', 'API', 'Seguridad', 'Changelog'] },
    { h: 'Casos de uso', l: ['Campañas', 'Partidos políticos', 'Observatorios', 'Medios y prensa', 'Análisis académico'] },
    { h: 'Recursos', l: ['Documentación', 'Estado del sistema', 'Blog', 'Webinars', 'Estudios de caso'] },
    { h: 'Datanaat', l: ['Sobre nosotros', 'Equipo', 'Carreras', 'Prensa', 'Contacto'] },
  ];
  return (
    <footer style={{ padding: '80px 40px 40px', borderTop: '1px solid var(--line-1)', background: 'var(--bg-1)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 48 }}>
          <div>
            <PolarisLogo size={22} />
            <p className="t-3" style={{ fontSize: 13, lineHeight: 1.55, marginTop: 16, maxWidth: 280 }}>
              Inteligencia política operativa, hecha en América Latina, para América Latina.
            </p>
            <div className="flex gap-2" style={{ marginTop: 20 }}>
              {['logo-x', 'logo-yt', 'logo-ig'].map(i => (
                <button key={i} className="btn btn-icon btn-sm" style={{ width: 32, height: 32 }}>
                  <Icon name={i} size={14} />
                </button>
              ))}
            </div>
          </div>
          {cols.map((c, i) => (
            <div key={i}>
              <div className="display" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 16 }}>{c.h}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {c.l.map((l, j) => (
                  <li key={j} className="t-3" style={{ fontSize: 13, cursor: 'pointer' }}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex between items-c wrap gap-3" style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--line-1)' }}>
          <div className="mono t-4" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
            © 2024 DATANAAT · POLARIS v2.4.1 · TODOS LOS DERECHOS RESERVADOS
          </div>
          <div className="flex gap-6">
            <span className="t-4" style={{ fontSize: 11 }}>Privacidad</span>
            <span className="t-4" style={{ fontSize: 11 }}>Términos</span>
            <span className="t-4" style={{ fontSize: 11 }}>Cumplimiento</span>
            <span className="t-4" style={{ fontSize: 11 }}>Estado: <span className="t-pos">operativo</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LandingPage({ onNavigate }) {
  const goLogin = () => onNavigate('login');
  const [agentsOpen, setAgentsOpen] = React.useState(false);
  return (
    <div className="page-in" data-screen-label="01 Landing" style={{ background: 'transparent', position: 'relative', zIndex: 2 }}>
      <LandingNav onLogin={goLogin} />
      <Hero onLogin={goLogin} />
      <PlatformsStrip />
      <ProblemSection />
      <HowItWorks onShowAgents={() => setAgentsOpen(true)} />
      <FeaturesGrid />
      <MetricsBand />
      <ContactSection onLogin={goLogin} />
      <Footer />
      <AgentsModal open={agentsOpen} onClose={() => setAgentsOpen(false)} />
    </div>
  );
}

window.LandingPage = LandingPage;
