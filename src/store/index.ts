import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import authSlice from './slices/authSlice';
import authMiddleware from './middleware/authMiddleware';
import { eventsApi } from './api/eventsApi';
import { venuesApi } from './api/venuesApi';
import { artistsApi } from './api/artistsApi';
import { userProfileApi } from './api/userProfileApi';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [eventsApi.reducerPath]: eventsApi.reducer,
    [venuesApi.reducerPath]: venuesApi.reducer,
    [artistsApi.reducerPath]: artistsApi.reducer,
    [userProfileApi.reducerPath]: userProfileApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/setUser'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.user'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user'],
      },
    })
    .concat(authMiddleware)
    .concat(eventsApi.middleware)
    .concat(venuesApi.middleware)
    .concat(artistsApi.middleware)
    .concat(userProfileApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
