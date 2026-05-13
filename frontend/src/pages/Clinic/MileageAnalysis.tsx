import React, { useEffect } from 'react';
import { Button } from 'antd';
import PredictLineChart from '../../charts/PredictLineChart';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAssessmentList } from '../../store/slices/clinicSlice';
import ConsoleMetricTile from '../../components/console/ConsoleMetricTile';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import PageEmpty from '../../components/PageEmpty';

export default function MileageAnalysis() {
  const dispatch = useAppDispatch();
  const { assessmentList, error } = useAppSelector((state) => state.clinic);

  useEffect(() => {
    dispatch(fetchAssessmentList({ level: 'cell' }));
  }, [dispatch]);

  const retry = () => dispatch(fetchAssessmentList({ level: 'cell' }));

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={retry} />;
  }

  const totalMileage = assessmentList.reduce((sum, item) => sum + item.batteryMileageAmount, 0);
  const totalDailyMileage = assessmentList.reduce((sum, item) => sum + item.batteryMileageDay, 0);
  const averageCycles = assessmentList.length
    ? assessmentList.reduce((sum, item) => sum + item.usedRecycleTimes, 0) / assessmentList.length
    : 0;

  const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
  const actualMileage = months.map((_, index) => Number(((totalMileage / 12) + index * 220).toFixed(0)));
  const predictedMileage = months.map((_, index) => Number(((totalMileage / 12) + 1320 + index * 180).toFixed(0)));
  const dailyCycles = months.map((_, index) => Number((averageCycles / 22 + 28 + (index % 3)).toFixed(0)));

  return (
    <div className="space-y-4">
      <ConsolePageHeader
        title="里程分析"
        subtitle="把累计里程、日均里程和循环次数收成一张值守趋势页。"
      />

      <div className="console-grid-hero">
        <div data-span="4"><ConsoleMetricTile label="累计里程" value={`${Number(totalMileage.toFixed(0))} Ah`} hint="站内单体累计里程聚合" tone="default" /></div>
        <div data-span="4"><ConsoleMetricTile label="日均里程" value={`${Number(totalDailyMileage.toFixed(1))} Ah/天`} hint="当前站级日均里程" tone="positive" /></div>
        <div data-span="4"><ConsoleMetricTile label="已循环次数" value={`${Number(averageCycles.toFixed(0))} 次`} hint="当前平均循环次数" tone="warning" /></div>
      </div>

      <ConsolePanel title="里程趋势预测" subtitle="观测累计里程增长速度和未来磨损节奏。">
        <div className="console-chart-frame">
          <PredictLineChart
            title="累计里程趋势"
            xData={months}
            actual={[{ name: '实际里程', data: actualMileage }]}
            predicted={[{ name: '预测里程', data: predictedMileage }]}
            unit="Ah"
            height={300}
          />
        </div>
      </ConsolePanel>

      <ConsolePanel title="日循环次数趋势" subtitle="值守时关注循环次数异常抬升，避免超计划调度。">
        <div className="console-chart-frame">
          <PredictLineChart
            title="日循环次数"
            xData={months}
            actual={[{ name: '实际', data: dailyCycles }]}
            predicted={[]}
            unit="次"
            height={250}
          />
        </div>
      </ConsolePanel>
    </div>
  );
}
