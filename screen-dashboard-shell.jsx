/* ============================================
   POLARIS — Dashboard Shell (navbar + sidebar + tabs)
   ============================================ */

const ErrorBoundary = (typeof window !== 'undefined' && window.ErrorBoundary) || React.Fragment;

const TABS = [
  { id: 'overview', label: 'Vista general', icon: 'compass' },
  { id: 'brief', label: 'Daily Brief', icon: 'star' },
  { id: 'strategist', label: 'Estrategia', icon: 'spark' },
  { id: 'sentiment', label: 'Sentimiento', icon: 'pulse' },
  { id: 'mentions', label: 'Menciones', icon: 'volume' },
  { id: 'critics', label: 'Críticos', icon: 'crosshair' },
  { id: 'alerts', label: 'Alertas', icon: 'bell', badge: 3 },
  { id: 'reports', label: 'Reportes', icon: 'doc' },
  { id: 'sources', label: 'Fuentes', icon: 'plug' },
];

// Hook compartido para detectar mobile vs desktop (breakpoint 768)
function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false,
  );
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

function DashboardNavbar({ politician, onNavigate, onSelectPolitician, onToggleSidebar, autoRefresh, setAutoRefresh, secondsToRefresh, activeTab, onShare }) {
  const [showSwitcher, setShowSwitcher] = React.useState(false);
  return (
    <header style={{
      padding: '10px 24px',
      borderBottom: '1px solid var(--line-1)',
      background: 'var(--bg-0)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16,
    }}>
      <div className="flex items-c gap-4">
        {/* Hamburger — solo visible en mobile (controlado por CSS) */}
        <button
          className="btn btn-icon btn-sm btn-mobile-menu"
          onClick={onToggleSidebar}
          aria-label="Abrir menu"
          title="Abrir menu"
        >
          <Icon name="menu" size={18} />
        </button>
        <span
          onClick={() => typeof onNavigate === 'function' && onNavigate('politicians')}
          style={{ cursor: 'pointer', display: 'inline-flex' }}
          title="Volver al selector"
          aria-label="Volver al selector de políticos"
        >
          <PolarisLogo size={20} />
        </span>
        <div style={{ width: 1, height: 22, background: 'var(--line-2)' }} />
        {/* Workspace breadcrumb */}
        <div className="flex items-c gap-2 mono" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
          <span className="t-3">MX-2026</span>
          <Icon name="caret" size={11} style={{ transform: 'rotate(-90deg)', color: 'var(--text-4)' }} />
          <button
            onClick={() => setShowSwitcher(v => !v)}
            title="Cambiar de político"
            aria-label="Cambiar de político"
            aria-expanded={showSwitcher}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--bg-2)', border: '1px solid var(--line-2)',
              color: 'var(--text-1)', fontSize: 12, fontWeight: 500,
              position: 'relative',
              cursor: 'pointer',
            }}>
            <span style={{ width: 16, height: 16, borderRadius: 999, background: `linear-gradient(135deg, ${politician.color}, ${politician.color}aa)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {politician.initials}
            </span>
            {politician.name}
            <Icon name="caret" size={11} style={{ color: 'var(--text-3)' }} />

            {showSwitcher && (
              <div onClick={e => e.stopPropagation()} className="card fade-in" style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                width: 280, padding: 6,
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
              }}>
                <div className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', padding: '8px 12px 6px' }}>CAMBIAR DE OBJETIVO</div>
                {POLITICIANS.map(p => (
                  <div key={p.id} onClick={() => { onSelectPolitician(p); setShowSwitcher(false); }} style={{
                    padding: '8px 10px', borderRadius: 8,
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: p.id === politician.id ? 'var(--bg-3)' : 'transparent',
                    cursor: 'pointer',
                  }}>
                    <Avatar initials={p.initials} size={26} gradient={`linear-gradient(135deg, ${p.color}, ${p.color}aa)`} />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>{p.name}</div>
                      <div className="t-3" style={{ fontSize: 10 }}>{p.region}</div>
                    </div>
                    {p.id === politician.id && <Icon name="check" size={13} style={{ color: 'var(--teal)' }} />}
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--line-1)', marginTop: 6, paddingTop: 6 }}>
                  <div onClick={() => { setShowSwitcher(false); onNavigate('politicians'); }} style={{ padding: '8px 10px', borderRadius: 8, fontSize: 12, color: 'var(--teal)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="grid" size={13} /> Ver todos los políticos
                  </div>
                </div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Center: command bar */}
      <div style={{ flex: '0 1 480px', position: 'relative' }}>
        <Icon name="search" size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input className="input" style={{ paddingLeft: 38, paddingRight: 60, height: 36, fontSize: 12 }} placeholder="Buscar menciones, cuentas, narrativas..." />
        <span className="mono" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--text-3)', padding: '2px 6px', border: '1px solid var(--line-2)', borderRadius: 4 }}>⌘K</span>
      </div>

      <div className="flex items-c gap-2">
        <span className="pill teal"><span className="dot live" /> EN VIVO · 11s</span>
        <button
          className="btn btn-icon btn-sm"
          onClick={() => typeof setAutoRefresh === 'function' && setAutoRefresh(v => !v)}
          title={autoRefresh ? `Pausar auto-refresh (próx: ${secondsToRefresh}s)` : 'Activar auto-refresh'}
          aria-label={autoRefresh ? 'Pausar auto-refresh' : 'Activar auto-refresh'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, paddingLeft: 10, paddingRight: 12, width: 'auto' }}
        >
          <Icon name={autoRefresh ? 'pause' : 'play'} size={15} />
          {autoRefresh && typeof secondsToRefresh === 'number' && (
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums', minWidth: 22, textAlign: 'right' }}>
              {secondsToRefresh}s
            </span>
          )}
        </button>
        <button className="btn btn-icon btn-sm" title="Alertas" style={{ position: 'relative' }}>
          <Icon name="bell" size={15} />
          <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 999, background: 'var(--neg)', boxShadow: '0 0 0 2px var(--bg-0)' }} />
        </button>
        <button
          className="btn btn-icon btn-sm"
          title="¿Cómo funciona POLARIS?"
          aria-label="Cómo funciona POLARIS"
          onClick={() => typeof onNavigate === 'function' && onNavigate('info')}
        >
          <Icon name="info" size={15} />
        </button>
        <button
          className="btn btn-icon btn-sm"
          onClick={() => typeof onShare === 'function' && onShare()}
          title="Compartir esta vista"
          aria-label="Compartir esta vista"
        >
          <Icon name="share" size={15} />
        </button>
        <button className="btn btn-icon btn-sm"><Icon name="cog" size={15} /></button>
        <ThemeToggle />
        <div style={{ width: 1, height: 22, background: 'var(--line-2)', margin: '0 4px' }} />
        <Avatar initials="AO" size={28} gradient="linear-gradient(135deg, #2EE6C8, #4D7CFF)" />
        <button
          className="btn btn-icon btn-sm"
          onClick={() => {
            if (typeof haptic === 'function') haptic('medium');
            try { localStorage.removeItem('polaris_session'); } catch {}
            if (typeof onNavigate === 'function') onNavigate('login');
          }}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <Icon name="logout" size={15} />
        </button>
      </div>
    </header>
  );
}

function MobileTabsBar({ activeTab, setTab }) {
  // Render bar horizontal solo en mobile (controlado por CSS .mobile-tabs-bar via media query)
  // Auto-scroll del tab activo a la vista
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const active = el.querySelector('.mobile-tab.active');
    if (active && active.scrollIntoView) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  return (
    <div className="mobile-tabs-bar" ref={ref} role="tablist" aria-label="Vistas del dashboard">
      {TABS.map(t => (
        <button
          key={t.id}
          role="tab"
          aria-selected={activeTab === t.id}
          className={`mobile-tab ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => { if (typeof haptic === 'function') haptic('light'); setTab(t.id); }}
        >
          <Icon name={t.icon} size={14} />
          <span>{t.label}</span>
          {t.badge && <span className="pill coral" style={{ padding: '0 6px', fontSize: 9, lineHeight: 1.4, marginLeft: 4 }}>{t.badge}</span>}
        </button>
      ))}
    </div>
  );
}

// --- Bottom Tab Bar iOS-style (Día 5 Ronda 4) ---
const PRIMARY_TABS = ['overview', 'sentiment', 'brief', 'critics'];

function BottomTabBar({ activeTab, setTab }) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const primary = TABS.filter(t => PRIMARY_TABS.includes(t.id));
  const secondary = TABS.filter(t => !PRIMARY_TABS.includes(t.id));
  const isInSecondary = secondary.some(t => t.id === activeTab);

  React.useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  return (
    <>
      <nav className="bottom-tab-bar" role="tablist" aria-label="Navegación principal">
        {primary.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              className={`bottom-tab ${isActive ? 'active' : ''}`}
              onClick={() => { if (typeof haptic === 'function') haptic('light'); setTab(t.id); }}
            >
              <Icon name={t.icon} size={20} />
              <span>{t.label}</span>
              {t.badge && <span className="bottom-tab-badge">{t.badge}</span>}
            </button>
          );
        })}
        <button
          role="tab"
          aria-selected={isInSecondary}
          className={`bottom-tab ${isInSecondary || moreOpen ? 'active' : ''}`}
          onClick={() => { if (typeof haptic === 'function') haptic('light'); setMoreOpen(true); }}
        >
          <Icon name="dots" size={20} />
          <span>Más</span>
        </button>
      </nav>
      {moreOpen && (
        <>
          <div className="bottom-tab-backdrop" onClick={() => setMoreOpen(false)} />
          <div className="bottom-tab-drawer" role="dialog" aria-label="Más opciones">
            <div className="bottom-tab-drawer-handle" />
            <div className="bottom-tab-drawer-title">Más opciones</div>
            <div className="bottom-tab-drawer-list">
              {secondary.map(t => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={isActive}
                    className={`bottom-tab-drawer-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (typeof haptic === 'function') haptic('light');
                      setTab(t.id);
                      setMoreOpen(false);
                    }}
                  >
                    <Icon name={t.icon} size={18} />
                    <span className="grow">{t.label}</span>
                    {t.badge && <span className="pill coral" style={{ padding: '1px 7px', fontSize: 10 }}>{t.badge}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}


function DashboardSidebar({ activeTab, setTab, onClose }) {
  return (
    <aside style={{
      width: 220,
      borderRight: '1px solid var(--line-1)',
      background: 'var(--bg-1)',
      padding: '20px 16px',
      display: 'flex', flexDirection: 'column', gap: 4,
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      <div style={{ padding: '6px 14px 16px', marginBottom: 4, borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <PolarisLogo size={28} pulse glow={false} />
        {/* Botón cerrar drawer — solo visible en mobile (CSS lo muestra) */}
        <button
          className="btn btn-icon btn-sm btn-mobile-menu"
          onClick={onClose}
          aria-label="Cerrar menu"
          title="Cerrar"
        >
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 14px 8px' }}>Operaciones</div>
      {TABS.map(t => (
        <div key={t.id} className={`nav-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => { setTab(t.id); onClose && onClose(); }}>
          <Icon name={t.icon} size={16} />
          <span className="grow">{t.label}</span>
          {t.badge && <span className="pill coral" style={{ padding: '1px 7px', fontSize: 10, lineHeight: 1.2 }}>{t.badge}</span>}
        </div>
      ))}

      <div className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '20px 14px 8px' }}>Listas guardadas</div>
      {[
        { name: 'Críticos top 50', color: '#FF4D6D' },
        { name: 'Aliados verificados', color: '#2EE6C8' },
        { name: 'Periodistas LATAM', color: '#A78BFA' },
        { name: 'Bots detectados', color: '#FFB546' },
      ].map(l => (
        <div key={l.name} className="nav-item">
          <span style={{ width: 8, height: 8, borderRadius: 999, background: l.color }} />
          <span className="grow">{l.name}</span>
        </div>
      ))}

      <div style={{ marginTop: 'auto' }}>
        <div className="card" style={{ padding: 14, marginTop: 24 }}>
          <div className="flex items-c gap-2" style={{ marginBottom: 8 }}>
            <Icon name="zap" size={14} style={{ color: 'var(--warn)' }} />
            <span className="mono t-2" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cuota mensual</span>
          </div>
          <div className="flex between items-baseline">
            <span className="display" style={{ fontSize: 18, fontWeight: 500 }}>68%</span>
            <span className="mono t-3" style={{ fontSize: 10 }}>2.04M / 3M</span>
          </div>
          <HBar value={68} color="var(--warn)" />
          <div className="t-3" style={{ fontSize: 10, marginTop: 6 }}>Reinicia el 1 nov</div>
        </div>
      </div>
    </aside>
  );
}

// Banner amarillo "modo demo" que aparece cuando algun fetch fallo
// y se cayo a datos mock. Se suscribe a CustomEvent('polaris:fallback').
function DemoModeBanner() {
  const [fallback, setFallback] = React.useState({ active: false, error: null, at: 0 });
  const [dismissed, setDismissed] = React.useState(false);
  React.useEffect(() => {
    const onEvt = (e) => {
      const d = e.detail || {};
      // Solo refresca si cambia el estado o el error
      if (d.active) {
        setFallback({ active: true, error: d.error, at: d.ts || Date.now() });
        setDismissed(false);
      } else {
        // No despachamos active=false cada vez para evitar parpadeo;
        // solo el componente decide si quitarlo cuando un nuevo fetch tiene exito.
      }
    };
    window.addEventListener('polaris:fallback', onEvt);
    return () => window.removeEventListener('polaris:fallback', onEvt);
  }, []);
  if (!fallback.active || dismissed) return null;
  return (
    <div className="demo-mode-banner" role="status">
      <span className="dot" />
      <span>Mostrando datos de demostración — API no disponible</span>
      {fallback.error && <span className="mono" style={{ opacity: 0.7, fontSize: 11 }}>({fallback.error.slice(0, 60)})</span>}
      <button
        className="btn btn-sm btn-ghost"
        style={{ marginLeft: 8, padding: '2px 10px', color: 'inherit' }}
        onClick={() => { window.apiClient && window.apiClient.cacheClear(); window.location.reload(); }}
      >Reintentar</button>
      <button
        aria-label="Cerrar banner"
        style={{ marginLeft: 4, color: 'inherit', opacity: 0.6, cursor: 'pointer', background: 'none', border: 'none', padding: '0 4px' }}
        onClick={() => setDismissed(true)}
      >×</button>
    </div>
  );
}

function DashboardScreen({ politician, onNavigate, onSelectPolitician, deepLinkDate, deepLinkTab }) {
  const [tab, setTab] = React.useState(deepLinkTab && ['overview', 'sentiment', 'mentions', 'critics', 'alerts', 'reports', 'sources', 'brief', 'daily-brief', 'strategist'].includes(deepLinkTab) ? (deepLinkTab === 'daily-brief' ? 'brief' : deepLinkTab) : 'overview');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [refreshTick, setRefreshTick] = React.useState(0);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const isMobile = useIsMobile();
  const { toast, show: showToast } = useToast();
  const [liveQueryParams, setLiveQueryParams] = React.useState(null);
  const handleShare = React.useCallback(async () => {
    if (typeof haptic === 'function') haptic('light');
    const result = await sharePolaris({
      politician,
      tab,
      date: new Date().toISOString().slice(0, 10),
      onCopied: () => showToast('✓ URL copiada al portapapeles'),
    });
    if (result.method === 'share') showToast('Compartido');
    if (result.method === 'fallback') showToast('Copia manual: ' + result.url);
    if (result.method === 'error') showToast('Error al compartir');
  }, [politician, tab, showToast]);
  const refreshIntervalSec = Math.floor((((typeof window !== 'undefined' && window.POLARIS_CONFIG && window.POLARIS_CONFIG.AUTO_REFRESH_MS) || 60000) / 1000));
  const [secondsToRefresh, setSecondsToRefresh] = React.useState(refreshIntervalSec);

  // Pull-to-refresh ref para el <main> scrollable
  const mainRef = React.useRef(null);
  const triggerManualRefresh = React.useCallback(() => {
    if (window.apiClient) window.apiClient.cacheClear();
    setRefreshTick(t => t + 1);
    setSecondsToRefresh(refreshIntervalSec);
  }, [refreshIntervalSec]);
  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: triggerManualRefresh,
    threshold: 80,
    scrollEl: mainRef.current,
  });

  // Auto-refresh del tab activo cada AUTO_REFRESH_MS (60s).
  // Limpia el cache del API y bumpea refreshTick para invalidar consumers
  // sin re-montar el TabPane (refreshTick ya no está en su key).
  React.useEffect(() => {
    if (!autoRefresh) {
      setSecondsToRefresh(refreshIntervalSec);
      return;
    }
    setSecondsToRefresh(refreshIntervalSec);
    const tick = setInterval(() => {
      setSecondsToRefresh(s => (s > 1 ? s - 1 : refreshIntervalSec));
    }, 1000);
    const refreshTimer = setInterval(() => {
      if (window.apiClient) window.apiClient.cacheClear();
      setRefreshTick(t => t + 1);
      setSecondsToRefresh(refreshIntervalSec);
    }, refreshIntervalSec * 1000);
    return () => { clearInterval(tick); clearInterval(refreshTimer); };
  }, [autoRefresh, refreshIntervalSec]);

  // Sincroniza body class para drawer overlay (CSS body.sidebar-open lo dibuja)
  React.useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen, isMobile]);

  // Cierra el drawer al cambiar de tab en mobile
  React.useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [tab, isMobile]);

  // Cierra el drawer si tapan el overlay
  React.useEffect(() => {
    if (!sidebarOpen) return;
    const onClick = (e) => {
      // El overlay es el ::before de body — no es clickeable directo,
      // así que detectamos clicks fuera del aside.
      const aside = document.querySelector('div[data-screen-label="04 Dashboard"] aside');
      if (aside && !aside.contains(e.target) && !e.target.closest('.btn-mobile-menu')) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [sidebarOpen]);

  const TabPane = {
    overview: OverviewTab,
    brief: typeof DailyBriefTab !== 'undefined' ? DailyBriefTab : OverviewTab,
    strategist: typeof StrategistTab !== 'undefined' ? StrategistTab : OverviewTab,
    sentiment: SentimentTab,
    mentions: MentionsTab,
    critics: CriticsTab,
    alerts: AlertsTab,
    reports: ReportsTab,
    sources: SourcesTab,
  }[tab];

  return (
    <div className="page-in" data-screen-label="04 Dashboard" style={{ minHeight: '100vh', background: 'var(--bg-0)', display: 'flex', flexDirection: 'column' }}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={80} />
      <DemoModeBanner />
      {typeof CrisisBanner !== 'undefined' && (
        <CrisisBanner politicianId={politician.id} onSeeDetail={() => setTab('alerts')} />
      )}
      <DashboardNavbar
        politician={politician}
        onNavigate={onNavigate}
        onSelectPolitician={onSelectPolitician}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        secondsToRefresh={secondsToRefresh}
        activeTab={tab}
        onShare={handleShare}
      />
      {/* Tabs horizontales scroll — solo visible en mobile via CSS */}
      <MobileTabsBar activeTab={tab} setTab={setTab} />
      {isMobile && <BottomTabBar activeTab={tab} setTab={setTab} />}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <DashboardSidebar activeTab={tab} setTab={setTab} onClose={() => setSidebarOpen(false)} />
        <main ref={mainRef} style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          <LiveQuerySearch politicianId={politician.id} onResult={(params) => setLiveQueryParams(params)} />
          {TabPane && (
            <ErrorBoundary>
              <TabPane
                key={`${politician.id}-${tab}`}
                politician={politician}
                setTab={setTab}
                refreshTick={refreshTick}
                deepLinkDate={deepLinkDate}
              />
            </ErrorBoundary>
          )}
        </main>
      </div>
      <Toast message={toast?.message} variant={toast?.variant} />
      {liveQueryParams && (
        <LiveQueryResults
          politicianId={politician.id}
          params={liveQueryParams}
          onClose={() => setLiveQueryParams(null)}
        />
      )}
      {!isMobile && typeof Footer !== 'undefined' && <Footer compact />}
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
window.useIsMobile = useIsMobile;
