import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AssessmentItem, EndpointAnalysis } from '../../types/battery';
import { clinicApi } from '../../api/clinic';

interface ClinicState {
  assessmentList: AssessmentItem[];
  currentAnalysis: EndpointAnalysis | null;
  loading: boolean;
  error: string | null;
}

const initialState: ClinicState = { assessmentList: [], currentAnalysis: null, loading: false, error: null };

export const fetchAssessmentList = createAsyncThunk(
  'clinic/fetchAssessmentList',
  (params: { deviceId?: string; level?: string; scoreRanges?: string }) =>
    clinicApi.getAssessmentList(params)
);

export const fetchEndpointAnalysis = createAsyncThunk(
  'clinic/fetchEndpointAnalysis',
  ({ cellId, type }: { cellId: string; type: 'CHARGE' | 'DISCHARGE' }) =>
    clinicApi.getEndpointAnalysis(cellId, type)
);

const clinicSlice = createSlice({
  name: 'clinic',
  initialState,
  reducers: { clearAnalysis: (state) => { state.currentAnalysis = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssessmentList.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAssessmentList.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.assessmentList = action.payload;
      })
      .addCase(fetchAssessmentList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '加载失败';
      })
      .addCase(fetchEndpointAnalysis.fulfilled, (state, action) => {
        state.currentAnalysis = action.payload;
      });
  },
});

export const { clearAnalysis } = clinicSlice.actions;
export default clinicSlice.reducer;
