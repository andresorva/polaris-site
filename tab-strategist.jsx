/* ============================================
   POLARIS — StrategistTab
   Fetch /api/v1/politicians/{id}/daily-brief y muestra
   las recommendations del strategist agent en cards.
   Cada card numerada (Prioridad 1, 2, 3) con acción +
   tema + racional + plataforma + hora óptima.
   ============================================ */

function StrategistTab({ politician }) {
  const [state, setState] = React.useState({ loading: true, brief: null, error: null });

  const isUuid = window.PolarisData && window.PolarisData.isUuid(politician.id);

  React.useEffect(() => {
    if (!isUuid || !window.apiClient) {
      setState({ loading: false, brief: null, error: 'datos demo' });
      return;
    }
    let alive = true;
    window.apiClient
      .request(`/api/v1/politicians/${politician.id}/daily-brief`)
      .then(data => alive && setState({ loading: false, brief: data, error: null }))
      .catch(err => alive && setState({ loading: false, brief: null, error: err.message }));
    return () => { alive = false; };
  }, [politician.id, isUuid]);

  const recs = (state?.brief?.recommendations ?? []);
  const tone = state?.brief?.recommendations
    ? null
    : null; // El backend lo guarda dentro de recommendations; el agent strategist tambien lo expone aparte

  return (
    <div className="fade-in">
      <PageHeader
        politician={politician}
        title="Estrategia del día"
        sub="Recomendaciones accionables generadas por el agente Estratega"
        actions={
          <>
            <FreshnessIndicator politicianId={politician.id} />
            <button className="btn btn-sm">
              <Icon name="share" size={13} /> Compartir
            </button>
          </>
        }
      />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {state.loading && (
          <div className="card card-pad" style={{ textAlign: 'center', padding: 40 }}>
            <span className="dot live" />
            <div className="mono t-3" style={{ fontSize: 12, marginTop: 12 }}>Cargando estrategia…</div>
          </div>
        )}

        {!state.loading && (recs?.length ?? 0) === 0 && (
          <div className="card card-pad" style={{ textAlign: 'center', padding: 40 }}>
            <Icon name="compass" size={32} style={{ color: 'var(--text-3)', display: 'inline-block', marginBottom: 12 }} />
            <div className="display" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
              Sin recomendaciones disponibles
            </div>
            <div className="t-3" style={{ fontSize: 13 }}>
              {state.error || 'El estratega genera recomendaciones diariamente con el Daily Brief.'}
            </div>
          </div>
        )}

        {!state.loading && (recs?.length ?? 0) > 0 && (
          <>
            <div className="mono t-3" style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {(recs?.length ?? 0)} acciones priorizadas para hoy · {state?.brief?.brief_date ?? '—'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(recs ?? []).map((r, i) => <StrategistCard key={i} rec={r} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StrategistCard({ rec }) {
  const priority = rec?.priority ?? 0;
  const priorityColor = priority === 1 ? '#FF4D6D' : priority === 2 ? '#FFB546' : '#2EE6C8';

  return (
    <div className="card lift" style={{
      padding: 20,
      borderLeft: `4px solid ${priorityColor}`,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div className="flex between items-c">
        <div className="flex items-c gap-2">
          <span className="pill" style={{
            background: `${priorityColor}18`,
            border: `1px solid ${priorityColor}40`,
            color: priorityColor,
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}>
            PRIORIDAD {priority}
          </span>
          {rec?.platform && (
            <span className="pill" style={{ fontSize: 10 }}>
              {rec?.platform}
            </span>
          )}
          {rec?.optimal_time && (
            <span className="mono t-3" style={{ fontSize: 11 }}>
              ⏰ {rec?.optimal_time} CDMX
            </span>
          )}
        </div>
        <button className="btn btn-sm btn-ghost" disabled title="Próximamente">
          <Icon name="check" size={11} /> Marcar ejecutada
        </button>
      </div>

      <div>
        <div className="display" style={{ fontSize: 16, fontWeight: 500, marginBottom: 6, color: 'var(--text-1)' }}>
          {rec?.action ?? 'Acción sin descripción'}
        </div>
        {rec?.topic && (
          <div className="mono t-3" style={{ fontSize: 11, marginBottom: 8, letterSpacing: '0.04em' }}>
            Tema: <span className="t-2">{rec?.topic}</span>
          </div>
        )}
      </div>

      {rec?.rationale && (
        <div style={{
          padding: 12,
          background: 'var(--bg-1)',
          borderRadius: 8,
          border: '1px solid var(--line-1)',
        }}>
          <div className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Por qué
          </div>
          <div className="t-2" style={{ fontSize: 13, lineHeight: 1.5 }}>
            {rec?.rationale}
          </div>
        </div>
      )}
    </div>
  );
}

window.StrategistTab = StrategistTab;
