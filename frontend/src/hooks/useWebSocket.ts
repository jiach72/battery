import { useEffect, useRef, useCallback, useState } from 'react';
import client from '../api/client';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: unknown) => void;
  fallbackPollingUrl?: string;
  fallbackInterval?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const normalizeMessages = (payload: unknown) => {
  if (isRecord(payload) && Array.isArray(payload.content)) {
    return payload.content as unknown[];
  }
  return [payload];
};

const getMessageKey = (payload: unknown) => {
  if (isRecord(payload)) {
    const event = isRecord(payload.event) ? payload.event : payload;
    const keyCandidate = event.id ?? event.ruleId ?? payload.id ?? payload.ruleId;
    if (keyCandidate !== undefined && keyCandidate !== null) {
      return String(keyCandidate);
    }
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
};

export function useWebSocket({ url, onMessage, fallbackPollingUrl, fallbackInterval = 10000 }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emittedKeysRef = useRef(new Set<string>());
  // 使用 ref 存储 onMessage 回调，避免 useCallback 依赖变化导致 WebSocket 重连
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const emitOnce = useCallback((payload: unknown) => {
    const key = getMessageKey(payload);
    if (emittedKeysRef.current.has(key)) {
      return;
    }

    emittedKeysRef.current.add(key);
    onMessageRef.current?.(payload);
  }, []);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = url.replace(/^wss?:/, protocol);
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as unknown;
        emitOnce(data);
      } catch {
        emitOnce(event.data);
      }
    };
    ws.onopen = () => {
      retryCount.current = 0;
      setIsPolling(false);
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };
    ws.onclose = () => {
      if (retryCount.current < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
        retryCount.current += 1;
        setTimeout(connect, delay);
      } else if (fallbackPollingUrl) {
        setIsPolling(true);
        pollingRef.current = setInterval(async () => {
          try {
            const data = await client.get(fallbackPollingUrl);
            normalizeMessages(data).forEach(emitOnce);
          } catch { /* 轮询错误静默处理 */ }
        }, fallbackInterval);
      }
    };
    ws.onerror = () => {
      ws.close();
    };
    wsRef.current = ws;
  }, [url, fallbackPollingUrl, fallbackInterval, emitOnce]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [connect]);

  return { isPolling };
}
