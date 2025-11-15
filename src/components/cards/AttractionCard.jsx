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
    <div
      className="
        bg-white rounded-2xl overflow-hidden border
        shadow-[0_2px_10px_rgba(0,0,0,0.08)]
        hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]
        transition-all duration-300
        hover:-translate-y-1
      "
    >
      {/* IMAGE SECTION */}
      <div className="relative aspect-[4/3] w-full overflow-hidden group">
        <img
          src={img}
          alt={title}
          className="
            w-full h-full object-cover
            transition-transform duration-500
            group-hover:scale-[1.06]
            group-hover:brightness-[1.08]
          "
          loading="lazy"
          decoding="async"
          sizes="(min-width: 768px) 33vw, 50vw"
        />

        {/* PRICE BADGE */}
        {basePrice > 0 ? (
          <div
            className="
              absolute top-3 left-3 px-3 py-1.5 text-xs md:text-sm
              rounded-full bg-black/60 backdrop-blur-md
              text-white font-semibold shadow
            "
          >
            ₹{Math.round(basePrice)}
            <span className="opacity-80 font-normal"> / person</span>
          </div>
        ) : null}

        {/* TOP GRADIENT OVERLAY */}
        <div className="
          absolute inset-0 bg-gradient-to-b 
          from-black/20 via-transparent to-transparent
        " />
      </div>

      {/* DETAILS SECTION */}
      <div className="p-4">
        <h3
          className="
            font-semibold text-gray-900 text-base sm:text-lg 
            line-clamp-1 tracking-tight
          "
        >
          {title}
        </h3>

        {/* ACTION BUTTONS */}
        <div className="mt-4 flex items-center gap-4">
          <Link
            to={attrId ? `/booking?attraction_id=${attrId}` : '/booking'}
            className="
              inline-flex items-center gap-1
              rounded-full bg-blue-600 px-4 py-2 text-white text-sm
              hover:bg-blue-700 active:scale-95 transition-all
              shadow-sm
            "
          >
            <span>🎟</span> Book Now
          </Link>

          {attrId ? (
            <Link
              to={`/attractions/${attrId}`}
              className="
                text-sm text-blue-600 hover:text-blue-800 font-medium
                transition
              "
            >
              Quick View →
            </Link>
          ) : (
            <span className="text-sm text-gray-400">Quick View</span>
          )}
        </div>
      </div>
    </div>
  );
}
