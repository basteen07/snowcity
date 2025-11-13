import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listAdminBookings } from '../../features/bookings/adminBookingsSlice';
import AdminTable from '../../components/common/AdminTable';
import AdminPagination from '../../components/common/AdminPagination';
import { useNavigate } from 'react-router-dom';

export default function BookingsList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list } = useSelector((s) => s.adminBookings);
  const [filters, setFilters] = React.useState({ search: '', payment_status: '', booking_status: '' });

  React.useEffect(() => {
    if (list.status === 'idle') dispatch(listAdminBookings({ page: 1, limit: 20 }));
  }, [list.status, dispatch]);

  const onSearch = () => {
    dispatch(listAdminBookings({ ...filters, page: 1, limit: 20 }));
  };

  const meta = list.meta || {};
  const totalPages = meta.totalPages || meta.total_pages || 1;
  const currPage = meta.page || list.query.page || 1;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Bookings</h1>
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
        <button className="rounded-md bg-gray-900 text-white px-3 py-2" onClick={onSearch}>Filter</button>
      </div>

      <AdminTable
        keyField="booking_id"
        columns={[
          { key: 'booking_ref', title: 'Ref' },
          { key: 'user_email', title: 'User' },
          { key: 'attraction_title', title: 'Attraction' },
          { key: 'payment_status', title: 'Payment' },
          { key: 'booking_status', title: 'Status' },
          { key: 'final_amount', title: 'Amount', render: (r) => `₹${r?.final_amount ?? r?.total_amount ?? 0}` }
        ]}
        rows={list.data}
        onRowClick={(r) => navigate(`/admin/bookings/${r.booking_id ?? r.id}`)}
        empty={list.status === 'loading' ? 'Loading…' : 'No bookings'}
      />

      <AdminPagination
        page={currPage}
        totalPages={totalPages}
        onPage={(p) => dispatch(listAdminBookings({ ...filters, page: p, limit: 20 }))}
      />
    </div>
  );
}