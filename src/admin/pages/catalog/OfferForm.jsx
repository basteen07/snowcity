import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import ImageUploader from '../../components/common/ImageUploader';

const RULES = ['holiday', 'happy_hour', 'weekday_special'];

export default function OfferForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    form: {
      title: '',
      description: '',
      image_url: '',
      rule_type: '',
      discount_percent: 0,
      valid_from: '',
      valid_to: '',
      active: true
    }
  });

  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.get(`${A.offers()}/${id}`);
        const o = res?.offer || res || {};
        setState((s) => ({ ...s, status: 'idle', form: {
          title: o.title || '',
          description: o.description || '',
          image_url: o.image_url || '',
          rule_type: o.rule_type || '',
          discount_percent: o.discount_percent || 0,
          valid_from: o.valid_from || '',
          valid_to: o.valid_to || '',
          active: !!o.active
        }}));
      } catch (err) { setState((s) => ({ ...s, status: 'failed', error: err })); }
    })();
  }, [id, isEdit]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...state.form,
        discount_percent: Number(state.form.discount_percent || 0)
      };
      if (isEdit) await adminApi.put(`${A.offers()}/${id}`, payload);
      else await adminApi.post(A.offers(), payload);
      navigate('/admin/catalog/offers');
    } catch (err) { setState((s) => ({ ...s, error: err })); }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;

  return (
    <form onSubmit={save} className="max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Offer</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Title</label>
          <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.title} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, title: e.target.value } }))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Description</label>
          <textarea rows={4} className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.description} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, description: e.target.value } }))} />
        </div>
        <div className="md:col-span-2">
          <ImageUploader label="Image" value={f.image_url} onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, image_url: url } }))} requiredPerm="uploads:write" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Rule Type</label>
          <select className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.rule_type} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, rule_type: e.target.value } }))}>
            <option value="">—</option>
            {RULES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Discount %</label>
          <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.discount_percent} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, discount_percent: Number(e.target.value || 0) } }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Valid From</label>
          <input type="date" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.valid_from || ''} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, valid_from: e.target.value } }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Valid To</label>
          <input type="date" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.valid_to || ''} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, valid_to: e.target.value } }))} />
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