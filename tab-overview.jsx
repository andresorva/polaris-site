/* ============================================
   POLARIS — Dashboard: Overview Tab
   ============================================ */

function PageHeader({ politician, title, sub, actions }) {
  return (
    <div className="page-header-sticky" style={{
      padding: '20px 28px',
      borderBottom: '1px solid var(--line-1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      background: 'var(--bg-1)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      <div className="flex items-c gap-4">
        <Avatar initials={politician.initials} size={48} gradient={`linear-gradient(135deg, ${politician.color}, ${politician.color}aa)`} />
        <div>
          <div className="flex items-c gap-2" style={{ marginBottom: 2 }}>
            <h1 className="display" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{title}</h1>
            <span className="pill"><span className="dot live" /> En vivo</span>
          </div>
          <div className="t-3" style={{ fontSize: 12 }}>{sub}</div>
        </div>
      </div>
      <div className="flex items-c gap-2">{actions}</div>
    </div>
  );
}

function TimeRangeSelector({ value, onChange }) {
  const opts = ['1h', '24h', '7d', '30d', '90d', 'YTD'];
  return (
    <div className="flex items-c gap-1" style={{ padding: 3, background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 999 }}>
      {opts.map(o => (
        <button key={o} onClick={() => onChange(o)} className="mono" style={{
          padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
          color: value === o ? 'var(--text-1)' : 'var(--text-3)',
          background: value === o ? 'var(--bg-3)' : 'transparent',
        }}>{o}</button>
      ))}
    </div>
  );
}

function OverviewTab({ politician, setTab }) {
  const [range, setRange] = React.useState('30d');
  const isLive = window.PolarisData && window.PolarisData.isUuid(politician.id);

  // Live data: PPI + breakdown. Si no es UUID, se queda con los valores del mock politician.
  const [live, setLive] = React.useState({
    ppi: null,
    breakdown: null,
    loading: isLive,
    error: null,
    isFallback: !isLive,
  });

  React.useEffect(() => {
    if (!isLive) return;
    let alive = true;
    setLive(s => ({ ...s, loading: true }));
    Promise.all([
      window.PolarisData.loadPPI(politician.id),
      window.PolarisData.loadSentimentBreakdown(politician.id, { days: 30 }),
    ]).then(([ppiR, brR]) => {
      if (!alive) return;
      const fallback = ppiR.isFallback || brR.isFallback;
      setLive({
        ppi: ppiR.data,
        breakdown: brR.data,
        loading: false,
        error: ppiR.error || brR.error,
        isFallback: fallback,
      });
      window.PolarisFallback && window.PolarisFallback.notify(fallback, ppiR.error || brR.error);
    });
    return () => { alive = false; };
  }, [politician.id, isLive]);

  // Valores efectivos: prefiere live cuando esté disponible
  const sentimentValue = (live?.ppi?.ppi && typeof live.ppi.ppi.score === 'number' && !isNaN(live.ppi.ppi.score))
    ? Math.round(live.ppi.ppi.score)
    : politician.sentiment;
  // Componentes live del PPI (Día 5 Ronda 7 — wireado desde backend, antes hardcoded)
  const liveComponents = (live?.ppi?.ppi && live.ppi.ppi.components) || {};
  const liveMentionCount = (typeof liveComponents.mention_count === 'number') ? liveComponents.mention_count : null;
  const liveTotalEngagement = (typeof liveComponents.total_engagement === 'number') ? liveComponents.total_engagement : null;
  const sovRaw = live?.ppi?.sov_24h;
  const isZeroActivity = !live.loading && (liveMentionCount === 0 || liveMentionCount === null) && isLive;

  // Formatter K/M para counts grandes
  const _fmtBig = (n) => {
    if (typeof n !== 'number' || isNaN(n)) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(Math.round(n));
  };

  // KPI MENCIONES 24H: cuenta real (Ronda 7 — antes leía sov_24h por error)
  const mentionsValue = (typeof liveMentionCount === 'number')
    ? _fmtBig(liveMentionCount)
    : (politician.mentions || '—');

  // KPI ALCANCE: total_engagement live (Ronda 7 #37 — antes "4.2M" hardcoded)
  const reachValue = (typeof liveTotalEngagement === 'number')
    ? _fmtBig(liveTotalEngagement)
    : '—';

  // KPI SOV: sov_24h % live (Ronda 7 #38 — antes "38" hardcoded)
  const sovDisplayValue = (typeof sovRaw === 'number' && !isNaN(sovRaw))
    ? `${sovRaw.toFixed(1)}`
    : '—';

  const momentumValue = (live?.ppi?.momentum) ?? politician?.trendDelta ?? 0;

  // Breakdown real para el donut + barras horizontales
  const br = live?.breakdown?.breakdown ?? null;

  const series = React.useMemo(() => genSentimentSeries(politician.id.charCodeAt(0), sentimentValue || 50, 8, 30), [politician, sentimentValue]);
  const sparkA = [62,58,61,55,68,72,69,74,78,75,80,84];
  const sparkB = [12,14,16,15,18,22,28,32,38,42,48,52];
  const sparkC = [4.1,4.2,4.0,4.3,4.5,4.4,4.6,4.8,5.0,4.9,5.1,5.2];

  return (
    <div className="fade-in">
      <PageHeader
        politician={politician}
        title={politician.name}
        sub={`${politician.role} · ${politician.party} · ${politician.region} · Última actualización ${politician.lastActive}`}
        actions={
          <>
            <TimeRangeSelector value={range} onChange={setRange} />
            <button className="btn btn-sm"><Icon name="filter" size={13} /> Filtros</button>
            <button className="btn btn-sm"><Icon name="download" size={13} /> Exportar</button>
            <button className="btn btn-primary btn-sm"><Icon name="zap" size={13} /> Crear alerta</button>
          </>
        }
      />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KPIs — usa live data cuando esté disponible */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {live.loading ? (
            <>
              <SkeletonKPI accent="#2EE6C8" />
              <SkeletonKPI accent="#4D7CFF" />
              <SkeletonKPI accent="#A78BFA" />
              <SkeletonKPI accent="#FFB546" />
            </>
          ) : (
            <>
              <ExpandableChart title="PPI · LIVE" description="Índice de Popularidad Política. Combina sentimiento, conversación y riesgo en escala 0-100.">
                <KPI label={isLive ? 'PPI · LIVE' : 'SENTIMIENTO'} value={sentimentValue ?? '—'} sub="/100" delta={momentumValue}
                     sparkData={sparkA} accent="#2EE6C8" />
              </ExpandableChart>
              <ExpandableChart title="Menciones 24h" description="Conversación digital del último día sobre este político.">
                <KPI label="MENCIONES 24H"
                     value={isZeroActivity ? '—' : mentionsValue}
                     sub={isZeroActivity ? 'Sin actividad reciente' : undefined}
                     delta={isZeroActivity ? undefined : 24.8}
                     sparkData={isZeroActivity ? undefined : sparkB}
                     accent="#4D7CFF" />
              </ExpandableChart>
              <ExpandableChart title="Alcance" description="Engagement total (likes + replies + shares + retweets) acumulado de todas las menciones en las últimas 24h.">
                <KPI label="ALCANCE"
                     value={reachValue}
                     sub={isZeroActivity ? 'Sin actividad reciente' : undefined}
                     delta={isZeroActivity ? undefined : 8.1}
                     sparkData={isZeroActivity ? undefined : sparkC}
                     accent="#A78BFA" />
              </ExpandableChart>
              <ExpandableChart title="Share of Voice" description="Porcentaje de la conversación política que captura este personaje vs otros políticos en sistema.">
                <KPI label="SHARE OF VOICE"
                     value={sovDisplayValue}
                     sub="%"
                     delta={isZeroActivity ? undefined : 6.2}
                     sparkData={isZeroActivity ? undefined : [28,30,32,34,33,36,38,37,39,38,40,38]}
                     accent="#FFB546" />
              </ExpandableChart>
            </>
          )}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          {/* Sentiment chart */}
          <div className="card card-pad">
            <div className="section-h">
              <div>
                <h3>Sentimiento en el tiempo</h3>
                <div className="t-3" style={{ fontSize: 12 }}>Distribución diaria · positivo / neutral / negativo</div>
              </div>
              <div className="flex gap-3">
                <span className="flex items-c gap-2 mono" style={{ fontSize: 11 }}><span className="dot" style={{ background: 'var(--pos)' }} /> Positivo</span>
                <span className="flex items-c gap-2 mono" style={{ fontSize: 11 }}><span className="dot" style={{ background: 'var(--neu)' }} /> Neutral</span>
                <span className="flex items-c gap-2 mono" style={{ fontSize: 11 }}><span className="dot" style={{ background: 'var(--neg)' }} /> Negativo</span>
              </div>
            </div>
            <ExpandableChart title="Sentimiento en el tiempo" description="Distribución diaria de menciones por carga emocional: positiva, neutral, negativa.">
              <AreaChart data={series} height={240} />
            </ExpandableChart>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line-1)' }}>
              {[
                ['Pico positivo', '18 oct', '+184% vs media', '#2EE6C8'],
                ['Pico negativo', '12 oct', '+92% vs media', '#FF4D6D'],
                ['Volatilidad', 'Moderada', 'σ = 8.4 puntos', '#FFB546'],
              ].map((s, i) => (
                <div key={i}>
                  <div className="mono t-3" style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s[0]}</div>
                  <div className="display" style={{ fontSize: 16, fontWeight: 500, marginTop: 4, color: s[3] }}>{s[1]}</div>
                  <div className="t-3" style={{ fontSize: 11, marginTop: 2 }}>{s[2]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sentiment composition donut */}
          <div className="card card-pad">
            <div className="section-h">
              <h3>Composición</h3>
              <span className="mono t-3" style={{ fontSize: 11 }}>últimas 24h</span>
            </div>
            <div className="flex center" style={{ padding: '8px 0 12px' }}>
              <div style={{ position: 'relative' }}>
                <Donut value={politician.sentiment} size={160} stroke={14} color="#2EE6C8" label={politician.sentiment} sublabel="POS · NEU · NEG" />
              </div>
            </div>
            <div className="flex col gap-3" style={{ marginTop: 8 }}>
              {(br ? [
                ['Positivo', br?.pct?.positive ?? 0, '#2EE6C8', String(br?.positive ?? 0)],
                ['Neutral', br?.pct?.neutral ?? 0, '#6B7794', String(br?.neutral ?? 0)],
                ['Negativo', br?.pct?.negative ?? 0, '#FF4D6D', String(br?.negative ?? 0)],
              ] : [
                ['Positivo', 62, '#2EE6C8', '88K'],
                ['Neutral', 24, '#6B7794', '34K'],
                ['Negativo', 14, '#FF4D6D', '20K'],
              ]).map(([label, val, color, count]) => (
                <div key={label}>
                  <div className="flex between items-c" style={{ marginBottom: 6, fontSize: 12 }}>
                    <span className="flex items-c gap-2"><span className="dot" style={{ background: color }} />{label}</span>
                    <span className="mono t-3">{count} · {val}%</span>
                  </div>
                  <HBar value={val} color={color} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Live feed + Intelligence */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          {/* Live feed */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="flex between items-c" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line-1)' }}>
              <div>
                <div className="display" style={{ fontSize: 15, fontWeight: 500 }}>Stream multiplataforma</div>
                <div className="t-3" style={{ fontSize: 11 }}>Filtros: todos · idioma:es · ordenado por relevancia</div>
              </div>
              <div className="flex items-c gap-2">
                <button className="btn btn-sm btn-ghost"><Icon name="pause" size={12} /> Pausar</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setTab('mentions')}>Ver todo <Icon name="arrow-r" size={12} /></button>
              </div>
            </div>
            <div style={{ padding: '4px 0' }}>
              {(FEED_ITEMS ?? []).slice(0, 5).map((f, i) => <FeedRow key={f?.id ?? i} f={f} delay={i * 60} />)}
            </div>
            <div className="flex items-c gap-2" style={{ padding: '12px 20px', borderTop: '1px solid var(--line-1)', justifyContent: 'center' }}>
              <span className="dot live" /><span className="mono t-3" style={{ fontSize: 11 }}>Recibiendo nuevas menciones cada ~12 segundos</span>
            </div>
          </div>

          {/* Intelligence panel */}
          <div className="flex col gap-4">
            {/* AI insights */}
            <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(167,139,250,0.06), transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line-1)', position: 'relative' }}>
                <div className="flex items-c gap-2">
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}>
                    <Icon name="spark" size={14} />
                  </div>
                  <div className="grow">
                    <div className="display" style={{ fontSize: 14, fontWeight: 500 }}>Inteligencia POLARIS <DataLabel type="demo" inline /></div>
                    <div className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.06em' }}>generado hace 4 minutos</div>
                  </div>
                  <span className="pill purple">AI</span>
                </div>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
                {[
                  { icon: 'arrow-up', color: 'var(--pos)', text: <>La jornada de obras en <b>Cuajimalpa</b> está generando un repunte de <b className="t-pos">+184%</b> en menciones positivas locales.</> },
                  { icon: 'warning', color: 'var(--warn)', text: <>Detectado patrón coordinado en 12 cuentas con publicación sincronizada. <b>Inicio: hace 6h, ventana 04:00-06:00.</b></> },
                  { icon: 'zap', color: 'var(--blue)', text: <>El hashtag <span className="mono">#Cuajimalpa</span> alcanzó <b>28K usos en TikTok</b>. Demografía dominante: 25-44 años urbanos.</> },
                ].map((ins, i) => (
                  <div key={i} className="flex items-s gap-3">
                    <div style={{ marginTop: 1, width: 18, height: 18, borderRadius: 999, background: 'var(--bg-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: ins.color, flexShrink: 0 }}>
                      <Icon name={ins.icon} size={11} strokeWidth={2} />
                    </div>
                    <div className="t-2" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{ins.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top topics */}
            <div className="card card-pad">
              <div className="section-h">
                <h3>Temas dominantes</h3>
                <span className="mono t-3" style={{ fontSize: 11 }}>top 6</span>
              </div>
              <div className="flex col gap-2">
                {(TOPICS ?? []).map((t, i) => (
                  <div key={t?.name ?? i} className="flex items-c gap-3" style={{ padding: '8px 0', borderBottom: i === ((TOPICS?.length ?? 0) - 1) ? 'none' : '1px solid var(--line-1)' }}>
                    <span className="mono t-3" style={{ fontSize: 10, width: 18 }}>{String(i + 1).padStart(2, '0')}</span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-1)' }}>{t?.name ?? '—'}</div>
                      <div className="t-3 mono" style={{ fontSize: 10 }}>{(typeof t?.mentions === 'number' && !isNaN(t.mentions) ? (t.mentions / 1000).toFixed(1) : '—')}K menciones · sent {t?.sentiment ?? '—'}</div>
                    </div>
                    <Trend value={t?.delta ?? 0} suffix="%" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Geo + Activity heatmap */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card card-pad">
            <div className="section-h">
              <h3>Distribución geográfica <DataLabel type="demo" inline /></h3>
              <span className="mono t-3" style={{ fontSize: 11 }}>menciones por estado · 24h</span>
            </div>
            <div className="flex col gap-3">
              {[
                ['CDMX', 38400, 72, '#2EE6C8'],
                ['Cuajimalpa', 28200, 78, '#2EE6C8'],
                ['Estado de México', 18900, 64, '#FFB546'],
                ['Jalisco', 12400, 58, '#FFB546'],
                ['Nuevo León', 8800, 52, '#FFB546'],
                ['Puebla', 6200, 48, '#FF4D6D'],
                ['Otros (24)', 22400, 61, '#6B7794'],
              ].map(([name, v, sent, c]) => {
                const max = 38400;
                return (
                  <div key={name}>
                    <div className="flex between items-c" style={{ fontSize: 12, marginBottom: 5 }}>
                      <span style={{ fontWeight: 500 }}>{name}</span>
                      <span className="mono t-3">{(typeof v === 'number' && !isNaN(v) ? (v/1000).toFixed(1) : '—')}K · sent {sent ?? '—'}</span>
                    </div>
                    <HBar value={(typeof v === 'number' && typeof max === 'number' && max > 0) ? (v/max)*100 : 0} color={c} height={5} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card card-pad">
            <div className="section-h">
              <h3>Actividad por hora · día <DataLabel type="demo" inline /></h3>
              <span className="mono t-3" style={{ fontSize: 11 }}>últimos 7 días · 24h</span>
            </div>
            <ExpandableChart title="Actividad por hora · día" description="Intensidad de menciones por hora del día y día de la semana.">
              <Heatmap rows={7} cols={24} />
            </ExpandableChart>
            <div className="flex between items-c" style={{ marginTop: 16 }}>
              <div className="t-3 mono" style={{ fontSize: 10, letterSpacing: '0.06em' }}>00h ················································ 23h</div>
              <div className="flex items-c gap-2 mono t-3" style={{ fontSize: 10 }}>
                <span>menos</span>
                {[0.15, 0.35, 0.55, 0.75, 0.95].map(v => (
                  <span key={v} style={{ width: 12, height: 12, borderRadius: 3, background: `rgba(46,230,200,${v})` }} />
                ))}
                <span>más</span>
              </div>
            </div>
            <div style={{ padding: 12, marginTop: 16, background: 'var(--bg-1)', borderRadius: 8, border: '1px solid var(--line-1)' }}>
              <div className="flex items-c gap-2">
                <Icon name="info" size={13} style={{ color: 'var(--blue)' }} />
                <span className="t-2" style={{ fontSize: 12 }}>Pico recurrente entre <b>19:00-22:00</b>. Mejor ventana para publicar contenido.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedRow({ f, delay = 0 }) {
  if (!f) return null;
  const sentColor = f?.sentiment === 'pos' ? '#2EE6C8' : f?.sentiment === 'neg' ? '#FF4D6D' : '#6B7794';
  const flags = f?.flags ?? [];
  const likes = f?.engagement?.likes;
  const shares = f?.engagement?.shares;
  const replies = f?.engagement?.replies;
  const score = f?.score;
  return (
    <div className="flex items-s gap-3" style={{
      padding: '14px 20px',
      borderBottom: '1px solid var(--line-1)',
      animation: `pageIn 400ms var(--ease-out) ${delay}ms both`,
      transition: 'background 120ms var(--ease)',
      cursor: 'pointer',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-1)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar initials={f?.avatar} size={34} />
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 5, background: 'var(--bg-2)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={f?.platform === 'X' ? 'logo-x' : f?.platform === 'TikTok' ? 'logo-tt' : f?.platform === 'Instagram' ? 'logo-ig' : f?.platform === 'Facebook' ? 'logo-fb' : 'logo-x'} size={9} />
        </div>
      </div>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="flex items-c gap-2 wrap" style={{ marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{f?.handle ?? '—'}</span>
          <span className="mono t-3" style={{ fontSize: 11 }}>{f?.user ?? ''}</span>
          <span className="t-4">·</span>
          <span className="t-3" style={{ fontSize: 11 }}>{f?.time ?? ''}</span>
          {flags.includes('verified') && <span className="pill blue" style={{ padding: '1px 6px', fontSize: 9 }}>✓ verificado</span>}
          {flags.includes('viral') && <span className="pill amber" style={{ padding: '1px 6px', fontSize: 9 }}>VIRAL</span>}
          {flags.includes('suspicious') && <span className="pill coral" style={{ padding: '1px 6px', fontSize: 9 }}>SOSPECHOSO</span>}
          {flags.includes('coordinated') && <span className="pill purple" style={{ padding: '1px 6px', fontSize: 9 }}>COORD</span>}
        </div>
        <div className="t-1" style={{ fontSize: 13, lineHeight: 1.5 }}>{f?.content ?? ''}</div>
        <div className="flex items-c gap-4" style={{ marginTop: 8 }}>
          <span className="flex items-c gap-1 t-3 mono" style={{ fontSize: 11 }}><Icon name="heart" size={11} /> {(typeof likes === 'number' && !isNaN(likes) ? (likes / 1000).toFixed(1) : '—')}K</span>
          <span className="flex items-c gap-1 t-3 mono" style={{ fontSize: 11 }}><Icon name="reply" size={11} /> {replies ?? '—'}</span>
          <span className="flex items-c gap-1 t-3 mono" style={{ fontSize: 11 }}><Icon name="share" size={11} /> {(typeof shares === 'number' && !isNaN(shares) ? (shares / 1000).toFixed(1) : '—')}K</span>
          <span className="flex items-c gap-1 t-3 mono" style={{ fontSize: 11 }}><Icon name="eye" size={11} /> {f?.reach ?? '—'}</span>
        </div>
      </div>
      <div className="flex col items-c gap-2" style={{ flexShrink: 0 }}>
        <div className="mono" style={{
          fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 500,
          color: sentColor,
          background: `${sentColor}15`,
          border: `1px solid ${sentColor}40`,
        }}>{(typeof score === 'number' && !isNaN(score)) ? `${score > 0 ? '+' : ''}${score.toFixed(2)}` : '—'}</div>
        <button className="btn btn-icon btn-sm btn-ghost"><Icon name="dots" size={14} /></button>
      </div>
    </div>
  );
}

window.OverviewTab = OverviewTab;
window.FeedRow = FeedRow;
window.PageHeader = PageHeader;
window.TimeRangeSelector = TimeRangeSelector;
