import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

// Dynamic Recharts loader to avoid static transform issues
function LineChartAsync({ data }) {
  const [lib, setLib] = React.useState(null); // resolved components
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await import('recharts');
        if (!mounted) return;
        setLib({
          ResponsiveContainer: m.ResponsiveContainer,
          LineChart: m.LineChart,
          Line: m.Line,
          CartesianGrid: m.CartesianGrid,
          XAxis: m.XAxis,
          YAxis: m.YAxis,
          Tooltip: m.Tooltip,
          Legend: m.Legend
        });
      } catch (e) {
        console.warn('Recharts failed to load; showing fallback.', e);
        if (mounted) setLib(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (lib === null) {
    // Loading skeleton
    return (
      <div className="h-80 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 animate-pulse" />
    );
  }
  if (lib === false) {
    // Fallback if recharts is unavailable
    return (
      <div className="h-80 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 flex items-center justify-center text-sm text-gray-600 dark:text-neutral-300">
        Charts unavailable (recharts not installed). Install with: npm i recharts --legacy-peer-deps
      </div>
    );
  }

  const { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } = lib;

  return (
    <div className="h-80 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <XAxis dataKey="bucket" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="bookings" stroke="#2563eb" name="Bookings" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="revenue" stroke="#16a34a" name="Revenue" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Trend() {
  const [state, setState] = React.useState({
    status: 'idle',
    data: [],
    error: null,
    from: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD'),
    granularity: 'day' // day|week|month
  });

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await adminApi.get(A.analyticsTrend(), {
        params: { from: state.from, to: state.to, granularity: state.granularity }
      });
      const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', data: arr }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-3 text-gray-900 dark:text-neutral-100">Trend</h1>

      <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          type="date"
          className="rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
          value={state.from}
          onChange={(e) => setState((s) => ({ ...s, from: e.target.value }))}
        />
        <input
          type="date"
          className="rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
          value={state.to}
          onChange={(e) => setState((s) => ({ ...s, to: e.target.value }))}
        />
        <select
          className="rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
          value={state.granularity}
          onChange={(e) => setState((s) => ({ ...s, granularity: e.target.value }))}
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
        <button
          className="rounded-md border px-3 py-2 text-sm dark:border-neutral-700 dark:text-neutral-200"
          onClick={load}
        >
          Apply
        </button>
      </div>

      {state.status === 'failed' ? (
        <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>
      ) : null}

      <LineChartAsync data={state.data} />

      {state.status === 'succeeded' && (!state.data || state.data.length === 0) ? (
        <div className="text-xs text-gray-500 dark:text-neutral-400 mt-2">No data for selected period.</div>
      ) : null}
    </div>
  );
}
