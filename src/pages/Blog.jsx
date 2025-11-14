import React from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { imgSrc } from '../utils/media';
import HtmlContent from '../components/cms/HtmlContent';
import RawFrame from '../components/cms/RawFrame';

export default function Blog() {
  const { slug } = useParams();
  const [st, setSt] = React.useState({ status: 'idle', data: null, error: null });

  React.useEffect(() => {
    if (!slug) return;
    const ac = new AbortController();
    (async () => {
      setSt({ status: 'loading', data: null, error: null });
      try {
        const res = await api.get(endpoints.blogs.bySlug(slug), { signal: ac.signal });
        const blog = res?.blog || res || null;
        setSt({ status: 'succeeded', data: blog, error: null });
      } catch (e) {
        setSt({ status: 'failed', data: null, error: e?.message || 'Failed to load blog' });
      }
    })();
    return () => ac.abort();
  }, [slug]);

  if (st.status === 'loading') return <Loader />;
  if (st.status === 'failed') return <ErrorState message={st.error} />;

  const b = st.data || {};
  const cover = imgSrc(b);
  const mode = (b.editor_mode || '').toLowerCase();
  const isRaw = mode === 'raw';
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">{b.title || 'Blog'}</h1>
      {b.author ? <div className="text-sm text-gray-500 mt-1">By {b.author}</div> : null}
      {cover ? (
        <div className="mt-4 rounded-xl overflow-hidden border">
          <img src={cover} alt={b.title} className="w-full h-auto object-cover" />
        </div>
      ) : null}
      <div className="mt-6">
        {isRaw ? (
          <RawFrame title={b.title || 'Blog'} html={b.raw_html || ''} css={b.raw_css || ''} js={b.raw_js || ''} />
        ) : (
          <HtmlContent html={b.content || ''} />
        )}
      </div>
    </div>
  );
}
