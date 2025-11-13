import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';

export default function GalleryManager() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    error: null,
  });
  const [filters, setFilters] = React.useState({ q: '', type: '' });

  const load = React.useCallback(async (nextFilters = filters) => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const params = {
        q: nextFilters.q || undefined,
        type: nextFilters.type || undefined,
      };
      const res = await adminApi.get(A.gallery(), { params });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState({ status: 'succeeded', items, error: null });
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  }, [filters]);

  React.useEffect(() => { load(filters); }, [load, filters]);

  const columns = [
    {
      key: 'preview',
      title: 'Preview',
      render: (row) => (
        <div className="w-20 h-14 rounded-md overflow-hidden bg-gray-100">
          {row.media_type === 'video' ? (
            <video src={row.url} className="w-full h-full object-cover" muted />
          ) : (
            <img src={row.url} alt={row.title || 'Gallery media'} className="w-full h-full object-cover" />
          )}
        </div>
      )
    },
    { key: 'title', title: 'Title' },
    { key: 'media_type', title: 'Type' },
    { key: 'status', title: 'Status' },
    { key: 'priority', title: 'Priority' },
    { key: 'created_at', title: 'Created' },
    { key: 'updated_at', title: 'Updated' },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold">Gallery</h1>
          <p className="text-sm text-gray-600">Manage homepage and gallery media assets.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/banners')}>
            Manage Banners
          </button>
          <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/gallery/new')}>
            Add Media
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <input
          className="rounded-md border px-3 py-2"
          placeholder="Search title"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <select
          className="rounded-md border px-3 py-2"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">Type: All</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => load(filters)} disabled={state.status === 'loading'}>
          Apply
        </button>
        <button
          className="rounded-md border px-3 py-2 text-sm"
          onClick={() => {
            setFilters({ q: '', type: '' });
            load({ q: '', type: '' });
          }}
        >
          Reset
        </button>
      </div>

      {state.status === 'failed' && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          Failed to load gallery items. {state.error?.message || ''}
        </div>
      )}

      <AdminTable
        keyField="gallery_id"
        columns={columns}
        rows={state.items}
        onRowClick={(row) => navigate(`/admin/catalog/gallery/${row.gallery_id || row.id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No media found'}
      />
    </div>
  );
}
