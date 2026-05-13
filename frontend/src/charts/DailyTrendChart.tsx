import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../hooks/useTheme';
import { chartSeriesTokens, getChartTheme } from '../styles/theme';

interface DailyTrendChartProps {
  dates: string[];
  charge: number[];
  discharge: number[];
  height?: number;
}

/**
 * 近7日充放电趋势 — 双柱对比 + 折线叠加效率
 */
export default function DailyTrendChart({ dates, charge, discharge, height = 200 }: DailyTrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, isDark ? 'dark' : undefined);
    }

    const chartTheme = getChartTheme(isDark);

    // 计算效率
    const efficiency = charge.map((c, i) => (c > 0 ? Math.round((discharge[i] / c) * 10000) / 100 : 0));

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: chartTheme.tooltipBackground,
        borderColor: chartTheme.tooltipBorder,
        textStyle: { color: chartTheme.tooltipText, fontSize: 12 },
      },
      legend: { show: false },
      grid: { left: 46, right: 46, top: 16, bottom: 24 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: chartTheme.splitLine } },
        axisTick: { show: false },
        axisLabel: { color: chartTheme.axisText, fontSize: 10 },
      },
      yAxis: [
        {
          type: 'value',
          name: 'kWh',
          nameTextStyle: { color: chartTheme.axisText, fontSize: 10 },
          splitLine: { lineStyle: { color: chartTheme.splitLine, type: 'dashed' } },
          axisLabel: { color: chartTheme.axisText, fontSize: 10 },
        },
        {
          type: 'value',
          name: '效率%',
          nameTextStyle: { color: chartTheme.axisText, fontSize: 10 },
          min: 80,
          max: 100,
          splitLine: { show: false },
          axisLabel: { color: chartTheme.axisText, fontSize: 10, formatter: '{value}%' },
        },
      ],
      series: [
        {
          name: '充电',
          type: 'bar',
          data: charge,
          barWidth: 12,
          itemStyle: { color: chartSeriesTokens.secondary, borderRadius: [2, 2, 0, 0] },
        },
        {
          name: '放电',
          type: 'bar',
          data: discharge,
          barWidth: 12,
          itemStyle: { color: chartSeriesTokens.primary, borderRadius: [2, 2, 0, 0] },
        },
        {
          name: '效率',
          type: 'line',
          yAxisIndex: 1,
          data: efficiency,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { width: 1.5, color: chartSeriesTokens.tertiary, type: 'dashed' },
          itemStyle: { color: chartSeriesTokens.tertiary },
        },
      ],
    };

    chartInstance.current.setOption(option, true);
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose(); chartInstance.current = null; };
  }, [dates, charge, discharge, isDark]);

  return <div ref={chartRef} style={{ height }} />;
}
