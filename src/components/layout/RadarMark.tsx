import { cn } from '../../lib/utils/cn'

type Props = {
  /** Tamano en px del cuadrado SVG. Default 30 (sidebar brand). */
  size?: number
  className?: string
  /** Renderiza el blip (parpadeo). Solo visible en tamanos medianos+. */
  withBlip?: boolean
}

/**
 * RadarMark — el simbolo POLARIS: un radar animado.
 *
 * - Barrido (.sweep) gira en loop 3.8s linear infinite.
 * - Blip (.blip) parpadea 1.9s (star-twinkle) — opt-in via withBlip.
 * - Hereda var(--polaris-primary) via currentColor (.radar-ico) -> se auto-tinta
 *   por partido. La base de anillos usa stroke-opacity para integrarse con --bg.
 * - Respeta prefers-reduced-motion (las animaciones se apagan en index.css,
 *   queda el radar estatico).
 *
 * Las keyframes (radar-sweep / star-twinkle) y la clase .radar-ico viven en
 * index.css (design system v3), compartidas con el resto de la app.
 */
export function RadarMark({ size = 30, className, withBlip = false }: Props) {
  return (
    <svg
      className={cn('radar-ico', className)}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="POLARIS"
      focusable="false"
    >
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.25}
        strokeWidth={4}
      />
      <circle
        cx="50"
        cy="50"
        r="24"
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.4}
        strokeWidth={4}
      />
      <g className="sweep">
        <path
          d="M50 50 L50 4 A46 46 0 0 1 84 24 Z"
          fill="currentColor"
          opacity={0.2}
        />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="5"
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
        />
      </g>
      {withBlip ? (
        <circle className="blip" cx="71" cy="33" r="5" fill="currentColor" />
      ) : null}
      <circle cx="50" cy="50" r="8" fill="currentColor" />
    </svg>
  )
}

export default RadarMark
