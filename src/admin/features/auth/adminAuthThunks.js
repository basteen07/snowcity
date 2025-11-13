import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/apiClient';
import endpoints from '../../../services/endpoints';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import { setAdminCredentials, setAdminPermissions, adminLogout } from './adminAuthSlice';

export const adminLogin = createAsyncThunk('adminAuth/adminLogin',
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      // Public login
      const res = await api.post(endpoints.auth.login(), { email, password });
      const token = res?.token;
      if (!token) throw new Error('No token from login');

      // Tentatively set admin credentials to enable adminApi auth
      dispatch(setAdminCredentials({ user: res?.user || null, token, expires_at: res?.expires_at || null }));

      // Verify admin access
      const check = await adminApi.get(A.root());
      if (!check?.ok) throw new Error('Admin access denied');

      // Hydrate permissions
      await dispatch(adminHydratePermissions()).unwrap();
      return res;
    } catch (err) {
      dispatch(adminLogout());
      return rejectWithValue(err);
    }
  }
);

// Collect current admin user's permissions by roles
export const adminHydratePermissions = createAsyncThunk('adminAuth/hydratePerms',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // 1) Current user (gets user_id)
      const me = await adminApi.get('/api/users/me');
      const user = me?.user || me || {};
      if (!user?.user_id) {
        dispatch(setAdminPermissions([]));
        return [];
      }

      // 2) Admin user details (should include roles or can infer)
      const u = await adminApi.get(A.userById(user.user_id));
      const roles = (u?.roles && Array.isArray(u.roles)) ? u.roles : (Array.isArray(u?.role_ids) ? u.role_ids.map((id) => ({ role_id: id })) : []);

      // 3) Aggregate permissions across roles
      const keys = new Set();
      for (const r of roles) {
        if (!r?.role_id) continue;
        try {
          const rp = await adminApi.get(A.rolePerms(r.role_id));
          const list =
            (Array.isArray(rp?.permissions) ? rp.permissions :
            Array.isArray(rp?.data) ? rp.data :
            Array.isArray(rp) ? rp : [])
            .map((p) => p.permission_key || p.key || p.permission || p);
          list.forEach((k) => k && keys.add(k));
        } catch {
          // ignore missing
        }
      }

      const perms = Array.from(keys);
      dispatch(setAdminPermissions(perms));
      return perms;
    } catch (err) {
      dispatch(setAdminPermissions([]));
      return rejectWithValue(err);
    }
  }
);