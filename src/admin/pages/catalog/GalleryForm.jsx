import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import ImageUploader from '../../components/common/ImageUploader';
import useCatalogTargets from '../../hooks/useCatalogTargets';

export default function GalleryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    form: {
      media_type: 'image',
      url: '',
      title: '',
      description: '',
      active: true,
      target_type: 'none',
      target_ref_id: null,
    }
  });

  // Load existing item in edit mode
  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.get(A.galleryById(id));
        const g = res?.gallery || res || {};
        setState((s) => ({
          ...s,
          status: 'idle',
          form: {
            media_type: g.media_type || 'image',
            url: g.url || '',
            title: g.title || '',
            description: g.description || '',
            active: g.active !== undefined ? !!g.active : true,
            target_type: g.target_type || 'none',
            target_ref_id: g.target_ref_id || null,
          }
        }));
      } catch (err) {
        setState((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
  }, [id, isEdit]);

  const onChange = (patch) => setState((s) => ({ ...s, form: { ...s.form, ...patch } }));

  const { attractions = [], combos = [], status: targetStatus } = useCatalogTargets();
  const targetOptions = React.useMemo(() => ({
    attraction: attractions.map((a) => ({ value: a.attraction_id || a.id, label: a.title || a.name || `Attraction #${a.attraction_id || a.id}` })),
    combo: combos.map((c) => ({ value: c.combo_id || c.id, label: c.title || c.name || `Combo #${c.combo_id || c.id}` })),
  }), [attractions, combos]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const { media_type, url, title, description, active, target_type, target_ref_id } = state.form;
      if (!media_type || !url) throw new Error('Media type and URL are required');
      const payload = {
        media_type,
        url,
        title,
        description,
        active,
        target_type,
        target_ref_id: target_type === 'none' ? null : (target_ref_id || null),
      };
      if (isEdit) await adminApi.put(A.galleryById(id), payload);
      else await adminApi.post(A.gallery(), payload);
      navigate('/admin/catalog/gallery');
    } catch (err) {
      setState((s) => ({ ...s, error: err }));
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;

  return (
    <form onSubmit={save} className="max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Gallery Item</h1>
      {state.error ? (
        <div className="mb-3 text-sm text-red-600">{state.error?.message || 'Save failed'}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Media Type</label>
          <select
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
            value={f.media_type}
            onChange={(e) => onChange({ media_type: e.target.value })}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>

        <div className="md:col-span-2">
          {f.media_type === 'image' ? (
            <ImageUploader
              label="Image"
              value={f.url}
              onChange={(url) => onChange({ url })}
              requiredPerm="uploads:write"
            />
          ) : (
            <>
              <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Video URL</label>
              <input
                className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
                placeholder="https://…"
                value={f.url}
                onChange={(e) => onChange({ url: e.target.value })}
              />
            </>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Title</label>
          <input
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
            value={f.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Description</label>
          <textarea
            rows={3}
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
            value={f.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Link to</label>
          <select
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
            value={f.target_type}
            onChange={(e) => onChange({ target_type: e.target.value, target_ref_id: null })}
          >
            <option value="none">No specific page</option>
            <option value="attraction">Attraction</option>
            <option value="combo">Combo</option>
          </select>
        </div>

        {f.target_type !== 'none' ? (
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">
              {f.target_type === 'attraction' ? 'Select attraction' : 'Select combo'}
            </label>
            <select
              className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
              value={f.target_ref_id || ''}
              onChange={(e) => onChange({ target_ref_id: e.target.value ? Number(e.target.value) : null })}
              disabled={targetStatus === 'loading'}
            >
              <option value="">
                {targetStatus === 'loading' ? 'Loading…' : 'Select an option'}
              </option>
              {(targetOptions[f.target_type] || []).map((opt) => (
                <option key={`${f.target_type}-${opt.value}`} value={opt.value || ''}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex items-center gap-2 md:col-span-2">
          <input id="active" type="checkbox" checked={!!f.active} onChange={(e) => onChange({ active: e.target.checked })} />
          <label htmlFor="active" className="text-sm text-gray-700 dark:text-neutral-200">Active</label>
        </div>

        {/* Preview */}
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Preview</label>
          <div className="w-full h-48 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
            {f.url ? (
              f.media_type === 'video' ? (
                <video className="w-full h-full object-cover" src={f.url} muted controls preload="metadata" />
              ) : (
                <img className="w-full h-full object-cover" src={f.url} alt={f.title || 'Preview'} />
              )
            ) : (
              <div className="text-sm text-gray-500">No media selected</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm">Save</button>
        <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </form>
  );
}
