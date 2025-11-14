import React from 'react';
import { Link } from 'react-router-dom';
import AttractionCard from '../cards/AttractionCard';

function getUniqueKey(item) {
  return String(
    item?.attraction_id ??
    item?.id ??
    item?.slug ??
    item?.uuid ??
    ''
  );
}
function toTime(item) {
  const t = Date.parse(item?.created_at ?? item?.createdAt ?? '');
  return Number.isFinite(t) ? t : NaN;
}
function toSeq(item) {
  const n = Number(item?.attraction_id ?? item?.id);
  return Number.isFinite(n) ? n : NaN;
}
function compareFirstAdded(a, b) {
  const at = toTime(a);
  const bt = toTime(b);
  if (Number.isFinite(at) && Number.isFinite(bt) && at !== bt) return at - bt;
  const ai = toSeq(a);
  const bi = toSeq(b);
  if (Number.isFinite(ai) && Number.isFinite(bi) && ai !== bi) return ai - bi;
  return 0;
}
function useUniqueSorted(items) {
  return React.useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return [];
    const seen = new Set();
    const deduped = [];
    for (const it of items) {
      const k = getUniqueKey(it) || `k-${deduped.length}`;
      if (!seen.has(k)) {
        seen.add(k);
        deduped.push({ __key: k, ...it });
      }
    }
    deduped.sort(compareFirstAdded);
    return deduped;
  }, [items]);
}

export default function AttractionsCarousel({ items = [] }) {
  const list = useUniqueSorted(items);
  if (!list.length) return null;

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-white via-blue-50/20 to-white py-10">
      {/* Snow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="snowfall absolute inset-0" />
        <div className="snowleaves absolute inset-0" />
      </div>

      {/* Title */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-5 md:px-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Attractions
          </h2>
          <div className="mt-2 flex items-center justify-center">
            <span className="h-1 w-16 rounded-full bg-blue-600/80" />
          </div>
          <div className="mt-3">
            <Link to="/attractions" className="text-sm text-blue-600 hover:underline">
              View all attractions →
            </Link>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-5 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {list.map((item) => (
            <div
              key={item.__key}
              className="p-1.5 sm:p-2 rounded-2xl transition-transform duration-300 hover:-translate-y-[2px]"
            >
              <div className="rounded-2xl shadow-sm hover:shadow-md ring-1 ring-black/5 overflow-hidden bg-white">
                <AttractionCard item={item} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Animations */}
      
    </section>
  );
}