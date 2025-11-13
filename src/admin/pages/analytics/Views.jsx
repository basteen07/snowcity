// src/admin/pages/analytics/Views.jsx
import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Views() {
  const [from, setFrom] = React.useState(dayjs().subtract(14, 'day').startOf('day').toISOString());
  const [to, setTo] = React.useState(dayjs().endOf('day').toISOString());
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      // Data is already scoped by server permission guard; this is a view-only wrapper.
      const rows = await adminApi.get('/api/admin/analytics/daily', { from, to });
      setData(Array.isArray(rows) ? rows : []);
    })();
  }, [from, to]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-3">
        <div className="text-sm text-gray-600 dark:text-neutral-300">
          This view reflects access scoping based on your admin role/permissions. Data is filtered server-side.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input type="datetime-local" className="rounded-md border px-2 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-700" value={dayjs(from).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setFrom(dayjs(e.target.value).toISOString())} />
        <input type="datetime-local" className="rounded-md border px-2 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-700" value={dayjs(to).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setTo(dayjs(e.target.value).toISOString())} />
      </div>

      <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-3">
        <div className="text-sm font-medium mb-2">Scoped Daily Bookings</div>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="bucket" tickFormatter={(v) => dayjs(v).format('MM-DD')} />
              <YAxis />
              <Tooltip labelFormatter={(v) => dayjs(v).format('YYYY-MM-DD')} />
              <Legend />
              <Line type="monotone" dataKey="bookings" stroke="#2563eb" name="Bookings" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}