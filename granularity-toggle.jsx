/* ============================================
   POLARIS — GranularityToggle
   3 pills [Mes][Semana][Día] que persiste eleccion
   en localStorage 'polaris_granularity' y emite
   CustomEvent('polaris:granularity-change') con
   detail.value = 'month'|'week'|'day'.
   ============================================ */

const _GRANULARITIES = [
  { key: 'month', label: 'Mes' },
  { key: 'week',  label: 'Semana' },
  { key: 'day',   label: 'Día' },
];

function _readGranularity() {
  try {
    const v = localStorage.getItem('polaris_granularity');
    if (v && _GRANULARITIES.find(g => g.key === v)) return v;
  } catch {}
  return 'day';
}

function _writeGranularity(v) {
  try { localStorage.setItem('polaris_granularity', v); } catch {}
}

function GranularityToggle({ value, onChange }) {
  // Si el caller no pasa value/onChange, manejamos estado interno
  const [internal, setInternal] = React.useState(() => _readGranularity());
  const current = value !== undefined ? value : internal;

  const handle = (v) => {
    if (onChange) onChange(v);
    if (value === undefined) setInternal(v);
    _writeGranularity(v);
    window.dispatchEvent(new CustomEvent('polaris:granularity-change', { detail: { value: v } }));
  };

  return (
    <div
      role="tablist"
      aria-label="Granularidad temporal"
      className="flex items-c gap-1"
      style={{
        padding: 3,
        background: 'var(--bg-2)',
        border: '1px solid var(--line-1)',
        borderRadius: 999,
        flexShrink: 0,
      }}
    >
      {_GRANULARITIES.map(g => (
        <button
          key={g.key}
          role="tab"
          aria-selected={current === g.key}
          onClick={() => handle(g.key)}
          className="mono"
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: current === g.key ? 'var(--text-1)' : 'var(--text-3)',
            background: current === g.key ? 'var(--bg-3)' : 'transparent',
            border: current === g.key ? '1px solid var(--line-2)' : '1px solid transparent',
            transition: 'all 160ms var(--ease)',
            cursor: 'pointer',
          }}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}

window.GranularityToggle = GranularityToggle;
window._readGranularity = _readGranularity;
