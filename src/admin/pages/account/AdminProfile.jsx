import React from 'react';
import adminApi from '../../services/adminApi';

export default function AdminProfile() {
  const [st, setSt] = React.useState({
    status: 'loading',
    error: null,
    form: { name: '', email: '', phone: '' },
    saving: false
  });

  React.useEffect(() => {
    (async () => {
      try {
        // Use public current user endpoint (works with admin token if same scheme)
        const res = await adminApi.get('/api/users/me');
        const u = res?.user || res || {};
        setSt((s) => ({ ...s, status: 'idle', form: { name: u.name || '', email: u.email || '', phone: u.phone || '' } }));
      } catch (err) {
        setSt((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSt((s) => ({ ...s, saving: true }));
    try {
      await adminApi.patch('/api/users/me', st.form);
      alert('Profile updated');
    } catch (err) {
      alert(err?.message || 'Update failed');
    } finally {
      setSt((s) => ({ ...s, saving: false }));
    }
  };

  if (st.status === 'loading') return <div>Loading…</div>;
  if (st.status === 'failed') return <div className="text-red-600">{st.error?.message || 'Failed to load profile'}</div>;

  const f = st.form;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-neutral-100">Profile & Settings</h1>
      <form onSubmit={save} className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Name</label>
            <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.name} onChange={(e) => setSt((s) => ({ ...s, form: { ...s.form, name: e.target.value } }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Email</label>
            <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" type="email" value={f.email} onChange={(e) => setSt((s) => ({ ...s, form: { ...s.form, email: e.target.value } }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Phone</label>
            <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" type="tel" value={f.phone} onChange={(e) => setSt((s) => ({ ...s, form: { ...s.form, phone: e.target.value } }))} />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={st.saving} className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm disabled:opacity-50">
            {st.saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>

      <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-4 mt-6">
        <h2 className="font-semibold mb-2 text-gray-900 dark:text-neutral-100">Security</h2>
        <p className="text-sm text-gray-600 dark:text-neutral-300">Password updates are handled via “Forgot password” flow for now.</p>
      </div>
    </div>
  );
}