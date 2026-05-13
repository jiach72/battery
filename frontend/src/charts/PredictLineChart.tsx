import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../hooks/useTheme';
import { chartSeriesTokens, getChartTheme } from '../styles/theme';

interface PredictLineChartProps {
  title?: string;
  xData: string[];
  actual: { name: string; data: number[] }[];
  predicted: { name: string; data: number[] }[];
  unit?: string;
  height?: number;
}

export default function PredictLineChart({ title, xData, actual, predicted, unit = '', height = 300 }: PredictLineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, isDark ? 'dark' : undefined);
    }
    const chartTheme = getChartTheme(isDark);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: title ? { text: title, textStyle: { fontSize: 14, color: chartTheme.titleText } } : undefined,
      tooltip: {
        trigger: 'axis',
        backgroundColor: chartTheme.tooltipBackground,
        borderColor: chartTheme.tooltipBorder,
        textStyle: { color: chartTheme.tooltipText, fontSize: 12 },
      },
      legend: { bottom: 0, textStyle: { color: chartTheme.axisText } },
      grid: { left: 60, right: 20, top: 40, bottom: 40 },
      xAxis: { type: 'category', data: xData, axisLabel: { color: chartTheme.axisText }, axisLine: { lineStyle: { color: chartTheme.splitLine } } },
      yAxis: { type: 'value', name: unit, axisLabel: { color: chartTheme.axisText }, nameTextStyle: { color: chartTheme.axisText }, splitLine: { lineStyle: { color: chartTheme.splitLine, type: 'dashed' } } },
      series: [
        ...actual.map((a, index) => ({
          name: a.name,
          type: 'line' as const,
          data: a.data,
          smooth: true,
          lineStyle: { type: 'solid' as const, color: index === 0 ? chartSeriesTokens.primary : chartSeriesTokens.secondary },
          itemStyle: { color: index === 0 ? chartSeriesTokens.primary : chartSeriesTokens.secondary },
        })),
        ...predicted.map((p) => ({
          name: p.name,
          type: 'line' as const,
          data: p.data,
          smooth: true,
          lineStyle: { type: 'dashed' as const, color: chartSeriesTokens.tertiary },
          itemStyle: { color: chartSeriesTokens.tertiary },
        })),
      ],
    };

    chartInstance.current.setOption(option, true);
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose(); chartInstance.current = null; };
  }, [xData, actual, predicted, unit, isDark, title]);

  return <div ref={chartRef} style={{ height }} />;
}
