import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AlarmEvent, AlarmRule, Severity, AlarmStatus } from '../../types/alarm';
import { alarmApi } from '../../api/alarm';

interface AlarmState {
  events: AlarmEvent[];
  rules: AlarmRule[];
  unreadCount: number;
  centerOpen: boolean;
  activeFilters: {
    severity?: Severity;
    status?: AlarmStatus;
    page?: number;
    pageSize?: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: AlarmState = {
  events: [],
  rules: [],
  unreadCount: 0,
  centerOpen: false,
  activeFilters: { page: 0, pageSize: 20 },
  loading: false,
  error: null,
};

export const fetchAlarmEvents = createAsyncThunk(
  'alarm/fetchEvents',
  (params: { severity?: Severity; status?: AlarmStatus; page?: number; pageSize?: number; startDate?: string; endDate?: string }) =>
    alarmApi.getEvents(params)
);

export const acknowledgeEvent = createAsyncThunk(
  'alarm/acknowledge',
  (eventId: string | number) => alarmApi.acknowledgeEvent(eventId)
);

export const resolveEvent = createAsyncThunk(
  'alarm/resolve',
  (eventId: string | number) => alarmApi.resolveEvent(eventId)
);

export const bulkAcknowledgeEvents = createAsyncThunk(
  'alarm/bulkAcknowledge',
  ({ ids, note }: { ids: (string | number)[]; note?: string }) => alarmApi.bulkAcknowledge(ids, note)
);

export const fetchAlarmRules = createAsyncThunk('alarm/fetchRules', () => alarmApi.getRules());
export const createRule = createAsyncThunk(
  'alarm/createRule',
  (data: Partial<AlarmRule>) => alarmApi.createRule(data)
);
export const updateRule = createAsyncThunk(
  'alarm/updateRule',
  ({ ruleId, data }: { ruleId: string; data: Partial<AlarmRule> }) => alarmApi.updateRule(ruleId, data)
);
export const deleteRule = createAsyncThunk(
  'alarm/deleteRule',
  (ruleId: string) => alarmApi.deleteRule(ruleId)
);

const alarmSlice = createSlice({
  name: 'alarm',
  initialState,
  reducers: {
    incrementUnread: (state) => { state.unreadCount += 1; },
    resetUnread: (state) => { state.unreadCount = 0; },
    setAlarmCenterOpen: (state, action: { payload: boolean }) => {
      state.centerOpen = action.payload;
    },
    setAlarmFilters: (state, action: { payload: AlarmState['activeFilters'] }) => {
      state.activeFilters = { ...state.activeFilters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlarmEvents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAlarmEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload?.content || [];
        state.unreadCount = (action.payload?.content || []).filter((e) => e.status === 'UNACK').length;
        state.activeFilters = {
          severity: action.meta.arg?.severity,
          status: action.meta.arg?.status,
          page: action.meta.arg?.page,
          pageSize: action.meta.arg?.pageSize,
        };
      })
      .addCase(fetchAlarmEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取告警事件失败';
      })
      .addCase(acknowledgeEvent.fulfilled, (state, action) => {
        const eventId = Number(action.meta.arg);
        const event = state.events.find((e) => e.id === eventId);
        if (event) { event.status = 'ACKED'; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })
      .addCase(acknowledgeEvent.rejected, (state, action) => {
        state.error = action.error.message || '确认告警失败';
      })
      .addCase(resolveEvent.fulfilled, (state, action) => {
        const eventId = Number(action.meta.arg);
        const event = state.events.find((e) => e.id === eventId);
        if (event) { event.status = 'RESOLVED'; }
      })
      .addCase(resolveEvent.rejected, (state, action) => {
        state.error = action.error.message || '解决告警失败';
      })
      .addCase(bulkAcknowledgeEvents.fulfilled, (state, action) => {
        const ids = action.meta.arg.ids.map(Number);
        state.events.forEach((event) => {
          if (ids.includes(event.id) && event.status === 'UNACK') {
            event.status = 'ACKED';
          }
        });
        state.unreadCount = state.events.filter((e) => e.status === 'UNACK').length;
      })
      .addCase(bulkAcknowledgeEvents.rejected, (state, action) => {
        state.error = action.error.message || '批量确认失败';
      })
      .addCase(fetchAlarmRules.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAlarmRules.fulfilled, (state, action) => {
        state.loading = false;
        state.rules = action.payload || [];
      })
      .addCase(fetchAlarmRules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取告警规则失败';
      })
      .addCase(createRule.fulfilled, (state, action) => {
        state.rules.push(action.payload);
      })
      .addCase(updateRule.fulfilled, (state, action) => {
        const idx = state.rules.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.rules[idx] = action.payload;
      })
      .addCase(deleteRule.fulfilled, (state, action) => {
        state.rules = state.rules.filter((r) => r.id !== action.meta.arg);
      })
      .addCase(deleteRule.rejected, (state, action) => {
        state.error = action.error.message || '删除规则失败';
      });
  },
});

export const { incrementUnread, resetUnread, setAlarmCenterOpen, setAlarmFilters } = alarmSlice.actions;
export default alarmSlice.reducer;
