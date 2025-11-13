// src/admin/pages/catalog/ComboSlotForm.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';

function hhmm(ss) {
  // "HH:MM:SS" -> "HH:MM"
  if (!ss) return '';
  const [h, m] = String(ss).split(':');
  return `${h?.padStart(2,'0')}:${m?.padStart(2,'0')}`;
}
function to12h(hhmm) {
  // '14:00' -> '02.00pm', '09:30' -> '09.30am'
  if (!hhmm) return '';
  const [hStr, mStr] = String(hhmm).split(':');
  let h = Number(hStr);
  const m = Number(mStr);
  const ap = h >= 12 ? 'pm' : 'am';
  let hr = h % 12;
  if (hr === 0) hr = 12;
  return `${String(hr).padStart(2,'0')}.${String(m).padStart(2,'0')}${ap}`;
}

export default function ComboSlotForm() {
  const { id } = useParams();
  const nav = useNavigate();

  const [combos, setCombos] = React.useState([]);
  const [form, setForm] = React.useState({
    combo_id: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    capacity: '',
    price: '',
    available: true,
  });
  const [loading, setLoading] = React.useState(!!id);
  const [err, setErr] = React.useState('');
  const isEdit = !!id;

  React.useEffect(() => {
    (async () => {
      const data = await adminApi.get('/api/admin/combos', { active: true });
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setCombos(list);
    })();
  }, []);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const row = await adminApi.get(`/api/admin/combo-slots/${id}`);
        setForm({
          combo_id: row.combo_id || '',
          start_date: row.start_date || '',
          end_date: row.end_date || row.start_date || '',
          start_time: hhmm(row.start_time), // show "HH:MM" in <input type="time" />
          end_time: hhmm(row.end_time),
          capacity: row.capacity ?? '',
          price: row.price ?? '',
          available: !!row.available,
        });
      } catch (e) {
        setErr(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    const payload = {
      combo_id: Number(form.combo_id),
      start_date: form.start_date,
      end_date: form.end_date || form.start_date,
      start_time: to12h(form.start_time),  // send 12h
      end_time: to12h(form.end_time),      // send 12h
      capacity: Number(form.capacity),
      price: form.price === '' || form.price == null ? null : Number(form.price),
      available: !!form.available,
    };

    try {
      if (isEdit) {
        await adminApi.put(`/api/admin/combo-slots/${id}`, payload);
      } else {
        await adminApi.post('/api/admin/combo-slots', payload);
      }
      nav('/admin/catalog/combo-slots');
    } catch (e) {
      setErr(e.message || 'Save failed');
    }
  };

  if (loading) return <div className="p-3 text-sm">Loading…</div>;

  return (
    <form onSubmit={submit} className="max-w-xl space-y-3">
      <div className="text-lg font-semibold">{isEdit ? 'Edit Combo Slot' : 'Create Combo Slot'}</div>
      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <label className="block text-sm">Combo</label>
      <select
        className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
        value={form.combo_id}
        onChange={(e) => onChange('combo_id', e.target.value)}
        required
      >
        <option value="">Select combo</option>
        {combos.map((c) => (
          <option key={c.combo_id} value={c.combo_id}>
            {c.title || `Combo #${c.combo_id}`}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm">Start date</label>
          <input
            type="date"
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.start_date}
            onChange={(e) => onChange('start_date', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm">End date</label>
          <input
            type="date"
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.end_date}
            onChange={(e) => onChange('end_date', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm">Start time</label>
          <input
            type="time"
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.start_time}
            onChange={(e) => onChange('start_time', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm">End time</label>
          <input
            type="time"
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.end_time}
            onChange={(e) => onChange('end_time', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm">Capacity</label>
          <input
            type="number"
            min="1"
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.capacity}
            onChange={(e) => onChange('capacity', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm">Price (optional)</label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.price}
            onChange={(e) => onChange('price', e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.available}
              onChange={(e) => onChange('available', e.target.checked)}
            />
            Available
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="px-3 py-2 rounded-md bg-gray-900 text-white" type="submit">
          {isEdit ? 'Update' : 'Create'}
        </button>
        <button className="px-3 py-2 rounded-md border" type="button" onClick={() => nav('/admin/catalog/combo-slots')}>
          Cancel
        </button>
      </div>
    </form>
  );
}