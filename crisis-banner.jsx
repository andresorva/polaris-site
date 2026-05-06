/* ============================================
   POLARIS — CrisisBanner
   Fetch /api/v1/politicians/{id}/crisis-signals.
   Si hay alertas activas, muestra banner rojo arriba
   del dashboard con título + summary + botón "Ver detalle"
   que navega al tab-alerts.
   ============================================ */

function CrisisBanner({ politicianId, onSeeDetail }) {
  const [state, setState] = React.useState({ loading: true, count: 0, samples: [] });

  const isUuid = typeof politicianId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(politicianId);

  React.useEffect(() => {
    if (!isUuid || !window.apiClient) {
      setState({ loading: false, count: 0, samples: [] });
      return;
    }
    let alive = true;
    window.apiClient
      .request(`/api/v1/politicians/${politicianId}/crisis-signals`, { hours: 24 })
      .then(data => {
        if (!alive) return;
        const signals = data.signals || [];
        setState({
          loading: false,
          count: signals.length,
          samples: signals.slice(0, 3),
        });
      })
      .catch(() => alive && setState({ loading: false, count: 0, samples: [] }));
    return () => { alive = false; };
  }, [politicianId, isUuid]);

  if (state.loading || state.count === 0) return null;

  return (
    <div
      role="alert"
      style={{
        padding: '12px 20px',
        background: 'linear-gradient(90deg, rgba(255,77,109,0.18), rgba(255,77,109,0.10))',
        borderBottom: '1px solid rgba(255,77,109,0.4)',
        color: 'var(--neg)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: 'var(--neg)',
          boxShadow: '0 0 12px rgba(255,77,109,0.6)',
          animation: 'pulse 1.5s var(--ease) infinite',
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="display" style={{ fontSize: 14, fontWeight: 600, color: 'var(--neg)' }}>
          {state.count === 1
            ? 'Alerta de crisis activa'
            : `${state.count} señales de crisis activas`}
        </div>
        <div className="t-2" style={{
          fontSize: 12, lineHeight: 1.4, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {state.samples.length > 0 && state.samples[0].content
            ? `"${state.samples[0].content.slice(0, 120)}…"`
            : 'Patrón inusual detectado en las últimas 24 horas.'}
        </div>
      </div>
      {onSeeDetail && (
        <button
          className="btn btn-sm"
          onClick={onSeeDetail}
          style={{
            background: 'rgba(255,77,109,0.2)',
            border: '1px solid rgba(255,77,109,0.5)',
            color: 'var(--neg)',
          }}
        >
          Ver detalle <Icon name="arrow-r" size={11} />
        </button>
      )}
    </div>
  );
}

window.CrisisBanner = CrisisBanner;
