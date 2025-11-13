// src/admin/pages/admins/AdminAccess.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';

function Section({ title, items, sel, setSel }) {
  const toggle = (id) => {
    setSel((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  return (
    <div className="rounded-lg border p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="font-medium mb-2">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map((it) => (
          <label key={it.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sel.includes(it.id)} onChange={() => toggle(it.id)} />
            <span>{it.label}</span>
          </label>
        ))}
        {!items.length && <div className="text-xs text-gray-500">No items</div>}
      </div>
    </div>
  );
}

export default function AdminAccess() {
  const { id } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [access, setAccess] = React.useState({ attraction: [], combo: [], banner: [], page: [], blog: [], gallery: [] });
  const [lists, setLists] = React.useState({ attractions: [], combos: [], banners: [], pages: [], blogs: [], gallery: [] });
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [acc, atts, cmbs, bnrs, pgs, blgs, gll] = await Promise.all([
          adminApi.get(`/api/admin/admins/${id}/access`),
          adminApi.get('/api/admin/attractions', { limit: 200 }),
          adminApi.get('/api/admin/combos', { active: true }),
          adminApi.get('/api/admin/banners', { limit: 200 }),
          adminApi.get('/api/admin/pages', { limit: 200 }),
          adminApi.get('/api/admin/blogs', { limit: 200 }),
          adminApi.get('/api/admin/gallery', { limit: 200 }),
        ]);
        setAccess({
          attraction: acc?.access?.attraction || [],
          combo: acc?.access?.combo || [],
          banner: acc?.access?.banner || [],
          page: acc?.access?.page || [],
          blog: acc?.access?.blog || [],
          gallery: acc?.access?.gallery || [],
        });
        setLists({
          attractions: (atts?.data || atts || []).map((a) => ({ id: a.attraction_id, label: a.title })),
          combos: (cmbs?.data || cmbs || []).map((c) => ({ id: c.combo_id, label: `${c.attraction_1_id}+${c.attraction_2_id}` })),
          banners: (bnrs?.data || bnrs || []).map((b) => ({ id: b.banner_id, label: b.title || `Banner #${b.banner_id}` })),
          pages: (pgs?.data || pgs || []).map((p) => ({ id: p.page_id, label: p.title })),
          blogs: (blgs?.data || blgs || []).map((b) => ({ id: b.blog_id, label: b.title })),
          gallery: (gll?.data || gll || []).map((g) => ({ id: g.gallery_item_id, label: g.title || g.url })),
        });
      } catch (e) {
        setErr(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const save = async () => {
    try {
      setErr('');
      await adminApi.put(`/api/admin/admins/${id}/access`, { access });
      nav('/admin/admins');
    } catch (e) {
      setErr(e.message || 'Save failed');
    }
  };

  if (loading) return <div className="p-3 text-sm">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">Manage Access for Admin #{id}</div>
      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <Section title="Attractions (bookings/slots scope)" items={lists.attractions} sel={access.attraction} setSel={(v) => setAccess({ ...access, attraction: v })} />
      <Section title="Combos" items={lists.combos} sel={access.combo} setSel={(v) => setAccess({ ...access, combo: v })} />
      <Section title="Banners" items={lists.banners} sel={access.banner} setSel={(v) => setAccess({ ...access, banner: v })} />
      <Section title="Pages" items={lists.pages} sel={access.page} setSel={(v) => setAccess({ ...access, page: v })} />
      <Section title="Blogs" items={lists.blogs} sel={access.blog} setSel={(v) => setAccess({ ...access, blog: v })} />
      <Section title="Gallery" items={lists.gallery} sel={access.gallery} setSel={(v) => setAccess({ ...access, gallery: v })} />

      <div className="flex gap-2">
        <button className="px-3 py-2 rounded-md bg-gray-900 text-white" onClick={save}>Save</button>
        <button className="px-3 py-2 rounded-md border" onClick={() => nav(-1)}>Cancel</button>
      </div>
    </div>
  );
}