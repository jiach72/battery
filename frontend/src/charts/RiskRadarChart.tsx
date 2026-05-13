import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../hooks/useTheme';
import type { RiskType, RiskLevel } from '../types/battery';
import { RISK_LABELS } from '../types/battery';
import { getChartTheme } from '../styles/theme';

interface RiskRadarChartProps {
  riskRadar: Record<RiskType, RiskLevel>;
  height?: number;
}

/* 风险等级→数值映射 (low=1, medium=2, high=3) */
const levelToValue: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };

/* 风险等级 -> 语义色 (ECharts 不支持 CSS 变量，使用硬编码 hex) */
const levelToColor: Record<RiskLevel, string> = {
  low: '#43d19f',
  medium: '#f5b14a',
  high: '#ff7971',
};

/* 风险等级 -> 软色 (用于区域填充) */
const levelToSoft: Record<RiskLevel, string> = {
  low: 'rgba(67, 209, 159, 0.18)',
  medium: 'rgba(245, 177, 74, 0.18)',
  high: 'rgba(255, 121, 113, 0.18)',
};

const RISK_KEYS: RiskType[] = ['capacity_risk', 'volt_risk', 'short_circuit_risk', 'temp_risk', 'liout_risk'];

/**
 * 5维风险雷达图 - 算法平台核心可视化
 * 将 5 个风险维度映射为雷达区域，直观展示整体风险分布
 */
export default function RiskRadarChart({ riskRadar, height = 220 }: RiskRadarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, isDark ? 'dark' : undefined);
    }

    const chartTheme = getChartTheme(isDark);

    /* 找最高风险等级，决定整体色调 */
    const values = RISK_KEYS.map((k) => levelToValue[riskRadar[k]]);
    const maxLevel = Math.max(...values);
    const riskLevel: RiskLevel = maxLevel >= 3 ? 'high' : maxLevel >= 2 ? 'medium' : 'low';
    const primaryColor = levelToColor[riskLevel];
    const primarySoft = levelToSoft[riskLevel];

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      radar: {
        indicator: RISK_KEYS.map((k) => ({ name: RISK_LABELS[k], max: 3 })),
        shape: 'polygon',
        radius: '68%',
        center: ['50%', '52%'],
        axisName: {
          color: chartTheme.axisText,
          fontSize: 11,
          fontWeight: 500,
        },
        splitNumber: 3,
        splitArea: {
          areaStyle: {
            color: [levelToSoft.low, levelToSoft.medium, levelToSoft.high],
          },
        },
        splitLine: { lineStyle: { color: chartTheme.splitLine } },
        axisLine: { lineStyle: { color: chartTheme.splitLine } },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: chartTheme.tooltipBackground,
        borderColor: chartTheme.tooltipBorder,
        textStyle: { color: chartTheme.tooltipText, fontSize: 12 },
        formatter: () => {
          const lines = RISK_KEYS.map((k) => {
            const level = riskRadar[k];
            const color = levelToColor[level];
            return `<span style="color:${color}">●</span> ${RISK_LABELS[k]}：${{ high: '高风险', medium: '中风险', low: '低风险' }[level]}`;
          });
          return lines.join('<br/>');
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: values,
              name: '风险等级',
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: { width: 2, color: primaryColor },
              itemStyle: { color: primaryColor },
              areaStyle: (() => {
                return {
                  color: {
                    type: 'radial',
                    x: 0.5,
                    y: 0.5,
                    r: 0.5,
                    colorStops: [
                      { offset: 0, color: primaryColor },
                      { offset: 1, color: primarySoft },
                    ],
                    global: false,
                  },
                };
              })(),
            },
          ],
        },
      ],
    };

    chartInstance.current.setOption(option, true);
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose(); chartInstance.current = null; };
  }, [riskRadar, isDark]);

  return <div ref={chartRef} style={{ height }} />;
}
