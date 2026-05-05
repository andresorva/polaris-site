/* ============================================
   POLARIS — Mock Data & Helpers
   Realistic Spanish-language political dataset
   ============================================ */

const POLITICIANS = [
  {
    id: 'mc',
    name: 'María Corina Machado',
    initials: 'MC',
    role: 'Líder de la Oposición',
    party: 'Vente Venezuela',
    region: 'Venezuela',
    color: '#2EE6C8',
    sentiment: 68,
    mentions: '1.2M',
    trend: 'up',
    trendDelta: 12.4,
    handle: '@MariaCorinaYA',
    lastActive: 'hace 4 min',
  },
  {
    id: 'eg',
    name: 'Edmundo González',
    initials: 'EG',
    role: 'Candidato Presidencial',
    party: 'Plataforma Unitaria',
    region: 'Venezuela',
    color: '#4D7CFF',
    sentiment: 71,
    mentions: '892K',
    trend: 'up',
    trendDelta: 8.2,
    handle: '@EdmundoGU',
    lastActive: 'hace 12 min',
  },
  {
    id: 'gp',
    name: 'Gustavo Petro',
    initials: 'GP',
    role: 'Presidente',
    party: 'Pacto Histórico',
    region: 'Colombia',
    color: '#FFB546',
    sentiment: 42,
    mentions: '3.4M',
    trend: 'down',
    trendDelta: -6.1,
    handle: '@petrogustavo',
    lastActive: 'hace 1 min',
  },
  {
    id: 'jm',
    name: 'Javier Milei',
    initials: 'JM',
    role: 'Presidente',
    party: 'La Libertad Avanza',
    region: 'Argentina',
    color: '#A78BFA',
    sentiment: 54,
    mentions: '5.8M',
    trend: 'up',
    trendDelta: 3.7,
    handle: '@JMilei',
    lastActive: 'hace 2 min',
  },
  {
    id: 'cs',
    name: 'Claudia Sheinbaum',
    initials: 'CS',
    role: 'Presidenta',
    party: 'Morena',
    region: 'México',
    color: '#FF4D6D',
    sentiment: 61,
    mentions: '2.9M',
    trend: 'up',
    trendDelta: 4.8,
    handle: '@Claudiashein',
    lastActive: 'hace 8 min',
  },
  {
    id: 'gb',
    name: 'Gabriel Boric',
    initials: 'GB',
    role: 'Presidente',
    party: 'Apruebo Dignidad',
    region: 'Chile',
    color: '#2EE6C8',
    sentiment: 47,
    mentions: '1.1M',
    trend: 'down',
    trendDelta: -2.3,
    handle: '@GabrielBoric',
    lastActive: 'hace 22 min',
  },
];

// Generate a sentiment time series — 30 days
// Trend: positive RISING, neutral FLAT, negative FALLING (sentiment improving over time)
function genSentimentSeries(seed = 1, base = 60, volatility = 8, len = 30) {
  const out = [];
  // Targets: pos goes from ~base-12 to ~base+14 (upward), neg from ~(35) to ~(15) (downward),
  // neu hovers around ~25 (flat). Always sums to ~100.
  const posStart = Math.max(30, base - 12);
  const posEnd   = Math.min(85, base + 14);
  const negStart = 38;
  const negEnd   = 14;
  const neuMid   = 24;
  for (let i = 0; i < len; i++) {
    const t = i / (len - 1); // 0..1

    // smooth easing for trend
    const ease = t * t * (3 - 2 * t); // smoothstep

    const posTrend = posStart + (posEnd - posStart) * ease;
    const negTrend = negStart + (negEnd - negStart) * ease;
    const neuTrend = neuMid;

    // small wobble per series, deterministic
    const wobblePos = Math.sin(i * 0.55 + seed * 0.7) * volatility * 0.45 + Math.cos(i * 0.31 + seed) * volatility * 0.2;
    const wobbleNeg = Math.sin(i * 0.49 + seed * 1.1 + 2) * volatility * 0.45 + Math.cos(i * 0.27 + seed) * volatility * 0.18;
    const wobbleNeu = Math.sin(i * 0.42 + seed * 1.4 + 5) * volatility * 0.35;

    const pos = Math.max(8, Math.min(92, posTrend + wobblePos));
    const neg = Math.max(4, Math.min(60, negTrend + wobbleNeg));
    const neu = Math.max(8, Math.min(50, neuTrend + wobbleNeu));

    out.push({
      day: i,
      pos,
      neu,
      neg,
      total: pos, // overall index tracks positive sentiment
    });
  }
  return out;
}

const FEED_ITEMS = [
  {
    id: 'f1',
    platform: 'X',
    user: '@CarolinaNZ_VE',
    handle: 'Carolina Núñez',
    avatar: 'CN',
    time: 'hace 2 min',
    content: 'La intervención de María Corina hoy en el cabildo de Maracaibo fue contundente. La movilización ciudadana es imparable. #VenezuelaLibre',
    sentiment: 'pos',
    score: 0.84,
    engagement: { likes: 12420, replies: 891, shares: 3422 },
    reach: '284K',
    flags: ['organic', 'verified'],
  },
  {
    id: 'f2',
    platform: 'X',
    user: '@miguelOpinaVE',
    handle: 'Miguel Andrade',
    avatar: 'MA',
    time: 'hace 4 min',
    content: 'No me convencen las propuestas económicas. Falta concreción en el plan de los primeros 100 días. ¿Alguien tiene un documento oficial?',
    sentiment: 'neu',
    score: 0.12,
    engagement: { likes: 142, replies: 38, shares: 22 },
    reach: '4.1K',
    flags: ['organic'],
  },
  {
    id: 'f3',
    platform: 'TikTok',
    user: '@joven.politico',
    handle: 'Política Joven',
    avatar: 'PJ',
    time: 'hace 6 min',
    content: 'Análisis: por qué la narrativa de unidad está conectando con votantes jóvenes — datos del último sondeo →',
    sentiment: 'pos',
    score: 0.62,
    engagement: { likes: 48200, replies: 2104, shares: 8900 },
    reach: '1.2M',
    flags: ['viral', 'trending'],
  },
  {
    id: 'f4',
    platform: 'Instagram',
    user: '@redes.ofi.psuv',
    handle: 'Cuenta Oficialista',
    avatar: 'OP',
    time: 'hace 8 min',
    content: 'Otro intento desesperado de manipular a la opinión pública con cifras infladas y promesas vacías. La realidad es muy distinta.',
    sentiment: 'neg',
    score: -0.78,
    engagement: { likes: 2412, replies: 1284, shares: 421 },
    reach: '92K',
    flags: ['coordinated', 'attack'],
  },
  {
    id: 'f5',
    platform: 'Facebook',
    user: 'Comité Vecinal Catia',
    handle: 'Grupo · 12.4K miembros',
    avatar: 'CV',
    time: 'hace 11 min',
    content: 'Recordatorio: este sábado jornada de cedulación en la plaza. Llevar dos testigos y comprobante de residencia. Compartir en grupos del sector.',
    sentiment: 'pos',
    score: 0.41,
    engagement: { likes: 892, replies: 124, shares: 1840 },
    reach: '38K',
    flags: ['mobilization', 'organic'],
  },
  {
    id: 'f6',
    platform: 'X',
    user: '@analistaPol',
    handle: 'Roberto Salas',
    avatar: 'RS',
    time: 'hace 14 min',
    content: 'Tres cosas que nadie está midiendo bien: (1) abstención en zonas rurales, (2) impacto del voto en el extranjero, (3) máquinas de auditoría. Hilo 🧵',
    sentiment: 'neu',
    score: 0.04,
    engagement: { likes: 4210, replies: 612, shares: 1820 },
    reach: '184K',
    flags: ['analyst', 'verified'],
  },
  {
    id: 'f7',
    platform: 'X',
    user: '@bot_swarm_42',
    handle: 'Cuenta Sospechosa',
    avatar: '??',
    time: 'hace 16 min',
    content: 'CORRUPTA CORRUPTA CORRUPTA. Que se vaya del país. La gente ya no aguanta más. #FraudeOpositor',
    sentiment: 'neg',
    score: -0.92,
    engagement: { likes: 412, replies: 12, shares: 1244 },
    reach: '48K',
    flags: ['suspicious', 'bot-likely', 'attack'],
  },
];

const TOP_CRITICS = [
  { name: 'Diosdado Cabello', handle: '@dcabellor', followers: '1.2M', volume: 142, intensity: 94, trend: 'up', sample: 'Una operación dirigida desde el extranjero para desestabilizar...' },
  { name: 'Jorge Rodríguez', handle: '@jorgerpsuv', followers: '892K', volume: 88, intensity: 87, trend: 'up', sample: 'Las cifras que presentan no resisten el menor análisis técnico...' },
  { name: 'Cuenta Anónima 04', handle: '@verdadVE_04', followers: '48K', volume: 412, intensity: 96, trend: 'up', sample: 'Hilo: las contradicciones evidentes en cada discurso...', suspicious: true },
  { name: 'Red Coordinada α', handle: '12 cuentas', followers: '~120K combinado', volume: 612, intensity: 91, trend: 'up', sample: 'Patrón detectado · publicaciones sincronizadas en ventana 4-6 AM', suspicious: true, network: true },
  { name: 'Tania Díaz', handle: '@tanydiazpsuv', followers: '342K', volume: 64, intensity: 72, trend: 'flat', sample: 'Es lamentable el espectáculo que están dando ante el mundo...' },
  { name: 'William Castillo', handle: '@planwac', followers: '218K', volume: 41, intensity: 68, trend: 'down', sample: 'La narrativa que intentan vender se cae por su propio peso...' },
];

const ALERTS = [
  { id: 'a1', severity: 'critical', title: 'Pico de menciones negativas detectado', desc: 'Aumento del 340% en las últimas 2 horas en X. Origen: cuentas afiliadas a red oficialista.', time: 'hace 8 min', source: 'X · 2,840 menciones', new: true },
  { id: 'a2', severity: 'warning', title: 'Narrativa emergente: "fraude electoral"', desc: 'Hashtag #FraudeOpositor creciendo en TikTok. 12K usos en 6 horas. Patrón compatible con campaña coordinada.', time: 'hace 32 min', source: 'TikTok · 12K menciones', new: true },
  { id: 'a3', severity: 'info', title: 'Cobertura mediática internacional', desc: 'Reuters, AP y EFE publicaron análisis sobre la convocatoria del cabildo. Tono mayoritariamente neutral-positivo.', time: 'hace 1 h', source: '14 medios internacionales', new: false },
  { id: 'a4', severity: 'critical', title: 'Cuenta verificada con 1.2M seguidores ataca', desc: 'Diosdado Cabello publicó hilo con 14 tweets en 20 minutos. Reach estimado: 4.2M.', time: 'hace 2 h', source: 'X · @dcabellor', new: false },
  { id: 'a5', severity: 'warning', title: 'Spike en zona geográfica: Zulia', desc: 'Volumen de menciones positivas +180% vs media de 7 días. Coincide con cabildo de Maracaibo.', time: 'hace 3 h', source: 'Geo · Zulia', new: false },
];

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

const REPORTS = [
  { id: 'r1', title: 'Reporte semanal · Sentimiento general', period: '14-20 oct 2024', status: 'ready', size: '12 págs', author: 'Auto-generado', cover: 'sentiment' },
  { id: 'r2', title: 'Análisis: Cabildo de Maracaibo', period: '18 oct 2024', status: 'ready', size: '8 págs', author: 'María González', cover: 'event' },
  { id: 'r3', title: 'Mapa de críticos · Top 50', period: 'Q4 2024', status: 'ready', size: '24 págs', author: 'Auto-generado', cover: 'critics' },
  { id: 'r4', title: 'Detección de redes coordinadas', period: 'Última semana', status: 'generating', size: '—', author: 'Análisis IA', cover: 'network', progress: 64 },
  { id: 'r5', title: 'Comparativa regional · LATAM', period: 'Sep-oct 2024', status: 'ready', size: '32 págs', author: 'Carlos Vega', cover: 'regional' },
  { id: 'r6', title: 'Reporte mensual ejecutivo', period: 'Octubre 2024', status: 'scheduled', size: '—', author: 'Programado · 31 oct', cover: 'executive' },
];

const TOPICS = [
  { name: 'Elecciones 2024', mentions: 142000, sentiment: 64, trend: 'up', delta: 18 },
  { name: 'Cabildo Maracaibo', mentions: 48200, sentiment: 78, trend: 'up', delta: 240 },
  { name: 'Plan económico', mentions: 24800, sentiment: 52, trend: 'flat', delta: 4 },
  { name: 'Voto en el extranjero', mentions: 18400, sentiment: 71, trend: 'up', delta: 32 },
  { name: 'Sanciones internacionales', mentions: 12200, sentiment: 41, trend: 'down', delta: -12 },
  { name: 'Inhabilitación política', mentions: 8400, sentiment: 38, trend: 'down', delta: -8 },
];

// Make available globally
Object.assign(window, {
  POLITICIANS, FEED_ITEMS, TOP_CRITICS, ALERTS, SOURCES, REPORTS, TOPICS,
  genSentimentSeries,
});
