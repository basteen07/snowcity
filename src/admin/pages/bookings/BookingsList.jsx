import React from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { listAdminBookings, resendTicketAdmin } from '../../features/bookings/adminBookingsSlice';
import AdminTable from '../../components/common/AdminTable';
import AdminPagination from '../../components/common/AdminPagination';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

function SummaryCard({ label, value, note }) {
  return (
    <div className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-4">
      <div className="text-xs text-gray-500 dark:text-neutral-400">{label}</div>
      <div className="text-2xl font-semibold text-gray-900 dark:text-neutral-100">{value ?? '—'}</div>
      {note ? <div className="text-xs text-gray-500 mt-1">{note}</div> : null}
    </div>
  );
}

const formatYMD = (value) => dayjs(value).format('YYYY-MM-DD');
const today = formatYMD(new Date());
const quickRanges = [
  { key: 'today', label: 'Today', from: () => dayjs().startOf('day'), to: () => dayjs().endOf('day') },
  { key: 'yesterday', label: 'Yesterday', from: () => dayjs().subtract(1, 'day').startOf('day'), to: () => dayjs().subtract(1, 'day').endOf('day') },
  { key: 'week', label: 'Last 7 days', from: () => dayjs().subtract(6, 'day').startOf('day'), to: () => dayjs().endOf('day') },
  { key: 'month', label: 'Last 30 days', from: () => dayjs().subtract(29, 'day').startOf('day'), to: () => dayjs().endOf('day') },
  { key: 'all', label: 'All time', from: () => null, to: () => null }
];

export default function BookingsList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list } = useSelector((s) => s.adminBookings);
  const [filters, setFilters] = React.useState({
    search: '',
    payment_status: '',
    booking_status: '',
    attraction_id: '',
    combo_id: '',
    offer_id: '',
    user_email: '',
    user_phone: '',
    item_type: '',
    date_from: today,
    date_to: today
  });
  const [options, setOptions] = React.useState({ status: 'idle', attractions: [], combos: [], offers: [] });
  const [overview, setOverview] = React.useState({ status: 'idle', trend: [], summary: null });
  const [activeRange, setActiveRange] = React.useState('today');

  React.useEffect(() => {
    dispatch(listAdminBookings({ page: 1, limit: 20, date_from: today, date_to: today }));
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (options.status !== 'idle') return;
      setOptions((s) => ({ ...s, status: 'loading' }));
      try {
        const [attractionsRes, combosRes, offersRes] = await Promise.all([
          adminApi.get(A.attractions(), { params: { limit: 1000 } }).catch(() => ({ data: [] })),
          adminApi.get(A.combos(), { params: { limit: 1000 } }).catch(() => ({ data: [] })),
          adminApi.get(A.offers(), { params: { limit: 1000 } }).catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setOptions({
          status: 'succeeded',
          attractions: Array.isArray(attractionsRes?.data) ? attractionsRes.data : (Array.isArray(attractionsRes) ? attractionsRes : []),
          combos: Array.isArray(combosRes?.data) ? combosRes.data : (Array.isArray(combosRes) ? combosRes : []),
          offers: Array.isArray(offersRes?.data) ? offersRes.data : (Array.isArray(offersRes) ? offersRes : []),
        });
      } catch (err) {
        if (cancelled) return;
        setOptions((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
    return () => { cancelled = true; };
  }, [options.status]);

  const buildQuery = React.useCallback((extra = {}) => {
    const merged = { ...filters, ...extra };
    const clean = {};
    Object.entries(merged).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'string' && value.trim() === '') return;
      clean[key] = value;
    });
    return clean;
  }, [filters]);

  const loadOverview = React.useCallback(async () => {
    setOverview((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await adminApi.get(A.analyticsOverview(), {
        params: {
          from: filters.date_from || undefined,
          to: filters.date_to || undefined,
          attraction_id: filters.attraction_id || undefined
        }
      });
      const trend = Array.isArray(res?.trend) ? res.trend : [];
      setOverview({ status: 'succeeded', trend, summary: res?.summary || res });
    } catch (err) {
      setOverview((s) => ({ ...s, status: 'failed', error: err }));
    }
  }, [filters]);

  const onSearch = () => {
    dispatch(listAdminBookings({ ...buildQuery(), page: 1, limit: 20 }));
    loadOverview();
  };

  const applyQuickRange = React.useCallback((key) => {
    const range = quickRanges.find((r) => r.key === key);
    if (!range) return;
    const from = range.from();
    const to = range.to();
    setFilters((prev) => ({
      ...prev,
      date_from: from ? from.format('YYYY-MM-DD') : '',
      date_to: to ? to.format('YYYY-MM-DD') : ''
    }));
    setActiveRange(key);
    const payload = {
      ...buildQuery({
        date_from: from ? from.format('YYYY-MM-DD') : undefined,
        date_to: to ? to.format('YYYY-MM-DD') : undefined
      }),
      page: 1,
      limit: 20
    };
    dispatch(listAdminBookings(payload));
    loadOverview();
  }, [buildQuery, dispatch, loadOverview]);

  React.useEffect(() => {
    if (list.status === 'succeeded') loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.status]);

  const meta = list.meta || {};
  const totalPages = meta.totalPages || meta.total_pages || 1;
  const currPage = meta.page || list.query.page || 1;

  const ticketUrl = React.useCallback((path) => {
    if (!path) return null;
    if (/^https?:/i.test(path)) return path;
    const base = import.meta.env?.VITE_API_BASE_URL || '';
    if (base) return `${base.replace(/\/$/, '')}${path}`;
    return path;
  }, []);

  const viewUserBookings = (r) => {
    const payload = {
      user_email: r.user_email || '',
      user_phone: r.user_phone || ''
    };
    setFilters((prev) => ({ ...prev, ...payload }));
    const query = buildQuery({ ...payload, page: 1 });
    dispatch(listAdminBookings({ ...query, page: 1, limit: 20 }));
  };

  const handleDownloadTicket = (row) => {
    if (!row.ticket_pdf) {
      window.alert('Ticket PDF not available yet.');
      return;
    }
    const url = ticketUrl(row.ticket_pdf);
    if (url) window.open(url, '_blank', 'noopener');
  };

  const handleResendTicket = async (row) => {
    if (!row.booking_id) return;
    if (!window.confirm('Resend ticket email to this user?')) return;
    try {
      await dispatch(resendTicketAdmin({ id: row.booking_id })).unwrap();
      window.alert('Ticket resend initiated.');
    } catch (err) {
      window.alert(err?.message || 'Failed to resend ticket');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Bookings</h1>
      {overview.summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <SummaryCard label="Total Bookings" value={overview.summary.total_bookings ?? 0} />
          <SummaryCard label="Combo Bookings" value={overview.summary.combo_bookings ?? 0} note={`₹${Number(overview.summary.combo_revenue || 0).toLocaleString()}`} />
          <SummaryCard label="Offer Bookings" value={overview.summary.offer_bookings ?? 0} note={`₹${Number(overview.summary.offer_revenue || 0).toLocaleString()}`} />
          <SummaryCard label="Revenue" value={`₹${Number(overview.summary.total_revenue || 0).toLocaleString()}`} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-4">
        {quickRanges.map((range) => (
          <button
            key={range.key}
            onClick={() => applyQuickRange(range.key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold border ${activeRange === range.key ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}
          >
            {range.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
        <input className="rounded-md border px-3 py-2" placeholder="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select className="rounded-md border px-3 py-2" value={filters.payment_status} onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}>
          <option value="">Payment: All</option>
          <option>Pending</option><option>Completed</option><option>Failed</option><option>Cancelled</option>
        </select>
        <select className="rounded-md border px-3 py-2" value={filters.booking_status} onChange={(e) => setFilters({ ...filters, booking_status: e.target.value })}>
          <option value="">Booking: All</option>
          <option>Booked</option><option>Redeemed</option><option>Expired</option><option>Cancelled</option>
        </select>
        <select className="rounded-md border px-3 py-2" value={filters.attraction_id} onChange={(e) => setFilters({ ...filters, attraction_id: e.target.value })}>
          <option value="">Attraction: All</option>
          {(options.attractions || []).map((a) => (
            <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>{a.title || a.name || `#${a.attraction_id || a.id}`}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <select className="rounded-md border px-3 py-2" value={filters.combo_id} onChange={(e) => setFilters({ ...filters, combo_id: e.target.value })}>
          <option value="">Combo: All</option>
          {(options.combos || []).map((c) => (
            <option key={c.combo_id || c.id} value={c.combo_id || c.id}>{c.title || c.name || `Combo #${c.combo_id || c.id}`}</option>
          ))}
        </select>
        <select className="rounded-md border px-3 py-2" value={filters.offer_id} onChange={(e) => setFilters({ ...filters, offer_id: e.target.value })}>
          <option value="">Offer: All</option>
          {(options.offers || []).map((o) => (
            <option key={o.offer_id || o.id} value={o.offer_id || o.id}>{o.title || o.name || o.code || `Offer #${o.offer_id || o.id}`}</option>
          ))}
        </select>
        <select className="rounded-md border px-3 py-2" value={filters.item_type} onChange={(e) => setFilters({ ...filters, item_type: e.target.value })}>
          <option value="">Item: All</option>
          <option value="Attraction">Attractions</option>
          <option value="Combo">Combos only</option>
        </select>
        <input className="rounded-md border px-3 py-2" placeholder="User email" value={filters.user_email} onChange={(e) => setFilters({ ...filters, user_email: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <input className="rounded-md border px-3 py-2" placeholder="User phone" value={filters.user_phone} onChange={(e) => setFilters({ ...filters, user_phone: e.target.value })} />
        <input type="date" className="rounded-md border px-3 py-2" value={filters.date_from} onChange={(e) => { setFilters({ ...filters, date_from: e.target.value }); setActiveRange('custom'); }} />
        <input type="date" className="rounded-md border px-3 py-2" value={filters.date_to} onChange={(e) => { setFilters({ ...filters, date_to: e.target.value }); setActiveRange('custom'); }} />
        <button className="rounded-md bg-gray-900 text-white px-3 py-2" onClick={onSearch}>Apply Filters</button>
        <button
          className="rounded-md border px-3 py-2"
          onClick={() => {
            setFilters({ search: '', payment_status: '', booking_status: '', attraction_id: '', combo_id: '', offer_id: '', user_email: '', user_phone: '', item_type: '', date_from: '', date_to: '' });
            dispatch(listAdminBookings({ page: 1, limit: 20 }));
          }}
        >
          Reset
        </button>
      </div>

      {filters.user_email || filters.user_phone ? (
        <div className="mb-4 text-sm text-gray-600">
          Showing results for
          {filters.user_email ? <> email <strong>{filters.user_email}</strong></> : null}
          {filters.user_phone ? <> phone <strong>{filters.user_phone}</strong></> : null}
        </div>
      ) : null}

      <AdminTable
        keyField="booking_id"
        columns={[
          { key: 'booking_ref', title: 'Ref' },
          { key: 'booking_date', title: 'Date', render: (r) => r.booking_date ? dayjs(r.booking_date).format('DD MMM, YYYY') : '—' },
          { key: 'user_email', title: 'User', render: (r) => (
            <div className="text-xs">
              <div>{r.user_email || '—'}</div>
              <div className="text-gray-500">{r.user_phone || '—'}</div>
            </div>
          ) },
          { key: 'item_title', title: 'Item', render: (r) => (
            <div className="flex flex-col">
              <span>{r.item_title || r.attraction_title || '—'}</span>
              <span className="text-xs text-gray-500">{r.item_type === 'Combo' ? 'Combo' : 'Attraction'}</span>
            </div>
          ) },
          { key: 'combo_title', title: 'Combo/Offer', render: (r) => (
            <div className="flex flex-col text-xs">
              {r.combo_title ? <span>Combo: {r.combo_title}</span> : null}
              {r.offer_title ? <span>Offer: {r.offer_title}</span> : <span className="text-gray-400">—</span>}
            </div>
          ) },
          { key: 'slot', title: 'Slot', render: (r) => {
            if (r.slot_start_time && r.slot_end_time) return `${r.slot_start_time} - ${r.slot_end_time}`;
            if (r.booking_time) return r.booking_time;
            return '—';
          } },
          { key: 'payment_status', title: 'Payment' },
          { key: 'booking_status', title: 'Status' },
          { key: 'final_amount', title: 'Amount', render: (r) => `₹${r?.final_amount ?? r?.total_amount ?? 0}` },
          { key: '__actions', title: '', render: (r) => (
            <div className="flex flex-wrap justify-end gap-3 text-xs">
              <button className="text-blue-600 hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/admin/bookings/${r.booking_id ?? r.id}`); }}>Details</button>
              {r.user_email || r.user_phone ? (
                <button className="text-gray-600 hover:underline" onClick={(e) => { e.stopPropagation(); viewUserBookings(r); }}>User bookings</button>
              ) : null}
              <button
                className={`hover:underline ${r.ticket_pdf ? 'text-emerald-600' : 'text-gray-400 cursor-not-allowed'}`}
                onClick={(e) => { e.stopPropagation(); handleDownloadTicket(r); }}
                disabled={!r.ticket_pdf}
              >
                Download ticket
              </button>
              <button
                className="text-orange-600 hover:underline"
                onClick={(e) => { e.stopPropagation(); handleResendTicket(r); }}
              >
                Resend ticket
              </button>
            </div>
          ) }
        ]}
        rows={list.data}
        onRowClick={(r) => navigate(`/admin/bookings/${r.booking_id ?? r.id}`)}
        empty={list.status === 'loading' ? 'Loading…' : 'No bookings'}
      />

      <AdminPagination
        page={currPage}
        totalPages={totalPages}
        onPage={(p) => dispatch(listAdminBookings({ ...buildQuery(), page: p, limit: 20 }))}
      />

      <div className="mt-6 rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Bookings Trend</h2>
          {overview.status === 'loading' ? <span className="text-xs text-gray-500">Loading…</span> : null}
        </div>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overview.trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bookings" stroke="#2563eb" name="Bookings" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" name="Revenue" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}