import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { UserInfo } from '../../types/auth';
import { authApi } from '../../api/auth';

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const readStoredUser = (): UserInfo | null => {
  const raw = localStorage.getItem('authUser');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    localStorage.removeItem('authUser');
    return null;
  }
};

const initialState: AuthState = {
  user: readStoredUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }) => {
    const response = await authApi.login({ username, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('authUser', JSON.stringify(response.user));
    return response;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('authUser');
  localStorage.removeItem('demoMode');

  try {
    await authApi.logout();
  } catch {
    // 忽略后端注销失败，前端状态已清理
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '登录失败';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state) => {
        // 即使API调用失败，也清理本地状态
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
