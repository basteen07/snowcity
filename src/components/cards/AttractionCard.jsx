import React from 'react';
import { Link } from 'react-router-dom';
import { getAttrId } from '../../utils/ids';
import { imgSrc } from '../../utils/media';

export default function AttractionCard({ item }) {
  const title = item?.name || item?.title || 'Attraction';
  const img = imgSrc(item, 'https://picsum.photos/seed/attr/640/400');
  const attrId = getAttrId(item);
  const basePrice = Number(item?.base_price ?? item?.price ?? item?.amount ?? 0);

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden border">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          sizes="(min-width: 768px) 33vw, 50vw"
        />
        {basePrice > 0 ? (
          <div className="absolute top-2 left-2 rounded-full bg-black/70 text-white px-3 py-1 text-xs md:text-sm">
            <span className="font-semibold">₹{Math.round(basePrice)}</span>
            <span className="opacity-80"> per person</span>
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-1">{title}</h3>
        <div className="mt-3 flex items-center gap-3">
          <Link
            to={attrId ? `/booking?attraction_id=${attrId}` : '/booking'}
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
          >
            Book Now
          </Link>
          {attrId ? (
            <Link to={`/attractions/${attrId}`} className="text-sm text-blue-600 hover:underline">
              Quick View
            </Link>
          ) : (
            <span className="text-sm text-gray-400">Quick View</span>
          )}
        </div>
      </div>
    </div>
  );
}