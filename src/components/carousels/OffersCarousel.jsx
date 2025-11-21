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
  const desktopCards = items.slice(0, 6);

  return (
    <section className="relative w-full overflow-hidden py-16 px-4 bg-slate-900">

      {/* floating background icons */}
      <div className="pointer-events-none absolute inset-0">
        <span
          className="absolute top-10 right-12 text-6xl opacity-10 text-yellow-200 animate-comboStar"
          aria-hidden="true"
        >
          ⭐
        </span>
        <span
          className="absolute bottom-12 left-16 text-6xl opacity-10 text-indigo-200 animate-comboSpark"
          aria-hidden="true"
        >
          💫
        </span>
      </div>

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
            fill="#0b1424"
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
        <p className="text-xs font-semibold tracking-[0.4em] text-yellow-200/70">
          COMBO DEALS & OFFERS
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mt-3">
          Save more when you bundle experiences
        </h2>
        <p className="mt-4 text-white/70 text-sm">
          Save more when you book multiple attractions together!
        </p>

        <div className="mt-5 flex items-center justify-center gap-5">
          <Link className="text-sm font-semibold text-blue-200 hover:text-white" to="/combos">Combos</Link>
          <Link className="text-sm font-semibold text-blue-200 hover:text-white" to="/offers">Offers</Link>
        </div>
      </div>

      {/* DESKTOP GRID */}
      <div className="hidden md:block relative z-10 max-w-6xl mx-auto px-4 mt-8">
        <div className="grid md:grid-cols-3 gap-6">
          {desktopCards.map((card) => (
            <div
              key={card.__key}
              className="rounded-2xl overflow-hidden shadow-2xl bg-white/80 backdrop-blur-xl border border-white/40"
            >
              {card.type === "combo" ? <ComboCard item={card.data} /> : <OfferCard item={card.data} />}
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE SLIDER */}
      <div className="md:hidden relative z-10 max-w-md mx-auto px-4 mt-6">
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

        @keyframes comboStar {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
        .animate-comboStar {
          animation: comboStar 8s linear infinite;
        }

        @keyframes comboSpark {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(-180deg); }
          100% { transform: scale(1) rotate(-360deg); }
        }
        .animate-comboSpark {
          animation: comboSpark 10s linear infinite;
        }

        /* === LIQUID WAVE === */
        @keyframes liquidWave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-liquidWave {
          animation: liquidWave 12s linear infinite;
        }

       
        
      `}</style>
    </section>
  );
}
