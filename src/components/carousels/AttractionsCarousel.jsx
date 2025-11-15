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

export default function AttractionsCarousel({ items = [] }) {
  const [index, setIndex] = React.useState(0);
  const cards = React.useMemo(
    () =>
      items.map((it) => ({
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
        relative w-full overflow-hidden py-12
        bg-gradient-to-b
        from-[#0b1a33]
        via-[#0a315e]
        to-[#dff4ff]
      "
    >
      {/* Subtle wave top (minimal CSS) */}
      <div className="absolute top-0 left-0 right-0 h-16 z-0 overflow-hidden">
        <svg
          className="w-full h-full animate-wave"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#0a315e"
            d="M0,224L48,202.7C96,181,192,139,288,138.7C384,139,480,181,576,213.3C672,245,768,267,864,266.7C960,267,1056,245,1152,229.3C1248,213,1344,203,1392,197.3L1440,192V0H0Z"
          />
        </svg>
      </div>

      {/* Header */}
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

      {/* Desktop grid */}
      <div className="hidden md:block relative z-10 max-w-6xl mx-auto px-5">
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((item, i) => (
            <div
              key={item._key}
              className="
                rounded-2xl overflow-hidden bg-white
                border border-white/40
                shadow-md hover:shadow-xl
                transition-all duration-300 hover:-translate-y-1
                will-change-transform
              "
            >
              <AttractionCard item={item} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile paired cards */}
      <div className="md:hidden relative z-10 max-w-md mx-auto px-4 mt-2">
        <div className="flex items-center justify-between gap-3 w-full h-[260px] relative overflow-hidden">
          {/* Left card */}
          {leftCard && (
            <div
              key={leftCard._key + "-L-" + index}
              className="
                w-[48%] rounded-2xl bg-white shadow-md overflow-hidden
                border border-white/40
                animate-card
              "
              style={{ "--x": "-24px" }}
            >
              <AttractionCard item={leftCard} />
            </div>
          )}

          {/* Right card (if exists) */}
          {!isLastOdd && rightCard && (
            <div
              key={rightCard._key + "-R-" + index}
              className="
                w-[48%] rounded-2xl bg-white shadow-md overflow-hidden
                border border-white/40
                animate-card
              "
              style={{ "--x": "24px" }}
            >
              <AttractionCard item={rightCard} />
            </div>
          )}

          {/* Final single card centered */}
          {isLastOdd && (
            <div
              key={leftCard._key + "-ODD-" + index}
              className="
                absolute left-1/2 -translate-x-1/2 w-[70%]
                rounded-2xl bg-white shadow-md overflow-hidden
                border border-white/40
                animate-card
              "
              style={{ "--y": "24px" }}
            >
              <AttractionCard item={leftCard} />
            </div>
          )}
        </div>
      </div>

      {/* Minimal CSS: single wave + single card animation */}
      <style>{`
         @keyframes liquidWave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-liquidWave {
          animation: liquidWave 12s linear infinite;
        }

.storm-layer {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(3px 4px at 20% 10%, rgba(255,255,255,0.7), transparent),
            radial-gradient(2px 3px at 80% 20%, rgba(255,255,255,0.5), transparent),
            radial-gradient(4px 5px at 50% 40%, rgba(255,255,255,0.9), transparent),
            radial-gradient(3px 3px at 30% 75%, rgba(255,255,255,0.8), transparent);
          background-size: 200px 200px;
          transform: skewX(-18deg);
          animation: polarStorm 6s linear infinite;
          opacity: 0.7;
        }

        @keyframes cardIn {
          0% { opacity: 0; transform: translate(var(--x, 0), var(--y, 12px)) scale(0.98); }
          100% { opacity: 1; transform: translate(0, 0) scale(1); }
        }
        .animate-card {
          animation: cardIn .55s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-wave, .animate-card { animation: none !important; }
        }
      `}</style>
    </section>
  );
}