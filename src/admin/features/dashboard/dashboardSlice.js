import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

const toErr = (e, d) => e && typeof e === 'object' ? { message: e.message || d, status: e.status || 0, code: e.code || null } : { message: String(e || d) };

export const fetchDashboard = createAsyncThunk('adminDashboard/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const [main, recent, top, status] = await Promise.all([
        adminApi.get(A.dashboard()),
        adminApi.get(A.dashboardRecent()),
        adminApi.get(A.dashboardTopAttractions()),
        adminApi.get(A.dashboardStatus())
      ]);
      return { main, recent, top, status };
    } catch (err) { return rejectWithValue(err); }
  }
);

const slice = createSlice({
  name: 'adminDashboard',
  initialState: { data: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchDashboard.pending, (s) => { s.status = 'loading'; s.error = null; });
    b.addCase(fetchDashboard.fulfilled, (s, a) => { s.status = 'succeeded'; s.data = a.payload; });
    b.addCase(fetchDashboard.rejected, (s, a) => { s.status = 'failed'; s.error = toErr(a.payload || a.error, 'Failed to load dashboard'); });
  }
});

export default slice.reducer;