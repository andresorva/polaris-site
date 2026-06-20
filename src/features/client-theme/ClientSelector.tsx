import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useClientTheme } from './useClientTheme'
import { partyToSlug, type ClientTheme } from './clients'
import { usePoliticians } from '../../lib/api/queries'
import type { Politician } from '../../lib/api/types'
import { cn } from '../../lib/utils/cn'

type Props = {
  className?: string
}

/** Iniciales para el avatar (2 letras de display_name). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

type RichClient = {
  theme: ClientTheme
  /** Metadata viva (cargo/posicion) si el backend la entrega; si no, fallback. */
  meta: string
}

/**
 * ClienteSelector rico (T0.3): dropdown con avatar + nombre + chip de partido.
 *
 * Alimentado por usePoliticians (hook real): si la API responde, enriquece cada
 * cliente con su `position` viva; si esta dead/cargando, degrada al fallback sin
 * romper. El switch de partido sigue corriendo por el theming engine (setParty)
 * sobre los CLIENTES estaticos (Carlos PAN + Astudillo PVEM), que es la fuente
 * de verdad de [data-party]. Regla 79: strings sin acentos.
 */
export function ClientSelector({ className }: Props) {
  const { client, clients, setParty } = useClientTheme()
  // Hook real usePoliticians: si esta dead, isError -> degradamos al fallback.
  const { data: politicians } = usePoliticians()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // API PENDIENTE backend /politicians vivo (Astudillo puede no existir en DB):
  // hoy mapeamos por politician_id contra la respuesta; el theming no depende
  // de esto, solo el enriquecimiento (cargo/posicion). Si falta, usa fallback.
  const byId = useMemo(() => {
    const map = new Map<string, Politician>()
    for (const p of politicians ?? []) map.set(p.id, p)
    return map
  }, [politicians])

  const rich = useMemo<RichClient[]>(
    () =>
      clients.map((theme) => {
        const live = byId.get(theme.politician_id)
        const meta = live?.position?.trim()
          ? live.position
          : `${theme.party} - Demo`
        return { theme, meta }
      }),
    [clients, byId],
  )

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const activeMeta =
    rich.find((r) => r.theme.id === client.id)?.meta ?? `${client.party} - Demo`

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Seleccionar cliente"
        className="client-mini"
      >
        <span className="avatar" aria-hidden="true">
          {initials(client.display_name)}
        </span>
        <span className="who">
          <b>{client.display_name}</b>
          <span>{activeMeta}</span>
        </span>
        <span className="party-chip">{client.party}</span>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className="text-[var(--text-tertiary)]"
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Clientes"
          className={cn(
            'absolute left-0 z-50 mt-2 w-72 overflow-hidden rounded-md',
            'border border-border bg-elevated shadow-strong p-1',
          )}
        >
          {rich.map(({ theme, meta }) => {
            const selected = theme.id === client.id
            return (
              <li key={theme.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setParty(theme.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-left',
                    'transition-colors focus-visible:outline-none',
                    selected
                      ? 'bg-[var(--primary-soft)]'
                      : 'hover:bg-[var(--bg-hover)]',
                  )}
                >
                  <span
                    className="avatar"
                    aria-hidden="true"
                    // Tinte por partido del item (no del cliente activo).
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary_dark} 0%, ${theme.primary} 60%, ${theme.primary_light} 100%)`,
                    }}
                  >
                    {initials(theme.display_name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {theme.display_name}
                    </span>
                    <span className="block truncate text-[11px] text-ink-subtle">
                      {meta}
                    </span>
                  </span>
                  <span
                    className="party-chip"
                    data-party={partyToSlug(theme.party_slug)}
                    style={{ background: theme.primary }}
                  >
                    {theme.party}
                  </span>
                  {selected ? (
                    <Check
                      size={15}
                      strokeWidth={2.5}
                      className="text-primary"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
