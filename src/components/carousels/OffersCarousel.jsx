import React from 'react';
import ComboCard from '../cards/ComboCard';
import OfferCard from '../cards/OfferCard';

export default function OffersCarousel({ offers = [], combos = [] }) {
  const items = [
    ...((combos || []).filter(Boolean).map((c) => ({ type: 'combo', data: c }))),
    ...((offers || []).filter(Boolean).map((o) => ({ type: 'offer', data: o })))
  ];
  if (!items.length) return null;

  const makeKey = (prefix, item, idx) => {
    const id = item?.combo_id ?? item?.id ?? item?.slug ?? item?._id ?? item?.code ?? item?.uid ?? null;
    return `${prefix}:${id ?? `idx-${idx}`}`;
  };

  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Parallax header */}
        <div className="relative mb-6">
          <div
            className="h-36 md:h-48 rounded-2xl bg-center bg-cover bg-fixed"
            style={{ backgroundImage: "url('/images/deals-hero.jpg')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/35 px-4 py-2 rounded-lg backdrop-blur-sm text-center">
              <h2 className="text-white text-xl md:text-2xl font-semibold">Combo Deals & Offers</h2>
              <p className="text-gray-200 text-xs md:text-sm mt-1">Save more with bundles and specials</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end mb-4">
          <div className="flex gap-4">
            <a href="/combos" className="text-sm text-blue-600 hover:underline">Combos</a>
            <a href="/offers" className="text-sm text-blue-600 hover:underline">Offers</a>
          </div>
        </div>

        {/* Grid: 2 per row on phones, 3 per row on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((it, idx) => {
            const key = makeKey(it.type, it.data, idx);
            return it.type === 'combo' ? (
              <ComboCard key={key} item={it.data} />
            ) : (
              <OfferCard key={key} item={it.data} />
            );
          })}
        </div>
      </div>
    </section>
  );
}