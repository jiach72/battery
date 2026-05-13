import client from './client';
import { buildDemoDiagnosisCases, buildDemoImpedanceDiagnosis, buildDemoImpedanceSpectrum, requestWithDemoFallback } from '../mock/demoData';

export interface DiagnosisCase {
  caseId: string;
  deviceId: string;
  deviceName: string;
  diagnosisType: string;
  conclusion: string;
  riskLevel: string;
  confidence: number;
  detectedAt: string;
  evidence: { type: string; value: number; description: string }[];
  recommendations: string[];
}

export interface ImpedanceSpectrum {
  spectrumId: string;
  deviceId: string;
  deviceName: string;
  measuredAt: string;
  temperature: string;
  soc: string;
  frequenciesHz: number[];
  realOhm: number[];
  imagOhm: number[];
  method: string;
}

export interface ImpedanceSpectrumRequest {
  cellId: string;
  method?: string;
}

export interface ImpedanceDiagnosis {
  deviceId: string;
  deviceName: string;
  diagnosisLevel: string;
  score: number;
  method?: string;
  conclusion: string;
  riskLevel: string;
  features: { name: string; value: number }[];
  recommendations: string[];
}

export const diagnosisApi = {
  getCases: () =>
    requestWithDemoFallback(
      () => client.get<never, DiagnosisCase[]>('/diagnosis/cases'),
      () => buildDemoDiagnosisCases(),
      (items) => !items || items.length === 0
    ),
  getCurrentCase: (caseId = 'case-001') =>
    requestWithDemoFallback(
      () => client.get<never, DiagnosisCase>('/diagnosis/cases/current', { params: { caseId } }),
      () => buildDemoDiagnosisCases().find((item) => item.caseId === caseId) || buildDemoDiagnosisCases()[0],
      (item) => !item || !item.caseId
    ),
  getImpedanceSpectrum: (cellId: string, method = 'deterministic-nyquist-baseline') =>
    requestWithDemoFallback(
      () => client.get<never, ImpedanceSpectrum>('/impedance/spectrum', { params: { cellId, method } }),
      () => buildDemoImpedanceSpectrum(cellId, method),
      (item) => !item || !item.spectrumId
    ),
  getImpedanceDiagnosis: (cellId: string, method = 'deterministic-nyquist-baseline') =>
    requestWithDemoFallback(
      () => client.get<never, ImpedanceDiagnosis>('/impedance/diagnosis', { params: { cellId, method } }),
      () => ({ ...buildDemoImpedanceDiagnosis(cellId), method }),
      (item) => !item || !item.deviceId
    ),
};
