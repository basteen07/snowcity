import { createSlice } from '@reduxjs/toolkit';

const initialState = { user: null, token: null, expires_at: null, checked: false, perms: [] };

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    setAdminCredentials(state, action) {
      const { user, token, expires_at } = action.payload || {};
      state.user = user || null;
      state.token = token || null;
      state.expires_at = expires_at || null;
      state.checked = true;
    },
    setAdminPermissions(state, action) {
      state.perms = Array.isArray(action.payload) ? action.payload : [];
    },
    adminLogout(state) {
      state.user = null;
      state.token = null;
      state.expires_at = null;
      state.checked = true;
      state.perms = [];
    }
  }
});

export const { setAdminCredentials, setAdminPermissions, adminLogout } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;