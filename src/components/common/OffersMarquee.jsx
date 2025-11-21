import React from 'react';
import { Sparkles } from 'lucide-react';

const defaultOffers = [
  '🎉 WEDNESDAY SPECIAL: Get 20% OFF on all attractions',
  '⚡ HAPPY HOURS: 2 PM - 4 PM - Buy 1 Get 1 Free',
  '🎂 BIRTHDAY SPECIAL: Free entry for birthday child',
  '👨‍👩‍👧‍👦 FAMILY PACK: 4 tickets at just ₹2999',
  '📸 FREE PHOTO PACKAGE with Fast Pass',
  '🍔 COMBO MEAL OFFER: Save ₹200 on food combos',
];

export default function OffersMarquee({ items }) {
  const offers = React.useMemo(() => {
    const src = Array.isArray(items) && items.length ? items : defaultOffers;
    return [...src, ...src];
  }, [items]);

  return (
    <section className="relative bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-300 py-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-3 px-4 text-slate-900 font-bold tracking-wide">
        <Sparkles className="w-5 h-5" />
        <span>SPECIAL OFFERS</span>
      </div>

      <div className="relative flex overflow-hidden">
        <div className="flex whitespace-nowrap animate-offers-marquee">
          {offers.map((offer, idx) => (
            <span
              key={`${offer}-${idx}`}
              className="inline-flex items-center mx-8 text-slate-900 font-semibold text-sm sm:text-base"
            >
              <span className="text-xl mr-3">•</span>
              {offer}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes offersMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-offers-marquee {
          animation: offersMarquee 30s linear infinite;
        }
      `}</style>
    </section>
  );
}
