import React from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAdminBooking, updateAdminBooking, cancelAdminBooking,
  payphiStatusAdmin, payphiInitiateAdmin, payphiRefundAdmin
} from '../../features/bookings/adminBookingsSlice';

export default function BookingDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, action } = useSelector((s) => s.adminBookings);
  const [patch, setPatch] = React.useState({ payment_status: '', booking_status: '', payment_ref: '' });
  const [refund, setRefund] = React.useState({ amount: '', newMerchantTxnNo: '' });
  const [init, setInit] = React.useState({ email: '', mobile: '' });

  React.useEffect(() => {
    dispatch(getAdminBooking({ id }));
  }, [id, dispatch]);

  const b = current.data;

  if (current.status === 'loading' && !b) return <div>Loading…</div>;
  if (current.status === 'failed') return <div className="text-red-600">{current.error?.message || 'Failed to load booking'}</div>;

  const onSave = async () => {
    await dispatch(updateAdminBooking({ id, patch })).unwrap().catch(() => {});
    dispatch(getAdminBooking({ id }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-3">Booking #{b?.booking_ref || b?.booking_id || id}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><div className="text-gray-500">User</div><div>{b?.user?.email || b?.user_email || '—'}</div></div>
          <div><div className="text-gray-500">Attraction</div><div>{b?.attraction?.title || b?.attraction_title || '—'}</div></div>
          <div><div className="text-gray-500">Amount</div><div>₹{b?.final_amount ?? b?.total_amount ?? 0}</div></div>
          <div><div className="text-gray-500">Status</div><div>{b?.booking_status} / {b?.payment_status}</div></div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="font-semibold mb-2">Update statuses</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="rounded-md border px-3 py-2" value={patch.payment_status} onChange={(e) => setPatch({ ...patch, payment_status: e.target.value })}>
            <option value="">Payment status</option>
            <option>Pending</option><option>Completed</option><option>Failed</option><option>Cancelled</option>
          </select>
          <select className="rounded-md border px-3 py-2" value={patch.booking_status} onChange={(e) => setPatch({ ...patch, booking_status: e.target.value })}>
            <option value="">Booking status</option>
            <option>Booked</option><option>Redeemed</option><option>Expired</option><option>Cancelled</option>
          </select>
          <input className="rounded-md border px-3 py-2" placeholder="Payment ref" value={patch.payment_ref} onChange={(e) => setPatch({ ...patch, payment_ref: e.target.value })} />
        </div>
        <button className="mt-3 rounded-md bg-gray-900 text-white px-4 py-2 text-sm" onClick={onSave} disabled={action.status === 'loading'}>
          {action.status === 'loading' ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="font-semibold mb-2">PayPhi</h3>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => dispatch(payphiStatusAdmin({ id }))}>Check Status</button>
          <input className="rounded-md border px-2 py-1" placeholder="Email" value={init.email} onChange={(e) => setInit({ ...init, email: e.target.value })} />
          <input className="rounded-md border px-2 py-1" placeholder="Mobile" value={init.mobile} onChange={(e) => setInit({ ...init, mobile: e.target.value })} />
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => dispatch(payphiInitiateAdmin({ id, email: init.email, mobile: init.mobile }))}>Initiate</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className="rounded-md border px-2 py-1" placeholder="Refund amount" value={refund.amount} onChange={(e) => setRefund({ ...refund, amount: e.target.value })} />
          <input className="rounded-md border px-2 py-1" placeholder="New Txn No (optional)" value={refund.newMerchantTxnNo} onChange={(e) => setRefund({ ...refund, newMerchantTxnNo: e.target.value })} />
          <button className="rounded-md border px-3 py-2 text-sm text-red-600" onClick={() => dispatch(payphiRefundAdmin({ id, ...refund }))}>Refund</button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="font-semibold mb-2">Danger</h3>
        <button className="rounded-md border px-3 py-2 text-sm text-red-600" onClick={() => dispatch(cancelAdminBooking({ id }))}>Cancel Booking</button>
      </div>
    </div>
  );
}

