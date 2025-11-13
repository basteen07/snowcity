import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import adminAuthReducer, { adminLogout } from '../features/auth/adminAuthSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import adminBookingsReducer from '../features/bookings/adminBookingsSlice';
import { adminSetAuthHandlers, adminSetAuthToken } from '../services/adminApi';

const isDev = !!import.meta.env?.DEV;
const AUTH_KEY = 'sc_admin_auth';

const safeParse = (t) => { try { return JSON.parse(t); } catch { return null; } };
const loadAuth = () => {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return undefined;
  const obj = safeParse(raw);
  if (obj?.expires_at) {
    const exp = new Date(obj.expires_at).getTime();
    if (Number.isFinite(exp) && Date.now() >= exp) { localStorage.removeItem(AUTH_KEY); return undefined; }
  }
  return obj;
};
const saveAuth = (auth) => {
  if (!auth || !auth.token) { localStorage.removeItem(AUTH_KEY); return; }
  localStorage.setItem(AUTH_KEY, JSON.stringify({ user: auth.user || null, token: auth.token, expires_at: auth.expires_at || null }));
};

const listener = createListenerMiddleware();
listener.startListening({
  predicate: (action) => action.type === 'adminAuth/setAdminCredentials' || action.type === 'adminAuth/adminLogout',
  effect: (action, api) => {
    const token = action.type === 'adminAuth/setAdminCredentials' ? action.payload?.token || null : null;
    adminSetAuthToken(token);
    saveAuth(api.getState().adminAuth);
  }
});

const preloadedState = { adminAuth: loadAuth() };

export const adminStore = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
    adminDashboard: dashboardReducer,
    adminBookings: adminBookingsReducer
  },
  preloadedState,
  middleware: (getDefault) => getDefault({ serializableCheck: { warnAfter: 64 }, immutableCheck: isDev }).prepend(listener.middleware),
  devTools: isDev
});

adminSetAuthToken(preloadedState?.adminAuth?.token || null);
adminSetAuthHandlers({
  getToken: () => adminStore.getState().adminAuth?.token || null,
  onUnauthorized: async () => {
    const token = adminStore.getState().adminAuth?.token;
    if (token) adminStore.dispatch(adminLogout());
  }
});

export default adminStore;