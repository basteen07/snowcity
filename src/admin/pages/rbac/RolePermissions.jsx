import React from 'react';
import { useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

export default function RolePermissions() {
  const { id } = useParams();
  const [state, setState] = React.useState({
    status: 'loading',
    error: null,
    role: null,
    allPerms: [],
    assigned: new Set(),
    filter: ''
  });

  React.useEffect(() => {
    (async () => {
      try {
        const [roleRes, allRes, rpRes] = await Promise.all([
          adminApi.get(A.roleById(id)),
          adminApi.get(A.permissions()),
          adminApi.get(A.rolePerms(id))
        ]);
        const role = roleRes?.role || roleRes || {};
        const allPerms = Array.isArray(allRes?.data) ? allRes.data : Array.isArray(allRes) ? allRes : [];
        const assignedList =
          (Array.isArray(rpRes?.permissions) ? rpRes.permissions :
          Array.isArray(rpRes?.data) ? rpRes.data :
          Array.isArray(rpRes) ? rpRes : [])
          .map((p) => p.permission_key || p.key || p.permission || p);
        setState({ status: 'idle', error: null, role, allPerms, assigned: new Set(assignedList), filter: '' });
      } catch (err) {
        setState((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
  }, [id]);

  const toggle = (key) => {
    setState((s) => {
      const next = new Set(s.assigned);
      if (next.has(key)) next.delete(key); else next.add(key);
      return { ...s, assigned: next };
    });
  };

  const save = async () => {
    try {
      await adminApi.put(A.rolePerms(id), { permissions: Array.from(state.assigned) });
      alert('Saved');
    } catch (err) {
      alert(err?.message || 'Failed to save');
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const list = state.allPerms.filter((p) => (p.permission_key || '').toLowerCase().includes(state.filter.toLowerCase()));

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-2">Permissions for role: {state.role?.role_name}</h1>

      <div className="mb-3">
        <input className="rounded-md border px-3 py-2" placeholder="Search permissions…" value={state.filter} onChange={(e) => setState((s) => ({ ...s, filter: e.target.value }))} />
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {list.map((p) => {
            const key = p.permission_key || p.key;
            return (
              <label key={key} className="flex items-center gap-2 border rounded-md px-3 py-2">
                <input type="checkbox" checked={state.assigned.has(key)} onChange={() => toggle(key)} />
                <div>
                  <div className="text-sm font-medium">{key}</div>
                  <div className="text-xs text-gray-500">{p.description || ''}</div>
                </div>
              </label>
            );
          })}
        </div>
        <div className="mt-3">
          <button className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}