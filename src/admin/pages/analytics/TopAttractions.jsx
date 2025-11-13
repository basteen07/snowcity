import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

// Recharts dynamic loader so Vite doesn't statically transform it
function BarChartAsync({ data }) {
  const [lib, setLib] = React.useState(null); // { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip }

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await import('recharts');
        if (!mounted) return;
        setLib({
          ResponsiveContainer: m.ResponsiveContainer,
          BarChart: m.BarChart,
          Bar: m.Bar,
          CartesianGrid: m.CartesianGrid,
          XAxis: m.XAxis,
          YAxis: m.YAxis,
          Tooltip: m.Tooltip
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
        Charts unavailable (recharts not installed). You can install it with: npm i recharts --legacy-peer-deps
      </div>
    );
  }

  const { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } = lib;

  return (
    <div className="h-80 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <XAxis dataKey="title" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total_revenue" fill="#2563eb" name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TopAttractions() {
  const [state, setState] = React.useState({
    status: 'idle',
    data: [],
    error: null,
    from: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD'),
    limit: 10
  });

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await adminApi.get(A.analyticsTopAttractions(), { params: { from: state.from, to: state.to, limit: state.limit } });
      const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', data: arr }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-3 text-gray-900 dark:text-neutral-100">Top Attractions</h1>
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
        <input
          type="number"
          className="rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
          value={state.limit}
          onChange={(e) => setState((s) => ({ ...s, limit: Number(e.target.value || 10) }))}
        />
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

      <BarChartAsync data={state.data} />
    </div>
  );
}