import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

const toErr = (e) =>
  e && typeof e === 'object'
    ? { message: e.message || 'Failed to load gallery', status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || 'Failed to load gallery') };

export const fetchGallery = createAsyncThunk(
  'gallery/fetchGallery',
  async (params = { active: true, limit: 50, page: 1 }, { signal, rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.gallery.list(), { params, signal });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return items;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const gallerySlice = createSlice({
  name: 'gallery',
  initialState: { items: [], status: 'idle', error: null, lastFetched: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGallery.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGallery.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload || [];
        state.lastFetched = Date.now();
      })
      .addCase(fetchGallery.rejected, (state, action) => {
        state.status = 'failed';
        state.error = toErr(action.payload || action.error);
      });
  }
});

export default gallerySlice.reducer;
