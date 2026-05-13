import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../hooks/useTheme';
import { chartSeriesTokens, getChartTheme } from '../styles/theme';

interface RealtimeCurveChartProps {
  title?: string;
  xData: string[];
  series: { name: string; data: number[]; color?: string; type?: string; step?: false | 'start' | 'middle' | 'end'; areaStyle?: Record<string, unknown>; itemStyle?: { color?: string }; lineStyle?: Record<string, unknown> }[];
  unit?: string;
  height?: number;
}

export default function RealtimeCurveChart({ title, xData, series, unit = '', height = 350 }: RealtimeCurveChartProps) {
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
        valueFormatter: (value) => `${Number(value).toLocaleString('zh-CN')}${unit ? ` ${unit}` : ''}`,
      },
      legend: { data: series.map((s) => s.name), bottom: 0, type: 'scroll', textStyle: { color: chartTheme.axisText } },
      grid: { left: 56, right: 18, top: 24, bottom: 52 },
      xAxis: { type: 'category', data: xData, axisTick: { show: false }, axisLabel: { color: chartTheme.axisText }, axisLine: { lineStyle: { color: chartTheme.splitLine } } },
      yAxis: { type: 'value', name: unit, nameTextStyle: { color: chartTheme.axisText }, axisLabel: { color: chartTheme.axisText }, splitLine: { lineStyle: { color: chartTheme.splitLine, opacity: 0.6, type: 'dashed' } } },
      series: series.map((s, index) => ({
        name: s.name,
        type: 'line',
        data: s.data,
        smooth: !s.step,
        step: s.step,
        showSymbol: false,
        lineStyle: { width: 1.5, color: s.color ?? [chartSeriesTokens.primary, chartSeriesTokens.secondary, chartSeriesTokens.tertiary][index % 3], ...(s.lineStyle || {}) },
        itemStyle: s.itemStyle ?? { color: s.color ?? [chartSeriesTokens.primary, chartSeriesTokens.secondary, chartSeriesTokens.tertiary][index % 3] },
        areaStyle: s.areaStyle,
      })),
      dataZoom: [{ type: 'inside' }],
    };

    chartInstance.current.setOption(option, true);
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose(); chartInstance.current = null; };
  }, [xData, series, unit, isDark, title]);

  return <div ref={chartRef} style={{ height }} />;
}
