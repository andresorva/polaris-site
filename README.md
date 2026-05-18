# polaris-site

Frontend de POLARIS — landing + dashboard de inteligencia política multi-tenant.

**Live:** https://polaris.datanaat.com

---

## Stack actual (V2, post-rebuild 2026-05-18)

- **Vite 5** + **React 18.3** + **TypeScript 5.6** (build system real, ESM, tree-shake)
- **Tailwind CSS 3.4** + CSS vars custom para theming multi-tenant (Orvananos PAN azul / Astudillo PRI vino)
- **React Router 6** (8 dashboard routes + login + auth guard)
- **TanStack Query 5** (data fetching + cache + retry)
- **Zustand 5** (state client global)
- **Recharts 3** (charts institutional)
- **React Hook Form + Zod** (forms)
- **Lucide React** (icons)
- **Sentry React** (error tracking)
- **ReactMarkdown** (Daily Brief renderer)
- **Vitest 2 + Testing Library** (smoke tests)
- **ESLint 9 + Prettier** (lint/format)
- **GitHub Actions** + **actions/deploy-pages@v4** (CI/CD, push a `main` → ~2-3 min → live)

Stack legacy (HTML + React UMD CDN + Babel Standalone) deprecated 2026-05-18. Ver tag `legacy-pre-rebuild-2026-05-18` para snapshot pre-merge.

---

## Quick start

```bash
cd /Users/mac/development/polaris-site
npm install
npm run dev
# Open http://localhost:5173
```

**Login dev** (desde `.env.local`, no committed):
- `andresorva` / `PolarisTest`
- `luisphr` / `PolarisTest`

`.env.example` committed muestra las variables esperadas. Copia a `.env.local`:

```bash
cp .env.example .env.local
# Edit .env.local con creds reales (dev only)
```

---

## Estructura

```
polaris-site/
├── .github/workflows/deploy.yml      # CI/CD GitHub Actions
├── public/
│   ├── polaris-logo.png              # logo principal (preservado del legacy)
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── main.tsx                      # entry Vite
│   ├── App.tsx                       # root: ThemeProvider + QueryClient + Router
│   ├── App.test.tsx                  # smoke test
│   ├── index.css                     # Tailwind + CSS vars custom
│   ├── test-setup.ts                 # vitest + jsdom
│   ├── routes/
│   │   ├── login.tsx
│   │   ├── not-found.tsx
│   │   ├── dashboard/
│   │   │   ├── index.tsx             # Vista General (Fase 3 — wired real)
│   │   │   ├── pulso.tsx             # Pulso en vivo SSE (Fase 4)
│   │   │   ├── sentiment.tsx         # Sentimiento detallado (Fase 5)
│   │   │   ├── temas.tsx             # Temas + vista previa taxonomia MX (Fase 6)
│   │   │   ├── voces.tsx             # Voces y criticos (Fase 7)
│   │   │   ├── alertas.tsx           # Crisis y alertas (Fase 8)
│   │   │   ├── briefing.tsx          # Briefing diario (Fase 9)
│   │   │   └── fuentes.tsx           # DataTable mentions (Fase 10)
│   │   └── dev/components.tsx        # /dev/components showcase
│   ├── features/
│   │   ├── auth/                     # useAuth, RequireAuth, saveSession/clearSession
│   │   └── client-theme/             # ThemeProvider, ClientSelector, clients.ts (UUIDs reales)
│   ├── components/
│   │   ├── layout/                   # Topbar, Sidebar, MobileNav, DashboardLayout, PageHeader
│   │   ├── data-display/             # KPICard, TimeSeriesChart, DonutChart, DistributionChart, DataTable, PlatformChip
│   │   ├── states/                   # EmptyState, ErrorState, LoadingSkeleton, DemoBadge
│   │   ├── selectors/                # ThemeToggle, TimeRangeSelector
│   │   └── ui/                       # Button, Card, Badge, Input
│   ├── lib/
│   │   ├── api/                      # client, endpoints, types, queryClient, queries (TanStack hooks), sse
│   │   ├── stores/                   # filtersStore (Zustand persist)
│   │   ├── utils/                    # format, sentiment, platform, cn
│   │   └── hooks/                    # (futuros hooks generic)
│   └── styles/                       # globals.css, fonts.css
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json (+ tsconfig.app.json + tsconfig.node.json)
├── eslint.config.js
├── package.json
├── CNAME                             # polaris.datanaat.com (preservado)
└── README.md
```

---

## Backend API

**Producción Railway:** `https://web-production-d6505.up.railway.app`

Override en dev creando `.env.local`:
```
VITE_API_BASE_URL=http://localhost:8000
```

CORS: backend permite `polaris.datanaat.com`, `localhost:5173`, etc.

Endpoints consumidos (ver `src/lib/api/endpoints.ts` + `queries.ts`):
- `/health`, `/api/v1/politicians`, `/api/v1/politicians/{id}/...`
- `/api/v1/metrics/ppi/{id}`, `/api/v1/metrics/timeseries?politician_id=`, `/api/v1/metrics/daily`
- `/api/v1/mentions?politician_id=`, `/api/v1/alerts?politician_id=`
- `/api/v1/politicians/{id}/sentiment-breakdown`, `/top-authors`, `/freshness`, `/topics`, `/crisis-signals`, `/coordination-groups`, `/daily-brief`
- `POST /api/v1/live-query` (SSE)

---

## Deploy

**Auto:** push a `main` → GitHub Actions workflow `Deploy POLARIS Frontend`:
1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test -- --run`
5. `npm run build` (Vite build → `dist/`)
6. `actions/upload-pages-artifact@v3` (sobre `dist/`)
7. `actions/deploy-pages@v4` → live en ~2-3 min

**Important config:** GitHub Pages source debe estar en "GitHub Actions" mode (NOT "Deploy from a branch"). Si vuelve a legacy mode, el workflow corre pero su output se ignora.

**Verificar último deploy:**
```bash
# Ver workflow runs
curl -s 'https://api.github.com/repos/andresorva/polaris-site/actions/runs?branch=main&per_page=3' | python3 -m json.tool

# Confirmar Vite assets sirviendose
curl -s https://polaris.datanaat.com | grep -E 'assets/index-'
# Debe ver: <script type="module" crossorigin src="/assets/index-XXX.js">
```

---

## Rollback

Si rebuild falla en producción:
```bash
cd /Users/mac/development/polaris-site
git fetch --tags
git checkout main
git reset --hard legacy-pre-rebuild-2026-05-18
git push origin main --force-with-lease
```

GH Pages servirá el legacy HTML+UMD+Babel (último commit `b6fec02`). Tarda ~1-2 min en reflejarse.

---

## Scripts disponibles

```bash
npm run dev          # Vite dev server (HMR, port 5173)
npm run build        # tsc build + vite build → dist/
npm run preview      # serve dist/ local (port 4173)
npm run lint         # ESLint, max-warnings 0
npm run typecheck    # tsc --noEmit
npm test             # vitest interactive
npm test -- --run    # vitest run-once (CI mode)
```

---

## Theming multi-tenant

`src/features/client-theme/clients.ts` define los clientes:
- **Orvananos** PAN — primary `#0066CC` (azul), accent `#F4A53A`
- **Astudillo** PRI — primary `#7E1F3D` (vino), accent `#D4AF37`

CSS vars (`--polaris-primary`, `--polaris-primary-dark`, `--polaris-accent`, etc.) se aplican a `:root` via JS al cambiar cliente. Tailwind config consume las vars: `theme.extend.colors.primary = 'var(--polaris-primary)'`.

Selector cliente: dropdown topbar, persistido en `localStorage.polaris_client_id`.

Modo claro/oscuro/sistema: ThemeToggle topbar, persistido en `localStorage.polaris_theme`. CSS `[data-theme="dark"]` selector + `prefers-color-scheme` fallback.

---

## Caveats data backend (Wave B pending)

Algunas features tienen empty states honestos hasta que Wave B CC arregle bugs P0:

- **Pulso en vivo:** SSE stream devuelve 0 mentions hasta fix Live Query dispatch (B-1).
- **Temas:** endpoint `/topics` devuelve `[]` pese a 21% mentions con `topic_categories` (aggregator broken). Muestra vista previa taxonomia MX (35 sub-categorias informativas).
- **Sentimiento → Drivers:** topics que pesan negativo = RED hasta B-15 fix + Wave B-7 sentiment-by-topic target-aware.
- **Voces → Coordinación:** detector `/coordination-groups` siempre vacío.
- **Vista General timeline 60d:** ~96% buckets cero por B-15 (orchestrator window). Renderiza buckets reales con caveat inline.

Ver `/Users/mac/development/polaris/audits/2026-05-18-WAVE-B-HANDOFF-URGENT.md` para detalles + roadmap.

---

## Reglas POLARIS

- **REGLA 78:** retención total + clasificación 1×1 (frontend muestra TODA la data persistida)
- **REGLA 79:** sin acentos ni `ñ` en strings user-facing (helper `stripAccents` aplicado en UI controlada)
- **REGLA 80:** cron scheduler real obligatorio (frontend depende de cron backend funcionando)

Ver `/Users/mac/development/polaris/CONTEXT.md` para contexto completo.
