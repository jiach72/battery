import axios, { type InternalAxiosRequestConfig } from 'axios';
import { isDemoMode } from '../utils/apiError';

const client = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const refreshClient = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('authUser');
};

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'code' in payload && 'data' in payload) {
      if (payload.code === 200 || payload.code === 0) {
        return payload.data;
      }
      const apiError = new Error(payload.message || '请求失败') as Error & { status: number; code?: string };
      apiError.status = response.status;
      apiError.code = String(payload.code);
      throw apiError;
    }
    return payload;
  },
  async (error) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (originalRequest && error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await refreshClient.post<{ token: string; refreshToken?: string }>('/auth/refresh', { refreshToken });
          localStorage.setItem('token', data.token);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${data.token}`,
          } as InternalAxiosRequestConfig['headers'];
          return client(originalRequest);
        } catch {
          if (!isDemoMode()) {
            clearAuthStorage();
            window.location.href = '/login';
          }
          throw error;
        }
      } else {
        if (!isDemoMode()) {
          clearAuthStorage();
          window.location.href = '/login';
        }
        throw error;
      }
    }

    const apiError = new Error(
      error.response?.data?.message || '网络错误'
    ) as Error & { status: number; code?: string };
    apiError.status = error.response?.status || 500;
    apiError.code = error.response?.data?.code;
    throw apiError;
  }
);

export default client;
