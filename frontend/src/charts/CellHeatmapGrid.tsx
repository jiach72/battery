import React, { useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { hexToRgba } from '../styles/theme';

export interface CellData {
  cellId: string;
  value: number;
  label?: string;
}

interface CellHeatmapGridProps {
  /** 电池单体数据 */
  cells: CellData[];
  /** 每行单元格数 (默认 13，对应电池簇物理排列) */
  cols?: number;
  /** 数值单位 */
  unit?: string;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 颜色区间 [低, 中, 高] */
  colors?: [string, string, string];
  /** 标题 */
  title?: string;
  /** 高度 */
  height?: number;
}

/** 根据值计算颜色 (三段线性插值) — 返回 hex 格式 */
function interpolateColor(value: number, min: number, max: number, colors: [string, string, string]): string {
  if (!colors[0] || !colors[1] || !colors[2]) return '#5b8cff';
  const range = max - min;
  const ratio = range === 0 ? 0.5 : Math.max(0, Math.min(1, (value - min) / range));
  const hexToRgb = (hex: string) => {
    const h = (hex || '#888888').replace('#', '');
    return [parseInt(h.slice(0, 2), 16) || 128, parseInt(h.slice(2, 4), 16) || 128, parseInt(h.slice(4, 6), 16) || 128];
  };
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  const [r1, g1, b1] = hexToRgb(colors[0]);
  const [r2, g2, b2] = hexToRgb(colors[1]);
  const [r3, g3, b3] = hexToRgb(colors[2]);

  let r: number, g: number, b: number;
  if (ratio < 0.5) {
    const t = ratio * 2;
    r = r1 + (r2 - r1) * t;
    g = g1 + (g2 - g1) * t;
    b = b1 + (b2 - b1) * t;
  } else {
    const t = (ratio - 0.5) * 2;
    r = r2 + (r3 - r2) * t;
    g = g2 + (g3 - g2) * t;
    b = b2 + (b3 - b2) * t;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function CellHeatmapGrid({
  cells,
  cols = 13,
  unit = '',
  min,
  max,
  colors,
  title,
  height,
}: CellHeatmapGridProps) {
  const { isDark } = useTheme();

  const computedColors: [string, string, string] = colors ?? [
    '#43d19f',  // 低风险 - 绿色
    '#f5b14a',  // 中风险 - 黄色
    '#ff7971',  // 高风险 - 红色
  ];

  const computedMin = min ?? Math.min(...cells.map(c => c.value));
  const computedMax = max ?? Math.max(...cells.map(c => c.value));

  const rows = Math.ceil(cells.length / cols);

  /** 用于 tooltip 的悬停状态 */
  const [hoveredCell, setHoveredCell] = React.useState<string | null>(null);

  const cellSize = useMemo(() => {
    // 根据列数自动计算格子大小，保持方形
    const maxWidth = 100 / cols;
    return Math.min(maxWidth, 8); // 最大 8% 宽度
  }, [cols]);

  return (
    <div className="w-full" style={{ height: height ?? 'auto' }}>
      {title && (
        <div className="text-sm font-semibold text-[var(--console-title)] mb-3">{title}</div>
      )}

      {/* 图例 */}
      <div className="console-heatmap-legend">
        <span>{computedMin}{unit}</span>
        <div className="console-heatmap-legend__bar" style={{
          background: `linear-gradient(to right, ${computedColors[0]}, ${computedColors[1]}, ${computedColors[2]})`,
        }} />
        <span>{computedMax}{unit}</span>
        <span className="console-heatmap-legend__label">低</span>
        <span className="console-heatmap-legend__label">中</span>
        <span className="console-heatmap-legend__label">高</span>
      </div>

      {/* 电池单元格网格 */}
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {cells.map((cell) => {
          const bgColor = interpolateColor(cell.value, computedMin, computedMax, computedColors);
          const isHovered = hoveredCell === cell.cellId;
          const textColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';

          return (
            <div
              key={cell.cellId}
              className="relative rounded-lg p-1.5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
              role="img"
              tabIndex={0}
              aria-label={`${cell.label ?? cell.cellId}，${cell.value}${unit}`}
              title={`${cell.label ?? cell.cellId}: ${cell.value}${unit}`}
              style={{
                backgroundColor: hexToRgba(bgColor, isDark ? 0.25 : 0.18),
                border: `1.5px solid ${hexToRgba(bgColor, isHovered ? 0.9 : 0.5)}`,
                boxShadow: isHovered ? `0 0 12px ${hexToRgba(bgColor, 0.4)}` : 'none',
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                aspectRatio: '1',
              }}
              onMouseEnter={() => setHoveredCell(cell.cellId)}
              onMouseLeave={() => setHoveredCell(null)}
            >
              {/* 单元格编号 */}
              <span className="text-[9px] leading-none text-[var(--console-text-soft)] font-medium">
                {cell.label ?? cell.cellId}
              </span>
              {/* 数值 */}
              <span className="text-xs leading-none font-bold mt-0.5" style={{ color: textColor }}>
                {cell.value}{unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
