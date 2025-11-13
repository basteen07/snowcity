import { createSlice } from '@reduxjs/toolkit';

const initialState = { user: null, token: null, expires_at: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, token, expires_at } = action.payload || {};
      state.user = user ?? null;
      state.token = token ?? null;
      state.expires_at = expires_at ?? null;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.expires_at = null;
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
