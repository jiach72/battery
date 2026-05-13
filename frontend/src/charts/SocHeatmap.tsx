import React from 'react';
import CellHeatmapGrid from './CellHeatmapGrid';
import { brandTokens } from '../styles/theme';

/** 模拟数据：8行 x 11列 = 88个电池单体 */
const mockData = Array.from({ length: 88 }, (_, index) => {
  const x = index % 11;
  const y = Math.floor(index / 11);
  const base = 74 - y * 4 + x * 1.6;
  const hotZone = (x >= 7 && x <= 9 && y >= 1 && y <= 3) ? -28 : 0;
  const coolZone = (x <= 2 && y >= 5) ? -14 : 0;
  return Math.max(18, Math.min(98, Math.round(base + hotZone + coolZone)));
});

export default function SocHeatmap({ height }: { height?: number }) {
  const cells = mockData.map((val, i) => ({
    cellId: `C${i + 1}`,
    value: val,
    label: `${Math.floor(i / 11) + 1}-${(i % 11) + 1}`,
  }));

  return (
    <CellHeatmapGrid
      cells={cells}
      cols={11}
      unit="%"
      min={0}
      max={100}
      title=""
      height={height}
      colors={['#43d19f', '#f0a33a', brandTokens.primary]}
    />
  );
}
