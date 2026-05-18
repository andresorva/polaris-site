import { cn } from '../../lib/utils/cn'
import { platformStyle } from '../../lib/utils/platform'

/**
 * PlatformChip — small colored badge that identifies a content platform.
 *
 * Styles + labels live in `lib/utils/platform.ts` (keeps this file
 * component-only so react-refresh stays clean).
 */

type Props = {
  platform: string
  className?: string
}

export function PlatformChip({ platform, className }: Props) {
  const style = platformStyle(platform)
  const label = style.label || platform
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide border',
        style.bg,
        style.text,
        style.border,
        className,
      )}
      title={platform}
    >
      {label}
    </span>
  )
}
