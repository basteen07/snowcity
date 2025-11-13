import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchPages } from '../features/pages/pagesSlice';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';

const toSlugUrl = (page) => {
  if (!page) return '#';
  if (page.slug) return `/page/${page.slug}`;
  if (page.page_id || page.id) return `/page/${page.page_id || page.id}`;
  return '#';
};

export default function VisitorPages() {
  const dispatch = useDispatch();
  const pages = useSelector((s) => s.pages);

  React.useEffect(() => {
    if (pages.status === 'idle') {
      dispatch(fetchPages({ active: true, limit: 50 }));
    }
  }, [dispatch, pages.status]);

  const items = pages.items || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <header className="mb-8">
        <p className="uppercase text-xs tracking-[0.3em] text-blue-500">Visitor guide</p>
        <h1 className="text-2xl md:text-3xl font-semibold mt-2">Plan your SnowCity adventure</h1>
        <p className="text-gray-600 mt-3 max-w-3xl">
          Browse our visitor information pages to discover what to bring, how to book, safety tips, and everything else you need for a smooth experience.
        </p>
      </header>

      {pages.status === 'loading' && !items.length ? <Loader /> : null}
      {pages.status === 'failed' ? (
        <ErrorState
          message={pages.error?.message || 'Failed to load visitor pages'}
          onRetry={() => dispatch(fetchPages({ active: true, limit: 50 }))}
        />
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((page) => (
          <Link
            key={page.page_id || page.id || page.slug}
            to={toSlugUrl(page)}
            className="group relative overflow-hidden rounded-2xl border shadow-sm bg-white transition-transform hover:-translate-y-1"
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {page.title || page.name || 'Visitor Information'}
              </h2>
              {page.subtitle || page.short_description ? (
                <p className="text-sm text-gray-600 mt-2">
                  {page.subtitle || page.short_description}
                </p>
              ) : null}
              <span className="mt-4 inline-flex items-center text-sm text-blue-600">
                Read more →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {!items.length && pages.status === 'succeeded' ? (
        <div className="py-16 text-center text-gray-500">We&apos;ll be adding visitor information shortly.</div>
      ) : null}
    </div>
  );
}
