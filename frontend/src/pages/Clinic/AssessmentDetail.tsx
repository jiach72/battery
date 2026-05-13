import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchEndpointAnalysis } from '../../store/slices/clinicSlice';
import MultiAxisLineChart from '../../charts/MultiAxisLineChart';
import ConsoleMetricTile from '../../components/console/ConsoleMetricTile';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import PageEmpty from '../../components/PageEmpty';

export default function AssessmentDetail() {
  const dispatch = useAppDispatch();
  const { currentAnalysis, error } = useAppSelector((state) => state.clinic);
  const [cellId, setCellId] = useState('cell-01');
  const [analysisType, setAnalysisType] = useState<'CHARGE' | 'DISCHARGE'>('CHARGE');

  useEffect(() => {
    dispatch(fetchEndpointAnalysis({ cellId, type: analysisType }));
  }, [dispatch, cellId, analysisType]);

  const retry = () => dispatch(fetchEndpointAnalysis({ cellId, type: analysisType }));

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={retry} />;
  }

  const curves = currentAnalysis?.curves || [];
  const xData = curves.map((item) => item.timestamp.slice(11, 16));
  const voltageSeries = curves.map((item) => Number(item.voltage.toFixed(3)));
  const currentSeries = curves.map((item) => Number(item.current.toFixed(2)));
  const socSeries = curves.map((item) => Number(item.soc.toFixed(1)));
  const endpointPrefix = analysisType === 'CHARGE' ? '充电末端' : '放电末端';

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title="单体下钻分析"
        subtitle="聚焦单体端点行为，查看电压、电流、SOC 与热状态联动。"
        actions={
          <>
            <div className="console-status-pill">
              <span className="console-status-pill__label">
                <span className="console-status-pill__dot console-status-pill__dot--accent" />
                关注单体
              </span>
              <Select
                size="small"
                variant="borderless"
                popupMatchSelectWidth={false}
                value={cellId}
                onChange={setCellId}
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: `cell-${String(i + 1).padStart(2, '0')}`,
                  label: `重点单体 ${String(i + 1).padStart(2, '0')}`,
                }))}
              />
            </div>
            <div className="console-status-pill">
              <span className="console-status-pill__label">
                <span className="console-status-pill__dot console-status-pill__dot--warning" />
                工况类型
              </span>
              <Select
                size="small"
                variant="borderless"
                popupMatchSelectWidth={false}
                value={analysisType}
                onChange={(value) => setAnalysisType(value)}
                options={[
                  { value: 'CHARGE', label: '充电工况' },
                  { value: 'DISCHARGE', label: '放电工况' },
                ]}
              />
            </div>
          </>
        }
      />

      <div className="console-grid-hero">
        <div data-span="12">
          <ConsolePanel
            title="单体关键指标"
            subtitle={`把${analysisType === 'CHARGE' ? '充电' : '放电'}工况下最常用的端点极差、电压标准差和温度偏差集中到一屏。`}
          >
            <div className="console-kpi-grid">
              <ConsoleMetricTile label={`${endpointPrefix}最大极差`} value={`${(currentAnalysis?.chargeEndMaxVoltDiff || 0).toFixed(3)} V`} hint={`${endpointPrefix}最大电压极差`} />
              <ConsoleMetricTile label={`${endpointPrefix}电压标准差`} value={(currentAnalysis?.chargeEndVoltSTD || 0).toFixed(3)} hint={`${endpointPrefix}电压离散度`} />
              <ConsoleMetricTile label={`${endpointPrefix} SOC`} value={`${(currentAnalysis?.chargeEndSOC || 0).toFixed(1)} %`} hint={`当前${analysisType === 'CHARGE' ? '充电' : '放电'}工况末端 SOC`} />
              <ConsoleMetricTile label="电压偏差" value={`${(currentAnalysis?.chargeEndVoltageDeviation || 0).toFixed(1)} %`} hint={`${endpointPrefix}相对偏差`} tone="warning" />
              <ConsoleMetricTile label="最高温度" value={`${(currentAnalysis?.cellMaxTemp || 0).toFixed(1)} ℃`} hint="当前最高单体温度" tone="danger" />
              <ConsoleMetricTile label="温度极差" value={`${(currentAnalysis?.maxCellTempRange || 0).toFixed(1)} ℃`} hint="簇内温差" tone="warning" />
            </div>
          </ConsolePanel>
        </div>
        <div data-span="12">
          <ConsolePanel
            title="端点轨迹"
            subtitle="值班时直接看三轴联动曲线，而不是在多个图之间来回切换。"
          >
            <div className="console-chart-frame">
              <MultiAxisLineChart
                title="电压 / 电流 / SOC 联动曲线"
                xData={xData}
                series={[
                  { name: '电压(V)', data: voltageSeries, yAxisIndex: 0 },
                  { name: '电流(A)', data: currentSeries, yAxisIndex: 1 },
                  { name: 'SOC(%)', data: socSeries, yAxisIndex: 2 },
                ]}
                yAxes={[
                  { name: '电压', unit: 'V' },
                  { name: '电流', unit: 'A' },
                  { name: 'SOC', unit: '%', min: 0, max: 100 },
                ]}
                height={460}
              />
            </div>
          </ConsolePanel>
        </div>
      </div>
    </div>
  );
}
