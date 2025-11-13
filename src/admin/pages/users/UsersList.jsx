import React from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import AdminPagination from '../../components/common/AdminPagination';

export default function UsersList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    roles: [],
    role: '',
    q: '',
    error: null,
    page: 1,
    limit: 20,
    meta: null
  });

  const loadRoles = async () => {
    try {
      const res = await adminApi.get(A.roles());
      const roles = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, roles }));
    } catch {}
  };

  const load = async (page = 1) => {
    setState((s) => ({ ...s, status: 'loading', error: null, page }));
    try {
      const res = await adminApi.get(A.users(), { params: { search: state.q || undefined, role: state.role || undefined, page, limit: state.limit } });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items, meta: res?.meta || null, page }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  React.useEffect(() => { loadRoles(); load(1); /* eslint-disable-next-line */ }, []);

  const meta = state.meta || {};
  const totalPages = meta.totalPages || meta.total_pages || 1;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Users</h1>

      <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className="rounded-md border px-3 py-2" placeholder="Search name/email/phone" value={state.q} onChange={(e) => setState({ ...state, q: e.target.value })} />
        <select className="rounded-md border px-3 py-2" value={state.role} onChange={(e) => setState({ ...state, role: e.target.value })}>
          <option value="">All roles</option>
          {(state.roles || []).map((r) => <option key={r.role_id} value={r.role_name}>{r.role_name}</option>)}
        </select>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => load(1)}>Filter</button>
      </div>

      <AdminTable
        keyField="user_id"
        columns={[
          { key: 'name', title: 'Name' },
          { key: 'email', title: 'Email' },
          { key: 'phone', title: 'Phone' },
          { key: 'last_login_at', title: 'Last Login' }
        ]}
        rows={state.items}
        onRowClick={(r) => navigate(`/admin/users/${r.user_id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No users found'}
      />

      <AdminPagination
        page={state.page}
        totalPages={totalPages}
        onPage={(p) => load(p)}
      />
    </div>
  );
}