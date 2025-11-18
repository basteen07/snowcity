// src/pages/PaymentReturn.jsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { get } from '../services/apiClient';
import { EP } from '../services/endpoints';
import { useDispatch } from 'react-redux';

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function PaymentReturn() {
  const q = useQuery();
  const dispatch = useDispatch();
  const [msg, setMsg] = useState('Finalizing payment...');

  const tranCtx = q.get('tx') || q.get('tranCtx') || '';
  const cartRef = q.get('cart') || '';
  const bookingId = q.get('booking_id') || '';
  const status = q.get('status') || '';

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Always hit PayPhi idempotent webhook
        if (tranCtx) await get(EP.payphiReturn(tranCtx)).catch(() => {});

        // 🎯 CART LOGIC REMOVED (cartSlice no longer exists)
        if (cartRef && status === 'success') {
          if (!mounted) return;
          setMsg('Payment completed. Booking created.');
        }

        // Booking flows
        else if (bookingId) {
          if (!mounted) return;
          setMsg(status === 'success' ? 'Payment success' : 'Payment pending');
        }

        // Default
        else {
          if (!mounted) return;
          setMsg('Payment processed.');
        }

      } catch (e) {
        if (!mounted) return;
        setMsg('Payment processed (check My Bookings).');
      }
    })();

    return () => { mounted = false; };
  }, [tranCtx, cartRef, bookingId, status, dispatch]);

  return (
    <div className="container mx-auto py-12 text-center">
      <h1 className="text-2xl font-semibold mb-4">Payment</h1>
      <p>{msg}</p>
      <div className="mt-6">
        <a href="/my-bookings" className="text-blue-600 underline">
          Go to My Bookings
        </a>
      </div>
    </div>
  );
}
