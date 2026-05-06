/* ============================================
   POLARIS — CoordinationGraph
   Visualizacion SVG sencilla de redes coordinadas.
   Nodos centrales = politico (centro). Nodos exteriores
   = handles miembros de un grupo coordinado. Color por
   severidad: low (verde), medium (amarillo), high (naranja),
   critical (rojo). Edges entre miembros del mismo grupo.
   Sin D3 — dibujo directo en SVG.
   Fetch /api/v1/politicians/{id}/coordination-groups.
   ============================================ */

const _SEVERITY_COLOR = {
  low: '#2EE6C8',
  medium: '#FFB546',
  high: '#FF8A3D',
  critical: '#FF4D6D',
};

function CoordinationGraph({ politicianId, onSelectGroup }) {
  const [state, setState] = React.useState({ loading: true, groups: [] });

  const isUuid = typeof politicianId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(politicianId);

  React.useEffect(() => {
    if (!isUuid || !window.apiClient) {
      setState({ loading: false, groups: [] });
      return;
    }
    let alive = true;
    window.apiClient
      .request(`/api/v1/politicians/${politicianId}/coordination-groups`, { active_only: true, limit: 5 })
      .then(data => alive && setState({ loading: false, groups: data.groups || [] }))
      .catch(() => alive && setState({ loading: false, groups: [] }));
    return () => { alive = false; };
  }, [politicianId, isUuid]);

  if (state.loading) {
    return (
      <div className="flex items-c gap-2 mono t-3" style={{ fontSize: 11, padding: 12 }}>
        <span className="dot live" /> Detectando coordinación…
      </div>
    );
  }

  if (state.groups.length === 0) {
    return (
      <div className="t-3" style={{ fontSize: 12, padding: 12, textAlign: 'center' }}>
        <Icon name="check" size={20} style={{ color: 'var(--pos)', display: 'inline-block', marginBottom: 6 }} />
        <div>Sin patrones de coordinación detectados.</div>
        <div className="t-4" style={{ fontSize: 11, marginTop: 4 }}>
          Last 24h · 0 redes activas
        </div>
      </div>
    );
  }

  // Layout: politico al centro, grupos en radio igualmente espaciados
  const W = 400, H = 280;
  const cx = W / 2, cy = H / 2;
  const N = state.groups.length;

  return (
    <div style={{ padding: 12, background: 'var(--bg-1)', border: '1px solid var(--line-1)', borderRadius: 10 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        <defs>
          <radialGradient id="cg-glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Halo central */}
        <circle cx={cx} cy={cy} r="50" fill="url(#cg-glow)" opacity="0.5" />

        {/* Edges + nodos por grupo */}
        {state.groups.map((g, gi) => {
          const angle = (gi / N) * Math.PI * 2 - Math.PI / 2;
          const dist = 100;
          const gx = cx + Math.cos(angle) * dist;
          const gy = cy + Math.sin(angle) * dist;
          const sev = g.severity || 'low';
          const color = _SEVERITY_COLOR[sev] || '#6B7794';
          const memberCount = (g.member_handles || []).length;

          return (
            <g key={g.id || gi}
              onClick={() => onSelectGroup && onSelectGroup(g)}
              style={{ cursor: onSelectGroup ? 'pointer' : 'default' }}
            >
              {/* Edge centro → grupo */}
              <line x1={cx} y1={cy} x2={gx} y2={gy}
                stroke={color} strokeOpacity="0.5" strokeWidth="1.4" />
              {/* Nodo grupo */}
              <circle cx={gx} cy={gy} r={8 + Math.min(memberCount, 12)}
                fill={`${color}33`} stroke={color} strokeWidth="1.5" />
              <text x={gx} y={gy + 3} textAnchor="middle" fontSize="9"
                fontFamily="var(--font-mono)" fill={color} fontWeight="600">
                {memberCount}
              </text>
              {/* Etiqueta de severidad */}
              <text x={gx} y={gy + 28} textAnchor="middle" fontSize="9"
                fontFamily="var(--font-mono)" fill="var(--text-3)"
                style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {sev}
              </text>
            </g>
          );
        })}

        {/* Centro: politico */}
        <circle cx={cx} cy={cy} r="22" fill="var(--bg-3)" stroke="#2EE6C8" strokeWidth="1.5" />
        <text x={cx} y={cy + 3} textAnchor="middle" fontSize="11"
          fontFamily="var(--font-display)" fontWeight="600" fill="#2EE6C8">
          OBJ
        </text>
      </svg>

      {/* Lista debajo */}
      <div className="flex col gap-2" style={{ marginTop: 12 }}>
        {state.groups.map((g, i) => {
          const color = _SEVERITY_COLOR[g.severity] || '#6B7794';
          return (
            <div key={g.id || i} className="flex items-c gap-2" style={{ fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
              <span className="mono t-2" style={{ flex: 1 }}>
                Grupo {i + 1}: {(g.member_handles || []).length} cuentas · {g.platforms?.join(', ') || '—'}
              </span>
              <span className="mono" style={{ color, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.08em' }}>
                {g.severity}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.CoordinationGraph = CoordinationGraph;
