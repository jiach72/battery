/* ═══════════════════════════════════════════════════════════════
 *  电池健康平台核心类型定义 - 基于 PRD V1.5 数据字典
 *  设计原则：健康评估、风险识别、寿命预测与运维建议优先
 * ═══════════════════════════════════════════════════════════════ */

/* ─── 风险枚举 (PRD §2.2) ─── */
export type RiskType = 'capacity_risk' | 'volt_risk' | 'short_circuit_risk' | 'temp_risk' | 'liout_risk';
export type RiskLevel = 'high' | 'medium' | 'low';

export const RISK_LABELS: Record<RiskType, string> = {
  capacity_risk: '容量',
  volt_risk: '电压',
  short_circuit_risk: '微短路',
  temp_risk: '温度',
  liout_risk: '析锂',
};

/* ─── Dashboard 总览 ─── */
export interface DashboardOverview {
  totalCapacity: number;
  totalSoh: number;
  dailyCharge: number;
  dailyDischarge: number;
  alarmCount: { high: number; medium: number; low: number };
  pcsEfficiency: number;
  revenueToday: number;
  forecastRevenueMonth: number;
  lastUpdateTime: string;

  realSoh?: number;
  theorySoh?: number;
  consistencyScore?: number;
  totalDays?: number;
  usedRecycleTimes?: number;
  remainingRecycleTimes?: number;
  batteryMileageAmount?: number;
  batteryMileageDay?: number;
  voltDiffMax?: number;
  voltStd?: number;
  tempDiffMax?: number;
  cellMaxTemp?: number;
  socDeviation?: number;
  riskRadar?: Record<RiskType, RiskLevel>;
  pendingSwapCount?: number;
  swapSuggestions?: SwapSuggestion[];
  degradationTop5?: DegradationItem[];
  energyEfficiency?: number;
  pcsDailyEfficiency?: number;
  pcsCumulativeEfficiency?: number;
  transformerDailyEfficiency?: number;
  transformerCumulativeEfficiency?: number;
  sohTrend?: {
    dates: string[];
    actual: number[];
    predicted: number[];
  };
  dailyTrend?: {
    dates: string[];
    charge: number[];
    discharge: number[];
  };
  energyUnitId?: string;
  energyUnitName?: string;
}

/* ─── 调换建议 (PRD §0 / §4.2 O&M) ─── */
export interface SwapSuggestion {
  deviceId: string;
  deviceName: string;                   // 如 "簇C3-#27"
  soh: number;
  riskType: RiskType;
  riskLevel: RiskLevel;
}

/* ─── 衰减 TOP5 条目 ─── */
export interface DegradationItem {
  deviceId: string;
  deviceName: string;                   // 如 "簇A1-#14"
  soh: number;
  theorySoh: number;
  gap: number;                          // 理论-实际差值
  primaryRisk: RiskType;
  riskLevel: RiskLevel;
}

/* ─── 实时簇数据 ─── */
export interface RealtimeCluster {
  clusterId: string;
  clusterNo: number;
  cells: {
    cellNo: number;
    voltage: number;
    current: number;
    temperature: number;
    soc: number;
    timestamp: string;
  }[];
}

/* ─── 评估条目 (问诊室) ─── */
export interface AssessmentItem {
  deviceId: string;
  deviceName: string;
  level: 'station' | 'unit' | 'cluster' | 'cell';
  realSoh: number;
  theorySoh: number;
  usedRecycleTimes: number;
  remainingRecycleTimes: number;
  batteryMileageAmount: number;
  batteryMileageDay: number;
  risks: RiskItem[];
  consistencyScore: number;
  lastUpdateTime: string;
}

export interface RiskItem {
  type: RiskType;
  level: RiskLevel;
  description: string;
}

/* ─── 单体端点分析 (问诊室下钻) ─── */
export interface EndpointAnalysis {
  cellId: string;
  type: 'CHARGE' | 'DISCHARGE';
  chargeEndMaxVoltDiff: number;
  chargeEndVoltSTD: number;
  chargeEndSOC: number;
  chargeEndVoltageDeviation: number;
  cellMaxTemp: number;
  maxCellTempRange: number;
  curves: {
    timestamp: string;
    voltage: number;
    current: number;
    soc: number;
    temperature: number;
  }[];
}
