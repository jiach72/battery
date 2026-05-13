import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../hooks/useTheme';

interface SeriesItem {
  name: string;
  data: number[];
  yAxisIndex?: number;
  type?: string;
  lineStyle?: { type?: string };
}

interface MultiAxisLineChartProps {
  title?: string;
  xData: string[];
  series: SeriesItem[];
  yAxes: { name: string; unit: string; min?: number; max?: number }[];
  height?: number;
}

export default function MultiAxisLineChart({ title, xData, series, yAxes, height = 350 }: MultiAxisLineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, isDark ? 'dark' : undefined);
    }

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: title ? { text: title, textStyle: { fontSize: 14 } } : undefined,
      tooltip: { trigger: 'axis' },
      legend: { data: series.map((s) => s.name), bottom: 0 },
      grid: { left: 60, right: yAxes.length > 1 ? 60 : 20, top: 40, bottom: 40 },
      xAxis: { type: 'category', data: xData },
      yAxis: yAxes.map((y, i) => ({
        type: 'value',
        name: `${y.name}(${y.unit})`,
        min: y.min,
        max: y.max,
        position: i === 0 ? 'left' : 'right',
      })),
      series: series.map((s) => ({
        name: s.name,
        type: s.type || 'line',
        yAxisIndex: s.yAxisIndex || 0,
        data: s.data,
        lineStyle: s.lineStyle,
        smooth: true,
      })) as echarts.SeriesOption[],
    };

    chartInstance.current.setOption(option, true);
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose(); chartInstance.current = null; };
  }, [xData, series, yAxes, isDark, title]);

  return <div ref={chartRef} style={{ height }} />;
}
