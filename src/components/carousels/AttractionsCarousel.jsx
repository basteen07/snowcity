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
              View all →
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
      <style>{`
        .snowfall {
          --c1: rgba(255,255,255,0.9);
          --c2: rgba(255,255,255,0.65);
          --c3: rgba(255,255,255,0.45);
          background-image:
            radial-gradient(2px 2px at 20px 30px, var(--c1), transparent),
            radial-gradient(3px 3px at 120px 180px, var(--c2), transparent),
            radial-gradient(2px 2px at 240px 90px, var(--c3), transparent),
            radial-gradient(2px 2px at 360px 140px, var(--c2), transparent),
            radial-gradient(3px 3px at 300px 20px, var(--c1), transparent),
            radial-gradient(2px 2px at 160px 110px, var(--c3), transparent);
          background-size: 420px 420px;
          animation: snowFall 22s linear infinite;
          opacity: 0.55;
        }
        .snowleaves {
          --l1: rgba(255,255,255,0.32);
          --l2: rgba(255,255,255,0.24);
          --l3: rgba(255,255,255,0.16);
          background-image:
            radial-gradient(6px 6px at 60px 80px, var(--l1), transparent),
            radial-gradient(8px 8px at 220px 130px, var(--l2), transparent),
            radial-gradient(10px 10px at 340px 220px, var(--l3), transparent),
            radial-gradient(7px 7px at 460px 30px, var(--l2), transparent);
          background-size: 520px 520px;
          animation: snowLeaves 28s linear infinite;
          opacity: 0.28;
        }
        @keyframes snowFall {
          from { background-position: 0 0, 0 0, 0 0, 0 0, 0 0, 0 0; }
          to   { background-position: 0 1000px, 0 800px, 0 950px, 0 700px, 0 900px, 0 850px; }
        }
        @keyframes snowLeaves {
          from { background-position: 0 0, 0 0, 0 0, 0 0; }
          to   { background-position: -100px 1100px, 60px 900px, -80px 1000px, 40px 950px; }
        }
      `}</style>
    </section>
  );
}