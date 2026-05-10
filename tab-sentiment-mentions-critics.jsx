/* ============================================
   POLARIS — Dashboard: Sentiment / Mentions / Critics tabs
   ============================================ */

// =============================================
// SENTIMENT TAB
// =============================================
function SentimentTab({ politician }) {
  const [range, setRange] = React.useState('30d');
  const [granularity, setGranularity] = React.useState('day');
  const series = React.useMemo(() => genSentimentSeries(politician.id.charCodeAt(0), politician.sentiment || 50, 8, 30), [politician]);

  const isLive = window.PolarisData && window.PolarisData.isUuid(politician.id);
  const [live, setLive] = React.useState({ breakdown: null, loading: isLive, error: null, isFallback: !isLive });

  React.useEffect(() => {
    if (!isLive) return;
    let alive = true;
    setLive(s => ({ ...s, loading: true }));
    window.PolarisData.loadSentimentBreakdown(politician.id, { days: 30 }).then(res => {
      if (!alive) return;
      setLive({ breakdown: res.data, loading: false, error: res.error, isFallback: res.isFallback });
      window.PolarisFallback && window.PolarisFallback.notify(res.isFallback, res.error);
    });
    return () => { alive = false; };
  }, [politician.id, isLive]);

  const br = (live.breakdown && live.breakdown.breakdown) || null;
  const pos = br ? Math.round((br?.pct?.positive) ?? 0) : 62;
  const neg = br ? Math.round((br?.pct?.negative) ?? 0) : 14;
  const neu = br ? Math.round((br?.pct?.neutral) ?? 0) : 24;
  const net = pos - neg;
  const polarization = (typeof neu === 'number' && !isNaN(neu) ? ((100 - neu) / 100).toFixed(2) : '—');

  return (
    <div className="fade-in">
      <PageHeader
        politician={politician}
        title="Análisis de sentimiento"
        sub="Clasificación auditable · Modelo POLARIS-ES v3 · F1 0.91"
        actions={
          <>
            <TimeRangeSelector value={range} onChange={setRange} />
            <button className="btn btn-sm"><Icon name="sliders" size={13} /> Re-clasificar</button>
            <button className="btn btn-sm"><Icon name="download" size={13} /> Exportar CSV</button>
          </>
        }
      />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Top KPIs — usan breakdown real cuando isLive */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KPI label="ÍNDICE NETO" value={live.loading ? '…' : (net > 0 ? '+' + net : String(net))} sub="−100 a +100" delta={6.4} sparkData={[28,32,30,34,38,36,40,38,42,40,42,38]} accent="#2EE6C8" />
          <KPI label="POSITIVAS" value={live.loading ? '…' : pos} sub="%" delta={4.2} sparkData={[58,60,59,62,64,63,65,62,64,62,63,62]} accent="#2EE6C8" />
          <KPI label="NEGATIVAS" value={live.loading ? '…' : neg} sub="%" delta={-2.1} sparkData={[18,17,16,15,14,15,14,13,14,15,14,14]} accent="#FF4D6D" />
          <KPI label="POLARIZACIÓN" value={live.loading ? '…' : polarization} sub="índice" delta={8.4} sparkData={[0.5,0.52,0.54,0.55,0.58,0.60,0.61,0.60,0.62,0.61,0.62,0.62]} accent="#A78BFA" />
        </div>

        {/* Big chart */}
        <div className="card card-pad">
          <div className="section-h">
            <div>
              <h3>Evolución del sentimiento</h3>
              <div className="t-3" style={{ fontSize: 12 }}>Distribución porcentual diaria · 30 días</div>
            </div>
            <div className="flex items-c gap-2">
              <div className="flex items-c gap-1" style={{ padding: 3, background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 999 }}>
                {['hour', 'day', 'week'].map(g => (
                  <button key={g} onClick={() => setGranularity(g)} className="mono" style={{
                    padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: granularity === g ? 'var(--text-1)' : 'var(--text-3)',
                    background: granularity === g ? 'var(--bg-3)' : 'transparent',
                  }}>{g === 'hour' ? 'Hora' : g === 'day' ? 'Día' : 'Semana'}</button>
                ))}
              </div>
              <div className="flex gap-3">
                {[['Pos','var(--pos)'],['Neu','var(--neu)'],['Neg','var(--neg)']].map(([l,c]) =>
                  <span key={l} className="flex items-c gap-2 mono" style={{ fontSize: 11 }}>
                    <span className="dot" style={{ background: c }} />{l}
                  </span>
                )}
              </div>
            </div>
          </div>
          <AreaChart data={series} height={300} />
        </div>

        {/* Drivers + Word patterns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card card-pad">
            <div className="section-h">
              <div>
                <h3>Drivers del sentimiento<span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(255,181,70,.12)', border: '1px solid rgba(255,181,70,.3)', borderRadius: 999, color: 'var(--warn,#FFB546)', marginLeft: 6, display: 'inline-block', verticalAlign: 'middle' }}>DEMO</span></h3>
                <div className="t-3" style={{ fontSize: 12 }}>Temas que más afectan al índice</div>
              </div>
            </div>
            <div className="flex col gap-3">
              {[
                { k: 'Jornada de obras Cuajimalpa', v: 18.4, d: 'pos', desc: 'Repercusión local positiva, narrativa de obra pública' },
                { k: 'Servicios urbanos', v: 6.2, d: 'pos', desc: 'Quejas atendidas, recepción favorable' },
                { k: 'Coordinación con CDMX', v: 4.1, d: 'pos', desc: 'Visibilidad nacional, expectativa positiva' },
                { k: 'Inseguridad zona alta', v: -8.4, d: 'neg', desc: 'Narrativa de robos amplificada' },
                { k: 'Baches sin atender', v: -4.2, d: 'neg', desc: 'Asociación negativa con incumplimiento' },
                { k: 'Cuentas coordinadas', v: -3.8, d: 'neg', desc: 'Red sospechosa publicando ataques' },
              ].map((dr, i) => (
                <div key={i} className="flex items-c gap-3" style={{ padding: '10px 0', borderBottom: i === 5 ? 'none' : '1px solid var(--line-1)' }}>
                  <div style={{ width: 4, height: 28, borderRadius: 4, background: dr.d === 'pos' ? 'var(--pos)' : 'var(--neg)' }} />
                  <div className="grow">
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{dr.k}</div>
                    <div className="t-3" style={{ fontSize: 11.5, marginTop: 2 }}>{dr.desc}</div>
                  </div>
                  <div className="display" style={{ fontSize: 18, fontWeight: 500, color: dr.d === 'pos' ? 'var(--pos)' : 'var(--neg)' }}>
                    {dr.v > 0 ? '+' : ''}{dr.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div className="section-h">
              <div>
                <h3>Vocabulario emergente<span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(255,181,70,.12)', border: '1px solid rgba(255,181,70,.3)', borderRadius: 999, color: 'var(--warn,#FFB546)', marginLeft: 6, display: 'inline-block', verticalAlign: 'middle' }}>DEMO</span></h3>
                <div className="t-3" style={{ fontSize: 12 }}>Términos asociados · últimas 24h</div>
              </div>
            </div>
            <div className="flex wrap gap-2">
              {[
                ['libertad', 78, 'pos'], ['unidad', 92, 'pos'], ['cambio', 64, 'pos'], ['esperanza', 88, 'pos'],
                ['cabildo', 142, 'pos'], ['movilización', 56, 'pos'], ['victoria', 48, 'pos'],
                ['propuesta', 32, 'neu'], ['debate', 28, 'neu'], ['proceso', 22, 'neu'],
                ['fraude', 84, 'neg'], ['corrupta', 64, 'neg'], ['mentira', 42, 'neg'], ['traidor', 38, 'neg'],
                ['extranjero', 32, 'neg'], ['inhabilitada', 28, 'neg'],
              ].map(([word, weight, sent]) => {
                const size = 11 + weight / 14;
                const c = sent === 'pos' ? '#2EE6C8' : sent === 'neg' ? '#FF4D6D' : '#6B7794';
                return (
                  <span key={word} className="mono" style={{
                    padding: '5px 11px', borderRadius: 999,
                    fontSize: size,
                    background: `${c}12`,
                    border: `1px solid ${c}30`,
                    color: c,
                    fontWeight: 500,
                  }}>{word} <span style={{ opacity: 0.6, fontSize: size - 2 }}>{weight}</span></span>
                );
              })}
            </div>

            <div style={{ marginTop: 24, padding: 14, background: 'var(--bg-1)', borderRadius: 8, border: '1px solid var(--line-1)' }}>
              <div className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Insight</div>
              <div className="t-2" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                "Cabildo" se mantiene como el término más asociado positivamente desde el 17 oct. La narrativa de "fraude" intentó ganar tracción pero solo alcanzó 28% del volumen pico esperado por modelo de difusión.
              </div>
            </div>
          </div>
        </div>

        {/* Cross-platform breakdown */}
        <div className="card card-pad">
          <div className="section-h">
            <h3>Sentimiento por plataforma<span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(255,181,70,.12)', border: '1px solid rgba(255,181,70,.3)', borderRadius: 999, color: 'var(--warn,#FFB546)', marginLeft: 6, display: 'inline-block', verticalAlign: 'middle' }}>DEMO</span></h3>
            <span className="mono t-3" style={{ fontSize: 11 }}>comparativa · 7 días</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--line-1)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line-1)' }}>
            {[
              { p: 'X', v: 64, neg: 18, vol: '482K', icon: 'logo-x' },
              { p: 'TikTok', v: 78, neg: 8, vol: '128K', icon: 'logo-tt' },
              { p: 'Instagram', v: 71, neg: 12, vol: '92K', icon: 'logo-ig' },
              { p: 'Facebook', v: 54, neg: 24, vol: '184K', icon: 'logo-fb' },
            ].map(d => (
              <div key={d.p} style={{ background: 'var(--bg-2)', padding: 18 }}>
                <div className="flex items-c gap-2" style={{ marginBottom: 12 }}>
                  <PlatformChip platform={d.p} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{d.p}</div>
                    <div className="mono t-3" style={{ fontSize: 10 }}>{d.vol} menciones</div>
                  </div>
                </div>
                <div className="display" style={{ fontSize: 28, fontWeight: 500, color: d.v >= 60 ? 'var(--pos)' : 'var(--warn)', letterSpacing: '-0.02em' }}>{d.v}</div>
                <div className="t-3 mono" style={{ fontSize: 11, marginBottom: 10 }}>índice neto</div>
                <div className="flex col gap-2">
                  <div>
                    <div className="flex between mono" style={{ fontSize: 10, marginBottom: 3 }}><span className="t-3">POS</span><span>{100 - d.neg - 18}%</span></div>
                    <HBar value={100 - d.neg - 18} color="var(--pos)" height={4} />
                  </div>
                  <div>
                    <div className="flex between mono" style={{ fontSize: 10, marginBottom: 3 }}><span className="t-3">NEG</span><span>{d.neg}%</span></div>
                    <HBar value={d.neg} color="var(--neg)" height={4} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MENTIONS TAB
// =============================================
function MentionsTab({ politician }) {
  const [filter, setFilter] = React.useState('all');
  const [platform, setPlatform] = React.useState('all');
  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'pos', label: 'Positivos' },
    { id: 'neu', label: 'Neutros' },
    { id: 'neg', label: 'Negativos' },
    { id: 'viral', label: 'Virales' },
    { id: 'suspicious', label: 'Sospechosos' },
  ];
  const platforms = ['all', 'X', 'Bluesky', 'TikTok', 'Instagram', 'Facebook', 'YouTube'];

  const isLive = window.PolarisData && window.PolarisData.isUuid(politician.id);
  const [state, setState] = React.useState({ data: window.FEED_ITEMS_MOCK || [], loading: isLive, error: null, isFallback: !isLive });

  React.useEffect(() => {
    if (!isLive) return;
    let alive = true;
    setState(s => ({ ...s, loading: true }));
    window.PolarisData.loadMentions({ politician_id: politician.id, limit: 50, has_parent: false }).then(res => {
      if (!alive) return;
      setState({ ...res, loading: false });
      window.PolarisFallback && window.PolarisFallback.notify(res.isFallback, res.error);
    });
    return () => { alive = false; };
  }, [politician.id, isLive]);

  const items = (state.data || []).filter(f => {
    if (platform !== 'all' && f.platform !== platform) return false;
    if (filter === 'all') return true;
    if (filter === 'pos') return f.sentiment === 'pos';
    if (filter === 'neu') return f.sentiment === 'neu';
    if (filter === 'neg') return f.sentiment === 'neg';
    if (filter === 'viral') return f.flags && f.flags.includes('viral');
    if (filter === 'suspicious') return f.flags && f.flags.includes('suspicious');
    return true;
  });
  const filtered = items;

  return (
    <div className="fade-in">
      <PageHeader
        politician={politician}
        title="Stream de menciones"
        sub="142,488 menciones en las últimas 24 horas · Latencia <15s"
        actions={
          <>
            <button className="btn btn-sm"><Icon name="filter" size={13} /> Filtros avanzados</button>
            <button className="btn btn-sm"><Icon name="download" size={13} /> Exportar</button>
            <button className="btn btn-primary btn-sm"><Icon name="zap" size={13} /> Crear alerta</button>
          </>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Filter bar */}
        <div className="flex items-c gap-3 wrap" style={{ marginBottom: 16 }}>
          <div className="flex items-c gap-1" style={{ padding: 3, background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 999 }}>
            {filters.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                color: filter === f.id ? 'var(--text-1)' : 'var(--text-3)',
                background: filter === f.id ? 'var(--bg-3)' : 'transparent',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="t-3 mono" style={{ fontSize: 11 }}>Plataforma:</span>
            <div className="flex items-c gap-1" style={{ padding: 3, background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 999 }}>
              {platforms.map(p => (
                <button key={p} onClick={() => setPlatform(p)} style={{
                  padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                  color: platform === p ? 'var(--text-1)' : 'var(--text-3)',
                  background: platform === p ? 'var(--bg-3)' : 'transparent',
                }}>{p === 'all' ? 'Todas' : p}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Feed */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-1)' }}>
              <div className="flex items-c gap-3">
                <span className="dot live" />
                <span className="mono" style={{ fontSize: 11, letterSpacing: '0.04em' }}>{(filtered?.length ?? 0)} menciones · ordenado por relevancia</span>
              </div>
              <div className="flex items-c gap-2">
                <button className="btn btn-ghost btn-sm"><Icon name="pause" size={12} /> Pausar stream</button>
                <span className="mono t-3" style={{ fontSize: 10 }}>•</span>
                <button className="btn btn-ghost btn-sm"><Icon name="sliders" size={12} /> Vista</button>
              </div>
            </div>
            <div>
              {(filtered ?? []).map((f, i) => <FeedRow key={f.id} f={f} delay={i * 40} />)}
            </div>
            <div style={{ padding: '14px 20px', textAlign: 'center', borderTop: '1px solid var(--line-1)' }}>
              <button className="btn btn-sm">Cargar 50 menciones más <Icon name="arrow-down" size={12} /></button>
            </div>
          </div>

          {/* Side panel: stats */}
          <div className="flex col gap-4">
            <div className="card card-pad">
              <div className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Volumen 24h<span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(255,181,70,.12)', border: '1px solid rgba(255,181,70,.3)', borderRadius: 999, color: 'var(--warn,#FFB546)', marginLeft: 6, display: 'inline-block', verticalAlign: 'middle' }}>DEMO</span></div>
              <div className="display" style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-0.03em' }}>142,488</div>
              <Trend value={24.8} />
              <div style={{ marginTop: 16, marginLeft: -4, marginRight: -4 }}>
                <Sparkline data={[3200,3600,4100,5200,6800,8400,9100,8800,9400,10200,11800,12400,11200,10800,9600,8200,7400,6800,7200,8400,9800,11200,12800,14200]} color="var(--blue)" height={48} />
              </div>
              <div className="t-3 mono" style={{ fontSize: 10, marginTop: 4 }}>00h ───────── ahora</div>
            </div>

            <div className="card card-pad">
              <div className="section-h">
                <h3 style={{ fontSize: 13 }}>Top hashtags<span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(255,181,70,.12)', border: '1px solid rgba(255,181,70,.3)', borderRadius: 999, color: 'var(--warn,#FFB546)', marginLeft: 6, display: 'inline-block', verticalAlign: 'middle' }}>DEMO</span></h3>
              </div>
              <div className="flex col gap-2">
                {[
                  ['#Cuajimalpa', 28400, 'pos'],
                  ['#ObrasCuajimalpa', 18200, 'pos'],
                  ['#CDMX', 12800, 'neu'],
                  ['#NoHaceNada', 8400, 'neg'],
                  ['#VecinosCuaji', 6200, 'pos'],
                  ['#PoderCDMX', 5400, 'neu'],
                ].map(([h, v, s]) => (
                  <div key={h} className="flex between items-c" style={{ fontSize: 12, padding: '4px 0' }}>
                    <span className="mono" style={{ color: s === 'pos' ? 'var(--teal)' : s === 'neg' ? 'var(--neg)' : 'var(--text-2)' }}>{h}</span>
                    <span className="mono t-3" style={{ fontSize: 11 }}>{(typeof v === 'number' && !isNaN(v) ? (v/1000).toFixed(1) : '—')}K</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card card-pad">
              <div className="section-h">
                <h3 style={{ fontSize: 13 }}>Top voces<span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(255,181,70,.12)', border: '1px solid rgba(255,181,70,.3)', borderRadius: 999, color: 'var(--warn,#FFB546)', marginLeft: 6, display: 'inline-block', verticalAlign: 'middle' }}>DEMO</span></h3>
              </div>
              <div className="flex col gap-3">
                {[
                  ['Vecino Cuajimalpa', '@vecino_cuaji', 'VC', '184K', 'pos'],
                  ['Análisis CDMX', '@analistapol_mx', 'AC', '92K', 'neu'],
                  ['Noticias CDMX', '@noticias.cdmx', 'NC', '1.2M', 'pos'],
                  ['Crítica Local', '@critica_local', 'CL', '420K', 'neg'],
                ].map(([n, h, a, r, s]) => (
                  <div key={h} className="flex items-c gap-3">
                    <Avatar initials={a} size={30} gradient={s === 'pos' ? 'linear-gradient(135deg, #2EE6C8, #4D7CFF)' : s === 'neg' ? 'linear-gradient(135deg, #FF4D6D, #A78BFA)' : undefined} />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{n}</div>
                      <div className="mono t-3" style={{ fontSize: 10 }}>{h} · {r} reach</div>
                    </div>
                    <span className="dot" style={{ background: s === 'pos' ? 'var(--pos)' : s === 'neg' ? 'var(--neg)' : 'var(--neu)' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// CRITICS TAB
// =============================================
function CriticsTab({ politician }) {
  const isLive = window.PolarisData && window.PolarisData.isUuid(politician.id);
  const [state, setState] = React.useState({ data: window.TOP_CRITICS_MOCK || [], loading: isLive, error: null, isFallback: !isLive });

  React.useEffect(() => {
    if (!isLive) return;
    let alive = true;
    setState(s => ({ ...s, loading: true }));
    window.PolarisData.loadTopAuthors(politician.id, { scope: 'third_party', days: 30, limit: 10 }).then(res => {
      if (!alive) return;
      setState({ ...res, loading: false });
      window.PolarisFallback && window.PolarisFallback.notify(res.isFallback, res.error);
    });
    return () => { alive = false; };
  }, [politician.id, isLive]);

  const critics = state.data || [];

  return (
    <div className="fade-in">
      <PageHeader
        politician={politician}
        title="Mapa de críticos"
        sub="Cuentas y redes que generan menciones negativas · análisis de coordinación"
        actions={
          <>
            <button className="btn btn-sm"><Icon name="filter" size={13} /> Filtros</button>
            <button className="btn btn-sm"><Icon name="download" size={13} /> Exportar dataset</button>
            <button className="btn btn-primary btn-sm"><Icon name="shield" size={13} /> Reportar coordinación</button>
          </>
        }
      />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KPIs */}
        <div className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: -8 }}>
          Resumen de detección
          <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(255,181,70,.12)', border: '1px solid rgba(255,181,70,.3)', borderRadius: 999, color: 'var(--warn,#FFB546)', marginLeft: 6, display: 'inline-block', verticalAlign: 'middle' }}>DEMO</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KPI label="CRÍTICOS ACTIVOS" value="412" delta={18.4} sparkData={[280,300,320,340,360,380,390,400,405,408,410,412]} accent="#FF4D6D" />
          <KPI label="REDES COORDINADAS" value="8" sub="detectadas" delta={4} deltaSuffix="" sparkData={[3,4,4,5,6,6,7,7,8,8,8,8]} accent="#A78BFA" />
          <KPI label="VOLUMEN ATAQUE" value="24.8K" sub="24h" delta={142} sparkData={[8,12,14,18,20,22,24,28,30,32,34,32]} accent="#FFB546" />
          <KPI label="ALCANCE NEG" value="6.4M" delta={88} sparkData={[2,3,3.5,4,4.5,5,5.5,6,6.2,6.3,6.4,6.4]} accent="#FF4D6D" />
        </div>

        {/* Critics table + Network */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="flex between items-c" style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-1)' }}>
              <div>
                <div className="display" style={{ fontSize: 15, fontWeight: 500 }}>Top críticos · ranking de impacto</div>
                <div className="t-3" style={{ fontSize: 11 }}>Score = volumen × alcance × intensidad negativa</div>
              </div>
              <div className="flex items-c gap-2">
                <button className="btn btn-ghost btn-sm"><Icon name="sliders" size={12} /></button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '36px 2fr 1fr 1fr 1fr 36px', padding: '10px 20px', borderBottom: '1px solid var(--line-1)', background: 'var(--bg-1)' }}>
              {['#', 'Cuenta', 'Volumen', 'Intensidad', 'Tendencia', ''].map((h, i) => (
                <div key={i} className="mono t-3" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {state.loading && (
              <div className="flex items-c gap-2" style={{ padding: '20px 20px' }}>
                <span className="dot live" />
                <span className="t-3 mono" style={{ fontSize: 11 }}>Cargando críticos…</span>
              </div>
            )}
            {!state.loading && (critics?.length ?? 0) === 0 && (
              <div className="t-3 mono" style={{ padding: '20px 20px', fontSize: 11 }}>
                Sin críticos detectados en la ventana actual.
              </div>
            )}
            {(critics ?? []).map((c, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '36px 2fr 1fr 1fr 1fr 36px',
                padding: '14px 20px', borderBottom: i === (critics?.length ?? 0) - 1 ? 'none' : '1px solid var(--line-1)',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background 120ms var(--ease)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="mono t-3" style={{ fontSize: 12 }}>{String(i+1).padStart(2,'0')}</div>
                <div className="flex items-c gap-3" style={{ minWidth: 0 }}>
                  <Avatar initials={c.network ? '##' : ((c?.name ?? '').slice(0,2) || '··')} size={32} gradient={c.suspicious ? 'linear-gradient(135deg, #FF4D6D, #FFB546)' : c.network ? 'linear-gradient(135deg, #A78BFA, #FF4D6D)' : 'linear-gradient(135deg, #6B7794, #3D4660)'} />
                  <div style={{ minWidth: 0 }}>
                    <div className="flex items-c gap-2">
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                      {c.suspicious && <span className="pill coral" style={{ padding: '1px 6px', fontSize: 9 }}>SOSPECHOSO</span>}
                      {c.network && <span className="pill purple" style={{ padding: '1px 6px', fontSize: 9 }}>RED</span>}
                    </div>
                    <div className="t-3" style={{ fontSize: 11, marginTop: 1 }}>
                      <span className="mono">{c.handle}</span> · {c.followers}
                    </div>
                    <div className="t-3" style={{ fontSize: 11, marginTop: 4, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{c.sample}"</div>
                  </div>
                </div>
                <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>{c.volume}</div>
                <div>
                  <div className="flex items-c gap-2">
                    <div style={{ width: 60 }}><HBar value={c.intensity} color="#FF4D6D" height={5} /></div>
                    <span className="mono t-2" style={{ fontSize: 11 }}>{c.intensity}</span>
                  </div>
                </div>
                <div>
                  <Trend value={c.trend === 'up' ? 32 : c.trend === 'down' ? -12 : 0} suffix="%" />
                </div>
                <Icon name="arrow-r" size={14} style={{ color: 'var(--text-3)' }} />
              </div>
            ))}
          </div>

          <div className="card card-pad">
            <div className="section-h">
              <div>
                <h3>Red coordinada α</h3>
                <div className="t-3" style={{ fontSize: 11 }}>12 cuentas detectadas · publicación sincronizada</div>
              </div>
              <span className="pill coral">CRÍTICO</span>
            </div>
            <NetworkGraph />
            <div style={{ padding: 14, background: 'var(--bg-1)', borderRadius: 8, border: '1px solid var(--line-1)', marginTop: 16 }}>
              <div className="flex items-c gap-2" style={{ marginBottom: 10 }}>
                <Icon name="warning" size={13} style={{ color: 'var(--neg)' }} />
                <span className="mono t-2" style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Patrón detectado</span>
                <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(255,181,70,.12)', border: '1px solid rgba(255,181,70,.3)', borderRadius: 999, color: 'var(--warn,#FFB546)', marginLeft: 6, display: 'inline-block', verticalAlign: 'middle' }}>DEMO</span>
              </div>
              <div className="flex col gap-2 t-2" style={{ fontSize: 12 }}>
                <div>· 12 cuentas publicaron 84 mensajes en ventana de <b>14 minutos</b></div>
                <div>· <b>92% de superposición</b> en estructura de texto</div>
                <div>· Picos sincronizados a las <b>04:18, 04:46 y 05:12</b></div>
                <div>· 7 de 12 cuentas creadas en <b>septiembre 2024</b></div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
              <Icon name="shield" size={14} /> Generar reporte forense
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NetworkGraph() {
  // Hand-built network visualization
  const center = { x: 200, y: 130 };
  const nodes = [];
  const N = 12;
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    const r = 70 + (i % 3) * 18;
    nodes.push({
      id: i,
      x: center.x + Math.cos(angle) * r,
      y: center.y + Math.sin(angle) * r,
      size: 6 + Math.random() * 6,
      suspicious: Math.random() > 0.4,
    });
  }

  return (
    <div style={{ padding: 12, background: 'var(--bg-1)', borderRadius: 10, border: '1px solid var(--line-1)' }}>
      <svg viewBox="0 0 400 260" style={{ width: '100%', height: 260, display: 'block' }}>
        <defs>
          <radialGradient id="ng-glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Center halo */}
        <circle cx={center.x} cy={center.y} r="60" fill="url(#ng-glow)" opacity="0.4" />

        {/* Connections */}
        {nodes.map((n, i) => (
          <g key={`l-${i}`}>
            <line x1={center.x} y1={center.y} x2={n.x} y2={n.y}
                  stroke="#A78BFA" strokeOpacity="0.25" strokeWidth="1" strokeDasharray={n.suspicious ? '0' : '3 3'} />
          </g>
        ))}
        {/* Cross-connections (suspicious clusters) */}
        {[0,3,6,9].map(i => (
          <line key={`c-${i}`}
                x1={nodes[i].x} y1={nodes[i].y}
                x2={nodes[(i+1) % N].x} y2={nodes[(i+1) % N].y}
                stroke="#FF4D6D" strokeOpacity="0.5" strokeWidth="1.2" />
        ))}

        {/* Nodes */}
        {nodes.map((n, i) => (
          <g key={`n-${i}`}>
            <circle cx={n.x} cy={n.y} r={n.size + 4} fill={n.suspicious ? '#FF4D6D' : '#6B7794'} fillOpacity="0.15" />
            <circle cx={n.x} cy={n.y} r={n.size} fill={n.suspicious ? '#FF4D6D' : '#6B7794'} stroke="var(--bg-1)" strokeWidth="1.5" />
          </g>
        ))}

        {/* Center: target */}
        <circle cx={center.x} cy={center.y} r="20" fill="var(--bg-3)" stroke="#2EE6C8" strokeWidth="1.5" />
        <text x={center.x} y={center.y + 4} textAnchor="middle" fontSize="11" fontFamily="var(--font-display)" fontWeight="600" fill="#2EE6C8">MC</text>

        {/* Pulse */}
        <circle cx={center.x} cy={center.y} r="20" fill="none" stroke="#2EE6C8" strokeWidth="1" opacity="0.5">
          <animate attributeName="r" values="20;36;20" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div className="flex items-c center gap-4" style={{ marginTop: 8 }}>
        <span className="flex items-c gap-2 mono t-3" style={{ fontSize: 10 }}><span className="dot" style={{ background: '#FF4D6D' }} /> Sospechoso (8)</span>
        <span className="flex items-c gap-2 mono t-3" style={{ fontSize: 10 }}><span className="dot" style={{ background: '#6B7794' }} /> Verificado (4)</span>
        <span className="flex items-c gap-2 mono t-3" style={{ fontSize: 10 }}><span style={{ width: 12, height: 1.5, background: '#FF4D6D' }} /> Co-publicación</span>
      </div>
    </div>
  );
}

window.SentimentTab = SentimentTab;
window.MentionsTab = MentionsTab;
window.CriticsTab = CriticsTab;
