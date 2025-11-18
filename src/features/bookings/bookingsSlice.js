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
    bookingId,
    responseCode,
    responseMessage,
    tranCtx,
    redirectUrl,
    ok
  };
};

// Normalize a booking creation payload from various UI shapes
const normalizeBookingCreatePayload = (p = {}) => {
  const payload = { ...p };

  // Normalize IDs
  if (payload.attractionId && !payload.attraction_id) payload.attraction_id = payload.attractionId;
  if (payload.slotId && !payload.slot_id) payload.slot_id = payload.slotId;
  if (payload.comboId && !payload.combo_id) payload.combo_id = payload.comboId;
  if (payload.comboSlotId && !payload.combo_slot_id) payload.combo_slot_id = payload.comboSlotId;

  // Normalize quantities/dates/times
  if (payload.qty && !payload.quantity) payload.quantity = payload.qty;
  if (payload.date && !payload.booking_date) payload.booking_date = toYMD(payload.date);
  if (payload.time && !payload.booking_time) payload.booking_time = payload.time;

  // Normalize addons
  if (Array.isArray(payload.addons)) {
    payload.addons = payload.addons
      .map((a) => ({
        addon_id: a?.addon_id ?? a?.id ?? a?.addonId ?? a?.addonID ?? null,
        quantity: a?.quantity ?? a?.qty ?? 1
      }))
      .filter((a) => a.addon_id != null);
  }

  // Ensure minimal fields
  if (!payload.quantity) payload.quantity = 1;

  return payload;
};

const normalizeBookingEntity = (raw) => {
  const b = raw?.booking || raw || {};
  const id = b.booking_id ?? b.id ?? b._id ?? b.bookingId ?? null;
  const ref = b.booking_ref ?? b.reference ?? b.ref ?? null;
  return { entity: b, id, ref };
};

const initialState = {
  step: 1,

  // Contact details (helpful for forms and PayPhi initiate)
  contact: { name: '', email: '', phone: '' },

  // OTP for auth via /api/auth/otp/*
  otp: {
    status: 'idle',
    sent: false,
    verified: false,
    user_id: null,
    identifier: { email: '', phone: '' },
    error: null
  },

  // Coupon
  coupon: { code: '', discount: 0, data: null, status: 'idle', error: null },

  // Single booking creation
  creating: { status: 'idle', booking: null, booking_id: null, booking_ref: null, error: null },

  // PayPhi payment context
  payphi: { status: 'idle', redirectUrl: null, tranCtx: null, response: null, error: null },

  // Listings and status checks
  list: { status: 'idle', items: [], meta: null, error: null },
  statusCheck: { status: 'idle', success: false, response: null, error: null }
};

/* ============ Thunks ============ */

// Send OTP (Auth endpoints)
export const sendAuthOtp = createAsyncThunk(
  'bookings/sendAuthOtp',
  async ({ email, phone, channel = 'sms' }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const finalEmail = (email ?? state.bookings?.contact?.email ?? '').trim();
      const finalPhone = normalizePhone(phone ?? state.bookings?.contact?.phone ?? '');
      if (!finalEmail && !finalPhone) throw new Error('Enter email or phone to receive OTP');

      const body = finalPhone ? { phone: finalPhone, channel } : { email: finalEmail, channel: 'email' };
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

// Verify OTP — if user_id present use it; otherwise fallback to email/phone
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

// Create a single booking (no cart)
export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (payload, { rejectWithValue }) => {
    try {
      const body = normalizeBookingCreatePayload(payload);
      const res = await api.post(endpoints.bookings.create(), body);
      const { entity, id, ref } = normalizeBookingEntity(res);
      return { booking: entity, booking_id: id, booking_ref: ref };
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

// PayPhi initiate
export const initiatePayPhi = createAsyncThunk(
  'bookings/initiatePayPhi',
  async ({ bookingId, email, mobile }, { rejectWithValue }) => {
    try {
      const res = await api.post(endpoints.payments.payphi.initiate(bookingId), {
        email,
        mobile: normalizePhone(mobile)
      });
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

// My bookings (list)
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
    resetBookingFlow: () => initialState,
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
    });
    b.addCase(createBooking.fulfilled, (s, a) => {
      s.creating.status = 'succeeded';
      s.creating.booking = a.payload?.booking || null;
      s.creating.booking_id = a.payload?.booking_id || null;
      s.creating.booking_ref = a.payload?.booking_ref || null;
    });
    b.addCase(createBooking.rejected, (s, a) => {
      s.creating.status = 'failed';
      s.creating.error = toErr(a.payload || a.error, 'Failed to create booking');
    });

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
  }
});

export const {
  setStep, setContact, resetBookingFlow, setCouponCode
} = bookingsSlice.actions;

export default bookingsSlice.reducer;