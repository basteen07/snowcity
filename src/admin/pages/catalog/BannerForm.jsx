import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import ImageUploader from '../../components/common/ImageUploader';

export default function BannerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    attractions: [],
    offers: [],
    form: {
      title: '',
      description: '',
      web_image: '',
      mobile_image: '',
      linked_attraction_id: '',
      linked_offer_id: '',
      active: true
    }
  });

  // Load pickers
  React.useEffect(() => {
    (async () => {
      try {
        const [ar, of] = await Promise.all([adminApi.get(A.attractions()), adminApi.get(A.offers())]);
        const attractions = Array.isArray(ar?.data) ? ar.data : Array.isArray(ar) ? ar : [];
        const offers = Array.isArray(of?.data) ? of.data : Array.isArray(of) ? of : [];
        setState((s) => ({ ...s, attractions, offers }));
      } catch {}
    })();
  }, []);

  // Load banner if edit
  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.get(`${A.banners()}/${id}`);
        const b = res?.banner || res || {};
        setState((s) => ({ ...s, status: 'idle', form: {
          title: b.title || '',
          description: b.description || '',
          web_image: b.web_image || '',
          mobile_image: b.mobile_image || '',
          linked_attraction_id: b.linked_attraction_id || '',
          linked_offer_id: b.linked_offer_id || '',
          active: !!b.active
        }}));
      } catch (err) {
        setState((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
  }, [id, isEdit]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...state.form };
      if (!payload.linked_attraction_id) delete payload.linked_attraction_id;
      if (!payload.linked_offer_id) delete payload.linked_offer_id;
      if (isEdit) await adminApi.put(`${A.banners()}/${id}`, payload);
      else await adminApi.post(A.banners(), payload);
      navigate('/admin/catalog/banners');
    } catch (err) {
      setState((s) => ({ ...s, error: err }));
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;

  return (
    <form onSubmit={save} className="max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Banner</h1>
      {state.error ? (
        <div className="mb-3 text-sm text-red-600">{state.error?.message || 'Save failed'}</div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Title</label>
          <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.title} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, title: e.target.value } }))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Description</label>
          <textarea rows={3} className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.description} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, description: e.target.value } }))} />
        </div>

        <div className="md:col-span-2">
          <ImageUploader label="Web Image" value={f.web_image} onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, web_image: url } }))} requiredPerm="uploads:write" />
        </div>
        <div className="md:col-span-2">
          <ImageUploader label="Mobile Image" value={f.mobile_image} onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, mobile_image: url } }))} requiredPerm="uploads:write" />
        </div>

        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Link Attraction</label>
          <select className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.linked_attraction_id || ''} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, linked_attraction_id: e.target.value, linked_offer_id: '' } }))}>
            <option value="">—</option>
            {(state.attractions || []).map((a) => (
              <option key={a.attraction_id} value={a.attraction_id}>{a.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Link Offer</label>
          <select className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.linked_offer_id || ''} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, linked_offer_id: e.target.value, linked_attraction_id: '' } }))}>
            <option value="">—</option>
            {(state.offers || []).map((o) => (
              <option key={o.offer_id} value={o.offer_id}>{o.title}</option>
            ))}
          </select>
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
    </form>
  );
}