import { useClientTheme } from './useClientTheme'

type Props = {
  className?: string
}

/**
 * Dropdown to switch active client (multi-tenant theming).
 * Persists selection to localStorage via ThemeProvider.
 */
export function ClientSelector({ className }: Props) {
  const { client, clients, setClient } = useClientTheme()

  return (
    <label className={className}>
      <span className="sr-only">Cliente</span>
      <select
        value={client.id}
        onChange={(e) => setClient(e.target.value)}
        className="font-mono text-sm bg-surface-elevated text-ink border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Seleccionar cliente"
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.display_name} ({c.party})
          </option>
        ))}
      </select>
    </label>
  )
}
