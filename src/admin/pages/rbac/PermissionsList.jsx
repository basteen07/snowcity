import React from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';

export default function PermissionsList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({ status: 'idle', items: [], error: null, q: '' });

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await adminApi.get(A.permissions(), { params: { q: state.q || undefined } });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Permissions</h1>
        <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => navigate('/admin/permissions/new')}>New Permission</button>
      </div>

      <div className="mb-3 flex gap-2">
        <input className="rounded-md border px-3 py-2" placeholder="Search" value={state.q} onChange={(e) => setState({ ...state, q: e.target.value })} />
        <button className="rounded-md border px-3 py-2 text-sm" onClick={load}>Search</button>
      </div>

      <AdminTable
        keyField="permission_id"
        columns={[
          { key: 'permission_key', title: 'Key' },
          { key: 'description', title: 'Description' }
        ]}
        rows={state.items}
        onRowClick={(r) => navigate(`/admin/permissions/${r.permission_id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No permissions'}
      />
    </div>
  );
}