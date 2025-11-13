import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import ImageUploader from '../../components/common/ImageUploader';
import RawEditor from '../../components/common/RawEditor';
import RichText from '../../components/common/RichText';

export default function BlogForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = React.useState({
    title: '',
    slug: '',
    author: '',
    active: true,
    image_url: '',
    editor_mode: 'rich',
    content: '',
    raw_html: '',
    raw_css: '',
    raw_js: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    section_type: 'none',
    section_ref_id: null,
    gallery: [],
  });
  const [err, setErr] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const row = await adminApi.get(`/api/admin/blogs/${id}`);
        setForm((f) => ({ ...f, ...row, editor_mode: row.editor_mode || 'rich' }));
      } catch (e) {
        setErr(e.message || 'Failed to load blog');
      }
    })();
  }, [id, isEdit]);

  const onChange = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (isEdit) {
        await adminApi.put(`/api/admin/blogs/${id}`, payload);
      } else {
        await adminApi.post('/api/admin/blogs', payload);
      }
      nav('/admin/catalog/blogs');
    } catch (e) {
      setErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const preview = async () => {
    try {
      const out = await adminApi.post('/api/admin/blogs/preview', form);
      const win = window.open('', '_blank');
      if (!win) return;
      let htmlDoc = '';
      if (form.editor_mode === 'raw') {
        htmlDoc = `
<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>${form.raw_css || ''}</style>
<title>${form.title || ''}</title></head><body>
${form.raw_html || ''}
<script>${form.raw_js || ''}<\/script></body></html>`;
      } else {
        htmlDoc = `
<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${form.title || ''}</title></head><body>${form.content || ''}</body></html>`;
      }
      win.document.open(); win.document.write(htmlDoc); win.document.close();
    } catch (e) { alert(e.message || 'Preview failed'); }
  };

  return (
    <form onSubmit={save} className="space-y-3 max-w-3xl">
      <div className="text-lg font-semibold">{isEdit ? 'Edit Blog' : 'Create Blog'}</div>
      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm">Title</label>
          <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.title} onChange={(e) => onChange({ title: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm">Slug</label>
          <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.slug} onChange={(e) => onChange({ slug: e.target.value })} placeholder="my-blog" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm">Author</label>
          <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.author} onChange={(e) => onChange({ author: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm">Featured image</label>
          <ImageUploader value={form.image_url} onChange={(url) => onChange({ image_url: url })} />
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!form.active} onChange={(e) => onChange({ active: e.target.checked })} />
        Active
      </label>

      <div className="rounded-lg border dark:border-neutral-800 p-2">
        <div className="flex items-center gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="radio" checked={form.editor_mode === 'rich'} onChange={() => onChange({ editor_mode: 'rich' })} />
            Visual editor
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" checked={form.editor_mode === 'raw'} onChange={() => onChange({ editor_mode: 'raw' })} />
            Raw (HTML/CSS/JS)
          </label>
          <button type="button" className="ml-auto px-3 py-1 rounded-md border text-sm" onClick={preview}>
            Preview
          </button>
        </div>
      </div>

      {form.editor_mode === 'raw' ? (
        <RawEditor
          value={{ raw_html: form.raw_html, raw_css: form.raw_css, raw_js: form.raw_js }}
          onChange={(v) => onChange(v)}
        />
      ) : (
        <>
          <label className="block text-sm">Content</label>
          <RichText value={form.content || ''} onChange={(v) => onChange({ content: v })} />
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm">Meta title</label>
          <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.meta_title || ''} onChange={(e) => onChange({ meta_title: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm">Meta description</label>
          <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.meta_description || ''} onChange={(e) => onChange({ meta_description: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm">Meta keywords</label>
          <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.meta_keywords || ''} onChange={(e) => onChange({ meta_keywords: e.target.value })} />
        </div>
      </div>

      <div className="flex gap-2">
        <button className="px-3 py-2 rounded-md bg-gray-900 text-white" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="px-3 py-2 rounded-md border" type="button" onClick={() => nav('/admin/catalog/blogs')}>
          Cancel
        </button>
      </div>
    </form>
  );
}