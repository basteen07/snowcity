import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import { urlWithQuery } from '../../../services/endpoints';

// Dynamic loader for Recharts (works fine with React 19)
function MiniOverviewChart({ data }) {
  const [lib, setLib] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await import('recharts');
        if (!mounted) return;
        setLib({
          ResponsiveContainer: m.ResponsiveContainer,
          AreaChart: m.AreaChart,
          Area: m.Area,
          CartesianGrid: m.CartesianGrid,
          XAxis: m.XAxis,
          YAxis: m.YAxis,
          Tooltip: m.Tooltip
        });
      } catch (e) {
        console.warn('Recharts not available; showing fallback', e);
        if (mounted) setLib(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  if (lib === null) return <div className="h-60 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 animate-pulse" />;
  if (lib === false) {
    return (
      <div className="h-60 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 text-sm text-gray-600 dark:text-neutral-300 flex items-center justify-center">
        Charts unavailable (install: npm i recharts --legacy-peer-deps)
      </div>
    );
  }
  const { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } = lib;
  return (
    <div className="h-60 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <XAxis dataKey="bucket" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="bookings" stroke="#2563eb" fill="#93c5fd" name="Bookings" />
          <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="#86efac" name="Revenue" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniPieChart({ data }) {
  const [lib, setLib] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await import('recharts');
        if (!mounted) return;
        setLib({
          ResponsiveContainer: m.ResponsiveContainer,
          PieChart: m.PieChart,
          Pie: m.Pie,
          Cell: m.Cell,
          Tooltip: m.Tooltip,
          Legend: m.Legend
        });
      } catch (e) {
        console.warn('Recharts not available; showing fallback', e);
        if (mounted) setLib(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  if (lib === null) return <div className="h-60 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 animate-pulse" />;
  if (lib === false) {
    return (
      <div className="h-60 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 text-sm text-gray-600 dark:text-neutral-300 flex items-center justify-center">
        Charts unavailable (install: npm i recharts --legacy-peer-deps)
      </div>
    );
  }
  const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } = lib;
  const palette = ['#60a5fa','#f59e0b','#10b981','#ef4444','#a78bfa','#f472b6'];
  const series = Array.isArray(data) ? data.map((r) => ({ name: String(r.booking_status || r.name), value: Number(r.count || r.value || 0) })) : [];
  return (
    <div className="h-60 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={series} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
            {series.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Overview() {
  const [state, setState] = React.useState({
    status: 'idle',
    error: null,
    main: null,
    breakdown: [],
    attractions: [],
    attractionId: '',
    trend: [],
    from: dayjs().subtract(14, 'day').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD')
  });

  React.useEffect(() => {
    (async () => {
      setState((s) => ({ ...s, status: 'loading', error: null }));
      try {
        // Load filters (attractions for dropdown)
        const [attrs, ov] = await Promise.all([
          adminApi.get(A.attractions(), { params: { limit: 200 } }).catch(() => []),
          adminApi.get(A.analyticsOverview(), { params: { from: state.from, to: state.to, attraction_id: state.attractionId || undefined } })
        ]);
        const main = ov?.summary || ov || null;
        const breakdown = ov?.statusBreakdown || [];
        const tr = ov?.trend || [];
        setState((s) => ({ ...s, status: 'succeeded', main, breakdown, trend: tr, attractions: Array.isArray(attrs?.data) ? attrs.data : Array.isArray(attrs) ? attrs : [] }));
      } catch (err) {
        setState((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const ov = await adminApi.get(A.analyticsOverview(), { params: { from: state.from, to: state.to, attraction_id: state.attractionId || undefined } });
      const main = ov?.summary || ov || null;
      const breakdown = ov?.statusBreakdown || [];
      const tr = ov?.trend || [];
      setState((s) => ({ ...s, status: 'succeeded', main, breakdown, trend: tr }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  const setQuick = (key) => {
    const today = dayjs();
    if (key === 'today') {
      setState((s) => ({ ...s, from: today.format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }));
    } else if (key === 'tomorrow') {
      const t = today.add(1, 'day');
      setState((s) => ({ ...s, from: t.format('YYYY-MM-DD'), to: t.format('YYYY-MM-DD') }));
    } else if (key === 'week') {
      const dow = today.day();
      const start = today.subtract(dow, 'day');
      const end = start.add(6, 'day');
      setState((s) => ({ ...s, from: start.format('YYYY-MM-DD'), to: end.format('YYYY-MM-DD') }));
    }
  };

  if (state.status === 'loading' && !state.main) return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const d = state.main || {};
  const statusData = state.breakdown || [];
  const attractions = state.attractions || [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Attraction</label>
          <select
            className="rounded-md border px-3 py-2 min-w-[220px]"
            value={state.attractionId}
            onChange={(e) => setState((s) => ({ ...s, attractionId: e.target.value }))}
          >
            <option value="">All attractions</option>
            {attractions.map((a) => (
              <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>{a.title || a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">From</label>
          <input type="date" className="rounded-md border px-3 py-2" value={state.from} onChange={(e) => setState((s) => ({ ...s, from: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">To</label>
          <input type="date" className="rounded-md border px-3 py-2" value={state.to} onChange={(e) => setState((s) => ({ ...s, to: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setQuick('today')}>Today</button>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setQuick('tomorrow')}>Tomorrow</button>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setQuick('week')}>This Week</button>
          <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={reload}>Apply</button>
        </div>
        <div className="ml-auto flex gap-2">
          <a
            className="rounded-md border px-3 py-2 text-sm"
            href={urlWithQuery('/api/admin/analytics/report.csv', { type: 'bookings', from: state.from, to: state.to, attraction_id: state.attractionId || undefined })}
            target="_blank" rel="noopener noreferrer"
          >Download Excel/CSV</a>
          <a
            className="rounded-md border px-3 py-2 text-sm"
            href={urlWithQuery('/api/admin/analytics/report.pdf', { type: 'bookings', from: state.from, to: state.to, attraction_id: state.attractionId || undefined })}
            target="_blank" rel="noopener noreferrer"
          >Download PDF</a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-4">
          <div className="text-xs text-gray-500 dark:text-neutral-400">Total Bookings</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-neutral-100">{d.total_bookings ?? '—'}</div>
        </div>
        <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-4">
          <div className="text-xs text-gray-500 dark:text-neutral-400">Total People</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-neutral-100">{d.total_people ?? '—'}</div>
        </div>
        <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-4">
          <div className="text-xs text-gray-500 dark:text-neutral-400">Revenue</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-neutral-100">₹{d.total_revenue ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-4">
          <div className="text-xs text-gray-500 dark:text-neutral-400">Active Attractions</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-neutral-100">{d.active_attractions ?? '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MiniOverviewChart data={state.trend} />
        <MiniPieChart data={statusData} />
      </div>
    </div>
  );
}