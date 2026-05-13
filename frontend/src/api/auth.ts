import client from './client';
import type { LoginRequest, LoginResponse, RefreshRequest } from '../types/auth';
import { isDemoMode } from '../utils/apiError';

const buildDemoLoginResponse = (username: string): LoginResponse => ({
  token: 'demo-token',
  refreshToken: 'demo-refresh-token',
  user: {
    id: 'demo-admin',
    username,
    displayName: '值班账号',
    roles: ['admin'],
    permissions: ['*'],
  },
});

export const authApi = {
  login: (data: LoginRequest) =>
    isDemoMode()
      ? Promise.resolve(buildDemoLoginResponse(data.username || 'admin'))
      : client.post<never, LoginResponse>('/auth/login', data),
  logout: () => client.post('/auth/logout'),
  refresh: (data: RefreshRequest) => client.post<never, { token: string }>('/auth/refresh', data),
};
