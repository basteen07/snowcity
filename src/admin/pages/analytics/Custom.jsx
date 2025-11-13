// src/admin/pages/analytics/Custom.jsx
import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Custom() {
  const [from, setFrom] = React.useState(dayjs().subtract(30, 'day').startOf('day').toISOString());
  const [to, setTo] = React.useState(dayjs().endOf('day').toISOString());
  const [granularity, setGranularity] = React.useState('day');
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const rows = await adminApi.get('/api/admin/analytics/trend', { from, to, granularity });
      setData(Array.isArray(rows) ? rows : []);
    })();
  }, [from, to, granularity]);

  const csvUrl = `/api/admin/analytics/report.csv?type=trend&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input type="datetime-local" className="rounded-md border px-2 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-700" value={dayjs(from).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setFrom(dayjs(e.target.value).toISOString())} />
        <input type="datetime-local" className="rounded-md border px-2 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-700" value={dayjs(to).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setTo(dayjs(e.target.value).toISOString())} />
        <select className="rounded-md border px-2 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-700" value={granularity} onChange={(e) => setGranularity(e.target.value)}>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
        <a href={csvUrl} className="ml-auto px-3 py-1 rounded-md border text-sm">Download CSV</a>
      </div>

      <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-3">
        <div className="text-sm font-medium mb-2">Custom Period Trend</div>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="bucket" tickFormatter={(v) => dayjs(v).format(granularity === 'month' ? 'YYYY-MM' : 'MM-DD')} />
              <YAxis />
              <Tooltip labelFormatter={(v) => dayjs(v).format('YYYY-MM-DD')} />
              <Legend />
              <Line type="monotone" dataKey="bookings" stroke="#2563eb" name="Bookings" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="people" stroke="#10b981" name="People" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" name="Revenue" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}