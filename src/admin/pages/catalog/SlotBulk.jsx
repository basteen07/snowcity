import React from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

export default function SlotBulk() {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({
    attraction_id: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    capacity: 0,
    price: '',
    available: true
  });
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [attractions, setAttractions] = React.useState([]);

  const change = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  React.useEffect(() => {
    (async () => {
      try {
        const res = await adminApi.get(A.attractions());
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setAttractions(items);
      } catch {}
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading'); setError(null); setResult(null);
    try {
      const payload = {
        attraction_id: form.attraction_id,
        start_date: form.start_date,
        end_date: form.end_date,
        start_time: form.start_time,
        end_time: form.end_time,
        duration_minutes: Number(form.duration_minutes || 0),
        capacity: Number(form.capacity || 0),
        price: form.price === '' ? null : Number(form.price),
        available: !!form.available
      };
      const res = await adminApi.post(A.slotsBulk(), payload);
      setResult(res);
      setStatus('succeeded');
    } catch (err) {
      setError(err?.message || 'Bulk creation failed');
      setStatus('failed');
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-4">Bulk Create Slots</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Attraction</label>
          <select className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={form.attraction_id} onChange={(e) => change('attraction_id', e.target.value)} required>
            <option value="">— Select attraction —</option>
            {attractions.map((a) => (
              <option key={a.attraction_id} value={a.attraction_id}>{a.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Capacity</label>
          <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={form.capacity} onChange={(e) => change('capacity', Number(e.target.value || 0))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Start Date</label>
          <input type="date" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={form.start_date} onChange={(e) => change('start_date', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">End Date</label>
          <input type="date" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={form.end_date} onChange={(e) => change('end_date', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Start Time</label>
          <input type="time" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={form.start_time} onChange={(e) => change('start_time', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">End Time</label>
          <input type="time" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={form.end_time} onChange={(e) => change('end_time', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Duration Minutes</label>
          <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={form.duration_minutes} onChange={(e) => change('duration_minutes', Number(e.target.value || 0))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Price (optional)</label>
          <input type="number" step="0.01" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={form.price} onChange={(e) => change('price', e.target.value)} />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input id="available" type="checkbox" checked={!!form.available} onChange={(e) => change('available', e.target.checked)} />
          <label htmlFor="available" className="text-sm text-gray-700 dark:text-neutral-200">Available</label>
        </div>
      </div>

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
      {result ? (
        <div className="mt-3 text-sm text-gray-700 dark:text-neutral-200">
          <div>Created: {result.created || 0}</div>
          <div>Skipped: {result.skipped || 0}</div>
          {Array.isArray(result.conflicts) && result.conflicts.length ? (
            <div className="mt-2">
              <div className="font-medium">Conflicts</div>
              <ul className="list-disc pl-5">
                {result.conflicts.slice(0, 100).map((c, i) => (
                  <li key={i}>{c.date} {c.start_time} - {c.end_time}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm" disabled={status === 'loading'}>
          {status === 'loading' ? 'Creating…' : 'Create Slots'}
        </button>
        <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </form>
  );
}
