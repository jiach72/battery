import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../hooks/useTheme';
import { getChartTheme, chartSeriesTokens } from '../styles/theme';

interface ImpedanceNyquistChartProps {
  real: number[];
  imag: number[];
  height?: number;
}

export default function ImpedanceNyquistChart({ real, imag, height = 320 }: ImpedanceNyquistChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, isDark ? 'dark' : undefined);
    }
    const chartTheme = getChartTheme(isDark);
    const data = real.map((value, index) => [value, imag[index] ?? 0]);

    chartInstance.current.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' },
      grid: { left: 48, right: 20, top: 20, bottom: 36 },
      xAxis: { type: 'value', name: "Z' (Ω)", axisLabel: { color: chartTheme.axisText }, splitLine: { lineStyle: { color: chartTheme.splitLine } } },
      yAxis: { type: 'value', name: "Z'' (Ω)", axisLabel: { color: chartTheme.axisText }, splitLine: { lineStyle: { color: chartTheme.splitLine } } },
      series: [{
        type: 'line',
        data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, color: chartSeriesTokens.primary },
        itemStyle: { color: chartSeriesTokens.primary },
        areaStyle: { opacity: 0.08 },
      }],
    }, true);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [real, imag, isDark]);

  return <div ref={chartRef} style={{ height }} />;
}
