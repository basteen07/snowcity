import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';
import dayjs from 'dayjs';
import { setCredentials } from '../auth/authSlice';

const toYMD = (d) => dayjs(d).format('YYYY-MM-DD');

const toErr = (e, msg) =>
  e && typeof e === 'object'
    ? { message: e.message || msg, status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || msg) };

const normalizePhone = (raw) => {
  if (!raw) return '';
  const s = String(raw).trim();
  const hasPlus = s.startsWith('+');
  const digits = s.replace(/[^\d]/g, '');
  return hasPlus ? `+${digits}` : digits;
};

const normalizePayphiInitiateResponse = (payload, bookingId) => {
  const response = (payload && typeof payload === 'object' && payload.response) || payload?.raw || {};

  const rawCode =
    payload?.responseCode ??
    response?.responseCode ??
    payload?.respCode ??
    response?.respCode ??
    payload?.code ??
    response?.code ??
    null;
  const responseCode = rawCode ? String(rawCode).toUpperCase() : null;

  const responseMessage =
    payload?.responseMessage ??
    response?.responseMessage ??
    payload?.respMessage ??
    response?.respMessage ??
    payload?.message ??
    response?.message ??
    null;

  const tranCtx =
    payload?.tranCtx ??
    payload?.tranctx ??
    response?.tranCtx ??
    response?.tranctx ??
    null;

  let redirectUrl =
    payload?.redirectUrl ??
    payload?.redirectURL ??
    payload?.redirectUri ??
    response?.redirectUrl ??
    response?.redirectURL ??
    response?.redirectUri ??
    response?.redirectURI ??
    null;

  if (redirectUrl && tranCtx && !redirectUrl.includes('tranCtx=')) {
    const sep = redirectUrl.includes('?') ? '&' : '?';
    redirectUrl = `${redirectUrl}${sep}tranCtx=${encodeURIComponent(tranCtx)}`;
  }

  const ok = responseCode === 'R1000';

  return {
    ...payload,
    bookingId, // This is effectively the Order ID now
    responseCode,
    responseMessage,
    tranCtx,
    redirectUrl,
    ok
  };
};

// --- HELPER: Extract ID from various casing possibilities ---
const getVal = (obj, keys) => {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return null;
};

// --- FIX: Strict Whitelisting to prevent DB Constraint Violations ---
const normalizeBookingCreatePayload = (p = {}) => {
  // 1. Determine Type
  const rawType = p.item_type || p.itemType || '';
  const hasComboId = !!getVal(p, ['combo_id', 'comboId']);
  const hasAttrId = !!getVal(p, ['attraction_id', 'attractionId']);

  let isCombo = false;
  if (rawType.toLowerCase() === 'combo') isCombo = true;
  else if (hasComboId && !hasAttrId) isCombo = true;

  // 2. Construct NEW clean object (Whitelist approach)
  const clean = {
    quantity: Number(getVal(p, ['quantity', 'qty']) || 1),
    booking_date: toYMD(getVal(p, ['booking_date', 'date', 'bookingDate']) || new Date()),
    // Pass through context
    coupon_code: getVal(p, ['coupon_code', 'couponCode', 'code']),
    offer_id: getVal(p, ['offer_id', 'offerId'])
  };

  if (isCombo) {
    clean.item_type = 'Combo';
    // STRICTLY SET ATTRACTION FIELDS TO NULL
    clean.attraction_id = null;
    clean.slot_id = null;
    
    // GET COMBO FIELDS
    clean.combo_id = getVal(p, ['combo_id', 'comboId']);
    clean.combo_slot_id = getVal(p, ['combo_slot_id', 'comboSlotId']);
  } else {
    clean.item_type = 'Attraction';
    // STRICTLY SET COMBO FIELDS TO NULL
    clean.combo_id = null;
    clean.combo_slot_id = null;

    // GET ATTRACTION FIELDS
    clean.attraction_id = getVal(p, ['attraction_id', 'attractionId']);
    clean.slot_id = getVal(p, ['slot_id', 'slotId']);
  }

  // 3. Normalize Addons
  const rawAddons = p.addons || [];
  if (Array.isArray(rawAddons)) {
    clean.addons = rawAddons
      .map((a) => ({
        addon_id: getVal(a, ['addon_id', 'addonId', 'id']),
        quantity: Number(getVal(a, ['quantity', 'qty']) || 0)
      }))
      .filter((a) => a.addon_id && a.quantity > 0);
  } else {
    clean.addons = [];
  }

  return clean;
};

const createInitialState = () => ({
  step: 1,

  cart: {
    items: [],
    totalQuantity: 0,
    activeKey: null,
  },

  contact: { name: '', email: '', phone: '' },

  otp: {
    status: 'idle',
    sent: false,
    verified: false,
    user_id: null,
    identifier: { email: '', phone: '' },
    error: null
  },

  coupon: { code: '', discount: 0, data: null, status: 'idle', error: null },

  creating: { status: 'idle', booking: null, booking_id: null, order_id: null, booking_ref: null, error: null },

  payphi: { status: 'idle', redirectUrl: null, tranCtx: null, response: null, error: null },

  list: { status: 'idle', items: [], meta: null, error: null },
  statusCheck: { status: 'idle', success: false, response: null, error: null }
});

const initialState = createInitialState();

const makeCartItemId = () => `ci_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const buildFingerprint = (payload = {}) => {
  const parts = [
    payload.item_type || payload.itemType || 'Attraction',
    payload.attraction_id || payload.attractionId || 'na',
    payload.combo_id || payload.comboId || 'na',
    payload.slot_id || payload.slotId || 'na',
    payload.combo_slot_id || payload.comboSlotId || 'na',
    payload.booking_date || payload.date || 'na'
  ];
  return parts.join(':');
};

const recomputeCartMeta = (cart) => {
  cart.totalQuantity = cart.items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
  if (!cart.items.length) {
    cart.activeKey = null;
  } else if (!cart.activeKey || !cart.items.some((it) => it.key === cart.activeKey)) {
    cart.activeKey = cart.items[0].key;
  }
};

/* ============ Thunks ============ */

export const sendAuthOtp = createAsyncThunk(
  'bookings/sendAuthOtp',
  async ({ email, phone, channel = 'sms' }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const finalEmail = (email ?? state.bookings?.contact?.email ?? '').trim();
      const finalPhone = normalizePhone(phone ?? state.bookings?.contact?.phone ?? '');
      const finalName = (state.bookings?.contact?.name || '').trim() || 'Guest';
      if (!finalEmail && !finalPhone) throw new Error('Enter email or phone to receive OTP');

      const body = {
        channel: finalPhone ? channel : 'email',
        createIfNotExists: true,
        name: finalName,
      };
      if (finalPhone) body.phone = finalPhone;
      if (finalEmail) body.email = finalEmail;

      const res = await api.post(endpoints.auth.otpSend(), body);

      return {
        sent: !!res?.sent || true,
        channel: res?.channel || body.channel,
        user_id: res?.user_id || null,
        identifier: { email: finalEmail, phone: finalPhone }
      };
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const verifyAuthOtp = createAsyncThunk(
  'bookings/verifyAuthOtp',
  async ({ otp }, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState();
      const user_id = state.bookings?.otp?.user_id || null;
      const ident = state.bookings?.otp?.identifier || {};
      const email = (ident.email || state.bookings?.contact?.email || '').trim();
      const phone = normalizePhone(ident.phone || state.bookings?.contact?.phone || '');

      if (!otp) throw new Error('Enter the OTP code');

      let payload;
      if (user_id) {
        payload = { user_id, otp };
      } else if (email || phone) {
        payload = { otp };
        if (email) payload.email = email;
        if (phone) payload.phone = phone;
      } else {
        throw new Error('Missing identifier to verify OTP');
      }

      const res = await api.post(endpoints.auth.otpVerify(), payload);
      if (res?.token) {
        dispatch(setCredentials({ user: res?.user || null, token: res.token, expires_at: res?.expires_at || null }));
      }
      return { verified: !!res?.verified, token: res?.token || null, user: res?.user || null };
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const applyCoupon = createAsyncThunk(
  'bookings/applyCoupon',
  async ({ code, total_amount, onDate }, { rejectWithValue }) => {
    try {
      const res = await api.post(endpoints.coupons.apply(), { code, total_amount, onDate });
      return res || { coupon: null, discount: 0, reason: 'Invalid' };
    } catch (err) { return rejectWithValue(err); }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (payload, { rejectWithValue }) => {
    try {
      let body;
      // Normalize: accepts array or single object
      if (Array.isArray(payload)) {
        body = payload.map((item) => normalizeBookingCreatePayload(item));
      } else {
        body = normalizeBookingCreatePayload(payload);
      }

      // Backend now returns { order_id, order, bookings: [...] }
      const res = await api.post(endpoints.bookings.create(), body);
      
      // Fallback handling for different response shapes
      const bookings = res.bookings || (Array.isArray(res) ? res : [res]);
      const order_id = res.order_id || (bookings[0] && (bookings[0].order_id || bookings[0].booking_id)) || null;

      return { bookings, order_id, order: res.order || null };
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const initiatePayPhi = createAsyncThunk(
  'bookings/initiatePayPhi',
  async ({ bookingId, email, mobile }, { rejectWithValue }) => {
    try {
      // NOTE: 'bookingId' parameter here essentially represents the Order ID now
      const res = await api.post(endpoints.bookings.payphi.initiate(bookingId), {
        email,
        mobile: normalizePhone(mobile)
      });
      return normalizePayphiInitiateResponse(res, bookingId);
    } catch (err) { return rejectWithValue(err); }
  }
);

export const checkPayPhiStatus = createAsyncThunk(
  'bookings/checkPayPhiStatus',
  async ({ bookingId }, { rejectWithValue }) => {
    try {
      // NOTE: 'bookingId' parameter here essentially represents the Order ID now
      const res = await api.get(endpoints.bookings.payphi.status(bookingId));
      return { bookingId, success: !!res?.success, response: res?.response || res };
    } catch (err) { return rejectWithValue(err); }
  }
);

export const listMyBookings = createAsyncThunk(
  'bookings/listMyBookings',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.bookings.list(), { params: { page, limit } });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const meta = res?.meta || null;
      return { items, meta, page, limit };
    } catch (err) { return rejectWithValue(err); }
  }
);

/* ============ Slice ============ */

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setStep(state, action) { state.step = Number(action.payload) || 1; },
    setContact(state, action) { state.contact = { ...state.contact, ...(action.payload || {}) }; },
    resetBookingFlow: () => createInitialState(),
    setCouponCode(state, action) {
      state.coupon.code = (action.payload || '').trim();
      state.coupon.discount = 0;
      state.coupon.data = null;
      state.coupon.status = 'idle';
      state.coupon.error = null;
    },
    addCartItem(state, action) {
      const payload = action.payload || {};
      const fingerprint = payload.fingerprint || buildFingerprint(payload);
      const qty = Math.max(1, Number(payload.quantity || payload.qty || 1));
      const unitPrice = Number(payload.unitPrice || payload.price || payload.unit_price || 0);
      const allowMerge = payload.merge === undefined ? true : !!payload.merge;
      const existing = allowMerge ? state.cart.items.find((it) => it.fingerprint === fingerprint) : null;
      let createdKey = null;
      
      if (existing) {
        existing.quantity += qty;
        existing.unitPrice = unitPrice || existing.unitPrice || 0;
        existing.booking_date = payload.booking_date || payload.date || existing.booking_date || null;
        existing.slotLabel = payload.slotLabel || existing.slotLabel || '';
        existing.title = payload.title || existing.title || '';
        createdKey = existing.key;
      } else {
        const itemKey = payload.key || makeCartItemId();
        // IMPORTANT: Store distinct IDs for normalization later
        state.cart.items.push({
          key: itemKey,
          fingerprint,
          item_type: payload.item_type || payload.itemType || 'Attraction',
          
          attraction_id: getVal(payload, ['attraction_id', 'attractionId']),
          combo_id: getVal(payload, ['combo_id', 'comboId']),
          slot_id: getVal(payload, ['slot_id', 'slotId']),
          combo_slot_id: getVal(payload, ['combo_slot_id', 'comboSlotId']),
          
          booking_date: payload.booking_date || payload.date || null,
          slot: payload.slot || null,
          attraction: payload.attraction || null,
          combo: payload.combo || null,
          unitPrice,
          quantity: qty,
          meta: payload.meta || {},
          title: payload.title || payload.meta?.title || '',
          slotLabel: payload.slotLabel || '',
          dateLabel: payload.dateLabel || payload.booking_date || payload.date || null,
        });
        createdKey = itemKey;
      }
      if (!state.cart.activeKey && createdKey) {
        state.cart.activeKey = createdKey;
      }
      recomputeCartMeta(state.cart);
    },
    removeCartItem(state, action) {
      const key = action.payload;
      state.cart.items = state.cart.items.filter((it) => it.key !== key);
      recomputeCartMeta(state.cart);
    },
    resetCart(state) {
      state.cart = { items: [], totalQuantity: 0, activeKey: null };
    },
    setActiveCartItem(state, action) {
      const key = action.payload;
      if (state.cart.items.some((it) => it.key === key)) {
        state.cart.activeKey = key;
      }
    },
    updateCartItemQuantity(state, action) {
      const { key, quantity } = action.payload || {};
      const item = state.cart.items.find((it) => it.key === key);
      if (!item) return;
      const qty = Math.max(1, Number(quantity || 1));
      item.quantity = qty;
      recomputeCartMeta(state.cart);
    },
  },
  extraReducers: (b) => {
    // OTP
    b.addCase(sendAuthOtp.pending, (s) => { s.otp.status = 'loading'; s.otp.sent = false; s.otp.error = null; });
    b.addCase(sendAuthOtp.fulfilled, (s, a) => {
      s.otp.status = 'succeeded';
      s.otp.sent = true;
      s.otp.user_id = a.payload?.user_id || s.otp.user_id;
      s.otp.identifier = a.payload?.identifier || s.otp.identifier;
    });
    b.addCase(sendAuthOtp.rejected, (s, a) => {
      s.otp.status = 'failed';
      s.otp.error = toErr(a.payload || a.error, 'Failed to send OTP');
      s.otp.sent = false;
    });

    b.addCase(verifyAuthOtp.pending, (s) => { s.otp.status = 'loading'; s.otp.error = null; });
    b.addCase(verifyAuthOtp.fulfilled, (s, a) => {
      s.otp.status = 'succeeded';
      s.otp.verified = !!a.payload?.verified;
      if (a.payload?.user) {
        s.contact.name = a.payload.user.name || s.contact.name;
        s.contact.email = a.payload.user.email || s.contact.email;
        s.contact.phone = a.payload.user.phone || s.contact.phone;
      }
    });
    b.addCase(verifyAuthOtp.rejected, (s, a) => {
      s.otp.status = 'failed';
      s.otp.error = toErr(a.payload || a.error, 'Failed to verify OTP');
      s.otp.verified = false;
    });

    // Coupon
    b.addCase(applyCoupon.pending, (s) => { s.coupon.status = 'loading'; s.coupon.error = null; s.coupon.discount = 0; s.coupon.data = null; });
    b.addCase(applyCoupon.fulfilled, (s, a) => { s.coupon.status = 'succeeded'; s.coupon.discount = Number(a.payload?.discount || 0); s.coupon.data = a.payload?.coupon || null; });
    b.addCase(applyCoupon.rejected, (s, a) => { s.coupon.status = 'failed'; s.coupon.error = toErr(a.payload || a.error, 'Failed to apply coupon'); });

    // Create booking
    b.addCase(createBooking.pending, (s) => {
      s.creating.status = 'loading';
      s.creating.error = null;
      s.creating.booking = null;
      s.creating.booking_id = null;
      s.creating.booking_ref = null;
      s.creating.order_id = null;
    });
    b.addCase(createBooking.fulfilled, (s, a) => {
      s.creating.status = 'succeeded';
      const first = a.payload?.bookings?.[0] || {};
      s.creating.booking = first.booking || null;
      s.creating.booking_id = first.booking_id || null;
      s.creating.booking_ref = first.booking_ref || null;
      s.creating.order_id = a.payload?.order_id || null;
    });
    b.addCase(createBooking.rejected, (s, a) => {
      s.creating.status = 'failed';
      s.creating.error = toErr(a.payload || a.error, 'Failed to create booking');
    });

    // PayPhi
    b.addCase(initiatePayPhi.pending, (s) => { s.payphi.status = 'loading'; s.payphi.error = null; s.payphi.redirectUrl = null; s.payphi.tranCtx = null; s.payphi.response = null; });
    b.addCase(initiatePayPhi.fulfilled, (s, a) => {
      s.payphi.status = 'succeeded';
      s.payphi.redirectUrl = a.payload?.redirectUrl || null;
      s.payphi.tranCtx = a.payload?.tranCtx || null;
      s.payphi.response = a.payload || null;
      s.payphi.error = null;
    });
    b.addCase(initiatePayPhi.rejected, (s, a) => { s.payphi.status = 'failed'; s.payphi.error = toErr(a.payload || a.error, 'Failed to initiate payment'); });

    // PayPhi Status
    b.addCase(checkPayPhiStatus.pending, (s) => { s.statusCheck.status = 'loading'; s.statusCheck.error = null; s.statusCheck.success = false; s.statusCheck.response = null; });
    b.addCase(checkPayPhiStatus.fulfilled, (s, a) => {
      s.statusCheck.status = 'succeeded';
      s.statusCheck.success = !!a.payload?.success;
      s.statusCheck.response = a.payload?.response || null;
    });
    b.addCase(checkPayPhiStatus.rejected, (s, a) => { s.statusCheck.status = 'failed'; s.statusCheck.error = toErr(a.payload || a.error, 'Failed to check payment status'); });

    // List
    b.addCase(listMyBookings.pending, (s) => { s.list.status = 'loading'; s.list.error = null; });
    b.addCase(listMyBookings.fulfilled, (s, a) => { s.list.status = 'succeeded'; s.list.items = a.payload?.items || []; s.list.meta = a.payload?.meta || null; });
    b.addCase(listMyBookings.rejected, (s, a) => { s.list.status = 'failed'; s.list.error = toErr(a.payload || a.error, 'Failed to load bookings'); });
  }
});

export const {
  setStep, setContact, resetBookingFlow, setCouponCode,
  addCartItem, removeCartItem, resetCart,
  setActiveCartItem, updateCartItemQuantity
} = bookingsSlice.actions;

export default bookingsSlice.reducer;