import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import authReducer, { logout } from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';
import bannersReducer from '../features/banners/bannersSlice';
import attractionsReducer from '../features/attractions/attractionsSlice';
import combosReducer from '../features/combos/combosSlice';
import offersReducer from '../features/offers/offersSlice';
import pagesReducer from '../features/pages/pagesSlice';
import blogsReducer from '../features/blogs/blogsSlice';
import bookingsReducer from '../features/bookings/bookingsSlice';
import addonsReducer from '../features/addons/addonsSlice';
import galleryReducer from '../features/gallery/gallerySlice';

import { setAuthHandlers, setAuthToken } from '../services/apiClient';

const isDev = !!import.meta.env?.DEV;

// Local persistence (auth only)
const AUTH_STORAGE_KEY = 'sc_auth';
const safeJSONParse = (txt) => { try { return JSON.parse(txt); } catch { return null; } };
const loadAuthFromStorage = () => {
  if (typeof localStorage === 'undefined') return undefined;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return undefined;
  const obj = safeJSONParse(raw);
  if (!obj) return undefined;
  if (obj?.expires_at) {
    const expMs = new Date(obj.expires_at).getTime();
    if (Number.isFinite(expMs) && Date.now() >= expMs) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return undefined;
    }
  }
  return obj;
};
const saveAuthToStorage = (auth) => {
  try {
    if (!auth || !auth.token) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    const payload = {
      user: auth.user || null,
      token: auth.token,
      expires_at: auth.expires_at || null
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  } catch { /* no-op */ }
};
const throttle = (fn, wait = 300) => {
  let last = 0, t;
  return (...args) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      if (t) { clearTimeout(t); t = null; }
      last = now;
      fn(...args);
    } else if (!t) {
      t = setTimeout(() => {
        last = Date.now();
        t = null;
        fn(...args);
      }, remaining);
    }
  };
};

// Preload from storage (auth only)
const preloadedState = { auth: loadAuthFromStorage() };

// Listener middleware: keep axios token in sync
const listenerMiddleware = createListenerMiddleware();
listenerMiddleware.startListening({
  predicate: (action) =>
    action.type === 'auth/setCredentials' || action.type === 'auth/logout',
  effect: (action) => {
    const token = action.type === 'auth/setCredentials'
      ? action.payload?.token || null
      : null;
    setAuthToken(token);
  }
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    banners: bannersReducer,
    attractions: attractionsReducer,
    combos: combosReducer,
    offers: offersReducer,
    pages: pagesReducer,
    blogs: blogsReducer,
    bookings: bookingsReducer,
    addons: addonsReducer,
    gallery: galleryReducer
  },
  preloadedState,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: { warnAfter: 64 },
      immutableCheck: isDev
    }).prepend(listenerMiddleware.middleware),
  devTools: isDev
});

// Initialize api client + 401 handler
setAuthToken(store.getState().auth?.token || null);
setAuthHandlers({
  getToken: () => store.getState().auth?.token || null,
  onUnauthorized: async () => {
    const token = store.getState().auth?.token;
    if (token) store.dispatch(logout());
  }
});

// Persist auth on changes (throttled)
store.subscribe(
  throttle(() => saveAuthToStorage(store.getState().auth), 500)
);

export default store;