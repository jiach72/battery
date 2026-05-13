import client from './client';

export interface SimulatePlanRequest {
  energyUnitId: string;
  replacePackCount: number;
  capacityGradingCount: number;
}

export interface SimulatePlanResponse {
  planId: string;
  mappings: { targetPosition: string; insertCellId: string; beforeSoh?: number; afterSoh?: number }[];
  estimatedSohImprovement: number;
  estimatedCost: number;
  estimatedDuration?: string;
  riskLevel?: string;
  recommendation?: string;
  steps?: string[];
}

export const omApi = {
  simulatePlan: (data: SimulatePlanRequest) =>
    client.post<never, SimulatePlanResponse>('/om/simulate-plan', data),
};
