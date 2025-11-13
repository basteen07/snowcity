
// src/admin/pages/analytics/Split.jsx
import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const GROUPS = [
  { key: 'payment_status', label: 'Payment Status' },
  { key: 'booking_status', label: 'Booking Status' },
  { key: 'payment_mode', label: 'Payment Mode' },
];

export default function Split() {
  const [from, setFrom] = React.useState(dayjs().subtract(30, 'day').startOf('day').toISOString());
  const [to, setTo] = React.useState(dayjs().endOf('day').toISOString());
  const [groupBy, setGroupBy] = React.useState('payment_status');
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const out = await adminApi.get('/api/admin/analytics/split', { from, to, group_by: groupBy });
      setRows(Array.isArray(out?.data) ? out.data : (Array.isArray(out) ? out : []));
    })();
  }, [from, to, groupBy]);

  const csvUrl = `/api/admin/analytics/report.csv?type=split&group_by=${encodeURIComponent(groupBy)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input type="datetime-local" className="rounded-md border px-2 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-700" value={dayjs(from).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setFrom(dayjs(e.target.value).toISOString())} />
        <input type="datetime-local" className="rounded-md border px-2 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-700" value={dayjs(to).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setTo(dayjs(e.target.value).toISOString())} />
        <select className="rounded-md border px-2 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-700" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
          {GROUPS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
        </select>
        <a href={csvUrl} className="ml-auto px-3 py-1 rounded-md border text-sm">Download CSV</a>
      </div>

      <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-3">
        <div className="text-sm font-medium mb-2">Split by {GROUPS.find(g => g.key === groupBy)?.label}</div>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="key" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" name="Bookings" fill="#2563eb" />
              <Bar dataKey="people" name="People" fill="#10b981" />
              <Bar dataKey="revenue" name="Revenue" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-3 overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-neutral-800">
              <th className="px-3 py-2 text-left">Key</th>
              <th className="px-3 py-2 text-right">Bookings</th>
              <th className="px-3 py-2 text-right">People</th>
              <th className="px-3 py-2 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t dark:border-neutral-800">
                <td className="px-3 py-2">{r.key}</td>
                <td className="px-3 py-2 text-right">{r.bookings}</td>
                <td className="px-3 py-2 text-right">{r.people ?? 0}</td>
                <td className="px-3 py-2 text-right">₹ {Number(r.revenue || 0).toLocaleString()}</td>
              </tr>
            ))}
            {!rows.length && <tr><td className="px-3 py-6 text-center text-gray-500 dark:text-neutral-400" colSpan={4}>No data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}