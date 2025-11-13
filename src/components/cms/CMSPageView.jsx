import React from 'react';
import { useParams } from 'react-router-dom';
import HtmlContent from '../components/cms/HtmlContent';

export default function CMSPageView() {
  const { slug } = useParams();
  const [page, setPage] = React.useState(null);
  const [err, setErr] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setErr('');
        setLoading(true);
        const res = await fetch(`/api/pages/slug/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (mounted) setPage(json);
      } catch (e) {
        if (mounted) setErr(e.message || 'Failed to load page');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  if (loading) return <div className="p-4 text-sm">Loading…</div>;
  if (err) return <div className="p-4 text-sm text-red-600">{err}</div>;
  if (!page) return null;

  return (
    <div className="max-w-5xl mx-auto p-4">
      {page.title ? <h1 className="text-2xl font-semibold mb-3">{page.title}</h1> : null}
      {page.editor_mode === 'raw' ? (
        <iframe
          title={page.title || 'Page'}
          className="w-full min-h-[60vh] rounded-md border"
          sandbox="allow-scripts allow-same-origin"
          srcDoc={`<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${page.raw_css || ''}</style><title>${page.meta_title || page.title || ''}</title></head><body>${page.raw_html || ''}<script>${page.raw_js || ''}<\/script></body></html>`}
        />
      ) : (
        <HtmlContent html={page.content || ''} />
      )}
    </div>
  );
}