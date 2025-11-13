// src/admin/pages/admins/AdminsList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';

export default function AdminsList() {
  const [rows, setRows] = React.useState([]);
  const [q, setQ] = React.useState('');

  async function load() {
    const data = await adminApi.get('/api/admin/admins', { search: q });
    setRows(Array.isArray(data) ? data : []);
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
               placeholder="Search by name/email/phone"
               value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="px-3 py-2 rounded-md border text-sm" onClick={load}>Search</button>
        <Link to="/admin/admins/new" className="ml-auto px-3 py-2 rounded-md bg-gray-900 text-white text-sm">Create Admin</Link>
      </div>

      <div className="rounded-lg border bg-white dark:bg-neutral-900 dark:border-neutral-800 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Roles</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-t dark:border-neutral-800">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.phone || ''}</td>
                <td className="px-3 py-2">{(r.roles || []).join(', ')}</td>
                <td className="px-3 py-2 text-right">
                  <Link className="px-2 py-1 rounded-md border text-xs" to={`/admin/admins/${r.user_id}/access`}>Manage Access</Link>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={5}>No admins</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}