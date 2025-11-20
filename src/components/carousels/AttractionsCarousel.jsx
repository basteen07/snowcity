import React from "react";
import { Link } from "react-router-dom";
import AttractionCard from "../cards/AttractionCard";

function getUniqueKey(item) {
  return (
    item?.attraction_id ??
    item?.id ??
    item?.slug ??
    item?.uuid ??
    "k-" + Math.random()
  ).toString();
}

function getSortValue(item) {
  const candidate =
    item?.attraction_id ??
    item?.id ??
    (typeof item?.slug === "string" ? item.slug : null);
  const asNumber = Number(candidate);
  if (!Number.isNaN(asNumber) && isFinite(asNumber)) return asNumber;
  if (candidate != null) return candidate;
  return Infinity;
}

export default function AttractionsCarousel({ items = [] }) {
  const [index, setIndex] = React.useState(0);

  const cards = React.useMemo(
    () =>
      [...items]
        .sort((a, b) => {
          const av = getSortValue(a);
          const bv = getSortValue(b);
          if (av === bv) return 0;
          return av < bv ? -1 : 1;
        })
        .map((it) => ({
          ...it,
          _key: getUniqueKey(it),
        })),
    [items]
  );

  const pairCount = Math.ceil(cards.length / 2);

  React.useEffect(() => {
    if (window.innerWidth >= 768) return;
    const timer = setInterval(() => {
      setIndex((p) => (p + 1) % pairCount);
    }, 3000);
    return () => clearInterval(timer);
  }, [pairCount]);

  const leftCard = cards[index * 2];
  const rightCard = cards[index * 2 + 1];
  const isLastOdd = !rightCard && index === pairCount - 1;

  return (
    <section
      className="
        relative w-full overflow-hidden py-14 
        bg-gradient-to-b
        from-[#0b1a33]
        via-[#0a315e]
        to-[#dff4ff]
      "
    >
      {/* ⭐ SAME WAVE STYLE FROM OFFERS-CAROUSEL */}
      <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-[0] z-0">
        <svg
          className="relative block w-[200%] h-[90px] animate-liquidWave"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="
              M321.39 56.44
              c58.39 4.09 113.77 22.36 171.23 29.21
              c95.25 11.73 191.92-7.88 284.83-25.5
              c93.44-17.72 188.32-36.37 285.78-27.95
              c66 5.64 128.47 24.69 193.77 39.54V0H0v27.35
              c47.72 22.52 103.4 27.88 157.05 29.66
              c54.13 1.79 108.29-3.64 164.34-.57z
            "
            fill="#0a1f36"
            fillOpacity="0.9"
          />
        </svg>
      </div>

      {/* HEADER */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-5 md:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
            Attractions
          </h2>
          <div className="mt-3 flex items-center justify-center">
            <span className="h-1 w-20 rounded-full bg-blue-300/80 shadow" />
          </div>
          <div className="mt-3">
            <Link
              to="/attractions"
              className="text-sm text-blue-200 hover:text-white hover:underline"
            >
              View all attractions →
            </Link>
          </div>
        </div>
      </div>

      {/* DESKTOP GRID */}
      <div className="hidden md:block relative z-10 max-w-6xl mx-auto px-5">
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((item) => (
            <div
              key={item._key}
              className="
                rounded-2xl overflow-hidden bg-white
                border border-white/40 shadow-md
                hover:shadow-xl transition-all duration-300
                hover:-translate-y-1 will-change-transform
              "
            >
              <AttractionCard item={item} />
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE PAIRED CARDS */}
      <div className="md:hidden relative z-10 max-w-md mx-auto px-4 mt-2">
        <div className="flex items-center justify-between gap-3 w-full h-[260px] relative overflow-hidden">
          {leftCard && (
            <div
              key={leftCard._key + "-L-" + index}
              className="
                w-[48%] rounded-2xl bg-white shadow-md overflow-hidden
                border border-white/40 animate-card
              "
              style={{ "--x": "-24px" }}
            >
              <AttractionCard item={leftCard} />
            </div>
          )}

          {!isLastOdd && rightCard && (
            <div
              key={rightCard._key + "-R-" + index}
              className="
                w-[48%] rounded-2xl bg-white shadow-md overflow-hidden
                border border-white/40 animate-card
              "
              style={{ "--x": "24px" }}
            >
              <AttractionCard item={rightCard} />
            </div>
          )}

          {isLastOdd && (
            <div
              key={leftCard._key + "-ODD-" + index}
              className="
                absolute left-1/2 -translate-x-1/2 w-[70%]
                rounded-2xl bg-white shadow-md overflow-hidden
                border border-white/40 animate-card
              "
              style={{ "--y": "24px" }}
            >
              <AttractionCard item={leftCard} />
            </div>
          )}
        </div>
      </div>

      {/* ⭐ SAME WAVE & CARD ANIMATIONS */}
      <style>{`
        @keyframes liquidWave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-liquidWave {
          animation: liquidWave 12s linear infinite;
        }

        @keyframes cardIn {
          0% { opacity: 0; transform: translate(var(--x, 0), var(--y, 12px)) scale(0.98); }
          100% { opacity: 1; transform: translate(0, 0) scale(1); }
        }
        .animate-card {
          animation: cardIn .55s ease-out both;
        }
      `}</style>
    </section>
  );
}
