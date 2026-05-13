import client from './client';
import type { AlarmEvent, AlarmRule, Severity, AlarmStatus } from '../types/alarm';
import type { PaginationParams, SpringPage } from '../types/api';
import { buildDemoAlarmEvents, buildDemoAlarmRules, requestWithDemoFallback } from '../mock/demoData';

interface AlarmEventPayload {
  id: number;
  ruleId: string;
  ruleName: string;
  severity?: string;
  deviceId?: string;
  deviceName?: string;
  description: string;
  conditionExpr?: string;
  triggerValue?: number;
  threshold?: number;
  status: AlarmStatus;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

interface AlarmRulePayload {
  id: string;
  name: string;
  condition: string;
  riskType: string;
  severity?: string;
  notifyType?: string;
  enabled: boolean;
}

const normalizeSeverity = (value?: string): Severity => {
  const normalized = value?.toLowerCase();
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized;
  }
  return 'low';
};

const normalizeNotifyType = (value?: string) =>
  value ? value.split(',').map((item) => item.trim()).filter(Boolean) as AlarmRule['notifyType'] : [];

const mapAlarmEvent = (event: AlarmEventPayload): AlarmEvent => ({
  id: event.id,
  ruleId: event.ruleId,
  ruleName: event.ruleName,
  severity: normalizeSeverity(event.severity),
  deviceId: event.deviceId,
  deviceName: event.deviceName,
  description: event.description,
  condition: event.conditionExpr,
  triggerValue: event.triggerValue,
  threshold: event.threshold,
  status: event.status,
  createdAt: event.createdAt,
  acknowledgedAt: event.acknowledgedAt,
  resolvedAt: event.resolvedAt,
});

const mapAlarmRule = (rule: AlarmRulePayload): AlarmRule => ({
  id: rule.id,
  name: rule.name,
  condition: rule.condition,
  riskType: rule.riskType as AlarmRule['riskType'],
  severity: normalizeSeverity(rule.severity),
  notifyType: normalizeNotifyType(rule.notifyType),
  enabled: rule.enabled,
});

export const alarmApi = {
  getEvents: (params: { severity?: Severity; status?: AlarmStatus } & PaginationParams) =>
    requestWithDemoFallback(
      () => client.get<never, SpringPage<AlarmEventPayload>>('/alarm/events', { params })
        .then((page) => ({
          ...page,
          content: (page.content || []).map(mapAlarmEvent),
        })),
      () => {
        const filtered = buildDemoAlarmEvents().filter((event) => {
          const severityMatched = !params.severity || event.severity === params.severity;
          const statusMatched = !params.status || event.status === params.status;
          return severityMatched && statusMatched;
        });
        return {
          content: filtered,
          totalElements: filtered.length,
          number: params.page ?? 0,
          size: params.pageSize ?? filtered.length,
        };
      },
      (page) => !page || !Array.isArray(page.content)
    ),
  acknowledgeEvent: (eventId: string | number) =>
    requestWithDemoFallback(
      () => client.put<never, void>(`/alarm/events/${eventId}/acknowledge`),
      () => undefined
    ),
  resolveEvent: (id: string | number) =>
    requestWithDemoFallback(
      () => client.post<never, void>(`/alarm/events/${id}/resolve`),
      () => undefined
    ),
  bulkAcknowledge: (ids: (string | number)[], note?: string) =>
    requestWithDemoFallback(
      () => client.post<never, void>('/alarm/events/bulk-acknowledge', { ids, note }),
      () => undefined
    ),
  getRules: () =>
    requestWithDemoFallback(
      () => client.get<never, AlarmRulePayload[]>('/alarm/rules').then((rules) => rules.map(mapAlarmRule)),
      () => buildDemoAlarmRules(),
      (rules) => !rules || rules.length === 0
    ),
  createRule: (data: Partial<AlarmRule>) =>
    client.post<never, AlarmRulePayload>('/alarm/rules', data).then(mapAlarmRule),
  updateRule: (ruleId: string, data: Partial<AlarmRule>) =>
    client.put<never, AlarmRulePayload>(`/alarm/rules/${ruleId}`, data).then(mapAlarmRule),
  deleteRule: (id: string) =>
    client.delete<never, void>(`/alarm/rules/${id}`),
};
