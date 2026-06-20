/**
 * Multi-tenant client theming registry (fuente de verdad en JS).
 * Cada cliente -> partido -> paleta. El atributo <html data-party="..."> y los
 * tokens --polaris-* (definidos en index.css) son la fuente de verdad visual;
 * estos colores se replican aqui para que ThemeProvider los pueda setear inline
 * (gana en cascada) y para el anti-FOUC en index.html.
 *
 * Regla 79: cero acentos ni n-con-tilde en strings que lleguen a UI.
 */

/** Slugs de partido soportados por [data-party] (ver paletas en index.css). */
export type PartySlug =
  | 'pan'
  | 'morena'
  | 'pri'
  | 'mc'
  | 'pvem'
  | 'pt'
  | 'prd'
  | 'ind'

/** Fallback cuando el politico no tiene partido en DB (party = NULL). */
export const FALLBACK_PARTY_SLUG: PartySlug = 'pan'

/**
 * Normaliza el partido de un politico (string libre desde DB, puede ser null)
 * a un slug valido de [data-party]. NULL / desconocido -> fallback 'pan'.
 * Caso Carlos Orvananos: party = NULL en DB -> se tinta como PAN (fallback).
 */
export function partyToSlug(party: string | null | undefined): PartySlug {
  if (!party) return FALLBACK_PARTY_SLUG
  const slug = party.trim().toLowerCase()
  switch (slug) {
    case 'pan':
    case 'morena':
    case 'pri':
    case 'mc':
    case 'pvem':
    case 'pt':
    case 'prd':
    case 'ind':
      return slug
    default:
      return FALLBACK_PARTY_SLUG
  }
}

export type ClientTheme = {
  id: string
  display_name: string
  politician_id: string
  primary: string
  primary_dark: string
  primary_light: string
  accent: string
  /**
   * Etiqueta de partido para mostrar en UI. Si el politico no tiene partido
   * en DB (NULL) se usa la etiqueta del fallback. Caso Carlos: NULL -> 'PAN'.
   */
  party: string
  /** Slug normalizado que alimenta <html data-party="..."> y la paleta. */
  party_slug: PartySlug
  /** UUID, to be wired when Wave B persists political_party rows. */
  political_party_id: string
}

export const CLIENTS: ClientTheme[] = [
  {
    id: 'orvananos',
    display_name: 'Carlos Orvananos',
    politician_id: '65dc08f0-8fe9-463f-880f-36b5da66ebe6',
    // party = NULL en DB -> fallback theming PAN (azul).
    primary: '#0066CC',
    primary_dark: '#003D7A',
    primary_light: '#4D94DB',
    accent: '#F4A53A',
    party: 'PAN',
    party_slug: 'pan',
    political_party_id: 'TBD-PAN-UUID',
  },
  {
    id: 'astudillo',
    display_name: 'Ricardo Astudillo',
    politician_id: '312af85e-af56-4304-85e2-be0721ffda14',
    // Astudillo es PVEM (verde), NO PRI. Corregido en T0.2.
    primary: '#2E7D32',
    primary_dark: '#1B5E20',
    primary_light: '#66BB6A',
    accent: '#FDD835',
    party: 'PVEM',
    party_slug: 'pvem',
    political_party_id: 'TBD-PVEM-UUID',
  },
]

export const DEFAULT_CLIENT_ID = 'orvananos'

export function getClientById(id: string): ClientTheme | undefined {
  return CLIENTS.find((c) => c.id === id)
}
