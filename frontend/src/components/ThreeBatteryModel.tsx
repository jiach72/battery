import React, { useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { brandTokens, getRiskTone, getTemperatureTone } from '../styles/theme';

/* ───── 常量 ───── */
const CELLS_PER_CLUSTER = 26;
const ROWS = 2;
const COLS = 13;
const CELL_W = 0.38;
const CELL_H = 0.72;
const CELL_D = 0.16;
const GAP = 0.04;
const RACK_PAD = 0.12;

/* ───── 温度→颜色 (5段渐变，PRD §1.2 语义色驱动) ───── */
const COLOR_STOPS = [
  { t: 0.0,  r: 0.22, g: 0.73, b: 0.96 },  // 冰蓝
  { t: 0.25, r: 0.18, g: 0.85, b: 0.55 },  // 翠绿
  { t: 0.5,  r: 0.96, g: 0.84, b: 0.12 },  // 琥珀
  { t: 0.75, r: 0.98, g: 0.49, b: 0.13 },  // 橙
  { t: 1.0,  r: 0.94, g: 0.15, b: 0.15 },  // 警红
];

function tempToColor(temp: number, min: number, max: number): THREE.Color {
  const ratio = Math.max(0, Math.min(1, (temp - min) / (max - min || 1)));
  let i = 0;
  for (; i < COLOR_STOPS.length - 1; i++) {
    if (ratio <= COLOR_STOPS[i + 1].t) break;
  }
  const a = COLOR_STOPS[i];
  const b = COLOR_STOPS[i + 1];
  const local = (ratio - a.t) / (b.t - a.t);
  return new THREE.Color(
    a.r + (b.r - a.r) * local,
    a.g + (b.g - a.g) * local,
    a.b + (b.b - a.b) * local,
  );
}

/* ───── 单体电芯 ───── */
interface CellProps {
  position: [number, number, number];
  temperature: number;
  cellNo: number;
  minTemp: number;
  maxTemp: number;
  isAbnormal: boolean;    // SCADA: 异常标注
  isHighlighted: boolean;
  onHover: (cellNo: number | null) => void;
  onClick: (cellNo: number) => void;
}

function CellMesh({ position, temperature, cellNo, minTemp, maxTemp, isAbnormal, isHighlighted, onHover, onClick }: CellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => tempToColor(temperature, minTemp, maxTemp), [temperature, minTemp, maxTemp]);
  const emissiveRed = useMemo(() => new THREE.Color(0.94, 0.15, 0.15), []);
  const cellGeometry = useMemo(() => new THREE.BoxGeometry(CELL_W, CELL_H, CELL_D), []);
  const edgeGeometry = useMemo(() => new THREE.BoxGeometry(CELL_W + 0.012, CELL_H + 0.012, CELL_D + 0.012), []);
  const frameEmissive = useMemo(() => new THREE.Color(), []);

  /* 高温脉冲 + 异常闪烁 */
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
      if (isAbnormal) {
        // 异常单体：快速脉冲警示
        mat.emissiveIntensity = 0.15 + Math.sin(clock.elapsedTime * 4 + cellNo * 0.5) * 0.1;
        mat.emissive = emissiveRed;
      } else if (temperature > maxTemp * 0.8) {
        // 高温但未达异常：缓慢呼吸
        mat.emissiveIntensity = 0.08 + Math.sin(clock.elapsedTime * 2 + cellNo) * 0.04;
        frameEmissive.copy(color);
        mat.emissive = frameEmissive;
      } else {
        mat.emissiveIntensity = 0;
      }
      // 高亮单体：hover 时添加微光
      if (isHighlighted && !isAbnormal) {
        mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.15 + Math.sin(clock.elapsedTime * 3) * 0.05);
        frameEmissive.copy(color);
        mat.emissive = frameEmissive;
      }
    }
  });

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(cellNo);
  }, [cellNo, onHover]);

  const handlePointerOut = useCallback(() => {
    onHover(null);
  }, [onHover]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick(cellNo);
  }, [cellNo, onClick]);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <primitive object={cellGeometry} attach="geometry" />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={isHighlighted ? 1.0 : 0.92}
          roughness={0.35}
          metalness={0.05}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
        />
      </mesh>
      {/* 高亮边框：hover 或 异常标注 */}
      {(isHighlighted || isAbnormal) && (
        <lineSegments>
          <edgesGeometry args={[edgeGeometry]} />
          <lineBasicMaterial
            color={isAbnormal ? '#ff7971' : '#d8e5f5'}
            transparent
            opacity={isAbnormal ? 0.9 : 0.7}
            linewidth={isAbnormal ? 2 : 1}
          />
        </lineSegments>
      )}
    </group>
  );
}

/* ───── 电池簇支架 / 外壳 ───── */
function ClusterRack({ children }: { children: React.ReactNode }) {
  const totalW = COLS * (CELL_W + GAP) - GAP + RACK_PAD * 2;
  const totalH = ROWS * (CELL_H + GAP) - GAP + RACK_PAD * 2;
  const totalD = CELL_D + 0.08;

  return (
    <group>
      <RoundedBox args={[totalW + 0.06, 0.03, totalD + 0.06]} radius={0.01} position={[0, -totalH / 2 - 0.025, 0]}>
        <meshPhysicalMaterial color="#2a2a2e" roughness={0.6} metalness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.025, totalH + 0.06, totalD + 0.06]} radius={0.005} position={[-totalW / 2 - 0.013, 0, 0]}>
        <meshPhysicalMaterial color="#2a2a2e" roughness={0.6} metalness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.025, totalH + 0.06, totalD + 0.06]} radius={0.005} position={[totalW / 2 + 0.013, 0, 0]}>
        <meshPhysicalMaterial color="#2a2a2e" roughness={0.6} metalness={0.7} />
      </RoundedBox>
      <RoundedBox args={[totalW + 0.06, 0.025, totalD + 0.06]} radius={0.01} position={[0, totalH / 2 + 0.013, 0]}>
        <meshPhysicalMaterial color="#2a2a2e" roughness={0.6} metalness={0.7} />
      </RoundedBox>
      <RoundedBox args={[totalW, 0.015, totalD]} radius={0.003} position={[0, 0, 0]}>
        <meshPhysicalMaterial color="#1f1f23" roughness={0.5} metalness={0.6} />
      </RoundedBox>
      {children}
    </group>
  );
}

/* ───── 散热片 ───── */
function HeatSinks() {
  const totalW = COLS * (CELL_W + GAP) - GAP + RACK_PAD * 2;
  const fins = 6;
  return (
    <group position={[0, 0, -CELL_D / 2 - 0.04]}>
      {Array.from({ length: fins }, (_, i) => {
        const x = (i - (fins - 1) / 2) * (totalW / fins);
        return (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[0.015, 0.6, 0.03]} />
            <meshPhysicalMaterial color="#3a3a40" roughness={0.3} metalness={0.85} />
          </mesh>
        );
      })}
      <mesh position={[0, -0.32, 0.015]}>
        <boxGeometry args={[totalW, 0.02, 0.01]} />
        <meshPhysicalMaterial color="#3a3a40" roughness={0.3} metalness={0.85} />
      </mesh>
      <mesh position={[0, 0.32, 0.015]}>
        <boxGeometry args={[totalW, 0.02, 0.01]} />
        <meshPhysicalMaterial color="#3a3a40" roughness={0.3} metalness={0.85} />
      </mesh>
    </group>
  );
}

/* ───── 地面 ───── */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.65, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshPhysicalMaterial color="#111114" roughness={0.95} metalness={0.1} transparent opacity={0.6} />
    </mesh>
  );
}

/* ───── 场景 ───── */
interface SceneProps {
  cells: { cellNo: number; temperature: number; voltage: number; soc: number; isAbnormal: boolean }[];
  onHoverCell: (cellNo: number | null) => void;
  onClickCell: (cellNo: number) => void;
  highlightedCell: number | null;
  minTemp: number;
  maxTemp: number;
}

function Scene({ cells, onHoverCell, onClickCell, highlightedCell, minTemp, maxTemp }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.08;
    }
  });

  const totalW = COLS * (CELL_W + GAP) - GAP;
  const offsetX = -totalW / 2 + CELL_W / 2;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 8, 6]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-3, 4, -4]} intensity={0.3} color="#6688cc" />
      <pointLight position={[0, 3, 2]} intensity={0.6} color="#aaccff" distance={8} />
      <Environment preset="studio" />

      <group ref={groupRef} position={[0, 0, 0]}>
        <ClusterRack>
          <HeatSinks />
          {cells.map((cell, i) => {
            const row = Math.floor(i / COLS);
            const col = i % COLS;
            const x = offsetX + col * (CELL_W + GAP);
            const y = (ROWS - 1 - row) * (CELL_H + GAP * 3) - (ROWS * (CELL_H + GAP * 3) - GAP * 3) / 2 + CELL_H / 2;
            return (
              <CellMesh
                key={cell.cellNo}
                position={[x, y, 0]}
                temperature={cell.temperature}
                cellNo={cell.cellNo}
                minTemp={minTemp}
                maxTemp={maxTemp}
                isAbnormal={cell.isAbnormal}
                isHighlighted={highlightedCell === cell.cellNo}
                onHover={onHoverCell}
                onClick={onClickCell}
              />
            );
          })}
        </ClusterRack>
      </group>

      <Ground />
      <OrbitControls
        enablePan={false}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 6}
        minDistance={3}
        maxDistance={10}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

/* ───── 温度图例 ───── */
function TemperatureLegend({ min, max }: { min: number; max: number }) {
  const stops = COLOR_STOPS.map((s) => {
    const r = Math.round(s.r * 255);
    const g = Math.round(s.g * 255);
    const b = Math.round(s.b * 255);
    return `rgb(${r},${g},${b}) ${s.t * 100}%`;
  }).join(', ');

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[12px] font-medium tabular-nums text-[var(--console-text-soft)]">{min.toFixed(0)}℃</span>
      <div className="h-2 flex-1 rounded-full" style={{ background: `linear-gradient(to right, ${stops})` }} />
      <span className="text-[12px] font-medium tabular-nums text-[var(--console-text-soft)]">{max.toFixed(0)}℃</span>
      <span className="ml-1 inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: getRiskTone('high').color }}>
        <span className="text-[11px]">●</span>
        异常
      </span>
    </div>
  );
}

/* ───── WebGL 错误边界 ───── */
interface EBProps { fallback: React.ReactNode; children: React.ReactNode }
interface EBState { hasError: boolean }

class WebGLErrorBoundary extends React.Component<EBProps, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

/* ───── 导出组件 ───── */
interface ThreeBatteryModelProps {
  cells?: { cellNo: number; temperature: number; voltage: number; soc?: number; isAbnormal?: boolean }[];
  height?: number;
}

export default function ThreeBatteryModel({ cells, height = 420 }: ThreeBatteryModelProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  const mockCells = useMemo(() => {
    if (cells && cells.length > 0) {
      return cells.map((c) => ({
        ...c,
        soc: c.soc ?? Math.min(96, Math.max(18, 66 + (c.cellNo % 8) * 2 - Math.max(0, c.temperature - 33))),
        isAbnormal: c.isAbnormal ?? (c.temperature > 40 || c.temperature < 10),
      }));
    }
    // Mock: 模拟2个异常单体
    return Array.from({ length: CELLS_PER_CLUSTER }, (_, i) => ({
      cellNo: i + 1,
      temperature: i === 7 ? 42.8 : i === 19 ? 41.2 : 24 + (i % 6) * 2.1 + Math.floor(i / 6) * 1.2,
      voltage: 3.22 + (i % 5) * 0.022 + Math.floor(i / 8) * 0.004,
      soc: 58 + (i % 9) * 3.1 - Math.floor(i / 12) * 2.8,
      isAbnormal: i === 7 || i === 19,
    }));
  }, [cells]);

  const minTemp = useMemo(() => Math.floor(Math.min(...mockCells.map((c) => c.temperature))), [mockCells]);
  const maxTemp = useMemo(() => Math.ceil(Math.max(...mockCells.map((c) => c.temperature))), [mockCells]);

  const hoveredData = hoveredCell !== null ? mockCells.find((c) => c.cellNo === hoveredCell) : null;
  const selectedData = selectedCell !== null ? mockCells.find((c) => c.cellNo === selectedCell) : null;

  /* 当前展示的详情面板数据：点击优先，hover次之 */
  const panelData = selectedData || hoveredData;

  return (
    <div className="relative">
      <div style={{ height, borderRadius: 8, overflow: 'hidden', background: '#08101a' }}>
        <WebGLErrorBoundary fallback={<div className="p-4 text-center text-[var(--console-text-muted)]">3D渲染不可用</div>}>
        <Canvas
          camera={{ position: [0, 1.5, 5], fov: 45 }}
          dpr={[1, 2]}
          shadows
          gl={{ antialias: true, alpha: false }}
          onPointerMissed={() => { setHoveredCell(null); setSelectedCell(null); }}
          aria-label="3D电池簇可视化 - 显示26个电池单体的温度和状态"
          role="img"
        >
          <color attach="background" args={['#08101a']} />
          <fog attach="fog" args={['#08101a', 6, 12]} />
          <Scene
            cells={mockCells}
            onHoverCell={setHoveredCell}
            onClickCell={setSelectedCell}
            highlightedCell={hoveredCell}
            minTemp={minTemp}
            maxTemp={maxTemp}
          />
        </Canvas>
        </WebGLErrorBoundary>
      </div>

      {/* SCADA 详情面板：点击单体展开 */}
      {panelData && (
          <div
            className="absolute top-3 right-3 rounded-xl backdrop-blur-md"
            style={{
            background: 'rgba(8,16,26,0.9)',
            border: `1px solid ${panelData.isAbnormal ? 'rgba(245,34,45,0.3)' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: panelData.isAbnormal ? '0 0 16px rgba(245,34,45,0.15)' : '0 4px 24px rgba(0,0,0,0.5)',
            padding: '12px 14px',
            minWidth: 184,
          }}
        >
          <div className="mb-2 flex items-center gap-2.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: tempToColor(panelData.temperature, minTemp, maxTemp).getStyle() }}
            />
            <span className="text-[14px] font-semibold tracking-[-0.01em] text-white">#{panelData.cellNo} 号单体</span>
            {panelData.isAbnormal && (
              <span className="rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: getRiskTone('high').soft, color: getRiskTone('high').color }}>异常</span>
            )}
          </div>
          <div className="space-y-1.5" style={{ color: 'rgba(220, 231, 242, 0.78)' }}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[12px] text-[rgba(220,231,242,0.72)]">温度</span>
              <span className="inline-flex items-baseline gap-1">
                <span className="text-[14px] font-semibold tabular-nums" style={{ color: getTemperatureTone(panelData.temperature).color }}>
                  {panelData.temperature.toFixed(1)}
                </span>
                <span className="text-[11px] font-medium text-[rgba(220,231,242,0.62)]">℃</span>
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[12px] text-[rgba(220,231,242,0.72)]">电压</span>
              <span className="inline-flex items-baseline gap-1 text-white">
                <span className="text-[14px] font-semibold tabular-nums">{panelData.voltage.toFixed(3)}</span>
                <span className="text-[11px] font-medium text-[rgba(220,231,242,0.62)]">V</span>
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[12px] text-[rgba(220,231,242,0.72)]">SOC</span>
              <span className="inline-flex items-baseline gap-1 text-white">
                <span className="text-[14px] font-semibold tabular-nums">{panelData.soc.toFixed(1)}</span>
                <span className="text-[11px] font-medium text-[rgba(220,231,242,0.62)]">%</span>
              </span>
            </div>
          </div>
          <div
            className="mt-3 cursor-pointer border-t pt-2 text-center"
            style={{ borderColor: 'rgba(255,255,255,0.06)', color: brandTokens.primary }}
          >
            <span className="text-[12px] font-medium">查看工况曲线 →</span>
          </div>
        </div>
      )}

      <div className="absolute top-3 left-3">
        {mockCells.filter((c) => c.isAbnormal).length > 0 && (
          <div
            className="rounded-full px-3 py-1.5 text-[12px] font-medium backdrop-blur-md"
            style={{ background: getRiskTone('high').soft, border: `1px solid ${getRiskTone('high').strong}`, color: getRiskTone('high').color }}
          >
            ⚠ 异常单体 {mockCells.filter((c) => c.isAbnormal).length}/{mockCells.length}
          </div>
        )}
      </div>

      <div className="px-1 pt-1">
        <TemperatureLegend min={minTemp} max={maxTemp} />
      </div>
    </div>
  );
}
