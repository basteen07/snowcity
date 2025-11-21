import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { getPrice, getBasePrice, getUnitLabel, getDiscountPercent } from '../../utils/pricing';
import { imgSrc } from '../../utils/media';

export default function OfferCard({ item }) {
  const title = item?.name || item?.title || 'Offer';
  const desc = item?.short_description || item?.subtitle || '';
  const img = imgSrc(item, 'https://picsum.photos/seed/offer/640/400');

  const price = getPrice(item);
  const basePrice = getBasePrice(item);
  const hasSale = basePrice > 0 && price > 0 && price < basePrice;
  const discountPercent = hasSale ? Math.round(getDiscountPercent(item) || ((basePrice - price) / basePrice) * 100) : 0;
  const unit = getUnitLabel(item);

  const attractionId = item?.attraction_id || item?.attraction?.id || null;
  const bookHref = attractionId ? `/booking?attraction_id=${attractionId}` : null;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/30 bg-white/95 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.15)] backdrop-blur-xl">
      <div className="relative overflow-hidden rounded-2xl rounded-b-none">
        <img
          src={img}
          alt="snowcity"
          className="h-60 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
        />
        {price > 0 ? (
          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/55 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
            <span>{formatCurrency(price)}</span>
            <span className="text-white/70 hidden sm:inline">{unit}</span>
            {hasSale ? (
              <span className="text-[11px] font-semibold text-emerald-300">-{discountPercent}%</span>
            ) : null}
          </div>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      </div>

      <div className="flex flex-col gap-4 px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Exclusive Offer</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900 line-clamp-2">{title}</h3>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-600">Limited</span>
        </div>

        {desc ? <p className="text-sm text-slate-500 line-clamp-3">{desc}</p> : null}

        {price > 0 ? (
          <div className="flex flex-wrap items-baseline gap-3 pt-2">
            <span className="text-2xl font-semibold text-slate-900">{formatCurrency(price)}</span>
            {hasSale ? (
              <>
                <span className="text-sm line-through text-slate-400">{formatCurrency(basePrice)}</span>
                <span className="rounded-full border border-emerald-200/70 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50">
                  Save {discountPercent}%
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-500">{unit}</span>
            )}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/offers"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            View Offer
            <span aria-hidden="true">→</span>
          </Link>
          {bookHref ? (
            <Link
              to={bookHref}
              className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-900 text-white px-5 py-2 text-sm font-semibold shadow-lg shadow-slate-900/15 hover:bg-black"
              title="Book with this offer"
            >
              🎟 Book Now
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}