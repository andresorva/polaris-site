/* ============================================
   POLARIS — Politicians List / Workspace Selector
   ============================================ */

function PoliticiansScreen({ onNavigate, onSelectPolitician }) {
  const [search, setSearch] = React.useState('');
  const [view, setView] = React.useState('grid'); // grid | list
  const [region, setRegion] = React.useState('Todas');

  // Estado del fetch de politicos: loading -> {data, error, isFallback}
  const [state, setState] = React.useState({
    data: window.POLITICIANS_MOCK || [],
    loading: true,
    error: null,
    isFallback: false,
  });
  const [refreshTick, setRefreshTick] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    setState(s => ({ ...s, loading: true }));
    window.PolarisData.loadPoliticians().then(res => {
      if (!alive) return;
      setState({ ...res, loading: false });
      window.PolarisFallback && window.PolarisFallback.notify(res.isFallback, res.error);
    });
    return () => { alive = false; };
  }, [refreshTick]);

  // Region list dinamica (incluye mock + real)
  const regionsSet = new Set(['Todas']);
  state.data.forEach(p => p.region && regionsSet.add(p.region));
  const regions = Array.from(regionsSet);

  const filtered = (state.data || []).filter(p =>
    (region === 'Todas' || p.region === region) &&
    (search === '' || (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.party || '').toLowerCase().includes(search.toLowerCase()))
  );

  const select = (p) => {
    onSelectPolitician(p);
    onNavigate('dashboard');
  };

  return (
    <div className="page-in" data-screen-label="03 Politicians" style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      {/* Top bar */}
      <header style={{
        padding: '14px 32px',
        borderBottom: '1px solid var(--line-1)',
        background: 'rgba(5,7,13,0.85)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div className="flex items-c gap-6">
          <PolarisLogo size={20} />
          <div className="flex items-c gap-2 mono t-3" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
            <span>WORKSPACE</span> <Icon name="caret" size={12} style={{ transform: 'rotate(-90deg)' }} />
            <span className="t-2">Campañas México 2026</span>
          </div>
        </div>
        <div className="flex items-c gap-3">
          <span className="pill teal"><span className="dot live" /> 142 fuentes activas</span>
          <button className="btn btn-icon btn-sm"><Icon name="bell" size={15} /></button>
          <button className="btn btn-icon btn-sm"><Icon name="cog" size={15} /></button>
          <div style={{ width: 1, height: 24, background: 'var(--line-2)' }} />
          <Avatar initials="AO" size={32} gradient="linear-gradient(135deg, #2EE6C8, #4D7CFF)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Andrés Orvañanos</span>
            <span className="mono t-3" style={{ fontSize: 10 }}>Founder</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px 80px' }}>
        {/* Hero */}
        <div className="flex between items-s wrap gap-4" style={{ marginBottom: 40 }}>
          <div>
            <div className="eyebrow">Selecciona un objetivo</div>
            <h1 className="display" style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-0.03em', margin: '12px 0 8px', lineHeight: 1.05 }}>
              ¿A quién monitoreamos hoy?
            </h1>
            <p className="t-2" style={{ fontSize: 15, maxWidth: 560, margin: 0 }}>
              Cada perfil es una sala de operaciones independiente. Streams, alertas y reportes se ajustan al objetivo seleccionado.
            </p>
          </div>
          <div className="flex items-c gap-2">
            <button className="btn btn-sm" onClick={() => { window.apiClient && window.apiClient.cacheClear(); setRefreshTick(t => t + 1); }} title="Recargar">
              <Icon name="history" size={13} /> Recargar
            </button>
            <button className="btn btn-primary">
              <Icon name="plus" size={14} /> Añadir político
            </button>
          </div>
        </div>

        {/* Estado del fetch — banner sutil sobre la lista */}
        {state.loading && (
          <div className="card card-pad" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="dot live" />
            <span className="t-3 mono" style={{ fontSize: 11 }}>Cargando políticos desde la API…</span>
          </div>
        )}
        {!state.loading && state.error && state.isFallback && (
          <div className="card card-pad" style={{ marginBottom: 12, borderColor: 'rgba(255,181,70,0.3)', background: 'rgba(255,181,70,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="warning" size={14} style={{ color: 'var(--warn)' }} />
            <span className="t-2" style={{ fontSize: 12 }}>
              No se pudo conectar al API. Mostrando datos de demostración. <button className="btn btn-sm btn-ghost" style={{ padding: '2px 8px' }} onClick={() => setRefreshTick(t => t + 1)}>Reintentar</button>
            </span>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-c gap-3 wrap" style={{ marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 380 }}>
            <Icon name="search" size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: 40 }} placeholder="Buscar por nombre o partido..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-c gap-1" style={{ padding: 4, background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 999 }}>
            {regions.map(r => (
              <button key={r} onClick={() => setRegion(r)} style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                color: region === r ? 'var(--text-1)' : 'var(--text-3)',
                background: region === r ? 'var(--bg-3)' : 'transparent',
                transition: 'all 120ms var(--ease)',
              }}>{r}</button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono t-3" style={{ fontSize: 11 }}>{filtered.length} de {POLITICIANS.length}</span>
            <div className="flex items-c gap-1" style={{ padding: 3, background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 8 }}>
              <button onClick={() => setView('grid')} style={{ padding: 6, borderRadius: 6, color: view === 'grid' ? 'var(--text-1)' : 'var(--text-3)', background: view === 'grid' ? 'var(--bg-3)' : 'transparent' }}>
                <Icon name="grid" size={14} />
              </button>
              <button onClick={() => setView('list')} style={{ padding: 6, borderRadius: 6, color: view === 'list' ? 'var(--text-1)' : 'var(--text-3)', background: view === 'list' ? 'var(--bg-3)' : 'transparent' }}>
                <Icon name="list" size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        {view === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {filtered.map((p, i) => (
              <PoliticianCard key={p.id} p={p} onClick={() => select(p)} delay={i * 40} />
            ))}
            {/* Add new card */}
            <button onClick={() => {}} style={{
              minHeight: 280,
              border: '1.5px dashed var(--line-2)', borderRadius: 14,
              background: 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 12, color: 'var(--text-3)',
              transition: 'all 200ms var(--ease)', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)'; e.currentTarget.style.background = 'rgba(46,230,200,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, border: '1px dashed currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span className="display" style={{ fontSize: 15, fontWeight: 500 }}>Añadir político</span>
                <span style={{ fontSize: 12 }}>Configura un nuevo objetivo</span>
              </div>
            </button>
          </div>
        )}

        {view === 'list' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 36px', padding: '14px 20px', borderBottom: '1px solid var(--line-1)', background: 'var(--bg-1)' }}>
              {['Político', 'Región', 'Sentimiento', 'Menciones 24h', 'Tendencia', ''].map((h, i) => (
                <div key={i} className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {filtered.map((p, i) => (
              <PoliticianRow key={p.id} p={p} onClick={() => select(p)} last={i === filtered.length - 1} />
            ))}
          </div>
        )}

        {/* Footer / hint */}
        <div className="flex items-c gap-3" style={{ marginTop: 48, padding: 18, background: 'var(--bg-1)', border: '1px solid var(--line-1)', borderRadius: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-3)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
            <Icon name="info" size={16} />
          </div>
          <div className="grow">
            <div style={{ fontSize: 13, fontWeight: 500 }}>Tu plan permite hasta 12 políticos monitoreados simultáneamente</div>
            <div className="t-3" style={{ fontSize: 12 }}>Actualmente usas 6 de 12 · Cada uno consume cuota separada de menciones</div>
          </div>
          <button className="btn btn-sm">Gestionar plan <Icon name="arrow-r" size={12} /></button>
        </div>
      </main>
    </div>
  );
}

function PoliticianCard({ p, onClick, delay }) {
  const spark = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 24; i++) {
      arr.push(50 + Math.sin(i * 0.5 + p.id.charCodeAt(0)) * 15 + Math.cos(i * 0.3) * 8);
    }
    return arr;
  }, [p.id]);
  const sentColor = p.sentiment >= 60 ? '#2EE6C8' : p.sentiment >= 45 ? '#FFB546' : '#FF4D6D';

  return (
    <button onClick={onClick} className="card lift" style={{
      padding: 0, textAlign: 'left',
      cursor: 'pointer',
      animation: `pageIn 400ms var(--ease-out) ${delay}ms both`,
      overflow: 'visible',
      position: 'relative',
    }}>
      {/* Top accent */}
      <div style={{
        height: 80,
        background: `linear-gradient(135deg, ${p.color}22, ${p.color}08), linear-gradient(180deg, var(--bg-3), var(--bg-2))`,
        borderBottom: '1px solid var(--line-1)',
        position: 'relative',
        overflow: 'visible',
      }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
        </div>
        <div style={{ position: 'absolute', top: 12, right: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="dot live" />
          <span className="mono t-2" style={{ fontSize: 9, letterSpacing: '0.08em' }}>EN VIVO</span>
        </div>
        {/* Avatar overlap */}
        <div style={{ position: 'absolute', bottom: -28, left: 20 }}>
          <div className="avatar" style={{
            width: 56, height: 56, fontSize: 18,
            background: `linear-gradient(135deg, ${p.color}, ${p.color}aa)`,
            border: '3px solid var(--bg-2)',
          }}>{p.initials}</div>
        </div>
      </div>

      <div style={{ padding: '36px 20px 20px' }}>
        <div className="flex between items-s gap-2">
          <div>
            <div className="display" style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.015em', lineHeight: 1.2 }}>{p.name}</div>
            <div className="t-3" style={{ fontSize: 12, marginTop: 4 }}>{p.role} · {p.party}</div>
          </div>
          <span className="pill" style={{ fontSize: 10, padding: '3px 8px' }}>{p.region}</span>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line-1)' }}>
          <div>
            <div className="mono t-3" style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sentimiento</div>
            <div className="flex items-c gap-2" style={{ marginTop: 6 }}>
              <span className="display" style={{ fontSize: 22, fontWeight: 500, color: sentColor, letterSpacing: '-0.02em' }}>{p.sentiment}</span>
              <Trend value={p.trendDelta} />
            </div>
          </div>
          <div>
            <div className="mono t-3" style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Menciones 24h</div>
            <div className="display" style={{ fontSize: 22, fontWeight: 500, marginTop: 6, letterSpacing: '-0.02em' }}>{p.mentions}</div>
          </div>
        </div>

        {/* Sparkline */}
        <div style={{ marginTop: 14, marginLeft: -4, marginRight: -4 }}>
          <Sparkline data={spark} color={sentColor} height={28} />
        </div>

        {/* Bottom strip */}
        <div className="flex between items-c" style={{ marginTop: 12 }}>
          <div className="flex items-c gap-2 t-3" style={{ fontSize: 11 }}>
            <span className="mono">{p.handle}</span>
            <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--text-4)' }} />
            <span>{p.lastActive}</span>
          </div>
          <Icon name="arrow-r" size={14} style={{ color: 'var(--text-3)' }} />
        </div>
      </div>

      {/* Hover glow */}
      <div className="hover-glow" style={{
        position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none',
        boxShadow: `0 0 0 1px ${p.color}40, 0 16px 40px ${p.color}18`,
        opacity: 0, transition: 'opacity 200ms var(--ease)',
      }} />
      <style>{`button.card:hover .hover-glow { opacity: 1; }`}</style>
    </button>
  );
}

function PoliticianRow({ p, onClick, last }) {
  const sentColor = p.sentiment >= 60 ? '#2EE6C8' : p.sentiment >= 45 ? '#FFB546' : '#FF4D6D';
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left',
      display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 36px',
      padding: '16px 20px',
      borderBottom: last ? 'none' : '1px solid var(--line-1)',
      background: 'transparent',
      transition: 'background 120ms var(--ease)',
      cursor: 'pointer',
      alignItems: 'center',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div className="flex items-c gap-3">
        <Avatar initials={p.initials} size={36} gradient={`linear-gradient(135deg, ${p.color}, ${p.color}aa)`} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
          <div className="t-3" style={{ fontSize: 12 }}>{p.role} · {p.party}</div>
        </div>
      </div>
      <div className="t-2" style={{ fontSize: 13 }}>{p.region}</div>
      <div className="flex items-c gap-2">
        <div className="display" style={{ fontSize: 18, fontWeight: 500, color: sentColor }}>{p.sentiment}</div>
        <div style={{ width: 60 }}><HBar value={p.sentiment} color={sentColor} /></div>
      </div>
      <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>{p.mentions}</div>
      <div><Trend value={p.trendDelta} /></div>
      <Icon name="arrow-r" size={14} style={{ color: 'var(--text-3)' }} />
    </button>
  );
}

window.PoliticiansScreen = PoliticiansScreen;
