import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

const toErr = (e) =>
  e && typeof e === 'object'
    ? {
        message: e.message || 'Failed to load coupons',
        status: e.status || 0,
        code: e.code || null,
        data: e.data || null
      }
    : { message: String(e || 'Failed to load coupons') };

export const fetchCoupons = createAsyncThunk(
  'coupons/fetchCoupons',
  async (params = { active: true, limit: 50 }, { signal, rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.coupons.list(), { params, signal });
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.coupons)) return res.coupons;
      return [];
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const couponsSlice = createSlice({
  name: 'coupons',
  initialState: { items: [], status: 'idle', error: null, lastFetched: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload || [];
        state.lastFetched = Date.now();
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.status = 'failed';
        state.error = toErr(action.payload || action.error);
      });
  }
});

export default couponsSlice.reducer;
