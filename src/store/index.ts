import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import memoriesReducer from './slices/memoriesSlice';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    memories: memoriesReducer,
    user: userReducer,
    ui: uiReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
