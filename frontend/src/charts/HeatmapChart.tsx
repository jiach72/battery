import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../hooks/useTheme';
import { getChartTheme } from '../styles/theme';

const defaultColorRange = ['#43d19f', '#f5b14a', '#ff7971']; // 低风险(绿), 中风险(黄), 高风险(红)

interface HeatmapChartProps {
  title?: string;
  data: [number, number, number][];
  xLabels: string[];
  yLabels: string[];
  min?: number;
  max?: number;
  unit?: string;
  height?: number;
  colorRange?: string[];
  showLabels?: boolean;
  visualMapOrient?: 'horizontal' | 'vertical';
}

export default function HeatmapChart({
  title,
  data,
  xLabels,
  yLabels,
  min = 5,
  max = 45,
  unit = '℃',
  height = 300,
  colorRange = defaultColorRange,
  showLabels = false,
  visualMapOrient = 'horizontal',
}: HeatmapChartProps) {
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
        backgroundColor: chartTheme.tooltipBackground,
        borderColor: chartTheme.tooltipBorder,
        textStyle: { color: chartTheme.tooltipText, fontSize: 12 },
        formatter: (params) => {
          const point = params as unknown as { data: [number, number, number] };
          return `${yLabels[point.data[1]]} - ${xLabels[point.data[0]]}<br/>${unit === '℃' ? '温度' : '值'}: ${point.data[2]}${unit}`;
        },
      },
      grid: { left: 54, right: 18, top: 24, bottom: visualMapOrient === 'horizontal' ? 54 : 24 },
      xAxis: {
        type: 'category',
        data: xLabels,
        splitArea: { show: true },
        axisLabel: { fontSize: 11, color: chartTheme.axisText },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: yLabels,
        splitArea: { show: true },
        axisLabel: { fontSize: 11, color: chartTheme.axisText },
        axisTick: { show: false },
      },
      visualMap: {
        min,
        max,
        calculable: true,
        orient: visualMapOrient,
        right: visualMapOrient === 'vertical' ? 10 : undefined,
        left: visualMapOrient === 'horizontal' ? 'center' : undefined,
        bottom: visualMapOrient === 'horizontal' ? 0 : undefined,
        top: visualMapOrient === 'vertical' ? 'center' : undefined,
        inRange: {
          color: colorRange,
        },
      },
      series: [{
        type: 'heatmap',
        data,
        label: { show: showLabels, fontSize: 10, color: chartTheme.labelText },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
      }],
    };

    chartInstance.current.setOption(option, true);
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose(); chartInstance.current = null; };
  }, [data, xLabels, yLabels, min, max, unit, isDark, title, colorRange, showLabels, visualMapOrient]);

  return <div ref={chartRef} style={{ height }} />;
}
