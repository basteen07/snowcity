import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkPayPhiStatus, resetBookingFlow } from '../features/bookings/bookingsSlice';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';

export default function PaymentReturn() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const token = useSelector((s) => s.auth?.token);
  const { statusCheck } = useSelector((s) => s.bookings);

  const bookingId = sp.get('booking') || sp.get('booking_id') || sp.get('id') || '';
  const cartRef = sp.get('cart') || '';
  const reportedStatus = sp.get('status'); // success|failed|pending
  const tranCtx = sp.get('tx') || sp.get('tranCtx') || '';

  const [booking, setBooking] = React.useState(null);
  const [polled, setPolled] = React.useState(false);
  const [cleared, setCleared] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;

    if (bookingId) {
      // Verify status (poll a few times if needed)
      if (!reportedStatus || reportedStatus === 'pending') {
        let tries = 0;
        const run = async () => {
          tries += 1;
          await dispatch(checkPayPhiStatus({ bookingId })).catch(() => {});
          if (tries < 4 && !statusCheck.success) setTimeout(run, 2000);
          else setPolled(true);
        };
        run();
      } else {
        setPolled(true);
      }
    } else if (cartRef) {
      // For cart-based return, backend already created bookings; just mark as polled
      setPolled(true);
    }

    // Fetch booking details (to show ticket link if available)
    if (bookingId) {
      (async () => {
        try {
          const res = await api.get(endpoints.users.myBookingById(bookingId));
          setBooking(res?.booking || res || null);
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, bookingId, cartRef]);

  const success =
    (reportedStatus && reportedStatus.toLowerCase() === 'success') ||
    (!reportedStatus && bookingId && statusCheck.success) ||
    (!!cartRef && (reportedStatus ? reportedStatus.toLowerCase() === 'success' : true));
  const loading = statusCheck.status === 'loading' && !polled;

  const ticketUrl =
    booking?.ticket_pdf_url ||
    booking?.ticket_url ||
    booking?.pdf_url ||
    null;

  React.useEffect(() => {
    if (polled && success && !cleared) {
      dispatch(resetBookingFlow());
      setCleared(true);

      // Redirect to dedicated success page with refs
      const qs = new URLSearchParams();
      if (bookingId) qs.set('booking', bookingId);
      if (cartRef) qs.set('cart', cartRef);
      if (tranCtx) qs.set('tx', tranCtx);
      qs.set('status', 'success');
      navigate(`/payment/success?${qs.toString()}`, { replace: true });
    }
  }, [polled, success, cleared, dispatch, navigate, bookingId, cartRef, tranCtx]);

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      <h1 className="text-2xl font-semibold">Payment Status</h1>

      {loading ? (
        <div className="mt-6">
          <div className="h-6 w-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 mt-3">Verifying your payment…</p>
        </div>
      ) : success ? (
        <div className="mt-6">
          <div className="mx-auto h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl">✓</div>
          <p className="text-green-700 font-medium mt-3">Payment successful!</p>
          <p className="text-gray-600 mt-1">{cartRef ? 'Your order is confirmed. Tickets are being generated.' : 'Your booking is confirmed.'}</p>
          {!cartRef && ticketUrl ? (
            <div className="mt-4">
              <a href={ticketUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-blue-600 text-white px-5 py-2">
                Download Ticket (PDF)
              </a>
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-2">Your ticket will be sent to your WhatsApp and email shortly.</p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <a href="/my-bookings" className="inline-flex rounded-full bg-blue-600 text-white px-5 py-2">My Bookings</a>
            <button className="inline-flex rounded-full border px-5 py-2" onClick={() => navigate('/')}>Home</button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-2xl">!</div>
          <p className="text-red-700 font-medium mt-3">Payment not completed</p>
          <p className="text-gray-600 mt-1">If amount was deducted, it may reflect shortly. Otherwise, retry payment from My Bookings.</p>
          <div className="mt-6 flex justify-center gap-3">
            <a href="/my-bookings" className="inline-flex rounded-full bg-blue-600 text-white px-5 py-2">My Bookings</a>
            <button className="inline-flex rounded-full border px-5 py-2" onClick={() => navigate('/')}>Home</button>
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        Ref: {bookingId || cartRef || '—'}{tranCtx ? `  |  Tx: ${tranCtx}` : ''}
      </div>
    </div>
  );
}