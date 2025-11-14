import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBlogs } from '../features/blogs/blogsSlice';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { imgSrc } from '../utils/media';

const toBlogUrl = (blog) => {
  if (!blog) return '#';
  if (blog.slug) return `/blogs/${blog.slug}`;
  if (blog.blog_id || blog.id) return `/blogs/${blog.blog_id || blog.id}`;
  return '#';
};

export default function VisitorBlogs() {
  const dispatch = useDispatch();
  const blogs = useSelector((s) => s.blogs);

  React.useEffect(() => {
    if (blogs.status === 'idle') {
      dispatch(fetchBlogs({ active: true, limit: 12 }));
    }
  }, [dispatch, blogs.status]);

  const items = blogs.items || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <header className="mb-8">
        <p className="uppercase text-xs tracking-[0.3em] text-blue-500">Visitor stories</p>
        <h1 className="text-2xl md:text-3xl font-semibold mt-2">SnowCity blog articles</h1>
        <p className="text-gray-600 mt-3 max-w-3xl">
          Read tips, behind-the-scenes snippets, and guest experiences to help you make the most of your SnowCity visit.
        </p>
      </header>

      {blogs.status === 'loading' && !items.length ? <Loader /> : null}
      {blogs.status === 'failed' ? (
        <ErrorState
          message={blogs.error?.message || 'Failed to load blogs'}
          onRetry={() => dispatch(fetchBlogs({ active: true, limit: 12 }))}
        />
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((blog) => {
          const cover = imgSrc(blog);
          return (
            <Link
              key={blog.blog_id || blog.id || blog.slug}
              to={toBlogUrl(blog)}
              className="group overflow-hidden rounded-2xl border shadow-sm bg-white transition-transform hover:-translate-y-1"
            >
              {cover ? (
                <img
                  src={cover}
                  alt={blog.title || 'Blog'}
                  className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <div className="p-5">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {blog.title || 'Blog article'}
                </h2>
                {blog.author ? (
                  <p className="text-xs uppercase tracking-wide text-gray-400 mt-2">By {blog.author}</p>
                ) : null}
                {blog.short_description || blog.excerpt ? (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-3">
                    {blog.short_description || blog.excerpt}
                  </p>
                ) : null}
                <span className="mt-4 inline-flex items-center text-sm text-blue-600">
                  Keep reading →
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {!items.length && blogs.status === 'succeeded' ? (
        <div className="py-16 text-center text-gray-500">Fresh stories are coming soon. Check back later!</div>
      ) : null}
    </div>
  );
}
