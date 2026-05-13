import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { DashboardOverview, RealtimeCluster } from '../../types/battery';
import { dashboardApi } from '../../api/dashboard';

interface DashboardState {
  selectedStation: string;
  overview: DashboardOverview | null;
  realtimeClusters: RealtimeCluster[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  selectedStation: 'eu-1',
  overview: null,
  realtimeClusters: [],
  loading: false,
  error: null,
};

export const fetchOverview = createAsyncThunk(
  'dashboard/fetchOverview',
  (energyUnitId: string) => dashboardApi.getOverview(energyUnitId)
);

export const fetchRealtimeClusters = createAsyncThunk(
  'dashboard/fetchRealtimeClusters',
  (energyUnitId: string) => dashboardApi.getRealtimeClusters(energyUnitId)
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedStation: (state, action: PayloadAction<string>) => {
      state.selectedStation = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverview.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.overview = action.payload;
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '加载失败';
      })
      .addCase(fetchRealtimeClusters.pending, (state) => { state.loading = true; })
      .addCase(fetchRealtimeClusters.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.realtimeClusters = action.payload || [];
      })
      .addCase(fetchRealtimeClusters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '加载实时数据失败';
      });
  },
});

export const { setSelectedStation } = dashboardSlice.actions;
export default dashboardSlice.reducer;
