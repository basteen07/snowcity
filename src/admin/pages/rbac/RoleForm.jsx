import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

export default function RoleForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    form: { role_name: '', description: '' }
  });

  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.get(A.roleById(id));
        const r = res?.role || res || {};
        setState((s) => ({ ...s, status: 'idle', form: { role_name: r.role_name || '', description: r.description || '' } }));
      } catch (err) {
        setState((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
  }, [id, isEdit]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) await adminApi.put(A.roleById(id), state.form);
      else await adminApi.post(A.roles(), state.form);
      navigate('/admin/roles');
    } catch (err) {
      setState((s) => ({ ...s, error: err }));
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;
  return (
    <form onSubmit={save} className="max-w-xl bg-white border rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Role</h1>
      <label className="block text-sm text-gray-600 mb-1">Role Name</label>
      <input className="w-full rounded-md border px-3 py-2 mb-3" value={f.role_name} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, role_name: e.target.value } }))} />
      <label className="block text-sm text-gray-600 mb-1">Description</label>
      <textarea className="w-full rounded-md border px-3 py-2 mb-3" rows={4} value={f.description} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, description: e.target.value } }))} />
      <div className="flex gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm">Save</button>
        {isEdit ? <Link to={`/admin/roles/${id}/permissions`} className="rounded-md border px-4 py-2 text-sm">Edit Permissions</Link> : null}
        <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </form>
  );
}