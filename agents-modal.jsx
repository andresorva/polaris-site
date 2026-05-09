/* ============================================
   POLARIS — 9 Agents AI Mission Control
   Glassmorphism reveal modal with animated pipeline
   ============================================ */

const AGENTS = [
  {
    n: '01', emoji: '🔌', name: 'Centinela',
    role: 'Captura',
    desc: 'Monitorea en tiempo real 9+ plataformas sociales, medios digitales y foros. Captura cada mención, comentario, reacción y hashtag relevante. Opera 24/7 sin interrupciones. Primer filtro de relevancia.',
    icon: 'plug', color: '#2EE6C8', volume: '968K menciones / día',
  },
  {
    n: '02', emoji: '🏷️', name: 'Clasificador',
    role: 'Taxonomía',
    desc: 'Categoriza cada mención por tema: seguridad, obras públicas, economía, salud, educación, transparencia, y 30+ categorías políticas. Identifica el contexto y la intención del mensaje.',
    icon: 'filter', color: '#4D7CFF', volume: '36 categorías activas',
  },
  {
    n: '03', emoji: '💡', name: 'Empatía',
    role: 'Sentimiento',
    desc: 'Motor de sentimiento con IA entrenada en español de América Latina. Detecta sarcasmo, albures, doble sentido y contexto cultural. Clasifica cada mención como positiva, negativa, neutral o mixta con 94% de precisión.',
    icon: 'heart', color: '#A78BFA', volume: '94.2% precisión',
  },
  {
    n: '04', emoji: '👥', name: 'Radar Social',
    role: 'Influencia',
    desc: 'Mapea redes de usuarios, identifica influenciadores y críticos. Detecta patrones de coordinación entre cuentas. Rastrea la propagación de narrativas y mide el alcance real de cada conversación.',
    icon: 'users', color: '#FFB546', volume: '2.4M cuentas mapeadas',
  },
  {
    n: '05', emoji: '🔗', name: 'Tejedor',
    role: 'Cross-platform',
    desc: 'Cruza información entre plataformas. Detecta cuando la misma persona opera múltiples cuentas. Conecta hilos narrativos fragmentados. Construye el mapa completo de la conversación pública.',
    icon: 'spark', color: '#2EE6C8', volume: '12 redes coordinadas detectadas',
  },
  {
    n: '06', emoji: '📊', name: 'Analista',
    role: 'Métricas',
    desc: 'Procesa los datos unificados y calcula métricas avanzadas: Political Popularity Index (PPI), Share of Voice, Momentum, índices de crisis. Compara contra baseline histórico.',
    icon: 'chart', color: '#4D7CFF', volume: 'PPI · SoV · Momentum',
  },
  {
    n: '07', emoji: '🔮', name: 'Oráculo',
    role: 'Predictivo',
    desc: 'Motor predictivo que identifica tendencias emergentes antes de que se vuelvan virales. Detecta señales tempranas de crisis. Predice el impacto potencial de temas sensibles.',
    icon: 'pulse', color: '#A78BFA', volume: '4-12h de ventaja predictiva',
  },
  {
    n: '08', emoji: '📱', name: 'Arquitecto Visual',
    role: 'Visualización',
    desc: 'Transforma datos complejos en dashboards intuitivos y visualizaciones accionables en tiempo real. Genera reportes ejecutivos automáticos con lenguaje claro para equipos de comunicación.',
    icon: 'grid', color: '#FFB546', volume: 'Reportes auto · 11s latencia',
  },
  {
    n: '09', emoji: '🎯', name: 'Estratega',
    role: 'Decisión',
    desc: 'El cerebro final. Cruza todos los insights y genera recomendaciones concretas: qué comunicar, cuándo publicar, qué temas priorizar, qué crisis atender primero. Acción en minutos, no en días.',
    icon: 'crosshair', color: '#FF4D6D', volume: 'Acción en minutos',
  },
];

function AgentsModal({ open, onClose }) {
  const [activeIdx, setActiveIdx] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // animate active agent through the pipeline
    const intv = setInterval(() => {
      setActiveIdx(i => (i + 1) % AGENTS.length);
    }, 2200);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      clearInterval(intv);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'var(--bg-0)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      overflow: 'auto',
      animation: 'fadeIn 280ms var(--ease)',
    }} onClick={onClose}>
      {/* Background scanlines + grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(circle at 20% 10%, rgba(46,230,200,0.08), transparent 50%),
          radial-gradient(circle at 80% 90%, rgba(77,124,255,0.08), transparent 50%),
          linear-gradient(rgba(46,230,200,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(46,230,200,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
      }} />
      <div style={{
        position: 'fixed', left: 0, right: 0, top: 0, bottom: 0,
        pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(46,230,200,0.5), transparent)',
          animation: 'scanline 6s linear infinite',
        }} />
      </div>

      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative',
        width: 'min(1280px, calc(100vw - 32px))',
        margin: '40px 16px',
        background: 'linear-gradient(180deg, var(--bg-2), var(--bg-1))',
        border: '1px solid rgba(46,230,200,0.25)',
        borderRadius: 20,
        boxShadow: '0 32px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), 0 0 80px rgba(46,230,200,0.12) inset',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '32px 40px 24px',
          borderBottom: '1px solid var(--line-1)',
          background: 'linear-gradient(180deg, rgba(46,230,200,0.04), transparent)',
          position: 'relative',
        }}>
          <div className="flex between items-s gap-4">
            <div>
              <div className="eyebrow" style={{color:'var(--warn,#FFB546)', marginBottom: 6}}>ARQUITECTURA · NO ES TELEMETRÍA EN VIVO</div>
              <div className="flex items-c gap-3" style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '5px 12px',
                  background: 'rgba(46,230,200,0.1)',
                  border: '1px solid rgba(46,230,200,0.3)',
                  borderRadius: 999,
                }}>
                  <span className="dot live" />
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--teal)', fontWeight: 600 }}>SISTEMA OPERATIVO · 99.94% UPTIME</span>
                </div>
                <span className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.12em' }}>POLARIS / ARCHITECTURE</span>
              </div>
              <h2 className="display" style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 500,
                letterSpacing: '-0.025em',
                lineHeight: 1.05,
                margin: 0,
                background: 'linear-gradient(135deg, var(--text-1) 0%, #2EE6C8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                9 Agentes de Inteligencia Artificial<br />
                trabajando 24/7 para ti
              </h2>
              <p className="t-2" style={{ fontSize: 15, lineHeight: 1.55, marginTop: 14, maxWidth: 680 }}>
                Cada mención política pasa por una cadena de 9 modelos especializados antes de llegar a tu pantalla.
                Visto en vivo: el flujo completo desde la captura hasta la decisión accionable.
              </p>
            </div>
            <button onClick={onClose} aria-label="Cerrar" style={{
              width: 40, height: 40,
              borderRadius: 12,
              background: 'var(--bg-3)',
              border: '1px solid var(--line-2)',
              color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 160ms var(--ease)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,77,109,0.3)'; e.currentTarget.style.color = '#FF4D6D'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* architecture descriptors strip */}
          <div className="flex items-c gap-6 wrap" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line-1)' }}>
            <DataLabel type="estimated" inline />
            {[
              ['Agentes en pipeline', '9', '#2EE6C8'],
              ['Modelos', 'Motor de análisis multimodelo', '#4D7CFF'],
              ['Costo por mención', '~$0.001', '#A78BFA'],
              ['Cobertura', '12 plataformas', '#FFB546'],
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="mono t-3" style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{s[0]}</span>
                <span className="display" style={{ fontSize: 18, fontWeight: 500, color: s[2] }}>{s[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline */}
        <div style={{ padding: '40px 40px 24px', position: 'relative' }}>
          <div className="flex items-c gap-3" style={{ marginBottom: 28 }}>
            <div style={{ width: 4, height: 18, background: 'var(--teal)', borderRadius: 2, boxShadow: '0 0 12px var(--teal-glow)' }} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 600 }}>Pipeline de inteligencia · flujo de datos en vivo</span>
          </div>

          <AgentsPipeline activeIdx={activeIdx} setActiveIdx={setActiveIdx} />
        </div>

        {/* Closing statement */}
        <div style={{
          padding: '32px 40px 40px',
          borderTop: '1px solid var(--line-1)',
          background: 'linear-gradient(180deg, transparent, rgba(46,230,200,0.04))',
          textAlign: 'center',
        }}>
          <div className="display" style={{
            fontSize: 'clamp(18px, 2.4vw, 26px)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            maxWidth: 880, margin: '0 auto',
            color: 'var(--text-1)',
          }}>
            Cada dato pasa por <span style={{ color: 'var(--teal)', fontWeight: 600 }}>9 capas de inteligencia</span> antes de llegar a tu dashboard.<br />
            Lo que ves no son números — son <span style={{ color: 'var(--teal)', fontWeight: 600 }}>decisiones listas para ejecutar</span>.
          </div>
          <div className="flex items-c gap-3" style={{ justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-primary" style={{ padding: '12px 22px', fontSize: 13 }} onClick={onClose}>
              <Icon name="zap" size={13} /> Empezar prueba de 14 días
            </button>
            <button className="btn" style={{ padding: '12px 22px', fontSize: 13 }} onClick={onClose}>
              <Icon name="mail" size={13} /> Hablar con un especialista
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentsPipeline({ activeIdx, setActiveIdx }) {
  // 3x3 grid layout, with arrows connecting them in serpentine order
  // Row 0: 01 → 02 → 03 (left to right)
  // Row 1: 06 ← 05 ← 04 (right to left)
  // Row 2: 07 → 08 → 09 (left to right)
  const rows = [
    [0, 1, 2],
    [5, 4, 3],
    [6, 7, 8],
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* SVG layer for connectors */}
      <svg className="agents-pipeline-svg" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 1,
      }} viewBox="0 0 1200 720" preserveAspectRatio="none">
        <defs>
          <linearGradient id="conGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2EE6C8" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#2EE6C8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2EE6C8" stopOpacity="0.1" />
          </linearGradient>
          <filter id="connGlow"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        {/* Row 1 horizontal connectors */}
        <path d="M 280 130 L 480 130" stroke="url(#conGrad)" strokeWidth="2" fill="none" />
        <path d="M 600 130 L 800 130" stroke="url(#conGrad)" strokeWidth="2" fill="none" />
        {/* Right turn down (3 → 4) */}
        <path d="M 1010 130 Q 1080 130 1080 240 L 1080 360 Q 1080 370 1010 370" stroke="url(#conGrad)" strokeWidth="2" fill="none" />
        {/* Row 2 horizontal connectors (RTL: 4 → 5 → 6) */}
        <path d="M 920 370 L 720 370" stroke="url(#conGrad)" strokeWidth="2" fill="none" />
        <path d="M 600 370 L 400 370" stroke="url(#conGrad)" strokeWidth="2" fill="none" />
        {/* Left turn down (6 → 7) */}
        <path d="M 190 370 Q 120 370 120 480 L 120 600 Q 120 610 190 610" stroke="url(#conGrad)" strokeWidth="2" fill="none" />
        {/* Row 3 horizontal */}
        <path d="M 280 610 L 480 610" stroke="url(#conGrad)" strokeWidth="2" fill="none" />
        <path d="M 600 610 L 800 610" stroke="url(#conGrad)" strokeWidth="2" fill="none" />

        {/* Animated flow dots — pulses traveling along path */}
        <circle r="4" fill="#2EE6C8" filter="url(#connGlow)">
          <animateMotion dur="2.4s" repeatCount="indefinite" path="M 130 130 L 280 130 L 480 130 L 600 130 L 800 130 L 1010 130 Q 1080 130 1080 240 L 1080 360 Q 1080 370 1010 370 L 920 370 L 720 370 L 600 370 L 400 370 L 190 370 Q 120 370 120 480 L 120 600 Q 120 610 190 610 L 280 610 L 480 610 L 600 610 L 800 610 L 1010 610" />
        </circle>
        <circle r="3" fill="#4D7CFF" filter="url(#connGlow)" opacity="0.7">
          <animateMotion dur="2.4s" begin="0.8s" repeatCount="indefinite" path="M 130 130 L 280 130 L 480 130 L 600 130 L 800 130 L 1010 130 Q 1080 130 1080 240 L 1080 360 Q 1080 370 1010 370 L 920 370 L 720 370 L 600 370 L 400 370 L 190 370 Q 120 370 120 480 L 120 600 Q 120 610 190 610 L 280 610 L 480 610 L 600 610 L 800 610 L 1010 610" />
        </circle>
        <circle r="3" fill="#A78BFA" filter="url(#connGlow)" opacity="0.7">
          <animateMotion dur="2.4s" begin="1.6s" repeatCount="indefinite" path="M 130 130 L 280 130 L 480 130 L 600 130 L 800 130 L 1010 130 Q 1080 130 1080 240 L 1080 360 Q 1080 370 1010 370 L 920 370 L 720 370 L 600 370 L 400 370 L 190 370 Q 120 370 120 480 L 120 600 Q 120 610 190 610 L 280 610 L 480 610 L 600 610 L 800 610 L 1010 610" />
        </circle>
      </svg>

      {/* Agent grid */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
            // serpentine: row 1 reversed visually but indexes preserved
            direction: ri === 1 ? 'rtl' : 'ltr',
          }}>
            {row.map((agentIdx, ci) => {
              const a = AGENTS[agentIdx];
              const isActive = activeIdx === agentIdx;
              const orderInPipeline = agentIdx + 1;
              return (
                <div key={agentIdx} style={{ direction: 'ltr' }}
                  onMouseEnter={() => setActiveIdx(agentIdx)}>
                  <AgentCard a={a} order={orderInPipeline} active={isActive} delay={(ri * 3 + ci) * 80} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentCard({ a, order, active, delay }) {
  return (
    <div style={{
      position: 'relative',
      padding: 20,
      background: active
        ? `linear-gradient(180deg, ${a.color}14, var(--bg-2))`
        : 'var(--bg-2)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${active ? a.color + '60' : 'var(--line-2)'}`,
      borderRadius: 14,
      transition: 'all 380ms var(--ease)',
      boxShadow: active
        ? `0 0 0 1px ${a.color}40, 0 12px 40px rgba(0,0,0,0.5), 0 0 32px ${a.color}30`
        : '0 4px 20px rgba(0,0,0,0.3)',
      animation: `agentEnter 500ms var(--ease-out) ${delay}ms both`,
      cursor: 'pointer',
      transform: active ? 'translateY(-2px)' : 'translateY(0)',
    }}>
      {/* Order badge */}
      <div style={{
        position: 'absolute', top: -10, left: 16,
        padding: '2px 10px',
        background: active ? a.color : 'var(--bg-3)',
        color: active ? '#051410' : 'var(--text-3)',
        borderRadius: 999,
        fontFamily: 'var(--font-mono)',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        border: `1px solid ${active ? a.color : 'var(--line-3)'}`,
        transition: 'all 380ms var(--ease)',
      }}>
        AGENTE {String(order).padStart(2, '0')}
      </div>
      {active && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontFamily: 'var(--font-mono)',
          fontSize: 9, letterSpacing: '0.14em',
          color: a.color, fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: a.color, boxShadow: `0 0 8px ${a.color}` }} />
          PROCESANDO
        </div>
      )}

      <div className="flex items-c gap-3" style={{ marginBottom: 12, marginTop: 6 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${a.color}18`,
          border: `1px solid ${a.color}40`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
          color: a.color,
          flexShrink: 0,
        }}>
          {a.emoji}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="display" style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em' }}>{a.name}</div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: a.color, textTransform: 'uppercase', marginTop: 1 }}>{a.role}</div>
        </div>
      </div>

      <p className="t-2" style={{ fontSize: 12.5, lineHeight: 1.55, margin: 0, minHeight: 90 }}>
        {a.desc}
      </p>

      <div style={{
        marginTop: 14, paddingTop: 12,
        borderTop: '1px dashed var(--line-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)', fontSize: 10,
      }}>
        <span style={{ color: 'var(--text-3)', letterSpacing: '0.06em' }}>OUTPUT</span>
        <span style={{ color: a.color, fontWeight: 500 }}>{a.volume}</span>
      </div>
    </div>
  );
}

window.AgentsModal = AgentsModal;
