/**
 * Centralized endpoint registry for the Snowcity frontend.
 * All paths are relative to VITE_API_BASE_URL (configured in apiClient).
 *
 * Usage with api client:
 *   api.get(endpoints.attractions.list(), { params: { active: true } })
 * or build a shareable URL with query:
 *   const url = urlWithQuery(endpoints.attractions.list(), { active: true })
 */

/**
 * Build a URL with query string.
 * - Skips null/undefined and optionally empty strings.
 * - Arrays are appended as repeated keys (foo=1&foo=2). You can switch to comma mode.
 * @param {string} path
 * @param {Record<string, any>} [params]
 * @param {{ arrayFormat?: 'repeat'|'comma', skipEmptyString?: boolean }} [opts]
 * @returns {string}
 */
export function urlWithQuery(path, params, opts = {}) {
  if (!params || typeof params !== 'object') return path;
  const { arrayFormat = 'repeat', skipEmptyString = true } = opts;
  const search = new URLSearchParams();

  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (skipEmptyString && v === '') continue;

    if (Array.isArray(v)) {
      if (arrayFormat === 'comma') {
        search.set(k, v.join(','));
      } else {
        v.forEach((val) => {
          if (val === undefined || val === null) return;
          search.append(k, String(val));
        });
      }
    } else if (typeof v === 'boolean') {
      search.set(k, v ? 'true' : 'false');
    } else {
      search.set(k, String(v));
    }
  }

  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Encode arbitrary token for safe path segments.
 * @param {string|number} id
 */
export function encodeSeg(id) {
  return encodeURIComponent(String(id));
}

const endpoints = {
  chatbot: {
    chat: () => '/api/chatbot',
  },
  // Health & Utilities
  health: {
    health: () => '/health',
    apiMeta: () => '/api',
    paymentsHealth: () => '/api/payments/health'
  },

  // Auth (User)
  auth: {
    register: () => '/api/auth/register', // POST
    login: () => '/api/auth/login',       // POST
    logout: () => '/api/auth/logout',     // POST (Auth)
    otpSend: () => '/api/auth/otp/send',  // POST
    otpVerify: () => '/api/auth/otp/verify', // POST
    passwordForgot: () => '/api/auth/password/forgot', // POST
    passwordReset: () => '/api/auth/password/reset'    // POST
  },

  // Current User
  users: {
    me: () => '/api/users/me',            // GET/PATCH (Auth)
    updateMe: () => '/api/users/me',      // PATCH (Auth)
    
    // My Bookings / Orders
    myBookings: () => '/api/bookings', // GET (Auth) - Lists Orders
    myBookingById: (id) => `/api/bookings/${encodeSeg(id)}`, // GET (Auth) - Single Order Details
    
    notifications: () => '/api/users/me/notifications' // GET (Auth)
  },

  // Attractions & Slots (Public)
  attractions: {
    list: () => '/api/attractions', // GET
    byId: (id) => `/api/attractions/${encodeSeg(id)}`, // GET
    slotsByAttraction: (id) => `/api/attractions/${encodeSeg(id)}/slots` // GET
  },
  slots: {
    list: () => '/api/slots', // GET
    byId: (id) => `/api/slots/${encodeSeg(id)}` // GET
  },

  // Catalog (Public)
  addons: {
    list: () => '/api/addons',
    byId: (id) => `/api/addons/${encodeSeg(id)}`
  },
  combos: {
    list: () => '/api/combos',
    byId: (id) => `/api/combos/${encodeSeg(id)}`,
    slots: (id) => `/api/combos/${encodeSeg(id)}/slots`
  },
  coupons: {
    list: () => '/api/coupons',
    byCode: (code) => `/api/coupons/${encodeSeg(code)}`, // GET
    apply: () => '/api/coupons/apply' // POST
  },
  offers: {
    list: () => '/api/offers',
    byId: (id) => `/api/offers/${encodeSeg(id)}`
  },
  banners: {
    list: () => '/api/banners',
    byId: (id) => `/api/banners/${encodeSeg(id)}`
  },
  pages: {
    list: () => '/api/pages',
    bySlug: (slug) => `/api/pages/slug/${encodeSeg(slug)}`,
    byId: (id) => `/api/pages/${encodeSeg(id)}`
  },
  blogs: {
    list: () => '/api/blogs',
    bySlug: (slug) => `/api/blogs/slug/${encodeSeg(slug)}`,
    byId: (id) => `/api/blogs/${encodeSeg(id)}`
  },
  gallery: {
    list: () => '/api/gallery',
    byId: (id) => `/api/gallery/${encodeSeg(id)}`
  },

  social: {
    instagram: () => '/api/social/instagram'
  },

  // Bookings & Orders (Unified)
  bookings: {
    list: () => '/api/bookings',                 // GET
    create: () => '/api/bookings',               // POST (Accepts array)
    byId: (id) => `/api/bookings/${encodeSeg(id)}`, // GET (Order Receipt)
    cancel: (id) => `/api/bookings/${encodeSeg(id)}/cancel`, // POST
    
    // Payments specific to an Order
    payphi: {
      initiate: (orderId) =>
        `/api/bookings/${encodeSeg(orderId)}/pay/payphi/initiate`, // POST
      status: (orderId) =>
        `/api/bookings/${encodeSeg(orderId)}/pay/payphi/status`    // GET
    }
  },
  
  // Legacy/Global Payments (if needed, otherwise use bookings.payphi)
  payments: {
    payphi: {
      hashPreview: () => '/api/payments/payphi/hash-preview' // POST (Debug/Admin)
    }
  }
};

export default endpoints;