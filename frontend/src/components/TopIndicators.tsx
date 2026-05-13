import React from 'react';
import { useAppSelector } from '../store/hooks';
import ConsoleMetricTile from './console/ConsoleMetricTile';

interface TopIndicatorsData {
  totalDays?: number;
  dailyCharge?: number;
  dailyDischarge?: number;
  totalCapacity?: number;
  realTimePower?: number;
  ratedPower?: number;
}

interface TopIndicatorsProps {
  data?: TopIndicatorsData;
}

export default function TopIndicators({ data }: TopIndicatorsProps) {
  const { overview } = useAppSelector((s) => s.dashboard);

  const formatMetricValue = (value: number) => (
    Number.isInteger(value)
      ? value.toLocaleString('zh-CN')
      : value.toLocaleString('zh-CN', { maximumFractionDigits: 1 })
  );
  
  const totalDays = data?.totalDays ?? overview?.totalDays ?? overview?.usedRecycleTimes ?? 98;
  const chargeToday = data?.dailyCharge ?? overview?.dailyCharge ?? 205;
  const dischargeToday = data?.dailyDischarge ?? overview?.dailyDischarge ?? 204.6;
  const ratedPower = data?.ratedPower ?? 512;
  const totalCapacity = data?.totalCapacity ?? overview?.totalCapacity ?? 1024;
  const realTimePower = data?.realTimePower ?? 300;

  const indicators = [
    {
      title: '当日总充电电量',
      value: chargeToday,
      unit: 'MWh',
      hint: '当日峰谷套利充电总量',
      tone: 'positive' as const,
    },
    {
      title: '当日总放电电量',
      value: dischargeToday,
      unit: 'MWh',
      hint: '当前日放电任务完成情况',
      tone: 'positive' as const,
    },
    {
      title: '电站额定功率',
      value: ratedPower,
      unit: 'kW',
      hint: '当前控制策略的功率上限',
      tone: 'default' as const,
    },
    {
      title: '总装机容量',
      value: totalCapacity,
      unit: 'kWh',
      hint: '站级可用容量基线',
      tone: 'default' as const,
    },
    {
      title: '实时功率',
      value: realTimePower,
      unit: 'kW',
      hint: '当前控制指令实时功率',
      tone: Math.abs(realTimePower) > ratedPower * 0.75 ? 'warning' as const : 'default' as const,
    },
    {
      title: '累计运行天数',
      value: totalDays,
      unit: '天',
      hint: '反映当前设备生命周期阶段',
      tone: 'default' as const,
    },
  ];

  const primaryIndicators = indicators.slice(0, 3);
  const secondaryIndicators = indicators.slice(3);

  return (
    <section className="console-kpi-stack" role="group" aria-label="关键指标">
      <div className="console-grid-hero" role="list">
        {primaryIndicators.map((item) => (
          <div key={item.title} data-span="4" role="listitem">
            <ConsoleMetricTile
              label={item.title}
              value={(
                <span className="inline-flex items-end gap-1.5 leading-none">
                  <span>{formatMetricValue(item.value)}</span>
                  <span className="pb-1 text-[13px] font-medium text-[var(--console-text-soft)]">{item.unit}</span>
                </span>
              )}
              hint={item.hint}
              tone={item.tone}
            />
          </div>
        ))}
      </div>

      <div className="console-kpi-rail" role="list">
        {secondaryIndicators.map((item) => (
          <article key={item.title} className={`console-kpi-mini console-kpi-mini--${item.tone}`} role="listitem" aria-label={`${item.title}: ${formatMetricValue(item.value)} ${item.unit}`}>
            <div className="console-kpi-mini__label">{item.title}</div>
            <div className="console-kpi-mini__value">
              {formatMetricValue(item.value)}
              <span className="console-kpi-mini__unit">{item.unit}</span>
            </div>
            <div className="console-kpi-mini__hint">{item.hint}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
