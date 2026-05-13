export type AlgorithmVersion = {
  version: string;
  method: string;
  note: string;
  sampleInput: string;
  sampleOutput: string;
};

export type AlgorithmItem = {
  name: string;
  version: string;
  route: string;
  input: string;
  output: string;
  method: string;
  status: string;
  scenario: string;
  sampleInput: string;
  sampleOutput: string;
  relatedPages: string[];
  note: string;
  versions?: AlgorithmVersion[];
};

export const algorithms: AlgorithmItem[] = [
  {
    name: 'SOH 预测',
    version: 'v1',
    route: '/dashboard',
    input: '历史充放电/容量',
    output: 'SOH、寿命趋势',
    method: 'calculate_soh',
    status: '已存在',
    scenario: '看单体寿命和衰减趋势',
    sampleInput: '{"realCapacity": 268.2, "nominalCapacity": 280}',
    sampleOutput: '{"real_soh": 95.8, "theory_soh": 96.4}',
    relatedPages: ['/dashboard', '/clinic/overview'],
    note: '当前以健康评估页和总览页为主入口。',
  },
  {
    name: '微短路检测',
    version: 'v1',
    route: '/dashboard',
    input: '电压序列',
    output: '短路风险',
    method: 'detect_micro_short_circuit',
    status: '已存在',
    scenario: '看异常残差和微短路风险',
    sampleInput: '{"cellIds": ["cell-1"], "voltageData": {...}}',
    sampleOutput: '{"is_short_circuit": false, "confidence": 0.84}',
    relatedPages: ['/dashboard', '/clinic/safety'],
    note: '通常和安全评估页联动查看。',
  },
  {
    name: '析锂检测',
    version: 'v1',
    route: '/dashboard',
    input: '电流/电压序列',
    output: '析锂风险',
    method: 'detect_lithium_plating',
    status: '已存在',
    scenario: '看充电末端析锂迹象',
    sampleInput: '{"cellIds": ["cell-1"], "currentData": {...}, "voltageData": {...}}',
    sampleOutput: '{"is_lithium_plating": false, "anomaly_score": 0.21}',
    relatedPages: ['/dashboard', '/clinic/safety'],
    note: '适合在安全场景中做高优先级诊断。',
  },
  {
    name: 'DCIR 估算',
    version: 'v1',
    route: '/dashboard',
    input: '电流/电压阶跃',
    output: 'DCIR、健康指标',
    method: 'estimate_dcir',
    status: '已存在',
    scenario: '看内阻和瞬态健康',
    sampleInput: '{"cellId": "cell-1", "currentData": [..], "voltageData": [..]}',
    sampleOutput: '{"dcir_value": 0.023, "health_indicator": 0.88}',
    relatedPages: ['/dashboard', '/clinic/detail'],
    note: '可作为单体下钻中的辅助指标。',
  },
  {
    name: '一致性评分',
    version: 'v1',
    route: '/dashboard',
    input: '簇内单体特征',
    output: '一致性评分',
    method: 'calculate_consistency',
    status: '已存在',
    scenario: '看簇内离散度和异常单体',
    sampleInput: '{"clusterId": "cluster-1", "cells": [...]}',
    sampleOutput: '{"score": 92.4, "outlier_cells": []}',
    relatedPages: ['/dashboard', '/clinic/overview'],
    note: '适合放在健康评估和总览页做筛查。',
  },
  {
    name: '运维优化',
    version: 'v1',
    route: '/om',
    input: 'SOH / 约束 / 备品',
    output: '调换方案',
    method: 'optimize_plan',
    status: '已存在',
    scenario: '看换电/调换/分容策略',
    sampleInput: '{"energyUnitId": "eu-1", "replacePackCount": 5}',
    sampleOutput: '{"optimization_method": "MILP", "estimated_cost": 86000}',
    relatedPages: ['/om'],
    note: '主要用于运维模拟和方案比选。',
  },
  {
    name: '阻抗谱分析',
    version: 'v1',
    route: '/diagnosis',
    input: '频点/实虚部',
    output: 'Nyquist/Bode、风险',
    method: 'analyze_impedance_spectrum',
    status: '新增',
    scenario: '看 EIS 诊断和谱图',
    sampleInput: '{"cellId": "cell-1", "frequenciesHz": [...], "realOhm": [...], "imagOhm": [...]}',
    sampleOutput: '{"method": "deterministic-nyquist-baseline", "riskLevel": "medium"}',
    relatedPages: ['/diagnosis'],
    note: '当前是阻抗谱 baseline，可继续扩展算法切换。',
    versions: [
      {
        version: 'v1',
        method: 'deterministic-nyquist-baseline',
        note: '当前 baseline，按实虚部和频点做确定性分析。',
        sampleInput: '{"cellId": "cell-1", "frequenciesHz": [...], "realOhm": [...], "imagOhm": [...]}',
        sampleOutput: '{"riskLevel": "medium", "confidence": 0.74}',
      },
      {
        version: 'v2',
        method: 'ml-eis-prototype',
        note: '预留给后续模型版，用于对比更强的拟合/分类能力。',
        sampleInput: '{"cellId": "cell-1", "frequenciesHz": [...], "realOhm": [...], "imagOhm": [...], "temperature": 25.3, "soc": 82.1}',
        sampleOutput: '{"riskLevel": "medium", "confidence": 0.82, "explain": "model-fit"}',
      },
    ],
  },
];

export function getAlgorithm(method?: string) {
  return algorithms.find((item) => item.method === method) || algorithms[0];
}
