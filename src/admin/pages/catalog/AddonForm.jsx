import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import ImageUploader from '../../components/common/ImageUploader';

export default function AddonForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    form: { title: '', description: '', price: 0, discount_percent: 0, image_url: '', active: true }
  });

  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.get(`${A.addons()}/${id}`);
        const a = res?.addon || res || {};
        setState((s) => ({ ...s, status: 'idle', form: {
          title: a.title || '',
          description: a.description || '',
          price: a.price || 0,
          discount_percent: a.discount_percent || 0,
          image_url: a.image_url || '',
          active: !!a.active
        }}));
      } catch (err) { setState((s) => ({ ...s, status: 'failed', error: err })); }
    })();
  }, [id, isEdit]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...state.form,
        price: Number(state.form.price || 0),
        discount_percent: Number(state.form.discount_percent || 0)
      };
      if (isEdit) await adminApi.put(`${A.addons()}/${id}`, payload);
      else await adminApi.post(A.addons(), payload);
      navigate('/admin/catalog/addons');
    } catch (err) { setState((s) => ({ ...s, error: err })); }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;

  return (
    <form onSubmit={save} className="max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Addon</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Title</label>
          <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.title} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, title: e.target.value } }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Price</label>
          <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.price} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, price: Number(e.target.value || 0) } }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Discount %</label>
          <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.discount_percent} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, discount_percent: Number(e.target.value || 0) } }))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Description</label>
          <textarea rows={4} className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.description} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, description: e.target.value } }))} />
        </div>
        <div className="md:col-span-2">
          <ImageUploader label="Image" value={f.image_url} onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, image_url: url } }))} requiredPerm="uploads:write" />
        </div>
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" checked={!!f.active} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, active: e.target.checked } }))} />
          <label htmlFor="active" className="text-sm text-gray-700 dark:text-neutral-200">Active</label>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm">Save</button>
        <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </form>
  );
}