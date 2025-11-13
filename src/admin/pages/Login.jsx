import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogin } from '../features/auth/adminAuthThunks';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.adminAuth?.token);
  const [form, setForm] = React.useState({ email: '', password: '' });
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState(null);

  if (token) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading'); setError(null);
    try {
      await dispatch(adminLogin(form)).unwrap();
    } catch (err) {
      setError(err?.message || 'Login failed'); setStatus('failed');
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-xl border p-6 shadow">
        <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
        <label className="block text-sm mb-1">Email</label>
        <input className="w-full rounded-md border px-3 py-2 mb-3" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label className="block text-sm mb-1">Password</label>
        <input className="w-full rounded-md border px-3 py-2 mb-3" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error ? <div className="text-sm text-red-600 mb-2">{error}</div> : null}
        <button className="w-full rounded-md bg-gray-900 text-white py-2 text-sm" disabled={status === 'loading'}>
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}