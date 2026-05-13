import React, { useCallback } from 'react';
import { Badge, notification } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { incrementUnread } from '../store/slices/alarmSlice';
import type { AlarmEvent } from '../types/alarm';

// TODO: This component is currently not rendered anywhere in the app.
// It should be integrated into the topbar layout when the alarm system is fully wired up.

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const extractEvent = (data: unknown): AlarmEvent | null => {
  if (isRecord(data) && isRecord(data.event)) {
    return data.event as unknown as AlarmEvent;
  }

  if (
    isRecord(data)
    && typeof data.id === 'number'
    && typeof data.ruleName === 'string'
    && typeof data.description === 'string'
    && typeof data.status === 'string'
    && typeof data.createdAt === 'string'
  ) {
    return data as unknown as AlarmEvent;
  }

  return null;
};

export default function AlarmNotification() {
  const dispatch = useAppDispatch();
  const { unreadCount } = useAppSelector((state) => state.alarm);
  const authToken = useAppSelector((state) => state.auth.token);
  const [api, contextHolder] = notification.useNotification();

  const handleMessage = useCallback((data: unknown) => {
    const event = extractEvent(data);
    if (event) {
      dispatch(incrementUnread());
      api.warning({
        message: `告警: ${event.ruleName}`,
        description: event.description,
        placement: 'topRight',
        duration: 5,
      });
    }
  }, [dispatch, api]);

  const { isPolling } = useWebSocket({
    url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/alarm${authToken ? `?token=${encodeURIComponent(authToken)}` : ''}`,
    onMessage: handleMessage,
    fallbackPollingUrl: '/alarm/events?status=UNACK',
    fallbackInterval: 10000,
  });

  return (
    <>
      {contextHolder}
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <BellOutlined className="text-lg cursor-pointer" />
      </Badge>
      {isPolling && (
        <span className="ml-1 text-[12px] text-[var(--console-warning)]">轮询中</span>
      )}
    </>
  );
}
