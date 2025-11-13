import React from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import AdminPagination from '../../components/common/AdminPagination';

export default function CouponsList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    meta: null,
    error: null,
    q: '',
    active: '',
    page: 1,
    limit: 20
  });

  const load = async (page = 1) => {
    setState((s) => ({ ...s, status: 'loading', error: null, page }));
    try {
      const res = await adminApi.get(A.coupons(), {
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
      const id = row.coupon_id || row.id;
      await adminApi.put(`${A.coupons()}/${id}`, { active: !row.active });
      setState((s) => ({
        ...s,
        items: s.items.map((it) => ((it.coupon_id || it.id) === id ? { ...it, active: !row.active } : it))
      }));
    } catch (err) {
      alert(err?.message || 'Failed to update');
    }
  };

  const remove = async (row, e) => {
    e?.stopPropagation?.();
    if (!window.confirm(`Delete coupon "${row.code}"? This cannot be undone.`)) return;
    try {
      const id = row.coupon_id || row.id;
      await adminApi.delete(`${A.coupons()}/${id}`);
      setState((s) => ({ ...s, items: s.items.filter((it) => (it.coupon_id || it.id) !== id) }));
    } catch (err) {
      alert(err?.message || 'Delete failed');
    }
  };

  const meta = state.meta || {};
  const totalPages = meta.totalPages || meta.total_pages || 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Coupons</h1>
        <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/coupons/new')}>
          New Coupon
        </button>
      </div>

      <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className="rounded-md border px-3 py-2" placeholder="Search code/desc" value={state.q} onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))} />
        <select className="rounded-md border px-3 py-2" value={state.active} onChange={(e) => setState((s) => ({ ...s, active: e.target.value }))}>
          <option value="">Active: All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => load(1)}>Filter</button>
      </div>

      <AdminTable
        keyField="coupon_id"
        columns={[
          { key: 'code', title: 'Code' },
          { key: 'type', title: 'Type' },
          { key: 'value', title: 'Value' },
          { key: 'valid_from', title: 'From' },
          { key: 'valid_to', title: 'To' },
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
        onRowClick={(row) => navigate(`/admin/catalog/coupons/${row.coupon_id || row.id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No coupons found'}
      />

      <AdminPagination
        page={meta.page || state.page}
        totalPages={totalPages}
        onPage={(p) => load(p)}
      />
    </div>
  );
}