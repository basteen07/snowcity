// src/admin/pages/analytics/Attractions.jsx
import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#e11d48','#22c55e','#f97316','#3b82f6'];

export default function Attractions() {
  const [from, setFrom] = React.useState(dayjs().subtract(30, 'day').startOf('day').toISOString());
  const [to, setTo] = React.useState(dayjs().endOf('day').toISOString());
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const rows = await adminApi.get('/api/admin/analytics/attractions-breakdown', { from, to, limit: 50 });
      setData(Array.isArray(rows) ? rows : []);
    })();
  }, [from, to]);

  const csvUrl = `/api/admin/analytics/report.csv?type=attractions-breakdown&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input type="datetime-local" className="rounded-md border px-2 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-700" value={dayjs(from).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setFrom(dayjs(e.target.value).toISOString())} />
        <input type="datetime-local" className="rounded-md border px-2 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-700" value={dayjs(to).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setTo(dayjs(e.target.value).toISOString())} />
        <a href={csvUrl} className="ml-auto px-3 py-1 rounded-md border text-sm">Download CSV</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-3">
          <div className="text-sm font-medium mb-2">Attractions-wise Bookings</div>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="bookings" nameKey="title" outerRadius={120}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-3 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800">
                <th className="px-3 py-2 text-left">Attraction</th>
                <th className="px-3 py-2 text-right">Bookings</th>
                <th className="px-3 py-2 text-right">People</th>
                <th className="px-3 py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.attraction_id} className="border-t dark:border-neutral-800">
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2 text-right">{r.bookings}</td>
                  <td className="px-3 py-2 text-right">{r.people ?? 0}</td>
                  <td className="px-3 py-2 text-right">₹ {Number(r.revenue || 0).toLocaleString()}</td>
                </tr>
              ))}
              {!data.length && (
                <tr><td className="px-3 py-6 text-center text-gray-500 dark:text-neutral-400" colSpan={4}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}