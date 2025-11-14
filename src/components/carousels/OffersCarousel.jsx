import React from 'react';
import { Link } from 'react-router-dom';
import ComboCard from '../cards/ComboCard';
import OfferCard from '../cards/OfferCard';

function makeStableKey(prefix, data, idx) {
  const id =
    data?.combo_id ??
    data?.id ??
    data?.slug ??
    data?.code ??
    data?.uid ??
    data?._id ??
    null;
  return `${prefix}:${id ?? `idx-${idx}`}`;
}

export default function OffersCarousel({ offers = [], combos = [] }) {
  const items = React.useMemo(() => {
    const mixed = [
      ...((combos || []).filter(Boolean).map((c) => ({ type: 'combo', data: c }))),
      ...((offers || []).filter(Boolean).map((o) => ({ type: 'offer', data: o }))),
    ];
    // Optional: de-dup by type+id if you expect duplicates
    const seen = new Set();
    const out = [];
    mixed.forEach((it, i) => {
      const key = makeStableKey(it.type, it.data, i);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ ...it, __key: key });
      }
    });
    return out;
  }, [offers, combos]);

  if (!items.length) return null;

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-white via-blue-50/20 to-white py-10">
      {/* Snow background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="snowfall absolute inset-0" />
        <div className="snowleaves absolute inset-0" />
      </div>

      {/* Section Title */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-5 md:px-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Combo Deals & Offers
          </h2>
          <div className="mt-2 flex items-center justify-center">
            <span className="h-1 w-16 rounded-full bg-blue-600/80" />
          </div>
          <div className="mt-3 flex items-center justify-center gap-4">
            <Link to="/combos" className="text-sm text-blue-600 hover:underline">Combos</Link>
            <Link to="/offers" className="text-sm text-blue-600 hover:underline">Offers</Link>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-5 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {items.map((it) =>
            it.type === 'combo' ? (
              <div
                key={it.__key}
                className="p-1.5 sm:p-2 rounded-2xl transition-transform duration-300 hover:-translate-y-[2px]"
              >
                <div className="rounded-2xl shadow-sm hover:shadow-md ring-1 ring-black/5 overflow-hidden bg-white">
                  <ComboCard item={it.data} />
                </div>
              </div>
            ) : (
              <div
                key={it.__key}
                className="p-1.5 sm:p-2 rounded-2xl transition-transform duration-300 hover:-translate-y-[2px]"
              >
                <div className="rounded-2xl shadow-sm hover:shadow-md ring-1 ring-black/5 overflow-hidden bg-white">
                  <OfferCard item={it.data} />
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Snow styles */}
     
    </section>
  );
}