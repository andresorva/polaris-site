/* ============================================
   POLARIS — DailyBriefTab
   Fetch /api/v1/politicians/{id}/daily-brief?date=YYYY-MM-DD
   Renderiza markdown con tipografia bonita. Si no hay brief
   hoy, muestra estado "Generando..." o "Disponible mañana 9am".
   ============================================ */

// Mini parser markdown sin dependencias externas. Soporta:
// - h1 (# ) / h2 (## ) / h3 (### )
// - bold **text**
// - listas con `- ` o `* `
// - parrafos separados por linea en blanco
// - separador ---
function _renderMarkdown(md) {
  if (!md || typeof md !== 'string') return null;

  const blocks = md.split(/\n\n+/);

  const renderInline = (text) => {
    // Bold
    const parts = [];
    let lastIdx = 0;
    const re = /\*\*(.+?)\*\*/g;
    let match;
    let key = 0;
    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(<span key={key++}>{text.slice(lastIdx, match.index)}</span>);
      }
      parts.push(<strong key={key++} style={{ color: 'var(--text-1)' }}>{match[1]}</strong>);
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) parts.push(<span key={key++}>{text.slice(lastIdx)}</span>);
    return parts.length > 0 ? parts : text;
  };

  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    if (trimmed === '---') {
      return <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--line-1)', margin: '24px 0' }} />;
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h1 key={i} className="display" style={{
          fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em',
          margin: '12px 0 16px', color: 'var(--text-1)',
        }}>{renderInline(trimmed.slice(2))}</h1>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={i} className="display" style={{
          fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em',
          margin: '24px 0 8px', color: 'var(--teal)',
        }}>{renderInline(trimmed.slice(3))}</h2>
      );
    }
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={i} style={{ fontSize: 14, fontWeight: 600, margin: '16px 0 6px' }}>
          {renderInline(trimmed.slice(4))}
        </h3>
      );
    }
    // Listas
    if (/^\s*[-*]\s/.test(trimmed)) {
      const items = trimmed.split(/\n/).filter(l => /^\s*[-*]\s/.test(l));
      return (
        <ul key={i} style={{
          margin: '8px 0', paddingLeft: 18, color: 'var(--text-2)',
          lineHeight: 1.6, fontSize: 13,
        }}>
          {items.map((it, j) => (
            <li key={j}>{renderInline(it.replace(/^\s*[-*]\s/, ''))}</li>
          ))}
        </ul>
      );
    }
    // Parrafo
    return (
      <p key={i} className="t-2" style={{
        fontSize: 14, lineHeight: 1.65, margin: '0 0 14px',
      }}>
        {renderInline(trimmed)}
      </p>
    );
  });
}

function DailyBriefTab({ politician }) {
  const [state, setState] = React.useState({ loading: true, brief: null, error: null });
  const [refreshKey, setRefreshKey] = React.useState(0);

  const isUuid = window.PolarisData && window.PolarisData.isUuid(politician.id);

  React.useEffect(() => {
    if (!isUuid || !window.apiClient) {
      setState({ loading: false, brief: null, error: 'datos demo (sin brief real)' });
      return;
    }
    let alive = true;
    setState(s => ({ ...s, loading: true }));
    window.apiClient
      .request(`/api/v1/politicians/${politician.id}/daily-brief`)
      .then(data => alive && setState({ loading: false, brief: data, error: null }))
      .catch(err => alive && setState({ loading: false, brief: null, error: err.message }));
    return () => { alive = false; };
  }, [politician.id, refreshKey, isUuid]);

  return (
    <div className="fade-in">
      <PageHeader
        politician={politician}
        title="Daily Brief"
        sub="Tu briefing ejecutivo del día — generado por POLARIS"
        actions={
          <>
            <FreshnessIndicator politicianId={politician.id} />
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
          <div className="card card-pad" style={{ textAlign: 'center', padding: 40 }}>
            <span className="dot live" />
            <div className="mono t-3" style={{ fontSize: 12, marginTop: 12 }}>
              Cargando brief…
            </div>
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
            background: 'linear-gradient(180deg, rgba(15,22,38,0.7), rgba(10,14,26,0.5))',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--line-2)',
            borderRadius: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--line-1)' }}>
              <div className="mono t-3" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {state.brief.brief_date} · Generado por {state.brief.generated_by_model || 'POLARIS'}
              </div>
              <span className="pill teal" style={{ fontSize: 10 }}>
                <span className="dot live" /> LISTO
              </span>
            </div>
            <div style={{ color: 'var(--text-2)' }}>
              {_renderMarkdown(state.brief.full_brief_md || state.brief.executive_summary || '')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.DailyBriefTab = DailyBriefTab;
