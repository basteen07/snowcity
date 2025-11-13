// src/admin/pages/admins/AdminNew.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';

export default function AdminNew() {
  const nav = useNavigate();
  const [form, setForm] = React.useState({ name: '', email: '', password: '' });
  const [err, setErr] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await adminApi.post('/api/admin/admins', form);
      nav('/admin/admins');
    } catch (e) {
      setErr(e.message || 'Create failed');
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-3">
      <div className="text-lg font-semibold">Create Admin</div>
      {err ? <div className="text-sm text-red-600">{err}</div> : null}
      <input className="w-full rounded-md border px-3 py-2" placeholder="Name"
             value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/>
      <input className="w-full rounded-md border px-3 py-2" placeholder="Email"
             value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/>
      <input type="password" className="w-full rounded-md border px-3 py-2" placeholder="Password"
             value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}/>
      <button className="px-3 py-2 rounded-md bg-gray-900 text-white">Create</button>
    </form>
  );
}