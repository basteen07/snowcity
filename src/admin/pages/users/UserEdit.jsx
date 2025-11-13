import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [state, setState] = React.useState({
    status: 'loading',
    error: null,
    user: null,
    roles: [],
    selectedRoleIds: []
  });

  React.useEffect(() => {
    (async () => {
      try {
        const [u, r] = await Promise.all([
          adminApi.get(A.userById(id)),
          adminApi.get(A.roles())
        ]);
        const user = u?.user || u || {};
        const roles = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
        // Try to infer current roles from user.roles or user.role_ids
        const selectedRoleIds =
          (user.roles && user.roles.map((x) => x.role_id)) ||
          user.role_ids ||
          [];
        setState({ status: 'idle', error: null, user, roles, selectedRoleIds });
      } catch (err) {
        setState((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
  }, [id]);

  const toggleRole = (rid) => {
    setState((s) => {
      const has = s.selectedRoleIds.includes(rid);
      const next = has ? s.selectedRoleIds.filter((x) => x !== rid) : [...s.selectedRoleIds, rid];
      return { ...s, selectedRoleIds: next };
    });
  };

  const save = async () => {
    try {
      // Backend should accept { role_ids: [] } on PUT /users/:id
      await adminApi.put(A.userById(id), { role_ids: state.selectedRoleIds });
      navigate('/admin/users');
    } catch (err) {
      setState((s) => ({ ...s, error: err }));
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load user'}</div>;

  const u = state.user || {};

  return (
    <div className="max-w-3xl">
      <div className="rounded-xl border bg-white p-4">
        <h1 className="text-xl font-semibold mb-2">User: {u.name || u.email}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div><div className="text-gray-500">Email</div><div>{u.email}</div></div>
          <div><div className="text-gray-500">Phone</div><div>{u.phone || '—'}</div></div>
          <div><div className="text-gray-500">Last Login</div><div>{u.last_login_at || '—'}</div></div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 mt-4">
        <h2 className="font-semibold mb-3">Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {state.roles.map((r) => (
            <label key={r.role_id} className="flex items-center gap-2 border rounded-md px-3 py-2">
              <input
                type="checkbox"
                checked={state.selectedRoleIds.includes(r.role_id)}
                onChange={() => toggleRole(r.role_id)}
              />
              <span className="text-sm">{r.role_name}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm" onClick={save}>Save</button>
          <button className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
        </div>
        {state.error ? <div className="mt-2 text-sm text-red-600">{state.error?.message || 'Failed to save'}</div> : null}
      </div>
    </div>
  );
}