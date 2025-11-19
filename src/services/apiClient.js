import axios from 'axios';

// 1. Environment Configuration
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000';

if (!API_BASE_URL && import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  console.warn('VITE_API_BASE_URL is not set. Using default: http://localhost:4000');
}

const SESSION_STORAGE_KEY = 'snow_session_id';
let guestSessionId = null;
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// 2. Session Management
const generateSessionId = () => `snow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const ensureGuestSessionId = () => {
  if (guestSessionId) return guestSessionId;
  if (!isBrowser) return null;
  try {
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      guestSessionId = stored;
      return guestSessionId;
    }
    guestSessionId = generateSessionId();
    window.localStorage.setItem(SESSION_STORAGE_KEY, guestSessionId);
    return guestSessionId;
  } catch (err) {
    guestSessionId = guestSessionId || generateSessionId();
    return guestSessionId;
  }
};

export function setGuestSessionId(id) {
  guestSessionId = id || null;
  if (isBrowser && guestSessionId) {
    try { window.localStorage.setItem(SESSION_STORAGE_KEY, guestSessionId); } catch {}
  }
}

export function getGuestSessionId() {
  return ensureGuestSessionId();
}

// 3. Axios Instance
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: false, // Set to true if using Cookies, false for Bearer token
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// 4. Auth State
let authToken = null;
let authHandlers = {
  getToken: () => authToken,
  onUnauthorized: null
};

export function setAuthToken(token) {
  authToken = token || null;
}

export function setAuthHandlers({ getToken, onUnauthorized } = {}) {
  if (typeof getToken === 'function') authHandlers.getToken = getToken;
  if (typeof onUnauthorized === 'function') authHandlers.onUnauthorized = onUnauthorized;
}

// 5. Helpers
const genReqId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const isTransientNetworkError = (err) => {
  const code = err?.code;
  const status = err?.response?.status;
  return (
    !status && (
      code === 'ECONNABORTED' || 
      code === 'ERR_NETWORK' ||  
      code === 'ENETUNREACH' ||
      code === 'EAI_AGAIN'
    )
  );
};

// normalizeApiError: Ensures the UI gets a consistent error object
const normalizeApiError = (error) => {
  if (axios.isCancel(error)) {
    return {
      canceled: true,
      message: 'Request canceled',
      status: 0,
      code: 'CANCELED',
      data: null
    };
  }
  
  const response = error?.response;
  const data = response?.data;
  
  // Try to find a human-readable message from backend
  const message =
    data?.message || 
    data?.error || 
    error?.message || 
    'An unexpected error occurred';

  const code =
    data?.code ||
    response?.headers?.['x-error-code'] ||
    error?.code ||
    null;

  return {
    message,
    status: response?.status || 0,
    code,
    data: typeof data === 'object' ? data : null
  };
};

// 6. Interceptors

// REQUEST Interceptor
http.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers['X-Request-Id'] = genReqId();

  // Attach Token
  const token = (authHandlers.getToken && authHandlers.getToken()) || authToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Attach Guest Session
  if (!config.headers['X-Session-Id']) {
    const sessionId = ensureGuestSessionId();
    if (sessionId) config.headers['X-Session-Id'] = sessionId;
  }

  // Debug Logging (Dev only)
  if (import.meta.env?.DEV) {
    // console.debug(`[API Req] ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params || '');
  }

  return config;
}, (error) => Promise.reject(error));

// RESPONSE Interceptor
http.interceptors.response.use(
  (response) => {
    if (import.meta.env?.DEV) {
      // console.debug(`[API Res] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const cfg = error?.config || {};
    const status = error?.response?.status;

    // A) Retry logic for transient network errors (GET only)
    if (cfg && cfg.method === 'get' && !cfg._retry && isTransientNetworkError(error)) {
      cfg._retry = true;
      try {
        return await http(cfg);
      } catch (e) {
        error = e;
      }
    }

    // B) 401 Unauthorized Handling (Centralized)
    // Skips auth-related endpoints to prevent infinite loops
    if (status === 401) {
      const url = cfg.url || '';
      const isAuthEndpoint = /\/api\/auth\//.test(url);
      if (!isAuthEndpoint && typeof authHandlers.onUnauthorized === 'function') {
        try { await authHandlers.onUnauthorized(); } catch { /* ignore */ }
      }
    }

    // Log actual backend error in console for easier debugging
    if (import.meta.env?.DEV && status >= 400) {
        console.error('[API Error]', error.response?.data || error.message);
    }

    return Promise.reject(normalizeApiError(error));
  }
);

// 7. Exported API Wrapper
const api = {
  async get(url, { params, headers, signal, fullResponse = false } = {}) {
    const res = await http.get(url, { params, headers, signal });
    return fullResponse ? res : res.data;
  },

  async post(url, body, { params, headers, signal, fullResponse = false } = {}) {
    const res = await http.post(url, body, { params, headers, signal });
    return fullResponse ? res : res.data;
  },

  async put(url, body, { params, headers, signal, fullResponse = false } = {}) {
    const res = await http.put(url, body, { params, headers, signal });
    return fullResponse ? res : res.data;
  },

  async patch(url, body, { params, headers, signal, fullResponse = false } = {}) {
    const res = await http.patch(url, body, { params, headers, signal });
    return fullResponse ? res : res.data;
  },

  async delete(url, { params, headers, signal, fullResponse = false } = {}) {
    const res = await http.delete(url, { params, headers, signal });
    return fullResponse ? res : res.data;
  },

  async upload(url, formData, { params, headers, signal, onUploadProgress, fullResponse = false } = {}) {
    const res = await http.post(url, formData, {
      params,
      headers: { ...(headers || {}), 'Content-Type': 'multipart/form-data' },
      signal,
      onUploadProgress
    });
    return fullResponse ? res : res.data;
  }
};

export { http, api };
export default api;