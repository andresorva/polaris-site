import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  id: string
  label: string
  to: string
  /** End-match: route is active only if exact (used for index route). */
  end?: boolean
  Icon: LucideIcon
  /** Short label (compact contexts). */
  short?: string
  /**
   * Muestra el badge de alertas (conteo) en el sidebar. El conteo real lo
   * resuelve AppShell via useAlerts; aqui solo marca que item lo lleva.
   */
  alertBadge?: boolean
  /**
   * Item de pie de sidebar (Ajustes): se renderiza separado, abajo del todo
   * (sb-foot), no en la lista principal de Monitoreo.
   */
  footer?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'vista-general',
    label: 'Vista General',
    short: 'General',
    to: '/dashboard',
    end: true,
    Icon: LayoutDashboard,
  },
  {
    id: 'pulso',
    label: 'Pulso en vivo',
    short: 'Pulso',
    to: '/dashboard/pulso',
    Icon: Activity,
  },
  {
    id: 'sentiment',
    label: 'Sentimiento',
    short: 'Sentim.',
    to: '/dashboard/sentiment',
    Icon: BarChart3,
  },
  {
    id: 'temas',
    label: 'Temas',
    short: 'Temas',
    to: '/dashboard/temas',
    Icon: MessageSquare,
  },
  {
    id: 'voces',
    label: 'Voces',
    short: 'Voces',
    to: '/dashboard/voces',
    Icon: Users,
  },
  {
    id: 'alertas',
    label: 'Alertas',
    short: 'Alertas',
    to: '/dashboard/alertas',
    Icon: AlertTriangle,
    alertBadge: true,
  },
  {
    id: 'briefing',
    label: 'Briefing',
    short: 'Brief',
    to: '/dashboard/briefing',
    Icon: FileText,
  },
  {
    id: 'fuentes',
    label: 'Fuentes',
    short: 'Fuentes',
    to: '/dashboard/fuentes',
    Icon: Database,
  },
]

/** Item de pie del sidebar: Ajustes (pantalla en wave siguiente). */
export const FOOTER_NAV_ITEM: NavItem = {
  id: 'ajustes',
  label: 'Ajustes',
  short: 'Ajustes',
  to: '/dashboard/ajustes',
  Icon: Settings,
  footer: true,
}
