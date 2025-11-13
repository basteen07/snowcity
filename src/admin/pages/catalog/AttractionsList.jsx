import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

export default function AttractionsList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    error: null,
    q: '',
    active: '',
    page: 1,
    limit: 20,
    meta: null,
    reorder: false,
    saving: false
  });

  const load = async (page = 1) => {
    setState((s) => ({ ...s, status: 'loading', error: null, page }));
    try {
      const res = await adminApi.get(A.attractions(), {
        params: { q: state.q || undefined, active: state.active || undefined, page, limit: state.limit }
      });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items, meta: res?.meta || null, page }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  React.useEffect(() => { load(1); /* eslint-disable-line */ }, []);

  const remove = async (row, e) => {
    e?.stopPropagation?.();
    if (!window.confirm(`Delete attraction "${row.title}"? This cannot be undone.`)) return;
    try {
      const id = row.attraction_id || row.id;
      await adminApi.delete(`${A.attractions()}/${id}`);
      setState((s) => ({ ...s, items: s.items.filter((it) => (it.attraction_id || it.id) !== id) }));
    } catch (err) {
      alert(err?.message || 'Delete failed');
    }
  };

  // Reorder handling
  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setState((s) => {
      const oldIndex = s.items.findIndex((x) => String(x.attraction_id) === String(active.id));
      const newIndex = s.items.findIndex((x) => String(x.attraction_id) === String(over.id));
      const items = arrayMove(s.items, oldIndex, newIndex);
      return { ...s, items };
    });
  };

  const saveOrder = async () => {
    const ids = state.items.map((a) => a.attraction_id);
    setState((s) => ({ ...s, saving: true }));
    try {
      try {
        // Preferred single-call reorder
        await adminApi.post(A.attractionsReorder(), { ids });
      } catch {
        // Fallback: set sort_order individually if supported
        await Promise.all(ids.map((id, idx) => adminApi.put(`${A.attractions()}/${id}`, { sort_order: idx })));
      }
      alert('Order saved');
    } catch (err) {
      alert(err?.message || 'Failed to save order');
    } finally {
      setState((s) => ({ ...s, saving: false, reorder: false }));
      load(state.page);
    }
  };

  const meta = state.meta || {};
  const canPrev = state.page > 1;
  const canNext = meta.page ? (meta.page < (meta.totalPages || meta.total_pages || 1)) : false;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Attractions</h1>
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setState((s) => ({ ...s, reorder: !s.reorder }))}>
            {state.reorder ? 'Exit Reorder' : 'Reorder'}
          </button>
          {state.reorder ? (
            <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm disabled:opacity-50" onClick={saveOrder} disabled={state.saving}>
              {state.saving ? 'Saving…' : 'Save Order'}
            </button>
          ) : (
            <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/attractions/new')}>
              New Attraction
            </button>
          )}
        </div>
      </div>

      {!state.reorder ? (
        <>
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
            keyField="attraction_id"
            columns={[
              { key: 'title', title: 'Title' },
              { key: 'base_price', title: 'Base Price', render: (row) => `₹${row?.base_price ?? 0}` },
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
                    <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={(e) => remove(row, e)}>
                      Delete
                    </button>
                  </div>
                )
              }
            ]}
            rows={state.items}
            onRowClick={(row) => navigate(`/admin/catalog/attractions/${row.attraction_id || row.id}`)}
            empty={state.status === 'loading' ? 'Loading…' : 'No attractions'}
          />

          <div className="mt-3 flex items-center gap-2">
            <button className="rounded-md border px-3 py-1 text-sm" onClick={() => canPrev && load(state.page - 1)} disabled={!canPrev || state.status === 'loading'}>Prev</button>
            <div className="text-sm text-gray-600">Page {meta.page || state.page}</div>
            <button className="rounded-md border px-3 py-1 text-sm" onClick={() => canNext && load(state.page + 1)} disabled={!canNext || state.status === 'loading'}>Next</button>
          </div>
        </>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white dark:bg-neutral-900">
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={state.items.map((a) => String(a.attraction_id))} strategy={verticalListSortingStrategy}>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Drag</th>
                    <th className="px-3 py-2 text-left">Title</th>
                    <th className="px-3 py-2 text-left">Base Price</th>
                    <th className="px-3 py-2 text-left">Active</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-neutral-200">
                  {state.items.map((r) => (
                    <tr key={r.attraction_id} id={String(r.attraction_id)} className="border-t border-gray-200 dark:border-neutral-800">
                      <td className="px-3 py-2 cursor-grab">⋮⋮</td>
                      <td className="px-3 py-2">{r.title || '—'}</td>
                      <td className="px-3 py-2">₹{r?.base_price ?? 0}</td>
                      <td className="px-3 py-2">{String(r?.active)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}