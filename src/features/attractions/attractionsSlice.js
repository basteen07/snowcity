import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

const toErr = (e) =>
  e && typeof e === 'object'
    ? { message: e.message || 'Failed to load attractions', status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || 'Failed to load attractions') };

export const fetchAttractions = createAsyncThunk(
  'attractions/fetchAttractions',
  async (params = { active: true, page: 1, limit: 12 }, { signal, rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.attractions.list(), { params, signal });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return list;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const attractionsSlice = createSlice({
  name: 'attractions',
  initialState: { items: [], status: 'idle', error: null, lastFetched: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAttractions.pending, (s) => { s.status = 'loading'; s.error = null; });
    b.addCase(fetchAttractions.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload || []; s.lastFetched = Date.now(); });
    b.addCase(fetchAttractions.rejected, (s, a) => { s.status = 'failed'; s.error = toErr(a.payload || a.error); });
  }
});

export default attractionsSlice.reducer;