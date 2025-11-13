// src/admin/pages/catalog/PagesList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';

export default function PagesList() {
  const [rows, setRows] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(''); // '' | 'true' | 'false'
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [err, setErr] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const fetchList = async () => {
    try {
      setLoading(true);
      setErr('');
      const params = { q, page, limit };
      if (active) params.active = active; // only send if user picked
      const res = await adminApi.get('/api/admin/pages', params);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const meta = res?.meta || null;
      setRows(list);
      setTotal(meta?.total ?? list.length);
    } catch (e) {
      setErr(e.message || 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchList();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <input
            className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
            placeholder="Search title/slug"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-md border px-2 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
            value={active}
            onChange={(e) => setActive(e.target.value)}
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="px-3 py-2 rounded-md border text-sm" type="submit">
            Search
          </button>
        </form>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm">Per page</label>
          <select
            className="rounded-md border px-2 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
          >
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <Link to="/admin/catalog/pages/new" className="px-3 py-2 rounded-md bg-gray-900 text-white text-sm">
            New Page
          </Link>
        </div>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="rounded-lg border bg-white dark:bg-neutral-900 dark:border-neutral-800 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">Nav</th>
              <th className="px-3 py-2 text-left">Placement</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.page_id} className="border-t dark:border-neutral-800">
                <td className="px-3 py-2">{r.title}</td>
                <td className="px-3 py-2">{r.slug}</td>
                <td className="px-3 py-2">{r.nav_group || '-'}</td>
                <td className="px-3 py-2">
                  {r.placement === 'none' ? '-' :
                    r.placement === 'home_bottom' ? 'Home: bottom' :
                    r.placement === 'attraction_details' ? `Attraction details (${r.placement_ref_id || '-'})` :
                    r.placement}
                </td>
                <td className="px-3 py-2">{r.active ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2 text-right">
                  <Link className="px-2 py-1 rounded-md border text-xs" to={`/admin/catalog/pages/${r.page_id}`}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                  No pages
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-600 dark:text-neutral-300">
          {total} result{total === 1 ? '' : 's'}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="px-3 py-1 rounded-md border text-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <div className="text-sm">Page {page}</div>
          <button
            className="px-3 py-1 rounded-md border text-sm"
            disabled={(page * limit) >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {loading ? <div className="text-sm text-gray-500">Loading…</div> : null}
    </div>
  );
}