import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { fetchBanners } from '../features/banners/bannersSlice';
import { fetchAttractions } from '../features/attractions/attractionsSlice';
import { fetchCombos } from '../features/combos/combosSlice';
import { fetchOffers } from '../features/offers/offersSlice';
import { fetchPages } from '../features/pages/pagesSlice';
import { fetchBlogs } from '../features/blogs/blogsSlice';
import { fetchGallery } from '../features/gallery/gallerySlice';

import HeroCarousel from '../components/hero/HeroCarousel';
import AttractionsCarousel from '../components/carousels/AttractionsCarousel';
import OffersCarousel from '../components/carousels/OffersCarousel';
import Marquee from '../components/common/Marquee';
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
  const pageItems = pages.items?.length ? pages.items : cacheRef.current.pages || [];
  const blogItems = blogs.items?.length ? blogs.items : cacheRef.current.blogs || [];
  const galleryItems = gallery.items?.length ? gallery.items : cacheRef.current.gallery || [];

  const marqueeItems = React.useMemo(() => {
    const c = (comboItems || []).map((x) => x.name || x.title || 'Combo');
    const o = (offerItems || []).map((x) => x.name || x.title || 'Offer');
    return [...c, ...o];
  }, [comboItems, offerItems]);

  return (
    <div className="relative">
      {/* Hero (use cached if slice is still loading) */}
      {banners.status === 'failed' ? (
        <ErrorState message={banners.error?.message || 'Failed to load banners'} />
      ) : bannerItems.length ? (
        <HeroCarousel banners={bannerItems} />
      ) : (
        <div className="min-h-[40vh] flex items-center justify-center"><Loader /></div>
      )}

      {/* Attractions (lazy mount, cached fallback) */}
      <LazyVisible minHeight={420} placeholder={<div className="py-10"><Loader /></div>}>
        {attractions.status === 'failed' ? (
          <ErrorState message={attractions.error?.message || 'Failed to load attractions'} />
        ) : attractionItems.length ? (
          <AttractionsCarousel items={attractionItems} />
        ) : (
          <div className="py-10"><Loader /></div>
        )}
      </LazyVisible>

      {/* Offers + Combos (lazy mount) */}
      <LazyVisible minHeight={420} placeholder={<div className="py-10"><Loader /></div>}>
        <OffersCarousel offers={offerItems} combos={comboItems} />
      </LazyVisible>

      {/* Scrolling Marquee (lazy) */}
      {/* <LazyVisible minHeight={60}>
        {marqueeItems.length ? <Marquee items={marqueeItems} /> : null}
      </LazyVisible> */}

      {/* Testimonials (lazy) */}
      <LazyVisible minHeight={320} placeholder={<div className="py-8" /> }>
        <Testimonials />
      </LazyVisible>

      {/* Gallery (lazy, cached fallback) */}
      <LazyVisible minHeight={420} placeholder={<div className="py-10"><Loader /></div>}>
        <section className="py-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-semibold">Gallery</h2>
              <Link to="/gallery" className="text-sm text-blue-600 hover:underline">
                View more
              </Link>
            </div>
            {gallery.status === 'failed' ? (
              <ErrorState message={gallery.error?.message || 'Failed to load gallery'} onRetry={() => dispatch(fetchGallery({ active: true, limit: 50 }))} />
            ) : galleryItems.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {galleryItems.slice(0, 10).map((item) => {
                  const isVideo = String(item.media_type || '').toLowerCase() === 'video';
                  const mediaUrl = isVideo
                    ? imgSrc(item.media_url || item.url || item)
                    : imgSrc(item.image_url || item.url || item);
                  const posterUrl = imgSrc(item.thumbnail || item.poster_url || null);

                  if (!mediaUrl) return null;

                  return (
                    <div key={item.gallery_item_id || item.id} className="relative rounded-xl overflow-hidden border shadow-sm">
                      {isVideo ? (
                        <video
                          src={mediaUrl}
                          className="w-full h-full object-cover"
                          controls
                          muted
                          preload="metadata"
                          poster={posterUrl || undefined}
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={item.title || 'Gallery item'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      {item.title ? (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2 text-xs text-white">
                          {item.title}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Loader />
            )}
          </div>
        </section>
      </LazyVisible>

      {/* Video Block (lazy) */}
      <LazyVisible minHeight={360} placeholder={<div className="aspect-video w-full max-w-6xl mx-auto px-4 rounded-2xl bg-gray-200" /> }>
        <VideoBlock />
      </LazyVisible>

      {/* Recent Blogs (lazy, cached fallback) */}
      <LazyVisible minHeight={420} placeholder={<div className="py-10"><Loader /></div>}>
        <section className="py-10 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-semibold">From the blog</h2>
              <Link to="/blogs" className="text-sm text-blue-600 hover:underline">View all blogs</Link>
            </div>
            {blogs.status === 'failed' ? (
              <ErrorState message={blogs.error?.message || 'Failed to load blogs'} />
            ) : blogItems.length ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {blogItems.slice(0, 3).map((b) => (
                  <BlogCard key={b.id || b.slug} item={b} />
                ))}
              </div>
            ) : (
              <Loader />
            )}
          </div>
        </section>
      </LazyVisible>

      {/* Instagram (lazy) */}
      <LazyVisible minHeight={240} placeholder={<div className="py-6" /> }>
        <InstagramFeed />
      </LazyVisible>
    </div>
  );
}