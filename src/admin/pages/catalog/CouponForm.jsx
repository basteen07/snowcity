import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

const TYPES = ['flat', 'percent', 'bogo', 'specific'];

export default function CouponForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    attractions: [],
    form: {
      code: '',
      description: '',
      type: 'flat',
      value: 0,
      attraction_id: '',
      min_amount: 0,
      valid_from: '',
      valid_to: '',
      active: true
    }
  });

  React.useEffect(() => {
    (async () => {
      try {
        const ar = await adminApi.get(A.attractions());
        const attractions = Array.isArray(ar?.data) ? ar.data : Array.isArray(ar) ? ar : [];
        setState((s) => ({ ...s, attractions }));
      } catch {}
    })();
  }, []);

  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.get(`${A.coupons()}/${id}`);
        const c = res?.coupon || res || {};
        setState((s) => ({
          ...s,
          status: 'idle',
          form: {
            code: c.code || '',
            description: c.description || '',
            type: c.type || 'flat',
            value: Number(c.value || 0),
            attraction_id: c.attraction_id || '',
            min_amount: Number(c.min_amount || 0),
            valid_from: c.valid_from || '',
            valid_to: c.valid_to || '',
            active: !!c.active
          }
        }));
      } catch (err) {
        setState((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
  }, [id, isEdit]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...state.form,
        value: Number(state.form.value || 0),
        min_amount: Number(state.form.min_amount || 0),
        attraction_id: state.form.attraction_id || null
      };
      if (isEdit) await adminApi.put(`${A.coupons()}/${id}`, payload);
      else await adminApi.post(A.coupons(), payload);
      navigate('/admin/catalog/coupons');
    } catch (err) {
      setState((s) => ({ ...s, error: err }));
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;

  return (
    <form onSubmit={save} className="max-w-2xl bg-white border rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Coupon</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Code</label>
          <input className="w-full rounded-md border px-3 py-2" value={f.code} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, code: e.target.value.toUpperCase() } }))} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Type</label>
          <select className="w-full rounded-md border px-3 py-2" value={f.type} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, type: e.target.value } }))}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Value</label>
          <input type="number" className="w-full rounded-md border px-3 py-2" value={f.value} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, value: Number(e.target.value || 0) } }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Min Amount</label>
          <input type="number" className="w-full rounded-md border px-3 py-2" value={f.min_amount} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, min_amount: Number(e.target.value || 0) } }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Attraction (optional)</label>
          <select className="w-full rounded-md border px-3 py-2" value={f.attraction_id || ''} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, attraction_id: e.target.value } }))}>
            <option value="">All attractions</option>
            {(state.attractions || []).map((a) => (
              <option key={a.attraction_id} value={a.attraction_id}>{a.title}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" checked={!!f.active} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, active: e.target.checked } }))} />
          <label htmlFor="active" className="text-sm text-gray-700">Active</label>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Valid From</label>
          <input type="date" className="w-full rounded-md border px-3 py-2" value={f.valid_from || ''} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, valid_from: e.target.value } }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Valid To</label>
          <input type="date" className="w-full rounded-md border px-3 py-2" value={f.valid_to || ''} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, valid_to: e.target.value } }))} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Description</label>
          <textarea rows={4} className="w-full rounded-md border px-3 py-2" value={f.description} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, description: e.target.value } }))} />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm">Save</button>
        <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </form>
  );
}