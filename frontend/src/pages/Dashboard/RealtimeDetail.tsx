import React, { useEffect, useMemo } from 'react';
import { Tabs } from 'antd';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRealtimeClusters } from '../../store/slices/dashboardSlice';
import RealtimeCurveChart from '../../charts/RealtimeCurveChart';
import TemperatureHeatmap from '../../charts/TemperatureHeatmap';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import PageEmpty from '../../components/PageEmpty';
import { chartSeriesTokens } from '../../styles/theme';

const FALLBACK_TIME_LABELS = Array.from({ length: 60 }, (_, i) => `${i}m`);
const FALLBACK_VOLTAGE = Array.from({ length: 60 }, (_, i) => 3.22 + (i % 12) * 0.006 + Math.sin(i / 6) * 0.012);
const FALLBACK_CURRENT = Array.from({ length: 60 }, (_, i) => 46 + (i % 10) * 1.4 + Math.cos(i / 8) * 2.5);
const FALLBACK_SOC = Array.from({ length: 60 }, (_, i) => 52 + (i % 18) * 1.2 - Math.max(0, i - 36) * 0.22);
const FALLBACK_CLUSTER_LABELS = Array.from({ length: 4 }, (_, i) => `簇${i + 1}`);

export default function RealtimeDetail() {
  const dispatch = useAppDispatch();
  const { realtimeClusters, selectedStation, error } = useAppSelector((s) => s.dashboard);

  useEffect(() => {
    dispatch(fetchRealtimeClusters(selectedStation));
  }, [dispatch, selectedStation]);

  const retry = () => dispatch(fetchRealtimeClusters(selectedStation));
  const hasRealData = realtimeClusters && realtimeClusters.length > 0 && realtimeClusters[0].cells?.length > 0;

  const { xData, voltage, current, soc } = useMemo(() => {
    if (!hasRealData) {
      return { xData: FALLBACK_TIME_LABELS, voltage: FALLBACK_VOLTAGE, current: FALLBACK_CURRENT, soc: FALLBACK_SOC };
    }
    const cells = realtimeClusters[0].cells;
    return {
      xData: cells.map((c) => c.timestamp?.slice(11, 19) || `${c.cellNo}`),
      voltage: cells.map((c) => c.voltage),
      current: cells.map((c) => c.current),
      soc: cells.map((c) => c.soc),
    };
  }, [realtimeClusters, hasRealData]);

  const heatmapData: [number, number, number][] = useMemo(() => {
    if (!hasRealData) {
      const data: [number, number, number][] = [];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 26; j++) {
          const base = 26 + i * 2.2 + j * 0.28;
          const hotspot = i === 1 && j >= 10 && j <= 15 ? 7.6 : 0;
          const coolBand = i === 3 && j >= 18 ? -3.8 : 0;
          data.push([j, i, Math.round((base + hotspot + coolBand) * 10) / 10]);
        }
      }
      return data;
    }
    const data: [number, number, number][] = [];
    realtimeClusters.forEach((cluster, ci) => {
      cluster.cells.forEach((cell) => {
        data.push([cell.cellNo - 1, ci, cell.temperature]);
      });
    });
    return data;
  }, [realtimeClusters, hasRealData]);

  const heatmapYLabels = hasRealData
    ? realtimeClusters.map((c) => `簇${c.clusterNo}`)
    : FALLBACK_CLUSTER_LABELS;

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={retry} />;
  }

  return (
    <div className="space-y-4">
      <ConsolePageHeader
        title="实时工况监测"
        subtitle="统一查看电压、电流、SOC 对比趋势和簇级温度热点，快速定位运行异常。"
        actions={
          <div className="console-status-pill">
            <span className="console-status-pill__label">
              <span className="console-status-pill__dot console-status-pill__dot--accent" />
              覆盖电池簇
            </span>
            <span className="console-status-pill__value">{heatmapYLabels.length} 组</span>
          </div>
        }
      />

      <Tabs items={[
        {
          key: 'curves',
          label: '运行对比曲线',
          children: (
            <ConsolePanel title="运行对比曲线" subtitle="同一时窗对照电压、电流和 SOC 的运行走势。">
              <div className="console-chart-frame">
                <RealtimeCurveChart
                  title="电压/电流/SOC 实时对比"
                  xData={xData}
                  series={[
                    { name: '电压(V)', data: voltage, color: chartSeriesTokens.primary },
                    { name: '电流(A)', data: current, color: chartSeriesTokens.secondary },
                    { name: 'SOC(%)', data: soc, color: chartSeriesTokens.tertiary },
                  ]}
                  height={400}
                />
              </div>
            </ConsolePanel>
          ),
        },
        {
          key: 'heatmap',
          label: '温度热点图',
          children: (
            <ConsolePanel title="温度热点图" subtitle="按簇和单体位置查看当前温度分布与热点集中区。">
              <div className="console-chart-frame">
                <TemperatureHeatmap
                  data={heatmapData}
                  xLabels={Array.from({ length: 26 }, (_, i) => `C${i + 1}`)}
                  yLabels={heatmapYLabels}
                  height={350}
                />
              </div>
            </ConsolePanel>
          ),
        },
      ]} />
    </div>
  );
}
