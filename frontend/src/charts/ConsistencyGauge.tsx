import React from 'react';
import { Progress, Tooltip } from 'antd';
import { getRiskTone } from '../styles/theme';

interface ConsistencyGaugeProps {
  /** 一致性综合得分 0~100 */
  score: number;
  /** 电压极差 mV */
  voltDiffMax: number;
  /** 电压标准差 */
  voltStd: number;
  /** 温度极差 ℃ */
  tempDiffMax: number;
  /** 最高单体温度 ℃ */
  cellMaxTemp: number;
  /** SOC偏差 % */
  socDeviation: number;
}

const getThresholdTone = (value: number, goodThreshold: number, warningThreshold: number) => {
  if (value <= goodThreshold) {
    return getRiskTone('low').color;
  }

  if (value <= warningThreshold) {
    return getRiskTone('medium').color;
  }

  return getRiskTone('high').color;
};

/**
 * 一致性仪表盘 - 算法平台核心指标
 * 展示电芯一致性综合得分 + 5 项子指标
 */
export default function ConsistencyGauge({
  score, voltDiffMax, voltStd, tempDiffMax, cellMaxTemp, socDeviation,
}: ConsistencyGaugeProps) {
  const scoreColor = score >= 85 ? getRiskTone('low').color : score >= 70 ? getRiskTone('medium').color : getRiskTone('high').color;
  const labelCls = 'text-[12px] font-medium text-[var(--console-text-soft)]';
  const valueCls = 'inline-flex items-baseline gap-1 text-[13px] font-semibold tabular-nums';

  const items = [
    { label: '电压极差', value: voltDiffMax, unit: 'mV', warn1: 50, warn2: 100 },
    { label: '电压标准差', value: voltStd, unit: '', warn1: 15, warn2: 30 },
    { label: '温度极差', value: tempDiffMax, unit: '℃', warn1: 3, warn2: 5 },
    { label: '最高温度', value: cellMaxTemp, unit: '℃', warn1: 40, warn2: 45 },
    { label: 'SOC偏差', value: socDeviation, unit: '%', warn1: 3, warn2: 5 },
  ];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className={labelCls}>一致性综合得分</span>
        <span className="text-[15px] font-semibold tabular-nums" style={{ color: scoreColor }}>{score}</span>
      </div>
      <Progress
        percent={score}
        showInfo={false}
        strokeColor={scoreColor}
        trailColor="var(--console-border-subtle)"
        size="small"
      />

      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between gap-3 py-0.5">
            <span className={labelCls}>{it.label}</span>
            <Tooltip title={it.warn1 === 40 ? `正常<${it.warn1}${it.unit}  警告>${it.warn2}${it.unit}` : `正常≤${it.warn1}${it.unit}  警告≤${it.warn2}${it.unit}`}>
              <span className={valueCls} style={{ color: getThresholdTone(it.value, it.warn1, it.warn2) }}>
                <span>{typeof it.value === 'number' ? it.value.toLocaleString() : it.value}</span>
                {it.unit ? <span className="text-[11px] font-medium text-[var(--console-text-soft)]">{it.unit}</span> : null}
              </span>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
}
