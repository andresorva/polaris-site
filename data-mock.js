/* ============================================
   POLARIS — Mock Data & Helpers (FALLBACK)
   1 politico REAL con UUID de produccion:
   Carlos Orvañanos Rea (alcalde Cuajimalpa). Si el API
   responde, los componentes usan loadPoliticians()
   y muestran data live; este mock solo sirve de
   fallback cuando el API no esta disponible.
   ============================================ */

const POLITICIANS = [
  {
    id: '65dc08f0-8fe9-463f-880f-36b5da66ebe6',
    name: 'Carlos Orvañanos Rea',
    initials: 'CO',
    role: 'Alcalde',
    party: 'PAN',
    region: 'Cuajimalpa, CDMX',
    color: '#2EE6C8',
    sentiment: 54,
    mentions: '333',
    trend: 'flat',
    trendDelta: 1.2,
    handle: '@carlosorvananos',
    lastActive: 'live',
  },
];

// Generate a sentiment time series — 30 days
// Trend: positive RISING, neutral FLAT, negative FALLING (sentiment improving over time)
function genSentimentSeries(seed = 1, base = 60, volatility = 8, len = 30) {
  const out = [];
  const posStart = Math.max(30, base - 12);
  const posEnd   = Math.min(85, base + 14);
  const negStart = 38;
  const negEnd   = 14;
  const neuMid   = 24;
  for (let i = 0; i < len; i++) {
    const t = i / (len - 1);
    const ease = t * t * (3 - 2 * t);
    const posTrend = posStart + (posEnd - posStart) * ease;
    const negTrend = negStart + (negEnd - negStart) * ease;
    const neuTrend = neuMid;
    const wobblePos = Math.sin(i * 0.55 + seed * 0.7) * volatility * 0.45 + Math.cos(i * 0.31 + seed) * volatility * 0.2;
    const wobbleNeg = Math.sin(i * 0.49 + seed * 1.1 + 2) * volatility * 0.45 + Math.cos(i * 0.27 + seed) * volatility * 0.18;
    const wobbleNeu = Math.sin(i * 0.42 + seed * 1.4 + 5) * volatility * 0.35;
    const pos = Math.max(8, Math.min(92, posTrend + wobblePos));
    const neg = Math.max(4, Math.min(60, negTrend + wobbleNeg));
    const neu = Math.max(8, Math.min(50, neuTrend + wobbleNeu));
    out.push({ day: i, pos, neu, neg, total: pos });
  }
  return out;
}

// Mock feed (fallback) — ejemplos genericos sobre Cuajimalpa/CDMX
const FEED_ITEMS = [
  {
    id: 'f1', platform: 'X', user: '@vecino_cuaji', handle: 'Vecino Cuajimalpa', avatar: 'VC',
    time: 'hace 2 min',
    content: 'Buena la jornada de limpieza este sábado en la alcaldía. Se nota el esfuerzo del personal de obras.',
    sentiment: 'pos', score: 0.62,
    engagement: { likes: 142, replies: 18, shares: 22 }, reach: '4.1K',
    flags: ['organic'],
  },
  {
    id: 'f2', platform: 'X', user: '@analistapol_mx', handle: 'Análisis CDMX', avatar: 'AC',
    time: 'hace 4 min',
    content: 'Falta concreción en el plan de obras 2026. ¿Alguien tiene el documento del paquete económico de la alcaldía?',
    sentiment: 'neu', score: 0.05,
    engagement: { likes: 88, replies: 24, shares: 14 }, reach: '2.6K',
    flags: ['organic'],
  },
  {
    id: 'f3', platform: 'TikTok', user: '@noticias.cdmx', handle: 'Noticias CDMX', avatar: 'NC',
    time: 'hace 6 min',
    content: 'Repaso: las tres obras más importantes que arrancan este mes en alcaldías del poniente →',
    sentiment: 'pos', score: 0.42,
    engagement: { likes: 12400, replies: 612, shares: 1840 }, reach: '184K',
    flags: ['viral', 'verified'],
  },
  {
    id: 'f4', platform: 'X', user: '@critica_local', handle: 'Crítica Local', avatar: 'CL',
    time: 'hace 8 min',
    content: 'Otra vez baches sin atender en la zona alta. La promesa de pavimentación quedó en discurso.',
    sentiment: 'neg', score: -0.58,
    engagement: { likes: 412, replies: 184, shares: 92 }, reach: '18K',
    flags: ['organic', 'attack'],
  },
  {
    id: 'f5', platform: 'Facebook', user: 'Vecinos del Pueblo', handle: 'Grupo · 8.4K miembros', avatar: 'VP',
    time: 'hace 11 min',
    content: 'Recordatorio: este jueves asamblea vecinal en la plaza. Compartir en grupos del barrio.',
    sentiment: 'pos', score: 0.32,
    engagement: { likes: 312, replies: 48, shares: 124 }, reach: '12K',
    flags: ['mobilization', 'organic'],
  },
  {
    id: 'f6', platform: 'X', user: '@reportera_mx', handle: 'Mariana Reyes', avatar: 'MR',
    time: 'hace 14 min',
    content: 'Tres temas que nadie está midiendo bien en el debate de seguridad: (1) cifras de robo, (2) presencia policial, (3) coordinación con CDMX. Hilo 🧵',
    sentiment: 'neu', score: 0.04,
    engagement: { likes: 1840, replies: 284, shares: 612 }, reach: '92K',
    flags: ['analyst', 'verified'],
  },
  {
    id: 'f7', platform: 'X', user: '@cuenta_anon_42', handle: 'Cuenta Sospechosa', avatar: '??',
    time: 'hace 16 min',
    content: 'NO HACE NADA NO HACE NADA NO HACE NADA. Que se vaya. La gente ya no aguanta.',
    sentiment: 'neg', score: -0.84,
    engagement: { likes: 184, replies: 8, shares: 412 }, reach: '24K',
    flags: ['suspicious', 'bot-likely', 'attack'],
  },
];

// Top criticos (fallback) — voces genericas, sin nombres reales
const TOP_CRITICS = [
  { name: 'Cuenta Anónima A1', handle: '@anon_a1_mx', followers: '184K', volume: 142, intensity: 88, trend: 'up', sample: 'Ataques sistemáticos sobre temas de seguridad...', suspicious: true },
  { name: 'Periodista Crítica', handle: '@cronicacdmx', followers: '92K', volume: 88, intensity: 72, trend: 'up', sample: 'Las cifras oficiales no resisten el menor análisis...' },
  { name: 'Cuenta Anónima A2', handle: '@verdadcdmx_42', followers: '48K', volume: 412, intensity: 96, trend: 'up', sample: 'Hilo: las contradicciones en cada anuncio público...', suspicious: true },
  { name: 'Red Coordinada α', handle: '12 cuentas', followers: '~120K combinado', volume: 612, intensity: 91, trend: 'up', sample: 'Patrón detectado · publicaciones sincronizadas en ventana 4-6 AM', suspicious: true, network: true },
  { name: 'Vecino Inconforme', handle: '@inconforme_mx', followers: '32K', volume: 64, intensity: 68, trend: 'flat', sample: 'Es lamentable el espectáculo que están dando...' },
  { name: 'Activista Local', handle: '@activistalocal', followers: '18K', volume: 41, intensity: 62, trend: 'down', sample: 'La narrativa que intentan vender se cae por su propio peso...' },
];

// Alertas (fallback) — temas MX/CDMX genericos
const ALERTS = [
  { id: 'a1', severity: 'critical', title: 'Pico de menciones negativas detectado', desc: 'Aumento del 184% en las últimas 2 horas en X. Origen: cuentas con patrón coordinado.', time: 'hace 8 min', source: 'X · 1,840 menciones', new: true },
  { id: 'a2', severity: 'warning', title: 'Narrativa emergente: "no hace nada"', desc: 'Hashtag genérico creciendo en TikTok. 6K usos en 6 horas. Patrón compatible con campaña coordinada.', time: 'hace 32 min', source: 'TikTok · 6K menciones', new: true },
  { id: 'a3', severity: 'info', title: 'Cobertura mediática nacional', desc: 'El Universal y Reforma publicaron análisis sobre la jornada de obras. Tono mayoritariamente neutral.', time: 'hace 1 h', source: '8 medios nacionales', new: false },
  { id: 'a4', severity: 'critical', title: 'Cuenta verificada con 1.2M seguidores ataca', desc: 'Periodista crítica publicó hilo con 14 tweets en 20 minutos. Reach estimado: 4.2M.', time: 'hace 2 h', source: 'X · cuenta verificada', new: false },
  { id: 'a5', severity: 'warning', title: 'Spike geográfico en zona alta de Cuajimalpa', desc: 'Volumen de menciones negativas +120% vs media de 7 días. Coincide con falla de servicios.', time: 'hace 3 h', source: 'Geo · Cuajimalpa', new: false },
];

// Fuentes (fallback) — sin cambios, no menciona politicos
const SOURCES = [
  { name: 'X (Twitter)', icon: 'X', status: 'active', volume: '482K', latency: '12s', cost: '$2,400/mo', coverage: 98 },
  { name: 'TikTok', icon: 'T', status: 'active', volume: '128K', latency: '4 min', cost: '$1,800/mo', coverage: 84 },
  { name: 'Instagram', icon: 'IG', status: 'active', volume: '92K', latency: '8 min', cost: '$1,200/mo', coverage: 76 },
  { name: 'Facebook', icon: 'F', status: 'active', volume: '184K', latency: '6 min', cost: '$1,400/mo', coverage: 81 },
  { name: 'YouTube', icon: 'YT', status: 'active', volume: '24K', latency: '15 min', cost: '$800/mo', coverage: 72 },
  { name: 'Telegram', icon: 'TG', status: 'active', volume: '38K', latency: '2 min', cost: '$600/mo', coverage: 68 },
  { name: 'Medios web', icon: 'W', status: 'active', volume: '12K', latency: '20 min', cost: '$1,000/mo', coverage: 91 },
  { name: 'WhatsApp Pública', icon: 'WA', status: 'partial', volume: '8K', latency: '30 min', cost: '$400/mo', coverage: 32 },
  { name: 'Reddit', icon: 'R', status: 'paused', volume: '—', latency: '—', cost: '—', coverage: 0 },
];

// Reportes (fallback) — temas genericos MX
const REPORTS = [
  { id: 'r1', title: 'Reporte semanal · Sentimiento general', period: '14-20 oct 2024', status: 'ready', size: '12 págs', author: 'Auto-generado', cover: 'sentiment' },
  { id: 'r2', title: 'Análisis: jornada de obras Cuajimalpa', period: '18 oct 2024', status: 'ready', size: '8 págs', author: 'Auto-generado', cover: 'event' },
  { id: 'r3', title: 'Mapa de críticos · Top 50', period: 'Q4 2024', status: 'ready', size: '24 págs', author: 'Auto-generado', cover: 'critics' },
  { id: 'r4', title: 'Detección de redes coordinadas', period: 'Última semana', status: 'generating', size: '—', author: 'Análisis IA', cover: 'network', progress: 64 },
  { id: 'r5', title: 'Comparativa regional · alcaldías CDMX', period: 'Sep-oct 2024', status: 'ready', size: '32 págs', author: 'Auto-generado', cover: 'regional' },
  { id: 'r6', title: 'Reporte mensual ejecutivo', period: 'Octubre 2024', status: 'scheduled', size: '—', author: 'Programado · 31 oct', cover: 'executive' },
];

// Temas dominantes (fallback) — MX/CDMX
const TOPICS = [
  { name: 'Obras públicas', mentions: 42000, sentiment: 64, trend: 'up', delta: 18 },
  { name: 'Seguridad pública', mentions: 38200, sentiment: 48, trend: 'flat', delta: 4 },
  { name: 'Servicios urbanos', mentions: 24800, sentiment: 52, trend: 'flat', delta: 4 },
  { name: 'Movilidad', mentions: 18400, sentiment: 58, trend: 'up', delta: 12 },
  { name: 'Transparencia', mentions: 12200, sentiment: 41, trend: 'down', delta: -8 },
  { name: 'Coordinación con CDMX', mentions: 8400, sentiment: 56, trend: 'up', delta: 6 },
];

// Make available globally — sin sufijo (compat con componentes existentes)
// y con sufijo _MOCK para fallback explícito desde data.js / api-client.js.
Object.assign(window, {
  POLITICIANS, FEED_ITEMS, TOP_CRITICS, ALERTS, SOURCES, REPORTS, TOPICS,
  genSentimentSeries,
  POLITICIANS_MOCK: POLITICIANS,
  FEED_ITEMS_MOCK: FEED_ITEMS,
  TOP_CRITICS_MOCK: TOP_CRITICS,
  ALERTS_MOCK: ALERTS,
  SOURCES_MOCK: SOURCES,
  REPORTS_MOCK: REPORTS,
  TOPICS_MOCK: TOPICS,
});
