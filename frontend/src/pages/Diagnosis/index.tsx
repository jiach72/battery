import React, { useEffect, useMemo, useState } from 'react';
import { Button, Select, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import ConsoleMetricTile from '../../components/console/ConsoleMetricTile';
import PageEmpty from '../../components/PageEmpty';
import { diagnosisApi, type DiagnosisCase, type ImpedanceSpectrum, type ImpedanceDiagnosis } from '../../api/diagnosis';
import ImpedanceNyquistChart from '../../charts/ImpedanceNyquistChart';
import ImpedanceBodeChart from '../../charts/ImpedanceBodeChart';

const fallbackCases = [
  { caseId: 'case-001', deviceId: 'cell-01', deviceName: '北区1号站-2号单元-簇4-单体01' },
  { caseId: 'case-002', deviceId: 'cell-08', deviceName: '北区1号站-2号单元-簇7-单体08' },
];

export default function DiagnosisPage() {
  const [caseId, setCaseId] = useState('case-001');
  const [cases, setCases] = useState<DiagnosisCase[]>([]);
  const [diagnosisCase, setDiagnosisCase] = useState<DiagnosisCase | null>(null);
  const [spectrum, setSpectrum] = useState<ImpedanceSpectrum | null>(null);
  const [diagnosis, setDiagnosis] = useState<ImpedanceDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const methodOptions = [
    { value: 'deterministic-nyquist-baseline', label: 'baseline' },
    { value: 'ml-eis-prototype', label: 'prototype' },
  ];
  const [method, setMethod] = useState(methodOptions[0].value);

  useEffect(() => {
    let active = true;
    setCasesLoading(true);

    diagnosisApi.getCases()
      .then((items) => {
        if (!active) return;
        setCases(items);
        setCaseId((current) => {
          if (items.some((item) => item.caseId === current)) return current;
          return items[0]?.caseId || current;
        });
      })
      .catch(() => {
        if (active) setCases([]);
      })
      .finally(() => {
        if (active) setCasesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const selectedCase = cases.find((item) => item.caseId === caseId);
    const selectedFallback = fallbackCases.find((item) => item.caseId === caseId);
    const deviceId = selectedCase?.deviceId || selectedFallback?.deviceId || 'cell-01';

    Promise.all([
      diagnosisApi.getCurrentCase(caseId),
      diagnosisApi.getImpedanceSpectrum(deviceId, method),
      diagnosisApi.getImpedanceDiagnosis(deviceId),
    ])
      .then(([caseResp, spectrumResp, diagnosisResp]) => {
        if (!active) return;
        setDiagnosisCase(caseResp);
        setSpectrum(spectrumResp);
        setDiagnosis(diagnosisResp);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message || '加载失败');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [caseId, cases, method]);

  const evidenceColumns: ColumnsType<{ type: string; value: number; description: string }> = [
    { title: '证据类型', dataIndex: 'type', key: 'type', render: (value: string) => <Tag>{value}</Tag> },
    { title: '数值', dataIndex: 'value', key: 'value' },
    { title: '说明', dataIndex: 'description', key: 'description' },
  ];

  const bodeMagnitude = useMemo(() => {
    if (!spectrum) return [];
    return spectrum.realOhm.map((real, index) => Number(Math.hypot(real, spectrum.imagOhm[index] ?? 0).toFixed(3)));
  }, [spectrum]);

  const bodePhase = useMemo(() => {
    if (!spectrum) return [];
    return spectrum.realOhm.map((real, index) => Number((Math.atan2(spectrum.imagOhm[index] ?? 0, real) * 180 / Math.PI).toFixed(1)));
  }, [spectrum]);

  const visibleCases = cases.length ? cases : fallbackCases;

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title="故障诊断与阻抗谱"
        subtitle="先把故障诊断链路和 EIS 数据契约立住，后续再替换成真实采集与算法。"
        actions={
          <div className="flex flex-wrap gap-2">
            <div className="console-status-pill">
              <span className="console-status-pill__label">诊断案例</span>
              <Select
                size="small"
                variant="borderless"
                popupMatchSelectWidth={false}
                value={caseId}
                onChange={setCaseId}
                options={visibleCases.map((item) => ({ value: item.caseId, label: item.deviceName || item.caseId }))}
              />
            </div>
            <div className="console-status-pill">
              <span className="console-status-pill__label">算法</span>
              <Select
                size="small"
                variant="borderless"
                popupMatchSelectWidth={false}
                value={method}
                onChange={setMethod}
                options={methodOptions}
              />
            </div>
            <Button onClick={() => navigate('/algorithms/analyze_impedance_spectrum/compare')}>
              版本对比
            </Button>
          </div>
        }
      />

      <div className="console-grid-hero">
        <div data-span="3"><ConsoleMetricTile label="诊断置信度" value={`${((diagnosisCase?.confidence || 0) * 100).toFixed(0)}%`} tone="positive" /></div>
        <div data-span="3"><ConsoleMetricTile label="风险等级" value={diagnosisCase?.riskLevel || '--'} tone="warning" /></div>
        <div data-span="3"><ConsoleMetricTile label="EIS 方法" value={spectrum?.method || '--'} /></div>
        <div data-span="3"><ConsoleMetricTile label="诊断评分" value={`${(diagnosis?.score || 0).toFixed(1)}`} tone="warning" /></div>
      </div>

      <div className="console-grid-hero">
        <div data-span="6">
          <ConsolePanel title="故障案例" subtitle="一次诊断事件的结论、证据和处置建议。">
            <div className="mb-3 flex flex-wrap gap-2">
              {visibleCases.map((item) => (
                <button
                  key={item.caseId}
                  type="button"
                  onClick={() => setCaseId(item.caseId)}
                  className={`rounded-full px-3 py-1 text-[12px] transition ${caseId === item.caseId ? 'bg-[var(--console-primary)] text-white' : 'bg-[var(--console-soft)] text-[var(--console-text)]'}`}
                >
                  {item.deviceName || item.caseId}
                </button>
              ))}
            </div>
            <Table
              loading={loading || casesLoading}
              pagination={false}
              rowKey="type"
              dataSource={diagnosisCase?.evidence || []}
              columns={evidenceColumns}
            />
            <div className="mt-4 space-y-2">
              {(diagnosisCase?.recommendations || []).map((item) => (
                <div key={item} className="console-context-item__label">{item}</div>
              ))}
            </div>
          </ConsolePanel>
        </div>

        <div data-span="6">
          <ConsolePanel title="阻抗谱概览" subtitle="Nyquist 与 Bode 双视图。">
            {spectrum ? (
              <div className="space-y-4">
                <ImpedanceNyquistChart real={spectrum.realOhm} imag={spectrum.imagOhm} />
                <ImpedanceBodeChart frequency={spectrum.frequenciesHz} magnitude={bodeMagnitude} phase={bodePhase} />
              </div>
            ) : null}
          </ConsolePanel>
          <ConsolePanel title="阻抗诊断结论" subtitle="EIS baseline 结果。">
            <div className="space-y-2">
              <div className="console-context-item__label">{diagnosis?.conclusion || '--'}</div>
              <div className="console-context-item__label">风险等级：{diagnosis?.riskLevel || '--'}</div>
              <div className="console-context-item__label">设备：{diagnosis?.deviceName || '--'}</div>
              <div className="console-context-item__label">评分：{diagnosis?.score?.toFixed(1) || '--'}</div>
              <div className="console-context-item__label">当前算法：{spectrum?.method || method}</div>
            </div>
          </ConsolePanel>
        </div>
      </div>
    </div>
  );
}
