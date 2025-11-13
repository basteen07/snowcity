import React from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import HtmlContent from '../components/cms/HtmlContent';
import RawFrame from '../components/cms/RawFrame';

export default function CMSPage() {
  const { slug } = useParams();
  const [state, setState] = React.useState({ status: 'idle', page: null, error: null });

  React.useEffect(() => {
    if (!slug) return;
    const ac = new AbortController();
    (async () => {
      setState({ status: 'loading', page: null, error: null });
      try {
        const res = await api.get(endpoints.pages.bySlug(slug), { signal: ac.signal });
        const page = res?.page || res || null;
        setState({ status: 'succeeded', page, error: null });
      } catch (err) {
        setState({ status: 'failed', page: null, error: err?.message || 'Failed to load page' });
      }
    })();
    return () => ac.abort();
  }, [slug]);

  if (state.status === 'loading') return <Loader />;
  if (state.status === 'failed') return <ErrorState message={state.error} />;

  const p = state.page || {};
  const mode = (p.editor_mode || '').toLowerCase();
  const title = p.title || p.name || 'Page';
  const isRaw = mode === 'raw';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-3">{title}</h1>
      {isRaw ? (
        <RawFrame title={title} html={p.raw_html || ''} css={p.raw_css || ''} js={p.raw_js || ''} />
      ) : p.content_html ? (
        <HtmlContent html={p.content_html} />
      ) : p.content ? (
        <HtmlContent html={p.content} />
      ) : (
        <p className="text-gray-600">No content available.</p>
      )}
    </div>
  );
}