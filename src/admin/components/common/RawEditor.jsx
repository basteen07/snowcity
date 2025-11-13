import React from 'react';
import ImageUploader from './ImageUploader';

function buildHtmlDoc(html, css, js) {
  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>${css || ''}</style>
</head>
<body>
${html || ''}
<script>${js || ''}<\/script>
</body>
</html>`;
}

export default function RawEditor({ value = {}, onChange }) {
  const [html, setHtml] = React.useState(value.raw_html || '');
  const [css, setCss] = React.useState(value.raw_css || '');
  const [js, setJs] = React.useState(value.raw_js || '');
  const [srcDoc, setSrcDoc] = React.useState('');

  React.useEffect(() => { setHtml(value.raw_html || ''); setCss(value.raw_css || ''); setJs(value.raw_js || ''); }, [value.raw_html, value.raw_css, value.raw_js]);

  React.useEffect(() => {
    const doc = buildHtmlDoc(html, css, js);
    setSrcDoc(doc);
    onChange?.({ raw_html: html, raw_css: css, raw_js: js });
    // eslint-disable-next-line
  }, [html, css, js]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border dark:border-neutral-800 p-3">
        <div className="text-sm font-medium mb-2">Upload assets (images/videos) to use in your HTML/CSS</div>
        <ImageUploader label="Upload" onChange={(url) => { /* user can paste url into HTML/CSS */ }} />
        <div className="text-xs text-gray-500 mt-1">
          Tip: After uploading, copy the returned URL and reference it in &lt;img src="..."/&gt; or CSS backgrounds.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-lg border dark:border-neutral-800 p-2">
          <div className="text-xs font-medium mb-1">HTML</div>
          <textarea className="w-full h-64 rounded-md border px-2 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={html} onChange={(e) => setHtml(e.target.value)} placeholder="<div>Hello</div>" />
        </div>
        <div className="rounded-lg border dark:border-neutral-800 p-2">
          <div className="text-xs font-medium mb-1">CSS</div>
          <textarea className="w-full h-64 rounded-md border px-2 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={css} onChange={(e) => setCss(e.target.value)} placeholder="body { font-family: system-ui; }" />
        </div>
        <div className="rounded-lg border dark:border-neutral-800 p-2">
          <div className="text-xs font-medium mb-1">JS</div>
          <textarea className="w-full h-64 rounded-md border px-2 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={js} onChange={(e) => setJs(e.target.value)} placeholder="console.log('ready');" />
        </div>
      </div>

      <div className="rounded-lg border dark:border-neutral-800 p-2">
        <div className="text-sm font-medium mb-2">Live Preview</div>
        <iframe
          title="preview"
          className="w-full h-[360px] rounded-md border dark:border-neutral-800 bg-white"
          sandbox="allow-scripts allow-same-origin"
          srcDoc={srcDoc}
        />
      </div>
    </div>
  );
}