import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import telegramSlice from './slices/telegramSlice';
import cartSlice from './slices/cartSlice';
import productsSlice from './slices/productsSlice';
import categoriesSlice from './slices/categoriesSlice';
import ordersSlice from './slices/ordersSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    telegram: telegramSlice,
    cart: cartSlice,
    products: productsSlice,
    categories: categoriesSlice,
    orders: ordersSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['telegram/setWebApp'],
        ignoredPaths: ['telegram.webApp'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
