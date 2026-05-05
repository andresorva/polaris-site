/* ============================================
   POLARIS — Login Screen
   ============================================ */

function LoginScreen({ onNavigate }) {
  const [email, setEmail] = React.useState('maria.gonzalez@campana-ve.com');
  const [password, setPassword] = React.useState('••••••••••••');
  const [step, setStep] = React.useState('credentials'); // credentials | mfa | loading

  const submit = (e) => {
    e?.preventDefault?.();
    setStep('mfa');
  };
  const verify = (e) => {
    e?.preventDefault?.();
    setStep('loading');
    setTimeout(() => onNavigate('politicians'), 1100);
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
          <p className="t-2" style={{ fontSize: 15, lineHeight: 1.55, marginTop: 24 }}>
            Tu sala de operaciones está al día. 142,488 menciones procesadas desde tu última sesión.
            Tres alertas requieren tu atención.
          </p>

          {/* Live status mini-panel */}
          <div className="card" style={{ padding: 18, marginTop: 36, background: 'rgba(15,22,38,0.6)', backdropFilter: 'blur(20px)' }}>
            <div className="flex between items-c" style={{ marginBottom: 14 }}>
              <div className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Estado del sistema</div>
              <div className="flex items-c gap-2">
                <span className="dot live" />
                <span className="mono t-pos" style={{ fontSize: 10, letterSpacing: '0.06em' }}>OPERATIVO</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                ['Latencia X', '11s', '#2EE6C8'],
                ['Cola TikTok', '3.8 min', '#FFB546'],
                ['Cobertura', '94%', '#4D7CFF'],
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
            POLARIS v2.4.1 · DATANAAT S.A. · ISO 27001 · GDPR COMPLIANT
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Big logo above form */}
          {step !== 'loading' && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
              <PolarisLogo size={108} full={false} pulse glow />
            </div>
          )}
          {step === 'credentials' && (
            <form onSubmit={submit} className="fade-in">
              <div className="display" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.025em', marginBottom: 6 }}>Iniciar sesión</div>
              <p className="t-3" style={{ fontSize: 13, marginBottom: 32 }}>Acceso restringido a personal autorizado.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Email corporativo</label>
                  <div style={{ position: 'relative' }}>
                    <Icon name="mail" size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                    <input className="input" style={{ paddingLeft: 40 }} value={email} onChange={e => setEmail(e.target.value)} type="email" />
                  </div>
                </div>
                <div>
                  <div className="flex between items-c" style={{ marginBottom: 8 }}>
                    <label className="mono t-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Contraseña</label>
                    <a className="t-teal" style={{ fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>¿Olvidaste?</a>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Icon name="lock" size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                    <input className="input" style={{ paddingLeft: 40 }} value={password} onChange={e => setPassword(e.target.value)} type="password" />
                  </div>
                </div>

                <label className="flex items-c gap-2" style={{ cursor: 'pointer', marginTop: 4 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid var(--line-3)', background: 'var(--teal)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="check" size={11} strokeWidth={2.5} style={{ color: '#051410' }} />
                  </span>
                  <span className="t-2" style={{ fontSize: 13 }}>Recordar este dispositivo durante 30 días</span>
                </label>

                <button type="submit" className="btn btn-primary" style={{ marginTop: 12, padding: '14px', fontSize: 14 }}>
                  Continuar <Icon name="arrow-r" size={14} />
                </button>

                <div style={{ position: 'relative', textAlign: 'center', margin: '8px 0' }}>
                  <div style={{ position: 'absolute', inset: '50% 0 auto', height: 1, background: 'var(--line-1)' }} />
                  <span className="mono t-4" style={{ fontSize: 10, letterSpacing: '0.12em', padding: '0 12px', background: 'var(--bg-0)', position: 'relative' }}>O CONTINÚA CON</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button type="button" className="btn btn-sm" style={{ padding: '12px' }}>
                    <span className="display" style={{ fontWeight: 600 }}>SSO</span> · Okta
                  </button>
                  <button type="button" className="btn btn-sm" style={{ padding: '12px' }}>
                    <Icon name="shield" size={14} /> Hardware key
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 'mfa' && (
            <div className="fade-in">
              <button className="btn btn-ghost btn-sm" onClick={() => setStep('credentials')} style={{ marginBottom: 24, marginLeft: -10 }}>
                <Icon name="arrow-r" size={14} style={{ transform: 'rotate(180deg)' }} /> Atrás
              </button>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--bg-2)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', marginBottom: 20 }}>
                <Icon name="shield" size={26} />
              </div>
              <div className="display" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 6 }}>Verificación en dos pasos</div>
              <p className="t-3" style={{ fontSize: 13, marginBottom: 32 }}>
                Ingresa el código de 6 dígitos de tu app autenticadora.<br/>
                Acceso desde IP <span className="mono t-2">181.xxx.xxx.42</span> · Caracas, VE
              </p>

              <form onSubmit={verify}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                  {['7','2','9','4','0','1'].map((d, i) => (
                    <input key={i} className="input mono" maxLength="1" defaultValue={d}
                           style={{
                             width: 56, height: 64, textAlign: 'center', fontSize: 24, fontWeight: 500,
                             padding: 0,
                             borderColor: i === 5 ? 'var(--teal)' : 'var(--line-2)',
                             boxShadow: i === 5 ? '0 0 0 3px var(--teal-glow)' : 'none',
                           }} />
                  ))}
                </div>

                <div className="flex between items-c" style={{ marginTop: 16 }}>
                  <span className="t-3" style={{ fontSize: 12 }}>El código expira en <span className="mono t-2">00:42</span></span>
                  <a className="t-teal" style={{ fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Reenviar</a>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 14, marginTop: 28 }}>
                  Verificar e ingresar <Icon name="arrow-r" size={14} />
                </button>
              </form>

              <div className="card" style={{ marginTop: 20, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Icon name="info" size={16} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 2 }} />
                <div className="t-2" style={{ fontSize: 12, lineHeight: 1.5 }}>
                  ¿Sin acceso a tu app autenticadora? <a className="t-teal" style={{ cursor: 'pointer' }}>Usa un código de respaldo</a> o contacta a tu administrador.
                </div>
              </div>
            </div>
          )}

          {step === 'loading' && (
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
              <div className="t-3 mono" style={{ fontSize: 12, marginTop: 12, letterSpacing: '0.04em' }}>
                Verificando permisos · Sincronizando workspace · Cargando dashboard
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
