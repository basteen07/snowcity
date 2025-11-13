import React from 'react';
import AttractionCard from '../cards/AttractionCard';

export default function AttractionsCarousel({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="py-10 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold">Attractions</h2>
          <a href="/attractions" className="text-sm text-blue-600 hover:underline">View all</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <AttractionCard key={item?.id || idx} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}