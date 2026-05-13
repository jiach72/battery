import React, { useMemo } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../hooks/useTheme';
import { chartSeriesTokens, getChartTheme, hexToRgba } from '../styles/theme';
import ChartWrapper from '../components/ChartWrapper';

interface SohTrendChartProps {
  dates: string[];
  actual: number[];
  predicted: number[];
  height?: number;
}

/**
 * SOH衰减趋势图 — 预测线强制dashed（PRD §4.2 图表渲染强规则）
 */
export default function SohTrendChart({ dates, actual, predicted, height = 200 }: SohTrendChartProps) {
  const { isDark } = useTheme();

  const option: echarts.EChartsOption = useMemo(() => {
    const chartTheme = getChartTheme(isDark);
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: chartTheme.tooltipBackground,
        borderColor: chartTheme.tooltipBorder,
        borderRadius: chartTheme.tooltipRadius,
        textStyle: { color: chartTheme.tooltipText, fontSize: 12 },
        valueFormatter: (value) => `${Number(value).toFixed(1)}%`,
      },
      legend: { show: false },
      grid: { left: 42, right: 12, top: 12, bottom: 24 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: chartTheme.splitLine } },
        axisTick: { show: false },
        axisLabel: { color: chartTheme.axisText, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        min: (value: { min: number }) => Math.floor(value.min - 2),
        max: 100,
        splitLine: { lineStyle: { color: chartTheme.splitLine, type: 'dashed' } },
        axisLabel: { color: chartTheme.axisText, fontSize: 10, formatter: '{value}%' },
      },
      series: [
        {
          name: '实际SOH',
          type: 'line',
          data: actual,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { width: 2, type: 'solid', color: chartSeriesTokens.primary },
          itemStyle: { color: chartSeriesTokens.primary },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: hexToRgba(chartSeriesTokens.primary, 0.15) },
              { offset: 1, color: hexToRgba(chartSeriesTokens.primary, 0.02) },
            ]),
          },
        },
        {
          name: '预测SOH',
          type: 'line',
          data: predicted,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 4,
          /* ⚡ PRD强制：预测衰减系列必须 dashed */
          lineStyle: { width: 2, type: 'dashed', color: chartSeriesTokens.tertiary },
          itemStyle: { color: chartSeriesTokens.tertiary },
        },
      ],
    };
  }, [dates, actual, predicted, isDark]);

  return <ChartWrapper option={option} height={height} aria-label="SOH衰减趋势" />;
}
