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
    hasBase && price > 0
      ? Math.max(0, Math.round((1 - price / baseSum) * 100))
      : Number(item?.discount_percent || 0);

  const numericComboId = item?.combo_id || item?.id || null;
  const bookHref = numericComboId ? `/booking?combo_id=${numericComboId}` : '/booking';

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden border">
      <div className="relative aspect-[4/3] bg-gray-100">
        <div className="grid grid-cols-2 h-full gap-0.5 md:gap-1">
          {[left, right].map((attr, idx) => {
            const isLink = Boolean(attr.href);
            const className = 'relative block h-full w-full overflow-hidden group';

            const content = (
              <>
                <img
                  src={attr.image_url}
                  alt={attr.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
                  <p className="text-[10px] uppercase tracking-wide text-gray-200">
                    {idx === 0 ? 'Experience 1' : 'Experience 2'}
                  </p>
                  <h4 className="text-sm md:text-base font-semibold text-white leading-tight line-clamp-2">
                    {attr.title}
                  </h4>
                </div>
              </>
            );

            return isLink ? (
              <Link key={`img-${idx}`} className={className} to={attr.href}>
                {content}
              </Link>
            ) : (
              <div key={`img-${idx}`} className={className}>
                {content}
              </div>
            );
          })}
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/90 text-indigo-700 font-bold shadow border flex items-center justify-center">
            +
          </span>
        </div>
        <span className="absolute top-2 left-2 text-[10px] md:text-xs text-white bg-emerald-600 px-2 py-1 rounded-full">
          Combo
        </span>

        {price > 0 ? (
          <div className="absolute bottom-2 left-2 rounded-full bg-black/70 text-white px-3 py-1 text-xs md:text-sm">
            <span className="font-semibold">{formatCurrency(price)}</span>
            <span className="opacity-80"> per combo</span>
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-1">{title}</h3>
        {desc ? <p className="text-sm text-gray-600 line-clamp-2 mt-1">{desc}</p> : null}

        <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
          <span>{left.title}</span>
          <span>+</span>
          <span>{right.title}</span>
        </div>

        {hasBase ? (
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-sm line-through text-gray-400">{formatCurrency(baseSum)}</div>
            <div className="text-sm text-green-700 font-medium">
              {discountPercent > 0 ? `Save ${discountPercent}%` : 'Combo pricing'}
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-3">
          <Link
            to={comboId ? `/combos/${comboId}` : '/combos'}
            className="text-sm text-blue-600 hover:underline"
          >
            View Combo
          </Link>
          <Link
            to={bookHref}
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
            title="Book this combo"
          >
            Book Now
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-blue-600">
          {left.href ? (
            <Link to={left.href} className="hover:underline">
              View {left.title}
            </Link>
          ) : null}
          {right.href ? (
            <Link to={right.href} className="hover:underline">
              View {right.title}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}