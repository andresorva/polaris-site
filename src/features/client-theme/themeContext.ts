import { createContext } from 'react'
import type { ClientTheme } from './clients'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export type ThemeContextValue = {
  client: ClientTheme
  clients: ClientTheme[]
  mode: ThemeMode
  /** Actual theme applied (system resolved). */
  resolvedTheme: ResolvedTheme
  setClient: (id: string) => void
  setMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
