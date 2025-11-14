import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGallery } from '../features/gallery/gallerySlice';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { imgSrc } from '../utils/media';

export default function Gallery() {
  const dispatch = useDispatch();
  const gallery = useSelector((s) => s.gallery);

  React.useEffect(() => {
    if (gallery.status === 'idle') {
      dispatch(fetchGallery({ active: true, limit: 100 }));
    }
  }, [dispatch, gallery.status]);

  const items = gallery.items || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Gallery</h1>
        <p className="text-gray-600 mt-2">Peek into the SnowCity experience with photos and short clips from our visitors.</p>
      </header>

      {gallery.status === 'loading' && !items.length ? <Loader /> : null}
      {gallery.status === 'failed' ? (
        <ErrorState
          message={gallery.error?.message || 'Failed to load gallery'}
          onRetry={() => dispatch(fetchGallery({ active: true, limit: 100 }))}
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => {
          const isVideo = String(item.media_type || '').toLowerCase() === 'video';
          const mediaUrl = isVideo
            ? imgSrc(item.media_url || item.url || item)
            : imgSrc(item.image_url || item.url || item);
          const posterUrl = imgSrc(item.thumbnail || item.poster_url || null);

          if (!mediaUrl) {
            return null;
          }

          return (
            <figure
              key={item.gallery_item_id || item.id}
              className="group relative overflow-hidden rounded-2xl border shadow-sm bg-white"
            >
              {isVideo ? (
                <video
                  className="w-full h-56 object-cover"
                  src={mediaUrl}
                  controls
                  preload="metadata"
                  poster={posterUrl || undefined}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt={item.title || 'Gallery item'}
                  className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              )}
              {(item.title || item.description) ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 text-sm text-white">
                  {item.title ? <div className="font-medium">{item.title}</div> : null}
                  {item.description ? <div className="text-xs opacity-80 mt-1">{item.description}</div> : null}
                </figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>

      {!items.length && gallery.status === 'succeeded' ? (
        <div className="py-16 text-center text-gray-500">We&apos;ll be adding gallery highlights soon!</div>
      ) : null}
    </div>
  );
}
