/* ============================================
   POLARIS — DailyBriefTab
   Fetch /api/v1/politicians/{id}/daily-brief?date=YYYY-MM-DD
   Renderiza el markdown del brief con marked.js + estilos
   premium tipo Notion/Medium. Si el CDN de marked.js no
   carga, cae a render literal del markdown como fallback.
   ============================================ */

function _renderBriefHtml(md) {
  if (!md || typeof md !== 'string') return '';
  if (typeof window.marked === 'object' && typeof window.marked.parse === 'function') {
    try {
      return window.marked.parse(md, { breaks: true, gfm: true });
    } catch (e) {
      return '<pre>' + md.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])) + '</pre>';
    }
  }
  return '<pre>' + md.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])) + '</pre>';
}

function DailyBriefTab({ politician, deepLinkDate }) {
  const [state, setState] = React.useState({ loading: true, brief: null, error: null });
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [briefDate, setBriefDate] = React.useState(deepLinkDate || null);

  const isUuid = window.PolarisData && window.PolarisData.isUuid(politician.id);

  React.useEffect(() => {
    if (!isUuid || !window.apiClient) {
      setState({ loading: false, brief: null, error: 'datos demo (sin brief real)' });
      return;
    }
    let alive = true;
    setState(s => ({ ...s, loading: true }));
    const path = briefDate
      ? `/api/v1/politicians/${politician.id}/daily-brief?date=${encodeURIComponent(briefDate)}`
      : `/api/v1/politicians/${politician.id}/daily-brief`;
    window.apiClient
      .request(path)
      .then(data => alive && setState({ loading: false, brief: data, error: null }))
      .catch(err => alive && setState({ loading: false, brief: null, error: err.message }));
    return () => { alive = false; };
  }, [politician.id, refreshKey, isUuid, briefDate]);

  return (
    <div className="fade-in">
      <PageHeader
        politician={politician}
        title="Daily Brief"
        sub="Tu briefing ejecutivo del día — generado por POLARIS"
        actions={
          <>
            <FreshnessIndicator politicianId={politician.id} />
            <input
              type="date"
              className="input"
              value={briefDate || ''}
              onChange={(e) => setBriefDate(e.target.value || null)}
              max={new Date().toISOString().slice(0, 10)}
              style={{ padding: '6px 10px', fontSize: 12, height: 32, maxWidth: 160 }}
              title="Cambiar fecha del brief"
            />
            <button className="btn btn-sm" onClick={() => { window.apiClient && window.apiClient.cacheClear(); setRefreshKey(k => k + 1); }}>
              <Icon name="history" size={13} /> Recargar
            </button>
            <button className="btn btn-sm" disabled title="Próximamente">
              <Icon name="download" size={13} /> Descargar PDF
            </button>
          </>
        }
      />

      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        {state.loading && (
          <div className="card card-pad" style={{ padding: '32px 40px' }}>
            <div className="skeleton skeleton-text" style={{ width: '40%', height: 12 }} />
            <div className="skeleton skeleton-text" style={{ width: '70%', height: 28, marginTop: 14 }} />
            <div className="skeleton skeleton-text" style={{ width: '95%', height: 14, marginTop: 16 }} />
            <div className="skeleton skeleton-text" style={{ width: '90%', height: 14, marginTop: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: '85%', height: 14, marginTop: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: '50%', height: 18, marginTop: 24 }} />
            <div className="skeleton skeleton-text" style={{ width: '92%', height: 14, marginTop: 12 }} />
            <div className="skeleton skeleton-text" style={{ width: '88%', height: 14, marginTop: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: '40%', height: 14, marginTop: 8 }} />
          </div>
        )}

        {!state.loading && !state.brief && (
          <div className="card card-pad" style={{ textAlign: 'center', padding: 40 }}>
            <Icon name="doc" size={32} style={{ color: 'var(--text-3)', display: 'inline-block', marginBottom: 12 }} />
            <div className="display" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
              Sin brief generado aún
            </div>
            <div className="t-3" style={{ fontSize: 13, marginBottom: 16 }}>
              {state.error || 'El Daily Brief se genera automáticamente cada mañana a las 9:00 CDMX.'}
            </div>
            <div className="t-4 mono" style={{ fontSize: 11 }}>
              Para generar manualmente: <code>python scripts/run_daily.py --date hoy</code>
            </div>
          </div>
        )}

        {!state.loading && state.brief && (
          <div className="card card-pad" style={{
            padding: '32px 40px',
            background: 'var(--bg-2)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--line-2)',
            borderRadius: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--line-1)' }}>
              <div className="mono t-3" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {state?.brief?.brief_date ?? '—'} · Generado por POLARIS
              </div>
              <span className="pill teal" style={{ fontSize: 10 }}>
                <span className="dot live" /> LISTO
              </span>
            </div>
            <div
              className="brief-content"
              dangerouslySetInnerHTML={{
                __html: _renderBriefHtml(state?.brief?.full_brief_md ?? state?.brief?.executive_summary ?? '')
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

window.DailyBriefTab = DailyBriefTab;
