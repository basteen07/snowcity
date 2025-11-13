import { createSlice, createAsyncThunk, nanoid } from '@reduxjs/toolkit';
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
    bookingId,
    responseCode,
    responseMessage,
    tranCtx,
    redirectUrl,
    ok
  };
};

const initialState = {
  step: 1,

  cart: [],

  contact: { name: '', email: '', phone: '' },

  // OTP now stores both user_id (preferred for verify) and identifier fallback
  otp: {
    status: 'idle',
    sent: false,
    verified: false,
    user_id: null,
    identifier: { email: '', phone: '' },
    error: null
  },

  coupon: { code: '', discount: 0, data: null, status: 'idle', error: null },

  creating: { status: 'idle', results: [], error: null },

  payphi: { status: 'idle', redirectUrl: null, tranCtx: null, response: null, error: null },

  list: { status: 'idle', items: [], meta: null, error: null },
  statusCheck: { status: 'idle', success: false, response: null, error: null },
  cancel: { status: 'idle', error: null }
};

/* ============ Thunks ============ */

// Send OTP — prefer /api/auth/otp/send; on 404 fallback to /api/bookings/otp/send
export const sendAuthOtp = createAsyncThunk(
  'bookings/sendAuthOtp',
  async ({ email, phone, channel = 'sms' }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const finalEmail = (email ?? state.bookings?.contact?.email ?? '').trim();
      const finalPhone = normalizePhone(phone ?? state.bookings?.contact?.phone ?? '');
      if (!finalEmail && !finalPhone) {
        throw new Error('Enter email or phone to receive OTP');
      }

      const body = finalPhone ? { phone: finalPhone, channel } : { email: finalEmail, channel: 'email' };

      try {
        const res = await api.post(endpoints.auth.otpSend(), body);
        return {
          sent: !!res?.sent || true,
          channel: res?.channel || body.channel,
          user_id: res?.user_id || null,
          identifier: { email: finalEmail, phone: finalPhone }
        };
      } catch (err) {
        const status = err?.status || err?.original?.response?.status;
        const code = err?.code || err?.data?.code;
        // Optional fallback to booking OTP
        if (status === 404 || (typeof code === 'string' && code.toUpperCase().includes('NOT_FOUND'))) {
          const name = state.bookings?.contact?.name || '';
          const res2 = await api.post(endpoints.bookings?.otp?.send?.(), {
            name,
            email: finalEmail || undefined,
            phone: finalPhone || undefined
          });
          return {
            sent: !!res2?.sent || true,
            channel: res2?.channel || body.channel,
            user_id: res2?.user_id || null,
            identifier: { email: finalEmail, phone: finalPhone }
          };
        }
        throw err;
      }
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

// Verify OTP — if user_id present, verify with { user_id, otp } else fallback to { email|phone, otp }
// On success, set credentials
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

// Coupon apply
export const applyCoupon = createAsyncThunk(
  'bookings/applyCoupon',
  async ({ code, total_amount, onDate }, { rejectWithValue }) => {
    try {
      const res = await api.post(endpoints.coupons.apply(), { code, total_amount, onDate });
      return res || { coupon: null, discount: 0, reason: 'Invalid' };
    } catch (err) { return rejectWithValue(err); }
  }
);

// Create all bookings (cart items)
// export const createAllBookings = createAsyncThunk(
//   'bookings/createAllBookings',
//   async ({ items, coupon_code = null, payment_mode = 'Online' }, { rejectWithValue }) => {
//     try {
//       const results = [];
//       for (const it of items) {
//         const payload = {
//           attraction_id: it.attractionId,
//           booking_date: toYMD(it.date),
//           slot_id: it.slotId,
//           quantity: it.qty,
//           addons: (it.addons || []).map(a => ({ addon_id: a.addon_id, quantity: a.quantity })),
//           coupon_code,
//           payment_mode
//         };
//         const res = await api.post(endpoints.bookings.create(), payload);
//         results.push({ ok: true, booking: res?.booking || res, payload });
//       }
//       return results;
//     } catch (err) { return rejectWithValue(err); }
//   }
// );

// PayPhi initiate
export const initiatePayPhi = createAsyncThunk(
  'bookings/initiatePayPhi',
  async ({ bookingId, email, mobile }, { rejectWithValue }) => {
    try {
      const res = await api.post(endpoints.payments.payphi.initiate(bookingId), { email, mobile });
      return normalizePayphiInitiateResponse(res, bookingId);
    } catch (err) { return rejectWithValue(err); }
  }
);

// PayPhi status
export const checkPayPhiStatus = createAsyncThunk(
  'bookings/checkPayPhiStatus',
  async ({ bookingId }, { rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.payments.payphi.status(bookingId));
      return { bookingId, success: !!res?.success, response: res?.response || res };
    } catch (err) { return rejectWithValue(err); }
  }
);


// Create all bookings (cart items) – normalize booking_id
export const createAllBookings = createAsyncThunk(
  'bookings/createAllBookings',
  async ({ items, coupon_code = null, payment_mode = 'Online' }, { rejectWithValue }) => {
    try {
      const results = [];

      const normalizeBooking = (raw) => {
        // raw may be { booking: {...} } or just {...}
        const b = raw?.booking || raw || {};
        const id =
          b.booking_id ??
          b.id ??
          b._id ??
          b.bookingId ??
          null;
        const ref =
          b.booking_ref ??
          b.reference ??
          b.ref ??
          null;
        return { entity: b, id, ref };
      };

      for (const it of items) {
        const payload = {
          attraction_id: it.attractionId,
          booking_date: toYMD(it.date),
          slot_id: it.slotId,
          quantity: it.qty,
          addons: (it.addons || []).map(a => ({ addon_id: a.addon_id, quantity: a.quantity })),
          coupon_code,
          payment_mode
        };
        const res = await api.post(endpoints.bookings.create(), payload);
        const { entity, id, ref } = normalizeBooking(res);
        results.push({ ok: true, booking: entity, booking_id: id, booking_ref: ref, payload });
      }

      return results;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);
// My bookings
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

// Cancel booking
export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async ({ bookingId }, { rejectWithValue }) => {
    try {
      const res = await api.post(endpoints.bookings.cancel(bookingId));
      return { booking: res?.booking || res };
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
    resetBookingFlow: () => initialState,

    addCartItem(state, action) {
      const it = action.payload;
      const id = it.id || nanoid();
      state.cart.push({
        ...it,
        id,
        addons: it.addons || [],
        itemType: it.itemType || 'attraction',
        attractionId: it.attractionId || null,
        comboId: it.comboId || null,
        slotId: it.slotId || null,
        comboSlotId: it.comboSlotId || null,
      });
    },
    updateCartItem(state, action) {
      const { id, patch } = action.payload || {};
      const idx = state.cart.findIndex((x) => x.id === id);
      if (idx >= 0) state.cart[idx] = { ...state.cart[idx], ...(patch || {}) };
    },
    removeCartItem(state, action) { state.cart = state.cart.filter((x) => x.id !== action.payload); },
    clearCart(state) { state.cart = []; },

    setItemAddons(state, action) {
      const { id, addons } = action.payload || {};
      const idx = state.cart.findIndex((x) => x.id === id);
      if (idx >= 0) state.cart[idx].addons = addons || [];
    },

    setCouponCode(state, action) {
      state.coupon.code = (action.payload || '').trim();
      state.coupon.discount = 0;
      state.coupon.data = null;
      state.coupon.status = 'idle';
      state.coupon.error = null;
    }
  },
  extraReducers: (b) => {
    // OTP send
    b.addCase(sendAuthOtp.pending, (s) => { s.otp.status = 'loading'; s.otp.sent = false; s.otp.error = null; });
    b.addCase(sendAuthOtp.fulfilled, (s, a) => {
      s.otp.status = 'succeeded';
      s.otp.sent = true;
      s.otp.user_id = a.payload?.user_id || s.otp.user_id || null;
      s.otp.identifier = a.payload?.identifier || s.otp.identifier;
    });
    b.addCase(sendAuthOtp.rejected, (s, a) => {
      s.otp.status = 'failed';
      s.otp.error = toErr(a.payload || a.error, 'Failed to send OTP');
      s.otp.sent = false;
    });

    // OTP verify
    b.addCase(verifyAuthOtp.pending, (s) => { s.otp.status = 'loading'; s.otp.error = null; });
    b.addCase(verifyAuthOtp.fulfilled, (s, a) => {
      s.otp.status = 'succeeded';
      s.otp.verified = !!a.payload?.verified;
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

    // Create bookings
    b.addCase(createAllBookings.pending, (s) => { s.creating.status = 'loading'; s.creating.error = null; s.creating.results = []; });
    b.addCase(createAllBookings.fulfilled, (s, a) => { s.creating.status = 'succeeded'; s.creating.results = a.payload || []; });
    b.addCase(createAllBookings.rejected, (s, a) => { s.creating.status = 'failed'; s.creating.error = toErr(a.payload || a.error, 'Failed to create bookings'); });

    // PayPhi initiate
    b.addCase(initiatePayPhi.pending, (s) => { s.payphi.status = 'loading'; s.payphi.error = null; s.payphi.redirectUrl = null; s.payphi.tranCtx = null; s.payphi.response = null; });
    b.addCase(initiatePayPhi.fulfilled, (s, a) => {
      s.payphi.status = 'succeeded';
      s.payphi.redirectUrl = a.payload?.redirectUrl || null;
      s.payphi.tranCtx = a.payload?.tranCtx || null;
      s.payphi.response = a.payload || null;
      s.payphi.error = null;
    });
    b.addCase(initiatePayPhi.rejected, (s, a) => { s.payphi.status = 'failed'; s.payphi.error = toErr(a.payload || a.error, 'Failed to initiate payment'); });

    // PayPhi status check
    b.addCase(checkPayPhiStatus.pending, (s) => { s.statusCheck.status = 'loading'; s.statusCheck.error = null; s.statusCheck.success = false; s.statusCheck.response = null; });
    b.addCase(checkPayPhiStatus.fulfilled, (s, a) => {
      s.statusCheck.status = 'succeeded';
      s.statusCheck.success = !!a.payload?.success;
      s.statusCheck.response = a.payload?.response || null;
    });
    b.addCase(checkPayPhiStatus.rejected, (s, a) => { s.statusCheck.status = 'failed'; s.statusCheck.error = toErr(a.payload || a.error, 'Failed to check payment status'); });

    // My bookings
    b.addCase(listMyBookings.pending, (s) => { s.list.status = 'loading'; s.list.error = null; });
    b.addCase(listMyBookings.fulfilled, (s, a) => { s.list.status = 'succeeded'; s.list.items = a.payload?.items || []; s.list.meta = a.payload?.meta || null; });
    b.addCase(listMyBookings.rejected, (s, a) => { s.list.status = 'failed'; s.list.error = toErr(a.payload || a.error, 'Failed to load bookings'); });

    // Cancel booking
    b.addCase(cancelBooking.pending, (s) => { s.cancel.status = 'loading'; s.cancel.error = null; });
    b.addCase(cancelBooking.fulfilled, (s) => { s.cancel.status = 'succeeded'; });
    b.addCase(cancelBooking.rejected, (s, a) => { s.cancel.status = 'failed'; s.cancel.error = toErr(a.payload || a.error, 'Failed to cancel booking'); });
  }
});

export const {
  setStep, setContact, resetBookingFlow,
  addCartItem, updateCartItem, removeCartItem, clearCart,
  setItemAddons, setCouponCode
} = bookingsSlice.actions;

export default bookingsSlice.reducer;