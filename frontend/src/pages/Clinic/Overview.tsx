import React, { useEffect, useMemo } from 'react';
import { Select, Table, Button, Segmented } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAssessmentList } from '../../store/slices/clinicSlice';
import ConsoleMetricTile from '../../components/console/ConsoleMetricTile';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import SohTrendChart from '../../charts/SohTrendChart';
import SocHeatmap from '../../charts/SocHeatmap';
import PageEmpty from '../../components/PageEmpty';
import { getRiskTone } from '../../styles/theme';
import { riskPriority, getRiskDotClass } from '../../utils/risk';
import { exportCsv } from '../../utils/exportCsv';
const stationOptions = [
  { value: 'station-north-01', label: '北区 1 号站' },
  { value: 'station-east-02', label: '东区 2 号站' },
];

const trendRangeOptions = [
  { label: '近3月', value: '3m' },
  { label: '近6月', value: '6m' },
  { label: '近1年', value: '1y' },
] as const;

const trendRanges = {
  '3m': { labels: ['2月', '3月', '4月'], actualStartOffset: 1.1, actualStep: 0.34, predictedStartOffset: 0.5, predictedStep: 0.46 },
  '6m': { labels: ['11月', '12月', '1月', '2月', '3月', '4月'], actualStartOffset: 2.3, actualStep: 0.43, predictedStartOffset: 1.1, predictedStep: 0.58 },
  '1y': { labels: ['5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月'], actualStartOffset: 4.2, actualStep: 0.39, predictedStartOffset: 2.4, predictedStep: 0.52 },
};

const getTimestamp = (value?: string) => {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getTopRiskLevel = (levels: string[]) => {
  return levels.reduce<'low' | 'medium' | 'high'>((current, level) => {
    if (level === 'high' || level === 'medium' || level === 'low') {
      return riskPriority[level] > riskPriority[current] ? level : current;
    }

    return current;
  }, 'low');
};

export default function Overview() {
  const dispatch = useAppDispatch();
  const { assessmentList, loading, error } = useAppSelector((state) => state.clinic);
  const [selectedStation, setSelectedStation] = React.useState('station-north-01');
  const [sortMode, setSortMode] = React.useState<'risk-first' | 'soh-first'>('risk-first');
  const [trendRange, setTrendRange] = React.useState<keyof typeof trendRanges>('6m');
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchAssessmentList({ level: 'cell', deviceId: selectedStation }));
  }, [dispatch, selectedStation]);

  const retry = () => dispatch(fetchAssessmentList({ level: 'cell', deviceId: selectedStation }));

  const prioritizedAssessments = useMemo(
    () => [...assessmentList].sort((a, b) => {
      if (sortMode === 'soh-first') {
        return a.realSoh - b.realSoh;
      }

      const riskA = getTopRiskLevel(a.risks.map((risk) => risk.level));
      const riskB = getTopRiskLevel(b.risks.map((risk) => risk.level));
      const riskGap = riskPriority[riskB] - riskPriority[riskA];

      if (riskGap !== 0) {
        return riskGap;
      }

      return a.realSoh - b.realSoh;
    }),
    [assessmentList, sortMode]
  );

  const averageSoh = assessmentList.length
    ? assessmentList.reduce((sum, item) => sum + item.realSoh, 0) / assessmentList.length
    : 0;
  const averageConsistency = assessmentList.length
    ? assessmentList.reduce((sum, item) => sum + item.consistencyScore, 0) / assessmentList.length
    : 0;
  const highRiskCount = assessmentList.filter((item) => item.risks.some((risk) => risk.level === 'high')).length;
  const latestUpdate = assessmentList.reduce((latest, item) => {
    return getTimestamp(item.lastUpdateTime) > getTimestamp(latest) ? item.lastUpdateTime : latest;
  }, '--');
  const handleExport = () => {
    exportCsv(prioritizedAssessments.map(item => ({
      deviceName: item.deviceName,
      soh: item.realSoh,
      riskLevel: getTopRiskLevel(item.risks.map(r => r.level)),
      assessedAt: item.lastUpdateTime,
    })), [
      { key: 'deviceName', title: '设备名称' },
      { key: 'soh', title: 'SOH (%)' },
      { key: 'riskLevel', title: '风险等级' },
      { key: 'assessedAt', title: '评估时间' },
    ], '健康评估清单');
  };

  const averageMileage = assessmentList.length
    ? assessmentList.reduce((sum, item) => sum + item.batteryMileageAmount, 0) / assessmentList.length
    : 0;

  const trendConfig = trendRanges[trendRange];
  const trendDates = trendConfig.labels;
  const actualTrend = trendDates.map((_, index) => Number((averageSoh + trendConfig.actualStartOffset - index * trendConfig.actualStep).toFixed(1)));
  const predictedTrend = trendDates.map((_, index) => Number((averageSoh + trendConfig.predictedStartOffset - index * trendConfig.predictedStep).toFixed(1)));

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={retry} />;
  }

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title="健康评估总览"
        subtitle="把当前单体健康、风险分布和一致性状态收敛到值班员可快速判断的诊断总览。"
        actions={
          <>
            <div className="console-status-pill">
              <span className="console-status-pill__label">
                <span className="console-status-pill__dot console-status-pill__dot--accent" />
                当前站点
              </span>
              <Select
                value={selectedStation}
                size="small"
                variant="borderless"
                popupMatchSelectWidth={false}
                onChange={setSelectedStation}
                options={stationOptions}
              />
            </div>
            <div className="console-status-pill">
              <span className="console-status-pill__label">
                <span className="console-status-pill__dot console-status-pill__dot--warning" />
                排序方式
              </span>
              <Select
                value={sortMode}
                size="small"
                variant="borderless"
                popupMatchSelectWidth={false}
                onChange={(value) => setSortMode(value)}
                options={[
                  { value: 'risk-first', label: '高风险优先' },
                  { value: 'soh-first', label: 'SOH 最低优先' },
                ]}
              />
            </div>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>导出清单</Button>
          </>
        }
      />

      <div className="console-grid-hero console-grid-hero--clinic-metrics">
        <div data-span="4">
          <ConsoleMetricTile
            label="平均 SOH"
            value={`${averageSoh.toFixed(1)}%`}
            hint="当前站级单体平均健康度，低于 90% 时建议优先排查"
            tone={averageSoh < 90 ? 'warning' : 'positive'}
            trend="down"
          />
        </div>
        <div data-span="3"><ConsoleMetricTile label="平均一致性" value={averageConsistency.toFixed(1)} hint="簇内离散度综合评分" /></div>
        <div data-span="2"><ConsoleMetricTile label="高风险单体" value={`${highRiskCount} 个`} hint="建议优先排查对象" tone={highRiskCount ? 'danger' : 'default'} /></div>
        <div data-span="3"><ConsoleMetricTile label="平均累计里程" value={`${averageMileage.toFixed(0)} Ah`} hint={`最新评估 ${latestUpdate}`} /></div>
      </div>

      <div className="console-grid-hero">
        <div data-span="7">
          <div className="space-y-gutter">
            <ConsolePanel
              title="SOH 评估与预测"
              subtitle="把站级 SOH 的当前状态与未来退化速度放到同一条时间轴上。"
              extra={
                <Segmented
                  size="small"
                  value={trendRange}
                  onChange={(value) => setTrendRange(value as keyof typeof trendRanges)}
                  options={[...trendRangeOptions]}
                />
              }
            >
              <div className="console-chart-frame">
                <SohTrendChart dates={trendDates} actual={actualTrend} predicted={predictedTrend} height={390} />
              </div>
            </ConsolePanel>

            <ConsolePanel
              title="健康分布热区"
              subtitle="查看低 SOH 与不均衡单体在空间上的集中位置。"
            >
              <div className="console-chart-frame">
                <SocHeatmap height={500} />
              </div>
            </ConsolePanel>
          </div>
        </div>

        <div data-span="5">
          <div className="space-y-gutter">
            <ConsolePanel
              title="风险标签聚合"
              subtitle="值守时先看高风险，再看持续抬升中的中风险。"
            >
              <div className="space-y-3">
                {prioritizedAssessments.slice(0, 5).map((item) => (
                  <div key={item.deviceId} className="console-context-item">
                    <div className="console-context-item__label">{item.deviceName}</div>
                    <div className="console-context-list">
                      {item.risks.map((risk) => (
                        <div key={`${item.deviceId}-${risk.type}`} className="console-status-pill">
                          <span className="console-status-pill__label">
                            <span className={`console-status-pill__dot ${getRiskDotClass(risk.level)}`} />
                            {risk.description}
                          </span>
                          <span className="console-status-pill__value">{getRiskTone(risk.level).text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ConsolePanel>

            <ConsolePanel
              title="高风险单体清单"
              subtitle="按 SOH 与风险等级排序，值班员优先盯防的对象集中在这里。"
            >
              <div className="console-table-shell">
                <Table
                  dataSource={prioritizedAssessments.slice(0, 8)}
                  loading={loading}
                  pagination={false}
                  rowKey="deviceId"
                  onRow={(record) => ({
                    onClick: () => navigate(`/clinic/detail?cellId=${record.deviceId}`),
                    style: { cursor: 'pointer' },
                  })}
                  columns={[
                    { title: '设备', dataIndex: 'deviceName', key: 'deviceName' },
                    { title: '实际 SOH', dataIndex: 'realSoh', key: 'realSoh', render: (value: number) => `${value}%` },
                    { title: '理论 SOH', dataIndex: 'theorySoh', key: 'theorySoh', render: (value: number) => `${value}%` },
                    { title: '一致性', dataIndex: 'consistencyScore', key: 'consistencyScore' },
                    { title: '更新时间', dataIndex: 'lastUpdateTime', key: 'lastUpdateTime' },
                  ]}
                />
              </div>
            </ConsolePanel>
          </div>
        </div>
      </div>
    </div>
  );
}
