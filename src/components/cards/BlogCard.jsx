import React from 'react';
import { Link } from 'react-router-dom';
import { imgSrc } from '../../utils/media';

export default function BlogCard({ item }) {
  const title = item?.title || 'Blog';
  const img = imgSrc(item, 'https://picsum.photos/seed/blog/640/400');
  const slug = item?.slug || item?.id || '';
  const excerpt = item?.excerpt || item?.summary || '';
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden border">
      <div className="aspect-[4/3]">
        <img src={img} alt={title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-2">{title}</h3>
        {excerpt ? <p className="text-sm text-gray-600 line-clamp-2 mt-1">{excerpt}</p> : null}
        <div className="mt-3">
          <Link to={`/blogs/${slug}`} className="text-sm text-blue-600 hover:underline">Read more</Link>
        </div>
      </div>
    </div>
  );
}