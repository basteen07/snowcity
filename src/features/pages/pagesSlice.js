import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

const toErr = (e) =>
  e && typeof e === 'object'
    ? { message: e.message || 'Failed to load pages', status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || 'Failed to load pages') };

export const fetchPages = createAsyncThunk(
  'pages/fetchPages',
  async (params = { active: true, limit: 100 }, { signal, rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.pages.list(), { params, signal });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return list;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const pagesSlice = createSlice({
  name: 'pages',
  initialState: { items: [], status: 'idle', error: null, lastFetched: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPages.pending, (s) => { s.status = 'loading'; s.error = null; });
    b.addCase(fetchPages.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload || []; s.lastFetched = Date.now(); });
    b.addCase(fetchPages.rejected, (s, a) => { s.status = 'failed'; s.error = toErr(a.payload || a.error); });
  }
});

export default pagesSlice.reducer;