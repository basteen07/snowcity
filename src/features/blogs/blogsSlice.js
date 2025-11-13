import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

const toErr = (e) =>
  e && typeof e === 'object'
    ? { message: e.message || 'Failed to load blogs', status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || 'Failed to load blogs') };

export const fetchBlogs = createAsyncThunk(
  'blogs/fetchBlogs',
  async (params = { active: true, limit: 3, page: 1 }, { signal, rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.blogs.list(), { params, signal });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return list;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const blogsSlice = createSlice({
  name: 'blogs',
  initialState: { items: [], status: 'idle', error: null, lastFetched: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchBlogs.pending, (s) => { s.status = 'loading'; s.error = null; });
    b.addCase(fetchBlogs.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload || []; s.lastFetched = Date.now(); });
    b.addCase(fetchBlogs.rejected, (s, a) => { s.status = 'failed'; s.error = toErr(a.payload || a.error); });
  }
});

export default blogsSlice.reducer;