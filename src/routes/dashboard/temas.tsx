import {
  AlertOctagon,
  Building,
  Car,
  Info,
  type LucideIcon,
  Megaphone,
  Shield,
  Sparkles,
  Trees,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/states/EmptyState'

// ---------------------------------------------------------------------------
// Taxonomia oficial POLARIS-MX
// Mirror exact de polaris/apps/api/agents/topic_classifier.py TAXONOMY
// (commit 185ec5f). Vista previa informativa — NO data real.
// ---------------------------------------------------------------------------

type TopCategory = {
  key: string
  label: string
  icon: LucideIcon
  subs: string[]
  description: string
}

const TAXONOMY: TopCategory[] = [
  {
    key: 'INFRAESTRUCTURA',
    label: 'Infraestructura',
    icon: Wrench,
    subs: [
      'obras_inconclusas',
      'baches',
      'pavimentacion',
      'banquetas',
      'alumbrado',
      'drenaje',
      'agua_potable',
    ],
    description:
      'Obra publica, vialidades, servicios basicos de infraestructura urbana.',
  },
  {
    key: 'MOVILIDAD',
    label: 'Movilidad',
    icon: Car,
    subs: [
      'vialidad_general',
      'trafico',
      'transporte_publico',
      'estacionamiento',
      'accidentes_viales',
    ],
    description: 'Trafico, transporte publico, vialidad y accidentes.',
  },
  {
    key: 'SEGURIDAD',
    label: 'Seguridad',
    icon: Shield,
    subs: [
      'delincuencia',
      'violencia_de_genero',
      'secuestros',
      'robos',
      'c5_cdmx_reportes',
    ],
    description:
      'Delincuencia, violencia, reportes ciudadanos (C5 CDMX) y robos.',
  },
  {
    key: 'MEDIO_AMBIENTE',
    label: 'Medio ambiente',
    icon: Trees,
    subs: [
      'tala_arboles',
      'barrancas',
      'contaminacion',
      'proteccion_animal',
      'lluvias_deslaves',
    ],
    description:
      'Tala, contaminacion, animales, barrancas (Cuajimalpa) y lluvias.',
  },
  {
    key: 'SERVICIOS_PUBLICOS',
    label: 'Servicios publicos',
    icon: Building,
    subs: [
      'basura_recoleccion',
      'mercados',
      'parques',
      'panteones',
      'tianguis',
    ],
    description: 'Limpieza, mercados, espacios publicos.',
  },
  {
    key: 'GOBIERNO',
    label: 'Gobierno',
    icon: Megaphone,
    subs: ['actos_publicos', 'eventos', 'declaraciones', 'reuniones', 'giras'],
    description: 'Actos, declaraciones, eventos oficiales y giras politicas.',
  },
  {
    key: 'CRITICA_POLITICA',
    label: 'Critica politica',
    icon: AlertOctagon,
    subs: [
      'corrupcion',
      'ataques_personales',
      'cuestionamientos_gestion',
      'comparaciones_otros_politicos',
    ],
    description:
      'Acusaciones, ataques personales, criticas a la gestion y comparativos.',
  },
]

const TOTAL_SUBCATS = TAXONOMY.reduce((s, c) => s + c.subs.length, 0)

// ---------------------------------------------------------------------------
// Taxonomy preview card
// ---------------------------------------------------------------------------

function TaxonomyCategoryCard({ cat }: { cat: TopCategory }) {
  const Icon = cat.icon
  return (
    <Card>
      <div className="flex items-start gap-3 mb-2">
        <div
          className="shrink-0 w-9 h-9 rounded-md border border-border bg-surface flex items-center justify-center text-ink-muted"
          aria-hidden="true"
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wide font-mono">
            {cat.key}
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">{cat.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {cat.subs.map((sub) => (
          <span
            key={sub}
            className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-mono text-ink-subtle"
            title="Conteo real disponible post-Wave B fix + reprocess."
          >
            {sub}
          </span>
        ))}
      </div>
      <div className="mt-3 text-[10px] uppercase tracking-wide font-mono text-ink-subtle">
        {cat.subs.length} sub-categorias
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Temas y narrativas route
// ---------------------------------------------------------------------------

export function Temas() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Temas y narrativas"
        subtitle="Clasificacion politica municipal MX"
      />

      {/* Caveat banner prominente */}
      <div
        role="status"
        className="flex items-start gap-3 rounded-lg border border-sentiment-mixed/40 bg-sentiment-mixed/10 p-4 text-sm text-ink"
      >
        <Info
          size={20}
          className="text-sentiment-mixed mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <div className="min-w-0 space-y-1">
          <div className="font-medium text-ink">
            Topics agregados pendientes Wave B
          </div>
          <p className="text-sm text-ink-muted">
            Endpoint <code className="font-mono text-xs">/topics</code> regresa{' '}
            <code className="font-mono text-xs">{`{topics: [], total: 0}`}</code>{' '}
            pese a que ~21% de menciones tienen clasificacion en DB. Requiere
            Wave B fix B-15 (orchestrator window) + redeploy backend con el
            nuevo classifier MX-aware (polaris commit{' '}
            <code className="font-mono text-xs">185ec5f</code>) + reproceso de
            menciones existentes.
          </p>
          <p className="text-sm text-ink-muted">
            La taxonomia abajo es <strong>vista previa informativa</strong> de
            las 7 categorias top + {TOTAL_SUBCATS} sub-categorias que el
            classifier soporta. No es data real — los conteos llegan post-fix.
          </p>
        </div>
      </div>

      {/* Section 1: Taxonomia preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-ink">
            Vista previa taxonomia POLARIS-MX
          </h2>
          <span className="text-xs font-mono text-ink-muted">
            7 top · {TOTAL_SUBCATS} sub-cats
          </span>
        </div>
        <p className="text-xs text-ink-muted italic">
          Vista previa de taxonomia — clasificacion real pendiente Wave B fix
          B-15 + redeploy. Etiquetas grises sin conteo intencionalmente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TAXONOMY.map((cat) => (
            <TaxonomyCategoryCard key={cat.key} cat={cat} />
          ))}
        </div>
      </section>

      {/* Section 2: Tendencias 30d (RED) */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">Tendencias 30d</h2>
        </div>
        <EmptyState
          icon={<TrendingUp size={48} strokeWidth={1.5} />}
          title="Pendiente Wave B"
          description="Tendencias topic-over-time requieren agregador de topics funcional. Endpoint actual regresa lista vacia; Wave B fix + reprocess habilitan esta vista."
        />
      </Card>

      {/* Section 3: Vocabulario emergente (RED) */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">
            Vocabulario emergente
          </h2>
        </div>
        <EmptyState
          icon={<Sparkles size={48} strokeWidth={1.5} />}
          title="Pendiente Wave B"
          description="Deteccion de terminos emergentes (n-gram drift) requiere pipeline NLP adicional. Sin endpoint expuesto en backend actual; planeado Wave B + Track 3."
        />
      </Card>
    </div>
  )
}

export default Temas
