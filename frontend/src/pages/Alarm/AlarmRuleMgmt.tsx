import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Switch, Modal, Form, Input, Select, message, Alert, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import RiskBadge from '../../components/RiskBadge';
import type { AlarmRule, Severity } from '../../types/alarm';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAlarmRules, createRule, updateRule, deleteRule } from '../../store/slices/alarmSlice';
import ConsoleMetricTile from '../../components/console/ConsoleMetricTile';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import PageEmpty from '../../components/PageEmpty';
import { usePagination } from '../../hooks/usePagination';

export default function AlarmRuleMgmt() {
  const dispatch = useAppDispatch();
  const { rules, loading, error } = useAppSelector((state) => state.alarm);
  const { setTotal, antdPagination } = usePagination(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlarmRule | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchAlarmRules());
  }, [dispatch]);

  useEffect(() => {
    setTotal(rules.length);
  }, [rules.length, setTotal]);

  const retry = () => dispatch(fetchAlarmRules());

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={retry} />;
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await dispatch(createRule(values)).unwrap();
      message.success('规则创建成功');
      setModalOpen(false);
      form.resetFields();
    } catch {
      // validation error
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      if (editingRule) {
        await dispatch(updateRule({ ruleId: editingRule.id, data: values })).unwrap();
        message.success('规则更新成功');
        setModalOpen(false);
        setEditingRule(null);
        form.resetFields();
      }
    } catch {
      // validation error
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await dispatch(deleteRule(ruleId)).unwrap();
      message.success('规则已删除');
    } catch {
      message.error('删除失败');
    }
  };

  const handleToggleEnabled = async (ruleId: string, enabled: boolean) => {
    try {
      await dispatch(updateRule({ ruleId, data: { enabled } })).unwrap();
      message.success(enabled ? '规则已启用' : '规则已禁用');
    } catch {
      message.error('操作失败');
    }
  };

  const openCreateModal = () => {
    setEditingRule(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (rule: AlarmRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      name: rule.name,
      condition: rule.condition,
      riskType: rule.riskType,
      severity: rule.severity,
      notifyType: Array.isArray(rule.notifyType) ? rule.notifyType : (rule.notifyType ? rule.notifyType.split(',') : []),
      enabled: rule.enabled,
    });
    setModalOpen(true);
  };

  const columns = [
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    { title: '条件', dataIndex: 'condition', key: 'condition' },
    { title: '风险类型', dataIndex: 'riskType', key: 'riskType' },
    { title: '级别', dataIndex: 'severity', key: 'severity', render: (s: Severity) => <RiskBadge severity={s} /> },
    {
      title: '通知方式',
      dataIndex: 'notifyType',
      key: 'notifyType',
      render: (notifyType: AlarmRule['notifyType']) => {
        const items = Array.isArray(notifyType) ? notifyType : (notifyType ? notifyType.split(',') : []);
        return items.map((item) => <Tag key={item}>{item}</Tag>);
      }
    },
    { title: '启用', dataIndex: 'enabled', key: 'enabled', render: (e: boolean, r: AlarmRule) => <Switch checked={e} size="small" onChange={(v) => handleToggleEnabled(r.id, v)} /> },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: AlarmRule) => (
        <div className="flex gap-2">
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>编辑</Button>
          <Popconfirm title="确定删除该规则？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const enabledCount = rules.filter((rule) => rule.enabled).length;

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title="告警规则配置"
        subtitle="统一管理站级阈值、通知策略和规则启停状态。"
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>新建规则</Button>}
      />

      <div className="console-grid-hero">
        <div data-span="4"><ConsoleMetricTile label="规则总数" value={`${rules.length} 条`} hint="当前已加载的规则数量" /></div>
        <div data-span="4"><ConsoleMetricTile label="启用规则" value={`${enabledCount} 条`} hint="当前正在参与判定的规则" tone="positive" /></div>
        <div data-span="4"><ConsoleMetricTile label="通知覆盖" value="WebSocket / 邮件" hint="本地演示版默认通知路径" /></div>
      </div>

      <ConsolePanel
        title="规则列表"
        subtitle="在值班场景下保持规则可读、可控和可快速启停。"
      >
        <Alert message="规则变更会先更新演示态界面；在本地演示模式下，未必会持久化到图数据库。" type="info" showIcon className="mb-4" />
        <div className="console-table-shell">
          <Table dataSource={rules} columns={columns} rowKey="id" size="small" loading={loading} pagination={antdPagination} />
        </div>
      </ConsolePanel>

      {/* Create / Edit modal */}
      <Modal
        title={editingRule ? '编辑告警规则' : '新建告警规则'}
        open={modalOpen}
        onOk={editingRule ? handleUpdate : handleCreate}
        onCancel={() => { setModalOpen(false); setEditingRule(null); form.resetFields(); }}
      >
        <Form form={form} layout="vertical" initialValues={{ severity: 'medium', notifyType: ['websocket'], enabled: true }}>
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item name="condition" label="条件" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item name="riskType" label="风险类型" rules={[{ required: true }]}>
            <Select options={[
              { value: 'temp_risk', label: '温度风险' },
              { value: 'volt_risk', label: '电压风险' },
              { value: 'capacity_risk', label: '容量风险' },
              { value: 'short_circuit_risk', label: '微短路风险' },
              { value: 'liout_risk', label: '析锂风险' },
            ]} />
          </Form.Item>
          <Form.Item name="severity" label="级别" rules={[{ required: true }]}>
            <Select options={[{ value: 'high', label: '高' }, { value: 'medium', label: '中' }, { value: 'low', label: '低' }]} />
          </Form.Item>
          <Form.Item name="notifyType" label="通知方式">
            <Select mode="multiple" options={[
              { value: 'websocket', label: 'WebSocket' },
              { value: 'email', label: '邮件' },
              { value: 'sms', label: '短信' },
            ]} />
          </Form.Item>
          {editingRule && (
            <Form.Item name="enabled" label="启用状态" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
