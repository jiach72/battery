import React from 'react';
import { Tag } from 'antd';
import type { Severity } from '../types/alarm';
import { getRiskTone } from '../styles/theme';

const normalizeSeverity = (severity: string): Severity => {
  const normalized = severity.toLowerCase();
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized;
  }
  return 'low';
};

interface RiskBadgeProps {
  severity: Severity;
  showText?: boolean;
}

export default function RiskBadge({ severity, showText = true }: RiskBadgeProps) {
  const normalized = normalizeSeverity(severity);
  const config = getRiskTone(normalized);

  return (
    <Tag
      className="m-0 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      aria-label={`风险等级: ${config.text}`}
      role="status"
      style={{
        backgroundColor: 'var(--console-bg-soft)',
        color: config.color,
        borderColor: config.strong,
        borderStyle: 'solid',
        borderWidth: 1,
        boxShadow: `0 0 0 1px ${config.soft}`,
      }}
    >
      {showText ? config.text : normalized.toUpperCase()}
    </Tag>
  );
}
