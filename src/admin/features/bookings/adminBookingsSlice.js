import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

const toErr = (e, d) => e && typeof e === 'object' ? { message: e.message || d, status: e.status || 0, code: e.code || null } : { message: String(e || d) };

export const listAdminBookings = createAsyncThunk('adminBookings/list',
  async (query = { page: 1, limit: 20 }, { rejectWithValue }) => {
    try {
      const res = await adminApi.get(A.bookings(), { params: query });
      const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return { data, meta: res?.meta || null, query };
    } catch (err) { return rejectWithValue(err); }
  }
);

export const getAdminBooking = createAsyncThunk('adminBookings/getOne',
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await adminApi.get(A.bookingById(id));
      return res?.booking || res;
    } catch (err) { return rejectWithValue(err); }
  }
);

export const updateAdminBooking = createAsyncThunk('adminBookings/update',
  async ({ id, patch }, { rejectWithValue }) => {
    try {
      const res = await adminApi.put(A.bookingById(id), patch);
      return res?.booking || res;
    } catch (err) { return rejectWithValue(err); }
  }
);

export const cancelAdminBooking = createAsyncThunk('adminBookings/cancel',
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await adminApi.post(A.bookingCancel(id));
      return res?.booking || res;
    } catch (err) { return rejectWithValue(err); }
  }
);

export const payphiStatusAdmin = createAsyncThunk('adminBookings/payphiStatus',
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await adminApi.get(A.payphiStatus(id));
      return { id, ...res };
    } catch (err) { return rejectWithValue(err); }
  }
);

export const payphiInitiateAdmin = createAsyncThunk('adminBookings/payphiInitiate',
  async ({ id, email, mobile }, { rejectWithValue }) => {
    try {
      const res = await adminApi.post(A.payphiInitiate(id), { email, mobile });
      return { id, ...res };
    } catch (err) { return rejectWithValue(err); }
  }
);

export const payphiRefundAdmin = createAsyncThunk('adminBookings/payphiRefund',
  async ({ id, amount, newMerchantTxnNo }, { rejectWithValue }) => {
    try {
      const res = await adminApi.post(A.payphiRefund(id), { amount, newMerchantTxnNo });
      return { id, ...res };
    } catch (err) { return rejectWithValue(err); }
  }
);

const slice = createSlice({
  name: 'adminBookings',
  initialState: {
    list: { status: 'idle', data: [], meta: null, error: null, query: { page: 1, limit: 20 } },
    current: { status: 'idle', data: null, error: null },
    action: { status: 'idle', error: null }
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(listAdminBookings.pending, (s) => { s.list.status = 'loading'; s.list.error = null; });
    b.addCase(listAdminBookings.fulfilled, (s, a) => {
      s.list.status = 'succeeded'; s.list.data = a.payload.data; s.list.meta = a.payload.meta; s.list.query = a.payload.query;
    });
    b.addCase(listAdminBookings.rejected, (s, a) => { s.list.status = 'failed'; s.list.error = toErr(a.payload || a.error, 'Failed to load bookings'); });

    b.addCase(getAdminBooking.pending, (s) => { s.current.status = 'loading'; s.current.error = null; s.current.data = null; });
    b.addCase(getAdminBooking.fulfilled, (s, a) => { s.current.status = 'succeeded'; s.current.data = a.payload; });
    b.addCase(getAdminBooking.rejected, (s, a) => { s.current.status = 'failed'; s.current.error = toErr(a.payload || a.error, 'Failed to load booking'); });

    for (const th of [updateAdminBooking, cancelAdminBooking, payphiStatusAdmin, payphiInitiateAdmin, payphiRefundAdmin]) {
      b.addCase(th.pending, (s) => { s.action.status = 'loading'; s.action.error = null; });
      b.addCase(th.fulfilled, (s) => { s.action.status = 'succeeded'; });
      b.addCase(th.rejected, (s, a) => { s.action.status = 'failed'; s.action.error = toErr(a.payload || a.error, 'Action failed'); });
    }
  }
});

export default slice.reducer;