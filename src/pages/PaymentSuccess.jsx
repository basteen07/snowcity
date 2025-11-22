import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CheckCircle, Loader2, FileDown, PhoneCall } from 'lucide-react';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';

const statusCopy = {
  processing: {
    title: 'Verifying Payment…',
    desc: 'Please stay on this page while we generate your ticket.',
  },
  success: {
    title: 'Payment Successful',
    desc: 'Your booking is confirmed. Download your ticket below or visit My Bookings anytime.',
  },
};

export default function PaymentSuccess() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const token = useSelector((s) => s.auth?.token);

  const bookingId = sp.get('booking') || sp.get('booking_id') || sp.get('id') || '';
  const cartRef = sp.get('cart') || '';
  const tranCtx = sp.get('tx') || sp.get('tranCtx') || '';
  const ticketQueryUrl = sp.get('ticket') || '';

  const [booking, setBooking] = React.useState(null);
  const [loadingBooking, setLoadingBooking] = React.useState(false);

  React.useEffect(() => {
    if (!token || !bookingId) return;
    setLoadingBooking(true);
    (async () => {
      try {
        const res = await api.get(endpoints.users.myBookingById(bookingId));
        setBooking(res?.booking || res || null);
      } catch (err) {
        console.error('Unable to fetch booking', err);
      } finally {
        setLoadingBooking(false);
      }
    })();
  }, [token, bookingId]);

  const ticketUrl =
    ticketQueryUrl ||
    booking?.ticket_pdf_url ||
    booking?.ticket_url ||
    booking?.pdf_url ||
    null;

  const stateKey = ticketUrl ? 'success' : 'processing';
  const copy = statusCopy[stateKey];

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 px-6 sm:px-10 py-10 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
          {ticketUrl ? <CheckCircle size={42} strokeWidth={2.2} /> : <Loader2 size={40} className="animate-spin" />}
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 mt-6">{copy.title}</h1>
        <p className="text-slate-600 mt-2 text-base">{copy.desc}</p>

        <div className="mt-6 grid gap-4">
          {ticketUrl ? (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-white px-6 py-3.5 text-lg font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
            >
              <FileDown size={22} /> Download Ticket (PDF)
            </a>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-4 text-sm text-slate-500 bg-slate-50">
              Tickets are being generated. We will send them to your registered email and WhatsApp shortly.
              {loadingBooking && <div className="mt-2 text-xs text-slate-400">Refreshing booking status…</div>}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
            <a
              href="/my-bookings"
              className="flex-1 inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:border-slate-300"
            >
              View My Bookings
            </a>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 inline-flex items-center justify-center rounded-2xl bg-slate-900 text-white px-5 py-3 font-semibold hover:bg-slate-800"
            >
              Back to Home
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-slate-50 text-left flex flex-col gap-3 text-sm text-slate-600">
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-slate-400">
            <span>Order Ref: <strong className="text-slate-700">{cartRef || booking?.order_ref || '—'}</strong></span>
            {bookingId && <span>Booking ID: <strong className="text-slate-700">{bookingId}</strong></span>}
            {tranCtx && <span>Txn ID: <strong className="text-slate-700">{tranCtx}</strong></span>}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <PhoneCall size={18} className="text-blue-500" />
            <div>
              Need help? Reach us at <a href="tel:+919159520237" className="text-blue-600 font-medium">+91 91595 20237</a> or write to <a href="mailto:bookings@snowcity.com" className="text-blue-600 font-medium">bookings@snowcity.com</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
