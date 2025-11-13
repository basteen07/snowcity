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

export default function Home() {
  const dispatch = useDispatch();
  const banners = useSelector((s) => s.banners);
  const attractions = useSelector((s) => s.attractions);
  const combos = useSelector((s) => s.combos);
  const offers = useSelector((s) => s.offers);
  const pages = useSelector((s) => s.pages);
  const blogs = useSelector((s) => s.blogs);
  const gallery = useSelector((s) => s.gallery);

  React.useEffect(() => {
    if (banners.status === 'idle') dispatch(fetchBanners());
    if (attractions.status === 'idle') dispatch(fetchAttractions());
    if (combos.status === 'idle') dispatch(fetchCombos());
    if (offers.status === 'idle') dispatch(fetchOffers());
    if (pages.status === 'idle') dispatch(fetchPages());
    if (blogs.status === 'idle') dispatch(fetchBlogs());
    if (gallery.status === 'idle') dispatch(fetchGallery({ active: true, limit: 50 }));
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const marqueeItems = [
    ...((combos.items || []).map((c) => c.name || c.title || 'Combo')),
    ...((offers.items || []).map((o) => o.name || o.title || 'Offer'))
  ];
  const blogsGrid = blogs.items || [];

  return (
    <div className="relative">
      {/* Hero + Floating Nav overlays it */}
      {banners.status === 'loading' && !banners.items.length ? <Loader /> : <HeroCarousel banners={banners.items} />}
      {banners.status === 'failed' ? <ErrorState message={banners.error?.message || 'Failed to load banners'} /> : null}

      {/* Attractions */}
      {attractions.status === 'loading' && !attractions.items.length ? <Loader /> : (
        <AttractionsCarousel items={attractions.items} />
      )}
      {attractions.status === 'failed' ? <ErrorState message={attractions.error?.message || 'Failed to load attractions'} /> : null}

      {/* Offers + Combos */}
      <OffersCarousel offers={offers.items} combos={combos.items} />

      {/* Scrolling Marquee */}
      {marqueeItems.length ? <Marquee items={marqueeItems} /> : null}

      {/* Testimonials */}
      <Testimonials />

      {/* Gallery strip */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-semibold">Gallery</h2>
            <Link to="/gallery" className="text-sm text-blue-600 hover:underline">
              View more
            </Link>
          </div>
          {gallery.status === 'loading' && !gallery.items.length ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {(gallery.items || []).slice(0, 10).map((item) => (
                <div key={item.gallery_item_id || item.id} className="relative rounded-xl overflow-hidden border shadow-sm">
                  {item.media_type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" controls muted preload="metadata" />
                  ) : (
                    <img src={item.url} alt={item.title || 'Gallery item'} className="w-full h-full object-cover" loading="lazy" />
                  )}
                  {item.title ? (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2 text-xs text-white">
                      {item.title}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {gallery.status === 'failed' ? <ErrorState message={gallery.error?.message || 'Failed to load gallery'} onRetry={() => dispatch(fetchGallery({ active: true, limit: 50 }))} /> : null}
        </div>
      </section>

      {/* Video Block */}
      <VideoBlock />

      {/* Recent Blogs */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-semibold">From the blog</h2>
            <a href="/blogs" className="text-sm text-blue-600 hover:underline">View all</a>
          </div>
          {blogs.status === 'loading' && !blogsGrid.length ? <Loader /> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {blogsGrid.slice(0, 3).map((b) => (
                <BlogCard key={b.id || b.slug} item={b} />
              ))}
            </div>
          )}
          {blogs.status === 'failed' ? <ErrorState message={blogs.error?.message || 'Failed to load blogs'} /> : null}
        </div>
      </section>

      {/* Instagram */}
      <InstagramFeed />
    </div>
  );
}