/* ============================================
   POLARIS — API Client
   Wrapper sobre fetch con retry + cache + timeout.
   Cada metodo devuelve Promise<rawData> (resuelve con
   los datos crudos del API o lanza Error si falla
   despues de MAX_RETRIES).

   Las funciones de alto nivel en data.js convierten
   el thrown error en {data: mock, isFallback: true}.
   ============================================ */

(function () {
  const CFG = window.POLARIS_CONFIG;
  if (!CFG) {
    console.error('[polaris] config.js debe cargarse antes que api-client.js');
    return;
  }

  // Cache en memoria: Map<cacheKey, {data, ts}>
  const _cache = new Map();

  function _cacheGet(key) {
    const entry = _cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CFG.CACHE_TTL_MS) {
      _cache.delete(key);
      return null;
    }
    return entry.data;
  }

  function _cacheSet(key, data) {
    _cache.set(key, { data, ts: Date.now() });
  }

  function _cacheClear() {
    _cache.clear();
  }

  function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function _log(...args) { if (CFG.DEBUG) console.log('[polaris]', ...args); }

  /**
   * Llama al API con retry + timeout + cache (GET).
   * @param {string} path  ej: '/api/v1/politicians'
   * @param {object} params  query params opcionales
   * @returns {Promise<any>} datos crudos del API
   */
  async function request(path, params) {
    const url = CFG.url(path, params);
    const cached = _cacheGet(url);
    if (cached) {
      _log('cache hit', url);
      return cached;
    }
    let lastError = null;
    for (let attempt = 0; attempt < CFG.MAX_RETRIES; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), CFG.REQUEST_TIMEOUT_MS);
      try {
        _log('GET', url, attempt > 0 ? `(retry ${attempt})` : '');
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!res.ok) {
          // 4xx: no reintentamos (mal request del cliente)
          if (res.status >= 400 && res.status < 500) {
            const text = await res.text().catch(() => '');
            throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
          }
          // 5xx: reintentamos
          throw new Error(`API ${res.status} server error`);
        }
        const data = await res.json();
        _cacheSet(url, data);
        return data;
      } catch (err) {
        clearTimeout(timer);
        lastError = err;
        const isAbort = err && err.name === 'AbortError';
        const isClient = err && /API 4\d\d/.test(String(err.message));
        if (isClient) break;
        if (attempt < CFG.MAX_RETRIES - 1) {
          const backoff = Math.pow(2, attempt) * 1000;
          _log(isAbort ? 'timeout' : 'error', '→ backoff', backoff, 'ms');
          await _sleep(backoff);
        }
      }
    }
    throw lastError || new Error('Request failed');
  }

  // === Endpoints expuestos ===

  async function getPoliticians() {
    return request('/api/v1/politicians');
  }

  async function getPolitician(id) {
    return request(`/api/v1/politicians/${encodeURIComponent(id)}`);
  }

  async function getSentimentBreakdown(id, opts) {
    const params = {
      days: opts && opts.days,
      scope: opts && opts.scope,
    };
    return request(`/api/v1/politicians/${encodeURIComponent(id)}/sentiment-breakdown`, params);
  }

  async function getTopAuthors(id, opts) {
    const params = {
      days: opts && opts.days,
      scope: opts && opts.scope,
      limit: opts && opts.limit,
    };
    return request(`/api/v1/politicians/${encodeURIComponent(id)}/top-authors`, params);
  }

  async function getMentions(opts) {
    const params = {
      politician_id: opts && opts.politician_id,
      platform: opts && opts.platform,
      is_own_content: opts && opts.is_own_content,
      has_parent: opts && opts.has_parent,
      parent_external_id: opts && opts.parent_external_id,
      limit: (opts && opts.limit) || 50,
      offset: (opts && opts.offset) || 0,
    };
    return request('/api/v1/mentions', params);
  }

  async function getPPI(id) {
    return request(`/api/v1/metrics/ppi/${encodeURIComponent(id)}`);
  }

  async function getTimeseries(id, opts) {
    const params = {
      politician_id: id,
      interval: (opts && opts.interval) || 'day',
      days: (opts && opts.days) || 7,
    };
    return request('/api/v1/metrics/timeseries', params);
  }

  async function healthCheck() {
    return request('/health');
  }

  // === Endpoints nuevos del Día 3 Parte 2 (Tareas 4-6) ===

  async function getFreshness(id) {
    return request(`/api/v1/politicians/${encodeURIComponent(id)}/freshness`);
  }

  async function getTopics(id, opts) {
    const params = { days: opts && opts.days };
    return request(`/api/v1/politicians/${encodeURIComponent(id)}/topics`, params);
  }

  async function getCrisisSignals(id, opts) {
    const params = { hours: opts && opts.hours };
    return request(`/api/v1/politicians/${encodeURIComponent(id)}/crisis-signals`, params);
  }

  async function getCoordinationGroups(id, opts) {
    const params = {
      active_only: opts && opts.active_only,
      limit: opts && opts.limit,
    };
    return request(`/api/v1/politicians/${encodeURIComponent(id)}/coordination-groups`, params);
  }

  async function getDailyBrief(id, dateStr) {
    const params = dateStr ? { date: dateStr } : undefined;
    return request(`/api/v1/politicians/${encodeURIComponent(id)}/daily-brief`, params);
  }

  window.apiClient = {
    request,
    getPoliticians,
    getPolitician,
    getSentimentBreakdown,
    getTopAuthors,
    getMentions,
    getPPI,
    getTimeseries,
    healthCheck,
    // Día 3 Parte 2
    getFreshness,
    getTopics,
    getCrisisSignals,
    getCoordinationGroups,
    getDailyBrief,
    cacheClear: _cacheClear,
  };
})();
