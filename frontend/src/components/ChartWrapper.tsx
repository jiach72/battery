import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../hooks/useTheme';

interface ChartWrapperProps {
  option: echarts.EChartsOption;
  height?: number;
  loading?: boolean;
  'aria-label'?: string;
  className?: string;
}

const ChartWrapper = forwardRef<echarts.ECharts | null, ChartWrapperProps>(
  ({ option, height = 300, loading = false, 'aria-label': ariaLabel, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<echarts.ECharts | null>(null);
    const { isDark } = useTheme();

    useImperativeHandle(ref, () => chartRef.current as echarts.ECharts);

    useEffect(() => {
      if (!containerRef.current) return;
      const chart = echarts.init(containerRef.current, isDark ? 'dark' : undefined);
      chartRef.current = chart;

      const handleResize = () => chart.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.dispose();
        chartRef.current = null;
      };
    }, [isDark]);

    useEffect(() => {
      const chart = chartRef.current;
      if (!chart) return;
      chart.setOption(option, true);
      if (loading) chart.showLoading();
      else chart.hideLoading();
    }, [option, loading]);

    return (
      <div
        ref={containerRef}
        role="img"
        aria-label={ariaLabel || '数据图表'}
        className={className}
        style={{ width: '100%', height }}
      />
    );
  }
);

ChartWrapper.displayName = 'ChartWrapper';
export default ChartWrapper;
