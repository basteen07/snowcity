import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

export default function ComboForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    attractions: [],
    form: {
      attraction_1_id: '',
      attraction_2_id: '',
      combo_price: 0,
      discount_percent: 0,
      active: true
    }
  });

  // Load attractions for pickers
  React.useEffect(() => {
    (async () => {
      try {
        const res = await adminApi.get(A.attractions());
        const attractions = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setState((s) => ({ ...s, attractions }));
      } catch {}
    })();
  }, []);

  // Load combo if editing
  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.get(A.comboById(id));
        const c = res?.combo || res || {};
        setState((s) => ({ ...s, status: 'idle', form: {
          attraction_1_id: c.attraction_1_id || '',
          attraction_2_id: c.attraction_2_id || '',
          combo_price: c.combo_price || 0,
          discount_percent: c.discount_percent || 0,
          active: !!c.active
        }}));
      } catch (err) { setState((s) => ({ ...s, status: 'failed', error: err })); }
    })();
  }, [id, isEdit]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const f = state.form;
      if (!f.attraction_1_id || !f.attraction_2_id || f.attraction_1_id === f.attraction_2_id) {
        alert('Select two different attractions'); return;
      }
      const payload = {
        attraction_1_id: Number(f.attraction_1_id),
        attraction_2_id: Number(f.attraction_2_id),
        combo_price: Number(f.combo_price || 0),
        discount_percent: Number(f.discount_percent || 0),
        active: !!f.active
      };
      if (isEdit) await adminApi.put(A.comboById(id), payload);
      else await adminApi.post(A.combos(), payload);
      navigate('/admin/catalog/combos');
    } catch (err) { setState((s) => ({ ...s, error: err })); }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;
  const list = state.attractions || [];

  return (
    <form onSubmit={save} className="max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Combo</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Attraction #1</label>
          <select className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.attraction_1_id} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, attraction_1_id: e.target.value } }))}>
            <option value="">—</option>
            {list.map((a) => <option key={a.attraction_id} value={a.attraction_id}>{a.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Attraction #2</label>
          <select className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.attraction_2_id} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, attraction_2_id: e.target.value } }))}>
            <option value="">—</option>
            {list.map((a) => <option key={a.attraction_id} value={a.attraction_id}>{a.title}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Combo Price</label>
          <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.combo_price} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, combo_price: Number(e.target.value || 0) } }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Discount %</label>
          <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.discount_percent} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, discount_percent: Number(e.target.value || 0) } }))} />
        </div>

        <div className="flex items-center gap-2 md:col-span-2">
          <input id="active" type="checkbox" checked={!!f.active} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, active: e.target.checked } }))} />
          <label htmlFor="active" className="text-sm text-gray-700 dark:text-neutral-200">Active</label>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm">Save</button>
        <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
      </div>

      {state.error ? <div className="mt-2 text-sm text-red-600">{state.error?.message || 'Error'}</div> : null}
    </form>
  );
}