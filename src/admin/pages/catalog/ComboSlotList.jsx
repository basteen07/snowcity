import React from 'react';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';

export default function ComboSlotList() {
  const nav = useNavigate();
  const [combos, setCombos] = React.useState([]);
  const [comboId, setComboId] = React.useState('');
  const [startDate, setStartDate] = React.useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = React.useState(dayjs().add(7, 'day').format('YYYY-MM-DD'));
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.get('/api/admin/combos', { active: true });
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setCombos(list);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setErr('');
      const params = {
        start_date: startDate || null,
        end_date: endDate || null,
        combo_id: comboId ? Number(comboId) : null,
      };
      const out = await adminApi.get('/api/admin/combo-slots', params);
      const list = Array.isArray(out?.data) ? out.data : Array.isArray(out) ? out : [];
      setRows(list);
    } catch (e) {
      setErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function onDelete(id) {
    if (!window.confirm('Delete this combo slot?')) return;
    try {
      await adminApi.del(`/api/admin/combo-slots/${id}`);
      setRows((prev) => prev.filter((r) => r.combo_slot_id !== id));
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  }

  const comboName = (cid) => {
    const c = combos.find((x) => x.combo_id === cid);
    if (!c) return `#${cid}`;
    return c.title || `Combo #${cid}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          className="rounded-md border px-2 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
          value={comboId}
          onChange={(e) => setComboId(e.target.value)}
        >
          <option value="">All combos</option>
          {combos.map((c) => (
            <option key={c.combo_id} value={c.combo_id}>
              {c.title || `Combo #${c.combo_id}`}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-md border px-2 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="rounded-md border px-2 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button className="px-3 py-2 rounded-md border text-sm" onClick={load}>
          Filter
        </button>
        <Link to="/admin/catalog/combo-slots/new" className="ml-auto px-3 py-2 rounded-md bg-gray-900 text-white text-sm">
          New Combo Slot
        </Link>
        <Link to="/admin/catalog/combo-slots/bulk" className="px-3 py-2 rounded-md border text-sm">
          Bulk Create
        </Link>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="rounded-lg border bg-white dark:bg-neutral-900 dark:border-neutral-800 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              <th className="px-3 py-2 text-left">Combo</th>
              <th className="px-3 py-2 text-left">Date Range</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-right">Capacity</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-left">Available</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.combo_slot_id} className="border-t dark:border-neutral-800">
                <td className="px-3 py-2">{comboName(r.combo_id)}</td>
                <td className="px-3 py-2">
                  {r.start_date} {r.end_date && r.end_date !== r.start_date ? `→ ${r.end_date}` : ''}
                </td>
                <td className="px-3 py-2">
                  {r.start_time_12h || r.start_time} → {r.end_time_12h || r.end_time}
                </td>
                <td className="px-3 py-2 text-right">{r.capacity}</td>
                <td className="px-3 py-2 text-right">{r.price == null ? '-' : `₹ ${Number(r.price).toLocaleString()}`}</td>
                <td className="px-3 py-2">{r.available ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2 text-right space-x-2">
                  <button className="px-2 py-1 rounded-md border text-xs" onClick={() => nav(`/admin/catalog/combo-slots/${r.combo_slot_id}`)}>
                    Edit
                  </button>
                  <button className="px-2 py-1 rounded-md border text-xs" onClick={() => onDelete(r.combo_slot_id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                  No combo slots
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {loading ? <div className="text-sm text-gray-500">Loading…</div> : null}
    </div>
  );
}