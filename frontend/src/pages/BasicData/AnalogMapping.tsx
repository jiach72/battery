import React, { useEffect, useState } from 'react';
import { Button, Table, Select, Alert } from 'antd';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAnalogs } from '../../store/slices/deviceSlice';
import ConsoleMetricTile from '../../components/console/ConsoleMetricTile';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import PageEmpty from '../../components/PageEmpty';
import type { Analog } from '../../types/analog';

const stationOptions = [{ value: 'station-north-01', label: '北区 1 号储能站' }];

const analogTypeMeta: Record<Analog['dataType'], { label: string; dotClassName: string }> = {
  voltage: { label: '电压', dotClassName: 'console-status-pill__dot--accent' },
  current: { label: '电流', dotClassName: 'console-status-pill__dot--warning' },
  temperature: { label: '温度', dotClassName: 'console-status-pill__dot--danger' },
  soc: { label: 'SOC', dotClassName: 'console-status-pill__dot--success' },
};

export default function AnalogMapping() {
  const dispatch = useAppDispatch();
  const { analogs, stations, loading, error } = useAppSelector((state) => state.device);
  const [selectedStationId, setSelectedStationId] = useState('station-north-01');

  const visibleTypes = Array.from(new Set(analogs.map((analog) => analog.dataType)));
  const visibleTypeSummary = visibleTypes.length
    ? visibleTypes.map((type) => analogTypeMeta[type].label).join(' / ')
    : '当前站点暂无映射';
  const stationOptions = stations.length
    ? stations.map((station) => ({ value: station.id, label: station.name }))
    : [{ value: 'station-north-01', label: '北区 1 号储能站' }];

  useEffect(() => {
    if (!stations.some((station) => station.id === selectedStationId) && stations[0]) {
      setSelectedStationId(stations[0].id);
    }
  }, [stations, selectedStationId]);

  useEffect(() => {
    dispatch(fetchAnalogs(selectedStationId));
  }, [dispatch, selectedStationId]);

  const retry = () => dispatch(fetchAnalogs(selectedStationId));

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={retry} />;
  }

  const columns = [
    { title: '测点编码', dataIndex: 'analogCode', key: 'analogCode' },
    { title: '映射单体', dataIndex: 'cellId', key: 'cellId' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      render: (dataType: Analog['dataType']) => {
        const meta = analogTypeMeta[dataType];

        return (
          <div className="console-status-pill">
            <span className="console-status-pill__label">
              <span className={`console-status-pill__dot ${meta.dotClassName}`} />
              {meta.label}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title="模拟量映射"
        subtitle="把采样点与单体对象的绑定关系收敛到统一工作台，便于值班与调试。"
        actions={
          <div className="console-status-pill">
            <span className="console-status-pill__label">
              <span className="console-status-pill__dot console-status-pill__dot--accent" />
              当前站点
            </span>
            <Select
              value={selectedStationId}
              size="small"
              variant="borderless"
              popupMatchSelectWidth={false}
              options={stationOptions}
              onChange={setSelectedStationId}
            />
          </div>
        }
      />

      <div className="console-grid-hero">
        <div data-span="4"><ConsoleMetricTile label="采样点数量" value={`${analogs.length} 个`} hint="当前映射表中的可见量测点" /></div>
        <div data-span="4"><ConsoleMetricTile label="数据类型覆盖" value={`${visibleTypes.length} 类`} hint={visibleTypeSummary} /></div>
        <div data-span="4"><ConsoleMetricTile label="映射状态" value={loading ? '加载中' : '已校验'} hint="当前站点映射关系可用于前端演示" tone={loading ? 'warning' : 'positive'} /></div>
      </div>

      <ConsolePanel
        title="量测点映射表"
        subtitle="值班或调试时直接定位某个测点对应的单体对象。"
        extra={
          <div className="console-status-pill">
            <span className="console-status-pill__label">
              <span className="console-status-pill__dot console-status-pill__dot--accent" />
              映射模式
            </span>
            <span className="console-status-pill__value">演示数据</span>
          </div>
        }
      >
        <Alert message="当前为演示数据模式，支持查看典型量测映射关系。" type="info" showIcon className="mb-4" />
        <div className="console-table-shell">
          <Table dataSource={analogs} columns={columns} rowKey="id" size="small" loading={loading} pagination={false} />
        </div>
      </ConsolePanel>
    </div>
  );
}
