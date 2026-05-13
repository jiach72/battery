import React, { useEffect } from 'react';
import { Button, Table, Tooltip, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import RiskBadge from '../../components/RiskBadge';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAssessmentList } from '../../store/slices/clinicSlice';
import ConsoleMetricTile from '../../components/console/ConsoleMetricTile';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import PageEmpty from '../../components/PageEmpty';
import { getRiskTone } from '../../styles/theme';
import { riskWeight, getRiskDotClass } from '../../utils/risk';
import { usePagination } from '../../hooks/usePagination';
import { exportCsv } from '../../utils/exportCsv';

const { Text } = Typography;

type SafetyRisk = {
  type: string;
  level: string;
  desc: string;
};

type SafetyRow = {
  key: string;
  deviceId: string;
  device: string;
  highRiskCount: number;
  riskLevel: string;
  risks: SafetyRisk[];
};

export default function SafetyAssessment() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { assessmentList, loading, error } = useAppSelector((state) => state.clinic);
  const { setTotal, antdPagination } = usePagination(10);
  const riskDetailPillClassName = 'console-status-pill min-h-[44px] gap-3 px-3 py-2';
  const riskDetailLabelClassName = 'console-status-pill__label text-[12px]';
  const riskDetailValueClassName = 'console-status-pill__value text-[13px]';

  useEffect(() => {
    dispatch(fetchAssessmentList({ level: 'cell' }));
  }, [dispatch]);

  // 排序：先按最高风险等级降序，再按高风险项数降序
  const sortedData: SafetyRow[] = assessmentList.map((item) => {
    const sortedRisks = [...item.risks].sort((a, b) => riskWeight[b.level] - riskWeight[a.level]);
    return {
      key: item.deviceId,
      deviceId: item.deviceId,
      device: item.deviceName,
      highRiskCount: item.risks.filter((risk) => risk.level === 'high').length,
      riskLevel: sortedRisks[0]?.level || 'low',
      risks: item.risks.map((risk) => ({
        type: risk.description,
        level: risk.level,
        desc: `${risk.type} / ${risk.description}`,
      })),
    };
  })
    .filter((d) => d.riskLevel !== 'low') // 低风险隐藏
    .sort((a, b) => {
      const wDiff = riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
      if (wDiff !== 0) return wDiff;
      return b.highRiskCount - a.highRiskCount;
    });

  useEffect(() => {
    setTotal(sortedData.length);
  }, [sortedData.length, setTotal]);

  const retry = () => dispatch(fetchAssessmentList({ level: 'cell' }));

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={retry} />;
  }

  const handleExport = () => {
    exportCsv(sortedData.map(row => ({
      device: row.device,
      riskLevel: row.riskLevel,
      highRiskCount: row.highRiskCount,
      risks: row.risks.map(r => r.desc).join('; '),
    })), [
      { key: 'device', title: '设备' },
      { key: 'riskLevel', title: '最高风险等级' },
      { key: 'highRiskCount', title: '高风险项数' },
      { key: 'risks', title: '风险项详情' },
    ], '安全评估报告');
  };

  const columns = [
    {
      title: '设备',
      dataIndex: 'device',
      key: 'device',
      render: (device: string, record: SafetyRow) => (
        <div className="flex items-center gap-2">
          {record.riskLevel === 'high' && (
            <span className="console-status-pill__dot console-status-pill__dot--danger" />
          )}
          <span className="text-[15px] font-semibold text-[var(--console-title)]">{device}</span>
        </div>
      ),
    },
    {
      title: '最高风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (level: string) => <RiskBadge severity={level === 'high' || level === 'medium' || level === 'low' ? level : 'low'} />,
    },
    {
      title: '高风险项数',
      dataIndex: 'highRiskCount',
      key: 'highRiskCount',
      render: (count: number) => (
        <span className={`text-[15px] font-semibold tabular-nums ${count > 0 ? 'console-kpi-block__value--danger' : 'console-kpi-block__value--success'}`}>
          {count}
        </span>
      ),
    },
    {
      title: '风险项详情',
      dataIndex: 'risks',
      key: 'risks',
      render: (risks: SafetyRisk[]) => (
        <div className="space-y-1">
          {risks.map((r, i) => (
            <Tooltip key={i} title={r.desc}>
              <div className={`${riskDetailPillClassName} cursor-help`}>
                <span className={riskDetailLabelClassName}>
                  <span className={`console-status-pill__dot ${getRiskDotClass(r.level)}`} />
                  {r.type}
                </span>
                <span className={riskDetailValueClassName}>{getRiskTone(r.level).text}</span>
              </div>
            </Tooltip>
          ))}
        </div>
      ),
    },
    {
      title: '建议',
      key: 'suggestion',
      render: (_: unknown, record: SafetyRow) => {
        if (record.riskLevel === 'high') {
          return <Text type="danger" className="text-[13px] font-medium">建议立即排查</Text>;
        }
        return <Text type="warning" className="text-[13px] font-medium">建议持续关注</Text>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: SafetyRow) => (
        <Button type="link" onClick={() => navigate(`/clinic/detail?cellId=${record.deviceId}`)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ConsolePageHeader
        title="安全评估"
        subtitle="把高风险单体、风险项类型和处置建议统一到一个值守视图。"
        actions={<Button icon={<DownloadOutlined />} onClick={handleExport}>导出报告</Button>}
      />

      <div className="console-grid-hero">
        <div data-span="4"><ConsoleMetricTile label="高风险设备" value={<span className="inline-flex items-end gap-1.5 leading-none"><span>{sortedData.filter((item) => item.riskLevel === 'high').length}</span><span className="pb-1 text-[13px] font-medium text-[var(--console-text-soft)]">个</span></span>} hint="建议立即排查" tone="danger" /></div>
        <div data-span="4"><ConsoleMetricTile label="中风险设备" value={<span className="inline-flex items-end gap-1.5 leading-none"><span>{sortedData.filter((item) => item.riskLevel === 'medium').length}</span><span className="pb-1 text-[13px] font-medium text-[var(--console-text-soft)]">个</span></span>} hint="建议持续关注" tone="warning" /></div>
        <div data-span="4"><ConsoleMetricTile label="风险视图" value="低风险隐藏" hint="值守模式默认隐藏低风险噪音" /></div>
      </div>

      <ConsolePanel
        title="风险优先队列"
        subtitle="按风险级别和高风险项数排序，把排查动作集中到最前面。"
      >
        <div className="console-table-shell">
        <Table
          dataSource={sortedData}
          columns={columns}
          size="small"
          loading={loading}
          pagination={antdPagination}
        />
        </div>
      </ConsolePanel>
    </div>
  );
}
