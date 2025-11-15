import React from "react";
import { Link } from "react-router-dom";
import ComboCard from "../cards/ComboCard";
import OfferCard from "../cards/OfferCard";

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
      ...(combos || []).map((c) => ({ type: "combo", data: c })),
      ...(offers || []).map((o) => ({ type: "offer", data: o })),
    ];

    const seen = new Set();
    return mixed.map((it, i) => {
      const key = makeStableKey(it.type, it.data, i);
      if (!seen.has(key)) seen.add(key);
      return { ...it, __key: key };
    });
  }, [offers, combos]);

  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (!items.length) return;
    const timer = setInterval(() => {
      setIndex((p) => (p + 1) % items.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  const current = items[index];

  return (
    <section className="relative w-full overflow-hidden pt-14 pb-20 bg-[#06111f]">

      {/* 🔹 ANIMATED LIQUID WAVE SEPARATOR */}
      <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-[0]">
        <svg
          className="relative block w-[200%] h-[90px] animate-liquidWave"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39 56.44c58.39 4.09 113.77 22.36 171.23 29.21 95.25 11.73 191.92-7.88
              284.83-25.5 93.44-17.72 188.32-36.37 285.78-27.95 
              66 5.64 128.47 24.69 193.77 39.54V0H0v27.35
              c47.72 22.52 103.4 27.88 157.05 29.66 
              54.13 1.79 108.29-3.64 164.34-.57z"
            fill="#0a1f36"
            fillOpacity="0.9"
          />
        </svg>
      </div>

      {/* ❄️ POLAR STORM BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="storm-layer"></div>
        <div className="storm-layer layer2"></div>
        <div className="storm-layer layer3"></div>
      </div>

      {/* TITLE */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-wide drop-shadow-xl">
          Combo Deals & Offers
        </h2>

        <div className="mt-2 flex justify-center">
          <span className="h-1 w-20 bg-blue-300 rounded-full shadow-xl"></span>
        </div>

        <div className="mt-3 flex items-center justify-center gap-5">
          <Link className="text-sm text-blue-200 hover:text-white" to="/combos">Combos</Link>
          <Link className="text-sm text-blue-200 hover:text-white" to="/offers">Offers</Link>
        </div>
      </div>

      {/* SINGLE SLIDING CARD */}
      <div className="relative z-10 max-w-md mx-auto px-4 mt-6">
        <div
          key={current.__key + "-" + index}
          className="w-full rounded-2xl overflow-hidden shadow-2xl 
          bg-white/80 backdrop-blur-xl border border-white/40 animate-slideUpCard"
        >
          {current.type === "combo" ? (
            <ComboCard item={current.data} />
          ) : (
            <OfferCard item={current.data} />
          )}
        </div>
      </div>

      {/* ANIMATIONS */}
      <style>{`
        /* === CARD ANIMATION === */
        @keyframes slideUpCard {
          0% { opacity: 0; transform: translateY(25px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slideUpCard {
          animation: slideUpCard 0.6s ease-out;
        }

        /* === LIQUID WAVE === */
        @keyframes liquidWave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-liquidWave {
          animation: liquidWave 12s linear infinite;
        }

        /* === POLAR WIND STORM SNOW === */
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

        .storm-layer.layer2 {
          animation-duration: 9s;
          opacity: 0.4;
          transform: skewX(-18deg) scale(1.2);
        }

        .storm-layer.layer3 {
          animation-duration: 13s;
          opacity: 0.25;
          transform: skewX(-18deg) scale(1.45);
        }

        
      `}</style>
    </section>
  );
}
