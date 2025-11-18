import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {
  listMyBookings,
  checkPayPhiStatus,
  initiatePayPhi
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

/* ========== Money helpers ========== */
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
const getTotal = (b) => Number(b?.final_amount ?? b?.total_amount ?? b?.amount ?? 0);
const getTicketsSubtotal = (b) => {
  const total = getTotal(b);
  const discount = getDiscount(b);
  const addons = getAddonsTotal(b);
  const t = (total + discount) - addons;
  return t >= 0 ? t : total;
};

/* ========== Display helpers ========== */
const fmtDate = (d) => {
  try { return d ? dayjs(d).format('DD MMM YYYY') : '—'; } catch { return d || '—'; }
};
const hhmm = (raw) => {
  const s = String(raw || '');
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hh = String(m[1]).padStart(2, '0');
  const mm = m[2];
  return `${hh}:${mm}`;
};
const getSlotTiming = (b) => {
  const start = hhmm(b?.slot_start_time);
  const end = hhmm(b?.slot_end_time);
  if (start || end) return `${start || ''}${start && end ? ' - ' : ''}${end || ''}`;
  if (b?.slot_label) return String(b.slot_label);
  const fallback = hhmm(b?.booking_time);
  return fallback || '—';
};
const getQuantityLabel = (b) => {
  const q = Number(b?.quantity || b?.qty || 1);
  const n = Number.isFinite(q) && q > 0 ? q : 1;
  return `${n} ticket${n > 1 ? 's' : ''}`;
};
const paymentTone = (status) => {
  const u = String(status || '').trim().toUpperCase();
  if (['COMPLETED', 'SUCCESS', 'PAID'].includes(u)) return { tone: 'green', label: 'Completed' };
  if (['FAILED', 'DECLINED', 'CANCELLED', 'CANCELED', 'EXPIRED'].includes(u)) return { tone: 'red', label: 'Failed' };
  if (['PENDING', 'INITIATED', 'PROCESSING', 'IN_PROGRESS', 'INPROGRESS'].includes(u)) return { tone: 'yellow', label: 'Pending' };
  return { tone: 'gray', label: u || '—' };
};
const bookingTone = (status) => {
  const u = String(status || '').trim().toUpperCase();
  if (['CANCELLED', 'CANCELED'].includes(u)) return { tone: 'red', label: 'Cancelled' };
  if (['REDEEMED'].includes(u)) return { tone: 'blue', label: 'Redeemed' };
  if (['BOOKED', 'CONFIRMED', 'ACTIVE'].includes(u)) return { tone: 'green', label: u[0] + u.slice(1).toLowerCase() };
  return { tone: 'gray', label: u || '—' };
};
const normalizePayphiMobile = (s) => {
  const digits = String(s || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
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

  React.useEffect(() => { dispatch(listMyBookings({ page: 1, limit: 10 })); }, [dispatch]);

  React.useEffect(() => {
    setPayEmail(user?.email || '');
    setPayMobile(user?.phone || '');
  }, [user]);

  const refresh = () => {
    setPage(1);
    dispatch(listMyBookings({ page: 1, limit: 10 }));
  };

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
    if (typeof meta.count === 'number' && typeof meta.limit === 'number') {
      return Array.isArray(items) && items.length === meta.limit;
    }
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
      payload?.response?.code ||
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
    const email = (payEmail || user?.email || '').trim();
    const mobile = normalizePayphiMobile(payMobile || user?.phone || '');

    if (!email || !mobile || mobile.length < 10) {
      alert('Please enter a valid email and 10-digit mobile to continue.');
      return;
    }

    const res = await dispatch(
      initiatePayPhi({ bookingId: b.booking_id || b.id, email, mobile })
    )
      .unwrap()
      .catch((err) => {
        showPayphiError('Payment initiation failed', err);
        return null;
      });
    if (!res) return;

    const resp = (res && typeof res === 'object' && (res.response || res.raw)) || res || {};
    const tx = res?.tranCtx || res?.tranctx || resp?.tranCtx || resp?.tranctx || resp?.response?.tranCtx || resp?.response?.tranctx || null;
    let redirectUrl =
      res?.redirectUrl ||
      res?.redirectURL ||
      res?.redirectUri ||
      resp?.redirectUrl ||
      resp?.redirectURL ||
      resp?.redirectUri ||
      resp?.redirectURI ||
      null;

    if (redirectUrl && tx && !String(redirectUrl).includes('tranCtx=')) {
      const sep = redirectUrl.includes('?') ? '&' : '?';
      redirectUrl = `${redirectUrl}${sep}tranCtx=${encodeURIComponent(tx)}`;
    }

    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    showPayphiError('Payment initiation failed', res);
  };

  const onCheckStatus = async (b) => {
    await dispatch(checkPayPhiStatus({ bookingId: b.booking_id || b.id }))
      .unwrap()
      .catch(() => {});
    // Optionally refresh the list after checking
    refresh();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">My Bookings</h1>
          <p className="text-gray-600 mb-6">View your ticket history, check status, retry payment, or download tickets.</p>
        </div>
        <button
          className="h-9 rounded-full border px-4 text-sm"
          onClick={refresh}
          disabled={status === 'loading'}
          title="Refresh"
        >
          {status === 'loading' ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

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

          // Must-show fields
          const title = b.item_title || b.attraction_title || b.combo_title || 'Attraction';
          const dateLabel = fmtDate(b.booking_date || b.date || b.visit_date);
          const slotTiming = getSlotTiming(b);
          const qtyLabel = getQuantityLabel(b);

          const payMeta = paymentTone(b?.payment_status);
          const bookMeta = bookingTone(b?.booking_status);

          const addonsTotal = getAddonsTotal(b);
          const discount = getDiscount(b);
          const ticketsSubtotal = getTicketsSubtotal(b);
          const total = getTotal(b);

          const canPay = payMeta.label !== 'Completed' && bookMeta.label !== 'Cancelled';
          const ticketUrl = b?.ticket_pdf || b?.ticket_pdf_url || b?.ticket_url || null;
          const ticketAbs = ticketUrl ? absoluteUrl(ticketUrl) : null;

          return (
            <div key={`bk-${id}`} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="text-gray-900 font-medium">
                    #{b.booking_ref || id} — {title}
                    {b.item_type ? (
                      <span className="ml-2 text-xs rounded-full px-2 py-0.5 border text-gray-700">
                        {b.item_type}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-gray-600">
                    {dateLabel} • {slotTiming} • {qtyLabel}
                  </div>
                  {(b.offer_code || b.offer_title) ? (
                    <div className="text-xs text-gray-500 mt-1">
                      Offer: {b.offer_code || b.offer_title}
                    </div>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{formatCurrency(total)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 justify-end">
                    <Pill text={`Pay: ${b.payment_status || '—'}`} tone={payMeta.tone} />
                    {b?.booking_status ? <Pill text={`Booking: ${b.booking_status}`} tone={bookMeta.tone} /> : null}
                  </div>
                </div>
              </div>

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

              <div className="mt-4 flex flex-wrap gap-2">
                {ticketAbs && payMeta.label === 'Completed' ? (
                  <a className="rounded-full border px-4 py-2 text-sm" href={ticketAbs} target="_blank" rel="noopener noreferrer">
                    Download Ticket
                  </a>
                ) : null}

                <button className="rounded-full border px-4 py-2 text-sm" onClick={() => onCheckStatus(b)} title="Check payment status">
                  Check Status
                </button>

                {canPay ? (
                  <button className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm" onClick={() => setRetryRow(retryRow === id ? null : id)}>
                    Pay Now
                  </button>
                ) : null}
              </div>

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
          <button className="rounded-full border px-5 py-2 text-sm" onClick={loadMore} disabled={status === 'loading'}>
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