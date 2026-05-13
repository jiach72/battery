import { message } from 'antd';

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export function handleApiError(error: ApiError) {
  if (error.status === 401) {
    message.error('登录已过期，请重新登录');
    window.location.href = '/login';
    return;
  }
  if (error.status === 403) {
    message.error('权限不足，无法执行此操作');
    return;
  }
  if (error.status === 503) {
    message.error('服务暂时不可用，请稍后重试');
    return;
  }
  message.error(error.message || '操作失败，请稍后重试');
}

export function isDemoMode(): boolean {
  return localStorage.getItem('demoMode') === 'true'
    || import.meta.env.VITE_DEMO_MODE === 'true';
}
