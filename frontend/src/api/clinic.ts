import client from './client';
import type { AssessmentItem, EndpointAnalysis } from '../types/battery';
import { buildDemoAssessmentList, buildDemoEndpointAnalysis, requestWithDemoFallback } from '../mock/demoData';

export const clinicApi = {
  getAssessmentList: (params: { deviceId?: string; level?: string; scoreRanges?: string }) =>
    requestWithDemoFallback(
      () => client.post<never, AssessmentItem[]>('/clinic/assessment-list', params),
      () => buildDemoAssessmentList(),
      (items) => !items || items.length === 0
    ),
  getEndpointAnalysis: (cellId: string, type: 'CHARGE' | 'DISCHARGE') =>
    requestWithDemoFallback(
      () => client.get<never, EndpointAnalysis>(`/clinic/cell/${cellId}/endpoint-analysis`, { params: { type } }),
      () => buildDemoEndpointAnalysis(cellId, type),
      (analysis) => !analysis || !analysis.curves || analysis.curves.length === 0
    ),
};
