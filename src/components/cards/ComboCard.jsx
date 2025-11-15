import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { getPrice } from '../../utils/pricing';
import { imgSrc } from '../../utils/media';

const IMAGE_PLACEHOLDER = (seed = 'combo') => `https://picsum.photos/seed/${seed}/640/400`;

const pickImage = (src, seed = 'combo') =>
  imgSrc(typeof src === 'string' && src ? src : IMAGE_PLACEHOLDER(seed));

const normalizeAttraction = (raw, fallbackTitle = 'Attraction', seed = 'combo-attraction') => {
  if (!raw || typeof raw !== 'object') {
    return {
      title: fallbackTitle,
      image_url: IMAGE_PLACEHOLDER(seed),
      slug: null,
      price: 0,
      href: null,
    };
  }

  const title = raw.title || raw.name || fallbackTitle;
  const slug = raw.slug || raw.id || raw.attraction_id || null;
  const price = Number(raw.base_price || raw.price || raw.amount || 0);
  const image = pickImage(raw.image_url || raw.cover_image || raw.image, seed);

  return {
    title,
    image_url: image,
    slug,
    price,
    href: slug ? `/attractions/${slug}` : null,
  };
};

export default function ComboCard({ item }) {
  const title = item?.name || item?.title || 'Combo deal';
  const desc = item?.short_description || item?.subtitle || '';
  const comboId = item?.combo_id || item?.id || item?.slug || null;

  const leftSeed = comboId
    ? `combo-${comboId}-left`
    : `combo-left-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const rightSeed = comboId
    ? `combo-${comboId}-right`
    : `combo-right-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const left = normalizeAttraction(
    item?.attraction_1 || {
      title: item?.attraction_1_title,
      image_url: item?.attraction_1_image,
      slug: item?.attraction_1_slug,
      base_price: item?.attraction_1_price,
    },
    'Experience A',
    leftSeed
  );

  const right = normalizeAttraction(
    item?.attraction_2 || {
      title: item?.attraction_2_title,
      image_url: item?.attraction_2_image,
      slug: item?.attraction_2_slug,
      base_price: item?.attraction_2_price,
    },
    'Experience B',
    rightSeed
  );

  const price = getPrice(item);
  const baseSum =
    Number(item?.attraction_1_price || 0) + Number(item?.attraction_2_price || 0);
  const hasBase = baseSum > 0;
  const discountPercent =
    hasBase && price > 0 ? Math.max(0, Math.round((1 - price / baseSum) * 100))
      : Number(item?.discount_percent || 0);

  const numericComboId = item?.combo_id || item?.id || null;
  const bookHref = numericComboId ? `/booking?combo_id=${numericComboId}` : '/booking';

  return (
    <div
      className="
        bg-white/95 backdrop-blur-md
        rounded-2xl border border-white/40
        shadow-[0_6px_20px_rgba(0,0,0,0.15)]
        hover:shadow-[0_12px_30px_rgba(0,0,0,0.25)]
        transition-all duration-500
        overflow-hidden relative
      "
    >
      <div className="relative aspect-[4/3] bg-gray-100 rounded-t-2xl overflow-hidden">

        <div className="grid grid-cols-2 h-full gap-0.5 md:gap-1">

          {/* LEFT IMAGE — unchanged logic, premium UI */}
          <div className="relative h-full w-full overflow-hidden group animate-left-in">
            <img
              src={left.image_url}
              alt={left.title}
              className="
                h-full w-full object-cover
                transition-transform duration-500
                group-hover:scale-[1.08]
                group-hover:brightness-110
              "
              loading="lazy"
            />
            <div className="
              absolute inset-x-0 bottom-0 
              bg-gradient-to-t from-black/75 via-black/20 to-transparent
              p-3 backdrop-blur-[2px]
            ">
              <p className="text-[11px] tracking-wide text-gray-200">Experience 1</p>
              <h4 className="text-sm font-semibold text-white leading-tight line-clamp-2">
                {left.title}
              </h4>
            </div>
          </div>

          {/* RIGHT IMAGE — unchanged logic */}
          <div className="relative h-full w-full overflow-hidden group animate-right-in">
            <img
              src={right.image_url}
              alt={right.title}
              className="
                h-full w-full object-cover
                transition-transform duration-500
                group-hover:scale-[1.08]
                group-hover:brightness-110
              "
              loading="lazy"
            />
            <div className="
              absolute inset-x-0 bottom-0 
              bg-gradient-to-t from-black/75 via-black/20 to-transparent
              p-3 backdrop-blur-[2px]
            ">
              <p className="text-[11px] tracking-wide text-gray-200">Experience 2</p>
              <h4 className="text-sm font-semibold text-white leading-tight line-clamp-2">
                {right.title}
              </h4>
            </div>
          </div>
        </div>

        {/* Plus icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="
              h-10 w-10 rounded-full bg-white/90 text-indigo-700
              text-lg font-bold shadow border flex items-center justify-center
            "
          >
            +
          </span>
        </div>

        {/* Combo tag */}
        <span
          className="
            absolute top-2 left-2 px-2 py-1
            bg-emerald-600 text-white text-[11px] rounded-full shadow
          "
        >
          Combo
        </span>

        {/* Price */}
        {price > 0 && (
          <div
            className="
              absolute bottom-2 left-2 px-3 py-1
              rounded-full bg-black/70 backdrop-blur-md
              text-white text-xs shadow
            "
          >
            <span className="font-semibold">{formatCurrency(price)}</span>
            <span className="opacity-80"> per combo</span>
          </div>
        )}
      </div>

      {/* CONTENT SECTION */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1 tracking-tight">
          {title}
        </h3>

        {desc ? <p className="text-sm text-gray-600 mt-1 line-clamp-2">{desc}</p> : null}

        <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
          <span>{left.title}</span>
          <span>+</span>
          <span>{right.title}</span>
        </div>

        {hasBase && (
          <div className="mt-2 flex items-baseline gap-2 text-sm">
            <div className="line-through text-gray-400">{formatCurrency(baseSum)}</div>
            <div className="text-green-700 font-semibold">
              {discountPercent > 0 ? `Save ${discountPercent}%` : 'Combo pricing'}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-3 flex items-center gap-3">
          <Link
            to={comboId ? `/combos/${comboId}` : '/combos'}
            className="text-sm text-blue-600 font-medium hover:text-blue-800 transition"
          >
            View Combo →
          </Link>

          <Link
            to={bookHref}
            className="
              inline-flex items-center rounded-full
              bg-blue-600 px-4 py-2 text-white text-sm
              hover:bg-blue-700 active:scale-95 transition-all shadow-sm
            "
          >
            Book Now
          </Link>
        </div>

        {/* Extra links */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-blue-600 font-medium">
          {left.href ? (
            <Link to={left.href} className="hover:underline">View {left.title}</Link>
          ) : null}
          {right.href ? (
            <Link to={right.href} className="hover:underline">View {right.title}</Link>
          ) : null}
        </div>
      </div>

      {/* ANIMATIONS — DO NOT TOUCH LOGIC */}
      <style>{`
        @keyframes leftFullIn {
          0% { opacity: 0; transform: translateX(-120vw) rotate(-45deg); }
          80% { opacity: 1; transform: translateX(12px) rotate(-5deg); }
          100% { opacity: 1; transform: translateX(0) rotate(0deg); }
        }
        .animate-left-in {
          animation: leftFullIn 1s cubic-bezier(.18,.89,.32,1.28) forwards;
        }

        @keyframes rightFullIn {
          0% { opacity: 0; transform: translateX(120vw) rotate(45deg); }
          80% { opacity: 1; transform: translateX(-12px) rotate(5deg); }
          100% { opacity: 1; transform: translateX(0) rotate(0deg); }
        }
        .animate-right-in {
          animation: rightFullIn 1s cubic-bezier(.18,.89,.32,1.28) forwards;
        }
      `}</style>
    </div>
  );
}
