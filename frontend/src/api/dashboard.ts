import client from './client';
import type { DashboardOverview, RealtimeCluster } from '../types/battery';
import { buildDemoDashboardOverview, buildDemoRealtimeClusters, requestWithDemoFallback } from '../mock/demoData';

export const dashboardApi = {
  getOverview: (energyUnitId: string) =>
    requestWithDemoFallback(
      () => client.get<never, DashboardOverview>('/dashboard/overview', { params: { energyUnitId } }),
      () => buildDemoDashboardOverview(energyUnitId),
      (overview) => !overview || !overview.totalCapacity || !overview.alarmCount
    ),
  getRealtimeClusters: (energyUnitId: string) =>
    requestWithDemoFallback(
      () => client.get<never, RealtimeCluster[]>('/dashboard/realtime/clusters', { params: { energyUnitId } }),
      () => buildDemoRealtimeClusters(energyUnitId),
      (clusters) => !clusters || clusters.length === 0
    ),
};
