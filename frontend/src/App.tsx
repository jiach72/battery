import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, App as AntApp, Skeleton } from 'antd';
import { store } from './store';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import { useTheme } from './hooks/useTheme';
import { useAppSelector } from './store/hooks';
import { darkTheme, lightTheme } from './styles/theme';
import { canManageRbac } from './utils/access';
import type { UserInfo } from './types/auth';

/* 路由级组件 — React.lazy 代码分割 */
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const RealtimeDetail = React.lazy(() => import('./pages/Dashboard/RealtimeDetail'));
const ClinicLayout = React.lazy(() => import('./layouts/ClinicLayout'));
const Overview = React.lazy(() => import('./pages/Clinic/Overview'));
const AssessmentDetail = React.lazy(() => import('./pages/Clinic/AssessmentDetail'));
const CapacityAnalysis = React.lazy(() => import('./pages/Clinic/CapacityAnalysis'));
const MileageAnalysis = React.lazy(() => import('./pages/Clinic/MileageAnalysis'));
const SafetyAssessment = React.lazy(() => import('./pages/Clinic/SafetyAssessment'));
const EfficiencyAnalysis = React.lazy(() => import('./pages/Clinic/EfficiencyAnalysis'));
const AlarmList = React.lazy(() => import('./pages/Alarm/AlarmList'));
const AlarmRuleMgmt = React.lazy(() => import('./pages/Alarm/AlarmRuleMgmt'));
const OMShell = React.lazy(() => import('./pages/OM/Simulation'));
const DeviceLedger = React.lazy(() => import('./pages/BasicData/DeviceLedger'));
const AnalogMapping = React.lazy(() => import('./pages/BasicData/AnalogMapping'));
const TelemetryIntegration = React.lazy(() => import('./pages/BasicData/TelemetryIntegration'));
const RBACManagement = React.lazy(() => import('./pages/BasicData/RBACManagement'));
const DiagnosisPage = React.lazy(() => import('./pages/Diagnosis'));
const AlgorithmsPage = React.lazy(() => import('./pages/Algorithms'));
const AlgorithmDetailPage = React.lazy(() => import('./pages/Algorithms/detail'));
const AlgorithmComparePage = React.lazy(() => import('./pages/Algorithms/compare'));

function PageSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );
}

/**
 * 路由守卫：验证用户已登录（持有有效token），否则重定向到登录页
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RoleGuard({
  children,
  allow,
  redirectTo = '/dashboard',
}: {
  children: React.ReactNode;
  allow: (user: UserInfo | null) => boolean;
  redirectTo?: string;
}) {
  const user = useAppSelector((state) => state.auth.user);
  if (!allow(user)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}

function ThemedApp() {
  const { isDark } = useTheme();

  return (
    <ConfigProvider theme={isDark ? darkTheme : lightTheme}>
      <AntApp>
        <ErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
              <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
              <Route path="/" element={<AuthGuard><MainLayout /></AuthGuard>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="dashboard/realtime" element={<RealtimeDetail />} />
                <Route path="clinic" element={<ClinicLayout />}>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<Overview />} />
                  <Route path="detail" element={<AssessmentDetail />} />
                  <Route path="capacity" element={<CapacityAnalysis />} />
                  <Route path="mileage" element={<MileageAnalysis />} />
                  <Route path="safety" element={<SafetyAssessment />} />
                  <Route path="efficiency" element={<EfficiencyAnalysis />} />
                </Route>
                <Route path="alarm" element={<AlarmList />} />
                <Route path="alarm/rules" element={<AlarmRuleMgmt />} />
                <Route path="om" element={<OMShell />} />
                <Route path="diagnosis" element={<DiagnosisPage />} />
                <Route path="algorithms" element={<AlgorithmsPage />} />
                <Route path="algorithms/:method" element={<AlgorithmDetailPage />} />
                <Route path="algorithms/:method/compare" element={<AlgorithmComparePage />} />
                <Route path="basic-data">
                  <Route path="devices" element={<DeviceLedger />} />
                  <Route path="analog" element={<AnalogMapping />} />
                  <Route path="telemetry" element={<TelemetryIntegration />} />
                  <Route
                    path="permissions"
                    element={
                      <RoleGuard allow={canManageRbac}>
                        <RBACManagement />
                      </RoleGuard>
                    }
                  />
                </Route>
              </Route>
            </Routes>
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
      </AntApp>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  );
}
