import React from 'react';
import { Tag } from 'antd';
import { WarningOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { DegradationItem } from '../types/battery';
import { RISK_LABELS } from '../types/battery';
import { getRiskTone } from '../styles/theme';

interface Top5DegradationProps {
  items: DegradationItem[];
}

/**
 * 衰减最严重 TOP5 列表 - 诊断总览下钻入口
 * 每条可点击进入诊断中心详情
 */
export default function Top5Degradation({ items }: Top5DegradationProps) {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/clinic/overview');
  };

  if (!items || items.length === 0) {
    return (
      <div className="console-empty-state py-6 text-sm">
        <WarningOutlined className="mb-1 text-xl" />
        <div className="text-[13px]">暂无衰减数据</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={item.deviceId}
          className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-[var(--console-row-hover)]"
          onClick={handleNavigate}
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-semibold"
            style={{
              backgroundColor: idx < 2 ? getRiskTone('high').soft : 'var(--console-bg-soft)',
              color: idx < 2 ? getRiskTone('high').color : 'var(--console-text-soft)',
            }}
          >
            {idx + 1}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-[13px] font-semibold text-[var(--console-title)]">
                {item.deviceName}
              </span>
              <Tag
                className="m-0 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-[18px]"
                style={{
                  backgroundColor: getRiskTone(item.riskLevel).soft,
                  color: getRiskTone(item.riskLevel).color,
                  borderColor: getRiskTone(item.riskLevel).strong,
                  borderStyle: 'solid',
                  borderWidth: 1,
                }}
              >
                {RISK_LABELS[item.primaryRisk]}
              </Tag>
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px] text-[var(--console-text-soft)]">
              <span>SOH</span>
              <span className="text-[13px] font-semibold tabular-nums" style={{ color: getRiskTone(item.riskLevel).color }}>
                {item.soh}%
              </span>
              <span className="tabular-nums">理论 {item.theorySoh}%</span>
              <span className="font-medium tabular-nums" style={{ color: getRiskTone('high').color }}>
                ↓{item.gap.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      ))}

      <div
        className="console-link-action flex cursor-pointer items-center justify-center gap-1 border-t border-[color:var(--console-border-subtle)] pt-2 text-sm"
        onClick={handleNavigate}
      >
        <span>进入问诊室</span>
        <ArrowRightOutlined style={{ fontSize: 10 }} />
      </div>
    </div>
  );
}
