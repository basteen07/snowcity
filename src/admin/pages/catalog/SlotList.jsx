import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';

export default function SlotsList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    error: null,
    attraction_id: '',
    page: 1,
    limit: 20,
    meta: null
  });

  const load = async (page = 1) => {
    setState((s) => ({ ...s, status: 'loading', error: null, page }));
    try {
      const res = await adminApi.get(A.slots(), {
        params: {
          attraction_id: state.attraction_id || undefined,
          page,
          limit: state.limit
        }
      });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items, meta: res?.meta || null, page }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  React.useEffect(() => { load(1); /* eslint-disable-line */ }, []);

  const toggleAvailable = async (row, e) => {
    e?.stopPropagation?.();
    try {
      const id = row.slot_id || row.id;
      await adminApi.put(A.slotById(id), { available: !row.available });
      setState((s) => ({
        ...s,
        items: s.items.map((it) => ((it.slot_id || it.id) === id ? { ...it, available: !row.available } : it))
      }));
    } catch (err) {
      alert(err?.message || 'Failed to update');
    }
  };

  const remove = async (row, e) => {
    e?.stopPropagation?.();
    if (!window.confirm(`Delete slot #${row.slot_id || row.id}? This cannot be undone.`)) return;
    try {
      const id = row.slot_id || row.id;
      await adminApi.delete(A.slotById(id));
      setState((s) => ({ ...s, items: s.items.filter((it) => (it.slot_id || it.id) !== id) }));
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
        <h1 className="text-xl font-semibold">Slots</h1>
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/slots/bulk')}>
            Bulk Create
          </button>
          <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/slots/new')}>
            New Slot
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          className="rounded-md border px-3 py-2"
          placeholder="Filter by attraction_id"
          value={state.attraction_id}
          onChange={(e) => setState((s) => ({ ...s, attraction_id: e.target.value }))}
        />
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => load(1)}>
          Filter
        </button>
      </div>

      <AdminTable
        keyField="slot_id"
        columns={[
          { key: 'slot_id', title: 'ID' },
          { key: 'attraction_id', title: 'Attraction' },
          { key: 'start_date', title: 'Start Date' },
          { key: 'end_date', title: 'End Date' },
          { key: 'start_time', title: 'Start Time', render: (r) => r.start_time_12h || r.start_time },
          { key: 'end_time', title: 'End Time', render: (r) => r.end_time_12h || r.end_time },
          { key: 'capacity', title: 'Capacity' },
          {
            key: 'available',
            title: 'Available',
            render: (row) => String(row?.available)
          },
          {
            key: '__actions',
            title: 'Actions',
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <button
                  className={`rounded-md px-2 py-1 text-xs ${row.available ? 'border text-red-600' : 'bg-blue-600 text-white'}`}
                  onClick={(e) => toggleAvailable(row, e)}
                >
                  {row.available ? 'Disable' : 'Enable'}
                </button>
                <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={(e) => remove(row, e)}>
                  Delete
                </button>
              </div>
            )
          }
        ]}
        rows={state.items}
        onRowClick={(row) => navigate(`/admin/catalog/slots/${row.slot_id || row.id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No slots found'}
      />

      <div className="mt-3 flex items-center gap-2">
        <button className="rounded-md border px-3 py-1 text-sm" onClick={() => canPrev && load(state.page - 1)} disabled={!canPrev || state.status === 'loading'}>Prev</button>
        <div className="text-sm text-gray-600">Page {meta.page || state.page}</div>
        <button className="rounded-md border px-3 py-1 text-sm" onClick={() => canNext && load(state.page + 1)} disabled={!canNext || state.status === 'loading'}>Next</button>
      </div>
    </div>
  );
}