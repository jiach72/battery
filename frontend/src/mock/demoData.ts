import type { AlarmEvent, AlarmRule, AlarmStatus } from '../types/alarm';
import type { DashboardOverview, AssessmentItem, EndpointAnalysis, RealtimeCluster } from '../types/battery';
import type { Analog } from '../types/analog';
import type { Station, TopologyTree } from '../types/station';
import type { SimulatePlanRequest, SimulatePlanResponse } from '../api/om';
import type { DiagnosisCase, ImpedanceDiagnosis, ImpedanceSpectrum } from '../api/diagnosis';
import type { TelemetrySchema } from '../api/telemetry';

const pad = (value: number) => String(value).padStart(2, '0');

const formatDateTime = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

const round = (value: number, fractionDigits = 1) => Number(value.toFixed(fractionDigits));

const shiftMinutes = (minutes: number) => new Date(Date.now() - minutes * 60_000);

export async function requestWithDemoFallback<T>(
  request: Promise<T> | (() => Promise<T>),
  fallback: () => T,
  shouldFallback?: (value: T) => boolean
): Promise<T> {
  const demoMode = localStorage.getItem('demoMode') === 'true'
    || import.meta.env.VITE_DEMO_MODE === 'true';
  if (demoMode) {
    return fallback();
  }

  try {
    const result = typeof request === 'function' ? await request() : await request;
    if (shouldFallback?.(result)) {
      throw new Error('Invalid response');
    }
    return result;
  } catch {
    throw new Error('请求失败');
  }
}

export function buildDemoDashboardOverview(energyUnitId = 'eu-1'): DashboardOverview {
  const dates = ['11月', '12月', '1月', '2月', '3月', '4月'];
  const actual = [95.2, 95.0, 94.7, 94.4, 94.0, 93.6];
  const predicted = [95.4, 95.1, 94.6, 94.1, 93.5, 92.8];

  return {
    energyUnitId,
    energyUnitName: energyUnitId === 'eu-2' ? '东区 2 号站-2 号单元' : '北区 1 号站-1 号单元',
    totalCapacity: 1536,
    totalSoh: 94.8,
    dailyCharge: 286.4,
    dailyDischarge: 274.8,
    alarmCount: { high: 10, medium: 22, low: 34 },
    pcsEfficiency: 97.8,
    revenueToday: 124200,
    forecastRevenueMonth: 3726000,
    lastUpdateTime: formatDateTime(new Date()),
    totalDays: 427,
    usedRecycleTimes: 128,
    remainingRecycleTimes: 89,
    batteryMileageAmount: 15840,
    batteryMileageDay: 52.4,
    voltDiffMax: 0.112,
    voltStd: 0.013,
    tempDiffMax: 4.8,
    cellMaxTemp: 37.2,
    socDeviation: 5.4,
    riskRadar: {
      capacity_risk: 'medium',
      volt_risk: 'medium',
      short_circuit_risk: 'low',
      temp_risk: 'high',
      liout_risk: 'medium',
    },
    pendingSwapCount: 8,
    swapSuggestions: [
      { deviceId: 'cell-01', deviceName: '北区1号站-2号单元-簇4-单体01', soh: 91.8, riskType: 'temp_risk', riskLevel: 'high' },
      { deviceId: 'cell-08', deviceName: '北区1号站-2号单元-簇7-单体08', soh: 89.9, riskType: 'volt_risk', riskLevel: 'high' },
      { deviceId: 'cell-13', deviceName: '北区1号站-1号单元-簇2-单体13', soh: 93.7, riskType: 'capacity_risk', riskLevel: 'medium' },
    ],
    degradationTop5: [
      { deviceId: 'cell-01', deviceName: '北区1号站-2号单元-簇4-单体01', soh: 91.8, theorySoh: 95.1, gap: 3.3, primaryRisk: 'temp_risk', riskLevel: 'high' },
      { deviceId: 'cell-08', deviceName: '北区1号站-2号单元-簇7-单体08', soh: 89.9, theorySoh: 94.4, gap: 4.5, primaryRisk: 'volt_risk', riskLevel: 'high' },
      { deviceId: 'cell-13', deviceName: '北区1号站-1号单元-簇2-单体13', soh: 93.7, theorySoh: 95.0, gap: 1.3, primaryRisk: 'capacity_risk', riskLevel: 'medium' },
      { deviceId: 'cell-27', deviceName: '东区2号站-1号单元-簇3-单体27', soh: 92.5, theorySoh: 94.8, gap: 2.3, primaryRisk: 'liout_risk', riskLevel: 'medium' },
      { deviceId: 'cell-39', deviceName: '东区2号站-2号单元-簇6-单体39', soh: 90.7, theorySoh: 94.0, gap: 3.3, primaryRisk: 'temp_risk', riskLevel: 'high' },
    ],
    energyEfficiency: 94.8,
    pcsDailyEfficiency: 97.2,
    pcsCumulativeEfficiency: 96.8,
    transformerDailyEfficiency: 98.4,
    transformerCumulativeEfficiency: 97.9,
    sohTrend: { dates, actual, predicted },
    dailyTrend: {
      dates,
      charge: [248, 252, 260, 268, 276, 286],
      discharge: [232, 238, 245, 253, 262, 275],
    },
  };
}

export function buildDemoRealtimeClusters(energyUnitId = 'eu-1'): RealtimeCluster[] {
  const stationBias = energyUnitId === 'eu-2' ? 0.45 : energyUnitId === 'station-east-02' ? 0.3 : 0;

  return Array.from({ length: 8 }, (_, clusterIndex) => {
    const clusterNo = clusterIndex + 1;
    const baseVoltage = 3.18 + clusterIndex * 0.008 + stationBias * 0.004;
    const baseCurrent = clusterNo <= 4 ? 126 - clusterIndex * 4.2 - stationBias * 0.6 : -92 + clusterIndex * 2.2 + stationBias * 0.5;
    const baseTemp = 24.6 + clusterIndex * 0.75 + stationBias * 0.4;
    const baseSoc = 82 - clusterIndex * 2.9 - stationBias * 0.7;

    return {
      clusterId: `cluster-${clusterNo}`,
      clusterNo,
      cells: Array.from({ length: 12 }, (_, cellIndex) => {
        const cellNo = cellIndex + 1;
        return {
          cellNo,
          voltage: round(baseVoltage + (cellIndex % 4) * 0.004 - Math.floor(cellIndex / 4) * 0.002, 3),
          current: round(baseCurrent / 12 + (cellIndex % 3) * 0.6, 1),
          temperature: round(baseTemp + (cellIndex % 5) * 0.28, 1),
          soc: round(Math.max(18, baseSoc - cellIndex * 0.7), 1),
          timestamp: formatDateTime(shiftMinutes(cellIndex + clusterIndex * 3)),
        };
      }),
    };
  });
}

export function buildDemoAssessmentList(): AssessmentItem[] {
  const rows: Array<Omit<AssessmentItem, 'level'>> = [
    {
      deviceId: 'cell-01',
      deviceName: '北区1号站-2号单元-簇4-单体01',
      realSoh: 91.8,
      theorySoh: 95.1,
      usedRecycleTimes: 684,
      remainingRecycleTimes: 1316,
      batteryMileageAmount: 14562,
      batteryMileageDay: 51.2,
      risks: [
        { type: 'temp_risk', level: 'high', description: '温升速率异常' },
        { type: 'short_circuit_risk', level: 'medium', description: '疑似微短路特征' },
      ],
      consistencyScore: 82.4,
      lastUpdateTime: formatDateTime(shiftMinutes(5)),
    },
    {
      deviceId: 'cell-08',
      deviceName: '北区1号站-2号单元-簇7-单体08',
      realSoh: 89.9,
      theorySoh: 94.4,
      usedRecycleTimes: 722,
      remainingRecycleTimes: 1278,
      batteryMileageAmount: 15211,
      batteryMileageDay: 49.8,
      risks: [
        { type: 'volt_risk', level: 'high', description: '末端压差偏大' },
        { type: 'capacity_risk', level: 'medium', description: '容量衰减偏快' },
      ],
      consistencyScore: 79.6,
      lastUpdateTime: formatDateTime(shiftMinutes(6)),
    },
    {
      deviceId: 'cell-13',
      deviceName: '北区1号站-1号单元-簇2-单体13',
      realSoh: 93.7,
      theorySoh: 95.0,
      usedRecycleTimes: 651,
      remainingRecycleTimes: 1349,
      batteryMileageAmount: 13982,
      batteryMileageDay: 47.6,
      risks: [{ type: 'capacity_risk', level: 'medium', description: 'SOC 漂移偏大' }],
      consistencyScore: 86.1,
      lastUpdateTime: formatDateTime(shiftMinutes(7)),
    },
    {
      deviceId: 'cell-21',
      deviceName: '北区1号站-1号单元-簇1-单体21',
      realSoh: 95.4,
      theorySoh: 96.2,
      usedRecycleTimes: 598,
      remainingRecycleTimes: 1402,
      batteryMileageAmount: 13244,
      batteryMileageDay: 45.3,
      risks: [{ type: 'temp_risk', level: 'low', description: '温差轻微偏大' }],
      consistencyScore: 90.8,
      lastUpdateTime: formatDateTime(shiftMinutes(9)),
    },
    {
      deviceId: 'cell-27',
      deviceName: '东区2号站-1号单元-簇3-单体27',
      realSoh: 92.5,
      theorySoh: 94.8,
      usedRecycleTimes: 701,
      remainingRecycleTimes: 1299,
      batteryMileageAmount: 14890,
      batteryMileageDay: 52.1,
      risks: [{ type: 'liout_risk', level: 'medium', description: '析锂风险抬升' }],
      consistencyScore: 84.7,
      lastUpdateTime: formatDateTime(shiftMinutes(11)),
    },
    {
      deviceId: 'cell-34',
      deviceName: '东区2号站-2号单元-簇5-单体34',
      realSoh: 96.0,
      theorySoh: 96.5,
      usedRecycleTimes: 542,
      remainingRecycleTimes: 1458,
      batteryMileageAmount: 12112,
      batteryMileageDay: 41.9,
      risks: [{ type: 'capacity_risk', level: 'low', description: '容量保持正常' }],
      consistencyScore: 92.6,
      lastUpdateTime: formatDateTime(shiftMinutes(13)),
    },
    {
      deviceId: 'cell-39',
      deviceName: '东区2号站-2号单元-簇6-单体39',
      realSoh: 90.7,
      theorySoh: 94.0,
      usedRecycleTimes: 736,
      remainingRecycleTimes: 1264,
      batteryMileageAmount: 15884,
      batteryMileageDay: 54.2,
      risks: [
        { type: 'temp_risk', level: 'high', description: '热管理响应迟滞' },
        { type: 'volt_risk', level: 'medium', description: '端电压波动偏大' },
      ],
      consistencyScore: 78.9,
      lastUpdateTime: formatDateTime(shiftMinutes(16)),
    },
    {
      deviceId: 'cell-44',
      deviceName: '东区2号站-2号单元-簇8-单体44',
      realSoh: 94.1,
      theorySoh: 95.2,
      usedRecycleTimes: 617,
      remainingRecycleTimes: 1383,
      batteryMileageAmount: 13652,
      batteryMileageDay: 46.1,
      risks: [{ type: 'capacity_risk', level: 'medium', description: 'SOC 回差略高' }],
      consistencyScore: 88.4,
      lastUpdateTime: formatDateTime(shiftMinutes(19)),
    },
    {
      deviceId: 'cell-47',
      deviceName: '北区1号站-1号单元-簇3-单体47',
      realSoh: 92.9,
      theorySoh: 94.7,
      usedRecycleTimes: 689,
      remainingRecycleTimes: 1311,
      batteryMileageAmount: 14932,
      batteryMileageDay: 50.6,
      risks: [{ type: 'short_circuit_risk', level: 'medium', description: '内阻突增需观察' }],
      consistencyScore: 84.2,
      lastUpdateTime: formatDateTime(shiftMinutes(22)),
    },
    {
      deviceId: 'cell-52',
      deviceName: '北区1号站-2号单元-簇1-单体52',
      realSoh: 95.6,
      theorySoh: 96.1,
      usedRecycleTimes: 563,
      remainingRecycleTimes: 1437,
      batteryMileageAmount: 12546,
      batteryMileageDay: 43.7,
      risks: [{ type: 'capacity_risk', level: 'low', description: '容量衰减平稳' }],
      consistencyScore: 91.9,
      lastUpdateTime: formatDateTime(shiftMinutes(26)),
    },
    {
      deviceId: 'cell-59',
      deviceName: '东区2号站-1号单元-簇4-单体59',
      realSoh: 91.2,
      theorySoh: 94.2,
      usedRecycleTimes: 714,
      remainingRecycleTimes: 1286,
      batteryMileageAmount: 15110,
      batteryMileageDay: 53.4,
      risks: [
        { type: 'temp_risk', level: 'medium', description: '局部热斑抬升' },
        { type: 'volt_risk', level: 'medium', description: '压差轻度偏离' },
      ],
      consistencyScore: 80.7,
      lastUpdateTime: formatDateTime(shiftMinutes(31)),
    },
    {
      deviceId: 'cell-63',
      deviceName: '东区2号站-2号单元-簇2-单体63',
      realSoh: 94.8,
      theorySoh: 95.7,
      usedRecycleTimes: 582,
      remainingRecycleTimes: 1418,
      batteryMileageAmount: 13042,
      batteryMileageDay: 44.9,
      risks: [{ type: 'liout_risk', level: 'low', description: '析锂风险可控' }],
      consistencyScore: 89.6,
      lastUpdateTime: formatDateTime(shiftMinutes(34)),
    },
    {
      deviceId: 'cell-70',
      deviceName: '南区3号站-1号单元-簇6-单体70',
      realSoh: 90.4,
      theorySoh: 93.9,
      usedRecycleTimes: 748,
      remainingRecycleTimes: 1252,
      batteryMileageAmount: 15966,
      batteryMileageDay: 55.1,
      risks: [
        { type: 'capacity_risk', level: 'high', description: '衰减速率偏高' },
        { type: 'temp_risk', level: 'medium', description: '温控跟踪不足' },
      ],
      consistencyScore: 77.8,
      lastUpdateTime: formatDateTime(shiftMinutes(38)),
    },
    {
      deviceId: 'cell-75',
      deviceName: '南区3号站-2号单元-簇7-单体75',
      realSoh: 88.9,
      theorySoh: 93.4,
      usedRecycleTimes: 756,
      remainingRecycleTimes: 1244,
      batteryMileageAmount: 16204,
      batteryMileageDay: 55.8,
      risks: [
        { type: 'capacity_risk', level: 'high', description: '容量衰减持续偏快' },
        { type: 'temp_risk', level: 'medium', description: '散热回路波动' },
      ],
      consistencyScore: 75.9,
      lastUpdateTime: formatDateTime(shiftMinutes(41)),
    },
    {
      deviceId: 'cell-81',
      deviceName: '西区4号站-1号单元-簇2-单体81',
      realSoh: 95.1,
      theorySoh: 96.0,
      usedRecycleTimes: 574,
      remainingRecycleTimes: 1426,
      batteryMileageAmount: 12888,
      batteryMileageDay: 43.1,
      risks: [{ type: 'volt_risk', level: 'medium', description: '电压离散轻微抬升' }],
      consistencyScore: 90.1,
      lastUpdateTime: formatDateTime(shiftMinutes(44)),
    },
    {
      deviceId: 'cell-86',
      deviceName: '北区1号站-3号单元-簇1-单体86',
      realSoh: 93.3,
      theorySoh: 94.9,
      usedRecycleTimes: 663,
      remainingRecycleTimes: 1337,
      batteryMileageAmount: 14320,
      batteryMileageDay: 48.9,
      risks: [
        { type: 'short_circuit_risk', level: 'medium', description: '内阻特征需持续观察' },
        { type: 'capacity_risk', level: 'low', description: '容量变化平稳' },
      ],
      consistencyScore: 87.3,
      lastUpdateTime: formatDateTime(shiftMinutes(47)),
    },
    {
      deviceId: 'cell-92',
      deviceName: '东区2号站-3号单元-簇4-单体92',
      realSoh: 96.4,
      theorySoh: 96.8,
      usedRecycleTimes: 529,
      remainingRecycleTimes: 1471,
      batteryMileageAmount: 11958,
      batteryMileageDay: 40.8,
      risks: [{ type: 'temp_risk', level: 'low', description: '温差维持在安全区间' }],
      consistencyScore: 93.4,
      lastUpdateTime: formatDateTime(shiftMinutes(51)),
    },
  ];

  return rows.map((row) => ({ ...row, level: 'cell' as const }));
}

export function buildDemoEndpointAnalysis(cellId: string, type: 'CHARGE' | 'DISCHARGE'): EndpointAnalysis {
  const start = new Date(Date.now() - 44 * 60_000);
  const isCharge = type === 'CHARGE';
  return {
    cellId,
    type,
    chargeEndMaxVoltDiff: 0.084,
    chargeEndVoltSTD: 0.012,
    chargeEndSOC: 96.3,
    chargeEndVoltageDeviation: 1.8,
    cellMaxTemp: 36.7,
    maxCellTempRange: 4.9,
    curves: Array.from({ length: 45 }, (_, index) => {
      const ratio = index / 44;
      return {
        timestamp: formatDateTime(new Date(start.getTime() + index * 60_000)),
        voltage: round(3.08 + ratio * 0.26 + Math.sin(index / 6) * 0.006, 3),
        current: round(isCharge ? 112 - index * 1.1 : -98 + index * 0.8, 1),
        soc: round(isCharge ? 42 + ratio * 38 : 78 - ratio * 34, 1),
        temperature: round(28.1 + ratio * 4.6 + Math.cos(index / 8) * 0.4, 1),
      };
    }),
  };
}

export function buildDemoAlarmRules(): AlarmRule[] {
  return [
    { id: 'rule-temp-rate', name: '簇温升速率异常', condition: 'tempRiseRate>5.5', riskType: 'temp_risk', severity: 'high', notifyType: ['websocket', 'email'], enabled: true },
    { id: 'rule-volt-diff', name: '末端电压离散超阈值', condition: 'chargeEndVoltDiff>0.085', riskType: 'volt_risk', severity: 'high', notifyType: ['websocket', 'email', 'sms'], enabled: true },
    { id: 'rule-soc-drift', name: 'SOC 漂移偏大', condition: 'socDrift>5', riskType: 'capacity_risk', severity: 'medium', notifyType: ['websocket'], enabled: true },
    { id: 'rule-thermal-balance', name: '单体温差异常', condition: 'tempSpread>4', riskType: 'temp_risk', severity: 'medium', notifyType: ['websocket'], enabled: true },
    { id: 'rule-comms-loss', name: '通信链路抖动', condition: 'heartbeatLoss>3', riskType: 'short_circuit_risk', severity: 'medium', notifyType: ['websocket', 'sms'], enabled: true },
    { id: 'rule-capacity-fade', name: '容量衰减加速', condition: 'sohDecayRate>1.2', riskType: 'capacity_risk', severity: 'medium', notifyType: ['websocket', 'email'], enabled: true },
  ];
}

export function buildDemoAlarmEvents(): AlarmEvent[] {
  const templates: Array<Pick<AlarmEvent, 'ruleId' | 'ruleName' | 'severity' | 'deviceId' | 'deviceName' | 'description' | 'status' | 'triggerValue' | 'threshold'>> = [
    { ruleId: 'rule-temp-rate', ruleName: '簇温升速率异常', severity: 'high', deviceId: 'cluster-4', deviceName: '北区1号站-2号单元-簇4', description: '簇温度在 15 分钟内上升 7.2℃，建议立即核查冷却支路。', status: 'UNACK', triggerValue: 41.7, threshold: 38.0 },
    { ruleId: 'rule-volt-diff', ruleName: '末端电压离散超阈值', severity: 'high', deviceId: 'cluster-7', deviceName: '北区1号站-2号单元-簇7', description: '充电末端最大压差达到 112mV，存在一致性恶化趋势。', status: 'UNACK', triggerValue: 0.112, threshold: 0.085 },
    { ruleId: 'rule-soc-drift', ruleName: 'SOC 漂移偏大', severity: 'medium', deviceId: 'cluster-2', deviceName: '北区1号站-1号单元-簇2', description: 'SOC 漂移持续高于 6%，建议安排均衡维护。', status: 'ACKED', triggerValue: 6.4, threshold: 5.0 },
    { ruleId: 'rule-thermal-balance', ruleName: '单体温差异常', severity: 'medium', deviceId: 'cluster-5', deviceName: '北区1号站-2号单元-簇5', description: '簇内温差达到 5.6℃，冷却均匀性下降。', status: 'UNACK', triggerValue: 5.6, threshold: 4.0 },
    { ruleId: 'rule-capacity-fade', ruleName: '容量衰减加速', severity: 'low', deviceId: 'cluster-1', deviceName: '北区1号站-1号单元-簇1', description: '近 30 天 SOH 下降 0.9%，高于站内平均水平。', status: 'RESOLVED', triggerValue: 0.9, threshold: 0.6 },
    { ruleId: 'rule-comms-loss', ruleName: '通信链路抖动', severity: 'medium', deviceId: 'cluster-3', deviceName: '北区1号站-1号单元-簇3', description: '充电阶段出现异常电流抖动，建议复核采样链路。', status: 'ACKED', triggerValue: 15.2, threshold: 10.0 },
    { ruleId: 'rule-soc-drift', ruleName: 'SOC 漂移偏大', severity: 'low', deviceId: 'cluster-6', deviceName: '东区2号站-1号单元-簇6', description: '簇内 SOC 离散度升高，建议安排均衡维护窗口。', status: 'UNACK', triggerValue: 8.3, threshold: 6.0 },
    { ruleId: 'rule-temp-rate', ruleName: '热管理响应迟滞', severity: 'medium', deviceId: 'cluster-8', deviceName: '东区2号站-2号单元-簇8', description: '冷却启动后温升回落速度偏慢，需要检查风冷回路。', status: 'UNACK', triggerValue: 4.8, threshold: 3.5 },
    { ruleId: 'rule-volt-diff', ruleName: '单体电压回差异常', severity: 'high', deviceId: 'cluster-9', deviceName: '南区3号站-1号单元-簇9', description: '末端电压回差持续偏大，建议立即做离线复核。', status: 'UNACK', triggerValue: 0.119, threshold: 0.085 },
    { ruleId: 'rule-capacity-fade', ruleName: '容量衰减偏快', severity: 'medium', deviceId: 'cluster-10', deviceName: '南区3号站-2号单元-簇10', description: 'SOH 下降斜率高于同站同类设备，需关注。', status: 'ACKED', triggerValue: 1.2, threshold: 0.8 },
    { ruleId: 'rule-temp-rate', ruleName: '局部热斑抬升', severity: 'medium', deviceId: 'cluster-11', deviceName: '南区3号站-2号单元-簇11', description: '局部温点高于均值 4.1℃，建议复查散热路径。', status: 'UNACK', triggerValue: 4.1, threshold: 3.2 },
    { ruleId: 'rule-comms-loss', ruleName: '采样链路超时', severity: 'low', deviceId: 'cluster-12', deviceName: '南区3号站-1号单元-簇12', description: '采样链路偶发超时，当前仍可正常运行。', status: 'RESOLVED', triggerValue: 1.0, threshold: 1.0 },
    { ruleId: 'rule-capacity-fade', ruleName: '电量回落偏快', severity: 'medium', deviceId: 'cluster-13', deviceName: '西区4号站-1号单元-簇13', description: '近 7 日 SOH 回落较快，建议增加巡检频次。', status: 'UNACK', triggerValue: 1.6, threshold: 1.0 },
    { ruleId: 'rule-temp-rate', ruleName: '局部温升回响', severity: 'high', deviceId: 'cluster-14', deviceName: '西区4号站-2号单元-簇14', description: '温升回落速度偏慢，热管理路径需要复核。', status: 'UNACK', triggerValue: 4.9, threshold: 3.6 },
    { ruleId: 'rule-volt-diff', ruleName: '末端压差复核', severity: 'medium', deviceId: 'cluster-15', deviceName: '北区1号站-3号单元-簇15', description: '末端电压差异逐步扩大，建议安排一次平衡维护。', status: 'ACKED', triggerValue: 0.094, threshold: 0.085 },
    { ruleId: 'rule-comms-loss', ruleName: '采样抖动告警', severity: 'low', deviceId: 'cluster-16', deviceName: '东区2号站-3号单元-簇16', description: '采样链路偶发抖动，但未影响当前运行。', status: 'RESOLVED', triggerValue: 2.0, threshold: 1.5 },
  ];

  const statuses: AlarmStatus[] = ['UNACK', 'ACKED', 'RESOLVED'];
  const events = templates.map((template, index) => {
    const createdAt = formatDateTime(shiftMinutes(index * 47 + 8));
    const event: AlarmEvent = {
      id: 1200 + index + 1,
      ruleId: template.ruleId,
      ruleName: template.ruleName,
      severity: template.severity,
      deviceId: template.deviceId,
      deviceName: template.deviceName,
      description: template.description,
      condition: template.ruleName,
      triggerValue: template.triggerValue,
      threshold: template.threshold,
      status: template.status ?? statuses[index % statuses.length],
      createdAt,
    };

    if (event.status === 'ACKED') {
      event.acknowledgedAt = formatDateTime(shiftMinutes(index * 47 - 12));
    }
    if (event.status === 'RESOLVED') {
      event.resolvedAt = formatDateTime(shiftMinutes(index * 47 - 90));
    }
    return event;
  });

  return events;
}

export function buildDemoStations(): Station[] {
  return [
    { id: 'station-north-01', name: '北区 1 号储能站', location: '苏州工业园区', capacity: 512, status: 'online' },
    { id: 'station-east-02', name: '东区 2 号储能站', location: '常州武进', capacity: 384, status: 'online' },
    { id: 'station-south-03', name: '南区 3 号储能站', location: '无锡新吴', capacity: 640, status: 'maintenance' },
  ];
}

export function buildDemoTopologyTree(stationId?: string): TopologyTree {
  const allStations = buildDemoStations().map((station) => ({
    id: station.id,
    name: station.name,
    status: station.status,
    energyUnits: station.id === 'station-east-02'
      ? [
        { id: 'eu-east-01', name: '1 号储能单元', capacity: 192 },
        { id: 'eu-east-02', name: '2 号储能单元', capacity: 192 },
        { id: 'eu-east-03', name: '3 号储能单元', capacity: 192 },
      ]
      : station.id === 'station-south-03'
        ? [
          { id: 'eu-south-01', name: '1 号储能单元', capacity: 213 },
          { id: 'eu-south-02', name: '2 号储能单元', capacity: 213 },
          { id: 'eu-south-03', name: '3 号储能单元', capacity: 214 },
        ]
        : [
          { id: 'eu-1', name: '1 号储能单元', capacity: 256 },
          { id: 'eu-2', name: '2 号储能单元', capacity: 256 },
          { id: 'eu-3', name: '3 号储能单元', capacity: 256 },
        ],
  }));

  const filteredStations = stationId ? allStations.filter((station) => station.id === stationId) : allStations;
  return { stations: filteredStations };
}

export function buildDemoAnalogs(stationId = 'station-north-01'): Analog[] {
  const analogTypes: Array<Analog['dataType']> = ['voltage', 'current', 'temperature', 'soc'];
  const typePrefixes: Record<Analog['dataType'], string> = {
    voltage: 'AI_V',
    current: 'AI_I',
    temperature: 'AI_T',
    soc: 'AI_SOC',
  };

  const records: Analog[] = [];
  analogTypes.forEach((dataType, typeIndex) => {
    for (let i = 1; i <= 6; i++) {
      records.push({
        id: `${stationId}-${dataType}-${i}`,
        stationId,
        analogCode: `${typePrefixes[dataType]}_${pad(typeIndex * 6 + i)}`,
        cellId: `cell-${typeIndex + 1}-${i}`,
        description: `${dataType === 'voltage' ? '单体电压' : dataType === 'current' ? '采样电流' : dataType === 'temperature' ? '温度测点' : 'SOC 估算'} - 点位 ${i}`,
        unit: dataType === 'voltage' ? 'V' : dataType === 'current' ? 'A' : dataType === 'temperature' ? '℃' : '%',
        dataType,
      });
    }
  });

  return records;
}

export function buildDemoOmSimulation(request: SimulatePlanRequest): SimulatePlanResponse {
  const replacePackCount = request.replacePackCount || 4;
  const capacityGradingCount = request.capacityGradingCount || 8;
  const mappings = Array.from({ length: Math.min(replacePackCount + 2, 8) }, (_, index) => ({
    targetPosition: `北区1号站-2号单元-簇${index + 3}-单体${pad(index + 1)}`,
    insertCellId: `spare-cell-${pad(index + 1)}`,
    beforeSoh: round(90.4 - index * 0.42, 1),
    afterSoh: round(95.2 - index * 0.16, 1),
  }));

  return {
    planId: 'PLAN-DEMO-240421',
    mappings,
    estimatedSohImprovement: round(1.4 + replacePackCount * 0.18, 1),
    estimatedCost: round(86000 + replacePackCount * 5200 + capacityGradingCount * 380, 0),
    estimatedDuration: '6.5h',
    riskLevel: 'LOW',
    recommendation: '建议优先更换簇 4 与簇 7 中高温和高压差单体，并安排一次补充分容。',
    steps: [
      '隔离高风险簇并下发检修工单',
      '执行备品单体入组与均衡校准',
      '完成二次分容与热管理复核',
      '恢复并网并持续观测 24 小时',
      '补录运维日志并同步告警处置结果',
    ],
  };
}

export function buildDemoDiagnosisCases(): DiagnosisCase[] {
  return [
    {
      caseId: 'case-001',
      deviceId: 'cell-01',
      deviceName: '北区1号站-2号单元-簇4-单体01',
      diagnosisType: 'fault-diagnosis',
      conclusion: '疑似温升耦合异常，建议优先处理',
      riskLevel: 'high',
      confidence: 0.84,
      detectedAt: formatDateTime(new Date()),
      evidence: [
        { type: 'soh', value: 91.8, description: 'SOH 低于站内均值' },
        { type: 'temp', value: 37.2, description: '局部温升偏高' },
        { type: 'volt', value: 0.112, description: '末端压差超阈值' },
      ],
      recommendations: ['优先核查冷却支路', '复核单体电压离散度', '安排一次离线复测'],
    },
    {
      caseId: 'case-002',
      deviceId: 'cell-08',
      deviceName: '北区1号站-2号单元-簇7-单体08',
      diagnosisType: 'fault-diagnosis',
      conclusion: '疑似一致性退化，建议持续观测',
      riskLevel: 'medium',
      confidence: 0.77,
      detectedAt: formatDateTime(new Date()),
      evidence: [
        { type: 'soh', value: 89.9, description: 'SOH 低于站内均值' },
        { type: 'consistency', value: 79.6, description: '簇内一致性偏低' },
        { type: 'eis', value: 0.061, description: '阻抗谱半圆半径偏大' },
      ],
      recommendations: ['复核均衡策略', '对比同簇阻抗谱差异', '纳入后续跟踪观察'],
    },
  ];
}

export function buildDemoImpedanceSpectrum(cellId = 'cell-01', method = 'local-fallback-baseline'): ImpedanceSpectrum {
  return {
    spectrumId: `eis-${cellId}`,
    deviceId: cellId,
    deviceName: `单体 ${cellId}`,
    measuredAt: formatDateTime(new Date()),
    temperature: '25.3',
    soc: '82.1',
    frequenciesHz: [0.1, 0.5, 1, 5, 10, 50, 100],
    realOhm: [0.182, 0.176, 0.17, 0.162, 0.158, 0.151, 0.148],
    imagOhm: [-0.011, -0.019, -0.026, -0.031, -0.029, -0.018, -0.01],
    method,
  };
}

export function buildDemoImpedanceDiagnosis(cellId = 'cell-01'): ImpedanceDiagnosis {
  return {
    deviceId: cellId,
    deviceName: `单体 ${cellId}`,
    diagnosisLevel: 'cell',
    score: 78.5,
    conclusion: '阻抗谱特征轻度偏移，建议继续观测',
    riskLevel: 'medium',
    features: [
      { name: 'R0', value: 0.182 },
      { name: 'Rct', value: 0.062 },
      { name: 'peak_shift', value: 0.014 },
    ],
    recommendations: ['补采高低频点位', '与温度/SOC 进行同批次对齐', '纳入后续 EIS 模型训练集'],
  };
}

export function buildDemoTelemetrySchema(): TelemetrySchema {
  return {
    schemaId: 'telemetry-battery-v1',
    topicPattern: 'battery/{station_id}/{energy_unit_id}/{cluster_id}/{cell_id}',
    mqttTopics: [
      'battery/+/+/+/telemetry',
      'battery/+/+/+/alarm',
      'battery/+/+/+/event',
    ],
    kafkaTopics: [
      'battery.telemetry.raw',
      'battery.telemetry.normalized',
      'battery.telemetry.quality',
    ],
    requiredFields: ['stationId', 'energyUnitId', 'clusterId', 'cellId', 'timestamp', 'voltage', 'current', 'temperature', 'soc'],
    fieldDefinitions: [
      { field: 'stationId', type: 'string', description: '站点唯一标识' },
      { field: 'energyUnitId', type: 'string', description: '储能单元标识' },
      { field: 'clusterId', type: 'string', description: '簇标识' },
      { field: 'cellId', type: 'string', description: '单体标识' },
      { field: 'timestamp', type: 'string', description: '采样时间' },
      { field: 'voltage', type: 'number', description: '单体电压' },
      { field: 'current', type: 'number', description: '采样电流' },
      { field: 'temperature', type: 'number', description: '单体温度' },
      { field: 'soc', type: 'number', description: '荷电状态' },
    ],
    samplePayload: {
      stationId: 'station-north-01',
      energyUnitId: 'eu-1',
      clusterId: 'cluster-4',
      cellId: 'cell-01',
      timestamp: formatDateTime(new Date()),
      voltage: 3.204,
      current: 9.5,
      temperature: 26.9,
      soc: 73.3,
    },
    qualityRules: [
      '断线时允许本地缓存，恢复后按时间戳补报',
      '同一 cellId 的重复消息按 timestamp 去重',
      '设备侧先做字段归一，再进入平台层业务处理',
      '温度、电压、SOC 需带采样单位和来源标签',
    ],
  };
}
