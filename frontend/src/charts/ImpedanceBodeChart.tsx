import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../hooks/useTheme';
import { chartSeriesTokens, getChartTheme } from '../styles/theme';

interface ImpedanceBodeChartProps {
  frequency: number[];
  magnitude: number[];
  phase: number[];
  height?: number;
}

export default function ImpedanceBodeChart({ frequency, magnitude, phase, height = 320 }: ImpedanceBodeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, isDark ? 'dark' : undefined);
    }
    const chartTheme = getChartTheme(isDark);

    chartInstance.current.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { color: chartTheme.axisText } },
      grid: { left: 54, right: 48, top: 20, bottom: 46 },
      xAxis: {
        type: 'category',
        data: frequency.map((value) => value.toFixed(1)),
        name: 'Frequency (Hz)',
        axisLabel: { color: chartTheme.axisText },
        splitLine: { lineStyle: { color: chartTheme.splitLine } },
      },
      yAxis: [
        { type: 'value', name: '|Z| (Ω)', axisLabel: { color: chartTheme.axisText }, splitLine: { lineStyle: { color: chartTheme.splitLine } } },
        { type: 'value', name: 'Phase (°)', axisLabel: { color: chartTheme.axisText }, splitLine: { lineStyle: { color: chartTheme.splitLine } } },
      ],
      series: [
        {
          name: '|Z|',
          type: 'line',
          data: magnitude,
          smooth: true,
          lineStyle: { color: chartSeriesTokens.primary, width: 2 },
          itemStyle: { color: chartSeriesTokens.primary },
        },
        {
          name: 'Phase',
          type: 'line',
          yAxisIndex: 1,
          data: phase,
          smooth: true,
          lineStyle: { color: chartSeriesTokens.tertiary, width: 2, type: 'dashed' },
          itemStyle: { color: chartSeriesTokens.tertiary },
        },
      ],
    }, true);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [frequency, magnitude, phase, isDark]);

  return <div ref={chartRef} style={{ height }} />;
}
