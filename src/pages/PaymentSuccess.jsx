import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';

export default function PaymentSuccess() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const token = useSelector((s) => s.auth?.token);

  const bookingId = sp.get('booking') || sp.get('booking_id') || sp.get('id') || '';
  const cartRef = sp.get('cart') || '';
  const tranCtx = sp.get('tx') || sp.get('tranCtx') || '';

  const [booking, setBooking] = React.useState(null);

  React.useEffect(() => {
    if (!token) return;
    if (!bookingId) return;
    (async () => {
      try {
        const res = await api.get(endpoints.users.myBookingById(bookingId));
        setBooking(res?.booking || res || null);
      } catch {}
    })();
  }, [token, bookingId]);

  const ticketUrl =
    booking?.ticket_pdf_url ||
    booking?.ticket_url ||
    booking?.pdf_url ||
    null;

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl">✓</div>
      <h1 className="text-2xl font-semibold mt-3">Payment Successful</h1>
      <p className="text-gray-600 mt-1">
        {cartRef ? 'Your order is confirmed. Tickets are being generated.' : 'Your booking is confirmed.'}
      </p>

      {!cartRef && ticketUrl ? (
        <div className="mt-5">
          <a
            href={ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full bg-blue-600 text-white px-5 py-2"
          >
            Download Ticket (PDF)
          </a>
        </div>
      ) : (
        <p className="text-xs text-gray-500 mt-3">
          Your ticket will be sent to your WhatsApp and email shortly. You can also find it in My Bookings.
        </p>
      )}

      <div className="mt-6 flex justify-center gap-3">
        <a href="/my-bookings" className="inline-flex rounded-full bg-blue-600 text-white px-5 py-2">My Bookings</a>
        <button className="inline-flex rounded-full border px-5 py-2" onClick={() => navigate('/')}>Home</button>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Ref: {bookingId || cartRef || '—'}{tranCtx ? `  |  Tx: ${tranCtx}` : ''}
      </div>
    </div>
  );
}
