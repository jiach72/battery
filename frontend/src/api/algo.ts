import client from './client';
import type {
  RiskLevel,
  RiskType,
} from '../types/battery';

/* ═══════════════════════════════════════════════════════════════
 *  6大算法服务 API — 通过网关 /algo/** 路由到算法引擎 (port 8000)
 * ═══════════════════════════════════════════════════════════════ */

/* ─── SOH 预测 ─── */
export interface SohPredictRequest {
  deviceId: string;
  cellId?: string;
  horizonDays?: number;    // 预测天数，默认 90
}

export interface SohPredictResponse {
  soh: number;
  theorySoh: number;
  predictedSohCurve: { date: string; soh: number }[];
  remainingCycles: number;
  riskLevel: RiskLevel;
}

/* ─── 微短路检测 ─── */
export interface MicroShortCircuitRequest {
  deviceId: string;
  cellId?: string;
}

export interface MicroShortCircuitResponse {
  cellId: string;
  score: number;           // 0~1 越高越可疑
  riskLevel: RiskLevel;
  residualCurve: { timestamp: string; value: number }[];
}

/* ─── 析锂检测 ─── */
export interface LithiumPlatingRequest {
  deviceId: string;
  cellId?: string;
}

export interface LithiumPlatingResponse {
  cellId: string;
  score: number;
  riskLevel: RiskLevel;
  icaPeaks: { voltage: number; intensity: number }[];
}

/* ─── DCIR 估算 ─── */
export interface DcirEstimateRequest {
  deviceId: string;
  cellId?: string;
}

export interface DcirEstimateResponse {
  cellId: string;
  r0: number;              // Ω 欧姆内阻
  r1: number;              // Ω 极化内阻
  c1: number;              // F 极化电容
  healthIndicator: number; // DCIR 健康指标
  riskLevel: RiskLevel;
}

/* ─── 一致性评分 ─── */
export interface ConsistencyRequest {
  deviceId: string;
  level?: 'cluster' | 'cell';
}

export interface ConsistencyResponse {
  deviceId: string;
  score: number;           // 0~100
  voltDiffMax: number;
  voltStd: number;
  tempDiffMax: number;
  socDeviation: number;
  outlierCells: { cellNo: number; metric: string; value: number }[];
}

/* ─── 运维调换优化 ─── */
export interface OmOptimizeRequest {
  stationId: string;
  maxSwapCount?: number;   // 最大调换数
}

export interface OmOptimizeResponse {
  plans: {
    fromDevice: string;
    toDevice: string;
    reason: string;
    riskType: RiskType;
    expectedImprovement: number;
  }[];
  totalCost: number;
  totalBenefit: number;
}

/* ═══════════════════════════════════════════════════════════════ */

export const algoApi = {
  sohPredict: (req: SohPredictRequest) =>
    client.post<never, { code: number; data: SohPredictResponse }>('/algo/soh/predict', req),

  microShortCircuitDetect: (req: MicroShortCircuitRequest) =>
    client.post<never, { code: number; data: MicroShortCircuitResponse }>('/algo/micro-short-circuit/detect', req),

  lithiumPlatingDetect: (req: LithiumPlatingRequest) =>
    client.post<never, { code: number; data: LithiumPlatingResponse }>('/algo/lithium-plating/detect', req),

  dcirEstimate: (req: DcirEstimateRequest) =>
    client.post<never, { code: number; data: DcirEstimateResponse }>('/algo/dcir/estimate', req),

  consistencyScore: (req: ConsistencyRequest) =>
    client.post<never, { code: number; data: ConsistencyResponse }>('/algo/consistency/score', req),

  omOptimize: (req: OmOptimizeRequest) =>
    client.post<never, { code: number; data: OmOptimizeResponse }>('/algo/om/optimize', req),
};
