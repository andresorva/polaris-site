/* ============================================
   POLARIS — FreshnessIndicator
   Fetch /api/v1/politicians/{id}/freshness y muestra
   "Última actualización: hace X horas" con color por
   estado (verde <30h, amarillo 30-72h, rojo >72h).
   Botón ⟳ refresh manual al lado.
   ============================================ */

function FreshnessIndicator({ politicianId, onRefresh }) {
  const [state, setState] = React.useState({ loading: true, data: null, error: null });
  const [refreshKey, setRefreshKey] = React.useState(0);

  const isUuid = typeof politicianId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(politicianId);

  React.useEffect(() => {
    if (!isUuid || !window.apiClient) {
      setState({ loading: false, data: null, error: 'no UUID o sin apiClient' });
      return;
    }
    let alive = true;
    setState(s => ({ ...s, loading: true }));
    window.apiClient
      .request(`/api/v1/politicians/${politicianId}/freshness`)
      .then(data => alive && setState({ loading: false, data, error: null }))
      .catch(err => alive && setState({ loading: false, data: null, error: err.message }));
    return () => { alive = false; };
  }, [politicianId, refreshKey, isUuid]);

  if (!isUuid) {
    return (
      <div className="mono t-3" style={{ fontSize: 11 }}>
        Datos demo (sin freshness real)
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className="flex items-c gap-2 mono t-3" style={{ fontSize: 11 }}>
        <span className="dot live" /> verificando…
      </div>
    );
  }

  const data = state.data || {};
  const status = data.status || 'missing';
  const hours = data.hours_since_collection;

  const color = status === 'fresh'
    ? 'var(--pos)'
    : status === 'stale' ? 'var(--warn)' : 'var(--neg)';

  const label = hours == null
    ? 'sin colección'
    : hours < 1
      ? 'hace menos de 1 hora'
      : hours < 24
        ? `hace ${Math.round(hours)} h`
        : `hace ${Math.floor(hours / 24)} d`;

  const refresh = () => {
    if (window.apiClient && window.apiClient.cacheClear) window.apiClient.cacheClear();
    setRefreshKey(k => k + 1);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="flex items-c gap-2" title={`Status: ${status}`}>
      <span style={{
        width: 8, height: 8, borderRadius: 999, background: color,
        boxShadow: `0 0 8px ${color}40`,
      }} />
      <span className="mono t-3" style={{ fontSize: 11 }}>
        Última actualización: <span style={{ color }}>{label}</span>
      </span>
      <button
        className="btn btn-icon btn-sm btn-ghost"
        onClick={refresh}
        title="Recargar"
        aria-label="Recargar datos"
        style={{ padding: 4 }}
      >
        <Icon name="history" size={12} />
      </button>
    </div>
  );
}

window.FreshnessIndicator = FreshnessIndicator;
