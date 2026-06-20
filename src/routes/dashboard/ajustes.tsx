import { useMemo, useState, type ReactNode } from 'react'
import {
  User,
  SlidersHorizontal,
  Bell,
  Users,
  KeyRound,
  UsersRound,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { DemoBadge } from '../../components/states/DemoBadge'
import { useDemoBadgeFlag } from '../../components/states/demoBadgeFlag'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import type { ThemeMode } from '../../features/client-theme/themeContext'
import type { ClientTheme } from '../../features/client-theme/clients'
import { useMe } from '../../lib/api/queries'
import { cn } from '../../lib/utils/cn'

// ---------------------------------------------------------------------------
// Ajustes (mockup 12) - SettingsTabs verticales.
//
// Tabs: Perfil, Preferencias (apariencia/tema REAL via useClientTheme),
// Notificaciones (incluye 'Briefing 06:00'), Clientes (registry real CLIENTS),
// API Keys (Pronto), Equipo (Pronto).
//
// Estado real cableado:
//  - Perfil: useMe() -> user.username + roles (backend). Nombre/email/idioma/tz
//    son estado local; el backend no persiste un PUT de settings todavia.
//  - Preferencias > Tema: useClientTheme().mode/setMode (persiste de verdad).
//  - DemoBadge: TOGGLE GLOBAL real via useDemoBadgeFlag (un solo lugar).
//  - Clientes: lista derivada del registry de theming (CLIENTS).
//
// Lo demas (switches de alertas, densidad, rango default, roles por cliente)
// es estado local optimista marcado con // API PENDIENTE; no inventamos data
// remota. Mucho 'Proximamente' honesto en API Keys / Equipo / Push.
//
// Regla 79: cero acentos ni n-con-tilde en strings visibles.
// ---------------------------------------------------------------------------

type TabKey = 'perfil' | 'prefs' | 'notif' | 'clientes' | 'api' | 'equipo'

const TABS: { key: TabKey; label: string; Icon: typeof User; soon?: boolean }[] =
  [
    { key: 'perfil', label: 'Perfil', Icon: User },
    { key: 'prefs', label: 'Preferencias', Icon: SlidersHorizontal },
    { key: 'notif', label: 'Notificaciones', Icon: Bell },
    { key: 'clientes', label: 'Clientes', Icon: Users },
    { key: 'api', label: 'API Keys', Icon: KeyRound, soon: true },
    { key: 'equipo', label: 'Equipo', Icon: UsersRound, soon: true },
  ]

// ---------------------------------------------------------------------------
// Primitivos inline (no editamos components/* compartidos; los compongo aqui)
// ---------------------------------------------------------------------------

/** Toggle on/off (no existe como export compartido -> inline). */
function Switch({
  on,
  onChange,
  disabled,
  label,
}: {
  on: boolean
  onChange?: (next: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className={cn(
        'relative h-[26px] w-[46px] flex-none rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base',
        on ? 'bg-primary' : 'bg-border-strong',
        disabled && 'opacity-50 pointer-events-none',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.3)]',
          'transition-transform duration-200 ease-spring motion-reduce:transition-none',
          on && 'translate-x-5',
        )}
      />
    </button>
  )
}

/** Segmented control (pill) - inline. */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (next: T) => void
  ariaLabel: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-pill border border-border-subtle bg-sunken p-[3px]"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'h-[30px] rounded-full px-3.5 text-xs font-semibold transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              active
                ? 'bg-primary text-[color:var(--text-on-primary)]'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** Fila label/control. */
function FRow({
  title,
  hint,
  control,
}: {
  title: string
  hint?: string
  control: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border-subtle py-3.5 first:border-t-0">
      <div className="min-w-0">
        <b className="block text-sm font-semibold text-ink">{title}</b>
        {hint ? <span className="text-xs text-ink-subtle">{hint}</span> : null}
      </div>
      <div className="flex-none">{control}</div>
    </div>
  )
}

/** Encabezado de seccion dentro de un panel. */
function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {sub ? <p className="mt-0.5 text-sm text-ink-subtle">{sub}</p> : null}
    </div>
  )
}

/** Panel 'Proximamente' honesto (API Keys / Equipo). */
function SoonCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode
  title: string
  body: string
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--primary-soft)] text-primary">
        {icon}
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="max-w-[38ch] text-sm text-ink-muted">{body}</p>
      <Button variant="ghost" size="sm" disabled>
        Avisarme cuando este listo
      </Button>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Tab: Perfil
// ---------------------------------------------------------------------------

function PerfilTab() {
  const { data, isLoading, isError } = useMe()
  const user = data?.user

  // Nombre/email/idioma/tz: el backend NO expone estos campos ni un PUT.
  // Estado local optimista. // API PENDIENTE PUT /settings/profile.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [lang, setLang] = useState<'mx' | 'en'>('mx')

  const username = user?.username ?? ''
  const roles = user?.roles ?? []
  const primaryRole = roles[0] ?? 'Usuario'

  const initials = useMemo(() => {
    const src = name.trim() || username
    if (!src) return 'PL'
    const parts = src.split(/[\s._-]+/).filter(Boolean)
    const a = parts[0]?.[0] ?? ''
    const b = parts[1]?.[0] ?? ''
    return (a + b || a).toUpperCase().slice(0, 2)
  }, [name, username])

  return (
    <Card className="px-6 py-5">
      <div className="mb-5 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-hero text-[22px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <b className="block text-base font-bold text-ink">
            {name.trim() || username || 'Tu perfil'}
          </b>
          {isLoading ? (
            <span className="block text-sm text-ink-subtle">Cargando sesion...</span>
          ) : isError ? (
            <span className="block text-sm text-ink-subtle">
              Sesion no disponible
            </span>
          ) : (
            <span className="block text-sm text-ink-subtle">
              {username ? `${username} - ${primaryRole}` : primaryRole}
            </span>
          )}
        </div>
      </div>

      <FRow
        title="Nombre"
        hint="Tu nombre visible"
        control={
          <Input
            className="min-w-[220px]"
            value={name}
            placeholder={username || 'Tu nombre'}
            onChange={(e) => setName(e.target.value)}
            aria-label="Nombre"
          />
        }
      />
      <FRow
        title="Email"
        hint="Para alertas y briefings"
        control={
          <Input
            type="email"
            className="min-w-[220px]"
            value={email}
            placeholder="tu@correo.com"
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
          />
        }
      />
      <FRow
        title="Rol"
        hint="Permisos en la cuenta (desde tu sesion)"
        control={
          <span className="inline-flex h-[30px] items-center rounded-pill border border-border-subtle bg-sunken px-3.5 text-xs font-semibold text-ink-muted">
            {primaryRole}
          </span>
        }
      />
      <FRow
        title="Idioma"
        control={
          <Segmented
            ariaLabel="Idioma"
            value={lang}
            onChange={setLang}
            options={[
              { value: 'mx', label: 'Espanol (MX)' },
              { value: 'en', label: 'English' },
            ]}
          />
        }
      />
      <FRow
        title="Zona horaria"
        hint="America/Mexico_City (GMT-6)"
        control={
          <span className="inline-flex h-[30px] items-center rounded-pill border border-border-subtle bg-sunken px-3.5 text-xs font-semibold text-ink-muted">
            GMT-6
          </span>
        }
      />

      <div className="mt-5 flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
        {/* API PENDIENTE PUT /settings/profile -> sin endpoint, guardado local */}
        <span className="text-xs text-ink-subtle">
          Guardado de perfil disponible proximamente
        </span>
        <Button variant="primary" size="sm" disabled>
          Guardar cambios
        </Button>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Tab: Preferencias (Apariencia) - tema REAL via useClientTheme
// ---------------------------------------------------------------------------

function PrefsTab() {
  const { mode, setMode } = useClientTheme()

  // Densidad y rango default: aun no se consumen globalmente -> estado local.
  // API PENDIENTE PUT /settings/preferences.
  const [density, setDensity] = useState<'compact' | 'normal' | 'comfy'>('normal')
  const [range, setRange] = useState<'24h' | '7d' | '30d' | '60d'>('30d')

  // Animaciones en charts: reflejo del estado real del sistema (read-only,
  // lo controla prefers-reduced-motion del usuario).
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  return (
    <Card className="px-6 py-5">
      <SectionHead title="Apariencia" sub="Como se ve POLARIS por defecto." />
      <FRow
        title="Tema"
        hint="Claro, oscuro o segun el sistema"
        control={
          <Segmented<ThemeMode>
            ariaLabel="Tema"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
              { value: 'system', label: 'Sistema' },
            ]}
          />
        }
      />
      <FRow
        title="Densidad de tablas"
        control={
          <Segmented
            ariaLabel="Densidad de tablas"
            value={density}
            onChange={setDensity}
            options={[
              { value: 'compact', label: 'Compacto' },
              { value: 'normal', label: 'Normal' },
              { value: 'comfy', label: 'Comodo' },
            ]}
          />
        }
      />
      <FRow
        title="Rango temporal default"
        control={
          <Segmented
            ariaLabel="Rango temporal default"
            value={range}
            onChange={setRange}
            options={[
              { value: '24h', label: '24h' },
              { value: '7d', label: '7d' },
              { value: '30d', label: '30d' },
              { value: '60d', label: '60d' },
            ]}
          />
        }
      />
      <FRow
        title="Animaciones en charts"
        hint={
          reduceMotion
            ? 'Reducidas por preferencia del sistema'
            : 'Transiciones al cargar datos'
        }
        control={
          <Switch
            label="Animaciones en charts"
            on={!reduceMotion}
            disabled
          />
        }
      />
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Tab: Notificaciones
// ---------------------------------------------------------------------------

function NotifTab() {
  // API PENDIENTE PUT /settings/notifications -> estado local optimista.
  const [alerts, setAlerts] = useState({
    critical: true,
    warning: true,
    watch: false,
    info: false,
  })
  const [briefing, setBriefing] = useState(true)

  return (
    <>
      <Card className="mb-4 px-6 py-5">
        <SectionHead
          title="Alertas por email"
          sub="Recibe un correo segun la severidad."
        />
        <FRow
          title="Critical"
          hint="Siempre recomendado"
          control={
            <Switch
              label="Alertas Critical por email"
              on={alerts.critical}
              onChange={(v) => setAlerts((s) => ({ ...s, critical: v }))}
            />
          }
        />
        <FRow
          title="Warning"
          control={
            <Switch
              label="Alertas Warning por email"
              on={alerts.warning}
              onChange={(v) => setAlerts((s) => ({ ...s, warning: v }))}
            />
          }
        />
        <FRow
          title="Watch"
          control={
            <Switch
              label="Alertas Watch por email"
              on={alerts.watch}
              onChange={(v) => setAlerts((s) => ({ ...s, watch: v }))}
            />
          }
        />
        <FRow
          title="Info"
          control={
            <Switch
              label="Alertas Info por email"
              on={alerts.info}
              onChange={(v) => setAlerts((s) => ({ ...s, info: v }))}
            />
          }
        />
      </Card>

      <Card className="px-6 py-5">
        <SectionHead title="Briefing y push" />
        <FRow
          title="Briefing diario por email"
          hint="Cada manana a las 06:00"
          control={
            <Switch
              label="Briefing 06:00 por email"
              on={briefing}
              onChange={setBriefing}
            />
          }
        />
        <FRow
          title="Push notifications"
          hint="App movil - proximamente"
          control={
            <Switch label="Push notifications" on={false} disabled />
          }
        />
      </Card>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tab: Clientes - registry real CLIENTS (theming). Permisos = estado local.
// ---------------------------------------------------------------------------

function clientInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts[1]?.[0] ?? ''
  return (a + b || a).toUpperCase().slice(0, 2)
}

function ClientRow({ client }: { client: ClientTheme }) {
  // API PENDIENTE PUT /settings/clients/{id}/role -> permiso local optimista.
  const [perm, setPerm] = useState<'read' | 'write' | 'admin'>('write')
  const gradient = `linear-gradient(135deg, ${client.primary_dark}, ${client.primary_light})`

  return (
    <div className="flex items-center gap-3 border-t border-border-subtle py-3 first:border-t-0">
      <span
        className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full text-xs font-bold text-white"
        style={{ background: gradient }}
        aria-hidden="true"
      >
        {clientInitials(client.display_name)}
      </span>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-sm font-semibold text-ink">
          {client.display_name}
        </b>
        <span className="text-xs text-ink-subtle">{client.party}</span>
      </div>
      <span
        className="hidden rounded-full px-2 py-0.5 text-xs font-semibold text-white sm:inline-block"
        style={{ background: client.primary }}
      >
        {client.party}
      </span>
      <Segmented
        ariaLabel={`Permiso para ${client.display_name}`}
        value={perm}
        onChange={setPerm}
        options={[
          { value: 'read', label: 'Read' },
          { value: 'write', label: 'Write' },
          { value: 'admin', label: 'Admin' },
        ]}
      />
    </div>
  )
}

function ClientesTab() {
  const { clients } = useClientTheme()

  return (
    <Card className="px-6 py-5">
      <SectionHead
        title="Clientes accesibles"
        sub="Politicos que puedes monitorear y tus permisos."
      />
      {clients.map((c) => (
        <ClientRow key={c.id} client={c} />
      ))}
      <div className="mt-2 flex items-center justify-between gap-4 border-t border-border-subtle pt-3.5">
        <div className="min-w-0">
          <b className="block text-sm font-semibold text-ink">Agregar cliente</b>
          <span className="text-xs text-ink-subtle">
            Conecta otro politico a la cuenta
          </span>
        </div>
        {/* API PENDIENTE POST /settings/clients -> sin onboarding aun */}
        <Button variant="primary" size="sm" disabled>
          + Agregar
        </Button>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Toggle GLOBAL del DemoBadge - vive en Ajustes, fuente unica useDemoBadgeFlag.
// ---------------------------------------------------------------------------

function DemoBadgeToggle() {
  const enabled = useDemoBadgeFlag((s) => s.enabled)
  const setEnabled = useDemoBadgeFlag((s) => s.setEnabled)

  return (
    <Card className="mb-4 px-6 py-5">
      <SectionHead
        title="Modo demo"
        sub="Controla el chip DEMO en paneles con data sintetica (toda la app)."
      />
      <FRow
        title="Mostrar etiqueta DEMO"
        hint="Marca de forma visible los paneles con datos de demostracion"
        control={
          <div className="flex items-center gap-3">
            <DemoBadge always />
            <Switch
              label="Mostrar etiqueta DEMO"
              on={enabled}
              onChange={setEnabled}
            />
          </div>
        }
      />
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Pantalla
// ---------------------------------------------------------------------------

export default function Ajustes() {
  const [tab, setTab] = useState<TabKey>('perfil')

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Ajustes" subtitle="Configuracion" />

      <div className="grid items-start gap-5 lg:grid-cols-[220px_1fr]">
        {/* Tabs verticales (horizontal scroll en mobile) */}
        <nav
          aria-label="Secciones de ajustes"
          className="flex gap-0.5 overflow-x-auto lg:sticky lg:top-20 lg:flex-col"
        >
          {TABS.map(({ key, label, Icon, soon }) => {
            const active = key === tab
            return (
              <button
                key={key}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setTab(key)}
                className={cn(
                  'flex flex-none items-center gap-2.5 whitespace-nowrap rounded-xs px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  active
                    ? 'bg-[var(--primary-soft)] font-semibold text-primary'
                    : 'text-ink-muted hover:bg-[var(--bg-hover)] hover:text-ink',
                )}
              >
                <Icon size={17} strokeWidth={1.8} className="opacity-80" />
                <span>{label}</span>
                {soon ? (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-ink-subtle">
                    Pronto
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        {/* Panel activo */}
        <div className="min-w-0">
          {tab === 'perfil' && <PerfilTab />}
          {tab === 'prefs' && <PrefsTab />}
          {tab === 'notif' && (
            <>
              <DemoBadgeToggle />
              <NotifTab />
            </>
          )}
          {tab === 'clientes' && <ClientesTab />}
          {tab === 'api' && (
            <SoonCard
              icon={<KeyRound size={26} strokeWidth={1.8} />}
              title="API Keys"
              body="Acceso programatico a metricas, menciones y alertas. Disponible en la siguiente Wave para planes Enterprise."
            />
          )}
          {tab === 'equipo' && (
            <SoonCard
              icon={<UsersRound size={26} strokeWidth={1.8} />}
              title="Equipo"
              body="Invita a tu equipo de comunicacion, asigna roles y comparte clientes. Proximamente."
            />
          )}
        </div>
      </div>
    </div>
  )
}
