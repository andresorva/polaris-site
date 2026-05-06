/* ============================================
   POLARIS — Configuracion del frontend
   Cargar ANTES de cualquier otro script.

   IMPORTANTE: cuando Andres conecte Railway y nos pase
   la URL publica, se reemplaza API_BASE_URL aqui mismo
   y se commitea. Hasta entonces, el dashboard cae a
   los datos mock automaticamente (banner modo demo).
   ============================================ */

window.POLARIS_CONFIG = {
  // Backend POLARIS en produccion (Railway, plan Pro de Andres)
  API_BASE_URL: 'https://web-production-d6505.up.railway.app',

  // UUID de Carlos Orvañanos Rea en Supabase (politico principal validado)
  POLITICIAN_ID_COR: '65dc08f0-8fe9-463f-880f-36b5da66ebe6',

  // UUID de Claudia Sheinbaum (alto volumen, validacion pipeline)
  POLITICIAN_ID_SHEINBAUM: '9bf67ca9-492f-49fe-bb85-862b5149cb57',
  POLITICIAN_SLUG_SHEINBAUM: 'claudia-sheinbaum',

  // Configuracion del cliente HTTP
  REQUEST_TIMEOUT_MS: 10000,    // 10s antes de fallar a mock
  CACHE_TTL_MS: 60000,          // 60s cache en memoria
  MAX_RETRIES: 3,                // intentos con exponential backoff (1s, 2s, 4s)
  AUTO_REFRESH_MS: 60000,        // tab activo se refresca cada 60s

  // Habilitar logs detallados en consola (desactivar en prod)
  DEBUG: true,
};

// Helper rapido para construir URLs absolutas al API
window.POLARIS_CONFIG.url = function (path, params) {
  const base = (window.POLARIS_CONFIG.API_BASE_URL || '').replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : '/' + path;
  let qs = '';
  if (params && typeof params === 'object') {
    const pairs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v));
    if (pairs.length) qs = '?' + pairs.join('&');
  }
  return base + p + qs;
};
