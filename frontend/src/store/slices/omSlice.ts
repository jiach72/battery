import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { omApi } from '../../api/om';
import type { SimulatePlanResponse } from '../../api/om';

interface OmState {
  planResult: SimulatePlanResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: OmState = { planResult: null, loading: false, error: null };

export const simulatePlan = createAsyncThunk(
  'om/simulatePlan',
  (data: { energyUnitId: string; replacePackCount: number; capacityGradingCount: number }) =>
    omApi.simulatePlan(data)
);

const omSlice = createSlice({
  name: 'om',
  initialState,
  reducers: { clearPlan: (state) => { state.planResult = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(simulatePlan.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(simulatePlan.fulfilled, (state, action) => {
        state.loading = false;
        state.planResult = action.payload;
      })
      .addCase(simulatePlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '模拟失败';
      });
  },
});

export const { clearPlan } = omSlice.actions;
export default omSlice.reducer;
