import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Select, message, Modal, Input, Checkbox } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import RiskBadge from '../../components/RiskBadge';
import DateRangeFilter from '../../components/DateRangeFilter';
import { usePagination } from '../../hooks/usePagination';
import { exportCsv } from '../../utils/exportCsv';
import type { AlarmEvent, Severity, AlarmStatus } from '../../types/alarm';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAlarmEvents, acknowledgeEvent, resolveEvent, bulkAcknowledgeEvents } from '../../store/slices/alarmSlice';
import ConsoleMetricTile from '../../components/console/ConsoleMetricTile';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import PageEmpty from '../../components/PageEmpty';

export default function AlarmList() {
  const dispatch = useAppDispatch();
  const { events, loading, error } = useAppSelector((state) => state.alarm);
  const [severityFilter, setSeverityFilter] = useState<Severity | undefined>();
  const [statusFilter, setStatusFilter] = useState<AlarmStatus | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<{ type: 'single' | 'bulk'; id?: string | number }>({ type: 'single' });
  const [note, setNote] = useState('');
  const { pagination, setTotal, antdPagination } = usePagination(10);
  const filterPillClassName = 'console-status-pill min-h-[52px] min-w-[164px] flex-col items-start gap-1.5 px-3 py-2.5';
  const filterPillLabelClassName = 'console-status-pill__label text-[12px] tracking-[0.1em]';
  const statusPillClassName = 'console-status-pill min-h-0 px-3 py-1.5';

  const loadEvents = useCallback(() => {
    dispatch(fetchAlarmEvents({
      severity: severityFilter,
      status: statusFilter,
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      startDate: dateRange?.[0],
      endDate: dateRange?.[1],
    })).then((action) => {
      if (action.payload && typeof action.payload === 'object' && 'totalElements' in action.payload) {
        setTotal((action.payload as { totalElements: number }).totalElements);
      }
    });
  }, [dispatch, severityFilter, statusFilter, pagination.page, pagination.pageSize, dateRange, setTotal]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={loadEvents} />;
  }

  const handleAcknowledge = async (eventId: string | number) => {
    try {
      await dispatch(acknowledgeEvent(eventId)).unwrap();
      message.success('告警已确认');
      loadEvents();
    } catch {
      message.error('确认失败');
    }
  };

  const handleResolve = async (eventId: string | number) => {
    try {
      await dispatch(resolveEvent(eventId)).unwrap();
      message.success('告警已解决');
      loadEvents();
    } catch {
      message.error('解决失败');
    }
  };

  const openNoteModal = (type: 'single' | 'bulk', id?: string | number) => {
    setNoteTarget({ type, id });
    setNote('');
    setNoteModalOpen(true);
  };

  const handleNoteConfirm = async () => {
    try {
      if (noteTarget.type === 'single' && noteTarget.id != null) {
        await dispatch(acknowledgeEvent(noteTarget.id)).unwrap();
        message.success('告警已确认');
      } else if (noteTarget.type === 'bulk') {
        await dispatch(bulkAcknowledgeEvents({ ids: selectedRowKeys as (string | number)[], note })).unwrap();
        message.success(`已批量确认 ${selectedRowKeys.length} 条告警`);
        setSelectedRowKeys([]);
      }
      setNoteModalOpen(false);
      setNote('');
      loadEvents();
    } catch {
      message.error('操作失败');
    }
  };

  const handleBulkAcknowledge = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择告警');
      return;
    }
    openNoteModal('bulk');
  };

  const handleExport = () => {
    exportCsv(events, [
      { key: 'createdAt', title: '时间' },
      { key: 'ruleName', title: '规则' },
      { key: 'severity', title: '级别' },
      { key: 'deviceName', title: '设备' },
      { key: 'description', title: '描述' },
      { key: 'triggerValue', title: '触发值' },
      { key: 'status', title: '状态' },
    ], '告警列表');
  };

  const formatTriggerValue = (event: AlarmEvent) => {
    if (event.triggerValue == null) {
      return '-';
    }
    const name = `${event.ruleName}${event.description}`;
    const unit = name.includes('温') || name.toLowerCase().includes('temp')
      ? ' ℃'
      : name.includes('SOC') || name.includes('效率')
        ? ' %'
        : name.includes('压') || name.includes('volt')
          ? ' V'
          : '';
    return `${event.triggerValue.toFixed(3)}${unit}`;
  };

  const columns = [
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, sorter: (a: AlarmEvent, b: AlarmEvent) => Date.parse(b.createdAt) - Date.parse(a.createdAt), render: (value: string) => <span className="text-[13px] tabular-nums text-[var(--console-text-soft)]">{value}</span> },
    { title: '规则', dataIndex: 'ruleName', key: 'ruleName' },
    { title: '级别', dataIndex: 'severity', key: 'severity', sorter: (a: AlarmEvent, b: AlarmEvent) => ({ high: 3, medium: 2, low: 1 }[b.severity] - { high: 3, medium: 2, low: 1 }[a.severity]), render: (s: Severity) => <RiskBadge severity={s} /> },
    { title: '设备', dataIndex: 'deviceName', key: 'deviceName', render: (value?: string) => <span className="text-[13px] font-medium text-[var(--console-title)]">{value || '演示设备'}</span> },
    { title: '描述', dataIndex: 'description', key: 'description', render: (value: string) => <span className="text-[13px] leading-[1.55] text-[var(--console-text)]">{value}</span> },
    { title: '触发值', dataIndex: 'triggerValue', key: 'triggerValue', sorter: (a: AlarmEvent, b: AlarmEvent) => (b.triggerValue ?? 0) - (a.triggerValue ?? 0), render: (_: number | undefined, record: AlarmEvent) => <span className="text-[13px] font-medium tabular-nums text-[var(--console-title)]">{formatTriggerValue(record)}</span> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: AlarmStatus) => (
        <div className={statusPillClassName}>
          <span className="console-status-pill__label text-[12px]">
            <span className={`console-status-pill__dot ${s === 'UNACK' ? 'console-status-pill__dot--danger' : s === 'ACKED' ? 'console-status-pill__dot--warning' : 'console-status-pill__dot--success'}`} />
            {s === 'UNACK' ? '未确认' : s === 'ACKED' ? '已确认' : '已解决'}
          </span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, r: AlarmEvent) => (
        <div className="flex gap-1">
          {r.status === 'UNACK' && (
            <Button size="small" type="link" className="px-0 text-[13px] font-medium" onClick={() => openNoteModal('single', r.id)}>确认</Button>
          )}
          {r.status === 'ACKED' && (
            <Button size="small" type="link" className="px-0 text-[13px] font-medium" onClick={() => handleResolve(r.id)}>解决</Button>
          )}
        </div>
      ),
    },
  ];

  const highCount = events.filter((event) => event.severity === 'high').length;
  const unackCount = events.filter((event) => event.status === 'UNACK').length;

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    getCheckboxProps: (record: AlarmEvent) => ({
      disabled: record.status !== 'UNACK',
    }),
  };

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title="告警列表"
        subtitle="值班优先关注未确认和高危告警，处置动作直接在列表内完成。"
        actions={
          <div className="flex flex-wrap gap-3">
            <div className={filterPillClassName}>
              <span className={filterPillLabelClassName}>
                <span className="console-status-pill__dot console-status-pill__dot--danger" />
                告警级别
              </span>
              <Select
                placeholder="全部"
                size="small"
                className="w-full"
                variant="borderless"
                popupMatchSelectWidth={false}
                options={[{ value: 'high', label: '高风险' }, { value: 'medium', label: '中风险' }, { value: 'low', label: '低风险' }]}
                allowClear
                value={severityFilter}
                onChange={(v) => setSeverityFilter(v)}
              />
            </div>
            <div className={filterPillClassName}>
              <span className={filterPillLabelClassName}>
                <span className="console-status-pill__dot console-status-pill__dot--warning" />
                告警状态
              </span>
              <Select
                placeholder="全部"
                size="small"
                className="w-full"
                variant="borderless"
                popupMatchSelectWidth={false}
                options={[{ value: 'UNACK', label: '未确认' }, { value: 'ACKED', label: '已确认' }, { value: 'RESOLVED', label: '已解决' }]}
                allowClear
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
              />
            </div>
            <div className={filterPillClassName}>
              <span className={filterPillLabelClassName}>
                <span className="console-status-pill__dot console-status-pill__dot--accent" />
                时间范围
              </span>
              <DateRangeFilter onChange={setDateRange} className="w-full" />
            </div>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>导出 CSV</Button>
          </div>
        }
      />

      <div className="console-grid-hero">
        <div data-span="4"><ConsoleMetricTile label="当前告警总数" value={<span className="inline-flex items-end gap-1.5 leading-none"><span>{events.length}</span><span className="pb-1 text-[13px] font-medium text-[var(--console-text-soft)]">条</span></span>} hint="当前筛选条件下的告警事件数量" tone="warning" /></div>
        <div data-span="4"><ConsoleMetricTile label="高危告警" value={<span className="inline-flex items-end gap-1.5 leading-none"><span>{highCount}</span><span className="pb-1 text-[13px] font-medium text-[var(--console-text-soft)]">条</span></span>} hint="需要优先处置的危险事件" tone={highCount ? 'danger' : 'default'} /></div>
        <div data-span="4"><ConsoleMetricTile label="未确认告警" value={<span className="inline-flex items-end gap-1.5 leading-none"><span>{unackCount}</span><span className="pb-1 text-[13px] font-medium text-[var(--console-text-soft)]">条</span></span>} hint="尚未完成人工确认的事件" tone={unackCount ? 'warning' : 'default'} /></div>
      </div>

      <ConsolePanel
        title="值班处置队列"
        subtitle="按发生时间倒序展示，支持值班员快速筛选与确认。"
        extra={
          selectedRowKeys.length > 0 ? (
            <Button type="primary" size="small" onClick={handleBulkAcknowledge}>
              批量确认 ({selectedRowKeys.length})
            </Button>
          ) : null
        }
      >
        <div className="console-table-shell">
          <Table
            dataSource={events}
            columns={columns}
            rowKey="id"
            size="small"
            loading={loading}
            pagination={antdPagination}
            rowSelection={rowSelection}
            rowClassName={(record) => `alarm-row alarm-row--${record.severity}`}
          />
        </div>
      </ConsolePanel>

      {/* Notes modal for acknowledge */}
      <Modal
        title="确认告警"
        open={noteModalOpen}
        onOk={handleNoteConfirm}
        onCancel={() => { setNoteModalOpen(false); setNote(''); }}
        okText="确认"
        cancelText="取消"
      >
        <div className="space-y-3">
          <p className="text-[13px] text-[var(--console-text-soft)]">
            {noteTarget.type === 'bulk'
              ? `将批量确认 ${selectedRowKeys.length} 条告警`
              : '确认此告警事件'}
          </p>
          <Input.TextArea
            placeholder="备注（可选）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}
