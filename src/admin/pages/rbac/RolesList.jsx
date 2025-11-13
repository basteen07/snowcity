import React from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';

export default function RolesList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({ status: 'idle', items: [], error: null });

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await adminApi.get(A.roles());
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };
  React.useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Roles</h1>
        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => navigate('/admin/rbac/matrix')}>RBAC Matrix</button>
          <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => navigate('/admin/roles/new')}>New Role</button>
        </div>
      </div>

      <AdminTable
        keyField="role_id"
        columns={[
          { key: 'role_name', title: 'Role' },
          { key: 'description', title: 'Description' }
        ]}
        rows={state.items}
        onRowClick={(r) => navigate(`/admin/roles/${r.role_id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No roles'}
      />
    </div>
  );
}