// src/components/cms/RawFrame.jsx
import React from 'react';

export default function RawFrame({ title = 'page', html = '', css = '', js = '' }) {
  const srcDoc = React.useMemo(() => {
    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>${css || ''}</style>
  <title>${title || ''}</title>
</head>
<body>
${html || ''}
<script>${js || ''}<\/script>
</body>
</html>`;
  }, [html, css, js, title]);

  return (
    <iframe
      title={title}
      className="w-full min-h-[60vh] rounded-md border"
      sandbox="allow-scripts allow-same-origin"
      srcDoc={srcDoc}
    />
  );
}