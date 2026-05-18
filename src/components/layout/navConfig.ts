import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  FileText,
  LayoutDashboard,
  MessageSquare,
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
  /** Short label for bottom-tab MobileNav. */
  short?: string
  /** Whether this item is featured in the 5-slot MobileNav primary row. */
  mobilePrimary?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'vista-general',
    label: 'Vista General',
    short: 'General',
    to: '/dashboard',
    end: true,
    Icon: LayoutDashboard,
    mobilePrimary: true,
  },
  {
    id: 'pulso',
    label: 'Pulso en vivo',
    short: 'Pulso',
    to: '/dashboard/pulso',
    Icon: Activity,
    mobilePrimary: true,
  },
  {
    id: 'sentiment',
    label: 'Sentimiento',
    short: 'Sentim.',
    to: '/dashboard/sentiment',
    Icon: BarChart3,
    mobilePrimary: true,
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
  },
  {
    id: 'briefing',
    label: 'Briefing',
    short: 'Brief',
    to: '/dashboard/briefing',
    Icon: FileText,
    mobilePrimary: true,
  },
  {
    id: 'fuentes',
    label: 'Fuentes',
    short: 'Fuentes',
    to: '/dashboard/fuentes',
    Icon: Database,
    mobilePrimary: true,
  },
]
