# polaris-site

Frontend de POLARIS — landing pública + dashboard de inteligencia política.

**Live:** https://polaris.datanaat.com

---

## Stack

- **React 18.3** via UMD CDN (sin build system)
- **Babel Standalone** para transpilar JSX en el browser
- **Vanilla CSS** con variables (sin Tailwind, sin SASS)
- **GitHub Pages** para hosting (deploy automático al push a `main`)

Este enfoque "sin build" significa que cualquier cambio se ve en producción
unos segundos después del `git push`. Es ideal para iteración rápida y
demos. Si en el futuro necesitamos optimizar bundle/cache, migrar a Vite
es un cambio acotado.

---

## Estructura de archivos

```
polaris-site/
├── index.html                    # entry point — carga todos los scripts
├── styles.css                    # design tokens + dark theme + responsive + glass morphism
├── config.js                     # window.POLARIS_CONFIG (API_BASE_URL, UUIDs, timeouts)
├── api-client.js                 # GET wrapper con retry+cache+timeout
├── data.js                       # loaders async + fallback a mock
├── data-mock.js                  # POLITICIANS, FEED_ITEMS, etc (fallback)
│
├── components-shared.jsx         # PolarisLogo, Icon, Sparkline, KPI, etc
├── granularity-toggle.jsx        # pills Mes/Semana/Día (Día 3 P2)
├── freshness-indicator.jsx       # status fresh/stale/missing (Día 3 P2)
├── crisis-banner.jsx             # banner rojo si hay crisis (Día 3 P2)
├── topic-cloud.jsx               # nube de palabras (Día 3 P2)
├── coordination-graph.jsx        # red de cuentas coordinadas (Día 3 P2)
│
├── screen-landing.jsx            # /
├── screen-login.jsx              # mock login (sin Supabase Auth aún)
├── screen-politicians.jsx        # selector de político
├── screen-dashboard-shell.jsx    # navbar + sidebar + drawer mobile + tabs
│
├── tab-overview.jsx              # vista general (PPI, charts, geo)
├── tab-sentiment-mentions-critics.jsx  # 3 tabs combinados
├── tab-alerts-reports-sources.jsx      # 3 tabs combinados
├── tab-daily-brief.jsx           # markdown render del brief (Día 3 P2)
├── tab-strategist.jsx            # cards de recomendaciones (Día 3 P2)
│
├── agents-modal.jsx              # modal "9 agentes" en landing
└── assets/                        # imágenes, logos
```

---

## Cómo correr localmente

Como no hay build, basta con servir los archivos como estáticos.

```bash
# Opción 1 — Python
cd /Users/mac/development/polaris-site
python3 -m http.server 5500
# Abre http://localhost:5500

# Opción 2 — VS Code Live Server (auto-reload al guardar)
# Click derecho en index.html → Open with Live Server

# Opción 3 — npx serve
npx serve -p 5500 .
```

---

## Cómo configurar el backend

`config.js` línea 13: `API_BASE_URL` apunta al backend.

- **Producción**: `https://web-production-d6505.up.railway.app` (Railway)
- **Desarrollo**: cambia temporalmente a `http://localhost:8000` cuando
  corras el backend local con `make dev-api` (en repo `polaris/`).

CORS: el backend permite `polaris.datanaat.com`, `localhost:3000/5173/5500`,
y `null` (file://) por default. Si agregas otro origin, edita
`ALLOWED_ORIGINS` en Railway.

---

## Deploy a GitHub Pages

Auto-deploy:
- Cualquier push a `main` se publica en https://polaris.datanaat.com en ~30-60s.
- El dominio custom usa el archivo `CNAME` (no lo borres).
- No hay build step — Pages sirve los archivos directo del repo.

Verificar el último deploy:
```bash
curl -s https://polaris.datanaat.com/config.js | head -20
```

---

## Variables de configuración importantes

`config.js` expone `window.POLARIS_CONFIG`:

| Key | Default | Descripción |
|---|---|---|
| `API_BASE_URL` | URL Railway prod | Backend al que pega el frontend |
| `POLITICIAN_ID_COR` | UUID Supabase | Carlos Orvañanos Rea (alcalde Cuajimalpa) |
| `POLITICIAN_ID_SHEINBAUM` | UUID Supabase | Claudia Sheinbaum (Presidenta MX) |
| `REQUEST_TIMEOUT_MS` | 10000 | Timeout por GET antes de fallar a mock |
| `CACHE_TTL_MS` | 60000 | Cache en memoria de respuestas (60s) |
| `MAX_RETRIES` | 3 | Backoff exponencial 1s/2s/4s |
| `AUTO_REFRESH_MS` | 60000 | Cada cuánto el dashboard se refresca solo |
| `DEBUG` | true | Logs detallados en console |

---

## Cosas que aún NO están

- **Supabase Auth real**: el login sigue siendo mock con credenciales
  hardcoded (`andresorva/PolarisTest`, `luisphr/PolarisTest`). Pendiente Día 4+.
- **Reorganización folder /landing/, /app/, /shared/**: documentada como
  plan futuro pero diferida — implica multi-page routing que rompería el
  deploy live actual.
- **PWA / offline**: no hay service worker.
- **Tests E2E**: no hay todavía.

---

## Troubleshooting

**El banner amarillo "modo demo" sigue apareciendo:**
1. Verifica que `polaris.datanaat.com/config.js` tiene la URL real (no
   placeholder).
2. Verifica que `https://web-production-d6505.up.railway.app/health`
   responde `database: connected`.
3. En el browser, abre DevTools → Network y revisa los requests al API.
   Si dan CORS error, falta agregar el origin a `ALLOWED_ORIGINS` en
   Railway.

**El dashboard se queda cargando "…":**
- Probable timeout. El default es 10s; si Railway tiene cold start mayor,
  la primera request puede fallar. Recarga y debería andar.

**No se ven políticos / aparece solo mock:**
- Probablemente el id del político no es UUID válido. El frontend solo
  hace fetch real cuando detecta un UUID; si llegas al dashboard sin
  pasar por el selector (vía botón de prototipo abajo), el id es 'mc'
  o similar y cae a mock.

---

## Issues conocidos (Día 3 Parte 2)

- `tab-daily-brief.jsx`: el parser markdown es minimal — soporta h1/h2/h3,
  bold, listas y separadores. Tablas y código no están soportadas. Si el
  Daily Brief de Sonnet incluye algo muy complejo, considera agregar un
  parser CDN como `marked.js`.
- `coordination-graph.jsx`: layout SVG estático (no force-directed). Para
  10+ grupos puede verse apretado. Mejorar a D3 force layout en Día 4 si
  necesario.
