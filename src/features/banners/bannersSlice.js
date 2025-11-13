import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

const toErr = (e) =>
  e && typeof e === 'object'
    ? { message: e.message || 'Failed to load banners', status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || 'Failed to load banners') };

export const fetchBanners = createAsyncThunk(
  'banners/fetchBanners',
  async (_, { signal, rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.banners.list(), { params: { active: true, page: 1, limit: 12 }, signal });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return items;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const bannersSlice = createSlice({
  name: 'banners',
  initialState: { items: [], status: 'idle', error: null, lastFetched: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchBanners.pending, (s) => { s.status = 'loading'; s.error = null; });
    b.addCase(fetchBanners.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload || []; s.lastFetched = Date.now(); });
    b.addCase(fetchBanners.rejected, (s, a) => { s.status = 'failed'; s.error = toErr(a.payload || a.error); });
  }
});

export default bannersSlice.reducer;