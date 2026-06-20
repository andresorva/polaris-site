/**
 * Flag global del DEMO badge (T0.3) — UN solo lugar para quitar el chip "DEMO"
 * de toda la app.
 *
 * Resolucion del estado inicial (precedencia):
 *   1. Toggle de Settings persistido en localStorage (polaris_demo_badge).
 *   2. Variable de entorno VITE_DEMO_BADGE ('false'/'0' lo apaga; ausente => on).
 *
 * Las pantallas (wave siguiente) montan <DemoBadge/> en paneles con data
 * sintetica; cuando el backend real este cableado se apaga aqui (env o Settings)
 * y desaparece en todos lados sin tocar las pantallas.
 *
 * Zustand sin persist propio: la persistencia se hace manual en setDemoBadge
 * para mantener la misma fuente que el anti-FOUC/Settings (clave estable).
 */
import { create } from 'zustand'

const STORAGE_KEY = 'polaris_demo_badge'

/** Lee el default de la env: solo 'false'/'0' apagan; cualquier otra cosa => on. */
function envDefault(): boolean {
  const raw = import.meta.env.VITE_DEMO_BADGE
  if (raw === undefined || raw === null || raw === '') return true
  const v = String(raw).trim().toLowerCase()
  return v !== 'false' && v !== '0' && v !== 'off' && v !== 'no'
}

function readInitial(): boolean {
  if (typeof window === 'undefined') return envDefault()
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === '1') return true
    if (stored === '0') return false
  } catch {
    /* localStorage no disponible */
  }
  return envDefault()
}

type DemoBadgeState = {
  /** true => los <DemoBadge/> se renderizan; false => ocultos en toda la app. */
  enabled: boolean
  setEnabled: (next: boolean) => void
  toggle: () => void
}

export const useDemoBadgeFlag = create<DemoBadgeState>((set, get) => ({
  enabled: readInitial(),
  setEnabled: (next) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
    set({ enabled: next })
  },
  toggle: () => get().setEnabled(!get().enabled),
}))
