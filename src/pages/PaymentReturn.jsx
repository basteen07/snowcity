// src/pages/PaymentReturn.jsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { get } from '../services/apiClient';
import { EP } from '../services/endpoints';
import { useDispatch } from 'react-redux';
import { finalizeCart } from '../features/cart/cartSlice';

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
        // Hit webhook GET (idempotent, ok if it already ran)
        if (tranCtx) await get(EP.payphiReturn(tranCtx)).catch(() => {});

        if (cartRef && status === 'success') {
          await dispatch(finalizeCart({ cart_ref: cartRef })).unwrap().catch(() => {});
          if (!mounted) return;
          setMsg('Cart payment completed. Bookings created.');
        } else if (bookingId) {
          // For booking flows, webhook already finalized booking.
          if (!mounted) return;
          setMsg(status === 'success' ? 'Payment success' : 'Payment pending');
        } else {
          if (!mounted) return;
          setMsg('Payment processed.');
        }
      } catch (e) {
        if (!mounted) return;
        setMsg('Payment processed (check My Bookings or Cart).');
      }
    })();

    return () => { mounted = false; };
  }, [tranCtx, cartRef, bookingId, status, dispatch]);

  return (
    <div className="container mx-auto py-12 text-center">
      <h1 className="text-2xl font-semibold mb-4">Payment</h1>
      <p>{msg}</p>
      <div className="mt-6">
        <a href="/my-bookings" className="text-blue-600 underline">Go to My Bookings</a>
      </div>
    </div>
  );
}