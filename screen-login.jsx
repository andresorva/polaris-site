/* ============================================
   POLARIS — Login Screen
   ============================================ */

const LoginScreen = ({ onNavigate }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const ALLOWED = { andresorva: 'PolarisTest', luisphr: 'PolarisTest' };

  const submit = (e) => {
    e?.preventDefault?.();
    setError('');
    const u = (username || '').trim();
    const p = (password || '').trim();
    if (!u || !p) {
      setError('Por favor completa los campos');
      return;
    }
    if (ALLOWED[u] && ALLOWED[u] === p) {
      try {
        localStorage.setItem('polaris_session', JSON.stringify({ user: u, loggedAt: Date.now() }));
      } catch {}
      setIsLoading(true);
      setTimeout(() => onNavigate('politicians'), 800);
    } else {
      setError('Usuario o contraseña inválidos');
      setPassword('');
    }
  };

  return (
    <div className="page-in" data-screen-label="02 Login" style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--bg-0)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* LEFT — branded panel */}
      <div style={{ position: 'relative', borderRight: '1px solid var(--line-1)', overflow: 'hidden', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
        <div className="glow-teal" style={{ opacity: 0.7 }} />
        <div className="glow-blue" />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <PolarisLogo size={22} />
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('landing')}>
            <Icon name="arrow-r" size={14} style={{ transform: 'rotate(180deg)' }} /> Volver al sitio
          </button>
        </div>

        <div style={{ position: 'relative', maxWidth: 540 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Plataforma operativa</div>
          <h1 className="display" style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1, margin: 0 }}>
            Bienvenido<br />
            <span style={{
              background: 'linear-gradient(90deg, #2EE6C8, #4D7CFF)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>de vuelta.</span>
          </h1>
          <p className="muted" style={{ fontSize: 15, lineHeight: 1.55, marginTop: 24 }}>
            Sala de operaciones lista. Inicia sesión para acceder a tu workspace de inteligencia política.
          </p>

          {/* Live status mini-panel */}
          <div className="card glass" style={{ padding: 18, marginTop: 36 }}>
            <div className="flex between items-c" style={{ marginBottom: 14 }}>
              <div className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Estado del sistema</div>
              <div className="flex items-c gap-2">
                <span className="dot live" />
                <span className="mono t-pos" style={{ fontSize: 10, letterSpacing: '0.06em' }}>OPERATIVO</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                ['Latencia', '11s', 'var(--teal)'],
                ['Cola', '3.8 min', 'var(--warn)'],
                ['Cobertura', '94%', 'var(--blue)'],
              ].map((s, i) => (
                <div key={i} style={{ paddingLeft: i ? 12 : 0, borderLeft: i ? '1px solid var(--line-1)' : 'none' }}>
                  <div className="t-3 mono" style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s[0]}</div>
                  <div className="display" style={{ fontSize: 18, fontWeight: 500, color: s[2], marginTop: 4 }}>{s[1]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div className="mono t-4" style={{ fontSize: 10, letterSpacing: '0.12em' }}>
            POLARIS · DATANAAT · ISO 27001 · GDPR COMPLIANT
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {!isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
              <PolarisLogo size={108} full={false} pulse glow />
            </div>
          )}

          {!isLoading && (
            <form onSubmit={submit} className="fade-in">
              <div className="display" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.025em', marginBottom: 6 }}>Iniciar sesión</div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 32 }}>Acceso restringido a personal autorizado.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Usuario</label>
                  <div style={{ position: 'relative' }}>
                    <Icon name="user" size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                    <input
                      className="input"
                      style={{ paddingLeft: 40 }}
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      type="text"
                      autoComplete="username"
                      autoFocus
                      placeholder="usuario"
                    />
                  </div>
                </div>

                <div>
                  <label className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <Icon name="lock" size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                    <input
                      className="input"
                      style={{ paddingLeft: 40 }}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="card" style={{ padding: '10px 14px', borderColor: 'var(--neg, #FF6B6B)', background: 'color-mix(in srgb, var(--neg) 8%, transparent)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name="info" size={14} style={{ color: 'var(--neg, #FF6B6B)', flexShrink: 0 }} />
                    <span className="t-2" style={{ fontSize: 13, color: 'var(--neg, #FF6B6B)' }}>{error}</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ marginTop: 12, padding: '14px', fontSize: 14 }}>
                  Continuar <Icon name="arrow-r" size={14} />
                </button>
              </div>
            </form>
          )}

          {isLoading && (
            <div className="fade-in" style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 32px' }}>
                <svg width="80" height="80" style={{ animation: 'spin 1.4s linear infinite' }}>
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-3)" strokeWidth="3" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--teal)" strokeWidth="3"
                          strokeDasharray="60 200" strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PolarisLogo size={26} full={false} />
                </div>
              </div>
              <div className="display" style={{ fontSize: 18, fontWeight: 500 }}>Estableciendo sesión segura</div>
              <div className="muted mono" style={{ fontSize: 12, marginTop: 12, letterSpacing: '0.04em' }}>
                Verificando permisos · Sincronizando workspace
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

window.LoginScreen = LoginScreen;
