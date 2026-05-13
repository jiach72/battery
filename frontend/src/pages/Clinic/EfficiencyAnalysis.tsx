import React from 'react';
import { Row, Col, Progress } from 'antd';
import { useAppSelector } from '../../store/hooks';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import { chartSeriesTokens } from '../../styles/theme';

function EfficiencyMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="console-kpi-block">
      <div className="console-kpi-block__label">{label}</div>
      <div className="flex items-end gap-2">
        <span className="console-kpi-block__value" style={{ color }}>{value}</span>
        <span className="console-kpi-block__suffix">%</span>
      </div>
      <Progress
        percent={value}
        showInfo={false}
        strokeColor={color}
        trailColor="var(--console-border-subtle)"
        size="small"
      />
    </div>
  );
}

export default function EfficiencyAnalysis() {
  const { overview } = useAppSelector((state) => state.dashboard);
  const pcsEff = overview?.pcsEfficiency || 97.3;
  const pcsDaily = Number((pcsEff - 0.6).toFixed(1));
  const tfEff = 98.6;
  const tfDaily = 98.1;

  return (
    <div className="space-y-4">
      <ConsolePageHeader
        title="效率分析"
        subtitle="统一查看 PCS 与变压器效率，快速判断转换侧是否存在异常损耗。"
      />

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <ConsolePanel title="PCS 效率" subtitle="逆变链路效率与日效率表现">
            <Row gutter={24} align="middle">
              <Col span={12}>
                <EfficiencyMetric label="累计效率" value={pcsEff} color={chartSeriesTokens.primary} />
              </Col>
              <Col span={12}>
                <EfficiencyMetric label="日效率" value={pcsDaily} color={chartSeriesTokens.primary} />
              </Col>
            </Row>
          </ConsolePanel>
        </Col>

        <Col span={12}>
          <ConsolePanel title="变压器效率" subtitle="升压侧累计效率与日效率表现">
            <Row gutter={24} align="middle">
              <Col span={12}>
                <EfficiencyMetric label="累计效率" value={tfEff} color="var(--console-success)" />
              </Col>
              <Col span={12}>
                <EfficiencyMetric label="日效率" value={tfDaily} color="var(--console-success)" />
              </Col>
            </Row>
          </ConsolePanel>
        </Col>
      </Row>
    </div>
  );
}
