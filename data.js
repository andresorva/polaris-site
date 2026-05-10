/* ============================================
   POLARIS — Data layer (live + fallback)
   Funciones async que llaman a apiClient y mappean
   las respuestas al SHAPE que esperan los componentes.
   Si el API falla, devuelven los datos mock con
   isFallback:true para que el UI muestre el banner
   "modo demo".

   Cargar DESPUES de:
     - config.js
     - data-mock.js
     - api-client.js
   ============================================ */

(function () {
  const CFG = window.POLARIS_CONFIG;
  const api = window.apiClient;
  if (!CFG || !api) {
    console.error('[polaris] data.js requiere config.js + api-client.js cargados antes');
    return;
  }

  // === Mappers — convierten respuesta del API al SHAPE de los mocks ===

  // Color asignado por slug, deterministico para no parpadear
  const _COLOR_PALETTE = ['#2EE6C8', '#4D7CFF', '#FFB546', '#A78BFA', '#FF4D6D'];
  function _colorFor(slug) {
    let h = 0;
    for (let i = 0; i < (slug || '').length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
    return _COLOR_PALETTE[h % _COLOR_PALETTE.length];
  }

  function _initialsFor(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0] || '').join('').toUpperCase() || '??';
  }

  // Mapea una row de politicians del API al shape del mock
  // Acepta AMBAS formas del backend:
  //   - GET /politicians/{id} -> { ..., metrics: { ppi: { ppi_score, components:{...} }, sov_24h, ... } }
  //   - shape legacy donde ppi.score venía a nivel raíz
  function _mapPolitician(p, metrics) {
    const m = metrics || (p && p.metrics) || {};
    const ppiObj = (m && m.ppi) || {};

    // Score puede venir como ppi_score, score, o m.ppi_score
    const ppiScoreRaw = (typeof ppiObj.ppi_score === 'number') ? ppiObj.ppi_score
                      : (typeof ppiObj.score === 'number') ? ppiObj.score
                      : (typeof m.ppi_score === 'number') ? m.ppi_score
                      : null;
    const ppiScore = (typeof ppiScoreRaw === 'number' && !isNaN(ppiScoreRaw))
      ? Math.round(ppiScoreRaw) : null;

    // Sentiment normalizado (0..100) para el indicador de sentiment de la card
    const sentNorm = (ppiObj.components && typeof ppiObj.components.sentiment_normalized === 'number')
      ? ppiObj.components.sentiment_normalized
      : null;

    // Mention count real — NUNCA usar sov_24h como conteo
    const mentionCount = (ppiObj.components && typeof ppiObj.components.mention_count === 'number')
      ? ppiObj.components.mention_count
      : (typeof m.mention_count_24h === 'number') ? m.mention_count_24h
      : (typeof m.mentions_24h === 'number') ? m.mentions_24h
      : null;

    // SOV ya es porcentaje 0..100
    const sov = (typeof m.sov_24h === 'number') ? m.sov_24h : null;

    // Momentum
    const momentum = (typeof ppiObj.momentum === 'number') ? ppiObj.momentum
                   : (typeof m.momentum === 'number') ? m.momentum
                   : 0;

    return {
      id: p.id,                                  // UUID real
      slug: p.slug,
      name: p.name,
      initials: _initialsFor(p.name),
      role: p.position || '—',
      party: p.party || '—',
      region: p.country === 'MX' ? 'México' : (p.country || '—'),
      color: _colorFor(p.slug || p.id),
      // Metricas live cuando vienen
      sentiment: ppiScore,                       // PPI 0..100 (legacy field)
      sentimentNorm: sentNorm,                   // 0..100 para indicador sentiment
      mentions: (mentionCount != null)
        ? (mentionCount >= 1000 ? `${(mentionCount / 1000).toFixed(1)}K` : String(mentionCount))
        : '—',
      sov: (typeof sov === 'number') ? `${sov.toFixed(1)}%` : '—',
      trend: momentum > 0 ? 'up' : momentum < 0 ? 'down' : 'flat',
      trendDelta: momentum,
      handle: (p.social_handles && (p.social_handles.twitter || p.social_handles.instagram)) || '',
      lastActive: 'live',
      _raw: p,
      _isLive: true,
    };
  }

  function _wrap(data, opts) {
    return Object.assign({ data, error: null, isFallback: false, loading: false }, opts || {});
  }
  function _fallback(mockData, error) {
    if (CFG.DEBUG) console.warn('[polaris] usando datos demo:', error && error.message);
    return { data: mockData, error: error && error.message || 'unknown', isFallback: true, loading: false };
  }

  // FastAPI a veces devuelve { detail: "..." } incluso con status 200 — tratarlo como error
  function _isFastapiError(x) {
    return x && typeof x === 'object' && typeof x.detail === 'string' && !Array.isArray(x);
  }

  // === Loaders publicos ===

  async function loadPoliticians() {
    try {
      const rows = await api.getPoliticians();
      if (!Array.isArray(rows) || !rows.length) return _fallback(window.POLITICIANS_MOCK, new Error('lista vacia'));
      // Para cada politico, traer sus metrics en paralelo (best effort)
      const enriched = await Promise.all(rows.map(async (p) => {
        try {
          const det = await api.getPolitician(p.id);
          return _mapPolitician(det, det.metrics);
        } catch {
          return _mapPolitician(p, null);
        }
      }));
      return _wrap(enriched);
    } catch (err) {
      return _fallback(window.POLITICIANS_MOCK, err);
    }
  }

  async function loadPolitician(id) {
    if (!_isUuid(id)) {
      const m = (window.POLITICIANS_MOCK || []).find(p => p.id === id);
      return m ? _wrap(m) : _fallback(window.POLITICIANS_MOCK[0], new Error('not a real id'));
    }
    try {
      const det = await api.getPolitician(id);
      if (_isFastapiError(det)) {
        const m = (window.POLITICIANS_MOCK || [])[0];
        return _fallback(m, new Error(det.detail));
      }
      return _wrap(_mapPolitician(det, det.metrics));
    } catch (err) {
      const m = (window.POLITICIANS_MOCK || [])[0];
      return _fallback(m, err);
    }
  }

  async function loadPPI(id) {
    if (!_isUuid(id)) return _fallback(_mockPPI(id), new Error('not a real id'));
    try {
      const ppi = await api.getPPI(id);
      if (_isFastapiError(ppi)) return _fallback(_mockPPI(id), new Error(ppi.detail));
      return _wrap(ppi);
    } catch (err) {
      return _fallback(_mockPPI(id), err);
    }
  }

  function _mockPPI(id) {
    const m = (window.POLITICIANS_MOCK || []).find(p => p.id === id) || (window.POLITICIANS_MOCK || [])[0];
    return {
      politician_id: id,
      ppi: { score: m && m.sentiment, momentum: m && m.trendDelta, components: {} },
      sov_24h: 0,
      momentum: m && m.trendDelta || 0,
    };
  }

  async function loadSentimentBreakdown(id, opts) {
    if (!_isUuid(id)) return _fallback(_mockBreakdown(), new Error('not a real id'));
    try {
      const data = await api.getSentimentBreakdown(id, opts);
      if (_isFastapiError(data)) return _fallback(_mockBreakdown(), new Error(data.detail));
      return _wrap(data);
    } catch (err) {
      return _fallback(_mockBreakdown(), err);
    }
  }

  function _mockBreakdown() {
    return {
      breakdown: {
        positive: 88, negative: 20, neutral: 34, mixed: 0, unprocessed: 0,
        total: 142,
        pct: { positive: 62, negative: 14, neutral: 24, mixed: 0 },
      },
      window_days: 30, scope: 'all',
    };
  }

  function _mapAuthor(a) {
    const count = (typeof a.count === 'number') ? a.count : 0;
    const pctNeg = (typeof a.pct_negative === 'number') ? a.pct_negative : 0;
    const negative = (typeof a.negative === 'number') ? a.negative : 0;
    return {
      name: a.author || '—',
      handle: a.author || '',
      followers: '—',
      mentions: count,                         // shape nuevo
      volume: count,                           // legacy
      pctNegative: pctNeg,                     // shape nuevo
      negative: negative,
      intensity: pctNeg,                       // legacy
      platforms: Array.isArray(a.platforms) ? a.platforms : [],
      trend: 'stable',
      sample: `${count} menciones · ${pctNeg}% negativas`,
      suspicious: pctNeg > 70,
    };
  }

  async function loadTopAuthors(id, opts) {
    if (!_isUuid(id)) return _fallback(_mockTopAuthors(), new Error('not a real id'));
    try {
      const data = await api.getTopAuthors(id, opts);
      if (_isFastapiError(data)) return _fallback(_mockTopAuthors(), new Error(data.detail));
      // Aceptar tanto { authors: [...] } como [...] directo
      const list = Array.isArray(data) ? data
                 : (data && Array.isArray(data.authors)) ? data.authors
                 : [];
      const authors = list.map(_mapAuthor);
      return _wrap(authors);
    } catch (err) {
      return _fallback(_mockTopAuthors(), err);
    }
  }

  function _mockTopAuthors() { return window.TOP_CRITICS_MOCK || []; }

  async function loadMentions(opts) {
    const id = opts && opts.politician_id;
    if (id && !_isUuid(id)) return _fallback(_mockMentions(), new Error('not a real id'));
    try {
      const rows = await api.getMentions(opts);
      // Mappear al shape de FEED_ITEMS_MOCK (engagement, flags, time, etc)
      const items = (rows || []).map(r => _mapMention(r));
      return _wrap(items);
    } catch (err) {
      return _fallback(_mockMentions(), err);
    }
  }

  function _mockMentions() { return window.FEED_ITEMS_MOCK || []; }

  function _mapMention(r) {
    const platMap = {
      twitter_unofficial: 'X', twitter: 'X', twitter_reply: 'X',
      instagram: 'Instagram', instagram_comment: 'Instagram',
      tiktok: 'TikTok', tiktok_comment: 'TikTok',
      facebook: 'Facebook', facebook_comment: 'Facebook',
      youtube: 'YouTube', youtube_comment: 'YouTube',
      bluesky: 'Bluesky',
      reddit: 'X', newsdata: 'Web', wikipedia: 'Web',
      gdelt: 'Web', google_trends: 'Web', meta: 'Facebook',
    };
    const sentLabel = (r.sentiment_label || 'neu').slice(0, 3);
    const sent = sentLabel === 'pos' ? 'pos' : sentLabel === 'neg' ? 'neg' : 'neu';
    // Backend devuelve engagement nested en engagement_metrics (likes/retweets/replies)
    // Mantener fallback a campos flat por si algun endpoint legacy aun los expone.
    const em = r.engagement_metrics || {};
    return {
      id: r.id || r.external_id || Math.random().toString(36).slice(2),
      platform: platMap[r.platform] || 'X',
      user: r.author ? '@' + r.author : '@anon',
      handle: r.author || 'Anónimo',
      avatar: _initialsFor(r.author || 'A'),
      time: _relativeTime(r.published_at || r.collected_at),
      content: r.content || r.text || '(sin texto)',
      sentiment: sent,
      score: typeof r.sentiment_score === 'number' ? r.sentiment_score : 0,
      engagement: {
        likes: em.likes ?? r.engagement_likes ?? 0,
        replies: em.replies ?? em.comments ?? r.engagement_replies ?? 0,
        shares: em.retweets ?? em.reposts ?? em.shares ?? r.engagement_shares ?? 0,
      },
      reach: r.reach ? String(r.reach) : '—',
      flags: r.is_own_content ? ['organic', 'verified'] : ['organic'],
      _raw: r,
    };
  }

  function _relativeTime(iso) {
    if (!iso) return 'reciente';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'reciente';
    const diff = Date.now() - d.getTime();
    const m = Math.round(diff / 60000);
    if (m < 1) return 'hace segundos';
    if (m < 60) return `hace ${m} min`;
    const h = Math.round(m / 60);
    if (h < 24) return `hace ${h} h`;
    const dd = Math.round(h / 24);
    return `hace ${dd} d`;
  }

  async function loadTimeseries(id, opts) {
    if (!_isUuid(id)) return _fallback({ buckets: [] }, new Error('not a real id'));
    try {
      const data = await api.getTimeseries(id, opts);
      return _wrap(data);
    } catch (err) {
      return _fallback({ buckets: [] }, err);
    }
  }

  function _isUuid(s) {
    return typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  }

  // === Loaders nuevos del Día 3 Parte 2 (Tareas 4-6) ===

  async function loadFreshness(id) {
    if (!_isUuid(id)) return _fallback({ status: 'missing', hours_since_collection: null }, new Error('not a real id'));
    try {
      const data = await api.getFreshness(id);
      return _wrap(data);
    } catch (err) {
      return _fallback({ status: 'missing', hours_since_collection: null }, err);
    }
  }

  function _mapTopic(t) {
    const count = (typeof t.count === 'number') ? t.count : 0;
    const sentAvg = (typeof t.sentiment_avg === 'number') ? t.sentiment_avg : 0;
    return {
      name: t.topic || '—',
      topic: t.topic,                          // alias
      count: count,
      mentions: count,                         // alias para tabs que usan 'mentions'
      sentiment: sentAvg,
      sentiment_avg: sentAvg,
      delta: 0,                                // backend aún no provee trend pct
      trend: t.trend || 'stable',
    };
  }

  async function loadTopics(id, opts) {
    if (!_isUuid(id)) return _fallback([], new Error('not a real id'));
    try {
      const data = await api.getTopics(id, opts);
      if (_isFastapiError(data)) return _fallback([], new Error(data.detail));
      const list = Array.isArray(data) ? data
                 : (data && Array.isArray(data.topics)) ? data.topics
                 : [];
      const topics = list.map(_mapTopic);
      return _wrap(topics);
    } catch (err) {
      return _fallback([], err);
    }
  }

  async function loadCrisisSignals(id, opts) {
    const _emptyCrisis = { signals: [], hasActiveCrisis: false, signalCount: 0 };
    if (!_isUuid(id)) return _fallback(_emptyCrisis, new Error('not a real id'));
    try {
      const data = await api.getCrisisSignals(id, opts);
      if (_isFastapiError(data)) return _fallback(_emptyCrisis, new Error(data.detail));
      const signals = (data && Array.isArray(data.signals)) ? data.signals : [];
      return _wrap({
        signals: signals,
        hasActiveCrisis: !!(data && data.has_active_crisis),
        signalCount: (data && typeof data.signal_count === 'number') ? data.signal_count : signals.length,
      });
    } catch (err) {
      return _fallback(_emptyCrisis, err);
    }
  }

  async function loadCoordinationGroups(id, opts) {
    if (!_isUuid(id)) return _fallback({ groups: [] }, new Error('not a real id'));
    try {
      const data = await api.getCoordinationGroups(id, opts);
      return _wrap(data);
    } catch (err) {
      return _fallback({ groups: [] }, err);
    }
  }

  async function loadDailyBrief(id, dateStr) {
    if (!_isUuid(id)) return _fallback(null, new Error('not a real id'));
    try {
      const data = await api.getDailyBrief(id, dateStr);
      return _wrap(data);
    } catch (err) {
      return _fallback(null, err);
    }
  }

  // === API global expuesta a los componentes ===
  window.PolarisData = {
    loadPoliticians,
    loadPolitician,
    loadPPI,
    loadSentimentBreakdown,
    loadTopAuthors,
    loadMentions,
    loadTimeseries,
    // Día 3 Parte 2
    loadFreshness,
    loadTopics,
    loadCrisisSignals,
    loadCoordinationGroups,
    loadDailyBrief,
    isUuid: _isUuid,
  };

  // Estado global de fallback — los componentes hacen un suscribe/dispatch via
  // CustomEvent('polaris:fallback', {detail: {active: bool, error: string}}) y
  // el shell se encarga de mostrar el banner.
  window.PolarisFallback = {
    notify(active, error) {
      window.dispatchEvent(new CustomEvent('polaris:fallback', {
        detail: { active: !!active, error: error || null, ts: Date.now() },
      }));
    },
  };
})();
