import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';

export default function CombosList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({ status: 'idle', items: [], error: null, active: '' });

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await adminApi.get(A.combos(), { params: { active: state.active || undefined } });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items }));
    } catch (err) { setState((s) => ({ ...s, status: 'failed', error: err })); }
  };

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Combos</h1>
        <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/combos/new')}>
          New Combo
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <select className="rounded-md border px-3 py-2" value={state.active} onChange={(e) => setState({ ...state, active: e.target.value })}>
          <option value="">Active: All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={load}>Filter</button>
      </div>

      <AdminTable
        keyField="combo_id"
        columns={[
          { key: 'combo_id', title: 'ID' },
          { key: 'attraction_1_id', title: 'Attraction #1' },
          { key: 'attraction_2_id', title: 'Attraction #2' },
          { key: 'combo_price', title: 'Combo Price', render: (r) => `₹${r?.combo_price ?? 0}` },
          { key: 'discount_percent', title: 'Discount %' },
          { key: 'active', title: 'Active', render: (r) => String(r?.active) }
        ]}
        rows={state.items}
        onRowClick={(r) => navigate(`/admin/catalog/combos/${r.combo_id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No combos'}
      />
    </div>
  );
}