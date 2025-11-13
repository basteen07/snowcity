import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';

export default function AddonsList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    error: null,
    q: '',
    active: '',
    page: 1,
    limit: 20,
    meta: null
  });

  const load = async (page = 1) => {
    setState((s) => ({ ...s, status: 'loading', error: null, page }));
    try {
      const res = await adminApi.get(A.addons(), {
        params: { q: state.q || undefined, active: state.active || undefined, page, limit: state.limit }
      });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items, meta: res?.meta || null, page }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  React.useEffect(() => { load(1); /* eslint-disable-line */ }, []);

  const toggleActive = async (row, e) => {
    e?.stopPropagation?.();
    try {
      const id = row.addon_id || row.id;
      await adminApi.put(`${A.addons()}/${id}`, { active: !row.active });
      setState((s) => ({
        ...s,
        items: s.items.map((it) => ((it.addon_id || it.id) === id ? { ...it, active: !row.active } : it))
      }));
    } catch (err) {
      alert(err?.message || 'Failed to update');
    }
  };

  const remove = async (row, e) => {
    e?.stopPropagation?.();
    if (!window.confirm(`Delete addon "${row.title}"? This cannot be undone.`)) return;
    try {
      const id = row.addon_id || row.id;
      await adminApi.delete(`${A.addons()}/${id}`);
      setState((s) => ({ ...s, items: s.items.filter((it) => (it.addon_id || it.id) !== id) }));
    } catch (err) {
      alert(err?.message || 'Delete failed');
    }
  };

  const meta = state.meta || {};
  const canPrev = state.page > 1;
  const canNext = meta.page ? (meta.page < (meta.totalPages || meta.total_pages || 1)) : false;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Addons</h1>
        <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/addons/new')}>
          New Addon
        </button>
      </div>

      <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className="rounded-md border px-3 py-2" placeholder="Search title" value={state.q} onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))} />
        <select className="rounded-md border px-3 py-2" value={state.active} onChange={(e) => setState((s) => ({ ...s, active: e.target.value }))}>
          <option value="">Active: All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => load(1)}>Filter</button>
      </div>

      <AdminTable
        keyField="addon_id"
        columns={[
          { key: 'title', title: 'Title' },
          { key: 'price', title: 'Price', render: (row) => `₹${row?.price ?? 0}` },
          {
            key: 'active',
            title: 'Active',
            render: (row) => String(row?.active)
          },
          {
            key: '__actions',
            title: 'Actions',
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <button className={`rounded-md px-2 py-1 text-xs ${row.active ? 'border text-red-600' : 'bg-blue-600 text-white'}`} onClick={(e) => toggleActive(row, e)}>
                  {row.active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={(e) => remove(row, e)}>
                  Delete
                </button>
              </div>
            )
          }
        ]}
        rows={state.items}
        onRowClick={(row) => navigate(`/admin/catalog/addons/${row.addon_id || row.id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No addons found'}
      />

      <div className="mt-3 flex items-center gap-2">
        <button className="rounded-md border px-3 py-1 text-sm" onClick={() => canPrev && load(state.page - 1)} disabled={!canPrev || state.status === 'loading'}>Prev</button>
        <div className="text-sm text-gray-600">Page {meta.page || state.page}</div>
        <button className="rounded-md border px-3 py-1 text-sm" onClick={() => canNext && load(state.page + 1)} disabled={!canNext || state.status === 'loading'}>Next</button>
      </div>
    </div>
  );
}