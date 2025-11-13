import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {
  listMyBookings,
  checkPayPhiStatus,
  initiatePayPhi,
  cancelBooking
} from '../features/bookings/bookingsSlice';
import { formatCurrency } from '../utils/formatters';
import { absoluteUrl } from '../utils/media';

function Pill({ text, tone }) {
  const map = {
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700'
  };
  return <span className={`px-2 py-1 rounded-full text-xs ${map[tone] || map.gray}`}>{text}</span>;
}

const getAddonsTotal = (b) => {
  try {
    if (Array.isArray(b?.booking_addons)) {
      return b.booking_addons.reduce((sum, a) => sum + Number(a.price || 0) * Number(a.quantity || 0), 0);
    }
    if (Array.isArray(b?.addons)) {
      return b.addons.reduce((sum, a) => sum + Number(a.price || 0) * Number(a.quantity || 0), 0);
    }
  } catch {}
  return Number(b?.addons_total || 0);
};

const getDiscount = (b) => Number(b?.discount_amount || 0);

const getTotal = (b) =>
  Number(
    b?.final_amount ??
    b?.total_amount ??
    b?.amount ??
    0
  );

const getTicketsSubtotal = (b) => {
  const total = getTotal(b);
  const discount = getDiscount(b);
  const addons = getAddonsTotal(b);
  // tickets = (total + discount) - addons
  const t = (total + discount) - addons;
  return t >= 0 ? t : total; // fallback
};

const getSlotLabel = (b) => {
  const s = b?.slot;
  if (!s) return '';
  if (s.label) return s.label;
  if (s.start_time && s.end_time) return `${s.start_time} - ${s.end_time}`;
  return '';
};

export default function MyBookings() {
  const dispatch = useDispatch();
  const { status, items, meta, error } = useSelector((s) => s.bookings.list);
  const statusCheck = useSelector((s) => s.bookings.statusCheck);
  const payphi = useSelector((s) => s.bookings.payphi);
  const user = useSelector((s) => s.auth?.user);

  const [page, setPage] = React.useState(1);
  const [retryRow, setRetryRow] = React.useState(null);
  const [payEmail, setPayEmail] = React.useState('');
  const [payMobile, setPayMobile] = React.useState('');

  React.useEffect(() => {
    dispatch(listMyBookings({ page: 1, limit: 10 }));
  }, [dispatch]);

  React.useEffect(() => {
    setPayEmail(user?.email || '');
    setPayMobile(user?.phone || '');
  }, [user]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    dispatch(listMyBookings({ page: next, limit: 10 }));
  };

  const hasMore = (() => {
    if (!meta) return false;
    if (typeof meta.totalPages === 'number' && typeof meta.page === 'number') return meta.page < meta.totalPages;
    if (typeof meta.total_pages === 'number' && typeof meta.page === 'number') return meta.page < meta.total_pages;
    if (typeof meta.hasNext === 'boolean') return meta.hasNext;
    return false;
  })();

  const showPayphiError = React.useCallback((title = 'Payment initiation failed', payload = null) => {
    if (!payload) {
      alert(`${title}. Please try again later.`);
      return;
    }
    const code =
      payload?.responseCode ||
      payload?.code ||
      payload?.status ||
      payload?.data?.code ||
      payload?.response?.responseCode ||
      null;
    const message =
      payload?.responseMessage ||
      payload?.message ||
      payload?.data?.message ||
      payload?.response?.responseMessage ||
      payload?.response?.message ||
      payload?.error ||
      null;

    let detail = '';
    if (code) detail += `[${code}]`;
    if (message) detail += `${detail ? ' ' : ''}${message}`;

    const text = detail ? `${title}: ${detail}` : `${title}. Please try again later.`;
    alert(text);
  }, []);

  const onRetry = async (b) => {
    if (!payEmail || !payMobile) {
      alert('Please enter email and mobile to continue.');
      return;
    }
    const res = await dispatch(initiatePayPhi({ bookingId: b.booking_id || b.id, email: payEmail, mobile: payMobile }))
      .unwrap()
      .catch((err) => {
        showPayphiError('Payment initiation failed', err);
        return null;
      });
    if (!res) return;
    if (res.ok && res.redirectUrl) {
      window.location.href = res.redirectUrl;
      return;
    }
    showPayphiError('Payment initiation failed', res);
  };

  const onCheckStatus = async (b) => {
    await dispatch(checkPayPhiStatus({ bookingId: b.booking_id || b.id })).catch(() => {});
  };

  const onCancel = async (b) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    await dispatch(cancelBooking({ bookingId: b.booking_id || b.id })).catch(() => {});
    // Reload first page to reflect
    dispatch(listMyBookings({ page: 1, limit: 10 }));
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">My Bookings</h1>
      <p className="text-gray-600 mb-6">View your ticket history, check status, retry payment, or download tickets.</p>

      {status === 'loading' && !items.length ? (
        <div className="py-10 text-center">
          <div className="h-6 w-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : null}

      {status === 'failed' ? (
        <div className="py-6 text-center text-red-600">{(error && error.message) || 'Failed to load bookings.'}</div>
      ) : null}

      <div className="space-y-4">
        {items.map((b, idx) => {
          const id = b.booking_id || b.id || idx;
          const title = b?.attraction?.title || b?.attraction_title || b?.title || 'Attraction';
          const date = b?.booking_date || b?.date || b?.created_at;
          const slotLabel = getSlotLabel(b);
          const qty = b?.quantity || b?.qty || b?.tickets_count || null;

          const payment = String(b?.payment_status || '').toLowerCase();
          const bookStatus = String(b?.booking_status || '').toLowerCase();

          const payTone = payment === 'completed' ? 'green' : payment === 'failed' ? 'red' : payment === 'pending' ? 'yellow' : 'gray';
          const bookTone = bookStatus === 'cancelled' ? 'red' : bookStatus === 'redeemed' ? 'blue' : bookStatus === 'booked' ? 'green' : 'gray';

          const addonsTotal = getAddonsTotal(b);
          const discount = getDiscount(b);
          const ticketsSubtotal = getTicketsSubtotal(b);
          const total = getTotal(b);

          const canPay = payment !== 'completed' && bookStatus !== 'cancelled';
          const ticketUrl =
            b?.ticket_pdf ||
            b?.ticket_pdf_url ||
            b?.ticket_url ||
            null;
          const ticketAbs = ticketUrl ? absoluteUrl(ticketUrl) : null;

          return (
            <div key={`bk-${id}`} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="text-gray-900 font-medium">#{b.booking_ref || id} — {title}</div>
                  <div className="text-sm text-gray-600">
                    {date ? dayjs(date).format('DD MMM YYYY') : '—'}
                    {slotLabel ? ` • ${slotLabel}` : ''}
                    {qty ? ` • ${qty} ticket(s)` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{formatCurrency(total)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 justify-end">
                    <Pill text={`Pay: ${b.payment_status || '—'}`} tone={payTone} />
                    {b?.booking_status ? <Pill text={`Booking: ${b.booking_status}`} tone={bookTone} /> : null}
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                <div className="rounded-md border p-2 flex items-center justify-between">
                  <span className="text-gray-600">Tickets</span>
                  <span className="font-medium">{formatCurrency(ticketsSubtotal)}</span>
                </div>
                <div className="rounded-md border p-2 flex items-center justify-between">
                  <span className="text-gray-600">Add-ons</span>
                  <span className="font-medium">{formatCurrency(addonsTotal)}</span>
                </div>
                <div className="rounded-md border p-2 flex items-center justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium">- {formatCurrency(discount)}</span>
                </div>
                <div className="rounded-md border p-2 flex items-center justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {ticketAbs && payment === 'completed' ? (
                  <a
                    className="rounded-full border px-4 py-2 text-sm"
                    href={ticketAbs}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download Ticket
                  </a>
                ) : null}

                {canPay ? (
                  <>
                    <button
                      className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm"
                      onClick={() => setRetryRow(retryRow === id ? null : id)}
                    >
                      Pay Now
                    </button>
                    <button
                      className="rounded-full border px-4 py-2 text-sm"
                      onClick={() => onCheckStatus(b)}
                      title="Check payment status"
                    >
                      Check Status
                    </button>
                    <button
                      className="rounded-full border px-4 py-2 text-sm text-red-600"
                      onClick={() => onCancel(b)}
                      title="Cancel booking"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="rounded-full border px-4 py-2 text-sm"
                    onClick={() => onCheckStatus(b)}
                    title="Check payment status"
                  >
                    Check Status
                  </button>
                )}
              </div>

              {/* Retry panel */}
              {retryRow === id ? (
                <div className="mt-4 rounded-lg border p-3 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Email</label>
                      <input
                        className="w-full rounded-md border px-3 py-2"
                        type="email"
                        value={payEmail}
                        onChange={(e) => setPayEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Mobile</label>
                      <input
                        className="w-full rounded-md border px-3 py-2"
                        type="tel"
                        value={payMobile}
                        onChange={(e) => setPayMobile(e.target.value)}
                        placeholder="10-digit mobile"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        className="w-full rounded-md bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black disabled:opacity-50"
                        disabled={payphi.status === 'loading'}
                        onClick={() => onRetry(b)}
                      >
                        {payphi.status === 'loading' ? 'Processing…' : 'Proceed to Pay'}
                      </button>
                    </div>
                  </div>
                  {statusCheck.status === 'loading' ? (
                    <div className="text-xs text-gray-600 mt-2">Checking status…</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <button
            className="rounded-full border px-5 py-2 text-sm"
            onClick={loadMore}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}

      {!items.length && status === 'succeeded' ? (
        <div className="py-12 text-center text-gray-500">No bookings yet.</div>
      ) : null}
    </div>
  );
}