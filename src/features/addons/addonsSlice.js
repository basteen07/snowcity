import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

const toErr = (e, msg) =>
  e && typeof e === 'object'
    ? { message: e.message || msg, status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || msg) };

export const fetchAddons = createAsyncThunk(
  'addons/fetchAddons',
  async (params = { active: true, limit: 100 }, { signal, rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.addons.list(), { params, signal });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return items;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const addonsSlice = createSlice({
  name: 'addons',
  initialState: { items: [], status: 'idle', error: null, lastFetched: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAddons.pending, (s) => { s.status = 'loading'; s.error = null; });
    b.addCase(fetchAddons.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.items = a.payload || [];
      s.lastFetched = Date.now();
    });
    b.addCase(fetchAddons.rejected, (s, a) => { s.status = 'failed'; s.error = toErr(a.payload || a.error, 'Failed to load add-ons'); });
  }
});

export default addonsSlice.reducer;