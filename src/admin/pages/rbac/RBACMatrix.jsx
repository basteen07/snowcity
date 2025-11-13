import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

export default function RBACMatrix() {
  const [state, setState] = React.useState({
    status: 'loading',
    error: null,
    roles: [],
    permissions: [],
    assigned: {}, // { role_id: Set(permission_key) }
    dirty: {}     // { role_id: boolean }
  });

  React.useEffect(() => {
    (async () => {
      try {
        const [rolesRes, permsRes] = await Promise.all([
          adminApi.get(A.roles()),
          adminApi.get(A.permissions())
        ]);
        const roles = Array.isArray(rolesRes?.data) ? rolesRes.data : Array.isArray(rolesRes) ? rolesRes : [];
        const permissions = Array.isArray(permsRes?.data) ? permsRes.data : Array.isArray(permsRes) ? permsRes : [];

        // Fetch each role's permissions
        const maps = {};
        await Promise.all(
          roles.map(async (r) => {
            try {
              const rr = await adminApi.get(A.rolePerms(r.role_id));
              const list = Array.isArray(rr?.permissions) ? rr.permissions :
                           Array.isArray(rr?.data) ? rr.data :
                           Array.isArray(rr) ? rr : [];
              const keys = list.map((p) => p.permission_key || p.key || p.permission || p);
              maps[r.role_id] = new Set(keys);
            } catch {
              maps[r.role_id] = new Set();
            }
          })
        );

        setState({ status: 'idle', error: null, roles, permissions, assigned: maps, dirty: {} });
      } catch (err) {
        setState((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
  }, []);

  const toggle = (role_id, key) => {
    setState((s) => {
      const nextAssigned = { ...s.assigned, [role_id]: new Set(s.assigned[role_id]) };
      if (nextAssigned[role_id].has(key)) nextAssigned[role_id].delete(key); else nextAssigned[role_id].add(key);
      const nextDirty = { ...s.dirty, [role_id]: true };
      return { ...s, assigned: nextAssigned, dirty: nextDirty };
    });
  };

  const saveRole = async (role_id) => {
    try {
      const keys = Array.from(state.assigned[role_id] || []);
      await adminApi.put(A.rolePerms(role_id), { permissions: keys });
      setState((s) => ({ ...s, dirty: { ...s.dirty, [role_id]: false } }));
    } catch (err) {
      alert(err?.message || 'Failed to save');
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  return (
    <div className="overflow-x-auto">
      <h1 className="text-xl font-semibold mb-3">RBAC Matrix</h1>
      <table className="min-w-full bg-white border rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-sm text-gray-600">Permission</th>
            {state.roles.map((r) => (
              <th key={r.role_id} className="px-3 py-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>{r.role_name}</span>
                  {state.dirty[r.role_id] ? (
                    <button className="rounded-md border px-2 py-1 text-xs" onClick={() => saveRole(r.role_id)}>Save</button>
                  ) : null}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {state.permissions.map((p) => {
            const key = p.permission_key || p.key;
            return (
              <tr key={key} className="border-t">
                <td className="px-3 py-2 text-sm">{key}</td>
                {state.roles.map((r) => {
                  const checked = (state.assigned[r.role_id] || new Set()).has(key);
                  return (
                    <td key={`${r.role_id}-${key}`} className="px-3 py-2 text-center">
                      <input type="checkbox" checked={checked} onChange={() => toggle(r.role_id, key)} />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}