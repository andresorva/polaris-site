/* ============================================
   POLARIS — Info / "¿Cómo funciona?" screen
   Día 5 Ronda 6 — explicaciones de métricas, fórmulas, etiquetas
   ============================================ */

function InfoScreen({ onNavigate }) {
  return (
    <div className="page-in" data-screen-label="05 Info" style={{
      minHeight: '100vh',
      background: 'var(--bg-0)',
      color: 'var(--text-1)',
    }}>
      <header style={{
        position: 'sticky',
        top: 0, zIndex: 50,
        padding: '14px 24px',
        borderBottom: '1px solid var(--line-1)',
        background: 'var(--bg-0)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div className="flex items-c gap-3">
          <PolarisLogo size={20} />
          <div style={{ width: 1, height: 20, background: 'var(--line-2)' }} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em' }}>¿CÓMO FUNCIONA?</span>
        </div>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => typeof onNavigate === 'function' && onNavigate('dashboard')}
        >
          <Icon name="arrow-r" size={14} style={{ transform: 'rotate(180deg)' }} /> Volver al dashboard
        </button>
      </header>

      <div style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '40px 24px 96px',
        fontFamily: 'var(--font-body)',
        lineHeight: 1.7,
        fontSize: 15,
      }}>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: 500, letterSpacing: '-0.025em', margin: '0 0 8px' }}>
          ¿Cómo funciona <span style={{
            background: 'linear-gradient(135deg, var(--teal), var(--blue))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>POLARIS</span>?
        </h1>
        <p className="t-2" style={{ fontSize: 16, color: 'var(--text-2)', margin: '0 0 32px', maxWidth: 620 }}>
          POLARIS analiza la conversación digital sobre figuras políticas en tiempo casi-real.
          Esta guía explica qué significa cada métrica y cómo la calculamos.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', margin: '40px 0 12px', color: 'var(--teal)' }}>
          📊 Métricas principales
        </h2>

        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '24px 0 8px', color: 'var(--text-1)' }}>
          PPI — Political Popularity Index
        </h3>
        <p style={{ margin: '0 0 12px', color: 'var(--text-2)' }}>
          Escala 0-100. Inspirado en frameworks como NPS (Net Promoter Score) y CSAT (Customer Satisfaction Score), adaptado a contexto político.
        </p>
        <p style={{ margin: '12px 0 8px', color: 'var(--text-2)' }}>Combina 4 componentes:</p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 22, color: 'var(--text-2)' }}>
          <li><strong>Sentimiento agregado (40%)</strong>: % positivo − % negativo en menciones recientes</li>
          <li><strong>Volumen de conversación (25%)</strong>: total de menciones normalizadas vs baseline</li>
          <li><strong>Reach estimado (20%)</strong>: audiencia potencial alcanzada</li>
          <li><strong>Riesgo detectado (15%)</strong>: presencia de crisis signals, coordinación adversaria</li>
        </ul>
        <div className="card" style={{
          padding: '14px 18px',
          margin: '12px 0 16px',
          background: 'var(--bg-2)',
          border: '1px solid var(--line-2)',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--text-1)',
        }}>
          PPI = (Sentimiento × 0.40) + (Volumen × 0.25) + (Reach × 0.20) − (Riesgo × 0.15)
        </div>
        <p style={{ margin: '12px 0 8px', color: 'var(--text-2)' }}>Interpretación:</p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 22, color: 'var(--text-2)' }}>
          <li><strong style={{ color: 'var(--pos)' }}>70-100</strong>: Popularidad fuerte y estable</li>
          <li><strong>50-70</strong>: Popularidad sólida con áreas de mejora</li>
          <li><strong style={{ color: 'var(--warn)' }}>30-50</strong>: Popularidad moderada, atención requerida</li>
          <li><strong style={{ color: 'var(--neg)' }}>0-30</strong>: Popularidad en riesgo, intervención urgente</li>
        </ul>

        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '32px 0 8px', color: 'var(--text-1)' }}>
          Sentimiento
        </h3>
        <p style={{ margin: '0 0 12px', color: 'var(--text-2)' }}>
          Cada mención se clasifica con AI en una de 4 categorías:
        </p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 22, color: 'var(--text-2)' }}>
          <li>✅ <strong style={{ color: 'var(--pos)' }}>Positivo</strong>: apoyo, elogio, alineación</li>
          <li>⚪ <strong>Neutral</strong>: informativo, sin carga emocional</li>
          <li>❌ <strong style={{ color: 'var(--neg)' }}>Negativo</strong>: crítica, oposición, ataque</li>
          <li>🟣 <strong style={{ color: 'var(--purple)' }}>Sarcástico</strong>: ironía, doble sentido, mockery</li>
        </ul>
        <p style={{ margin: '12px 0', color: 'var(--text-2)' }}>Nuestra AI considera:</p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 22, color: 'var(--text-2)' }}>
          <li>Jerga mexicana (chairo, fifí, pejezombi, etc.)</li>
          <li>Contexto político local (PRI, MORENA, PVEM, etc.)</li>
          <li>Referencias culturales (memes, eventos virales)</li>
          <li>Coordinación detectada (varias cuentas con mismo mensaje)</li>
        </ul>
        <p style={{ margin: '12px 0', color: 'var(--text-2)', fontSize: 14 }}>
          Capacidad: hasta 1,500 menciones diarias por político con análisis individual.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '32px 0 8px', color: 'var(--text-1)' }}>
          Reach estimado
        </h3>
        <p style={{ margin: '0 0 12px', color: 'var(--text-2)' }}>
          Audiencia potencial calculada con heurística:
        </p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 22, color: 'var(--text-2)' }}>
          <li>Followers/audiencia del autor de cada mención</li>
          <li>Engagement (likes, retweets, comentarios)</li>
          <li>Decay temporal (menciones recientes pesan más)</li>
        </ul>
        <p style={{ margin: '12px 0', color: 'var(--text-2)', fontSize: 14, padding: '10px 14px', background: 'rgba(255, 181, 70, 0.10)', border: '1px solid rgba(255, 181, 70, 0.30)', borderRadius: 8 }}>
          ⚠️ Es <strong>estimación</strong>, no medición directa. Las plataformas no exponen alcance real.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '32px 0 8px', color: 'var(--text-1)' }}>
          Share of Voice (SOV)
        </h3>
        <p style={{ margin: '0 0 12px', color: 'var(--text-2)' }}>
          % de la conversación política que captura este personaje vs otros.
        </p>
        <p style={{ margin: '12px 0', color: 'var(--text-2)', fontSize: 14, padding: '10px 14px', background: 'rgba(77, 124, 255, 0.10)', border: '1px solid rgba(77, 124, 255, 0.30)', borderRadius: 8 }}>
          ⚠️ Calculado contra los políticos en nuestra base actual. A más políticos en sistema, más representativo el dato.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', margin: '48px 0 12px', color: 'var(--teal)' }}>
          🤖 Daily Brief
        </h2>
        <p style={{ margin: '0 0 12px', color: 'var(--text-2)' }}>
          Reporte ejecutivo generado diariamente por AI a partir del análisis del día.
        </p>
        <p style={{ margin: '12px 0', color: 'var(--text-2)' }}>Estructura típica:</p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 22, color: 'var(--text-2)' }}>
          <li><strong>Resumen ejecutivo</strong> (3-4 líneas)</li>
          <li><strong>Top 3 temas dominantes</strong> con sentiment</li>
          <li><strong>Voces críticas</strong> detectadas</li>
          <li><strong>Recomendaciones accionables</strong></li>
        </ul>
        <div className="flex items-c gap-4" style={{ margin: '12px 0 16px', flexWrap: 'wrap' }}>
          <span className="mono t-3" style={{ fontSize: 12 }}>⏱ Generación: ~30 segundos</span>
          <span className="mono t-3" style={{ fontSize: 12 }}>💰 Costo: ~$0.04 USD por brief</span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', margin: '48px 0 12px', color: 'var(--teal)' }}>
          ⚡ Live Query
        </h2>
        <p style={{ margin: '0 0 12px', color: 'var(--text-2)' }}>
          Búsqueda on-demand en tiempo real para situaciones que necesitan respuesta inmediata.
        </p>
        <p style={{ margin: '12px 0', color: 'var(--text-2)' }}>Cómo funciona:</p>
        <ol style={{ margin: '0 0 16px', paddingLeft: 22, color: 'var(--text-2)' }}>
          <li>Tipea tu búsqueda (ej: "puente cerrado homero horacio")</li>
          <li>Sistema dispara collectors en 6 plataformas en paralelo</li>
          <li>AI procesa sentiment + topics + resumen</li>
          <li>Resultados completos en &lt;60 segundos</li>
        </ol>
        <div className="card" style={{
          padding: 18,
          margin: '12px 0 16px',
          background: 'var(--bg-2)',
          border: '1px solid var(--teal-glow)',
          borderLeft: '3px solid var(--teal)',
        }}>
          <strong style={{ color: 'var(--teal)' }}>Use case real</strong>: "El político está en su oficina, le acaban de cerrar 2 calles para construir un puente, en 30 min tiene reunión con prensa, necesita saber qué piensa la gente AHORA."
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', margin: '48px 0 12px', color: 'var(--teal)' }}>
          🔍 Plataformas analizadas
        </h2>
        <ul style={{ margin: '0 0 16px', paddingLeft: 22, color: 'var(--text-2)' }}>
          <li><strong>X (Twitter)</strong>: conversación en tiempo real, líderes de opinión</li>
          <li><strong>Instagram</strong>: engagement visual, comunidades locales</li>
          <li><strong>TikTok</strong>: tendencias jóvenes, contenido viral</li>
          <li><strong>YouTube</strong>: análisis profundo, opinion makers</li>
          <li><strong>Facebook</strong>: comunidades barriales, votantes mayores</li>
          <li><strong>Bluesky</strong>: early adopters, profesionales tech</li>
        </ul>

        <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', margin: '48px 0 12px', color: 'var(--teal)' }}>
          🏷️ Etiquetas que verás en el dashboard
        </h2>
        <ul style={{ margin: '0 0 16px', paddingLeft: 22, color: 'var(--text-2)' }}>
          <li><strong>(sin etiqueta)</strong> = Dato real, calculado de fuentes verificadas</li>
          <li><DataLabel type="estimated" inline /> = Aproximación basada en heurística (no medición directa)</li>
          <li><DataLabel type="demo" inline /> = Dato simulado para mostrar cómo se vería el feature</li>
          <li><DataLabel type="soon" inline /> = Feature en desarrollo activo</li>
        </ul>

        <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', margin: '48px 0 12px', color: 'var(--teal)' }}>
          📈 ¿Por qué confiar en POLARIS?
        </h2>
        <ol style={{ margin: '0 0 16px', paddingLeft: 22, color: 'var(--text-2)' }}>
          <li><strong>Datos públicos verificables</strong>: cada mención tiene fuente, autor, timestamp y URL</li>
          <li><strong>AI auditable</strong>: cada análisis es revisable mention por mention</li>
          <li><strong>Sin black boxes</strong>: las fórmulas están aquí, públicas</li>
          <li><strong>Mexicano-first</strong>: entrenado para contexto político MX, no genérico</li>
          <li><strong>Tiempo casi-real</strong>: ventaja competitiva vs herramientas batch 24h</li>
        </ol>

        <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', margin: '48px 0 12px', color: 'var(--teal)' }}>
          🎯 Roadmap
        </h2>
        <p style={{ margin: '0 0 8px', color: 'var(--text-2)' }}><strong style={{ color: 'var(--pos)' }}>Activo hoy:</strong> 6 plataformas, 4 métricas core, Daily Brief, Live Query</p>
        <p style={{ margin: '8px 0 16px', color: 'var(--text-2)' }}><strong style={{ color: 'var(--text-3)' }}>Próximamente:</strong> alertas push, reportes PDF, comparativos políticos, multi-tenant</p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--line-1)', margin: '48px 0 24px' }} />
        <p className="t-3" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-3)', textAlign: 'center', margin: '24px 0' }}>
          ¿Preguntas? Contacta al equipo POLARIS — <a href="mailto:soporte@polaris.datanaat.com" style={{ color: 'var(--teal)', textDecoration: 'none' }}>soporte@polaris.datanaat.com</a>
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <button
            className="btn btn-primary"
            onClick={() => typeof onNavigate === 'function' && onNavigate('dashboard')}
          >
            <Icon name="arrow-r" size={14} style={{ transform: 'rotate(180deg)' }} /> Volver al dashboard
          </button>
        </div>
      </div>

      {typeof Footer !== 'undefined' && <Footer compact />}
    </div>
  );
}

window.InfoScreen = InfoScreen;
