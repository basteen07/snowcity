import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { getPrice, getBasePrice, getUnitLabel } from '../../utils/pricing';
import { imgSrc } from '../../utils/media';

export default function OfferCard({ item }) {
  const title = item?.name || item?.title || 'Offer';
  const desc = item?.short_description || item?.subtitle || '';
  const img = imgSrc(item, 'https://picsum.photos/seed/offer/640/400');

  const price = getPrice(item);        // sale/discount price if present, else base
  const basePrice = getBasePrice(item);
  const hasSale = basePrice > 0 && price > 0 && price < basePrice;
  const unit = getUnitLabel(item);     // 'per person' by default

  const attractionId = item?.attraction_id || item?.attraction?.id || null;
  const bookHref = attractionId ? `/booking?attraction_id=${attractionId}` : null;

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden border">
      <div className="relative aspect-[4/3]">
        <img src={img} alt={title} className="w-full h-full object-cover" loading="lazy" />
        {price > 0 ? (
          <div className="absolute top-2 left-2 rounded-full bg-black/70 text-white px-3 py-1 text-xs md:text-sm">
            <span className="font-semibold">{formatCurrency(price)}</span>
            <span className="opacity-80"> {unit}</span>
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-1">{title}</h3>
        {desc ? <p className="text-sm text-gray-600 line-clamp-2 mt-1">{desc}</p> : null}

        {hasSale ? (
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-sm line-through text-gray-400">{formatCurrency(basePrice)}</div>
            <div className="text-sm text-green-700 font-medium">Save {formatCurrency(basePrice - price)}</div>
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-3">
          <Link to="/offers" className="text-sm text-blue-600 hover:underline">View Offer</Link>
          {bookHref ? (
            <Link
              to={bookHref}
              className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
              title="Book with this offer"
            >
              Book Now
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}