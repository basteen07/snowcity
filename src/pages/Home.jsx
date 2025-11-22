import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { fetchBanners } from '../features/banners/bannersSlice';
import { fetchAttractions } from '../features/attractions/attractionsSlice';
import { fetchCombos } from '../features/combos/combosSlice';
import { fetchOffers } from '../features/offers/offersSlice';
import { fetchCoupons } from '../features/coupons/couponsSlice';
import { fetchAddons } from '../features/addons/addonsSlice';
import { fetchPages } from '../features/pages/pagesSlice';
import { fetchBlogs } from '../features/blogs/blogsSlice';
import { fetchGallery } from '../features/gallery/gallerySlice';

import HeroCarousel from '../components/hero/HeroCarousel';
import AttractionsCarousel from '../components/carousels/AttractionsCarousel';
import OffersCarousel from '../components/carousels/OffersCarousel';
import OffersMarquee from '../components/common/OffersMarquee';
import PlanVisitSection from '../components/common/PlanVisitSection';
import AddonsSection from '../components/common/AddonsSection';
import Testimonials from '../components/common/Testimonials';
import VideoBlock from '../components/common/VideoBlock';
import InstagramFeed from '../components/common/InstagramFeed';
import BlogCard from '../components/cards/BlogCard';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import LazyVisible from '../components/common/LazyVisible';
import { imgSrc } from '../utils/media';

// small helpers for localStorage caching
const CACHE_KEY = 'sc_home_cache_v1';
const loadCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const saveCache = (patch) => {
  try {
    const prev = loadCache() || {};
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...prev, ...patch, __ts: Date.now() }));
  } catch {}
};

// idle helper
const onIdle = (cb) => {
  if ('requestIdleCallback' in window) {
    // @ts-ignore
    return window.requestIdleCallback(cb, { timeout: 1500 });
  }
  return setTimeout(cb, 300);
};

export default function Home() {
  const dispatch = useDispatch();

  const banners = useSelector((s) => s.banners);
  const attractions = useSelector((s) => s.attractions);
  const combos = useSelector((s) => s.combos);
  const offers = useSelector((s) => s.offers);
  const coupons = useSelector((s) => s.coupons);
  const addons = useSelector((s) => s.addons);
  const pages = useSelector((s) => s.pages);
  const blogs = useSelector((s) => s.blogs);
  const gallery = useSelector((s) => s.gallery);

  // provide instant content from cache while Redux fetches in background
  const cacheRef = React.useRef(loadCache());

  // initial fetch (critical first), with conditions
  React.useEffect(() => {
    if (banners.status === 'idle') dispatch(fetchBanners());
    if (attractions.status === 'idle') dispatch(fetchAttractions());

    // prefetch lower-priority when idle
    const id = onIdle(() => {
      if (combos.status === 'idle') dispatch(fetchCombos());
      if (offers.status === 'idle') dispatch(fetchOffers());
      if (coupons.status === 'idle') dispatch(fetchCoupons({ active: true, limit: 100 }));
      if (addons.status === 'idle') dispatch(fetchAddons({ active: true, limit: 100 }));
      if (pages.status === 'idle') dispatch(fetchPages());
      if (blogs.status === 'idle') dispatch(fetchBlogs());
      if (gallery.status === 'idle') dispatch(fetchGallery({ active: true, limit: 50 }));
    });
    return () => (typeof id === 'number' ? clearTimeout(id) : window.cancelIdleCallback?.(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // hydrate cache when slices succeed (so next visits are instant)
  React.useEffect(() => {
    if (banners.items?.length) saveCache({ banners: banners.items });
  }, [banners.items]);
  React.useEffect(() => {
    if (attractions.items?.length) saveCache({ attractions: attractions.items });
  }, [attractions.items]);
  React.useEffect(() => {
    if (combos.items?.length) saveCache({ combos: combos.items });
  }, [combos.items]);
  React.useEffect(() => {
    if (offers.items?.length) saveCache({ offers: offers.items });
  }, [offers.items]);
  React.useEffect(() => {
    if (coupons.items?.length) saveCache({ coupons: coupons.items });
  }, [coupons.items]);
  React.useEffect(() => {
    if (addons.items?.length) saveCache({ addons: addons.items });
  }, [addons.items]);
  React.useEffect(() => {
    if (pages.items?.length) saveCache({ pages: pages.items });
  }, [pages.items]);
  React.useEffect(() => {
    if (blogs.items?.length) saveCache({ blogs: blogs.items });
  }, [blogs.items]);
  React.useEffect(() => {
    if (gallery.items?.length) saveCache({ gallery: gallery.items });
  }, [gallery.items]);

  // resolve “display” items (store first, else cached)
  const bannerItems = banners.items?.length ? banners.items : cacheRef.current.banners || [];
  const attractionItems = attractions.items?.length ? attractions.items : cacheRef.current.attractions || [];
  const comboItems = combos.items?.length ? combos.items : cacheRef.current.combos || [];
  const offerItems = offers.items?.length ? offers.items : cacheRef.current.offers || [];
  const couponItems = coupons.items?.length ? coupons.items : cacheRef.current.coupons || [];
  const addonItems = addons.items?.length ? addons.items : cacheRef.current.addons || [];
  const pageItems = pages.items?.length ? pages.items : cacheRef.current.pages || [];
  const blogItems = blogs.items?.length ? blogs.items : cacheRef.current.blogs || [];
  const galleryItems = gallery.items?.length ? gallery.items : cacheRef.current.gallery || [];
  const galleryPhotoItems = React.useMemo(
    () => (galleryItems || []).filter((item) => String(item.media_type || '').toLowerCase() !== 'video'),
    [galleryItems]
  );
  const featuredGalleryItem = galleryPhotoItems[0] || null;
  const featuredGalleryImage = featuredGalleryItem
    ? imgSrc(featuredGalleryItem.image_url || featuredGalleryItem.url)
    : 'https://picsum.photos/seed/snow-gallery/1280/720';
  const previewGalleryItems = React.useMemo(() => galleryPhotoItems.slice(0, 6), [galleryPhotoItems]);

  const marqueeItems = React.useMemo(() => {
    const entries = [];
    if (offerItems?.length) {
      offerItems.forEach((offer) => {
        const label = offer.name || offer.title || `Offer`;
        const discount = offer.discount_percent || offer.discountPercent;
        const short = offer.short_description || offer.subtitle || offer.description || '';
        const value = discount ? `Save ${discount}%` : offer.discount_value ? `Flat ₹${offer.discount_value} off` : '';
        entries.push([label, value, short].filter(Boolean).join(' • '));
      });
    }
    if (couponItems?.length) {
      couponItems.forEach((coupon) => {
        const code = (coupon.code || '').toString().toUpperCase();
        const type = String(coupon.type || '').toLowerCase();
        const value = Number(coupon.value || 0);
        const minAmount = Number(coupon.min_amount || coupon.minAmount || 0);
        const desc = coupon.description || '';
        const discountLabel = type === 'percent' && value > 0
          ? `Save ${value}%`
          : value > 0
          ? `Flat ₹${value} off`
          : '';
        const minText = minAmount > 0 ? `Min spend ₹${minAmount}` : '';
        entries.push([
          code ? `Coupon ${code}` : 'Coupon',
          discountLabel,
          minText,
          desc
        ].filter(Boolean).join(' • '));
      });
    }
    return entries;
  }, [offerItems, couponItems]);

  // brand gradient colors
  const arcticTop = "#0b1a33";      // deep arctic blue
  const arcticMid = "#123a63";      // mid icy blue
  const arcticBottom = "#eaf6ff";   // near-white icy

  return (
    <div className={`relative min-h-screen bg-gradient-to-b from-[${arcticTop}] via-[${arcticMid}] to-[${arcticBottom}]`}>
      {/* Hero (use cached if slice is still loading) */}
      {banners.status === 'failed' ? (
        <ErrorState message={banners.error?.message || 'Failed to load banners'} />
      ) : bannerItems.length ? (
        <HeroCarousel banners={bannerItems} waveColor={arcticTop} />
      ) : (
        <div className="min-h-[40vh] flex items-center justify-center"><Loader /></div>
      )}

      {/* Offers Marquee */}
      <LazyVisible minHeight={80} placeholder={<div className="py-3" /> }>
        {marqueeItems.length ? <OffersMarquee items={marqueeItems} /> : null}
      </LazyVisible>

      {/* Attractions (lazy mount, cached fallback) */}
      <LazyVisible minHeight={420} placeholder={<div className="py-8"><Loader /></div>}>
        {attractions.status === 'failed' ? (
          <ErrorState message={attractions.error?.message || 'Failed to load attractions'} />
        ) : attractionItems.length ? (
          <AttractionsCarousel items={attractionItems} />
        ) : (
          <div className="py-8"><Loader /></div>
        )}
      </LazyVisible>

      {/* Offers + Combos (lazy mount) */}
      <LazyVisible minHeight={420} placeholder={<div className="py-8"><Loader /></div>}>
        <OffersCarousel offers={offerItems} combos={comboItems} />
      </LazyVisible>

      {/* Add-ons */}
      <LazyVisible minHeight={420} placeholder={<div className="py-8"><Loader /></div>}>
        {addons.status === 'failed' ? (
          <ErrorState
            message={addons.error?.message || 'Failed to load add-ons'}
            onRetry={() => dispatch(fetchAddons({ active: true, limit: 100 }))}
          />
        ) : addonItems.length ? (
          <AddonsSection items={addonItems} />
        ) : (
          <Loader />
        )}
      </LazyVisible>

      {/* Testimonials (lazy) – keep compact placeholder to avoid big gaps */}
      <LazyVisible minHeight={320} placeholder={<div className="py-6" /> }>
        <Testimonials />
      </LazyVisible>

      {/* GALLERY */}
      <LazyVisible minHeight={420} placeholder={<div className="py-8"><Loader /></div>}>
        {gallery.status === 'failed' ? (
          <section id="gallery" className="py-16 px-4 bg-slate-900">
            <div className="max-w-6xl mx-auto">
              <ErrorState
                message={gallery.error?.message || 'Failed to load gallery'}
                onRetry={() => dispatch(fetchGallery({ active: true, limit: 50 }))}
              />
            </div>
          </section>
        ) : galleryPhotoItems.length ? (
          <section id="gallery" className="relative overflow-hidden bg-slate-900 py-16 px-4 text-white">
            <div className="absolute inset-0 opacity-10" aria-hidden="true">
              <div className="absolute top-10 left-10 text-7xl animate-pulse">❄️</div>
              <div className="absolute bottom-12 right-12 text-7xl animate-pulse delay-300">🎢</div>
            </div>
            <div className="relative z-10 mx-auto max-w-6xl">
              <div className="mb-12 text-center">
                <p className="text-xs font-semibold tracking-[0.4em] text-blue-200/80">GALLERY</p>
                <h2 className="mt-3 text-3xl font-bold">Experience the magic</h2>
                <p className="mt-3 text-sm text-white/70 max-w-2xl mx-auto">
                  A glimpse of visitors having the time of their lives inside SnowCity.
                </p>
              </div>

              <div className="relative mx-auto max-w-5xl">
                <div
                  className="relative aspect-video overflow-hidden rounded-2xl shadow-2xl"
                  style={{ backgroundImage: `url(${featuredGalleryImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/90 text-5xl text-slate-900 shadow-xl">
                        📸
                      </div>
                      <div className="text-2xl font-semibold">Gallery Highlights</div>
                      <div className="text-sm text-white/70 mt-1">Tap to explore memories</div>
                      <Link
                        to="/gallery"
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg hover:bg-yellow-300"
                      >
                        View Full Gallery →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                {previewGalleryItems.map((item, idx) => (
                  <div
                    key={`${item.id ?? item.media_id ?? idx}-${idx}`}
                    className="relative h-28 overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  >
                    <img
                      src={imgSrc(item.image_url || item.url)}
                      alt="snowcity"
                      className="h-full w-full object-cover"
                      loading={idx < 2 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                ))}
              </div>

              <div className="mt-12 grid grid-cols-2 gap-6 text-center text-white md:grid-cols-4">
                {[
                  { label: 'Photos Captured', value: `${galleryPhotoItems.length}+`, icon: '📷' },
                  { label: 'Events Covered', value: '120+', icon: '🎉' },
                  { label: 'Happy Families', value: '50K+', icon: '👨‍👩‍👧‍👦' },
                  { label: 'Unique Zones', value: '6+', icon: '❄️' },
                ].map((stat, index) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-4xl mb-2">{stat.icon}</div>
                    <div className="text-3xl font-bold text-yellow-300">{stat.value}</div>
                    <div className="mt-1 text-sm text-white/70">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section id="gallery" className="py-16 px-4 bg-slate-900">
            <div className="max-w-6xl mx-auto text-center">
              <Loader />
            </div>
          </section>
        )}
      </LazyVisible>

      {/* BLOGS */}
      <LazyVisible minHeight={420} placeholder={<div className="py-6"><Loader /></div>}>
        <section id="blogs" className="bg-white py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold tracking-[0.3em] text-blue-500/70">LATEST FROM OUR BLOG</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">Tips, guides & stories</h2>
              <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                Make the most of your SnowCity visit with insider recommendations, planning guides, and event highlights.
              </p>
            </div>

            {blogs.status === 'failed' ? (
              <ErrorState message={blogs.error?.message || 'Failed to load blogs'} />
            ) : blogItems.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogItems.slice(0, 3).map((blog) => (
                  <div key={blog.blog_id ?? blog.id ?? blog.slug} className="group">
                    <BlogCard item={blog} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center"><Loader /></div>
            )}

            <div className="mt-12 text-center">
              <Link
                to="/blogs"
                className="inline-flex items-center gap-2 rounded-full border-2 border-blue-600 px-6 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-600 hover:text-white"
              >
                View All Articles
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </LazyVisible>

      {/* Plan Your Visit */}
      <LazyVisible minHeight={320} placeholder={<div className="py-6" /> }>
        <PlanVisitSection />
      </LazyVisible>

      {/* Instagram (lazy) */}
      <LazyVisible minHeight={240} placeholder={<div className="py-6" /> }>
        <InstagramFeed />
      </LazyVisible>

      {/* Tiny shared CSS for remaining marquee animation */}
      <style>{`
        @keyframes scrollHalf {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee { animation: scrollHalf 18s linear infinite; }
        .marquee:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}