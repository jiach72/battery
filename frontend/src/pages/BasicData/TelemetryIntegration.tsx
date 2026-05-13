import React, { useEffect, useState } from 'react';
import { Table, Alert, Tag } from 'antd';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import ConsoleMetricTile from '../../components/console/ConsoleMetricTile';
import PageEmpty from '../../components/PageEmpty';
import { telemetryApi, type TelemetrySchema } from '../../api/telemetry';

export default function TelemetryIntegration() {
  const [schema, setSchema] = useState<TelemetrySchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    telemetryApi.getSchema()
      .then((data) => {
        if (active) setSchema(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message || '加载失败');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={() => window.location.reload()} />;
  }

  const sampleJson = JSON.stringify(schema?.samplePayload ?? {}, null, 2);

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title="设备接入规范"
        subtitle="给客户现场对接真实 BMS / PCS / EMS / 网关时，用同一份遥测契约对齐字段、Topic 和验收口径。"
      />

      <div className="console-grid-hero">
        <div data-span="3"><ConsoleMetricTile label="Topic 规范" value={schema?.topicPattern || '--'} hint="统一 MQTT 发布路径" /></div>
        <div data-span="3"><ConsoleMetricTile label="Kafka Topic" value={`${schema?.kafkaTopics?.length || 0} 个`} hint={schema?.kafkaTopics?.join(' / ') || '--'} /></div>
        <div data-span="3"><ConsoleMetricTile label="必填字段" value={`${schema?.requiredFields?.length || 0} 项`} hint="遥测最小闭环字段" /></div>
        <div data-span="3"><ConsoleMetricTile label="质量规则" value={`${schema?.qualityRules?.length || 0} 条`} hint="断网、补报、去重、标识" /></div>
      </div>

      <ConsolePanel title="统一遥测契约" subtitle="这是后续接客户真实设备时的基础协议。">
        <Alert
          type="info"
          showIcon
          message="建议设备先通过边缘网关做协议归一，再上报统一遥测。"
          className="mb-4"
        />
        <Table
          loading={loading}
          pagination={false}
          rowKey="field"
          dataSource={schema?.fieldDefinitions || []}
          columns={[
            { title: '字段', dataIndex: 'field', key: 'field' },
            { title: '类型', dataIndex: 'type', key: 'type', render: (value: string) => <Tag>{value}</Tag> },
            { title: '说明', dataIndex: 'description', key: 'description' },
          ]}
        />
      </ConsolePanel>

      <div className="console-grid-hero">
        <div data-span="6">
          <ConsolePanel title="Sample Payload" subtitle="给客户和现场网关联调时可直接拿来对照。">
            <pre className="max-h-[420px] overflow-auto rounded-xl bg-[var(--console-soft)] p-4 text-[12px] leading-6 text-[var(--console-text)]">
              {sampleJson}
            </pre>
          </ConsolePanel>
        </div>
        <div data-span="6">
          <ConsolePanel title="联调清单" subtitle="按这个顺序推进，能把接入风险压低。">
            <div className="space-y-3">
              {(schema?.qualityRules || []).map((rule) => (
                <div key={rule} className="console-context-item">
                  <div className="console-context-item__label">{rule}</div>
                </div>
              ))}
              {(schema?.mqttTopics || []).map((topic) => (
                <div key={topic} className="console-status-pill">
                  <span className="console-status-pill__label">MQTT</span>
                  <span className="console-status-pill__value">{topic}</span>
                </div>
              ))}
            </div>
          </ConsolePanel>
        </div>
      </div>
    </div>
  );
}
