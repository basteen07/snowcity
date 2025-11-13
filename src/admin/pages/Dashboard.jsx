// src/admin/pages/Dashboard.jsx
import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../services/adminApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';

const RANGES = [
  { key: 'today', label: 'Today', get: () => ({ from: dayjs().startOf('day').toISOString(), to: dayjs().endOf('day').toISOString() }) },
  { key: 'yesterday', label: 'Yesterday', get: () => ({ from: dayjs().subtract(1, 'day').startOf('day').toISOString(), to: dayjs().subtract(1, 'day').endOf('day').toISOString() }) },
  { key: 'past7', label: 'Past Week', get: () => ({ from: dayjs().subtract(7, 'day').startOf('day').toISOString(), to: dayjs().endOf('day').toISOString() }) },
  { key: 'thisMonth', label: 'This Month', get: () => ({ from: dayjs().startOf('month').toISOString(), to: dayjs().endOf('month').toISOString() }) },
];

const COLORS = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#e11d48','#22c55e','#f97316','#3b82f6'];

function StatCard({ title, value, note }) {
  return (
    <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-4">
      <div className="text-xs text-gray-500 dark:text-neutral-400">{title}</div>
      <div className="text-2xl font-semibold mt-1 dark:text-neutral-100">{value}</div>
      {note ? <div className="text-xs text-gray-500 mt-1">{note}</div> : null}
    </div>
  );
}

export default function Dashboard() {
  const [rangeKey, setRangeKey] = React.useState('past7');
  const [month, setMonth] = React.useState(dayjs().format('YYYY-MM'));
  const [loading, setLoading] = React.useState(false);
  const [summary, setSummary] = React.useState(null);
  const [trend, setTrend] = React.useState([]);
  const [attractions, setAttractions] = React.useState([]);

  const computeRange = () => {
    if (rangeKey === 'customMonth') {
      const base = dayjs(`${month}-01`);
      return { from: base.startOf('month').toISOString(), to: base.endOf('month').toISOString() };
    }
    const r = RANGES.find((x) => x.key === rangeKey) || RANGES[0];
    return r.get();
  };

  async function load() {
    setLoading(true);
    try {
      const { from, to } = computeRange();

      const overview = await adminApi.get('/api/admin/analytics/overview', { from, to });
      setSummary(overview?.summary || overview);

      const t = await adminApi.get('/api/admin/analytics/trend', { from, to, granularity: 'day' });
      setTrend(Array.isArray(t) ? t : (t?.data || []));

      const topA = await adminApi.get('/api/admin/analytics/top-attractions', { from, to, limit: 10 });
      setAttractions(Array.isArray(topA) ? topA : (topA?.data || []));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [rangeKey, month]);

  const { from, to } = computeRange();
  const csvTrendUrl = `/api/admin/analytics/report.csv?type=trend&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const csvAttractionsUrl = `/api/admin/analytics/report.csv?type=top-attractions&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map(r => (
          <button key={r.key} className={`px-3 py-1 rounded-md text-sm border dark:border-neutral-700 ${rangeKey === r.key ? 'bg-gray-900 text-white' : ''}`} onClick={() => setRangeKey(r.key)}>
            {r.label}
          </button>
        ))}
        <div className="flex items-center gap-2">
          <button className={`px-3 py-1 rounded-md text-sm border dark:border-neutral-700 ${rangeKey === 'customMonth' ? 'bg-gray-900 text-white' : ''}`} onClick={() => setRangeKey('customMonth')}>
            Month
          </button>
          <input type="month" className="rounded-md border px-2 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-700" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <a href={csvTrendUrl} className="ml-auto px-3 py-1 rounded-md border text-sm">Download Trend CSV</a>
        <a href={csvAttractionsUrl} className="px-3 py-1 rounded-md border text-sm">Download Attractions CSV</a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard title="Visitors (Unique Users)" value={summary?.unique_users ?? 0} />
        <StatCard title="Tickets (People)" value={summary?.total_people ?? 0} />
        <StatCard title="Bookings" value={summary?.total_bookings ?? 0} />
        <StatCard title="Revenue" value={`₹ ${Number(summary?.total_revenue || 0).toLocaleString()}`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-3 lg:col-span-2">
          <div className="text-sm font-medium mb-2">Daily Bookings & People</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="bucket" tickFormatter={(v) => dayjs(v).format('MM-DD')} />
                <YAxis />
                <Tooltip labelFormatter={(v) => dayjs(v).format('YYYY-MM-DD')} />
                <Legend />
                <Line type="monotone" dataKey="bookings" stroke="#2563eb" name="Bookings" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="people" stroke="#10b981" name="People" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-3">
          <div className="text-sm font-medium mb-2">Attractions-wise (Top 10)</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attractions || []} dataKey="bookings" nameKey="title" outerRadius={100}>
                  {(attractions || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {loading ? <div className="text-sm text-gray-500">Loading…</div> : null}
    </div>
  );
}