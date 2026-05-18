export type ClientTheme = {
  id: string
  display_name: string
  politician_id: string
  primary: string
  primary_dark: string
  primary_light: string
  accent: string
  party: string
  /** UUID, to be wired when Wave B persists political_party rows. */
  political_party_id: string
}

export const CLIENTS: ClientTheme[] = [
  {
    id: 'orvananos',
    display_name: 'Carlos Orvananos',
    politician_id: '65dc08f0-8fe9-463f-880f-36b5da66ebe6',
    primary: '#0066CC',
    primary_dark: '#003D7A',
    primary_light: '#3D8BDB',
    accent: '#F4A53A',
    party: 'PAN',
    political_party_id: 'TBD-PAN-UUID',
  },
  {
    id: 'astudillo',
    display_name: 'Ricardo Astudillo',
    politician_id: '312af85e-af56-4304-85e2-be0721ffda14',
    primary: '#7E1F3D',
    primary_dark: '#5A1429',
    primary_light: '#A5364E',
    accent: '#D4AF37',
    party: 'PRI',
    political_party_id: 'TBD-PRI-UUID',
  },
]

export const DEFAULT_CLIENT_ID = 'orvananos'

export function getClientById(id: string): ClientTheme | undefined {
  return CLIENTS.find((c) => c.id === id)
}
