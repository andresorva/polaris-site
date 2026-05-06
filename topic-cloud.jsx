/* ============================================
   POLARIS — TopicCloud
   Fetch /api/v1/politicians/{id}/topics. Muestra nube de
   palabras: tamaño = volumen, color = sentiment promedio
   (verde positivo, gris neutro, rojo negativo).
   ============================================ */

function TopicCloud({ politicianId, days = 7 }) {
  const [state, setState] = React.useState({ loading: true, topics: [] });

  const isUuid = typeof politicianId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(politicianId);

  React.useEffect(() => {
    if (!isUuid || !window.apiClient) {
      // Fallback a TOPICS mock
      const fallback = (window.TOPICS_MOCK || []).map(t => ({
        topic: t.name,
        count: t.mentions,
        sentiment_avg: (t.sentiment - 50) / 50,
      }));
      setState({ loading: false, topics: fallback });
      return;
    }
    let alive = true;
    window.apiClient
      .request(`/api/v1/politicians/${politicianId}/topics`, { days })
      .then(data => alive && setState({ loading: false, topics: data.topics || [] }))
      .catch(() => alive && setState({ loading: false, topics: [] }));
    return () => { alive = false; };
  }, [politicianId, days, isUuid]);

  if (state.loading) {
    return (
      <div className="flex items-c gap-2 mono t-3" style={{ fontSize: 11, padding: 12 }}>
        <span className="dot live" /> Cargando temas…
      </div>
    );
  }

  if (state.topics.length === 0) {
    return (
      <div className="t-3" style={{ fontSize: 12, padding: 12 }}>
        Sin temas detectados en la ventana actual.
      </div>
    );
  }

  // Normalizar tamaños
  const counts = state.topics.map(t => t.count || 0);
  const max = Math.max(...counts, 1);
  const min = Math.min(...counts);

  const colorFor = (sentAvg) => {
    if (sentAvg == null) return 'var(--text-2)';
    if (sentAvg > 0.15) return 'var(--pos)';
    if (sentAvg < -0.15) return 'var(--neg)';
    return 'var(--text-2)';
  };

  return (
    <div className="flex wrap" style={{ gap: 8, alignItems: 'center', padding: '4px 0' }}>
      {state.topics.slice(0, 30).map((t, i) => {
        const ratio = max === min ? 0.5 : (t.count - min) / (max - min);
        const fontSize = 11 + ratio * 16;  // 11px..27px
        const color = colorFor(t.sentiment_avg);
        return (
          <span
            key={i}
            className="mono"
            title={`${t.count} menciones · sentiment ${t.sentiment_avg != null ? t.sentiment_avg.toFixed(2) : 'N/A'}`}
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize,
              background: `${color}14`,
              border: `1px solid ${color}40`,
              color,
              fontWeight: 500,
              cursor: 'default',
              transition: 'transform 120ms var(--ease)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
          >
            {t.topic}{' '}
            <span style={{ opacity: 0.6, fontSize: Math.max(fontSize - 4, 9) }}>{t.count}</span>
          </span>
        );
      })}
    </div>
  );
}

window.TopicCloud = TopicCloud;
