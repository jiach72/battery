import React from 'react';

const trendIcons: Record<string, { arrow: string; label: string; color: string }> = {
  up: { arrow: '↑', label: '上升趋势', color: 'var(--console-success)' },
  down: { arrow: '↓', label: '下降趋势', color: 'var(--console-danger)' },
  flat: { arrow: '→', label: '持平', color: 'var(--console-text-soft)' },
};

interface ConsoleMetricTileProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'default' | 'positive' | 'warning' | 'danger';
  trend?: 'up' | 'down' | 'flat';
}

export default function ConsoleMetricTile({ label, value, hint, tone = 'default', trend }: ConsoleMetricTileProps) {
  const trendData = trend ? trendIcons[trend] : undefined;

  return (
    <article
      className={`console-metric console-metric--${tone}`}
      role="status"
      aria-label={`${label}: ${typeof value === 'string' || typeof value === 'number' ? value : ''}${hint ? `，${hint}` : ''}`}
      aria-live="polite"
    >
      <div className="console-metric__content">
        <p className="console-metric__label">{label}</p>
        <div className="console-metric__value">
          {value}
          {trendData ? (
            <span
              className="console-metric__trend"
              style={{ color: trendData.color }}
              aria-label={trendData.label}
            >
              {trendData.arrow}
            </span>
          ) : null}
        </div>
      </div>
      {hint ? <p className="console-metric__hint">{hint}</p> : null}
    </article>
  );
}
