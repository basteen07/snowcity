// src/admin/pages/catalog/ComboSlotBulk.jsx
import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';

// Helpers
function toMinutes(hhmm) {
  if (!hhmm) return NaN;
  const [h, m] = String(hhmm).split(':').map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}
function fmtHM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function to12h(hhmm) {
  // '14:00' -> '02.00pm', '09:30' -> '09.30am'
  const [h, m] = String(hhmm).split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am';
  let hr = h % 12;
  if (hr === 0) hr = 12;
  return `${String(hr).padStart(2,'0')}.${String(m).padStart(2,'0')}${ap}`;
}

export default function ComboSlotBulk() {
  const [combos, setCombos] = React.useState([]);
  const [form, setForm] = React.useState({
    combo_id: '',
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    start_time: '10:00',
    end_time: '18:00',
    duration_minutes: 60,
    capacity: 10,
    price: '',
    available: true,
  });
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.get('/api/admin/combos', { active: true });
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setCombos(list);
      } catch {
        // non-fatal
      }
    })();
  }, []);

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setResult(null);

    const cid = Number(form.combo_id);
    const dur = Number(form.duration_minutes);
    const cap = Number(form.capacity);
    const price = form.price === '' || form.price == null ? null : Number(form.price);
    const startM = toMinutes(form.start_time);
    const endM = toMinutes(form.end_time);

    if (!cid) return setErr('Please select a combo.');
    if (!form.start_date || !form.end_date) return setErr('Start and end date are required.');
    if (!Number.isFinite(dur) || dur <= 0) return setErr('Duration must be a positive number of minutes.');
    if (!Number.isFinite(cap) || cap <= 0) return setErr('Capacity must be a positive integer.');
    if (!(startM < endM)) return setErr('Start time must be earlier than end time.');

    const sd = dayjs(form.start_date);
    const ed = dayjs(form.end_date);
    if (!sd.isValid() || !ed.isValid() || sd.isAfter(ed, 'day')) {
      return setErr('Invalid date range.');
    }

    setRunning(true);
    try {
      let created = 0;
      let skipped = 0;
      const conflicts = [];

      for (let d = sd; !d.isAfter(ed, 'day'); d = d.add(1, 'day')) {
        const dayStr = d.format('YYYY-MM-DD');

        for (let cur = startM; cur + dur <= endM; cur += dur) {
          const st24 = fmtHM(cur);               // 'HH:MM'
          const et24 = fmtHM(cur + dur);         // 'HH:MM'
          const st12 = to12h(st24);              // 'HH.MMam/pm'
          const et12 = to12h(et24);

          try {
            await adminApi.post('/api/admin/combo-slots', {
              combo_id: cid,
              start_date: dayStr,
              end_date: dayStr,
              start_time: st12,           // send 12h format
              end_time: et12,
              capacity: cap,
              price,
              available: !!form.available,
            });
            created += 1;
          } catch (e) {
            skipped += 1;
            conflicts.push({
              date: dayStr,
              start_time: st24,
              end_time: et24,
              error: e?.message || 'Unprocessable',
            });
          }
        }
      }

      setResult({ created, skipped, conflicts });
    } finally {
      setRunning(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-xl space-y-3">
      <div className="text-lg font-semibold">Bulk Create Combo Slots</div>
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
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm">From</label>
          <input
            type="time"
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.start_time}
            onChange={(e) => onChange('start_time', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm">To</label>
          <input
            type="time"
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.end_time}
            onChange={(e) => onChange('end_time', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm">Duration (minutes)</label>
          <input
            type="number"
            min="1"
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={form.duration_minutes}
            onChange={(e) => onChange('duration_minutes', e.target.value)}
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

      <div className="flex gap-2 items-center">
        <button className="px-3 py-2 rounded-md bg-gray-900 text-white" type="submit" disabled={running}>
          {running ? 'Creating…' : 'Create Slots'}
        </button>
        {result ? (
          <div className="text-sm text-gray-700 dark:text-neutral-300">
            Created: {result.created} • Skipped: {result.skipped}
          </div>
        ) : null}
      </div>

      {result?.conflicts?.length ? (
        <div className="rounded-md border p-3 mt-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="font-medium mb-1">Conflicts</div>
          <ul className="list-disc pl-5">
            {result.conflicts.map((c, i) => (
              <li key={i}>
                {c.date} {c.start_time}→{c.end_time}: {c.error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}