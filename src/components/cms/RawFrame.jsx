// src/components/cms/RawFrame.jsx
import React from 'react';
import clsx from 'clsx';

export default function RawFrame({ title = 'page', html = '', css = '', js = '', className = '', style }) {
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
      className={clsx('w-full min-h-[60vh] border-0', className)}
      sandbox="allow-scripts allow-same-origin"
      style={style}
      srcDoc={srcDoc}
    />
  );
}