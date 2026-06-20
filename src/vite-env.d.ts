/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_DEMO_USER_1?: string
  readonly VITE_DEMO_USER_2?: string
  readonly VITE_DEMO_PASSWORD?: string
  readonly VITE_SENTRY_DSN?: string
  /**
   * Flag global del DEMO badge (T0.3). 'false'/'0'/'off'/'no' apaga el chip
   * "DEMO" en toda la app; ausente o cualquier otro valor lo deja encendido.
   */
  readonly VITE_DEMO_BADGE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
