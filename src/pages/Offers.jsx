import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOffers } from '../features/offers/offersSlice';
import OfferCard from '../components/cards/OfferCard';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';

export default function Offers() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((s) => s.offers);

  React.useEffect(() => {
    if (status === 'idle') dispatch(fetchOffers({ active: true, page: 1, limit: 24 }));
  }, [status, dispatch]);

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-semibold mb-2">Offers</h1>
        <p className="text-gray-600 mb-6">Grab the latest offers and save on your visit.</p>

        {status === 'loading' && !items.length ? <Loader /> : null}
        {status === 'failed' ? <ErrorState message={error?.message || 'Failed to load offers'} /> : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => <OfferCard key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  );
}