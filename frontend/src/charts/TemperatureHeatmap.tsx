import React from 'react';
import CellHeatmapGrid from './CellHeatmapGrid';

interface TemperatureHeatmapProps {
  /** 温度数据 */
  data: [number, number, number][];
  /** X 轴标签 (单体编号) */
  xLabels: string[];
  /** Y 轴标签 (簇/行) */
  yLabels: string[];
  /** 高度 */
  height?: number;
}

/**
 * 温度分布热力图 — 使用电池单元格布局
 * data 格式: [xIndex, yIndex, temperature][]
 */
export default function TemperatureHeatmap({ data, xLabels, yLabels, height }: TemperatureHeatmapProps) {
  // 将 2D 热图数据转换为 CellData[]
  const cells = data.map(([xIdx, yIdx, temp]) => ({
    cellId: `${yLabels[yIdx]}-${xLabels[xIdx]}`,
    value: temp,
    label: xLabels[xIdx],
  }));

  return (
    <CellHeatmapGrid
      cells={cells}
      cols={xLabels.length}
      unit="℃"
      min={5}
      max={45}
      title=""
      height={height}
      colors={['#43d19f', '#f5b14a', '#ff7971']}
    />
  );
}
