/* ============================================
   POLARIS — Dashboard: Alerts / Reports / Sources tabs

   TODO(api): backend /api/v1/alerts existe pero esta vacio
   (necesita 3+ dias de history daily para detectar anomalias).
   Reports y Sources NO tienen endpoint todavia. Cuando se
   implementen, conectar igual que overview/sentiment/mentions
   (loadXxx + isLive + fallback a mock + banner).
   Por ahora estos 3 tabs muestran solo datos mock.
   ============================================ */

// =============================================
// ALERTS TAB
// =============================================
function AlertsTab({ politician }) {
  const [filter, setFilter] = React.useState('all');
  const filters = [
    { id: 'all', label: 'Todas', count: ALERTS.length },
    { id: 'critical', label: 'Críticas', count: ALERTS.filter(a => a.severity === 'critical').length },
    { id: 'warning', label: 'Advertencias', count: ALERTS.filter(a => a.severity === 'warning').length },
    { id: 'info', label: 'Informativas', count: ALERTS.filter(a => a.severity === 'info').length },
  ];
  const filtered = filter === 'all' ? ALERTS : ALERTS.filter(a => a.severity === filter);

  return (
    <div className="fade-in">
      <PageHeader
        politician={politician}
        title="Centro de alertas"
        sub="14 reglas activas · notificaciones por Slack, email y webhook"
        actions={
          <>
            <button className="btn btn-sm"><Icon name="check" size={13} /> Marcar todas leídas</button>
            <button className="btn btn-sm"><Icon name="cog" size={13} /> Configurar canales</button>
            <button className="btn btn-primary btn-sm"><Icon name="plus" size={13} /> Nueva regla</button>
          </>
        }
      />

      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div>
          <div className="flex items-c gap-1" style={{ padding: 3, background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 999, marginBottom: 16, width: 'fit-content' }}>
            {filters.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                color: filter === f.id ? 'var(--text-1)' : 'var(--text-3)',
                background: filter === f.id ? 'var(--bg-3)' : 'transparent',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>{f.label} <span className="mono" style={{ fontSize: 10, color: 'var(--text-4)' }}>{f.count}</span></button>
            ))}
          </div>

          <div className="flex col gap-3">
            {filtered.map((a, i) => <AlertCard key={a.id} a={a} delay={i * 50} />)}
          </div>
        </div>

        {/* Right: rules + escalation */}
        <div className="flex col gap-4">
          <div className="card card-pad">
            <div className="section-h">
              <h3 style={{ fontSize: 13 }}>Reglas activas</h3>
              <span className="mono t-3" style={{ fontSize: 11 }}>14</span>
            </div>
            <div className="flex col gap-2">
              {[
                { name: 'Pico de menciones negativas', th: '+200% en 2h', sev: 'critical' },
                { name: 'Cuenta verificada hostil', th: 'reach > 1M', sev: 'critical' },
                { name: 'Hashtag emergente', th: '> 10K en 6h', sev: 'warning' },
                { name: 'Red coordinada', th: 'score > 80', sev: 'critical' },
                { name: 'Cobertura medios intl', th: 'top 50 medios', sev: 'info' },
                { name: 'Spike geográfico', th: '+150% por estado', sev: 'warning' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-1)', border: '1px solid var(--line-1)', borderRadius: 8 }}>
                  <div className="flex between items-c">
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{r.name}</span>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: r.sev === 'critical' ? 'var(--neg)' : r.sev === 'warning' ? 'var(--warn)' : 'var(--blue)' }} />
                  </div>
                  <div className="mono t-3" style={{ fontSize: 10, marginTop: 3 }}>{r.th}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div className="section-h">
              <h3 style={{ fontSize: 13 }}>Canales de notificación</h3>
            </div>
            <div className="flex col gap-3">
              {[
                ['Slack #campaña-alertas', 'Crítico + Advertencia', '#2EE6C8', true],
                ['Email · Equipo digital', 'Solo críticas', '#4D7CFF', true],
                ['SMS · Jefe de campaña', 'Solo críticas', '#FFB546', true],
                ['Webhook · Dashboard custom', 'Todas', '#A78BFA', true],
                ['WhatsApp interno', 'Inactivo', '#6B7794', false],
              ].map((c, i) => (
                <div key={i} className="flex items-c gap-3">
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: c[2], opacity: c[3] ? 1 : 0.3 }} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: c[3] ? 'var(--text-1)' : 'var(--text-3)' }}>{c[0]}</div>
                    <div className="t-3 mono" style={{ fontSize: 10 }}>{c[1]}</div>
                  </div>
                  <div style={{ width: 26, height: 14, borderRadius: 999, background: c[3] ? 'var(--teal)' : 'var(--bg-3)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 1, left: c[3] ? 13 : 1, width: 12, height: 12, borderRadius: 999, background: c[3] ? '#051410' : 'var(--text-3)', transition: 'left 200ms var(--ease)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertCard({ a, delay = 0 }) {
  const sevColor = a.severity === 'critical' ? '#FF4D6D' : a.severity === 'warning' ? '#FFB546' : '#4D7CFF';
  const sevLabel = a.severity === 'critical' ? 'CRÍTICA' : a.severity === 'warning' ? 'ADVERTENCIA' : 'INFORMATIVA';
  const sevIcon = a.severity === 'critical' ? 'warning' : a.severity === 'warning' ? 'flag' : 'info';
  return (
    <div className="card lift" style={{
      padding: 18,
      borderLeft: `3px solid ${sevColor}`,
      animation: `pageIn 400ms var(--ease-out) ${delay}ms both`,
      position: 'relative', overflow: 'hidden',
    }}>
      {a.new && <div style={{ position: 'absolute', top: 12, right: 12 }}><span className="dot live" /></div>}
      <div className="flex items-s gap-3">
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${sevColor}18`, border: `1px solid ${sevColor}40`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: sevColor, flexShrink: 0 }}>
          <Icon name={sevIcon} size={16} />
        </div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="flex items-c gap-2" style={{ marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: sevColor }}>{sevLabel}</span>
            <span className="t-4">·</span>
            <span className="t-3 mono" style={{ fontSize: 11 }}>{a.time}</span>
            <span className="t-4">·</span>
            <span className="t-3" style={{ fontSize: 11 }}>{a.source}</span>
          </div>
          <div className="display" style={{ fontSize: 16, fontWeight: 500, marginBottom: 6, letterSpacing: '-0.01em' }}>{a.title}</div>
          <div className="t-2" style={{ fontSize: 13, lineHeight: 1.5 }}>{a.desc}</div>
          <div className="flex items-c gap-2" style={{ marginTop: 14 }}>
            <button className="btn btn-sm">Investigar <Icon name="arrow-r" size={11} /></button>
            <button className="btn btn-sm btn-ghost"><Icon name="check" size={12} /> Marcar leído</button>
            <button className="btn btn-sm btn-ghost"><Icon name="share" size={12} /> Compartir</button>
            <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }}><Icon name="dots" size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// REPORTS TAB
// =============================================
function ReportsTab({ politician }) {
  return (
    <div className="fade-in">
      <PageHeader
        politician={politician}
        title="Reportes"
        sub="Generación automática + plantillas personalizadas · Últimos 90 días"
        actions={
          <>
            <button className="btn btn-sm"><Icon name="filter" size={13} /></button>
            <button className="btn btn-sm"><Icon name="cog" size={13} /> Plantillas</button>
            <button className="btn btn-primary btn-sm"><Icon name="plus" size={13} /> Nuevo reporte</button>
          </>
        }
      />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KPI label="REPORTES GENERADOS" value="142" sub="este año" delta={28} accent="#4D7CFF" />
          <KPI label="DESCARGAS" value="892" delta={42} accent="#2EE6C8" />
          <KPI label="PROGRAMADOS" value="6" sub="próximos 30d" deltaSuffix="" delta={2} accent="#A78BFA" />
          <KPI label="GENERANDO AHORA" value="2" sub="en cola" delta={0} deltaSuffix="" accent="#FFB546" />
        </div>

        {/* Reports grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {REPORTS.map((r, i) => <ReportCard key={r.id} r={r} delay={i * 60} />)}
          <button style={{
            minHeight: 280, border: '1.5px dashed var(--line-2)', borderRadius: 14,
            background: 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, color: 'var(--text-3)', cursor: 'pointer',
            transition: 'all 200ms var(--ease)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.color = 'var(--text-3)'; }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, border: '1px dashed currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={22} />
            </div>
            <div className="display" style={{ fontSize: 14, fontWeight: 500 }}>Crear reporte personalizado</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Desde plantilla o en blanco</div>
          </button>
        </div>

        {/* Schedule timeline */}
        <div className="card card-pad">
          <div className="section-h">
            <h3>Programación de reportes</h3>
            <span className="mono t-3" style={{ fontSize: 11 }}>próximos 7 días</span>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 80, right: 0, top: 0, bottom: 0, borderLeft: '1px solid var(--line-1)' }} />
            <div className="flex col gap-3">
              {[
                ['Hoy', '18:00', 'Reporte diario · Sentimiento general', 'auto', '#2EE6C8'],
                ['Mañana', '09:00', 'Briefing matutino para jefe de campaña', 'auto', '#4D7CFF'],
                ['Mié 23', '18:00', 'Reporte diario · Sentimiento general', 'auto', '#2EE6C8'],
                ['Jue 24', '14:00', 'Análisis: cobertura post-cabildo', 'manual', '#A78BFA'],
                ['Vie 25', '10:00', 'Reporte semanal completo', 'auto', '#FFB546'],
                ['Lun 28', '09:00', 'Pre-evento: simulacro de prensa', 'manual', '#FF4D6D'],
              ].map((s, i) => (
                <div key={i} className="flex items-c gap-4">
                  <div style={{ width: 80, flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: 11, fontWeight: 500 }}>{s[0]}</div>
                    <div className="mono t-3" style={{ fontSize: 10 }}>{s[1]}</div>
                  </div>
                  <div style={{ width: 12, height: 12, borderRadius: 999, background: s[4], boxShadow: `0 0 0 4px var(--bg-2), 0 0 0 5px ${s[4]}30`, flexShrink: 0, marginLeft: -6 }} />
                  <div className="grow flex items-c gap-2">
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{s[2]}</span>
                    <span className="pill" style={{ padding: '2px 7px', fontSize: 9 }}>{s[3] === 'auto' ? 'AUTO' : 'MANUAL'}</span>
                  </div>
                  <button className="btn btn-ghost btn-sm"><Icon name="dots" size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ r, delay = 0 }) {
  const covers = {
    sentiment: { c1: '#2EE6C8', c2: '#4D7CFF', icon: 'pulse' },
    event:     { c1: '#A78BFA', c2: '#FF4D6D', icon: 'broadcast' },
    critics:   { c1: '#FF4D6D', c2: '#FFB546', icon: 'crosshair' },
    network:   { c1: '#A78BFA', c2: '#4D7CFF', icon: 'spark' },
    regional:  { c1: '#FFB546', c2: '#2EE6C8', icon: 'globe' },
    executive: { c1: '#4D7CFF', c2: '#A78BFA', icon: 'star' },
  };
  const cv = covers[r.cover] || covers.sentiment;

  return (
    <div className="card lift" style={{
      padding: 0, overflow: 'hidden', cursor: 'pointer',
      animation: `pageIn 400ms var(--ease-out) ${delay}ms both`,
    }}>
      {/* Cover */}
      <div style={{
        height: 120,
        background: `linear-gradient(135deg, ${cv.c1}30, ${cv.c2}20), var(--bg-3)`,
        position: 'relative', overflow: 'hidden',
        borderBottom: '1px solid var(--line-1)',
      }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cv.c1, border: `1px solid ${cv.c1}50` }}>
            <Icon name={cv.icon} size={26} />
          </div>
        </div>
        {/* Status badge */}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          {r.status === 'ready' && <span className="pill teal" style={{ padding: '2px 8px', fontSize: 10 }}><Icon name="check" size={10} strokeWidth={2.5} /> Listo</span>}
          {r.status === 'generating' && <span className="pill amber" style={{ padding: '2px 8px', fontSize: 10 }}><span className="dot live" />Generando</span>}
          {r.status === 'scheduled' && <span className="pill purple" style={{ padding: '2px 8px', fontSize: 10 }}><Icon name="history" size={10} /> Programado</span>}
        </div>
        {r.status === 'generating' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 }}>
            <div className="loading-bar" />
          </div>
        )}
      </div>
      <div style={{ padding: 18 }}>
        <div className="display" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3, letterSpacing: '-0.01em', marginBottom: 6 }}>{r.title}</div>
        <div className="t-3 mono" style={{ fontSize: 11, marginBottom: 14 }}>{r.period}</div>
        <div className="flex between items-c">
          <div className="flex items-c gap-2 t-3" style={{ fontSize: 11 }}>
            <Icon name="doc" size={12} />
            <span>{r.size}</span>
            <span className="t-4">·</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.author}</span>
          </div>
          {r.status === 'ready' && (
            <button className="btn btn-icon btn-sm" style={{ padding: 6 }}><Icon name="download" size={13} /></button>
          )}
          {r.status === 'generating' && (
            <span className="mono t-warn" style={{ fontSize: 11 }}>{r.progress}%</span>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// SOURCES TAB
// =============================================
function SourcesTab({ politician }) {
  const totalCost = 9600;
  const totalVolume = '968K';
  return (
    <div className="fade-in">
      <PageHeader
        politician={politician}
        title="Fuentes de datos"
        sub="9 conectores configurados · 7 activos · ingesta total: 968K menciones / día"
        actions={
          <>
            <button className="btn btn-sm"><Icon name="history" size={13} /> Logs</button>
            <button className="btn btn-sm"><Icon name="cog" size={13} /> Configuración</button>
            <button className="btn btn-primary btn-sm"><Icon name="plus" size={13} /> Conectar fuente</button>
          </>
        }
      />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KPI label="ACTIVAS" value="7" sub="/ 9" delta={0} deltaSuffix="" accent="#2EE6C8" />
          <KPI label="VOLUMEN DIARIO" value={totalVolume} delta={12.4} sparkData={[820,840,860,880,900,920,940,960,968]} accent="#4D7CFF" />
          <KPI label="COSTO MENSUAL" value={`$${totalCost.toLocaleString()}`} sub="USD" delta={0} deltaSuffix="" accent="#A78BFA" />
          <KPI label="UPTIME 30D" value="99.94" sub="%" delta={0.1} accent="#2EE6C8" />
        </div>

        {/* Sources grid */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="flex between items-c" style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-1)' }}>
            <div>
              <div className="display" style={{ fontSize: 15, fontWeight: 500 }}>Conectores</div>
              <div className="t-3" style={{ fontSize: 11 }}>Estado, latencia y cobertura por plataforma</div>
            </div>
            <div className="flex items-c gap-2">
              <button className="btn btn-sm btn-ghost"><Icon name="filter" size={12} /></button>
              <button className="btn btn-sm btn-ghost"><Icon name="grid" size={12} /></button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 2fr 1fr 1fr 1fr 1fr 1.2fr 100px', padding: '10px 20px', borderBottom: '1px solid var(--line-1)', background: 'var(--bg-1)' }}>
            {['', 'Plataforma', 'Estado', 'Volumen 24h', 'Latencia', 'Costo', 'Cobertura', ''].map((h, i) => (
              <div key={i} className="mono t-3" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>
          {SOURCES.map((s, i) => <SourceRow key={s.name} s={s} last={i === SOURCES.length - 1} />)}
        </div>

        {/* Pipeline visualization + Health */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          <div className="card card-pad">
            <div className="section-h">
              <div>
                <h3>Pipeline de ingesta</h3>
                <div className="t-3" style={{ fontSize: 11 }}>Flujo de datos desde captura hasta tu pantalla</div>
              </div>
              <span className="pill teal"><span className="dot live" /> SALUDABLE</span>
            </div>
            <Pipeline />
          </div>
          <div className="card card-pad">
            <div className="section-h">
              <h3>Salud del sistema</h3>
            </div>
            <div className="flex col gap-3">
              {[
                ['API Twitter v2', 99.9, '#2EE6C8', 'Operativo'],
                ['Scraper TikTok', 98.2, '#FFB546', 'Lentitud detectada'],
                ['IG Graph API', 99.7, '#2EE6C8', 'Operativo'],
                ['Cola de procesamiento', 100, '#2EE6C8', 'Operativo'],
                ['Modelo POLARIS-ES', 99.8, '#2EE6C8', 'Operativo'],
                ['Almacenamiento S3', 100, '#2EE6C8', 'Operativo'],
              ].map((h, i) => (
                <div key={i}>
                  <div className="flex between items-c" style={{ marginBottom: 5, fontSize: 12 }}>
                    <span style={{ fontWeight: 500 }}>{h[0]}</span>
                    <span className="mono t-3" style={{ fontSize: 11 }}>{h[1]}%</span>
                  </div>
                  <HBar value={h[1]} color={h[2]} height={4} />
                  <div className="t-3" style={{ fontSize: 10, marginTop: 3 }}>{h[3]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceRow({ s, last }) {
  const statusColor = s.status === 'active' ? '#2EE6C8' : s.status === 'partial' ? '#FFB546' : '#6B7794';
  const statusLabel = s.status === 'active' ? 'Activo' : s.status === 'partial' ? 'Parcial' : 'Pausado';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '36px 2fr 1fr 1fr 1fr 1fr 1.2fr 100px',
      padding: '14px 20px', borderBottom: last ? 'none' : '1px solid var(--line-1)',
      alignItems: 'center',
    }}>
      <PlatformChip platform={s.name === 'X (Twitter)' ? 'X' : s.name === 'Medios web' ? 'Web' : s.name === 'WhatsApp Pública' ? 'WhatsApp' : s.name} size={26} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
        <div className="t-3 mono" style={{ fontSize: 10 }}>v2.4 · OAuth 2.0</div>
      </div>
      <div className="flex items-c gap-2">
        <span style={{ width: 7, height: 7, borderRadius: 999, background: statusColor, boxShadow: s.status === 'active' ? `0 0 0 0 ${statusColor}` : 'none', animation: s.status === 'active' ? 'pulse 2s infinite' : 'none' }} />
        <span style={{ fontSize: 12, color: statusColor, fontWeight: 500 }}>{statusLabel}</span>
      </div>
      <div className="display" style={{ fontSize: 14, fontWeight: 500 }}>{s.volume}</div>
      <div className="mono t-2" style={{ fontSize: 12 }}>{s.latency}</div>
      <div className="mono t-2" style={{ fontSize: 12 }}>{s.cost}</div>
      <div className="flex items-c gap-2">
        <div style={{ width: 80 }}><HBar value={s.coverage} color={s.coverage > 80 ? '#2EE6C8' : s.coverage > 50 ? '#FFB546' : '#6B7794'} height={4} /></div>
        <span className="mono t-2" style={{ fontSize: 11 }}>{s.coverage}%</span>
      </div>
      <div className="flex items-c gap-1">
        <button className="btn btn-ghost btn-sm" style={{ padding: 5 }}><Icon name="cog" size={13} /></button>
        <button className="btn btn-ghost btn-sm" style={{ padding: 5 }}><Icon name="dots" size={13} /></button>
      </div>
    </div>
  );
}

function Pipeline() {
  const stages = [
    { label: 'Captura', count: '968K/d', icon: 'plug', color: '#2EE6C8' },
    { label: 'Deduplicación', count: '894K', icon: 'filter', color: '#4D7CFF' },
    { label: 'Idioma + Geo', count: '894K', icon: 'globe', color: '#4D7CFF' },
    { label: 'Sentimiento', count: '894K', icon: 'spark', color: '#A78BFA' },
    { label: 'Detección coord.', count: '12 grupos', icon: 'crosshair', color: '#FF4D6D' },
    { label: 'Indexación', count: '< 12s', icon: 'check', color: '#2EE6C8' },
  ];
  return (
    <div style={{ position: 'relative' }}>
      <div className="flex items-c" style={{ overflow: 'auto', paddingBottom: 8 }}>
        {stages.map((st, i) => (
          <React.Fragment key={i}>
            <div style={{ flexShrink: 0, padding: 14, background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 12, minWidth: 130, textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${st.color}18`, border: `1px solid ${st.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: st.color, margin: '0 auto 10px' }}>
                <Icon name={st.icon} size={16} />
              </div>
              <div className="mono t-3" style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{st.label}</div>
              <div className="display" style={{ fontSize: 14, fontWeight: 500, color: st.color }}>{st.count}</div>
            </div>
            {i < stages.length - 1 && (
              <div style={{ flexShrink: 0, height: 2, width: 32, position: 'relative', overflow: 'hidden', background: 'var(--line-1)' }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(90deg, transparent, ${st.color}, transparent)`,
                  backgroundSize: '50% 100%',
                  backgroundRepeat: 'no-repeat',
                  animation: 'shimmer 1.6s linear infinite',
                }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex between items-c" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line-1)' }}>
        <div className="t-3 mono" style={{ fontSize: 10, letterSpacing: '0.06em' }}>LATENCIA TOTAL · CAPTURA → PANEL</div>
        <div className="display" style={{ fontSize: 18, fontWeight: 500, color: 'var(--teal)' }}>11.4 segundos · mediana 30d</div>
      </div>
    </div>
  );
}

window.AlertsTab = AlertsTab;
window.ReportsTab = ReportsTab;
window.SourcesTab = SourcesTab;
