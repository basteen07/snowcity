import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000';
if (!API_BASE_URL && import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  console.warn('VITE_API_BASE_URL is not set. Requests will go to the current origin. Use a Vite proxy or set the env var.');
}

// Core axios instance
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Auth plumbing
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

export function setLanguage(lang) {
  if (lang) http.defaults.headers['Accept-Language'] = lang;
}

export function setBaseURL(url) {
  if (url) http.defaults.baseURL = url;
}

// Helpers
const genReqId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

const isTransientNetworkError = (err) => {
  const code = err?.code;
  const status = err?.response?.status;
  return (
    !status && (
      code === 'ECONNABORTED' || // timeout
      code === 'ERR_NETWORK' ||  // network offline
      code === 'ENETUNREACH' ||
      code === 'EAI_AGAIN'
    )
  );
};

// IMPORTANT: sanitize to serializable error object
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
  const status = response?.status || 0;
  const message =
    (data && (data.message || data.error)) ||
    error?.message ||
    'Request failed';
  const code =
    (data && data.code) ||
    response?.headers?.['x-error-code'] ||
    error?.code ||
    null;

  // Only serializable fields
  const out = {
    message,
    status,
    code,
    data: typeof data === 'object' ? data : null
  };

  // Tiny dev hint (still serializable)
  if (import.meta.env?.DEV) {
    out.debug = String(error?.message || '');
  }
  return out;
};

// Interceptors
http.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers['X-Request-Id'] = genReqId();
  // config.headers['X-Client'] = 'snowcity-web';

  const token = (authHandlers.getToken && authHandlers.getToken()) || authToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const cfg = error?.config || {};
    const status = error?.response?.status;

    // One retry for transient GET network errors
    if (
      cfg &&
      cfg.method === 'get' &&
      !cfg._retry &&
      isTransientNetworkError(error)
    ) {
      cfg._retry = true;
      try {
        return await http(cfg);
      } catch (e) {
        error = e;
      }
    }

    // Centralized 401 handling (skip auth endpoints)
    if (status === 401) {
      const url = cfg.url || '';
      const isAuthEndpoint = /\/api\/auth\/(login|register|otp|password)\b/.test(url);
      if (!isAuthEndpoint && typeof authHandlers.onUnauthorized === 'function') {
        try { await authHandlers.onUnauthorized(); } catch { /* no-op */ }
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

// Thin wrapper returning data by default (or full response if requested)
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
  async upload(url, formData, { params, headers, signal, fullResponse = false } = {}) {
    const res = await http.post(url, formData, {
      params,
      headers: { ...(headers || {}), 'Content-Type': 'multipart/form-data' },
      signal
    });
    return fullResponse ? res : res.data;
  }
};

export { http, api };
export default api;