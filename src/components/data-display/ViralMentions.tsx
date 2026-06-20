/**
 * ViralMentions — panel "Menciones virales" ordenadas por engagement.
 *
 * Mockup 04 (vista general, panel derecho): cada fila trae plataforma, autor,
 * tiempo relativo, etiqueta de sentimiento coloreada, el texto y un strip de
 * engagement (likes / reposts / comments).
 *
 * Consume `useMentions(politicianId)` y deriva el top-N por engagement total:
 *   - descarta google_trends (ruido sintetico, sin engagement real)
 *   - suma engagement_metrics, descarta filas con engagement 0
 *   - ordena desc, corta a `limit` (default 3)
 *
 * 4 estados honestos: loading (skeleton filas) / error (ErrorState + retry) /
 * empty (EmptyState) / data (lista).
 *
 * Colores de sentimiento via tokens --sent-* (sentimentColor()).
 * REGLA 79: ASCII puro en todo string visible.
 */

import {
  Heart,
  type LucideIcon,
  MessageCircle,
  MessageSquare,
  Repeat2,
} from 'lucide-react'
import { useMentions } from '../../lib/api/queries'
import type { Mention } from '../../lib/api/types'
import { cn } from '../../lib/utils/cn'
import { formatNumber, formatRelativeTime } from '../../lib/utils/format'
import { sentimentColor, sentimentLabel } from '../../lib/utils/sentiment'
import { Card } from '../ui/Card'
import { PlatformChip } from './PlatformChip'
import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'

// Plataformas que no representan conversacion real -> fuera del ranking viral.
const EXCLUDED_PLATFORMS = new Set(['google_trends', 'gdelt'])

type EngStat = { icon: LucideIcon; key: string; label: string }

// Mapeo de las metricas conocidas (de sse.ts: likes/reposts/comments) a iconos.
const ENG_STATS: EngStat[] = [
  { icon: Heart, key: 'likes', label: 'reacciones' },
  { icon: Repeat2, key: 'reposts', label: 'reposts' },
  { icon: MessageCircle, key: 'comments', label: 'comentarios' },
]

function engagementSum(m: Mention): number {
  return Object.values(m.engagement_metrics ?? {}).reduce<number>(
    (s, v) => s + (typeof v === 'number' && Number.isFinite(v) ? v : 0),
    0,
  )
}

function metricValue(m: Mention, key: string): number {
  const raw = m.engagement_metrics?.[key]
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0
}

function Row({ mention }: { mention: Mention }) {
  const sentColor = sentimentColor(mention.sentiment_label)
  const author = mention.author_handle || mention.author || '(anon)'
  const when = formatRelativeTime(mention.published_at ?? mention.collected_at)
  const text = (mention.content ?? '').trim() || '(sin contenido)'

  return (
    <div className="flex gap-3 py-3 border-b border-border-subtle last:border-b-0">
      <span
        className="grid place-items-center h-9 w-9 shrink-0 rounded-sm bg-sunken text-ink-muted"
        aria-hidden="true"
      >
        <MessageSquare size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-subtle mb-1">
          <PlatformChip platform={mention.platform} />
          <span className="truncate max-w-[12rem]">{author}</span>
          <span aria-hidden="true">·</span>
          <span>{when}</span>
          <span aria-hidden="true">·</span>
          <span style={{ color: sentColor, fontWeight: 600 }}>
            {sentimentLabel(mention.sentiment_label).toLowerCase()}
          </span>
        </div>
        <p className="text-sm text-ink leading-snug line-clamp-3">{text}</p>
        <div className="flex flex-wrap gap-3 mt-1.5 font-mono text-[11px] text-ink-subtle">
          {ENG_STATS.map(({ icon: Icon, key, label }) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 tabular-nums"
              title={label}
            >
              <Icon size={12} aria-hidden="true" />
              {formatNumber(metricValue(mention, key))}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function RowSkeleton() {
  return (
    <div className="flex gap-3 py-3 border-b border-border-subtle last:border-b-0">
      <div className="h-9 w-9 shrink-0 rounded-sm bg-sunken animate-pulse" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-2/5 rounded-xs bg-sunken animate-pulse" />
        <div className="h-3 w-full rounded-xs bg-sunken animate-pulse" />
        <div className="h-3 w-1/3 rounded-xs bg-sunken animate-pulse" />
      </div>
    </div>
  )
}

type Props = {
  politicianId: string
  /** Cuantas filas mostrar (default 3, como el mockup). */
  limit?: number
  /** Render sin la Card contenedora (para embeber en otra superficie). */
  bare?: boolean
  className?: string
}

export function ViralMentions({
  politicianId,
  limit = 3,
  bare = false,
  className,
}: Props) {
  const { data, isLoading, isError, refetch } = useMentions(politicianId, {
    limit: 50,
  })

  let body: React.ReactNode

  if (isLoading) {
    body = (
      <div role="status" aria-label="Cargando menciones virales">
        {Array.from({ length: limit }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    )
  } else if (isError) {
    body = (
      <ErrorState
        title="No se pudieron cargar las menciones"
        description="Hubo un problema al traer las menciones virales. Intenta de nuevo."
        onRetry={() => refetch()}
      />
    )
  } else {
    const ranked = (data ?? [])
      .filter((m) => !EXCLUDED_PLATFORMS.has(m.platform))
      .map((m) => ({ mention: m, eng: engagementSum(m) }))
      .filter((row) => row.eng > 0)
      .sort((a, b) => b.eng - a.eng)
      .slice(0, limit)

    if (ranked.length === 0) {
      body = (
        <EmptyState
          icon={<MessageSquare size={48} strokeWidth={1.5} />}
          title="Sin menciones virales"
          description="Tras descartar ruido sintetico y menciones sin engagement, no hay candidatos en la ventana actual."
        />
      )
    } else {
      body = (
        <div>
          {ranked.map(({ mention }) => (
            <Row key={mention.id} mention={mention} />
          ))}
        </div>
      )
    }
  }

  const header = (
    <div className="flex items-baseline justify-between mb-1">
      <h3 className="text-sm font-semibold text-ink">Menciones virales</h3>
      <span className="text-xs text-ink-subtle">por engagement</span>
    </div>
  )

  if (bare) {
    return (
      <div className={className}>
        {header}
        {body}
      </div>
    )
  }

  return (
    <Card className={cn('flex flex-col', className)}>
      {header}
      {body}
    </Card>
  )
}
