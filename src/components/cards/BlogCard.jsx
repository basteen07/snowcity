import React from 'react';
import { Link } from 'react-router-dom';
import { imgSrc } from '../../utils/media';

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

export default function BlogCard({ item }) {
  const title = item?.title || 'Blog';
  const img = imgSrc(item, 'https://picsum.photos/seed/blog/640/400');
  const slug = item?.slug || item?.id || '';
  const excerpt = item?.excerpt || item?.summary || '';
  const category = item?.category || item?.tag || 'SnowCity';
  const date = item?.published_at || item?.date || '';
  const readTime = item?.read_time || item?.readTime || '';

  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-gray-100">
      <div className="relative h-48 overflow-hidden">
        <img
          src={img}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {category}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          {date ? (
            <div className="flex items-center gap-1">
              <CalendarIcon />
              <span>{date}</span>
            </div>
          ) : null}
          {readTime ? (
            <div className="flex items-center gap-1">
              <ClockIcon />
              <span>{readTime}</span>
            </div>
          ) : null}
        </div>

        <h3 className="text-xl text-slate-900 mb-3 line-clamp-2">{title}</h3>

        {excerpt ? <p className="text-gray-600 mb-4 line-clamp-3">{excerpt}</p> : null}

        <div className="mt-auto">
          <Link
            to={`/blogs/${slug}`}
            className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
          >
            Read More
            <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}