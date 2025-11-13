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
  // Health & Utilities
  health: {
    health: () => '/health',
    apiMeta: () => '/api',
    paymentsHealth: () => '/api/payments/health',
    payphiHashPreview: () => '/api/payments/payphi/hash-preview' // POST
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
    myBookings: () => '/api/users/me/bookings', // GET (Auth)
    myBookingById: (id) => `/api/users/me/bookings/${encodeSeg(id)}`, // GET (Auth)
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

  bookings: {
    list: () => '/api/bookings',
    create: () => '/api/bookings',
    byId: (id) => `/api/bookings/${encodeSeg(id)}`,
    cancel: (id) => `/api/bookings/${encodeSeg(id)}/cancel`,
    otp: {
      send: () => '/api/bookings/otp/send',     // POST
      verify: () => '/api/bookings/otp/verify'  // POST
    }
  },
  payments: {
    payphi: {
      initiate: (bookingId) => `/api/bookings/${encodeSeg(bookingId)}/pay/payphi/initiate`,
      status: (bookingId) => `/api/bookings/${encodeSeg(bookingId)}/pay/payphi/status`
    },
    // ... keep razorpay/phonepe if you had them
  },
  cart: {
    me: () => '/api/cart', // GET (optional auth; guests use x-session-id)
    items: () => '/api/cart/items', // POST
    itemById: (id) => `/api/cart/items/${encodeSeg(id)}`, // PUT/DELETE
    payphi: {
      initiate: () => '/api/cart/pay/payphi/initiate',
      status: () => '/api/cart/pay/payphi/status'
    }
  },
  users: {
    me: () => '/api/users/me',
    updateMe: () => '/api/users/me',
    myBookings: () => '/api/users/me/bookings',
    myBookingById: (id) => `/api/users/me/bookings/${encodeSeg(id)}`,
    notifications: () => '/api/users/me/notifications'
  }

  
};

export default endpoints;