import React, { useEffect, useMemo, useState } from 'react';
import { Button, Select, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import { diagnosisApi } from '../../api/diagnosis';
import { getAlgorithm } from './catalog';

type CompareResult = {
  method: string;
  riskLevel?: string;
  score?: number;
  methodLabel: string;
  conclusion?: string;
  spectrumMethod?: string;
  diagnosisMethod?: string;
};

export default function AlgorithmComparePage() {
  const navigate = useNavigate();
  const params = useParams();
  const algorithm = getAlgorithm(params.method);
  const versions = algorithm.versions || [];
  const [left, right] = versions;
  const [cellId, setCellId] = useState('cell-01');
  const [leftResult, setLeftResult] = useState<CompareResult | null>(null);
  const [rightResult, setRightResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);

  const resultRows = useMemo(() => {
    if (!leftResult || !rightResult) return [];
    return [
      { label: '方法', left: leftResult.methodLabel, right: rightResult.methodLabel },
      { label: '风险等级', left: leftResult.riskLevel || '--', right: rightResult.riskLevel || '--' },
      { label: '评分', left: leftResult.score?.toFixed(1) || '--', right: rightResult.score?.toFixed(1) || '--' },
      { label: '结论', left: leftResult.conclusion || '--', right: rightResult.conclusion || '--' },
    ];
  }, [leftResult, rightResult]);

  useEffect(() => {
    if (!left || !right) return;
    let active = true;
    setLoading(true);

    Promise.all([
      diagnosisApi.getImpedanceSpectrum(cellId, left.method),
      diagnosisApi.getImpedanceDiagnosis(cellId, left.method),
      diagnosisApi.getImpedanceSpectrum(cellId, right.method),
      diagnosisApi.getImpedanceDiagnosis(cellId, right.method),
    ])
      .then(([leftSpectrum, leftDiagnosis, rightSpectrum, rightDiagnosis]) => {
        if (!active) return;
        setLeftResult({
          method: left.method,
          methodLabel: `${left.version} · ${left.method}`,
          riskLevel: leftSpectrum.method ? leftDiagnosis.riskLevel : undefined,
          score: leftDiagnosis.score,
          conclusion: leftDiagnosis.conclusion,
          spectrumMethod: leftSpectrum.method,
          diagnosisMethod: leftDiagnosis.method,
        });
        setRightResult({
          method: right.method,
          methodLabel: `${right.version} · ${right.method}`,
          riskLevel: rightSpectrum.method ? rightDiagnosis.riskLevel : undefined,
          score: rightDiagnosis.score,
          conclusion: rightDiagnosis.conclusion,
          spectrumMethod: rightSpectrum.method,
          diagnosisMethod: rightDiagnosis.method,
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cellId, left, right]);

  if (!left || !right) {
    return (
      <div className="space-y-5">
        <ConsolePageHeader title={`${algorithm.name} 版本对比`} subtitle="当前还没有可对比的版本。" />
        <ConsolePanel title="提示">
          <div className="space-y-2">
            <div className="console-context-item__label">这个算法目前只有单一版本，先补版本元数据再做切换。</div>
            <Button type="primary" onClick={() => navigate(`/algorithms/${algorithm.method}`)}>
              返回详情
            </Button>
          </div>
        </ConsolePanel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title={`${algorithm.name} 版本对比`}
        subtitle="同一电芯下，按两个方法跑一遍，直接看结果差异。"
        actions={(
          <div className="flex flex-wrap gap-2">
            <div className="console-status-pill">
              <span className="console-status-pill__label">电芯</span>
              <Select
                size="small"
                variant="borderless"
                popupMatchSelectWidth={false}
                value={cellId}
                onChange={setCellId}
                options={[
                  { value: 'cell-01', label: 'cell-01' },
                  { value: 'cell-08', label: 'cell-08' },
                ]}
              />
            </div>
            <div className="console-status-pill">
              <span className="console-status-pill__label">算法</span>
              <span className="console-status-pill__value">{algorithm.method}</span>
            </div>
          </div>
        )}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {[leftResult, rightResult].map((result, index) => (
          <ConsolePanel
            key={result?.method ?? index}
            title={index === 0 ? '版本 A' : '版本 B'}
            subtitle={result?.methodLabel || '--'}
            extra={<Tag color={index === 0 ? 'green' : 'blue'}>{result?.riskLevel || '--'}</Tag>}
          >
            <div className="space-y-2">
              <div className="console-context-item__label">方法：{result?.method || '--'}</div>
              <div className="console-context-item__label">评分：{result?.score?.toFixed(1) || '--'}</div>
              <div className="console-context-item__label">结论：{result?.conclusion || '--'}</div>
              <div className="console-context-item__label">EIS 方法：{result?.spectrumMethod || '--'}</div>
            </div>
          </ConsolePanel>
        ))}
      </div>

      <ConsolePanel title="差异对照" subtitle="看同一电芯在不同方法下的结果变化。">
        <div className="grid gap-3">
          {resultRows.map((row) => (
            <div key={row.label} className="grid gap-2 md:grid-cols-[160px_1fr_1fr]">
              <div className="console-context-item__label">{row.label}</div>
              <div className="console-context-item__label">A: {row.left}</div>
              <div className="console-context-item__label">B: {row.right}</div>
            </div>
          ))}
        </div>
      </ConsolePanel>

      <ConsolePanel title="操作">
        <div className="flex flex-wrap gap-2">
          <Button type="primary" loading={loading} onClick={() => navigate(`/algorithms/${algorithm.method}`)}>
            返回详情
          </Button>
          <Button onClick={() => navigate(algorithm.route)}>打开产品页</Button>
          <Button onClick={() => navigate('/algorithms')}>回到目录</Button>
        </div>
      </ConsolePanel>
    </div>
  );
}
