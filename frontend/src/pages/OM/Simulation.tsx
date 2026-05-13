import React from 'react';
import { Form, InputNumber, Button, Table, Select, Alert } from 'antd';
import { useExportPdf } from '../../hooks/useExportPdf';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { simulatePlan } from '../../store/slices/omSlice';
import ConsoleMetricTile from '../../components/console/ConsoleMetricTile';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import PageEmpty from '../../components/PageEmpty';

const getPlanRiskTone = (riskLevel?: string) => {
  if (!riskLevel) {
    return 'default' as const;
  }

  const normalized = riskLevel.toLowerCase();
  if (normalized.includes('high') || normalized.includes('高')) {
    return 'danger' as const;
  }

  if (normalized.includes('medium') || normalized.includes('中')) {
    return 'warning' as const;
  }

  if (normalized.includes('low') || normalized.includes('低')) {
    return 'positive' as const;
  }

  return 'default' as const;
};

export default function Simulation() {
  const { exportPdf } = useExportPdf();
  const dispatch = useAppDispatch();
  const { planResult, loading, error } = useAppSelector((state) => state.om);
  const [form] = Form.useForm();

  const handleSimulate = () => {
    form.validateFields().then((values) => {
      dispatch(simulatePlan(values));
    });
  };

  const mappingColumns = [
    { title: '目标位置', dataIndex: 'targetPosition', key: 'targetPosition' },
    { title: '调入编号', dataIndex: 'insertCellId', key: 'insertCellId' },
    { title: '调换前 SOH', dataIndex: 'beforeSoh', key: 'beforeSoh', render: (value?: number) => value ? `${value}%` : '-' },
    { title: '调换后 SOH', dataIndex: 'afterSoh', key: 'afterSoh', render: (value?: number) => value ? `${value}%` : '-' },
  ];

  return (
    <div id="om-simulation" className="space-y-4">
      <ConsolePageHeader
        title="运维优化模拟"
        subtitle="把调换参数、预计收益和执行步骤收敛到同一个值守模拟视图。"
      />

      <div className="console-grid-two">
      <ConsolePanel title="运维参数" subtitle="填写储能单元和运维参数，生成调换模拟结果。">
        <Form form={form} layout="vertical">
          <Form.Item name="energyUnitId" label="储能单元" initialValue="eu-1">
            <Select
              options={[
                { value: 'eu-1', label: '北区 1 号站-1 号单元' },
                { value: 'eu-2', label: '北区 1 号站-2 号单元' },
              ]}
            />
          </Form.Item>
          <Form.Item name="replacePackCount" label="更换电池包数" rules={[{ required: true }]} initialValue={5}>
            <InputNumber min={1} max={20} className="w-full" />
          </Form.Item>
          <Form.Item name="capacityGradingCount" label="分容次数" rules={[{ required: true }]} initialValue={10}>
            <InputNumber min={1} max={100} className="w-full" />
          </Form.Item>
          <Button type="primary" onClick={handleSimulate} loading={loading} block>
            开始模拟
          </Button>
        </Form>
      </ConsolePanel>

      <ConsolePanel title="调换方案" subtitle="输出预估收益、风险和执行步骤。" extra={<Button onClick={() => exportPdf('om-simulation', '运维方案.pdf')}>导出PDF</Button>}>
        {error ? (
          <PageEmpty description={error} actionText="重试" onAction={handleSimulate} />
        ) : planResult ? (
          <div className="space-y-4">
            <div className="console-grid-hero">
              <div data-span="6">
                <ConsoleMetricTile
                  label="预计 SOH 提升"
                  value={`${planResult.estimatedSohImprovement}%`}
                  hint="基于当前参数估算的提升空间"
                  tone="positive"
                />
              </div>
              <div data-span="6">
                <ConsoleMetricTile
                  label="预计成本"
                  value={`¥${planResult.estimatedCost}`}
                  hint="当前模拟方案的总成本估算"
                />
              </div>
              <div data-span="6">
                <ConsoleMetricTile
                  label="预计时长"
                  value={planResult.estimatedDuration || '-'}
                  hint="预计执行所需时间窗口"
                />
              </div>
              <div data-span="6">
                <ConsoleMetricTile
                  label="风险等级"
                  value={planResult.riskLevel || '-'}
                  hint="用于值班决策的风险提示"
                  tone={getPlanRiskTone(planResult.riskLevel)}
                />
              </div>
            </div>
            {planResult.recommendation ? <Alert type="info" showIcon message={planResult.recommendation} /> : null}
            <div className="console-table-shell">
              <Table dataSource={planResult.mappings} columns={mappingColumns} rowKey="targetPosition" size="small" pagination={false} />
            </div>
            {planResult.steps?.length ? (
              <div className="console-soft-section">
                <div className="console-context-title">建议执行步骤</div>
                <div className="console-context-list">
                  {planResult.steps.map((step, index) => (
                    <div key={step} className="console-context-item">
                      <div className="console-context-item__label">步骤 {index + 1}</div>
                      <div className="console-context-item__meta">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <PageEmpty description="请输入参数后点击模拟" />
        )}
      </ConsolePanel>
      </div>
    </div>
  );
}
