import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Station, TopologyTree } from '../../types/station';
import type { Analog } from '../../types/analog';
import { deviceApi } from '../../api/device';

interface DeviceState {
  stations: Station[];
  topologyTree: TopologyTree | null;
  analogs: Analog[];
  loading: boolean;
  error: string | null;
}

const initialState: DeviceState = { stations: [], topologyTree: null, analogs: [], loading: false, error: null };

export const fetchStations = createAsyncThunk('device/fetchStations', () => deviceApi.getStations());
export const fetchTopologyTree = createAsyncThunk(
  'device/fetchTopologyTree',
  (stationId: string) => deviceApi.getTopologyTree(stationId)
);
export const fetchAnalogs = createAsyncThunk(
  'device/fetchAnalogs',
  (stationId: string) => deviceApi.getAnalogs(stationId)
);
export const createUnit = createAsyncThunk(
  'device/createUnit',
  (data: { stationId: string; name: string; capacity?: number }) => deviceApi.createUnit(data)
);
export const createCluster = createAsyncThunk(
  'device/createCluster',
  (data: { unitId: string; name: string; clusterNo?: number }) => deviceApi.createCluster(data)
);

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStations.fulfilled, (state, action) => {
        state.loading = false;
        state.stations = action.payload || [];
      })
      .addCase(fetchStations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取站点失败';
      })
      .addCase(fetchTopologyTree.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTopologyTree.fulfilled, (state, action) => {
        state.loading = false;
        state.topologyTree = action.payload || null;
      })
      .addCase(fetchTopologyTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取拓扑树失败';
      })
      .addCase(fetchAnalogs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAnalogs.fulfilled, (state, action) => {
        state.loading = false;
        state.analogs = action.payload || [];
      })
      .addCase(fetchAnalogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取模拟量失败';
      });
  },
});

export default deviceSlice.reducer;
