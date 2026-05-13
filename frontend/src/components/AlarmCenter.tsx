import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Drawer, List, Space, Tag, Typography, message, Segmented } from 'antd';
import { BellOutlined, CheckOutlined, RightOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { acknowledgeEvent, fetchAlarmEvents, setAlarmCenterOpen } from '../store/slices/alarmSlice';
import type { AlarmEvent, AlarmStatus } from '../types/alarm';

const statusText: Record<AlarmStatus, string> = {
  UNACK: '未确认',
  ACKED: '已确认',
  RESOLVED: '已解决',
};

const severityColor: Record<AlarmEvent['severity'], string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

export default function AlarmCenter() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { events, unreadCount, centerOpen, loading, activeFilters } = useAppSelector((state) => state.alarm);
  const [showUnreadOnly, setShowUnreadOnly] = useState(true);

  useEffect(() => {
    if (centerOpen && events.length === 0) {
      dispatch(fetchAlarmEvents({ page: activeFilters.page ?? 0, pageSize: activeFilters.pageSize ?? 12 }));
    }
  }, [centerOpen, dispatch, events.length, activeFilters.page, activeFilters.pageSize]);

  const visibleEvents = useMemo(() => {
    return showUnreadOnly ? events.filter((event) => event.status === 'UNACK') : events;
  }, [events, showUnreadOnly]);

  const handleMarkOne = async (eventId: number) => {
    try {
      await dispatch(acknowledgeEvent(eventId)).unwrap();
      message.success('已确认');
      dispatch(fetchAlarmEvents({ ...activeFilters, page: activeFilters.page ?? 0, pageSize: activeFilters.pageSize ?? 12 }));
    } catch {
      message.error('确认失败');
    }
  };

  const handleOpenList = () => {
    dispatch(setAlarmCenterOpen(false));
    navigate('/alarm');
  };

  return (
    <Drawer
      title={
        <Space size={10}>
          <Badge count={unreadCount} size="small">
            <BellOutlined />
          </Badge>
          <span>告警通知中心</span>
        </Space>
      }
      open={centerOpen}
      width={420}
      onClose={() => dispatch(setAlarmCenterOpen(false))}
      destroyOnClose={false}
      extra={
        <Space>
          <Segmented
            size="small"
            value={showUnreadOnly ? 'unread' : 'all'}
            onChange={(value) => setShowUnreadOnly(value === 'unread')}
            options={[
              { label: '未读', value: 'unread' },
              { label: '全部', value: 'all' },
            ]}
          />
          <Button size="small" type="primary" onClick={handleOpenList}>
            打开列表
          </Button>
        </Space>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <Typography.Text type="secondary">共 {events.length} 条，未读 {unreadCount} 条</Typography.Text>
        <Link to="/alarm" onClick={() => dispatch(setAlarmCenterOpen(false))}>进入告警列表</Link>
      </div>

      <List
        loading={loading}
        dataSource={visibleEvents}
        locale={{ emptyText: '暂无告警' }}
        renderItem={(item) => (
          <List.Item
            className="rounded-xl border border-[var(--console-border-subtle)] mb-3 px-3 py-3"
            actions={[
              item.status === 'UNACK'
                ? <Button key="ack" size="small" icon={<CheckOutlined />} onClick={() => handleMarkOne(item.id)}>确认</Button>
                : <Button key="view" size="small" icon={<RightOutlined />} onClick={handleOpenList}>查看</Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space wrap size={8}>
                  <span className="font-medium text-[var(--console-title)]">{item.ruleName}</span>
                  <Tag color={severityColor[item.severity]}>{item.severity.toUpperCase()}</Tag>
                  <Tag>{statusText[item.status]}</Tag>
                </Space>
              }
              description={
                <div className="space-y-1">
                  <div className="text-[13px] text-[var(--console-text)]">{item.description}</div>
                  <div className="text-[12px] text-[var(--console-text-soft)]">{item.deviceName || item.deviceId || '未知设备'} · {item.createdAt}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Drawer>
  );
}
