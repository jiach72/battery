import React from 'react';
import RealtimeCurveChart from './RealtimeCurveChart';
import { energyTokens, hexToRgba } from '../styles/theme';

export default function PowerCurveChart({ height = 300 }: { height?: number }) {
  const xData = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const rawPower = [0, 0, 0, 0, 0, 300, 300, 300, 300, -100, -100, -100, -100, -100, 0, 0, 0, 0, 300, 300, 300, 300, 0, 0];
  const mockSeries = [
    {
      name: '充电功率',
      data: rawPower.map((value) => value > 0 ? value : 0),
      type: 'line' as const,
      step: 'start' as const,
      color: energyTokens.electric,
      itemStyle: { color: energyTokens.electric },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: hexToRgba(energyTokens.electric, 0.28) },
            { offset: 1, color: hexToRgba(energyTokens.electric, 0.04) },
          ],
        },
      },
    },
    {
      name: '放电功率',
      data: rawPower.map((value) => value < 0 ? Math.abs(value) : 0),
      type: 'line' as const,
      step: 'start' as const,
      color: energyTokens.charge,
      itemStyle: { color: energyTokens.charge },
      lineStyle: { type: 'dashed' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: hexToRgba(energyTokens.charge, 0.24) },
            { offset: 1, color: hexToRgba(energyTokens.charge, 0.04) },
          ],
        },
      },
    },
  ];

  return (
    <div className="w-full h-full">
      <RealtimeCurveChart 
        title="" 
        xData={xData} 
        series={mockSeries} 
        unit="kW" 
        height={height}
      />
    </div>
  );
}
