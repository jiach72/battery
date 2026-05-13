import React, { useEffect } from 'react';
import PredictLineChart from '../../charts/PredictLineChart';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAssessmentList } from '../../store/slices/clinicSlice';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import PageEmpty from '../../components/PageEmpty';

export default function CapacityAnalysis() {
  const dispatch = useAppDispatch();
  const { assessmentList, error } = useAppSelector((state) => state.clinic);

  useEffect(() => {
    dispatch(fetchAssessmentList({ level: 'cell' }));
  }, [dispatch]);

  const retry = () => dispatch(fetchAssessmentList({ level: 'cell' }));

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={retry} />;
  }

  const averageSoh = assessmentList.length
    ? assessmentList.reduce((sum, item) => sum + item.realSoh, 0) / assessmentList.length
    : 93.2;
  const months = ['11月', '12月', '1月', '2月', '3月', '4月'];
  const actual = months.map((_, index) => Number((averageSoh + 2.1 - index * 0.45).toFixed(1)));
  const predicted = months.map((_, index) => Number((averageSoh + 0.9 - index * 0.58).toFixed(1)));

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title="容量分析"
        subtitle="用统一的诊断语言呈现当前 SOH 退化和未来容量衰减趋势。"
      />
      <ConsolePanel
        title="SOH 衰减趋势"
        subtitle="实际曲线与预测曲线共用一张图，方便值班员判断退化斜率是否异常。"
      >
        <div className="console-chart-frame">
          <PredictLineChart
            title="SOH衰减趋势"
            xData={months}
            actual={[{ name: '实际SOH', data: actual }]}
            predicted={[{ name: '预测SOH', data: predicted }]}
            unit="%"
            height={350}
          />
        </div>
      </ConsolePanel>
    </div>
  );
}
