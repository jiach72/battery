import type { RiskType, RiskLevel } from './battery';

/** @deprecated 使用 battery.ts 中的 RiskType */
export type RiskEnum = RiskType;
/** @deprecated 使用 battery.ts 中的 RiskLevel */
export type Severity = RiskLevel;
export type AlarmStatus = 'UNACK' | 'ACKED' | 'RESOLVED';

export interface AlarmEvent {
  id: number;
  ruleId: string;
  ruleName: string;
  severity: RiskLevel;
  deviceId?: string;
  deviceName?: string;
  description: string;
  condition?: string;
  triggerValue?: number;
  threshold?: number;
  status: AlarmStatus;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface AlarmRule {
  id: string;
  name: string;
  condition: string;
  riskType: RiskType;
  severity: RiskLevel;
  notifyType: ('websocket' | 'email' | 'sms')[] | string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}
