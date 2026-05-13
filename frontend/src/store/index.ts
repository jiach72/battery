import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import clinicReducer from './slices/clinicSlice';
import alarmReducer from './slices/alarmSlice';
import deviceReducer from './slices/deviceSlice';
import omReducer from './slices/omSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    clinic: clinicReducer,
    alarm: alarmReducer,
    device: deviceReducer,
    om: omReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
